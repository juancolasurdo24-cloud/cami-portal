"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (username === "Cami" && password === "Disma2383") {
    const store = await cookies();
    store.set("cami_session", "cami_auth_ok", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    redirect("/");
  }

  redirect("/login?error=1");
}

export async function logout() {
  const store = await cookies();
  store.delete("cami_session");
  redirect("/login");
}
