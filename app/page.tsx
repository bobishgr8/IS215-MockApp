"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  Database,
  BarChart3,
  Boxes,
  Workflow,
  Play,
  Upload,
  Users,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Settings,
  Server,
  Calendar,
  Search,
  Filter,
  RefreshCcw,
  Rocket,
  TerminalSquare,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

/**
 * FoodBank Data Platform Dashboard
 * A pseudo-Databricks-style lakehouse console for food donation ops.
 * - Overview: KPIs, time-series, operational health
 * - Datasets: Lakehouse tables, CSV ingest, preview, simple query builder
 * - Pipelines: Ingest → Clean → Match → Allocate → Dispatch (orchestration)
 * - Jobs: Ad-hoc/cron jobs with simulated runs & logs
 * - Impact: Community metrics (meals, CO2e, waste diverted)
 *
 * Built with: React + Tailwind + shadcn/ui + recharts + framer-motion + lucide icons
 */

function genTimeSeries(weeks = 12) {
  const now = new Date();
  const out = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * 7);
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const donations = Math.floor(80 + Math.random() * 140);
    const kg = Math.floor(donations * (3.2 + Math.random()));
    const meals = Math.floor(kg * 2.1);
    out.push({ label, donations, kg, meals });
  }
  return out;
}

const donorSegments = [
  { name: "Corporate", donors: 18, share: 0.36 },
  { name: "Restaurants", donors: 24, share: 0.22 },
  { name: "Grocers", donors: 12, share: 0.18 },
  { name: "Community", donors: 56, share: 0.24 },
];

const pipelineStages = [
  { key: "ingest", label: "Ingest", icon: Upload },
  { key: "clean", label: "Clean", icon: Filter },
  { key: "match", label: "Match", icon: Boxes },
  { key: "allocate", label: "Allocate", icon: Package },
  { key: "dispatch", label: "Dispatch", icon: Truck },
];

const initialTables = [
  {
    name: "donations_raw",
    schema: "bronze",
    format: "delta",
    rows: 128430,
    size: "4.6 GB",
    updatedAt: "2m ago",
    desc: "Raw drop from partner CSV/API",
  },
  {
    name: "donations_clean",
    schema: "silver",
    format: "delta",
    rows: 121204,
    size: "4.0 GB",
    updatedAt: "1m ago",
    desc: "Normalized, deduped donations",
  },
  {
    name: "inventory",
    schema: "silver",
    format: "delta",
    rows: 64210,
    size: "1.1 GB",
    updatedAt: "4m ago",
    desc: "Current stock by item & location",
  },
  {
    name: "outlets",
    schema: "gold",
    format: "delta",
    rows: 420,
    size: "12 MB",
    updatedAt: "10m ago",
    desc: "Beneficiary orgs & capacity",
  },
  {
    name: "allocations",
    schema: "gold",
    format: "delta",
    rows: 21940,
    size: "350 MB",
    updatedAt: "Just now",
    desc: "Recommended matches → deliveries",
  },
];

const initialJobs = [
  {
    id: "job-1",
    name: "Ingest: Partner CSV (S3)",
    schedule: "0/30 * * * *",
    lastRun: "08:40",
    status: "success",
    runTime: 34,
  },
  {
    id: "job-2",
    name: "Clean & Dedup (Spark)",
    schedule: "*/30 * * * *",
    lastRun: "08:40",
    status: "running",
    runTime: 51,
  },
  {
    id: "job-3",
    name: "Match Supply→Demand (ML)",
    schedule: "*/60 * * * *",
    lastRun: "08:00",
    status: "failed",
    runTime: 0,
  },
  {
    id: "job-4",
    name: "Allocate & Dispatch (DBT)",
    schedule: "*/60 * * * *",
    lastRun: "07:00",
    status: "idle",
    runTime: 0,
  },
];

const sampleDonations = Array.from({ length: 24 }).map((_, i) => ({
  id: 1000 + i,
  date: new Date(Date.now() - i * 36e5).toISOString().slice(0, 16).replace("T", " "),
  donor: ["Acme Foods", "FreshMart", "Green Bites", "Community Drive"][i % 4],
  type: ["Produce", "Bakery", "Dairy", "Prepared"][i % 4],
  kg: Math.floor(10 + Math.random() * 45),
  outlet: ["Shelter A", "Pantry North", "Pantry East", "Mobile Van"][i % 4],
}));

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6"]; // brandy but subtle

