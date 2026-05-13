import { useCallback } from 'react';
import { useResumeStoreV2 } from '@/store/resumeStore';
import type { OptimizationResult } from '@/store/resumeStore';

/**
 * Hook for optimizing resume iteratively until 80-90+ ATS score
 * 
 * Calls: POST /api/v2/resume/optimize-to-target
 * Returns: Optimized content + final LaTeX + ATS score
 * Max iterations: 3
 */
export const useOptimizeResume = () => {
  const {
    extractedContentJson,
    jobDescription,
    setOptimizationResult,
    setIsOptimizing,
    setFinalLatex,
    setError
  } = useResumeStoreV2();

  const optimizeResume = useCallback(
    async (targetScore: number = 90): Promise<OptimizationResult | null> => {
      try {
        // Validation
        if (!extractedContentJson) {
          setError('Resume content not found. Please upload a master resume first.');
          return null;
        }

        if (!jobDescription || jobDescription.trim().length === 0) {
          setError('Job description is required for optimization.');
          return null;
        }

        console.log(`🚀 Starting iterative optimization (target: ${targetScore}+)...`);
        setIsOptimizing(true);
        setError(null);

        // Call API
        const response = await fetch('/api/v2/resume/optimize-to-target', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jobDescription,
            targetScore,
            maxIterations: 3
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.message || `Optimization failed (${response.status})`;
          console.error('❌ Optimization error:', errorMessage);
          setError(errorMessage);
          return null;
        }

        const data = await response.json();

        if (!data.data) {
          setError('Invalid response from server');
          return null;
        }

        const result: OptimizationResult = {
          optimized_content_json: data.data.optimized_content_json,
          final_latex: data.data.final_latex,
          final_ats_score: data.data.final_ats_score,
          target_reached: data.data.target_reached,
          iterations: data.data.iterations,
          optimization_history: data.data.optimization_history || []
        };

        console.log(`✅ Optimization complete (Final Score: ${result.final_ats_score}/100, Iterations: ${result.iterations})`);

        // Store in Zustand
        setOptimizationResult(result);
        setFinalLatex(result.final_latex);

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('❌ Optimization error:', errorMessage);
        setError(errorMessage);
        return null;
      } finally {
        setIsOptimizing(false);
      }
    },
    [extractedContentJson, jobDescription, setOptimizationResult, setIsOptimizing, setFinalLatex, setError]
  );

  return {
    optimizeResume,
    isOptimizing: useResumeStoreV2((state) => state.isOptimizing),
    error: useResumeStoreV2((state) => state.error),
    optimizationResult: useResumeStoreV2((state) => state.optimizationResult)
  };
};

export default useOptimizeResume;
