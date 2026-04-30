import type { NextAuthConfig } from 'next-auth';
 
export const authConfig = {
  pages: {
    signIn: '/login', // Tu página de login que ya diseñaste
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/jardin');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirige al login si no está logueado
      }
      return true;
    },
  },
  providers: [], 
} satisfies NextAuthConfig;