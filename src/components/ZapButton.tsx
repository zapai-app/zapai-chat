import { ZapDialog } from '@/components/ZapDialog';
import { useZaps } from '@/hooks/useZaps';
import { useWallet } from '@/hooks/useWallet';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import type { Event } from 'nostr-tools';
import type { ButtonProps } from '@/components/ui/button';

interface ZapButtonProps {
  target: Event | null;
  targetPubkey?: string;  // For direct profile zaps without an event
  className?: string;
  showCount?: boolean;
  zapData?: { count: number; totalSats: number; isLoading?: boolean };
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
}

export function ZapButton({
  target,
  targetPubkey,
  className,
  showCount = true,
  zapData: externalZapData,
  variant = "ghost",
  size = "sm"
}: ZapButtonProps) {
  const { user } = useCurrentUser();
  
  // Use targetPubkey if provided, otherwise use target's pubkey
  const recipientPubkey = targetPubkey || target?.pubkey;
  const { data: author } = useAuthor(recipientPubkey || '');
  const { webln, activeNWC } = useWallet();

  // Only fetch data if not provided externally
  const { totalSats: fetchedTotalSats, isLoading } = useZaps(
    externalZapData ? [] : target ?? [], // Empty array prevents fetching if external data provided
    webln,
    activeNWC,
    undefined,
    recipientPubkey
  );

  // Don't show zap button if user is not logged in, is the author, or author has no lightning address
  if (!user || !recipientPubkey || user.pubkey === recipientPubkey || (!author?.metadata?.lud16 && !author?.metadata?.lud06)) {
    return null;
  }

  // Use external data if provided, otherwise use fetched data
  const totalSats = externalZapData?.totalSats ?? fetchedTotalSats;
  const showLoading = externalZapData?.isLoading || isLoading;

  return (
    <ZapDialog target={target} targetPubkey={targetPubkey}>
      <Button variant={variant} size={size} className={className}>
        <Zap className="h-4 w-4" />
        {showLoading ? (
          '...'
        ) : showCount && totalSats > 0 ? (
          `${totalSats.toLocaleString()}`
        ) : (
          'Zap'
        )}
      </Button>
    </ZapDialog>
  );
}