# Debugging the Autofill Button

## Issue: Button not appearing on job application pages

Follow these steps to debug:

## Step 1: Check Extension is Loaded

1. Go to `chrome://extensions/`
2. Find "Simplify for India"
3. Make sure it's **Enabled**
4. Click the **Reload** icon (circular arrow)
5. Check for errors (red "Errors" button)

## Step 2: Test with Local HTML Form

1. Open the test form:
   ```bash
   # In a browser, open:
   file:///home/akash/Documents/Github/simplify-for-india/test-job-form.html
   ```

2. Open Developer Console (F12)

3. Look for these messages:
   ```
   [Simplify-for-India] Content script loaded
   [Simplify-for-India] Detected X forms
   [Simplify-for-India] Added autofill button for form
   ```

## Step 3: Check Console for Errors

Open Developer Console (F12) and look for:

### ✅ Expected Messages:
```
[Simplify-for-India] Content script loaded
[Simplify-for-India] Profile loaded: {...}
[Simplify-for-India] Detected 1 forms
[Simplify-for-India] Added autofill button for form
```

### ❌ Common Errors:

**Error 1: "Cannot find module"**
```
Uncaught Error: Cannot find module './utils/fieldMapper'
```
**Fix:** Rebuild with `npm run build`

**Error 2: "chrome.storage is not defined"**
```
Uncaught TypeError: Cannot read property 'local' of undefined
```
**Fix:** Content script not injected properly. Reload extension.

**Error 3: "Failed to load profile"**
```
[Simplify-for-India] Failed to load profile: TypeError: Failed to fetch
```
**Fix:** Backend not running or CORS issue. Start backend: `npm run start:dev`

**Error 4: No messages at all**
**Fix:** Content script not loading. Check manifest.json and reload extension.

## Step 4: Manual Debug

If button still doesn't appear, run this in the console on a job page:

```javascript
// Check if content script loaded
console.log('Testing Simplify extension...');

// Check if there are forms
const forms = document.querySelectorAll('form');
console.log('Forms found:', forms.length);

// Check form fields
forms.forEach((form, i) => {
    const fields = form.querySelectorAll('input, select, textarea');
    console.log(`Form ${i}:`, {
        fields: fields.length,
        fieldNames: Array.from(fields).map(f => f.name || f.id).join(', ')
    });
});

// Check for job-related keywords
forms.forEach((form, i) => {
    const fields = form.querySelectorAll('input, select, textarea');
    const fieldText = Array.from(fields).map(f =>
        `${f.getAttribute('name')} ${f.getAttribute('id')} ${f.getAttribute('placeholder')}`.toLowerCase()
    ).join(' ');

    const isJobForm = /name|email|phone|resume|cv|experience|salary|ctc|notice|location/i.test(fieldText);
    console.log(`Form ${i} is job form:`, isJobForm, 'fields:', fields.length);
});
```

## Step 5: Check Permissions

The extension needs these permissions:
- `storage` - Save auth tokens
- `activeTab` - Access current page
- `scripting` - Inject content script

Check in `chrome://extensions/` → "Simplify for India" → "Details" → "Permissions"

## Step 6: Force Reload Content Script

If extension was installed while page was open:

1. **Close the job application tab completely**
2. **Open a NEW tab**
3. Navigate to the job application page
4. Content script should load on fresh page load

## Step 7: Check if Button is Hidden

Sometimes the button exists but is hidden. Run in console:

```javascript
// Check if button exists in DOM
const buttons = document.querySelectorAll('.simplify-india-autofill-btn');
console.log('Autofill buttons found:', buttons.length);

// Log button details
buttons.forEach((btn, i) => {
    console.log(`Button ${i}:`, {
        display: btn.style.display,
        visibility: btn.style.visibility,
        zIndex: btn.style.zIndex,
        position: btn.style.position
    });
});
```

## Step 8: Verify Backend is Running

The content script needs to fetch your profile from the backend:

```bash
# Check backend status
curl http://localhost:3000/v1/profile

# Should return: {"statusCode":401,"message":"Unauthorized"}
# (401 is expected without token)
```

If backend is down, you'll see CORS errors in console.

## Step 9: Test Detection Logic

The button appears if:
1. ✅ Form has at least 3 fields
2. ✅ Form contains job-related keywords
3. ✅ User is logged in (has token)

Run this to check:

```javascript
// 1. Check field count
document.querySelectorAll('form').forEach(form => {
    const fields = form.querySelectorAll('input, select, textarea');
    console.log('Form fields:', fields.length, '(needs >= 3)');
});

// 2. Check keywords
document.querySelectorAll('form').forEach(form => {
    const fields = form.querySelectorAll('input, select, textarea');
    const text = Array.from(fields).map(f =>
        `${f.name} ${f.id} ${f.placeholder}`
    ).join(' ').toLowerCase();

    const hasKeywords = /name|email|phone|resume|cv|experience|salary|ctc|notice|location/i.test(text);
    console.log('Has job keywords:', hasKeywords);
    if (!hasKeywords) {
        console.log('Text searched:', text.substring(0, 200));
    }
});

// 3. Check login status
chrome.storage.local.get(['access_token'], (result) => {
    console.log('Has access token:', !!result.access_token);
    if (!result.access_token) {
        console.log('❌ Not logged in! Click extension icon to log in.');
    }
});
```

## Step 10: Nuclear Option - Clean Reinstall

```bash
# 1. Remove extension from Chrome
# Go to chrome://extensions/ → Remove

# 2. Clean build
cd /home/akash/Documents/Github/simplify-for-india
rm -rf apps/extension/dist
npm run build

# 3. Reinstall extension
# Go to chrome://extensions/ → Load unpacked → Select dist folder
```

## Quick Checklist

- [ ] Extension is enabled and reloaded
- [ ] Backend is running (`npm run start:dev`)
- [ ] Logged into extension (click icon to verify)
- [ ] Test page has a form with 3+ fields
- [ ] Form has job-related field names (name, email, phone, etc.)
- [ ] Console shows "[Simplify-for-India] Content script loaded"
- [ ] Console shows "[Simplify-for-India] Detected X forms"
- [ ] No red errors in console
- [ ] Opened page in NEW tab (not existing tab)

## Still Not Working?

Share the console output here:
1. Open test-job-form.html
2. Open console (F12)
3. Copy ALL messages
4. Share with me

Or test a real portal like:
- https://www.naukri.com (any job → Apply)
- https://www.linkedin.com/jobs (any job → Easy Apply)
