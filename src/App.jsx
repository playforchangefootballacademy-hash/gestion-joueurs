import React, { useState, useMemo, useEffect } from "react";
import {
  Users, UserPlus, UserCheck, CalendarCheck, TrendingUp, Wallet, X, Check, Minus, Clock,
  Search, ChevronRight, Trash2, LayoutDashboard, ClipboardList, GraduationCap, CalendarDays,
  Activity, Receipt, Package, FolderOpen, BarChart3, UserCog, Settings, AlertTriangle,
  FileText, Download, Printer, Lock, LogOut, RefreshCw, Upload, Hash, Tag, ShieldCheck,
} from "lucide-react";
import { supabase } from "./supabaseClient";

// ======================================================================
// OUTILS / HELPERS
// ======================================================================
const todayISO = () => new Date().toISOString().slice(0, 10);

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

// Génère un matricule joueur unique du type PFA-2026-0001
function genMatricule(existingPlayers, dateAdhesion) {
  const year = (dateAdhesion || todayISO()).slice(0, 4);
  const count = existingPlayers.filter((p) => p.matricule && p.matricule.startsWith(`PFA-${year}`)).length + 1;
  return `PFA-${year}-${String(count).padStart(4, "0")}`;
}

// Génère une référence article de stock du type EQ-BAL-001
function genStockRef(existingStock, nom) {
  const prefix = "EQ-" + (nom || "ART").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
  const count = existingStock.filter((s) => s.ref && s.ref.startsWith(prefix)).length + 1;
  return `${prefix}-${String(count).padStart(3, "0")}`;
}

// Génère un numéro de facture du type FAC-2026-0001
function genInvoiceNo(existingInvoices) {
  const year = new Date().getFullYear();
  const count = existingInvoices.length + 1;
  return `FAC-${year}-${String(count).padStart(4, "0")}`;
}

// Génère un numéro de reçu du type REC-P1-001
function genReceiptNo(playerId, idx) {
  return `REC-${playerId.toUpperCase()}-${String(idx + 1).padStart(3, "0")}`;
}

