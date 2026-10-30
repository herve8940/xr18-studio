# XR18 Studio 2.0.0 — Ton ingé son de poche / Your pocket sound engineer

![XR18 Studio](https://github.com/herve8940/xr18-studio/raw/main/docs/images/hero.png)

🇫🇷 [Tuto illustré « Mon ingé son »](https://github.com/herve8940/xr18-studio/blob/main/docs/TUTO_MON_INGE_SON.md) · 🇬🇧 [Illustrated tutorial](https://github.com/herve8940/xr18-studio/blob/main/docs/TUTO_MON_INGE_SON_EN.md)

## Français

### Quel fichier télécharger ?

| Ordinateur | Fichier |
|---|---|
| Windows | `XR18-Studio-Windows-2.0.0.exe` |
| Mac Apple Silicon (M1, M2, M3, M4) | `XR18-Studio-macOS-2.0.0-arm64.dmg` |
| Mac Intel | `XR18-Studio-macOS-2.0.0-x64.dmg` |
| Ubuntu / Debian | `XR18-Studio-Linux-2.0.0-amd64.deb` |
| Autre Linux | `XR18-Studio-Linux-2.0.0-x86_64.AppImage` |

Mac : la première fois, **clic droit › Ouvrir**, puis autorise le **Réseau local** (*Réglages Système › Confidentialité et sécurité*). Windows : si SmartScreen s’affiche, **Informations complémentaires › Exécuter quand même**. Les paquets ne sont pas signés par un certificat commercial ; `SHA256SUMS.txt` permet de vérifier les fichiers.

### Nouveautés

**Toute la console d’un coup d’œil**

- Les modes **Simple** et **Expert** tiennent dans la fenêtre : toutes les pistes sont visibles en même temps, sans faire défiler. C’est vérifié de 1280×800 à 1920×1080.
- Les tranches s’adaptent à la largeur : noms sur deux lignes, valeurs et boutons compacts quand la place manque.
- En mode Expert, la vue d’ensemble et la banque de faders restent alignées. Les explications et la barre de mix sont dans une colonne à droite.
- Le menu se replie tout seul sur la page Console. Le bouton **Réduire le menu** le replie ou le rouvre partout.

**Partir d’une scène vierge**

- Un bouton remet toute la console à neutre : noms, couleurs, traitements, égaliseurs à plat, pan au centre, envois fermés, volumes en bas.
- Le **48 V**, les **gains**, le **routage** et les **effets** ne sont jamais touchés.
- Une fenêtre montre d’abord ce qui va changer, une sauvegarde est faite, et **Revenir à avant** annule en un clic.
- Le bouton est disponible dans le mode Expert et dans Mon ingé son (étape 2).

**Mon ingé son, version complète**

- **Configuration complète par instrument**, selon les bonnes pratiques live : coupe-bas, égaliseur 4 bandes, compresseur, gate, position stéréo, nom et couleur. Choisir un instrument la propose aussitôt.
- **Batterie détaillée** : kick, snare, tom 1, tom 2, tom 3, OH 1, OH 2. Guitare rythmique et guitare solo sont séparées.
- **Modèles de groupe** prêts à l’emploi.
- **Appliquer** par instrument ou **à tout le groupe**. Corrigé : si la console ne confirmait pas un seul réglage, les instruments suivants n’étaient pas appliqués.
- **Gain guidé** : mesure de chaque instrument et gain proposé pour viser −6 dB, par étapes de +6 dB maximum, sans jamais toucher au 48 V. La repisse est mesurée, et le compresseur et le gate sont calés sur ton vrai signal. L’appli te prévient si un gain change ensuite.
- **Retours de chaque musicien** : bus, rôle, instruments personnels, et un mix de départ pré-fader affiché en barres. Les QR codes se créent en un clic.
- **Pour débutants** : un lexique « Les mots du son ». La fenêtre de vérification se ferme par la croix, Échap ou un clic à côté, et elle ne liste que les réglages qui changent.

**Déjà dans les versions précédentes**

- Les retours sur le téléphone de chaque musicien, par QR code personnel :
  - chacun ne règle que **son** retour ;
  - le volume est plafonné à 0 dB ;
  - un lien perdu se remplace en un clic.
- La console graphique façon X-AIR Edit, avec 11 vues, des explications en langage simple et le contrôle direct avec relecture.
- La détection automatique de la console, comme X-AIR Edit (XR18, X18, MR18).

**Validation** : 72 tests automatiques. Les parcours complets (6 étapes du coach, scène vierge, retours, téléphone) ont été testés dans le navigateur contre une XR18 émulée, sans erreur. Les paquets des 4 plateformes sont compilés et lancés en CI. **À vérifier sur ta XR18 physique avant un concert.**

## English

### Which file?

| Computer | File |
|---|---|
| Windows | `XR18-Studio-Windows-2.0.0.exe` |
| Apple Silicon Mac (M1, M2, M3, M4) | `XR18-Studio-macOS-2.0.0-arm64.dmg` |
| Intel Mac | `XR18-Studio-macOS-2.0.0-x64.dmg` |
| Ubuntu / Debian | `XR18-Studio-Linux-2.0.0-amd64.deb` |
| Other Linux | `XR18-Studio-Linux-2.0.0-x86_64.AppImage` |

Mac: the first time, **right-click › Open**, then allow **Local Network** (*System Settings › Privacy & Security*). Windows: if SmartScreen appears, **More info › Run anyway**. The packages are not signed with a commercial certificate; use `SHA256SUMS.txt` to check the files.

### What’s new

**The whole mixer at a glance**

- **Simple** and **Expert** modes fit the window: every track is visible at once, with no scrolling. Checked from 1280×800 to 1920×1080.
- Strips adapt to the width, with two-line names and compact values and buttons when space is short.
- In Expert mode, the overview and the fader bank stay aligned. Explanations and the mix bar sit in a column on the right.
- The menu folds automatically on the Console page. **Réduire le menu** folds or opens it anywhere.

**Start from a blank scene**

- One button resets the whole mixer to neutral: names, colours, processing, flat EQs, centred pan, closed sends, levels down.
- **48 V**, **gains**, **routing** and **effects** are never touched.
- A window first shows what will change, a backup is made, and **Revenir à avant** undoes it in one click.
- The button is available in Expert mode and in Mon ingé son (step 2).

**Complete “Mon ingé son”**

- **Complete per-instrument setup** following live best practice: high-pass, 4-band EQ, compressor, gate, stereo position, name and colour. Picking an instrument offers it straight away.
- **Detailed drum kit**: kick, snare, tom 1, tom 2, tom 3, OH 1, OH 2. Rhythm and lead guitar are separate.
- **Band templates**, ready to use.
- Apply **per instrument** or **to the whole band**. Fixed: if the console did not confirm a single value, the following instruments were not applied.
- **Guided gain staging**: each instrument is measured and the gain proposed to reach −6 dB, in steps of at most +6 dB, never touching 48 V. Bleed is measured, and compressor and gate are fitted to your real signal. The app warns you if a gain changes later.
- **Each musician’s monitor mix**: bus, role, own instruments, and a pre-fader starting mix shown as bars. QR codes are created in one click.
- **For beginners**: a “sound words” glossary. The check window closes with the X, Escape or a click outside, and lists only the settings that change.

**Already in previous versions**

- Monitors on each musician’s phone, through a personal QR code:
  - each musician adjusts only **their own** mix;
  - volume is capped at 0 dB;
  - a lost link is replaced in one click.
- The X-AIR Edit–style graphical console, with 11 views, plain-language explanations, and direct control with read-back.
- Automatic console discovery, like X-AIR Edit (XR18, X18, MR18).

**Validation**: 72 automated tests. The full journeys (the coach’s 6 steps, blank scene, monitors, phone) were tested in the browser against an emulated XR18, with no errors. Packages for all 4 platforms are built and launched in CI. **Check on your physical XR18 before a show.**
