import { NextRequest, NextResponse } from 'next/server';
import connectDatabase from '@/lib/db';
import MentorshipApplication from '@/lib/models/MentorshipApplication';
import mongoose from 'mongoose';
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
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const validated = applicationSchema.parse(body);

    await connectDatabase();
    
    const application = new MentorshipApplication(validated);
    await application.save();

    // Notify all admin users using raw MongoDB query to avoid model conflicts
    try {
      const db = mongoose.connection.db;
      if (db) {
        const admins = await db.collection('users').find({ role: 'admin' }).project({ _id: 1 }).toArray();
        
        if (admins.length > 0) {
          const notifications = admins.map((admin) => ({
            userId: admin._id,
            type: 'mentorship_application',
            title: 'New Mentorship Application',
            message: `${validated.name} (${validated.email}) submitted a mentorship application`,
            link: `/admin/mentorship/applications/${application._id}`,
            metadata: {
              applicationId: application._id.toString(),
              applicantName: validated.name,
              applicantEmail: validated.email,
            },
            read: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          await db.collection('notifications').insertMany(notifications);
        }
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
      { error: error.message || 'Failed to submit application' },
      { status: 500 }
    );
  }
}

