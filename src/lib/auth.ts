import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { verify } from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { getJwtSecret } from './jwt-secret';

// Логирование конфигурации OAuth
console.log(' NextAuth Configuration Check:');
console.log(' GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? ' Present' : ' Missing');
console.log(' GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? ' Present' : ' Missing');
console.log(' NEXTAUTH_URL:', process.env.NEXTAUTH_URL || ' Missing');
console.log(' NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? ' Present' : ' Missing');

/**
 * Google OAuth Configuration:
 * - scope: 'openid email profile' - запрашиваем базовую информацию о пользователе
 * - prompt: 'consent' - принудительно показываем consent screen
 * - access_type: 'offline' - получаем refresh token для долгосрочного доступа
 * - include_granted_scopes: 'true' - показываем все запрошенные разрешения
 * 
 * Данные, которые становятся доступны сайту:
 * - email: адрес электронной почты пользователя
 * - name: полное имя пользователя
 * - picture: URL аватара пользователя
 * - email_verified: статус верификации email
 */

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth провайдер (добавляется только если настроены ключи)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                scope: 'openid email profile',
                prompt: 'consent',
                access_type: 'offline',
                response_type: 'code',
                // Принудительно показывать consent screen
                include_granted_scopes: 'true'
              }
            },
            // Дополнительные настройки для лучшего контроля
            profile(profile) {
              console.log(' Google OAuth profile received:', {
                sub: profile.sub,
                name: profile.name,
                email: profile.email,
                picture: profile.picture ? 'present' : 'missing',
                email_verified: profile.email_verified
              });
              
              return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
                emailVerified: profile.email_verified
              }
            }
          })
        ] 
      : []),
    // Credentials провайдер
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Включаем отладку для продакшена
  pages: {
    signIn: "/login",
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: true
      }
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        sameSite: 'strict',
        path: '/',
        secure: true
      }
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: true
      }
    }
  },
  callbacks: {
    async jwt({ token, user, account }: any) {
      console.log(' JWT Callback:', {
        hasUser: !!user,
        hasToken: !!token,
        tokenId: token?.id,
        userEmail: user?.email,
        provider: account?.provider,
        environment: process.env.NODE_ENV,
        tokenKeys: token ? Object.keys(token) : 'no token'
      });
      
      if (user) {
        token.id = user.id;
        token.provider = account?.provider || 'credentials';
        token.email = user.email;
        token.name = user.name;
        console.log(' Updated token with user data:', {
          id: token.id,
          email: token.email,
          provider: token.provider
        });
      }
      return token;
    },
    async session({ session, token }: any) {
      console.log(' Session Callback:', {
        hasSession: !!session,
        hasToken: !!token,
        sessionUser: session?.user?.email,
        tokenId: token?.id,
        environment: process.env.NODE_ENV
      });
      
      if (token && session.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
          provider: token.provider as string,
          email: token.email as string,
          name: token.name as string,
        };
      }
      return session;
    },
    async signIn({ user, account, profile }: any) {
      if (account?.provider === 'google') {
        try {
          console.log('Google OAuth sign in attempt:', {
            email: user.email,
            name: user.name,
            provider: account.provider,
            scope: account.scope,
            access_token: account.access_token ? 'present' : 'missing',
            id_token: account.id_token ? 'present' : 'missing'
          });
          
          // Проверяем, что у нас есть необходимые разрешения
          if (!account.scope || !account.scope.includes('email')) {
            console.warn('Google OAuth: Missing required email scope');
            return false;
          }
          
          // Логируем информацию о запрошенных разрешениях
          console.log('Google OAuth scopes requested:', account.scope);
          console.log('Google OAuth profile data available:', {
            hasEmail: !!user.email,
            hasName: !!user.name,
            hasImage: !!user.image,
            emailVerified: profile?.email_verified
          });
          
          // Проверяем, существует ли пользователь с таким email
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email || '' }
          });

          if (existingUser) {
            // Если пользователь существует, обновляем его данные
            console.log('Updating existing user with Google OAuth data:', {
              email: user.email,
              name: user.name || existingUser.name,
              image: user.image || existingUser.image,
              emailVerified: true
            });
            
            await prisma.user.update({
              where: { email: user.email || '' },
              data: {
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
                provider: 'google',
                emailVerified: true, // Google OAuth users have verified emails
              }
            });

            // Создаем или обновляем OAuth аккаунт
            console.log('Upserting OAuth account for existing user:', {
              userId: existingUser.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              scope: account.scope
            });
            
            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: 'google',
                  providerAccountId: account.providerAccountId || '',
                },
              },
              update: {
                access_token: account.access_token,
                expires_at: account.expires_at,
                refresh_token: account.refresh_token,
                scope: account.scope,
                token_type: account.token_type,
                id_token: account.id_token,
              },
              create: {
                userId: existingUser.id,
                type: account.type || 'oauth',
                provider: account.provider,
                providerAccountId: account.providerAccountId || '',
                access_token: account.access_token,
                expires_at: account.expires_at,
                refresh_token: account.refresh_token,
                scope: account.scope,
                token_type: account.token_type,
                id_token: account.id_token,
              },
            });

            // Возвращаем true для успешного входа
            console.log('Google OAuth sign in successful for existing user:', user.email);
            return true;
          } else {
            // Если пользователь не существует, создаем нового
            console.log('Creating new Google OAuth user with data:', {
              email: user.email,
              name: user.name,
              image: user.image,
              emailVerified: true
            });
            
            const newUser = await prisma.user.create({
              data: {
                email: user.email || '',
                name: user.name || '',
                image: user.image || '',
                provider: 'google',
                emailVerified: true, // Google OAuth users have verified emails
              }
            });

            // Создаем OAuth аккаунт для нового пользователя
            console.log('Creating OAuth account for new user:', {
              userId: newUser.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              scope: account.scope
            });
            
            await prisma.account.create({
              data: {
                userId: newUser.id,
                type: account.type || 'oauth',
                provider: account.provider,
                providerAccountId: account.providerAccountId || '',
                access_token: account.access_token,
                expires_at: account.expires_at,
                refresh_token: account.refresh_token,
                scope: account.scope,
                token_type: account.token_type,
                id_token: account.id_token,
              },
            });

            console.log('Google OAuth sign in successful for user:', user.email);
            return true;
          }
        } catch (error) {
          console.error('Error during Google sign in:', error);
          console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
            userEmail: user.email
          });
          return false;
        }
      }
      return true;
    },
  },
};

