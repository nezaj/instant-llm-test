---
description: Guidelines for building InstantDB with React and Next.js
globs: **/*.{ts,tsx,js,jsx}
---

# What is InstantDB

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

# InstantDB Basic Initialization

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

# InstantDB Schema Modeling Guide

This guide explains how to effectively model your data using InstantDB's schema system. InstantDB provides a simple yet powerful way to define your data structure using code.

> **Important Note:** Namespaces that start with `$` (like `$users`) are reserved for system use. The `$users` namespace is special and managed by InstantDB's authentication system.

## Core Concepts

InstantDB's schema consists of three main building blocks:
- **Namespaces**: Collections of entities (similar to tables or collections)
- **Attributes**: Properties/fields of entities with defined types
- **Links**: Relationships between entities in different namespaces

## Setting Up Your Schema

### Creating a Schema File

First, create a `instant.schema.ts` file in your project:

```typescript
// instant.schema.ts
import { i } from '@instantdb/core';

const _schema = i.schema({
  entities: {
    // Define your namespaces here
  },
  links: {
    // Define relationships between namespaces here
  },
});

// This helps TypeScript provide better intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
```

## Defining Namespaces

Namespaces are collections of similar entities. They're equivalent to tables in relational databases.

```typescript
// ✅ Good: Defining namespaces
const _schema = i.schema({
  entities: {
    profiles: i.entity({
      // Attributes defined here
    }),
    posts: i.entity({
      // Attributes defined here
    }),
    comments: i.entity({
      // Attributes defined here
    }),
  },
});
```

❌ **Common mistake**: Creating namespaces that start with `$`
```typescript
// ❌ Bad: Don't create custom namespaces starting with $
const _schema = i.schema({
  entities: {
    $customNamespace: i.entity({
      // This is not allowed!
    }),
  },
});
```

### Namespace Restrictions

- Must be alphanumeric (can include underscores)
- Cannot contain spaces
- Must be unique
- Names starting with `$` are reserved for system namespaces

## Defining Attributes

Attributes are properties of entities within a namespace. They're similar to columns in a relational database.

```typescript
// ✅ Good: Defining attributes with types
const _schema = i.schema({
  entities: {
    posts: i.entity({
      title: i.string(),
      body: i.string(),
      viewCount: i.number(),
      isPublished: i.boolean(),
      publishedAt: i.date(),
      metadata: i.json(),
    }),
  },
});
```

### Available Attribute Types

| Type | Description | Example |
|------|-------------|---------|
| `i.string()` | Text values | `title: i.string()` |
| `i.number()` | Numeric values | `viewCount: i.number()` |
| `i.boolean()` | True/false values | `isPublished: i.boolean()` |
| `i.date()` | Date and time values | `publishedAt: i.date()` |
| `i.json()` | Complex nested objects | `metadata: i.json()` |
| `i.any()` | Untyped values | `miscData: i.any()` |

The `i.date()` type accepts:
- Numeric timestamps (milliseconds)
- ISO 8601 strings (e.g., result of `JSON.stringify(new Date())`)

## Adding Constraints and Performance Optimizations

### Unique Constraints

Mark attributes that should have unique values across all entities:

```typescript
// ✅ Good: Adding a unique constraint
const _schema = i.schema({
  entities: {
    posts: i.entity({
      slug: i.string().unique(), // No two posts can have the same slug
      title: i.string(),
    }),
  },
});
```

Unique attributes:
- Are automatically indexed for fast lookups
- Will reject new entities that would violate uniqueness

### Indexing for Performance

Add indexes to attributes you'll frequently search or filter by:

```typescript
// ✅ Good: Indexing attributes for faster queries
const _schema = i.schema({
  entities: {
    posts: i.entity({
      publishedAt: i.date().indexed(), // Makes date-based filtering faster
      category: i.string().indexed(),  // Makes category filtering faster
    }),
  },
});
```

❌ **Common mistake**: Not indexing frequently queried fields
```typescript
// ❌ Bad: Not indexing a field you'll query often
const _schema = i.schema({
  entities: {
    posts: i.entity({
      category: i.string(), // Not indexed, but frequently used in queries
    }),
  },
});

// Without an index, this query gets slower as your data grows
const query = { posts: { $: { where: { category: 'news' } } } };
```

## Defining Relationships with Links

Links connect entities from different namespaces. InstantDB defines relationships in both forward and reverse directions.

```typescript
// ✅ Good: Defining a link between posts and profiles
const _schema = i.schema({
  entities: {
    // ... namespaces defined here
  },
  links: {
    postAuthor: {
      forward: { on: 'posts', has: 'one', label: 'author' },
      reverse: { on: 'profiles', has: 'many', label: 'authoredPosts' },
    },
  },
});
```

This creates:
- `posts.author` → links to one profile
- `profiles.authoredPosts` → links to many posts

### Link Relationship Types

InstantDB supports four relationship types:

1. **One-to-One**: Each entity in namespace A links to exactly one entity in namespace B, and vice versa

```typescript
// ✅ Good: One-to-one relationship
profileUser: {
  forward: { on: 'profiles', has: 'one', label: '$user' },
  reverse: { on: '$users', has: 'one', label: 'profile' },
},
```

2. **One-to-Many**: Each entity in namespace A links to many entities in namespace B, but each entity in B links to only one entity in A

```typescript
// ✅ Good: One-to-many relationship
postAuthor: {
  forward: { on: 'posts', has: 'one', label: 'author' },
  reverse: { on: 'profiles', has: 'many', label: 'authoredPosts' },
},
```

3. **Many-to-One**: The reverse of one-to-many (just swap the directions)

```typescript
// ✅ Good: Many-to-one relationship
postAuthor: {
  forward: { on: 'profiles', has: 'many', label: 'authoredPosts' },
  reverse: { on: 'posts', has: 'one', label: 'author' },
},
```

4. **Many-to-Many**: Each entity in namespace A can link to many entities in namespace B, and vice versa

```typescript
// ✅ Good: Many-to-many relationship
postsTags: {
  forward: { on: 'posts', has: 'many', label: 'tags' },
  reverse: { on: 'tags', has: 'many', label: 'posts' },
},
```

### Link Naming Rules

- Link names must be unique
- Must be alphanumeric (can include underscores)
- Cannot contain spaces
- You can link entities to themselves
- You can link the same entities multiple times (with different link names)

❌ **Common mistake**: Reusing the same label for different links
```typescript
// ❌ Bad: Conflicting labels
const _schema = i.schema({
  links: {
    postAuthor: {
      forward: { on: 'posts', has: 'one', label: 'author' },
      reverse: { on: 'profiles', has: 'many', label: 'posts' }, // Creates 'posts' attr
    },
    postEditor: {
      forward: { on: 'posts', has: 'one', label: 'editor' },
      reverse: { on: 'profiles', has: 'many', label: 'posts' }, // Conflicts!
    },
  },
});
```

✅ **Correction**: Use unique labels for each relationship
```typescript
// ✅ Good: Unique labels for each relationship
const _schema = i.schema({
  links: {
    postAuthor: {
      forward: { on: 'posts', has: 'one', label: 'author' },
      reverse: { on: 'profiles', has: 'many', label: 'authoredPosts' }, // Unique
    },
    postEditor: {
      forward: { on: 'posts', has: 'one', label: 'editor' },
      reverse: { on: 'profiles', has: 'many', label: 'editedPosts' }, // Unique
    },
  },
});
```

### Working with System Namespaces

When linking to system namespaces like `$users`:

❌ **Common mistake**: Linking from a system namespace
```typescript
// ❌ Bad: System namespace in forward direction
profileUser: {
  forward: { on: '$users', has: 'one', label: 'profile' },
  reverse: { on: 'profiles', has: 'one', label: '$user' },
},
```

✅ **Correction**: Always link to system namespaces in the reverse direction
```typescript
// ✅ Good: System namespace in reverse direction
profileUser: {
  forward: { on: 'profiles', has: 'one', label: '$user' },
  reverse: { on: '$users', has: 'one', label: 'profile' },
},
```

## Cascade Delete

You can configure links to automatically delete dependent entities:

```typescript
// ✅ Good: Setting up cascade delete
const _schema = i.schema({
  links: {
    postAuthor: {
      forward: { on: 'posts', has: 'one', label: 'author', onDelete: 'cascade' },
      reverse: { on: 'profiles', has: 'many', label: 'authoredPosts' },
    },
  },
});
```

With this configuration, deleting a profile will also delete all posts authored by that profile.

## Complete Schema Example

Here's a complete schema for a blog application:

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
      bio: i.string(),
      createdAt: i.date().indexed(),
    }),
    posts: i.entity({
      title: i.string(),
      slug: i.string().unique().indexed(),
      body: i.string(),
      isPublished: i.boolean().indexed(),
      publishedAt: i.date().indexed(),
    }),
    comments: i.entity({
      body: i.string(),
      createdAt: i.date().indexed(),
    }),
    tags: i.entity({
      name: i.string().unique().indexed(),
    }),
  },
  links: {
    profileUser: {
      forward: { on: 'profiles', has: 'one', label: '$user' },
      reverse: { on: '$users', has: 'one', label: 'profile' },
    },
    postAuthor: {
      forward: { on: 'posts', has: 'one', label: 'author', onDelete: 'cascade' },
      reverse: { on: 'profiles', has: 'many', label: 'authoredPosts' },
    },
    commentPost: {
      forward: { on: 'comments', has: 'one', label: 'post', onDelete: 'cascade' },
      reverse: { on: 'posts', has: 'many', label: 'comments' },
    },
    commentAuthor: {
      forward: { on: 'comments', has: 'one', label: 'author', onDelete: 'cascade' },
      reverse: { on: 'profiles', has: 'many', label: 'authoredComments' },
    },
    postsTags: {
      forward: { on: 'posts', has: 'many', label: 'tags' },
      reverse: { on: 'tags', has: 'many', label: 'posts' },
    },
  },
});

// TypeScript helpers
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
```

## Publishing Your Schema

After defining your schema, you need to publish it to InstantDB using the CLI:

```bash
npx instant-cli@latest push
```

## Schema Modifications

To rename or delete attributes after creation:

1. Go to the [InstantDB Dashboard](https://instantdb.com/dash)
2. Navigate to "Explorer"
3. Select the namespace you want to modify
4. Click "Edit Schema"
5. Select the attribute you want to modify
6. Use the modal to rename, delete, or change indexing

## Best Practices

1. **Index wisely**: Add indexes to attributes you'll frequently query or filter by
2. **Use unique constraints**: For attributes that should be unique (usernames, slugs, etc.)
3. **Label links clearly**: Use descriptive names for link labels
4. **Consider cascade deletions**: Set `onDelete: 'cascade'` for dependent relationships
5. **Respect system namespaces**: Always link to `$users` in the reverse direction
6. **Use TypeScript**: Leverage InstantDB's TypeScript integration for better autocomplete and error checking

## TypeScript Integration

InstantDB provides excellent TypeScript integration. You can use utility types to get type safety:

```typescript
import { InstaQLEntity } from '@instantdb/react';
import { AppSchema } from './instant.schema';

// Type-safe entity from your schema
type Post = InstaQLEntity<AppSchema, 'posts'>;

// Type-safe entity with related data
type PostWithAuthor = InstaQLEntity<AppSchema, 'posts', { author: {} }>;

// Now you can use these types in your components
function PostEditor({ post }: { post: Post }) {
  // TypeScript knows all the properties of the post
  return <h1>{post.title}</h1>;
}
```

# InstantDB Permissions Guide

This guide explains how to use InstantDB's Rule Language to secure your application data and implement proper access controls.

## Core Concepts

InstantDB's permission system is based on a declarative rule language that lets you define who can see, create, update, and delete data. This rule language is:

- **Expressive**: Based on CEL (Common Expression Language)
- **Flexible**: Allows referencing relations and user properties
- **Code-First**: Can be defined in code or through the dashboard
- **Secure by Default**: When properly configured, ensures data is only accessible to authorized users

## Setting Up Permissions

### Code-Based Approach

The recommended way to manage permissions is by defining them in code:

```typescript
// ✅ Good: Define permissions in instant.perms.ts
import type { InstantRules } from '@instantdb/react';

const rules = {
  todos: {
    allow: {
      view: 'auth.id != null',          // Only authenticated users can view
      create: 'isOwner',                // Only owner can create
      update: 'isOwner',                // Only owner can update
      delete: 'isOwner',                // Only owner can delete
    },
    bind: ['isOwner', 'auth.id != null && auth.id == data.creatorId'],
  },
} satisfies InstantRules;

export default rules;
```

To set up permissions using code:

1. Generate an `instant.perms.ts` file:
   ```bash
   npx instant-cli@latest init
   ```

2. Edit the file with your permission rules

3. Push your changes to production:
   ```bash
   npx instant-cli@latest push perms
   ```

### Dashboard Approach

You can also manage permissions through the InstantDB dashboard:

1. Navigate to your app in the dashboard
2. Open the permissions editor
3. Define your rules using JSON format

## Basic Permission Rules

### Rule Structure

Each namespace can have rules for four operations:

- **view**: Controls who can read data (used during queries)
- **create**: Controls who can create new entities
- **update**: Controls who can modify existing entities
- **delete**: Controls who can remove entities

### Default Permissions

By default, all permissions are set to `true` (unrestricted access). If a rule is not explicitly defined, it defaults to allowing the operation.

```javascript
// ✅ Good: Explicitly defining all permissions
{
  "todos": {
    "allow": {
      "view": "true",
      "create": "true",
      "update": "true",
      "delete": "true"
    }
  }
}
```

This is equivalent to:

```javascript
// Same as above, with defaults taking effect
{
  "todos": {
    "allow": {
      "view": "true"
    }
  }
}
```

Or even:

```javascript
// Empty rules = all permissions allowed
{}
```

❌ **Common mistake**: Not setting any restrictions in production
```javascript
// ❌ Bad: No restrictions in a production app
{}
```

## Restricting Access

### Authentication-Based Rules

Limit operations to authenticated users:

```javascript
// ✅ Good: Require authentication for all operations
{
  "todos": {
    "allow": {
      "view": "auth.id != null",
      "create": "auth.id != null",
      "update": "auth.id != null",
      "delete": "auth.id != null"
    }
  }
}
```

### Ownership-Based Rules

Restrict operations to the creator of the data:

```javascript
// ✅ Good: Only allow owners to modify their data
{
  "todos": {
    "allow": {
      "view": "auth.id != null",                    // Anyone logged in can view
      "create": "auth.id != null",                  // Anyone logged in can create
      "update": "auth.id != null && auth.id == data.creatorId", // Only owner can update
      "delete": "auth.id != null && auth.id == data.creatorId"  // Only owner can delete
    }
  }
}
```

## Setting Default Permissions

You can set default rules at different levels:

### Namespace Default

Set default rules for all operations within a namespace:

```javascript
// ✅ Good: Deny all permissions by default, then explicitly allow some
{
  "todos": {
    "allow": {
      "$default": "false",       // Default deny all operations
      "view": "auth.id != null"  // But allow viewing for authenticated users
    }
  }
}
```

### Global Default

Set default rules for all namespaces:

```javascript
// ✅ Good: Secure by default with specific exceptions
{
  "$default": {
    "allow": {
      "view": "false",    // Default deny viewing for all namespaces
      "create": "false",  // Default deny creation for all namespaces
      "update": "false",  // Default deny updates for all namespaces
      "delete": "false"   // Default deny deletion for all namespaces
    }
  },
  "publicPosts": {
    "allow": {
      "view": "true"      // Allow viewing public posts for everyone
    }
  }
}
```

### Ultimate Default

The most restrictive configuration:

```javascript
// ✅ Good: Maximum security by default
{
  "$default": {
    "allow": {
      "$default": "false"  // Default deny all operations on all namespaces
    }
  }
}
```

## Advanced Permission Features

### Using Bind for Reusable Logic

The `bind` feature lets you create aliases for complex permission rules:

```javascript
// ✅ Good: Using bind for reusable permission logic
{
  "todos": {
    "allow": {
      "create": "isOwner || isAdmin",
      "update": "isOwner || isAdmin",
      "delete": "isOwner || isAdmin"
    },
    "bind": [
      "isOwner", "auth.id != null && auth.id == data.creatorId",
      "isAdmin", "auth.email in ['admin@example.com', 'support@example.com']"
    ]
  }
}
```

This makes your permission rules more readable and maintainable.

### Referencing Related Data

Use `ref` to check permissions based on related entities:

```javascript
// ✅ Good: Permission based on related data
{
  "comments": {
    "allow": {
      "update": "auth.id in data.ref('post.author.id')"  // Allow post authors to update comments
    }
  }
}
```

### Checking Auth User Relations

You can also reference the authenticated user's relations:

```javascript
// ✅ Good: Checking user roles
{
  "adminActions": {
    "allow": {
      "create": "'admin' in auth.ref('$user.role.type')"  // Allow admins only
    }
  }
}
```

### Comparing Old and New Data

For update operations, you can compare the existing (`data`) and updated (`newData`) values:

```javascript
// ✅ Good: Conditionally allowing updates based on changes
{
  "posts": {
    "allow": {
      "update": "auth.id == data.authorId && newData.isPublished == data.isPublished"
      // Authors can update their posts, but can't change the published status
    }
  }
}
```

## Special Permission: Attrs

The `attrs` permission controls the ability to create new attribute types on the fly:

```javascript
// ✅ Good: Prevent schema expansion in production
{
  "attrs": {
    "allow": {
      "create": "false"  // Prevent creating new attribute types
    }
  }
}
```

This is particularly important in production to lock down your schema.

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

### Security Patterns

#### Public Read, Authenticated Write

```javascript
// ✅ Good: Public read, authenticated write
{
  "posts": {
    "allow": {
      "view": "true",                  // Anyone can view
      "create": "auth.id != null",     // Only authenticated users can create
      "update": "auth.id == data.authorId", // Only author can update
      "delete": "auth.id == data.authorId"  // Only author can delete
    }
  }
}
```

#### Team-Based Access

```javascript
// ✅ Good: Team-based access control
{
  "projects": {
    "allow": {
      "view": "auth.id in data.ref('team.members.id')", // Team members can view
      "update": "auth.id in data.ref('team.admins.id')" // Team admins can update
    }
  }
}
```

#### Role-Based Access

```javascript
// ✅ Good: Role-based access control
{
  "systemSettings": {
    "allow": {
      "view": "auth.ref('$user.role.level') >= 1",  // Basic role can view
      "update": "auth.ref('$user.role.level') >= 3" // High-level role can update
    }
  }
}
```

## Common Permission Examples

### Blog Platform

```javascript
// ✅ Good: Blog platform permissions in instant.perms.ts
import type { InstantRules } from '@instantdb/react';

{
  "posts": {
    "allow": {
      "view": "true || data.isPublished || auth.id == data.authorId", // Public can see published posts, author can see drafts
      "create": "auth.id != null",                                    // Logged-in users can create
      "update": "auth.id == data.authorId",                           // Author can update
      "delete": "auth.id == data.authorId || isAdmin"                 // Author or admin can delete
    },
    "bind": [
      "isAdmin", "auth.ref('$user.role') == 'admin'"
    ]
  },
  "comments": {
    "allow": {
      "view": "true",                        // Everyone can see comments
      "create": "auth.id != null",           // Logged-in users can comment
      "update": "auth.id == data.authorId",  // Author can edit their comment
      "delete": "auth.id == data.authorId || auth.id == data.ref('post.authorId') || isAdmin" // Comment author, post author, or admin can delete
    }
  }
} satisfies InstantRules;

export default rules;
```

### Todo App

```javascript
// ✅ Good: Todo app permissions in instant.perms.ts
import type { InstantRules } from '@instantdb/react';

const rules = {
  "todos": {
    "allow": {
      "view": "auth.id == data.ownerId || auth.id in data.ref('sharedWith.id')", // Owner or shared-with can view
      "create": "auth.id != null",                                               // Any logged-in user can create
      "update": "auth.id == data.ownerId || (auth.id in data.ref('sharedWith.id') && !newData.hasOwnProperty('ownerId'))", // Owner can do anything, shared users can't change ownership
      "delete": "auth.id == data.ownerId"                                        // Only owner can delete
    }
  },
  "lists": {
    "allow": {
      "view": "auth.id == data.ownerId || auth.id in data.ref('collaborators.id')", // Owner or collaborator can view
      "create": "auth.id != null",                                                 // Any logged-in user can create
      "update": "auth.id == data.ownerId",                                         // Only owner can update
      "delete": "auth.id == data.ownerId"                                          // Only owner can delete
    }
  }
} satisfies InstantRules;

export default rules;
```

# InstaML: InstantDB Transaction API Guide

InstaML is InstantDB's mutation language for creating, updating, and managing your data. It uses a Firebase-inspired syntax that is intuitive and powerful.

> **Important Note:** In InstantDB, `$users` is a special system table. We don't directly update attributes on this table - we typically only create links and unlinks to it. The examples in this guide use `profiles`, `projects`, and `todos` as the main tables.

## Core Concepts

- **Transactions**: Groups of operations that execute atomically
- **Transaction Chunks**: Individual operations within a transaction
- **Proxy Syntax**: The `db.tx` object that creates transaction chunks

## Basic Structure

Every transaction follows this pattern:
```javascript
db.transact(db.tx.NAMESPACE[ENTITY_ID].ACTION(DATA));
```

Where:
- `NAMESPACE` is your collection (like "todos" or "users")
- `ENTITY_ID` is the unique ID of an entity
- `ACTION` is the operation (update, merge, delete, link, unlink)
- `DATA` is the information needed for the action

## Creating Entities

### Creating New Entities

Use `update` (not `create`) to create new entities:

```javascript
// ✅ Good: Create a new todo with a random ID
const todoId = id();
db.transact(db.tx.todos[todoId].update({
  text: "Buy groceries",
  done: false,
  createdAt: Date.now()
}));

// ✅ Good: Create a new entity with a generated ID inline
db.transact(db.tx.todos[id()].update({
  text: "Walk the dog",
  done: false
}));
```

❌ **Common mistake**: Using a non-existent `create` method
```javascript
// ❌ Bad: This will throw an error!
db.transact(db.tx.todos[id()].create({ text: "Buy groceries" }));
```

### Storing Different Data Types

You can store various data types in your entities:

```javascript
// ✅ Good: Store different types of data
db.transact(db.tx.todos[id()].update({
  text: "Complex todo",          // String
  priority: 1,                   // Number
  completed: false,              // Boolean
  tags: ["work", "important"],   // Array
  metadata: {                    // Object
    assignee: "user-123",
    dueDate: "2025-01-15"
  }
}));
```

## Updating Entities

### Basic Updates

Update existing entities with new values:

```javascript
// ✅ Good: Update a specific field
db.transact(db.tx.todos[todoId].update({ done: true }));

// ✅ Good: When linking to $users, use the special $users namespace
// This is an example of how to connect a todo to the current authenticated user
db.transact(db.tx.todos[todoId].link({ $users: auth.userId }));
```

This will only change the specified field(s), leaving other fields untouched.

### Deep Merging Objects

Use `merge` for updating nested objects without overwriting unspecified fields:

```javascript
// ✅ Good: Update nested values without losing other data
db.transact(db.tx.profiles[userId].merge({
  preferences: {
    theme: "dark"
  }
}));
```

❌ **Common mistake**: Using `update` for nested objects
```javascript
// ❌ Bad: This will overwrite the entire preferences object
db.transact(db.tx.profiles[userId].update({
  preferences: { theme: "dark" }  // Any other preferences will be lost
}));
```

### Removing Object Keys

Remove keys from nested objects by setting them to `null`:

```javascript
// ✅ Good: Remove a nested key
db.transact(db.tx.profiles[userId].merge({
  preferences: {
    notifications: null  // This will remove the notifications key
  }
}));
```

## Deleting Entities

Delete entities completely:

```javascript
// ✅ Good: Delete a specific entity
db.transact(db.tx.todos[todoId].delete());
```

Delete multiple entities:

```javascript
// ✅ Good: Delete multiple entities
db.transact([
  db.tx.todos[todoId1].delete(),
  db.tx.todos[todoId2].delete(),
  db.tx.todos[todoId3].delete()
]);
```

Delete all entities that match a condition:

```javascript
// ✅ Good: Delete all completed todos
const { data } = db.useQuery({ todos: {} });
const completedTodos = data.todos.filter(todo => todo.done);

db.transact(
  completedTodos.map(todo => db.tx.todos[todo.id].delete())
);
```

## Creating Relationships

### Linking Entities

Create relationships between entities:

```javascript
// ✅ Good: Link a todo to a project
db.transact(db.tx.projects[projectId].link({ todos: todoId }));
```

Link multiple entities at once:

```javascript
// ✅ Good: Link multiple todos to a project
db.transact(db.tx.projects[projectId].link({
  todos: [todoId1, todoId2, todoId3]
}));
```

### Linking in Both Directions

Links are bidirectional - you can query from either side:

```javascript
// These do the same thing:
db.transact(db.tx.projects[projectId].link({ todos: todoId }));
db.transact(db.tx.todos[todoId].link({ projects: projectId }));
```

### Removing Links

Remove relationships with `unlink`:

```javascript
// ✅ Good: Unlink a todo from a project
db.transact(db.tx.projects[projectId].unlink({ todos: todoId }));

// Unlink multiple todos at once
db.transact(db.tx.projects[projectId].unlink({
  todos: [todoId1, todoId2, todoId3]
}));
```

## Advanced Features

### Looking Up by Unique Attributes

Use `lookup` to reference entities by unique fields instead of IDs:

```javascript
// ✅ Good: Update a profile by email
import { lookup } from '@instantdb/react';

db.transact(
  db.tx.profiles[lookup('email', 'user@example.com')].update({
    name: 'Updated Name'
  })
);
```

❌ **Common mistake**: Using lookup on non-unique fields
```javascript
// ❌ Bad: Using lookup on a non-unique field may update the wrong entity
db.transact(
  db.tx.profiles[lookup('role', 'admin')].update({
    isSuperAdmin: true
  })
);
```

### Lookups in Relationships

Use `lookup` on both sides of a relationship:

```javascript
// ✅ Good: Link entities using lookups
db.transact(
  db.tx.profiles[lookup('email', 'user@example.com')].link({
    projects: lookup('name', 'Project Alpha')
  })
);
```

### Combining Multiple Operations

Chain operations together:

```javascript
// ✅ Good: Update and link in one transaction
db.transact(
  db.tx.todos[id()]
    .update({ text: "New todo", done: false })
    .link({ projects: projectId })
);
```

Group multiple operations in one transaction:

```javascript
// ✅ Good: Multiple operations in one atomic transaction
db.transact([
  db.tx.todos[todoId].update({ done: true }),
  db.tx.projects[projectId].update({ completedCount: 10 }),
  db.tx.stats[statsId].merge({ lastCompletedTodo: todoId })
]);
```

## Performance Optimization

### Batching Large Transactions

Break large operations into batches:

```javascript
// ✅ Good: Batch large operations
const batchSize = 100;
const createManyTodos = async (count) => {
  for (let i = 0; i < count; i += batchSize) {
    const batch = [];
    
    // Create up to batchSize transactions
    for (let j = 0; j < batchSize && i + j < count; j++) {
      batch.push(
        db.tx.todos[id()].update({
          text: `Todo ${i + j}`,
          done: false
        })
      );
    }
    
    // Execute this batch
    await db.transact(batch);
  }
};

// Create 1000 todos in batches
createManyTodos(1000);
```

## Common Patterns

### Create-or-Update Pattern

Easily implement upsert functionality:

```javascript
// ✅ Good: Create if doesn't exist, update if it does
db.transact(
  db.tx.profiles[lookup('email', 'user@example.com')].update({
    lastLoginAt: Date.now()
  })
);
```

### Toggle Boolean Flag

Efficiently toggle boolean values:

```javascript
// ✅ Good: Toggle a todo's completion status
const toggleTodo = (todo) => {
  db.transact(
    db.tx.todos[todo.id].update({ done: !todo.done })
  );
};
```

### Dependent Transactions

Wait for one transaction to complete before starting another:

```javascript
// ✅ Good: Sequential dependent transactions
const createProjectAndTasks = async (projectData) => {
  // First create the project
  const result = await db.transact(
    db.tx.projects[id()].update(projectData)
  );
  
  // Then create tasks linked to the project
  const projectId = result.ids.projects[0]; // Get ID from the result
  await db.transact(
    db.tx.tasks[id()].update({
      title: "Initial planning",
      projectId,
      createdAt: Date.now()
    })
  );
};
```

## Debugging Tips

1. **Transaction Results**: Transactions return information about created entities

```javascript
const result = await db.transact(db.tx.todos[id()].update({ text: "Debug me" }));
console.log(result.ids); // See the IDs of created entities
```

2. **Error Handling**: Wrap transactions in try/catch

```javascript
try {
  await db.transact(/* ... */);
} catch (error) {
  console.error("Transaction failed:", error);
  // Handle the error appropriately
}
```

## Best Practices

1. **Use `merge` for nested objects** to avoid overwriting unspecified fields
2. **Keep transactions small and focused** for better performance
3. **Batch large operations** to avoid timeouts
4. **Use `lookup` with caution** on fields that are truly unique
5. **Remember that all operations in a transaction are atomic** - they all succeed or all fail
6. **Treat `$users` as a special system table** - only link/unlink to it, don't update it directly

## Comparison with SQL

| SQL Operation | InstantDB Equivalent |
|---------------|----------------------|
| `INSERT INTO todos (text, done) VALUES ('Buy milk', false)` | `db.transact(db.tx.todos[id()].update({ text: 'Buy milk', done: false }))` |
| `UPDATE todos SET done = true WHERE id = '123'` | `db.transact(db.tx.todos['123'].update({ done: true }))` |
| `DELETE FROM todos WHERE id = '123'` | `db.transact(db.tx.todos['123'].delete())` |
| Complex JOIN operation | `db.transact(db.tx.projects[projectId].link({ todos: todoId }))` |

InstantDB's transaction API significantly simplifies these operations compared to SQL, especially for relationships.

# InstaQL: InstantDB Query Language Guide

InstaQL is InstantDB's declarative query language. It offers GraphQL-like functionality but using plain JavaScript objects and arrays without requiring a build step.

## Core Concepts

InstaQL uses a simple yet powerful syntax built on JavaScript objects:
- **Namespaces**: Collections of related entities (similar to tables)
- **Queries**: JavaScript objects describing what data you want
- **Associations**: Relationships between entities in different namespaces

## Basic Queries

### Fetching an Entire Namespace

To fetch all entities from a namespace, use an empty object:

```javascript
// ✅ Good: Fetch all goals
const query = { goals: {} };
const { data } = db.useQuery(query);

