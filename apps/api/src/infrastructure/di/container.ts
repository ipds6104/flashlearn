import { DrizzleUserRepository } from '../repositories/DrizzleUserRepository';
import { DrizzleWorkspaceRepository } from '../repositories/DrizzleWorkspaceRepository';
import { DrizzleContentRepository } from '../repositories/DrizzleContentRepository';
import { DrizzleApiKeyRepository } from '../repositories/DrizzleApiKeyRepository';

import { JwtTokenService } from '../services/JwtTokenService';
import { GoogleAuthVerifier } from '../services/GoogleAuthVerifier';

import { LoginWithGoogleUseCase } from '../../application/use-cases/auth/LoginWithGoogleUseCase';
import { GetCurrentUserUseCase } from '../../application/use-cases/auth/GetCurrentUserUseCase';

import { CreateWorkspaceUseCase } from '../../application/use-cases/workspace/CreateWorkspaceUseCase';
import { ListWorkspacesUseCase } from '../../application/use-cases/workspace/ListWorkspacesUseCase';
import { GetWorkspaceByIdUseCase } from '../../application/use-cases/workspace/GetWorkspaceByIdUseCase';
import { UpdateWorkspaceUseCase } from '../../application/use-cases/workspace/UpdateWorkspaceUseCase';
import { DeleteWorkspaceUseCase } from '../../application/use-cases/workspace/DeleteWorkspaceUseCase';

import { CreateContentUseCase } from '../../application/use-cases/content/CreateContentUseCase';
import { ListContentsUseCase } from '../../application/use-cases/content/ListContentsUseCase';
import { GetContentByIdUseCase } from '../../application/use-cases/content/GetContentByIdUseCase';
import { UpdateContentUseCase } from '../../application/use-cases/content/UpdateContentUseCase';
import { DeleteContentUseCase } from '../../application/use-cases/content/DeleteContentUseCase';
import { SubmitQuizUseCase } from '../../application/use-cases/content/SubmitQuizUseCase';
import { GenerateFlashcardsUseCase } from '../../application/use-cases/content/GenerateFlashcardsUseCase';
import { CheckGuestNameUseCase } from '../../application/use-cases/content/CheckGuestNameUseCase';

import { CreateApiKeyUseCase } from '../../application/use-cases/apikey/CreateApiKeyUseCase';
import { ListApiKeysUseCase } from '../../application/use-cases/apikey/ListApiKeysUseCase';
import { RevokeApiKeyUseCase } from '../../application/use-cases/apikey/RevokeApiKeyUseCase';
import { VerifyApiKeyUseCase } from '../../application/use-cases/apikey/VerifyApiKeyUseCase';

export class Container {
  // Repositories (Ports -> Driven Adapters)
  public readonly userRepository = new DrizzleUserRepository();
  public readonly workspaceRepository = new DrizzleWorkspaceRepository();
  public readonly contentRepository = new DrizzleContentRepository();
  public readonly apiKeyRepository = new DrizzleApiKeyRepository();

  // Services
  public readonly tokenService = new JwtTokenService();
  public readonly googleVerifier = new GoogleAuthVerifier();

  // Use Cases (Application Layer)
  public readonly loginWithGoogleUseCase = new LoginWithGoogleUseCase(
    this.userRepository,
    this.googleVerifier,
    this.tokenService
  );

  public readonly getCurrentUserUseCase = new GetCurrentUserUseCase(this.userRepository);

  public readonly createWorkspaceUseCase = new CreateWorkspaceUseCase(this.workspaceRepository);
  public readonly listWorkspacesUseCase = new ListWorkspacesUseCase(this.workspaceRepository);
  public readonly getWorkspaceByIdUseCase = new GetWorkspaceByIdUseCase(this.workspaceRepository);
  public readonly updateWorkspaceUseCase = new UpdateWorkspaceUseCase(this.workspaceRepository);
  public readonly deleteWorkspaceUseCase = new DeleteWorkspaceUseCase(this.workspaceRepository);

  public readonly createContentUseCase = new CreateContentUseCase(
    this.contentRepository,
    this.workspaceRepository
  );
  public readonly listContentsUseCase = new ListContentsUseCase(
    this.contentRepository,
    this.workspaceRepository
  );
  public readonly getContentByIdUseCase = new GetContentByIdUseCase(
    this.contentRepository,
    this.workspaceRepository
  );
  public readonly updateContentUseCase = new UpdateContentUseCase(
    this.contentRepository,
    this.workspaceRepository
  );
  public readonly deleteContentUseCase = new DeleteContentUseCase(
    this.contentRepository,
    this.workspaceRepository
  );
  public readonly submitQuizUseCase = new SubmitQuizUseCase(this.contentRepository);
  public readonly generateFlashcardsUseCase = new GenerateFlashcardsUseCase(this.contentRepository);
  public readonly checkGuestNameUseCase = new CheckGuestNameUseCase();

  public readonly createApiKeyUseCase = new CreateApiKeyUseCase(this.apiKeyRepository);
  public readonly listApiKeysUseCase = new ListApiKeysUseCase(this.apiKeyRepository);
  public readonly revokeApiKeyUseCase = new RevokeApiKeyUseCase(this.apiKeyRepository);
  public readonly verifyApiKeyUseCase = new VerifyApiKeyUseCase(
    this.apiKeyRepository,
    this.userRepository
  );
}

// Singleton DI instance
export const container = new Container();
