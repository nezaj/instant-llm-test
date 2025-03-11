I split up the `rules.md` file into separate guides. I
was already copy/pasting specific sections about Instant into context to not
overwhelm the model.

Only feeding context about permissions wasn't very helpful to the model. Giving
it all the guides seemed to help it understand how permissions integrate with
schema, instaql, and instaml.

I also used Claude's project features to sync with the github repo.

https://github.com/nezaj/instant-llm-test

I synced the following folders/files: app/, components/, guides/, lib/, package.json, pages, instant.schema.ts, and instant.perms.ts

Pretty impressed with how well it got permissions correct. It did some extra
things with setting `$default` to `false` because it thought that would be more
secure. In dev that might be annoying so updated the guide to suggest it not do that.

I realized I need to update the blog plan to add pages for viewing other users'
blogs. This would make it easier to inspect permissions and draft navigation.

One downside of using the projects feature is that I can't share the chat via
url. Instead though I use this tool

https://observablehq.com/@simonw/convert-claude-json-to-markdown

to convert my chat w/ Claude to markdown. I then copy/paste that into the
`chats` folder.

You can see this chat at `chats/004_add_permissions.md`