// Result:
// {
//   "goals": [
//     { "id": "goal-1", "title": "Get fit!" },
//     { "id": "goal-2", "title": "Get promoted!" }
//   ]
// }
```

❌ **Common mistake**: Using arrays instead of objects
```javascript
// ❌ Bad: This will not work
const query = { goals: [] };
```

### Fetching Multiple Namespaces

Query multiple namespaces in one go:

```javascript
// ✅ Good: Fetch both goals and todos
const query = { goals: {}, todos: {} };
const { data } = db.useQuery(query);

// Result:
// {
//   "goals": [...],
//   "todos": [...]
// }
```

❌ **Common mistake**: Nesting namespaces incorrectly
```javascript
// ❌ Bad: This will not fetch both namespaces correctly
const query = { goals: { todos: [] } };
```

## Filtering

### Fetching by ID

Use `where` to filter entities:

```javascript
// ✅ Good: Fetch a specific goal by ID
const query = {
  goals: {
    $: {
      where: {
        id: 'goal-1',
      },
    },
  },
};
```

❌ **Common mistake**: Placing filter at wrong level
```javascript
// ❌ Bad: Filter must be inside $
const query = {
  goals: {
    where: { id: 'goal-1' },
  },
};
```

### Multiple Conditions

Filter with multiple conditions (AND logic):

```javascript
// ✅ Good: Fetch completed todos with high priority
const query = {
  todos: {
    $: {
      where: {
        completed: true,
        priority: 'high',
      },
    },
  },
};
```

## Associations

### Fetching Related Entities

Get entities and their related entities:

```javascript
// ✅ Good: Fetch goals with their related todos
const query = {
  goals: {
    todos: {},
  },
};

