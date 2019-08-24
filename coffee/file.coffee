###
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
###

{ slash, valid } = require 'kxk'

class File
    
    # 000   0000000   0000000   000   000  
    # 000  000       000   000  0000  000  
    # 000  000       000   000  000 0 000  
    # 000  000       000   000  000  0000  
    # 000   0000000   0000000   000   000  
    
    @iconClassName: (file) ->
        
        switch slash.ext file
            when 'noon'   then className = 'noon-icon'
            when 'koffee' then className = 'coffee-icon'
            when 'xcf'    then className = 'gimp-icon'
            else
                try
                    fileIcons = require 'file-icons-js'
                    className = fileIcons.getClass file
                catch err
                    true
        className ?= 'file-icon'
        className
            
    #  0000000  00000000    0000000   000   000  
    # 000       000   000  000   000  0000  000  
    # 0000000   00000000   000000000  000 0 000  
    #      000  000        000   000  000  0000  
    # 0000000   000        000   000  000   000  
    
    @span: (text) ->
        
        base = slash.base text
        ext  = slash.ext(text).toLowerCase()
        clss = valid(ext) and ' '+ext or ''
        span = "<span class='text#{clss}'>"+base+"</span>"
        if valid ext
            span += "<span class='ext punct#{clss}'>.</span>" + "<span class='ext text#{clss}'>"+ext+"</span>"
        span
        
module.exports = File
