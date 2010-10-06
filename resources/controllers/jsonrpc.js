const EXPORTED_SYMBOLS = ['jsonrpc'];

const Cu = Components.utils;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');
Cu.import('resource://fireserv/lib/util.js');
Cu.import('resource://fireserv/lib/log.js');
Cu.import('resource://fireserv/lib/fireserv.js');
Cu.import('resource://fireserv/lib/server.js');

const JsonError = FireServUtil.JsonError;

let jsonrpc = {

    get Controller() { return Controller; }

};

function Controller(ServerHandler, reqData, response) {
    this._serverHandler = ServerHandler;
    this._reqData = reqData;
    this._response = response;
    this._logger = FireServLog.repository.getLogger('jsonrpcController');
    this._logger.level = FireServ.level;
}

Controller.prototype = {

    _serverHandler: {},

    _reqData: {},

    index: function jsonrpcController_index() {
        try {
            this._response.setHeader('Content-Type', 'application/json', false);
            return JSON.stringify({
                status: '200',
                data: 'Hello world'
            });
        } catch (e) {
            this._logger.error(arguments.callee.name + ': ' + e);
            return new JsonError('500');
        }
    }

};
