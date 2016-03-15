const http = require('http');
const cluster = require('cluster');
const cpus = require('os').cpus().length;

var workers = {};

function createWorker() {
    var worker;
    worker = cluster.fork();
    workers[worker.pid] = worker; // 进程引用保存到对象

    worker.on('message', function(msg) {
        if (msg === '未捕获错误发生') {
            createWorker();
        } else {
            worker.send('这是发送给子进程的信息');
        }
        console.log('接受到发送给主进程的信息：' + msg);
    });

}

if (cluster.isMaster) {

    cluster.on('exit', (workers, code, signal) => {
        console.log('进程 '+workers.process.pid+' 退出');
    });

    for (var i = 0; i < cpus; i++) {    // 建立进程
        createWorker();
    }

} else {
    http.createServer(function(req, res) {
        res.end('ok\n');
        process.send('这是发送给主进程的消息');
        throw new Error('abc');    // 抛出一个错误
    }).listen(3000, function() {
    	console.log('新进程建立：'+process.pid);
    });

    process.on('uncaughtException', function() {
        process.send('未捕获错误发生');
        process.exit(1);
    });

    process.on('message', function(msg) {
        console.log('接收到发送给子进程的消息:' + msg);
    });
}
