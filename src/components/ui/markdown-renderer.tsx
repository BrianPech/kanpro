import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { cn } from '@/lib/utils';

export interface MarkdownRendererProps {
  content?: string | null;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  if (!content || !content.trim()) {
    return <p className="text-sm text-muted-foreground italic">Sin información detallada.</p>;
  }

  return (
    <div className={cn("markdown-body text-sm md:text-base leading-relaxed text-foreground space-y-3 font-normal", className)}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          h1: (props) => (
            <h1 className="text-lg md:text-xl font-black text-foreground mt-4 mb-2 tracking-tight first:mt-0" {...props} />
          ),
          h2: (props) => (
            <h2 className="text-base md:text-lg font-bold text-foreground mt-3.5 mb-2 tracking-tight border-b border-border/40 pb-1 first:mt-0" {...props} />
          ),
          h3: (props) => (
            <h3 className="text-sm md:text-base font-bold text-foreground mt-3 mb-1.5 tracking-tight first:mt-0" {...props} />
          ),
          p: (props) => (
            <p className="leading-relaxed text-foreground/90 my-2 first:mt-0 last:mb-0" {...props} />
          ),
          ul: (props) => (
            <ul className="list-disc list-outside space-y-1.5 my-2.5 pl-5 text-foreground/90" {...props} />
          ),
          ol: (props) => (
            <ol className="list-decimal list-outside space-y-1.5 my-2.5 pl-5 text-foreground/90" {...props} />
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed my-1 [&>p]:inline [&>p]:m-0" {...props}>
              {children}
            </li>
          ),
          blockquote: (props) => (
            <blockquote className="border-l-4 border-primary/40 bg-muted/40 pl-4 py-2 my-3 rounded-r-xl italic text-muted-foreground" {...props} />
          ),
          strong: (props) => (
            <strong className="font-bold text-foreground" {...props} />
          ),
          code: ({ children, ...props }) => (
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-medium text-foreground border border-border/50" {...props}>
              {children}
            </code>
          ),
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold underline underline-offset-2 hover:text-primary/80 transition-colors"
              {...props}
            >
              {children}
            </a>
          ),
          hr: (props) => (
            <hr className="my-5 border-border/60" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
