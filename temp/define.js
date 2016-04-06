/**
 * Kepco Custom Component
 */
Ext.define('Etna.bpm.Container', {
	extend : 'Ext.panel.Panel',
	alias : 'widget.kepcopanel',
	
	mixins : ['Ext.util.StoreHolder'],
	
	config : {
		paper : null,
		
		body : null,
	},
	
	cls : 'kepco-bp',
	
	layout : 'fit',
	
	title : '※ 아래 도표는 현재 진행상태를 나타냅니다. ※',
	
	titleAlign : 'center',
	
	defaultBindProperty : 'store',
	
	nodes : null,
	
	direction : false,
	
	defaultPaddingLeftRight : 30,
	
	customTextPadding : 30,
	
	paddingLeftRight : 30,
	
	paddingTopBottom : 50,
	
	arrowPadding : 10,
	
	parallelArrowPadding : 15,
	
	outerArrowWidth : 25,
	
	outerArrowPadding : 10,
	
	horizontalGap : 40,
	
	verticalGap : 20,
	
	nodeWidth : 105,
	
	nodeHeight : 20,
	
	nodeRadius : 2,
	
	nodeBorderWidth : 2,
	
	arrowStrokeWidth : 2,
	
	fontSize : 12,
	
	ellipsisLength : 10,
	
	fontFamily : 'Malgun Gothic',
	
	fontWeight : 'bold',
	
	textVerticalCorrection : 2,
	
	textHorizontalCorrection : 0,
	
	resizing : false,
	
	inprogressColor : '#6CC81B',
	
	inprogressStrokeColor : '#83E32E',
	
	openColor : '#FF6000',
	
	openStrokeColor : '#FC7D30',
	
	resolveColor : '#A1A1A1',
	
	resolveStrokeColor : '#B7B7B7',
	
	effectColor : '#CFEA3D',
	
	effectStrokeColor : '#D4FB04',
	
	arrowColor : '#646464',
	
	fontColor : '#FFF',
	
	effectFontColor : '#FFF',
	
	constructor : function() {
		var me = this;
		me.nodes = [];
		me.callParent(arguments);
	},
	
	initComponent : function() {
		var me = this;
		// <if noarch>
		me.bindStore(me.store || 'ext-empty-store', true);
		// </if>
		me.callParent(arguments);
	},
	
	afterRender : function() {
		var me = this,
			body = me.el.down('.x-panel-body');
		
		me.setBody(body);
		me.setPaper(new Raphael(body.getId()));
		me.listeners = me.on({
			resize : me.onResize,
			scope : me
		});
		me.tip = Ext.create('Ext.tip.ToolTip', {
		    target: me.getBody(),
		    delegate: 'text',
		    trackMouse: true,
		    renderTo: Ext.getBody(),
		    listeners: {
		        beforeshow : function(tip) {
		        	var node = me.getPaper().getById(tip.triggerElement.raphaelid);
		        	tip.update(node.$title);
		        }
		    }
		});
		me.callParent(arguments);
	},
	
	getStoreListeners : function() {
		var me = this;
		return {
			beforeload : me.onBeforeLoad,
			load : me.onLoad
		}
	},
	
	onBeforeLoad : function() {
		var me = this,
			paper = me.getPaper();
		
		paper.clear();
	},
	
	onLoad : function(records) {
		var me = this;
		me.clear();
		me.render();
	},
	
	onBindStore : function(store) {
		var me = this;
		me.clear();
		me.render();
	},
	
	onResize : function(width, height) {
		var me = this,
			body = me.getBody(),
			paper = me.getPaper();

		paper.setSize(body.getWidth(), body.getHeight());
		if(!me.resizing) {
			me.clear();
			me.render();
		}
	},
	
	render : Ext.Function.createBuffered(function() {
		var me = this,
			paper = me.getPaper(),
			store = me.getStore(),
			nodes = me.nodes,
			paperHeight;
		
		if(!me.rendered) {
			me.on('afterrender', me.render, me, {single : true});
			return;
		}
		me.clear();
		var paperSet = paper.set();
		var set = me.getSet();
		var rowCount = 0;
		
		if(store){//kyk추가 - store가 없을 때 간헐적으로 에러나서 수정
			Ext.Array.each(store.getRange(), function(record, index) {
				var nodeSet = me.renderNode(set, record);
				if(set.isOverflowY()) {
					set.realignmentY();
				}
				if(set.isOverflowX(store.getAt(index+1), nodeSet)) {
					set.realignmentX();
					var nset = me.getSet();
					nset.prev = set;
					set = nset;
					rowCount++;
				}
			});			
		}
		
		if(!rowCount && !set.$realignmentX) {
			set.realignmentX();
		}
		paper.forEach(function(node) {
			if(node.type == 'rect') {
				me.drawArrow(node);
			}
			paperSet.push(node);
		});
		if(paper.height != (paperHeight = paperSet.getBBox().height + (me.paddingTopBottom * 2))) {
			me.resizing = true;
			me.setHeight(paperHeight + me.getHeader().getHeight());
			me.resizing = false;
		}
	}, 100),
	
	calculateX : function(set, index, data) {
		var me = this,
			direction = set.direction,
			setBBox = set.getBBox(),
			prevSet = set.prev,
			width = me.calculateWidth(data),
			prevSetBBox;
		
		if(index > 0) {
			return me.getLastNode().getBBox().x;
		}
		if(Ext.isNumber(setBBox.x2)) {
			return direction ? (setBBox.x2 + me.horizontalGap) : (setBBox.x - me.calculateWidth(data) - me.horizontalGap);   
		}
		else if(prevSet && (prevSetBBox = prevSet.getBBox())) {
			if(direction) {
				if(prevSetBBox.x > me.paddingLeftRight) {
					return me.paddingLeftRight;
				}
			}
			return direction ? me.paddingLeftRight : prevSetBBox.x2 - width; 
		}
		return direction ? me.paddingLeftRight : paper.width - me.paddingLeftRight - me.calculateWidth(data);
	},
	
	calculateY : function(set, index, data) {
		var me = this,
			direction = set.direction,
			setBBox = set.getBBox(),
			prevSetBBox = set.prev ? set.prev.getBBox() : null,
			nodeHeight = me.calculateHeight(data),
			lastNode, lastNodeBBox;
		
		if(index > 0) {
			return me.getLastNode().getBBox().y - me.verticalGap - nodeHeight
		}
		if(prevSetBBox && !Ext.isNumber(setBBox.x)) {
			return prevSetBBox.y2 + me.verticalGap;
		}
		else if((lastNode = me.getLastNode(index))) {
			lastNodeBBox = lastNode.getBBox();
			if(lastNodeBBox.height > nodeHeight) {
				return lastNodeBBox.y + (lastNodeBBox.height - nodeHeight) / 2;
			}
			else if(lastNodeBBox.height < nodeHeight) {
				return lastNodeBBox.y + (lastNodeBBox.height - nodeHeight) / 2;
			}
			return lastNodeBBox.y;
		}
		return me.paddingTopBottom;
	},
	
	getPrevNode : function(node, index) {
		var me = this,
			recordId = node.$recordId,
			paper = me.getPaper(),
			node = node.prev;
		
		if(node) {
			while(node && ('rect' != node.type || node.$recordId == recordId)) {
				node = node.prev;
			}
			if(node.$index > index) {
				node = node.prev;
				while(node && ('rect' != node.type || node.$index > index)) {
					node = node.prev;
				}
			}
		}
		return node;
	},
	
	getNextNode : function(node, index, parallel) {
		var me = this,
			recordId = node.$recordId,
			paper = me.getPaper(),
			node = node.next;
		
		if(node) {
			while(node && ('rect' != node.type || node.$recordId == recordId)) {
				node = node.next;
			}
			node = node.$nodeSet[index];
		}
		if(!parallel && node && node.$parallel && node.$nodeSet.length < 2) {
			node = me.getNextNode(node, index);
		}
		return node;
	},
	
	getLastNode : function(index) {
		var me = this,
			paper = me.getPaper(),
			node = paper.top;
		
		if(node) {
			while(node && 'rect' != node.type) {
				node = node.prev;
			}
			if(Ext.isNumber(index)) {
				while(node && node.$index != index) {
					node = node.prev;
				}
			}
		}
		return node;
	},
	
	getLastText : function() {
		var me = this,
			paper = me.getPaper(),
			node = paper.top;
		
		if(node) {
			while('text' != node.type) {
				node = node.prev;
			}
		}
		return node;
	},
	
	calculateWidth : function(data) {
		var me = this;
		if(data instanceof Ext.data.Model) {
			data = data.getData();
		}
		if(data && data.config) {
			return data.config.width || (Ext.util.TextMetrics.measure(Ext.getBody(), data.title).width + me.customTextPadding);
		}
		return me.nodeWidth; 
	},
	
	calculateHeight : function(data) {
		var me = this;
		if(data && data.config) {
			return data.config.height || (Ext.util.TextMetrics.measure(Ext.getBody(), data.title).height + me.customTextPadding);
		}
		return me.nodeHeight; 
	},
	
	renderNode : function(set, record) {
		var me = this,
			paper = me.getPaper(),
			isParallel = record.get('parallel') ? record.get('parallel').length > 0 : false,
			datas = record.get('parallel') || [record.getData()],
			nodes, node, text,
			x, y, width, height, radius, fill;
		
		var nodeSet = [];
		Ext.Array.each(datas, function(data, index) {
			x = me.calculateX(set, index, data);
			y = me.calculateY(set, index, data);
			width = me.calculateWidth(data);
			height = me.calculateHeight(data);
			radius = me.nodeRadius;
			node = me.drawRect(x, y, width, height, radius, data);
			text = me.drawText(x, y, data.title, data);
			if(data.status == 'inprogress') {
				me.startEffect();
			}
			node.$parallel = isParallel;
			node.$title = text.$title = data.title;
			node.$index = index;
			node.$set = set;
			node.$recordId = record.getId(),
			node.$direction = set.direction;
			node.$nodeSet = nodeSet;
			nodeSet.push(node);
			set.push(node);
			set.push(text);
		});
		return nodeSet;
	},
	
	drawRect : function(x, y, width, height, radius, data) {
		var me = this,
			paper = me.getPaper(),
			width = (width > me.nodeWidth) ? nodeWidth : width,
			rect = paper.rect(x, y, width, height, radius),
			defaultConfig = {
				'stroke' : me[data.status + 'StrokeColor'],
				'stroke-width' : me.nodeBorderWidth,
				'cursor' : 'pointer',
				'fill' : me[data.status + 'Color'] 
			};
		
		if(data.config) {
			Ext.apply(defaultConfig, {
				'fill' : data.config.fill,
				'stroke' : data.config.stroke,
				'stroke-width' : data.config.strokeWidth
			});
		}
		rect.attr(defaultConfig);
		rect.click(function() {
			me.fireEvent('itemclick', data);
		});
		return rect; 
	},
	
	drawText : function(x, y, value, data) {
		var me = this,
			paper = me.getPaper(),
			node = me.getLastNode(),
			length = value.length,
			text;
		
		while(Ext.util.TextMetrics.measure(Ext.getBody(), value).width > 130) {
			value = value.substring(0, --length) + "...";
		}
		text = paper.text(x, y, value);
		text.attr({
			'font-size' : me.fontSize,
			'font-weight' : me.fontWeight,
			'font-family' : me.fontFamily,
			'fill' : me.fontColor,
			'cursor' : 'pointer'
		});
		text.translate((node.getBBox().width / 2) - me.textHorizontalCorrection, (node.getBBox().height / 2) - me.textVerticalCorrection);
		text.click(function() {
			me.fireEvent('itemclick', data);
		});
		return text;
	},
	
	drawArrow : function(node) {
		var me = this,
			paper = me.getPaper(),
			draw = function(path) {
				if(path) {
					path = paper.path(path);
					path.attr({
						'arrow-end' : 'block-wide-long',
						'stroke-width' : me.arrowStrokeWidth,
						'stroke' : me.arrowColor
					}); 
				}
			},
			index = node.$index, 
			prevNode,
			nextNode,
			path;
			
		while(index > -1) {
			prevNode = me.getPrevNode(node, index--);
			if(prevNode) {
				if(node.$index == prevNode.$index) {
					if(node.$set == prevNode.$set) {
						path = node.$direction ? me.drawRightArrow : me.drawLeftArrow;
					}
					else {
						path = node.$direction ? (node.getBBox().x < prevNode.getBBox().x) ? me.drawLeftDownArrow : me.drawDownRightArrow : me.drawRightDownArrow;
					}
				}
				else {
					path = me.drawStartParallelArrow;
				}
				draw(function() {
					return path.call(me, prevNode, node);
				}());
				break;
			}
		}
		if(node.$index > 0) {
			nextNode = me.getNextNode(node, node.$index);
			if(!nextNode) {
				nextNode = me.getNextNode(node, node.$index-1);
				if(nextNode) {
					if(!nextNode.$parallel) {
						path = me.drawEndParallelArrow(node, nextNode);
						draw(path);
					}
				}
			}
		}
	},
	
	getBBoxLeftX : function(bbox, path) {
		var me = this,
			ret = bbox.x - me.arrowPadding;
		
		if(path) {
			path.push(ret);
		}
		return ret;
	},
	
	getBBoxRightX : function(bbox, path) {
		var me = this,
			ret = bbox.x2 + me.arrowPadding;
		if(path) {
			path.push(ret);
		}
		return ret;
	},
	
	getBBoxMiddleY : function(bbox, path) {
		var me = this,
			ret = bbox.y + bbox.height / 2;
			
		if(path) {
			path.push(ret);
		}
		return ret;
	},
	
	getBBoxTopY : function(bbox, path) {
		var me = this,
			ret = bbox.y - me.arrowPadding;
			
		if(path) {
			path.push(ret);
		}
		return ret;
	},
	
	getBBoxBottomY : function(bbox, path) {
		var me = this,
			ret = bbox.y2 + me.arrowPadding;
			
		if(path) {
			path.push(ret);
		}
		return ret;
	},
	
	getBBoxRightXMiddleY : function(bbox, path) {
		var me = this,
			rightX = me.getBBoxRightX(bbox),
			middleY = me.getBBoxMiddleY(bbox);
		if(path) {
			path.push(rightX);
			path.push(middleY);
		}
		return [rightX, middleY];
	},
	
	getBBoxLeftXmiddleY : function(bbox, path) {
		var me = this,
			leftX = me.getBBoxLeftX(bbox),
			middleY = me.getBBoxMiddleY(bbox);
		if(path) {
			path.push(leftX);
			path.push(middleY);
		}
		return [leftX, middleY];
	},
	
	drawRightArrow : function(prevNode, node) {
		var me = this,
			paper = me.getPaper(),
			prevNodeBBox = prevNode.getBBox(),
			nodeBBox = node.getBBox(),
			path = ['M'];

		me.getBBoxRightXMiddleY(prevNodeBBox, path);
		path.push('L');
		me.getBBoxLeftXmiddleY(nodeBBox, path);
		return path;
	},
	
	drawLeftArrow : function(prevNode, node) {
		var me = this,
			paper = me.getPaper(),
			prevNodeBBox = prevNode.getBBox(),
			nodeBBox = node.getBBox(),
			path = ['M'];
	
		me.getBBoxLeftXmiddleY(prevNodeBBox, path);
		path.push('L');
		me.getBBoxRightXMiddleY(nodeBBox, path);
		return path;
	},
	
	getParallelNode : function(node, index) {
		var me = this;
		return node.$set[index];
	},
	
	drawStartParallelArrow : function(prevNode, node) {
		var me = this,
			paper = me.getPaper(),
			prevNodeBBox = prevNode.getBBox(),
			nodeBBox = node.getBBox(),
			path = ['M'],
			line,
			nodeBBoxMiddleY = me.getBBoxMiddleY(nodeBBox),
			nodeBBoxX = node.$direction ? me.getBBoxLeftX(nodeBBox) : me.getBBoxRightX(nodeBBox),
			targetBBoxMiddleY,
			startX,
			startY,
			middleX,
			middleY,
			endY,
			endX;
		
		if(node.$set == prevNode.$set) {
			if(prevNode.$parallel && prevNode.$nodeSet.length < 2) {
				prevNode = me.getPrevNode(prevNode);
				prevNodeBBox = prevNode.getBBox();
				return me.drawStartParallelArrow(prevNode, node);
			}
			else {
				if(node.$direction) {
					startX = prevNodeBBox.x2 + me.parallelArrowPadding;
				}
				else {
					startX = prevNodeBBox.x - me.parallelArrowPadding;
				}
			}
			targetBBoxMiddleY = me.getBBoxMiddleY(prevNodeBBox);
			line = [startX, (targetBBoxMiddleY - (targetBBoxMiddleY == nodeBBoxMiddleY ? 0 : me.arrowPadding)), 'L', startX, nodeBBoxMiddleY, nodeBBoxX, nodeBBoxMiddleY];
		}
		else {
			if(prevNode.$parallel && prevNode.$nodeSet.length < 2) {
				prevNode = me.getPrevNode(prevNode);
				prevNodeBBox = prevNode.getBBox();
				return me.drawStartParallelArrow(prevNode, node);
			}
			var pararellNode = me.getNextNode(prevNode, prevNode.$index, true),
				pararellNodeBBox;
			if(pararellNode && (pararellNodeBBox = pararellNode.getBBox())) {
				targetBBoxMiddleY = me.getBBoxMiddleY(pararellNodeBBox);
				if(pararellNode.$direction) {
					if(pararellNode.$set != node.$set) {
						startX = prevNodeBBox.x2 + me.parallelArrowPadding;
						startY = targetBBoxMiddleY - me.arrowPadding;
						middleY = targetBBoxMiddleY - me.verticalGap - me.nodeHeight;
						middleX = pararellNodeBBox.x2 + me.outerArrowWidth + me.parallelArrowPadding;
						line = [startX, startY, 'L', startX, middleY, middleX, middleY, middleX, nodeBBoxMiddleY, nodeBBoxX, nodeBBoxMiddleY];
					}
					else {
						startX = pararellNodeBBox.x - me.outerArrowWidth;
						line = [startX, (targetBBoxMiddleY - me.arrowPadding), 'L', startX, nodeBBoxMiddleY, nodeBBoxX, nodeBBoxMiddleY];
					}
				}
				else {
					if(pararellNode.$set != node.$set) {
						startX = prevNodeBBox.x - me.parallelArrowPadding;
						startY = targetBBoxMiddleY - me.arrowPadding;
						middleY = targetBBoxMiddleY - me.verticalGap - me.nodeHeight;
						middleX = pararellNodeBBox.x - me.outerArrowWidth - me.parallelArrowPadding - me.outerArrowPadding;
						line = [startX, startY, 'L', startX, middleY, middleX, middleY, middleX, nodeBBoxMiddleY, nodeBBoxX, nodeBBoxMiddleY];
					}
					else {
						startX = pararellNodeBBox.x2 + me.outerArrowWidth;
						line = [startX, (targetBBoxMiddleY - me.arrowPadding), 'L', startX, nodeBBoxMiddleY, nodeBBoxX, nodeBBoxMiddleY];
					}
				}
			}
			else {
				if(prevNode.$direction) {
					startX = me.getBBoxRightX(prevNodeBBox);
					middleX = prevNode.$set.getBBox().x2 + me.outerArrowWidth + me.parallelArrowPadding;
				}
				else {
					startX = me.getBBoxLeftX(prevNodeBBox)
					middleX = prevNode.$set.getBBox().x - me.outerArrowWidth;
				}
				startY = me.getBBoxMiddleY(prevNodeBBox);
				endY = me.getBBoxMiddleY(nodeBBox);
				line = [startX, startY, 'L', middleX, startY, middleX, endY, nodeBBoxX, endY];
			}
		}
		return path = Ext.Array.insert(path, 1, line);
	},
	
	drawEndParallelArrow : function(node, nextNode) {
		var me = this,
			paper = me.getPaper(),
			nodeBBox = node.getBBox(),
			nodeSetBBox = node.$set.getBBox(),
			nextNodeBBox = nextNode.getBBox(),
			nodeBBoxMiddleY = me.getBBoxMiddleY(nodeBBox),
			nodeBBoxTopY = me.getBBoxTopY(nodeBBox),
			nextNodeBBoxMiddleY = me.getBBoxMiddleY(nextNodeBBox),
			nodeBBoxX = node.$direction ? me.getBBoxRightX(nodeBBox) : me.getBBoxLeftX(nodeBBox),
			path = ['M'],
			line,
			startX,
			middleY,
			endX,
			endY;
		
		if(node.$set == nextNode.$set) {
			if(node.$direction) {
				startX = nextNodeBBox.x - me.parallelArrowPadding;
			}
			else {
				startX = nextNodeBBox.x2 + me.parallelArrowPadding;
			}
			endY = me.getBBoxMiddleY(nextNodeBBox) - me.arrowPadding;
			line = [nodeBBoxX, nodeBBoxMiddleY, 'L', startX, nodeBBoxMiddleY, startX, endY];
		}
		else {
			if(nextNode.$set[0] == nextNode) {
				var prevNode = me.getPrevNode(nextNode, nextNode.$index),
					prevNodeBBox;
				if(prevNode && (prevNodeBBox = prevNode.getBBox())) {
					if(node.$direction) {
						startX = nodeSetBBox.x2 + me.outerArrowWidth;
					}
					else {
						startX = nodeSetBBox.x - me.outerArrowWidth;
					}
					endY = me.getBBoxMiddleY(prevNodeBBox) - me.arrowPadding;
				}
				line = [nodeBBoxX, nodeBBoxMiddleY, 'L', startX, nodeBBoxMiddleY, startX, endY];
			}
			else {
				if(node.$direction) {
					startX = nodeSetBBox.x2 + me.outerArrowWidth + me.outerArrowPadding;
				}
				else {
					startX = nodeSetBBox.x - me.outerArrowWidth;
				}
				endX = nextNodeBBox.x - me.arrowPadding;
				endY = me.getBBoxMiddleY(nextNodeBBox) - me.arrowPadding ;
				middleY = nextNodeBBoxMiddleY - me.verticalGap - me.nodeHeight;
				line = [nodeBBoxX, nodeBBoxMiddleY, 'L', startX, nodeBBoxMiddleY, startX, middleY, endX, middleY, endX, endY];
			}
		}
		return path = Ext.Array.insert(path, 1, line);
	},

	drawRightDownArrow : function(prevNode, node) {
		var me = this,
			paper = me.getPaper(),
			prevNodeBBox = prevNode.getBBox(),
			nodeBBox = node.getBBox(),
			prevNodeBBoxRightX = me.getBBoxRightX(prevNodeBBox),
			prevNodeBBoxMiddleY = me.getBBoxMiddleY(prevNodeBBox),
			nodeBBoxMiddleY = me.getBBoxMiddleY(nodeBBox),
			nodeBBoxRightX = me.getBBoxRightX(nodeBBox),
			nodeBBoxTopY = me.getBBoxTopY(nodeBBox),
			nodeBBoxMiddleY = me.getBBoxMiddleY(nodeBBox),
			path = ['M'],
			startX = nodeBBox.x2 + me.outerArrowWidth;
		
		if(prevNode.$parallel && node.$parallel) {
			if(node.$index) {
				startX += me.outerArrowPadding;
			}
		}
		else if(node.$parallel) {
			startX += me.outerArrowPadding;
		}
		return path = Ext.Array.insert(path, 1, [prevNodeBBoxRightX, prevNodeBBoxMiddleY, 'L', startX, prevNodeBBoxMiddleY, startX, nodeBBoxMiddleY, nodeBBoxRightX, nodeBBoxMiddleY]);
	},
	
	drawLeftDownArrow : function(prevNode, node) {
		var me = this,
			paper = me.getPaper(),
			prevNodeBBox = prevNode.getBBox(),
			nodeBBox = node.getBBox(),
			prevNodeBBoxLeftX = me.getBBoxLeftX(prevNodeBBox),
			prevNodeBBoxMiddleY = me.getBBoxMiddleY(prevNodeBBox),
			nodeBBoxTopY = me.getBBoxTopY(nodeBBox),
			nodeBBoxMiddleY = me.getBBoxMiddleY(nodeBBox),
			nodeBBoxLeftX = me.getBBoxLeftX(nodeBBox),
			path = ['M'],
			startX;
		
		if(prevNode.$parallel && node.$parallel) {
			if(node.$index) {
				startX = nodeBBox.x + (prevNodeBBox.x - nodeBBox.x) / 4 + me.arrowPadding;
				path.push(nodeBBoxTopY);
			}
			else {
				startX = nodeBBox.x - (prevNodeBBox.x - nodeBBox.x) / 2;
				path.push(nodeBBoxMiddleY);
				path.push(nodeBBoxLeftX);
				path.push(nodeBBoxMiddleY);
			}
		}
		else if(node.$parallel) {
			startX = nodeBBox.x - (prevNodeBBox.x - nodeBBox.x) / 1.5;
			path.push(nodeBBoxMiddleY);
			path.push(nodeBBoxLeftX);
			path.push(nodeBBoxMiddleY);
		}
		else if(prevNode.$parallel) {
			startX = nodeBBox.x - (nodeBBox.x - prevNodeBBox.x) / 2;
			path.push(nodeBBoxTopY);
		} 
		else {
			startX = prevNodeBBox.x - ((prevNodeBBox.x - nodeBBox.x) / 2);
			path.push(nodeBBoxTopY);
		}
		return path = Ext.Array.insert(path, 1, [prevNodeBBoxLeftX, prevNodeBBoxMiddleY, 'L', startX, prevNodeBBoxMiddleY, startX]);
	},
	
	drawDownRightArrow : function(prevNode, node) {
		var me = this,
			paper = me.getPaper(),
			prevNodeBBox = prevNode.getBBox(),
			nodeBBox = node.getBBox(),
			prevNodeBBoxLeftX = me.getBBoxLeftX(prevNodeBBox),
			prevNodeBBoxRightX = me.getBBoxRightX(prevNodeBBox),
			prevNodeBBoxMiddleY = me.getBBoxMiddleY(prevNodeBBox),
			prevNodeBBoxBottomY = me.getBBoxBottomY(prevNodeBBox),
			nodeBBoxMiddleY = me.getBBoxMiddleY(nodeBBox),
			nodeBBoxLeftX = me.getBBoxLeftX(nodeBBox),
			nodeBBoxRightX = me.getBBoxRightX(nodeBBox),
			path = ['M'],
			startX = prevNodeBBox.x - me.outerArrowWidth;
		
		if(prevNode.$parallel && node.$parallel) {
			if(!node.$index) {
				startX -= me.outerArrowPadding;
			}
		}
		else if(node.$parallel) {
			startX -= me.outerArrowPadding;
		}
		return path = Ext.Array.insert(path, 1, [prevNodeBBoxLeftX, prevNodeBBoxMiddleY, 'L', startX, prevNodeBBoxMiddleY, startX, nodeBBoxMiddleY, nodeBBoxLeftX, nodeBBoxMiddleY]);
	},
	
	startEffect : function() {
		var me = this;
			node = me.getLastNode(),
			text = me.getLastText();
			
		node.$clearId = Ext.interval((function(node, text) {
			return function() {
				node.$fill = node.$fill == me.inprogressColor ? me.effectColor : me.inprogressColor;
				node.$stroke = node.$stroke == me.inprogressStrokeColor ? me.effectStrokeColor : me.inprogressStrokeColor;
				node.attr({
					'fill' : node.$fill,
					'stroke' : node.$stroke
				});
				text.$fill = text.$fill == me.fontColor ? me.effectFontColor : me.fontColor;
				text.attr({
					'fill' : text.$fill
				});
			}
		}(node, text)), 300);
	},
	
	getSet : function() {
		var me = this,
			paper = me.getPaper();
		
		return Ext.apply(paper.set(), {
			collection : 0,
			direction : (me.direction = !me.direction),
			isOverflowX : function(nextNode, nodeSet) {
				var setBBox = this.getBBox(),
					prevSet = this.prev,
					prevSetBBox,
					nextNodeWidth,
					prevNodeWidth = 0;
					
				if(!nextNode) {
					return false;
				}
				nextNodeWidth = me.calculateWidth(nextNode);
				Ext.Array.each(nodeSet, function(node) {
					prevNodeWidth = Math.max(prevNodeWidth, node.getBBox().width);
				});
				if(prevNodeWidth < me.nodeWidth) {
					this.collection += (me.nodeWidth - prevNodeWidth); 
				}
				if(this.direction) {
					return setBBox.x2 + nextNodeWidth+ me.horizontalGap + Math.max(me.paddingLeftRight, (me.outerArrowWidth + me.outerArrowPadding)) + this.collection > paper.width;// - me.defaultPaddingLeftRight;
				}
				else if(prevSet && (prevSetBBox = prevSet.getBBox())) {
					if(0 > setBBox.x - me.horizontalGap - nextNodeWidth - Math.max(me.paddingLeftRight, (me.outerArrowWidth + me.outerArrowPadding)) - this.collection ) {
						return true;
					}
				}
				return false;
			},
			isOverflowY : function() {
				var bbox = this.getBBox(),
					prev = this.prev,
					prevBBox,
					prevNode;
					
				prevNode = me.getPaper().getById(me.getPrevNode(this[this.length-1]).node.raphaelid);
				if(prev && (prevBBox = prev.getBBox())) {
					if(prevNode && prevNode.$parallel && prevNode.$nodeSet.length < 2) {
						if(prevBBox.y2 > (bbox.y - me.verticalGap - me.nodeHeight)) {
							return true;
						}
					}
					if(prevBBox.y2 > bbox.y) {
						return true;
					}
				}
				else if(prevNode.$parallel && (bbox.y - me.verticalGap - me.nodeHeight) < me.paddingTopBottom) {
					return true;
				}
				else if(bbox.y < me.paddingTopBottom) {
					return true;
				}
				return false;
			},
			realignmentY : function() {
				var bbox = this.getBBox(),
					prev = this.prev,
					prevBBox,
					prevNode,
					rangeY = 0;
				
				if(!this.$realignmentY) {
					prevNode = me.getPaper().getById(me.getPrevNode(this[this.length-1]).node.raphaelid);
					if(prev && (prevBBox = prev.getBBox())) {
						if(prevNode && prevNode.$parallel && prevNode.$nodeSet.length < 2) {
							rangeY += (me.verticalGap + me.nodeHeight);
						}
						rangeY += (prevBBox.y2 - bbox.y) + me.verticalGap; 
					}
					else if(prevNode.$parallel && (bbox.y - me.verticalGap - me.nodeHeight) < me.paddingTopBottom) {
						rangeY =  me.verticalGap + me.nodeHeight;
					}
					else if(bbox.y < me.paddingTopBottom) {
						rangeY = me.paddingTopBottom - bbox.y;
					}
					Ext.Array.each(this, function(node) {
						if(node.type == 'rect') {
							node.attr({
								y : node.getBBox().y + rangeY
							});
						}
						else if(node.type == 'text') {
							node.translate(0, rangeY);
						}
					});
					this.$realignmentY = true;
				}
			},
			realignmentX : function() {
				var bbox = this.getBBox(),
					prev = this.prev,
					nodeBBox,
					prevBBox,
					correction = 0,
					rangeX = 0;
				
				if(!this.$realignmentX) {
					if(bbox.width + (me.paddingLeftRight * 2) < paper.width) {
						rangeX = ((paper.width - bbox.width ) / 2) - me.paddingLeftRight;
						me.paddingLeftRight += rangeX;
					}
					Ext.Array.each(this, function(node) {
						nodeBBox = node.getBBox();
						if(node.type == 'rect' && nodeBBox.width < me.nodeWidth) {
							correction = (me.nodeWidth - nodeBBox.width) / 2; 
							me.paddingLeftRight -= correction;
							rangeX += correction;
						}
					});
					Ext.Array.each(this, function(node) {
						if(node.type == 'rect') {
							nodeBBox = node.getBBox();
							if(nodeBBox.width < me.nodeWidth) {
								me.nodeWidth - nodeBBox.width
							}
							node.attr({
								x : nodeBBox.x + rangeX 
							});
						}
						else if(node.type == 'text') {
							node.translate(rangeX, 0);
						}
					});
					this.$realignmentX = true;
				}
					
			}
		});
	},
	
	clear : function() {
		var me = this,
			paper = me.getPaper(),
			node;
		
		if(paper) {
			paper.clear();
		}
		while((node = me.nodes.pop())) {
			node.destroy();
		}
		me.direction = false;
		me.paddingLeftRight = me.defaultPaddingLeftRight;
	},
	
	destroy : function() {
		var me = this,
			paper = me.getPaper();
		
		if(paper) {
			paper.forEach(function(node) {
				if(node.$clearId) {
					clearTimeout(node.$clearId);
				}
			});
			paper.clear();
		}
		Ext.destroy(me.listeners);
		if(me.tip) {
			me.tip.destroy();
		} 
		me.callParent(arguments);
	}
	
});


