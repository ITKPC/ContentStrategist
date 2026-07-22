import type { AnalysisResult } from './types';
import type { CommunicationPlan } from './planning';
import type { ContentPackageDraft, GeneratedContent } from './contentGenerator';

export type ReviewStatus = 'ready' | 'review_required' | 'not_ready';

export interface ReviewFinding {
  code: string;
  message: string;
  recommendation: string;
}

export interface ReviewResult {
  status: ReviewStatus;
  readinessScore: number;
  blockingIssues: ReviewFinding[];
  warnings: ReviewFinding[];
  completedChecks: string[];
  recommendedActions: string[];
}

function hasMeaningfulText(value: string) {
  return value.trim().length > 0;
}

function includesWebsite(items: GeneratedContent[]) {
  return items.some((item) => item.channel === 'Website');
}

function containsPlaceholder(value: string) {
  return /\b(tbd|to be confirmed|placeholder|insert|unknown)\b/i.test(value);
}

function createFinding(
  code: string,
  message: string,
  recommendation: string
): ReviewFinding {
  return { code, message, recommendation };
}

function findChannelConsistencyWarnings(items: GeneratedContent[]) {
  const warnings: ReviewFinding[] = [];
  const website = items.find((item) => item.channel === 'Website');

  if (!website) return warnings;

  for (const item of items) {
    if (item.channel === 'Website') continue;

    const websiteTitle = website.title.toLowerCase();
    const supportingText = `${item.title} ${item.body}`.toLowerCase();

    if (!supportingText.includes(websiteTitle) && websiteTitle.length > 12) {
      warnings.push(
        createFinding(
          `channel-consistency-${item.channel.toLowerCase()}`,
          `${item.channel} does not clearly repeat the main website message.`,
          `Confirm that the ${item.channel} draft uses the same central facts and direction as the website version.`
        )
      );
    }
  }

  return warnings;
}

export function reviewCommunicationPackage(
  analysis: AnalysisResult,
  plan: CommunicationPlan,
  contentPackage: ContentPackageDraft
): ReviewResult {
  const blockingIssues: ReviewFinding[] = [];
  const warnings: ReviewFinding[] = [];
  const completedChecks: string[] = [];
  const recommendedActions: string[] = [];

  if (!analysis.keyMessages.some(hasMeaningfulText)) {
    blockingIssues.push(
      createFinding(
        'missing-key-message',
        'No confirmed key message is available.',
        'Confirm the central decision, update, or instruction before publishing.'
      )
    );
  } else {
    completedChecks.push('At least one key message is defined.');
  }

  if (!analysis.audience.some(hasMeaningfulText)) {
    blockingIssues.push(
      createFinding(
        'missing-audience',
        'The intended audience has not been identified.',
        'Identify who is affected so the communication can be targeted correctly.'
      )
    );
  } else {
    completedChecks.push('The intended audience is identified.');
  }

  if (analysis.missingInformation.some(hasMeaningfulText)) {
    blockingIssues.push(
      createFinding(
        'missing-information',
        `${analysis.missingInformation.length} information gap${
          analysis.missingInformation.length === 1 ? '' : 's'
        } remain unresolved.`,
        'Confirm each missing item or explicitly mark it as not applicable before publication.'
      )
    );
  } else {
    completedChecks.push('No unresolved information gaps were identified.');
  }

  if (!includesWebsite(contentPackage.items)) {
    blockingIssues.push(
      createFinding(
        'website-source-missing',
        'The package does not contain an authoritative website version.',
        'Create the website content before publishing supporting email or social messages.'
      )
    );
  } else {
    completedChecks.push('An authoritative website version is included.');
  }

  if (contentPackage.items.length === 0) {
    blockingIssues.push(
      createFinding(
        'no-generated-content',
        'No channel content has been generated.',
        'Generate the selected communication drafts before beginning publication review.'
      )
    );
  } else {
    completedChecks.push('Channel-specific content has been generated.');
  }

  const placeholderItems = contentPackage.items.filter(
    (item) => containsPlaceholder(item.title) || containsPlaceholder(item.body)
  );

  if (placeholderItems.length > 0) {
    blockingIssues.push(
      createFinding(
        'unresolved-placeholders',
        `${placeholderItems.length} draft${placeholderItems.length === 1 ? '' : 's'} contain unresolved placeholder language.`,
        'Replace every placeholder with confirmed information before publishing.'
      )
    );
  } else if (contentPackage.items.length > 0) {
    completedChecks.push('No obvious placeholder language remains.');
  }

  if (analysis.risks.some(hasMeaningfulText)) {
    warnings.push(
      createFinding(
        'identified-risks',
        `${analysis.risks.length} communication risk${analysis.risks.length === 1 ? '' : 's'} require review.`,
        'Review each identified risk and confirm that the final wording or process addresses it.'
      )
    );
  } else {
    completedChecks.push('No specific communication risks were identified.');
  }

  if (plan.reviewRequired.length > 0) {
    warnings.push(
      createFinding(
        'human-review-required',
        `Review is recommended from: ${plan.reviewRequired.join(', ')}.`,
        'Record the required human approvals before release.'
      )
    );
  } else {
    completedChecks.push('No additional specialist review was identified.');
  }

  if (plan.publicationOrder.length > 0) {
    const firstChannel = plan.publicationOrder[0].toLowerCase();

    if (!firstChannel.includes('website') && !firstChannel.includes('web')) {
      warnings.push(
        createFinding(
          'publication-sequence',
          'The publication plan does not place the website first.',
          'Confirm that supporting channels will link to an authoritative source, or document why website-first sequencing does not apply.'
        )
      );
    } else {
      completedChecks.push('The publication sequence begins with the website.');
    }
  }

  warnings.push(...findChannelConsistencyWarnings(contentPackage.items));

  if (contentPackage.items.some((item) => item.body.length > 2000)) {
    warnings.push(
      createFinding(
        'long-channel-content',
        'At least one channel draft is unusually long.',
        'Confirm that detailed material belongs on the website and shorten supporting channels where practical.'
      )
    );
  }

  if (blockingIssues.length > 0) {
    recommendedActions.push('Resolve all blocking issues before publication.');
  }

  if (warnings.length > 0) {
    recommendedActions.push('Review and accept or resolve each warning.');
  }

  if (plan.reviewRequired.length > 0) {
    recommendedActions.push('Obtain and record the recommended human approvals.');
  }

  recommendedActions.push('Verify dates, times, locations, links, names, and member instructions against the approved source information.');
  recommendedActions.push('Publish the authoritative source before distributing supporting channel messages.');

  const deduction = blockingIssues.length * 20 + warnings.length * 7;
  const readinessScore = Math.max(0, Math.min(100, 100 - deduction));
  const status: ReviewStatus =
    blockingIssues.length > 0
      ? 'not_ready'
      : warnings.length > 0
        ? 'review_required'
        : 'ready';

  return {
    status,
    readinessScore,
    blockingIssues,
    warnings,
    completedChecks,
    recommendedActions,
  };
}
