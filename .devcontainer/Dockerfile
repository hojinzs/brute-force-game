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

# Install pnpm
RUN npm install -g pnpm@latest

# Install Bun
# Note: Installing for both root and node user ensures proper permissions
# and PATH configuration for each user context
RUN curl -fsSL https://bun.sh/install | bash
ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"
RUN su node -c "BUN_INSTALL=/home/node/.bun curl -fsSL https://bun.sh/install | bash"

# Install Deno
RUN curl -fsSL https://deno.land/install.sh | sh
ENV DENO_INSTALL="/root/.deno"
ENV PATH="$DENO_INSTALL/bin:$PATH"
RUN su node -c "DENO_INSTALL=/home/node/.deno curl -fsSL https://deno.land/install.sh | sh"

# Install Supabase CLI
RUN curl -fsSL https://raw.githubusercontent.com/supabase/supabase/master/apps/cli/install.sh | sh
ENV PATH="/root/.supabase/bin:$PATH"
RUN su node -c "curl -fsSL https://raw.githubusercontent.com/supabase/supabase/master/apps/cli/install.sh | sh"

# Set up environment for node user
USER node

# Add tools to PATH for node user
ENV PATH="/home/node/.bun/bin:$PATH"
ENV PATH="/home/node/.deno/bin:$PATH"
ENV PATH="/home/node/.supabase/bin:$PATH"

# Set working directory
WORKDIR /workspace
