export type OrientationExemplarKind =
  | 'system'
  | 'organization'
  | 'team'
  | 'protocol'
  | 'practitioner'
  | 'work';

export interface OrientationHallmark {
  trait: string;
  indicator: string;
  contrastWithNovice?: string;
}

export interface OrientationMagnumOpus {
  exemplarName: string;
  exemplarKind: OrientationExemplarKind;
  achievement: string;
  knowledgeApplied: string;
}

export interface OrientationAchievableCapability {
  capability: string;
  evidenceInWorkspace: string;
}

export interface OrientationHonestLimit {
  limit: string;
  whyBeyondWorkspace: string;
  recommendation: string;
}

export interface WorkspaceOrientationPayload {
  schemaVersion: 'workspace-orientation-v1';
  headline: string;
  hallmarksOfExcellence: OrientationHallmark[];
  magnumOpusExamples: OrientationMagnumOpus[];
  achievableHere: OrientationAchievableCapability[];
  honestLimits: OrientationHonestLimit[];
}
