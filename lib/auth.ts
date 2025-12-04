import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { config } from "./config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: config.auth.google.clientId,
      clientSecret: config.auth.google.clientSecret,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  trustHost: true,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Single user mode - only allow the specified email
      console.log("Sign in attempt:", {
        userEmail: user.email,
        allowedEmail: config.auth.allowedUserEmail,
        matches: user.email === config.auth.allowedUserEmail,
        account: account?.provider,
        profile: profile?.email,
      });

      if (user.email !== config.auth.allowedUserEmail) {
        console.log("Access denied - email mismatch");
        return "/auth/error?error=AccessDenied";
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: true,
});
