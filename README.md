# XR18 Studio

Application de mixage XR18 pour Windows, macOS et Linux : simulation, connexion OSC, contrôles de console, scènes, effets, retours personnels, répétitions, ReaCue et MCP.

Version 0.2.0 candidate : compilation et tests automatisés ; validation sur la console physique requise avant utilisation en concert.

```sh
npm run setup
npm run studio
```

Backend et interface compilés : `npm run build:all`. Application de bureau : `npm run desktop:package`. Les installateurs sont produits par GitHub Actions.

- [État vérifié et limites](docs/ETAT_DU_PROJET.md)
- [Guide des fonctions, HTTPS, ReaCue et MCP](docs/FONCTIONS_0_2.md)
- [Connexion en un clic](docs/CONNEXION_XR18.md)
- [Installation de bureau](docs/INSTALLATION_CLE_EN_MAIN.md)

Le moteur OSC est unique ; l’interface, les clients musiciens et MCP passent par son API et ses droits. Une connexion ou une lecture ne change pas le mixage. Les scènes natives `.scn` avec FX textuels opaques restent archivables, mais leur rappel est refusé ; les scènes complètes JSON version 2 conservent directement les vecteurs OSC typés.
