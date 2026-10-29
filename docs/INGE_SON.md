# Mon ingé son — XR18 Studio 0.3

L’accueil propose un parcours pour préparer le groupe sans connaître les noms des paramètres OSC. Le mode avancé et les fonctions de console restent accessibles.

## Commencer

1. **Brancher et connecter** : vérifier les câbles et la connexion, avec les sorties à faible volume pendant la préparation.
2. **Dire qui est branché où** : adapter les entrées et noms aux vrais branchements. Le modèle fourni prévoit chant, deux guitares, basse et TD-27 stéréo. Il ne détecte pas les instruments et ne crée pas automatiquement de lien stéréo.
3. **Faire jouer un musicien à la fois** : observer environ cinq secondes de niveaux reçus. La simulation ne fabrique ni mesure ni diagnostic audio. Un niveau reçu ne permet pas de localiser l’étage qui sature.
4. **Écouter et corriger** : choisir une gêne (« brouillon », « agressif », « notes coupées »…) ou la décrire avec ses mots. Le conseiller distingue observations OSC, description de l’utilisateur et hypothèses à écouter.
5. **Préparer les retours** : rejoindre les mixes in-ear autorisés, ajuster un instrument à la fois et sauvegarder les profils.
6. **Garder le bon réglage** : sauvegarder une scène complète. Une nouvelle salle ou un changement de micros nécessite une nouvelle vérification.

Les coches du parcours indiquent les étapes confirmées par l’utilisateur, pas une qualification automatique de la balance. La préparation et ces coches sont conservées dans SQLite.

## Base douce et corrections

La base propose noms, couleurs, coupe-bas et quatre bandes d’EQ avec gains limités à ±2 dB ; elle désactive compresseur et gate pour commencer. Les réglages de traitement concernés sont remplacés après confirmation. Elle ne modifie pas les gains de préampli, 48 V, faders, mutes, pan, routages ou liens stéréo.

Les corrections sont des essais bornés : une réduction EQ ciblée ou la désactivation du gate d’un canal. Une bande utilisant un autre type de filtre n’est pas remplacée à l’aveugle. Une bande déjà très réduite ne continue pas à être creusée. Les fréquences proposées sont des hypothèses musicales, pas le résultat d’une analyse du signal.

Les problèmes de larsen, saturation, bruit, déséquilibre, compression et réverbération donnent d’abord des vérifications adaptées ; aucun seuil de compresseur, fréquence de larsen ou re-routage n’est inventé. Les slots FX partagés ne sont pas remplacés par le conseiller.

Chaque réglage suit prévisualisation, confirmation, sauvegarde et comparaison du moteur existant. **Annuler le dernier réglage guidé** prépare le retour des seuls paramètres concernés ; vérifier la comparaison si des changements manuels ont été faits entre-temps. Une proposition expire au bout d’une minute et devient inutilisable si son état de référence a changé.

## Deux façons de dialoguer

### Conseiller local

Disponible sans compte API, il reconnaît des descriptions françaises de problèmes courants et propose des conseils explicites. Il s’agit d’un moteur local de règles et de recommandations, pas d’une conversation générée par ChatGPT. Aucune description n’est envoyée à un service externe dans ce mode.

### IA connectée facultative

Dans l’application de bureau, ouvrir l’étape Écouter et corriger, puis **Configurer l’IA dans l’application de bureau**. Saisir une clé OpenAI API et le nom d’un modèle du compte compatible Responses et sorties structurées. La clé n’est pas un identifiant ChatGPT ; l’application n’utilise pas automatiquement l’abonnement de cette conversation. L’utilisation est facturée selon le compte API configuré.

La clé est enregistrée chiffrée via le mécanisme du système fourni par Electron safeStorage ; une configuration refusant le chiffrement n’enregistre pas la clé. Sous Linux, le backend basic_text est refusé. Seule la fenêtre principale locale, avec une session administrateur, peut configurer l’IA. L’API web ne renvoie jamais la clé. Le champ est vidé après enregistrement et la clé peut être supprimée depuis le même formulaire.

Pour un démarrage Node/web, définir sur le serveur, sans jamais les mettre dans le code ou dans le navigateur :

```text
XR18_OPENAI_API_KEY=clé_du_compte_API
XR18_OPENAI_MODEL=modèle_compatible_du_compte
```

Activer ensuite l’option IA et accepter l’envoi. Chaque demande connectée envoie uniquement la question, le type d’instrument, le mode simulation/réel et l’état de connexion. Aucun audio, clé de configuration, adresse IP de la console, scène complète ou mot de passe utilisateur n’est inclus dans le contexte. La clé API sert uniquement à l’en-tête d’authentification du serveur vers OpenAI. Le paramètre API store est false ; cela ne constitue pas une promesse d’absence de toute conservation technique par le fournisseur.

La réponse contient conseils, vérifications et une question éventuelle. Elle n’est jamais interprétée comme des commandes. Les corrections applicables proviennent exclusivement du moteur local avec ses contrôles. Une erreur IA n’envoie aucun réglage et laisse le conseiller local disponible. Aucun appel IA réel n’a été effectué pendant les tests : le protocole est testé avec une réponse simulée.

## Ce que le conseiller ne sait pas faire

Il ne reçoit pas les signaux audio par OSC et ne prétend pas entendre le mixage, détecter le spectre, identifier une fréquence de larsen ou mesurer le niveau acoustique dans les écouteurs. Il ne remplace pas une écoute sur place. Les chemins matériels, l’ergonomie dans la répétition et le dialogue connecté doivent encore être essayés dans l’installation réelle de l’utilisateur.

## Références

Conseils de placement, feedback et écoute : [Shure — How do I fix my feedback problem?](https://service.shure.com/articles/en_US/Knowledge/how-do-i-fix-my-feedback-problem), [Shure — Basics of equalization and feedback](https://service.shure.com/articles/en_US/Knowledge/basics-of-equalization-and-feedback), [Yamaha — How to use a compressor](https://hub.yamaha.com/proaudio/livesound/tools-of-the-trade-how-to-use-a-compressor/), [Yamaha — Band PA beginners guide](https://europe.yamaha.com/en/audio/portable-pa/explore/pa-beginners-guide/setting/band-pa.html).

Interface de dialogue : [OpenAI — Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs). Les valeurs de départ sont des suggestions éditables ; elles ne sont pas des presets officiels Behringer.