// Helper function to register new user
export async function registerUser(email: string, password: string, name: string) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        provider: 'credentials'
      }
    });

    return { id: newUser.id, email: newUser.email, name: newUser.name };
  } catch (error) {
    console.error('Database error during user registration:', error);
    throw error;
  }
}

// Helper function to get all users (for debugging)
export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, provider: true, createdAt: true }
    });
    return users;
  } catch (error) {
    console.error('Database error fetching users:', error);
    return [];
  }
}

export interface DecodedToken {
  userId: string;
  email: string;
  name: string;
  provider: string;
}

export function verifyToken(request: NextRequest): DecodedToken | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = verify(token, getJwtSecret());
    if (
      typeof decoded !== 'object'
      || decoded === null
      || typeof decoded.userId !== 'string'
      || typeof decoded.email !== 'string'
    ) {
      return null;
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      name: typeof decoded.name === 'string' ? decoded.name : '',
      provider: typeof decoded.provider === 'string' ? decoded.provider : 'credentials'
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Функция для проверки мобильных токенов (строк)
export function verifyMobileToken(token: string): DecodedToken | null {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    const decoded = verify(cleanToken, getJwtSecret());
    if (
      typeof decoded !== 'object'
      || decoded === null
      || typeof decoded.userId !== 'string'
      || typeof decoded.email !== 'string'
    ) {
      return null;
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      name: typeof decoded.name === 'string' ? decoded.name : '',
      provider: typeof decoded.provider === 'string' ? decoded.provider : 'mobile'
    };
  } catch (error) {
    console.error('Mobile token verification error:', error);
    return null;
  }
}
