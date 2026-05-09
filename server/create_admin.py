import hashlib
import os
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

# Load env
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

def create_admin(username, password, email):
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("ERROR: MONGO_URI not found in .env")
        return

    client = MongoClient(mongo_uri)
    db = client["Job_portal"]
    users_collection = db["users"]

    if users_collection.find_one({"username": username}):
        print(f"ERROR: User '{username}' already exists.")
        return

    hashed_pw = hashlib.sha256(password.encode()).hexdigest()
    
    admin_user = {
        "username": username,
        "password": hashed_pw,
        "role": "admin",
        "email": email,
        "is_verified": True,
        "profile": {
            "full_name": "System Administrator"
        }
    }

    users_collection.insert_one(admin_user)
    print(f"SUCCESS: Admin user '{username}' created successfully!")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 4:
        print("Usage: python create_admin.py <username> <password> <email>")
    else:
        create_admin(sys.argv[1], sys.argv[2], sys.argv[3])
