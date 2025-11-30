import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { requireSubscription } from '@/lib/subscription';
import connectDatabase from '@/lib/db';
import ContentLibrary from '@/lib/models/ContentLibrary';

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
    const content = await ContentLibrary.findOneAndDelete({
      _id: params.id,
      userId: user._id,
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Content deleted' });
  } catch (error: any) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}

