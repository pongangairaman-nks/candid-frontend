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
  use_latex_template: boolean;
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
    { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet (Recommended)', provider: 'claude' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku (Cheap & Fast)', provider: 'claude' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Best Quality)', provider: 'claude' },
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Cheapest)', provider: 'openai' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
  ],
  gemini: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Free)', provider: 'gemini' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'gemini' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini' },
    { id: 'gemini-3-flash', name: 'Gemini 3 Flash', provider: 'gemini' },
  ],
};

export const LLMConfigSection = () => {
  const [providers, setProviders] = useState<Array<{id: string; name: string; provider: string}>>([]);
  
  const [analyzerProvider, setAnalyzerProvider] = useState('claude');
  const [analyzerModel, setAnalyzerModel] = useState('claude-3-sonnet-20240229');
  const [analyzerApiKey, setAnalyzerApiKey] = useState('');
  const [analyzerApiKeyVisible, setAnalyzerApiKeyVisible] = useState(false);
  const [analyzerAvailableModels, setAnalyzerAvailableModels] = useState<Model[]>([]);
  const [loadingAnalyzerModels, setLoadingAnalyzerModels] = useState(false);

  const [generatorProvider, setGeneratorProvider] = useState('openai');
  const [generatorModel, setGeneratorModel] = useState('gpt-4o-mini');
  const [generatorApiKey, setGeneratorApiKey] = useState('');
  const [generatorApiKeyVisible, setGeneratorApiKeyVisible] = useState(false);
  const [generatorAvailableModels, setGeneratorAvailableModels] = useState<Model[]>([]);
  const [loadingGeneratorModels, setLoadingGeneratorModels] = useState(false);

  const [useLatexTemplate, setUseLatexTemplate] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/llm/providers`);
        if (response.ok) {
          const data = await response.json();
          setProviders(data);
          console.log(`✅ Fetched ${data.length} providers`);
        }
      } catch (error) {
        console.error('❌ Error fetching providers:', error);
      }
    };
    fetchProviders();
  }, []);

  // Fetch models for a specific provider using backend's saved API key
  const fetchModelsForProvider = async (type: 'analyzer' | 'generator', selectedProvider: string) => {
    try {
      if (type === 'analyzer') {
        setLoadingAnalyzerModels(true);
      } else {
        setLoadingGeneratorModels(true);
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('⚠️ No auth token found');
        const defaultModels = AVAILABLE_MODELS[selectedProvider] || [];
        if (type === 'analyzer') {
          setAnalyzerAvailableModels(defaultModels);
        } else {
          setGeneratorAvailableModels(defaultModels);
        }
        return;
      }

      const url = `${API_BASE_URL}/llm/models-for-user/${selectedProvider}`;
      console.log(`🔍 Fetching models for ${type} (${selectedProvider}) from backend`);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.models && data.models.length > 0) {
          console.log(`✅ Fetched ${data.models.length} models for ${selectedProvider} (source: ${data.source})`);
          if (type === 'analyzer') {
            setAnalyzerAvailableModels(data.models);
          } else {
            setGeneratorAvailableModels(data.models);
          }
        } else {
          console.warn(`⚠️ No models returned for ${selectedProvider}, using defaults`);
          const defaultModels = AVAILABLE_MODELS[selectedProvider] || [];
          if (type === 'analyzer') {
            setAnalyzerAvailableModels(defaultModels);
          } else {
            setGeneratorAvailableModels(defaultModels);
          }
        }
      } else {
        console.warn(`⚠️ Failed to fetch models for ${selectedProvider}, using defaults`);
        const defaultModels = AVAILABLE_MODELS[selectedProvider] || [];
        if (type === 'analyzer') {
          setAnalyzerAvailableModels(defaultModels);
        } else {
          setGeneratorAvailableModels(defaultModels);
        }
      }
    } catch (error) {
      console.error(`❌ Error fetching models for ${selectedProvider}:`, error);
      const defaultModels = AVAILABLE_MODELS[selectedProvider] || [];
      if (type === 'analyzer') {
        setAnalyzerAvailableModels(defaultModels);
      } else {
        setGeneratorAvailableModels(defaultModels);
      }
    } finally {
      if (type === 'analyzer') {
        setLoadingAnalyzerModels(false);
      } else {
        setLoadingGeneratorModels(false);
      }
    }
  };

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
          
          // Use the saved provider and model directly (no validation against static list)
          // Models are now dynamically fetched, so we trust the saved values
          const analyzerProvider = config.analyzer_provider || 'claude';
          const analyzerModel = config.analyzer_model || 'claude-3-5-sonnet-latest';
          
          const generatorProvider = config.generator_provider || 'openai';
          const generatorModel = config.generator_model || 'gpt-4o-mini';
          
          // Update cache
          globalConfigCache = {
            data: config,
            timestamp: now,
          };

          setAnalyzerProvider(analyzerProvider);
          setAnalyzerModel(analyzerModel);
          if (config.analyzer_api_key) {
            setAnalyzerApiKey(config.analyzer_api_key);
          }
          setGeneratorProvider(generatorProvider);
          setGeneratorModel(generatorModel);
          if (config.generator_api_key) {
            setGeneratorApiKey(config.generator_api_key);
          }
          // Phase 1: Lock LaTeX mode ON regardless of stored value
          setUseLatexTemplate(true);
          
          // Fetch models for both providers
          if (config.analyzer_api_key) {
            await fetchModelsForProvider('analyzer', analyzerProvider);
          }
          if (config.generator_api_key) {
            await fetchModelsForProvider('generator', generatorProvider);
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

  // Fetch models when provider changes
  useEffect(() => {
    if (analyzerProvider) {
      fetchModelsForProvider('analyzer', analyzerProvider);
    }
  }, [analyzerProvider]);

  useEffect(() => {
    if (generatorProvider) {
      fetchModelsForProvider('generator', generatorProvider);
    }
  }, [generatorProvider]);

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
          // Phase 1: Lock LaTeX mode ON
          use_latex_template: true,
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
          // Phase 1: Lock LaTeX mode ON regardless of stored value
          setUseLatexTemplate(true);
          
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

  // Use dynamically fetched models if available, otherwise use defaults
  const analyzerModels = analyzerAvailableModels.length > 0 
    ? analyzerAvailableModels 
    : AVAILABLE_MODELS[analyzerProvider] || [];
  const generatorModels = generatorAvailableModels.length > 0 
    ? generatorAvailableModels 
    : AVAILABLE_MODELS[generatorProvider] || [];
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

              <div className="p-6 bg-linear-to-br from-indigo-50 to-indigo-50/50 dark:from-indigo-900/20 dark:to-indigo-900/10 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                  ATS Friendly Resume Optimizer Model
                </h3>

                <div className="space-y-4">
                  <CustomSelect
                    label="Provider"
                    options={providers.length > 0 ? providers : [
                      { id: 'claude', name: 'Claude (Anthropic)', provider: 'claude' },
                      { id: 'openai', name: 'OpenAI', provider: 'openai' },
                      { id: 'gemini', name: 'Gemini (Google)', provider: 'gemini' },
                    ]}
                    value={generatorProvider}
                    onChange={(newProvider) => {
                      setGeneratorProvider(newProvider);
                      setGeneratorModel(AVAILABLE_MODELS[newProvider]?.[0]?.id || '');
                      setGeneratorAvailableModels([]);
                      // Fetch models for the selected provider
                      fetchModelsForProvider('generator', newProvider);
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

              <div className="p-6 bg-linear-to-br from-blue-50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                  ATS Score Analyzer Model
                </h3>

                <div className="space-y-4">
                  <CustomSelect
                    label="Provider"
                    options={providers.length > 0 ? providers : [
                      { id: 'claude', name: 'Claude (Anthropic)', provider: 'claude' },
                      { id: 'openai', name: 'OpenAI', provider: 'openai' },
                      { id: 'gemini', name: 'Gemini (Google)', provider: 'gemini' },
                    ]}
                    value={analyzerProvider}
                    onChange={(newProvider) => {
                      setAnalyzerProvider(newProvider);
                      setAnalyzerModel(AVAILABLE_MODELS[newProvider]?.[0]?.id || '');
                      setAnalyzerAvailableModels([]);
                      // Fetch models for the selected provider
                      fetchModelsForProvider('analyzer', newProvider);
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

              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      Use LaTeX Resume Template
                    </label>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Resume will be generated and downloaded as LaTeX/PDF
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Locked for Phase 1</p>
                  </div>
                  <button
                    aria-disabled
                    title="Locked for Phase 1"
                    className={`relative inline-flex h-8 w-14 items-center rounded-full bg-indigo-600 dark:bg-indigo-500 opacity-60 pointer-events-none`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white translate-x-7`}
                    />
                  </button>
                </div>
              </div>

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
