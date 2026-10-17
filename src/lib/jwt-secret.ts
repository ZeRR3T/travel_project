export function getJwtSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required for JWT operations.');
  }

  return secret;
}
