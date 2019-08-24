###
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
###

{ app, args, post, klog } = require 'kxk'

kapp = new app
    dir:        __dirname
    pkg:        require '../package.json'
    shortcut:   'CmdOrCtrl+Alt+E'
    index:      'index.html'
    icon:       '../img/app.ico'
    tray:       '../img/menu.png'
    about:      '../img/about.png'
    prefsSeperator: '▸'
    aboutDebug: false
    width:      474
    height:     900
    minWidth:   474
    minHeight:  600
    
post.on 'winDidShow' ->
    
       