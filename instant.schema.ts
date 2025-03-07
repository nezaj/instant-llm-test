// instant.schema.ts
import { i } from '@instantdb/core';

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    profiles: i.entity({
      handle: i.string().unique().indexed(),
      bio: i.string(),
      createdAt: i.date().indexed(),
    }),
    posts: i.entity({
      title: i.string().indexed(),
      content: i.string(),
      createdAt: i.date().indexed(),
      updatedAt: i.date(),
      published: i.boolean().indexed(), // For draft functionality
    }),
  },
  links: {
    // Link profiles to users (one-to-one)
    profileUser: {
      forward: { on: 'profiles', has: 'one', label: '$user' },
      reverse: { on: '$users', has: 'one', label: 'profile' },
    },
    // Link posts to users (many-to-one)
    postAuthor: {
      forward: { on: 'posts', has: 'one', label: 'author' },
      reverse: { on: 'profiles', has: 'many', label: 'posts' },
    },
  },
})

// This helps TypeScript display better intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema { }
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
