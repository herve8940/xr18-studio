# Version de bureau — état vérifié

La branche release/desktop-finalization rassemble les développements jusqu’à la PR 20.

Vérifié : compilation TypeScript backend et frontend ; 20 tests automatisés réussis ; CI GitHub réussie. Application Windows assemblée avec module SQLite Windows. L’installation et l’exécution sur un PC Windows restent à vérifier.

Connexion : menu Connexion, puis Simulation, XR18 lecture seule ou XR18 contrôle. Pour une connexion réelle, choisir un fichier .txt contenant uniquement l’adresse IPv4 de la console (exemple 192.168.1.100). L’application redémarre après le choix et conserve ce réglage. Le contrôle demande une confirmation.

Disponible : faders et mutes de 16 entrées et master, lecture des niveaux OSC, lecture/écriture directe de paramètres avancés autorisés, bibliothèque de presets de préparation, morceaux, répétitions, setlists et profils in-ear SQLite, MCP en lecture seule.

Limites : presets de traitement, snapshots et mixes personnels ne constituent pas des scènes matérielles complètes. Application automatique des presets FX, routage, DCA, authentification multiutilisateur, ReaCue et validation physique XR18 non terminés. Les noms des tranches sont des exemples. Le backend reste limité à l’ordinateur local.

Téléchargements des installeurs : ouvrir la page Actions du dépôt, exécution Desktop packages, puis Artifacts (connexion GitHub nécessaire). Les builds Windows, macOS et Linux sont indépendants.
