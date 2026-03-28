'use client';

import { useState, useEffect } from 'react';
import { BarChart, AlertCircle, Loader, RefreshCw } from 'lucide-react';
import { apiClient } from '@/services/api';

interface UsageSummary {
  period: string;
  totalCalls: number;
  uniqueEndpoints: number;
  uniqueProviders: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  avgLatencyMs: number;
  estimatedCost: string;
  lastCall: string;
}

interface UsageBreakdown {
  endpoint: string;
  phase: string;
  provider: string;
  model: string;
  callCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  avgLatencyMs: number;
  lastCall: string;
}

export const LLMUsageDashboard = () => {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [breakdown, setBreakdown] = useState<UsageBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');

  useEffect(() => {
    fetchUsage();
  }, [period]);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ status: string; data: { period: string; totals: UsageSummary; breakdown: UsageBreakdown[] } }>('/llm-usage', {
        params: { days: period },
      });
      if (response.data?.status === 'success') {
        setSummary(response.data.data.totals);
        setBreakdown(response.data.data.breakdown || []);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
        <p>Failed to load usage data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Time Period:</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        <button
          onClick={fetchUsage}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Calls */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Total Calls</p>
          <p className="text-2xl font-bold text-blue-900">{summary.totalCalls}</p>
          <p className="text-xs text-blue-600 mt-2">{summary.uniqueProviders} providers</p>
        </div>

        {/* Total Tokens */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <p className="text-xs text-purple-600 font-semibold uppercase mb-1">Total Tokens</p>
          <p className="text-2xl font-bold text-purple-900">{(summary.totalTokens / 1000).toFixed(1)}K</p>
          <p className="text-xs text-purple-600 mt-2">
            {((summary.inputTokens / summary.totalTokens) * 100).toFixed(0)}% input
          </p>
        </div>

        {/* Estimated Cost */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p className="text-xs text-green-600 font-semibold uppercase mb-1">Est. Cost</p>
          <p className="text-2xl font-bold text-green-900">${summary.estimatedCost}</p>
          <p className="text-xs text-green-600 mt-2">
            ~${(parseFloat(summary.estimatedCost) / Math.max(1, summary.totalCalls)).toFixed(4)}/call
          </p>
        </div>

        {/* Avg Latency */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <p className="text-xs text-orange-600 font-semibold uppercase mb-1">Avg Latency</p>
          <p className="text-2xl font-bold text-orange-900">{summary.avgLatencyMs}ms</p>
          <p className="text-xs text-orange-600 mt-2">
            Last call: {new Date(summary.lastCall).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Breakdown Table */}
      {breakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-2">
            <BarChart className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Usage Breakdown</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Endpoint</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Phase</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Provider/Model</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">Calls</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">Tokens</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">Latency</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-gray-900 font-medium">{row.endpoint}</td>
                    <td className="px-6 py-3 text-gray-600">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {row.phase}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      <div className="text-sm">{row.provider}</div>
                      <div className="text-xs text-gray-500">{row.model}</div>
                    </td>
                    <td className="px-6 py-3 text-right text-gray-900 font-semibold">{row.callCount}</td>
                    <td className="px-6 py-3 text-right text-gray-600">
                      <div className="text-sm">{(row.totalTokens / 1000).toFixed(1)}K</div>
                      <div className="text-xs text-gray-500">
                        {(row.inputTokens / 1000).toFixed(1)}K in
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right text-gray-600">{row.avgLatencyMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {breakdown.length === 0 && summary.totalCalls === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <BarChart className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">No usage data available for this period</p>
        </div>
      )}
    </div>
  );
};

export default LLMUsageDashboard;
