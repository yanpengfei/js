var cp = require('child_process');
var cpus = require('os').cpus().length;

var server = require('net').createServer();
server.listen(3000);

var works = {};
var createWorker = function() {
	
	var worker = cp.fork(__dirname+'/child_process.js');

	worker.on('exit',function(){
		console.log('worker '+ worker.pid + ' exited.');
		delete works[worker.pid];
	});

	worker.on('message', function (m){
		if ( m.act === 'suicide' ) {
			createWorker();
		}
	});

	worker.send('server',server);
	works[worker.pid] = worker;
	console.log('Create worker. pid : '+worker.pid);

}

for ( var i = 0; i < cpus; i++ ) {
	createWorker();
}

process.on('exit',function(){
	for ( var pid in workers) {
		workers[pid].kill();
	}
});