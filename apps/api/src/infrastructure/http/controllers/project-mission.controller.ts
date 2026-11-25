import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';
import { InMemoryTokenBucketLimiter, resolveClientIp } from '../middlewares/rate-limiter';

const critiqueRateLimiter = new InMemoryTokenBucketLimiter(15, 0.25);

function resolveSessionKey(
  headers: Record<string, string | undefined>,
  bodySessionKey?: string
): string | undefined {
  const fromHeader = headers['x-learner-session'] || headers['X-Learner-Session'];
  const raw = fromHeader || bodySessionKey;
  if (!raw || raw.trim().length < 16) return undefined;
  return raw.trim().slice(0, 128);
}

export const projectMissionController = new Elysia({ prefix: '/api/v1/contents' })
  .get(
    '/:id/project-submission',
    async ({ headers, params, query, set }) => {
      if ((query as any)?.sessionKey) {
        set.status = 400;
        return { error: 'sessionKey in query string is forbidden; pass x-learner-session header instead' };
      }
      const auth = await resolveAuth(headers);
      const sessionKey = resolveSessionKey(headers);
      try {
        return await container.getProjectSubmissionUseCase.execute(
          params.id,
          { userId: auth.user?.id, sessionKey },
          auth.role
        );
      } catch (err: any) {
        set.status = err.message?.startsWith('Forbidden') ? 403 : 404;
        return { error: err.message };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ['Contents'],
        summary: 'Get Learner Proof-of-Work Submission for a Project Mission',
      },
    }
  )
  .put(
    '/:id/project-submission',
    async ({ headers, params, body, set }) => {
      const auth = await resolveAuth(headers);
      const sessionKey = resolveSessionKey(headers, body.sessionKey);
      if (!auth.user && !sessionKey) {
        set.status = 400;
        return { error: 'Authentication or x-learner-session (>=16 chars) is required' };
      }
      try {
        return await container.saveProjectSubmissionUseCase.execute(
          params.id,
          { userId: auth.user?.id, sessionKey },
          body as any,
          auth.role
        );
      } catch (err: any) {
        set.status = err.message?.startsWith('Forbidden') ? 403 : 400;
        return { error: err.message };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        sessionKey: t.Optional(t.String()),
        status: t.Optional(t.Union([t.Literal('in_progress'), t.Literal('completed')])),
        checkedMilestoneIds: t.Optional(t.Array(t.String())),
        checkedRubricIds: t.Optional(t.Array(t.String())),
        artifactUrl: t.Optional(t.Union([t.String(), t.Null()])),
        artifactNotes: t.Optional(t.Union([t.String(), t.Null()])),
        selfReflection: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: {
        tags: ['Contents'],
        summary: 'Save or Complete Proof-of-Work Submission for a Project Mission',
      },
    }
  )
  .post(
    '/:id/project-critique',
    async ({ headers, params, body, set }) => {
      if (process.env.NODE_ENV !== 'test') {
        const check = critiqueRateLimiter.consume(`critique:${resolveClientIp(headers)}`);
        if (!check.allowed) {
          set.status = 429;
          set.headers['Retry-After'] = String(check.retryAfterSeconds);
          return { error: 'Too Many Requests: Project AI critique rate limit exceeded' };
        }
      }
      const auth = await resolveAuth(headers);
      const sessionKey = resolveSessionKey(headers, body.sessionKey);
      if (!auth.user && !sessionKey) {
        set.status = 400;
        return { error: 'Authentication or x-learner-session (>=16 chars) is required' };
      }
      try {
        return await container.critiqueProjectSubmissionUseCase.execute(
          params.id,
          { userId: auth.user?.id, sessionKey },
          body as any,
          auth.role
        );
      } catch (err: any) {
        if (err.message?.startsWith('AI_CRITIQUE_UNAVAILABLE')) {
          set.status = 503;
        } else if (err.message?.startsWith('Forbidden')) {
          set.status = 403;
        } else {
          set.status = 400;
        }
        return { error: err.message };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        sessionKey: t.Optional(t.String()),
        artifactUrl: t.Optional(t.Union([t.String(), t.Null()])),
        artifactNotes: t.Optional(t.Union([t.String(), t.Null()])),
        selfReflection: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: {
        tags: ['Contents'],
        summary: 'Request Optional Non-Spoiler AI Mentor Critique on Project Submission',
      },
    }
  );
