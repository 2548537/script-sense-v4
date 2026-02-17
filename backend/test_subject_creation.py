import requests
import json

URL = "http://127.0.0.1:5000/api/subjects"

data = {
    "name": "Test Subject " + str(hex(id(URL))),
    "className": "Test Class",
    "academicYear": "2025-26"
}

try:
    response = requests.post(URL, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
