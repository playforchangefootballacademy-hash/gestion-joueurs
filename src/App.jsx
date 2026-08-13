import React, { useState, useMemo } from "react";
import { Users, UserPlus, CalendarCheck, TrendingUp, Wallet, X, Check, Minus, Clock, Search, ChevronRight, Trash2 } from "lucide-react";

// ---------- Seed data ----------
const POSITIONS = ["Gardien", "Défenseur", "Milieu", "Attaquant"];

const seedPlayers = [
  { id: "p1", nom: "Mbarga", prenom: "Junior", numero: 10, poste: "Attaquant", naissance: "2008-03-12", telephone: "690 12 34 56", tuteur: "Mme Mbarga Alice", adhesion: "2024-09-01" },
  { id: "p2", nom: "Fotso", prenom: "Divine", numero: 4, poste: "Défenseur", naissance: "2007-11-05", telephone: "677 98 21 43", tuteur: "M. Fotso Paul", adhesion: "2024-09-01" },
  { id: "p3", nom: "Nguema", prenom: "Christelle", numero: 1, poste: "Gardien", naissance: "2009-01-22", telephone: "699 45 67 89", tuteur: "Mme Nguema Rose", adhesion: "2025-01-15" },
  { id: "p4", nom: "Talla", prenom: "Steve", numero: 8, poste: "Milieu", naissance: "2008-07-30", telephone: "655 33 22 11", tuteur: "M. Talla Eric", adhesion: "2024-09-01" },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

const seedSessions = [
  { date: "2026-08-04", label: "Entraînement" },
  { date: "2026-08-06", label: "Entraînement" },
  { date: "2026-08-11", label: "Match amical" },
];

const seedAttendance = {
  p1: { "2026-08-04": "present", "2026-08-06": "present", "2026-08-11": "absent" },
  p2: { "2026-08-04": "present", "2026-08-06": "retard", "2026-08-11": "present" },
  p3: { "2026-08-04": "absent", "2026-08-06": "present", "2026-08-11": "present" },
  p4: { "2026-08-04": "present", "2026-08-06": "present", "2026-08-11": "present" },
};

const seedPerformance = {
  p1: [{ date: "2026-08-06", note: "Très bonne finition, 2 buts marqués.", niveau: 5 }],
  p2: [{ date: "2026-08-04", note: "Solide en défense, bon marquage.", niveau: 4 }],
  p3: [{ date: "2026-08-11", note: "Bons réflexes, une sortie manquée.", niveau: 3 }],
  p4: [{ date: "2026-08-06", note: "Bonne vision de jeu, à travailler côté physique.", niveau: 4 }],
};

const seedPayments = {
  p1: [{ mois: "Juin 2026", montant: 5000, date: "2026-06-03", statut: "paye" }, { mois: "Juillet 2026", montant: 5000, date: "2026-07-05", statut: "paye" }, { mois: "Août 2026", montant: 5000, date: null, statut: "du" }],
  p2: [{ mois: "Juin 2026", montant: 5000, date: "2026-06-10", statut: "paye" }, { mois: "Juillet 2026", montant: 5000, date: null, statut: "du" }, { mois: "Août 2026", montant: 5000, date: null, statut: "du" }],
  p3: [{ mois: "Juillet 2026", montant: 5000, date: "2026-07-02", statut: "paye" }, { mois: "Août 2026", montant: 5000, date: "2026-08-01", statut: "paye" }],
  p4: [{ mois: "Juin 2026", montant: 5000, date: "2026-06-20", statut: "paye" }, { mois: "Juillet 2026", montant: 5000, date: "2026-07-18", statut: "paye" }, { mois: "Août 2026", montant: 5000, date: null, statut: "du" }],
};

const STATUS_META = {
  present: { label: "Présent", color: "#2E7D4F", bg: "#E7F3EC", icon: Check },
  absent: { label: "Absent", color: "#B3413A", bg: "#FBEBEA", icon: X },
  retard: { label: "Retard", color: "#B8863B", bg: "#FBF2E3", icon: Clock },
};

function age(dateStr) {
  const b = new Date(dateStr);
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return a;
}

function initials(prenom, nom) {
  return `${prenom?.[0] || ""}${nom?.[0] || ""}`.toUpperCase();
}

export default function App() {
  const [players, setPlayers] = useState(seedPlayers);
  const [sessions, setSessions] = useState(seedSessions);
  const [attendance, setAttendance] = useState(seedAttendance);
  const [performance, setPerformance] = useState(seedPerformance);
  const [payments, setPayments] = useState(seedPayments);

  const [selectedId, setSelectedId] = useState(seedPlayers[0].id);
  const [tab, setTab] = useState("profil");
  const [search, setSearch] = useState("");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showAddPerf, setShowAddPerf] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);

  const selected = players.find((p) => p.id === selectedId);

  const filtered = players.filter((p) =>
    `${p.prenom} ${p.nom}`.toLowerCase().includes(search.toLowerCase())
  );

  // ---- derived stats ----
  const clubStats = useMemo(() => {
    const totalSessions = sessions.length;
    let presentCount = 0, total = 0;
    let duCount = 0, paidTotal = 0;
    players.forEach((p) => {
      sessions.forEach((s) => {
        const st = attendance[p.id]?.[s.date];
        if (st) {
          total++;
          if (st === "present") presentCount++;
        }
      });
      (payments[p.id] || []).forEach((pay) => {
        if (pay.statut === "du") duCount++;
        else paidTotal += pay.montant;
      });
    });
    return {
      totalSessions,
      tauxPresence: total ? Math.round((presentCount / total) * 100) : 0,
      duCount,
      paidTotal,
    };
  }, [players, sessions, attendance, payments]);

  function addPlayer(data) {
    const id = "p" + Date.now();
    setPlayers((prev) => [...prev, { id, ...data }]);
    setAttendance((prev) => ({ ...prev, [id]: {} }));
    setPerformance((prev) => ({ ...prev, [id]: [] }));
    setPayments((prev) => ({ ...prev, [id]: [] }));
    setSelectedId(id);
    setShowAddPlayer(false);
  }

  function removePlayer(id) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id && players.length > 1) {
      setSelectedId(players.find((p) => p.id !== id).id);
    }
  }

  function setAttendanceStatus(playerId, date, status) {
    setAttendance((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [date]: status },
    }));
  }

  function addSession(date, label) {
    setSessions((prev) => [...prev, { date, label }].sort((a, b) => a.date.localeCompare(b.date)));
    setShowAddSession(false);
  }

  function addPerf(playerId, entry) {
    setPerformance((prev) => ({
      ...prev,
      [playerId]: [...(prev[playerId] || []), entry].sort((a, b) => b.date.localeCompare(a.date)),
    }));
    setShowAddPerf(false);
  }

  function addPayment(playerId, entry) {
    setPayments((prev) => ({
      ...prev,
      [playerId]: [...(prev[playerId] || []), entry],
    }));
    setShowAddPayment(false);
  }

  function markPaid(playerId, idx) {
    setPayments((prev) => {
      const list = [...prev[playerId]];
      list[idx] = { ...list[idx], statut: "paye", date: todayISO() };
      return { ...prev, [playerId]: list };
    });
  }

  return (
    <div style={styles.app}>
      <style>{fontImport}</style>

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandMark}>⚽</div>
          <div>
            <div style={styles.brandTitle}>EFFECTIF</div>
            <div style={styles.brandSub}>Gestion des joueurs</div>
          </div>
        </div>

        <div style={styles.searchWrap}>
          <Search size={15} color="#9AA79B" style={{ flexShrink: 0 }} />
          <input
            style={styles.searchInput}
            placeholder="Rechercher un joueur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={styles.rosterList}>
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => { setSelectedId(p.id); setTab("profil"); }}
              style={{
                ...styles.rosterItem,
                ...(p.id === selectedId ? styles.rosterItemActive : {}),
              }}
            >
              <div style={{ ...styles.rosterNum, ...(p.id === selectedId ? { background: "#D4A24C", color: "#1B3A2A" } : {}) }}>
                {p.numero}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.rosterName}>{p.prenom} {p.nom}</div>
                <div style={styles.rosterPos}>{p.poste}</div>
              </div>
              <ChevronRight size={14} color="#7C8C7D" />
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ color: "#8A968B", fontSize: 13, padding: "12px 4px" }}>Aucun joueur trouvé.</div>
          )}
        </div>

        <button style={styles.addPlayerBtn} onClick={() => setShowAddPlayer(true)}>
          <UserPlus size={16} /> Ajouter un joueur
        </button>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.statsRow}>
          <StatCard icon={Users} label="Effectif" value={players.length} unit="joueurs" />
          <StatCard icon={CalendarCheck} label="Taux de présence" value={clubStats.tauxPresence + "%"} unit={sessions.length + " séances"} />
          <StatCard icon={Wallet} label="Cotisations dues" value={clubStats.duCount} unit="impayés" accent={clubStats.duCount > 0 ? "#B3413A" : "#2E7D4F"} />
          <StatCard icon={TrendingUp} label="Cotisations encaissées" value={clubStats.paidTotal.toLocaleString("fr-FR") + " F"} unit="CFA" />
        </div>

        {selected && (
          <>
            <div style={styles.profileHeader}>
              <div style={styles.avatarBig}>{initials(selected.prenom, selected.nom)}</div>
              <div style={{ flex: 1 }}>
                <div style={styles.profileName}>{selected.prenom} {selected.nom}</div>
                <div style={styles.profileMeta}>
                  N°{selected.numero} · {selected.poste} · {age(selected.naissance)} ans
                </div>
              </div>
              <button style={styles.deleteBtn} onClick={() => removePlayer(selected.id)} title="Retirer le joueur">
                <Trash2 size={15} />
              </button>
            </div>

            <div style={styles.tabs}>
              {[
                ["profil", "Profil"],
                ["presence", "Présence"],
                ["performance", "Performance"],
                ["paiements", "Paiements"],
              ].map(([key, label]) => (
                <div
                  key={key}
                  onClick={() => setTab(key)}
                  style={{ ...styles.tab, ...(tab === key ? styles.tabActive : {}) }}
                >
                  {label}
                </div>
              ))}
            </div>

            <div style={styles.panel}>
              {tab === "profil" && <ProfilTab player={selected} />}
              {tab === "presence" && (
                <PresenceTab
                  player={selected}
                  sessions={sessions}
                  attendance={attendance[selected.id] || {}}
                  onSet={setAttendanceStatus}
                  onAddSession={() => setShowAddSession(true)}
                />
              )}
              {tab === "performance" && (
                <PerformanceTab
                  entries={performance[selected.id] || []}
                  onAdd={() => setShowAddPerf(true)}
                />
              )}
              {tab === "paiements" && (
                <PaiementsTab
                  entries={payments[selected.id] || []}
                  onAdd={() => setShowAddPayment(true)}
                  onMarkPaid={(idx) => markPaid(selected.id, idx)}
                />
              )}
            </div>
          </>
        )}
      </main>

      {showAddPlayer && <AddPlayerModal onClose={() => setShowAddPlayer(false)} onSave={addPlayer} />}
      {showAddSession && <AddSessionModal onClose={() => setShowAddSession(false)} onSave={addSession} />}
      {showAddPerf && <AddPerfModal onClose={() => setShowAddPerf(false)} onSave={(e) => addPerf(selected.id, e)} />}
      {showAddPayment && <AddPaymentModal onClose={() => setShowAddPayment(false)} onSave={(e) => addPayment(selected.id, e)} />}
    </div>
  );
}

