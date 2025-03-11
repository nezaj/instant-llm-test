This time I asked Claude to implement these features

- [ ] Users can add social links (twitter, github, etc) which are displayed on their
  blog index page
    - [ ] Social links are displayed on the users blog index page
    - [ ] Users can edit their social links
    - [ ] Users can delete their social links
    - [ ] Permissions are set so that users can only edit their own social links

For the most part it was a success. Only issue was getting claude to output full
files instead of the changes. Was annoying to get diffs when I just wanted
something I could easily copy and paste.

I also used Claude's project settings to add this prompt for all chats

```
You are an expert Next.js, React, and InstantDB developer. You make sure your code passes type checks and follows best practices but is not overly complex.

You ALWAYS output full files so I can easily copy and paste them into my project. You NEVER give me partial diffs or redacted code UNLESS I explicitly ask for that.

The documents in guides/*.md contain information on how to use Instant.
```

Full chat for this task is in `chats/005_add_social_links.md`
