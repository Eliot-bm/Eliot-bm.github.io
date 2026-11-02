// dubois-motion.js
// ------------------------------------------------------------------------------
// Regles communes a TOUT graphique anime du site. Elles sont appliquees par le
// code, pas par une liste a relire : on ne peut pas construire une figure animee
// sans les respecter.
//
//   1. Bouton pause / lecture (WCAG 2.2.2) et pas a pas ‹ ›. Toute animation
//      automatique peut etre arretee, et la figure reste lisible a l'arret.
//   2. prefers-reduced-motion : avec ce reglage, rien ne demarre seul et les
//      transitions durent 0 ms (le changement d'etat est instantane). Le
//      lecteur garde la main : lecture et pas a pas restent disponibles.
//   3. Les donnees de la figure se telechargent en CSV (UTF-8, point decimal).
//      `csv` est OBLIGATOIRE.
//   4. Texte alternatif : `alt` est OBLIGATOIRE ; il peut dependre de l'etape,
//      pour que l'etat courant soit decrit, pas seulement le titre.
//
// Pas de couleur ici : les commandes sont habillees dans styles.scss
// (.fig-motion), les couleurs du dessin viennent de dubois-theme.js.
//
// Usage dans un .qmd (d3 est fourni par OJS) :
//   import {animatedFigure} from "../assets/js/dubois-motion.js"
//   animatedFigure({d3, invalidation, width: 600, height: 300, frames: 3,
//     alt: (k) => `...`, caption: (k) => `...`,
//     csv: {filename: "donnees.csv", rows: [{a: 1, b: 2}]},
//     mount: (svg) => (k, ms) => { /* dessine l'etape k en ms millisecondes */ }})
// ------------------------------------------------------------------------------

const LABELS = {
  group: "Animation controls", play: "Play", pause: "Pause", replay: "Replay",
  prev: "Previous step", next: "Next step",
  step: (k, n) => `Step ${k} of ${n}`, csv: "Download the data (CSV)"
};

// Une cellule CSV : guillemets doubles autour de tout champ qui contient
// separateur, guillemet ou saut de ligne.
const cell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCSV(rows) {
  if (!rows.length) throw new Error("dubois-motion : csv.rows est vide");
  const cols = Object.keys(rows[0]);
  return [cols.join(","), ...rows.map(r => cols.map(c => cell(r[c])).join(","))].join("\r\n");
}

export function animatedFigure({
  d3, invalidation, width, height, frames, mount, alt, caption, csv,
  interval = 2800,       // pause entre deux etapes, assez longue pour lire la legende
  duration = 900,        // duree d'une transition
  labels = {}
}) {
  if (!d3) throw new Error("dubois-motion : d3 manque (passer { d3 })");
  if (!alt) throw new Error("dubois-motion : texte alternatif `alt` obligatoire");
  if (!csv || !csv.rows || !csv.filename) throw new Error("dubois-motion : `csv` ({filename, rows}) obligatoire");
  if (!(frames >= 2)) throw new Error("dubois-motion : `frames` doit valoir au moins 2");
  const L = {...LABELS, ...labels};
  const altOf = typeof alt === "function" ? alt : () => alt;

  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ms = () => (mq.matches ? 0 : duration);

  // --- Structure ---------------------------------------------------------------
  const fig = d3.create("figure").attr("class", "fig-motion");
  const svg = fig.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("max-width", `${width + 80}px`)   // pas d'agrandissement au-dela de la taille de dessin
    .attr("role", "img");
  const cap = fig.append("figcaption").attr("class", "fig-motion__caption");
  const bar = fig.append("div").attr("class", "fig-motion__bar")
    .attr("role", "group").attr("aria-label", L.group);
  const playBtn = bar.append("button").attr("type", "button").attr("class", "fig-motion__play");
  const prevBtn = bar.append("button").attr("type", "button").text("‹").attr("aria-label", L.prev);
  const nextBtn = bar.append("button").attr("type", "button").text("›").attr("aria-label", L.next);
  const count = bar.append("span").attr("class", "fig-motion__count");

  // Le CSV est fabriqué à la demande et le lien reste un vrai lien : clic droit
  // et clavier fonctionnent. L'URL est libérée avec la figure.
  const blobUrl = URL.createObjectURL(
    new Blob(["﻿" + toCSV(csv.rows)], {type: "text/csv;charset=utf-8"}));
  bar.append("a").attr("class", "fig-motion__csv")
    .attr("href", blobUrl).attr("download", csv.filename).text(L.csv);

  const update = mount(svg);

  // --- Etat et lecture ---------------------------------------------------------
  let frame = 0, playing = false, timer = null, done = false;

  function show(k, animate = true) {
    frame = k;
    update(k, animate ? ms() : 0);
    svg.attr("aria-label", altOf(k));
    cap.text(caption ? caption(k) : "");
    count.text(L.step(k, frames - 1));   // etape 0 = etat initial
    prevBtn.property("disabled", k === 0);
    nextBtn.property("disabled", k === frames - 1);
    playBtn.text(playing ? L.pause : (k === frames - 1 ? L.replay : L.play))
      .attr("aria-pressed", playing ? "true" : "false");
    // Pas d'annonce a chaque etape pendant la lecture automatique.
    cap.attr("aria-live", playing ? "off" : "polite");
  }

  function stop() {
    playing = false;
    clearTimeout(timer);
    show(frame, false);
  }

  function tick() {
    if (!playing) return;
    if (frame >= frames - 1) { stop(); return; }
    show(frame + 1);
    timer = setTimeout(tick, interval);
  }

  function start() {
    clearTimeout(timer);   // jamais deux minuteries a la fois
    if (frame >= frames - 1) show(0, false);
    playing = true;
    show(frame, false);
    timer = setTimeout(tick, interval);
  }

  playBtn.on("click", () => (playing ? stop() : start()));
  prevBtn.on("click", () => { stop(); show(Math.max(0, frame - 1)); });
  nextBtn.on("click", () => { stop(); show(Math.min(frames - 1, frame + 1)); });

  // Le mouvement reduit coupe la lecture en cours si le reglage change.
  const onMotion = () => { if (mq.matches && playing) stop(); };
  mq.addEventListener("change", onMotion);

  show(0, false);

  // Demarrage automatique : une fois, quand la figure est a moitie visible, et
  // jamais avec prefers-reduced-motion. OJS ne construit rien hors ecran, mais
  // la figure peut exister avant d'etre vue.
  const node = fig.node();
  let observer = null;
  if (!mq.matches && "IntersectionObserver" in window) {
    observer = new IntersectionObserver((entries) => {
      if (!done && entries.some(e => e.isIntersecting)) {
        done = true;
        observer.disconnect();
        // Si le lecteur a deja agi (lecture, pas a pas), on ne lui reprend pas la main.
        if (!playing && frame === 0) start();
      }
    }, {threshold: 0.5});
    observer.observe(node);
  }

  // Nettoyage quand OJS re-evalue la cellule.
  if (invalidation) invalidation.then(() => {
    clearTimeout(timer);
    playing = false;
    if (observer) observer.disconnect();
    mq.removeEventListener("change", onMotion);
    URL.revokeObjectURL(blobUrl);
  });

  return node;
}
