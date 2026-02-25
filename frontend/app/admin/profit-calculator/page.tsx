'use client';

import ProfitMarginCalculator from '@/components/ProfitMarginCalculator';

export default function AdminProfitCalculatorPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Profit Margin Calculator</h1>
        <p className="text-text-secondary">
          Enter your product costs and selling price to see your profit and profit margin.
        </p>
      </div>
      <ProfitMarginCalculator />
    </div>
  );
}
