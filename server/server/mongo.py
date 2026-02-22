import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))
db = client["Job_portal"]  # database name
users_collection = db["users"]  # collection for users
listings_collection = db["job"]
applications_collection = db["applications"]
notifications_collection = db["notifications"]

