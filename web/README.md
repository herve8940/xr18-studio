# XR18 Studio — interface web

Interface de mixage React/TypeScript + Tailwind CSS, destinée au prototype OSC.

## Démarrage (deux terminaux)

À la racine du dépôt :
```sh
npm install
npm run dev
```

Dans un autre terminal :
```sh
cd web
npm install
npm run dev
```

Ouvrir **http://127.0.0.1:5173**.

La page lit `/api/status` et `/api/channels` et reçoit les changements sur `/ws`. Le proxy Vite pointe sur le backend local port 3000.

### Limites de sécurité

- Mode simulation par défaut. Les faders ne pilotent la console réelle que si le backend est explicitement configuré pour les écritures ; **ne pas activer sur le matériel pour le moment**.
- Les mutes sont affichés en lecture seule. Les vumètres sont volontairement désactivés : aucune donnée audio réelle n'est encore disponible.
- Le libellé des canaux est un exemple d'interface, pas la configuration lue de la XR18.
- Les écrans retours in-ear, répétitions et configuration sont des espaces réservés, non fonctionnels.
- Pas encore de login, permissions ni interface d'administration. Ne pas exposer les serveurs à Internet.
- Les valeurs des faders sont OSC normalisées ; l'indication dB est seulement indicative.
- Aucun test réel de console n'a été effectué.

### Étape suivante

Valider les échanges OSC en lecture seule sur la XR18, puis intégrer les noms de canaux réels, la détection de connexion et les vumètres.
