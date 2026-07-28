# theme_dubois.R
# ------------------------------------------------------------------------------
# Palette et theme ggplot2 d'apres les data portraits realises par W.E.B.
# Du Bois ET son equipe d'etudiants d'Atlanta pour l'Exposition de Paris, 1900.
#
# Les valeurs ci-dessous sont les valeurs AUTHENTIQUES documentees, pas une
# version adoucie. Choix assume : l'interface du site est desaturee (voir
# _brand.yml), les figures gardent l'audace d'origine.
#
# Le but : chaque figure de chaque papier, slide et note sort avec la meme
# signature, sans que tu y repenses.
#
# Usage :
#   source("R/theme_dubois.R")
#   ggplot(d, aes(x, y, fill = grp)) + geom_col() +
#     scale_fill_dubois() + theme_dubois()
# ------------------------------------------------------------------------------

library(ggplot2)

# --- La palette ---------------------------------------------------------------
# Ordre volontaire : crimson d'abord (categorie focale), umber en dernier.
# Ordre volontaire : crimson d'abord (categorie focale), puis par
# discriminabilite decroissante. Les deux dernieres sont des extensions,
# a n'utiliser que si tu as vraiment 6 ou 7 categories -- ce qui est
# presque toujours le signe qu'il faut regrouper.
dubois_colors <- c(
  crimson = "#DC143C",
  blue    = "#4682B4",
  gold    = "#FFD700",
  green   = "#00AA00",
  brown   = "#654321",
  purple  = "#7E6583",
  pink    = "#FFC0CB"
)

dubois_ground <- "#D2B48C"   # tan : le fond reel des planches
dubois_ink    <- "#1A1A1A"

# --- Les echelles -------------------------------------------------------------
# Fonctions d'echelle discretes. Au-dela de 5 categories, arrete-toi et
# regroupe : cinq couleurs est une contrainte, pas une limite technique.
#
# AVERTISSEMENT sur la grammaire ISOTYPE (glyphes repetes plutot que barres) :
# la litterature critique montre qu'elle oblige le lecteur a compter les
# symboles puis a multiplier par l'echelle, et que la mémoire de travail
# decroche au-dela de ~7 symboles. Conclusion : glyphes pour un post de blog
# ou une slide grand public, barres et points pour une figure de papier.
# Ne confonds pas "frappant" et "lisible au dixieme".
scale_fill_dubois <- function(...) {
  scale_fill_manual(values = unname(dubois_colors), ...)
}

scale_colour_dubois <- function(...) {
  scale_colour_manual(values = unname(dubois_colors), ...)
}
scale_color_dubois <- scale_colour_dubois

# --- Le theme -----------------------------------------------------------------
# Principes : aplats, pas de degrade, pas de grille verticale, titre en
# capitales espacees comme un cartouche de planche.
#
# Note sur la police : Jost doit etre installee localement pour le rendu R.
#   install.packages("showtext")
#   showtext::font_add_google("Jost", "Jost")
#   showtext::showtext_auto()
# Sans ca, le theme retombe sur la sans-serif du systeme, ce qui reste correct.
theme_dubois <- function(base_size = 12, base_family = "Jost",
                         plate = TRUE) {

  bg <- if (plate) dubois_ground else "white"

  theme_minimal(base_size = base_size, base_family = base_family) +
    theme(
      # Fond : la planche creme, ou blanc si la figure part dans un PDF
      plot.background  = element_rect(fill = bg, colour = NA),
      panel.background = element_rect(fill = bg, colour = NA),

      # Grille : horizontale seulement, tres discrete. Rien de vertical.
      panel.grid.major.y = element_line(colour = dubois_ink, linewidth = 0.15),
      panel.grid.major.x = element_blank(),
      panel.grid.minor   = element_blank(),

      # Titre en cartouche
      plot.title = element_text(
        size = rel(1.05), face = "plain", colour = dubois_ink,
        margin = margin(b = 6)
      ),
      plot.subtitle = element_text(
        size = rel(0.85), colour = "#654321", margin = margin(b = 12)
      ),
      plot.caption = element_text(
        size = rel(0.7), colour = "#654321", hjust = 0
      ),

      # Axes : sobres, sans encadrement
      axis.title = element_text(size = rel(0.85), colour = dubois_ink),
      axis.text  = element_text(size = rel(0.8),  colour = dubois_ink),
      axis.ticks = element_blank(),

      # Legende en haut a gauche : elle se lit avant la figure
      legend.position  = "top",
      legend.direction = "horizontal",
      legend.justification = "left",
      legend.title = element_text(size = rel(0.8)),
      legend.text  = element_text(size = rel(0.8)),

      plot.margin = margin(16, 16, 12, 16),
      plot.title.position = "plot"
    )
}

# ==============================================================================
# VERSION PAPIER  --  NBER / revue
# ==============================================================================
# Regle : la mise en page d'un papier suit le template de la revue, jamais ton
# identite. Les figures aussi. theme_paper() est donc volontairement neutre.
#
# Usage :
#   p <- ggplot(d, aes(x, y)) + geom_line()   # geometrie ecrite UNE fois
#   ggsave("fig-web.png",   p + theme_dubois())
#   ggsave("fig-paper.pdf", p + theme_paper())

theme_paper <- function(base_size = 10, base_family = "sans") {
  theme_classic(base_size = base_size, base_family = base_family) +
    theme(
      plot.background  = element_rect(fill = "white", colour = NA),
      panel.background = element_rect(fill = "white", colour = NA),

      # Aucune grille. Convention en economie appliquee.
      panel.grid = element_blank(),

      # Axes noirs, fins, avec graduations : le lecteur doit pouvoir lire
      # une valeur au dixieme.
      axis.line  = element_line(colour = "black", linewidth = 0.3),
      axis.ticks = element_line(colour = "black", linewidth = 0.3),
      axis.text  = element_text(colour = "black", size = rel(0.95)),
      axis.title = element_text(colour = "black", size = rel(1)),

      # Pas de titre dans la figure : la legende du papier le porte (\caption).
      plot.title = element_blank(),
      plot.subtitle = element_blank(),

      legend.position   = c(0.98, 0.98),
      legend.justification = c(1, 1),
      legend.background = element_rect(fill = "white", colour = "black",
                                       linewidth = 0.2),
      legend.title      = element_blank(),
      legend.key.size   = unit(0.8, "lines"),

      plot.margin = margin(4, 6, 4, 4)
    )
}

# --- Echelles sures en niveaux de gris ----------------------------------------
# Luminances volontairement espacees, pour que la figure reste lisible
# imprimee en noir et blanc. Verifie : convertis en gris avant de soumettre.
paper_greys <- c("#000000", "#606060", "#A8A8A8", "#D4D4D4")

scale_colour_paper <- function(...) scale_colour_manual(values = paper_greys, ...)
scale_color_paper  <- scale_colour_paper
scale_fill_paper   <- function(...) scale_fill_manual(values = paper_greys, ...)

# IMPORTANT : dans un papier, encode la categorie par le TRAIT ou la FORME,
# pas par la couleur. La couleur est un renfort, jamais le porteur du signal.
#
#   geom_line(aes(linetype = group))     # plein / pointille / tirete
#   geom_point(aes(shape = group))       # cercle / triangle / carre
#
# Raison : crimson, indigo et umber ont des luminances proches (0.25 a 0.32).
# En noir et blanc, ils deviennent trois gris identiques.

# --- Reglage global optionnel -------------------------------------------------
# Decommente pour appliquer le theme a TOUTES les figures de la session.
# theme_set(theme_dubois())
