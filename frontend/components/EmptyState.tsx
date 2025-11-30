'use client';

import Link from 'next/link';
import Button from './Button';
import IconBadge from './IconBadge';
import { Inbox } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
}

export default function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  actionHref,
  actionOnClick,
  secondaryActionLabel,
  secondaryActionHref,
}: EmptyStateProps) {
  const Icon = icon ?? Inbox;
  const renderIcon = () => (
    <IconBadge icon={Icon} label={title} size="xl" variant="primary" className="shadow-lg" />
  );

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center space-y-4 relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-500/5 via-transparent to-transparent"></div>
      
      <div className="relative z-10">
        <div className="flex justify-center">{renderIcon()}</div>
        <h3 className="text-2xl font-semibold text-text-primary">{title}</h3>
        <p className="text-text-secondary max-w-xl mx-auto">{message}</p>
        {(actionLabel || secondaryActionLabel) && (
          <div className="flex gap-4 justify-center flex-wrap">
            {actionLabel && (
              <>
                {actionHref ? (
                  <Link
                    href={actionHref}
                    className="inline-flex items-center justify-center bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/25"
                  >
                    {actionLabel}
                  </Link>
                ) : actionOnClick ? (
                  <Button onClick={actionOnClick}>{actionLabel}</Button>
                ) : null}
              </>
            )}
            {secondaryActionLabel && secondaryActionHref && (
              <Link
                href={secondaryActionHref}
                className="inline-flex items-center justify-center bg-white/5 hover:bg-white/10 text-text-primary px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 border border-white/20"
              >
                {secondaryActionLabel}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

