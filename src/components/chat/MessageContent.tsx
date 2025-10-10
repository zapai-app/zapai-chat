import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface MessageContentProps {
  content: string;
  className?: string;
}

// Helper function to check if URL is an image
const isImageUrl = (url: string): boolean => {
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
};

// Helper function to check if URL is a video
const isVideoUrl = (url: string): boolean => {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
};

// Helper function to extract URLs from text
const extractUrls = (text: string): { url: string; start: number; end: number }[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches: { url: string; start: number; end: number }[] = [];
  let match;
  
  while ((match = urlRegex.exec(text)) !== null) {
    matches.push({
      url: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  
  return matches;
};

export function MessageContent({ content, className }: MessageContentProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const urls = extractUrls(content);
  
  // Separate URLs by type
  const images = urls.filter(({ url }) => isImageUrl(url) && !imageErrors.has(url));
  const videos = urls.filter(({ url }) => isVideoUrl(url));
  const links = urls.filter(({ url }) => !isImageUrl(url) && !isVideoUrl(url));
  
  // Remove URLs from text content
  let textContent = content;
  [...urls].reverse().forEach(({ start, end }) => {
    textContent = textContent.slice(0, start) + textContent.slice(end);
  });
  textContent = textContent.trim();
  
  const handleImageError = (url: string) => {
    setImageErrors(prev => new Set(prev).add(url));
  };

  return (
    <div className={className}>
      {/* Text content */}
      {textContent && (
        <div className="whitespace-pre-wrap break-words">
          {textContent}
        </div>
      )}
      
      {/* Images */}
      {images.length > 0 && (
        <div className={`flex flex-col gap-2 ${textContent ? 'mt-2' : ''}`}>
          {images.map(({ url }, index) => (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={url}
                alt="Shared image"
                className="rounded-lg max-w-full h-auto max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onError={() => handleImageError(url)}
                loading="lazy"
              />
            </a>
          ))}
        </div>
      )}
      
      {/* Videos */}
      {videos.length > 0 && (
        <div className={`flex flex-col gap-2 ${textContent || images.length > 0 ? 'mt-2' : ''}`}>
          {videos.map(({ url }, index) => (
            <video
              key={index}
              src={url}
              controls
              className="rounded-lg max-w-full h-auto max-h-96"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ))}
        </div>
      )}
      
      {/* Links */}
      {links.length > 0 && (
        <div className={`flex flex-col gap-1 ${textContent || images.length > 0 || videos.length > 0 ? 'mt-2' : ''}`}>
          {links.map(({ url }, index) => (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline break-all"
            >
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{url}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
