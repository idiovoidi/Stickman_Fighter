from http.server import HTTPServer, SimpleHTTPRequestHandler
import webbrowser
import threading
import time
import os

class CustomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Set the directory to serve files from
        super().__init__(*args, directory=".", **kwargs)

    def log_message(self, format, *args):
        # Suppress default logging
        pass

def start_server():
    try:
        server = HTTPServer(('localhost', 8000), CustomHandler)
        print("\n🎮 Stick Fighter server running at http://localhost:8000")
        print("📝 Press Ctrl+C to stop the server")
        server.serve_forever()
    except OSError as e:
        if e.errno == 98:  # Address already in use
            print("Error: Port 8000 is already in use. Please close other servers and try again.")
            return
        raise e

def open_browser():
    time.sleep(1.5)  # Give the server a moment to start
    webbrowser.open('http://localhost:8000')

if __name__ == '__main__':
    # Ensure we're in the correct directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    # Check if required files exist
    required_files = [
        'public/index.html',
        'public/js/game.js',
        'public/js/StickMan.js'
    ]
    
    missing_files = [f for f in required_files if not os.path.exists(f)]
    if missing_files:
        print("Error: Missing required files:")
        for file in missing_files:
            print(f"- {file}")
        exit(1)

    # Start the server in a separate thread
    server_thread = threading.Thread(target=start_server)
    server_thread.daemon = True
    server_thread.start()

    # Open the browser
    open_browser()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down server...") 