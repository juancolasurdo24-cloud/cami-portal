import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const url = process.env.DATABASE_URL ?? "";
  return NextResponse.json({
    hasDbUrl: !!url,
    prefix: url.slice(0, 14),
    length: url.length,
  });
}
