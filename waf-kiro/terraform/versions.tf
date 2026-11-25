terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # 本番運用ではリモートステートを推奨(例)
  # backend "s3" {
  #   bucket         = "sample-tfstate-bucket"
  #   key            = "network/terraform.tfstate"
  #   region         = "ap-northeast-1"
  #   dynamodb_table = "sample-tfstate-lock"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      System     = var.system
      Env        = var.env
      Owner      = var.owner
      CostCenter = var.cost_center
    }
  }
}
