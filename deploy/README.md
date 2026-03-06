# Deploying on sts.cs.wpi.edu

by Mina Boktor

> [!WARNING]
> Please read this whole file before attempting to deploy.

## Steps

- Make sure you have sudo access. Please ask someone with sudo privileges to run this command: `sudo usermod -aG sudo <your username>`
- After logging in, cd to `/opt/sts`. This is where the repo is cloned to, and all deploy commands will need to be ran from this directory.
- Make sure to add the `.env` file in the project directory (/opt/sts) if this is the first ever deployment. If the `.env` file is already there, you probably won't need to edit it. Follow the instructions in the example env file to see what variables need to be set.
  In production, the `DATABASE_URL` variable <u>**needs**</u> to be `file:/data/prod.db`.
  Therefore, it is manually set in the `docker-compose.yml` file. Setting it to anything differently in the .env file will be ignored.

  Periodically, you will need to rotate the Microsoft Entra Id API keys.
  The app will not work without these (no one will be able to sign in).
  They expire anywhere from 6 months to 2 years.
  Ask the coordinator for these.
  You will need to redeploy/restart the app in order of this to take effect.

Now, you will need to add your user to the `docker` and `deploysts` groups in order to have the proper permissions to run the deploy scripts.
Run the following commands:

```bash
sudo usermod -aG docker $USER
sudo usermod -aG deploysts $USER
```

You might need to sign out and sign back in to the server.

The deploy script is in `./deploy`. Run `./deploy/deploy.sh -h` to see options.

- Run `./deploy/deploy.sh -b main` to deploy the main branch, or the branch you wish to deploy.
  There will be a backup of the sqlite db made in /home/backups automatically.
  `/home/backups/` is a special directory that is backed up twice a day, and backups are kept for 60 days.
  If you wish to skip this step and not back up the database before deployment, you can run the deploy script with the `--no-backup` flag.

The deploy script runs off of git. If you get a message along the lines of 'fatal: detected dubious ownership in repository at /opt/sts', 
run the following command: `git config --global --add safe.directory /opt/sts`

## Helpful commands

- To display application logs, run:

```bash
docker compose logs -f sts
```

- To copy the live db somewhere, you can run this command:

```bash
docker cp sts-sts-1:/data/prod.db /tmp/prod.db
```

This will copy the prod db into `/tmp/prod.db`.
You can then copy the database to your local computer by running something like this from your local project directory:

> [!WARNING]
> This will replace your current dev.db if it exists. Only run this command if your are absolutely sure.
> You can also change the destination path to something else if you wish.

```bash
scp <your usernmae>@sts.cs.wpi.edu:/tmp/prod.db ./prisma/dev.db
```
