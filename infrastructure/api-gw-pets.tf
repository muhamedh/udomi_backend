resource "aws_api_gateway_rest_api" "pets_api" {
  name = "dev1-pets"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "pets_endpoint" {
  parent_id   = aws_api_gateway_rest_api.pets_api.root_resource_id
  path_part   = "pets"
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
}

resource "aws_api_gateway_authorizer" "api_authorizer" {
    name = "CognitoUserPoolAuthorizer"
    type = "COGNITO_USER_POOLS"
    rest_api_id = aws_api_gateway_rest_api.pets_api.id
    provider_arns = [ aws_cognito_user_pool.user_pool.arn ]
}
resource "aws_api_gateway_method" "add_pets_method" {
  authorization = "COGNITO_USER_POOLS"
  #authorizer_id = aws_cognito_user_pool.user_pool.id
  authorizer_id = aws_api_gateway_authorizer.api_authorizer.id
  http_method   = "POST"
  resource_id   = aws_api_gateway_resource.pets_endpoint.id
  rest_api_id   = aws_api_gateway_rest_api.pets_api.id
}

resource "aws_api_gateway_integration" "lambda_pets_api_integration" {
  http_method = aws_api_gateway_method.add_pets_method.http_method
  resource_id = aws_api_gateway_resource.pets_endpoint.id
  rest_api_id = aws_api_gateway_rest_api.pets_api.id
  uri = aws_lambda_function.pets_api.invoke_arn
  type        = "AWS_PROXY"
  integration_http_method = "POST"
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