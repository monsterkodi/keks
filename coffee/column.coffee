###
 0000000   0000000   000      000   000  00     00  000   000
000       000   000  000      000   000  000   000  0000  000
000       000   000  000      000   000  000000000  000 0 000
000       000   000  000      000   000  000 0 000  000  0000
 0000000   0000000   0000000   0000000   000   000  000   000
###

{ post, stopEvent, setStyle, keyinfo, popup, slash, valid, clamp, empty, state, open, elem, kpos, fs, kerror, $, _ } = require 'kxk'

Row      = require './row'
Scroller = require './scroller'
fuzzy    = require 'fuzzy'
trash    = require 'trash'

class Column
    
    constructor: (@browser) ->
        
        @index = @browser.columns?.length
        @searchTimer = null
        @search = ''
        @items  = []
        @rows   = []
        
        @div   = elem class: 'browserColumn' tabIndex: 6, id: @name()
        @table = elem class: 'browserColumnTable'
        @div.appendChild @table
        
        @browser.cols?.appendChild @div
        
        @div.addEventListener 'focus'     @onFocus
        @div.addEventListener 'blur'      @onBlur
        @div.addEventListener 'keydown'   @onKey
        
        @div.addEventListener 'mouseover' @onMouseOver
        @div.addEventListener 'mouseout'  @onMouseOut

        @div.addEventListener 'mouseup'   @onClick
        @div.addEventListener 'dblclick'  @onDblClick
        
        @div.addEventListener "contextmenu", @onContextMenu
        
        @scroll = new Scroller @
        
    #  0000000  00000000  000000000  000  000000000  00000000  00     00   0000000  
    # 000       000          000     000     000     000       000   000  000       
    # 0000000   0000000      000     000     000     0000000   000000000  0000000   
    #      000  000          000     000     000     000       000 0 000       000  
    # 0000000   00000000     000     000     000     00000000  000   000  0000000   
    
    loadItems: (items, parent) ->
        
        @browser.clearColumn @index
        
        @items  = items
        @parent = parent
        
        if @parent.type == undefined
            log 'column.loadItems' String @parent
            @parent.type = slash.isDir(@parent.file) and 'dir' or 'file'
        
        kerror "no parent item?" if not @parent?
        kerror "loadItems -- no parent type?", @parent if not @parent.type?
        
        if valid @items
            for item in @items
                @rows.push new Row @, item
        
            @scroll.update()
        @

    setItems: (@items, opt) ->
        
        @browser.clearColumn @index
        
        @parent = opt.parent
        kerror "no parent item?" if not @parent?
        kerror "setItems -- no parent type?", @parent if not @parent.type?
        
        for item in @items
            @rows.push new Row @, item
        
        @scroll.update()
        @

    isDir:  -> @parent.type == 'dir' 
    isFile: -> @parent.type == 'file' 
        
    isEmpty: -> empty @rows
    clear:   ->
        @clearSearch()
        delete @parent
        @div.scrollTop = 0
        @editor?.del()
        @table.innerHTML = ''
        @rows = []
        @scroll.update()
                    
    #  0000000    0000000  000000000  000  000   000  00000000  
    # 000   000  000          000     000  000   000  000       
    # 000000000  000          000     000   000 000   0000000   
    # 000   000  000          000     000     000     000       
    # 000   000   0000000     000     000      0      00000000  
   
    activateRow:  (row) -> @row(row)?.activate()
       
    activeRow: -> _.find @rows, (r) -> r.isActive()
    activePath: -> @activeRow()?.path()
    
    row: (row) -> # accepts element, index, string or row
        if      _.isNumber  row then return 0 <= row < @numRows() and @rows[row] or null
        else if _.isElement row then return _.find @rows, (r) -> r.div.contains row
        else if _.isString  row then return _.find @rows, (r) -> r.item.name == row
        else return row
            
    nextColumn: -> @browser.column @index+1
    prevColumn: -> @browser.column @index-1
        
    name: -> "#{@browser.name}:#{@index}"
    path: -> @parent?.file ? ''
        
    numRows:    -> @rows.length ? 0   
    rowHeight:  -> @rows[0]?.div.clientHeight ? 0
    numVisible: -> @rowHeight() and parseInt(@browser.height() / @rowHeight()) or 0
    
    rowIndexAtPos: (pos) ->
        
        Math.max 0, Math.floor (pos.y - @div.getBoundingClientRect().top) / @rowHeight()
    
    # 00000000   0000000    0000000  000   000   0000000  
    # 000       000   000  000       000   000  000       
    # 000000    000   000  000       000   000  0000000   
    # 000       000   000  000       000   000       000  
    # 000        0000000    0000000   0000000   0000000   
    
    hasFocus: -> @div.classList.contains 'focus'

    focus: (opt={}) ->
        if not @activeRow() and @numRows() and opt?.activate != false
            @rows[0].setActive()
        @div.focus()
        @
        
    onFocus: => @div.classList.add 'focus'
    onBlur:  => @div.classList.remove 'focus'

    focusBrowser: -> @browser.focus()
    
    # 00     00   0000000   000   000   0000000  00000000  
    # 000   000  000   000  000   000  000       000       
    # 000000000  000   000  000   000  0000000   0000000   
    # 000 0 000  000   000  000   000       000  000       
    # 000   000   0000000    0000000   0000000   00000000  
    
    onMouseOver: (event) => @row(event.target)?.onMouseOver()
    onMouseOut:  (event) => @row(event.target)?.onMouseOut()
    onClick:     (event) => @row(event.target)?.activate event
    onDblClick:  (event) => 
        @navigateCols 'enter'
        if item = @activeRow()?.item
            if item.file and item.type == 'file' # jump to top of file on double click
                post.emit 'singleCursorAtPos' [0, 0]

    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000  
    # 0000  000  000   000  000   000  000  000        000   000     000     000       
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000   
    # 000  0000  000   000     000     000  000   000  000   000     000     000       
    # 000   000  000   000      0      000   0000000   000   000     000     00000000  

    navigateRows: (key) ->

        return error "no rows in column #{@index}?" if not @numRows()
        index = @activeRow()?.index() ? -1
        error "no index from activeRow? #{index}?", @activeRow() if not index? or Number.isNaN index
        
        index = switch key
            when 'up'        then index-1
            when 'down'      then index+1
            when 'home'      then 0
            when 'end'       then @numRows()-1
            when 'page up'   then index-@numVisible()
            when 'page down' then index+@numVisible()
            else index
            
        error "no index #{index}? #{@numVisible()}" if not index? or Number.isNaN index        
        index = clamp 0, @numRows()-1, index
        
        error "no row at index #{index}/#{@numRows()-1}?", @numRows() if not @rows[index]?.activate?
        @rows[index].activate()
    
    navigateCols: (key) -> # move to file browser?
        
        switch key
            when 'left'  then @browser.navigate 'left'
            when 'right' then @browser.navigate 'right'
            when 'enter'
                if item = @activeRow()?.item
                    type = item.type
                    if type == 'dir'
                        post.emit 'filebrowser' 'loadItem' item, focus:true
                    else if item.file
                        post.emit 'jumpTo' item
                        post.emit 'focus' 'editor'
        @

    navigateRoot: (key) -> # move to file browser?
        
        return if not @browser.browse?
        @browser.browse switch key
            when 'left'  then slash.dir @parent.file
            when 'up'    then @parent.file
            when 'right' then @activeRow().item.file
            when 'down'  then slash.pkg @parent.file
            when '~'     then '~'
            when '/'     then '/'
        @
            
    openFileInNewWindow: ->  
        
        if item = @activeRow()?.item
            if item.type == 'file' and item.textFile and item.file
                post.emit 'openFiles' [item.file], newWindow: true
        @

    #  0000000  00000000   0000000   00000000    0000000  000   000    
    # 000       000       000   000  000   000  000       000   000    
    # 0000000   0000000   000000000  0000000    000       000000000    
    #      000  000       000   000  000   000  000       000   000    
    # 0000000   00000000  000   000  000   000   0000000  000   000    
    
    doSearch: (char) ->
        
        return if not @numRows()
        
        clearTimeout @searchTimer
        @searchTimer = setTimeout @clearSearch, 2000
        @search += char
        
        if not @searchDiv
            @searchDiv = elem class: 'browserSearch'
            
        @searchDiv.textContent = @search

        activeIndex  = @activeRow()?.index() ? 0
        activeIndex += 1 if (@search.length == 1) or (char == '')
        activeIndex  = 0 if activeIndex >= @numRows()
        
        for rows in [@rows.slice(activeIndex), @rows.slice(0,activeIndex+1)]
            fuzzied = fuzzy.filter @search, rows, extract: (r) -> r.item.name
            
            if fuzzied.length
                row = fuzzied[0].original
                row.div.appendChild @searchDiv
                row.activate()
                break
        @
    
    clearSearch: =>
        
        @search = ''
        @searchDiv?.remove()
        delete @searchDiv
        @
    
    removeObject: =>
        
        if row = @activeRow()
            @browser.emit 'willRemoveRow' row, @
            nextOrPrev = row.next() ? row.prev()
            @removeRow row
            nextOrPrev?.activate()
        @

    removeRow: (row) ->
        
        row.div.remove()
        @items.splice row.index(), 1
        @rows.splice row.index(), 1
        
    #  0000000   0000000   00000000   000000000  
    # 000       000   000  000   000     000     
    # 0000000   000   000  0000000       000     
    #      000  000   000  000   000     000     
    # 0000000    0000000   000   000     000     
    
    sortByName: ->
         
        @rows.sort (a,b) -> 
            a.item.name.localeCompare b.item.name
            
        @table.innerHTML = ''
        for row in @rows
            @table.appendChild row.div
        @
        
    sortByType: ->
        
        @rows.sort (a,b) -> 
            atype = a.item.type == 'file' and slash.ext(a.item.name) or a.item.type
            btype = b.item.type == 'file' and slash.ext(b.item.name) or b.item.type
            (atype + a.item.name).localeCompare btype + b.item.name
            
        @table.innerHTML = ''
        for row in @rows
            @table.appendChild row.div
        @
  
    # 000000000   0000000    0000000    0000000   000      00000000  
    #    000     000   000  000        000        000      000       
    #    000     000   000  000  0000  000  0000  000      0000000   
    #    000     000   000  000   000  000   000  000      000       
    #    000      0000000    0000000    0000000   0000000  00000000  
    
    toggleDotFiles: =>

        if @parent.type == undefined
            log 'column.toggleDotFiles' @parent
            @parent.type = slash.isDir(@parent.file) and 'dir' or 'file'
            
        # if @parent.type == 'dir'            
            # stateKey = "browser|showHidden|#{@parent.file}"
            # if window.state.get stateKey
                # window.state.del stateKey
            # else
                # window.state.set stateKey, true
            # @browser.loadDirItem @parent, @index, ignoreCache:true
        @
        
    toggleExtensions: =>

        stateKey = "browser|hideExtensions"
        # window.state.set stateKey, not window.state.get stateKey, false
        # setStyle '.browserRow .ext' 'display' window.state.get(stateKey) and 'none' or 'initial'
        @
        
    # 000000000  00000000    0000000    0000000  000   000  
    #    000     000   000  000   000  000       000   000  
    #    000     0000000    000000000  0000000   000000000  
    #    000     000   000  000   000       000  000   000  
    #    000     000   000  000   000  0000000   000   000  
    
    moveToTrash: =>
        
        pathToTrash = @activePath()
        @removeObject()
        
        trash([pathToTrash]).catch (err) -> error "failed to trash #{pathToTrash} #{err}"

    addToShelf: =>
        
        if pathToShelf = @activePath()
            post.emit 'addToShelf' pathToShelf
        
    duplicateFile: =>
        
        unusedFilename = require 'unused-filename'
        unusedFilename(@activePath()).then (fileName) =>
            fileName = slash.path fileName
            if fs.copy? # fs.copyFile in node > 8.4
                fs.copy @activePath(), fileName, (err) =>
                    return error 'copy file failed' err if err?
                    post.emit 'loadFile' fileName
                    
    # 00000000  000   000  00000000   000       0000000   00000000   00000000  00000000   
    # 000        000 000   000   000  000      000   000  000   000  000       000   000  
    # 0000000     00000    00000000   000      000   000  0000000    0000000   0000000    
    # 000        000 000   000        000      000   000  000   000  000       000   000  
    # 00000000  000   000  000        0000000   0000000   000   000  00000000  000   000  
    
    explorer: =>
        
        open slash.dir @activePath()
        
    open: =>
        
        open @activePath()
                            
    # 00000000    0000000   00000000   000   000  00000000     
    # 000   000  000   000  000   000  000   000  000   000    
    # 00000000   000   000  00000000   000   000  00000000     
    # 000        000   000  000        000   000  000          
    # 000         0000000   000         0000000   000          
        
    onContextMenu: (event) => stopEvent event, @showContextMenu kpos event
              
    showContextMenu: (absPos) =>
        
        if not absPos?
            absPos = kpos @view.getBoundingClientRect().left, @view.getBoundingClientRect().top
        
        opt = items: [ 
            text:   'Toggle Invisible'
            combo:  'ctrl+i' 
            cb:     @toggleDotFiles
        ,
            text:   'Toggle Extensions'
            combo:  'ctrl+e' 
            cb:     @toggleExtensions
        ,
            text:   'Refresh'
            combo:  'ctrl+r' 
            cb:     @browser.refresh
        ,
            text:   'Duplicate'
            combo:  'ctrl+d' 
            cb:     @duplicateFile
        ,
            text:   'Move to Trash'
            combo:  'ctrl+backspace' 
            cb:     @moveToTrash
        ,
            text:   'Add to Shelf'
            combo:  'alt+shift+.'
            cb:     @addToShelf
        ,
            text:   'Explorer'
            combo:  'alt+e' 
            cb:     @explorer
        ,
            text:   'Open'
            combo:  'alt+o' 
            cb:     @open
        ]
        
        opt.x = absPos.x
        opt.y = absPos.y
        popup.menu opt        
        
    # 000   000  00000000  000   000  
    # 000  000   000        000 000   
    # 0000000    0000000     00000    
    # 000  000   000          000     
    # 000   000  00000000     000     
    
    onKey: (event) =>
        
        { mod, key, combo, char } = keyinfo.forEvent event

        switch combo
            when 'alt+e'               then return @explorer()
            when 'alt+o'               then return @open()
            when 'page up' 'page down' 'home' 'end' then return stopEvent event, @navigateRows key
            when 'enter'               then return stopEvent event, @navigateCols key
            when 'command+enter' 'ctrl+enter' then return @openFileInNewWindow()
            when 'command+left' 'command+up' 'command+right' 'command+down' 'ctrl+left' 'ctrl+up' 'ctrl+right' 'ctrl+down'
                return stopEvent event, @navigateRoot key
            when 'command+backspace' 'ctrl+backspace' 'command+delete' 'ctrl+delete' 
                return stopEvent event, @moveToTrash()
            when 'alt+left'            then return stopEvent event, window.split.focus 'shelf'
            when 'backspace' 'delete'  then return stopEvent event, @browser.onBackspaceInColumn @
            when 'ctrl+t'              then return stopEvent event, @sortByType()
            when 'ctrl+n'              then return stopEvent event, @sortByName()
            when 'command+i' 'ctrl+i'  then return stopEvent event, @toggleDotFiles()
            when 'command+d' 'ctrl+d'  then return stopEvent event, @duplicateFile()
            when 'command+e' 'ctrl+e'  then return stopEvent event, @toggleExtensions()
            when 'command+k' 'ctrl+k'  then return stopEvent event if @browser.cleanUp()
            when 'f2'                  then return stopEvent event, @activeRow()?.editName()
            when 'tab'    
                if @search.length then @doSearch ''
                return stopEvent event
            when 'esc'
                if @search.length then @clearSearch()
                else window.split.focus 'commandline-editor'
                return stopEvent event

        if key in ['up'   'down']  then return stopEvent event, @navigateRows key              
        if key in ['left' 'right'] then return stopEvent event, @navigateCols key        
            
        switch char
            when '~' '/' then return stopEvent event, @navigateRoot char
            
        if mod in ['shift' ''] and char then @doSearch char
                
module.exports = Column


