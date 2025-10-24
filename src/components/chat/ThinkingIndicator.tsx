import { Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function ThinkingIndicator() {
  return (
    <div className="flex gap-4 items-start py-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Bot Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-primary/20">
        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
          <Bot className="h-4 w-4 text-white" />
        </AvatarFallback>
      </Avatar>

      {/* Thinking Animation - Multiple stages for realistic effect */}
      <div className="flex-1 space-y-2 pt-1">
        <div className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/50 backdrop-blur-sm">
          {/* Animated Dots with pulsing effect */}
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse [animation-duration:0.8s]" />
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse [animation-delay:0.2s] [animation-duration:0.8s]" />
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse [animation-delay:0.4s] [animation-duration:0.8s]" />
          </div>
        </div>
      </div>
    </div>
  );
}
