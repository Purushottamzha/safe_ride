import os, pathlib
BASE = r'C:\Users\ASUS\saferide-nepal\door_scanner'
def w(path, content):
    pathlib.Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Wrote: {path}')
