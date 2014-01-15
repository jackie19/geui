var fs = require('fs'),
    path = require('path'),

    UglifyJS = require("uglify-js"),
    spriter = require('ispriter'),
    less = require('less'),
    watcher = require('chokidar').watch,

    rd = require('./rd.js'),
    geui = module.exports = {};

/*todo
 * 1: uglify: labjs 依赖模块替换 如: m2.js 替换为 module1.js;  简单替换, 没有去重
 * 2: sprite: img 合并; 依赖 ispriter
 * 3: uglify: src输入目录支持路径, ant 风格, 如 "src": ["src/module1/*.js"];
 * 4: less: 支持 less;
 * 5: less: watch 功能;  重复监听的 bug 是 nodeJs 的问题
 *    usage
 *    geui -w
 *
 *    1)监听 @import搜索的目录
 *    2)less 和 sprite 独立便于调试
 *
 * 6: 指定项目目录, >geui -p [path];
 * 7: 参数调整
 * 8: 考虑是否分离js的合并与压缩,方便调试; 通过uglify参数可以只合并不压缩
 * 9: web版
 *
 * */

var spriteTimeout,
    lessTimeout,
    watcherTimeout,
    wait = function (milliseconds, func) {
        return setTimeout(func, milliseconds);
    };


geui.endWith = function (str, end) {
    var index = str.lastIndexOf(end);
    return index !== -1 && index + end.length === str.length;
}

geui.isEmptyObj = function (j) {
    for (var k in j)return false;
    return true
};

geui.inArray = function (elem, array) {

    if (array.indexOf) {
        return array.indexOf(elem);
    }

    array.forEach(function (value, i) {
        if (value === elem) {
            return i;
        }
    });

    return -1;
}

geui.unique = function (arr) {
    var newArr = [];
    var tempObj = {};

    arr.forEach(function (value) {
        if (!(value in tempObj) || !(value === tempObj[value])) {
            newArr.push(value);
            tempObj[value] = value;
        }
    });
    return newArr;

};

geui.package = require('../package.json');

geui.version = function () {
    console.log('geui@' + geui.package.version);
};

geui.help = function () {
    console.log('%s @%s', geui.package.description, geui.package.version);
};
geui.web = function (port) {
///
};
geui.run = function (config, dir) {
    var options = config.options,
        name = config.name,
        isUglify = options.isUglify,
        isSprite = options.isSprite,

        isLess = options.isLess,
        lessWatcher = config.less.options.watcher,
        lessOptsPaths = config.less.options.paths,
        lessSrc = config.less.src,
        lessWatcherPaths = [];

    if (!Array.isArray(lessOptsPaths)) {
        lessWatcherPaths.push(lessOptsPaths);
    }

    lessWatcherPaths = lessWatcherPaths.concat(lessOptsPaths);

    if (!Array.isArray(lessSrc)) {
        lessSrc = [lessSrc];
    }

    lessSrc = path.dirname(lessSrc[0]);
    lessWatcherPaths.push(lessSrc);
    lessWatcherPaths = lessWatcherPaths.map(function (value) {
        return path.join(dir, value);
    });

    if (lessWatcher) {
        lessWatcherPaths.forEach(function (value) {

            watcher(value, {ignored: /[\/\\]\./, persistent: true})
                .on('add', function (path) {
                    if (geui.endWith(path, '.less')) {
                        clearTimeout(lessTimeout);
                        lessTimeout = wait(25, function () {
                            taskLess(config, dir);
                        });
                    }
                })
                .on('change', function (path) {
                    if (geui.endWith(path, '.less')) {
                        clearTimeout(lessTimeout);
                        lessTimeout = wait(25, function () {
                            taskLess(config, dir, path);
                        });
                    }
                })
                .on('all', function (event, path) {

                    if (geui.endWith(path, '.less')) {
                        //clearTimeout(watcherTimeout);
                        watcherTimeout = wait(25, function () {
                            var time = new Date();
                            time = time.toLocaleTimeString();
                            log('watcher', event, ' - ', path, time);
                        });
                    }

                });

        });
        log(name, 'i\'m watching u!');
    } else {
        log('what else?');
    }

    if (isUglify) {
        taskUglify(config, dir);
    }
    if (isLess && !lessWatcher) {
        taskLess(config, dir);
    }

};
/*
 * @param {Object} config 配置
 * @param {String} dir 工作路径
 * @param {String} watcher less file in fs.watcher, optional
 * */
