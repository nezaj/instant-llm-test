We're going to create a simple blogging platform with the following
functionality

## Basic Blog Functionality
* Create, edit, and delete blog posts
* View their blog posts in a paginated list
* View a single blog post
    * Navigate to the next and previous post
* Be able to mark their posts as published or draft
    * Draft posts are only visible to the author
    * Draft posts don't show up in the paginated list
    * Draft posts cannot be navigated to from the next and previous post links

## Profile Functionality
* Users can sign up for an account with their email and a magic code that is
  emailed to them
* After signing up users create a profile with their handle and a short bio
* After signing up three example blog posts are created for the user
* Users can edit their profile by uploading a profile picture. By default the
  profile picture is a random color and the first letter of their handle

## Order of implementation
Let's first implement the following basic blog functionality without any type of
authentication

* Create, edit, and delete blog posts
* View their blog posts in a paginated list
* View a single blog post
    * Navigate to the next and previous post

After that we'll implement some of the profile functionality

* Users can sign up for an account with their email and a magic code that is
  emailed to them
* After signing up users create a profile with their handle and a short bio
* After signing up three example blog posts are created for the user
    * We want to make sure these posts are associated with the user
    * All future posts should also be associated with the user

We can then impement the ability to mark posts as private. This will require us
to use permissions 

* Be able to mark their posts as published or draft
    * Draft posts are only visible to the author
    * Draft posts don't show up in the paginated list
    * Draft posts cannot be navigated to from the next and previous post links

We'll then implement the ability to edit their profile and restrict permissions

* Add ability to add social links (twitter, github, etc)
* Add ability to add a profile picture

Finally we'll make a spiffy landing page that shows off a few blog posts and 
and encourages users to sign up
