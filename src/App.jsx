import React, { useState, useMemo } from "react";
import {
  Users, UserPlus, UserCheck, CalendarCheck, TrendingUp, Wallet, X, Check, Minus, Clock,
  Search, ChevronRight, Trash2, LayoutDashboard, ClipboardList, GraduationCap, CalendarDays,
  Activity, Receipt, Package, FolderOpen, BarChart3, UserCog, Settings, AlertTriangle,
  FileText, Download, Printer,
} from "lucide-react";

// ======================================================================
// SEED DATA — module Joueurs (inchangé)
// ======================================================================
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

// ======================================================================
// SEED DATA — nouveaux modules
// ======================================================================
const seedCoaches = [
  { id: "c1", nom: "Jean Ateba", telephone: "690 11 22 33", specialite: "Entraîneur principal", categorie: "U13", terrain: "Terrain A", seances: 24 },
  { id: "c2", nom: "Paul Ondoa", telephone: "677 22 33 44", specialite: "Préparateur physique", categorie: "U17", terrain: "Terrain B", seances: 31 },
  { id: "c3", nom: "Marie Essomba", telephone: "699 33 44 55", specialite: "Entraîneur gardiens", categorie: "U19", terrain: "Terrain A", seances: 18 },
];

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const seedPlanning = [
  { id: "pl1", jour: "Lundi", debut: "15:00", fin: "17:00", categorie: "U13", entraineur: "Jean Ateba", terrain: "Terrain A" },
  { id: "pl2", jour: "Lundi", debut: "17:00", fin: "19:00", categorie: "U17", entraineur: "Paul Ondoa", terrain: "Terrain B" },
  { id: "pl3", jour: "Mercredi", debut: "16:00", fin: "18:00", categorie: "U9", entraineur: "Marie Essomba", terrain: "Terrain A" },
  { id: "pl4", jour: "Vendredi", debut: "15:30", fin: "17:30", categorie: "U15", entraineur: "Jean Ateba", terrain: "Terrain B" },
  { id: "pl5", jour: "Samedi", debut: "09:00", fin: "11:00", categorie: "U19", entraineur: "Paul Ondoa", terrain: "Terrain A" },
];

const seedStock = [
  { id: "s1", nom: "Ballons", initial: 50, entrees: 20, sorties: 10, seuil: 20 },
  { id: "s2", nom: "Maillots", initial: 100, entrees: 30, sorties: 25, seuil: 40 },
  { id: "s3", nom: "Chasubles", initial: 40, entrees: 10, sorties: 15, seuil: 30 },
  { id: "s4", nom: "Cônes", initial: 80, entrees: 20, sorties: 10, seuil: 25 },
];

const seedInvoices = [
  { id: "N°001", joueur: "Junior Mbarga", montant: 50000, paye: 50000 },
  { id: "N°002", joueur: "Divine Fotso", montant: 50000, paye: 0 },
  { id: "N°003", joueur: "Christelle Nguema", montant: 75000, paye: 35000 },
];

const seedDocCategories = [
  { nom: "Courriers reçus", count: 12 },
  { nom: "Courriers envoyés", count: 9 },
  { nom: "Documents administratifs", count: 21 },
  { nom: "Certificats", count: 34 },
  { nom: "Convocations", count: 7 },
  { nom: "Attestations", count: 15 },
  { nom: "Archives", count: 48 },
];

const seedRoles = [
  { role: "Administrateur", acces: "Tout" },
  { role: "Directeur", acces: "Joueurs, finances, planning, rapports" },
  { role: "Secrétaire", acces: "Inscriptions, joueurs, documents, factures" },
  { role: "Comptable", acces: "Paiements, factures, recettes, dépenses" },
  { role: "Entraîneur", acces: "Joueurs, présences, planning, évaluations" },
];

const seedUsers = [
  { id: "u1", nom: "Alice Mbarga", role: "Administrateur", email: "alice.mbarga@playforacademy.cm" },
  { id: "u2", nom: "Robert Essiane", role: "Directeur", email: "robert.essiane@playforacademy.cm" },
  { id: "u3", nom: "Chantal Biya", role: "Secrétaire", email: "chantal.biya@playforacademy.cm" },
  { id: "u4", nom: "Jean Ateba", role: "Entraîneur", email: "jean.ateba@playforacademy.cm" },
];

const seedInscriptionsRecent = [
  { id: "i1", nom: "Kevin Mbala", categorie: "U11", date: "2026-08-10" },
  { id: "i2", nom: "Sarah Ngo", categorie: "U9", date: "2026-08-09" },
  { id: "i3", nom: "Alain Fouda", categorie: "U15", date: "2026-08-07" },
];

const dashboardStats = {
  joueurs: 125,
  actifs: 110,
  nouvellesInscriptions: 8,
  paiementsMois: 1250000,
  entrainementsAujourdhui: 3,
  equipements: 245,
  facturesImpayees: 6,
};

