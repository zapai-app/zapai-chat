import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';

/**
 * Hook to send encrypted DM messages to a target pubkey
 * Uses NIP-04 (kind 4) encryption only
 */
export function useSendMessage(targetPubkey: string | null) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!user) {
        throw new Error('User is not logged in');
      }

      if (!targetPubkey) {
        throw new Error('Target pubkey is not set');
      }

      if (!content.trim()) {
        throw new Error('Message content cannot be empty');
      }

      // Encrypt the message using NIP-04 only
      let encryptedContent: string;

      if (user.signer.nip04) {
        // Use NIP-04 encryption with kind 4
        encryptedContent = await user.signer.nip04.encrypt(targetPubkey, content);
      } else {
        throw new Error('Signer does not support NIP-04 encryption');
      }

      // Create and sign the DM event (kind 4)
      const event = await user.signer.signEvent({
        kind: 4,
        content: encryptedContent,
        tags: [['p', targetPubkey]],
        created_at: Math.floor(Date.now() / 1000),
      });

      // Publish the event
      await nostr.event(event, { signal: AbortSignal.timeout(5000) });

      return event;
    },
    onSuccess: () => {
      // Invalidate the chat messages query to fetch the new message
      queryClient.invalidateQueries({
        queryKey: ['chat-messages', user?.pubkey, targetPubkey],
      });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast({
        title: 'Failed to send message',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}