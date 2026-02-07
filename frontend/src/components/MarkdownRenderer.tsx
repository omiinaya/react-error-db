import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isPreview?: boolean;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className,
  isPreview = false 
}) => {
  if (!content) {
    return (
      <div className={cn("text-muted-foreground italic", className)}>
        {isPreview ? "Preview will appear here..." : "No content available"}
      </div>
    );
  }

  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, {
            tagNames: [
              'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
              'p', 'br', 'div', 'span',
              'strong', 'b', 'em', 'i', 'u', 's', 'del',
              'code', 'pre', 'blockquote',
              'ul', 'ol', 'li',
              'a', 'img',
              'table', 'thead', 'tbody', 'tr', 'th', 'td',
              'hr'
            ],
            attributes: {
              'a': ['href', 'title', 'target', 'rel'],
              'img': ['src', 'alt', 'title'],
              'code': ['className'],
              'pre': ['className'],
              '*': ['className']
            },
            protocols: {
              href: ['http', 'https', 'mailto'],
              src: ['http', 'https', 'data']
            }
          }]
        ]}
        components={{
          // Custom styling for markdown elements
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-4 mb-3 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-4 mb-2 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-3 mb-2 first:mt-0">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mt-3 mb-1 first:mt-0">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-primary hover:text-primary/80 underline underline-offset-2"
              target="_blank" 
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return (
              <code 
                className={cn(
                  "rounded px-1 py-0.5 text-sm",
                  isInline 
                    ? "bg-muted text-muted-foreground" 
                    : "block bg-muted/50 p-3 overflow-x-auto"
                )}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-muted/50 rounded-lg p-3 overflow-x-auto mb-3 last:mb-0">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-muted-foreground/20 pl-4 my-3 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-3 last:mb-0 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-3 last:mb-0 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          table: ({ children }) => (
            <table className="w-full border-collapse border border-border rounded-lg overflow-hidden mb-3 last:mb-0">
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted/50 px-3 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="border-border my-4" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;