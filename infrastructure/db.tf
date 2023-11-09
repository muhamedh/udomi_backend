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

  attribute {
    name = "location"
    type = "S"
  }

  global_secondary_index {
    name            = "location-index"
    hash_key        = "location"
    write_capacity  = 1
    read_capacity   = 1
    projection_type = "ALL"
  }

  tags = {
    Name        = "dev1-user-table"
    Environment = "dev1"
  }
}