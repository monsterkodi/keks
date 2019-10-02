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
        if (row === this.active) {
            return;
        }
        if (row.column !== this.active.column) {
            this.row(row);
            return;
        }
        if (row.isSelected()) {
            row.clearSelected();
            return this.rows.splice(this.rows.indexOf(row), 1);
        } else {
            row.setSelected();
            return this.rows.push(row);
        }
    };

    Select.prototype.row = function(row) {
        var ref;
        this.clear();
        if (((ref = this.active) != null ? ref.column : void 0) === row.column) {
            this.active.clearActive();
        }
        this.rows = [row];
        this.active = row;
        row.setSelected();
        if (!row.isActive()) {
            return row.activate();
        }
    };

    Select.prototype.to = function(row) {
        var from, i, index, ref, ref1, results, to;
        if (row === this.active) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRRSxPQUFTLE9BQUEsQ0FBUSxLQUFSOztBQUVMO0lBRUMsZ0JBQUMsT0FBRDtRQUFDLElBQUMsQ0FBQSxVQUFEO1FBRUEsSUFBQyxDQUFBLElBQUQsR0FBUTtRQUNSLElBQUMsQ0FBQSxNQUFELEdBQVU7SUFIWDs7cUJBS0gsU0FBQSxHQUFXLFNBQUE7QUFFUCxZQUFBO1FBQUEsSUFBYSxDQUFJLElBQUMsQ0FBQSxNQUFsQjtBQUFBLG1CQUFPLENBQUMsRUFBUjs7UUFFQSxLQUFBLEdBQVEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQUE7QUFDUixlQUFNLEtBQUEsR0FBUSxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFmLENBQUEsQ0FBQSxHQUF5QixDQUF2QztZQUNJLEtBQUEsSUFBUztZQUNULElBQUcsQ0FBSSxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFLLENBQUEsS0FBQSxDQUFNLENBQUMsVUFBM0IsQ0FBQSxDQUFQO0FBQ0ksdUJBQU8sTUFEWDs7UUFGSjtRQUtBLEtBQUEsR0FBUSxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBQTtBQUNSLGVBQU0sS0FBQSxHQUFRLENBQWQ7WUFDSSxLQUFBLElBQVM7WUFDVCxJQUFHLENBQUksSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSyxDQUFBLEtBQUEsQ0FBTSxDQUFDLFVBQTNCLENBQUEsQ0FBUDtBQUNJLHVCQUFPLE1BRFg7O1FBRko7ZUFJQSxDQUFDO0lBZk07O3FCQWlCWCxLQUFBLEdBQU8sU0FBQTtBQUlILFlBQUE7QUFBQTtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksR0FBRyxDQUFDLGFBQUosQ0FBQTtBQURKO1FBR0EsSUFBQyxDQUFBLElBQUQsR0FBUTtlQUNSLElBQUMsQ0FBQSxNQUFELEdBQVU7SUFSUDs7cUJBVVAsTUFBQSxHQUFRLFNBQUMsR0FBRDtRQUVKLElBQVUsR0FBQSxLQUFPLElBQUMsQ0FBQSxNQUFsQjtBQUFBLG1CQUFBOztRQUNBLElBQUcsR0FBRyxDQUFDLE1BQUosS0FBYyxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQXpCO1lBQ0ksSUFBQyxDQUFBLEdBQUQsQ0FBSyxHQUFMO0FBQ0EsbUJBRko7O1FBSUEsSUFBRyxHQUFHLENBQUMsVUFBSixDQUFBLENBQUg7WUFDSSxHQUFHLENBQUMsYUFBSixDQUFBO21CQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixDQUFhLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTixDQUFjLEdBQWQsQ0FBYixFQUFpQyxDQUFqQyxFQUZKO1NBQUEsTUFBQTtZQUlJLEdBQUcsQ0FBQyxXQUFKLENBQUE7bUJBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLENBQVcsR0FBWCxFQUxKOztJQVBJOztxQkFjUixHQUFBLEdBQUssU0FBQyxHQUFEO0FBRUQsWUFBQTtRQUFBLElBQUMsQ0FBQSxLQUFELENBQUE7UUFFQSxzQ0FBVSxDQUFFLGdCQUFULEtBQW1CLEdBQUcsQ0FBQyxNQUExQjtZQUNJLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBUixDQUFBLEVBREo7O1FBR0EsSUFBQyxDQUFBLElBQUQsR0FBUSxDQUFDLEdBQUQ7UUFDUixJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsR0FBRyxDQUFDLFdBQUosQ0FBQTtRQUVBLElBQUcsQ0FBSSxHQUFHLENBQUMsUUFBSixDQUFBLENBQVA7bUJBQ0ksR0FBRyxDQUFDLFFBQUosQ0FBQSxFQURKOztJQVhDOztxQkFjTCxFQUFBLEdBQUksU0FBQyxHQUFEO0FBRUEsWUFBQTtRQUFBLElBQVUsR0FBQSxLQUFPLElBQUMsQ0FBQSxNQUFsQjtBQUFBLG1CQUFBOztRQUNBLElBQUcsR0FBRyxDQUFDLE1BQUosS0FBYyxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQXpCO1lBQ0ksSUFBQyxDQUFBLEdBQUQsQ0FBSyxHQUFMO0FBQ0EsbUJBRko7O1FBSUEsSUFBRyxHQUFHLENBQUMsS0FBSixDQUFBLENBQUEsR0FBYyxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBQSxDQUFqQjtZQUNJLElBQUEsR0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBQSxDQUFBLEdBQWdCO1lBQ3ZCLEVBQUEsR0FBTyxHQUFHLENBQUMsS0FBSixDQUFBLEVBRlg7U0FBQSxNQUFBO1lBSUksSUFBQSxHQUFPLEdBQUcsQ0FBQyxLQUFKLENBQUE7WUFDUCxFQUFBLEdBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQUEsQ0FBQSxHQUFnQixFQUwzQjs7QUFPQTthQUFhLHVHQUFiO1lBQ0ksR0FBQSxHQUFNLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUssQ0FBQSxLQUFBO1lBQzFCLElBQUcsQ0FBSSxHQUFHLENBQUMsVUFBSixDQUFBLENBQVA7Z0JBQ0ksR0FBRyxDQUFDLFdBQUosQ0FBQTs2QkFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLElBQU4sQ0FBVyxHQUFYLEdBRko7YUFBQSxNQUFBO3FDQUFBOztBQUZKOztJQWRBOzs7Ozs7QUFvQlIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICBcbjAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICBcbjAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAgICBcbiMjI1xuXG57IGtsb2cgfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgU2VsZWN0XG5cbiAgICBAOiAoQGJyb3dzZXIpIC0+IFxuICAgIFxuICAgICAgICBAcm93cyA9IFtdXG4gICAgICAgIEBhY3RpdmUgPSBudWxsXG4gICAgICAgIFxuICAgIGZyZWVJbmRleDogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAtMSBpZiBub3QgQGFjdGl2ZVxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBAYWN0aXZlLmluZGV4KClcbiAgICAgICAgd2hpbGUgaW5kZXggPCBAYWN0aXZlLmNvbHVtbi5udW1Sb3dzKCktMVxuICAgICAgICAgICAgaW5kZXggKz0gMVxuICAgICAgICAgICAgaWYgbm90IEBhY3RpdmUuY29sdW1uLnJvd3NbaW5kZXhdLmlzU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgIHJldHVybiBpbmRleFxuICAgICAgICAgICAgIFxuICAgICAgICBpbmRleCA9IEBhY3RpdmUuaW5kZXgoKVxuICAgICAgICB3aGlsZSBpbmRleCA+IDBcbiAgICAgICAgICAgIGluZGV4IC09IDFcbiAgICAgICAgICAgIGlmIG5vdCBAYWN0aXZlLmNvbHVtbi5yb3dzW2luZGV4XS5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXhcbiAgICAgICAgLTFcbiAgICAgICAgXG4gICAgY2xlYXI6IC0+XG4gICAgICAgIFxuICAgICAgICAjIEBhY3RpdmU/LmNsZWFyQWN0aXZlKClcbiAgICAgICAgXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3MgPyBbXVxuICAgICAgICAgICAgcm93LmNsZWFyU2VsZWN0ZWQoKVxuICAgICAgICAgICAgXG4gICAgICAgIEByb3dzID0gW11cbiAgICAgICAgQGFjdGl2ZSA9IG51bGxcbiAgICBcbiAgICB0b2dnbGU6IChyb3cpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIHJvdyA9PSBAYWN0aXZlXG4gICAgICAgIGlmIHJvdy5jb2x1bW4gIT0gQGFjdGl2ZS5jb2x1bW5cbiAgICAgICAgICAgIEByb3cgcm93XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIGlmIHJvdy5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgIHJvdy5jbGVhclNlbGVjdGVkKClcbiAgICAgICAgICAgIEByb3dzLnNwbGljZSBAcm93cy5pbmRleE9mKHJvdyksIDFcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcm93LnNldFNlbGVjdGVkKClcbiAgICAgICAgICAgIEByb3dzLnB1c2ggcm93XG4gICAgXG4gICAgcm93OiAocm93KSAtPiBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGNsZWFyKClcbiAgICAgICAgXG4gICAgICAgIGlmIEBhY3RpdmU/LmNvbHVtbiA9PSByb3cuY29sdW1uXG4gICAgICAgICAgICBAYWN0aXZlLmNsZWFyQWN0aXZlKClcbiAgICAgICAgXG4gICAgICAgIEByb3dzID0gW3Jvd11cbiAgICAgICAgQGFjdGl2ZSA9IHJvd1xuICAgICAgICByb3cuc2V0U2VsZWN0ZWQoKVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IHJvdy5pc0FjdGl2ZSgpXG4gICAgICAgICAgICByb3cuYWN0aXZhdGUoKVxuICAgICAgICBcbiAgICB0bzogKHJvdykgLT4gXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgcm93ID09IEBhY3RpdmVcbiAgICAgICAgaWYgcm93LmNvbHVtbiAhPSBAYWN0aXZlLmNvbHVtblxuICAgICAgICAgICAgQHJvdyByb3dcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgaWYgcm93LmluZGV4KCkgPiBAYWN0aXZlLmluZGV4KClcbiAgICAgICAgICAgIGZyb20gPSBAYWN0aXZlLmluZGV4KCkrMVxuICAgICAgICAgICAgdG8gICA9IHJvdy5pbmRleCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZyb20gPSByb3cuaW5kZXgoKVxuICAgICAgICAgICAgdG8gICA9IEBhY3RpdmUuaW5kZXgoKS0xXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGluZGV4IGluIFtmcm9tLi50b11cbiAgICAgICAgICAgIHJvdyA9IEBhY3RpdmUuY29sdW1uLnJvd3NbaW5kZXhdXG4gICAgICAgICAgICBpZiBub3Qgcm93LmlzU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgIHJvdy5zZXRTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgQHJvd3MucHVzaCByb3dcblxubW9kdWxlLmV4cG9ydHMgPSBTZWxlY3RcbiJdfQ==
//# sourceURL=../coffee/select.coffee