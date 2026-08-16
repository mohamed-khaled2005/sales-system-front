"use client";

import { statusLabel } from "@/lib/utils";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  background: "#161618",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#fff",
  fontSize: 12,
  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
};

export function CashFlowChart({ data }: { data: { month: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 0 }}>
        <defs>
          <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#facc15" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#facc15" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#71717a", fontSize: 11 }}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => new Intl.NumberFormat("ar-EG").format(Number(value))}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#facc15"
          strokeWidth={2.5}
          fill="url(#goldArea)"
          activeDot={{ r: 5, fill: "#facc15", stroke: "#0d0d0e", strokeWidth: 2.5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PipelineChart({ data }: { data: { stage: string; count: number; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} barSize={22}>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="stage"
          tickFormatter={(v) => statusLabel(String(v))}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#71717a", fontSize: 10 }}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(l) => statusLabel(String(l))}
        />
        <Bar dataKey="count" radius={[6, 6, 6, 6]} fill="#facc15" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TaskDonut({ data }: { data: { status: string; count: number }[] }) {
  const filtered = data.filter((x) => x.count > 0);
  const total = filtered.reduce((a, b) => a + b.count, 0);

  return (
    <div className="relative h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            dataKey="count"
            nameKey="status"
            innerRadius={65}
            outerRadius={88}
            paddingAngle={3}
            stroke="none"
          >
            {filtered.map((_, i) => (
              <Cell
                key={i}
                fill={["#facc15", "#38bdf8", "#a78bfa", "#fbbf24", "#f87171", "#71717a"][i % 6]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [value, statusLabel(String(name))]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <strong className="block text-2xl font-black text-white">{total}</strong>
          <span className="text-[10px] text-zinc-500">إجمالي المهام</span>
        </div>
      </div>
    </div>
  );
}
