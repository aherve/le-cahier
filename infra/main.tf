terraform {
  backend "s3" {
    bucket = "aherve-terraform"
    key    = "le-cahier-v2"
    region = "eu-west-1"
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~>6.33.0"
    }
  }
}
provider "aws" {
  region = "eu-west-1"
}

output "region" {
  value = "eu-west-1"
}
