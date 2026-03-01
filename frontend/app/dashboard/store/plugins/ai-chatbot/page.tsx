'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/contexts/StoreContext';
import { notify } from '@/lib/toast';
import { Loader2, Save, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function AIChatbotPluginPage() {
  const { store } = useStore();
  const [config, setConfig] = useState({
    enabled: true,
    greeting: 'Hello! How can I help you with your order or our products today?',
    faq: '',
    policy: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store?._id) load();
  }, [store]);

  const load = async () => {
    try {
      const res = await api.getStorePlugins(store._id);
      if (res.success) {
        const p = res.data.find((x: any) => x.slug === 'ai-chatbot');
        if (p?.storeConfig?.config) setConfig((c) => ({ ...c, ...p.storeConfig.config }));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.updatePluginConfig(store._id, 'ai-chatbot', config);
      notify.success('Saved');
    } catch {
      notify.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Customer Chatbot</h1>
        <p className="text-gray-400 mt-1">Automated AI chatbot that answers customer questions about products and store policy</p>
      </div>

      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-6 space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-white">Enable chatbot on storefront</span>
        </label>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Greeting message</label>
          <input
            type="text"
            value={config.greeting}
            onChange={(e) => setConfig({ ...config, greeting: e.target.value })}
            className="w-full px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white"
            placeholder="Hello! How can I help you?"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">FAQ / Common info (optional)</label>
          <textarea
            value={config.faq}
            onChange={(e) => setConfig({ ...config, faq: e.target.value })}
            className="w-full px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white min-h-[100px]"
            placeholder="e.g. We ship within 2-3 days. Free shipping on orders above ₹500."
          />
          <p className="text-xs text-gray-500 mt-1">This context is sent to the AI so it can answer common questions accurately.</p>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Store policy (optional)</label>
          <textarea
            value={config.policy}
            onChange={(e) => setConfig({ ...config, policy: e.target.value })}
            className="w-full px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white min-h-[80px]"
            placeholder="e.g. Returns within 7 days. Contact support@..."
          />
        </div>
        <p className="text-xs text-gray-500">Requires OpenAI API key to be set on the server. Chat is rate-limited per visitor.</p>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>

      <Link href="/dashboard/store/plugins" className="inline-block text-purple-400 hover:text-purple-300 text-sm">Back to Plugins</Link>
    </div>
  );
}
