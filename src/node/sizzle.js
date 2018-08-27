// 负责查找结点
function _sizzle(selector, context) {

	var temp = [], flag;
	if (typeof selector === 'string') {
		// 去掉回车，空格和换行
		selector = (selector + "").trim().replace(/[\n\f\r]/g, '');

		// 支持的选择器包括：
		// #id .class [attr='value'] tagName
		// 包括任意组合
		// 如果选择全部元素，只可以传递一个*
		if (selector === "*") {
			return context.getElementsByTagName('*');
		}

		// 用于判断是否为合法选择器组合
		var whitespace = _regexp.whitespace,
			identifier = _regexp.identifier,
			attrReg = "\\[" + whitespace + "{0,}" + identifier + "(?:" + whitespace + "{0,}=" + whitespace + "{0,}(\\\'|\\\"){0,1}" + identifier + "\\1{0,1}){0,1}" + whitespace + "{0,}\\]",
			regexp = new RegExp("^(?:" + identifier + "){0,1}(?:(?:#|\\.)" + identifier + "|" + attrReg + "){0,}$");
		if (regexp.test(selector)) {

			// 分离出来四大选择器
			// 然后初始化容器
			var targetNodes,
				nameReg = "\\[" + whitespace + "{0,}name(?:" + whitespace + "{0,}=" + whitespace + "{0,}(\\\'|\\\"){0,1}(" + identifier + ")\\1{0,1}){1,1}" + whitespace + "{0,}\\]",
				id = selector.match(new RegExp('#' + identifier, 'g')),
				cls = selector.match(new RegExp('\\.' + identifier, 'g')),
				tag = selector.match(new RegExp('^' + identifier)),
				attr = selector.match(new RegExp(attrReg, 'g')),
				nattr = selector.match(new RegExp(nameReg));
			if (id) {
				if (id.length > 1) {
					return [];
				}
				// IE 6+, Firefox 3+, Safari 3+, Chrome 4+, and Opera 10+
				// 如果使用了id选择器，自动在全局查找
				targetNodes = document.getElementById((id.shift(0) + "").replace(/^#/, ''));
				targetNodes = targetNodes ? [targetNodes] : [];
			} else if (context.getElementsByClassName && cls) {

				// IE 9+, Firefox 3+, Safari4+, Chrome 4+, and Opera 10+
				targetNodes = context.getElementsByClassName((cls.shift(0) + "").replace(/^\./, ''));
			} else if (tag) {
				targetNodes = context.getElementsByTagName(tag.shift(0));
			} else if (nattr) {
				targetNodes = context.getElementsByName(nattr[2]);
			} else {
				targetNodes = context.getElementsByTagName('*');
			}

			// 利用余下条件进行过滤
			// 只需要过滤class、tag和attr
			var t, x, y, f,
				attrSplit = "^\\[" + whitespace + "{0,}(" + identifier + ")(?:" + whitespace + "{0,}=" + whitespace + "{0,}(?:\\\'|\\\"){0,1}(" + identifier + ")(?:\\\'|\\\"){0,1}){0,1}" + whitespace + "{0,}\\]$",
				attrSplitReg = new RegExp(attrSplit);
			for (flag = 0; flag < targetNodes.length; flag++) {
				f = true;
				if (tag && tag.length > 0) {

					// 由于标签tagName存在大小写的不同
					// 比较的时候直接统一用大写
					if ((tag[0] + "").toUpperCase() !== (targetNodes[flag].tagName + "").toUpperCase()) {
						continue;
					}
				}

				t = " " + targetNodes[flag].getAttribute('class') + " ";
				for (x = 0; f && cls && x < cls.length; x++) {
					if (t.search(" " + (cls[x] + "").replace(/\./, '') + " ") < 0) {
						f = false;
						break;
					}
				}

				for (x = 0; f && attr && x < attr.length; x++) {
					t = attrSplitReg.exec(attr[x]),
						y = targetNodes[flag].getAttribute(t[1]);
					// 属性值写的时候需要相等
					if (y === null || (t[2] && y != t[2])) {
						f = false;
						break;
					}
				}
				if (f)
					temp.push(targetNodes[flag]);
			}

			return temp;
		}

		// 其它情况一律认为希望把字符串变成结点
		else {
			try {
				return [_toNode(selector)];
			} catch (e) {
				return [];
			}
		}

	}
	// 如果是结点
	else if (selector && (selector.nodeType === 1 || selector.nodeType === 11 || selector.nodeType === 9)) {
		return [selector];
	}
	// 如果是结点集合
	else if (selector && (selector.constructor === Array || selector.constructor === HTMLCollection || selector.constructor === NodeList)) {
		for (flag = 0; flag < selector.length; flag++) {
			if (selector[flag] && (selector[flag].nodeType === 1 || selector[flag].nodeType === 11 || selector[flag].nodeType === 9)) {
				temp.push(selector[flag]);
			}
		}
		return temp;
	}
	// 如果是clay对象
	else if (selector && selector.constructor === clay) {
		return selector;
	} else {
		return [];
	}

}
