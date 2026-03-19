import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * `auth()` や `useSession()` で返される Session オブジェクトの型を拡張。
   * デフォルトの Session.user に `id` を追加。
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
