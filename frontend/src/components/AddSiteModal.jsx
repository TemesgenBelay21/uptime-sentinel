import { useState } from "react";

export default function AddSiteModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    url: "",
    checkIntervalMinutes: 5,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onAdd(form);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add site");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add a new monitor</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="site-name">Display name</label>
            <input
              id="site-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="site-url">URL to monitor</label>
            <input
              id="site-url"
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="site-interval">Check interval</label>
            <select
              id="site-interval"
              value={form.checkIntervalMinutes}
              onChange={(e) =>
                setForm({
                  ...form,
                  checkIntervalMinutes: Number(e.target.value),
                })
              }>
              {[1, 2, 5, 10, 15, 30].map((m) => (
                <option key={m} value={m}>
                  Every {m} minute{m !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Adding…" : "Add monitor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
