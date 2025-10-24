import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useToast } from '@/hooks/useToast';
import { useTheme } from '@/hooks/useTheme';
import { useLoginActions } from '@/hooks/useLoginActions';
import { LoginArea } from '@/components/auth/LoginArea';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bot, User, StopCircle, Settings, Moon, Sun, LogOut, ChevronDown, Check } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageItem } from '@/components/chat/MessageItem';
import { genUserName } from '@/lib/genUserName';

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

const AI_MODELS = [
  { id: 'zai-default', name: 'ZAI' },
  { id: 'zai-advanced', name: 'ZAI Advanced' },
  { id: 'zai-fast', name: 'ZAI Fast' },
] as const;

export function ChatWindow({ targetPubkey, onToggleSidebar }: ChatWindowProps) {
  const { user } = useCurrentUser();
  const author = useAuthor(user?.pubkey || '');
  const { data: messages, isLoading } = useChatMessages(targetPubkey);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(targetPubkey);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { logout } = useLoginActions();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('zai-default');
  const [isAITyping, setIsAITyping] = useState(false);

  // Helper function for scrolling to bottom
  const scrollToBottom = (smooth = true) => {
    if (!bottomRef.current) return;
    // After final render
    requestAnimationFrame(() => {
      bottomRef.current!.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
    });
  };

  // Auto-scroll to bottom when new messages arrive
  useLayoutEffect(() => {
    scrollToBottom(true);
    // If content inside messages (images/code) loads with delay, small refresh:
    const t = setTimeout(() => scrollToBottom(false), 50);
    return () => clearTimeout(t);
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSend = () => {
    if (!inputValue.trim() || isSending || isAITyping) return;
    sendMessage(inputValue.trim());
    setInputValue('');
    scrollToBottom(true);
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
                aria-label="Toggle sidebar"
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
                aria-label="Toggle sidebar"
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
              <Bot className="h-12 w-12 md:h-16 md:w-16 mx-auto text-primary/50" />
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
      {/* Header - With Model Selector like ChatGPT */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleSidebar}
                className="p-2 -ml-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
                aria-label="Toggle sidebar"
              >
                <svg className="h-6 w-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Model Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-3 py-1.5 text-sm font-semibold bg-muted hover:bg-accent rounded-lg transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20">
                    {AI_MODELS.find(m => m.id === selectedModel)?.name || 'ZAI'}
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Select Model</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {AI_MODELS.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{model.name}</span>
                        {selectedModel === model.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="h-8 w-8 rounded-full hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/20"
                    aria-label="User menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={author.data?.metadata?.picture} 
                        alt={author.data?.metadata?.name || genUserName(user.pubkey)}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={author.data?.metadata?.picture} 
                          alt={author.data?.metadata?.name || genUserName(user.pubkey)}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {author.data?.metadata?.name || genUserName(user.pubkey)}
                        </span>
                        {author.data?.metadata?.nip05 && (
                          <span className="text-xs text-muted-foreground">
                            {author.data.metadata.nip05}
                          </span>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                    {theme === 'light' ? (
                      <Moon className="mr-2 h-4 w-4" />
                    ) : (
                      <Sun className="mr-2 h-4 w-4" />
                    )}
                    <span>Toggle Theme</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="max-w-3xl mx-auto pb-28 px-3 md:px-4">
          {isLoading ? (
            <div className="space-y-6 py-6">
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
                  <MessageItem
                    key={event.id}
                    event={event}
                    isUser={isUser}
                    isLast={isLast}
                    onCopy={handleCopy}
                    onTypingChange={setIsAITyping}
                  />
                );
              })}
            </div>
          ) : (
            // Empty state with capabilities and example prompts
            <div className="flex items-center justify-center min-h-full p-6">
              <div className="max-w-3xl w-full space-y-12 py-12">
                {/* Main Header */}
                <div className="space-y-4 text-center">
                  <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center">
                    <Bot className="h-8 w-8 text-white animate-pulse" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold">How can I help you today?</h2>
                  <p className="text-muted-foreground">Ask me anything, and I'll do my best to assist you</p>
                </div>

                {/* Capabilities */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  <Card className="p-4 text-center space-y-2 border-dashed hover:border-solid hover:bg-accent/50 transition-all">
                    <div className="inline-flex h-10 w-10 rounded-lg bg-blue-500/10 items-center justify-center mx-auto">
                      <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold">Creative Writing</h3>
                    <p className="text-xs text-muted-foreground">Generate stories, poems, and creative content</p>
                  </Card>
                  
                  <Card className="p-4 text-center space-y-2 border-dashed hover:border-solid hover:bg-accent/50 transition-all">
                    <div className="inline-flex h-10 w-10 rounded-lg bg-green-500/10 items-center justify-center mx-auto">
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <h3 className="font-semibold">Code Assistant</h3>
                    <p className="text-xs text-muted-foreground">Debug, explain, and write code in any language</p>
                  </Card>
                  
                  <Card className="p-4 text-center space-y-2 border-dashed hover:border-solid hover:bg-accent/50 transition-all">
                    <div className="inline-flex h-10 w-10 rounded-lg bg-purple-500/10 items-center justify-center mx-auto">
                      <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="font-semibold">Learning & Research</h3>
                    <p className="text-xs text-muted-foreground">Explain concepts and answer questions</p>
                  </Card>
                </div>

                {/* Example Prompts */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground text-center">Try asking:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {EXAMPLE_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleExampleClick(prompt)}
                        className="p-4 text-left border border-border rounded-xl hover:bg-accent hover:border-primary/50 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <p className="text-sm text-muted-foreground group-hover:text-foreground">
                            {prompt}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Sentinel for auto-scroll */}
          <div ref={bottomRef} className="h-px scroll-mb-28" />
        </div>
      </div>

      {/* Input Area - Sticky bottom */}
      <div className="sticky bottom-0 border-t border-border bg-background">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="relative">
            <div className="relative flex items-center gap-2 bg-muted/50 border border-border rounded-2xl p-3 focus-within:ring-2 focus-within:ring-primary/20">
              <textarea
                ref={textareaRef}
                name="message"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isAITyping ? "ZAI is typing..." : "Message ZAI..."}
                disabled={isSending || isAITyping}
                rows={1}
                className="flex-1 bg-transparent resize-none outline-none max-h-[200px] text-sm placeholder:text-muted-foreground disabled:opacity-50"
              />
              
              {isSending || isAITyping ? (
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
                  disabled={!inputValue.trim() || isAITyping}
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
