/**
 * 插件初始化
 * zhaohuihua, 2016-10-29
 */
// 初始化
$(function() {
	$(window.document).zinit();
});

+function($) {
	$.fn.popover = function(state, anchor, follow, cls) {
		return this.each(function() {
			mui(this).popover(state, anchor, follow, cls);
		});
	};

	// 禁止表单自动提交, 用ajax提交
	$.fn.zinit.nodes.add("form", function() {
		$(this).on("submit", function(e) { e.preventDefault(); });
	});

	// 跳转至下一页
	$.fn.zinit.nodes.add("body", function() {
		var click = window.mui ? "tap" : "click";
		$(this).on(click, "[data-nav-next]", function(e) {
			e.preventDefault();
			Utils.nav.next($(this).attr("data-nav-next"));
		});
		$(this).on(click, "a.nav-next[href]", function(e) {
			e.preventDefault();
			Utils.nav.next($(this).attr("href"));
		});
	});

	var fillParams = function(wrapper, type, params) {
		if ($.isEmptyObject(params)) { return; }
		var me = $(wrapper);
		var key = me.attr(type);
		var value = params[key];
		if (value != undefined) {
			if (me.is("input, select, textarea")) {
				me.val(value);
			} else {
				me.html(value);
			}
		}
	};
	// 向element填充上一页面传递的参数
	$.fn.zinit.nodes.add("[data-pass-params]", function() {
		fillParams(this, "data-pass-params", Utils.getPassParams());
	});
	// 向element填充hash参数
	$.fn.zinit.nodes.add("[data-hash-params]", function() {
		fillParams(this, "data-hash-params", $.getHashParams());
	});

	$.fn.zinit.plugins.add(function() {
		if (window.baidu && baidu.template) {
			// 设置分隔符为 <# #>
			baidu.template.LEFT_DELIMITER='<#';
			baidu.template.RIGHT_DELIMITER='#>';
			// 默认不转义, 如果需要转义, 调用Utils.encodeHtml()处理
			baidu.template.ESCAPE = false;
			return true;
		}
	});

	// 日期控件, 绑定的click事件的名称, 在mui框架中要设置为tap
	$.fn.zinit.plugins.add("xcalendar", function() {
		if (window.mui) {
			this.options.bindEvent.click = "tap";
			return true;
		}
	});
	// 填充数据插件
	$.fn.zinit.plugins.add("fillData", function() {
		this.defaults.getDataValue = function(data, field) {
			return Utils.getString($.zhh.field(data, field));
		}
	});


	/**
	 * -------------------------------------------------------------
	 * OSS上传(form.zajax()上传)
	 * -------------------------------
		<form data-options="businessType:'Public', docType:'LEAVE', docTypeNm:'休假', docIdField:'quesId'">
			<div class="ln uploads do-camera" data-options="limitCount:5, imageName:'imageInfos[i].imagePath'">
				<a class="camera"></a>
			</div>
		</form>
	 * -------------------------------
	 * OSS上传(form.zupload()上传)
	 * -------------------------------
		<form class="ln uploads do-camera" data-options="limitCount:5">
			<a class="camera"></a>
		</form>

		$("form.do-camera").zupload({
			data: {
				businessType:"Public",
				docType:"LEAVE",
				docTypeNm:"休假",
				docId:"x" // 休假申请的ID
			},
			done: function(e) {
				// 全部上传完成
				// 如果没有需要上传的内容,则直接回调该函数; e = { finish:int, count:int }
				// finish = 成功完成了几个图片
				// count = 一共有几个图片需要上传
			},
			process: function(e) {
				// 进度提示
				// e = { element:DOMElement, index:int, count:int, percent:int }
				// count = 一共有几个图片需要上传
				// index = 当前上传第几个图片, 从0开始
				// percent = 当前图片上传进度, 0~100
			},
			error:function(e) {
				// 上传失败
				// e = { element:DOMElement, index:int, count:int, message:string }
				// return true则失败后仍然继续上传下一张
			}
		});
	 * -------------------------------------------------------------
	 * @author 赵卉华
	 * date: 2016-11-13
	 * -------------------------------------------------------------
	 */
	var handleInnerPlaceholder = function(params) {
		if ($.isPlainObject(params)) {
			for (var key in params) {
				var value = params[key];
				if ($.isPlainObject(value) || $.isArray(value)) {
					handleInnerPlaceholder(value);
				} else {
					var m = /^\s*\{\s*cache\s*\:\s*(\w+)\s*\}\s*$/.exec(value);
					if (!m) { continue; }
					var cacheItem = Utils.cache.get(m[1]);
					if (cacheItem != undefined) {
						params[key] = cacheItem;
					}
				}
			}
		} else if ($.isArray(params)) {
			for (var i = 0; i < params.length; i++) {
				handleInnerPlaceholder(params[i]);
			}
		}
	};
	var attachments = "attachments";
	$.fn.zinit.plugins.add(function() {
		if ($.zajax) {
			var o = $.zajax.defaults;
			o.fn.check = window.Utils && Utils.succ;
			if (window.mui) {
				o.fn.failTips = function(json) {
					// Utils.toast(json && json.message || "请求失败，请稍后再试");
					// 在进入下一级页面后, 接口正在请求就点返回, 会造成接口请求失败, chrome显示状态为(canceled)
					// 但经测试没有哪个字段能判断是网络异常还是用户取消
					// xhr.state()返回的都是rejected, xhr.status都是0
					// 经徐为功决定改为: 非业务异常都不弹出提示
					if (json && json.message) {
						Utils.toast(json && json.message);
					}
				};
			}
			o.fn.loading = {
				show: function() { $.zloading("show"); },
				stop: function() { $.zloading("hide"); }
			};
			var process = function(e) {
				// console.log("--> " + e.percent + "%");
				$.zloading("正在上传第"+(e.index+1)+"个文件("+e.percent+"%)");
			};
			var step = function(e) {
				$.log.debug(e.url);
				var $file = $(e.element);
				if ($file.is("img")) {
					if ($file.attr("data-preview-src") != undefined) {
						$file.attr("data-preview-src", e.url);
					}
				} else {
					$file.addClass("temp-disabled").attr("disabled", true);
				}
			};
			o.fn.upload = function(callback) {
				if (this.form) {
					$.zloading("正在上传第1个文件");
					if ($.zfiles) { // aliyun-oss.js, 走OSS上传
						var zo = this.form.zoptions(); // { businessType, docType, docTypeNm, docIdField }
						this.form.zupload({
							data: { businessType:zo.businessType || "Private" },
							process: process,
							step: function(e) { // { id, url }
								var ids = this.form.data(attachments);
								if (!ids) { this.form.data(attachments, ids = []); }
								ids.push(e.id);
								step.call(this, e);
							},
							done: function(e) {
								$.zloading("hide");
								callback.call(this, e);
							},
							error:function(e) {
								Utils.toast(e.message);
							}
						});
					} else { // wantu.js, 走玩兔上传
						this.form.zupload({
							token: Config.upload,
							process: process,
							step: step,
							done: function(e) {
								$.zloading("hide");
								callback.call(this, e);
							},
							error:function(e) {
								Utils.toast(e.message);
							}
						});
					}
				} else {
					callback();
				}
			};
			o.fn.finish = function(json) {
				if (this.form) {
					this.form.find(".temp-disabled").removeClass("temp-disabled").removeAttr("disabled");
					if ($.zfiles) { // 绑定表单与附件的关系
						var ids = this.form.data(attachments);
						var zo = this.form.zoptions(); // { businessType, docType, docTypeNm, docIdField }
						var docId = zo.docIdField && $.zhh.field(json, zo.docIdField);
						if (ids && docId) {
							var params = { data:{ docType:zo.docType, docTypeNm:zo.docTypeNm, docId:docId, ids:ids } };
							var succ = function() {
								console.log("绑定成功!", params);
							};
							var fail = function(e) {
								Utils.toast(e.message);
							};
							$.zfiles("relate", params, succ, fail);
						}
					}
				}
			};
			// 从form中读取请求数据, 如果有data则合并
			o.fn.readForm = function() {
				var e = this;

				if (!e.data) {
					e.data = e.form.serializeJson(true);
				} else {
					$.extend(e.data, e.form.serializeJson(true));
				}
			};
			o.fn.prepare = function() {
				// 替换占位符, 如  { workCode:'{cache:WorkCode}' }
				handleInnerPlaceholder(this.data);
				this.data = JSON.stringify(this.data);
			};
			$.extend(o.options, {
				loading: false,
				crossDomain:true,
				xhrFields: { withCredentials: true },
				contentType: 'application/json'
			});
			return true;
		}
	});
	// 文件服务
	$.fn.zinit.plugins.add(function() {
		if ($.zfiles) {
			var u = Config.upload.url;
			$.extend(true, $.zfiles.defaults, {
				check: function(json) {
					// 上传时返回结果是OSS包在data字段中的
					var resultCode = $.zhh.field(json, "retCode.type || data.retCode.type");
					if (resultCode != "S") { // 操作失败
						var message = $.zhh.field(json, "retCode.message || data.retCode.message");
						return { code:resultCode, message:message };
					}
				},
				data: {
					currUsrId: "{cache:WorkCode}", // 当前用户工号, 必填
					systemId: "AI", // 系统ID(如tianxin), 必填, 最长10位
					domain: "400"
				},
				auth: {
					url: u.base + u.auth,
					tokenField: "credentials", // 通过服务器获取授权信息后如何获取token对象
					callbackField: "callback" // 服务器回调函数的字段名
				},
				query: {
					url: u.base + u.query,
					resultField: "attachmentList"
				},
				relate: {
					url: u.base + u.relate
				},
				remark: {
					url: u.base + u.remark
				},
				upload: {
					idField: "data.id",
					urlField: "data.url",
					saveName: Config.upload.dir + Config.upload.name
				}
			});
			return true;
		}
	});

	// 下拉刷新
	$.fn.zinit.plugins.add("pullRefresh", function() {
		this.defaults.limit = 20;
	});

	// 增加照片作为附件的插件
	$.fn.zinit.nodes.add(".do-camera", "zcamera");

	// 星级评价插件通用配置及自动初始化<div class="star-rating" data-options="half:true,number:3"></div>
	$.fn.zinit.nodes.add(".star-rating, .do-raty", "raty");
	$.fn.zinit.plugins.add("raty", function() {
		this.defaults.path = Utils.getViewUrl("assets/img/star/");
		this.defaults.hints = [];
		this.defaults.targetType = "score";
		this.defaults.size = 24;
		this.defaults.bindEvent.click = "tap";
	});
}(jQuery);
