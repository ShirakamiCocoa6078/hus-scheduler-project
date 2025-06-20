
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions, User as NextAuthUser } from "next-auth";

// Define a custom user type that includes id
interface CustomUser extends NextAuthUser {
  id: string;
}

export const authOptions: NextAuthOptions = {
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
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your-email@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Add your own authentication logic here
        if (credentials?.email === "1234567@stu.hus.ac.jp" && credentials?.password === "test1234") {
          // Any object returned will be saved in `user` property of the JWT
          return { id: "test-user-001", name: "Test User", email: "1234567@stu.hus.ac.jp", image: null } as CustomUser;
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          // For more control, you can throw an Error here, which will be caught by NextAuth.js.
          // e.g. throw new Error("Invalid credentials");
          return null;
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (profile && 'email_verified' in profile && (profile as any).email_verified) {
          if (profile.email && profile.email.endsWith("@stu.hus.ac.jp")) {
            return true;
          } else {
            console.log("HUS Domain Mismatch (Google): ", profile.email);
            return '/login?error=DomainMismatch'; 
          }
        }
        return false; // Google email not verified or profile missing
      }
      if (account?.provider === "credentials") {
        // If authorize returned a user object, sign-in is allowed.
        return !!user;
      }
      return false; // Default to deny for other providers or issues
    },
    async jwt({ token, user, account, profile }) {
      // The `user` object is passed on initial sign-in (OAuth or Credentials)
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image; // `image` from user object (null for our test user)
      }

      // For Google OAuth, `account` and `profile` are available on initial sign-in
      if (account?.provider === "google") {
        if (account.access_token) {
          token.accessToken = account.access_token;
        }
        if (profile) {
          // Potentially override/supplement with more accurate Google profile info
          token.name = profile.name ?? token.name;
          token.email = profile.email ?? token.email;
          token.picture = (profile as any).picture ?? token.picture;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      if (token.accessToken) session.accessToken = token.accessToken as string;
      if (token.id) session.user.id = token.id as string;
      
      // Ensure all desired user properties are passed to the session
      // These should be reliably sourced from the token now
      if (token.name) session.user.name = token.name;
      if (token.email) session.user.email = token.email;
      if (token.picture) session.user.image = token.picture;
      else session.user.image = null; // Ensure image is null if not present in token
      
      return session;
    },
  },
  pages: {
    signIn: '/login',
    // error: '/auth/error', // Custom error page for NextAuth errors like "CredentialsSignin"
  },
  debug: process.env.NODE_ENV !== 'production',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
