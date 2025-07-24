
# Copy service file to systemd directory
sudo cp $HOME/.wakapi/wakapi.service /etc/systemd/system/

# Reload systemd, enable and start service
sudo systemctl daemon-reload
sudo systemctl enable wakapi.service
sudo systemctl start wakapi.service

sudo systemctl status wakapi.service
