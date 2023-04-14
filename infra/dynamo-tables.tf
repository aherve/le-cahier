resource "aws_dynamodb_table" "users" {
  name         = "le-cahier-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  attribute {
    name = "userId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "positions" {
  lifecycle {
    prevent_destroy = true
  }
  deletion_protection_enabled = true
  point_in_time_recovery {
    enabled = true
  }
  name         = "le-cahier-positions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "fen"
  range_key    = "userId"

  attribute {
    name = "fen"
    type = "S"
  }
  attribute {
    name = "userId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "games" {
  name         = "le-cahier-games"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "gameId"
  attribute {
    name = "gameId"
    type = "S"
  }
}
