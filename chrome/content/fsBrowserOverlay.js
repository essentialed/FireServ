Components.utils.import('resource://fireserv/lib/log.js');
Components.utils.import('resource://fireserv/lib/fireserv.js');
Components.utils.import('resource://fireserv/lib/server.js');

FireServ.Chrome = {

    _logger: null,
    _prefs: null,
    _preferencesWindow: null,
    _bundle: null,

    init: function() {
        this._prefs = Cc['@mozilla.org/preferences-service;1'].
          getService(Ci.nsIPrefService).getBranch(FireServ.PREF_BRANCH);
        this._logger = FireServLog.repository.getLogger('FireServ.Chrome');
        this._logger.level = FireServ.level;
        this.register();
        this._bundle = Cc['@mozilla.org/intl/stringbundle;1'].
          getService(Ci.nsIStringBundleService).
          createBundle('chrome://fireserv/locale/fireserv.properties');

        this._logger.trace('init');
    },

    register: function() {
        this._prefs.QueryInterface(Ci.nsIPrefBranch2);
        this._prefs.addObserver('', this, false);
    },

    openPreferences: function() {
        window.openDialog('chrome://fireserv/content/fsPreferencesWindow.xul',
          'FireServOptions', 'chrome,titlebar,toolbar,centerscreen,resizable');
    },

    updateIconState: function() {
        let statusIcon = document.getElementById('fsStatusIcon');
        if (FireServ.Server.isStopped() === true) {
            statusIcon.removeAttribute('status');
            var statusText = this._bundle.
              GetStringFromName('fireserv.status.disabled.title');
        } else {
            statusIcon.setAttribute('status', 'on');
            var statusText = this._bundle.
              GetStringFromName('fireserv.status.enabled.title');
        }
        this.resetTooltip(statusText);
    },

    resetTooltip: function(statusText) {
        let url = 'http://' + FireServ.getPref('address') + ':' +
          FireServ.getPref('port') + '/';
        let tooltip = 'FireServ ' + FireServ.VERSION + '\n';
        tooltip += 'Status: ' + statusText + '\n';
        tooltip += 'Server: ' + url;
        document.getElementById('fsStatusBar').
          setAttribute('tooltiptext', tooltip);
    },

    goHome: function() {
        let url = FireServ.getHomeUrl();
        window.content.document.location.href = url;
    },

    observe: function(aSubject, aTopic, aData) {
        switch (aTopic) {
            case 'nsPref:changed':
                switch (aData) {
                    case 'enabled':
                        if (FireServ.getPref(aData) === true) {
                            FireServ.Server.start();
                        } else {
                            FireServ.Server.stop();
                        }
                        break;
                    case 'parsers':
                    case 'controllers':
                    case 'mimetypes':
                    case 'address':
                    case 'port':
                        FireServ.Server.restart();
                        break;
                    case 'debug':
                        FireServ.debug = FireServ.getPref(aData);
                        if (FireServ.getPref(aData) === true) {
                            FireServ.level = FireServLog.Level['Debug'];
                        } else {
                            FireServ.level = FireServLog.Level['Access'];
                        }
                        this._logger.level = FireServ.level;
                        FireServ._logger.level = FireServ.level;
                        FireServ.Server._logger.level = FireServ.level;
                        break;
                    case 'directoryIndex':
                        FireServ.Server.directoryIndex =
                          FireServ.getPref(aData);
                        break;
                    case 'autoIndex':
                        FireServ.Server.autoIndex = FireServ.getPref(aData);
                        break;
                    case 'sessions':
                        FireServ.Server.sessions = FireServ.getPref(aData);
                        break;
                    case 'sessions.autoSave':
                        FireServ.Server.sessions.autoSave =
                          FireServ.getPref(aData);
                        break;
                    case 'expires':
                        FireServ.Server.expires = FireServ.getPref(aData);
                        break;
                    default:
                        break;
                }
                break;
            default:
                break;
        }
    }

};

(function() {
  FireServ.Chrome.init();
}).apply(FireServ.Chrome);

window.addEventListener('load', function() { FireServ.setTimeout(
  function() { FireServ.Chrome.updateIconState(); }, 2000); }, false);
