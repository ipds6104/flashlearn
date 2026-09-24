<script lang="ts">
  interface Props {
    name:
      | 'bolt'
      | 'pencil'
      | 'trash'
      | 'arrow-path'
      | 'chart-bar'
      | 'link'
      | 'plus'
      | 'clock'
      | 'book-open'
      | 'check-circle'
      | 'layers'
      | 'eye'
      | 'key'
      | 'shield-check'
      | 'arrow-left'
      | 'arrow-up'
      | 'arrow-down'
      | 'xmark'
      | 'bars-3'
      | 'arrow-down-tray'
      | 'check'
      | 'chevron-right'
      | 'sparkles'
      | 'exclamation-circle'
      | 'info-circle';
    size?: number | string;
    strokeWidth?: number;
    class?: string;
    style?: string;
  }

  let {
    name,
    size = 16,
    strokeWidth = 2,
    class: className = '',
    style = '',
  }: Props = $props();

  const pxSize = $derived(typeof size === 'number' ? `${size}px` : size);
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={pxSize}
  height={pxSize}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  class="fl-icon {className}"
  style="display: inline-block; vertical-align: middle; flex-shrink: 0; {style}"
  aria-hidden="true"
>
  {#if name === 'bolt'}
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  {:else if name === 'pencil'}
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  {:else if name === 'trash'}
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  {:else if name === 'arrow-path'}
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  {:else if name === 'chart-bar'}
    <line x1="12" x2="12" y1="20" y2="10" />
    <line x1="18" x2="18" y1="20" y2="4" />
    <line x1="6" x2="6" y1="20" y2="16" />
  {:else if name === 'link'}
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  {:else if name === 'plus'}
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  {:else if name === 'clock'}
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  {:else if name === 'book-open'}
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  {:else if name === 'check-circle'}
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  {:else if name === 'layers'}
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  {:else if name === 'eye'}
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  {:else if name === 'key'}
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  {:else if name === 'shield-check'}
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  {:else if name === 'arrow-left'}
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  {:else if name === 'arrow-up'}
    <path d="m18 15-6-6-6 6" />
  {:else if name === 'arrow-down'}
    <path d="m6 9 6 6 6-6" />
  {:else if name === 'xmark'}
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  {:else if name === 'bars-3'}
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="18" y2="18" />
  {:else if name === 'arrow-down-tray'}
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  {:else if name === 'check'}
    <polyline points="20 6 9 17 4 12" />
  {:else if name === 'chevron-right'}
    <path d="m9 18 6-6-6-6" />
  {:else if name === 'sparkles'}
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  {:else if name === 'exclamation-circle'}
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  {:else if name === 'info-circle'}
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="16" y2="12" />
    <line x1="12" x2="12.01" y1="8" y2="8" />
  {/if}
</svg>
