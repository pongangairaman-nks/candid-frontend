'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, Zap } from 'lucide-react';

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

interface ChatLikeResumeEditorProps {
  latexCode: string;
  jobDescription: string;
  onLatexChange: (newLatex: string) => void;
  onGeneratePDF: () => void;
  isGeneratingPDF?: boolean;
}

export const ChatLikeResumeEditor = ({
  latexCode,
  jobDescription,
  onLatexChange,
  onGeneratePDF,
  isGeneratingPDF = false,
}: ChatLikeResumeEditorProps) => {
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
      content: 'Welcome! I can help you optimize your resume. You can chat with me about changes, or select a section below to refine it.',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Parse sections from LaTeX
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    setSections(parseLatexSections(latexCode));
  }, [latexCode]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input
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

    // Simulate AI response
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-linear-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="border-b border-gray-200/50 bg-white/80 backdrop-blur-sm px-8 py-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-linear-to-br from-blue-100 to-indigo-100">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Resume Chat Assistant</h2>
            <p className="text-sm text-gray-500">Select a section or chat to make changes</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 flex overflow-hidden gap-6 p-6">
        {/* Left: Sections Panel */}
        <div className="w-80 flex flex-col space-y-4 overflow-y-auto">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 px-2">Resume Sections</h3>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionSelect(section.id)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 group ${
                  selectedSectionId === section.id
                    ? 'bg-linear-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-md'
                    : 'bg-white border border-gray-200/50 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-xl mt-0.5">{section.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{section.title}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{section.content.substring(0, 60)}...</p>
                    </div>
                  </div>
                  {selectedSectionId === section.id && (
                    <div className="ml-2 p-1 rounded-lg bg-blue-100">
                      <Zap className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Job Description Preview */}
          <div className="mt-6 pt-6 border-t border-gray-200/50">
            <h3 className="text-sm font-semibold text-gray-900 px-2 mb-3">Job Context</h3>
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/50">
              <p className="text-xs text-gray-600 line-clamp-4">{jobDescription || 'No job description provided'}</p>
            </div>
          </div>
        </div>

        {/* Right: Chat Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md px-4 py-3 rounded-xl ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
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
              <div className="px-4 py-2 rounded-lg bg-blue-50 border border-blue-200/50 flex items-center justify-between">
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

            <div className="flex gap-3">
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
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-sm"
                rows={3}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                title="Send message (Ctrl+Enter)"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 px-2">
              💡 Tip: Select a section first, then describe what you want to change
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="border-t border-gray-200/50 bg-white/80 backdrop-blur-sm px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>AI-powered resume optimization</span>
        </div>
        <button
          onClick={onGeneratePDF}
          disabled={isGeneratingPDF}
          className="px-6 py-2 bg-linear-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 transition-all duration-200 text-sm font-medium"
        >
          {isGeneratingPDF ? 'Generating...' : 'Generate PDF'}
        </button>
      </div>
    </div>
  );
};
