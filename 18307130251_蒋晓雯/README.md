# CG_Project1

> 18307130251 蒋晓雯

## 目录说明

![目录](\src\img\目录.png)

<center><strong>图 1 - 目录结构</strong></center>

- `img\`：图片文件夹
- `config.js`：没有动，就是原来的基础信息，顶点位置，颜色等
- `my.js`：具体实现
- `scanConversion.html`：一个有canvas的网页



## 开发及运行环境

- 操作系统：win10
- 浏览器：chrome
- 运行方法：打开`scanConversion.html`



## 项目亮点

1. 不使用canvas的fill绘制小红点，给它加黑边
2. 点击不同的点会根据具体点重排这些四边形的渲染顺序，尽量使顶点所在四边形的颜色显示在最上面



## 实现思路

1. 按纵坐标轴方向找垂直于纵坐标轴的直线和四边形的边的交点，画直线
2. 凹下去的顶点也能解决，会交出两段分开划线
3. 水平直线的交点就是顶点本身

![水平直线](\src\img\水平直线.png)

<center><strong>图 2 - 右下角四边形两条边水平</strong></center>

![四边形水平](\src\img\四边形水平.png)

<center><strong>图 3 - 右下角四边形所有边水平</strong></center>

![凹四边形](\src\img\凹四边形.png)

<center><strong>图 4 - 凹四边形，交叉边表现</strong></center>



## 存在的缺陷和思考

- 测试的情况是有限的
- 对交互式的理解很简单，认为用户点哪个点就是希望哪个点所在的四边形显示在上面



## 课程建议

- 没什么，挺好的
- pj挺好玩的
