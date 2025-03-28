import { Block, PartialBlock, BlockNoteEditor } from '@blocknote/core';

/**
 * Converts BlockNote JSON content to Markdown format using BlockNote's built-in exporter
 */
export async function convertBlockNoteToMarkdown(blocks: Block[] | PartialBlock[] | string | undefined): Promise<string | undefined> {
  if (!blocks) return undefined;
  
  let blockData: Block[] | PartialBlock[];
  if (typeof blocks === 'string') {
    try {
      blockData = JSON.parse(blocks);
    } catch (e) {
      console.error("Failed to parse BlockNote JSON string:", e);
      return undefined; // Or handle error appropriately
    }
  } else {
    blockData = blocks;
  }
  
  try {
    // Create a temporary editor instance for conversion
    // This doesn't need to be mounted to the DOM
    const tempEditor = BlockNoteEditor.create();
    
    // Use the built-in markdown export
    const markdown = await tempEditor.blocksToMarkdownLossy(blockData);
    
    return markdown;
  } catch (error) {
    console.error("Error converting BlockNote to Markdown:", error);
    return undefined;
  }
}
