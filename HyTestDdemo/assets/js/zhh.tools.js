(function() {
	if (!String.prototype.startsWith) {
		String.prototype.startsWith = function(s) {
			return s && s.length < this.length && s == this.substring(0, s.length);
		};
	}
	if (!String.prototype.endsWith) {
		String.prototype.endsWith = function(s) {
			return s && s.length < this.length && s == this.substring(this.length - s.length);
		};
	}
})();

(function($) {
	if (!$.log) { $.log = {}; }
	$.log.debug = function(msg) {
		window.console && window.console.debug && window.console.debug(msg);
	};
	$.log.warn = function(msg) {
		window.console && window.console.warn && window.console.warn(msg);
	};
	$.log.info = function(msg) {
		window.console && window.console.info && window.console.info(msg);
	};
	$.log.error = function(msg) {
		window.console && window.console.error && window.console.error(msg);
	};
})(jQuery);

/**
 * -------------------------------------------------------------
 * 根据指定的字段值获取JSON字段值
 * @param json JSON对象, 如:
 *    var json = { domain:{ text:"baidu", url:"http://baidu.com" } }
 * @param fields 字段名, 支持多级, 支持数组, 支持或运算
 *    如: "domain.text", "address[0]", "body.list || body"
 * @return JSON对象的字段值
 *    如: $.zhh.field(json, "domain.text"); 返回 "baidu"
 * -------------------------------------------------------------
 * 根据指定的字段值获取JSON数组的字段值
 * @param array JSON数组对象, 如:
 * var list =
 * [{ domain:{ text:"baidu", url:"http://baidu.com" } },
 *  { domain:{ text:"bing", url:"http://cn.bing.com" } }]
 * @param fields 字段名, 支持多级, 支持数组, 支持或运算
 *    如: "domain.text", "address[0]", "body.list || body"
 * @return JSON对象字段值的数组
 *    如: $.zhh.field(list, "domain.text"); 返回 ["baidu","bing"]
 * -------------------------------------------------------------
 * @author 赵卉华
 * date: 2014-03-12
 * -------------------------------------------------------------
 */
(function($) {
	// 或运算符
	var OR = /\s*\|\|\s*/;
	// 数组或点正则表达式
	var SPLITOR = /[\[\]\.]+/;

	var handle = function(json, fields) {
		var value = undefined;
		for (var i = 0; i < fields.length; i++) {
			// 根据字符串当中的表达式从json对象上取值
			value = json;
			// 把表达式以.或[]拆分为数组
			var list = fields[i].split(SPLITOR);
			// 逐层取值
			for (var j = 0; value != undefined && j < list.length; j++) {
				if (list[j]) { value = value[list[j]]; }
			}
			if (value) { break; }
		}
		return value;
	};
	if (!$.zhh) { $.zhh = {}; }
	$.zhh.field = function(json, field) {
		var fields = field.split(OR);
		if ($.isArray(json)) {
			var list = [];
			for (var i = 0; i < json.length; i++) {
				list.push(handle(json[i], fields));
			}
			return list;
		} else {
			return json == null ? null : handle(json, fields);
		}
	};
})(jQuery);



/**
 * -----------------------------------------------------------
 * 支持复杂对象的提交
 * -----------------------------------------------------------
    var data = {
        "name":"某公司",
        "address":{"city":"南京"},
        "users":[
            {"name":"张三","addresses":[{"city":"南京"}]},
            {"name":"李四","addresses":[{"city":"合肥"},{"city":"南京"}]}
        ]
    });
    
    var params = {
        "name":"某公司",
        "address.city":"南京",
        "users[0].name":"张三",
        "users[0].addresses[0].city":"南京",
        "users[1].name":"李四",
        "users[1].addresses[0].city":"合肥",
        "users[1].addresses[1].city":"南京"
    };
 * -----------------------------------------------------------
 * // 转换为提交参数
 * var params = $.zhh.jsonToParams(data);
 * $.post(url, params, ...);
 * // 还原为JSON数据
 * $.zhh.toDeepJson(params);
 * -----------------------------------------------------------
 * author: 赵卉华 / 2015-10-10
 * -----------------------------------------------------------
 */
(function($) {
	if (!$.zhh) { $.zhh = {}; }
	$.zhh.jsonToParams = function(data, newer, preffix) {
		if (!$.isPlainObject(data)) { return data; }
		if (!newer) {
			var newer = {};
			$.zhh.jsonToParams(data, newer);
			return newer;
		}
		for (var key in data) {
			var value = data[key];
			var newkey = (preffix || "") + key;
			if ($.isPlainObject(value)) { // JSON
				$.zhh.jsonToParams(value, newer, newkey + ".");
			} else if ($.isArray(value)) { // Array
				for (var i = 0; i < value.length; i++) {
					var item = value[i];
					if ($.isPlainObject(item)) { // Array下面的JSON
						$.zhh.jsonToParams(item, newer, newkey + "[" + i + "].");
					} else if ($.isArray(item)) { // Array下面的Array
						$.zhh.jsonToParams(item, newer, newkey + "[" + i + "]");
					} else { // Array下面的基本数据类型
						newer[(preffix || "") + newkey + "[" + i + "]"] = item;
					}
				}
			} else { // 基本数据类型
				newer[newkey] = value;
			}
		}
	};


	$.zhh.toDeepJson = function(data) {
		var map = { };
		for (var field in data) {
			var value = data[field];
			// 把字段以.或[]拆分为数组
			// "users[1].address[0]" --> ["users", "1", "address", "0"]
			// 为防止出现第1段就是数组的情况, 在最前面加上固定的前缀$$$
			var list = ("$$$." + field).replace(/^\[|\]$/g, "").split(/[\[\]\.]+/);
			var temp = map;
			// 逐层设值
			for (var i = 0; i < list.length; i++) {
				var key = list[i];
				if (i == list.length - 1) { // 最后一层
					temp[key] = value;
				} else if (temp[key] == undefined) {
					if (/^[0-9]+$/.test(list[i + 1])) {
						temp[key] = [];
					} else {
						temp[key] = {};
					}
				}
				temp = temp[key];
			}
		}
		return map.$$$;
	};
})(jQuery);


/*!
 * $(form).serializeJson();
 * 将表单转化为JSON格式, 赵卉华, 2015-02-14
 */
(function($) {
	$.fn.serializeJson = function(deep) {
		var json = {};
		var array = this.serializeArray();
		$.each(array, function() {
			var name = this.name;
			var value = this.value;
			if (value == undefined) { return true; }
			var old = json[name];
			if (old) {
				if ($.isArray(old)) {
					old.push(value);
				} else {
					json[name] = [old, value];
				}
			} else {
				json[name] = value;
			}
		});
		// 支持<input type="checkbox" value="true"/>作为boolean值
		this.find("input:enabled:checkbox[value=true]").each(function() {
			if (this.name) {
				json[this.name] = this.checked;
			}
		});
		return deep ? $.zhh.toDeepJson(json) : json;
	};
	$.fn.formParam = function(){
		var json = this.serializeJson();
		var string = [];
		for (var key in json) {
			var value = json[key];
			if (value == null || value == "") { continue; }
			if ($.isArray(value)) {
				for (var i = 0; i < value.length; i++) {
					string.push(key+"="+value[i]);
				}
			} else {
				string.push(key+"="+value);
			}
		}
		return string.join("&");
	};
})(jQuery);


