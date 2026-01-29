export const services = {
  ads_management: {
    name: 'Ads Management Services',
    description: 'Performance-driven ad management with transparent pricing and shared growth incentives.',
    plans: {
      monthly: {
        name: 'Monthly Plan',
        basePrice: 500000, // ₹5,000 in paise
        commissionRate: 10, // 10% of ad budget
        durationDays: 30,
      },
      quarterly: {
        name: 'Quarterly Plan',
        basePrice: 1000000, // ₹10,000 in paise
        commissionRate: 8, // 8% of ad budget
        durationDays: 90,
      },
      lifetime: {
        name: 'Lifetime Plan',
        basePrice: 2000000, // ₹20,000 in paise
        commissionRate: 5, // 5% of ad budget
        durationDays: null, // null = lifetime
      },
    },
    features: [
      'Ad account setup & structure',
      'Audience research',
      'Creative strategy guidance',
      'Budget optimization',
      'Weekly performance reviews',
      'ROAS & conversion tracking',
    ],
  },
  connect_experts: {
    name: 'Connect with Experts',
    description: 'Direct access to industry experts focused on achieving real sales milestones.',
    plans: {
      monthly: {
        name: 'Monthly Expert Connect',
        price: 1300000, // ₹13,000 in paise
        targetGoal: 10000000, // ₹1,00,000 in paise
        durationDays: 30,
      },
      quarterly: {
        name: 'Quarterly Expert Connect',
        price: 1900000, // ₹19,000 in paise
        targetGoal: 60000000, // ₹6,00,000 in paise
        durationDays: 90,
      },
      yearly: {
        name: 'Yearly Expert Connect',
        price: 5000000, // ₹50,000 in paise
        targetGoal: 200000000, // ₹20,00,000 in paise
        durationDays: 365,
      },
    },
    features: [
      'Scheduled expert calls',
      'Business audits',
      'Custom growth roadmap',
      'Performance checkpoints',
      'Priority support access',
    ],
    disclaimer: 'Sales targets are benchmarks, not guarantees. Results depend on execution, market conditions, and ad spend.',
  },
} as const;

export type ServiceCode = keyof typeof services;
export type PlanCode = 'monthly' | 'quarterly' | 'yearly' | 'lifetime';

export function getService(serviceCode: string) {
  return services[serviceCode as ServiceCode] || null;
}

export function isValidServiceCode(serviceCode: string): serviceCode is ServiceCode {
  return serviceCode in services;
}

export function getPlan(serviceCode: ServiceCode, planCode: PlanCode) {
  const service = services[serviceCode];
  if (!service) return null;
  
  if (serviceCode === 'ads_management') {
    return (service.plans as any)[planCode] || null;
  } else if (serviceCode === 'connect_experts') {
    return (service.plans as any)[planCode] || null;
  }
  
  return null;
}
