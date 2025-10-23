import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = 'Type a message...' }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || selectedFiles.length > 0) && !disabled) {
      onSend(message.trim(), selectedFiles);
      setMessage('');
      setSelectedFiles([]);
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg text-sm"
            >
              {file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-8 w-8 object-cover rounded"
                />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="hover:text-destructive"
                aria-label="Remove file"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area - Premium black theme */}
      <div className="flex gap-2 md:gap-3 items-end">
        <div className="flex-1 relative bg-white/[0.03] rounded-3xl border border-white/[0.08] hover:border-white/[0.12] focus-within:border-primary/50 transition-all duration-200">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'resize-none min-h-[52px] max-h-[200px] overflow-y-auto',
              'border-0 bg-transparent px-5 py-3.5 pr-14 text-sm md:text-base text-white',
              'focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500'
            )}
          />
          <div className="absolute right-2 bottom-2.5 flex gap-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled}
              aria-label="Upload file"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="h-8 w-8 rounded-lg hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={disabled || (!message.trim() && selectedFiles.length === 0)}
          className="h-[52px] w-[52px] rounded-2xl flex-shrink-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80 hover:from-primary hover:via-primary hover:to-primary/90 disabled:opacity-50 transition-all duration-200"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
