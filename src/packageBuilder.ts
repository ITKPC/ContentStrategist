import type { AnalysisResult } from './types';
import type { CommunicationPlan } from './planning';
import type {
  ContentPackageDraft,
  GeneratedContent,
} from './contentGenerator';
import type { ReviewResult, ReviewStatus } from './review';

export interface PackageApproval {
  reviewer: string;
  role?: string;
  approved: boolean;
  approvedAt?: string;
  notes?: string;
}

export interface CommunicationsPackage {
  title: string;
  createdAt: string;
  status: ReviewStatus;
  summary: string;
  audience: string[];
  objectives: string[];
  keyMessages: string[];
  risks: string[];
  missingInformation: string[];
  publicationOrder: string[];
  recommendedChannels: string[];
  reviewRequired: string[];
  timing: string[];
  content: GeneratedContent[];
  blockingIssues: string[];
  warnings: string[];
  completedChecks: string[];
  recommendedActions: string[];
  approvals: PackageApproval[];
  publicationChecklist: string[];
}

export interface BuildPackageOptions {
  title?: string;
  createdAt?: string;
  approvals?: PackageApproval[];
}

function firstNonEmpty(values: string[], fallback: string) {
  return values.find((value) => value.trim().length > 0) ?? fallback;
}

function buildChecklist(
  plan: CommunicationPlan,
  contentPackage: ContentPackageDraft,
  review: ReviewResult,
  approvals: PackageApproval[]
) {
  const checklist: string[] = [];

  for (const channel of plan.publicationOrder) {
    checklist.push(`Prepare and publish ${channel}.`);
  }

  for (const item of contentPackage.items) {
    checklist.push(`Confirm final ${item.channel} wording.`);
  }

  for (const reviewer of plan.reviewRequired) {
    const matchingApproval = approvals.find(
      (approval) =>
        approval.reviewer.toLowerCase() === reviewer.toLowerCase() ||
        approval.role?.toLowerCase() === reviewer.toLowerCase()
    );

    checklist.push(
      matchingApproval?.approved
        ? `Approval recorded for ${reviewer}.`
        : `Obtain approval from ${reviewer}.`
    );
  }

  for (const finding of review.blockingIssues) {
    checklist.push(`Resolve blocker: ${finding.message}`);
  }

  for (const warning of review.warnings) {
    checklist.push(`Review warning: ${warning.message}`);
  }

  checklist.push('Verify all dates, times, locations, links, names, and instructions.');
  checklist.push('Publish the authoritative source before supporting messages.');
  checklist.push('Confirm that all final channel versions contain consistent facts.');

  return Array.from(new Set(checklist));
}

export function buildCommunicationsPackage(
  analysis: AnalysisResult,
  plan: CommunicationPlan,
  contentPackage: ContentPackageDraft,
  review: ReviewResult,
  options: BuildPackageOptions = {}
): CommunicationsPackage {
  const approvals = options.approvals ?? [];
  const createdAt = options.createdAt ?? new Date().toISOString();
  const title =
    options.title?.trim() ||
    firstNonEmpty(analysis.keyMessages, 'KPC Communications Package');

  return {
    title,
    createdAt,
    status: review.status,
    summary: contentPackage.summary,
    audience: [...analysis.audience],
    objectives: [...analysis.objectives],
    keyMessages: [...analysis.keyMessages],
    risks: [...analysis.risks],
    missingInformation: [...analysis.missingInformation],
    publicationOrder: [...plan.publicationOrder],
    recommendedChannels: [...plan.recommendedChannels],
    reviewRequired: [...plan.reviewRequired],
    timing: [...plan.timing],
    content: contentPackage.items.map((item) => ({ ...item })),
    blockingIssues: review.blockingIssues.map((finding) => finding.message),
    warnings: review.warnings.map((finding) => finding.message),
    completedChecks: [...review.completedChecks],
    recommendedActions: [...review.recommendedActions],
    approvals: approvals.map((approval) => ({ ...approval })),
    publicationChecklist: buildChecklist(
      plan,
      contentPackage,
      review,
      approvals
    ),
  };
}

export function packageToPlainText(pkg: CommunicationsPackage) {
  const sections: string[] = [];

  sections.push(pkg.title);
  sections.push(`Created: ${pkg.createdAt}`);
  sections.push(`Status: ${pkg.status}`);
  sections.push(`Summary\n${pkg.summary}`);
  sections.push(`Audience\n${pkg.audience.map((item) => `- ${item}`).join('\n')}`);
  sections.push(`Objectives\n${pkg.objectives.map((item) => `- ${item}`).join('\n')}`);
  sections.push(`Key Messages\n${pkg.keyMessages.map((item) => `- ${item}`).join('\n')}`);
  sections.push(
    `Publication Order\n${pkg.publicationOrder
      .map((item, index) => `${index + 1}. ${item}`)
      .join('\n')}`
  );

  for (const item of pkg.content) {
    sections.push(`${item.channel}\n${item.title}\n\n${item.body}`);
  }

  sections.push(
    `Before You Publish\n${pkg.publicationChecklist
      .map((item) => `- ${item}`)
      .join('\n')}`
  );

  return sections.filter((section) => section.trim().length > 0).join('\n\n');
}
