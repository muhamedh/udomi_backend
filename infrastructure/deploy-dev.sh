echo "Deploying to dev1"
cd ./apis/pets
npm run build-prod
cd ../..
export $(grep -v '^#' .env | xargs)
echo "Exported env vars"
terraform plan -out dev.tfplan 
terraform apply -auto-approve dev.tfplan