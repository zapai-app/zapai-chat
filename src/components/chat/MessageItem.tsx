import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { useAuthor } from '@/hooks/useAuthor';
import { useDecryptMessage } from '@/hooks/useDecryptMessage';
import { useTypingAnimation } from '@/hooks/useTypingAnimation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Bot, Copy, RotateCcw, User } from 'lucide-react';
import { NoteContent } from '@/components/NoteContent';
import { genUserName } from '@/lib/genUserName';
import type { NostrEvent } from '@nostrify/nostrify';

interface MessageItemProps {
  event: NostrEvent;
  isUser: boolean;
  isLast: boolean;
  onCopy: (content: string) => void;
  onRegenerate?: () => void;
  onTypingChange?: (isTyping: boolean) => void;
}

export interface MessageItemRef {
  stopTyping: () => void;
}

export const MessageItem = forwardRef<MessageItemRef, MessageItemProps>(
  ({ event, isUser, isLast, onCopy, onRegenerate, onTypingChange }, ref) => {
    const author = useAuthor(event.pubkey);
    const { decryptedContent, isDecrypting, error } = useDecryptMessage(event);
    
    // Only apply typing animation to AI messages (last message)
    const shouldType = !isUser && isLast && !isDecrypting && !error;
    const { displayedText, isTyping, stop } = useTypingAnimation(
      shouldType ? decryptedContent : '',
      20
    );

    // Expose stop function to parent via ref
    useImperativeHandle(ref, () => ({
      stopTyping: stop,
    }), [stop]);

    // Notify parent about typing state
    useEffect(() => {
      if (onTypingChange && shouldType) {
        onTypingChange(isTyping);
      }
    }, [isTyping, onTypingChange, shouldType]);
    
    const displayName = author.data?.metadata?.name || genUserName(event.pubkey);
    const avatarUrl = author.data?.metadata?.picture;

    // Determine content to display
    const contentToShow = shouldType ? displayedText : decryptedContent;

    // Create a modified event with content for NoteContent
    const displayEvent = {
      ...event,
      content: isDecrypting ? 'Decrypting...' : error ? 'Failed to decrypt message' : contentToShow,
    };

    return (
      <div
        className={`group relative py-6 transition-all duration-300 message-animation ${
          !isUser 
            ? 'bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 border-l-4 border-l-emerald-500/20' 
            : 'hover:bg-accent/20'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="flex gap-4 md:gap-6">
            {/* Enhanced Avatar */}
            <div className="flex-shrink-0">
              {isUser ? (
                <Avatar className="h-10 w-10 ring-2 ring-emerald-500/20 shadow-sm">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-500/20">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  {isTyping && (
                    <div className="absolute -top-1 -right-1 w-4 h-4">
                      <div className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse border-2 border-background"></div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Content */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm text-foreground/90">
                  {isUser ? displayName : 'ZAI Assistant'}
                </div>
                
                {/* Action Buttons - Modern floating design */}
                {!isUser && !isDecrypting && !error && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCopy(decryptedContent)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors"
                      title="Copy message"
                    >
                      <Copy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </Button>
                    {isLast && onRegenerate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRegenerate}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors"
                        title="Regenerate response"
                      >
                        <RotateCcw className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Enhanced Content Display */}
              <div className={`relative ${!isUser ? 'pl-0' : ''}`}>
                <div className="prose prose-sm max-w-none dark:prose-invert prose-emerald">
                  {isDecrypting ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      </div>
                      <span className="italic">Decrypting message...</span>
                    </div>
                  ) : error ? (
                    <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
                      <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Failed to decrypt message</span>
                    </div>
                  ) : (
                    <div className={`${!isUser ? 'bg-card/50 border border-border/50 rounded-2xl p-4' : ''}`}>
                      <NoteContent event={displayEvent} className="text-sm leading-relaxed" />
                      {isTyping && (
                        <span className="inline-block w-2 h-5 bg-emerald-500 ml-1 animate-pulse"></span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

MessageItem.displayName = 'MessageItem';
