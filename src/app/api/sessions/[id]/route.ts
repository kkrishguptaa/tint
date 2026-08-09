import { NextResponse } from "next/server";
import { getSession } from "@/lib/session-store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const report = await getSession(id);
  if (!report) {
    return NextResponse.json({ error: "Not found or expired" }, { status: 404 });
  }
  return NextResponse.json(report);
}
