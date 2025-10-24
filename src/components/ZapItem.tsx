import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, MessageSquare } from 'lucide-react';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import type { ReceivedZap } from '@/hooks/useReceivedZaps';

interface ZapItemProps {
  zap: ReceivedZap;
}

export function ZapItem({ zap }: ZapItemProps) {
  // Fetch sender's profile
  const sender = useAuthor(zap.senderPubkey);
  const senderMetadata = sender.data?.metadata;
  const senderName = senderMetadata?.name || senderMetadata?.display_name || genUserName(zap.senderPubkey);
  const senderPicture = senderMetadata?.picture;

  // Format timestamp
  const zapDate = new Date(zap.timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - zapDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let timeAgo = '';
  if (diffMins < 1) {
    timeAgo = 'Just now';
  } else if (diffMins < 60) {
    timeAgo = `${diffMins}m ago`;
  } else if (diffHours < 24) {
    timeAgo = `${diffHours}h ago`;
  } else if (diffDays < 7) {
    timeAgo = `${diffDays}d ago`;
  } else {
    timeAgo = zapDate.toLocaleDateString();
  }

  const fullDate = zapDate.toLocaleString();

  return (
    <Card className="border-l-4 border-l-primary/40 hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12 border-2 border-background shrink-0">
            <AvatarImage src={senderPicture} alt={senderName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {senderName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-base">{senderName}</h4>
                <p className="text-xs text-muted-foreground" title={fullDate}>
                  Charged account • {timeAgo}
                </p>
              </div>
              
              {/* Amount Badge */}
              <Badge 
                variant="default" 
                className="shrink-0 text-base font-bold px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20"
              >
                <Zap className="h-4 w-4 mr-1 fill-current" />
                {zap.amount.toLocaleString()}
              </Badge>
            </div>

            {/* Comment */}
            {zap.comment && (
              <div className="rounded-lg bg-muted/50 p-3 border">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground break-words flex-1">
                    {zap.comment}
                  </p>
                </div>
              </div>
            )}

            {/* Sender Pubkey (for debugging/verification) */}
            <details className="text-xs">
              <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
                Transaction details
              </summary>
              <div className="mt-2 space-y-2 text-[10px] text-muted-foreground bg-muted/30 p-3 rounded">
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">Event ID:</div>
                  <div className="font-mono break-all bg-background/50 p-2 rounded">{zap.id}</div>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">Sender Pubkey:</div>
                  <div className="font-mono break-all bg-background/50 p-2 rounded">{zap.senderPubkey}</div>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">Lightning Invoice:</div>
                  <div className="font-mono break-all bg-background/50 p-2 rounded text-[9px]">{zap.bolt11}</div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
