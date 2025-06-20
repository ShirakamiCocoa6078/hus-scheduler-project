
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

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
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        // Ensure the profile object and email_verified property exist
        if (profile && 'email_verified' in profile && (profile as any).email_verified) {
          // Also check if the email domain is allowed (if applicable)
          // Example: return profile.email.endsWith("@example.com")
          // For HUS, it's @stu.hus.ac.jp
          if (profile.email && profile.email.endsWith("@stu.hus.ac.jp")) {
            return true;
          } else {
            // User's email is verified but not from the allowed domain
            // It's better to handle this by redirecting with an error or showing a message
            // For now, returning false will prevent sign-in.
            // Consider redirecting to a custom error page: return '/auth/error?error=DomainMismatch';
            console.log("HUS Domain Mismatch: ", profile.email);
            return '/login?error=DomainMismatch'; // Redirect to login with an error
          }
        }
      }
      // For other providers or if email is not verified (though Google usually ensures this)
      return false; // Do not allow sign in
    },
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        // If you have a user id from your database you can add it here
        // token.id = user.id
      }
      if (profile) {
        // Add profile information to the token
        token.name = profile.name;
        token.email = profile.email;
        token.picture = (profile as any).picture; // or profile.image
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      session.accessToken = token.accessToken as string;
      // If you added user id to token in jwt callback, pass it to session
      // session.user.id = token.id as string;

      // Ensure all desired user properties are passed to the session
      if (token.name) session.user.name = token.name;
      if (token.email) session.user.email = token.email;
      if (token.picture) session.user.image = token.picture; // next-auth expects `image` for user avatar
      
      return session;
    },
  },
  pages: {
    signIn: '/login', // Custom login page
    // error: '/auth/error', // Custom error page (optional)
  },
  // Enable debug messages in the console if not in production
  debug: process.env.NODE_ENV !== 'production',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
