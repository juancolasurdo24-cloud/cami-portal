import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import CamiForm from "@/components/CamiForm";
import { formatEs } from "@/lib/dateUtils";

export const dynamic = "force-dynamic";

export default async function EditarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const { month } = await searchParams;

  const item = await prisma.camiContent.findUnique({ where: { id } });
  if (!item) notFound();

  const monthParam = month ?? formatEs(item.scheduledFor, "yyyy-MM");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-dismaser-navy">Editar contenido</h1>
        <p className="text-sm text-slate-500 mt-0.5">{item.title}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <CamiForm monthParam={monthParam} item={item} />
      </div>
    </div>
  );
}
