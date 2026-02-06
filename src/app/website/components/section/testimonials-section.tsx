import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { testimonials } from '../../data/testimonials';
import { BRANDING_CONFIG } from '../../config/brand.config';

export function TestimonialsSection() {
  return (
    <section className="py-16">
      <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">What Our Customers Say</h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Don't just take our word for it. Here's what our customers have to say about {BRANDING_CONFIG.name}.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="border-0 shadow-lg bg-card">
              <CardContent className="p-5">
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-5 italic text-sm">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center mr-3">
                    <span className="text-muted-foreground font-semibold text-sm">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </section>
  );
}
