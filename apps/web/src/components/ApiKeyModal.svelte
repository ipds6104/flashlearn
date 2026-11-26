<script lang="ts">
  import { api } from '../stores/api';
  import type { ApiKeyItem } from '@flashlearn/shared';
  import {
    buildAgentSkillPrompt,
    type AgentBootstrapMetadata,
  } from '../lib/agentSkillPrompt';
  import Icon from './ui/Icon.svelte';

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
  let skillCopied = $state(false);
  let genericSkillCopied = $state(false);
  let bootstrapMeta = $state<AgentBootstrapMetadata | null>(null);

  $effect(() => {
    if (isOpen) {
      loadKeys();
      loadBootstrapMeta();
    }
  });

  async function loadBootstrapMeta() {
    if (bootstrapMeta) return;
    try {
      const res = await fetch('/api/v1/agent/bootstrap');
      if (res.ok) {
        bootstrapMeta = await res.json();
      }
    } catch {
      // Fallback to default origin & repo metadata in buildAgentSkillPrompt
    }
  }

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

  function copyAgentSkill(key?: string | null) {
    const prompt = buildAgentSkillPrompt({
      origin: window.location.origin,
      apiKey: key,
      metadata: bootstrapMeta,
    });
    navigator.clipboard.writeText(prompt);
    if (key) {
      skillCopied = true;
      setTimeout(() => (skillCopied = false), 2500);
    } else {
      genericSkillCopied = true;
      setTimeout(() => (genericSkillCopied = false), 2500);
    }
  }

  const skillCount = $derived(bootstrapMeta?.skills?.length || 4);
  const publicRepoUrl = $derived(
    bootstrapMeta?.repository?.url || 'https://github.com/ipds6104/flashlearn'
  );
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div
    style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 16px; -webkit-overflow-scrolling: touch;"
    onclick={onClose}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Escape' && onClose()}
  >
    <!-- Modal Dialog -->
    <div
      style="background: #ffffff; width: 100%; max-width: 620px; border-radius: 20px; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); max-height: 90vh; overflow-y: auto;"
      onclick={(e) => e.stopPropagation()}
      role="document"
    >
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 1.35rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px;">
          <Icon name="key" size={20} />
          <span>Manajemen API Keys</span>
        </h2>
        <button
          onclick={onClose}
          class="fl-btn fl-btn-sm"
          style="background: #f1f5f9; border: none; width: 36px; height: 36px; min-height: 36px; border-radius: 50%; padding: 0; color: #64748b;"
          aria-label="Tutup"
        >
          <Icon name="xmark" size={16} />
        </button>
      </div>

      <p style="color: #64748b; font-size: 0.9rem; margin-top: 0; margin-bottom: 20px; line-height: 1.5;">
        Gunakan API Key bersama tombol <strong>Copy Agent Skill</strong> agar coding agent (Antigravity, Claude Code, Cursor, Codex) dapat mengunduh skill, script, &amp; CLI <code>flashlearn</code> lalu membangun workspace pembelajaran secara mandiri.
      </p>

      <!-- Newly Generated Secret Warning -->
      {#if newlyGeneratedKey}
        <div
          style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 14px; padding: 18px; margin-bottom: 20px;"
        >
          <div style="font-weight: 700; color: #166534; font-size: 0.95rem; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <Icon name="check-circle" size={16} />
            <span>API Key Berhasil Dibuat!</span>
          </div>
          <p style="font-size: 0.85rem; color: #15803d; margin: 0 0 12px 0;">
            Salin sekarang. Demi keamanan, kunci rahasia ini tidak akan ditampilkan lagi.
          </p>
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap;">
            <input
              type="text"
              readonly
              value={newlyGeneratedKey}
              style="flex: 1; min-width: 200px; font-family: monospace; background: #ffffff; border: 1px solid #bbf7d0; padding: 8px 12px; border-radius: 8px; font-size: 0.85rem; color: #0f172a;"
            />
            <button
              onclick={() => copyToClipboard(newlyGeneratedKey!)}
              class="fl-btn fl-btn-sm"
              style="background: #16a34a; color: #ffffff; border: none; font-weight: 700; font-size: 0.85rem; white-space: nowrap;"
            >
              <Icon name="check" size={14} />
              <span>{copied ? 'Tersalin!' : 'Salin Key'}</span>
            </button>
          </div>

          <!-- Highlight: Copy Agent Skill Button -->
          <div style="border-top: 1px dashed #86efac; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 0.8rem; color: #15803d; font-weight: 600;">
              Serahkan ke coding agent agar otomatis memasang skill, script &amp; CLI?
            </span>
            <button
              type="button"
              onclick={() => copyAgentSkill(newlyGeneratedKey!)}
              class="fl-btn fl-btn-sm"
              style="background: linear-gradient(135deg, #4f46e5, #0f766e); color: #ffffff; border: none; font-weight: 800; font-size: 0.85rem; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);"
            >
              <Icon name="sparkles" size={14} />
              <span>{skillCopied ? 'Agent Skill Tersalin!' : 'Copy Agent Skill (+ API Key)'}</span>
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
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <input
            type="text"
            placeholder="Label (contoh: Obsidian Sync, CLI Bot)..."
            bind:value={newKeyName}
            required
            style="flex: 1 1 200px; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;"
          />
          <button
            type="submit"
            disabled={isGenerating}
            class="fl-btn fl-btn-md"
            style="background: #0f766e; color: #ffffff; border: none; font-weight: 700; font-size: 0.9rem;"
          >
            <Icon name="plus" size={15} />
            <span>{isGenerating ? 'Membuat...' : 'Buat Key'}</span>
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
              style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 10px; flex-wrap: wrap; gap: 8px;"
            >
              <div>
                <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">{k.name}</div>
                <div style="font-family: monospace; font-size: 0.8rem; color: #64748b; margin-top: 2px;">
                  {k.keyPrefix} • Dibuat: {new Date(k.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onclick={() => handleRevoke(k.id)}
                class="fl-btn fl-btn-sm"
                style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; font-size: 0.8rem; font-weight: 700;"
              >
                <Icon name="trash" size={13} />
                <span>Revoke</span>
              </button>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Always-available Copy Agent Skill Bootstrap Card -->
      <div style="margin-top: 22px; padding: 16px; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 14px; font-size: 0.83rem; color: #134e4a;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px;">
          <div>
            <div style="font-weight: 800; font-size: 0.92rem; color: #0f766e;">
              Pasang Agent Skill &amp; CLI ke Coding Agent
            </div>
            <div style="font-size: 0.78rem; color: #115e59; margin-top: 2px;">
              Mencakup {skillCount} Agent Skills, script ekstraksi gambar, CLI <code>flashlearn</code>, &amp; panduan pembuatan workspace.
            </div>
          </div>
          <button
            type="button"
            onclick={() => copyAgentSkill(newlyGeneratedKey)}
            class="fl-btn fl-btn-sm"
            style="background: #0f766e; color: #ffffff; border: none; font-weight: 700; font-size: 0.82rem; white-space: nowrap;"
          >
            <Icon name="sparkles" size={14} />
            <span>{genericSkillCopied || skillCopied ? 'Agent Skill Tersalin!' : 'Copy Agent Skill'}</span>
          </button>
        </div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 0.76rem; color: #0f766e; padding-top: 8px; border-top: 1px dashed #99f6e4;">
          <a href="/.well-known/agent-skills/index.json" target="_blank" rel="noopener noreferrer" style="color: #0f766e; font-weight: 700; text-decoration: underline;">
            /.well-known/agent-skills/index.json
          </a>
          <a href="/llms.txt" target="_blank" rel="noopener noreferrer" style="color: #0f766e; font-weight: 700; text-decoration: underline;">
            /llms.txt
          </a>
          <a href={publicRepoUrl} target="_blank" rel="noopener noreferrer" style="color: #0f766e; font-weight: 700; text-decoration: underline;">
            GitHub Repo
          </a>
        </div>
      </div>
    </div>
  </div>
{/if}
