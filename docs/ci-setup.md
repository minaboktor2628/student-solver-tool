# CI/CD & Docker Publishing Setup

This document explains how to configure GitHub so this repository’s CI/CD pipeline can build and push Docker images to _GitHub Container Registry (GHCR)._
This uses the provided workflows [here](../.github/workflows/).

## Repository Settings

The workflows will need permission to write to the repository.

1. Go to **Repository** → **Settings** → **Actions** → **General**
2. Under Workflow permissions, select:
   - **Read and write permissions**
   - _(Optional but recommended)_ **Allow GitHub Actions to create and approve pull requests**
3. Save.

This ensures the `GITHUB_TOKEN` created in workflows has permission to push to GHCR.

## Package Repository Link

GHCP packages must be linked to this repository:

1. Go to https://github.com/users/OWNER/packages/container/student-solver-tool/settings

   (Replace `<OWNER>` with your actual Github username or org name. This link also assumes that your repository name is called `student-solver-tool`)

2. Under **Repository links**, link this repo.

3. Under **Manage access**, ensure:

   The repository has **Write** access

   (Optional) Specific teams/users can also be granted access.

## Verification

To test everything works:

1. Push to `main` (pr preferred)
2. Watch the **Action** tab → `CI` workflow → `docker` job
3. Confirm the image is published at: `ghcr.io/<OWNER>/<REPO>:<tag>`
