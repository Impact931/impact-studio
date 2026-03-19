import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@impactstudio931.com';
        const editorPassword = process.env.EDITOR_PASSWORD;

        if (!editorPassword) {
          console.error('EDITOR_PASSWORD not set in environment');
          return null;
        }

        if (
          credentials.email === adminEmail &&
          credentials.password === editorPassword
        ) {
          return {
            id: '1',
            email: adminEmail,
            name: 'Admin',
          };
        }

        // Also allow Jayson and Angus
        const allowedEmails = [
          adminEmail,
          'jayson@jhr-photography.com',
          'jayson@impactstudio931.com',
          'angus@jhr-photography.com',
        ];

        if (
          allowedEmails.includes(credentials.email) &&
          credentials.password === editorPassword
        ) {
          return {
            id: credentials.email,
            email: credentials.email,
            name: credentials.email.split('@')[0],
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};
