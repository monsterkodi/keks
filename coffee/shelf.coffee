###
 0000000  000   000  00000000  000      00000000
000       000   000  000       000      000     
0000000   000000000  0000000   000      000000  
     000  000   000  000       000      000     
0000000   000   000  00000000  0000000  000     
###

{ stopEvent, keyinfo, slash, post, prefs, popup, elem, clamp, empty, first, last, kpos, klog, kerror, $, _ } = require 'kxk'

Row      = require './row'
Scroller = require './tools/scroller'
Column   = require './column'
fuzzy    = require 'fuzzy'
    
class Shelf extends Column

    @: (browser) ->

        super browser
        
        @items  = []
        @index  = -1
        @div.id = 'shelf'
        
        post.on 'addToShelf' @addPath
        
        post.on 'file' @onFile
        
    #  0000000    0000000  000000000  000  000   000   0000000   000000000  0000000     00000000    0000000   000   000  
    # 000   000  000          000     000  000   000  000   000     000     000         000   000  000   000  000 0 000  
    # 000000000  000          000     000   000 000   000000000     000     0000000     0000000    000   000  000000000  
    # 000   000  000          000     000     000     000   000     000     000         000   000  000   000  000   000  
    # 000   000   0000000     000     000      0      000   000     000     0000000     000   000   0000000   00     00  
   
    activateRow: (row) -> 
        
        $('.hover')?.classList.remove 'hover'
        row.setActive focus:false
        
        @browser.loadItem row.item, focus:false, clear:0
                
    #  0000000   000   000      00000000  000  000      00000000  
    # 000   000  0000  000      000       000  000      000       
    # 000   000  000 0 000      000000    000  000      0000000   
    # 000   000  000  0000      000       000  000      000       
    #  0000000   000   000      000       000  0000000  00000000  
    
    onFile: (file) =>
        
        return if empty file
        if @navigatingRows
            delete @navigatingRows
            return
        
        for index in [0...@items.length]
            if @items[index].file == file
                @rows[index].setActive()
                return
        
        matches = []
        for index,item of @items
            if file?.startsWith item.file
                matches.push [index, item]

        if not empty matches
            matches.sort (a,b) -> b[1].file.length - a[1].file.length
            [index, item] = first matches
            @rows[index].setActive()

    # 000  000   000  000  000000000  
    # 000  0000  000  000     000     
    # 000  000 0 000  000     000     
    # 000  000  0000  000     000     
    # 000  000   000  000     000     
    
    browserDidInitColumns: ->
        
        return if @didInit
        
        @didInit = true
        
        @loadShelfItems()
        
    loadShelfItems: ->
        
        items = prefs.get "shelf▸items"
        @setItems items, save:false
                
    addPath: (path, opt) =>
        
        if slash.isDir path
            @addDir path, opt
        else
            @addFile path, opt
        
    # 000  000000000  00000000  00     00   0000000  
    # 000     000     000       000   000  000       
    # 000     000     0000000   000000000  0000000   
    # 000     000     000       000 0 000       000  
    # 000     000     00000000  000   000  0000000   

    itemPaths: -> @rows.map (r) -> r.path()
    
    savePrefs: -> prefs.set "shelf▸items" @items
    
    setItems: (@items, opt) ->
        
        @clear()
        
        @items ?= []
        @addItems @items
        
        if opt?.save != false
            @savePrefs()            
        @
        
    addItems: (items, opt) ->
        
        return if empty items
        
        for item in items
            @rows.push new Row @, item
            
        @scroll.update()
        @
        
    addDir: (dir, opt) ->
        
        item = 
            name: slash.file slash.tilde dir
            type: 'dir'
            file: slash.path dir
        
        @addItem item, opt

    addFile: (file, opt) ->
        
        item = 
            name: slash.file file
            type: 'file'
            file: slash.path file
            
        @addItem item, opt
        
    addFiles: (files, opt) ->
        # klog 'files' files
        for file in files
            if slash.isDir file
                # klog 'addDir' file
                @addDir file, opt
            else
                # klog 'addFile' file
                @addFile file, opt
        
    addItem:  (item, opt) ->
        
        _.pullAllWith @items, [item], _.isEqual # remove item if on shelf already
        
        if opt?.pos
            index = @rowIndexAtPos opt.pos
            @items.splice Math.min(index, @items.length), 0, item
        else
            @items.push item
            
        @setItems @items
                        
    onDrop: (event) => 
    
        action = event.getModifierState('Shift') and 'copy' or 'move'
        source = event.dataTransfer.getData 'text/plain'
        
        item = @browser.fileItem source
        @addItem item, pos:kpos event
    
    isEmpty: -> empty @rows
    
    clear: ->
        
        @clearSearch()
        @div.scrollTop = 0
        @table.innerHTML = ''
        @rows = []
        @scroll.update()
                                   
    name: -> 'shelf'
    
    # 00000000   0000000    0000000  000   000   0000000  
    # 000       000   000  000       000   000  000       
    # 000000    000   000  000       000   000  0000000   
    # 000       000   000  000       000   000       000  
    # 000        0000000    0000000   0000000   0000000   
    
    onFocus: => 

        @div.classList.add 'focus'
        if @browser.shelfSize < 200
            @browser.setShelfSize 200
            
    # 00     00   0000000   000   000   0000000  00000000  
    # 000   000  000   000  000   000  000       000       
    # 000000000  000   000  000   000  0000000   0000000   
    # 000 0 000  000   000  000   000       000  000       
    # 000   000   0000000    0000000   0000000   00000000  
    
    onMouseOver: (event) => @row(event.target)?.onMouseOver()
    onMouseOut:  (event) => @row(event.target)?.onMouseOut()
    onClick:     (event) => @row(event.target)?.activate event
    onDblClick:  (event) => @navigateCols 'enter'

    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000  
    # 0000  000  000   000  000   000  000  000        000   000     000     000       
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000   
    # 000  0000  000   000     000     000  000   000  000   000     000     000       
    # 000   000  000   000      0      000   0000000   000   000     000     00000000  

    navigateRows: (key) ->

        return kerror "no rows in column #{@index}?" if not @numRows()
        index = @activeRow()?.index() ? -1
        kerror "no index from activeRow? #{index}?", @activeRow() if not index? or Number.isNaN index
        
        index = switch key
            when 'up'        then index-1
            when 'down'      then index+1
            when 'home'      then 0
            when 'end'       then @items.length
            when 'page up'   then index-@numVisible()
            when 'page down' then clamp 0, @items.length, index+@numVisible()
            else index
            
        kerror "no index #{index}? #{@numVisible()}" if not index? or Number.isNaN index        
        index = clamp 0, @numRows()-1, index
        
        kerror "no row at index #{index}/#{@numRows()-1}?", @numRows() if not @rows[index]?.activate?

        navigate = (action) =>
            @navigatingRows = true
            post.emit 'menuAction' action
        
        if      key == 'up'   and index > @items.length     then navigate 'Navigate Forward'
        else if key == 'down' and index > @items.length + 1 then navigate 'Navigate Backward'
        else @rows[index].activate()
    
    removeObject: =>
                
        if row = @activeRow()
            nextOrPrev = row.next() ? row.prev()
            row.div.remove()
            @items.splice row.index(), 1
            @rows.splice row.index(), 1
            nextOrPrev?.activate()
            @savePrefs()
        @

    # 00000000    0000000   00000000   000   000  00000000   
    # 000   000  000   000  000   000  000   000  000   000  
    # 00000000   000   000  00000000   000   000  00000000   
    # 000        000   000  000        000   000  000        
    # 000         0000000   000         0000000   000        
    
    showContextMenu: (absPos) =>
        
        if not absPos?
            absPos = pos @view.getBoundingClientRect().left, @view.getBoundingClientRect().top
        
        opt = items: [ 
            text:   'Toggle Extensions'
            combo:  'ctrl+e' 
        ,
            text:   'Remove'
            combo:  'backspace' 
            cb:     @removeObject
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
            when 'backspace' 'delete' then return stopEvent event, @clearSearch().removeObject()
            when 'command+k' 'ctrl+k' then return stopEvent event if @browser.cleanUp()
            when 'tab'    
                if @search.length then @doSearch ''
                return stopEvent event
            when 'esc'
                if @dragDiv
                    @dragDiv.drag.dragStop()
                    @dragDiv.remove()
                    delete @dragDiv
                if @search.length then @clearSearch()
                return stopEvent event
            when 'up' 'down' 'page up' 'page down' 'home' 'end' 
                return stopEvent event, @navigateRows key
            when 'right' 'alt+right' 'enter'
                return stopEvent event, @focusBrowser()
                
        if mod in ['shift' ''] and char then @doSearch char
        
        if @dragDiv
            @updateDragIndicator event
            
    onKeyUp: (event) =>
        
        if @dragDiv
            @updateDragIndicator event
        
module.exports = Shelf
