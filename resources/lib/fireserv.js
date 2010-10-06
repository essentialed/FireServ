const EXPORTED_SYMBOLS = ['FireServ'];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Components.utils.import('resource://fireserv/lib/log.js');

let FireServ = {

    get PREF_BRANCH() { return 'extensions.fireserv.'; },
    get OS_WINDOWS() { return 0; },
    get OS_WINDOWS_VISTA() { return 1; },
    get OS_MAC() { return 2; },
    get OS_LINUX() { return 3; },
    get OS_OTHER() { return 4; },
    get EXTENSION_UUID() { return 'fireserv@wendallcada.com'; },
    get VERSION() {
        if (this._version === null) {
            if ('nsIExtensionManager' in Ci) {
                let extMan = Cc['@mozilla.org/extensions/manager;1'].
                  getService(Ci.nsIExtensionManager);
                this._version =
                  extMan.getItemForID(this.EXTENSION_UUID).version;
            } else {
                Cu.import('resource://gre/modules/AddonManager.jsm');
                AddonManager.getAddonByID(this.EXTENSION_UUID, function(addon) {
                    FireServ._version = addon.version;
                });
            }
        }
        return this._version;
    },
    get mimetypes() {
        let mimes = this.getPref('mimetypes').split(',');
        let mimetypes = {};
        for (let i in mimes) {
            mimetype = mimes[i].split('|');
            mimetypes[mimetype[0]] = mimetype[1];
        }
        return mimetypes;
    },
    get parsers() { return this.getPref('parsers').split(','); },
    get controllers() { return this.getPref('controllers').split(','); },

    startupDone: false,
    autoplayDone: false,
    level: FireServLog.Level['Access'],
    debug: null,
    _version: null,
    _enabled: null,
    _timers: [],
    _application: null,
    _logger: null,

    init: function FireServ_init() {
        this._enabled = this.getPref('enabled');
        this.debug = this.getPref('debug');

        this._logger = FireServLog.repository.getLogger('FireServ');
        if (this.debug === true) {
            this.level = FireServLog.Level['Debug'];
            this._logger.level = this.level;
        }
        this._logger.debug('init');
    },

    get Application() {
        if (null == this._application) {
            if (null != Cc['@mozilla.org/fuel/application;1']) {
                this._application =
                  Cc['@mozilla.org/fuel/application;1'].
                  getService(Ci.fuelIApplication);
            } else {
                this._logger.fatal(
                  'get Application: Unable to load FUEL or equivalent.');
            }
        }

        return this._application;
    },

    getPref: function FireServ_getPref(pref) {
        return this.Application.prefs.get(this.PREF_BRANCH + pref).value;
    },

    setPref: function FireServ_setPref(pref, value) {
        try {
            this.Application.prefs.setValue(this.PREF_BRANCH + pref, value);
        } catch (e) {
            this._logger.error(arguments.callee.name + e);
        }
    },

    getHomeUrl: function FireServ_getHomeUrl() {
        return 'http://' + this.getPref('address') + ':' +
          this.getPref('port') + '/';
    },

    setTimeout: function FireServ_setTimeout(aFunction, aDelay) {
        this._logger.trace('setTimeout');
        try {
            let timer = Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer);
            timer.initWithCallback({ notify: aFunction }, aDelay,
              Ci.nsITimer.TYPE_ONE_SHOT);
            this._timers.push(timer);
        } catch (e) {
            this._logger.debug(arguments.callee.name + e);
        }
    }

};

(function() {
    this.init();
}).apply(FireServ);
