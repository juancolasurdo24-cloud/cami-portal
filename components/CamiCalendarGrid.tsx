"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CamiContent } from "@prisma/client";
import { toDateKey, parseDateKey, formatEs } from "@/lib/dateUtils";
import {
  createCamiContent,
  updateCamiContent,
  setCamiStatus,
  deleteCamiContent,
} from "@/app/actions/cami";

const WEEKDAY_HEADERS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const PLATFORM_ICON: Record<string, string> = {
  tiktok:    "🎵",
  youtube:   "▶️",
  instagram: "📸",
  facebook:  "👍",
};

export const STATUS = {
  pending:   { label: "Pendiente",  bg: "bg-slate-100",  text: "text-slate-600",  dot: "bg-slate-400"  },
  recording: { label: "En curso",   bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-400"  },
  recorded:  { label: "Completado", bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-400"   },
  published: { label: "Posteado",   bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500"  },
} as const;

type StatusKey = keyof typeof STATUS;

function nextStatus(s: string): StatusKey {
  const order: StatusKey[] = ["pending", "recording", "recorded", "published"];
  const i = order.indexOf(s as StatusKey);
  return order[(i + 1) % order.length];
}

function statusInfo(s: string) {
  return STATUS[(s as StatusKey)] ?? STATUS.pending;
}

export default function CamiCalendarGrid({
  days,
  items,
  currentMonth,
}: {
  days: Date[];
  items: CamiContent[];
  currentMonth: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [modal, setModal] = useState<null | string | CamiContent>(null);
  const [selectedStatus, setSelectedStatus] = useState<StatusKey>("pending");

  const byDate = new Map<string, CamiContent[]>();
  for (const item of items) {
    const key = toDateKey(item.scheduledFor);
    byDate.set(key, [...(byDate.get(key) ?? []), item]);
  }

  function openNew(dateKey: string) {
    setSelectedStatus("pending");
    setModal(dateKey);
  }

  function openEdit(item: CamiContent, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedStatus(item.status as StatusKey);
    setModal(item);
  }

  function closeModal() {
    setModal(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      if (modal && typeof modal === "object") {
        await updateCamiContent(modal.id, fd);
      } else if (typeof modal === "string") {
        await createCamiContent(fd);
      }
      setModal(null);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteCamiContent(id);
      setModal(null);
      router.refresh();
    });
  }

  function handleStatusCycle(id: string, current: string, e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await setCamiStatus(id, nextStatus(current));
      router.refresh();
    });
  }

  const isEditing = modal !== null && typeof modal === "object";
  const isCreating = modal !== null && typeof modal === "string";
  const modalDateKey = isEditing
    ? toDateKey((modal as CamiContent).scheduledFor)
    : (modal as string | null);
  const modalLabel = modalDateKey
    ? formatEs(parseDateKey(modalDateKey), "EEEE d 'de' MMMM")
    : "";
  const editItem = isEditing ? (modal as CamiContent) : null;

  return (
    <>
      {/* Grid */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid grid-cols-7 bg-dismaser-navy text-center text-xs font-medium text-white">
          {WEEKDAY_HEADERS.map((h) => (
            <div key={h} className="py-2">{h}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = toDateKey(day);
            const dayItems = byDate.get(key) ?? [];
            const inMonth = day.getUTCMonth() === currentMonth;
            const isToday = key === toDateKey(new Date());

            return (
              <div
                key={key}
                onClick={() => inMonth && openNew(key)}
                className={`group min-h-[100px] border-b border-r border-slate-100 p-1.5 flex flex-col transition-colors ${
                  inMonth ? "bg-white hover:bg-slate-50 cursor-pointer" : "bg-slate-50 cursor-default"
                }`}
              >
                <div className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday ? "bg-dismaser-maroon text-white"
                  : inMonth ? "text-slate-700"
                  : "text-slate-300"
                }`}>
                  {day.getUTCDate()}
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  {dayItems.map((item) => {
                    const s = statusInfo(item.status);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={(e) => openEdit(item, e)}
                        className={`w-full rounded px-1.5 py-1 text-left transition-opacity ${s.bg} hover:opacity-80`}
                      >
                        <div className={`truncate text-[11px] font-medium leading-tight ${s.text}`}>
                          {PLATFORM_ICON[item.platform ?? ""] ?? ""}{item.requiresVisit ? "📍" : "🏠"} {item.title}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${s.text} opacity-70`}>{s.label}</div>
                      </button>
                    );
                  })}
                </div>

                {inMonth && dayItems.length === 0 && (
                  <div className="mt-auto hidden group-hover:flex items-center justify-center">
                    <span className="text-[11px] text-slate-400">+ agregar</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {(isCreating || isEditing) && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-dismaser-navy px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-300 capitalize">{modalLabel}</p>
                <h2 className="text-lg font-semibold text-white">
                  {isEditing ? "Editar contenido" : "Nuevo contenido"}
                </h2>
              </div>
              <button onClick={closeModal} className="text-slate-300 hover:text-white text-xl leading-none">×</button>
            </div>

            <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input type="hidden" name="scheduledFor" value={modalDateKey ?? ""} />

                {/* Título */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Título / Tema</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editItem?.title ?? ""}
                    required
                    autoFocus
                    placeholder="Ej: Tutorial maquillaje verano"
                    className="input w-full"
                  />
                </div>

                {/* Plataforma */}
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">Plataforma</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: "",         label: "Sin definir",  icon: "—"  },
                      { value: "tiktok",   label: "TikTok",       icon: "🎵" },
                      { value: "youtube",  label: "YouTube",      icon: "▶️" },
                      { value: "instagram",label: "Instagram",    icon: "📸" },
                      { value: "facebook", label: "Facebook",     icon: "👍" },
                    ].map(opt => (
                      <label key={opt.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="platform"
                          value={opt.value}
                          defaultChecked={(editItem?.platform ?? "") === opt.value}
                          className="sr-only peer"
                        />
                        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 transition-all peer-checked:border-dismaser-navy peer-checked:bg-dismaser-navy peer-checked:text-white cursor-pointer">
                          {opt.icon} {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Prioridad */}
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">Prioridad</p>
                  <div className="flex gap-2">
                    {[
                      { value: "baja",  label: "🟢 Baja",  cls: "peer-checked:bg-green-600  peer-checked:border-green-600"  },
                      { value: "media", label: "🟡 Media", cls: "peer-checked:bg-amber-500  peer-checked:border-amber-500"  },
                      { value: "alta",  label: "🔴 Alta",  cls: "peer-checked:bg-red-600    peer-checked:border-red-600"    },
                    ].map(opt => (
                      <label key={opt.value} className="cursor-pointer">
                        <input type="radio" name="priority" value={opt.value}
                          defaultChecked={(editItem?.priority ?? "media") === opt.value}
                          className="sr-only peer" />
                        <span className={`inline-flex items-center rounded-full border-2 border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 transition-all peer-checked:text-white cursor-pointer ${opt.cls}`}>
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Estado */}
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">Estado</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(Object.entries(STATUS) as [StatusKey, typeof STATUS[StatusKey]][]).map(([key, s]) => (
                      <label
                        key={key}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border-2 px-2 py-2 cursor-pointer text-xs font-medium transition-all ${
                          selectedStatus === key
                            ? `${s.bg} ${s.text} border-current`
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={key}
                          checked={selectedStatus === key}
                          onChange={() => setSelectedStatus(key)}
                          className="sr-only"
                        />
                        <span className={`inline-block w-2 h-2 rounded-full ${s.dot}`} />
                        {s.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Requiere visita */}
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">¿Requiere visita para grabar?</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="requiresVisit" value="true"
                        defaultChecked={editItem?.requiresVisit === true}
                        className="accent-dismaser-navy" />
                      <span className="text-sm text-slate-700">📍 Sí, viene a grabar</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="requiresVisit" value="false"
                        defaultChecked={!editItem || editItem.requiresVisit === false}
                        className="accent-dismaser-navy" />
                      <span className="text-sm text-slate-700">🏠 Remoto</span>
                    </label>
                  </div>
                </div>

                {/* Storyboard */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Storyboard / Guion</label>
                  <textarea
                    name="storyboard"
                    rows={4}
                    defaultValue={editItem?.storyboard ?? ""}
                    placeholder={"1. Intro: saludo + hook\n2. Desarrollo: paso a paso\n3. Cierre: CTA"}
                    className="input w-full resize-y font-mono text-sm leading-relaxed"
                  />
                </div>

                {/* Comentarios */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Comentarios</label>
                  <textarea
                    name="comments"
                    rows={2}
                    defaultValue={editItem?.comments ?? ""}
                    placeholder="Referencias, notas de producción, links..."
                    className="input w-full resize-y text-sm"
                  />
                </div>

                {/* Plan de Rodaje */}
                <details className="group">
                  <summary className="cursor-pointer text-xs font-medium text-dismaser-navy select-none flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                    Plan de Rodaje (opcional)
                  </summary>
                  <div className="mt-3 flex flex-col gap-3 pl-1">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Unidad de negocio</label>
                      <input type="text" name="businessUnit" defaultValue={editItem?.businessUnit ?? ""}
                        placeholder="Ej: Marketing, RRHH, Comercial…" className="input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Máquinas / Equipos</label>
                      <input type="text" name="equipment" defaultValue={editItem?.equipment ?? ""}
                        placeholder="Ej: Cámara Sony A7, Ring light, Trípode…" className="input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Espacio sugerido</label>
                      <input type="text" name="location" defaultValue={editItem?.location ?? ""}
                        placeholder="Ej: Sala de reuniones, Estudio, Exterior…" className="input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Puesta en escena & acciones clave</label>
                      <textarea name="staging" rows={3} defaultValue={editItem?.staging ?? ""}
                        placeholder="Descripción del ambiente, iluminación, acciones principales…"
                        className="input w-full resize-y text-sm" />
                    </div>
                  </div>
                </details>

                {/* Botones */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 rounded-md bg-dismaser-navy py-2.5 text-sm font-medium text-white hover:bg-dismaser-navy-light disabled:opacity-50"
                  >
                    {isPending ? "Guardando…" : isEditing ? "Guardar cambios" : "Agregar al calendario"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                </div>
              </form>

              {/* Acciones extra (solo edición) */}
              {isEditing && editItem && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => handleStatusCycle(editItem.id, editItem.status, e)}
                    disabled={isPending}
                    className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${statusInfo(editItem.status).bg} ${statusInfo(editItem.status).text}`}
                  >
                    Avanzar estado →
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(editItem.id)}
                    disabled={isPending}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    🗑 Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
