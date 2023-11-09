# ROOT API "/"
resource "aws_api_gateway_rest_api" "pets_api" {
  name = "dev1-pets"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  binary_media_types = ["multipart/form-data", "/image/jpg", "image/jpeg"]
}

# set authorizer for whole API resource
resource "aws_api_gateway_authorizer" "api_authorizer" {
  name          = "CognitoUserPoolAuthorizer"
  type          = "COGNITO_USER_POOLS"
  rest_api_id   = aws_api_gateway_rest_api.pets_api.id
  provider_arns = [aws_cognito_user_pool.user_pool.arn]
}

resource "aws_api_gateway_resource" "proxy_pets_endpoint" {
  path_part   = "{proxy+}"
  parent_id   = aws_api_gateway_rest_api.pets_api.root_resource_id
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
}

resource "aws_api_gateway_method" "proxy_pets_method" {
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.api_authorizer.id
  http_method   = "ANY"
  resource_id   = aws_api_gateway_resource.proxy_pets_endpoint.id
  rest_api_id   = aws_api_gateway_rest_api.pets_api.id
}

resource "aws_api_gateway_integration" "lambda_pets_api_integration" {
  http_method             = aws_api_gateway_method.proxy_pets_method.http_method
  resource_id             = aws_api_gateway_resource.proxy_pets_endpoint.id
  rest_api_id             = aws_api_gateway_rest_api.pets_api.id
  uri                     = aws_lambda_function.pets_api.invoke_arn
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
}

#create a GET /location resource for static data
resource "aws_api_gateway_resource" "location_endpoint" {
  path_part   = "location"
  parent_id   = aws_api_gateway_rest_api.pets_api.root_resource_id
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
}

