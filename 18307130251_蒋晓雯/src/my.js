
//-----------canvas------------
let c = document.getElementById("myCanvas");
let cxt=c.getContext("2d");

//将canvas坐标整体偏移0.5，用于解决宽度为1个像素的线段的绘制问题，具体原理详见project文档
cxt.translate(0.5, 0.5);

//------------args---------------
// 拖拽点的半径
const DRAG_POINT_RADIUS = 10;
const DRAG_POINT_RADIUS_SQUARE = Math.pow(DRAG_POINT_RADIUS, 2);


/**
 * 在一个canvas上绘制一个点
 * 由于canvas本身没有绘制单个point的接口，所以我们通过绘制一条短路径替代
 * @param cxt 2d上下文
 * @param x 横坐标
 * @param y 纵坐标
 * @param color rgb
 * 直接用颜色名称:   "red" "green" "blue"
 * 十六进制颜色值:   "#EEEEFF"
 * rgb分量表示形式:  "rgb(0-255,0-255,0-255)"
 * rgba分量表示形式:  "rgba(0-255,1-255,1-255,透明度)"
 */
function drawPoint(cxt,x,y, color)
{
    //建立一条新的路径
    cxt.beginPath();
    //设置画笔的颜色
    cxt.strokeStyle ="rgb("+color[0] + "," +
        +color[1] + "," +
        +color[2] + ")" ;
    //设置路径起始位置
    cxt.moveTo(x,y);
    //在路径中添加一个节点
    cxt.lineTo(x+1,y+1);
    //用画笔颜色绘制路径
    cxt.stroke();
}

/**
 * 绘制一条从(x1,y1)到(x2,y2)的线段
 * @param cxt
 * @param x1
 * @param y1
 * @param x2
 * @param y2
 * @param color
 */
function drawLine(cxt,x1,y1,x2,y2,color){

    cxt.beginPath();
    cxt.strokeStyle ="rgba("+color[0] + "," +
        +color[1] + "," +
        +color[2] + "," +
        +255 + ")" ;
    //这里线宽取1会有色差，但是类似半透明的效果有利于debug，取2效果较好
    cxt.lineWidth =1;
    cxt.moveTo(x1, y1);
    cxt.lineTo(x2, y2);
    cxt.stroke();
}

/**
 * 在p点绘制拖拽用红点
 * @param cxt
 * @param p 坐标点[x, y(, z)]，在(x, y)处绘制圆点
 */
function drawDragPoint (cxt, p) {
    let x = p[0], y = p[1];
    for (let theta =  0.1; theta < Math.PI; theta += 0.04) {
        let x1 = x - DRAG_POINT_RADIUS * Math.sin(theta);
        let x2 = x + DRAG_POINT_RADIUS * Math.sin(theta);
        let y_ = y + DRAG_POINT_RADIUS * Math.cos(theta);
        drawLine(cxt, x1, y_, x2, y_, [255, 0, 0]);
        drawPoint(cxt, x1, y_, [0, 0, 0]);
        drawPoint(cxt, x2, y_, [0, 0, 0]);
    }
    drawPoint(cxt, x, y + DRAG_POINT_RADIUS, [0, 0, 0]);
    drawPoint(cxt, x, y - DRAG_POINT_RADIUS, [0, 0, 0]);
    // console.log(1);
}

/**
 * 绘制所有拖拽点
 * @param cxt
 */
function drawAllDragPoints (cxt) {
    for (let i = 0; i < vertex_pos.length; i++) {
        drawDragPoint(cxt, vertex_pos[i]);
    }
}

/**
 * 两点之间距离的平方
 * @param p1
 * @param p2
 */
function squareDistance (p1, p2) {
    return Math.pow(p1[0] - p2[0], 2) +
        Math.pow(p1[1] - p2[1], 2);
}

/**
 * 定位拖拽点(x, y)的是拖的哪一个顶点
 * 在某顶点的一定半径之内的都可以
 * @param x
 * @param y
 * 没在拖动范围内反-1，否则反顶点下标
 */
function locateVertex (x, y) {
    let ret = -1;

    for (let i in vertex_pos) {
        if (squareDistance(vertex_pos[i], [x, y]) <= DRAG_POINT_RADIUS_SQUARE) {
            return i;
        }
    }

    return ret;
}

/**
 * 获得需要渲染的Y的范围
 * @param rec [p1, p2, p3, p4]
 */
function renderRangeY (rec) {
    let minY = rec[0][1], maxY = rec[0][1];
    for (let i = 1; i < rec.length; i++) {
        maxY = Math.max(rec[i][1], maxY);
        minY = Math.min(rec[i][1], minY);
    }
    return [minY, maxY];
}

/**
 * nodes中开始和结束节点是否为p
 * @param nodes 所有交点
 * @param p 新交点
 */
