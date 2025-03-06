Goal here was just to get the initial project set up using our quick-start + CLI
tool.

Installing the app works as expected

```bash
npx create-next-app instant-llm-test --tailwind --yes
cd instant-demo
npm i @instantdb/react
npm run dev
```

The next set has a minor issue

```
// ID for app: instant-llm-blog
const APP_ID = "38ac9aa6-8b8c-4331-8eb1-ae617a8bcb8c";
```

In my case I want to do this for a brand new app. It's not obvious from getting
started that I can either do this by 1) going to the dashboard or 2) using the
CLI

I choose to use the CLI and go through the create app flow

```bash
npx instant-cli@latest init
```

This works and I get a `.env` file with my new app id as well as schema and perm
files.

But now the getting started code example isn't quite right

I need to change

```typescript
import { id, i, init, InstaQLEntity } from "@instantdb/react";

// ID for app: instant-llm-blog
const APP_ID = "38ac9aa6-8b8c-4331-8eb1-ae617a8bcb8c";

// Optional: Declare your schema!
const schema = i.schema({
  entities: {
    todos: i.entity({
      text: i.string(),
      done: i.boolean(),
      createdAt: i.number(),
    }),
  },
});

type Todo = InstaQLEntity<typeof schema, "todos">;

const db = init({ appId: APP_ID, schema });
```

To

```typescript
import { id, init, InstaQLEntity } from "@instantdb/react";
import schema from "../instant.schema";

const db = init({ appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!, schema });

type Todo = InstaQLEntity<typeof schema, "todos">;
```

Now everything works as expected and we have a starting todo app
