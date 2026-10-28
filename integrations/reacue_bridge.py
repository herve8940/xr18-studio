"""Client local XR18 Studio, utilisable depuis un déclencheur ReaCue Python.

Les identifiants restent dans les variables d'environnement, jamais dans le projet.
Exemple : python integrations/reacue_bridge.py SONG_ID refrain EVENT_ID
"""
import http.cookiejar
import json
import os
import sys
import urllib.request
import urllib.parse


class XR18StudioClient:
    def __init__(self, base_url=None):
        self.base_url = (base_url or os.environ.get('XR18_STUDIO_URL', 'http://127.0.0.1:3000')).rstrip('/')
        parsed = urllib.parse.urlparse(self.base_url)
        if parsed.scheme != 'http' or parsed.hostname not in ('127.0.0.1', 'localhost') or parsed.username or parsed.password or parsed.path:
            raise ValueError('Serveur HTTP local requis')
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

    def post(self, path, data):
        request = urllib.request.Request(self.base_url + path, json.dumps(data).encode(), {'Content-Type': 'application/json'}, method='POST')
        with self.opener.open(request, timeout=10) as response:
            return json.load(response)

    def login(self):
        return self.post('/api/auth/login', {'name': os.environ['XR18_STUDIO_USER'], 'password': os.environ['XR18_STUDIO_PASSWORD']})

    def section(self, song_id, section, event_id):
        # event_id must be stable when retrying the same event, unique for a new occurrence.
        return self.post('/api/reacue/event', {'eventId': event_id, 'songId': song_id, 'section': section})


if __name__ == '__main__':
    if len(sys.argv) != 4:
        raise SystemExit('Usage: reacue_bridge.py SONG_ID SECTION EVENT_ID')
    client = XR18StudioClient()
    if os.environ.get('XR18_STUDIO_USER'):
        client.login()
    print(json.dumps(client.section(*sys.argv[1:]), ensure_ascii=False))
