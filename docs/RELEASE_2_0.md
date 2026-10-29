# XR18 Studio 2.0.0-beta.2

Cette première bêta prépare la nouvelle version majeure. Elle améliore l’accès aux commandes existantes ; elle ne prétend pas encore remplacer toutes les fonctions de X AIR Edit. Elle ne modifie pas le format des scènes JSON version 2 ni les bases de données existantes.

## Nouveautés

- Console organisée par entrée, EQ paramétrique, GEQ/TEQ 31 bandes, gate, compresseur, volume/pan, départs, groupes, automix et insertion.
- Accès direct aux sorties principales, auxiliaires, USB 18 pistes et Ultranet/P16 ; aux liens stéréo, groupes de mute et paramètres d’écoute casque.
- Les onglets EQ, Dynamics et Envois ouvrent directement leur famille de réglages. Tous les réglages restent accessibles.
- Interrupteurs explicites et affectation aux quatre DCA/groupes de mute par cases ; curseurs pour les bandes du GEQ. Lecture datée, compteur des valeurs reçues et modifications préparées visibles.
- Copie sélective entre deux canaux : EQ, gate, compresseur, départs, mix, groupes et automix. Lecture de la source, comparaison à la destination, confirmation, sauvegarde puis application par le moteur OSC existant. Les préamplis, sources physiques/USB, noms et insertions partagées sont exclus de la copie.
- Toute modification d’un brouillon invalide sa comparaison précédente. Une valeur numérique effacée est refusée plutôt que convertie implicitement en zéro.
- Analyse et niveaux : réception de sept banques OSC (canaux, entrées analogiques/USB, RTA 100 bandes, sorties, réduction de gain, automix, DCA). Spectre avec plage réglable, pause et crêtes ; aucun signal simulé. Les bandes sont numérotées sans fréquence en Hz inventée.
- Snapshots matériels expérimentaux : lecture du nom/périmètre, sauvegarde du mix actuel, rappel, renommage, modification du périmètre et suppression. Comparaison des métadonnées reçues avant modification ; sauvegarde du mix courant avant sauvegarde/rappel. Un rappel peut changer le 48 V et exige une confirmation distincte. Un écrasement ou une suppression ne sauvegarde pas le contenu antérieur du slot.
- Page « Fonctions XR18 » : inventaire de la couverture, des fonctions externes et des éléments restant à intégrer.
- Le workflow de publication reconnaît les versions de prépublication et ne les marque pas comme dernière version stable.

## Utilisation

1. Configuration : connecter la XR18 et choisir le sens de synchronisation avec les commandes existantes.
2. Console → Mixage → Entrée / Gain : régler le préampli réellement affecté à un canal, le 48 V, la polarité et le coupe-bas.
3. Console → Contrôles : choisir une tranche ou fonction, puis « Lire les réglages ». Sélectionner le traitement désiré.
4. Préparer les valeurs, « Comparer avant application », puis confirmer. Le 48 V demande une confirmation distincte.
5. Pour copier : ouvrir un canal dans Contrôles, déplier « Copier les traitements », sélectionner une destination et les traitements, puis comparer et confirmer.
6. Pour le GEQ : choisir un bus ou Main L/R, lire ses réglages et sélectionner « Égaliseur graphique 31 bandes ». Le mode PEQ/GEQ/TEQ se choisit dans l’onglet Égaliseur paramétrique ; les curseurs GEQ ne changent pas eux-mêmes le mode.

## À intégrer avant de pouvoir annoncer toutes les fonctions

- Sélection de la source RTA depuis XR18 Studio et correspondance précise des 100 bandes avec les fréquences physiques. Les flux RTA et de réduction de gain sont implémentés, à qualifier sur la console.
- Solo individuel des tranches et commande Solo Clear ; les réglages de la section d’écoute existent déjà.
- Qualification du gestionnaire des 64 snapshots sur les firmwares réels. Le contenu d’un snapshot ne peut pas être comparé avant rappel : seule la lecture de l’index est vérifiée après chargement. Relire ensuite Table → PC. Les scènes complètes JSON restent le chemin avec comparaison des paramètres.
- Gestionnaire MIDI DIN/USB, affectations MIDI Learn et intégration des contrôleurs.
- Moteur d’enregistrement/lecture audio USB dans XR18 Studio. Utiliser REAPER ou un autre logiciel audio pour l’instant ; le routage USB est disponible.
- Réglages réseau internes et mise à jour du firmware depuis l’application.
- Noms et unités propres à chaque paramètre des 61 algorithmes FX : l’éditeur matériel existant expose encore leurs vecteurs OSC typés.

## Référence du transport

[Protocole officiel X AIR, firmware 1.11+](https://cdn-media.empowertribe.com/fa303061bf2f48a7b07eba14e1c82271/X%20AIR%20Remote%20Control%20Protocol.pdf), pages 3–4 : banques de mesures et opérations `/snap/`. Les niveaux sont des entiers signés 16 bits, résolution 1/256 dB. Les détails dépendants du firmware restent à confirmer matériellement.

## Validation

Les tests automatiques comprennent les scènes, droits, transport OSC émulé, copie sélective, refus après changement de destination et annulation en cas de changement de connexion. La compilation backend/interface doit réussir avant revue.

Les tests sur émulateur ne prouvent pas le comportement du firmware réel. La qualification de tous les paramètres sur une XR18 physique et la vérification des installateurs Windows/macOS/Linux restent nécessaires. Consulter les résultats GitHub Actions ; la présence d’un workflow ne prouve pas qu’un installateur a été produit.

Vérification visuelle locale non effectuée : Chromium absent et téléchargement du navigateur impossible dans cet environnement. La compilation de l’interface et les tests HTTP/OSC sont indépendants de cette limite.
