'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Toast } from './Toast';

interface Model {
  id: string;
  name: string;
  provider: string;
}

interface AvailableModels {
  [key: string]: Model[];
}

interface LLMConfig {
  provider: string;
  model: string;
  is_active: boolean;
}

export const LLMConfig = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [provider, setProvider] = useState('claude');
  const [model, setModel] = useState('claude-opus-4-1-20250805');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [availableModels, setAvailableModels] = useState<AvailableModels>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/llm/models');
        const data = await response.json();
        setAvailableModels(data);
      } catch (error) {
        console.error('Failed to fetch models:', error);
        setToast({ message: 'Failed to load available models', type: 'error' });
      }
    };

    fetchModels();
  }, []);

  // Fetch current config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsFetching(true);
        const token = localStorage.getItem('token');
        const response = await fetch('/api/llm/config', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const config: LLMConfig = await response.json();
          setProvider(config.provider);
          setModel(config.model);
        }
      } catch (error) {
        console.error('Failed to fetch config:', error);
      } finally {
        setIsFetching(false);
      }
    };

    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setToast({ message: 'API key is required', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/llm/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider,
          model,
          apiKey,
        }),
      });

      if (response.ok) {
        setToast({ message: 'Configuration saved successfully!', type: 'success' });
        setApiKey('');
        setTimeout(() => setIsOpen(false), 1500);
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Failed to save configuration', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setToast({ message: 'Failed to save configuration', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const currentModels = availableModels[provider] || [];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors z-50 relative"
        title="LLM Configuration"
      >
        <Settings size={20} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings size={20} />
                LLM Configuration
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            {isFetching ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin">⏳</div>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Loading configuration...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Info Banner */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-2">
                  <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Configure your preferred LLM provider and model. Your API key is securely stored.
                  </p>
                </div>

                {/* Provider Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value);
                      setModel(availableModels[e.target.value]?.[0]?.id || '');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="claude">Claude (Anthropic)</option>
                    <option value="gemini">Gemini (Google)</option>
                  </select>
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {currentModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {provider === 'claude'
                      ? 'Opus 4.1 recommended for best ATS score'
                      : 'Flash models are free tier with daily limits'}
                  </p>
                </div>

                {/* API Key Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={apiKeyVisible ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={`Enter your ${provider} API key`}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setApiKeyVisible(!apiKeyVisible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm"
                    >
                      {apiKeyVisible ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {provider === 'claude'
                      ? 'Get your key from https://console.anthropic.com'
                      : 'Get your key from https://aistudio.google.com'}
                  </p>
                </div>

                {/* Model Info */}
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <strong>Current Selection:</strong> {currentModels.find((m) => m.id === model)?.name || 'Unknown'}
                  </p>
                  {provider === 'claude' && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      <strong>Cost:</strong> ~$0.30 per resume (Opus 4.1)
                    </p>
                  )}
                  {provider === 'gemini' && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      <strong>Cost:</strong> Free tier (20 requests/day)
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={handleSave}
                    disabled={isLoading || !apiKey.trim()}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    {isLoading ? 'Saving...' : 'Save Config'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};
