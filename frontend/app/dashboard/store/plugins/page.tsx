'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/contexts/StoreContext';
import { Loader2, Ticket, Gift, Package, Share2, Link, Megaphone, Layers, Mail, Timer, Wallet, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

const iconMap: Record<string, any> = {
  Ticket, Gift, Package, Share2, Link, Megaphone, Layers, Mail, Timer, Wallet,
};

const pluginPages: Record<string, string> = {
  'discount-coupons': '/dashboard/store/plugins/coupons',
  'gift-cards': '/dashboard/store/plugins/gift-cards',
  'free-gifts': '/dashboard/store/plugins/free-gifts',
  'social-sharing': '/dashboard/store/plugins/social-sharing',
  'social-links': '/dashboard/store/plugins/social-links',
  'announcement-bar': '/dashboard/store/plugins/announcements',
  'product-bundles': '/dashboard/store/plugins/bundles',
  'email-popup': '/dashboard/store/plugins/popups',
  'countdown-timer': '/dashboard/store/plugins/countdown',
  'partial-cod': '/dashboard/store/plugins/partial-cod',
};

export default function PluginDashboardPage() {
  const { store } = useStore();
  const router = useRouter();
  const [plugins, setPlugins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (store?._id) fetchPlugins();
  }, [store]);

  const fetchPlugins = async () => {
    try {
      const res = await api.getStorePlugins(store._id);
      if (res.success) setPlugins(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
        <h1 className="text-2xl font-bold text-white">Store Plugins</h1>
        <p className="text-gray-400 mt-1">Enhance your store with powerful plugins</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plugins.map((plugin) => {
          const IconComp = iconMap[plugin.icon] || Settings;
          const configured = !!plugin.storeConfig?.isConfigured;
          const href = pluginPages[plugin.slug];

          return (
            <div
              key={plugin.slug}
              className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-5 hover:border-purple-500/50 transition-colors cursor-pointer"
              onClick={() => href && router.push(href)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <IconComp className="h-6 w-6 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{plugin.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{plugin.description}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${configured ? 'bg-green-500/10 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                  {configured ? 'Configured' : 'Not configured'}
                </span>
                <span className="text-xs text-purple-400">Configure →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
