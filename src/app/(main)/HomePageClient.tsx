'use client';

import { Search, Map, Wallet, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import TopUpBalance from '@/components/TopUpBalance';
import { Footer } from '@/components/Footer';
import SearchStatistics from '@/components/SearchStatistics';
import { MainLayout } from '@/components/MainLayout';
import { useI18n } from '@/i18n/context/I18nContext';
import { useEffect, useState } from 'react';
import { PageTransition, AnimatedCard, AnimatedIcon, AnimatedButton, AnimatedHeading } from '@/components/PageTransition';
import { LazyImage } from '@/components/LazyImage';
import { LazyComponent } from '@/components/LazyComponent';
import { CardSkeleton, HotelCardSkeleton } from '@/components/ContentSkeletons';

const features = [
  {
    icon: Wallet,
    titleKey: 'home.features.balance.title',
    descriptionKey: 'home.features.balance.description',
    href: '#balance',
    color: 'from-emerald-400 to-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    hoverColor: 'hover:border-emerald-300'
  },
  {
    icon: Search,
    titleKey: 'home.features.aiSearch.title',
    descriptionKey: 'home.features.aiSearch.description',
    href: '/search',
    color: 'from-blue-400 to-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverColor: 'hover:border-blue-300'
  },
  {
    icon: Map,
    titleKey: 'home.features.dashboard.title',
    descriptionKey: 'home.features.dashboard.description',
    href: '/dashboard',
    color: 'from-purple-400 to-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    hoverColor: 'hover:border-purple-300'
  },
];

// Hero images array for background slider
const heroImages = [
  '/images/hero/hero-1.jpg',
  '/images/hero/hero-2.jpg',
  '/images/hero/hero-3.jpg',
  '/images/hero/hero-4.jpg',
  '/images/hero/hero-5.jpg',
  '/images/hero/hero-6.jpg',
  '/images/hero/hero-7.jpg',
  '/images/hero/hero-8.jpg'
].map(path => ({
  path,
  isLoaded: false,
  hasError: false
}));

export function HomePageClient() {
  const { t } = useI18n();
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // Анимация появления страницы
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-advance slider every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 8000); // 10 seconds
    return () => clearInterval(interval);
  }, [heroImages.length]);

  // Create translated features array
  const translatedFeatures = features.map(feature => ({
    ...feature,
    title: t(feature.titleKey),
    description: t(feature.descriptionKey),
  }));

  return (
    <MainLayout title={t('common.home')}>
      <div className={`min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Hero Section with Background Image Slider - Navbar Style */}
        <div className="relative overflow-hidden min-h-screen bg-gradient-to-br from-slate-800 via-blue-800 to-slate-800 hero-image-container">
          {/* Background Image Slider */}
          <div className="absolute inset-0 w-full h-full hero-background">
            {heroImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
                  index === currentImageIndex 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-105'
                }`}
              >
                <LazyImage
                  src={image.path}
                  alt={`Hero background ${index + 1}`}
                  className="w-full h-full object-cover object-center opacity-40 sm:opacity-50 md:opacity-60 hero-image"
                  placeholder={
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 animate-pulse" />
                  }
                  skeletonLines={0}
                  onLoad={() => {
                    const updatedImages = [...heroImages];
                    updatedImages[index].isLoaded = true;
                    // Не обновляем состояние, так как это может вызвать ненужные перерендеры
                  }}
                  onError={() => {
                    const updatedImages = [...heroImages];
                    updatedImages[index].hasError = true;
                    console.error(`Failed to load hero image: ${image.path}`);
                    // Пропускаем изображение с ошибкой при следующей смене
                    if (index === currentImageIndex) {
                      setCurrentImageIndex((prevIndex) => 
                        (prevIndex + 1) % heroImages.length
                      );
                    }
                  }}
                  priority={index === 0} // Приоритетная загрузка первого изображения
                />
                {/* Enhanced gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/40 via-blue-900/20 to-transparent sm:from-slate-900/60 sm:via-blue-900/30 sm:to-slate-900/10"></div>
              </div>
            ))}
          </div>
          
          {/* Content */}
          <div className="relative z-10 text-center py-24 lg:py-36 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <AnimatedCard delay={200} direction="up">
                <div className="inline-flex items-center gap-3 glass-morphism px-8 py-4 rounded-2xl shadow-navbar mb-10">
                  <AnimatedIcon animation="pulse">
                    <Sparkles className="w-7 h-7" style={{
                      background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }} />
                  </AnimatedIcon>
                  <span className="text-lg font-bold text-white">{t('home.badge.aiPowered')}</span>
                </div>
              </AnimatedCard>
              
              <AnimatedHeading level="h1" animation="fadeInUp" className="text-6xl lg:text-8xl font-black text-white mb-10 leading-tight">
                <span style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>{t('home.welcome.title')}</span>
              </AnimatedHeading>
              
              <AnimatedCard delay={400} direction="up">
                <p className="text-2xl lg:text-3xl text-white mb-16 max-w-4xl mx-auto leading-relaxed font-medium">
                  {t('home.welcome.description')}
                </p>
              </AnimatedCard>
              
              {/* Enhanced Search Section */}
              
              

            </div>
          </div>
          
          {/* Enhanced Scroll Indicator */}
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-8 h-12 border-2 border-cyan-400/60 rounded-full flex justify-center backdrop-blur-md bg-slate-800/20">
              <div className="w-2 h-4 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Features Grid - Navbar Style */}
        <div className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-800 via-blue-800/40 to-slate-800">
          <div className="max-w-7xl mx-auto">
            <AnimatedCard delay={200} direction="up">
              <div className="text-center mb-20">
                <AnimatedHeading level="h2" animation="fadeInUp" className="text-5xl lg:text-6xl font-black text-white mb-6">
                  <span style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>{t('home.features.title')}</span>
                </AnimatedHeading>
                <p className="text-2xl text-white max-w-4xl mx-auto font-medium">
                  {t('home.features.subtitle')}
                </p>
              </div>
            </AnimatedCard>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {translatedFeatures.map((feature, index) => (
                <AnimatedCard key={index} delay={index * 150} direction="up">
                  <Link
                    href={feature.href}
                    className="group block relative overflow-hidden h-full"
                  >
                    <div className="card-navbar p-8 h-full flex flex-col justify-between hover-lift transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
                      <div>
                        <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-xl`}>
                          <AnimatedIcon animation="pulse">
                            <feature.icon className="w-8 h-8 text-white transition-transform duration-500 group-hover:scale-110" />
                          </AnimatedIcon>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-gradient-accent transition-all duration-300 group-hover:translate-x-1">
                          {feature.title}
                        </h3>
                        <p className="text-white/80 leading-relaxed text-lg transition-colors duration-300 group-hover:text-white">
                          {feature.description}
                        </p>
                      </div>
                      <div className="flex items-center text-white font-semibold text-base group-hover:text-gradient-accent transition-all duration-300 group-hover:translate-x-2 mt-6">
                        {t('home.features.learnMore')}
                        <AnimatedIcon animation="float">
                          <ArrowRight className="w-5 h-5 ml-2 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110" style={{
                            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }} />
                        </AnimatedIcon>
                      </div>
                    </div>
                  </Link>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </div>

       
        {/* Search Statistics */}
        <LazyComponent
          skeletonLines={4}
          threshold={0.2}
          delay={200}
        >
          <SearchStatistics />
        </LazyComponent>

        {/* Top Up Balance Section - Navbar Style */}
        <div className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-800 via-blue-800/40 to-slate-800">
          <div className="max-w-8xl mx-auto text-center">
            <AnimatedCard delay={500} direction="up">
              <div>
                <AnimatedHeading level="h2" animation="fadeInUp" className="text-5xl lg:text-6xl font-black text-white mb-8">
                  <span style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>{t('home.topUpBalance.title')}</span>
                </AnimatedHeading>
                <p className="text-2xl text-white mb-16 max-w-4xl mx-auto font-medium">
                  {t('home.topUpBalance.subtitle')}
                </p>
              </div>
            </AnimatedCard>
            <LazyComponent
              skeletonLines={6}
              threshold={0.3}
              delay={300}
            >
              <TopUpBalance />
            </LazyComponent>
          </div>
        </div>

        {/* Footer */}
        <LazyComponent
          skeletonLines={3}
          threshold={0.4}
          delay={400}
        >
          <Footer />
        </LazyComponent>
      </div>
    </MainLayout>
  );
}
