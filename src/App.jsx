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
                    < bouton
                      clé={clé}
                      onClick={() => onSet(player.id, s.date, key)}
                      style={{
                        ...styles.statusBtn,
                        arrière-plan : actif ? meta.bg : "#fff",
                        borderColor: active ? meta.color : "#E1E4DE",
                        couleur : active ? meta.color : "#9AA79B",
                      }}
                      titre={meta.label}
                    >
                      <Icône taille={13} />
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

fonction MiniStat({ étiquette, valeur, couleur }) {
  retour (
    <div style={styles.miniStat}>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "#8A968B" }}>{label}</div>
    </div>
  );
}

fonction PerformanceTab({ entrées, onAdd }) {
  const avg = entries.length ? (entries.reduce((a, e) => a + e.niveau, 0) / entries.length).toFixed(1) : "â€”";
  retour (
    <div>
      <div style={styles.sectionHeadRow}>
        <div style={styles.sectionHead}>Niveau moyen : <span style={{ color: "#D4A24C", fontFamily: "'Space Grotesk', sans-serif" }}>{avg}/5</span></div>
        <button style={styles.smallBtn} onClick={onAdd}>+ Évaluation</button>
      </div>
      <div style={styles.list}>
        {entries.length === 0 && <div style={styles.emptyState}>Aucune évaluation enregistrée pour le moment.</div>}
        {entrées.map((e, i) => (
          <div key={i} style={styles.perfRow}>
            <div style={{ flex: 1 }}>
              <div style={styles.sessionDate}>{new Date(e.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</div>
              <div style={styles.perfNote}>{e.note}</div>
            </div>
            <div style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} style={{ color: n <= e.niveau ? "#D4A24C" : "#E1E4DE", fontSize: 14 }}>â˜…</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaiementsTab({ entrées, onAdd, onMarkPaid }) {
  const totalDu = entrées.filter((e) => e.statut === "du").reduce((a, e) => a + e.montant, 0);
  retour (
    <div>
      <div style={styles.sectionHeadRow}>
        <div style={styles.sectionHead}>
          {totalDu > 0 ? (
            <span>Solde dà» : <span style={{ color: "#B3413A", fontFamily: "'Space Grotesk', sans-serif" }}>{totalDu.toLocaleString("fr-FR")} F CFA</span></span>
          ) : (
            <span style={{ color: "#2E7D4F" }}>Ã€ jour de cotisation</span>
          )}
        </div>
        <button style={styles.smallBtn} onClick={onAdd}>+ Échée</button>
      </div>
      <div style={styles.list}>
        {entries.length === 0 && <div style={styles.emptyState}>Aucun paiement enregistré pour le moment.</div>}
        {entrées.map((e, i) => (
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

// ---------- Modales ----------

fonction ModalShell({ titre, onClose, enfants, onSubmit }) {
  retour (
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
        {enfants}
      </form>
    </div>
  );
}

fonction AddPlayerModal({ onClose, onSave }) {
  const [form, setForm] = useState({ prenom: "", nom: "", numero: "", poste: POSITIONS[0], naissance: "", téléphone: "", tuteur: "", adhésion: aujourd'huiISO() });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  retour (
    <ModalShell
      titre="Ajouter un joueur"
      onClose={onClose}
      onSubmit={(e) => {
        e.prévenirDefault();
        si (!form.prenom || !form.nom) retourner;
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
        </Champ>
        <Field label="Date de naissance"><input type="date" style={styles.input} value={form.naissance} onChange={set("naissance")} /></Field>
        <Field label="Date d'adhésion"><input type="date" style={styles.input} value={form.adhesion} onChange={set("adhesion")} /></Field>
        <Field label="Téléphone"><input style={styles.input} value={form.telephone} onChange={set("telephone")} /></Field>
        <Field label="Tuteur / Contact"><input style={styles.input} value={form.tuteur} onChange={set("tuteur")} /></Field>
      </div>
      <button type="submit" style={styles.submitBtn}>Enregistrer le joueur</button>
    </ModalShell>
  );
}

fonction AddSessionModal({ onClose, onSave }) {
  const [date, setDate] = useState(todayISO());
  const [label, setLabel] = useState("Entrée");
  retour (
    <ModalShell
      titre="Ajouter une séance"
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
        </Champ>
      </div>
      <button type="submit" style={styles.submitBtn}>Ajouter la séance</button>
    </ModalShell>
  );
}

fonction AddPerfModal({ onClose, onSave }) {
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [niveau, setNiveau] = useState(3);
  retour (
    <ModalShell
      title="Ajouter une évaluation"
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); if (!note) retourne; onSave({ date, note, niveau }); }}
    >
      <div style={styles.formGrid}>
        <Field label="Date"><input required type="date" style={styles.input} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Niveau">
          <select style={styles.input} value={niveau} onChange={(e) => setNiveau(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} / 5</option>)}
          </select>
        </Champ>
      </div>
      <Field label="Observation">
        <textarea requis style={{ ...styles.input, minHeight: 70, resize: "vertical" }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex : Bonne prise de balle, à travailler le jeu de tête…" />
      </Champ>
      <button type="submit" style={styles.submitBtn}>Enregistrer l'évaluation</button>
    </ModalShell>
  );
}

fonction AddPaymentModal({ onClose, onSave }) {
  const [mois, setMois] = useState("");
  const [montant, setMontant] = useState(5000);
  const [statut, setStatut] = useState("du");
  retour (
    <ModalShell
      title="Ajouter une échance"
      onClose={onClose}
      onSubmit={(e) => {
        e.prévenirDefault();
        si (!mois) retourner;
        onSave({ mois, montant: Number(montant), statut, date: statut === "paye" ? TodayISO() : null });
      }}
    >
      <div style={styles.formGrid}>
        <Field label="Période (ex : Septembre 2026)"><input required style={styles.input} value={mois} onChange={(e) => setMois(e.target.value)} /></Field>
        <Field label="Montant (F CFA)"><input type="number" style={styles.input} value={montant} onChange={(e) => setMontant(e.target.value)} /></Field>
        <Field label="Statut">
          <select style={styles.input} value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="du">DÃ»</option>
            <option value="paye">Payé</option>
          </select>
        </Champ>
      </div>
      <button type="submit" style={styles.submitBtn}>S'inscrire</button>
    </ModalShell>
  );
}

fonction Champ({ étiquette, enfants }) {
  retour (
    <label style={styles.fieldLabel}>
      {étiquette}
      {enfants}
    </label>
  );
}

// ---------- Styles ----------

const fontImport = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap');
* { box-sizing: border-box; }
input:focus, select:focus, textarea:focus { outline: 2px solid #2E7D4F; outline-offset: 1px; }
bouton:focus-visible { contour: 2px solide #2E7D4F; décalage du contour: 2px; }
`;

const styles = {
  application : {
    affichage : « flex »,
    Hauteur minimale : "100vh",
    arrière-plan : « #F3F1EA »,
    fontFamily: "'Inter', sans-serif",
    couleur : « #1C2620 »,
  },
  barre latérale : {
    largeur : 260,
    arrière-plan : « #1B3A2A »,
    couleur : "#fff",
    affichage : « flex »,
    flexDirection: "colonne",
    marge intérieure : "20px 16px",
    flexShrink : 0,
  },
  marque : { affichage : « flex », alignement des éléments : « centre », écart : 10, marge inférieure : 20 },
  marque : { taille de police : 22 },
  brandTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: 0.5 },
  marqueSub: { fontSize: 11, color: "#9DBBA6" },
  searchWrap: { display: "flex", alignItems: "center", gap: 8, background: "#234832", borderRadius: 8, padding: "8px 10px", marginBottom: 14 },
  searchInput: { background: "transparent", border: "none", color: "#fff", fontSize: 13, width: "100%", outline: "none" },
  liste des participants : { flex : 1, overflowY : "auto", display : "flex", flexDirection : "column", gap : 4 },
  rosterItem: { display: "flex", alignItems: "center", gap: 10, padding: "9px 8px", borderRadius: 8, cursor: "pointer" },
  rosterItemActive: { background: "#234832" },
  rosterNum: { width: 26, height: 26, borderRadius: 6, background: "#2E5C40", color: "#CFE3D6", fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  rosterName: { fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },<
