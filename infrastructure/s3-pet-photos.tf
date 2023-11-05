resource "aws_s3_bucket" "pet_photos_bucket" {
  bucket_prefix = "dev-pet-photos-"
  force_destroy = false
}

resource "aws_s3_bucket_public_access_block" "block_public_access_pet_photos_bucket" {
  bucket = aws_s3_bucket.pet_photos_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}