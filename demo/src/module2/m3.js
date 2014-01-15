function m3(name) {
    'use strict'

    $LAB
        .script(['src/module1/m2.js'])
        .wait(function () {
            console.log('in m3: %s', m2())
        })


    console.log('hello m3')
    return name || 'm3'
}