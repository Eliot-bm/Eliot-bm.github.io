# Figures decoratives du site, d'apres les planches de Du Bois et de son equipe
# (Paris, 1900) : aplats sans contour, peu d'elements, vraies donnees Insee.
# DECORATION SEULE : pas d'axes ni de legende dans la page.
#
#   arcs    : Insee Premiere n. 2107, Figure 3, entrees d'immigres en 2024,
#             huit origines. Longueur de l'arc proportionnelle aux entrees.
#   disques : notes/posts/data/dependency.csv, ratio de dependance 65+/15-64,
#             scenario central, 2000, 2030, 2070. Rayon proportionnel au ratio.
#             Les lames dechirees ne portent aucune donnee.
#   ruban   : Insee Premiere n. 2107, Figures 2a et 2b, entrees cumulees depuis
#             2006, immigres (gauche) et non-immigres (droite). Largeur
#             proportionnelle. Flux bruts cumules, pas un stock. Entrees 2020
#             estimees par l'Insee ; champ hors Mayotte jusqu'en 2013. Le fondu
#             brun ne porte aucune donnee.
# Licence Ouverte 2.0 (Insee).
#
# Lancer depuis la racine du depot :
#   Rscript R/decor/make_motifs.R
# Sortie : assets/decor/*.webp, commitees (le CI n'installe pas R). Les filtres de
# peinture sont figes dans ces images : le navigateur n'a rien a calculer.
# Les couleurs viennent de _brand.yml.

racine <- Sys.getenv("EBM_DATA", "C:/Eliot-bm-recherche/data")
sortie <- "assets/decor"
largeur_px <- 800
suppressMessages({library(readxl); library(rsvg)})

r1 <- function(x) formatC(x, format = "f", digits = 1)
pts <- function(x, y) paste(r1(x), r1(y), sep = ",", collapse = " L")
chemin <- function(x, y) paste0("M", pts(x, y), "Z")

brand <- readLines("_brand.yml", warn = FALSE)
couleur <- function(nom) {
  l <- grep(paste0("^\\s+", nom, ":\\s"), brand, value = TRUE)
  stopifnot(length(l) == 1)
  sub(".*\"(#[0-9A-Fa-f]{6})\".*", "\\1", l)
}
NOIR <- couleur("plate-black");  BRUN <- couleur("plate-brown"); TAN <- couleur("plate-tan")
OR   <- couleur("plate-gold");   ROSE <- couleur("plate-pink");  ROUGE <- couleur("plate-crimson")
BLEU <- couleur("plate-blue");   FEUILLE <- couleur("plate-sheet")

# ---- Donnees ----
fig3 <- read_excel(file.path(racine, "flux_migratoires_IP2107.xlsx"),
                   sheet = "Figure 3", range = "A5:B22", col_names = FALSE)
names(fig3) <- c("origine", "n")
fig3$n <- suppressWarnings(as.numeric(fig3$n))
detail <- c("Maghreb", "Autres pays d'Afrique", "Turquie, Moyen-Orient", "Autres pays d'Asie",
            "Espagne, Italie, Portugal", "Autres pays de l'UE27", "Autres pays d'Europe",
            "Am\u00e9rique, Oc\u00e9anie")
fig3 <- fig3[fig3$origine %in% detail, ]
stopifnot(nrow(fig3) == 8, abs(sum(fig3$n) - 313) <= 3)
n_orig <- sort(fig3$n)

entrees <- function(feuille) {
  d <- read_excel(file.path(racine, "flux_migratoires_IP2107.xlsx"),
                  sheet = feuille, range = "A4:B22", col_names = FALSE)
  names(d) <- c("annee", "n")
  d$annee <- as.integer(sub("e", "", d$annee))
  stopifnot(nrow(d) == 19, d$annee[1] == 2006, d$annee[19] == 2024)
  d
}
imm <- entrees("Figure 2a"); non <- entrees("Figure 2b")
stopifnot(imm$n[imm$annee == 2022] == 375, non$n[non$annee == 2022] == 115)
imm$cumul <- cumsum(imm$n); non$cumul <- cumsum(non$n)

