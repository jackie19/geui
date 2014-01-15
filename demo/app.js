$LAB.script(function () {
    if (isDebug) {
        return ['src/module2/m3.js', 'src/module2/m4.js']
    } else {
        return 'build/module/module2.js';
    }
})
    .wait(function () {

        var text = m3() + m4('m5');
        document.querySelector('.log').innerHTML = text.replace(/\d/g, function ($1) {
            return $1 + ', '
        });

    });