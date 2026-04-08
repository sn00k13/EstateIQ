import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import authConfig from './auth.config'
import { logger } from './logger'
import { isTurnstileEnforced, verifyTurnstileToken } from './turnstile'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        turnstileToken: { label: 'Turnstile', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          if (isTurnstileEnforced()) {
            const token = credentials.turnstileToken as string | undefined
            if (!token?.trim()) return null
            const ok = await verifyTurnstileToken(token)
            if (!ok) return null
          }

          const { prisma } = await import('@estateiq/database')
          const user = await prisma.authUser.findUnique({
            where: { email: credentials.email as string },
          })

          if (!user || !user.passwordHash) return null

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          )

          if (!isValid) return null

          return { id: user.id, email: user.email, name: user.name }
        } catch (err) {
          logger.error('[credentials authorize]', err)
          return null
        }
      },
    }),
  ],
})
