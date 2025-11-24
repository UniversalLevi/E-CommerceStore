'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/stores', label: 'Stores', icon: '🏪' },
  { href: '/admin/niches', label: 'Niches', icon: '📂' },
  { href: '/admin/products', label: 'Products', icon: '📦' },
  { href: '/admin/audit', label: 'Audit Logs', icon: '📋' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-[#1a1a1a] border-r border-[#505050] h-screen fixed left-0 top-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-[#505050]">
        <Link 
          href="/admin/dashboard" 
          className="text-xl font-bold text-white hover:text-[#e0e0e0] transition-colors"
        >
          Admin Panel
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-white text-black'
                  : 'text-[#a0a0a0] hover:bg-[#2a2a2a] hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Back to Dashboard */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#505050] bg-[#1a1a1a]">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#a0a0a0] hover:bg-[#2a2a2a] hover:text-white transition-colors"
        >
          <span className="text-xl">←</span>
          <span className="font-medium">Back to Dashboard</span>
        </Link>
      </div>
    </aside>
  );
}

