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
        <Field label="Prénom"><input required style={styles.input} value={form.prenom} onChange={set("prenom")} /></Field>
        <Field label="Nom"><input required style={styles.input} value={form.nom} onChange={set("nom")} /></Field>
        <Field label="Numéro"><input type="number" style={styles.input} value={form.numero} onChange={set("numero")} /></Field>
        <Field label="Poste">
          <select style={styles.input} value={form.poste} onChange={set("poste")}>
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Date de naissance"><input type="date" style={styles.input} value={form.naissance} onChange={set("naissance")} /></Field>
        <Field label="Date d'adhésion"><input type="date" style={styles.input} value={form.adhesion} onChange={set("adhesion")} /></Field>
        <Field label="Téléphone"><input style={styles.input} value={form.telephone} onChange={set("telephone")} /></Field>
        <Field label="Tuteur / Contact"><input style={styles.input} value={form.tuteur} onChange={set("tuteur")} /></Field>
      </div>
      <button type="submit" style={styles.submitBtn}>Enregistrer le joueur</button>
    </ModalShell>
  );
}

function AddSessionModal({ onClose, onSave }) {
  const [date, setDate] = useState(todayISO());
  const [label, setLabel] = useState("Entraînement");
  return (
    <ModalShell
      title="Ajouter une séance"
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); onSave(date, label); }}
    >
      <div style={styles.formGrid}>
        <Field label="Date"><input required type="date" style={styles.input} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Type">
          <select style={styles.input} value={label} onChange={(e) => setLabel(e.target.value)}>
            <option>Entraînement</option>
            <option>Match amical</option>
            <option>Match officiel</option>
          </select>
        </Field>
      </div>
      <button type="submit" style={styles.submitBtn}>Ajouter la séance</button>
    </ModalShell>
  );
}

function AddPerfModal({ onClose, onSave }) {
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [niveau, setNiveau] = useState(3);
  return (
    <ModalShell
      title="Ajouter une évaluation"
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); if (!note) return; onSave({ date, note, niveau }); }}
    >
      <div style={styles.formGrid}>
        <Field label="Date"><input required type="date" style={styles.input} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Niveau">
          <select style={styles.input} value={niveau} onChange={(e) => setNiveau(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} / 5</option>)}
          </select>
        </Field>
      </div>
      <Field label="Observation">
        <textarea required style={{ ...styles.input, minHeight: 70, resize: "vertical" }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex : Bonne prise de balle, à travailler le jeu de tête…" />
      </Field>
      <button type="submit" style={styles.submitBtn}>Enregistrer l'évaluation</button>
    </ModalShell>
  );
}

function AddPaymentModal({ onClose, onSave }) {
  const [mois, setMois] = useState("");
  const [montant, setMontant] = useState(5000);
  const [statut, setStatut] = useState("du");
  return (
    <ModalShell
      title="Ajouter une échéance"
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        if (!mois) return;
        onSave({ mois, montant: Number(montant), statut, date: statut === "paye" ? todayISO() : null });
      }}
    >
      <div style={styles.formGrid}>
        <Field label="Période (ex : Septembre 2026)"><input required style={styles.input} value={mois} onChange={(e) => setMois(e.target.value)} /></Field>
        <Field label="Montant (F CFA)"><input type="number" style={styles.input} value={montant} onChange={(e) => setMontant(e.target.value)} /></Field>
        <Field label="Statut">
          <select style={styles.input} value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="du">Dû</option>
            <option value="paye">Payé</option>
          </select>
        </Field>
      </div>
      <button type="submit" style={styles.submitBtn}>Enregistrer</button>
    </ModalShell>
  );
}

function Field({ label, children }) {
  return (
    <label style={styles.fieldLabel}>
      {label}
      {children}
    </label>
  );
}

// ---------- Styles ----------

