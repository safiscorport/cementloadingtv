SAFISCOR PORT OPERATIONS DASHBOARD — TV LAYOUT FIX

Files:
- index.html
- styles.css
- app.js
- data.json

Deployment:
1. Back up your current dashboard folder.
2. Replace these four files in the same folder as your existing logo.png.
3. Keep logo.png in that folder; it is referenced by index.html.
4. Publish/sync the folder to GitHub Pages or your existing web host.
5. On the Smart TV / Edge kiosk, refresh the page (Ctrl+F5 on a PC).

Target:
- Tuned for 1920x1080 Full HD landscape TV.
- Uses matching grid tracks for table headings and data rows.
- Prevents long vessel/remarks text from expanding columns.
- Compresses table rows and analytics panels to fit the viewport.

Note:
The supplied data.json is preserved exactly. The layout patch does not invent
missing records; any absent R3 or Berth F records must be present in the source
workbook/data generator to appear in the dashboard.
