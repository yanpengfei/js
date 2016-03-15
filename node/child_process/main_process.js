var cp = require('child_process');
var cpus = require('os').cpus().length;

var server = require('net').createServer();
server.listen(3000);

var works = {};
var createWorker = function() {
	
	var worker = cp.fork(__dirname+'/child_process.js');  // 创建进程

	worker.on('exit',function(){   // 接收到子进程退出事件
		console.log('worker '+ worker.pid + ' exited.');
		delete works[worker.pid];  // 进程维护对象删除
	});

	worker.on('message', function (m){  // 接到子进程消息
		if ( m.act === 'suicide' ) {
			createWorker();             // 立即启动新进程
		}
	});

	process.on('message',function(m){
		console.log(m);
	});
	worker.send('server',server);  // 发送句柄给子进程
	works[worker.pid] = worker;    // 添加进程进进程维护对象
	console.log('Create worker. pid : '+worker.pid);

}

for ( var i = 0; i < cpus; i++ ) {
	createWorker();   // 根据cpu个数创建进程
}

process.on('exit',function(){  // 主进程退出事件
	for ( var pid in workers) {
		workers[pid].kill();  // 所有子进程退出
	}
});