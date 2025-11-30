import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { requireSubscription } from '@/lib/subscription';
import connectDatabase from '@/lib/db';
import ContentLibrary from '@/lib/models/ContentLibrary';
import { z } from 'zod';

const contentSchema = z.object({
  type: z.enum(['hook', 'caption', 'script', 'creative_idea', 'image']),
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  metadata: z.record(z.string(), z.any()).optional(),
  imagePath: z.string().optional(),
  source: z.enum(['ai_generated', 'trending', 'daily_ideas', 'manual']).default('manual'),
});

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    await connectDatabase();
    const query: any = { userId: user._id };
    if (type) {
      query.type = type;
    }

    const library = await ContentLibrary.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, library });
  } catch (error: any) {
    console.error('Error fetching library:', error);
    return NextResponse.json(
      { error: 'Failed to fetch library' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const validated = contentSchema.parse(body);

    await connectDatabase();
    const content = new ContentLibrary({
      ...validated,
      userId: user._id,
    });

    await content.save();

    return NextResponse.json({ success: true, content }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Error saving to library:', error);
    return NextResponse.json(
      { error: 'Failed to save to library' },
      { status: 500 }
    );
  }
}

