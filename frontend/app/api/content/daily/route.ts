import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { requireSubscription } from '@/lib/subscription';
import connectDatabase from '@/lib/db';
import ContentLibrary from '@/lib/models/ContentLibrary';
import { generateDailyIdeas, checkRateLimit } from '@/lib/ai';

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

    await connectDatabase();

    // Check for cached daily ideas from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const cached = await ContentLibrary.findOne({
      userId: user._id,
      type: 'hook',
      source: 'daily_ideas',
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    }).lean();

    if (cached) {
      // Fetch all daily ideas from today
      const dailyIdeas = await ContentLibrary.find({
        userId: user._id,
        source: 'daily_ideas',
        createdAt: {
          $gte: today,
          $lt: tomorrow,
        },
      }).lean();

      const organized = {
        reelIdeas: dailyIdeas.filter((c) => c.metadata?.category === 'reel').map((c) => c.content),
        photoIdeas: dailyIdeas.filter((c) => c.metadata?.category === 'photo').map((c) => c.content),
        hooks: dailyIdeas.filter((c) => c.type === 'hook').map((c) => c.content),
        captions: dailyIdeas.filter((c) => c.type === 'caption').map((c) => c.content),
        trendingAudios: dailyIdeas.filter((c) => c.metadata?.category === 'audio').map((c) => c.content),
        cachedAt: cached.createdAt,
      };

      return NextResponse.json({ success: true, ideas: organized, cached: true });
    }

    // Generate new daily ideas
    if (!checkRateLimit(user._id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const ideas = await generateDailyIdeas();

    // Save to library
    const contentItems = [
      ...ideas.reelIdeas.map((idea) => ({
        userId: user._id,
        type: 'hook' as const,
        content: idea,
        source: 'daily_ideas' as const,
        metadata: { category: 'reel' },
      })),
      ...ideas.photoIdeas.map((idea) => ({
        userId: user._id,
        type: 'hook' as const,
        content: idea,
        source: 'daily_ideas' as const,
        metadata: { category: 'photo' },
      })),
      ...ideas.hooks.map((hook) => ({
        userId: user._id,
        type: 'hook' as const,
        content: hook,
        source: 'daily_ideas' as const,
      })),
      ...ideas.captions.map((caption) => ({
        userId: user._id,
        type: 'caption' as const,
        content: caption,
        source: 'daily_ideas' as const,
      })),
      ...ideas.trendingAudios.map((audio) => ({
        userId: user._id,
        type: 'script' as const,
        content: audio,
        source: 'daily_ideas' as const,
        metadata: { category: 'audio' },
      })),
    ];

    await ContentLibrary.insertMany(contentItems);

    return NextResponse.json({
      success: true,
      ideas: {
        ...ideas,
        cachedAt: new Date(),
      },
      cached: false,
    });
  } catch (error: any) {
    console.error('Error fetching daily ideas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily ideas' },
      { status: 500 }
    );
  }
}

