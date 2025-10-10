import { useEffect, useRef } from 'react';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useToast } from '@/hooks/useToast';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ZapButton } from '@/components/ZapButton';
import { LoginArea } from '@/components/auth/LoginArea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { genUserName } from '@/lib/genUserName';

interface ChatWindowProps {
  targetPubkey: string | null;
}

export function ChatWindow({ targetPubkey }: ChatWindowProps) {
  const { user } = useCurrentUser();
  const { data: messages, isLoading } = useChatMessages(targetPubkey);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(targetPubkey);
  const { mutateAsync: uploadFile } = useUploadFile();
  const { toast } = useToast();
  const author = useAuthor(targetPubkey ?? '');
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(targetPubkey ?? '');
  const avatarUrl = metadata?.picture;
  const about = metadata?.about;

  // Debug log to check metadata
  useEffect(() => {
    if (metadata) {
      console.log('Target user metadata:', {
        displayName,
        avatarUrl,
        about,
        fullMetadata: metadata
      });
    } else if (author.data && !author.isLoading) {
      console.log('Author data exists but no metadata:', author.data);
    } else if (author.isLoading) {
      console.log('Loading author metadata for pubkey:', targetPubkey);
    }
  }, [metadata, displayName, avatarUrl, about, author.data, author.isLoading, targetPubkey]);

  // Handle sending messages with optional files
  const handleSend = async (message: string, files?: File[]) => {
    try {
      let finalMessage = message;

      // Upload files if any
      if (files && files.length > 0) {
        const uploadedUrls: string[] = [];
        
        for (const file of files) {
          try {
            const [[_, url]] = await uploadFile(file);
            uploadedUrls.push(url);
          } catch (error) {
            console.error('Failed to upload file:', file.name, error);
            toast({
              title: 'Upload failed',
              description: `Failed to upload ${file.name}`,
              variant: 'destructive',
            });
          }
        }

        // Append URLs to message
        if (uploadedUrls.length > 0) {
          finalMessage = message + (message ? '\n\n' : '') + uploadedUrls.join('\n');
        }
      }

      // Send the message
      if (finalMessage.trim()) {
        sendMessage(finalMessage);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Failed to send',
        description: 'Could not send your message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!targetPubkey) {
    return (
      <div className="h-full flex flex-col">
        {/* Mobile Header with Login */}
        <div className="md:hidden border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex justify-end">
          <LoginArea className="w-auto" />
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center border-dashed">
            <p className="text-muted-foreground">
              No target account configured. Please set VITE_TARGET_PUBKEY in .env file.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex flex-col">
        {/* Mobile Header with Login */}
        <div className="md:hidden border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex justify-end">
          <LoginArea className="w-auto" />
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center border-dashed">
            <p className="text-muted-foreground">
              Please log in to start chatting.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {author.isLoading ? (
              <>
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </>
            ) : (
              <>
                <Avatar className="h-10 w-10 flex-shrink-0">
                  {avatarUrl && (
                    <AvatarImage 
                      src={avatarUrl} 
                      alt={displayName}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-base truncate">{displayName}</h2>
                  {about && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {about}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Right side: Login (mobile) and Zap button */}
          <div className="flex items-center gap-2">
            {/* Login Area - Mobile only */}
            <div className="md:hidden">
              <LoginArea className="w-auto" />
            </div>
            
            {/* Zap Button */}
            <ZapButton
              target={{ 
                id: '', 
                pubkey: targetPubkey, 
                created_at: 0, 
                kind: 0, 
                tags: [], 
                content: '', 
                sig: '' 
              }}
              className="gap-2"
              showCount={false}
            />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-6">
        <div ref={scrollRef} className="py-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3 mb-4">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-16 w-64" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages && messages.length > 0 ? (
            messages.map((event) => (
              <ChatMessage key={event.id} event={event} />
            ))
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <Card className="p-8 max-w-md text-center border-dashed">
                <div className="mb-4">
                  <div className="mx-auto w-20 h-20 mb-4 flex items-center justify-center">
                    {author.isLoading ? (
                      <Skeleton className="h-16 w-16 rounded-full" />
                    ) : (
                      <Avatar className="h-16 w-16">
                        {avatarUrl && (
                          <AvatarImage 
                            src={avatarUrl} 
                            alt={displayName}
                            className="object-cover"
                          />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                          {displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    Start a conversation with {displayName}
                  </h3>
                  {about && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {about}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Send your first message to begin chatting. All messages are encrypted and private.
                  </p>
                </div>
              </Card>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
        <ChatInput
          onSend={handleSend}
          disabled={isSending}
          placeholder={`Ask anything ...`}
        />
      </div>
    </div>
  );
}
