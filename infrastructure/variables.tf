variable "environment" {
  default = "dev"
}

variable "aws_region" {
  default = "us-east-1"
}

variable "lambda_log_retention" {
  description = "Lambda log retention in days."
  type        = number
  default     = 1
}

variable "apigw_log_retention" {
  description = "API Gateway log retention in days"
  type        = number
  default     = 1
}

variable "post_confirmation_lambda_name" {
  default = "dev1-post-confirmation"
}

variable "pets_api_lambda_name" {
  default = "dev1-pets-api-lambda"
}