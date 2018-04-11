define([
    'jQuery'
], function ($) {
    'use strict';
    /**
     * $.get(url, data, success(response,status,xhr), dataType)
     * url 必选，请求发送url
     * data 可选，连同请求发送到服务器的数据
     * success 可选 请求成功时执行的函数
     */
    var getData = function (url, data, callback, context) {
        $.get(url, data, function (response) {
            if (context) {
                callback(response, context);
            } else {
                callback(response);
            }
        }).fail(function (err) {
            callback({error: err});
        });
    };

    var sendData = function (url, data, method, callback, options) {
        var ajaxObject;

        //请求方式
        method = method.toUpperCase() || 'POST';
        ajaxObject = {
            url        : url,
            contentType: 'application/json',
            data       : JSON.stringify(data),
            type       : method,

            success: function (response) {
                callback(null, response);
            },

            error: function (jxhr) {
                callback(jxhr);
            }
        };

        //$.ajax([settings]) ==> Ajax
        $.ajax(ajaxObject);
    };

    //post方法
    var postData = function (url, data, callback) {
        sendData(url, data, 'POST', callback);
    };

    //put方法
    var putData = function (url, data, callback) {
        sendData(url, data, 'PUT', callback);
    };

    //patch方法
    var patchData = function (url, data, callback, contentType) {
        sendData(url, data, 'PATCH', callback, contentType);
    };

    //delete方法
    var deleteData = function (url, data, callback, contentType) {
        sendData(url, data, 'DELETE', callback, contentType);
    };

    //返回一系列方法
    return {
        getData   : getData,
        postData  : postData,
        putData   : putData,
        patchData : patchData,
        deleteData: deleteData
    };
});
