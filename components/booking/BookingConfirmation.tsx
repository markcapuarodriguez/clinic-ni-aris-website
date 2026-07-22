"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createQrImage } from "@/lib/appointments/qr";
import type { Appointment } from "@/types/appointment";
import { CLINIC_ADDRESS, CLINIC_NAME } from "@/lib/storage/seed";

interface Props {
  appointment: Appointment;
  onStartAgain: () => void;
  displayDate: (date: string) => string;
  displayTime: (time: string) => string;
}

export function BookingConfirmation({ appointment, onStartAgain, displayDate, displayTime }: Props) {
  const [qrImage, setQrImage] = useState("");
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    let active = true;
    createQrImage(appointment)
      .then((image) => { if (active) setQrImage(image); })
      .catch(() => { if (active) setQrError(true); });
    return () => { active = false; };
  }, [appointment]);

  return (
    <section className="card saved-message print-card" aria-live="polite">
      <div className="success-mark no-print" aria-hidden="true">✓</div>
      <p className="eyebrow">Kumpirmado na</p>
      <h2>Matagumpay ang inyong booking!</h2>
      <p>I-download o i-print ang tala ng pagbisita ni <strong>{appointment.patient.name}</strong>.</p>

      <div className="confirmation-layout">
        <dl>
          <div><dt>Pangalan</dt><dd>{appointment.patient.name}</dd></div>
          <div><dt>Petsa</dt><dd>{displayDate(appointment.date)}</dd></div>
          <div><dt>Oras</dt><dd>{displayTime(appointment.time)}</dd></div>
          <div><dt>Numero ng sanggunian</dt><dd>{appointment.referenceNumber}</dd></div>
        </dl>
        <div className="qr-panel">
          {qrImage && <Image unoptimized src={qrImage} alt={`QR code para sa pagbisita ${appointment.referenceNumber}`} width={240} height={240} />}
          {!qrImage && !qrError && <div className="qr-loading" role="status">Ginagawa ang QR code…</div>}
          {qrError && <p className="qr-error" role="alert">Hindi nagawa ang QR code. Subukang i-refresh ang pahina.</p>}
          <p>Ipakita ang QR code na ito pagdating sa klinika.</p>
        </div>
      </div>

      <div className="confirmation-actions no-print">
        {qrImage && <a className="primary-button action-link" href={qrImage} download={`${appointment.referenceNumber}-QR.png`}>I-download ang QR code</a>}
        <button type="button" className="secondary-button" onClick={() => window.print()}>I-print ang tala ng pagbisita</button>
      </div>
      <button type="button" className="text-button no-print" onClick={onStartAgain}>Magpa-iskedyul ng panibagong pagbisita</button>
      <p className="print-only print-footer">{CLINIC_NAME} • {CLINIC_ADDRESS} • Dalhin ang kopyang ito sa inyong appointment.</p>
    </section>
  );
}
