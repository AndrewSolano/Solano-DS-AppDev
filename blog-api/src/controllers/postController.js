const { posts, save } = require('../data/store');

exports.list = (req, res) => res.status(200).json(posts);

exports.getOne = (req, res) => {
  const post = posts.find(p => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.status(200).json(post);
};

exports.create = (req, res) => {
  const { title, content } = req.body || {};
  if (!title || !content)
    return res.status(400).json({ error: 'title and content are required' });

  const post = {
    id: posts.reduce((max, p) => Math.max(max, p.id), 0) + 1,
    user_id: req.user.id,
    title,
    content,
    created_at: new Date().toISOString(),
  };
  posts.push(post);
  save();
  res.status(201).json(post);
};

exports.update = (req, res) => {
  const { title, content } = req.body || {};
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

exports.remove = (req, res) => {
  const index = posts.findIndex(p => p.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Post not found' });

  posts.splice(index, 1);
  save();
  res.status(200).json({ message: 'Post deleted' });
};

exports.mine = (req, res) => {
  res.status(200).json(posts.filter(p => p.user_id === req.user.id));
};