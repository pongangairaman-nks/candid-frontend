'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader, AlertCircle, X } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ResumeChatRefinementProps {
  sectionKey: string;
  sectionTitle: string;
  sectionContent: string;
  jobDescription: string;
  onRefinement: (refinedContent: string) => void;
  onClose: () => void;
}

export const ResumeChatRefinement = ({
  sectionKey,
  sectionTitle,
  sectionContent,
  jobDescription,
  onRefinement,
  onClose,
}: ResumeChatRefinementProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsSubmitting(true);
    setError(null);

    try {
      // Call backend endpoint for section refinement
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/resume/refine-section`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            section_key: sectionKey,
            section_title: sectionTitle,
            section_content: sectionContent,
            job_description: jobDescription,
            conversation_history: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            user_message: inputValue,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to refine section');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.refinement_suggestion,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update refined content if available
      if (data.refined_content) {
        onRefinement(data.refined_content);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process refinement';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Refine {sectionTitle}</h2>
            <p className="text-sm text-gray-500">Chat to improve this section</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <p className="text-gray-500 mb-2">Start a conversation to refine this section</p>
                <p className="text-sm text-gray-400">
                  Try: "Add more metrics", "Make it shorter", "Emphasize leadership"
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
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

          {isSubmitting && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
                <div className="flex items-center space-x-2">
                  <Loader size={16} className="animate-spin" />
                  <p className="text-sm">Refining...</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg flex items-center space-x-2">
                <AlertCircle size={16} />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4 space-y-3">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your refinement request... (Ctrl+Enter to send)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Tip: Be specific. E.g., "Add AWS experience", "Emphasize leadership"
            </p>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isSubmitting}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
