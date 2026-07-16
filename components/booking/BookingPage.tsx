"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppointmentCalendar } from "./AppointmentCalendar";
import { BookingConfirmation } from "./BookingConfirmation";
import { createAppointmentId, createReferenceNumber } from "@/lib/appointments/reference";
import { getAvailableTimes, validateBooking } from "@/lib/appointments/rules";
import { addAppointment, loadClinicData, type ClinicData } from "@/lib/storage/repository";
import { DEFAULT_CLINIC_SETTINGS } from "@/lib/storage/seed";
import type { Appointment, AppointmentDraft } from "@/types/appointment";

const EMPTY_PATIENT = { name: "", phone: "", email: "", reason: "" };

function displayDate(dateKey: string): string {
  if (!dateKey) return "";
  return new Intl.DateTimeFormat("fil-PH", { dateStyle: "long" }).format(new Date(`${dateKey}T00:00:00`));
}

function displayTime(time: string): string {
  if (!time) return "";
  const [hour, minute] = time.split(":").map(Number);
  return new Intl.DateTimeFormat("fil-PH", { hour: "numeric", minute: "2-digit" }).format(new Date(2026, 0, 1, hour, minute));
}

export function BookingPage() {
  const [data, setData] = useState<ClinicData>({ version: 1, appointments: [], settings: DEFAULT_CLINIC_SETTINGS });
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [patient, setPatient] = useState(EMPTY_PATIENT);
  const [errors, setErrors] = useState<string[]>([]);
  const [savedAppointment, setSavedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setData(loadClinicData()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const availableTimes = useMemo(() => selectedDate ? getAvailableTimes(selectedDate, data.settings.schedule, data.appointments) : [], [selectedDate, data]);

  function chooseDate(date: string) {
    setSelectedDate(date);
    setSelectedTime("");
    setErrors([]);
  }

  function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft: AppointmentDraft = { date: selectedDate, time: selectedTime, patient };
    const result = validateBooking(draft, data.settings.schedule, data.appointments);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    const now = new Date().toISOString();
    const appointment: Appointment = {
      id: createAppointmentId(),
      referenceNumber: createReferenceNumber(selectedDate),
      date: selectedDate,
      time: selectedTime,
      patient: { ...patient, email: patient.email?.trim() || undefined },
      status: "confirmed",
      createdAt: now,
      updatedAt: now,
    };
    setData(addAppointment(appointment));
    setSavedAppointment(appointment);
    setErrors([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startAgain() {
    setSelectedDate("");
    setSelectedTime("");
    setPatient(EMPTY_PATIENT);
    setSavedAppointment(null);
  }

  return (
    <main>
      <a className="skip-link" href="#main-content">Lumaktaw sa pagpapa-iskedyul</a>
      <header className="clinic-header">
        <div className="brand-mark" aria-hidden="true">A</div>
        <div><p className="clinic-label">Klinika para sa buong pamilya</p><h1>{data.settings.clinicName}</h1></div>
      </header>

      <div className="page-shell" id="main-content">
        <section className="announcement" aria-label="Paalala ng klinika">
          <span aria-hidden="true">!</span><div><strong>Paalala</strong><p>{data.settings.announcement}</p></div>
        </section>

        {savedAppointment ? (
          <BookingConfirmation appointment={savedAppointment} onStartAgain={startAgain} displayDate={displayDate} displayTime={displayTime} />
        ) : (
          <div className="booking-layout">
            <AppointmentCalendar month={month} selectedDate={selectedDate} schedule={data.settings.schedule} appointments={data.appointments} onMonthChange={setMonth} onSelectDate={chooseDate} />

            <div className="booking-details">
              <section className={`card flow-card${selectedDate ? " active" : ""}`} aria-labelledby="time-title">
                <div className="section-heading"><span className="step-number">2</span><div><p className="eyebrow">Ikalawang hakbang</p><h2 id="time-title">Pumili ng oras</h2></div></div>
                {!selectedDate ? <p className="empty-hint">Pumili muna ng petsa sa kalendaryo.</p> : (
                  <><p className="selected-summary">{displayDate(selectedDate)}</p><div className="time-grid">{availableTimes.map((time) => (
                    <button type="button" key={time} className={`time-button${selectedTime === time ? " selected" : ""}`} aria-pressed={selectedTime === time} onClick={() => { setSelectedTime(time); setErrors([]); }}>{displayTime(time)}</button>
                  ))}</div></>
                )}
              </section>

              <section className={`card flow-card${selectedTime ? " active" : ""}`} aria-labelledby="form-title">
                <div className="section-heading"><span className="step-number">3</span><div><p className="eyebrow">Ikatlong hakbang</p><h2 id="form-title">Ilagay ang inyong detalye</h2></div></div>
                {!selectedTime ? <p className="empty-hint">Pumili muna ng petsa at oras.</p> : (
                  <form onSubmit={submitBooking} noValidate>
                    {errors.length > 0 && <div className="error-box" role="alert"><strong>Pakitingnan ang sumusunod:</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
                    <label>Pangalan <span>*</span><input value={patient.name} onChange={(event) => setPatient({ ...patient, name: event.target.value })} autoComplete="name" required /></label>
                    <label>Numero ng telepono <span>*</span><input value={patient.phone} onChange={(event) => setPatient({ ...patient, phone: event.target.value })} autoComplete="tel" inputMode="tel" placeholder="Halimbawa: 09171234567" required /></label>
                    <label>Dahilan ng pagbisita <span>*</span><textarea value={patient.reason} onChange={(event) => setPatient({ ...patient, reason: event.target.value })} rows={3} required /></label>
                    <label>Adres ng email <small>(opsyonal)</small><input name="email" type="email" value={patient.email} onChange={(event) => setPatient({ ...patient, email: event.target.value })} autoComplete="email" /></label>
                    <div className="booking-summary"><strong>Napiling pagbisita</strong><p>{displayDate(selectedDate)} • {displayTime(selectedTime)}</p></div>
                    <button type="submit" className="primary-button">Ipa-iskedyul ang pagbisita</button>
                    <p className="required-note">Ang may <span>*</span> ay kailangang sagutan.</p>
                  </form>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
      <footer><p>© 2026 Klinika ni Dok Aris</p><p>Para sa agarang tulong, tumawag sa pinakamalapit na serbisyong pang-emerhensiya.</p><Link href="/admin">Para sa kawani</Link></footer>
    </main>
  );
}
