const Ci = Components.interfaces;
const Cc = Components.classes;
const Cu = Components.utils;

Cu.import('resource://fireserv/lib/log.js');
Cu.import('resource://fireserv/lib/fireserv.js');

var FireServOptions = {

    _logger: null,
    _bundle: null,
    _parserList: null,
    _controllerList: null,
    _mimeTypeList: null,
    _restart: false,
    _enabled: null,
    _debug: null,
    _port: null,
    _address: null,
    _directoryIndex: null,
    _autoIndex: null,
    _sessions: null,
    _sessionsAutoSave: null,
    _expires: null,
    _htdocs: null,
    _log: null,
    _data: null,
    _parsers: null,
    _controllers: null,
    _mimetypes: null,

    init: function() {
        this._bundle = document.getElementById('bundle_fireserv');
        this._parserList = document.getElementById('fsParserList');
        this._controllerList = document.getElementById('fsControllerList');
        this._mimeTypeList = document.getElementById('fsMimeTypeList');
        this._logger = FireServLog.repository.
          getLogger('FireServOptions');
        this._logger.level = FireServ.level;
        this._enabled = FireServ.getPref('enabled');
        this._debug = FireServ.getPref('debug');
        this._port = FireServ.getPref('port');
        this._address = FireServ.getPref('address');
        this._directoryIndex = FireServ.getPref('directoryIndex');
        this._autoIndex = FireServ.getPref('autoIndex');
        this._sessions = FireServ.getPref('sessions');
        this._sessionsAutoSave = FireServ.getPref('sessions.autoSave');
        this._expires = FireServ.getPref('expires');
        this._htdocs = FireServ.getPref('htdocs');
        this._log = FireServ.getPref('log');
        this._data = FireServ.getPref('data');
        this._parsers = FireServ.getPref('parsers');
        this._controllers = FireServ.getPref('controllers');
        this._mimetypes = FireServ.getPref('mimetypes');

        document.getElementById('fsTitle').value =
          'FireServ ' + FireServ.VERSION;
        document.getElementById('fireservEnabled').checked = this._enabled;
        document.getElementById('fireservDebug').checked = this._debug;
        document.getElementById('fireservPort').value = this._port;
        document.getElementById('fireservAddress').value = this._address;
        document.getElementById('fireservDirectoryIndex').value =
          this._directoryIndex;
        document.getElementById('fireservAutoIndex').checked = this._autoIndex;
        document.getElementById('fireservSessions').checked = this._sessions;
        document.getElementById('fireservSessionsAutoSave').checked =
          this._sessionsAutoSave;
        document.getElementById('fireservExpires').value = this._expires;
        document.getElementById('fireservHtdocs').value = this._htdocs;
        document.getElementById('fireservLog').value = this._log;
        document.getElementById('fireservData').value = this._data;
        this.populateParsers();
        this.populateControllers();
        this.populateMimeTypes();
        this._logger.trace('init');
    },

    uninit: function() {
        window.removeEventListener('load', function() {
          FireServOptions.init(); }, false);
        window.removeEventListener('unload', function() {
          FireServOptions.uninit(); }, false);
    },

    doAccept: function() {
        let enabled = document.getElementById('fireservEnabled').checked;
        if (enabled !== this._enabled) {
            FireServ.setPref('enabled', enabled);
        }
        let debug = document.getElementById('fireservDebug').checked;
        if (debug !== this._debug) {
            FireServ.setPref('debug', debug);
        }
        let port = parseInt(document.getElementById('fireservPort').value, 10);
        if (port !== this._port) {
            FireServ.setPref('port', port);
        }
        let address = document.getElementById('fireservAddress').value;
        if (address !== this._address) {
            FireServ.setPref('address', address);
        }
        let directoryIndex = document.getElementById('fireservDirectoryIndex').value;
        if (directoryIndex !== this._directoryIndex) {
            FireServ.setPref('directoryIndex', directoryIndex);
        }
        let autoIndex = document.getElementById('fireservAutoIndex').checked;
        if (autoIndex !== this._autoIndex) {
            FireServ.setPref('autoIndex', autoIndex);
        }
        let sessions = document.getElementById('fireservSessions').checked;
        if (sessions !== this._sessions) {
            FireServ.setPref('sessions', sessions);
        }
        let sessionsAutoSave = document.getElementById('fireservSessionsAutoSave').checked;
        if (sessionsAutoSave !== this._sessionsAutoSave) {
            FireServ.setPref('sessions.autoSave', sessionsAutoSave);
        }
        let expires = parseInt(document.getElementById('fireservExpires').value, 10);
        if (expires !== this._expires) {
            FireServ.setPref('expires', expires);
        }
        let htdocs = document.getElementById('fireservHtdocs').value;
        if (htdocs !== this._htdocs) {
            FireServ.setPref('htdocs', htdocs);
        }
        let log = document.getElementById('fireservLog').value;
        if (log !== this._log) {
            FireServ.setPref('log', log);
        }
        let data = document.getElementById('fireservData').value;
        if (data !== this._data) {
            FireServ.setPref('data', data);
        }
        let parsers = this.listToString(this._parserList);
        if (parsers !== this._parsers) {
            FireServ.setPref('parsers', parsers);
        }
        let controllers = this.listToString(this._controllerList);
        if (controllers !== this._controllers) {
            FireServ.setPref('controllers', controllers);
        }
        let mimetypes = this.listToString(this._mimeTypeList);
        if (mimetypes !== this._mimetypes) {
            FireServ.setPref('mimetypes', mimetypes);
        }
        if (this._restart) {
            let msg = this._bundle.getString('fireserv.select.dir.restart');
            alert(msg);
        }
        window.close();
    },

    doCancel: function() {
        window.close();
    },

    populateParsers: function() {
        let parsers = FireServ.parsers;
        for (let i = 0; i < parsers.length; i++) {
            if (parsers[i] !== '') {
                this._parserList.ensureElementIsVisible(
                  this._parserList.appendItem(parsers[i]));
            }
        }
    },

    populateControllers: function() {
        let controllers = FireServ.controllers;
        for (let i = 0; i < controllers.length; i++) {
            if (controllers[i] !== '') {
                this._controllerList.ensureElementIsVisible(
                  this._controllerList.appendItem(controllers[i]));
            }
        }
    },

    populateMimeTypes: function() {
        let mimetypes = FireServ.mimetypes;
        let item;
        for (let ext in mimetypes) {
            if (mimetypes[ext] !== '') {
                item = this._mimeTypeList.appendItem(ext, mimetypes[ext]);
                item.appendChild(document.createElement('listcell')).
                  setAttribute('label', mimetypes[ext]);
                this._mimeTypeList.ensureElementIsVisible(item);
            }
        }
    },

    enterAddParser: function(event) {
        if (event && event.type == 'keypress' &&
          event.keyCode != KeyEvent.DOM_VK_RETURN) {
            return;
        }
        event.preventDefault();
        this.addParser();
    },

    addParser: function() {
        let input = document.getElementById('fsParser');
        let label = input.value;
        this.addListItem(this._parserList, label);
        onInput(input, true);
    },

    parserSelected: function(input) {
        document.getElementById('fsRemoveParser').disabled =
          (input.selectedIndex == -1);
    },

    removeParser: function() {
        this.removeSelectedItem(this._parserList);
        document.getElementById('fsRemoveParser').disabled = true;
    },

    removeAllParsers: function() {
        let msg = this._bundle.getString('fireserv.delete.all.parsers');
        this.clearList(this._parserList, msg);
    },

    enterAddController: function(event) {
        if (event && event.type == 'keypress' &&
          event.keyCode != KeyEvent.DOM_VK_RETURN) {
            return;
        }
        event.preventDefault();
        this.addController();
    },

    addController: function() {
        let input = document.getElementById('fsController');
        let label = input.value;
        this.addListItem(this._controllerList, label);
        onInput(input, true);
    },

    controllerSelected: function(input) {
        document.getElementById('fsRemoveController').disabled =
          (input.selectedIndex == -1);
    },

    removeController: function() {
        this.removeSelectedItem(this._controllerList);
        document.getElementById('fsRemoveController').disabled = true;
    },

    removeAllControllers: function() {
        let msg = this._bundle.getString('fireserv.delete.all.controllers');
        this.clearList(this._controllerList, msg);
    },

    enterAddMimeType: function(event) {
        if (event && event.type == 'keypress' &&
          event.keyCode != KeyEvent.DOM_VK_RETURN) {
            return;
        }
        event.preventDefault();
        this.addMimeType();
    },

    addMimeType: function() {
        let input = document.getElementById('fsMimeType');
        let values = input.value.split('|');
        if (values[1]) {
            this.addListItem(this._mimeTypeList, values[0], values[1]);
            onInput(input, true);
        } else {
            alert(this._bundle.getString('fireserv.mimetype.format.error'));
        }
    },

    mimeTypeSelected: function(input) {
        document.getElementById('fsRemoveMimeType').disabled =
          (input.selectedIndex == -1);
    },

    removeMimeType: function() {
        this.removeSelectedItem(this._mimeTypeList);
        document.getElementById('fsRemoveMimeType').disabled = true;
    },

    removeAllMimeTypes: function() {
        let msg = this._bundle.getString('fireserv.delete.all.mimetypes');
        this.clearList(this._mimeTypeList, msg);
    },

    onInput: function(input, clear) {
        document.getElementById(input.id + 'Add').disabled = !input.value;
        if (clear) {
            input.value = '';
            input.focus();
        }
    },

    addListItem: function(list, label, value) {
        try {
        if (label.length === 0) {
            return false;
        }

        if (!this.hasItem(list, label)) {
            let numRows = list.getRowCount();
            let item = list.appendItem(label, value);
            if (value) {
                item.appendChild(document.createElement('listcell')).
                  setAttribute('label', value);
            }
            list.ensureElementIsVisible(item);
        }
        } catch (e) {
            this._logger.debug(e);
        }
    },

    hasItem: function(list, item) {
        let numRows = list.getRowCount();
        for (let i = 0; i < numRows; i++) {
            if (list.getItemAtIndex(i).label === item) {
                return true;
            }
        }
        return false;
    },

    clearList: function(list, msg) {
        if (confirm(msg)) {
            while (list.getRowCount() > 0) {
                list.removeItemAt(0);
            }
        }
    },

    removeSelectedItem: function(list) {
        let index = list.selectedIndex;
        if (index !== -1) {
            list.removeItemAt(index);
        }
    },

    listToString: function(list) {
        let numRows = list.getRowCount();
        let listItems = [];
        let item, label, value;
        for (let i = 0; i < numRows; i++) {
            item = list.getItemAtIndex(i);
            label = item.label;
            value = item.value;
            if (value !== 'undefined') {
                listItems.push(label + '|' + value);
            } else {
                listItems.push(label);
            }
        }
        return listItems.join(',');
    },

    picker: function(el) {
        let picker = Ci.nsIFilePicker;
        let fp = Cc["@mozilla.org/filepicker;1"].createInstance(picker);
        let title = this._bundle.getString('fireserv.select.dir');
        fp.init(window, title, picker.modeGetFolder);
        let res = fp.show();
        if (res == picker.returnOK){
            let dir = fp.file;
            if (dir.isDirectory()) {
                let field = document.getElementById(el);
                field.value = dir.path;
                this._restart = true;
            } else {
                let msg = this._bundle.getString('fireserv.select.dir.error');
                alert(msg);
            }
        }
    }

};
window.addEventListener('load', function() {
  FireServOptions.init(); }, false);
window.addEventListener('unload', function() {
  FireServOptions.uninit(); }, false);
