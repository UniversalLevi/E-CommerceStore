'use client';

import Link from 'next/link';
import { Twitter, Github, MessageCircle } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto bg-black">
      {/* Gradient Top Border */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500 via-blue-500 to-transparent"></div>
      
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link 
              href="/" 
              className="text-xl font-bold text-white hover:text-white/80 transition-colors mb-4 inline-block"
            >
              Auto Shopify Store Builder
            </Link>
            <p className="text-text-secondary text-sm mb-6 max-w-md">
              Launch your Shopify store in minutes. Browse products, connect your Shopify account,
              and get a fully functional store automatically.
            </p>
            
            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-text-secondary hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-text-secondary hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-text-secondary hover:text-white transition-colors"
                aria-label="Discord"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/products" className="text-text-secondary hover:text-white transition-colors text-sm">
                  Browse Products
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-text-secondary hover:text-white transition-colors text-sm">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-text-secondary hover:text-white transition-colors text-sm">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-text-secondary hover:text-white transition-colors text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-text-secondary hover:text-white transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-text-secondary hover:text-white transition-colors text-sm">
                  About
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal */}
        <div className="mb-8">
          <h3 className="text-white font-semibold mb-4">Legal</h3>
          <ul className="flex flex-wrap gap-6">
            <li>
              <Link href="/privacy" className="text-text-secondary hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-text-secondary hover:text-white transition-colors text-sm">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/refund" className="text-text-secondary hover:text-white transition-colors text-sm">
                Refund Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-secondary text-sm">
            © {currentYear} Auto Shopify Store Builder. All rights reserved.
          </p>
          <p className="text-text-secondary text-sm flex items-center gap-2">
            Built with <span className="text-red-400">❤️</span> in India
          </p>
        </div>
      </div>
    </footer>
  );
}

