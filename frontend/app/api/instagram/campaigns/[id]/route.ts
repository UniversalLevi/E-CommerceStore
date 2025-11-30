import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { requireSubscription } from '@/lib/subscription';
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

    // Check subscription
    const subscriptionError = await requireSubscription(user._id);
    if (subscriptionError) {
      return NextResponse.json({ error: subscriptionError.error }, { status: subscriptionError.status });
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

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    await connectDatabase();
    const campaign = await Campaign.findOneAndUpdate(
      {
        _id: params.id,
        userId: user._id,
        platform: 'instagram',
      },
      body,
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription
    const subscriptionError = await requireSubscription(user._id);
    if (subscriptionError) {
      return NextResponse.json({ error: subscriptionError.error }, { status: subscriptionError.status });
    }

    await connectDatabase();
    const campaign = await Campaign.findOneAndDelete({
      _id: params.id,
      userId: user._id,
      platform: 'instagram',
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Campaign deleted' });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}

