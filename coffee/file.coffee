###
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
###

{ slash } = require 'kxk'

class File
    
    @iconClassName: (file) ->
        
        switch slash.ext file
            when 'noon'   then className = 'noon-icon'
            when 'koffee' then className = 'coffee-icon'
            when 'xcf'    then className = 'image-icon'
            else
                try
                    fileIcons = require 'file-icons-js'
                    className = fileIcons.getClass file
                catch err
                    true
        className ?= 'file-icon'
        className
            
module.exports = File
