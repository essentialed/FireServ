const EXPORTED_SYMBOLS = ['FireServ.Server'];

if (!JSON && !JSON.stringify) {
    Components.utils.import('resource://gre/modules/JSON.jsm');
    JSON.parse = JSON.fromString;
    JSON.stringify = JSON.toString;
    EXPORTED_SYMBOLS = ['FireServ.Server', 'JSON'];
}

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cu = Components.utils;

Cu.import('resource://fireserv/lib/io.js');
Cu.import('resource://fireserv/lib/log.js');
Cu.import('resource://fireserv/lib/fireserv.js');
Cu.import('resource://fireserv/lib/httpd.js');
Cu.import('resource://fireserv/lib/session.js');

FireServ.Server = {

    get port() { return FireServ.getPref('port'); },
    get address() { return FireServ.getPref('address'); },
    get htdocs() { return FireServIO.getDir(FireServ.getPref('htdocs')); },
    get enabled() { return FireServ.getPref('enabled'); },

    _logger: null,
    _socket: null,
    directoryIndex: null,
    autoIndex: null,
    sessions: false,
    autoSave: false,
    expires: 30,

    init: function Server_init() {
        this._logger = FireServLog.repository.getLogger('FireServ.Server');
        this._logger.level = FireServ.level;
        this.directoryIndex = FireServ.getPref('directoryIndex');
        this.autoIndex = FireServ.getPref('autoIndex');
        this.sessions = FireServ.getPref('sessions');
        this.autoSave = FireServ.getPref('sessions.autoSave');
        this.expires = FireServ.getPref('expires');
        this.checkHtdocs();
        this._start();
        this._logger.trace('init');
    },

    start: function Server_start() {
        this._socket = null;
        this._start();
        FireServ.Chrome.updateIconState();
    },

    _start: function Server__start() {
        if (this.enabled) {
            try {
                this._logger.trace('Starting server.');
                this._socket = this.getServer();
            } catch (e) {
                this._logger.fatal(arguments.callee.name + ' ' + e);
            }
        }
    },

    stop: function Server_stop() {
        try {
            this._logger.trace('Stoping server.');
            this._socket.stop(function() {
                FireServ.Server._socket = null;
                FireServ.Chrome.updateIconState();
            });
        } catch (e) {
            this._logger.fatal(arguments.callee.name + ' ' + e);
        }
    },

    restart: function Server_restart() {
        try {
            this._logger.trace('Restarting server.');
            if (this._socket) {
                this._socket.stop(function() {
                    FireServ.Server._socket = null;
                    FireServ.Server.start();
                    FireServ.Chrome.updateIconState();
                });
            } else {
                FireServ.Server.start();
            }
        } catch (e) {
            this._logger.fatal(arguments.callee.name + ' ' + e);
        }
    },

    isStopped: function Server_isStopped() {
        try {
            return this._socket.isStopped();
        } catch (e) {
            return true;
        }
    },

    getServer: function Server_getServer() {
        var srv = new FireServHttpd.nsHttpServer();
        if (this.htdocs) {
            srv.registerDirectory('/', this.htdocs);
        }
        let parsers = FireServ.parsers;
        for (let i in parsers) {
            srv.registerParser(parsers[i]);
        }
        let controllers = FireServ.controllers;
        for (let j in controllers) {
            srv.registerController(controllers[j]);
        }
        let mimetypes = FireServ.mimetypes;
        for (let ext in mimetypes) {
            srv.registerContentType(ext, mimetypes[ext]);
        }
        srv.identity.setPrimary('http', this.address, this.port);
        srv.start(this.port, this.address);

        let gThreadManager = Cc['@mozilla.org/thread-manager;1'].getService();
        let thread = gThreadManager.currentThread;
        while (srv.isStopped()) {
            thread.processNextEvent(true);
        }

        return srv;
    },

    checkHtdocs: function Server_checkHtdocs() {
        try {
            let htdocs = this.htdocs;
            this._logger.debug(this.htdocs.path);
            if (!htdocs.exists() || !this.htdocs.isDirectory()) {
                htdocs.create(Ci.nsIFile.DIRECTORY_TYPE, 0774);
            }
        } catch (e) {
            this._logger.error(arguments.callee.name + ' ' + e);
        }
    }

};

(function() {
  this.init();
}).apply(FireServ.Server);
