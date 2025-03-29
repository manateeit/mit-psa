import { Block, PartialBlock } from '@blocknote/core';

/**
 * Converts BlockNote JSON content to Markdown format
 * 
 * This function uses a custom implementation to convert blocks to markdown.
 * It handles various block types including paragraphs, headings, tables, lists, etc.
 * 
 * @returns A string containing the markdown representation, never undefined
 */
export async function convertBlockNoteToMarkdown(blocks: Block[] | PartialBlock[] | string | undefined): Promise<string> {
  console.log("[convertBlockNoteToMarkdown] Called with:", typeof blocks === 'string' ? 'JSON string' : (blocks ? 'blocks array' : 'undefined'));
  
  if (!blocks) {
    console.log("[convertBlockNoteToMarkdown] No blocks provided, returning fallback message");
    return "[No content]";
  }
  
  let blockData: Block[] | PartialBlock[];
  if (typeof blocks === 'string') {
    try {
      blockData = JSON.parse(blocks);
      console.log("[convertBlockNoteToMarkdown] Successfully parsed JSON string to blocks:", blockData.length, "blocks");
    } catch (e) {
      console.error("[convertBlockNoteToMarkdown] Failed to parse BlockNote JSON string:", e);
      return "[Invalid content format]";
    }
  } else {
    blockData = blocks;
    console.log("[convertBlockNoteToMarkdown] Using provided blocks array:", blockData.length, "blocks");
  }
  
  // Try conversion methods in sequence and use the first one that works
  let markdown: string = "";
  
  // Skip the built-in converter that was causing issues
  // and go straight to our custom converter
  console.log("[convertBlockNoteToMarkdown] Using custom markdown converter");
  try {
    markdown = customBlocksToMarkdown(blockData);
    console.log("[convertBlockNoteToMarkdown] Custom markdown conversion result length:", markdown ? markdown.length : 0);
    console.log("[convertBlockNoteToMarkdown] Custom markdown conversion result:", markdown);
    
    if (markdown && markdown.trim() !== '') {
      console.log("[convertBlockNoteToMarkdown] Custom converter succeeded, returning result");
      return markdown;
    } else {
      console.log("[convertBlockNoteToMarkdown] Custom converter returned empty result, trying simple text extraction");
    }
  } catch (customError) {
    console.error("[convertBlockNoteToMarkdown] Custom markdown conversion failed:", customError);
  }
  
  // If custom converter failed, try simple text extraction
  console.log("[convertBlockNoteToMarkdown] Using simple text extraction");
  try {
    markdown = simpleTextExtraction(blockData);
    console.log("[convertBlockNoteToMarkdown] Simple text extraction result length:", markdown ? markdown.length : 0);
    console.log("[convertBlockNoteToMarkdown] Simple text extraction result:", markdown);
    
    if (markdown && markdown.trim() !== '') {
      console.log("[convertBlockNoteToMarkdown] Simple text extraction succeeded, returning result");
      return markdown;
    }
  } catch (error) {
    console.error("[convertBlockNoteToMarkdown] Simple text extraction failed:", error);
  }
  
  // Last resort - extract any text we can find
  console.log("[convertBlockNoteToMarkdown] All conversion methods failed, attempting direct text extraction");
  try {
    // Try to extract any text content directly from the blocks
    const extractedText = extractRawText(blockData);
    if (extractedText && extractedText.trim() !== '') {
      console.log("[convertBlockNoteToMarkdown] Direct text extraction succeeded:", extractedText);
      return extractedText;
    }
  } catch (error) {
    console.error("[convertBlockNoteToMarkdown] Direct text extraction failed:", error);
  }
  
  // Absolute last resort
  console.log("[convertBlockNoteToMarkdown] All extraction methods failed, returning fallback message");
  return "[Content could not be converted to markdown]";
}

/**
 * Extract raw text from blocks as a last resort
 */
