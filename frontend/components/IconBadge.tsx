'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type IconBadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
export type IconBadgeSize = 'sm' | 'md' | 'lg' | 'xl';

interface IconBadgeProps {
  /**
   * Text that should be rendered inside the badge.
   * If omitted, initials will be derived from `label`.
   */
  text?: string;
  /**
   * Lucide icon to render inside the badge. When provided, overrides `text`.
   */
  icon?: LucideIcon;
  /**
   * Label used for deriving initials and accessible title.
   */
  label?: string;
  variant?: IconBadgeVariant;
  size?: IconBadgeSize;
  className?: string;
}

const variantClasses: Record<IconBadgeVariant, string> = {
  primary: 'from-primary-500/30 via-primary-500/5 to-transparent text-primary-200 border border-primary-500/40',
  success: 'from-emerald-500/25 via-emerald-500/5 to-transparent text-emerald-200 border border-emerald-500/40',
  warning: 'from-amber-500/25 via-amber-500/5 to-transparent text-amber-100 border border-amber-500/40',
  danger: 'from-rose-500/25 via-rose-500/5 to-transparent text-rose-100 border border-rose-500/40',
  neutral: 'from-white/15 via-white/5 to-transparent text-text-secondary border border-border-default',
};

const sizeClasses: Record<IconBadgeSize, string> = {
  sm: 'w-8 h-8 rounded-lg text-xs',
  md: 'w-12 h-12 rounded-xl text-sm',
  lg: 'w-16 h-16 rounded-2xl text-base',
  xl: 'w-20 h-20 rounded-3xl text-lg',
};

const iconSizeClasses: Record<IconBadgeSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

const getInitials = (label?: string) => {
  if (!label) {
    return '•';
  }

  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '•';
  }

  const initials = words.slice(0, 2).map((word) => word[0]).join('');
  return initials.toUpperCase();
};

export default function IconBadge({
  text,
  icon,
  label,
  variant = 'primary',
  size = 'md',
  className = '',
}: IconBadgeProps) {
  const content = text?.toUpperCase() || getInitials(label);
  const Icon = icon;

  return (
    <div
      className={`inline-flex items-center justify-center bg-gradient-to-br font-semibold tracking-widest uppercase ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      aria-label={label || content}
      role="img"
    >
      {Icon ? <Icon className={`${iconSizeClasses[size]}`} aria-hidden="true" /> : content}
    </div>
  );
}

