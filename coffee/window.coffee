###
000   000  000  000   000  0000000     0000000   000   000
000 0 000  000  0000  000  000   000  000   000  000 0 000
000000000  000  000 0 000  000   000  000   000  000000000
000   000  000  000  0000  000   000  000   000  000   000
00     00  000  000   000  0000000     0000000   00     00
###

{ post, args, slash, prefs, stopEvent, setStyle, scheme, popup, klog, clamp, kpos, win, $, _ } = require 'kxk'

FileBrowser = require './filebrowser'
  
w = new win
    dir:    __dirname
    pkg:    require '../package.json'
    menu:   '../coffee/menu.noon'
    icon:   '../img/menu@2x.png'
    prefsSeperator: '▸'
    context: false
    dragElem: $ '#crumbs'
    
electron = require 'electron'
pkg      = require '../package.json'

remote   = electron.remote
dialog   = remote.dialog
Browser  = remote.BrowserWindow
win      = window.win   = remote.getCurrentWindow()
winID    = window.winID = win.id
fileBrowser = null

# 000   000  000  000   000  00     00   0000000   000  000   000
# 000 0 000  000  0000  000  000   000  000   000  000  0000  000
# 000000000  000  000 0 000  000000000  000000000  000  000 0 000
# 000   000  000  000  0000  000 0 000  000   000  000  000  0000
# 00     00  000  000   000  000   000  000   000  000  000   000

winMain = ->

    fileBrowser = new FileBrowser $ "#main"
    
    if args.folder[0]
        fileBrowser.browse args.folder[0]
    else
        if load = prefs.get 'load'
            # klog 'init load' load
            if load.last != load.first
                active = load.last[load.first.length..]
                active = load.first + '/' + slash.split(active)[0]
            fileBrowser.browse load.first, active:active, cb: ->
                fileBrowser.navigateToFile load.last
        else
            fileBrowser.browse '~'
    
    win.on 'resize' -> fileBrowser.resized()
    
    prefs.apply 'browser▸hideExtensions' hideExtensions
    
# 00000000    0000000   00000000   000   000  00000000
# 000   000  000   000  000   000  000   000  000   000
# 00000000   000   000  00000000   000   000  00000000
# 000        000   000  000        000   000  000
# 000         0000000   000         0000000   000

onContextMenu = (event) -> 
    
    return if not event.target.classList.contains 'crumb'
    
    fileBrowser.columns[event.target.columnIndex].onContextMenu event, true
    
$("#crumbs").addEventListener 'contextmenu' onContextMenu

# 00000000   0000000   000   000  000000000      0000000  000  0000000  00000000
# 000       000   000  0000  000     000        000       000     000   000
# 000000    000   000  000 0 000     000        0000000   000    000    0000000
# 000       000   000  000  0000     000             000  000   000     000
# 000        0000000   000   000     000        0000000   000  0000000  00000000

defaultFontSize = 18

getFontSize = -> prefs.get 'fontSize' defaultFontSize

setFontSize = (s) ->
        
    s = getFontSize() if not _.isFinite s
    s = clamp 8 44 s

    prefs.set 'fontSize' s

    setStyle '#main'         'font-size' "#{s}px"
    setStyle '.rowNameInput' 'font-size' "#{s}px"

changeFontSize = (d) ->
    
    s = getFontSize()
    if      s >= 30 then f = 4
    else if s >= 20 then f = 2
    else                 f = 1
        
    setFontSize s + f*d

resetFontSize = ->
    
    prefs.set 'fontSize' defaultFontSize
    setFontSize defaultFontSize
     
onWheel = (event) ->
    
    if 0 <= w.modifiers.indexOf 'ctrl'
        changeFontSize -event.deltaY/100
  
setFontSize getFontSize()
window.document.addEventListener 'wheel' onWheel    

# 00     00  00000000  000   000  000   000      0000000    0000000  000000000  000   0000000   000   000
# 000   000  000       0000  000  000   000     000   000  000          000     000  000   000  0000  000
# 000000000  0000000   000 0 000  000   000     000000000  000          000     000  000   000  000 0 000
# 000 0 000  000       000  0000  000   000     000   000  000          000     000  000   000  000  0000
# 000   000  00000000  000   000   0000000      000   000   0000000     000     000   0000000   000   000

onMenuAction = (name, args) ->

    klog 'menuAction' name
    
    if not fileBrowser.viewer
        switch name
            when 'Toggle Extensions' then return toggleExtensions()
            when 'Increase'          then return changeFontSize +1
            when 'Decrease'          then return changeFontSize -1
            when 'Reset'             then return resetFontSize()
            when 'Refresh'           then return fileBrowser.refresh()
    
    switch name

        when 'Add to Shelf'      then return addToShelf()
        when 'Focus Shelf'       then return $('shelf')?.focus?()
        when 'Reload Window'     then return reloadWin()
        when 'Toggle Shelf'      then return fileBrowser.toggleShelf()
        
    post.toMain 'menuAction' name, args

post.on 'menuAction' onMenuAction
post.on 'load' (info) ->
    
    load = prefs.get 'load' {}
    if info.column
        load.last = info.item.file
    else
        load.first = info.item.file
        load.last  = info.item.file
    prefs.set 'load' load

toggleExtensions = -> prefs.toggle 'browser▸hideExtensions' hideExtensions
hideExtensions = (hide=true) ->

    setStyle '.browserRow.file .ext' 'display' hide and 'none' or 'initial'
    setStyle '.fileInfoFile .ext'    'display' hide and 'none' or 'initial'

winMain()
