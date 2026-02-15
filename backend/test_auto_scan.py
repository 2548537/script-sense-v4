import requests
import json
import base64
import os

BASE_URL = 'http://127.0.0.1:5000/api'

def test_auto_scan():
    print("🚀 Testing Automatic Page Scan Endpoint...")
    
    # 1. Get an existing answer sheet ID
    try:
        resp = requests.get(f"{BASE_URL}/upload/files?type=answer")
        files = resp.json().get('files', [])
        if not files:
            print("❌ No answer sheets found. Please upload one first.")
            return
        
        answersheet_id = files[0]['id']
        print(f"✅ Using Answer Sheet ID: {answersheet_id}")
        
    except Exception as e:
        print(f"❌ Error fetching files: {e}")
        return

    # 2. Call the auto-scan endpoint
    payload = {
        'answersheetId': answersheet_id,
        'page': 0
    }
    
    print(f"📡 Sending auto-scan request for page 0...")
    try:
        resp = requests.post(f"{BASE_URL}/evaluate/auto-scan", json=payload)
        print(f"📊 Status Code: {resp.status_code}")
        
        if resp.status_code == 200:
            result = resp.json()
            print("✅ Success!")
            print(f"📝 Transcription length: {len(result.get('transcription', ''))} chars")
            print(f"🖼️  Diagrams found: {len(result.get('diagrams', []))}")
            
            for i, diag in enumerate(result.get('diagrams', [])):
                print(f"   [{i+1}] Description: {diag.get('description')}")
                # Check if image is valid base64
                img_data = diag.get('image', '')
                if img_data.startswith('data:image/png;base64,'):
                    print(f"   [{i+1}] Image Data: Valid (base64)")
                else:
                    print(f"   [{i+1}] Image Data: INVALID")
        else:
            print(f"❌ Error: {resp.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_auto_scan()