(function($) {
	/**
	 * -----------------------------------------------------------
	 * 支持复杂对象的赋值
	 * $.fn.fillForm(data, createElemIfNotExist)
	 * createElemIfNotExist:true|false 如果DomElement不存在, 是否需要创建
	 * -----------------------------------------------------------
		$(form).fillForm({
			"name":"某公司","address":{"city":"南京"},
			"users":[
				{"name":"张三","addresses":[{"city":"南京"}]},
				{"name":"李四","addresses":[{"city":"合肥"},{"city":"南京"}]}
			]
		});
		<form>
			<input name="name" />
			<input name="address.city" />
			<input name="users[0].name" />
			<input name="users[0].addresses[0].city" />
			<input name="users[1].name" />
			<input name="users[1].addresses[0].city" />
			<input name="users[1].addresses[1].city" />
		</form>
	 * -----------------------------------------------------------
	 * author: 赵卉华 / 2015-10-10 / 2016-10-15 
	 * -----------------------------------------------------------
	 */
	var hidden = '<input type="hidden" name="{0}" value="{1}" />';
	$.fn.fillForm = function(data, createElemIfNotExist) {
		var params = $.zhh.jsonToParams(data);
	    this.find('input,select,textarea').each(function() {
	    	var me = $(this);
	    	var key = me.attr("name");
	    	if (!key) { return true; }
	    	var value = params[key];
	    	if (value == undefined) { return true; }
	    	delete params[key];
	    	if (this.type == 'checkbox' || this.type == 'radio') {
	            this.checked = typeof(value) == 'boolean' ? value : this.value == String(value);
	        } else {
	    		me.val(value);
	    	}
	    });
	    if (createElemIfNotExist) {
		    for (key in params) {
		    	var value = params[key];
		    	if (value == undefined) { return true; }
		    	this.append($.zhh.format(hidden, key, value));
		    }
	    }
	    return this;
	};

	// copy form http://malsup.github.io/jquery.form.js v3.51.0
    var re = /^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i; // 'hidden' is not in this list
	/**
	 * Clears the form data.  Takes the following actions on the form's input fields:
	 *  - input text fields will have their 'value' property set to the empty string
	 *  - select elements will have their 'selectedIndex' property set to -1
	 *  - checkbox and radio inputs will have their 'checked' property set to false
	 *  - inputs of type submit, button, reset, and hidden will *not* be effected
	 *  - button elements will *not* be effected
	 *  支持通过data-clear="false"设置字段不允许清除
	 */
	$.fn.clearForm = function(includeHidden) {
	    return this.each(function() {
	        $('input,select,textarea', this).each(function() {
	        	if ($(this).attr("data-clear") == "false") {
	        		return true;
	        	}
		        var t = this.type, tag = this.tagName.toLowerCase();
		        if (re.test(t) || tag == 'textarea') {
		            this.value = '';
		        }
		        else if (t == 'checkbox' || t == 'radio') {
		            this.checked = false;
		        }
		        else if (tag == 'select') {
		            this.selectedIndex = -1;
		        }
		        else if (t == "file") {
		            if (/MSIE/.test(navigator.userAgent)) {
		                $(this).replaceWith($(this).clone(true));
		            } else {
		                $(this).val('');
		            }
		        }
		        else if (includeHidden) {
		            // includeHidden can be the value true, or it can be a selector string
		            // indicating a special test; for example:
		            //  $('#myForm').clearForm('.special:hidden')
		            // the above would clean hidden inputs that have the class of 'special'
		            if ( (includeHidden === true && /hidden/.test(t)) ||
		                 (typeof includeHidden == 'string' && $(this).is(includeHidden)) ) {
		                this.value = '';
		            }
		        }
		        $(this).trigger("clear");
		    });
	    });
	};
})(jQuery);



/**
 * -------------------------------------------------------------
 * 字符串格式化
 * 如: $.zhh.format("Name:{0}, Email:{1}", "zhaohuihua", "zhaohuihua@126.com")
 * --> Name:zhaohuihua, Email:zhaohuihua@126.com
 * -------------------------------------------------------------
 * 字符串加载JSON数据, 是字符串格式化的加强版
示例:
var json = {
	id:1001, name:"Avril Lavigne", extra:{download:1888, click:1999},
	image:[{type:"pvw",path:"1001.1.jpg"},{type:"main",path:"1001.2.jpg"}],
	music:["Runaway", "Innocence", "Contagious"]
};
$.zhh.format("<li>{id}</li><li>{name}</li>", json)
--> <li>1001</li><li>Avril Lavigne</li>
$.zhh.format("<li>{extra.click}</li><li>{image[1].path}</li>", json)
--> <li>1999</li><li>1001.2.jpg</li>
$.zhh.format("<li>{music[0]}</li><li>{music[1]}</li><li>{music[2]}</li>", json)
--> <li>Runaway</li><li>Innocence</li><li>Contagious</li>
 * -------------------------------------------------------------
 * $.zhh.format('{{}}', "<li>{{id}}</li><li>{{name}}</li>", json)
 * $.zhh.format('<##>', "<li><#id#></li><li><#name#></li>", json)
 * -------------------------------------------------------------
 * author: 赵卉华
 * date: 2011-01-05
 * -------------------------------------------------------------
 */
