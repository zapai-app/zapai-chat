import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';

/**
 * Hook to update an existing chat session (kind 1005)
 * Updates are done by publishing a new replaceable event with the same 'd' tag
 */
export function useUpdateChatSession() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, newName }: { sessionId: string; newName: string }) => {
      if (!user) {
        throw new Error('User is not logged in');
      }

      if (!newName.trim()) {
        throw new Error('Session name cannot be empty');
      }

      const now = Math.floor(Date.now() / 1000);

      // Create an updated chat session event with the same 'd' tag
      // This will replace the previous event with the same pubkey+kind+d combination
      const event = await user.signer.signEvent({
        kind: 1005,
        content: '',
        tags: [
          ['d', sessionId],
          ['name', newName.trim()],
          ['last_edited', now.toString()],
        ],
        created_at: now,
      });

      // Publish the event
      await nostr.event(event, { signal: AbortSignal.timeout(5000) });

      return {
        id: sessionId,
        name: newName.trim(),
        lastEditedAt: now,
        event,
      };
    },
    onSuccess: () => {
      // Invalidate the chat sessions query to fetch the updated session
      queryClient.invalidateQueries({
        queryKey: ['chat-sessions', user?.pubkey],
      });

      toast({
        title: 'Session updated',
        description: 'Session name has been updated successfully',
      });
    },
    onError: (error) => {
      console.error('Failed to update chat session:', error);
      toast({
        title: 'Failed to update session',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}
