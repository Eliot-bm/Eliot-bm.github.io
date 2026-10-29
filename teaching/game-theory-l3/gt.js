// gt.js — outils partages par les pages de theorie des jeux (L3).
// Rien ici ne decide d'une reponse a la place de l'etudiant : ce sont des
// fonctions de calcul et de dessin. Chaque page declare ses propres jeux.

export const C = {
  crimson: "#C8102E", gold: "#E8A33D", indigo: "#1E4C7C",
  olive: "#5C7A47", umber: "#7B4B28", ink: "#1A1A1A", cream: "#EFE3CE"
};

export const plotStyle = {backgroundColor: C.cream, fontFamily: "Jost", fontSize: "12px"};

// Transforme une chaine HTML/SVG en noeud DOM (OJS n'affiche pas une chaine brute).
export function toNode(s) {
  const d = document.createElement("div");
  d.innerHTML = s;
  return d;
}

const num = (x) => String(x).replace("-", "−");
// Decimales a la francaise : 0,40 et non 0.40.
export const fr = (x, d = 2) => {
  let s = x.toFixed(d);
  if (Number(s) === 0) s = (0).toFixed(d);   // pas de « -0,00 »
  return s.replace(".", ",").replace("-", "−");
};

// ---------------------------------------------------------------------------
// Jeux sous forme strategique. A[i][j] = gain du joueur ligne, B[i][j] = gain
// du joueur colonne, quand ligne joue i et colonne joue j.
// ---------------------------------------------------------------------------

// Elimination iteree des strategies strictement dominees (par une strategie
// pure). A chaque tour on retire TOUT ce qui est domine, pour les deux joueurs.
export function eissd(A, B) {
  let rows = A.map((_, i) => i), cols = A[0].map((_, j) => j);
  const rounds = [];
  for (;;) {
    const dr = [], dc = [];
    for (const r of rows) {
      const by = rows.find(r2 => r2 !== r && cols.every(c => A[r2][c] > A[r][c]));
      if (by !== undefined) dr.push({i: r, by});
    }
    for (const c of cols) {
      const by = cols.find(c2 => c2 !== c && rows.every(r => B[r][c2] > B[r][c]));
      if (by !== undefined) dc.push({i: c, by});
    }
    if (!dr.length && !dc.length) break;
    rounds.push({rows: dr, cols: dc});
    rows = rows.filter(r => !dr.some(d => d.i === r));
    cols = cols.filter(c => !dc.some(d => d.i === c));
  }
  return {rounds, rows, cols};
}

// Equilibres de Nash en strategies pures : cases ou chacun joue une meilleure reponse.
export function pureNE(A, B) {
  const out = [];
  for (let i = 0; i < A.length; i++)
    for (let j = 0; j < A[0].length; j++) {
      const bestRow = A.every((_, i2) => A[i2][j] <= A[i][j]);
      const bestCol = B[i].every(b => b <= B[i][j]);
      if (bestRow && bestCol) out.push([i, j]);
    }
  return out;
}

