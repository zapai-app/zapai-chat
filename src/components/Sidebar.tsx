import { useState } from 'react';
import { LoginArea } from '@/components/auth/LoginArea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Plus, 
  Sparkles,
  Settings,
  PanelLeftClose,
  Menu,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  onNewChat?: () => void;
}

export function Sidebar({ isOpen = true, onToggle, onNewChat }: SidebarProps) {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [conversations] = useState<Array<{ id: string; title: string; time: string }>>([
    // Placeholder for future conversation history
  ]);
  
  // Mock balance - در production باید از API بیاید
  const balance = 0;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed md:relative inset-y-0 left-0 z-50 h-full",
        "bg-black border-r border-white/[0.08]",
        "transition-all duration-300 ease-in-out",
        isOpen ? "w-[280px]" : "w-0 md:w-0 border-0",
        // Mobile: slide in/out
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Content wrapper - only visible when open */}
        <div className={cn(
          "flex flex-col h-full w-[280px]",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.08] flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex-shrink-0">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-white truncate">ZAI Chat</h1>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-10 w-10 hover:bg-white/[0.08] flex-shrink-0"
              title="Close sidebar"
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 flex flex-col min-h-0">
          {/* New Chat button */}
          <div className="p-3 border-b border-white/[0.08] flex-shrink-0">
            <Button 
              onClick={() => {
                if (onNewChat) onNewChat();
                navigate('/');
              }}
              className="w-full justify-start gap-3 h-11 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium"
            >
              <Plus className="h-5 w-5" />
              <span>New chat</span>
            </Button>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1 px-3">
            {conversations.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-600" />
                <p className="text-sm text-gray-500">No conversations yet</p>
                <p className="text-xs text-gray-600 mt-1">Start a new chat to begin</p>
              </div>
            ) : (
              <div className="space-y-1 py-2">
                {conversations.map((conv) => (
                  <Button
                    key={conv.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-3 px-3 hover:bg-white/[0.08] text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <MessageSquare className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                        <p className="text-sm font-medium text-white truncate">
                          {conv.title}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">{conv.time}</p>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Bottom Section */}
          <div className="border-t border-white/[0.08] p-3 space-y-2 flex-shrink-0">
            {/* Wallet Button - Only show if user is logged in */}
            {user && (
              <Button
                variant="ghost"
                onClick={() => navigate('/wallet')}
                className="w-full justify-between gap-3 h-10 hover:bg-white/[0.08] text-gray-300 hover:text-white"
              >
                <div className="flex items-center gap-3">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm">Wallet</span>
                </div>
                <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                  {balance.toLocaleString()} sats
                </Badge>
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={() => navigate('/settings')}
              className="w-full justify-start gap-3 h-10 hover:bg-white/[0.08] text-gray-300 hover:text-white"
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm">Settings</span>
            </Button>
            
            <LoginArea className="w-full" />
          </div>
        </div>
        </div>
      </div>
    </>
  );
}

// Mobile Menu Button Component
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="md:hidden h-10 w-10 hover:bg-white/[0.08] text-white"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
