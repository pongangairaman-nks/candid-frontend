'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Cache for LLM config to prevent unnecessary API calls
interface ConfigCache {
  data: LLMConfigData | null;
  timestamp: number;
}

interface LLMConfigData {
  analyzerProvider: string;
  analyzerModel: string;
  analyzerApiKey: string | null;
  generatorProvider: string;
  generatorModel: string;
  generatorApiKey: string | null;
  masterContent: string | null;
  useLatexTemplate: boolean;
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

  const fetchProvidersInitiatedRef = useRef(false);
  const fetchConfigInitiatedRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const providerEffectsCountRef = useRef(0);

  // Fetch providers on mount
  useEffect(() => {
    console.log('🔍 [LLMConfigSection] fetchProviders effect triggered, initiated:', fetchProvidersInitiatedRef.current);
    if (fetchProvidersInitiatedRef.current) {
      console.log('⏭️ [LLMConfigSection] Skipping fetchProviders - already initiated');
      return;
    }

    const fetchProviders = async () => {
      console.log('📡 [LLMConfigSection] Starting fetchProviders...');
      try {
        const response = await fetch(`${API_BASE_URL}/llm/providers`);
        console.log('📊 [LLMConfigSection] fetchProviders response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          setProviders(data);
          console.log(`✅ [LLMConfigSection] Fetched ${data.length} providers`);
        }
      } catch (error) {
        console.error('❌ [LLMConfigSection] Error fetching providers:', error);
      }
    };

    fetchProvidersInitiatedRef.current = true;
    console.log('🚀 [LLMConfigSection] Setting fetchProvidersInitiatedRef to true');
    fetchProviders();
  }, []);

