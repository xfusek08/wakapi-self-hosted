# Wakapi Time Tracking Service

Local setup for Wakapi time tracking service running in Docker.

## Setup

1. Ensure Docker is installed and running
2. Make the setup script executable:
```bash
chmod +x setup-service.sh
```
3. Run the setup script:
```bash
./setup-service.sh
```

## Service Management

Check service status:
```bash
sudo systemctl status wakapi.service
```

Start the service:
```bash
sudo systemctl start wakapi.service
```

Stop the service:
```bash
sudo systemctl stop wakapi.service
```

Restart the service:
```bash
sudo systemctl restart wakapi.service
```

View logs:
```bash
journalctl -u wakapi.service
```

## Files

- `wakapi.service`: Systemd service configuration
- `run-wakapi.zsh`: Service execution script
- `setup-service.sh`: Service installation script
- `salt`: Secret key for the service
