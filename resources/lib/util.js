const EXPORTED_SYMBOLS = ['FireServUtil'];

let FireServUtil = {

    get HttpError() { return HttpError; },

    get HTTP_400() { return new this.HttpError(400, 'Bad Request'); },

    get HTTP_401() { return new this.HttpError(401, 'Unauthorized'); },

    get HTTP_402() { return new this.HttpError(402, 'Payment Required'); },

    get HTTP_403() { return new this.HttpError(403, 'Forbidden'); },

    get HTTP_404() { return new this.HttpError(404, 'Not Found'); },

    get HTTP_405() { return new this.HttpError(405, 'Method Not Allowed'); },

    get HTTP_406() { return new this.HttpError(406, 'Not Acceptable'); },

    get HTTP_407() { return new this.HttpError(407, 'Proxy Authentication Required'); },

    get HTTP_408() { return new this.HttpError(408, 'Request Timeout'); },

    get HTTP_409() { return new this.HttpError(409, 'Conflict'); },

    get HTTP_410() { return new this.HttpError(410, 'Gone'); },

    get HTTP_411() { return new this.HttpError(411, 'Length Required'); },

    get HTTP_412() { return new this.HttpError(412, 'Precondition Failed'); },

    get HTTP_413() { return new this.HttpError(413, 'Request Entity Too Large'); },

    get HTTP_414() { return new this.HttpError(414, 'Request-URI Too Long'); },

    get HTTP_415() { return new this.HttpError(415, 'Unsupported Media Type'); },

    get HTTP_417() { return new this.HttpError(417, 'Expectation Failed'); },

    get HTTP_500() { return new this.HttpError(500, 'Internal Server Error'); },

    get HTTP_501() { return new this.HttpError(501, 'Not Implemented'); },

    get HTTP_502() { return new this.HttpError(502, 'Bad Gateway'); },

    get HTTP_503() { return new this.HttpError(503, 'Service Unavailable'); },

    get HTTP_504() { return new this.HttpError(504, 'Gateway Timeout'); },

    get HTTP_505() { return new this.HttpError(505, 'HTTP Version Not Supported'); },

    get JsonError() { return JsonError; },

    get JsonDoc() { return JsonDoc; },

    abort: function FireServUtil_abort(code) {
        return this['HTTP_' + code];
    },

    redirect: function FireServUtil_redirect(response, location) {
        response.setStatusLine('1.1', 302, 'Moved Temporarily');
        response.setHeader('Location', location, false);
    },

    time: {
        time: function() {
            return (new Date()).getTime() / 1000;
        }
    },

    isFunction: function(obj) {
        return toString.call(obj) === '[object Function]';
    },

    isArray: function(obj) {
        return toString.call(obj) === '[object Array]';
    },

    isPlainObject: function(obj) {
        // Must be an Object.
        // Because of IE, we also have to check the presence of the constructor property.
        // Make sure that DOM nodes and window objects don't pass through, as well
        if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval) {
            return false;
        }
        
        // Not own constructor property must be Object
        if (obj.constructor && !hasOwnProperty.call(obj, 'constructor')
          && !hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf')) {
            return false;
        }
        
        // Own properties are enumerated firstly, so to speed up,
        // if last one is own, then all properties are own.

        var key;
        for (key in obj) {}
        
        return key === undefined || hasOwnProperty.call(obj, key);
    },

    extend: function FireServUtil_extend() {
        // copy reference to target object
        var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options, name, src, copy;

        // Handle a deep copy situation
        if (typeof target === 'boolean') {
            deep = target;
            target = arguments[1] || {};
            // skip the boolean and the target
            i = 2;
        }

        // Handle case when target is a string or something (possible in deep copy)
        if (typeof target !== 'object' && !this.isFunction(target)) {
            target = {};
        }

        // extend jQuery itself if only one argument is passed
        if ( length === i ) {
            target = this;
            --i;
        }

        for ( ; i < length; i++ ) {
            // Only deal with non-null/undefined values
            if ((options = arguments[ i ]) != null) {
                // Extend the base object
                for (name in options) {
                    src = target[ name ];
                    copy = options[ name ];

                    // Prevent never-ending loop
                    if (target === copy) {
                        continue;
                    }

                    // Recurse if we're merging object literal values or arrays
                    if (deep && copy && (this.isPlainObject(copy) || this.isArray(copy))) {
                        var clone = src && (this.isPlainObject(src) || this.isArray(src) ) ? src
                            : this.isArray(copy) ? [] : {};

                        // Never move original objects, clone them
                        target[ name ] = this.extend(deep, clone, copy);

                    // Don't bring in undefined values
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }

        // Return the modified object
        return target;
    }

};

function HttpError(code, description) {
    this.code = code;
    this.description = description;
}

HttpError.prototype = {
    toString: function() {
        return this.code + ' ' + this.description;
    }
};

function JsonError(code) {
    this.code = code;
    let descriptions = {
        'json': 'Not a JSON encodable string.',
        'essay': 'Please enter an essay, or close the exam window.',
        '400': 'Bad Request',
        '401': 'Unauthorized',
        '402': 'Payment Required',
        '403': 'Forbidden',
        '404': 'Not Found',
        '405': 'Method Not Allowed',
        '409': 'Conflict',
        '500': 'Internal Server Error'
    };
    this.description = descriptions[code];
}

JsonError.prototype = {

    toString: function() {
        if (this.error) {
            return JSON.stringify({
                status: this.code,
                error: this.error
            });
        } else {
            return JSON.stringify({
                status: this.code,
                msg: this.description
            });
        }
    }

};

function JsonDoc() {}

JsonDoc.prototype = {

    toString: function() {
        return JSON.stringify(this);
    }

};
