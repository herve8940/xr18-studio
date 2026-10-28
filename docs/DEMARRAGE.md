# Démarrage du prototype OSC

## Pré-requis
Node.js 20+ et npm. Aucun accès XR18 requis en mode simulation.

## Simulation
```sh
npm install
npm run test
npm run build
npm run dev
```
API locale : `http://127.0.0.1:3000/api/status` et `/api/channels`.
WebSocket : `ws://127.0.0.1:3000/ws`.

Modifier un fader **simulé** :
```sh
curl -X POST http://127.0.0.1:3000/api/channels/1/fader -H 'Content-Type: application/json' -d '{"value":0.35}'
```

## Lecture seule sur XR18 réelle
```sh
XR18_MODE=real XR18_HOST=192.168.1.100 npm run dev
```
Remplacer l'IP par celle de la console. Les écritures sont désactivées par défaut. Les valeurs initiales ne sont pas fiables tant qu'aucune réponse n'a été reçue : vérifier `updatedAt` sur chaque canal.

**Ne pas activer les écritures sur la console avant validation des adresses OSC, de la sécurité auditive, des permissions et des tests en situation contrôlée.** La commande d'écriture est une fondation expérimentale et n'est pas validée sur une XR18 physique.

## Limitations connues
- Aucun frontend, MCP, base SQLite ou authentification dans ce premier incrément.
- API HTTP liée à `127.0.0.1` uniquement.
- L'état de connexion est rudimentaire : une réponse OSC valide confirme la réception, mais il n'existe pas encore de timeout de santé ni d'accusé de réception des écritures.
- Les faders sont exprimés en valeur OSC normalisée 0..1 et non en dB.
- Les commandes 48 V, gains, bus, effets et rappels de scènes ne sont pas implémentés.
- Ne pas utiliser ce prototype pour le live ou pour piloter les retours in-ear.
