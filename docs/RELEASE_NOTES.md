# XR18 Studio 2.0.0-beta.3 — Capture par blocs XR18

- Table → PC et la lecture des groupes utilisent les blocs natifs `/node` lorsque la console les fournit, avec vérification de chaque bloc et de la complétude du catalogue. Une lecture manquante ne devient jamais une valeur par défaut.
- Une réponse de bloc perdue est redemandée une fois. L’ancienne lecture scalaire reste disponible si le premier bloc ne répond pas ; les changements de connexion interrompent la capture.
- Sources d’entrée L/R ajoutées au catalogue ; la source R ne bloque plus la lecture d’un canal.
- Pour les commandes individuelles d’insertion, un alias `/insert/sel` est essayé en lecture si `/insert/fxslot` ne répond pas. Une écriture utilise cet alias seulement après une réponse valide, puis une lecture comparée. Il n’est pas choisi aveuglément.
- Tests synthétiques du protocole pour capture complète par blocs, perte de paquet, bloc malformé et alias d’insertion. Comparaison locale avec un export fourni par l’utilisateur : 693 lignes décodables, 2 636 paramètres du catalogue lus sans écart ; huit entrées auxiliaires de trim hors catalogue restent exclues. L’export privé n’est pas publié.

Cette comparaison est un test de transport émulé, pas une validation physique. Les paramètres FX textuels de l’export restent opaques ; les vecteurs typés doivent être reçus du matériel. Installer beta.3 et relancer Table → PC pour confirmer le résultat sur la console.

## Versions précédentes

# XR18 Studio 2.0.0-beta.2 — Correctif de synchronisation

Corrige l’adresse DIM-PFL du catalogue : `/config/solo/dimpfl` remplace la faute `/config/solo/dimplf`, qui provoquait « Pas de réponse XR18 » pendant Table → PC. Les anciens fichiers de scènes JSON version 2 contenant la faute sont normalisés lors de leur validation ; aucune lecture manquante n’est ignorée.

Après installation, relancer Table → PC. La validation du reste du catalogue sur la console physique reste nécessaire : ce correctif ne prouve pas qu’aucune autre adresse ne pose problème.

## Previous beta

# XR18 Studio 2.0.0-beta.1 — Console organisée

Préversion de la nouvelle génération de XR18 Studio. La couverture complète de toutes les fonctions XR18 n’est pas encore atteinte.

- Navigation des commandes par traitement et par fonction : EQ/GEQ, gate, compresseur, départs, bus, master, DCA, automix, routage USB et Ultranet.
- Interrupteurs lisibles, affectations aux groupes par cases et curseurs d’égaliseur graphique.
- Copie sélective des traitements entre canaux avec comparaison et sauvegarde.
- RTA 100 bandes et vues des niveaux analogiques/USB, sorties, réduction de gain, automix et DCA ; pas de mesures fictives en simulation.
- Gestion expérimentale des 64 snapshots matériels, avec confirmations et sauvegarde du mix courant avant rappel.
- Inventaire intégré des fonctions disponibles, externes et restant à intégrer.
- Gains et 48 V, scènes complètes, synchronisation bidirectionnelle et droits existants conservés.

Les fonctions encore absentes comprennent les solos individuels, la sélection de source RTA, MIDI et l’enregistrement audio intégré. L’enregistrement USB reste utilisable via REAPER.

Cette bêta nécessite encore une validation sur console physique. Elle ne remplace pas la dernière version stable. Détails et guide : [RELEASE_2_0.md](RELEASE_2_0.md).

## English

First beta of the next major version: processing-oriented console navigation, USB/P16 routing shortcuts, graphic EQ controls, selective channel processing copy with preview/backup, and an explicit feature inventory. Existing scenes and databases remain compatible. Hardware qualification is pending. RTA100/dynamics meter streams and experimental internal snapshot management are included. RTA source selection, per-channel solo, MIDI and an integrated USB audio recorder are not yet implemented.
