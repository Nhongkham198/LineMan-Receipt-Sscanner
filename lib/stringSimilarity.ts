import type { PosMenuItem, PosMenuOption } from '../types';

/**
 * Calculates the Levenshtein distance between two strings.
 * This measures the number of edits (insertions, deletions, substitutions)
 * needed to change one word into the other. A lower number means more similar.
 * @param s1 The first string.
 * @param s2 The second string.
 * @returns The Levenshtein distance.
 */
function levenshteinDistance(s1: string, s2: string): number {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = new Array();
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

export interface BestMatchResult {
  item: PosMenuItem;
  price: number; // The final calculated price
  confidence: number; // A score from 0 to 1 indicating match quality
  matchedOption?: PosMenuOption;
}

/**
 * Finds the best matching PosMenuItem from a list for a given search term, considering options.
 * @param searchTerm The string to match (e.g., from a scanned receipt).
 * @param menuItems The array of PosMenuItem to search within.
 * @returns The best matching item, its calculated price, a confidence score, and the matched option, or null.
 */
export function findBestMatch(searchTerm: string, menuItems: PosMenuItem[]): BestMatchResult | null {
  if (!searchTerm || menuItems.length === 0) {
    return null;
  }

  let bestMatchItem: PosMenuItem | null = null;
  let bestMatchPrice = 0;
  let minDistance = Infinity;
  let bestMatchOption: PosMenuOption | undefined = undefined;
  let bestMatchString = ''; // To hold the string that produced the best match

  const cleanedSearchTerm = searchTerm.replace(/\(.*\)/, '').trim();

  for (const item of menuItems) {
    // First, check against the base item name
    let distance = levenshteinDistance(cleanedSearchTerm, item.name);
    if (distance < minDistance) {
      minDistance = distance;
      bestMatchItem = item;
      bestMatchPrice = item.price;
      bestMatchString = item.name;
      bestMatchOption = undefined;
    }

    // Then, check against combinations with options
    if (item.options) {
      for (const opt of item.options) {
        const combinedName = `${item.name} ${opt.name}`;
        distance = levenshteinDistance(cleanedSearchTerm, combinedName);
        if (distance < minDistance) {
          minDistance = distance;
          bestMatchItem = item;
          bestMatchPrice = item.price + opt.priceModifier;
          bestMatchString = combinedName;
          bestMatchOption = opt;
        }
      }
    }
  }

  // Threshold to avoid completely wrong matches. Loosened slightly.
  const THRESHOLD = cleanedSearchTerm.length * 0.7;
  if (!bestMatchItem || minDistance > THRESHOLD) {
     return null; 
  }

  // Calculate confidence score: 1 is a perfect match, 0 is a very distant match.
  const confidence = 1 - (minDistance / Math.max(cleanedSearchTerm.length, bestMatchString.length, 1));

  return { item: bestMatchItem, price: bestMatchPrice, confidence, matchedOption: bestMatchOption };
}