/**
 * Created by ypf on 16/2/2.
 */


/*************************************************
 *
 * 所有的接口, 这里有日志代码
 *
 * * *********************************************/
"use strict";

var weixin = require('./weixin/weixin');               // 引入依赖

function createInterface(app){

    // 微信授权接口
    app.get("/Activity/getWXSignature", (req, res) => {          // Activity/getWXSignature方法
        var url = req.query.url;
        weixin(url).then(result=> {
            res.header({'content-type': 'application/json'});
            res.status(200);
            res.send(result);

        }).catch(result=> {
            res.header({'content-type': 'application/json'});
            res.status(500);                                     // 如果需要的话，可以直接修改为500，http状态码与接口code就一致了
            res.send(result);
        });
    });
}

module.exports = createInterface;