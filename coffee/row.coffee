###
00000000    0000000   000   000
000   000  000   000  000 0 000
0000000    000   000  000000000
000   000  000   000  000   000
000   000   0000000   00     00
###

{ $, _, elem, empty, keyinfo, klog, slash, stopEvent } = require 'kxk'

File      = require './tools/file'

class Row
    
    @: (@column, @item) ->

        @browser = @column.browser
        text = @item.text ? @item.name
        if empty(text) or empty text.trim()
            html = '<span> </span>'
        else
            html = File.span text
        @div = elem class:'browserRow' html:html
        @div.classList.add @item.type
        @column.table.appendChild @div

        if @item.type in ['file' 'dir'] or @item.icon
            @setIcon()
        
    next:        -> @index() < @column.numRows()-1 and @column.rows[@index()+1] or null
    prev:        -> @index() > 0 and @column.rows[@index()-1] or null
    index:       -> @column.rows.indexOf @    
    onMouseOut:  -> @div.classList.remove 'hover'
    onMouseOver: -> @div.classList.add 'hover'

    path: -> 
        if @item.file? and _.isString @item.file
            return @item.file
        if @item.obj?.file? and _.isString @item.obj.file
            return @item.obj.file

    setIcon: ->

        if @item.icon
            className = @item.icon
        else
            if @item.type == 'dir'
                className = 'folder-icon'
            else
                className = File.iconClassName @item.file
                
        if slash.base(@item.file).startsWith('.')
            className += ' dotfile'
            
        icon = elem('span' class:className + ' browserFileIcon')
            
        @div.firstChild?.insertBefore icon, @div.firstChild.firstChild
                    
    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000  
    # 000   000  000          000     000  000   000  000   000     000     000       
    # 000000000  000          000     000   000 000   000000000     000     0000000   
    # 000   000  000          000     000     000     000   000     000     000       
    # 000   000   0000000     000     000      0      000   000     000     00000000  
    
    activate: (event) =>

        if @column.index < 0 # shelf handles row activation
            @column.activateRow @
            return
                    
        $('.hover')?.classList.remove 'hover'
        
        @setActive()
        
        opt = file:@item.file

        switch @item.type
            
            when 'dir' 'file'
                
                col = @column.index
                @browser.clearColumnsFrom col+1, pop:true, clear:col+1
        
                switch @item.type
                    when 'dir'  then @browser.loadDirItem  @item, col+1, focus:false
                    when 'file' then @browser.loadFileItem @item, col+1

                @browser.select.row @, false
                
            else    
                if @item.file? and _.isString(@item.file) and @item.type != 'obj'
                    opt.line = @item.line
                    opt.col  = @item.column
                    klog 'jumpToFile?' opt
                else if @column.parent.obj? and @column.parent.type == 'obj'
                    if @item.type == 'obj'
                        @browser.loadObjectItem @item, column:@column.index+1
                        @browser.previewObjectItem  @item, column:@column.index+2
                        if @item.obj?.file? and _.isString @item.obj.file
                            opt.line = @item.obj.line
                            opt.col  = @item.obj.column
                            klog 'jumpToFile?' opt
                else if @item.obj?.file? and _.isString @item.obj.file
                    opt = file:@item.obj.file, line:@item.obj.line, col:@item.obj.column, newTab:opt.newTab
                    klog 'jumpToFile?' opt
                else
                    @browser.clearColumnsFrom @column.index+1
        @
    
    isActive: -> @div.classList.contains 'active'
    
    setActive: (opt={}) ->
        
        if @column.activeRow() != @
            @column.activeRow()?.clearActive()
            
        @div.classList.add 'active'
        
        if opt?.scroll != false
            @column.scroll.toIndex @index()            
        @
                 
    clearActive: ->
        @div.classList.remove 'active'
        @
        
    #  0000000  00000000  000      00000000   0000000  000000000  00000000  0000000    
    # 000       000       000      000       000          000     000       000   000  
    # 0000000   0000000   000      0000000   000          000     0000000   000   000  
    #      000  000       000      000       000          000     000       000   000  
    # 0000000   00000000  0000000  00000000   0000000     000     00000000  0000000    
    
    isSelected: -> @div.classList.contains 'selected'
    
    setSelected: ->
        @div.classList.add 'selected'
        @
        
    clearSelected: ->
        @div.classList.remove 'selected'
        @

    # 000   000   0000000   00     00  00000000  
    # 0000  000  000   000  000   000  000       
    # 000 0 000  000000000  000000000  0000000   
    # 000  0000  000   000  000 0 000  000       
    # 000   000  000   000  000   000  00000000  
            
    editName: =>
        
        return if @input? 
        @input = elem 'input' class:'rowNameInput'
        @input.value = slash.file @item.file
        
        @div.appendChild @input
        @input.addEventListener 'change'   @
        
        @input.addEventListener 'keydown'  @onNameKeyDown
        @input.addEventListener 'focusout' @onNameFocusOut
        @input.focus()
        
        @input.setSelectionRange 0, slash.base(@item.file).length

    onNameKeyDown: (event) =>
        
        {mod, key, combo} = keyinfo.forEvent event

        switch combo
            when 'esc'
                if @input.value != slash.file @item.file
                    @input.value = slash.file @item.file
                    event.preventDefault()
                    event.stopImmediatePropagation()
                @onNameFocusOut()
            when 'enter'
                if @input.value != slash.file @item.file
                    @onNameChange()
                else
                    @removeInput()
                stopEvent event
        event.stopPropagation()
        
    removeInput: ->

        return if not @input?
        @input.removeEventListener 'focusout' @onNameFocusOut
        @input.removeEventListener 'change'   @onNameChange
        @input.removeEventListener 'keydown'  @onNameKeyDown
        @input.remove()
        delete @input
        @input = null
        if not document.activeElement? or document.activeElement == document.body
            @column.focus activate:false
    
    onNameFocusOut: (event) => @removeInput()
    
    #  0000000  000   000   0000000   000   000   0000000   00000000  
    # 000       000   000  000   000  0000  000  000        000       
    # 000       000000000  000000000  000 0 000  000  0000  0000000   
    # 000       000   000  000   000  000  0000  000   000  000       
    #  0000000  000   000  000   000  000   000   0000000   00000000  
    
    onNameChange: (event) =>
        
        targetFile = slash.join slash.dir(@item.file), @input.value.trim()
        
        @removeInput()
        
        @rename targetFile
        
    # 00000000   00000000  000   000   0000000   00     00  00000000  
    # 000   000  000       0000  000  000   000  000   000  000       
    # 0000000    0000000   000 0 000  000000000  000000000  0000000   
    # 000   000  000       000  0000  000   000  000 0 000  000       
    # 000   000  00000000  000   000  000   000  000   000  00000000  
    
    rename: (targetFile) =>
        
        return if slash.samePath @item.file, targetFile
                
        File.rename @item.file, targetFile, (source, target) =>
            
            @column.removeRow @
            @browser.navigateToFile target
    
module.exports = Row