// Ouvre une fenêtre d'impression avec un contenu HTML — sert pour factures,
// reçus, fiches d'inscription et export du fichier de stock en PDF.
function printDocument(title, bodyHtml) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) {
    alert("Merci d'autoriser les fenêtres pop-up pour imprimer ce document.");
    return;
  }
  w.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; color:#16233F; padding:32px; }
          .header { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #2563EB; padding-bottom:14px; margin-bottom:18px; }
          .logo { font-weight:800; font-size:19px; color:#0F2A5C; letter-spacing:0.5px; }
          .logo span { color:#2563EB; }
          .muted { color:#6B7A99; font-size:12px; }
          h1 { font-size:18px; margin:0 0 4px 0; color:#0F2A5C; }
          h2 { font-size:13px; color:#2563EB; margin:22px 0 6px 0; text-transform:uppercase; letter-spacing:0.4px; }
          table { width:100%; border-collapse:collapse; margin-top:6px; }
          td, th { border:1px solid #DCE6F5; padding:7px 10px; font-size:13px; text-align:left; }
          th { background:#EAF1FB; color:#0F2A5C; }
          .total { font-weight:800; font-size:15px; margin-top:14px; text-align:right; }
          .footer { margin-top:40px; display:flex; justify-content:space-between; font-size:12px; color:#6B7A99; }
          .stamp { border:1px dashed #9DB3D9; border-radius:8px; padding:16px; width:180px; text-align:center; color:#9DB3D9; font-size:11px; }
        </style>
      </head>
      <body>${bodyHtml}</body>
    </html>
  `);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

function docHeader(subtitle) {
  return `
    <div class="header">
      <div>
        <div class="logo">⚽ PLAY FOR <span>CHANGE</span></div>
        <div class="muted">${subtitle}</div>
      </div>
      <div class="muted" style="text-align:right">
        ACADÉMIE PLAY FOR CHANGE FOOTBALL ACADEMY<br/>
        Bureaux : Près du Stade Militaire (Face entrée principale) – Yaoundé, Cameroun<br/>
        Tél : 697 351 354 / 652 701 236 · Email : playforchangeacademy@gmail.com
      </div>
    </div>
  `;
}

// Convertit un montant en francs CFA en toutes lettres (pour les reçus)
const UNITES = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const DIZAINES = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];

function nombreEnLettres(n) {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "zéro";
  function troisChiffres(x) {
    const c = Math.floor(x / 100);
    const r = x % 100;
    let s = "";
    if (c > 0) s += (c === 1 ? "cent" : UNITES[c] + " cent") + (c > 1 && r === 0 ? "s" : "");
    if (r > 0) {
      if (s) s += " ";
      if (r < 20) s += UNITES[r];
      else {
        const d = Math.floor(r / 10), u = r % 10;
        if (d === 7 || d === 9) s += DIZAINES[d - 1] + "-" + UNITES[10 + u];
        else s += DIZAINES[d] + (u > 0 ? "-" + UNITES[u] : (d === 8 ? "s" : ""));
      }
    }
    return s;
  }
  const tranches = [
    { valeur: 1000000000, mot: "milliard" },
    { valeur: 1000000, mot: "million" },
    { valeur: 1000, mot: "mille" },
  ];
  let reste = n, parts = [];
  for (const t of tranches) {
    if (reste >= t.valeur) {
      const q = Math.floor(reste / t.valeur);
      parts.push(q === 1 ? t.mot : troisChiffres(q) + " " + t.mot + (t.mot !== "mille" && q > 1 ? "s" : ""));
      reste %= t.valeur;
    }
  }
  if (reste > 0 || parts.length === 0) parts.push(troisChiffres(reste));
  return parts.join(" ").trim();
}

function montantEnLettres(n) {
  const mot = nombreEnLettres(n);
  return `${mot.charAt(0).toUpperCase()}${mot.slice(1)} francs CFA`;
}

// ======================================================================
// LOGO (placeholder — à remplacer par le vrai fichier logo du club)
// ======================================================================
function Logo({ size = 30, mono = false }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: mono ? "transparent" : "linear-gradient(135deg,#2563EB,#0F2A5C)",
        border: mono ? `2px solid currentColor` : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif",
        fontSize: size * 0.4, flexShrink: 0,
      }}
    >
      ⚽
    </div>
  );
}

// ======================================================================
// SEED DATA — module Joueurs
// ======================================================================
const POSITIONS = ["Gardien", "Défenseur", "Milieu", "Attaquant"];

const seedPlayers = [
  { id: "p1", matricule: "PFA-2024-0001", nom: "Mbarga", prenom: "Junior", numero: 10, poste: "Attaquant", categorie: "U17", naissance: "2008-03-12", telephone: "690 12 34 56", tuteur: "Mme Mbarga Alice", adhesion: "2024-09-01" },
  { id: "p2", matricule: "PFA-2024-0002", nom: "Fotso", prenom: "Divine", numero: 4, poste: "Défenseur", categorie: "U19", naissance: "2007-11-05", telephone: "677 98 21 43", tuteur: "M. Fotso Paul", adhesion: "2024-09-01" },
  { id: "p3", matricule: "PFA-2025-0001", nom: "Nguema", prenom: "Christelle", numero: 1, poste: "Gardien", categorie: "U15", naissance: "2009-01-22", telephone: "699 45 67 89", tuteur: "Mme Nguema Rose", adhesion: "2025-01-15" },
  { id: "p4", matricule: "PFA-2024-0003", nom: "Talla", prenom: "Steve", numero: 8, poste: "Milieu", categorie: "U17", naissance: "2008-07-30", telephone: "655 33 22 11", tuteur: "M. Talla Eric", adhesion: "2024-09-01" },
];

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

// ======================================================================
// SEED DATA — nouveaux modules
// ======================================================================
const seedStaff = [
  { id: "c1", nom: "Jean Ateba", telephone: "690 11 22 33", fonction: "Entraîneur principal", categorie: "U13", terrain: "Terrain A", seances: 24 },
  { id: "c2", nom: "Paul Ondoa", telephone: "677 22 33 44", fonction: "Préparateur physique", categorie: "U17", terrain: "Terrain B", seances: 31 },
  { id: "c3", nom: "Marie Essomba", telephone: "699 33 44 55", fonction: "Entraîneur gardiens", categorie: "U19", terrain: "Terrain A", seances: 18 },
  { id: "c4", nom: "David Njoya", telephone: "655 44 55 66", fonction: "Kinésithérapeute", categorie: "Toutes", terrain: "—", seances: 12 },
];

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const seedPlanning = [
  { id: "pl1", jour: "Lundi", debut: "15:00", fin: "17:00", categorie: "U13", responsable: "Jean Ateba", terrain: "Terrain A" },
  { id: "pl2", jour: "Lundi", debut: "17:00", fin: "19:00", categorie: "U17", responsable: "Paul Ondoa", terrain: "Terrain B" },
  { id: "pl3", jour: "Mercredi", debut: "16:00", fin: "18:00", categorie: "U9", responsable: "Marie Essomba", terrain: "Terrain A" },
  { id: "pl4", jour: "Vendredi", debut: "15:30", fin: "17:30", categorie: "U15", responsable: "Jean Ateba", terrain: "Terrain B" },
  { id: "pl5", jour: "Samedi", debut: "09:00", fin: "11:00", categorie: "U19", responsable: "Paul Ondoa", terrain: "Terrain A" },
];

// Stock immatriculé : référence, prix unitaire, quantités, entrées, sorties
const seedStock = [
  { id: "s1", ref: "EQ-BAL-001", nom: "Ballons", prixUnitaire: 8000, initial: 50, entrees: 20, sorties: 10, seuil: 20 },
  { id: "s2", ref: "EQ-MAI-001", nom: "Maillots", prixUnitaire: 6000, initial: 100, entrees: 30, sorties: 25, seuil: 40 },
  { id: "s3", ref: "EQ-CHA-001", nom: "Chasubles", prixUnitaire: 3000, initial: 40, entrees: 10, sorties: 15, seuil: 30 },
  { id: "s4", ref: "EQ-CON-001", nom: "Cônes", prixUnitaire: 1500, initial: 80, entrees: 20, sorties: 10, seuil: 25 },
];

const seedInvoices = [
  { id: "FAC-2026-0001", joueur: "Junior Mbarga", montant: 50000, paye: 50000, date: "2026-06-01" },
  { id: "FAC-2026-0002", joueur: "Divine Fotso", montant: 50000, paye: 0, date: "2026-07-01" },
  { id: "FAC-2026-0003", joueur: "Christelle Nguema", montant: 75000, paye: 35000, date: "2026-07-15" },
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

// Rôles & droits d'accès — module par module (simulation front-end : sans
// backend réel, ces droits filtrent uniquement ce qui s'affiche à l'écran)
const seedRoles = [
  { role: "Administrateur", acces: "Tout, y compris utilisateurs et paramètres" },
  { role: "Directeur", acces: "Joueurs, finances, planning, staff, rapports" },
  { role: "Secrétaire", acces: "Inscriptions, joueurs, documents, factures" },
  { role: "Comptable", acces: "Paiements, factures, recettes, rapports" },
  { role: "Staff technique", acces: "Joueurs, présences, planning, évaluations" },
];

const MENU = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "joueurs", label: "Joueurs", icon: Users },
  { key: "inscriptions", label: "Inscriptions", icon: ClipboardList },
  { key: "staff", label: "Staff technique", icon: GraduationCap },
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
const ALL_MODULE_KEYS = MENU.map((m) => m.key);

// Modules visibles par rôle
const ROLE_ACCESS = {
  "Administrateur": ALL_MODULE_KEYS,
  "Directeur": ["dashboard", "joueurs", "inscriptions", "staff", "planning", "entrainements", "suivi", "paiements", "factures", "stocks", "rapports", "secretariat"],
  "Secrétaire": ["dashboard", "joueurs", "inscriptions", "secretariat", "factures"],
  "Comptable": ["dashboard", "paiements", "factures", "rapports"],
  "Staff technique": ["dashboard", "joueurs", "planning", "entrainements", "suivi"],
};

// Permissions fines (actions sensibles) par rôle
const PERMISSIONS = {
  "Administrateur": { manageUsers: true, deletePlayers: true, editStock: true, validatePayments: true, manageSettings: true },
  "Directeur": { manageUsers: false, deletePlayers: true, editStock: true, validatePayments: true, manageSettings: false },
  "Secrétaire": { manageUsers: false, deletePlayers: false, editStock: false, validatePayments: false, manageSettings: false },
  "Comptable": { manageUsers: false, deletePlayers: false, editStock: false, validatePayments: true, manageSettings: false },
  "Staff technique": { manageUsers: false, deletePlayers: false, editStock: false, validatePayments: false, manageSettings: false },
};

const seedUsers = [
  { id: "u1", nom: "Alice Mbarga", role: "Administrateur", email: "alice.mbarga@playforacademy.cm" },
  { id: "u2", nom: "Robert Essiane", role: "Directeur", email: "robert.essiane@playforacademy.cm" },
  { id: "u3", nom: "Chantal Biya", role: "Secrétaire", email: "chantal.biya@playforacademy.cm" },
  { id: "u4", nom: "Jean Ateba", role: "Staff technique", email: "jean.ateba@playforacademy.cm" },
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
// APP — point d'entrée avec session simulée (rôles / droits d'accès)
// ======================================================================
export default function App() {
  const [module, setModule] = useState("dashboard");
  const [users, setUsers] = useState(seedUsers);
  const [currentUserId, setCurrentUserId] = useState(seedUsers[0].id);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  const perms = PERMISSIONS[currentUser.role] || {};
  const allowedModules = ROLE_ACCESS[currentUser.role] || ["dashboard"];
  const visibleMenu = MENU.filter((m) => allowedModules.includes(m.key));

  useEffect(() => {
    if (!allowedModules.includes(module)) setModule("dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  return (
    <div style={styles.shellRoot}>
      <style>{fontImport}</style>

      <aside style={styles.globalSidebar}>
        <div style={styles.brand}>
          <Logo size={32} />
          <div>
            <div style={styles.brandTitle}>PLAY FOR ACADEMY</div>
            <div style={styles.brandSub}>Gestion de club</div>
          </div>
        </div>
        <nav style={styles.navList}>
          {visibleMenu.map(({ key, label, icon: Icon }) => (
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
        <div style={styles.sidebarFooterNote}>
          <Lock size={12} /> Accès filtré selon le rôle
        </div>
      </aside>

      <div style={styles.shellMain}>
        <div style={styles.watermark} aria-hidden="true">
          <Logo size={360} mono />
        </div>

        <header style={styles.shellHeader}>
          <div style={styles.shellHeaderTitle}>{MODULE_TITLES[module]}</div>
          <div style={styles.sessionBox}>
            <div style={{ textAlign: "right" }}>
              <div style={styles.sessionName}>{currentUser.nom}</div>
              <div style={styles.sessionRole}>{currentUser.role}</div>
            </div>
            <select
              style={styles.sessionSelect}
              value={currentUserId}
              onChange={(e) => setCurrentUserId(e.target.value)}
              title="Changer de session (démonstration des droits d'accès)"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.nom} — {u.role}</option>
              ))}
            </select>
            <button style={styles.logoutBtn} title="Se déconnecter" onClick={() => setCurrentUserId(seedUsers[0].id)}>
              <LogOut size={14} />
            </button>
          </div>
        </header>

        <div style={styles.shellBody}>
          {module === "dashboard" && <DashboardModule />}
          {module === "joueurs" && <JoueursModule perms={perms} />}
          {module === "inscriptions" && <InscriptionsModule />}
          {module === "staff" && <StaffModule />}
          {module === "planning" && <PlanningModule />}
          {module === "entrainements" && <EntrainementsModule />}
          {module === "suivi" && <SuiviModule />}
          {module === "paiements" && <PaiementsModule perms={perms} />}
          {module === "factures" && <FacturesModule />}
          {module === "stocks" && <StocksModule perms={perms} />}
          {module === "secretariat" && <SecretariatModule />}
          {module === "rapports" && <RapportsModule />}
          {module === "utilisateurs" && <UtilisateursModule users={users} setUsers={setUsers} perms={perms} />}
          {module === "parametres" && <ParametresModule perms={perms} />}
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
          <BarMiniChart data={inscriptionsParMois} labelKey="mois" valueKey="valeur" color="#2563EB" />
        </div>
        <div style={styles.panel}>
          <div style={styles.sectionHead}>Recettes / paiements</div>
          <BarMiniChart data={recettesParMois} labelKey="mois" valueKey="valeur" color="#0F2A5C" format={(v) => Math.round(v / 1000) + "k"} />
        </div>
        <div style={styles.panel}>
          <div style={styles.sectionHead}>Effectifs par catégorie</div>
          <BarMiniChart data={effectifParCategorie} labelKey="cat" valueKey="valeur" color="#5B8DEF" />
        </div>
        <div style={styles.panel}>
          <div style={styles.sectionHead}>Prochains entraînements</div>
          <div style={styles.list}>
            {seedPlanning.slice(0, 4).map((s) => (
              <div key={s.id} style={styles.sessionRow}>
                <div>
                  <div style={styles.sessionDate}>{s.jour} · {s.debut}–{s.fin}</div>
                  <div style={styles.sessionLabel}>{s.categorie} · {s.responsable} · {s.terrain}</div>
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
// MODULE 2 — JOUEURS
// ======================================================================
function JoueursModule({ perms }) {
  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [sessions, setSessions] = useState(seedSessions);
  const [attendance, setAttendance] = useState({});
  const [performance, setPerformance] = useState({});
  const [payments, setPayments] = useState({});

  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("profil");
  const [search, setSearch] = useState("");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showAddPerf, setShowAddPerf] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);

  useEffect(() => {
    chargerJoueurs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function chargerJoueurs() {
    setLoadingPlayers(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from("joueurs")
      .select("*")
      .order("nom", { ascending: true });

    if (error) {
      console.error("Erreur de chargement des joueurs :", error);
      setLoadError(error.message);
      setPlayers([]);
    } else {
      // On "traduit" les noms de colonnes Supabase vers ceux utilisés par l'interface
      const mapped = data.map((row) => ({
        id: row.id,
        matricule: row.matricule,
        nom: row.nom,
        prenom: row.prenom,
        sexe: row.sexe,
        numero: row.numero_maillot,
        poste: row.poste,
        categorie: row.categorie,
        naissance: row.date_naissance,
        telephone: row.telephone,
        tuteur: "", // sera géré séparément plus tard (table parents_tuteurs)
        adhesion: row.date_adhesion,
      }));
      setPlayers(mapped);
      if (mapped.length > 0) setSelectedId(mapped[0].id);
    }
    setLoadingPlayers(false);
  }

  const selected = players.find((p) => p.id === selectedId);

  const filtered = players.filter((p) =>
    `${p.prenom} ${p.nom} ${p.matricule}`.toLowerCase().includes(search.toLowerCase())
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

  async function addPlayer(data) {
    const matricule = genMatricule(players, data.adhesion);

    const { data: inserted, error } = await supabase
      .from("joueurs")
      .insert([
        {
          matricule,
          nom: data.nom,
          prenom: data.prenom,
          sexe: data.sexe || "M",
          date_naissance: data.naissance,
          poste: data.poste,
          categorie: data.categorie || "U11",
          numero_maillot: Number(data.numero) || 0,
          telephone: data.telephone,
          date_adhesion: data.adhesion,
        },
      ])
      .select();

    if (error) {
      console.error("Erreur d'ajout du joueur :", error);
      alert("Erreur lors de l'ajout du joueur : " + error.message);
      return;
    }

    const row = inserted[0];
    const newPlayer = {
      id: row.id,
      matricule: row.matricule,
      nom: row.nom,
      prenom: row.prenom,
      sexe: row.sexe,
      numero: row.numero_maillot,
      poste: row.poste,
      categorie: row.categorie,
      naissance: row.date_naissance,
      telephone: row.telephone,
      tuteur: data.tuteur || "",
      adhesion: row.date_adhesion,
    };

    setPlayers((prev) => [...prev, newPlayer]);
    setAttendance((prev) => ({ ...prev, [newPlayer.id]: {} }));
    setPerformance((prev) => ({ ...prev, [newPlayer.id]: [] }));
    setPayments((prev) => ({ ...prev, [newPlayer.id]: [] }));
    setSelectedId(newPlayer.id);
    setShowAddPlayer(false);
  }

  async function removePlayer(id) {
    if (!perms?.deletePlayers) return;

    const { error } = await supabase.from("joueurs").delete().eq("id", id);

    if (error) {
      console.error("Erreur de suppression :", error);
      alert("Erreur lors de la suppression : " + error.message);
      return;
    }

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
    if (!perms?.validatePayments) return;
    setPayments((prev) => {
      const list = [...prev[playerId]];
      list[idx] = { ...list[idx], statut: "paye", date: todayISO() };
      return { ...prev, [playerId]: list };
    });
  }

  function printReceipt(player, entry, idx) {
    const recu = genReceiptNo(player.id, idx);
    const html = `
      ${docHeader("Reçu de paiement")}
      <h1>Reçu N° ${recu}</h1>
      <div class="muted">Date : ${entry.date ? new Date(entry.date).toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR")}</div>
      <h2>Informations du joueur</h2>
      <table>
        <tr><td>Nom et prénom du joueur</td><td>${player.prenom} ${player.nom}</td></tr>
        <tr><td>Catégorie / Équipe</td><td>${player.categorie || player.poste || "—"}</td></tr>
        <tr><td>Contact du parent/tuteur</td><td>${player.tuteur || "—"}${player.telephone ? " — " + player.telephone : ""}</td></tr>
      </table>
      <h2>Détails du paiement</h2>
      <table>
        <tr><td>Motif du paiement</td><td>Cotisation mensuelle</td></tr>
        <tr><td>Montant reçu (en chiffres)</td><td>${entry.montant.toLocaleString("fr-FR")} FCFA</td></tr>
        <tr><td>Montant en lettres</td><td>${montantEnLettres(entry.montant)}</td></tr>
        <tr><td>Mode de paiement</td><td>Espèces</td></tr>
        <tr><td>Période concernée</td><td>${entry.mois}</td></tr>
      </table>
      <div class="total">Total payé : ${entry.montant.toLocaleString("fr-FR")} F CFA</div>
      <h2>Observations</h2>
      <div class="muted">— Aucune —</div>
      <div class="footer">
        <div>Signature du parent/joueur</div>
        <div class="stamp">Signature et cachet du club</div>
      </div>
    `;
    printDocument(`Reçu ${recu}`, html);
  }

  return (
    <div style={styles.joueursApp}>
      <aside style={styles.sidebar}>
        <div style={styles.searchWrap}>
          <Search size={15} color="#BFD3F5" style={{ flexShrink: 0 }} />
          <input
            style={styles.searchInput}
            placeholder="Rechercher un joueur ou un matricule…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={styles.rosterList}>
          {loadingPlayers && (
            <div style={{ color: "#BFD3F5", fontSize: 13, padding: "12px 4px" }}>Chargement des joueurs…</div>
          )}
          {!loadingPlayers && loadError && (
            <div style={{ color: "#F5B0B0", fontSize: 12, padding: "12px 4px" }}>
              Erreur de chargement : {loadError}
            </div>
          )}
          {!loadingPlayers && filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => { setSelectedId(p.id); setTab("profil"); }}
              style={{
                ...styles.rosterItem,
                ...(p.id === selectedId ? styles.rosterItemActive : {}),
              }}
            >
              <div style={{ ...styles.rosterNum, ...(p.id === selectedId ? { background: "#fff", color: "#0F2A5C" } : {}) }}>
                {p.numero}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.rosterName}>{p.prenom} {p.nom}</div>
                <div style={styles.rosterPos}>{p.poste} · {p.matricule}</div>
              </div>
              <ChevronRight size={14} color="#BFD3F5" />
            </div>
          ))}
          {!loadingPlayers && !loadError && filtered.length === 0 && (
            <div style={{ color: "#BFD3F5", fontSize: 13, padding: "12px 4px" }}>Aucun joueur trouvé.</div>
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
                  <Hash size={11} style={{ verticalAlign: "middle" }} /> {selected.matricule} · N°{selected.numero} · {selected.poste} · {age(selected.naissance)} ans
                </div>
              </div>
              {perms?.deletePlayers ? (
                <button style={styles.deleteBtn} onClick={() => removePlayer(selected.id)} title="Retirer le joueur">
                  <Trash2 size={15} />
                </button>
              ) : (
                <div style={styles.readOnlyBadge} title="Votre rôle ne permet pas de supprimer un joueur">
                  <Lock size={12} /> Lecture seule
                </div>
              )}
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
                  onPrintReceipt={(entry, idx) => printReceipt(selected, entry, idx)}
                  canValidate={!!perms?.validatePayments}
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

// ---------- Sous-composants du module Joueurs ----------

function StatCard({ icon: Icon, label, value, unit, accent }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, color: accent || "#2563EB" }}>
        <Icon size={17} />
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: "#16233F", lineHeight: 1.1, marginTop: 8 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#6B7A99", marginTop: 2 }}>{label} · {unit}</div>
    </div>
  );
}

function ProfilTab({ player }) {
  const rows = [
    ["Matricule", player.matricule],
    ["Nom complet", `${player.prenom} ${player.nom}`],
    ["Numéro de maillot", player.numero],
    ["Poste", player.poste],
    ["Catégorie", player.categorie || "—"],
    ["Sexe", player.sexe === "F" ? "Féminin" : "Masculin"],
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
                        borderColor: active ? meta.color : "#DCE6F5",
                        color: active ? meta.color : "#9AA7C0",
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
      <div style={{ fontSize: 11.5, color: "#6B7A99" }}>{label}</div>
    </div>
  );
}

function PerformanceTab({ entries, onAdd }) {
  const avg = entries.length ? (entries.reduce((a, e) => a + e.niveau, 0) / entries.length).toFixed(1) : "—";
  return (
    <div>
      <div style={styles.sectionHeadRow}>
        <div style={styles.sectionHead}>Niveau moyen : <span style={{ color: "#2563EB", fontFamily: "'Space Grotesk', sans-serif" }}>{avg}/5</span></div>
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
                <span key={n} style={{ color: n <= e.niveau ? "#2563EB" : "#DCE6F5", fontSize: 14 }}>★</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaiementsTab({ entries, onAdd, onMarkPaid, onPrintReceipt, canValidate }) {
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
                canValidate ? (
                  <button style={styles.payBtn} onClick={() => onMarkPaid(i)}>Marquer payé</button>
                ) : (
                  <span style={styles.readOnlyBadge}><Lock size={11} /> Non autorisé</span>
                )
              ) : (
                <>
                  <span style={styles.paidBadge}><Check size={11} /> Payé</span>
                  <button style={styles.stockBtn} onClick={() => onPrintReceipt(e, i)}><Printer size={11} /> Reçu</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Modals du module Joueurs ----------

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
  const empty = { prenom: "", nom: "", numero: "", poste: POSITIONS[0], sexe: "M", categorie: "U11", naissance: "", telephone: "", tuteur: "", adhesion: todayISO() };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const errs = {};
    if (!form.prenom.trim()) errs.prenom = "Le prénom est obligatoire.";
    if (!form.nom.trim()) errs.nom = "Le nom est obligatoire.";
    if (!form.naissance) errs.naissance = "La date de naissance est obligatoire.";
    if (!form.categorie) errs.categorie = "La catégorie est obligatoire.";
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    onSave({ ...form, numero: Number(form.numero) || 0 });
  }

  return (
    <ModalShell title="Ajouter un joueur" onClose={onClose} onSubmit={handleSubmit}>
      <div style={styles.formGrid}>
        <Field label="Prénom" error={errors.prenom}><input style={styles.input} value={form.prenom} onChange={set("prenom")} /></Field>
        <Field label="Nom" error={errors.nom}><input style={styles.input} value={form.nom} onChange={set("nom")} /></Field>
        <Field label="Numéro"><input type="number" style={styles.input} value={form.numero} onChange={set("numero")} /></Field>
        <Field label="Poste">
          <select style={styles.input} value={form.poste} onChange={set("poste")}>
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Sexe">
          <select style={styles.input} value={form.sexe} onChange={set("sexe")}>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </Field>
        <Field label="Catégorie" error={errors.categorie}>
          <select style={styles.input} value={form.categorie} onChange={set("categorie")}>
            {["U9", "U11", "U13", "U15", "U17", "U19"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Date de naissance" error={errors.naissance}><input type="date" style={styles.input} value={form.naissance} onChange={set("naissance")} /></Field>
        <Field label="Date d'adhésion"><input type="date" style={styles.input} value={form.adhesion} onChange={set("adhesion")} /></Field>
        <Field label="Téléphone"><input style={styles.input} value={form.telephone} onChange={set("telephone")} /></Field>
        <Field label="Tuteur / Contact"><input style={styles.input} value={form.tuteur} onChange={set("tuteur")} /></Field>
      </div>
      {Object.keys(errors).length > 0 && (
        <div style={styles.errorBanner}>
          <AlertTriangle size={13} /> Merci de corriger les champs signalés en rouge avant de continuer.
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" style={{ ...styles.smallBtn, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={() => { setForm(empty); setErrors({}); }}>
          <RefreshCw size={12} /> Réinitialiser
        </button>
        <button type="submit" style={{ ...styles.submitBtn, marginTop: 0, flex: 2 }}>Enregistrer le joueur</button>
      </div>
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

function Field({ label, children, error }) {
  const child = error ? React.cloneElement(children, { style: { ...(children.props.style || {}), borderColor: "#C0392B" } }) : children;
  return (
    <label style={styles.fieldLabel}>
      {label}
      {child}
      {error && <span style={styles.fieldError}>{error}</span>}
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
            <ChevronRight size={14} color="#9AA7C0" />
          </div>
        ))}
      </div>
      {showWizard && <InscriptionWizard onClose={() => setShowWizard(false)} onFinish={finish} existingCount={list.length} />}
    </div>
  );
}

const DOC_TYPES = [
  ["certificat", "Certificat médical"],
  ["acte", "Acte de naissance"],
  ["photo", "Photo d'identité"],
  ["autorisation", "Autorisation parentale"],
];

function InscriptionWizard({ onClose, onFinish, existingCount }) {
  const [step, setStep] = useState(1);
  const [stepErrors, setStepErrors] = useState({});
  const [joueur, setJoueur] = useState({ prenom: "", nom: "", naissance: "", lieuNaissance: "", nationalite: "Camerounaise", sexe: "M", categorie: "U11", poste: POSITIONS[0], numero: "", adresse: "", telephone: "" });
  const [parent, setParent] = useState({ nom: "", lien: "", telephone: "", whatsapp: "", email: "", adresse: "" });
  const [urgence, setUrgence] = useState({ nom: "", telephone: "" });
  const [medical, setMedical] = useState({ groupeSanguin: "", allergies: "", antecedents: "", certificat: "Oui" });
  const [docs, setDocs] = useState({ certificat: null, acte: null, photo: null, autorisation: null });
  const [fileErrors, setFileErrors] = useState({});
  const [paiement, setPaiement] = useState({ montant: 5000, mode: "Espèces", date: todayISO(), reference: "" });

  const steps = ["Joueur", "Parent/tuteur", "Documents", "Paiement", "Validation"];
  const matriculePreview = `PFA-${todayISO().slice(0, 4)}-${String(existingCount + 1).padStart(4, "0")}`;

  function goNext() {
    if (step === 1) {
      const errs = {};
      if (!joueur.prenom.trim()) errs.prenom = "Obligatoire";
      if (!joueur.nom.trim()) errs.nom = "Obligatoire";
      if (!joueur.naissance) errs.naissance = "Obligatoire";
      if (Object.keys(errs).length) { setStepErrors(errs); return; }
    }
    setStepErrors({});
    setStep((s) => s + 1);
  }

  function goBack() {
    setStepErrors({});
    setStep((s) => Math.max(1, s - 1));
  }

  function handleFile(key, file) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setFileErrors((prev) => ({ ...prev, [key]: "Seuls les fichiers PDF sont acceptés." }));
      return;
    }
    setFileErrors((prev) => ({ ...prev, [key]: null }));
    setDocs((prev) => ({ ...prev, [key]: { name: file.name } }));
  }

  function generateFiche() {
    const docsListHtml = DOC_TYPES.map(([key, label]) =>
      `<tr><td>${label}</td><td>${docs[key] ? "✔ Fourni — " + docs[key].name : "Non fourni"}</td></tr>`
    ).join("");
    const html = `
      ${docHeader("Fiche d'inscription du joueur")}
      <h1>Fiche d'inscription — ${joueur.prenom} ${joueur.nom}</h1>
      <div class="muted">Saison sportive : ${todayISO().slice(0, 4)} - ${Number(todayISO().slice(0, 4)) + 1} · N° de licence / matricule : ${matriculePreview}</div>
      <h2>1. Identité du joueur</h2>
      <table>
        <tr><td>Nom</td><td>${joueur.nom}</td></tr>
        <tr><td>Prénom</td><td>${joueur.prenom}</td></tr>
        <tr><td>Date de naissance</td><td>${joueur.naissance ? new Date(joueur.naissance).toLocaleDateString("fr-FR") : "—"}</td></tr>
        <tr><td>Lieu de naissance</td><td>${joueur.lieuNaissance || "—"}</td></tr>
        <tr><td>Sexe</td><td>${joueur.sexe === "M" ? "Masculin" : "Féminin"}</td></tr>
        <tr><td>Nationalité</td><td>${joueur.nationalite || "—"}</td></tr>
        <tr><td>Poste / Spécialité</td><td>${joueur.poste}</td></tr>
        <tr><td>Catégorie</td><td>${joueur.categorie}</td></tr>
        <tr><td>Numéro de maillot</td><td>${joueur.numero || "—"}</td></tr>
        <tr><td>Adresse de domicile</td><td>${joueur.adresse || "—"}</td></tr>
        <tr><td>Téléphone</td><td>${joueur.telephone || "—"}</td></tr>
      </table>
      <h2>2. Contact du parent ou tuteur (si joueur mineur)</h2>
      <table>
        <tr><td>Nom et prénom</td><td>${parent.nom || "—"}</td></tr>
        <tr><td>Lien de parenté</td><td>${parent.lien || "—"}</td></tr>
        <tr><td>Téléphone</td><td>${parent.telephone || "—"}</td></tr>
        <tr><td>Email</td><td>${parent.email || "—"}</td></tr>
        <tr><td>Adresse</td><td>${parent.adresse || "—"}</td></tr>
      </table>
      <h2>3. Contact d'urgence</h2>
      <table>
        <tr><td>Nom et prénom</td><td>${urgence.nom || "—"}</td></tr>
        <tr><td>Téléphone</td><td>${urgence.telephone || "—"}</td></tr>
      </table>
      <h2>4. Informations médicales</h2>
      <table>
        <tr><td>Groupe sanguin</td><td>${medical.groupeSanguin || "—"}</td></tr>
        <tr><td>Allergies connues</td><td>${medical.allergies || "—"}</td></tr>
        <tr><td>Antécédents médicaux / traitements en cours</td><td>${medical.antecedents || "—"}</td></tr>
        <tr><td>Certificat médical d'aptitude fourni</td><td>${medical.certificat}</td></tr>
      </table>
      <h2>Documents fournis</h2>
      <table>${docsListHtml}</table>
      <h2>Paiement d'inscription</h2>
      <table>
        <tr><td>Montant</td><td>${Number(paiement.montant).toLocaleString("fr-FR")} F CFA</td></tr>
        <tr><td>Mode</td><td>${paiement.mode}</td></tr>
      </table>
      <h2>5. Engagement</h2>
      <div style="font-size:13px; line-height:1.5;">Je soussigné(e) certifie l'exactitude des informations ci-dessus et m'engage à respecter le règlement intérieur du club.</div>
      <div class="footer">
        <div>Fait à Yaoundé, le ${new Date().toLocaleDateString("fr-FR")}<br/>Signature du joueur / parent</div>
        <div class="stamp">Cachet du club</div>
      </div>
    `;
    printDocument(`Fiche d'inscription — ${joueur.prenom} ${joueur.nom}`, html);
  }

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
            <Field label="Prénom" error={stepErrors.prenom}><input style={styles.input} value={joueur.prenom} onChange={(e) => setJoueur({ ...joueur, prenom: e.target.value })} /></Field>
            <Field label="Nom" error={stepErrors.nom}><input style={styles.input} value={joueur.nom} onChange={(e) => setJoueur({ ...joueur, nom: e.target.value })} /></Field>
            <Field label="Date de naissance" error={stepErrors.naissance}><input type="date" style={styles.input} value={joueur.naissance} onChange={(e) => setJoueur({ ...joueur, naissance: e.target.value })} /></Field>
            <Field label="Lieu de naissance"><input style={styles.input} value={joueur.lieuNaissance} onChange={(e) => setJoueur({ ...joueur, lieuNaissance: e.target.value })} /></Field>
            <Field label="Nationalité"><input style={styles.input} value={joueur.nationalite} onChange={(e) => setJoueur({ ...joueur, nationalite: e.target.value })} /></Field>
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
            <Field label="Adresse de domicile (joueur)"><input style={styles.input} value={joueur.adresse} onChange={(e) => setJoueur({ ...joueur, adresse: e.target.value })} /></Field>
            <Field label="Téléphone (joueur)"><input style={styles.input} value={joueur.telephone} onChange={(e) => setJoueur({ ...joueur, telephone: e.target.value })} /></Field>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F2A5C", margin: "2px 0 8px" }}>Contact du parent ou tuteur</div>
            <div style={styles.formGrid}>
              <Field label="Nom et prénom"><input style={styles.input} value={parent.nom} onChange={(e) => setParent({ ...parent, nom: e.target.value })} /></Field>
              <Field label="Lien de parenté"><input style={styles.input} value={parent.lien} onChange={(e) => setParent({ ...parent, lien: e.target.value })} placeholder="Père, mère, tuteur…" /></Field>
              <Field label="Téléphone"><input style={styles.input} value={parent.telephone} onChange={(e) => setParent({ ...parent, telephone: e.target.value })} /></Field>
              <Field label="WhatsApp"><input style={styles.input} value={parent.whatsapp} onChange={(e) => setParent({ ...parent, whatsapp: e.target.value })} /></Field>
              <Field label="Email"><input type="email" style={styles.input} value={parent.email} onChange={(e) => setParent({ ...parent, email: e.target.value })} /></Field>
              <Field label="Adresse"><input style={styles.input} value={parent.adresse} onChange={(e) => setParent({ ...parent, adresse: e.target.value })} /></Field>
            </div>

            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F2A5C", margin: "14px 0 8px" }}>Contact d'urgence</div>
            <div style={styles.formGrid}>
              <Field label="Nom et prénom"><input style={styles.input} value={urgence.nom} onChange={(e) => setUrgence({ ...urgence, nom: e.target.value })} /></Field>
              <Field label="Téléphone"><input style={styles.input} value={urgence.telephone} onChange={(e) => setUrgence({ ...urgence, telephone: e.target.value })} /></Field>
            </div>

            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F2A5C", margin: "14px 0 8px" }}>Informations médicales</div>
            <div style={styles.formGrid}>
              <Field label="Groupe sanguin"><input style={styles.input} value={medical.groupeSanguin} onChange={(e) => setMedical({ ...medical, groupeSanguin: e.target.value })} /></Field>
              <Field label="Certificat médical fourni">
                <select style={styles.input} value={medical.certificat} onChange={(e) => setMedical({ ...medical, certificat: e.target.value })}>
                  <option value="Oui">Oui</option>
                  <option value="Non">Non</option>
                </select>
              </Field>
              <Field label="Allergies connues"><input style={styles.input} value={medical.allergies} onChange={(e) => setMedical({ ...medical, allergies: e.target.value })} /></Field>
              <Field label="Antécédents médicaux / traitements"><input style={styles.input} value={medical.antecedents} onChange={(e) => setMedical({ ...medical, antecedents: e.target.value })} /></Field>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={styles.list}>
            <div style={{ fontSize: 12, color: "#6B7A99", marginBottom: 4 }}>
              Merci de joindre les documents au format PDF uniquement.
            </div>
            {DOC_TYPES.map(([key, label]) => (
              <div key={key} style={styles.sessionRow}>
                <div>
                  <div style={styles.sessionDate}>{label}</div>
                  <div style={styles.sessionLabel}>
                    {docs[key] ? `Fichier : ${docs[key].name}` : "Aucun fichier"}
                  </div>
                  {fileErrors[key] && <div style={styles.fieldError}>{fileErrors[key]}</div>}
                </div>
                <label style={{ ...styles.smallBtn, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <Upload size={12} /> {docs[key] ? "Remplacer" : "Importer"}
                  <input
                    type="file"
                    accept="application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) => handleFile(key, e.target.files?.[0])}
                  />
                </label>
              </div>
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
            <div style={styles.infoRow}><div style={styles.infoLabel}>Matricule attribué</div><div style={styles.infoValue}>{matriculePreview}</div></div>
            <div style={styles.infoRow}><div style={styles.infoLabel}>Joueur</div><div style={styles.infoValue}>{joueur.prenom} {joueur.nom} · {joueur.categorie}</div></div>
            <div style={styles.infoRow}><div style={styles.infoLabel}>Parent</div><div style={styles.infoValue}>{parent.nom || "—"}</div></div>
            <div style={styles.infoRow}><div style={styles.infoLabel}>Paiement</div><div style={styles.infoValue}>{Number(paiement.montant).toLocaleString("fr-FR")} F · {paiement.mode}</div></div>
            <div style={{ ...styles.infoRow, borderBottom: "none" }}>
              <div style={{ fontSize: 12.5, color: "#2563EB", fontWeight: 600 }}>Prêt à valider : joueur créé, facture générée, reçu disponible.</div>
            </div>
            <button type="button" style={{ ...styles.smallBtn, marginTop: 6, alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6 }} onClick={generateFiche}>
              <FileText size={12} /> Générer la fiche d'inscription
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {step > 1 && <button type="button" style={{ ...styles.smallBtn, flex: 1 }} onClick={goBack}>Précédent</button>}
          {step < 5 && <button type="button" style={{ ...styles.submitBtn, marginTop: 0 }} onClick={goNext}>Suivant</button>}
          {step === 5 && <button type="button" style={{ ...styles.submitBtn, marginTop: 0 }} onClick={() => onFinish(joueur)}>Valider l'inscription</button>}
        </div>
      </div>
    </div>
  );
}

// ======================================================================
// MODULE 4 — STAFF TECHNIQUE (anciennement "Entraîneurs")
// ======================================================================
function StaffModule() {
  return (
    <div style={styles.modulePad}>
      <div style={styles.cardGrid}>
        {seedStaff.map((c) => (
          <div key={c.id} style={styles.panel}>
            <div style={styles.profileHeader}>
              <div style={styles.avatarBig}>{c.nom.split(" ").map((n) => n[0]).join("")}</div>
              <div>
                <div style={styles.profileName}>{c.nom}</div>
                <div style={styles.profileMeta}>{c.fonction}</div>
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
                <div style={styles.planningMeta}>{s.responsable}</div>
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
                  <div style={styles.profileMeta}>{p.poste} · {p.matricule}</div>
                </div>
              </div>
              <div style={styles.miniStatsRow}>
                <MiniStat label="Présence" value={taux + "%"} color="#2E7D4F" />
                <MiniStat label="Niveau moyen" value={avg + "/5"} color="#2563EB" />
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
function PaiementsModule({ perms }) {
  const rows = [];
  seedPlayers.forEach((p) => {
    (seedPayments[p.id] || []).forEach((pay) => {
      rows.push({ joueur: `${p.prenom} ${p.nom}`, ...pay });
    });
  });
  rows.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <div style={styles.modulePad}>
      {!perms?.validatePayments && (
        <div style={styles.errorBanner}><Lock size={12} /> Vous êtes en lecture seule : votre rôle ne permet pas de valider des paiements.</div>
      )}
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
// MODULE 9 — FACTURES (facturier)
// ======================================================================
function FacturesModule() {
  const [invoices, setInvoices] = useState(seedInvoices);
  const [showAdd, setShowAdd] = useState(false);

  function addInvoice(entry) {
    const id = genInvoiceNo(invoices);
    setInvoices((prev) => [{ id, ...entry }, ...prev]);
    setShowAdd(false);
  }

  function printInvoice(inv) {
    const solde = inv.montant - inv.paye;
    const html = `
      ${docHeader("Facture")}
      <h1>Facture ${inv.id}</h1>
      <div class="muted">Date d'émission : ${inv.date ? new Date(inv.date).toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR")}</div>
      <h2>Client</h2>
      <table><tr><td>Joueur</td><td>${inv.joueur}</td></tr></table>
      <h2>Détail</h2>
      <table>
        <tr><th>Description</th><th>Montant</th></tr>
        <tr><td>Cotisation / frais d'inscription</td><td>${inv.montant.toLocaleString("fr-FR")} F CFA</td></tr>
        <tr><td>Déjà réglé</td><td>${inv.paye.toLocaleString("fr-FR")} F CFA</td></tr>
      </table>
      <div class="total">Solde restant dû : ${solde.toLocaleString("fr-FR")} F CFA</div>
      <div class="footer">
        <div>Merci de votre confiance.</div>
        <div class="stamp">Cachet / Signature</div>
      </div>
    `;
    printDocument(`Facture ${inv.id}`, html);
  }

  return (
    <div style={styles.modulePad}>
      <div style={styles.sectionHeadRow}>
        <div style={styles.sectionHead}>Factures</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={styles.smallBtn} onClick={() => setShowAdd(true)}>+ Nouvelle facture</button>
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
            <th style={styles.th}></th>
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
                <td style={styles.td}>
                  <button style={styles.stockBtn} onClick={() => printInvoice(inv)}><Printer size={11} /> Imprimer</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {showAdd && <AddInvoiceModal onClose={() => setShowAdd(false)} onSave={addInvoice} />}
    </div>
  );
}

function AddInvoiceModal({ onClose, onSave }) {
  const [joueur, setJoueur] = useState(seedPlayers[0] ? `${seedPlayers[0].prenom} ${seedPlayers[0].nom}` : "");
  const [montant, setMontant] = useState(5000);
  const [paye, setPaye] = useState(0);
  const [errors, setErrors] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!joueur.trim()) errs.joueur = "Obligatoire";
    if (!montant || Number(montant) <= 0) errs.montant = "Montant invalide";
    if (Number(paye) > Number(montant)) errs.paye = "Ne peut pas dépasser le montant";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ joueur, montant: Number(montant), paye: Number(paye), date: todayISO() });
  }

  return (
    <ModalShell title="Nouvelle facture" onClose={onClose} onSubmit={handleSubmit}>
      <div style={styles.formGrid}>
        <Field label="Joueur" error={errors.joueur}>
          <select style={styles.input} value={joueur} onChange={(e) => setJoueur(e.target.value)}>
            {seedPlayers.map((p) => <option key={p.id} value={`${p.prenom} ${p.nom}`}>{p.prenom} {p.nom} ({p.matricule})</option>)}
          </select>
        </Field>
        <Field label="Montant (F CFA)" error={errors.montant}><input type="number" style={styles.input} value={montant} onChange={(e) => setMontant(e.target.value)} /></Field>
        <Field label="Déjà payé (F CFA)" error={errors.paye}><input type="number" style={styles.input} value={paye} onChange={(e) => setPaye(e.target.value)} /></Field>
      </div>
      {Object.keys(errors).length > 0 && <div style={styles.errorBanner}><AlertTriangle size={13} /> Merci de corriger les champs signalés.</div>}
      <button type="submit" style={styles.submitBtn}>Créer la facture</button>
    </ModalShell>
  );
}

// ======================================================================
// MODULE 10 — STOCKS / ÉQUIPEMENTS (immatriculés, exportables)
// ======================================================================
function StocksModule({ perms }) {
  const [stock, setStock] = useState(seedStock);
  const [showAdd, setShowAdd] = useState(false);
  const [moveModal, setMoveModal] = useState(null);
  const [showSale, setShowSale] = useState(false);
  const [saleCount, setSaleCount] = useState(0);
  const canEdit = !!perms?.editStock;

  function printSaleInvoice(sale) {
    const factureNo = `FAC-EQ-${new Date().getFullYear()}-${String(saleCount + 1).padStart(4, "0")}`;
    const totalHT = sale.lignes.reduce((a, l) => a + l.quantite * l.prixUnitaire, 0);
    const tva = Math.round(totalHT * 0.1925);
    const totalTTC = totalHT + tva;
    const rows = sale.lignes.map((l) =>
      `<tr><td>${l.nom}</td><td>${l.quantite}</td><td>${l.prixUnitaire.toLocaleString("fr-FR")}</td><td>${(l.quantite * l.prixUnitaire).toLocaleString("fr-FR")}</td></tr>`
    ).join("");
    const html = `
      ${docHeader("Facture de vente d'équipements")}
      <h1>Facture N° ${factureNo}</h1>
      <div class="muted">Date : ${new Date().toLocaleDateString("fr-FR")}</div>
      <h2>Client (Acheteur)</h2>
      <table>
        <tr><td>Nom / Raison sociale</td><td>${sale.client.nom || "—"}</td></tr>
        <tr><td>Adresse</td><td>${sale.client.adresse || "—"}</td></tr>
        <tr><td>Téléphone / Contact</td><td>${sale.client.telephone || "—"}</td></tr>
      </table>
      <h2>Détail des équipements</h2>
      <table>
        <tr><th>Désignation</th><th>Quantité</th><th>Prix unitaire (FCFA)</th><th>Montant (FCFA)</th></tr>
        ${rows}
      </table>
      <table style="margin-top:10px">
        <tr><td>Total HT</td><td>${totalHT.toLocaleString("fr-FR")} FCFA</td></tr>
        <tr><td>TVA (19,25 %)</td><td>${tva.toLocaleString("fr-FR")} FCFA</td></tr>
        <tr><td><b>TOTAL TTC</b></td><td><b>${totalTTC.toLocaleString("fr-FR")} FCFA</b></td></tr>
      </table>
      <div class="muted" style="margin-top:10px">Mode de paiement : ${sale.mode}</div>
      <div class="footer">
        <div>Signature du client</div>
        <div class="stamp">Signature et cachet du club</div>
      </div>
    `;
    printDocument(`Facture ${factureNo}`, html);
    setSaleCount((c) => c + 1);
  }

  function completeSale(sale) {
    setStock((prev) => prev.map((s) => {
      const ligne = sale.lignes.find((l) => l.id === s.id);
      return ligne ? { ...s, sorties: s.sorties + ligne.quantite } : s;
    }));
    printSaleInvoice(sale);
    setShowSale(false);
  }

  function applyMove(id, type, qty) {
    setStock((prev) => prev.map((s) => (s.id === id ? { ...s, [type]: s[type] + qty } : s)));
    setMoveModal(null);
  }

  function addItem(item) {
    const ref = genStockRef(stock, item.nom);
    setStock((prev) => [...prev, { id: "s" + Date.now(), ref, entrees: 0, sorties: 0, ...item }]);
    setShowAdd(false);
  }

  function exportCSV() {
    const header = ["Référence", "Article", "Prix unitaire", "Stock initial", "Entrées", "Sorties", "Stock actuel", "Valeur totale"];
    const lines = stock.map((s) => {
      const actuel = s.initial + s.entrees - s.sorties;
      return [s.ref, s.nom, s.prixUnitaire, s.initial, s.entrees, s.sorties, actuel, actuel * s.prixUnitaire].join(";");
    });
    const csv = [header.join(";"), ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock_playforacademy_${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printStock() {
    const rows = stock.map((s) => {
      const actuel = s.initial + s.entrees - s.sorties;
      return `<tr><td>${s.ref}</td><td>${s.nom}</td><td>${s.prixUnitaire.toLocaleString("fr-FR")} F</td><td>${s.initial}</td><td>${s.entrees}</td><td>${s.sorties}</td><td>${actuel}</td><td>${(actuel * s.prixUnitaire).toLocaleString("fr-FR")} F</td></tr>`;
    }).join("");
    const totalValeur = stock.reduce((a, s) => a + (s.initial + s.entrees - s.sorties) * s.prixUnitaire, 0);
    const html = `
      ${docHeader("Fichier de stock / équipements")}
      <h1>Inventaire du stock</h1>
      <div class="muted">Édité le ${new Date().toLocaleDateString("fr-FR")}</div>
      <table>
        <tr><th>Référence</th><th>Article</th><th>Prix unitaire</th><th>Initial</th><th>Entrées</th><th>Sorties</th><th>Actuel</th><th>Valeur</th></tr>
        ${rows}
      </table>
      <div class="total">Valeur totale du stock : ${totalValeur.toLocaleString("fr-FR")} F CFA</div>
    `;
    printDocument("Fichier de stock", html);
  }

  return (
    <div style={styles.modulePad}>
      <div style={styles.sectionHeadRow}>
        <div style={styles.sectionHead}>Stocks / Équipements</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={styles.smallBtn} onClick={exportCSV}><Download size={12} /> Export Excel (CSV)</button>
          <button style={styles.smallBtn} onClick={printStock}><Printer size={12} /> Imprimer / PDF</button>
          {canEdit && <button style={styles.smallBtn} onClick={() => setShowSale(true)}><Receipt size={12} /> Vendre équipement</button>}
          {canEdit && <button style={styles.smallBtn} onClick={() => setShowAdd(true)}>+ Ajouter équipement</button>}
        </div>
      </div>
      {!canEdit && (
        <div style={styles.errorBanner}><Lock size={12} /> Votre rôle est en lecture seule sur le stock.</div>
      )}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Référence</th>
            <th style={styles.th}>Équipement</th>
            <th style={styles.th}>Prix unitaire</th>
            <th style={styles.th}>Initial</th>
            <th style={styles.th}>Entrées</th>
            <th style={styles.th}>Sorties</th>
            <th style={styles.th}>Actuel</th>
            <th style={styles.th}>Valeur</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {stock.map((s) => {
            const actuel = s.initial + s.entrees - s.sorties;
            const low = actuel < s.seuil;
            return (
              <tr key={s.id}>
                <td style={styles.td}><Tag size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />{s.ref}</td>
                <td style={styles.td}>
                  {s.nom} {low && <AlertTriangle size={12} color="#B3413A" style={{ marginLeft: 4, verticalAlign: "middle" }} />}
                </td>
                <td style={styles.td}>{s.prixUnitaire.toLocaleString("fr-FR")} F</td>
                <td style={styles.td}>{s.initial}</td>
                <td style={styles.td}>{s.entrees}</td>
                <td style={styles.td}>{s.sorties}</td>
                <td style={{ ...styles.td, fontWeight: 700, color: low ? "#B3413A" : "#16233F" }}>{actuel}</td>
                <td style={styles.td}>{(actuel * s.prixUnitaire).toLocaleString("fr-FR")} F</td>
                <td style={styles.td}>
                  {canEdit ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={styles.stockBtn} onClick={() => setMoveModal({ id: s.id, type: "entrees" })}>+ Entrée</button>
                      <button style={styles.stockBtn} onClick={() => setMoveModal({ id: s.id, type: "sorties" })}>+ Sortie</button>
                    </div>
                  ) : "—"}
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
      {showSale && <SaleEquipementModal stock={stock} onClose={() => setShowSale(false)} onSave={completeSale} />}
    </div>
  );
}

function SaleEquipementModal({ stock, onClose, onSave }) {
  const [client, setClient] = useState({ nom: "", adresse: "", telephone: "" });
  const [mode, setMode] = useState("Espèces");
  const [lignes, setLignes] = useState([{ id: stock[0]?.id || "", quantite: 1 }]);

  function updateLigne(idx, patch) {
    setLignes((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }
  function addLigne() {
    setLignes((prev) => [...prev, { id: stock[0]?.id || "", quantite: 1 }]);
  }
  function removeLigne(idx) {
    setLignes((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const resolved = lignes
      .filter((l) => l.id && Number(l.quantite) > 0)
      .map((l) => {
        const item = stock.find((s) => s.id === l.id);
        return { id: l.id, nom: item?.nom || "", prixUnitaire: item?.prixUnitaire || 0, quantite: Number(l.quantite) };
      });
    if (!resolved.length) return;
    onSave({ client, mode, lignes: resolved });
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modal, width: 480 }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHead}>
          <div style={styles.modalTitle}>Vente d'équipements</div>
          <button type="button" style={styles.modalClose} onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F2A5C", margin: "2px 0 8px" }}>Client (acheteur)</div>
          <div style={styles.formGrid}>
            <Field label="Nom / Raison sociale"><input style={styles.input} value={client.nom} onChange={(e) => setClient({ ...client, nom: e.target.value })} /></Field>
            <Field label="Téléphone"><input style={styles.input} value={client.telephone} onChange={(e) => setClient({ ...client, telephone: e.target.value })} /></Field>
            <Field label="Adresse"><input style={styles.input} value={client.adresse} onChange={(e) => setClient({ ...client, adresse: e.target.value })} /></Field>
            <Field label="Mode de paiement">
              <select style={styles.input} value={mode} onChange={(e) => setMode(e.target.value)}>
                <option>Espèces</option>
                <option>Mobile Money</option>
                <option>Virement</option>
                <option>Chèque</option>
              </select>
            </Field>
          </div>

          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F2A5C", margin: "12px 0 8px" }}>Équipements vendus</div>
          <div style={styles.list}>
            {lignes.map((l, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select style={{ ...styles.input, flex: 2 }} value={l.id} onChange={(e) => updateLigne(idx, { id: e.target.value })}>
                  {stock.map((s) => <option key={s.id} value={s.id}>{s.nom} ({s.prixUnitaire.toLocaleString("fr-FR")} F)</option>)}
                </select>
                <input type="number" min="1" style={{ ...styles.input, width: 70 }} value={l.quantite} onChange={(e) => updateLigne(idx, { quantite: e.target.value })} />
                {lignes.length > 1 && (
                  <button type="button" style={styles.deleteBtn} onClick={() => removeLigne(idx)}><Trash2 size={13} /></button>
                )}
              </div>
            ))}
            <button type="button" style={{ ...styles.smallBtn, alignSelf: "flex-start" }} onClick={addLigne}>+ Ajouter une ligne</button>
          </div>

          <button type="submit" style={styles.submitBtn}>Enregistrer et imprimer la facture</button>
        </form>
      </div>
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
  const [prixUnitaire, setPrixUnitaire] = useState(1000);
  const [initial, setInitial] = useState(0);
  const [seuil, setSeuil] = useState(10);
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!nom.trim()) { setError("Le nom de l'article est obligatoire."); return; }
    setError("");
    onSave({ nom, prixUnitaire: Number(prixUnitaire) || 0, initial: Number(initial), seuil: Number(seuil) });
  }

  return (
    <ModalShell title="Ajouter un équipement" onClose={onClose} onSubmit={handleSubmit}>
      <div style={styles.formGrid}>
        <Field label="Nom" error={error}><input style={styles.input} value={nom} onChange={(e) => setNom(e.target.value)} /></Field>
        <Field label="Prix unitaire (F CFA)"><input type="number" style={styles.input} value={prixUnitaire} onChange={(e) => setPrixUnitaire(e.target.value)} /></Field>
        <Field label="Stock initial"><input type="number" style={styles.input} value={initial} onChange={(e) => setInitial(e.target.value)} /></Field>
        <Field label="Seuil d'alerte"><input type="number" style={styles.input} value={seuil} onChange={(e) => setSeuil(e.target.value)} /></Field>
      </div>
      <div style={{ fontSize: 11.5, color: "#6B7A99", marginBottom: 10 }}>Une référence unique sera générée automatiquement.</div>
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
              <FolderOpen size={17} color="#2563EB" />
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.nom}</div>
            </div>
            <div style={{ fontSize: 12, color: "#6B7A99" }}>{c.count} docs</div>
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
          <button
            style={styles.smallBtn}
            onClick={() => printDocument("Rapport", `${docHeader("Rapport de gestion")}<h1>Rapport (${periode.debut} → ${periode.fin})</h1><table>${rows.map(([l, v]) => `<tr><td>${l}</td><td>${v}</td></tr>`).join("")}</table>`)}
          >
            <Download size={12} /> Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ======================================================================
// MODULE 13 — UTILISATEURS (rôles, permissions, création de comptes)
// ======================================================================
function UtilisateursModule({ users, setUsers, perms }) {
  const [showAdd, setShowAdd] = useState(false);
  const canManage = !!perms?.manageUsers;

  function addUser(entry) {
    setUsers((prev) => [...prev, { id: "u" + Date.now(), ...entry }]);
    setShowAdd(false);
  }

  return (
    <div style={styles.modulePad}>
      <div style={styles.sectionHead}>Rôles &amp; droits d'accès</div>
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
        {canManage ? (
          <button style={styles.smallBtn} onClick={() => setShowAdd(true)}>+ Nouvel utilisateur</button>
        ) : (
          <div style={styles.readOnlyBadge}><Lock size={11} /> Réservé à l'administrateur</div>
        )}
      </div>
      <div style={styles.list}>
        {users.map((u) => (
          <div key={u.id} style={styles.sessionRow}>
            <div>
              <div style={styles.sessionDate}>{u.nom}</div>
              <div style={styles.sessionLabel}>{u.email}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#2563EB" }}>{u.role}</span>
          </div>
        ))}
      </div>

      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onSave={addUser} />}
    </div>
  );
}

function AddUserModal({ onClose, onSave }) {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(seedRoles[0].role);
  const [errors, setErrors] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!nom.trim()) errs.nom = "Obligatoire";
    if (!email.trim() || !email.includes("@")) errs.email = "Email invalide";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ nom, email, role });
  }

  return (
    <ModalShell title="Créer un compte utilisateur" onClose={onClose} onSubmit={handleSubmit}>
      <div style={styles.formGrid}>
        <Field label="Nom complet" error={errors.nom}><input style={styles.input} value={nom} onChange={(e) => setNom(e.target.value)} /></Field>
        <Field label="Email" error={errors.email}><input type="email" style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Rôle">
          <select style={styles.input} value={role} onChange={(e) => setRole(e.target.value)}>
            {seedRoles.map((r) => <option key={r.role} value={r.role}>{r.role}</option>)}
          </select>
        </Field>
      </div>
      {Object.keys(errors).length > 0 && <div style={styles.errorBanner}><AlertTriangle size={13} /> Merci de corriger les champs signalés.</div>}
      <div style={{ fontSize: 11.5, color: "#6B7A99", marginBottom: 10 }}>
        Un mot de passe temporaire sera envoyé par email (nécessite un backend réel — non simulé ici).
      </div>
      <button type="submit" style={styles.submitBtn}>Créer le compte</button>
    </ModalShell>
  );
}

// ======================================================================
// MODULE 14 — PARAMÈTRES (dont sécurité)
// ======================================================================
function ParametresModule({ perms }) {
  const [twoFA, setTwoFA] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [logAccess, setLogAccess] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const canManage = !!perms?.manageSettings;

  return (
    <div style={styles.modulePad}>
      <div style={styles.panel}>
        <div style={styles.sectionHead}>Informations générales</div>
        <div style={styles.infoGrid}>
          <div style={styles.infoRow}><div style={styles.infoLabel}>Nom de l'académie</div><div style={styles.infoValue}>Play For Academy</div></div>
          <div style={styles.infoRow}><div style={styles.infoLabel}>Devise</div><div style={styles.infoValue}>FCFA</div></div>
          <div style={styles.infoRow}><div style={styles.infoLabel}>Saison</div><div style={styles.infoValue}>2025 – 2026</div></div>
          <div style={{ ...styles.infoRow, borderBottom: "none" }}><div style={styles.infoLabel}>Catégories</div><div style={styles.infoValue}>U9, U11, U13, U15, U17, U19</div></div>
        </div>
      </div>

      <div style={{ height: 16 }} />

      <div style={styles.panel}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <ShieldCheck size={16} color="#2563EB" />
          <div style={styles.sectionHead}>Sécurité de la base de données</div>
        </div>
        <div style={{ fontSize: 11.5, color: "#6B7A99", marginBottom: 12 }}>
          Cette interface ne dispose pas encore d'un serveur/base de données réel : ces réglages sont
          prêts à être branchés sur un backend (authentification, chiffrement, sauvegardes) dès qu'il sera en place.
        </div>
        {!canManage && (
          <div style={styles.errorBanner}><Lock size={12} /> Réglages visibles en lecture seule pour votre rôle.</div>
        )}
        <div style={styles.infoGrid}>
          <label style={{ ...styles.infoRow, cursor: canManage ? "pointer" : "default" }}>
            <div style={styles.infoLabel}>Authentification à deux facteurs (2FA)</div>
            <input type="checkbox" disabled={!canManage} checked={twoFA} onChange={(e) => setTwoFA(e.target.checked)} />
          </label>
          <label style={{ ...styles.infoRow, cursor: canManage ? "pointer" : "default" }}>
            <div style={styles.infoLabel}>Journalisation des accès (logs)</div>
            <input type="checkbox" disabled={!canManage} checked={logAccess} onChange={(e) => setLogAccess(e.target.checked)} />
          </label>
          <label style={{ ...styles.infoRow, cursor: canManage ? "pointer" : "default" }}>
            <div style={styles.infoLabel}>Sauvegardes automatiques</div>
            <input type="checkbox" disabled={!canManage} checked={autoBackup} onChange={(e) => setAutoBackup(e.target.checked)} />
          </label>
          <div style={{ ...styles.infoRow, borderBottom: "none" }}>
            <div style={styles.infoLabel}>Expiration de session (minutes)</div>
            <select style={{ ...styles.input, width: 110 }} disabled={!canManage} value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)}>
              {["15", "30", "60", "120"].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================================================================
// STYLES — thème bleu / blanc
// ======================================================================
const fontImport = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap');
* { box-sizing: border-box; }
input:focus, select:focus, textarea:focus { outline: 2px solid #2563EB; outline-offset: 1px; }
button:focus-visible { outline: 2px solid #2563EB; outline-offset: 2px; }
`;

const styles = {
  // ---- shell (architecture globale) ----
  shellRoot: { display: "flex", minHeight: "100vh", background: "#F4F7FC", fontFamily: "'Inter', sans-serif", color: "#16233F" },
  globalSidebar: { width: 232, background: "#0F2A5C", color: "#fff", display: "flex", flexDirection: "column", padding: "20px 14px", flexShrink: 0 },
  navList: { display: "flex", flexDirection: "column", gap: 2, marginTop: 8, flex: 1 },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#BFD3F5" },
  navItemActive: { background: "#1D3F7A", color: "#fff", fontWeight: 600 },
  navLabel: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  sidebarFooterNote: { display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: "#7C95C4", paddingTop: 10, borderTop: "1px solid #1D3F7A" },

  shellMain: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", position: "relative", overflow: "hidden" },
  watermark: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.035, pointerEvents: "none", color: "#0F2A5C", zIndex: 0 },
  shellHeader: { padding: "14px 32px", borderBottom: "1px solid #DCE6F5", background: "#F4F7FC", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 },
  shellHeaderTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 },
  shellBody: { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 },
  modulePad: { padding: "24px 32px", overflowY: "auto", height: "100%" },

  sessionBox: { display: "flex", alignItems: "center", gap: 10 },
  sessionName: { fontSize: 12.5, fontWeight: 700, color: "#16233F" },
  sessionRole: { fontSize: 11, color: "#6B7A99" },
  sessionSelect: { border: "1px solid #DCE6F5", borderRadius: 8, padding: "6px 8px", fontSize: 11.5, background: "#fff", color: "#16233F" },
  logoutBtn: { background: "#fff", border: "1px solid #DCE6F5", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#2563EB" },

  statsRow7: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 },
  dashGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },

  barChart: { display: "flex", alignItems: "flex-end", gap: 10, height: 130, marginTop: 10 },
  barChartCol: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  barChartTrack: { width: "100%", height: 80, background: "#EAF1FB", borderRadius: 6, display: "flex", alignItems: "flex-end", overflow: "hidden" },
  barChartFill: { width: "100%", borderRadius: "4px 4px 0 0" },
  barChartVal: { fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#1D3F7A" },
  barChartLabel: { fontSize: 11, color: "#6B7A99" },

  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 },

  planningGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 },
  planningCol: { background: "#fff", border: "1px solid #DCE6F5", borderRadius: 10, padding: 10, minHeight: 140, display: "flex", flexDirection: "column", gap: 8 },
  planningDayHead: { fontSize: 12.5, fontWeight: 700, color: "#0F2A5C", textAlign: "center", paddingBottom: 6, borderBottom: "1px solid #EAF1FB" },
  planningCard: { background: "#F4F7FC", borderLeft: "3px solid #2563EB", borderRadius: 6, padding: "8px 9px" },
  planningTime: { fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#0F2A5C" },
  planningCat: { fontSize: 12.5, fontWeight: 600, marginTop: 2 },
  planningMeta: { fontSize: 11, color: "#6B7A99" },

  table: { width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #DCE6F5", borderRadius: 12, overflow: "hidden" },
  th: { textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#6B7A99", textTransform: "uppercase", letterSpacing: 0.3, padding: "10px 14px", borderBottom: "1px solid #DCE6F5", background: "#F4F7FC" },
  td: { fontSize: 13, padding: "10px 14px", borderBottom: "1px solid #EAF1FB" },
  stockBtn: { background: "#EAF1FB", border: "none", borderRadius: 6, padding: "5px 9px", fontSize: 11.5, fontWeight: 600, color: "#0F2A5C", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 },

  wizardSteps: { display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" },
  wizardStep: { fontSize: 11, padding: "5px 9px", borderRadius: 6, background: "#EAF1FB", color: "#6B7A99", fontWeight: 600 },
  wizardStepActive: { background: "#0F2A5C", color: "#fff" },
  wizardStepDone: { background: "#DCE9FF", color: "#2563EB" },

  addPlayerBtnInline: { display: "flex", alignItems: "center", gap: 8, background: "#2563EB", color: "#fff", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },

  errorBanner: { display: "flex", alignItems: "center", gap: 6, background: "#FDEDEC", color: "#C0392B", fontSize: 12, fontWeight: 600, padding: "8px 10px", borderRadius: 8, marginBottom: 10 },
  readOnlyBadge: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#6B7A99", background: "#EAF1FB", padding: "5px 9px", borderRadius: 6 },

  // ---- module Joueurs (mise en page interne) ----
  joueursApp: { display: "flex", height: "100%" },
  sidebar: { width: 260, background: "#0F2A5C", color: "#fff", display: "flex", flexDirection: "column", padding: "20px 16px", flexShrink: 0 },
  brand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20 },
  brandMark: { fontSize: 22 },
  brandTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: 0.5 },
  brandSub: { fontSize: 11, color: "#9DB8EA" },
  searchWrap: { display: "flex", alignItems: "center", gap: 8, background: "#1D3F7A", borderRadius: 8, padding: "8px 10px", marginBottom: 14 },
  searchInput: { background: "transparent", border: "none", color: "#fff", fontSize: 13, width: "100%", outline: "none" },
  rosterList: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 },
  rosterItem: { display: "flex", alignItems: "center", gap: 10, padding: "9px 8px", borderRadius: 8, cursor: "pointer" },
  rosterItemActive: { background: "#1D3F7A" },
  rosterNum: { width: 26, height: 26, borderRadius: 6, background: "#2554A6", color: "#DCE9FF", fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  rosterName: { fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  rosterPos: { fontSize: 11, color: "#9DB8EA" },
  addPlayerBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, background: "#fff", color: "#0F2A5C", border: "none", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" },

  main: { flex: 1, padding: "24px 32px", overflowY: "auto" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 },
  statCard: { background: "#fff", border: "1px solid #DCE6F5", borderRadius: 12, padding: "14px 16px" },
  statIcon: { display: "flex" },

  profileHeader: { display: "flex", alignItems: "center", gap: 14, marginBottom: 16 },
  avatarBig: { width: 52, height: 52, borderRadius: "50%", background: "#0F2A5C", color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  profileName: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20 },
  profileMeta: { fontSize: 13, color: "#6B7A99", marginTop: 2 },
  deleteBtn: { background: "#fff", border: "1px solid #DCE6F5", color: "#B3413A", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },

  tabs: { display: "flex", gap: 4, borderBottom: "1px solid #DCE6F5", marginBottom: 18 },
  tab: { padding: "9px 14px", fontSize: 13.5, fontWeight: 500, color: "#6B7A99", cursor: "pointer", borderBottom: "2px solid transparent" },
  tabActive: { color: "#0F2A5C", borderBottom: "2px solid #2563EB", fontWeight: 600 },

  panel: { background: "#fff", border: "1px solid #DCE6F5", borderRadius: 12, padding: 20, maxWidth: 720 },

  infoGrid: { display: "flex", flexDirection: "column", gap: 0 },
  infoRow: { display: "flex", justifyContent: "space-between", padding: "10px 2px", borderBottom: "1px solid #EAF1FB" },
  infoLabel: { fontSize: 13, color: "#6B7A99" },
  infoValue: { fontSize: 13.5, fontWeight: 600 },

  miniStatsRow: { display: "flex", gap: 24, marginBottom: 18 },
  miniStat: { textAlign: "center" },

  sectionHeadRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionHead: { fontSize: 13.5, fontWeight: 600, color: "#16233F" },
  smallBtn: { background: "#EAF1FB", border: "none", borderRadius: 7, padding: "6px 11px", fontSize: 12.5, fontWeight: 600, color: "#0F2A5C", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 },

  list: { display: "flex", flexDirection: "column", gap: 8 },
  emptyState: { fontSize: 13, color: "#9AA7C0", padding: "16px 4px" },

  sessionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F4F7FC", borderRadius: 9 },
  sessionDate: { fontSize: 13, fontWeight: 600, textTransform: "capitalize" },
  sessionLabel: { fontSize: 11.5, color: "#6B7A99", marginTop: 1 },
  statusBtn: { width: 28, height: 28, borderRadius: 7, border: "1.5px solid", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },

  perfRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: "10px 12px", background: "#F4F7FC", borderRadius: 9 },
  perfNote: { fontSize: 13, marginTop: 3, color: "#16233F", lineHeight: 1.4 },
  starRow: { display: "flex", gap: 1, flexShrink: 0, paddingTop: 2 },

  payRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F4F7FC", borderRadius: 9 },
  payBtn: { background: "#0F2A5C", color: "#fff", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" },
  paidBadge: { display: "flex", alignItems: "center", gap: 4, background: "#E7F3EC", color: "#2E7D4F", fontSize: 11.5, fontWeight: 600, padding: "5px 9px", borderRadius: 6 },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15,42,92,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 },
  modal: { background: "#fff", borderRadius: 14, padding: 22, width: 420, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 },
  modalClose: { background: "#EAF1FB", border: "none", borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },

  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 },
  fieldLabel: { display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600, color: "#3D4A66" },
  fieldError: { fontSize: 11, color: "#C0392B", fontWeight: 600 },
  input: { border: "1px solid #DCE6F5", borderRadius: 8, padding: "8px 10px", fontSize: 13.5, fontFamily: "'Inter', sans-serif", color: "#16233F", background: "#fff" },
  submitBtn: { width: "100%", background: "#2563EB", color: "#fff", border: "none", borderRadius: 9, padding: "11px 14px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", marginTop: 6 },
};
