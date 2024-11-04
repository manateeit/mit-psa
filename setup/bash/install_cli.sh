#!/bin/bash

# Function to check if we're on Windows
is_windows() {
    [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* ]]
}

# Function to get the appropriate config file
get_config_file() {
    if is_windows; then
        echo "$USERPROFILE\.bashrc"
    else
        echo "$HOME/.bashrc"
    fi
}

# Function to get the appropriate PATH separator
get_path_separator() {
    if is_windows; then
        echo ";"
    else
        echo ":"
    fi
}

# Get the full path of the sebastian file
if is_windows; then
    PROJECT_DIR=$(cygpath -w "$(realpath sebastian)")
    SEBASTIAN_DIR="$PROJECT_DIR/setup"
    SEBASTIAN_PATH="$SEBASTIAN_DIR/sebastian"
else
    PROJECT_DIR=$(realpath .)
    SEBASTIAN_DIR="$PROJECT_DIR/setup"
    SEBASTIAN_PATH="$SEBASTIAN_DIR/sebastian"
fi

SHELL_CONFIG=$(get_config_file)
PATH_SEPARATOR=$(get_path_separator)

# Function to add directory to PATH if not already present
add_to_path() {
    if ! grep -q "export PATH=.*$SEBASTIAN_DIR" "$SHELL_CONFIG"; then
        echo "export PATH=\"\$PATH$PATH_SEPARATOR$SEBASTIAN_DIR\"" >> "$SHELL_CONFIG"
        echo "Added $SEBASTIAN_DIR to PATH in $SHELL_CONFIG"
    else
        echo "$SEBASTIAN_DIR is already in PATH"
    fi
}

add_to_env() {
    if ! grep -q "export SEBASTIAN_PROJECT_PATH=$PROJECT_DIR" "$SHELL_CONFIG"; then
        echo "export SEBASTIAN_PROJECT_PATH=$PROJECT_DIR" >> "$SHELL_CONFIG"
        echo "Added $PROJECT_DIR to PATH in $SHELL_CONFIG"
    else
        echo "$PROJECT_DIR is already in PATH"
    fi
}

add_config_file () {
    # Define the file path
    file_path="$HOME/.sebastian"


    # Check if we have permission to write to the root directory
    if [ -w "$HOME" ]; then
        # Save the variable to the file
        echo "default=$PROJECT_DIR" > "$file_path"
        echo "Variable 'default' with value [ $PROJECT_DIR ] has been saved to $file_path"
    else
        echo "Error: You don't have permission to write to the root directory."
        echo "Please run this script with sudo or as root."
    fi
}


# Add to PATH and ENV
add_to_path
# add_to_env
add_config_file

# Make sure sebastian is executable
chmod +x "$SEBASTIAN_PATH"

if is_windows; then
    # On Windows, we'll add sebastian to the system PATH
    setx PATH "%PATH%;$SEBASTIAN_DIR"
    echo "Added $SEBASTIAN_DIR to system PATH"
else
    # On Unix-like systems, create a symlink in /usr/local/bin
    sudo ln -sf "$SEBASTIAN_PATH" /usr/local/bin/sebastian
    echo "Created symlink in /usr/local/bin"

    # Ensure .bashrc is sourced in .bash_profile
    if [ -f "$HOME/.bash_profile" ]; then
        if ! grep -q "source.*\.bashrc" "$HOME/.bash_profile"; then
            echo "source $SHELL_CONFIG" >> "$HOME/.bash_profile"
            echo "Updated .bash_profile to source .bashrc"
        fi
    else
        echo "source $SHELL_CONFIG" > "$HOME/.bash_profile"
        echo "Created .bash_profile to source .bashrc"
    fi
fi

echo "Sebastian has been installed and should be available in new terminal sessions."
source $SHELL_CONFIG
sebastian version