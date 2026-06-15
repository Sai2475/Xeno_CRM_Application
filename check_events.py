import requests
resp=requests.get('https://xeno-backend-ti5a.onrender.com/api/test-events')
print(resp.status_code)
print(resp.text)
