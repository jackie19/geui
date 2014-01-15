var options = {
    /*
     * project name
     * */
    "name": "hello_geui",

    "options": {
        "isUglify": true,//是否合并压缩js
        "isLabjs": true,//
        "isLess": true,//是否使用less
        "isSprite": true//是否合并图片精灵
    },

    /*
     * js合并压缩:
     * 可以分多个模块
     * @type: Array
     * @example
     * "build: [
     *      //模块一
     *      {...},
     *      //模块二
     *      {...}
     * ]"
     *
     *
     * */
    "uglify": [
        {
            /*
             * 被合并压缩的 js 文件,或目录
             * 支持 ant 风格
             * @type: String|Array
             * @example
             * "src": "src/module1/"
             * "src": ["src/module1/m?.js"]
             * "src": ["src/module1/m*.js", "src/module1/m2.js"]
             * */
            "src": "src/module1/",

            /*
             * 合并压缩后的文件输出路径
             * @type: String
             * */
            "dist": "build/module/module1.js",

            /*
             * uglify minify options
             * https://github.com/mishoo/UglifyJS2
             * */
            "options": {
                "outSourceMap": "build/module/module1.js.map",
                "warnings": true,
                "output":{
                    "beautify":true //格式化
                },
                "mangle":false, //混淆
                "compress":false //压缩
            }
        },
        {
            "src": ["src/module2/*.js"],
            "dist": "build/module/module2.js",
            "options": {
                "outSourceMap": "build/module/module2.js.map",
                "warnings": true,
                "output":{
                    "beautify":true
                },
                "mangle":false,
                "compress":false
            }
        }
    ],
    /*
     *  Less
     *  不支持合并,后面用 sprite 合并
     * */
    "less": {

        "options": {
            /*
             * 指定@import搜索的目录
             * 需要以 `/` 结尾
             * @type: Array|String
             * @example
             * "paths": "lib/"
             * "paths": ["lib/"]
             * */
            "paths": 'lib/',
            /*
             * 用 clean-css 压缩生成的css
             * @type: Boolean
             * */
            "compress": false,
            /*
             * 监听 Less 文件
             * @type: Boolean
             *
             * */
            "watcher": true
        },
        /*
         * less source directory
         * 支持 ant 风格
         * @type: String|Array
         * @example
         * "input": "less/"
         * "input":  ["less/"]
         * "input":  ["less/e*.less"]
         * */
        "src": "less/*.less",

        /*
         * css output directory
         * 统一输出到一个目录, 自动把src目录下的 images 拷贝过来
         * @type: String
         * */
        "dist": "style/src/"
    },
    /*
     * css 精灵
     * 依赖 iSpriter
     *
     * */
    "sprite": {

        "input": {
            "cssSource": "style/src/",//css文件源,将会合并图片精灵
            "ignoreImages": ["*logo.png"]//忽略不合并的图标 ["*logo.png"],  ["icons/*", "loading.png"], "icons/*"
        },
        "output": {
            "cssDist": "style/dist/", //css文件输出目录
            "imageDist": "images/",//optional 生成的精灵图相对于 cssDist 的路径
            "maxSize": 0,//optional 图片容量的最大大小, 单位 KB, 默认 0
            "margin": 12,//optional 合成之后, 图片间的空隙, 默认 0
            "prefix": "sprite_",//optional 精灵图前缀, sprite_exam.png
            "combine": "exam.css",//所有 css 文件合并为一个文件
            "compress": true//是否压缩 css 文件
        }
    }

};
module.exports = options;