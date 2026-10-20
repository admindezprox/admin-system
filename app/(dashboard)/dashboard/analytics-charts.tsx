"use client";

import { useState } from "react";
import {
  TrendingUp,
  PieChart,
  BarChart3,
  Calendar,
} from "lucide-react";
import type { AnalyticsData } from "@/lib/dashboard/queries";

interface AnalyticsChartsProps {
  analytics: AnalyticsData;
}

export function AnalyticsCharts({ analytics }: AnalyticsChartsProps) {
  const [timelineRange, setTimelineRange] = useState<"7d" | "30d">("7d");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState<"bookings" | "contacts" | "services" | null>(null);

  const activePoints =
    timelineRange === "7d" ? analytics.dailyLast7Days : analytics.dailyLast30Days;

  // Calculate scales for Timeline SVG (Wide canvas spanning 100% of the section)
  const svgWidth = 1000;
  const svgHeight = 270;
  const padLeft = 45;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 36;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const maxVal = Math.max(
    4,
    ...activePoints.map((p) => Math.max(p.bookings, p.contacts, p.services, p.total))
  );

  const getX = (idx: number) => {
    if (activePoints.length <= 1) return padLeft + chartW / 2;
    return padLeft + (idx / (activePoints.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    return padTop + chartH - (val / maxVal) * chartH;
  };

  const makePath = (field: "bookings" | "contacts" | "services" | "total") => {
    return activePoints.reduce((acc, point, idx) => {
      const x = getX(idx);
      const y = getY(point[field]);
      return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, "");
  };

  const makeAreaPath = (field: "bookings" | "contacts" | "services" | "total") => {
    if (activePoints.length === 0) return "";
    const linePath = makePath(field);
    const startX = getX(0).toFixed(1);
    const endX = getX(activePoints.length - 1).toFixed(1);
    const bottomY = (padTop + chartH).toFixed(1);
    return `${linePath} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
  };

  // Donut chart calculations
  const donutRadius = 66;
  const donutCircumference = 2 * Math.PI * donutRadius; // ~414.69
  const { bookings, contacts, services, total, bookingPct, contactPct, servicePct } =
    analytics.enquiryDistribution;

  const bookingsStroke = (bookingPct / 100) * donutCircumference;
  const contactsStroke = (contactPct / 100) * donutCircumference;
  const servicesStroke = (servicePct / 100) * donutCircumference;

  const contactsOffset = -bookingsStroke;
  const servicesOffset = -(bookingsStroke + contactsStroke);

  return (
    <div className="space-y-6">
      {/* Chart 1: Website Enquiries Over Time (Area & Line Chart) - Full-Width Hero Section */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 lg:p-7 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <h3 className="text-sm font-bold text-zinc-900 sm:text-base">
                Website Enquiries Over Time
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">
              Daily trend of consultation calls, contact forms, and project enquiries from dezprox.com.
            </p>
          </div>

          {/* Interactive Date Range Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTimelineRange("7d")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                timelineRange === "7d"
                  ? "bg-white text-zinc-900 shadow-2xs font-semibold border border-zinc-200/80"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimelineRange("30d")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                timelineRange === "30d"
                  ? "bg-white text-zinc-900 shadow-2xs font-semibold border border-zinc-200/80"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            <span className="text-zinc-700 font-medium">Total Enquiries</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-zinc-500">Bookings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            <span className="text-zinc-500">Contact</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            <span className="text-zinc-500">Service Leads</span>
          </div>
        </div>

        {/* Interactive SVG Chart Container - Full Width & Height */}
        <div className="relative mt-5 w-full select-none">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
            className="w-full h-64 sm:h-72 lg:h-[300px] transition-all duration-300"
            onMouseLeave={() => setHoveredPointIndex(null)}
          >
            <defs>
              <linearGradient id="grad-total" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = padTop + chartH * pct;
              const val = Math.round(maxVal * (1 - pct));
              return (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="#f3f4f6"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 6}
                    y={y + 3.5}
                    textAnchor="end"
                    className="text-[9px] fill-zinc-400 font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Shaded Area for Total */}
            {activePoints.length > 1 && (
              <path
                d={makeAreaPath("total")}
                fill="url(#grad-total)"
                className="transition-all duration-300"
              />
            )}

            {/* Individual Series Lines */}
            {activePoints.length > 1 && (
              <>
                {/* Bookings Line */}
                <path
                  d={makePath("bookings")}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  className="transition-all duration-300"
                />
                {/* Contacts Line */}
                <path
                  d={makePath("contacts")}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                  className="transition-all duration-300"
                />
                {/* Services Line */}
                <path
                  d={makePath("services")}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  className="transition-all duration-300"
                />
                {/* Total Primary Line */}
                <path
                  d={makePath("total")}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              </>
            )}

            {/* Interactive Vertical Guideline & Point Markers */}
            {activePoints.map((point, idx) => {
              const x = getX(idx);
              const isHovered = hoveredPointIndex === idx;
              const totalY = getY(point.total);

              return (
                <g key={point.date}>
                  {/* Invisible broad hover column */}
                  <rect
                    x={x - chartW / (activePoints.length * 2)}
                    y={padTop}
                    width={chartW / activePoints.length}
                    height={chartH}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                  />

                  {/* Active vertical cursor line */}
                  {isHovered && (
                    <line
                      x1={x}
                      y1={padTop}
                      x2={x}
                      y2={padTop + chartH}
                      stroke="#059669"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Point circle */}
                  <circle
                    cx={x}
                    cy={totalY}
                    r={isHovered ? 4.5 : point.total > 0 ? 3 : 2}
                    className={`transition-all ${
                      isHovered
                        ? "fill-white stroke-emerald-600 stroke-2"
                        : point.total > 0
                        ? "fill-emerald-600 stroke-white stroke-1"
                        : "fill-zinc-300"
                    }`}
                  />

                  {/* X-Axis Date Labels (sample every N points for 30d) */}
                  {(timelineRange === "7d" || idx % 4 === 0 || idx === activePoints.length - 1) && (
                    <text
                      x={x}
                      y={padTop + chartH + 20}
                      textAnchor="middle"
                      className="text-[10px] fill-zinc-400 font-mono"
                    >
                      {point.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Interactive HTML Tooltip on Hover */}
          {hoveredPointIndex !== null && activePoints[hoveredPointIndex] && (
            <div
              className="pointer-events-none absolute z-20 rounded-lg border border-zinc-200 bg-white/95 p-2.5 shadow-lg backdrop-blur-xs text-xs animate-fadeIn"
              style={{
                left: `${Math.min(
                  Math.max(10, (getX(hoveredPointIndex) / svgWidth) * 100),
                  85
                )}%`,
                top: "10px",
                transform: "translateX(-50%)",
              }}
            >
              <div className="font-semibold text-zinc-900 flex items-center justify-between gap-3 border-b border-zinc-100 pb-1 mb-1.5">
                <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <Calendar className="h-3 w-3 text-zinc-400" />
                  {activePoints[hoveredPointIndex].date}
                </span>
                <span className="font-mono font-bold text-emerald-700">
                  {activePoints[hoveredPointIndex].total} total
                </span>
              </div>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between gap-3 text-emerald-800">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Bookings
                  </span>
                  <span>{activePoints[hoveredPointIndex].bookings}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sky-800">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                    Contacts
                  </span>
                  <span>{activePoints[hoveredPointIndex].contacts}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-purple-800">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    Services
                  </span>
                  <span>{activePoints[hoveredPointIndex].services}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Responsive Layout for Charts 2 & 3 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 2: Enquiry Channel Distribution (Donut Chart) */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                <h3 className="text-sm font-bold text-zinc-900">
                  Enquiry Channel Distribution
                </h3>
              </div>
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                All-time Ratio
              </span>
            </div>

            {total === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400">
                <PieChart className="h-10 w-10 stroke-1 mb-2 text-zinc-300" />
                <p className="text-xs">No enquiry submissions recorded yet</p>
              </div>
            ) : (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-around gap-6">
                {/* Donut SVG */}
                <div className="relative h-44 w-44 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
                    {/* Background Ring */}
                    <circle
                      cx="100"
                      cy="100"
                      r={donutRadius}
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="22"
                    />

                    {/* Bookings Segment */}
                    {bookingPct > 0 && (
                      <circle
                        cx="100"
                        cy="100"
                        r={donutRadius}
                        fill="none"
                        stroke="#059669"
                        strokeWidth={hoveredDonutSegment === "bookings" ? "25" : "22"}
                        strokeDasharray={`${bookingsStroke} ${donutCircumference - bookingsStroke}`}
                        strokeDashoffset="0"
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredDonutSegment("bookings")}
                        onMouseLeave={() => setHoveredDonutSegment(null)}
                      />
                    )}

                    {/* Contacts Segment */}
                    {contactPct > 0 && (
                      <circle
                        cx="100"
                        cy="100"
                        r={donutRadius}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth={hoveredDonutSegment === "contacts" ? "25" : "22"}
                        strokeDasharray={`${contactsStroke} ${donutCircumference - contactsStroke}`}
                        strokeDashoffset={contactsOffset}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredDonutSegment("contacts")}
                        onMouseLeave={() => setHoveredDonutSegment(null)}
                      />
                    )}

                    {/* Services Segment */}
                    {servicePct > 0 && (
                      <circle
                        cx="100"
                        cy="100"
                        r={donutRadius}
                        fill="none"
                        stroke="#9333ea"
                        strokeWidth={hoveredDonutSegment === "services" ? "25" : "22"}
                        strokeDasharray={`${servicesStroke} ${donutCircumference - servicesStroke}`}
                        strokeDashoffset={servicesOffset}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredDonutSegment("services")}
                        onMouseLeave={() => setHoveredDonutSegment(null)}
                      />
                    )}
                  </svg>

                  {/* Centered Total Counter */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                    <span className="text-2xl font-bold font-mono text-zinc-900 tracking-tight">
                      {total.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Total Inquiries
                    </span>
                  </div>
                </div>

                {/* Legend & Percentages List */}
                <div className="w-full space-y-2.5 text-xs">
                  <div
                    className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                      hoveredDonutSegment === "bookings" ? "border-emerald-300 bg-emerald-50/50" : "border-zinc-100 bg-zinc-50/50"
                    }`}
                    onMouseEnter={() => setHoveredDonutSegment("bookings")}
                    onMouseLeave={() => setHoveredDonutSegment(null)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 shrink-0" />
                      <span className="font-medium text-zinc-800">Booking Calls</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-zinc-500">{bookings}</span>
                      <span className="rounded bg-emerald-100/80 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        {bookingPct}%
                      </span>
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                      hoveredDonutSegment === "contacts" ? "border-sky-300 bg-sky-50/50" : "border-zinc-100 bg-zinc-50/50"
                    }`}
                    onMouseEnter={() => setHoveredDonutSegment("contacts")}
                    onMouseLeave={() => setHoveredDonutSegment(null)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shrink-0" />
                      <span className="font-medium text-zinc-800">Contact Requests</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-zinc-500">{contacts}</span>
                      <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800">
                        {contactPct}%
                      </span>
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                      hoveredDonutSegment === "services" ? "border-purple-300 bg-purple-50/50" : "border-zinc-100 bg-zinc-50/50"
                    }`}
                    onMouseEnter={() => setHoveredDonutSegment("services")}
                    onMouseLeave={() => setHoveredDonutSegment(null)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-purple-500 shrink-0" />
                      <span className="font-medium text-zinc-800">Project Proposals</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-zinc-500">{services}</span>
                      <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-800">
                        {servicePct}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Aggregated across all verified channels</span>
            <span className="font-mono font-medium text-zinc-600">3 Categories</span>
          </div>
        </div>

        {/* Chart 3: Operational Pipeline Status Distribution */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                <h3 className="text-sm font-bold text-zinc-900">
                  Operational Status Distribution
                </h3>
              </div>
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                Last 30 Days
              </span>
            </div>

            <div className="mt-4 space-y-4">
              {/* Bookings Channel Status */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Booking Requests
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {analytics.statusBreakdown.bookings.reduce((sum, item) => sum + item.count, 0)} total
                  </span>
                </div>
                {analytics.statusBreakdown.bookings.length === 0 ? (
                  <div className="h-3 rounded-full bg-zinc-100" />
                ) : (
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-100 gap-0.5">
                    {analytics.statusBreakdown.bookings.map((st) => (
                      <div
                        key={st.status}
                        style={{ width: `${Math.max(4, st.percentage)}%` }}
                        className={`${st.dotClass} transition-all hover:opacity-80`}
                        title={`${st.label}: ${st.count} (${st.percentage}%)`}
                      />
                    ))}
                  </div>
                )}
                <div className="mt-1.5 flex flex-wrap gap-2 text-[10px]">
                  {analytics.statusBreakdown.bookings.slice(0, 3).map((st) => (
                    <span key={st.status} className="flex items-center gap-1 text-zinc-600">
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`} />
                      <span>{st.label} ({st.count})</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Contacts Channel Status */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    Contact Inquiries
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {analytics.statusBreakdown.contacts.reduce((sum, item) => sum + item.count, 0)} total
                  </span>
                </div>
                {analytics.statusBreakdown.contacts.length === 0 ? (
                  <div className="h-3 rounded-full bg-zinc-100" />
                ) : (
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-100 gap-0.5">
                    {analytics.statusBreakdown.contacts.map((st) => (
                      <div
                        key={st.status}
                        style={{ width: `${Math.max(4, st.percentage)}%` }}
                        className={`${st.dotClass} transition-all hover:opacity-80`}
                        title={`${st.label}: ${st.count} (${st.percentage}%)`}
                      />
                    ))}
                  </div>
                )}
                <div className="mt-1.5 flex flex-wrap gap-2 text-[10px]">
                  {analytics.statusBreakdown.contacts.slice(0, 3).map((st) => (
                    <span key={st.status} className="flex items-center gap-1 text-zinc-600">
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`} />
                      <span>{st.label} ({st.count})</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Service Enquiries Channel Status */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-purple-500" />
                    Service & Project Proposals
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {analytics.statusBreakdown.services.reduce((sum, item) => sum + item.count, 0)} total
                  </span>
                </div>
                {analytics.statusBreakdown.services.length === 0 ? (
                  <div className="h-3 rounded-full bg-zinc-100" />
                ) : (
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-100 gap-0.5">
                    {analytics.statusBreakdown.services.map((st) => (
                      <div
                        key={st.status}
                        style={{ width: `${Math.max(4, st.percentage)}%` }}
                        className={`${st.dotClass} transition-all hover:opacity-80`}
                        title={`${st.label}: ${st.count} (${st.percentage}%)`}
                      />
                    ))}
                  </div>
                )}
                <div className="mt-1.5 flex flex-wrap gap-2 text-[10px]">
                  {analytics.statusBreakdown.services.slice(0, 3).map((st) => (
                    <span key={st.status} className="flex items-center gap-1 text-zinc-600">
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`} />
                      <span>{st.label} ({st.count})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Operational Action Pill Footer */}
          <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium">Pending items:</span>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 text-[10px] font-semibold font-mono">
                {analytics.operationalSummary.pendingBookings} calls pending
              </span>
              <span className="rounded-full bg-sky-50 text-sky-800 border border-sky-200/80 px-2 py-0.5 text-[10px] font-semibold font-mono">
                {analytics.operationalSummary.newContacts} new contacts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
