"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function VerifyContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      console.error("Verification error:", error);
    } else if (token) {
      console.log("Verification token:", token);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-cyan-400 mb-4 text-center">
          メール認証中
        </h1>
        <p className="text-gray-400 text-center">認証処理を実行しています...</p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
          <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-xl p-8">
            <h1 className="text-3xl font-bold text-cyan-400 mb-4 text-center">
              メール認証中
            </h1>
            <p className="text-gray-400 text-center">読み込み中...</p>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
