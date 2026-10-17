'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2, X } from 'lucide-react';
import { useI18n } from '@/i18n/context/I18nContext';

interface VoiceSearchResult {
  type: 'hotel' | 'flight';
  from?: string;
  to?: string;
  date?: string;
  returnDate?: string;
  guests?: number;
}

interface VoiceSearchProps {
  onResult: (result: VoiceSearchResult) => void;
  isListening?: boolean;
  placeholder?: string;
}

export function VoiceSearch({ onResult, isListening: externalIsListening, placeholder }: VoiceSearchProps) {
  const { t } = useI18n();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  // Переменная для накопления текста
  let accumulatedText = '';

  const defaultPlaceholder = t('common.clickToStartVoiceSearch');

  const checkMicrophonePermission = useCallback(async () => {
    // Проверяем, доступен ли API для работы с медиа устройствами
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('MediaDevices API not supported');
      setHasPermission(false);
      setError(t('errors.microphoneNotSupported'));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      setError('');
    } catch (err) {
      console.error('Microphone permission error:', err);
      setHasPermission(false);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError(t('errors.microphoneAccessDenied'));
        } else if (err.name === 'NotSupportedError') {
          setError(t('errors.microphoneNotSupported'));
        } else {
          setError(t('errors.failedToAccessMicrophone'));
        }
      } else {
        setError(t('errors.microphoneAccessDenied'));
      }
    }
  }, [t]);

  // Функция для очистки текста
  const clearTranscript = () => {
    setTranscript('');
    setShowTranscript(false);
    accumulatedText = '';
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Примечание: Некоторые браузеры могут требовать HTTPS для доступа к микрофону
      // Но мы позволяем попробовать на HTTP соединении
      if (window.location.protocol !== 'https:') {
        console.warn('Voice search may not work on HTTP connection due to browser security policies');
      }

      // Проверяем поддержку различных API распознавания речи
      // @ts-ignore - игнорируем ошибку типизации для SpeechRecognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        console.log(' Speech Recognition API доступен');
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true; // Включаем непрерывное распознавание
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'ru-RU';
        // @ts-ignore - игнорируем ошибку типизации для нестандартного свойства
        recognitionInstance.interimResults = true; // Показывать промежуточные результаты
        // @ts-ignore - игнорируем ошибку типизации для нестандартного свойства
        recognitionInstance.maxAlternatives = 1; // Возвращать только лучший вариант распознавания
        // @ts-ignore - игнорируем ошибку типизации для нестандартного свойства
        recognitionInstance.continuous = true; // Продолжать распознавание после паузы

        recognitionInstance.onstart = () => {
          console.log(' Speech recognition started');
          setIsListening(true);
          setError('');
          setTranscript('');
          accumulatedText = ''; // Сбрасываем накопленный текст при старте
        };

        recognitionInstance.onend = () => {
          console.log(' Speech recognition ended');
          
          // Если все еще в режиме прослушивания, перезапускаем распознавание
          if (isListening) {
            console.log(' Restarting recognition...');
            try {
              recognition.start();
            } catch (error) {
              console.error(' Failed to restart recognition:', error);
              setIsListening(false);
              // Если есть накопленный текст, отправляем его на поиск
              if (accumulatedText.trim()) {
                console.log(' Processing accumulated transcript:', accumulatedText);
                handleLLMProcessing(accumulatedText);
                accumulatedText = ''; // Очищаем накопленный текст
              }
            }
          } else {
            setIsListening(false);
            // Если есть накопленный текст, отправляем его на поиск
            if (accumulatedText.trim()) {
              console.log(' Processing accumulated transcript:', accumulatedText);
              handleLLMProcessing(accumulatedText);
              accumulatedText = ''; // Очищаем накопленный текст
            } else {
              console.warn(' No transcript available when recognition ended');
            }
          }
        };

        recognitionInstance.onresult = (event: any) => {
          let interimTranscript = '';
          
          // Получаем только последний результат
          const result = event.results[event.results.length - 1];
          const transcriptText = result[0].transcript;

          if (result.isFinal) {
            // Если это финальный результат, добавляем его к накопленному тексту
            accumulatedText = (accumulatedText + ' ' + transcriptText).trim();
            setTranscript(''); // Очищаем временный текст
            console.log(' Final transcript:', accumulatedText);
          } else {
            // Если это промежуточный результат, показываем его как временный текст
            interimTranscript = transcriptText;
            setTranscript(interimTranscript);
            console.log(' Interim transcript:', interimTranscript);
          }
        };

        recognitionInstance.onerror = (event: any) => {
          console.error(' Recognition error:', event.error);
          setError(`Error occurred in recognition: ${event.error}`);
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
        checkMicrophonePermission();
      } else {
        console.error(' Speech Recognition API не поддерживается');
        setError(t('errors.browserDoesNotSupportSpeechRecognition'));
      }
    }
  }, [checkMicrophonePermission, isListening]);

  useEffect(() => {
    if (externalIsListening !== undefined) {
      setIsListening(externalIsListening);
    }
  }, [externalIsListening]);

  const toggleListening = async () => {
    console.log(' toggleListening called, isListening:', isListening);
    if (!recognition) {
      console.error(' Recognition not initialized');
      return;
    }

    if (isListening) {
      console.log(' Stopping recognition');
      recognition.stop();
    } else {
      try {
        console.log(' Starting recognition...');
        if (!hasPermission) {
          console.log(' Checking microphone permission...');
          await checkMicrophonePermission();
        }
        if (hasPermission) {
          console.log(' Permission granted, starting recognition');
          setTranscript('');
          setError('');
          setShowTranscript(false);
          accumulatedText = ''; // Сбрасываем накопленный текст при старте
          recognition.start();
        } else {
          console.error(' Microphone permission denied');
          setError(t('errors.microphoneAccessDenied'));
        }
      } catch (err) {
        console.error(' Error starting recognition:', err);
        setError(t('errors.failedToStartSpeechRecognition'));
      }
    }
  };

  const handleLLMProcessing = async (text: string) => {
    try {
      console.log(' Processing voice input:', text);
      const response = await fetch('/api/process-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.error(' API response not OK:', response.status, response.statusText);
        throw new Error(t('errors.failedToProcessVoiceInput'));
      }

      const data = await response.json();
      console.log(' API response data:', data);

      if (!data.result) {
        console.error(' No result in API response');
        throw new Error(t('errors.invalidApiResponseFormat'));
      }

      // Упрощаем обработку результата
      const processedResult = {
        ...data.result,
        type: data.result.type || (text.toLowerCase().includes('отел') ? 'hotel' : 'flight'),
      };

      console.log(' Processed result:', processedResult);
      onResult(processedResult);
    } catch (error) {
      console.error(' Error processing voice input:', error);
      setError(t('errors.failedToProcessVoiceInput'));
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={toggleListening}
        disabled={!hasPermission && hasPermission !== null}
        className={`flex items-center justify-center p-3 rounded-full transition-all duration-200 ${
          isListening 
            ? 'bg-red-100 hover:bg-red-200 text-red-600' 
            : hasPermission === false
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
        }`}
        title={placeholder || defaultPlaceholder}
      >
        {isListening ? (
          <MicOff className="w-5 h-5" />
        ) : hasPermission === false ? (
          <X className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {error && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-red-100 text-red-700 text-sm rounded-lg shadow-lg whitespace-nowrap z-10">
          {error}
        </div>
      )}

      {transcript && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-blue-100 text-blue-700 text-sm rounded-lg shadow-lg max-w-xs z-10">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{transcript}</span>
            <button
              onClick={clearTranscript}
              className="text-blue-500 hover:text-blue-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 