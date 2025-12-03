// SEO utility functions

/**
 * Generate meta description from content (150-160 chars)
 */
export const generateMetaDescription = (content: string): string => {
  // Remove HTML tags and extra whitespace
  const cleanContent = content
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleanContent.length <= 160) {
    return cleanContent;
  }
  
  // Find a good break point
  const truncated = cleanContent.substring(0, 157);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return truncated.substring(0, lastSpace) + '...';
};

/**
 * Generate keywords from content
 */
export const generateKeywords = (title: string, content: string, category: string): string[] => {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
    'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where',
    'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here',
  ]);

  const text = `${title} ${content}`.toLowerCase();
  const words = text
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  // Count word frequency
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  // Sort by frequency and take top keywords
  const topKeywords = Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  // Add category as keyword
  if (!topKeywords.includes(category.toLowerCase())) {
    topKeywords.unshift(category.toLowerCase());
  }

  return topKeywords;
};

/**
 * Generate SEO-friendly slug from title
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60); // Keep slugs reasonably short
};

/**
 * Clean text formatting for article content
 */
export const cleanTextFormatting = (text: string): string => {
  return text
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Remove multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace
    .trim();
};

/**
 * Calculate word count for structured data
 */
export const calculateWordCount = (content: string): number => {
  return content
    .replace(/<[^>]*>/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
};

/**
 * Generate image alt text from article title
 */
export const generateImageAlt = (articleTitle: string, index: number = 0): string => {
  const base = articleTitle.substring(0, 100);
  return index > 0 ? `${base} - Image ${index + 1}` : base;
};

/**
 * Format date for structured data (ISO 8601)
 */
export const formatDateISO = (date: string | Date): string => {
  return new Date(date).toISOString();
};
