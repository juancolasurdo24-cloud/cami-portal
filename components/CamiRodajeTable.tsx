"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CamiContent } from "@prisma/client";
import { formatEs } from "@/lib/dateUtils";
import { updateSingleRodajeField } from "@/app/actions/cami";

const STATUS_BADGE: Record<string, string> = {
  pending:   "bg-slate-100 text-slate-500",
  recording: "bg-amber-100 text-amber-700",
  recorded:  "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-700",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente", recording: "En curso", recorded: "Completado", published: "Posteado",
};

const COLUMNS = [
  { field: "businessUnit", label: "Unidad de negocio",               multiline: false },
  { field: "equipment",    label: "Máquinas / Equipos",              multiline: false },
  { field: "location",     label: "Espacio sugerido",                multiline: false },
  { field: "staging",      label: "Puesta en escena & acciones clave", multiline: true  },
] as const;

type Field = typeof COLUMNS[number]["field"] | "title" | "status" | "priority";

const STATUS_ORDER   = ["pending", "recording", "recorded", "published"] as const;
const PRIORITY_ORDER = ["baja", "media", "alta"] as const;

const PLATFORM_DISPLAY: Record<string, { icon: string; label: string; color: string }> = {
  tiktok:    { icon: "🎵", label: "TikTok",    color: "bg-black text-white"              },
  youtube:   { icon: "▶️", label: "YouTube",   color: "bg-red-100 text-red-700"          },
  instagram: { icon: "📸", label: "Instagram", color: "bg-pink-100 text-pink-700"        },
  facebook:  { icon: "👍", label: "Facebook",  color: "bg-blue-100 text-blue-700"        },
};

