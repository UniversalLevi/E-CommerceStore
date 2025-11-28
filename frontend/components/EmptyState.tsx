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
    <div className="bg-surface-raised border border-border-default rounded-2xl shadow-xl p-12 text-center space-y-4 hover-lift animate-scaleIn">
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
                  className="inline-flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-black px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
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
              className="inline-flex items-center justify-center bg-surface-hover hover:bg-surface-elevated text-text-primary px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 border border-border-default"
            >
              {secondaryActionLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

