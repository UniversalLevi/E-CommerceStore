import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import connectDatabase from '@/lib/db';
import MentorshipApplication from '@/lib/models/MentorshipApplication';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    await connectDatabase();
    const query: any = {};
    if (status) {
      query.status = status;
    }

    let applicationsQuery = MentorshipApplication.find(query)
      .sort({ createdAt: -1 });

    if (limit) {
      applicationsQuery = applicationsQuery.limit(parseInt(limit, 10));
    }

    const applications = await applicationsQuery.lean();

    return NextResponse.json({ success: true, applications });
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

