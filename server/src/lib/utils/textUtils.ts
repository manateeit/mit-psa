/**
 * Utility functions for text processing
 */

/**
 * Extracts plain text from BlockNote JSON structure
 * @param jsonString - JSON string representing BlockNote content
 * @returns Extracted plain text with proper formatting
 */
export const extractTextFromBlocks = (jsonString: string): string => {
  try {
    const blocks = JSON.parse(jsonString);
    if (!Array.isArray(blocks)) return jsonString;
    
    return blocks.map((block: any) => {
      if (block.type === "paragraph" && Array.isArray(block.content)) {
        return block.content
          .filter((item: any) => item.type === "text")
          .map((item: any) => item.text)
          .join(" ");
      }
      return "";
    }).join("\n\n");
  } catch (e) {
    // If parsing fails, return the original string
    return jsonString;
  }
};
