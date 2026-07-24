"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnnouncementEditor } from "./AnnouncementEditor";
import { AppointmentManager } from "./AppointmentManager";
import { CheckInPanel } from "./CheckInPanel";
import { ScheduleManager } from "./ScheduleManager";
import { getAvailableTimes } from "@/lib/appointments/rules";
import { toDateKey } from "@/lib/dates/calendar";
import { deleteAppointment, loadAdminClinicData, migrateLocalClinicData, updateAppointment, updateClinicSettings, type ClinicData } from "@/lib/storage/repository";
import { DEFAULT_CLINIC_SETTINGS } from "@/lib/storage/seed";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import type { ClinicSchedule } from "@/types/schedule";

interface Props { staffName: string; signOutPath: string; }
type AdminTab = "dashboard" | "appointments" | "schedule" | "checkin" | "announcement";
const STATUS_LABELS: Record<AppointmentStatus, string> = { pending: "Naghihintay", confirmed: "Kumpirmado", "checked-in": "Dumating na", completed: "Natapos", cancelled: "Kinansela" };

function countAvailableSlots(data: ClinicData, days = 30): number {
  const today = new Date();
  let total = 0;
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    total += getAvailableTimes(toDateKey(date), data.settings.schedule, data.appointments).length;
  }
  return total;
}

export function AdminDashboard({ staffName, signOutPath }: Props) {
  const [data, setData] = useState<ClinicData>({ version: 3, appointments: [], settings: DEFAULT_CLINIC_SETTINGS });
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    loadAdminClinicData()
      .then(async (clinicData) => (await migrateLocalClinicData()) ?? clinicData)
      .then((clinicData) => { if (active) setData(clinicData); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Hindi makakonekta sa online database."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const summary = useMemo(() => {
    const today = toDateKey(new Date());
    return {
      today: data.appointments.filter((item) => item.date === today && item.status !== "cancelled").length,
      upcoming: data.appointments.filter((item) => item.date > today && !["cancelled", "completed"].includes(item.status)).length,
      completed: data.appointments.filter((item) => item.status === "completed").length,
      cancelled: data.appointments.filter((item) => item.status === "cancelled").length,
      slots: countAvailableSlots(data),
    };
  }, [data]);

  const upcoming = useMemo(() => data.appointments.filter((item) => item.date >= toDateKey(new Date()) && item.status !== "cancelled").sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, 5), [data]);

  async function changeStatus(appointment: Appointment, status: AppointmentStatus) {
    try {
      setData(await updateAppointment({ ...appointment, status, updatedAt: new Date().toISOString() }));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Hindi ma-update ang appointment.");
    }
  }
  async function removeAppointment(appointment: Appointment) {
    if (!window.confirm(`Burahin ang appointment ni ${appointment.patient.name}? Hindi na ito maibabalik.`)) return;
    try {
      setData(await deleteAppointment(appointment.id));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Hindi mabura ang appointment.");
    }
  }
  async function saveSchedule(schedule: ClinicSchedule) {
    try {
      setData(await updateClinicSettings({ ...data.settings, schedule }));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Hindi ma-save ang iskedyul.");
    }
  }
  async function saveAnnouncement(announcement: string) {
    try {
      setData(await updateClinicSettings({ ...data.settings, announcement }));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Hindi ma-save ang paalala.");
    }
  }

  const navItems: Array<{ id: AdminTab; label: string }> = [
    { id: "dashboard", label: "Buod" }, { id: "appointments", label: "Mga Pagbisita" },
    { id: "schedule", label: "Iskedyul" }, { id: "checkin", label: "Pagdating" }, { id: "announcement", label: "Paalala" },
  ];

  return (
    <main className="admin-page">
      <a className="skip-link" href="#admin-content">Lumaktaw sa pangunahing nilalaman</a>
      <header className="admin-header"><div><p className="clinic-label">{data.settings.clinicName}</p><h1>Talaan ng Kawani</h1></div><div className="staff-account"><span>Nakapasok bilang<br /><strong>{staffName}</strong></span><a href={signOutPath}>Lumabas</a></div></header>
      <div className="admin-shell">
        <nav className="admin-nav" aria-label="Pangunahing navigation">
          {navItems.map((item) => <button type="button" key={item.id} className={tab === item.id ? "active" : ""} aria-current={tab === item.id ? "page" : undefined} onClick={() => setTab(item.id)}>{item.label}</button>)}
          <Link href="/">Pahina ng Pasyente</Link>
        </nav>
        <section className="admin-content" id="admin-content" tabIndex={-1}>
          {error && <div className="error-box" role="alert">{error}</div>}
          {loading && <section className="card loading-card" aria-live="polite"><strong>Kumokonekta sa online database…</strong></section>}
          {!loading && tab === "dashboard" && <DashboardOverview data={data} summary={summary} upcoming={upcoming} />}
          {!loading && tab === "appointments" && <AppointmentManager appointments={data.appointments} onStatusChange={changeStatus} onDelete={removeAppointment} />}
          {!loading && tab === "schedule" && <ScheduleManager schedule={data.settings.schedule} onSave={saveSchedule} />}
          {!loading && tab === "checkin" && <CheckInPanel appointments={data.appointments} onCheckIn={(appointment) => changeStatus(appointment, "checked-in")} />}
          {!loading && tab === "announcement" && <AnnouncementEditor announcement={data.settings.announcement} onSave={saveAnnouncement} />}
        </section>
      </div>
    </main>
  );
}

