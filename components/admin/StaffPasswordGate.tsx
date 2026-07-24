"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  authenticateStaff,
  type StaffPasswordState,
} from "@/app/admin/staff-auth-action";

const initialState: StaffPasswordState = { error: "" };

export function StaffPasswordGate({ staffName }: { staffName: string }) {
  const [state, formAction, pending] = useActionState(
    authenticateStaff,
    initialState,
  );

  return (
    <main className="staff-gate-page">
      <section className="staff-gate-card" aria-labelledby="staff-gate-title">
        <div className="staff-lock" aria-hidden="true">
          🔒
        </div>
        <p className="eyebrow">Para sa kawani</p>
        <h1 id="staff-gate-title">Ilagay ang password ng klinika</h1>
        <p>
          Naka-sign in bilang <strong>{staffName}</strong>. Kailangan ang
          password bago buksan ang pribadong talaan.
        </p>

        <form action={formAction}>
          <label htmlFor="staff-password">Password</label>
          <input
            autoComplete="current-password"
            autoFocus
            id="staff-password"
            name="password"
            required
            type="password"
          />
          {state.error ? (
            <p className="error-box" role="alert">
              {state.error}
            </p>
          ) : null}
          <button className="primary-button" disabled={pending} type="submit">
            {pending ? "Sinusuri…" : "Buksan ang talaan"}
          </button>
        </form>
        <Link className="staff-back-link" href="/">
          Bumalik sa appointment page
        </Link>
      </section>
    </main>
  );
}
