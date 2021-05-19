# EBANET - Cliente para impresión

- `package.json` - Points to the app's main file and lists its details and dependencies.
- `main.js` - Starts the app and creates a browser window to render HTML. This is the app's **main process**.
- `index.html` - A web page to render. This is the app's **renderer process**.


```bash
# Clone this repository
git clone https://github.com/FiboSystems/ebanet-printer-client.git
# Go into the repository
cd ebanet-printer-client
# Install dependencies
npm install
# Run the app
npm start
# Build the installer (x64/ia32)
npm run make