// Matrice de gains en HTML. Options :
//   deadRows, deadCols : indices elimines (barres, grises)
//   underline          : souligne les meilleures reponses (bleu = ligne, rouge = colonne)
//                        et colore les cases ou les deux le sont (= Nash en pures)
export function matrixTable(A, B, rowNames, colNames, opt = {}) {
  const {deadRows = [], deadCols = [], underline = false,
         rowTitle = "Joueur 1", colTitle = "Joueur 2"} = opt;
  const R = A.map((_, i) => i).filter(i => !deadRows.includes(i));
  const K = A[0].map((_, j) => j).filter(j => !deadCols.includes(j));
  const maxRowInCol = j => Math.max(...R.map(i => A[i][j]));
  const maxColInRow = i => Math.max(...K.map(j => B[i][j]));

  const cell = (i, j) => {
    const dead = deadRows.includes(i) || deadCols.includes(j);
    let a = `<span>${num(A[i][j])}</span>`, b = `<span>${num(B[i][j])}</span>`;
    let bg = "";
    if (underline && !dead) {
      const ur = A[i][j] === maxRowInCol(j), uc = B[i][j] === maxColInRow(i);
      if (ur) a = `<span style="border-bottom:2px solid ${C.indigo}">${num(A[i][j])}</span>`;
      if (uc) b = `<span style="border-bottom:2px solid ${C.crimson}">${num(B[i][j])}</span>`;
      if (ur && uc) bg = `background:${C.gold}55;`;
    }
    const fade = dead ? "opacity:.3;text-decoration:line-through;" : "";
    return `<td style="border:1px solid ${C.ink}33;padding:.45rem .8rem;text-align:center;white-space:nowrap;${bg}${fade}">(${a}&nbsp;;&nbsp;${b})</td>`;
  };

  const head = colNames.map((n, j) =>
    `<th style="padding:.3rem .8rem;text-align:center;${deadCols.includes(j) ? "opacity:.3;text-decoration:line-through;" : ""}">${n}</th>`).join("");
  const body = rowNames.map((n, i) =>
    `<tr><th style="padding:.3rem .8rem;text-align:right;${deadRows.includes(i) ? "opacity:.3;text-decoration:line-through;" : ""}">${n}</th>${colNames.map((_, j) => cell(i, j)).join("")}</tr>`).join("");
  return `<table style="font-family:Jost,sans-serif;font-size:.95rem;border-collapse:collapse;margin:.4rem 0">
    <tr><th></th><th colspan="${colNames.length}" style="text-align:center;color:${C.crimson};font-weight:500">${colTitle}</th></tr>
    <tr><th style="color:${C.indigo};font-weight:500;text-align:right">${rowTitle}</th>${head}</tr>${body}</table>`;
}

// ---------------------------------------------------------------------------
// Jeux 2x2 : meilleures reponses en strategies mixtes.
//   p = probabilite que LIGNE joue sa 1re ligne ; q = probabilite que COLONNE
//   joue sa 1re colonne. Plan (p, q) : abscisse p, ordonnee q.
// ---------------------------------------------------------------------------

export function gains2x2(A, B, p, q) {
  const w = [p * q, p * (1 - q), (1 - p) * q, (1 - p) * (1 - q)];
  const f = M => w[0] * M[0][0] + w[1] * M[0][1] + w[2] * M[1][0] + w[3] * M[1][1];
  return {u1: f(A), u2: f(B), w};
}

export function br2x2(A, B) {
  // a0, a1 : avantage de la 1re ligne sur la 2e, si colonne 1 / colonne 2.
  const a0 = A[0][0] - A[1][0], a1 = A[0][1] - A[1][1];
  // b0, b1 : avantage de la 1re colonne sur la 2e, si ligne 1 / ligne 2.
  const b0 = B[0][0] - B[0][1], b1 = B[1][0] - B[1][1];
  const qs = a0 !== a1 ? -a1 / (a0 - a1) : null;   // q qui rend LIGNE indifferente
  const ps = b0 !== b1 ? -b1 / (b0 - b1) : null;   // p qui rend COLONNE indifferente
  const inside = x => x !== null && x > 1e-12 && x < 1 - 1e-12;
  const d = q => q * a0 + (1 - q) * a1;
  const e = p => p * b0 + (1 - p) * b1;

  const rowPath = [], colPath = [];
  // Correspondance de LIGNE : p en fonction de q.
  const qb = [0, ...(inside(qs) ? [qs] : []), 1];
  for (let k = 0; k < qb.length - 1; k++) {
    const mid = (qb[k] + qb[k + 1]) / 2, v = d(mid);
    if (v === 0) continue;
    const p = v > 0 ? 1 : 0;
    rowPath.push({x: p, y: qb[k], g: "r" + k}, {x: p, y: qb[k + 1], g: "r" + k});
  }
  if (inside(qs)) rowPath.push({x: 0, y: qs, g: "rv"}, {x: 1, y: qs, g: "rv"});
  // Correspondance de COLONNE : q en fonction de p.
  const pb = [0, ...(inside(ps) ? [ps] : []), 1];
  for (let k = 0; k < pb.length - 1; k++) {
    const mid = (pb[k] + pb[k + 1]) / 2, v = e(mid);
    if (v === 0) continue;
    const q = v > 0 ? 1 : 0;
    colPath.push({x: pb[k], y: q, g: "c" + k}, {x: pb[k + 1], y: q, g: "c" + k});
  }
  if (inside(ps)) colPath.push({x: ps, y: 0, g: "cv"}, {x: ps, y: 1, g: "cv"});

  // Equilibres : coins qui sont meilleures reponses mutuelles, plus l'interieur.
  const eq = [];
  for (const p of [0, 1]) for (const q of [0, 1]) {
    const okRow = p === 1 ? d(q) >= 0 : d(q) <= 0;
    const okCol = q === 1 ? e(p) >= 0 : e(p) <= 0;
    if (okRow && okCol) eq.push({p, q, kind: "pur"});
  }
  if (inside(qs) && inside(ps)) eq.push({p: ps, q: qs, kind: "mixte"});
  return {rowPath, colPath, eq, qs, ps};
}

