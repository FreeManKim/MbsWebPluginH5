/**
 * 宸ュ叿绫�, 涓庡叿浣撲笟鍔℃棤鍏�, 闄や簡jQuery鍜寊hh.tools.js涔嬪涓嶈渚濊禆鍒殑绗笁鏂瑰簱
 * zhaohuihua, 2016-10-29
 */
+function($) {
	/**
	 * 宸︿晶琛ュ瓧绗�: pad(12345, '_', 10) 杩斿洖 _____12345
	 * 鍙充晶琛ュ瓧绗�: pad(12345, '_', false, 10) 杩斿洖 12345_____
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
	 * 鍙傝€僌racle decode()鍑芥暟
	 * Utils.decode(value, "Y", "鏄�", "N", "鍚�"); // 濡傛灉value=Y,杩斿洖鏄�;value=N,杩斿洖鍚�;value=鍏朵粬鍊�,杩斿洖undefined
	 * Utils.decode(value, "Y", "鏄�", "N", "鍚�", "鏈煡"); // 濡傛灉value=Y,杩斿洖鏄�;value=N,杩斿洖鍚�;value=鍏朵粬鍊�,杩斿洖鏈煡
	 * Utils.decode(value, 1, "鐢�", 2, "濂�", ""); // 濡傛灉value=1,杩斿洖鐢�;value=2,杩斿洖濂�;value=鍏朵粬鍊�,杩斿洖绌哄瓧绗︿覆
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
	 * 鏍规嵁椤甸潰鍦板潃鑾峰彇鍙傛暟瀵硅薄
	 * ------------------------------
	 * 绀轰緥: http://xxx/x.html?name=zhh&id=100
	 * $.getPageParams() --> { name:"zhh", id:"100" }
	 * $.getPageParams("name") --> "zhh"
	 * $.getPageParams("id") --> "100"
	 * -------------------------------------------------------------
	 * @author 璧靛崏鍗�
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
	 * 鏍规嵁椤甸潰hash鑾峰彇鍙傛暟瀵硅薄
	 * ------------------------------
	 * 绀轰緥: http://xxx/x.html#name=zhh&id=100
	 * $.getHashParams() --> { name:"zhh", id:"100" }
	 * $.getHashParams("name") --> "zhh"
	 * $.getHashParams("id") --> "100"
	 * -------------------------------------------------------------
	 * @author 璧靛崏鍗�
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