/**
 * 列出目录下的所有文件
 *
 * @author Zongmin Lei<leizongmin@gmail.com>
 */


var fs = require('fs');
var path = require('path');
var os = require('os');
var util = require('util');

// 默认并发线程数
var THREAD_NUM = os.cpus().length;

/**
 * 将数组中的文件名转换为完整路径
 *
 * @param {String} dir
 * @param {Array} files
 * @return {Array}
 */
function fullPath(dir, files) {
    return files.map(function (f) {
        return path.join(dir, f);
    });
}

/**
 * 遍历目录里面的所有文件
 *
 * @param {String} dir        目录名
 * @param {Number} thread_num 并发线程数
 * @param {Function} findOne  找到一个文件时的回调
 *                            格式：function (filename, stats, next)
 * @param {Function} callback 格式：function (err)
 */
function eachFile(dir, thread_num, findOne, callback) {
    fs.stat(dir, function (err, stats) {
        if (err) return callback(err);

        // findOne回调
        findOne(dir, stats, function () {

            if (stats.isFile()) {
                // 如果为文件，则表示终结
                return callback(null);

            } else if (stats.isDirectory()) {
                // 如果为目录，则接续列出该目录下的所有文件
                fs.readdir(dir, function (err, files) {
                    if (err) return callback(err);

                    files = fullPath(dir, files);

                    // 启动多个并发线程
                    var finish = 0;
                    var threadFinish = function () {
                        finish++;
                        if (finish >= thread_num) return callback(null);
                    };
                    var next = function () {
                        var f = files.pop();
                        if (!f) return threadFinish();
                        eachFile(f, thread_num, findOne, function (err, s) {
                            if (err) return callback(err);
                            next();
                        });
                    };
                    for (var i = 0; i < thread_num; i++) {
                        next();
                    }
                });

            } else {
                // 未知文件类型
                callback(null);
            }
        });
    });
};

/**
 * 遍历目录里面的所有文件 (同步)
 *
 * @param {String} dir        目录名
 * @param {Function} findOne  找到一个文件时的回调
 *                            格式：function (filename, stats, next)
 */
function eachFileSync(dir, findOne) {
    var stats = fs.statSync(dir);
    findOne(dir, stats);

    // 遍历子目录
    if (stats.isDirectory()) {
        var files = fullPath(dir, fs.readdirSync(dir));

        files.forEach(function (f) {
            eachFileSync(f, findOne);
        });
    }
}

/**
 * 遍历目录下的所有文件
 *
 * @param {String} dir
 * @param {Number} thread_num  (optional)
 * @param {Function} findOne
 * @param {Function} callback
 */
exports.each = function (dir) {
    if (arguments.length < 3) return callback(new TypeError('Bad arguments number'));
    if (arguments.length === 3) {
        var thread_num = THREAD_NUM;
        var findOne = arguments[1];
        var callback = arguments[2];
    } else {
        var thread_num = arguments[1];
        var findOne = arguments[2];
        var callback = arguments[3];
    }

    if (!(thread_num > 0)) {
        return callback(new TypeError('The argument "thread_num" must be number and greater than 0'));
    }
    if (typeof findOne !== 'function') {
        return callback(new TypeError('The argument "findOne" must be a function'));
    }
    if (typeof callback !== 'function') {
        return callback(new TypeError('The argument "callback" must be a function'));
    }

    eachFile(path.resolve(dir), thread_num, findOne, callback);
};

/**
 * 遍历目录下的所有文件 (同步)
 *
 * @param {String} dir
 * @param {Function} findOne
 */
exports.eachSync = function (dir, findOne) {
    if (arguments.length < 2) throw new TypeError('Bad arguments number');

    if (typeof findOne !== 'function') {
        throw new TypeError('The argument "findOne" must be a function');
    }

    eachFileSync(path.resolve(dir), findOne);
};

/**
 * 列出目录下所有文件
 *
 * @param {String} dir
 * @param {Number} thread_num  (optional)
 * @param {Function} callback
 */
exports.read = function (dir) {
    if (arguments.length < 2) return callback(new TypeError('Bad arguments number'));
    if (arguments.length === 2) {
        var thread_num = THREAD_NUM;
        var callback = arguments[1];
    } else {
        var thread_num = arguments[1];
        var callback = arguments[2];
    }

    if (!(thread_num > 0)) {
        return callback(new TypeError('The argument "thread_num" must be number and greater than 0'));
    }
    if (typeof callback !== 'function') {
        return callback(new TypeError('The argument "callback" must be a function'));
    }

    var files = [];
    eachFile(path.resolve(dir), thread_num, function (filename, stats, next) {
        files.push(filename);
        next();
    }, function (err) {
        callback(err, files);
    });
};

