import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  const admin = await prisma.adminUser.findFirst({
    where: {
      email: session.user.email,
      isActive: true,
      role: 'super_admin'
    },
    select: { id: true }
  });

  return NextResponse.json({ isAdmin: Boolean(admin) });
}
