var http = require('http');

var server = http.createServer(function (req,res){
	res.end('handled by child, pid is '+process.pid+'\n');
	throw new Error('asdf');   // 触发未捕获的错误
});

var work;
process.on('message',function (m, tcp){    // 子进程message事件接收主进程发过来的消息，并接收句柄
	if ( m === 'server' ) {
		work = tcp;
		work.on('connection',function (socket){  // 句柄connection事件
			server.emit('connection',socket);    // 手动触发http的connection，并进入解析阶段
		});
	}
});

process.on('uncaughtException', function (){   // 子进程未捕获的异常错误

	process.send({act:'suicide'});  //   发送给主进程消息

	work.close(function (){			// 发过来的net句柄关闭
		process.exit(1);			// 子进程退出
	});

	setTimeout(function (){			// 子进程定时强制退出
		process.exit(1);
	},5000);
})