// Result:
// {
//   "goals": [
//     {
//       "id": "goal-1",
//       "title": "Get fit!",
//       "todos": [
//         { "id": "todo-1", "title": "Go running" },
//         { "id": "todo-2", "title": "Eat healthy" }
//       ]
//     },
//     ...
//   ]
// }
```

❌ **Common mistake**: Using arrays for associations
```javascript
// ❌ Bad: Associations must be objects, not arrays
const query = {
  goals: {
    todos: [],
  },
};
```

### Inverse Associations

Query in the reverse direction:

```javascript
// ✅ Good: Fetch todos with their related goals
const query = {
  todos: {
    goals: {},
  },
};
```

### Filtering By Associations

Filter entities based on associated data:

```javascript
// ✅ Good: Find goals that have todos with a specific title
const query = {
  goals: {
    $: {
      where: {
        'todos.title': 'Go running',
      },
    },
    todos: {},
  },
};
```

❌ **Common mistake**: Incorrect association path
```javascript
// ❌ Bad: Incorrect association path
const query = {
  goals: {
    $: {
      where: {
        todos: { title: 'Go running' }, // Wrong: use dot notation instead
      },
    },
  },
};
```

### Filtering Associations

Filter the associated entities that are returned:

```javascript
// ✅ Good: Get goals with only their completed todos
const query = {
  goals: {
    todos: {
      $: {
        where: {
          completed: true,
        },
      },
    },
  },
};
```

## Advanced Filtering

### Logical Operators

#### AND Operator

Combine multiple conditions that must all be true:

```javascript
// ✅ Good: Find goals with todos that are both high priority AND due soon
const query = {
  goals: {
    $: {
      where: {
        and: [
          { 'todos.priority': 'high' },
          { 'todos.dueDate': { $lt: tomorrow } },
        ],
      },
    },
  },
};
```

#### OR Operator

Match any of the given conditions:

```javascript
// ✅ Good: Find todos that are either high priority OR due soon
const query = {
  todos: {
    $: {
      where: {
        or: [
          { priority: 'high' },
          { dueDate: { $lt: tomorrow } },
        ],
      },
    },
  },
};
```

❌ **Common mistake**: Mixing operators incorrectly
```javascript
// ❌ Bad: Incorrect nesting of operators
const query = {
  todos: {
    $: {
      where: {
        or: { priority: 'high', dueDate: { $lt: tomorrow } }, // Wrong: 'or' takes an array
      },
    },
  },
};
```

### Comparison Operators

For indexed fields with checked types:

```javascript
// ✅ Good: Find todos that take more than 2 hours
const query = {
  todos: {
    $: {
      where: {
        timeEstimate: { $gt: 2 },
      },
    },
  },
};

