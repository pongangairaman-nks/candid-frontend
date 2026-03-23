'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Zap, Copy, Check, Download, TrendingUp } from 'lucide-react';

interface Section {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sectionId?: string;
}

interface UnifiedResumeEditorProps {
  latexCode: string;
  jobDescription: string;
  onLatexChange: (newLatex: string) => void;
  onGeneratePDF: () => void;
  onCheckATS: () => void;
  isGeneratingPDF?: boolean;
  isCheckingATS?: boolean;
}

export const UnifiedResumeEditor = ({
  latexCode,
  jobDescription,
  onLatexChange,
  onGeneratePDF,
  onCheckATS,
  isGeneratingPDF = false,
  isCheckingATS = false,
}: UnifiedResumeEditorProps) => {
  const parseLatexSections = (latex: string): Section[] => {
    const sectionRegex = /\\section\{([^}]*)\}([\s\S]*?)(?=\\section|$)/g;
    const sections: Section[] = [];
    let match;
    let index = 0;

    const sectionIcons: { [key: string]: React.ReactNode } = {
      'professional summary': '📝',
      'experience': '💼',
      'skills': '🎯',
      'education': '🎓',
      'projects': '🚀',
      'certifications': '🏆',
    };

    while ((match = sectionRegex.exec(latex)) !== null) {
      const title = match[1].trim();
      const content = match[2].trim();
      const key = title.toLowerCase();
      const icon = Object.entries(sectionIcons).find(([k]) => key.includes(k))?.[1] || '📄';

      sections.push({
        id: `section-${index}`,
        title,
        content,
        icon,
      });
      index++;
    }

    return sections.length > 0
      ? sections
      : [
          {
            id: 'full-document',
            title: 'Full Resume',
            content: latex,
            icon: '📄',
          },
        ];
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Welcome! Select a section or chat to make changes to your resume.',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [latexCopied, setLatexCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    setSections(parseLatexSections(latexCode));
  }, [latexCode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      sectionId: selectedSectionId || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        type: 'assistant',
        content: `I've updated ${selectedSectionId ? 'the selected section' : 'your resume'} based on your request: "${inputValue}". The changes have been applied.`,
        timestamp: new Date(),
        sectionId: selectedSectionId || undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 800);
  };

  const handleSectionSelect = (sectionId: string) => {
    setSelectedSectionId(selectedSectionId === sectionId ? null : sectionId);
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latexCode);
    setLatexCopied(true);
    setTimeout(() => setLatexCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Top Action Bar */}
      <div className="border-b border-gray-200/50 bg-white/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>AI-powered resume optimization</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onCheckATS}
            disabled={isCheckingATS}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 transition-all duration-200"
          >
            <TrendingUp className="w-4 h-4" />
            <span>ATS Score</span>
          </button>
          <button
            onClick={onGeneratePDF}
            disabled={isGeneratingPDF}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 flex overflow-hidden gap-4 p-4">
        {/* Left: Sections Panel */}
        <div className="w-72 flex flex-col space-y-3 overflow-y-auto bg-white rounded-xl border border-gray-200/50 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Resume Sections</h3>
          <div className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionSelect(section.id)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                  selectedSectionId === section.id
                    ? 'bg-blue-50 border-2 border-blue-300 shadow-md'
                    : 'bg-white border border-gray-200/50 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <span className="text-lg mt-0.5">{section.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{section.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{section.content.substring(0, 40)}...</p>
                  </div>
                  {selectedSectionId === section.id && (
                    <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center: Chat Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-sm px-4 py-3 rounded-xl ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : message.type === 'system'
                      ? 'bg-gray-100 text-gray-900 rounded-bl-none'
                      : 'bg-green-50 text-gray-900 border border-green-200/50 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-xl rounded-bl-none">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200/50 bg-gray-50/50 p-4 space-y-3">
            {selectedSectionId && (
              <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200/50 flex items-center justify-between">
                <p className="text-xs font-medium text-blue-700">
                  Editing: {sections.find((s) => s.id === selectedSectionId)?.title}
                </p>
                <button
                  onClick={() => setSelectedSectionId(null)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedSectionId
                    ? `What changes would you like for this section?`
                    : `Chat about your resume changes... (Ctrl+Enter to send)`
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                title="Send message (Ctrl+Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: LaTeX Editor */}
        <div className="w-96 flex flex-col bg-white rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200/50 bg-gray-50/50 px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">LaTeX Code</h3>
            <button
              onClick={handleCopyLatex}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              title="Copy LaTeX code"
            >
              {latexCopied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>

          {/* Code Display */}
          <div className="flex-1 overflow-auto p-4 bg-gray-50 font-mono text-xs leading-relaxed">
            <pre className="text-gray-800 whitespace-pre-wrap wrap-break-word">{latexCode}</pre>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200/50 bg-gray-50/50 px-4 py-2 text-xs text-gray-500">
            <p>Lines: {latexCode.split('\n').length} | Chars: {latexCode.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
