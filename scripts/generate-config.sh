#!/usr/bin/env bash
set -euo pipefail

# Generate frontend/config.js with API URL provided by environment variable API_URL
mkdir -p frontend
API_URL="${API_URL:-http://127.0.0.1:5000/api}"
cat > frontend/config.js <<EOF
window.OPENFORGE_API_URL = "${API_URL}";
EOF

echo "Generated frontend/config.js with OPENFORGE_API_URL=${API_URL}"