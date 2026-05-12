import { useCallback } from 'react';
import { useResumeStoreV2 } from '@/store/resumeStore';
import type { ATSAnalysisResult } from '@/store/resumeStore';

/**
 * Hook for analyzing resume against job description
 * 
 * Calls: POST /api/v2/resume/analyze
 * Returns: ATS score + weak sections + missing keywords
 */
export const useAnalyzeResume = () => {
  const {
    extractedContentJson,
    setATSAnalysis,
    setIsAnalyzing,
    setError
  } = useResumeStoreV2();

  const analyzeResume = useCallback(
    async (jobDescription: string): Promise<ATSAnalysisResult | null> => {
      try {
        // Validation
        if (!jobDescription || jobDescription.trim().length === 0) {
          setError('Job description cannot be empty');
          return null;
        }

        if (!extractedContentJson) {
          setError('Resume content not found. Please upload a master resume first.');
          return null;
        }

        console.log('📊 Starting resume analysis...');
        setIsAnalyzing(true);
        setError(null);

        // Call API
        const response = await fetch('/api/v2/resume/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jobDescription,
            resumeContentJson: extractedContentJson
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.message || `Analysis failed (${response.status})`;
          console.error('❌ Analysis error:', errorMessage);
          setError(errorMessage);
          return null;
        }

        const data = await response.json();

        if (!data.data) {
          setError('Invalid response from server');
          return null;
        }

        const analysis: ATSAnalysisResult = {
          ats_score: data.data.ats_score,
          analysis: data.data.analysis,
          weak_sections: data.data.weak_sections || [],
          missing_keywords: data.data.missing_keywords || [],
          optimization_priority: data.data.optimization_priority || []
        };

        console.log(`✅ Analysis complete (Score: ${analysis.ats_score}/100)`);

        // Store in Zustand
        setATSAnalysis(analysis);

        return analysis;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('❌ Analysis error:', errorMessage);
        setError(errorMessage);
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [extractedContentJson, setATSAnalysis, setIsAnalyzing, setError]
  );

  return {
    analyzeResume,
    isAnalyzing: useResumeStoreV2((state) => state.isAnalyzing),
    error: useResumeStoreV2((state) => state.error)
  };
};

export default useAnalyzeResume;
