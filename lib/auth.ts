import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { config } from "@/lib/config";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db) as any,
  providers: [
    GoogleProvider({
      clientId: config.auth.googleClientId,
      clientSecret: config.auth.googleClientSecret,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.email !== config.auth.allowedUserEmail) {
        console.error(`Access denied for ${user.email}. Only ${config.auth.allowedUserEmail} is allowed.`);
        return false;
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard after sign in
      if (url.startsWith(baseUrl)) {
        const urlObj = new URL(url);
        if (urlObj.pathname === "/" || urlObj.pathname === "/auth/signin") {
          return `${baseUrl}/dashboard`;
        }
        return url;
      }
      return `${baseUrl}/dashboard`;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
