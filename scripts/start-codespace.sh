#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")/.."
mkdir -p .codespace-logs
# Al volver a abrir un Codespace en ejecución se reutilizan los servidores.
if ! curl -fsS http://127.0.0.1:4000/api/health >/dev/null 2>&1; then
  nohup npm --prefix backend start > .codespace-logs/backend.log 2>&1 < /dev/null &
fi
if ! curl -fsS http://127.0.0.1:5173/ >/dev/null 2>&1; then
  nohup env VITE_API_URL=/api npm --prefix frontend run dev -- --host 0.0.0.0 > .codespace-logs/frontend.log 2>&1 < /dev/null &
fi
echo 'DonaApp completa: abre el puerto 5173 en la pestaña Ports.'
