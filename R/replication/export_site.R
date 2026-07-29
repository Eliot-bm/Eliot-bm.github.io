# Export vers le site : table de qualification, libelles en anglais.
# Le site est en anglais uniquement (CLAUDE.md, section 1).
# Entree  : base_rp2021_cellules.csv (produit par extract_rp.R)
# Sortie  : notes/posts/data/qualification.csv dans le depot du site
# Source  : Insee, recensement de la population 2021, fichier detail, Licence Ouverte 2.0.

suppressMessages({
  library(dplyr)
})

cellules <- read.csv("C:/Eliot-bm-recherche/data/base_rp2021_cellules.csv",
                     colClasses = c(IMMI = "character", DIPL = "character"),
                     encoding = "UTF-8")

# Meme decoupage qu'en francais dans qualification.R ; la coupure 1/2 est la
# frontiere ISCED 0-2 / ISCED 3, donc le repli sur la trichotomie reste valable.
niveaux <- c(
  "No diploma or lower secondary",
  "Vocational certificate (CAP-BEP)",
  "Upper secondary (baccalaureat)",
  "Short-cycle tertiary (BTS, DUT)",
  "Bachelor's (licence, maitrise)",
  "Master's or doctorate"
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

broad <- function(q) {
  factor(dplyr::case_when(
    q == niveaux[1]                 ~ "Low",
    q %in% niveaux[2:3]             ~ "Medium",
    q %in% niveaux[4:6]             ~ "High"
  ), levels = c("Low", "Medium", "High"))
}

table_site <- lapply(c(15L, 25L), function(a) {
  cellules |>
    filter(age >= a, DIPL != "ZZ") |>
    mutate(qual = recoder(DIPL),
           origin = ifelse(IMMI == "1", "Immigrants", "Natives")) |>
    group_by(origin, qual) |>
    summarise(pop = sum(pop), .groups = "drop_last") |>
    mutate(share = round(100 * pop / sum(pop), 2),
           age_min = a) |>
    ungroup() |>
    mutate(broad = broad(qual)) |>
    select(age_min, origin, qual, broad, share)
}) |>
  bind_rows() |>
  arrange(age_min, origin, qual)

dest_dir <- "C:/Eliot-bm.github.io/notes/posts/data"
if (!dir.exists(dest_dir)) dir.create(dest_dir, recursive = TRUE)
dest <- file.path(dest_dir, "qualification.csv")

write.csv(table_site, dest, row.names = FALSE, fileEncoding = "UTF-8")

cat("ecrit :", dest, "\n")
cat("lignes :", nrow(table_site), "\n")
cat("controle somme des parts par groupe :\n")
table_site |>
  group_by(age_min, origin) |>
  summarise(total = sum(share), .groups = "drop") |>
  as.data.frame() |>
  print(row.names = FALSE)
