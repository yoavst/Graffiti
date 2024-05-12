Graffiti requires a Python server to proxy between the various IDE you use and the web UI. It can either run in a single-user mode on your computer, or in a multi-user mode on a server.

## Single user setup

- Python 3.7+
- `websockets==10.3`
- Run the server: `python3 graffiti_v{version}_server.py`

## Multi user setup

- Same as single user setup, but run with `--multi-user-mode` flag.
