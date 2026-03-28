'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { apiClient } from '@/services/api';

interface FeatureFlags {
  analyzerTierMode: boolean;
  atsMappingTierMode: boolean;
  sectionOptimizeQualityDefault: 'fast' | 'high';
  enableAnalyzeCache: boolean;
  enableAtsCache: boolean;
  enableMasterContentTrimming: boolean;
  contextTrimThreshold: number;
  atsDefaultMode: 'legacy' | 'llm';
  enableTwoStepGenerate: boolean;
}

export const FeatureFlagsPanel = () => {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [changes, setChanges] = useState<Partial<FeatureFlags>>({});

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ status: string; data: FeatureFlags }>('/feature-flags');
      if (response.data?.status === 'success') {
        setFlags(response.data.data);
        setChanges({});
      }
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof FeatureFlags) => {
    const newValue = !flags?.[key];
    setChanges({
      ...changes,
      [key]: newValue,
    });
  };

  const handleChange = (key: keyof FeatureFlags, value: boolean | 'fast' | 'high' | 'legacy' | 'llm') => {
    setChanges({
      ...changes,
      [key]: value,
    });
  };

  const handleSave = async () => {
    if (Object.keys(changes).length === 0) {
      setMessage({ type: 'error', text: 'No changes to save' });
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.post('/feature-flags/bulk', { flags: changes });
      if (response.data?.status === 'success') {
        setFlags({ ...flags, ...changes } as FeatureFlags);
        setChanges({});
        setMessage({ type: 'success', text: 'Settings saved successfully' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to save feature flags:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!flags) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
        <p>Failed to load settings</p>
      </div>
    );
  }

  const getCurrentValue = (key: keyof FeatureFlags) => 
    changes.hasOwnProperty(key) ? changes[key] : flags[key];

  return (
    <div className="space-y-6">
      {/* Cost Optimization Section */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Cost Optimization Settings
        </h3>

        {/* Analyzer Tier */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Analyzer Cost Mode
              </label>
              <p className="text-xs text-gray-500">
                Force cheap models for job analysis (faster, slightly lower quality)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2 py-1 rounded bg-amber-100 text-amber-800">
                {getCurrentValue('analyzerTierMode') ? 'CHEAP' : 'USER CHOICE'}
              </span>
              <button
                onClick={() => handleToggle('analyzerTierMode')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  getCurrentValue('analyzerTierMode') ? 'bg-red-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    getCurrentValue('analyzerTierMode') ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ATS Mapping Tier */}
          <div className="flex items-center justify-between bg-white p-4 rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ATS Mapping Cost Mode
              </label>
              <p className="text-xs text-gray-500">
                Use cheap models for ATS requirement mapping (saves cost)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2 py-1 rounded bg-amber-100 text-amber-800">
                {getCurrentValue('atsMappingTierMode') ? 'CHEAP' : 'STRONG'}
              </span>
              <button
                onClick={() => handleToggle('atsMappingTierMode')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  getCurrentValue('atsMappingTierMode') ? 'bg-red-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    getCurrentValue('atsMappingTierMode') ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Context Trimming */}
          <div className="flex items-center justify-between bg-white p-4 rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Master Content Trimming
              </label>
              <p className="text-xs text-gray-500">
                Trim master content to relevant chunks (reduces token usage by 30-50%)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-800">
                {getCurrentValue('enableMasterContentTrimming') ? 'ON' : 'OFF'}
              </span>
              <button
                onClick={() => handleToggle('enableMasterContentTrimming')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  getCurrentValue('enableMasterContentTrimming') ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    getCurrentValue('enableMasterContentTrimming') ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Caching Section */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">Caching & Performance</h3>

        <div className="space-y-4">
          {/* Analyze Cache */}
          <div className="flex items-center justify-between bg-white p-4 rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cache Job Analyses
              </label>
              <p className="text-xs text-gray-500">
                Skip re-analyzing unchanged job descriptions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-800">
                {getCurrentValue('enableAnalyzeCache') ? 'ON' : 'OFF'}
              </span>
              <button
                onClick={() => handleToggle('enableAnalyzeCache')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  getCurrentValue('enableAnalyzeCache') ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    getCurrentValue('enableAnalyzeCache') ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ATS Cache */}
          <div className="flex items-center justify-between bg-white p-4 rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cache ATS Results
              </label>
              <p className="text-xs text-gray-500">
                Reuse cached ATS analysis for same content
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-800">
                {getCurrentValue('enableAtsCache') ? 'ON' : 'OFF'}
              </span>
              <button
                onClick={() => handleToggle('enableAtsCache')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  getCurrentValue('enableAtsCache') ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    getCurrentValue('enableAtsCache') ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quality & Defaults Section */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-4">Quality & Defaults</h3>

        <div className="space-y-4">
          {/* Section Optimize Quality */}
          <div className="flex items-center justify-between bg-white p-4 rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section Optimize Default Quality
              </label>
              <p className="text-xs text-gray-500">
                Choose between speed or quality for section optimizations
              </p>
            </div>
            <select
              value={getCurrentValue('sectionOptimizeQualityDefault') as 'fast' | 'high'}
              onChange={(e) =>
                handleChange('sectionOptimizeQualityDefault', e.target.value as 'fast' | 'high')
              }
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium"
            >
              <option value="fast">🚀 Fast (cheap model)</option>
              <option value="high">✨ High (strong model)</option>
            </select>
          </div>

          {/* ATS Default Mode */}
          <div className="flex items-center justify-between bg-white p-4 rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary ATS Scoring Mode
              </label>
              <p className="text-xs text-gray-500">
                Default ATS method when checking resume
              </p>
            </div>
            <select
              value={getCurrentValue('atsDefaultMode') as 'legacy' | 'llm'}
              onChange={(e) => handleChange('atsDefaultMode', e.target.value as 'legacy' | 'llm')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium"
            >
              <option value="legacy">📊 Legacy (rule-based, free)</option>
              <option value="llm">🤖 LLM-based (better, uses tokens)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || Object.keys(changes).length === 0}
        className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
          Object.keys(changes).length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : saving
            ? 'bg-blue-400 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {saving ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Settings
          </>
        )}
      </button>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-800">
          <strong>💡 Tip:</strong> These settings help you control the balance between cost and quality. Most users benefit from enabling caching and content trimming.
        </p>
      </div>
    </div>
  );
};

export default FeatureFlagsPanel;
