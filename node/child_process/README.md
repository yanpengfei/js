# node的通过child_process模块实现多进程示例代码，通过主进程fork多个（cpu个数）进程，通过net模块复用socket实现子进程监听相同端口并处理请求，并且有主－子进程间通讯示例，实际是通过通讯发送net句柄方式实现。

## 主从通讯：

### 根据文档说明,子进程调用process.send()方法，可以发送信息给主进程。而主进程通过fork出来的对象监听message方法，可以接收到process.send()发送过来的消息，这种我觉感觉很奇怪，按理说应该是主进程的process监听message来获得消息，但是实际上是fork返回的对象监听message来获取子进程发送来的消息。

## 使用方法：

### node main_process.js启动项目
### curl http://127.0.0.1:3000测试项目

## 代码来源：
### 《深入浅出nodeJs》-- 朴灵
