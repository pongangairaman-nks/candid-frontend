'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';

export interface ContentSection {
  id: string;
  title: string;
  content: string;
}

interface MasterContentAccordionProps {
  sections: ContentSection[];
  onSectionsChange: (sections: ContentSection[]) => void;
  maxCharacters?: number;
}

const DEFAULT_SECTIONS = [
  { id: 'profile', title: 'Profile/Summary', content: '' },
  { id: 'skills', title: 'Skills', content: '' },
  { id: 'experience', title: 'Experience', content: '' },
  { id: 'projects', title: 'Projects', content: '' },
  { id: 'education', title: 'Education', content: '' },
  { id: 'certifications', title: 'Certifications', content: '' },
];

export const MasterContentAccordion = ({
  sections,
  onSectionsChange,
  maxCharacters = 50000,
}: MasterContentAccordionProps) => {
  // const [expandedId, setExpandedId] = useState<string | null>(sections.length > 0 ? sections[0].id : null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localSections, setLocalSections] = useState<ContentSection[]>(
    sections.length > 0 ? sections : DEFAULT_SECTIONS
  );

  const totalChars = localSections.reduce((sum, sec) => sum + (sec.content?.length || 0), 0);
  const isAtLimit = totalChars >= maxCharacters;

  const handleContentChange = (id: string, newContent: string) => {
    if (totalChars - (localSections.find(s => s.id === id)?.content.length || 0) + newContent.length > maxCharacters) {
      return;
    }

    const updated = localSections.map(sec =>
      sec.id === id ? { ...sec, content: newContent } : sec
    );
    setLocalSections(updated);
    onSectionsChange(updated);
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    const updated = localSections.map(sec =>
      sec.id === id ? { ...sec, title: newTitle } : sec
    );
    setLocalSections(updated);
    onSectionsChange(updated);
  };

  const handleAddSection = () => {
    const newId = `section-${Date.now()}`;
    const newSection: ContentSection = {
      id: newId,
      title: 'New Section',
      content: '',
    };
    const updated = [...localSections, newSection];
    setLocalSections(updated);
    setExpandedId(newId);
    onSectionsChange(updated);
  };

  const handleDeleteSection = (id: string) => {
    if (localSections.length === 1) return; // Don't delete the last section
    const updated = localSections.filter(sec => sec.id !== id);
    setLocalSections(updated);
    if (expandedId === id) {
      setExpandedId(updated[0]?.id || null);
    }
    onSectionsChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Character Counter */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
        <span className="text-sm font-medium text-gray-700">
          Content: {totalChars.toLocaleString()} / {maxCharacters.toLocaleString()} characters
        </span>
        <div className="w-32 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-colors ${
              isAtLimit ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min((totalChars / maxCharacters) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-2">
        {localSections.map((section, idx) => (
          <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 text-left">
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 transition-transform ${
                    expandedId === section.id ? 'rotate-180' : ''
                  }`}
                />
                <span className="font-semibold text-gray-900">{section.title}</span>
                <span className="text-sm text-gray-500 ml-auto">
                  {section.content.length} chars
                </span>
              </div>
            </button>

            {/* Content */}
            {expandedId === section.id && (
              <div className="p-4 bg-white border-t border-gray-200 space-y-3">
                {/* Title Input */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleTitleChange(section.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Skills, Experience"
                  />
                </div>

                {/* Content Textarea */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Content
                  </label>
                  <textarea
                    value={section.content}
                    onChange={(e) => handleContentChange(section.id, e.target.value)}
                    placeholder={`Add your ${section.title.toLowerCase()} here. Use bullet points or structured text.`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                    rows={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {section.content.length} / {maxCharacters - totalChars + section.content.length}
                  </p>
                </div>

                {/* Delete Button */}
                {localSections.length > 1 && (
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Section
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Section Button */}
      <button
        onClick={handleAddSection}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors font-medium"
      >
        <Plus className="w-5 h-5" />
        Add Custom Section
      </button>
      
    </div>
  );
};

export default MasterContentAccordion;