// Marques Plot pour les equilibres : points verts et etiquettes (p ; q).
// dx est une constante dans Plot : on ecrit donc trois marques de texte, une par
// cote du carre, pour que les etiquettes des coins ne sortent pas du cadre.
export function eqMarks(Plot, eq) {
  const lab = d => `(${fr(d.p)} ; ${fr(d.q)})`;
  const side = (keep, anchor, dx) => Plot.text(eq.filter(keep), {
    x: "p", y: "q", text: lab, textAnchor: anchor, dx, dy: -16, fill: C.ink, fontWeight: 600
  });
  return [
    Plot.dot(eq, {x: "p", y: "q", fill: C.olive, r: 8, stroke: "white", strokeWidth: 2}),
    side(d => d.p < 0.1, "start", 10),
    side(d => d.p > 0.9, "end", -10),
    side(d => d.p >= 0.1 && d.p <= 0.9, "middle", 0)
  ];
}

// ---------------------------------------------------------------------------
// Mosaique : le carre unite decoupe en quatre rectangles dont l'aire est la
// probabilite de chaque case. Largeur = q (colonne), hauteur = p (ligne).
// ---------------------------------------------------------------------------
export function mosaicSVG(A, B, p, q, rowNames, colNames) {
  const S = 300, X0 = 78, Y0 = 44, W = X0 + S + 20, H = Y0 + S + 16;
  const xs = [X0, X0 + S * q, X0 + S], ys = [Y0, Y0 + S * p, Y0 + S];
  const fills = [[C.indigo, C.gold], [C.olive, C.crimson]];
  let out = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W + 60}px;font-family:Jost,sans-serif" role="img" aria-label="Mosaïque des probabilités du profil mixte">`;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const x = xs[j], w = xs[j + 1] - xs[j], y = ys[i], h = ys[i + 1] - ys[i];
    const prob = (i === 0 ? p : 1 - p) * (j === 0 ? q : 1 - q);
    out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fills[i][j]}" fill-opacity=".28" stroke="${C.ink}" stroke-width="1"/>`;
    if (w > 62 && h > 40) {
      out += `<text x="${x + w / 2}" y="${y + h / 2 - 4}" text-anchor="middle" font-size="13" fill="${C.ink}">(${num(A[i][j])} ; ${num(B[i][j])})</text>`;
      out += `<text x="${x + w / 2}" y="${y + h / 2 + 13}" text-anchor="middle" font-size="11.5" fill="${C.umber}">prob. ${fr(prob, 3)}</text>`;
    }
  }
  out += `<text x="${(xs[0] + xs[1]) / 2}" y="${Y0 - 20}" text-anchor="middle" font-size="12.5" fill="${C.crimson}">${colNames[0]}</text>`;
  out += `<text x="${(xs[1] + xs[2]) / 2}" y="${Y0 - 20}" text-anchor="middle" font-size="12.5" fill="${C.crimson}">${colNames[1]}</text>`;
  out += `<text x="${(xs[0] + xs[1]) / 2}" y="${Y0 - 6}" text-anchor="middle" font-size="11" fill="${C.crimson}">q = ${fr(q)}</text>`;
  out += `<text x="${(xs[1] + xs[2]) / 2}" y="${Y0 - 6}" text-anchor="middle" font-size="11" fill="${C.crimson}">1−q = ${fr(1 - q)}</text>`;
  out += `<text x="${X0 - 8}" y="${(ys[0] + ys[1]) / 2 - 2}" text-anchor="end" font-size="12.5" fill="${C.indigo}">${rowNames[0]}</text>`;
  out += `<text x="${X0 - 8}" y="${(ys[0] + ys[1]) / 2 + 12}" text-anchor="end" font-size="11" fill="${C.indigo}">p = ${fr(p)}</text>`;
  out += `<text x="${X0 - 8}" y="${(ys[1] + ys[2]) / 2 - 2}" text-anchor="end" font-size="12.5" fill="${C.indigo}">${rowNames[1]}</text>`;
  out += `<text x="${X0 - 8}" y="${(ys[1] + ys[2]) / 2 + 12}" text-anchor="end" font-size="11" fill="${C.indigo}">1−p = ${fr(1 - p)}</text>`;
  return out + "</svg>";
}

