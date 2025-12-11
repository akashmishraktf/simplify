# Simplify for India - Complete Testing Guide

This guide walks you through testing all features of the job application autofill system.

## Prerequisites

1. Backend running on `http://localhost:3000`
2. Extension built and loaded in Chrome
3. PostgreSQL database running

## Step 1: Start the Backend

```bash
cd /home/akash/Documents/Github/simplify-for-india/apps/backend
npm run start:dev
```

You should see:
```
Backend running on http://localhost:3000
```

## Step 2: Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Reload" on the "Simplify for India" extension
4. The extension should reload with the new build

## Step 3: Sign Up and Log In

1. Click the extension icon in Chrome toolbar
2. You'll see the Login/Sign Up form
3. Click "Sign Up" link at the bottom
4. Enter email and password
5. Click "Sign Up"
6. You should be logged in automatically

## Step 4: Fill Your Profile

Now you'll see a dashboard with two tabs: **Profile** and **Applications**.

### Basic Information
Fill in the following on the Profile tab:
- Full Name: `John Doe`
- Phone Number: `+91 9876543210`
- Current Location: `Bangalore, Karnataka`
- Preferred Location: `Bangalore, Hyderabad, Remote`
- Notice Period: `30` days
- Current CTC: `8,00,000`
- Expected CTC: `12,00,000`
- Skills: `React, Node.js, TypeScript, PostgreSQL, AWS`

### Employment History
Click "Add Another Job" to add multiple jobs:

**Job 1 (Current):**
- Company: `Google India`
- Job Title: `Software Engineer`
- Start Date: `2022-06`
- Check "Currently working here"
- Description: `Working on cloud infrastructure and microservices`

**Job 2 (Previous):**
- Company: `Infosys`
- Job Title: `System Engineer`
- Start Date: `2020-08`
- End Date: `2022-05`
- Description: `Full-stack development with React and Spring Boot`

### Education
**Degree 1:**
- Institution: `IIT Bombay`
- Degree: `B.Tech`
- Field of Study: `Computer Science`
- Start Year: `2016`
- End Year: `2020`
- Grade: `8.5/10`

Click **"Save Profile"** button. You should see "Profile saved successfully!"

## Step 5: Test Autofill on a Job Form

### Option A: Test with a Live Job Portal

1. Open any Indian job portal in a new tab:
   - Naukri.com
   - LinkedIn Jobs (India)
   - Indeed India
   - AngelList (Wellfound)
   - Instahyre

2. Find a job and click "Apply"

3. You should see a **purple "Autofill with Simplify" button** appear in the top-right corner

4. Click the button

5. Watch the form fields auto-fill with your profile data!

6. Check the console (F12) to see debug logs:
   ```
   [Simplify-for-India] Profile loaded
   [Simplify-for-India] Starting autofill...
   [Simplify-for-India] Mapped fields: [...]
   [Simplify-for-India] Filled fullName with: John Doe
   ```

7. You should see a green notification: "✓ Autofilled X fields!"

### Option B: Test with a Simple HTML Form

Create a test HTML file to test locally:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Job Application Form</title>
</head>
<body>
    <h1>Job Application Form</h1>
    <form>
        <label>Full Name:</label>
        <input type="text" name="name" id="applicant_name" placeholder="Enter your name" />
        <br/><br/>

        <label>Email:</label>
        <input type="email" name="email" id="email" placeholder="your@email.com" />
        <br/><br/>

        <label>Phone Number:</label>
        <input type="tel" name="phone" id="phone" placeholder="Your phone" />
        <br/><br/>

        <label>Current Location:</label>
        <input type="text" name="location" id="location" placeholder="City" />
        <br/><br/>

        <label>Total Experience (years):</label>
        <input type="text" name="experience" id="experience" placeholder="Years" />
        <br/><br/>

        <label>Current CTC:</label>
        <input type="text" name="current_ctc" id="current_salary" placeholder="Current salary" />
        <br/><br/>

        <label>Expected CTC:</label>
        <input type="text" name="expected_ctc" id="expected_salary" placeholder="Expected salary" />
        <br/><br/>

        <label>Notice Period (days):</label>
        <input type="number" name="notice_period" id="notice" placeholder="Days" />
        <br/><br/>

        <label>Skills:</label>
        <textarea name="skills" id="skills" placeholder="Your skills"></textarea>
        <br/><br/>

        <label>Current Company:</label>
        <input type="text" name="company" id="current_company" placeholder="Company name" />
        <br/><br/>

        <label>Current Designation:</label>
        <input type="text" name="designation" id="job_title" placeholder="Your role" />
        <br/><br/>

        <button type="submit">Submit Application</button>
    </form>