dep <- read.csv("notes/posts/data/dependency.csv", encoding = "UTF-8")
dep <- dep[grepl("^Central", dep$scenario), ]
ratio <- function(an) dep$ratio[dep$year == an]
stopifnot(ratio(2000) == 24.31, ratio(2070) == 56.71)

# ---- Filtres de peinture ----
filtres <- paste0(
  "<filter id='gouache' x='-5%' y='-5%' width='110%' height='110%' color-interpolation-filters='sRGB'>",
  "<feTurbulence type='fractalNoise' baseFrequency='.04' numOctaves='3' seed='4' result='bord'/>",
  "<feDisplacementMap in='SourceGraphic' in2='bord' scale='2.6' xChannelSelector='R' yChannelSelector='G' result='peint'/>",
  "<feTurbulence type='fractalNoise' baseFrequency='.012 .22' numOctaves='3' seed='11' result='trait'/>",
  "<feColorMatrix in='trait' type='matrix' values='0 0 0 0 .96  0 0 0 0 .93  0 0 0 0 .88  .38 0 0 0 -.14' result='voile'/>",
  "<feComposite in='voile' in2='peint' operator='in' result='lavis'/>",
  "<feMerge><feMergeNode in='peint'/><feMergeNode in='lavis'/></feMerge></filter>",
  "<filter id='dechire' x='-3%' y='-3%' width='106%' height='106%'>",
  "<feTurbulence type='fractalNoise' baseFrequency='.05' numOctaves='4' seed='9' result='n'/>",
  "<feDisplacementMap in='SourceGraphic' in2='n' scale='7' xChannelSelector='R' yChannelSelector='G'/></filter>")
peint <- function(corps) sprintf("<g filter='url(#gouache)'>%s</g>", corps)
planche <- function(corps, defs = "") sprintf(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 640'><defs>%s%s</defs>%s</svg>",
  filtres, defs, corps)

# ---- Arcs : spirales partant de midi, sens horaire, comme sur la couverture ----
spirale <- function(cx, cy, r0, pas, deg) {
  t <- seq(0, deg, length.out = max(8, deg %/% 2) + 1) * pi / 180
  r <- r0 - pas * t / (2 * pi)
  paste0("M", pts(cx + r * sin(t), cy - r * cos(t)))
}
arcs <- function() {
  cx <- 262; cy <- 345; ecart <- 13.5; haut <- 235; pas <- 3.6 * ecart
  teintes <- c(ROSE, BLEU, TAN, BRUN, BLEU, TAN, OR, ROUGE)
  corps <- ""
  for (i in seq_along(n_orig)) {
    r0  <- haut - (i - 1) * ecart
    deg <- 590 * n_orig[i] / max(n_orig)
    if (i >= 7) corps <- paste0(corps, sprintf(   # filet de crayon, sans donnee
      "<path d='%s' fill='none' stroke='%s' stroke-width='.7' opacity='.55'/>",
      spirale(cx, cy, r0, pas, deg + 62), BRUN))
    corps <- paste0(corps, sprintf("<path d='%s' fill='none' stroke='%s' stroke-width='7.5'/>",
                                   spirale(cx, cy, r0, pas, deg), teintes[i]))
  }
  planche(peint(corps))
}

# ---- Disques : rayon proportionnel au ratio, lames dentelees ----
polaire <- function(cx, cy, r, deg) list(x = cx + r * sin(deg * pi / 180),
                                         y = cy - r * cos(deg * pi / 180))
