# Ratio de dependance demographique, projections Insee 2026, par variante migratoire.
#
# Definition retenue : 65 ans et plus / 15-64 ans.
# Attention : l'Insee publie son propre ratio en 65+/20-64 (onglet population,
# ligne "rapport de dependance demographique"). Les deux ne sont pas comparables.
# On recalcule donc depuis les ages fins, et on valide de deux facons :
#   1. somme des ages fins == ligne "ensemble" publiee ;
#   2. notre 65+/20-64 recalcule == ratio publie par l'Insee.
#
# Source : Insee, projections de population 2026-2070, Licence Ouverte 2.0.

suppressMessages({
  library(readxl)
  library(dplyr)
})

racine <- "C:/Eliot-bm-recherche/data"

scenarios <- tibble::tribble(
  ~fichier,                        ~scenario,
  "00_central.xlsx",               "Central (+150,000 a year)",
  "variants/15_smi_haut.xlsx",     "High migration (+230,000 a year)",
  "variants/16_smi_bas.xlsx",      "Low migration (+70,000 a year)"
)

lire_population <- function(chemin) {
  x <- read_excel(chemin, sheet = "population", col_names = FALSE,
                  .name_repair = "minimal")
  annees <- suppressWarnings(as.integer(as.character(x[2, ])))
  col1 <- as.character(x[[1]])

  # Bloc des ages fins : suite contigue de libelles entierement numeriques,
  # a partir de la ligne 3.
  est_age <- !is.na(col1) & grepl("^[0-9]+$", col1)
  premiere <- 3
  derniere <- premiere
  while (derniere + 1 <= length(col1) && est_age[derniere + 1]) derniere <- derniere + 1
  stopifnot(est_age[premiere], derniere > premiere)

  ages <- as.integer(col1[premiere:derniere])
  valeurs <- x[premiere:derniere, ]
  ligne_ensemble <- which(col1 == "ensemble")[1]

  list(
    ages = ages,
    mat = sapply(seq_along(annees), function(j) {
      if (is.na(annees[j])) return(rep(NA_real_, length(ages)))
      as.numeric(unlist(valeurs[, j]))
    }),
    annees = annees,
    ensemble = as.numeric(unlist(x[ligne_ensemble, ])),
    publie = as.numeric(unlist(x[which(grepl("^rapport de d", col1))[1], ]))
  )
}

resultats <- lapply(seq_len(nrow(scenarios)), function(i) {
  p <- lire_population(file.path(racine, scenarios$fichier[i]))
  ok <- !is.na(p$annees)
  j <- which(ok)

  total   <- colSums(p$mat[, j, drop = FALSE], na.rm = TRUE)
  p65     <- colSums(p$mat[p$ages >= 65, j, drop = FALSE], na.rm = TRUE)
  a15_64  <- colSums(p$mat[p$ages >= 15 & p$ages <= 64, j, drop = FALSE], na.rm = TRUE)
  a20_64  <- colSums(p$mat[p$ages >= 20 & p$ages <= 64, j, drop = FALSE], na.rm = TRUE)

  # Validation 1 : total recalcule contre la ligne "ensemble" publiee.
  ecart_total <- max(abs(total - p$ensemble[j]) / p$ensemble[j], na.rm = TRUE)
  # Validation 2 : notre 65+/20-64 contre le ratio publie par l'Insee.
  ecart_ratio <- max(abs(100 * p65 / a20_64 - p$publie[j]), na.rm = TRUE)

  cat(sprintf("%-34s ecart total %.3g %%   ecart ratio Insee %.3g pt\n",
              scenarios$scenario[i], 100 * ecart_total, ecart_ratio))

  tibble::tibble(
    scenario = scenarios$scenario[i],
    year     = p$annees[j],
    ratio    = round(100 * p65 / a15_64, 2)
  )
}) |> bind_rows()

sortie <- resultats |>
  filter(year >= 2000, year <= 2070) |>
  arrange(scenario, year)

dest <- "C:/Eliot-bm.github.io/notes/posts/data/dependency.csv"
write.csv(sortie, dest, row.names = FALSE, fileEncoding = "UTF-8")

cat("\necrit :", dest, "-", nrow(sortie), "lignes\n\n")
sortie |>
  filter(year %in% c(2025, 2050, 2070)) |>
  tidyr::pivot_wider(names_from = year, values_from = ratio) |>
  as.data.frame() |>
  print(row.names = FALSE)
