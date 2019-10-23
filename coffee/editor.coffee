###
00000000  0000000    000  000000000   0000000   00000000   
000       000   000  000     000     000   000  000   000  
0000000   000   000  000     000     000   000  0000000    
000       000   000  000     000     000   000  000   000  
00000000  0000000    000     000      0000000   000   000  
###

{ slash, empty, clamp, prefs, post, open, elem, stopEvent, keyinfo, klog, $, _ } = require 'kxk'

File       = require './tools/file'
Header     = require './header'
BaseEditor = require './editor/editor'
FileEditor = require './editor/fileeditor'

class Editor

    @: (@browser, path) ->
                    
        @div = elem class:'editor' tabindex:1
        
        @focus = document.activeElement
        
        main =$ '#main'
            
        main.appendChild @div
        
        @editor = new FileEditor @div

        post.on 'menuAction' @onMenuAction
        post.on 'dirty' @onDirty
        
        @div.addEventListener 'keydown' @onKey
        @div.focus()
        
        @editor.setCurrentFile path
        
        if prefs.get 'centerText'
            @editor.centerText true 0
        
        @header = new Header @browser
        @header.setFile path
            
    onDirty: (dirty) =>
        
        @header?.setDirty dirty
        
    # 000   000  00000000  000   000  
    # 000  000   000        000 000   
    # 0000000    0000000     00000    
    # 000  000   000          000     
    # 000   000  00000000     000     
    
    onKey: (event) =>

        { mod, key, combo, char } = keyinfo.forEvent event

        switch combo
            when 'ctrl+w' then return stopEvent event, @close()
            when 'esc'    then if not @editor.dirty then return stopEvent event, @close()
            when 'space' 
                c = @editor.mainCursor()
                if c[0] == 1 and c[1] == 0
                    return stopEvent event, @close()
            
    close: =>

        @editor?.saveScrollCursorsAndSelections()
        @browser.viewer = null
        @header.del()
        @div.remove()
        @focus.focus()
        @editor?.del()
        delete @editor
        
    # 00000000   00000000   0000000  000  0000000  00000000  0000000    
    # 000   000  000       000       000     000   000       000   000  
    # 0000000    0000000   0000000   000    000    0000000   000   000  
    # 000   000  000            000  000   000     000       000   000  
    # 000   000  00000000  0000000   000  0000000  00000000  0000000    
    
    resized: -> 
        
        @editor?.resized()
        
        if prefs.get 'centerText' false
            @editor.centerText true 200

    #  0000000  00000000  000   000  000000000  00000000  00000000       000000000  00000000  000   000  000000000
    # 000       000       0000  000     000     000       000   000         000     000        000 000      000
    # 000       0000000   000 0 000     000     0000000   0000000           000     0000000     00000       000
    # 000       000       000  0000     000     000       000   000         000     000        000 000      000
    #  0000000  00000000  000   000     000     00000000  000   000         000     00000000  000   000     000
    
    toggleCenterText: ->
    
        klog 'toggleCenterText'
        if prefs.get "invisibles▸#{@editor.currentFile ? @editor.name}", false
            @editor.toggleInvisibles()
            restoreInvisibles = true
    
        if not prefs.get 'centerText' false
            prefs.set 'centerText' true
            @editor.centerText true
        else
            prefs.set 'centerText' false
            @editor.centerText false
    
        if restoreInvisibles
            @editor.toggleInvisibles()
        
    # 00000000   0000000   000   000  000000000      0000000  000  0000000  00000000
    # 000       000   000  0000  000     000        000       000     000   000
    # 000000    000   000  000 0 000     000        0000000   000    000    0000000
    # 000       000   000  000  0000     000             000  000   000     000
    # 000        0000000   000   000     000        0000000   000  0000000  00000000
    
    setFontSize: (s) ->
    
        s = prefs.get('editorFontSize' 19) if not _.isFinite s
        s = clamp 8, 100, s
    
        prefs.set 'editorFontSize' s
        @editor.setFontSize s
        if @editor.currentFile?
            @editor.setCurrentFile @editor.currentFile
    
    changeFontSize: (d) ->
    
        if      @editor.size.fontSize >= 30
            f = 4
        else if @editor.size.fontSize >= 50
            f = 10
        else if @editor.size.fontSize >= 20
            f = 2
        else
            f = 1
        @setFontSize @editor.size.fontSize + f*d
    
    resetFontSize: ->
    
        defaultFontSize = prefs.get 'editorDefaultFontSize' 19
        prefs.set 'editorFontSize' defaultFontSize
        @setFontSize defaultFontSize
                
    # 00     00  00000000  000   000  000   000      0000000    0000000  000000000  000   0000000   000   000
    # 000   000  000       0000  000  000   000     000   000  000          000     000  000   000  0000  000
    # 000000000  0000000   000 0 000  000   000     000000000  000          000     000  000   000  000 0 000
    # 000 0 000  000       000  0000  000   000     000   000  000          000     000  000   000  000  0000
    # 000   000  00000000  000   000   0000000      000   000   0000000     000     000   0000000   000   000

    onMenuAction: (name, args) =>

        return if not @editor
        
        klog "editor menu action! '#{name}' args:" args
        
        if action = BaseEditor.actionWithName name
            if action.key? and _.isFunction @editor[action.key]
                @editor[action.key] args.actarg
                return
    
        switch name
    
            when 'Close Editor'          then return @close()
            when 'Undo'                  then return @editor.do.undo()
            when 'Redo'                  then return @editor.do.redo()
            when 'Cut'                   then return @editor.cut()
            when 'Copy'                  then return @editor.copy()
            when 'Paste'                 then return @editor.paste()
            when 'Toggle Center Text'    then return @toggleCenterText()
            when 'Increase'              then return @changeFontSize +1
            when 'Decrease'              then return @changeFontSize -1
            when 'Reset'                 then return @resetFontSize()
            when 'Save'                  then return @editor.save()
            when 'Save As ...'           then return @editor.saveAs()
            when 'Revert'                then return @editor.revert()
    
        klog "unhandled menu action! '#{name}' args:" args
        'unhandled'
    
module.exports = Editor