// Available operators: $gt, $lt, $gte, $lte
```

❌ **Common mistake**: Using comparison on non-indexed fields
```javascript
// ❌ Bad: Field must be indexed for comparison operators
const query = {
  todos: {
    $: {
      where: {
        nonIndexedField: { $gt: 5 }, // Will fail if field isn't indexed
      },
    },
  },
};
```

### IN Operator

Match any value in a list:

```javascript
// ✅ Good: Find todos with specific priorities
const query = {
  todos: {
    $: {
      where: {
        priority: { $in: ['high', 'critical'] },
      },
    },
  },
};
```

### NOT Operator

Match entities where a field doesn't equal a value:

```javascript
// ✅ Good: Find todos not assigned to "work" location
const query = {
  todos: {
    $: {
      where: {
        location: { $not: 'work' },
      },
    },
  },
};
```

Note: This includes entities where the field is null or undefined.

### NULL Check

Filter by null/undefined status:

```javascript
// ✅ Good: Find todos with no assigned location
const query = {
  todos: {
    $: {
      where: {
        location: { $isNull: true },
      },
    },
  },
};

// ✅ Good: Find todos that have an assigned location
const query = {
  todos: {
    $: {
      where: {
        location: { $isNull: false },
      },
    },
  },
};
```

### String Pattern Matching

For indexed string fields:

```javascript
// ✅ Good: Find goals that start with "Get"
const query = {
  goals: {
    $: {
      where: {
        title: { $like: 'Get%' }, // Case-sensitive
      },
    },
  },
};

