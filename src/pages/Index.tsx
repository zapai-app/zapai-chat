import { useSeoMeta } from '@unhead/react';
import { useMemo, useState, useEffect } from 'react';
import { nip19 } from 'nostr-tools';
import { Sidebar } from '@/components/Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';

const Index = () => {
  // Sidebar open by default on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Set sidebar open by default on desktop
  useEffect(() => {
    const isDesktop = window.innerWidth >= 768;
    setSidebarOpen(isDesktop);
  }, []);

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
    <div className="h-screen flex overflow-hidden bg-black">
      {/* Sidebar - Responsive with drawer for mobile */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatWindow 
          targetPubkey={targetPubkey}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isSidebarOpen={sidebarOpen}
        />
      </div>
    </div>
  );
};

export default Index;