// ---------------------------------------------------------------------------
// Simplexe : l'ensemble des strategies mixtes a deux ou trois strategies pures.
// ---------------------------------------------------------------------------
export function simplexSVG(names, probs) {
  const W = 360, H = 270;
  const V = [[W / 2, 28], [48, H - 36], [W - 48, H - 36]];
  const P = [0, 1, 2].reduce((acc, k) => [acc[0] + probs[k] * V[k][0], acc[1] + probs[k] * V[k][1]], [0, 0]);
  let out = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W + 60}px;font-family:Jost,sans-serif" role="img" aria-label="Triangle des stratégies mixtes">`;
  out += `<polygon points="${V.map(v => v.join(",")).join(" ")}" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.5"/>`;
  // Lignes de niveau a 1/4, 1/2, 3/4 pour lire les coordonnees.
  for (const t of [0.25, 0.5, 0.75]) for (let k = 0; k < 3; k++) {
    const a = V[k], b = V[(k + 1) % 3], c = V[(k + 2) % 3];
    const p1 = [a[0] * t + b[0] * (1 - t), a[1] * t + b[1] * (1 - t)];
    const p2 = [a[0] * t + c[0] * (1 - t), a[1] * t + c[1] * (1 - t)];
    out += `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="${C.ink}" stroke-opacity=".15"/>`;
  }
  const lab = [[V[0][0], V[0][1] - 10, "middle"], [V[1][0] - 8, V[1][1] + 18, "middle"], [V[2][0] + 8, V[2][1] + 18, "middle"]];
  names.forEach((n, k) => {
    out += `<circle cx="${V[k][0]}" cy="${V[k][1]}" r="4" fill="${C.ink}"/>`;
    out += `<text x="${lab[k][0]}" y="${lab[k][1]}" text-anchor="${lab[k][2]}" font-size="13" fill="${C.ink}">${n} (pure)</text>`;
  });
  out += `<circle cx="${P[0]}" cy="${P[1]}" r="7" fill="${C.crimson}" stroke="white" stroke-width="2"/>`;
  return out + "</svg>";
}

// ---------------------------------------------------------------------------
// Jeux sous forme extensive.
//   noeud interne : {who: 1|2|3, name, info?, kids: [{a: "action", n: noeud}]}
//   feuille       : {pay: [g1, g2, ...]}
// ---------------------------------------------------------------------------

const PCOL = {1: C.indigo, 2: C.crimson, 3: C.olive};

// Backward induction. Travaille sur une copie. Un noeud a pour hauteur h le
// nombre de decisions qui le separent de ses feuilles les plus lointaines.
export function solveTree(tree) {
  const t = structuredClone(tree);
  const go = n => {
    if (n.pay) { n.val = n.pay; n.h = 0; return n; }
    n.kids.forEach(k => go(k.n));
    n.h = 1 + Math.max(...n.kids.map(k => k.n.h));
    const w = n.who - 1;
    let best = 0;
    n.kids.forEach((k, i) => { if (k.n.val[w] > n.kids[best].n.val[w]) best = i; });
    n.best = best;
    n.tie = n.kids.some((k, i) => i !== best && k.n.val[w] === n.kids[best].n.val[w]);
    n.val = n.kids[best].n.val;
    return n;
  };
  go(t);
  return t;
}

