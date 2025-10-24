# Bot Implementation Guide: Processing Zaps for Account Charging

## Overview

This document explains how the ZAI bot should process Lightning zaps to automatically charge user accounts. The system uses Nostr's NIP-57 (Lightning Zaps) protocol.

## How Zap Processing Works

### 1. Understanding Zap Flow

When a user sends a zap to charge their account:

```
User → Lightning Payment → Zap Receipt (kind 9735) published to Nostr → Bot detects zap → Credits user account
```

### 2. Zap Receipt Structure (kind 9735)

A zap receipt contains all the information needed to identify the sender and amount:

```json
{
  "kind": 9735,
  "pubkey": "bot_or_relay_pubkey",
  "content": "",
  "created_at": 1234567890,
  "tags": [
    ["p", "618be242c2e25d3e1b86e5ecabf32929a7c24d6cd2a797e8292a1f6252cb702e"],  // Bot's pubkey
    ["bolt11", "lnbc50n1..."],  // Lightning invoice
    ["description", "{\"kind\":9734,\"pubkey\":\"sender_pubkey_here\",\"content\":\"Great bot!\",\"tags\":[[\"p\",\"bot_pubkey\"],[\"amount\",\"5000\"],[\"relays\",[\"wss://relay.nostr.band\"]]],\"created_at\":1234567890}"]
  ],
  "id": "...",
  "sig": "..."
}
```

### 3. Extracting Sender Information

The **critical information** is in the `description` tag, which contains the original **Zap Request (kind 9734)** as a JSON string:

```typescript
// Parse the zap receipt
const descriptionTag = zapReceipt.tags.find(([name]) => name === 'description')?.[1];

if (descriptionTag) {
  // Parse the zap request
  const zapRequest = JSON.parse(descriptionTag);
  
  // Extract sender's pubkey
  const senderPubkey = zapRequest.pubkey;
  
  // Extract amount in millisatoshis
  const amountTag = zapRequest.tags.find(([name]) => name === 'amount')?.[1];
  const millisats = parseInt(amountTag);
  const sats = Math.floor(millisats / 1000);
  
  // Extract optional comment
  const comment = zapRequest.content || '';
  
  // Now you know WHO sent HOW MUCH!
  console.log(`${senderPubkey} sent ${sats} sats with comment: "${comment}"`);
}
```

### 4. Alternative: Extract Amount from bolt11

If the `amount` tag is not present in the zap request, you can decode the bolt11 invoice:

```typescript
import { nip57 } from 'nostr-tools';

const bolt11Tag = zapReceipt.tags.find(([name]) => name === 'bolt11')?.[1];
if (bolt11Tag) {
  const sats = nip57.getSatoshisAmountFromBolt11(bolt11Tag);
  console.log(`Amount: ${sats} sats`);
}
```

## Bot Implementation Steps

### Step 1: Listen for Zap Receipts

The bot should continuously query for new zap receipts:

```typescript
// Query for zap receipts sent to the bot
const zapReceipts = await nostr.query([
  {
    kinds: [9735],
    '#p': [BOT_PUBKEY],
    since: lastCheckedTimestamp,
    limit: 100
  }
]);
```

### Step 2: Process Each Zap Receipt

For each zap receipt:

1. Extract the `description` tag
2. Parse it as JSON to get the zap request
3. Extract sender pubkey from `zapRequest.pubkey`
4. Extract amount from `zapRequest.tags` (amount tag) or from bolt11
5. Store the transaction in your database
6. Credit the user's account

```typescript
interface Transaction {
  zapId: string;           // Zap receipt event ID
  senderPubkey: string;    // Who sent the zap
  amount: number;          // Amount in sats
  timestamp: number;       // When it was received
  comment: string;         // Optional message
}

function processZapReceipt(zapReceipt: NostrEvent): Transaction | null {
  // Extract bolt11
  const bolt11Tag = zapReceipt.tags.find(([name]) => name === 'bolt11')?.[1];
  if (!bolt11Tag) return null;

  // Extract and parse description
  const descriptionTag = zapReceipt.tags.find(([name]) => name === 'description')?.[1];
  if (!descriptionTag) return null;

  let zapRequest;
  try {
    zapRequest = JSON.parse(descriptionTag);
  } catch (error) {
    console.error('Failed to parse zap request:', error);
    return null;
  }

  // Extract sender pubkey
  const senderPubkey = zapRequest.pubkey;
  if (!senderPubkey) return null;

  // Extract amount
  let amount = 0;
  const amountTag = zapRequest.tags?.find(([name]: string[]) => name === 'amount')?.[1];
  if (amountTag) {
    amount = Math.floor(parseInt(amountTag) / 1000);
  } else {
    // Fallback: decode from bolt11
    amount = nip57.getSatoshisAmountFromBolt11(bolt11Tag);
  }

  // Extract comment
  const comment = zapRequest.content || '';

  return {
    zapId: zapReceipt.id,
    senderPubkey,
    amount,
    timestamp: zapReceipt.created_at,
    comment,
  };
}
```

