<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en_US" lang="en_US">
<head>
    <title>FireServ sjs Session Management</title>
</head>
<body>
    <h1>FireServ sjs Session Management</h1>
    <p><?sjs
        if (typeof $_session !== 'undefined') {
            document.writeln('Here is your current session: ' + $_session);
            if (!$_session.firstVisit) {
                $_session.firstVisit = true;
                $_session.msg = 'Hello again!';
                document.writeln('Reload the page to see the content that was added.');
            }
            $_saveSession();
        } else {
           document.writeln('You must enable sessions on the "Server Settings" tab in the preferences dialog for this example to function.'); 
        }
    ?></p>
</body>
</html>
