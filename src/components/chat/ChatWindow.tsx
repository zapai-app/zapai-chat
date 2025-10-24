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
  onMenuClick?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function ChatWindow({ targetPubkey, onToggleSidebar, isSidebarOpen }: ChatWindowProps) {
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
      <div className="h-full flex flex-col bg-background">
        {/* Header with Sidebar Toggle and Login */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between gap-3">
              {/* Sidebar Toggle Button - Always visible */}
              <button
                onClick={onToggleSidebar}
                className="p-2 -ml-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                <svg className="h-6 w-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm md:text-base text-foreground">ZAI Chat</h2>
              </div>

              {/* Login Area */}
              <div className="flex-shrink-0">
                <LoginArea className="w-auto" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Center Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="p-6 md:p-8 text-center border-dashed max-w-md w-full">
            <div className="mb-4">
              <svg className="h-12 w-12 md:h-16 md:w-16 mx-auto text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">
              Configuration Required
            </h3>
            <p className="text-sm md:text-base text-muted-foreground">
              No target account configured. Please set VITE_TARGET_PUBKEY in your .env file.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Header with Sidebar Toggle and Login */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between gap-3">
              {/* Sidebar Toggle Button - Always visible */}
              <button
                onClick={onToggleSidebar}
                className="p-2 -ml-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                <svg className="h-6 w-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm md:text-base text-foreground">ZAI Chat</h2>
              </div>

              {/* Login Area */}
              <div className="flex-shrink-0">
                <LoginArea className="w-auto" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Center Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="p-6 md:p-8 text-center border-dashed max-w-md w-full">
            <div className="mb-4">
              <svg className="h-12 w-12 md:h-16 md:w-16 mx-auto text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">
              Welcome to ZAI Chat
            </h3>
            <p className="text-sm md:text-base text-muted-foreground mb-4">
              Please log in to start chatting with AI on Nostr.
            </p>
            <div className="md:hidden mt-6">
              <LoginArea className="w-full" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header - Ultra-modern design */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle Button - Always visible */}
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <svg className="h-6 w-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* User Info Section */}
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              {author.isLoading ? (
                <>
                  <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-full flex-shrink-0" />
                  <div className="space-y-1.5 min-w-0">
                    <Skeleton className="h-3.5 w-24 md:w-32" />
                    <Skeleton className="h-2.5 w-32 md:w-48" />
                  </div>
                </>
              ) : (
                <>
                  <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0 ring-2 ring-primary/20">
                    {avatarUrl && (
                      <AvatarImage 
                        src={avatarUrl} 
                        alt={displayName}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs md:text-sm">
                      {displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-sm md:text-base truncate text-foreground">{displayName}</h2>
                    {about && (
                      <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1">
                        {about}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Right side: Login (mobile) and Zap button */}
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
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
                className="gap-1.5 md:gap-2"
                showCount={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area - ChatGPT style center-aligned */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div ref={scrollRef} className="py-4 md:py-6">
            {isLoading ? (
              <div className="space-y-6 py-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-20 w-full max-w-2xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages && messages.length > 0 ? (
              <div className="space-y-4 md:space-y-6">
                {messages.map((event) => (
                  <ChatMessage key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center max-w-2xl px-4">
                  <div className="mb-8">
                    <div className="mx-auto w-20 h-20 md:w-24 md:h-24 mb-6 flex items-center justify-center">
                      {author.isLoading ? (
                        <Skeleton className="h-20 w-20 md:h-24 md:w-24 rounded-full" />
                      ) : (
                        <Avatar className="h-20 w-20 md:h-24 md:w-24 ring-4 ring-primary/20">
                          {avatarUrl && (
                            <AvatarImage 
                              src={avatarUrl} 
                              alt={displayName}
                              className="object-cover"
                            />
                          )}
                          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl md:text-3xl">
                            {displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">
                      Chat with {displayName}
                    </h3>
                    {about && (
                      <p className="text-sm md:text-base text-muted-foreground mb-4 max-w-lg mx-auto">
                        {about}
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>End-to-end encrypted</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      </ScrollArea>

      {/* Input Area - Sleek floating style */}
      <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <ChatInput
            onSend={handleSend}
            disabled={isSending}
            placeholder="Ask anything..."
          />
        </div>
      </div>
    </div>
  );
}
