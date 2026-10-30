# Alignement sur X-AIR Edit 1.8.1

Analyse du binaire macOS de X-AIR Edit 1.8.1 (Intel, JUCE). Les chaînes OSC ont été comparées au catalogue de `scene-schema.ts`.

## Ce qui a été vérifié

- Les 689 nœuds OSC du catalogue existent tous dans X-AIR Edit (`/ch`, `/rtn`, `/bus`, `/fxsend`, `/lr`, `/dca`, `/fx`, `/headamp`, `/routing`, `/config`). Aucune adresse inventée.
- X-AIR Edit utilise en plus `/xremotenfb`, `/batchsubscribe`, `/renew`, `/unsubscribe`, `/meters/0…7`, `/-stat/solosw/NN`, `/-snap/NN` et `/-prefs/...`.
- Modèles reconnus par X-AIR Edit pour la carte à 18 canaux : XR18, X18, MR18 et leurs versions V2.

## Corrections

| Problème | Effet | Correction |
|---|---|---|
| Relecture comparée à ±0,003 | La console quantifie : coupe-bas et pan sur 101 pas, envois sur 161, gain par pas de 0,5 dB… Les écritures normales échouaient avec « Lecture différente », de même que les rampes des retours in-ear. | Tolérance d’un demi-pas par paramètre (`readbackTolerance`), appliquée aussi à la synchro PC/console et aux scènes natives. |
| Détection limitée à XR18/XR18V2 | X18 et MR18 refusés. | Toute la famille 18 canaux est acceptée. XR12/XR16 restent exclus. |
| Liaison « vivante » seulement sur fader, mute ou vumètre | Les autres réponses ne prouvaient pas la connexion. | Toute réponse OSC valide rafraîchit la liaison. |
| Vumètres limités aux 16 entrées | Aux, retours FX, bus, envois FX et main absents. | Les 40 valeurs de `/meters/1` sont exposées (`meters.all`). |
| Affichage fader « 50 % / −6 dB relatif » | Valeur fausse : 0,5 vaut −10 dB sur la loi X-Air. | Loi X-Air en 4 segments (0,75 = 0 dB). |
| IP par défaut 192.168.1.100 | Ne correspond pas au point d’accès XR18. | 192.168.1.1. |
| Catalogue en O(n²) | Lent une fois l’état complet chargé. | État lu une seule fois. |

## Console graphique

Le menu **Console**, onglet **Console**, reproduit les vues de X-AIR Edit : Mixer, Canal, Entrée, Gate, EQ, Comp, Envois, Main, Effets, Routage et Vumètres. La banque de faders est en bas et la barre de mix à droite. Chaque option est expliquée dans l’application (« ? Explications ») et dans le [guide de la console](GUIDE_CONSOLE.md).

Le contrôle direct passe par le WebSocket (`{type:'set'}`), comme les gestes de X-AIR Edit : la valeur est envoyée immédiatement, puis relue 300 ms après le dernier mouvement. Le 48 V, le routage et le type d’effet passent par la prévisualisation avec confirmation (`/api/console/preview` puis `/api/console/apply`). Un musicien ne peut régler que les envois de ses propres bus.

Les noms complets des 61 algorithmes d’effet ont été relevés dans le binaire de X-AIR Edit (Hall Reverb, Stereo Delay, Modulation Delay…).

À vérifier sur la XR18 physique : le mapping solo `/-stat/solosw/01-16` et la cadence des vumètres.
