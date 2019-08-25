// koffee 1.4.0

/*
0000000    00000000    0000000   000   000   0000000  00000000  00000000   
000   000  000   000  000   000  000 0 000  000       000       000   000  
0000000    0000000    000   000  000000000  0000000   0000000   0000000    
000   000  000   000  000   000  000   000       000  000       000   000  
0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var Browser, Column, _, childp, clamp, elem, event, flex, fs, kerror, klog, os, post, prefs, ref, setStyle, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, prefs = ref.prefs, elem = ref.elem, clamp = ref.clamp, setStyle = ref.setStyle, childp = ref.childp, slash = ref.slash, fs = ref.fs, os = ref.os, klog = ref.klog, kerror = ref.kerror, _ = ref._;

Column = require('./column');

flex = require('./flex/flex');

event = require('events');

Browser = (function(superClass) {
    extend(Browser, superClass);

    function Browser(view) {
        this.view = view;
        this.refresh = bind(this.refresh, this);
        this.updateColumnScrolls = bind(this.updateColumnScrolls, this);
        this.focus = bind(this.focus, this);
        this.columns = [];
        setStyle('.browserRow .ext', 'display', prefs.get('browser▸hideExtensions') && 'none' || 'initial');
    }

    Browser.prototype.initColumns = function() {
        if ((this.cols != null) && this.cols.parentNode === this.view) {
            return;
        }
        this.view.innerHTML = '';
        if (this.cols != null) {
            this.view.appendChild(this.cols);
            return;
        }
        this.cols = elem({
            "class": 'browser',
            id: 'columns'
        });
        this.view.appendChild(this.cols);
        this.columns = [];
        return this.flex = new flex({
            view: this.cols,
            onPaneSize: this.updateColumnScrolls
        });
    };

    Browser.prototype.columnAtPos = function(pos) {
        var column, j, len, ref1;
        ref1 = this.columns;
        for (j = 0, len = ref1.length; j < len; j++) {
            column = ref1[j];
            if (elem.containsPos(column.div, pos)) {
                return column;
            }
        }
        return null;
    };

    Browser.prototype.loadItems = function(items, opt) {
        var col, ref1, ref2, ref3;
        if (!this.flex) {
            return;
        }
        col = this.emptyColumn(opt != null ? opt.column : void 0);
        this.clearColumnsFrom(col.index);
        col.setItems(items, opt);
        if (opt.activate != null) {
            if ((ref1 = col.row(opt.activate)) != null) {
                ref1.activate();
            }
        }
        if (opt.row != null) {
            col.focus();
        }
        if (opt.focus) {
            this.focus();
            if ((ref2 = this.lastUsedColumn()) != null) {
                if ((ref3 = ref2.activeRow()) != null) {
                    ref3.setActive();
                }
            }
        }
        this.popEmptyColumns({
            relax: false
        });
        return this;
    };

    Browser.prototype.navigate = function(key) {
        var index, ref1, ref2;
        index = (ref1 = (ref2 = this.focusColumn()) != null ? ref2.index : void 0) != null ? ref1 : 0;
        index += (function() {
            switch (key) {
                case 'left':
                    return -1;
                case 'right':
                    return +1;
            }
        })();
        index = clamp(0, this.numCols() - 1, index);
        if (this.columns[index].numRows()) {
            this.columns[index].focus().activeRow().activate();
        }
        this.updateColumnScrolls();
        return this;
    };

    Browser.prototype.focus = function(opt) {
        var ref1;
        if ((ref1 = this.lastUsedColumn()) != null) {
            ref1.focus(opt);
        }
        return this;
    };

    Browser.prototype.focusColumn = function() {
        var c, j, len, ref1;
        ref1 = this.columns;
        for (j = 0, len = ref1.length; j < len; j++) {
            c = ref1[j];
            if (c.hasFocus()) {
                return c;
            }
        }
    };

    Browser.prototype.emptyColumn = function(colIndex) {
        var c, col, j, k, len, ref1, ref2, ref3;
        if (colIndex != null) {
            for (c = j = ref1 = colIndex, ref2 = this.numCols(); ref1 <= ref2 ? j < ref2 : j > ref2; c = ref1 <= ref2 ? ++j : --j) {
                this.clearColumn(c);
            }
        }
        ref3 = this.columns;
        for (k = 0, len = ref3.length; k < len; k++) {
            col = ref3[k];
            if (col.isEmpty()) {
                return col;
            }
        }
        return this.addColumn();
    };

    Browser.prototype.activeColumn = function() {
        return this.column(this.activeColumnIndex());
    };

    Browser.prototype.activeColumnIndex = function() {
        var col, j, len, ref1;
        ref1 = this.columns;
        for (j = 0, len = ref1.length; j < len; j++) {
            col = ref1[j];
            if (col.hasFocus()) {
                return col.index;
            }
        }
        return 0;
    };

    Browser.prototype.lastUsedColumn = function() {
        var col, j, len, ref1, used;
        used = null;
        ref1 = this.columns;
        for (j = 0, len = ref1.length; j < len; j++) {
            col = ref1[j];
            if (!col.isEmpty()) {
                used = col;
            } else {
                break;
            }
        }
        return used;
    };

    Browser.prototype.hasEmptyColumns = function() {
        return _.last(this.columns).isEmpty();
    };

    Browser.prototype.height = function() {
        var ref1;
        return (ref1 = this.flex) != null ? ref1.height() : void 0;
    };

    Browser.prototype.numCols = function() {
        return this.columns.length;
    };

    Browser.prototype.column = function(i) {
        if ((0 <= i && i < this.numCols())) {
            return this.columns[i];
        }
    };

    Browser.prototype.onBackspaceInColumn = function(column) {
        return column.clearSearch().removeObject();
    };

    Browser.prototype.addColumn = function() {
        var col;
        if (!this.flex) {
            return;
        }
        col = new Column(this);
        this.columns.push(col);
        this.flex.addPane({
            div: col.div,
            size: 50
        });
        return col;
    };

    Browser.prototype.clearColumn = function(index) {
        if (index < this.columns.length) {
            return this.columns[index].clear();
        } else {
            return klog('clearColumn', index, this.columns.length);
        }
    };

    Browser.prototype.shiftColumn = function() {
        var i, j, ref1, results;
        if (!this.flex) {
            return;
        }
        if (!this.columns.length) {
            return;
        }
        this.clearColumn(0);
        this.flex.shiftPane();
        this.columns.shift();
        results = [];
        for (i = j = 0, ref1 = this.columns.length; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            results.push(this.columns[i].setIndex(i));
        }
        return results;
    };

    Browser.prototype.popColumn = function(opt) {
        if (!this.flex) {
            return;
        }
        this.clearColumn(this.columns.length - 1);
        this.flex.popPane(opt);
        return this.columns.pop();
    };

    Browser.prototype.popEmptyColumns = function(opt) {
        var results;
        results = [];
        while (this.hasEmptyColumns()) {
            results.push(this.popColumn(opt));
        }
        return results;
    };

    Browser.prototype.popColumnsFrom = function(col) {
        var results;
        results = [];
        while (this.numCols() > col) {
            results.push(this.popColumn());
        }
        return results;
    };

    Browser.prototype.shiftColumnsTo = function(col) {
        var i, j, ref1;
        for (i = j = 0, ref1 = col; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            this.shiftColumn();
        }
        return this.updateColumnScrolls();
    };

    Browser.prototype.clear = function() {
        return this.clearColumnsFrom(0, {
            pop: true
        });
    };

    Browser.prototype.clearColumnsFrom = function(c, opt) {
        var results, results1;
        if (c == null) {
            c = 0;
        }
        if (opt == null) {
            opt = {
                pop: false
            };
        }
        if ((c == null) || c < 0) {
            return kerror("clearColumnsFrom " + c + "?");
        }
        if (opt.pop) {
            if (c < this.numCols()) {
                this.clearColumn(c);
                c++;
            }
            results = [];
            while (c < this.numCols()) {
                this.popColumn();
                results.push(c++);
            }
            return results;
        } else {
            results1 = [];
            while (c < this.numCols()) {
                this.clearColumn(c);
                results1.push(c++);
            }
            return results1;
        }
    };

    Browser.prototype.isMessy = function() {
        return !this.flex.relaxed || this.hasEmptyColumns();
    };

    Browser.prototype.cleanUp = function() {
        if (this.flex == null) {
            return false;
        }
        if (!this.isMessy()) {
            return false;
        }
        this.popEmptyColumns();
        this.flex.relax();
        return true;
    };

    Browser.prototype.resized = function() {
        return this.updateColumnScrolls();
    };

    Browser.prototype.updateColumnScrolls = function() {
        var c, j, len, ref1, results;
        ref1 = this.columns;
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            c = ref1[j];
            c.updateCrumb();
            results.push(c.scroll.update());
        }
        return results;
    };

    Browser.prototype.reset = function() {
        delete this.cols;
        return this.initColumns();
    };

    Browser.prototype.stop = function() {
        this.cols.remove();
        return this.cols = null;
    };

    Browser.prototype.start = function() {
        return this.initColumns();
    };

    Browser.prototype.refresh = function() {
        return reset();
    };

    Browser.prototype.convertPXM = function(row) {
        var file, item, tmpPNG, tmpPXM;
        item = row.item;
        file = item.file;
        tmpPXM = slash.join(os.tmpdir(), "ko-" + (slash.base(file)) + ".pxm");
        tmpPNG = slash.swapExt(tmpPXM, '.png');
        return fs.copy(file, tmpPXM, (function(_this) {
            return function(err) {
                if (err != null) {
                    return kerror("can't copy pxm image " + file + " to " + tmpPXM + ": " + err);
                }
                return childp.exec("open " + __dirname + "/../../bin/pxm2png.app --args " + tmpPXM, function(err) {
                    var loadDelayed;
                    if (err != null) {
                        return kerror("can't convert pxm image " + tmpPXM + " to " + tmpPNG + ": " + err);
                    }
                    loadDelayed = function() {
                        return _this.loadImage(row, tmpPNG);
                    };
                    return setTimeout(loadDelayed, 300);
                });
            };
        })(this));
    };

    Browser.prototype.convertImage = function(row) {
        var file, item, tmpImage;
        item = row.item;
        file = item.file;
        tmpImage = slash.join(os.tmpdir(), "ko-" + (slash.basename(file)) + ".png");
        return childp.exec("/usr/bin/sips -s format png \"" + file + "\" --out \"" + tmpImage + "\"", (function(_this) {
            return function(err) {
                if (err != null) {
                    return kerror("can't convert image " + file + ": " + err);
                }
                return _this.loadImage(row, tmpImage);
            };
        })(this));
    };

    Browser.prototype.loadImage = function(row, file) {
        var cnt, col;
        if (!row.isActive()) {
            return;
        }
        col = this.emptyColumn(typeof opt !== "undefined" && opt !== null ? opt.column : void 0);
        this.clearColumnsFrom(col.index);
        cnt = elem({
            "class": 'browserImageContainer',
            child: elem('img', {
                "class": 'browserImage',
                src: slash.fileUrl(file)
            })
        });
        return col.table.appendChild(cnt);
    };

    return Browser;

})(event);

module.exports = Browser;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNkdBQUE7SUFBQTs7OztBQVFBLE1BQWlGLE9BQUEsQ0FBUSxLQUFSLENBQWpGLEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUsZUFBZixFQUFxQixpQkFBckIsRUFBNEIsdUJBQTVCLEVBQXNDLG1CQUF0QyxFQUE4QyxpQkFBOUMsRUFBcUQsV0FBckQsRUFBeUQsV0FBekQsRUFBNkQsZUFBN0QsRUFBbUUsbUJBQW5FLEVBQTJFOztBQUUzRSxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0FBQ1QsSUFBQSxHQUFTLE9BQUEsQ0FBUSxhQUFSOztBQUNULEtBQUEsR0FBUyxPQUFBLENBQVEsUUFBUjs7QUFFSDs7O0lBRVcsaUJBQUMsSUFBRDtRQUFDLElBQUMsQ0FBQSxPQUFEOzs7O1FBRVYsSUFBQyxDQUFBLE9BQUQsR0FBVztRQUVYLFFBQUEsQ0FBUyxrQkFBVCxFQUE0QixTQUE1QixFQUFzQyxLQUFLLENBQUMsR0FBTixDQUFVLHdCQUFWLENBQUEsSUFBd0MsTUFBeEMsSUFBa0QsU0FBeEY7SUFKUzs7c0JBWWIsV0FBQSxHQUFhLFNBQUE7UUFFVCxJQUFVLG1CQUFBLElBQVcsSUFBQyxDQUFBLElBQUksQ0FBQyxVQUFOLEtBQW9CLElBQUMsQ0FBQSxJQUExQztBQUFBLG1CQUFBOztRQUVBLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBTixHQUFrQjtRQUVsQixJQUFHLGlCQUFIO1lBQ0ksSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLElBQUMsQ0FBQSxJQUFuQjtBQUNBLG1CQUZKOztRQUlBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxTQUFQO1lBQWtCLEVBQUEsRUFBSSxTQUF0QjtTQUFMO1FBQ1IsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFO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LE1BQUEsQ0FBTyxzQkFBQSxHQUF1QixJQUF2QixHQUE0QixJQUE1QixHQUFnQyxHQUF2QyxFQUFQOzt1QkFDQSxLQUFDLENBQUEsU0FBRCxDQUFXLEdBQVgsRUFBZ0IsUUFBaEI7WUFGeUU7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTdFO0lBTlU7O3NCQVVkLFNBQUEsR0FBVyxTQUFDLEdBQUQsRUFBTSxJQUFOO0FBRVAsWUFBQTtRQUFBLElBQVUsQ0FBSSxHQUFHLENBQUMsUUFBSixDQUFBLENBQWQ7QUFBQSxtQkFBQTs7UUFFQSxHQUFBLEdBQU0sSUFBQyxDQUFBLFdBQUQsOENBQWEsR0FBRyxDQUFFLGVBQWxCO1FBQ04sSUFBQyxDQUFBLGdCQUFELENBQWtCLEdBQUcsQ0FBQyxLQUF0QjtRQUNBLEdBQUEsR0FBTSxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLHVCQUFQO1lBQWdDLEtBQUEsRUFDdkMsSUFBQSxDQUFLLEtBQUwsRUFBWTtnQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGNBQVA7Z0JBQXVCLEdBQUEsRUFBSyxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsQ0FBNUI7YUFBWixDQURPO1NBQUw7ZUFFTixHQUFHLENBQUMsS0FBSyxDQUFDLFdBQVYsQ0FBc0IsR0FBdEI7SUFSTzs7OztHQXpTTzs7QUFtVHRCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbnsgcG9zdCwgcHJlZnMsIGVsZW0sIGNsYW1wLCBzZXRTdHlsZSwgY2hpbGRwLCBzbGFzaCwgZnMsIG9zLCBrbG9nLCBrZXJyb3IsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuQ29sdW1uID0gcmVxdWlyZSAnLi9jb2x1bW4nXG5mbGV4ICAgPSByZXF1aXJlICcuL2ZsZXgvZmxleCdcbmV2ZW50ICA9IHJlcXVpcmUgJ2V2ZW50cydcblxuY2xhc3MgQnJvd3NlciBleHRlbmRzIGV2ZW50XG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAdmlldykgLT5cbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW5zID0gW11cbiAgICAgICAgXG4gICAgICAgIHNldFN0eWxlICcuYnJvd3NlclJvdyAuZXh0JyAnZGlzcGxheScgcHJlZnMuZ2V0KCdicm93c2Vy4pa4aGlkZUV4dGVuc2lvbnMnKSBhbmQgJ25vbmUnIG9yICdpbml0aWFsJ1xuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgaW5pdENvbHVtbnM6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgQGNvbHM/IGFuZCBAY29scy5wYXJlbnROb2RlID09IEB2aWV3XG4gICAgICAgIFxuICAgICAgICBAdmlldy5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBcbiAgICAgICAgaWYgQGNvbHM/XG4gICAgICAgICAgICBAdmlldy5hcHBlbmRDaGlsZCBAY29sc1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgQGNvbHMgPSBlbGVtIGNsYXNzOiAnYnJvd3NlcicsIGlkOiAnY29sdW1ucydcbiAgICAgICAgQHZpZXcuYXBwZW5kQ2hpbGQgQGNvbHNcbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW5zID0gW11cblxuICAgICAgICBAZmxleCA9IG5ldyBmbGV4IFxuICAgICAgICAgICAgdmlldzogICAgICAgQGNvbHNcbiAgICAgICAgICAgIG9uUGFuZVNpemU6IEB1cGRhdGVDb2x1bW5TY3JvbGxzXG4gICAgICAgIFxuICAgIGNvbHVtbkF0UG9zOiAocG9zKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGNvbHVtbiBpbiBAY29sdW1uc1xuICAgICAgICAgICAgaWYgZWxlbS5jb250YWluc1BvcyBjb2x1bW4uZGl2LCBwb3NcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sdW1uXG4gICAgICAgIG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBsb2FkSXRlbXM6IChpdGVtcywgb3B0KSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcbiAgICAgICAgY29sID0gQGVtcHR5Q29sdW1uIG9wdD8uY29sdW1uXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbC5pbmRleFxuICAgICAgICBjb2wuc2V0SXRlbXMgaXRlbXMsIG9wdFxuXG4gICAgICAgIGlmIG9wdC5hY3RpdmF0ZT9cbiAgICAgICAgICAgIGNvbC5yb3cob3B0LmFjdGl2YXRlKT8uYWN0aXZhdGUoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBvcHQucm93P1xuICAgICAgICAgICAgY29sLmZvY3VzKClcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBvcHQuZm9jdXNcbiAgICAgICAgICAgIEBmb2N1cygpXG4gICAgICAgICAgICBAbGFzdFVzZWRDb2x1bW4oKT8uYWN0aXZlUm93KCk/LnNldEFjdGl2ZSgpICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgQHBvcEVtcHR5Q29sdW1ucyByZWxheDpmYWxzZVxuICAgICAgICBAXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgbmF2aWdhdGU6IChrZXkpIC0+XG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IEBmb2N1c0NvbHVtbigpPy5pbmRleCA/IDBcbiAgICAgICAgaW5kZXggKz0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gLTFcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuICsxXG4gICAgICAgIGluZGV4ID0gY2xhbXAgMCwgQG51bUNvbHMoKS0xLCBpbmRleFxuICAgICAgICBpZiBAY29sdW1uc1tpbmRleF0ubnVtUm93cygpXG4gICAgICAgICAgICBAY29sdW1uc1tpbmRleF0uZm9jdXMoKS5hY3RpdmVSb3coKS5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGZvY3VzOiAob3B0KSA9PiBcbiAgICAgICAgQGxhc3RVc2VkQ29sdW1uKCk/LmZvY3VzIG9wdFxuICAgICAgICBAXG4gICAgXG4gICAgZm9jdXNDb2x1bW46IC0+IFxuICAgICAgICBmb3IgYyBpbiBAY29sdW1uc1xuICAgICAgICAgICAgcmV0dXJuIGMgaWYgYy5oYXNGb2N1cygpXG4gICAgICBcbiAgICAjIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAgIDAwMCAgICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgZW1wdHlDb2x1bW46IChjb2xJbmRleCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGNvbEluZGV4P1xuICAgICAgICAgICAgZm9yIGMgaW4gW2NvbEluZGV4Li4uQG51bUNvbHMoKV1cbiAgICAgICAgICAgICAgICBAY2xlYXJDb2x1bW4gY1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBmb3IgY29sIGluIEBjb2x1bW5zXG4gICAgICAgICAgICByZXR1cm4gY29sIGlmIGNvbC5pc0VtcHR5KClcbiAgICAgICAgICAgIFxuICAgICAgICBAYWRkQ29sdW1uKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAgIFxuICAgIFxuICAgIGFjdGl2ZUNvbHVtbjogLT4gQGNvbHVtbiBAYWN0aXZlQ29sdW1uSW5kZXgoKVxuICAgIGFjdGl2ZUNvbHVtbkluZGV4OiAtPiBcbiAgICAgICAgXG4gICAgICAgIGZvciBjb2wgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbC5oYXNGb2N1cygpIHRoZW4gcmV0dXJuIGNvbC5pbmRleFxuICAgICAgICAwXG4gICAgICAgIFxuICAgICMgYWN0aXZlQ29sdW1uSUQ6IC0+XG4jICAgICAgICAgXG4gICAgICAgICMgZm9yIGNvbCBpbiBAY29sdW1uc1xuICAgICAgICAgICAgIyBpZiBjb2wuaGFzRm9jdXMoKSB0aGVuIHJldHVybiBjb2wuZGl2LmlkXG4gICAgICAgICMgJ2NvbHVtbjAnXG5cbiAgICBsYXN0VXNlZENvbHVtbjogLT5cbiAgICAgICAgXG4gICAgICAgIHVzZWQgPSBudWxsXG4gICAgICAgIGZvciBjb2wgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIG5vdCBjb2wuaXNFbXB0eSgpXG4gICAgICAgICAgICAgICAgdXNlZCA9IGNvbCBcbiAgICAgICAgICAgIGVsc2UgYnJlYWtcbiAgICAgICAgdXNlZFxuXG4gICAgaGFzRW1wdHlDb2x1bW5zOiAtPiBfLmxhc3QoQGNvbHVtbnMpLmlzRW1wdHkoKVxuXG4gICAgaGVpZ2h0OiAtPiBAZmxleD8uaGVpZ2h0KClcbiAgICBudW1Db2xzOiAtPiBAY29sdW1ucy5sZW5ndGggXG4gICAgY29sdW1uOiAoaSkgLT4gQGNvbHVtbnNbaV0gaWYgMCA8PSBpIDwgQG51bUNvbHMoKVxuXG4gICAgIyBjb2x1bW5XaXRoTmFtZTogKG5hbWUpIC0+IEBjb2x1bW5zLmZpbmQgKGMpIC0+IGMubmFtZSgpID09IG5hbWVcblxuICAgIG9uQmFja3NwYWNlSW5Db2x1bW46IChjb2x1bW4pIC0+IGNvbHVtbi5jbGVhclNlYXJjaCgpLnJlbW92ZU9iamVjdCgpICAgIFxuICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAgICAgICBcbiAgICBhZGRDb2x1bW46IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBmbGV4XG5cbiAgICAgICAgY29sID0gbmV3IENvbHVtbiBAXG4gICAgICAgIEBjb2x1bW5zLnB1c2ggY29sXG4gICAgICAgIEBmbGV4LmFkZFBhbmUgZGl2OmNvbC5kaXYsIHNpemU6NTBcbiAgICAgICAgY29sXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgIFxuICAgIFxuICAgIGNsZWFyQ29sdW1uOiAoaW5kZXgpIC0+IFxuICAgIFxuICAgICAgICBpZiBpbmRleCA8IEBjb2x1bW5zLmxlbmd0aFxuICAgICAgICAgICAgQGNvbHVtbnNbaW5kZXhdLmNsZWFyKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAga2xvZyAnY2xlYXJDb2x1bW4nIGluZGV4LCBAY29sdW1ucy5sZW5ndGhcbiAgICBcbiAgICBzaGlmdENvbHVtbjogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY29sdW1ucy5sZW5ndGhcbiAgICAgICAgQGNsZWFyQ29sdW1uIDBcbiAgICAgICAgQGZsZXguc2hpZnRQYW5lKClcbiAgICAgICAgQGNvbHVtbnMuc2hpZnQoKVxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5AY29sdW1ucy5sZW5ndGhdXG4gICAgICAgICAgICBAY29sdW1uc1tpXS5zZXRJbmRleCBpXG4gICAgXG4gICAgcG9wQ29sdW1uOiAob3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuICAgICAgICBAY2xlYXJDb2x1bW4gQGNvbHVtbnMubGVuZ3RoLTFcbiAgICAgICAgQGZsZXgucG9wUGFuZSBvcHRcbiAgICAgICAgQGNvbHVtbnMucG9wKClcbiAgICAgICAgXG4gICAgcG9wRW1wdHlDb2x1bW5zOiAob3B0KSAtPiBAcG9wQ29sdW1uKG9wdCkgd2hpbGUgQGhhc0VtcHR5Q29sdW1ucygpXG4gICAgICAgIFxuICAgIHBvcENvbHVtbnNGcm9tOiAoY29sKSAtPiBcbiAgICAgICAgXG4gICAgICAgIHdoaWxlIEBudW1Db2xzKCkgPiBjb2wgXG4gICAgICAgICAgICBAcG9wQ29sdW1uKClcbiAgICAgICAgICAgIFxuICAgIHNoaWZ0Q29sdW1uc1RvOiAoY29sKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5jb2xdXG4gICAgICAgICAgICBAc2hpZnRDb2x1bW4oKVxuICAgICAgICAgICAgXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGNsZWFyOiAtPiBAY2xlYXJDb2x1bW5zRnJvbSAwLCBwb3A6dHJ1ZSBcbiAgICBcbiAgICBjbGVhckNvbHVtbnNGcm9tOiAoYz0wLCBvcHQ9cG9wOmZhbHNlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtlcnJvciBcImNsZWFyQ29sdW1uc0Zyb20gI3tjfT9cIiBpZiBub3QgYz8gb3IgYyA8IDBcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdC5wb3BcbiAgICAgICAgICAgIGlmIGMgPCBAbnVtQ29scygpXG4gICAgICAgICAgICAgICAgQGNsZWFyQ29sdW1uIGNcbiAgICAgICAgICAgICAgICBjKytcbiAgICAgICAgICAgIHdoaWxlIGMgPCBAbnVtQ29scygpXG4gICAgICAgICAgICAgICAgQHBvcENvbHVtbigpXG4gICAgICAgICAgICAgICAgYysrXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdoaWxlIGMgPCBAbnVtQ29scygpXG4gICAgICAgICAgICAgICAgQGNsZWFyQ29sdW1uIGNcbiAgICAgICAgICAgICAgICBjKytcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBpc01lc3N5OiAtPiBub3QgQGZsZXgucmVsYXhlZCBvciBAaGFzRW1wdHlDb2x1bW5zKClcbiAgICBcbiAgICBjbGVhblVwOiAtPiBcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBAZmxleD9cbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBAaXNNZXNzeSgpXG4gICAgICAgIEBwb3BFbXB0eUNvbHVtbnMoKVxuICAgICAgICBAZmxleC5yZWxheCgpXG4gICAgICAgIHRydWVcblxuICAgIHJlc2l6ZWQ6IC0+IEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcbiAgICBcbiAgICB1cGRhdGVDb2x1bW5TY3JvbGxzOiA9PlxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGMudXBkYXRlQ3J1bWIoKVxuICAgICAgICAgICAgYy5zY3JvbGwudXBkYXRlKClcblxuICAgIHJlc2V0OiAtPiBkZWxldGUgQGNvbHM7IEBpbml0Q29sdW1ucygpXG4gICAgc3RvcDogIC0+IEBjb2xzLnJlbW92ZSgpOyBAY29scyA9IG51bGxcbiAgICBzdGFydDogLT4gQGluaXRDb2x1bW5zKClcblxuICAgIHJlZnJlc2g6ID0+IHJlc2V0KClcbiAgICAgICAgXG4gICAgIyAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGNvbnZlcnRQWE06IChyb3cpIC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtID0gcm93Lml0ZW1cbiAgICAgICAgZmlsZSA9IGl0ZW0uZmlsZVxuICAgICAgICB0bXBQWE0gPSBzbGFzaC5qb2luIG9zLnRtcGRpcigpLCBcImtvLSN7c2xhc2guYmFzZSBmaWxlfS5weG1cIlxuICAgICAgICB0bXBQTkcgPSBzbGFzaC5zd2FwRXh0IHRtcFBYTSwgJy5wbmcnXG5cbiAgICAgICAgZnMuY29weSBmaWxlLCB0bXBQWE0sIChlcnIpID0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29weSBweG0gaW1hZ2UgI3tmaWxlfSB0byAje3RtcFBYTX06ICN7ZXJyfVwiIGlmIGVycj9cbiAgICAgICAgICAgIGNoaWxkcC5leGVjIFwib3BlbiAje19fZGlybmFtZX0vLi4vLi4vYmluL3B4bTJwbmcuYXBwIC0tYXJncyAje3RtcFBYTX1cIiwgKGVycikgPT5cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29udmVydCBweG0gaW1hZ2UgI3t0bXBQWE19IHRvICN7dG1wUE5HfTogI3tlcnJ9XCIgaWYgZXJyP1xuICAgICAgICAgICAgICAgIGxvYWREZWxheWVkID0gPT4gQGxvYWRJbWFnZSByb3csIHRtcFBOR1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQgbG9hZERlbGF5ZWQsIDMwMFxuXG4gICAgY29udmVydEltYWdlOiAocm93KSAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbSA9IHJvdy5pdGVtXG4gICAgICAgIGZpbGUgPSBpdGVtLmZpbGVcbiAgICAgICAgdG1wSW1hZ2UgPSBzbGFzaC5qb2luIG9zLnRtcGRpcigpLCBcImtvLSN7c2xhc2guYmFzZW5hbWUgZmlsZX0ucG5nXCJcbiAgICAgICAgXG4gICAgICAgIGNoaWxkcC5leGVjIFwiL3Vzci9iaW4vc2lwcyAtcyBmb3JtYXQgcG5nIFxcXCIje2ZpbGV9XFxcIiAtLW91dCBcXFwiI3t0bXBJbWFnZX1cXFwiXCIsIChlcnIpID0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29udmVydCBpbWFnZSAje2ZpbGV9OiAje2Vycn1cIiBpZiBlcnI/XG4gICAgICAgICAgICBAbG9hZEltYWdlIHJvdywgdG1wSW1hZ2VcblxuICAgIGxvYWRJbWFnZTogKHJvdywgZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3Qgcm93LmlzQWN0aXZlKClcblxuICAgICAgICBjb2wgPSBAZW1wdHlDb2x1bW4gb3B0Py5jb2x1bW5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sLmluZGV4XG4gICAgICAgIGNudCA9IGVsZW0gY2xhc3M6ICdicm93c2VySW1hZ2VDb250YWluZXInLCBjaGlsZDogXG4gICAgICAgICAgICBlbGVtICdpbWcnLCBjbGFzczogJ2Jyb3dzZXJJbWFnZScsIHNyYzogc2xhc2guZmlsZVVybCBmaWxlXG4gICAgICAgIGNvbC50YWJsZS5hcHBlbmRDaGlsZCBjbnRcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEJyb3dzZXJcbiJdfQ==
//# sourceURL=../coffee/browser.coffee