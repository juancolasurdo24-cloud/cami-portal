"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CamiContent } from "@prisma/client";
import { setCamiStatus, deleteCamiContent } from "@/app/actions/cami";

const DAY_NAMES_UTC = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const STATUS_LABEL: Record<string, string> = {
  pending:   "Pendiente",
  recording: "En curso",
  recorded:  "Completado",
  published: "Posteado",
};
const STATUS_STYLE: Record<string, string> = {
  pending:   "bg-slate-100 text-slate-500",
  recording: "bg-amber-100 text-amber-700",
  recorded:  "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-700",
};
const STATUS_ORDER = ["pending", "recording", "recorded", "published"] as const;

const PLATFORM_ICON: Record<string, string> = {
  tiktok:    "🎵",
  youtube:   "▶️",
  instagram: "📸",
  facebook:  "👍",
};

const MONTHS_ES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];

function nextStatus(s: string) {
  const i = STATUS_ORDER.indexOf(s as (typeof STATUS_ORDER)[number]);
  return STATUS_ORDER[(i + 1) % STATUS_ORDER.length];
}

function groupByWeek(items: CamiContent[]) {
  const map = new Map<string, CamiContent[]>();
  for (const item of items) {
    const d = item.scheduledFor;
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
    const key = mon.toISOString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, items]) => items);
}

function weekLabel(items: CamiContent[]) {
  const first = items[0]!.scheduledFor;
  const last  = items[items.length - 1]!.scheduledFor;
  const dStart = first.getUTCDate();
  const dEnd   = last.getUTCDate();
  const mEnd   = last.getUTCMonth();
  return `${dStart} al ${dEnd} de ${MONTHS_ES[mEnd]}`;
}

export default function CamiGrillaTab({
  items,
  monthLabel,
  monthParam,
}: {
  items: CamiContent[];
  monthLabel: string;
  monthParam: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const total     = items.length;
  const published = items.filter((i) => i.status === "published").length;
  const pct       = total > 0 ? Math.round((published / total) * 100) : 0;

  const weeks = groupByWeek(items);

  function handleStatus(id: string, current: string) {
    startTransition(async () => {
      await setCamiStatus(id, nextStatus(current));
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este contenido?")) return;
    startTransition(async () => {
      await deleteCamiContent(id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Mini avance */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3">
        <div className="flex-1">
          <p className="text-xs text-slate-400 mb-1 capitalize">{monthLabel}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-dismaser-maroon rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-slate-700 tabular-nums w-16 text-right">
              {published}/{total} posteados
            </span>
          </div>
        </div>
        <Link
          href={`/?month=${monthParam}&tab=avance`}
          className="shrink-0 text-xs font-medium text-dismaser-navy hover:underline"
        >
          Ver avance →
        </Link>
      </div>

      {/* Empty state */}
      {total === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-400 text-sm">No hay contenidos programados este mes.</p>
          <p className="text-slate-400 text-xs mt-1">
            Usá el{" "}
            <Link href={`/?month=${monthParam}`} className="text-dismaser-navy underline">
              Calendario
            </Link>{" "}
            para agregar.
          </p>
        </div>
      )}

      {/* Weeks */}
      {weeks.map((weekItems) => (
        <div key={weekItems[0]!.id}>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1 mb-2 flex items-center gap-2">
            Semana {weekLabel(weekItems)}
            <span className="flex-1 h-px bg-slate-200" />
          </p>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400 tracking-wide w-20">Fecha</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 tracking-wide w-24">Plataforma</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 tracking-wide">Título</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 tracking-wide w-24">Prioridad</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 tracking-wide w-28">Estado</th>
                    <th className="px-3 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {weekItems.map((item, idx) => {
                    const statusCls = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;
                    const icon = PLATFORM_ICON[item.platform ?? ""] ?? "—";
                    return (
                      <tr
                        key={item.id}
                        className={`${idx > 0 ? "border-t border-slate-100" : ""} hover:bg-slate-50/50 transition-colors`}
                      >
                        {/* Fecha */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-dismaser-navy text-base leading-none tabular-nums">
                            {item.scheduledFor.getUTCDate()}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 capitalize">
                            {DAY_NAMES_UTC[item.scheduledFor.getUTCDay()]}
                          </div>
                        </td>

                        {/* Plataforma */}
                        <td className="px-3 py-3">
                          <span className="text-sm">
                            {icon} {item.platform ? item.platform.charAt(0).toUpperCase() + item.platform.slice(1) : "Sin def."}
                          </span>
                        </td>

                        {/* Título */}
                        <td className="px-3 py-3">
                          <p className="text-sm font-medium text-slate-800 leading-snug">{item.title}</p>
                          {item.requiresVisit && (
                            <p className="text-xs text-slate-400 mt-0.5">📍 Viene a grabar</p>
                          )}
                        </td>

                        {/* Prioridad */}
                        <td className="px-3 py-3">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            item.priority === "alta"  ? "bg-red-100 text-red-700" :
                            item.priority === "baja"  ? "bg-green-100 text-green-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {item.priority === "alta" ? "🔴" : item.priority === "baja" ? "🟢" : "🟡"}{" "}
                            {item.priority ? item.priority.charAt(0).toUpperCase() + item.priority.slice(1) : "Media"}
                          </span>
                        </td>

                        {/* Estado */}
                        <td className="px-3 py-3">
                          <button
                            onClick={() => handleStatus(item.id, item.status)}
                            disabled={isPending}
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer hover:opacity-75 transition-opacity disabled:opacity-40 ${statusCls}`}
                          >
                            {STATUS_LABEL[item.status] ?? item.status}
                          </button>
                        </td>

                        {/* Eliminar */}
                        <td className="px-3 py-3">
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={isPending}
                            className="text-slate-300 hover:text-red-500 transition-colors text-lg leading-none"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
