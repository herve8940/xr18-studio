#!/bin/bash
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 22+ est nécessaire : https://nodejs.org/"
  read -r -p "Appuie sur Entrée pour fermer..."
  exit 1
fi
echo "XR18 Studio — installation locale et démarrage"
npm run setup
(sleep 6; open http://127.0.0.1:5173) &
npm run studio
