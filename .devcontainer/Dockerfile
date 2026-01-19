FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

# Switch to root to install packages
USER root

# Install system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    curl \
    wget \
    git \
    ca-certificates \
    unzip \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install pnpm only
RUN npm install -g pnpm@latest

# Set up environment for node user
USER node

# Set working directory
WORKDIR /workspace
