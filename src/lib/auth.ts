import bcrypt from "bcryptjs"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH

        if (!adminEmail || (!adminPassword && !adminPasswordHash)) return null
        if (credentials?.email !== adminEmail) return null

        let passwordValid = false
        if (adminPasswordHash) {
          passwordValid = await bcrypt.compare(credentials?.password ?? "", adminPasswordHash)
        } else if (adminPassword) {
          passwordValid = credentials?.password === adminPassword
        }

        if (!passwordValid) return null
        return { id: "admin", email: adminEmail, name: "Admin" }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = "admin"
      return token
    },
    async session({ session, token }) {
      if (session.user && token.role) {
        (session.user as { role?: string }).role = token.role as string
      }
      return session
    },
  },
}
