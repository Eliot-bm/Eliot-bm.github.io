# Regroupement des 12 niveaux DIPL en 5 classes, et comparaison immigres / natifs.
# Lit la table agregee produite par extract_rp.R (pas le fichier de 488 Mo).
# Source : Insee, recensement de la population 2021, fichier detail, Licence Ouverte 2.0.

suppressMessages({
  library(dplyr)
  library(tidyr)
})

cellules <- read.csv("C:/Eliot-bm-recherche/data/base_rp2021_cellules.csv",
                     colClasses = c(IMMI = "character", DIPL = "character"),
                     encoding = "UTF-8")

# Les libelles nomment le contenu de chaque classe : un lecteur doit savoir
# ce qu'il y a dedans sans consulter la nomenclature Insee.
# La coupure classe 1 / classe 2 est exactement la frontiere ISCED 0-2 / ISCED 3 :
# CEP et brevet restent sous le secondaire superieur, CAP-BEP y entre.
# Consequence utile : ces 6 classes se replient sur la trichotomie internationale
#   faible = 1 ; moyen = 2 + 3 ; eleve = 4 + 5 + 6
# donc la comparaison avec les trois classes de Chojnicki-Ragot reste possible.
niveaux <- c(
  "Sans diplome ou brevet (aucun, CEP, brevet)",
  "CAP-BEP",
  "Bac (general, techno ou pro)",
  "Bac+2 (BTS, DUT, sante-social)",
  "Licence-maitrise (bac+3 a bac+4)",
  "Master-doctorat (bac+5 et plus)"
)

recoder <- function(d) {
  factor(dplyr::case_when(
    d %in% c("01", "02", "03", "11", "12") ~ niveaux[1],
    d == "13"                              ~ niveaux[2],
    d %in% c("14", "15")                   ~ niveaux[3],
    d == "16"                              ~ niveaux[4],
    d == "17"                              ~ niveaux[5],
    d %in% c("18", "19")                   ~ niveaux[6]
  ), levels = niveaux)
}

comparer <- function(age_min) {
  cellules |>
    filter(age >= age_min, DIPL != "ZZ") |>
    mutate(qual = recoder(DIPL),
           origine = ifelse(IMMI == "1", "Immigres", "Natifs")) |>
    group_by(origine, qual) |>
    summarise(pop = sum(pop), .groups = "drop_last") |>
    mutate(part = round(100 * pop / sum(pop), 1)) |>
    ungroup() |>
    select(origine, qual, part) |>
    pivot_wider(names_from = origine, values_from = part) |>
    mutate(Ecart = round(Immigres - Natifs, 1))
}

for (a in c(25, 15)) {
  cat("\n=== Repartition par qualification,", a, "ans et plus (en %) ===\n")
  print(as.data.frame(comparer(a)), row.names = FALSE)
}

cat("\n=== Controle : classes non affectees ===\n")
reste <- cellules |>
  filter(age >= 15, DIPL != "ZZ") |>
  mutate(qual = recoder(DIPL)) |>
  filter(is.na(qual)) |>
  summarise(pop = sum(pop)) |>
  pull(pop)
cat("population sans classe :", reste, "\n")
