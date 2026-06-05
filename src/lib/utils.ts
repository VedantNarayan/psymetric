// PsyMetric Utility Functions & Jargon Mapping

export interface DimensionDetails {
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const friendlyDimensions: Record<string, DimensionDetails> = {
  Realistic: {
    label: 'The Builder',
    icon: '🔧',
    color: 'text-red-400',
    description: 'Hands-on, practical, loves making and repairing things.'
  },
  Investigative: {
    label: 'The Thinker',
    icon: '🔬',
    color: 'text-blue-400',
    description: 'Curious, analytical, loves solving logical puzzles and researching.'
  },
  Artistic: {
    label: 'The Creator',
    icon: '🎨',
    color: 'text-purple-400',
    description: 'Imaginative, expressive, loves design, art, and storytelling.'
  },
  Social: {
    label: 'The Connector',
    icon: '🤝',
    color: 'text-green-400',
    description: 'Empathetic, helpful, loves working with people and teaching.'
  },
  Enterprising: {
    label: 'The Leader',
    icon: '🚀',
    color: 'text-amber-400',
    description: 'Ambitious, persuasive, loves taking charge and driving initiatives.'
  },
  Conventional: {
    label: 'The Organizer',
    icon: '📊',
    color: 'text-teal-400',
    description: 'Methodical, detail-oriented, loves structure and systemic order.'
  }
};

// Map short codes (R, I, A, S, E, C) to full friendly terms
export const codeToFriendly: Record<string, DimensionDetails> = {
  R: friendlyDimensions.Realistic,
  I: friendlyDimensions.Investigative,
  A: friendlyDimensions.Artistic,
  S: friendlyDimensions.Social,
  E: friendlyDimensions.Enterprising,
  C: friendlyDimensions.Conventional
};

/**
 * Translates any RIASEC term or short code into a friendly game-like title
 */
export function translateJargon(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  
  if (friendlyDimensions[trimmed]) {
    return friendlyDimensions[trimmed].label;
  }
  if (codeToFriendly[trimmed]) {
    return codeToFriendly[trimmed].label;
  }
  
  // Clean string replacement for RIASEC references
  let output = trimmed
    .replace(/\bRealistic\b/g, 'Builder')
    .replace(/\bInvestigative\b/g, 'Thinker')
    .replace(/\bArtistic\b/g, 'Creator')
    .replace(/\bSocial\b/g, 'Connector')
    .replace(/\bEnterprising\b/g, 'Leader')
    .replace(/\bConventional\b/g, 'Organizer')
    .replace(/\bRIASEC\b/gi, 'Spectrum')
    .replace(/\bHolland Codes\b/gi, 'Personality Spectrum');
    
  return output;
}
