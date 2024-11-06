# Multi-tenant RAG

Leverage Neon’s database-per-user and Inngest’s multi-tenancy to deploy fair and reliable RAG at scale.

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [Neon](https://neon.tech/docs/guides/nextjs) - Serverless Postgres database
- [Inngest](https://www.inngest.com/docs/quick-start) - Serverless Workflow engine

## Prerequisites

Before you begin, ensure you have:

- Node.js and npm installed
- A [Neon](https://neon.tech) account
- An [OpenAI](https://platform.openai.com/) account
- A [SERP API](https://serper.ai/) API key

## Getting Started

1. Clone the repository:

```bash
git clone <repository-url>
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:

```bash
# Neon Database
DATABASE_URL=
NEON_API_KEY=

# OpenAI
OPENAI_API_KEY=

# SERP API
SERP_API_KEY=
```

Here is how you can get the above values:

- Neon Database URL:

  - Go to your Neon project
  - Navigate to **Connection Details**
  - Copy the **URL**

- Neon API Key:

  - Go to your Neon Console
  - Navigate to your [**Profile page**](https://console.neon.tech/app/settings/api-keys)
  - Create a new API Key and copy it

- OpenAI:

  - Go to [OpenAI](https://platform.openai.com/)
  - Navigate to **View API keys**
  - Copy the **API Key**

- SERP API:
  - Go to [SERP API](https://serper.ai/)
  - Sign up and get your API key

4. Initialize the database schema:

Go over your Neon Console and navigate to the SQL Editor.
Copy the contents of `db/schema.sql` and paste it into the SQL Editor.
Running the query will create the schema.

Then start the Next.js development server (`npm run dev`) and navigate to [http://localhost:3000/api/setup](http://localhost:3000/api/setup).

This will create the initial workspaces.

## Development

1. Start the Next.js development server:

```bash
npm run dev
```

2. In a separate terminal, start the Inngest dev server:

```bash
npx inngest-cli@latest dev
```

3. Visit:
   - [http://localhost:3000](http://localhost:3000) - Application
   - [http://localhost:8288](http://localhost:8288) - Inngest dashboard

## License

[Apache License](./LICENSE)
