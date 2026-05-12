import { useCallback } from 'react';

/**
 * Resume Renderer Hook
 * 
 * Compiles Handlebars templates and renders LaTeX locally
 * Deterministic rendering - no LLM involved
 */

interface ResumeContent {
  metadata?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    links?: Array<{ label: string; url: string }>;
  };
  sections?: Record<string, unknown>;
}

interface UseResumeRendererReturn {
  renderLatex: (template: string, content: ResumeContent) => string | null;
  validateLatex: (latex: string) => { isValid: boolean; errors: string[] };
  isLoading: boolean;
  error: string | null;
}

/**
 * Check if braces are balanced
 */
const checkBraceBalance = (latex: string): { isBalanced: boolean; message: string } => {
  let balance = 0;
  let minBalance = 0;

  for (let i = 0; i < latex.length; i++) {
    const char = latex[i];

    // Skip comments
    if (char === '%') {
      while (i < latex.length && latex[i] !== '\n') {
        i++;
      }
      continue;
    }

    if (char === '{') {
      balance++;
    } else if (char === '}') {
      balance--;
      if (balance < minBalance) {
        minBalance = balance;
      }
    }
  }

  if (balance !== 0) {
    return {
      isBalanced: false,
      message: `Final balance: ${balance} (${balance > 0 ? 'missing closing braces' : 'extra closing braces'})`
    };
  }

  if (minBalance < 0) {
    return {
      isBalanced: false,
      message: `Closing brace before opening brace at balance ${minBalance}`
    };
  }

  return { isBalanced: true, message: 'Braces are balanced' };
};

/**
 * Check if brackets are balanced
 */
const checkBracketBalance = (latex: string): { isBalanced: boolean; message: string } => {
  let balance = 0;

  for (let i = 0; i < latex.length; i++) {
    const char = latex[i];

    // Skip comments
    if (char === '%') {
      while (i < latex.length && latex[i] !== '\n') {
        i++;
      }
      continue;
    }

    if (char === '[') {
      balance++;
    } else if (char === ']') {
      balance--;
    }
  }

  if (balance !== 0) {
    return {
      isBalanced: false,
      message: `Final balance: ${balance}`
    };
  }

  return { isBalanced: true, message: 'Brackets are balanced' };
};

/**
 * Check if LaTeX environments are balanced
 */
const checkEnvironmentBalance = (latex: string): { isBalanced: boolean; message: string } => {
  const beginPattern = /\\begin\{(\w+)\}/g;
  const beginMatches: string[] = [];
  let match;

  while ((match = beginPattern.exec(latex)) !== null) {
    beginMatches.push(match[1]);
  }

  const endPattern = /\\end\{(\w+)\}/g;
  const endMatches: string[] = [];

  while ((match = endPattern.exec(latex)) !== null) {
    endMatches.push(match[1]);
  }

  // Check if all begin environments have corresponding end
  const unmatched: string[] = [];
  for (const env of beginMatches) {
    const endIndex = endMatches.indexOf(env);
    if (endIndex === -1) {
      unmatched.push(`Missing \\end{${env}}`);
    } else {
      endMatches.splice(endIndex, 1);
    }
  }

  if (unmatched.length > 0) {
    return {
      isBalanced: false,
      message: unmatched.join(', ')
    };
  }

  if (endMatches.length > 0) {
    return {
      isBalanced: false,
      message: `Extra \\end{${endMatches.join('}, \\end{')}}`
    };
  }

  return { isBalanced: true, message: 'Environments are balanced' };
};

/**
 * Hook for rendering LaTeX from Handlebars template + JSON content
 * 
 * @returns Object with render function, validation, and state
 */
export const useResumeRenderer = (): UseResumeRendererReturn => {
  /**
   * Validate rendered LaTeX for completeness and structure
   */
  const validateLatex = useCallback((latex: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!latex || latex.trim().length === 0) {
      errors.push('LaTeX content cannot be empty');
      return { isValid: false, errors };
    }

    // Check for required LaTeX structure
    if (!latex.includes('\\documentclass')) {
      errors.push('Missing \\documentclass command');
    }

    if (!latex.includes('\\begin{document}')) {
      errors.push('Missing \\begin{document}');
    }

    if (!latex.includes('\\end{document}')) {
      errors.push('Missing \\end{document}');
    }

    // Check for unresolved Handlebars placeholders
    const unresolvedPlaceholders = latex.match(/\{\{[^}]*\}\}/g);
    if (unresolvedPlaceholders && unresolvedPlaceholders.length > 0) {
      errors.push(`Unresolved placeholders: ${unresolvedPlaceholders.join(', ')}`);
    }

    // Check for balanced braces
    const braceBalance = checkBraceBalance(latex);
    if (!braceBalance.isBalanced) {
      errors.push(`Unbalanced braces: ${braceBalance.message}`);
    }

    // Check for balanced brackets
    const bracketBalance = checkBracketBalance(latex);
    if (!bracketBalance.isBalanced) {
      errors.push(`Unbalanced brackets: ${bracketBalance.message}`);
    }

    // Check for balanced LaTeX environments
    const envBalance = checkEnvironmentBalance(latex);
    if (!envBalance.isBalanced) {
      errors.push(`Unbalanced environments: ${envBalance.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  /**
   * Render LaTeX from template and content
   */
  const renderLatex = useCallback(
    (template: string, content: ResumeContent): string | null => {
      try {
        if (!template || template.trim().length === 0) {
          console.error('❌ Template cannot be empty');
          return null;
        }

        if (!content) {
          console.error('❌ Content JSON is required');
          return null;
        }

        console.log('🔄 Rendering LaTeX from template + JSON...');

        // Simple template rendering without external library
        let renderedLatex = template;

        // Replace metadata
        if (content.metadata?.name) {
          renderedLatex = renderedLatex.replace(/\{\{metadata\.name\}\}/g, content.metadata.name);
        }
        if (content.metadata?.email) {
          renderedLatex = renderedLatex.replace(/\{\{metadata\.email\}\}/g, content.metadata.email);
        }
        if (content.metadata?.phone) {
          renderedLatex = renderedLatex.replace(/\{\{metadata\.phone\}\}/g, content.metadata.phone);
        }
        if (content.metadata?.location) {
          renderedLatex = renderedLatex.replace(/\{\{metadata\.location\}\}/g, content.metadata.location);
        }

        // Replace sections
        if (content.sections) {
          Object.entries(content.sections).forEach(([sectionKey, section]) => {
            if (typeof section === 'object' && section !== null) {
              const sectionObj = section as Record<string, unknown>;
              if (sectionObj.content && typeof sectionObj.content === 'string') {
                const placeholder = `{{sections.${sectionKey}.content}}`;
                renderedLatex = renderedLatex.replace(new RegExp(placeholder, 'g'), sectionObj.content);
              }
            }
          });
        }

        if (!renderedLatex || renderedLatex.trim().length === 0) {
          console.error('❌ Rendered LaTeX is empty');
          return null;
        }

        // Validate rendered LaTeX
        const validation = validateLatex(renderedLatex);
        if (!validation.isValid) {
          console.error('❌ LaTeX validation failed:', validation.errors);
          return null;
        }

        console.log('✅ LaTeX rendering successful');
        return renderedLatex;
      } catch (error) {
        console.error('❌ LaTeX rendering error:', error instanceof Error ? error.message : String(error));
        return null;
      }
    },
    [validateLatex]
  );

  return {
    renderLatex,
    validateLatex,
    isLoading: false,
    error: null
  };
};

export default useResumeRenderer;
