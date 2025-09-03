# Chores & Rewards - Production Deployment Guide

## Quick Start

1. **Deploy the app:**
   ```powershell
   docker-compose up -d
   ```

2. **Test locally:**
   - Visit: `http://192.168.1.200`

3. **Set up external access:**
   - Configure DNS: Point `www.choresandrewards.app` to `180.181.214.90`
   - Configure router port forwarding: 80 and 443 → 192.168.1.200
   - Set up Cloudflare for SSL (see below)

## Cloudflare SSL Setup (Recommended)

1. **Create free Cloudflare account** at cloudflare.com
2. **Add your domain:** `choresandrewards.app`
3. **Update nameservers** at your domain registrar to Cloudflare's
4. **Add DNS records:**
   - A record: `choresandrewards.app` → `180.181.214.90` (Proxy enabled/orange cloud)
   - A record: `www.choresandrewards.app` → `180.181.214.90` (Proxy enabled/orange cloud)

## Router Configuration (TP-Link ArcherAX50)

**Port Forwarding Rules:**
- External Port 80 → Internal IP 192.168.1.200 Port 80
- External Port 443 → Internal IP 192.168.1.200 Port 443

## Testing

**Local Testing:**
- `http://192.168.1.200` (should work immediately)

**External Testing (after DNS setup):**
- `https://www.choresandrewards.app` (automatic SSL via Cloudflare)
- `https://choresandrewards.app` (automatic SSL via Cloudflare)

## Monitoring

Check app status:
```powershell
docker ps
docker logs chores-rewards-app
```

## Troubleshooting

**If local access doesn't work:**
- Check Docker: `docker ps`
- Check logs: `docker logs chores-rewards-app`

**If external access doesn't work:**
- Verify DNS propagation: `nslookup www.choresandrewards.app`
- Check port forwarding in router
- Verify Cloudflare proxy is enabled (orange cloud)

## Architecture

- **App:** React PWA running on Node.js/Express
- **SSL:** Cloudflare handles SSL termination automatically
- **Storage:** IndexedDB (client-side, no database needed)
- **Offline:** Full PWA functionality works offline