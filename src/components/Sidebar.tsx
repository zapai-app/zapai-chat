import { LoginArea } from '@/components/auth/LoginArea';
import { Separator } from '@/components/ui/separator';
import { MessageSquare } from 'lucide-react';

export function Sidebar() {
  return (
    <div className="flex flex-col h-full border-r bg-muted/10">
      {/* Desktop Header */}
      <div className="hidden md:block px-6 py-4">
        <div className="flex items-center gap-2 mb-2 mt-1">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">ZapAI Chat</h1>
        </div>
      </div>

      <Separator className="hidden md:block" />

      {/* Content Area - Hidden on mobile */}
      <div className="hidden md:block flex-1 p-4">
        {/* Future: conversation history, settings, etc. */}
      </div>

      {/* Spacer for mobile */}
      <div className="md:hidden flex-1" />

      <Separator className="hidden md:block" />
      
      {/* Login Area - Desktop only */}
      <div className="hidden md:block p-4">
        <LoginArea className="w-full" />
      </div>
    </div>
  );
}
