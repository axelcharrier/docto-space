#!/usr/bin/env bash
# Regenerates prisma/data/medicaments-bdpm.tsv from the public French
# medicine database (ANSM). Run it by hand when the catalogue should be
# refreshed, then commit the result — deploys read the committed file, never
# the network.
#
# Source file: CIS_bdpm.txt, tab-separated, Latin-1. Columns used:
#   1 code CIS · 2 dénomination · 3 forme pharmaceutique
#   5 statut AMM · 7 état de commercialisation
set -euo pipefail

URL="https://base-donnees-publique.medicaments.gouv.fr/download/file/CIS_bdpm.txt"
DEST="$(dirname "$0")/../prisma/data/medicaments-bdpm.tsv"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

curl -sfL "$URL" -o "$TMP"

# Only keep specialities that are actually on the market with an active
# marketing authorisation — no point offering a doctor something withdrawn.
iconv -f LATIN1 -t UTF-8 "$TMP" \
  | awk -F'\t' 'BEGIN{OFS="\t"} $5 ~ /active/ && $7 ~ /^Commercialis/ {gsub(/\r/,""); print $1, $2, $3}' \
  | sort -t$'\t' -k2,2 > "$DEST"

echo "$(wc -l < "$DEST") médicaments écrits dans $DEST"
