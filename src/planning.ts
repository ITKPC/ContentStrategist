import type { AnalysisResult } from './types';

export interface CommunicationPlan {
  publicationOrder: string[];
  recommendedChannels: string[];
  reviewRequired: string[];
  timing: string[];
}

export function buildCommunicationPlan(result: AnalysisResult): CommunicationPlan {
  const publicationOrder = [
    'Publish the website article or member portal update first',
    'Review and approve supporting communications',
    'Distribute email to affected audiences',
    'Publish supporting social or Teams messages',
  ];

  const recommendedChannels = [...result.suggestedChannels];
  if (!recommendedChannels.includes('Website')) {
    recommendedChannels.unshift('Website');
  }

  const reviewRequired = [
    'Website article',
    'Member email',
  ];

  if (recommendedChannels.some(c => c.includes('Teams'))) {
    reviewRequired.push('Teams announcement');
  }

  const timing = [
    'Website should become the authoritative source before other channels.',
    'Email should reference the website instead of repeating all details.',
    'Time-sensitive alerts should be released immediately after publication.'
  ];

  return {
    publicationOrder,
    recommendedChannels,
    reviewRequired,
    timing,
  };
}
