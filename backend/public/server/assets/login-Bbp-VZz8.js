import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { N as NetworkBackground } from "./NetworkBackground-DmE_2rcg.js";
import { B as Button } from "./button-BXrfXN_b.js";
import { I as Input } from "./input-DwaGuH4D.js";
import { L as Label } from "./label-Brw405F4.js";
import { u as useAuth } from "./router-BHOai5Fo.js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
import "@tanstack/react-query";
function LoginPage() {
  const {
    login
  } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin@123!");
  const [loading, setLoading] = useState(false);
  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success("Welcome back!");
      nav({
        to: "/dashboard"
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4", children: [
    /* @__PURE__ */ jsx(NetworkBackground, { className: "opacity-50" }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 backdrop-blur", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", className: "font-mono text-xs text-muted-foreground hover:text-foreground", children: "← back" }),
      /* @__PURE__ */ jsx("img", { src: "/logo.png", alt: "SCINetwork logo", className: "mt-4 h-12 w-12 rounded-md object-contain" }),
      /* @__PURE__ */ jsx("h1", { className: "mt-3 text-2xl font-bold tracking-tight", children: "Sign in to SCINetwork" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Akses dashboard observability jaringan." }),
      /* @__PURE__ */ jsxs("form", { onSubmit, className: "mt-6 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "username", children: "Username" }),
          /* @__PURE__ */ jsx(Input, { id: "username", autoComplete: "username", value: username, onChange: (e) => setUsername(e.target.value), required: true })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: "Password" }),
          /* @__PURE__ */ jsx(Input, { id: "password", type: "password", autoComplete: "current-password", value: password, onChange: (e) => setPassword(e.target.value), required: true })
        ] }),
        /* @__PURE__ */ jsxs(Button, { type: "submit", className: "w-full", disabled: loading, children: [
          loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(LogIn, { className: "mr-2 h-4 w-4" }),
          "Login"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mt-6 text-center text-sm text-muted-foreground", children: [
        "Belum punya akun?",
        " ",
        /* @__PURE__ */ jsx(Link, { to: "/register", className: "text-primary hover:underline", children: "Register" })
      ] })
    ] })
  ] });
}
export {
  LoginPage as component
};
