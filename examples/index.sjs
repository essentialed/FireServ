<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en_US" lang="en_US">
<head>
    <title>FireServ sjs Example</title>
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8"/>
</head>
    <body>
        <?sjs document.write('<h1>Here is an example sjs script.</h1>'); ?>
        <?sjs
            document.writeln('<p>Here is some content that breaks lines in source using document.writeln().</p>');
            document.writeln('<p>Here is more proof!</p>');
        ?>
    </body>
</html>
