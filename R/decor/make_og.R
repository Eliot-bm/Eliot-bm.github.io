# Image de partage par defaut (carte Open Graph / X / LinkedIn), 1200 x 630.
# DECORATION SEULE : des aplats sans contour, aucune donnee, aucun axe.
# Les couleurs viennent de _brand.yml. Le texte reprend title, subtitle et
# description de _quarto.yml / index.qmd : si l'un change, relancer ce script.
#
# Lancer depuis la racine du depot :
#   Rscript R/decor/make_og.R
# Sortie : assets/og-default.png, commitee (le CI n'installe pas R).

suppressMessages(library(rsvg))

brand <- readLines("_brand.yml", warn = FALSE)
couleur <- function(nom) {
  l <- grep(paste0("^\\s+", nom, ":\\s"), brand, value = TRUE)
  stopifnot(length(l) == 1)
  sub(".*\"(#[0-9A-Fa-f]{6})\".*", "\\1", l)
}
PAPIER <- couleur("paper"); ENCRE <- couleur("ink"); UMBRE <- couleur("umber")
ROUGE <- couleur("crimson"); OR <- couleur("gold"); INDIGO <- couleur("indigo")
OLIVE <- couleur("olive")

svg <- sprintf('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="%s"/>
  <rect width="1200" height="14" fill="%s"/>
  <rect y="616" width="1200" height="14" fill="%s"/>
  <!-- aplats decoratifs, a droite -->
  <rect x="900" y="110" width="50" height="410" fill="%s"/>
  <rect x="950" y="230" width="50" height="290" fill="%s"/>
  <rect x="1000" y="170" width="50" height="350" fill="%s"/>
  <rect x="1050" y="310" width="50" height="210" fill="%s"/>
  <rect x="1100" y="260" width="50" height="260" fill="%s"/>
  <rect x="900" y="520" width="250" height="3" fill="%s"/>
  <!-- texte -->
  <text x="70" y="270" font-family="Georgia, serif" font-size="72" fill="%s">Eliot Bochet-Merand</text>
  <text x="70" y="340" font-family="Arial, sans-serif" font-size="28" letter-spacing="4" fill="%s">PHD CANDIDATE IN ECONOMICS</text>
  <text x="70" y="400" font-family="Arial, sans-serif" font-size="28" letter-spacing="4" fill="%s">PARIS NANTERRE UNIVERSITY</text>
  <rect x="70" y="450" width="120" height="6" fill="%s"/>
  <text x="70" y="520" font-family="Georgia, serif" font-size="32" fill="%s">Economics of immigration and technical change</text>
</svg>', PAPIER, ENCRE, ENCRE, ROUGE, OR, INDIGO, OLIVE, UMBRE, ENCRE,
  ENCRE, UMBRE, UMBRE, ROUGE, ENCRE)

rsvg_png(charToRaw(svg), "assets/og-default.png", width = 1200, height = 630)
cat("ecrit : assets/og-default.png\n")
