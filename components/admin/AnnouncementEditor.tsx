import { useState } from "react";

interface Props { announcement: string; onSave: (announcement: string) => void; }

export function AnnouncementEditor({ announcement, onSave }: Props) {
  const [text, setText] = useState(announcement);
  const [saved, setSaved] = useState(false);
  return (
    <section className="card admin-panel narrow-panel" aria-labelledby="announcement-title">
      <div className="admin-section-heading"><div><p className="eyebrow">Pahina ng pasyente</p><h2 id="announcement-title">Paalala</h2></div></div>
      <form className="admin-form" onSubmit={(event) => { event.preventDefault(); onSave(text.trim()); setSaved(true); }}>
        <label>Mensaheng makikita ng pasyente<textarea rows={5} value={text} onChange={(event) => { setText(event.target.value); setSaved(false); }} maxLength={240} required /></label>
        <div className="form-footer"><small>{text.length}/240 karakter</small><button className="primary-button" type="submit">I-save ang paalala</button></div>
        {saved && <p className="save-notice" role="status">Nai-save na ang paalala.</p>}
      </form>
    </section>
  );
}
