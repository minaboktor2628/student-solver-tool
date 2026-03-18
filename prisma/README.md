# Prisma & DB

by Mina Boktor

## Getting Started

> [!IMPORTANT]
> Make sure you have your env set up correctly first.

This app uses sqlite. So, no need to download anything extra.
When you first clone this project, you will not have a database with the correct schema.
You will need to run the migration files (located in this directory) against your db.
To do this, run the command:

```bash
pnpm db:migrate
```

This will apply all the migration files for you.

## DB Workflow

When adding, updating, or deleting tables, you will need to follow this workflow:

1. Let's say that you are working on a new table.
   You will modify the `schema.prisma` file directly to add this new table.
   During development, to change the db schema **without** making a migration file, use the command `pnpm db:push`.
   Once you are done adjusting the table and ready to make a PR with your code, go to step 2 to generate the migration files.
2. After you are are done adjusting the schema, run this command to generate the migration files: `pnpm db:generate`.
3. Now that you have the new migration files, run this command to apply them to your db: `pnpm db:migrate`.
   You will also need to run `pnpm i` afterwards as well to generate the Prisma client.
   > [!NOTE]
   > When pulling down new code that has a new migration file in it, you will also need to rerun this command.
   > This command is ran every time you run the deploy script in production as well.

## Seeding the Database

There is a `seed.ts` file in this directory that has some dummy data that you can use to populate the database when development.
This is not ended to be used in production, although you can modify it to do so if needed.
To run the seed file on your db, run `pnpm db:seed`.

## Good to Know

Prisma needs to generate the Typescript types and the Prisma client from your schema.
This is normally done manually with the `prisma generate` command, but this project adds this to command to the `postinstall` script that runs every time after running `pnpm i`.
So, you can run `pnpm i` instead.
