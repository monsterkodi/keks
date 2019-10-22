###
000   000  000  00000000  000   000  00000000  00000000 
000   000  000  000       000 0 000  000       000   000
 000 000   000  0000000   000000000  0000000   0000000  
   000     000  000       000   000  000       000   000
    0      000  00000000  00     00  00000000  000   000
###

{ slash, empty, open, elem, stopEvent, keyinfo, klog, $ } = require 'kxk'

dirlist = require './tools/dirlist'
File    = require './tools/file'
Header  = require './header'

class Viewer

    @: (@browser, path) ->
        
        if slash.isDir path
            
            dirlist path, (items) =>
    
                images = items.filter (item) -> File.isImage item.file
    
                return if empty images
                
                @loadImages images.map (item) -> item.file
        else
            if File.isImage path
                @loadImages [path]
                            
    loadImages: (images) ->
            
        @header = new Header @browser
        @header.setFile path
        
        @div = elem class:'viewer' tabindex:1
        
        @focus = document.activeElement
        
        for file in images
            
            img = elem 'img' class:'viewerImage' src:slash.fileUrl file
            cnt = elem class:'viewerImageContainer' child:img
            cnt.addEventListener 'dblclick' ((file) -> -> open file)(file)
            @div.appendChild cnt
        
            main =$ '#main'
            
        main.appendChild @div

        @div.addEventListener 'keydown' @onKey
        @div.focus()
            
    # 000   000  00000000  000   000  
    # 000  000   000        000 000   
    # 0000000    0000000     00000    
    # 000  000   000          000     
    # 000   000  00000000     000     
    
    onKey: (event) =>

        { mod, key, combo, char } = keyinfo.forEvent event

        switch combo
            when 'esc' 'space' then @close()
            # else klog 'combo' combo
            
        event.stopPropagation?()
            
    close: =>

        @browser.viewer = null
        @header.del()
        @div.remove()
        @focus.focus()

module.exports = Viewer
