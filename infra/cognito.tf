resource "aws_cognito_user_pool" "pool" {
  name = "le-cahier-user-pool"
}

resource "aws_cognito_user_pool_client" "client" {
  name         = "le-cahier-user-pool-client"
  user_pool_id = aws_cognito_user_pool.pool.id
}

resource "local_file" "aws_export" {
  filename = "aws-export.json"
  content = jsonencode({
    region              = "eu-west-1"
    userPoolId          = aws_cognito_user_pool.pool.id
    userPoolWebClientId = aws_cognito_user_pool_client.client.id
  })
}
