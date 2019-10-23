###
00     00  00000000  000   000  000   000
000   000  000       0000  000  000   000
000000000  0000000   000 0 000  000   000
000 0 000  000       000  0000  000   000
000   000  00000000  000   000   0000000
###

{ filelist, keyinfo, empty, klog, noon, post, slash, os, _ } = require 'kxk'

template = (obj) ->
    
    tmpl = []
    for text,menuOrAccel of obj
        tmpl.push switch
            when empty(menuOrAccel) and text.startsWith '-'
                text: ''
            when _.isNumber menuOrAccel
                text:text
                accel:kstr menuOrAccel
            when _.isString menuOrAccel
                text:text
                accel:keyinfo.convertCmdCtrl menuOrAccel
            when empty menuOrAccel
                text:text
                accel: ''
            else
                if menuOrAccel.accel? or menuOrAccel.command? # needs better test!
                    item = _.clone menuOrAccel
                    item.text = text
                    item
                else
                    text:text
                    menu:template menuOrAccel
    tmpl

module.exports = ->

    mainMenu = template noon.load __dirname + '../../../coffee/menu.noon'

    viewMenu = text:'View' menu:[
        text:'Toggle Center Text'  accel:'ctrl+\\'
    ,
        text:'Toggle Invisibles'   accel:'ctrl+i'
    ,
        text:'Toggle Pigments'     accel:'alt+ctrl+p'
    ] 
    
    fileMenu = text:'File' menu:[
        text:'Save'         accel:'ctrl+s'
    ,
        text:'Save As ...'  accel:'ctrl+shift+s'
    ,
        text:'Revert'       accel:'ctrl+r'
    ]
    
    editMenu = text:'Edit' menu:[
        text:'Undo'  accel:'ctrl+z'
    ,
        text:'Redo'  accel:'ctrl+shift+z'
    ,
        text:''     
    ,
        text:'Cut'   accel:'ctrl+x'
    ,
        text:'Copy'  accel:'ctrl+c'
    ,
        text:'Paste' accel:'ctrl+v'
    ]

    actionFiles = filelist slash.join __dirname, '../editor/actions'
    submenu = Misc: []

    for actionFile in actionFiles
        continue if slash.ext(actionFile) not in ['js' 'coffee']
        actions = require actionFile
        for key,value of actions
            menuName = 'Misc'
            if key == 'actions'
                if value['menu']?
                    menuName = value['menu']
                    submenu[menuName] ?= []
                else
                    continue
                for k,v of value
                    if v.name and v.combo
                        menuAction = (c) -> (i,win) -> post.toWin win.id, 'menuAction', c
                        combo = v.combo
                        if os.platform() != 'darwin' and v.accel
                            combo = v.accel
                        item =
                            text:   v.name
                            accel:  combo
                        if v.menu?
                            submenu[v.menu] ?= []
                        if v.separator
                            submenu[v.menu ? menuName].push text: ''
                        submenu[v.menu ? menuName].push item

    result = [fileMenu, editMenu]
    for key, menu of submenu
        result.push text:key, menu:menu

    result.concat [viewMenu, mainMenu[2]]

