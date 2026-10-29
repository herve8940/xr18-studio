# XR18 Studio 1.0.2

## Français

- Correction confirmée du refus d’identité : la XR18 firmware 1.23 de l’utilisateur annonce **XR18V2**. Les identifiants exacts XR18 et XR18V2 sont désormais reconnus ; les autres modèles restent refusés. Test de régression basé sur les deux paquets /info et /xinfo réellement reçus.
- Journal automatique `logs/xr18-studio.log` dans le dossier de données de l’application. Dates, version, étapes de connexion, erreurs, réponse d’identité décodée et paquet hexadécimal (taille limitée). Rotation à 1 Mio avec un fichier précédent conservé.
- Bouton **Télécharger le journal de diagnostic** dans Configuration > Connexion à ma XR18, réservé à l’administrateur. Après un essai, joindre le fichier au support. Les IP et noms de console figurent dans le journal ; aucune clé API, mot de passe, cookie, scène ou donnée audio n’est enregistrée.
- Le message « Connexion… » disparaît après un échec.

Validation : 53 tests locaux réussis, compilation backend/frontend ; tests de rotation, droits du fichier, export administrateur et refus invité. La réponse d’identité réelle est confirmée ; la connexion et le pilotage complets restent à réessayer sur la console physique. Installateurs publiés après les tests de démarrage empaquetés des quatre plateformes. Paquets non signés/notariés.

## English

- Fix confirmed identity rejection: the user’s firmware 1.23 console identifies itself as **XR18V2**. Exact XR18 and XR18V2 identifiers are accepted; other models remain rejected. Regression tests reproduce the actual /info and /xinfo packets.
- Automatic `logs/xr18-studio.log` in the application data directory: timestamps, version, connection stages/errors and bounded decoded/hex identity replies. Rotates at 1 MiB with one previous file retained.
- Administrator-only **Télécharger le journal de diagnostic** link in Configuration > Connexion à ma XR18 exports both log generations. Reproduce the connection attempt, then attach this file to support. Logs include local IP addresses and console names, but no API keys, passwords, cookies, scenes or audio.
- Clears the pending connection message after failure.

Validation: 53 local tests passed and backend/frontend builds succeeded; rotation, file permissions and admin-only export tested. Actual console identity is confirmed, but full connection/control must still be retried on the physical console. Publication requires packaged startup checks across four platforms. Packages remain unsigned/non-notarized.
