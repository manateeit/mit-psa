/**
 * Converts a string to a JSON object.
 * @param str The string to convert
 * @returns The parsed JSON object, or null if parsing fails
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringToJson(str: string): any | null {
    try {
      // First, try parsing the string directly
      return JSON.parse(str);
    } catch (e) {
      // If direct parsing fails, try to clean the string
      try {
        // Replace single quotes with double quotes
        const cleanStr = str.replace(/'/g, '"')
          // Add double quotes to unquoted keys
          .replace(/(\w+):/g, '"$1":');
        return JSON.parse(cleanStr);
      } catch (e) {
        console.error('Failed to parse string to JSON:', e);
        return null;
      }
    }
  }
  