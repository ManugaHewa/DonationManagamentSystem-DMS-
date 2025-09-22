import React, { useEffect, useState } from "react";

type Donation = { id: string; donor: string; amount: number; currency: string };

export default function App() {
  const [items, setItems] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/v1/donations");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const total = items.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={{ margin: 0 }}>Donation Management System</h1>
        <p style={styles.muted}>React preview that calls the API</p>
      </header>

      <main style={styles.main}>
        <section style={styles.card}>
          <div style={styles.row}>
            <h2 style={{ margin: 0 }}>Recent donations</h2>
            <button onClick={load} style={styles.button}>Refresh</button>
          </div>

          {loading && <div style={styles.muted}>Loading...</div>}
          {err && <div style={{ color: "#ff6b6b" }}>Failed to load. {err}</div>}

          {!loading && !err && items.length === 0 && (
            <div style={styles.muted}>No donations yet.</div>
          )}

          <ul style={styles.list}>
            {items.map(d => (
              <li key={d.id} style={styles.item}>
                <code style={styles.id}>{d.id}</code>
                <div>{d.donor}</div>
                <div style={styles.amount}>{d.amount} {d.currency}</div>
              </li>
            ))}
          </ul>

          <div style={styles.total}>
            <span>Total:</span>
            <strong>{total.toFixed(2)} CAD</strong>
          </div>
        </section>
      </main>

      <footer style={{ ...styles.header, marginTop: 24 }}>
        <small style={styles.muted}>
          API: <code>/api/v1/donations</code> • Health: <code>/health</code>
        </small>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    color: "#e7eef7",
    background: "linear-gradient(180deg, #08101d, #0b1320)"
  },
  header: {
    width: "min(960px, 92vw)",
    margin: "24px auto 0"
  },
  main: {
    width: "min(960px, 92vw)",
    margin: "16px auto"
  },
  card: {
    background: "#121a2b",
    border: "1px solid #25314a",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,.25)"
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12
  },
  button: {
    background: "#3ea6ff",
    color: "#0a0a0a",
    border: "none",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600
  },
  list: { listStyle: "none", margin: 0, padding: 0 },
  item: {
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px dashed #25314a"
  },
  id: { color: "#9bb0c8" },
  amount: { fontWeight: 700 },
  total: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTop: "1px solid #25314a"
  },
  muted: { color: "#9bb0c8" }
};
