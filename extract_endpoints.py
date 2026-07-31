import urllib.request
import json

url = 'https://api.arpa.veneto.it/REST/v1/meteo_indici?indice=humidex'
try:
    req = urllib.request.Request(url, headers={'Accept': 'application/json'})
    response = urllib.request.urlopen(req)
    data = json.loads(response.read().decode('utf-8'))
    
    cities = ['Padova', 'Volpago', 'Maser', 'Castelfranco']
    found_cities = set()
    
    for s in data.get('data', data):
        for c in cities:
            if c.lower() in str(s['nome_stazione']).lower():
                found_cities.add(s['nome_stazione'])
            
    print("Found cities in data:")
    for f in found_cities:
        print(f)
except Exception as e:
    print(f"Error: {e}")
