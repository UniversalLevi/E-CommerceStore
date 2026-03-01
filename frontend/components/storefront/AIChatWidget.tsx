'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { useStoreTheme } from '@/contexts/StoreThemeContext';

interface AIChatWidgetProps {
  slug: string;
  config?: { greeting?: string; enabled?: boolean };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatWidget({ slug, config }: AIChatWidgetProps) {
  const { colors } = useStoreTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const greeting = config?.greeting || 'Hello! How can I help you today?';

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: greeting }]);
    }
  }, [open, greeting, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await api.storefrontChat(slug, text);
      const reply = res?.data?.reply || "I couldn't get a response. Please try again.";
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: "Sorry, something went wrong. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  const accent = colors?.accent || '#7c3aed';

  if (config?.enabled === false) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        style={{ backgroundColor: accent, color: '#fff' }}
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-6 z-40 w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden border"
          style={{ backgroundColor: colors?.background || '#fff', borderColor: colors?.primary + '30', maxHeight: '70vh' }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: accent, color: '#fff' }}>
            <span className="font-semibold">Chat</span>
            <button type="button" onClick={() => setOpen(false)} className="p-1 hover:opacity-80">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[320px]" style={{ backgroundColor: colors?.secondary || '#f9fafb' }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[85%] px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: msg.role === 'user' ? accent : colors?.primary + '15',
                    color: msg.role === 'user' ? '#fff' : colors?.text,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: colors?.primary + '15' }}>
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: colors?.accent }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="p-3 flex gap-2 border-t"
            style={{ borderColor: colors?.primary + '20', backgroundColor: colors?.background }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: colors?.primary + '30', color: colors?.text, backgroundColor: colors?.secondary }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-lg text-white disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
