import requests
resp=requests.post('https://xeno-backend-ti5a.onrender.com/api/campaigns/send', json={'campaign_id':'new', 'segment_query':{}, 'channel':'sms', 'message_content':'Test', 'campaign_name':'Test'})
print(resp.status_code)
print(resp.text)
