const EXPORTED_SYMBOLS = ['FireServDB'];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import('resource://fireserv/lib/log.js');

let FireServDB = {

    get Database() { return Database; },

    get Records() { return Records; },

    get storageService() {
        return Cc['@mozilla.org/storage/service;1'].
          getService(Ci.mozIStorageService);
    }

};

function Database(file) {
    this._open(file);
}

Database.prototype = {

    get storageService() {
        return Cc['@mozilla.org/storage/service;1'].
          getService(Ci.mozIStorageService);
    },

    _conn: null,

    _open: function Database_open(nsIFile) {
        try {
            this._conn = this.storageService.openDatabase(nsIFile);
        } catch (e) {
            try {
                this._conn = this.storageService.openUnsharedDatabase(nsIFile);
            } catch (e) {
                throw new DatabaseException(arguments.callee.name + ': ' + e);
            }
        }
    },

    tableExists: function Database_tableExists(table) {
        return this._conn.tableExists(table);
    },

    executeTransaction: function Database_executeTransaction(queries) {
        if (this._conn.transactionInProgress) {
            this._conn.commitTransaction();
        }
        if (!this._conn.transactionInProgress) {
            this._conn.beginTransaction();
        }

        for (let i = 0; i < queries.length; i++) {
            try {
                var statement = this._conn.createStatement(queries[i]);
                statement.execute();
            } catch (e) {
                if (this._conn.transactionInProgress) {
                    this._conn.rollbackTransaction();
                }
                throw new DatabaseException(arguments.callee.name + ': '
                  + ' ' + queries[i]);
            } finally {
                if(statement) {
                    statement.reset();
                }
            }
        }
        if (this._conn.transactionInProgress) {
            this._conn.commitTransaction();
        }
    },

    selectQuery: function Database_selectQuery(sQuery) {
        var rows = [];
        var row = {};
        function clone(obj) {
            let tmp = {};
            for (let k in obj) {
                tmp[k] = obj[k];
            }
            return tmp;
        }

        try {
            var statement = this._conn.createStatement(sQuery);
        } catch (e) {
            throw new DatabaseException(arguments.callee.name + ': ' +
              e + ' ' + sQuery);
        }

        try {
            var cols = statement.columnCount;
            for (let i = 0; i < cols; i++) {
                row[i] = statement.getColumnName(i);
            }
        } catch (e) {
            throw new DatabaseException(arguments.callee.name + ': ' + e);
        }

        try {
            let colData, rowData;
            while (statement.executeStep()) {
                rowData = clone(row);
                for (let j = 0; j < cols; j++) {
                    iType = statement.getTypeOfIndex(j);
                    let colName = rowData[j];
                    delete rowData[j];
                    switch (iType) {
                        case statement.VALUE_TYPE_NULL:
                            colData = null;
                            break;
                        case statement.VALUE_TYPE_INTEGER:
                            colData = statement.getInt64(j);
                            break;
                        case statement.VALUE_TYPE_FLOAT:
                            colData = statement.getDouble(j);
                            break;
                        case statement.VALUE_TYPE_TEXT:
                            colData = statement.getString(j);
                            break;
                        default:
                            colData = '<unknown>';
                    }
                    rowData[colName] = colData;
                }
                rows.push(rowData);
            }
        } catch (e) {
            throw new DatabaseException(arguments.callee.name + ': ' + e);
        } finally {
            if(statement) {
                statement.reset();
            }
        }
        return rows;
    },

    close: function() {
        if (this._conn !== null) {
            try {
                this._conn.close();
            } catch (e) {}
        }
        this._conn = null;
    }

};

function DatabaseException(msg) {
    this.message = msg;
}

DatabaseException.prototype = {

    toString: function() {
        return this.message + '';
    }

};
