clay.layout.force = function (width, height) {

	var scope = {
		"e": {}
	}, allNode, allLink,

		// 更新库伦斥力
		updateReplusion = function () {
			var dx, dy, dsq, d, f, x, y, fx, fy;
			for (x = 0; x < allNode.length - 1; x++) {
				for (y = x + 1; y < allNode.length; y++) {
					dx = allNode[y].x - allNode[x].x;
					dy = allNode[y].y - allNode[x].y;
					if (dx != 0 || dy != 0) {
						dsq = dx * dx + dy * dy;
						d = Math.sqrt(dsq);
						// 电荷都是0.0001
						f = 0.0001 * _physics.K / dsq;
						fx = f * dx / d;
						fy = f * dy / d;
						allNode[x]._forceX -= fx;
						allNode[x]._forceY -= fy;
						allNode[y]._forceX += fx;
						allNode[y]._forceY += fy;
					}
				}
			}
		},

		// 更新弹簧引力
		updateSpring = function () {
			var flag, dx, dy, x, y, d, f, fx, fy;
			for (flag = 0; flag < allLink.length; flag++) {
				x = allLink[flag].link[0];
				y = allLink[flag].link[1];
				dx = scope.n[y].x - scope.n[x].x;
				dy = scope.n[y].y - scope.n[x].y;
				if (dx != 0 || dy != 0) {
					d = Math.sqrt(dx * dx + dy * dy);
					// 弹簧系数先写死
					f = 1 * (d - allLink[flag].length);
					fx = f * dx / d;
					fy = f * dy / d;
					// scope.n和allNode二种方式访问效果一样
					// 这是一个好效果
					scope.n[x]._forceX += fx;
					scope.n[x]._forceY += fy;
					scope.n[y]._forceX -= fx;
					scope.n[y]._forceY -= fy;
				}
			}
		},

		// 更新位置
		update = function () {

			var flag, dx, dy, dsq, s;

			// 初始化受力
			for (flag = 0; flag < allNode.length; flag++) {
				allNode[flag]._forceX = 0;
				allNode[flag]._forceY = 0;
			}

			// 更新力，得出加速度
			updateReplusion();
			updateSpring();
			// 更新位置
			for (flag = 0; flag < allNode.length; flag++) {
				// 目前先不使用verlet计算
				dx = allNode[flag]._forceX;
				dy = allNode[flag]._forceY;
				dsq = dx * dx + dy * dy;
				// 超过一次改变最大程度
				if (dsq > 10) {
					s = Math.sqrt(10 / dsq);
					dx *= s;
					dy *= s;
				}
				// 该模型的特点是，向四周扩散，是否需要改进为中心聚拢，后期再说
				if (allNode[flag].x + dx < 0 || allNode[flag].x + dx > width) dx = 0;
				if (allNode[flag].y + dy < 0 || allNode[flag].y + dy > height) dy = 0;
				allNode[flag].x += dx;
				allNode[flag].y += dy;
			}

			// 调用钩子
			if (scope.e.live && typeof scope.e.live[0] === 'function') scope.e.live[0]();
			for (flag = 0; flag < allLink.length; flag++) {
				scope.e.update[1](allLink[flag], scope.n[allLink[flag].link[0]], scope.n[allLink[flag].link[1]]);
			}
			for (flag = 0; flag < allNode.length; flag++) {
				scope.e.update[0](scope.n[allNode[flag].id]);
			}
			if (scope.e.live && typeof scope.e.live[1] === 'function') scope.e.live[1]();
			if (scope._n_ > 0) {
				scope._n_ -= 1;
				window.setTimeout(function () {
					update();
				}, 40);
			}


		};

	// 初始化环境
	var force = function (nodes, links) {

		scope.n = {};
		allNode = nodes;
		allLink = links;
		var flag;
		// 保存结点
		for (flag = 0; flag < nodes.length; flag++) {
			// 注意这里传递的是对象
			// 因此会产生一个方便计算的好效果
			scope.n[nodes[flag].id] = nodes[flag];
			scope.n[nodes[flag].id]._link = [];

		}

		// 记录弹簧
		for (flag = 0; flag < links.length; flag++) {

			scope.n[links[flag].link[0]]._link.push({
				'link': links[flag].link[1],
				'length': links[flag].length
			});
			scope.n[links[flag].link[1]]._link.push({
				'link': links[flag].link[0],
				'length': links[flag].length
			});

		}

		var num = Math.ceil(width / Math.sqrt(width * height / nodes.length)),
			sw = width / num;

		// 初始化结点位置
		for (flag = 0; flag < nodes.length; flag++) {
			scope.n[nodes[flag].id].x = flag % num * sw + sw * 0.5;
			scope.n[nodes[flag].id].y = Math.ceil((flag + 1) / num) * sw - sw * 0.5;
		}

		// 启动初始化方法
		for (flag = 0; flag < links.length; flag++) {
			scope.e.init[1](links[flag], scope.n[links[flag].link[0]], scope.n[links[flag].link[1]]);
		}
		for (flag = 0; flag < nodes.length; flag++) {
			scope.e.init[0](scope.n[nodes[flag].id]);
		}

		// 启动更新
		scope._n_ = 1000;
		update();
		return force;

	};

	// 挂载处理事件
	// 初始化环境 init(nodeback(node), linkback(link, sourceNode, targetNode))
	// 结点更新处理方法 update(nodeback(node), linkback(link, sourceNode, targetNode))
	// 生命钩子 live(beforback(),afterback())
	force.bind = function (type, nodeback, linkback) {

		if (typeof nodeback !== 'function') nodeback = function () { };
		if (typeof linkback !== 'function') linkback = function () { };
		scope.e[type] = [nodeback, linkback];
		return force;

	};

	return force;

};