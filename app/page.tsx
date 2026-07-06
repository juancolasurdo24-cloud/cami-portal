import Link from "next/link";
import { prisma } from "@/lib/db";
import { calendarGridRange, daysBetween, formatEs, monthRange } from "@/lib/dateUtils";
import CamiCalendarGrid from "@/components/CamiCalendarGrid";
import CamiRodajeTable from "@/components/CamiRodajeTable";
import type { CamiContent } from "@prisma/client";

export const dynamic = "force-dynamic";

function parseMonthParam(v: string | undefined): Date {
  if (!v) return new Date();
  const [y, m] = v.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, 1);
}

function mp(d: Date) {
  return formatEs(d, "yyyy-MM");
}

const STATUS_LABELS: Record<string, string> = {
  pending:   "Pendiente",
  recording: "En curso",
  recorded:  "Completado",
  published: "Posteado",
};

const STATUS_COLORS: Record<string, { bar: string; badge: string; text: string }> = {
  pending:   { bar: "bg-slate-300",  badge: "bg-slate-100",  text: "text-slate-600"  },
  recording: { bar: "bg-amber-400",  badge: "bg-amber-100",  text: "text-amber-700"  },
  recorded:  { bar: "bg-blue-400",   badge: "bg-blue-100",   text: "text-blue-700"   },
  published: { bar: "bg-green-500",  badge: "bg-green-100",  text: "text-green-700"  },
};

function ProgressView({ items, monthLabel }: { items: CamiContent[]; monthLabel: string }) {
  const total = items.length;
  const byStatus = {
    pending:   items.filter(i => i.status === "pending").length,
    recording: items.filter(i => i.status === "recording").length,
    recorded:  items.filter(i => i.status === "recorded").length,
    published: items.filter(i => i.status === "published").length,
  };
  const pct = total > 0 ? Math.round((byStatus.published / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-dismaser-navy p-8 flex items-center justify-between">
        <div>
          <p className="text-slate-300 text-sm mb-1 capitalize">{monthLabel}</p>
          <p className="text-5xl font-bold text-white">{pct}%</p>
          <p className="text-slate-300 text-sm mt-1">de cumplimiento</p>
        </div>
        <div className="text-right">
          <p className="text-white text-lg font-semibold">{byStatus.published}/{total}</p>
          <p className="text-slate-300 text-xs">posteados</p>
        </div>
      </div>

      {total > 0 && (
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 mb-3">Distribución del mes</p>
          <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
            {(["published", "recorded", "recording", "pending"] as const).map(key => {
              const w = total > 0 ? (byStatus[key] / total) * 100 : 0;
              if (w === 0) return null;
              return <div key={key} className={`${STATUS_COLORS[key].bar}`} style={{ width: `${w}%` }} title={`${STATUS_LABELS[key]}: ${byStatus[key]}`} />;
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["pending", "recording", "recorded", "published"] as const).map(key => {
              const c = STATUS_COLORS[key];
              return (
                <div key={key} className={`rounded-lg ${c.badge} px-3 py-3 text-center`}>
                  <p className={`text-2xl font-bold ${c.text}`}>{byStatus[key]}</p>
                  <p className={`text-xs mt-0.5 ${c.text} opacity-80`}>{STATUS_LABELS[key]}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {total === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-400">No hay contenidos programados para este mes.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-sm font-medium text-slate-700">{total} contenidos programados</p>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map(item => {
              const c = STATUS_COLORS[item.status] ?? STATUS_COLORS.pending;
              return (
                <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="shrink-0 w-10 text-center">
                    <p className="text-xs text-slate-400 capitalize">{formatEs(item.scheduledFor, "EEE")}</p>
                    <p className="text-base font-bold text-dismaser-navy leading-none">{formatEs(item.scheduledFor, "d")}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.requiresVisit ? "📍 Viene a grabar" : "🏠 Remoto"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${c.badge} ${c.text}`}>
                    {STATUS_LABELS[item.status] ?? item.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; tab?: string }>;
}) {
  const { month, tab } = await searchParams;
  const reference = parseMonthParam(month);
  const isProgress = tab === "avance";
  const isRodaje = tab === "rodaje";

  const { start: mStart, end: mEnd } = monthRange(reference);
  const { start: gridStart, end: gridEnd } = calendarGridRange(reference);
  const days = daysBetween(gridStart, gridEnd);

  const [gridItems, monthItems] = await Promise.all([
    prisma.camiContent.findMany({
      where: { scheduledFor: { gte: gridStart, lte: gridEnd } },
      orderBy: { scheduledFor: "asc" },
    }),
    prisma.camiContent.findMany({
      where: { scheduledFor: { gte: mStart, lte: mEnd } },
      orderBy: { scheduledFor: "asc" },
    }),
  ]);

  const prevMonth = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  const nextMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
  const currentMonthParam = mp(reference);
  const monthLabel = formatEs(reference, "MMMM yyyy");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-dismaser-navy capitalize">{monthLabel}</h1>
        <div className="flex gap-2">
          <Link href={`/?month=${mp(prevMonth)}${tab ? `&tab=${tab}` : ""}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">← Anterior</Link>
          <Link href={`/${tab ? `?tab=${tab}` : ""}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">Hoy</Link>
          <Link href={`/?month=${mp(nextMonth)}${tab ? `&tab=${tab}` : ""}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">Siguiente →</Link>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit flex-wrap">
        <Link href={`/?month=${currentMonthParam}`}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${!isProgress && !isRodaje ? "bg-white text-dismaser-navy shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          📅 Calendario
        </Link>
        <Link href={`/?month=${currentMonthParam}&tab=rodaje`}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isRodaje ? "bg-white text-dismaser-navy shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          🎬 Plan de Rodaje
        </Link>
        <Link href={`/?month=${currentMonthParam}&tab=avance`}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isProgress ? "bg-white text-dismaser-navy shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          📊 Avance del mes
        </Link>
      </div>

      {isProgress ? (
        <ProgressView items={monthItems} monthLabel={monthLabel} />
      ) : isRodaje ? (
        <CamiRodajeTable items={monthItems} />
      ) : (
        <>
          <div className="flex gap-3 flex-wrap text-xs">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">○ Pendiente</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-700">◑ En curso</span>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-blue-700">✓ Completado</span>
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-green-700">✓✓ Posteado</span>
          </div>
          <CamiCalendarGrid days={days} items={gridItems} currentMonth={reference.getMonth()} />
          <p className="text-xs text-slate-400">Clic en un día para agregar contenido. Clic en un contenido para editar o cambiar estado.</p>
        </>
      )}
    </div>
  );
}
