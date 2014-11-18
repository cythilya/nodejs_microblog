//get home page
//功能是調用模板解析引擎，並傳入一個對象作為參數，這個對象只有一個屬性，即即 title: 'Express'。
//index.ejs：index.ejs是模板文件，即路由/ index.js中調用的模板
//layout.ejs模板文件不是孤立展示的，默認情況下所有的模板都繼承自layout.ejs，<%- body %>部分才是獨特的內容，其他部分是共有的，可以看作是頁面框架。
//使用模板引擎：res.render，並將其產生的頁面直接返回给客户端

//首頁
exports.index = function(req, res){
	res.render( 'index', {
		title : '歡迎來到 Microblog'
	});	
};

//使用者頁面
exports.user = function(req, res){
};

//發表訊息頁面
exports.post = function(req, res){
};

//註冊
exports.reg = function(req, res){
	res.render( 'reg', {
		title : '註冊'
	});
};

exports.doReg = function(req, res){
};

//登入
exports.login = function(req, res){
};

exports.doLogin = function(req, res){
};

//登出
exports.logout = function(req, res){
};
