# Hexagonal Architecture & Design Principles

FlashLearn is engineered with **Hexagonal Architecture (Ports and Adapters)**, **Single Responsibility Principle (SRP)**, **Dependency Injection (DI)**, and an **Interface-First Pattern**.

```
                           +-----------------------------------------------+
                           |              HTTP Adapters / Web              |
                           |  (Elysia Routes, Middlewares, Scalar Docs)    |
                           +-----------------------+-----------------------+
                                                   |
                                                   v  (HTTP Controller)
       +-------------------------------------------+-------------------------------------------+
       |                                APPLICATION LAYER                                      |
       |                                                                                       |
       |  Use Cases (SRP):                                                                     |
       |   - CreateWorkspaceUseCase                 - SubmitQuizUseCase                        |
       |   - ListWorkspacesUseCase                  - GenerateFlashcardsUseCase                |
       |   - CreateContentUseCase                   - CreateApiKeyUseCase                      |
       |   - LoginWithGoogleUseCase                 - VerifyApiKeyUseCase                      |
       |                                                                                       |
       |  Ports / Interfaces:                                                                  |
       |   - IWorkspaceRepository                   - IContentRepository                       |
       |   - IUserRepository                        - IApiKeyRepository                        |
       |   - IAuthTokenService                      - IGoogleTokenVerifier                     |
       +--------------------+-------------------------------------+----------------------------+
                            |                                     |
               (Implements Port)                       (Implements Port)
                            |                                     |
+---------------------------v-----------------+ +-----------------v----------------------------+
|             Database Adapters               | |               Auth Adapters                  |
|    (Drizzle ORM + PostgreSQL Driver)        | |  (Google Identity Services Verifier, JWT)    |
+---------------------------------------------+ +----------------------------------------------+
```

## Core Principles

### 1. Hexagonal Architecture (Ports and Adapters)
- **Domain Layer (`domain/`)**: Pure TypeScript entities, value objects, and domain errors. No dependencies on database libraries, web frameworks, or external APIs.
- **Application Layer (`application/`)**: Use Cases orchestrating business logic. Every use case implements a single public `execute(input)` method (SRP). It interacts solely with abstract **Ports** (interfaces).
- **Infrastructure / Adapter Layer (`infrastructure/`)**:
  - *Driving Adapters*: Elysia HTTP routes, request validation, authentication guards.
  - *Driven Adapters*: Drizzle ORM PostgreSQL repositories, Google Identity token verifier, JWT signer.

### 2. Interface-First Pattern
- Every repository and external service contract is declared as an interface first in `domain/ports/` (e.g., `IWorkspaceRepository.ts`, `IContentRepository.ts`).
- Business logic in use cases depends strictly on these interfaces, never on concrete implementations (e.g. `DrizzleWorkspaceRepository`).
- Swapping PostgreSQL for SQLite or in-memory testing requires zero changes to use cases.

### 3. Dependency Injection (DI)
- A dedicated Dependency Injection Container (`src/infrastructure/di/container.ts`) instantiates dependencies, binds interface tokens to concrete classes, and wires them into use cases.
- Inversion of Control ensures components are decoupled and testable in isolation.

### 4. Single Responsibility Principle (SRP)
- Every Use Case file has exactly one reason to change:
  - `CreateWorkspaceUseCase`: Handles workspace creation, slug uniqueness, and initial creator ownership.
  - `SubmitQuizUseCase`: Evaluates user answers against questions, calculates score percentage, and marks answers.
  - `GenerateFlashcardsUseCase`: Transforms quiz questions into flashcard entities with question prompts on front and answer/explanations on back.
  - `VerifyApiKeyUseCase`: Validates SHA-256 hashed API key, checks expiration, and returns authenticated identity and permissions.

### 5. Standard-Compliant REST API & OpenAPI 3.1
- Every endpoint is typed and validated using TypeBox/Zod schemas.
- OpenAPI 3.1 specification is generated dynamically at runtime.
- Interactive documentation and testing playground are served via **Scalar UI** at `/docs` (and `/swagger`).
- Authentication supports both **Bearer JWT** (for web sessions) and **Bearer fl_live_...** (for API keys).
