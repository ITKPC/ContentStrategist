import type { AnalysisResult } from './types';

const sentencePattern = /[^.!?\n]+[.!?]?/g;

const normalise = (value: string) => value.trim().replace(/\s+/g, ' ');

const unique = (items: string[]) =>
  Array.from(new Set(items.map(normalise).filter(Boolean)));

const findSentences = (content: string) =>
  (content.match(sentencePattern) ?? []).map(normalise).filter(Boolean);

const includesAny = (value: string, terms: string[]) =>
  terms.some((term) => value.toLowerCase().includes(term));

export function analyzeContent(sourceContent: string): AnalysisResult {
  const content = normalise(sourceContent);
  const sentences = findSentences(sourceContent);

  if (!content) {
    return {
      audience: [],
      objectives: [],
      keyMessages: [],
      risks: [],
      suggestedChannels: [],
      missingInformation: [
        'Add the source material or describe what needs to be communicated.',
      ],
    };
  }

  const audience: string[] = [];
  const objectives: string[] = [];
  const risks: string[] = [];
  const channels: string[] = [];
  const missingInformation: string[] = [];

  if (includesAny(content, ['member', 'members', 'club'])) {
    audience.push('KPC members');
  }
  if (includesAny(content, ['board', 'director', 'directors'])) {
    audience.push('KPC Board of Directors');
  }
  if (includesAny(content, ['volunteer', 'committee', 'team lead'])) {
    audience.push('KPC volunteers and committee members');
  }
  if (includesAny(content, ['city', 'partner', 'vendor', 'sponsor'])) {
    audience.push('External partners and stakeholders');
  }
  if (audience.length === 0) {
    audience.push('Audience not yet identified');
    missingInformation.push('Who needs to receive this communication?');
  }

  if (includesAny(content, ['register', 'sign up', 'apply', 'complete', 'submit'])) {
    objectives.push('Prompt the audience to take a specific action');
  }
  if (includesAny(content, ['change', 'update', 'new', 'starting', 'effective'])) {
    objectives.push('Explain a change or new development');
  }
  if (includesAny(content, ['remind', 'deadline', 'by ', 'before '])) {
    objectives.push('Reinforce a deadline or important reminder');
  }
  if (includesAny(content, ['thank', 'recognize', 'appreciate'])) {
    objectives.push('Recognize contributions and reinforce goodwill');
  }
  if (objectives.length === 0) {
    objectives.push('Inform the audience clearly and accurately');
  }

  if (!includesAny(content, ['date', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', '202'])) {
    missingInformation.push('Is there a date, deadline, or effective period to include?');
  }
  if (!includesAny(content, ['contact', '@', 'email', 'questions'])) {
    missingInformation.push('Who should people contact with questions?');
  }
  if (!includesAny(content, ['because', 'reason', 'why'])) {
    missingInformation.push('Would a brief explanation of why this matters improve understanding?');
  }

  if (includesAny(content, ['cancel', 'delay', 'problem', 'issue', 'risk', 'concern'])) {
    risks.push('The message may create concern or require careful explanation');
  }
  if (includesAny(content, ['must', 'required', 'mandatory', 'will not'])) {
    risks.push('Directive wording may feel abrupt without context or support');
  }
  if (includesAny(content, ['fee', 'cost', 'price', 'payment'])) {
    risks.push('Cost information should be explicit and verified before publishing');
  }
  if (risks.length === 0) {
    risks.push('No obvious communication risk detected; verify facts before publishing');
  }

  if (audience.includes('KPC members')) {
    channels.push('Member email', 'KPC website or member portal');
  }
  if (audience.includes('KPC Board of Directors')) {
    channels.push('Board briefing or Board Brief');
  }
  if (audience.includes('KPC volunteers and committee members')) {
    channels.push('Microsoft Teams or committee channel');
  }
  if (includesAny(content, ['urgent', 'today', 'immediately', 'cancel'])) {
    channels.push('Time-sensitive alert or homepage notice');
  }
  if (channels.length === 0) {
    channels.push('Email as the primary channel');
  }

  const keyMessages = sentences
    .filter((sentence) => sentence.length >= 20)
    .slice(0, 4);

  if (keyMessages.length === 0) {
    keyMessages.push(content);
  }

  return {
    audience: unique(audience),
    objectives: unique(objectives),
    keyMessages: unique(keyMessages),
    risks: unique(risks),
    suggestedChannels: unique(channels),
    missingInformation: unique(missingInformation),
  };
}
