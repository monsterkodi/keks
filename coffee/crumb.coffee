###
 0000000  00000000   000   000  00     00  0000000  
000       000   000  000   000  000   000  000   000
000       0000000    000   000  000000000  0000000  
000       000   000  000   000  000 0 000  000   000
 0000000  000   000   0000000   000   000  0000000  
###

{ slash, elem, kpos, klog, $ } = require 'kxk'

File = require './tools/file'

class Crumb

    @: (@column) ->
        
        @elem = elem class:'crumb'
        @elem.columnIndex = @column.index
        @elem.addEventListener 'mousedown' @onMouseDown
        @elem.addEventListener 'mouseup' @onMouseUp
        $('crumbs').appendChild @elem

    onMouseDown: (event) =>
        
        @downPos = kpos window.win.getBounds()
            
    onMouseUp: (event) =>
        
        upPos = kpos window.win.getBounds()
        
        return if upPos.to(@downPos).length() > 0
        
        if @column.index == 0
            if event.target.id
                @column.browser.browse event.target.id
            else
                root = @elem.firstChild
                br = root.getBoundingClientRect()
                if kpos(event).x < br.left
                    @column.browser.browse root.id
                else
                    @column.browser.browse @column.parent.file
        else
            @column.makeRoot()
        
    setFile: (file) ->
        
        if @column.index == 0
            @elem.innerHTML = File.crumbSpan slash.tilde file
        else
            @elem.innerHTML = slash.base file
        
    clear: -> @elem.innerHTML = ''
    
    updateRect: (br) ->
        
        @elem.style.left = "#{br.left}px"
        if @column.index == @column.browser.numCols()-1
            width = br.right - br.left - 135
            @elem.style.width = "#{width}px"
            if width < 50
                @elem.style.display = 'none'
            else
                @elem.style.display = null
        else
            @elem.style.width = "#{br.right - br.left}px"
        
module.exports = Crumb
