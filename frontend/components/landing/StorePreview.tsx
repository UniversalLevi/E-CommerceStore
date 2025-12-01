'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  DollarSign,
  Package,
  Eye,
  Heart,
  ShoppingCart,
  Star,
  ArrowUpRight,
  Bell,
  Search,
  Menu
} from 'lucide-react';

const mockProducts = [
  { name: 'Premium Wireless Earbuds', price: '₹2,499', sales: 156, rating: 4.8, image: 'from-purple-500/30 to-blue-500/30' },
  { name: 'Smart Fitness Watch', price: '₹3,999', sales: 89, rating: 4.9, image: 'from-blue-500/30 to-teal-500/30' },
  { name: 'Portable Power Bank', price: '₹1,299', sales: 234, rating: 4.7, image: 'from-teal-500/30 to-purple-500/30' },
  { name: 'LED Desk Lamp', price: '₹899', sales: 178, rating: 4.6, image: 'from-pink-500/30 to-purple-500/30' },
];

const recentOrders = [
  { id: '#1234', customer: 'Rahul S.', amount: '₹2,499', status: 'Completed', time: '2 min ago' },
  { id: '#1233', customer: 'Priya M.', amount: '₹5,498', status: 'Processing', time: '5 min ago' },
  { id: '#1232', customer: 'Amit K.', amount: '₹1,299', status: 'Shipped', time: '12 min ago' },
];

const notifications = [
  { type: 'order', message: 'New order received!', time: 'Just now' },
  { type: 'review', message: '5-star review on Earbuds', time: '3 min ago' },
  { type: 'milestone', message: '100 orders milestone!', time: '1 hour ago' },
];

