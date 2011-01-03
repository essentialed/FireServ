/** 
 *
 * Based on log4moz.js
 * http://mxr.mozilla.org/services-central/source/fx-sync/services/sync/modules/log4moz.js?raw=1
 * Copyright (C) 2006 Michael Johnston <special.michael@gmail.com>
 * Copyright (C) Dan Mills <thunder@mozilla.com>
 *
 */

const EXPORTED_SYMBOLS = ['FireServLog'];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import('resource://fireserv/lib/io.js');

const MODE_RDONLY = 0x01;
const MODE_WRONLY = 0x02;
const MODE_CREATE = 0x08;
const MODE_APPEND = 0x10;
const MODE_TRUNCATE = 0x20;

const PERMS_FILE = 0644;
const PERMS_DIRECTORY = 0755;

const ONE_BYTE = 1;
const ONE_KILOBYTE = 1024 * ONE_BYTE;
const ONE_MEGABYTE = 1024 * ONE_KILOBYTE;

let FireServLog = {

    Level: {
        Fatal: 100,
        Error: 90,
        Access: 80,
        Debug: 20,
        Trace: 10,
        All: 0
    },

    get LogMessage() { return LogMessage; },

    get Logger() { return Logger; },

    get LoggerRepository() { return LoggerRepository; },

    get Formatter() { return Formatter; },

    get BasicFormatter() { return BasicFormatter; },

    get RawFormatter() { return RawFormatter; },

    get Appender() { return Appender; },

    get DumpAppender() { return DumpAppender; },

    get ConsoleAppender() { return ConsoleAppender; },

    get RotatingFileAppender() { return RotatingFileAppender; },

    get repository() {
        delete FireServLog.repository;
        FireServLog.repository = new LoggerRepository();
        return FireServLog.repository;
    },

    set repository(value) {
        delete FireServLog.repository;
        FireServLog.repository = value;
    }

};

/*
* LogMessage
* Encapsulates a single log event's data
*/
function LogMessage(loggerName, level, message) {
  this.loggerName = loggerName;
  this.level = level;
  this.message = message;
  this.time = Date.now();
}

LogMessage.prototype = {

    toString: function LogMsg_toString() {
        return 'LogMessage [' + this.loggerName + ' ' + this.time +
          ' ' + this.level + ' ' + this.message + ']';
    }

};

/*
* Logger
*/

function Logger(name) {
    this._name = name;
}

Logger.prototype = {

    level: 80,

    get name() {
        return this._name;
    },

    get logDir() {
        try {
            Cu.import('resource://fireserv/lib/fireserv.js');
            return FireServIO.getDir(FireServ.getPref('log'), true);
        } catch (e) {
            throw e;
        }
    },

    get errorLog() {
        let logFile = this.logDir;
        logFile.append('error_log');
        return new FireServLog.RotatingFileAppender(logFile);
    },

    get accessLog() {
        let logFile = this.logDir;
        logFile.append('access_log');
        let formatter = new RawFormatter();
        return new FireServLog.RotatingFileAppender(logFile, formatter);
    },

    get stdout() {
        return new FireServLog.DumpAppender();
    },

    get console() {
        return new FireServLog.ConsoleAppender();
    },

    log: function Logger_log(message, loggers) {
        for (var i in loggers) {
            switch (loggers[i]) {
                case 'error_log':
                    dump(message.message + '\n');
                    this.errorLog.append(message);
                    break;
                case 'access_log':
                   this.accessLog.append(message);
                   break;
                case 'stdout':
                   this.stdout.append(message);
                   break;
                case 'console':
                   this.console.append(message);
                   break;
                default:
                    break;
            }
        }
    },

    fatal: function Logger_fatal(string) {
        try {
            this.log(new LogMessage(this._name, 'FATAL', string),
              ['error_log', 'stdout']);
        } catch (e) {}
    },

    error: function Logger_error(string) {
        if(FireServLog.Level['Error'] >= this.level) {
            this.log(new LogMessage(this._name, 'ERROR', string),
              ['error_log', 'stdout']);
        }
    },

    access: function Logger_info(string) {
        if(FireServLog.Level['Access'] >= this.level) {
            this.log(new LogMessage(this._name, 'ACCESS', string), ['access_log']);
        }
    },

    debug: function Logger_warn(string) {
        if(FireServLog.Level['Debug'] >= this.level) {
            this.log(new LogMessage(this._name, 'DEBUG', string), ['stdout']);
        }
    },

    trace: function Logger_trace(string) {
        if(FireServLog.Level['Trace'] >= this.level) {
            this.log(new LogMessage(this._name, 'TRACE', string), ['console']);
        }
    },

    dump: function printObj(o, showMembers) {
        let s = '******************************\n';
        s += 'object => {\n';
        for (let i in o) {
            if (typeof(i) != 'string' ||
              (showMembers || (i.length > 0 && i[0] != '_'))) {
                s += '      ' + i + ': ' + o[i] + ',\n';
            }
        }
        s += '    };\n';
        s += '******************************\n';
        dump(s);
    }

};

