// instant.schema.ts
import { i } from '@instantdb/core';

const _schema = i.schema({
  entities: {
    posts: i.entity({
      title: i.string().indexed(),
      content: i.string(),
      createdAt: i.date().indexed(),
      updatedAt: i.date(),
      published: i.boolean().indexed(), // We'll use this later for draft functionality
    }),
  },
});

// This helps TypeScript display better intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema { }
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