lame <- function(cx, cy, ang, ouv, r_base, r_pointe, dents = 9) {
  bord <- function(cote) {
    f <- (0:dents) / dents
    r <- r_base + (r_pointe - r_base) * f
    dent <- ifelse(0:dents %% 2 == 1, 1, -1) * (1.2 + 1.6 * f) * runif(dents + 1, .5, 1.25) / pmax(r, 1) * 57.3
    dent[c(1, dents + 1)] <- 0
    polaire(cx, cy, r, ang + cote * ouv * (1 - f) + dent)
  }
  g <- bord(-1); d <- bord(1)
  chemin(c(g$x, rev(d$x)), c(g$y, rev(d$y)))
}
feuille <- function() {
  haut <- seq(16, 485, 22);  dr <- seq(18, 625, 22)
  bas  <- seq(474, 21, -22); ga <- seq(620, 17, -22)
  x <- c(16, 30, haut[-1], 470, 488, 488 + runif(length(dr) - 3, -3, 2), 470,
         bas[-1], 12 + runif(length(ga) - 1, -2, 3))
  y <- c(12, 14, 12 + runif(length(haut) - 1, -2, 2), 14, 34, dr[2:(length(dr) - 2)], 628,
         628 + runif(length(bas) - 1, -3, 2), ga[-1])
  sprintf("<path d='%s' fill='%s' filter='url(#dechire)'/>", chemin(x, y), FEUILLE)
}
disques <- function() {
  set.seed(1900)
  cx <- 250; cy <- 322; k <- 3.2
  r00 <- ratio(2000) * k; r30 <- ratio(2030) * k; r70 <- ratio(2070) * k
  disque <- function(r, teinte, extra = "") sprintf(
    "<circle cx='%d' cy='%d' r='%s' fill='%s'%s/>", cx, cy, r1(r), teinte, extra)
  corps <- paste0(
    disque(r70 + 13, "none", sprintf(" stroke='%s' stroke-width='5.5'", ROUGE)),
    disque(r70 + 5, TAN, " opacity='.55'"),
    disque(r70, OR), disque(r30, BLEU), disque(r00 + 7, TAN), disque(r00, NOIR))
  lames <- list(                 # angle, demi-ouverture, base, pointe, teinte
    list(322, 11, r70 + 13, r30 - 30, ROUGE),
    list(34,  11, r70 + 10, r30 - 34, FEUILLE),
    list(97,  15, r30 + 8,  r00 - 28, OR),
    list(152, 18, r00 + 26, r00 - 26, BLEU),
    list(246, 24, r00 + 7,  r00 - 30, TAN))
  for (l in lames) corps <- paste0(corps, sprintf(
    "<path d='%s' fill='%s'/>", lame(cx, cy, l[[1]], l[[2]], l[[3]], l[[4]]), l[[5]]))
  planche(paste0(feuille(), peint(corps)))
}

# ---- Ruban : axe penche, immigres a gauche, non-immigres a droite ----
ruban <- function() {
  n <- nrow(imm); f <- (imm$annee - 2006) / 18
  y <- 38 + 568 * f
  axe <- 318 + 36 * f
  u <- 300 / imm$cumul[n]
  g <- axe - imm$cumul * u; b <- axe - .2 * imm$cumul * u; d <- axe + non$cumul * u
  filets <- paste(sprintf(
    "<line x1='0' x2='500' y1='%1$s' y2='%1$s' stroke='%2$s' stroke-width='.6' opacity='.6'/>",
    r1(y[imm$annee %in% c(2006, 2012, 2018, 2024)]), BRUN), collapse = "")
  defs <- sprintf(paste0(
    "<linearGradient id='fondu' gradientUnits='userSpaceOnUse' x1='330' x2='470'>",
    "<stop offset='0' stop-color='%1$s'/><stop offset='.3' stop-color='%1$s'/>",
    "<stop offset='1' stop-color='%1$s' stop-opacity='0'/></linearGradient>",
    "<linearGradient id='brun'><stop offset='0' stop-color='%2$s'/>",
    "<stop offset='.85' stop-color='%3$s'/></linearGradient>"), OR, NOIR, BRUN)
  planche(paste0(filets, peint(paste0(
    sprintf("<path d='%s' fill='url(#fondu)'/>", chemin(c(axe, rev(d)), c(y, rev(y)))),
    sprintf("<path d='%s' fill='%s'/>", chemin(c(g, rev(axe)), c(y, rev(y))), NOIR),
    sprintf("<path d='%s' fill='url(#brun)'/>", chemin(c(b, rev(axe)), c(y, rev(y))))))), defs)
}

# ---- Ecriture ----
dir.create(sortie, showWarnings = FALSE, recursive = TRUE)
for (nom in c("arcs", "disques", "ruban")) {
  svg <- tempfile(fileext = ".svg")
  writeLines(get(nom)(), svg)
  fichier <- file.path(sortie, paste0(nom, ".webp"))
  rsvg_webp(svg, fichier, width = largeur_px)
  cat("ecrit :", fichier, file.size(fichier) %/% 1024, "Ko\n")
}
