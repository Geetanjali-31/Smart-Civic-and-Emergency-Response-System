import json
import string
import random
import sys
import urllib.request
import urllib.error

BASE_URL = 'http://127.0.0.1:5000/api'

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase, k=length))

def make_request(url, payload=None, token=None):
    req = urllib.request.Request(url)
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
        
    data = None
    if payload:
        data = json.dumps(payload).encode('utf-8')
        
    try:
        response = urllib.request.urlopen(req, data=data)
        return response.getcode(), json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except urllib.error.URLError as e:
        return 0, str(e.reason)

def run_test():
    username = f"testuser_{random_string()}"
    email = f"{username}@example.com"
    password = "password123"
    phone = "".join(random.choices(string.digits, k=10))
    
    print(f"Signing up user: {username}")
    status, res_data = make_request(f"{BASE_URL}/user/signup", payload={
        "username": username,
        "email": email,
        "password": password,
        "phone": phone
    })
    
    if status != 201:
        print("Signup failed:", res_data)
        sys.exit(1)
        
    print("Logging in...")
    status, res_data = make_request(f"{BASE_URL}/user/login", payload={
        "username": username,
        "password": password
    })
    
    if status != 200:
        print("Login failed:", res_data)
        sys.exit(1)
        
    token = res_data.get('access_token')
    
    print("Submitting service request with 3MB image...")
    # Simulate a 3MB image payload
    large_image_data = "data:image/jpeg;base64," + ("A" * 3000000)
    
    status, res_data = make_request(f"{BASE_URL}/services", 
        token=token,
        payload={
            "title": "Test Civic Issue: Massive Pothole",
            "category": "civic",
            "description": "Testing a massive 3MB payload for verification.",
            "location": "Local",
            "latitude": 0.0,
            "longitude": 0.0,
            "image_url": large_image_data
        }
    )
    
    print("Status Code:", status)
    # Don't print the huge payload
    if status == 201:
        print("SUCCESS: Service created with a 3MB image payload!")
    else:
        print("FAILED: Received non-201 status code.")
        print("Response:", str(res_data)[:200]) # only print part of error
        sys.exit(1)

if __name__ == "__main__":
    run_test()
