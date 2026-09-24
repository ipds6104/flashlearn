<script lang="ts">
  import { App, View, Navbar, NavTitle, NavRight, Page, Link } from 'framework7-svelte';
  import { routes } from './routes';
  import { auth } from './stores/auth.svelte';
  import NavbarAuth from './components/NavbarAuth.svelte';

  const f7params = {
    name: 'FlashLearn',
    theme: 'auto',
    routes,
    darkMode: false,
    view: {
      browserHistory: true,
      browserHistorySeparator: '#',
    },
  };
</script>

<App {...f7params}>
  <View main class="safe-areas" url="/">
    <!-- Top Persistent Global Navbar -->
    <div
      style="background: #ffffff; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 500; box-shadow: 0 1px 4px rgba(0,0,0,0.03);"
    >
      <div
        style="max-width: 1040px; margin: 0 auto; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;"
      >
        <!-- Brand Title -->
        <a
          href="#/"
          style="text-decoration: none; display: flex; align-items: center; gap: 8px;"
        >
          <div
            style="width: 34px; height: 34px; background: #0f766e; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 1.1rem; font-weight: 800; box-shadow: 0 4px 10px rgba(15, 118, 110, 0.3);"
          >
            ⚡
          </div>
          <div>
            <span style="font-size: 1.25rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
              FlashLearn
            </span>
          </div>
        </a>

        <!-- Middle Navigation Links -->
        <div style="display: flex; align-items: center; gap: 16px;">
          <a
            href="#/"
            style="color: #334155; text-decoration: none; font-weight: 600; font-size: 0.9rem;"
          >
            Eksplorasi
          </a>

          {#if auth.isCreator}
            <a
              href="#/creator"
              style="color: #0f766e; text-decoration: none; font-weight: 700; font-size: 0.9rem;"
            >
              Studio Kreator
            </a>
          {/if}

          {#if auth.isSuperadmin}
            <a
              href="#/admin"
              style="color: #b91c1c; text-decoration: none; font-weight: 700; font-size: 0.9rem;"
            >
              🛡️ Superadmin
            </a>
          {/if}

          <a
            href="http://localhost:3001/docs"
            target="_blank"
            rel="noreferrer"
            style="color: #64748b; text-decoration: none; font-weight: 600; font-size: 0.85rem;"
          >
            OpenAPI Docs ↗
          </a>
        </div>

        <!-- Right User / Auth Controls -->
        <div>
          <NavbarAuth />
        </div>
      </div>
    </div>
  </View>
</App>
