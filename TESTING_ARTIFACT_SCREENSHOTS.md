# Testing the Profile Key Mismatch Artifact (Screenshots Guide)

This bug: **Registration saves profile data with camelCase keys** (`fullName`, `companyName`) but **profile pages read snake_case** (`full_name`, `company_name`), so name/company show up **empty** after signup.

---

## 1. Start backend and frontend

**Terminal 1 – Django backend**
```bash
cd server
python manage.py runserver
```
(Keep it running; default http://127.0.0.1:8000)

**Terminal 2 – React frontend**
```bash
cd auth-frontend
npm run dev
```
(Keep it running; e.g. http://localhost:5173)

---

## 2. Screenshot checklist

### A. Registration (data is sent with “correct” values)

**Student**
1. Open **http://localhost:5173/** (Auth/Register page).
2. Fill **I'm a Student**:
   - Full Name: `Test Student`
   - Username: `teststudent1`
   - Email: `test@example.com`
   - University: `Test University`
   - Password: (any)
3. **Screenshot 1:** Registration form filled (before Submit).
4. Click **Register**.
5. **Screenshot 2:** Success (e.g. “Registered. Please verify your email” or console/network showing 200).

**Employer** (optional, for company name bug)
1. On the same page, fill **I'm an Employer**:
   - Company Name: `Test Company Ltd`
   - Username: `testemployer1`
   - Email: `employer@example.com`
   - Password: (any)
2. **Screenshot 3:** Employer form filled.
3. Click **Register**.
4. **Screenshot 4:** Success.

---

### B. Log in (you must be “verified”)

Login requires `is_verified: true`. Easiest for testing: set it in the DB.

**Option 1 – Django shell (recommended)**

In a **new** terminal:
```bash
cd server
python manage.py shell
```

Then (replace username if you used another):

```python
from server.mongo import users_collection
users_collection.update_one(
    {"username": "teststudent1"},
    {"$set": {"is_verified": True}}
)
# If you registered employer too:
users_collection.update_one(
    {"username": "testemployer1"},
    {"$set": {"is_verified": True}}
)
exit()
```

**Option 2 – Manual in MongoDB**  
In Compass/Studio, find the user document and set `is_verified: true`.

---

### C. Login and go to profile

**Student**
1. Open **http://localhost:5173/login**.
2. Login: `teststudent1` + password you used.
3. You should be redirected to **/home**.
4. Go to **Student Profile** (link in nav or **http://localhost:5173/student-profile**).
5. **Screenshot 5:** Profile page with **empty Full Name and/or University** (bug: data was stored under `fullName` / `university` but page reads `full_name`).

**Employer**
1. Logout or use incognito; open **http://localhost:5173/login**.
2. Login: `testemployer1` + password.
3. Go to **Employer Profile** (e.g. **http://localhost:5173/employer-profile**).
4. **Screenshot 6:** Profile page with **empty Company Name** (bug: stored as `companyName`, page reads `company_name`).

---

### D. Optional: show that data is in the DB

In Django shell:
```python
from server.mongo import users_collection
u = users_collection.find_one({"username": "teststudent1"})
print(u.get("profile"))
# You should see: {'fullName': 'Test Student', 'university': 'Test University'}
```
**Screenshot 7:** Terminal showing profile has `fullName`/`university` (keys the UI doesn’t use).

---

## 3. Summary for your report

| Screenshot | What it shows |
|------------|----------------|
| 1 | Registration form (student) with name/university filled |
| 2 | Registration success |
| 3–4 | Same for employer (optional) |
| 5 | **Bug:** Student profile with empty name/university after signup |
| 6 | **Bug:** Employer profile with empty company name after signup |
| 7 | DB has data under wrong keys (`fullName` / `companyName`) |

**Root cause:** Register saves camelCase keys; profile views expect snake_case. Fix: in `register()` use `full_name`, `company_name` (and keep `university`) when building `profile`.
