'use client';

import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Cache for LLM config to prevent unnecessary API calls
interface ConfigCache {
  data: LLMConfigData | null;
  timestamp: number;
}

interface LLMConfigData {
  analyzer_provider: string;
  analyzer_model: string;
  analyzer_api_key: string | null;
  generator_provider: string;
  generator_model: string;
  generator_api_key: string | null;
  master_content: string | null;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let globalConfigCache: ConfigCache = { data: null, timestamp: 0 };

interface Model {
  id: string;
  name: string;
  provider: string;
}

interface AvailableModels {
  [key: string]: Model[];
}

const AVAILABLE_MODELS: AvailableModels = {
  claude: [
    { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1 (Recommended)', provider: 'claude' },
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'claude' },
    { id: 'claude-haiku-4-20250805', name: 'Claude Haiku 4', provider: 'claude' },
  ],
  gemini: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Free)', provider: 'gemini' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'gemini' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini' },
    { id: 'gemini-3-flash', name: 'Gemini 3 Flash', provider: 'gemini' },
  ],
};

export const LLMConfigSection = () => {
  const [analyzerProvider, setAnalyzerProvider] = useState('gemini');
  const [analyzerModel, setAnalyzerModel] = useState('gemini-2.5-flash');
  const [analyzerApiKey, setAnalyzerApiKey] = useState('');
  const [analyzerApiKeyVisible, setAnalyzerApiKeyVisible] = useState(false);

  const [generatorProvider, setGeneratorProvider] = useState('claude');
  const [generatorModel, setGeneratorModel] = useState('claude-opus-4-1-20250805');
  const [generatorApiKey, setGeneratorApiKey] = useState('');
  const [generatorApiKeyVisible, setGeneratorApiKeyVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load config from backend on mount with caching
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsFetching(true);
        const token = localStorage.getItem('authToken');

        if (!token) {
          setIsFetching(false);
          return;
        }

        // Check cache first
        const now = Date.now();
        if (globalConfigCache.data && now - globalConfigCache.timestamp < CACHE_DURATION) {
          // Use cached data
          const config = globalConfigCache.data;
          setAnalyzerProvider(config.analyzer_provider);
          setAnalyzerModel(config.analyzer_model);
          if (config.analyzer_api_key) {
            setAnalyzerApiKey(config.analyzer_api_key);
          }
          setGeneratorProvider(config.generator_provider);
          setGeneratorModel(config.generator_model);
          if (config.generator_api_key) {
            setGeneratorApiKey(config.generator_api_key);
          }
          setIsFetching(false);
          return;
        }

        // Fetch from backend if cache expired
        const response = await fetch(`${API_BASE_URL}/llm/config`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const config = await response.json();
          
          // Update cache
          globalConfigCache = {
            data: config,
            timestamp: now,
          };

          setAnalyzerProvider(config.analyzer_provider);
          setAnalyzerModel(config.analyzer_model);
          if (config.analyzer_api_key) {
            setAnalyzerApiKey(config.analyzer_api_key);
          }
          setGeneratorProvider(config.generator_provider);
          setGeneratorModel(config.generator_model);
          if (config.generator_api_key) {
            setGeneratorApiKey(config.generator_api_key);
          }
        } else {
          console.warn('⚠️ Failed to fetch config, status:', response.status);
        }
      } catch (error) {
        console.error('❌ Failed to fetch config:', error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!analyzerApiKey.trim() || !generatorApiKey.trim()) {
      setErrorMessage('Both analyzer and generator API keys are required');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/llm/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          analyzer_provider: analyzerProvider,
          analyzer_model: analyzerModel,
          analyzer_api_key: analyzerApiKey,
          generator_provider: generatorProvider,
          generator_model: generatorModel,
          generator_api_key: generatorApiKey,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage('Configuration saved successfully!');
        // Update state with returned config data including API keys
        if (data.config) {
          setAnalyzerProvider(data.config.analyzer_provider);
          setAnalyzerModel(data.config.analyzer_model);
          setAnalyzerApiKey(data.config.analyzer_api_key || '');
          setGeneratorProvider(data.config.generator_provider);
          setGeneratorModel(data.config.generator_model);
          setGeneratorApiKey(data.config.generator_api_key || '');
          
          // Invalidate cache so next fetch gets fresh data
          globalConfigCache = { data: null, timestamp: 0 };
        }
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setErrorMessage('Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzerModels = AVAILABLE_MODELS[analyzerProvider] || [];
  const generatorModels = AVAILABLE_MODELS[generatorProvider] || [];
  const selectedAnalyzerModel = analyzerModels.find((m: Model) => m.id === analyzerModel)?.name || 'Unknown';
  const selectedGeneratorModel = generatorModels.find((m: Model) => m.id === generatorModel)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Configuration
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Manage your LLM providers, master template, and content repository
        </p>
      </div>

      {/* Tab Content */}
      {isFetching ? (
        <div className="text-center py-8">
          <Loader size={32} className="animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
          <p className="text-slate-600 dark:text-slate-400 mt-2">Loading configuration...</p>
        </div>
      ) : (
        <>
           <div className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-3">
                <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Two-Step Configuration:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Analyzer:</strong> Used to analyze job descriptions and extract keywords</li>
                    <li><strong>Generator:</strong> Used to tailor and generate resume content</li>
                    <li>You can use different providers for each step</li>
                    <li>Each requires its own API key</li>
                  </ul>
                </div>
              </div>

              <div className="p-6 bg-linear-to-br from-blue-50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                  Job Description Analyzer
                </h3>

                <div className="space-y-4">
                  <CustomSelect
                    label="Provider"
                    options={[
                      { id: 'claude', name: 'Claude (Anthropic)', provider: 'claude' },
                      { id: 'gemini', name: 'Gemini (Google)', provider: 'gemini' },
                    ]}
                    value={analyzerProvider}
                    onChange={(newProvider) => {
                      setAnalyzerProvider(newProvider);
                      setAnalyzerModel(AVAILABLE_MODELS[newProvider]?.[0]?.id || '');
                    }}
                    description="Choose the LLM provider for analyzing job descriptions"
                  />

                  <CustomSelect
                    label="Model"
                    options={analyzerModels}
                    value={analyzerModel}
                    onChange={(newModel) => setAnalyzerModel(newModel)}
                    description={
                      analyzerProvider === 'claude'
                        ? 'Opus 4.1 recommended for best analysis quality'
                        : 'Flash models are free tier with daily limits'
                    }
                  />

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        type={analyzerApiKeyVisible ? 'text' : 'password'}
                        value={analyzerApiKey}
                        onChange={(e) => {
                          setAnalyzerApiKey(e.target.value);
                          setErrorMessage('');
                        }}
                        placeholder={`Enter your ${analyzerProvider} API key`}
                        className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setAnalyzerApiKeyVisible(!analyzerApiKeyVisible)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-medium"
                      >
                        {analyzerApiKeyVisible ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-linear-to-br from-indigo-50 to-indigo-50/50 dark:from-indigo-900/20 dark:to-indigo-900/10 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                  Resume Generator
                </h3>

                <div className="space-y-4">
                  <CustomSelect
                    label="Provider"
                    options={[
                      { id: 'claude', name: 'Claude (Anthropic)', provider: 'claude' },
                      { id: 'gemini', name: 'Gemini (Google)', provider: 'gemini' },
                    ]}
                    value={generatorProvider}
                    onChange={(newProvider) => {
                      setGeneratorProvider(newProvider);
                      setGeneratorModel(AVAILABLE_MODELS[newProvider]?.[0]?.id || '');
                    }}
                    description="Choose the LLM provider for generating tailored resumes"
                  />

                  <CustomSelect
                    label="Model"
                    options={generatorModels}
                    value={generatorModel}
                    onChange={(newModel) => setGeneratorModel(newModel)}
                    description={
                      generatorProvider === 'claude'
                        ? 'Opus 4.1 recommended for best resume quality and ATS score'
                        : 'Flash models are free tier with daily limits'
                    }
                  />

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        type={generatorApiKeyVisible ? 'text' : 'password'}
                        value={generatorApiKey}
                        onChange={(e) => {
                          setGeneratorApiKey(e.target.value);
                          setErrorMessage('');
                        }}
                        placeholder={`Enter your ${generatorProvider} API key`}
                        className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setGeneratorApiKeyVisible(!generatorApiKeyVisible)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-medium"
                      >
                        {generatorApiKeyVisible ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">ANALYZER</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedAnalyzerModel}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">{analyzerProvider}</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">GENERATOR</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedGeneratorModel}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">{generatorProvider}</p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
                  <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-3">
                  <CheckCircle size={18} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={isLoading || !analyzerApiKey.trim() || !generatorApiKey.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold transition-colors dark:disabled:bg-slate-700"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin">⏳</div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Configuration
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setAnalyzerApiKey('');
                    setGeneratorApiKey('');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="px-6 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 font-medium transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
        </>
      )}
    </div>
  );
};
