"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCamiContent, updateCamiContent } from "@/app/actions/cami";
import { formatEs } from "@/lib/dateUtils";
import type { CamiContent } from "@prisma/client";

export default function CamiForm({ monthParam, item }: { monthParam: string; item?: CamiContent }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      if (item) {
        await updateCamiContent(item.id, fd);
      } else {
        await createCamiContent(fd);
      }
      router.push(`/?month=${monthParam}`);
      router.refresh();
    });
  }

  const defaultDate = item ? formatEs(item.scheduledFor, "yyyy-MM-dd") : `${monthParam}-01`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de publicación</label>
          <input type="date" name="scheduledFor" defaultValue={defaultDate} required className="input w-full" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Título / Tema</label>
          <input type="text" name="title" defaultValue={item?.title ?? ""} required
            placeholder="Ej: Tutorial maquillaje verano" className="input w-full" />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-600 mb-2">¿Requiere visita para grabar?</p>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="requiresVisit" value="true" defaultChecked={item?.requiresVisit === true} className="accent-dismaser-navy" />
            <span className="text-sm text-slate-700">📍 Sí, viene a grabar</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="requiresVisit" value="false" defaultChecked={!item || item.requiresVisit === false} className="accent-dismaser-navy" />
            <span className="text-sm text-slate-700">🏠 No, es remoto</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Storyboard / Guion</label>
        <textarea name="storyboard" rows={5} defaultValue={item?.storyboard ?? ""}
          placeholder={"1. Intro: saludo + hook\n2. Desarrollo: paso a paso\n3. Cierre: CTA"}
          className="input w-full resize-y font-mono text-sm leading-relaxed" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Comentarios internos</label>
        <textarea name="comments" rows={2} defaultValue={item?.comments ?? ""}
          placeholder="Referencias, notas de producción, links..." className="input w-full resize-y text-sm" />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={isPending}
          className="rounded-md bg-dismaser-navy px-5 py-2 text-sm font-medium text-white hover:bg-dismaser-navy-light disabled:opacity-50">
          {isPending ? "Guardando…" : item ? "Guardar cambios" : "Crear contenido"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
          Cancelar
        </button>
      </div>
    </form>
  );
}
