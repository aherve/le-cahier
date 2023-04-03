terraform {
  backend "s3" {
    bucket = "aherve-terraform"
    key    = "le-cahier-v2"
    region = "eu-west-1"
  }
}
provider "aws" {
  region = "eu-west-1"
}

variable "table_name" {
  type    = string
  default = "le-cahier"
}

resource "aws_dynamodb_table" "db" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "fen"

  attribute {
    name = "fen"
    type = "S"
  }
}