const PRIORITY_STYLE: Record<string, { badge: string; dot: string; label: string }> = {
  baja:  { badge: "bg-green-100 text-green-700", dot: "bg-green-500", label: "Baja"  },
  media: { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-400", label: "Media" },
  alta:  { badge: "bg-red-100   text-red-700",   dot: "bg-red-500",   label: "Alta"  },
};
type EditCell = { id: string; field: Field };

function EditableCell({
  id,
  field,
  value,
  multiline,
  isActive,
  onActivate,
}: {
  id: string;
  field: Field;
  value: string;
  multiline: boolean;
  isActive: boolean;
  onActivate: (id: string, field: Field, value: string) => void;
}) {
  const filled = value.trim().length > 0;

  if (isActive) return null; // rendered by parent

  return (
    <td
      onClick={() => onActivate(id, field, value)}
      className={`group px-3 py-2 align-top cursor-pointer border-r border-slate-100 transition-colors hover:bg-blue-50 ${
        filled ? "bg-white" : "bg-slate-50/60"
      }`}
      style={{ minWidth: 140, maxWidth: 220 }}
    >
      {filled ? (
        <span className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{value}</span>
      ) : (
        <span className="text-xs text-slate-300 group-hover:text-blue-400 transition-colors select-none">
          + completar
        </span>
      )}
    </td>
  );
}

export default function CamiRodajeTable({ items }: { items: CamiContent[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [editCell, setEditCell] = useState<EditCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  useEffect(() => {
    if (editCell && inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [editCell]);

  function startEdit(id: string, field: Field, value: string) {
    setEditCell({ id, field });
    setEditValue(value);
  }

  function saveCell() {
    if (!editCell) return;
    const { id, field } = editCell;
    const val = editValue;
    setEditCell(null);
    startTransition(async () => {
      await updateSingleRodajeField(id, field, val);
      router.refresh();
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setEditCell(null); }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveCell(); }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-slate-400">No hay contenidos en el calendario para este mes.</p>
        <p className="text-xs text-slate-300 mt-1">Agregá contenido desde la pestaña Calendario.</p>
      </div>
    );
  }

  // Count filled cells per item for progress
  const totalCells = items.length * COLUMNS.length;
  const filledCells = items.reduce((acc, item) =>
    acc + COLUMNS.filter(c => (item[c.field] ?? "").trim().length > 0).length, 0);
  const fillPct = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Fill progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-2 rounded-full bg-dismaser-navy transition-all duration-500"
            style={{ width: `${fillPct}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 shrink-0 tabular-nums">
          {filledCells}/{totalCells} celdas completadas ({fillPct}%)
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-dismaser-navy text-white text-xs">
              <th className="px-4 py-3 text-left font-medium w-[170px] border-r border-white/10">Jornada / Pieza</th>
              {COLUMNS.map(c => (
                <th key={c.field} className="px-3 py-3 text-left font-medium border-r border-white/10">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, rowIdx) => {
              const rowBg = rowIdx % 2 === 0 ? "" : "bg-slate-50/40";
              return (
                <tr key={item.id} className={`border-b border-slate-100 ${rowBg}`}>
                  {/* Jornada / Pieza */}
                  <td className="px-3 py-2 align-top border-r border-slate-100">
                    <div className="flex items-start gap-2">
                      {/* Date block */}
                      <div className="shrink-0 rounded-md bg-dismaser-navy px-2 py-1 text-center min-w-[34px]">
                        <p className="text-[9px] text-slate-300 capitalize leading-tight">{formatEs(item.scheduledFor, "EEE")}</p>
                        <p className="text-sm font-bold text-white leading-none">{formatEs(item.scheduledFor, "d")}</p>
                      </div>

                      <div className="min-w-0 flex-1 flex flex-col gap-1">
                        {/* Editable title */}
                        {editCell?.id === item.id && editCell?.field === "title" ? (
                          <input
                            ref={inputRef as React.RefObject<HTMLInputElement>}
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={saveCell}
                            onKeyDown={handleKeyDown}
                            className="w-full rounded border border-blue-400 bg-blue-50 px-1.5 py-0.5 text-xs outline-none focus:ring-2 focus:ring-blue-300"
                          />
                        ) : (
                          <p
                            onClick={() => startEdit(item.id, "title", item.title)}
                            className="text-xs font-medium text-slate-800 leading-snug cursor-pointer hover:text-blue-600 hover:underline"
                            title="Clic para editar"
                          >
                            {item.title}
                          </p>
                        )}

                        {/* Badges row: platform + status + priority */}
                        <div className="flex flex-wrap gap-1">
                          {/* Platform badge */}
                          {item.platform && PLATFORM_DISPLAY[item.platform] ? (
                            <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${PLATFORM_DISPLAY[item.platform].color}`}>
                              {PLATFORM_DISPLAY[item.platform].icon} {PLATFORM_DISPLAY[item.platform].label}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-400">
                              Sin plataforma
                            </span>
                          )}

                          {/* Status cycle */}
                          <button
                            type="button"
                            onClick={() => {
                              const idx = STATUS_ORDER.indexOf(item.status as typeof STATUS_ORDER[number]);
                              const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
                              startTransition(async () => {
                                await updateSingleRodajeField(item.id, "status", next);
                                router.refresh();
                              });
                            }}
                            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium cursor-pointer hover:opacity-70 transition-opacity ${STATUS_BADGE[item.status] ?? STATUS_BADGE.pending}`}
                            title="Clic para cambiar estado"
                          >
                            {STATUS_LABEL[item.status] ?? item.status} →
                          </button>

                          {/* Priority cycle */}
                          {(() => {
                            const p = PRIORITY_STYLE[item.priority ?? "media"] ?? PRIORITY_STYLE.media;
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  const idx = PRIORITY_ORDER.indexOf(item.priority as typeof PRIORITY_ORDER[number]);
                                  const next = PRIORITY_ORDER[(idx + 1) % PRIORITY_ORDER.length];
                                  startTransition(async () => {
                                    await updateSingleRodajeField(item.id, "priority", next);
                                    router.refresh();
                                  });
                                }}
                                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium cursor-pointer hover:opacity-70 transition-opacity ${p.badge}`}
                                title="Clic para cambiar prioridad"
                              >
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${p.dot}`} />
                                {p.label} →
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Editable columns */}
                  {COLUMNS.map(col => {
                    const isActive = editCell?.id === item.id && editCell?.field === col.field;
                    const currentVal = item[col.field] ?? "";

                    if (isActive) {
                      return (
                        <td key={col.field} className="px-2 py-1.5 align-top border-r border-slate-100 bg-blue-50" style={{ minWidth: 140 }}>
                          {col.multiline ? (
                            <textarea
                              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={saveCell}
                              onKeyDown={handleKeyDown}
                              rows={3}
                              className="w-full rounded border border-blue-400 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-300 resize-none leading-relaxed"
                            />
                          ) : (
                            <input
                              ref={inputRef as React.RefObject<HTMLInputElement>}
                              type="text"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={saveCell}
                              onKeyDown={handleKeyDown}
                              className="w-full rounded border border-blue-400 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-300"
                            />
                          )}
                          <p className="text-[9px] text-blue-400 mt-0.5">Enter para guardar · Esc para cancelar</p>
                        </td>
                      );
                    }

                    return (
                      <EditableCell
                        key={col.field}
                        id={item.id}
                        field={col.field}
                        value={currentVal}
                        multiline={col.multiline}
                        isActive={false}
                        onActivate={startEdit}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">Clic en cualquier celda para editarla. Enter para guardar, Esc para cancelar.</p>
    </div>
  );
}
