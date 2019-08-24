###
000   000  000  000   000  0000000     0000000   000   000
000 0 000  000  0000  000  000   000  000   000  000 0 000
000000000  000  000 0 000  000   000  000   000  000000000
000   000  000  000  0000  000   000  000   000  000   000
00     00  000  000   000  0000000     0000000   00     00
###

{ post, args, slash, stopEvent, scheme, klog, win, $, _ } = require 'kxk'

FileBrowser = require './filebrowser'
  
w = new win
    dir:    __dirname
    pkg:    require '../package.json'
    menu:   '../coffee/menu.noon'
    icon:   '../img/menu@2x.png'
    prefsSeperator: '▸'

electron = require 'electron'
pkg      = require '../package.json'

remote   = electron.remote
dialog   = remote.dialog
Browser  = remote.BrowserWindow
win      = window.win   = remote.getCurrentWindow()
winID    = window.winID = win.id

# 000   000  000  000   000  00     00   0000000   000  000   000
# 000 0 000  000  0000  000  000   000  000   000  000  0000  000
# 000000000  000  000 0 000  000000000  000000000  000  000 0 000
# 000   000  000  000  0000  000 0 000  000   000  000  000  0000
# 00     00  000  000   000  000   000  000   000  000  000   000

winMain = -> 

    fileBrowser = new FileBrowser $ "#main"
    fileBrowser.loadItem type:'dir' file:slash.resolve '~'
    
    win.on 'resize' -> fileBrowser.resized()

window.onload = -> klog 'win onload'

# 00     00  00000000  000   000  000   000      0000000    0000000  000000000  000   0000000   000   000
# 000   000  000       0000  000  000   000     000   000  000          000     000  000   000  0000  000
# 000000000  0000000   000 0 000  000   000     000000000  000          000     000  000   000  000 0 000
# 000 0 000  000       000  0000  000   000     000   000  000          000     000  000   000  000  0000
# 000   000  00000000  000   000   0000000      000   000   0000000     000     000   0000000   000   000

onMenuAction = (name, args) ->

    switch name

        when 'Undo'                  then return window.focusEditor.do.undo()
        when 'Redo'                  then return window.focusEditor.do.redo()
        when 'Cut'                   then return window.focusEditor.cut()
        when 'Copy'                  then return window.focusEditor.copy()
        when 'Paste'                 then return window.focusEditor.paste()
        when 'New Window'            then return post.toMain 'newWindowWithFile', editor.currentFile
        when 'Increase'              then return changeFontSize +1
        when 'Decrease'              then return changeFontSize -1
        when 'Reset'                 then return resetFontSize()
        when 'Add to Shelf'          then return addToShelf()
        when 'Reload Window'         then return reloadWin()

    post.toMain 'menuAction', name, args

post.on 'menuAction' onMenuAction

# 000   000  00000000  000   000
# 000  000   000        000 000
# 0000000    0000000     00000
# 000  000   000          000
# 000   000  00000000     000

onCombo = (combo, info) ->

    return if not combo

    { mod, key, combo, char, event } = info

    # switch combo
        # when 'command+shift+='    then return stopEvent event, @changeZoom +1
        # when 'command+shift+-'    then return stopEvent event, @changeZoom -1
        # when 'command+shift+0'    then return stopEvent event, @resetZoom()

post.on 'combo' onCombo

winMain()
