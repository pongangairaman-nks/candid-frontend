'use client';

import { useState, useCallback } from 'react';
import { MessageCircle, Copy, Check } from 'lucide-react';
import { ResumeChatRefinement } from './ResumeChatRefinement';

interface ResumeSectionEditorProps {
  sectionKey: string;
  sectionTitle: string;
  content: string;
  jobDescription: string;
  onContentChange: (newContent: string) => void;
}

export const ResumeSectionEditor = ({
  sectionKey,
  sectionTitle,
  content,
  jobDescription,
  onContentChange,
}: ResumeSectionEditorProps) => {
  const [showChat, setShowChat] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyContent = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const handleRefinement = useCallback(
    (refinedContent: string) => {
      onContentChange(refinedContent);
    },
    [onContentChange]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{sectionTitle}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyContent}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors"
            title="Copy section content"
          >
            {copied ? (
              <Check size={16} className="text-green-600" />
            ) : (
              <Copy size={16} />
            )}
          </button>
          <button
            onClick={() => setShowChat(true)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
            title="Chat to refine this section"
          >
            <MessageCircle size={16} />
            <span>Refine</span>
          </button>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
        rows={6}
        placeholder="Section content..."
      />

      {showChat && (
        <ResumeChatRefinement
          sectionKey={sectionKey}
          sectionTitle={sectionTitle}
          sectionContent={content}
          jobDescription={jobDescription}
          onRefinement={handleRefinement}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};