/*
* 첨부파일 컴포넌트 
*/

Ext.define('Kepco.form.field.Attachment', {
	extend : 'Etna.form.field.Attachment',
	alias : 'widget.kepcoattachmentfield',
	
	uploaderClass : 'Kepco.upload.StoreBasedUploader'

});


Ext.define('Kepco.grid.column.Attachment', {
	extend : 'Etna.grid.column.Attachment',
	alias : 'widget.kepcoattachmentcolumn',
	
	config : {
		windowWidth : 990,
		
		factoryRegistrationNoHidden : false,
		
		factoryRegistrationNoParams : null
	}, 
	
	onHandler : function(grid, rowIndex, colIndex) {
		var me = this,
			view = me.getView(),
			record = grid.getStore().getAt(rowIndex),
			win = me.createAttachment(record),
			attachmentfield = win.down('kepcoattachmentfield');
			
		if(me.fireEvent('beforeattachmentshow', attachmentfield, record, rowIndex, colIndex, view) === false) {
			win.close();
			return;
		}
		win.show();
		me.fireEvent('attachmentshow', attachmentfield, record, rowIndex, colIndex, view);
		return win;
	},
	
	/**
	 * @private
	 */
	createAttachment : function(record) {
		var me = this,
			config = Ext.apply(Ext.clone(me.defaultUploaderConfig), me.getUploaderConfig()),
			fileGroupValue = record.get(me.dataIndex),
			win;
		
		Ext.apply(config, {
			factoryRegistrationNoHidden : me.getFactoryRegistrationNoHidden(),
			factoryRegistrationNoParams : me.getFactoryRegistrationNoParams()
		});
		return (win = Ext.create('Ext.window.Window', {
			title : '첨부파일',
			layout : 'fit',
			width : me.getWindowWidth(),
			height : me.getWindowHeight(),
			modal : true,
			closable : me.closable,
			readOnly : me.readOnly,
			items : Ext.apply(config, {
				xtype : 'kepcoattachmentfield',
				name : me.dataIndex,
				readOnly : me.readOnly,
				listeners : {
					uploadstart : function() {
						var closeButton;
						if(me.closable) {
							closeButton = win.tools[0];
							closeButton.disable();	
						}
					},
					loadcompleted : function() {
						var closeButton;
						if(me.closable) {
							closeButton = win.tools[0];
							closeButton.enable();
						}
						record.set(me.countDataIndex, this.getStore().getCount());
						if(win.closeWindowAfterUploadCompleted) {
							win.doClose();
						}
					},
					bindingvaluechange : function(value) {
						record.set(me.dataIndex, value);
					},
					uploaderclose : function() {
						win.doClose();
					},
					beforeonupload : function() {
						//업로드 버튼누르기 전 유효성 검사
						var code = this.factoryRegistrationNoParams.code;
						var list = this.getStore().getRange();
						var isValid = true;
						Ext.each(list,function(item){
							if(item.get('validPeriodYn')){
								//유효기간이 있을 경우
								if(!(item.get('beginDateTime')) || !(item.get('beginDateTime'))){
									Etna.Message.alert('#{유효기간이 유효하지 않습니다.}');
									isValid = false;
									return false;
								}
							}
							/*
							if(code === '200'){
								//공장등록증명서인 경우(공통코드 기준) 공장사업자번호 필수
								if(!item.get('factoryRegistrationNo')){
									Etna.Message.alert('#{공장등록증명서는<br>공장사업자번호가 필수입니다}');
									isValid = false;
									return false;
								}
							}
							*/
						});
						if(!isValid){
							
							return false;
						}
						return me.fireEvent('beforeonupload');
					}
						
				}
			}),
			listeners : {
				afterrender : function(self) {
					var uploader = self.down('kepcoattachmentfield');
					uploader.setValue(fileGroupValue);
					me.setUploader(uploader.getUploader());
				},
				beforeclose : function(self) {
					var uploader = self.down('kepcoattachmentfield');
					if(uploader.hasUploadFiles()) {
						Ext.Msg.show({
							title : me.closeConfirmTitle,
							msg : me.closeConfirmMessage,
							buttons : Ext.Msg.YESNOCANCEL,
							icon : Ext.MessageBox.QUESTION,
							fn : function(btn, text) {
								if(btn == "yes") {
									win.closeWindowAfterUploadCompleted = true;
									uploader.upload();
								}
								else if(btn == "no") {
									win.doClose();
								}
							}
						});
						return false;
					}
				},
				close : function() {
					me.setUploader(null);
				},
				scope : me
			}
		}));
	}
});


Ext.define('Kepco.upload.StoreBasedUploader', {
	extend : 'Etna.upload.StoreBasedUploader',
	
	uiClasses : ['Kepco.upload.ui.Grid'],
	
	validPeriodYnField : 'validPeriodYn',
	
	beginDateTimeField : 'beginDateTime',
	
	endDateTimeField : 'endDateTime',
	
	factoryRegistrationNoField : 'factoryRegistrationNo',
	
	   //수정데이터 요청 url
	updateUrl : 'smartsuit.ui.etnajs.cmmn.CommonController.updateAttachment',
	
	onUpload : function() {
		var me = this;
		if(me.fireEvent('beforeonupload') !== false) {
			me.callParent(arguments);
		}
	},
	
        //삭제기능호출시 수정된 데이터도 함께 전송하도록 구현
	onUpdate : function(button) {
		var me = this,
			updateFiles = me.getUpdateFiles();
		
		if(me.fireEvent('beforeupdate') !== false) {
			if(updateFiles.length > 0) {
				me.setPreventRefresh(true);
				if(button && button.isButton) {
					me.doSync(null, true);
				}
			}
		}
	},
	
         //수정된 파일 목록 리턴
	getUpdateFiles : function() {
		var me = this,
			store = me.getStore(),
			items = [];
		
		
		Ext.Array.each(store.getRange(), function(file) {
//			if(file.get(me.statusField) === 5 && file.dirty) {
			if(file.get(me.statusField)!== 1 && !file.getEliminated() &&file.dirty === true) {

				items.push(file);
			}
		});
		return items;
	},
	
	filterUpdated: function(file) {
        var me = this;
        if (file.get(me.statusField) === 1 || (file.getEliminated && file.getEliminated())) {
            return false;
        } else {
            return file.dirty === true;
        }
    },
	
        //수정된 파일 여부 확인
	hasUpdateFiles : function() {
		var me = this;
		return me.getUpdateFiles().length > 0;
	},
	
        //스토어 생성
	createStore : function(config) {
		var me = this;
		if(!config.store) {
			config.store = {
				fields : [{
					name : me.statusField,
					type : 'int'
				}, {
					name : me.nameField,
					type : 'string'
				}, {
					name : me.sizeField, 
					type : 'int'
				}, {
					name : me.mimeTypeField,
					type : 'string'
				}, {
					name : me.validPeriodYnField,
					type : 'boolean'
				}, {
					name : me.beginDateTimeField,
					type : 'date'
				}, {
					name : me.endDateTimeField,
					type : 'date'
				}, {
					name : 'factoryRegistrationNoField',
					type : 'string'
				}],
				proxy : {
					type : 'direct',
					api : {
						read : me.listUrl,
						update : me.updateUrl,
						destroy : me.deleteUrl
					},
					reader : {
						type : 'json'
					},
					writer : {
						type : 'json',
						writeAllFields : true,
						dateFormat : 'Y-m-d\\TH:i:s'
					}
				},
				listeners : {
					update : me.onUpdate,
					scope : me
				}
			};
		}
		config.store.filterUpdated = Ext.Function.bind(me.filterUpdated, me);
	},
	 
        //수정여부에 따른 업로드 버튼 제어
	onUpdate : function(store, record, operation, modifiedFieldNames, details) {
		var me = this,
			updateFiles = me.getUpdateFiles();
			
		if(updateFiles.length > 0) {
			me.setUploadButtonDisabled(false);
		}
		else {
			me.setUploadButtonDisabled();
		}
	},
	
        //수정여부에 따른 업로드 버튼 제어
	setUploadButtonDisabled : function(disable) {
		var me = this,
			uploadButton = me.getTbar().getComponent('uploadButton');
		
		if(disable === undefined || disable === null) {
			disable = !(me.hasUploadFiles() || me.hasDeleteFiles() || me.hasUpdateFiles());
		}
		uploadButton.setDisabled(disable);
	},
	
	createUi : function(config) {
		var me = this,
			items = [],
			hideUi = Ext.isEmpty(me.hideUi) ? false : (Ext.isArray(me.hideUi) ? me.hideUi : [me.hideUi]),
			ui;
		Ext.Array.each(me.uiClasses, function(className, index) {
			if(!Ext.ClassManager.get(className).prototype.hidden &&
			   !Ext.Array.contains(hideUi, index) &&
			   !Ext.Array.contains(hideUi, Ext.ClassManager.get(className).prototype.type)) {
				ui = Ext.create(className, {
					loadMask : config.loadMask,
					store : config.store,
					uploaderConfig : config,
					factoryRegistrationNoHidden : config.factoryRegistrationNoHidden,
					factoryRegistrationNoParams : config.factoryRegistrationNoParams,
					uploader : me,
					readOnly : me.readOnly,
					listeners : {
						activate : me.onUiActivate,
						scope : me,
						single : true
						
					}
				});
				items.push(ui);
			}
		});
		me.items = items;
	}
	
});

Ext.define('Kepco.upload.ui.Grid', {
	extend : 'Etna.upload.ui.Grid',
	alias : 'widget.kepcouploader',
	
	initComponent : function() {
		var me = this;
		Ext.apply(me, {
			plugins : [{ptype : 'cellediting', listeners:{
				beforeedit:function(cellediting, meta){
					var record = meta.record,
						column = meta.column,
						uploader = me.getUploader();
					
					if(uploader.readOnly) {
						return false;
					}
					if(column.dataIndex == 'beginDateTime' || column.dataIndex == 'endDateTime') {
						if(record.get('validPeriodYn')) {
							return true;
						}
						return false;
					}
					//유효기간유무를 해제할 때 유효기간 날짜를 제거
					if(column.dataIndex === 'validPeriodYn' && record.get('validPeriodYn') === true){
						record.set('beginDateTime', null); 
						record.set('endDateTime', null); 
					}
					//공장사업자번호 칼럼은 공장등록증명서인 경우만 선택되도록
					/*
					if(column.dataIndex === 'factoryRegistrationNo'){
						if(me.getUploader().factoryRegistrationNoParams.code == 200 ){
							return true;
						}
						return false;
					}
					*/
					
				},
				edit:function(cellediting, meta){
					var record = meta.record,
					    column = meta.column;
					
					//유효기간 종료일이 시작일보다 작거나, 오늘날짜보다 작을 때 지움
					if(column.dataIndex === 'endDateTime' && record.get('endDateTime') !== null){
						var beginDateTime = record.get('beginDateTime'); 
						var endDateTime = record.get('endDateTime'); 
						if(endDateTime < beginDateTime 
								|| Ext.Date.format(endDateTime,'Y-m-d') <  Ext.Date.format(new Date(),'Y-m-d')  ){
							record.set('endDateTime', null); 
						}
					}
				}
			}}]
		});
		me.factoryRegistrationNoStore = me.createStore();
		me.callParent(arguments);
	},
	
	loadfactoryRegistrationNoData : function(datas) {
		var me = this;
		me.factoryRegistrationNoStore.loadData(datas);
	},
	
	createStore : function() {
		var me = this,
			uploader = me.getUploader(),
			factoryRegistrationNoField = uploader.factoryRegistrationNoField,
			factoryRegistrationNoStore = Ext.create('Ext.data.Store', {
				fields : [factoryRegistrationNoField],
				autoLoad : me.factoryRegistrationNoParams.autoLoad ? {
					params : me.factoryRegistrationNoParams
				} : false,
				proxy : {
					type : 'direct',
					directFn : 'smartsuit.ui.etnajs.cmmn.CommonController.getManufactureFactoryRegistrationNo'
				}				
			});
		return factoryRegistrationNoStore;
	},
	
	createColumns : function() {
		var me = this,
			uploader = me.getUploader(),
			columns = me.callParent(arguments),
			factoryRegistrationNoField = uploader.factoryRegistrationNoField;
			
		Ext.each(columns, function(column){
			column.sortable = false;
			column.menuDisabled = true;
			column.draggable = false;
		});
			
		columns[1].minWidth = 200;
		
		columns.push({
			xtype : 'etnastorecolumn',
			itemId : 'factoryRegistrationNoColumn',
			renderer: function(value, metaData, record, rowIndex, colIndex, store, view) {
				if(value){
					var no = Ext.String.insert(value, "-", 3);
	                return Ext.String.insert(no, "-", 6);
				}else{
					return null;
				}
            },
			store : me.factoryRegistrationNoStore,
			text : '공장 사업자번호',
			sortable: false,
			menuDisabled: true,
			draggable: false,
			dataIndex : factoryRegistrationNoField,
			hidden : true,
			valueField : factoryRegistrationNoField,
			displayField : factoryRegistrationNoField,
			width : 130,
			editor : {
				xtype : 'combobox',
				store : me.factoryRegistrationNoStore,
				queryMode : 'local',
				editable : false,
				valueField : factoryRegistrationNoField,
				displayField : factoryRegistrationNoField
			}
		});
		columns = columns.concat([{
			xtype : 'checkcolumn',
			text : '유효기간유무',
			sortable: false,
			menuDisabled: true,
			draggable: false,
			width : 100,
			dataIndex : uploader.validPeriodYnField,
			editor : {
				xtype : 'checkbox'
			}
		}, {
		 	text : '유효기간',
			width : 100,
			sortable: false,
			menuDisabled: true,
			draggable: false,
			columns : [{
				xtype : 'datecolumn',
				text : '시작일',
				sortable: false,
				menuDisabled: true,
				draggable: false,
				width : 100,
				dataIndex : uploader.beginDateTimeField,
				editor : {
					xtype : 'datefield'
				}
			},{
				xtype : 'datecolumn',
				text : '종료일',
				sortable: false,
				menuDisabled: true,
				draggable: false,
				width : 100,
				dataIndex : uploader.endDateTimeField,
				editor : {
					xtype : 'datefield'
				}
			}]
		}, {
			text : '상태',
			sortable: false,
			menuDisabled: true,
			draggable: false,
			dataIndex : uploader.validStateField,
			width : 150,
			renderer : function(value, metaData, record) {
				var uploader = this.getUploader(),
					endDateTimeField = uploader.endDateTimeField;
					
				var endDate = Ext.util.Format.date(record.get(endDateTimeField), 'Ymd');
				var now = Ext.util.Format.date(new Date(), 'Ymd');	
				
				if(endDate && endDate < now) {
					return '유효기간 지남';
				}
				return '';
			}
		}]);
		return columns;
	},
	
	setFactoryRegistrationNoColumnHidden : function(value) {
		var me = this,
			cm = me.getColumnManager();
			
		Ext.Array.each(cm.getColumns(), function(column) {
			if(column.dataIndex == me.factoryRegistrationNoField) {
				column.setHidden(value);
				return false;		
			}
		});
	},
	
	beforeUpload : function(file) {
		var me = this,
			uploader = me.getUploader(),
			dateFormat = 'Y-m-d\\TH:i:s';
		
		uploader.getUploader().settings.multipart_params[uploader.validPeriodYnField] = file[uploader.validPeriodYnField];
		uploader.getUploader().settings.multipart_params[uploader.beginDateTimeField] = Ext.Date.format(file[uploader.beginDateTimeField], dateFormat);
		uploader.getUploader().settings.multipart_params[uploader.endDateTimeField] = Ext.Date.format(file[uploader.endDateTimeField], dateFormat);
		uploader.getUploader().settings.multipart_params[uploader.factoryRegistrationNoField] = file[uploader.factoryRegistrationNoField];
		me.callParent(arguments);
		
	},
	
	fileUploaded : function(file) {
		var me = this,
			uploader = me.getUploader();
			
		me.callParent(arguments);
		
		delete uploader.getUploader().settings.multipart_params[uploader.validPeriodYnField];
		delete uploader.getUploader().settings.multipart_params[uploader.beginDateTimeField];
		delete uploader.getUploader().settings.multipart_params[uploader.endDateTimeField];
		delete uploader.getUploader().settings.multipart_params[uploader.factoryRegistrationNoField];
		
	}
	
});

/*****************************************************************************************************************************************************************
 *****************************************************************************************************************************************************************
 * 입찰/계약 > 심사및평가 > 제안서심사 > 제안서평가결과 평가결과첨부파일
 * 평가결과 첨부갯수 최대 1개를 2개까지 가능, 전체용량은 20메가로 제한 내용 작업
 **/

Ext.define('Kepco.upload.ProposalStoreBasedUploader', {
	extend : 'Etna.upload.StoreBasedUploader',
	//전체 사이즈 제한
	config : {
		totalFileSize : '20m'
	},
	onUpload : function() {
		var me = this;
		if(me.fireEvent('beforeonupload') !== false) {
			me.callParent(arguments);
		}
	}
});

Ext.define('Kepco.form.field.Proposal.Attachment', {
	extend : 'Etna.form.field.Attachment',
	alias : 'widget.proposalattachmentfield',
	
	uploaderClass : 'Kepco.upload.ProposalStoreBasedUploader'
});

