###
 0000000   0000000  00000000    0000000   000      000      00000000  00000000
000       000       000   000  000   000  000      000      000       000   000
0000000   000       0000000    000   000  000      000      0000000   0000000
     000  000       000   000  000   000  000      000      000       000   000
0000000    0000000  000   000   0000000   0000000  0000000  00000000  000   000
###

{ stopEvent, clamp, drag, elem, klog, _ } = require 'kxk'

class Scroller

    @colors = {}
    
    @: (@column) ->

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
    visRows:   -> 1 + parseInt @column.browser.height() / @rowHeight()
    height:    -> @column.browser.height()
    rowHeight: -> @column.rowHeight()
    
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

    @colorForClass: (clss) ->
        
        if not @colors[clss]?
            
            div = elem class: clss
            document.body.appendChild div
            color = window.getComputedStyle(div).color
            @colors[clss] = color
            div.remove()
            
        return @colors[clss]
        
    @fadeColor: (a,b,f) ->
        
        av = @parseColor a
        bv = @parseColor b
        fv = [0,0,0]
        for i in [0...3]
            fv[i] = Math.round (1-f) * av[i] + f * bv[i]
        "rgb(#{fv[0]}, #{fv[1]}, #{fv[2]})"
       
    @parseColor: (c) ->
        
        if _.isString(c) and c.startsWith 'rgb'
            s = c.indexOf '('
            e = c.indexOf ')'
            c = c.slice s+1, e
            v = c.split ','
            return [parseInt(v[0]), parseInt(v[1]), parseInt(v[2])]
        
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
            
            longColor  = Scroller.colorForClass 'scroller long'
            shortColor = Scroller.colorForClass 'scroller short'
            cf = 1 - clamp 0, 1, (scrollHeight-10)/200
            cs = Scroller.fadeColor longColor, shortColor, cf
            @handle.style.backgroundColor = cs

        if @column.parent?.type == 'preview'
            if @column.prevColumn?().div.scrollTop != @target.scrollTop
                @column.prevColumn().div.scrollTop = @target.scrollTop
        else if @column.nextColumn?()?.parent?.type == 'preview'
            if @column.nextColumn().div.scrollTop != @target.scrollTop
                @column.nextColumn().div.scrollTop = @target.scrollTop
            
        @handle.style.right = "-#{@target.scrollLeft}px"

module.exports = Scroller
