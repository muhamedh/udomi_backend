resource "aws_cognito_user_pool" "user_pool" {
  name                = "dev-udomi-ba-user-pool"
  mfa_configuration   = "OFF"
  deletion_protection = "ACTIVE"

  auto_verified_attributes = ["email"]
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Account Confirmation"
    email_message        = "Your confirmation code is {####}"
  }
  lambda_config {
    post_confirmation = aws_lambda_function.dev_post_confirmation.arn
  }
  username_configuration {
    case_sensitive = true
  }
  schema {
    attribute_data_type = "String"
    mutable             = true
    name                = "email"
    required            = true
    string_attribute_constraints {
      min_length = 1
      max_length = 2048
    }
  }
}

resource "aws_cognito_user_pool_client" "client" {
  name = "dev-udomi-ba-react-client"

  user_pool_id = aws_cognito_user_pool.user_pool.id

  supported_identity_providers  = ["COGNITO"]
  generate_secret               = false
  refresh_token_validity        = 90
  prevent_user_existence_errors = "ENABLED"
  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]
}