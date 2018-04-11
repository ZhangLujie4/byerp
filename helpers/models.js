/**
 * 检验是否登录，
 * @param dbsObject
 * @returns {{get: get, connection: connection}}
 */
var models = function (dbsObject) {
    function get(id, collection, schema) {
        var model;

        if (!id) {
            throw new Error('请先登录');
        }

        model = dbsObject[id].models[collection];

        return model || dbsObject[id].model(collection, schema);
    }

    function connection(id) {
        return dbsObject[id];
    }

    return {
        get       : get,
        connection: connection
    };
};

module.exports = models;
