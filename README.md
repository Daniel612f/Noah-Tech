# Fertilizer Factory Manager

This small web app lets you record fertilizer production and shipment events. Data is stored in your browser's LocalStorage and can be exported to an Excel file.

## Files
- `index.html` – data entry form and record list
- `dashboard.html` – dashboard with charts and read‑only table
- `style.css` – basic styling
- `app.js` – application logic shared by both pages

Run a local server so the two pages share the same origin (this allows data saved in LocalStorage to be visible on the dashboard):

```bash
npm install
npm start
```

Then browse to `http://localhost:3000/index.html` to start adding data. Use the tabs in the top bar to switch between the Input page and the Dashboard. Click **Export Excel** to download all records as an `.xlsx` file.
