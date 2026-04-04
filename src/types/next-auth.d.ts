import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      plan: string;
      hasCompletedOnboarding: boolean;
      name?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    plan?: string;
    hasCompletedOnboarding?: boolean;
    password?: string | null;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId?: string;
    plan?: string;
    hasCompletedOnboarding?: boolean;
    name?: string | null;
    image?: string | null;
  }
}
