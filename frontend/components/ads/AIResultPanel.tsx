'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { notify } from '@/lib/toast';

interface AIResultPanelProps {
  title: string;
  results: string[];
  onCopy?: (text: string) => void;
  defaultOpen?: boolean;
}

export default function AIResultPanel({
  title,
  results,
  onCopy,
  defaultOpen = false,
}: AIResultPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    notify.success('Copied to clipboard!');
    if (onCopy) onCopy(text);
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface-raised border border-border-default rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-hover transition-colors"
      >
        <h3 className="font-semibold text-text-primary">{title}</h3>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-text-secondary" />
        ) : (
          <ChevronDown className="h-5 w-5 text-text-secondary" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-border-default p-4 space-y-3">
          {results.map((result, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-surface-elevated rounded-lg hover:bg-surface-hover transition-colors"
            >
              <p className="flex-1 text-text-primary">{result}</p>
              <button
                onClick={() => handleCopy(result, index)}
                className="p-2 hover:bg-surface-base rounded transition-colors"
                title="Copy to clipboard"
              >
                {copiedIndex === index ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-text-secondary" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

