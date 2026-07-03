import DOMPurify from 'dompurify';

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'ul',
    'ol',
    'li',
    'a',
    'h1',
    'h2',
    'h3',
    'h4',
    'blockquote',
    'code',
    'pre',
    'span',
    'div',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  ALLOW_DATA_ATTR: false,
};

/** True when the string likely contains HTML markup from Businessmap. */
export function containsHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

/** Sanitize HTML for safe rendering in the UI. */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, PURIFY_CONFIG);
}

/** Plain-text snippet for list previews and carousels. */
export function htmlToPlainText(html: string): string {
  if (!containsHtml(html)) return html;
  const doc = new DOMParser().parseFromString(sanitizeHtml(html), 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Prepare stored value for a contentEditable surface. */
export function toEditorHtml(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (containsHtml(trimmed)) return sanitizeHtml(trimmed);
  return `<p>${escapeHtml(trimmed)}</p>`;
}

/** Normalize contentEditable output before persisting. */
export function normalizeEditorHtml(html: string): string {
  const cleaned = sanitizeHtml(html).trim();
  if (!cleaned) return '';

  const doc = new DOMParser().parseFromString(cleaned, 'text/html');
  const text = (doc.body.textContent ?? '').replace(/\u00a0/g, ' ').trim();
  if (!text) return '';

  return cleaned;
}