Ext.define('Kepco.grid.column.Proposal.Attachment', {
	extend : 'Etna.grid.column.Attachment',
	alias : 'widget.proposalattachmentcolumn',
	
	config : {
		/**
		 * @cfg {Etna.upload.Uploader} uploader 
		 * @accessor
		 * 첨부파일 컴포넌트
		 */
		uploader : null,
		/**
		 * @cfg {Etna.upload.Uploader} uploader config 
		 * @accessor
		 * 첨부파일 컴포넌트 config
		 */
		uploaderConfig : {},
		
		windowWidth : 500,
		
		windowHeight : 350
	},
	
	cls : Ext.baseCSSPrefix + 'etna-attachment-column',
	
	/**
	 * @cfg {String} align
	 */
	align : 'right',
	
	/**
	 * @cfg {String} closeConfirmTitle
	 * Confirm MessageBox 타이틀
	 */
	closeConfirmTitle : '첨부파일 알림',
	/**
	 * @cfg {String} closeConfirmMessage
	 * Confirm MessageBox 메세지
	 */
	closeConfirmMessage : '저장(삭제)되지 않은 첨부파일이 있습니다.<br>저장하시겠습니까?',
	
	/**
	 * @cfg {String} countDataIndex
	 * 첨부파일 카운트 dataIndex
	 */
	countDataIndex : 'fileGroupCount',
	
	/**
	 * @cfg {Boolean} readOnly
	 * 첨부파일 버튼 활성화 여부
	 */
	readOnly : false,
	
	/**
	 * @cfg {Function} isDisabled
	 * 액션컬럼의 item 의 비활성화 여부 리턴 함수 
	 */
	isDisabled : null,
	
	/**
	 * @cfg {Boolean} closable
	 * close tool 사용여부 
	 */
	closable : false,
	
	defaultUploaderConfig : {
		hideUploadButton : false,
		hideCloseButton : false
	},
	
	/**
	 * @constructor
	 * @param {Object} config 설정
	 */
	constructor : function(config) {
		var me = this;
		Ext.applyIf(config, {
			renderer : function(value, metadata, record, rowIndex, colIndex, store, view) {
				var count = record.get(me.countDataIndex) || 0;
				return '<span class="grid-attachment-text">' + count +'</span>';
			},
			items : [{
				iconCls : 'grid-attachment-icon',
				tooltip : '첨부파일',
				handler : me.onHandler,
				isDisabled : me.isDisabled
			}]
		});
		me.callParent(arguments);
	},
	
	/**
	 * @private onHandler
	 * @param {Ext.panel.Grid} grid GridPanel
	 * @param {Number} rowIndex
	 * @param {Number} colIndex,
	 * Action 컬럼의 클릭 핸들러 첨부파일 컴포넌트를 {Ext.window.Window} 를 이용하여 팝업으로 띄움
	 */
	onHandler : function(grid, rowIndex, colIndex) {
		var me = this,
			view = me.getView(),
			record = grid.getStore().getAt(rowIndex),
			win = me.createAttachment(record),
			attachmentfield = win.down('proposalattachmentfield');
			
		if(me.fireEvent('beforeattachmentshow', attachmentfield, record, rowIndex, colIndex, view) === false) {
			win.close();
			return;
		}
		win.show();
		me.fireEvent('attachmentshow', attachmentfield, record, rowIndex, colIndex, view);
		return win;
	},
	
	/**
	 * @private
	 */
	createAttachment : function(record) {
		var me = this,
			config = Ext.apply(Ext.clone(me.defaultUploaderConfig), me.getUploaderConfig()),
			fileGroupValue = record.get(me.dataIndex),
			win;
			
		return (win = Ext.create('Ext.window.Window', {
			title : '첨부파일',
			layout : 'fit',
			width : me.getWindowWidth(),
			height : me.getWindowHeight(),
			modal : true,
			closable : me.closable,
			readOnly : me.readOnly,
			items : Ext.apply(config, {
				xtype : 'proposalattachmentfield',
				name : me.dataIndex,
				readOnly : me.readOnly,
				listeners : {
					uploadstart : function() {
						var closeButton;
						if(me.closable) {
							closeButton = win.tools[0];
							closeButton.disable();	
						}
					},
					loadcompleted : function() {
						var closeButton;
						if(me.closable) {
							closeButton = win.tools[0];
							closeButton.enable();
						}
						record.set(me.countDataIndex, this.getStore().getCount());
						if(win.closeWindowAfterUploadCompleted) {
							win.doClose();
						}
					},
					bindingvaluechange : function(value) {
						record.set(me.dataIndex, value);
					},
					uploaderclose : function() {
						win.doClose();
					},
					beforeonupload : function() {
						//업로드 버튼누르기 전 유효성 검사
						var list = this.getStore().getRange();
						var isValid = true;
						if(list.length > 2){
							Etna.Message.alert('#{첨부파일은 최대 2개까지 가능합니다.}');
							isValid = false;
							return false;
						}
						/*Ext.each(list,function(item){
							
							if(!(item.get('companyId'))){
								Etna.Message.alert('#{회사구분을 선택해주십시오.}');
								isValid = false;
								return false;
							}
							
							
						});*/
						if(!isValid){
							
							return false;
						}
						return me.fireEvent('beforeonupload');
					}
				}
			}),
			listeners : {
				afterrender : function(self) {
					var uploader = self.down('proposalattachmentfield');
					uploader.setValue(fileGroupValue);
					me.setUploader(uploader.getUploader());
				},
				beforeclose : function(self) {
					var uploader = self.down('proposalattachmentfield');
					if(uploader.hasUploadFiles()) {
						Ext.Msg.show({
							title : me.closeConfirmTitle,
							msg : me.closeConfirmMessage,
							buttons : Ext.Msg.YESNOCANCEL,
							icon : Ext.MessageBox.QUESTION,
							fn : function(btn, text) {
								if(btn == "yes") {
									win.closeWindowAfterUploadCompleted = true;
									uploader.upload();
								}
								else if(btn == "no") {
									win.doClose();
								}
							}
						});
						return false;
					}
				},
				close : function() {
					me.setUploader(null);
				},
				scope : me
			}
		}));
	},
	
	/**
	 * @method setReadOnly
	 * @param {Boolean} value 읽기속성
	 */
	setReadOnly : function(value) {
		var me = this,
			uploader = me.getUploader();
		
		if(uploader) {
			uploader.setReadOnly(value);
		}
		Ext.apply(me.getUploaderConfig(), {
			readOnly : value
		});
		me.readOnly = value;
	},
	
	/**
	 * @method getReadOnly
	 */
	getReadOnly : function() {
		var me = this;
		return me.readOnly;
	}
});

/**
 ***************************************************************************************************************************************************************** 
 *****************************************************************************************************************************************************************/


/*****************************************************************************************************************************************************************
 *****************************************************************************************************************************************************************
 * Adimin > 기준정보 관리 공통파일 다운로드 구분 BID 일때 첨부파일 기능 적용
 **/

Ext.define('Kepco.form.field.BidAttatchment.Attachment', {
	extend : 'Etna.form.field.Attachment',
	alias : 'widget.kepcobidattachmentfield',
	
	uploaderClass : 'Kepco.upload.BidStoreBasedUploader'

});

Ext.define('Kepco.upload.BidStoreBasedUploader', {
	extend : 'Etna.upload.StoreBasedUploader',
	
	uiClasses : ['Kepco.upload.ui.Bid.Grid'],
	
	companyIdField : 'fileCompanyId',//회사구분
	
	bidMethodField : 'bidMethod',//off-line여부
	
	bidFileTypeField : 'bidFileType',//파일구분
	
	itemTypeField : 'itemType',//구매유형
	
	contractTypeField : 'contractType',//계약구분
	
	bidTypeField : 'bidType',//낙찰자 결정방법
	
	smallMediumFirmYnField : 'smallMediumFirmYn',//중소기업여부
	
	manySupplyYnField : 'manySupplyYn',//다수공급여부
	
	beginDateTimeField : 'beginDateTime',//유효시작일
	
	endDateTimeField : 'endDateTime',//유효종료일
	
	orderNoField : 'orderNo',//순번
	
	//수정데이터 요청 url
	updateUrl : 'smartsuit.ui.etnajs.cmmn.CommonController.updateAttachment', //updateAttachmentBid',

	onUpload : function() {
		var me = this;
		if(me.fireEvent('beforeonupload') !== false) {
			me.callParent(arguments);
		}
	},
	
        //삭제기능호출시 수정된 데이터도 함께 전송하도록 구현
	onUpdate : function(button) {
		var me = this,
			updateFiles = me.getUpdateFiles();
		
		if(me.fireEvent('beforeupdate') !== false) {
			if(updateFiles.length > 0) {
				me.setPreventRefresh(true);
				if(button && button.isButton) {
					me.doSync(null, true);
				}
			}
		}
	},
	
         //수정된 파일 목록 리턴
	getUpdateFiles : function() {
		var me = this,
			store = me.getStore(),
			items = [];
		
		
		Ext.Array.each(store.getRange(), function(file) {
//			if(file.get(me.statusField) === 5 && file.dirty) {
			if(file.get(me.statusField)!== 1 && !file.getEliminated() &&file.dirty === true) {
				items.push(file);
			}
		});
		return items;
	},
	
	filterUpdated: function(file) {
        var me = this;
        if (file.get(me.statusField) === 1 || (file.getEliminated && file.getEliminated())) {
            return false;
        } else {
            return file.dirty === true;
        }
    },
	
        //수정된 파일 여부 확인
	hasUpdateFiles : function() {
		var me = this;
		return me.getUpdateFiles().length > 0;
	},
	
        //스토어 생성
	createStore : function(config) {
		var me = this;
		if(!config.store) {
			config.store = {
				fields : [{
					name : me.statusField,
					type : 'int'
				}, {
					name : me.nameField,
					type : 'string'
				}, {
					name : me.sizeField, 
					type : 'int'
				}, {
					name : me.mimeTypeField,
					type : 'string'
				}, {
					name : me.smallMediumFirmYnField,
					type : 'boolean'
				}, {
					name : me.manySupplyYnField,
					type : 'boolean'
				}, {
					name : me.beginDateTimeField,
					type : 'date'
				}, {
					name : me.endDateTimeField,
					type : 'date'
				}, {
					name : me.companyIdField,
					type : 'string'
				}, {
					name : me.bidMethodField,
					type : 'string'
				}, {
					name : me.bidFileTypeField,
					type : 'string'
				}, {
					name : me.itemTypeField,
					type : 'string'
				}, {
					name : me.contractTypeField,
					type : 'string'
				}, {
					name : me.bidTypeField,
					type : 'string'
				}, {
					name : me.orderNoField,
					type : 'int'
				}],
				proxy : {
					type : 'direct',
					api : {
						read : me.listUrl,
						update : me.updateUrl,
						destroy : me.deleteUrl
					},
					reader : {
						type : 'json'
					},
					writer : {
						type : 'json',
						writeAllFields : true,
						dateFormat : 'Y-m-d\\TH:i:s'
					}
				},
				listeners : {
					update : me.onUpdate,
					scope : me
				}
			};
			
		}
		//TECHSUPP-1565
		config.store.filterUpdated = Ext.Function.bind(me.filterUpdated, me);
	},
	 
        //수정여부에 따른 업로드 버튼 제어
	onUpdate : function(store, record, operation, modifiedFieldNames, details) {
		var me = this,
			updateFiles = me.getUpdateFiles();
			
		if(updateFiles.length > 0) {
			me.setUploadButtonDisabled(false);
		}
		else {
			me.setUploadButtonDisabled();
		}
	},
	
        //수정여부에 따른 업로드 버튼 제어
	setUploadButtonDisabled : function(disable) {
		var me = this,
			uploadButton = me.getTbar().getComponent('uploadButton');
		
		if(disable === undefined || disable === null) {
			disable = !(me.hasUploadFiles() || me.hasDeleteFiles() || me.hasUpdateFiles());
		}
		uploadButton.setDisabled(disable);
	},
	
	createUi : function(config) {
		var me = this,
			items = [],
			hideUi = Ext.isEmpty(me.hideUi) ? false : (Ext.isArray(me.hideUi) ? me.hideUi : [me.hideUi]),
			ui;
		Ext.Array.each(me.uiClasses, function(className, index) {
			if(!Ext.ClassManager.get(className).prototype.hidden &&
			   !Ext.Array.contains(hideUi, index) &&
			   !Ext.Array.contains(hideUi, Ext.ClassManager.get(className).prototype.type)) {
				ui = Ext.create(className, {
					loadMask : config.loadMask,
					store : config.store,
					uploaderConfig : config,
					uploader : me,
					readOnly : me.readOnly,
					listeners : {
						activate : me.onUiActivate,
						scope : me,
						single : true
						
					}
				});
				items.push(ui);
			}
		});
		me.items = items;
	}
	
});

Ext.define('Kepco.grid.column.BidAttatchment.Attachment', {
	extend : 'Etna.grid.column.Attachment',
	alias : 'widget.kepcbidcommonattachmentcolumn',
	
	config : {
		windowWidth : 990
		
	}, 
	
	onHandler : function(grid, rowIndex, colIndex) {
		var me = this,
			view = me.getView(),
			record = grid.getStore().getAt(rowIndex),
			win = me.createAttachment(record),
			attachmentfield = win.down('kepcobidattachmentfield');
			
		if(me.fireEvent('beforeattachmentshow', attachmentfield, record, rowIndex, colIndex, view) === false) {
			win.close();
			return;
		}
		win.show();
		me.fireEvent('attachmentshow', attachmentfield, record, rowIndex, colIndex, view);
		return win;
	},

	createAttachment : function(record) {
		var me = this,
			config = Ext.apply(Ext.clone(me.defaultUploaderConfig), me.getUploaderConfig()),
			fileGroupValue = record.get(me.dataIndex),
			win;
		
		Ext.apply(config, {

		});
		
		return (win = Ext.create('Ext.window.Window', {
			title : '첨부파일',
			layout : 'fit',
			width : me.getWindowWidth(),
			height : me.getWindowHeight(),
			modal : true,
			closable : me.closable,
			readOnly : me.readOnly,
			items : Ext.apply(config, {
				xtype : 'kepcobidattachmentfield',
				name : me.dataIndex,
				readOnly : me.readOnly,
				listeners : {
					uploadstart : function() {
						var closeButton;
						if(me.closable) {
							closeButton = win.tools[0];
							closeButton.disable();	
						}
					},
					loadcompleted : function() {
						var closeButton;
						if(me.closable) {
							closeButton = win.tools[0];
							closeButton.enable();
						}
						record.set(me.countDataIndex, this.getStore().getCount());
						if(win.closeWindowAfterUploadCompleted) {
							win.doClose();
						}
					},
					bindingvaluechange : function(value) {
						record.set(me.dataIndex, value);
					},
					uploaderclose : function() {
						win.doClose();
					},
					beforeonupload : function() {
						//업로드 버튼누르기 전 유효성 검사
						var list = []//this.getStore().getRange();
						var deleteFiles = this.getDeleteFiles();//삭제할 파일
						var updateFiles = this.getUpdateFiles();//수정할 파일
						var transmitFiles = this.getTransmitFiles();//추가한 파일
						
						Ext.each(updateFiles,function(item){
							list.push(item);
						});
						
						Ext.each(transmitFiles,function(item){
							list.push(item);
						});
						
						var isValid = true;
						Ext.each(list,function(item){

							if(!(item.get('bidFileType'))){
								Etna.Message.alert('#{파일 구분을 선택해주십시오.}');
								isValid = false;
								return false;
							}
							
							if(!(item.get('itemType'))){
								Etna.Message.alert('#{구매유형을 선택해주십시오.}');
								isValid = false;
								return false;
							}
							
							if(!(item.get('beginDateTime'))){
								Etna.Message.alert('#{유효시작일을 입력해주십시오.}');
								isValid = false;
								return false;
							}
							
							if(!(item.get('beginDateTime'))){
								Etna.Message.alert('#{유효종료일을 입력해주십시오.}');
								isValid = false;
								return false;
							}
							
							if(item.get('beginDateTime') > item.get('endDateTime')){
								Etna.Message.alert('#{유효종료일은 유효시작일시 이후로 입력해주십시오.}');
								isValid = false;
								return false;						
							}
						});
						if(!isValid){
							
							return false;
						}
						return me.fireEvent('beforeonupload');
					}
						
				}
			}),
			listeners : {
				afterrender : function(self) {
					var uploader = self.down('kepcobidattachmentfield');
					uploader.setValue(fileGroupValue);
					me.setUploader(uploader.getUploader());
				},
				beforeclose : function(self) {
					var uploader = self.down('kepcobidattachmentfield');
					if(uploader.hasUploadFiles()) {
						Ext.Msg.show({
							title : me.closeConfirmTitle,
							msg : me.closeConfirmMessage,
							buttons : Ext.Msg.YESNOCANCEL,
							icon : Ext.MessageBox.QUESTION,
							fn : function(btn, text) {
								if(btn == "yes") {
									win.closeWindowAfterUploadCompleted = true;
									uploader.upload();
								}
								else if(btn == "no") {
									win.doClose();
								}
							}
						});
						return false;
					}
				},
				close : function() {
					me.setUploader(null);
				},
				scope : me
			}
		}));
	}
});


Ext.define('Kepco.upload.ui.Bid.Grid', {
	extend : 'Etna.upload.ui.Grid',
	alias : 'widget.kepcouploader',
	
	initComponent : function() {
		var me = this;
		Ext.apply(me, {
			plugins : [{ptype : 'cellediting', listeners:{
				beforeedit:function(cellediting, meta){
					var record = meta.record,
						column = meta.column,
						uploader = me.getUploader();
					
					if(uploader.readOnly) {
						return false;
					}
				},
				edit:function(cellediting, meta){
					var record = meta.record,
					    column = meta.column;
					
					//유효기간 종료일이 시작일보다 작거나, 오늘날짜보다 작을 때 지움
					if(column.dataIndex === 'endDateTime' && record.get('endDateTime') !== null){
						var beginDateTime = record.get('beginDateTime'); 
						var endDateTime = record.get('endDateTime'); 
						if(endDateTime < beginDateTime 
								|| Ext.Date.format(endDateTime,'Y-m-d') <  Ext.Date.format(new Date(),'Y-m-d')  ){
							Etna.Message.alert('#{유효종료일은 유효시작일시 이후로 입력해주십시오.}');
							record.set('endDateTime', null); 
						}
					}
				}
			}}
			,{
                ptype: 'etnacelltip',
                deferredRender: true
            }
			]
		});

		me.findCompanyStore = me.companyStore();
		me.findBidMethodStore = me.findCodeList('FileItemBidMethod');
		me.findBidFileTypeStore = me.findCodeList('FileItemBidFileType');
		me.findItemTypeStore = me.findCodeList('FileItemItemType');
		me.findContractTypeStore = me.findCodeList('FileItemContractType');
		me.findBidTypeStore = me.findCodeList('FileItemBidType');
		me.callParent(arguments);
		me.getView().setLoading(true);
		Etna.onDone(function(){
			me.config.uploader.load({
				callback:function(){
					me.getView().setLoading(false);
				}
			});
		});
	},
	
	loadfactoryRegistrationNoData : function(datas) {
		var me = this;
		me.factoryRegistrationNoStore.loadData(datas);
	},
	
	companyStore : function(){
		var me = this,
		uploader = me.getUploader(),
		store = Ext.create('Ext.data.Store', {
			fields : [{
				            type: 'string',
				            name: 'id'
				        },
				        {
				            type: 'string',
				            name: 'code'
				        },
				        {
				            type: 'string',
				            name: 'name'
				        }
	        ],
	        filters: {
                filterFn: function(item) {
                    if(item.get('code')> 0){
                        return item;
                    }
                }
            },
			autoLoad : true,
			proxy : {
				type : 'direct',
				directFn : 'smartsuit.ui.etnajs.cmmn.basis.GroupCodeController.findCompanyCodeDatas'
			}				
		});
	return store;
	},
	
	findCodeList: function(code){
		var me = this,
		uploader = me.getUploader(),
		store = Ext.create('Cmmn.store.Code', {
			groupCode: code,
            type: 'cmmncode',
            proxy: {
                type: 'direct',
                directFn: 'smartsuit.ui.etnajs.cmmn.CommonController.getCodes',
                reader: {
                    type: 'json',
                    rootProperty: 'records'
                }
            },
            fields: [
                     {
                         type: 'string',
                         name: 'id'
                     },
                     {
                         type: 'string',
                         name: 'text'
                     },
                     {
                         type: 'string',
                         name: 'value'
                     },
                     {
                         defaultValue: {
                             
                         },
                         name: 'properties'
                     }
            ]				
		});
	return store;
	},

	createColumns : function() {
		var me = this,
			uploader = me.getUploader(),
			columns = me.callParent(arguments);//,
			//factoryRegistrationNoField = uploader.factoryRegistrationNoField;
			
		Ext.each(columns, function(column){
			column.sortable = false;
			column.menuDisabled = true;
			column.draggable = false;
		});
			
		columns[1].minWidth = 200;
		
		columns.push(
				{
				    xtype: 'etnastorecolumn',
				    width: 150,
				    align: 'center',
				    dataIndex: uploader.companyIdField,
				    emptyCellText: '#{전체}',
				    text: '#{회사구분}',
				    valueField: 'id',
				    displayField: 'name',
				    store: me.findCompanyStore,
				    editor : {
						xtype : 'combobox',
						store : me.findCompanyStore,
						queryMode : 'local',
						editable : false,
						valueField : 'id',
						displayField :'name'
					}
				    
				},	                          
				{
				    xtype: 'etnastorecolumn',
				    width: 150,
				    align: 'center',
				    dataIndex: uploader.bidMethodField,
				    emptyCellText: '#{전체}',
				    text: '#{off-line여부}',
				    valueField: 'id',
				    displayField: 'text',
				    store: me.findBidMethodStore,
				    editor : {
						xtype : 'combobox',
						store : me.findBidMethodStore,
						queryMode : 'local',
						editable : false,
						valueField : 'id',
						displayField :'text'
					}
				    
				},
				{
				    xtype: 'etnastorecolumn',
				    width: 150,
				    align: 'center',
				    dataIndex: uploader.bidFileTypeField,
				    emptyCellText: '#{선택}',
				    text: '#{파일구분}',
				    required: true,
				    valueField: 'id',
				    displayField: 'text',
				    store: me.findBidFileTypeStore,
				    editor : {
						xtype : 'combobox',
						store : me.findBidFileTypeStore,
						queryMode : 'local',
						editable : false,
						valueField : 'id',
						displayField :'text'
					}
				    
				},
				{
				    xtype: 'etnastorecolumn',
				    width: 150,
				    align: 'center',
				    dataIndex: uploader.itemTypeField,
				    emptyCellText: '#{선택}',
				    text: '#{구매유형}',
				    required: true,
				    valueField: 'id',
				    displayField: 'text',
				    store: me.findItemTypeStore,
				    editor : {
						xtype : 'combobox',
						store : me.findItemTypeStore,
						queryMode : 'local',
						editable : false,
						valueField : 'id',
						displayField :'text'
					}
				    
				},
				{
				    xtype: 'etnastorecolumn',
				    width: 150,
				    align: 'center',
				    dataIndex: uploader.contractTypeField,
				    emptyCellText: '#{전체}',
				    text: '#{계약구분}',
				    valueField: 'id',
				    displayField: 'text',
				    store: me.findContractTypeStore,
				    editor : {
						xtype : 'combobox',
						store : me.findContractTypeStore,
						queryMode : 'local',
						editable : false,
						valueField : 'id',
						displayField :'text'
					}
				    
				},
				{
				    xtype: 'etnastorecolumn',
				    width: 150,
				    align: 'center',
				    dataIndex: uploader.bidTypeField,
				    emptyCellText: '#{전체}',
				    text: '#{낙찰자결정방법}',
				    valueField: 'id',
				    displayField: 'text',
				    store: me.findBidTypeStore,
				    editor : {
						xtype : 'combobox',
						store : me.findBidTypeStore,
						queryMode : 'local',
						editable : false,
						valueField : 'id',
						displayField :'text'
					}
				    
				},
				{
					xtype : 'checkcolumn',
					text : '중소기업여부',
					sortable: false,
					menuDisabled: true,
					draggable: false,
					width : 100,
					dataIndex : uploader.smallMediumFirmYnField,
					editor : {
						xtype : 'checkbox'
					}
				},{
					xtype : 'checkcolumn',
					text : '다수공급여부',
					sortable: false,
					menuDisabled: true,
					draggable: false,
					width : 100,
					dataIndex : uploader.manySupplyYnField,
					editor : {
						xtype : 'checkbox'
					}
				},{
					xtype : 'datecolumn',
					text : '유효시작일',
					required: true,
					sortable: false,
					menuDisabled: true,
					draggable: false,
					width : 100,
					dataIndex : uploader.beginDateTimeField,
					editor : {
						xtype : 'datefield'
					}
				},{
					xtype : 'datecolumn',
					text : '유효종료일',
					required: true,
					sortable: false,
					menuDisabled: true,
					draggable: false,
					width : 100,
					dataIndex : uploader.endDateTimeField,
					editor : {
						xtype : 'datefield'
					}
				}
				,{
                    xtype: 'gridcolumn',
                    required: true,
                    width: 75,
                    align: 'center',
                    dataIndex: uploader.orderNoField,
                    text: '#{순번}',
                    editor : {
						xtype : 'numberfield'
					}
                }
		);
		
		return columns;
	},
	
	beforeUpload : function(file) {
		var me = this,
			uploader = me.getUploader(),
			dateFormat = 'Y-m-d\\TH:i:s';
		
		uploader.getUploader().settings.multipart_params[uploader.beginDateTimeField] = Ext.Date.format(file[uploader.beginDateTimeField], dateFormat);
		uploader.getUploader().settings.multipart_params[uploader.endDateTimeField] = Ext.Date.format(file[uploader.endDateTimeField], dateFormat);
		uploader.getUploader().settings.multipart_params[uploader.bidMethodField] = file[uploader.bidMethodField];
		uploader.getUploader().settings.multipart_params[uploader.bidTypeField] = file[uploader.bidTypeField];
		uploader.getUploader().settings.multipart_params[uploader.bidFileTypeField] = file[uploader.bidFileTypeField];
		uploader.getUploader().settings.multipart_params[uploader.contractTypeField] = file[uploader.contractTypeField];
		uploader.getUploader().settings.multipart_params[uploader.itemTypeField] = file[uploader.itemTypeField];
		uploader.getUploader().settings.multipart_params[uploader.companyIdField] = file[uploader.companyIdField];
		uploader.getUploader().settings.multipart_params[uploader.manySupplyYnField] = file[uploader.manySupplyYnField];
		uploader.getUploader().settings.multipart_params[uploader.smallMediumFirmYnField] = file[uploader.smallMediumFirmYnField];
		uploader.getUploader().settings.multipart_params[uploader.orderNoField] = file[uploader.orderNoField];
		me.callParent(arguments);
		
	},
	
	fileUploaded : function(file) {
		var me = this,
			uploader = me.getUploader();
			
		me.callParent(arguments);
		
		delete uploader.getUploader().settings.multipart_params[uploader.companyIdField];
		delete uploader.getUploader().settings.multipart_params[uploader.bidMethodField];
		delete uploader.getUploader().settings.multipart_params[uploader.bidFileTypeField];
		delete uploader.getUploader().settings.multipart_params[uploader.contractTypeField];
		delete uploader.getUploader().settings.multipart_params[uploader.itemTypeField];
		delete uploader.getUploader().settings.multipart_params[uploader.bidTypeField];
		delete uploader.getUploader().settings.multipart_params[uploader.smallMediumFirmYnField];
		delete uploader.getUploader().settings.multipart_params[uploader.manySupplyYnField];
		
		delete uploader.getUploader().settings.multipart_params[uploader.beginDateTimeField];
		delete uploader.getUploader().settings.multipart_params[uploader.endDateTimeField];
		
		delete uploader.getUploader().settings.multipart_params[uploader.orderNoField];
		
	}
	
});

