'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Copy, Check, Download, TrendingUp, Zap, ChevronDown, ChevronUp, Eye, Wand2 } from 'lucide-react';
import { llmConfigApi, resumeApi, resumeSectionsApi, type ATSScoreResponse } from '@/services/api';
import { toast } from 'react-toastify';

interface Suggestion {
  id: string;
  section: string;
  original: string;
  originalLatex?: string; // Exact LaTeX code to replace
  improved: string;
  improvedLatex?: string; // Improved LaTeX code
  reason: string;
  applied: boolean;
  originalLatexBeforeApply?: string; // Store original LaTeX for undo
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
  const [selectedText, setSelectedText] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [sections, setSections] = useState<Array<{ name: string; order: number; isActive: boolean }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const latexRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch LLM config and sections on mount
  useEffect(() => {
    const fetchConfigAndSections = async () => {
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

        // Fetch sections from backend
        const sectionsData = await resumeSectionsApi.getSections();
        if (sectionsData.sections && sectionsData.sections.length > 0) {
          setSections(sectionsData.sections);
          console.log('✅ Loaded sections from backend:', sectionsData.sections.map((s) => s.name));
        }
      } catch (error) {
        console.error('Error fetching config or sections:', error);
      }
    };
    fetchConfigAndSections();
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
      content: selectedText ? `[${selectedSection}] ${inputValue}` : inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepare payload based on mode (global vs focused)
      const { primarySection, allSections, confidence } = selectedText 
        ? detectSectionsInSelection(selectedText)
        : { primarySection: '', allSections: [], confidence: 0 };

      const payload = selectedText
        ? {
            mode: 'focused',
            resume: latexCode,
            jobDescription,
            prompt: inputValue,
            masterProfile: llmConfig?.masterProfile,
            selectedContent: selectedText,
            primarySection,
            allSections,
            confidence,
            quality: 'fast',
          }
        : {
            mode: 'global',
            resume: latexCode,
            jobDescription,
            prompt: inputValue,
            masterProfile: llmConfig?.masterProfile,
            quality: 'fast',
          };

      // Call the optimize API
      const response = await resumeApi.optimizeResume(payload);

      if (response.data?.optimizedLatex) {
        const optimizedContent = response.data.optimizedLatex;

        // Handle replacement based on mode
        if (selectedText && selectedText.trim()) {
          // FOCUSED MODE: Replace only the selected text
          let updatedLatex = latexCode;
          let replacementSuccessful = false;

          // Try 1: Exact match of selected text
          if (latexCode.includes(selectedText)) {
            updatedLatex = latexCode.replace(selectedText, optimizedContent);
            replacementSuccessful = true;
          }
          // Try 2: Fuzzy match if exact fails
          else {
            const selectedWords = selectedText.split(/\s+/).filter((w) => w.length > 0);
            const latexWords = latexCode.split(/\s+/);
            let startIdx = -1;
            let endIdx = -1;

            for (let i = 0; i <= latexWords.length - selectedWords.length; i++) {
              let matchCount = 0;
              for (let j = 0; j < selectedWords.length; j++) {
                if (latexWords[i + j].includes(selectedWords[j])) {
                  matchCount++;
                }
              }
              if (matchCount >= Math.ceil(selectedWords.length * 0.7)) {
                startIdx = i;
                endIdx = i + selectedWords.length;
                break;
              }
            }

            if (startIdx !== -1 && endIdx !== -1) {
              const originalText = latexWords.slice(startIdx, endIdx).join(' ');
              updatedLatex = latexCode.replace(originalText, optimizedContent);
              replacementSuccessful = true;
            }
          }

          if (replacementSuccessful) {
            onLatexChange(updatedLatex);
            toast.success(`✓ ${primarySection} section optimized and applied`);
            clearSelection();
          } else {
            toast.error('Could not apply optimization. Content may have changed.');
          }
        } else {
          // GLOBAL MODE: Replace entire resume
          onLatexChange(optimizedContent);
          toast.success('Resume optimized successfully!');
        }

        // Add assistant message
        const assistantMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          type: 'assistant',
          content: selectedText
            ? `✓ Optimized the ${primarySection} section. The improved content has been applied to your resume.`
            : `✓ Resume optimized successfully! All sections have been enhanced to better match the job description.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to optimize resume';
      toast.error(errorMessage);
      console.error('Optimization error:', error);

      const errorMessage_display: Message = {
        id: `msg-${Date.now() + 1}`,
        type: 'assistant',
        content: `❌ Error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage_display]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = (suggestionId: string) => {
    const suggestion = suggestions?.find((s: Suggestion) => s.id === suggestionId);
    if (!suggestion) return;

    // Use improvedLatex if available (exact LaTeX replacement), fallback to improved text
    const textToReplace = suggestion.originalLatex || suggestion.original;
    const replacementText = suggestion.improvedLatex || suggestion.improved;

    // Replace in LaTeX
    let updatedLatex = latexCode;
    
    if (latexCode.includes(textToReplace)) {
      updatedLatex = latexCode.replace(textToReplace, replacementText);
    } else {
      // Fallback: try to find and replace using fuzzy matching
      console.warn(`⚠️ Exact match not found for: "${textToReplace}". Attempting fuzzy match...`);
      toast.warning('Could not find exact match. Please check the suggestion.');
      return;
    }

    onLatexChange(updatedLatex);

    // Mark as applied and store original LaTeX for undo
    setSuggestions((prev: Suggestion[]) =>
      prev?.map((s: Suggestion) => 
        s.id === suggestionId 
          ? { ...s, applied: true, originalLatexBeforeApply: latexCode } 
          : s
      )
    );

    // Add message
    setMessages((prev: Message[]) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        type: 'system',
        content: `✓ Applied: "${suggestion.improved}"`,
        timestamp: new Date(),
      },
    ]);

