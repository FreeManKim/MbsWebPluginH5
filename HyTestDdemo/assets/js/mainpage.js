/**
 * 主页面的公共JS
 * zhaohuihua, 2016-11-04
 */
+function() {
	if (window != window.top) { return; } // 只在顶级窗口执行

	// 提供给原生WebView调用
	// 设置账号
	var oInitAccount = window.initaccount;
	window.initaccount = function(account, hybrid) {
		Config.hybrid = hybrid !== false;
		Utils.cache.set("ConfigHybrid", Config.hybrid);
		var old = Utils.cache.get("WorkCode");
		if (account != old) {
			Utils.cache.set("WorkCode", account);
			// 查询用户信息
			var url = Utils.getBaseUrl("contact/getUserDetail");
			var params = {userId:account,linkmanId:account};
			$.zajax(url, params, {
				check:false,
				loading:false,
				succ:function(json) {
					if (json.userDetail) {
						var userDetail = json.userDetail;
						var userName = userDetail.NACHN;
						Utils.cache.set("UserName", userName);
						Utils.cache.set("UserDetail", userDetail);
						$.zhh.events.trigger(true, "account-detail", account, userName, userDetail);
					}
				}
			});
		} else {
			var userName = Utils.cache.get("UserName");
			var userDetail = Utils.cache.get("UserDetail");
			$.zhh.events.trigger(true, "account-detail", account, userName, userDetail);
		}
		if ($.isFunction(oInitAccount)) {
			oInitAccount(account, hybrid);
		}
		$.zhh.events.trigger(true, "account-init", account);
	};
	// 初始化页面
	window.initPage = window.initPage || function() {
	};
	window.initlocation = window.initlocation || function() {
	};
	window.closeAllQuestion = window.initlocation || function() {
	};


	$(function() {
		// 默认的初始化
		// <body data-mui-xview="page:'index.html'">
		// <body data-mui-xview="root:'mui_IT',page:'index.html'">
		if ($(document.body).attr("data-mui-xview")) {
			mui.init({ gestureConfig:{ doubletap:true } });
			// 初始化单页view
			var me = $(document.body);
			var zo = me.zoptions("mui-xview");
			if (zo.root) { 
				zo.root = Utils.getViewUrl() + zo.root;
				if (!zo.root.endsWith("/")) { zo.root += "/"; }
			}
			me.xview(me.zoptions("mui-xview"));
			var api = me.xview("api");
			Config.xview = api;

//			if ("onhashchange" in window) {
//				window.onhashchange = function(e) {
//					console.log(e);
//				};
//			}

			// 处理view的后退与webview后退
			var oback = mui.back;
			// 这是咨果原生返回按钮的回调函数, 返回false则不执行原生的返回
			mui.back = window.closeAllQuestion = function() {
				if (api.canBack()) {
					api.back(arguments[0]); // 如果view可以后退，则执行view的后退
					return false; // 不允许原生关闭
				} else if (window.top.$.getPageParams("back") == "original") {
					// 由于mui左上角的返回按钮在android的webview中经常没反应
					// 原生加了一个goBackPage()函数来解决这个问题
					if (window.webview && window.webview.goBackPage) {
						window.console && console.log("window.webview.goBackPage()");
						window.webview.goBackPage();
					} else {
						window.history.back();
					}
					return true; // 允许原生关闭
				} else {
					// 返回大首页(调咨果的原生指令)
					Utils.app.exit();
					return false; // 不允许原生关闭
				}
			};
		}
	});
}();

// 父子结构, 加载.shtml
+function() {
	var def = {
		gestureConfig:{
			doubletap:true
		},
		subpage:{
			id:undefined, url:undefined,
			styles:{ top:'45px', bottom:'0px' }
		}
	};
	$(function() {
		// 父子结构, 加载.shtml
		// <body data-load-shtml="true">
		// <body data-load-shtml="gestureConfig:{doubletap:true},subpage:{styles:{top:'45px',bottom:'0px'}}">
		if ($(document.body).attr("data-load-shtml")) {
			var zo = $(document.body).zoptions("load-shtml");
			if (zo == false) { return; }
			var options = $.extend(true, def, $.isPlainObject(zo) ? zo : {});
			if (options.subpage.url) {
				if (!options.subpage.id) { options.subpage.id = options.subpage.url; }
			} else {
				var url = window.location.href.replace(/[#\?].*/, "");
				var matcher = /([\.\-\w]+)\.html$/.exec(url);
				if (!matcher) { throw Error("body data-load-shtml execute error."); }
				options.subpage.id = options.subpage.url = matcher[1]+'.shtml';
			}
			options.subpages = [ options.subpage ];
			delete options.subpage;
			mui.init(options);
		}
	});
}();
