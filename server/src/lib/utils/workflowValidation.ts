/**
 * Utility functions for validating workflow code
 */

import { z } from 'zod';
import logger from '@shared/core/logger.js';

// Zod schema for workflow metadata
export const WorkflowMetadataSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().optional(),
  version: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Regex patterns for workflow validation
const patterns = {
  defineWorkflow: /defineWorkflow\s*\(\s*({[\s\S]*?})\s*,\s*(async\s*\(\s*context\s*\)\s*=>[\s\S]*?)\)/,
  contextUsage: /context\.(actions|data|events|logger|setState|getCurrentState)/g,
  asyncAwait: /async[\s\S]*?await/,
  errorHandling: /try\s*{[\s\S]*?}\s*catch\s*\(/,
};

/**
 * Extract metadata from workflow code
 * 
 * @param code TypeScript workflow code
 * @returns Extracted metadata or null if not found
 */
export function extractWorkflowMetadata(code: string): z.infer<typeof WorkflowMetadataSchema> | null {
  try {
    // Extract metadata object from defineWorkflow call
    const metadataMatch = code.match(patterns.defineWorkflow);
    
    if (!metadataMatch || !metadataMatch[1]) {
      return null;
    }
    
    // Clean up the metadata string
    const metadataStr = metadataMatch[1]
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*/g, ''); // Remove line comments
    
    // Parse the metadata object
    // eslint-disable-next-line no-new-func
    const metadata = new Function(`return ${metadataStr}`)();
    
    // Validate with Zod schema
    return WorkflowMetadataSchema.parse(metadata);
  } catch (error) {
    logger.error("Error extracting workflow metadata:", error);
    return null;
  }
}

/**
 * Validate workflow code structure
 * 
 * @param code TypeScript workflow code
 * @returns Validation result with errors if any
 */
export function validateWorkflowCode(code: string): { 
  valid: boolean; 
  errors: string[];
  warnings: string[];
  metadata: z.infer<typeof WorkflowMetadataSchema> | null;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  let metadata: z.infer<typeof WorkflowMetadataSchema> | null = null;
  
  // Check if code is empty
  if (!code || code.trim() === '') {
    errors.push("Workflow code cannot be empty");
    return { valid: false, errors, warnings, metadata };
  }
  
  // Check for defineWorkflow pattern
  if (!patterns.defineWorkflow.test(code)) {
    errors.push("Workflow must use the defineWorkflow function");
    return { valid: false, errors, warnings, metadata };
  }
  
  // Extract and validate metadata
  try {
    metadata = extractWorkflowMetadata(code);
    if (!metadata) {
      errors.push("Could not extract workflow metadata");
    }
  } catch (error) {
    errors.push(`Invalid workflow metadata: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Check for context usage
  if (!patterns.contextUsage.test(code)) {
    warnings.push("Workflow doesn't appear to use the context object (actions, data, events, logger, setState)");
  }
  
  // Check for async/await usage
  if (!patterns.asyncAwait.test(code)) {
    warnings.push("Workflow doesn't appear to use async/await for asynchronous operations");
  }
  
  // Check for error handling
  if (!patterns.errorHandling.test(code)) {
    warnings.push("Workflow doesn't appear to include error handling (try/catch blocks)");
  }
  
  // Check for setState usage
  if (!code.includes('context.setState')) {
    warnings.push("Workflow doesn't appear to use context.setState to track workflow state");
  }
  
  // Check for syntax errors
  try {
    // Simple syntax check using Function constructor
    // This won't catch all TypeScript errors but will catch basic syntax issues
    // eslint-disable-next-line no-new-func
    new Function(code);
  } catch (error) {
    errors.push(`Syntax error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metadata
  };
}

/**
 * Check if workflow code contains potentially unsafe operations
 * 
 * @param code TypeScript workflow code
 * @returns Array of security warnings
 */
export function checkWorkflowSecurity(code: string): string[] {
  const warnings: string[] = [];
  
  // Check for potentially dangerous operations (basic, we will also use isolated VM for more advanced checks)
  const dangerousPatterns = [
    { pattern: /process\.env/g, message: "Accessing process.env" },
    { pattern: /require\s*\(/g, message: "Using require() function" },
    { pattern: /import\s*\(/g, message: "Using dynamic import()" },
    { pattern: /eval\s*\(/g, message: "Using eval() function" },
    { pattern: /Function\s*\(/g, message: "Using Function constructor" },
    { pattern: /new\s+Function/g, message: "Using new Function()" },
    { pattern: /fs\./g, message: "Accessing file system (fs)" },
    { pattern: /child_process/g, message: "Accessing child_process" },
    { pattern: /http\.request/g, message: "Making HTTP requests directly" },
    { pattern: /https\.request/g, message: "Making HTTPS requests directly" },
    { pattern: /fetch\s*\(/g, message: "Making fetch requests directly" },
    { pattern: /XMLHttpRequest/g, message: "Using XMLHttpRequest directly" },
    { pattern: /document\./g, message: "Accessing browser DOM" },
    { pattern: /window\./g, message: "Accessing browser window object" },
    { pattern: /localStorage/g, message: "Accessing localStorage" },
    { pattern: /sessionStorage/g, message: "Accessing sessionStorage" },
    { pattern: /indexedDB/g, message: "Accessing indexedDB" },
    { pattern: /navigator\./g, message: "Accessing navigator object" },
  ];
  
  // Check for each dangerous pattern
  for (const { pattern, message } of dangerousPatterns) {
    if (pattern.test(code)) {
      warnings.push(`Security warning: ${message} detected in workflow code`);
    }
  }
  
  return warnings;
}