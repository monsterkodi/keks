// koffee 1.4.0

/*
0000000    00000000    0000000   000   000   0000000  00000000  00000000   
000   000  000   000  000   000  000 0 000  000       000       000   000  
0000000    0000000    000   000  000000000  0000000   0000000   0000000    
000   000  000   000  000   000  000   000       000  000       000   000  
0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var $, Browser, Column, _, childp, clamp, elem, flex, fs, kerror, klog, kpos, os, post, prefs, ref, setStyle, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, prefs = ref.prefs, elem = ref.elem, clamp = ref.clamp, setStyle = ref.setStyle, childp = ref.childp, slash = ref.slash, fs = ref.fs, os = ref.os, kpos = ref.kpos, klog = ref.klog, kerror = ref.kerror, $ = ref.$, _ = ref._;

Column = require('./column');

flex = require('./flex/flex');

Browser = (function() {
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

    Browser.prototype.columnAtX = function(x) {
        var column, cpos, j, len, pos, ref1;
        ref1 = this.columns;
        for (j = 0, len = ref1.length; j < len; j++) {
            column = ref1[j];
            cpos = kpos(column.div.getBoundingClientRect().left, column.div.getBoundingClientRect().top);
            klog(x, cpos);
            pos = kpos(x, cpos.y);
            if (elem.containsPos(column.div, pos)) {
                return column;
            }
        }
        return null;
    };

    Browser.prototype.rowAtPos = function(pos) {
        var column;
        if (column = this.columnAtPos(pos)) {
            return column.rowAtPos(pos);
        }
        return null;
    };

    Browser.prototype.navigate = function(key) {
        var col, index, nuidx, ref1, ref2, row;
        this.select.clear();
        if (key === 'up') {
            if (this.activeColumnIndex() > 0) {
                if (col = this.activeColumn()) {
                    if (row = col.activeRow()) {
                        this.loadItem(this.fileItem(row.item.file));
                    } else {
                        this.loadItem(this.fileItem(col.path()));
                    }
                }
            } else {
                this.loadItem(this.fileItem(slash.dir(this.columns[0].path())));
            }
        } else {
            index = (ref1 = (ref2 = this.focusColumn()) != null ? ref2.index : void 0) != null ? ref1 : 0;
            nuidx = index + (function() {
                switch (key) {
                    case 'left':
                    case 'up':
                        return -1;
                    case 'right':
                        return +1;
                }
            })();
            nuidx = clamp(0, this.numCols() - 1, nuidx);
            if (nuidx === index) {
                return;
            }
            if (this.columns[nuidx].numRows()) {
                this.columns[nuidx].focus().activeRow().activate();
            }
        }
        this.updateColumnScrolls();
        return this;
    };

    Browser.prototype.focus = function(opt) {
        var ref1;
        if ((ref1 = this.lastDirColumn()) != null) {
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
        return this.columns.slice(-1)[0].isEmpty();
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
        var ref1, ref2;
        return this.clearColumnsFrom((ref1 = (ref2 = this.lastDirColumn()) != null ? ref2.index : void 0) != null ? ref1 : 0, {
            pop: true
        });
    };

    Browser.prototype.shiftColumnsTo = function(col) {
        var i, j, ref1;
        this.closeViewer();
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
        var num, results, results1;
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
        num = this.numCols();
        if (opt.pop) {
            if (opt.clear != null) {
                while (c <= opt.clear) {
                    this.clearColumn(c);
                    c++;
                }
            }
            results = [];
            while (c < num) {
                this.popColumn();
                results.push(c++);
            }
            return results;
        } else {
            results1 = [];
            while (c < num) {
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
        var ref1;
        if ((ref1 = this.viewer) != null) {
            ref1.resized();
        }
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
        var file, item, tmpImg;
        item = row.item;
        file = item.file;
        tmpImg = slash.join(os.tmpdir(), "ko-" + (slash.basename(file)) + ".png");
        return childp.exec("/usr/bin/sips -s format png \"" + file + "\" --out \"" + tmpImg + "\"", (function(_this) {
            return function(err) {
                if (err != null) {
                    return kerror("can't convert image " + file + ": " + err);
                }
                return _this.loadImage(row, tmpImg);
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

})();

module.exports = Browser;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsK0dBQUE7SUFBQTs7QUFRQSxNQUEwRixPQUFBLENBQVEsS0FBUixDQUExRixFQUFFLGVBQUYsRUFBUSxpQkFBUixFQUFlLGVBQWYsRUFBcUIsaUJBQXJCLEVBQTRCLHVCQUE1QixFQUFzQyxtQkFBdEMsRUFBOEMsaUJBQTlDLEVBQXFELFdBQXJELEVBQXlELFdBQXpELEVBQTZELGVBQTdELEVBQW1FLGVBQW5FLEVBQXlFLG1CQUF6RSxFQUFpRixTQUFqRixFQUFvRjs7QUFFcEYsTUFBQSxHQUFTLE9BQUEsQ0FBUSxVQUFSOztBQUNULElBQUEsR0FBUyxPQUFBLENBQVEsYUFBUjs7QUFFSDtJQUVDLGlCQUFDLElBQUQ7UUFBQyxJQUFDLENBQUEsT0FBRDs7OztRQUVBLElBQUMsQ0FBQSxPQUFELEdBQVc7UUFFWCxRQUFBLENBQVMsa0JBQVQsRUFBNEIsU0FBNUIsRUFBc0MsS0FBSyxDQUFDLEdBQU4sQ0FBVSx3QkFBVixDQUFBLElBQXdDLE1BQXhDLElBQWtELFNBQXhGO0lBSkQ7O3NCQVlILFdBQUEsR0FBYSxTQUFBO1FBRVQsSUFBVSxtQkFBQSxJQUFXLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBTixLQUFvQixJQUFDLENBQUEsSUFBMUM7QUFBQSxtQkFBQTs7UUFFQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sR0FBa0I7UUFFbEIsSUFBRyxpQkFBSDtZQUNJLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixJQUFDLENBQUEsSUFBbkI7QUFDQSxtQkFGSjs7UUFJQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sU0FBTjtZQUFnQixFQUFBLEVBQUcsU0FBbkI7U0FBTDtRQUNSLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixJQUFD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LElBQWQsQ0FBNUI7YUFBWixDQURPO1NBQUw7ZUFFTixHQUFHLENBQUMsS0FBSyxDQUFDLFdBQVYsQ0FBc0IsR0FBdEI7SUFSTzs7Ozs7O0FBVWYsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxueyBwb3N0LCBwcmVmcywgZWxlbSwgY2xhbXAsIHNldFN0eWxlLCBjaGlsZHAsIHNsYXNoLCBmcywgb3MsIGtwb3MsIGtsb2csIGtlcnJvciwgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Db2x1bW4gPSByZXF1aXJlICcuL2NvbHVtbidcbmZsZXggICA9IHJlcXVpcmUgJy4vZmxleC9mbGV4J1xuXG5jbGFzcyBCcm93c2VyXG4gICAgXG4gICAgQDogKEB2aWV3KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNvbHVtbnMgPSBbXVxuICAgICAgICBcbiAgICAgICAgc2V0U3R5bGUgJy5icm93c2VyUm93IC5leHQnICdkaXNwbGF5JyBwcmVmcy5nZXQoJ2Jyb3dzZXLilrhoaWRlRXh0ZW5zaW9ucycpIGFuZCAnbm9uZScgb3IgJ2luaXRpYWwnXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBpbml0Q29sdW1uczogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAY29scz8gYW5kIEBjb2xzLnBhcmVudE5vZGUgPT0gQHZpZXdcbiAgICAgICAgXG4gICAgICAgIEB2aWV3LmlubmVySFRNTCA9ICcnXG4gICAgICAgIFxuICAgICAgICBpZiBAY29scz9cbiAgICAgICAgICAgIEB2aWV3LmFwcGVuZENoaWxkIEBjb2xzXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBAY29scyA9IGVsZW0gY2xhc3M6J2Jyb3dzZXInIGlkOidjb2x1bW5zJ1xuICAgICAgICBAdmlldy5hcHBlbmRDaGlsZCBAY29sc1xuICAgICAgICBcbiAgICAgICAgQGNvbHVtbnMgPSBbXVxuXG4gICAgICAgIEBmbGV4ID0gbmV3IGZsZXggXG4gICAgICAgICAgICB2aWV3OiAgICAgICBAY29sc1xuICAgICAgICAgICAgb25QYW5lU2l6ZTogQHVwZGF0ZUNvbHVtblNjcm9sbHNcbiAgICAgICAgXG4gICAgY29sdW1uQXRQb3M6IChwb3MpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBlbGVtLmNvbnRhaW5zUG9zIGNvbHVtbi5kaXYsIHBvc1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2x1bW5cbiAgICAgICAgbnVsbFxuICAgICAgICBcbiAgICBjb2x1bW5BdFg6ICh4KSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGNvbHVtbiBpbiBAY29sdW1uc1xuICAgICAgICAgICAgY3BvcyA9IGtwb3MgY29sdW1uLmRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0LCBjb2x1bW4uZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcFxuICAgICAgICAgICAga2xvZyB4LCBjcG9zXG4gICAgICAgICAgICBwb3MgPSBrcG9zIHgsIGNwb3MueVxuICAgICAgICAgICAgaWYgZWxlbS5jb250YWluc1BvcyBjb2x1bW4uZGl2LCBwb3NcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sdW1uXG4gICAgICAgIG51bGxcbiAgICAgICAgXG4gICAgcm93QXRQb3M6IChwb3MpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBjb2x1bW4gPSBAY29sdW1uQXRQb3MgcG9zXG4gICAgICAgICAgICByZXR1cm4gY29sdW1uLnJvd0F0UG9zIHBvc1xuICAgICAgICBudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG5hdmlnYXRlOiAoa2V5KSAtPlxuICBcbiAgICAgICAgQHNlbGVjdC5jbGVhcigpXG4gICAgICAgIFxuICAgICAgICBpZiBrZXkgPT0gJ3VwJ1xuICAgICAgICAgICAgaWYgQGFjdGl2ZUNvbHVtbkluZGV4KCkgPiAwXG4gICAgICAgICAgICAgICAgaWYgY29sID0gQGFjdGl2ZUNvbHVtbigpXG4gICAgICAgICAgICAgICAgICAgIGlmIHJvdyA9IGNvbC5hY3RpdmVSb3coKVxuICAgICAgICAgICAgICAgICAgICAgICAgQGxvYWRJdGVtIEBmaWxlSXRlbSByb3cuaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBsb2FkSXRlbSBAZmlsZUl0ZW0gY29sLnBhdGgoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBsb2FkSXRlbSBAZmlsZUl0ZW0gc2xhc2guZGlyIEBjb2x1bW5zWzBdLnBhdGgoKVxuICAgICAgICBlbHNlICAgICAgICBcbiAgICAgICAgICAgIGluZGV4ID0gQGZvY3VzQ29sdW1uKCk/LmluZGV4ID8gMFxuICAgICAgICAgICAgbnVpZHggPSBpbmRleCArIHN3aXRjaCBrZXlcbiAgICAgICAgICAgICAgICB3aGVuICdsZWZ0Jyd1cCcgdGhlbiAtMVxuICAgICAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyAgICB0aGVuICsxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgbnVpZHggPSBjbGFtcCAwLCBAbnVtQ29scygpLTEsIG51aWR4XG4gICAgICAgICAgICByZXR1cm4gaWYgbnVpZHggPT0gaW5kZXhcbiAgICAgICAgICAgIGlmIEBjb2x1bW5zW251aWR4XS5udW1Sb3dzKClcbiAgICAgICAgICAgICAgICBAY29sdW1uc1tudWlkeF0uZm9jdXMoKS5hY3RpdmVSb3coKS5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGZvY3VzOiAob3B0KSA9PiBcbiAgICAgICAgQGxhc3REaXJDb2x1bW4oKT8uZm9jdXMgb3B0XG4gICAgICAgIEBcbiAgICBcbiAgICBmb2N1c0NvbHVtbjogLT4gXG4gICAgICAgIGZvciBjIGluIEBjb2x1bW5zXG4gICAgICAgICAgICByZXR1cm4gYyBpZiBjLmhhc0ZvY3VzKClcbiAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgICAgMDAwICAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICBcbiAgICBcbiAgICBlbXB0eUNvbHVtbjogKGNvbEluZGV4KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgY29sSW5kZXg/XG4gICAgICAgICAgICBmb3IgYyBpbiBbY29sSW5kZXguLi5AbnVtQ29scygpXVxuICAgICAgICAgICAgICAgIEBjbGVhckNvbHVtbiBjXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBjb2wgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIHJldHVybiBjb2wgaWYgY29sLmlzRW1wdHkoKVxuICAgICAgICAgICAgXG4gICAgICAgIEBhZGRDb2x1bW4oKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgICAgXG4gICAgXG4gICAgYWN0aXZlQ29sdW1uOiAtPiBAY29sdW1uIEBhY3RpdmVDb2x1bW5JbmRleCgpXG4gICAgYWN0aXZlQ29sdW1uSW5kZXg6IC0+IFxuICAgICAgICBcbiAgICAgICAgZm9yIGNvbCBpbiBAY29sdW1uc1xuICAgICAgICAgICAgaWYgY29sLmhhc0ZvY3VzKCkgdGhlbiByZXR1cm4gY29sLmluZGV4XG4gICAgICAgIDBcbiAgICAgICAgICAgICAgICBcbiAgICBsYXN0VXNlZENvbHVtbjogLT5cbiAgICAgICAgXG4gICAgICAgIHVzZWQgPSBudWxsXG4gICAgICAgIGZvciBjb2wgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIG5vdCBjb2wuaXNFbXB0eSgpXG4gICAgICAgICAgICAgICAgdXNlZCA9IGNvbCBcbiAgICAgICAgICAgIGVsc2UgYnJlYWtcbiAgICAgICAgdXNlZFxuXG4gICAgaGFzRW1wdHlDb2x1bW5zOiAtPiBAY29sdW1uc1stMV0uaXNFbXB0eSgpXG5cbiAgICBoZWlnaHQ6IC0+IEBmbGV4Py5oZWlnaHQoKVxuICAgIG51bUNvbHM6IC0+IEBjb2x1bW5zLmxlbmd0aCBcbiAgICBjb2x1bW46IChpKSAtPiBAY29sdW1uc1tpXSBpZiAwIDw9IGkgPCBAbnVtQ29scygpXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICAgICAgIFxuICAgIGFkZENvbHVtbjogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcblxuICAgICAgICBjb2wgPSBuZXcgQ29sdW1uIEBcbiAgICAgICAgQGNvbHVtbnMucHVzaCBjb2xcbiAgICAgICAgQGZsZXguYWRkUGFuZSBkaXY6Y29sLmRpdiwgc2l6ZTo1MFxuICAgICAgICBjb2xcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgXG4gICAgXG4gICAgY2xlYXJDb2x1bW46IChpbmRleCkgLT4gaWYgaW5kZXggPCBAY29sdW1ucy5sZW5ndGggdGhlbiBAY29sdW1uc1tpbmRleF0uY2xlYXIoKVxuICAgIFxuICAgIHNoaWZ0Q29sdW1uOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuICAgICAgICByZXR1cm4gaWYgbm90IEBjb2x1bW5zLmxlbmd0aFxuICAgICAgICBAY2xlYXJDb2x1bW4gMFxuICAgICAgICBAZmxleC5zaGlmdFBhbmUoKVxuICAgICAgICBAY29sdW1ucy5zaGlmdCgpXG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLkBjb2x1bW5zLmxlbmd0aF1cbiAgICAgICAgICAgIEBjb2x1bW5zW2ldLnNldEluZGV4IGlcbiAgICBcbiAgICBwb3BDb2x1bW46IChvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBmbGV4XG4gICAgICAgIEBjbGVhckNvbHVtbiBAY29sdW1ucy5sZW5ndGgtMVxuICAgICAgICBAZmxleC5wb3BQYW5lIG9wdFxuICAgICAgICBAY29sdW1ucy5wb3AoKVxuICAgICAgICBcbiAgICBwb3BFbXB0eUNvbHVtbnM6IChvcHQpIC0+IFxuICAgICAgICBcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gQGxhc3REaXJDb2x1bW4oKT8uaW5kZXggPyAwLCBwb3A6dHJ1ZVxuICAgICAgICBcbiAgICBzaGlmdENvbHVtbnNUbzogKGNvbCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjbG9zZVZpZXdlcigpXG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLmNvbF1cbiAgICAgICAgICAgIEBzaGlmdENvbHVtbigpXG4gICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgY2xlYXI6IC0+IEBjbGVhckNvbHVtbnNGcm9tIDAsIHBvcDp0cnVlIFxuICAgIFxuICAgIGNsZWFyQ29sdW1uc0Zyb206IChjPTAsIG9wdD1wb3A6ZmFsc2UpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2xlYXJDb2x1bW5zRnJvbSAje2N9P1wiIGlmIG5vdCBjPyBvciBjIDwgMFxuICAgICAgICBcbiAgICAgICAgbnVtID0gQG51bUNvbHMoKVxuICAgICAgICBpZiBvcHQucG9wXG4gICAgICAgICAgICBpZiBvcHQuY2xlYXI/XG4gICAgICAgICAgICAgICAgd2hpbGUgYyA8PSBvcHQuY2xlYXJcbiAgICAgICAgICAgICAgICAgICAgQGNsZWFyQ29sdW1uIGNcbiAgICAgICAgICAgICAgICAgICAgYysrXG4gICAgICAgICAgICB3aGlsZSBjIDwgbnVtXG4gICAgICAgICAgICAgICAgQHBvcENvbHVtbigpXG4gICAgICAgICAgICAgICAgYysrXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdoaWxlIGMgPCBudW1cbiAgICAgICAgICAgICAgICBAY2xlYXJDb2x1bW4gY1xuICAgICAgICAgICAgICAgIGMrK1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGlzTWVzc3k6IC0+IG5vdCBAZmxleC5yZWxheGVkIG9yIEBoYXNFbXB0eUNvbHVtbnMoKVxuICAgIFxuICAgIGNsZWFuVXA6IC0+IFxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IEBmbGV4P1xuICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IEBpc01lc3N5KClcbiAgICAgICAgQHBvcEVtcHR5Q29sdW1ucygpXG4gICAgICAgIEBmbGV4LnJlbGF4KClcbiAgICAgICAgdHJ1ZVxuXG4gICAgcmVzaXplZDogLT4gXG5cbiAgICAgICAgQHZpZXdlcj8ucmVzaXplZCgpXG4gICAgICAgIFxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgXG4gICAgdXBkYXRlQ29sdW1uU2Nyb2xsczogPT5cbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBjLnVwZGF0ZUNydW1iKClcbiAgICAgICAgICAgIGMuc2Nyb2xsLnVwZGF0ZSgpXG5cbiAgICByZXNldDogLT4gZGVsZXRlIEBjb2xzOyBAaW5pdENvbHVtbnMoKVxuICAgIHN0b3A6ICAtPiBAY29scy5yZW1vdmUoKTsgQGNvbHMgPSBudWxsXG4gICAgc3RhcnQ6IC0+IEBpbml0Q29sdW1ucygpXG5cbiAgICByZWZyZXNoOiA9PiByZXNldCgpXG4gICAgICAgIFxuICAgICMgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBjb252ZXJ0UFhNOiAocm93KSAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbSAgID0gcm93Lml0ZW1cbiAgICAgICAgZmlsZSAgID0gaXRlbS5maWxlXG4gICAgICAgIHRtcFBYTSA9IHNsYXNoLmpvaW4gb3MudG1wZGlyKCksIFwia28tI3tzbGFzaC5iYXNlIGZpbGV9LnB4bVwiXG4gICAgICAgIHRtcFBORyA9IHNsYXNoLnN3YXBFeHQgdG1wUFhNLCAnLnBuZydcblxuICAgICAgICBmcy5jb3B5IGZpbGUsIHRtcFBYTSwgKGVycikgPT5cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJjYW4ndCBjb3B5IHB4bSBpbWFnZSAje2ZpbGV9IHRvICN7dG1wUFhNfTogI3tlcnJ9XCIgaWYgZXJyP1xuICAgICAgICAgICAgY2hpbGRwLmV4ZWMgXCJvcGVuICN7X19kaXJuYW1lfS8uLi8uLi9iaW4vcHhtMnBuZy5hcHAgLS1hcmdzICN7dG1wUFhNfVwiLCAoZXJyKSA9PlxuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJjYW4ndCBjb252ZXJ0IHB4bSBpbWFnZSAje3RtcFBYTX0gdG8gI3t0bXBQTkd9OiAje2Vycn1cIiBpZiBlcnI/XG4gICAgICAgICAgICAgICAgbG9hZERlbGF5ZWQgPSA9PiBAbG9hZEltYWdlIHJvdywgdG1wUE5HXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCBsb2FkRGVsYXllZCwgMzAwXG5cbiAgICBjb252ZXJ0SW1hZ2U6IChyb3cpIC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtICAgPSByb3cuaXRlbVxuICAgICAgICBmaWxlICAgPSBpdGVtLmZpbGVcbiAgICAgICAgdG1wSW1nID0gc2xhc2guam9pbiBvcy50bXBkaXIoKSwgXCJrby0je3NsYXNoLmJhc2VuYW1lIGZpbGV9LnBuZ1wiXG4gICAgICAgIFxuICAgICAgICBjaGlsZHAuZXhlYyBcIi91c3IvYmluL3NpcHMgLXMgZm9ybWF0IHBuZyBcXFwiI3tmaWxlfVxcXCIgLS1vdXQgXFxcIiN7dG1wSW1nfVxcXCJcIiwgKGVycikgPT5cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJjYW4ndCBjb252ZXJ0IGltYWdlICN7ZmlsZX06ICN7ZXJyfVwiIGlmIGVycj9cbiAgICAgICAgICAgIEBsb2FkSW1hZ2Ugcm93LCB0bXBJbWdcblxuICAgIGxvYWRJbWFnZTogKHJvdywgZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3Qgcm93LmlzQWN0aXZlKClcblxuICAgICAgICBjb2wgPSBAZW1wdHlDb2x1bW4gb3B0Py5jb2x1bW5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sLmluZGV4XG4gICAgICAgIGNudCA9IGVsZW0gY2xhc3M6ICdicm93c2VySW1hZ2VDb250YWluZXInLCBjaGlsZDogXG4gICAgICAgICAgICBlbGVtICdpbWcnLCBjbGFzczogJ2Jyb3dzZXJJbWFnZScsIHNyYzogc2xhc2guZmlsZVVybCBmaWxlXG4gICAgICAgIGNvbC50YWJsZS5hcHBlbmRDaGlsZCBjbnRcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEJyb3dzZXJcbiJdfQ==
//# sourceURL=../coffee/browser.coffee