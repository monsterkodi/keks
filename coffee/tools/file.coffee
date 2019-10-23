###
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
###

{ slash, valid, klog, fs, kerror } = require 'kxk'

icons  = require './icons.json'
unused = require 'unused-filename'

class File
    
    @isImage: (file) -> slash.ext(file) in ['gif' 'png' 'jpg' 'jpeg' 'svg' 'bmp' 'ico']
    @isText:  (file) -> slash.ext(file) in ['koffee' 'coffee' 'styl' 'swift' 'pug' 'md' 'noon' 'txt' 'json' 'sh' 'py' 'cpp' 'cc' 'c' 'cs' 'css' 'h' 'hpp' 'html' 'ts' 'js']
    
    @rename: (from, to, cb) ->
        
        fs.mkdir slash.dir(to), recursive:true, (err) ->
            
            return kerror "mkdir failed #{err}" if err
            
            if slash.isDir(to)
                to = slash.join to, slash.file from

            fs.move from, to, overwrite:true, (err) ->
                return kerror "rename failed #{err}" if err
                cb from, to

    @duplicate: (from, cb) -> 

        unused(from).then (target) =>          
            @copy from, target, cb
    
    @copy: (from, to, cb) ->
        
        if slash.isDir(to)
            to = slash.join to, slash.file from

        # klog "copy #{from} #{to}"
        fs.copy from, to, (err) ->
            return kerror "copy failed #{err}" if err
            cb from, to
                
    # 000   0000000   0000000   000   000  
    # 000  000       000   000  0000  000  
    # 000  000       000   000  000 0 000  
    # 000  000       000   000  000  0000  
    # 000   0000000   0000000   000   000  
    
    @iconClassName: (file) ->
        
        clss  = icons.ext[slash.ext file]
        clss ?= icons.base[slash.base(file).toLowerCase()]
        clss ?= 'file'
        "icon #{clss}"
            
    #  0000000  00000000    0000000   000   000  
    # 000       000   000  000   000  0000  000  
    # 0000000   00000000   000000000  000 0 000  
    #      000  000        000   000  000  0000  
    # 0000000   000        000   000  000   000  
    
    @span: (text) ->
        
        base = slash.base text
        ext  = slash.ext(text).toLowerCase()
        clss = valid(ext) and ' '+ext or ''
        
        if base.startsWith '.' then clss += ' dotfile'
        
        span = "<span class='text#{clss}'>"+base+"</span>"
        
        if valid ext
            span += "<span class='ext punct#{clss}'>.</span>" + "<span class='ext text#{clss}'>"+ext+"</span>"
        span
        
    @crumbSpan: (file) ->
        
        return "<span>/</span>" if file in ['/' '']
        
        spans = []
        split = slash.split file
        
        for i in [0...split.length-1]
            s = split[i]
            spans.push "<div class='inline path' id='#{split[0..i].join '/'}'>#{s}</div>"
        spans.push "<div class='inline' id='#{file}'>#{split[-1]}</div>"
        spans.join "<span class='punct'>/</span>"
        
module.exports = File
