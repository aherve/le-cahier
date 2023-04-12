resource "aws_dynamodb_table" "db" {
  lifecycle {
    prevent_destroy = true
  }
  deletion_protection_enabled = true
  point_in_time_recovery {
    enabled = true
  }
  name         = "le-cahier"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "fen"

  attribute {
    name = "fen"
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
