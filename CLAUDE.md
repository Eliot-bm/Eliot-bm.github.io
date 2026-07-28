# CLAUDE.md — `Eliot-bm.github.io`

Site académique Quarto. Public : job market en économie (immigration, progrès technique).
Ce fichier est la source de vérité pour toute session Claude sur ce dépôt. Le lire avant d'agir.

---

## 1. Règles de collaboration (non négociables)

- **N'écris pas de code d'analyse avant que j'aie posé le squelette ou la logique.** Si je demande
  un script complet sans avoir esquissé l'approche, demande-moi mon raisonnement d'abord.
  *Exception* : fichiers de configuration (YAML, workflows CI, includes HTML, CSS) — écris-les directement.
- **Signale la procrastination productive.** Si une session dérive vers du theming, du refactoring,
  ou de l'exploration tangentielle alors qu'un livrable de recherche est en attente, dis-le en
  première ligne de ta réponse. Ne le formule pas comme une question.
- **Sois direct et critique.** Pas de préambule, pas de reformulation de ma demande, pas de
  récapitulatif de ce que tu viens de faire. Si une décision est mauvaise, dis pourquoi et propose
  l'alternative dans la même phrase.
- **Une décision par question.** Ne me présente pas cinq options équivalentes : recommande-en une,
  et donne le coût de l'erreur.
- Je rédige en français et en anglais. **Le site est en anglais uniquement.**

---

## 2. Standards de rédaction (contenu du site, abstracts, blog)

Références : Cochrane (*Writing Tips for PhD Students*), Shapiro, McCloskey.

- **Langage causal exact.** « effect of X on Y » uniquement si la stratégie d'identification le
  justifie. Sinon : « association », « is correlated with ». Jamais « impacts » comme verbe.
  Jamais « X drives Y » sur une régression descriptive.
- **Signification économique avant signification statistique.** Toute magnitude est reportée en
  unités interprétables — points de %, écarts-types, part de la moyenne de l'échantillon — avant
  tout t-stat ou étoile. Un résultat sans magnitude interprétable n'est pas un résultat.
- **Le titre de la page dit le sujet. La `description` dit le résultat.** Une description de paper
  qui ne contient pas de nombre est à réécrire.
- **Vocabulaire interdit** : underscore, nuance, leverage, delve, landscape, noteworthy,
  « it's important to note », « in today's rapidly evolving », « a testament to », « sheds light on ».
- Phrases courtes, voix active, pas de nominalisation
  (« estimation of the effect » → « we estimate »).
- Test de suppression : si retirer une phrase ne fait perdre aucune information, la retirer.

---

## 3. Stack et invariants techniques

| Élément | Valeur | Modifiable ? |
|---|---|---|
| Générateur | Quarto, project type `website` | non |
| Répertoire de sortie | `_site/` (jamais commité) | non |
| Hébergement | GitHub Pages, source = **GitHub Actions** (pas de branche `gh-pages`) | non |
| Langue | anglais | non |
| Exécution du code | `freeze: true`, `_freeze/` **commité** | critique |
| Analytics | GoatCounter, sans cookie | — |

### Règle `freeze` — la cause n°1 d'échec du CI

Le workflow CI **n'installe ni R ni Python**. Tout code R/Python est exécuté en local ; `_freeze/`
est versionné et contient les résultats. Avant tout push touchant un `.qmd` computationnel :

```bash
quarto render          # local : exécute le code, met à jour _freeze/
git add _freeze/
```

Si un build CI échoue avec une erreur d'exécution R/Python, la cause est presque toujours un
`_freeze/` non commité. Ne « répare » pas ça en ajoutant `setup-r` au workflow : rends en local
et commite le freeze.

### Règle URL

`eliot-bm.github.io` ne doit apparaître sur **aucun document circulant** : CV, PDF de working paper,
signature mail, slides, profil RePEc. Cette URL est temporaire.

Un seul endroit du dépôt contient l'URL canonique : `site-url` dans `_quarto.yml`.
Partout ailleurs, chemins relatifs. Toute URL absolue en dur dans un `.qmd` est un bug.

### Ne jamais faire

- Commiter `_site/`.
- Ajouter une bannière cookies (l'analytics est exempté de consentement — cf. `privacy.qmd`).
- Ajouter React, Vue, jQuery, ou un bundler. Ce site est du HTML statique.
- Renommer ou déplacer un répertoire de post/paper déjà publié : l'URL casse et les liens
  entrants meurent. Créer une redirection à la place.
- Ajouter une dépendance R/Python au workflow CI (voir règle `freeze`).

---

## 4. Structure

```
.
├── _quarto.yml                 # configuration unique du site
├── index.qmd                   # homepage (about / trestles)
├── research/                   # index listing + un dossier par paper
├── teaching/                   # index listing + matériel étudiant
├── blog/                       # index listing + un dossier par post
├── privacy.qmd                 # mention analytics (obligation CNIL d'information)
├── assets/                     # og-default.png, favicon, CV
├── _includes/analytics.html    # script GoatCounter + events PDF
├── _freeze/                    # résultats d'exécution gelés — COMMITÉ
└── .github/workflows/publish.yml
```

---

## 5. Definition of done — nouvelle page de paper

Une page dans `research/` n'est pas terminée tant que les six éléments ne sont pas présents :

1. `title` — descriptif, pas d'astuce rhétorique.
2. `description` — **une phrase contenant le résultat principal et sa magnitude.** C'est le seul
   texte que verront la plupart des lecteurs (carte de partage, listing, résultats Google).
3. `image` — la figure principale du paper, 1200×630 px. Pas un logo, pas un visuel décoratif.
4. `image-alt` — description de la figure en une phrase.
5. Lien vers le PDF **et** vers le dépôt de réplication.
6. Bloc `citation:` + `google-scholar: true` — pour l'indexation Google Scholar et l'import Zotero.

Une page sans (2) ni (3) produit une carte de partage vide. Autant ne pas partager le lien.

---

## 6. Commandes

```bash
quarto preview                 # dev local
quarto render                  # rendu complet + mise à jour de _freeze/
git add _freeze/ && git commit && git push   # le CI déploie automatiquement
```

Aucune commande `quarto publish` n'est utilisée. Le déploiement passe exclusivement par
`.github/workflows/publish.yml`.
