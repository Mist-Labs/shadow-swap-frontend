#!/bin/bash

# Build the snap with all origins allowed and bundle it into the Next.js app

SNAP_DIR=".build/WebZjs/packages/snap"
PUBLIC_SNAP_DIR="public/snap"

echo "🔨 Building Zcash snap with all origins allowed..."

# Build the snap with local config (allows all origins)
cd "$SNAP_DIR" || exit 1

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "📦 Installing snap dependencies..."
  yarn install
fi

# Build the snap
./build_local.sh

if [ ! -f "dist/bundle.js" ]; then
  echo "❌ Error: Snap build failed - dist/bundle.js not found"
  echo "💡 Try running: cd $SNAP_DIR && yarn install && yarn build:local"
  exit 1
fi

echo "✅ Snap built successfully"

# Go back to project root
cd - || exit 1

# Create public/snap directory
mkdir -p "$PUBLIC_SNAP_DIR"

# Copy snap files to public directory
echo "📦 Copying snap files to public/snap..."
cp "$SNAP_DIR/dist/bundle.js" "$PUBLIC_SNAP_DIR/"
cp "$SNAP_DIR/images/logo.svg" "$PUBLIC_SNAP_DIR/"

# Update manifest to point to bundled location
echo "📝 Updating snap manifest for bundled location..."
jq '
  .source.location = {
    local: {
      filePath: "/snap/bundle.js",
      iconPath: "/snap/logo.svg"
    }
  }
' "$SNAP_DIR/snap.manifest.json" > "$PUBLIC_SNAP_DIR/snap.manifest.json"

echo "✅ Snap bundled into public/snap/"
echo "📝 Snap will be available at: http://localhost:3000/snap/bundle.js"
echo "📝 Install in MetaMask as: local:http://localhost:3000"

