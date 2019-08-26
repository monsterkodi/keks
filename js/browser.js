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
        if (index < 0) {
            return;
        }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNkdBQUE7SUFBQTs7OztBQVFBLE1BQWlGLE9BQUEsQ0FBUSxLQUFSLENBQWpGLEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUsZUFBZixFQUFxQixpQkFBckIsRUFBNEIsdUJBQTVCLEVBQXNDLG1CQUF0QyxFQUE4QyxpQkFBOUMsRUFBcUQsV0FBckQsRUFBeUQsV0FBekQsRUFBNkQsZUFBN0QsRUFBbUUsbUJBQW5FLEVBQTJFOztBQUUzRSxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0FBQ1QsSUFBQSxHQUFTLE9BQUEsQ0FBUSxhQUFSOztBQUNULEtBQUEsR0FBUyxPQUFBLENBQVEsUUFBUjs7QUFFSDs7O0lBRVcsaUJBQUMsSUFBRDtRQUFDLElBQUMsQ0FBQSxPQUFEOzs7O1FBRVYsSUFBQyxDQUFBLE9BQUQsR0FBVztRQUVYLFFBQUEsQ0FBUyxrQkFBVCxFQUE0QixTQUE1QixFQUFzQyxLQUFLLENBQUMsR0FBTixDQUFVLHdCQUFWLENBQUEsSUFBd0MsTUFBeEMsSUFBa0QsU0FBeEY7SUFKUzs7c0JBWWIsV0FBQSxHQUFhLFNBQUE7UUFFVCxJQUFVLG1CQUFBLElBQVcsSUFBQyxDQUFBLElBQUksQ0FBQyxVQUFOLEtBQW9CLElBQUMsQ0FBQSxJQUExQztBQUFBLG1CQUFBOztRQUVBLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBTixHQUFrQjtRQUVsQixJQUFHLGlCQUFIO1lBQ0ksSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLElBQUMsQ0FBQSxJQUFuQjtBQUNBLG1CQUZKOztRQUlBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxTQUFQO1lBQWtCLEVBQUEsRUFBSSxTQUF0QjtTQUFMO1FBQ1IsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFO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QUFDLEdBQUQ7Z0JBQ3pFLElBQXVELFdBQXZEO0FBQUEsMkJBQU8sTUFBQSxDQUFPLHNCQUFBLEdBQXVCLElBQXZCLEdBQTRCLElBQTVCLEdBQWdDLEdBQXZDLEVBQVA7O3VCQUNBLEtBQUMsQ0FBQSxTQUFELENBQVcsR0FBWCxFQUFnQixRQUFoQjtZQUZ5RTtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBN0U7SUFOVTs7c0JBVWQsU0FBQSxHQUFXLFNBQUMsR0FBRCxFQUFNLElBQU47QUFFUCxZQUFBO1FBQUEsSUFBVSxDQUFJLEdBQUcsQ0FBQyxRQUFKLENBQUEsQ0FBZDtBQUFBLG1CQUFBOztRQUVBLEdBQUEsR0FBTSxJQUFDLENBQUEsV0FBRCw4Q0FBYSxHQUFHLENBQUUsZUFBbEI7UUFDTixJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsR0FBRyxDQUFDLEtBQXRCO1FBQ0EsR0FBQSxHQUFNLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sdUJBQVA7WUFBZ0MsS0FBQSxFQUN2QyxJQUFBLENBQUssS0FBTCxFQUFZO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sY0FBUDtnQkFBdUIsR0FBQSxFQUFLLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBZCxDQUE1QjthQUFaLENBRE87U0FBTDtlQUVOLEdBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVixDQUFzQixHQUF0QjtJQVJPOzs7O0dBblNPOztBQTZTdEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxueyBwb3N0LCBwcmVmcywgZWxlbSwgY2xhbXAsIHNldFN0eWxlLCBjaGlsZHAsIHNsYXNoLCBmcywgb3MsIGtsb2csIGtlcnJvciwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Db2x1bW4gPSByZXF1aXJlICcuL2NvbHVtbidcbmZsZXggICA9IHJlcXVpcmUgJy4vZmxleC9mbGV4J1xuZXZlbnQgID0gcmVxdWlyZSAnZXZlbnRzJ1xuXG5jbGFzcyBCcm93c2VyIGV4dGVuZHMgZXZlbnRcbiAgICBcbiAgICBjb25zdHJ1Y3RvcjogKEB2aWV3KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNvbHVtbnMgPSBbXVxuICAgICAgICBcbiAgICAgICAgc2V0U3R5bGUgJy5icm93c2VyUm93IC5leHQnICdkaXNwbGF5JyBwcmVmcy5nZXQoJ2Jyb3dzZXLilrhoaWRlRXh0ZW5zaW9ucycpIGFuZCAnbm9uZScgb3IgJ2luaXRpYWwnXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBpbml0Q29sdW1uczogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAY29scz8gYW5kIEBjb2xzLnBhcmVudE5vZGUgPT0gQHZpZXdcbiAgICAgICAgXG4gICAgICAgIEB2aWV3LmlubmVySFRNTCA9ICcnXG4gICAgICAgIFxuICAgICAgICBpZiBAY29scz9cbiAgICAgICAgICAgIEB2aWV3LmFwcGVuZENoaWxkIEBjb2xzXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBAY29scyA9IGVsZW0gY2xhc3M6ICdicm93c2VyJywgaWQ6ICdjb2x1bW5zJ1xuICAgICAgICBAdmlldy5hcHBlbmRDaGlsZCBAY29sc1xuICAgICAgICBcbiAgICAgICAgQGNvbHVtbnMgPSBbXVxuXG4gICAgICAgIEBmbGV4ID0gbmV3IGZsZXggXG4gICAgICAgICAgICB2aWV3OiAgICAgICBAY29sc1xuICAgICAgICAgICAgb25QYW5lU2l6ZTogQHVwZGF0ZUNvbHVtblNjcm9sbHNcbiAgICAgICAgXG4gICAgY29sdW1uQXRQb3M6IChwb3MpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBlbGVtLmNvbnRhaW5zUG9zIGNvbHVtbi5kaXYsIHBvc1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2x1bW5cbiAgICAgICAgbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGxvYWRJdGVtczogKGl0ZW1zLCBvcHQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuICAgICAgICBjb2wgPSBAZW1wdHlDb2x1bW4gb3B0Py5jb2x1bW5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sLmluZGV4XG4gICAgICAgIGNvbC5zZXRJdGVtcyBpdGVtcywgb3B0XG5cbiAgICAgICAgaWYgb3B0LmFjdGl2YXRlP1xuICAgICAgICAgICAgY29sLnJvdyhvcHQuYWN0aXZhdGUpPy5hY3RpdmF0ZSgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG9wdC5yb3c/XG4gICAgICAgICAgICBjb2wuZm9jdXMoKVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG9wdC5mb2N1c1xuICAgICAgICAgICAgQGZvY3VzKClcbiAgICAgICAgICAgIEBsYXN0VXNlZENvbHVtbigpPy5hY3RpdmVSb3coKT8uc2V0QWN0aXZlKCkgICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICBAcG9wRW1wdHlDb2x1bW5zIHJlbGF4OmZhbHNlXG4gICAgICAgIEBcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBuYXZpZ2F0ZTogKGtleSkgLT5cbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gQGZvY3VzQ29sdW1uKCk/LmluZGV4ID8gMFxuICAgICAgICBpbmRleCArPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiAtMVxuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gKzFcbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgaW5kZXggPCAwXG4gICAgICAgIGluZGV4ID0gY2xhbXAgMCwgQG51bUNvbHMoKS0xLCBpbmRleFxuICAgICAgICBpZiBAY29sdW1uc1tpbmRleF0ubnVtUm93cygpXG4gICAgICAgICAgICBAY29sdW1uc1tpbmRleF0uZm9jdXMoKS5hY3RpdmVSb3coKS5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGZvY3VzOiAob3B0KSA9PiBcbiAgICAgICAgQGxhc3RVc2VkQ29sdW1uKCk/LmZvY3VzIG9wdFxuICAgICAgICBAXG4gICAgXG4gICAgZm9jdXNDb2x1bW46IC0+IFxuICAgICAgICBmb3IgYyBpbiBAY29sdW1uc1xuICAgICAgICAgICAgcmV0dXJuIGMgaWYgYy5oYXNGb2N1cygpXG4gICAgICBcbiAgICAjIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAgIDAwMCAgICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgZW1wdHlDb2x1bW46IChjb2xJbmRleCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGNvbEluZGV4P1xuICAgICAgICAgICAgZm9yIGMgaW4gW2NvbEluZGV4Li4uQG51bUNvbHMoKV1cbiAgICAgICAgICAgICAgICBAY2xlYXJDb2x1bW4gY1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBmb3IgY29sIGluIEBjb2x1bW5zXG4gICAgICAgICAgICByZXR1cm4gY29sIGlmIGNvbC5pc0VtcHR5KClcbiAgICAgICAgICAgIFxuICAgICAgICBAYWRkQ29sdW1uKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAgIFxuICAgIFxuICAgIGFjdGl2ZUNvbHVtbjogLT4gQGNvbHVtbiBAYWN0aXZlQ29sdW1uSW5kZXgoKVxuICAgIGFjdGl2ZUNvbHVtbkluZGV4OiAtPiBcbiAgICAgICAgXG4gICAgICAgIGZvciBjb2wgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbC5oYXNGb2N1cygpIHRoZW4gcmV0dXJuIGNvbC5pbmRleFxuICAgICAgICAwXG4gICAgICAgICAgICAgICAgXG4gICAgbGFzdFVzZWRDb2x1bW46IC0+XG4gICAgICAgIFxuICAgICAgICB1c2VkID0gbnVsbFxuICAgICAgICBmb3IgY29sIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBub3QgY29sLmlzRW1wdHkoKVxuICAgICAgICAgICAgICAgIHVzZWQgPSBjb2wgXG4gICAgICAgICAgICBlbHNlIGJyZWFrXG4gICAgICAgIHVzZWRcblxuICAgIGhhc0VtcHR5Q29sdW1uczogLT4gXy5sYXN0KEBjb2x1bW5zKS5pc0VtcHR5KClcblxuICAgIGhlaWdodDogLT4gQGZsZXg/LmhlaWdodCgpXG4gICAgbnVtQ29sczogLT4gQGNvbHVtbnMubGVuZ3RoIFxuICAgIGNvbHVtbjogKGkpIC0+IEBjb2x1bW5zW2ldIGlmIDAgPD0gaSA8IEBudW1Db2xzKClcblxuICAgIG9uQmFja3NwYWNlSW5Db2x1bW46IChjb2x1bW4pIC0+IGNvbHVtbi5jbGVhclNlYXJjaCgpLnJlbW92ZU9iamVjdCgpICAgIFxuICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAgICAgICBcbiAgICBhZGRDb2x1bW46IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBmbGV4XG5cbiAgICAgICAgY29sID0gbmV3IENvbHVtbiBAXG4gICAgICAgIEBjb2x1bW5zLnB1c2ggY29sXG4gICAgICAgIEBmbGV4LmFkZFBhbmUgZGl2OmNvbC5kaXYsIHNpemU6NTBcbiAgICAgICAgY29sXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgIFxuICAgIFxuICAgIGNsZWFyQ29sdW1uOiAoaW5kZXgpIC0+IFxuICAgIFxuICAgICAgICBpZiBpbmRleCA8IEBjb2x1bW5zLmxlbmd0aFxuICAgICAgICAgICAgQGNvbHVtbnNbaW5kZXhdLmNsZWFyKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAga2xvZyAnY2xlYXJDb2x1bW4nIGluZGV4LCBAY29sdW1ucy5sZW5ndGhcbiAgICBcbiAgICBzaGlmdENvbHVtbjogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY29sdW1ucy5sZW5ndGhcbiAgICAgICAgQGNsZWFyQ29sdW1uIDBcbiAgICAgICAgQGZsZXguc2hpZnRQYW5lKClcbiAgICAgICAgQGNvbHVtbnMuc2hpZnQoKVxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5AY29sdW1ucy5sZW5ndGhdXG4gICAgICAgICAgICBAY29sdW1uc1tpXS5zZXRJbmRleCBpXG4gICAgXG4gICAgcG9wQ29sdW1uOiAob3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuICAgICAgICBAY2xlYXJDb2x1bW4gQGNvbHVtbnMubGVuZ3RoLTFcbiAgICAgICAgQGZsZXgucG9wUGFuZSBvcHRcbiAgICAgICAgQGNvbHVtbnMucG9wKClcbiAgICAgICAgXG4gICAgcG9wRW1wdHlDb2x1bW5zOiAob3B0KSAtPiBAcG9wQ29sdW1uKG9wdCkgd2hpbGUgQGhhc0VtcHR5Q29sdW1ucygpXG4gICAgICAgIFxuICAgIHBvcENvbHVtbnNGcm9tOiAoY29sKSAtPiBcbiAgICAgICAgXG4gICAgICAgIHdoaWxlIEBudW1Db2xzKCkgPiBjb2wgXG4gICAgICAgICAgICBAcG9wQ29sdW1uKClcbiAgICAgICAgICAgIFxuICAgIHNoaWZ0Q29sdW1uc1RvOiAoY29sKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5jb2xdXG4gICAgICAgICAgICBAc2hpZnRDb2x1bW4oKVxuICAgICAgICAgICAgXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGNsZWFyOiAtPiBAY2xlYXJDb2x1bW5zRnJvbSAwLCBwb3A6dHJ1ZSBcbiAgICBcbiAgICBjbGVhckNvbHVtbnNGcm9tOiAoYz0wLCBvcHQ9cG9wOmZhbHNlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtlcnJvciBcImNsZWFyQ29sdW1uc0Zyb20gI3tjfT9cIiBpZiBub3QgYz8gb3IgYyA8IDBcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdC5wb3BcbiAgICAgICAgICAgIGlmIGMgPCBAbnVtQ29scygpXG4gICAgICAgICAgICAgICAgQGNsZWFyQ29sdW1uIGNcbiAgICAgICAgICAgICAgICBjKytcbiAgICAgICAgICAgIHdoaWxlIGMgPCBAbnVtQ29scygpXG4gICAgICAgICAgICAgICAgQHBvcENvbHVtbigpXG4gICAgICAgICAgICAgICAgYysrXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdoaWxlIGMgPCBAbnVtQ29scygpXG4gICAgICAgICAgICAgICAgQGNsZWFyQ29sdW1uIGNcbiAgICAgICAgICAgICAgICBjKytcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBpc01lc3N5OiAtPiBub3QgQGZsZXgucmVsYXhlZCBvciBAaGFzRW1wdHlDb2x1bW5zKClcbiAgICBcbiAgICBjbGVhblVwOiAtPiBcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBAZmxleD9cbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBAaXNNZXNzeSgpXG4gICAgICAgIEBwb3BFbXB0eUNvbHVtbnMoKVxuICAgICAgICBAZmxleC5yZWxheCgpXG4gICAgICAgIHRydWVcblxuICAgIHJlc2l6ZWQ6IC0+IEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcbiAgICBcbiAgICB1cGRhdGVDb2x1bW5TY3JvbGxzOiA9PlxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGMudXBkYXRlQ3J1bWIoKVxuICAgICAgICAgICAgYy5zY3JvbGwudXBkYXRlKClcblxuICAgIHJlc2V0OiAtPiBkZWxldGUgQGNvbHM7IEBpbml0Q29sdW1ucygpXG4gICAgc3RvcDogIC0+IEBjb2xzLnJlbW92ZSgpOyBAY29scyA9IG51bGxcbiAgICBzdGFydDogLT4gQGluaXRDb2x1bW5zKClcblxuICAgIHJlZnJlc2g6ID0+IHJlc2V0KClcbiAgICAgICAgXG4gICAgIyAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGNvbnZlcnRQWE06IChyb3cpIC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtID0gcm93Lml0ZW1cbiAgICAgICAgZmlsZSA9IGl0ZW0uZmlsZVxuICAgICAgICB0bXBQWE0gPSBzbGFzaC5qb2luIG9zLnRtcGRpcigpLCBcImtvLSN7c2xhc2guYmFzZSBmaWxlfS5weG1cIlxuICAgICAgICB0bXBQTkcgPSBzbGFzaC5zd2FwRXh0IHRtcFBYTSwgJy5wbmcnXG5cbiAgICAgICAgZnMuY29weSBmaWxlLCB0bXBQWE0sIChlcnIpID0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29weSBweG0gaW1hZ2UgI3tmaWxlfSB0byAje3RtcFBYTX06ICN7ZXJyfVwiIGlmIGVycj9cbiAgICAgICAgICAgIGNoaWxkcC5leGVjIFwib3BlbiAje19fZGlybmFtZX0vLi4vLi4vYmluL3B4bTJwbmcuYXBwIC0tYXJncyAje3RtcFBYTX1cIiwgKGVycikgPT5cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29udmVydCBweG0gaW1hZ2UgI3t0bXBQWE19IHRvICN7dG1wUE5HfTogI3tlcnJ9XCIgaWYgZXJyP1xuICAgICAgICAgICAgICAgIGxvYWREZWxheWVkID0gPT4gQGxvYWRJbWFnZSByb3csIHRtcFBOR1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQgbG9hZERlbGF5ZWQsIDMwMFxuXG4gICAgY29udmVydEltYWdlOiAocm93KSAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbSA9IHJvdy5pdGVtXG4gICAgICAgIGZpbGUgPSBpdGVtLmZpbGVcbiAgICAgICAgdG1wSW1hZ2UgPSBzbGFzaC5qb2luIG9zLnRtcGRpcigpLCBcImtvLSN7c2xhc2guYmFzZW5hbWUgZmlsZX0ucG5nXCJcbiAgICAgICAgXG4gICAgICAgIGNoaWxkcC5leGVjIFwiL3Vzci9iaW4vc2lwcyAtcyBmb3JtYXQgcG5nIFxcXCIje2ZpbGV9XFxcIiAtLW91dCBcXFwiI3t0bXBJbWFnZX1cXFwiXCIsIChlcnIpID0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29udmVydCBpbWFnZSAje2ZpbGV9OiAje2Vycn1cIiBpZiBlcnI/XG4gICAgICAgICAgICBAbG9hZEltYWdlIHJvdywgdG1wSW1hZ2VcblxuICAgIGxvYWRJbWFnZTogKHJvdywgZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3Qgcm93LmlzQWN0aXZlKClcblxuICAgICAgICBjb2wgPSBAZW1wdHlDb2x1bW4gb3B0Py5jb2x1bW5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sLmluZGV4XG4gICAgICAgIGNudCA9IGVsZW0gY2xhc3M6ICdicm93c2VySW1hZ2VDb250YWluZXInLCBjaGlsZDogXG4gICAgICAgICAgICBlbGVtICdpbWcnLCBjbGFzczogJ2Jyb3dzZXJJbWFnZScsIHNyYzogc2xhc2guZmlsZVVybCBmaWxlXG4gICAgICAgIGNvbC50YWJsZS5hcHBlbmRDaGlsZCBjbnRcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEJyb3dzZXJcbiJdfQ==
//# sourceURL=../coffee/browser.coffee