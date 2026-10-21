const AUTH = 'http://localhost:4000', API = 'http://localhost:5000'; //use AUTH and API instead of typing the full addresses repeatedly.
const $ = id => document.getElementById(id); //finds an HTML element using its ID
const say = text => $('msg').textContent = text; //displays Login successful!
const esc = s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';'); // changes special characters into safe text codes
const by = p => 'by ' + esc(p.author || 'User #' + p.user_id); //displays the author of a blog post
const clear = () => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); }; //This is useful when the user logs out

// reads the access token to find out who is logged in and what their role is
function user() { 
  try { return JSON.parse(atob(localStorage.accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); }
  catch { return null; }
}

// sends requests to the backend, includes the access token when available
//tries to get a new access token if the Blog API rejects an expired one, retries the request, and returns the server's response to the frontend.
async function call(base, path, method = 'GET', body) {
  const send = () => fetch(base + path, {
    method, //request is being sent, such as GET to retrieve data or POST to send data.
    headers: { 'Content-Type': 'application/json',
      ...(localStorage.accessToken && { Authorization: 'Bearer ' + localStorage.accessToken }) }, //checks if access token is saved in the browser
    body: body && JSON.stringify(body)
  });
  let res = await send();
  if (res.status === 401 && base === API && localStorage.refreshToken) {
    const r = await call(AUTH, '/refresh', 'POST', { refreshToken: localStorage.refreshToken }); // sends a POST request to Auth Server's /refresh endpoint
    if (r.ok) { localStorage.accessToken = r.data.accessToken; res = await send(); }//saves the new access token, replacing the old access token
    else { clear(); location.hash = '#/login'; }//when fails clear the saved tokens and go to login
  }
  return { ok: res.ok, data: await res.json() };//indicates the request succeeded. JSON TO JScript
}

// displays a list of blog posts.
async function list(path, title) {                      
  const { ok, data } = await call(API, path);      //request posts from the Blog API and stores the result's ok and data
  if (!ok) return say(data.error);
  $('app').innerHTML = `<h2>${title}</h2>` + (data.map(p => ` //get HTML element with the ID app
    <div class="post">
      <h3><a href="#/post/${p.id}">${esc(p.title)}</a></h3> //displays the post title
      <p>${esc(p.content.slice(0, 120))}</p>  //displays the first 120 characters
      <small>${by(p)}</small>
    </div>`).join('') || 'No posts yet.');
}
const home = () => list('/api/posts', 'All Blogs'); //calls list() to retrieve all blog posts from /api/posts
const mine = () => list('/api/me/posts', 'My Posts');

async function post(id) {   //displays one blog post, using its id 
  const { ok, data: p } = await call(API, '/api/posts/' + id); //requests the specific post
  if (!ok) return say(p.error);
  const u = user(); //get the logged-in user's information from the access token
  $('app').innerHTML = `<h2>${esc(p.title)}</h2><small>${by(p)}</small> //displays the post's title and author information
    <p class="body">${esc(p.content)}</p> //displays the content of the selected blog
    ${u && (u.id === p.user_id || u.role === 'admin') ? `<a class="btn" href="#/edit/${p.id}">Edit</a>` : ''} //checks whether owner or an admin
    ${u && u.role === 'admin' ? `<button onclick="del(${p.id})">Delete</button>` : ''}`;
}

async function del(id) {                                 // DELETE /api/posts/:id
  if (!confirm('Delete this post?')) return;
  const { ok, data } = await call(API, '/api/posts/' + id, 'DELETE');
  ok ? location.hash = '#/' : say(data.error);
}

async function editor(id) {   //displays a form for creating a new blog post or editing an existing one                             
  let p = { title: '', content: '' };
  if (id) { //checks whether an id was provided, wants to edit an existing blog post.
    const r = await call(API, '/api/posts/' + id); //requests the existing blog post from the Blog API using its ID
    if (!r.ok) return say(r.data.error);
    p = r.data;
  }
  $('app').innerHTML = `<h2>${id ? 'Edit' : 'New'} Blog</h2><form id="form"> //creates a form Edit Blog or New Blog 
    <label>Title <input id="title" value="${esc(p.title)}" required></label> //title input field
    <label>Content <textarea id="content" rows="8" required>${esc(p.content)}</textarea></label> //text area for the blog content
    <button>Save</button></form>`;
  $('form').onsubmit = async e => {
    e.preventDefault();
    const body = { title: $('title').value, content: $('content').value };
    const { ok, data } = await call(API, '/api/posts' + (id ? '/' + id : ''), id ? 'PUT' : 'POST', body); //POST to create a new post and PUT to update an existing post
    ok ? location.hash = '#/post/' + data.id : say(data.error); //was successful opens the page for blog post;error message 
  };
}

function authForm(type) {  // displays either a login form or a registration form
  $('app').innerHTML = `<h2>${type}</h2><form id="form">
    <label>Username <input id="username" required></label>
    <label>Password <input id="password" type="password" required></label>
    ${type === 'register' ? '<label>Role <select id="role"><option>reader</option><option>author</option><option>admin</option></select></label>' : ''}
    <button>${type}</button></form>`;
  $('form').onsubmit = async e => {
    e.preventDefault();
    const body = { username: $('username').value, password: $('password').value }; //collects the username and password
    if (type === 'register') body.role = $('role').value; //checks if  user is registering and add role dropdown menu
    const { ok, data } = await call(AUTH, '/' + type, 'POST', body); // sends details to the Auth Server using POST 
    if (!ok) return say(data.error); //If username already exists, it should return an error.
    if (type === 'register') { alert('Account created. Please log in.'); location.hash = '#/login'; return; }//if user registered prompt a message and sends them to login
    localStorage.accessToken = data.accessToken;
    localStorage.refreshToken = data.refreshToken;
    location.hash = '#/';
  };
}

async function logout() {     //logs the user out of the blog website.
  await call(AUTH, '/logout', 'POST', { refreshToken: localStorage.refreshToken }); //sends a POST request to the Auth Server's /logout
  clear(); //remove the saved access token and refresh token from the browser's local storage.
  location.hash = '#/login'; // go to login after logginf out
  render();
}

const about = () => $('app').innerHTML = '<h2>About</h2><p>A mini blog platform with Express, JWT and three roles: reader, author and admin.</p>';

// decides which page to display on the blog website based on the current URL.
async function render() {
  const [page, id] = location.hash.slice(2).split('/'); //gets the page name and optional post ID from the URL after #
  const u = user(); //get the logged-in user's information
  say(''); //clears any previous message
  $('nav').innerHTML = '<a href="#/">Blogs</a><a href="#/about">About</a>' + (u //checks whether a user is logged in so it can display the appropriate additional links
    ? (u.role !== 'reader' ? '<a href="#/new">New Blog</a>' : '') + //checks if user is not a reader then displays new blog
      `<a href="#/mine">My Posts</a><span>${esc(u.username)} (${u.role})</span><a onclick="logout()">Logout</a>`//adds a My Posts link
    : '<a href="#/login">Login</a><a href="#/register">Register</a>');//displays Login and Register links if no logged-in user is found
  if (!u && ['new', 'edit', 'mine'].includes(page)) { location.hash = '#/login'; return; }//if the user not logged in and tries to access the New Blog, Edit, or My Posts page; moves user to the login page
  const views = { post, new: editor, edit: editor, mine, about, //connects page names to the functions responsible for displaying
    login: () => authForm('login'), register: () => authForm('register') }; //adds the Login and Register pages to the views
  try { await (views[page] || home)(id); } //displays the home page by calling home()
  catch { say('Cannot reach the server. Are both servers running?'); }
}
window.onhashchange = render;
render();