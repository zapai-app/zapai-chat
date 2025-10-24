import { useSeoMeta } from '@unhead/react';
import { useMemo, useState, useEffect } from 'react';
import { nip19 } from 'nostr-tools';
import { Sidebar } from '@/components/Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { NewChatSessionDialog } from '@/components/chat/NewChatSessionDialog';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const Index = () => {
  const { user } = useCurrentUser();
  const { data: sessions, isLoading: sessionsLoading } = useChatSessions();
  
  // Sidebar open by default on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Active session state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Dialog state for creating new session
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);

  // Set sidebar open by default on desktop
  useEffect(() => {
    const isDesktop = window.innerWidth >= 768;
    setSidebarOpen(isDesktop);
  }, []);

  // When sessions load, set active session or show dialog if no sessions exist
  useEffect(() => {
    // Only proceed if user is logged in and sessions have finished loading
    if (!user || sessionsLoading) return;

    if (sessions && sessions.length > 0) {
      // Set the most recent session as active if no session is selected
      if (!activeSessionId) {
        setActiveSessionId(sessions[0].id);
      }
    } else if (sessions && sessions.length === 0 && user) {
      // No sessions exist and user is logged in, show dialog to create one
      setShowNewSessionDialog(true);
    }
  }, [sessions, sessionsLoading, user, activeSessionId]);

  useSeoMeta({
    title: 'ZAI - AI Chat on Nostr',
    description: 'Chat with AI on Nostr. Encrypted conversations with Lightning payments.',
  });

  // Get target pubkey from environment variable
  const targetPubkey = useMemo(() => {
    const envPubkey = import.meta.env.VITE_TARGET_PUBKEY;
    
    if (!envPubkey) {
      return null;
    }

    // If it's already in hex format, return it
    if (envPubkey.match(/^[0-9a-f]{64}$/i)) {
      return envPubkey;
    }

    // Try to decode from npub format
    try {
      const decoded = nip19.decode(envPubkey);
      if (decoded.type === 'npub' && typeof decoded.data === 'string') {
        return decoded.data;
      }
    } catch {
      console.error('Invalid VITE_TARGET_PUBKEY format. Use hex or npub format.');
    }

    return null;
  }, []);

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* New Chat Session Dialog - Only show if user is logged in */}
      {user && (
        <NewChatSessionDialog
          open={showNewSessionDialog}
          onOpenChange={setShowNewSessionDialog}
          onSessionCreated={(sessionId) => {
            setActiveSessionId(sessionId);
          }}
        />
      )}

      {/* Sidebar - Responsive with drawer for mobile */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeSessionId={activeSessionId}
        onSessionSelect={(sessionId) => setActiveSessionId(sessionId)}
        onNewChat={() => setShowNewSessionDialog(true)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatWindow 
          targetPubkey={targetPubkey}
          sessionId={activeSessionId}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isSidebarOpen={sidebarOpen}
        />
      </div>
    </div>
  );
};

export default Index;
