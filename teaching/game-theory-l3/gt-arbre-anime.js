// gt-arbre-anime.js — l'arbre de gt.js (treeSVG), anime avec D3.
// Graphique PILOTE du systeme de graphiques du site : il applique le theme
// (assets/js/dubois-theme.js) et les regles d'animation
// (assets/js/dubois-motion.js). Meme calcul que treeSVG : solveTree, treeStepText.
// Etape k = les noeuds de hauteur <= k sont resolus (backward induction).
import {solveTree, treeStepText} from "./gt.js";
import {animatedFigure} from "../../assets/js/dubois-motion.js";
import {brandColor, cream, ink, subtle, font, rule} from "../../assets/js/dubois-theme.js";

const num = (x) => String(x).replace("-", "−");

export function arbreAnime(d3, tree, {invalidation, titre = "Arbre du jeu", labels} = {}) {
  const t = solveTree(tree);
  // Joueurs 1, 2, 3 : memes aplats et memes chiffres que treeSVG (gt.js).
  const PCOL = {1: brandColor("plate-blue"), 2: brandColor("plate-crimson"), 3: brandColor("plate-green")};
  const PLAB = {1: cream, 2: cream, 3: ink};
  const valueInk = brandColor("green-ink");

  // --- Mise en page : identique a treeSVG ---------------------------------------
  const dx = 150, dy = 58, X0 = 36, Y0 = 34;
  let leaf = 0, maxD = 0;
  const nodes = [], edges = [];
  const place = (n, d, id, parent, action, idx) => {
    maxD = Math.max(maxD, d);
    n.id = id; n.parent = parent; n.action = action;
    if (n.pay) n.y = Y0 + dy * leaf++;
    else {
      n.kids.forEach((k, i) => place(k.n, d + 1, `${id}.${i}`, n, k.a, i));
      n.y = n.kids.reduce((s, k) => s + k.n.y, 0) / n.kids.length;
    }
    n.x = X0 + dx * d;
    nodes.push(n);
    if (parent) edges.push({from: parent, to: n, a: action, i: idx});
  };
  place(t, 0, "r", null, null, 0);
  const W = X0 + dx * maxD + 120, H = Y0 * 2 + dy * (leaf - 1);
  const frames = t.h + 1;
  const nDecision = nodes.filter(n => !n.pay).length;

  // --- Donnees telechargeables : une ligne par noeud -------------------------------
  const nPlayers = nodes.find(n => n.pay).pay.length;
  const rows = nodes.slice().sort((a, b) => a.id.localeCompare(b.id, undefined, {numeric: true})).map(n => {
    const r = {
      node_id: n.id, parent_id: n.parent ? n.parent.id : "",
      action_from_parent: n.action ?? "", player: n.pay ? "" : n.who, is_leaf: n.pay ? 1 : 0
    };
    for (let p = 0; p < nPlayers; p++) r[`payoff_${p + 1}`] = n.pay ? n.pay[p] : "";
    for (let p = 0; p < nPlayers; p++) r[`value_${p + 1}`] = n.val[p];
    r.chosen_by_parent = n.parent ? (n.parent.kids[n.parent.best].n === n ? 1 : 0) : "";
    r.tie_at_parent = n.parent ? (n.parent.tie ? 1 : 0) : "";
    r.resolved_at_step = n.parent ? n.parent.h : "";
    return r;
  });

  const alt = (k) =>
    `${titre}. Arbre à ${nDecision} nœuds de décision et ${leaf} issues finales. ` +
    `Étape ${k} sur ${t.h}. ${treeStepText(tree, k)}`;

  return animatedFigure({
    d3, invalidation, width: W, height: H, frames, alt, labels,
    caption: (k) => treeStepText(tree, k),
    csv: {filename: "arbre-backward-induction.csv", rows},
    mount(svg) {
      svg.style("font-family", font.family);

      // Zones de liaison entre noeuds d'un meme ensemble d'information : absentes
      // ici (arbre resoluble), voir treeSVG si un jour un tel arbre est anime.
      const eg = svg.selectAll("g.arete").data(edges).join("g").attr("class", "arete");
      const len = (e) => Math.hypot(e.to.x - e.from.x, e.to.y - e.from.y);

      eg.append("line").attr("class", "base")
        .attr("x1", e => e.from.x).attr("y1", e => e.from.y)
        .attr("x2", e => e.to.x).attr("y2", e => e.to.y)
        .attr("stroke", ink).attr("stroke-width", rule.line);
      // Le trait choisi se dessine du noeud vers l'issue.
      eg.append("line").attr("class", "choisie")
        .attr("x1", e => e.from.x).attr("y1", e => e.from.y)
        .attr("x2", e => e.to.x).attr("y2", e => e.to.y)
        .attr("stroke", brandColor("plate-crimson")).attr("stroke-width", 3.4)
        .attr("stroke-dasharray", e => len(e)).attr("stroke-dashoffset", e => len(e));
      eg.append("text").attr("class", "etiquette")
        .attr("x", e => e.from.x + (e.to.x - e.from.x) * 0.52)
        .attr("y", e => e.from.y + (e.to.y - e.from.y) * 0.52 - 7)
        .attr("text-anchor", "middle").attr("font-size", 12.5).attr("fill", ink)
        .style("paint-order", "stroke").style("stroke", cream).style("stroke-width", "4px")
        .text(e => e.a);

      const dec = nodes.filter(n => !n.pay);
      svg.selectAll("circle.noeud").data(dec).join("circle").attr("class", "noeud")
        .attr("cx", n => n.x).attr("cy", n => n.y).attr("r", 14).attr("fill", n => PCOL[n.who]);
      svg.selectAll("text.joueur").data(dec).join("text").attr("class", "joueur")
        .attr("x", n => n.x).attr("y", n => n.y + 6.5).attr("text-anchor", "middle")
        .attr("font-size", 19).attr("font-weight", 600).attr("fill", n => PLAB[n.who]).text(n => n.who);
      svg.selectAll("text.gain").data(nodes.filter(n => n.pay)).join("text").attr("class", "gain")
        .attr("x", n => n.x + 10).attr("y", n => n.y + 4.5).attr("font-size", 14).attr("fill", ink)
        .text(n => `(${n.pay.map(num).join(" ; ")})`);
      const val = svg.selectAll("text.valeur").data(dec).join("text").attr("class", "valeur")
        .attr("x", n => n.x).attr("y", n => n.y - 20).attr("text-anchor", "middle")
        .attr("font-size", 12.5).attr("font-weight", 600).attr("fill", valueInk)
        .style("paint-order", "stroke").style("stroke", cream).style("stroke-width", "4px")
        .attr("opacity", 0).text(n => `↦ (${n.val.map(num).join(" ; ")})`);

      // Etape k, en ms millisecondes (0 = instantane).
      return (k, ms) => {
        const tr = (sel) => (ms ? sel.transition().duration(ms) : sel.interrupt());
        const resolved = (e) => e.from.h <= k;
        const chosen = (e) => resolved(e) && e.from.best === e.i;
        const rejected = (e) => resolved(e) && !chosen(e);

        // Traits ecartes : pointilles tout de suite, estompes en douceur.
        tr(eg.select("line.base").attr("stroke-dasharray", e => (rejected(e) ? "4,4" : null)))
          .attr("stroke-opacity", e => (rejected(e) ? 0.35 : 1));
        tr(eg.select("line.choisie"))
          .attr("stroke-dashoffset", e => (chosen(e) ? 0 : len(e)));
        tr(eg.select("text.etiquette"))
          .attr("fill", e => (rejected(e) ? subtle : ink));
        tr(val).attr("opacity", n => (n.h <= k ? 1 : 0));
      };
    }
  });
}
