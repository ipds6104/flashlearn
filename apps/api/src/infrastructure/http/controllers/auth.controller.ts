import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';

export const authController = new Elysia({ prefix: '/api/v1/auth' })
  .post(
    '/google',
    async ({ body, set }) => {
      try {
        const result = await container.loginWithGoogleUseCase.execute({
          credential: body.credential,
        });
        return result;
      } catch (err: any) {
        set.status = 401;
        return { error: err.message };
      }
    },
    {
      body: t.Object({
        credential: t.String({
          description: 'Google Identity Services ID Token (JWT)',
          examples: ['eyJhbGciOiJSUzI1NiIs...'],
        }),
      }),
      detail: {
        tags: ['Authentication'],
        summary: 'Authenticate via Google OAuth ID Token',
        description:
          'Verifies cryptographic Google Identity Services token, registers or logs in user, and provisions JWT session.',
      },
    }
  )
  .get(
    '/me',
    async ({ headers, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized: Session missing or expired' };
      }
      return {
        user: auth.user,
        role: auth.role,
        isApiKey: auth.isApiKey,
      };
    },
    {
      detail: {
        tags: ['Authentication'],
        summary: 'Get Current Authenticated User Profile',
        description: 'Returns profile details for the currently authenticated session or API key.',
      },
    }
  )
  .get(
    '/config',
    () => {
      return {
        googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      };
    },
    {
      detail: {
        tags: ['Authentication'],
        summary: 'Public Authentication Configuration',
        description: 'Returns public client configuration such as Google Client ID.',
      },
    }
  );
