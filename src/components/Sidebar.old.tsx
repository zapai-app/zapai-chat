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
  
  // Mock balance - TODO: fetch from API in production
  const balance = 0;

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
        // Mobile: slide in/out with smooth cubic-bezier
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
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-sidebar-primary flex-shrink-0 transition-transform duration-300 hover:scale-110 hover:rotate-12">
                <Sparkles className="h-4 w-4 text-sidebar-primary-foreground animate-pulse" />
              </div>
              <h1 className="text-lg font-bold text-sidebar-foreground truncate">ZAI Chat</h1>
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
          {/* New Chat button with smooth hover animation */}
          <div className="p-3 border-b border-sidebar-border flex-shrink-0">
            <Button 
              onClick={() => {
                if (onNewChat) onNewChat();
                navigate('/');
              }}
              className="w-full justify-start gap-3 h-11 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 border border-sidebar-border text-sidebar-foreground font-medium transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
              <span>New chat</span>
            </Button>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1 px-3">
            {conversations.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Start a new chat to begin</p>
              </div>
            ) : (
              <div className="space-y-1 py-2">
                {conversations.map((conv) => (
                  <Button
                    key={conv.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-3 px-3 hover:bg-sidebar-accent text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm font-medium text-sidebar-foreground truncate">
                          {conv.title}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">{conv.time}</p>
                    </div>
                  </Button>
                ))}
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
      className="md:hidden h-10 w-10"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
