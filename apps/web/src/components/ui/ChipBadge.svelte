<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  interface Props {
    variant?: 'materi' | 'quiz' | 'combined' | 'neutral' | 'danger' | 'success' | 'warning';
    size?: 'sm' | 'md';
    icon?: any;
    label?: string;
    children?: Snippet;
    class?: string;
    style?: string;
  }

  let {
    variant = 'neutral',
    size = 'sm',
    icon,
    label,
    children,
    class: className = '',
    style = '',
  }: Props = $props();

  const variantStyles = {
    materi: 'background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;',
    quiz: 'background: #fefce8; color: #854d0e; border: 1px solid #fef08a;',
    combined: 'background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4;',
    neutral: 'background: #f8fafc; color: #475569; border: 1px solid #e2e8f0;',
    danger: 'background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3;',
    success: 'background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;',
    warning: 'background: #fffbeb; color: #b45309; border: 1px solid #fde68a;',
  };

  const sizeStyles = {
    sm: 'padding: 3px 8px; font-size: 0.75rem; gap: 5px; border-radius: 6px;',
    md: 'padding: 5px 10px; font-size: 0.8rem; gap: 6px; border-radius: 8px;',
  };
</script>

<span
  class="fl-chip-badge {className}"
  style="display: inline-flex; align-items: center; font-weight: 600; line-height: 1; white-space: nowrap; flex-shrink: 0; user-select: none; {variantStyles[variant]} {sizeStyles[size]} {style}"
>
  {#if icon}
    <Icon name={icon} size={size === 'sm' ? 12 : 14} />
  {/if}
  {#if label}
    <span>{label}</span>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</span>
