#!/usr/bin/env bash
set -euo pipefail

# Generate frontend/config.js with API URL provided by environment variable API_URL
mkdir -p frontend
API_URL="${API_URL:-https://openforge-48r0.onrender.com/api}"
cat > frontend/config.js <<EOF
window.OPENFORGE_API_URL = "${API_URL}";
EOF

echo "Generated frontend/config.js with OPENFORGE_API_URL=${API_URL}"