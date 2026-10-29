# XR18 Studio 1.3.0 — Console graphique / Graphical console

![Console graphique](https://github.com/herve8940/xr18-studio-/raw/main/docs/images/console.png)

## Français

**Console graphique façon X-AIR Edit** (Console › Mixage) :

- **Tranches** : nom et couleur lus sur la console, gain du préampli réellement affecté (ou trim USB), pan, M / S / LR, fader gradué en dB et vumètre avec maintien de crête.
- **Mix sur les faders** : Main LR, Bus 1-6 ou FX 1-4 (« sends on fader »), plus une vue Bus · FX · DCA.
- **Tranche sélectionnée** : égaliseur interactif (courbe calculée, points déplaçables, Q à la molette, coupe-bas), gate et compresseur avec courbe de transfert, 10 envois avec leur point de prélèvement.
- **Contrôle direct** par WebSocket : chaque geste est envoyé immédiatement puis relu. Le 48 V, le routage et l’algorithme FX gardent l’aperçu avec confirmation. Un musicien ne règle que les envois de ses bus.
- **Synchronisation complète** de l’état de la console à la connexion (Table → PC), comme X-AIR Edit.

**Corrections** (comparaison avec le binaire X-AIR Edit 1.8.1 ; les 689 nœuds OSC du catalogue y sont tous présents) :

- **Écritures refusées à tort** : la console arrondit ses valeurs (coupe-bas et pan sur 101 pas, envois sur 161, gain par 0,5 dB) et la relecture tolérait seulement 0,003. Ces écritures et les rampes des retours in-ear échouaient avec « Lecture différente ». La tolérance suit maintenant la résolution de chaque paramètre, y compris pour la synchronisation PC → Table et les scènes natives.
- **Affichage du fader** : « 50 % / −6 dB relatif » était faux. 0,5 vaut −10 dB et 0 dB est à 0,75.
- **Vumètres** : les 40 valeurs de `/meters/1` sont lues (entrées, aux, retours FX, bus, envois FX, Main), et plus seulement les 16 entrées.
- **Détection** : X18, MR18 et leurs V2 sont acceptées, comme dans X-AIR Edit.
- **Connexion** : toute réponse OSC valide la liaison.
- **Divers** : IP par défaut 192.168.1.1 (point d’accès XR18), lecture du catalogue plus rapide.

**Validation** : 61 tests, dont 6 avec un faux mixeur UDP qui arrondit les valeurs comme la console. Paquets Windows, macOS Intel / Apple Silicon et Linux compilés en CI. Navigateur testé contre une XR18 émulée, sans erreur JavaScript. **Non vérifié sur une XR18 physique** : le solo `/-stat/solosw/01-16` et la cadence des vumètres. Paquets non signés / non notariés.

## English

**X-AIR Edit–style graphical console** (Console › Mixage):

- **Strips**: console name and colour, mapped preamp gain (or USB trim), pan, M / S / LR, dB-scaled fader and peak-hold meter.
- **Mix on faders**: Main LR, Bus 1-6 or FX 1-4 (“sends on fader”), plus a Bus · FX · DCA view.
- **Selected strip**: interactive EQ (calculated curve, draggable points, wheel for Q, low cut), gate and compressor with transfer curve, 10 sends with tap points.
- **Direct control** over WebSocket: each move is sent at once, then read back. Phantom power, routing and FX algorithm keep preview and confirmation. Musicians can only adjust their own bus sends.
- **Full console state pull** on connect (Mixer → PC), like X-AIR Edit.

**Fixes** (compared with the X-AIR Edit 1.8.1 binary; all 689 catalogue OSC nodes exist there):

- **Valid writes rejected**: the console rounds its values (low cut and pan to 101 steps, sends to 161, gain to 0.5 dB) while readback allowed only 0.003. These writes and monitor ramps failed with “Lecture différente”. Tolerance now follows each parameter’s resolution, including PC → Mixer sync and native scenes.
- **Fader display**: “50 % / −6 dB relative” was wrong. 0.5 is −10 dB and 0 dB is 0.75.
- **Meters**: all 40 `/meters/1` values are read (inputs, aux, FX returns, buses, FX sends, main), not only the 16 inputs.
- **Discovery**: X18, MR18 and their V2 versions are accepted, like X-AIR Edit.
- **Connection**: any OSC reply confirms the link.
- **Other**: default IP 192.168.1.1 (XR18 access point), faster catalogue reads.

**Validation**: 61 tests, 6 of them against a fake UDP mixer that rounds values like the console. Windows, Intel / Apple Silicon macOS and Linux packages built in CI. Browser tested against an emulated XR18 with no JavaScript errors. **Not verified on a physical XR18**: solo `/-stat/solosw/01-16` and meter rate. Packages remain unsigned / non-notarized.

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
