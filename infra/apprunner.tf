resource "aws_apprunner_connection" "le_cahier" {
  connection_name = "le_cahier"
  provider_type   = "GITHUB"
}
resource "aws_apprunner_auto_scaling_configuration_version" "le_cahier" {
  auto_scaling_configuration_name = "le_cahier"

  max_concurrency = 200
  max_size        = 2
  min_size        = 1
}
resource "aws_apprunner_service" "le_cahier" {
  service_name = "le-cahier"
  source_configuration {
    authentication_configuration {
      connection_arn = aws_apprunner_connection.le_cahier.arn
    }
    auto_deployments_enabled = true
    code_repository {
      code_configuration {
        code_configuration_values {
          build_command = "npm ci && npm run build"
          port          = "3000"
          runtime       = "NODEJS_16"
          start_command = "npm run start"
          runtime_environment_variables = {
            NODE_ENV = "production"
          }
          runtime_environment_secrets = {
            SESSION_SECRET = aws_secretsmanager_secret.session_secret.arn
          }
        }
        configuration_source = "API"
      }
      repository_url = "https://github.com/aherve/le-cahier"
      source_code_version {
        type  = "BRANCH"
        value = "main"
      }
    }
  }

  health_check_configuration {
    healthy_threshold   = 1
    interval            = 5
    path                = "/api/ping"
    protocol            = "HTTP"
    timeout             = 2
    unhealthy_threshold = 2
  }

  network_configuration {
    ingress_configuration {
      is_publicly_accessible = true
    }
  }

  instance_configuration {
    cpu               = "256"
    memory            = "512"
    instance_role_arn = aws_iam_role.le_cahier.arn
  }

  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.le_cahier.arn
}

