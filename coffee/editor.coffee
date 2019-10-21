###
00000000  0000000    000  000000000   0000000   00000000   
000       000   000  000     000     000   000  000   000  
0000000   000   000  000     000     000   000  0000000    
000       000   000  000     000     000   000  000   000  
00000000  0000000    000     000      0000000   000   000  
###

{ slash, empty, post, open, elem, stopEvent, keyinfo, klog, $, _ } = require 'kxk'

File       = require './tools/file'
BaseEditor = require './editor/editor'
FileEditor = require './editor/fileeditor'

class Editor

    @: (path) ->
                    
        @div = elem class:'editor' tabindex:1
        
        @focus = document.activeElement
        
        main =$ '#main'
            
        main.appendChild @div
        
        @editor = new FileEditor @div

        post.on 'menuAction' @onMenuAction
        
        @div.addEventListener 'keydown' @onKey
        @div.focus()
        
        @editor.setCurrentFile path
            
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
        # klog 'onKey' mod, key, combo
            
    close: =>

        @div.remove()
        @focus.focus()
        @editor?.del()
        delete @editor
        
    resized: -> @editor?.resized()
        
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
            when 'Toggle Center Text'    then return toggleCenterText()
            when 'Increase'              then return changeFontSize +1
            when 'Decrease'              then return changeFontSize -1
            when 'Reset'                 then return resetFontSize()
            when 'Save'                  then return post.emit 'saveFile'
            when 'Save As ...'           then return post.emit 'saveFileAs'
            when 'Revert'                then return post.emit 'reloadFile'
    
        klog "unhandled menu action! '#{name}' args:" args
        'unhandled'
    
module.exports = Editor
