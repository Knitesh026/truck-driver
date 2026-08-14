from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from ytmusicapi import YTMusic
import os
import urllib.parse

app = Flask(__name__, static_folder='.')
CORS(app)

ytmusic = YTMusic()
cache = {}

# Default Active Playlist: Arijit Singh Hits (VLPLtUuYOHQlyT1vTuyNc4owl0gQgE9keubR)
ACTIVE_PLAYLIST_ID = 'VLPLtUuYOHQlyT1vTuyNc4owl0gQgE9keubR'

def clean_playlist_id(raw_input):
    if not raw_input:
        return ACTIVE_PLAYLIST_ID
    raw_input = raw_input.strip()
    
    # Direct check for Arijit Singh handle
    if 'arijitsingh' in raw_input.lower() or raw_input == '@official_arijitsingh':
        return 'VLPLtUuYOHQlyT1vTuyNc4owl0gQgE9keubR'

    if 'youtube.com' in raw_input or 'youtu.be' in raw_input:
        parsed = urllib.parse.urlparse(raw_input)
        query = urllib.parse.parse_qs(parsed.query)
        if 'list' in query:
            return query['list'][0]
        if '@' in parsed.path:
            handle = parsed.path.replace('/', '')
            try:
                results = ytmusic.search(handle, filter='playlists')
                if results:
                    return results[0].get('browseId')
            except Exception:
                pass

    if raw_input.startswith('@'):
        try:
            results = ytmusic.search(raw_input[1:], filter='playlists')
            if results:
                return results[0].get('browseId')
        except Exception:
            pass

    return raw_input

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/playlist.html')
@app.route('/admin.html')
def playlist_page():
    return send_from_directory('.', 'playlist.html')

@app.route('/purwanchal.html')
def purwanchal_page():
    return send_from_directory('.', 'purwanchal.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(path):
        return send_from_directory('.', path)
    return send_from_directory('.', 'index.html')

@app.route('/api/active-playlist', methods=['GET', 'POST'])
def manage_active_playlist():
    global ACTIVE_PLAYLIST_ID
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        new_id = data.get('playlistId') or request.form.get('playlistId')
        if new_id:
            ACTIVE_PLAYLIST_ID = clean_playlist_id(new_id)
            cache.pop(ACTIVE_PLAYLIST_ID, None)
            return jsonify({'status': 'success', 'activePlaylistId': ACTIVE_PLAYLIST_ID})
        return jsonify({'status': 'error', 'message': 'Missing playlistId'}), 400

    return jsonify({'status': 'success', 'activePlaylistId': ACTIVE_PLAYLIST_ID})

@app.route('/api/search-playlists', methods=['GET'])
def search_playlists():
    query = request.args.get('q', 'Arijit Singh')
    try:
        results = ytmusic.search(query, filter='playlists')
        playlists = []
        for r in results[:12]:
            playlists.append({
                'id': r.get('browseId'),
                'title': r.get('title'),
                'itemCount': r.get('itemCount'),
                'author': r.get('author', [{}])[0].get('name') if isinstance(r.get('author'), list) and r.get('author') else r.get('author'),
                'thumbnail': r.get('thumbnails', [{}])[-1].get('url') if r.get('thumbnails') else ''
            })
        return jsonify({'status': 'success', 'query': query, 'playlists': playlists})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/playlist/<path:raw_playlist_id>', methods=['GET'])
def get_playlist(raw_playlist_id):
    playlist_id = clean_playlist_id(raw_playlist_id)

    if playlist_id in cache:
        return jsonify(cache[playlist_id])

    try:
        playlist_data = None
        try:
            playlist_data = ytmusic.get_playlist(playlist_id, limit=100)
        except Exception:
            if not playlist_id.startswith('VL'):
                playlist_data = ytmusic.get_playlist('VL' + playlist_id, limit=100)
            else:
                raise

        tracks = []
        for index, item in enumerate(playlist_data.get('tracks', [])):
            if not item.get('videoId'):
                continue
            
            artists_list = [a.get('name') for a in item.get('artists', []) if a.get('name')]
            artist_str = ', '.join(artists_list) if artists_list else (item.get('album', {}).get('name') or 'Unknown Artist')
            
            thumb_url = item.get('thumbnails', [{}])[-1].get('url') if item.get('thumbnails') else f"https://i.ytimg.com/vi/{item.get('videoId')}/hqdefault.jpg"

            tracks.append({
                'id': item.get('videoId'),
                'title': item.get('title'),
                'artist': artist_str,
                'thumbnail': thumb_url,
                'duration': item.get('duration', '3:45'),
                'index': index + 1
            })

        response = {
            'status': 'success',
            'id': playlist_id,
            'title': playlist_data.get('title', 'YouTube Music Playlist'),
            'trackCount': len(tracks),
            'tracks': tracks
        }
        cache[playlist_id] = response
        return jsonify(response)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    import sys
    port = int(os.environ.get('PORT', sys.argv[1] if len(sys.argv) > 1 else 8000))
    print(f"Starting YouTube Music API Server on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
