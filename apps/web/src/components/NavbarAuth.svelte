<script lang="ts">
  import { auth } from '../stores/auth.svelte';
  import ApiKeyModal from './ApiKeyModal.svelte';

  let showApiKeyModal = $state(false);
  let googleButtonContainer: HTMLDivElement | undefined = $state();

  const GOOGLE_CLIENT_ID =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    'your-google-client-id.apps.googleusercontent.com';

  $effect(() => {
    if (!auth.isLoggedIn && googleButtonContainer) {
      initGoogleLogin();
    }
  });

  function initGoogleLogin() {
    if (typeof (window as any).google === 'undefined') {
      setTimeout(initGoogleLogin, 500);
      return;
    }

    try {
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
      });

      if (googleButtonContainer) {
        (window as any).google.accounts.id.renderButton(googleButtonContainer, {
          theme: 'outline',
          size: 'medium',
          text: 'signin_with',
          shape: 'pill',
        });
      }
    } catch (err) {
      console.error('Google GIS Init error:', err);
    }
  }

  async function handleGoogleResponse(response: any) {
    if (response.credential) {
      try {
        await auth.loginWithGoogle(response.credential);
      } catch (err: any) {
        alert(`Login gagal: ${err.message}`);
      }
    }
  }
</script>

<div class="navbar-auth" style="display: flex; align-items: center; gap: 12px;">
  {#if auth.isLoading}
    <div style="font-size: 0.85rem; color: #94a3b8;">Memeriksa akun...</div>
  {:else if auth.isLoggedIn && auth.user}
    <!-- User Profile & Badges -->
    <div style="display: flex; align-items: center; gap: 8px;">
      {#if auth.user.avatar}
        <img
          src={auth.user.avatar}
          alt={auth.user.name}
          style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid #0f766e;"
        />
      {/if}
      <div style="display: flex; flex-direction: column; text-align: right;">
        <span style="font-weight: 700; font-size: 0.85rem; color: #0f172a; line-height: 1.2;">
          {auth.user.name.split(' ')[0]}
        </span>
        <span
          style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: {auth.isSuperadmin ? '#b91c1c' : '#0f766e'};"
        >
          {auth.user.role}
        </span>
      </div>
    </div>

    <!-- API Key Button -->
    <button
      onclick={() => (showApiKeyModal = true)}
      title="Manajemen API Key"
      style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 10px; font-size: 0.8rem; font-weight: 600; cursor: pointer; color: #334155;"
    >
      🔑 API Key
    </button>

    <!-- Logout Button -->
    <button
      onclick={() => auth.logout()}
      style="background: none; border: none; color: #ef4444; font-size: 0.85rem; font-weight: 600; cursor: pointer; padding: 4px;"
    >
      Keluar
    </button>
  {:else}
    <!-- Guest Google Login Button -->
    <div bind:this={googleButtonContainer}></div>
  {/if}
</div>

<ApiKeyModal isOpen={showApiKeyModal} onClose={() => (showApiKeyModal = false)} />
