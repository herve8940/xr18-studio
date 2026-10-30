# Mon ingé son — XR18 Studio 1.3

L’accueil propose un parcours pour préparer le groupe sans connaître les noms des paramètres OSC. Le mode avancé et les fonctions de console restent accessibles.

## Commencer

1. **Brancher et connecter** : vérifier les câbles et la connexion, avec les sorties à faible volume pendant la préparation.
2. **Dire qui est branché où** : partir d’un modèle (rock + TD-27, rock + batterie acoustique détaillée, acoustique/duo) ou ajouter la batterie détaillée (kick, snare, tom 1, tom 2, tom 3, OH 1, OH 2), puis adapter entrées et noms aux vrais branchements. Choisir un instrument propose aussitôt sa configuration complète. L’application ne détecte pas les instruments et ne crée pas de lien stéréo.
3. **Faire jouer un musicien à la fois** : observer environ cinq secondes de niveaux reçus. La simulation ne fabrique ni mesure ni diagnostic audio. Un niveau reçu ne permet pas de localiser l’étage qui sature.
4. **Écouter et corriger** : choisir une gêne (« brouillon », « agressif », « notes coupées »…) ou la décrire avec ses mots. Le conseiller distingue observations OSC, description de l’utilisateur et hypothèses à écouter.
5. **Préparer les retours** : un musicien par bus (Aux 1 à 6), avec rôle et instruments personnels ; mix de départ pré-fader selon le rôle, puis lien QR personnel pour affiner depuis le téléphone.
6. **Garder le bon réglage** : sauvegarder une scène complète. Une nouvelle salle ou un changement de micros nécessite une nouvelle vérification.

Les coches du parcours indiquent les étapes confirmées par l’utilisateur, pas une qualification automatique de la balance. La préparation et ces coches sont conservées dans SQLite.

## Configuration complète par instrument

Chaque instrument reçoit nom, couleur, coupe-bas, égaliseur 4 bandes, compresseur (taux, attaque, relâchement, seuil de départ, genou doux, détection RMS), gate et position stéréo. Le seuil est un **point de départ** pour une entrée réglée avec des crêtes vers −6 dBFS ; à affiner à l’écoute pour obtenir la réduction visée.

| Instrument | Coupe-bas | Compresseur (départ) | Gate (départ) | Pan |
|---|---|---|---|---|
| Chant principal | 100 Hz | 3:1 dès −20 dB | — | centre |
| Chœurs | 120 Hz | 2,5:1 dès −22 dB | — | 15 % G |
| Guitare rythmique | 85 Hz | 2:1 dès −16 dB | — | 35 % G |
| Guitare solo | 85 Hz | 2,5:1 dès −18 dB | — | 35 % D |
| Basse (DI) | 40 Hz | 4:1 dès −20 dB | — | centre |
| Kick | 35 Hz | 4:1 dès −16 dB | gate −40 dB | centre |
| Snare | 90 Hz | 4:1 dès −16 dB | expandeur −45 dB | centre |
| Tom 1 / 2 / 3 | 80 / 65 / 45 Hz | 3:1 dès −18 dB | gate −42 / −42 / −44 dB | 30 % G / 10 % D / 45 % D |
| OH 1 / OH 2 | 180 Hz | 2:1 dès −18 dB | — | 70 % G / 70 % D |
| Charleston | 300 Hz | 1,5:1 dès −18 dB | — | 45 % G |
| Batterie électronique L/R | 35 Hz | désactivé | — | 100 % G / D |
| Clavier | 80 Hz | 2:1 dès −20 dB | — | 20 % D |

Le placement de la batterie suit la perspective du batteur (charleston et tom aigu à gauche). Les gains d’entrée, le 48 V, les faders, mutes et routages ne sont jamais modifiés. **Appliquer** configure une ligne, **Appliquer à tout le groupe** configure tous les instruments ; si la console ne confirme pas une valeur, l’application la réessaie, poursuit avec les autres et liste celles à relancer.

## Retours par musicien

Le mix de départ est envoyé en **pré-fader** (indépendant de la façade). Les instruments du musicien sont à −3 dB ; le reste suit son rôle :

| Rôle | Voix | Guitares | Basse | Kick | Snare | Toms | Cymbales |
|---|---|---|---|---|---|---|---|
| Chanteur·se | −3 | −16 | −14 | −10 | −14 | −24 | −26 |
| Guitariste | −8 | −12 | −14 | −10 | −12 | −24 | −26 |
| Bassiste | −10 | −16 | −4 | −5 | −10 | −20 | −26 |
| Batteur·se | −8 | −15 | −5 | −6 | −14 | −22 | coupé |
| Claviériste | −8 | −15 | −12 | −10 | −12 | −24 | −26 |

Pour un batteur sur batterie acoustique, ses propres micros suivent ce tableau (il entend déjà son kit) ; sur batterie électronique, le kit passe devant. Le bus est nommé, retiré de la façade (LR off) et démarré à −10 dB. Les retours d’effets ne sont pas modifiés. **Créer les QR codes des musiciens** crée un lien personnel par bus qui n’en a pas encore.

## Corrections à l’écoute

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