/**
 ***************************************************************************************************************************************************************** 
 *****************************************************************************************************************************************************************/


//입찰참가신청 외부 상세에서 사용
//countDataIndex을 첨부파일 이름으로 적용해서 사용하기 때문에 첨부컬럼 팝업 띄운후  countDataIndex엎어치지 않도록 구현
Ext.define('Kepco.bidattend.grid.column.Attachment', {
	extend : 'Ext.grid.column.Action',
	alias : 'widget.bidattendetnaattachmentcolumn',
	
//	requires : ['Etna.form.field.Attachment'],
	
	config : {
		/**
		 * @cfg {Etna.upload.Uploader} uploader 
		 * @accessor
		 * 첨부파일 컴포넌트
		 */
		uploader : null,
		/**
		 * @cfg {Etna.upload.Uploader} uploader config 
		 * @accessor
		 * 첨부파일 컴포넌트 config
		 */
		uploaderConfig : {},
		
		windowWidth : 300,
		
		windowHeight : 250
	},
	
	cls : Ext.baseCSSPrefix + 'etna-attachment-column',
	
	/**
	 * @cfg {String} align
	 */
	align : 'right',
	
	/**
	 * @cfg {String} closeConfirmTitle
	 * Confirm MessageBox 타이틀
	 */
	closeConfirmTitle : '첨부파일 알림',
	/**
	 * @cfg {String} closeConfirmMessage
	 * Confirm MessageBox 메세지
	 */
	closeConfirmMessage : '저장(삭제)되지 않은 첨부파일이 있습니다.<br>저장하시겠습니까?',
	
	/**
	 * @cfg {String} countDataIndex
	 * 첨부파일 카운트 dataIndex
	 */
	countDataIndex : 'fileGroupCount',
	
	/**
	 * @cfg {Boolean} readOnly
	 * 첨부파일 버튼 활성화 여부
	 */
	readOnly : false,
	
	/**
	 * @cfg {Function} isDisabled
	 * 액션컬럼의 item 의 비활성화 여부 리턴 함수 
	 */
	isDisabled : null,
	
	/**
	 * @cfg {Boolean} closable
	 * close tool 사용여부 
	 */
	closable : false,
	
	defaultUploaderConfig : {
		hideUploadButton : false,
		hideCloseButton : false
	},
	
	/**
	 * @constructor
	 * @param {Object} config 설정
	 */
	constructor : function(config) {
		var me = this;
		Ext.applyIf(config, {
			renderer : function(value, metadata, record, rowIndex, colIndex, store, view) {
				var count = record.get(me.countDataIndex) || 0;
				return '<span class="grid-attachment-text">' + count +'</span>';
			},
			items : [{
				iconCls : 'grid-attachment-icon',
				tooltip : '첨부파일',
				handler : me.onHandler,
				isDisabled : me.isDisabled
			}]
		});
		me.callParent(arguments);
	},
	
	/**
	 * @private onHandler
	 * @param {Ext.panel.Grid} grid GridPanel
	 * @param {Number} rowIndex
	 * @param {Number} colIndex,
	 * Action 컬럼의 클릭 핸들러 첨부파일 컴포넌트를 {Ext.window.Window} 를 이용하여 팝업으로 띄움
	 */
	onHandler : function(grid, rowIndex, colIndex) {
		var me = this,
			view = me.getView(),
			record = grid.getStore().getAt(rowIndex),
			win = me.createAttachment(record),
			attachmentfield = win.down('etnaattachmentfield');
			
		if(me.fireEvent('beforeattachmentshow', attachmentfield, record, rowIndex, colIndex, view) === false) {
			win.close();
			return;
		}
		win.show();
		me.fireEvent('attachmentshow', attachmentfield, record, rowIndex, colIndex, view);
		return win;
	},
	
	/**
	 * @private
	 */
	createAttachment : function(record) {
		var me = this,
			config = Ext.apply(Ext.clone(me.defaultUploaderConfig), me.getUploaderConfig()),
			fileGroupValue = record.get(me.dataIndex),
			win;
			
		return (win = Ext.create('Ext.window.Window', {
			title : '첨부파일',
			layout : 'fit',
			width : me.getWindowWidth(),
			height : me.getWindowHeight(),
			modal : true,
			closable : me.closable,
			readOnly : me.readOnly,
			items : Ext.apply(config, {
				xtype : 'etnaattachmentfield',
				name : me.dataIndex,
				readOnly : me.readOnly,
				listeners : {
					uploadstart : function() {
						var closeButton;
						if(me.closable) {
							closeButton = win.tools[0];
							closeButton.disable();	
						}
					},
					loadcompleted : function() {
						var closeButton;
						if(me.closable) {
							closeButton = win.tools[0];
							closeButton.enable();
						}
//						record.set(me.countDataIndex, this.getStore().getCount()); 
						if(win.closeWindowAfterUploadCompleted) {
							win.doClose();
						}
					},
					bindingvaluechange : function(value) {
						record.set(me.dataIndex, value);
					},
					uploaderclose : function() {
						win.doClose();
					}
				}
			}),
			listeners : {
				afterrender : function(self) {
					var uploader = self.down('etnaattachmentfield');
					uploader.setValue(fileGroupValue);
					me.setUploader(uploader.getUploader());
				},
				beforeclose : function(self) {
					var uploader = self.down('etnaattachmentfield');
					if(uploader.hasUploadFiles()) {
						Ext.Msg.show({
							title : me.closeConfirmTitle,
							msg : me.closeConfirmMessage,
							buttons : Ext.Msg.YESNOCANCEL,
							icon : Ext.MessageBox.QUESTION,
							fn : function(btn, text) {
								if(btn == "yes") {
									win.closeWindowAfterUploadCompleted = true;
									uploader.upload();
								}
								else if(btn == "no") {
									win.doClose();
								}
							}
						});
						return false;
					}
				},
				close : function() {
					me.setUploader(null);
				},
				scope : me
			}
		}));
	},
	
	/**
	 * @method setReadOnly
	 * @param {Boolean} value 읽기속성
	 */
	setReadOnly : function(value) {
		var me = this,
			uploader = me.getUploader();
		
		if(uploader) {
			uploader.setReadOnly(value);
		}
		Ext.apply(me.getUploaderConfig(), {
			readOnly : value
		});
		me.readOnly = value;
	},
	
	/**
	 * @method getReadOnly
	 */
	getReadOnly : function() {
		var me = this;
		return me.readOnly;
	}
});

/**
 * OZ-Viewer Manager Class
 *  : 오즈뷰어관련 구성정보를 제공한다.
 */
Ext.define('Kepco.ozviewer.Manager', {
    extend: 'Ext.Base',

    singleton: true,
    
    ozRootUrl : '/oz60',
    ozLoadPath : '/loadviewer',
    ozServerPath : '/server',
    
//    dbPropAlias : 'oracleTest',
    dbPropAlias : 'oracleQa',
    
    
    getOZLoadUrl : function() {
    	var me = this;
    	return me.ozRootUrl + me.ozLoadPath;
    },
    
    getOZServerUrl : function() {
    	var me = this;
    	return me.ozRootUrl + me.ozServerPath;
    },
    
	getDBPropAlias : function() {
		var me = this;
    	return me.dbPropAlias;
	}
});


/**
 * 마스킹 처리
*/
Ext.define('Site.util.Masking', {
	singleton : true,
	//주민등록번호
	maskStart : function(size) {
		var start = "";
		for(var i = 0; i < size ; ++i){
			start += "*";
		}
		return start;
	},//주민등록번호
	maskJuminNo : function(value) {
		if(!value)
			return value;
		
		var size = value.length;
		return (size > 6) ? value.substring(0,6) + '-' + Site.util.Masking.maskStart(size - 6) : value;
	}
	
});

/**
* 평가
*/
Ext.define('Kepco.grid.EvalFactorGridPanelBusiness', {
	extend : 'Ext.grid.Panel',
	alias : 'widget.kepcoEvalfactorgridpanelBusiness',
	
	config : {
		readOnly : false,
		
		hiddenExclusiveColumn : false,
		
		hiddenEvaluatorBasisTypeColumn : true,
		
		exclusiveFactorScaleText : '',
		
		factorScaleText : '',
		
		allotText : '',
		
		exclusiveAllotText : ''
			
	},
	
	autoScroll : true,
	
	enableLocking : false,
	
	hideHeaders : false,
	
	columnLines : true,
	
	bufferedRenderer : false,

	injectBufferedRendererAfterLayout : true,
	
	constructor : function(config) {
		var me = this;
		me.callParent(arguments);
		me.interceptConfigSetter();
	},
	
	initComponent : function() {
		var me = this;
		Ext.apply(me, {
			columns : me.processColumns(me.columns || []),
			plugins : me.processPlugins(me.plugins || []),
			features : me.processFeatures(me.features || [])
		});
		me.callParent(arguments);
	},
	
	processColumns : function(columns) {
		var me = this;

		columns.push({
			xtype: 'gridcolumn',
			sortable: false,
			menuDisabled: true,
			text: '#{신용평가등급에 의한 경영상태 평가}',
			columns: [{
				xtype: 'gridcolumn',
				sortable: false,
				menuDisabled: true,
				text: '#{신용평가 등급}',
				columns: [
				          {
				        	  text : '#{회사채에</br>대한</br>신용평가등급}',
				        	  width : 125,
				        	  tdCls: 'x-grid-column-td-vertical',
				        	  sortable: false,
				        	  draggable : false,
				      		  resizable : false,
				        	  menuDisabled: true,
				        	  widget : {
				        		  evalFactorName : true
				        	  }
				          },{
				        	  text : '#{기업어음에</br>대한</br>신용평가등급}',
				        	  width : 120,
				        	  tdCls: 'x-grid-column-td-vertical',
				        	  sortable: false,
				        	  draggable : false,
				      		  resizable : false,
				        	  menuDisabled: true,
				        	  widget : {
				        		  factorName : true
				        	  }
				          },{
				        	  text : '#{기업신용평가등급}',
				        	  width: 400,
				        	  tdCls: 'x-grid-column-td-vertical',
				        	  widget : {
				        		  scales : true,
				        		  resizer : {}
				        	  },
				        	  sortable: false,
				        	  draggable : false,
				      		  resizable : false,
				        	  menuDisabled: true,
				        	  listeners : {
				        		  resize : function() {
				        			  var plugin = this.findPlugin('kepcoEvalfactorgridformBusiness');
				        			  if(plugin) {
				        				  plugin.resizeScales();
				        			  }
				        		  },
				        		  scope : me
				        	  }
				          }
				       ]
			},{
				xtype: 'gridcolumn',
				tdCls: 'x-grid-column-td-vertical',
				sortable: false,
				draggable : false,
	      		resizable : false,
	      	  	menuDisabled: true,
				text: '#{선택}',
				columns: [
				          {
				        	  text : me.getExclusiveFactorScaleText(),
				        	  hidden : me.getHiddenExclusiveColumn(),
				        	  tdCls: 'x-grid-column-td-vertical',
				        	  width : 100,
				        	  sortable: false,
				        	  menuDisabled: true,
				        	  widget : {
				        		  exclusive : true
				        	  }
				          },{
								text : me.getFactorScaleText(),
								tdCls: 'x-grid-column-td-vertical',
								width : 100,
								sortable: false,
								menuDisabled: true,
								widget : true
							}
				          ]
			},{
				text : '배점',
				tdCls: 'x-grid-column-td-vertical',
				width : 60,
				widget : {
					allots : true
				},
				sortable: false,
				draggable : false,
	      		resizable : false,
				menuDisabled: true
			},{
				text : me.getExclusiveAllotText(),
				tdCls: 'x-grid-column-td-vertical',
				hidden : me.getHiddenExclusiveColumn(),
				width : 60,
				height: 40,
				align: 'center',
				sortable: false,
				draggable : false,
	      		resizable : false,
				menuDisabled: true,
				widget : {
					exclusiveFactorAllot : true
				}
			},{
				text : me.getAllotText(),
				tdCls: 'x-grid-column-td-vertical',
				width : 60,
				height: 40,
				align: 'center',
				sortable: false,
				draggable : false,
	      		resizable : false,
				menuDisabled: true,
				widget : {
					factorAllot : true
				}
			}]
		});
		return columns;
	},
	
	processPlugins : function(plugins) {
		plugins.push({
			ptype : 'kepcoEvalfactorgridformBusiness'
		});
		return plugins;
	},
	
	processFeatures : function(features) {
		features.push({
			ftype : 'grouping',
			collapsible : false
		});
		return features;
	},
	
	getFactorScaleColumn : function() {
		var me = this,
			cm = me.getColumnManager();
		
		return Ext.Array.findBy(cm.getColumns(), function(column) {
			return column.widget === true;
		});
	},
	
	getExclusiveFactorScaleColumn : function() {
		var me = this,
			cm = me.getColumnManager();
		
		return Ext.Array.findBy(cm.getColumns(), function(column) {
			return (Ext.isObject(column.widget) && column.widget.exclusive);
		});
	},
	
	interceptConfigSetter : function() {
		var me = this;
		Ext.Function.interceptAfter(me, 'setReadOnly', function(value) {
			var plugin = this.findPlugin('kepcoEvalfactorgridformBusiness');
			if(!plugin) {
				Ext.defer(arguments.callee, 10, this, [value], true);
				return;
			}
			plugin.setReadOnly(value);
		}, me);
		Ext.Function.interceptAfter(me, 'setHiddenExclusiveColumn', function(value) {
			var cm = this.getColumnManager(),
				plugin = this.findPlugin('kepcoEvalfactorgridformBusiness');
			Ext.Array.each(cm.getColumns(), function(column) {
				if(Ext.isObject(column.widget) && column.widget.exclusive) {
					column.setHidden(value);
					if(plugin) {
						plugin.setHiddenExclusiveText(value);
					}
				}
			});
		}, me);
	}
	
});

Ext.define('Kepco.grid.plugin.EvalFactorGridFormBusiness', {
	extend : 'Ext.AbstractPlugin',
	alias : 'plugin.kepcoEvalfactorgridformBusiness',
	
	evalFactorGroupId : 'evalFactorGroupId',
	
	factorInputType : 'factorInputType',
	
	scaleType : 'scaleType',
	
	evalFactorScales : 'evalFactorScales',
	
	evaluatorFactorGroups : 'evaluatorFactorGroups',
	
	exclusiveFactorScales : 'exclusiveFactorScales',
	
	selectFactorScales : 'selectFactorScales',
	
	evalFactorGroupPath : 'evalFactorGroupPath',
	
	evanFactorScale : 'allot',
	
	variables : 'selectVariableDatas',//variables -> selectVariableDatas
	
	exclusiveVariables : 'exclusiveVariables',
	
	evalFactorScalesName : 'name',
	
	evalFactorName : 'name',
	
	evalTypeName : 'adjustmentType',
	
	calulation : 'calulation',
	
	evalVariableName : 'evalVariableName',
	
	scaleNameFormat : '{0}_scale',
	
	exclusiveTextCls : Ext.baseCSSPrefix + 'exclusive-text',
	
	evalFactorNameFormat : '{0}. {1}',
	
	calculateNameFormat : '{0}. {1} </br> {2}',	
	
	intervalFrom : 'intervalFrom',
	
	intervalTo : 'intervalTo',
	
	evalFactorGroupStyle : {
		fontSize : '16px',
		fontWeight : 'bold'
	},
	
	singleSelectionConfig : {
		xtype : 'radiogroup',
		vertical : true,
		columns : 1,
		defaults : {
			style : {
				'text-align' : 'center',
				'width' : '100%'
			},
			inputAttrTpl : 'style="margin-top:0px"',
			renderData : {
				bodyStyle : 'min-height:15px;height:15px;vertical-align:middle'
			}
		}
	},
	
	multiSelectionConfig : {
		xtype : 'checkboxgroup',
		vertical : true, 
		columns : 1,
		defaults : {
			style : {
				'text-align' : 'center',
				'width' : '100%'
			},
			inputAttrTpl : 'style="margin-top:0px"',
			renderData : {
				bodyStyle : 'min-height:15px;height:15px;vertical-align:middle'
			}
		}
	},
	
	defaultConfig : {
		xtype : 'numberfield',
		fieldStyle: 'text-align:right',
		value : 0,
		labelAlign : 'top'
	},
	
	variableConfig : {
		xtype : 'fieldcontainer',
		layout : {
			type : 'table',
			columns : 1
		},
		width : '100%',
		fieldDefaults : {
			width : '90%', 
			style : {
				'margin-left' : 'auto',
				'margin-right' : 'auto'
			}
		}
	},
	
	scalesConfig : {
		xtype : 'container',
		layout : {
			type : 'vbox',
			align : 'stretch'
		},
		style : {
			'text-align' : 'center'
	    },
		defaults : {
			xtype : 'label',
			width : '100%',
			style : {
				'text-align' : 'center',
		    	'margin' : '5px 0px'
		    }
		}
	},
	
	allotsConfig : {//kyk 추가
		xtype : 'container',
		layout : {
			type : 'vbox',
			align : 'stretch'
		},
		defaults : {
			xtype : 'displayfield',   
			width : '100%',
			height: 15,
			style : {
				'text-align' : 'center',
		    	'margin' : '5px 0px'
		    },
		    inputAttrTpl : 'style="margin-top:0px"'
		}
	},

	exclusiveFactorAllotConfig : {//kyk 추가
		xtype : 'label',
		margin : '5 0 0',
		style : {
			'text-align' : 'center',
			display : 'block'
		}
	},
	
	factorAllotConfig : {//kyk 추가
		xtype : 'label',
		margin : '5 0 0',
		style : {
			'text-align' : 'center',
			display : 'block'
		}
	},

	factorNameConfig : {
		xtype : 'label',
		margin : '5 0 0',
		style : {
			'text-align' : 'center',
			display : 'block'
		}
	},
	
	evalFactorNameConfig : {
		xtype : 'label',
		margin : '5 0 0',
		style : {
			'text-align' : 'center',
			display : 'block'
		}
	},
	
	headerStyle : {
		'float' : 'right',
		'text-align' : 'center',
		'position' : 'absolute'
	},
	
	liveWidgets : null,
	
	readOnly : false,
	
	init : function(grid) {
		var me = this,
			view = grid.view,
			bind = grid.getBind(),
			store = bind && bind.store ? bind.store.getValue() : grid.store;
		
		me.grid = grid;
		me.view = grid.view;
		me.liveWidgets = {};
		// http://alm.emro.co.kr/browse/TECHSUPP-524
		if(Ext.isIE){
			me.grid.view.navigationModel.focusItem = me.focusItem.bind(me);
		}
		me.setupStoreListeners(store);
		me.setupViewListeners(view);
		me.callParent(arguments);
	},
	// http://alm.emro.co.kr/browse/TECHSUPP-524
	focusItem : function(item){
		var me = this,
		navModel = me.view.navigationModel,
		selectedRecord = navModel.position.record;
		
		item.addCls(this.focusCls);
		me.liveWidgets[selectedRecord.internalId].focus();
		
	},

	setHiddenExclusiveText : function(value) {
		var me = this,
			grid = me.getCmp(),
			grouping = grid.getView().findFeature('grouping');
			store = grid.getStore(),
			groups = store.getGroups();
		
		Ext.Array.each(groups.getRange(), function(group) {
			var headerNode = grouping.getHeaderNode(group.getGroupKey());
			if((headerNode = Ext.fly(headerNode))) {
				var exclusiveText = headerNode.down('.' + me.exclusiveTextCls);
				exclusiveText.setVisible(!value);
			}
		});
	},
	
	setReadOnly : function(value) {
		var me = this;
		if(me.readOnly != value) {
			Ext.Object.each(me.liveWidgets, function(key) {
				var widget = me.liveWidgets[key],
					items;
				if(widget.widgetConfig === true) {
					items = Ext.isFunction(me.liveWidgets[key].getRefItems) ? widget.getRefItems() : [widget];
					Ext.Array.each(items, function(item) {
						item.setReadOnly(value);
					});
				}
			});
			me.readOnly = value;
		}
	},
	
	onDestroy: function() {
        var me = this;
        if (me.rendered) {
        	me.destroyWidgets();
        }
        me.evalGroupIndex = me.liveWidgets = undefined;
        Ext.destroy(me.viewListeners);
        Ext.destroy(me.storeListeners);
        me.callParent(arguments);
    },
    
    destroyWidgets : function() {
        var me = this,
        	grid = me.getCmp(),
        	cm = grid.getColumnManager(),
        	columns = cm.getColumns(),
        	widget;
        for(var prop in me.liveWidgets){
        	widget = me.liveWidgets[prop];
        	widget.$widgetRecord = widget.$widgetColumn = undefined;
            delete widget.getWidgetRecord;
            delete widget.getWidgetColumn;
            widget.destroy();
            delete me.liveWidgets[prop];
        }
    },
    
    resizeScales : function() {
    	var me = this,
    		widgetsKeys;
    	Ext.suspendLayouts();
    	Ext.Object.each(me.liveWidgets, function(key, widget) {
    		if(widget.widgetConfig.scales) {
    			if(widget.$widgetColumn.getWidth() != widget.getWidth()) {
    				widget.setWidth(widget.$widgetColumn.getWidth());
    				widgetsKeys = Ext.Array.filter(Ext.Object.getKeys(me.liveWidgets), function(k) {
    					if(key.substr(0, key.indexOf('-')) == k.substr(0, k.indexOf('-'))) {
    						return true;
    					}
    				});
    				if(widget.$widgetRecord.get(me.scaleType) != 'QualityCalculate') {
    					Ext.Array.each(widgetsKeys, function(k) {
    						var w = me.liveWidgets[k]; 
    						if(w.widgetConfig === true || w.widgetConfig.exclusive || w.widgetConfig.allots) {
    							Ext.defer(me.resizeGroup, 1, me, [widget, w], 0);
    						} 
    					});
    				}
    			}
    		}
    	});
    	Ext.resumeLayouts(true);
    },
    
    resizeGroup : function(scalesWidget, widget) {
    },
    
	privates : {
		
		renderWidget : function(cell, widget) {
			var me = this,
				cell = Ext.fly(cell),
				el;
			
			 cell.empty();
             if (el = (widget.el || widget.element)) {
                 cell.appendChild(el.dom);
             } else {
                 widget.render(cell.dom);
             }
		},
		
		getFreeWidget : function(record, widgetConfig) {
			var me = this,
				factorInputType = record.get(me.factorInputType),
				scaleType = record.get(me.scaleType),
				config;
			
			if(record.get('sumYn')){//합계인경우
				var value = '';
				if(widgetConfig.allots){
					value = record.get('totalSum'); 
				}else if(widgetConfig.factorAllot){
					value = record.get('innerSum');
				}else if(widgetConfig.exclusiveFactorAllot) {
					value = record.get('exclusiveSum');
				}else{
					if(typeof(widgetConfig) === 'boolean'){
						value = '합계';
					}
				}
				config = Ext.apply(Ext.clone(me.evalFactorNameConfig), {
					height : 21,
					data : value
				});
			}else{
				if(widgetConfig.exclusiveFactorAllot) {//kyk추가
					
					config = Ext.apply(Ext.clone(me.exclusiveFactorAllotConfig), {
						text : record.get('exclusiveAllot')
					});
				}else if(widgetConfig.factorAllot) {//kyk추가
					
					config = Ext.apply(Ext.clone(me.factorAllotConfig), {
						text : record.get('allot')
					});
				}else if(widgetConfig.evalFactorName) {//kyk추가
					
					var data = record.get('evaluatorFactorGroups');
					var text = record.get(me.evalFactorName);
					
					if(data){
						if(data.length === 1){
							text = data[0].factorGroupEvalName;
						}else if(data.length === 3){
							text = data[1].factorGroupEvalName;
						}
					}
					config = Ext.apply(Ext.clone(me.evalFactorNameConfig), {
						data : text
					});
				}else if(widgetConfig.factorName) {
					var factorNameText = record.get(me.evalFactorName);
					if(record.get(me.calulation)){
						factorNameText = Ext.String.format('{0} </br> {1}', record.get(me.evalFactorName), record.get(me.calulation));
					}
					
					config = Ext.apply(Ext.clone(me.factorNameConfig), {
						data : factorNameText
					});
					
				}
				else if(widgetConfig.scales) {
					config = Ext.clone(me.scalesConfig);
				}
				else if(widgetConfig.allots) {
					config = Ext.clone(me.allotsConfig);
				}
				else {
					if(factorInputType == 'QualityCalculate') {
						config = Ext.clone(me.variableConfig);
					}
					else {
						switch(scaleType) {
						case 'NotApply':
						case 'NumberInput' :
						case 'RangeScope' :
							config = Ext.apply(Ext.clone(me.defaultConfig), {
								minValue : record.get(me.intervalFrom), //kyk추가  평가시트의 제한점수 값으로 min/max설정
								maxValue : record.get(me.intervalTo),	//kyk추가  평가시트의 제한점수 값으로 min/max설정
								value : record.get(me.evanFactorScale)
							});
							break;
						case 'SingleSelection':
							config = Ext.clone(me.singleSelectionConfig);
							break;
						case 'MultiSelection':
							config = Ext.clone(me.multiSelectionConfig);
							break;
						}
					} 
				}
			}
			return Ext.widget(Ext.apply(config, {
				widgetConfig : widgetConfig,
	         	defaultBindProperty : 'value',
				factorInputType : factorInputType,
				scaleType : scaleType,
				items : me.getEvalFactorScales(record, widgetConfig),
				readOnly : widgetConfig.exclusive || me.readOnly,
				listeners : {
					change : function(field, newValue, oldValue) {
						var record = field.$widgetRecord,
						store = record.store,
						bindValue = newValue,
						bindObjValue,
						objValue = Ext.Object.getValues(newValue);

						var flag = false;
						if(objValue[0]){
							flag = true;
						}

						if(record) {
							if(field.scaleType == 'SingleSelection' || field.scaleType == 'MultiSelection') {
								bindValue = Ext.isArray(newValue['business']) ? newValue['business'] : [newValue['business']];
								var scaleGroups = record.get('scaleGroups');
								var scaleArr = [];
								Ext.each(scaleGroups, function(scaleGroup){
									var factorScales = scaleGroup.evalfactorScales;
									if(factorScales){
										Ext.each(factorScales, function(factorScale){
											scaleArr.push(factorScale);
										});
									}
								});
								bindObjValue = scaleArr;
								bindValue = Ext.Array.filter(bindObjValue, function(value) {
									return Ext.Array.contains(bindValue, value.id);
								});
								record.set(me.selectFactorScales, bindValue);
							}
							else {//kyk 추가
								record.set(me.evanFactorScale, bindValue);							
							}
						}
					}
				}
			}));
		},

		getEvalFactorScales : function(record, widgetConfig) {
			var me = this,	
				factorInputType = record.get(me.factorInputType),
				scaleType = record.get(me.scaleType),
				scales = [];
			
			if(widgetConfig.scales) {
				var scaleGroups = record.get('scaleGroups');

				Ext.each(scaleGroups, function(scaleGroup){
					var factorScales = scaleGroup.evalfactorScales;
					if(factorScales){
						Ext.each(factorScales, function(factorScale){
							var text = factorScale[me.evalFactorScalesName];
							if(scaleGroup.description && factorScale.orderNo === 1){
								text = scaleGroup.description + "</br>" + factorScale[me.evalFactorScalesName];
							}
							scales[factorScale.orderNo] = {
								data : text
							};
						});
					}
				});
			}
			else if(widgetConfig.allots) {

				var scaleGroups = record.get('scaleGroups');
				

				Ext.each(scaleGroups, function(scaleGroup){
					var factorScales = scaleGroup.evalfactorScales;
					
					if(factorScales){
						scales[factorScales[0].orderNo] = {
								value: factorScales[0][me.evanFactorScale]
						};
					}
				});
			}
			else if(widgetConfig === true || widgetConfig.exclusive){
				if(factorInputType == 'QualityCalculate') {
					var exclusiveVariables = record.get(me.exclusiveVariables); 
					Ext.Array.each(record.get(me.variables), function(data, index) {
						var exclusiveData = exclusiveVariables[index];
						if(exclusiveData) {
							exclusiveData = exclusiveData[me.evanFactorScale]; 
						}
						
						var isReadOnly = false;//kyk추가 정성계산의 variable의 inputType = Quantity이면 disabled
						if(data.inputType === 'Quantity'){
							isReadOnly = true;
						}
						
						var scaleValue = widgetConfig === true ? data[me.evanFactorScale] : exclusiveData;
						
						if(!scaleValue){ //kyk추가 numberfield default Value 0으로설정
							scaleValue = 0; 
						}
						scales.push(Ext.apply(Ext.clone(me.defaultConfig), {
							factorEvalId : record.get('factorEvalId'), //UI에서 validation check할때, 컴포넌트 찾는 기준 속성
							fieldLabel : data[me.evalVariableName],
							readOnly : widgetConfig.exclusive || me.readOnly || isReadOnly,
							value : scaleValue,
							$variableIndex : index,
							listeners : widgetConfig === true ? {
								change : function(field, newValue, oldValue) {
									var record = field.ownerCt.$widgetRecord,
										variables = record.get(me.variables),
										variable;
									
									if(record) {
										variable = variables[field.$variableIndex];
										if(variable) {
											variable[me.evanFactorScale] = newValue;
											record.set(me.variables, variables);
										}
									}
								}
							} : undefined
						}));
					});
				}
				else if(scaleType == 'SingleSelection' || scaleType == 'MultiSelection') {
					var selectScales = widgetConfig.exclusive ? record.get(me.exclusiveFactorScales) : record.get(me.selectFactorScales);
					var scaleGroups = record.get('scaleGroups');
					var scaleArr = [];
					Ext.each(scaleGroups, function(scaleGroup){
						var factorScales = scaleGroup.evalfactorScales;
						if(factorScales){
							scaleArr.push(factorScales[0])
						}
					});

					if(widgetConfig.exclusive){
						var scalesDatas = scaleArr;
						Ext.Array.each(scalesDatas, function(data) {
							scales[data.orderNo] = {
								name : 'business_Exclusive',//경영상태시트의 경우 하나만 선택가능해야함으로 name을 임의로 지정
								inputValue : data.id,
								readOnly : widgetConfig.exclusive || me.readOnly,
								checked : function(){
									return selectScales ? !!Ext.Array.findBy(selectScales, function(e) {
										return e.id == data.id;
									}) : false;
								}()
							};
						});
					}else{
						var scalesDatas = scaleArr;
						Ext.Array.each(scalesDatas, function(data) {
							scales[data.orderNo] = {
								name : 'business',//경영상태시트의 경우 하나만 선택가능해야함으로 name을 임의로 지정
								inputValue : data.id,
								readOnly : me.readOnly,
								checked : function(){
									return selectScales ? !!Ext.Array.findBy(selectScales, function(e) {
										return e.id == data.id;
									}) : false;
								}()
							};
						});
					}
				}
			}
			return function() {
				var retVal = [];
				Ext.Array.each(scales, function(scale) {
					if(scale) {
						retVal.push(scale);
					}
				});
				return retVal;
			}(); 
		},
		
		onStoreBeforeLoad : function(store) {
			store.removeAll();
		},
		onStoreLoad : function(store, records, successful, eOpts) {
		},
		onViewRefresh: function(view, records) {
            var me = this,
            	grid = me.getCmp(),
            	vcm = grid.getVisibleColumnManager(),
            	columns = vcm.getColumns(),
                rows = view.all,
                oldWidgetMap = me.liveWidgets,
                dataIndex = me.evanFactorScale,
                row, column, cell, widget, el, width, recordId, columnId,
                itemIndex, recordIndex, record,
                factorInputType;
                
            if (view.rendered) {
            	me.destroyWidgets();
            	me.liveWidgets = {};
            	Ext.suspendLayouts();
                for (itemIndex = rows.startIndex, recordIndex = 0; itemIndex <= rows.endIndex; itemIndex++, recordIndex++) {
                    record = records[recordIndex];
                    if (record.isNonData) {
                        continue;
                    }
                	row = view.getRow(rows.item(itemIndex));
                    if(!row) {
                    	break;
                    }
                    recordId = record.internalId;
                    factorInputType = record.get(me.factorInputType);
                    
                   for(var i=0, scalesWidget; i<columns.length; i++) {
                	   if(columns[i].widget) {
                		   column = columns[i];
                		   columnId = column.getId(),
                		   cell = grid.view.getCell(record, column);
                		   // Attempt to reuse the existing widget for this record.
            			   widget = me.liveWidgets[recordId + '-' + columnId] = oldWidgetMap[recordId + '-' + columnId] || me.getFreeWidget(record, column.widget);
            			   if(column.widget.scales) {
            				   scalesWidget = widget;
            			   }
            			   if(factorInputType != 'QualityCalculate' && (column.widget === true || column.widget.exclusive || column.widget.allots)) {
            				   widget.on('afterlayout', (function(scalesWidget, widget) {
            					  return Ext.Function.bind(me.resizeGroup, me, [scalesWidget, widget], 0);
            				   })(scalesWidget, widget), null, {single : true});
            			   }
                		   // http://alm.emro.co.kr/browse/TECHSUPP-524
                		   widget.focusable = true;
                		   delete oldWidgetMap[recordId + '-' + columnId];
                		   me.renderWidget(cell, widget);
                		   widget.$widgetRecord = record;
                		   widget.$widgetColumn = column;
                	   }
                    }
                }
                Ext.resumeLayouts(true);
                // Free any unused widgets from the old live map.
                // Move them into detachedBody.
                for (id in oldWidgetMap) {
                    widget = oldWidgetMap[id];
                    widget.$widgetRecord = widget.$widgetColumn = null;
                    me.freeWidgetStack.unshift(widget);
                    Ext.detachedBodyEl.dom.appendChild((widget.el || widget.element).dom);
                }
            }
        },
		setupViewListeners : function(view) {
			var me = this;
			me.viewListeners = view.on({
				refresh : me.onViewRefresh,
				scope : me,
				destroyable: true
			});
		},
		setupStoreListeners : function(store) {
			var me = this;
			me.storeListeners = store.on({
				beforeload : me.onStoreBeforeLoad,
				load : me.onStoreLoad,
				scope : me,
				destroyable: true
			});
		}
	}
});

