locals {
  domain = "lecahier.net"
}
data "aws_route53_zone" "this" {
  name = local.domain
}

resource "aws_apprunner_custom_domain_association" "this" {
  domain_name = local.domain
  service_arn = aws_apprunner_service.le_cahier.arn
}

resource "aws_route53_record" "verification" {
  for_each = {
    for record in aws_apprunner_custom_domain_association.this.certificate_validation_records : record.name => record.value
  }
  zone_id = data.aws_route53_zone.this.id
  name    = each.key
  type    = "CNAME"
  ttl     = 300
  records = [each.value]
}

// needs a zone id, better create this manually
/*
 *resource "aws_route53_record" "main" {
 *  zone_id = data.aws_route53_zone.this.id
 *  name    = local.subdomain
 *  type    = "ALIAS"
 *  ttl     = 300
 *  records = [aws_apprunner_custom_domain_association.this.dns_target]
 *}
 */