export default function FoodBankLakehouseDashboard() {
  // Page state
  const [active, setActive] = useState("overview");
  const [series, setSeries] = useState(() => genTimeSeries(12));
  const [tables, setTables] = useState(initialTables);
  const [jobs, setJobs] = useState(initialJobs);
  const [csvPreview, setCsvPreview] = useState<{ headers: string[]; rows: Record<string, string>[] }>({ headers: [], rows: [] });
  const [query, setQuery] = useState({ donor: "", type: "", outlet: "" });

  // Derived
  const totalMeals = useMemo(() => series.reduce((a, b) => a + b.meals, 0), [series]);
  const totalKg = useMemo(() => series.reduce((a, b) => a + b.kg, 0), [series]);
  const donationsCount = useMemo(() => series.reduce((a, b) => a + b.donations, 0), [series]);

  // Simulate job progress
  useEffect(() => {
    const t = setInterval(() => {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.status === "running") {
            const next = { ...j, runTime: Math.min(100, j.runTime + Math.floor(Math.random() * 10)) };
            if (next.runTime >= 100) {
              next.status = Math.random() < 0.9 ? "success" : "failed";
              next.lastRun = new Date().toTimeString().slice(0, 5);
            }
            return next;
          }
          return j;
        })
      );
    }, 1200);
    return () => clearInterval(t);
  }, []);

  function handleRunJob(id: string) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? { ...j, status: "running", runTime: 1, lastRun: new Date().toTimeString().slice(0, 5) }
          : j
      )
    );
  }

  function parseCsv(text: string) {
    const lines = text.split(/\r?\n/).filter((l: string) => l.trim().length);
    if (!lines.length) return { headers: [], rows: [] };
    const headers = lines[0].split(",").map((h: string) => h.trim());
    const rows = lines.slice(1).map((line: string) => {
      const cols = line.split(",");
      const row: Record<string, string> = {};
      headers.forEach((h: string, i: number) => (row[h] = (cols[i] || "").trim()));
      return row;
    });
    return { headers, rows };
  }

  function handleCsvUpload(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || "");
      const parsed = parseCsv(text);
      setCsvPreview(parsed);
      // Bump table counts as if ingested
      setTables((prev) =>
        prev.map((t) =>
          t.name === "donations_raw"
            ? {
                ...t,
                rows: t.rows + parsed.rows.length,
                updatedAt: "Just now",
              }
            : t
        )
      );
    };
    reader.readAsText(file);
  }

  const filtered = useMemo(() => {
    return sampleDonations.filter((d) =>
      (!query.donor || d.donor === query.donor) &&
      (!query.type || d.type === query.type) &&
      (!query.outlet || d.outlet === query.outlet)
    );
  }, [query]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-blue-600 grid place-items-center text-white font-bold">FB</div>
            <div className="leading-tight">
              <div className="font-semibold">FoodBank Lakehouse</div>
              <div className="text-xs text-neutral-500">warehouse-small • online</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 rounded-xl border px-3 py-1.5 bg-white">
              <Search className="size-4 text-neutral-500" />
              <input placeholder="Search tables, jobs, donors…" className="outline-none text-sm w-72" />
            </div>
            <Button variant="outline" size="sm" className="rounded-xl">
              <RefreshCcw className="size-4 mr-2" /> Refresh
            </Button>
            <Button size="sm" className="rounded-xl">
              <Rocket className="size-4 mr-2" /> New Run
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Settings className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-3 xl:col-span-2">
          <nav className="space-y-1">
            {[
              { key: "overview", label: "Overview", icon: LayoutGrid },
              { key: "datasets", label: "Datasets", icon: Database },
              { key: "pipelines", label: "Pipelines", icon: Workflow },
              { key: "jobs", label: "Jobs", icon: TerminalSquare },
              { key: "impact", label: "Impact", icon: BarChart3 },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2 text-left border transition ${
                  active === item.key
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white hover:bg-neutral-50"
                }`}
              >
                <item.icon className="size-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-6  rounded-2xl border bg-white p-4">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Server className="size-4" /> Compute
            </div>
            <div className="mt-2 text-sm font-medium">Serverless SQL Warehouse</div>
            <div className="text-xs text-neutral-500">r6i.large • 2 workers</div>
            <Progress value={88} className="h-2 mt-3" />
            <div className="flex justify-between text-xs mt-1 text-neutral-500">
              <span>Uptime</span>
              <span>99.9%</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 lg:col-span-9 xl:col-span-10">
          {active === "overview" && <Overview series={series} donorSegments={donorSegments} totalMeals={totalMeals} totalKg={totalKg} donationsCount={donationsCount} jobs={jobs} />}
          {active === "datasets" && (
            <Datasets tables={tables} onCsvUpload={handleCsvUpload} csvPreview={csvPreview} filtered={filtered} query={query} setQuery={setQuery} />
          )}
          {active === "pipelines" && <Pipelines />}
          {active === "jobs" && <Jobs jobs={jobs} onRun={handleRunJob} />}
          {active === "impact" && <Impact series={series} totalKg={totalKg} totalMeals={totalMeals} />}
        </main>
      </div>

      <footer className="py-8 text-center text-xs text-neutral-500">Made with ❤️ for zero-waste & full plates</footer>
    </div>
  );
}

function KPI({ icon: Icon, label, value, hint, tone = "default" }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint: string;
  tone?: "default" | "good" | "warn";
}) {
  const toneCls =
    tone === "good"
      ? "bg-green-50 border-green-200"
      : tone === "warn"
      ? "bg-amber-50 border-amber-200"
      : "bg-white";
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`rounded-2xl ${toneCls}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 grid place-items-center rounded-xl bg-neutral-100">
              <Icon className="size-5" />
            </div>
            <div>
              <div className="text-xs text-neutral-500">{label}</div>
              <div className="text-xl font-semibold">{value}</div>
            </div>
            <div className="ml-auto text-xs text-neutral-500">{hint}</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Overview({ series, donorSegments, totalMeals, totalKg, donationsCount, jobs }: {
  series: Array<{ label: string; donations: number; kg: number; meals: number }>;
  donorSegments: Array<{ name: string; donors: number; share: number }>;
  totalMeals: number;
  totalKg: number;
  donationsCount: number;
  jobs: Array<{ id: string; name: string; schedule: string; lastRun: string; status: string; runTime: number }>;
}) {
  const jobHealth = useMemo(() => {
    const ok = jobs.filter((j: { status: string }) => j.status === "success").length;
    const all = jobs.length;
    return `${ok}/${all} green`;
  }, [jobs]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPI icon={Package} label="Total kg rescued" value={`${totalKg.toLocaleString()} kg`} hint="12w" tone="good" />
        <KPI icon={Users} label="Donations" value={donationsCount.toLocaleString()} hint="12w" />
        <KPI icon={Truck} label="Deliveries" value={(Math.floor(totalKg / 120)).toLocaleString()} hint="est." />
        <KPI icon={CheckCircle2} label="Job health" value={jobHealth} hint="last hour" tone="good" />
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <Card className="rounded-2xl xl:col-span-2">
          <CardHeader>
            <CardTitle>Rescue throughput</CardTitle>
            <CardDescription>Weekly kilograms & donations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="kg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <RTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="kg" name="kg rescued" stroke="#2563eb" fill="url(#kg)" />
                  <Line type="monotone" dataKey="donations" name="# donations" stroke="#16a34a" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Donor mix</CardTitle>
            <CardDescription>By segment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donorSegments} dataKey="share" nameKey="name" outerRadius={90}>
                    {donorSegments.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Operational health</CardTitle>
          <CardDescription>Compute, pipelines, SLAs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <HealthRow label="SQL Warehouse" value="Online" sub="2 workers" status="good" />
            <HealthRow label="Bronze→Silver latency" value="6.2 min" sub="p95" status="good" />
            <HealthRow label="Dispatch SLA" value="92%" sub=">= 90% on-time" status="warn" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HealthRow({ label, value, sub, status = "good" }: {
  label: string;
  value: string;
  sub: string;
  status?: "good" | "warn";
}) {
  const Icon = status === "good" ? CheckCircle2 : AlertTriangle;
  const cls = status === "good" ? "text-green-600" : "text-amber-600";
  return (
    <div className="flex items-center gap-3 rounded-xl border p-3 bg-white">
      <Icon className={`size-5 ${cls}`} />
      <div className="text-sm">
        <div className="font-medium">{label}</div>
        <div className="text-neutral-500 text-xs">{sub}</div>
      </div>
      <div className="ml-auto text-sm font-semibold">{value}</div>
    </div>
  );
}

function Datasets({ tables, onCsvUpload, csvPreview, filtered, query, setQuery }: {
  tables: Array<{ name: string; schema: string; format: string; rows: number; size: string; updatedAt: string; desc: string }>;
  onCsvUpload: (file: File | null) => void;
  csvPreview: { headers: string[]; rows: Record<string, string>[] };
  filtered: Array<{ id: number; date: string; donor: string; kg: number; type: string; outlet: string }>;
  query: { donor: string; type: string; outlet: string };
  setQuery: React.Dispatch<React.SetStateAction<{ donor: string; type: string; outlet: string }>>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold flex items-center gap-2"><Database className="size-5" /> Lakehouse Tables</div>
          <div className="text-sm text-neutral-500">Delta tables across Bronze/Silver/Gold</div>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="file" accept=".csv" className="hidden" onChange={(e) => onCsvUpload(e.target.files?.[0] || null)} />
            <Button className="rounded-xl" variant="outline"><Upload className="size-4 mr-2"/>Ingest CSV</Button>
          </label>
          <Button className="rounded-xl"><Play className="size-4 mr-2"/> Optimize</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {tables.map((t, i) => (
          <Card key={t.name} className="rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-lg">{t.schema}</Badge>
                <CardTitle className="text-base font-semibold">{t.name}</CardTitle>
                <Badge className="rounded-lg" variant="outline">{t.format}</Badge>
                <span className="ml-auto text-xs text-neutral-500">{t.updatedAt}</span>
              </div>
              <CardDescription>{t.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <div className="rounded-xl border px-3 py-2 bg-neutral-50">{t.rows.toLocaleString()} rows</div>
                <div className="rounded-xl border px-3 py-2 bg-neutral-50">{t.size}</div>
                <Button size="sm" variant="outline" className="rounded-xl ml-auto">Preview</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CSV Preview */}
      {csvPreview.rows.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Staged file preview</CardTitle>
            <CardDescription>Showing first {Math.min(10, csvPreview.rows.length)} rows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {csvPreview.headers.map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvPreview.rows.slice(0, 10).map((r, idx) => (
                    <TableRow key={idx}>
                      {csvPreview.headers.map((h) => (
                        <TableCell key={h}>{String(r[h])}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Query Builder */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Query builder</CardTitle>
          <CardDescription>Filter recent donations across silver tables</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <div className="text-xs text-neutral-500 mb-1">Donor</div>
              <select className="w-full rounded-xl border bg-white px-3 py-2" value={query.donor} onChange={(e) => setQuery({ ...query, donor: e.target.value })}>
                <option value="">Any</option>
                {Array.from(new Set(sampleDonations.map((d) => d.donor))).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">Type</div>
              <select className="w-full rounded-xl border bg-white px-3 py-2" value={query.type} onChange={(e) => setQuery({ ...query, type: e.target.value })}>
                <option value="">Any</option>
                {Array.from(new Set(sampleDonations.map((d) => d.type))).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">Outlet</div>
              <select className="w-full rounded-xl border bg-white px-3 py-2" value={query.outlet} onChange={(e) => setQuery({ ...query, outlet: e.target.value })}>
                <option value="">Any</option>
                {Array.from(new Set(sampleDonations.map((d) => d.outlet))).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button className="rounded-xl w-full" variant="outline" onClick={() => setQuery({ donor: "", type: "", outlet: "" })}><Filter className="size-4 mr-2"/>Reset</Button>
            </div>
          </div>

          <Separator />

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="overflow-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Donor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>kg</TableHead>
                    <TableHead>Outlet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{r.date}</TableCell>
                      <TableCell>{r.donor}</TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell>{r.kg}</TableCell>
                      <TableCell>{r.outlet}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="h-72 rounded-xl border p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.values(
                  filtered.reduce((acc: Record<string, { type: string; kg: number }>, r) => {
                    acc[r.type] = acc[r.type] || { type: r.type, kg: 0 };
                    acc[r.type].kg += r.kg;
                    return acc;
                  }, {})
                )}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <RTooltip />
                  <Bar dataKey="kg" name="kg by type" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Pipelines() {
  return (
    <div className="space-y-6">
      <div className="text-xl font-semibold flex items-center gap-2"><Workflow className="size-5"/> Orchestrated Pipelines</div>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Bronze → Silver → Gold</CardTitle>
          <CardDescription>Classic medallion architecture for data quality & performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-3 items-stretch">
            {pipelineStages.map((s, i) => (
              <div key={s.key} className="rounded-2xl border p-4 bg-white flex flex-col">
                <div className="flex items-center gap-2">
                  <s.icon className="size-5" />
                  <div className="font-medium">{s.label}</div>
                </div>
                <div className="text-xs text-neutral-500 mt-1">p95: {(4 + i * 2).toFixed(1)} min</div>
                <div className="mt-3">
                  <Progress value={80 - i * 6} className="h-2" />
                </div>
                {i < pipelineStages.length - 1 && (
                  <div className="hidden md:block mx-auto my-3 h-5 w-px bg-neutral-200" />
                )}
                <div className="mt-auto pt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="rounded-xl">Metrics</Button>
                  <Button size="sm" className="rounded-xl"><Play className="size-4 mr-1"/>Run</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Lineage</CardTitle>
          <CardDescription>Trace outputs back to sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto p-2">
            <div className="inline-grid grid-cols-6 gap-4 items-center">
              <Node label="Partner APIs" tone="bronze" />
              <Arrow />
              <Node label="donations_raw" tone="bronze" />
              <Arrow />
              <Node label="donations_clean" tone="silver" />
              <Arrow />
              <Node label="allocations" tone="gold" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Node({ label, tone = "silver" }: { label: string; tone?: "silver" | "bronze" | "gold" }) {
  const toneCls =
    tone === "bronze"
      ? "bg-amber-50 border-amber-200"
      : tone === "gold"
      ? "bg-yellow-50 border-yellow-200"
      : "bg-neutral-50";
  return (
    <div className={`rounded-2xl border ${toneCls} px-4 py-3 text-sm font-medium whitespace-nowrap`}>{label}</div>
  );
}

function Arrow() {
  return <div className="text-neutral-300">→</div>;
}

function Jobs({ jobs, onRun }: {
  jobs: Array<{ id: string; name: string; schedule: string; lastRun: string; status: string; runTime: number }>;
  onRun: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold flex items-center gap-2"><TerminalSquare className="size-5"/> Jobs & Schedules</div>
        <Button className="rounded-xl"><Play className="size-4 mr-2"/> Run all</Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead className="hidden md:table-cell">Schedule</TableHead>
                <TableHead>Last run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[180px]">Progress</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="font-medium">{j.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-neutral-500">{j.schedule}</TableCell>
                  <TableCell>{j.lastRun}</TableCell>
                  <TableCell>
                    <Badge className="rounded-lg" variant={j.status === "failed" ? "destructive" : j.status === "success" ? "default" : j.status === "running" ? "secondary" : "outline"}>
                      {j.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Progress value={j.runTime} className="h-2" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" className="rounded-xl" variant="outline" onClick={() => onRun(j.id)}>
                      <Play className="size-4 mr-2"/> Run now
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-base">Recent logs</CardTitle></CardHeader>
          <CardContent>
            <div className="text-xs font-mono bg-neutral-50 rounded-xl border p-3 h-48 overflow-auto">
              08:40:21 INFO Ingest started\n
              08:40:23 INFO Read 12 files from s3://partners/acme\n
              08:40:24 INFO Wrote 5,320 rows to bronze.donations_raw\n
              08:40:28 INFO Optimize ZORDER (donor, date)\n
              08:40:30 INFO Completed (34s)
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-base">SLAs</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <SLA label="Bronze→Silver" value={92} />
              <SLA label="Silver freshness < 15m" value={97} />
              <SLA label="Dispatch start < 2h" value={89} warn />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-base">Calendars</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm"><Calendar className="size-4"/> Food Drive: Friday 5pm</div>
            <div className="flex items-center gap-2 text-sm mt-2"><Calendar className="size-4"/> Partners Sync: Tue 10am</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SLA({ label, value, warn = false }: { label: string; value: number; warn?: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className={warn ? "text-amber-600" : "text-green-600"}>{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

function Impact({ series, totalKg, totalMeals }: {
  series: Array<{ label: string; donations: number; kg: number; meals: number }>;
  totalKg: number;
  totalMeals: number;
}) {
  const recent = series.slice(-6);
  return (
    <div className="space-y-6">
      <div className="text-xl font-semibold flex items-center gap-2"><BarChart3 className="size-5"/> Community Impact</div>
      <div className="grid md:grid-cols-4 gap-4">
        <KPI icon={Package} label="Kg diverted from landfill" value={`${totalKg.toLocaleString()}`} hint="12w" tone="good" />
        <KPI icon={Users} label="Estimated meals" value={`${totalMeals.toLocaleString()}`} hint="12w" tone="good" />
        <KPI icon={Truck} label="Outlets served" value={"120"} hint="active" />
        <KPI icon={Boxes} label="Avg. days in stock" value={"2.1"} hint="p50" />
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Trend: meals/week</CardTitle>
          <CardDescription>Recent six-week view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recent}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <RTooltip />
                <Legend />
                <Line type="monotone" dataKey="meals" name="meals" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Top recent donations</CardTitle>
          <CardDescription>By kilograms</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>kg</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleDonations
                .slice()
                .sort((a, b) => b.kg - a.kg)
                .slice(0, 8)
                .map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.donor}</TableCell>
                    <TableCell>{d.type}</TableCell>
                    <TableCell>{d.kg}</TableCell>
                    <TableCell className="whitespace-nowrap">{d.date}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
