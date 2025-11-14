import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Mic, MicOff, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = 'Message ZAI...' }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Character count
  const charCount = message.length;
  const maxChars = 4000;

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
    <TooltipProvider>
      <div className="space-y-4">
        {/* Enhanced File Preview */}
        {selectedFiles.length > 0 && (
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-foreground">Attached Files</h4>
              <Badge variant="secondary" className="text-xs">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-3 bg-background/50 border border-border/50 rounded-xl p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {file.type.startsWith('image/') ? (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="h-10 w-10 object-cover rounded-lg border border-border/50"
                        />
                        <Image className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 text-white rounded-full p-0.5" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Input Container */}
        <form onSubmit={handleSubmit} className="relative">
          <div className={cn(
            "relative bg-card/50 backdrop-blur-sm border rounded-3xl transition-all duration-300 shadow-sm",
            isFocused 
              ? "border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20" 
              : "border-border/50 hover:border-border"
          )}>
            {/* Input Textarea */}
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                'resize-none min-h-[60px] max-h-[200px] overflow-y-auto',
                'border-0 bg-transparent px-6 py-4 pr-24 text-base text-foreground',
                'focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70',
                'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border'
              )}
            />

            {/* Action Buttons */}
            <div className="absolute right-3 bottom-3 flex items-center gap-1">
              {/* File Upload */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
                aria-label="Upload files"
              />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="h-9 w-9 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/20 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach files</TooltipContent>
              </Tooltip>

              {/* Voice Recording */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsRecording(!isRecording)}
                    disabled={disabled}
                    className={cn(
                      "h-9 w-9 rounded-xl transition-all",
                      isRecording 
                        ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30" 
                        : "hover:bg-emerald-100 dark:hover:bg-emerald-900/20 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
                    )}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isRecording ? 'Stop recording' : 'Voice message'}</TooltipContent>
              </Tooltip>

              {/* Send Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={disabled || (!message.trim() && selectedFiles.length === 0)}
                    className={cn(
                      "h-9 w-9 rounded-xl transition-all duration-300 shadow-sm",
                      (message.trim() || selectedFiles.length > 0) && !disabled
                        ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send message</TooltipContent>
              </Tooltip>
            </div>

            {/* Character Counter */}
            {message.length > 0 && (
              <div className="absolute right-6 top-2">
                <Badge 
                  variant={charCount > maxChars * 0.9 ? "destructive" : "secondary"} 
                  className="text-xs px-2 py-0.5"
                >
                  {charCount}/{maxChars}
                </Badge>
              </div>
            )}
          </div>

          {/* Enhanced Suggestions */}
          {!message.trim() && !selectedFiles.length && (
            <div className="flex items-center justify-center gap-2 mt-3 opacity-60 hover:opacity-100 transition-opacity">
              <span className="text-xs text-muted-foreground">Tip:</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <kbd className="px-2 py-1 bg-muted rounded text-xs">⏎</kbd>
                <span>to send</span>
                <span className="text-muted-foreground/50">•</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">⇧⏎</kbd>
                <span>for new line</span>
              </div>
            </div>
          )}
        </form>
      </div>
    </TooltipProvider>
  );
}
