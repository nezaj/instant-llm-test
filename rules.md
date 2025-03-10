---
description: Guidelines for building InstantDB with React and Next.js
globs: **/*.{ts,tsx,js,jsx}
---

# What is Instant

InstantDB is a modern Firebase. InstantDB makes developers productive by giving
them a real-time database they can use directly on their frontend database.

Although the product is called InstantDB it is usually just referenced as
Instant. When talking about InstantDB you should just say Instant.

# How to use Instant in projects

Instant offers client side javascript packages for vanilla JS, react,
and react native. Instant also offers a javascript admin SDK that can be used on
the backend.

If you want to use Instant with react you should only use `@instantdb/react`. For react-native you should
only use `@instantdb/react-native`. For the admin SDK you should only use
`@instantdb/admin`. For other client-side frameworks like Svelte or vanilla js
you should only use `@instantdb/core`

If you want to use Instant on the backend with a different language like python you can also use the HTTP API
which is described in another section below.

# Basic Initialization

The first step to using Instant in your app is to call `init`. Here is a simple
example at the root of your app.

```javascript
import { init } from '@instantdb/react';

const db = init({ appId: process.env.INSTANT_APP_ID! });

function App() {
  return <Main />;
}
```

## Typesafety

If you're using typescript, `init` accepts a `schema` argument. Adding a schema provides auto-completion and typesafety for your queries and transactions.
This can be useful for ensuring that your queries and transactions are correct

```typescript
import { init } from '@instantdb/react';
import schema from '../instant.schema';

const db = init({ appId: process.env.INSTANT_APP_ID, schema });
```

## Flexible Initialization

Instant maintains a single connection regardless of where or how many times you
call `init` with the same app ID. This means you can safely call `init` multiple
times without worrying about creating multiple connections or
performance overhead. However we do recommend the pattern of exporting a
reference from a utility file like so:

```javascript
// lib/db.js
import { init } from '@instantdb/react';
import schema from '../instant.schema';

export const db = init({
  appId: process.env.INSTANT_APP_ID!,
  schema
});
```

# Modeling data with schema

In this section we’ll learn how to model data using Instant's schema. By the end of this section you’ll know how to:

- Create namespaces and attributes
- Add indexes and unique constraints
- Model relationships

We’ll build a micro-blog to illustrate; we'll have authors, posts, comments, and tags.

With Instant you can define your schema in code. We use `instant.schema.ts` to define our schema.

Below is an example schema file for our micro-blog

```typescript
// instant.schema.ts
import { i } from '@instantdb/react';

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    profiles: i.entity({
      nickname: i.string(),
      createdAt: i.date(),
    }),
    posts: i.entity({
      title: i.string(),
      body: i.string(),
      createdAt: i.date(),
    }),
    comments: i.entity({
      body: i.string(),
      createdAt: i.date(),
    }),
    tags: i.entity({
      title: i.string(),
    }),
  },
  links: {
    postAuthor: {
      forward: { on: 'posts', has: 'one', label: 'author' },
      reverse: { on: 'profiles', has: 'many', label: 'authoredPosts' },
    },
    commentPost: {
      forward: { on: 'comments', has: 'one', label: 'post' },
      reverse: { on: 'posts', has: 'many', label: 'comments' },
    },
    commentAuthor: {
      forward: { on: 'comments', has: 'one', label: 'author' },
      reverse: { on: 'profiles', has: 'many', label: 'authoredComments' },
    },
    postsTags: {
      forward: { on: 'posts', has: 'many', label: 'tags' },
      reverse: { on: 'tags', has: 'many', label: 'posts' },
    },
    profileUser: {
      forward: { on: 'profiles', has: 'one', label: '$user' },
      reverse: { on: '$users', has: 'one', label: 'profile' },
    },
  },
});

// This helps Typescript display better intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
```

Let's unpack what we just wrote. There are three core building blocks to model data with Instant: **Namespaces**, **Attributes**, and **Links**.

## Namespaces

Namespaces are equivelant to "tables" in relational databases or "collections" in NoSQL. In our case, these are: `$users`, `profiles`, `posts`, `comments`, and `tags`.

They're all defined in the `entities` section:

```typescript
// instant.schema.ts

const _schema = i.schema({
  entities: {
    posts: i.entity({
      // ...
    }),
  },
});
```

## Restrictions on namespaces

Namespaces must be alphanumeric and can contain underscores. They cannot contain
spaces. Namespaces must also be unique. Namespaces that start with `$` are
reserved for system namespaces. You can use system namespaces for queries and transactions but you should not create your own namespaces that start with `$`.

## Attributes

Attributes are properties associated with namespaces. These are equivelant to a "column" in relational databases or a "field" in NoSQL. For the `posts` entity, we have the `title`, `body`, and `createdAt` attributes:

```typescript
// instant.schema.ts

const _schema = i.schema({
  entities: {
    // ...
    posts: i.entity({
      title: i.string(),
      body: i.string(),
      createdAt: i.date(),
    }),
  },
});
```

## Typing attributes

Attributes can be typed as `i.string()`, `i.number()`, `i.boolean()`, `i.date()`, `i.json()`, or `i.any()`.

`i.date()` accepts dates as either a numeric timestamp (in milliseconds) or an ISO 8601 string. `JSON.stringify(new Date())` will return an ISO 8601 string.

When you type `posts.title` as a `string`:

```typescript
// instant.schema.ts

const _schema = i.schema({
  entities: {
    // ...
    posts: i.entity({
      title: i.string(),
      // ...
    }),
  },
});
```

Instant will _make sure_ that all `title` attributes are strings, and you'll get the proper typescript hints to boot!

## Unique constraints

Sometimes you'll want to introduce a unique constraint. For example, say we wanted to add friendly URL's to posts. We could introduce a `slug` attribute:

```typescript
// instant.schema.ts

const _schema = i.schema({
  entities: {
    // ...
    posts: i.entity({
      slug: i.string().unique(),
      // ...
    }),
  },
});
```

Since we're going to use post slugs in URLs, we'll want to make sure that no two posts can have the same slug. If we mark `slug` as `unique`, _Instant will guarantee this constraint for us_.

Plus unique attributes come with their own special index. This means that if you use a unique attribute inside a query, we can fetch the object quickly:

```typescript
const query = {
  posts: {
    $: {
      where: {
        // Since `slug` is unique, this query is 🚀 fast
        slug: 'completing_sicp',
      },
    },
  },
};
```

## Indexing attributes

Speaking of fast queries, let's take a look at one:

What if we wanted to query for a post that was published at a particular date? Here's a query to get posts that were published during SpaceX's chopstick launch:

```typescript
const rocketChopsticks = '2024-10-13T00:00:00Z';
const query = { posts: { $: { where: { createdAt: rocketChopsticks } } } };
```

This would work, but the more posts we create, the slower the query would get. We'd have to scan every post and compare the `createdAt` date.

To make this query faster, we can index `createdAt`:

```typescript
// instant.schema.ts

const _schema = i.schema({
  entities: {
    // ...
    posts: i.entity({
      createdAt: i.date().indexed(), // 🔥,
      // ...
    }),
  },
});
```

This tells Instant to index the `createdAt` field, which lets us quickly look up entities by this attribute.

## Links

Links connect two namespaces together. When you define a link, you define it both in the 'forward', and the 'reverse' direction. For example:

```typescript
postAuthor: {
  forward: { on: "posts", has: "one", label: "author" },
  reverse: { on: "profiles", has: "many", label: "authoredPosts" },
}
```

This links `posts` and `profiles` together:

- `posts.author` links to _one_ `profiles` entity
- `profiles.authoredPosts` links back to _many_ `posts` entities.

Since links are defined in both directions, you can query in both directions too:

```typescript
// This queries all posts with their author
const query1 = {
  posts: {
    author: {},
  },
};

// This queries profiles, with all of their authoredPosts!
const query2 = {
  profiles: {
    authoredPosts: {},
  },
};
```

Links can have one of four relationship types: `many-to-many`, `many-to-one`, `one-to-many`, and `one-to-one`

Our micro-blog example has the following relationship types:

- **One-to-one** between `profiles` and `$users`
- **One-to-many** between `posts` and `profiles`
- **One-to-many** between `comments` and `posts`
- **One-to-many** between `comments` and `profiles`
- **Many-to-many** between `posts` and `tags`

## Restrictions on links

Link names must be unique. You cannot have two links with the same name. Links must
also be alphanumeric and can contain underscores. They cannot contain spaces.

You can link entities to themselves and you can link the same entities more than
once as long as the link names are different and the labels in the forward and
reverse directions do not conflict.


```
// ❌ You CANNOT define the same attribute more than once on an entity.
postAuthor: {
  forward: { on: "posts", has: "one", label: "author" },
  // This creates a `posts` attribute on `profiles`
  reverse: { on: "profiles", has: "many", label: "posts" },
},

postEditor: {
  forward: { on: "posts", has: "one", label: "editor" },
  // This will conflict with the `posts` attribute on `profiles`!
  reverse: { on: "profiles", has: "many", label: "posts" },
},
```

```
// ✅ You must have different attributes on an entity.
postAuthor: {
  forward: { on: "posts", has: "one", label: "author" },
  // This creates an `authoredPosts` attribute on `profiles`
  reverse: { on: "profiles", has: "many", label: "authoredPosts" },
},

postEditor: {
  forward: { on: "posts", has: "one", label: "editor" },
  // This creates an `editedPosts` attribute on `profiles`
  // This works because `authoredPosts` is distinct from `editedPosts`
  reverse: { on: "profiles", has: "many", label: "editedPosts" },
},

```

You can link to system namespaces like `$users` but you MUST have the system
namespace in the reverse direction of the link.


```
// ❌ You CANNOT link to system namespaces in the forward direction of a link.

profileUser: {
forward: { on: '$users', has: 'one', label: 'profile' },
  reverse: { on: 'profiles', has: 'one', label: '$user' },
},

```

```
// ✅ You can link to system namespaces in the reverse direction of a link.

profileUser: {
forward: { on: 'profiles', has: 'one', label: '$user' },
  reverse: { on: '$users', has: 'one', label: 'profile' },
},

```

## Cascade Delete

Links defined with `has: "one"` can set `onDelete: "cascade"`. In this case, when the profile entity is deleted, all post entities will be deleted too:

```typescript
postAuthor: {
  forward: { on: "posts", has: "one", label: "author", onDelete: "cascade" },
  reverse: { on: "profiles", has: "many", label: "authoredPosts" },
}

// this will delete profile and all linked posts
db.tx.profiles[user_id].delete();
```

Without `onDelete: "cascade"`, deleting a profile would simply delete the links but not delete the underlying posts.

If you prefer to model links in other direction, you can do it, too:

```
postAuthor: {
  forward: { on: "profiles", has: "many", label: "authoredPosts" },
  reverse: { on: "posts", has: "one", label: "author", onDelete: "cascade" },
}
```

## Publishing schema

Once you've defined your schema, the user will need to publish it to Instant
with the cli. More info on this in the Instant CLi section.

## Renaming and deleting attributes

You can always modify or delete attributes after creating them. **You can't use the CLI to do this yet thought, but you can tell the user to use the dashboard.**

Say we wanted to rename `posts.createdAt` to `posts.publishedAt`. We can do this
by directing a user to

1. Go to their [Dashboard](https://instantdb.com/dash)
2. Click "Explorer"
3. Click "posts"
4. Click "Edit Schema"
5. Click `createdAt`

From there they will see a modal that can use to rename the attribute, index it, or delete it.

# Using Permissions to secure schema and data

InstantDB's permissions language is built on Google's Common Expression Language
(CEL), enhanced with additional capabilities for managing data access control.
This section shows how to write permission rules, with examples and common pitfalls to avoid.

## Core Permissions Concepts

InstantDB permissions are boolean expressions that determine who can access what data. Each permission rule evaluates to either `true` or `false`, controlling whether operations like viewing, creating, updating, or deleting data are allowed.

## Permission Structure

Permissions are organized by namespace (data type) and operation:

```javascript
{
  "todos": {
    "allow": {
      "view": "auth.id != null",
      "create": "isOwner",
      "update": "isOwner",
      "delete": "isOwner"
    },
    "bind": ["isOwner", "auth.id != null && auth.id == data.creatorId"]
  }
}
```

## Available Operations

- `view`: Controls who can read data (used in `db.useQuery`)
- `create`: Controls who can create new data
- `update`: Controls who can modify existing data
- `delete`: Controls who can remove data

## Key Objects Available in Rules

### `data`

The object being accessed. Contains all its fields and properties.

```javascript
// Allow access only to public todos
"view": "data.isPublic == true"
```

### `newData`

Available only in `update` rules. Contains the fields being updated.

```javascript
// Allow updates only when the title changes
"update": "newData.title != data.title"
```

### `auth`

The authenticated user's information.

```javascript
// Only allow logged-in users
"view": "auth.id != null"

// Only allow specific email domains
"view": "auth.email.endsWith('@mycompany.com')"
```

## Special Functions

### `ref`

The `ref` function allows you to navigate relationships between objects.

```javascript
// Allow viewing only if the user is a member of the team
"view": "auth.id in data.ref('team.members.id')"

// Only admins can delete
"delete": "'admin' in auth.ref('$user.role.type')"
```

#### Important Notes about `ref`:

1. When used with `auth`, paths must start with `$user.` to indicate user relationship traversal
2. Returns a list of values, which is why you often use operators like `in`
3. Can navigate multiple relationships with dot notation (e.g., `'users.teams.name'`)

### `bind`

Allows you to create aliases for complex expressions:

```javascript
"todos": {
  "allow": {
    "create": "isOwner || isAdmin"
  },
  "bind": [
    "isOwner", "auth.id != null && auth.id == data.creatorId",
    "isAdmin", "auth.email == 'admin@example.com'"
  ]
}
```

The `bind` array consists of pairs: the name to bind and the expression it represents.

## Operators and Common Patterns

### Logical Operators

```javascript
// AND
"view": "auth.id != null && data.isPublic == true"

// OR
"view": "isOwner || isAdmin"

// NOT
"view": "!(data.isPrivate == true)"
```

### Collection Operators

```javascript
// Check if value exists in a collection
"view": "auth.id in data.ref('allowedUsers.id')"

// Check if all elements match a condition
"update": "data.ref('members.role').all(x, x == 'active')"

// Check if any element matches a condition
"delete": "data.ref('approvers.id').exists(x, x == auth.id)"

// Check if exactly one element matches
"update": "data.ref('admins.id').exists_one(x, x == auth.id)"
```

## Default Permissions

By default, all permissions are `true`. You can set defaults for all operations:

```javascript
// Make all operations default to false
"todos": {
  "allow": {
    "$default": "false",
    "view": "true"  // Override specific operation
  }
}
```

Or set defaults for all namespaces:

```javascript
"$default": {
  "allow": {
    "view": "false"
  }
}
```

## Common Patterns

### Owner-based permissions

```javascript
"todos": {
  "allow": {
    "view": "data.creatorId == auth.id",
    "update": "data.creatorId == auth.id",
    "delete": "data.creatorId == auth.id"
  }
}
```

### Role-based permissions

```javascript
"documents": {
  "allow": {
    "update": "isAdmin || isAuthor",
    "delete": "isAdmin"
  },
  "bind": [
    "isAdmin", "'admin' in auth.ref('$user.roles.name')",
    "isAuthor", "auth.id == data.authorId"
  ]
}
```

### Team/group permissions

```javascript
"projects": {
  "allow": {
    "view": "auth.id in data.ref('team.members.id')"
  }
}
```

## Common Pitfalls and Mistakes

### ❌ Missing `$user` prefix with `auth.ref`

```javascript
// Incorrect - auth.ref must use the $user prefix
"delete": "'admin' in auth.ref('roles.name')"

// Correct
"delete": "'admin' in auth.ref('$user.roles.name')"
```

### ❌ Using complex expressions directly in `ref`

```javascript
// Incorrect - ref arguments must be string literals
"view": "auth.id in data.ref(someVariable + '.members.id')"

// Correct - ref arguments should be string literals
"view": "auth.id in data.ref('team.members.id')"
```

### ❌ Not using collection operators properly

```javascript
// Incorrect - cannot use == with a list
"view": "data.ref('admins.id') == auth.id"

// Correct
"view": "auth.id in data.ref('admins.id')"
```

### ❌ Using wrong comparison types

```javascript
// Incorrect - comparing string to number without conversion
"view": "data.count == '5'"

// Correct
"view": "data.count == 5" 
```

## Advanced Examples

### Conditional field-level permissions

```javascript
"users": {
  "allow": {
    "update": "isOwner || (isAdmin && onlyUpdatingNonSensitiveFields)"
  },
  "bind": [
    "isOwner", "auth.id == data.id",
    "isAdmin", "'admin' in auth.ref('$user.roles.name')",
    "onlyUpdatingNonSensitiveFields", "!(newData.email != data.email || newData.password != data.password)"
  ]
}
```

### Permission based on data values

```javascript
"posts": {
  "allow": {
    "update": "isOwner || (isEditor && data.status == 'draft')"
  },
  "bind": [
    "isOwner", "auth.id == data.authorId",
    "isEditor", "'editor' in auth.ref('$user.roles.name')"
  ]
}
```

# Writing Data in React

Instant uses a Firebase-inspired interface for mutations. We call our mutation language InstaML

## Create data

❌ DO NOT use `create` to create entities.

```
// ❌ This will throw an error!
db.transact(db.tx.goals[id()].create({ title: 'eat' }));
```

Instead, use `update` to create entities.

```
// ✅ This will create a new goal
db.transact(db.tx.goals[id()].create({ title: 'eat' }));
```

This creates a new `goal` with the following properties:

- It's identified by a randomly generated id via the `id()` function.
- It has an attribute `title` with value `eat`.

Similar to NoSQL, you don't need to use the same schema for each entity in a namespace. After creating the previous goal you can run the following:

```javascript
db.transact(
  db.tx.goals[id()].update({
    priority: 'none',
    isSecret: true,
    value: 10,
    aList: [1, 2, 3],
    anObject: { foo: 'bar' },
  }),
);
```

You can store `strings`, `numbers`, `booleans`, `arrays`, and `objects` as values. You can also generate values via functions. Below is an example for picking a random goal title.

```javascript
db.transact(
  db.tx.goals[id()].update({
    title: ['eat', 'sleep', 'hack', 'repeat'][Math.floor(Math.random() * 4)],
  }),
);
```

## Update data

The `update` action is also used for updating entities. Suppose we had created the following goal

```javascript
const eatId = id();
db.transact(
  db.tx.goals[eatId].update({ priority: 'top', lastTimeEaten: 'Yesterday' }),
);
```

We eat some food and decide to update the goal. We can do that like so:

```javascript
db.transact(db.tx.goals[eatId].update({ lastTimeEaten: 'Today' }));
```

This will only update the value of the `lastTimeEaten` attribute for entity `eat`.

## Merge data

When you `update` an attribute, you overwrite it. This is fine for updating
values of strings, numbers, and booleans. But if you use `update` to overwrite
json objects you may encounter two problems:

1. You lose any data you didn't specify.
2. You risk clobbering over changes made by other clients.

For example, imagine we had a `game` entity, that stored a `state` of favorite colors:

```javascript
// User 1 saves {'0-0': 'red'}
db.transact(db.tx.games[gameId].update({ state: { '0-0': 'red' } }));

// User 2 saves {'0-1': 'blue'}
db.transact(db.tx.games[gameId].update({ state: { '0-1': 'blue' } }));

// 🤔 Uh oh! User 2 overwrite User 1:
// Final State: {'0-1': 'blue' }
```

To make working with deeply-nested, document-style JSON values a breeze, we created `merge`.
Similar to [lodash's `merge` function](https://lodash.com/docs/4.17.15#merge),
`merge` allows you to specify the slice of data you want to update:

```javascript
// User 1 saves {'0-0': 'red'}
db.transact(db.tx.games[gameId].merge({ state: { '0-0': 'red' } }));

// User 2 saves {'0-1': 'blue'}
db.transact(db.tx.games[gameId].merge({ state: { '0-1': 'blue' } }));

// ✅ Wohoo! Both states are merged!
// Final State: {'0-0': 'red', '0-1': 'blue' }
```

`merge` only merges objects. Calling `merge` on **arrays, numbers, or booleans** will overwrite the values.

Sometimes you may want to remove keys from a nested object. You can do so by calling `merge` with a key set to `null` or `undefined`. This will remove the corresponding property from the object.

```javascript
// State: {'0-0': 'red', '0-1': 'blue' }
db.transact(db.tx.games[gameId].merge({ state: { '0-1': null } }));
// New State! {'0-0': 'red' }
```

"use client";

import { id, init, InstaQLEntity } from "@instantdb/react";
import schema from "../instant.schema";

type Todo = InstaQLEntity<typeof schema, "todos">;

const db = init({ appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!, schema });

function App() {
  // Read Data
  const { isLoading, error, data } = db.useQuery({ todos: {} });
  if (isLoading) {
    return;
  }
  if (error) {
    return <div className="text-red-500 p-4">Error: {error.message}</div>;
  }
  const { todos } = data;
  return (
    <div className="font-mono min-h-screen flex justify-center items-center flex-col space-y-4">
      <h2 className="tracking-wide text-5xl text-gray-300">todos</h2>
      <div className="border border-gray-300 max-w-xs w-full">
        <TodoForm todos={todos} />
        <TodoList todos={todos} />
        <ActionBar todos={todos} />
      </div>
      <div className="text-xs text-center">
        Open another tab to see todos update in realtime!
      </div>
    </div>
  );
}

// Write Data
// ---------
function addTodo(text: string) {
  db.transact(
    db.tx.todos[id()].update({
      text,
      done: false,
      createdAt: Date.now(),
    })
  );
}

function deleteTodo(todo: Todo) {
  db.transact(db.tx.todos[todo.id].delete());
}

function toggleDone(todo: Todo) {
  db.transact(db.tx.todos[todo.id].update({ done: !todo.done }));
}

function deleteCompleted(todos: Todo[]) {
  const completed = todos.filter((todo) => todo.done);
  const txs = completed.map((todo) => db.tx.todos[todo.id].delete());
  db.transact(txs);
}

function toggleAll(todos: Todo[]) {
  const newVal = !todos.every((todo) => todo.done);
  db.transact(
    todos.map((todo) => db.tx.todos[todo.id].update({ done: newVal }))
  );
}


// Components
// ----------
function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20">
      <path
        d="M5 8 L10 13 L15 8"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
      />
    </svg>
  );
}

function TodoForm({ todos }: { todos: Todo[] }) {
  return (
    <div className="flex items-center h-10 border-b border-gray-300">
      <button
        className="h-full px-2 border-r border-gray-300 flex items-center justify-center"
        onClick={() => toggleAll(todos)}
      >
        <div className="w-5 h-5">
          <ChevronDownIcon />
        </div>
      </button>
      <form
        className="flex-1 h-full"
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.input as HTMLInputElement;
          addTodo(input.value);
          input.value = "";
        }}
      >
        <input
          className="w-full h-full px-2 outline-none bg-transparent"
          autoFocus
          placeholder="What needs to be done?"
          type="text"
          name="input"
        />
      </form>
    </div>
  );
}

function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <div className="divide-y divide-gray-300">
      {todos.map((todo) => (
        <div key={todo.id} className="flex items-center h-10">
          <div className="h-full px-2 flex items-center justify-center">
            <div className="w-5 h-5 flex items-center justify-center">
              <input
                type="checkbox"
                className="cursor-pointer"
                checked={todo.done}
                onChange={() => toggleDone(todo)}
              />
            </div>
          </div>
          <div className="flex-1 px-2 overflow-hidden flex items-center">
            {todo.done ? (
              <span className="line-through">{todo.text}</span>
            ) : (
              <span>{todo.text}</span>
            )}
          </div>
          <button
            className="h-full px-2 flex items-center justify-center text-gray-300 hover:text-gray-500"
            onClick={() => deleteTodo(todo)}
          >
            X
          </button>
        </div>
      ))}
    </div>
  );
}

function ActionBar({ todos }: { todos: Todo[] }) {
  return (
    <div className="flex justify-between items-center h-10 px-2 text-xs border-t border-gray-300">
      <div>Remaining todos: {todos.filter((todo) => !todo.done).length}</div>
      <button
        className=" text-gray-300 hover:text-gray-500"
        onClick={() => deleteCompleted(todos)}
      >
        Delete Completed
      </button>
    </div>
  );
}

export default App;

## Delete data

The `delete` action is used for deleting entities.

```javascript
db.transact(db.tx.goals[eatId].delete());
```

You can generate an array of `delete` txs to delete all entities in a namespace

```javascript
const { isLoading, error, data } = db.useQuery({ goals: {} });
const { goals } = data;
// ...

db.transact(goals.map((g) => db.tx.goals[g.id].delete()));
```

Calling `delete` on an entity also deletes its associations. So no need to worry about cleaning up previously created links.

## Link data

`link` is used to create associations.

Suppose we create a `goal` and a `todo`.

```javascript
db.transact([
  db.tx.todos[workoutId].update({ title: 'Go on a run' }),
  db.tx.goals[healthId].update({ title: 'Get fit!' }),
]);
```

We can associate `healthId` with `workoutId` like so:

```javascript
db.transact(db.tx.goals[healthId].link({ todos: workoutId }));
```

We could have done all this in one `transact` too via chaining transaction chunks.

```javascript
db.transact([
  db.tx.todos[workoutId].update({ title: 'Go on a run' }),
  db.tx.goals[healthId]
    .update({ title: 'Get fit!' })
    .link({ todos: workoutId }),
]);
```

You can specify multiple ids in one `link` as well:

```javascript
db.transact([
  db.tx.todos[workoutId].update({ title: 'Go on a run' }),
  db.tx.todos[proteinId].update({ title: 'Drink protein' }),
  db.tx.todos[sleepId].update({ title: 'Go to bed early' }),
  db.tx.goals[healthId]
    .update({ title: 'Get fit!' })
    .link({ todos: [workoutId, proteinId, sleepId] }),
]);
```

Links are bi-directional. Say we link `healthId` to `workoutId`

```javascript
db.transact(db.tx.goals[healthId].link({ todos: workoutId }));
```

We can query associations in both directions

```javascript
const { isLoading, error, data } = db.useQuery({
  goals: { todos: {} },
  todos: { goals: {} },
});

const { goals, todos } = data;
console.log('goals with nested todos', goals);
console.log('todos with nested goals', todos);
```

## Unlink data

Links can be removed via `unlink.`

```javascript
db.transact(db.tx.goals[healthId].unlink({ todos: workoutId }));
```

This removes links in both directions. Unlinking can be done in either direction so unlinking `workoutId` from `healthId` would have the same effect.

```javascript
db.transact([db.tx.todos[workoutId].unlink({ goals: healthId })]);
```

We can `unlink` multiple ids too:

```javascript
db.transact([
  db.tx.goals[healthId].unlink({ todos: [workoutId, proteinId, sleepId] }),
  db.tx.goals[workId].unlink({ todos: [standupId, reviewPRsId, focusId] }),
]);
```

## Lookup by unique attribute

If your entity has a unique attribute, you can use `lookup` in place of the id to perform updates.

```javascript
import { lookup } from '@instantdb/react';

db.transact(
  db.tx.profiles[lookup('email', 'eva_lu_ator@instantdb.com')].update({
    name: 'Eva Lu Ator',
  }),
);
```

The `lookup` function takes the attribute as its first argument and the unique attribute value as its second argument.

When it is used in a transaction, the updates will be applied to the entity that has the unique value. If no entity has the value, then a new entity with a random id will be created with the value.

It can be used with `update`, `delete`, `merge`, `link`, and `unlink`.

## Lookups in links

When used with links, it can also be used in place of the linked entity's id.

```javascript
db.transact(
  db.tx.users[lookup('email', 'eva_lu_ator@instantdb.com')].link({
    posts: lookup('number', 15), // using a lookup in place of the id
  }),
);
```

## Transacts are atomic

When you call `db.transact`, all the transactions are committed atomically. If
any of the transactions fail, none of them will be committed.

## Batching transactions

If you have a large number of transactions to commit, you'll want to batch them
to avoid hitting transaction limits and time outs.

Suppose we want to create 3000 goals. Here's how we can batch them into 30 transactions of 100 goals each.

```javascript
const batchSize = 100; // doing 100 txs should be pretty safe
const createGoals = async (total) => {
  let goals = [];
  const batches = [];

  // iterate through all your goals and create batches
  for (let i = 0; i < total; i++) {
    const goalNumber = i + 1;
    goals.push(
      db.tx.goals[id()].update({ goalNumber, title: `Goal ${goalNumber}` }),
    );

    // We have enough goals to create a batch
    if (goals.length >= batchSize) {
      batches.push(goals);
      goals = []; // reset goals for the next batch
    }
  }

  // Add any remaining goals to the last batch
  if (goals.length) {
    batches.push(goals);
  }

  // Now that you have your batches, transact them
  for (const batch of batches) {
    await db.transact(batch);
  }
};
```

## Using the tx proxy object

`db.tx` is a proxy object which creates transaction chunks to be committed via `db.transact`. It follows the format

```
db.tx.NAMESPACE_LABEL[ENTITY_IDENTIFIER].ACTION(ACTION_SPECIFIC_DATA)
```

- `NAMESPACE_LABEL` refers to the namespace to commit (e.g. `goals`, `todos`)
- `ENTITY_IDENTIFIER` is the id to look up in the namespace. This id must be a uuid and unique to the namespace. You can use the `id()` function to generate a uuid for convenience.
- `ACTION` is one of `update`, `merge`, `delete`, `link`, `unlink`
- `ACTION_SPECIFIC_DATA` depends on the action
  - `update` takes in an object of information to commit
  - `merge` takes in an object to deep merge with the existing data
  - `delete` is the only action that doesn't take in any data,
  - `link` and `unlink` takes an object of label-entity pairs to create/delete associations

This specifies the full api of `db.tx`, the only valid actions are `update`,
`merge`, `delete`, `link`, and `unlink`. DO NOT hallucinate that there is a
`create` method.

# Reading Data in React

Instant uses a declarative syntax for querying. It's like GraphQL without the configuration. Here's how you can query data with **InstaQL.**

## Fetch namespace

One of the simplest queries you can write is to simply get all entities of a namespace.

```javascript
import { init } from '@instantdb/react';

const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
});

function App() {
  // Queries! 🚀
  const query = { goals: {} };
  const { isLoading, error, data } = db.useQuery(query);
  // ...
}
```

Inspecting `data`, we'll see:

```javascript
console.log(data)
{
  "goals": [
    {
      "id": healthId,
      "title": "Get fit!"
    },
    {
      "id": workId,
      "title": "Get promoted!"
    }
  ]
}
```

For comparison, the SQL equivalent of this would be something like:

```javascript
const data = { goals: doSQL('SELECT * FROM goals') };
```

## Fetch multiple namespaces

You can fetch multiple namespaces at once:

```javascript
const query = { goals: {}, todos: {} };
const { isLoading, error, data } = db.useQuery(query);
```

We will now see data for both namespaces.

```javascript
console.log(data)
{
  "goals": [...],
  "todos": [
    {
      "id": focusId,
      "title": "Code a bunch"
    },
    {
      "id": proteinId,
      "title": "Drink protein"
    },
    ...
  ]
}
```

The equivalent of this in SQL would be to write two separate queries.

```javascript
const data = {
  goals: doSQL('SELECT * from goals'),
  todos: doSQL('SELECT * from todos'),
};
```

## Fetch a specific entity

If you want to filter entities, you can use the `where` keyword. Here we fetch a specific goal

```javascript
const query = {
  goals: {
    $: {
      where: {
        id: healthId,
      },
    },
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

```javascript
console.log(data)
{
  "goals": [
    {
      "id": healthId,
      "title": "Get fit!"
    }
  ]
}
```

The SQL equivalent would be:

```javascript
const data = { goals: doSQL("SELECT * FROM goals WHERE id = 'healthId'") };
```

## Fetch associations

We can fetch goals and their related todos.

```javascript
const query = {
  goals: {
    todos: {},
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

`goals` would now include nested `todos`

```javascript
console.log(data)
{
  "goals": [
    {
      "id": healthId,
      "title": "Get fit!",
      "todos": [...],
    },
    {
      "id": workId,
      "title": "Get promoted!",
      "todos": [...],
    }
  ]
}
```

## Comparing with SQL

The SQL equivalent for this would be something along the lines of:

```javascript
const query = `
  SELECT g.*, gt.todos
  FROM goals g
  JOIN (
      SELECT g.id, json_agg(t.*) as todos
      FROM goals g
      LEFT JOIN todos t on g.id = t.goal_id
      GROUP BY 1
  ) gt on g.id = gt.id
`;
const data = { goals: doSQL(query) };
```

Notice the complexity of this SQL query. Although fetching associations in SQL is straightforward via `JOIN`, marshalling the results in a nested structure via SQL is tricky. An alternative approach would be to write two straight-forward queries and then marshall the data on the client.

```javascript
const _goals = doSQL("SELECT * from goals")
const _todos = doSQL("SELECT * from todos")
const data = {goals: _goals.map(g => (
  return {...g, todos: _todos.filter(t => t.goal_id === g.id)}
))
```

Now compare these two approaches with `InstaQL`

```javascript
const query = {
  goals: {
    todos: {},
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

Modern applications often need to render nested relations, `InstaQL` really starts to shine for these use cases.

## Fetch associations for filtered namespace

We can fetch a specific entity in a namespace as well as it's related associations.

```javascript
const query = {
  goals: {
    $: {
      where: {
        id: healthId,
      },
    },
    todos: {},
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

Which returns

```javascript
console.log(data)
{
  "goals": [
    {
      "id": healthId,
      "title": "Get fit!",
      "todos": [
        {
          "id": proteinId,
          "title": "Drink protein"
        },
        {
          "id": sleepId,
          "title": "Go to bed early"
        },
        {
          "id": workoutId,
          "title": "Go on a run"
        }
      ]
    }
  ]
}
```

## Filter namespace by associated values

We can filter namespaces **by their associations**

```javascript
const query = {
  goals: {
    $: {
      where: {
        'todos.title': 'Code a bunch',
      },
    },
    todos: {},
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

Returns

```javascript
console.log(data)
{
  "goals": [
    {
      "id": workId,
      "title": "Get promoted!",
      "todos": [
        {
          "id": focusId,
          "title": "Code a bunch"
        },
        {
          "id": reviewPRsId,
          "title": "Review PRs"
        },
        {
          "id": standupId,
          "title": "Do standup"
        }
      ]
    }
  ]
}
```

## Filter associations

We can also filter associated data.

```javascript
const query = {
  goals: {
    todos: {
      $: {
        where: {
          'todos.title': 'Go on a run',
        },
      },
    },
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

This will return goals and filtered todos

```javascript
console.log(data)
{
  "goals": [
    {
      "id": healthId,
      "title": "Get fit!",
      "todos": [
        {
          "id": workoutId,
          "title": "Go on a run"
        }
      ]
    },
    {
      "id": workId,
      "title": "Get promoted!",
      "todos": []
    }
  ]
}
```

## Query inverse associations

Associations are also available in the reverse order. In the previous example,
we queried goals and their todos. We can also query todos and their goals.

```javascript
const query = {
  todos: {
    goals: {},
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

```javascript
console.log(data)
{
  "todos": [
    {
      "id": focusId,
      "title": "Code a bunch",
      "goals": [
        {
          "id": workId,
          "title": "Get promoted!"
        }
      ]
    },
    ...,
  ]
}
```

## Defer queries

You can also defer queries until a condition is met. This is useful when you
need to wait for some data to be available before you can run your query. Here's
an example of deferring a fetch for todos until a user is logged in.

```javascript
const { isLoading, user, error } = db.useAuth();

const {
  isLoading: isLoadingTodos,
  error,
  data,
} = db.useQuery(
  user
    ? {
        // The query will run once user is populated
        todos: {
          $: {
            where: {
              userId: user.id,
            },
          },
        },
      }
    : // Otherwise skip the query, which sets `isLoading` to true
      null,
);
```

## Pagination

You can limit the number of items from a top level namespace by adding a `limit` to the option map:

```javascript
const query = {
  todos: {
    // limit is only supported for top-level namespaces right now
    // and not for nested namespaces.
    $: { limit: 10 },
  },
};

const { isLoading, error, data, pageInfo } = db.useQuery(query);
```

Instant supports both offset-based and cursor-based pagination for top-level
namespaces.

### Offset

To get the next page, you can use an offset:

```javascript
const query = {
  todos: {
    $: {
      limit: 10,
      // similar to `limit`, `offset` is only supported for top-level namespaces
      offset: 10,
    },
  },
};

const { isLoading, error, data, pageInfo } = db.useQuery(query);
```

In a React application, your offset-based pagination code might look something like this:

```jsx
const [pageNumber, setPageNumber] = React.useState(1);

const pageSize = 10;

const query = {
  todos: {
    $: {
      limit: pageSize,
      offset: pageSize * (pageNumber - 1),
    },
  },
};

const { isLoading, error, data } = db.useQuery(query);

// Load the next page by increasing the page number, which will
// increase the offset by the page size.
const loadNextPage = () => {
  setPageNumber(pageNumber + 1);
};

// Load the previous page by decreasing the page number, which will
// decrease the offset by the page size.
const loadPreviousPage = () => {
  setPageNumber(pageNumber - 1);
};
```

### Cursors

You can also get the next page with the `endCursor` returned in the `pageInfo` map from the previous result:

```javascript
const query = {
  todos: {
    $: {
      // These also are only supported for top-level namespaces
      first: 10,
      after: pageInfo?.todos?.endCursor,
    },
  },
};
```

To get the previous page, use the `startCursor` in the `before` field of the option map and ask for the `last` items:

```javascript
const query = {
  todos: {
    $: {
      last: 10,
      before: pageInfo?.todos?.startCursor,
    },
  },
};
```

In a React application, your cursor-based pagination code might look something like this:

```jsx
const pageSize = 10;

const [cursors, setCursors] = React.useState({ first: pageSize });

const query = {
  todos: {
    $: {
      ...cursors,
    },
  },
};

const { isLoading, error, data, pageInfo } = db.useQuery(query);

const loadNextPage = () => {
  const endCursor = pageInfo?.todos?.endCursor;
  if (endCursor) {
    setCursors({ after: endCursor, first: pageSize });
  }
};

const loadPreviousPage = () => {
  const startCursor = pageInfo?.todos?.startCursor;
  if (startCursor) {
    setCursors({
      before: startCursor,
      // Ask for the `last` 10 items so that we get the items just
      // before our startCursor
      last: pageSize,
    });
  }
};
```

### Ordering

The default ordering is by the time the objects were created, in ascending order. You can change the order with the `order` key in the option map for top-level namespaces:

```javascript
const query = {
  todos: {
    $: {
      limit: 10,
      // Similar to limit, order is limited to top-level namespaces right now
      order: {
        serverCreatedAt: 'desc',
      },
    },
  },
};
```

The `serverCreatedAt` field is a reserved key that orders by the time that the object was first persisted on the Instant backend. It can take the value 'asc' (the default) or 'desc'.

You can also order by any attribute that is indexed and has a checked type.

## Advanced filtering

Below are some examples of additional capaibilities of the query language.

### Multiple `where` conditions

The `where` clause supports multiple keys which will filter entities that match all of the conditions.

```javascript
const query = {
  todos: {
    $: {
      where: {
        completed: true,
        'goals.title': 'Get promoted!',
      },
    },
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

```javascript
console.log(data)
{
  "todos": [
    {
      "id": focusId,
      "title": "Code a bunch",
      "completed": true
    }
  ]
}
```

### And

The `where` clause supports `and` queries which are useful when you want to filter entities that match multiple associated values.

In this example we want to find goals that have todos with the titles `Drink protein` and `Go on a run`

```javascript
const query = {
  goals: {
    $: {
      where: {
        and: [
          { 'todos.title': 'Drink protein' },
          { 'todos.title': 'Go on a run' },
        ],
      },
    },
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

```javascript
console.log(data)
{
  "goals": [
    {
      "id": healthId,
      "title": "Get fit!"
    }
  ]
}
```

### OR

The `where` clause supports `or` queries that will filter entities that match any of the clauses in the provided list:

```javascript
const query = {
  todos: {
    $: {
      where: {
        or: [{ title: 'Code a bunch' }, { title: 'Review PRs' }],
      },
    },
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

```javascript
console.log(data);
{
  "todos": [
    {
      "id": focusId,
      "title": "Code a bunch"
    },
    {
      "id": reviewPRsId,
      "title": "Review PRs"
    },
  ]
}
```

### $in

The `where` clause supports `$in` queries that will filter entities that match any of the items in the provided list.
You can think of this as a shorthand for `or` on a single key.

```javascript
const query = {
  todos: {
    $: {
      where: {
        title: { $in: ['Code a bunch', 'Review PRs'] },
      },
    },
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

```javascript
console.log(data)
{
  "todos": [
    {
      "id": focusId,
      "title": "Code a bunch"
    },
    {
      "id": reviewPRsId,
      "title": "Review PRs"
    }
  ]
}
```

### Comparison operators

The `where` clause supports comparison operators on fields that are indexed and have checked types.

{% callout %}
Add indexes and checked types to your attributes from the [Explorer on the Instant dashboard](/dash?t=explorer) or from the [cli with Schema-as-code](/docs/modeling-data).
{% /callout %}

| Operator |       Description        | JS equivalent |
| :------: | :----------------------: | :-----------: |
|  `$gt`   |       greater than       |      `>`      |
|  `$lt`   |        less than         |      `<`      |
|  `$gte`  | greater than or equal to |     `>=`      |
|  `$lte`  |  less than or equal to   |     `<=`      |

```javascript
const query = {
  todos: {
    $: {
      where: {
        timeEstimateHours: { $gt: 24 },
      },
    },
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

```javascript
console.log(data);
{
  "todos": [
    {
      "id": buildShipId,
      "title": "Build a starship prototype",
      "timeEstimateHours": 5000
    }
  ]
}
```

Dates can be stored as timestamps (milliseconds since the epoch, e.g. `Date.now()`) or as ISO 8601 strings (e.g. `JSON.stringify(new Date())`) and can be queried in the same formats:

```javascript
const now = '2024-11-26T15:25:00.054Z';
const query = {
  todos: {
    $: { where: { dueDate: { $lte: now } } },
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

```javascript
console.log(data);
{
  "todos": [
    {
      "id": slsFlightId,
      "title": "Space Launch System maiden flight",
      "dueDate": "2017-01-01T00:00:00Z"
    }
  ]
}
```

If you try to use comparison operators on data that isn't indexed and type-checked, you'll get an error:

```javascript
const query = {
  todos: {
    $: { where: { priority: { $gt: 2 } } },
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

```javascript
console.log(error);
{
  "message": "Validation failed for query",
  "hint": {
    "data-type": "query",
    "errors": [
      {
        "expected?": "indexed?",
        "in": ["priority", "$", "where", "priority"],
        "message": "The `todos.priority` attribute must be indexed to use comparison operators."
      }
    ],
    "input": {
      "todos": {
        "$": {
          "where": {
            "priority": {
              "$gt": 2
            }
          }
        }
      }
    }
  }
}
```

### $not

The `where` clause supports `$not` queries that will return entities that don't
match the provided value for the field, including entities where the field is null or undefined.

```javascript
const query = {
  todos: {
    $: {
      where: {
        location: { $not: 'work' },
      },
    },
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

```javascript
console.log(data)
{
  "todos": [
    {
      "id": cookId,
      "title": "Cook dinner",
      "location": "home"
    },
    {
      "id": readId,
      "title": "Read",
      "location": null
    },
        {
      "id": napId,
      "title": "Take a nap"
    }
  ]
}
```

### $isNull

The `where` clause supports `$isNull` queries that will filters entities by whether the field value is either null or undefined.

Set `$isNull` to `true` to return entities where where the field is null or undefined.

Set `$isNull` to `false` to return entities where the field is not null and not undefined.

```javascript
const query = {
  todos: {
    $: {
      where: {
        location: { $isNull: false },
      },
    },
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

```javascript
console.log(data)
{
  "todos": [
    {
      "id": cookId,
      "title": "Cook dinner",
      "location": "home"
    }
  ]
}
```

```javascript
const query = {
  todos: {
    $: {
      where: {
        location: { $isNull: true },
      },
    },
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

```javascript
console.log(data)
{
  "todos": [
    {
      "id": readId,
      "title": "Read",
      "location": null
    },
    {
      "id": napId,
      "title": "Take a nap"
    }
  ]
}
```

### $like

The `where` clause supports `$like` on fields that are indexed with a checked `string` type.

`$like` queries will return entities that match a **case sensitive** substring of the provided value for the field.

For **case insensitive** matching use `$ilike` in place of `$like`.

Here's how you can do queries like `startsWith`, `endsWith` and `includes`.

|          Example          |      Description      | JS equivalent |
| :-----------------------: | :-------------------: | :-----------: |
|    `{ $like: "Get%" }`    |   Starts with 'Get'   | `startsWith`  |
| `{ $like: "%promoted!" }` | Ends with 'promoted!' |  `endsWith`   |
|   `{ $like: "%fit%" }`    |    Contains 'fit'     |  `includes`   |

Here's how you can use `$like` to find all goals that end with the word
"promoted!"

```javascript
// Find all goals that end with the word "promoted!"
const query = {
  goals: {
    $: {
      where: {
        title: { $like: '%promoted!' },
      },
    },
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

```javascript
console.log(data)
{
  "goals": [
    {
      "id": workId,
      "title": "Get promoted!",
    }
  ]
}
```

You can use `$like` in nested queries as well

```javascript
// Find goals that have todos with the word "standup" in their title
const query = {
  goals: {
    $: {
      where: {
        'todos.title': { $like: '%standup%' },
      },
    },
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

Returns

```javascript
console.log(data)
{
  "goals": [
    {
      "id": standupId,
      "title": "Perform standup!",
    }
  ]
}
```

Case-insensitive matching with `$ilike`:

```javascript
const query = {
  goals: {
    $: {
      where: {
        'todos.title': { $ilike: '%stand%' },
      },
    },
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

```javascript
console.log(data)
{
  "goals": [
    {
      "id": standupId,
      "title": "Perform standup!",
    },
    {
      "id": standId,
      "title": "Stand up a food truck.",
    }
  ]
}
```

## Select fields

An InstaQL query will fetch all fields for each object.

If you prefer to select the specific fields that you want your query to return, use the `fields` param:

```javascript
const query = {
  goals: {
    $: {
      fields: ['status'],
    },
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

```javascript
console.log(data)
{
  "goals": [
    {
      "id": standupId, // id will always be returned even if not specified
      "status": "in-progress"
    },
    {
      "id": standId,
      "status": "completed"
    }
  ]
}
```

`fields` also works with nested relations:

```javascript
const query = {
  goals: {
    $: {
      fields: ['title'],
    },
    todos: {
      $: {
        fields: ['id'],
      },
    },
  },
};
const { isLoading, error, data } = db.useQuery(query);
```

```javascript
console.log(data)
{
  "goals": [
    {
      "id": standupId,
      "title": "Perform standup!",
      "todos": [{"id": writeJokesId}, {"id": goToOpenMicId}]
    },
    {
      "id": standId,
      "title": "Stand up a food truck.",
      "todos": [{"id": learnToCookId}, {"id": buyATruckId}]
    }
  ]
}
```

Using `fields` can be useful for performance optimization. It reduces the
amount of data that needs to be transferred from the server and minimizes the
number of re-renders in your React application if there are no changes to your
selected fields.

## Utility Types

Instant also comes with some utility types to help you use your schema in TypeScript.

For example, you could define your `query` upfront:

```typescript
import { InstaQLParams } from '@instantdb/react';
import { AppSchema } from '../instant.schema.ts';

// `query` typechecks against our schema!
const query = {
  goals: { todos: {} },
} satisfies InstaQLParams<AppSchema>;
```

Or you can define your result type:

```typescript
import { InstaQLResult } from '@instantdb/react';
import { AppSchema } from '../instant.schema.ts';

type GoalsTodosResult = InstaQLResult<AppSchema, { goals: { todos: {} } }>;
```

Or you can extract a particular entity:

```typescript
import { InstaQLEntity } from '@instantdb/react';
import { AppSchema } from '../instant.schema.ts';

type Todo = InstaQLEntity<AppSchema, 'todos'>;
```

You can specify links relative to your entity:

```typescript
type TodoWithGoals = InstaQLEntity<AppSchema, 'todos', { goals: {} }>;
```

## Query once

Sometimes, you don't want a subscription, and just want to fetch data once. For example, you might want to fetch data before rendering a page or check whether a user name is available.

In these cases, you can use `queryOnce` instead of `useQuery`. `queryOnce` returns a promise that resolves with the data once the query is complete.

Unlike `useQuery`, `queryOnce` will throw an error if the user is offline. This is because `queryOnce` is intended for use cases where you need the most up-to-date data.

```javascript
const query = { todos: {} };
const { data } = await db.queryOnce(query);
// returns the same data as useQuery, but without the isLoading and error fields
```

You can also do pagination with `queryOnce`:

```javascript
const query = {
  todos: {
    $: {
      limit: 10,
      offset: 10,
    },
  },
};

const { data, pageInfo } = await db.queryOnce(query);
// pageInfo behaves the same as with useQuery
```

# Instant on the server

You can use Instant on the server as well! This can be especially useful for
running scripts, custom auth flows, or sensitive application logic.

We currently offer a javascript library `@instantdb/admin` for using Instant in
a non-browser context. This library is similar to our client SDK with a few
tweaks. MAKE SURE to use the `admin` version of the library in server contexts.

## init on the backend

Similar to `@instantdb/react`, you must `init` before doing any queries or
writes. Running `init` authenticates you against our admin API. In addition to
providing your `appId`, you must also provide your `adminToken`.

```javascript
import { init, id } from '@instantdb/admin';

const db = init({
  appId: INSTANT_APP_ID,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
});
```

Exposing `appId` in source control is fine but it's not safe
to expose your admin token. Permission checks will not run for queries and
writes from our admin API.

## Reading data on the backend

In react we use `db.useQuery` to enable "live queries", queries that will
automatically update when data changes.

In the admin SDK we INSTEAD use an async `db.query` function that simply fires a
query once and returns a result.

```javascript
const data = await db.query({ goals: {}, todos: {} });
const { goals, todos } = data;
```

## Writing data on the backend

`db.transact` is an async function that behaves functionally identical to `db.transact`
from `@instantdb/react`. It returns a `tx-id` on success.

```javascript
const res = await db.transact([db.tx.todos[id()].update({ title: 'Get fit' })]);
console.log('New todo entry made for with tx-id', res['tx-id']);
```

## Using schema on the backend

It's good practice to use the schema in your backend code as well. This will add
type-safety to `db.query` and `db.transact`.

```typescript
import { init, id } from '@instantdb/admin';
import schema from '../instant.schema.ts';

const db = init({
  appId: process.env.INSTANT_APP_ID,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
  schema,
});
```

## Impersonating users on the backend

When you use the admin SDK, you can make _any_ query or transaction. As an admin, you bypass permissions.
But, sometimes you want to make queries on behalf of your users, and would like to respect permissions.

You can do this with the `db.asUser` function.

```javascript
// Scope by their email
const scopedDb = db.asUser({ email: 'alyssa_p_hacker@instantdb.com' });
// Or with their auth token
const token = db.auth.createToken('alyssa_p_hacker@instantdb.com');
const scopedDb = db.asUser({ token });
// Or use the db as a guest!
const scopedDb = db.asUser({ guest: true });
// Queries and transactions will run with those permissions
await scopedDb.query({ logs: {} });
```

## Retrieve a user on the backend

As an admin, you can retrieve an app user record by `email`, `id`, or `refresh_token`. You can do this with the `db.auth.getUser` function.

```javascript
const user = await db.auth.getUser({ email: 'alyssa_p_hacker@instantdb.com' });
const user = await db.auth.getUser({
  id: userId,
});
const user = await db.auth.getUser({
  refresh_token: userRefreshToken,
});
```

## Delete a user on the backend

You can also delete an app user record by `email`, `id`, or `refresh_token`. You can do this with the `db.auth.deleteUser` function.

```javascript
const deletedUser = await db.auth.deleteUser({
  email: 'alyssa_p_hacker@instantdb.com',
});
const deletedUser = await db.auth.deleteUser({
  id: userId,
});
const deletedUser = await db.auth.deleteUser({
  refresh_token: userRefreshToken,
});
```

Note, this _only_ deletes the user record and any associated data with cascade on delete. If there's additional data you need to clean up you'll need to do it manually:

```javascript
const { goals, todos } = await db.query({
  goals: { $: { where: { creator: userId } } },
  todos: { $: { where: { creator: userId } } },
});

await db.transact([
  ...goals.map((item) => db.tx.goals[item.id].delete()),
  ...todos.map((item) => tx.todos[item.id].delete()),
]);
// Now we can delete the user
await db.auth.deleteUser({ id: userId });
```
