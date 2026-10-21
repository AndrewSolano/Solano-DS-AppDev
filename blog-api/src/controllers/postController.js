const { posts, save } = require('../data/store'); //Import the posts and save function

exports.list = (req, res) => res.status(200).json(posts); //requests where it sends back the entire posts list.

exports.getOne = (req, res) => { //Get one specific blog post
  const post = posts.find(p => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.status(200).json(post); //If the post exists, the server sends a 200
};

exports.create = (req, res) => {  //allows a user to create a new blog post
  const { title, content } = req.body || {};
  if (!title || !content)
    return res.status(400).json({ error: 'title and content are required' });

  const post = {
    id: posts.reduce((max, p) => Math.max(max, p.id), 0) + 1, //finds the highest existing post ID and adds 1 to create the next I
    user_id: req.user.id, //This saves the ID of the user who created the post.
    title,
    content,
    created_at: new Date().toISOString(),
  };
  posts.push(post);
  save();
  res.status(201).json(post); //newly created blog post 201
};

exports.update = (req, res) => { //updates an existing blog post. author or admin can only edit
  const { title, content } = req.body || {}; //Gets the new title and content sent by the user
  if (!title && !content)
    return res.status(400).json({ error: 'Provide title or content to update' });

  const post = posts.find(p => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });

  if (post.user_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Only the post owner or an admin can edit' });

  if (title) post.title = title;
  if (content) post.content = content;
  save();
  res.status(200).json(post);
};

exports.remove = (req, res) => { //This code deletes a blog post using its ID
  const index = posts.findIndex(p => p.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Post not found' });

  posts.splice(index, 1);
  save();
  res.status(200).json({ message: 'Post deleted' });
};

exports.mine = (req, res) => { //shows all blog posts created by the currently logged-in user.
  res.status(200).json(posts.filter(p => p.user_id === req.user.id));
};