/**
 * 공통 평가 항목 패널
 */

//mouse down 시 position 줄 때, focus 강제로 안주도록
Ext.define('Kepco.grid.NavigationModel', {
	extend : 'Ext.grid.NavigationModel',
	
	 alias: 'view.navigation.kepco',
	 
	 focusItem : function(item) {
		 item.addCls(this.focusCls);
	 }
});


Ext.define('Kepco.eval.KepcoEvalPanel', {
	extend : 'Ext.grid.Panel',
	alias : 'widget.kepcoevalpanel',
	
	config : {
		readOnly : false,
		
		hiddenExclusiveColumn : false,
		
		hiddenEvaluatorBasisTypeColumn : true,
		
		exclusiveFactorScaleText : '',
		
		factorScaleText : '',
		
		allotText : ''
		
	},
	
	viewConfig : {
		navigationModel : 'kepco'
	},
	
	disableSelection : true,
	
	columnLines : true,
	
	rowLines : true,
	
	bufferedRenderer : false,

	injectBufferedRendererAfterLayout : true,
	
	autoScroll : true,
	
	enableLocking : false,
	
	cls : 'kepco-eval-panel',
	
	initComponent : function() {
		var me = this,
			store = me.getStore();

		if(store){
			store.on({
				load : me.onStoreLoad,
				scope : me
			});
			store.load();			
		}
		
		me.callParent(arguments);
	},
	
	defaultColumnConfig : {
		sortable : false,
		draggable : false,
		resizable : false,
		menuDisabled : true
	},
	
	defaultColumns : [{
		text : '평가항목',
		width : 200,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [];
			if(Ext.isArray(datas)) {
				Ext.Array.each(datas, function(data, index) {
					var evaluatorFactorDtos = data.evaluatorFactorDtos;
					Ext.Array.each(evaluatorFactorDtos, function(evaluatorFactorDto, index) {
						if(evaluatorFactorDto.name == null){
							evaluatorFactorDto.name = '';
						}
						
						if(evaluatorFactorDto.scaleType === 'RangeScope'){
							evaluatorFactorDto.name = evaluatorFactorDto.calulation;
						}
						items.push({
							xtype : 'component',
							cls : 'kepco-eval-component',
							group : true,
							html : '<span class="kepco-eval-component-span">' + evaluatorFactorDto.name + '</span>'
						});
						if(index < evaluatorFactorDtos.length-1) {
							items.push({
								xtype : 'component',
								cls : 'separator'
							});
						}
					});
					if(index < datas.length-1) {
						items.push({
							xtype : 'component',
							cls : 'separator'
						});
					}
				});
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center'
				},
				items : items,
				margin : 0,
				record : record
			});
		}
		
	},{
		text : '유형',
		width : 60,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [];
			if(Ext.isArray(datas)) {
				Ext.Array.each(datas, function(data, index) {
					var evaluatorFactorDtos = data.evaluatorFactorDtos;
					Ext.Array.each(evaluatorFactorDtos, function(evaluatorFactorDto, index) {
						var type = evaluatorFactorDto.adjustmentType, text = '';
						if(type === 'Addition'){
							text = '가점';
						}else if(type === 'Subtraction'){
							text = '감점';
						}else if(type === 'Adjustment'){
							text = '가감점';
						}else if(type === 'General') {
							text = '일반';
						}
						items.push({
							xtype : 'component',
							cls : 'kepco-eval-component',
							group : true,
							html : '<span class="kepco-eval-component-span">' + text + '</span>'
						});
						if(index < evaluatorFactorDtos.length-1) {
							items.push({
								xtype : 'component',
								cls : 'separator'
							});
						}
					});
					if(index < datas.length-1) {
						items.push({
							xtype : 'component',
							cls : 'separator'
						});
					}
				});
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center'
				},
				defaults : {
					style : {
						'text-align' : 'center'
					}
				},
				items : items,
				margin : 0,
				record : record
			});
		}
	},{
		dataIndex : 'scaleGroups',
		text : '스케일',
		subItems : true,
		isScaleColumn : true,
		width : 250,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [];
			if(Ext.isArray(datas)) {
				Ext.Array.each(datas, function(data, index) {
					var evaluatorFactorDtos = data.evaluatorFactorDtos;
					Ext.Array.each(evaluatorFactorDtos, function(evaluatorFactorDto, index) {
						var ret = [];
						if(evaluatorFactorDto.sumYn){//합계인경우
							ret.push({
								xtype : 'component',
								cls : 'kepco-eval-component',
								leaf : true,
								html : '<span class="kepco-eval-component-span">' + '합계' + '</span>'
							});
						}else if(evaluatorFactorDto.scaleType === 'NotApply'){//variable인 경우
							ret.push({
								xtype : 'component',
								cls : 'kepco-eval-component',
								description : true,
								html : '<span class="kepco-eval-component-span">' + evaluatorFactorDto.calulation + '</span>'
							});
						}else{
							var scaleGroups = evaluatorFactorDto.scaleGroups;
							Ext.Array.each(scaleGroups, function(scales) {
								if(!Ext.isEmpty(scales.description)) {
									ret.push({
										xtype : 'component',
										cls : 'kepco-eval-component',
										description : true,
										html : '<span class="kepco-eval-component-span">' + scales.description + '</span>'
									});
								}
								var evalfactorScales = scales.evalfactorScales;
								Ext.Array.each(evalfactorScales, function(scale, index) {
									ret.push({
										xtype : 'component',
										cls : 'kepco-eval-component',
										leaf : true,
										html : '<span class="kepco-eval-component-span">' + scale.name + '</span>'
									});
								});
								if(evalfactorScales.length == 0) {
									ret.push({
										xtype : 'component',
										cls : 'kepco-eval-component',
										leaf : true
									});
								}
							});
						}
						items.push({
							xtype : 'container',
							group : true,
							layout : {
								type : 'vbox',
								align : 'stretch',
								pack : 'center'
							},
							items : ret
						});
						if(index < evaluatorFactorDtos.length-1) {
							items.push({
								xtype : 'component',
								cls : 'separator'
							});
						}
					});
					if(index < datas.length-1) {
						items.push({
							xtype : 'component',
							cls : 'separator'
						});
					}
				});
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center'
				},
				items : items,
				margin : 0,
				record : record
			});
		}
	}, {
		text : '배점',
		subItems : true,
		width : 50,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [];
			if(Ext.isArray(datas)) {
				Ext.Array.each(datas, function(data, index) {
					var evaluatorFactorDtos = data.evaluatorFactorDtos;
					Ext.Array.each(evaluatorFactorDtos, function(evaluatorFactorDto, index) {
						var ret = [];
						if(me.type){
							ret.push({
								xtype : 'component',
								cls : 'kepco-eval-component',
								leaf : true,
								html : '<span class="kepco-eval-component-span">' + evaluatorFactorDto.intervalFrom + '~' + evaluatorFactorDto.intervalTo + '</span>'
							});

						}else{
							if(evaluatorFactorDto.sumYn){//합계인경우
								ret.push({
									xtype : 'component',
									cls : 'kepco-eval-component',
									leaf : true,
									html : '<span class="kepco-eval-component-span">' + evaluatorFactorDto.totalSum + '</span>'
								});
							}else if(evaluatorFactorDto.scaleType === 'NotApply'){//variable인 경우
								ret.push({
									xtype : 'component',
									cls : 'kepco-eval-component',
									description : true,
									html : '<span class="kepco-eval-component-span">' + evaluatorFactorDto.allot + '</span>'
								});
							}else{
								var scaleGroups = evaluatorFactorDto.scaleGroups;
								Ext.Array.each(scaleGroups, function(scales) {
									if(!Ext.isEmpty(scales.description)) {
										ret.push({
											xtype : 'component',
											cls : 'kepco-eval-component',
											description : true
										});
									}
									var evalfactorScales = scales.evalfactorScales;
									Ext.Array.each(evalfactorScales, function(scale) {
										ret.push({
											xtype : 'component',
											cls : 'kepco-eval-component',
											leaf : true,
											html : '<span class="kepco-eval-component-span">' + scale.allot + '</span>'
										});
									});
								});
							}
						}
						items.push({
							xtype : 'container',
							group : true,
							layout : {
								type : 'vbox',
								align : 'stretch',
								pack : 'center'
							},
							defaults : {
								style : {
									'text-align' : 'center'
								}
							},
							items : ret
						});
						if(index < evaluatorFactorDtos.length-1) {
							items.push({
								xtype : 'component',
								cls : 'separator'
							});
						}

					});
					if(index < datas.length-1) {
						items.push({
							xtype : 'component',
							cls : 'separator'
						});
					}
				});
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center'
				},
				items : items,
				margin : 0,
				record : record
			});
		}
	},{
		text : '응찰자',
		subItems : true,
		isExclusive: true,
		width : 120,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [],
				variables = false;
			if(Ext.isArray(datas)) {
				Ext.Array.each(datas, function(data, index) {
					var evaluatorFactorDtos = data.evaluatorFactorDtos;
					Ext.Array.each(evaluatorFactorDtos, function(evaluatorFactorDto, index) {
						var scaleGroups = evaluatorFactorDto.scaleGroups;
						var ret = [];
						Ext.Array.each(scaleGroups, function(scales) {
//							var variableDatas = scales.variableDatas;//kyk수정
							if(!Ext.isEmpty(scales.description)) {
								ret.push({
									xtype : 'component',
									cls : 'kepco-eval-component',
									description : true
								});
							}
							var variableDatas = evaluatorFactorDto.exclusiveVariables;
							if(variableDatas && variableDatas.length > 0) {
								Ext.Array.each(variableDatas, function(variable) {
									ret.push({
										fieldLabel : variable.evalVariableName,
										cls : 'kepco-eval-variablefield',
										labelAlign : 'top',
										xtype : 'numberfield',
										leaf : true,
										variable : true,
										record : record,
										variable : variable,
										fieldStyle: 'text-align:right',
										hideTrigger: true,
										coverFormat : '0,000.####',
										decimalPrecision: 4,
										evaluatorFactorDto : evaluatorFactorDto,
										getLabelableRenderData : function() {// 기존 html의 label for이라는 속성 제거
											var data = Ext.form.Labelable.prototype.getLabelableRenderData.call(this);
											delete data.inputId;
											return data;
										},
										value : function(){
											if(variable.allot || variable.allot == null){
												variable.evalFactorGroupId =  evaluatorFactorDto.evalFactorGroupId;
												variable.factorEvalId = evaluatorFactorDto.factorEvalId;
												variable.evalFactorAllot = evaluatorFactorDto.allot;
												variable.evaluatorFactorEvalId = evaluatorFactorDto.id;
												
//												var objValue = record.get('selectVariableDatas');
//												
//												if(!objValue){
//													objValue = [];
//													objValue.push(variable);
//												}else{
//													var filtered = Ext.Array.filter(objValue, function(value){
//														if(value['evalFactorGroupId'] === variable.evalFactorGroupId && value['evalVariableId'] === variable.evalVariableId){
//															return value;
//														}
//													});
//													
//													if(filtered.length > 0){
//														filtered[0].allot = variable.allot;
//													}else{
//														objValue.push(variable);
//													}
//												}
//												
//												record.set('selectVariableDatas', objValue);									
											}
											
											if(variable.allot == null){
												variable.allot = 0;
											}
											return variable.allot;
										}(),
										readOnly : me.isExclusive || me.isExclusiveAllot || me.readOnly || variable.inputType == 'Quantity',
										listeners : {
											change : function(field, newValue, oldValue) {
												var variable = field.variable,
												record = field.record,
												evaluatorFactorDto = field.evaluatorFactorDto;
												variable.allot = newValue;
												variable.evalFactorGroupId =  evaluatorFactorDto.evalFactorGroupId;
												variable.factorEvalId = evaluatorFactorDto.factorEvalId;
												variable.evalFactorAllot = evaluatorFactorDto.allot;
												variable.evaluatorFactorEvalId = evaluatorFactorDto.id;
												
//												var objValue = record.get('selectVariableDatas');
//												
//												if(!objValue){
//													objValue = [];
//													objValue.push(variable);
//												}else{
//													var filtered = Ext.Array.filter(objValue, function(value){
//														if(value['evalFactorGroupId'] === variable.evalFactorGroupId && value['evalVariableId'] === variable.evalVariableId){
//															return value;
//														}
//													});
//													
//													if(filtered.length > 0){
//														filtered[0].allot = variable.allot;
//													}else{
//														objValue.push(variable);
//													}
//												}
//												
//												record.set('selectVariableDatas', objValue);
											},
											afterrender : function(component, eOpts) {

												component.findPlugin('inputcover').onCoverClick = function() {
													var me = this,
														cmp = me.getCmp();
													
													me.hideCover();
													if(cmp.readOnly) {
														return;
													}
													me.getCmp().focus();
												}
										    }
										}
									});
								});
								variables = true;
							}
							else {
								variables = false;
								var evalfactorScales = scales.evalfactorScales;
								Ext.Array.each(evalfactorScales, function(scale) {
									var selectedScales = evaluatorFactorDto.exclusiveFactorScales;
									var flag = false;
									
									Ext.each(selectedScales, function(selectedScale){
										//01/29 수정 - 응찰자와 똑같이 선택한 실무자가 선택해제 눌렀을 때, 응찰자의  것도 바뀜
//										Ext.Object.equals(selectedScale, scale)
										if(selectedScale.id === scale.id){
											flag = true;
											return false;
										}
									});
									var name = scale.evalFactorSettingId;
									if(me.isExclusive){
										name = scale.evalFactorSettingId + 'exclusive';
									}
									if(evaluatorFactorDto.scaleType == 'SingleSelection') {
										ret.push({
											xtype : 'radiofield',
											leaf : true,
											scale : scale,
											record : record,
											evaluatorFactorDto : evaluatorFactorDto,
											inputValue : scale.allot,
											name : name,
											readOnly : me.isExclusive || me.isExclusiveAllot || me.readOnly,
											checked : flag,
											listeners : {
												change : function(field, newValue, oldValue) {
													var scale = field.scale,
													record = field.record,
													evaluatorFactorDto = field.evaluatorFactorDto;
//													scale.allot = newValue;
													scale.evalFactorGroupId =  evaluatorFactorDto.evalFactorGroupId;
													scale.factorEvalId = evaluatorFactorDto.factorEvalId;
													scale.evalFactorAllot = evaluatorFactorDto.allot;
													scale.evaluatorFactorEvalId = evaluatorFactorDto.id;
													
													var objValue = record.get('selectFactorScales');
													
													if(!objValue){
														objValue = [];
														objValue.push(scale);
													}else{
														var filtered = Ext.Array.filter(objValue, function(value){
															if(value['evalFactorSettingId'] === scale.evalFactorSettingId && value['id'] === scale.id){
																return value;
															}
														});
														
														if(filtered.length > 0){
															Ext.Array.remove(objValue, filtered[0]);
														}else{
															objValue.push(scale);
														}
													}
													
													record.set('selectFactorScales', objValue);
												}
											}
										});
									}
									else if(evaluatorFactorDto.scaleType == 'MultiSelection') {
										var selectedScales = evaluatorFactorDto.exclusiveFactorScales;
										var flag = false;
										
										Ext.each(selectedScales, function(selectedScale){
											//01/29 수정 - 응찰자와 똑같이 선택한 실무자가 선택해제 눌렀을 때, 응찰자의  것도 바뀜
//											Ext.Object.equals(selectedScale, scale)
											if(selectedScale.id === scale.id){
												flag = true;
												return false;
											}
										});
										ret.push({
											xtype : 'checkboxfield',
											leaf : true,
											scale : scale,
											record : record,
											evaluatorFactorDto : evaluatorFactorDto,
											inputValue : scale.allot,
											checked :flag,
											readOnly : me.isExclusive || me.isExclusiveAllot || me.readOnly,
											listeners : {
												change : function(field, newValue, oldValue) {
													var scale = field.scale,
													record = field.record,
													evaluatorFactorDto = field.evaluatorFactorDto;
//													scale.allot = newValue;
													scale.evalFactorGroupId =  evaluatorFactorDto.evalFactorGroupId;
													scale.factorEvalId = evaluatorFactorDto.factorEvalId;
													scale.evalFactorAllot = evaluatorFactorDto.allot;
													scale.evaluatorFactorEvalId = evaluatorFactorDto.id;
													
													var objValue = record.get('selectFactorScales');
													
													if(!objValue){
														objValue = [];
														objValue.push(scale);
													}else{
														var filtered = Ext.Array.filter(objValue, function(value){
															if(value['evalFactorSettingId'] === scale.evalFactorSettingId && value['id'] === scale.id){
																return value;
															}
														});
														
														if(filtered.length > 0){
															Ext.Array.remove(objValue, filtered[0]);
														}else{
															objValue.push(scale);
														}
													}
													
													record.set('selectFactorScales', objValue);
												}
											}
										});
									}
									else if(evaluatorFactorDto.scaleType == 'NumberInput') {
										ret.push({
											xtype : 'numberfield',
											fieldStyle: 'text-align:right',
											coverFormat : '0,000.####',
											decimalPrecision: 4,
											getLabelableRenderData : function() {
												var data = Ext.form.Labelable.prototype.getLabelableRenderData.call(this);
												delete data.inputId;
												return data;
											},
											leaf : true,
											listeners : {
												change : function(field, newValue, oldValue) {
												},
												afterrender : function(component, eOpts) {

													component.findPlugin('inputcover').onCoverClick = function() {
														var me = this,
															cmp = me.getCmp();
														
														me.hideCover();
														if(cmp.readOnly) {
															return;
														}
														me.getCmp().focus();
													}
											    }
											}
										});
									}
									else if(evaluatorFactorDto.scaleType == 'RangeScope') {
										ret.push({
											xtype : 'radiofield',
											leaf : true,
											disabled : true
										});
									}
									else if(evaluatorFactorDto.scleType == 'NotApply') {
										
									}
								});
							}
						});
						items.push({
							xtype : 'container',
							group : true,
							layout : {
								type : 'vbox',
								align : 'stretch',
								pack : 'center'
							},
							defaults : {
								margin : 0,
								padding : 5,
								style : {
									'text-align' : 'center'
								}
							},
							items : ret
						});
						if(index < evaluatorFactorDtos.length-1) {
							items.push({
								xtype : 'component',
								cls : 'separator'
							});
						}
					});
					if(index < datas.length-1) {
						items.push({
							xtype : 'component',
							cls : 'separator'
						});
					}
				});
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center'
				},
				items : items,
				variables : variables,
				record : record,
				defaults : {
					margin : 0
				}
			});
		}
	},{
		text : '심사자',
		subItems : true,
		isFactorScale: true,
		width : 120,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [],
				variables = false;
			if(Ext.isArray(datas)) {
				Ext.Array.each(datas, function(data, index) {
					var evaluatorFactorDtos = data.evaluatorFactorDtos;
					Ext.Array.each(evaluatorFactorDtos, function(evaluatorFactorDto, index) {
						var scaleGroups = evaluatorFactorDto.scaleGroups;
						var ret = [];
						if(me.type){
							if(me.type === 'proposalEval'){//제안 심사의 경우 소수점 2자리까지만 입력 가능하도록 적용
								ret.push({
									xtype : 'numberfield',
									minValue : evaluatorFactorDto.intervalFrom,
									maxValue : evaluatorFactorDto.intervalTo,
									readOnly : me.readOnly,
									record : record,
									evaluatorFactorDto : evaluatorFactorDto,
									value : evaluatorFactorDto.allot,
									fieldStyle: 'text-align:right',
									decimalPrecision: 2,
									enableKeyEvents: true,
									leaf : true,
									getLabelableRenderData : function() {
										var data = Ext.form.Labelable.prototype.getLabelableRenderData.call(this);
										delete data.inputId;
										return data;
									},
									listeners : {
										change : function(field, newValue, oldValue) {
											var dto = field.evaluatorFactorDto;
											
											dto.allot = newValue;
										},
										keypress: function(field, e){
											var me = this;	
											me.decimalPrecisionInput(field,e)
										},
										afterrender : function(component, eOpts) {

											component.findPlugin('inputcover').onCoverClick = function() {
												var me = this,
													cmp = me.getCmp();
												
												me.hideCover();
												if(cmp.readOnly) {
													return;
												}
												me.getCmp().focus();
											}
									    }
									}
								});
							}else{
								ret.push({
									xtype : 'numberfield',
									minValue : evaluatorFactorDto.intervalFrom,
									maxValue : evaluatorFactorDto.intervalTo,
									readOnly : me.readOnly,
									record : record,
									evaluatorFactorDto : evaluatorFactorDto,
									value : evaluatorFactorDto.allot,
									fieldStyle: 'text-align:right',
									coverFormat : '0,000.####',
									decimalPrecision: 4,
									leaf : true,
									getLabelableRenderData : function() {
										var data = Ext.form.Labelable.prototype.getLabelableRenderData.call(this);
										delete data.inputId;
										return data;
									},
									listeners : {
										change : function(field, newValue, oldValue) {
											var dto = field.evaluatorFactorDto;
											
											dto.allot = newValue;
										},
										afterrender : function(component, eOpts) {

											component.findPlugin('inputcover').onCoverClick = function() {
												var me = this,
													cmp = me.getCmp();
												
												me.hideCover();
												if(cmp.readOnly) {
													return;
												}
												me.getCmp().focus();
											}
										}
									}
								});
							}
						}else{
							Ext.Array.each(scaleGroups, function(scales) {
//								var variableDatas = scales.variableDatas;//kyk수정
								if(!Ext.isEmpty(scales.description)) {
									ret.push({
										xtype : 'component',
										cls : 'kepco-eval-component',
										description : true
									});
								}
								var variableDatas = evaluatorFactorDto.selectVariableDatas;
								if(variableDatas && variableDatas.length > 0) {
									Ext.Array.each(variableDatas, function(variable) {
										ret.push({
											fieldLabel : variable.evalVariableName,
											cls : 'kepco-eval-variablefield',
											labelAlign : 'top',
											xtype : 'numberfield',
											leaf : true,
											variable : true,
											record : record,
											variable : variable,
											evaluatorFactorDto : evaluatorFactorDto,
											fieldStyle: 'text-align:right',
											coverFormat : '0,000.####',
											hideTrigger: true,
											decimalPrecision: 4,
											getLabelableRenderData : function() {
												var data = Ext.form.Labelable.prototype.getLabelableRenderData.call(this);
												delete data.inputId;
												return data;
											},
											value : function(){
												if(variable.allot || variable.allot == null){
													variable.evalFactorGroupId =  evaluatorFactorDto.evalFactorGroupId;
													variable.factorEvalId = evaluatorFactorDto.factorEvalId;
													variable.evalFactorAllot = evaluatorFactorDto.allot;
													variable.evaluatorFactorEvalId = evaluatorFactorDto.id;

													var objValue = record.get('selectVariableDatas');

													if(!objValue){
														objValue = [];
														objValue.push(variable);
													}else{
														var filtered = Ext.Array.filter(objValue, function(value){
															if(value['evalFactorGroupId'] === variable.evalFactorGroupId && value['evalVariableId'] === variable.evalVariableId){
																return value;
															}
														});

														if(filtered.length > 0){
															filtered[0].allot = variable.allot;
														}else{
															objValue.push(variable);
														}
													}
													
													record.set('selectVariableDatas', objValue);									
												}

												if(variable.allot == null){
													variable.allot = 0;
												}
												return variable.allot;
											}(),
											readOnly : me.isExclusive || me.isExclusiveAllot || me.readOnly || variable.inputType == 'Quantity',
											listeners : {
												change : function(field, newValue, oldValue) {
													var variable = field.variable,
													record = field.record,
													evaluatorFactorDto = field.evaluatorFactorDto;
													variable.allot = newValue;
													variable.evalFactorGroupId =  evaluatorFactorDto.evalFactorGroupId;
													variable.factorEvalId = evaluatorFactorDto.factorEvalId;
													variable.evalFactorAllot = evaluatorFactorDto.allot;
													variable.evaluatorFactorEvalId = evaluatorFactorDto.id;

													var objValue = record.get('selectVariableDatas');

													if(!objValue){
														objValue = [];
														objValue.push(variable);
													}else{
														var filtered = Ext.Array.filter(objValue, function(value){
															if(value['evalFactorGroupId'] === variable.evalFactorGroupId && value['evalVariableId'] === variable.evalVariableId){
																return value;
															}
														});

														if(filtered.length > 0){
															filtered[0].allot = variable.allot;
														}else{
															objValue.push(variable);
														}
													}

													record.set('selectVariableDatas', objValue);
												},
												afterrender : function(component, eOpts) {

													component.findPlugin('inputcover').onCoverClick = function() {
														var me = this,
															cmp = me.getCmp();
														
														me.hideCover();
														if(cmp.readOnly) {
															return;
														}
														me.getCmp().focus();
													}
											    }
											}
										});
									});
									variables = true;
								}
								else {
									variables = false;
									var evalfactorScales = scales.evalfactorScales;
									Ext.Array.each(evalfactorScales, function(scale) {
										var selectedScales = evaluatorFactorDto.selectFactorScales;
										var flag = false;

										Ext.each(selectedScales, function(selectedScale){
											if(Ext.Object.equals(selectedScale, scale)){
												flag = true;
												
												var copyScale = Ext.clone(scale);
												copyScale.evalFactorGroupId =  evaluatorFactorDto.evalFactorGroupId;
												copyScale.factorEvalId = evaluatorFactorDto.factorEvalId;
												copyScale.evalFactorAllot = evaluatorFactorDto.allot;
												copyScale.evaluatorFactorEvalId = evaluatorFactorDto.id;
												var objValue = record.get('selectFactorScales');

												if(!objValue){
													objValue = [];
													objValue.push(copyScale);
												}else{
													var filtered = Ext.Array.filter(objValue, function(value){
														if(value['evalFactorSettingId'] === copyScale.evalFactorSettingId && value['id'] === copyScale.id){
															return value;
														}
													});

													if(filtered.length > 0){
														Ext.Array.remove(objValue, copyScale);
													}else{
														objValue.push(copyScale);
													}
												}

												record.set('selectFactorScales', objValue);
												
												
												return false;
											}
										});
										if(evaluatorFactorDto.scaleType == 'SingleSelection') {
											ret.push({
												xtype : 'radiofield',
												leaf : true,
												scale : scale,
												record : record,
												evaluatorFactorDto : evaluatorFactorDto,
												inputValue : scale.allot,
												name : scale.evalFactorSettingId,
												readOnly : me.isExclusive || me.isExclusiveAllot || me.readOnly,
												checked : function(){
													
													/*
													 * 자재 중소기업 적격심사 납품실적 평가시 (10억이상)
													 *	창조기업 대상, 비대상 Radio 디폴트 체크를 비대상으로 자동 체크
													 * */
													if(me.firstTab && me.code === '02'){
														var selectFactorScales = record.get('selectFactorScales');
														if(!selectFactorScales){ //선택된 스케일이 없을때만 default 설정
															var scales = evaluatorFactorDto.scaleGroups[0].evalfactorScales;
															var scaleIndex = scales.indexOf(scale);
															if(scaleIndex === 1){
																var arr = [];
																var copyScale = Ext.clone(scale);
																copyScale.evalFactorGroupId =  evaluatorFactorDto.evalFactorGroupId;
																copyScale.factorEvalId = evaluatorFactorDto.factorEvalId;
																copyScale.evalFactorAllot = evaluatorFactorDto.allot;
																copyScale.evaluatorFactorEvalId = evaluatorFactorDto.id;
																arr.push(copyScale);
																record.set('selectFactorScales', arr);
																return true;
															}else{
																return false;
															}
														}
													}
													return flag;
													
												}(),
												listeners : {
													change : function(field, newValue, oldValue) {
														var scale = field.scale,
														record = field.record,
														evaluatorFactorDto = field.evaluatorFactorDto;
//														scale.allot = newValue;
														scale.evalFactorGroupId =  evaluatorFactorDto.evalFactorGroupId;
														scale.factorEvalId = evaluatorFactorDto.factorEvalId;
														scale.evalFactorAllot = evaluatorFactorDto.allot;
														scale.evaluatorFactorEvalId = evaluatorFactorDto.id;

														var objValue = record.get('selectFactorScales');

														if(!objValue){
															objValue = [];
															objValue.push(scale);
														}else{
															var filtered = Ext.Array.filter(objValue, function(value){
																if(value['evalFactorSettingId'] === scale.evalFactorSettingId && value['id'] === scale.id){
																	return value;
																}
															});

															if(filtered.length > 0){
																Ext.Array.remove(objValue, filtered[0]);
															}else{
																objValue.push(scale);
															}
														}

														record.set('selectFactorScales', objValue);
													}
												}
											});
										}
										else if(evaluatorFactorDto.scaleType == 'MultiSelection') {
											var selectedScales = evaluatorFactorDto.selectFactorScales;
											var flag = false;

											Ext.each(selectedScales, function(selectedScale){
												if(Ext.Object.equals(selectedScale, scale)){
													flag = true;
													return false;
												}
											});
											ret.push({
												xtype : 'checkboxfield',
												leaf : true,
												scale : scale,
												record : record,
												evaluatorFactorDto : evaluatorFactorDto,
												inputValue : scale.allot,
												checked :flag,
												readOnly : me.isExclusive || me.isExclusiveAllot || me.readOnly,
												listeners : {
													change : function(field, newValue, oldValue) {
														var scale = field.scale,
														record = field.record,
														evaluatorFactorDto = field.evaluatorFactorDto;
//														scale.allot = newValue;
														scale.evalFactorGroupId =  evaluatorFactorDto.evalFactorGroupId;
														scale.factorEvalId = evaluatorFactorDto.factorEvalId;
														scale.evalFactorAllot = evaluatorFactorDto.allot;
														scale.evaluatorFactorEvalId = evaluatorFactorDto.id;

														var objValue = record.get('selectFactorScales');

														if(!objValue){
															objValue = [];
															objValue.push(scale);
														}else{
															var filtered = Ext.Array.filter(objValue, function(value){
																if(value['evalFactorSettingId'] === scale.evalFactorSettingId && value['id'] === scale.id){
																	return value;
																}
															});

															if(filtered.length > 0){
																Ext.Array.remove(objValue, filtered[0]);
															}else{
																objValue.push(scale);
															}
														}

														record.set('selectFactorScales', objValue);
													}
												}
											});
										}
										else if(evaluatorFactorDto.scaleType == 'NumberInput') {
											ret.push({
												xtype : 'numberfield',
												leaf : true,
												getLabelableRenderData : function() {
													var data = Ext.form.Labelable.prototype.getLabelableRenderData.call(this);
													delete data.inputId;
													return data;
												},
												listeners : {
													change : function(field, newValue, oldValue) {
													},
													afterrender : function(component, eOpts) {

														component.findPlugin('inputcover').onCoverClick = function() {
															var me = this,
																cmp = me.getCmp();
															
															me.hideCover();
															if(cmp.readOnly) {
																return;
															}
															me.getCmp().focus();
														}
												    }
												}
											});
										}
										else if(evaluatorFactorDto.scaleType == 'RangeScope') {
											ret.push({
												xtype : 'radiofield',
												leaf : true,
												disabled : true
											});
										}
										else if(evaluatorFactorDto.scleType == 'NotApply') {

										}
									});
								}
							});
						}
						items.push({
							xtype : 'container',
							group : true,
							layout : {
								type : 'vbox',
								align : 'stretch',
								pack : 'center'
							},
							defaults : {
								margin : 0,
								padding : 5,
								style : {
									'text-align' : 'center'
								}
							},
							items : ret
						});
						if(index < evaluatorFactorDtos.length-1) {
							items.push({
								xtype : 'component',
								cls : 'separator'
							});
						}
					});
					if(index < datas.length-1) {
						items.push({
							xtype : 'component',
							cls : 'separator'
						});
					}
				});
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center'
				},
				items : items,
				variables : variables,
				record : record,
				defaults : {
					margin : 0
				}
			});
		}
	}, {
		text : '응찰자</br>평점',
		isExclusiveAllot : true,
		width : 100,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [];
			if(Ext.isArray(datas)) {
				Ext.Array.each(datas, function(data, index) {
					var evaluatorFactorDtos = data.evaluatorFactorDtos;
					Ext.Array.each(evaluatorFactorDtos, function(evaluatorFactorDto, index) {
						var value = evaluatorFactorDto.exclusiveAllot;
						if(evaluatorFactorDto.sumYn){//합계인경우
							value = evaluatorFactorDto.exclusiveSum;
						}
						items.push({
							xtype : 'component',
							cls : 'kepco-eval-component',
							group : true,
							html : '<span class="kepco-eval-component-span">' + value + '</span>'
						});
						if(index < evaluatorFactorDtos.length-1) {
							items.push({
								xtype : 'component',
								cls : 'separator'
							});
						}
					});
					if(index < datas.length-1) {
						items.push({
							xtype : 'component',
							cls : 'separator'
						});
					}
				});
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center'
				},
				defaults : {
					margin : 0,
					padding : 5,
					style : {
						'text-align' : 'center'
					}
				},
				record : record,
				items : items
			});
		}
	}, {
		text : '실무자평점',
		isFactorAllot : true,
		width : 100,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [];
			if(Ext.isArray(datas)) {
				Ext.Array.each(datas, function(data, index) {
					var evaluatorFactorDtos = data.evaluatorFactorDtos;
					Ext.Array.each(evaluatorFactorDtos, function(evaluatorFactorDto, index) {
						if(evaluatorFactorDto.allot == null){
							evaluatorFactorDto.allot = 0;
						}
						
						var value = evaluatorFactorDto.allot;
						if(evaluatorFactorDto.sumYn){//합계인경우
							value = evaluatorFactorDto.innerSum;
						}
						items.push({
							xtype : 'component',
							cls : 'kepco-eval-component',
							group : true,
							html : '<span class="kepco-eval-component-span">' + value + '</span>'
						});
						if(index < evaluatorFactorDtos.length-1) {
							items.push({
								xtype : 'component',
								cls : 'separator'
							});
						}
					});
					if(index < datas.length-1) {
						items.push({
							xtype : 'component',
							cls : 'separator'
						});
					}
				});
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center',
						style : {
							'text-align' : 'center'
						}
				},
				defaults : {
					margin : 0,
					padding : 5,
					style : {
						'text-align' : 'center'
					}
				},
				record : record,
				items : items
			});
		}
	}],
	
	onStoreLoad : function(store, records) {
		var me = this,
			columns = [],
			datas = records,
			data;
		
		var index = 0;
		var isLast = false;
		while(Ext.isArray(datas) && (data = datas[0])) {
			if(data) {
//				isLast = (data.isModel ? data.get('subEvaluatorFactorGroupDtos') : data.subEvaluatorFactorGroupDtos).length == 0;//data.get('subEvaluatorFactorGroupDtos')없는 경우가 있어서 수정
				var flag = true;
				if(data.isModel){
					if(data.get('subEvaluatorFactorGroupDtos')){
						if(data.get('subEvaluatorFactorGroupDtos').length > 0){
							flag = false;
						}
					}
				}else{
					if(data.subEvaluatorFactorGroupDtos.length > 0){
						flag = false;
					}
				}
				isLast = flag;
				
				var columnData = data.data ? data.data : data;
				var columnText = '심사항목';
				if(columnData.radioGroupCode == "BusinessSize"){
					columnText = '구분';
				}else if(columnData.radioGroupCode == "EvalMethod"){
					columnText = '평가요소';
				}
				
				columns.push({
					text : columnText,
					align : 'center',
					width : 100,
					index : index++,
					isNew : me.isNew,//업체가 신청서 이후로 하나도 제출하지 않은 상태
					dataIndex : 'subEvaluatorFactorGroupDtos',
					getValue : function(record) {
						var index = this.index;
						if(index > 0) {
							var ret = [],
								fn = function(dtos, id, index) {
									var groups = [];
									Ext.Array.each(dtos, function(dto) {
										if(index > 0) {
											if(dto.subEvaluatorFactorGroupDtos) {
												fn(dto.subEvaluatorFactorGroupDtos, dto.id, index-1);
											}
										}
										else {
											groups.push(dto);
										}
									});
									if(groups.length > 0) {
										ret.push({
											id : id,
											subEvaluatorFactorGroupDtos : groups
										});
									}
								};
								
							fn(record.get('subEvaluatorFactorGroupDtos'), record.getId(), index-1);
							return ret;
						}
						return record.getData();
					},
					widget : (function(isLast) {
						return function(record) {
							var me = this,
								datas = this.getValue(record);
							if(Ext.isArray(datas)) {
								var items = [];
								Ext.Array.each(datas, function(data, index) {
									items.push({
										xtype : 'radiogroup',
										vertical : true,
										columns : 1,
										hideLabel : true,
										from : true,
										margin : 0,
										//flex : 1,
										record : record,
										inputValue : data.id,
										layout : {
											type : 'vbox',
											align : 'stretch',
											pack : 'center'
										},
										listeners : {
											change : function(field, newValue, oldValue) {
												var record = field.record,
												bindObjValue,
												objValue = Ext.Object.getValues(newValue);
												
												var flag = false;
												if(objValue[0]){
													flag = true;
												}
												
												bindObjValue = record.get('selectEvalMethodType');
												
												if(!bindObjValue){
													bindObjValue = [];
													bindObjValue.push(newValue);
												}else{
													Ext.each(bindObjValue, function(value){
														if(value['EvalMethod-' + data.id]){//같은 라디오 name을 가진 데이터가 선택된 경우
															value['EvalMethod-' + data.id] = objValue[0]; 
														}else{//같은 라디오 name을 가진 데이터가 선택되지 않은 경우
															bindObjValue.push(newValue);
														}
													});												
												}
												
												record.set('isSelectedEvalMethodType', flag);
												record.set('selectEvalMethodType', bindObjValue);
											}
										},
										items : (function() {
											var ret = [];
											var subEvaluatorFactorGroupDtos = data.subEvaluatorFactorGroupDtos;
											Ext.Array.each(subEvaluatorFactorGroupDtos, function(dto, index) {
												if(dto.radioGroupYn) {
													ret.push({
														boxLabel : dto.factorGroupEvalName,
														hideLabel : true,
														dto : dto,
														name : dto.radioGroupCode + '-' + data.id,
														to : true,
														group : isLast,
														radioFactorGroup : true,
														childLength : (dto.evaluatorFactorDtos ? dto.evaluatorFactorDtos.length : 0),
														record : record,
														recordId : record.get('id'),
//														id  :dto.factorGroupEvalId,
														inputValue : dto.factorGroupEvalId,
														readOnly : me.isExclusive || me.isExclusiveAllot || !record.get('includeEvalYn') ||me.readOnly,
														margin : '1 0 0 0',
														flex : 1,
														checked : function(){
															if(me.isNew){
																var obj = {};
																var selectedArr = record.get('selectEvalMethodType');
																if(!selectedArr){
																	selectedArr = [];
																}
																var flag = false;
																var isChecked = false;
																Ext.each(selectedArr, function(value){
																	if(!isChecked){
																		if(value['EvalMethod-' + data.id]){//같은 라디오 name을 가진 데이터가 선택된 경우
																			isChecked = true;
																			return false;
																		}else{//같은 라디오 name을 가진 데이터가 선택되지 않은 경우
																			isChecked = false;
																		}
																	}
																});	
																
																if(selectedArr.length == 0 || !isChecked){
																	obj['EvalMethod-' + data.id] = dto.factorGroupEvalId;
																	selectedArr.push(obj);
																	flag = true;
																	record.set('isSelectedEvalMethodType', flag);//false
																}
																record.set('selectEvalMethodType', selectedArr);
																return flag;
															}else{
																if(dto.includeEvalYn){
																	var obj = {};
																	var selectedArr = record.get('selectEvalMethodType');
																	if(!selectedArr){
																		selectedArr = [];
																	}
																	obj['EvalMethod-' + data.id] = dto.factorGroupEvalId;
																	if(selectedArr.length < 2){
																		selectedArr.push(obj);
																		record.set('selectEvalMethodType', selectedArr);
																	}
																	record.set('isSelectedEvalMethodType', dto.includeEvalYn);															
																}
																return dto.includeEvalYn;
															}
															
															
														}(),
														listeners : {
															change : function(field, newValue, oldValue) {
																//각각의 radio changeEvent 발생
															}
														}
													});
												}
												else {
													var value = dto.factorGroupEvalName;
													if(value == null){
														value = '';
													}
													ret.push({
														xtype : 'component',
														cls : 'kepco-eval-component',
														//flex : 1,
														group : isLast,
														childLength : (dto.evaluatorFactorDtos ? dto.evaluatorFactorDtos.length : 0),
														html : '<span class="kepco-eval-component-span">' + value + '<span>',
														to : true,
														listeners : {
															change : function(field, newValue, oldValue) {
															}
														}
													});
												}
												if(index < subEvaluatorFactorGroupDtos.length-1) {
													ret.push({
														xtype : 'component',
														cls : 'separator'
													});
												}
											});
											return ret;
										}())
									});
									if(index < datas.length-1) {
										items.push({
											xtype : 'component',
											cls : 'separator'
										});
									}
								});
								var prevWidget = me.getView().ownerGrid.plugins[0].liveWidgets[record.internalId + '-' + me.prev().id];
								if(prevWidget.isContainer) {
									var prevTos = prevWidget.query('[to=true]');
									if(datas.length < prevTos.length) {
										items.push({
											xtype : 'component',
											cls : 'separator'
										});
										items.push({
											group : isLast ,
											xtype : 'radiogroup',
											to : true,
											from : true,
											margin : 0
										});
									}
								}
								return Ext.create('Ext.container.Container', {
									layout : {
										type : 'vbox',
										align : 'stretch',
										pack : 'center'
									},
									items : items
								});
							}
							var item;
							if(datas.radioGroupYn) {
								item = {
									xtype : 'radiofield',
									cls : 'kepco-eval-radiofield',
									name : datas.radioGroupCode,
									boxLabel : datas.factorGroupEvalName,
									hideLabel : true,
									inputValue : datas.id,
									record : record,
									readOnly : me.isExclusive || me.isExclusiveAllot || me.readOnly,
									checked : function(){
										if(datas.includeEvalYn){
											record.set('isSelectedBusinessType', datas.includeEvalYn);										
										}
										return datas.includeEvalYn;
									}(),
									listeners : {
										change : function(field, newValue, oldValue) {
											var record = field.record;
											
											record.data.includeEvalYn = newValue;
											var radios = Ext.ComponentQuery.query('[recordId='+record.get('id')+']');
											Ext.each(radios, function(radio){
												
												radio.setReadOnly(!newValue);
											});
											
											record.set('isSelectedBusinessType', newValue);
											record.set('isSelectedEvalMethodType', newValue);
											//대, 중, 소 선택하는 radio 변경되면 금액/수량 radio check해제 되던 로직
//											if(!newValue){
//												var methodTypes = record.get('selectEvalMethodType');
//												if(methodTypes && methodTypes.length > 0){
//													Ext.each(methodTypes, function(methodType){
//														var value = Ext.Object.getValues(methodType)[0];
//														var radioField = Ext.ComponentQuery.query('[inputValue='+value+']')[0];
//														if(radioField.xtype && radioField.xtype === 'radio'){
//															radioField.setValue(false);
//														}
//													});
//													
//													record.set('isSelectedEvalMethodType', false);
//													record.set('selectEvalMethodType', null);
//												}
//											}
										}
									}
								};
							}
							else {
								var value = datas.factorGroupEvalName;
								if(value == null){
									value = '';
								}
								item = {
									xtype : 'component',
									cls : 'kepco-eval-component',
									html : '<span class="kepco-eval-component-span">' + value + '<span>'
								};
							}
							return Ext.create('Ext.container.Container', {
								layout : {
									type : 'vbox',
									align : 'stretch',
									pack : 'center'
								},
								items : [item]
							});
						}
					}(isLast))
				});
				datas = data.isModel ? data.get('subEvaluatorFactorGroupDtos') : data.subEvaluatorFactorGroupDtos;
			}
		}
		
		
		var colArr = [];
		Ext.Array.each(me.defaultColumns, function(col){
			if(me.type){
				col.type = me.type;
			}else{
				col.type = null;
			}
			
			if(col.isExclusive){
				if(!me.getHiddenExclusiveColumn()){
					col.text = me.getExclusiveFactorScaleText();
					colArr.push(col);
				}
			}else if(col.isFactorScale){
				col.text = me.getFactorScaleText();
				colArr.push(col);
			}else if(col.isFactorAllot){
				col.text = me.getAllotText();
				if(!me.type){
					colArr.push(col);
				}
			}else if(col.isExclusiveAllot){
				if(!me.getHiddenExclusiveColumn()){
					colArr.push(col);
				}
			}else if(col.isScaleColumn){
				if(!me.type){
					colArr.push(col);
				}
			}else{
				colArr.push(col);
			}
		});
		columns = columns.concat(colArr);
		Ext.Array.each(columns, function(column) {
			column.code = me.code;
			column.firstTab = me.firstTab;
			column.readOnly = column.isExclusive || column.isExclusiveAllot || me.readOnly,
			Ext.apply(column, me.defaultColumnConfig);
		});
		me.reconfigure(columns);
	},
	
	plugins : [{
		ptype : 'kepcoevalpanelwidgetplugin'
	}]
		
});

