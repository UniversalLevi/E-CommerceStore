import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { requireSubscription } from '@/lib/subscription';
import { generateHashtags, checkRateLimit } from '@/lib/ai';
import { z } from 'zod';

const schema = z.object({
  productName: z.string().min(1, 'Product name is required'),
});

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

    if (!checkRateLimit(user._id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { productName } = schema.parse(body);

    const hashtags = await generateHashtags(productName, 'facebook');

    return NextResponse.json({ success: true, hashtags });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Error generating hashtags:', error);
    return NextResponse.json(
      { error: 'Failed to generate hashtags' },
      { status: 500 }
    );
  }
}

