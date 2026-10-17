import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Максимальное количество попыток подключения
const MAX_RETRIES = 3;
// Базовая задержка между попытками (в миллисекундах)
const BASE_DELAY = 1000;

class PrismaClientWithRetry extends PrismaClient {
  private isConnected = false;

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      }
    });
  }

  // Метод для проверки подключения с повторными попытками
  async ensureConnection(retryCount = 0): Promise<void> {
    if (this.isConnected) return;

    try {
      // Проверяем подключение простым запросом
      await this.$queryRaw`SELECT 1`;
      this.isConnected = true;
      console.log(' Database connection established successfully');
    } catch (error) {
      console.error(` Database connection attempt ${retryCount + 1} failed:`, error);

      if (retryCount < MAX_RETRIES) {
        // Экспоненциальная задержка
        const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), 5000);
        console.log(` Retrying connection in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.ensureConnection(retryCount + 1);
      }

      this.isConnected = false;
      throw new Error('Database connection failed after multiple retries');
    }
  }

  // Переопределяем $connect для использования нашей логики
  async $connect() {
    await this.ensureConnection();
    return super.$connect();
  }

  // Метод для проверки состояния подключения
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error(' Database health check failed:', error);
      return false;
    }
  }

  // Метод для переподключения
  async reconnect(): Promise<void> {
    try {
      await this.$disconnect();
      this.isConnected = false;
      await this.ensureConnection();
    } catch (error) {
      console.error(' Database reconnection failed:', error);
      throw error;
    }
  }
}

// Создаем и экспортируем экземпляр
export const prisma = globalForPrisma.prisma ?? new PrismaClientWithRetry();

// Сохраняем экземпляр в development режиме
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Инициализируем подключение
prisma.$connect().catch(error => {
  console.error(' Initial database connection failed:', error);
});