const inscriptionsParMois = [
  { mois: "Mar", valeur: 10 }, { mois: "Avr", valeur: 14 }, { mois: "Mai", valeur: 9 },
  { mois: "Juin", valeur: 18 }, { mois: "Juil", valeur: 12 }, { mois: "Août", valeur: 8 },
];

const recettesParMois = [
  { mois: "Mar", valeur: 850000 }, { mois: "Avr", valeur: 920000 }, { mois: "Mai", valeur: 780000 },
  { mois: "Juin", valeur: 1100000 }, { mois: "Juil", valeur: 990000 }, { mois: "Août", valeur: 1250000 },
];

const effectifParCategorie = [
  { cat: "U9", valeur: 18 }, { cat: "U11", valeur: 22 }, { cat: "U13", valeur: 25 },
  { cat: "U15", valeur: 20 }, { cat: "U17", valeur: 23 }, { cat: "U19", valeur: 17 },
];

// ======================================================================
// MENU PRINCIPAL
// ======================================================================
const MENU = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "joueurs", label: "Joueurs", icon: Users },
  { key: "inscriptions", label: "Inscriptions", icon: ClipboardList },
  { key: "entraineurs", label: "Entraîneurs", icon: GraduationCap },
  { key: "planning", label: "Planning", icon: CalendarDays },
  { key: "entrainements", label: "Entraînements", icon: CalendarCheck },
  { key: "suivi", label: "Suivi des joueurs", icon: Activity },
  { key: "paiements", label: "Paiements", icon: Wallet },
  { key: "factures", label: "Factures", icon: Receipt },
  { key: "stocks", label: "Stocks / Équipements", icon: Package },
  { key: "secretariat", label: "Secrétariat", icon: FolderOpen },
  { key: "rapports", label: "Rapports", icon: BarChart3 },
  { key: "utilisateurs", label: "Utilisateurs", icon: UserCog },
  { key: "parametres", label: "Paramètres", icon: Settings },
];
const MODULE_TITLES = Object.fromEntries(MENU.map((m) => [m.key, m.label]));

// ======================================================================
// APP (nouveau point d'entrée)
// ======================================================================
export default function App() {
  const [module, setModule] = useState("dashboard");

  return (
    <div style={styles.shellRoot}>
      <style>{fontImport}</style>

      <aside style={styles.globalSidebar}>
        <div style={styles.brand}>
          <div style={styles.brandMark}>⚽</div>
          <div>
            <div style={styles.brandTitle}>PLAY FOR ACADEMY</div>
            <div style={styles.brandSub}>Gestion de club</div>
          </div>
        </div>
        <nav style={styles.navList}>
          {MENU.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              onClick={() => setModule(key)}
              style={{ ...styles.navItem, ...(module === key ? styles.navItemActive : {}) }}
            >
              <Icon size={16} />
              <span style={styles.navLabel}>{label}</span>
            </div>
          ))}
        </nav>
      </aside>

      <div style={styles.shellMain}>
        <header style={styles.shellHeader}>
          <div style={styles.shellHeaderTitle}>{MODULE_TITLES[module]}</div>
        </header>
        <div style={styles.shellBody}>
          {module === "dashboard" && <DashboardModule />}
          {module === "joueurs" && <JoueursModule />}
          {module === "inscriptions" && <InscriptionsModule />}
          {module === "entraineurs" && <EntraineursModule />}
          {module === "planning" && <PlanningModule />}
          {module === "entrainements" && <EntrainementsModule />}
          {module === "suivi" && <SuiviModule />}
          {module === "paiements" && <PaiementsModule />}
          {module === "factures" && <FacturesModule />}
          {module === "stocks" && <StocksModule />}
          {module === "secretariat" && <SecretariatModule />}
          {module === "rapports" && <RapportsModule />}
          {module === "utilisateurs" && <UtilisateursModule />}
          {module === "parametres" && <ParametresModule />}
        </div>
      </div>
    </div>
  );
}

