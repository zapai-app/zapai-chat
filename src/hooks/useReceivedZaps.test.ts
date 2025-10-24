import { describe, it, expect } from 'vitest';

describe('Zap Receipt Processing Logic', () => {
  it('should extract sender pubkey from zap request in description tag', () => {
    // Mock zap receipt structure (this is what comes from Nostr)
    const zapReceipt = {
      kind: 9735,
      pubkey: 'bot_or_relay_pubkey_here', // This is NOT the sender!
      content: '',
      created_at: 1234567890,
      tags: [
        ['p', '618be242c2e25d3e1b86e5ecabf32929a7c24d6cd2a797e8292a1f6252cb702e'], // Bot's pubkey
        ['bolt11', 'lnbc50n1...'],
        [
          'description',
          JSON.stringify({
            kind: 9734,
            pubkey: 'user_pubkey_who_sent_the_zap', // ← THIS is the sender!
            content: 'Great bot!',
            tags: [
              ['p', '618be242c2e25d3e1b86e5ecabf32929a7c24d6cd2a797e8292a1f6252cb702e'],
              ['amount', '5000'],
              ['relays', ['wss://relay.nostr.band']]
            ],
            created_at: 1234567890
          })
        ]
      ],
      id: 'receipt_id_here',
      sig: 'signature_here'
    };

    // Extract description tag
    const descriptionTag = zapReceipt.tags.find(([name]) => name === 'description')?.[1];
    expect(descriptionTag).toBeDefined();

    // Parse zap request
    const zapRequest = JSON.parse(descriptionTag!);
    
    // The sender is in zapRequest.pubkey, NOT zapReceipt.pubkey
    const senderPubkey = zapRequest.pubkey;
    
    expect(senderPubkey).toBe('user_pubkey_who_sent_the_zap');
    expect(senderPubkey).not.toBe('bot_or_relay_pubkey_here');
    
    console.log('✅ Correct: Sender is extracted from zapRequest.pubkey, not zapReceipt.pubkey');
  });

  it('should extract amount from zap request tags', () => {
    const zapRequestInDescription = {
      kind: 9734,
      pubkey: 'user_pubkey_here',
      content: '',
      tags: [
        ['p', 'bot_pubkey'],
        ['amount', '5000'], // 5000 millisats = 5 sats
      ],
      created_at: 1234567890
    };

    const amountTag = zapRequestInDescription.tags.find(([name]) => name === 'amount')?.[1];
    expect(amountTag).toBe('5000');

    const millisats = parseInt(amountTag!);
    const sats = Math.floor(millisats / 1000);
    
    expect(sats).toBe(5);
  });
});
