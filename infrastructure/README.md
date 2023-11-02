Rename .example-env to .env
Change it with your access_key and secret_key

Export the variables locally with running the following line
export $(grep -v '^#' .env | xargs)

Use the following to unset the variables
unset $(grep -v '^#' .env | sed -E 's/(.*)=.*/\1/' | xargs)

The env.sh will take care that terraform has access to these env variables

Perhaps the script will need to be made executable with:
chmod u+x env.sh

terraform plan -out='outplan'
terraform apply -auto-aprove "outplan"

TODOs: 
implement SES
rds proxy
lambda secret manager extension
observability

explore fauna