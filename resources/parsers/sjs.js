const EXPORTED_SYMBOLS = ['sjs'];

const Cu = Components.utils;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');
Cu.import('resource://fireserv/lib/session.js');

var gGlobalObject = this;

let sjs = {

    get Parser() { return Parser; }

};

function Doc() {}

Doc.prototype = {

    out: '',

    flush: function() {
        this.out = '';
    },

    writeln: function(line) {
        this.write(line);
        this.out += '\n';
    },

    write: function(line) {
        if (line) {
            line = line + '';
            line = line.replace(/\$/mg, '__DOLLAR__');
            this.out += line;
        }
    }

};

function Parser(response, reqData, sessionsEnabled, sessionsAutoSave) {
    this._response = response;
    this._reqData = reqData;
    this._sessionsEnabled = sessionsEnabled;
    this._sessionsAutoSave = sessionsAutoSave;
}

Parser.prototype = {

    _response: null,

    _reqData: null,

    _session: null,

    _sessionsEnabled: false,

    _sessionsAutoSave: false,

    parse: function sjsParser_parse(fileContents) {
        let path = this._reqData.path;
        try {
            var s = this.getSandbox();
        } catch (e) {
            throw new ParserException(arguments.callee.name + ': ' + e);
        }
        let scriptBlock;
        let lostLines = 0;
        let ws, offset, script, before;

        fileContents = fileContents.replace(/\?/g, '__QUEST__');
        fileContents = fileContents.replace(/<__QUEST__sjs/g, '<?sjs');
        fileContents = fileContents.replace(/__QUEST__>/g, '?>');

        if (fileContents.indexOf('?') === -1) {
            scriptBlock = false;
        } else {
            scriptBlock =
              fileContents.match(/([^\?]*)<\?sjs(([^\?]|\n)*)\?>/m);
        }
        var exit = false;
        while (scriptBlock && !exit) {
            ws = scriptBlock[1].split(/\n/);
            offset = ws.length + lostLines;
            script = scriptBlock[2];
            script = script.replace(/__QUEST__/g, '?');
            try {
                var line = new Error().lineNumber;
                Cu.evalInSandbox(script, s);
            } catch (e if e === 'exit') {
                exit = true;
            } catch (e) {
                if(e.lineNumber) {
                    throw new ParserException(arguments.callee.name +
                      ' error,  ' + e + ' in ' + path + ' on line ' +
                      (e instanceof Error ? e.lineNumber +
                      ' in sjs parser' : ((e.lineNumber - 1) - line) + offset));
                } else {
                    throw e;
                }
            }
            before = fileContents.split(/\n/).length;
            fileContents = fileContents.replace(/<\?sjs(([^\?]|\n)*)\?>/m,
              s.document.out);
            lostLines += before - fileContents.split(/\n/).length;
            fileContents = fileContents.replace(/__DOLLAR__/mg, '$');
            s.document.flush();
            if (fileContents.indexOf('<?sjs') === -1) {
                scriptBlock = false;
            } else {
                scriptBlock =
                  fileContents.match(/([^\?]*)<\?sjs(([^\?]|\n)*)\?>/m);
            }
        }
        fileContents = fileContents.replace(/__QUEST__/g, '?');
        if (this._sessionsEnabled) {
            this._session.close();
        }
        return fileContents;
    },

    getSandbox: function sjsParser_getSandbox() {
        var s = Cu.Sandbox(gGlobalObject);
        var that = this;
        /*
         * Import public functions
         *
         */
        if (this._sessionsEnabled) {
            try {
                this._session = new FireServSession.Session(this._reqData,
                  this._response, this._sessionsAutoSave);
                s.$_session = this._session.data;
                s.importFunction(function $_saveSession() {
                    that._session.save();
                });
            } catch (e) {
                throw new ParserException(arguments.callee.name + ': ' + e);
            }
        }
        s.document = new Doc();
        s.importFunction(dump, 'dump');
        s.importFunction(function $_setHeader(name, value, merge) {
            that._response.setHeader(name, value, merge);
        });
        s.importFunction(function $_redirect(location) {
            that._response.setStatusLine('1.1', 302, 'Moved Temporarily');
            that._response.setHeader('Location', location, false);
            throw 'exit';
        });
        return s;
    }

};

function ParserException(msg) {
    this.message = msg;
}

ParserException.prototype = {

    toString: function() {
        return this.message + '';
    }

};
