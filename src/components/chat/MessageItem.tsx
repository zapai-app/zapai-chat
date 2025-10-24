import { useAuthor } from '@/hooks/useAuthor';
import { useDecryptMessage } from '@/hooks/useDecryptMessage';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Sparkles, Copy, RotateCcw, User } from 'lucide-react';
import { NoteContent } from '@/components/NoteContent';
import { genUserName } from '@/lib/genUserName';
import type { NostrEvent } from '@nostrify/nostrify';

interface MessageItemProps {
  event: NostrEvent;
  isUser: boolean;
  isLast: boolean;
  onCopy: (content: string) => void;
  onRegenerate?: () => void;
}

export function MessageItem({ event, isUser, isLast, onCopy, onRegenerate }: MessageItemProps) {
  const author = useAuthor(event.pubkey);
  const { decryptedContent, isDecrypting, error } = useDecryptMessage(event);
  
  const displayName = author.data?.metadata?.name || genUserName(event.pubkey);
  const avatarUrl = author.data?.metadata?.picture;

  // Create a modified event with decrypted content for NoteContent
  const displayEvent = {
    ...event,
    content: isDecrypting ? 'Decrypting...' : error ? 'Failed to decrypt message' : decryptedContent,
  };

  return (
    <div
      className={`group px-4 py-6 ${!isUser ? 'bg-muted/30' : ''} hover:bg-accent/50 transition-colors`}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {isUser ? (
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="font-semibold text-sm">
              {isUser ? displayName : 'ZAI'}
            </div>
            
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {isDecrypting ? (
                <span className="text-muted-foreground italic">Decrypting...</span>
              ) : error ? (
                <span className="text-destructive">Failed to decrypt message</span>
              ) : (
                <NoteContent event={displayEvent} className="text-sm leading-relaxed" />
              )}
            </div>

            {/* Actions - Only show for AI messages */}
            {!isUser && !isDecrypting && !error && (
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(decryptedContent)}
                  className="h-7 px-2"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy
                </Button>
                {isLast && onRegenerate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRegenerate}
                    className="h-7 px-2"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Regenerate
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
