#!/bin/bash

# Find the correct Python that has our dependencies installed
PYTHON_BIN="/opt/homebrew/bin/python3.10"

# Check if the Python exists
if [ ! -f "$PYTHON_BIN" ]; then
    echo "Error: Python binary not found at $PYTHON_BIN"
    echo "Attempting to find another suitable Python..."
    
    # Try to find Python with pip that has flask installed
    if command -v pip3 &> /dev/null; then
        FLASK_PATH=$(pip3 show flask | grep Location | awk '{print $2}')
        if [ -n "$FLASK_PATH" ]; then
            echo "Flask found at: $FLASK_PATH"
            # Extract Python version from path
            PYTHON_VERSION=$(echo "$FLASK_PATH" | grep -o "python[0-9]\.[0-9]*" | sed 's/python//')
            echo "Found Python version: $PYTHON_VERSION"
            
            # Try commonly used paths
            POSSIBLE_PATHS=(
                "/opt/homebrew/bin/python$PYTHON_VERSION"
                "/usr/local/bin/python$PYTHON_VERSION"
                "/usr/bin/python$PYTHON_VERSION"
            )
            
            for path in "${POSSIBLE_PATHS[@]}"; do
                if [ -f "$path" ]; then
                    PYTHON_BIN="$path"
                    echo "Using Python at: $PYTHON_BIN"
                    break
                fi
            done
        fi
    fi
    
    # If still not found, try the system python
    if [ ! -f "$PYTHON_BIN" ]; then
        echo "Warning: Could not find a suitable Python with flask installed."
        echo "Falling back to system python. This might not work if dependencies aren't installed."
        PYTHON_BIN=$(which python3)
    fi
fi

echo "Starting embedding service with Python: $PYTHON_BIN"
echo "Press Ctrl+C to stop the service"

# Run the app with the selected Python
$PYTHON_BIN app.py 