// For case-insensitive matching:
const query = {
  goals: {
    $: {
      where: {
        title: { $ilike: 'get%' }, // Case-insensitive
      },
    },
  },
};
```

Pattern options:
- `'prefix%'` - Starts with "prefix"
- `'%suffix'` - Ends with "suffix"
- `'%substring%'` - Contains "substring"

## Pagination and Ordering

### Limit and Offset

For simple pagination:

```javascript
// ✅ Good: Get first 10 todos
const query = {
  todos: {
    $: { 
      limit: 10 
    },
  },
};

// ✅ Good: Get next 10 todos
const query = {
  todos: {
    $: { 
      limit: 10,
      offset: 10 
    },
  },
};
```

❌ **Common mistake**: Using on nested namespaces
```javascript
// ❌ Bad: Limit only works on top-level namespaces
const query = {
  goals: {
    todos: {
      $: { limit: 5 }, // This won't work
    },
  },
};
```

### Cursor-Based Pagination

For more efficient pagination:

```javascript
// ✅ Good: Get first page
const query = {
  todos: {
    $: { 
      first: 10 
    },
  },
};

// ✅ Good: Get next page using cursor
const query = {
  todos: {
    $: { 
      first: 10,
      after: pageInfo.todos.endCursor 
    },
  },
};

