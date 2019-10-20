// koffee 1.4.0

/*
 0000000  00000000  000      00000000   0000000  000000000
000       000       000      000       000          000   
0000000   0000000   000      0000000   000          000   
     000  000       000      000       000          000   
0000000   00000000  0000000  00000000   0000000     000
 */
var Select, klog;

klog = require('kxk').klog;

Select = (function() {
    function Select(browser) {
        this.browser = browser;
        this.rows = [];
        this.active = null;
    }

    Select.prototype.files = function() {
        var rows;
        rows = this.rows.filter(function(row) {
            return row.item.name !== '..';
        });
        return rows.map(function(row) {
            return row.item.file;
        });
    };

    Select.prototype.freeIndex = function() {
        var index;
        if (!this.active) {
            return -1;
        }
        index = this.active.index();
        while (index < this.active.column.numRows() - 1) {
            index += 1;
            if (!this.active.column.rows[index].isSelected()) {
                return index;
            }
        }
        index = this.active.index();
        while (index > 0) {
            index -= 1;
            if (!this.active.column.rows[index].isSelected()) {
                return index;
            }
        }
        return -1;
    };

    Select.prototype.clear = function() {
        var i, len, ref, ref1, row;
        ref1 = (ref = this.rows) != null ? ref : [];
        for (i = 0, len = ref1.length; i < len; i++) {
            row = ref1[i];
            row.clearSelected();
        }
        this.rows = [];
        return this.active = null;
    };

    Select.prototype.toggle = function(row) {
        if (row.column !== this.active.column) {
            this.row(row);
            return;
        }
        if (row.isSelected()) {
            klog('unselect', row.item.file);
            row.clearActive();
            row.clearSelected();
            return this.rows.splice(this.rows.indexOf(row), 1);
        } else {
            row.setSelected();
            this.active = row;
            return this.rows.push(row);
        }
    };

    Select.prototype.row = function(row, activate) {
        var ref, ref1;
        if (activate == null) {
            activate = true;
        }
        if (((ref = this.active) != null ? ref.column : void 0) === row.column && activate) {
            if ((ref1 = this.active) != null) {
                ref1.clearActive();
            }
        }
        this.clear();
        this.rows = [row];
        this.active = row;
        row.setSelected();
        if (!row.isActive() && activate) {
            return row.activate();
        }
    };

    Select.prototype.to = function(row) {
        var from, i, index, ref, ref1, results, to;
        if (row === this.active) {
            return;
        }
        if (!this.active) {
            return;
        }
        if (row.column !== this.active.column) {
            this.row(row);
            return;
        }
        if (row.index() > this.active.index()) {
            from = this.active.index() + 1;
            to = row.index();
        } else {
            from = row.index();
            to = this.active.index() - 1;
        }
        results = [];
        for (index = i = ref = from, ref1 = to; ref <= ref1 ? i <= ref1 : i >= ref1; index = ref <= ref1 ? ++i : --i) {
            row = this.active.column.rows[index];
            if (!row.isSelected()) {
                row.setSelected();
                results.push(this.rows.push(row));
            } else {
                results.push(void 0);
            }
        }
        return results;
    };

    return Select;

})();

