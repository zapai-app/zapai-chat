import { useSeoMeta } from '@unhead/react';
import { useMemo } from 'react';
import { nip19 } from 'nostr-tools';
import { Sidebar } from '@/components/Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';

const Index = () => {
  useSeoMeta({
    title: 'ZapAI Chat - Nostr Messaging',
    description: 'Chat with your favorite Nostr accounts using encrypted direct messages.',
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
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div className="hidden md:block md:w-80 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow targetPubkey={targetPubkey} />
      </div>
    </div>
  );
};

export default Index;
