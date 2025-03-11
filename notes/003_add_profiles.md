In this next section we add profiles to our blog platform. Claude definitely
struggled with this part. Making profiles work was tricky for it especially with
hooks and redirections. It also didn't know that limit/offset can only be used
at the top level.

Another thing that's tough is when there is a validation error for queries it's
not that easy for users to know what to look at because our default examples
just render `error.message` -- if a user doesn't think to inspect the `error`
object they won't see the hint.

Here's the full chat

https://claude.ai/share/f43fbd83-1eff-474e-99a5-4117eef36dd6
