###
00000000  000  000      00000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000
000       000  000      000             000   000  000   000  000   000  000 0 000  000       000       000   000
000000    000  000      0000000         0000000    0000000    000   000  000000000  0000000   0000000   0000000
000       000  000      000             000   000  000   000  000   000  000   000       000  000       000   000
000       000  0000000  00000000        0000000    000   000   0000000   00     00  0000000   00000000  000   000
###

{ post, filelist, prefs, slash, empty, clamp, elem, drag, open, klog, $ } = require 'kxk'

Browser  = require './browser'
Shelf    = require './shelf'
Select   = require './select'
File     = require './tools/file'
pbytes   = require 'pretty-bytes'
moment   = require 'moment'

class FileBrowser extends Browser

    @: (view) ->

        super view

        window.filebrowser = @

        @loadID = 0
        @shelf  = new Shelf @
        @select = new Select @
        @name   = 'FileBrowser'

        post.on 'file'           @onFile
        post.on 'browse'         @browse
        post.on 'filebrowser'    @onFileBrowser
        post.on 'openFile'       @onOpenFile
        post.on 'navigateToFile' @navigateToFile

        @shelfResize = elem 'div' class: 'shelfResize'
        @shelfResize.style.position = 'absolute'
        @shelfResize.style.top      = '0px'
        @shelfResize.style.bottom   = '0px'
        @shelfResize.style.left     = '194px'
        @shelfResize.style.width    = '6px'
        @shelfResize.style.cursor   = 'ew-resize'

        @drag = new drag
            target:  @shelfResize
            onMove:  @onShelfDrag

        @shelfSize = prefs.get 'shelf▸size' 200

        @initColumns()
        
    # 0000000    00000000    0000000   00000000    0000000    0000000  000000000  000   0000000   000   000  
    # 000   000  000   000  000   000  000   000  000   000  000          000     000  000   000  0000  000  
    # 000   000  0000000    000   000  00000000   000000000  000          000     000  000   000  000 0 000  
    # 000   000  000   000  000   000  000        000   000  000          000     000  000   000  000  0000  
    # 0000000    000   000   0000000   000        000   000   0000000     000     000   0000000   000   000  
    
    dropAction: (action, sources, target) ->
        
        if slash.isFile target
            
            target = slash.dir target
        
        for source in sources
        
            if action == 'move' 
                if source == target or slash.dir(source) == target
                    klog 'noop' source, target
                    return
                        
        for source in sources
            
            switch action
                when 'move'
                    File.rename source, target, (source, target) =>
                        if sourceColumn = @columnForFile source 
                            sourceColumn.removeFile source
                        if targetColumn = @columnForFile target
                            if not targetColumn.row target
                                targetColumn.insertFile target
                when 'copy'
                    File.copy source, target, (source, target) =>
                        if targetColumn = @columnForFile target
                            if not targetColumn.row target
                                targetColumn.insertFile target
                    
    columnForFile: (file) ->
        
        for column in @columns
            if column.parent?.file == slash.dir file
                return column
        
    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000
    # 0000  000  000   000  000   000  000  000        000   000     000     000
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000
    # 000  0000  000   000     000     000  000   000  000   000     000     000
    # 000   000  000   000      0      000   0000000   000   000     000     00000000

    sharedColumnIndex: (file) -> 
        
        col = 0
        
        for column in @columns
            if column.isDir() and file.startsWith column.path()
                col += 1
            else
                break
                
        if col == 1 and slash.dir(file) != @columns[0]?.path()
            return 0
        Math.max -1, col-2

    closeViewer: -> @viewer?.close()
        
    browse: (file, opt) => 
            
        @closeViewer()
        
        if file then @loadItem @fileItem(file), opt
        
    navigateToFile: (file) =>

        @closeViewer()
        
        lastPath = @lastDirColumn()?.path()
        
        file = slash.path file
        
        if file == lastPath or slash.isRelative file
            return

        col = @sharedColumnIndex file
        
        filelist = slash.pathlist file
        
        if col >= 0
            paths = filelist.slice filelist.indexOf(@columns[col].path())+1
        else
            paths = filelist.slice filelist.length-2
            
        @clearColumnsFrom col+1, pop:true clear:col+paths.length
        
        while @numCols() < paths.length
            @addColumn()
                        
        for index in [0...paths.length]
            
            item = @fileItem paths[index]
            
            switch item.type
                when 'file' then @loadFileItem item, col+1+index
                when 'dir'
                    opt = {}
                    if index < paths.length-1
                        opt.active = paths[index+1]
                    @loadDirItem item, col+1+index, opt
                    
        if col = @lastDirColumn()
            
            if row = col.row(slash.file file)
                row.setActive()

    # 000  000000000  00000000  00     00  
    # 000     000     000       000   000  
    # 000     000     0000000   000000000  
    # 000     000     000       000 0 000  
    # 000     000     00000000  000   000  
    
    fileItem: (path) ->
        
        p = slash.resolve path
                
        file:p
        type:slash.isFile(p) and 'file' or 'dir'
        name:slash.file p
        
    onFileBrowser: (action, item, arg) =>

        switch action
            when 'loadItem'     then @loadItem     item, arg
    
    # 000       0000000    0000000   0000000    000  000000000  00000000  00     00
    # 000      000   000  000   000  000   000  000     000     000       000   000
    # 000      000   000  000000000  000   000  000     000     0000000   000000000
    # 000      000   000  000   000  000   000  000     000     000       000 0 000
    # 0000000   0000000   000   000  0000000    000     000     00000000  000   000

    loadDir: (path) -> @loadItem type:'dir' file:path
    
    loadItem: (item, opt) ->

        opt ?= active:'..' focus:true
        item.name ?= slash.file item.file

        @clearColumnsFrom 1, pop:true, clear:opt.clear ? 1

        switch item.type
            when 'dir'  then @loadDirItem item, 0, opt
            when 'file' 
                opt.activate = item.file
                while @numCols() < 2 then @addColumn()
                @loadDirItem @fileItem(slash.dir(item.file)), 0, opt

        if opt.focus
            @columns[0]?.focus()
                        
    # 00000000  000  000      00000000  000  000000000  00000000  00     00
    # 000       000  000      000       000     000     000       000   000
    # 000000    000  000      0000000   000     000     0000000   000000000
    # 000       000  000      000       000     000     000       000 0 000
    # 000       000  0000000  00000000  000     000     00000000  000   000

    loadFileItem: (item, col=0) ->

        @clearColumnsFrom col, pop:true

        while col >= @numCols()
            @addColumn()

        file = item.file

        @columns[col].parent = item
        
        if File.isImage file
            @columns[col].table.appendChild @imageInfo file
        else
            switch slash.ext file
                when 'tiff' 'tif'
                    if not slash.win()
                        @convertImage row
                    else
                        @columns[col].table.appendChild @fileInfo file
                when 'pxm'
                    if not slash.win()
                        @convertPXM row
                    else
                        @columns[col].table.appendChild @fileInfo file
                else
                    @columns[col].table.appendChild @fileInfo file

        post.emit 'load' column:col, item:item
                
        @updateColumnScrolls()

    # 000  00     00   0000000    0000000   00000000      000  000   000  00000000   0000000   
    # 000  000   000  000   000  000        000           000  0000  000  000       000   000  
    # 000  000000000  000000000  000  0000  0000000       000  000 0 000  000000    000   000  
    # 000  000 0 000  000   000  000   000  000           000  000  0000  000       000   000  
    # 000  000   000  000   000   0000000   00000000      000  000   000  000        0000000   
    
    imageInfo: (file) ->
            
        img = elem 'img' class:'browserImage' src:slash.fileUrl file
        cnt = elem class:'browserImageContainer' child:img
        cnt.addEventListener 'dblclick' => clearTimeout @openViewerTimer; open file
        cnt.addEventListener 'click' => clearTimeout @openViewerTimer; @openViewerTimer = setTimeout (=> @lastDirColumn()?.openViewer()), 500
                    
        img.onload = ->
            img =$ '.browserImage'
            br = img.getBoundingClientRect()
            x = img.clientX
            width  = parseInt br.right - br.left - 2
            height = parseInt br.bottom - br.top - 2

            img.style.opacity   = '1'
            img.style.maxWidth  = '100%'
            
            stat = slash.fileExists file
            size = pbytes(stat.size).split ' '
            
            age = moment().to(moment(stat.mtime), true)
            [num, range] = age.split ' '
            num = '1' if num[0] == 'a'
            
            html  = "<tr><th colspan=2>#{width}<span class='punct'>x</span>#{height}</th></tr>"
            html += "<tr><th>#{size[0]}</th><td>#{size[1]}</td></tr>"
            html += "<tr><th>#{num}</th><td>#{range}</td></tr>"
            
            info = elem class:'browserFileInfo' children: [
                elem 'div' class:"fileInfoFile #{slash.ext file}" html:File.span file
                elem 'table' class:"fileInfoData" html:html
            ]
            cnt =$ '.browserImageContainer'
            cnt.appendChild info
        
        cnt
    
    # 00000000  000  000      00000000        000  000   000  00000000   0000000   
    # 000       000  000      000             000  0000  000  000       000   000  
    # 000000    000  000      0000000         000  000 0 000  000000    000   000  
    # 000       000  000      000             000  000  0000  000       000   000  
    # 000       000  0000000  00000000        000  000   000  000        0000000   
        
    fileInfo: (file) ->
        
        stat = slash.fileExists file
        size = pbytes(stat.size).split ' '
        
        t = moment stat.mtime

        age = moment().to(t, true)
        [num, range] = age.split ' '
        num = '1' if num[0] == 'a'
        if range == 'few'
            num = moment().diff t, 'seconds'
            range = 'seconds'
        
        info = elem class:'browserFileInfo' children: [
            elem 'div' class:"fileInfoIcon #{slash.ext file} #{File.iconClassName file}"
            elem 'div' class:"fileInfoFile #{slash.ext file}" html:File.span file
            elem 'table' class:"fileInfoData" html:"<tr><th>#{size[0]}</th><td>#{size[1]}</td></tr><tr><th>#{num}</th><td>#{range}</td></tr>"
        ]
        
        info.addEventListener 'dblclick' => clearTimeout @openViewerTimer; open file
        info.addEventListener 'click' => clearTimeout @openViewerTimer; @openViewerTimer = setTimeout (=> @lastDirColumn()?.openViewer()), 500
        
        info
        
    # 0000000    000  00000000   000  000000000  00000000  00     00
    # 000   000  000  000   000  000     000     000       000   000
    # 000   000  000  0000000    000     000     0000000   000000000
    # 000   000  000  000   000  000     000     000       000 0 000
    # 0000000    000  000   000  000     000     00000000  000   000

    loadDirItem: (item, col=0, opt={}) ->

        return if col > 0 and item.name == '/'

        dir = item.file

        opt.ignoreHidden = not prefs.get "browser▸showHidden▸#{dir}"

        slash.list dir, opt, (items) =>

            if @skipOnDblClick
                delete @skipOnDblClick
                if col > 0
                    return 
                
            @loadDirItems dir, item, items, col, opt
            
            @updateColumnScrolls()
                            
    loadDirItems: (dir, item, items, col, opt) =>

        updir = slash.resolve slash.join dir, '..'

        if col == 0 or col-1 < @numCols() and @columns[col-1].activeRow()?.item.name == '..'
            if items[0]?.name not in ['..' '/']
                if updir != dir
                    items.unshift
                        name: '..'
                        type: 'dir'
                        file:  updir

        while col >= @numCols()
            @addColumn()

        @columns[col].loadItems items, item

        post.emit 'load' column:col, item:item
                            
        if opt.activate
            if row = @columns[col].row slash.file opt.activate
                row.activate()
                post.emit 'load' column:col+1 item:row.item
        else if opt.active
            @columns[col].row(slash.file opt.active)?.setActive()
            
        if opt.focus != false and empty(document.activeElement) and empty($('.popup')?.outerHTML)
            if lastColumn = @lastDirColumn()
                lastColumn.focus()
                
        opt.cb? column:col, item:item

        if col >= 2 and @columns[0].width() < 250
            @columns[1].makeRoot()

    #  0000000   000   000  00000000  000  000      00000000
    # 000   000  0000  000  000       000  000      000
    # 000   000  000 0 000  000000    000  000      0000000
    # 000   000  000  0000  000       000  000      000
    #  0000000   000   000  000       000  0000000  00000000

    onFile: (file) =>

        return if not file
        return if not @flex

        @navigateToFile file

    onOpenFile: (file) =>
        
        open file
        
    #  0000000   0000000   000      000   000  00     00  000   000   0000000
    # 000       000   000  000      000   000  000   000  0000  000  000
    # 000       000   000  000      000   000  000000000  000 0 000  0000000
    # 000       000   000  000      000   000  000 0 000  000  0000       000
    #  0000000   0000000   0000000   0000000   000   000  000   000  0000000

    initColumns: ->

        super()

        @view.insertBefore @shelf.div, @view.firstChild
        @view.insertBefore @shelfResize, null

        @shelf.browserDidInitColumns()

        @setShelfSize @shelfSize

    columnAtPos: (pos) ->

        if column = super pos
            return column

        if elem.containsPos @shelf.div, pos
            return @shelf
            
    lastColumnPath: ->

        if lastColumn = @lastUsedColumn()
            return lastColumn.path()

    lastDirColumn: ->

        if lastColumn = @lastUsedColumn()
            if lastColumn.isDir()
                return lastColumn
            else
                return lastColumn.prevColumn()

    onBackspaceInColumn: (column) ->

        column.backspaceSearch()
        
    onDeleteInColumn: (column) -> 
    
        if column.searchDiv
            column.clearSearch()
        else
            column.moveToTrash()
        
    updateColumnScrolls: =>

        super()
        @shelf.scroll.update()

    #  0000000  000   000  00000000  000      00000000
    # 000       000   000  000       000      000
    # 0000000   000000000  0000000   000      000000
    #      000  000   000  000       000      000
    # 0000000   000   000  00000000  0000000  000

    onShelfDrag: (drag, event) =>

        shelfSize = clamp 0, 400, drag.pos.x
        @setShelfSize shelfSize

    setShelfSize: (@shelfSize) ->

        prefs.set 'shelf▸size' @shelfSize
        @shelfResize.style.left = "#{@shelfSize}px"
        @shelf.div.style.width = "#{@shelfSize}px"
        @cols.style.left = "#{@shelfSize}px"
        @updateColumnScrolls()

    toggleShelf: ->
        
        if @shelfSize < 1
            @setShelfSize 200
        else
            @lastUsedColumn()?.focus()
            @setShelfSize 0
            
        @updateColumnScrolls()
        
    refresh: =>

        if @lastUsedColumn()
            klog 'refresh' @lastUsedColumn()?.path()
            @navigateToFile @lastUsedColumn()?.path()

module.exports = FileBrowser
