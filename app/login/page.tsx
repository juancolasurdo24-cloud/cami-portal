import { login } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50 z-50">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-dismaser-navy text-white text-2xl mb-4">
            🎬
          </div>
          <h1 className="text-2xl font-bold text-dismaser-navy">Panel Cami</h1>
          <p className="text-slate-500 text-sm mt-1">Planificación de contenidos</p>
        </div>

        <form
          action={login}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Usuario
            </label>
            <input
              type="text"
              name="username"
              required
              autoComplete="username"
              className="input w-full"
              placeholder="Usuario"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="input w-full"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center bg-red-50 rounded-lg py-2">
              Usuario o contraseña incorrectos
            </p>
          )}

          <button
            type="submit"
            className="mt-1 rounded-md bg-dismaser-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-dismaser-navy-light transition-colors"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
