# Deploying on sts.cs.wpi.edu

by Mina Boktor

## Steps

- After logging in, ...
- Make sure to add the `.env` file
- Make sure the `DATABASE_URL` starts with /data. For example: `DATABASE_URL='/data/prod.db'`
- Run `./deploy/deploy.sh -b main` or the branch you wish to deploy. There will be a backup of the sqlite db made in /home/backups.
  - you can run `-h` to get display all options
- For logs: `docker compose logs -f sts`