// ---------- Sub components ----------

function StatCard({ icon: Icon, label, value, unit, accent }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, color: accent || "#2E7D4F" }}>
        <Icon size={17} />
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: "#1C2620", lineHeight: 1.1, marginTop: 8 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#8A968B", marginTop: 2 }}>{label} · {unit}</div>
    </div>
  );
}

function ProfilTab({ player }) {
  const rows = [
    ["Nom complet", `${player.prenom} ${player.nom}`],
    ["Numéro de maillot", player.numero],
    ["Poste", player.poste],
    ["Date de naissance", new Date(player.naissance).toLocaleDateString("fr-FR")],
    ["Âge", age(player.naissance) + " ans"],
    ["Téléphone", player.telephone || "—"],
    ["Tuteur / Contact", player.tuteur || "—"],
    ["Date d'adhésion", new Date(player.adhesion).toLocaleDateString("fr-FR")],
  ];
  return (
    <div style={styles.infoGrid}>
      {rows.map(([label, value]) => (
        <div key={label} style={styles.infoRow}>
          <div style={styles.infoLabel}>{label}</div>
          <div style={styles.infoValue}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function PresenceTab({ player, sessions, attendance, onSet, onAddSession }) {
  const present = sessions.filter((s) => attendance[s.date] === "present").length;
  const absent = sessions.filter((s) => attendance[s.date] === "absent").length;
  const retard = sessions.filter((s) => attendance[s.date] === "retard").length;

  return (
    <div>
      <div style={styles.miniStatsRow}>
        <MiniStat label="Présences" value={present} color="#2E7D4F" />
        <MiniStat label="Absences" value={absent} color="#B3413A" />
        <MiniStat label="Retards" value={retard} color="#B8863B" />
      </div>
      <div style={styles.sectionHeadRow}>
        <div style={styles.sectionHead}>Séances</div>
        <button style={styles.smallBtn} onClick={onAddSession}>+ Séance</button>
      </div>
      <div style={styles.list}>
        {sessions.length === 0 && <div style={styles.emptyState}>Aucune séance enregistrée pour le moment.</div>}
        {[...sessions].reverse().map((s) => {
          const status = attendance[s.date];
          return (
            <div key={s.date} style={styles.sessionRow}>
              <div>
                <div style={styles.sessionDate}>{new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}</div>
                <div style={styles.sessionLabel}>{s.label}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["present", "retard", "absent"].map((key) => {
                  const meta = STATUS_META[key];
                  const active = status === key;
                  const Icon = meta.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => onSet(player.id, s.date, key)}
                      style={{
                        ...styles.statusBtn,
                        background: active ? meta.bg : "#fff",
                        borderColor: active ? meta.color : "#E1E4DE",
                        color: active ? meta.color : "#9AA79B",
                      }}
                      title={meta.label}
                    >
                      <Icon size={13} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={styles.miniStat}>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "#8A968B" }}>{label}</div>
    </div>
  );
}

function PerformanceTab({ entries, onAdd }) {
  const avg = entries.length ? (entries.reduce((a, e) => a + e.niveau, 0) / entries.length).toFixed(1) : "—";
  return (
    <div>
      <div style={styles.sectionHeadRow}>
        <div style={styles.sectionHead}>Niveau moyen : <span style={{ color: "#D4A24C", fontFamily: "'Space Grotesk', sans-serif" }}>{avg}/5</span></div>
        <button style={styles.smallBtn} onClick={onAdd}>+ Évaluation</button>
      </div>
      <div style={styles.list}>
        {entries.length === 0 && <div style={styles.emptyState}>Aucune évaluation enregistrée pour le moment.</div>}
        {entries.map((e, i) => (
          <div key={i} style={styles.perfRow}>
            <div style={{ flex: 1 }}>
              <div style={styles.sessionDate}>{new Date(e.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</div>
              <div style={styles.perfNote}>{e.note}</div>
            </div>
            <div style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} style={{ color: n <= e.niveau ? "#D4A24C" : "#E1E4DE", fontSize: 14 }}>★</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaiementsTab({ entries, onAdd, onMarkPaid }) {
  const totalDu = entries.filter((e) => e.statut === "du").reduce((a, e) => a + e.montant, 0);
  return (
    <div>
      <div style={styles.sectionHeadRow}>
        <div style={styles.sectionHead}>
          {totalDu > 0 ? (
            <span>Solde dû : <span style={{ color: "#B3413A", fontFamily: "'Space Grotesk', sans-serif" }}>{totalDu.toLocaleString("fr-FR")} F CFA</span></span>
          ) : (
            <span style={{ color: "#2E7D4F" }}>À jour de cotisation</span>
          )}
        </div>
        <button style={styles.smallBtn} onClick={onAdd}>+ Échéance</button>
      </div>
      <div style={styles.list}>
        {entries.length === 0 && <div style={styles.emptyState}>Aucun paiement enregistré pour le moment.</div>}
        {entries.map((e, i) => (
          <div key={i} style={styles.payRow}>
            <div>
              <div style={styles.sessionDate}>{e.mois}</div>
              <div style={styles.sessionLabel}>{e.date ? `Payé le ${new Date(e.date).toLocaleDateString("fr-FR")}` : "Non payé"}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>
                {e.montant.toLocaleString("fr-FR")} F
              </div>
              {e.statut === "du" ? (
                <button style={styles.payBtn} onClick={() => onMarkPaid(i)}>Marquer payé</button>
              ) : (
                <span style={styles.paidBadge}><Check size={11} /> Payé</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Modals ----------

function ModalShell({ title, onClose, children, onSubmit }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <form
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
      >
        <div style={styles.modalHead}>
          <div style={styles.modalTitle}>{title}</div>
          <button type="button" style={styles.modalClose} onClick={onClose}><X size={16} /></button>
        </div>
        {children}
      </form>
    </div>
  );
}

function AddPlayerModal({ onClose, onSave }) {
  const [form, setForm] = useState({ prenom: "", nom: "", numero: "", poste: POSITIONS[0], naissance: "", telephone: "", tuteur: "", adhesion: todayISO() });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <ModalShell
      title="Ajouter un joueur"
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.prenom || !form.nom) return;
        onSave({ ...form, numero: Number(form.numero) || 0 });
      }}
    >
      <div style={styles.formGrid}>
        <Field label="Prénom"><input r

Le jeu. 13 août 2026 à 11:31, Eboue Josepha <ebouejosepha@gmail.com> a écrit :
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

Le jeu. 13 août 2026 à 11:31, Eboue Josepha <ebouejosepha@gmail.com> a écrit :
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})

Le jeu. 13 août 2026 à 11:31, Eboue Josepha <ebouejosepha@gmail.com> a écrit :
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gestion des joueurs</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

Le jeu. 13 août 2026 à 11:30, Eboue Josepha <ebouejosepha@gmail.com> a écrit :
{
  "name": "gestion-joueurs",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.383.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.1"
  }
}

Le jeu. 13 août 2026 à 11:22, Eboue Josepha <ebouejosepha@gmail.com> a écrit :
import React, { useState, useMemo } from "react";
import { Users, UserPlus, CalendarCheck, TrendingUp, Wallet, X, Check, Minus, Clock, Search, ChevronRight, Trash2 } from "lucide-react";

// ---------- Données initiales ----------
const POSITIONS = ["Gardien", "Défenseur", "Milieu", "Attaquant"];

const seedPlayers = [
  { id : "p1", nom : "Mbarga", prenom : "Junior", numero : 10, poste : "Attaquant", naissance : "2008-03-12", téléphone : "690 12 34 56", tuteur : "Mme Mbarga Alice", adhésion : "2024-09-01" },
  { id : "p2", nom : "Fotso", prenom : "Divine", numero : 4, poste : "Défenseur", naissance : "2007-11-05", téléphone : "677 98 21 43", tuteur : "M. Fotso Paul", adhésion : "2024-09-01" },
  { id : "p3", nom : "Nguema", prenom : "Christelle", numero : 1, poste : "Gardien", naissance : "2009-01-22", téléphone : "699 45 67 89", tuteur : "Mme Nguema Rose", adhésion : "2025-01-15" },
  { id : "p4", nom : "Talla", prenom : "Steve", numero : 8, poste : "Milieu", naissance : "2008-07-30", téléphone : "655 33 22 11", tuteur : "M. Talla Eric", adhésion : "2024-09-01" },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

const seedSessions = [
  { date : "04/08/2026", label : "Entraînement" },
  { date : "2026-08-06", label : "Entraînement" },
  { date: "2026-08-11", label: "Match amical" },
];

const seedAttendance = {
  p1: { "2026-08-04": "présent", "2026-08-06": "présent", "2026-08-11": "absent" },
  p2: { "2026-08-04": "présent", "2026-08-06": "retard", "2026-08-11": "présent" },
  p3: { "2026-08-04": "absent", "2026-08-06": "présent", "2026-08-11": "présent" },
  p4: { "2026-08-04": "présent", "2026-08-06": "présent", "2026-08-11": "présent" },
};

const seedPerformance = {
  p1 : [{ date : "2026-08-06", note : "Très bonne finition, 2 buts marqués.", niveau : 5 }],
  p2 : [{ date : "2026-08-04", note : "Solide en défense, bon marquage.", niveau : 4 }],
  p3 : [{ date : "2026-08-11", note : "Bons réflexes, une sortie manquée.", niveau : 3 }],
  p4 : [{ date : "2026-08-06", note : "Bonne vision de jeu, à travailler côté physique.", niveau : 4 }],
};

const seedPayments = {
  p1: [{ mois: "Juin 2026", montant: 5000, date: "2026-06-03", statut: "paye" }, { mois: "Juillet 2026", montant: 5000, date: "2026-07-05", statut: "paye" }, { mois: "Août 2026", montant: 5000, date: null, statut : "du" }],
  p2: [{ mois: "Juin 2026", montant: 5000, date: "2026-06-10", statut: "paye" }, { mois: "Juillet 2026", montant: 5000, date: null, statut: "du" }, { mois: "Août 2026", montant: 5000, date: null, statut: "du" }],
  p3 : [{ mois : "Juillet 2026", montant : 5000, date : "2026-07-02", statut : "paye" }, { mois : "Août 2026", montant : 5000, date : "2026-08-01", statut : "paye" }],
  p4: [{ mois: "Juin 2026", montant: 5000, date: "2026-06-20", statut: "paye" }, { mois: "Juillet 2026", montant: 5000, date: "2026-07-18", statut: "paye" }, { mois: "Août 2026", montant: 5000, date: null, statut : "du" }],
};

const STATUS_META = {
  présent: { label: "Présent", color: "#2E7D4F", bg: "#E7F3EC", icon: Check },
  absent: { label: "Absent", color: "#B3413A", bg: "#FBEBEA", icon: X },
  retard: { label: "Retard", color: "#B8863B", bg: "#FBF2E3", icon: Clock },
};

fonction âge(dateStr) {
  const b = new Date(dateStr);
  const t = new Date();
  soit a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  si (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  renvoyer un;
}

initiales de la fonction (prenom, nom) {
  retourner `${prenom?.[0] || ""}${nom?.[0] || ""}`.toUpperCase();
}

export default function App() {
  const [players, setPlayers] = useState(seedPlayers);
  const [sessions, setSessions] = useState(seedSessions);
  const [attendance, setAttendance] = useState(seedAttendance);
  const [performance, setPerformance] = useState(seedPerformance);
  const [payments, setPayments] = useState(seedPayments);

  const [selectedId, setSelectedId] = useState(seedPlayers[0].id);
  const [tab, setTab] = useState("profil");
  const [search, setSearch] = useState("");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showAddPerf, setShowAddPerf] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);

  const selected = players.find((p) => p.id === selectedId);

  const filtré = joueurs.filter((p) =>
    `${p.prenom} ${p.nom}`.toLowerCase().includes(search.toLowerCase())
  );

  // ---- statistiques dérivées ----
  const clubStats = useMemo(() => {
    const totalSessions = sessions.length;
    soit presentCount = 0, total = 0 ;
    soit duCount = 0, paidTotal = 0 ;
    joueurs.forEach((p) => {
      sessions.forEach((s) => {
        const st = attendance[p.id]?.[s.date];
        si (st) {
          total++;
          si (st === "présent") presentCount++;
        }
      });
      (payments[p.id] || []).forEach((pay) => {
        if (pay.statut === "du") duCount++;
        sinon payéTotal += pay.montant;
      });
    });
    retour {
      Total des sessions,
      tauxPresence : total ? Math.round((presentCount / total) * 100) : 0,
      duCount,
      payéTotal,
    };
  }, [joueurs, sessions, présence, paiements]);

  fonction ajouterJoueur(données) {
    const id = "p" + Date.now();
    setPlayers((prev) => [...prev, { id, ...data }]);
    définir la présence((précédent) => ({ ...précédent, [id]: {} }));
    setPerformance((prev) => ({ ...prev, [id]: [] }));
    setPayments((prev) => ({ ...prev, [id]: [] }));
    définir l'ID sélectionné(id);
    afficherAjouterLecteur(false);
  }

  fonction supprimerPlayer(id) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    si (selectedId === id && players.length > 1) {
      setSelectedId(players.find((p) => p.id !== id).id);
    }
  }

  fonction définir le statut de présence(playerId, date, statut) {
    définir la présence((précédent) => ({
      ...précédent,
      [playerId]: { ...prev[playerId], [date]: statut },
    }));
  }

  fonction ajouterSession(date, étiquette) {
    setSessions((prev) => [...prev, { date, label }].sort((a, b) => a.date.localeCompare(b.date)));
    définirAfficherAjouterSession(false);
  }

  fonction ajouterPerf(playerId, entrée) {
    définirPerformance((précédent) => ({
      ...précédent,
      [playerId]: [...(prev[playerId] || []), entry].sort((a, b) => b.date.localeCompare(a.date)),
    }));
    définirAfficherAjouterPerf(false);
  }

  fonction ajouterPayment(playerId, entrée) {
    définirPayments((précédent) => ({
      ...précédent,
      [playerId]: [...(prev[playerId] || []), entrée],
    }));
    afficherAjouterPayment(false);
  }

  fonction markPaid(playerId, idx) {
    définirPayments((précédent) => {
      const liste = [...prev[playerId]];
      liste[idx] = { ...liste[idx], statut: "paye", date: todayISO() };
      renvoie { ...précédent, [playerId]: liste };
    });
  }

  retour (
    <div style={styles.app}>
      <style>{fontImport}</style>

      {/* Barre latérale */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandMark}>âš½</div>
          <div>
            <div style={styles.brandTitle}>EFFECTIF</div>
            <div style={styles.brandSub}>Gestion des joueurs</div>
          </div>
        </div>

        <div style={styles.searchWrap}>
          <Search size={15} color="#9AA79B" style={{ flexShrink: 0 }} />
          <input
            style={styles.searchInput}
            placeholder="Rechercher un joueur…"
            valeur={recherche}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={styles.rosterList}>
          {filtered.map((p) => (
            <div
              clé={p.id}
              onClick={() => { setSelectedId(p.id); setTab("profil"); }}
              style={{
                ...styles.rosterItem,
                ...(p.id === selectedId ? styles.rosterItemActive : {}),
              }}
            >
              <div style={{ ...styles.rosterNum, ...(p.id === selectedId ? { background: "#D4A24C", color: "#1B3A2A" } : {}) }}>
                {p.numéro}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.rosterName}>{p.prenom} {p.nom}</div>
                <div style={styles.rosterPos}>{p.poste}</div>
              </div>
              <ChevronRight taille={14} couleur="#7C8C7D" />
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ color: "#8A968B", fontSize: 13, padding: "12px 4px" }}>Aucun joueur trouvé.</div>
          )}
        </div>

        <button style={styles.addPlayerBtn} onClick={() => setShowAddPlayer(true)}>
          <UserPlus size={16} /> Ajouter un joueur
        </button>
      </aside>

      {/* Principal */}
      <main style={styles.main}>
        <div style={styles.statsRow}>
          <StatCard icon={Users} label="Effectif" value={players.length} unit="joueurs" />
          <StatCard icon={CalendarCheck} label="Taux de présence" value={clubStats.tauxPresence + "%"} unit={sessions.length + " séances"} />
          <StatCard icon={Wallet} label="Cotisations cotisations" value={clubStats.duCount} unit="impayés" accent={clubStats.duCount > 0 ? "#B3413A" : "#2E7D4F"} />
          <StatCard icon={TrendingUp} label="Cotisations encaissées" value={clubStats.paidTotal.toLocaleString("fr-FR") + " F"} unit="CFA" />
        </div>

        {sélectionné && (
          <>
            <div style={styles.profileHeader}>
              <div style={styles.avatarBig}>{initials(selected.prenom, selected.nom)}</div>
              <div style={{ flex: 1 }}>
                <div style={styles.profileName}>{selected.prenom} {selected.nom}</div>
                <div style={styles.profileMeta}>
                  N°{selected.numero} · {selected.poste} · {age(selected.naissance)} ans
                </div>
              </div>
              <button style={styles.deleteBtn} onClick={() => removePlayer(selected.id)} title="Retirer le joueur">
                <Trash2 taille={15} />
              </button>
            </div>

            <div style={styles.tabs}>
              {[
                ["profil", "Profil"],
                ["présence", "Présence"],
                ["performance", "Performance"],
                ["paiements", "Paiements"],
              ].map(([clé, étiquette]) => (
                <div
                  clé={clé}
                  onClick={() => setTab(touche)}
                  style={{ ...styles.tab, ...(tab === key ? styles.tabActive : {}) }}
                >
                  {étiquette}
                </div>
              ))}
            </div>

            <div style={styles.panel}>
              {tab === "profil" && <ProfilTab player={selected} />}
              {tab === "présence" && (
                <Onglet Présence
                  joueur={sélectionné}
                  sessions={sessions}
                  présence={présence[sélectionné.id] || {}}
                  onSet={setAttendanceStatus}
                  onAddSession={() => setShowAddSession(true)}
                />
              )}
              {tab === "performance" && (
                <Onglet Performance
                  entrées={performance[selected.id] || []}
                  onAdd={() => setShowAddPerf(true)}
                />
              )}
              {tab === "paiements" && (
                <PaiementsTab
                  entrées={paiements[sélectionné.id] || []}
                  onAdd={() => setShowAddPayment(true)}
                  onMarkPaid={(idx) => markPaid(selected.id, idx)}
                />
              )}
            </div>
          </>
        )}
      </main>

      {showAddPlayer && <AddPlayerModal onClose={() => setShowAddPlayer(false)} onSave={addPlayer} />}
      {showAddSession && <AddSessionModal onClose={() => setShowAddSession(false)} onSave={addSession} />}
      {showAddPerf && <AddPerfModal onClose={() => setShowAddPerf(false)} onSave={(e) => addPerf(selected.id, e)} />}
      {showAddPayment && <AddPaymentModal onClose={() => setShowAddPayment(false)} onSave={(e) => addPayment(selected.id, e)} />}
    </div>
  );
}

// ---------- Sous-composants ----------

fonction StatCard({ icône: Icône, étiquette, valeur, unité, accent }) {
  retour (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, color: accent || "#2E7D4F" }}>
        <Icône taille={17} />
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: "#1C2620", lineHeight: 1.1, marginTop: 8 }}>
        {valeur}
      </div>
      <div style={{ fontSize: 12, color: "#8A968B", marginTop: 2 }}>{label} · {unit}</div>
    </div>
  );
}

fonction ProfilTab({ joueur }) {
  const lignes = [
    ["Nom complet", `${player.prenom} ${player.nom}`],
    ["Numéro de maillot", player.numero],
    ["Poste", player.poste],
    ["Date de naissance", new Date(player.naissance).toLocaleDateString("fr-FR")],
    ["Âge", age(player.naissance) + " ans"],
    ["Téléphone", player.telephone || "-"],
    ["Tuteur / Contact", joueur.tuteur || "-"],
    ["Date d'adhésion", new Date(player.adhesion).toLocaleDateString("fr-FR")],
  ];
  retour (
    <div style={styles.infoGrid}>
      {rows.map(([label, value]) => (
        <div key={label} style={styles.infoRow}>
          <div style={styles.infoLabel}>{label}</div>
          <div style={styles.infoValue}>{value}</div>
        </div>
      ))}
    </div>
  );
}

fonction PresenceTab({ joueur, sessions, présence, onSet, onAddSession }) {
  const présent = sessions.filter((s) => attendance[s.date] === "présent").length;
  const absent = sessions.filter((s) => attendance[s.date] === "absent").length;
  const retard = sessions.filter((s) => attendance[s.date] === "retard").length;

  retour (
    <div>
      <div style={styles.miniStatsRow}>
        <MiniStat label="Présences" value={présent} color="#2E7D4F" />
        <MiniStat label="Absences" value={absent} color="#B3413A" />
        <MiniStat label="Retards" value={retard} color="#B8863B" />
      </div>
      <div style={styles.sectionHeadRow}>
        <div style={styles.sectionHead}>Séances</div>
        <button style={styles.smallBtn} onClick={onAddSession}>+ Séance</button>
      </div>
      <div style={styles.list}>
        {sessions.length === 0 && <div style={styles.emptyState}>Aucune séance enregistrée pour le moment.</div>}
        {[...sessions].reverse().map((s) => {
          const statut = présence[s.date];
          retour (
            <div key={s.date} style={styles.sessionRow}>
              <div>
                <div style={styles.sessionDate}>{new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}</div>
                <div style={styles.sessionLabel}>{s.label}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["présent", "retardé", "absent"].map((clé) => {
                  const meta = STATUS_META[clé];
                  const actif = statut === clé;
                  const Icône = meta.icône;
                  retour (
