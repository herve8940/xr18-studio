# Serveur MCP XR18 Studio — lecture seule

Le serveur MCP utilise le SDK officiel Model Context Protocol et le transport stdio. Il donne accès aux données locales de répétition, sans communication OSC.

## Outils
- `studio_list_songs`
- `studio_list_setlists`
- `studio_get_setlist` (UUID)
- `studio_list_rehearsals`
- `studio_list_ear_profiles`

## Démarrage
```sh
npm install
XR18_DB_PATH=./data/xr18-studio.db npm run mcp
```
Le chemin SQLite doit pointer vers **la même base** que celle de l'application. Pour l'application Electron, le fichier se trouve dans le répertoire utilisateur propre à XR18 Studio ; utiliser son chemin exact dans `XR18_DB_PATH`.

## Exemple de configuration MCP (client compatible stdio)
```json
{
  "mcpServers": {
    "xr18-studio": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/CHEMIN/ABSOLU/DU/PROJET",
      "env": {
        "XR18_DB_PATH": "/CHEMIN/ABSOLU/xr18-studio.db"
      }
    }
  }
}
```

## Sécurité et limites
- Aucun outil d'écriture, aucun contrôle de fader, aucun accès OSC.
- L'accès MCP donne accès aux données locales du groupe ; ne connecter qu'un assistant autorisé.
- Le SDK est un ajout de dépendance non validé par compilation.
- Les commandes et installateurs ne sont pas testés dans cette étape, conformément à la demande.