/**
 * 列出目录下所有文件 (同步)
 *
 * @param {String} dir
 * @return {Array}
 */
exports.readSync = function (dir) {
    var files = [];
    eachFileSync(path.resolve(dir), function (filename, stats) {
        files.push(filename);
    });
    return files;
};

/*
 *
 var rd = require('rd');

 // 异步列出目录下的所有文件
 rd.read('/tmp', function (err, files) {
 if (err) throw err;
 // files是一个数组，里面是目录/tmp目录下的所有文件（包括子目录）
 });

 // 同步列出目录下的所有文件
 var files = rd.readSync('/tmp');

 // 异步遍历目录下的所有文件
 rd.each('/tmp', function (f, s, next) {
 // 每找到一个文件都会调用一次此函数
 // 参数s是通过 fs.stat() 获取到的文件属性值
 console.log('file: %s', f);
 // 必须调用next()才能继续
 next();
 }, function (err) {
 if (err) throw err;
 // 完成
 });

 // 同步遍历目录下的所有文件
 rd.eachSync('/tmp', function (f, s) {
 // 每找到一个文件都会调用一次此函数
 // 参数s是通过 fs.stat() 获取到的文件属性值
 console.log('file: %s', f);
 });
 * */


/**
 * 创建多级目录
 * @param  {String} dirpath 路径
 * @param  {String} mode    模式
 */
var mkdirsSync = function (dirpath, mode) {
    // console.log(dirpath);
    dirpath = path.resolve(dirpath);
    // console.log(dirpath);
    if (fs.existsSync(dirpath)) {
        return;
    }
    var dirs = dirpath.split(path.sep);
    // console.log(dirs);
    var dir = '';
    for (var i = 0; i < dirs.length; i++) {
        dir += path.join(dirs[i], path.sep);
        // console.log(dir);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, mode);
        }
    }
};

/**
 * 递归删除目录
 * @param  {String} dirpath 路径
 */
var rmdirsSync = function (dirpath) {
    dirpath = path.resolve(dirpath);
    // console.log(dirpath);
    if (!fs.existsSync(dirpath)) {
        return;
    }
    var dirs = fs.readdirSync(dirpath);
    // console.log(dirs);
    var dir, len = dirs.length;
    if (len === 0) {
        fs.rmdirSync(dirpath);
        return;
    }
    for (var i = 0; i < len; i++) {
        dir = path.join(dirpath, dirs[i]);
        // console.log(dir);
        if (fs.statSync(dir).isDirectory()) {
            rmdirsSync(dir);
            // fs.rmdirSync(dir);
        } else {
            fs.unlinkSync(dir);
        }
    }
    fs.rmdirSync(dirpath);
}

/**
 * 列出指定目录的所有文件
 * @param  {String} dirpath      路径
 * @param  {String} type 需要读取的文件的格式, 多类型用","分割, 如: "css,js,html"
 * @param  {Boolean} recursive 是否递归
 * @return {Array}  返回文件名数组
 */
var listFilesSync = function (dirpath, type, recursive) {
    var result = [];
    var subdir = arguments[3] || '';
    if (type) {
        type = type.toLowerCase().replace(/\s+/g, '');
    }
    var typeList = type ? type.split(',') : false;
    dirpath = path.resolve(dirpath);
    var list = fs.readdirSync(dirpath);
    var ext, filepath, stat, reldir;
    //把文件按文件名排序
    list.sort();
    for (var i = 0, name; name = list[i]; i++) {
        filepath = path.join(dirpath, name);
        reldir = path.join(subdir, name);
        stat = fs.statSync(filepath);
        if (stat.isFile()) {
            ext = path.extname(name).substr(1);
            if (typeList && typeList.indexOf(ext) === -1) {
                continue;
            }
            result.push(reldir);
        } else if (stat.isDirectory() && recursive) {
            result = result.concat(listFilesSync(filepath, type, recursive, reldir));
        }
    }
    ;
    return result;
}

/**
 * 拷贝文件到指定目录或指定名字
 * 注意: 该方法只能用于拷贝文本类型的文件, 拷贝图片会损失, 请用 copyFile
 * @param  {String} src
 * @param  {String} dst
 * @param  {Boolean} overwrite
 */
