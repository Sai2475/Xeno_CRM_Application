from fastapi import FastAPI, testclient
app = FastAPI()
@app.post('/test')
def test(data: dict):
    return data

client = testclient.TestClient(app)
print(client.post('/test', json={'a': 1}).json())
