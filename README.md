# XR18 Studio

Application locale de gestion de la console Behringer X Air XR18, des retours in-ear, des répétitions et des setlists, avec serveur MCP et intégration ReaCue prévue.

## Objectifs

- Rendre le pilotage de la XR18 simple et sécurisé, sans retirer ses fonctions avancées.
- Proposer une interface web responsive adaptée aux musiciens.
- Centraliser les commandes OSC/UDP dans un moteur partagé par le backend, l'interface et le MCP.
- Fonctionner en local sans dépendance obligatoire à l'IA.

## Architecture cible

React + TypeScript + Tailwind CSS / Node.js + TypeScript / WebSocket / OSC UDP / MCP / SQLite.

## État

Initialisation du dépôt. Aucune fonctionnalité XR18 n'est encore validée sur la console réelle.

## Sécurité

Ne jamais exposer directement la console à Internet. Toute commande sensible doit être protégée, confirmée et journalisée.
