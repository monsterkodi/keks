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
    
    editMenu = text:'Edit' menu:[]

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
                submenu[menuName].push text: ''

    for key, menu of submenu
        editMenu.menu.push text:key, menu:menu

    [mainMenu[0], editMenu, mainMenu[2]]

