
  # Pets API Backend infrastructure 📝  

This is the Terraform infrastructure for the backend services

  ## Get Started 🚀  

Make sure to rename .example-env to .env
Change it with your `access_key` and `secret_key` from AWS

Export the variables locally with running the following line

~~~bash  
export $(grep -v '^#' .env | xargs)
~~~

Use the following to unset the variables
~~~bash 
unset $(grep -v '^#' .env | sed -E 's/(.*)=.*/\1/' | xargs)
~~~

The env.sh will take care that terraform has access to these env variables
Perhaps the script will need to be made executable with:

~~~bash
chmod u+x env.sh
~~~

To deploy infrastructure or API code changes make sure that:
- You have made a new production-build for APIs (look into APIs README.md)
- Environment variables have been exported

First plan your changes
~~~bash
terraform plan -out='outplan'
~~~
If the plan matches your expectations, apply it.
~~~bash
terraform apply -auto-approve "outplan"
~~~
