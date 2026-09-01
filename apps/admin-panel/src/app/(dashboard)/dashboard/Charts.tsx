"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/Card";
import type { DayAmount, DayCount, MonthCount } from "@/lib/api/dashboard";
import styles from "../shared.module.css";

const AXIS_COLOR = "#7c7c91";
const BAR_COLOR = "#7c4dff";
const LINE_COLOR = "#7c4dff";

function ChartCard<T extends object>({
  title,
  data,
  dataKey,
  xKey,
  kind = "bar",
}: {
  title: string;
  data: T[];
  dataKey: string;
  xKey: string;
  kind?: "bar" | "line";
}) {
  return (
    <Card>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <ResponsiveContainer width="100%" height={220}>
        {kind === "bar" ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4ec" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: AXIS_COLOR }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: AXIS_COLOR }} />
            <Tooltip />
            <Bar dataKey={dataKey} fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4ec" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: AXIS_COLOR }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: AXIS_COLOR }} />
            <Tooltip />
            <Line type="monotone" dataKey={dataKey} stroke={LINE_COLOR} strokeWidth={2} dot={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </Card>
  );
}

export function Charts({
  appointmentsByDay,
  bookingsByDay,
  revenueByDay,
  newPatientsByMonth,
  doctorGrowthByMonth,
  clinicGrowthByMonth,
}: {
  appointmentsByDay: DayCount[];
  bookingsByDay: DayCount[];
  revenueByDay: DayAmount[];
  newPatientsByMonth: MonthCount[];
  doctorGrowthByMonth: MonthCount[];
  clinicGrowthByMonth: MonthCount[];
}) {
  return (
    <div className={styles.chartsGrid}>
      <ChartCard title="Appointments Overview" data={appointmentsByDay} dataKey="count" xKey="date" kind="line" />
      <ChartCard title="Bookings by Day" data={bookingsByDay} dataKey="count" xKey="date" kind="bar" />
      <ChartCard title="Revenue" data={revenueByDay} dataKey="amount" xKey="date" kind="line" />
      <ChartCard title="New Patients" data={newPatientsByMonth} dataKey="count" xKey="month" kind="bar" />
      <ChartCard title="Doctor Growth" data={doctorGrowthByMonth} dataKey="count" xKey="month" kind="bar" />
      <ChartCard title="Clinic Growth" data={clinicGrowthByMonth} dataKey="count" xKey="month" kind="bar" />
    </div>
  );
}
