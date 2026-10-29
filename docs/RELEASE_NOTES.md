# XR18 Studio 1.2.0 — Entrées / Input controls

## Français

Vue mixeur : bouton **Entrée / Gain** sur chaque tranche et panneau réel remplaçant l’ancienne courbe EQ illustrative. Cliquer sur **Lire l’entrée** pour relire la source analogique/USB et les paramètres. Affichage et édition du gain du préampli physique réellement affecté au canal ; trim à la place du gain si retour USB. Valeurs en dB et plages fournies par le catalogue serveur, sans conversion inventée côté interface.

Le panneau expose également alimentation 48 V (entrée analogique), inversion de polarité Ø, activation et fréquence du coupe-bas, et raccourcis Égaliseur, Gate/Compresseur, Envois/Retours. Les valeurs absentes restent non lues. Les réglages affichés sont ceux de la dernière lecture ; relire pour les actualiser après utilisation d’une autre application.

Toute écriture passe par l’aperçu existant, une sauvegarde et la comparaison des réponses. Le routage est relu avant application ; si la source a changé, recommencer. Le 48 V exige une confirmation supplémentaire. Le gain et le 48 V appartiennent à la prise physique : d’autres canaux utilisant cette prise sont affectés aussi. Le gain peut changer le niveau du mix et des retours ainsi que la réaction des traitements ; travailler progressivement, sorties à faible niveau.

Validation : compilation backend/frontend, 55 tests existants et vérifications des paquets en CI. Navigateur en simulation : source identifiée, aperçu du gain sans écriture, application avec sauvegarde, deux confirmations pour le 48 V, aucune erreur JavaScript. Essai matériel des nouvelles commandes encore nécessaire. Ce changement n’ajoute pas un Solo/PFL sur les tranches. Paquets non signés/notariés.

## English

Mixer strips now include **Entrée / Gain** and a real input control panel replaces the previous illustrative EQ chart. **Lire l’entrée** reads analog/USB source selection and parameters. It shows the actual mapped analog preamp gain or USB return trim, using dB values and ranges from the server catalog.

Also available: analog phantom power, polarity inversion, high-pass enable/frequency, and shortcuts to EQ, Gate/Compressor and Sends/Monitors. Missing values remain unread. Displayed values reflect the last explicit read; refresh after editing in another app.

Writes use existing preview, backup and readback checks. Source routing is read again before applying; a changed source requires restarting. Phantom power requires an additional confirmation. Gain and phantom affect the physical input, including other channels mapped to it. Gain can alter main/monitor levels and processing response; adjust gradually with low output levels.

Validation: backend/frontend builds, 55 existing tests and CI package checks. Browser simulation covers source identification, preview without writes, gain application with backup, separate phantom confirmation and no JavaScript errors. Physical testing of these new controls remains required. This change does not add strip Solo/PFL. Packages remain unsigned/non-notarized.
