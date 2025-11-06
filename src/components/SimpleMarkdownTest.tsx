import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function SimpleMarkdownTest() {
  const testMarkdown = `**This is bold**

*This is italic*

- Item 1
- Item 2
- Item 3

## This is a heading`;

  return (
    <div className="p-4 border rounded">
      <h1 className="text-xl font-bold mb-4">Markdown Test</h1>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {testMarkdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
