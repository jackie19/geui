#!/usr/bin/env node
var path = require('path'),
    fs = require('fs'),
    geui = require('../lib/index'),
    nopt = require('nopt'),

/*
 * config: 配置文件名 [String]
 * path: 工作目录 [String]
 * watch: 是否监听lessWatch [Boolean]
 * */
    knownOpts = {help: Boolean, version: Boolean, config: path, path: path, watch: Boolean},
    shortHands = {h: '--help', v: '--version', c: '--config', p: '--path', w: '--watch'},

    parsed = nopt(knownOpts, shortHands, process.argv, 2),

    basedir = process.cwd(), //进程的当前工作目录
    geuifile,

    config;


if (parsed.version) {
    geui.version();
    process.exit();
}

if (parsed.help) {
    geui.help();
    process.exit();
}

//指定工作目录
if (parsed.path) {
    basedir = path.resolve(parsed.path);
}

//指定配置文件,默认 geuifile.js
/*
 if (parsed.config) {
 geuifile = path.resolve(basedir, parsed.config);
 } else {
 geuifile = path.resolve(basedir, 'geuifile');
 }
 */
geuifile = path.join(basedir, parsed.config ? parsed.config : 'geuifile');

try{
    config = require(geuifile);
}
catch(e){
    throw new Error('geuifile is not exist.', geuifile);
}

if (parsed.watch) {
    config.less.options.watcher = true
}

geui.run(config, basedir);