const fontImport = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap');
* { box-sizing: border-box; }
input:focus, select:focus, textarea:focus { outline: 2px solid #2E7D4F; outline-offset: 1px; }
button:focus-visible { outline: 2px solid #2E7D4F; outline-offset: 2px; }
`;

const styles = {
  app: {
    display: "flex",
    minHeight: "100vh",
    background: "#F3F1EA",
    fontFamily: "'Inter', sans-serif",
    color: "#1C2620",
  },
  sidebar: {
    width: 260,
    background: "#1B3A2A",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    padding: "20px 16px",
    flexShrink: 0,
  },
  brand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20 },
  brandMark: { fontSize: 22 },
  brandTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: 0.5 },
  brandSub: { fontSize: 11, color: "#9DBBA6" },
  searchWrap: { display: "flex", alignItems: "center", gap: 8, background: "#234832", borderRadius: 8, padding: "8px 10px", marginBottom: 14 },
  searchInput: { background: "transparent", border: "none", color: "#fff", fontSize: 13, width: "100%", outline: "none" },
  rosterList: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 },
  rosterItem: { display: "flex", alignItems: "center", gap: 10, padding: "9px 8px", borderRadius: 8, cursor: "pointer" },
  rosterItemActive: { background: "#234832" },
  rosterNum: { width: 26, height: 26, borderRadius: 6, background: "#2E5C40", color: "#CFE3D6", fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  rosterName: { fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  rosterPos: { fontSize: 11, color: "#9DBBA6" },
  addPlayerBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, background: "#D4A24C", color: "#1B3A2A", border: "none", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" },

  main: { flex: 1, padding: "24px 32px", overflowY: "auto" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 },
  statCard: { background: "#fff", border: "1px solid #E6E3D9", borderRadius: 12, padding: "14px 16px" },
  statIcon: { display: "flex" },

  profileHeader: { display: "flex", alignItems: "center", gap: 14, marginBottom: 16 },
  avatarBig: { width: 52, height: 52, borderRadius: "50%", background: "#1B3A2A", color: "#D4A24C", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  profileName: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20 },
  profileMeta: { fontSize: 13, color: "#7C8C7D", marginTop: 2 },
  deleteBtn: { background: "#fff", border: "1px solid #E6E3D9", color: "#B3413A", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },

  tabs: { display: "flex", gap: 4, borderBottom: "1px solid #E6E3D9", marginBottom: 18 },
  tab: { padding: "9px 14px", fontSize: 13.5, fontWeight: 500, color: "#8A968B", cursor: "pointer", borderBottom: "2px solid transparent" },
  tabActive: { color: "#1B3A2A", borderBottom: "2px solid #2E7D4F", fontWeight: 600 },

  panel: { background: "#fff", border: "1px solid #E6E3D9", borderRadius: 12, padding: 20, maxWidth: 720 },

  infoGrid: { display: "flex", flexDirection: "column", gap: 0 },
  infoRow: { display: "flex", justifyContent: "space-between", padding: "10px 2px", borderBottom: "1px solid #F0EEE5" },
  infoLabel: { fontSize: 13, color: "#8A968B" },
  infoValue: { fontSize: 13.5, fontWeight: 600 },

  miniStatsRow: { display: "flex", gap: 24, marginBottom: 18 },
  miniStat: { textAlign: "center" },

  sectionHeadRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionHead: { fontSize: 13.5, fontWeight: 600, color: "#3D4A3F" },
  smallBtn: { background: "#F0EEE5", border: "none", borderRadius: 7, padding: "6px 11px", fontSize: 12.5, fontWeight: 600, color: "#1B3A2A", cursor: "pointer" },

  list: { display: "flex", flexDirection: "column", gap: 8 },
  emptyState: { fontSize: 13, color: "#9AA79B", padding: "16px 4px" },

  sessionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#FAF9F5", borderRadius: 9 },
  sessionDate: { fontSize: 13, fontWeight: 600, textTransform: "capitalize" },
  sessionLabel: { fontSize: 11.5, color: "#8A968B", marginTop: 1 },
  statusBtn: { width: 28, height: 28, borderRadius: 7, border: "1.5px solid", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },

  perfRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: "10px 12px", background: "#FAF9F5", borderRadius: 9 },
  perfNote: { fontSize: 13, marginTop: 3, color: "#3D4A3F", lineHeight: 1.4 },
  starRow: { display: "flex", gap: 1, flexShrink: 0, paddingTop: 2 },

  payRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#FAF9F5", borderRadius: 9 },
  payBtn: { background: "#1B3A2A", color: "#fff", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" },
  paidBadge: { display: "flex", alignItems: "center", gap: 4, background: "#E7F3EC", color: "#2E7D4F", fontSize: 11.5, fontWeight: 600, padding: "5px 9px", borderRadius: 6 },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(20,26,20,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 },
  modal: { background: "#fff", borderRadius: 14, padding: 22, width: 420, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 },
  modalClose: { background: "#F0EEE5", border: "none", borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },

  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 },
  fieldLabel: { display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600, color: "#5C6B5E" },
  input: { border: "1px solid #E1E4DE", borderRadius: 8, padding: "8px 10px", fontSize: 13.5, fontFamily: "'Inter', sans-serif", color: "#1C2620", background: "#fff" },
  submitBtn: { width: "100%", background: "#2E7D4F", color: "#fff", border: "none", borderRadius: 9, padding: "11px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginTop: 4 },
};









                                
