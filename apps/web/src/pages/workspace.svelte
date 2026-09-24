<script lang="ts">
  import { Page } from 'framework7-svelte';
  import { api } from '../stores/api';
  import { auth } from '../stores/auth.svelte';
  import type { Workspace, Content } from '@flashlearn/shared';
  import ContentEditorModal from '../components/ContentEditorModal.svelte';
  import ConfirmDeleteModal from '../components/ConfirmDeleteModal.svelte';
  import QuizReviewModal from '../components/QuizReviewModal.svelte';
  import Icon from '../components/ui/Icon.svelte';
  import ChipBadge from '../components/ui/ChipBadge.svelte';

  interface Props {
    f7route?: any;
    f7router?: any;
    workspaceId?: string;
  }

  let { f7route, f7router, workspaceId }: Props = $props();

  const id = $derived(workspaceId || f7route?.params?.id || '');

  let workspace = $state<Workspace | null>(null);
  let contents = $state<Content[]>([]);
  let isLoading = $state(true);
  let activeFilter = $state<string>('all');

  // Creator Content Editor Modal state (Create & Edit)
  let showEditorModal = $state(false);
  let contentToEdit = $state<Content | null>(null);

  // Soft Delete confirmation modal state
  let showDeleteModal = $state(false);
  let contentToDelete = $state<Content | null>(null);
  let isDeleting = $state(false);
  let isRestoring = $state(false);

  // Post-Quiz Review & Submissions Modal State
  let showReviewModal = $state(false);
  let reviewInitialTab = $state<'analysis' | 'participants'>('analysis');
  let selectedContentForReview = $state<Content | null>(null);

  // Feedback state
  let copiedLinkId = $state<string | null>(null);

  $effect(() => {
    if (id) {
      loadWorkspaceData();
    }
  });

  async function loadWorkspaceData() {
    isLoading = true;
    try {
      const [ws, items] = await Promise.all([
        api.workspaces.get(id),
        api.contents.listByWorkspace(id),
      ]);
      workspace = ws;
      contents = items;
    } catch (err: any) {
      alert(`Gagal memuat workspace: ${err.message}`);
    } finally {
      isLoading = false;
    }
  }

  let isOwner = $derived(
    auth.isSuperadmin || (auth.isLoggedIn && workspace?.creatorId === auth.user?.id)
  );

  let activeContents = $derived(contents.filter((c) => !c.deletedAt));
  let deletedContents = $derived(contents.filter((c) => !!c.deletedAt));

  let filteredContents = $derived(
    activeFilter === 'trash'
      ? deletedContents
      : activeFilter === 'all'
      ? activeContents
      : activeContents.filter((c) => c.type === activeFilter)
  );

  function navigateToContent(c: Content) {
    if (c.deletedAt) return;
    if (f7router) {
      f7router.navigate(`/content/${c.id}`);
    } else {
      window.location.hash = `/content/${c.id}`;
    }
  }

  function copyShareLink(c: Content, e: Event) {
    e.stopPropagation();
    const url = `${window.location.origin}/c/${c.id}`;
    navigator.clipboard.writeText(url);
    copiedLinkId = c.id;
    setTimeout(() => (copiedLinkId = null), 2000);
  }

  function openQuizReview(c: Content, e: Event, tab: 'analysis' | 'participants' = 'analysis') {
    e.stopPropagation();
    selectedContentForReview = c;
    reviewInitialTab = tab;
    showReviewModal = true;
  }

  function openCreateModal() {
    contentToEdit = null;
    showEditorModal = true;
  }

  function openEditModal(c: Content, e: Event) {
    e.stopPropagation();
    contentToEdit = c;
    showEditorModal = true;
  }

  async function handleContentSaved(savedContent: Content) {
    showEditorModal = false;
    contentToEdit = null;
    await loadWorkspaceData();
  }

  function openDeleteModal(c: Content, e: Event) {
    e.stopPropagation();
    contentToDelete = c;
    showDeleteModal = true;
  }

  async function confirmDelete() {
    if (!contentToDelete) return;
    isDeleting = true;
    try {
      await api.contents.delete(contentToDelete.id);
      showDeleteModal = false;
      contentToDelete = null;
      await loadWorkspaceData();
    } catch (err: any) {
      alert(`Gagal menghapus modul: ${err.message}`);
    } finally {
      isDeleting = false;
    }
  }

  async function handleRestoreContent(c: Content, e: Event) {
    e.stopPropagation();
    isRestoring = true;
    try {
      await api.contents.restore(c.id);
      await loadWorkspaceData();
    } catch (err: any) {
      alert(`Gagal memulihkan modul: ${err.message}`);
    } finally {
      isRestoring = false;
    }
  }

  async function handleRollback(c: Content, e: Event) {
    e.stopPropagation();
    if (!confirm(`Kembalikan (rollback) "${c.title}" ke versi sebelumnya?`)) {
      return;
    }
    try {
      await api.contents.rollback(c.id);
      alert('Konten berhasil di-rollback ke versi sebelumnya.');
      await loadWorkspaceData();
    } catch (err: any) {
      alert(`Gagal rollback: ${err.message}`);
    }
  }
