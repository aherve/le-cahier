resource "aws_cognito_user_pool" "pool" {
  name = "le-cahier-user-pool"

  auto_verified_attributes = ["email"]

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  schema {
    name                     = "isAdmin"
    attribute_data_type      = "Boolean"
    developer_only_attribute = true
    mutable                  = true
    required                 = false
  }
}

resource "aws_cognito_user_pool_client" "client" {
  name                  = "le-cahier-user-pool-client"
  user_pool_id          = aws_cognito_user_pool.pool.id
  access_token_validity = 24
  id_token_validity     = 24
}

resource "local_file" "aws_export" {
  filename = "aws-export.json"
  content = jsonencode({
    region              = "eu-west-1"
    userPoolId          = aws_cognito_user_pool.pool.id
    userPoolWebClientId = aws_cognito_user_pool_client.client.id
  })
}
