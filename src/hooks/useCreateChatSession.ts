import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';

/**
 * Hook to create a new chat session (kind 1005)
 */
export function useCreateChatSession() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionName: string) => {
      if (!user) {
        throw new Error('User is not logged in');
      }

      if (!sessionName.trim()) {
        throw new Error('Session name cannot be empty');
      }

      // Generate a unique session ID (UUID v4)
      const sessionId = crypto.randomUUID();
      const now = Math.floor(Date.now() / 1000);

      // Create the chat session event (kind 1005)
      const event = await user.signer.signEvent({
        kind: 1005,
        content: '',
        tags: [
          ['d', sessionId],
          ['name', sessionName.trim()],
          ['last_edited', now.toString()],
        ],
        created_at: now,
      });

      // Publish the event
      await nostr.event(event, { signal: AbortSignal.timeout(5000) });

      return {
        id: sessionId,
        name: sessionName.trim(),
        createdAt: now,
        lastEditedAt: now,
        event,
      };
    },
    onSuccess: (session) => {
      // Invalidate the chat sessions query to fetch the new session
      queryClient.invalidateQueries({
        queryKey: ['chat-sessions', user?.pubkey],
      });

      toast({
        title: 'Chat session created',
        description: `Created session: ${session.name}`,
      });
    },
    onError: (error) => {
      console.error('Failed to create chat session:', error);
      toast({
        title: 'Failed to create chat session',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}
