import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Hook to decrypt a single encrypted message
 * Uses NIP-04 (kind 4) decryption only
 */
export function useDecryptMessage(event: NostrEvent) {
  const { user } = useCurrentUser();
  const [decryptedContent, setDecryptedContent] = useState<string>('');
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function decrypt() {
      if (!user) {
        setDecryptedContent('');
        setIsDecrypting(false);
        return;
      }

      try {
        setIsDecrypting(true);
        setError(null);

        // Get the other party's pubkey (the one who is NOT the current user)
        const otherPubkey = event.pubkey === user.pubkey
          ? event.tags.find(([name]) => name === 'p')?.[1]
          : event.pubkey;

        if (!otherPubkey) {
          throw new Error('Could not determine other party pubkey');
        }

        // Decrypt using NIP-04 only
        let content: string;

        if (event.kind === 4) {
          // NIP-04 encrypted message (kind 4)
          if (user.signer.nip04) {
            content = await user.signer.nip04.decrypt(otherPubkey, event.content);
          } else {
            throw new Error('Signer does not support NIP-04 decryption');
          }
        } else {
          throw new Error(`Unsupported message kind: ${event.kind}. Only NIP-04 (kind 4) messages are supported.`);
        }

        setDecryptedContent(content);
      } catch (err) {
        console.error('Failed to decrypt message:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        // Provide specific error messages based on the error type
        if (errorMessage.includes('pubkey') || errorMessage.includes('not found')) {
          setError('Message not for this account');
          setDecryptedContent('[Message encrypted for another account]');
        } else if (errorMessage.includes('NIP-04')) {
          setError('Unable to decrypt NIP-04 message');
          setDecryptedContent('[NIP-04 message - Decryption failed]');
        } else if (errorMessage.includes('Unsupported message kind')) {
          setError('Unsupported message type');
          setDecryptedContent('[Unknown message type]');
        } else {
          setError('Failed to decrypt message');
          setDecryptedContent('[Encrypted message - Unable to decrypt]');
        }
      } finally {
        setIsDecrypting(false);
      }
    }

    decrypt();
  }, [event, user]);

  return { decryptedContent, isDecrypting, error };
}