module.exports = Select;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRRSxPQUFTLE9BQUEsQ0FBUSxLQUFSOztBQUVMO0lBRUMsZ0JBQUMsT0FBRDtRQUFDLElBQUMsQ0FBQSxVQUFEO1FBRUEsSUFBQyxDQUFBLElBQUQsR0FBUTtRQUNSLElBQUMsQ0FBQSxNQUFELEdBQVU7SUFIWDs7cUJBS0gsS0FBQSxHQUFPLFNBQUE7QUFFSCxZQUFBO1FBQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixDQUFhLFNBQUMsR0FBRDttQkFBUyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQVQsS0FBaUI7UUFBMUIsQ0FBYjtlQUNQLElBQUksQ0FBQyxHQUFMLENBQVMsU0FBQyxHQUFEO21CQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFBbEIsQ0FBVDtJQUhHOztxQkFLUCxTQUFBLEdBQVcsU0FBQTtBQUVQLFlBQUE7UUFBQSxJQUFhLENBQUksSUFBQyxDQUFBLE1BQWxCO0FBQUEsbUJBQU8sQ0FBQyxFQUFSOztRQUVBLEtBQUEsR0FBUSxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBQTtBQUNSLGVBQU0sS0FBQSxHQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQWYsQ0FBQSxDQUFBLEdBQXlCLENBQXZDO1lBQ0ksS0FBQSxJQUFTO1lBQ1QsSUFBRyxDQUFJLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUssQ0FBQSxLQUFBLENBQU0sQ0FBQyxVQUEzQixDQUFBLENBQVA7QUFDSSx1QkFBTyxNQURYOztRQUZKO1FBS0EsS0FBQSxHQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFBO0FBQ1IsZUFBTSxLQUFBLEdBQVEsQ0FBZDtZQUNJLEtBQUEsSUFBUztZQUNULElBQUcsQ0FBSSxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFLLENBQUEsS0FBQSxDQUFNLENBQUMsVUFBM0IsQ0FBQSxDQUFQO0FBQ0ksdUJBQU8sTUFEWDs7UUFGSjtlQUlBLENBQUM7SUFmTTs7cUJBaUJYLEtBQUEsR0FBTyxTQUFBO0FBRUgsWUFBQTtBQUFBO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxHQUFHLENBQUMsYUFBSixDQUFBO0FBREo7UUFHQSxJQUFDLENBQUEsSUFBRCxHQUFRO2VBQ1IsSUFBQyxDQUFBLE1BQUQsR0FBVTtJQU5QOztxQkFRUCxNQUFBLEdBQVEsU0FBQyxHQUFEO1FBSUosSUFBRyxHQUFHLENBQUMsTUFBSixLQUFjLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBekI7WUFDSSxJQUFDLENBQUEsR0FBRCxDQUFLLEdBQUw7QUFDQSxtQkFGSjs7UUFJQSxJQUFHLEdBQUcsQ0FBQyxVQUFKLENBQUEsQ0FBSDtZQUVJLElBQUEsQ0FBSyxVQUFMLEVBQWdCLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBekI7WUFFQSxHQUFHLENBQUMsV0FBSixDQUFBO1lBQ0EsR0FBRyxDQUFDLGFBQUosQ0FBQTttQkFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sQ0FBYSxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQU4sQ0FBYyxHQUFkLENBQWIsRUFBaUMsQ0FBakMsRUFOSjtTQUFBLE1BQUE7WUFRSSxHQUFHLENBQUMsV0FBSixDQUFBO1lBQ0EsSUFBQyxDQUFBLE1BQUQsR0FBVTttQkFDVixJQUFDLENBQUEsSUFBSSxDQUFDLElBQU4sQ0FBVyxHQUFYLEVBVko7O0lBUkk7O3FCQW9CUixHQUFBLEdBQUssU0FBQyxHQUFELEVBQU0sUUFBTjtBQUVELFlBQUE7O1lBRk8sV0FBUzs7UUFFaEIsc0NBQVUsQ0FBRSxnQkFBVCxLQUFtQixHQUFHLENBQUMsTUFBdkIsSUFBa0MsUUFBckM7O29CQUNXLENBQUUsV0FBVCxDQUFBO2FBREo7O1FBR0EsSUFBQyxDQUFBLEtBQUQsQ0FBQTtRQUVBLElBQUMsQ0FBQSxJQUFELEdBQVEsQ0FBQyxHQUFEO1FBQ1IsSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUNWLEdBQUcsQ0FBQyxXQUFKLENBQUE7UUFFQSxJQUFHLENBQUksR0FBRyxDQUFDLFFBQUosQ0FBQSxDQUFKLElBQXVCLFFBQTFCO21CQUNJLEdBQUcsQ0FBQyxRQUFKLENBQUEsRUFESjs7SUFYQzs7cUJBY0wsRUFBQSxHQUFJLFNBQUMsR0FBRDtBQUVBLFlBQUE7UUFBQSxJQUFVLEdBQUEsS0FBTyxJQUFDLENBQUEsTUFBbEI7QUFBQSxtQkFBQTs7UUFDQSxJQUFVLENBQUksSUFBQyxDQUFBLE1BQWY7QUFBQSxtQkFBQTs7UUFFQSxJQUFHLEdBQUcsQ0FBQyxNQUFKLEtBQWMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUF6QjtZQUNJLElBQUMsQ0FBQSxHQUFELENBQUssR0FBTDtBQUNBLG1CQUZKOztRQUlBLElBQUcsR0FBRyxDQUFDLEtBQUosQ0FBQSxDQUFBLEdBQWMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQUEsQ0FBakI7WUFDSSxJQUFBLEdBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQUEsQ0FBQSxHQUFnQjtZQUN2QixFQUFBLEdBQU8sR0FBRyxDQUFDLEtBQUosQ0FBQSxFQUZYO1NBQUEsTUFBQTtZQUlJLElBQUEsR0FBTyxHQUFHLENBQUMsS0FBSixDQUFBO1lBQ1AsRUFBQSxHQUFPLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFBLENBQUEsR0FBZ0IsRUFMM0I7O0FBT0E7YUFBYSx1R0FBYjtZQUNJLEdBQUEsR0FBTSxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFLLENBQUEsS0FBQTtZQUMxQixJQUFHLENBQUksR0FBRyxDQUFDLFVBQUosQ0FBQSxDQUFQO2dCQUNJLEdBQUcsQ0FBQyxXQUFKLENBQUE7NkJBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLENBQVcsR0FBWCxHQUZKO2FBQUEsTUFBQTtxQ0FBQTs7QUFGSjs7SUFoQkE7Ozs7OztBQXNCUixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgIFxuMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgIFxuMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgIFxuIyMjXG5cbnsga2xvZyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBTZWxlY3RcblxuICAgIEA6IChAYnJvd3NlcikgLT4gXG4gICAgXG4gICAgICAgIEByb3dzID0gW11cbiAgICAgICAgQGFjdGl2ZSA9IG51bGxcbiAgICAgICAgXG4gICAgZmlsZXM6IC0+IFxuICAgIFxuICAgICAgICByb3dzID0gQHJvd3MuZmlsdGVyIChyb3cpIC0+IHJvdy5pdGVtLm5hbWUgIT0gJy4uJ1xuICAgICAgICByb3dzLm1hcCAocm93KSAtPiByb3cuaXRlbS5maWxlXG4gICAgICAgIFxuICAgIGZyZWVJbmRleDogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAtMSBpZiBub3QgQGFjdGl2ZVxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBAYWN0aXZlLmluZGV4KClcbiAgICAgICAgd2hpbGUgaW5kZXggPCBAYWN0aXZlLmNvbHVtbi5udW1Sb3dzKCktMVxuICAgICAgICAgICAgaW5kZXggKz0gMVxuICAgICAgICAgICAgaWYgbm90IEBhY3RpdmUuY29sdW1uLnJvd3NbaW5kZXhdLmlzU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgIHJldHVybiBpbmRleFxuICAgICAgICAgICAgIFxuICAgICAgICBpbmRleCA9IEBhY3RpdmUuaW5kZXgoKVxuICAgICAgICB3aGlsZSBpbmRleCA+IDBcbiAgICAgICAgICAgIGluZGV4IC09IDFcbiAgICAgICAgICAgIGlmIG5vdCBAYWN0aXZlLmNvbHVtbi5yb3dzW2luZGV4XS5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXhcbiAgICAgICAgLTFcbiAgICAgICAgXG4gICAgY2xlYXI6IC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3MgPyBbXVxuICAgICAgICAgICAgcm93LmNsZWFyU2VsZWN0ZWQoKVxuICAgICAgICAgICAgXG4gICAgICAgIEByb3dzID0gW11cbiAgICAgICAgQGFjdGl2ZSA9IG51bGxcbiAgICBcbiAgICB0b2dnbGU6IChyb3cpIC0+XG5cbiAgICAgICAgIyByZXR1cm4gaWYgcm93ID09IEBhY3RpdmVcbiAgICAgICAgICAgIFxuICAgICAgICBpZiByb3cuY29sdW1uICE9IEBhY3RpdmUuY29sdW1uXG4gICAgICAgICAgICBAcm93IHJvd1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBpZiByb3cuaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGtsb2cgJ3Vuc2VsZWN0JyByb3cuaXRlbS5maWxlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJvdy5jbGVhckFjdGl2ZSgpXG4gICAgICAgICAgICByb3cuY2xlYXJTZWxlY3RlZCgpICAgICAgICAgICAgXG4gICAgICAgICAgICBAcm93cy5zcGxpY2UgQHJvd3MuaW5kZXhPZihyb3cpLCAxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJvdy5zZXRTZWxlY3RlZCgpXG4gICAgICAgICAgICBAYWN0aXZlID0gcm93XG4gICAgICAgICAgICBAcm93cy5wdXNoIHJvd1xuICAgIFxuICAgIHJvdzogKHJvdywgYWN0aXZhdGU9dHJ1ZSkgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgQGFjdGl2ZT8uY29sdW1uID09IHJvdy5jb2x1bW4gYW5kIGFjdGl2YXRlXG4gICAgICAgICAgICBAYWN0aXZlPy5jbGVhckFjdGl2ZSgpXG4gICAgICAgIFxuICAgICAgICBAY2xlYXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIEByb3dzID0gW3Jvd11cbiAgICAgICAgQGFjdGl2ZSA9IHJvd1xuICAgICAgICByb3cuc2V0U2VsZWN0ZWQoKVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IHJvdy5pc0FjdGl2ZSgpIGFuZCBhY3RpdmF0ZVxuICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgIFxuICAgIHRvOiAocm93KSAtPiBcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiByb3cgPT0gQGFjdGl2ZVxuICAgICAgICByZXR1cm4gaWYgbm90IEBhY3RpdmVcbiAgICAgICAgXG4gICAgICAgIGlmIHJvdy5jb2x1bW4gIT0gQGFjdGl2ZS5jb2x1bW5cbiAgICAgICAgICAgIEByb3cgcm93XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIGlmIHJvdy5pbmRleCgpID4gQGFjdGl2ZS5pbmRleCgpXG4gICAgICAgICAgICBmcm9tID0gQGFjdGl2ZS5pbmRleCgpKzFcbiAgICAgICAgICAgIHRvICAgPSByb3cuaW5kZXgoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmcm9tID0gcm93LmluZGV4KClcbiAgICAgICAgICAgIHRvICAgPSBAYWN0aXZlLmluZGV4KCktMVxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBpbmRleCBpbiBbZnJvbS4udG9dXG4gICAgICAgICAgICByb3cgPSBAYWN0aXZlLmNvbHVtbi5yb3dzW2luZGV4XVxuICAgICAgICAgICAgaWYgbm90IHJvdy5pc1NlbGVjdGVkKCkgXG4gICAgICAgICAgICAgICAgcm93LnNldFNlbGVjdGVkKClcbiAgICAgICAgICAgICAgICBAcm93cy5wdXNoIHJvd1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbGVjdFxuIl19
//# sourceURL=../coffee/select.coffee