function DashboardOverview({ data, summary, upcoming }: { data: ClinicData; summary: { today: number; upcoming: number; completed: number; cancelled: number; slots: number }; upcoming: Appointment[] }) {
  return <section aria-labelledby="overview-title">
    <div className="admin-welcome"><div><p className="eyebrow">Pangkalahatang tanaw</p><h2 id="overview-title">Magandang araw!</h2><p>Narito ang kalagayan ng mga appointment sa klinika.</p></div><span>{new Intl.DateTimeFormat("fil-PH", { dateStyle: "full" }).format(new Date())}</span></div>
    <div className="summary-grid"><article className="summary-card blue"><span>Ngayong araw</span><strong>{summary.today}</strong><p>pagbisita</p></article><article className="summary-card sky"><span>Mga susunod</span><strong>{summary.upcoming}</strong><p>pagbisita</p></article><article className="summary-card green"><span>Natapos</span><strong>{summary.completed}</strong><p>pagbisita</p></article><article className="summary-card red"><span>Kinansela</span><strong>{summary.cancelled}</strong><p>pagbisita</p></article><article className="summary-card gold"><span>Bakanteng oras</span><strong>{summary.slots}</strong><p>sa susunod na 30 araw</p></article></div>
    <section className="card admin-list" aria-labelledby="upcoming-title"><div className="admin-section-heading"><div><p className="eyebrow">Mabilisang tingin</p><h2 id="upcoming-title">Mga susunod na appointment</h2></div><span>Unang 5</span></div>
      {upcoming.length === 0 ? <div className="admin-empty"><strong>Wala pang nakaiskedyul na pagbisita.</strong><p>Lalabas dito ang mga bagong tala ng pasyente.</p><Link href="/">Pumunta sa pahina ng pasyente</Link></div> : <div className="table-wrap"><table><caption className="sr-only">Limang susunod na pagbisita</caption><thead><tr><th>Pasyente</th><th>Petsa</th><th>Oras</th><th>Kalagayan</th></tr></thead><tbody>{upcoming.map((item) => <tr key={item.id}><td><strong>{item.patient.name}</strong><small>{item.patient.phone}</small></td><td>{item.date}</td><td>{item.time}</td><td><span className={`status-pill ${item.status}`}>{STATUS_LABELS[item.status]}</span></td></tr>)}</tbody></table></div>}
    </section><p className="storage-note">May {data.appointments.length} tala ng pagbisita sa kasalukuyang gamit ng klinika.</p>
  </section>;
}
