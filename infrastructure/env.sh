#!/bin/sh

# env.sh

# Change the contents of this output to get the environment variables
# of interest. The output must be valid JSON, with strings for both
# keys and values.
cat <<EOF
{
  "ACCESS_KEY": "$ACCESS_KEY",
  "SECRET_KEY": "$SECRET_KEY"
}
EOF