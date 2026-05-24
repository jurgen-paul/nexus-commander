resource "google_project_service" "sourcerepo" {
  project = "oistarian-nexus-commander"
  service = "sourcerepo.googleapis.com"

  # Recommended to keep the API enabled even if the resource is removed from Terraform
  disable_on_destroy = false
}
