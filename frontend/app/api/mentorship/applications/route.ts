import { NextRequest, NextResponse } from 'next/server';
import connectDatabase from '@/lib/db';
import MentorshipApplication from '@/lib/models/MentorshipApplication';
import User from '@/lib/models/User';
import Notification from '@/lib/models/Notification';
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

    // Notify all admin users
    try {
      const admins = await User.find({ role: 'admin' }).select('_id').lean();
      const notifications = admins.map((admin) => ({
        userId: admin._id,
        type: 'mentorship_application' as const,
        title: 'New Mentorship Application',
        message: `${validated.name} (${validated.email}) submitted a mentorship application`,
        link: `/admin/mentorship/applications/${application._id}`,
        metadata: {
          applicationId: application._id.toString(),
          applicantName: validated.name,
          applicantEmail: validated.email,
        },
        read: false,
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notificationError) {
      // Log but don't fail the request if notifications fail
      console.error('Failed to create notifications:', notificationError);
    }

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

