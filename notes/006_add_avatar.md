It basically got this in one go. Really cool to see how using a project prompt +
docs gives enough context. All I had to do was write the following:

```

Let's implement the next set of todos

[ ] Users can upload a profile picture which is displayed on their profile page
    [ ] Profile picture is displayed on the users blog index page
    [ ] Users can edit their profile picture
    [ ] Users can delete their profile picture
    [ ] When there is no profile picture, a random color and the first letter of their handle is displayed. This color is generated using a hash of the handle
    [ ] Permissions are set so that users can only edit their own profile picture
```

Really nice.

One thing I noticed compared to previous times was that Claude didn't tell me to run `npx instant-cli@latest push` to update my
schema and perms, will update the modeling and perms section to include a note to always remind users to run `push` after making a schema or perms change

Full chat for this task is in `chats/006_add_avatar.md`
```

