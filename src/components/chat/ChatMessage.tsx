import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useDecryptMessage } from '@/hooks/useDecryptMessage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageContent } from './MessageContent';
import { Lock } from 'lucide-react';
import { genUserName } from '@/lib/genUserName';
import { cn } from '@/lib/utils';
import type { NostrEvent } from '@nostrify/nostrify';

interface ChatMessageProps {
  event: NostrEvent;
}

export function ChatMessage({ event }: ChatMessageProps) {
  const { user } = useCurrentUser();
  const { decryptedContent, isDecrypting } = useDecryptMessage(event);
  const author = useAuthor(event.pubkey);
  
  const isOwnMessage = event.pubkey === user?.pubkey;
  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(event.pubkey);
  const avatarUrl = metadata?.picture;

  if (isDecrypting) {
    return (
      <div className={cn('flex gap-3 mb-4', isOwnMessage && 'flex-row-reverse')}>
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className={cn('flex flex-col gap-1', isOwnMessage && 'items-end')}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-16 w-64" />
        </div>
      </div>
    );
  }

  // Show alert for decryption errors
  const isEncryptedError = decryptedContent.startsWith('[');
  
  return (
    <div className={cn('flex gap-3 mb-4 animate-in fade-in slide-in-from-bottom-4', isOwnMessage && 'flex-row-reverse')}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn('flex flex-col gap-1 max-w-[70%]', isOwnMessage && 'items-end')}>
 
        {isEncryptedError ? (
          <Alert className={cn('py-2 px-3', isOwnMessage ? 'border-primary' : '')}>
            <Lock className="h-3 w-3" />
            <AlertDescription className="text-xs ml-2">
              {decryptedContent}
            </AlertDescription>
          </Alert>
        ) : (
          <div
            className={cn(
              'rounded-2xl px-4 py-2',
              isOwnMessage
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted rounded-bl-sm'
            )}
          >
            <MessageContent content={decryptedContent} />
          </div>
        )}
        <span className="text-xs text-muted-foreground px-1">
          {new Date(event.created_at * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