/*
* LoggerRepository
*/

function LoggerRepository() {}

LoggerRepository.prototype = {

    _loggers: {},

    getLogger: function LogRep_getLogger(name) {
        if (!name) {
            name = this.getLogger.caller.name;
        }
        if (!(name in this._loggers)) {
            this._loggers[name] = new Logger(name, this);
        }
        return this._loggers[name];
    }

};

/*
* Formatters
* These massage a LogMessage into whatever output is desired
* Only the BasicFormatter is currently implemented
*/

// Abstract formatter
function Formatter() {}

Formatter.prototype = {
    format: function Formatter_format(message) {}
};

function BasicFormatter(dateFormat) {
    if (dateFormat) {
        this.dateFormat = dateFormat;
    }
}

BasicFormatter.prototype = {

    __proto__: Formatter.prototype,

    _dateFormat: null,

    get dateFormat() {
        if (!this._dateFormat) {
            this._dateFormat = '%Y-%m-%d %H:%M:%S';
        }
        return this._dateFormat;
    },

    set dateFormat(format) {
        this._dateFormat = format;
    },

    format: function BF_format(message) {
        // Pad a string to a certain length (20) with a character (space)
        let pad = function BF__pad(str, len, chr) str +
          new Array(Math.max((len || 20) - str.length + 1, 0)).join(chr || ' ');

        // Generate a date string because toLocaleString doesn't work XXX 514803
        let z = function(n) n < 10 ? '0' + n : n;
        let d = new Date(message.time);
        let dateStr = [d.getFullYear(), '-', z(d.getMonth() + 1), '-',
          z(d.getDate()), ' ', z(d.getHours()), ':', z(d.getMinutes()), ':',
          z(d.getSeconds())].join('');
        return dateStr + '\t' + pad(message.loggerName) +
          ' ' + message.level + '\t' + message.message + '\n';
    }
};


function RawFormatter(dateFormat) {}

RawFormatter.prototype = {

    __proto__: Formatter.prototype,

    format: function BF_format(message) {
        return message.message + '\n';
    }

};

/*
* Appenders
* These can be attached to Loggers to log to different places
* Simply subclass and override doAppend to implement a new one
*/

function Appender(formatter) {
    this._name = 'Appender';
    this._formatter = formatter ? formatter : new BasicFormatter();
}

Appender.prototype = {

    append: function App_append(message) {
        this.doAppend(this._formatter.format(message));
    },

    toString: function App_toString() {
        return this._name + ' [level=' + this._level +
          ', formatter=' + this._formatter + ']';
    },

    doAppend: function App_doAppend(message) {}

};

/*
* DumpAppender
* Logs to standard out
*/

function DumpAppender(formatter) {
  this._name = 'DumpAppender';
  this._formatter = formatter ? formatter : new BasicFormatter();
}

DumpAppender.prototype = {

    __proto__: Appender.prototype,

    doAppend: function DApp_doAppend(message) {
        dump(message);
    }

};

/*
* ConsoleAppender
* Logs to the javascript console
*/

