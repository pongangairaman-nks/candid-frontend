'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Copy, Check, Download, TrendingUp } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ThreeColumnResumeEditorProps {
  latexCode: string;
  jobDescription: string;
  onJobDescriptionChange: (text: string) => void;
  onLatexChange: (newLatex: string) => void;
  onGeneratePDF: () => void;
  onCheckATS: () => void;
  isGeneratingPDF?: boolean;
  isCheckingATS?: boolean;
}

export const ThreeColumnResumeEditor = ({
  latexCode,
  jobDescription,
  onJobDescriptionChange,
  onLatexChange,
  onGeneratePDF,
  onCheckATS,
  isGeneratingPDF = false,
  isCheckingATS = false,
}: ThreeColumnResumeEditorProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Welcome! Chat about your resume changes or ask for optimization suggestions.',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [latexCopied, setLatexCopied] = useState(false);
  const [jdCopied, setJdCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        type: 'assistant',
        content: `I've processed your request: "${inputValue}". The changes have been applied to your resume.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 800);
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latexCode);
    setLatexCopied(true);
    setTimeout(() => setLatexCopied(false), 2000);
  };

  const handleCopyJD = () => {
    navigator.clipboard.writeText(jobDescription);
    setJdCopied(true);
    setTimeout(() => setJdCopied(false), 2000);
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
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 transition-all duration-200"
          >
            <TrendingUp className="w-4 h-4" />
            <span>ATS Score</span>
          </button>
          <button
            onClick={onGeneratePDF}
            disabled={isGeneratingPDF}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="flex-1 flex overflow-hidden gap-4 p-4">
        {/* Left Column: Job Description */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200/50 bg-gray-50/50 px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Job Description</h3>
              <p className="text-xs text-gray-500 mt-0.5">Reference for optimization</p>
            </div>
            <button
              onClick={handleCopyJD}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              title="Copy job description"
            >
              {jdCopied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>

          {/* Content */}
          <textarea
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            placeholder="Paste job description here..."
            className="flex-1 px-4 py-4 border-none focus:outline-none resize-none font-mono text-sm text-gray-700 bg-white placeholder:text-gray-400"
          />

          {/* Footer */}
          <div className="border-t border-gray-200/50 bg-gray-50/50 px-4 py-2 text-xs text-gray-500">
            <p>Words: {jobDescription.split(/\s+/).filter(w => w.length > 0).length}</p>
          </div>
        </div>

        {/* Middle Column: LaTeX Code */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200/50 bg-gray-50/50 px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">LaTeX Code</h3>
              <p className="text-xs text-gray-500 mt-0.5">Resume content</p>
            </div>
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

        {/* Right Column: Chat */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200/50 bg-gray-50/50 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Chat Assistant</h3>
            <p className="text-xs text-gray-500 mt-0.5">Ask for optimization suggestions</p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-xl ${
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
          <div className="border-t border-gray-200/50 bg-gray-50/50 p-3 space-y-2">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask for changes... (Ctrl+Enter to send)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                title="Send message (Ctrl+Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 px-1">💡 Describe the changes you want to make</p>
          </div>
        </div>
      </div>
    </div>
  );
};
