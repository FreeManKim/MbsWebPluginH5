/**
 * 工具类, 与具体业务无关, 除了jQuery和zhh.tools.js之外不要依赖别的第三方库
 * zhaohuihua, 2016-10-29
 */
+function($) {
	/**
	 * 左侧补字符: pad(12345, '_', 10) 返回 _____12345
	 * 右侧补字符: pad(12345, '_', false, 10) 返回 12345_____
	 */
	var pad = function(string, char, left, length) {
		if ($.dt.isNumber(left)) { length = left; left = true; }
		if (string == null || char == null || length == null) { return string; }
		string = string.toString();
		char = char.toString().charAt(0);
		if (string.length >= length) { return string; }
		var temp = "";
		for (var i = string.length; i < length; i++) {
			temp += char;
		}
		return left ? temp + string : string + temp;
	};
	/**
	 * 参考Oracle decode()函数
	 * Utils.decode(value, "Y", "是", "N", "否"); // 如果value=Y,返回是;value=N,返回否;value=其他值,返回undefined
	 * Utils.decode(value, "Y", "是", "N", "否", "未知"); // 如果value=Y,返回是;value=N,返回否;value=其他值,返回未知
	 * Utils.decode(value, 1, "男", 2, "女", ""); // 如果value=1,返回男;value=2,返回女;value=其他值,返回空字符串
	 */
	var decode = function(value) {
		var UNDEFINED = "__undefined__";
		var def = undefined;
		var map = {};
		var key = UNDEFINED;
		for (var i = 1; i < arguments.length; i++) {
			if (key === UNDEFINED) {
				def = key = String(arguments[i]);
			} else {
				map[key] = arguments[i];
				key = UNDEFINED;
				def = undefined;
			}
		}
		return map[String(value)] || def;
	};
	var encodeHtml = function (source) {
		return String(source)
			.replace(/&/g,'&amp;')
			.replace(/</g,'&lt;')
			.replace(/>/g,'&gt;')
            .replace(/\\/g,'&#92;')
			.replace(/"/g,'&quot;')
			.replace(/'/g,'&#39;');
	};
	var decodeHtml = function (source) {
		return String(source)
			.replace(/&amp;/g,'&')
			.replace(/&lt;/g,'<')
			.replace(/&gt;/g,'>')
            .replace(/&#92;/g,'\\')
			.replace(/&quot;/g,'"')
			.replace(/&#39;/g,"'");
	};
	// baidu template
	// <script type="xxx">...</script>
	// var html = Utils.baidu.template("xxx", data);
	// var $selector = Utils.baidu.template(".selector", "xxx", data);
	var tpl = {};
	var template = function(type, json) {
		var selector = undefined;
		if ($.dt.isElement(type) || $.dt.isString(type) && $.dt.isString(json)) {
			selector = type; type = arguments[1]; json = arguments[2];
		}
		if (!tpl[type]) {
			tpl[type] = baidu.template($("script[type=" + type + "]").html());
		}
		var html = tpl[type](json);
		return selector ? $(selector).html(html) : html;
	};
	var newlineToParagraph = function(text) {
		if (text == undefined) { return text; }
		var trimed = $.trim(text);
		if (trimed.startsWith("<") && trimed.endsWith(">")) {
			return text;
		} else {
			return ("<p>" + text.replace(/\r?\n/g, "</p><p>") + "</p>").replace(/<p><\/p>/ig, "<p>&nbsp;</p>");
		}
	};
	var newlineToBR = function(text) {
		if (text == undefined) { return text; }
		var trimed = $.trim(text);
		if (trimed.startsWith("<") && trimed.endsWith(">")) {
			return text;
		} else {
			return text.replace(/\r?\n/g, "<br/>");
		}
	};

	if (!window.Utils) { window.Utils = {}; }
	$.extend(window.Utils, {
		pad:pad, decode:decode,
		encodeHtml:encodeHtml, decodeHtml:decodeHtml,
		newlineToParagraph:newlineToParagraph, newlineToBR:newlineToBR,
		baidu:{template:template}
	});
}(jQuery);



+function($) {
	/**
	 * ------------------------------
	 * 根据页面地址获取参数对象
	 * ------------------------------
	 * 示例: http://xxx/x.html?name=zhh&id=100
	 * $.getPageParams() --> { name:"zhh", id:"100" }
	 * $.getPageParams("name") --> "zhh"
	 * $.getPageParams("id") --> "100"
	 * -------------------------------------------------------------
	 * @author 赵卉华
	 * date: 2014-08-12
	 * -------------------------------------------------------------
	 */
	$.getPageParams = function(name) {
		var string = window.location.search.substr(1);
		var params = paramsToJson(string);
		return name == null ? params : params[name];
	};
	/**
	 * ------------------------------
	 * 根据页面hash获取参数对象
	 * ------------------------------
	 * 示例: http://xxx/x.html#name=zhh&id=100
	 * $.getHashParams() --> { name:"zhh", id:"100" }
	 * $.getHashParams("name") --> "zhh"
	 * $.getHashParams("id") --> "100"
	 * -------------------------------------------------------------
	 * @author 赵卉华
	 * date: 2014-08-12
	 * -------------------------------------------------------------
	 */
	$.getHashParams = function(name) {
		var string = window.location.hash.substr(1);
		var params = paramsToJson(string);
		return name == null ? params : params[name];
	};
	var paramsToJson = function(string) {
		var params = {};
		if (string) {
			var array = string.split('&');
			$.each(array, function(idx, text){
				var words= text.split('=');
				params[words[0]] = decodeURIComponent(words[1]);
			});
		}
		return params;
	}
}(jQuery);
