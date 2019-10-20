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
        var col, index, ref1, ref2, row;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsK0dBQUE7SUFBQTs7QUFRQSxNQUEwRixPQUFBLENBQVEsS0FBUixDQUExRixFQUFFLGVBQUYsRUFBUSxpQkFBUixFQUFlLGVBQWYsRUFBcUIsaUJBQXJCLEVBQTRCLHVCQUE1QixFQUFzQyxtQkFBdEMsRUFBOEMsaUJBQTlDLEVBQXFELFdBQXJELEVBQXlELFdBQXpELEVBQTZELGVBQTdELEVBQW1FLGVBQW5FLEVBQXlFLG1CQUF6RSxFQUFpRixTQUFqRixFQUFvRjs7QUFFcEYsTUFBQSxHQUFTLE9BQUEsQ0FBUSxVQUFSOztBQUNULElBQUEsR0FBUyxPQUFBLENBQVEsYUFBUjs7QUFFSDtJQUVXLGlCQUFDLElBQUQ7UUFBQyxJQUFDLENBQUEsT0FBRDs7OztRQUVWLElBQUMsQ0FBQSxPQUFELEdBQVc7UUFFWCxRQUFBLENBQVMsa0JBQVQsRUFBNEIsU0FBNUIsRUFBc0MsS0FBSyxDQUFDLEdBQU4sQ0FBVSx3QkFBVixDQUFBLElBQXdDLE1BQXhDLElBQWtELFNBQXhGO0lBSlM7O3NCQVliLFdBQUEsR0FBYSxTQUFBO1FBRVQsSUFBVSxtQkFBQSxJQUFXLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBTixLQUFvQixJQUFDLENBQUEsSUFBMUM7QUFBQSxtQkFBQTs7UUFFQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sR0FBa0I7UUFFbEIsSUFBRyxpQkFBSDtZQUNJLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixJQUFDLENBQUEsSUFBbkI7QUFDQSxtQkFGSjs7UUFJQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sU0FBTjtZQUFnQixFQUFBLEVBQUcsU0FBbkI7U0FBTDtRQUNSLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixJQUFDLENBQUEsSUFBbkI7UUFFQSxJQUFDLENBQUEsT0FBRCxHQUFXO2VBRVgsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFJLElBQUosQ0FDSjtZQUFBLElBQUEsRUFBWSxJQUFDLENBQUEsSUFBYjtZQUNBLFVBQUEsRUFBWSxJQUFDLENBQUEsbUJBRGI7U0FESTtJQWZDOztzQkFtQmIsV0FBQSxHQUFhLFNBQUMsR0FBRDtBQUVULFlBQUE7QUFBQTtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksSUFBRyxJQUFJLENBQUMsV0FBTCxDQUFpQixNQUFNLENBQUMsR0FBeEIsRUFBNkIsR0FBN0IsQ0FBSDtBQUNJLHVCQUFPLE9BRFg7O0FBREo7ZUFHQTtJQUxTOztzQkFPYixTQUFBLEdBQVcsU0FBQyxDQUFEO0FBRVAsWUFBQTtBQUFBO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxJQUFBLEdBQU8sSUFBQSxDQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUMscUJBQVgsQ0FBQSxDQUFrQyxDQUFDLElBQXhDLEVBQThDLE1BQU0sQ0FBQyxHQUFHLENBQUMscUJBQVgsQ0FBQSxDQUFrQyxDQUFDLEdBQWpGO1lBQ1AsSUFBQSxDQUFLLENBQUwsRUFBUSxJQUFSO1lBQ0EsR0FBQSxHQUFNLElBQUEsQ0FBSyxDQUFMLEVBQVEsSUFBSSxDQUFDLENBQWI7WUFDTixJQUFHLElBQUksQ0FBQyxXQUFMLENBQWlCLE1BQU0sQ0FBQyxHQUF4QixFQUE2QixHQUE3QixDQUFIO0FBQ0ksdUJBQU8sT0FEWDs7QUFKSjtlQU1BO0lBUk87O3NCQVVYLFFBQUEsR0FBVSxTQUFDLEdBQUQ7QUFFTixZQUFBO1FBQUEsSUFBRyxNQUFBLEdBQVMsSUFBQyxDQUFBLFdBQUQsQ0FBYSxHQUFiLENBQVo7QUFDSSxtQkFBTyxNQUFNLENBQUMsUUFBUCxDQUFnQixHQUFoQixFQURYOztlQUVBO0lBSk07O3NCQVlWLFFBQUEsR0FBVSxTQUFDLEdBQUQ7QUFFTixZQUFBO1FBQUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQUE7UUFFQSxJQUFHLEdBQUEsS0FBTyxJQUFWO1lBQ0ksSUFBRyxJQUFDLENBQUEsaUJBQUQsQ0FBQSxDQUFBLEdBQXVCLENBQTFCO2dCQUNJLElBQUcsR0FBQSxHQUFNLElBQUMsQ0FBQSxZQUFELENBQUEsQ0FBVDtvQkFDSSxJQUFHLEdBQUEsR0FBTSxHQUFHLENBQUMsU0FBSixDQUFBLENBQVQ7d0JBQ0ksSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBbkIsQ0FBVixFQURKO3FCQUFBLE1BQUE7d0JBR0ksSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQUcsQ0FBQyxJQUFKLENBQUEsQ0FBVixDQUFWLEVBSEo7cUJBREo7aUJBREo7YUFBQSxNQUFBO2dCQU9JLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxLQUFLLENBQUMsR0FBTixDQUFVLElBQUMsQ0FBQSxPQUFRLENBQUEsQ0FBQSxDQUFFLENBQUMsSUFBWixDQUFBLENBQVYsQ0FBVixDQUFWLEVBUEo7YUFESjtTQUFBLE1BQUE7WUFVSSxLQUFBLHVGQUFnQztZQUNoQyxLQUFBO0FBQVMsd0JBQU8sR0FBUDtBQUFBLHlCQUNBLE1BREE7QUFBQSx5QkFDTSxJQUROOytCQUNnQixDQUFDO0FBRGpCLHlCQUVBLE9BRkE7K0JBRWdCLENBQUM7QUFGakI7O1lBSVQsS0FBQSxHQUFRLEtBQUEsQ0FBTSxDQUFOLEVBQVMsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFBLEdBQVcsQ0FBcEIsRUFBdUIsS0FBdkI7WUFDUixJQUFHLElBQUMsQ0FBQSxPQUFRLENBQUEsS0FBQSxDQUFNLENBQUMsT0FBaEIsQ0FBQSxDQUFIO2dCQUNJLElBQUMsQ0FBQSxPQUFRLENBQUEsS0FBQSxDQUFNLENBQUMsS0FBaEIsQ0FBQSxDQUF1QixDQUFDLFNBQXhCLENBQUEsQ0FBbUMsQ0FBQyxRQUFwQyxDQUFBLEVBREo7YUFoQko7O1FBbUJBLElBQUMsQ0FBQSxtQkFBRCxDQUFBO2VBQ0E7SUF4Qk07O3NCQWdDVixLQUFBLEdBQU8sU0FBQyxHQUFEO0FBQ0gsWUFBQTs7Z0JBQWdCLENBQUUsS0FBbEIsQ0FBd0IsR0FBeEI7O2VBQ0E7SUFGRzs7c0JBSVAsV0FBQSxHQUFhLFNBQUE7QUFDVCxZQUFBO0FBQUE7QUFBQSxhQUFBLHNDQUFBOztZQUNJLElBQVksQ0FBQyxDQUFDLFFBQUYsQ0FBQSxDQUFaO0FBQUEsdUJBQU8sRUFBUDs7QUFESjtJQURTOztzQkFVYixXQUFBLEdBQWEsU0FBQyxRQUFEO0FBRVQsWUFBQTtRQUFBLElBQUcsZ0JBQUg7QUFDSSxpQkFBUyxnSEFBVDtnQkFDSSxJQUFDLENBQUEsV0FBRCxDQUFhLENBQWI7QUFESixhQURKOztBQUlBO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxJQUFjLEdBQUcsQ0FBQyxPQUFKLENBQUEsQ0FBZDtBQUFBLHVCQUFPLElBQVA7O0FBREo7ZUFHQSxJQUFDLENBQUEsU0FBRCxDQUFBO0lBVFM7O3NCQWlCYixZQUFBLEdBQWMsU0FBQTtlQUFHLElBQUMsQ0FBQSxNQUFELENBQVEsSUFBQyxDQUFBLGlCQUFELENBQUEsQ0FBUjtJQUFIOztzQkFDZCxpQkFBQSxHQUFtQixTQUFBO0FBRWYsWUFBQTtBQUFBO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxJQUFHLEdBQUcsQ0FBQyxRQUFKLENBQUEsQ0FBSDtBQUF1Qix1QkFBTyxHQUFHLENBQUMsTUFBbEM7O0FBREo7ZUFFQTtJQUplOztzQkFNbkIsY0FBQSxHQUFnQixTQUFBO0FBRVosWUFBQTtRQUFBLElBQUEsR0FBTztBQUNQO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxJQUFHLENBQUksR0FBRyxDQUFDLE9BQUosQ0FBQSxDQUFQO2dCQUNJLElBQUEsR0FBTyxJQURYO2FBQUEsTUFBQTtBQUVLLHNCQUZMOztBQURKO2VBSUE7SUFQWTs7c0JBU2hCLGVBQUEsR0FBaUIsU0FBQTtlQUFHLElBQUMsQ0FBQSxPQUFRLFVBQUUsQ0FBQSxDQUFBLENBQUMsQ0FBQyxPQUFiLENBQUE7SUFBSDs7c0JBRWpCLE1BQUEsR0FBUSxTQUFBO0FBQUcsWUFBQTtnREFBSyxDQUFFLE1BQVAsQ0FBQTtJQUFIOztzQkFDUixPQUFBLEdBQVMsU0FBQTtlQUFHLElBQUMsQ0FBQSxPQUFPLENBQUM7SUFBWjs7c0JBQ1QsTUFBQSxHQUFRLFNBQUMsQ0FBRDtRQUFPLElBQWUsQ0FBQSxDQUFBLElBQUssQ0FBTCxJQUFLLENBQUwsR0FBUyxJQUFDLENBQUEsT0FBRCxDQUFBLENBQVQsQ0FBZjttQkFBQSxJQUFDLENBQUEsT0FBUSxDQUFBLENBQUEsRUFBVDs7SUFBUDs7c0JBUVIsU0FBQSxHQUFXLFNBQUE7QUFFUCxZQUFBO1FBQUEsSUFBVSxDQUFJLElBQUMsQ0FBQSxJQUFmO0FBQUEsbUJBQUE7O1FBRUEsR0FBQSxHQUFNLElBQUksTUFBSixDQUFXLElBQVg7UUFDTixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxHQUFkO1FBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLENBQWM7WUFBQSxHQUFBLEVBQUksR0FBRyxDQUFDLEdBQVI7WUFBYSxJQUFBLEVBQUssRUFBbEI7U0FBZDtlQUNBO0lBUE87O3NCQWVYLFdBQUEsR0FBYSxTQUFDLEtBQUQ7UUFBVyxJQUFHLEtBQUEsR0FBUSxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQXBCO21CQUFnQyxJQUFDLENBQUEsT0FBUSxDQUFBLEtBQUEsQ0FBTSxDQUFDLEtBQWhCLENBQUEsRUFBaEM7O0lBQVg7O3NCQUViLFdBQUEsR0FBYSxTQUFBO0FBRVQsWUFBQTtRQUFBLElBQVUsQ0FBSSxJQUFDLENBQUEsSUFBZjtBQUFBLG1CQUFBOztRQUNBLElBQVUsQ0FBSSxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQXZCO0FBQUEsbUJBQUE7O1FBQ0EsSUFBQyxDQUFBLFdBQUQsQ0FBYSxDQUFiO1FBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLENBQUE7UUFDQSxJQUFDLENBQUEsT0FBTyxDQUFDLEtBQVQsQ0FBQTtBQUVBO2FBQVMsaUdBQVQ7eUJBQ0ksSUFBQyxDQUFBLE9BQVEsQ0FBQSxDQUFBLENBQUUsQ0FBQyxRQUFaLENBQXFCLENBQXJCO0FBREo7O0lBUlM7O3NCQVdiLFNBQUEsR0FBVyxTQUFDLEdBQUQ7UUFFUCxJQUFVLENBQUksSUFBQyxDQUFBLElBQWY7QUFBQSxtQkFBQTs7UUFDQSxJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxHQUFnQixDQUE3QjtRQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTixDQUFjLEdBQWQ7ZUFDQSxJQUFDLENBQUEsT0FBTyxDQUFDLEdBQVQsQ0FBQTtJQUxPOztzQkFPWCxlQUFBLEdBQWlCLFNBQUMsR0FBRDtBQUViLFlBQUE7UUFBQSxJQUFBLENBQUssaUJBQUwsRUFBdUIsR0FBdkIsOENBQTRDLENBQUUsY0FBOUM7ZUFDQSxJQUFDLENBQUEsZ0JBQUQsdUZBQTRDLENBQTVDLEVBQStDO1lBQUEsR0FBQSxFQUFJLElBQUo7U0FBL0M7SUFIYTs7c0JBTWpCLGNBQUEsR0FBZ0IsU0FBQyxHQUFEO0FBRVosWUFBQTtRQUFBLElBQUMsQ0FBQSxXQUFELENBQUE7QUFFQSxhQUFTLGlGQUFUO1lBQ0ksSUFBQyxDQUFBLFdBQUQsQ0FBQTtBQURKO2VBR0EsSUFBQyxDQUFBLG1CQUFELENBQUE7SUFQWTs7c0JBZWhCLEtBQUEsR0FBTyxTQUFBO2VBQUcsSUFBQyxDQUFBLGdCQUFELENBQWtCLENBQWxCLEVBQXFCO1lBQUEsR0FBQSxFQUFJLElBQUo7U0FBckI7SUFBSDs7c0JBRVAsZ0JBQUEsR0FBa0IsU0FBQyxDQUFELEVBQU0sR0FBTjtBQUVkLFlBQUE7O1lBRmUsSUFBRTs7O1lBQUcsTUFBSTtnQkFBQSxHQUFBLEVBQUksS0FBSjs7O1FBRXhCLElBQThDLFdBQUosSUFBVSxDQUFBLEdBQUksQ0FBeEQ7QUFBQSxtQkFBTyxNQUFBLENBQU8sbUJBQUEsR0FBb0IsQ0FBcEIsR0FBc0IsR0FBN0IsRUFBUDs7UUFFQSxHQUFBLEdBQU0sSUFBQyxDQUFBLE9BQUQsQ0FBQTtRQUNOLElBQUcsR0FBRyxDQUFDLEdBQVA7WUFDSSxJQUFHLGlCQUFIO0FBQ0ksdUJBQU0sQ0FBQSxJQUFLLEdBQUcsQ0FBQyxLQUFmO29CQUNJLElBQUMsQ0FBQSxXQUFELENBQWEsQ0FBYjtvQkFDQSxDQUFBO2dCQUZKLENBREo7O0FBSUE7bUJBQU0sQ0FBQSxHQUFJLEdBQVY7Z0JBQ0ksSUFBQyxDQUFBLFNBQUQsQ0FBQTs2QkFDQSxDQUFBO1lBRkosQ0FBQTsyQkFMSjtTQUFBLE1BQUE7QUFTSTttQkFBTSxDQUFBLEdBQUksR0FBVjtnQkFDSSxJQUFDLENBQUEsV0FBRCxDQUFhLENBQWI7OEJBQ0EsQ0FBQTtZQUZKLENBQUE7NEJBVEo7O0lBTGM7O3NCQXdCbEIsT0FBQSxHQUFTLFNBQUE7ZUFBRyxDQUFJLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBVixJQUFxQixJQUFDLENBQUEsZUFBRCxDQUFBO0lBQXhCOztzQkFFVCxPQUFBLEdBQVMsU0FBQTtRQUNMLElBQW9CLGlCQUFwQjtBQUFBLG1CQUFPLE1BQVA7O1FBQ0EsSUFBZ0IsQ0FBSSxJQUFDLENBQUEsT0FBRCxDQUFBLENBQXBCO0FBQUEsbUJBQU8sTUFBUDs7UUFDQSxJQUFDLENBQUEsZUFBRCxDQUFBO1FBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFOLENBQUE7ZUFDQTtJQUxLOztzQkFPVCxPQUFBLEdBQVMsU0FBQTtlQUVMLElBQUMsQ0FBQSxtQkFBRCxDQUFBO0lBRks7O3NCQUlULG1CQUFBLEdBQXFCLFNBQUE7QUFFakIsWUFBQTtBQUFBO0FBQUE7YUFBQSxzQ0FBQTs7WUFDSSxDQUFDLENBQUMsV0FBRixDQUFBO3lCQUNBLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBVCxDQUFBO0FBRko7O0lBRmlCOztzQkFNckIsS0FBQSxHQUFPLFNBQUE7UUFBRyxPQUFPLElBQUMsQ0FBQTtlQUFNLElBQUMsQ0FBQSxXQUFELENBQUE7SUFBakI7O3NCQUNQLElBQUEsR0FBTyxTQUFBO1FBQUcsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFOLENBQUE7ZUFBZ0IsSUFBQyxDQUFBLElBQUQsR0FBUTtJQUEzQjs7c0JBQ1AsS0FBQSxHQUFPLFNBQUE7ZUFBRyxJQUFDLENBQUEsV0FBRCxDQUFBO0lBQUg7O3NCQUVQLE9BQUEsR0FBUyxTQUFBO2VBQUcsS0FBQSxDQUFBO0lBQUg7O3NCQVFULFVBQUEsR0FBWSxTQUFDLEdBQUQ7QUFFUixZQUFBO1FBQUEsSUFBQSxHQUFTLEdBQUcsQ0FBQztRQUNiLElBQUEsR0FBUyxJQUFJLENBQUM7UUFDZCxNQUFBLEdBQVMsS0FBSyxDQUFDLElBQU4sQ0FBVyxFQUFFLENBQUMsTUFBSCxDQUFBLENBQVgsRUFBd0IsS0FBQSxHQUFLLENBQUMsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLENBQUQsQ0FBTCxHQUFzQixNQUE5QztRQUNULE1BQUEsR0FBUyxLQUFLLENBQUMsT0FBTixDQUFjLE1BQWQsRUFBc0IsTUFBdEI7ZUFFVCxFQUFFLENBQUMsSUFBSCxDQUFRLElBQVIsRUFBYyxNQUFkLEVBQXNCLENBQUEsU0FBQSxLQUFBO21CQUFBLFNBQUMsR0FBRDtnQkFDbEIsSUFBcUUsV0FBckU7QUFBQSwyQkFBTyxNQUFBLENBQU8sdUJBQUEsR0FBd0IsSUFBeEIsR0FBNkIsTUFBN0IsR0FBbUMsTUFBbkMsR0FBMEMsSUFBMUMsR0FBOEMsR0FBckQsRUFBUDs7dUJBQ0EsTUFBTSxDQUFDLElBQVAsQ0FBWSxPQUFBLEdBQVEsU0FBUixHQUFrQixnQ0FBbEIsR0FBa0QsTUFBOUQsRUFBd0UsU0FBQyxHQUFEO0FBQ3BFLHdCQUFBO29CQUFBLElBQTBFLFdBQTFFO0FBQUEsK0JBQU8sTUFBQSxDQUFPLDBCQUFBLEdBQTJCLE1BQTNCLEdBQWtDLE1BQWxDLEdBQXdDLE1BQXhDLEdBQStDLElBQS9DLEdBQW1ELEdBQTFELEVBQVA7O29CQUNBLFdBQUEsR0FBYyxTQUFBOytCQUFHLEtBQUMsQ0FBQSxTQUFELENBQVcsR0FBWCxFQUFnQixNQUFoQjtvQkFBSDsyQkFDZCxVQUFBLENBQVcsV0FBWCxFQUF3QixHQUF4QjtnQkFIb0UsQ0FBeEU7WUFGa0I7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXRCO0lBUFE7O3NCQWNaLFlBQUEsR0FBYyxTQUFDLEdBQUQ7QUFFVixZQUFBO1FBQUEsSUFBQSxHQUFTLEdBQUcsQ0FBQztRQUNiLElBQUEsR0FBUyxJQUFJLENBQUM7UUFDZCxNQUFBLEdBQVMsS0FBSyxDQUFDLElBQU4sQ0FBVyxFQUFFLENBQUMsTUFBSCxDQUFBLENBQVgsRUFBd0IsS0FBQSxHQUFLLENBQUMsS0FBSyxDQUFDLFFBQU4sQ0FBZSxJQUFmLENBQUQsQ0FBTCxHQUEwQixNQUFsRDtlQUVULE1BQU0sQ0FBQyxJQUFQLENBQVksZ0NBQUEsR0FBaUMsSUFBakMsR0FBc0MsYUFBdEMsR0FBbUQsTUFBbkQsR0FBMEQsSUFBdEUsRUFBMkUsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQyxHQUFEO2dCQUN2RSxJQUF1RCxXQUF2RDtBQUFBLDJCQUFPLE1BQUEsQ0FBTyxzQkFBQSxHQUF1QixJQUF2QixHQUE0QixJQUE1QixHQUFnQyxHQUF2QyxFQUFQOzt1QkFDQSxLQUFDLENBQUEsU0FBRCxDQUFXLEdBQVgsRUFBZ0IsTUFBaEI7WUFGdUU7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTNFO0lBTlU7O3NCQVVkLFNBQUEsR0FBVyxTQUFDLEdBQUQsRUFBTSxJQUFOO0FBRVAsWUFBQTtRQUFBLElBQVUsQ0FBSSxHQUFHLENBQUMsUUFBSixDQUFBLENBQWQ7QUFBQSxtQkFBQTs7UUFFQSxHQUFBLEdBQU0sSUFBQyxDQUFBLFdBQUQsOENBQWEsR0FBRyxDQUFFLGVBQWxCO1FBQ04sSUFBQyxDQUFBLGdCQUFELENBQWtCLEdBQUcsQ0FBQyxLQUF0QjtRQUNBLEdBQUEsR0FBTSxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLHVCQUFQO1lBQWdDLEtBQUEsRUFDdkMsSUFBQSxDQUFLLEtBQUwsRUFBWTtnQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGNBQVA7Z0JBQXVCLEdBQUEsRUFBSyxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsQ0FBNUI7YUFBWixDQURPO1NBQUw7ZUFFTixHQUFHLENBQUMsS0FBSyxDQUFDLFdBQVYsQ0FBc0IsR0FBdEI7SUFSTzs7Ozs7O0FBVWYsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxueyBwb3N0LCBwcmVmcywgZWxlbSwgY2xhbXAsIHNldFN0eWxlLCBjaGlsZHAsIHNsYXNoLCBmcywgb3MsIGtwb3MsIGtsb2csIGtlcnJvciwgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Db2x1bW4gPSByZXF1aXJlICcuL2NvbHVtbidcbmZsZXggICA9IHJlcXVpcmUgJy4vZmxleC9mbGV4J1xuXG5jbGFzcyBCcm93c2VyXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAdmlldykgLT5cbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW5zID0gW11cbiAgICAgICAgXG4gICAgICAgIHNldFN0eWxlICcuYnJvd3NlclJvdyAuZXh0JyAnZGlzcGxheScgcHJlZnMuZ2V0KCdicm93c2Vy4pa4aGlkZUV4dGVuc2lvbnMnKSBhbmQgJ25vbmUnIG9yICdpbml0aWFsJ1xuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgaW5pdENvbHVtbnM6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgQGNvbHM/IGFuZCBAY29scy5wYXJlbnROb2RlID09IEB2aWV3XG4gICAgICAgIFxuICAgICAgICBAdmlldy5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBcbiAgICAgICAgaWYgQGNvbHM/XG4gICAgICAgICAgICBAdmlldy5hcHBlbmRDaGlsZCBAY29sc1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgQGNvbHMgPSBlbGVtIGNsYXNzOidicm93c2VyJyBpZDonY29sdW1ucydcbiAgICAgICAgQHZpZXcuYXBwZW5kQ2hpbGQgQGNvbHNcbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW5zID0gW11cblxuICAgICAgICBAZmxleCA9IG5ldyBmbGV4IFxuICAgICAgICAgICAgdmlldzogICAgICAgQGNvbHNcbiAgICAgICAgICAgIG9uUGFuZVNpemU6IEB1cGRhdGVDb2x1bW5TY3JvbGxzXG4gICAgICAgIFxuICAgIGNvbHVtbkF0UG9zOiAocG9zKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGNvbHVtbiBpbiBAY29sdW1uc1xuICAgICAgICAgICAgaWYgZWxlbS5jb250YWluc1BvcyBjb2x1bW4uZGl2LCBwb3NcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sdW1uXG4gICAgICAgIG51bGxcbiAgICAgICAgXG4gICAgY29sdW1uQXRYOiAoeCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGNwb3MgPSBrcG9zIGNvbHVtbi5kaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgY29sdW1uLmRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcbiAgICAgICAgICAgIGtsb2cgeCwgY3Bvc1xuICAgICAgICAgICAgcG9zID0ga3BvcyB4LCBjcG9zLnlcbiAgICAgICAgICAgIGlmIGVsZW0uY29udGFpbnNQb3MgY29sdW1uLmRpdiwgcG9zXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbHVtblxuICAgICAgICBudWxsXG4gICAgICAgIFxuICAgIHJvd0F0UG9zOiAocG9zKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgY29sdW1uID0gQGNvbHVtbkF0UG9zIHBvc1xuICAgICAgICAgICAgcmV0dXJuIGNvbHVtbi5yb3dBdFBvcyBwb3NcbiAgICAgICAgbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBuYXZpZ2F0ZTogKGtleSkgLT5cbiAgXG4gICAgICAgIEBzZWxlY3QuY2xlYXIoKVxuICAgICAgICBcbiAgICAgICAgaWYga2V5ID09ICd1cCdcbiAgICAgICAgICAgIGlmIEBhY3RpdmVDb2x1bW5JbmRleCgpID4gMFxuICAgICAgICAgICAgICAgIGlmIGNvbCA9IEBhY3RpdmVDb2x1bW4oKVxuICAgICAgICAgICAgICAgICAgICBpZiByb3cgPSBjb2wuYWN0aXZlUm93KClcbiAgICAgICAgICAgICAgICAgICAgICAgIEBsb2FkSXRlbSBAZmlsZUl0ZW0gcm93Lml0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAbG9hZEl0ZW0gQGZpbGVJdGVtIGNvbC5wYXRoKClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAbG9hZEl0ZW0gQGZpbGVJdGVtIHNsYXNoLmRpciBAY29sdW1uc1swXS5wYXRoKClcbiAgICAgICAgZWxzZSAgICAgICAgXG4gICAgICAgICAgICBpbmRleCA9IEBmb2N1c0NvbHVtbigpPy5pbmRleCA/IDBcbiAgICAgICAgICAgIGluZGV4ICs9IHN3aXRjaCBrZXlcbiAgICAgICAgICAgICAgICB3aGVuICdsZWZ0Jyd1cCcgdGhlbiAtMVxuICAgICAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyAgICB0aGVuICsxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaW5kZXggPSBjbGFtcCAwLCBAbnVtQ29scygpLTEsIGluZGV4XG4gICAgICAgICAgICBpZiBAY29sdW1uc1tpbmRleF0ubnVtUm93cygpXG4gICAgICAgICAgICAgICAgQGNvbHVtbnNbaW5kZXhdLmZvY3VzKCkuYWN0aXZlUm93KCkuYWN0aXZhdGUoKVxuICAgICAgICAgICAgXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBmb2N1czogKG9wdCkgPT4gXG4gICAgICAgIEBsYXN0RGlyQ29sdW1uKCk/LmZvY3VzIG9wdFxuICAgICAgICBAXG4gICAgXG4gICAgZm9jdXNDb2x1bW46IC0+IFxuICAgICAgICBmb3IgYyBpbiBAY29sdW1uc1xuICAgICAgICAgICAgcmV0dXJuIGMgaWYgYy5oYXNGb2N1cygpXG4gICAgICBcbiAgICAjIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAgIDAwMCAgICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgZW1wdHlDb2x1bW46IChjb2xJbmRleCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGNvbEluZGV4P1xuICAgICAgICAgICAgZm9yIGMgaW4gW2NvbEluZGV4Li4uQG51bUNvbHMoKV1cbiAgICAgICAgICAgICAgICBAY2xlYXJDb2x1bW4gY1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBmb3IgY29sIGluIEBjb2x1bW5zXG4gICAgICAgICAgICByZXR1cm4gY29sIGlmIGNvbC5pc0VtcHR5KClcbiAgICAgICAgICAgIFxuICAgICAgICBAYWRkQ29sdW1uKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAgIFxuICAgIFxuICAgIGFjdGl2ZUNvbHVtbjogLT4gQGNvbHVtbiBAYWN0aXZlQ29sdW1uSW5kZXgoKVxuICAgIGFjdGl2ZUNvbHVtbkluZGV4OiAtPiBcbiAgICAgICAgXG4gICAgICAgIGZvciBjb2wgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbC5oYXNGb2N1cygpIHRoZW4gcmV0dXJuIGNvbC5pbmRleFxuICAgICAgICAwXG4gICAgICAgICAgICAgICAgXG4gICAgbGFzdFVzZWRDb2x1bW46IC0+XG4gICAgICAgIFxuICAgICAgICB1c2VkID0gbnVsbFxuICAgICAgICBmb3IgY29sIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBub3QgY29sLmlzRW1wdHkoKVxuICAgICAgICAgICAgICAgIHVzZWQgPSBjb2wgXG4gICAgICAgICAgICBlbHNlIGJyZWFrXG4gICAgICAgIHVzZWRcblxuICAgIGhhc0VtcHR5Q29sdW1uczogLT4gQGNvbHVtbnNbLTFdLmlzRW1wdHkoKVxuXG4gICAgaGVpZ2h0OiAtPiBAZmxleD8uaGVpZ2h0KClcbiAgICBudW1Db2xzOiAtPiBAY29sdW1ucy5sZW5ndGggXG4gICAgY29sdW1uOiAoaSkgLT4gQGNvbHVtbnNbaV0gaWYgMCA8PSBpIDwgQG51bUNvbHMoKVxuICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAgICAgICBcbiAgICBhZGRDb2x1bW46IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBmbGV4XG5cbiAgICAgICAgY29sID0gbmV3IENvbHVtbiBAXG4gICAgICAgIEBjb2x1bW5zLnB1c2ggY29sXG4gICAgICAgIEBmbGV4LmFkZFBhbmUgZGl2OmNvbC5kaXYsIHNpemU6NTBcbiAgICAgICAgY29sXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgIFxuICAgIFxuICAgIGNsZWFyQ29sdW1uOiAoaW5kZXgpIC0+IGlmIGluZGV4IDwgQGNvbHVtbnMubGVuZ3RoIHRoZW4gQGNvbHVtbnNbaW5kZXhdLmNsZWFyKClcbiAgICBcbiAgICBzaGlmdENvbHVtbjogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY29sdW1ucy5sZW5ndGhcbiAgICAgICAgQGNsZWFyQ29sdW1uIDBcbiAgICAgICAgQGZsZXguc2hpZnRQYW5lKClcbiAgICAgICAgQGNvbHVtbnMuc2hpZnQoKVxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5AY29sdW1ucy5sZW5ndGhdXG4gICAgICAgICAgICBAY29sdW1uc1tpXS5zZXRJbmRleCBpXG4gICAgXG4gICAgcG9wQ29sdW1uOiAob3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuICAgICAgICBAY2xlYXJDb2x1bW4gQGNvbHVtbnMubGVuZ3RoLTFcbiAgICAgICAgQGZsZXgucG9wUGFuZSBvcHRcbiAgICAgICAgQGNvbHVtbnMucG9wKClcbiAgICAgICAgXG4gICAgcG9wRW1wdHlDb2x1bW5zOiAob3B0KSAtPiBcbiAgICAgICAgXG4gICAgICAgIGtsb2cgJ3BvcEVtcHR5Q29sdW1ucycgb3B0LCBAbGFzdERpckNvbHVtbigpPy5pbmRleFxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBAbGFzdERpckNvbHVtbigpPy5pbmRleCA/IDAsIHBvcDp0cnVlXG4gICAgICAgICMgQHBvcENvbHVtbihvcHQpIHdoaWxlIEBoYXNFbXB0eUNvbHVtbnMoKVxuICAgICAgICBcbiAgICBzaGlmdENvbHVtbnNUbzogKGNvbCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjbG9zZVZpZXdlcigpXG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLmNvbF1cbiAgICAgICAgICAgIEBzaGlmdENvbHVtbigpXG4gICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgY2xlYXI6IC0+IEBjbGVhckNvbHVtbnNGcm9tIDAsIHBvcDp0cnVlIFxuICAgIFxuICAgIGNsZWFyQ29sdW1uc0Zyb206IChjPTAsIG9wdD1wb3A6ZmFsc2UpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2xlYXJDb2x1bW5zRnJvbSAje2N9P1wiIGlmIG5vdCBjPyBvciBjIDwgMFxuICAgICAgICBcbiAgICAgICAgbnVtID0gQG51bUNvbHMoKVxuICAgICAgICBpZiBvcHQucG9wXG4gICAgICAgICAgICBpZiBvcHQuY2xlYXI/XG4gICAgICAgICAgICAgICAgd2hpbGUgYyA8PSBvcHQuY2xlYXJcbiAgICAgICAgICAgICAgICAgICAgQGNsZWFyQ29sdW1uIGNcbiAgICAgICAgICAgICAgICAgICAgYysrXG4gICAgICAgICAgICB3aGlsZSBjIDwgbnVtXG4gICAgICAgICAgICAgICAgQHBvcENvbHVtbigpXG4gICAgICAgICAgICAgICAgYysrXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdoaWxlIGMgPCBudW1cbiAgICAgICAgICAgICAgICBAY2xlYXJDb2x1bW4gY1xuICAgICAgICAgICAgICAgIGMrK1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGlzTWVzc3k6IC0+IG5vdCBAZmxleC5yZWxheGVkIG9yIEBoYXNFbXB0eUNvbHVtbnMoKVxuICAgIFxuICAgIGNsZWFuVXA6IC0+IFxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IEBmbGV4P1xuICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IEBpc01lc3N5KClcbiAgICAgICAgQHBvcEVtcHR5Q29sdW1ucygpXG4gICAgICAgIEBmbGV4LnJlbGF4KClcbiAgICAgICAgdHJ1ZVxuXG4gICAgcmVzaXplZDogLT4gXG4gICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgIFxuICAgIHVwZGF0ZUNvbHVtblNjcm9sbHM6ID0+XG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY29sdW1uc1xuICAgICAgICAgICAgYy51cGRhdGVDcnVtYigpXG4gICAgICAgICAgICBjLnNjcm9sbC51cGRhdGUoKVxuXG4gICAgcmVzZXQ6IC0+IGRlbGV0ZSBAY29sczsgQGluaXRDb2x1bW5zKClcbiAgICBzdG9wOiAgLT4gQGNvbHMucmVtb3ZlKCk7IEBjb2xzID0gbnVsbFxuICAgIHN0YXJ0OiAtPiBAaW5pdENvbHVtbnMoKVxuXG4gICAgcmVmcmVzaDogPT4gcmVzZXQoKVxuICAgICAgICBcbiAgICAjIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgY29udmVydFBYTTogKHJvdykgLT5cbiAgICAgICAgXG4gICAgICAgIGl0ZW0gICA9IHJvdy5pdGVtXG4gICAgICAgIGZpbGUgICA9IGl0ZW0uZmlsZVxuICAgICAgICB0bXBQWE0gPSBzbGFzaC5qb2luIG9zLnRtcGRpcigpLCBcImtvLSN7c2xhc2guYmFzZSBmaWxlfS5weG1cIlxuICAgICAgICB0bXBQTkcgPSBzbGFzaC5zd2FwRXh0IHRtcFBYTSwgJy5wbmcnXG5cbiAgICAgICAgZnMuY29weSBmaWxlLCB0bXBQWE0sIChlcnIpID0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29weSBweG0gaW1hZ2UgI3tmaWxlfSB0byAje3RtcFBYTX06ICN7ZXJyfVwiIGlmIGVycj9cbiAgICAgICAgICAgIGNoaWxkcC5leGVjIFwib3BlbiAje19fZGlybmFtZX0vLi4vLi4vYmluL3B4bTJwbmcuYXBwIC0tYXJncyAje3RtcFBYTX1cIiwgKGVycikgPT5cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29udmVydCBweG0gaW1hZ2UgI3t0bXBQWE19IHRvICN7dG1wUE5HfTogI3tlcnJ9XCIgaWYgZXJyP1xuICAgICAgICAgICAgICAgIGxvYWREZWxheWVkID0gPT4gQGxvYWRJbWFnZSByb3csIHRtcFBOR1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQgbG9hZERlbGF5ZWQsIDMwMFxuXG4gICAgY29udmVydEltYWdlOiAocm93KSAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbSAgID0gcm93Lml0ZW1cbiAgICAgICAgZmlsZSAgID0gaXRlbS5maWxlXG4gICAgICAgIHRtcEltZyA9IHNsYXNoLmpvaW4gb3MudG1wZGlyKCksIFwia28tI3tzbGFzaC5iYXNlbmFtZSBmaWxlfS5wbmdcIlxuICAgICAgICBcbiAgICAgICAgY2hpbGRwLmV4ZWMgXCIvdXNyL2Jpbi9zaXBzIC1zIGZvcm1hdCBwbmcgXFxcIiN7ZmlsZX1cXFwiIC0tb3V0IFxcXCIje3RtcEltZ31cXFwiXCIsIChlcnIpID0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29udmVydCBpbWFnZSAje2ZpbGV9OiAje2Vycn1cIiBpZiBlcnI/XG4gICAgICAgICAgICBAbG9hZEltYWdlIHJvdywgdG1wSW1nXG5cbiAgICBsb2FkSW1hZ2U6IChyb3csIGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IHJvdy5pc0FjdGl2ZSgpXG5cbiAgICAgICAgY29sID0gQGVtcHR5Q29sdW1uIG9wdD8uY29sdW1uXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbC5pbmRleFxuICAgICAgICBjbnQgPSBlbGVtIGNsYXNzOiAnYnJvd3NlckltYWdlQ29udGFpbmVyJywgY2hpbGQ6IFxuICAgICAgICAgICAgZWxlbSAnaW1nJywgY2xhc3M6ICdicm93c2VySW1hZ2UnLCBzcmM6IHNsYXNoLmZpbGVVcmwgZmlsZVxuICAgICAgICBjb2wudGFibGUuYXBwZW5kQ2hpbGQgY250XG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBCcm93c2VyXG4iXX0=
//# sourceURL=../coffee/browser.coffee