function hasInfo(n) {
  return !n.pay && (n.info !== undefined || n.kids.some(k => hasInfo(k.n)));
}

// Dessine l'arbre. step = nombre d'etapes de backward induction deja faites
// (0 = arbre nu). Les noeuds de hauteur <= step sont resolus : l'arete choisie
// est epaisse, les autres sont en pointilles.
export function treeSVG(tree, step = 0) {
  const solvable = !hasInfo(tree);
  const t = solvable ? solveTree(tree) : structuredClone(tree);
  const dx = 150, dy = 58, X0 = 36, Y0 = 34;
  let leaf = 0, maxD = 0;
  const nodes = [], edges = [];
  const place = (n, d) => {
    maxD = Math.max(maxD, d);
    if (n.pay) { n.y = Y0 + dy * leaf++; }
    else {
      n.kids.forEach(k => place(k.n, d + 1));
      n.y = n.kids.reduce((s, k) => s + k.n.y, 0) / n.kids.length;
    }
    n.x = X0 + dx * d;
    nodes.push(n);
    if (!n.pay) n.kids.forEach((k, i) => edges.push({from: n, to: k.n, a: k.a, i}));
  };
  place(t, 0);
  const W = X0 + dx * maxD + 120, H = Y0 * 2 + dy * (leaf - 1);

  let out = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W + 80}px;font-family:Jost,sans-serif" role="img" aria-label="Arbre du jeu">`;
  // Ensembles d'information : trait pointille entre noeuds du meme ensemble.
  const groups = {};
  nodes.filter(n => n.info !== undefined).forEach(n => (groups[n.info] ||= []).push(n));
  Object.values(groups).forEach(g => {
    if (g.length < 2) return;
    const ys = g.map(n => n.y);
    out += `<line x1="${g[0].x}" y1="${Math.min(...ys)}" x2="${g[0].x}" y2="${Math.max(...ys)}" stroke="${PCOL[g[0].who]}" stroke-width="7" stroke-opacity=".28" stroke-linecap="round"/>`;
  });
  for (const e of edges) {
    const resolved = solvable && e.from.h <= step;
    const chosen = resolved && e.from.best === e.i;
    const stroke = !resolved ? C.ink : chosen ? C.crimson : "#8a8a8a";
    const sw = chosen ? 3.4 : resolved ? 1.2 : 1.6;
    const dash = resolved && !chosen ? `stroke-dasharray="4,4"` : "";
    out += `<line x1="${e.from.x}" y1="${e.from.y}" x2="${e.to.x}" y2="${e.to.y}" stroke="${stroke}" stroke-width="${sw}" ${dash}/>`;
    const lx = e.from.x + (e.to.x - e.from.x) * 0.52, ly = e.from.y + (e.to.y - e.from.y) * 0.52 - 7;
    out += `<text x="${lx}" y="${ly}" text-anchor="middle" font-size="12.5" fill="${resolved && !chosen ? "#8a8a8a" : C.ink}" style="paint-order:stroke;stroke:white;stroke-width:4px">${e.a}</text>`;
  }
  for (const n of nodes) {
    if (n.pay) {
      out += `<text x="${n.x + 10}" y="${n.y + 4.5}" font-size="14" fill="${C.ink}">(${n.pay.map(num).join(" ; ")})</text>`;
    } else {
      out += `<circle cx="${n.x}" cy="${n.y}" r="12" fill="${PCOL[n.who]}" stroke="white" stroke-width="2"/>`;
      out += `<text x="${n.x}" y="${n.y + 4.5}" text-anchor="middle" font-size="13" fill="white" font-weight="600">${n.who}</text>`;
      if (solvable && n.h <= step)
        out += `<text x="${n.x}" y="${n.y - 18}" text-anchor="middle" font-size="12.5" fill="${C.olive}" font-weight="600" style="paint-order:stroke;stroke:white;stroke-width:4px">↦ (${n.val.map(num).join(" ; ")})</text>`;
    }
  }
  return out + "</svg>";
}

export function treeHeight(tree) {
  return solveTree(tree).h;
}

