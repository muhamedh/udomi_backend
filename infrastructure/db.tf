resource "aws_dynamodb_table" "users_table" {
  name           = "users"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "id"
  range_key      = "pet_id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "pet_id"
    type = "S"
  }

  tags = {
    Name        = "dev1-user-table"
    Environment = "dev1"
  }
}