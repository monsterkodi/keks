###
 0000000  00000000  000      00000000   0000000  000000000
000       000       000      000       000          000   
0000000   0000000   000      0000000   000          000   
     000  000       000      000       000          000   
0000000   00000000  0000000  00000000   0000000     000   
###

{ klog } = require 'kxk'

class Select

    @: (@browser) -> 
    
        @rows = []
        @active = null
        
    files: -> 
    
        rows = @rows.filter (row) -> row.item.name != '..'
        rows.map (row) -> row.item.file
        
    freeIndex: ->
        
        return -1 if not @active
        
        index = @active.index()
        while index < @active.column.numRows()-1
            index += 1
            if not @active.column.rows[index].isSelected()
                return index
             
        index = @active.index()
        while index > 0
            index -= 1
            if not @active.column.rows[index].isSelected()
                return index
        -1
        
    clear: ->
                
        for row in @rows ? []
            row.clearSelected()
            
        @rows = []
        @active = null
    
    toggle: (row) ->

        # return if row == @active
            
        if row.column != @active.column
            @row row
            return
        
        if row.isSelected()
            
            klog 'unselect' row.item.file
            
            row.clearActive()
            row.clearSelected()            
            @rows.splice @rows.indexOf(row), 1
        else
            row.setSelected()
            @active = row
            @rows.push row
    
    row: (row, activate=true) ->
                
        if @active?.column == row.column and activate
            @active?.clearActive()
        
        @clear()
                        
        @rows = [row]
        @active = row
        row.setSelected()
        
        if not row.isActive() and activate
            row.activate()
            
    to: (row) -> 
        
        return if row == @active
        return if not @active
        
        if row.column != @active.column
            @row row
            return
        
        if row.index() > @active.index()
            from = @active.index()+1
            to   = row.index()
        else
            from = row.index()
            to   = @active.index()-1
            
        for index in [from..to]
            row = @active.column.rows[index]
            if not row.isSelected() 
                row.setSelected()
                @rows.push row

module.exports = Select