function extractRawText(blocks: Block[] | PartialBlock[]): string {
  // Try to extract any text content from the blocks
  const textParts: string[] = [];
  
  try {
    // Recursively search for text in the block structure
    const extractTextFromObject = (obj: any): void => {
      if (!obj) return;
      
      if (typeof obj === 'string') {
        textParts.push(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach(item => extractTextFromObject(item));
      } else if (typeof obj === 'object') {
        // Look for text property
        if (obj.text && typeof obj.text === 'string') {
          textParts.push(obj.text);
        }
        
        // Look for content property
        if (obj.content) {
          extractTextFromObject(obj.content);
        }
        
        // Recursively check all properties
        Object.values(obj).forEach(value => {
          if (typeof value === 'object' || Array.isArray(value)) {
            extractTextFromObject(value);
          }
        });
      }
    };
    
    // Start extraction
    extractTextFromObject(blocks);
    
    return textParts.join('\n').trim();
  } catch (error) {
    console.error("Error in extractRawText:", error);
    return "";
  }
}

/**
 * Simple text extraction as a last resort
 */
function simpleTextExtraction(blocks: Block[] | PartialBlock[]): string {
  return blocks.map(block => {
    if (!block.content) return '';
    
    if (typeof block.content === 'string') {
      return block.content;
    }
    
    if (Array.isArray(block.content)) {
      return block.content
        .filter((item: any) => item && item.type === 'text')
        .map((item: any) => item.text || '')
        .join('');
    }
    
    if (typeof block.content === 'object' && block.content !== null) {
      return JSON.stringify(block.content);
    }
    
    return '';
  }).filter(text => text.trim() !== '').join('\n\n');
}

/**
 * Custom function to convert blocks to markdown format
 * This handles tables and other block types that might not be properly
 * converted by the built-in converter
 */
function customBlocksToMarkdown(blocks: Block[] | PartialBlock[]): string {
  console.log("customBlocksToMarkdown called with", blocks.length, "blocks");
  
  return blocks.map((block, index) => {
    console.log(`Processing block ${index} of type ${block.type}`);
    
    // Extract text content from block
    const extractText = (content: any[]): string => {
      if (!Array.isArray(content)) return '';
      
      return content
        .filter((item: any) => item && item.type === 'text')
        .map((item: any) => item.text || '')
        .join('');
    };
    
    // Handle different block types
    if (block.type === 'paragraph' && block.content && Array.isArray(block.content)) {
      const text = extractText(block.content);
      return text;
    } else if (block.type === 'heading' && block.content && Array.isArray(block.content)) {
      const level = (block.props as any)?.level || 1;
      const prefix = '#'.repeat(level) + ' ';
      const text = extractText(block.content);
      return prefix + text;
    } else if (block.type === 'table') {
      return convertTableToMarkdown(block);
    } else if (block.type === 'numberedListItem' && block.content && Array.isArray(block.content)) {
      const text = extractText(block.content);
      return `1. ${text}`;
    } else if (block.type === 'bulletListItem' && block.content && Array.isArray(block.content)) {
      const text = extractText(block.content);
      return `* ${text}`;
    } else if (block.type === 'checkListItem' && block.content && Array.isArray(block.content)) {
      const text = extractText(block.content);
      const checked = (block.props as any)?.checked ? 'x' : ' ';
      return `- [${checked}] ${text}`;
    } else if (block.type === 'codeBlock' && block.content && Array.isArray(block.content)) {
      const text = extractText(block.content);
      const language = (block.props as any)?.language || '';
      return '```' + language + '\n' + text + '\n```';
    }
    
    // Default case - log unknown block type
    console.log(`Unknown block type: ${block.type}`, block);
    return '';
  }).filter(text => text.trim() !== '').join('\n\n');
}

/**
 * Converts a table block to markdown format
 */
function convertTableToMarkdown(block: Block | PartialBlock): string {
  try {
    // For BlockNote tables, the content structure is different from other blocks
    // It has a nested structure with rows and cells
    const content = block.content as any;
    
    // Check if this is a valid table structure
    if (!content || typeof content !== 'object' || !content.rows) {
      console.error("Invalid table structure:", content);
      return '[Invalid table structure]';
    }
    
    const rows = content.rows || [];
    
    if (rows.length === 0) {
      return '';
    }
    
    // Determine the number of columns from the first row
    const numCols = rows[0].cells ? rows[0].cells.length : 0;
    if (numCols === 0) {
      return '';
    }
    
    // Build the markdown table
    let markdown = '';
    
    // Process each row
    rows.forEach((row: any, rowIndex: number) => {
      const cells = row.cells || [];
      
      // Add cells for this row
      let rowMarkdown = '|';
      for (let colIndex = 0; colIndex < numCols; colIndex++) {
        const cell = cells[colIndex] || [];
        let cellText = ' ';
        
        // Extract text from cell content
        if (Array.isArray(cell)) {
          cellText = cell
            .filter((item: any) => item && item.type === 'text')
            .map((item: any) => item.text || '')
            .join('') || ' ';
        }
        
        rowMarkdown += ` ${cellText} |`;
      }
      markdown += rowMarkdown + '\n';
      
      // Add separator row after the header
      if (rowIndex === 0) {
        let separator = '|';
        for (let i = 0; i < numCols; i++) {
          separator += ' --- |';
        }
        markdown += separator + '\n';
      }
    });
    
    return markdown;
  } catch (error) {
    console.error("Error converting table to markdown:", error);
    return '[Table conversion error]';
  }
}
