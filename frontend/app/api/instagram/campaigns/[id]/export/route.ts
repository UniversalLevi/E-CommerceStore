import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import connectDatabase from '@/lib/db';
import Campaign from '@/lib/models/Campaign';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDatabase();
    const campaign = await Campaign.findOne({
      _id: params.id,
      userId: user._id,
      platform: 'instagram',
    }).lean();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Return campaign data as JSON for download
    return NextResponse.json(
      {
        success: true,
        data: campaign,
        filename: `instagram-campaign-${params.id}.json`,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="instagram-campaign-${params.id}.json"`,
        },
      }
    );
  } catch (error: any) {
    console.error('Error exporting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to export campaign' },
      { status: 500 }
    );
  }
}

