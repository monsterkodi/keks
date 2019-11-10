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
        var ref;
        if (row.column !== ((ref = this.active) != null ? ref.column : void 0)) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRRSxPQUFTLE9BQUEsQ0FBUSxLQUFSOztBQUVMO0lBRUMsZ0JBQUMsT0FBRDtRQUFDLElBQUMsQ0FBQSxVQUFEO1FBRUEsSUFBQyxDQUFBLElBQUQsR0FBUTtRQUNSLElBQUMsQ0FBQSxNQUFELEdBQVU7SUFIWDs7cUJBS0gsS0FBQSxHQUFPLFNBQUE7QUFFSCxZQUFBO1FBQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixDQUFhLFNBQUMsR0FBRDttQkFBUyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQVQsS0FBaUI7UUFBMUIsQ0FBYjtlQUNQLElBQUksQ0FBQyxHQUFMLENBQVMsU0FBQyxHQUFEO21CQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFBbEIsQ0FBVDtJQUhHOztxQkFLUCxTQUFBLEdBQVcsU0FBQTtBQUVQLFlBQUE7UUFBQSxJQUFhLENBQUksSUFBQyxDQUFBLE1BQWxCO0FBQUEsbUJBQU8sQ0FBQyxFQUFSOztRQUVBLEtBQUEsR0FBUSxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBQTtBQUNSLGVBQU0sS0FBQSxHQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQWYsQ0FBQSxDQUFBLEdBQXlCLENBQXZDO1lBQ0ksS0FBQSxJQUFTO1lBQ1QsSUFBRyxDQUFJLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUssQ0FBQSxLQUFBLENBQU0sQ0FBQyxVQUEzQixDQUFBLENBQVA7QUFDSSx1QkFBTyxNQURYOztRQUZKO1FBS0EsS0FBQSxHQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFBO0FBQ1IsZUFBTSxLQUFBLEdBQVEsQ0FBZDtZQUNJLEtBQUEsSUFBUztZQUNULElBQUcsQ0FBSSxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0s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Q0FBVyxDQUFYLEVBRko7O0FBRko7UUFNQSxJQUFHLFVBQUg7O29CQUNXLENBQUUsV0FBVCxDQUFBOztZQUNBLElBQUMsQ0FBQSxNQUFELEdBQVU7bUJBQ1YsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFSLENBQUEsRUFISjs7SUF2QkE7Ozs7OztBQTRCUixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgIFxuMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgIFxuMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgIFxuIyMjXG5cbnsga2xvZyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBTZWxlY3RcblxuICAgIEA6IChAYnJvd3NlcikgLT4gXG4gICAgXG4gICAgICAgIEByb3dzID0gW11cbiAgICAgICAgQGFjdGl2ZSA9IG51bGxcbiAgICAgICAgXG4gICAgZmlsZXM6IC0+IFxuICAgIFxuICAgICAgICByb3dzID0gQHJvd3MuZmlsdGVyIChyb3cpIC0+IHJvdy5pdGVtLm5hbWUgIT0gJy4uJ1xuICAgICAgICByb3dzLm1hcCAocm93KSAtPiByb3cuaXRlbS5maWxlXG4gICAgICAgIFxuICAgIGZyZWVJbmRleDogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAtMSBpZiBub3QgQGFjdGl2ZVxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBAYWN0aXZlLmluZGV4KClcbiAgICAgICAgd2hpbGUgaW5kZXggPCBAYWN0aXZlLmNvbHVtbi5udW1Sb3dzKCktMVxuICAgICAgICAgICAgaW5kZXggKz0gMVxuICAgICAgICAgICAgaWYgbm90IEBhY3RpdmUuY29sdW1uLnJvd3NbaW5kZXhdLmlzU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgIHJldHVybiBpbmRleFxuICAgICAgICAgICAgIFxuICAgICAgICBpbmRleCA9IEBhY3RpdmUuaW5kZXgoKVxuICAgICAgICB3aGlsZSBpbmRleCA+IDBcbiAgICAgICAgICAgIGluZGV4IC09IDFcbiAgICAgICAgICAgIGlmIG5vdCBAYWN0aXZlLmNvbHVtbi5yb3dzW2luZGV4XS5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXhcbiAgICAgICAgLTFcbiAgICAgICAgXG4gICAgY2xlYXI6IC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3MgPyBbXVxuICAgICAgICAgICAgcm93LmNsZWFyU2VsZWN0ZWQoKVxuICAgICAgICAgICAgXG4gICAgICAgIEByb3dzID0gW11cbiAgICAgICAgQGFjdGl2ZSA9IG51bGxcbiAgICBcbiAgICB0b2dnbGU6IChyb3cpIC0+XG5cbiAgICAgICAgIyByZXR1cm4gaWYgcm93ID09IEBhY3RpdmVcbiAgICAgICAgICAgIFxuICAgICAgICBpZiByb3cuY29sdW1uICE9IEBhY3RpdmU/LmNvbHVtblxuICAgICAgICAgICAgQHJvdyByb3dcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgaWYgcm93LmlzU2VsZWN0ZWQoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBrbG9nICd1bnNlbGVjdCcgcm93Lml0ZW0uZmlsZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByb3cuY2xlYXJBY3RpdmUoKVxuICAgICAgICAgICAgcm93LmNsZWFyU2VsZWN0ZWQoKSAgICAgICAgICAgIFxuICAgICAgICAgICAgQHJvd3Muc3BsaWNlIEByb3dzLmluZGV4T2Yocm93KSwgMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByb3cuc2V0U2VsZWN0ZWQoKVxuICAgICAgICAgICAgQGFjdGl2ZSA9IHJvd1xuICAgICAgICAgICAgQHJvd3MucHVzaCByb3dcbiAgICBcbiAgICByb3c6IChyb3csIGFjdGl2YXRlPXRydWUpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IHJvd1xuICAgICAgICBcbiAgICAgICAgaWYgQGFjdGl2ZT8uY29sdW1uID09IHJvdy5jb2x1bW4gYW5kIGFjdGl2YXRlXG4gICAgICAgICAgICBAYWN0aXZlPy5jbGVhckFjdGl2ZSgpXG4gICAgICAgIFxuICAgICAgICBAY2xlYXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIEByb3dzID0gW3Jvd11cbiAgICAgICAgQGFjdGl2ZSA9IHJvd1xuICAgICAgICByb3cuc2V0U2VsZWN0ZWQoKVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IHJvdy5pc0FjdGl2ZSgpIGFuZCBhY3RpdmF0ZVxuICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgIFxuICAgIHRvOiAocm93LCBtb3ZlQWN0aXZlPWZhbHNlKSAtPiBcblxuICAgICAgICByZXR1cm4gaWYgbm90IHJvd1xuICAgICAgICByZXR1cm4gaWYgcm93ID09IEBhY3RpdmVcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAYWN0aXZlXG4gICAgICAgIFxuICAgICAgICBpZiByb3cuY29sdW1uICE9IEBhY3RpdmUuY29sdW1uXG4gICAgICAgICAgICBAcm93IHJvd1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBpZiByb3cuaW5kZXgoKSA+IEBhY3RpdmUuaW5kZXgoKVxuICAgICAgICAgICAgZnJvbSA9IEBhY3RpdmUuaW5kZXgoKSsxXG4gICAgICAgICAgICB0byAgID0gcm93LmluZGV4KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZnJvbSA9IHJvdy5pbmRleCgpXG4gICAgICAgICAgICB0byAgID0gQGFjdGl2ZS5pbmRleCgpLTFcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgaW5kZXggaW4gW2Zyb20uLnRvXVxuICAgICAgICAgICAgciA9IEBhY3RpdmUuY29sdW1uLnJvd3NbaW5kZXhdXG4gICAgICAgICAgICBpZiBub3Qgci5pc1NlbGVjdGVkKCkgXG4gICAgICAgICAgICAgICAgci5zZXRTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgQHJvd3MucHVzaCByXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG1vdmVBY3RpdmVcbiAgICAgICAgICAgIEBhY3RpdmU/LmNsZWFyQWN0aXZlKClcbiAgICAgICAgICAgIEBhY3RpdmUgPSByb3dcbiAgICAgICAgICAgIEBhY3RpdmUuc2V0QWN0aXZlKClcblxubW9kdWxlLmV4cG9ydHMgPSBTZWxlY3RcbiJdfQ==
//# sourceURL=../coffee/select.coffee