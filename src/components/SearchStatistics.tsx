'use client';

import { TrendingUp, Users, Globe, Star, Zap, CheckCircle } from 'lucide-react';
import { useI18n } from '@/i18n/context/I18nContext';
import { useEffect, useState } from 'react';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  change?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  gradient: string;
  bgColor: string;
  borderColor: string;
  delay: number;
  isVisible: boolean;
}

function StatCard({ icon: Icon, title, value, change, gradient, bgColor, borderColor, delay, isVisible }: StatCardProps) {
  return (
    <div className={`${bgColor} ${borderColor} border-2 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-700 hover:scale-105 hover:-translate-y-2 group ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className={`w-16 h-16 ${gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg group-hover:shadow-2xl`}>
        <Icon className="w-8 h-8 text-white transition-transform duration-500 group-hover:scale-110" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-slate-700 transition-all duration-300 group-hover:translate-x-1">{title}</h3>
      <div className="text-4xl font-bold text-slate-900 mb-4 group-hover:text-slate-800 transition-colors duration-300">{value}</div>
      {change && (
        <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group-hover:scale-105 ${
          change.type === 'positive' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:bg-emerald-100 group-hover:border-emerald-300' : 
          change.type === 'negative' ? 'bg-red-50 text-red-700 border border-red-200 group-hover:bg-red-100 group-hover:border-red-300' : 
          'bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-slate-100 group-hover:border-slate-300'
        }`}>
          <TrendingUp className={`w-5 h-5 transition-all duration-300 group-hover:scale-110 ${
            change.type === 'negative' ? 'rotate-180' : ''
          }`} />
          <span className="text-sm font-semibold">{change.value}</span>
        </div>
      )}
    </div>
  );
}

function SearchStatistics() {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);
  
  const stats = [
    {
      icon: Users,
      title: t('home.statistics.activeUsers'),
      value: '2.4M+',
      change: { value: t('home.statistics.monthlyGrowth'), type: 'positive' as const },
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      icon: Globe,
      title: t('home.statistics.countries'),
      value: '195',
      change: { value: t('home.statistics.fullCoverage'), type: 'neutral' as const },
      gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      icon: Star,
      title: t('home.statistics.averageRating'),
      value: '4.8/5',
      change: { value: t('home.statistics.yearlyImprovement'), type: 'positive' as const },
      gradient: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      icon: Zap,
      title: t('home.statistics.timeSavings'),
      value: '85%',
      change: { value: t('home.statistics.vsCompetitors'), type: 'positive' as const },
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <div className="py-24 w-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-20 transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-white/20 mb-6 animate-pulse">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-slate-700">Trusted by millions worldwide</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              {t('home.statistics.title')}
            </h2>
            <p className="text-xl lg:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              {t('home.statistics.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                {...stat}
                delay={index * 150}
                isVisible={isVisible}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchStatistics;
