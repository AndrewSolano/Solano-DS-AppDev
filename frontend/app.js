const AUTH = 'http://localhost:4000', API = 'http://localhost:5000';
const $ = id => document.getElementById(id);
const say = text => $('msg').textContent = text;
const esc = s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';'); // blocks HTML injection
const by = p => 'by ' + esc(p.author || 'User #' + p.user_id);
const clear = () => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); };

// Who is logged in? Read the data stored inside the access token.
function user() {
  try { return JSON.parse(atob(localStorage.accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); }
  catch { return null; }
}

// One function for every server call. If the access token expired (401), it uses /refresh and retries.
async function call(base, path, method = 'GET', body) {
  const send = () => fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json',
      ...(localStorage.accessToken && { Authorization: 'Bearer ' + localStorage.accessToken }) },
    body: body && JSON.stringify(body)
  });
  let res = await send();
  if (res.status === 401 && base === API && localStorage.refreshToken) {
    const r = await call(AUTH, '/refresh', 'POST', { refreshToken: localStorage.refreshToken });
    if (r.ok) { localStorage.accessToken = r.data.accessToken; res = await send(); }
    else { clear(); location.hash = '#/login'; }
  }
  return { ok: res.ok, data: await res.json() };
}

// ---------- pages ----------
async function list(path, title) {                       // GET /api/posts and GET /api/me/posts
  const { ok, data } = await call(API, path);
  if (!ok) return say(data.error);
  $('app').innerHTML = `<h2>${title}</h2>` + (data.map(p => `
    <div class="post">
      <h3><a href="#/post/${p.id}">${esc(p.title)}</a></h3>
      <p>${esc(p.content.slice(0, 120))}</p>
      <small>${by(p)}</small>
    </div>`).join('') || 'No posts yet.');
}
const home = () => list('/api/posts', 'All Blogs');
const mine = () => list('/api/me/posts', 'My Posts');

async function post(id) {                                // GET /api/posts/:id
  const { ok, data: p } = await call(API, '/api/posts/' + id);
  if (!ok) return say(p.error);
  const u = user();
  $('app').innerHTML = `<h2>${esc(p.title)}</h2><small>${by(p)}</small>
    <p class="body">${esc(p.content)}</p>
    ${u && (u.id === p.user_id || u.role === 'admin') ? `<a class="btn" href="#/edit/${p.id}">Edit</a>` : ''}
    ${u && u.role === 'admin' ? `<button onclick="del(${p.id})">Delete</button>` : ''}`;
}

async function del(id) {                                 // DELETE /api/posts/:id
  if (!confirm('Delete this post?')) return;
  const { ok, data } = await call(API, '/api/posts/' + id, 'DELETE');
  ok ? location.hash = '#/' : say(data.error);
}

async function editor(id) {                              // POST /api/posts (new) or PUT /api/posts/:id (edit)
  let p = { title: '', content: '' };
  if (id) {
    const r = await call(API, '/api/posts/' + id);
    if (!r.ok) return say(r.data.error);
    p = r.data;
  }
  $('app').innerHTML = `<h2>${id ? 'Edit' : 'New'} Blog</h2><form id="form">
    <label>Title <input id="title" value="${esc(p.title)}" required></label>
    <label>Content <textarea id="content" rows="8" required>${esc(p.content)}</textarea></label>
    <button>Save</button></form>`;
  $('form').onsubmit = async e => {
    e.preventDefault();
    const body = { title: $('title').value, content: $('content').value };
    const { ok, data } = await call(API, '/api/posts' + (id ? '/' + id : ''), id ? 'PUT' : 'POST', body);
    ok ? location.hash = '#/post/' + data.id : say(data.error);
  };
}

function authForm(type) {                                // POST /login and POST /register
  $('app').innerHTML = `<h2>${type}</h2><form id="form">
    <label>Username <input id="username" required></label>
    <label>Password <input id="password" type="password" required></label>
    ${type === 'register' ? '<label>Role <select id="role"><option>reader</option><option>author</option><option>admin</option></select></label>' : ''}
    <button>${type}</button></form>`;
  $('form').onsubmit = async e => {
    e.preventDefault();
    const body = { username: $('username').value, password: $('password').value };
    if (type === 'register') body.role = $('role').value;
    const { ok, data } = await call(AUTH, '/' + type, 'POST', body);
    if (!ok) return say(data.error);
    if (type === 'register') { alert('Account created. Please log in.'); location.hash = '#/login'; return; }
    localStorage.accessToken = data.accessToken;
    localStorage.refreshToken = data.refreshToken;
    location.hash = '#/';
  };
}

async function logout() {                                // POST /logout
  await call(AUTH, '/logout', 'POST', { refreshToken: localStorage.refreshToken });
  clear();
  location.hash = '#/login';
  render();
}

const about = () => $('app').innerHTML = '<h2>About</h2><p>A mini blog platform with Express, JWT and three roles: reader, author and admin.</p>';

// ---------- router: shows the right page for the URL ----------
async function render() {
  const [page, id] = location.hash.slice(2).split('/');
  const u = user();
  say('');
  $('nav').innerHTML = '<a href="#/">Blogs</a><a href="#/about">About</a>' + (u
    ? (u.role !== 'reader' ? '<a href="#/new">New Blog</a>' : '') +
      `<a href="#/mine">My Posts</a><span>${esc(u.username)} (${u.role})</span><a onclick="logout()">Logout</a>`
    : '<a href="#/login">Login</a><a href="#/register">Register</a>');
  if (!u && ['new', 'edit', 'mine'].includes(page)) { location.hash = '#/login'; return; }
  const views = { post, new: editor, edit: editor, mine, about,
    login: () => authForm('login'), register: () => authForm('register') };
  try { await (views[page] || home)(id); }
  catch { say('Cannot reach the server. Are both servers running?'); }
}
window.onhashchange = render;
render();