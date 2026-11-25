# Shivasha Seva — सेवा ही धर्म

A responsive Hindi-first community service website for connecting people who want to help vulnerable people, animals and birds.

## Website sections

- Human assistance for people in need, older adults and people with disabilities
- Animal rescue and veterinary-help coordination
- Bird food, water and injured-bird support
- Health and blood-donation coordination
- Education materials for children
- Volunteer network
- Service-request and volunteer-interest forms
- Donation transparency and safety guidance

## Run locally

This is a static website. Open `index.html` in a browser, or serve the folder with any static HTTP server.

## Deploy with GitHub Pages

This repository deploys through the GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

1. Open repository **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push changes to the `main` branch, or manually run **Deploy Shivasha Seva to GitHub Pages** from the Actions tab.
4. After the workflow completes successfully, open:
   `https://devops-saurabhpandey.github.io/shivasha-seva/`

## Important current limitations

- The forms prepare a message using the device share sheet or clipboard. They do **not** submit information to a server or notify an administrator.
- No payment gateway, donation collection, login, case-management database or live volunteer directory is connected.
- Do not publish personal information, photos of vulnerable people, exact rescue locations or medical details without informed consent.
- Do not promise rescue or medical response until a verified local response network is operating.
- In immediate danger or serious injury, contact the relevant local emergency service or qualified professional directly.

## Recommended next production steps

1. Confirm the responsible legal entity, public contact details and safeguarding policy.
2. Add a secure backend with spam protection, consent, access controls and data-retention rules.
3. Add an admin review queue before publishing any public help request.
4. Verify partner NGOs, animal rescuers, veterinary providers and blood donors.
5. Publish donation details only after legal, banking and accounting checks; publish periodic receipts and expense reports.
6. Publish a privacy policy, terms, grievance contact and deletion-request process before collecting personal data.

## Tech

Plain HTML, CSS and JavaScript. No build step or third-party runtime dependency.