// ✅ Good: Get previous page
const query = {
  todos: {
    $: { 
      last: 10,
      before: pageInfo.todos.startCursor 
    },
  },
};
```

❌ **Common mistake**: Using on nested namespaces
```javascript
// ❌ Bad: Cursor pagination only works on top-level namespaces
const query = {
  goals: {
    todos: {
      $: {
        first: 10,
        after: pageInfo.todos.endCursor,
      },
    },
  },
};
```

### Ordering

Change the sort order (default is by creation time):

```javascript
// ✅ Good: Get todos sorted by dueDate
const query = {
  todos: {
    $: {
      order: {
        dueDate: 'asc', // or 'desc'
      },
    },
  },
};

// ✅ Good: Sort by creation time in descending order
const query = {
  todos: {
    $: {
      order: {
        serverCreatedAt: 'desc',
      },
    },
  },
};
```

❌ **Common mistake**: Ordering non-indexed fields
```javascript
// ❌ Bad: Field must be indexed for ordering
const query = {
  todos: {
    $: {
      order: {
        nonIndexedField: 'desc', // Will fail if field isn't indexed
      },
    },
  },
};
```

## Field Selection

Select specific fields to optimize performance:

```javascript
// ✅ Good: Only fetch title and status fields
const query = {
  todos: {
    $: {
      fields: ['title', 'status'],
    },
  },
};

// Result will include the selected fields plus 'id' always:
// {
//   "todos": [
//     { "id": "todo-1", "title": "Go running", "status": "completed" },
//     ...
//   ]
// }
```

This works with nested associations too:

```javascript
// ✅ Good: Select different fields at different levels
const query = {
  goals: {
    $: {
      fields: ['title'],
    },
    todos: {
      $: {
        fields: ['status'],
      },
    },
  },
};
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


## Combining Features

You can combine these features to create powerful queries:

```javascript
// ✅ Good: Complex query combining multiple features
const query = {
  goals: {
    $: {
      where: {
        or: [
          { status: 'active' },
          { 'todos.priority': 'high' },
        ],
      },
      limit: 5,
      order: { serverCreatedAt: 'desc' },
      fields: ['title', 'description'],
    },
    todos: {
      $: {
        where: {
          completed: false,
          dueDate: { $lt: nextWeek },
        },
        fields: ['title', 'dueDate'],
      },
    },
  },
};
```

## Best Practices

1. **Index fields** that you'll filter, sort, or use in comparisons
2. **Use field selection** to minimize data transfer and re-renders
3. **Defer queries** when dependent data isn't ready
4. **Avoid deep nesting** of associations when possible
5. **Be careful with queries** that might return large result sets

## Troubleshooting

Common errors:

1. **"Field must be indexed"**: Add an index to the field from the Explorer or schema
2. **"Invalid operator"**: Check operator syntax and spelling
3. **"Invalid query structure"**: Verify your query structure, especially $ placement

Remember that the query structure is:
```javascript
{
  namespace: {
    $: { /* options for this namespace */ },
    relatedNamespace: {
      $: { /* options for this related namespace */ },
    },
  },
}
```

# InstantDB Server-Side Development Guide

This guide explains how to use InstantDB in server-side environments for running background tasks, scripts, custom authentication flows, and sensitive application logic that shouldn't run in the browser.

## Getting Started with the Admin SDK

For server-side operations, InstantDB provides a specialized package called `@instantdb/admin`. This package has similar functionality to the client SDK but is designed specifically for secure server environments.

> **Important Security Note:** Never use the client SDK (`@instantdb/react`) on the server, and never expose your admin token in client-side code.

### Installation

First, install the admin SDK:

```bash
npm install @instantdb/admin
```

## Initializing the Admin SDK

### Basic Initialization

```javascript
// ✅ Good: Proper server-side initialization
import { init, id } from '@instantdb/admin';

const db = init({
  appId: process.env.INSTANT_APP_ID,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
});
```

❌ **Common mistake**: Using client SDK on the server
```javascript
// ❌ Bad: Don't use the React SDK on the server
import { init } from '@instantdb/react'; // Wrong package!

const db = init({
  appId: process.env.INSTANT_APP_ID,
});
```

❌ **Common mistake**: Exposing admin token in client code
```javascript
// ❌ Bad: Never expose your admin token in client code
const db = init({
  appId: 'app-123',
  adminToken: 'admin-token-abc', // Hardcoded token = security risk!
});
```

### With TypeScript Schema

For better type safety, include your schema:

