provider "aws" {
  region = "eu-west-1"
}
variable "region" {
  default = "eu-west-1"
}
data "aws_caller_identity" "current" {}

// Create repository to hold the container
resource "aws_ecr_repository" "app" {
  name                 = "testitest"
  image_tag_mutability = "MUTABLE"
}

locals {
  triggers = {
    always = timestamp()
  }
}

resource "null_resource" "ecr_login" {
  triggers = local.triggers
  provisioner "local-exec" {
    command = "aws ecr get-login-password --region ${var.region} | docker login --username AWS --password-stdin ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com"
  }
}

resource "null_resource" "docker_build" {
  triggers = local.triggers
  provisioner "local-exec" {
    working_dir = "${path.module}/.."
    command     = <<EOT
docker build -t ${aws_ecr_repository.app.repository_url} .
    EOT
  }
}

resource "null_resource" "docker_push" {
  triggers   = local.triggers
  depends_on = [null_resource.docker_build, null_resource.ecr_login]
  provisioner "local-exec" {
    command = "docker push ${aws_ecr_repository.app.repository_url}"
  }
}
