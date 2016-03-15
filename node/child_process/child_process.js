var http = require('http');

var server = http.createServer(function (req,res){
	res.end('handled by child, pid is '+process.pid+'\n');
	throw new Error('asdf');   // 触发未捕获的错误
});

var work;
process.on('message',function (m, tcp){    // 接收主进程发过来的消息
	if ( m === 'server' ) {
		work = tcp;
		work.on('connection',function (socket){  // 接收句柄
			server.emit('connection',socket);    // 触发监控
		});
	}
});

process.on('uncaughtException', function (){   // 未捕获的异常错误
	process.send({act:'suicide'});  //   发送给主进程消息
	work.close(function (){			
		process.exit(1);			// 进程退出
	});
	setTimeout(function (){			// 定时退出
		process.exit(1);
	},5000);
})