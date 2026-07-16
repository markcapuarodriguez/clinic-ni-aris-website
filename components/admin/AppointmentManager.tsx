import type { Appointment, AppointmentStatus } from "@/types/appointment";

interface Props {
  appointments: Appointment[];
  onStatusChange: (appointment: Appointment, status: AppointmentStatus) => void;
  onDelete: (appointment: Appointment) => void;
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Naghihintay",
  confirmed: "Kumpirmado",
  "checked-in": "Naka-check in",
  completed: "Natapos",
  cancelled: "Kinansela",
};

export function AppointmentManager({ appointments, onStatusChange, onDelete }: Props) {
  const sorted = [...appointments].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return (
    <section className="card admin-panel" aria-labelledby="appointments-title">
      <div className="admin-section-heading"><div><p className="eyebrow">Pamamahala</p><h2 id="appointments-title">Mga Pagbisita</h2></div><span>{appointments.length} lahat</span></div>
      {sorted.length === 0 ? <div className="admin-empty"><strong>Wala pang nakaiskedyul na pagbisita.</strong><p>Lalabas dito ang mga tala ng pasyente.</p></div> : (
        <div className="appointment-cards">{sorted.map((item) => (
          <article className="appointment-row" key={item.id}>
            <div className="appointment-main"><strong>{item.patient.name}</strong><span>{item.date} • {item.time}</span><small>{item.patient.phone} • {item.patient.reason}</small></div>
            <span className={`status-pill ${item.status}`}>{STATUS_LABELS[item.status]}</span>
            <div className="row-actions">
              {item.status !== "confirmed" && item.status !== "cancelled" && <button onClick={() => onStatusChange(item, "confirmed")}>Kumpirmahin</button>}
              {item.status !== "checked-in" && item.status !== "cancelled" && <button onClick={() => onStatusChange(item, "checked-in")}>Itala ang pagdating</button>}
              {item.status !== "completed" && item.status !== "cancelled" && <button onClick={() => onStatusChange(item, "completed")}>Tapusin</button>}
              {item.status !== "cancelled" && <button className="danger-outline" onClick={() => onStatusChange(item, "cancelled")}>Kanselahin</button>}
              <button className="danger-text" onClick={() => onDelete(item)}>Burahin</button>
            </div>
          </article>
        ))}</div>
      )}
    </section>
  );
}