Ext.define('Kepco.eval.plugin.KepcoEvalPanelWidgetPlugin', {
	extend : 'Ext.AbstractPlugin',
	alias : 'plugin.kepcoevalpanelwidgetplugin',
	
	freeWidgetStack : [],
	
	readOnly : false,
	
	init : function(grid) {
		var me = this,
			view = grid.getView(),
			bind = grid.getBind(),
			store = bind && bind.store ? bind.store.getValue() : grid.store;
		
		me.grid = grid;
		me.view = view;
		me.liveWidgets = {};
		// http://alm.emro.co.kr/browse/TECHSUPP-524
		if(Ext.isIE){
			me.grid.view.navigationModel.focusItem = me.focusItem.bind(me);
		}
		me.setupStoreListeners(store);
		me.setupViewListeners(view);
		me.callParent(arguments);
	},
	
	// http://alm.emro.co.kr/browse/TECHSUPP-524
	focusItem : function(item){
		var me = this,
		navModel = me.view.navigationModel,
		selectedRecord = navModel.position.record;
		
		item.addCls(this.focusCls);
		me.liveWidgets[selectedRecord.internalId].focus();
	},
	
	setReadOnly : function(value) {
	},
	
	onDestroy: function() {
        var me = this;
        if (me.rendered) {
        	me.destroyWidgets();
        }
        me.evalGroupIndex = me.freeWidgetStack = me.liveWidgets = undefined;
        Ext.destroy(me.viewListeners);
        Ext.destroy(me.storeListeners);
        me.callParent(arguments);
    },

    destroyWidgets : function() {
        var me = this,
        	widget;
        for(var prop in me.liveWidgets){
        	widget = me.liveWidgets[prop];
        	widget.$widgetRecord = widget.$widgetColumn = undefined;
            delete widget.getWidgetRecord;
            delete widget.getWidgetColumn;
            widget.destroy();
            delete me.liveWidgets[prop];
        }
        Ext.Array.each(me.freeWidgetStack, function(freeWidget) {
            freeWidget.destroy();
        });
    },
    
	privates : {
		getFreeWidget : function(record, column) {
			var me = this,
				result = me.freeWidgetStack.pop();
			
			if(!result) {
				result = column.widget.call(column, record);
			}				
			return result;
		},
		onStoreBeforeLoad : function(store) {
			store.removeAll();
		},
		onStoreLoad : function(store, records, successful, eOpts) {
			var me = this;
			me.freeWidgetStack = [];
		},
		onViewRefresh: function(view, records) {
            var me = this,
                rows = view.all,
                oldWidgetMap = me.liveWidgets,
                row, columnEl, cellEl, widget, el, width, recordId, columnId,
                itemIndex, recordIndex, record, id, bindValue, bindObjValue,
                factorInputType;
            
            var columns = view.getVisibleColumnManager().getColumns();
            
            if (view.rendered) {
            	me.destroyWidgets();
            	me.liveWidgets = {};
            	me.freeWidgetStack = [];
            	Ext.suspendLayouts();
                for (itemIndex = rows.startIndex, recordIndex = 0; itemIndex <= rows.endIndex; itemIndex++, recordIndex++) {
                    record = records[recordIndex];
                    if (record.isNonData) {
                        continue;
                    }
                	row = view.getRow(rows.item(itemIndex));
                    if(!row) {
                    	break;
                    }
                    
                    factorInputType = record.get(me.factorInputType),
                    recordId = record.internalId;
                    var set = [];
                    for(var i=0; i<columns.length; i++) {
                    	column = columns[i];
                    	columnId = column.id;
                    	if(column.widget) {
                    		columnEl = row.cells[i];
                    		cellEl = columnEl.firstChild;
                    		
                    		
                			// Attempt to reuse the existing widget for this record.
                			widget = me.liveWidgets[recordId + '-' + columnId] = oldWidgetMap[recordId + '-' + columnId] || me.getFreeWidget(record, column);
                			widget.set = set;
                			set.push(widget);
                			if(column.isFactorScale) {
                				widget.on('resize', function(ct) {
                					var maxDescriptionHeights = [];
                					var maxGroupHeights = [];
                					var maxHeights = [];
                					var maxHeight = 0;
                					Ext.Array.each(ct.set, function(c) {
                						if(c.$widgetColumn.subItems) {
                							var leafs = c.query('[leaf=true]');
                							Ext.Array.each(leafs, function(leaf, index) {
                								maxHeights[index] = Math.max((leaf.variable ? 0 : leaf.getHeight()), (maxHeights[index] || 0));
                							});
                							var descriptions = c.query('[description=true]');
                							Ext.Array.each(descriptions, function(description, index) {
                								maxDescriptionHeights[index] = Math.max(description.getHeight(), (maxDescriptionHeights[index] || 0));
                							});
                						}
                					});
                					Ext.Array.each(ct.set, function(c) {
                						if(c.$widgetColumn.subItems) {
                							var leafs = c.query('[leaf=true]');
                							var leafsHeight = 0;
                							Ext.Array.each(leafs, function(leaf, index) {
                								if(!leaf.variable && leaf.getHeight() < maxHeights[index]) {
                									leaf.setHeight(maxHeights[index]);
                								}
            									leafsHeight += leaf.getHeight();
                							});
                							var descriptions = c.query('[description=true]');
                							Ext.Array.each(descriptions, function(description, index) {
                								if(description.getHeight() < maxDescriptionHeights[index]) {
                									description.setHeight(maxDescriptionHeights[index]);
                								}
                							});
											//maxHeight = leafsHeight;                							
                						}
                					});
                					Ext.Array.each(ct.set, function(c) {
                						var groups = c.query('[group=true]');
                						Ext.Array.each(groups, function(group, index) {
                							if(c.variables && !group.updatedLayout) {
                								group.updatedLayout = true;
                								group.updateLayout({isRoot : true});
                							}
            								maxGroupHeights[index] = Math.max(group.getHeight(), (maxGroupHeights[index] || 0));
                						});
                					});
                					Ext.Array.each(ct.set, function(c, cIndex) {
                						var groups = c.query('[group=true]');
                						var groupIndex = 0;
                						Ext.Array.each(groups, function(group) {
            								var height = 0;
            								if(group.childLength > 0) {
            									for(var i=0; i<group.childLength; i++) {
            										height += maxGroupHeights[groupIndex++];
            									}
            								}
            								else {
            									height = maxGroupHeights[groupIndex++];
            								}
            								//if(group.getHeight() < height) {
                								group.setHeight(height);
                							//}
                						});
                					});
                					
                					Ext.Array.each(ct.set, function(c) {
                						maxHeight = Math.max(c.getHeight(), maxHeight);
                					});
                					var parentGroup;
                					Ext.Array.each(ct.set, function(c) {
										c.setHeight(maxHeight);
										if(parentGroup && parentGroup.length > 0) {
											Ext.Array.each(parentGroup, function(parent, index) {
												var height = c.query('[from=true]')[index].getHeight();
												if(height != parent.getHeight()) {
													parent.setHeight(height);
												}
											});
											parentGroup[0].ownerCt.el.setTop(0);
										}
                						parentGroup = c.query('[group=false]');
                					});
                					
                				}, me, {single : true});
                			}
                    	
                			// http://alm.emro.co.kr/browse/TECHSUPP-524
                			widget.focusable = true;
                			widget.getCell = (function(cellEl) {
                				return function() {
                					return cellEl;
                				}
                			}(cellEl));
                			
                			delete oldWidgetMap[recordId + '-' + columnId];
                			
                			Ext.fly(cellEl).empty();
                			if (el = (widget.el || widget.element)) {
                				cellEl.appendChild(el.dom);
                			} else {
                				widget.render(cellEl);
                			}
                			widget.$widgetRecord = record;
                			widget.$widgetColumn = column;
                    	}
                    }
                }
                Ext.resumeLayouts(true);
                // Free any unused widgets from the old live map.
                // Move them into detachedBody.
                for (id in oldWidgetMap) {
                    widget = oldWidgetMap[id];
                    widget.$widgetRecord = widget.$widgetColumn = null;
                    me.freeWidgetStack.unshift(widget);
                    Ext.detachedBodyEl.dom.appendChild((widget.el || widget.element).dom);
                }
            }
        },
		setupViewListeners : function(view) {
			var me = this;
			me.viewListeners = view.on({
				refresh : me.onViewRefresh,
				scope : me,
				destroyable: true
			});
		},
		setupStoreListeners : function(store) {
			var me = this;
			me.storeListeners = store.on({
				beforeload : me.onStoreBeforeLoad,
				load : me.onStoreLoad,
				scope : me,
				destroyable: true
			});
		}
	}
});


