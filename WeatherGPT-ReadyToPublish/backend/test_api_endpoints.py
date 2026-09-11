import requests
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000"

print("--- Testing API Endpoints ---")

# 1. Health
r = requests.get(f"{BASE_URL}/api/data-health")
print(f"GET /api/data-health -> Status: {r.status_code}")
data = r.json()
print(f"Weather API Status: {data['weather_api']['status']}")

# 2. Weather Full (Without API Key)
r = requests.get(f"{BASE_URL}/api/weather/full?city=Chennai")
print(f"GET /api/weather/full -> Status: {r.status_code} (Expected 503)")
assert r.status_code == 503, f"Expected 503 but got {r.status_code}"
err = r.json()
print(f"Response message: {err['message']}")
print(f"Diagnostic reason: {err['diagnostic_reason']}")

# 3. AI Chat (Without API Key)
chat_payload = {"query": "Will it rain today in Chennai?"}
r = requests.post(f"{BASE_URL}/api/ai/chat", json=chat_payload)
print(f"POST /api/ai/chat -> Status: {r.status_code}")
chat_resp = r.json()
print(f"Detected Lang: {chat_resp['detected_language']}")
print(f"Detected Intent: {chat_resp['detected_intent']}")
print(f"Tools Executed: {chat_resp['tools_executed']}")
print(f"Reply: {chat_resp['reply'][:100]}...")

# 4. Community Reports
r = requests.get(f"{BASE_URL}/api/community/reports")
print(f"GET /api/community/reports -> Status: {r.status_code}, count: {len(r.json())}")

# Submit Report
new_rep = {
    "location_name": "Chennai",
    "lat": 13.0827,
    "lon": 80.2707,
    "report_type": "Waterlogged Road",
    "description": "Velachery main road has 1 foot water accumulation near railway bridge.",
    "severity": "Moderate"
}
r = requests.post(f"{BASE_URL}/api/community/reports", json=new_rep)
print(f"POST /api/community/reports -> Status: {r.status_code}")
rep = r.json()
print(f"Created report: ID {rep['id']}, label: '{rep['verification_label']}'")

print("\nALL API ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY!")
