
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions, User as NextAuthUser } from "next-auth";
import fs from "fs/promises";
import path from "path";

const tempDataPath = path.join(process.cwd(), "src", "lib", "tempData.json");

interface StoredUser {
  id: string;
  name?: string | null;
  email: string;
  password?: string; // 開発用：平文パスワード、本番ではハッシュ化必須
  image?: string | null;
  onboardingData?: {
    department?: string;
    homeStation?: string;
    universityStation?: string;
    syncMoodle?: boolean;
    completed?: boolean;
  };
}

// カスタムユーザー型をインポートされた型と一致させる
interface CustomUser extends NextAuthUser {
  id: string;
  onboardingData?: StoredUser['onboardingData'];
}


async function getUsers(): Promise<StoredUser[]> {
  try {
    const data = await fs.readFile(tempDataPath, "utf-8");
    return JSON.parse(data) as StoredUser[];
  } catch (error) {
    // ファイルが存在しない場合などは空の配列を返す
    return [];
  }
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
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials): Promise<CustomUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const users = await getUsers();
        const user = users.find(u => u.email === credentials.email);

        if (user && user.password === credentials.password) { // 開発用：平文比較
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            onboardingData: user.onboardingData,
          } as CustomUser;
        }
        return null;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (profile && 'email_verified' in profile && (profile as any).email_verified) {
          if (profile.email && profile.email.endsWith("@stu.hus.ac.jp")) {
            // Googleサインイン時にtempData.jsonにユーザーを保存または更新
            const users = await getUsers();
            let existingUser = users.find(u => u.email === profile.email);
            if (!existingUser) {
              existingUser = {
                id: user.id, // NextAuthが生成したIDを使用
                email: profile.email,
                name: profile.name,
                image: (profile as any).picture,
                onboardingData: { completed: false }
              };
              users.push(existingUser);
            } else {
              existingUser.name = profile.name ?? existingUser.name;
              existingUser.image = (profile as any).picture ?? existingUser.image;
            }
            await fs.writeFile(tempDataPath, JSON.stringify(users, null, 2));
            // userオブジェクトにオンボーディングデータを追加して authorize や jwt コールバックで使えるようにする
            (user as CustomUser).onboardingData = existingUser.onboardingData;
            return true;
          } else {
            console.log("HUSドメイン不一致 (Google): ", profile.email);
            return '/login?error=DomainMismatch'; 
          }
        }
        return false; 
      }
      if (account?.provider === "credentials") {
        // 認証プロバイダのauthorize関数でユーザーは既に検証済み
        return !!user;
      }
      return false; 
    },
    async jwt({ token, user, account, profile }) {
        // 初期サインイン時には`user`オブジェクトが存在します。
        // これを使ってトークンを初期化します。
        if (user) {
            token.id = user.id;
            token.onboardingData = (user as CustomUser).onboardingData;
        }

        // セッションが要求されるたびに、DB（tempData.json）から最新のユーザー情報を取得してトークンを更新します。
        // これにより、オンボーディング完了などの状態変化が即座にセッションに反映されるようになります。
        if (token.email) {
            const users = await getUsers();
            const dbUser = users.find(u => u.email === token.email);
            if (dbUser) {
                token.id = dbUser.id;
                token.name = dbUser.name;
                token.picture = dbUser.image;
                token.onboardingData = dbUser.onboardingData;
            }
        }
        
        return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.image = token.picture as string | null | undefined;
      session.user.onboardingData = token.onboardingData as CustomUser['onboardingData'];
      
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  debug: process.env.NODE_ENV !== 'production',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
