import type {
  ProjectMissionCritique,
  ProjectMissionSubmission,
  ProjectSubmissionStatus,
} from '@flashlearn/shared';
import type { LearnerIdentity } from './IInteractiveRepository';

export interface UpsertProjectSubmissionData {
  status: ProjectSubmissionStatus;
  checkedMilestoneIds: string[];
  checkedRubricIds: string[];
  artifactUrl: string | null;
  artifactNotes: string | null;
  selfReflection: string | null;
}

export interface IProjectSubmissionRepository {
  findByLearner(
    contentId: string,
    identity: LearnerIdentity
  ): Promise<ProjectMissionSubmission | null>;
  upsertByLearner(
    contentId: string,
    identity: LearnerIdentity,
    data: UpsertProjectSubmissionData
  ): Promise<ProjectMissionSubmission>;
  saveCritique(
    contentId: string,
    identity: LearnerIdentity,
    critique: ProjectMissionCritique
  ): Promise<ProjectMissionSubmission | null>;
}
