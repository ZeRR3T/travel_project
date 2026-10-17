'use client';

import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useI18n } from '@/i18n/context/I18nContext';

interface ValidationWarning {
  message: string;
  type: 'warning' | 'error' | 'info';
}

interface ValidationWarningsProps {
  warnings: ValidationWarning[];
  className?: string;
}

export default function ValidationWarnings({ warnings, className = '' }: ValidationWarningsProps) {
  const { t } = useI18n();
  
  if (!warnings || warnings.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <span className="text-sm font-medium text-green-700">
          {t('common.geminiAiProcessedSearchRequest')}
        </span>
      </div>
      
      {warnings.map((warning, index) => (
        <div
          key={index}
          className={`flex items-start space-x-3 p-3 rounded-lg border ${getBackgroundColor(warning.type)}`}
        >
          {getIcon(warning.type)}
          <div className="flex-1">
            <p className="text-sm font-medium">
              {warning.message}
            </p>
            <p className="text-xs mt-1 opacity-80">
              {t('common.automaticallyCorrected')}
            </p>
          </div>
        </div>
      ))}
      
      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
        <strong>{t('common.note')}:</strong> {t('common.geminiAiHelpsImproveSearchAccuracy')}
      </div>
    </div>
  );
}
