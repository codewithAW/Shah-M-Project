import { Link } from 'react-router-dom';
import { ArrowRight, Video, FileText, CheckCircle, Award, BookOpen, GraduationCap } from 'lucide-react';
import { GlassButton } from '../../components/ui/GlassButton';
import { CourseCard } from '../../components/ui/CourseCard';
import { useState, useEffect } from 'react';
import { courseService } from '../../services/courseService';
import type { Course } from '../../types';

export function Home() {
  const [publishedCourses, setPublishedCourses] = useState<Course[]>([]);

  useEffect(() => {
    courseService.getPublishedCourses().then(data => {
      setPublishedCourses(data.slice(0, 3));
    }).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="page-container relative z-10 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-6">
            <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
            Premium Educational Platform
          </div>
          <h1 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Master complex concepts with{' '}
            <span className="text-primary">expert guidance</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Join thousands of students learning advanced subjects through high-quality video lectures and interactive assessments.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/courses">
              <GlassButton variant="primary" size="lg" className="w-full sm:w-auto">
                Explore Courses <ArrowRight className="h-4 w-4" />
              </GlassButton>
            </Link>
            <Link to="/register">
              <GlassButton variant="default" size="lg" className="w-full sm:w-auto">
                Start Learning
              </GlassButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 border-t border-border">
        <div className="page-container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Featured Courses</h2>
              <p className="text-muted-foreground text-sm">Discover our most popular courses designed to elevate your understanding.</p>
            </div>
            <Link to="/courses" className="text-sm text-primary font-medium hover:text-primary/80 flex items-center gap-1 shrink-0">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* Learning Features */}
      <section className="py-16">
        <div className="page-container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold mb-2">A Complete Learning Experience</h2>
            <p className="text-muted-foreground text-sm">Everything you need to master your subjects.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Video, title: 'HD Video Lectures', desc: 'Crystal clear explanations with visual aids.' },
              { icon: FileText, title: 'Course Resources', desc: 'Comprehensive PDF notes and cheat sheets.' },
              { icon: CheckCircle, title: 'Interactive Quizzes', desc: 'Test your knowledge and get instant feedback.' },
              { icon: Award, title: 'Progress Tracking', desc: 'Monitor your academic growth over time.' }
            ].map((feature, i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center hover:-translate-y-0.5 transition-transform duration-200">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold mb-1.5">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Teacher */}
      <section className="py-16 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-10" />
        <div className="page-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Meet Your Instructor</h2>
              <h3 className="text-lg text-primary/80 font-medium mb-3">Senior Lecturer & Educational Consultant</h3>
              <p className="text-background/80 text-sm mb-6 leading-relaxed">
                Dedicated to providing high-quality education and fostering a deep understanding of complex subjects. With over 15 years of teaching experience, I focus on practical applications and theoretical foundations.
              </p>
              <div className="grid grid-cols-2 gap-6 border-t border-background/20 pt-6">
                <div>
                  <h4 className="text-2xl font-bold text-white mb-0.5">15+</h4>
                  <p className="text-xs text-background/60">Years Experience</p>
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-white mb-0.5">50k+</h4>
                  <p className="text-xs text-background/60">Students Taught</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <img 
                src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=300&h=300"
                alt="Shah Muhammed Sab" 
                className="w-56 h-56 md:w-72 md:h-72 object-cover rounded-2xl shadow-xl border border-background/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="page-container">
          <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
            <div className="max-w-xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to elevate your education?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Join our platform today and get unlimited access to premium educational content.
              </p>
              <Link to="/register">
                <GlassButton variant="primary" size="lg" className="w-full sm:w-auto px-8">
                  Create Free Account
                </GlassButton>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
