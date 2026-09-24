<script lang="ts">
  import { api } from '../stores/api';
  import type { ApiKeyItem } from '@flashlearn/shared';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  let keys = $state<ApiKeyItem[]>([]);
  let isLoading = $state(false);
  let newKeyName = $state('');
  let newlyGeneratedKey = $state<string | null>(null);
  let isGenerating = $state(false);
  let copied = $state(false);

  $effect(() => {
    if (isOpen) {
      loadKeys();
    }
  });

  async function loadKeys() {
    isLoading = true;
    try {
      keys = await api.apiKeys.list();
    } catch (err: any) {
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  async function handleCreateKey(e: Event) {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    isGenerating = true;
    try {
      const res = await api.apiKeys.create({
        name: newKeyName.trim(),
        permissions: ['*'],
      });
      newlyGeneratedKey = res.key;
      newKeyName = '';
      await loadKeys();
    } catch (err: any) {
      alert(`Gagal membuat API Key: ${err.message}`);
    } finally {
      isGenerating = false;
    }
  }

  async function handleRevoke(keyId: string) {
    if (!confirm('Yakin ingin mencabut (revoke) API Key ini? Akses otomatis yang menggunakannya akan terhenti.')) {
      return;
    }
    try {
      await api.apiKeys.revoke(keyId);
      await loadKeys();
    } catch (err: any) {
      alert(`Gagal mencabut key: ${err.message}`);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div
    style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px;"
    onclick={onClose}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Escape' && onClose()}
  >
    <!-- Modal Dialog -->
    <div
      style="background: #ffffff; width: 100%; max-width: 580px; border-radius: 20px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto;"
      onclick={(e) => e.stopPropagation()}
      role="document"
    >
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 1.35rem; font-weight: 800; color: #0f172a;">
          🔑 Manajemen API Keys
        </h2>
        <button
          onclick={onClose}
          style="background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b;"
        >
          ✕
        </button>
      </div>

      <p style="color: #64748b; font-size: 0.9rem; margin-top: 0; margin-bottom: 20px; line-height: 1.5;">
        Gunakan API Key untuk melakukan operasi CRUD (Workspaces, Contents, Quiz) secara otomatis via REST API dengan hak akses akunmu.
      </p>

      <!-- Newly Generated Secret Warning -->
      {#if newlyGeneratedKey}
        <div
          style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 16px; margin-bottom: 20px;"
        >
          <div style="font-weight: 700; color: #166534; font-size: 0.95rem; margin-bottom: 6px;">
            ✓ API Key Berhasil Dibuat!
          </div>
          <p style="font-size: 0.85rem; color: #15803d; margin: 0 0 10px 0;">
            Salin sekarang. Demi keamanan, kunci rahasia ini tidak akan ditampilkan lagi.
          </p>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input
              type="text"
              readonly
              value={newlyGeneratedKey}
              style="flex: 1; font-family: monospace; background: #ffffff; border: 1px solid #bbf7d0; padding: 8px 12px; border-radius: 8px; font-size: 0.85rem; color: #0f172a;"
            />
            <button
              onclick={() => copyToClipboard(newlyGeneratedKey!)}
              style="background: #16a34a; color: #ffffff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer;"
            >
              {copied ? 'Tersalin! ✓' : 'Salin'}
            </button>
          </div>
        </div>
      {/if}

      <!-- Create New Key Form -->
      <form
        onsubmit={handleCreateKey}
        style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;"
      >
        <div style="font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-bottom: 10px;">
          Buat API Key Baru
        </div>
        <div style="display: flex; gap: 8px;">
          <input
            type="text"
            placeholder="Label (contoh: Obsidian Sync, CLI Bot)..."
            bind:value={newKeyName}
            required
            style="flex: 1; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;"
          />
          <button
            type="submit"
            disabled={isGenerating}
            style="background: #0f766e; color: #ffffff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.9rem;"
          >
            {isGenerating ? 'Membuat...' : '+ Buat Key'}
          </button>
        </div>
      </form>

      <!-- Active Keys Table -->
      <div style="font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-bottom: 12px;">
        Daftar Kunci Aktif
      </div>

      {#if isLoading}
        <div style="text-align: center; padding: 20px; color: #94a3b8;">Memuat daftar kunci...</div>
      {:else if keys.length === 0}
        <div style="text-align: center; padding: 20px; color: #94a3b8; background: #f8fafc; border-radius: 12px;">
          Belum ada API Key yang dibuat.
        </div>
      {:else}
        <div style="display: flex; flex-direction: column; gap: 10px;">
          {#each keys as k}
            <div
              style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 10px;"
            >
              <div>
                <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">{k.name}</div>
                <div style="font-family: monospace; font-size: 0.8rem; color: #64748b; margin-top: 2px;">
                  {k.keyPrefix} • Dibuat: {new Date(k.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onclick={() => handleRevoke(k.id)}
                style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer;"
              >
                Revoke
              </button>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Example Usage Tip -->
      <div style="margin-top: 24px; padding: 14px; background: #f8fafc; border-radius: 10px; font-size: 0.825rem; color: #475569;">
        <strong>Cara Pakai:</strong> Kirim header HTTP berikut:<br />
        <code style="display: block; margin-top: 6px; padding: 6px 10px; background: #0f172a; color: #38bdf8; border-radius: 6px;">
          Authorization: Bearer fl_live_...
        </code>
      </div>
    </div>
  </div>
{/if}
