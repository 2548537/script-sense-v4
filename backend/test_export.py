import requests
import os

BASE_URL = 'http://127.0.0.1:5000/api'

def test_excel_export():
    print("🚀 Testing Excel Export Endpoint...")
    
    # 1. Get an existing subject ID
    try:
        resp = requests.get(f"{BASE_URL}/subjects")
        subjects = resp.json().get('subjects', [])
        if not subjects:
            print("❌ No subjects found. Please create one first.")
            return
        
        subject_id = subjects[0]['id']
        subject_name = subjects[0]['name']
        print(f"✅ Using Subject: {subject_name} (ID: {subject_id})")
        
    except Exception as e:
        print(f"❌ Error fetching subjects: {e}")
        return

    # 2. Call the export endpoint
    print(f"📡 Sending export request for subject {subject_id}...")
    try:
        resp = requests.get(f"{BASE_URL}/subjects/{subject_id}/export-marks")
        print(f"📊 Status Code: {resp.status_code}")
        
        if resp.status_code == 200:
            content_type = resp.headers.get('Content-Type')
            content_disposition = resp.headers.get('Content-Disposition')
            
            print(f"✅ Success!")
            print(f"📄 Content-Type: {content_type}")
            print(f"📁 Content-Disposition: {content_disposition}")
            
            if 'spreadsheetml' in content_type:
                # Save it to a temporary file to verify it's valid
                with open('test_export.xlsx', 'wb') as f:
                    f.write(resp.content)
                print(f"💾 Saved to test_export.xlsx ({len(resp.content)} bytes)")
            else:
                print(f"❌ Error: Unexpected Content-Type: {content_type}")
        else:
            print(f"❌ Error: {resp.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_excel_export()
