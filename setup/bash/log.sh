function getLogger {
    application="$1"

    send_log() {
        level="$1"
        message="$2"
        timestamp=$(date +%s)


        # Convert log level to uppercase
         local level_upper=$(echo "$level" | tr '[:lower:]' '[:upper:]' | awk '{printf "%-8s", $0}')


        # Get current timestamp in human-readable format
        local echotime=$(date +"%b %d %H:%M:%S")

        # Define color codes
        local RED='\033[0;31m'       # Error messages
        local GREEN='\033[0;32m'     # Info messages
        local YELLOW='\033[0;33m'    # Warning messages
        local CYAN='\033[0;36m'      # Debug messages
        local PURPLE='\033[0;35m'    # Trace messages
        local BLUE='\033[0;34m'     # System messages
        local NC='\033[0m'           # No Color

        # Select the color based on the level
        case "$level" in
            info)
                color=$GREEN
                ;;
            warning)
                color=$YELLOW
                ;;
            error)
                color=$RED
                ;;
            debug)
                color=$CYAN
                ;;
            trace)
                color=$PURPLE
                ;;
            system)
                color=$BLUE
                ;;
            *)
                color=$NC
                ;;
        esac


        echo -e "${color}${level_upper}: ${NC}[ ${echotime} ] -> ${color}${message}${NC}"
    }

    export -f send_log
}