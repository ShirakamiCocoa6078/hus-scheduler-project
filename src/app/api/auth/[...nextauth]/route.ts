
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
        email: { label: "メールアドレス", type: "email", placeholder: "your-email@example.com" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials, req) {
        if (credentials?.email === "1234567@stu.hus.ac.jp" && credentials?.password === "test1234") {
          return { id: "test-user-001", name: "テストユーザー", email: "1234567@stu.hus.ac.jp", image: null } as CustomUser;
        } else {
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
            console.log("HUSドメイン不一致 (Google): ", profile.email);
            // エラーメッセージはログインページで処理される
            return '/login?error=DomainMismatch'; 
          }
        }
        return false; 
      }
      if (account?.provider === "credentials") {
        return !!user;
      }
      return false; 
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image; 
      }

      if (account?.provider === "google") {
        if (account.access_token) {
          token.accessToken = account.access_token;
        }
        if (profile) {
          token.name = profile.name ?? token.name;
          token.email = profile.email ?? token.email;
          token.picture = (profile as any).picture ?? token.picture;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.accessToken) session.accessToken = token.accessToken as string;
      if (token.id) session.user.id = token.id as string;
      
      if (token.name) session.user.name = token.name;
      if (token.email) session.user.email = token.email;
      if (token.picture) session.user.image = token.picture;
      else session.user.image = null; 
      
      return session;
    },
  },
  pages: {
    signIn: '/login',
    // error: '/auth/error', // カスタムエラーページ
  },
  debug: process.env.NODE_ENV !== 'production',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
