
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

    //画圆
    cxt.beginPath();
    cxt.arc(p[0], p[1], DRAG_POINT_RADIUS, 0, Math.PI*2, true);
    cxt.closePath();

    //填充红色
    cxt.fillStyle = "red";
    cxt.fill();

    //画黑色边线
    cxt.strokeStyle="black";
    cxt.stroke();

}

/**
 * 绘制所有拖拽点
 * @param cxt
 */
function drawAllDragPoints (cxt) {
    // console.log(vertex_pos);
    for (let i in vertex_pos) {
        // console.log(v);
        drawDragPoint(cxt, vertex_pos[i]);
    }
}

/**
 * 两点之间距离的平方
 * @param p1
 * @param p2
 */
function squareDistance (p1, p2) {
    return Math.pow(p1[0] - p2[0] + DRAG_POINT_RADIUS, 2) +
        Math.pow(p1[1] - p2[1] + DRAG_POINT_RADIUS, 2);
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
function contains(nodes, p) {
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
    // for (let y = minY; y <= maxY; y++) {
        // 顺序遍历每一条边，顶点为v1,v2，找交点
        for (let i = 0; i < rec.length; i++) {
            let v1 = rec[i], v2 = rec[(i + 1) % rec.length];
            let x1 = v1[0], y1 = v1[1], x2 = v2[0], y2 = v2[1];
            if (y1 === y && y2 === y) {//y和边水平
                nodes.push([x1 + 1, y])
            }
            else if ((y >= y1 && y <= y2) || (y >= y2 && y <= y1)) {//y在边范围内
                let x = parseInt(((y - y1) * (x2 - x1)) / (y2 - y1) + x1);
                p = [x, y];
                // 辅助第三顶点纵坐标
                let y3;
                switch (contains(nodes, p)) {
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

    // 渲染边
    for (let i = 0; i < rec.length; i++) {
        let v3 = rec[i], v4 = rec[(i + 1) % rec.length];
        drawLine(cxt, v3[0], v3[1], v4[0], v4[1], color);
    }
}

function render () {
    for (let i = 0; i < polygon.length; i++) {
        renderRec(
            [
                vertex_pos[polygon[i][0]],
                vertex_pos[polygon[i][1]],
                vertex_pos[polygon[i][2]],
                vertex_pos[polygon[i][3]]
            ],
            vertex_color[i]
        );
    }
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
            let x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            let y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            vertex_pos[vert][0] = x - DRAG_POINT_RADIUS;
            vertex_pos[vert][1] = y - DRAG_POINT_RADIUS;

            // 清除画布
            cxt.clearRect(0, 0, c.width, c.height);
            // 重新渲染
            render();
            // 画点
            drawAllDragPoints(cxt);
        };
        //鼠标移开事件
        c.onmouseup = () => {
            c.onmousemove = null;
            c.onmouseup = null;
        };
    }
}

c.onmousedown = (e) => {
    let x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    let y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;

    drag(x, y);
};

render();
drawAllDragPoints(cxt);

