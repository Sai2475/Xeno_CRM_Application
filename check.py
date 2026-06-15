import requests
import time
try:
    resp=requests.get('https://xeno-backend-ti5a.onrender.com/api/test-events')
    print(resp.text)
except: print('failed')
