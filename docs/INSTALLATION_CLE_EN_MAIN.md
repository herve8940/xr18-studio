# XR18 Studio — démarrage local

## Prérequis
- macOS ou Windows, Node.js 22 LTS et npm
- Un clone local du dépôt, branche `feature/turnkey-local-app`
- Aucune XR18 nécessaire : la simulation est le mode par défaut

## Mac
Dans le dossier du projet, exécuter `bash start.command`. Le navigateur s'ouvre automatiquement après quelques secondes.

## Windows
Double-cliquer sur `start.bat`. Le navigateur s'ouvre automatiquement.

## Ligne de commande
```sh
npm run setup
npm run studio
```
Puis `http://127.0.0.1:5173`.

## Données
- Morceaux, setlists et répétitions : SQLite dans `data/xr18-studio.db`.
- Brouillons de notes, snapshots simulés : stockage local du navigateur.
- EQ/comp/gate appliqués en simulation : mémoire du backend, perdue au redémarrage.

## Sécurité
- Mode simulation par défaut, backend lié à 127.0.0.1.
- **Ne pas exposer l'application sur Internet.**
- Ne pas activer `XR18_ENABLE_WRITES` sur une console réelle avant validation du moteur OSC et des protections auditives.
- Les modules in-ear, effets, EQ, gate et compresseur ne commandent pas encore la XR18 réelle.
- Pas d'authentification ni de rôles : usage strictement local.

## Validation
```sh
npm test
npm run build
npm --prefix web run build
```
Les tests et le build doivent être exécutés et leurs résultats vérifiés. Ce document ne prétend pas que le logiciel est validé sur console réelle.