</body>
</html>
```

Save this as `test-form.html`, open it in Chrome, and test the autofill!

## Step 6: Check Application History

1. After using autofill on any job form, click the extension icon
2. Go to the **Applications** tab
3. You should see the application you just filled!
4. The entry shows:
   - Job title (if detected)
   - Company or website URL
   - Date applied
   - Status dropdown (Applied, Interviewing, Accepted, Rejected)

5. Try changing the status using the dropdown

6. Try deleting an application using the "Delete" button

## Step 7: Verify Backend Tracking

Check your backend terminal. You should see API requests:

```
GET /v1/profile 200
POST /v1/applications 201
GET /v1/applications 200
```

You can also check the database:

```bash
psql -U postgres -d simplify_india

SELECT * FROM applications;
```

## Common Issues & Troubleshooting

### Autofill button doesn't appear

1. Check browser console (F12) for errors
2. Make sure you're logged in (click extension icon to verify)
3. The form must have at least 3 fields with job-related names
4. Try refreshing the page

### Fields not filling correctly

1. Open console and check the logs
2. Look for: `[Simplify-for-India] Mapped fields: [...]`
3. Check which fields were detected
4. Some fields may have unusual names that aren't recognized

### Profile not saving

1. Check if backend is running
2. Look for CORS errors in console
3. Verify database connection in backend logs

### Extension shows "No access token"

1. You need to log in again
2. Click extension icon and log in
3. Token is stored in Chrome's local storage

## Field Mapping Details

The autofill system detects fields using heuristics:

### Detected Field Types

| Field Type | Detected Keywords |
|------------|-------------------|
| Full Name | name, candidate name, full name |
| Email | email, e-mail, mail address |
| Phone | phone, mobile, contact number |
| Current Location | current location, present city, location |
| Preferred Location | preferred location, target city |
| Notice Period | notice period, joining period |
| Current CTC | current ctc, current salary, present salary |
| Expected CTC | expected ctc, desired salary, target package |
| Experience | experience, years of experience, total experience |
| Skills | skills, technologies, tech stack, key skills |
| Company | company, employer, organization, current company |
| Job Title | designation, position, role, job title |
| Education | education, qualification, degree |
| Institution | college, university, institution |

## Testing Checklist

- [ ] Sign up with new account
- [ ] Log in successfully
- [ ] Fill complete profile (basic + employment + education)
- [ ] Save profile successfully
- [ ] Visit a job application page
- [ ] See autofill button appear
- [ ] Click autofill button
- [ ] Verify fields are filled correctly
- [ ] See success notification
- [ ] Check application appears in Applications tab
- [ ] Change application status
- [ ] Delete an application
- [ ] Log out and log back in
- [ ] Verify profile persists
- [ ] Test on multiple job portals

## Performance Notes

- Autofill happens in **< 1 second** for most forms
- Profile loads when page loads (cached after first load)
- Form detection runs on page load and DOM changes
- No external API calls during autofill (uses cached profile)

## Next Steps

Once everything works:

1. Test on real job portals (Naukri, Indeed, LinkedIn)
2. Note which fields work and which don't
3. Refine field mapping patterns based on real portals
4. Add support for multi-page applications
5. Implement resume parsing for automatic profile filling

## Security Notes

- Never share your `.env` file
- Access tokens are stored securely in Chrome storage
- Profile data is encrypted at rest in PostgreSQL
- CORS is open for development (`origin: '*'`) - restrict in production!
