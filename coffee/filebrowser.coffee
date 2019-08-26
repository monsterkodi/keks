###
00000000  000  000      00000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000
000       000  000      000             000   000  000   000  000   000  000 0 000  000       000       000   000
000000    000  000      0000000         0000000    0000000    000   000  000000000  0000000   0000000   0000000
000       000  000      000             000   000  000   000  000   000  000   000       000  000       000   000
000       000  0000000  00000000        0000000    000   000   0000000   00     00  0000000   00000000  000   000
###

{ post, open, valid, empty, clamp, prefs, last, elem, drag, state, klog, slash, fs, os, $, _ } = require 'kxk'

Browser  = require './browser'
Shelf    = require './shelf'
File     = require './file'
dirlist  = require './dirlist'
pbytes   = require 'pretty-bytes'
moment   = require 'moment'

class FileBrowser extends Browser

    constructor: (view) ->

        super view

        window.filebrowser = @

        @loadID = 0
        @shelf  = new Shelf @
        @name   = 'FileBrowser'

        post.on 'file'        @onFile
        post.on 'filebrowser' @onFileBrowser
        post.on 'openFile'    @onOpenFile

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
                # klog 'col' col, column.path()
            else
                break
        if col == 1 and slash.dir(file) != @columns[0]?.path()
            return 0
        Math.max -1, col-2

    navigateToFile: (file) ->
                
        lastPath = @lastDirColumn()?.path()
        
        file = slash.path file
        
        if file == lastPath or slash.isRelative file
            # klog 'skip' file, lastPath
            return

        col = @sharedColumnIndex file
        
        # klog 'navigateToFile' file, col
        
        filelist = slash.pathlist file
        
        if col >= 0
            # for c in [0..col]
                # klog 'keep' c, @columns[c].path()                
            paths = filelist.slice filelist.indexOf(@columns[col].path())+1
        else
            # klog 'load in root' 
            paths = filelist.slice filelist.length-2
        # klog 'load' paths
            
        @popColumnsFrom   col+1+paths.length
        @clearColumnsFrom col+1
        
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
                    # else if col == 0 == index and paths.length == 1
                        # opt.active = paths[0]
                    @loadDirItem item, col+1+index, opt
                    
        if col = @lastDirColumn()
            
            # klog 'col' col.index, col.parent.file
            if row = col.row(slash.file file)
                # klog 'activate' row.column.index, row.item.file
                row.setActive()

        @emit 'itemActivated' @fileItem last paths
        
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
            when 'activateItem' then @activateItem item, arg
    
    # 000       0000000    0000000   0000000    000  000000000  00000000  00     00
    # 000      000   000  000   000  000   000  000     000     000       000   000
    # 000      000   000  000000000  000   000  000     000     0000000   000000000
    # 000      000   000  000   000  000   000  000     000     000       000 0 000
    # 0000000   0000000   000   000  0000000    000     000     00000000  000   000

    loadDir: (path) -> @loadItem type:'dir' file:path
    
    loadItem: (item, opt) ->

        opt ?= {}
        item.name ?= slash.file item.file

        @popColumnsFrom 1

        switch item.type
            when 'file' then @loadFileItem item
            when 'dir'  then @loadDirItem  item, 0, active:'..'

        if opt.focus
            @columns[0]?.focus()

    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000
    # 000   000  000          000     000  000   000  000   000     000     000
    # 000000000  000          000     000   000 000   000000000     000     0000000
    # 000   000  000          000     000     000     000   000     000     000
    # 000   000   0000000     000     000      0      000   000     000     00000000

    activateItem: (item, col) ->

        @clearColumnsFrom col+1, pop:true

        switch item.type
            when 'dir'  then @loadDirItem  item, col+1, focus:false
            when 'file' then @loadFileItem item, col+1

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

        switch slash.ext file
            when 'gif' 'png' 'jpg' 'jpeg' 'svg' 'bmp' 'ico'
                cnt = elem class: 'browserImageContainer' child: elem 'img' class: 'browserImage' src: slash.fileUrl file
                cnt.addEventListener 'dblclick' -> open file
                @columns[col].table.appendChild cnt
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
                    
        @updateColumnScrolls()

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
        
        info.addEventListener 'dblclick' -> open file
        
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

        dirlist dir, opt, (err, items) =>

            if err? then return

            post.toMain 'dirLoaded' dir

            @loadDirItems dir, item, items, col, opt
            post.emit 'dir' dir

            @updateColumnScrolls()
                            
    loadDirItems: (dir, item, items, col, opt) =>

        updir = slash.resolve slash.join dir, '..'

        if col == 0 or col-1 < @numCols() and @columns[col-1].activeRow()?.item.name == '..'
            if items[0].name not in ['..' '/']
                if updir != dir
                    items.unshift
                        name: '..'
                        type: 'dir'
                        file:  updir

        while col >= @numCols()
            @addColumn()

        @columns[col].loadItems items, item

        if opt.active
            @columns[col].row(slash.file opt.active)?.setActive()
            
        if opt.focus != false and empty(document.activeElement) and empty($('.popup')?.outerHTML)
            if col = @lastDirColumn()
                col.div.focus()

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

        column.clearSearch()
        @navigate 'left'

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
            @navigateToFile @lastUsedColumn()?.path()

module.exports = FileBrowser
