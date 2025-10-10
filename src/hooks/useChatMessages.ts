import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Hook to fetch encrypted DM messages between current user and target pubkey
 * Uses NIP-04 (kind 4) encryption
 */
export function useChatMessages(targetPubkey: string | null) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery<NostrEvent[], Error>({
    queryKey: ['chat-messages', user?.pubkey, targetPubkey],
    enabled: !!user?.pubkey && !!targetPubkey,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
    queryFn: async (c) => {
      if (!user?.pubkey || !targetPubkey) return [];

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Query for DM messages (kind 4 for NIP-04) between the two users
      const events = await nostr.query(
        [
          {
            kinds: [4], // NIP-04 encrypted messages only
            authors: [user.pubkey, targetPubkey],
            '#p': [targetPubkey, user.pubkey],
          },
        ],
        { signal }
      );

      // Filter to only include messages that involve both the current user and target
      // A message is valid if:
      // 1. It's from current user to target (author=user, tag=target)
      // 2. It's from target to current user (author=target, tag=user)
      const relevantMessages = events.filter((event) => {
        const pTag = event.tags.find(([name]) => name === 'p')?.[1];
        
        // Message from current user to target
        if (event.pubkey === user.pubkey && pTag === targetPubkey) {
          return true;
        }
        
        // Message from target to current user
        if (event.pubkey === targetPubkey && pTag === user.pubkey) {
          return true;
        }
        
        return false;
      });

      // Sort messages by created_at timestamp (oldest first)
      return relevantMessages.sort((a, b) => a.created_at - b.created_at);
    },
  });
}
