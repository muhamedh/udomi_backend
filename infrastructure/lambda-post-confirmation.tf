resource "aws_lambda_function" "dev_post_confirmation" {
  function_name = var.post_confirmation_lambda_name
  description   = "Add a user to dynamoDB after confirmation."

  s3_bucket = aws_s3_bucket.post_confirmation_lambda_bucket.id
  s3_key    = aws_s3_object.post_confirmation_lambda.key

  runtime = "nodejs18.x"
  handler = "index.handler"

  source_code_hash = data.archive_file.post_confirmation_lambda_zip.output_base64sha256

  role       = aws_iam_role.post_confirmation_lambda_exec.arn
  depends_on = [aws_cloudwatch_log_group.post_confirmation_lambda_log]

  environment {
    variables = {
      USER_TABLE = "${aws_dynamodb_table.users_table.name}"
    }
  }
}

resource "aws_cloudwatch_log_group" "post_confirmation_lambda_log" {
  name = "/aws/lambda/${var.post_confirmation_lambda_name}"

  retention_in_days = var.lambda_log_retention
}

resource "aws_iam_role" "post_confirmation_lambda_exec" {
  name = "post_confirmation_lambda_role"

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

resource "aws_iam_role_policy_attachment" "post_confirmation_lambda_policy" {
  role       = aws_iam_role.post_confirmation_lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
resource "aws_iam_role_policy_attachment" "dynamo_post_confirmation_lambda_policy_attachment" {
  role       = aws_iam_role.post_confirmation_lambda_exec.name
  policy_arn = aws_iam_policy.dynamo_post_confirmation_lambda_policy.arn
}

resource "aws_iam_policy" "dynamo_post_confirmation_lambda_policy" {
  name        = "dynamo_post_confirmation_lambda_policy"
  description = "dynamo_post_confirmation_lambda_policy"
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

resource "aws_lambda_permission" "allow_cognito" {
  statement_id  = "AllowExecutionFromCognito"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.dev_post_confirmation.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = "arn:aws:cognito-idp:${var.aws_region}:${local.account_id}:userpool/*"
}