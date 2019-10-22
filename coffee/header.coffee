###
000   000  00000000   0000000   0000000    00000000  00000000   
000   000  000       000   000  000   000  000       000   000  
000000000  0000000   000000000  000   000  0000000   0000000    
000   000  000       000   000  000   000  000       000   000  
000   000  00000000  000   000  0000000    00000000  000   000  
###

{ slash, elem, kpos, klog, $ } = require 'kxk'

File = require './tools/file'

class Header

    @: (@browser) ->
        
        @elem = elem class:'header'
        @elem.addEventListener 'mousedown' @onMouseDown
        @elem.addEventListener 'mouseup'   @onMouseUp
        $('crumbs').appendChild @elem
        
        @crumb = elem class:'crumb'
        @elem.appendChild @crumb

    del: -> @elem.remove()
    
    onMouseDown: (event) =>
        
        @downPos = kpos window.win.getBounds()
            
    onMouseUp: (event) =>
        
        return if not @downPos
        
        upPos = kpos window.win.getBounds()
        
        if upPos.to(@downPos).length() > 0
            delete @downPos
            return
        
        if event.target.id
            @browser.browse event.target.id
        else
            root = @crumb.firstChild
            br = root.getBoundingClientRect()
            if kpos(event).x < br.left
                @browser.browse root.id
            else
                @browser.browse @file
            
        delete @downPos
        
    setFile: (@file) ->
        
        @crumb.innerHTML = File.crumbSpan slash.tilde @file
            
module.exports = Header
