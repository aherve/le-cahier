resource "aws_iam_user" "remix_user" {
  name = "le-cahier-remix"
}

// TODO: remove user
// --- Deprecated: remove when transition to apprunner is done
resource "aws_iam_access_key" "remix_user" {
  user = aws_iam_user.remix_user.name
}
output "remix_access_key" {
  sensitive = true
  value     = aws_iam_access_key.remix_user
}
// /--- Deprecated


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
      aws_dynamodb_table.positions.arn,
      "${aws_dynamodb_table.positions.arn}/index/*",
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetResourcePolicy",
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
      "secretsmanager:ListSecretVersionIds"
    ]
    resources = [
      aws_secretsmanager_secret.session_secret.arn,
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:ListSecrets",
    ]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "trust_policy" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["tasks.apprunner.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "le_cahier" {
  name               = "le-cahier-runtime-role"
  assume_role_policy = data.aws_iam_policy_document.trust_policy.json
}

resource "aws_iam_role_policy" "remix_role_policy" {
  role   = aws_iam_role.le_cahier.name
  policy = data.aws_iam_policy_document.remix_policy.json
}

// TODO REMOVE Attach policy to user: deprecated
resource "aws_iam_user_policy" "remix_policy" {
  name   = "le-cahier-remix-policy"
  user   = aws_iam_user.remix_user.name
  policy = data.aws_iam_policy_document.remix_policy.json
}
