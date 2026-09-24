import { Elysia, t } from 'elysia';
import { container } from '../../di/container';
import { resolveAuth } from '../middlewares/auth';

export const workspaceController = new Elysia({ prefix: '/api/v1/workspaces' })
  .get(
    '/',
    async ({ headers, query }) => {
      const auth = await resolveAuth(headers);
      const scope = (query.scope as 'public' | 'mine' | 'all') || 'public';

      return await container.listWorkspacesUseCase.execute({
        userId: auth.user?.id,
        role: auth.role,
        scope,
      });
    },
    {
      query: t.Optional(
        t.Object({
          scope: t.Optional(
            t.Union([t.Literal('public'), t.Literal('mine'), t.Literal('all')], {
              description: 'Filter scope: public (guest/default), mine (creator), all (superadmin)',
            })
          ),
        })
      ),
      detail: {
        tags: ['Workspaces'],
        summary: 'List Workspaces',
        description:
          'Lists workspaces accessible by current role. Guests view public workspaces. Creators view their own and public workspaces. Superadmins can list all workspaces.',
      },
    }
  )
  .post(
    '/',
    async ({ headers, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user || (auth.role !== 'creator' && auth.role !== 'superadmin')) {
        set.status = 403;
        return { error: 'Forbidden: Only creators and superadmins can create workspaces' };
      }

      try {
        const workspace = await container.createWorkspaceUseCase.execute(auth.user.id, body);
        set.status = 201;
        return workspace;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 3, description: 'Workspace name' }),
        slug: t.Optional(t.String({ description: 'Custom URL slug' })),
        description: t.Optional(t.String({ description: 'Workspace description' })),
        icon: t.Optional(t.String({ description: 'Emoji or icon symbol' })),
        isPublic: t.Optional(t.Boolean({ default: true, description: 'Public visibility flag' })),
      }),
      detail: {
        tags: ['Workspaces'],
        summary: 'Create Workspace',
        description: 'Creates a new workspace belonging to the authenticated creator or superadmin.',
      },
    }
  )
  .get(
    '/:id',
    async ({ headers, params, set }) => {
      const auth = await resolveAuth(headers);
      try {
        const workspace = await container.getWorkspaceByIdUseCase.execute(
          params.id,
          auth.user?.id,
          auth.role
        );
        if (!workspace) {
          set.status = 404;
          return { error: 'Workspace not found' };
        }
        return workspace;
      } catch (err: any) {
        set.status = 403;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Workspace UUID or slug' }),
      }),
      detail: {
        tags: ['Workspaces'],
        summary: 'Get Workspace by ID or Slug',
        description: 'Fetches workspace details if public or if user has access privileges.',
      },
    }
  )
  .put(
    '/:id',
    async ({ headers, params, body, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized: Authentication required' };
      }

      try {
        const updated = await container.updateWorkspaceUseCase.execute(
          params.id,
          auth.user.id,
          auth.role,
          body
        );
        return updated;
      } catch (err: any) {
        set.status = 403;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Workspace UUID' }),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        slug: t.Optional(t.String()),
        description: t.Optional(t.String()),
        icon: t.Optional(t.String()),
        isPublic: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ['Workspaces'],
        summary: 'Update Workspace',
        description:
          'Updates workspace details. Creators can only update their own workspaces. Superadmins can update any workspace.',
      },
    }
  )
  .delete(
    '/:id',
    async ({ headers, params, set }) => {
      const auth = await resolveAuth(headers);
      if (!auth.user) {
        set.status = 401;
        return { error: 'Unauthorized: Authentication required' };
      }

      try {
        const success = await container.deleteWorkspaceUseCase.execute(
          params.id,
          auth.user.id,
          auth.role
        );
        return { success };
      } catch (err: any) {
        set.status = 403;
        return { error: err.message };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: 'Workspace UUID' }),
      }),
      detail: {
        tags: ['Workspaces'],
        summary: 'Delete Workspace',
        description:
          'Deletes a workspace. Creators can only delete their own workspaces. Superadmins can delete any workspace.',
      },
    }
  );
