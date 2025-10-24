import { useEffect, useState, useCallback } from 'react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const BOT_PUBKEY = '618be242c2e25d3e1b86e5ecabf32929a7c24d6cd2a797e8292a1f6252cb702e';

interface BalanceResponse {
  balance: number;
  currency: string;
  timestamp: number;
}

interface BalanceData {
  balance: number;
  lastUpdate: number;
  isLoading: boolean;
}

/**
 * Hook to subscribe to real-time balance updates from the bot
 * Maintains an open subscription for continuous balance updates
 */
export function useBalance() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const [balanceData, setBalanceData] = useState<BalanceData>({
    balance: 0,
    lastUpdate: 0,
    isLoading: true,
  });

  const requestBalance = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('📤 Requesting balance...');
      
      const balanceRequest = await user.signer.signEvent({
        kind: 1006,
        content: '',
        tags: [['balance']],
        created_at: Math.floor(Date.now() / 1000),
      });

      await nostr.event(balanceRequest, { signal: AbortSignal.timeout(5000) });
      console.log('✅ Balance request sent');
    } catch (error) {
      console.error('Failed to send balance request:', error);
    }
  }, [user, nostr]);

  useEffect(() => {
    if (!user) {
      setBalanceData({ balance: 0, lastUpdate: 0, isLoading: false });
      return;
    }

    let mounted = true;
    let subscriptionActive = true;

    const startSubscription = async () => {
      try {
        console.log('📡 Starting balance subscription...');
        
        // Create a persistent subscription for balance updates
        const abortController = new AbortController();
        
        // Start subscription loop
        while (subscriptionActive && mounted) {
          try {
            const events = await nostr.query(
              [
                {
                  kinds: [1006],
                  authors: [BOT_PUBKEY],
                  '#p': [user.pubkey],
                  limit: 10, // Get recent events
                },
              ],
              { signal: abortController.signal }
            );

            if (events.length > 0 && mounted) {
              // Get the most recent event
              const sortedEvents = events.sort((a, b) => b.created_at - a.created_at);
              const latestEvent = sortedEvents[0];
              
              try {
                console.log('📨 Balance event received:', latestEvent);

                // Parse balance from content
                const data = JSON.parse(latestEvent.content) as BalanceResponse;
                
                console.log('💰 Balance data:', data);

                setBalanceData({
                  balance: data.balance,
                  lastUpdate: data.timestamp,
                  isLoading: false,
                });
              } catch (error) {
                console.error('Failed to parse balance event:', error);
              }
            } else if (mounted) {
              // No balance events found yet, set loading to false after first check
              setBalanceData((prev) => ({ ...prev, isLoading: false }));
            }

            // Wait 5 seconds before next poll (if subscription is still active)
            if (subscriptionActive && mounted) {
              await new Promise((resolve) => setTimeout(resolve, 5000));
            }
          } catch (error) {
            if (mounted && subscriptionActive) {
              console.error('Balance subscription error:', error);
              // Wait a bit before retrying
              await new Promise((resolve) => setTimeout(resolve, 3000));
            }
          }
        }
      } catch (error) {
        console.error('Failed to start balance subscription:', error);
        if (mounted) {
          setBalanceData({ balance: 0, lastUpdate: 0, isLoading: false });
        }
      }
    };

    // Start the subscription
    startSubscription();
    
    // Send initial balance request after a short delay
    setTimeout(() => {
      if (mounted) {
        requestBalance();
      }
    }, 1000);

    return () => {
      mounted = false;
      subscriptionActive = false;
      console.log('🔌 Balance subscription closed');
    };
  }, [user, nostr, requestBalance]);

  return {
    data: balanceData.balance > 0 || balanceData.lastUpdate > 0 ? {
      totalSats: balanceData.balance,
      lastUpdate: balanceData.lastUpdate,
    } : null,
    isLoading: balanceData.isLoading,
    refetch: requestBalance,
  };
}
