'use client';

import { useState, useEffect } from 'react';
import { CogIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/i18n/context/I18nContext';

interface BonusSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  isEditable: boolean;
}

export default function BonusSettingsManager() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<Record<string, BonusSetting[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [showInitializeButton, setShowInitializeButton] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/bonus/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        
        // Проверяем, есть ли настройки
        const hasSettings = Object.values(data).some(category => category.length > 0);
        setShowInitializeButton(!hasSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/bonus/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        await fetchSettings();
      }
    } catch (error) {
      console.error('Error initializing settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleValueChange = (settingId: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [settingId]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const settingsToUpdate = Object.entries(editedValues).map(([id, value]) => ({
        id,
        value
      }));

      const response = await fetch('/api/bonus/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: settingsToUpdate }),
      });

      if (response.ok) {
        setEditedValues({});
        await fetchSettings();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'booking': return '';
      case 'referral': return '';
      case 'signup': return '';
      case 'redemption': return '';
      case 'limits': return '';
      default: return '';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'booking':
        return t('pages.admin.bonus.categories.booking');
      case 'referral':
        return t('pages.admin.bonus.categories.referral');
      case 'registration':
        return t('pages.admin.bonus.categories.registration');
      case 'exchange':
        return t('pages.admin.bonus.categories.exchange');
      case 'limits':
        return t('pages.admin.bonus.categories.limits');
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasChanges = Object.keys(editedValues).length > 0;

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопки */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">{t('pages.admin.bonus.bonusSettings')}</h2>
        {Object.keys(editedValues).length > 0 && (
          <button
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            {saving ? t('common.saving') : t('common.save')}
          </button>
        )}
      </div>

      {/* Настройки по категориям */}
      {Object.entries(settings).map(([category, categorySettings]) => (
        <div key={category} className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="mr-2">{getCategoryIcon(category)}</span>
              {getCategoryName(category)}
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {categorySettings.map((setting) => (
              <div key={setting.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900">
                      {setting.description}
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('common.key')}: <code className="bg-gray-100 px-1 py-0.5 rounded">{setting.key}</code>
                    </p>
                  </div>
                  
                  <div className="ml-6">
                    {setting.isEditable ? (
                      <input
                        type="text"
                        value={editedValues[setting.id] !== undefined ? editedValues[setting.id] : setting.value}
                        onChange={(e) => handleValueChange(setting.id, e.target.value)}
                        className="block w-32 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder={setting.value}
                      />
                    ) : (
                      <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-md w-32">
                        {setting.value}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(settings).length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('pages.admin.bonus.noSettingsFound')}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('pages.admin.bonus.initializeSettingsDescription')}
          </p>
          <div className="mt-6">
            <button
              onClick={initializeSettings}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <CogIcon className="h-4 w-4 mr-2" />
              {t('pages.admin.bonus.initializeSettings')}
            </button>
          </div>
        </div>
      )}

      {/* Информация о настройках */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <CogIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              {t('pages.admin.bonus.aboutBonusSystemSettings')}
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                {t('pages.admin.bonus.settingsDescription')}
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li><strong>{t('pages.admin.bonus.categories.booking')}:</strong> {t('pages.admin.bonus.bookingSettingsDescription')}</li>
                <li><strong>{t('pages.admin.bonus.categories.referral')}:</strong> {t('pages.admin.bonus.referralSettingsDescription')}</li>
                <li><strong>{t('pages.admin.bonus.categories.registration')}:</strong> {t('pages.admin.bonus.registrationSettingsDescription')}</li>
                <li><strong>{t('pages.admin.bonus.categories.exchange')}:</strong> {t('pages.admin.bonus.exchangeSettingsDescription')}</li>
                <li><strong>{t('pages.admin.bonus.categories.limits')}:</strong> {t('pages.admin.bonus.limitsSettingsDescription')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