function taskLess(config, dir, watcher) {

    var lessCfg = config.less,
        lessResult,
        name = config.name,
        isSprite = config.options.isSprite;

    lessCfg.files = [];

    if (!lessCfg.src) {
        throw 'there is no less specific!';
    }

    if (typeof lessCfg.src === 'string') {
        lessCfg.src = [lessCfg.src];
    }

    lessCfg.src.forEach(function (value) {

        var pattern = path.normalize(value).replace(/\\/g, '\\\\');

        if (geui.endWith(pattern, path.sep)) {
            pattern += '*.less';
        }

        if (!geui.endWith(pattern, '.less')) {
            pattern += '/*.less';
        }

        lessResult = rd.query(dir, pattern);
        lessCfg.files = lessCfg.files.concat(lessResult);

    });


    lessCfg.files.forEach(function (file) {

        var file = path.join(dir, file),
            dist = path.join(lessCfg.dist, path.basename(file)),
            paths = lessCfg.options.paths,
            imageSource = lessCfg.options.images || 'images', //less 目录下的 images
            ext = lessCfg.options.ext || 'png'; //图片扩展名

        dist = dist.replace(path.extname(file), '.css');
        dist = path.join(dir, dist);

        if (!Array.isArray(paths)) {
            paths = [paths].map(function (pth) {
                return  path.join(dir, pth);
            });
        }

        //复制 images 文件夹到 dist
        var imagesPath = path.join(path.dirname(file), imageSource);
        var images = rd.listFilesSync(imagesPath, ext);
        images.forEach(function (image) {
            rd.copyFile(path.join(imagesPath, image), path.join(path.dirname(dist), imageSource, image), true);
        });

        if (watcher == file || watcher == undefined || geui.inArray(path.dirname(watcher) + '/', paths) !== -1) {

            fs.readFile(file, 'utf-8', function (err, data) {
                var parser = new (less.Parser)({
                    paths: paths,
                    filename: 'lib.less'
                });
                parser.parse(data, function (e, tree) {
                    var str = tree.toCSS({compress: lessCfg.options.compress});
                    rd.writeFileSync(dist, str, true);
                    log(name, 'less:', file, '-to', path.normalize(dist));
                });
            });
        }

        if (isSprite) {
            clearTimeout(spriteTimeout);
            spriteTimeout = wait(25, function () {
                taskSprite(config, dir);
            });
        }

    });


}

function taskUglify(config, dir) {

    //搞个map, 替换依赖
    var uglify = config.uglify,
        name = config.name,
        uglifyMap = {};

    uglifyMap.src = [];
    uglifyMap.dist = [];

    uglify.map(function (module) {

        var pattern,
            queryResult,
            moduleFiles = [],
            src = module.src;

        if (!src) {
            throw 'there is no src specific!';
        } else if (typeof src == 'string') {
            src = [src];
        }

        src.forEach(function (value) {
            pattern = path.normalize(value).replace(/\\/g, '\\\\');

            if (geui.endWith(pattern, path.sep)) {
                pattern += '*.js';
            }

            if (!geui.endWith(pattern, '.js')) {
                pattern += '/*.js';
            }

            queryResult = rd.query(dir, pattern);
            moduleFiles = moduleFiles.concat(queryResult);
        });

        var files = [].concat(moduleFiles),
            dist = module.dist;

        if (!files.length) {
            throw 'there is no any js file contain!';
        }

        files.forEach(function (file) {
            var tempStr = path.normalize(file).replace(/\\/g, '/');
            uglifyMap[tempStr] = dist;
            uglifyMap.src.push(file);
        });

        module.src = geui.unique([].concat(files));
        return module.src;

    });

    uglify.forEach(function (module) {

        var files = [].concat(module.src);
        var dist = path.join(dir, module.dist);
        var minifyOptions = module.options;

        files = files.map(function (file) {
            return path.join(dir, file);
        });

        var result = UglifyJS.minify(files, minifyOptions);
        var code = result.code;

//        labjs依赖替换
        uglifyMap.src.forEach(function (file) {
            var str = path.normalize(file).replace(/\\/g, '/');
            var reg = new RegExp(str, 'igm');
            code = code.replace(reg, function ($1) {
                return uglifyMap[$1];
            });
        });

        rd.writeFileSync(dist, code, true);

        log(name, 'uglify:', module.src, '-to', path.normalize(module.dist));

        //map
        if (!geui.isEmptyObj(minifyOptions) && !!result.map) {

            var map = JSON.parse(result.map).file;
            map = path.join(dir, map);
            rd.writeFileSync(map, result.map, true);
            log(name, 'map:', path.normalize(map));
        }
    });
}

function taskSprite(config, dir) {
    var spriteCfg = config.sprite,
        name = config.name;
    spriteCfg.workspace = dir;
    spriter.merge(spriteCfg);
}
function sub(str, data) {
    return str.replace(/{(.*?)}/igm, function ($, $1) {
//                return data[$1] ? data[$1] : '';
        return data[$1] || '';
    });
}
function log() {
    var arg = Array.prototype.slice.call(arguments),
        name = arg.shift() + "> ";
    arg = arg.join(' ');
    console.info(name, arg);
}
geui.log = log;
geui.sub = sub;