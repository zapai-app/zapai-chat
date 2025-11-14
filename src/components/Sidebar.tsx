import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  Plus, 
  Bot,
  Settings,
  PanelLeftClose,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Wallet,
  Archive,
  Star,
  Download,
  Share2,
  MoreHorizontal,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useUpdateChatSession } from '@/hooks/useUpdateChatSession';
import { useDeleteChatSession } from '@/hooks/useDeleteChatSession';
import { useBalance } from '@/hooks/useBalance';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  onNewChat?: () => void;
  activeSessionId?: string | null;
  onSessionSelect?: (sessionId: string) => void;
}

interface Conversation {
  id: string;
  title: string;
  timestamp: number;
  preview?: string;
  eventId: string;
}

export function Sidebar({ 
  isOpen = true, 
  onToggle, 
  onNewChat,
  activeSessionId,
  onSessionSelect 
}: SidebarProps) {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { data: sessions, isLoading: sessionsLoading } = useChatSessions();
  const { mutate: updateSession } = useUpdateChatSession();
  const { mutate: deleteSession } = useDeleteChatSession();
  const { data: balanceData } = useBalance();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [todayOpen, setTodayOpen] = useState(true);
  const [yesterdayOpen, setYesterdayOpen] = useState(true);
  const [thisWeekOpen, setThisWeekOpen] = useState(true);
  const [olderOpen, setOlderOpen] = useState(false);
  
  // Get balance from real-time subscription
  const balance = balanceData?.totalSats ?? 0;

  // Convert chat sessions to conversations format
  const conversations: Conversation[] = (sessions || []).map(session => ({
    id: session.id,
    title: session.name,
    timestamp: session.lastEditedAt * 1000, // Convert to milliseconds
    preview: undefined,
    eventId: session.event.id,
  }));

  const handleDeleteConversation = (id: string, eventId: string) => {
    deleteSession({ sessionId: id, eventId });
  };

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = (id: string) => {
    updateSession({ sessionId: id, newName: editTitle });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.preview?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations by time with improved logic
  const now = Date.now();
  const oneDay = 86400000;
  const oneWeek = 604800000;
  const oneMonth = 2592000000;

  const today = filteredConversations.filter(c => 
    now - c.timestamp < oneDay
  ).sort((a, b) => b.timestamp - a.timestamp);
  
  const yesterday = filteredConversations.filter(c => 
    now - c.timestamp >= oneDay && now - c.timestamp < 2 * oneDay
  ).sort((a, b) => b.timestamp - a.timestamp);
  
  const thisWeek = filteredConversations.filter(c => 
    now - c.timestamp >= 2 * oneDay && now - c.timestamp < oneWeek
  ).sort((a, b) => b.timestamp - a.timestamp);
  
  const thisMonth = filteredConversations.filter(c => 
    now - c.timestamp >= oneWeek && now - c.timestamp < oneMonth
  ).sort((a, b) => b.timestamp - a.timestamp);
  
  const older = filteredConversations.filter(c => 
    now - c.timestamp >= oneMonth
  ).sort((a, b) => b.timestamp - a.timestamp);

  return (
    <>
      {/* Mobile Overlay with smooth fade */}
      <div 
        className={cn(
          "md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40",
          "transition-opacity duration-300 ease-out",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onToggle}
      />

      {/* Sidebar with professional animations */}
      <div className={cn(
        "fixed md:relative inset-y-0 left-0 z-50 h-full",
        "bg-sidebar border-r border-sidebar-border",
        "transition-all duration-300 ease-out",
        "will-change-transform",
        isOpen ? "w-[280px]" : "w-0 md:w-0 border-0",
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Content wrapper with staggered fade-in */}
        <div className={cn(
          "flex flex-col h-full w-[280px]",
          "transition-opacity duration-200 ease-out",
          isOpen ? "opacity-100 delay-100" : "opacity-0 pointer-events-none"
        )}>
          {/* Professional Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border flex-shrink-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex-shrink-0">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold text-sidebar-foreground truncate">ZAI</h1>
                <p className="text-xs text-sidebar-foreground/60">AI Assistant</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-10 w-10 hover:bg-sidebar-accent flex-shrink-0 transition-colors rounded-lg"
              title="Close sidebar"
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Professional New Chat Button */}
            <div className="p-4 flex-shrink-0">
              <Button 
                onClick={() => {
                  if (onNewChat) onNewChat();
                  navigate('/');
                }}
                className="w-full justify-start gap-3 h-11 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors border-0"
              >
                <Plus className="h-4 w-4" />
                <span>New Chat</span>
              </Button>
            </div>

            {/* Search Bar */}
            <div className="px-4 pb-4 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="pl-10 h-9 bg-sidebar-accent border-sidebar-border rounded-lg focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1 px-3">
              {sessionsLoading ? (
                <div className="py-4 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="px-3">
                      <div className="flex gap-3 items-start">
                        <div className="h-8 w-8 bg-sidebar-accent/50 rounded-lg animate-pulse flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-sidebar-accent/50 rounded animate-pulse w-3/4" />
                          <div className="h-2 bg-sidebar-accent/30 rounded animate-pulse w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="py-12 text-center px-4">
                  <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-sidebar-accent to-sidebar-accent/50 items-center justify-center mb-4 shadow-sm">
                    <MessageSquare className="h-8 w-8 text-sidebar-foreground/50" />
                  </div>
                  <h3 className="font-semibold text-sidebar-foreground mb-2">
                    {searchQuery ? 'No matches found' : 'No conversations yet'}
                  </h3>
                  <p className="text-sm text-sidebar-foreground/60 leading-relaxed max-w-xs mx-auto">
                    {searchQuery ? 'Try adjusting your search terms or browse all conversations' : 'Start your first conversation with ZAI to see it appear here'}
                  </p>
                  {!searchQuery && (
                    <div className="mt-4">
                      <Button
                        onClick={() => onNewChat?.()}
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Start Chatting
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  {/* Today - Always expanded */}
                  {today.length > 0 && (
                    <Collapsible open={todayOpen} onOpenChange={setTodayOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 hover:bg-sidebar-accent/50 rounded-lg group transition-colors">
                        <h3 className="text-xs font-semibold text-sidebar-foreground/70 group-hover:text-sidebar-foreground">Today</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-sidebar-accent/50 text-sidebar-foreground/60">
                            {today.length}
                          </Badge>
                          <ChevronDown className={cn("h-4 w-4 text-sidebar-foreground/50 transition-transform", todayOpen && "rotate-180")} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1 mt-2">
                        {today.map((conv) => (
                          <ConversationItem
                            key={conv.id}
                            conversation={conv}
                            isActive={activeSessionId === conv.id}
                            isEditing={editingId === conv.id}
                            editTitle={editTitle}
                            setEditTitle={setEditTitle}
                            onStartEdit={handleStartEdit}
                            onSaveEdit={handleSaveEdit}
                            onCancelEdit={handleCancelEdit}
                            onDelete={handleDeleteConversation}
                            onClick={() => onSessionSelect?.(conv.id)}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Yesterday */}
                  {yesterday.length > 0 && (
                    <Collapsible open={yesterdayOpen} onOpenChange={setYesterdayOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 hover:bg-sidebar-accent/50 rounded-lg group transition-colors">
                        <h3 className="text-xs font-semibold text-sidebar-foreground/70 group-hover:text-sidebar-foreground">Yesterday</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-sidebar-accent/50 text-sidebar-foreground/60">
                            {yesterday.length}
                          </Badge>
                          <ChevronDown className={cn("h-4 w-4 text-sidebar-foreground/50 transition-transform", yesterdayOpen && "rotate-180")} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1 mt-2">
                        {yesterday.map((conv) => (
                          <ConversationItem
                            key={conv.id}
                            conversation={conv}
                            isActive={activeSessionId === conv.id}
                            isEditing={editingId === conv.id}
                            editTitle={editTitle}
                            setEditTitle={setEditTitle}
                            onStartEdit={handleStartEdit}
                            onSaveEdit={handleSaveEdit}
                            onCancelEdit={handleCancelEdit}
                            onDelete={handleDeleteConversation}
                            onClick={() => onSessionSelect?.(conv.id)}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* This Week */}
                  {thisWeek.length > 0 && (
                    <Collapsible open={thisWeekOpen} onOpenChange={setThisWeekOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 hover:bg-sidebar-accent/50 rounded-lg group transition-colors">
                        <h3 className="text-xs font-semibold text-sidebar-foreground/70 group-hover:text-sidebar-foreground">This Week</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-sidebar-accent/50 text-sidebar-foreground/60">
                            {thisWeek.length}
                          </Badge>
                          <ChevronDown className={cn("h-4 w-4 text-sidebar-foreground/50 transition-transform", thisWeekOpen && "rotate-180")} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1 mt-2">
                        {thisWeek.map((conv) => (
                          <ConversationItem
                            key={conv.id}
                            conversation={conv}
                            isActive={activeSessionId === conv.id}
                            isEditing={editingId === conv.id}
                            editTitle={editTitle}
                            setEditTitle={setEditTitle}
                            onStartEdit={handleStartEdit}
                            onSaveEdit={handleSaveEdit}
                            onCancelEdit={handleCancelEdit}
                            onDelete={handleDeleteConversation}
                            onClick={() => onSessionSelect?.(conv.id)}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* This Month */}
                  {thisMonth.length > 0 && (
                    <Collapsible open={olderOpen} onOpenChange={setOlderOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 hover:bg-sidebar-accent/50 rounded-lg group transition-colors">
                        <h3 className="text-xs font-semibold text-sidebar-foreground/70 group-hover:text-sidebar-foreground">This Month</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-sidebar-accent/50 text-sidebar-foreground/60">
                            {thisMonth.length}
                          </Badge>
                          <ChevronDown className={cn("h-4 w-4 text-sidebar-foreground/50 transition-transform", olderOpen && "rotate-180")} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1 mt-2">
                        {thisMonth.map((conv) => (
                          <ConversationItem
                            key={conv.id}
                            conversation={conv}
                            isActive={activeSessionId === conv.id}
                            isEditing={editingId === conv.id}
                            editTitle={editTitle}
                            setEditTitle={setEditTitle}
                            onStartEdit={handleStartEdit}
                            onSaveEdit={handleSaveEdit}
                            onCancelEdit={handleCancelEdit}
                            onDelete={handleDeleteConversation}
                            onClick={() => onSessionSelect?.(conv.id)}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Older - Collapsed by default */}
                  {older.length > 0 && (
                    <Collapsible open={false} onOpenChange={() => {}}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 hover:bg-sidebar-accent/50 rounded-lg group transition-colors">
                        <h3 className="text-xs font-semibold text-sidebar-foreground/70 group-hover:text-sidebar-foreground">Older</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-sidebar-accent/50 text-sidebar-foreground/60">
                            {older.length}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-sidebar-foreground/50" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1 mt-2">
                        {older.map((conv) => (
                          <ConversationItem
                            key={conv.id}
                            conversation={conv}
                            isActive={activeSessionId === conv.id}
                            isEditing={editingId === conv.id}
                            editTitle={editTitle}
                            setEditTitle={setEditTitle}
                            onStartEdit={handleStartEdit}
                            onSaveEdit={handleSaveEdit}
                            onCancelEdit={handleCancelEdit}
                            onDelete={handleDeleteConversation}
                            onClick={() => onSessionSelect?.(conv.id)}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Bottom Section */}
            <div className="border-t border-sidebar-border p-3 space-y-1 flex-shrink-0">
              {/* Professional Wallet Button */}
              {user && (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/wallet')}
                  className="w-full justify-between gap-3 h-10 hover:bg-sidebar-accent text-sidebar-foreground transition-colors px-3"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-4 w-4" />
                    <span className="text-sm font-medium">Wallet</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-sidebar-accent/50 px-2.5 py-1 rounded-md">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    <span className="text-xs font-medium text-sidebar-foreground">
                      {balance.toLocaleString()}
                    </span>
                    <span className="text-xs text-sidebar-foreground/60">sats</span>
                  </div>
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => navigate('/settings')}
                className="w-full justify-start gap-3 h-10 hover:bg-sidebar-accent text-sidebar-foreground transition-colors px-3"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Conversation Item Component
function ConversationItem({
  conversation,
  isActive,
  isEditing,
  editTitle,
  setEditTitle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onClick,
}: {
  conversation: Conversation;
  isActive?: boolean;
  isEditing: boolean;
  editTitle: string;
  setEditTitle: (title: string) => void;
  onStartEdit: (conv: Conversation) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDelete: (id: string, eventId: string) => void;
  onClick?: () => void;
}) {
  return (
    <div className="group relative">
      {isEditing ? (
        <div className="flex items-center gap-1 px-3 py-2">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit(conversation.id);
              if (e.key === 'Escape') onCancelEdit();
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSaveEdit(conversation.id)}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancelEdit}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="relative group/conversation">
          <Button
            variant="ghost"
            onClick={onClick}
            className={cn(
              "w-full justify-start h-auto py-2.5 px-3 text-left transition-colors rounded-lg hover:bg-sidebar-accent",
              isActive && "bg-primary/10 border border-primary/20 text-primary-foreground"
            )}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={cn(
                "flex items-center justify-center h-7 w-7 rounded-md flex-shrink-0 transition-colors",
                isActive ? "bg-primary/20 text-primary" : "bg-sidebar-accent/50 text-sidebar-foreground/60"
              )}>
                <MessageSquare className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className={cn(
                  "text-sm font-medium truncate transition-colors",
                  isActive ? "text-primary" : "text-sidebar-foreground"
                )}>
                  {conversation.title}
                </p>
                <p className="text-xs text-sidebar-foreground/60 mt-0.5">
                  {new Date(conversation.timestamp).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </Button>
          
          {/* Action Buttons */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/conversation:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md hover:bg-sidebar-accent transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEdit(conversation);
                  }}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Add to favorites
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conversation.id, conversation.eventId);
                  }}
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  );
}
