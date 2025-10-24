import { useEffect, useState } from 'react';
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
 * Listens for kind 1006 events and sends balance request on mount
 */
export function useBalance() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const [balanceData, setBalanceData] = useState<BalanceData>({
    balance: 0,
    lastUpdate: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (!user) {
      setBalanceData({ balance: 0, lastUpdate: 0, isLoading: false });
      return;
    }

    let mounted = true;
    let intervalId: NodeJS.Timeout;

    const fetchBalance = async () => {
      try {
        console.log('📡 Querying balance updates...');
        
        // Query for latest balance event from bot
        const events = await nostr.query(
          [
            {
              kinds: [1006],
              authors: [BOT_PUBKEY],
              '#p': [user.pubkey],
              limit: 1,
            },
          ],
          { signal: AbortSignal.timeout(5000) }
        );

        if (events.length > 0 && mounted) {
          const event = events[0];
          try {
            console.log('📨 Balance event received:', event);

            // Parse balance from content
            const data = JSON.parse(event.content) as BalanceResponse;
            
            console.log('💰 Balance data:', data);

            setBalanceData({
              balance: data.balance,
              lastUpdate: data.timestamp,
              isLoading: false,
            });
          } catch (error) {
            console.error('Failed to parse balance event:', error);
          }
        }
      } catch (error) {
        console.error('Failed to query balance:', error);
      }
    };

    const requestBalance = async () => {
      try {
        console.log('📤 Requesting current balance...');
        
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
    };

    // Initial request and fetch
    const initialize = async () => {
      await requestBalance();
      // Wait a bit for bot to respond
      setTimeout(() => {
        fetchBalance();
      }, 2000);
      
      // Set up polling every 10 seconds for real-time updates
      intervalId = setInterval(fetchBalance, 10000);
      
      // After 5 seconds, if still no response, set loading to false
      setTimeout(() => {
        if (mounted) {
          setBalanceData((prev) => ({ ...prev, isLoading: false }));
        }
      }, 5000);
    };

    initialize();

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, nostr]);

  return {
    data: balanceData.balance > 0 ? {
      totalSats: balanceData.balance,
      lastUpdate: balanceData.lastUpdate,
    } : null,
    isLoading: balanceData.isLoading,
    refetch: async () => {
      if (!user) return;
      
      console.log('🔄 Refetching balance...');
      setBalanceData((prev) => ({ ...prev, isLoading: true }));

      try {
        const balanceRequest = await user.signer.signEvent({
          kind: 1006,
          content: '',
          tags: [['balance']],
          created_at: Math.floor(Date.now() / 1000),
        });

        await nostr.event(balanceRequest, { signal: AbortSignal.timeout(5000) });
        console.log('✅ Balance refetch request sent');
      } catch (error) {
        console.error('Failed to refetch balance:', error);
        setBalanceData((prev) => ({ ...prev, isLoading: false }));
      }
    },
  };
}
