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
        
        # @active?.clearActive()
        
        for row in @rows ? []
            row.clearSelected()
            
        @rows = []
        @active = null
    
    toggle: (row) ->

        return if row == @active
        if row.column != @active.column
            @row row
            return
        
        if row.isSelected()
            row.clearSelected()
            @rows.splice @rows.indexOf(row), 1
        else
            row.setSelected()
            @rows.push row
    
    row: (row) -> 
                
        @clear()
        
        if @active?.column == row.column
            @active.clearActive()
        
        @rows = [row]
        @active = row
        row.setSelected()
        
        if not row.isActive()
            row.activate()
        
    to: (row) -> 
        
        return if row == @active
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
