function m4(name) {
    'use strict'
    var unuse

    $LAB
        .script(['src/module1/m1.js', 'src/module1/m2.js',])
        .wait(function () {

            console.log('in m4: %s', m1())
            console.log('in m4: %s', m2())
        })

    console.log('hello m4')

    return 'm4'
}