// Texte de l'etape k : ce que chaque noeud de hauteur k decide, et pourquoi.
export function treeStepText(tree, step) {
  if (hasInfo(tree)) return "Ce jeu contient un ensemble d’information : la backward induction ne s’applique pas telle quelle (voir le texte).";
  if (step === 0) return "Arbre nu. Chaque cercle est un nœud de décision, numéroté par le joueur qui y joue. Les gains sont écrits (joueur 1 ; joueur 2).";
  const t = solveTree(tree), lines = [];
  const go = n => {
    if (n.pay) return;
    if (n.h === step) {
      const w = n.who;
      const cmp = n.kids.map(k => `« ${k.a} » → ${num(k.n.val[w - 1])}`).join(", ");
      lines.push(`Nœud ${n.name ?? ""} (joueur ${w}) : il compare ${cmp}. Il choisit « ${n.kids[n.best].a} »${n.tie ? " (égalité : voir le texte)" : ""}.`);
    }
    n.kids.forEach(k => go(k.n));
  };
  go(t);
  return lines.length ? lines.join(" ") : "Aucun nœud à cette hauteur.";
}

// ---------------------------------------------------------------------------
// Matrice augmentee (idee didactique de Garrett et Moore, IREE, p.82-84) :
// on ajoute au 2x2 une ligne et une colonne « melange » avec les gains espérés.
//   p = proba de la 1re ligne (joueur 1), q = proba de la 1re colonne (joueur 2).
// ---------------------------------------------------------------------------

// Tolerance d'affichage : deux gains espérés a moins de 0,02 sont lus « egaux »
// pour souligner. Un curseur au pas de 0,01 ne peut pas viser exactement 4/7 :
// a p = 0,57 l'ecart d'indifference vaut deja 0,01. La page l'annonce a l'etudiant.
export const EPS_EGAL = 0.02;

function gainAug(A, B, wi, wj) {
  let a = 0, b = 0;
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
    a += wi[r] * wj[c] * A[r][c];
    b += wi[r] * wj[c] * B[r][c];
  }
  return [a, b];
}

// Les 3x3 gains : lignes [pure 1, pure 2, melange], colonnes idem.
export function augmente(A, B, p, q) {
  const W = (x) => [[1, 0], [0, 1], [x, 1 - x]];
  const wr = W(p), wc = W(q);
  return [0, 1, 2].map(i => [0, 1, 2].map(j => gainAug(A, B, wr[i], wc[j])));
}

// Ecarts d'indifference : gain de la 1re minus gain de la 2e strategie pure.
export function indifference(A, B, p, q) {
  const G = augmente(A, B, p, q);
  return {
    joueur1: {pure1: G[0][2][0], pure2: G[1][2][0], ecart: G[0][2][0] - G[1][2][0]},
    joueur2: {pure1: G[2][0][1], pure2: G[2][1][1], ecart: G[2][0][1] - G[2][1][1]}
  };
}

// Equilibre mixte d'un 2x2 sans equilibre pur : poids qui rendent l'AUTRE indifferent.
export function melangeEquilibre(A, B) {
  const a0 = A[0][0] - A[1][0], a1 = A[0][1] - A[1][1];
  const b0 = B[0][0] - B[0][1], b1 = B[1][0] - B[1][1];
  return {q: -a1 / (a0 - a1), p: -b1 / (b0 - b1)};
}

const f2 = (x) => String(Math.round(x * 100) / 100).replace(".", ",").replace("-", "−");

