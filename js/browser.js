// koffee 1.4.0

/*
0000000    00000000    0000000   000   000   0000000  00000000  00000000   
000   000  000   000  000   000  000 0 000  000       000       000   000  
0000000    0000000    000   000  000000000  0000000   0000000   0000000    
000   000  000   000  000   000  000   000       000  000       000   000  
0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var $, Browser, Column, _, childp, clamp, elem, flex, fs, kerror, klog, os, post, prefs, ref, setStyle, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, prefs = ref.prefs, elem = ref.elem, clamp = ref.clamp, setStyle = ref.setStyle, childp = ref.childp, slash = ref.slash, fs = ref.fs, os = ref.os, klog = ref.klog, kerror = ref.kerror, $ = ref.$, _ = ref._;

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

    Browser.prototype.navigate = function(key) {
        var col, index, ref1, ref2, row;
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
            index += (function() {
                switch (key) {
                    case 'left':
                    case 'up':
                        return -1;
                    case 'right':
                        return +1;
                }
            })();
            index = clamp(0, this.numCols() - 1, index);
            if (this.columns[index].numRows()) {
                this.columns[index].focus().activeRow().activate();
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
        var ref1, ref2, ref3;
        klog('popEmptyColumns', opt, (ref1 = this.lastDirColumn()) != null ? ref1.index : void 0);
        return this.clearColumnsFrom((ref2 = (ref3 = this.lastDirColumn()) != null ? ref3.index : void 0) != null ? ref2 : 0, {
            pop: true
        });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEseUdBQUE7SUFBQTs7QUFRQSxNQUFvRixPQUFBLENBQVEsS0FBUixDQUFwRixFQUFFLGVBQUYsRUFBUSxpQkFBUixFQUFlLGVBQWYsRUFBcUIsaUJBQXJCLEVBQTRCLHVCQUE1QixFQUFzQyxtQkFBdEMsRUFBOEMsaUJBQTlDLEVBQXFELFdBQXJELEVBQXlELFdBQXpELEVBQTZELGVBQTdELEVBQW1FLG1CQUFuRSxFQUEyRSxTQUEzRSxFQUE4RTs7QUFFOUUsTUFBQSxHQUFTLE9BQUEsQ0FBUSxVQUFSOztBQUNULElBQUEsR0FBUyxPQUFBLENBQVEsYUFBUjs7QUFFSDtJQUVXLGlCQUFDLElBQUQ7UUFBQyxJQUFDLENBQUEsT0FBRDs7OztRQUVWLElBQUMsQ0FBQSxPQUFELEdBQVc7UUFFWCxRQUFBLENBQVMsa0JBQVQsRUFBNEIsU0FBNUIsRUFBc0MsS0FBSyxDQUFDLEdBQU4sQ0FBVSx3QkFBVixDQUFBLElBQXdDLE1BQXhDLElBQWtELFNBQXhGO0lBSlM7O3NCQVliLFdBQUEsR0FBYSxTQUFBO1FBRVQsSUFBVSxtQkFBQSxJQUFXLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBTixLQUFvQixJQUFDLENBQUEsSUFBMUM7QUFBQSxtQkFBQTs7UUFFQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sR0FBa0I7UUFFbEIsSUFBRyxpQkFBSDtZQUNJLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixJQUFDLENBQUEsSUFBbkI7QUFDQSxtQkFGSjs7UUFJQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sU0FBTjtZQUFnQixFQUFBLEVBQUcsU0FBbkI7U0FBTDtRQUNSLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixJQUFDLENBQUEsSUFBbkI7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Q0FBQSxDQUFBLElBQUEsQ0FBM0U7SUFOVTs7c0JBVWQsU0FBQSxHQUFXLFNBQUMsR0FBRCxFQUFNLElBQU47QUFFUCxZQUFBO1FBQUEsSUFBVSxDQUFJLEdBQUcsQ0FBQyxRQUFKLENBQUEsQ0FBZDtBQUFBLG1CQUFBOztRQUVBLEdBQUEsR0FBTSxJQUFDLENBQUEsV0FBRCw4Q0FBYSxHQUFHLENBQUUsZUFBbEI7UUFDTixJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsR0FBRyxDQUFDLEtBQXRCO1FBQ0EsR0FBQSxHQUFNLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sdUJBQVA7WUFBZ0MsS0FBQSxFQUN2QyxJQUFBLENBQUssS0FBTCxFQUFZO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sY0FBUDtnQkFBdUIsR0FBQSxFQUFLLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBZCxDQUE1QjthQUFaLENBRE87U0FBTDtlQUVOLEdBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVixDQUFzQixHQUF0QjtJQVJPOzs7Ozs7QUFVZixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiMjI1xuXG57IHBvc3QsIHByZWZzLCBlbGVtLCBjbGFtcCwgc2V0U3R5bGUsIGNoaWxkcCwgc2xhc2gsIGZzLCBvcywga2xvZywga2Vycm9yLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbkNvbHVtbiA9IHJlcXVpcmUgJy4vY29sdW1uJ1xuZmxleCAgID0gcmVxdWlyZSAnLi9mbGV4L2ZsZXgnXG5cbmNsYXNzIEJyb3dzZXJcbiAgICBcbiAgICBjb25zdHJ1Y3RvcjogKEB2aWV3KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNvbHVtbnMgPSBbXVxuICAgICAgICBcbiAgICAgICAgc2V0U3R5bGUgJy5icm93c2VyUm93IC5leHQnICdkaXNwbGF5JyBwcmVmcy5nZXQoJ2Jyb3dzZXLilrhoaWRlRXh0ZW5zaW9ucycpIGFuZCAnbm9uZScgb3IgJ2luaXRpYWwnXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBpbml0Q29sdW1uczogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAY29scz8gYW5kIEBjb2xzLnBhcmVudE5vZGUgPT0gQHZpZXdcbiAgICAgICAgXG4gICAgICAgIEB2aWV3LmlubmVySFRNTCA9ICcnXG4gICAgICAgIFxuICAgICAgICBpZiBAY29scz9cbiAgICAgICAgICAgIEB2aWV3LmFwcGVuZENoaWxkIEBjb2xzXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBAY29scyA9IGVsZW0gY2xhc3M6J2Jyb3dzZXInIGlkOidjb2x1bW5zJ1xuICAgICAgICBAdmlldy5hcHBlbmRDaGlsZCBAY29sc1xuICAgICAgICBcbiAgICAgICAgQGNvbHVtbnMgPSBbXVxuXG4gICAgICAgIEBmbGV4ID0gbmV3IGZsZXggXG4gICAgICAgICAgICB2aWV3OiAgICAgICBAY29sc1xuICAgICAgICAgICAgb25QYW5lU2l6ZTogQHVwZGF0ZUNvbHVtblNjcm9sbHNcbiAgICAgICAgXG4gICAgY29sdW1uQXRQb3M6IChwb3MpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBlbGVtLmNvbnRhaW5zUG9zIGNvbHVtbi5kaXYsIHBvc1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2x1bW5cbiAgICAgICAgbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBuYXZpZ2F0ZTogKGtleSkgLT5cbiAgXG4gICAgICAgIGlmIGtleSA9PSAndXAnXG4gICAgICAgICAgICBpZiBAYWN0aXZlQ29sdW1uSW5kZXgoKSA+IDBcbiAgICAgICAgICAgICAgICBpZiBjb2wgPSBAYWN0aXZlQ29sdW1uKClcbiAgICAgICAgICAgICAgICAgICAgaWYgcm93ID0gY29sLmFjdGl2ZVJvdygpXG4gICAgICAgICAgICAgICAgICAgICAgICBAbG9hZEl0ZW0gQGZpbGVJdGVtIHJvdy5pdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQGxvYWRJdGVtIEBmaWxlSXRlbSBjb2wucGF0aCgpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGxvYWRJdGVtIEBmaWxlSXRlbSBzbGFzaC5kaXIgQGNvbHVtbnNbMF0ucGF0aCgpXG4gICAgICAgIGVsc2UgICAgICAgIFxuICAgICAgICAgICAgaW5kZXggPSBAZm9jdXNDb2x1bW4oKT8uaW5kZXggPyAwXG4gICAgICAgICAgICBpbmRleCArPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICAgICAgd2hlbiAnbGVmdCcndXAnIHRoZW4gLTFcbiAgICAgICAgICAgICAgICB3aGVuICdyaWdodCcgICAgdGhlbiArMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGluZGV4ID0gY2xhbXAgMCwgQG51bUNvbHMoKS0xLCBpbmRleFxuICAgICAgICAgICAgaWYgQGNvbHVtbnNbaW5kZXhdLm51bVJvd3MoKVxuICAgICAgICAgICAgICAgIEBjb2x1bW5zW2luZGV4XS5mb2N1cygpLmFjdGl2ZVJvdygpLmFjdGl2YXRlKClcbiAgICAgICAgICAgIFxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgZm9jdXM6IChvcHQpID0+IFxuICAgICAgICBAbGFzdERpckNvbHVtbigpPy5mb2N1cyBvcHRcbiAgICAgICAgQFxuICAgIFxuICAgIGZvY3VzQ29sdW1uOiAtPiBcbiAgICAgICAgZm9yIGMgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIHJldHVybiBjIGlmIGMuaGFzRm9jdXMoKVxuICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAwMDAgICAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIGVtcHR5Q29sdW1uOiAoY29sSW5kZXgpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBjb2xJbmRleD9cbiAgICAgICAgICAgIGZvciBjIGluIFtjb2xJbmRleC4uLkBudW1Db2xzKCldXG4gICAgICAgICAgICAgICAgQGNsZWFyQ29sdW1uIGNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgZm9yIGNvbCBpbiBAY29sdW1uc1xuICAgICAgICAgICAgcmV0dXJuIGNvbCBpZiBjb2wuaXNFbXB0eSgpXG4gICAgICAgICAgICBcbiAgICAgICAgQGFkZENvbHVtbigpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgICBcbiAgICBcbiAgICBhY3RpdmVDb2x1bW46IC0+IEBjb2x1bW4gQGFjdGl2ZUNvbHVtbkluZGV4KClcbiAgICBhY3RpdmVDb2x1bW5JbmRleDogLT4gXG4gICAgICAgIFxuICAgICAgICBmb3IgY29sIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBjb2wuaGFzRm9jdXMoKSB0aGVuIHJldHVybiBjb2wuaW5kZXhcbiAgICAgICAgMFxuICAgICAgICAgICAgICAgIFxuICAgIGxhc3RVc2VkQ29sdW1uOiAtPlxuICAgICAgICBcbiAgICAgICAgdXNlZCA9IG51bGxcbiAgICAgICAgZm9yIGNvbCBpbiBAY29sdW1uc1xuICAgICAgICAgICAgaWYgbm90IGNvbC5pc0VtcHR5KClcbiAgICAgICAgICAgICAgICB1c2VkID0gY29sIFxuICAgICAgICAgICAgZWxzZSBicmVha1xuICAgICAgICB1c2VkXG5cbiAgICBoYXNFbXB0eUNvbHVtbnM6IC0+IEBjb2x1bW5zWy0xXS5pc0VtcHR5KClcblxuICAgIGhlaWdodDogLT4gQGZsZXg/LmhlaWdodCgpXG4gICAgbnVtQ29sczogLT4gQGNvbHVtbnMubGVuZ3RoIFxuICAgIGNvbHVtbjogKGkpIC0+IEBjb2x1bW5zW2ldIGlmIDAgPD0gaSA8IEBudW1Db2xzKClcblxuICAgIG9uQmFja3NwYWNlSW5Db2x1bW46IChjb2x1bW4pIC0+IGNvbHVtbi5jbGVhclNlYXJjaCgpLnJlbW92ZU9iamVjdCgpICAgIFxuICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAgICAgICBcbiAgICBhZGRDb2x1bW46IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBmbGV4XG5cbiAgICAgICAgY29sID0gbmV3IENvbHVtbiBAXG4gICAgICAgIEBjb2x1bW5zLnB1c2ggY29sXG4gICAgICAgIEBmbGV4LmFkZFBhbmUgZGl2OmNvbC5kaXYsIHNpemU6NTBcbiAgICAgICAgY29sXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgIFxuICAgIFxuICAgIGNsZWFyQ29sdW1uOiAoaW5kZXgpIC0+IGlmIGluZGV4IDwgQGNvbHVtbnMubGVuZ3RoIHRoZW4gQGNvbHVtbnNbaW5kZXhdLmNsZWFyKClcbiAgICBcbiAgICBzaGlmdENvbHVtbjogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY29sdW1ucy5sZW5ndGhcbiAgICAgICAgQGNsZWFyQ29sdW1uIDBcbiAgICAgICAgQGZsZXguc2hpZnRQYW5lKClcbiAgICAgICAgQGNvbHVtbnMuc2hpZnQoKVxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5AY29sdW1ucy5sZW5ndGhdXG4gICAgICAgICAgICBAY29sdW1uc1tpXS5zZXRJbmRleCBpXG4gICAgXG4gICAgcG9wQ29sdW1uOiAob3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuICAgICAgICBAY2xlYXJDb2x1bW4gQGNvbHVtbnMubGVuZ3RoLTFcbiAgICAgICAgQGZsZXgucG9wUGFuZSBvcHRcbiAgICAgICAgQGNvbHVtbnMucG9wKClcbiAgICAgICAgXG4gICAgcG9wRW1wdHlDb2x1bW5zOiAob3B0KSAtPiBcbiAgICAgICAgXG4gICAgICAgIGtsb2cgJ3BvcEVtcHR5Q29sdW1ucycgb3B0LCBAbGFzdERpckNvbHVtbigpPy5pbmRleFxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBAbGFzdERpckNvbHVtbigpPy5pbmRleCA/IDAsIHBvcDp0cnVlXG4gICAgICAgICMgQHBvcENvbHVtbihvcHQpIHdoaWxlIEBoYXNFbXB0eUNvbHVtbnMoKVxuICAgICAgICBcbiAgICBzaGlmdENvbHVtbnNUbzogKGNvbCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBpIGluIFswLi4uY29sXVxuICAgICAgICAgICAgQHNoaWZ0Q29sdW1uKClcbiAgICAgICAgICAgIFxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBjbGVhcjogLT4gQGNsZWFyQ29sdW1uc0Zyb20gMCwgcG9wOnRydWUgXG4gICAgXG4gICAgY2xlYXJDb2x1bW5zRnJvbTogKGM9MCwgb3B0PXBvcDpmYWxzZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJjbGVhckNvbHVtbnNGcm9tICN7Y30/XCIgaWYgbm90IGM/IG9yIGMgPCAwXG4gICAgICAgIFxuICAgICAgICBudW0gPSBAbnVtQ29scygpXG4gICAgICAgIGlmIG9wdC5wb3BcbiAgICAgICAgICAgIGlmIG9wdC5jbGVhcj9cbiAgICAgICAgICAgICAgICB3aGlsZSBjIDw9IG9wdC5jbGVhclxuICAgICAgICAgICAgICAgICAgICBAY2xlYXJDb2x1bW4gY1xuICAgICAgICAgICAgICAgICAgICBjKytcbiAgICAgICAgICAgIHdoaWxlIGMgPCBudW1cbiAgICAgICAgICAgICAgICBAcG9wQ29sdW1uKClcbiAgICAgICAgICAgICAgICBjKytcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2hpbGUgYyA8IG51bVxuICAgICAgICAgICAgICAgIEBjbGVhckNvbHVtbiBjXG4gICAgICAgICAgICAgICAgYysrXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgaXNNZXNzeTogLT4gbm90IEBmbGV4LnJlbGF4ZWQgb3IgQGhhc0VtcHR5Q29sdW1ucygpXG4gICAgXG4gICAgY2xlYW5VcDogLT4gXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgQGZsZXg/XG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgQGlzTWVzc3koKVxuICAgICAgICBAcG9wRW1wdHlDb2x1bW5zKClcbiAgICAgICAgQGZsZXgucmVsYXgoKVxuICAgICAgICB0cnVlXG5cbiAgICByZXNpemVkOiAtPiBcbiAgICAgICAgICAgIFxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgXG4gICAgdXBkYXRlQ29sdW1uU2Nyb2xsczogPT5cbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBjLnVwZGF0ZUNydW1iKClcbiAgICAgICAgICAgIGMuc2Nyb2xsLnVwZGF0ZSgpXG5cbiAgICByZXNldDogLT4gZGVsZXRlIEBjb2xzOyBAaW5pdENvbHVtbnMoKVxuICAgIHN0b3A6ICAtPiBAY29scy5yZW1vdmUoKTsgQGNvbHMgPSBudWxsXG4gICAgc3RhcnQ6IC0+IEBpbml0Q29sdW1ucygpXG5cbiAgICByZWZyZXNoOiA9PiByZXNldCgpXG4gICAgICAgIFxuICAgICMgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBjb252ZXJ0UFhNOiAocm93KSAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbSAgID0gcm93Lml0ZW1cbiAgICAgICAgZmlsZSAgID0gaXRlbS5maWxlXG4gICAgICAgIHRtcFBYTSA9IHNsYXNoLmpvaW4gb3MudG1wZGlyKCksIFwia28tI3tzbGFzaC5iYXNlIGZpbGV9LnB4bVwiXG4gICAgICAgIHRtcFBORyA9IHNsYXNoLnN3YXBFeHQgdG1wUFhNLCAnLnBuZydcblxuICAgICAgICBmcy5jb3B5IGZpbGUsIHRtcFBYTSwgKGVycikgPT5cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJjYW4ndCBjb3B5IHB4bSBpbWFnZSAje2ZpbGV9IHRvICN7dG1wUFhNfTogI3tlcnJ9XCIgaWYgZXJyP1xuICAgICAgICAgICAgY2hpbGRwLmV4ZWMgXCJvcGVuICN7X19kaXJuYW1lfS8uLi8uLi9iaW4vcHhtMnBuZy5hcHAgLS1hcmdzICN7dG1wUFhNfVwiLCAoZXJyKSA9PlxuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJjYW4ndCBjb252ZXJ0IHB4bSBpbWFnZSAje3RtcFBYTX0gdG8gI3t0bXBQTkd9OiAje2Vycn1cIiBpZiBlcnI/XG4gICAgICAgICAgICAgICAgbG9hZERlbGF5ZWQgPSA9PiBAbG9hZEltYWdlIHJvdywgdG1wUE5HXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCBsb2FkRGVsYXllZCwgMzAwXG5cbiAgICBjb252ZXJ0SW1hZ2U6IChyb3cpIC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtICAgPSByb3cuaXRlbVxuICAgICAgICBmaWxlICAgPSBpdGVtLmZpbGVcbiAgICAgICAgdG1wSW1nID0gc2xhc2guam9pbiBvcy50bXBkaXIoKSwgXCJrby0je3NsYXNoLmJhc2VuYW1lIGZpbGV9LnBuZ1wiXG4gICAgICAgIFxuICAgICAgICBjaGlsZHAuZXhlYyBcIi91c3IvYmluL3NpcHMgLXMgZm9ybWF0IHBuZyBcXFwiI3tmaWxlfVxcXCIgLS1vdXQgXFxcIiN7dG1wSW1nfVxcXCJcIiwgKGVycikgPT5cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJjYW4ndCBjb252ZXJ0IGltYWdlICN7ZmlsZX06ICN7ZXJyfVwiIGlmIGVycj9cbiAgICAgICAgICAgIEBsb2FkSW1hZ2Ugcm93LCB0bXBJbWdcblxuICAgIGxvYWRJbWFnZTogKHJvdywgZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3Qgcm93LmlzQWN0aXZlKClcblxuICAgICAgICBjb2wgPSBAZW1wdHlDb2x1bW4gb3B0Py5jb2x1bW5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sLmluZGV4XG4gICAgICAgIGNudCA9IGVsZW0gY2xhc3M6ICdicm93c2VySW1hZ2VDb250YWluZXInLCBjaGlsZDogXG4gICAgICAgICAgICBlbGVtICdpbWcnLCBjbGFzczogJ2Jyb3dzZXJJbWFnZScsIHNyYzogc2xhc2guZmlsZVVybCBmaWxlXG4gICAgICAgIGNvbC50YWJsZS5hcHBlbmRDaGlsZCBjbnRcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEJyb3dzZXJcbiJdfQ==
//# sourceURL=../coffee/browser.coffee