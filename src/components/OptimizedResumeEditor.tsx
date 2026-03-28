'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Copy, Check, Download, TrendingUp, Zap, ChevronDown, ChevronUp, Eye, Wand2 } from 'lucide-react';
import { llmConfigApi, resumeApi, type ATSScoreResponse } from '@/services/api';
import { toast } from 'react-toastify';

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
  atsData?: ATSScoreResponse;
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
  atsData,
}: OptimizedResumeEditorProps) => {
  console.log('atsData', atsData);
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
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [latexCopied, setLatexCopied] = useState(false);
  const [jdCopied, setJdCopied] = useState(false);
  const [suggestions, setSuggestions] = useState<any>([]);
  const [expandedSuggestions, setExpandedSuggestions] = useState<string[]>([]);
  const [activeRightTab, setActiveRightTab] = useState<'suggestions' | 'chat'>('suggestions');
  const [llmConfig, setLlmConfig] = useState<{
    masterResumePrompt?: string;
    masterCoverLetterPrompt?: string;
    masterResume?: string;
    masterCoverLetter?: string;
    masterProfile?: string;
  } | null>(null);
  const [masterPrompt, setMasterPrompt] = useState('');
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
        // API now returns camelCase keys directly
        setLlmConfig({
          masterResumePrompt: (config as Record<string, string | undefined>).masterResumePrompt,
          masterCoverLetterPrompt: (config as Record<string, string | undefined>).masterCoverLetterPrompt,
          masterResume: (config as Record<string, string | undefined>).masterResume,
          masterCoverLetter: (config as Record<string, string | undefined>).masterCoverLetter,
          masterProfile: (config as Record<string, string | undefined>).masterContent,
        });
      } catch (error) {
        console.error('Error fetching LLM config:', error);
      }
    };
    fetchLlmConfig();
  }, []);

  // Initialize master prompt when llmConfig or activeTab changes
  useEffect(() => {
    if (llmConfig) {
      const prompt = activeTab === 'coverLetter' 
        ? llmConfig.masterCoverLetterPrompt 
        : llmConfig.masterResumePrompt;
      setMasterPrompt(prompt || '');
    }
  }, [llmConfig, activeTab]);

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
    const suggestion = suggestions?.find((s) => s.id === suggestionId);
    if (!suggestion) return;

    // Replace in LaTeX
    const updatedLatex = latexCode.replace(suggestion.original, suggestion.improved);
    onLatexChange(updatedLatex);

    // Mark as applied
    setSuggestions((prev) =>
      prev?.map((s) => (s.id === suggestionId ? { ...s, applied: true } : s))
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // ⛔ prevents newline
      if (!isLoading && inputValue.trim()) {
        handleSendMessage();
      }
    }
  };

  const handleOptimizeResume = async () => {
    if (!latexCode || !jobDescription) {
      toast.error('Please provide both resume and job description');
      return;
    }

    setIsOptimizing(true);
    try {
      const response = await resumeApi.optimizeResume({
        jobDescription,
        prompt: masterPrompt,
        resume: latexCode,
        masterProfile: llmConfig?.masterProfile,
      });

      if (response.data?.optimizedLatex) {
        onLatexChange(response.data.optimizedLatex);
        toast.success('Resume optimized successfully!');
        
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            type: 'system',
            content: '✓ Resume optimized successfully! Your resume has been tailored to match the job description.',
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to optimize resume';
      toast.error(errorMessage);
      console.error('Optimization error:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  useEffect(() => {
  if (atsData?.improvement_suggestions) {
    const mapped = atsData.improvement_suggestions?.map((s, idx) => ({
      id: `sug-${Date.now()}-${s.section}-${s.original}`,
      section: s.section,
      original: s.original,
      improved: s.improved,
      reason: s.reason,
      applied: false,
    }));

    setSuggestions((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];

      const existingIds = new Set(safePrev.map((p) => p.original));
      const newOnes = (mapped || []).filter((m) => !existingIds.has(m.original));

      return [...safePrev, ...newOnes];
    });
    }
  }, [atsData]);

  const toggleSuggestion = (id: string) => {
    setExpandedSuggestions((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id); // close only this
      }
      return [...prev, id]; // open only this
    });
  };

  const appliedCount = suggestions?.filter((s) => s.applied).length;
  const isInputValid = latexCode?.trim() && jobDescription.trim();
  const shouldDisableATS = isCheckingATS || !isInputValid;
  const shouldDisableOptimize = isOptimizing || !isInputValid;

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
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
            disabled={shouldDisableATS}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 transition-all duration-200"
          >
            <TrendingUp className="w-4 h-4" />
            <span>ATS Score</span>
          </button>
          <button
            onClick={handleOptimizeResume}
            disabled={shouldDisableOptimize}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 transition-all duration-200"
          >
            <Wand2 className="w-4 h-4" />
            <span>Optimize</span>
          </button>
          <button
            onClick={onGeneratePDF}
            disabled={isGeneratingPDF}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 transition-all duration-200"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
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
              <p>Words: {jobDescription?.split(/\s+/)?.filter((w) => w.length > 0).length}</p>
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
            <textarea
              value={masterPrompt}
              onChange={(e) => setMasterPrompt(e.target.value)}
              placeholder="Master prompt will appear here..."
              className="flex-1 px-4 py-4 border-none focus:outline-none resize-none font-mono text-sm text-gray-700 bg-white placeholder:text-gray-400"
            />
            {/* Footer */}
            <div className="border-t border-gray-200/50 bg-gray-50/50 px-4 py-2 text-xs text-gray-500">
              <p>Words: {masterPrompt?.split(/\s+/)?.filter((w) => w.length > 0).length}</p>
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
          <textarea
            value={latexCode}
            onChange={(e) => onLatexChange(e.target.value)}
            placeholder="LaTeX code will appear here..."
            className="flex-1 px-4 py-4 border-none focus:outline-none resize-none font-mono text-xs text-gray-700 bg-gray-50 placeholder:text-gray-400"
          />

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
                <span>Suggestions ({suggestions?.length})</span>
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
              {suggestions?.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <Zap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No suggestions yet</p>
                    <p className="text-xs text-gray-400 mt-1">Chat to get AI-powered improvements</p>
                  </div>
                </div>
              ) : (
                suggestions?.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`p-4 rounded-xl border transition-all ${
                      suggestion.applied
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <button
                      onClick={() => toggleSuggestion(suggestion.id)}
                      className="w-full flex items-start justify-between gap-3"
                    >
                      <div className="text-left flex-1">
                
                        {/* Section + Status */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                            {suggestion.section}
                          </span>
                
                          {suggestion.applied && (
                            <span className="text-[10px] text-green-600 bg-green-100 px-2 py-1 rounded-full">
                              Applied
                            </span>
                          )}
                        </div>
                
                        {/* Reason */}
                        <p className="text-xs text-gray-700 font-medium line-clamp-2">
                          {suggestion.reason}
                        </p>
                
                        {/* Improved preview (1 line hint) */}
                        <p className="text-[11px] text-blue-600 mt-1 line-clamp-1">
                          → {suggestion.improved}
                        </p>
                      </div>
                
                      {expandedSuggestions.includes(suggestion.id) ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 mt-1" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 mt-1" />
                      )}
                    </button>
                
                    {/* Expanded View */}
                    {expandedSuggestions.includes(suggestion.id) && (
                      <div className="mt-4 space-y-3 border-t pt-3 border-gray-200">
                
                        {/* Original */}
                        <div>
                          <p className="text-[11px] font-semibold text-gray-500 mb-1">
                            Original
                          </p>
                          <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            {suggestion.original}
                          </div>
                        </div>
                
                        {/* Improved */}
                        <div>
                          <p className="text-[11px] font-semibold text-green-600 mb-1">
                            Improved
                          </p>
                          <div className="text-xs text-gray-800 bg-green-50 p-2 rounded-lg border border-green-200">
                            {suggestion.improved}
                          </div>
                        </div>
                
                        {/* Reason (detailed) */}
                        <div>
                          <p className="text-[11px] font-semibold text-gray-500 mb-1">
                            Why this matters
                          </p>
                          <p className="text-xs text-gray-600">
                            {suggestion.reason}
                          </p>
                        </div>
                
                        {/* CTA */}
                        {!suggestion.applied && (
                          <button
                            onClick={() => handleApplySuggestion(suggestion.id)}
                            className="w-full mt-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium rounded-lg hover:shadow-md transition"
                          >
                            Apply Suggestion
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
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">

              {messages?.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm transition ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm'
                        : message.type === 'system'
                        ? 'bg-green-50 text-gray-900 border border-green-200 rounded-bl-sm'
                        : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>

                    <p
                      className={`text-[10px] mt-2 opacity-70 ${
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

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">

              <div className="flex items-end gap-2">

                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask for improvements..."
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-5"
                  rows={2}
                  disabled={isLoading}
                />

                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 transition"
                  title="Send message (Ctrl+Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-gray-500 mt-2 px-1">
                Press <span className="font-medium">Enter</span> to send. <span className="font-medium">Shift + Enter</span> to add a new line.
              </p>

            </div>

          </div>
          )}
        </div>
      </div>
    </div>
  );
};
