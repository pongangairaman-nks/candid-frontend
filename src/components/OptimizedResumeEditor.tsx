'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Copy, Check, Download, TrendingUp, Zap, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { llmConfigApi } from '@/services/api';

interface Suggestion {
  id: string;
  section: string;
  original: string;
  improved: string;
  reason: string;
  applied: boolean;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestion?: Suggestion;
}

interface OptimizedResumeEditorProps {
  latexCode: string;
  jobDescription: string;
  onJobDescriptionChange: (text: string) => void;
  onLatexChange: (newLatex: string) => void;
  onGeneratePDF: () => void;
  onCheckATS: () => void;
  isGeneratingPDF?: boolean;
  isCheckingATS?: boolean;
  activeTab?: 'resume' | 'coverLetter';
}

export const OptimizedResumeEditor = ({
  latexCode,
  jobDescription,
  onJobDescriptionChange,
  onLatexChange,
  onGeneratePDF,
  onCheckATS,
  isGeneratingPDF = false,
  isCheckingATS = false,
  activeTab = 'resume',
}: OptimizedResumeEditorProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'I\'ll analyze your resume against the job description and suggest improvements. Click "Apply" to accept changes.',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [latexCopied, setLatexCopied] = useState(false);
  const [jdCopied, setJdCopied] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<'suggestions' | 'chat'>('suggestions');
  const [llmConfig, setLlmConfig] = useState<{
    master_resume_prompt?: string;
    master_cover_letter_prompt?: string;
  } | null>(null);
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

  // Fetch LLM config on mount
  useEffect(() => {
    const fetchLlmConfig = async () => {
      try {
        const config = await llmConfigApi.getConfig();
        setLlmConfig(config);
      } catch (error) {
        console.error('Error fetching LLM config:', error);
      }
    };
    fetchLlmConfig();
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

    // Simulate AI response with suggestions
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        type: 'assistant',
        content: `I've analyzed your request: "${inputValue}". I found 2 improvements that match the job description. Check the Suggestions tab to apply them.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);

      // Add sample suggestions
      setSuggestions((prev) => [
        ...prev,
        {
          id: `sug-${Date.now()}`,
          section: 'Experience',
          original: 'Worked on frontend development',
          improved: 'Led frontend development initiatives using React and TypeScript, improving performance by 40%',
          reason: 'Adds quantifiable impact and specific technologies mentioned in JD',
          applied: false,
        },
        {
          id: `sug-${Date.now() + 1}`,
          section: 'Skills',
          original: 'JavaScript, React, CSS',
          improved: 'JavaScript, React, TypeScript, CSS, Redux, Next.js, Tailwind CSS',
          reason: 'Includes all technologies from job description',
          applied: false,
        },
      ]);
    }, 800);
  };

  const handleApplySuggestion = (suggestionId: string) => {
    const suggestion = suggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return;

    // Replace in LaTeX
    const updatedLatex = latexCode.replace(suggestion.original, suggestion.improved);
    onLatexChange(updatedLatex);

    // Mark as applied
    setSuggestions((prev) =>
      prev.map((s) => (s.id === suggestionId ? { ...s, applied: true } : s))
    );

    // Add message
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        type: 'system',
        content: `✓ Applied: "${suggestion.improved}"`,
        timestamp: new Date(),
      },
    ]);
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

  const appliedCount = suggestions.filter((s) => s.applied).length;

  const getMasterPrompt = () => {
    if (activeTab === 'coverLetter') {
      const prompt = llmConfig?.master_cover_letter_prompt;
      if (prompt) {
        return <p className="text-gray-600 whitespace-pre-wrap">{prompt}</p>;
      }
      // Fallback if config not loaded
      return (
        <>
          <p className="text-gray-600">You are an expert cover letter writer. Create a compelling cover letter that highlights the candidate&apos;s relevant experience and skills for this specific job opportunity.</p>
          <p className="text-gray-600 mt-4">Focus on:</p>
          <ul className="text-gray-600 mt-2 ml-4 list-disc">
            <li>Demonstrating enthusiasm for the specific role and company</li>
            <li>Highlighting relevant achievements and experiences</li>
            <li>Addressing key requirements from the job description</li>
            <li>Creating a compelling narrative that connects experience to the role</li>
          </ul>
        </>
      );
    }
    const prompt = llmConfig?.master_resume_prompt;
    if (prompt) {
      return <p className="text-gray-600 whitespace-pre-wrap">{prompt}</p>;
    }
    // Fallback if config not loaded
    return (
      <>
        <p className="text-gray-600">You are an expert resume optimizer. Analyze the provided resume against the job description and suggest specific, actionable improvements that will increase the ATS score and improve the candidate&apos;s chances of getting an interview.</p>
        <p className="text-gray-600 mt-4">Focus on:</p>
        <ul className="text-gray-600 mt-2 ml-4 list-disc">
          <li>Keyword alignment with the job description</li>
          <li>Quantifiable achievements and metrics</li>
          <li>Relevant skills and experience highlighting</li>
          <li>ATS-friendly formatting and structure</li>
        </ul>
      </>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Top Action Bar */}
      <div className="border-b border-gray-200/50 bg-white/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>AI-powered resume optimization</span>
          {appliedCount > 0 && (
            <span className="ml-4 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              {appliedCount} improvements applied
            </span>
          )}
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
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 transition-all duration-200"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
          {/* <button
            onClick={onGeneratePDF}
            disabled={isGeneratingPDF}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button> */}
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="flex-1 flex overflow-hidden gap-4 p-4">
        {/* Left Column: Job Description & Master Prompt */}
        <div className="flex-[0.25] flex flex-col gap-4">
          {/* Top: Job Description */}
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
              <p>Words: {jobDescription.split(/\s+/).filter((w) => w.length > 0).length}</p>
            </div>
          </div>

          {/* Bottom: Master Prompt */}
          <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200/50 bg-gray-50/50 px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Master Prompt</h3>
                <p className="text-xs text-gray-500 mt-0.5">Pre-filled optimization instructions</p>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto px-4 py-4 font-mono text-sm text-gray-700 bg-white whitespace-pre-wrap wrap-break-word">
              {getMasterPrompt()}
            </div>
          </div>
        </div>

        {/* Middle Column: LaTeX Code */}
        <div className="flex-[0.45] flex flex-col bg-white rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
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

        {/* Right Column: Suggestions & Chat */}
        <div className="flex-[0.3] flex flex-col bg-white rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200/50 bg-gray-50/50 px-4 py-3 flex items-center space-x-2">
            <button
              onClick={() => setActiveRightTab('suggestions')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeRightTab === 'suggestions'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Suggestions ({suggestions.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveRightTab('chat')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeRightTab === 'chat'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Chat
            </button>
          </div>

          {/* Content Area */}
          {activeRightTab === 'suggestions' ? (
            // Suggestions Panel
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {suggestions.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <Zap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No suggestions yet</p>
                    <p className="text-xs text-gray-400 mt-1">Chat to get AI-powered improvements</p>
                  </div>
                </div>
              ) : (
                suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`p-3 rounded-lg border transition-all ${
                      suggestion.applied
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <button
                      onClick={() =>
                        setExpandedSuggestion(
                          expandedSuggestion === suggestion.id ? null : suggestion.id
                        )
                      }
                      className="w-full flex items-start justify-between"
                    >
                      <div className="text-left flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {suggestion.section}
                          </span>
                          {suggestion.applied && (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {suggestion.reason}
                        </p>
                      </div>
                      {expandedSuggestion === suggestion.id ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                      )}
                    </button>

                    {expandedSuggestion === suggestion.id && (
                      <div className="mt-3 space-y-2 pt-3 border-t border-gray-200">
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1">Original:</p>
                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded font-mono">
                            {suggestion.original}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1">Improved:</p>
                          <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded font-mono">
                            {suggestion.improved}
                          </p>
                        </div>
                        {!suggestion.applied && (
                          <button
                            onClick={() => handleApplySuggestion(suggestion.id)}
                            className="w-full mt-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                          >
                            Apply This Suggestion
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            // Chat Panel
            <div className="flex-1 flex flex-col overflow-hidden">
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
                          ? 'bg-green-50 text-gray-900 border border-green-200/50 rounded-bl-none'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
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
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        />
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
                    placeholder="Ask for improvements... (Ctrl+Enter to send)"
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
                <p className="text-xs text-gray-500 px-1">💡 Describe what you want to improve</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
