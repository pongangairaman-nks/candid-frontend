/**
 * LaTeX Compiler Utility
 * Compiles Handlebars template with extracted JSON to generate final LaTeX code
 */

export interface ExtractedResumeJson {
  metadata: {
    name: string;
    email: string;
    phone: string;
    location: string;
    links?: Array<{
      label: string;
      url: string;
    }>;
  };
  sections: {
    [key: string]: {
      type: string;
      title: string;
      content?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items?: Array<any>;
    };
  };
}

/**
 * Simple template compiler that replaces {{variable}} placeholders
 * This is a lightweight alternative to Handlebars that works with LaTeX
 */
function compileTemplate(template: string, data: ExtractedResumeJson): string {
  let result = template;

  // Helper function to get nested values
  const getValue = (obj: unknown, path: string): unknown => {
    return path.split('.').reduce((current, prop) => {
      if (current && typeof current === 'object' && prop in current) {
        return (current as Record<string, unknown>)[prop];
      }
      return undefined;
    }, obj);
  };

  // Replace all {{variable}} placeholders
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getValue(data, path.trim());
    if (value === undefined || value === null) {
      return '';
    }
    return String(value);
  });

  // Handle {{#each array}}...{{/each}} blocks
  result = result.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayPath, content) => {
    const array = getValue(data, arrayPath.trim());
    if (!Array.isArray(array)) {
      return '';
    }

    return array
      .map((item) => {
        let itemContent = content;
        // Replace {{this.property}} with item values
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        itemContent = itemContent.replace(/\{\{this\.([^}]+)\}\}/g, (_itemMatch: string, prop: string) => {
          const itemValue = (item as Record<string, unknown>)[prop];
          return itemValue === undefined || itemValue === null ? '' : String(itemValue);
        });
        return itemContent;
      })
      .join('');
  });

  return result;
}

/**
 * Compile Handlebars template with extracted JSON to generate final LaTeX
 * @param handlebarsTemplate - LaTeX template with {{placeholders}}
 * @param extractedJson - Structured resume data
 * @returns Compiled LaTeX code
 */
export function compileLatexTemplate(
  handlebarsTemplate: string,
  extractedJson: ExtractedResumeJson
): string {
  try {
    const compiledLatex = compileTemplate(handlebarsTemplate, extractedJson);
    return compiledLatex;
  } catch (error) {
    console.error('❌ Error compiling LaTeX template:', error);
    throw new Error(`Failed to compile LaTeX template: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validate that compiled LaTeX is complete
 * @param latexCode - Compiled LaTeX code
 * @returns true if LaTeX appears complete
 */
export function validateCompiledLatex(latexCode: string): boolean {
  return (
    latexCode.includes('\\documentclass') &&
    latexCode.includes('\\begin{document}') &&
    latexCode.includes('\\end{document}')
  );
}
