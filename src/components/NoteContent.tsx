import { type NostrEvent } from '@nostrify/nostrify';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { cn } from '@/lib/utils';

interface NoteContentProps {
  event: NostrEvent;
  className?: string;
}

/** Parses content of text note events so that URLs and hashtags are linkified, and markdown is rendered. */
export function NoteContent({
  event, 
  className, 
}: NoteContentProps) {  
  const text = event.content;

  return (
    <div className={cn("whitespace-pre-wrap break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          p: ({ children }) => <>{children}</>,
          a: ({ href, children }) => {
            // Check if it's a Nostr reference
            if (href?.startsWith('nostr:')) {
              try {
                const nostrId = href.replace('nostr:', '');
                const decoded = nip19.decode(nostrId);
                
                if (decoded.type === 'npub') {
                  return <NostrMention pubkey={decoded.data} />;
                } else {
                  return (
                    <Link 
                      to={`/${nostrId}`}
                      className="text-blue-500 hover:underline"
                    >
                      {children}
                    </Link>
                  );
                }
              } catch {
                return <span>{children}</span>;
              }
            }
            
            // Regular link
            return (
              <a 
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline break-all"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

// Helper component to display user mentions
function NostrMention({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const npub = nip19.npubEncode(pubkey);
  const hasRealName = !!author.data?.metadata?.name;
  const displayName = author.data?.metadata?.name ?? genUserName(pubkey);

  return (
    <Link 
      to={`/${npub}`}
      className={cn(
        "font-medium hover:underline",
        hasRealName 
          ? "text-primary hover:text-primary/80" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      @{displayName}
    </Link>
  );
}