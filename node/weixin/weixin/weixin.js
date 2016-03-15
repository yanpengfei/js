/**
 * Created by ypf on 16/1/26.
 */

/******************************************************************************************************
 *
 * 根据微信规则，需要用appId和secret来获取token,用获取的token获取ticket，再用ticket去计算签名。
 * token和ticket有过期时间，在没过期之前不能重复从接口获取，需要缓存到本地，程序逻辑以此为基础构建。
 *
 * 逻辑：
 * 1、最终返回promise对象，并传递结果对象给后续的then或catch方法。
 * 2、getTicket()从缓存获取，判断ticket是否过期，如果过期则判断token是否过期，token未过期直接用缓存的
 *    token去从接口获取ticket，否则去获取token。
 * 3、getToken()从缓存获取，判断是否过期，token未过期返回缓存的token，否则去获取token。
 * 4、getTokenByAjax()则是从接口去获取token，返回promise对象。
 *
 * * **************************************************************************************************/

"use strict";

var https       = require('https');
var fs          = require('fs');
var sign        = require('./sign.js');
var tokenFile   = process.cwd() + '/node_server/data/weixinToken.json';                // token缓存文件
var ticketFile  = process.cwd() + '/node_server/data/weixinTicket.json';               // ticket缓存文件
var appId       = '这里放你的appId';                                                    // appId，从微信公众号来
var secret      = '这里放你的secret';                                                   // secret，从微信公众号来
var noncestr    = '这里放一个随机串，随便是啥'                                            // 参与生成签名的随机串，写死
var obj         = {key: '1',datetime: 1,timeout: 1};                                   // 中间对象
var token       = {};                                                                  // token对象
var ticket      = {};                                                                  // ticket对象
var nowTime     = "";                                                                  // 时间戳

// 从微信获取获取token，并写入配置文件
function getTokenByAjax() {
    var options = {
        host: 'api.weixin.qq.com',
        path: '/cgi-bin/token?grant_type=client_credential&appId=' + appId + '&secret=' + secret
    };
    return new Promise((resolve, reject) => {
        var req = https.request(options, (res) => {
            res.on('data', (body) => {
                body = JSON.parse(body);
                if (!body.errcode) {                                                    // 接口判断
                    obj = {};                                                           // 重新初始化obj对象
                    obj.key = body.access_token;                                        // 保存token值到对象
                    token.key = body.access_token;                                      // 保存token值到变量
                    obj.timeout = body.expires_in;                                      // 保存过期时间到对象
                    obj.datetime = nowTime;                                             // 保存存入时间到对象
                    obj = JSON.stringify(obj);                                          // json变为字符串
                    fs.writeFile(tokenFile, obj, {encoding: 'utf-8'}, ()=> {            // 写入文件
                    });
                    resolve('get token from api.weixin.qq.com');
                } else {
                    reject('get token error from api.weixin.qq.com');                   // 微信接口错误
                }
            });
        });
        req.end();
        req.on('error', (e) => {
            reject('get token error from http content');                                // http错误
        });
    });
}

// 获取token的判断，token过期从微信重新获取
function getToken() {
    return new Promise((resolve, reject) => {
        try {
            token = JSON.parse(fs.readFileSync(tokenFile, {}).toString());               //  同步方式读取token缓存

            if (token.key == "" || typeof token.datetime != 'number' || typeof token.timeout != 'number' || nowTime - token.datetime > token.timeout * 1000) {
                /* 重新获取token; */
                getTokenByAjax().then((value) => {
                    resolve(value);
                }).catch((value) => {
                    reject(value);
                });
            } else {
                resolve('get token  from cache');
            }
        } catch (e) {
            reject("read token cache file error");
        }
    });
}

// 获取ticket的判断，token过期从微信重新获取,并写入配置文件
function getTicket() {
    return new Promise((resolve, reject) => {
        try {
            ticket = JSON.parse(fs.readFileSync(ticketFile, {}).toString());       //  同步方式读取ticket缓存
            if (ticket.key == "" || typeof ticket.datetime != 'number' || typeof ticket.timeout != 'number' || nowTime - ticket.datetime > ticket.timeout * 1000) {         // 判断ticket缓存是否有问题
                /* 重新获取ticket; */
                getToken().then((value)=> {
                    //console.log(value);
                    var options = {
                        host: 'api.weixin.qq.com',
                        path: '/cgi-bin/ticket/getticket?access_token=' + token.key + '&type=jsapi'
                    };
                    var req = https.request(options, (res) => {
                        res.on('data', (body) => {
                            body = JSON.parse(body);
                            if (body.errcode == 0) {                                        // 接口信息判断
                                obj = {};
                                obj.key = body.ticket;                                      // 保存ticket值到对象
                                ticket.key = body.ticket;                                   // 保存token值到变量
                                obj.timeout = body.expires_in;                              // 保存过期时间到对象
                                obj.datetime = nowTime;                                     // 保存存入时间到对象
                                obj = JSON.stringify(obj);                                  // json变为字符串
                                fs.writeFile(ticketFile, obj, {encoding: 'utf-8'}, ()=> {  // 保存文件
                                });
                                resolve('get ticket from api.weixin.qq.com');
                            } else {
                                reject('get ticket error from api.weixin.qq.com');          // 微信接口错误
                            }
                        });
                    });
                    req.end();
                    req.on('error', (e) => {
                        reject('get ticket error from http content');                       // http错误
                    });
                }).catch((e) => {
                    reject(e);
                });
            } else {
                resolve('get ticket from cache');
            }
        } catch (e) {
            reject("read ticket cache file error");
        }
    });

}

// 返回promise对象 then是异步执行
module.exports  = (url) => {
    var obj     = {};
    var result  = {};
    nowTime = Date.now();                                                               // 获取时间种子
    return new Promise((resolve, reject)=> {
        getTicket().then((value) => {
            obj = sign(ticket.key, noncestr, nowTime, url);                             // 获取成功后计算签名
            result = {                                                                  // 组织返回的对象
                code: 0,
                data: {
                    signature: obj.signature,
                    timestamp: obj.timestamp,
                    noncestr: obj.nonceStr
                },
                msg: "获取成功"
            };
            resolve(result);
        }).catch((e)=> {
            result = {code: 500, data: {}, msg: '获取微信签名失败'};                      // 组织返回对象
            reject(result);
        });
    });

};


