// koffee 1.6.0

/*
0000000    00000000    0000000   000   000   0000000  00000000  00000000   
000   000  000   000  000   000  000 0 000  000       000       000   000  
0000000    0000000    000   000  000000000  0000000   0000000   0000000    
000   000  000   000  000   000  000   000       000  000       000   000  
0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var Browser, Column, childp, clamp, elem, flex, fs, kerror, klog, kpos, os, prefs, ref, setStyle, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), childp = ref.childp, clamp = ref.clamp, elem = ref.elem, fs = ref.fs, kerror = ref.kerror, klog = ref.klog, kpos = ref.kpos, os = ref.os, prefs = ref.prefs, setStyle = ref.setStyle, slash = ref.slash;

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
                if (!slash.isRoot(this.columns[0].path())) {
                    this.loadItem(this.fileItem(slash.dir(this.columns[0].path())));
                }
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
            if (typeof ref1.resized === "function") {
                ref1.resized();
            }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsbUdBQUE7SUFBQTs7QUFRQSxNQUE4RSxPQUFBLENBQVEsS0FBUixDQUE5RSxFQUFFLG1CQUFGLEVBQVUsaUJBQVYsRUFBaUIsZUFBakIsRUFBdUIsV0FBdkIsRUFBMkIsbUJBQTNCLEVBQW1DLGVBQW5DLEVBQXlDLGVBQXpDLEVBQStDLFdBQS9DLEVBQW1ELGlCQUFuRCxFQUEwRCx1QkFBMUQsRUFBb0U7O0FBRXBFLE1BQUEsR0FBUyxPQUFBLENBQVEsVUFBUjs7QUFDVCxJQUFBLEdBQVMsT0FBQSxDQUFRLGFBQVI7O0FBRUg7SUFFQyxpQkFBQyxJQUFEO1FBQUMsSUFBQyxDQUFBLE9BQUQ7Ozs7UUFFQSxJQUFDLENBQUEsT0FBRCxHQUFXO1FBRVgsUUFBQSxDQUFTLGtCQUFULEVBQTRCLFNBQTVCLEVBQXNDLEtBQUssQ0FBQyxHQUFOLENBQVUsd0JBQVYsQ0FBQSxJQUF3QyxNQUF4QyxJQUFrRCxTQUF4RjtJQUpEOztzQkFZSCxXQUFBLEdBQWEsU0FBQTtRQUVULElBQVUsbUJBQUEsSUFBVyxJQUFDLENBQUEsSUFBSSxDQUFDLFVBQU4sS0FBb0IsSUFBQyxDQUFBLElBQTFDO0FBQUEsbUJBQUE7O1FBRUEsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLEdBQWtCO1FBRWxCLElBQUcsaUJBQUg7WUFDSSxJQUFDLENBQUEsSUFBSSxDQUFDLFdBQU4sQ0FBa0IsSUFBQyxDQUFBLElBQW5CO0FBQ0EsbUJBRko7O1FBSUEsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLFNBQU47WUFBZ0IsRUFBQSxFQUFHLFNBQW5CO1NBQUw7UUFDUixJQUFDLENBQUEsSUFBSSxDQUFDLFdBQU4sQ0FBa0IsSUFBQyxDQUFBLElBQW5CO1FBRUEsSUFBQyxDQUFBLE9BQUQsR0FB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QUEsQ0FBQSxFQUFPLGNBQVA7Z0JBQXVCLEdBQUEsRUFBSyxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsQ0FBNUI7YUFBWixDQURPO1NBQUw7ZUFFTixHQUFHLENBQUMsS0FBSyxDQUFDLFdBQVYsQ0FBc0IsR0FBdEI7SUFSTzs7Ozs7O0FBVWYsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxueyBjaGlsZHAsIGNsYW1wLCBlbGVtLCBmcywga2Vycm9yLCBrbG9nLCBrcG9zLCBvcywgcHJlZnMsIHNldFN0eWxlLCBzbGFzaCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Db2x1bW4gPSByZXF1aXJlICcuL2NvbHVtbidcbmZsZXggICA9IHJlcXVpcmUgJy4vZmxleC9mbGV4J1xuXG5jbGFzcyBCcm93c2VyXG4gICAgXG4gICAgQDogKEB2aWV3KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNvbHVtbnMgPSBbXVxuICAgICAgICBcbiAgICAgICAgc2V0U3R5bGUgJy5icm93c2VyUm93IC5leHQnICdkaXNwbGF5JyBwcmVmcy5nZXQoJ2Jyb3dzZXLilrhoaWRlRXh0ZW5zaW9ucycpIGFuZCAnbm9uZScgb3IgJ2luaXRpYWwnXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBpbml0Q29sdW1uczogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAY29scz8gYW5kIEBjb2xzLnBhcmVudE5vZGUgPT0gQHZpZXdcbiAgICAgICAgXG4gICAgICAgIEB2aWV3LmlubmVySFRNTCA9ICcnXG4gICAgICAgIFxuICAgICAgICBpZiBAY29scz9cbiAgICAgICAgICAgIEB2aWV3LmFwcGVuZENoaWxkIEBjb2xzXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBAY29scyA9IGVsZW0gY2xhc3M6J2Jyb3dzZXInIGlkOidjb2x1bW5zJ1xuICAgICAgICBAdmlldy5hcHBlbmRDaGlsZCBAY29sc1xuICAgICAgICBcbiAgICAgICAgQGNvbHVtbnMgPSBbXVxuXG4gICAgICAgIEBmbGV4ID0gbmV3IGZsZXggXG4gICAgICAgICAgICB2aWV3OiAgICAgICBAY29sc1xuICAgICAgICAgICAgb25QYW5lU2l6ZTogQHVwZGF0ZUNvbHVtblNjcm9sbHNcbiAgICAgICAgXG4gICAgY29sdW1uQXRQb3M6IChwb3MpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBlbGVtLmNvbnRhaW5zUG9zIGNvbHVtbi5kaXYsIHBvc1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2x1bW5cbiAgICAgICAgbnVsbFxuICAgICAgICBcbiAgICBjb2x1bW5BdFg6ICh4KSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGNvbHVtbiBpbiBAY29sdW1uc1xuICAgICAgICAgICAgY3BvcyA9IGtwb3MgY29sdW1uLmRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0LCBjb2x1bW4uZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcFxuICAgICAgICAgICAga2xvZyB4LCBjcG9zXG4gICAgICAgICAgICBwb3MgPSBrcG9zIHgsIGNwb3MueVxuICAgICAgICAgICAgaWYgZWxlbS5jb250YWluc1BvcyBjb2x1bW4uZGl2LCBwb3NcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sdW1uXG4gICAgICAgIG51bGxcbiAgICAgICAgXG4gICAgcm93QXRQb3M6IChwb3MpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBjb2x1bW4gPSBAY29sdW1uQXRQb3MgcG9zXG4gICAgICAgICAgICByZXR1cm4gY29sdW1uLnJvd0F0UG9zIHBvc1xuICAgICAgICBudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG5hdmlnYXRlOiAoa2V5KSAtPlxuICBcbiAgICAgICAgQHNlbGVjdC5jbGVhcigpXG4gICAgICAgIFxuICAgICAgICBpZiBrZXkgPT0gJ3VwJ1xuICAgICAgICAgICAgaWYgQGFjdGl2ZUNvbHVtbkluZGV4KCkgPiAwXG4gICAgICAgICAgICAgICAgaWYgY29sID0gQGFjdGl2ZUNvbHVtbigpXG4gICAgICAgICAgICAgICAgICAgIGlmIHJvdyA9IGNvbC5hY3RpdmVSb3coKVxuICAgICAgICAgICAgICAgICAgICAgICAgQGxvYWRJdGVtIEBmaWxlSXRlbSByb3cuaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBsb2FkSXRlbSBAZmlsZUl0ZW0gY29sLnBhdGgoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC5pc1Jvb3QgQGNvbHVtbnNbMF0ucGF0aCgpXG4gICAgICAgICAgICAgICAgICAgIEBsb2FkSXRlbSBAZmlsZUl0ZW0gc2xhc2guZGlyIEBjb2x1bW5zWzBdLnBhdGgoKVxuICAgICAgICBlbHNlICAgICAgICBcbiAgICAgICAgICAgIGluZGV4ID0gQGZvY3VzQ29sdW1uKCk/LmluZGV4ID8gMFxuICAgICAgICAgICAgbnVpZHggPSBpbmRleCArIHN3aXRjaCBrZXlcbiAgICAgICAgICAgICAgICB3aGVuICdsZWZ0Jyd1cCcgdGhlbiAtMVxuICAgICAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyAgICB0aGVuICsxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgbnVpZHggPSBjbGFtcCAwLCBAbnVtQ29scygpLTEsIG51aWR4XG4gICAgICAgICAgICByZXR1cm4gaWYgbnVpZHggPT0gaW5kZXhcbiAgICAgICAgICAgIGlmIEBjb2x1bW5zW251aWR4XS5udW1Sb3dzKClcbiAgICAgICAgICAgICAgICBAY29sdW1uc1tudWlkeF0uZm9jdXMoKS5hY3RpdmVSb3coKS5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGZvY3VzOiAob3B0KSA9PiBcbiAgICAgICAgQGxhc3REaXJDb2x1bW4oKT8uZm9jdXMgb3B0XG4gICAgICAgIEBcbiAgICBcbiAgICBmb2N1c0NvbHVtbjogLT4gXG4gICAgICAgIGZvciBjIGluIEBjb2x1bW5zXG4gICAgICAgICAgICByZXR1cm4gYyBpZiBjLmhhc0ZvY3VzKClcbiAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgICAgMDAwICAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICBcbiAgICBcbiAgICBlbXB0eUNvbHVtbjogKGNvbEluZGV4KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgY29sSW5kZXg/XG4gICAgICAgICAgICBmb3IgYyBpbiBbY29sSW5kZXguLi5AbnVtQ29scygpXVxuICAgICAgICAgICAgICAgIEBjbGVhckNvbHVtbiBjXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBjb2wgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIHJldHVybiBjb2wgaWYgY29sLmlzRW1wdHkoKVxuICAgICAgICAgICAgXG4gICAgICAgIEBhZGRDb2x1bW4oKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgICAgXG4gICAgXG4gICAgYWN0aXZlQ29sdW1uOiAtPiBAY29sdW1uIEBhY3RpdmVDb2x1bW5JbmRleCgpXG4gICAgYWN0aXZlQ29sdW1uSW5kZXg6IC0+IFxuICAgICAgICBcbiAgICAgICAgZm9yIGNvbCBpbiBAY29sdW1uc1xuICAgICAgICAgICAgaWYgY29sLmhhc0ZvY3VzKCkgdGhlbiByZXR1cm4gY29sLmluZGV4XG4gICAgICAgIDBcbiAgICAgICAgICAgICAgICBcbiAgICBsYXN0VXNlZENvbHVtbjogLT5cbiAgICAgICAgXG4gICAgICAgIHVzZWQgPSBudWxsXG4gICAgICAgIGZvciBjb2wgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIG5vdCBjb2wuaXNFbXB0eSgpXG4gICAgICAgICAgICAgICAgdXNlZCA9IGNvbCBcbiAgICAgICAgICAgIGVsc2UgYnJlYWtcbiAgICAgICAgdXNlZFxuXG4gICAgaGFzRW1wdHlDb2x1bW5zOiAtPiBAY29sdW1uc1stMV0uaXNFbXB0eSgpXG5cbiAgICBoZWlnaHQ6IC0+IEBmbGV4Py5oZWlnaHQoKVxuICAgIG51bUNvbHM6IC0+IEBjb2x1bW5zLmxlbmd0aCBcbiAgICBjb2x1bW46IChpKSAtPiBAY29sdW1uc1tpXSBpZiAwIDw9IGkgPCBAbnVtQ29scygpXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICAgICAgIFxuICAgIGFkZENvbHVtbjogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcblxuICAgICAgICBjb2wgPSBuZXcgQ29sdW1uIEBcbiAgICAgICAgQGNvbHVtbnMucHVzaCBjb2xcbiAgICAgICAgQGZsZXguYWRkUGFuZSBkaXY6Y29sLmRpdiwgc2l6ZTo1MFxuICAgICAgICBjb2xcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgXG4gICAgXG4gICAgY2xlYXJDb2x1bW46IChpbmRleCkgLT4gaWYgaW5kZXggPCBAY29sdW1ucy5sZW5ndGggdGhlbiBAY29sdW1uc1tpbmRleF0uY2xlYXIoKVxuICAgIFxuICAgIHNoaWZ0Q29sdW1uOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuICAgICAgICByZXR1cm4gaWYgbm90IEBjb2x1bW5zLmxlbmd0aFxuICAgICAgICBAY2xlYXJDb2x1bW4gMFxuICAgICAgICBAZmxleC5zaGlmdFBhbmUoKVxuICAgICAgICBAY29sdW1ucy5zaGlmdCgpXG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLkBjb2x1bW5zLmxlbmd0aF1cbiAgICAgICAgICAgIEBjb2x1bW5zW2ldLnNldEluZGV4IGlcbiAgICBcbiAgICBwb3BDb2x1bW46IChvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBmbGV4XG4gICAgICAgIEBjbGVhckNvbHVtbiBAY29sdW1ucy5sZW5ndGgtMVxuICAgICAgICBAZmxleC5wb3BQYW5lIG9wdFxuICAgICAgICBAY29sdW1ucy5wb3AoKVxuICAgICAgICBcbiAgICBwb3BFbXB0eUNvbHVtbnM6IChvcHQpIC0+IFxuICAgICAgICBcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gQGxhc3REaXJDb2x1bW4oKT8uaW5kZXggPyAwLCBwb3A6dHJ1ZVxuICAgICAgICBcbiAgICBzaGlmdENvbHVtbnNUbzogKGNvbCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjbG9zZVZpZXdlcigpXG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLmNvbF1cbiAgICAgICAgICAgIEBzaGlmdENvbHVtbigpXG4gICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgY2xlYXI6IC0+IEBjbGVhckNvbHVtbnNGcm9tIDAsIHBvcDp0cnVlIFxuICAgIFxuICAgIGNsZWFyQ29sdW1uc0Zyb206IChjPTAsIG9wdD1wb3A6ZmFsc2UpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2xlYXJDb2x1bW5zRnJvbSAje2N9P1wiIGlmIG5vdCBjPyBvciBjIDwgMFxuICAgICAgICBcbiAgICAgICAgbnVtID0gQG51bUNvbHMoKVxuICAgICAgICBpZiBvcHQucG9wXG4gICAgICAgICAgICBpZiBvcHQuY2xlYXI/XG4gICAgICAgICAgICAgICAgd2hpbGUgYyA8PSBvcHQuY2xlYXJcbiAgICAgICAgICAgICAgICAgICAgQGNsZWFyQ29sdW1uIGNcbiAgICAgICAgICAgICAgICAgICAgYysrXG4gICAgICAgICAgICB3aGlsZSBjIDwgbnVtXG4gICAgICAgICAgICAgICAgQHBvcENvbHVtbigpXG4gICAgICAgICAgICAgICAgYysrXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdoaWxlIGMgPCBudW1cbiAgICAgICAgICAgICAgICBAY2xlYXJDb2x1bW4gY1xuICAgICAgICAgICAgICAgIGMrK1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGlzTWVzc3k6IC0+IG5vdCBAZmxleC5yZWxheGVkIG9yIEBoYXNFbXB0eUNvbHVtbnMoKVxuICAgIFxuICAgIGNsZWFuVXA6IC0+IFxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IEBmbGV4P1xuICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IEBpc01lc3N5KClcbiAgICAgICAgQHBvcEVtcHR5Q29sdW1ucygpXG4gICAgICAgIEBmbGV4LnJlbGF4KClcbiAgICAgICAgdHJ1ZVxuXG4gICAgcmVzaXplZDogLT4gXG5cbiAgICAgICAgQHZpZXdlcj8ucmVzaXplZD8oKVxuICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgIFxuICAgIHVwZGF0ZUNvbHVtblNjcm9sbHM6ID0+XG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY29sdW1uc1xuICAgICAgICAgICAgYy51cGRhdGVDcnVtYigpXG4gICAgICAgICAgICBjLnNjcm9sbC51cGRhdGUoKVxuXG4gICAgcmVzZXQ6IC0+IGRlbGV0ZSBAY29sczsgQGluaXRDb2x1bW5zKClcbiAgICBzdG9wOiAgLT4gQGNvbHMucmVtb3ZlKCk7IEBjb2xzID0gbnVsbFxuICAgIHN0YXJ0OiAtPiBAaW5pdENvbHVtbnMoKVxuXG4gICAgcmVmcmVzaDogPT4gcmVzZXQoKVxuICAgICAgICBcbiAgICAjIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgY29udmVydFBYTTogKHJvdykgLT5cbiAgICAgICAgXG4gICAgICAgIGl0ZW0gICA9IHJvdy5pdGVtXG4gICAgICAgIGZpbGUgICA9IGl0ZW0uZmlsZVxuICAgICAgICB0bXBQWE0gPSBzbGFzaC5qb2luIG9zLnRtcGRpcigpLCBcImtvLSN7c2xhc2guYmFzZSBmaWxlfS5weG1cIlxuICAgICAgICB0bXBQTkcgPSBzbGFzaC5zd2FwRXh0IHRtcFBYTSwgJy5wbmcnXG5cbiAgICAgICAgZnMuY29weSBmaWxlLCB0bXBQWE0sIChlcnIpID0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29weSBweG0gaW1hZ2UgI3tmaWxlfSB0byAje3RtcFBYTX06ICN7ZXJyfVwiIGlmIGVycj9cbiAgICAgICAgICAgIGNoaWxkcC5leGVjIFwib3BlbiAje19fZGlybmFtZX0vLi4vLi4vYmluL3B4bTJwbmcuYXBwIC0tYXJncyAje3RtcFBYTX1cIiwgKGVycikgPT5cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29udmVydCBweG0gaW1hZ2UgI3t0bXBQWE19IHRvICN7dG1wUE5HfTogI3tlcnJ9XCIgaWYgZXJyP1xuICAgICAgICAgICAgICAgIGxvYWREZWxheWVkID0gPT4gQGxvYWRJbWFnZSByb3csIHRtcFBOR1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQgbG9hZERlbGF5ZWQsIDMwMFxuXG4gICAgY29udmVydEltYWdlOiAocm93KSAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbSAgID0gcm93Lml0ZW1cbiAgICAgICAgZmlsZSAgID0gaXRlbS5maWxlXG4gICAgICAgIHRtcEltZyA9IHNsYXNoLmpvaW4gb3MudG1wZGlyKCksIFwia28tI3tzbGFzaC5iYXNlbmFtZSBmaWxlfS5wbmdcIlxuICAgICAgICBcbiAgICAgICAgY2hpbGRwLmV4ZWMgXCIvdXNyL2Jpbi9zaXBzIC1zIGZvcm1hdCBwbmcgXFxcIiN7ZmlsZX1cXFwiIC0tb3V0IFxcXCIje3RtcEltZ31cXFwiXCIsIChlcnIpID0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29udmVydCBpbWFnZSAje2ZpbGV9OiAje2Vycn1cIiBpZiBlcnI/XG4gICAgICAgICAgICBAbG9hZEltYWdlIHJvdywgdG1wSW1nXG5cbiAgICBsb2FkSW1hZ2U6IChyb3csIGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IHJvdy5pc0FjdGl2ZSgpXG5cbiAgICAgICAgY29sID0gQGVtcHR5Q29sdW1uIG9wdD8uY29sdW1uXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbC5pbmRleFxuICAgICAgICBjbnQgPSBlbGVtIGNsYXNzOiAnYnJvd3NlckltYWdlQ29udGFpbmVyJywgY2hpbGQ6IFxuICAgICAgICAgICAgZWxlbSAnaW1nJywgY2xhc3M6ICdicm93c2VySW1hZ2UnLCBzcmM6IHNsYXNoLmZpbGVVcmwgZmlsZVxuICAgICAgICBjb2wudGFibGUuYXBwZW5kQ2hpbGQgY250XG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBCcm93c2VyXG4iXX0=
//# sourceURL=../coffee/browser.coffee