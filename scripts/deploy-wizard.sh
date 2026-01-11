#!/usr/bin/env bash
set -euo pipefail

# HKForms Deploy Wizard (Install/Update)
# - Fragt nur .env-Werte ab, die nicht im Admin-UI gepflegt werden (Network/SMTP etc. bleiben unberührt).
# - Modi: install (Ersteinrichtung) / update (bestehende Umgebung).
# - Baut/updated .env und pulled Images (Build findet in CI statt) + Deploy via docker compose.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
COMPOSE_FILE="${ROOT_DIR}/compose.yaml"
APP_IMAGE_DEFAULT="hkforms_main-app"

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "compose.yaml nicht gefunden unter ${COMPOSE_FILE}" >&2
  exit 1
fi

bold() { printf "\033[1m%s\033[0m" "$*"; }
green() { printf "\033[32m%s\033[0m" "$*"; }
yellow() { printf "\033[33m%s\033[0m" "$*"; }
red() { printf "\033[31m%s\033[0m" "$*"; }

have_cmd() { command -v "$1" >/dev/null 2>&1; }

check_prereqs() {
  local missing=()
  for cmd in docker git; do
    have_cmd "$cmd" || missing+=("$cmd")
  done
  if ! docker compose version >/dev/null 2>&1; then
    missing+=("docker compose")
  fi
  if (( ${#missing[@]} )); then
    echo "$(red "[!]") Fehlende Tools: ${missing[*]}" >&2
    exit 1
  fi
}

trim_quotes() {
  local v="$1"
  v="${v#\"}"
  v="${v%\"}"
  echo "$v"
}

get_env_value() {
  local key="$1"
  [[ -f "$ENV_FILE" ]] || return 1
  local line
  line="$(grep -E "^${key}=" "$ENV_FILE" | tail -n1 || true)"
  [[ -z "$line" ]] && return 1
  local val="${line#*=}"
  trim_quotes "$val"
}

random_secret() {
  # 32 chars URL-safe
  head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 32
}

prompt() {
  local label="$1" default="$2" required="${3:-false}"
  local value
  while true; do
    if [[ -n "$default" ]]; then
      read -r -p "$(bold "$label") [${default}]: " value || true
    else
      read -r -p "$(bold "$label") [-]: " value || true
    fi
    value="${value:-$default}"
    if [[ "$required" == "true" && -z "$value" ]]; then
      echo "Wert erforderlich."
      continue
    fi
    echo "$value"
    return 0
  done
}

confirm() {
  local msg="$1"
  read -r -p "$(bold "$msg") [y/N]: " ans || true
  [[ "$ans" =~ ^[Yy] ]]
}

validate_url() {
  local v="$1"
  [[ -z "$v" ]] && return 0
  python3 - <<'PY' "$v" || exit 1
import sys,urllib.parse
u=sys.argv[1]
parsed=urllib.parse.urlparse(u)
sys.exit(0 if parsed.scheme and parsed.netloc else 1)
PY
}

write_env() {
  local tmp="${ENV_FILE}.tmp"
  local backup="${ENV_FILE}.bak.$(date +%Y%m%d%H%M%S)"
  declare -A overrides=()
  while [[ "$#" -gt 1 ]]; do
    local key="$1"; shift
    local val="$1"; shift
    overrides["$key"]="$val"
  done
  if [[ -f "$ENV_FILE" ]]; then
    cp "$ENV_FILE" "$backup"
    echo "$(yellow "[i]") Backup erstellt: $backup"
  fi
  : > "$tmp"
  if [[ -f "$ENV_FILE" ]]; then
    while IFS= read -r line; do
      if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
        local key="${line%%=*}"
        if [[ -n "${overrides[$key]+x}" ]]; then
          echo "${key}=${overrides[$key]}" >> "$tmp"
          unset overrides["$key"]
        else
          echo "$line" >> "$tmp"
        fi
      else
        echo "$line" >> "$tmp"
      fi
    done < "$ENV_FILE"
  fi
  for key in "${!overrides[@]}"; do
    echo "${key}=${overrides[$key]}" >> "$tmp"
  done
  mv "$tmp" "$ENV_FILE"
  echo "$(green "[ok]") .env aktualisiert unter ${ENV_FILE}"
}

collect_values() {
  local mode="$1"
  echo ""
  echo "$(bold "Mode: ${mode^}")"

  local current_nextauth current_invite_secret current_invite_require current_invite_days current_invite_hours
  current_nextauth="$(get_env_value NEXTAUTH_SECRET || true)"
  current_invite_secret="$(get_env_value INVITE_TOKEN_SECRET || true)"
  current_invite_require="$(get_env_value INVITE_REQUIRE_TOKEN || true)"
  current_invite_days="$(get_env_value INVITE_DEFAULT_EXPIRY_DAYS || true)"
  current_invite_hours="$(get_env_value INVITE_LINK_HOURS || true)"
  local current_db_url current_pg_user current_pg_pass current_pg_db current_app_port
  current_db_url="$(get_env_value DATABASE_URL || true)"
  current_pg_user="$(get_env_value POSTGRES_USER || true)"
  current_pg_pass="$(get_env_value POSTGRES_PASSWORD || true)"
  current_pg_db="$(get_env_value POSTGRES_DB || true)"
  current_app_port="$(get_env_value APP_PORT || true)"
  local current_logout current_logout_public
  current_logout="$(get_env_value AUTO_LOGOUT_MINUTES || true)"
  current_logout_public="$(get_env_value NEXT_PUBLIC_AUTO_LOGOUT_MINUTES || true)"
  local current_image_tag current_image_name
  current_image_tag="$(get_env_value APP_IMAGE_TAG || true)"
  current_image_name="$(get_env_value APP_IMAGE || true)"

  local nextauth_secret invite_secret invite_require invite_days invite_hours
  nextauth_secret="$(prompt "NEXTAUTH_SECRET" "${current_nextauth:-$(random_secret)}" true)"
  invite_secret="$(prompt "INVITE_TOKEN_SECRET" "${current_invite_secret:-$(random_secret)}" true)"
  invite_require="$(prompt "INVITE_REQUIRE_TOKEN (true/false)" "${current_invite_require:-true}")"
  invite_days="$(prompt "INVITE_DEFAULT_EXPIRY_DAYS" "${current_invite_days:-7}")"
  invite_hours="$(prompt "INVITE_LINK_HOURS (für Compose)" "${current_invite_hours:-48}")"

  local db_mode use_db_url="n"
  if [[ -n "$current_db_url" ]]; then
    use_db_url="y"
  fi
  db_mode="$(prompt "DATABASE_URL direkt setzen? (y/n)" "$use_db_url")"

  local db_url pg_user pg_pass pg_db pg_host pg_port
  pg_host="$(get_env_value POSTGRES_HOST || true)"; pg_host="${pg_host:-db}"
  pg_port="$(get_env_value POSTGRES_PORT || true)"; pg_port="${pg_port:-5432}"

  if [[ "$db_mode" =~ ^[Yy]$ ]]; then
    db_url="$(prompt "DATABASE_URL" "${current_db_url:-postgresql://postgres:postgres@localhost:5432/hkforms}" true)"
  else
    pg_user="$(prompt "POSTGRES_USER" "${current_pg_user:-postgres}" true)"
    pg_pass="$(prompt "POSTGRES_PASSWORD" "${current_pg_pass:-postgres}" true)"
    pg_db="$(prompt "POSTGRES_DB" "${current_pg_db:-hkforms}" true)"
    pg_host="$(prompt "POSTGRES_HOST" "$pg_host" true)"
    pg_port="$(prompt "POSTGRES_PORT" "$pg_port" true)"
    db_url="postgresql://${pg_user}:${pg_pass}@${pg_host}:${pg_port}/${pg_db}"
  fi

  local app_port
  app_port="$(prompt "APP_PORT (Compose Mapping)" "${current_app_port:-3000}")"

  local logout logout_public
  logout="$(prompt "AUTO_LOGOUT_MINUTES (optional)" "${current_logout:-30}")"
  logout_public="$(prompt "NEXT_PUBLIC_AUTO_LOGOUT_MINUTES (optional)" "${current_logout_public:-${logout:-30}}")"

  local image_name image_tag
  image_name="$(prompt "APP_IMAGE (inkl. Registry, z. B. ghcr.io/org/hkforms_main-app)" "${current_image_name:-$APP_IMAGE_DEFAULT}")"
  image_tag="$(prompt "APP_IMAGE_TAG (für compose.yaml)" "${current_image_tag:-latest}")"

  local pull_now
  pull_now="$(prompt "Image jetzt per docker pull holen? (y/n)" "y")"

  SUMMARY=()
  SUMMARY+=("NEXTAUTH_SECRET=[hidden]")
  SUMMARY+=("INVITE_TOKEN_SECRET=[hidden]")
  SUMMARY+=("INVITE_REQUIRE_TOKEN=${invite_require}")
  SUMMARY+=("INVITE_DEFAULT_EXPIRY_DAYS=${invite_days}")
  SUMMARY+=("INVITE_LINK_HOURS=${invite_hours}")
  SUMMARY+=("DATABASE_URL=${db_url}")
  SUMMARY+=("APP_PORT=${app_port}")
  SUMMARY+=("AUTO_LOGOUT_MINUTES=${logout}")
  SUMMARY+=("NEXT_PUBLIC_AUTO_LOGOUT_MINUTES=${logout_public}")
  SUMMARY+=("APP_IMAGE=${image_name}")
  SUMMARY+=("APP_IMAGE_TAG=${image_tag}")
  [[ "$pull_now" =~ ^[Yy]$ ]] && SUMMARY+=("Pull Image=${image_name}:${image_tag}")

  echo ""
  echo "$(bold "Zusammenfassung")"
  for entry in "${SUMMARY[@]}"; do
    echo " - $entry"
  done
  echo ""

  if ! confirm "Fortfahren und .env schreiben?"; then
    echo "Abgebrochen."
    exit 0
  fi

  local env_pairs=(
    NEXTAUTH_SECRET "$nextauth_secret"
    INVITE_TOKEN_SECRET "$invite_secret"
    INVITE_REQUIRE_TOKEN "$invite_require"
    INVITE_DEFAULT_EXPIRY_DAYS "$invite_days"
    INVITE_LINK_HOURS "$invite_hours"
    DATABASE_URL "$db_url"
    APP_PORT "$app_port"
    AUTO_LOGOUT_MINUTES "$logout"
    NEXT_PUBLIC_AUTO_LOGOUT_MINUTES "$logout_public"
    APP_IMAGE_TAG "$image_tag" \
    APP_IMAGE "$image_name"
  )

  if [[ ! "$db_mode" =~ ^[Yy]$ ]]; then
    env_pairs+=(
      POSTGRES_USER "${pg_user:-postgres}"
      POSTGRES_PASSWORD "${pg_pass:-postgres}"
      POSTGRES_DB "${pg_db:-hkforms}"
      POSTGRES_HOST "${pg_host:-db}"
      POSTGRES_PORT "${pg_port:-5432}"
    )
  fi

  write_env "${env_pairs[@]}"

  if [[ "$pull_now" =~ ^[Yy]$ ]]; then
    do_pull_and_deploy "$image_name" "$image_tag" "$mode"
  else
    do_deploy "$mode"
  fi
}

do_pull_and_deploy() {
  local image="$1" tag="$2" mode="$3"
  local ref="${image}:${tag}"
  echo "$(bold "Pull ${ref} ...")"
  docker pull "$ref"
  do_deploy "$mode"
}

do_deploy() {
  local mode="$1"
  echo "$(bold "Starte docker compose (${mode}) ...")"
  (cd "$ROOT_DIR" && docker compose -f "$COMPOSE_FILE" up -d)
  echo "$(green "[ok]") Deployment abgeschlossen. Logs: docker compose -f ${COMPOSE_FILE} logs -f"
}

main() {
  check_prereqs
  echo "$(bold "HKForms Deploy Wizard")"
  echo "Modi: install (Ersteinrichtung) / update (bestehend)."
  local mode="${1:-}"
  if [[ -z "$mode" ]]; then
    mode="$(prompt "Modus wählen (install/update)" "install")"
  fi
  if [[ "$mode" != "install" && "$mode" != "update" ]]; then
    echo "$(red "[!]") Ungültiger Modus: $mode" >&2
    exit 1
  fi
  echo ""
  echo "$(yellow "[Hinweis]") Netzwerk-/Domain-Settings bitte im Admin-UI (Network) pflegen. Wizard ändert diese nicht."
  collect_values "$mode"
}

main "$@"
