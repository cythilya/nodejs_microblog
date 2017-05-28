# Node.js: Microblog with Express
使用Node.js + Express建構一個簡單的微博網站。

## 什麼是 Node.js? 為什麼要用 Node.js?
> Node.js 是 Ryan Dahl 基於 Google 的 V8 引擎於 2009 年釋出的 JavaScript 開發平台，主要聚焦於 Web 程式的開發，通常被用來寫網站。（From [用 Node.js 學 JavaScript 語言（1）簡介與安裝 by 陳鍾誠](http://www.codedata.com.tw/javascript/using-nodejs-to-learn-javascript)）

已有不少前人討論為什麼要選擇 Node.js 這樣的開發平台，不外乎就是性能（事件驅動、非阻塞式 IO 的 Web 伺服器），如果對這個議題有興趣的可以參考這篇文章-[為什麼我要用 Node.js？案例逐一介紹](http://blog.jobbole.com/53736)。

對我而言，開發上經常是 HTML + CSS + JavaScript + ASP.NET C# or PHP 常常導致角色錯亂或不容易專精，所以能夠使用 JavaScript 統一前後端真的是一大福音。

## 什麼是 Express? 為什麼要用 Express?
[Express](http://expressjs.com) 是目前最穩定、使用最廣泛開發框架，並且是 Node.js 官方唯一推薦的 Web 開發框架。BYVoid 在 [Node.js 開發指南](https://www.byvoid.com/project/node)中提到

> Express 除了為 HTTP 模組提供了更高階的接口外，還實現了許多功能，其中包含：路由控制、模板解析支持、動態視圖、用戶會話、CSRF 保護、靜態文件服務、錯誤控制器、訪問日誌、緩存、插件支持。

> 特別在此註明，Express 不是一個無所不包的全能框架，像 Rails 或 Django 的那樣實現了模板引擎甚至 ORM（Object Relation Model，對象關係模型），它只是一個輕量級的框架，多數功能只是對 HTTP 協議中常用操作的封裝，更多的功能需要插件或整合其他模組來完成。

例如：

```javascript
var http = require('http');
var querystring = require('querystring');
var server = http.createServer(function(req, res) {
  var post = '';
  req.on('data', function(chunk) {
    post += chunk;
  });
  req.on('end', function() {
    post = querystring.parse(post);
    res.write(post.title);
    res.write(post.text);
    res.end();
  });
}).listen(3000);
```

用 Express 重現前例：

```javascript
var express = require('express');
var app = express.createServer();
app.use(express.bodyParser());
app.all('/', function(req, res) {
  res.send(req.body.title + req.body.text);
});
app.listen(3000);
```

我們不再需要撰寫 req 的事件監聽器，只需使用`express.bodyParser()`即可透過`req.body`得到 post 的資料（範例參考 [Node.js 開發指南](https://www.byvoid.com/project/node)）。

### Express 筆記
列出一些比較特別的規則或內容。

#### Router 規則重複時，總是執行先定義的規則
當訪問任何被這兩條同樣的規則匹配到的路徑時，總是會先執行前一條規則，後面的會被忽略，原因是 Express 在處理 Router 規則時，會優先處理先定義的規則，因此後面相同的規則被忽略。

```javascript
// 總是被執行
app.all('/user/:username', function(req, res, next) {
  console.log('all methods captured');
  next();
});

// 總是被忽略
app.get('/user/:username', function(req, res) {
  res.send('user: ' + req.params.username);
});
```

#### Router 控制權轉移 - next()
Express 提供了 Router 控制權轉移的方法，即 callback 的第三個參數 next，透過`next()`，可將控制權轉移給後面的規則。例如：

```javascript
// 第一條路由規則被執行
app.all('/user/:username', function(req, res, next) {
  console.log('all methods captured');
  next();
});

// next()轉移控制權，執行第二條規則
app.get('/user/:username', function(req, res) {
  res.send('user: ' + req.params.username);
});
```

執行 `http://localhost:3000/user/carbo`，會發現 prompt 訊息「all methods captured」，並且瀏覽器顯示了「user: carbo」。意即第一條規則被執行，完成`console.log`，經由`next()`轉移控制權，執行第二條規則，最後返回 client 端。我們利用這樣的方式可將錯誤檢查分段化，降低程式碼的耦合度。

#### 使用模板引擎 / 樣板引擎 (Template Engine)
指定頁面模板位置，在 views 子目錄下。

```javascript
app.set('views', path.join(__dirname, 'views'));
```

表明要使用的模板引擎是 ejs。

```javascript
app.set('view engine', 'ejs');
```

`res.render`是使用模板引擎的語法，並將其產生的頁面直接返回给 client 端。

```javascript
res.render( 'index', {
  title : 'To-Do List'
});
```

它接受兩個參數，第一個是樣板名稱（不含附檔名），第二個是傳遞給樣板的資料，帶到畫面上。下面的 title 都會被「To-Do List」所替換掉。

```html
<h1><%= title %></h1>
<p>Welcome to <%= title %></p>
```

而 ejs 的語法有三種：

- `<% code %>`：JavaScript 程式碼。
- `<%= code %>`：顯示替換過 HTML 特殊字符的内容。
- `<%- code %>`：顯示原始 HTML 内容。

#### Layout
預設的 Layout 是 layout.ejs，若要關掉預設值可用以下方法。

```javascript
app.set('view options', {
  layout: false
});
```

或在頁面模板轉換為頁面時指定布局，即設定 layout 屬性（範例為 admin.ejs）。

```javascript
function(req, res) {
  res.render('userlist', {
    title: '後台管理系統',
    layout: 'admin'
  });
};
```

#### Partial View
對於重複顯示的 View 程式碼，我們會獨立切割切成 Partial View，避免 for 迴圈的迭代。

```javascript
app.get('/list', function(req, res) {
  res.render('list', {
    title: 'List',
    items: [1991, 'byvoid', 'express', 'Node.js']
  });
});
```

在 views 目錄下建立 list.ejs。

```html
<ul><%- partial('listitem', items) %></ul>
```

另外建立 listitem.ejs，内容是：

```html
<li><%= listitem %></li>
```

當訪問`http://localhost:3000/list`，即可看到程式碼的內容為：

```html
<!DOCTYPE html>
<html>
<head>
<title>List</title>
<link rel='stylesheet' href='/stylesheets/style.css' />
</head>
<body>
  <ul>
    <li>1991</li>
    <li>byvoid</li>
    <li>express</li>
    <li>Node.js</li>
  </ul>
</body>
</html>
```

partial 接受兩個參數，第一個參數是 Partial View 名稱，第二個是資料欄位名稱。

#### Express ejs 3.* 版本不支援 layout.ejs？
我們可能會看到執行畫面並沒有載入 Layout 放置的 CSS 與 JavaScript 檔案，這是因為 Express EJS 版本 3 去除了部份的 middleware，不再支援 layout.ejs 的緣故。解法如下：

1. 在 package.json 中的 dependencies 加入`"express-partials": "*"`
2. npm install 更新資源
3. app.js 中引用 express-partials
  - 引用`var partials = require('express-partials')`
  - 加入`app.use(partials())`

參考 [Express ejs 3.*版本不支持 layout.ejs？](https://cnodejs.org/topic/50c1a0ed637ffa4155d05256)

## 功能解說 & Demo
開始建構一個簡單的微博網站。

### Router / 功能規劃
Router 是整個網站的骨架，因此優先設計，同時這也是功能的盤點。基本上一定會有首頁、使用者的個別頁面（用來展示個別使用者的發文）、註冊頁、登入頁，並且我們也需要做註冊、登入、登出、發文的動作。

- 首頁：/
- 使用者頁面：/u/[user]
- 發表訊息：/post
- 註冊頁面：/reg
- 登入頁面：/login
- 執行註冊：/doReg
- 執行登入：/doLogin
- 執行登出：/logout

### 註冊 / 登入
由於這是一個簡單的範例，沒有用 DB 儲存使用者的註冊資訊，因此註冊和登入被視為同一件事情。我們將使用者輸入的帳號和密碼存在瀏覽器的 cookie 中，若使用者兩次輸入的密碼不同，則使用`console.log`提醒使用者密碼輸入不一致，並 refresh 頁面，讓使用者重新輸入；若使用者兩次輸入的密碼相同，則將帳號與密碼存放在 cookie 中，然後導回首頁。

![Node.js microblog 登入](https://cythilya.github.io/assets/2014-11-23-nodejs-express-microblog-login.gif)

在 View 方面，在頁面上放置三個欄位 - 使用者名稱（username）、密碼（password）、重覆密碼（password-repeat），利用 input 的 name 屬性，form post 後將使用者輸入的值傳遞給 doReg。

```html
<div class="control-group">
  <label class="control-label" for="username">使用者名稱</label>
  <div class="controls">
    <input type="text" class="input-xlarge" id="username" name="username">
    <p class="help-block">你的帳戶的名稱，用於登入和顯示。</p>
  </div>
</div>
<div class="control-group">
  <label class="control-label" for="password">密碼</label>
  <div class="controls">
    <input type="password" class="input-xlarge" id="password" name="password">
  </div>
</div>
<div class="control-group">
  <label class="control-label" for="password-repeat">重覆密碼</label>
  <div class="controls">
    <input type="password" class="input-xlarge" id="password-repeat" name="password-repeat">
  </div>
</div>
```
doReg 收到使用者輸入的值後，用`req.body`取出來用。[req.body](http://expressjs.com/api.html#req.body) 即接受 post 後解析出來的 key-value 資料。`req.body['username']`可取得使用者名稱，`req.body['password']`可取得密碼，`req.body['password-repeat']`可取得再次輸入的密碼。

```javascript
exports.doReg = function(req, res){
  if(req.body['password-repeat'] != req.body['password']){
    console.log('密碼輸入不一致。');
    return res.redirect('/reg');
  }
  else{
    res.cookie('userid', req.body['username'], { path: '/', signed: true});
    res.cookie('password', req.body['password'], { path: '/', signed: true });
    return res.redirect('/');
  }
};
```

我們利用儲存好的使用者帳號和密碼來決定使用者的狀態（登入 / 未登入），作為頁面顯示的判斷條件。例如，在導航列（navigation）上，如果使用者的狀態是已登入，那麼就顯示登出 link；如果狀態是未登入，則顯示登入 / 註冊 link。

```javascript
// index.js
// 檢查使用者登入狀態
var isLogin = false;
var checkLoginStatus = function(req, res){
  isLogin = false;
  if(req.signedCookies.userid && req.signedCookies.password){
    isLogin = true;
  }
};

// 首頁
exports.index = function(req, res){
  checkLoginStatus(req, res);

  res.render( 'index', {
    title : '歡迎來到 Microblog',
    loginStatus : isLogin
  });
};
```

畫面：

```html
<!-- index.ejs -->
<div class="nav-collapse">
  <ul class="nav">
    <li class="active"><a href="/">首頁</a></li>
    <% if (loginStatus) { %>
      <li><a href="/logout">登出</a></li>
    <% } else{ %>
      <li><a href="/login">登入</a></li>
      <li><a href="/reg">註冊</a></li>
    <% } %>
  </ul>
</div>
```

提醒，記得在 app.js 設定 secret，例如：`app.use(express.cookieParser('123456789'))`，而且`signed: true`，這樣才能互相傳遞使用噢！

關於 cookie 的用法可參考 Express 的官方文件：

- [res.cookie](http://expressjs.com/en/api.html#res.cookie)
- [req.signedCookies](http://expressjs.com/en/api.html#req.signedCookies)

### 發表訊息
當使用者發表訊息時，我們利用`req.body['post']`取得發文內容，存入（push）假資料陣列，並重新導回首頁。

![Node.js microblog 發表訊息](https://cythilya.github.io/assets/2014-11-23-nodejs-express-microblog-post.gif)

```javascript
// 發表訊息
exports.post = function(req, res){
  var element = { id: count++, name: req.signedCookies.userid, msg: req.body['post'] };
  postList.push(element);
  return res.redirect('/');
};
```

### 使用者頁面
點首頁的特定使用者名稱連結時，會導向使用者的專屬頁面。我們取出目前陣列中此使用者所發表的訊息，並載入到畫面上。

![Node.js microblog 使用者頁面](https://cythilya.github.io/assets/2014-11-23-nodejs-express-microblog-user-page.gif)

### 登出
登出就執行 clear cookie，再導回首頁。

![Node.js microblog 登出](https://cythilya.github.io/assets/2014-11-23-nodejs-express-microblog-logout.gif)

```javascript
// 執行登出
exports.logout = function(req, res){
  res.clearCookie('userid', { path: '/' });
  res.clearCookie('password', { path: '/' });
  return res.redirect('/');
};
```

以上簡單完成 CRUD 中的 Create 和 Read 囉！之後還會繼續優化這個小專案程式滴。

### 程式碼範例下載
[NodeJS-Microblog in Github](https://github.com/cythilya/NodeJS-Microblog)

---
### References
#### 開發環境建置
- [Hello node.js - win7 中的 nodejs (一) 安裝篇至 hello world](http://friendo-matrix.logdown.com/posts/238208-nodejs)

#### 教學 / 範例
- [NODEJS 與 MONGODB 的邂逅](http://fred-zone.blogspot.tw/2012/01/nodejs-mongodb.html)
- [用 Express 和 MongoDB 寫一個 todo list](http://dreamerslab.com/blog/tw/write-a-todo-list-with-express-and-mongodb)
- [node.js 教學－利用 Express 來寫 HTTP 伺服器](http://blog.allenchou.cc/nodejs-tuts-2-using-express-framework)
- [[教學] Nodejs 學習筆記 (4) -- express framework](http://clayliao.blogspot.tw/2012/03/express-framework-on-nodejs.html)
- [How to Use EJS in Express](http://robdodson.me/blog/2012/05/31/how-to-use-ejs-in-express)
- [NodeJS todo list](http://levichen.logdown.com/posts/2013/11/15/nodejs-todo-list)
- [用 Node.js 學 JavaScript 語言（1）簡介與安裝 by 陳鍾誠](http://www.codedata.com.tw/javascript/using-nodejs-to-learn-javascript)

#### 官方指南 / 參考書籍
- [Express](http://expressjs.com)
- [Node.js 開發指南](https://www.byvoid.com/project/node)
- [MongoDB](http://www.mongodb.org)

#### 疑難雜症 / 其他
- [為什麼我要用 Node.js？案例逐一介紹](http://blog.jobbole.com/53736)
- [Express ejs 3.* 版本不支持 layout.ejs？](https://cnodejs.org/topic/50c1a0ed637ffa4155d05256)
- [網頁伺服器](http://goo.gl/DKJxjI)

---
網誌版-[使用 Node.js + Express 建構一個簡單的微博網站](https://cythilya.github.io/2014/11/23/nodejs-express-microblog/)。
