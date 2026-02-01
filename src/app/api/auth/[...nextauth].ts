import NextAuth from 'next-auth';

// A minimal NextAuth configuration.
// The Supabase session is now the source of truth, managed by @supabase/ssr.
// This file is kept for potential future use (e.g., adding OAuth providers)
// but it no longer actively manages the user's session in the same way.

const handler = NextAuth({
  providers: [
    // In the future, you could add other providers here (e.g., Google, Facebook)
    // For now, credentials-based login is handled directly by Supabase in the `login` server action.
  ],
  pages: {
    signIn: '/auth',
  },
  callbacks: {
    // Callbacks can be used to add additional data to the session object
    // but for now, we rely on the Supabase session.
    async session({ session, token }) {
      return session;
    },
    async jwt({ token, user }) {
      return token;
    },
  },
});

export { handler as GET, handler as POST };
