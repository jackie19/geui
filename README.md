geui
==========



Install
-------

First make sure you have installed the latest version of [node.js](http://nodejs.org/)
(You may need to restart your computer after this step).

From NPM for use as a command line app:

    npm install geui -g

From NPM for programmatic use:

    npm install geui
    

Usage
-----    

    geui [options]
   

The available options are:

```
-v            Print version number and exit. [boolean]
-c,--config   config file. [string]
-w,--watch      监听 less 文件
-p,--path     指定工作目录

```

For example:

```
geui -c geuifile.js
```

pleasy check /demo/geuifile.js for more details.