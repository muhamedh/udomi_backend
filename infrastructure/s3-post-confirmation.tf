resource "aws_s3_bucket" "post_confirmation_lambda_bucket" {
  bucket_prefix = "dev-post-confirmation-"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "block_public_access_post_confirmation_bucket" {
  bucket = aws_s3_bucket.post_confirmation_lambda_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "archive_file" "post_confirmation_lambda_zip" {
  type = "zip"

  source_dir  = "${path.module}/post-confirmation/build"
  output_path = "${path.module}/post-confirmation/build/src.zip"
}

resource "aws_s3_object" "post_confirmation_lambda" {
  bucket = aws_s3_bucket.post_confirmation_lambda_bucket.id

  key    = "source.zip"
  source = data.archive_file.post_confirmation_lambda_zip.output_path

  etag = filemd5(data.archive_file.post_confirmation_lambda_zip.output_path)
}