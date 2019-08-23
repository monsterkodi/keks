###
 0000000   0000000  00000000    0000000   000      000      00000000  00000000
000       000       000   000  000   000  000      000      000       000   000
0000000   000       0000000    000   000  000      000      0000000   0000000
     000  000       000   000  000   000  000      000      000       000   000
0000000    0000000  000   000   0000000   0000000  0000000  00000000  000   000
###

{ stopEvent, clamp, drag, elem } = require 'kxk'

class Scroller

    constructor: (@column) ->

        @elem = elem class: 'scrollbar right'
        @column.div.insertBefore @elem, @column.table

        @handle = elem class: 'scrollhandle right'
        @elem.appendChild @handle

        @drag = new drag
            target:  @elem
            onStart: @onStart
            onMove:  @onDrag
            cursor:  'ns-resize'

        @elem.addEventListener       'wheel',  @onWheel
        @column.div.addEventListener 'wheel',  @onWheel
        @column.div.addEventListener 'scroll', @onScroll
        @target = @column.div
        
    numRows:   -> @column.numRows()
    visRows:   -> 1 + parseInt @column.browser.height() / @column.rowHeight()
    rowHeight: -> @column.rowHeight()
    height:    -> @column.browser.height()
    
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000
    # 0000000      000     000000000  0000000       000
    #      000     000     000   000  000   000     000
    # 0000000      000     000   000  000   000     000

    onStart: (drag, event) =>
        
        br = @elem.getBoundingClientRect()
        sy = clamp 0, @height(), event.clientY - br.top
        ln = parseInt @numRows() * sy/@height()
        ly = (ln - @visRows() / 2) * @rowHeight()
        @target.scrollTop = ly

    # 0000000    00000000    0000000    0000000
    # 000   000  000   000  000   000  000
    # 000   000  0000000    000000000  000  0000
    # 000   000  000   000  000   000  000   000
    # 0000000    000   000  000   000   0000000

    onDrag: (drag) =>
        
        delta = (drag.delta.y / (@visRows() * @rowHeight())) * @numRows() * @rowHeight()
        @target.scrollTop += delta
        @update()

    # 000   000  000   000  00000000  00000000  000
    # 000 0 000  000   000  000       000       000
    # 000000000  000000000  0000000   0000000   000
    # 000   000  000   000  000       000       000
    # 00     00  000   000  00000000  00000000  0000000

    onWheel: (event) =>
        
        if Math.abs(event.deltaX) >= 2*Math.abs(event.deltaY) or Math.abs(event.deltaY) == 0
            @target.scrollLeft += event.deltaX
        else
            @target.scrollTop += event.deltaY
        stopEvent event    
        
    onScroll: (event) => @update()

    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000
    # 000   000  00000000   000   000  000000000     000     0000000
    # 000   000  000        000   000  000   000     000     000
    #  0000000   000        0000000    000   000     000     00000000

    toIndex: (i) ->
        
        row = @column.rows[i].div
        newTop = @target.scrollTop
        if newTop < row.offsetTop + @rowHeight() - @height()
            newTop = row.offsetTop + @rowHeight() - @height()
        else if newTop > row.offsetTop
            newTop = row.offsetTop
        @target.scrollTop = parseInt newTop
        @update()

    update: =>
        
        if @numRows() * @rowHeight() < @height()
            
            @elem.style.display   = 'none'
            @elem.style.top       = "0"
            @handle.style.top     = "0"
            @handle.style.height  = "0"
            @handle.style.width   = "0"
            
        else
            @elem.style.display   = 'block'
            bh           = @numRows() * @rowHeight()
            vh           = Math.min (@visRows() * @rowHeight()), @height()
            scrollTop    = parseInt (@target.scrollTop / bh) * vh
            scrollHeight = parseInt ((@visRows() * @rowHeight()) / bh) * vh
            scrollHeight = Math.max scrollHeight, parseInt @rowHeight()/4
            scrollTop    = Math.min scrollTop, @height()-scrollHeight
            scrollTop    = Math.max 0, scrollTop

            @elem.style.top = "#{@target.scrollTop}px"

            @handle.style.top     = "#{scrollTop}px"
            @handle.style.height  = "#{scrollHeight}px"
            @handle.style.width   = "2px"
            
            # longColor  = scheme.colorForClass 'scroller long'
            # shortColor = scheme.colorForClass 'scroller short'
            # cf = 1 - clamp 0, 1, (scrollHeight-10)/200
            # cs = scheme.fadeColor longColor, shortColor, cf
            # @handle.style.backgroundColor = cs

        if @column.parent?.type == 'preview'
            if @column.prevColumn?().div.scrollTop != @target.scrollTop
                @column.prevColumn().div.scrollTop = @target.scrollTop
        else if @column.nextColumn?()?.parent?.type == 'preview'
            if @column.nextColumn().div.scrollTop != @target.scrollTop
                @column.nextColumn().div.scrollTop = @target.scrollTop
            
        @handle.style.right = "-#{@target.scrollLeft}px"

module.exports = Scroller
