const EXPORTED_SYMBOLS = ['FireServIO'];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

let FireServIO = {

    get Ds() {
        return Cc['@mozilla.org/file/directory_service;1'].
          getService(Ci.nsIProperties);
    },

    get ProfD() { return this.Ds.get('ProfD', Ci.nsIFile); },
    get DefProfRt() { return this.Ds.get('DefProfRt', Ci.nsIFile); },
    get Home() { return this.Ds.get('Home', Ci.nsIFile); },
    get TmpD() { return this.Ds.get('TmpD', Ci.nsIFile); },
    get ProfLD() { return this.Ds.get('ProfLD', Ci.nsIFile); },
    get resourceApp() { return this.Ds.get('resource:app', Ci.nsIFile); },
    get Desk() { return this.Ds.get('Desk', Ci.nsIFile); },
    get Progs() { return this.Ds.get('Progs', Ci.nsIFile); },

    get extDir() {
        let profDir = this.ProfD;
        profDir.append('extensions');
        profDir.append('fireserv@wendallcada.com');
        return profDir;
    },

    get appDir() { return this.createDir(this.ProfD, 'fireserv'); },

    getDir: function FireServIO_getDir(dir, create) {
        if (dir && typeof dir === 'string') {
            if (dir.indexOf('/') === 0 || dir.indexOf(':\\') === 1) {
                try {
                    return this.getDirFromPath(dir);
                } catch (e) {
                    throw e;
                }
            } else {
                var pathParts = dir.split(':/');
                var nsiFile;
                switch(pathParts[0]) {
                    case 'ProfD':
                        nsiFile = this.ProfD;
                        break;
                    case 'DefProfRt':
                        nsiFile = this.DefProfRt;
                        break;
                    case 'Home':
                        nsiFile = this.Home;
                        break;
                    case 'TmpD':
                        nsiFile = this.TmpD;
                        break;
                    case 'ProfLD':
                        nsiFile = this.ProfLD;
                        break;
                    case 'resource:app':
                        nsiFile = this.resourceApp;
                        break;
                    case 'Desk':
                        nsiFile = this.Desk;
                        break;
                    case 'Progs':
                        nsiFile = this.Progs;
                        break;
                    default:
                        break;
                }
                if (nsiFile) {
                    try {
                        return this.appendSubPath(nsiFile, pathParts[1], create);
                    } catch (e) {
                        throw e;
                    }
                } else {
                    throw new ioError(arguments.callee.name + 
                    ' Unable to parse path!');
                }
            }
        } else {
            throw new ioError(arguments.callee.name +
              ' "dir" parameter must be a string!');
        }
    },

    createDir: function FireServIO_createDir(nsiFile, dir) {
        try {
            nsiFile.append(dir);
            if (!nsiFile.exists() || !nsiFile.isDirectory()) {
                nsiFile.create(Ci.nsIFile.DIRECTORY_TYPE, 0774);
            }
            return nsiFile;
        } catch (e) {
            throw new ioError(arguments.callee.name + e);
        }
    },

    getDirFromPath: function FireServIO_getDirFromPath(path) {
        try {
            nsiFile = Cc["@mozilla.org/file/local;1"]
              .createInstance(Ci.nsILocalFile);
            nsiFile.initWithPath(path);
            return nsiFile;
        } catch (e) {
            throw new ioError(arguments.callee.name + e);
        }
    },

    appendSubPath: function FireServIO_appendSubPath(nsiFile, path, create) {
        if (path) {
            let subPath = path.split('/');
            for (let i = 0; i < subPath.length; i++) {
                if(subPath[i]) {
                    if (!create) {
                        nsiFile.append(subPath[i]);
                    } else {
                        nsiFile = this.createDir(nsiFile, subPath[i]);
                    }
                }
            }
        }
        return nsiFile;
    }

};

function ioError(msg) {
    this.msg
}

ioError.prototype = {

    toString: function() {
        return this.msg;
    }

}
