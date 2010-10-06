const EXPORTED_SYMBOLS = ['FireServSession'];

const Cu = Components.utils;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');
Cu.import('resource://fireserv/lib/io.js');
Cu.import('resource://fireserv/lib/db.js');

let FireServSession = {

    get Session() { return Session; }

};

function generateSid() {
    return Math.floor(Math.random() * 100000000).toString(16);
}

function Session(reqData, response, autoSave) {
    this._response = response;
    this._autoSave = autoSave ? true : false;

    let sid = null;
    try {
        sid = reqData.getHeader('Cookie').match(/__sid__=(.*)/)[1];
    } catch (e) {}

    if (!sid) {
        this._sid = generateSid();
        this.init(false);
    } else {
        this._sid = sid;
        this.init(true);
    }
}

Session.prototype = (function() {

    var Database = {

        get dataDir() {
            try {
                Cu.import('resource://fireserv/lib/fireserv.js');
                return FireServIO.getDir(FireServ.getPref('data'), true);
            } catch (e) {
                throw e;
            }
        },

        get db() {
            try {
                let dbFile = this.dataDir;
                dbFile.append('session.sqlite');
                return new FireServDB.Database(dbFile);
            } catch (e) {
                throw new SessionException('Session get db(): ' + e);
            }
        }

    };

    return {

        get sid() { return this._sid; },
        get autoSave() { return this._autoSave; },

        data: {},

        init: function Session_init(resume) {
            try {
                if (!Database.db.tableExists('sessions')) {
                    this.initDb();
                }
                this.data = {};
                this.data.__proto__.toString = function() {
                    var str = {};
                    for (let k in this) {
                        str[k] = this[k];
                    }
                    return JSON.stringify(str);
                }
                if (resume === false) {
                    this.gc();
                    this.create();
                    this.setCookie();
                } else {
                    this.load();
                }
            } catch (e) {
                throw new SessionException(arguments.callee.name + ': ' + e);
            }
        },

        initDb: function Session_initDb() {
            let queries = [];
            queries.push('CREATE TABLE sessions ' +
              '(sid varchar(50), data blob, expires int, UNIQUE (sid))');
            try {
                Database.db.executeTransaction(queries);
            } catch (e) {
                throw new SessionException(arguments.callee.name + ': ' + e);
            }
        },

        save: function Session_save() {
            try {
                Database.db.executeTransaction(['UPDATE sessions SET data="' +
                  escape(this.data) + '" WHERE sid="' + this.sid + '"']);
            } catch (e) {
                throw new SessionException(arguments.callee.name + ': ' + e);
            }
        },

        create: function Session_create() {
            let expires = (new Date()).getTime() * 86400000;
            let transaction =
              ['INSERT INTO sessions (sid, data, expires) VALUES ("' +
              this.sid + '", "{}", "' + expires + '")'];
            this.data = {};
            Database.db.executeTransaction(transaction);
        },

        load: function Session_load() {
            try {
                let query = 'SELECT * FROM sessions WHERE sid="' +
                  this.sid + '"';
                let res = Database.db.selectQuery(query);
                try {
                    let data = JSON.parse(unescape(res[0].data));
                    for (let k in data) {
                        this.data[k] = data[k];
                    }
                } catch (e) {
                    this.invalidate();
                }
            } catch (e) {
                this.invalidate();
            }
        },

        close: function Session_close() {
            if (this.autoSave === true) {
                this.save();
            }
            Database.db.close();
        },

        invalidate: function Session_invalidate() {
            try {
                this._sid = generateSid();
                this.init(false);
            } catch (e) {
                throw new SessionException(arguments.callee.name + ': ' + e);
            }
        },

        delete: function Session_delete() {
            try {
                Database.db.executeTransaction(
                  ['UPDATE sessions SET data="" WHERE sid="' + this.sid + '"']);
            } catch (e) {
                this._sid = generateSid();
                this.init(false);
            }
            this.init(true);
        },

        setCookie: function Session_setCookie() {
            this._response.setHeader('Set-Cookie', '__sid__=' +
              this.sid + '; path=/', false);
        },

        gc: function Session_gc() {
            if (Math.floor(Math.random() * 20) === 1) {
                dump('Running gc...' + '\n');
                Database.db.executeTransaction(
                  ['DELETE FROM sessions WHERE expires < ' +
                  (new Date).getTime()]);
            }
        }

    };
})();

function SessionException(msg) {
    this.message = msg;
}

SessionException.prototype = {

    toString: function() {
        return this.message + '';
    }

};
