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
 * Generate keywords from content - returns 5-10 relevant keywords
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
    'about', 'after', 'before', 'being', 'between', 'into', 'through',
    'during', 'under', 'again', 'further', 'then', 'once', 'there', 'any',
    'such', 'your', 'our', 'their', 'his', 'her', 'its', 'my', 'say', 'said',
  ]);

  const text = `${title} ${title} ${content}`.toLowerCase(); // Double weight for title
  const words = text
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  // Count word frequency
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  // Extract potential compound keywords (2-word phrases)
  const phrases = extractPhrases(title + ' ' + content);

  // Sort by frequency and take top keywords
  const topKeywords = Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);

  // Add category as first keyword
  const keywords = [category.toLowerCase()];
  
  // Add phrases first (more valuable for SEO)
  phrases.slice(0, 3).forEach(phrase => {
    if (!keywords.includes(phrase.toLowerCase())) {
      keywords.push(phrase.toLowerCase());
    }
  });

  // Add single keywords
  topKeywords.forEach(word => {
    if (keywords.length < 10 && !keywords.includes(word)) {
      keywords.push(word);
    }
  });

  return keywords.slice(0, 10);
};

/**
 * Extract meaningful 2-word phrases from content
 */
const extractPhrases = (text: string): string[] => {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);

  const phrases: Map<string, number> = new Map();
  
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    if (phrase.length > 6) {
      phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
    }
  }

  return Array.from(phrases.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase]) => phrase);
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
    // Fix common formatting issues
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/([.,!?;:])(?=[A-Za-z])/g, '$1 ')
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

/**
 * Generate SEO-friendly image filename from article title
 */
export const generateImageFilename = (articleTitle: string, extension: string = 'webp'): string => {
  const slug = generateSlug(articleTitle);
  return `${slug}-featured.${extension}`;
};

/**
 * Auto-generate tags based on content analysis
 */
export const generateTags = (title: string, content: string, category: string): string[] => {
  const keywords = generateKeywords(title, content, category);
  
  // Filter to create meaningful tags
  const tags = keywords
    .filter(keyword => keyword.length > 3)
    .map(keyword => keyword.charAt(0).toUpperCase() + keyword.slice(1));

  // Add category as a tag
  const categoryTag = category.charAt(0).toUpperCase() + category.slice(1);
  if (!tags.includes(categoryTag)) {
    tags.unshift(categoryTag);
  }

  return tags.slice(0, 8);
};

/**
 * Find related article IDs based on content similarity
 */
export const findRelatedArticleIds = (
  currentArticle: { title: string; content: string; category: string; tags?: string[] },
  allArticles: Array<{ id: string; title: string; category: string; tags?: string[] }>
): string[] => {
  const currentKeywords = new Set(
    generateKeywords(currentArticle.title, currentArticle.content, currentArticle.category)
  );
  const currentTags = new Set(currentArticle.tags?.map(t => t.toLowerCase()) || []);

  const scored = allArticles.map(article => {
    let score = 0;
    
    // Same category bonus
    if (article.category === currentArticle.category) {
      score += 3;
    }

    // Tag overlap
    const articleTags = article.tags?.map(t => t.toLowerCase()) || [];
    articleTags.forEach(tag => {
      if (currentTags.has(tag)) score += 2;
    });

    // Title keyword overlap
    const titleWords = article.title.toLowerCase().split(/\s+/);
    titleWords.forEach(word => {
      if (currentKeywords.has(word)) score += 1;
    });

    return { id: article.id, score };
  });

  return scored
    .filter(a => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(a => a.id);
};
