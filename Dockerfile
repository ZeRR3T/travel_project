# Используем официальный Node.js образ
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы конфигурации
COPY package*.json ./
COPY .npmrc ./

# Устанавливаем зависимости, игнорируя опциональные
RUN npm install --omit=optional

# Копируем исходный код
COPY . .

# Собираем приложение (игнорируя ESLint и TypeScript ошибки)
RUN npm run build

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]
