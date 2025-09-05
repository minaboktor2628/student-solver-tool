# Student Solver Tool

This is a tool to validate, solve, and manage TA and PLA assignment at Worcester Polytechnic Institute.

> [!NOTE]
> This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## Prerequisites

#### POSIX System

You will need a POSIX style operating system to run this repo.
Mac and Linux users are OK, but Windows users should use [WSL](https://learn.microsoft.com/en-us/windows/wsl/).

#### Node Versioning

This project uses `nvm` to manage Node versions. There is a file named `./nvmrc` that contains the correct node version that `nvm` will install.
To install `nvm`, use one of the following commands or read their docs [here](https://github.com/nvm-sh/nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

```bash
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

Then install & use the correct version of Node:

```bash
nvm install   # installs Node version specified in .nvmrc
nvm use       # switches to the node version
```

#### Package Manager

This project uses `pnpm` as the package manager. To install `pnpm`, run theses commands or visit their docs [here](https://pnpm.io/installation):

```bash
corepack enable
corepack prepare pnpm@10.15.0 --activate
```

#### Verify

```bash
node -v   # should be >=22
pnpm -v   # should be >=10.15.0
```

## Getting Started

You will need the proper database and environment variables set up to run the app.
For local development, you must set up a local Postgres instance.
There is a provided [start-database.sh](./start-database.sh) script that you can run.
The script also contains extra instructions at the top of the file.

The app will **NOT** run without properly set environment variables.
Copy the example file (`.env.example`) into a `.env` file:

```bash
cp .env.example .env
```

The file will tell you what environment variables you need.
When adding additional environment variables, the schema in [src/env.js](./src/env.js) should be updated accordingly.

> [!WARNING]
> Never commit environment variables! Treat them like you would any other password.

If you would like to skip environment variable checking when running the app/command,
you will need to set the `SKIP_ENV_VALIDATION` to `true`.
This can be useful for CI/CD, or other situations where you are OK with not needing environment variables.

Example:

```bash
SKIP_ENV_VALIDATION=true pnpm run dev
```

#### Run The Development Server

```bash
pnpm i
SKIP_ENV_VALIDATION=true pnpm run dev
```

Please read the [package.json](./package.json) file to see what kinds of scrips you can run.
Running `pnpm run` in the terminal will also give you the available commands.

## CI/CD & Git Hooks

This project uses [Husky](https://github.com/typicode/husky) for managing git hooks.
This allows us to run formatters and linter fixes before pushes.
All the Github actions are under `./github/workflows`. They can type check, lint check, formatter check, and make sure that the project will build.

## Library Documentation

- [Next.js](https://nextjs.org): Framework docs
- [NextAuth.js](https://next-auth.js.org): Authentication
- [Prisma](https://prisma.io): ORM
- [Tailwind CSS](https://tailwindcss.com): Styling
- [tRPC](https://trpc.io): Typesafe REST API (it's also integrated with [React Query](https://tanstack.com/query/v4/docs/framework/react/overview))
- [shadcn](https://ui.shadcn.com) and [shadcn.io](https://www.shadcn.io): Component libraries
- [Vitest](https://vitest.dev/) & [Cypress](https://www.cypress.io/): Testing

## Deploying

This project uses `Docker`. Here is the `t3` [guide](https://create.t3.gg/en/deployment/docker).
