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
        if (!row) {
            return;
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

    Select.prototype.to = function(row, moveActive) {
        var from, i, index, r, ref, ref1, ref2, to;
        if (moveActive == null) {
            moveActive = false;
        }
        if (!row) {
            return;
        }
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
        for (index = i = ref = from, ref1 = to; ref <= ref1 ? i <= ref1 : i >= ref1; index = ref <= ref1 ? ++i : --i) {
            r = this.active.column.rows[index];
            if (!r.isSelected()) {
                r.setSelected();
                this.rows.push(r);
            }
        }
        if (moveActive) {
            if ((ref2 = this.active) != null) {
                ref2.clearActive();
            }
            this.active = row;
            return this.active.setActive();
        }
    };

    return Select;

})();

module.exports = Select;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRRSxPQUFTLE9BQUEsQ0FBUSxLQUFSOztBQUVMO0lBRUMsZ0JBQUMsT0FBRDtRQUFDLElBQUMsQ0FBQSxVQUFEO1FBRUEsSUFBQyxDQUFBLElBQUQsR0FBUTtRQUNSLElBQUMsQ0FBQSxNQUFELEdBQVU7SUFIWDs7cUJBS0gsS0FBQSxHQUFPLFNBQUE7QUFFSCxZQUFBO1FBQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixDQUFhLFNBQUMsR0FBRDttQkFBUyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQVQsS0FBaUI7UUFBMUIsQ0FBYjtlQUNQLElBQUksQ0FBQyxHQUFMLENBQVMsU0FBQyxHQUFEO21CQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFBbEIsQ0FBVDtJQUhHOztxQkFLUCxTQUFBLEdBQVcsU0FBQTtBQUVQLFlBQUE7UUFBQSxJQUFhLENBQUksSUFBQyxDQUFBLE1BQWxCO0FBQUEsbUJBQU8sQ0FBQyxFQUFSOztRQUVBLEtBQUEsR0FBUSxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBQTtBQUNSLGVBQU0sS0FBQSxHQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQWYsQ0FBQSxDQUFBLEdBQXlCLENBQXZDO1lBQ0ksS0FBQSxJQUFTO1lBQ1QsSUFBRyxDQUFJLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUssQ0FBQSxLQUFBLENBQU0sQ0FBQyxVQUEzQixDQUFBLENBQVA7QUFDSSx1QkFBTyxNQURYOztRQUZKO1FBS0EsS0FBQSxHQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFBO0FBQ1IsZUFBTSxLQUFBLEdBQVEsQ0FBZDtZQUNJLEtBQUEsSUFBUztZQUNULElBQUcsQ0FBSSxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFLLENBQUEsS0FBQSxDQUFNLENBQUMsVUFBM0IsQ0FBQSxDQUFQO0FBQ0ksdUJBQU8sTUFEWDs7UUFGSjtlQUlBLENBQUM7SUFmTTs7cUJBaUJYLEtBQUEsR0FBTyxTQUFBO0FBRUgsWUFBQTtBQUFBO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxHQUFHLENBQUMsYUFBSixDQUFBO0FBREo7UUFHQSxJQUFDLENBQUEsSUFBRCxHQUFRO2VBQ1IsSUFBQyxDQUFBLE1BQUQsR0FBVTtJQU5QOztxQkFRUCxNQUFBLEdBQVEsU0FBQyxHQUFEO1FBSUosSUFBRyxHQUFHLENBQUMsTUFBSixLQUFjLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBekI7WUFDSSxJQUFDLENBQUEsR0FBRCxDQUFLLEdBQUw7QUFDQSxtQkFGSjs7UUFJQSxJQUFHLEdBQUcsQ0FBQyxVQUFKLENBQUEsQ0FBSDtZQUVJLElBQUEsQ0FBSyxVQUFMLEVBQWdCLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBekI7WUFFQSxHQUFHLENBQUMsV0FBSixDQUFBO1lBQ0EsR0FBRyxDQUFDLGFBQUosQ0FBQTttQkFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sQ0FBYSxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQU4sQ0FBYyxHQUFkLENBQWIsRUFBaUMsQ0FBakMsRUFOSjtTQUFBLE1BQUE7WUFRSSxHQUFHLENBQUMsV0FBSixDQUFBO1lBQ0EsSUFBQyxDQUFBLE1BQUQsR0FBVTttQkFDVixJQUFDLENBQUEsSUFBSSxDQUFDLElBQU4sQ0FBVyxHQUFYLEVBVko7O0lBUkk7O3FCQW9CUixHQUFBLEdBQUssU0FBQyxHQUFELEVBQU0sUUFBTjtBQUVELFlBQUE7O1lBRk8sV0FBUzs7UUFFaEIsSUFBVSxDQUFJLEdBQWQ7QUFBQSxtQkFBQTs7UUFFQSxzQ0FBVSxDQUFFLGdCQUFULEtBQW1CLEdBQUcsQ0FBQyxNQUF2QixJQUFrQyxRQUFyQzs7b0JBQ1csQ0FBRSxXQUFULENBQUE7YUFESjs7UUFHQSxJQUFDLENBQUEsS0FBRCxDQUFBO1FBRUEsSUFBQyxDQUFBLElBQUQsR0FBUSxDQUFDLEdBQUQ7UUFDUixJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsR0FBRyxDQUFDLFdBQUosQ0FBQTtRQUVBLElBQUcsQ0FBSSxHQUFHLENBQUMsUUFBSixDQUFBLENBQUosSUFBdUIsUUFBMUI7bUJBQ0ksR0FBRyxDQUFDLFFBQUosQ0FBQSxFQURKOztJQWJDOztxQkFnQkwsRUFBQSxHQUFJLFNBQUMsR0FBRCxFQUFNLFVBQU47QUFFQSxZQUFBOztZQUZNLGFBQVc7O1FBRWpCLElBQVUsQ0FBSSxHQUFkO0FBQUEsbUJBQUE7O1FBQ0EsSUFBVSxHQUFBLEtBQU8sSUFBQyxDQUFBLE1BQWxCO0FBQUEsbUJBQUE7O1FBQ0EsSUFBVSxDQUFJLElBQUMsQ0FBQSxNQUFmO0FBQUEsbUJBQUE7O1FBRUEsSUFBRyxHQUFHLENBQUMsTUFBSixLQUFjLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBekI7WUFDSSxJQUFDLENBQUEsR0FBRCxDQUFLLEdBQUw7QUFDQSxtQkFGSjs7UUFJQSxJQUFHLEdBQUcsQ0FBQyxLQUFKLENBQUEsQ0FBQSxHQUFjLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFBLENBQWpCO1lBQ0ksSUFBQSxHQUFPLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFBLENBQUEsR0FBZ0I7WUFDdkIsRUFBQSxHQUFPLEdBQUcsQ0FBQyxLQUFKLENBQUEsRUFGWDtTQUFBLE1BQUE7WUFJSSxJQUFBLEdBQU8sR0FBRyxDQUFDLEtBQUosQ0FBQTtZQUNQLEVBQUEsR0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBQSxDQUFBLEdBQWdCLEVBTDNCOztBQU9BLGFBQWEsdUdBQWI7WUFDSSxDQUFBLEdBQUksSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSyxDQUFBLEtBQUE7WUFDeEIsSUFBRyxDQUFJLENBQUMsQ0FBQyxVQUFGLENBQUEsQ0FBUDtnQkFDSSxDQUFDLENBQUMsV0FBRixDQUFBO2dCQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBTixDQUFXLENBQVgsRUFGSjs7QUFGSjtRQU1BLElBQUcsVUFBSDs7b0JBQ1csQ0FBRSxXQUFULENBQUE7O1lBQ0EsSUFBQyxDQUFBLE1BQUQsR0FBVTttQkFDVixJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsQ0FBQSxFQUhKOztJQXZCQTs7Ozs7O0FBNEJSLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgXG4wMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgXG4wMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgXG4jIyNcblxueyBrbG9nIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIFNlbGVjdFxuXG4gICAgQDogKEBicm93c2VyKSAtPiBcbiAgICBcbiAgICAgICAgQHJvd3MgPSBbXVxuICAgICAgICBAYWN0aXZlID0gbnVsbFxuICAgICAgICBcbiAgICBmaWxlczogLT4gXG4gICAgXG4gICAgICAgIHJvd3MgPSBAcm93cy5maWx0ZXIgKHJvdykgLT4gcm93Lml0ZW0ubmFtZSAhPSAnLi4nXG4gICAgICAgIHJvd3MubWFwIChyb3cpIC0+IHJvdy5pdGVtLmZpbGVcbiAgICAgICAgXG4gICAgZnJlZUluZGV4OiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIC0xIGlmIG5vdCBAYWN0aXZlXG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IEBhY3RpdmUuaW5kZXgoKVxuICAgICAgICB3aGlsZSBpbmRleCA8IEBhY3RpdmUuY29sdW1uLm51bVJvd3MoKS0xXG4gICAgICAgICAgICBpbmRleCArPSAxXG4gICAgICAgICAgICBpZiBub3QgQGFjdGl2ZS5jb2x1bW4ucm93c1tpbmRleF0uaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4XG4gICAgICAgICAgICAgXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZS5pbmRleCgpXG4gICAgICAgIHdoaWxlIGluZGV4ID4gMFxuICAgICAgICAgICAgaW5kZXggLT0gMVxuICAgICAgICAgICAgaWYgbm90IEBhY3RpdmUuY29sdW1uLnJvd3NbaW5kZXhdLmlzU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgIHJldHVybiBpbmRleFxuICAgICAgICAtMVxuICAgICAgICBcbiAgICBjbGVhcjogLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93cyA/IFtdXG4gICAgICAgICAgICByb3cuY2xlYXJTZWxlY3RlZCgpXG4gICAgICAgICAgICBcbiAgICAgICAgQHJvd3MgPSBbXVxuICAgICAgICBAYWN0aXZlID0gbnVsbFxuICAgIFxuICAgIHRvZ2dsZTogKHJvdykgLT5cblxuICAgICAgICAjIHJldHVybiBpZiByb3cgPT0gQGFjdGl2ZVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIHJvdy5jb2x1bW4gIT0gQGFjdGl2ZS5jb2x1bW5cbiAgICAgICAgICAgIEByb3cgcm93XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIGlmIHJvdy5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAga2xvZyAndW5zZWxlY3QnIHJvdy5pdGVtLmZpbGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcm93LmNsZWFyQWN0aXZlKClcbiAgICAgICAgICAgIHJvdy5jbGVhclNlbGVjdGVkKCkgICAgICAgICAgICBcbiAgICAgICAgICAgIEByb3dzLnNwbGljZSBAcm93cy5pbmRleE9mKHJvdyksIDFcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcm93LnNldFNlbGVjdGVkKClcbiAgICAgICAgICAgIEBhY3RpdmUgPSByb3dcbiAgICAgICAgICAgIEByb3dzLnB1c2ggcm93XG4gICAgXG4gICAgcm93OiAocm93LCBhY3RpdmF0ZT10cnVlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCByb3dcbiAgICAgICAgXG4gICAgICAgIGlmIEBhY3RpdmU/LmNvbHVtbiA9PSByb3cuY29sdW1uIGFuZCBhY3RpdmF0ZVxuICAgICAgICAgICAgQGFjdGl2ZT8uY2xlYXJBY3RpdmUoKVxuICAgICAgICBcbiAgICAgICAgQGNsZWFyKClcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBAcm93cyA9IFtyb3ddXG4gICAgICAgIEBhY3RpdmUgPSByb3dcbiAgICAgICAgcm93LnNldFNlbGVjdGVkKClcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCByb3cuaXNBY3RpdmUoKSBhbmQgYWN0aXZhdGVcbiAgICAgICAgICAgIHJvdy5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBcbiAgICB0bzogKHJvdywgbW92ZUFjdGl2ZT1mYWxzZSkgLT4gXG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCByb3dcbiAgICAgICAgcmV0dXJuIGlmIHJvdyA9PSBAYWN0aXZlXG4gICAgICAgIHJldHVybiBpZiBub3QgQGFjdGl2ZVxuICAgICAgICBcbiAgICAgICAgaWYgcm93LmNvbHVtbiAhPSBAYWN0aXZlLmNvbHVtblxuICAgICAgICAgICAgQHJvdyByb3dcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgaWYgcm93LmluZGV4KCkgPiBAYWN0aXZlLmluZGV4KClcbiAgICAgICAgICAgIGZyb20gPSBAYWN0aXZlLmluZGV4KCkrMVxuICAgICAgICAgICAgdG8gICA9IHJvdy5pbmRleCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZyb20gPSByb3cuaW5kZXgoKVxuICAgICAgICAgICAgdG8gICA9IEBhY3RpdmUuaW5kZXgoKS0xXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGluZGV4IGluIFtmcm9tLi50b11cbiAgICAgICAgICAgIHIgPSBAYWN0aXZlLmNvbHVtbi5yb3dzW2luZGV4XVxuICAgICAgICAgICAgaWYgbm90IHIuaXNTZWxlY3RlZCgpIFxuICAgICAgICAgICAgICAgIHIuc2V0U2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgIEByb3dzLnB1c2ggclxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBtb3ZlQWN0aXZlXG4gICAgICAgICAgICBAYWN0aXZlPy5jbGVhckFjdGl2ZSgpXG4gICAgICAgICAgICBAYWN0aXZlID0gcm93XG4gICAgICAgICAgICBAYWN0aXZlLnNldEFjdGl2ZSgpXG5cbm1vZHVsZS5leHBvcnRzID0gU2VsZWN0XG4iXX0=
//# sourceURL=../coffee/select.coffee