import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  
  // Separate URLs by type (images and videos in their own lines)
  const standaloneImages = urls.filter(({ url, start }) => {
    // Check if URL is on its own line
    const beforeChar = start > 0 ? content[start - 1] : '\n';
    const afterChar = content[start + url.length] || '\n';
    return isImageUrl(url) && !imageErrors.has(url) && (beforeChar === '\n' || start === 0) && (afterChar === '\n' || afterChar === undefined);
  });
  
  const standaloneVideos = urls.filter(({ url, start }) => {
    const beforeChar = start > 0 ? content[start - 1] : '\n';
    const afterChar = content[start + url.length] || '\n';
    return isVideoUrl(url) && (beforeChar === '\n' || start === 0) && (afterChar === '\n' || afterChar === undefined);
  });
  
  // Remove standalone media URLs from text content
  let textContent = content;
  [...standaloneImages, ...standaloneVideos].reverse().forEach(({ start, end }) => {
    // Remove the URL and any surrounding newlines
    let removeStart = start;
    let removeEnd = end;
    
    // Remove preceding newline if exists
    if (removeStart > 0 && textContent[removeStart - 1] === '\n') {
      removeStart--;
    }
    // Remove following newline if exists
    if (removeEnd < textContent.length && textContent[removeEnd] === '\n') {
      removeEnd++;
    }
    
    textContent = textContent.slice(0, removeStart) + textContent.slice(removeEnd);
  });
  textContent = textContent.trim();
  
  const handleImageError = (url: string) => {
    setImageErrors(prev => new Set(prev).add(url));
  };

  return (
    <div className={className}>
      {/* Markdown text content */}
      {textContent && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {textContent}
          </ReactMarkdown>
        </div>
      )}
      
      {/* Standalone Images */}
      {standaloneImages.length > 0 && (
        <div className={`flex flex-col gap-2 ${textContent ? 'mt-2' : ''}`}>
          {standaloneImages.map(({ url }, index) => (
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
      
      {/* Standalone Videos */}
      {standaloneVideos.length > 0 && (
        <div className={`flex flex-col gap-2 ${textContent || standaloneImages.length > 0 ? 'mt-2' : ''}`}>
          {standaloneVideos.map(({ url }, index) => (
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
    </div>
  );
}
