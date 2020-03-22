###
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
###

{ app, args, post } = require 'kxk'

class Main extends app

    @: ->

        super
            dir:        __dirname
            pkg:        require '../package.json'
            shortcut:   'CmdOrCtrl+Alt+E'
            index:      'index.html'
            icon:       '../img/app.ico'
            tray:       '../img/menu.png'
            about:      '../img/about.png'
            onOtherInstance: @onOtherInstance
            prefsSeperator: '▸'
            aboutDebug: false
            width:      474
            height:     900
            minWidth:   353
            minHeight:  111
            args: """
                    folder          to open     **
            """
    
        post.on 'winDidShow' ->
        post.on 'menuAction' (action) =>
            switch action
                when 'New Window' then @createWindow()
                
    onOtherInstance: (otherargs, dir) =>
        
        # klog 'onOtherInstance' otherargs, dir
        args.folder = []
        for arg in otherargs
            if arg.endsWith '.exe' then continue
            if arg.indexOf('keks.app/Contents/MacOS') > 0 then continue
            if arg.startsWith '--' then continue
            args.folder.push arg
        
        if @win
            post.toWin @win.id, 'browse' args.folder[0]
            @win.focus()
        else
            @showWindow()
            
kapp = new Main