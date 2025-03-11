# InstantDB Permissions for secure data access

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

