#!/bin/bash

# Default URL file path
URL_FILE="urls.txt"

# Display usage information
usage() {
  echo "Usage: $0 [OPTIONS]"
  echo "Analyze websites using GraphQL API and optionally HypeStat for traffic data"
  echo
  echo "Options:"
  echo "  -f, --file FILE    Path to text file containing URLs (default: urls.txt)"
  echo "  -h, --help         Display this help message and exit"
  echo
  echo "Example:"
  echo "  $0 --file my_urls.txt"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -f|--file)
      URL_FILE="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

# Check if URL file exists
if [ ! -f "$URL_FILE" ]; then
  echo "Error: URL file '$URL_FILE' not found."
  echo "Please provide a valid file path using the -f or --file option."
  exit 1
fi

# Function to sanitize URL into a safe filename
sanitize_filename() {
  # Remove protocol (http:// or https://)
  local domain=$(echo "$1" | sed -e 's|^https://||' -e 's|^http://||')
  # Remove trailing slashes and anything after
  domain=$(echo "$domain" | sed -e 's|/.*$||')
  echo "$domain"
}

# Function to extract traffic data from HypeStat
get_hypestat_traffic() {
  local domain="$1"
  local output_file="$2"
  
  echo "  - Falling back to HypeStat for traffic data..."
  
  # Create HypeStat URL - format is https://hypestat.com/info/www.domain.com
  local hypestat_url="https://hypestat.com/info/${domain}"
  
  # Get HTML
  local html=$(curl -s "$hypestat_url")
  
  # Extract monthly visits directly if available
  local monthly_visits=$(echo "$html" | grep -o '<div>Monthly Visits<span>[^<]*</span>' | sed -E 's/<div>Monthly Visits<span>([^<]*)<\/span>/\1/')
  
  # If monthly visits not found, calculate from daily visitors
  if [ -z "$monthly_visits" ]; then
    local daily_visitors=$(echo "$html" | grep -o '<div>Daily Visitors<span>[^<]*</span>' | sed -E 's/<div>Daily Visitors<span>([^<]*)<\/span>/\1/')
    
    # Convert K, M notation to numbers
    if [[ "$daily_visitors" == *K ]]; then
      daily_visitors=$(echo "$daily_visitors" | sed 's/K//' | awk '{print $1 * 1000}')
    elif [[ "$daily_visitors" == *M ]]; then
      daily_visitors=$(echo "$daily_visitors" | sed 's/M//' | awk '{print $1 * 1000000}')
    fi
    
    # Calculate monthly visits (daily * 30)
    if [[ -n "$daily_visitors" ]]; then
      monthly_visits=$(echo "$daily_visitors * 30" | bc)
    fi
  else
    # Convert K, M notation to numbers for monthly visits
    if [[ "$monthly_visits" == *K ]]; then
      monthly_visits=$(echo "$monthly_visits" | sed 's/K//' | awk '{print $1 * 1000}')
    elif [[ "$monthly_visits" == *M ]]; then
      monthly_visits=$(echo "$monthly_visits" | sed 's/M//' | awk '{print $1 * 1000000}')
    fi
  fi
  
  # Create a JSON response similar to the original API
  if [[ -n "$monthly_visits" ]]; then
    echo "{\"status\":\"success\",\"source\":\"hypestat\",\"traffic\":{\"estimatedMonthlyVisits\":$monthly_visits}}" > "$output_file"
    return 0
  else
    echo "{\"status\":\"error\",\"message\":\"Could not extract traffic data from HypeStat\"}" > "$output_file"
    return 1
  fi
}

echo "Using URL file: $URL_FILE"

# First clean the URLs and create a mapping file
echo "URL,Sanitized_Filename" > url_mapping.csv
> clean_urls.txt

# Process each URL, remove commas, and create sanitized filenames
while IFS= read -r url || [ -n "$url" ]; do
  # Skip empty lines
  [ -z "$url" ] && continue
  
  # Remove trailing commas
  clean_url=$(echo "$url" | tr -d ',')
  
  # Sanitize domain for filename
  safe_filename=$(sanitize_filename "$clean_url")
  
  # Add to mapping file
  echo "$clean_url,$safe_filename" >> url_mapping.csv
  
  # Add to clean URLs file
  echo "$clean_url" >> clean_urls.txt
done < "$URL_FILE"

echo "URLs cleaned and sanitized. Mapping saved to url_mapping.csv"

# Set batch size and delay
BATCH_SIZE=5
DELAY_BETWEEN_BATCHES=10  # seconds

# Generate a timestamp for this run
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "results_$TIMESTAMP"

# Count total URLs
TOTAL_URLS=$(wc -l < clean_urls.txt)
echo "Processing $TOTAL_URLS URLs in batches of $BATCH_SIZE with $DELAY_BETWEEN_BATCHES seconds delay between batches"
echo "Results will be saved in results_$TIMESTAMP directory"