resource "aws_api_gateway_method" "get_location_method" {
  rest_api_id   = aws_api_gateway_rest_api.pets_api.id
  resource_id   = aws_api_gateway_resource.location_endpoint.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "location_api_integration" {
  http_method             = aws_api_gateway_method.get_location_method.http_method
  resource_id             = aws_api_gateway_resource.location_endpoint.id
  rest_api_id             = aws_api_gateway_rest_api.pets_api.id
  uri                     = aws_lambda_function.pets_api.invoke_arn
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
}

#create a GET /pets-public resource for public pet endpoint
resource "aws_api_gateway_resource" "public_pets_endpoint" {
  path_part   = "pets-public"
  parent_id   = aws_api_gateway_rest_api.pets_api.root_resource_id
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
}

resource "aws_api_gateway_method" "get_public_pets_method" {
  rest_api_id   = aws_api_gateway_rest_api.pets_api.id
  resource_id   = aws_api_gateway_resource.public_pets_endpoint.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "public_pets_integration" {
  http_method             = aws_api_gateway_method.get_public_pets_method.http_method
  resource_id             = aws_api_gateway_resource.public_pets_endpoint.id
  rest_api_id             = aws_api_gateway_rest_api.pets_api.id
  uri                     = aws_lambda_function.pets_api.invoke_arn
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
}

# create a OPTIONS method for CORS needs /pets
resource "aws_api_gateway_method" "public_pets_options_method" {
  rest_api_id   = aws_api_gateway_rest_api.pets_api.id
  resource_id   = aws_api_gateway_resource.public_pets_endpoint.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# hardcode OPTIONS response 
resource "aws_api_gateway_method_response" "public_pets_options_200" {
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
  resource_id = aws_api_gateway_resource.public_pets_endpoint.id
  http_method = aws_api_gateway_method.public_pets_options_method.http_method
  status_code = "200"
  response_models = {
    "application/json" = "Empty"
  }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# mock an integration in order for OPTIONS method to return CORS info
resource "aws_api_gateway_integration" "public_pets_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
  resource_id = aws_api_gateway_resource.public_pets_endpoint.id
  http_method = aws_api_gateway_method.public_pets_options_method.http_method
  type        = "MOCK"
  request_templates = {
    "application/json"    = "{statusCode: 200}"
    "multipart/form-data" = "{statusCode: 200}"
  }
}

# integration response -> what the CORS policy for this method will be.
resource "aws_api_gateway_integration_response" "public_pets_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
  resource_id = aws_api_gateway_resource.public_pets_endpoint.id
  http_method = aws_api_gateway_method.public_pets_options_method.http_method
  status_code = aws_api_gateway_method_response.public_pets_options_200.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,GET'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}
# end of CORS for /pets

# create a OPTIONS method for CORS needs /location
resource "aws_api_gateway_method" "location_options_method" {
  rest_api_id   = aws_api_gateway_rest_api.pets_api.id
  resource_id   = aws_api_gateway_resource.location_endpoint.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# hardcode OPTIONS response 
resource "aws_api_gateway_method_response" "location_options_200" {
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
  resource_id = aws_api_gateway_resource.location_endpoint.id
  http_method = aws_api_gateway_method.location_options_method.http_method
  status_code = "200"
  response_models = {
    "application/json" = "Empty"
  }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# mock an integration in order for OPTIONS method to return CORS info
resource "aws_api_gateway_integration" "location_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
  resource_id = aws_api_gateway_resource.location_endpoint.id
  http_method = aws_api_gateway_method.location_options_method.http_method
  type        = "MOCK"
  request_templates = {
    "application/json"    = "{statusCode: 200}"
    "multipart/form-data" = "{statusCode: 200}"
  }
}

# integration response -> what the CORS policy for this method will be.
resource "aws_api_gateway_integration_response" "location_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
  resource_id = aws_api_gateway_resource.location_endpoint.id
  http_method = aws_api_gateway_method.location_options_method.http_method
  status_code = aws_api_gateway_method_response.location_options_200.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}
# end of CORS for /location

#create a OPTIONS method for CORS needs /{proxy+}
resource "aws_api_gateway_method" "options_method" {
  rest_api_id   = aws_api_gateway_rest_api.pets_api.id
  resource_id   = aws_api_gateway_resource.proxy_pets_endpoint.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# hardcode OPTIONS response 
resource "aws_api_gateway_method_response" "options_200" {
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
  resource_id = aws_api_gateway_resource.proxy_pets_endpoint.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = "200"
  response_models = {
    "application/json"    = "Empty"
    "multipart/form-data" = "Empty"
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
  resource_id = aws_api_gateway_resource.proxy_pets_endpoint.id
  http_method = aws_api_gateway_method.options_method.http_method
  type        = "MOCK"
  request_templates = {
    "application/json"    = "{statusCode: 200}"
    "multipart/form-data" = "{statusCode: 200}"
  }
  depends_on = [aws_api_gateway_method.options_method]
}

# integration response -> what the CORS policy for this method will be.
resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
  resource_id = aws_api_gateway_resource.proxy_pets_endpoint.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = aws_api_gateway_method_response.options_200.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST,GET,PUT'",
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
      aws_api_gateway_authorizer.api_authorizer,
      aws_api_gateway_resource.proxy_pets_endpoint,
      aws_api_gateway_integration_response.options_integration_response,
      aws_api_gateway_integration.options_integration,
      aws_api_gateway_method_response.options_200,
      aws_api_gateway_method.options_method,
      aws_api_gateway_integration.lambda_pets_api_integration,
      aws_api_gateway_method.proxy_pets_method,
      aws_api_gateway_resource.location_endpoint,
      aws_api_gateway_method.get_location_method,
      aws_api_gateway_integration.location_api_integration,
      aws_api_gateway_method.location_options_method,
      aws_api_gateway_method_response.location_options_200,
      aws_api_gateway_integration.location_options_integration,
      aws_api_gateway_integration_response.location_options_integration_response,
      aws_api_gateway_resource.public_pets_endpoint,
      aws_api_gateway_method.get_public_pets_method,
      aws_api_gateway_integration.public_pets_integration,
      aws_api_gateway_method.public_pets_options_method,
      aws_api_gateway_method_response.public_pets_options_200,
      aws_api_gateway_integration.public_pets_options_integration,
      aws_api_gateway_integration_response.public_pets_options_integration_response
    ]))
  }
  depends_on = [aws_api_gateway_rest_api.pets_api]
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "pets_stage" {
  deployment_id = aws_api_gateway_deployment.pets_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.pets_api.id
  stage_name    = "dev1"
}
