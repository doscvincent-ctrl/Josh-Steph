# Wedding Website

A React + Vite wedding website with an RSVP form backed by Google Sheets through Google Apps Script.

## Local development

```bash
npm install
copy .env.example .env
npm run dev
```

Replace the placeholder URL in `.env` with the deployed Google Apps Script web app URL before testing RSVP submissions.

## GitHub Pages setup

1. Push this folder to a GitHub repository using the `main` branch.
2. In the repository, open **Settings > Secrets and variables > Actions**.
3. Add an Actions secret named `VITE_SHEETS_WEB_APP_URL` containing the deployed Apps Script URL.
4. Open **Settings > Pages** and set **Source** to **GitHub Actions**.
5. Push to `main` or run the **Deploy to GitHub Pages** workflow manually.

The workflow in `.github/workflows/deploy.yml` builds the site and deploys `dist` to GitHub Pages.

## Google Apps Script

Copy `google-apps-script/Code.gs` into the Apps Script project connected to the response spreadsheet. Deploy it as a web app with access set to **Anyone**. The script creates the RSVP header row and sends confirmation emails after saving responses.
