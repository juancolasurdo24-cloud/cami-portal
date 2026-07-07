"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

function parseRodajeFields(formData: FormData) {
  return {
    businessUnit: String(formData.get("businessUnit") || ""),
    equipment:    String(formData.get("equipment")    || ""),
    location:     String(formData.get("location")     || ""),
    staging:      String(formData.get("staging")      || ""),
  };
}

function parsePlatform(formData: FormData) {
  return {
    platform: String(formData.get("platform") || ""),
    priority: String(formData.get("priority") || "media"),
  };
}

export async function createCamiContent(formData: FormData) {
  const dateStr = String(formData.get("scheduledFor"));
  const [y, m, d] = dateStr.split("-").map(Number);
  await prisma.camiContent.create({
    data: {
      title:         String(formData.get("title") || "Sin título"),
      scheduledFor:  new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12)),
      requiresVisit: formData.get("requiresVisit") === "true",
      storyboard:    String(formData.get("storyboard") || ""),
      comments:      String(formData.get("comments")   || ""),
      status:        String(formData.get("status")     || "pending"),
      ...parsePlatform(formData),
      ...parseRodajeFields(formData),
    },
  });
  revalidatePath("/");
}

export async function updateCamiContent(id: string, formData: FormData) {
  const dateStr = String(formData.get("scheduledFor"));
  const [y, m, d] = dateStr.split("-").map(Number);
  await prisma.camiContent.update({
    where: { id },
    data: {
      title:         String(formData.get("title") || "Sin título"),
      scheduledFor:  new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12)),
      requiresVisit: formData.get("requiresVisit") === "true",
      storyboard:    String(formData.get("storyboard") || ""),
      comments:      String(formData.get("comments")   || ""),
      status:        String(formData.get("status")     || "pending"),
      ...parsePlatform(formData),
      ...parseRodajeFields(formData),
    },
  });
  revalidatePath("/");
}

export async function updateRodajeFields(id: string, formData: FormData) {
  await prisma.camiContent.update({
    where: { id },
    data: parseRodajeFields(formData),
  });
  revalidatePath("/");
}

export async function updateSingleRodajeField(id: string, field: string, value: string) {
  const allowed = ["businessUnit", "equipment", "location", "staging", "title", "status", "platform", "priority", "comments"];
  if (!allowed.includes(field)) return;
  await prisma.camiContent.update({
    where: { id },
    data: { [field]: value },
  });
  revalidatePath("/");
}

export async function setCamiStatus(id: string, status: string) {
  await prisma.camiContent.update({ where: { id }, data: { status } });
  revalidatePath("/");
}

export async function deleteCamiContent(id: string) {
  await prisma.camiContent.delete({ where: { id } });
  revalidatePath("/");
}
