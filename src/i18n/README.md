# Internationalization (i18n) System

This project implements a comprehensive multi-language support system using LibreTranslate, following SOLID principles and TDD practices.

## Features

- 🌍 **Multi-language Support**: Supports 80+ languages (excluding Russian and Belarusian as requested)
- 🔄 **Real-time Translation**: Uses LibreTranslate API for accurate translations
- 💾 **Smart Caching**: Implements both memory and localStorage caching for performance
- 🎯 **Language Detection**: Automatically detects text language
- 📱 **Responsive UI**: Beautiful language selector components
- 🧪 **TDD Approach**: Comprehensive test coverage
- 🏗️ **SOLID Principles**: Clean, maintainable architecture

## Architecture

### Core Components

1. **TranslationService Interface**: Defines the contract for translation services
2. **LibreTranslateService**: Implements the LibreTranslate API integration
3. **I18nService**: Main orchestrator service with caching and batch operations
4. **TranslationCache**: Caching layer for improved performance
5. **React Context**: Provides i18n functionality throughout the app
6. **Custom Hooks**: Easy-to-use translation hooks

### SOLID Principles Implementation

- **Single Responsibility**: Each service has one clear purpose
- **Open/Closed**: Easy to extend with new translation providers
- **Liskov Substitution**: Services can be swapped without breaking the app
- **Interface Segregation**: Clean, focused interfaces
- **Dependency Inversion**: High-level modules don't depend on low-level modules

## Usage

### Basic Translation

```tsx
import { useTranslation } from '@/i18n/hooks/useTranslation';

function MyComponent() {
  const { t } = useTranslation();
  
  const handleTranslate = async () => {
    const translated = await t('Hello World', { targetLanguage: 'es' });
    console.log(translated); // "Hola Mundo"
  };
  
  return <button onClick={handleTranslate}>Translate</button>;
}
```

### Real-time Translation Display

```tsx
import { useTranslatedText } from '@/i18n/hooks/useTranslation';

function MyComponent() {
  const { text, isLoading, error } = useTranslatedText('Welcome to our site', {
    targetLanguage: 'fr'
  });
  
  if (isLoading) return <div>Translating...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <h1>{text}</h1>;
}
```

### Language Selector

```tsx
import { LanguageSelector } from '@/i18n/components/LanguageSelector';

function MyComponent() {
  return (
    <LanguageSelector 
      showFlags={true}
      showNativeNames={true}
      size="md"
    />
  );
}
```

### Compact Language Selector (for headers)

```tsx
import { CompactLanguageSelector } from '@/i18n/components/LanguageSelector';

function Header() {
  return (
    <header>
      <CompactLanguageSelector />
    </header>
  );
}
```

## Configuration

### Environment Variables

Create a `.env.local` file with:

```bash
# LibreTranslate Configuration
NEXT_PUBLIC_LIBRE_TRANSLATE_URL=https://libretranslate.com
LIBRE_TRANSLATE_API_KEY=your_api_key_here

# Default Language (optional)
NEXT_PUBLIC_DEFAULT_LANGUAGE=en
```

### Custom Configuration

```tsx
import { I18nProvider } from '@/i18n/context/I18nContext';

const customConfig = {
  defaultLanguage: 'es',
  fallbackLanguage: 'en',
  libreTranslateUrl: 'https://your-instance.com',
  libreTranslateApiKey: 'your_key'
};

function App() {
  return (
    <I18nProvider config={customConfig}>
      {/* Your app */}
    </I18nProvider>
  );
}
```

## Supported Languages

The system supports 80+ languages including:

- **European**: English, Spanish, French, German, Italian, Portuguese, Dutch, Polish, Ukrainian
- **Asian**: Japanese, Korean, Chinese, Thai, Vietnamese, Indonesian, Malay
- **Middle Eastern**: Arabic, Hebrew, Persian, Turkish
- **African**: Swahili, Yoruba, Igbo, Hausa, Zulu, Afrikaans
- **Indian Subcontinent**: Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati
- **And many more...**

**Note**: Russian and Belarusian are explicitly excluded as requested.

## Performance Features

### Caching Strategy

1. **Memory Cache**: Fast in-memory storage for current session
2. **LocalStorage Cache**: Persistent storage with automatic cleanup
3. **Batch Translation**: Efficient processing of multiple texts
4. **Smart Fallbacks**: Graceful degradation on API failures

### Optimization Tips

- Use `translateBatch` for multiple texts
- Implement lazy loading for non-critical translations
- Monitor cache hit rates for performance insights

## Testing

### Running Tests

```bash
npm test -- --testPathPattern=i18n
```

### Test Coverage

The system includes comprehensive tests covering:

- Service initialization and configuration
- Translation functionality
- Caching mechanisms
- Error handling
- Language management
- Edge cases and fallbacks

### TDD Approach

Tests are written first, ensuring:

- Clear requirements definition
- Robust error handling
- Comprehensive edge case coverage
- Maintainable code structure

## API Reference

### I18nService

```tsx
class I18nService {
  async initialize(): Promise<void>
  async translate(text: string, targetLanguage?: string, sourceLanguage?: string): Promise<string>
  async translateBatch(texts: string[], targetLanguage?: string): Promise<string[]>
  async detectLanguage(text: string): Promise<string>
  getCurrentLanguage(): string
  setCurrentLanguage(languageCode: string): void
  getSupportedLanguages(): Language[]
  isLanguageSupported(languageCode: string): boolean
  getLanguageByCode(code: string): Language | undefined
  getCacheStats(): CacheStats
  clearCache(): void
}
```

### Hooks

```tsx
// Main translation hook
const { t, tBatch, currentLanguage, isLoading } = useTranslation();

// Real-time translation display
const { text, isLoading, error } = useTranslatedText(key, options);

// Batch translation display
const { texts, isLoading, error } = useTranslatedTexts(keys, options);
```

## Error Handling

The system implements comprehensive error handling:

- **API Failures**: Graceful fallback to original text
- **Network Issues**: Automatic retry with exponential backoff
- **Invalid Languages**: Validation and user feedback
- **Cache Failures**: Fallback to direct API calls

## Contributing

### Adding New Languages

1. Add language to `defaultI18nConfig` in `i18nConfig.ts`
2. Add flag emoji to `getFlagForLanguage` method
3. Update tests to include new language
4. Verify LibreTranslate support

### Adding New Translation Providers

1. Implement `TranslationService` interface
2. Create service class
3. Add configuration options
4. Update tests and documentation

## Troubleshooting

### Common Issues

1. **Translation not working**: Check LibreTranslate URL and API key
2. **Slow performance**: Monitor cache hit rates and API response times
3. **Language not supported**: Verify language code in supported languages list

### Debug Mode

Enable debug logging:

```tsx
// In development
console.log('i18n debug:', i18nService.getCacheStats());
```

## License

This i18n system is part of the Travel Project and follows the same licensing terms.
