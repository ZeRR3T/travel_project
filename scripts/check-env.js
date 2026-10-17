#!/usr/bin/env node

require('dotenv').config();

console.log('=== ПРОВЕРКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ ===\n');

const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

const optionalVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'OPENROUTER_API_KEY',
  'OPENROUTER_GEMINI_API_KEY',
  'SERPAPI_KEY',
  'ADMIN_EMAIL',
  'ADMIN_INITIAL_PASSWORD',
  'NEXT_PUBLIC_SUPPORT_EMAIL',
  'NEXT_PUBLIC_PRIVACY_EMAIL',
  'NEXT_PUBLIC_LEGAL_EMAIL'
];

const isSensitiveVar = varName =>
  /KEY|SECRET|TOKEN|PASSWORD/.test(varName) || varName === 'DATABASE_URL' || varName === 'DIRECT_URL';

console.log(' ОБЯЗАТЕЛЬНЫЕ ПЕРЕМЕННЫЕ:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(` ${varName}: ${isSensitiveVar(varName) ? '***' : value}`);
  } else {
    console.log(` ${varName}: НЕ НАСТРОЕНА`);
  }
});

console.log('\n ОПЦИОНАЛЬНЫЕ ПЕРЕМЕННЫЕ:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(` ${varName}: ${isSensitiveVar(varName) ? '***' : value}`);
  } else {
    console.log(`  ${varName}: не настроена (не критично)`);
  }
});

console.log('\n ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'не указан'}`);
console.log(`PORT: ${process.env.PORT || 'не указан'}`);

// Проверка DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  try {
    const url = new URL(dbUrl);
    console.log(`\n АНАЛИЗ DATABASE_URL:`);
    console.log(`Протокол: ${url.protocol}`);
    console.log(`Хост: ${url.hostname}`);
    console.log(`Порт: ${url.port || 'по умолчанию'}`);
    console.log(`База данных: ${url.pathname.slice(1)}`);
    console.log(`SSL: ${url.searchParams.get('sslmode') || 'не указан'}`);
  } catch (error) {
    console.log(`\n Ошибка парсинга DATABASE_URL: ${error.message}`);
  }
}

// Проверка NEXTAUTH_URL
const authUrl = process.env.NEXTAUTH_URL;
if (authUrl) {
  try {
    const url = new URL(authUrl);
    console.log(`\n АНАЛИЗ NEXTAUTH_URL:`);
    console.log(`Протокол: ${url.protocol}`);
    console.log(`Домен: ${url.hostname}`);
    console.log(`Порт: ${url.port || 'по умолчанию'}`);
    console.log(`Путь: ${url.pathname}`);
  } catch (error) {
    console.log(`\n Ошибка парсинга NEXTAUTH_URL: ${error.message}`);
  }
}

console.log('\n=== РЕКОМЕНДАЦИИ ===');
if (!process.env.DATABASE_URL) {
  console.log(' DATABASE_URL обязательна для работы приложения');
}
if (!process.env.NEXTAUTH_SECRET) {
  console.log(' NEXTAUTH_SECRET обязательна для безопасности');
}
if (!process.env.NEXTAUTH_URL) {
  console.log('  NEXTAUTH_URL рекомендуется настроить для production');
}

console.log('\n=== КОНЕЦ ПРОВЕРКИ ===');
