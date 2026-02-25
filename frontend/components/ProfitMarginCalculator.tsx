'use client';

import { useState } from 'react';

const initialValues = {
  wholesalePrice: '',
  customerPurchasePrice: '',
  advertisingSpent: '',
  shippingCost: '',
  miscFees: '',
};

export default function ProfitMarginCalculator() {
  const [values, setValues] = useState(initialValues);
  const [profit, setProfit] = useState<number | null>(null);
  const [profitMargin, setProfitMargin] = useState<number | null>(null);

  const parseNum = (s: string): number => {
    const n = parseFloat(String(s).replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : 0;
  };

  const handleCalculate = () => {
    const wholesale = parseNum(values.wholesalePrice);
    const purchase = parseNum(values.customerPurchasePrice);
    const advertising = parseNum(values.advertisingSpent);
    const shipping = parseNum(values.shippingCost);
    const misc = parseNum(values.miscFees);

    const profitAmount = purchase - wholesale - advertising - shipping - misc;
    setProfit(profitAmount);

    if (purchase === 0) {
      setProfitMargin(null);
    } else {
      setProfitMargin((profitAmount / purchase) * 100);
    }
  };

  const handleReset = () => {
    setValues(initialValues);
    setProfit(null);
    setProfitMargin(null);
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);
  const formatPercent = (n: number) => `${n.toFixed(2)}%`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
      {/* Left: Inputs */}
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Wholesale price</label>
          <input
            type="text"
            inputMode="decimal"
            value={values.wholesalePrice}
            onChange={(e) => setValues((v) => ({ ...v, wholesalePrice: e.target.value }))}
            className="w-full px-4 py-3 bg-surface-raised border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Customer purchase price</label>
          <input
            type="text"
            inputMode="decimal"
            value={values.customerPurchasePrice}
            onChange={(e) => setValues((v) => ({ ...v, customerPurchasePrice: e.target.value }))}
            className="w-full px-4 py-3 bg-surface-raised border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Advertising spent</label>
          <input
            type="text"
            inputMode="decimal"
            value={values.advertisingSpent}
            onChange={(e) => setValues((v) => ({ ...v, advertisingSpent: e.target.value }))}
            className="w-full px-4 py-3 bg-surface-raised border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Shipping cost</label>
          <input
            type="text"
            inputMode="decimal"
            value={values.shippingCost}
            onChange={(e) => setValues((v) => ({ ...v, shippingCost: e.target.value }))}
            className="w-full px-4 py-3 bg-surface-raised border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Misc fees</label>
          <input
            type="text"
            inputMode="decimal"
            value={values.miscFees}
            onChange={(e) => setValues((v) => ({ ...v, miscFees: e.target.value }))}
            className="w-full px-4 py-3 bg-surface-raised border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="0"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleCalculate}
            className="px-5 py-2.5 bg-primary-500 text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Calculate
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-5 py-2.5 bg-surface-raised border border-border-default text-text-primary font-medium rounded-lg hover:bg-surface-hover transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Right: Results */}
      <div className="border-2 border-border-default rounded-xl bg-surface-raised p-6">
        <h2 className="text-xl font-bold text-text-primary mb-6">Profit margin Results</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Your profit:</label>
            <div className="w-full px-4 py-3 bg-surface-elevated border border-border-default text-text-primary rounded-lg min-h-[48px] flex items-center">
              {profit !== null ? formatCurrency(profit) : '—'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Profit margin:</label>
            <div className="w-full px-4 py-3 bg-surface-elevated border border-border-default text-text-primary rounded-lg min-h-[48px] flex items-center">
              {profitMargin !== null ? formatPercent(profitMargin) : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
