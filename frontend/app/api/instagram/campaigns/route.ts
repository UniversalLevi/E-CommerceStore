import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import connectDatabase from '@/lib/db';
import Campaign from '@/lib/models/Campaign';
import { z } from 'zod';

const campaignSchema = z.object({
  platform: z.literal('instagram'),
  campaignGoal: z.string().optional(),
  dailyBudget: z.number().optional(),
  country: z.string().optional(),
  ageRange: z
    .object({
      min: z.number(),
      max: z.number(),
    })
    .optional(),
  gender: z.string().optional(),
  productName: z.string().optional(),
  interests: z.array(z.string()).optional(),
  creative: z
    .object({
      imageUrl: z.string().optional(),
      videoUrl: z.string().optional(),
      imagePath: z.string().optional(),
      videoPath: z.string().optional(),
    })
    .optional(),
  captions: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
  ctaRecommendations: z.array(z.string()).optional(),
  targeting: z.record(z.string(), z.any()).optional(),
  performancePredictions: z.record(z.string(), z.any()).optional(),
  exportData: z.record(z.string(), z.any()).optional(),
  status: z.enum(['draft', 'saved']).default('draft'),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDatabase();
    const campaigns = await Campaign.find({
      userId: user._id,
      platform: 'instagram',
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, campaigns });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
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

    const body = await req.json();
    const validated = campaignSchema.parse(body);

    await connectDatabase();
    const campaign = new Campaign({
      ...validated,
      userId: user._id,
    });

    await campaign.save();

    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Error saving campaign:', error);
    return NextResponse.json(
      { error: 'Failed to save campaign' },
      { status: 500 }
    );
  }
}

