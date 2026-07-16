import { getAvailableTimes } from "@/lib/appointments/rules";
import { isPastDate, toDateKey } from "@/lib/dates/calendar";
import type { Appointment } from "@/types/appointment";
import type { ClinicSchedule } from "@/types/schedule";

interface Props {
  month: Date;
  selectedDate: string;
  schedule: ClinicSchedule;
  appointments: Appointment[];
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: string) => void;
}

const MONTHS = ["Enero", "Pebrero", "Marso", "Abril", "Mayo", "Hunyo", "Hulyo", "Agosto", "Setyembre", "Oktubre", "Nobyembre", "Disyembre"];
const WEEKDAYS = ["Lin", "Lun", "Mar", "Miy", "Huw", "Biy", "Sab"];

export function AppointmentCalendar({ month, selectedDate, schedule, appointments, onMonthChange, onSelectDate }: Props) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && monthIndex === today.getMonth();
  const cells = Array.from({ length: firstWeekday + dayCount }, (_, index) => index < firstWeekday ? null : index - firstWeekday + 1);

  return (
    <section className="card calendar-card" aria-labelledby="calendar-title">
      <div className="section-heading">
        <span className="step-number">1</span>
        <div><p className="eyebrow">Unang hakbang</p><h2 id="calendar-title">Pumili ng petsa</h2></div>
      </div>
      <div className="calendar-nav">
        <button type="button" className="nav-button" disabled={isCurrentMonth} onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))} aria-label="Nakaraang buwan">‹</button>
        <strong aria-live="polite">{MONTHS[monthIndex]} {year}</strong>
        <button type="button" className="nav-button" onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))} aria-label="Susunod na buwan">›</button>
      </div>
      <div className="calendar-grid calendar-weekdays" aria-hidden="true">
        {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar-grid" role="grid" aria-label={`${MONTHS[monthIndex]} ${year}`}>
        {cells.map((day, index) => {
          if (!day) return <span className="calendar-empty" key={`empty-${index}`} />;
          const dateKey = toDateKey(new Date(year, monthIndex, day));
          const available = !isPastDate(dateKey) && getAvailableTimes(dateKey, schedule, appointments).length > 0;
          const selected = selectedDate === dateKey;
          const isToday = dateKey === toDateKey(new Date());
          return (
            <button type="button" role="gridcell" key={dateKey} disabled={!available} aria-selected={selected}
              aria-label={`${MONTHS[monthIndex]} ${day}, ${year}${available ? ", may bakanteng oras" : ", walang bakanteng oras"}`}
              aria-current={isToday ? "date" : undefined}
              className={`calendar-day${available ? " available" : ""}${selected ? " selected" : ""}`}
              onClick={() => onSelectDate(dateKey)}>{day}</button>
          );
        })}
      </div>
      <p className="calendar-help"><span /> Ang kulay asul ay may bakanteng oras.</p>
    </section>
  );
}