```javascript
// ✅ Good: Using schema for type safety
import { init, id } from '@instantdb/admin';
import schema from '../instant.schema'; // Your schema file

const db = init({
  appId: process.env.INSTANT_APP_ID,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
  schema, // Add your schema here
});
```

## Reading Data from the Server

Unlike the client SDK which uses reactive hooks, the admin SDK uses simple async functions.

### Basic Querying

```javascript
// ✅ Good: Server-side querying
const fetchTodos = async () => {
  try {
    const data = await db.query({ todos: {} });
    const { todos } = data;
    console.log(`Found ${todos.length} todos`);
    return todos;
  } catch (error) {
    console.error('Error fetching todos:', error);
    throw error;
  }
};
```

### Complex Queries

The query syntax is the same as in the client SDK:

```javascript
// ✅ Good: Complex server-side query
const fetchUserData = async (userId) => {
  try {
    const data = await db.query({
      profiles: {
        $: {
          where: { 
            id: userId 
          },
        },
        authoredPosts: {
          comments: {}
        },
      },
    });
    
    return data.profiles[0];
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};
```

❌ **Common mistake**: Using client-side syntax
```javascript
// ❌ Bad: Don't use useQuery on the server
const { data, isLoading } = db.useQuery({ todos: {} }); // Wrong approach!
```

## Writing Data from the Server

The transaction API is functionally the same as the client SDK but is asynchronous.

### Basic Transactions

```javascript
// ✅ Good: Server-side transaction
const createTodo = async (title, dueDate) => {
  try {
    const result = await db.transact(
      db.tx.todos[id()].update({
        title,
        dueDate,
        createdAt: new Date().toISOString(),
        completed: false,
      })
    );
    
    console.log('Created todo with transaction ID:', result['tx-id']);
    return result;
  } catch (error) {
    console.error('Error creating todo:', error);
    throw error;
  }
};
```

### Batch Operations

```javascript
// ✅ Good: Batch server-side operations
const importTodos = async (todoItems) => {
  try {
    const transactions = todoItems.map(item => 
      db.tx.todos[id()].update({
        title: item.title,
        completed: item.completed || false,
        createdAt: new Date().toISOString(),
      })
    );
    
    const result = await db.transact(transactions);
    return result;
  } catch (error) {
    console.error('Error importing todos:', error);
    throw error;
  }
};
```

### Handling Large Batches

For very large batch operations, split them into smaller chunks:

```javascript
// ✅ Good: Processing large datasets in chunks
const importLargeDataset = async (items) => {
  const batchSize = 100;
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const transactions = batch.map(item => 
      db.tx.todos[id()].update({
        title: item.title,
        // other fields...
      })
    );
    
    try {
      const result = await db.transact(transactions);
      results.push(result);
      console.log(`Processed batch ${i / batchSize + 1}`);
    } catch (error) {
      console.error(`Error processing batch ${i / batchSize + 1}:`, error);
      // Handle error (retry, skip, or throw)
    }
  }
  
  return results;
};
```

## User Authentication and Permission Management

### Impersonating Users

When you need to operate on behalf of a specific user (respecting their permissions):

```javascript
// ✅ Good: Impersonating a user by email
const getUserData = async (userEmail) => {
  const userDb = db.asUser({ email: userEmail });
  return await userDb.query({ todos: {} });
};

// ✅ Good: Impersonating a user with a token
const getUserDataWithToken = async (userToken) => {
  const userDb = db.asUser({ token: userToken });
  return await userDb.query({ todos: {} });
};

// ✅ Good: Operating as a guest
const getPublicData = async () => {
  const guestDb = db.asUser({ guest: true });
  return await guestDb.query({ publicPosts: {} });
};
```

❌ **Common mistake**: Not handling errors when impersonating
```javascript
// ❌ Bad: Missing error handling
const getUserData = async (userEmail) => {
  // If userEmail doesn't exist, this will fail silently
  const userDb = db.asUser({ email: userEmail });
  return await userDb.query({ todos: {} });
};
```

### User Management

You can retrieve user information:

```javascript
// ✅ Good: Retrieving a user by email
const getUserByEmail = async (email) => {
  try {
    const user = await db.auth.getUser({ email });
    return user;
  } catch (error) {
    console.error(`User with email ${email} not found:`, error);
    return null;
  }
};

// ✅ Good: Retrieving a user by ID
const getUserById = async (userId) => {
  try {
    const user = await db.auth.getUser({ id: userId });
    return user;
  } catch (error) {
    console.error(`User with ID ${userId} not found:`, error);
    return null;
  }
};

// ✅ Good: Retrieving a user by refresh token
const getUserByToken = async (refreshToken) => {
  try {
    const user = await db.auth.getUser({ refresh_token: refreshToken });
    return user;
  } catch (error) {
    console.error('Invalid refresh token:', error);
    return null;
  }
};
```

### Deleting Users

You can delete users and their associated data:

```javascript
// ✅ Good: Deleting a user with cleanup
const deleteUserAndData = async (userId) => {
  try {
    // First, fetch user-related data
    const { posts, comments } = await db.query({
      posts: { $: { where: { 'author.$user.id': userId } } },
      comments: { $: { where: { 'author.$user.id': userId } } },
    });
    
    // Delete the related data
    await db.transact([
      ...posts.map(post => db.tx.posts[post.id].delete()),
      ...comments.map(comment => db.tx.comments[comment.id].delete()),
    ]);
    
    // Finally, delete the user
    const deletedUser = await db.auth.deleteUser({ id: userId });
    console.log(`User ${deletedUser.email} successfully deleted`);
    return deletedUser;
  } catch (error) {
    console.error(`Failed to delete user ${userId}:`, error);
    throw error;
  }
};
```

❌ **Common mistake**: Not cleaning up associated data
```javascript
// ❌ Bad: Deleting user without handling their data
const deleteUser = async (userId) => {
  // This will leave orphaned data if cascade delete isn't configured
  return await db.auth.deleteUser({ id: userId });
};
```

## Advanced Authentication Features

### Custom Authentication Flows

With the Admin SDK, you can create fully customized authentication flows. This is a two-part process involving both your backend and frontend.

#### Backend: Creating Authentication Tokens

```javascript
// ✅ Good: Custom authentication endpoint
import express from 'express';
import { init } from '@instantdb/admin';

const app = express();
app.use(express.json());

const db = init({
  appId: process.env.INSTANT_APP_ID,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
});

app.post('/api/sign-in', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Verify credentials against your own database or auth system
    const isValid = await verifyCredentials(email, password);
    
    if (!isValid) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }
    
    // Generate an InstantDB token
    const token = await db.auth.createToken(email);
    
    // Return the token to the client
    return res.status(200).json({ token });
  } catch (error) {
    console.error('Sign-in error:', error);
    return res.status(500).json({
      error: 'Authentication failed'
    });
  }
});
```

> **Note:** If a user with the provided email doesn't exist, `auth.createToken` will automatically create a new user record.

#### Frontend: Using the Token

```javascript
// ✅ Good: Frontend implementation with custom auth
import { useState } from 'react';
import { init } from '@instantdb/react';

const db = init({ 
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID 
});

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Call your custom authentication endpoint
      const response = await fetch('/api/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      // Use the token to sign in with InstantDB
      await db.auth.signInWithToken(data.token);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleLogin}>
      {/* Form fields */}
    </form>
  );
}
```

