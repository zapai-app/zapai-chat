import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';

export interface ChatSession {
  id: string;
  name: string;
  createdAt: number;
  lastEditedAt: number;
  event: NostrEvent;
}

/**
 * Validates a kind 1005 chat session event
 */
function validateChatSessionEvent(event: NostrEvent): boolean {
  if (event.kind !== 1005) return false;

  // Check for required tags
  const sessionId = event.tags.find(([name]) => name === 'd')?.[1];
  const sessionName = event.tags.find(([name]) => name === 'name')?.[1];

  return !!(sessionId && sessionName);
}

/**
 * Hook to fetch chat sessions (kind 1005) for the current user
 */
export function useChatSessions() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery<ChatSession[], Error>({
    queryKey: ['chat-sessions', user?.pubkey],
    enabled: !!user?.pubkey,
    queryFn: async (c) => {
      if (!user?.pubkey) return [];

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Query for chat session events (kind 1005)
      const events = await nostr.query(
        [
          {
            kinds: [1005],
            authors: [user.pubkey],
          },
        ],
        { signal }
      );

      // Filter and validate events
      const validEvents = events.filter(validateChatSessionEvent);

      // Group events by 'd' tag (session ID) and keep only the latest one
      // This is necessary because kind 1005 is a replaceable event
      const latestEventsBySessionId = new Map<string, NostrEvent>();
      
      for (const event of validEvents) {
        const sessionId = event.tags.find(([name]) => name === 'd')?.[1];
        if (!sessionId) continue;

        const existing = latestEventsBySessionId.get(sessionId);
        // Keep the event with the highest created_at timestamp
        if (!existing || event.created_at > existing.created_at) {
          latestEventsBySessionId.set(sessionId, event);
        }
      }

      // Transform events to ChatSession objects
      const sessions: ChatSession[] = Array.from(latestEventsBySessionId.values()).map((event) => {
        const sessionId = event.tags.find(([name]) => name === 'd')?.[1] || '';
        const sessionName = event.tags.find(([name]) => name === 'name')?.[1] || 'Untitled Chat';
        const lastEdited = event.tags.find(([name]) => name === 'last_edited')?.[1];

        return {
          id: sessionId,
          name: sessionName,
          createdAt: event.created_at,
          lastEditedAt: lastEdited ? parseInt(lastEdited) : event.created_at,
          event,
        };
      });

      // Sort sessions by last edited date (newest first)
      return sessions.sort((a, b) => b.lastEditedAt - a.lastEditedAt);
    },
  });
}
