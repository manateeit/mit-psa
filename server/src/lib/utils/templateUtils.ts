/**
 * Utility functions for working with workflow templates
 */

/**
 * Extract code from a template definition
 * 
 * @param definition Template definition object
 * @returns Extracted code or placeholder message
 */
export function extractTemplateCode(definition: any): string {
  try {
    if (definition && typeof definition === 'object') {
      // If definition has executeFn property, return it
      if (definition.executeFn && typeof definition.executeFn === 'string') {
        return definition.executeFn;
      }
      
      // If definition is stringified, try to parse it
      if (typeof definition === 'string') {
        try {
          const parsed = JSON.parse(definition);
          if (parsed.executeFn && typeof parsed.executeFn === 'string') {
            return parsed.executeFn;
          }
        } catch (e) {
          // Not a valid JSON string, return as is
          return definition;
        }
      }
    }
    
    return "// No code available for this template";
  } catch (error) {
    console.error("Error extracting template code:", error);
    return "// Error extracting template code";
  }
}

/**
 * Format parameter schema for display
 * 
 * @param schema Parameter schema object
 * @returns Formatted schema as string
 */
export function formatParameterSchema(schema: any): string {
  try {
    if (!schema) return "// No parameters required";
    
    if (typeof schema === 'string') {
      try {
        schema = JSON.parse(schema);
      } catch (e) {
        return schema;
      }
    }
    
    return JSON.stringify(schema, null, 2);
  } catch (error) {
    console.error("Error formatting parameter schema:", error);
    return "// Error formatting parameter schema";
  }
}