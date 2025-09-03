# Deployment Instructions for Chores & Rewards

## Option 1: Docker Deployment (Recommended)

### Prerequisites
1. Install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
2. Enable WSL2 integration if prompted

### Quick Start
1. Download/copy all app files to your server
2. Open PowerShell/Command Prompt in the app directory
3. Run these commands:

```bash
# Build and start the container
docker-compose up -d

# Check if running
docker-compose ps
```

**Your app will be available at:** `http://your-server-ip:3000`

### Docker Commands
```bash
# Start the app
docker-compose up -d

# Stop the app
docker-compose down

# View logs
docker-compose logs -f chores-app

# Update the app (after code changes)
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Option 2: Direct Windows Hosting

### Prerequisites
1. Install [Node.js 20+](https://nodejs.org/) on your Windows server
2. Install [Git for Windows](https://git-scm.com/download/win) (optional, for updates)

### Setup Steps
1. Download/copy all app files to your server (e.g., `C:\chores-rewards\`)
2. Open PowerShell as Administrator
3. Navigate to the app directory:
   ```powershell
   cd C:\chores-rewards\
   ```
4. Install dependencies:
   ```powershell
   npm install
   ```
5. Build the production app:
   ```powershell
   npm run build
   ```
6. Start the app:
   ```powershell
   npm start
   ```

**Your app will be available at:** `http://your-server-ip:5000`

### Windows Service (Optional)
To run as a Windows service that auto-starts:
1. Install PM2: `npm install -g pm2`
2. Create service: `pm2 start npm --name "chores-rewards" -- start`
3. Save PM2 config: `pm2 save`
4. Setup auto-startup: `pm2 startup`

---

## Accessing from Other Devices

### Local Network Access
- **Same WiFi:** `http://[your-server-local-ip]:3000` (Docker) or `:5000` (direct)
- Find your server's local IP: `ipconfig` in Command Prompt

### Internet Access (Optional)
1. **Router port forwarding:** Forward external port to internal port 3000/5000
2. **Dynamic DNS:** Use services like No-IP or DynDNS for easy access
3. **Reverse proxy:** Use nginx or Traefik for multiple apps

---

## Security Notes
- This app stores all data locally in each browser (IndexedDB)
- No user accounts or server-side data storage
- Safe to expose on local network
- For internet exposure, consider adding HTTPS with Let's Encrypt

---

## App Features
✅ **Offline-first PWA** - Works without internet after first load
✅ **Mobile optimized** - Installable on phones/tablets  
✅ **Family chore tracking** - Multiple children, custom chores
✅ **Reward system** - Track earnings in dollars or points
✅ **Favorites system** - Star important chores for quick access