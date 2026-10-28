# XR18 Studio — application de bureau multiplateforme (prototype)

## Plateformes cibles
- **Windows** : installateur NSIS (.exe).
- **macOS** : image disque (.dmg), Intel et Apple Silicon selon le runner.
- **Linux** : AppImage et paquet Debian (.deb).

Les packages sont construits par GitHub Actions `.github/workflows/desktop.yml`. Dans la PR, consulter **Actions → Desktop packages → Artifacts** une fois les jobs terminés. Un artefact n'est pas une version publiée ou signée.

## Installation depuis les sources
Prérequis : Node.js 22, npm et les outils de compilation natifs pour better-sqlite3.

```sh
npm install
npm --prefix web install
npm run desktop:dev
```

Pour produire un installateur local :
```sh
npm run desktop:package
```

## Architecture
Electron charge la version Vite compilée via un serveur HTTP local (127.0.0.1:3000). Le backend est démarré dans le processus principal Electron. La base SQLite est placée dans le répertoire de données utilisateur du système d'exploitation. Le mode matériel est **forcé en simulation** pour éviter toute commande OSC non validée.

## Limitations de sécurité et distribution
- Les packages ne sont pas encore signés/notarisés. Windows SmartScreen et macOS Gatekeeper peuvent afficher des avertissements.
- Les ports locaux sont fixes (3000) ; un autre service peut empêcher le démarrage. La gestion robuste de ports reste à réaliser.
- Aucun contrôle XR18 réel complet ; effets, traitements, bus et vumètres ne sont pas encore connectés à une console physique.
- L'API locale n'a pas d'authentification. Ne pas publier de port vers Internet, ne pas faire de reverse proxy.
- Ne pas utiliser cette version pour le mixage d'un concert ou le contrôle des retours in-ear réels.
- Tests de compilation, packaging et installation sur les trois OS à confirmer par CI.
