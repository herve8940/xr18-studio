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
import time
import pathlib
import argparse


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


def watch(client, filename):
    """Follow only new region events. Never replay a previous concert on startup."""
    path = pathlib.Path(filename)
    offset = path.stat().st_size if path.exists() else 0
    while True:
        if path.exists():
            if path.stat().st_size < offset:
                offset = 0
            with path.open('r', encoding='utf-8') as stream:
                stream.seek(offset)
                while True:
                    before = stream.tell()
                    line = stream.readline()
                    if not line or not line.endswith('\n'):
                        stream.seek(before)
                        break
                    event = json.loads(line)
                    # A failure stops the bridge; operator reviews partial changes before restart.
                    result = client.section(event['songId'], event['section'], event['eventId'])
                    print(json.dumps(result, ensure_ascii=False), flush=True)
                offset = stream.tell()
        time.sleep(0.1)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('event', nargs='*', help='SONG_ID SECTION EVENT_ID')
    parser.add_argument('--watch', metavar='JSONL', help='Outbox emitted by XR18_Studio_Regions.lua')
    args = parser.parse_args()
    client = XR18StudioClient()
    if os.environ.get('XR18_STUDIO_USER'):
        client.login()
    if args.watch:
        watch(client, args.watch)
    elif len(args.event) == 3:
        print(json.dumps(client.section(*args.event), ensure_ascii=False))
    else:
        parser.error('Provide --watch FILE or SONG_ID SECTION EVENT_ID')
