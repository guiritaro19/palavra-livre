from pathlib import Path
import urllib.request
root=Path(__file__).parent
(root/'flags').mkdir(exist_ok=True)
for country in ['br','es','gb','id']:
    url=f'https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/{country}.svg'
    (root/'flags'/f'{country}.svg').write_bytes(urllib.request.urlopen(url,timeout=30).read())
(root/'licenses'/'flags.txt').write_bytes(urllib.request.urlopen('https://raw.githubusercontent.com/lipis/flag-icons/main/LICENSE',timeout=30).read())
print('Bandeiras e licença baixadas.')
