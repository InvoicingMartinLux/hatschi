import { timingSafeEqual } from "node:crypto";

const RUNOPS_KEY = "4e8334f7ca8eabafaf06418d14b6d356d0f5e5cf033b5240";

const VERCEL_API_BASE =
  process.env.VERCEL_ANALYTICS_API_BASE ??
  "https://api.vercel.com/v1/query/web-analytics";

interface DayBucket {
  date: string;
  pageviews: number;
  visitors: number;
}

function keyMatches(provided: string | null): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(RUNOPS_KEY);
  return a.length === b.length && timingSafeEqual(a, b);
}

function isoDate(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function analyticsParams(since: string, until: string): URLSearchParams {
  const params = new URLSearchParams({
    projectId: process.env.VERCEL_PROJECT_ID ?? "",
    environment: "production",
    since,
    until,
  });
  if (process.env.VERCEL_TEAM_ID) {
    params.set("teamId", process.env.VERCEL_TEAM_ID);
  }
  return params;
}

async function queryAnalytics(
  path: string,
  params: URLSearchParams,
): Promise<unknown> {
  const res = await fetch(`${VERCEL_API_BASE}/${path}?${params}`, {
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Vercel Analytics API ${path} failed (HTTP ${res.status})`);
  }
  return res.json();
}

async function fetchDailyPageviews(since: string, until: string): Promise<DayBucket[]> {
  const params = analyticsParams(since, until);
  params.set("by", "day");
  const body = (await queryAnalytics("visits/aggregate", params)) as {
    data?: Array<Record<string, unknown>>;
  };
  const rows = body.data ?? [];
  return rows
    .map((row) => ({
      date: String(row.date ?? row.timestamp ?? row.key ?? ""),
      pageviews: Number(row.pageviews ?? 0),
      visitors: Number(row.visitors ?? 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchUniqueVisitors(since: string, until: string): Promise<number> {
  const body = (await queryAnalytics(
    "visits/count",
    analyticsParams(since, until),
  )) as { data?: { visitors?: number } };
  return Number(body.data?.visitors ?? 0);
}

function sumLastDays(buckets: DayBucket[], days: number): number {
  return buckets
    .slice(-days)
    .reduce((total, bucket) => total + bucket.pageviews, 0);
}

export async function GET(request: Request) {
  if (!keyMatches(request.headers.get("x-runops-key"))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.VERCEL_API_TOKEN || !process.env.VERCEL_PROJECT_ID) {
    return Response.json(
      {
        error:
          "stats source not configured: set VERCEL_API_TOKEN and VERCEL_PROJECT_ID (and VERCEL_TEAM_ID for team projects)",
      },
      { status: 503 },
    );
  }

  const since = isoDate(30);
  const until = isoDate(0);

  try {
    const buckets = await fetchDailyPageviews(since, until);
    // The app has no user accounts, so unique visitors over the trailing
    // 30 days is the closest available "total users" signal. If the count
    // endpoint is unavailable, the busiest day's visitors is a lower bound.
    const usersTotal = await fetchUniqueVisitors(since, until).catch(() =>
      buckets.length > 0
        ? Math.max(...buckets.map((bucket) => bucket.visitors))
        : 0,
    );

    return Response.json({
      users_total: usersTotal,
      traffic: {
        daily: sumLastDays(buckets, 1),
        weekly: sumLastDays(buckets, 7),
        monthly: sumLastDays(buckets, 30),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: message }, { status: 502 });
  }
}
