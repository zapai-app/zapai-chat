import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const BOT_PUBKEY = '618be242c2e25d3e1b86e5ecabf32929a7c24d6cd2a797e8292a1f6252cb702e';

interface Transaction {
  zapId: string;
  amount: number;
  timestamp: number;
  date: string;
  eventId: string;
}

interface BalanceData {
  pubkey: string;
  totalSats: number;
  totalBTC: string;
  zapCount: number;
  transactions: Transaction[];
}

/**
 * Hook to fetch user's balance from the bot
 * Sends a kind 1006 event and waits for the bot's encrypted DM response
 */
export function useBalance() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery<BalanceData | null, Error>({
    queryKey: ['balance', user?.pubkey],
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    queryFn: async () => {
      if (!user) return null;

      try {
        // Step 1: Request balance by publishing kind 1006 event
        const balanceRequest = await user.signer.signEvent({
          kind: 1006,
          content: '',
          tags: [['balance']],
          created_at: Math.floor(Date.now() / 1000),
        });

        // Publish the balance request
        await nostr.event(balanceRequest, { signal: AbortSignal.timeout(5000) });
        
        console.log('Balance request sent:', {
          kind: 1006,
          userPubkey: user.pubkey,
          botPubkey: BOT_PUBKEY,
        });

        // Step 2: Wait for bot's response (kind 4 DM)
        // Query for recent DMs from the bot to current user
        const startTime = Math.floor(Date.now() / 1000) - 300; // Look for messages in last 5 minutes
        
        // Poll for the response with retries
        let attempts = 0;
        const maxAttempts = 8;
        const pollInterval = 2000; // 2 seconds between attempts

        while (attempts < maxAttempts) {
          const dms = await nostr.query(
            [{
              kinds: [4],
              authors: [BOT_PUBKEY],
              '#p': [user.pubkey],
              since: startTime,
            }],
            { signal: AbortSignal.timeout(3000) }
          );

          console.log(`Balance query attempt ${attempts + 1}/${maxAttempts}: Found ${dms.length} DMs from bot`);

          if (dms.length > 0) {
            // Sort by created_at to get the most recent
            const sortedDMs = dms.sort((a, b) => b.created_at - a.created_at);
            
            // Try to decrypt and parse each DM until we find a valid balance response
            for (const dm of sortedDMs) {
              try {
                if (!user.signer.nip04) {
                  throw new Error('NIP-04 encryption not supported');
                }
                
                const decrypted = await user.signer.nip04.decrypt(BOT_PUBKEY, dm.content);
                console.log('Decrypted DM content:', decrypted);
                
                const balanceData = JSON.parse(decrypted) as BalanceData;
                
                // Validate the response has the expected structure
                if (
                  balanceData.pubkey &&
                  typeof balanceData.totalSats === 'number' &&
                  Array.isArray(balanceData.transactions)
                ) {
                  console.log('Valid balance data received:', balanceData);
                  return balanceData;
                }
              } catch (error) {
                // This DM might not be a balance response, continue to next
                console.warn('Failed to decrypt or parse DM:', error);
                continue;
              }
            }
          }

          // Wait before next attempt
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
          }
        }

        // No response received after all attempts
        console.warn('No balance response received from bot after all attempts');
        console.log('User pubkey:', user.pubkey);
        console.log('Bot pubkey:', BOT_PUBKEY);
        
        // Return default empty balance
        return {
          pubkey: user.pubkey,
          totalSats: 0,
          totalBTC: '0.00000000',
          zapCount: 0,
          transactions: [],
        };
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        
        // Return default empty balance on error
        return {
          pubkey: user.pubkey,
          totalSats: 0,
          totalBTC: '0.00000000',
          zapCount: 0,
          transactions: [],
        };
      }
    },
  });
}
