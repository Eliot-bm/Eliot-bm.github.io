# Extraction de la population de base par cellule, RP2021 (fichier detail INDCVI).
# Sortie : table agregee IMMI x AGED x SEXE x DIPL x METRODOM, ponderee par IPONDI.
# Les 12 niveaux de DIPL sont conserves bruts : tout regroupement se fait en aval.
# Source : Insee, recensement de la population 2021, fichier detail, Licence Ouverte 2.0.

suppressMessages({
  library(arrow)
  library(dplyr)
})

src <- "C:/Eliot-bm-recherche/data/RP2021_indcvi.parquet"
out <- "C:/Eliot-bm-recherche/data/base_rp2021_cellules.csv"

cellules <- open_dataset(src) |>
  select(IMMI, AGED, SEXE, DIPL, METRODOM, IPONDI) |>
  group_by(IMMI, AGED, SEXE, DIPL, METRODOM) |>
  summarise(pop = sum(IPONDI, na.rm = TRUE), .groups = "drop") |>
  collect() |>
  mutate(age = as.integer(AGED)) |>
  select(IMMI, age, SEXE, DIPL, METRODOM, pop) |>
  arrange(IMMI, age, SEXE, DIPL, METRODOM)

write.csv(cellules, out, row.names = FALSE, fileEncoding = "UTF-8")

# --- controles ---
cat("lignes produites :", nrow(cellules), "\n")
cat("age : de", min(cellules$age), "a", max(cellules$age), "\n")
cat("valeurs manquantes :", sum(is.na(cellules$age)), "\n\n")

cat("population totale (France entiere) :",
    format(round(sum(cellules$pop)), big.mark = " "), "\n")
cat("dont metropole :",
    format(round(sum(cellules$pop[cellules$METRODOM == "M"])), big.mark = " "), "\n")
cat("dont DOM :",
    format(round(sum(cellules$pop[cellules$METRODOM == "D"])), big.mark = " "), "\n\n")

par_immi <- cellules |>
  group_by(IMMI) |>
  summarise(pop = sum(pop), .groups = "drop") |>
  mutate(part = 100 * pop / sum(pop))
print(as.data.frame(par_immi))

cat("\nrepartition DIPL chez les immigres (15 ans et +, en %) :\n")
cellules |>
  filter(IMMI == "1", age >= 15, DIPL != "ZZ") |>
  group_by(DIPL) |>
  summarise(pop = sum(pop), .groups = "drop") |>
  mutate(part = round(100 * pop / sum(pop), 1)) |>
  as.data.frame() |>
  print()