/**
 * 평가 항목 패널 - 공사용역 SI화면1			
 * kepcoevalpanelconstruction 
 */
Ext.define('Kepco.eval.KepcoEvalPanelConstruction', {
	extend : 'Ext.grid.Panel',
	alias : 'widget.kepcoevalpanelconstruction',
	
	config : {
		readOnly : false,
		
		hiddenExclusiveColumn : false,
		
		hiddenEvaluatorBasisTypeColumn : true,
		
		exclusiveFactorScaleText : '',
		
		factorScaleText : '',
		
		allotText : ''
	},
	
	disableSelection : true,
	
	columnLines : true,
	
	rowLines : true,
	
	bufferedRenderer : false,

	injectBufferedRendererAfterLayout : true,
	
	autoScroll : true,
	
	enableLocking : false,
	
	cls : 'kepco-eval-panel',
	
	initComponent : function() {
		var me = this,
			store = me.getStore();

		if(store){
			store.on({
				load : me.onStoreLoad,
				scope : me
			});
			store.load();			
		}
		
		me.callParent(arguments);
	},
	
	defaultColumnConfig : {
		sortable : false,
		draggable : false,
		resizable : false,
		menuDisabled : true
	},
	
	defaultColumns : [{
		text : '심사방법',
		width : 380,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [];
			if(Ext.isArray(datas)) {
				Ext.Array.each(datas, function(data, index) {
					var evaluatorFactorDtos = data.evaluatorFactorDtos;
					var value = '';
					var ret = [];
					Ext.Array.each(evaluatorFactorDtos, function(evaluatorFactorDto, index) {
						if(evaluatorFactorDto){
							if(evaluatorFactorDto.factorInputType === 'QualityCalculate' || evaluatorFactorDto.factorInputType === 'Quantity'){
								value = evaluatorFactorDto.bidPriceView;
								items.push({
									xtype : 'displayfield',
									group : true,
									height: 110,
									value : evaluatorFactorDto.bidPriceView
								});

							}else{
								value = evaluatorFactorDto.constructFactorName;
								if(evaluatorFactorDto.sumYn){
									value = '합계';
								}
								items.push({
									xtype : 'component',
									cls : 'kepco-eval-component',
									group : true,
									html : '<span class="kepco-eval-component-span">' + value + '</span>'
								});
							}
						}
						if(index < evaluatorFactorDtos.length-1) {
							items.push({
								xtype : 'component',
								cls : 'separator'
							});
						}
					});
					if(index < datas.length-1) {
						items.push({
							xtype : 'component',
							cls : 'separator'
						});
					}
				});
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center'
				},
				items : items,
				margin : 0,
				record : record
			});
		}
		
	}, {
		text : '가감유형',
		width : 80,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [];
			if(Ext.isArray(datas)) {
				Ext.Array.each(datas, function(data, index) {
					var evaluatorFactorDtos = data.evaluatorFactorDtos;
					Ext.Array.each(evaluatorFactorDtos, function(evaluatorFactorDto, index) {
						var type = evaluatorFactorDto.adjustmentType, text = '';
						if(type === 'Addition'){
							text = '가점';
						}else if(type === 'Subtraction'){
							text = '감점';
						}else if(type === 'Adjustment'){
							text = '가감점';
						}else if(type === 'General') {
							text = '일반';
						}
						items.push({
							xtype : 'component',
							cls : 'kepco-eval-component',
							group : true,
							html : '<span class="kepco-eval-component-span">' + text + '</span>'
						});
						if(index < evaluatorFactorDtos.length-1) {
							items.push({
								xtype : 'component',
								cls : 'separator'
							});
						}
					});
					if(index < datas.length-1) {
						items.push({
							xtype : 'component',
							cls : 'separator'
						});
					}
				});
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center'
				},
				defaults : {
					style : {
						'text-align' : 'center'
					}
				},
				items : items,
				margin : 0,
				record : record
			});
		}
	}, {
		text : '배점',
		subItems : true,
		width : 50,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [];
			if(Ext.isArray(datas)) {
				Ext.Array.each(datas, function(data, index) {
					var evaluatorFactorDtos = data.evaluatorFactorDtos;
					Ext.Array.each(evaluatorFactorDtos, function(evaluatorFactorDto, index) {
						if(me.type){
							var value = evaluatorFactorDto.intervalFrom + '~' + evaluatorFactorDto.intervalTo;
							if(evaluatorFactorDto.sumYn){
								value = evaluatorFactorDto.totalSum;
							}
							items.push({
								xtype : 'component',
								cls : 'kepco-eval-component',
								group : true,
								html : '<span class="kepco-eval-component-span">' + value + '</span>'
							});

						}
						if(index < evaluatorFactorDtos.length-1) {
							items.push({
								xtype : 'component',
								cls : 'separator'
							});
						}

					});
					if(index < datas.length-1) {
						items.push({
							xtype : 'component',
							cls : 'separator'
						});
					}
				});
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center'
				},
				defaults : {
					style : {
						'text-align' : 'center'
					}
				},
				items : items,
				margin : 0,
				record : record
			});
		}
	},{
		text : '심사자',
		isScore : true,
		subItems : true,
		width : 120,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [],
				variables = false;
			if(Ext.isArray(datas)) {
				Ext.Array.each(datas, function(data, index) {
					var evaluatorFactorDtos = data.evaluatorFactorDtos;
					Ext.Array.each(evaluatorFactorDtos, function(evaluatorFactorDto, index) {
						if(me.type){
							if(evaluatorFactorDto.sumYn){//합계인 경우
								items.push({
									xtype : 'component',
									cls : 'kepco-eval-component',
									group : true,
									style: 'text-align:right',
									html : '<span class="kepco-eval-component-span">' + evaluatorFactorDto.innerSum + '</span>'
								});
							}else{
								items.push({
									xtype : 'container',
									group : true,
									layout : {
										type : 'vbox',
										align : 'stretch',
										pack : 'center'
									},
									items : {
										xtype : 'numberfield',
										minValue : evaluatorFactorDto.intervalFrom,
										maxValue : evaluatorFactorDto.intervalTo,
										readOnly : me.readOnly,
										record : record,
										evaluatorFactorDtos : evaluatorFactorDtos,
										evaluatorFactorDto : evaluatorFactorDto,
										value : evaluatorFactorDto.allot,
										fieldStyle: 'text-align:right',
										coverFormat : '0,000.####',
										decimalPrecision: 4,
										readOnly : evaluatorFactorDto.factorInputType === 'Quantity' || me.readOnly,
										listeners : {
											change : function(field, newValue, oldValue) {
												var dto = field.evaluatorFactorDto;
												var dtos = field.evaluatorFactorDtos;
												dto.allot = newValue;
												//추후 공사용역 내용추가 시 사용 같은 항목군아래 항목들 중 입력한 값이 있으면 수정 못하도록 하는 방법
//											Ext.each(dtos, function(otherDto){
//												if(!Ext.Object.equals(otherDto), dto){
//													
//												}
//											});
											}
										}
									} 
								});
							}
						}
						if(index < evaluatorFactorDtos.length-1) {
							items.push({
								xtype : 'component',
								cls : 'separator'
							});
						}
					});
					if(index < datas.length-1) {
						items.push({
							xtype : 'component',
							cls : 'separator'
						});
					}
				});
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center'
				},
				items : items,
				variables : variables,
				record : record,
				defaults : {
					margin : 0
				}
			});
		}
	},
	{
		text : '비고',
		isFactorScale: true,
		width : 150,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [];
			if(Ext.isArray(datas)) {
				Ext.Array.each(datas, function(data, index) {
					var evaluatorFactorDtos = data.evaluatorFactorDtos;
					if(me.type){
						var description = evaluatorFactorDtos[0].evalFactorGroupDescription;
						if(description == null){
							description = '';
						}
						if(evaluatorFactorDtos[0].sumYn){
							description = evaluatorFactorDtos[0].qualifiedResultName;
						}
						items.push({
							xtype: 'textareafield',
							cls : 'kepco-eval-component',
							value : description,
							evaluatorFactorDto : evaluatorFactorDtos[0],
							readOnly : me.readOnly || evaluatorFactorDtos[0].sumYn,
							group : true,
							childLength : evaluatorFactorDtos ? evaluatorFactorDtos.length : 0,
							fieldStyle : {
								'min-height' : '25px'
							},
							listeners : {
								change : function(field, newValue, oldValue) {
									var dto = field.evaluatorFactorDto;

									dto.evalFactorGroupDescription = newValue;
								}
							}
						});
					}
					if(index < datas.length-1) {
						items.push({
							xtype : 'component',
							cls : 'separator'
						});
					}
				});
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center'
				},
				defaults : {
					margin : 0
				},
				items : items,
				margin : 0,
				record : record
			});
		}
	}],
	
	onStoreLoad : function(store, records) {
		var me = this,
			columns = [],
			datas = records,
			data;
		
		var index = 0;
		var isLast = false;
		while(Ext.isArray(datas) && (data = datas[0])) {
			if(data) {
//				isLast = (data.isModel ? data.get('subEvaluatorFactorGroupDtos') : data.subEvaluatorFactorGroupDtos).length == 0;//data.get('subEvaluatorFactorGroupDtos')없는 경우가 있어서 수정
				var flag = true;
				if(data.isModel){
					if(data.get('subEvaluatorFactorGroupDtos')){
						if(data.get('subEvaluatorFactorGroupDtos').length > 0){
							flag = false;
						}
					}
				}else{
					if(data.subEvaluatorFactorGroupDtos.length > 0){
						flag = false;
					}
				}
				isLast = flag;
				
				var columnData = data.data ? data.data : data;
				var columnText = '심사항목';
				if(columnData.radioGroupCode == "BusinessSize"){
					columnText = '구분';
				}else if(columnData.radioGroupCode == "EvalMethod"){
					columnText = '평가요소';
				}
				
				columns.push({
					text : columnText,
					align : 'center',
					width : 200,
					index : index++,
					dataIndex : 'subEvaluatorFactorGroupDtos',
					getValue : function(record) {
						var index = this.index;
						if(index > 0) {
							var ret = [],
								fn = function(dtos, id, index) {
									var groups = [];
									Ext.Array.each(dtos, function(dto) {
										if(index > 0) {
											if(dto.subEvaluatorFactorGroupDtos) {
												fn(dto.subEvaluatorFactorGroupDtos, dto.id, index-1);
											}
										}
										else {
											groups.push(dto);
										}
									});
									if(groups.length > 0) {
										ret.push({
											id : id,
											subEvaluatorFactorGroupDtos : groups
										});
									}
								};
								
							fn(record.get('subEvaluatorFactorGroupDtos'), record.getId(), index-1);
							return ret;
						}
						return record.getData();
					},
					widget : (function(isLast) {
						return function(record) {
							var me = this,
								datas = this.getValue(record);
							if(Ext.isArray(datas)) {
								var items = [];
								Ext.Array.each(datas, function(data, index) {
									items.push({
										xtype : 'radiogroup',
										vertical : true,
										columns : 1,
										hideLabel : true,
										from : true,
										margin : 0,
										record : record,
										inputValue : data.id,
										layout : {
											type : 'vbox',
											align : 'stretch',
											pack : 'center'
										},
										listeners : {
											change : function(field, newValue, oldValue) {
											}
										},
										items : (function() {
											var ret = [];
											var subEvaluatorFactorGroupDtos = data.subEvaluatorFactorGroupDtos;
											Ext.Array.each(subEvaluatorFactorGroupDtos, function(dto, index) {
													ret.push({
														xtype : 'component',
														cls : 'kepco-eval-component',
														group : isLast,
														childLength : (dto.evaluatorFactorDtos ? dto.evaluatorFactorDtos.length : 0),
														html : '<span class="kepco-eval-component-span">' + dto.factorGroupEvalName + '</br>[' + dto.intervalFrom + '~' + dto.intervalTo + ']<span>',
														to : true,
														listeners : {
															change : function(field, newValue, oldValue) {
															}
														}
													});
												if(index < subEvaluatorFactorGroupDtos.length-1) {
													ret.push({
														xtype : 'component',
														cls : 'separator'
													});
												}
											});
											return ret;
										}())
									});
									if(index < datas.length-1) {
										items.push({
											xtype : 'component',
											cls : 'separator'
										});
									}
								});
								var prevWidget = me.getView().ownerGrid.plugins[0].liveWidgets[record.internalId + '-' + me.prev().id];
								if(prevWidget.isContainer) {
									var prevTos = prevWidget.query('[to=true]');
									if(datas.length < prevTos.length) {
										items.push({
											xtype : 'component',
											cls : 'separator'
										});
										items.push({
											group : isLast ,
											xtype : 'radiogroup',
											to : true,
											from : true,
											margin : 0
										});
									}
								}
								return Ext.create('Ext.container.Container', {
									layout : {
										type : 'vbox',
										align : 'stretch',
										pack : 'center'
									},
									items : items
								});
							}
							var item;
							var value = datas.factorGroupEvalName + '</br>[' + datas.intervalFrom + '~' + datas.intervalTo + ']';
							if(datas.sumYn){
								value = '';
							}
								item = {
									xtype : 'component',
									cls : 'kepco-eval-component',
									html : '<span class="kepco-eval-component-span">' + value + '<span>',
								};
							return Ext.create('Ext.container.Container', {
								layout : {
									type : 'vbox',
									align : 'stretch',
									pack : 'center'
								},
								items : [item]
							});
						}
					}(isLast))
				});
				datas = data.isModel ? data.get('subEvaluatorFactorGroupDtos') : data.subEvaluatorFactorGroupDtos;
			}
		}
		
		
		var colArr = [];
		Ext.Array.each(me.defaultColumns, function(col){
			if(me.type){
				col.type = me.type;
			}else{
				col.type = null;
			}
			
			if(col.isExclusive){
				if(!me.getHiddenExclusiveColumn()){
					col.text = me.getExclusiveFactorScaleText();
					colArr.push(col);
				}
			}else if(col.isScore){
				col.text = me.getFactorScaleText();
				colArr.push(col);
			}else if(col.isFactorAllot){
				col.text = me.getAllotText();
				if(!me.type){
					colArr.push(col);
				}
			}else if(col.isExclusiveAllot){
				if(!me.getHiddenExclusiveColumn()){
					colArr.push(col);
				}
			}else if(col.isScaleColumn){
				if(!me.type){
					colArr.push(col);
				}
			}else{
				colArr.push(col);
			}
		});
		columns = columns.concat(colArr);
		Ext.Array.each(columns, function(column) {
			column.readOnly = column.isExclusive || column.isExclusiveAllot || me.readOnly,
			Ext.apply(column, me.defaultColumnConfig);
		});
		me.reconfigure(columns);
	},
	
	plugins : [{
		ptype : 'kepcoevalpanelwidgetplugin'
	}]
		
});

/**
 * 평가 항목 패널 - 공사용역 SI화면2			
 * 
constructionetc 
 */
