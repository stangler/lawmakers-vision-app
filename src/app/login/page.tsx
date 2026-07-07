"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const result = await signIn("resend", {
        email,
        redirect: false,
      });

      if (result?.ok) {
        setMessage("ログインリンクを送信しました。メールを確認してください。");
      } else {
        setMessage("エラーが発生しました。もう一度お試しください。");
      }
    } catch (error) {
      setMessage("エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2 text-center">
          国会議員ビジョン
        </h1>
        <p className="text-gray-400 text-center mb-8">ログイン</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            {isLoading ? "送信中..." : "ログインリンクを送信"}
          </button>

          {message && (
            <div
              className={`text-center text-sm ${message.includes("エラー") ? "text-red-400" : "text-green-400"}`}
            >
              {message}
            </div>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>マジックリンクを送信します</p>
          <p className="mt-2">リンクの有効期限は24時間です</p>
        </div>
      </div>
    </div>
  );
}
