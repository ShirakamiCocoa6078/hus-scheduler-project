
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID is not set. Please check your environment variables.");
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_SECRET is not set. Please check your environment variables.");
}

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ account, profile }) {
      console.log("--- signIn Callback Start ---");
      try {
        console.log("Account:", account);
        console.log("Profile:", profile);

        if (account?.provider !== "google") {
          console.log("Provider is not Google, blocking sign in.");
          return false;
        }

        if (!profile?.email) {
            console.log("Google profile does not contain an email.");
            return '/login?error=NoEmailFromProvider';
        }

        if (profile.email.endsWith("@stu.hus.ac.jp")) {
          console.log("Domain match success for:", profile.email);
          console.log("--- signIn Callback End (Success) ---");
          return true;
        } else {
          console.warn("Domain mismatch for:", profile.email);
          console.log("--- signIn Callback End (Failure) ---");
          return '/login?error=DomainMismatch';
        }
      } catch (error) {
        console.error("Error in signIn callback:", error);
        console.log("--- signIn Callback End (Error) ---");
        return false;
      }
    },

    async jwt({ token, user, account }) {
      console.log("--- jwt Callback Start ---");
      try {
        // On initial sign-in, `user` object is available
        if (account && user) {
          console.log("First sign-in detected. Augmenting token with user ID and initial data.");
          token.id = user.id;
          token.isSetupComplete = (user as any).isSetupComplete ?? false;
          token.onboardingData = (user as any).onboardingData;
        }

        // On subsequent requests, we fetch from DB to keep the token updated
        if (token.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.name = dbUser.name;
            token.picture = dbUser.image;
            token.onboardingData = (dbUser as any).onboardingData;
            token.isSetupComplete = dbUser.isSetupComplete;
            console.log("Augmented token with DB data:", token);
          } else {
             console.warn(`User with email ${token.email} not found in DB during JWT callback.`);
          }
        }
        console.log("--- jwt Callback End ---");
        return token;
      } catch(error) {
         console.error("Error in jwt callback:", error);
         console.log("--- jwt Callback End (Error) ---");
         return token; // Return original token on error
      }
    },

    async session({ session, token }) {
      console.log("--- session Callback Start ---");
      try {
        console.log("Incoming session:", session);
        console.log("Token for session:", token);

        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.name = token.name;
          session.user.email = token.email as string;
          session.user.image = token.picture;
          session.user.onboardingData = token.onboardingData as any;
          session.user.isSetupComplete = token.isSetupComplete as boolean;
          console.log("Final session object:", session);
        } else {
           console.warn("Token or session.user is missing.");
        }
        console.log("--- session Callback End ---");
        return session;
      } catch (error) {
         console.error("Error in session callback:", error);
         console.log("--- session Callback End (Error) ---");
         return session; // Return original session on error
      }
    },
  },
  pages: {
    signIn: '/login',
  },
  debug: process.env.NODE_ENV !== 'production',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
