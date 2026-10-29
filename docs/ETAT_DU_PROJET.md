# État de la version 2.0 bêta

Voir [le périmètre et les limites actuelles](RELEASE_2_0.md). Les sections ci-dessous décrivent la base historique de la version 1.0.

# XR18 Studio 1.0.0 — état du développement

Cette version expose les 2 636 paramètres du catalogue XR18 connu. Les essais sur émulateur ne constituent pas une qualification matérielle ni une validation pour le concert.

## Implémenté

- Détection et connexion sans redémarrage, mode lecture/contrôle, configuration persistante.
- Entrées : nom/couleur réels, gain, 48 V avec confirmation distincte, inversion, coupe-bas, EQ, gate, compresseur, fader, mute, pan et sources.
- Aux stéréo, six bus, master, quatre envois et retours FX, quatre DCA, affectations, liens, groupes de mute, source d’écoute/solo, routages analogiques/USB/P16.
- Paramètres typés avec unités physiques, prévisualisation, sauvegarde et comparaison OSC après écriture. Les ratios de compression utilisent des indices entiers.
- Application matérielle des presets EQ/gate/compresseur ; seuils absents conservés, ratio matériel présenté, valeurs hors plage refusées.
- FX : choix des 61 algorithmes, capture/édition de vecteurs OSC typés, presets persistants, sauvegarde du slot précédent et comparaison après application. Les unités de l’éditeur FX sont les unités OSC ; les cartes musicales restent consultatives.
- Scènes JSON version 2 : capture exhaustive du catalogue connu et des quatre vecteurs FX, sauvegarde avant rappel, confirmation 48 V, rappel simulation ou transport réel avec lectures comparées. Une lecture absente fait échouer la capture.
- Retours personnels : droits par bus, plafond et pas de variation, profils SQLite et rappel progressif.
- ReaCue : associations morceau/section, armer/arrêter, déduplication, interruption avant la prochaine écriture, scènes version 2 sans 48 V, action REAPER et client Python de surveillance.
- Comptes, droits HTTP/WebSocket et accès multiappareils configurable sous HTTPS. Local par défaut.
- MCP de lecture et écriture confirmée via la même API authentifiée, sans deuxième moteur OSC.
- Morceaux, setlists, répétitions, notes et bibliothèques SQLite existants conservés.

## Limites connues

- Aucun essai sur la XR18 physique ou l’installation REAPER de l’utilisateur pendant ce développement. Adresses, plages et réponses de groupe à confirmer sur son firmware.
- Les `.scn` natifs sont conservés/exportables. Le rappel des fichiers contenant des paramètres FX textuels opaques reste refusé avant toute écriture : les scènes JSON version 2 évitent cette conversion incertaine en utilisant les vecteurs OSC capturés.
- Une opération interrompue peut laisser un état partiel ; la sauvegarde est conservée et aucun retour automatique silencieux n’est envoyé.
- Les anciennes scènes version 1 restent rappelables en simulation. Capturer une version 2 pour le matériel.
- Le catalogue n’inclut pas tous les paramètres de tous les firmwares, les autres modèles X AIR, les réglages réseau ou les mises à jour firmware.
- Pas d’analyse acoustique audio ni de correction automatique par IA : OSC transporte paramètres et niveaux, pas les signaux audio.

Voir `FONCTIONS_0_2.md` pour l’utilisation et la validation.

## Mode guidé 0.3

Accueil Mon ingé son, préparation de groupe persistante, parcours de balance en six étapes, test des niveaux OSC récents, conseils locaux selon symptômes, petites corrections prévisualisées, sauvegarde et annulation. Dialogue OpenAI facultatif, sans exécution de ses réponses ; configuration de bureau avec clé chiffrée via Electron safeStorage (refus du backend basic_text), ou variables serveur. Le conseiller ne reçoit pas d’audio. Guide : `INGE_SON.md`.

## Distribution 1.0

Guides illustrés français et anglais, installateur Windows par utilisateur en un clic, DMG Intel/Apple Silicon, AppImage et Debian. Le workflow release ne publie qu’après réussite des quatre plateformes et de leurs tests de démarrage. Les résultats réels sont visibles dans GitHub Actions ; une définition de workflow ne prouve pas sa réussite. Les paquets ne sont pas signés/notariés.
