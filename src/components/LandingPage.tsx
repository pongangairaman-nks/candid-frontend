'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LoginForm, SignupForm } from './Auth';
import { Menu, X, ArrowRight, CheckCircle2, Zap, FileText, BarChart3, Sparkles, Brain, Lightbulb, LogOut } from 'lucide-react';

// Hook to trigger animations on scroll
const useScrollTrigger = (animationClass: string) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    const element = ref.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  return ref;
};

export const LandingPage = () => {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);

  // Scroll animation refs
  const heroLeftRef = useRef<HTMLDivElement>(null);
  const heroRightRef = useRef<HTMLDivElement>(null);
  const featuresRef = useScrollTrigger('animate-stagger');
  const workflowRef = useScrollTrigger('animate-stagger');
  const benefitsLeftRef = useScrollTrigger('animate-fade-in-left');
  const benefitsRightRef = useScrollTrigger('animate-fade-in-right');
  const benefitsListRef = useScrollTrigger('animate-stagger');

  // Initialize auth and make hero section visible on mount
  useEffect(() => {
    // Initialize auth from localStorage
    const { initializeAuth } = useAuthStore.getState();
    initializeAuth();

    // Make hero section visible
    if (heroLeftRef.current) {
      heroLeftRef.current.classList.add('visible');
    }
    if (heroRightRef.current) {
      heroRightRef.current.classList.add('visible');
    }
  }, []);

  // Get user initial from firstName or email
  const getUserInitial = () => {
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const handleLogoClick = () => {
    router.push('/');
  };

  const handleDashboardClick = () => {
    router.push('/dashboard/jobs');
  };

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'ATS Resume Optimization',
      description: 'Automatically optimize your resume to pass Applicant Tracking Systems with AI-powered keyword matching.',
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'LaTeX Resume Enhancement',
      description: 'Full support for LaTeX resumes with intelligent formatting and structure optimization.',
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI Resume Feedback',
      description: 'Get detailed AI-powered suggestions to improve your resume content and presentation.',
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Resume Scoring',
      description: 'Receive an ATS compatibility score and understand exactly what needs improvement.',
    },
    {
      icon: <Lightbulb className="w-8 h-8" />,
      title: 'Keyword Optimization',
      description: 'Match your resume with job description keywords to increase visibility to recruiters.',
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Instant Suggestions',
      description: 'Get real-time optimization suggestions as you edit your resume.',
    },
  ];

  const workflow = [
    {
      step: '01',
      title: 'Upload Resume',
      description: 'Upload your resume in PDF or LaTeX format',
    },
    {
      step: '02',
      title: 'AI Analysis',
      description: 'Our AI analyzes your resume against job descriptions',
    },
    {
      step: '03',
      title: 'Get Suggestions',
      description: 'Receive actionable optimization recommendations',
    },
    {
      step: '04',
      title: 'Download',
      description: 'Download your improved resume instantly',
    },
  ];

  const benefits = [
    'Better ATS compatibility and higher pass rates',
    'AI-powered suggestions tailored to your resume',
    'Full LaTeX support for technical professionals',
    'Cleaner, more professional formatting',
    'Higher recruiter visibility and engagement',
    'Instant feedback and iterative improvements',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button
              onClick={handleLogoClick}
              className="flex items-center space-x-2 hover:opacity-80 transition"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">Candid</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition">Features</a>
              <a href="#workflow" className="text-slate-600 hover:text-slate-900 transition">How It Works</a>
              <a href="#benefits" className="text-slate-600 hover:text-slate-900 transition">Why Us</a>
            </div>

            {/* Auth Buttons / User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated && user ? (
                <>
                  <button
                    onClick={handleDashboardClick}
                    className="px-4 py-2 text-slate-700 hover:text-slate-900 transition font-medium"
                  >
                    Dashboard
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
                      className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:bg-indigo-700 transition"
                      title={user.email}
                    >
                      {getUserInitial()}
                    </button>
                    {showAvatarDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-slate-200">
                          <p className="text-sm font-medium text-slate-900">{user.firstName || user.email}</p>
                          <p className="text-xs text-slate-600">{user.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            handleLogout();
                            setShowAvatarDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-slate-700 hover:text-red-600 hover:bg-slate-50 transition font-medium flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowLoginModal(true);
                    }}
                    className="px-4 py-2 border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 rounded-lg transition font-medium"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setShowSignupModal(true);
                    }}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg hover:shadow-lg transition"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden pb-4 space-y-4">
              <a href="#features" className="block text-slate-600 hover:text-slate-900">Features</a>
              <a href="#workflow" className="block text-slate-600 hover:text-slate-900">How It Works</a>
              <a href="#benefits" className="block text-slate-600 hover:text-slate-900">Why Us</a>
              <div className="flex flex-col space-y-2 pt-4 border-t">
                {isAuthenticated && user ? (
                  <>
                    <button
                      onClick={() => {
                        handleDashboardClick();
                        setIsMenuOpen(false);
                      }}
                      className="px-4 py-2 text-slate-700 hover:text-slate-900 transition font-medium text-left"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg transition w-full"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        {getUserInitial()}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-slate-900">{user.firstName || user.email}</p>
                        <p className="text-xs text-slate-600">{user.email}</p>
                      </div>
                    </button>
                    {showAvatarDropdown && (
                      <div className="bg-slate-50 rounded-lg border border-slate-200 py-2 space-y-1">
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsMenuOpen(false);
                            setShowAvatarDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-slate-700 hover:text-red-600 hover:bg-white transition font-medium flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowLoginModal(true);
                        setIsMenuOpen(false);
                      }}
                      className="px-4 py-2 border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 rounded-lg transition font-medium"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => {
                        setShowSignupModal(true);
                        setIsMenuOpen(false);
                      }}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg hover:shadow-lg transition"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div ref={heroLeftRef} className="space-y-8 animate-fade-in-left">
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight">
                  Your Resume, <span className="text-indigo-600">AI-Optimized</span>
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed">
                  Pass ATS systems, impress recruiters, and land more interviews with AI-powered resume optimization. Full LaTeX support included.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    setShowSignupModal(true);
                  }}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold hover:shadow-xl transition flex items-center justify-center gap-2"
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setShowSignupModal(true);
                  }}
                  className="px-8 py-4 border-2 border-slate-300 text-slate-900 rounded-lg font-semibold hover:border-slate-400 transition"
                >
                  Optimize Resume
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-indigo-500 border-2 border-white"
                    />
                  ))}
                </div>
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-900">500+</span> resumes optimized
                </p>
              </div>
            </div>

            {/* Right Visual */}
            <div ref={heroRightRef} className="relative h-96 bg-indigo-50 rounded-2xl flex items-center justify-center overflow-hidden animate-fade-in-right">
              <div className="absolute inset-0 bg-indigo-600/5" />
              <div className="relative z-10 text-center space-y-4">
                <BarChart3 className="w-24 h-24 text-indigo-600 mx-auto opacity-50" />
                <p className="text-slate-600 font-medium">Resume Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">Powerful Features</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Everything you need to optimize your resume and land your dream job
            </p>
          </div>

          <div ref={featuresRef} className="grid md:grid-cols-3 gap-8 animate-stagger">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-8 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition space-y-4"
              >
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 sm:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">How It Works</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Simple 4-step process to optimize your resume
            </p>
          </div>

          <div ref={workflowRef} className="grid md:grid-cols-4 gap-8 animate-stagger">
            {workflow.map((item, idx) => (
              <div key={idx} className="relative">
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-slate-600">{item.description}</p>
                </div>
                {idx < workflow.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8 h-1 bg-indigo-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Visual */}
            <div ref={benefitsLeftRef} className="relative h-96 bg-indigo-50 rounded-2xl flex items-center justify-center overflow-hidden animate-fade-in-left">
              <div className="absolute inset-0 bg-indigo-600/5" />
              <div className="relative z-10 text-center space-y-4">
                <Sparkles className="w-24 h-24 text-indigo-600 mx-auto opacity-50" />
                <p className="text-slate-600 font-medium">AI-Powered Optimization</p>
              </div>
            </div>

            {/* Right Content */}
            <div ref={benefitsRightRef} className="space-y-8 animate-fade-in-right">
              <div>
                <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">Why Choose Candid?</h2>
                <p className="text-xl text-slate-600">
                  We combine cutting-edge AI with deep recruiting knowledge to help you succeed.
                </p>
              </div>

              <div ref={benefitsListRef} className="space-y-4 animate-stagger">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
                    <p className="text-slate-700 text-lg">{benefit}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setShowSignupModal(true);
                }}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold hover:shadow-xl transition inline-flex items-center gap-2"
              >
                Start Optimizing <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-white">Ready to Optimize Your Resume?</h2>
          <p className="text-xl text-indigo-100">
            Join hundreds of professionals who have improved their ATS scores and landed more interviews.
          </p>
          <button
            onClick={() => {
              setShowSignupModal(true);
            }}
            className="px-8 py-4 bg-white text-indigo-600 hover:bg-slate-50 rounded-lg font-semibold hover:shadow-xl transition inline-flex items-center gap-2"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Candid</span>
              </div>
              <p className="text-sm text-slate-400">AI-powered resume optimization for modern professionals.</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-white font-semibold">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#workflow" className="hover:text-white transition">How It Works</a></li>
                <li><a href="#benefits" className="hover:text-white transition">Pricing</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-white font-semibold">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-white font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm">&copy; 2026 Candid. All rights reserved.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#" className="hover:text-white transition">Twitter</a>
              <a href="#" className="hover:text-white transition">LinkedIn</a>
              <a href="#" className="hover:text-white transition">GitHub</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Login</h2>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <LoginForm
                onSuccess={() => {
                  setShowLoginModal(false);
                  router.push('/dashboard/jobs');
                }}
                onSwitchToSignup={() => {
                  setShowLoginModal(false);
                  setShowSignupModal(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Sign Up</h2>
                <button
                  onClick={() => setShowSignupModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <SignupForm
                onSuccess={() => {
                  setShowSignupModal(false);
                  router.push('/dashboard/jobs');
                }}
                onSwitchToLogin={() => {
                  setShowSignupModal(false);
                  setShowLoginModal(true);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