export default function StorePreview() {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders'>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <section 
      ref={containerRef}
      className="py-24 md:py-32 bg-black relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-mesh opacity-50" />
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span 
            className="inline-block px-4 py-1.5 rounded-full glass-card text-sm text-purple-400 mb-4"
            whileHover={{ scale: 1.05 }}
          >
            Live Preview
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-gradient-purple">See It In Action</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Experience the power of your future dashboard. 
            Real-time analytics, order management, and more — all at your fingertips.
          </p>
        </motion.div>

        {/* Interactive Dashboard Preview */}
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="relative"
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {/* Main Dashboard Container */}
            <div className="glass-card rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
                <div className="flex gap-2">
                  <motion.div className="w-3 h-3 rounded-full bg-red-500/80" whileHover={{ scale: 1.2 }} />
                  <motion.div className="w-3 h-3 rounded-full bg-yellow-500/80" whileHover={{ scale: 1.2 }} />
                  <motion.div className="w-3 h-3 rounded-full bg-green-500/80" whileHover={{ scale: 1.2 }} />
                </div>
                <div className="flex-1 mx-4">
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-lg max-w-md">
                    <Search className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-muted">dashboard.yourstore.com</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={() => setShowNotifications(!showNotifications)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Bell className="w-5 h-5 text-text-secondary" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  </motion.button>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="flex">
                {/* Sidebar */}
                <div className="hidden md:flex flex-col w-16 bg-white/5 border-r border-white/10 py-4">
                  {[
                    { icon: Menu, tab: 'dashboard' as const },
                    { icon: Package, tab: 'products' as const },
                    { icon: ShoppingCart, tab: 'orders' as const },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.tab}
                        className={`p-3 mx-2 rounded-lg transition-colors ${
                          activeTab === item.tab ? 'bg-purple-500/20 text-purple-400' : 'text-text-muted hover:bg-white/10'
                        }`}
                        onClick={() => setActiveTab(item.tab)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Icon className="w-5 h-5" />
                      </motion.button>
                    );
                  })}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-6">
                  <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && (
                      <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          {[
                            { icon: DollarSign, label: 'Revenue', value: '₹1,45,231', change: '+12.5%', color: 'text-green-400' },
                            { icon: ShoppingBag, label: 'Orders', value: '156', change: '+8.2%', color: 'text-blue-400' },
                            { icon: Users, label: 'Customers', value: '1,234', change: '+15.3%', color: 'text-purple-400' },
                            { icon: Eye, label: 'Visitors', value: '5,678', change: '+22.1%', color: 'text-teal-400' },
                          ].map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                              <motion.div
                                key={stat.label}
                                className="glass-card rounded-xl p-4 border border-white/10"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                                whileHover={{ scale: 1.02, borderColor: 'rgba(124, 58, 237, 0.3)' }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <Icon className={`w-5 h-5 ${stat.color}`} />
                                  <span className={`text-xs ${stat.color}`}>{stat.change}</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{stat.value}</div>
                                <div className="text-xs text-text-muted">{stat.label}</div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Chart Area */}
                        <div className="glass-card rounded-xl p-4 border border-white/10 mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-white">Revenue Overview</h4>
                            <span className="text-xs text-text-muted">Last 7 days</span>
                          </div>
                          <div className="flex items-end gap-2 h-32">
                            {[40, 65, 45, 80, 55, 90, 75].map((height, i) => (
                              <motion.div
                                key={i}
                                className="flex-1 bg-gradient-to-t from-purple-500/50 to-blue-500/50 rounded-t"
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                              />
                            ))}
                          </div>
                          <div className="flex justify-between mt-2">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                              <span key={day} className="text-xs text-text-muted">{day}</span>
                            ))}
                          </div>
                        </div>

                        {/* Recent Orders */}
                        <div className="glass-card rounded-xl p-4 border border-white/10">
                          <h4 className="font-semibold text-white mb-4">Recent Orders</h4>
                          <div className="space-y-3">
                            {recentOrders.map((order, index) => (
                              <motion.div
                                key={order.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + index * 0.1 }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold">
                                    {order.customer[0]}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-white">{order.customer}</div>
                                    <div className="text-xs text-text-muted">{order.id} • {order.time}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-white">{order.amount}</div>
                                  <div className={`text-xs ${
                                    order.status === 'Completed' ? 'text-green-400' :
                                    order.status === 'Processing' ? 'text-yellow-400' : 'text-blue-400'
                                  }`}>{order.status}</div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'products' && (
                      <motion.div
                        key="products"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="font-semibold text-white">Your Products</h4>
                          <motion.button
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-sm font-medium"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            + Add Product
                          </motion.button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {mockProducts.map((product, index) => (
                            <motion.div
                              key={product.name}
                              className="glass-card rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/30 transition-all"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ y: -4 }}
                            >
                              <div className={`h-24 bg-gradient-to-br ${product.image}`} />
                              <div className="p-3">
                                <h5 className="text-sm font-medium text-white truncate">{product.name}</h5>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-purple-400 font-semibold">{product.price}</span>
                                  <div className="flex items-center gap-1 text-xs text-text-muted">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    {product.rating}
                                  </div>
                                </div>
                                <div className="text-xs text-text-muted mt-1">{product.sales} sold</div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'orders' && (
                      <motion.div
                        key="orders"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h4 className="font-semibold text-white mb-6">Order Management</h4>
                        <div className="space-y-3">
                          {[...recentOrders, ...recentOrders].slice(0, 5).map((order, index) => (
                            <motion.div
                              key={`${order.id}-${index}`}
                              className="flex items-center justify-between p-4 glass-card rounded-xl border border-white/10"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ borderColor: 'rgba(124, 58, 237, 0.3)' }}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold">
                                  {order.customer[0]}
                                </div>
                                <div>
                                  <div className="font-medium text-white">{order.customer}</div>
                                  <div className="text-sm text-text-muted">{order.id}</div>
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-white">{order.amount}</div>
                                <div className="text-xs text-text-muted">{order.time}</div>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                                order.status === 'Processing' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {order.status}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Floating Notification Panel */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  className="absolute top-16 right-4 w-72 glass-card rounded-xl p-4 shadow-xl border border-white/10 z-20"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                >
                  <h4 className="font-semibold text-white mb-3">Notifications</h4>
                  <div className="space-y-2">
                    {notifications.map((notif, index) => (
                      <motion.div
                        key={index}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="text-sm text-white">{notif.message}</div>
                        <div className="text-xs text-text-muted">{notif.time}</div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Stats Cards */}
            <motion.div
              className="absolute -right-4 md:-right-8 top-1/4 glass-card rounded-xl p-4 shadow-xl"
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 1, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Sales Up!</p>
                  <p className="text-xs text-green-400">+24% this week</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -left-4 md:-left-8 bottom-1/4 glass-card rounded-xl p-4 shadow-xl"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 1.2, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">New Review</p>
                  <p className="text-xs text-yellow-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400" /> 5.0 rating
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur-2xl opacity-20 -z-10 animate-pulse-glow" />
          </motion.div>
        </div>

        {/* Interactive Hint */}
        <motion.p
          className="text-center text-text-muted text-sm mt-8"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.5 }}
        >
          <span className="inline-flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4" />
            Click on the sidebar icons to explore different views
          </span>
        </motion.p>
      </div>
    </section>
  );
}
