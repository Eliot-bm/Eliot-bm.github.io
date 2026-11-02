// dubois-theme.js
// ------------------------------------------------------------------------------
// Theme des graphiques OJS (Observable Plot et D3). Jumeau de R/theme_dubois.R :
// memes couleurs, memes principes (aplats sans contour, grille horizontale
// seulement, pas de graduations, peu d'elements, filets fins).
//
// UNE SEULE SOURCE DE COULEUR : _brand.yml. Quarto en tire des variables CSS
// --brand-* ; ce fichier les lit. Aucun hexadecimal ici. Si une couleur manque,
// on leve une erreur qui nomme la variable, plutot que d'afficher un graphique
// faux sans le dire.
//
// Usage dans un .qmd :
//   ```{ojs}
//   import {plotOptions, categorical} from "../assets/js/dubois-theme.js"
//   Plot.plot({...plotOptions(), marks: [Plot.barY(d, {x: "grp", y: "v", fill: "grp"})]})
//   ```
// Le chemin est relatif a la page. Pour un graphique D3 (avec animation), voir
// aussi dubois-motion.js.
// ------------------------------------------------------------------------------

// Lit --brand-<nom> sur la page. `nom` = une cle de _brand.yml.
export function brandColor(nom) {
  const v = typeof document === "undefined" ? "" :
    getComputedStyle(document.documentElement).getPropertyValue(`--brand-${nom}`).trim();
  if (!v) throw new Error(`dubois-theme : la variable --brand-${nom} manque (voir _brand.yml)`);
  return v;
}

// --- La palette : meme ordre que dubois_colors dans theme_dubois.R -----------
// Crimson d'abord (categorie focale), puis par discriminabilite decroissante.
// Au-dela de 5 categories, regroupe : cinq couleurs est une contrainte voulue.
const ORDRE = ["crimson", "blue", "gold", "green", "brown", "purple", "pink"];

export const palette = Object.fromEntries(ORDRE.map(n => [n, brandColor(`plate-${n}`)]));
export const categorical = ORDRE.map(n => palette[n]);

// --- Fonds, encre, texte ------------------------------------------------------
export const ink = brandColor("ink");
export const paper = brandColor("paper");
export const cream = brandColor("cream");      // fond des figures et widgets
export const tan = brandColor("plate-tan");    // le fond reel des planches
export const sheet = brandColor("plate-sheet");
export const subtle = brandColor("plate-brown");   // sous-titres, legendes (comme R)

// Texte : toujours l'encre (AA sur tous les fonds ci-dessus). Un texte ne prend
// JAMAIS la couleur d'une serie : crimson (4,38:1) et gold (< 2:1) ne passent
// pas AA sur le papier.
export const font = {family: "Jost, sans-serif", size: 12};

// Filets : fins. Epaisseurs en pixels, a reprendre dans le code D3.
export const rule = {hairline: 0.6, thin: 1, line: 1.5};

// {fontSize: "12px"} -> "font-size:12px;"
const cssText = (o) => Object.entries(o)
  .map(([k, v]) => `${k.startsWith("--") ? k : k.replace(/[A-Z]/g, c => "-" + c.toLowerCase())}:${v};`).join("");

// --- Options Observable Plot --------------------------------------------------
// plate = true : fond tan des planches (comme theme_dubois(plate = TRUE)).
// Sinon fond creme, celui des autres figures du site.
// `extra` est fusionne par-dessus ; x et y sont fusionnes champ par champ.
export function plotOptions({plate = false, ...extra} = {}) {
  const {x = {}, y = {}, style = {}, color = {}, ...rest} = extra;
  return {
    // Le runtime OJS de Quarto remet `background: none` en ligne sur chaque
    // graphique Plot (bug Quarto 7426) : un fond pose ici serait efface. On passe
    // donc la couleur par une variable que styles.scss applique (.cell-output-display
    // svg[class*="plot-"]). backgroundColor reste pose pour Plot hors d'une cellule OJS.
    // Plot ne pose une propriete personnalisee (--x) que si `style` est une chaine.
    style: cssText({
      backgroundColor: plate ? tan : cream, "--figure-ground": plate ? tan : cream,
      color: ink, fontFamily: font.family, fontSize: `${font.size}px`
    }) + (typeof style === "string" ? style : cssText(style)),
    color: {range: categorical, ...color},
    // Grille horizontale seulement, tres discrete ; aucune graduation.
    x: {grid: false, tickSize: 0, ...x},
    y: {grid: true, tickSize: 0, ...y},
    marginTop: 24, marginRight: 16, marginBottom: 32, marginLeft: 44,
    ...rest
  };
}

// Reglages de marques : aplats sans contour. A etaler dans la marque :
//   Plot.dot(d, {x: "a", y: "b", ...flat})
export const flat = {stroke: "none"};
