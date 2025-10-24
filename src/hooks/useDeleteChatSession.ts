import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';

/**
 * Hook to delete a chat session
 * Deletes by publishing a kind 5 (deletion) event targeting the session event
 */
export function useDeleteChatSession() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, eventId }: { sessionId: string; eventId: string }) => {
      if (!user) {
        throw new Error('User is not logged in');
      }

      // Create a deletion event (kind 5) targeting the session event
      const deletionEvent = await user.signer.signEvent({
        kind: 5,
        content: 'Deleted chat session',
        tags: [
          ['e', eventId],
          ['k', '1005'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      });

      // Publish the deletion event
      await nostr.event(deletionEvent, { signal: AbortSignal.timeout(5000) });

      return { sessionId, eventId };
    },
    onSuccess: () => {
      // Invalidate the chat sessions query to refetch sessions
      queryClient.invalidateQueries({
        queryKey: ['chat-sessions', user?.pubkey],
      });

      toast({
        title: 'Session deleted',
        description: 'Chat session has been deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Failed to delete chat session:', error);
      toast({
        title: 'Failed to delete session',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}
