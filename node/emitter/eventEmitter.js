var emitter = require('events');

// 定义一个狗的类
function dog() {
    this.say = function() {
        console.log('汪汪汪，我跑了');
    };
}
// 继承emitte类
dog.prototype = new emitter();
dog.prototype.constructor = dog;

// 定义一个人的类
function people() {
    this.sayGo = function() {
        mydog.emit('go'); // 触发狗的跑事件
    }
}

// 实例化
var mydog = new dog();
var man = new people();

mydog.on('go', function(msg) {
    console.log('主人叫我赶紧跑');
    this.say();
});

man.sayGo(); // 让狗跑
