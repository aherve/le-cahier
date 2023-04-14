resource "aws_iam_user" "remix_user" {
  name = "le-cahier-remix"
}

resource "aws_iam_access_key" "remix_user" {
  user = aws_iam_user.remix_user.name
}
output "remix_access_key" {
  sensitive = true
  value     = aws_iam_access_key.remix_user
}

data "aws_iam_policy_document" "remix_policy" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
    ]
    resources = [
      aws_dynamodb_table.users.arn,
      aws_dynamodb_table.games.arn,
      aws_dynamodb_table.positions.arn
    ]
  }
}

resource "aws_iam_user_policy" "remix_policy" {
  name   = "le-cahier-remix-policy"
  user   = aws_iam_user.remix_user.name
  policy = data.aws_iam_policy_document.remix_policy.json
}