### Magic Code Authentication

If you want to use your own email provider for magic code authentication:

```javascript
// ✅ Good: Custom magic code endpoint
app.post('/api/send-magic-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Generate a magic code through InstantDB
    const { code } = await db.auth.generateMagicCode(email);
    
    // Send the code using your own email service
    await sendEmail({
      to: email,
      subject: 'Your login code',
      body: `Your verification code is: ${code}`
    });
    
    return res.status(200).json({ 
      message: 'Magic code sent successfully' 
    });
  } catch (error) {
    console.error('Error generating magic code:', error);
    return res.status(500).json({ 
      error: 'Failed to send magic code' 
    });
  }
});
```

### Sign Out Users

You can force a user to sign out by invalidating their tokens:

```javascript
// ✅ Good: Sign out a user from the server
const signOutUser = async (email) => {
  try {
    await db.auth.signOut(email);
    console.log(`Successfully signed out ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to sign out ${email}:`, error);
    return false;
  }
};
```

### Creating Authenticated Endpoints

You can verify user tokens in your custom API endpoints:

```javascript
// ✅ Good: Authenticated API endpoint
app.post('/api/protected-resource', async (req, res) => {
  try {
    // Get the token from request headers
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify the token
    const user = await db.auth.verifyToken(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Token is valid, proceed with the authenticated request
    // The user object contains the user's information
    console.log(`Request from verified user: ${user.email}`);
    
    // Process the authenticated request
    const { data } = await db.asUser({ email: user.email }).query({
      profiles: { $: { where: { '$user.id': user.id } } }
    });
    
    return res.status(200).json({
      message: 'Authentication successful',
      profile: data.profiles[0]
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});
```

#### Frontend Implementation

```javascript
// ✅ Good: Frontend calling an authenticated endpoint
const callProtectedApi = async () => {
  const { user } = db.useAuth();
  
  if (!user) {
    console.error('User not authenticated');
    return;
  }
  
  try {
    const response = await fetch('/api/protected-resource', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.refresh_token}`
      },
      body: JSON.stringify({ /* request data */ })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};
```

## Common Server-Side Patterns

### Scheduled Jobs

Running periodic tasks with a scheduler (like cron):

```javascript
// ✅ Good: Scheduled cleanup job
const cleanupExpiredItems = async () => {
  const now = new Date().toISOString();
  
  // Find expired items
  const { expiredItems } = await db.query({
    items: {
      $: {
        where: {
          expiryDate: { $lt: now }
        }
      }
    }
  });
  
  // Delete them
  if (expiredItems.length > 0) {
    await db.transact(
      expiredItems.map(item => db.tx.items[item.id].delete())
    );
    console.log(`Cleaned up ${expiredItems.length} expired items`);
  }
};

// Run this with a scheduler
```

### Data Import/Export

```javascript
// ✅ Good: Exporting data
const exportUserData = async (userId) => {
  const data = await db.query({
    profiles: {
      $: { where: { id: userId } },
      authoredPosts: {
        comments: {},
        tags: {}
      }
    }
  });
  
  return JSON.stringify(data, null, 2);
};
```

### Custom Authentication Flows

```javascript
// ✅ Good: Custom sign-up flow
const customSignUp = async (email, userData) => {
  // Create a user in your auth system
  const token = await db.auth.createToken(email);
  const user = await db.auth.verifyToken(token);
  
  // Create profile with additional data
  await db.transact(
    db.tx.profiles[id()]
      .update({
        ...userData,
        createdAt: new Date().toISOString()
      })
      .link({ $users: user.id })
  );
  
  return user;
};
```

## Security Considerations

### Environment Variables

Store sensitive credentials in environment variables:

```javascript
// ✅ Good: Using environment variables
const db = init({
  appId: process.env.INSTANT_APP_ID,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
});
```

### User Input Validation

Always validate user input before making transactions:

```javascript
// ✅ Good: Validating input before using in transactions
const createValidatedItem = async (userInput) => {
  // Validate input
  if (!userInput.title || userInput.title.length < 3) {
    throw new Error('Title must be at least 3 characters');
  }
  
  if (userInput.count && typeof userInput.count !== 'number') {
    throw new Error('Count must be a number');
  }
  
  // Only proceed with valid data
  return await db.transact(
    db.tx.items[id()].update({
      title: userInput.title,
      count: userInput.count || 0,
      createdAt: new Date().toISOString(),
    })
  );
};
```

## Performance Optimization

### Query Optimization

Fetch only what you need:

```javascript
// ✅ Good: Optimized query with field selection
const getEssentialData = async () => {
  return await db.query({
    posts: {
      $: {
        fields: ['title', 'slug', 'publishedAt'],
        limit: 10,
        order: { publishedAt: 'desc' }
      }
    }
  });
};
```

## Complete Example: Background Worker

Here's a complete example of a server-side process that might run as a background worker:

```javascript
import { init, id } from '@instantdb/admin';
import schema from '../instant.schema';

// Initialize the SDK
const db = init({
  appId: process.env.INSTANT_APP_ID,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
  schema,
});

// Process pending orders
const processPendingOrders = async () => {
  try {
    // Get pending orders
    const { orders } = await db.query({
      orders: {
        $: {
          where: {
            status: 'pending',
            createdAt: { $lt: getTimeAgo(30) } // Orders older than 30 minutes
          }
        },
        customer: {
          profile: {}
        },
        items: {}
      }
    });
    
    console.log(`Processing ${orders.length} pending orders`);
    
    // Process each order
    for (const order of orders) {
      try {
        // Some payment processing logic
        const paymentResult = await processPayment(order);
        
        // Update the order
        await db.transact(
          db.tx.orders[order.id].update({
            status: paymentResult.success ? 'completed' : 'failed',
            processedAt: new Date().toISOString(),
            paymentDetails: {
              transactionId: paymentResult.transactionId,
              amount: paymentResult.amount
            }
          })
        );
        
        // Notify the customer
        if (paymentResult.success) {
          await sendOrderConfirmation(order);
        } else {
          await sendPaymentFailedNotification(order);
        }
        
      } catch (orderError) {
        console.error(`Error processing order ${order.id}:`, orderError);
        
        // Mark as error
        await db.transact(
          db.tx.orders[order.id].update({
            status: 'error',
            error: orderError.message
          })
        );
      }
    }
    
    console.log('Finished processing pending orders');
  } catch (error) {
    console.error('Error in order processing job:', error);
    // Send alert to administrators
    await alertAdmins('Order processing job failed', error);
  }
};

// Helper function
const getTimeAgo = (minutes) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
};

// Run the job
processPendingOrders();
```

## Conclusion

The InstantDB admin SDK provides powerful capabilities for server-side operations, allowing you to:

- Run background tasks and scheduled jobs
- Implement custom authentication flows
- Process data in batches
- Perform administrative operations
- Manage user accounts securely

Always follow security best practices by:
- Keeping your admin token secure
- Validating all user input
- Using environment variables for sensitive information

Remember that the admin SDK bypasses permissions by default - use `db.asUser()` when you want to respect user permissions.
