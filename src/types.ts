export type WorkflowStep = 'analyze' | 'draft' | 'recommend' | 'review' | 'approve' | 'publish';

export interface AnalysisResult {
  audience: string[];
  objectives: string[];
  keyMessages: string[];
  risks: string[];
  suggestedChannels: string[];
  missingInformation: string[];
}

export interface DraftState {
  sourceContent: string;
  analysis?: AnalysisResult;
  activeStep: WorkflowStep;
  lastUpdated?: string;
}