  // Fetch models for a specific provider using backend's saved API key
  const fetchModelsForProvider = async (type: 'analyzer' | 'generator', selectedProvider: string) => {
    console.log(`🔍 [LLMConfigSection] fetchModelsForProvider called: type=${type}, provider=${selectedProvider}`);
    try {
      if (type === 'analyzer') {
        setLoadingAnalyzerModels(true);
      } else {
        setLoadingGeneratorModels(true);
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('⚠️ [LLMConfigSection] No auth token found');
        const defaultModels = AVAILABLE_MODELS[selectedProvider] || [];
        if (type === 'analyzer') {
          setAnalyzerAvailableModels(defaultModels);
        } else {
          setGeneratorAvailableModels(defaultModels);
        }
        return;
      }

      const url = `${API_BASE_URL}/llm/models-for-user/${selectedProvider}`;
      console.log(`� [LLMConfigSection] Fetching models for ${type} (${selectedProvider}) from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log(`📊 [LLMConfigSection] Models response status for ${type} (${selectedProvider}):`, response.status);
      
      if (response.ok) {
        const data = await response.json();
        if (data.models && data.models.length > 0) {
          console.log(`✅ [LLMConfigSection] Fetched ${data.models.length} models for ${selectedProvider} (source: ${data.source})`);
          if (type === 'analyzer') {
            setAnalyzerAvailableModels(data.models);
          } else {
            setGeneratorAvailableModels(data.models);
          }
        } else {
          console.warn(`⚠️ [LLMConfigSection] No models returned for ${selectedProvider}, using defaults`);
          const defaultModels = AVAILABLE_MODELS[selectedProvider] || [];
          if (type === 'analyzer') {
            setAnalyzerAvailableModels(defaultModels);
          } else {
            setGeneratorAvailableModels(defaultModels);
          }
        }
      } else {
        console.warn(`⚠️ [LLMConfigSection] Failed to fetch models for ${selectedProvider} (status: ${response.status}), using defaults`);
        const defaultModels = AVAILABLE_MODELS[selectedProvider] || [];
        if (type === 'analyzer') {
          setAnalyzerAvailableModels(defaultModels);
        } else {
          setGeneratorAvailableModels(defaultModels);
        }
      }
    } catch (error) {
      console.error(`❌ [LLMConfigSection] Error fetching models for ${selectedProvider}:`, error);
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
    console.log('🔍 [LLMConfigSection] fetchConfig effect triggered, initiated:', fetchConfigInitiatedRef.current); // Force rebuild
    if (fetchConfigInitiatedRef.current) {
      console.log('⏭️ [LLMConfigSection] Skipping fetchConfig - already initiated');
      return;
    }

    const fetchConfig = async () => {
      console.log('📡 [LLMConfigSection] Starting fetchConfig...');
      try {
        setIsFetching(true);
        const token = localStorage.getItem('authToken');

        if (!token) {
          console.warn('⚠️ [LLMConfigSection] No auth token found');
          setIsFetching(false);
          return;
        }

        // Check cache first
        const now = Date.now();
        if (globalConfigCache.data && now - globalConfigCache.timestamp < CACHE_DURATION) {
          console.log('💾 [LLMConfigSection] Using cached config (cache age:', now - globalConfigCache.timestamp, 'ms)');
          // Use cached data
          const config = globalConfigCache.data;
          setAnalyzerProvider(config.analyzerProvider);
          setAnalyzerModel(config.analyzerModel);
          if (config.analyzerApiKey) {
            setAnalyzerApiKey(config.analyzerApiKey);
          }
          setGeneratorProvider(config.generatorProvider);
          setGeneratorModel(config.generatorModel);
          if (config.generatorApiKey) {
            setGeneratorApiKey(config.generatorApiKey);
          }
          setIsFetching(false);
          return;
        }

        // Fetch from backend if cache expired
        console.log('🌐 [LLMConfigSection] Cache expired or empty, fetching from backend...');
        const response = await fetch(`${API_BASE_URL}/llm/config`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('📊 [LLMConfigSection] Config response status:', response.status);

        if (response.ok) {
          const config = await response.json();
          console.log('✅ [LLMConfigSection] Config fetched successfully');
          
          // Use the saved provider and model directly (no validation against static list)
          // Models are now dynamically fetched, so we trust the saved values
          const analyzerProvider = config.analyzerProvider || 'claude';
          const analyzerModel = config.analyzerModel || 'claude-3-5-sonnet-latest';
          
          const generatorProvider = config.generatorProvider || 'openai';
          const generatorModel = config.generatorModel || 'gpt-4o-mini';
          
          // Update cache
          globalConfigCache = {
            data: config,
            timestamp: now,
          };
          console.log('💾 [LLMConfigSection] Config cached');

          setAnalyzerProvider(analyzerProvider);
          setAnalyzerModel(analyzerModel);
          if (config.analyzerApiKey) {
            setAnalyzerApiKey(config.analyzerApiKey);
          }
          setGeneratorProvider(generatorProvider);
          setGeneratorModel(generatorModel);
          if (config.generatorApiKey) {
            setGeneratorApiKey(config.generatorApiKey);
          }
          // Phase 1: Lock LaTeX mode ON regardless of stored value
          setUseLatexTemplate(true);
        } else {
          console.warn('⚠️ [LLMConfigSection] Failed to fetch config, status:', response.status);
        }
      } catch (error) {
        console.error('❌ [LLMConfigSection] Failed to fetch config:', error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchConfigInitiatedRef.current = true;
    console.log('🚀 [LLMConfigSection] Setting fetchConfigInitiatedRef to true');
    fetchConfig();
  }, []);

  // Fetch models when provider changes (skip during initial load)
  useEffect(() => {
    console.log('🔍 [LLMConfigSection] analyzerProvider effect triggered, isInitialLoad:', isInitialLoadRef.current, 'provider:', analyzerProvider);
    if (isInitialLoadRef.current) {
      console.log('⏭️ [LLMConfigSection] Skipping analyzerProvider effect - initial load');
      providerEffectsCountRef.current += 1;
      console.log('📊 [LLMConfigSection] Provider effects count:', providerEffectsCountRef.current);
      // Reset isInitialLoadRef only after both provider effects have run once
      if (providerEffectsCountRef.current >= 2) {
        console.log('✅ [LLMConfigSection] Both provider effects ran during initial load, setting isInitialLoadRef to false');
        isInitialLoadRef.current = false;
      }
      return;
    }
    if (analyzerProvider) {
      console.log('📡 [LLMConfigSection] analyzerProvider changed, fetching models for:', analyzerProvider);
      fetchModelsForProvider('analyzer', analyzerProvider);
    }
  }, [analyzerProvider]);

  useEffect(() => {
    console.log('🔍 [LLMConfigSection] generatorProvider effect triggered, isInitialLoad:', isInitialLoadRef.current, 'provider:', generatorProvider);
    if (isInitialLoadRef.current) {
      console.log('⏭️ [LLMConfigSection] Skipping generatorProvider effect - initial load');
      providerEffectsCountRef.current += 1;
      console.log('📊 [LLMConfigSection] Provider effects count:', providerEffectsCountRef.current);
      // Reset isInitialLoadRef only after both provider effects have run once
      if (providerEffectsCountRef.current >= 2) {
        console.log('✅ [LLMConfigSection] Both provider effects ran during initial load, setting isInitialLoadRef to false');
        isInitialLoadRef.current = false;
      }
      return;
    }
    if (generatorProvider) {
      console.log('📡 [LLMConfigSection] generatorProvider changed, fetching models for:', generatorProvider);
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
          analyzerProvider: analyzerProvider,
          analyzerModel: analyzerModel,
          analyzerApiKey: analyzerApiKey,
          generatorProvider: generatorProvider,
          generatorModel: generatorModel,
          generatorApiKey: generatorApiKey,
          // Phase 1: Lock LaTeX mode ON
          useLatexTemplate: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage('Configuration saved successfully!');
        // Update state with returned config data including API keys
        if (data.config) {
          setAnalyzerProvider(data.config.analyzerProvider);
          setAnalyzerModel(data.config.analyzerModel);
          setAnalyzerApiKey(data.config.analyzerApiKey || '');
          setGeneratorProvider(data.config.generatorProvider);
          setGeneratorModel(data.config.generatorModel);
          setGeneratorApiKey(data.config.generatorApiKey || '');
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
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Provider</label>
                    <select
                      value={generatorProvider}
                      onChange={(e) => {
                        setGeneratorProvider(e.target.value);
                        setGeneratorModel(AVAILABLE_MODELS[e.target.value]?.[0]?.id || '');
                        setGeneratorAvailableModels([]);
                        fetchModelsForProvider('generator', e.target.value);
                      }}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="claude">Claude (Anthropic)</option>
                      <option value="openai">OpenAI</option>
                      <option value="gemini">Gemini (Google)</option>
                    </select>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Choose the LLM provider for generating tailored resumes</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Model</label>
                    <select
                      value={generatorModel}
                      onChange={(e) => setGeneratorModel(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {generatorModels.map((model) => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {generatorProvider === 'claude'
                        ? 'Opus 4.1 recommended for best resume quality and ATS score'
                        : 'Flash models are free tier with daily limits'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        // type={generatorApiKeyVisible ? 'text' : 'password'}
                        type="text"
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
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Provider</label>
                    <select
                      value={analyzerProvider}
                      onChange={(e) => {
                        setAnalyzerProvider(e.target.value);
                        setAnalyzerModel(AVAILABLE_MODELS[e.target.value]?.[0]?.id || '');
                        setAnalyzerAvailableModels([]);
                        fetchModelsForProvider('analyzer', e.target.value);
                      }}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="claude">Claude (Anthropic)</option>
                      <option value="openai">OpenAI</option>
                      <option value="gemini">Gemini (Google)</option>
                    </select>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Choose the LLM provider for analyzing job descriptions</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Model</label>
                    <select
                      value={analyzerModel}
                      onChange={(e) => setAnalyzerModel(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {analyzerModels.map((model) => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {analyzerProvider === 'claude'
                        ? 'Opus 4.1 recommended for best analysis quality'
                        : 'Flash models are free tier with daily limits'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        // type={analyzerApiKeyVisible ? 'text' : 'password'}
                        type="text"
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
