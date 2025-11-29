import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { generateTrendingContent, checkRateLimit } from '@/lib/ai';
import { z } from 'zod';

const schema = z.object({
  niche: z.string().min(1, 'Niche is required'),
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
    const { niche } = schema.parse(body);

    const content = await generateTrendingContent(niche);

    return NextResponse.json({ success: true, content });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Error generating trending content:', error);
    return NextResponse.json(
      { error: 'Failed to generate trending content' },
      { status: 500 }
    );
  }
}

