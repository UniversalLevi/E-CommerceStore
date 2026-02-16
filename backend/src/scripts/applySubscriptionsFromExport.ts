/**
 * Apply exported subscriptions to the database: set each user's plan to exactly
 * what is in the export (plan + days left). Users NOT in the export get plan cleared.
 *
 * Run from backend folder:
 *   npx ts-node src/scripts/applySubscriptionsFromExport.ts <path-to-export.json>
 *   npm run apply-subscriptions-export -- path/to/subscriptions-2026-02-16T02-10-49.json
 *
 * Prerequisites:
 *   - MONGODB_URI in .env
 *   - Export file from exportSubscriptions.ts (JSON format)
 *
 * Behavior:
 *   - Clears plan for ALL users not listed in the export (no one else gets a plan).
 *   - For each row in the export: sets User.plan, User.planExpiresAt, User.isLifetime
 *     and updates the Subscription endDate to match. Uses exact endDate from export
 *     (or days left) so no one gets extra days.
 *   - Rows with daysLeft "0 (expired)" get plan cleared (no active access).
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config/env';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { isValidPlanCode, PlanCode } from '../config/plans';

dotenv.config();

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

function parseEndDate(row: ExportRow): Date | null {
  const { endDate, daysLeft } = row;
  if (daysLeft === '0 (expired)' || daysLeft === 'Expired') return null;
  if (daysLeft === 'Lifetime' || daysLeft === '—') return null;
  if (endDate && endDate.trim() !== '') {
    const parsed = new Date(endDate);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  const days = parseInt(daysLeft, 10);
  if (!isNaN(days) && days > 0) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  return null;
}

function isExpired(row: ExportRow): boolean {
  return row.daysLeft === '0 (expired)' || row.daysLeft.startsWith('0 ');
}

async function run() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: npx ts-node src/scripts/applySubscriptionsFromExport.ts <path-to-export.json>');
    process.exit(1);
  }

  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error('File not found:', resolvedPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(resolvedPath, 'utf8');
  let rows: ExportRow[];
  try {
    rows = JSON.parse(raw);
  } catch (e) {
    console.error('Invalid JSON in export file.');
    process.exit(1);
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    console.error('Export file has no rows.');
    process.exit(1);
  }

  await mongoose.connect(config.mongoUri);

  try {
    const userIdsInExport = rows.map((r) => r.userId);
    const validUserIds = userIdsInExport.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const uniqueUserIds = [...new Set(validUserIds)];

    // 1. Clear plan for everyone NOT in the export (no one else gets a plan)
    const clearResult = await User.updateMany(
      { _id: { $nin: uniqueUserIds.map((id) => new mongoose.Types.ObjectId(id)) } },
      { $set: { plan: null, planExpiresAt: null, isLifetime: false } }
    );
    console.log(`Cleared plan for ${clearResult.modifiedCount} user(s) not in export.`);

    const now = new Date();
    let updatedUsers = 0;
    let updatedSubscriptions = 0;
    let clearedExpired = 0;
    let skipped = 0;

    for (const row of rows) {
      if (!mongoose.Types.ObjectId.isValid(row.userId)) {
        skipped++;
        continue;
      }

      const userId = new mongoose.Types.ObjectId(row.userId);
      const subscriptionId = mongoose.Types.ObjectId.isValid(row.subscriptionId)
        ? new mongoose.Types.ObjectId(row.subscriptionId)
        : null;

      if (isExpired(row)) {
        await User.updateOne(
          { _id: userId },
          { $set: { plan: null, planExpiresAt: null, isLifetime: false } }
        );
        if (subscriptionId) {
          await Subscription.updateOne(
            { _id: subscriptionId },
            { $set: { status: 'expired', endDate: now } }
          );
        }
        clearedExpired++;
        updatedUsers++;
        continue;
      }

      const endDate = parseEndDate(row);
      const planCode = row.planCode;
      if (!isValidPlanCode(planCode)) {
        skipped++;
        continue;
      }

      const planExpiresAt = endDate; // null for Lifetime / — / no endDate in export
      const isLifetime = planCode === 'lifetime';

      const userUpdate = await User.updateOne(
        { _id: userId },
        {
          $set: {
            plan: planCode as PlanCode,
            planExpiresAt,
            isLifetime,
          },
        }
      );

      if (subscriptionId && (userUpdate.modifiedCount || userUpdate.matchedCount)) {
        const subUpdate = await Subscription.updateOne(
          { _id: subscriptionId },
          {
            $set: {
              endDate: planExpiresAt,
              status: row.status === 'active' ? 'active' : 'manually_granted',
            },
          }
        );
        if (subUpdate.modifiedCount) updatedSubscriptions++;
      }

      if (userUpdate.modifiedCount) updatedUsers++;
    }

    console.log(`Updated ${updatedUsers} user(s) from export.`);
    console.log(`Cleared ${clearedExpired} expired subscription(s).`);
    console.log(`Updated ${updatedSubscriptions} subscription endDate(s).`);
    if (skipped > 0) console.log(`Skipped ${skipped} row(s).`);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