# Process URLs in batches
BATCH=0
while IFS= read -r url || [ -n "$url" ]; do
  # Skip empty lines
  [ -z "$url" ] && continue
  
  # Get sanitized filename for this URL
  safe_filename=$(sanitize_filename "$url")
  
  # Increment counter
  ((BATCH++))
  
  echo "[$BATCH/$TOTAL_URLS] Analyzing $safe_filename..."
  
  # Technical Analysis
  echo "  - Running technical analysis..."
  curl -s -X POST http://localhost:4000/api/analysis/technical \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$url\"}" \
    --output "results_$TIMESTAMP/${safe_filename}_technical.json"
  
  # Add a small delay between requests to the same endpoint
  sleep 1
  
  # Traffic Analysis
  echo "  - Running traffic analysis..."
  traffic_file="results_$TIMESTAMP/${safe_filename}_traffic.json"
  curl -s -X POST http://localhost:4000/api/analysis/traffic \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$url\"}" \
    --output "$traffic_file"
  
  # Check if traffic analysis was successful (status code 200)
  status_code=$(jq -r '.status // "error"' "$traffic_file" 2>/dev/null)
  if [ "$status_code" != "success" ]; then
    # Try HypeStat as fallback
    get_hypestat_traffic "$safe_filename" "$traffic_file"
  fi
  
  # Add a small delay between requests to the same endpoint
  sleep 1
  
  # CrUX Analysis (optional - many sites return 404)
  echo "  - Running CrUX analysis..."
  curl -s -X POST http://localhost:4000/api/analysis/crux \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$url\"}" \
    --output "results_$TIMESTAMP/${safe_filename}_crux.json"
  
  # Add a small delay between requests to the same endpoint
  sleep 1
  
  # PSI Analysis (optional - can be slow)
  echo "  - Running PageSpeed analysis..."
  curl -s -X POST http://localhost:4000/api/analysis/psi \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$url\"}" \
    --output "results_$TIMESTAMP/${safe_filename}_psi.json"
  
  # If we've processed a batch, pause to respect rate limits
  if (( BATCH % BATCH_SIZE == 0 )); then
    echo "Completed batch $(( BATCH / BATCH_SIZE )). Pausing for $DELAY_BETWEEN_BATCHES seconds to respect rate limits..."
    sleep $DELAY_BETWEEN_BATCHES
  else
    # Small delay between sites
    sleep 2
  fi
  
done < clean_urls.txt

echo "All analyses complete. Results saved in the 'results_$TIMESTAMP' directory."

# Create a summary of results
echo "Creating summary of results..."
echo "URL,WordPress,WP Version,Theme,Plugins,Server,CDN" > "results_$TIMESTAMP/technical_summary.csv"

# Loop through all technical JSON files
for file in results_$TIMESTAMP/*_technical.json; do
  filename=$(basename "$file" _technical.json)
  
  # Find the original URL from the mapping file
  original_url=$(grep ",$filename$" url_mapping.csv | cut -d',' -f1)
  
  # If not found, use the filename
  if [ -z "$original_url" ]; then
    original_url="https://$filename"
  fi
  
  # Extract data with proper error handling
  wp_detected=$(jq -r '.wordpress.core.detected // "N/A"' "$file" 2>/dev/null || echo "Error")
  wp_version=$(jq -r '.wordpress.core.version // "N/A"' "$file" 2>/dev/null || echo "N/A")
  wp_theme=$(jq -r '.wordpress.theme.name // "N/A"' "$file" 2>/dev/null || echo "N/A")
  wp_plugins=$(jq -r '.wordpress.plugins.total // "N/A"' "$file" 2>/dev/null || echo "N/A")
  server=$(jq -r '.infrastructure.headers.server // "N/A"' "$file" 2>/dev/null || echo "N/A")
  cdn=$(jq -r '.infrastructure.headers.cdn | if . then . | join(", ") else "N/A" end' "$file" 2>/dev/null || echo "N/A")
  
  echo "$original_url,$wp_detected,$wp_version,$wp_theme,$wp_plugins,$server,$cdn" >> "results_$TIMESTAMP/technical_summary.csv"
done

echo "Technical summary created at results_$TIMESTAMP/technical_summary.csv"

# Create traffic summary
echo "Creating traffic summary..."
echo "URL,Rank,Monthly Visits,Confidence,Source" > "results_$TIMESTAMP/traffic_summary.csv"

# Loop through all traffic JSON files
for file in results_$TIMESTAMP/*_traffic.json; do
  filename=$(basename "$file" _traffic.json)
  
  # Find the original URL from the mapping file
  original_url=$(grep ",$filename$" url_mapping.csv | cut -d',' -f1)
  
  # If not found, use the filename
  if [ -z "$original_url" ]; then
    original_url="https://$filename"
  fi
  
  # Extract data with proper error handling
  rank=$(jq -r '.rank // "N/A"' "$file" 2>/dev/null || echo "N/A")
  visits=$(jq -r '.traffic.estimatedMonthlyVisits // "N/A"' "$file" 2>/dev/null || echo "N/A")
  confidence=$(jq -r '.confidence // "N/A"' "$file" 2>/dev/null || echo "N/A")
  source=$(jq -r '.source // "api"' "$file" 2>/dev/null || echo "api")
  
  echo "$original_url,$rank,$visits,$confidence,$source" >> "results_$TIMESTAMP/traffic_summary.csv"
done

echo "Traffic summary created at results_$TIMESTAMP/traffic_summary.csv"