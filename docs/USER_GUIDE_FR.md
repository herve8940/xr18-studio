# XR18 Studio 1.0 — Guide utilisateur

[English](USER_GUIDE_EN.md) · [Téléchargements](https://github.com/herve8940/xr18-studio-/releases/latest) · [Accueil](../README.md)

## Installer et ouvrir

Aucun Node.js, terminal ou serveur à installer : le moteur et l’interface sont inclus.

| Ordinateur | Fichier à télécharger | Installation |
|---|---|---|
| Windows x64 | `XR18-Studio-Windows-1.0.0.exe` | Double-cliquer ; installation pour ton compte et raccourci automatique. |
| Mac Intel | `XR18-Studio-macOS-1.0.0-x64.dmg` | Ouvrir et glisser XR18 Studio dans Applications. |
| Mac Apple Silicon | `XR18-Studio-macOS-1.0.0-arm64.dmg` | Ouvrir et glisser XR18 Studio dans Applications. |
| Ubuntu/Debian x64 | fichier `.deb` | Ouvrir avec l’installateur de logiciels de ta distribution. |
| Autres Linux x64 | fichier `.AppImage` | Autoriser son exécution dans les propriétés du fichier, puis l’ouvrir. |

Ces paquets ne sont pas signés/notariés par un certificat commercial. Windows ou macOS peut demander une autorisation supplémentaire ou bloquer l’ouverture selon sa politique. Vérifier la provenance et les sommes SHA-256 publiées avec la version ; ne pas désactiver globalement les protections du système. Sur un Mac personnel, utiliser l’autorisation proposée dans Réglages Système > Confidentialité et sécurité si elle est disponible. Un ordinateur administré peut nécessiter l’intervention de son administrateur.

Les compilations ciblent Windows x64, Mac Intel et Apple Silicon, Linux x64 récents. Les vieux iPad ne sont pas une cible garantie ; ils n’exécutent pas l’installateur de bureau. L’accès tablette exige le mode serveur HTTPS et des comptes, voir [multiappareils](FONCTIONS_0_2.md).

## 1. Découvrir sans console

Au premier démarrage, l’application s’ouvre en simulation sur **Mon ingé son**. Tu peux découvrir le parcours sans modifier ta XR18. Les curseurs simulés ne constituent pas des mesures audio. Les noms de la capture sont des exemples.

![Console : 16 entrées et Main L/R](images/console.png)

Chaque colonne représente une entrée ; Main L/R représente la sortie principale. Le curseur règle le volume du mix, le bouton M coupe le canal. Les onglets donnent accès aux contrôles, à l’EQ, aux traitements dynamiques, aux envois, aux effets, au routage et aux DCA. Les paramètres détaillés et l’aperçu des changements font foi ; la petite courbe d’EQ illustrative de la vue Mixage n’est pas une mesure de la console.

## 2. Connecter la XR18

1. Allumer la console et relier l’ordinateur au même réseau local.
2. Ouvrir **Configuration**, puis **Détecter et connecter ma XR18** (également accessible dans le menu Connexion de l’application).
3. Une console : connexion en lecture seule. Plusieurs : choisir la bonne console.
4. Vérifier les noms des canaux et l’état de connexion. Pour agir sur la console, choisir **Activer le contrôle** et confirmer.

Pas de redémarrage ni de fichier technique à modifier. La connexion est mémorisée. Si la détection échoue, vérifier le pare-feu et le réseau commun ; les réseaux invités/VLAN peuvent bloquer la découverte. Une adresse IP peut être saisie en secours. [Détails](CONNEXION_XR18.md).

## 3. Préparer le groupe avec « Mon ingé son »

![Parcours Mon ingé son, en simulation](images/coach.png)

Suivre les six étapes : connecter, indiquer les instruments, faire jouer chaque musicien, corriger une gêne, préparer les retours, sauvegarder. Le modèle propose chant, deux guitares, basse et TD-27 gauche/droite : adapter les numéros à tes vrais branchements. Le logiciel ne reconnaît pas automatiquement l’instrument branché et ne crée pas automatiquement un lien stéréo.

**Préparer une base douce** propose des noms, couleurs et traitements légers. Vérifier l’aperçu avant de confirmer. Le gain d’entrée, le 48 V, les faders et le routage ne sont pas modifiés par cette préparation. Les étapes cochées sont tes propres confirmations, pas une certification automatique.

## 4. Vérifier et améliorer le son

Faire jouer une personne et choisir **Vérifier le signal** : environ cinq secondes de mesures OSC récentes sont nécessaires. Sans console réelle ou sans données fraîches, aucun niveau n’est inventé. Ce contrôle ne mesure ni le niveau dans les oreilles, ni le spectre, ni la qualité acoustique.

Choisir l’instrument puis un problème (« voix étouffée », « trop de graves »…), ou l’expliquer avec tes mots. Le conseiller local propose des vérifications et, lorsque cela convient, une petite correction à prévisualiser. Confirmer pour l’essayer ; utiliser **Annuler le dernier réglage guidé** pour préparer le retour au réglage sauvegardé. Écouter après chaque changement.

L’assistant reçoit les paramètres et niveaux OSC, **pas le son**. Les conseils de timbre sont des hypothèses basées sur ta description. En cas de larsen ou de niveau excessif, réduire immédiatement le niveau concerné et vérifier le placement des micros et enceintes ; ne pas attendre une analyse automatique.

## 5. Retours, effets et scènes

- **Retours in-ear** : choisir le bus du musicien et ajuster progressivement les envois. Commencer bas et vérifier le volume du récepteur. Une limite numérique n’est pas une garantie de protection auditive.
- **Effets / Contrôles** : lire les paramètres, préparer les changements puis confirmer. Conserver une sauvegarde avant une modification importante.
- **Scènes** : capturer une scène complète au format JSON Studio version 2 et la retrouver dans la bibliothèque serveur. Ne pas confondre avec les snapshots rapides de faders stockés dans le navigateur.
- **Fichiers `.scn` existants** : import, archivage et export possibles ; un rappel contenant des paramètres FX textuels non interprétables est bloqué avant écriture. Pour convertir : charger le `.scn` dans X Air Edit sur la console, connecter Studio puis capturer une scène complète JSON v2. Le rappel universel de tous les `.scn` n’est pas garanti.

## 6. IA facultative, ReaCue et musiciens

Le conseiller local fonctionne sans abonnement ni clé API. Pour le dialogue OpenAI facultatif, ouvrir la configuration IA de l’application de bureau et renseigner ta clé API et un modèle compatible Responses et sorties structurées. La clé est chiffrée avec le coffre du système ; une plateforme sans coffre sécurisé peut refuser l’enregistrement. Ne jamais mettre la clé dans GitHub. L’utilisation API est facturée séparément de ChatGPT.

L’envoi externe exige ton accord. Seuls la question, le type d’instrument et l’état de connexion sont envoyés, sans audio ni scènes. Les réponses IA sont consultatives et ne pilotent pas directement la console. [Détails](INGE_SON.md).

Pour REAPER/ReaCue, installer l’action Lua et le pont fournis dans `integrations/`, puis suivre [SHOW_CONTROL](SHOW_CONTROL.md). Les musiciens utilisent les comptes et permissions de bus ; l’accès réseau exige HTTPS et des comptes configurés, voir [FONCTIONS_0_2](FONCTIONS_0_2.md). Le paquet de bureau démarre localement ; il n’expose pas automatiquement un serveur pour iPad.

## Sauvegarde, mise à jour et assistance

Exporter les scènes importantes et conserver une copie du dossier de données utilisateur avant une mise à jour. L’application de bureau conserve SQLite et la connexion dans son dossier utilisateur système ; les snapshots locaux dépendent du navigateur. Une mise à jour ne remplace pas une sauvegarde.

Télécharger le nouvel installateur depuis les versions GitHub et fermer Studio avant de l’installer. Il n’y a pas de mise à jour automatique silencieuse. Pour signaler un problème, joindre le système, la version, le mode réel/simulation et les étapes de reproduction, sans clé API ni mot de passe.

## Validation de la 1.0

La publication automatique exige tests, compilation et fabrication des quatre paquets, ainsi qu’un démarrage des applications empaquetées. Les contrôles logiciels et l’émulateur OSC ne remplacent pas un essai avec une XR18 physique, les retours réels et REAPER. Aucune qualification concert ni compatibilité universelle avec les anciens appareils n’est revendiquée. Les notes de version indiquent les résultats disponibles.

## Synchronisation dans les deux sens (1.1)

Après connexion, Configuration affiche **Sens de synchronisation**, avec **Table → PC** sélectionné et le bouton **Synchroniser**. Ce panneau reste disponible à tout moment.

- **Table → PC** : relire le catalogue connu de la console et conserver une nouvelle copie PC. À utiliser après des réglages dans X Air. Aucun réglage n’est envoyé.
- **PC → Table** : activer le contrôle, sélectionner une copie PC ou une scène complète, puis cliquer sur Synchroniser pour afficher les différences. Confirmer l’envoi après vérification. Le 48 V est exclu par défaut ; son inclusion et son application demandent des accords distincts.

La préparation en simulation est conservée avant la connexion. Les copies PC restent distinctes des valeurs reçues en direct. Une préparation non réglée contient des valeurs par défaut : ne pas l’envoyer sans vérifier. La table est sauvegardée avant envoi ; un changement depuis l’aperçu fait refuser l’application. Ne pas manipuler les autres applications pendant l’opération : il n’existe pas de verrouillage OSC entre clients. En cas d’échec, l’état peut être partiel et la sauvegarde reste dans les scènes. Une capture échoue si un paramètre du catalogue est indisponible.
