# XR18 Studio 1.3.0 — Nouvelle interface et console graphique / New interface and graphical console

![Console graphique](https://github.com/herve8940/xr18-studio-/raw/main/docs/images/app-simple.png)

## Français

**Nouvelle interface** :

- Thème sombre moderne, commun à toutes les pages.
- Trois espaces : **Jouer** (Console, Retours, Mon ingé son), **Préparer** (Setlists, Répétitions, Scènes) et **Réglages**.
- Barre du haut avec l’état de la console, **Tout couper** et **Scènes**.
- Console en mode **Simple** (gros faders et Mute/Solo, façade ou retour d’un musicien) ou **Expert** ; le choix est mémorisé.
- Affichage adapté à l’ordinateur, à la tablette (barre d’icônes) et au téléphone (navigation en bas, boutons plus gros).

**Mon ingé son, version complète** :

- Choisir un instrument propose sa configuration complète selon les bonnes pratiques live : coupe-bas, égaliseur 4 bandes, compresseur, gate, position stéréo, nom et couleur.
- Batterie détaillée : kick, snare, tom 1, tom 2, tom 3, OH 1, OH 2 ; guitare rythmique et guitare solo distinctes ; modèles de groupe prêts à l’emploi.
- **Appliquer** par instrument ou **à tout le groupe** ; un réglage non confirmé par la console n’arrête plus les instruments suivants (cause du « seul le premier instrument est appliqué »).
- **Gain guidé** : mesure de chaque instrument, gain proposé pour des crêtes vers −6 dB (par étapes, sans 48 V), mesure de la repisse ; seuils du compresseur et du gate calés sur le signal réel, avec alerte si un gain change ensuite.
- Retours de chaque musicien : bus, rôle, instruments personnels, mix de départ pré-fader visualisé, puis création des QR codes en un clic.

**Retours sur le téléphone de chaque musicien** (Jouer › Retours) :

- Un QR code personnel par musicien, à scanner avec l’appareil photo : la page « Mon retour » s’ouvre dans le navigateur, sans application.
- Chaque lien ne donne accès qu’à **son** retour : niveau de chaque instrument, volume général, mute et réglages enregistrés (« Concert », « Répète »…), rappelés en douceur.
- Sécurité auditive : plafond à 0 dB et montée par petits pas ; baisser est toujours libre. Glisser est nécessaire, toucher seul ne change rien.
- Nouveau lien en un clic si un téléphone est perdu (l’ancien QR cesse aussitôt de fonctionner), retrait d’un musicien, feuille de QR codes imprimable.
- Le partage est arrêté par défaut et ne publie sur le réseau local que cette page : la console complète reste accessible uniquement sur l’ordinateur.

**Console graphique façon X-AIR Edit** (Jouer › Console, mode Expert) :

- **Mêmes vues que X-AIR Edit** : Mixer (vue d’ensemble), Canal, Entrée, Gate, EQ, Comp, Envois, Main, Effets, Routage et Vumètres. La banque de faders est en bas et la barre de mix à droite (Main LR / bus / FX, DCA, Clr Solo, groupes de mute, auto-mix).
- **Explications intégrées** : chaque vue a un panneau « ? Explications » qui décrit chaque option en langage simple. Le [guide de la console](https://github.com/herve8940/xr18-studio-/blob/main/docs/GUIDE_CONSOLE.md) reprend tout, avec la description des 61 effets.
- **Réglages graphiques** : barres verticales, courbes de gate et de compresseur, enveloppes, filtre de déclenchement, EQ interactif, presets gate et compresseur (Kick, Snare, Acoustic/Bass, Vocal), envois avec point de prélèvement, groupes DCA et mute, panoramique.
- **Contrôle direct** par WebSocket : chaque geste est envoyé immédiatement puis relu. Le 48 V, le routage et le type d’effet gardent l’aperçu avec confirmation et sauvegarde. Un musicien ne règle que les envois de ses bus.
- **Synchronisation complète** de l’état de la console à la connexion (Table → PC), comme X-AIR Edit.

**Corrections** (comparaison avec le binaire X-AIR Edit 1.8.1 ; les 689 nœuds OSC du catalogue y sont tous présents) :

- **Écritures refusées à tort** : la console arrondit ses valeurs (coupe-bas et pan sur 101 pas, envois sur 161, gain par 0,5 dB) et la relecture tolérait seulement 0,003. Ces écritures et les rampes des retours in-ear échouaient avec « Lecture différente ». La tolérance suit maintenant la résolution de chaque paramètre, y compris pour la synchronisation PC → Table et les scènes natives.
- **Affichage du fader** : « 50 % / −6 dB relatif » était faux. 0,5 vaut −10 dB et 0 dB est à 0,75.
- **Vumètres** : les 40 valeurs de `/meters/1` sont lues (entrées, aux, retours FX, bus, envois FX, Main), et plus seulement les 16 entrées.
- **Détection** : X18, MR18 et leurs V2 sont acceptées, comme dans X-AIR Edit.
- **Connexion** : toute réponse OSC valide la liaison.
- **Divers** : IP par défaut 192.168.1.1 (point d’accès XR18), lecture du catalogue plus rapide.

**Validation** : 65 tests, dont 4 sur le partage des retours (droits limités au bus, plafond, révocation des liens) et 6 avec un faux mixeur UDP qui arrondit les valeurs comme la console. Paquets Windows, macOS Intel / Apple Silicon et Linux compilés en CI. Les 11 vues ont été testées dans le navigateur contre une XR18 émulée, sans erreur JavaScript. **Non vérifié sur une XR18 physique** : le solo `/-stat/solosw/01-16` et la cadence des vumètres. Paquets non signés / non notariés.

## English

**New interface**:

- Modern dark theme across every page.
- Three spaces: **Jouer** (Play: console, monitors, coach), **Préparer** (Prepare: setlists, rehearsals, scenes) and **Réglages** (Settings).
- Top bar with console status, **Tout couper** (mute all) and **Scènes** (scenes).
- Console in **Simple** mode (large faders and Mute/Solo, front of house or a musician’s monitor) or **Expert** mode; the choice is remembered.
- Layout adapted to computer, tablet (icon bar) and phone (bottom navigation, larger buttons).

**Complete “Mon ingé son”**:

- Picking an instrument offers its complete live setting: high-pass, 4-band EQ, compressor, gate, stereo position, name and colour.
- Detailed drum kit (kick, snare, tom 1–3, OH 1–2), separate rhythm and lead guitar, ready-made band templates.
- Apply per instrument or to the whole band; one value the console does not confirm no longer stops the following instruments.
- **Guided gain staging**: per-instrument measurement, proposed preamp gain for peaks near −6 dB (stepwise, never 48 V), bleed measurement; compressor and gate thresholds fitted to the real signal, flagged when a gain changes later.
- Per-musician monitors: bus, role, own instruments, visual pre-fader starting mix, one-click QR links.

**Monitors on each musician’s phone** (Jouer › Retours):

- One personal QR code per musician, scanned with the phone camera: the “Mon retour” page opens in the browser, no app needed.
- Each link only reaches **that** monitor: level of each instrument, overall volume, mute and saved mixes, recalled smoothly.
- Hearing safety: 0 dB ceiling and small raise steps; lowering is always free. Sliding is required, touching alone changes nothing.
- One-click new link if a phone is lost (the old QR stops working at once), musician removal, printable QR sheet.
- Sharing is off by default and only publishes this page on the local network: the full console stays on the computer only.

**X-AIR Edit–style graphical console** (Jouer › Console, Expert mode):

- **Same views as X-AIR Edit**: Mixer (overview), Channel, Input, Gate, EQ, Comp, Sends, Main, Effects, Routing and Meters. The fader bank is at the bottom and the mix bar on the right (Main LR / bus / FX, DCA, Clr Solo, mute groups, auto mix).
- **Built-in explanations**: each view has a “? Explications” panel describing every option in plain language (French). The [console guide](https://github.com/herve8940/xr18-studio-/blob/main/docs/GUIDE_CONSOLE.md) collects them all, including all 61 effects.
- **Graphical controls**: vertical bars, gate and compressor curves, envelopes, side-chain filter, interactive EQ, gate and compressor presets, sends with tap points, DCA and mute groups, panorama.
- **Direct control** over WebSocket: each move is sent at once, then read back. Phantom power, routing and effect type keep preview, confirmation and backup. Musicians can only adjust their own bus sends.
- **Full console state pull** on connect (Mixer → PC), like X-AIR Edit.

**Fixes** (compared with the X-AIR Edit 1.8.1 binary; all 689 catalogue OSC nodes exist there):

- **Valid writes rejected**: the console rounds its values (low cut and pan to 101 steps, sends to 161, gain to 0.5 dB) while readback allowed only 0.003. These writes and monitor ramps failed with “Lecture différente”. Tolerance now follows each parameter’s resolution, including PC → Mixer sync and native scenes.
- **Fader display**: “50 % / −6 dB relative” was wrong. 0.5 is −10 dB and 0 dB is 0.75.
- **Meters**: all 40 `/meters/1` values are read (inputs, aux, FX returns, buses, FX sends, main), not only the 16 inputs.
- **Discovery**: X18, MR18 and their V2 versions are accepted, like X-AIR Edit.
- **Connection**: any OSC reply confirms the link.
- **Other**: default IP 192.168.1.1 (XR18 access point), faster catalogue reads.

**Validation**: 65 tests, including 4 on monitor sharing (bus-only access, ceiling, link revocation) and 6 against a fake UDP mixer that rounds values like the console. Windows, Intel / Apple Silicon macOS and Linux packages built in CI. All 11 views were tested in the browser against an emulated XR18, with no JavaScript errors. **Not verified on a physical XR18**: solo `/-stat/solosw/01-16` and meter rate. Packages remain unsigned / non-notarized.

---

## XR18 Studio 1.2.0 — Entrées / Input controls

### Français

Vue mixeur : bouton **Entrée / Gain** sur chaque tranche et panneau réel remplaçant l’ancienne courbe EQ illustrative. Cliquer sur **Lire l’entrée** pour relire la source analogique/USB et les paramètres. Affichage et édition du gain du préampli physique réellement affecté au canal ; trim à la place du gain si retour USB. Valeurs en dB et plages fournies par le catalogue serveur, sans conversion inventée côté interface.

Le panneau expose également alimentation 48 V (entrée analogique), inversion de polarité Ø, activation et fréquence du coupe-bas, et raccourcis Égaliseur, Gate/Compresseur, Envois/Retours. Les valeurs absentes restent non lues. Les réglages affichés sont ceux de la dernière lecture ; relire pour les actualiser après utilisation d’une autre application.

Toute écriture passe par l’aperçu existant, une sauvegarde et la comparaison des réponses. Le routage est relu avant application ; si la source a changé, recommencer. Le 48 V exige une confirmation supplémentaire. Le gain et le 48 V appartiennent à la prise physique : d’autres canaux utilisant cette prise sont affectés aussi. Le gain peut changer le niveau du mix et des retours ainsi que la réaction des traitements ; travailler progressivement, sorties à faible niveau.

Validation : compilation backend/frontend, 55 tests existants et vérifications des paquets en CI. Navigateur en simulation : source identifiée, aperçu du gain sans écriture, application avec sauvegarde, deux confirmations pour le 48 V, aucune erreur JavaScript. Essai matériel des nouvelles commandes encore nécessaire. Ce changement n’ajoute pas un Solo/PFL sur les tranches. Paquets non signés/notariés.

### English

Mixer strips now include **Entrée / Gain** and a real input control panel replaces the previous illustrative EQ chart. **Lire l’entrée** reads analog/USB source selection and parameters. It shows the actual mapped analog preamp gain or USB return trim, using dB values and ranges from the server catalog.

Also available: analog phantom power, polarity inversion, high-pass enable/frequency, and shortcuts to EQ, Gate/Compressor and Sends/Monitors. Missing values remain unread. Displayed values reflect the last explicit read; refresh after editing in another app.

Writes use existing preview, backup and readback checks. Source routing is read again before applying; a changed source requires restarting. Phantom power requires an additional confirmation. Gain and phantom affect the physical input, including other channels mapped to it. Gain can alter main/monitor levels and processing response; adjust gradually with low output levels.

Validation: backend/frontend builds, 55 existing tests and CI package checks. Browser simulation covers source identification, preview without writes, gain application with backup, separate phantom confirmation and no JavaScript errors. Physical testing of these new controls remains required. This change does not add strip Solo/PFL. Packages remain unsigned/non-notarized.
