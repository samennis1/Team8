#!/bin/sh
if [ -n "$FIREBASE_CONFIG_BASE64" ]; then
    echo "Decoding Firebase config..."
    echo "$FIREBASE_CONFIG_BASE64" | base64 -d > firebase_config.json
else
    echo "No Firebase config provided!"
fi

exec "$@"