</script>

<Page name="workspace">
<div class="workspace-page" style="max-width: 900px; margin: 0 auto; padding: 20px 16px;">
  {#if isLoading}
    <div style="text-align: center; padding: 48px; color: #94a3b8; font-weight: 500;">
      Memuat detail workspace...
    </div>
  {:else if workspace}
    <!-- Workspace Header -->
    <div
      style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.02);"
    >
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 14px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 14px; min-width: 0; flex: 1;">
          <div
            style="width: 52px; height: 52px; border-radius: 14px; background: #f0fdfa; border: 1px solid #ccfbf1; display: flex; align-items: center; justify-content: center; font-size: 2rem; flex-shrink: 0;"
          >
            {workspace.icon || '📚'}
          </div>
          <div style="min-width: 0; flex: 1;">
            <h1 style="margin: 0 0 4px 0; font-size: 1.55rem; color: #0f172a; font-weight: 800; overflow-wrap: break-word; word-break: break-word; line-height: 1.25;">
              {workspace.name}
            </h1>
            <div style="font-size: 0.825rem; color: #64748b;">
              Dikelola oleh <strong style="color: #334155;">{workspace.creatorName || 'Creator'}</strong>
            </div>
          </div>
        </div>

        {#if isOwner}
          <button
            onclick={openCreateModal}
            style="background: #0f766e; color: #ffffff; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 0.875rem; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25); white-space: nowrap; flex-shrink: 0;"
          >
            <Icon name="plus" size={15} />
            <span>Buat Modul</span>
          </button>
        {/if}
      </div>

      {#if workspace.description}
        <p style="margin: 0; font-size: 0.925rem; line-height: 1.6; color: #475569; overflow-wrap: break-word;">
          {workspace.description}
        </p>
      {/if}
    </div>

    <!-- Filters Bar (Horizontal Scrollable with Zero-Wrap Pills) -->
    <div
      style="display: flex; gap: 8px; margin-bottom: 18px; overflow-x: auto; padding-bottom: 4px; align-items: center; -webkit-overflow-scrolling: touch;"
    >
      <button
        onclick={() => (activeFilter = 'all')}
        class="fl-pill-btn"
        style="width: auto !important; padding: 7px 14px; border-radius: 8px; font-size: 0.825rem; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; background: {activeFilter === 'all' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'all' ? '#ffffff' : '#64748b'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
      >
        <span>Semua</span>
        <span style="font-size: 0.75rem; opacity: 0.85;">({activeContents.length})</span>
      </button>

      <button
        onclick={() => (activeFilter = 'materi')}
        class="fl-pill-btn"
        style="width: auto !important; padding: 7px 14px; border-radius: 8px; font-size: 0.825rem; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; background: {activeFilter === 'materi' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'materi' ? '#ffffff' : '#64748b'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
      >
        <Icon name="book-open" size={13} />
        <span>Materi</span>
        <span style="font-size: 0.75rem; opacity: 0.85;">({activeContents.filter(c => c.type === 'materi').length})</span>
      </button>

      <button
        onclick={() => (activeFilter = 'quiz')}
        class="fl-pill-btn"
        style="width: auto !important; padding: 7px 14px; border-radius: 8px; font-size: 0.825rem; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; background: {activeFilter === 'quiz' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'quiz' ? '#ffffff' : '#64748b'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
      >
        <Icon name="check-circle" size={13} />
        <span>Kuis</span>
        <span style="font-size: 0.75rem; opacity: 0.85;">({activeContents.filter(c => c.type === 'quiz').length})</span>
      </button>

      <button
        onclick={() => (activeFilter = 'combined')}
        class="fl-pill-btn"
        style="width: auto !important; padding: 7px 14px; border-radius: 8px; font-size: 0.825rem; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; background: {activeFilter === 'combined' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'combined' ? '#ffffff' : '#64748b'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
      >
        <Icon name="layers" size={13} />
        <span>Gabungan</span>
        <span style="font-size: 0.75rem; opacity: 0.85;">({activeContents.filter(c => c.type === 'combined').length})</span>
      </button>

      {#if isOwner && deletedContents.length > 0}
        <button
          onclick={() => (activeFilter = 'trash')}
          class="fl-pill-btn"
          style="width: auto !important; padding: 7px 14px; border-radius: 8px; font-size: 0.825rem; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; background: {activeFilter === 'trash' ? '#e11d48' : '#fef2f2'}; color: {activeFilter === 'trash' ? '#ffffff' : '#be123c'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-left: auto;"
        >
          <Icon name="trash" size={13} />
          <span>Arsip</span>
          <span style="font-size: 0.75rem; opacity: 0.85;">({deletedContents.length})</span>
        </button>
      {/if}
    </div>

    <!-- Contents List -->
    {#if filteredContents.length === 0}
      <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 48px 20px; text-align: center;">
        <div style="color: #94a3b8; margin-bottom: 8px;">
          <Icon name={activeFilter === 'trash' ? 'trash' : 'book-open'} size={32} />
        </div>
        <p style="color: #64748b; margin: 0 0 14px 0; font-weight: 600; font-size: 0.95rem;">
          {activeFilter === 'trash'
            ? 'Tidak ada modul di arsip terhapus.'
            : 'Belum ada konten pada kategori ini.'}
        </p>
        {#if isOwner && activeFilter !== 'trash'}
          <button
            onclick={openCreateModal}
            style="background: #0f766e; color: #ffffff; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 700; font-size: 0.875rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;"
          >
            <Icon name="plus" size={14} />
            <span>Buat Modul Sekarang</span>
          </button>
        {/if}
      </div>
    {:else}
      <div style="display: flex; flex-direction: column; gap: 12px;">
        {#each filteredContents as c}
          {#if activeFilter === 'trash'}
            <!-- Soft Deleted Item Card in Trash Tab -->
            <div
              style="background: #fff7ed; border: 1.5px dashed #fdba74; border-radius: 14px; padding: 16px 18px; display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;"
            >
              <div style="flex: 1; min-width: 220px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <ChipBadge variant="danger" icon="trash" label="Arsip Terhapus" />
                  <span style="font-size: 0.75rem; color: #9a3412; font-weight: 600; text-transform: uppercase;">
                    {c.type}
                  </span>
                </div>
                <h3 style="margin: 0 0 4px 0; font-size: 1.05rem; color: #7c2d12; font-weight: 700; overflow-wrap: break-word;">
                  {c.title}
                </h3>
                <div style="font-size: 0.775rem; color: #9a3412;">
                  Dihapus: {c.deletedAt ? new Date(c.deletedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                </div>
              </div>

              <div>
                <button
                  onclick={(e) => handleRestoreContent(c, e)}
                  disabled={isRestoring}
                  style="background: #0f766e; color: #ffffff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.825rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(15,118,110,0.2); white-space: nowrap;"
                >
                  <Icon name="arrow-path" size={13} />
                  <span>{isRestoring ? 'Memulihkan...' : 'Pulihkan Modul'}</span>
                </button>
              </div>
            </div>
          {:else}
            <!-- Active Content Card -->
            <div
              class="content-card"
              onclick={() => navigateToContent(c)}
              role="button"
              tabindex="0"
              onkeydown={(e) => e.key === 'Enter' && navigateToContent(c)}
              style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);"
            >
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                <div style="flex: 1; min-width: 0;">
                  <!-- Micro Metadata Chips -->
                  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
                    <ChipBadge
                      variant={c.type === 'quiz' ? 'quiz' : c.type === 'materi' ? 'materi' : 'combined'}
                      icon={c.type === 'quiz' ? 'check-circle' : c.type === 'materi' ? 'book-open' : 'layers'}
                      label={c.type === 'quiz' ? 'Kuis' : c.type === 'materi' ? 'Materi' : 'Materi + Kuis'}
                    />

                    {#if c.questions && c.questions.length > 0}
                      <ChipBadge variant="neutral" icon="check-circle" label="{c.questions.length} Soal" />
                    {/if}

                    {#if c.readingTimeMinutes}
                      <ChipBadge variant="neutral" icon="clock" label="~{c.readingTimeMinutes} mnt" />
                    {/if}
                  </div>

                  <h3 style="margin: 0 0 6px 0; font-size: 1.1rem; color: #0f172a; font-weight: 700; line-height: 1.35; overflow-wrap: break-word; word-break: break-word;">
                    {c.title}
                  </h3>

                  {#if c.summary}
                    <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.45; overflow-wrap: break-word;">
                      {c.summary}
                    </p>
                  {/if}
                </div>

                <div style="flex-shrink: 0;">
                  <span style="color: #0f766e; font-weight: 700; font-size: 0.85rem; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px;">
                    <span>Buka</span>
                    <Icon name="chevron-right" size={13} />
                  </span>
                </div>
              </div>

              <!-- Creator Action Toolbar -->
              {#if isOwner}
                <div
                  style="display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid #f1f5f9; gap: 8px; flex-wrap: wrap;"
                  onclick={(e) => e.stopPropagation()}
                  role="toolbar"
                >
                  <!-- Group 1: Sharing & Analytics -->
                  <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                    <button
                      type="button"
                      onclick={(e) => copyShareLink(c, e)}
                      style="background: #f8fafc; border: 1px solid #e2e8f0; color: #334155; padding: 5px 10px; border-radius: 6px; font-size: 0.775rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;"
                    >
                      <Icon name={copiedLinkId === c.id ? 'check' : 'link'} size={13} />
                      <span>{copiedLinkId === c.id ? 'Tersalin' : 'Salin Link'}</span>
                    </button>

                    {#if c.type !== 'materi'}
                      <button
                        type="button"
                        class="fl-pill-btn"
                        onclick={(e) => openQuizReview(c, e, 'analysis')}
                        title="Bahas butir soal & analisis kesalahan peserta"
                        style="background: #f0fdfa; border: 1.5px solid #99f6e4; color: #0f766e; padding: 5px 10px; border-radius: 6px; font-size: 0.775rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;"
                      >
                        <Icon name="sparkles" size={13} />
                        <span>Bahas Soal</span>
                      </button>

                      <button
                        type="button"
                        class="fl-pill-btn"
                        onclick={(e) => openQuizReview(c, e, 'participants')}
                        title="Rekap nilai peserta & ekspor Excel"
                        style="background: #eef2ff; border: 1px solid #c7d2fe; color: #4338ca; padding: 5px 10px; border-radius: 6px; font-size: 0.775rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;"
                      >
                        <Icon name="chart-bar" size={13} />
                        <span>Rekap Nilai</span>
                      </button>
                    {/if}
                  </div>

                  <!-- Group 2: Mutation & Governance -->
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <!-- Edit Module Button -->
                    <button
                      type="button"
                      onclick={(e) => openEditModal(c, e)}
                      title="Edit modul pembelajaran"
                      style="background: #0f766e; border: none; color: #ffffff; padding: 5px 12px; border-radius: 6px; font-size: 0.775rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 1px 4px rgba(15,118,110,0.2); white-space: nowrap;"
                    >
                      <Icon name="pencil" size={12} />
                      <span>Edit</span>
                    </button>

                    <!-- Rollback to previous version -->
                    <button
                      type="button"
                      onclick={(e) => handleRollback(c, e)}
                      title="Kembalikan ke snapshot versi sebelumnya"
                      style="background: #fefce8; border: 1px solid #fef08a; color: #854d0e; padding: 5px 9px; border-radius: 6px; font-size: 0.775rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;"
                    >
                      <Icon name="arrow-path" size={12} />
                      <span>Rollback</span>
                    </button>

                    <!-- Delete (Soft Delete) -->
                    <button
                      type="button"
                      onclick={(e) => openDeleteModal(c, e)}
                      title="Hapus modul ini"
                      aria-label="Hapus modul"
                      style="background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; padding: 5px 8px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;"
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  {/if}
</div>

<!-- Post-Quiz Review & Analytics Modal -->
{#if showReviewModal && selectedContentForReview}
  <QuizReviewModal
    content={selectedContentForReview}
    isOpen={showReviewModal}
    initialTab={reviewInitialTab}
    onClose={() => (showReviewModal = false)}
  />
{/if}

<!-- Content Editor Modal (Create & Edit) -->
<ContentEditorModal
  isOpen={showEditorModal}
  workspaceId={id}
  contentToEdit={contentToEdit}
  onClose={() => (showEditorModal = false)}
  onSaved={handleContentSaved}
/>

<!-- Soft Delete Confirmation Modal -->
<ConfirmDeleteModal
  isOpen={showDeleteModal}
  title={contentToDelete?.title || ''}
  itemType={contentToDelete?.type === 'quiz' ? 'Kuis' : contentToDelete?.type === 'materi' ? 'Materi' : 'Modul'}
  isProcessing={isDeleting}
  onClose={() => (showDeleteModal = false)}
  onConfirm={confirmDelete}
/>
</Page>