    toast.success('Suggestion applied successfully!');
  };

  const handleUndoSuggestion = (suggestionId: string) => {
    const suggestion = suggestions?.find((s: Suggestion) => s.id === suggestionId);
    if (!suggestion || !suggestion.originalLatexBeforeApply) return;

    // Restore original LaTeX
    onLatexChange(suggestion.originalLatexBeforeApply);

    // Mark as not applied
    setSuggestions((prev: Suggestion[]) =>
      prev?.map((s: Suggestion) => 
        s.id === suggestionId 
          ? { ...s, applied: false, originalLatexBeforeApply: undefined } 
          : s
      )
    );

    // Add message
    setMessages((prev: Message[]) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        type: 'system',
        content: `↩ Undone: "${suggestion.improved}"`,
        timestamp: new Date(),
      },
    ]);
  };

  const highlightSectionInLatex = (originalText: string) => {
    if (!latexRef.current) return;

    // Find the original text in the LaTeX code
    const index = latexCode.indexOf(originalText);
    
    if (index !== -1) {
      // Calculate line number for smooth scrolling
      const lines = latexCode.substring(0, index).split('\n').length - 1;
      const lineHeight = parseInt(window.getComputedStyle(latexRef.current).lineHeight);
      const targetScrollTop = lines * lineHeight;
      
      // Smooth scroll to the section
      latexRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });
      
      // Set selection to highlight the text
      latexRef.current.setSelectionRange(index, index + originalText.length);
      latexRef.current.focus();
      
      // Add subtle and elegant highlight with soft blue ring
      latexRef.current.classList.add('ring-2', 'ring-blue-300', 'ring-opacity-60');
      setTimeout(() => {
        latexRef.current?.classList.remove('ring-2', 'ring-blue-300', 'ring-opacity-60');
      }, 3500);
    }
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
    } catch (error: unknown) {
      let errorMessage = 'Failed to optimize resume';
      let errorDetails = '';

      // Handle axios error response
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: Record<string, unknown> } };
        const data = axiosError.response?.data;
        
        if (data && typeof data === 'object') {
          errorMessage = (data.message as string) || errorMessage;
          errorDetails = (data.error as string) || '';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Show detailed error message with actionable steps
      const fullErrorMessage = errorDetails 
        ? `${errorMessage}\n${errorDetails}` 
        : errorMessage;
      
      toast.error(fullErrorMessage, {
        autoClose: 6000,
        style: { whiteSpace: 'pre-wrap' },
      });
      console.error('Optimization error:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Load suggestions from atsData API response
  useEffect(() => {
    if (atsData?.improvement_suggestions) {
      const mapped = atsData.improvement_suggestions?.map((s: any, idx: number) => ({
        id: `sug-${Date.now()}-${idx}`,
        section: s.section as string,
        original: s.original as string,
        originalLatex: s.originalLatex as string | undefined,
        improved: s.improved as string,
        improvedLatex: s.improvedLatex as string | undefined,
        reason: s.reason as string,
        applied: false,
      }));

      setSuggestions((prev: Suggestion[]) => {
        const safePrev = Array.isArray(prev) ? prev : [];

        const existingIds = new Set(safePrev.map((p: Suggestion) => p.original));
        const newOnes = (mapped || []).filter((m: Suggestion) => !existingIds.has(m.original));

        return [...safePrev, ...newOnes];
      });
    }
  }, [atsData?.improvement_suggestions]);

  const toggleSuggestion = (id: string) => {
    setExpandedSuggestions((prev: string[]) => {
      if (prev.includes(id)) {
        return prev.filter((item: string) => item !== id); // close only this
      }
      return [...prev, id]; // open this
    });
  };

  const detectSectionsInSelection = (selectedText: string): { primarySection: string; allSections: string[]; confidence: number } => {
    // Use dynamic sections from backend if available, otherwise fallback to defaults
    const availableSections = sections.length > 0 
      ? sections.map((s) => s.name)
      : ['Profile', 'Experience', 'Skills', 'Education', 'Projects', 'Certifications'];

    const detectedSections: { name: string; confidence: number }[] = [];

    availableSections.forEach((sectionName) => {
      // Create regex pattern for section header
      const headerRegex = new RegExp(`\\\\section\\*?\\{${sectionName}\\}`, 'i');
      // Also check for section name mention
      const nameRegex = new RegExp(`\\b${sectionName}\\b`, 'i');

      if (headerRegex.test(selectedText)) {
        // Exact section header match = 100% confidence
        detectedSections.push({ name: sectionName, confidence: 100 });
      } else if (nameRegex.test(selectedText)) {
        // Section name mention = calculate confidence based on word count
        const wordCount = selectedText.split(/\s+/).length;
        const matchCount = (selectedText.match(nameRegex) || []).length;
        const confidence = Math.min((matchCount / wordCount) * 100, 100);
        detectedSections.push({ name: sectionName, confidence });
      }
    });

    // Sort by confidence
    detectedSections.sort((a, b) => b.confidence - a.confidence);

    const primarySection = detectedSections[0]?.name || 'Selected Text';
    const allSections = detectedSections.map((s) => s.name);
    const confidence = detectedSections[0]?.confidence || 0;

    return { primarySection, allSections, confidence };
  };

  const handleLatexSelection = () => {
    if (!latexRef.current) return;
    
    const textarea = latexRef.current;
    const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    
    if (selectedText.trim()) {
      setSelectedText(selectedText);
      
      const { primarySection } = detectSectionsInSelection(selectedText);
      setSelectedSection(primarySection);
      
      // Auto-switch to Chat tab if currently on Suggestions
      if (activeRightTab === 'suggestions') {
        setActiveRightTab('chat');
      }
    }
  };

  const clearSelection = () => {
    setSelectedText('');
    setSelectedSection('');
  };

  const appliedCount = suggestions?.filter((s: any) => s.applied).length;
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
            ref={latexRef}
            value={latexCode}
            onChange={(e) => onLatexChange(e.target.value)}
            onMouseUp={handleLatexSelection}
            onKeyUp={handleLatexSelection}
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
              onClick={() => {
                setSelectedText('');
                setActiveRightTab('suggestions')}
              }
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
                suggestions?.map((suggestion: any) => (
                  <div
                    key={suggestion.id}
                    className={`p-4 rounded-xl border transition-all ${
                      suggestion.applied
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <button
                      onClick={() => {
                        toggleSuggestion(suggestion.id);
                        // Highlight the original text in the LaTeX editor
                        setTimeout(() => {
                          highlightSectionInLatex(suggestion.original);
                        }, 100);
                      }}
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
                        {!suggestion.applied ? (
                          <button
                            onClick={() => handleApplySuggestion(suggestion.id)}
                            className="w-full mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg hover:shadow-md transition"
                          >
                            Apply Suggestion
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUndoSuggestion(suggestion.id)}
                            className="w-full mt-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-lg hover:shadow-md transition"
                          >
                            ↩ Undo
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

              {/* Selected Text Display */}
              {selectedText && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                        Optimizing: {selectedSection}
                      </p>
                      <p className="text-xs text-gray-700 dark:text-slate-300 line-clamp-2">
                        {selectedText}
                      </p>
                    </div>
                    <button
                      onClick={clearSelection}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition"
                      title="Clear selection"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

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

              <p className="text-[12px] text-gray-500 mt-2 px-1">
                💡 Describe what you want to improve.
                {/* Press <span className="font-medium">Enter</span> to send. <span className="font-medium">Shift + Enter</span> to add a new line. */}
              </p>

            </div>

          </div>
          )}
        </div>
      </div>
    </div>
  );
};
