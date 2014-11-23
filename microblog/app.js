//module dependencies
var express = require('express'); //從local取得express
var routes = require('./routes'); //等同於"./routes/index.js"，指定路徑返回內容，相當於MVC中的Controller
var http = require('http');
var path = require('path');
var app = express();
var partials = require('express-partials');
// all environments
/*
app.set是express的參數設置工具，接受key-value，可用的參數如下：
	- basepath：即Base Path，通常用於res.redirect()跳轉
	- views：存放view的資料夾
	- view engine：view engine類型
	- view options：global view參數
	- view cache：啟用view快取
	- case sensitive routes：路徑區分大小寫
	- strict routing：嚴格路徑，啟用後不會忽略路徑結尾的 "/"
	- jsonp callback：開啟支援透明的JSONP
*/

//預設port號 3000，所以執行的URL為 http://localhost:3000
app.set('port', process.env.PORT || 3000);

//path.join([path1], [path2], [...]): Join all arguments together and normalize the resulting path.
//在這裡的 "path.join(__dirname, 'views')" 的值是 "D:\microblog\views"
//"__dirname" == "D:\microblog"，__dirname {String} : The name of the directory that the currently executing script resides in.
//"_dirname" == "undefined"
//目前app.js是在資料夾microblog中

app.set('views', path.join(__dirname, 'views'));//設計頁面模板位置，在views子目錄下
app.set('view engine', 'ejs');//表明要使用的模板引擎(樣板引擎，Template Engine)是ejs
app.use(partials());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.bodyParser());//解析client端請求，通常是透過POST發送的內容
app.use(express.cookieParser('123456789'));//記得設定key來傳遞資訊
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

/*
app.js中並沒有一個路由規則指派到/stylesheets/style.css，但應用程序通過
app.use(express.static(__dirname + '/public'))配置了靜態文件服務器，因此
/stylesheets/style.css會定向到app.js所在目錄的子目錄中的文件public/stylesheets/style.css中
*/
// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

//routes
//路由控制器，用戶如果訪問"/"路徑，則由routes.index來控制。
//將"/"路徑對應到exports.index函數下。
//展示一個用戶的個人頁面，路徑為'/user/[username]'
/*
路徑規則 '/user/:username' 會被自動編譯為正規表達式，類似於 \/user\/([^\/]+)\/? 這樣的形式，
路徑參數可以在經由req.params取得。
路徑規則同樣支持JavaScript的正規表達式，例如app.get（\/user\/([^\/]+)\/?, callback)。
這樣的好處在於可以定義更複雜的規則，而不同之處在於參數是匿名的，
因此使用req.params[0]、req.params[1]這樣的格式取得資料。
*/
app.get('/', routes.index);
app.get('/u/:user', routes.user);
app.post('/post', routes.post);
app.get('/reg', routes.reg);
app.post('/reg', routes.doReg);
app.get('/login', routes.login);
app.post('/login', routes.doLogin);
app.get('/logout', routes.logout );

http.createServer(app).listen(app.get('port'), function( req, res ){ 
	//建立app instance
	//服務器通過app.listen（3000）;啟動，監聽3000端口。
	console.log('Express server listening on port ' + app.get('port'));
});


/*
建立一個HTTP的實例，在其請求處理函數中手動編寫REQ對象的事件監聽器。
當客戶端數據到達時，將POST數據暫存在閉包的變量中，直到結束。
事件觸發，解析POST請求，處理後返回客戶端。
*/