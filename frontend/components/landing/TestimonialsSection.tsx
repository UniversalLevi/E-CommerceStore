'use client';

import { Star } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  text: string;
  rating: number;
  gradient: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Sarah Chen',
    role: 'E-commerce Entrepreneur',
    text: 'Set up my store in 5 minutes. The product catalog is amazing and everything just works!',
    rating: 5,
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    name: 'Michael Rodriguez',
    role: 'Dropshipping Expert',
    text: 'Best investment I\'ve made. Multiple stores, zero hassle. The automation is incredible.',
    rating: 5,
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    name: 'Emma Thompson',
    role: 'Small Business Owner',
    text: 'No technical skills needed. I had a professional store running the same day I signed up.',
    rating: 5,
    gradient: 'from-teal-500 to-teal-600',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-black via-[#0D0D0D] to-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
            <span className="text-gradient-pink">Loved by Store Owners</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            See what our users are saying
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="glass-card glass-card-hover rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 animate-fadeInUp"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Rating Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              {/* Quote */}
              <p className="text-text-secondary/90 mb-6 leading-relaxed italic">
                "{testimonial.text}"
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-lg`}>
                  {testimonial.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-text-primary">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-text-secondary/70">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

