#Node.js: Microblog with Express
使用Node.js + Express建構一個簡單的微博網站。

##What is Node.js? Why use Node.js?
>Node.js 是 Ryan Dahl 基於 Google 的 V8 引擎於 2009 年釋出的一個 JavaScript 開發平台，主要聚焦於 Web 程式的開發，通常用被來寫網站。 (FROM [用 Node.js 學 JavaScript 語言（1）簡介與安裝 by 陳鍾誠 | CodeData](http://www.codedata.com.tw/javascript/using-nodejs-to-learn-javascript))

已有不少前人討論為什麼要選擇Node.js這樣的開發平台，不外乎就是性能(事件驅動、非阻塞式IO的Web伺服器)，如果對這個議題有興趣的可以參考這篇文章 [為什麼我要用Node.js？案例逐一介紹](http://blog.jobbole.com/53736)。

對我而言，開發上經常是HTML + CSS + JavaScript + ASP.NET C# or PHP常常導致角色錯亂或不容易專精，所以能夠使用JavaScript統一前後端真的是一大福音。

##What is Express? Why use Express?
[Express](http://expressjs.com)是目前最穩定、使用最廣泛開發框架，並且是Node.js官方唯一推薦的Web開發框架。BYVoid在[Node.js開發指南](https://www.byvoid.com/project/node)中提到

> Express除了為HTTP模組提供了更高階的接口外，還實現了許多功能，其中包含：路由控制、模板解析支持、動態視圖、用戶會話、CSRF保護、靜態文件服務、錯誤控制器、訪問日誌、緩存、插件支持。  
> 
> 特別在此註明，Express不是一個無所不包的全能框架，像Rails或Django的那樣實現了模板引擎甚至ORM (Object Relation Model，對象關係模型)，它只是一個輕量級的框架，多數功能只是對HTTP協議中常用操作的封裝，更多的功能需要插件或整合其他模組來完成。

例如：

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

用Express重現前例：
	
	var express = require('express');
	var app = express.createServer();
	app.use(express.bodyParser());
	app.all('/', function(req, res) {
		res.send(req.body.title + req.body.text);
	});
	app.listen(3000);

我們不再需要撰寫req的事件監聽器，只需使用express.bodyParser()即可透過req.body得到post的資料(範例參考[Node.js開發指南](https://www.byvoid.com/project/node))。

###Express筆記
列出一些比較特別的規則或內容。

####Router規則重複時，總是執行先定義的規則
當訪問任何被這兩條同樣的規則匹配到的路徑時，總是會先執行前一條規則，後面的會被忽略，原因是Express在處理Router規則時，會優先處理先定義的規則，因此後面相同的規則被忽略。

	//總是被執行
	app.all('/user/:username', function(req, res, next) {
		console.log('all methods captured');
		next();
	});
	
	//總是被忽略
	app.get('/user/:username', function(req, res) {
		res.send('user: ' + req.params.username);
	});

####Router控制權轉移 - next()
Express 提供了Router控制權轉移的方法，即callback的第三個參數next，透過next()，可將控制權轉移給後面的規則。例如：
	
	//第一條路由規則被執行
	app.all('/user/:username', function(req, res, next) {
		console.log('all methods captured');
		next();
	});

	//next()轉移控制權，執行第二條規則
	app.get('/user/:username', function(req, res) {
		res.send('user: ' + req.params.username);
	});

執行 http://localhost:3000/user/carbo，會發現prompt訊息 "all methods aptured"，並且瀏覽器顯示了user: carbo。意即第一條規則被執行，完成console.log，經由next()轉移控制權，執行第二條規則，最後返回client端。我們利用這樣的方式可將錯誤檢察分段化，降低程式碼的耦合度。

####使用模板引擎 / 樣板引擎 (Template Engine)

指定頁面模板位置，在views子目錄下
	
	app.set('views', path.join(__dirname, 'views'));

表明要使用的模板引擎是ejs

	app.set('view engine', 'ejs');

"res.render"是使用模板引擎的語法，並將其產生的頁面直接返回给client端

	res.render( 'index', {
		title : 'To-Do List'
	});

它接受兩個參數，第一個是樣板名稱(不含附檔名)，第二個是傳遞給樣板的資料，帶到畫面上。下面的title都會被"To-Do List"所替換掉。

	<h1><%= title %></h1>
	<p>Welcome to <%= title %></p>

而ejs 的語法有三種：

 - <% code %>：JavaScript 程式碼。
 - <%= code %>：顯示替換過 HTML 特殊字符的内容。
 - <%- code %>：顯示原始 HTML 内容。

####Layout
預設的Layout是layout.ejs，若要關掉預設值可用以下方法。

	app.set('view options', {
		layout: false
	});

或在頁面模板轉換為頁面時指定布局，即設定layout屬性(範例為admin.ejs)。

	function(req, res) {
		res.render('userlist', {
			title: '後台管理系統',
			layout: 'admin'
		});
	};

####Partial View
對於重複顯示的View程式碼，我們會獨立切割切成Partial View，避免for迴圈的迭代。

	app.get('/list', function(req, res) {
		res.render('list', {
			title: 'List',
			items: [1991, 'byvoid', 'express', 'Node.js']
		});
	});

在 views目錄下建立list.ejs。
	
	<ul><%- partial('listitem', items) %></ul>

另外建立listitem.ejs，内容是：
	
	<li><%= listitem %></li>

當訪問http://localhost:3000/list，即可看到程式碼的內容為：

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

partial接受兩個參數，第一個參數是Partial View名稱，第二個是資料欄位名稱。

####Express ejs 3.*版本不支援layout.ejs？
我們可能會看到執行畫面並沒有載入Layout放置的CSS與JavaScript檔案，這是因為Express EJS 版本3去除了部份的middleware，不再支援layout.ejs的緣故。解法如下：  

1. 在package.json中的dependencies加入"express-partials": "*"
2. npm install更新資源
3. app.js中引用express-partials
	- 引用var partials = require('express-partials');
	- 加入app.use(partials());

參考[Express ejs 3.*版本不支持 layout.ejs？](https://cnodejs.org/topic/50c1a0ed637ffa4155d05256)。

##功能解說 & Demo
開始建構一個簡單的微博網站。

###Router/功能規劃
Router是整個網站的骨架，因此優先設計，同時這也是功能的盤點。基本上一定會有首頁、使用者的個別頁面(用來展示個別使用者的發文)、註冊頁、登入頁，並且我們也需要做註冊、登入、登出、發文的動作。

- 首頁：/
- 使用者頁面：/u/[user]
- 發表訊息：/post
- 註冊頁面：/reg
- 登入頁面：/login
- 執行註冊：/doReg
- 執行登入：/doLogin
- 執行登出：/logout

###註冊 / 登入
由於這是一個簡單的範例，沒有用DB儲存使用者的註冊資訊，因此註冊和登入被視為同一件事情。我們將使用者輸入的帳號和密碼存在瀏覽器的cookie中，若使用者兩次輸入的密碼不同，則使用console.log提醒使用者密碼輸入不一致，並refresh頁面，讓使用者重新輸入；若使用者兩次輸入的密碼相同，則將帳號與密碼存放在cookie中，然後導回首頁。

![Node.js microblog 登入](https://lh4.googleusercontent.com/bfi_add67nCqQzqy-5Y_8eMyUd2j0rw3n4HeZ89EUE0=w1194-h828-no)

在View方面，在頁面上放置三個欄位 - 使用者名稱(username)、密碼(password)、重覆密碼(password-repeat)，利用input的name屬性，Form Post後將使用者輸入的值傳遞給doReg。

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

doReg收到使用者輸入的值後，用req.body取出來用。[req.body](http://expressjs.com/api.html#req.body)即接受POST後解析出來的key-value資料。`req.body['username']`可取得使用者名稱，`req.body['password']`可取得密碼，`req.body['password-repeat']`可取得再次輸入的密碼。

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

我們利用儲存好的使用者帳號和密碼來決定使用者的狀態(登入/未登入)，作為頁面顯示的判斷條件。
例如，在Navigation上，如果使用者的狀態是已登入，那麼就顯示登出link；如果狀態是未登入，則顯示登入/註冊link。

	//index.js
	//檢查使用者登入狀態
	var isLogin = false;
	var checkLoginStatus = function(req, res){
		isLogin = false;
		if(req.signedCookies.userid && req.signedCookies.password){
			isLogin = true;
		}
	};
	
	//首頁
	exports.index = function(req, res){
		checkLoginStatus(req, res);
		
		res.render( 'index', {
			title : '歡迎來到 Microblog', 
			loginStatus : isLogin
		});	
	};


畫面：

	//index.ejs
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

提醒，記得在app.js設定secret，例如：`app.use(express.cookieParser('123456789'));`，而且`signed: true`，這樣才能互相傳遞使用噢！

關於cookie的用法可參考Express的官方文件：  

- [res.cookie](http://expressjs.com/api.html#res.cookie)
- [req.signedCookies](req.signedCookies)

###發表訊息
當使用者發表訊息時，我們利用`req.body['post']`取得發文內容，存入(push)假資料陣列，並重新導回首頁(refresh)。

![Node.js microblog 發表訊息](https://lh5.googleusercontent.com/-SKZNiWtzSdE/VHGbvTh4PbI/AAAAAAAADe8/Smq557F7wZ8/w1194-h828-no/microblog_post.gif)
		
    //發表訊息
	exports.post = function(req, res){
		var element = { id: count++, name: req.signedCookies.userid, msg: req.body['post'] };
		postList.push(element);
		return res.redirect('/');	
	};

###使用者頁面
點首頁的特定使用者名稱連結時，會導向使用者的專屬頁面。我們取出目前陣列中此使用者所發表的訊息，並載入到畫面上。  

![Node.js microblog 使用者頁面](https://lh3.googleusercontent.com/-gWTUpGJPHKg/VHGdFCg9cmI/AAAAAAAADfE/yId_FNgEzy4/w1194-h686-no/microblog_user_page.gif)

###登出
登出就執行clear cookie，再導回首頁。

![Node.js microblog 登出](https://lh4.googleusercontent.com/-AjMColj8qeo/VHGdzT3DtnI/AAAAAAAADfk/rxHnJ9hGQs0/w1194-h686-no/microblog_logout.gif)

	//執行登出
	exports.logout = function(req, res){
		res.clearCookie('userid', { path: '/' });
		res.clearCookie('password', { path: '/' });
		return res.redirect('/');
	};

以上簡單完成CRUD中的Create和Read囉！之後還會繼續優化這個小專案程式滴。

###程式碼範例下載
[NodeJS-Microblog in Github](https://github.com/cythilya/NodeJS-Microblog)

---
###Reference
####開發環境建置
- [Hello node.js - win7中的nodejs(一) 安裝篇至hello world](http://blog.friendo.com.tw/posts/238208-nodejs)

####教學 / 範例
- [NODEJS 與 MONGODB 的邂逅](http://fred-zone.blogspot.tw/2012/01/nodejs-mongodb.html) 
- [用 Express 和 MongoDB 寫一個 todo list](http://dreamerslab.com/blog/tw/write-a-todo-list-with-express-and-mongodb)
- [node.js教學－利用Express來寫HTTP伺服器](http://blog.allenchou.cc/nodejs-tuts-2-using-express-framework)
- [[教學] Nodejs 學習筆記 (4) -- express framework](http://clayliao.blogspot.tw/2012/03/express-framework-on-nodejs.html)
- [How to Use EJS in Express](http://robdodson.me/blog/2012/05/31/how-to-use-ejs-in-express)
- [NodeJS todo list](http://levichen.logdown.com/posts/2013/11/15/nodejs-todo-list)
- [用 Node.js 學 JavaScript 語言（1）簡介與安裝 by 陳鍾誠 | CodeData](http://www.codedata.com.tw/javascript/using-nodejs-to-learn-javascript)

####官方指南 / 參考書籍
- [Express](http://expressjs.com)
- [Node.js開發指南](https://www.byvoid.com/project/node)
- [MongoDB](http://www.mongodb.org)

####疑難雜症 / 其他
- [為什麼我要用Node.js？案例逐一介紹](http://blog.jobbole.com/53736)
- [Express ejs 3.*版本不支持 layout.ejs？](https://cnodejs.org/topic/50c1a0ed637ffa4155d05256)
- [網頁伺服器](http://goo.gl/DKJxjI)
