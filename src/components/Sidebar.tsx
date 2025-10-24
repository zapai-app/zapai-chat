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
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useUpdateChatSession } from '@/hooks/useUpdateChatSession';
import { useDeleteChatSession } from '@/hooks/useDeleteChatSession';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  // Mock balance - TODO: fetch from API in production
  const balance = 0;

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

  // Group conversations by time
  const today = filteredConversations.filter(c => 
    Date.now() - c.timestamp < 86400000
  );
  const yesterday = filteredConversations.filter(c => 
    Date.now() - c.timestamp >= 86400000 && Date.now() - c.timestamp < 172800000
  );
  const older = filteredConversations.filter(c => 
    Date.now() - c.timestamp >= 172800000
  );

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
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-sidebar-border flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 transition-transform duration-300 hover:scale-110">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-sidebar-foreground truncate">ZAI</h1>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-10 w-10 hover:bg-sidebar-accent flex-shrink-0 transition-all duration-200 ease-out hover:scale-110 active:scale-95"
              title="Close sidebar"
            >
              <PanelLeftClose className="h-5 w-5 transition-transform duration-200" />
            </Button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* New Chat button */}
            <div className="p-3 border-b border-sidebar-border flex-shrink-0">
              <Button 
                onClick={() => {
                  if (onNewChat) onNewChat();
                  navigate('/');
                }}
                className="w-full justify-start gap-3 h-11 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 border border-sidebar-border text-sidebar-foreground font-medium transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-5 w-5" />
                <span>New chat</span>
              </Button>
            </div>

            {/* Search Bar */}
            <div className="p-3 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="pl-9 h-9 bg-sidebar-accent border-sidebar-border"
                />
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1 px-3">
              {sessionsLoading ? (
                <div className="py-2 space-y-2">
                  <div className="h-12 bg-sidebar-accent rounded-lg animate-pulse" />
                  <div className="h-12 bg-sidebar-accent rounded-lg animate-pulse" />
                  <div className="h-12 bg-sidebar-accent rounded-lg animate-pulse" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="py-8 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {searchQuery ? 'Try a different search' : 'Start a new chat to begin'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6 py-2">
                  {/* Today */}
                  {today.length > 0 && (
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold text-muted-foreground px-3 mb-2">Today</h3>
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
                    </div>
                  )}

                  {/* Yesterday */}
                  {yesterday.length > 0 && (
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold text-muted-foreground px-3 mb-2">Yesterday</h3>
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
                    </div>
                  )}

                  {/* Previous 7 Days */}
                  {older.length > 0 && (
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold text-muted-foreground px-3 mb-2">Previous 7 Days</h3>
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
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Bottom Section with smooth transitions */}
            <div className="border-t border-sidebar-border p-3 space-y-2 flex-shrink-0">
              {/* Wallet Button - Only show if user is logged in */}
              {user && (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/wallet')}
                  className="w-full justify-between gap-3 h-10 hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200 ease-out hover:pl-4"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
                    <span className="text-sm">Wallet</span>
                  </div>
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-0 transition-all duration-200 hover:scale-105">
                    {balance.toLocaleString()} sats
                  </Badge>
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => navigate('/settings')}
                className="w-full justify-start gap-3 h-10 hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200 ease-out hover:pl-4"
              >
                <Settings className="h-4 w-4 transition-transform duration-200 hover:rotate-90" />
                <span className="text-sm">Settings</span>
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
        <div className="relative">
          <Button
            variant="ghost"
            onClick={onClick}
            className={cn(
              "w-full justify-start h-auto py-2.5 px-3 hover:bg-sidebar-accent text-left group/item",
              isActive && "bg-sidebar-accent"
            )}
          >
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {conversation.title}
                </p>
              </div>
            </div>
          </Button>
          
          {/* Action buttons - show on hover */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-sidebar pointer-events-none group-hover:pointer-events-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit(conversation);
              }}
              className="h-7 w-7 p-0 hover:bg-sidebar-accent"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conversation.id, conversation.eventId);
              }}
              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
