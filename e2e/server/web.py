from os import chdir, path
import socketserver
import http.server


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True


chdir('../dist')

if not path.isfile('blank.html'):
    with open('blank.html', 'w') as f:
        f.write('<html><head><title>Superdesk E2E</title></head><body></body></html>')

port = 9000
address = '127.0.0.1'
server = ThreadedHTTPServer((address, port), http.server.SimpleHTTPRequestHandler)

try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