(function($) {
	// 加载JSON数据的正则表达式, 首字母不能为数字, 以免与格式化冲突
	if (!$.zhh) { $.zhh = {}; }
	// type: 双分隔符{{}}, 单分隔符{}
	$.zhh.format = function(type, string, json) {
		var args = Array.prototype.splice.call(arguments, 1);
		if (!REGEXP[type]) {
			json = string; string = type; type = '{}';
		}
		if ($.isPlainObject(json) || $.isArray(json)) { // 参数是JSON/Array
			// 加载JSON数据, 也就是符合格式的表达式替换为JSON的属性值
			return string.replace(REGEXP[type].json, function(old, exp) {
				var value = $.zhh.field(json, exp);
				return value == null ? "" : value;
			});
		} else { // 其他参数, string, number
			// 格式化, 也就是将符合格式的表达式替换为输入参数
			return string.replace(REGEXP[type].number, function(old, index) {
				var value = args[parseInt(index)];
				return value == null ? "" : value;
			});
		}
	};
	var REGEXP = $.zhh.format.regexp = {
		'{}':   { number:  /\{(\d{1,2})\}/g,   json:  /\{([^0-9][^{}]*)\}/ig   },
		'{{}}': { number:/\{\{(\d{1,2})\}\}/g, json:/\{\{([^0-9][^{}]*)\}\}/ig },
		'<##>': { number:  /<#(\d{1,2})#>/g,   json:  /<#([^0-9][^<#>]*)#>/ig  }
	};
})(jQuery);


(function($) {
	/**
	 * -----------------------------------------------------------
	 * 填充数据
	 * $.fn.fillData(data); // 填充数据
	 * $.fn.fillData("clear"); // 清空数据
	 * $.fn.fillData("..."); // 全部填充为..., 参数为任意字符串
	 * numeral需要用到assets/libs/numeral/min/numeral.min.js
	 * -----------------------------------------------------------
	 	金额:<span data-fill="amount"></span>元
	 	<span data-fill="field:'amount',prefix:'金额:',suffix:'元',defaultValue:'0.00',format:{numeral:'0,0.00'}"></span>
	 	生日:<span data-fill="field:'birthday',defaultValue:'{date}',format:{date:'yyyyMMdd'}"></span>
	 	性别:<span data-fill="field:'gender',defaultValue:'UNKNOWN',format:{map:{MALE:'男',FEMALE:'女',UNKNOWN:'未知'}}"></span>
		$(document.body).fillData({ gender:'MALE', birthday:'2016-08-08', amount:888 });
	 * -----------------------------------------------------------
	 * author: 赵卉华 / 2016-12-09
	 * -----------------------------------------------------------
	 */
	$.fn.fillData = function(data) {
		var zokey = o.attr;
		var selector = "[data-" + zokey + "]";
	    return this.find(selector).each(function() {
	    	var me = $(this);
	    	if (data == "clear") { me.text(""); return true; }
	    	else if (!$.isPlainObject(data) && !$.isArray(data)) { me.text(data); return true; }

	    	var zo = me.zoptions(zokey);
	    	if (!$.isPlainObject(zo)) { zo = { field:zo }; }
	    	var value = o.getDataValue(data, zo.field);
	    	if (o.isNullValue(value) && zo.defaultValue == undefined) {
	    		me.text("");
	    	} else {
	    		if (o.isNullValue(value)) {
	    			value = o.getDefaultValue(zo.defaultValue);
	    		}
	    		if (zo.format) {
	    			value = formatValue(value, zo.format);
	    		}
	    		value = (zo.prefix || "") + value + (zo.suffix || "");
	    		me.text(value);
	    	}
	    });
	};
	var o = $.fn.fillData.defaults = {
		attr:"fill",
		getDataValue: function(data, field) {
			return $.zhh.field(data, field);
		},
		isNullValue: function(value) {
			return value == undefined || value == "";
		},
		getDefaultValue: function(defaultValue) {
			return defaultValue == "{date}" ? new Date() : defaultValue;
		},
		format: {
			date:function(value, option) {
				return o.isNullValue(value) ? value : Dates.format(value, option);
			},
			numeral:function(value, option) {
				return o.isNullValue(value) ? value : numeral(value).format(option);
			},
			map:function(value, map) {
				return o.isNullValue(value) ? value : map[value];
			}
		}
	};
	var formatValue = function(value, option) {
		for (var type in option) {
			var fn = $.fn.fillData.defaults.format[type];
			if (!fn) { $.log.error("Fill data format handle function not found: " + type); continue; }
			value = fn(value, option[type] || undefined);
		}
		return value;
	};
})(jQuery);


(function($) {
	/**
	 * -----------------------------------------------------------
	 * tree数据解析器, 支持将扁平数组结构转换为tree层级结构
	 * -----------------------------------------------------------
	 * $.zhh.treeparse(array, options)
	 * -----------------------------------------------------------
	 * author: 赵卉华 / 2014-03-26
	 * -----------------------------------------------------------
	 */

	// tree默认配置参数
	var OPTIONS = {
		copy: ["text"], // 需要复制的属性
		level: false, // 是否需要计算级别, String=LevelFieldName
		upgrade: false, // 未找到父节点的子节点是否升级为根节点
		children: "children", // 用于记录子元素的KEY
		tid:"id", parent:"parent || parentId", // 用于关联的ID和父ID
		text: "text || title || name"
	};
	// tree数据解析器
	if (!$.zhh) { $.zhh = {}; }
	$.zhh.treeparse = function(list, options) {
		if (list.length == 0) {
			return [];
		}
		var o = $.extend({}, OPTIONS, options);
		var data = [], buffer = {}, children = {};
		$.each(list, function() {
			var id = $.zhh.field(this, o.tid); // 取当前ID
			if (this.id == null) { this.id = id; }
			var parent = $.zhh.field(this, o.parent); // 取父节点ID
			if (id == parent) { parent = undefined; }
			if (parent) { // 不是顶级节点
				if (!children[parent]) {
					children[parent] = [this];
				} else if ($.inArray(this, children[parent]) < 0) {
					children[parent].push(this);
				}
			} else { // 顶级节点
				data.push(this);
			}
			buffer[id] = this; // 缓存当前节点, 有可能成为后面循环的父节点
		});
		// 为父节点设置子节点
		for (var id in children) {
			if (buffer[id]) {
				buffer[id][o.children] = children[id];
			} else if (o.upgrade) { // 升级为根节点
				$.each(children[id], function() {
					data.push(this);
				});
			} else {
				$.log.debug("ignore node: " + JSON.stringify(children[id]));
			}
		}
		if (o.level) { // 计算级别
			var levelName = typeof (o.level) == "string" ? o.level : "level";
			var fillLevel = function(node) {
				$.each(node[o.children] || [], function() {
					this[levelName] = node[levelName] + 1;
					fillLevel(this);
				});
			};
			$.each(data, function() {
				this[levelName] = 1;
				fillLevel(this);
			});
		}
		$.each(list, function() {
			// 复制属性
			for (var key in o) {
				var field = o[key];
				if ($.inArray(key, o.copy) < 0 || key == field) { continue; }
				if ($.isFunction(field)) {
					var value = field(this, key, o);
					if (value !== undefined) {
						this[key] = value;
					}
				} else {
					this[key] = $.zhh.field(this, field);
				}
			}
		});
		return data;
	};
	$.zhh.treeparse.defaults = OPTIONS;
})(jQuery);



(function($) {
	/**
	 * -----------------------------------------------------------
	 * 事件监听和触发
	 * -----------------------------------------------------------
	 * 支付多个事件一起监听, 支持触发事件时传多个参数
	 * 先触发后注册也能得到回调
	 * -----------------------------------------------------------
	 * author: 赵卉华 / 2015-04-11
	 * -----------------------------------------------------------
		$.zhh.events.on("user.login", function(user) {
			...
		});
		// 多个事件一起监听
		$.zhh.events.on("user.login user.changed", function(newUser, oldUser) {
			...
		});
		
		var login = function() {
			...
			$.zhh.events.trigger("user.login", user);
			$.zhh.events.trigger(true, "user.once"); // true表示只触发一次
			...
		};
		
		var edit = function() {
			...
			// 多个参数
			$.zhh.events.trigger("user.edit", newUser, oldUser);
			$.zhh.events.trigger(true, "user.once"); // true表示只触发一次
			...
		};
	 * -----------------------------------------------------------
		var UserService = (function() {
			var event = $.zhh.event.create();
			var login = function(data) {
				...
				event.trigger("login", newUser);
				...
			};
			var edit = function(data) {
				...
				event.trigger("edit", newUser, oldUser);
				...
			};
			return {
				login:login, edit:edit,
				on:$.zhh.event.on(event),
				off:$.zhh.event.off(event)
			}
		})();
		UserService.on("login edit", function(newUser, oldUser) {
			console.log("user change");
			console.log(oldUser);
			console.log(newUser);
			...
		});
	 * -----------------------------------------------------------
	 */
	var getKeyName = function(key) {
		return "__ze_" + key + "__";
	};
	var Event = function() {};
	// 注册监听器
	Event.prototype.on = function(key, fn) {
		var self = this;
		$.each(key.split(/\s+/), function(i, key) {
			if (!key || typeof(fn) !== "function") {
				return;
			}
			// 注册监听器
			if (self[key]) {
				self[key].push(fn);
			} else {
				self[key] = [fn];
			}

			// 注册前已经触发过了, 直接回调
			var name = getKeyName(key);
			var triggered = self[name];
			if (triggered) {
				window.setTimeout(function() {
					fn.apply({ key:key, self:self, original:triggered.original }, triggered.args);
					/*
					try{
						fn.apply({ key:key, self:self, original:triggered.original }, triggered.args);
					} catch(e) {
						$.log.debug("event trigger error, key=" + key);
						$.log.debug(self);
						$.log.debug(e);
					}
					*/
				}, 0);
			}
		});
	};
	// 移除监听器
	Event.prototype.off = function(key, fn) {
		var self = this;
		$.each(key.split(/\s+/), function(i, key) {
			if (self[key]) {
				if (!fn) {
					delete self[key];
				} else {
					var list = self[key];
					var index = $.inArray(fn, list);
					while (index >= 0) {
						list.splice(index, 1);
						index = $.inArray(fn, list);
					}
				}
			}
		});
	};
	// 触发事件
	// $.zhh.events.trigger("xxx", args); // 先触发后注册不会得到回调
	// $.zhh.events.trigger(true, "ready", args);
	// true, 某些事件如init,ready之类, 只会触发一次, 这类事件先触发后注册也会得到回调
	// $.zhh.events.trigger(node, "init", args);
	// node, 同上, 针对每个node只会触发一次, 先触发后注册也会得到回调
	Event.prototype.trigger = function() {
		var index, node, key;
		if (typeof(arguments[0]) == "string") {
			node = false; key = arguments[0]; index = 1;
		} else {
			node = arguments[0]; key = arguments[1]; index = 2;
		}
		// 在IE8有问题, args始终等于空数组
		// var args = Array.prototype.splice.call(arguments, index);
		var args = [];
		for (var i = index; i < arguments.length; i++) {
			args.push(arguments[i]);
		}

		var self = this;
		var name = getKeyName(key);
		var original = typeof(node) == "boolean" ? undefined : node;
		// 如果once事件已经触发过了就不再触发
		if (self[name]) {
			if (node == true) { return; }
			else if (node[name]) { return; }
		}
		window.setTimeout(function() {
			// 记录已经触发的参数
			// 用于init,ready之类只会触发一次的事件, 先触发后注册也能得到回调
			if (node) { 
				self[name] = { args:args, node:node, original:original };
				if (typeof(node) != "boolean") { node[name] = true; }
			}
			// 逐一回调监听器
			var list = self[key] || [];
			// 修改BUG: 
			// 如果在回调函数中又调用了event.on(), 则会出现多调用一次回调的问题
			// for (var i = 0; i < list.length; i++)
			for (var i = 0, length = list.length; i < length; i++) {
				list[i].apply({ key:key, self:self, original:original }, args);
				/*
				try {
					list[i].apply({ key:key, self:self, original:original }, args);
				} catch(e) {
					$.log.debug("event trigger error, key=" + key);
					$.log.debug(self);
					$.log.debug(e);
				}
				*/
			}
		}, 0);
	};

	if (!$.zhh) { $.zhh = {}; }
	$.zhh.events = new Event();
	$.zhh.event = {
		create:function() { 
			return new Event();
		},
		on:function(e) { 
			return function(key, fn) { e.on(key, fn); };
		},
		off:function(e) { 
			return function(key, fn) { e.off(key, fn); };
		}
	};
})(jQuery);

/**
 * -------------------------------------------------------------
 * 判断数据类型
 * isNull isUndefined
 * isNumeric isNumber isBoolean isString isDate isRegExp isError
 * isObject isPlainObject isEmptyObject isFunction isArray isWindow
 * isElement isDomElement isJqueryElement
 * -------------------------------------------------------------
 * $.dt.isNumber("0") = false
 * $.dt.isNumeric("0") = true
 * $.dt.isNumeric("0xFF") = true
 * $.dt.isObject(document) = true
 * $.dt.isPlainObject(document) = false
 * $.dt.isDomElement(document) = true
 * $.dt.isJqueryElement($(document)) = true
 * $.dt.isElement(document) = true
 * $.dt.isElement($(document)) = true
 * -----------------------------------------------------------
 * author: 赵卉华 / 2016-10-15
 * -----------------------------------------------------------
 */
(function($) {
	if (!$.dt) { $.dt = {}; }
	$.each("isFunction isArray isWindow isEmptyObject isPlainObject isNumeric".split(/\s+/g), function(i, name) {
		$.dt[name] = $[name];
	});
	$.each("Null Undefined Boolean Number String Date RegExp Object Error".split(/\s+/g), function(i, name) {
		$.dt["is" + name] = function(object) { return $.type(object) == name.toLowerCase(); };
	});
	$.dt.isDomElement = function(object) {
		// object.nodeType, 判断DOMElement, jquery就是这么判断的
		return $.dt.isObject(object) && !$.dt.isPlainObject(object) && !!object.nodeType;
	};
	$.dt.isJqueryElement = function(object) {
		return object instanceof $ && $.dt.isDomElement(object[0]);
	};
	$.dt.isElement = function(object) {
		return object instanceof $ && $.dt.isDomElement(object[0]) || $.dt.isDomElement(object);
	};
})(jQuery);


/**
 * -------------------------------------------------------------
 * 解析参数
 * $.zhh.parseArgs(args, fields, sequential, parser);
 * args 参数列表, fields 字段列表, sequential=true|false 强制顺序, parser=function 解析器函数
 * -------------------------------------------------------------
 * 如: dosomething(type, url, data, fn);
 * var vars = $.zhh.parseArgs(arguments, "type, url, data, fn", function(field, value) { ... });
 * dosomething("POST", "xx.do", "x=xxx&y=yyy", callback) --> vars = { type:"POST", url:"xx.do", data:"x=xxx&y=yyy", fn:callback };
 * dosomething("POST", "xx.do", callback) --> vars = { type:"POST", url:"xx.do", fn:callback };
 * -------------------------------------------------------------
	var vars = $.zhh.parseArgs(arguments, "type, url, data, fn", function(field, value) {
		if ($.isFunction(value)) {
			return "fn";
		} else if ($.isPlainObject(value)) {
			return "data";
		} else if (typeof(value) == "string") {
			// dosomething("POST", "xx.do", "x=xxx&y=yyy", callback); // type=POST, url=xx.do, data=x=xxx&y=yyy
			// dosomething("1", "2", callback); // type=1, url=2, data=undefined
			// dosomething("1", callback); // type=1, url=undefined, data=undefined
			if (!this.type) {
				return "type";
			} else if (!this.url) {
				return "url";
			} else if (!this.data) {
				return "data";
			}
		} else if (value.nodeType || value instanceof jQuery) {
			return { field:"data", value:$(value).serializeJson() };
		}
	};
	var vars = $.zhh.parseArgs(arguments, "data, loading, fn", function(field, value) {
		if ($.isFunction(value)) {
			return "fn";
		} else if (typeof(value) == "boolean") {
			return "loading";
		} else if (typeof(value) == "string" || $.isPlainObject(value)) {
			return "data";
		} else if (value.nodeType || value instanceof jQuery) { // $("form")
			return { field:"data", value:$(value).serializeJson() };
		}
	};
 * -----------------------------------------------------------
 * author: 赵卉华 / 2016-10-13
 * -----------------------------------------------------------
 */
(function($) {
	if (!$.zhh) { $.zhh = {}; }
	$.zhh.parseArgs = function(args, fields, sequential, parser) {
		if (typeof(fields) == "string") {
			fields = fields.split(/\s*[ ,\|]\s*/i);
		}
		if (typeof(sequential) != "boolean") {
			parser = sequential; sequential = true;
		}
		var vars = {};
		var offset = 0;
		for (var i = 0; i < fields.length; ) {
			var field = fields[i];
			var value;
			if (field == "this") {
				// 函数直接调用而不是.call时, this==jQuery 或 window
				value = (this === $ || $.dt.isWindow(this)) ? undefined : this;
				offset ++;
			} else {
				value = args[i - offset];
			}
			// result = { field:"string", value:value, copy:json }
			// result = "string" 转换为 { field:"string", value:value }
			var result = parser.call(vars, field, value);
			if (result && $.dt.isString(result)) {
				result = { field:result, value:value };
			}
			if (!$.isPlainObject(result)) {
				i++;
				continue;
			} else if (!sequential) {
				i++;
			} else {
				var index = $.inArray(result.field, fields);
				if (index < 0) {
					i++;
				} else if (index < i) {
					throw new Error("The forced sequential model can not be back.");
				} else {
					i = index + 1;
				}
			}

			if (vars[result.field] === undefined && result.field != undefined && result.field != "this" && result.value !== undefined) {
				vars[result.field] = result.value;
			}
			if ($.isPlainObject(result.copy)) {
				$.extend(true, vars, result.copy);
			}
		}
		return vars;
	};
})(jQuery);
/**
 * -------------------------------------------------------------
 * 解析选项
 * $.zhh.parseOptions(options, listKey)
 * options:josn or json list 选项, listKey:string 列表的KEY
 * 解析后的选项有两部分, 主体选项和列表选项, 
 * 如: { label:'xxx',disabled:false, rules:[{required:true},{regexp:'ascii'}] }
 * label,disabled是主体选项, rules是列表选项
 * -------------------------------------------------------------
 * 如: listKey = "rules"
 * 标准格式不作转换: 
 * options = { label:'xxx',disabled:false, rules:[{required:true},{regexp:'ascii'},{regexp:'illegal-char'}] }
 * 没有主体选项:
 * 转换前: options = [ {required:true},{regexp:'ascii'},{regexp:'illegal-char'} ]
 * 转换后: options = { rules:[{required:true},{regexp:'ascii'},{regexp:'illegal-char'}] }
 * 列表选项第一项作为主体选项, 以{$:{}}格式配置
 * 转换前: options = [ {$:{label:'xxx',disabled:false}}, {required:true},{regexp:'ascii'},{regexp:'illegal-char'} ]
 * 转换后: options = { label:'xxx',disabled:false, rules:[{required:true},{regexp:'ascii'},{regexp:'illegal-char'}] }
 * 只有主体选项:
 * 转换前: options = {$:{label:'xxx',disabled:false}}
 * 转换后: options = { label:'xxx',disabled:false }
 * 只有一项列表选项:
 * 转换前: options = { required:true,regexp:'illegal-char' }
 * 转换后: options = { rules:[{required:true,regexp:'illegal-char'}] }
 			// data-vld="[ { label:'xxx',target:'input[name=xxx]', rules:[{required:true},{regexp:'ascii'},{regexp:'illegal-char'},...] } ]"
			// data-vld="{ tips:true,disabled:false, targets:[ { label:'xxx',target:'input[name=xxx]', rules:[{required:true},{regexp:'ascii'},{regexp:'illegal-char'},...] } ] }"
			// data-vld="[ {$:{tips:true,concat:false,disabled:false}}, [ {$:{label:'xxx',target:'input[name=xxx]'}}, {required:true},{regexp:'ascii'},{regexp:'illegal-char'},... ] ]"
 * -----------------------------------------------------------
 * author: 赵卉华 / 2016-10-19
 * -----------------------------------------------------------
 */
(function($) {
	if (!$.zhh) { $.zhh = {}; }
	$.zhh.parseOptions = function(options, listKey) {
		if ($.isArray(options)) {
			var o = { };
			var list = [];
			$.each(options, function(i, option) {
				if (i == 0 && "$" in option) {
					var temp = parseMainOptions(o, option);
					if (!$.isEmptyObject(temp)) { list.push(temp); }
				} else {
					list.push(option);
				}
			});
			if (list.length) { o[listKey] = list; }
			return o;
		} else if ($.isPlainObject(options)) {
			if ($.isEmptyObject(options)) {
				return {};
			} else if ("$" in options) {
				var o = {};
				options = parseMainOptions(o, options);
				if (!$.isEmptyObject(options)) { o[listKey] = [options]; }
				return o;
			} else if ($.isPlainObject(options[listKey])) {
				options[listKey] = [options[listKey]]
				return options;
			} else if ($.isArray(options[listKey])) {
				return options;
			} else {
				var o = {};
				o[listKey] = [options];
				return o;
			}
		} else {
			return {};
		}
	};
	var parseMainOptions = function(options, option) {
		var temp = $.extend(true, {}, option);
		if ($.isPlainObject(option.$)) { // {$:{xxx:true,yyy:false}}
			$.extend(true, options, temp.$);
			delete temp.$;
		} else { // {$:true,xxx:true,yyy:false} 或 {$:0,xxx:true,yyy:false}
			delete temp.$;
			$.extend(true, options, temp);
		}
		return temp;
	};
})(jQuery);



/**
 * -------------------------------------------------------------
 * 生成随机数
 * -------------------------------------------------------------
 * Randoms.number(4); nnnn(string)
 * Randoms.number(100, 200); 100~200(number)
 * -------------------------------------------------------------
 */
var Randoms = (function() {
	var number = function(min, max) {
		if (max == null) {
		var list = [];
			for(var i = 0; i < Math.min(min, 10) ; i ++) {
			    list.push(Math.floor(Math.random()*10));
			}
			return list.join("");
		} else {
			return Math.floor(Math.random()*(max-min+1)+min);
		}
	};
	return { number:number };
})();

/**
 * -------------------------------------------------------------
 * 日期格式化
 * -------------------------------------------------------------
 * y: 表示年
 * M：表示一年中的月份 1~12
 * d: 表示月份中的天数 1~31
 * H：表示一天中的小时数 0~23
 * m: 表示小时中的分钟数 0~59
 * s: 表示分钟中的秒数   0~59
 * S: 表示秒中的毫秒数   0~999
 * -------------------------------------------------------------
 * Dates.format(new Date());
 * Dates.format(new Date(), Dates.FORMAT.DATE);
 * Dates.format(new Date(), Dates.FORMAT.DATETIME);
 * Dates.format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
 * -------------------------------------------------------------
 * Dates.parse("10-20");
 * Dates.parse("5月6日");
 * Dates.parse("2000-10-20");
 * Dates.parse("2000-10-20 15:25:35");
 * Dates.parse("2000-10-20 15:25:35.888");
 * -------------------------------------------------------------
 * author: 赵卉华 / 2014-10-20
 * -------------------------------------------------------------
 */
var Dates = (function(){
	var FORMAT = {
		DATE: 'yyyy-MM-dd',
		TIME: 'HH:mm:ss',
		DATETIME: 'yyyy-MM-dd HH:mm:ss'
	};
	
	/**  
	 * 根据给定的日期得到日期的月，日，时，分和秒的对象
	 * @params date 给定的日期 date为非Date类型， 则获取当前日期
	 * @return 有给定日期的月、日、时、分和秒组成的对象
	 */
	var getDateObject = function(date) {
		if (!$.dt.isDate(date)) {
			date = new Date();
		}
		return {
			'M+' : date.getMonth() + 1,
			'd+' : date.getDate(),
			'H+' : date.getHours(),
			'm+' : date.getMinutes(),
			's+' : date.getSeconds(),
			'S+' : date.getMilliseconds()
		};
	};

	/**  
	 * 根据给定的日期时间格式，格式化当前日期
	 * @params string 格式化字符串， 如："yyyy-MM-dd", 默认格式为："yyyy-MM-dd HH:mm:ss"
	 * @return 返回根据给定格式的字符串表示的时间日期格式
	 */
	var format = function(date, string) {
		try {
			if (!$.dt.isDate(date)) { date = parse(date); }
			var temp = string || FORMAT.DATETIME;
			var fullYear = String(date.getFullYear());
			temp = temp.replace(/y+/, function(word) {
				return word.length > 2 ? fullYear : fullYear.substr(-2);
			});
			var dates = getDateObject(date);
			for (var i in dates) {
				var regexp = new RegExp(i, 'g');
				temp = temp.replace(regexp, function(word) {
					var target = String(dates[i]);
					if (word.length > target.length) {
						return ('0000000000' + target).substr(-word.length);
					} else {
						return target;
					}
				});
			}
			return temp;
		} catch (e) {
			$.log.error(e);
		}
	};

	var parse = function(date, defvalue) {
		if (!date) {
			return defvalue;
		} else if ($.dt.isNumeric(date)) {
			return new Date(date * 1);
		} else if ($.dt.isDate(date)) {
			return new Date(date.getTime());
		} else if (typeof(date) == "string") {
			var m = /^(\d{1,2})[\-\/](\d{1,2})$/.exec(date);
			if (m) {
				return new Date(new Date().getFullYear(), parseInt(m[1]-1), parseInt(m[2]));
			} else {
				var m = /^(\d{1,2})月(\d{1,2})日$/.exec(date);
				if (m) {
					return new Date(new Date().getFullYear(), parseInt(m[1]-1), parseInt(m[2]));
				} else {
					var m = /^(\d{4})[\-\/](\d{2})[\-\/](\d{2})$/.exec(date);
					if (m) {
						return new Date(parseInt(m[1]), parseInt(m[2]-1), parseInt(m[3]));
					} else {
						var m = /^(\d{4})[\-\/](\d{2})[\-\/](\d{2}) (\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?$/.exec(date);
						if (m) {
							return new Date(parseInt(m[1]), parseInt(m[2]-1), parseInt(m[3]), parseInt(m[4]), parseInt(m[5]), parseInt(m[6]), parseInt(m[7]||0));
						} else {
							// JSON.stringify(new Date()); -- 2016-12-07T11:56:24.920Z
							// 输出的是ISO时间, 有时区差, 需要用new Date()来还原
							var m = /^(\d{4})[\-\/](\d{2})[\-\/](\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?Z$/i.exec(date);
							if (m) {
								return new Date(date);
							} else {
								// safari不支持yyyy-mm-dd格式
								// chrome/ff/ie/safari都支持yyyy/mm/dd
								var temp = new Date(date.replace(/-/g, '/'));
								return isNaN(temp) ? defvalue : temp;
							}
						}
					}
				}
			}
		} else {
			return defvalue;
		}
	};

	/**
	 * -------------------------------------------------------------
	 * 日期转换为易识别的字符串
	 * @param showTime = 是否显示时间
	 * @param useJust = 是否使用'刚刚'
	 * -------------------------------------------------------------
	 * 如果当前时间是2014-12-12 12:34:56
	 * Dates.toReadable("2014-12-12 12:34:00"); = 刚刚
	 * Dates.toReadable("2014-12-12 10:20:56"); = 10:20
	 * Dates.toReadable("2014-12-12 20:30:56"); = 20:30
	 * Dates.toReadable("2014-12-11 00:00:00"); = 昨天
	 * Dates.toReadable("2014-12-11 23:59:59"); = 昨天
	 * Dates.toReadable("2014-12-10 00:00:00"); = 前天
	 * Dates.toReadable("2014-12-13 00:00:00"); = 明天
	 * Dates.toReadable("2014-12-14 00:00:00"); = 后天
	 * Dates.toReadable("2014-12-09 12:34:56"); = 12月9日
	 * Dates.toReadable("2014-12-20 12:34:56"); = 12月20日
	 * Dates.toReadable("2003-12-12 12:34:56"); = 03年12月12日
	 * -------------------------------------------------------------
	 * Dates.toReadable("2014-12-12 12:34:00", true); = 刚刚
	 * Dates.toReadable("2014-12-12 12:34:00", true, false); = 今天12:34
	 * Dates.toReadable("2014-12-12 10:20:56", true); = 今天10:20
	 * Dates.toReadable("2014-12-12 20:30:56", true); = 今天20:30
	 * Dates.toReadable("2014-12-11 00:00:00", true); = 昨天00:00
	 * Dates.toReadable("2014-12-11 23:59:59", true); = 昨天23:59
	 * Dates.toReadable("2014-12-10 12:34:00", true); = 前天12:34
	 * Dates.toReadable("2014-12-13 12:34:00", true); = 明天12:34
	 * Dates.toReadable("2014-12-14 12:34:00", true); = 后天12:34
	 * Dates.toReadable("2014-12-09 12:34:56", true); = 12月9日12:34
	 * Dates.toReadable("2014-12-20 12:34:56", true); = 12月20日12:34
	 * Dates.toReadable("2003-12-12 12:34:56", true); = 03年12月12日12:34
	 * -------------------------------------------------------------
	 * author: 赵卉华 / 2014-12-12
	 * -------------------------------------------------------------
	 */
	var DAY = 24 * 60 * 60 * 1000;
	var DATES = { '-2':'前天', '-1':'昨天', '0':'今天', '1':'明天', '2':'后天' };
	var toReadable = function(date, showTime, useJust) {
		var d = Dates.parse(date);
		if (isNaN(d)) { return ""; }
		var now = new Date();
		var offset = Math.floor(d.getTime() / DAY) - Math.floor(now.getTime() / DAY);
		if (useJust != false && now.getTime() > d.getTime() && now.getTime() - d.getTime() < 3 * 60 * 1000) {
			return "刚刚"; // 3分钟以内
		} else if (Math.floor(offset) == 0) {
			return (showTime ? DATES[0] : "") + Dates.format(d, 'HH:mm'); // 今天
		} else {
			if (offset in DATES) {
				return DATES[offset] + (showTime ? Dates.format(d, 'HH:mm') : '');
			} else if (d.getFullYear() != now.getFullYear()) {
				return Dates.format(d, showTime ? 'yy年M月d日HH:mm' : 'yy年M月d日'); // 跨年了
			} else {
				return Dates.format(d, showTime ? 'M月d日HH:mm' : 'M月d日');
			}
		}
	};

	/**
	 * -------------------------------------------------------------
	 * 获取本周第一天(星期一)和最后一天(星期天)
	 * Dates.getFirstDayOfWeek("2016-03-01");  = 2016-02-29
	 * Dates.getLastDayOfWeek ("2016-03-01");  = 2016-03-06
	 * -------------------------------------------------------------
	 * 获取本月第一天和最后一天
	 * Dates.getFirstDayOfMonth("2016-02-20"); = 2016-02-01
	 * Dates.getLastDayOfMonth ("2016-02-20"); = 2016-02-29
	 * -------------------------------------------------------------
	 * author: 赵卉华 / 2016-12-07
	 * -------------------------------------------------------------
	 */
	var getFirstDayOfWeek = function(date) {
		var d = parse(date, new Date());
		var index  = d.getDay() || 7;
		d.setDate(d.getDate() + 1 - index);
		return new Date(d.getFullYear(), d.getMonth(), d.getDate());
	};
	var getLastDayOfWeek = function(date) {
		var d = parse(date, new Date());
		var index  = d.getDay() || 7;
		d.setDate(d.getDate() + 7 - index);
		return new Date(d.getFullYear(), d.getMonth(), d.getDate());
	};
	var getFirstDayOfMonth = function(date) {
		var d = parse(date, new Date());
		return new Date(d.getFullYear(), d.getMonth(), 1);
	};
	var getLastDayOfMonth = function(date) {
		var d = parse(date, new Date());
		// 下一个月的第一天的前一天, 即本月最后一天
		return new Date(d.getFullYear(), d.getMonth() + 1, 0);
	};

	/**
	 * -------------------------------------------------------------
	 * 计算相对日期
	 * Dates.calculate("2016-03-01", "-1d");  = 2016-02-29
	 * Dates.calculate("2016-03-01", "-2m");  = 2016-01-01
	 * Dates.calculate("2016-03-01", "-3y");  = 2013-03-01
	 * Dates.calculate("2016-03-01", "+2d");  = 2016-03-03
	 * Dates.calculate("2016-03-01", "-2m+3d");  = 2016-01-04
	 * -------------------------------------------------------------
	 * author: 赵卉华 / 2016-12-08
	 * -------------------------------------------------------------
	 */
	var calculate = function(date, option) {
		var d = parse(date, new Date());
		if ($.dt.isNumeric(option)) {
			d.setDate(d.getDate() + option * 1);
			return new Date(d.getFullYear(), d.getMonth(), d.getDate());
		} else if ($.dt.isString(option)) {
			// "-3d"/"-2m"/"+1y"之类的相对日期
			var ptn = /([\+\-]?\d+)\s*([a-zA-Z]+)/g;
			for (var i = 0, matcher = null; true;)  {
				matcher = ptn.exec(option);
				if (!matcher) {
					var temp = option.substring(i);
					if (temp && !/\s*/.test(temp)) {
						$.log.error("RelativeDate option '" + option + "' format error!")
						return undefined;
					}
					break;
				}
				var index = matcher.index;
				var temp = option.substring(i, index);
				if (temp && !/\s*/.test(temp)) {
					$.log.error("RelativeDate option '" + option + "' format error!")
					return undefined;
				}
				var number = matcher[1] * 1;
				var type = matcher[2];
				switch(type) {
					case 'y':
						d.setFullYear(d.getFullYear() + number);
						break;
					case 'm':
						d.setMonth(d.getMonth() + number);
						break;
					case 'd':
						d.setDate(d.getDate() + number);
						break;
					default:
						$.log.error("RelativeDate option type '" + type + "' error!")
						return undefined;
				}
				i = index + matcher[0].length;
			}
			return new Date(d.getFullYear(), d.getMonth(), d.getDate());
		}
		$.log.error("RelativeDate option format error!")
		return undefined;
	};
	return {
		FORMAT:FORMAT, format:format, parse:parse, 
		toReadable:toReadable, calculate:calculate,
		getFirstDayOfWeek:getFirstDayOfWeek, getLastDayOfWeek:getLastDayOfWeek,
		getFirstDayOfMonth:getFirstDayOfMonth, getLastDayOfMonth:getLastDayOfMonth
	};
})();







(function($) {
	/**
	 * -------------------------------------------------------------<br>
	 * 解析data-options<br>
	 * -------------------------------------------------------------<br>
	 * $(".xxx").zoptions() --> get "options"
	 * $(".xxx").zoptions(options) --> set "options"
	 * $(".xxx").zoptions("key") --> get "key"
	 * $(".xxx").zoptions("key", options) --> set "key"
	 * -------------------------------------------------------------<br>
	 * <div class="xxx" data-options="text:'baidu', url:'http://baidu.com'"></div><br>
	 * 获取options<br>
	 * $(".xxx").zoptions() --> { text:'baidu', url:'http://baidu.com' }<br>
	 * 设置options<br>
	 * $(".xxx").zoptions({ id:1, callback:fn })<br>
	 * $(".xxx").zoptions() --> { text:'baidu', url:'http://baidu.com', id:1, callback:fn }<br>
	 * -------------------------------------------------------------<br>
	 * @author 赵卉华<br>
	 * date: 2016-08-18<br>
	 * -------------------------------------------------------------<br>
	 */
	var parseOptions = function (options) {
        if (!options) {
        	return {};
        } else {
        	options = $.trim(options);
        	if (/^\w+$/.test(options)) {
        		if (options === "true") { return true; }
        		else if (options === "false") { return false; }
        		else if ($.dt.isNumeric(options)) { return options * 1; }
        		else { return options; }
        	}
            if (!options.startsWith("{") && !options.startsWith("[")) {
            	options = "{" + options + "}";
            }
            return (new Function("return " + options))();
        }
	};
	$.fn.zoptions = function(key, resetOptions) {
		if (key == undefined || $.isPlainObject(key)) {
			resetOptions = key;
			key = "options";
		}
		if (resetOptions !== undefined) {
			return this.each(function() {
				$.data(this, key, resetOptions);
				me.attr("data-" + key, $.isPlainObject(options) || $.isArray(options) ? JSON.stringify(options) : options);
			});
		} else {
			var me = $(this);
			var options = $.data(me, key) || me.attr("data-" + key);
			if (!options) {
				options = {};
				$.data(me, key, options);
			} else if (typeof(options) == "string") {
				options = parseOptions(options);
				// me.data("options", {})将会清空data-options属性, 导致[data-options]选择符找不到节点
				$.data(me, key, options);
			}
			return options;
		}
	};
})(jQuery);



/**
 * -----------------------------------------------------------
 * 不可编辑
 * -----------------------------------------------------------
 * <input type="text" class="datepicker uneditable" />
 * $("input.uneditable").uneditable(true);
 * -----------------------------------------------------------
 * author: 赵卉华 / 2016-09-26
 * -----------------------------------------------------------
 */
(function($) {
	var key = "__uneditable__";
	var uneditable = function (e) {
		if (e.keyCode != 9 && e.keyCode != 13) { 
			e.preventDefault();
		}
	};
	$.fn.uneditable = function(enable) {
		if (enable == undefined) {
			return this.data(key);
		} else {
			return this.each(function() {
				var me = $(this);
				var older = me.data(key);
				if (enable && older == undefined) {
					me.bind("keydown.uneditable", uneditable).data("uneditable", true);
				} else if (!enable && older != undefined) {
					me.unbind("keydown.uneditable", uneditable).removeData("uneditable");
				}
			});
		}
	};
})(jQuery);


(function($) {
	/**
	 * -------------------------------------------------------------
	 * 增强AJAX请求, loading, 防重复提交, 支持复杂对象参数, 表单校验
	 * 提交后检查返回码并提示错误, 只有成功才回调
	 * -------------------------------------------------------------
	 * var data = {
	 *     "name":"某公司",
	 *     "address":{"city":"南京"},
	 *     "users":[
	 *         {"name":"张三","addresses":[{"city":"南京"}]},
	 *         {"name":"李四","addresses":[{"city":"合肥"},{"city":"南京"}]}
	 *     ]
	 * };
	 * -------------------------------------------------------------
	 * $.zajax(url, [data], [loading], [callback|options]);
	 * $.zajax(form, [url], [data], [loading], [callback|options]);
	 * -------------------------------------------------------------
	 * $(button).zajax(url, [data], [loading], [callback|options]);
	 * $(button).zajax(form, [url], [data], [loading], [callback|options]);
	 * -------------------------------------------------------------
	 * 参数说明:
		button: 用于防止重复提交, 和查找form
		url: string|{GET:url}|{POST:url}, 如果是string, GET|POST由配置项决定: $.zajax.defaults.options.type
		form: DomElement|jQuery对象, 需要提交的表单, 如果url为空, 则url=form.action,GET|POST=form.method
		data: string|json, 需要提交的数据, 如果有form又有data, 则合并到一起提交
		loading: true|false, 是否显示正在加载
		callback: function, 成功时的回调函数
		options: { // 选项
			O | OPTIONS: true, // 选项标志, 用于区分options和data, 如果有succ或fail则不需要填写
			succ: function(json), // 成功回调函数
			fail: function(json), // 失败回调函数
			type: "POST",
			dataType: "json",
			loading: true | { show:true, stop:true }, // 是否显示正在加载
			validate: true, // 是否执行表单校验
			readForm: true, // 是否从form中读取请求数据, 如果button在form中, 也会读取
			check: true, // 是否检查返回码
			prepare: true, // 请求前是否执行预处理
			finish: true, // 是否执行请求完成后的处理函数
			succTips: true, // 是否显示成功提示
			failTips: true // 是否显示失败提示
		}
	 * -------------------------------------------------------------
	 * @author 赵卉华  / 2016-08-18 / 2016-10-13 
	 * -------------------------------------------------------------
	 */
	$.fn.zajax = function() {
		var args = arguments;
		return this.each(function() {
			zajax.apply(this, args);
		});
	};

	$.zajax = function(url, data, loading, fn) {
		zajax.apply(this, arguments);
	};

	var o = $.zajax.defaults = {
		fn: {
			loading: { show:undefined, stop:undefined }, // 显示正在加载的函数
			upload: undefined, // 文件上传
			validate: undefined, // 表单校验
			readForm: undefined, // 从form中读取请求数据, 默认实现涉及form和data合并, 比较长, 写在下面
			check: undefined, // 检查返回码的函数
			prepare: undefined, // 请求提交前的预处理函数
			finish: undefined, // 请求完成后的处理函数(无论成功失败都会调用), 在callback之前
			succTips: undefined,
			failTips: undefined
		},
		options: {
			succ: undefined, // 成功回调函数
			fail: undefined, // 失败回调函数
			type: "POST",
			dataType: "json",
			loading: true, // 是否显示正在加载
			upload: true, // 是否执行文件上传
			validate: true, // 是否执行表单校验
			readForm: true, // 是否从form中读取请求数据, 如果button在form中, 也会读取
			check: true, // 是否检查返回码
			prepare: true, // 请求前是否执行预处理
			finish: true, // 是否执行请求完成后的处理函数
			succTips: true, // 是否显示成功提示
			failTips: true, // 是否显示失败提示
			timeout:10000 //默认10秒超时
		}
	};

	var zajax = function() {
		var self = this;

		// e: button, form, url, data, loading, succ, fail, ...
		var e = parseArgs.apply(this, arguments);
		var $elem = e.button || e.form || $([]);
		if ($elem.attr("data-submit-doing")) {
			// 防止重复提交
			// 不能用disabled
			// 1. <a>标签作为按钮时disabled不起作用
			// 2. disabled的按钮无法获取焦点, 导致button.msger()错误提示出现问题
			return;
		}

		var execute = function(finish, callback, showTips, result, json) {
			// 清除正在提交
			$elem.removeAttr("data-submit-doing");
			if ($.isFunction(e[finish])) {
				e[finish].call(e, result); // 请求完成后的处理函数
			}
			if ($.isFunction(e[callback])) {
				e[callback].call(e, json); // 回调
			}
			if ($.isFunction(e[showTips])) {
				e[showTips].call(e, json); // 提示
			}
		};
		var success = function(json) {
			if (!$.isFunction(e.check) || e.check(json)) {
				execute("finish", "succ", "succTips", true, json);
			} else {
				$.log.error(json);
				execute("finish", "fail", "failTips", false, json);
			}
		};
		var error = function(xhr){
			// 用户取消时(如在iframe中的请求, iframe被移除)
			// 此时可能会有xhr.result, 如果有结果并且结果是成功的, 就不应该提示错误了
			execute("finish", "fail", "failTips", false);
			if (xhr.result && $.isFunction(e.check) && e.check(xhr.result)) {
				$.log.error(xhr.result);
			} else {
				$.log.error(arguments);
			}
		};
		var beforeSend = function() {
			$elem.attr("data-submit-doing", "true");
			if (e.loading && $.isFunction(e.loading.show)) {
				e.loading.show.call(e);
			}
		};
		var complete = function(){
			// 清除正在加载
			if (e.loading && $.isFunction(e.loading.stop)) {
				e.loading.stop.call(e);
			}
		};
		$.extend(e, { success:success, error:error, beforeSend:beforeSend, complete:complete });

		if (e.readForm && (e.button || e.form)) {
			// 如果有button而没有form, 自动查找form
			if (e.button && !e.form) {
				var form = e.button.closest("form");
				if (form.length) { e.form = form; }
			}

			// 如果有form而没有url, 则url=form.action,type=form.method
			if (e.form && !e.url) {
				e.url = e.form.attr("action");
				var method = e.form.attr("method");
				if (method) { e.type = method.toUpperCase(); }
			}
		}

		var uploadCallback = function() {
			// 从form中读取请求数据
			if ($.isFunction(e.readForm) && e.form) {
				e.readForm.call(e);
			}
	
			var validateCallback = function() {
				// 发送请求前修改参数的机会
				if ($.isFunction(e.prepare)) {
					e.prepare.call(e);
				}
	
				if (!e.url) {
					throw new Error("ajax url is undefined.");
				} else {
					e.url += (e.url.indexOf("?") < 0 ? "?" : "&") + "_=" + Randoms.number(8);
				}
				if (e.data) {
					e.data = $.zhh.jsonToParams(e.data);
				}
				// 向服务器发送请求
				$.ajax(e);
			};
	
			if (e.form && $.isFunction(e.validate)) {
				// 表单校验
				e.validate.call(e, validateCallback);
			} else {
				validateCallback();
			}
		};
		if (e.form && $.isFunction(e.upload)) {
			// 文件上传
			e.upload.call(e, uploadCallback);
		} else {
			uploadCallback();
		}
	};

	// 从form中读取请求数据, 如果有data则合并
	o.fn.readForm = function() {
		var e = this;

		if (!e.data) {
			e.data = e.form.serializeJson();
		} else {
			// 判断e.data是平面格式还是深度格式
			// 平面格式: { "address.city":"南京", "users[0].name":"张三" }
			// 深度格式: { "address":{"city":"南京"}, "users":[ { "name":"张三" } ] }
			var deep = false;
			for (var key in e.data) {
				if ($.isPlainObject(e.data[key]) || $.isArray(e.data[key])) {
					deep = true; break;
				}
			}
			if (e.form) { $.extend(e.data, e.form.serializeJson(deep)); }
		}
	};

	var parseArgs = function() {
		var fields = "this, button, form, url, data, loading, succ, fail";
		var vars = $.zhh.parseArgs.call(this, arguments, fields, false, function(field, value) {
			if ($.dt.isFunction(value)) {
				return this.succ ? "fail" : "succ";
			} else if ($.dt.isBoolean(value)) {
				return "loading";
			} else if (isUrl(value)) {
				return "url";
			} else if ($.dt.isString(value)) {
				return "data"; // value = "key=value&x=xxx";
			} else if (isOptions(value)) {
				return { copy:value };
			} else if (isUrlObject(value, "GET")) {
				return { field:"url", value:value.GET };
			} else if (isUrlObject(value, "POST")) {
				return { field:"url", value:value.POST };
			} else if ($.dt.isPlainObject(value)) {
				if (!this.data) { this.data = $.extend(true, {}, value); }
				else { $.extend(true, this.data, value); }
			} else if ($.dt.isElement(value)) {
				var $elem = $(value);
				if ($elem.length) {
					return { field:$elem.is("form") ? "form" : "button", value:$(value) };
				}
			}
		});

		var e = $.extend(true, {}, o.options, vars);
		// 等于true的选项替换为默认的处理函数, { check:true, loading:{ show:true, stop:true }, ... }
		trueToDefault(e.loading, o.fn.loading);
		trueToDefault(e, o.fn);

		return e;
	};
	var isUrl = function(value) {
		// 字符串参数, 问号前面没有=就是url, 有=就是data
		return $.dt.isString(value) && /^[^\?\=]+(\?.*)?$/.test(value);
	};
	var isUrlObject = function(value, type) {
		return $.dt.isPlainObject(value) && (type in value);
	};
	var isOptions = function(value) {
		return $.dt.isPlainObject(value) && (value.O === true || value.OPTIONS === true || functionInJson(value));
	};
	var functionInJson = function(value) {
		if ($.dt.isPlainObject(value)) {
			for (var i in value) {
				if ($.dt.isFunction(value[i])) {
					return true;
				}
			}
		}
		return false;
	};
	var trueToDefault = function(e, def) {
		if (!$.dt.isPlainObject(e)) { return; }
		for (var key in def) {
			if (e[key] === true && !$.dt.isBoolean(def[key])) {
				e[key] = def[key];
			}
		}
	};
})(jQuery);


(function($) {
	/**
	 * -----------------------------------------------------------
	 * 动态加载JavaScript和CSS
	 * $.getScript()有个缺点, 动态加载的JS在DEBUG时找不到源码!
	 * -----------------------------------------------------------
	 * $.zhh.load("http://.../script/xxx.js");
	 * $.zhh.load("http://.../style/xxx.css");
	 * -----------------------------------------------------------
	 * author: 赵卉华 / 2015-12-19
	 * -----------------------------------------------------------
	 * 加载HTML
	 * $("xxx").zload("http://.../xxx.html");
	 * -----------------------------------------------------------
	 * author: 赵卉华 / 2016-09-27
	 * -----------------------------------------------------------
	 */

	var SCRIPTS = {};
	var STYLES = {};
	var OWNER = $(document.body);
	var KEY = "__load_resource__";
	var QUERY = /\?.*$/;
	
	$(function() {
		$("script[src]").each(function() {
			var url = $(this).attr("src");
			SCRIPTS[url.replace(QUERY, "")] = this;
		});
		$("link[href]").each(function() {
			var url = $(this).attr("href");
			STYLES[url.replace(QUERY, "")] = this;
		});
	});

	var loadCss = function(options, callback){
		var key = options.url.replace(QUERY, "");
		if (STYLES[key]) {
			if (callback) { callback.call(STYLES[key]); }
			return;
		}
		var link = document.createElement('link');
		link.href = options.url;
		link.rel = 'stylesheet';
		link.type = 'text/css';
		STYLES[key] = link;
		// 加载到appendTo或<head>中
		var parent = options.appendTo || document.getElementsByTagName("head");
		if (!parent.appendChild) { parent = parent[0]; }
		parent.appendChild(link);
		if (callback) { callback.call(link); }
	};
	
	var loadJs = function(options, callback) {
		var key = options.url.replace(QUERY, "");
		if (SCRIPTS[key]) {
			callback.call(SCRIPTS[key]);
			return;
		}
		var done = false;
		var script = document.createElement('script');
		script.src = options.url;
		script.type = 'text/javascript';
		script.onload = script.onreadystatechange = function(){
			if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')){
				done = true;
				this.onload = this.onreadystatechange = null;
				callback.call(this);
			}
		};
		SCRIPTS[key] = script;
		// 加载到appendTo或<head>中
		var parent = options.appendTo || document.getElementsByTagName("head");
		if (!parent.appendChild) { parent = parent[0]; }
		parent.appendChild(script);
	};

	var handleScriptAndStyle = function(text, rich) {
		// 解决动态加载的JS在DEBUG时找不到源码的问题!
		// 用setTimeout解决<link>加载完成之前,JS写入的<style>内容不生效导致宽高计算出错的问题!
		var ptn = /<(script|link)[^>]*(?:src|href)\s*=\s*['"]([^'">]+)['"][^>]*\/?>(?:\s*<\/(?:script|link)>)?/gim;
		var scripts = [];
		var links = [];
		var html = [];
		for (var i = 0, matcher = null; true;)  {
			matcher = ptn.exec(text);
			if (!matcher) {
				html.push(text.substring(i));
				break;
			}
			// 取index, 文档都讲有lastIndex, 但实际测试只有index(Chrome,FF)
			// IE有lastIndex(=matcher.index+matcher[0].length), (IE8,IE11)
			// http://www.w3schools.com/jsref/jsref_obj_regexp.asp
			// http://www.w3school.com.cn/jsref/jsref_obj_regexp.asp
			// http://www.w3school.com.cn/jsref/jsref_exec_regexp.asp
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
			var index = matcher.index;
			if (!/data-zload-ignore=['"]true["']/ig.test(matcher[0])) {
				if (matcher[1].toLowerCase() == "script") {
					scripts.push(matcher[2]);
				} else {
					if (/rel=['"]stylesheet["']|type=['"]text\/css["']/ig.test(matcher[0])) {
						links.push(matcher[2]);
					}
				}
			}
			html.push(text.substring(i, index));
			html.push("<!-- " + matcher[0] + " -->");
			i = index + matcher[0].length;
		}
		if (rich) {
			var self = this;
			setTimeout(function() {
				$.zhh.load({ url:links, appendTo:self });
				$.zhh.load({ url:scripts, appendTo:document.body });
			}, 0);
		}
		return html.join("");
	};
	var htmlOptions = {
		type:"GET",
        cache: false,
        rich: true, // 是否加载样式和脚本
        dataType: "html",
        bodyRule: /<body[^>]*>((.|[\r\n])*)<\/body>/im
	};
	var loadHtml = function(options) {
		var self = options.appendTo;
		$(self).children("link[href]").each(function() {
			var url = $(this).attr("href");
			STYLES[url.replace(QUERY, "")] = undefined;
		});
		var data = $.extend(true, {}, htmlOptions, options, {
			dataFilter: function(data, type) {
				if (options.dataFilter) {
					data = options.dataFilter.call(self, data, type);
				}
				if (data.length == 0) { return data; }
				var bodyRule = options.bodyRule || htmlOptions.bodyRule;
				if (!$.isArray(bodyRule)) { bodyRule = [bodyRule]; }
				var html = handleScriptAndStyle.call(self, data, options.rich);
				// 取<body>的内容
				for (var i = 0; i < bodyRule.length; i++) {
					var matcher = bodyRule[i].exec(html);
					if (matcher) {
						return matcher[1];
					}
				}
				return html;
			},
			success: function(data) {
				$(self).html(data);
				// 队列, 以保证加载完JS再执行初始化
				setTimeout(function() {
					OWNER.promise(KEY).done(function() {
						$(self).zinit();
					});
				}, 0);
				if (options.success) {
					options.success.call(self);
				}
			}
		});
        $.ajax(data);
	};

	var loadRes = function(options, callback) {
		if (/\.css(\?.*)?$/i.test(options.url)) {
			loadCss(options, callback);
		} else if (/\.js(\?.*)?$/i.test(options.url)) {
			// 队列, 以保证js的加载顺序
			OWNER.queue(KEY, function() {
				loadJs(options, function() {
					if (callback) { callback.call(this); }
					OWNER.dequeue(KEY);
				});
			});
		} else {
			loadHtml(options, callback);
		}
	};
	
	if (!$.zhh) { $.zhh = {}; }
	$.zhh.load = function(options, callback) {
		if (typeof(options) == "string" || $.isArray(options)) {
			options = { url:options };
		}
		if ($.isArray(options.url)) {
			$.each(options.url, function(i, s) {
				loadRes($.extend({}, options, { url:s }), callback);
			});
		} else {
			loadRes(options, callback);
		}
		OWNER.dequeue(KEY);
	};

	$.fn.zload = function(options, callback) {
		if (typeof(options) == "string" || $.isArray(options)) {
			options = { url:options };
		}
		options.appendTo = this[0];
		$.zhh.load(options, callback);
		return this;
	};
})(jQuery);


/**
 * -----------------------------------------------------------
 * 插件初始化, 让所有的初始化处理都可以多次调用
 * -----------------------------------------------------------
	// 初始化非jQuery插件, 以前这么写
	if (window.baidu && baidu.template) {
		// 设置左右分隔符为 <# #>
		baidu.template.LEFT_DELIMITER='<#';
		baidu.template.RIGHT_DELIMITER='#>';
	}
	// 现在要改成这样, 成功之后要返回true
	$.fn.zinit.plugins.add(function() {
		if (window.baidu && baidu.template) {
			// 设置左右分隔符为 <# #>
			baidu.template.LEFT_DELIMITER='<#';
			baidu.template.RIGHT_DELIMITER='#>';
			return true;
		}
	});
 * -----------------------------------------------------------
	// 初始化jQuery插件, 以前这么写
	$.fn.datepicker.defaults.format = "yyyy-mm-dd";
	$.fn.datepicker.defaults.language = "zh-CN";
	// 现在要改成这样
	$.fn.zinit.plugins.add("datepicker", function() {
		this.defaults.format = "yyyy-mm-dd";
		this.defaults.language = "zh-CN";
	});
 * -----------------------------------------------------------
	// 初始化jQuery节点, 以前这么写
	$(function() {
	    $(".datepicker").each(function() {
	    	var me = $(this);
	    	me.datepicker(me.zoptions());
	    });
	});
	// 现在要改成这样
	$.fn.zinit.nodes.add(".datepicker", "datepicker");
	// 或者
	$.fn.zinit.nodes.add(".datepicker", function() {
		var me = $(this);
		me.datepicker(me.zoptions());
	});
 * -----------------------------------------------------------
 * author: 赵卉华 / 2016-09-27
 * -----------------------------------------------------------
 */
(function($) {
	var KEY = "__z_init__"; // 防重复初始化
	var nodes = []; // { key:string, fn:string or function }
	var plugins = []; // { [key:string,] fn:function }
	$.fn.zinit = function(callback) {
		$.each(plugins, function() {
			var type = this.type;
			var fn = this.fn;
			if (this.disabled != true) {
				if (type) {
					if ($.fn[type]) {
						this.disabled = true;
						fn.call($.fn[type]);
					}
				} else {
					this.disabled = fn();
				}
			}
		});

		var box = this;
		$.each(nodes, function() {
			var type = this.type;
			var fn = this.fn;
			if (typeof(fn) == "string") {
				if ($.fn[fn]) {
					box.find(type).each(function() {
				    	var me = $(this);
				    	if (me.data(KEY + type)) { return true; }
				    	me.data(KEY + type, true);
				    	me[fn](me.zoptions());
				    });
			    }
			} else {
				box.find(type).each(function() {
			    	var me = $(this);
			    	if (me.data(KEY + type)) { return true; }
			    	me.data(KEY + type, true);
			    	fn.call(this);
			    });
			}
		});
		if (callback) { callback.call(this); };
	};
	$.fn.zinit.nodes = {
		add: function(selector, fn) {
			nodes.push({ type:selector, fn:fn });
		}
	};
	$.fn.zinit.plugins = {
		add: function(type, fn) {
			if ($.isFunction(type)) {
				plugins.push({ fn:type });
			} else {
				plugins.push({ type:type, fn:fn });
			}
		}
	};
})(jQuery);


(function($) {
	// 开始倒计时
	// $(xxx).countdown("{second}后重试", 10, function() {  });
	// <a class="send" data-countdown="发送({second})">发送</a>
	// $("a.send").countdown(10, function() {  });
	// 结束倒计时
	// $(xxx).countdown("clear");
	$.fn.countdown = function(hint, times, fn) {
		return this.each(function() {
			var dom = $(this);
			if (typeof(hint) == "number") {
				fn = times; times = hint;
				hint = dom.data("countdown") || "{second}";
			}
			var original = dom.data("original-html");
			if (!original) {
				original = dom.html();
				dom.data("original-html", original);
			}
			var timer = dom.data("countdown-timer");
			if (timer) { window.clearInterval(timer); }
			if (hint == "clear") {
				dom.html(original);
			} else {
				var exec = function() {
					var text = hint.replace(/\{second\}/g, times--);
					dom.html(text);
					if (times == 0) {
						clearInterval(timer);
						dom.html(original);
						fn && fn.call(dom);
					}
				};
				exec();
				timer = setInterval(exec, 1000);
				dom.data("countdown-timer", timer);
			}
		});
	};
})(jQuery);
