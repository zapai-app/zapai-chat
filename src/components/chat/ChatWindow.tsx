import { useEffect, useRef, useState } from 'react';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { LoginArea } from '@/components/auth/LoginArea';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Copy, RotateCcw, User, StopCircle } from 'lucide-react';
import { NoteContent } from '@/components/NoteContent';

interface ChatWindowProps {
  targetPubkey: string | null;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const EXAMPLE_PROMPTS = [
  "Explain quantum computing in simple terms",
  "Write a creative story about space exploration",
  "Help me plan a healthy meal prep",
  "Suggest fun weekend activities",
];

export function ChatWindow({ targetPubkey, onToggleSidebar }: ChatWindowProps) {
  const { user } = useCurrentUser();
  const { data: messages, isLoading } = useChatMessages(targetPubkey);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(targetPubkey);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSend = () => {
    if (!inputValue.trim() || isSending) return;
    sendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copied to clipboard' });
  };

  const handleExampleClick = (prompt: string) => {
    setInputValue(prompt);
    textareaRef.current?.focus();
  };

  if (!targetPubkey) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onToggleSidebar}
                className="p-2 -ml-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="h-6 w-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm md:text-base text-foreground">ZAI</h2>
              </div>
              <LoginArea className="w-auto" />
            </div>
          </div>
        </div>
        
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
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onToggleSidebar}
                className="p-2 -ml-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="h-6 w-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm md:text-base text-foreground">ZAI</h2>
              </div>
              <LoginArea className="w-auto" />
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="p-6 md:p-8 text-center border-dashed max-w-md w-full">
            <div className="mb-4">
              <Sparkles className="h-12 w-12 md:h-16 md:w-16 mx-auto text-primary/50" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">
              Welcome to ZAI
            </h3>
            <p className="text-sm md:text-base text-muted-foreground mb-4">
              Please log in to start chatting with AI.
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
      {/* Header - Minimal like ChatGPT */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              <svg className="h-6 w-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <h2 className="font-semibold text-sm text-muted-foreground">ZAI</h2>
            </div>
            <div className="w-10" />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <div className="space-y-6 py-6 px-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="py-6">
              {messages.map((event, index) => {
                const isUser = event.pubkey === user.pubkey;
                const isLast = index === messages.length - 1;

                return (
                  <div
                    key={event.id}
                    className={`group px-4 py-6 ${!isUser ? 'bg-muted/30' : ''} hover:bg-accent/50 transition-colors`}
                  >
                    <div className="max-w-3xl mx-auto">
                      <div className="flex gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {isUser ? (
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                              <User className="h-5 w-5 text-primary-foreground" />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <Sparkles className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="font-semibold text-sm">
                            {isUser ? 'You' : 'ZAI'}
                          </div>
                          
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <NoteContent event={event} className="text-sm leading-relaxed" />
                          </div>

                          {/* Actions - Only show for AI messages */}
                          {!isUser && (
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(event.content)}
                                className="h-7 px-2"
                              >
                                <Copy className="h-3.5 w-3.5 mr-1.5" />
                                Copy
                              </Button>
                              {isLast && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => sendMessage(messages[messages.length - 2]?.content || '')}
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
              })}
            </div>
          ) : (
            // Empty state with example prompts
            <div className="flex items-center justify-center min-h-full p-6">
              <div className="max-w-2xl w-full space-y-8 text-center py-12">
                <div className="space-y-4">
                  <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold">How can I help you today?</h2>
                </div>

                {/* Example Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto">
                  {EXAMPLE_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleExampleClick(prompt)}
                      className="p-4 text-left border border-border rounded-xl hover:bg-accent transition-colors group"
                    >
                      <p className="text-sm text-muted-foreground group-hover:text-foreground">
                        {prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area - Sticky bottom */}
      <div className="sticky bottom-0 border-t border-border bg-background">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="relative">
            <div className="relative flex items-end gap-2 bg-muted/50 border border-border rounded-2xl p-3 focus-within:ring-2 focus-within:ring-primary/20">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message ZAI..."
                disabled={isSending}
                rows={1}
                className="flex-1 bg-transparent resize-none outline-none max-h-[200px] text-sm placeholder:text-muted-foreground disabled:opacity-50"
              />
              
              {isSending ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {/* TODO: Stop generation */}}
                  className="flex-shrink-0 h-8 w-8 p-0 rounded-lg"
                >
                  <StopCircle className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="flex-shrink-0 h-8 w-8 p-0 rounded-lg"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Button>
              )}
            </div>
          </div>
          
          <p className="text-xs text-center text-muted-foreground mt-2">
            ZAI can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}
