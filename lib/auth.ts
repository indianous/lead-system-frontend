import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

interface LoginCredentials {
  email?: string;
  password?: string;
}

interface BackendLoginResponse {
  id: string;
  name: string;
  email: string;
  token: string;
  role: string;
}

export async function authorizeCredentials(
  credentials: LoginCredentials | undefined,
): Promise<User | null> {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  const response = await fetch(`${process.env.BACKEND_API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as BackendLoginResponse;

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    accessToken: data.token,
    role: data.role,
  };
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: authorizeCredentials,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.role = token.role;
      return session;
    },
  },
};
