## Extension Autofill Quick Checks

Run these after building the extension with the updated profile fields.

- **Smoke load**: Log in, open popup, confirm new profile fields render and save without errors. Toggle dry-run on/off and verify it persists after closing the popup.
- **Dry-run highlight**: On any long form (10+ inputs), click the floating “Autofill” button with dry-run enabled. Fields should highlight without mutating values; notification says “Previewed”.
- **Name split**: Use a form with separate first/last name. Save profile with distinct first/last. Dry-run should mark both; disable one of the toggles and confirm only the other highlights.
- **Contact links**: Form with generic text inputs labeled LinkedIn / Portfolio / GitHub. Ensure toggles are on; highlights or fills match saved URLs.
- **Location + phone**: Form with “City” or “Location” and “Phone”. Should map to currentLocation/location and phoneNumber respectively; disable location toggle to verify skip.
- **Company + salary**: Form with “Current Company”, “Current CTC”, “Expected/Desired Salary”, “Notice Period”. Values should come from currentCompany/currentCtc/expectedCtc or desiredSalary/noticePeriodDays.
- **Cover letter / work history**: Form with large textarea labeled “Cover Letter” or “Work Experience/History”. When profile has snippets, they should fill/highlight; if empty, employment history summary is used as fallback.
- **Education**: Form with “Education/Qualification” and “Institution/College”. Should fill from first education entry.
- **Disable fields**: Turn off GitHub/Portfolio toggles, rerun dry-run on same form; those fields should no longer highlight or fill.
- **Live fill**: Turn off dry-run and rerun on the same form. Values should fill and trigger change events; submission should succeed if form validation passes.