// ======================================================================
// MODULE 1 — TABLEAU DE BORD
// ======================================================================
function DashboardModule() {
  return (
    <div style={styles.modulePad}>
      <div style={styles.statsRow7}>
        <StatCard icon={Users} label="Joueurs" value={dashboardStats.joueurs} unit="au total" />
        <StatCard icon={UserCheck} label="Joueurs actifs" value={dashboardStats.actifs} unit="actifs" />
        <StatCard icon={ClipboardList} label="Nouvelles inscriptions" value={dashboardStats.nouvellesInscriptions} unit="ce mois" />
        <StatCard icon={Wallet} label="Paiements du mois" value={dashboardStats.paiementsMois.toLocaleString("fr-FR") + " F"} unit="CFA" />
        <StatCard icon={CalendarCheck} label="Entraînements" value={dashboardStats.entrainementsAujourdhui} unit="aujourd'hui" />
        <StatCard icon={Package} label="Équipements" value={dashboardStats.equipements} unit="en stock" />
        <StatCard icon={AlertTriangle} label="Factures impayées" value={dashboardStats.facturesImpayees} unit="à relancer" accent="#B3413A" />
      </div>

      <div style={styles.dashGrid}>
        <div style={styles.panel}>
          <div style={styles.sectionHead}>Inscriptions par mois</div>
          <BarMiniChart data={inscriptionsParMois} labelKey="mois" valueKey="valeur" color="#2E7D4F" />
        </div>
        <div style={styles.panel}>
          <div style={styles.sectionHead}>Recettes / paiements</div>
          <BarMiniChart data={recettesParMois} labelKey="mois" valueKey="valeur" color="#D4A24C" format={(v) => Math.round(v / 1000) + "k"} />
        </div>
        <div style={styles.panel}>
          <div style={styles.sectionHead}>Effectifs par catégorie</div>
          <BarMiniChart data={effectifParCategorie} labelKey="cat" valueKey="valeur" color="#1B3A2A" />
        </div>
        <div style={styles.panel}>
          <div style={styles.sectionHead}>Prochains entraînements</div>
          <div style={styles.list}>
            {seedPlanning.slice(0, 4).map((s) => (
              <div key={s.id} style={styles.sessionRow}>
                <div>
                  <div style={styles.sessionDate}>{s.jour} · {s.debut}–{s.fin}</div>
                  <div style={styles.sessionLabel}>{s.categorie} · {s.entraineur} · {s.terrain}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={styles.panel}>
          <div style={styles.sectionHead}>Dernières inscriptions</div>
          <div style={styles.list}>
            {seedInscriptionsRecent.map((i) => (
              <div key={i.id} style={styles.sessionRow}>
                <div>
                  <div style={styles.sessionDate}>{i.nom}</div>
                  <div style={styles.sessionLabel}>{i.categorie} · {new Date(i.date).toLocaleDateString("fr-FR")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={styles.panel}>
          <div style={styles.sectionHead}>Alertes</div>
          <div style={styles.list}>
            <AlertRow icon={AlertTriangle} text={`${dashboardStats.facturesImpayees} factures impayées`} color="#B3413A" />
            <AlertRow icon={Package} text="Stock de chasubles faible" color="#B8863B" />
            <AlertRow icon={FileText} text="3 dossiers avec documents manquants" color="#B8863B" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertRow({ icon: Icon, text, color }) {
  return (
    <div style={styles.sessionRow}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon size={15} color={color} />
        <div style={{ fontSize: 13, fontWeight: 600 }}>{text}</div>
      </div>
    </div>
  );
}

function BarMiniChart({ data, labelKey, valueKey, color, format }) {
  const max = Math.max(...data.map((d) => d[valueKey]));
  return (
    <div style={styles.barChart}>
      {data.map((d, i) => (
        <div key={i} style={styles.barChartCol}>
          <div style={styles.barChartTrack}>
            <div style={{ ...styles.barChartFill, height: `${(d[valueKey] / max) * 100}%`, background: color }} />
          </div>
          <div style={styles.barChartVal}>{format ? format(d[valueKey]) : d[valueKey]}</div>
          <div style={styles.barChartLabel}>{d[labelKey]}</div>
        </div>
      ))}
    </div>
  );
}

// ======================================================================
// MODULE 2 — JOUEURS (ta page existante, inchangée dans sa logique)
// ======================================================================
function JoueursModule() {
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
    <div style={styles.joueursApp}>
      <aside style={styles.sidebar}>
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

// ---------- Sous-composants du module Joueurs (inchangés) ----------

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

// ---------- Modals du module Joueurs (inchangés) ----------

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

// ======================================================================
// MODULE 3 — INSCRIPTIONS (liste + assistant en 5 étapes)
// ======================================================================
function InscriptionsModule() {
  const [list, setList] = useState(seedInscriptionsRecent);
  const [showWizard, setShowWizard] = useState(false);

  function finish(entry) {
    setList((prev) => [{ id: "i" + Date.now(), nom: `${entry.prenom} ${entry.nom}`, categorie: entry.categorie, date: todayISO() }, ...prev]);
    setShowWizard(false);
  }

  return (
    <div style={styles.modulePad}>
      <div style={styles.sectionHeadRow}>
        <div style={styles.sectionHead}>Inscriptions récentes</div>
        <button style={styles.addPlayerBtnInline} onClick={() => setShowWizard(true)}>
          <UserPlus size={15} /> Nouvelle inscription
        </button>
      </div>
      <div style={styles.list}>
        {list.map((i) => (
          <div key={i.id} style={styles.sessionRow}>
            <div>
              <div style={styles.sessionDate}>{i.nom}</div>
              <div style={styles.sessionLabel}>{i.categorie} · {new Date(i.date).toLocaleDateString("fr-FR")}</div>
            </div>
            <ChevronRight size={14} color="#7C8C7D" />
          </div>
        ))}
      </div>
      {showWizard && <InscriptionWizard onClose={() => setShowWizard(false)} onFinish={finish} />}
    </div>
  );
}

function InscriptionWizard({ onClose, onFinish }) {
  const [step, setStep] = useState(1);
  const [joueur, setJoueur] = useState({ prenom: "", nom: "", naissance: "", sexe: "M", categorie: "U11", poste: POSITIONS[0], numero: "" });
  const [parent, setParent] = useState({ nom: "", telephone: "", whatsapp: "", email: "", adresse: "" });
  const [docs, setDocs] = useState({ certificat: false, acte: false, photo: false, autorisation: false });
  const [paiement, setPaiement] = useState({ montant: 5000, mode: "Espèces", date: todayISO(), reference: "" });

  const steps = ["Joueur", "Parent/tuteur", "Documents", "Paiement", "Validation"];

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modal, width: 540 }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHead}>
          <div style={styles.modalTitle}>Nouvelle inscription</div>
          <button type="button" style={styles.modalClose} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={styles.wizardSteps}>
          {steps.map((s, i) => (
            <div
              key={s}
              style={{
                ...styles.wizardStep,
                ...(step === i + 1 ? styles.wizardStepActive : {}),
                ...(step > i + 1 ? styles.wizardStepDone : {}),
              }}
            >
              {i + 1}. {s}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div style={styles.formGrid}>
            <Field label="Prénom"><input style={styles.input} value={joueur.prenom} onChange={(e) => setJoueur({ ...joueur, prenom: e.target.value })} /></Field>
            <Field label="Nom"><input style={styles.input} value={joueur.nom} onChange={(e) => setJoueur({ ...joueur, nom: e.target.value })} /></Field>
            <Field label="Date de naissance"><input type="date" style={styles.input} value={joueur.naissance} onChange={(e) => setJoueur({ ...joueur, naissance: e.target.value })} /></Field>
            <Field label="Sexe">
              <select style={styles.input} value={joueur.sexe} onChange={(e) => setJoueur({ ...joueur, sexe: e.target.value })}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </Field>
            <Field label="Catégorie">
              <select style={styles.input} value={joueur.categorie} onChange={(e) => setJoueur({ ...joueur, categorie: e.target.value })}>
                {["U9", "U11", "U13", "U15", "U17", "U19"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Poste">
              <select style={styles.input} value={joueur.poste} onChange={(e) => setJoueur({ ...joueur, poste: e.target.value })}>
                {POSITIONS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Numéro de maillot"><input type="number" style={styles.input} value={joueur.numero} onChange={(e) => setJoueur({ ...joueur, numero: e.target.value })} /></Field>
          </div>
        )}

        {step === 2 && (
          <div style={styles.formGrid}>
            <Field label="Nom"><input style={styles.input} value={parent.nom} onChange={(e) => setParent({ ...parent, nom: e.target.value })} /></Field>
            <Field label="Téléphone"><input style={styles.input} value={parent.telephone} onChange={(e) => setParent({ ...parent, telephone: e.target.value })} /></Field>
            <Field label="WhatsApp"><input style={styles.input} value={parent.whatsapp} onChange={(e) => setParent({ ...parent, whatsapp: e.target.value })} /></Field>
            <Field label="Email"><input type="email" style={styles.input} value={parent.email} onChange={(e) => setParent({ ...parent, email: e.target.value })} /></Field>
            <Field label="Adresse"><input style={styles.input} value={parent.adresse} onChange={(e) => setParent({ ...parent, adresse: e.target.value })} /></Field>
          </div>
        )}

        {step === 3 && (
          <div style={styles.list}>
            {[["certificat", "Certificat médical"], ["acte", "Acte de naissance"], ["photo", "Photo"], ["autorisation", "Autorisation parentale"]].map(([key, label]) => (
              <label key={key} style={{ ...styles.sessionRow, cursor: "pointer" }}>
                <div style={styles.sessionDate}>{label}</div>
                <input type="checkbox" checked={docs[key]} onChange={(e) => setDocs({ ...docs, [key]: e.target.checked })} />
              </label>
            ))}
          </div>
        )}

        {step === 4 && (
          <div style={styles.formGrid}>
            <Field label="Montant (F CFA)"><input type="number" style={styles.input} value={paiement.montant} onChange={(e) => setPaiement({ ...paiement, montant: e.target.value })} /></Field>
            <Field label="Mode de paiement">
              <select style={styles.input} value={paiement.mode} onChange={(e) => setPaiement({ ...paiement, mode: e.target.value })}>
                <option>Espèces</option>
                <option>Orange Money</option>
                <option>MTN MoMo</option>
                <option>Virement</option>
              </select>
            </Field>
            <Field label="Date"><input type="date" style={styles.input} value={paiement.date} onChange={(e) => setPaiement({ ...paiement, date: e.target.value })} /></Field>
            <Field label="Référence"><input style={styles.input} value={paiement.reference} onChange={(e) => setPaiement({ ...paiement, reference: e.target.value })} /></Field>
          </div>
        )}

        {step === 5 && (
          <div style={styles.infoGrid}>
            <div style={styles.infoRow}><div style={styles.infoLabel}>Joueur</div><div style={styles.infoValue}>{joueur.prenom} {joueur.nom} · {joueur.categorie}</div></div>
            <div style={styles.infoRow}><div style={styles.infoLabel}>Parent</div><div style={styles.infoValue}>{parent.nom || "—"}</div></div>
            <div style={styles.infoRow}><div style={styles.infoLabel}>Paiement</div><div style={styles.infoValue}>{Number(paiement.montant).toLocaleString("fr-FR")} F · {paiement.mode}</div></div>
            <div style={{ ...styles.infoRow, borderBottom: "none" }}>
              <div style={{ fontSize: 12.5, color: "#2E7D4F", fontWeight: 600 }}>Prêt à valider : joueur créé, facture générée, reçu disponible.</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {step > 1 && <button type="button" style={{ ...styles.smallBtn, flex: 1 }} onClick={() => setStep(step - 1)}>Précédent</button>}
          {step < 5 && <button type="button" style={{ ...styles.submitBtn, marginTop: 0 }} onClick={() => setStep(step + 1)}>Suivant</button>}
          {step === 5 && <button type="button" style={{ ...styles.submitBtn, marginTop: 0 }} onClick={() => onFinish(joueur)}>Valider l'inscription</button>}
        </div>
      </div>
    </div>
  );
}

// ======================================================================
// MODULE 4 — ENTRAÎNEURS
// ======================================================================
function EntraineursModule() {
  return (
    <div style={styles.modulePad}>
      <div style={styles.cardGrid}>
        {seedCoaches.map((c) => (
          <div key={c.id} style={styles.panel}>
            <div style={styles.profileHeader}>
              <div style={styles.avatarBig}>{c.nom.split(" ").map((n) => n[0]).join("")}</div>
              <div>
                <div style={styles.profileName}>{c.nom}</div>
                <div style={styles.profileMeta}>{c.specialite}</div>
              </div>
            </div>
            <div style={styles.infoGrid}>
              <div style={styles.infoRow}><div style={styles.infoLabel}>Téléphone</div><div style={styles.infoValue}>{c.telephone}</div></div>
              <div style={styles.infoRow}><div style={styles.infoLabel}>Catégorie</div><div style={styles.infoValue}>{c.categorie}</div></div>
              <div style={styles.infoRow}><div style={styles.infoLabel}>Terrain habituel</div><div style={styles.infoValue}>{c.terrain}</div></div>
              <div style={{ ...styles.infoRow, borderBottom: "none" }}><div style={styles.infoLabel}>Séances réalisées</div><div style={styles.infoValue}>{c.seances}</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ======================================================================
// MODULE 5 — PLANNING (vue calendrier hebdomadaire)
// ======================================================================
function PlanningModule() {
  return (
    <div style={styles.modulePad}>
      <div style={styles.planningGrid}>
        {JOURS.map((jour) => (
          <div key={jour} style={styles.planningCol}>
            <div style={styles.planningDayHead}>{jour}</div>
            {seedPlanning.filter((s) => s.jour === jour).map((s) => (
              <div key={s.id} style={styles.planningCard}>
                <div style={styles.planningTime}>{s.debut} – {s.fin}</div>
                <div style={styles.planningCat}>{s.categorie}</div>
                <div style={styles.planningMeta}>{s.entraineur}</div>
                <div style={styles.planningMeta}>{s.terrain}</div>
              </div>
            ))}
            {seedPlanning.filter((s) => s.jour === jour).length === 0 && <div style={styles.emptyState}>—</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ======================================================================
// MODULE 6 — ENTRAÎNEMENTS (historique des séances)
// ======================================================================
function EntrainementsModule() {
  return (
    <div style={styles.modulePad}>
      <div style={styles.sectionHead}>Historique des séances</div>
      <div style={styles.list}>
        {[...seedSessions].reverse().map((s) => (
          <div key={s.date} style={styles.sessionRow}>
            <div>
              <div style={styles.sessionDate}>{new Date(s.date).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" })}</div>
              <div style={styles.sessionLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ======================================================================
// MODULE 7 — SUIVI DES JOUEURS (vue agrégée)
// ======================================================================
function SuiviModule() {
  return (
    <div style={styles.modulePad}>
      <div style={styles.cardGrid}>
        {seedPlayers.map((p) => {
          const perf = seedPerformance[p.id] || [];
          const avg = perf.length ? (perf.reduce((a, e) => a + e.niveau, 0) / perf.length).toFixed(1) : "—";
          const att = seedAttendance[p.id] || {};
          const values = Object.values(att);
          const presences = values.filter((v) => v === "present").length;
          const taux = values.length ? Math.round((presences / values.length) * 100) : 0;
          return (
            <div key={p.id} style={styles.panel}>
              <div style={styles.profileHeader}>
                <div style={styles.avatarBig}>{initials(p.prenom, p.nom)}</div>
                <div>
                  <div style={styles.profileName}>{p.prenom} {p.nom}</div>
                  <div style={styles.profileMeta}>{p.poste}</div>
                </div>
              </div>
              <div style={styles.miniStatsRow}>
                <MiniStat label="Présence" value={taux + "%"} color="#2E7D4F" />
                <MiniStat label="Niveau moyen" value={avg + "/5"} color="#D4A24C" />
              </div>
              {perf[0] && <div style={styles.perfNote}>{perf[0].note}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ======================================================================
// MODULE 8 — PAIEMENTS (vue agrégée de tous les joueurs)
// ======================================================================
function PaiementsModule() {
  const rows = [];
  seedPlayers.forEach((p) => {
    (seedPayments[p.id] || []).forEach((pay) => {
      rows.push({ joueur: `${p.prenom} ${p.nom}`, ...pay });
    });
  });
  rows.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <div style={styles.modulePad}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Joueur</th>
            <th style={styles.th}>Montant</th>
            <th style={styles.th}>Statut</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={styles.td}>{r.date ? new Date(r.date).toLocaleDateString("fr-FR") : "—"}</td>
              <td style={styles.td}>{r.joueur}</td>
              <td style={styles.td}>{r.montant.toLocaleString("fr-FR")} F</td>
              <td style={styles.td}>
                {r.statut === "paye" ? <span style={styles.paidBadge}><Check size={11} /> Payé</span> : <span style={{ color: "#B3413A", fontWeight: 600, fontSize: 12.5 }}>Dû</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ======================================================================
// MODULE 9 — FACTURES
// ======================================================================
function FacturesModule() {
  const [invoices] = useState(seedInvoices);
  return (
    <div style={styles.modulePad}>
      <div style={styles.sectionHeadRow}>
        <div style={styles.sectionHead}>Factures</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={styles.smallBtn}>+ Nouvelle facture</button>
          <button style={styles.smallBtn}><Printer size={12} /> Imprimer</button>
          <button style={styles.smallBtn}><Download size={12} /> PDF</button>
        </div>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>N°</th>
            <th style={styles.th}>Joueur</th>
            <th style={styles.th}>Montant</th>
            <th style={styles.th}>Payé</th>
            <th style={styles.th}>Solde</th>
            <th style={styles.th}>Statut</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const solde = inv.montant - inv.paye;
            const statut = solde <= 0 ? "PAYÉE" : inv.paye === 0 ? "IMPAYÉE" : "PARTIELLE";
            const color = statut === "PAYÉE" ? "#2E7D4F" : statut === "IMPAYÉE" ? "#B3413A" : "#B8863B";
            return (
              <tr key={inv.id}>
                <td style={styles.td}>{inv.id}</td>
                <td style={styles.td}>{inv.joueur}</td>
                <td style={styles.td}>{inv.montant.toLocaleString("fr-FR")} F</td>
                <td style={styles.td}>{inv.paye.toLocaleString("fr-FR")} F</td>
                <td style={styles.td}>{solde.toLocaleString("fr-FR")} F</td>
                <td style={styles.td}><span style={{ color, fontWeight: 700, fontSize: 12 }}>{statut}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ======================================================================
// MODULE 10 — STOCKS / ÉQUIPEMENTS
// ======================================================================
function StocksModule() {
  const [stock, setStock] = useState(seedStock);
  const [showAdd, setShowAdd] = useState(false);
  const [moveModal, setMoveModal] = useState(null);

  function applyMove(id, type, qty) {
    setStock((prev) => prev.map((s) => (s.id === id ? { ...s, [type]: s[type] + qty } : s)));
    setMoveModal(null);
  }

  function addItem(item) {
    setStock((prev) => [...prev, { id: "s" + Date.now(), entrees: 0, sorties: 0, ...item }]);
    setShowAdd(false);
  }

  return (
    <div style={styles.modulePad}>
      <div style={styles.sectionHeadRow}>
        <div style={styles.sectionHead}>Stocks / Équipements</div>
        <button style={styles.smallBtn} onClick={() => setShowAdd(true)}>+ Ajouter équipement</button>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Équipement</th>
            <th style={styles.th}>Initial</th>
            <th style={styles.th}>Entrées</th>
            <th style={styles.th}>Sorties</th>
            <th style={styles.th}>Actuel</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {stock.map((s) => {
            const actuel = s.initial + s.entrees - s.sorties;
            const low = actuel < s.seuil;
            return (
              <tr key={s.id}>
                <td style={styles.td}>
                  {s.nom} {low && <AlertTriangle size={12} color="#B3413A" style={{ marginLeft: 4, verticalAlign: "middle" }} />}
                </td>
                <td style={styles.td}>{s.initial}</td>
                <td style={styles.td}>{s.entrees}</td>
                <td style={styles.td}>{s.sorties}</td>
                <td style={{ ...styles.td, fontWeight: 700, color: low ? "#B3413A" : "#1C2620" }}>{actuel}</td>
                <td style={styles.td}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={styles.stockBtn} onClick={() => setMoveModal({ id: s.id, type: "entrees" })}>+ Entrée</button>
                    <button style={styles.stockBtn} onClick={() => setMoveModal({ id: s.id, type: "sorties" })}>+ Sortie</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {moveModal && (
        <MoveStockModal
          type={moveModal.type}
          onClose={() => setMoveModal(null)}
          onSave={(qty) => applyMove(moveModal.id, moveModal.type, qty)}
        />
      )}
      {showAdd && <AddStockModal onClose={() => setShowAdd(false)} onSave={addItem} />}
    </div>
  );
}

function MoveStockModal({ onClose, onSave, type }) {
  const [qty, setQty] = useState(1);
  return (
    <ModalShell title={type === "entrees" ? "Entrée de stock" : "Sortie de stock"} onClose={onClose} onSubmit={(e) => { e.preventDefault(); onSave(Number(qty) || 0); }}>
      <Field label="Quantité"><input type="number" style={styles.input} value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
      <button type="submit" style={styles.submitBtn}>Enregistrer</button>
    </ModalShell>
  );
}

function AddStockModal({ onClose, onSave }) {
  const [nom, setNom] = useState("");
  const [initial, setInitial] = useState(0);
  const [seuil, setSeuil] = useState(10);
  return (
    <ModalShell title="Ajouter un équipement" onClose={onClose} onSubmit={(e) => { e.preventDefault(); if (!nom) return; onSave({ nom, initial: Number(initial), seuil: Number(seuil) }); }}>
      <div style={styles.formGrid}>
        <Field label="Nom"><input required style={styles.input} value={nom} onChange={(e) => setNom(e.target.value)} /></Field>
        <Field label="Stock initial"><input type="number" style={styles.input} value={initial} onChange={(e) => setInitial(e.target.value)} /></Field>
        <Field label="Seuil d'alerte"><input type="number" style={styles.input} value={seuil} onChange={(e) => setSeuil(e.target.value)} /></Field>
      </div>
      <button type="submit" style={styles.submitBtn}>Ajouter</button>
    </ModalShell>
  );
}

// ======================================================================
// MODULE 11 — SECRÉTARIAT
// ======================================================================
function SecretariatModule() {
  return (
    <div style={styles.modulePad}>
      <div style={styles.cardGrid}>
        {seedDocCategories.map((c) => (
          <div key={c.nom} style={{ ...styles.panel, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FolderOpen size={17} color="#2E7D4F" />
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.nom}</div>
            </div>
            <div style={{ fontSize: 12, color: "#8A968B" }}>{c.count} docs</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ======================================================================
// MODULE 12 — RAPPORTS
// ======================================================================
function RapportsModule() {
  const [periode, setPeriode] = useState({ debut: "2026-01-01", fin: "2026-08-31" });
  const rows = [
    ["Effectif total", dashboardStats.joueurs],
    ["Inscriptions", 62],
    ["Départs", 5],
    ["Recettes", "6 250 000 FCFA"],
    ["Dépenses", "2 100 000 FCFA"],
    ["Impayés", dashboardStats.facturesImpayees],
    ["Présence moyenne", "87%"],
  ];
  return (
    <div style={styles.modulePad}>
      <div style={styles.formGrid}>
        <Field label="Période — du"><input type="date" style={styles.input} value={periode.debut} onChange={(e) => setPeriode({ ...periode, debut: e.target.value })} /></Field>
        <Field label="au"><input type="date" style={styles.input} value={periode.fin} onChange={(e) => setPeriode({ ...periode, fin: e.target.value })} /></Field>
      </div>
      <div style={styles.panel}>
        <div style={styles.infoGrid}>
          {rows.map(([label, value]) => (
            <div key={label} style={styles.infoRow}><div style={styles.infoLabel}>{label}</div><div style={styles.infoValue}>{value}</div></div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button style={styles.smallBtn}><Download size={12} /> Export PDF</button>
          <button style={styles.smallBtn}><Download size={12} /> Export Excel</button>
        </div>
      </div>
    </div>
  );
}

// ======================================================================
// MODULE 13 — UTILISATEURS (rôles et permissions)
// ======================================================================
function UtilisateursModule() {
  return (
    <div style={styles.modulePad}>
      <div style={styles.sectionHead}>Rôles &amp; permissions</div>
      <table style={styles.table}>
        <thead><tr><th style={styles.th}>Rôle</th><th style={styles.th}>Accès</th></tr></thead>
        <tbody>
          {seedRoles.map((r) => (
            <tr key={r.role}><td style={styles.td}>{r.role}</td><td style={styles.td}>{r.acces}</td></tr>
          ))}
        </tbody>
      </table>

      <div style={{ height: 20 }} />

      <div style={styles.sectionHeadRow}>
        <div style={styles.sectionHead}>Utilisateurs</div>
        <button style={styles.smallBtn}>+ Nouvel utilisateur</button>
      </div>
      <div style={styles.list}>
        {seedUsers.map((u) => (
          <div key={u.id} style={styles.sessionRow}>
            <div>
              <div style={styles.sessionDate}>{u.nom}</div>
              <div style={styles.sessionLabel}>{u.email}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#2E7D4F" }}>{u.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ======================================================================
// MODULE 14 — PARAMÈTRES
// ======================================================================
function ParametresModule() {
  return (
    <div style={styles.modulePad}>
      <div style={styles.panel}>
        <div style={styles.infoGrid}>
          <div style={styles.infoRow}><div style={styles.infoLabel}>Nom de l'académie</div><div style={styles.infoValue}>Play For Academy</div></div>
          <div style={styles.infoRow}><div style={styles.infoLabel}>Devise</div><div style={styles.infoValue}>FCFA</div></div>
          <div style={styles.infoRow}><div style={styles.infoLabel}>Saison</div><div style={styles.infoValue}>2025 – 2026</div></div>
          <div style={{ ...styles.infoRow, borderBottom: "none" }}><div style={styles.infoLabel}>Catégories</div><div style={styles.infoValue}>U9, U11, U13, U15, U17, U19</div></div>
        </div>
      </div>
    </div>
  );
}

// ======================================================================
// STYLES
// ======================================================================
const fontImport = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap');
* { box-sizing: border-box; }
input:focus, select:focus, textarea:focus { outline: 2px solid #2E7D4F; outline-offset: 1px; }
button:focus-visible { outline: 2px solid #2E7D4F; outline-offset: 2px; }
`;

const styles = {
  // ---- shell (nouvelle architecture) ----
  shellRoot: { display: "flex", minHeight: "100vh", background: "#F3F1EA", fontFamily: "'Inter', sans-serif", color: "#1C2620" },
  globalSidebar: { width: 232, background: "#12261C", color: "#fff", display: "flex", flexDirection: "column", padding: "20px 14px", flexShrink: 0 },
  navList: { display: "flex", flexDirection: "column", gap: 2, marginTop: 8 },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#B9CBBD" },
  navItemActive: { background: "#234832", color: "#fff", fontWeight: 600 },
  navLabel: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },

  shellMain: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh" },
  shellHeader: { padding: "18px 32px", borderBottom: "1px solid #E6E3D9", background: "#F3F1EA", flexShrink: 0 },
  shellHeaderTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 },
  shellBody: { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" },
  modulePad: { padding: "24px 32px", overflowY: "auto", height: "100%" },

  statsRow7: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 },
  dashGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },

  barChart: { display: "flex", alignItems: "flex-end", gap: 10, height: 130, marginTop: 10 },
  barChartCol: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  barChartTrack: { width: "100%", height: 80, background: "#F0EEE5", borderRadius: 6, display: "flex", alignItems: "flex-end", overflow: "hidden" },
  barChartFill: { width: "100%", borderRadius: "4px 4px 0 0" },
  barChartVal: { fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#3D4A3F" },
  barChartLabel: { fontSize: 11, color: "#8A968B" },

  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 },

  planningGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 },
  planningCol: { background: "#fff", border: "1px solid #E6E3D9", borderRadius: 10, padding: 10, minHeight: 140, display: "flex", flexDirection: "column", gap: 8 },
  planningDayHead: { fontSize: 12.5, fontWeight: 700, color: "#1B3A2A", textAlign: "center", paddingBottom: 6, borderBottom: "1px solid #F0EEE5" },
  planningCard: { background: "#FAF9F5", borderLeft: "3px solid #2E7D4F", borderRadius: 6, padding: "8px 9px" },
  planningTime: { fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#1B3A2A" },
  planningCat: { fontSize: 12.5, fontWeight: 600, marginTop: 2 },
  planningMeta: { fontSize: 11, color: "#8A968B" },

  table: { width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #E6E3D9", borderRadius: 12, overflow: "hidden" },
  th: { textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#8A968B", textTransform: "uppercase", letterSpacing: 0.3, padding: "10px 14px", borderBottom: "1px solid #E6E3D9", background: "#FAF9F5" },
  td: { fontSize: 13, padding: "10px 14px", borderBottom: "1px solid #F0EEE5" },
  stockBtn: { background: "#F0EEE5", border: "none", borderRadius: 6, padding: "5px 9px", fontSize: 11.5, fontWeight: 600, color: "#1B3A2A", cursor: "pointer" },

  wizardSteps: { display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" },
  wizardStep: { fontSize: 11, padding: "5px 9px", borderRadius: 6, background: "#F0EEE5", color: "#8A968B", fontWeight: 600 },
  wizardStepActive: { background: "#1B3A2A", color: "#fff" },
  wizardStepDone: { background: "#E7F3EC", color: "#2E7D4F" },

  addPlayerBtnInline: { display: "flex", alignItems: "center", gap: 8, background: "#D4A24C", color: "#1B3A2A", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },

  // ---- module Joueurs (mise en page interne, inchangée) ----
  joueursApp: { display: "flex", height: "100%" },
  sidebar: { width: 260, background: "#1B3A2A", color: "#fff", display: "flex", flexDirection: "column", padding: "20px 16px", flexShrink: 0 },
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
