import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { nip57 } from 'nostr-tools';

export interface ReceivedZap {
  id: string;
  senderPubkey: string;
  amount: number;
  comment: string;
  timestamp: number;
  bolt11: string;
  zapRequestEvent: NostrEvent | null;
}

/**
 * Hook to fetch all zap receipts received by a specific pubkey
 * Extracts sender information from the description tag
 * If senderPubkey is provided, filters to show only zaps from that sender
 */
export function useReceivedZaps(
  recipientPubkey: string | null | undefined,
  senderPubkey?: string | null | undefined
) {
  const { nostr } = useNostr();

  const { data: zapReceipts, ...query } = useQuery<NostrEvent[], Error>({
    queryKey: ['received-zaps', recipientPubkey, senderPubkey],
    enabled: !!recipientPubkey,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    queryFn: async (c) => {
      if (!recipientPubkey) return [];

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);

      // Query for all zap receipts sent to this pubkey
      const events = await nostr.query(
        [
          {
            kinds: [9735], // Zap receipt
            '#p': [recipientPubkey],
            limit: 100, // Get last 100 zaps
          },
        ],
        { signal }
      );

      // Sort by timestamp (newest first)
      return events.sort((a, b) => b.created_at - a.created_at);
    },
  });

  // Process zap receipts to extract sender information and amounts
  const processedZaps = useMemo<ReceivedZap[]>(() => {
    if (!zapReceipts || !Array.isArray(zapReceipts)) {
      return [];
    }

    const zaps: ReceivedZap[] = [];

    for (const receipt of zapReceipts) {
      try {
        // Extract bolt11 invoice
        const bolt11Tag = receipt.tags.find(([name]) => name === 'bolt11')?.[1];
        if (!bolt11Tag) {
          console.warn('Zap receipt missing bolt11 tag:', receipt.id);
          continue;
        }

        // Extract and parse the description tag (contains the original zap request)
        const descriptionTag = receipt.tags.find(([name]) => name === 'description')?.[1];
        if (!descriptionTag) {
          console.warn('Zap receipt missing description tag:', receipt.id);
          continue;
        }

        let zapRequest: NostrEvent | null = null;
        let extractedSenderPubkey = '';
        let comment = '';
        let amount = 0;

        try {
          // Parse the zap request from description
          zapRequest = JSON.parse(descriptionTag) as NostrEvent;
          
          // Extract sender pubkey
          extractedSenderPubkey = zapRequest.pubkey;

          // Extract comment if present
          comment = zapRequest.content || '';

          // Try to extract amount from zap request
          const amountTag = zapRequest.tags.find(([name]) => name === 'amount')?.[1];
          if (amountTag) {
            const millisats = parseInt(amountTag);
            amount = Math.floor(millisats / 1000);
          }
        } catch (error) {
          console.warn('Failed to parse zap request from description:', error);
        }

        // If we couldn't get amount from zap request, try from bolt11
        if (amount === 0 && bolt11Tag) {
          try {
            amount = nip57.getSatoshisAmountFromBolt11(bolt11Tag);
          } catch (error) {
            console.warn('Failed to extract amount from bolt11:', error);
          }
        }

        // If we still don't have sender pubkey, skip this zap
        if (!extractedSenderPubkey) {
          console.warn('Could not extract sender pubkey from zap receipt:', receipt.id);
          continue;
        }

        // Filter by sender pubkey if provided
        if (senderPubkey && extractedSenderPubkey !== senderPubkey) {
          continue;
        }

        zaps.push({
          id: receipt.id,
          senderPubkey: extractedSenderPubkey,
          amount,
          comment,
          timestamp: receipt.created_at,
          bolt11: bolt11Tag,
          zapRequestEvent: zapRequest,
        });
      } catch (error) {
        console.error('Error processing zap receipt:', receipt.id, error);
      }
    }

    return zaps;
  }, [zapReceipts, senderPubkey]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalSats = processedZaps.reduce((sum, zap) => sum + zap.amount, 0);
    const zapCount = processedZaps.length;
    const uniqueSenders = new Set(processedZaps.map(z => z.senderPubkey)).size;

    return {
      totalSats,
      zapCount,
      uniqueSenders,
    };
  }, [processedZaps]);

  return {
    zaps: processedZaps,
    totals,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
