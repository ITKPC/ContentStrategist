import type { AnalysisResult } from './types';
import type { CommunicationPlan } from './planning';

export type GeneratedChannel =
  | 'Website'
  | 'Email'
  | 'Teams'
  | 'Facebook'
  | 'Newsletter';

export interface GeneratedContent {
  channel: GeneratedChannel;
  title: string;
  body: string;
  purpose: string;
}

export interface ContentPackageDraft {
  summary: string;
  items: GeneratedContent[];
}

function firstOrFallback(items: string[], fallback: string) {
  return items.find((item) => item.trim().length > 0) ?? fallback;
}

function joinMessages(messages: string[]) {
  return messages.length > 0
    ? messages.map((message) => `- ${message}`).join('\n')
    : '- Details will be confirmed before publication.';
}

function normalizeChannel(channel: string): GeneratedChannel | null {
  const value = channel.toLowerCase();

  if (value.includes('website') || value.includes('web')) return 'Website';
  if (value.includes('email')) return 'Email';
  if (value.includes('teams')) return 'Teams';
  if (value.includes('facebook') || value.includes('social')) return 'Facebook';
  if (value.includes('newsletter')) return 'Newsletter';

  return null;
}

function buildWebsiteContent(analysis: AnalysisResult): GeneratedContent {
  const title = firstOrFallback(analysis.keyMessages, 'KPC update');

  return {
    channel: 'Website',
    title,
    purpose: 'Provide the complete and authoritative source of information.',
    body: `${title}\n\n${joinMessages(analysis.keyMessages)}\n\nWho this affects\n${joinMessages(analysis.audience)}\n\nWhat members need to do\n${firstOrFallback(
      analysis.objectives,
      'Review the information and follow any instructions provided.'
    )}`,
  };
}

function buildEmailContent(analysis: AnalysisResult): GeneratedContent {
  const leadMessage = firstOrFallback(analysis.keyMessages, 'KPC has an important update.');

  return {
    channel: 'Email',
    title: `KPC update: ${leadMessage}`,
    purpose: 'Direct affected audiences to the complete website information.',
    body: `Hello,\n\n${leadMessage}\n\nPlease review the complete update on the KPC website for all details, dates, and instructions.\n\nKey points\n${joinMessages(
      analysis.keyMessages.slice(0, 3)
    )}\n\nThank you,\nKamloops Pickleball Club`,
  };
}

function buildTeamsContent(analysis: AnalysisResult): GeneratedContent {
  const leadMessage = firstOrFallback(analysis.keyMessages, 'A new KPC update is ready for review.');

  return {
    channel: 'Teams',
    title: 'Internal communications update',
    purpose: 'Coordinate staff and volunteer awareness before or during publication.',
    body: `${leadMessage}\n\nPlease review the website source and confirm that your team is prepared for questions.\n\nPotential concerns\n${joinMessages(
      analysis.risks
    )}`,
  };
}

function buildFacebookContent(analysis: AnalysisResult): GeneratedContent {
  const leadMessage = firstOrFallback(analysis.keyMessages, 'KPC has shared a new update.');

  return {
    channel: 'Facebook',
    title: 'Facebook post',
    purpose: 'Create awareness and direct readers to the authoritative website source.',
    body: `${leadMessage}\n\nRead the complete details on the KPC website.`,
  };
}

function buildNewsletterContent(analysis: AnalysisResult): GeneratedContent {
  const leadMessage = firstOrFallback(analysis.keyMessages, 'KPC update');

  return {
    channel: 'Newsletter',
    title: leadMessage,
    purpose: 'Provide a concise summary for a scheduled member newsletter.',
    body: `${leadMessage}\n\n${joinMessages(analysis.keyMessages.slice(0, 4))}\n\nVisit the KPC website for the full update.`,
  };
}

function generateForChannel(channel: GeneratedChannel, analysis: AnalysisResult) {
  switch (channel) {
    case 'Website':
      return buildWebsiteContent(analysis);
    case 'Email':
      return buildEmailContent(analysis);
    case 'Teams':
      return buildTeamsContent(analysis);
    case 'Facebook':
      return buildFacebookContent(analysis);
    case 'Newsletter':
      return buildNewsletterContent(analysis);
  }
}

export function generateContentPackage(
  analysis: AnalysisResult,
  plan: CommunicationPlan
): ContentPackageDraft {
  const selectedChannels = plan.recommendedChannels
    .map(normalizeChannel)
    .filter((channel): channel is GeneratedChannel => channel !== null);

  const channels = Array.from(new Set<GeneratedChannel>(['Website', ...selectedChannels]));

  return {
    summary: firstOrFallback(
      analysis.keyMessages,
      'A coordinated KPC communications package is ready for development.'
    ),
    items: channels.map((channel) => generateForChannel(channel, analysis)),
  };
}
