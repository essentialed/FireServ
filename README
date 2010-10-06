# FireServ
An extension that brings a socket based webserver to the browser. Support for 
multiple parser backends, as well as MVC style framework support. Also includes 
sessions and caching.

* `htdocs` Located in your Firefox profile directory under fireserv/htdocs
* `logs` Located in your Firefox profile directory under fireserv/logs. 
Contains error_log and access_log for your FireServ instance.
* `data` Located in your Firefox profile directory under fireserv/data. 
Contains sqlite databases.

## Sessions
Per-user sessions are supported. Sessions are stored in a local sqlite 
database. Garbage collection is currently triggered randomly, but runs 
approximately once every 20 new sessions to prevent the sessions db from 
growing indefinately.

Sessions can be configured through the "Server Settings" tab in the Preferences 
dialog.

If auto-save is not enabled for sessions, they must be saved using 
$_sessionSave() in your sjs script.

See examples/sessions.sjs

## Caching
Static files are cached for 30 days by default. Timestamp based etag and 
Cache-Control headers are used to manage caching.

### Parsers
Currently includes an sjs parser. This is a very basic parser with only two 
publicly exported methods. document.write and document.writeln. If sessions are 
enabled, a global sessions object is available through $_session.

See examples/index.sjs
To use this as the default index page, copy into your htdocs directory, and 
change your directory index to index.sjs on the "Server Settings" tab in the 
preferences dialog.

## Controllers
There is a built-in example controller that emits a basic "Hello World" json 
document. This can be viewed via http://localhost:8080/jsonrpc/index

## Models
This is where models are place. No examples currently.

## Data
This is where static data can be stored. No examples currently.
