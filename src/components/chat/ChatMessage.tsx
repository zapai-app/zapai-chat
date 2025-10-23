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
      <div className={cn('flex gap-3 py-4', isOwnMessage && 'flex-row-reverse')}>
        <Skeleton className="h-8 w-8 md:h-9 md:w-9 rounded-full flex-shrink-0" />
        <div className={cn('flex flex-col gap-2 flex-1', isOwnMessage && 'items-end')}>
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-20 w-full max-w-2xl" />
        </div>
      </div>
    );
  }

  // Show alert for decryption errors
  const isEncryptedError = decryptedContent.startsWith('[');
  
  return (
    <div className={cn(
      'group flex gap-3 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300',
      isOwnMessage && 'flex-row-reverse'
    )}>
      <Avatar className={cn(
        'h-8 w-8 md:h-9 md:w-9 flex-shrink-0 ring-2',
        isOwnMessage 
          ? 'ring-primary/30' 
          : 'ring-white/[0.08]'
      )}>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />}
        <AvatarFallback className={cn(
          'text-xs md:text-sm font-bold',
          isOwnMessage 
            ? 'bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-white' 
            : 'bg-gradient-to-br from-white/10 to-white/[0.05] text-white'
        )}>
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn('flex flex-col gap-1.5 flex-1 max-w-2xl', isOwnMessage && 'items-end')}>
        <div className={cn('flex items-center gap-2', isOwnMessage && 'flex-row-reverse')}>
          <span className="text-xs md:text-sm font-semibold text-white">{displayName}</span>
          <span className="text-[10px] md:text-xs text-gray-500">
            {new Date(event.created_at * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
 
        {isEncryptedError ? (
          <Alert className={cn(
            'py-2 px-3 border-dashed bg-white/[0.02]',
            isOwnMessage ? 'border-primary/30' : 'border-white/[0.08]'
          )}>
            <Lock className="h-3 w-3" />
            <AlertDescription className="text-xs ml-2">
              {decryptedContent}
            </AlertDescription>
          </Alert>
        ) : (
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5 text-sm md:text-base leading-relaxed transition-all duration-200',
              isOwnMessage
                ? 'bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-white rounded-tr-md'
                : 'bg-white/[0.03] backdrop-blur-sm rounded-tl-md border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.12] text-white'
            )}
          >
            <MessageContent content={decryptedContent} />
          </div>
        )}
      </div>
    </div>
  );
}
