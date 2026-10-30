# XR18 Studio 1.3 — Tutoriel pas à pas

[English](USER_GUIDE_EN.md) · [Guide de la console (chaque option)](GUIDE_CONSOLE.md) · [Téléchargements](https://github.com/herve8940/xr18-studio-/releases/latest) · [Accueil](../README.md)

XR18 Studio pilote une table Behringer **XR18** (ainsi que X18 et MR18) depuis un ordinateur, une tablette, et le téléphone de chaque musicien pour son retour. Ce tutoriel suit l’ordre d’une vraie journée : installer, connecter, faire la balance, mixer, donner les retours aux musiciens, préparer le concert.

> Les captures ont été faites avec une table émulée : les noms de canaux (Chant, Guitare 1…) sont des exemples. Chez toi, l’application affiche les noms et couleurs enregistrés dans ta XR18.

**Sommaire**

1. [Ce qu’il te faut](#1-ce-quil-te-faut)
2. [Installer l’application](#2-installer-lapplication)
3. [Premier lancement, sans table](#3-premier-lancement-sans-table)
4. [Connecter la XR18](#4-connecter-la-xr18)
5. [Se repérer : trois espaces](#5-se-repérer--trois-espaces)
6. [Faire la balance avec « Mon ingé son »](#6-faire-la-balance-avec--mon-ingé-son-)
7. [Mixer la façade en mode Simple](#7-mixer-la-façade-en-mode-simple)
8. [Régler en détail en mode Expert](#8-régler-en-détail-en-mode-expert)
9. [Les retours sur le téléphone de chaque musicien](#9-les-retours-sur-le-téléphone-de-chaque-musicien)
10. [Préparer : setlists, répétitions, scènes](#10-préparer--setlists-répétitions-scènes)
11. [Le jour du concert : check-list](#11-le-jour-du-concert--check-list)
12. [Dépannage](#12-dépannage)
13. [Sauvegarde, mises à jour et limites](#13-sauvegarde-mises-à-jour-et-limites)

---

## 1. Ce qu’il te faut

- Une table **XR18**, X18 ou MR18 (version d’origine ou V2).
- Un ordinateur **Windows**, **Mac** (Intel ou Apple Silicon) ou **Linux**.
- **Un routeur Wi-Fi** pour le groupe ou la salle : l’ordinateur, la table (câble réseau conseillé) et les téléphones des musiciens doivent être sur ce même réseau. Le Wi-Fi intégré de la XR18 marche pour l’ordinateur seul, mais il est trop limité pour plusieurs téléphones.
- Pour les retours sur téléphone : n’importe quel smartphone récent avec un appareil photo (pour scanner le QR code). Aucune application à installer.

## 2. Installer l’application

Télécharge le fichier qui correspond à ton ordinateur sur la [page des versions](https://github.com/herve8940/xr18-studio-/releases/latest). Rien d’autre à installer : le moteur et l’interface sont inclus.

| Ordinateur | Fichier | Installation |
|---|---|---|
| Windows | `XR18-Studio-Windows-1.3.0.exe` | Double-clic. L’installation se fait pour ton compte et crée un raccourci. |
| Mac Intel | `XR18-Studio-macOS-1.3.0-x64.dmg` | Ouvre-le et glisse XR18 Studio dans Applications. |
| Mac Apple Silicon (M1, M2, M3…) | `XR18-Studio-macOS-1.3.0-arm64.dmg` | Idem. |
| Ubuntu / Debian | fichier `.deb` | Ouvre-le avec l’installateur de logiciels. |
| Autre Linux | fichier `.AppImage` | Autorise l’exécution dans ses propriétés, puis ouvre-le. |

Les paquets ne sont pas signés par un certificat commercial :

- **Mac** : la première fois, fais **clic droit › Ouvrir**, puis confirme. Ou va dans Réglages Système › Confidentialité et sécurité › « Ouvrir quand même ».
- **Windows** : si SmartScreen s’affiche, clique **Informations complémentaires › Exécuter quand même**.

Ne désactive jamais toutes les protections du système. Un ordinateur d’entreprise ou d’école peut demander l’intervention de son administrateur.

## 3. Premier lancement, sans table

Au premier démarrage, l’application est en **simulation** : tu peux tout découvrir sans toucher à ta table. Le badge orange **Simulation** en haut à droite le rappelle.

![Premier lancement en simulation](images/tuto-first-launch.png)

En simulation, aucune commande ne part vers une console et les vumètres ne bougent pas. C’est parfait pour apprendre, préparer les setlists ou montrer l’application au groupe.

## 4. Connecter la XR18

1. Allume la table et branche-la au routeur (ou connecte l’ordinateur au Wi-Fi de la XR18).
2. Va dans **Réglages** (en bas du menu de gauche, ou la carte de connexion en bas à gauche).
3. Clique **Détecter et connecter ma XR18**. Si une seule table est trouvée, la connexion est immédiate. S’il y en a plusieurs, choisis la bonne.
4. La connexion commence en **lecture seule** : rien ne change sur la table. Quand tu es prêt à agir, clique **Activer le contrôle** et confirme.

![Page de connexion](images/tuto-connect.png)

La connexion est mémorisée pour le prochain lancement. Si la détection échoue, ouvre **Connexion manuelle** et tape l’adresse IP de la table : `192.168.1.1` si l’ordinateur est sur le Wi-Fi propre de la XR18, sinon l’adresse donnée par ton routeur.

**Synchronisation après connexion.** Le même écran propose le sens de synchronisation :

- **Table → PC** (conseillé) : récupère les réglages actuels de la table. Rien n’est envoyé.
- **PC → Table** : renvoie vers la table une copie sauvegardée sur l’ordinateur. Un aperçu montre chaque différence avant l’envoi. Le 48 V est exclu par défaut et demande un accord séparé.

Pendant ces opérations, ne touche pas la table depuis une autre application (X-AIR Edit, tablette…).

## 5. Se repérer : trois espaces

L’application est rangée en **trois espaces**, dans le menu de gauche sur ordinateur, en icônes sur tablette, et en bas de l’écran sur téléphone.

| Espace | Pages | Quand |
|---|---|---|
| **Jouer** | Console, Retours, Mon ingé son | Balance, répétition, concert |
| **Préparer** | Setlists, Répétitions, Scènes | Avant : répertoire, objectifs, sauvegardes |
| **Réglages** | Connexion & système | Trouver la table, activer le contrôle, comptes |

En haut de chaque page :

- l’état de la table : **XR18 réelle** (vert), **Simulation** (orange) ou **Déconnectée** (rouge) ;
- **Tout couper** (rouge) : coupe les 16 entrées d’un coup, en cas de larsen ou d’urgence ;
- **Scènes** : sauvegarder ou rappeler des réglages.

En bas à gauche, la carte de connexion indique si le contrôle est activé.

| Sur tablette | Sur téléphone |
|---|---|
| ![Tablette](images/app-tablet.png) | ![Téléphone](images/tuto-app-phone.png) |

## 6. Faire la balance avec « Mon ingé son »

**Jouer › Mon ingé son** est un assistant pour les groupes sans ingé son. Il te guide en six étapes :

1. Brancher et connecter.
2. Dire qui est branché où.
3. Faire jouer un musicien à la fois.
4. Écouter et corriger un problème.
5. Préparer les retours.
6. Garder le bon réglage.

![Mon ingé son](images/tuto-coach.png)

À l’étape 4, choisis l’instrument puis ce qui te gêne (« la voix est étouffée », « ça siffle »…), ou décris-le avec tes mots. L’assistant propose une petite correction, que tu prévisualises, essaies et peux annuler d’un clic avec **Annuler le dernier réglage guidé**.

L’assistant reçoit les réglages et les niveaux de la table, **pas le son** : ses conseils partent de ta description. En cas de larsen, baisse tout de suite le volume concerné (ou **Tout couper**) avant de chercher la cause.

Le dialogue avec une IA (OpenAI) est facultatif ; le conseiller local fonctionne sans abonnement. Voir [Mon ingé son](INGE_SON.md).

## 7. Mixer la façade en mode Simple

**Jouer › Console**, bouton **Simple** en haut. C’est le mode du concert : de grosses tranches faciles à toucher, une par source.

![Console en mode Simple](images/tuto-simple.png)

Pour chaque source, de haut en bas :

- **Le nom et sa couleur** (ceux de ta table) : touche-le pour ouvrir le réglage détaillé de cette source.
- **Le niveau en dB** : 0 dB = niveau nominal, −∞ = coupé.
- **Le fader et son vumètre** : glisse pour régler. Le vumètre doit rester dans le vert et le jaune ; le rouge en haut signale une saturation.
- **Mute** (devient rouge « Coupé ») et **Solo** (écoute au casque, sans rien changer pour le public).

La tranche à droite est le **volume général**.

**Régler le retour d’un musicien.** En haut, choisis son retour (par exemple « Retour Gtr ») au lieu de **Façade** : les faders règlent alors ce que ce musicien entend, et le public n’est pas concerné. Les niveaux apparaissent en cyan pour te le rappeler.

![Mode Simple sur un retour](images/tuto-simple-retour.png)

Les entrées sans nom sont masquées pour alléger l’écran ; la case **Afficher aussi les entrées sans nom** les fait réapparaître.

**Gestes utiles partout dans l’application** :

- **glisser** pour régler, **Maj** enfoncée pour un réglage fin ;
- **molette** pour de petits pas ;
- **double-clic** pour revenir à 0 dB.

Chaque geste part tout de suite vers la table, puis l’application relit la valeur vraiment retenue.

## 8. Régler en détail en mode Expert

Bouton **Expert** en haut de la console : toute la table, organisée comme X-AIR Edit.

![Console en mode Expert](images/tuto-expert.png)

- **En haut, les onglets** : Mixer, Canal, Entrée, Gate, EQ, Comp, Envois, Main, Effets, Routage, Vumètres.
- **Au milieu, la vue de la tranche sélectionnée** (clique sur un nom en bas pour en changer).
- **En bas, la banque de faders**.
- **À droite, la barre de mix** : façade, retours ou effets sur les faders, DCA, Clr Solo, groupes de mute, auto-mix.

Le bouton **? Explications** affiche à côté de chaque vue, en langage simple, à quoi sert chaque réglage. Le [Guide de la console](GUIDE_CONSOLE.md) reprend toutes ces explications avec des captures et la liste des 61 effets.

![Égaliseur en mode Expert](images/tuto-expert-eq.png)

**Quelques réglages courants** :

- **Le gain d’un micro** (onglet **Entrée**) : fais jouer fort, monte le **Mic Gain** jusqu’à ce que le vumètre atteigne −12 à −6 dB. Le gain agit sur la prise physique, donc sur tous les canaux qui l’utilisent.
- **Le 48 V** (micros statiques) : bouton **48V Phantom** dans Entrée, toujours avec confirmation. Ne l’active pas sur un micro à ruban.
- **Le coupe-bas** (Entrée ou EQ) : 80–100 Hz sur les voix et les guitares, pour enlever les bruits de scène.
- **L’égaliseur** : glisse un point de la courbe, la molette change sa largeur. Corrige d’abord ce qui gêne avant d’ajouter.
- **Le compresseur et la gate** : commence par un préréglage (Kick, Snare, Bass, Vocal…), puis ajuste le seuil à l’oreille.

**Toujours protégé** : le 48 V, le routage et le changement d’effet demandent une confirmation, avec aperçu et sauvegarde automatique. Changer la prise d’entrée ou coupler deux canaux pose aussi la question.

Les onglets **Préréglages par instrument**, **Bibliothèque d’effets** et **Tous les paramètres** restent disponibles au-dessus de la console Expert.

## 9. Les retours sur le téléphone de chaque musicien

Chaque musicien règle **son propre retour** depuis son téléphone, sans application, en scannant **son** QR code.

### Côté ordinateur : créer les QR codes

1. Va dans **Jouer › Retours**.
2. Clique **Démarrer le partage**. Au premier démarrage, le système peut demander d’autoriser XR18 Studio dans le pare-feu : accepte pour les réseaux privés.
3. Tape le prénom du musicien, choisis **son retour** (bus 1 à 6), puis **Ajouter**. Recommence pour chaque musicien.
4. Chaque musicien scanne son QR code avec l’appareil photo de son téléphone. **Imprimer les QR** sort une feuille avec tous les codes, à scotcher près des retours.

![Page Retours avec les QR codes](images/tuto-share.png)

Chaque carte indique si le téléphone du musicien est connecté. Si un téléphone est perdu, ou si un musicien quitte le groupe, clique **Nouveau lien** : l’ancien QR code cesse aussitôt de fonctionner. **Retirer** supprime l’accès.

### Côté musicien : la page « Mon retour »

| Mon retour | Mes réglages enregistrés |
|---|---|
| ![Page Mon retour sur téléphone](images/tuto-phone.png) | ![Réglages enregistrés](images/tuto-phone-profiles.png) |

- **Volume de mon retour** : le volume général de son retour, et **Couper** pour le couper d’un geste.
- **Ce que j’entends** : une barre par instrument. Glisse vers la droite pour l’entendre plus fort. La fine barre en dessous montre le niveau joué en ce moment. Les sources pas encore envoyées sont masquées ; **Tout afficher** les montre.
- **Mes réglages enregistrés** : donne un nom (« Concert », « Répète acoustique ») et **Enregistrer**. **Rappeler** retrouve ce mix en douceur, en une seconde environ.
- Poser le doigt ne change rien : seul le **glissement** modifie le niveau, pour éviter les accidents en jouant.

**Ce que le musicien ne peut pas faire** : toucher la façade, les retours des autres, le gain, le 48 V, les effets ou le routage. Son lien ne donne accès qu’à son retour.

**Sécurité auditive** : depuis un téléphone, aucun niveau ne dépasse 0 dB, et chaque geste ne peut monter que d’un petit pas (baisser est toujours libre). Commence bas, puis monte ce qui manque. Vérifie aussi le volume de l’émetteur ou de l’ampli des retours.

**Bon à savoir** :

- La page reste en **lecture seule** tant que le contrôle n’est pas activé dans Réglages.
- Le partage s’arrête quand on ferme l’application : il faut le redémarrer à chaque lancement. Les QR codes restent valables tant que l’ordinateur garde la même adresse sur le réseau (même routeur) ; sur un autre réseau, réimprime-les. Pour une adresse fixe, réserve-la pour l’ordinateur dans les réglages du routeur.
- La connexion n’est pas chiffrée : utilise le Wi-Fi privé du groupe, protégé par mot de passe, jamais un réseau public.
- Ajouter la page à l’écran d’accueil du téléphone (menu du navigateur › « Sur l’écran d’accueil ») permet de la rouvrir comme une application.

## 10. Préparer : setlists, répétitions, scènes

**Setlists** : ajoute les morceaux au répertoire (titre, artiste, tempo), puis **+ Setlist** pour construire l’ordre de passage. Donne un nom à la setlist et **Sauvegarder** pour la garder.

![Setlists](images/tuto-setlists.png)

**Répétitions** : note les objectifs de la prochaine répétition (morceaux à travailler, réglages à revoir) et enregistre-la avec sa date.

**Scènes** : une scène est une photo de tous les réglages de la table (canaux, traitements, envois, effets…).

![Scènes](images/tuto-scenes.png)

- **Sauvegarder la scène complète** : à faire après chaque balance réussie.
- **Sauvegarder pour ReaCue (sans 48 V)** : version utilisable par l’automatisation REAPER, voir [ReaCue](SHOW_CONTROL.md).
- **Importer** un fichier `.scn` de X-AIR Edit est possible pour l’archiver. Pour le rappeler, charge-le dans X-AIR Edit, connecte XR18 Studio, puis fais une capture de scène complète.

Avant chaque rappel, la table est sauvegardée automatiquement.

## 11. Le jour du concert : check-list

1. Brancher le routeur, la table (câble réseau) et l’ordinateur. Volumes des enceintes et des retours **au minimum**.
2. Lancer XR18 Studio, vérifier le badge **XR18 réelle**, puis **Réglages › Activer le contrôle**.
3. **Scènes** : rappeler la scène du groupe (ou **Table → PC** si la table est déjà réglée).
4. **Jouer › Retours › Démarrer le partage**. Les musiciens ouvrent leur QR code et vérifient que leur page affiche « En direct ».
5. Balance : un musicien à la fois (**Mon ingé son**, étape 3), puis tout le groupe.
6. Pendant le concert : mode **Simple** sur la façade. **Tout couper** reste en haut en cas de problème.
7. Après le concert : **Scènes › Sauvegarder la scène complète** si des réglages ont changé.

## 12. Dépannage

| Problème | Solution |
|---|---|
| « XR18 déconnectée » | Vérifier l’alimentation et le câble réseau, et que l’ordinateur est sur le même réseau. Essayer la connexion manuelle avec l’IP de la table. |
| La détection ne trouve rien | Le pare-feu bloque peut-être XR18 Studio : l’autoriser pour les réseaux privés. Les réseaux invités et les VLAN bloquent la détection. |
| Les faders ne bougent pas la table | Le contrôle n’est pas activé (carte en bas à gauche « Lecture seule ») : **Réglages › Activer le contrôle**. |
| Le QR code n’ouvre rien | Le téléphone doit être sur le **même Wi-Fi** que l’ordinateur (pas en 4G/5G). Vérifier que le partage est démarré. |
| La page du musicien affiche « Lien expiré » | Le lien a été régénéré ou retiré : scanner le nouveau QR code. |
| La page du musicien affiche « Reconnexion… » | L’ordinateur s’est mis en veille, l’application est fermée ou le Wi-Fi a coupé. La page se reconnecte toute seule. |
| Le musicien ne peut pas monter plus fort | Le plafond de 0 dB est atteint : monter le volume de son émetteur ou de son ampli, ou baisser les autres sources. |
| « Une opération est en cours » | Une sauvegarde, un rappel de scène ou une synchronisation est en cours sur l’ordinateur : attendre quelques secondes. |
| Le son change tout seul | Une autre application (X-AIR Edit, tablette) ou ReaCue pilote aussi la table. |

Pour signaler un problème : **Réglages › Télécharger le journal de diagnostic**, puis joindre ce fichier avec ton système, la version et les étapes pour reproduire. Le journal ne contient ni clé API ni mot de passe.

## 13. Sauvegarde, mises à jour et limites

- **Sauvegarde** : exporte les scènes importantes et garde une copie du dossier de données de l’application avant une mise à jour.
- **Mise à jour** : télécharge le nouvel installateur depuis les [versions GitHub](https://github.com/herve8940/xr18-studio-/releases/latest), ferme XR18 Studio, puis installe. Il n’y a pas de mise à jour automatique.
- **Limites** :
  - l’application reçoit des réglages et des niveaux, **pas le son** ;
  - le solo et la cadence des vumètres restent à valider sur une table physique ;
  - les essais logiciels et l’émulateur ne remplacent pas une vraie balance avant un concert ;
  - la sécurité auditive ne remplace pas un réglage prudent des retours.
- **Accès multi-appareils avancé** : pour ouvrir la console complète depuis une tablette, il faut le mode serveur HTTPS avec comptes, voir [Fonctions avancées](FONCTIONS_0_2.md). Pour les retours, les QR codes suffisent.
