'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { LaTeXPreview } from './LaTeXPreview';
import { ResumeSectionEditor } from './ResumeSectionEditor';

interface Section {
  key: string;
  title: string;
  content: string;
}

interface ResumeChatInterfaceProps {
  latexCode: string;
  jobDescription: string;
  onLatexChange: (newLatex: string) => void;
  onGeneratePDF: () => void;
  isGeneratingPDF?: boolean;
}

export const ResumeChatInterface = ({
  latexCode,
  jobDescription,
  onLatexChange,
  onGeneratePDF,
  isGeneratingPDF = false,
}: ResumeChatInterfaceProps) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [previewMode, setPreviewMode] = useState<'editor' | 'preview'>('editor');

  const parseLatexSections = (latex: string): Section[] => {
    const sections: Section[] = [];
    const sectionRegex = /\\(sub)?section\{([^}]*)\}/g;
    let match;
    const matches: Array<{ index: number; endTag: string; title: string; isSubsection: boolean }> = [];

    while ((match = sectionRegex.exec(latex)) !== null) {
      matches.push({
        index: match.index,
        endTag: match[0],
        title: match[2],
        isSubsection: !!match[1],
      });
    }

    matches.forEach((m, idx) => {
      const startIndex = m.index + m.endTag.length;
      const endIndex = idx + 1 < matches.length ? matches[idx + 1].index : latex.length;
      const content = latex.substring(startIndex, endIndex).trim();
      const key = `section-${idx}`;

      sections.push({
        key,
        title: m.title,
        content,
      });
    });

    return sections.length > 0
      ? sections
      : [{ key: 'full-document', title: 'Full Resume', content: latex }];
  };

  // Parse LaTeX into sections
  useEffect(() => {
    setSections(parseLatexSections(latexCode));
  }, [latexCode]);

  const handleSectionChange = (sectionKey: string, newContent: string) => {
    const sectionIndex = sections.findIndex((s) => s.key === sectionKey);
    if (sectionIndex === -1) return;

    const updatedSections = [...sections];
    updatedSections[sectionIndex].content = newContent;
    setSections(updatedSections);

    // Reconstruct LaTeX
    const reconstructedLatex = reconstructLatex(updatedSections);
    onLatexChange(reconstructedLatex);
  };

  const reconstructLatex = (updatedSections: Section[]): string => {
    let reconstructed = '';

    updatedSections.forEach((section, idx) => {
      if (section.key === 'full-document') {
        reconstructed = section.content;
      } else {
        reconstructed += `\\section{${section.title}}\n${section.content}\n\n`;
      }
    });

    return reconstructed;
  };

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header with tabs */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPreviewMode('editor')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              previewMode === 'editor'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setPreviewMode('preview')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              previewMode === 'preview'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            LaTeX Preview
          </button>
        </div>
        <button
          onClick={onGeneratePDF}
          disabled={isGeneratingPDF}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isGeneratingPDF ? 'Generating PDF...' : 'Generate PDF'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {previewMode === 'editor' ? (
          <div className="p-6 space-y-6">
            {sections.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No sections found. Paste LaTeX code to get started.</p>
              </div>
            ) : (
              sections.map((section) => (
                <div key={section.key} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900">{section.title}</h3>
                    {expandedSections.has(section.key) ? (
                      <ChevronUp size={20} className="text-gray-600" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-600" />
                    )}
                  </button>

                  {expandedSections.has(section.key) && (
                    <div className="p-4 border-t">
                      <ResumeSectionEditor
                        sectionKey={section.key}
                        sectionTitle={section.title}
                        content={section.content}
                        jobDescription={jobDescription}
                        onContentChange={(newContent) =>
                          handleSectionChange(section.key, newContent)
                        }
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-6">
            <LaTeXPreview
              latexCode={latexCode}
              onGeneratePDF={onGeneratePDF}
              isGeneratingPDF={isGeneratingPDF}
            />
          </div>
        )}
      </div>
    </div>
  );
};
