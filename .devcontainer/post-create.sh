#!/bin/bash
set -e

echo "🚀 Setting up Brute Force AI development environment..."

# Check and setup opencode config if it exists on host
if command -v opencode &> /dev/null; then
    echo "✅ OpenCode is installed and ready"
else
    echo "⚠️  OpenCode installation may still be in progress"
fi

# Install Bun
echo "📦 Installing Bun..."
export BUN_INSTALL="/home/node/.bun"
curl -fsSL https://bun.sh/install | bash
export PATH="$BUN_INSTALL/bin:$PATH"

# Install Deno
echo "📦 Installing Deno..."
export DENO_INSTALL="/home/node/.deno"
curl -fsSL https://deno.land/install.sh | sh
export PATH="$DENO_INSTALL/bin:$PATH"

# Install Supabase CLI
echo "📦 Installing Supabase CLI..."
curl -fsSL https://raw.githubusercontent.com/supabase/supabase/master/apps/cli/install.sh | sh
export PATH="/home/node/.supabase/bin:$PATH"

# Install project dependencies
echo "📦 Installing pnpm dependencies..."
pnpm install

# Verify installations
echo "✅ Verifying tool installations..."
echo "Node version: $(node --version)"
echo "pnpm version: $(pnpm --version)"
echo "Bun version: $(bun --version)"
echo "Deno version: $(deno --version | head -n 1)"
echo "Supabase CLI version: $(supabase --version)"
if command -v opencode &> /dev/null; then
    echo "OpenCode: Installed ✓"
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local template..."
    cat > .env.local << 'EOF'
# Supabase Configuration
# ⚠️  WARNING: Replace placeholder values with actual keys from 'supabase start'
# This file is git-ignored and should NOT be committed
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=REPLACE_WITH_SUPABASE_ANON_KEY

# Add your environment variables here
EOF
    echo "⚠️  Please update .env.local with your Supabase keys after running 'supabase start'"
fi

echo "✨ Dev container setup complete!"
echo ""
echo "📚 Next steps:"
echo "  1. Run 'supabase start' to start local Supabase"
echo "  2. Run 'pnpm dev' to start the Next.js development server"
echo "  3. Open http://localhost:3000 in your browser"
echo ""
