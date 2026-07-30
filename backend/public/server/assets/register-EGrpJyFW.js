import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { N as NetworkBackground } from "./NetworkBackground-DmE_2rcg.js";
import { B as Button } from "./button-BXrfXN_b.js";
import { I as Input } from "./input-DwaGuH4D.js";
import { L as Label } from "./label-Brw405F4.js";
import { u as useAuth } from "./router-D-aI0tZc.js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
import "@tanstack/react-query";
function RegisterPage() {
  const {
    register
  } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    full_name: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  function set(k, v) {
    setForm((f) => ({
      ...f,
      [k]: v
    }));
  }
  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created. Please login.");
      nav({
        to: "/login"
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10", children: [
    /* @__PURE__ */ jsx(NetworkBackground, { className: "opacity-50" }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 backdrop-blur", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", className: "font-mono text-xs text-muted-foreground hover:text-foreground", children: "← back" }),
      /* @__PURE__ */ jsx("img", { src: "/logo.png", alt: "SCINetwork logo", className: "mt-4 h-12 w-12 rounded-md object-contain" }),
      /* @__PURE__ */ jsx("h1", { className: "mt-3 text-2xl font-bold tracking-tight", children: "Create account" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Daftar untuk akses SCINetwork." }),
      /* @__PURE__ */ jsxs("form", { onSubmit, className: "mt-6 space-y-4", children: [
        /* @__PURE__ */ jsx(Field, { label: "Full name", id: "full_name", value: form.full_name, onChange: (v) => set("full_name", v) }),
        /* @__PURE__ */ jsx(Field, { label: "Username", id: "username", value: form.username, onChange: (v) => set("username", v) }),
        /* @__PURE__ */ jsx(Field, { label: "Email", id: "email", type: "email", value: form.email, onChange: (v) => set("email", v) }),
        /* @__PURE__ */ jsx(Field, { label: "Password", id: "password", type: "password", value: form.password, onChange: (v) => set("password", v) }),
        /* @__PURE__ */ jsxs(Button, { type: "submit", className: "w-full", disabled: loading, children: [
          loading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(UserPlus, { className: "mr-2 h-4 w-4" }),
          "Register"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mt-6 text-center text-sm text-muted-foreground", children: [
        "Sudah punya akun?",
        " ",
        /* @__PURE__ */ jsx(Link, { to: "/login", className: "text-primary hover:underline", children: "Login" })
      ] })
    ] })
  ] });
}
function Field({
  label,
  id,
  value,
  onChange,
  type = "text"
}) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsx(Label, { htmlFor: id, children: label }),
    /* @__PURE__ */ jsx(Input, { id, type, value, onChange: (e) => onChange(e.target.value), required: true })
  ] });
}
export {
  RegisterPage as component
};
