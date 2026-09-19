import { Link } from 'react-router-dom';
import { ArrowRight, Video, FileText, CheckCircle, Award, GraduationCap } from 'lucide-react';
import { GlassButton } from '../../components/ui/GlassButton';
import { CourseCard } from '../../components/ui/CourseCard';
import { useState, useEffect } from 'react';
import { courseService } from '../../services/courseService';
import type { Course } from '../../types';
import { useAuth } from '../../hooks/useAuth';
export function Home() {
  const { session, profile } = useAuth();
  const [publishedCourses, setPublishedCourses] = useState<Course[]>([]);

  useEffect(() => {
    courseService.getPublishedCourses().then(data => {
      setPublishedCourses(data.slice(0, 3));
    }).catch(console.error);
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="page-container home-hero-content">
          <div className="home-hero-badge">
            <GraduationCap className="home-hero-badge-icon" />
            Premium Educational Platform
          </div>
          <h1 className="home-hero-title">
            Master complex concepts with{' '}
            <span className="text-gradient">
              expert guidance
            </span>
          </h1>
          <p className="home-hero-desc">
            Join thousands of students learning advanced subjects through high-quality video lectures and interactive assessments.
          </p>
          <div className="home-hero-actions">
            <Link to="/courses">
              <GlassButton variant="primary" size="lg" className="home-hero-btn">
                Explore Courses <ArrowRight className="h-4 w-4 ml-2" />
              </GlassButton>
            </Link>
            <Link to="/register">
              <GlassButton variant="default" size="lg" className="home-hero-btn">
                Start Learning
              </GlassButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="home-section-bordered">
        <div className="page-container">
          <div className="home-section-header">
            <div>
              <h2 className="home-section-title">Featured Courses</h2>
              <p className="home-section-desc">Discover our most popular courses designed to elevate your understanding.</p>
            </div>
            <Link to="/courses" className="home-section-link">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-8">
            {publishedCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* Learning Features */}
      <section className="home-section">
        <div className="page-container">
          <div className="home-section-header" style={{ justifyContent: 'center', textAlign: 'center', margin: '0 auto var(--space-16)', maxWidth: '42rem' }}>
            <div>
              <h2 className="home-section-title">A Complete Learning Experience</h2>
              <p className="home-section-desc">Everything you need to master your subjects.</p>
            </div>
          </div>

          <div className="home-features-grid">
            {[
              { icon: Video, title: 'HD Video Lectures', desc: 'Crystal clear explanations with visual aids.' },
              { icon: FileText, title: 'Course Resources', desc: 'Comprehensive PDF notes and cheat sheets.' },
              { icon: CheckCircle, title: 'Interactive Quizzes', desc: 'Test your knowledge and get instant feedback.' },
              { icon: Award, title: 'Progress Tracking', desc: 'Monitor your academic growth over time.' }
            ].map((feature, i) => (
              <div key={i} className="glass-card home-feature-card">
                <div className="home-feature-icon-wrapper">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-h4 mb-2">{feature.title}</h3>
                <p className="text-sm text-muted">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Teacher */}
      <section className="home-about-section">
        <div className="home-about-bg" />
        <div className="page-container home-about-content">
          <div className="home-about-grid">
            <div className="home-about-text">
              <h2 className="home-about-title">Meet Your Instructor</h2>
              <h3 className="text-h3 text-primary mb-1">Shah Muhammed</h3>
              <h4 className="home-about-subtitle">Senior Lecturer & Educational Consultant</h4>
              <p className="home-about-desc">
                Dedicated to providing high-quality education and fostering a deep understanding of complex subjects. With over 15 years of teaching experience, I focus on practical applications and theoretical foundations.
              </p>
              <div className="home-about-stats">
                <div>
                  <h4 className="home-about-stat-value">15+</h4>
                  <p className="home-about-stat-label">Years Experience</p>
                </div>
                <div>
                  <h4 className="home-about-stat-value">50k+</h4>
                  <p className="home-about-stat-label">Students Taught</p>
                </div>
              </div>
            </div>
            <div className="home-about-image-wrapper">
              <div className="home-about-image-container">
                <div className="home-about-image-glow" />
                <img 
                  src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=600&h=600"
                  alt="Shah Muhammed Sab" 
                  className="home-about-image"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="home-section">
        <div className="page-container">
          <div className="home-cta-card">
            <div className="home-cta-content">
              <h2 className="home-cta-title">Ready to elevate your education?</h2>
              <p className="home-cta-desc">
                Join our platform today and get unlimited access to premium educational content, interactive quizzes, and expert guidance.
              </p>
              {session ? (
                <Link to={profile?.role === 'admin' ? '/admin' : profile?.role === 'teacher' ? '/teacher' : '/dashboard'}>
                  <GlassButton variant="primary" size="lg">
                    Go to Dashboard
                  </GlassButton>
                </Link>
              ) : (
                <Link to="/register">
                  <GlassButton variant="primary" size="lg">
                    Create Free Account
                  </GlassButton>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
