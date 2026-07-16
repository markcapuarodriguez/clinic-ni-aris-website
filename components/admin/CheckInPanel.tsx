"use client";

import { useEffect, useRef, useState } from "react";
import type { Appointment } from "@/types/appointment";

interface Props { appointments: Appointment[]; onCheckIn: (appointment: Appointment) => void; }
interface DetectedBarcode { rawValue: string; }
interface BarcodeDetectorInstance { detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>; }
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorInstance;

function extractReference(value: string): string {
  const payloadMatch = value.match(/Appointment ID:\s*([^\n\r]+)/i);
  return (payloadMatch?.[1] ?? value).trim().toUpperCase();
}

export function CheckInPanel({ appointments, onCheckIn }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Appointment | null>(null);
  const [message, setMessage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);

  function stopCamera() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    timerRef.current = null;
    streamRef.current = null;
    setCameraActive(false);
  }

  useEffect(() => stopCamera, []);

  function findAppointment(value: string) {
    const reference = extractReference(value);
    const match = appointments.find((item) => item.referenceNumber.toUpperCase() === reference);
    setFound(match ?? null);
    setMessage(match ? "Nahanap ang tala ng pagbisita." : "Walang tala na tumutugma sa numero ng sanggunian.");
    if (match) stopCamera();
  }

  async function startCamera() {
    const detectorClass = (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
    if (!detectorClass || !navigator.mediaDevices?.getUserMedia) {
      setMessage("Hindi kayang gamitin ng browser na ito ang camera. Ilagay na lang ang numero ng sanggunian.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const detector = new detectorClass({ formats: ["qr_code"] });
      setCameraActive(true);
      setMessage("Itapat ang QR code sa camera.");
      timerRef.current = window.setInterval(async () => {
        if (!videoRef.current) return;
        const results = await detector.detect(videoRef.current).catch(() => []);
        if (results[0]?.rawValue) { setQuery(extractReference(results[0].rawValue)); findAppointment(results[0].rawValue); }
      }, 600);
    } catch {
      setMessage("Hindi mabuksan ang camera. Payagan ang camera o ilagay ang numero ng sanggunian.");
      stopCamera();
    }
  }

  return (
    <section className="card admin-panel narrow-panel" aria-labelledby="checkin-title">
      <div className="admin-section-heading"><div><p className="eyebrow">Pagdating ng pasyente</p><h2 id="checkin-title">Itala ang Pagdating</h2></div></div>
      <div className="checkin-content">
        <button type="button" className="camera-button" onClick={cameraActive ? stopCamera : startCamera}>{cameraActive ? "Isara ang camera" : "Buksan ang QR scanner"}</button>
        <video ref={videoRef} className={`scanner-video${cameraActive ? " visible" : ""}`} muted playsInline aria-label="Camera para sa QR scanner" />
        <div className="divider"><span>o</span></div>
        <form className="admin-form" onSubmit={(event) => { event.preventDefault(); findAppointment(query); }}>
          <label>Numero ng sanggunian<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Halimbawa: APPT-20260720-ABC123" required /></label>
          <button className="secondary-button" type="submit">Hanapin ang tala</button>
        </form>
        {message && <p className="lookup-message" role="status">{message}</p>}
        {found && <article className="patient-result"><h3>{found.patient.name}</h3><dl><div><dt>Petsa</dt><dd>{found.date}</dd></div><div><dt>Oras</dt><dd>{found.time}</dd></div><div><dt>Kalagayan</dt><dd>{found.status === "checked-in" ? "Dumating na" : found.status === "confirmed" ? "Kumpirmado" : found.status}</dd></div></dl>
          {found.status === "checked-in" ? <p className="save-notice">Naitala na ang pagdating ng pasyente.</p> : <button className="primary-button" type="button" onClick={() => { onCheckIn(found); setFound({ ...found, status: "checked-in" }); setMessage("Matagumpay na naitala ang pagdating."); }}>Itala ang pagdating</button>}
        </article>}
      </div>
    </section>
  );
}
