import type { UnitLectureMetadata } from './elastic-pedagogy';

export type ProjectMissionLevel = 'mini_practice' | 'capstone';

export interface ProjectMissionMilestone {
  id: string;
  title: string;
  hint?: string;
}

export interface ProjectRubricCriterion {
  id: string;
  criterion: string;
  verificationMethod: string;
  redFlag?: string;
}

export interface ProjectMissionPayload {
  schemaVersion: 'project-mission-v1';
  missionLevel: ProjectMissionLevel;
  domainCategory: string;
  estimatedMinutes: number;
  realWorldBrief: string;
  authenticDeliverable: string;
  starterContext?: string;
  constraints: string[];
  edgeCasesToTest: string[];
  milestones: ProjectMissionMilestone[];
  selfAuditRubric: ProjectRubricCriterion[];
  stretchGoals?: string[];
  relatedConcepts?: string[];
  unitMeta?: UnitLectureMetadata;
}

export type ProjectReadinessVerdict = 'needs_iteration' | 'solid_mvp' | 'production_ready';

export interface ProjectMissionCritique {
  overallReadiness: ProjectReadinessVerdict;
  summary: string;
  strengths: string[];
  blindSpots: string[];
  nextUpgradeStep: string;
  evaluatedAt: string;
}

export type ProjectSubmissionStatus = 'in_progress' | 'completed';

export interface ProjectMissionSubmission {
  id: string;
  contentId: string;
  userId?: string | null;
  sessionKey?: string | null;
  status: ProjectSubmissionStatus;
  checkedMilestoneIds: string[];
  checkedRubricIds: string[];
  artifactUrl: string | null;
  artifactNotes: string | null;
  selfReflection: string | null;
  aiCritique: ProjectMissionCritique | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveProjectSubmissionRequest {
  sessionKey?: string;
  status?: ProjectSubmissionStatus;
  checkedMilestoneIds?: string[];
  checkedRubricIds?: string[];
  artifactUrl?: string | null;
  artifactNotes?: string | null;
  selfReflection?: string | null;
}

export interface RequestProjectCritiqueRequest {
  sessionKey?: string;
  artifactUrl?: string | null;
  artifactNotes?: string | null;
  selfReflection?: string | null;
}
