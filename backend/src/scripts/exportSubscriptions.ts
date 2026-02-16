/**
 * Export all subscriptions (same data as /admin/subscriptions) to CSV and JSON.
 * Includes: user email, plan, status, start/end dates, duration left, amount, source, etc.
 *
 * Run from backend folder:
 *   npx ts-node src/scripts/exportSubscriptions.ts
 *   npm run export-subscriptions
 *
 * Options (env or args): none required. Uses MONGODB_URI from .env.
 *   --all-statuses   Include cancelled/expired/pending (default: active, trialing, manually_granted)
 *   --every-record   Export every subscription record; default is one per user (latest only).
 * Output: backend/exports/subscriptions-<timestamp>.csv and .json
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config/env';
import { Subscription } from '../models/Subscription';
import { plans, PlanCode } from '../config/plans';

dotenv.config();

const EXPORTS_DIR = path.join(__dirname, '../../exports');

interface ExportRow {
  subscriptionId: string;
  userId: string;
  userEmail: string;
  planCode: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string;
  daysLeft: string;
  amountPaidPaise: number;
  amountRupees: string;
  source: string;
  razorpaySubscriptionId: string;
  razorpayPaymentId: string;
  trialEndsAt: string;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  return date.toISOString();
}

function daysLeft(endDate: Date | null | undefined, planCode: string): string {
  if (!endDate) return planCode === 'lifetime' ? 'Lifetime' : '—';
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  const now = new Date();
  if (end <= now) return '0 (expired)';
  const ms = end.getTime() - now.getTime();
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  return String(days);
}

function escapeCsvCell(value: string): string {
  const s = String(value ?? '');
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function run() {
  const statusFilter = process.argv.includes('--all-statuses')
    ? {}
    : { status: { $in: ['active', 'trialing', 'manually_granted'] } };

  const onePerUser = !process.argv.includes('--every-record');

  await mongoose.connect(config.mongoUri);

  try {
    if (!fs.existsSync(EXPORTS_DIR)) {
      fs.mkdirSync(EXPORTS_DIR, { recursive: true });
    }

    const filter = { ...statusFilter };

    const aggregationPipeline: any[] = [
      { $match: filter },
      { $sort: { createdAt: -1 } },
    ];

    if (onePerUser) {
      aggregationPipeline.push(
        {
          $group: {
            _id: '$userId',
            subscription: { $first: '$$ROOT' },
          },
        },
        { $replaceRoot: { newRoot: '$subscription' } },
        { $sort: { createdAt: -1 } }
      );
    }

    aggregationPipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
    );

    const subscriptions = await Subscription.aggregate(aggregationPipeline);

    const rows: ExportRow[] = subscriptions.map((sub: any) => {
      const endDate = sub.endDate ? (sub.endDate instanceof Date ? sub.endDate : new Date(sub.endDate)) : null;
      const amountPaid = Number(sub.amountPaid) || 0;
      return {
        subscriptionId: sub._id?.toString() || '',
        userId: sub.userId?.toString?.() ?? String(sub.userId),
        userEmail: sub.user?.email ?? 'Unknown',
        planCode: sub.planCode ?? '',
        planName: plans[sub.planCode as PlanCode]?.name ?? sub.planCode,
        status: sub.status ?? '',
        startDate: formatDate(sub.startDate),
        endDate: formatDate(sub.endDate),
        daysLeft: daysLeft(sub.endDate, sub.planCode),
        amountPaidPaise: amountPaid,
        amountRupees: (amountPaid / 100).toFixed(2),
        source: sub.source ?? '',
        razorpaySubscriptionId: sub.razorpaySubscriptionId ?? '',
        razorpayPaymentId: sub.razorpayPaymentId ?? '',
        trialEndsAt: formatDate(sub.trialEndsAt),
        adminNote: sub.adminNote ?? '',
        createdAt: formatDate(sub.createdAt),
        updatedAt: formatDate(sub.updatedAt),
      };
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const baseName = `subscriptions-${timestamp}`;
    const csvPath = path.join(EXPORTS_DIR, `${baseName}.csv`);
    const jsonPath = path.join(EXPORTS_DIR, `${baseName}.json`);

    const headers = Object.keys(rows[0] || {}) as (keyof ExportRow)[];
    const csvLines = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((r) => headers.map((h) => escapeCsvCell(String(r[h] ?? ''))).join(',')),
    ];
    fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');

    fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2), 'utf8');

    console.log(`Exported ${rows.length} subscription(s).`);
    console.log(`  CSV:  ${csvPath}`);
    console.log(`  JSON: ${jsonPath}`);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
