import requests
resp=requests.post('https://xeno-backend-ti5a.onrender.com/api/receipt', json={'event_id':'test1', 'campaign_id':'6a2f439aac8858b90bf3f083', 'customer_id':'6a2f439aac8858b90bf3f083', 'status':'delivered', 'timestamp':'2023-01-01'})
print(resp.status_code)
print(resp.text)
