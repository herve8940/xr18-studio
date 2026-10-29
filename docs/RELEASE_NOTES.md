# XR18 Studio 1.1.0 — Synchronisation / Synchronization

## Français

Après connexion, Configuration s’ouvre avec un choix du sens et un bouton Synchroniser, inspirés du panneau de connexion X Air Edit :

- **Table → PC** (choix par défaut) : relire le catalogue des paramètres connus et les quatre vecteurs FX ; conserver une copie PC indépendante dans SQLite. Lecture seule, aucun envoi de réglage. Les copies précédentes sont conservées.
- **PC → Table** : choisir une copie PC ou une scène complète JSON v2. Activer le contrôle, préparer un aperçu des différences, puis confirmer l’envoi. Les changements de 48 V sont exclus par défaut et nécessitent deux accords distincts pour être inclus et appliqués. Sauvegarde complète avant écriture ; vérification des réponses après chaque écriture.
- Préparation en simulation conservée automatiquement avant une connexion réelle ; bouton manuel disponible. Les valeurs par défaut non préparées font aussi partie de cette copie : vérifier les différences avant envoi.
- La copie PC ne se laisse pas écraser par les notifications temps réel. La vue de mixage en ligne continue de refléter la table ; ce n’est pas un éditeur hors ligne détaché en mode connecté.
- Comparaison avec une nouvelle lecture avant application : si la table a changé depuis l’aperçu, recommencer. Reconnexion : aperçu invalidé. Droits réservés aux administrateurs. Opérations consignées dans le journal.

Ne pas manipuler une autre application pendant une synchronisation. OSC ne propose pas de transaction atomique ou de verrouillage des autres clients : un changement concurrent pendant l’envoi ne peut pas être exclu. Une erreur peut laisser un état partiel ; la sauvegarde reste dans les scènes. Une capture incomplète échoue plutôt que d’inventer des paramètres. Seul le catalogue connu est couvert ; compatibilité de chaque paramètre sur le firmware utilisateur encore à vérifier.

Validation : 55 tests locaux réussis, vérifications HTTP supplémentaires, compilation backend/frontend. Tests des copies distinctes, lecture sans écriture, différences, sauvegarde, état concurrent, 48 V, reconnexion et droits. Les installateurs sont publiés après les tests empaquetés sur les quatre plateformes. Essai des deux sens sur XR18 physique encore nécessaire. Paquets non signés/notariés.

## English

After connection, Configuration opens with a direction selector and Synchronize button inspired by X Air Edit:

- **Mixer → PC** (default): read the known parameter catalog and four FX vectors, then retain an independent PC snapshot in SQLite. No mixer settings are written. Previous snapshots remain available.
- **PC → Mixer**: choose a saved PC snapshot or complete JSON v2 scene. Enable control, review differences and explicitly confirm. Phantom-power changes are excluded by default and require separate inclusion and application confirmations. A complete backup precedes writes; write replies are compared.
- Simulation preparations are saved automatically before connecting to hardware, with a manual save button too. Unconfigured defaults are included; inspect differences before sending.
- PC snapshots stay distinct from live mixer notifications. The online mixer view still follows hardware; it is not a detached offline editor while connected.
- Re-read before applying; changes since preview cause rejection. Reconnecting invalidates previews. Administrator-only routes; operations logged.

Do not operate another application during synchronization. OSC has no atomic transaction or cross-client lock: concurrent changes during writes cannot be excluded. Failure may leave a partial state; the backup remains in scenes. Missing parameters fail capture instead of inventing values. Only the known catalog is covered; firmware coverage still needs physical verification.

Validation: 55 local tests passed, additional HTTP checks and backend/frontend builds. Tests cover separate snapshots, read-only pull, deltas, backups, changed state, phantom confirmation, reconnects and permissions. Installer publication requires packaged tests on all four platforms. Physical two-way synchronization still requires testing. Packages are unsigned/non-notarized.
