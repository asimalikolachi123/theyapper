"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { CheckCircle2, LoaderCircle, MailCheck } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState("Confirming your email securely…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    async function finish() {
      const errorDescription = params.get("error_description") || params.get("error");
      if (errorDescription) {
        if (active) { setFailed(true); setMessage(decodeURIComponent(errorDescription.replace(/\+/g, " "))); }
        return;
      }
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        if (active) { setFailed(true); setMessage("Authentication is not configured. Please contact support."); }
        return;
      }
      const supabase = createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const type = params.get("type");
      let error: Error | null = null;
      if (code) {
        const result = await supabase.auth.exchangeCodeForSession(code);
        error = result.error;
      } else if (tokenHash && (type === "signup" || type === "email")) {
        const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "signup" | "email" });
        error = result.error;
      } else {
        const { data } = await supabase.auth.getSession();
        if (!data.session) error = new Error("This confirmation link is invalid or has expired. Please request a new one.");
      }
      if (!active) return;
      if (error) { setFailed(true); setMessage(error.message); return; }
      setMessage("Email confirmed. Welcome to theYapper!");
      const rawNext = params.get("next") || "/";
      const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
      window.setTimeout(() => router.replace(next), 900);
    }
    void finish().catch((err: unknown) => {
      if (!active) return;
      setFailed(true);
      setMessage(err instanceof Error ? err.message : "Could not confirm your email. Please try again.");
    });
    return () => { active = false; };
  }, [params, router]);

  return <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, background: "var(--background, #f8f8fb)", color: "var(--foreground, #191923)" }}>
    <section style={{ width: "100%", maxWidth: 440, padding: 32, border: "1px solid var(--border, #e7e7ee)", borderRadius: 24, background: "var(--card, #fff)", textAlign: "center", boxShadow: "0 18px 60px rgba(30,25,80,.07)" }}>
      <div style={{ width: 56, height: 56, margin: "0 auto 18px", display: "grid", placeItems: "center", borderRadius: 18, background: failed ? "#fff1f0" : "#efedff", color: failed ? "#c2413b" : "#6759e8" }}>
        {failed ? <MailCheck size={26}/> : message.startsWith("Email confirmed") ? <CheckCircle2 size={26}/> : <LoaderCircle size={26} className="auth-callback-spinner"/>}
      </div>
      <div style={{ fontSize: 25, fontWeight: 750, letterSpacing: "-.7px", marginBottom: 10 }}>theYapper<span style={{ color: "#6759e8" }}>.</span></div>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>{failed ? "Confirmation unsuccessful" : "Email confirmation"}</h1>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--muted-foreground, #686878)", margin: 0 }}>{message}</p>
      {failed && <a href="/login" style={{ display: "inline-block", marginTop: 22, padding: "11px 18px", borderRadius: 12, background: "#6759e8", color: "white", textDecoration: "none", fontWeight: 650 }}>Return to login</a>}
    </section>
    <style jsx>{`@keyframes auth-callback-spin { to { transform: rotate(360deg); } } .auth-callback-spinner { animation: auth-callback-spin 1s linear infinite; }`}</style>
  </main>;
}
