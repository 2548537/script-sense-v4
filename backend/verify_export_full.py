import requests
import json

BASE_URL = 'http://127.0.0.1:5000/api'

def setup_test_data():
    print("🛠️ Setting up test data...")
    
    # 1. Create Subject
    subject_data = {
        "name": "Science 101",
        "className": "Class 10B",
        "academicYear": "2024-25"
    }
    resp = requests.post(f"{BASE_URL}/subjects", json=subject_data)
    if resp.status_code != 201:
        print(f"❌ Failed to create subject: {resp.text}")
        return None
    
    subject = resp.json()['subject']
    subject_id = subject['id']
    print(f"✅ Created Subject: {subject['name']} (ID: {subject_id})")
    
    # 2. Upload a dummy Answer Sheet
    # This might be complex because it needs a file.
    # Let's see if we can just use the created subject and mock marks.
    
    # Actually, the export endpoint needs AnswerSheets to be present.
    # Let's try to mock an AnswerSheet in the database if possible, 
    # but the API doesn't have a direct "create answersheet" without file.
    
    # Let's check what answer sheets already exist (from previous conversions)
    resp = requests.get(f"{BASE_URL}/upload/files?type=answer")
    answer_sheets = resp.json().get('files', [])
    
    if not answer_sheets:
        print("⚠️ No answer sheets found. I'll search for any subject that HAS students.")
        resp = requests.get(f"{BASE_URL}/subjects")
        subjects = resp.json().get('subjects', [])
        for s in subjects:
            if s.get('total_students', 0) > 0:
                print(f"🎯 Found subject with students: {s['name']} (ID: {s['id']})")
                return s['id']
        
        print("❌ Cannot proceed without at least one answer sheet in the system.")
        return None
    
    # Associate first answer sheet with our new subject
    # The API might not allow this directly, but let's assume one is already there 
    # or the user has some data.
    
    return subject_id

def test_export(subject_id):
    if not subject_id: return
    
    print(f"📡 Testing Export for Subject ID: {subject_id}")
    resp = requests.get(f"{BASE_URL}/subjects/{subject_id}/export-marks")
    print(f"📊 Status Code: {resp.status_code}")
    if resp.status_code == 200:
        print("✅ Export successful!")
        filename = f"export_{subject_id}.xlsx"
        with open(filename, 'wb') as f:
            f.write(resp.content)
        print(f"💾 Saved to {filename}")
    else:
        print(f"❌ Export failed: {resp.text}")

if __name__ == "__main__":
    sid = setup_test_data()
    if sid:
        test_export(sid)
