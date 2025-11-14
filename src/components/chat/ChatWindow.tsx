import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { MessageItem, type MessageItemRef } from '@/components/chat/MessageItem';
import { ThinkingIndicator } from '@/components/chat/ThinkingIndicator';
import { genUserName } from '@/lib/genUserName';

interface ChatWindowProps {
  targetPubkey: string | null;
  sessionId: string | null;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const EXAMPLE_PROMPTS = [
  "Explain quantum computing like I'm 12 years old",
  "Write a Python function to analyze data patterns",
  "Create a marketing strategy for a startup",
  "What are the latest trends in web development?",
  "Help me write a professional email",
  "Explain blockchain technology and its applications",
];

const AI_MODELS = [
  { id: 'zai-default', name: 'ZAI' },
  { id: 'zai-advanced', name: 'ZAI Advanced' },
  { id: 'zai-fast', name: 'ZAI Fast' },
] as const;

export function ChatWindow({ targetPubkey, sessionId, onToggleSidebar }: ChatWindowProps) {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const author = useAuthor(user?.pubkey || '');
  const { data: messages, isLoading } = useChatMessages(targetPubkey, sessionId || undefined);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(
    targetPubkey,
    sessionId ? { sessionId } : undefined
  );
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { logout } = useLoginActions();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('zai-default');
  const [isAITyping, setIsAITyping] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const previousMessageCountRef = useRef(0);
  const lastMessageRef = useRef<MessageItemRef>(null);

  // Helper function for scrolling to bottom
  const scrollToBottom = (smooth = true) => {
    if (!bottomRef.current) return;
    // After final render
    requestAnimationFrame(() => {
      bottomRef.current!.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
    });
  };

  // Track when user sends a message and bot responds
  useEffect(() => {
    if (!messages || !user || !targetPubkey) {
      setIsWaitingForResponse(false);
      return;
    }

    // Check if messages increased (new message arrived)
    const currentCount = messages.length;
    const previousCount = previousMessageCountRef.current;

    if (currentCount > previousCount) {
      // New message arrived
      const lastMessage = messages[messages.length - 1];
      
      // If last message is from bot, stop waiting
      if (lastMessage.pubkey === targetPubkey) {
        setIsWaitingForResponse(false);
      }
      // If last message is from user, start waiting
      else if (lastMessage.pubkey === user.pubkey) {
        setIsWaitingForResponse(true);
      }
    }

    previousMessageCountRef.current = currentCount;
  }, [messages, user, targetPubkey]);

  // Auto-scroll to bottom when new messages arrive or when thinking indicator shows
  useLayoutEffect(() => {
    scrollToBottom(true);
    // If content inside messages (images/code) loads with delay, small refresh:
    const t = setTimeout(() => scrollToBottom(false), 50);
    return () => clearTimeout(t);
  }, [messages, isWaitingForResponse]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSend = () => {
    if (!inputValue.trim() || isSending || isAITyping) return;
    
    // Set waiting for response immediately when user sends message
    setIsWaitingForResponse(true);
    
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

  const handleStop = () => {
    // Stop the typing animation immediately
    if (lastMessageRef.current) {
      lastMessageRef.current.stopTyping();
    }
    // Reset states
    setIsAITyping(false);
    setIsWaitingForResponse(false);
  };

  if (!targetPubkey) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl shadow-sm">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={onToggleSidebar}
                  className="p-2.5 -ml-2 hover:bg-accent/50 rounded-xl transition-all duration-200 flex-shrink-0 hover:scale-105 active:scale-95"
                  aria-label="Toggle sidebar"
                >
                  <svg className="h-5 w-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary shadow-lg">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-foreground">ZAI Assistant</h2>
                    <p className="text-xs text-muted-foreground">AI Chat on Nostr</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 text-sm font-medium hover:bg-accent/50 rounded-xl">
                      <Bot className="h-4 w-4" />
                      <span className="hidden sm:inline">GPT-4</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>AI Model</DropdownMenuLabel>
                    <DropdownMenuItem>
                      <Bot className="h-4 w-4 mr-2" />
                      GPT-4 Turbo
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bot className="h-4 w-4 mr-2" />
                      GPT-3.5 Turbo
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bot className="h-4 w-4 mr-2" />
                      Claude 3
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <LoginArea className="w-auto" />
              </div>
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
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-background to-muted/20">
      {/* Modern Header - ChatGPT Style */}
      <div className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onToggleSidebar}
                className="p-2.5 -ml-2 hover:bg-accent/50 rounded-xl transition-all duration-200 flex-shrink-0 hover:scale-105 active:scale-95"
                aria-label="Toggle sidebar"
              >
                <svg className="h-5 w-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Enhanced Model Selector */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary shadow-lg">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="px-4 py-2 h-auto text-left hover:bg-accent/50 rounded-xl transition-all duration-200">
                      <div className="flex flex-col items-start">
                        <span className="font-semibold text-sm text-foreground">
                          {AI_MODELS.find(m => m.id === selectedModel)?.name || 'ZAI'}
                        </span>
                        <span className="text-xs text-muted-foreground">AI Assistant</span>
                      </div>
                      <ChevronDown className="h-4 w-4 ml-2 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      AI Models
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {AI_MODELS.map((model) => (
                      <DropdownMenuItem
                        key={model.id}
                        onClick={() => setSelectedModel(model.id)}
                        className="cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-muted-foreground" />
                          <span>{model.name}</span>
                        </div>
                        {selectedModel === model.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Enhanced User Menu */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="rounded-xl hover:bg-accent/50 transition-all duration-200"
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-auto p-2 rounded-xl hover:bg-accent/50 transition-all duration-200">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                      <AvatarImage 
                        src={author.data?.metadata?.picture} 
                        alt={author.data?.metadata?.name || genUserName(user.pubkey)}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 shadow-xl">
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-3 p-2">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                        <AvatarImage 
                          src={author.data?.metadata?.picture} 
                          alt={author.data?.metadata?.name || genUserName(user.pubkey)}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">
                          {author.data?.metadata?.name || genUserName(user.pubkey)}
                        </span>
                        {author.data?.metadata?.nip05 && (
                          <span className="text-xs text-muted-foreground">
                            {author.data.metadata.nip05}
                          </span>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-xs text-muted-foreground">Online</span>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="flex items-center gap-3 px-4 py-3">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span>Settings & Privacy</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-4 py-3">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                    <span>AI Preferences</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="flex items-center gap-3 px-4 py-3 text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
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
            <div className="space-y-8 py-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="max-w-4xl mx-auto px-4 md:px-6">
                  <div className="flex gap-4 md:gap-6">
                    <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-4 w-20" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                  <span className="text-sm">Loading conversation...</span>
                </div>
              </div>
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="py-6">
              {messages.map((event, index) => {
                const isUser = event.pubkey === user.pubkey;
                const isLast = index === messages.length - 1;

                return (
                  <MessageItem
                    key={event.id}
                    ref={isLast && !isUser ? lastMessageRef : null}
                    event={event}
                    isUser={isUser}
                    isLast={isLast}
                    onCopy={handleCopy}
                    onTypingChange={setIsAITyping}
                  />
                );
              })}
              
              {/* Show thinking indicator when waiting for bot response */}
              {isWaitingForResponse && !isAITyping && <ThinkingIndicator />}
            </div>
          ) : (
            // Professional Welcome Screen
            <div className="flex items-center justify-center min-h-full p-6">
              <div className="max-w-4xl w-full space-y-12 py-16">
                {/* Hero Section */}
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="inline-flex h-20 w-20 rounded-2xl bg-primary items-center justify-center shadow-lg transition-colors">
                      <Bot className="h-10 w-10 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                      Hello! I'm ZAI
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                      Your AI assistant on Nostr. I can help you with writing, coding, analysis, and much more.
                    </p>
                  </div>
                </div>

                {/* Nostr Information Section */}
                <div className="bg-muted/50 rounded-xl p-6 border border-border/50 max-w-3xl mx-auto">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Powered by Nostr
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Use ZAI Across the Nostr Network</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="text-center p-4 bg-background/50 rounded-lg border border-border/30">
                        <div className="w-8 h-8 bg-primary/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <h4 className="font-medium text-sm mb-1">Direct Messages</h4>
                        <p className="text-xs text-muted-foreground">Message me privately from any Nostr client</p>
                      </div>
                      <div className="text-center p-4 bg-background/50 rounded-lg border border-border/30">
                        <div className="w-8 h-8 bg-primary/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                        <h4 className="font-medium text-sm mb-1">Mentions</h4>
                        <p className="text-xs text-muted-foreground">Tag me in public notes for assistance</p>
                      </div>
                      <div className="text-center p-4 bg-background/50 rounded-lg border border-border/30">
                        <div className="w-8 h-8 bg-primary/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h4 className="font-medium text-sm mb-1">Bot Replies</h4>
                        <p className="text-xs text-muted-foreground">I respond to replies on my posts</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Capabilities Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                  <Card className="group p-6 hover:bg-muted/30 transition-colors border-border/50">
                    <div className="space-y-4">
                      <div className="inline-flex h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                        <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-base mb-2">Creative Writing</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Generate stories, poems, articles, and creative content tailored to your style
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="group p-6 hover:bg-muted/30 transition-colors border-border/50">
                    <div className="space-y-4">
                      <div className="inline-flex h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 items-center justify-center">
                        <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-base mb-2">Code Assistant</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Debug, explain, and write code in any programming language with best practices
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="group p-6 hover:bg-muted/30 transition-colors border-border/50">
                    <div className="space-y-4">
                      <div className="inline-flex h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 items-center justify-center">
                        <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-base mb-2">Analysis & Research</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Deep analysis, research assistance, and explanations on complex topics
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="group p-6 hover:bg-muted/30 transition-colors border-border/50">
                    <div className="space-y-4">
                      <div className="inline-flex h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 items-center justify-center">
                        <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-base mb-2">Problem Solving</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Strategic thinking and solutions for business, technical, and personal challenges
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="group p-6 hover:bg-muted/30 transition-colors border-border/50">
                    <div className="space-y-4">
                      <div className="inline-flex h-10 w-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 items-center justify-center">
                        <svg className="h-5 w-5 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-base mb-2">Learning Support</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Educational content, explanations, and study assistance across all subjects
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="group p-6 hover:bg-muted/30 transition-colors border-border/50">
                    <div className="space-y-4">
                      <div className="inline-flex h-10 w-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 items-center justify-center">
                        <svg className="h-5 w-5 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-base mb-2">Conversation</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Natural conversations on any topic with thoughtful and engaging responses
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Example Prompts */}
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Get started with these examples</h3>
                    <p className="text-sm text-muted-foreground">Click on any prompt to begin a conversation</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                    {EXAMPLE_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleExampleClick(prompt)}
                        className="group p-4 text-left border border-border/50 rounded-lg hover:bg-muted/50 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center transition-colors">
                            <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground transition-colors leading-relaxed">
                              {prompt}
                            </p>
                            <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs text-primary font-medium">Click to try</span>
                              <svg className="h-3 w-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
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
              
              {isSending || isAITyping || isWaitingForResponse ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleStop}
                  className="flex-shrink-0 h-9 w-9 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Stop generating"
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
