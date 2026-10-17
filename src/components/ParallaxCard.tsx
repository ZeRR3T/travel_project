'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

interface ParallaxCardProps {
  children: ReactNode;
  className?: string;
  speed?: number;
  direction?: 'vertical' | 'horizontal';
  depth?: number;
}

export function ParallaxCard({ 
  children, 
  className = '', 
  speed = 0.5, 
  direction = 'vertical',
  depth = 20
}: ParallaxCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const x = (e.clientX - centerX) / (rect.width / 2);
      const y = (e.clientY - centerY) / (rect.height / 2);

      setMousePosition({ x, y });
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (card) {
        card.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  const getTransform = () => {
    if (direction === 'horizontal') {
      return `translateX(${mousePosition.x * depth * speed}px)`;
    }
    return `translateY(${mousePosition.y * depth * speed}px)`;
  };

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-1000 ease-out ${className}`}
      style={{
        transform: isVisible ? 'scale(1) rotateX(0deg) rotateY(0deg)' : 'scale(0.9) rotateX(10deg) rotateY(10deg)',
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div
        className="transition-transform duration-300 ease-out"
        style={{
          transform: getTransform(),
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Компонент для анимированных карточек с градиентным фоном
export function GradientCard({ 
  children, 
  className = '', 
  gradient = 'from-blue-500 to-purple-600',
  hoverGradient = 'from-blue-600 to-purple-700'
}: { 
  children: ReactNode; 
  className?: string;
  gradient?: string;
  hoverGradient?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Градиентный фон */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-all duration-500 ${
          isHovered ? `bg-gradient-to-br ${hoverGradient}` : `bg-gradient-to-br ${gradient}`
        }`}
      />
      
      {/* Анимированные частицы */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Контент */}
      <div className="relative z-10 p-6 text-white">
        {children}
      </div>
    </div>
  );
}

// Компонент для анимированных карточек с 3D-эффектом
export function Card3D({ 
  children, 
  className = '', 
  intensity = 20 
}: { 
  children: ReactNode; 
  className?: string;
  intensity?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const x = (e.clientX - centerX) / (rect.width / 2);
      const y = (e.clientY - centerY) / (rect.height / 2);

      setRotation({
        x: -y * intensity,
        y: x * intensity
      });
    };

    const handleMouseLeave = () => {
      setRotation({ x: 0, y: 0 });
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (card) {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [intensity]);

  return (
    <div
      ref={cardRef}
      className={`perspective-1000 transition-all duration-1000 ease-out ${className}`}
      style={{
        transform: isVisible ? 'scale(1)' : 'scale(0.9)',
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div
        className="transition-transform duration-300 ease-out preserve-3d"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Компонент для анимированных карточек с волновым эффектом
export function WaveCard({ 
  children, 
  className = '', 
  waveColor = 'rgba(59, 130, 246, 0.1)' 
}: { 
  children: ReactNode; 
  className?: string;
  waveColor?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl transition-all duration-1000 ${className}`}
      style={{
        transform: isVisible ? 'scale(1)' : 'scale(0.9)',
        opacity: isVisible ? 1 : 0,
      }}
    >
      {/* Волновой эффект */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${waveColor} 0%, transparent 70%)`,
            animation: 'wave 3s ease-in-out infinite'
          }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(circle at 30% 70%, ${waveColor} 0%, transparent 70%)`,
            animation: 'wave 4s ease-in-out infinite reverse'
          }}
        />
      </div>
      
      {/* Контент */}
      <div className="relative z-10 p-6">
        {children}
      </div>
      
      <style jsx>{`
        @keyframes wave {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.1) rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
}
