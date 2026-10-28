# État de développement — XR18 Studio

## Livré en code (à valider par CI et en navigateur)
- Backend Node.js/TypeScript : encodeur/décodeur OSC simple, client UDP, lecture des faders et mutes des canaux 1 à 16, simulation, HTTP et WebSocket.
- Frontend React/TypeScript/Tailwind : console sombre responsive, 16 faders, sélection de canal, affichage de l'état, navigation.
- Prototypes locaux : éditeur EQ **visuel uniquement**, préparation de 6 mixes in-ear **sans OSC**, bibliothèque de morceaux, setlist, notes de répétition, snapshots de faders simulés.
- Données de répétition, setlist et snapshots stockées dans localStorage du navigateur. Non synchronisées, non sauvegardées sur serveur.
- CI GitHub Actions pour compilation et tests.

## Non livré / non validé
- Lecture réelle des noms/couleurs, EQ, gate, compresseur, bus, FX, routage, DCA, main, vumètres.
- Réglage matériel des mutes et autres paramètres, écriture sécurisée avec permissions.
- Authentification, rôles, SQLite, MCP, ReaCue, automatisations, vraies scènes XR18, PWA.
- Validation sur une XR18 réelle.
- L'échelle graphique et la courbe EQ sont **illustratives**, pas des mesures audio.
- La disposition et les noms des 16 entrées sont des exemples, pas les paramètres de la console.

## Sécurité
- Simulation par défaut.
- Ne pas activer les écritures matérielles.
- Ne pas exposer le backend ou le frontend sur Internet.
- Aucun usage en concert ou pour les in-ear réels tant que les protections ne sont pas testées.

## Démarrage
Deux terminaux à la racine du dépôt, sur la branche `feature/studio-pro-dashboard` :

Terminal 1 :
```sh
npm install
npm run dev
```

Terminal 2 :
```sh
cd web
npm install
npm run dev
```

Ouvrir `http://127.0.0.1:5173`.

## Prochaines étapes
1. Faire passer CI et tester le navigateur.
2. Renforcer les tests OSC et la détection de déconnexion.
3. Implémenter les paramètres XR18 vérifiés en lecture seule.
4. Ajouter SQLite, authentification, rôles et garde-fous avant toute écriture réelle.
5. Intégrer progressivement le MCP et ReaCue.
