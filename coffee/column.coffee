###
 0000000   0000000   000      000   000  00     00  000   000
000       000   000  000      000   000  000   000  0000  000
000       000   000  000      000   000  000000000  000 0 000
000       000   000  000      000   000  000 0 000  000  0000
 0000000   0000000   0000000   0000000   000   000  000   000
###

{ post, prefs, stopEvent, setStyle, keyinfo, popup, slash, valid, clamp, empty, drag, open, elem, kpos, fs, klog, kerror, $, _ } = require 'kxk'

Row      = require './row'
Scroller = require './tools/scroller'
File     = require './tools/file'
Viewer   = require './viewer'
Editor   = require './editor'
Crumb    = require './crumb'
fuzzy    = require 'fuzzy'
wxw      = require 'wxw'

class Column
    
    @: (@browser) ->
        
        @searchTimer = null
        @search = ''
        @items  = []
        @rows   = []
        
        @div   = elem class: 'browserColumn' tabIndex:6
        @table = elem class: 'browserColumnTable'
        @div.appendChild @table
        
        @setIndex @browser.columns?.length
        
        @browser.cols?.appendChild @div
        
        @div.addEventListener 'focus'     @onFocus
        @div.addEventListener 'blur'      @onBlur
        @div.addEventListener 'keydown'   @onKey
        @div.addEventListener 'keyup'     @onKeyUp
        
        @div.addEventListener 'mouseover' @onMouseOver
        @div.addEventListener 'mouseout'  @onMouseOut

        @div.addEventListener 'dblclick'  @onDblClick
        
        @div.addEventListener 'contextmenu' @onContextMenu
  
        @drag = new drag
            target:  @div
            onStart: @onDragStart
            onMove:  @onDragMove
            onStop:  @onDragStop
        
        @crumb  = new Crumb @
        @scroll = new Scroller @
        
    setIndex: (@index) ->
        
        @crumb?.elem.columnIndex = @index
        
    width: -> @div.getBoundingClientRect().width
        
    # 0000000    00000000    0000000    0000000   
    # 000   000  000   000  000   000  000        
    # 000   000  0000000    000000000  000  0000  
    # 000   000  000   000  000   000  000   000  
    # 0000000    000   000  000   000   0000000   
    
    onDragStart: (d, e) => 
    
        @dragStartRow = @row e.target
        
        @browser.skipOnDblClick = false
        
        delete @toggle
        
        if @dragStartRow
            
            if e.shiftKey
                @browser.select.to @dragStartRow
            else if e.metaKey or e.altKey or e.ctrlKey
                if not row.isSelected()
                    @browser.select.toggle @dragStartRow
                else
                    @toggle = true
            else
                if @dragStartRow.isSelected()
                    @deselect = true
                else
                    @activeRow()?.clearActive()
                    @browser.select.row @dragStartRow, false
        else
            if @hasFocus() and @activeRow()
                @browser.select.row @activeRow()

    onDragMove: (d,e) =>
        
        if @dragStartRow and not @dragDiv and valid @browser.select.files()
            
            return if Math.abs(d.deltaSum.x) < 20 and Math.abs(d.deltaSum.y) < 10

            delete @toggle 
            delete @deselect
            
            @dragDiv = elem 'div'
            @dragDiv.drag = d
            pos = kpos e.pageX, e.pageY
            row = @browser.select.rows[0]

            @dragDiv.style.position = 'absolute'
            @dragDiv.style.opacity  = "0.7"
            @dragDiv.style.top  = "#{pos.y-d.deltaSum.y}px"
            @dragDiv.style.left = "#{pos.x-d.deltaSum.x}px"
            @dragDiv.style.width = "#{@width()-12}px"
            @dragDiv.style.pointerEvents = 'none'
            
            @dragInd = elem class:'dragIndicator'
            @dragDiv.appendChild @dragInd
            
            for row in @browser.select.rows
                rowClone = row.div.cloneNode true
                rowClone.style.flex = 'unset'
                rowClone.style.pointerEvents = 'none'
                rowClone.style.border = 'none'
                rowClone.style.marginBottom = '-1px'
                @dragDiv.appendChild rowClone
                            
            document.body.appendChild @dragDiv
            @focus activate:false
            
        if @dragDiv
            
            @updateDragIndicator e      
            @dragDiv.style.transform = "translateX(#{d.deltaSum.x}px) translateY(#{d.deltaSum.y}px)"

    updateDragIndicator: (event) ->
        
        @dragInd?.classList.toggle 'copy' event.shiftKey
        @dragInd?.classList.toggle 'move' event.ctrlKey or event.metaKey or event.altKey
            
    onDragStop: (d,e) =>
        
        if @dragDiv?
            
            @dragDiv.remove()
            delete @dragDiv
            delete @dragStartRow
            
            if row = @browser.rowAtPos d.pos
                column = row.column
                target = row.item.file
            else if column = @browser.columnAtPos d.pos
                target = column.parent?.file
            else if column = @browser.columnAtX d.pos.x
                target = column.parent?.file
            else
                klog 'no drop target'
                return
                
            action = e.shiftKey and 'copy' or 'move'
                
            if column == @browser.shelf 
                if target and (e.ctrlKey or e.shiftKey or e.metaKey or e.altKey)
                    @browser.dropAction action, @browser.select.files(), target
                else
                    @browser.shelf.addFiles @browser.select.files(), pos:d.pos
            else
                @browser.dropAction action, @browser.select.files(), target
        else
            
            @focus activate:false
            
            if row = @row e.target
                if row.isSelected()
                    if e.metaKey or e.altKey or e.ctrlKey or e.shiftKey
                        if @toggle
                            delete @toggle
                            @browser.select.toggle row
                    else
                        if @deselect
                            delete @deselect
                            @browser.select.row row
                        else
                            row.activate()
        
    #  0000000  00000000  000000000  000  000000000  00000000  00     00   0000000  
    # 000       000          000     000     000     000       000   000  000       
    # 0000000   0000000      000     000     000     0000000   000000000  0000000   
    #      000  000          000     000     000     000       000 0 000       000  
    # 0000000   00000000     000     000     000     00000000  000   000  0000000   
    
    removeFile: (file) => 
        
        if row = @row slash.file file
            @removeRow row
            @scroll.update()
            
    insertFile: (file) => 

        item = @browser.fileItem file
        row = new Row @, item
        @rows.push row
        row
    
    loadItems: (items, parent) ->
        
        @browser.clearColumn @index
        
        @items  = items
        @parent = parent
        
        @crumb.setFile @parent.file
                
        if @parent.type == undefined
            @parent.type = slash.isDir(@parent.file) and 'dir' or 'file'
        
        kerror "no parent item?" if not @parent?
        kerror "loadItems -- no parent type?", @parent if not @parent.type?
        
        if valid @items
            for item in @items
                @rows.push new Row @, item
        
            @scroll.update()
            
        if @parent.type == 'dir' and slash.samePath '~/Downloads' @parent.file
            @sortByDateAdded()
        @
        
    unshiftItem: (item) ->
        
        @items.unshift item
        @rows.unshift new Row @, item
        @table.insertBefore @table.lastChild, @table.firstChild
        @scroll.update()
        @rows[0]
        
    pushItem: (item) ->
        
        @items.push item
        @rows.push new Row @, item
        @scroll.update()
        @rows[-1]
        
    addItem: (item) ->
        
        row = @pushItem item
        @sortByName()
        row

    setItems: (@items, opt) ->
        
        @browser.clearColumn @index
        
        @parent = opt.parent
        kerror "no parent item?" if not @parent?
        kerror "setItems -- no parent type?", @parent if not @parent.type?
        
        for item in @items
            @rows.push new Row @, item
        
        @scroll.update()
        @

    isDir:  -> @parent?.type == 'dir' 
    isFile: -> @parent?.type == 'file' 
        
    isEmpty: -> empty @parent
    clear:   ->
        @clearSearch()
        delete @parent
        @div.scrollTop = 0
        @table.innerHTML = ''
        @crumb.clear()
        @rows = []
        @scroll.update()
                    
    #  0000000    0000000  000000000  000  000   000  00000000  
    # 000   000  000          000     000  000   000  000       
    # 000000000  000          000     000   000 000   0000000   
    # 000   000  000          000     000     000     000       
    # 000   000   0000000     000     000      0      00000000  
   
    activateRow: (row) -> @row(row)?.activate()
       
    activeRow: -> _.find @rows, (r) -> r.isActive()
    activePath: -> @activeRow()?.path() ? @parent.file
    
    row: (row) -> # accepts element, index, string or row
        if      _.isNumber  row then return 0 <= row < @numRows() and @rows[row] or null
        else if _.isElement row then return _.find @rows, (r) -> r.div.contains row
        else if _.isString  row then return _.find @rows, (r) -> r.item.name == row or r.item.file == row
        else return row
            
    nextColumn: -> @browser.column @index+1
    prevColumn: -> @browser.column @index-1
        
    name: -> "#{@browser.name}:#{@index}"
    path: -> @parent?.file ? ''
        
    numRows:    -> @rows.length ? 0   
    rowHeight:  -> @rows[0]?.div.clientHeight ? 0
    numVisible: -> @rowHeight() and parseInt(@browser.height() / @rowHeight()) or 0
    
    rowAtPos: (pos) -> @row @rowIndexAtPos pos
    
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
        @div.classList.add 'focus'
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
    
    onDblClick:  (event) => 
        
        @browser.skipOnDblClick = true
        @navigateCols 'enter'
    
    updateCrumb: => @crumb.updateRect @div.getBoundingClientRect()
           
    extendSelection: (key) ->
        
        return error "no rows in column #{@index}?" if not @numRows()        
        index = @activeRow()?.index() ? -1
        error "no index from activeRow? #{index}?", @activeRow() if not index? or Number.isNaN index
            
        toIndex = switch key
            when 'up'        then index-1
            when 'down'      then index+1
            when 'home'      then 0
            when 'end'       then @numRows()-1
            when 'page up'   then Math.max 0, index-@numVisible()
            when 'page down' then Math.min @numRows()-1, index+@numVisible()
            else index
    
        @browser.select.to @row(toIndex), true
    
    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000  
    # 0000  000  000   000  000   000  000  000        000   000     000     000       
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000   
    # 000  0000  000   000     000     000  000   000  000   000     000     000       
    # 000   000  000   000      0      000   0000000   000   000     000     00000000  

    navigateRows: (key) ->

        return error "no rows in column #{@index}?" if not @numRows()
        index = @activeRow()?.index() ? -1
        error "no index from activeRow? #{index}?", @activeRow() if not index? or Number.isNaN index
        
        newIndex = switch key
            when 'up'        then index-1
            when 'down'      then index+1
            when 'home'      then 0
            when 'end'       then @numRows()-1
            when 'page up'   then index-@numVisible()
            when 'page down' then index+@numVisible()
            else index
            
        if not newIndex? or Number.isNaN newIndex        
            error "no index #{newIndex}? #{@numVisible()}"
            
        newIndex = clamp 0, @numRows()-1, newIndex
        
        return if newIndex == index
        
        if not @rows[newIndex]?.activate?
            error "no row at index #{newIndex}/#{@numRows()-1}?", @numRows() 
            
        @browser.select.row @rows[newIndex]
    
    navigateCols: (key) -> # move to file browser?
        
        switch key
            when 'up'    then @browser.navigate 'up'
            when 'left'  then @browser.navigate 'left'
            when 'right' then @browser.navigate 'right'
            when 'enter'
                if item = @activeRow()?.item
                    type = item.type
                    if type == 'dir'
                        @browser.loadItem item
                    else if item.file
                        post.emit 'openFile' item.file
        @

    navigateRoot: (key) -> 
        
        @browser.browse switch key
            when 'left'  then slash.dir @parent.file
            when 'right' then @activeRow().item.file
        @
            
    #  0000000  00000000   0000000   00000000    0000000  000   000    
    # 000       000       000   000  000   000  000       000   000    
    # 0000000   0000000   000000000  0000000    000       000000000    
    #      000  000       000   000  000   000  000       000   000    
    # 0000000   00000000  000   000  000   000   0000000  000   000    
    
    doSearch: (char) ->
        
        return if not @numRows()
        
        if not @searchDiv
            @searchDiv = elem class: 'browserSearch'
            
        @setSearch @search + char
        
    backspaceSearch: ->
        
        if @searchDiv and @search.length
            @setSearch @search[0...@search.length-1]
            
    setSearch: (@search) ->
            
        clearTimeout @searchTimer
        @searchTimer = setTimeout @clearSearch, 2000
        
        @searchDiv.textContent = @search

        activeIndex  = @activeRow()?.index() ? 0
        activeIndex += 1 if (@search.length == 1) #or (char == '')
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
            nextOrPrev = row.next() ? row.prev()
            @removeRow row
            nextOrPrev?.activate()
        @

    removeRow: (row) ->
        
        if row == @activeRow()
            if @nextColumn()?.parent?.file == row.item?.file
                # klog 'removeRow clear'
                @browser.clearColumnsFrom @index + 1
            
        row.div.remove()
        @items.splice row.index(), 1
        @rows.splice row.index(), 1
        
    #  0000000   0000000   00000000   000000000  
    # 000       000   000  000   000     000     
    # 0000000   000   000  0000000       000     
    #      000  000   000  000   000     000     
    # 0000000    0000000   000   000     000     
    
    sortByName: =>
         
        @rows.sort (a,b) -> 
            (a.item.type + a.item.name).localeCompare(b.item.type + b.item.name)
            
        @table.innerHTML = ''
        for row in @rows
            @table.appendChild row.div
        @
        
    sortByType: =>
        
        @rows.sort (a,b) -> 
            atype = a.item.type == 'file' and slash.ext(a.item.name) or '___' #a.item.type
            btype = b.item.type == 'file' and slash.ext(b.item.name) or '___' #b.item.type
            (a.item.type + atype + a.item.name).localeCompare(b.item.type + btype + b.item.name, undefined, numeric:true)
            
        @table.innerHTML = ''
        for row in @rows
            @table.appendChild row.div
        @

    sortByDateAdded: =>
        
        @rows.sort (a,b) -> b.item.stat?.atimeMs - a.item.stat?.atimeMs
            
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
            # log 'column.toggleDotFiles' @parent
            @parent.type = slash.isDir(@parent.file) and 'dir' or 'file'
            
        if @parent.type == 'dir'            
            stateKey = "browser▸showHidden▸#{@parent.file}"
            if prefs.get stateKey
                prefs.del stateKey
            else
                prefs.set stateKey, true
            @browser.loadDirItem @parent, @index, ignoreCache:true
        @
                
    # 000000000  00000000    0000000    0000000  000   000  
    #    000     000   000  000   000  000       000   000  
    #    000     0000000    000000000  0000000   000000000  
    #    000     000   000  000   000       000  000   000  
    #    000     000   000  000   000  0000000   000   000  
    
    moveToTrash: =>
        
        index = @browser.select.freeIndex()
        if index >= 0
            selectRow = @row index
        
        for row in @browser.select.rows
            wxw 'trash' row.path()
            @removeRow row
           
        if selectRow
            @browser.select.row selectRow
        else
            @navigateCols 'left'

    addToShelf: =>
        
        if pathToShelf = @activePath()
            post.emit 'addToShelf' pathToShelf

    # 000   000  000  00000000  000   000  00000000  00000000   
    # 000   000  000  000       000 0 000  000       000   000  
    #  000 000   000  0000000   000000000  0000000   0000000    
    #    000     000  000       000   000  000       000   000  
    #     0      000  00000000  00     00  00000000  000   000  
    
    openViewer: =>
        
        if @activeRow()?.item.name != '..' 
            path = @activePath()
        else
            path = @parent.file
            
        if path
            if File.isText path
                @browser.viewer = new Editor @browser, path
                return
                
            if slash.isFile path
                if not File.isImage path
                    path = @path()
            
            @browser.viewer = new Viewer @browser, path
        
    newFolder: =>
        
        unused = require 'unused-filename'
        unused(slash.join @path(), 'New folder').then (newDir) =>
            fs.mkdir newDir, (err) =>
                if empty err
                    row = @insertFile newDir
                    @browser.select.row row
                    row.editName()
            
    # 0000000    000   000  00000000   000      000   0000000   0000000   000000000  00000000  
    # 000   000  000   000  000   000  000      000  000       000   000     000     000       
    # 000   000  000   000  00000000   000      000  000       000000000     000     0000000   
    # 000   000  000   000  000        000      000  000       000   000     000     000       
    # 0000000     0000000   000        0000000  000   0000000  000   000     000     00000000  
    
    duplicateFile: =>
                
        for file in @browser.select.files()
            File.duplicate file, (source, target) =>
                if @parent.type == 'file'
                    col = @prevColumn()
                    col.focus()
                else col = @
                row = col.insertFile target
                @browser.select.row row
                    
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
        
    makeRoot: => 
        
        @browser.shiftColumnsTo @index
        
        if @browser.columns[0].items[0].name != '..'
            @unshiftItem 
                name: '..'
                type: 'dir'
                file: slash.dir @parent.file
                
        @crumb.setFile @parent.file
    
    onContextMenu: (event, column) => 
        
        stopEvent event
        
        absPos = kpos event
        
        if not column
            @showContextMenu absPos
        else
            
            opt = items: [ 
                text:   'Root'
                cb:     @makeRoot
            ,
                text:   'Add to Shelf'
                combo:  'alt+shift+.'
                cb:     => post.emit 'addToShelf' @parent.file
            ,
                text:   'Explorer'
                combo:  'alt+e' 
                cb:     => open @parent.file
            ]
            
            opt.x = absPos.x
            opt.y = absPos.y
            popup.menu opt    
              
    showContextMenu: (absPos) =>
        
        if not absPos?
            absPos = kpos @div.getBoundingClientRect().left, @div.getBoundingClientRect().top
        
        opt = items: [ 
            text:   'Open'
            combo:  'return alt+o'
            cb:     @open
        ,
            text:   'Viewer'
            combo:  'space alt+v' 
            cb:     @openViewer
        ,
            text:   'Explorer'
            combo:  'alt+e' 
            cb:     @explorer
        ,
            text:   ''
        ,
            text:   'Add to Shelf'
            combo:  'alt+shift+.'
            cb:     @addToShelf
        ,
            text:   ''
        ,
            text:   'Move to Trash'
            combo:  'ctrl+backspace' 
            cb:     @moveToTrash
        ,   
            text:   ''
            hide:   @parent.type == 'file'
        ,
            text:   'Duplicate'
            combo:  'ctrl+d' 
            cb:     @duplicateFile
            hide:   @parent.type == 'file'
        ,   
            text:   'New Folder'
            combo:  'alt+n' 
            cb:     @newFolder
            hide:   @parent.type == 'file'
        ]
        
        if @parent.type != 'file'
            opt.items = opt.items.concat [
                text:   ''
            ,   
                text:   'Sort'
                menu: [
                    text: 'By Name' combo:'ctrl+n', cb:@sortByName
                ,
                    text: 'By Type' combo:'ctrl+t', cb:@sortByType
                ,
                    text: 'By Date' combo:'ctrl+a', cb:@sortByDateAdded
                ]
            ]
        
            opt.items = opt.items.concat window.titlebar.makeTemplate require './menu.json'
        
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
            when 'shift+`' '~'                      then return stopEvent event, @browser.browse '~'
            when '/'                                then return stopEvent event, @browser.browse '/'
            when 'alt+shift+.'                      then return stopEvent event, @addToShelf()
            when 'alt+e'                            then return @explorer()
            when 'alt+o'                            then return @open()
            when 'alt+n'                            then return @newFolder()
            when 'space' 'alt+v'                    then return @openViewer()
            when 'shift+up' 'shift+down' 'shift+home' 'shift+end' 'shift+page up' 'shift+page down' then return stopEvent event, @extendSelection key
            when 'page up' 'page down' 'home' 'end' then return stopEvent event, @navigateRows key
            when 'command+up' 'ctrl+up'             then return stopEvent event, @navigateRows 'home'
            when 'command+down' 'ctrl+down'         then return stopEvent event, @navigateRows 'end'
            when 'enter''alt+up'                    then return stopEvent event, @navigateCols key
            when 'backspace'                        then return stopEvent event, @browser.onBackspaceInColumn @
            when 'delete'                           then return stopEvent event, @browser.onDeleteInColumn @
            when 'ctrl+t'                           then return stopEvent event, @sortByType()
            when 'ctrl+n'                           then return stopEvent event, @sortByName()
            when 'ctrl+a'                           then return stopEvent event, @sortByDateAdded()
            when 'command+i' 'ctrl+i'               then return stopEvent event, @toggleDotFiles()
            when 'command+d' 'ctrl+d'               then return stopEvent event, @duplicateFile()
            when 'command+k' 'ctrl+k'               then return stopEvent event if @browser.cleanUp()
            when 'f2'                               then return stopEvent event, @activeRow()?.editName()
            when 'command+left' 'command+right' 'ctrl+left' 'ctrl+right'
                return stopEvent event, @navigateRoot key
            when 'command+backspace' 'ctrl+backspace' 'command+delete' 'ctrl+delete' 
                return stopEvent event, @moveToTrash()
            when 'tab'    
                if @search.length then @doSearch ''
                return stopEvent event
            when 'esc'
                if @dragDiv
                    @dragDiv.drag.dragStop()
                    @dragDiv.remove()
                    delete @dragDiv
                else if @browser.select.files().length > 1
                    @browser.select.row @activeRow()
                else if @search.length then @clearSearch()
                return stopEvent event

        if combo in ['up'   'down']  then return stopEvent event, @navigateRows key              
        if combo in ['left' 'right'] then return stopEvent event, @navigateCols key
            
        if mod in ['shift' ''] and char then @doSearch char
        
        if @dragDiv
            @updateDragIndicator event
            
    onKeyUp: (event) =>
        
        if @dragDiv
            @updateDragIndicator event
                        
module.exports = Column


