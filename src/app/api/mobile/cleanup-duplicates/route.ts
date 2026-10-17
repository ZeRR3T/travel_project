import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyMobileToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = verifyMobileToken(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    console.log(' Cleaning up duplicate transactions for user:', user.userId);

    // Находим все транзакции пользователя
    const allTransactions = await prisma.transaction.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' }
    });

    console.log(' Found transactions:', allTransactions.length);

    // Ищем дубли по сумме и типу, независимо от времени
    const duplicates = [];
    const processed = new Set();

    for (let i = 0; i < allTransactions.length; i++) {
      if (processed.has(i)) continue;
      
      const current = allTransactions[i];
      
      for (let j = i + 1; j < allTransactions.length; j++) {
        if (processed.has(j)) continue;
        
        const other = allTransactions[j];
        
        // Проверяем дубли по сумме и типу
        if (current.amount === other.amount && current.type === other.type) {
          // Если одна транзакция "Stripe payment", а другая "Balance top-up" - это дубль
          if (current.description?.includes('Stripe payment') && other.description?.includes('Balance top-up')) {
            duplicates.push({ keep: current, delete: other });
            processed.add(i);
            processed.add(j);
            console.log(' Found duplicate: Stripe payment vs Balance top-up, amount:', current.amount);
          } else if (other.description?.includes('Stripe payment') && current.description?.includes('Balance top-up')) {
            duplicates.push({ keep: other, delete: current });
            processed.add(i);
            processed.add(j);
            console.log(' Found duplicate: Balance top-up vs Stripe payment, amount:', current.amount);
          }
          // Если обе транзакции имеют одинаковое описание - это тоже дубль
          else if (current.description === other.description && current.description?.includes('Stripe payment')) {
            duplicates.push({ keep: current, delete: other });
            processed.add(i);
            processed.add(j);
            console.log(' Found duplicate: Same Stripe payment description, amount:', current.amount);
          }
        }
      }
    }

    console.log(' Found duplicate pairs:', duplicates.length);

    // Удаляем дублирующие транзакции
    let deletedCount = 0;
    for (const duplicate of duplicates) {
      try {
        await prisma.transaction.delete({
          where: { id: duplicate.delete.id }
        });
        deletedCount++;
        console.log(' Deleted duplicate transaction:', duplicate.delete.id);
      } catch (error) {
        console.error(' Error deleting transaction:', duplicate.delete.id, error);
      }
    }

    console.log(' Cleanup completed. Deleted transactions:', deletedCount);

    // Дополнительно: удаляем все старые транзакции, оставляем только последние 5
    if (allTransactions.length > 5) {
      const transactionsToDelete = allTransactions.slice(5);
      console.log(' Additional cleanup: removing old transactions, keeping only latest 5');
      
      for (const transaction of transactionsToDelete) {
        try {
          await prisma.transaction.delete({
            where: { id: transaction.id }
          });
          deletedCount++;
          console.log(' Deleted old transaction:', transaction.id, 'amount:', transaction.amount);
        } catch (error) {
          console.error(' Error deleting old transaction:', transaction.id, error);
        }
      }
      
      console.log(' Total deleted transactions (duplicates + old):', deletedCount);
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} transactions (duplicates + old)`,
      deletedCount,
      totalTransactions: allTransactions.length,
      keptTransactions: Math.min(allTransactions.length, 5)
    });

  } catch (error) {
    console.error(' Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
