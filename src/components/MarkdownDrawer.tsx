import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Code2, Copy, Eye, FileText, X } from 'lucide-react';
import { MARKDOWN_DOC_LIST, MARKDOWN_DOCS } from '../content';
import type { MarkdownDocId } from '../types/auth';

interface MarkdownDrawerProps {
  activeDocId: MarkdownDocId | null;
  onSelectDoc: (docId: MarkdownDocId) => void;
  onClose: () => void;
}

export function MarkdownDrawer({
  activeDocId,
  onSelectDoc,
  onClose,
}: MarkdownDrawerProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!activeDocId) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeDocId, onClose]);

  useEffect(() => {
    setCopied(false);
  }, [activeDocId, viewMode]);

  if (!activeDocId) return null;

  const currentDoc = MARKDOWN_DOCS[activeDocId];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(currentDoc.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API may be unavailable in restricted contexts
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#011c1e]/60 backdrop-blur-md transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label={`Documento Markdown: ${currentDoc.title}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside className="animate-fade-up flex h-full w-full max-w-[560px] flex-col border-l border-white/22 bg-[#01282a]/76 backdrop-blur-2xl">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-white/15 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#A4CF63]/55 bg-[#A4CF63]/20 text-[#A4CF63]">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[14px] font-medium text-white">
                Documentación Markdown
              </p>
              <p className="he-meta mt-0.5 text-[10px] text-white/80">
                src/content/{currentDoc.filename}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de documentación"
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-white/22 bg-[#011d1f]/45 text-white/90 transition-colors hover:border-white/45 hover:bg-white/15 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Document Selector & Preview/Raw Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 bg-[#011f21]/45 px-6 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {MARKDOWN_DOC_LIST.map((doc) => {
              const isActive = doc.id === activeDocId;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => onSelectDoc(doc.id)}
                  className={`rounded-[8px] px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.11em] backdrop-blur-md transition-colors cursor-pointer ${
                    isActive
                      ? 'border border-[#A4CF63]/75 bg-[#A4CF63]/20 text-white'
                      : 'border border-white/20 bg-[#011d1f]/40 text-white/85 hover:border-white/40 hover:text-white'
                  }`}
                >
                  {doc.title}
                </button>
              );
            })}
          </div>

          <div className="inline-flex items-center rounded-[8px] border border-white/22 bg-[#011d1f]/48 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`inline-flex items-center gap-1 rounded-[6px] px-2.5 py-1 font-mono text-[10.5px] uppercase transition-colors cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Eye className="h-3 w-3" />
              Vista
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={`inline-flex items-center gap-1 rounded-[6px] px-2.5 py-1 font-mono text-[10.5px] uppercase transition-colors cursor-pointer ${
                viewMode === 'raw'
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Code2 className="h-3 w-3" />
              .md
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {viewMode === 'preview' ? (
            <article className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentDoc.content}
              </ReactMarkdown>
            </article>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={handleCopy}
                className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-[8px] border border-white/25 bg-[#011d1f]/65 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-white backdrop-blur-md transition-colors hover:border-white/45 hover:bg-white/15 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-[#A4CF63]" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copiar
                  </>
                )}
              </button>
              <pre className="overflow-x-auto rounded-[12px] border border-white/18 bg-[#011c1e]/60 p-5 pt-12 font-mono text-[12.5px] leading-relaxed text-white/95">
                <code>{currentDoc.content}</code>
              </pre>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
