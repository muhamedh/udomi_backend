# All /users HTTP methods go under this resource
# This method attaches to root API in api-gw-pets.tf
resource "aws_api_gateway_resource" "users_endpoint" {
  path_part   = "users"
  parent_id   = aws_api_gateway_rest_api.pets_api.root_resource_id
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
}

# create a POST method under /users resource
resource "aws_api_gateway_method" "edit_user_endpoint" {
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.api_authorizer.id
  http_method   = "POST"
  resource_id   = aws_api_gateway_resource.users_endpoint.id
  rest_api_id   = aws_api_gateway_rest_api.pets_api.id
}

# create a LAMBDA proxy for the POST /users resource
resource "aws_api_gateway_integration" "lambda_user_pets_api_integration" {
  http_method             = aws_api_gateway_method.edit_user_endpoint.http_method
  resource_id             = aws_api_gateway_resource.users_endpoint.id
  rest_api_id             = aws_api_gateway_rest_api.pets_api.id
  uri                     = aws_lambda_function.pets_api.invoke_arn
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
}

#create a OPTIONS method for CORS needs
resource "aws_api_gateway_method" "options_method_users" {
  rest_api_id   = aws_api_gateway_rest_api.pets_api.id
  resource_id   = aws_api_gateway_resource.users_endpoint.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# hardcode OPTIONS response 
resource "aws_api_gateway_method_response" "options_200_users" {
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
  resource_id = aws_api_gateway_resource.users_endpoint.id
  http_method = aws_api_gateway_method.options_method_users.http_method
  status_code = "200"
  response_models = {
    "application/json" = "Empty"
  }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
  depends_on = [aws_api_gateway_method.options_method_users]
}

# mock an integration in order for OPTIONS method to return CORS info
resource "aws_api_gateway_integration" "options_integration_users" {
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
  resource_id = aws_api_gateway_resource.users_endpoint.id
  http_method = aws_api_gateway_method.options_method_users.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{statusCode: 200}"
  }
  depends_on = [aws_api_gateway_method.options_method_users]
}

# integration response -> what the CORS policy for this method will be.
resource "aws_api_gateway_integration_response" "options_integration_response_users" {
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
  resource_id = aws_api_gateway_resource.users_endpoint.id
  http_method = aws_api_gateway_method.options_method_users.http_method
  status_code = aws_api_gateway_method_response.options_200_users.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_method_response.options_200_users]
}