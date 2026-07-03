import { sanitizeHtml, containsHtml } from '@/utils/html';

interface RichHtmlContentProps {
  html: string;
  className?: string;
}

export function RichHtmlContent({ html, className = '' }: RichHtmlContentProps) {
  if (!html.trim()) return null;

  if (!containsHtml(html)) {
    return (
      <p className={`text-sm text-bm-textMuted leading-relaxed whitespace-pre-wrap ${className}`}>
        {html}
      </p>
    );
  }

  return (
    <div
      className={`rich-html text-sm text-bm-textMuted leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
