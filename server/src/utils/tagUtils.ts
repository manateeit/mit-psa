import { ITag } from '@/interfaces/tag.interfaces';

interface TagColors {
  background: string;
  text: string;
}

export const generateTagColor = (tagText: string): TagColors => {
  let hash = 0;
  for (let i = 0; i < tagText.length; i++) {
    hash = tagText.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  const saturation = 85; // Higher saturation for more vibrant colors
  const lightness = 92; // Light background for better contrast
  const background = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  
  // Calculate text color based on HSL values
  const isDark = hue >= 30 && hue <= 210;
  const textHue = hue;
  const textSaturation = 90; // High saturation for text
  const textLightness = isDark ? 20 : 25; // Adjust based on background hue
  const text = `hsl(${textHue}, ${textSaturation}%, ${textLightness}%)`;
  
  return { background, text };
};

export const getUniqueTagTexts = (tags: ITag[]): string[] => {
  const uniqueTags = new Set<string>();
  tags.forEach(tag => uniqueTags.add(tag.tag_text));
  return Array.from(uniqueTags);
};

export const filterTagsByText = (tags: string[], searchText: string): string[] => {
  const search = searchText.toLowerCase().trim();
  if (!search) return tags;
  return tags.filter(tag => tag.toLowerCase().includes(search));
};