Ext.define('Kepco.eval.KepcoEvalPanelConstructionEtc', {
	extend : 'Ext.grid.Panel',
	alias : 'widget.kepcoevalpanelconstructionetc',
	
	config : {
		readOnly : false,
		
		hiddenExclusiveColumn : false,
		
		hiddenEvaluatorBasisTypeColumn : true,
		
		exclusiveFactorScaleText : '',
		
		factorScaleText : '',
		
		allotText : ''
	},
	
	disableSelection : true,
	
	columnLines : true,
	
	rowLines : true,
	
	bufferedRenderer : false,

	injectBufferedRendererAfterLayout : true,
	
	autoScroll : true,
	
	enableLocking : false,
	
	cls : 'kepco-eval-panel',
	
	initComponent : function() {
		var me = this,
			store = me.getStore();

		if(store){
			store.on({
				load : me.onStoreLoad,
				scope : me
			});
			store.load();			
		}
		
		me.callParent(arguments);
	},
	
	defaultColumnConfig : {
		sortable : false,
		draggable : false,
		resizable : false,
		menuDisabled : true
	},
	
	defaultColumns : [{
		text : '심사방법',
		width : 380,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [];
			if(Ext.isArray(datas)) {
				Ext.Array.each(datas, function(data, index) {
					var evaluatorFactorDtos = data.evaluatorFactorDtos;
					Ext.Array.each(evaluatorFactorDtos, function(evaluatorFactorDto, index) {
						var ret = [];
						if(evaluatorFactorDto.sumYn){//합계인 경우
							ret.push({
								xtype : 'component',
								cls : 'kepco-eval-component',
								leaf : true,
//								style: 'text-align:right',
								html : '<span class="kepco-eval-component-span">' + '합계' + '</span>'
							});
						}else{
							if(evaluatorFactorDto.factorInputType === 'QualityCalculate'){//입찰가격의 경우 평점 계산 식이 나와야함
								// || evaluatorFactorDto.factorInputType === 'Quality'
								var contentPanelArr = Ext.ComponentQuery.query('displayfield[id=contentPanel]');
								if(contentPanelArr.length > 0){
									var contentPanel = contentPanelArr[0];
									contentPanel.value = evaluatorFactorDto.bidPriceView;
									contentPanel.setValue(evaluatorFactorDto.bidPriceView);
									ret.push(contentPanel);
								}else{
									ret.push({
										xtype : 'displayfield',
										id : 'contentPanel',
										leaf : true,
										height: 110,
										value : evaluatorFactorDto.bidPriceView
									});
								}
							}else{
								ret.push({
									xtype: 'textareafield',
									cls : 'kepco-eval-component',
									evalCmp : true,
									columnText : '심사방법',
									record : record,
									leaf : true,
									value : evaluatorFactorDto.name,
									evaluatorFactorDto : evaluatorFactorDto,
									readOnly : me.readOnly,
									listeners : {
										change : function(field, newValue, oldValue) {
											var dto = field.evaluatorFactorDto;
											
											dto.name = newValue;
										}
									}
								});
							}
						}
						
						items.push({
							xtype : 'container',
							group : true,
							layout : {
								type : 'vbox',
								align : 'stretch',
								pack : 'center'
							},
							defaults : {
								margin : 0,
								padding : 5,
								style : {
									'text-align' : 'center'
								}
							},
							items : ret
						});
						
						if(index < evaluatorFactorDtos.length-1) {
							items.push({
								xtype : 'component',
								cls : 'separator'
							});
						}
					});
					if(index < datas.length-1) {
						items.push({
							xtype : 'component',
							cls : 'separator'
						});
					}
				});
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center'
				},
				items : items,
				margin : 0,
				record : record
			});
		}
		
	},{
		text : '가감유형',
		width : 80,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [];
			if(Ext.isArray(datas)) {
				if(record.get('sumYn')){
					items.push({
						xtype : 'component',
						cls : 'kepco-eval-component',
						leaf : true,
//						style: 'text-align:right',
						html : '<span class="kepco-eval-component-span">' + '' + '</span>'
					});
				}else{
					Ext.Array.each(datas, function(data, index) {
						var evaluatorFactorDtos = data.evaluatorFactorDtos;
						Ext.Array.each(evaluatorFactorDtos, function(evaluatorFactorDto, index) {
							var ret = [];
							var store = Ext.create('Ext.data.Store', {
								fields: [
								         {
								        	 name: 'value',
								        	 name : 'text'
								         }
								         ],
								         data : [
								                 {value: 'Addition',    text: '가점'},
								                 {value: 'Subtraction', text: '감점'},
								                 {value: 'Adjustment', text: '가감점'},
								                 {value: 'General', text: '일반'}
								                 ]
							});
							
							ret.push({
								xtype: 'combobox',
								evalCmp : true,
								columnText : '가감유형',
								cls : 'kepco-eval-component',
								leaf : true,
								editable: false,
								queryMode: 'local',
								valueField: 'value',
								displayField : 'text',
								emptyText: '#{배점}',
								store : store,
								record:record,
								value : evaluatorFactorDto.adjustmentType,
								evaluatorFactorDto : evaluatorFactorDto,
								record :record,
								readOnly : evaluatorFactorDto.factorInputType === 'QualityCalculate' || me.readOnly,
								listeners : {
									change : function(field, newValue, oldValue) {
										var dto = field.evaluatorFactorDto;
										
										dto.adjustmentType = newValue;
										
										var toField = Ext.ComponentQuery.query('[name='+dto.id+'To]')[0];
										var fromField = Ext.ComponentQuery.query('[name='+dto.id+'From]')[0];
										if(newValue === 'Adjustment'){//가감점인경우
											toField.setReadOnly(false);
											fromField.setReadOnly(false);
										}else if(newValue === 'Subtraction'){//감점인경우
											toField.setReadOnly(true);
											toField.setValue(0);
											fromField.setReadOnly(false);
										}else{//일반이거나 가점인 경우
											toField.setReadOnly(false);
											fromField.setReadOnly(true);
											fromField.setValue(0);
										}
									}
								}
							});
							
							items.push({
								xtype : 'container',
								group : true,
								layout : {
									type : 'vbox',
									align : 'stretch',
									pack : 'center'
								},
								defaults : {
									margin : 0,
									padding : 5,
									style : {
										'text-align' : 'center'
									}
								},
								items : ret
							});
							if(index < evaluatorFactorDtos.length-1) {
								items.push({
									xtype : 'component',
									cls : 'separator'
								});
							}
						});
						if(index < datas.length-1) {
							items.push({
								xtype : 'component',
								cls : 'separator'
							});
						}
					});
				}
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center'
				},
				defaults : {
					style : {
						'text-align' : 'center'
					}
				},
				items : items,
				margin : 0,
				record : record
			});
		}
	}, {
		text : '배점',
		subItems : true,
		width : 130,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [];
			if(Ext.isArray(datas)) {
				if(record.get('sumYn')){
					var factorDto = record.get('evaluatorFactorDtos')[0];
					items.push({
						xtype : 'component',
						cls : 'kepco-eval-component',
						leaf : true,
//						style: 'text-align:right',
						html : '<span class="kepco-eval-component-span">' + factorDto.totalSum + '</span>'
					});
				}else{
					Ext.Array.each(datas, function(data, index) {
						var evaluatorFactorDtos = data.evaluatorFactorDtos;
						Ext.Array.each(evaluatorFactorDtos, function(evaluatorFactorDto, index) {
							var ret = [];
							var isFromFieldReadOnly = false;
							var isToFieldReadOnly = false;
							var type = evaluatorFactorDto.adjustmentType;
							
							if(type === 'Addition' || type ==='General'){
								isFromFieldReadOnly = true;
							}else if(type === 'Subtraction'){
								isToFieldReadOnly = true;
							}
							
							if(evaluatorFactorDto.factorInputType !== 'QualityCalculate'){
								ret.push({
									xtype: 'fieldcontainer',
									layout: {
										type: 'hbox',
										align : 'middle',
										pack : 'center'
									},
									items: [{
										xtype: 'numberfield',
										evalCmp : true,
										columnText : '배점',
										width: 45,
										name : evaluatorFactorDto.id + 'From',
										minValue : -100,
										hideTrigger : true,
										groupDto : data,
										record : record,
										evaluatorFactorDto : evaluatorFactorDto,
										fieldStyle: 'text-align:right',
										coverFormat : '0,000.####',
										decimalPrecision: 4,
										readOnly : evaluatorFactorDto.factorInputType === 'QualityCalculate'|| isFromFieldReadOnly || me.readOnly,
										value: evaluatorFactorDto.intervalFrom,
										listeners : {
											change : function(field, newValue, oldValue) {
												var evaluatorFactorDto = field.evaluatorFactorDto;
												var groupDto = field.groupDto;
												evaluatorFactorDto.intervalFrom = newValue;
												groupDto.intervalFrom = newValue;
												//배점 범위에 따라서 득점 입력 제한
												var scoreField = Ext.ComponentQuery.query('[name='+evaluatorFactorDto.id+'Score]')[0];
												scoreField.minValue = newValue;
												
												var toField = Ext.ComponentQuery.query('[name='+evaluatorFactorDto.id+'To]')[0];
												toField.minValue = newValue;
												
											}
										}
									},
									{
										xtype: 'displayfield',
										value: '~'
									},
									{
										xtype: 'numberfield',
										evalCmp : true,
										columnText : '배점',
										width: 45,
										name : evaluatorFactorDto.id + 'To',
										maxValue : 100,
										hideTrigger : true,
										fieldStyle: 'text-align:right',
										coverFormat : '0,000.####',
										decimalPrecision: 4,
										evaluatorFactorDto : evaluatorFactorDto,
										record : record,
										readOnly : evaluatorFactorDto.factorInputType === 'QualityCalculate' || isToFieldReadOnly || me.readOnly,
										value: evaluatorFactorDto.intervalTo,
										listeners : {
											change : function(field, newValue, oldValue) {
												var evaluatorFactorDto = field.evaluatorFactorDto;
												evaluatorFactorDto.intervalTo = newValue;
												
												//배점 범위에 따라서 득점 입력 제한
												var scoreField = Ext.ComponentQuery.query('[name='+evaluatorFactorDto.id+'Score]')[0];
												scoreField.maxValue = newValue;
												
												var fromField = Ext.ComponentQuery.query('[name='+evaluatorFactorDto.id+'From]')[0];
												fromField.maxValue = newValue;
											}
										}
									}]
								});
							}
							
							items.push({
								xtype : 'container',
								group : true,
								layout : {
									type : 'vbox',
									align : 'stretch',
									pack : 'center'
								},
								defaults : {
									style : {
										'text-align' : 'center'
									}
								},
								items : ret
							});
							if(index < evaluatorFactorDtos.length-1) {
								items.push({
									xtype : 'component',
									cls : 'separator'
								});
							}
							
						});
						if(index < datas.length-1) {
							items.push({
								xtype : 'component',
								cls : 'separator'
							});
						}
					});
				}
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center'
				},
				items : items,
				margin : 0,
				record : record
			});
		}
	},{
		text : '득점',
		subItems : true,
		isFactorScale: true,
		width : 120,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [],
				variables = false;
			if(Ext.isArray(datas)) {
				if(record.get('sumYn')){
					var factorDto = record.get('evaluatorFactorDtos')[0];
					items.push({
						xtype : 'component',
						cls : 'kepco-eval-component',
						leaf : true,
//						style: 'text-align:right',
						html : '<span class="kepco-eval-component-span">' + factorDto.innerSum + '</span>'
					});
				}else{
					Ext.Array.each(datas, function(data, index) {
						var evaluatorFactorDtos = data.evaluatorFactorDtos;
						Ext.Array.each(evaluatorFactorDtos, function(evaluatorFactorDto, index) {
							var scaleGroups = evaluatorFactorDto.scaleGroups;
							var ret = [];
							if(me.type){
								ret.push({
									xtype : 'numberfield',
									evalCmp : true,
									columnText : '득점',
									hideTrigger : true,
									minValue : evaluatorFactorDto.intervalFrom,
									maxValue : evaluatorFactorDto.intervalTo,
									name : evaluatorFactorDto.id + 'Score',
									readOnly : me.readOnly,
									record : record,
									evaluatorFactorDto : evaluatorFactorDto,
									value : evaluatorFactorDto.allot,
									fieldStyle: 'text-align:right',
									coverFormat : '0,000.####',
									decimalPrecision: 4,
									readOnly : evaluatorFactorDto.factorInputType === 'QualityCalculate' || me.readOnly,
									leaf : true,
									listeners : {
										change : function(field, newValue, oldValue) {
											var dto = field.evaluatorFactorDto;
											
											dto.allot = newValue;
										}
									}
								});
							}
							items.push({
								xtype : 'container',
								group : true,
								layout : {
									type : 'vbox',
									align : 'stretch',
									pack : 'center'
								},
								defaults : {
									margin : 0,
									padding : 5,
									style : {
										'text-align' : 'center'
									}
								},
								items : ret
							});
							if(index < evaluatorFactorDtos.length-1) {
								items.push({
									xtype : 'component',
									cls : 'separator'
								});
							}
						});
						if(index < datas.length-1) {
							items.push({
								xtype : 'component',
								cls : 'separator'
							});
						}
					});
				}
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center'
				},
				items : items,
				variables : variables,
				record : record,
				defaults : {
					margin : 0
				}
			});
		}
	},{
		text : '비고',
		width : 150,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [];
			if(Ext.isArray(datas)) {
				Ext.Array.each(datas, function(data, index) {
					
					var evaluatorFactorDtos = data.evaluatorFactorDtos;
						if(me.type){
							Ext.each(evaluatorFactorDtos, function(dto){
								var ret = [];
								var description = dto.evalFactorGroupDescription;
								if(description == null){
									description = '';
								}
								if(dto.sumYn){
									description = dto.qualifiedResultName;
								}
							ret.push({
				                    xtype: 'textareafield',
				                    cls : 'kepco-eval-component',
				                    leaf : true,
				                    value : description,
				                    evaluatorFactorDto : dto,
				                    readOnly : me.readOnly || dto.sumYn,
									listeners : {
										change : function(field, newValue, oldValue) {
											var dto = field.evaluatorFactorDto;
											
											dto.evalFactorGroupDescription = newValue;
										}
									}
				                });
							
							items.push({
								xtype : 'container',
								group : true,
								layout : {
									type : 'vbox',
									align : 'stretch',
									pack : 'center'
								},
								defaults : {
									margin : 0,
									padding : 5,
									style : {
										'text-align' : 'center'
									}
								},
								items : ret
							});
							if(index < evaluatorFactorDtos.length-1) {
								items.push({
									xtype : 'component',
									cls : 'separator'
								});
							}
							});

						}
						

					if(index < datas.length-1) {
						items.push({
							xtype : 'component',
							cls : 'separator'
						});
					}
				});
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center'
				},
				items : items,
				margin : 0,
				record : record
			});
		}
	},{
		text : '삭제여부',
		deleteColumn : true,
		subItems : true,
		width : 80,
		getValue : function(record) {
			var ret = [],
				fn = function(dtos) {
					var groups = [];
					Ext.Array.each(dtos, function(dto) {
						if(dto.subEvaluatorFactorGroupDtos && dto.subEvaluatorFactorGroupDtos.length > 0) {
							fn(dto.subEvaluatorFactorGroupDtos);
						}
						else if(dto.evaluatorFactorDtos && dto.evaluatorFactorDtos.length > 0){
							fn(dto.evaluatorFactorDtos);
						}
						else {
							groups.push(dto);
						}
					});
					if(groups.length > 0) {
						ret.push({
							evaluatorFactorDtos : groups
						});
					}
				};
				
			var args = record.get('subEvaluatorFactorGroupDtos');
			if(!args || args.length == 0) {
				args = record.get('evaluatorFactorDtos');
			}
			fn(args);
			return ret;
		},
		widget : function(record) {
			var me = this,
				datas =  this.getValue(record),
				items = [];
			if(Ext.isArray(datas)) {
				if(record.get('sumYn')){
					items.push({
						xtype : 'component',
						cls : 'kepco-eval-component',
						leaf : true,
//						style: 'text-align:right',
						html : '<span class="kepco-eval-component-span">' + '' + '</span>'
					});
				}else{
					Ext.Array.each(datas, function(data, index) {
						var evaluatorFactorDtos = data.evaluatorFactorDtos;
						Ext.each(evaluatorFactorDtos, function(evaluatorFactorDto){
							var ret = [];
//							if(evaluatorFactorDto.isNewRow){
							if(!evaluatorFactorDto.evalFactorSettingId){
								ret.push({
									xtype: 'checkboxfield',
									cls : 'kepco-eval-component',
									leaf : true,
									value : evaluatorFactorDto.isNewRowDeleted,
									evaluatorFactorDto : evaluatorFactorDto,
									groupDto : data,
									readOnly : me.readOnly,
									listeners : {
										change : function(field, newValue, oldValue) {
											var dto = field.evaluatorFactorDto;
											var groupDto = field.groupDto;
											
											groupDto.isNewRowDeleted = newValue;
											
											dto.isNewRowDeleted = newValue;
										}
									}
								});
							}
							items.push({
								xtype : 'container',
								group : true,
								layout : {
									type : 'vbox',
									align : 'stretch',
									pack : 'center'
								},
								defaults : {
									style : {
										'text-align' : 'center'
									}
								},
								items : ret
							});
							if(index < evaluatorFactorDtos.length-1) {
								items.push({
									xtype : 'component',
									cls : 'separator'
								});
							}
						});
						
						if(index < datas.length-1) {
							items.push({
								xtype : 'component',
								cls : 'separator'
							});
						}
					});
				}
			}
			return Ext.create('Ext.container.Container', {
				layout : {
					type : 'vbox',
					align : 'stretch',
					pack : 'center'
				},
				items : items,
				margin : 0,
				record : record
			});
		}
	}],
	
	onStoreLoad : function(store, records) {
		var me = this,
			columns = [],
			datas = records,
			data,
			stdData;
		
		var index = 0;
		var isLast = false;
		while(Ext.isArray(datas) && (data = datas[0])) { 
			if(data) {
				var flag = true;
				if(data.isModel){
					if(data.get('subEvaluatorFactorGroupDtos')){
						if(data.get('subEvaluatorFactorGroupDtos').length > 0){
							flag = false;
						}
					}
				}else{
					if(data.subEvaluatorFactorGroupDtos.length > 0){
						flag = false;
					}
				}
				isLast = flag;
				
				var columnData = data.data ? data.data : data;
				var columnText = '심사항목';
				if(columnData.radioGroupCode == "BusinessSize"){
					columnText = '구분';
				}else if(columnData.radioGroupCode == "EvalMethod"){
					columnText = '평가요소';
				}
				
				columns.push({
					text : columnText,
					align : 'center',
					width : 180,
					index : index++,
					dataIndex : 'subEvaluatorFactorGroupDtos',
					getValue : function(record) {
						var index = this.index;
						if(index > 0) {
							var ret = [],
								fn = function(dtos, id, index) {
									var groups = [];
									Ext.Array.each(dtos, function(dto) {
										if(index > 0) {
											if(dto.subEvaluatorFactorGroupDtos) {
												fn(dto.subEvaluatorFactorGroupDtos, dto.id, index-1);
											}
										}
										else {
											groups.push(dto);
										}
									});
									if(groups.length > 0) {
										ret.push({
											id : id,
											subEvaluatorFactorGroupDtos : groups
										});
									}
								};
								
							fn(record.get('subEvaluatorFactorGroupDtos'), record.getId(), index-1);
							return ret;
						}
						return record.getData();
					},
					widget : (function(isLast) {
						return function(record) {
							var me = this,
								datas = this.getValue(record);
							if(Ext.isArray(datas)) {
								var items = [];
								Ext.Array.each(datas, function(data, index) {
									items.push({
										xtype : 'radiogroup',
										vertical : true,
										columns : 1,
										hideLabel : true,
										from : true,
										margin : 0,
										record : record,
										inputValue : data.id,
										items : (function() {
											var ret = [];
											var arr = [];
											var subEvaluatorFactorGroupDtos = data.subEvaluatorFactorGroupDtos;
											Ext.Array.each(subEvaluatorFactorGroupDtos, function(dto, index) {
												var arr = [];
													arr.push({
									                    xtype: 'textfield',
									                    evalCmp : true,
									                    columnText : columnText,
									                    cls : 'kepco-eval-component',
									                    value : dto.factorGroupEvalName,
									                    evaluatorFactorDto : dto,
									                    record : record,
									                    readOnly : me.readOnly,
														listeners : {
															change : function(field, newValue, oldValue) {
																var dto = field.evaluatorFactorDto;
																
																dto.factorGroupEvalName = newValue;
															}
														}
									                });											
													
													ret.push({
														xtype : 'container',
														to : true,
														group : isLast,
														childLength : (dto.evaluatorFactorDtos ? dto.evaluatorFactorDtos.length : 0),
														layout : {
															type : 'vbox',
															align : 'stretch',
															pack : 'center'
														},
														defaults : {
															margin : 0,
															padding : 5,
															style : {
																'text-align' : 'center'
															}
														},
														items : arr
													});
												if(index < subEvaluatorFactorGroupDtos.length-1) {
													ret.push({
														xtype : 'component',
														cls : 'separator'
													});
												}
											});
											return ret;
										}())
									});
									if(index < datas.length-1) {
										items.push({
											xtype : 'component',
											cls : 'separator'
										});
									}
								});
								var prevWidget = me.getView().ownerGrid.plugins[0].liveWidgets[record.internalId + '-' + me.prev().id];
								if(prevWidget.isContainer) {
									var prevTos = prevWidget.query('[to=true]');
									if(datas.length < prevTos.length) {
										items.push({
											xtype : 'component',
											cls : 'separator'
										});
										items.push({
											group : isLast ,
											xtype : 'radiogroup',
											to : true,
											from : true,
											margin : 0
										});
									}
								}
								return Ext.create('Ext.container.Container', {
									layout : {
										type : 'vbox',
										align : 'stretch',
										pack : 'center'
									},
									items : items
								});
							}
							var item;
								var item = [];
								if(record.get('sumYn')){
									item.push({
										xtype : 'component',
										cls : 'kepco-eval-component',
										leaf : true,
//										style: 'text-align:right',
										html : '<span class="kepco-eval-component-span">' + '' + '</span>'
									});
								}else{
									item.push({
										xtype: 'textfield',
										evalCmp : true,
										columnText : columnText,
										cls : 'kepco-eval-component',
										value : datas.factorGroupEvalName,
										evaluatorFactorDto : datas,
										record : record,
										readOnly : me.readOnly,
										listeners : {
											change : function(field, newValue, oldValue) {
												var record = field.record;
												
												record.set('factorGroupEvalName', newValue);
											}
										}
									});
									item.push(
											{
												xtype: 'fieldcontainer',
												layout: {
													type: 'hbox',
													align : 'middle',
													pack : 'center'
												},
												items: [
//												        {
//												        	xtype: 'numberfield',
//												        	evalCmp : true,
//												        	columnText : columnText,
//												        	groupDto : datas,
//												        	record : record,
//												        	name : record.get('id') + 'groupFromField',
//												        	width: 45,
//												        	hideTrigger : true,
//												        	fieldStyle: 'text-align:right',
//												        	readOnly : datas.factorInputType === 'QualityCalculate' || me.readOnly,
//												        	value: datas.intervalFrom,
//												        	listeners : {
//												        		change : function(field, newValue, oldValue) {
//												        			var record = field.record;
//												        			
//												        			record.set('intervalFrom', newValue);
//												        			
//												        			var toField = Ext.ComponentQuery.query('[name='+record.get('id') + 'groupToField]')[0];
//												        			toField.minValue = newValue;
//												        		}
//												        	}
//												        },
//												        {
//												        	xtype: 'displayfield',
//												        	value: '~'
//												        },
												        {
												        	xtype: 'numberfield',
												        	evalCmp : true,
												        	columnText : columnText,
												        	width: 45,
												        	name : record.get('id') + 'groupToField',
												        	hideTrigger : true,
												        	fieldStyle: 'text-align:right',
															coverFormat : '0,000.####',
															decimalPrecision: 4,
												        	groupDto : datas,
												        	record : record,
												        	readOnly : datas.factorInputType === 'QualityCalculate' || me.readOnly,
												        	value: datas.intervalTo,
												        	listeners : {
												        		change : function(field, newValue, oldValue) {
												        			var record = field.record;
												        			var groupDto = field.groupDto;
												        			record.set('intervalTo', newValue);
												        			
//												        			var fromField = Ext.ComponentQuery.query('[name='+record.get('id') + 'groupFromField]')[0];
//												        			fromField.maxValue = newValue;
												        			
												        			if(groupDto.subEvaluatorFactorGroupDtos.length == 0 && groupDto.evaluatorFactorDtos.length > 0){
												        				//입찰가격의 경우 최상위 항목군에서 바로 항목이 붙어있다.
												        				var panel = Ext.getCmp('contentPanel');
												        				Ext.Array.each(panel.el.query('input'), function(input) {
												        					if(input.getAttribute('name') === 'bidPriceAllot'){
												        						input.value = newValue;
												        						return false;
												        					}
												        				});
												        			}
												        		}
												        	}
												        }
												        ]
											});
								}
							return Ext.create('Ext.container.Container', {
								layout : {
									type : 'vbox',
									align : 'stretch',
									pack : 'center'
								},
								items : item
							});
						}
					}(isLast))
				});
				datas = data.isModel ? data.get('subEvaluatorFactorGroupDtos') : data.subEvaluatorFactorGroupDtos;
			}
		}
		
		
		var colArr = [];
		Ext.Array.each(me.defaultColumns, function(col){
			if(me.type){
				col.type = me.type;
			}else{
				col.type = null;
			}
			
			if(col.isExclusive){
				if(!me.getHiddenExclusiveColumn()){
					col.text = me.getExclusiveFactorScaleText();
					colArr.push(col);
				}
			}else if(col.isFactorScale){
				col.text = me.getFactorScaleText();
				colArr.push(col);
			}else if(col.isFactorAllot){
				col.text = me.getAllotText();
				if(!me.type){
					colArr.push(col);
				}
			}else if(col.isExclusiveAllot){
				if(!me.getHiddenExclusiveColumn()){
					colArr.push(col);
				}
			}else if(col.isScaleColumn){
				if(!me.type){
					colArr.push(col);
				}
			}else if(col.deleteColumn){
				if(!me.readOnly){
					colArr.push(col);
				}
			}else{
				colArr.push(col);
			}
		});
		columns = columns.concat(colArr);
		Ext.Array.each(columns, function(column) {
			column.readOnly = column.isExclusive || column.isExclusiveAllot || me.readOnly,
			Ext.apply(column, me.defaultColumnConfig);
		});
		me.reconfigure(columns);
	},
	
	plugins : [{
		ptype : 'kepcoevalpanelwidgetplugin'
	}]
		
});
