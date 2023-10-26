# Copyright (c) HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0
data "aws_caller_identity" "current" {}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.6.2"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.4.3"
    }
  }
  required_version = ">= 1.1.0"
}

provider "aws" {
  region     = var.aws_region
  access_key = data.external.env.result["ACCESS_KEY"]
  secret_key = data.external.env.result["SECRET_KEY"]
}