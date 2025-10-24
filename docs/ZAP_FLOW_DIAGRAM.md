# Zap Flow Visualization

## Complete Zap Flow for Account Charging

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ZAI Account Charging Flow                       │
└─────────────────────────────────────────────────────────────────────────┘

Step 1: User Wants to Charge Account
┌──────────────┐
│  Alice       │  pubkey: alice123...
│  (Logged in) │  Current Balance: 0 sats
└──────────────┘
       │
       │ Clicks "Send a Zap" on Wallet page
       │ Enters: 1000 sats
       ↓

Step 2: Zap Request Created (kind 9734)
┌─────────────────────────────────────────┐
│  Zap Request (NOT published to relays)  │
├─────────────────────────────────────────┤
│  kind: 9734                             │
│  pubkey: alice123...  ← Alice is sender!│
│  content: "Charging my account"         │
│  tags: [                                │
│    ["p", "bot456..."],   ← Bot is receiver
│    ["amount", "1000000"], ← millisats   │
│    ["relays", ["wss://relay.nostr.band"]]
│  ]                                      │
└─────────────────────────────────────────┘
       │
       │ Sent to Lightning Service (LNURL)
       ↓

Step 3: Lightning Payment
┌──────────────┐         ┌────────────────┐
│   Alice      │ -----→  │ Lightning      │
│   Pays 1000  │  Pay    │ Network        │
│   sats       │         │                │
└──────────────┘         └────────────────┘
                                │
                                │ Payment confirmed
                                ↓

Step 4: Zap Receipt Published (kind 9735)
┌─────────────────────────────────────────────────────────────────┐
│  Zap Receipt (Published to Nostr relays)                        │
├─────────────────────────────────────────────────────────────────┤
│  kind: 9735                                                     │
│  pubkey: bot456... or relay_pubkey  ← NOT the sender!          │
│  content: ""                                                    │
│  tags: [                                                        │
│    ["p", "bot456..."],          ← Bot's pubkey                  │
│    ["bolt11", "lnbc1000..."],   ← Lightning invoice            │
│    ["description", "{           ← CONTAINS THE ZAP REQUEST!    │
│       \"kind\": 9734,                                           │
│       \"pubkey\": \"alice123...\",  ← Alice is the sender!      │
│       \"content\": \"Charging my account\",                     │
│       \"tags\": [                                               │
│         [\"p\", \"bot456...\"],                                 │
│         [\"amount\", \"1000000\"]                               │
│       ]                                                         │
│    }"]                                                          │
│  ]                                                              │
└─────────────────────────────────────────────────────────────────┘
       │
       │ Bot queries for zap receipts
       ↓

Step 5: Bot Processes Zap Receipt
┌──────────────────────────────────────┐
│  Bot Extracts Information            │
├──────────────────────────────────────┤
│  1. Find description tag             │
│  2. Parse JSON (zap request)         │
│  3. sender = zapRequest.pubkey       │
│     → "alice123..."                  │
│  4. amount = zapRequest.tags.amount  │
│     → 1000000 ms = 1000 sats         │
│  5. comment = zapRequest.content     │
│     → "Charging my account"          │
└──────────────────────────────────────┘
       │
       │ Credits Alice's account
       ↓

Step 6: Account Updated
┌──────────────┐
│  Alice       │  pubkey: alice123...
│  (Logged in) │  New Balance: 1000 sats ✅
└──────────────┘
       │
       │ Requests balance (kind 1006)
       ↓

Step 7: Bot Responds with Balance
┌─────────────────────────────────────────┐
│  Encrypted DM (kind 4)                  │
├─────────────────────────────────────────┤
│  from: bot456...                        │
│  to: alice123...                        │
│  content: encrypted({                   │
│    pubkey: "alice123...",               │
│    totalSats: 1000,                     │
│    zapCount: 1,                         │
│    transactions: [{                     │
│      zapId: "receipt_id",               │
│      senderPubkey: "alice123...",       │
│      amount: 1000,                      │
│      timestamp: 1234567890,             │
│      comment: "Charging my account"     │
│    }]                                   │
│  })                                     │
└─────────────────────────────────────────┘
       │
       │ Alice decrypts and sees her balance
       ↓

Step 8: Wallet Page Display
┌────────────────────────────────────────┐
│  💰 Wallet                             │
├────────────────────────────────────────┤
│  Current Balance: 1,000 sats           │
│                                        │
│  Payment History:                      │
│  ┌──────────────────────────────────┐ │
│  │ 👤 Alice                         │ │
│  │ Charged account • Just now       │ │
│  │ ⚡ 1,000 sats                    │ │
│  │ 💬 "Charging my account"         │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

## Key Points

1. ✅ **Sender = User who pays** (Alice)
   - Found in: `zapRequest.pubkey` (inside description tag)

2. ✅ **Receiver = Bot** (Bot)
   - Found in: `zapReceipt.tags['p']`

3. ❌ **Common Mistake:**
   - `zapReceipt.pubkey` is NOT the sender!
   - It's usually the bot's pubkey or relay's pubkey

4. ✅ **Correct Extraction:**
   ```typescript
   const descriptionTag = zapReceipt.tags.find(([name]) => name === 'description')?.[1];
   const zapRequest = JSON.parse(descriptionTag);
   const sender = zapRequest.pubkey; // ← This is the user who paid!
   ```

## Multiple Users Example

```
User A sends 500 sats  → Bot credits User A: 500 sats
User B sends 1000 sats → Bot credits User B: 1000 sats  
User A sends 200 sats  → Bot credits User A: 700 sats total

User A balance: 700 sats (2 transactions)
User B balance: 1000 sats (1 transaction)
```

Each user's zaps are tracked separately by their pubkey!
