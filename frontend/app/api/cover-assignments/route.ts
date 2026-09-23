// HackShelf - cover-assignment endpoint (perf).
// Card grids need every book's cover category, which is derived from all
// category book lists. Serving that map from here turns eight client requests
// into one cacheable response; the algorithm itself lives in lib/coverCategory
// and is shared with the server components, so covers stay identical.

import { getCoverAssignments } from "@/lib/coverCategory";

export const dynamic = "force-dynamic";

export async function GET() {
  const assignments = await getCoverAssignments();
  return Response.json(
    { data: assignments },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
