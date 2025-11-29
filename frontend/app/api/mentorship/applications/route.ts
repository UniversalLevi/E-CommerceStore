import { NextRequest, NextResponse } from 'next/server';
import connectDatabase from '@/lib/db';
import MentorshipApplication from '@/lib/models/MentorshipApplication';
import { z } from 'zod';

const applicationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email'),
  incomeGoal: z.string().optional(),
  businessStage: z.string().optional(),
  whyMentorship: z.string().min(1, 'Please explain why you want mentorship'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = applicationSchema.parse(body);

    await connectDatabase();
    const application = new MentorshipApplication(validated);
    await application.save();

    return NextResponse.json(
      { success: true, message: 'Application submitted successfully', application },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Error submitting application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

