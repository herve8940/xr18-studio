import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { StudioDatabase } from "./database.js";

/**
 * Local read-only MCP server.
 * Never opens an OSC socket, never sends XR18 hardware commands.
 * Uses the same SQLite database as XR18 Studio when XR18_DB_PATH is configured.
 */
const db = new StudioDatabase();
const server = new McpServer({ name: "xr18-studio", version: "0.1.0" });
const result = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }]
});
server.tool("studio_list_songs", "Liste les morceaux enregistrés dans XR18 Studio.", {}, async () =>
  result({ songs: db.listSongs(), source: "local SQLite" })
);
server.tool("studio_list_setlists", "Liste les setlists et leur ordre de morceaux.", {}, async () =>
  result({ setlists: db.listSetlists(), source: "local SQLite" })
);
server.tool("studio_list_rehearsals", "Liste les répétitions et notes sauvegardées.", {}, async () =>
  result({ rehearsals: db.listRehearsals(), source: "local SQLite" })
);
server.tool("studio_list_ear_profiles", "Consulte les profils in-ear préparés, sans commander la console.", {}, async () =>
  result({ profiles: db.listEarProfiles(), simulationOnly: true, hardwareWrite: false })
);
server.tool(
  "studio_get_setlist",
  "Consulte une setlist par identifiant, avec les morceaux correspondants.",
  { id: z.string().uuid() },
  async ({ id }) => {
    const setlist = db.listSetlists().find(s => s.id === id);
    if (!setlist) return { isError: true, content: [{ type: "text" as const, text: "Setlist introuvable" }] };
    const songs = db.listSongs();
    return result({ ...setlist, songs: setlist.songIds.map(songId => songs.find(s => s.id === songId) ?? { id: songId, missing: true }) });
  }
);
process.on("SIGINT", () => { db.close(); process.exit(0); });
const transport = new StdioServerTransport();
await server.connect(transport);
