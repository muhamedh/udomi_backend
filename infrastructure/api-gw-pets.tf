# ROOT API "/"
resource "aws_api_gateway_rest_api" "pets_api" {
  name = "dev1-pets"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# set authorizer for whole API resource
resource "aws_api_gateway_authorizer" "api_authorizer" {
  name          = "CognitoUserPoolAuthorizer"
  type          = "COGNITO_USER_POOLS"
  rest_api_id   = aws_api_gateway_rest_api.pets_api.id
  provider_arns = [aws_cognito_user_pool.user_pool.arn]
}

# ALL /pets HTTP methods go under this resource
resource "aws_api_gateway_resource" "pets_endpoint" {
  path_part   = "pets"
  parent_id   = aws_api_gateway_rest_api.pets_api.root_resource_id
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
}

# create a POST method under /pets resource
resource "aws_api_gateway_method" "add_pets_method" {
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.api_authorizer.id
  http_method   = "POST"
  resource_id   = aws_api_gateway_resource.pets_endpoint.id
  rest_api_id   = aws_api_gateway_rest_api.pets_api.id
}

# create a LAMBDA proxy for the POST /pets resource
resource "aws_api_gateway_integration" "lambda_pets_api_integration" {
  http_method             = aws_api_gateway_method.add_pets_method.http_method
  resource_id             = aws_api_gateway_resource.pets_endpoint.id
  rest_api_id             = aws_api_gateway_rest_api.pets_api.id
  uri                     = aws_lambda_function.pets_api.invoke_arn
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
}

#create a OPTIONS method for CORS needs
resource "aws_api_gateway_method" "options_method" {
  rest_api_id   = aws_api_gateway_rest_api.pets_api.id
  resource_id   = aws_api_gateway_resource.pets_endpoint.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# hardcode OPTIONS response 
resource "aws_api_gateway_method_response" "options_200" {
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
  resource_id = aws_api_gateway_resource.pets_endpoint.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = "200"
  response_models = {
    "application/json" = "Empty"
  }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
  depends_on = [aws_api_gateway_method.options_method]
}

# mock an integration in order for OPTIONS method to return CORS info
resource "aws_api_gateway_integration" "options_integration" {
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
  resource_id = aws_api_gateway_resource.pets_endpoint.id
  http_method = aws_api_gateway_method.options_method.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{statusCode: 200}"
  }
  depends_on = [aws_api_gateway_method.options_method]
}

# integration response -> what the CORS policy for this method will be.
resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
  resource_id = aws_api_gateway_resource.pets_endpoint.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = aws_api_gateway_method_response.options_200.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_method_response.options_200]
}

resource "aws_api_gateway_deployment" "pets_deployment" {
  rest_api_id = aws_api_gateway_rest_api.pets_api.id

  triggers = {
    # NOTE: The configuration below will satisfy ordering considerations,
    #       but not pick up all future REST API changes. More advanced patterns
    #       are possible, such as using the filesha1() function against the
    #       Terraform configuration file(s) or removing the .id references to
    #       calculate a hash against whole resources. Be aware that using whole
    #       resources will show a difference after the initial implementation.
    #       It will stabilize to only change when resources change afterwards.
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.pets_endpoint.id,
      aws_api_gateway_method.add_pets_method.id,
      aws_api_gateway_integration.lambda_pets_api_integration.id,
      aws_api_gateway_method.edit_user_endpoint.id,
      aws_api_gateway_integration.lambda_user_pets_api_integration.id,
      aws_api_gateway_authorizer.api_authorizer.id,
      aws_api_gateway_method.options_method.id
    ]))
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "pets_stage" {
  deployment_id = aws_api_gateway_deployment.pets_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.pets_api.id
  stage_name    = "dev1"
}
