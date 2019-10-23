###
00000000  000  000      00000000        00000000  0000000    000  000000000   0000000   00000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000000    000  000      0000000         0000000   000   000  000     000     000   000  0000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000       000  0000000  00000000        00000000  0000000    000     000      0000000   000   000
###

{ post, stopEvent, setStyle, srcmap, popup, prefs, slash, empty, clamp, kpos, fs, klog, kerror, _ } = require 'kxk'

Watcher    = require '../tools/watcher'
TextEditor = require './texteditor'
Syntax     = require './syntax'
Menu       = require './menu'
electron   = require 'electron'
remote     = electron.remote
dialog     = remote.dialog

class FileEditor extends TextEditor

    @: (viewElem) ->

        super viewElem,
            features: [
                'Diffbar'
                'Scrollbar'
                'Numbers'
                'Minimap'
                'Meta'
                'Autocomplete'
                'Brackets'
                'Strings'
                'CursorLine'
            ],
            fontSize: 19

        @currentFile = null
        @watch       = null

        @view.addEventListener 'contextmenu' @onContextMenu

        @initPigments()
        @initInvisibles()

        @setText ''

    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000

    changed: (changeInfo) =>

        super changeInfo
        @updateDirty()
        
    updateDirty: ->
        
        dirty = @do.hasLineChanges()
        if @dirty != dirty
            @dirty = dirty
            post.emit 'dirty' @dirty

    # 00000000  000  000      00000000
    # 000       000  000      000
    # 000000    000  000      0000000
    # 000       000  000      000
    # 000       000  0000000  00000000

    clear: ->

        @setSalterMode false
        @stopWatcher()
        @diffbar?.clear()
        @meta?.clear()
        @setLines ['']
        @do.reset()
        @updateDirty()

    revert: -> 
    
        @saveScrollCursorsAndSelections()
        @setCurrentFile @currentFile
        
    setCurrentFile: (file) ->

        @clear()
        @stopWatcher()

        @currentFile = file

        @setupFileType()

        if @currentFile? and slash.fileExists @currentFile
            @setText slash.readText @currentFile
            @watch = new Watcher @currentFile

        @emit 'file' @currentFile # diffbar, pigments, ...
        @restoreScrollCursorsAndSelections()

    stopWatcher: ->

        @watch?.stop()
        @watch = null

    # 000000000  000   000  00000000   00000000
    #    000      000 000   000   000  000
    #    000       00000    00000000   0000000
    #    000        000     000        000
    #    000        000     000        00000000

    shebangFileType: ->

        fileType = Syntax.shebang @line(0) if @numLines()
        if fileType == 'txt'
            if @currentFile?
                ext = slash.ext @currentFile
                if ext in Syntax.syntaxNames
                    return ext
        else if fileType
            return fileType

        super()

    #  0000000   0000000   000   000  00000000
    # 000       000   000  000   000  000
    # 0000000   000000000   000 000   0000000
    #      000  000   000     000     000
    # 0000000   000   000      0      00000000

    save: ->
                
        slash.writeText @currentFile, @text(), =>
            @do.reset()
            @updateDirty()
        
    saveAs: ->
    
        dialog.showSaveDialog(title:'Save File As' defaultPath:slash.unslash @currentFile).then (result) =>
            if not result.cancelled and result.filePath
                slash.writeText result.filePath, @text()
                post.emit 'navigateToFile' result.filePath
                    
    saveScrollCursorsAndSelections: (opt) ->

        return if not @currentFile
        s = {}

        s.main       = @state.main()
        s.cursors    = @state.cursors()    if @numCursors() > 1 or @cursorPos()[0] or @cursorPos()[1]
        s.selections = @state.selections() if @numSelections()
        s.highlights = @state.highlights() if @numHighlights()

        s.scroll = @scroll.scroll if @scroll.scroll

        filePositions = prefs.get 'filePositions' Object.create null
        if not _.isPlainObject filePositions
            filePositions = Object.create null
        filePositions[@currentFile] = s
        prefs.set 'filePositions' filePositions

    # 00000000   00000000   0000000  000000000   0000000   00000000   00000000
    # 000   000  000       000          000     000   000  000   000  000
    # 0000000    0000000   0000000      000     000   000  0000000    0000000
    # 000   000  000            000     000     000   000  000   000  000
    # 000   000  00000000  0000000      000      0000000   000   000  00000000

    restoreScrollCursorsAndSelections: ->

        return if not @currentFile

        filePositions = prefs.get 'filePositions' {}

        if filePositions[@currentFile]?

            s = filePositions[@currentFile]

            cursors = s.cursors ? [[0,0]]
            cursors = cursors.map (c) => [c[0], clamp(0,@numLines()-1,c[1])]

            @setCursors    cursors
            @setSelections s.selections ? []
            @setHighlights s.highlights ? []
            @setMain       s.main ? 0
            @setState @state

            @syntax.fillDiss @mainCursor()[1]

            @scroll.to s.scroll if s.scroll
            @scroll.cursorIntoView()

        else

            @singleCursorAtPos [0,0]
            @scroll.top = 0 if @mainCursor()[1] == 0
            @scroll.bot = @scroll.top-1
            @scroll.to 0
            @scroll.cursorIntoView()

        @updateLayers()
        @numbers?.updateColors()
        @minimap.onEditorScroll()
        @emit 'cursor'
        @emit 'selection'

    #  0000000  00000000  000   000  000000000  00000000  00000000
    # 000       000       0000  000     000     000       000   000
    # 000       0000000   000 0 000     000     0000000   0000000
    # 000       000       000  0000     000     000       000   000
    #  0000000  00000000  000   000     000     00000000  000   000

    centerText: (center, animate=300) ->

        @size.centerText = center
        @updateLayers()

        @size.offsetX = Math.floor @size.charWidth/2 + @size.numbersWidth
        if center
            br        = @view.getBoundingClientRect()
            visCols   = parseInt br.width / @size.charWidth
            newOffset = parseInt @size.charWidth * (visCols - 100) / 2
            @size.offsetX = Math.max @size.offsetX, newOffset
            @size.centerText = true
        else
            @size.centerText = false

        @updateLinePositions animate

        if animate
            layers = ['.selections' '.highlights' '.cursors']
            transi = ['.selection'  '.highlight'  '.cursor' ].concat layers
            resetTrans = =>
                setStyle '.editor .layers '+l, 'transform' "translateX(0)" for l in layers
                setStyle '.editor .layers '+t, 'transition' "initial" for t in transi
                @updateLayers()

            if center
                offsetX = @size.offsetX - @size.numbersWidth - @size.charWidth/2
            else
                offsetX = Math.floor @size.charWidth/2 + @size.numbersWidth
                offsetX = Math.max offsetX, (@screenSize().width - @screenSize().height) / 2
                offsetX -= @size.numbersWidth + @size.charWidth/2
                offsetX *= -1

            setStyle '.editor .layers '+l, 'transform' "translateX(#{offsetX}px)" for l in layers
            setStyle '.editor .layers '+t, 'transition' "all #{animate/1000}s" for t in transi
            setTimeout resetTrans, animate
        else
            @updateLayers()

    # 00000000    0000000   00000000   000   000  00000000
    # 000   000  000   000  000   000  000   000  000   000
    # 00000000   000   000  00000000   000   000  00000000
    # 000        000   000  000        000   000  000
    # 000         0000000   000         0000000   000

    onContextMenu: (event) => stopEvent event, @showContextMenu kpos event

    showContextMenu: (absPos) =>

        if not absPos?
            absPos = kpos @view.getBoundingClientRect().left, @view.getBoundingClientRect().top

        popup.menu 
            items: [
                text:'Close Editor' combo:'ctrl+w'
            ,
                text:''
            ].concat Menu()
            x: absPos.x
            y: absPos.y

    #  0000000  000      000   0000000  000   000
    # 000       000      000  000       000  000
    # 000       000      000  000       0000000
    # 000       000      000  000       000  000
    #  0000000  0000000  000   0000000  000   000

    clickAtPos: (p, event) ->

        if event.metaKey
            if kpos(event).x <= @size.numbersWidth
                @singleCursorAtPos p
                return

        super p, event

module.exports = FileEditor