export function augmenteTable(A, B, rowNames, colNames, p, q, {underline = true} = {}) {
  const G = augmente(A, B, p, q);
  const rn = [...rowNames, `mélange (${f2(p)} ; ${f2(1 - p)})`];
  const cn = [...colNames, `mélange (${f2(q)} ; ${f2(1 - q)})`];
  const maxCol = j => Math.max(...[0, 1, 2].map(i => G[i][j][0]));
  const maxRow = i => Math.max(...[0, 1, 2].map(j => G[i][j][1]));
  const cell = (i, j) => {
    const [a, b] = G[i][j];
    const ur = underline && a >= maxCol(j) - EPS_EGAL, uc = underline && b >= maxRow(i) - EPS_EGAL;
    const A_ = ur ? `<span style="border-bottom:2px solid ${C.indigo}">${f2(a)}</span>` : f2(a);
    const B_ = uc ? `<span style="border-bottom:2px solid ${C.crimson}">${f2(b)}</span>` : f2(b);
    const mix = (i === 2 || j === 2) ? `background:${C.cream};` : "";
    const gold = ur && uc && i === 2 && j === 2 ? `background:${C.gold}88;` : "";
    return `<td style="border:1px solid ${C.ink}33;padding:.4rem .7rem;text-align:center;white-space:nowrap;${mix}${gold}">(${A_}&nbsp;;&nbsp;${B_})</td>`;
  };
  const head = cn.map((n, j) => `<th style="padding:.3rem .7rem;text-align:center;font-weight:${j === 2 ? 400 : 600}">${n}</th>`).join("");
  const body = rn.map((n, i) => `<tr><th style="padding:.3rem .7rem;text-align:right;font-weight:${i === 2 ? 400 : 600}">${n}</th>${[0, 1, 2].map(j => cell(i, j)).join("")}</tr>`).join("");
  return `<table style="font-family:Jost,sans-serif;font-size:.92rem;border-collapse:collapse;margin:.4rem 0">
    <tr><th></th><th colspan="3" style="text-align:center;color:${C.crimson};font-weight:500">Joueur 2</th></tr>
    <tr><th style="color:${C.indigo};font-weight:500;text-align:right">Joueur 1</th>${head}</tr>${body}</table>`;
}

// ---------------------------------------------------------------------------
// Simulation du test d'egalite des taux de reussite (Walker et Wooders 2001,
// p.1524-1527) : un jeu-point = n premiers services ; le serveur sert a gauche
// avec proba theta ; il gagne le point avec proba piG (gauche) et piD (droite).
// Test du chi-deux de Pearson 2x2 (1 ddl) : egalite des deux taux.
// ---------------------------------------------------------------------------

// Generateur pseudo-aleatoire a graine (mulberry32) : tirages reproductibles.
export function alea(graine) {
  let t = graine >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function binom(rng, n, p) { let k = 0; for (let i = 0; i < n; i++) if (rng() < p) k++; return k; }

// erfc : approximation d'Abramowitz et Stegun 7.1.26 (erreur < 1,5e-7).
function erfc(x) {
  const s = x < 0 ? -1 : 1, z = Math.abs(x), t = 1 / (1 + 0.3275911 * z);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return s > 0 ? 1 - y : 1 + y;
}

// p-value du chi-deux 2x2 : gagnes/total a gauche, gagnes/total a droite.
export function chi2Egalite(wG, nG, wD, nD) {
  const N = nG + nD, W = wG + wD, L = N - W;
  if (nG === 0 || nD === 0 || W === 0 || L === 0) return 1;
  const att = [[nG * W / N, nG * L / N], [nD * W / N, nD * L / N]];
  const obs = [[wG, nG - wG], [wD, nD - wD]];
  let Q = 0;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) Q += (obs[i][j] - att[i][j]) ** 2 / att[i][j];
  return erfc(Math.sqrt(Q / 2));   // P(chi2_1 > Q) = erfc(sqrt(Q/2))
}

// Tire `jeux` jeux-points independants et renvoie leurs p-values.
export function tireJeux(rng, jeux, n, theta, piG, piD) {
  const out = [];
  for (let g = 0; g < jeux; g++) {
    const nG = binom(rng, n, theta), nD = n - nG;
    out.push(chi2Egalite(binom(rng, nG, piG), nG, binom(rng, nD, piD), nD));
  }
  return out;
}

// Repartition du nombre de rejets au seuil alpha sur `reps` repetitions de `jeux` jeux-points.
export function rejetsParTirage(graine, reps, jeux, n, theta, piG, piD, alpha) {
  const rng = alea(graine), compte = new Array(jeux + 1).fill(0);
  for (let r = 0; r < reps; r++) {
    const k = tireJeux(rng, jeux, n, theta, piG, piD).filter(v => v < alpha).length;
    compte[k]++;
  }
  return compte.map((c, k) => ({k, part: c / reps}));
}
