#!/usr/bin/env zsh

# https://github.com/muety/wakapi

# Define colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create wakapi directory if it doesn't exist
mkdir -p ~/.wakapi

# Define salt file path
SALT_FILE=~/.wakapi/data/salt
# Generate or read salt
if [ ! -f "$SALT_FILE" ]; then
    echo -e "${YELLOW}🔑 Generating new salt...${NC}"
    cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1 >"$SALT_FILE"
fi
SALT=$(cat "$SALT_FILE")

# if container exists, stop and remove it
if [ "$(docker ps -aq -f name=wakapi)" ]; then
    echo -e "${YELLOW}🛑 Stopping existing wakapi container...${NC}"
    docker stop wakapi
    echo -e "${YELLOW}🗑️ Removing existing wakapi container...${NC}"
    docker rm wakapi
fi

# Check for image updates
echo -e "${YELLOW}🔄 Checking for wakapi image updates...${NC}"
local IMAGE="ghcr.io/muety/wakapi:latest"
local PULL_OUTPUT=$(docker pull $IMAGE 2>&1)

if [[ $PULL_OUTPUT == *"Image is up to date"* ]]; then
    echo -e "${GREEN}✅ Image is already up to date${NC}"
elif [[ $PULL_OUTPUT == *"Downloaded newer image"* ]]; then
    echo -e "${GREEN}✅ Downloaded newer image for wakapi${NC}"
else
    echo -e "${GREEN}✅ Image pulled successfully${NC}"
fi

echo -e "${YELLOW}🚀 Starting wakapi container...${NC}"

# Run the container
docker run -d \
    --restart unless-stopped \
    -p 3100:3000 \
    -e "WAKAPI_PASSWORD_SALT=$SALT" \
    -v ~/.wakapi/data:/data \
    --name wakapi \
    $IMAGE

# message that container is running successfully
if [ "$(docker ps -q -f name=wakapi)" ]; then
    echo -e "${GREEN}✅ Wakapi is running successfully on port: 3100!${NC}"
else
    echo -e "\033[0;31m❌ Wakapi failed to start.${NC}"
fi
