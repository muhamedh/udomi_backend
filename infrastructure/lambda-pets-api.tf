resource "aws_lambda_function" "pets_api" {
  function_name = var.pets_api_lambda_name
  description   = "Pets api."

  s3_bucket = aws_s3_bucket.pets_api_lambda_bucket.id
  s3_key    = aws_s3_object.pets_api_lambda.key

  runtime = "nodejs18.x"
  handler = "handler.handler"

  source_code_hash = data.archive_file.pets_api_lambda_zip.output_base64sha256

  role       = aws_iam_role.pets_api_lambda_exec.arn
  depends_on = [aws_cloudwatch_log_group.pets_api_lambda_log]

  environment {
    variables = {
      USER_TABLE = "${aws_dynamodb_table.users_table.name}"
    }
  }
}

resource "aws_cloudwatch_log_group" "pets_api_lambda_log" {
  name = "/aws/lambda/${var.pets_api_lambda_name}"

  retention_in_days = var.lambda_log_retention
}

resource "aws_iam_role" "pets_api_lambda_exec" {
  name = "pets_api_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Sid    = ""
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "pets_api_lambda_policy" {
  role       = aws_iam_role.pets_api_lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
resource "aws_iam_role_policy_attachment" "dynamo_pets_api_lambda_policy_attachment" {
  role       = aws_iam_role.pets_api_lambda_exec.name
  policy_arn = aws_iam_policy.dynamo_pets_api_lambda_policy.arn
}

resource "aws_iam_policy" "dynamo_pets_api_lambda_policy" {
  name        = "dynamo_pets_api_lambda_policy"
  description = "dynamo_pets_api_lambda_policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
        ],
        Effect   = "Allow"
        Resource = aws_dynamodb_table.users_table.arn
      },
    ]
  })
}

resource "aws_lambda_permission" "api_gw_pets" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pets_api.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.pets_api.execution_arn}/*/*"
}