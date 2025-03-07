I made a plan doc in `notes/plan.md` and worked with Claude to implement the
first basic set of features.

```
Let's start with the first part by implementing the following:

Create, edit, and delete blog posts
View their blog posts in a paginated list
View a single blog post
Navigate to the next and previous post
We'll be using Next.js, React, and InstantDB. For reference here's a simple todo app

I've also included some documentation on how to use InstantDB
```

I included my the todo app from `001_initial_setup.md` and documentation on how
to use Instant in `extra/002_rules.md` My full chat with Claude is [here][1]

Claude got it mostly write but it had some type issues with `BlogPostView.tsx`

It tried to query for a namespace that didn't exist.

```typescript
const { isLoading, error, data } = db.useQuery({
  posts: {
    $: {
      where: { id: postId }
    }
  },
  // Get all posts for navigation, ordered by creation date
  allPosts: {
    $: {
      fields: ['id', 'title'], // We only need these fields for navigation
      order: { createdAt: 'desc' }
    }
  }
});
```

I told it

> I think you're confused with how instaql works. You can only query namespaces we've exists. currentPost is not a valid namespace.

And it then fixed it by querying for `posts` only.

[1]: https://claude.ai/share/f43fbd83-1eff-474e-99a5-4117eef36dd6
