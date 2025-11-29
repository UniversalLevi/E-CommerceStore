import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { generateInterests, checkRateLimit } from '@/lib/ai';
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

    if (!checkRateLimit(user._id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { productName } = schema.parse(body);

    const interests = await generateInterests(productName);

    return NextResponse.json({ success: true, interests });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Error generating interests:', error);
    return NextResponse.json(
      { error: 'Failed to generate interests' },
      { status: 500 }
    );
  }
}