function classify(nodes, p) {
    let ret = 0;

    let n = nodes.length;
    if (n > 0) {
        if (nodes[0][0] === p[0] && nodes[0][1] === p[1]) {
            ret = 1;
        }
        if (nodes[n - 1][0] === p[0] && nodes[n - 1][1] === p[1]) {
            ret = 2;
        }
    }

    return ret;
}

/**
 * 用color渲染rec
 * @param rec [p1, p2, p3, p4]
 * @param color [r, g, b]
 */
function renderRec (rec, color) {
    // 扫描的纵坐标范围
    let [minY, maxY] = renderRangeY(rec);

    // rec在同一纵坐标下所有交点
    let nodes = [];
    // 交点
    let p;

    // y从上向下扫描，(x, y)为和多边形边的交点
    for (let y = maxY; y >= minY; y--) {
        // 顺序遍历每一条边，顶点为v1,v2，找交点
        for (let i = 0; i < rec.length; i++) {
            let v1 = rec[i], v2 = rec[(i + 1) % rec.length];
            let x1 = v1[0], y1 = v1[1], x2 = v2[0], y2 = v2[1];
            if (y1 === y && y2 === y) {//y和边水平
                nodes.push([x1, y])
            }
            else if ((y >= y1 && y <= y2) || (y >= y2 && y <= y1)) {//y在边范围内
                let x = parseInt(((y - y1) * (x2 - x1)) / (y2 - y1) + x1);
                p = [x, y];
                // 辅助第三顶点纵坐标
                let y3;
                switch (classify(nodes, p)) {
                    case 0:// 不是已经扫描过的顶点
                        nodes.push(p);
                        break;
                    case 1:// 第一条边的开始顶点，如果v2在上一个顶点v1和下一个顶点v3的凹陷处
                        y3 = rec[(i + 2) % rec.length][1];
                        if ((y3 - y2) * (y1 - y2) > 0) nodes.push(p);
                        break;
                    case 2:// 上一条边的结束顶点，如果v1在上一个顶点v0和下一个顶点v2的凹陷处
                        y3 = rec[(i - 1) % rec.length][1];
                        if ((y3 - y1) * (y2 - y1) > 0) nodes.push(p);
                        break;
                }
            }
        }

        // 按x升序排列交点
        nodes.sort((a, b) => { return  a[0] - b[0]; })
        let n = nodes.length;
        for (let i = 0; i < n - 1; i += 2) {
            let p1 = nodes[i];
            let p2 = nodes[i + 1];
            drawLine(cxt, p1[0], p1[1], p2[0], p2[1], color);
        }

        nodes = [];
    }
}

// 点中某些点时调整渲染顺序
let render_order = [];
for (let i = polygon.length - 1; i >= 0; i--) render_order.push(i);
// for (let i = 0; i < polygon.length; i++) render_order.push(i);
let lastVert = 0;
let map = {
    '0': '0',
    '1': '0',
    '2': '1',
    '3': '0',
    '5': '3',
    '6': '2',
    '7': '3',
    '8': '3',
}


function reorder (vertex) {
    lastVert = vertex;
    if (vertex === '4') return ;
    let active = map[vertex];
    // console.log('vertex=' +vertex);
    // console.log('active=' +active);
    for (let i = 0; i < render_order.length; i++) {
        if (render_order[i] === active) {
            render_order.splice(i, 1);
            break;
        }
    }
    render_order.push(active);
    // console.log("render_order=" + render_order);
}

function render (vertex) {
    if (vertex !== lastVert) reorder(vertex);
    for (let i = 0; i < render_order.length; i++) {
        renderRec(
            [
                vertex_pos[polygon[render_order[i]][0]],
                vertex_pos[polygon[render_order[i]][1]],
                vertex_pos[polygon[render_order[i]][2]],
                vertex_pos[polygon[render_order[i]][3]],
            ],
            vertex_color[polygon[render_order[i]][0]]
        );
    }
    // 画点
    drawAllDragPoints(cxt);
}

/**
 * 拖拽后重新渲染
 * @param x
 * @param y
 */
function drag (x, y) {
    let vert = locateVertex(x, y);

    if (vert >= 0) {
        //路径正确，鼠标移动事件
        c.onmousemove = (e) => {
            vertex_pos[vert][0] = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - c.offsetLeft;
            vertex_pos[vert][1] = e.clientY + document.body.scrollTop + document.documentElement.scrollTop - c.offsetTop;

            // 清除画布
            cxt.clearRect(0, 0, c.width, c.height);
            // 重新渲染
            render(vert);
        };
        //鼠标移开事件
        c.onmouseup = () => {
            c.onmousemove = null;
            c.onmouseup = null;
        };
    }
}

c.onmousedown = (e) => {
    let x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - c.offsetLeft;
    let y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop - c.offsetTop;

    drag(x, y);
};

render(0);

