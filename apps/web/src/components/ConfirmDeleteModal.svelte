<script lang="ts">
  interface Props {
    isOpen: boolean;
    title: string;
    itemType?: string;
    description?: string;
    confirmLabel?: string;
    isProcessing?: boolean;
    onClose: () => void;
    onConfirm: () => void;
  }

  let {
    isOpen,
    title,
    itemType = 'Modul',
    description = 'Modul yang dihapus akan dipindahkan ke tab Arsip dan dapat Anda pulihkan (restore) kapan saja.',
    confirmLabel = 'Hapus Modul',
    isProcessing = false,
    onClose,
    onConfirm,
  }: Props = $props();
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
    <!-- Dialog Box -->
    <div
      style="background: #ffffff; width: 100%; max-width: 440px; border-radius: 20px; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);"
      onclick={(e) => e.stopPropagation()}
      role="document"
    >
      <div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 16px;">
        <div
          style="width: 44px; height: 44px; border-radius: 12px; background: #fee2e2; color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0;"
        >
          🗑️
        </div>
        <div>
          <h3 style="margin: 0 0 4px 0; font-size: 1.2rem; font-weight: 800; color: #0f172a;">
            Hapus {itemType}?
          </h3>
          <p style="margin: 0; font-size: 0.9rem; color: #64748b; font-weight: 600;">
            "{title}"
          </p>
        </div>
      </div>

      <div
        style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; margin-bottom: 20px; font-size: 0.85rem; color: #475569; line-height: 1.5;"
      >
        <span style="font-weight: 700; color: #0f766e;">💡 Reversible CRUD:</span> {description}
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button
          type="button"
          disabled={isProcessing}
          onclick={onClose}
          style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #334155; padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer;"
        >
          Batal
        </button>
        <button
          type="button"
          disabled={isProcessing}
          onclick={onConfirm}
          style="background: #e11d48; color: #ffffff; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.25);"
        >
          {isProcessing ? 'Menghapus...' : confirmLabel}
        </button>
      </div>
    </div>
  </div>
{/if}
