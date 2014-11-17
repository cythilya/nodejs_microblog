#(未完成)Node.js: Microblog with Express & MongoDB

##What is Node.js? Why use Node.js?
[為什麼我要用Node.js？案例逐一介紹](http://blog.jobbole.com/53736)

##Why use Express?
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

我們不再需要撰寫req的事件監聽器，只需使用express.bodyParser()即可透過req.body得到post的資料(範例參考Node.js開發指南)。

###Express筆記
列出一些比較特別的規則或內容。

####路由規則重複時，總是執行先定義的規則
當你訪問任何被這兩條同樣的規則匹配到的路徑時，會發現請求總是被前一條路遊規則捕獲，後面的規則會被忽略，原因是Express在處理路由規則時，會優先匹配先定義的路由規則，因此後面相同的規則被屏蔽。

	//總是被執行
	app.all('/user/:username', function(req, res, next) {
		console.log('all methods captured');
		next();
	});
	
	//總是被忽略
	app.get('/user/:username', function(req, res) {
		res.send('user: ' + req.params.username);
	});

####路由控制權轉移 - next()
Express 提供了路由控制權轉移的方法，即callback的第三個參數next，透過next()，可將路由控制權轉移給後面的規則。例如：
	
	//第一條路由規則被執行
	app.all('/user/:username', function(req, res, next) {
		console.log('all methods captured');
		next();
	});

	//next()轉移控制權，執行第二條規則
	app.get('/user/:username', function(req, res) {
		res.send('user: ' + req.params.username);
	});

當訪問被批配到的路徑時，例如http://localhost:3000/user/carbo，會發現prompt訊息 "all methods aptured"，並且瀏覽器顯示了user: carbo。意即第一條路由規則被執行，完成console.log，經由next()轉移控制權，執行第二條規則，最後返回client端。這是非常有用的，利用這樣的方式可將錯誤檢察分段化，降低程式碼的耦合度，在後面的範例中會看到。

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
 - <%- code %>：顯是原始 HTML 内容。

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

####Express ejs 3.*版本不支持 layout.ejs？
我們可能會看到執行畫面並沒有載入Layout放置的CSS與JavaScript檔案，這是因為Express EJS 版本3後不再支援layout.ejs的緣故。解法如下：  

1. 在package.json中的dependencies加入"express-partials": "*"
2. npm install更新資源
3. app.js中引用express-partials
	- 引用var partials = require('express-partials');
	- 加入app.use(partials());

參考[Express ejs 3.*版本不支持 layout.ejs？](https://cnodejs.org/topic/50c1a0ed637ffa4155d05256)。

##Why use MongoDB?
BYVoid在[Node.js開發指南](https://www.byvoid.com/project/node)中提到
>我們選用的MongoDB作為網站的資料庫，它是一個開源的NoSQL的資料庫，相比MySQL的那样的關聯式資料數，它更為輕巧、靈活，非常適合在資料量龐大、事務性不强的場合下使用。

##功能解說
###Router規劃
Router是整個網站的骨架，因此優先設計。

- 首頁：/
- 使用者頁面：/u/[user]
- 發表訊息頁面：/post
- 註冊：/reg
- 登入：/login
- 登出：/logout

###安裝MongoDB
[MongoDB](http://www.mongodb.org)

###建立settings.js
儲存與資料庫連接的資料。

##Demo

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

####官方指南 / 參考書籍
- [Express](http://expressjs.com)
- [Node.js開發指南](https://www.byvoid.com/project/node)
- [MongoDB](http://www.mongodb.org)


####疑難雜症 / 其他
- [為什麼我要用Node.js？案例逐一介紹](http://blog.jobbole.com/53736)
- [Express ejs 3.*版本不支持 layout.ejs？](https://cnodejs.org/topic/50c1a0ed637ffa4155d05256)
- [網頁伺服器](http://goo.gl/DKJxjI)
