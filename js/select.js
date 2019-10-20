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

    Select.prototype.row = function(row, activate) {
        var ref;
        if (activate == null) {
            activate = true;
        }
        this.clear();
        if (((ref = this.active) != null ? ref.column : void 0) === row.column) {
            this.active.clearActive();
        }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRRSxPQUFTLE9BQUEsQ0FBUSxLQUFSOztBQUVMO0lBRUMsZ0JBQUMsT0FBRDtRQUFDLElBQUMsQ0FBQSxVQUFEO1FBRUEsSUFBQyxDQUFBLElBQUQsR0FBUTtRQUNSLElBQUMsQ0FBQSxNQUFELEdBQVU7SUFIWDs7cUJBS0gsS0FBQSxHQUFPLFNBQUE7QUFFSCxZQUFBO1FBQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixDQUFhLFNBQUMsR0FBRDttQkFBUyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQVQsS0FBaUI7UUFBMUIsQ0FBYjtlQUNQLElBQUksQ0FBQyxHQUFMLENBQVMsU0FBQyxHQUFEO21CQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFBbEIsQ0FBVDtJQUhHOztxQkFLUCxTQUFBLEdBQVcsU0FBQTtBQUVQLFlBQUE7UUFBQSxJQUFhLENBQUksSUFBQyxDQUFBLE1BQWxCO0FBQUEsbUJBQU8sQ0FBQyxFQUFSOztRQUVBLEtBQUEsR0FBUSxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBQTtBQUNSLGVBQU0sS0FBQSxHQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQWYsQ0FBQSxDQUFBLEdBQXlCLENBQXZDO1lBQ0ksS0FBQSxJQUFTO1lBQ1QsSUFBRyxDQUFJLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUssQ0FBQSxLQUFBLENBQU0sQ0FBQyxVQUEzQixDQUFBLENBQVA7QUFDSSx1QkFBTyxNQURYOztRQUZKO1FBS0EsS0FBQSxHQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFBO0FBQ1IsZUFBTSxLQUFBLEdBQVEsQ0FBZDtZQUNJLEtBQUEsSUFBUztZQUNULElBQUcsQ0FBSSxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFLLENBQUEsS0FBQSxDQUFNLENBQUMsVUFBM0IsQ0FBQSxDQUFQO0FBQ0ksdUJBQU8sTUFEWDs7UUFGSjtlQUlBLENBQUM7SUFmTTs7cUJBaUJYLEtBQUEsR0FBTyxTQUFBO0FBRUgsWUFBQTtBQUFBO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxHQUFHLENBQUMsYUFBSixDQUFBO0FBREo7UUFHQSxJQUFDLENBQUEsSUFBRCxHQUFRO2VBQ1IsSUFBQyxDQUFBLE1BQUQsR0FBVTtJQU5QOztxQkFRUCxNQUFBLEdBQVEsU0FBQyxHQUFEO1FBRUosSUFBVSxHQUFBLEtBQU8sSUFBQyxDQUFBLE1BQWxCO0FBQUEsbUJBQUE7O1FBQ0EsSUFBRyxHQUFHLENBQUMsTUFBSixLQUFjLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBekI7WUFDSSxJQUFDLENBQUEsR0FBRCxDQUFLLEdBQUw7QUFDQSxtQkFGSjs7UUFJQSxJQUFHLEdBQUcsQ0FBQyxVQUFKLENBQUEsQ0FBSDtZQUNJLEdBQUcsQ0FBQyxhQUFKLENBQUE7bUJBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFOLENBQWEsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLENBQWMsR0FBZCxDQUFiLEVBQWlDLENBQWpDLEVBRko7U0FBQSxNQUFBO1lBSUksR0FBRyxDQUFDLFdBQUosQ0FBQTttQkFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLElBQU4sQ0FBVyxHQUFYLEVBTEo7O0lBUEk7O3FCQWNSLEdBQUEsR0FBSyxTQUFDLEdBQUQsRUFBTSxRQUFOO0FBRUQsWUFBQTs7WUFGTyxXQUFTOztRQUVoQixJQUFDLENBQUEsS0FBRCxDQUFBO1FBRUEsc0NBQVUsQ0FBRSxnQkFBVCxLQUFtQixHQUFHLENBQUMsTUFBMUI7WUFDSSxJQUFDLENBQUEsTUFBTSxDQUFDLFdBQVIsQ0FBQSxFQURKOztRQUdBLElBQUMsQ0FBQSxJQUFELEdBQVEsQ0FBQyxHQUFEO1FBQ1IsSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUNWLEdBQUcsQ0FBQyxXQUFKLENBQUE7UUFFQSxJQUFHLENBQUksR0FBRyxDQUFDLFFBQUosQ0FBQSxDQUFKLElBQXVCLFFBQTFCO21CQUNJLEdBQUcsQ0FBQyxRQUFKLENBQUEsRUFESjs7SUFYQzs7cUJBY0wsRUFBQSxHQUFJLFNBQUMsR0FBRDtBQUVBLFlBQUE7UUFBQSxJQUFVLEdBQUEsS0FBTyxJQUFDLENBQUEsTUFBbEI7QUFBQSxtQkFBQTs7UUFDQSxJQUFHLEdBQUcsQ0FBQyxNQUFKLEtBQWMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUF6QjtZQUNJLElBQUMsQ0FBQSxHQUFELENBQUssR0FBTDtBQUNBLG1CQUZKOztRQUlBLElBQUcsR0FBRyxDQUFDLEtBQUosQ0FBQSxDQUFBLEdBQWMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQUEsQ0FBakI7WUFDSSxJQUFBLEdBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQUEsQ0FBQSxHQUFnQjtZQUN2QixFQUFBLEdBQU8sR0FBRyxDQUFDLEtBQUosQ0FBQSxFQUZYO1NBQUEsTUFBQTtZQUlJLElBQUEsR0FBTyxHQUFHLENBQUMsS0FBSixDQUFBO1lBQ1AsRUFBQSxHQUFPLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFBLENBQUEsR0FBZ0IsRUFMM0I7O0FBT0E7YUFBYSx1R0FBYjtZQUNJLEdBQUEsR0FBTSxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFLLENBQUEsS0FBQTtZQUMxQixJQUFHLENBQUksR0FBRyxDQUFDLFVBQUosQ0FBQSxDQUFQO2dCQUNJLEdBQUcsQ0FBQyxXQUFKLENBQUE7NkJBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLENBQVcsR0FBWCxHQUZKO2FBQUEsTUFBQTtxQ0FBQTs7QUFGSjs7SUFkQTs7Ozs7O0FBb0JSLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgXG4wMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgXG4wMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgXG4jIyNcblxueyBrbG9nIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIFNlbGVjdFxuXG4gICAgQDogKEBicm93c2VyKSAtPiBcbiAgICBcbiAgICAgICAgQHJvd3MgPSBbXVxuICAgICAgICBAYWN0aXZlID0gbnVsbFxuICAgICAgICBcbiAgICBmaWxlczogLT4gXG4gICAgXG4gICAgICAgIHJvd3MgPSBAcm93cy5maWx0ZXIgKHJvdykgLT4gcm93Lml0ZW0ubmFtZSAhPSAnLi4nXG4gICAgICAgIHJvd3MubWFwIChyb3cpIC0+IHJvdy5pdGVtLmZpbGVcbiAgICAgICAgXG4gICAgZnJlZUluZGV4OiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIC0xIGlmIG5vdCBAYWN0aXZlXG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IEBhY3RpdmUuaW5kZXgoKVxuICAgICAgICB3aGlsZSBpbmRleCA8IEBhY3RpdmUuY29sdW1uLm51bVJvd3MoKS0xXG4gICAgICAgICAgICBpbmRleCArPSAxXG4gICAgICAgICAgICBpZiBub3QgQGFjdGl2ZS5jb2x1bW4ucm93c1tpbmRleF0uaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4XG4gICAgICAgICAgICAgXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZS5pbmRleCgpXG4gICAgICAgIHdoaWxlIGluZGV4ID4gMFxuICAgICAgICAgICAgaW5kZXggLT0gMVxuICAgICAgICAgICAgaWYgbm90IEBhY3RpdmUuY29sdW1uLnJvd3NbaW5kZXhdLmlzU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgIHJldHVybiBpbmRleFxuICAgICAgICAtMVxuICAgICAgICBcbiAgICBjbGVhcjogLT5cbiAgICAgICAgXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3MgPyBbXVxuICAgICAgICAgICAgcm93LmNsZWFyU2VsZWN0ZWQoKVxuICAgICAgICAgICAgXG4gICAgICAgIEByb3dzID0gW11cbiAgICAgICAgQGFjdGl2ZSA9IG51bGxcbiAgICBcbiAgICB0b2dnbGU6IChyb3cpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIHJvdyA9PSBAYWN0aXZlXG4gICAgICAgIGlmIHJvdy5jb2x1bW4gIT0gQGFjdGl2ZS5jb2x1bW5cbiAgICAgICAgICAgIEByb3cgcm93XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIGlmIHJvdy5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgIHJvdy5jbGVhclNlbGVjdGVkKClcbiAgICAgICAgICAgIEByb3dzLnNwbGljZSBAcm93cy5pbmRleE9mKHJvdyksIDFcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcm93LnNldFNlbGVjdGVkKClcbiAgICAgICAgICAgIEByb3dzLnB1c2ggcm93XG4gICAgXG4gICAgcm93OiAocm93LCBhY3RpdmF0ZT10cnVlKSAtPlxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAY2xlYXIoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBAYWN0aXZlPy5jb2x1bW4gPT0gcm93LmNvbHVtbiAjYW5kIGFjdGl2YXRlXG4gICAgICAgICAgICBAYWN0aXZlLmNsZWFyQWN0aXZlKClcbiAgICAgICAgXG4gICAgICAgIEByb3dzID0gW3Jvd11cbiAgICAgICAgQGFjdGl2ZSA9IHJvd1xuICAgICAgICByb3cuc2V0U2VsZWN0ZWQoKVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IHJvdy5pc0FjdGl2ZSgpIGFuZCBhY3RpdmF0ZVxuICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgIFxuICAgIHRvOiAocm93KSAtPiBcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiByb3cgPT0gQGFjdGl2ZVxuICAgICAgICBpZiByb3cuY29sdW1uICE9IEBhY3RpdmUuY29sdW1uXG4gICAgICAgICAgICBAcm93IHJvd1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBpZiByb3cuaW5kZXgoKSA+IEBhY3RpdmUuaW5kZXgoKVxuICAgICAgICAgICAgZnJvbSA9IEBhY3RpdmUuaW5kZXgoKSsxXG4gICAgICAgICAgICB0byAgID0gcm93LmluZGV4KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZnJvbSA9IHJvdy5pbmRleCgpXG4gICAgICAgICAgICB0byAgID0gQGFjdGl2ZS5pbmRleCgpLTFcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgaW5kZXggaW4gW2Zyb20uLnRvXVxuICAgICAgICAgICAgcm93ID0gQGFjdGl2ZS5jb2x1bW4ucm93c1tpbmRleF1cbiAgICAgICAgICAgIGlmIG5vdCByb3cuaXNTZWxlY3RlZCgpIFxuICAgICAgICAgICAgICAgIHJvdy5zZXRTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgQHJvd3MucHVzaCByb3dcblxubW9kdWxlLmV4cG9ydHMgPSBTZWxlY3RcbiJdfQ==
//# sourceURL=../coffee/select.coffee