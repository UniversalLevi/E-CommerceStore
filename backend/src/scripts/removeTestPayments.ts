/**
 * Script to remove test/fake Razorpay payments from production
 * 
 * Usage:
 * 1. Review the payments that will be deleted (dry-run mode)
 * 2. Run with DELETE=true to actually delete them
 * 
 * Example:
 *   ts-node src/scripts/removeTestPayments.ts
 *   ts-node src/scripts/removeTestPayments.ts DELETE=true
 */

import mongoose from 'mongoose';
import { config } from '../config/env';
import { Payment } from '../models/Payment';
import { connectDatabase } from '../config/database';

async function removeTestPayments() {
  try {
    await connectDatabase();
    console.log('✅ Connected to database');

    const shouldDelete = process.argv.includes('DELETE=true');

    // OPTION 1: Delete payments before a specific date (adjust this date)
    const cutoffDate = new Date('2024-12-01'); // Change this to your cutoff date
    console.log(`\n📅 Looking for payments before: ${cutoffDate.toISOString()}`);

    // OPTION 2: Delete payments with specific statuses
    // Uncomment the line below if you want to delete only 'failed' or 'created' payments
    // const testStatuses = ['failed', 'created']; // Payments that never completed

    // OPTION 3: Delete payments with test payment IDs (Razorpay test mode)
    // Test payment IDs usually start with 'pay_' and have specific patterns
    // You can add specific test payment IDs here:
    // const testPaymentIds = ['pay_test123', 'pay_test456'];

    // Find payments to delete
    let query: any = {
      createdAt: { $lt: cutoffDate },
      // Uncomment to filter by status:
      // status: { $in: testStatuses },
    };

    // Uncomment to filter by specific payment IDs:
    // query.paymentId = { $in: testPaymentIds };

    const paymentsToDelete = await Payment.find(query).lean();

    console.log(`\n📊 Found ${paymentsToDelete.length} payments to delete:`);
    
    if (paymentsToDelete.length === 0) {
      console.log('✅ No payments found matching the criteria');
      process.exit(0);
    }

    // Show summary
    const statusCounts: Record<string, number> = {};
    let totalAmount = 0;
    
    paymentsToDelete.forEach((payment: any) => {
      statusCounts[payment.status] = (statusCounts[payment.status] || 0) + 1;
      totalAmount += payment.amount || 0;
    });

    console.log('\n📋 Summary:');
    console.log(`   Total payments: ${paymentsToDelete.length}`);
    console.log(`   Total amount: ₹${(totalAmount / 100).toLocaleString('en-IN')}`);
    console.log(`   Status breakdown:`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`     - ${status}: ${count}`);
    });

    // Show first 10 payments as preview
    console.log('\n📝 First 10 payments to be deleted:');
    paymentsToDelete.slice(0, 10).forEach((payment: any) => {
      console.log(`   - ${payment._id} | ${payment.status} | ₹${(payment.amount / 100).toFixed(2)} | ${new Date(payment.createdAt).toLocaleString()}`);
    });

    if (paymentsToDelete.length > 10) {
      console.log(`   ... and ${paymentsToDelete.length - 10} more`);
    }

    if (!shouldDelete) {
      console.log('\n⚠️  DRY RUN MODE - No payments were deleted');
      console.log('   To actually delete, run: ts-node src/scripts/removeTestPayments.ts DELETE=true');
      process.exit(0);
    }

    // Confirm deletion
    console.log('\n⚠️  WARNING: This will permanently delete these payments!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete payments
    const result = await Payment.deleteMany(query);
    
    console.log(`\n✅ Successfully deleted ${result.deletedCount} payments`);
    console.log('✅ Done!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the script
removeTestPayments();







