# XR18 Studio 1.0.1

## Français

Connexion : plusieurs sondes /info et /xinfo sont envoyées pendant 2,5 secondes au lieu d’une seule sonde /info sur 900 ms. Les deux formats d’adresse de réponse sont reconnus. Un échec manuel distingue désormais une réponse d’identité non reconnue, une absence de réponse et une erreur d’envoi réseau. Aucune écriture de mixage n’est envoyée pendant ces sondes.

Ce correctif fait suite à une connexion refusée sur Mac alors que X Air Edit fonctionne et que l’autorisation Réseau local est active. Il améliore la compatibilité et le diagnostic ; la cause sur ce Mac n’est pas encore confirmée et son efficacité sur la console concernée reste à vérifier. Réessayer avec l’adresse utilisée dans X Air Edit et transmettre le nouveau message si nécessaire.

Validation logicielle : 51 tests locaux réussis et compilation backend/frontend. Test UDP supplémentaire : premier paquet perdu, réponse /xinfo, autres modèles refusés et aucune écriture. Les installateurs sont publiés seulement après les tests et le démarrage empaqueté sur les quatre plateformes.

Paquets non signés/notariés. Validation XR18 physique/REAPER toujours nécessaire. Guides : docs/USER_GUIDE_FR.md et docs/USER_GUIDE_EN.md.

## English

Connection: retry /info and /xinfo probes for 2.5 seconds rather than a single /info probe over 900 ms. Both reply addresses are accepted. Manual connection errors now distinguish unrecognized identity replies, no response and network send errors. Probes do not write mixer parameters.

This follows a Mac connection failure while X Air Edit works and Local Network permission is enabled. It improves compatibility and diagnostics; the root cause on that Mac and effectiveness against the affected physical console remain unconfirmed. Retry with the IP used by X Air Edit and report the new error if needed.

Software validation: 51 local tests passed and backend/frontend builds succeeded. Added UDP test covers a dropped initial packet, /xinfo replies, rejecting other models and read-only probes. Installer publication requires passing tests and packaged startup checks on all four platforms.

Unsigned/non-notarized packages. Physical XR18/REAPER validation remains necessary. Illustrated French/English guides are in docs/USER_GUIDE_FR.md and docs/USER_GUIDE_EN.md.