var copyFileSync = function (src, dst, overwrite) {
    var stat, input, output;
    // console.log('coping ' + src);
    if (!fs.existsSync(src)) {
        throw 'File ' + src + ' is not exists.';
    }
    //创建目标目录
    mkdirsSync(path.dirname(dst));

    //如果文件不存在, statSync 会出错
    var dstExists = fs.existsSync(dst);
    if (dstExists) {
        stat = fs.statSync(dst);
        if (stat.isDirectory()) {
            dst = path.join(dst, path.basename(src));
            if (fs.existsSync(dst)) {//新文件不存在时, 就不用重新判断了
                stat = fs.statSync(dst);
            }
        }
        if (stat.isFile() && !overwrite) {
            //是个文件且不能覆盖
            throw 'File ' + dst + ' is exists.';
        }
    } else {
        if (isDirectoryPath(dst)) {
            // dst 是个目录
            dst = path.join(dst, path.basename(src));
        }
    }
    //直接读取文件内容再写, 会导致非文本格式的文件损坏
    input = fs.readFileSync(src);
    writeFileSync(dst, input, overwrite);
};

/**
 * 拷贝文件到指定目录或指定名字
 * @param  {String} src
 * @param  {String} dst
 * @param  {Boolean} overwrite
 * @param  {Function} callback
 */
var copyFile = function (src, dst, overwrite, callback) {
    var stat, input, output;
    // console.log('coping ', src, 'to', dst);
    if (!fs.existsSync(src)) {
        throw 'File ' + src + ' is not exists.';
    }
    //创建目标目录
    mkdirsSync(path.dirname(dst));

    //如果文件不存在, statSync 会出错
    var dstExists = fs.existsSync(dst);
    if (dstExists) {
        stat = fs.statSync(dst);
        if (stat.isDirectory()) {
            dst = path.join(dst, path.basename(src));
            if (fs.existsSync(dst)) {//新文件不存在时, 就不用重新判断了
                stat = fs.statSync(dst);
            }
        }
        if (stat.isFile()) {
            if (!overwrite) {
                //是个文件且不能覆盖
                throw 'File ' + dst + ' is exists.';
            } else {
                fs.unlinkSync(dst);
                // console.log('--删除 ' , dst);
            }
        }
    } else {
        if (isDirectoryPath(dst)) {
            // dst 是个目录
            dst = path.join(dst, path.basename(src));
        }
    }
    // 这种异步调用会有并发量问题，文件数目多了之后会出现以下错误
    // Error: EMFILE, too many open files
    input = fs.createReadStream(src);
    output = fs.createWriteStream(dst);
    input.pipe(output);
    output.on('close', function (err) {
        callback && callback();
    });
}

/**
 * 写文件, 自动创建不存在的目录
 * @param  {String} filenName
 * @param  {String} content
 * @param  {String} overwrite
 */
var writeFileSync = function (filenName, content, overwrite) {
    mkdirsSync(path.dirname(filenName));
    if (fs.existsSync(filenName)) {
        if (!overwrite) {
            throw 'File ' + filenName + ' is exists.';
        } else {
            fs.unlinkSync(filenName);
        }
    }
    fs.writeFileSync(filenName, content);
}

/**
 * 判断传入的 dir是否是个目录，仅从路径名字判断
 * @param  {String}  dir
 * @return {Boolean}
 */
var isDirectoryPath = function (dir) {
    var index = dir.lastIndexOf(path.sep);
    return index + path.sep.length == dir.length;
}

/**
 * ant 风格的路径匹配查询
 * @param  {String}   root 开始查找的根目录
 * @param  {String}   pattern
 */
var query = function (root, pattern) {
    var reg = explainPattern(pattern);
    var sources = listFilesSync(root, false, true);
    var result = [];
    for (var i = 0, s; s = sources[i]; i++) {
        if (reg.test(s)) {
            result.push(s);
        }
    }
    return result;
}

var explainPattern = function (pattern) {
    var sep = path.sep;
    var map = {
        '**': '.*',
        '*' : '[^\\' + sep + ']*',
        '?' : '[^\\' + sep + ']{1}',
        '/' : '\\' + sep,
        '.' : '\\.'
    };

    var reg = pattern.replace(/\*\*|\*|\?|\/|\./g, function (m, i, str) {
        return map[m] || m;
    });

    reg = new RegExp('^' + reg);
    return reg;
}


exports.mkdirsSync = mkdirsSync;
exports.rmdirsSync = rmdirsSync;

exports.listFilesSync = listFilesSync;
exports.copyFileSync = copyFileSync;
exports.copyFile = copyFile;
exports.writeFileSync = writeFileSync;

exports.isDirectoryPath = isDirectoryPath;

exports.query = query;