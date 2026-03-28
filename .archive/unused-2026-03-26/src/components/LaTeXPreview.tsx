'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface LaTeXPreviewProps {
  latexCode: string;
  onGeneratePDF?: () => void;
  isGeneratingPDF?: boolean;
}

export const LaTeXPreview = ({
  latexCode,
  onGeneratePDF,
  isGeneratingPDF = false,
}: LaTeXPreviewProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(latexCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightLatex = (code: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];

    const patterns = [
      { regex: /\\[a-zA-Z]+(\{[^}]*\})?/g, class: 'text-purple-600 font-semibold' }, // Commands
      { regex: /\{|\}/g, class: 'text-orange-600' }, // Braces
      { regex: /\[|\]/g, class: 'text-orange-600' }, // Brackets
      { regex: /%.*$/gm, class: 'text-green-600 italic' }, // Comments
      { regex: /\$[^$]*\$/g, class: 'text-blue-600' }, // Math mode
    ];

    const matches: Array<{ start: number; end: number; class: string }> = [];

    patterns.forEach(({ regex, class: className }) => {
      let match;
      while ((match = regex.exec(code)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + (match[0]?.length || 0),
          class: className,
        });
      }
    });

    matches?.sort((a, b) => a.start - b.start);

    let currentIndex = 0;
    matches?.forEach(({ start, end, class: className }, idx) => {
      if (start > currentIndex) {
        tokens.push(code.substring(currentIndex, start));
      }
      tokens.push(
        <span key={`highlight-${idx}`} className={className}>
          {code.substring(start, end)}
        </span>
      );
      currentIndex = end;
    });

    if (currentIndex < code.length) {
      tokens.push(code.substring(currentIndex));
    }

    return tokens;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">LaTeX Preview</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded transition-colors"
            title="Copy LaTeX code"
          >
            {copied ? (
              <>
                <Check size={16} className="text-green-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy</span>
              </>
            )}
          </button>
          {onGeneratePDF && (
            <button
              onClick={onGeneratePDF}
              disabled={isGeneratingPDF}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isGeneratingPDF ? 'Generating...' : 'Generate PDF'}
            </button>
          )}
        </div>
      </div>

      {/* Code Display */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50 font-mono text-sm leading-relaxed">
        <pre className="text-gray-800 whitespace-pre-wrap break-words">
          {highlightLatex(latexCode)}
        </pre>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
        <p>Lines: {latexCode?.split('\n')?.length || 0} | Characters: {latexCode?.length || 0}</p>
      </div>
    </div>
  );
};