function ConsoleAppender(formatter) {
  this._formatter = formatter ? formatter : new BasicFormatter();
  this._name = 'ConsoleAppender';
}

ConsoleAppender.prototype = {

    __proto__: Appender.prototype,

    doAppend: function CApp_doAppend(message) {
        Cc['@mozilla.org/consoleservice;1'].
          getService(Ci.nsIConsoleService).logStringMessage(message);
    }

};

/*
* FileAppender
* Logs to a file
*/

function FileAppender(file, formatter) {
    this._name = 'FileAppender';
    this._file = file; // nsIFile
    this._formatter = formatter ? formatter : new BasicFormatter();
}

FileAppender.prototype = {

    __proto__: Appender.prototype,

    __fos: null,

    get _fos() {
        if (!this.__fos) {
            this.openStream();
        }
        return this.__fos;
    },

    openStream: function FApp_openStream() {
        try {
            let __fos = Cc['@mozilla.org/network/file-output-stream;1'].
              createInstance(Ci.nsIFileOutputStream);
            let flags = MODE_WRONLY | MODE_CREATE | MODE_APPEND;
            __fos.init(this._file, flags, PERMS_FILE, 0);

            this.__fos = Cc['@mozilla.org/intl/converter-output-stream;1']
              .createInstance(Ci.nsIConverterOutputStream);
            this.__fos.init(__fos, 'UTF-8', 4096,
              Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
        } catch (e) {
            dump(new LoggerException(arguments.callee.name + ': ' + e));
        }
    },

    closeStream: function FApp_closeStream() {
        if (!this.__fos) {
            return;
        }
        try {
            this.__fos.close();
            this.__fos = null;
        } catch (e) {
            dump(new LoggerException(arguments.callee.name + ': ' + e));
        }
    },

    doAppend: function FApp_doAppend(message) {
        if (message === null || message.length <= 0) {
            return;
        }
        try {
            this._fos.writeString(message);
        } catch (e) {
            try {
                this._fos.writeString(message);
            } catch (e) {
                dump(new LoggerException(arguments.callee.name + ': ' + e));
            }
        }
    },

    clear: function FApp_clear() {
        this.closeStream();
        try {
            this._file.remove(false);
        } catch (e) {}
    }

};

/*
* RotatingFileAppender
* Similar to FileAppender, but rotates logs when they become too large
*/

function RotatingFileAppender(file, formatter, maxSize, maxBackups) {
    if (maxSize === undefined) {
        maxSize = ONE_MEGABYTE * 2;
    }

    if (maxBackups === undefined) {
        maxBackups = 0;
    }

    this._name = 'RotatingFileAppender';
    this._file = file; // nsIFile
    this._formatter = formatter ? formatter : new BasicFormatter();
    this._maxSize = maxSize;
    this._maxBackups = maxBackups;
}

RotatingFileAppender.prototype = {

    __proto__: FileAppender.prototype,

    doAppend: function RFApp_doAppend(message) {
        if (message === null || message.length <= 0) {
            return;
        }
        try {
            this.rotateLogs();
            FileAppender.prototype.doAppend.call(this, message);
        } catch (e) {
            dump(new LoggerException(arguments.callee.name + ': ' + e));
        }
    },

    rotateLogs: function RFApp_rotateLogs() {
        if (this._file.exists() &&
          this._file.fileSize < this._maxSize) {
            return;
        }

        this.closeStream();

        for (let i = this.maxBackups - 1; i > 0; i--) {
            let backup = this._file.parent.clone();
            backup.append(this._file.leafName + '.' + i);
            if (backup.exists()) {
                backup.moveTo(this._file.parent, this._file.leafName +
                  '.' + (i + 1));
            }
        }

        let cur = this._file.clone();
        if (cur.exists()) {
            cur.moveTo(cur.parent, cur.leafName + '.1');
        }
    }

};

function LoggerException(msg) {
    this.message = msg;
}

LoggerException.prototype = {

    toString: function() {
        return this.message + '\n';
    }

};
