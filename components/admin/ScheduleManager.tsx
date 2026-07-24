import { useState } from "react";
import type { ClinicSchedule, Weekday } from "@/types/schedule";

interface Props { schedule: ClinicSchedule; onSave: (schedule: ClinicSchedule) => void; }
const DAYS: Array<{ id: Weekday; label: string }> = [
  { id: 1, label: "Monday" }, { id: 2, label: "Tuesday" }, { id: 3, label: "Wednesday" },
  { id: 4, label: "Thursday" }, { id: 5, label: "Friday" }, { id: 6, label: "Saturday" }, { id: 0, label: "Sunday" },
];

export function ScheduleManager({ schedule, onSave }: Props) {
  const [draft, setDraft] = useState<ClinicSchedule>(() => structuredClone(schedule));
  const [timeText, setTimeText] = useState<Record<Weekday, string>>(() => ({
    0: (schedule.weeklyHours[0] ?? []).join(", "), 1: (schedule.weeklyHours[1] ?? []).join(", "),
    2: (schedule.weeklyHours[2] ?? []).join(", "), 3: (schedule.weeklyHours[3] ?? []).join(", "),
    4: (schedule.weeklyHours[4] ?? []).join(", "), 5: (schedule.weeklyHours[5] ?? []).join(", "),
    6: (schedule.weeklyHours[6] ?? []).join(", "),
  }));
  const [closedDate, setClosedDate] = useState("");
  const [saved, setSaved] = useState(false);

  function addClosedDate() {
    if (!closedDate || draft.closedDates.includes(closedDate)) return;
    setDraft({ ...draft, closedDates: [...draft.closedDates, closedDate].sort() });
    setClosedDate("");
    setSaved(false);
  }

  return (
    <section className="card admin-panel" aria-labelledby="schedule-title">
      <div className="admin-section-heading"><div><p className="eyebrow">Oras ng klinika</p><h2 id="schedule-title">Iskedyul at Kapasidad</h2></div></div>
      <form className="admin-form" onSubmit={(event) => {
        event.preventDefault();
        const weeklyHours = Object.fromEntries(DAYS.map((day) => [day.id, [...new Set(timeText[day.id].split(",").map((time) => time.trim()).filter((time) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time)))].sort()]));
        const savedSchedule = { ...draft, weeklyHours } as ClinicSchedule;
        setDraft(savedSchedule); onSave(savedSchedule); setSaved(true);
      }}>
        <div className="capacity-field"><label>Pinakamaraming pasyente sa bawat oras<input type="number" min="1" max="20" value={draft.slotCapacity} onChange={(event) => { setDraft({ ...draft, slotCapacity: Math.max(1, Number(event.target.value)) }); setSaved(false); }} /></label></div>
        <div className="schedule-days"><p className="field-help">Ilagay ang oras sa 24-hour format at paghiwalayin ng kuwit. Halimbawa: 08:00, 08:30, 09:00</p>{DAYS.map((day) => (
          <label key={day.id}>{day.label}<input value={timeText[day.id]} onChange={(event) => { setTimeText({ ...timeText, [day.id]: event.target.value }); setSaved(false); }} placeholder="Sarado" /></label>
        ))}</div>
        <div className="closed-dates"><h3>Mga petsang sarado ang klinika</h3><div className="inline-control"><input type="date" value={closedDate} onChange={(event) => setClosedDate(event.target.value)} /><button type="button" className="secondary-button compact" onClick={addClosedDate}>Isara ang petsa</button></div>
          {draft.closedDates.length > 0 ? <ul>{draft.closedDates.map((date) => <li key={date}><span>{date}</span><button type="button" onClick={() => { setDraft({ ...draft, closedDates: draft.closedDates.filter((item) => item !== date) }); setSaved(false); }}>Buksan muli</button></li>)}</ul> : <p className="field-help">Walang espesyal na petsang sarado.</p>}
        </div>
        <button className="primary-button save-schedule" type="submit">I-save ang iskedyul</button>
        {saved && <p className="save-notice" role="status">Nai-save na ang iskedyul.</p>}
      </form>
    </section>
  );
}
