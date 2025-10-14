# Network Setup Guide for CardMatch Game on WSL

This guide will help you make your CardMatch game accessible from other devices on your local WiFi network (192.168.29.x).

## Quick Setup Steps

### 1. Start the CardMatch Server

```bash
cd /home/hemanth-dev/projects/cardmatch-local-js
npm start
```

### 2. Configure Windows Port Forwarding (Required for WSL)

Open **Windows PowerShell as Administrator** and run:

```powershell
# Forward traffic from Windows host to WSL
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=192.168.103.49

# Verify the port forwarding rule
netsh interface portproxy show all
```

**Note:** Replace `192.168.103.49` with your actual WSL IP address (shown when you start the server).

### 3. Configure Windows Firewall

#### Option A: Using Windows Defender Firewall GUI

1. Open **Windows Defender Firewall with Advanced Security**
2. Click **Inbound Rules** → **New Rule**
3. Select **Port** → **Next**
4. Select **TCP** and **Specific local ports**: `3000`
5. Select **Allow the connection**
6. Apply to all profiles (Domain, Private, Public)
7. Name it "CardMatch Game Server"

#### Option B: Using PowerShell (Administrator)

```powershell
# Allow inbound traffic on port 3000
New-NetFirewallRule -DisplayName "CardMatch Game Server" -Direction Inbound -Port 3000 -Protocol TCP -Action Allow

# Allow outbound traffic on port 3000 (if needed)
New-NetFirewallRule -DisplayName "CardMatch Game Server Out" -Direction Outbound -Port 3000 -Protocol TCP -Action Allow
```

### 4. Test Network Access

1. **From your Windows machine:** Open `http://localhost:3000`
2. **From other devices on WiFi:** Open `http://YOUR_WINDOWS_IP:3000`

## Troubleshooting

### If other devices can't connect:

1. **Check Windows IP:** Find your Windows machine's IP address:

   ```cmd
   ipconfig
   ```

2. **Check port forwarding:** Verify the rule exists:

   ```powershell
   netsh interface portproxy show all
   ```

3. **Test firewall:** Temporarily disable Windows Firewall to test connectivity.

4. **Check WSL connectivity:** From WSL, test if the server is accessible:
   ```bash
   curl http://localhost:3000
   ```

### Remove port forwarding (if needed):

```powershell
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0
```

### Remove firewall rule (if needed):

```powershell
Remove-NetFirewallRule -DisplayName "CardMatch Game Server"
```

## Network Architecture

```
[WiFi Device] → YOUR_WINDOWS_IP:3000 → [Windows] → [WSL: WSL_IP:3000] → [CardMatch Server]
```

The port forwarding rule routes network traffic from your Windows host to the WSL instance running the game server.

## Security Note

This configuration allows any device on your local network to access the game. Only use on trusted networks. To restrict access, you can:

1. Use specific IP addresses in firewall rules
2. Set up port forwarding only when playing
3. Remove rules after gaming sessions

## Game URLs to Share

- **Host (Windows):** `http://localhost:3000`
- **Network Players:** `http://YOUR_WINDOWS_IP:3000`
- **WSL Direct:** `http://192.168.103.49:3000` (may not work from other devices)

---

🎮 **Happy Gaming!** Share `http://YOUR_WINDOWS_IP:3000` with up to 9 friends on your WiFi network!