### Step 3: Store Transactions in Database

Store each processed zap in your database:

```typescript
// Example database schema
interface UserAccount {
  pubkey: string;
  totalSats: number;
  transactions: Transaction[];
}

// Add transaction to user account
function creditUserAccount(senderPubkey: string, transaction: Transaction) {
  // Get or create user account
  let account = database.getAccount(senderPubkey) || {
    pubkey: senderPubkey,
    totalSats: 0,
    transactions: []
  };

  // Add transaction
  account.transactions.push(transaction);
  account.totalSats += transaction.amount;

  // Save to database
  database.saveAccount(account);

  console.log(`Credited ${transaction.amount} sats to ${senderPubkey}`);
}
```

### Step 4: Respond to Balance Queries

When a user sends a kind 1006 balance request:

```typescript
// User sends this:
{
  "kind": 1006,
  "content": "",
  "tags": [["balance"]],
  "created_at": 1234567890,
  "pubkey": "user_pubkey"
}

// Bot should respond with encrypted DM (kind 4):
const userAccount = database.getAccount(userPubkey);
const balanceData = {
  pubkey: userPubkey,
  totalSats: userAccount.totalSats,
  totalBTC: (userAccount.totalSats * 0.00000001).toFixed(8),
  zapCount: userAccount.transactions.length,
  transactions: userAccount.transactions
};

// Encrypt and send as DM
const encrypted = await nip04.encrypt(userPubkey, JSON.stringify(balanceData));
await nostr.event({
  kind: 4,
  content: encrypted,
  tags: [['p', userPubkey]],
  created_at: Math.floor(Date.now() / 1000)
});
```

## Testing the Implementation

### Test Case 1: Send a Test Zap

1. User logs in to ZAI chat client
2. User goes to `/wallet` page
3. User clicks "Send a Zap" and sends 100 sats to the bot
4. Zap receipt (kind 9735) should be published to Nostr within seconds
5. Bot should detect the zap receipt
6. Bot should extract sender pubkey and amount
7. Bot should credit the user's account
8. When user clicks "Refresh balance", they should see 100 sats

### Test Case 2: Verify Transaction History

1. After sending multiple zaps, user should see all transactions in the wallet page
2. Each transaction should show:
   - Sender avatar and name
   - Amount in sats
   - Timestamp
   - Optional comment

### Test Case 3: Multiple Users

1. Different users send zaps to the bot
2. Each user's balance should be tracked separately
3. When each user queries their balance, they should only see their own transactions

## Security Considerations

### 1. Verify Zap Receipt Authenticity

Always verify that the zap receipt signature is valid:

```typescript
import { verifyEvent } from 'nostr-tools';

if (!verifyEvent(zapReceipt)) {
  console.error('Invalid zap receipt signature!');
  return;
}
```

### 2. Prevent Double-Spending

Store processed zap receipt IDs to prevent processing the same zap twice:

```typescript
const processedZaps = new Set<string>();

function processZapReceipt(zapReceipt: NostrEvent) {
  if (processedZaps.has(zapReceipt.id)) {
    console.log('Zap already processed:', zapReceipt.id);
    return;
  }

  // Process the zap...
  
  // Mark as processed
  processedZaps.add(zapReceipt.id);
  database.saveProcessedZapId(zapReceipt.id);
}
```

### 3. Amount Validation

Validate that the amount is reasonable:

```typescript
const MIN_ZAP = 1;        // Minimum 1 sat
const MAX_ZAP = 1000000;  // Maximum 1M sats

if (amount < MIN_ZAP || amount > MAX_ZAP) {
  console.error('Invalid zap amount:', amount);
  return;
}
```

## Client-Side Implementation

The client (ZAI chat app) already has the complete implementation:

### Hook: `useReceivedZaps`

Located in `/src/hooks/useReceivedZaps.ts`, this hook:
- Queries all zap receipts sent to the bot
- Extracts sender information from description tags
- Calculates totals and statistics
- Returns processed zap data

### Component: `ZapItem`

Located in `/src/components/ZapItem.tsx`, this component:
- Displays sender avatar and name
- Shows zap amount and timestamp
- Displays optional comment
- Shows transaction details

### Page: `Wallet`

Located in `/src/pages/Wallet.tsx`, this page:
- Shows user's balance from bot
- Displays statistics (total zaps, total sats, unique senders)
- Lists all received zaps with full details
- Allows users to send new zaps to charge their account

## Summary

**Key Points:**

1. ✅ Zap receipts (kind 9735) contain sender pubkey in the `description` tag
2. ✅ The description tag contains the original zap request (kind 9734) as JSON
3. ✅ Extract `zapRequest.pubkey` to identify WHO sent the zap
4. ✅ Extract amount from `zapRequest.tags` (amount tag) or decode bolt11
5. ✅ Store transactions in database linked to sender pubkey
6. ✅ Respond to balance queries (kind 1006) with encrypted account data
7. ✅ Client displays all zaps with sender information automatically

The system is now complete and ready for production use! 🚀
