import { NextResponse } from "next/server";
import counties from "../../../data/counties.json";

// This route is the single seam to swap later: point it at a database,
// a refreshed model run, or a live WASREB feed without touching the UI.
export async function GET() {
  return NextResponse.json(counties);
}
