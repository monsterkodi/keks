// koffee 1.4.0

/*
0000000    00000000    0000000   000   000   0000000  00000000  00000000   
000   000  000   000  000   000  000 0 000  000       000       000   000  
0000000    0000000    000   000  000000000  0000000   0000000   0000000    
000   000  000   000  000   000  000   000       000  000       000   000  
0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var Browser, Column, _, childp, clamp, elem, flex, fs, kerror, klog, os, post, prefs, ref, setStyle, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, prefs = ref.prefs, elem = ref.elem, clamp = ref.clamp, setStyle = ref.setStyle, childp = ref.childp, slash = ref.slash, fs = ref.fs, os = ref.os, klog = ref.klog, kerror = ref.kerror, _ = ref._;

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
        return this.clearColumnsFrom(col, {
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

})();

module.exports = Browser;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsc0dBQUE7SUFBQTs7QUFRQSxNQUFpRixPQUFBLENBQVEsS0FBUixDQUFqRixFQUFFLGVBQUYsRUFBUSxpQkFBUixFQUFlLGVBQWYsRUFBcUIsaUJBQXJCLEVBQTRCLHVCQUE1QixFQUFzQyxtQkFBdEMsRUFBOEMsaUJBQTlDLEVBQXFELFdBQXJELEVBQXlELFdBQXpELEVBQTZELGVBQTdELEVBQW1FLG1CQUFuRSxFQUEyRTs7QUFFM0UsTUFBQSxHQUFTLE9BQUEsQ0FBUSxVQUFSOztBQUNULElBQUEsR0FBUyxPQUFBLENBQVEsYUFBUjs7QUFFSDtJQUVXLGlCQUFDLElBQUQ7UUFBQyxJQUFDLENBQUEsT0FBRDs7OztRQUVWLElBQUMsQ0FBQSxPQUFELEdBQVc7UUFFWCxRQUFBLENBQVMsa0JBQVQsRUFBNEIsU0FBNUIsRUFBc0MsS0FBSyxDQUFDLEdBQU4sQ0FBVSx3QkFBVixDQUFBLElBQXdDLE1BQXhDLElBQWtELFNBQXhGO0lBSlM7O3NCQVliLFdBQUEsR0FBYSxTQUFBO1FBRVQsSUFBVSxtQkFBQSxJQUFXLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBTixLQUFvQixJQUFDLENBQUEsSUFBMUM7QUFBQSxtQkFBQTs7UUFFQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sR0FBa0I7UUFFbEIsSUFBRyxpQkFBSDtZQUNJLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixJQUFDLENBQUEsSUFBbkI7QUFDQSxtQkFGSjs7UUFJQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sU0FBTjtZQUFnQixFQUFBLEVBQUcsU0FBbkI7U0FBTDtRQUNSLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixJQUFDLENBQUEsSUFBbkI7UUFFQSxJQUFDLENBQUEsT0FBRCxHQUFXO2VBRVgsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFJLElBQUosQ0FDSjtZQUFBLElBQUEsRUFBWSxJQUFDLENBQUEsSUFBYjtZQUNBLFVBQUEsRUFBWSxJQUFDLENBQUEsbUJBRGI7U0FESTtJQWZDOztzQkFtQmIsV0FBQSxHQUFhLFNBQUMsR0FBRDtBQUVULFlBQUE7QUFBQTtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksSUFBRyxJQUFJLENBQUMsV0FBTCxDQUFpQixNQUFNLENBQUMsR0FBeEIsRUFBNkIsR0FBN0IsQ0FBSDtBQUNJLHVCQUFPLE9BRFg7O0FBREo7ZUFHQTtJQUxTOztzQkFhYixTQUFBLEdBQVcsU0FBQyxLQUFELEVBQVEsR0FBUjtBQUVQLFlBQUE7UUFBQSxJQUFVLENBQUksSUFBQyxDQUFBLElBQWY7QUFBQSxtQkFBQTs7UUFDQSxHQUFBLEdBQU0sSUFBQyxDQUFBLFdBQUQsZUFBYSxHQUFHLENBQUUsZUFBbEI7UUFDTixJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsR0FBRyxDQUFDLEtBQXRCO1FBQ0EsR0FBRyxDQUFDLFFBQUosQ0FBYSxLQUFiLEVBQW9CLEdBQXBCO1FBRUEsSUFBRyxvQkFBSDs7b0JBQ3lCLENBQUUsUUFBdkIsQ0FBQTthQURKOztRQUdBLElBQUcsZUFBSDtZQUNJLEdBQUcsQ0FBQyxLQUFKLENBQUEsRUFESjs7UUFHQSxJQUFHLEdBQUcsQ0FBQyxLQUFQO1lBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBQTs7O3dCQUM4QixDQUFFLFNBQWhDLENBQUE7O2FBRko7O1FBSUEsSUFBQyxDQUFBLGVBQUQsQ0FBaUI7WUFBQSxLQUFBLEVBQU0sS0FBTjtTQUFqQjtlQUNBO0lBbEJPOztzQkEwQlgsUUFBQSxHQUFVLFNBQUMsR0FBRDtBQUVOLFlBQUE7UUFBQSxJQUFHLEdBQUEsS0FBTyxJQUFWO1lBQ0ksSUFBRyxJQUFDLENBQUEsaUJBQUQsQ0FBQSxDQUFBLEdBQXVCLENBQTFCO2dCQUVJLElBQUcsR0FBQSxHQUFNLElBQUMsQ0FBQSxZQUFELENBQUEsQ0FBVDtvQkFDSSxJQUFHLEdBQUEsR0FBTSxHQUFHLENBQUMsU0FBSixDQUFBLENBQVQ7d0JBQ0ksSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBbkIsQ0FBVixFQURKO3FCQUFBLE1BQUE7d0JBR0ksSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQUcsQ0FBQyxJQUFKLENBQUEsQ0FBVixDQUFWLEVBSEo7cUJBREo7aUJBRko7YUFBQSxNQUFBO2dCQVFJLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxLQUFLLENBQUMsR0FBTixDQUFVLElBQUMsQ0FBQSxPQUFRLENBQUEsQ0FBQSxDQUFFLENBQUMsSUFBWixDQUFBLENBQVYsQ0FBVixDQUFWLEVBUko7YUFESjtTQUFBLE1BQUE7WUFXSSxLQUFBLHVGQUFnQztZQUNoQyxLQUFBO0FBQVMsd0JBQU8sR0FBUDtBQUFBLHlCQUNBLE1BREE7QUFBQSx5QkFDTSxJQUROOytCQUNnQixDQUFDO0FBRGpCLHlCQUVBLE9BRkE7K0JBRWdCLENBQUM7QUFGakI7O1lBSVQsS0FBQSxHQUFRLEtBQUEsQ0FBTSxDQUFOLEVBQVMsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFBLEdBQVcsQ0FBcEIsRUFBdUIsS0FBdkI7WUFDUixJQUFHLElBQUMsQ0FBQSxPQUFRLENBQUEsS0FBQSxDQUFNLENBQUMsT0FBaEIsQ0FBQSxDQUFIO2dCQUNJLElBQUMsQ0FBQSxPQUFRLENBQUEsS0FBQSxDQUFNLENBQUMsS0FBaEIsQ0FBQSxDQUF1QixDQUFDLFNBQXhCLENBQUEsQ0FBbUMsQ0FBQyxRQUFwQyxDQUFBLEVBREo7YUFqQko7O1FBb0JBLElBQUMsQ0FBQSxtQkFBRCxDQUFBO2VBQ0E7SUF2Qk07O3NCQStCVixLQUFBLEdBQU8sU0FBQyxHQUFEO0FBQ0gsWUFBQTs7Z0JBQWlCLENBQUUsS0FBbkIsQ0FBeUIsR0FBekI7O2VBQ0E7SUFGRzs7c0JBSVAsV0FBQSxHQUFhLFNBQUE7QUFDVCxZQUFBO0FBQUE7QUFBQSxhQUFBLHNDQUFBOztZQUNJLElBQVksQ0FBQyxDQUFDLFFBQUYsQ0FBQSxDQUFaO0FBQUEsdUJBQU8sRUFBUDs7QUFESjtJQURTOztzQkFVYixXQUFBLEdBQWEsU0FBQyxRQUFEO0FBRVQsWUFBQTtRQUFBLElBQUcsZ0JBQUg7QUFDSSxpQkFBUyxnSEFBVDtnQkFDSSxJQUFDLENBQUEsV0FBRCxDQUFhLENBQWI7QUFESixhQURKOztBQUlBO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxJQUFjLEdBQUcsQ0FBQyxPQUFKLENBQUEsQ0FBZDtBQUFBLHVCQUFPLElBQVA7O0FBREo7ZUFHQSxJQUFDLENBQUEsU0FBRCxDQUFBO0lBVFM7O3NCQWlCYixZQUFBLEdBQWMsU0FBQTtlQUFHLElBQUMsQ0FBQSxNQUFELENBQVEsSUFBQyxDQUFBLGlCQUFELENBQUEsQ0FBUjtJQUFIOztzQkFDZCxpQkFBQSxHQUFtQixTQUFBO0FBRWYsWUFBQTtBQUFBO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxJQUFHLEdBQUcsQ0FBQyxRQUFKLENBQUEsQ0FBSDtBQUF1Qix1QkFBTyxHQUFHLENBQUMsTUFBbEM7O0FBREo7ZUFFQTtJQUplOztzQkFNbkIsY0FBQSxHQUFnQixTQUFBO0FBRVosWUFBQTtRQUFBLElBQUEsR0FBTztBQUNQO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxJQUFHLENBQUksR0FBRyxDQUFDLE9BQUosQ0FBQSxDQUFQO2dCQUNJLElBQUEsR0FBTyxJQURYO2FBQUEsTUFBQTtBQUVLLHNCQUZMOztBQURKO2VBSUE7SUFQWTs7c0JBU2hCLGVBQUEsR0FBaUIsU0FBQTtlQUFHLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBQyxDQUFBLE9BQVIsQ0FBZ0IsQ0FBQyxPQUFqQixDQUFBO0lBQUg7O3NCQUVqQixNQUFBLEdBQVEsU0FBQTtBQUFHLFlBQUE7Z0RBQUssQ0FBRSxNQUFQLENBQUE7SUFBSDs7c0JBQ1IsT0FBQSxHQUFTLFNBQUE7ZUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDO0lBQVo7O3NCQUNULE1BQUEsR0FBUSxTQUFDLENBQUQ7UUFBTyxJQUFlLENBQUEsQ0FBQSxJQUFLLENBQUwsSUFBSyxDQUFMLEdBQVMsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFULENBQWY7bUJBQUEsSUFBQyxDQUFBLE9BQVEsQ0FBQSxDQUFBLEVBQVQ7O0lBQVA7O3NCQUVSLG1CQUFBLEdBQXFCLFNBQUMsTUFBRDtlQUFZLE1BQU0sQ0FBQyxXQUFQLENBQUEsQ0FBb0IsQ0FBQyxZQUFyQixDQUFBO0lBQVo7O3NCQVFyQixTQUFBLEdBQVcsU0FBQTtBQUVQLFlBQUE7UUFBQSxJQUFVLENBQUksSUFBQyxDQUFBLElBQWY7QUFBQSxtQkFBQTs7UUFFQSxHQUFBLEdBQU0sSUFBSSxNQUFKLENBQVcsSUFBWDtRQUNOLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLEdBQWQ7UUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQU4sQ0FBYztZQUFBLEdBQUEsRUFBSSxHQUFHLENBQUMsR0FBUjtZQUFhLElBQUEsRUFBSyxFQUFsQjtTQUFkO2VBQ0E7SUFQTzs7c0JBZVgsV0FBQSxHQUFhLFNBQUMsS0FBRDtRQUFXLElBQUcsS0FBQSxHQUFRLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBcEI7bUJBQWdDLElBQUMsQ0FBQSxPQUFRLENBQUEsS0FBQSxDQUFNLENBQUMsS0FBaEIsQ0FBQSxFQUFoQzs7SUFBWDs7c0JBRWIsV0FBQSxHQUFhLFNBQUE7QUFFVCxZQUFBO1FBQUEsSUFBVSxDQUFJLElBQUMsQ0FBQSxJQUFmO0FBQUEsbUJBQUE7O1FBQ0EsSUFBVSxDQUFJLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBdkI7QUFBQSxtQkFBQTs7UUFDQSxJQUFDLENBQUEsV0FBRCxDQUFhLENBQWI7UUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sQ0FBQTtRQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBVCxDQUFBO0FBRUE7YUFBUyxpR0FBVDt5QkFDSSxJQUFDLENBQUEsT0FBUSxDQUFBLENBQUEsQ0FBRSxDQUFDLFFBQVosQ0FBcUIsQ0FBckI7QUFESjs7SUFSUzs7c0JBV2IsU0FBQSxHQUFXLFNBQUMsR0FBRDtRQUVQLElBQVUsQ0FBSSxJQUFDLENBQUEsSUFBZjtBQUFBLG1CQUFBOztRQUNBLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULEdBQWdCLENBQTdCO1FBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLENBQWMsR0FBZDtlQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsR0FBVCxDQUFBO0lBTE87O3NCQU9YLGVBQUEsR0FBaUIsU0FBQyxHQUFEO0FBQVMsWUFBQTtBQUFnQjtlQUFNLElBQUMsQ0FBQSxlQUFELENBQUEsQ0FBTjt5QkFBaEIsSUFBQyxDQUFBLFNBQUQsQ0FBVyxHQUFYO1FBQWdCLENBQUE7O0lBQXpCOztzQkFFakIsY0FBQSxHQUFnQixTQUFDLEdBQUQ7ZUFBUyxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsR0FBbEIsRUFBdUI7WUFBQSxHQUFBLEVBQUksSUFBSjtTQUF2QjtJQUFUOztzQkFLaEIsY0FBQSxHQUFnQixTQUFDLEdBQUQ7QUFFWixZQUFBO0FBQUEsYUFBUyxpRkFBVDtZQUNJLElBQUMsQ0FBQSxXQUFELENBQUE7QUFESjtlQUdBLElBQUMsQ0FBQSxtQkFBRCxDQUFBO0lBTFk7O3NCQWFoQixLQUFBLEdBQU8sU0FBQTtlQUFHLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixDQUFsQixFQUFxQjtZQUFBLEdBQUEsRUFBSSxJQUFKO1NBQXJCO0lBQUg7O3NCQUVQLGdCQUFBLEdBQWtCLFNBQUMsQ0FBRCxFQUFNLEdBQU47QUFFZCxZQUFBOztZQUZlLElBQUU7OztZQUFHLE1BQUk7Z0JBQUEsR0FBQSxFQUFJLEtBQUo7OztRQUV4QixJQUE4QyxXQUFKLElBQVUsQ0FBQSxHQUFJLENBQXhEO0FBQUEsbUJBQU8sTUFBQSxDQUFPLG1CQUFBLEdBQW9CLENBQXBCLEdBQXNCLEdBQTdCLEVBQVA7O1FBRUEsR0FBQSxHQUFNLElBQUMsQ0FBQSxPQUFELENBQUE7UUFDTixJQUFHLEdBQUcsQ0FBQyxHQUFQO1lBQ0ksSUFBRyxpQkFBSDtBQUNJLHVCQUFNLENBQUEsSUFBSyxHQUFHLENBQUMsS0FBZjtvQkFDSSxJQUFDLENBQUEsV0FBRCxDQUFhLENBQWI7b0JBQ0EsQ0FBQTtnQkFGSixDQURKOztBQUlBO21CQUFNLENBQUEsR0FBSSxHQUFWO2dCQUNJLElBQUMsQ0FBQSxTQUFELENBQUE7NkJBQ0EsQ0FBQTtZQUZKLENBQUE7MkJBTEo7U0FBQSxNQUFBO0FBU0k7bUJBQU0sQ0FBQSxHQUFJLEdBQVY7Z0JBQ0ksSUFBQyxDQUFBLFdBQUQsQ0FBYSxDQUFiOzhCQUNBLENBQUE7WUFGSixDQUFBOzRCQVRKOztJQUxjOztzQkF3QmxCLE9BQUEsR0FBUyxTQUFBO2VBQUcsQ0FBSSxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQVYsSUFBcUIsSUFBQyxDQUFBLGVBQUQsQ0FBQTtJQUF4Qjs7c0JBRVQsT0FBQSxHQUFTLFNBQUE7UUFDTCxJQUFvQixpQkFBcEI7QUFBQSxtQkFBTyxNQUFQOztRQUNBLElBQWdCLENBQUksSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFwQjtBQUFBLG1CQUFPLE1BQVA7O1FBQ0EsSUFBQyxDQUFBLGVBQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBTixDQUFBO2VBQ0E7SUFMSzs7c0JBT1QsT0FBQSxHQUFTLFNBQUE7ZUFBRyxJQUFDLENBQUEsbUJBQUQsQ0FBQTtJQUFIOztzQkFFVCxtQkFBQSxHQUFxQixTQUFBO0FBRWpCLFlBQUE7QUFBQTtBQUFBO2FBQUEsc0NBQUE7O1lBQ0ksQ0FBQyxDQUFDLFdBQUYsQ0FBQTt5QkFDQSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQVQsQ0FBQTtBQUZKOztJQUZpQjs7c0JBTXJCLEtBQUEsR0FBTyxTQUFBO1FBQUcsT0FBTyxJQUFDLENBQUE7ZUFBTSxJQUFDLENBQUEsV0FBRCxDQUFBO0lBQWpCOztzQkFDUCxJQUFBLEdBQU8sU0FBQTtRQUFHLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixDQUFBO2VBQWdCLElBQUMsQ0FBQSxJQUFELEdBQVE7SUFBM0I7O3NCQUNQLEtBQUEsR0FBTyxTQUFBO2VBQUcsSUFBQyxDQUFBLFdBQUQsQ0FBQTtJQUFIOztzQkFFUCxPQUFBLEdBQVMsU0FBQTtlQUFHLEtBQUEsQ0FBQTtJQUFIOztzQkFRVCxVQUFBLEdBQVksU0FBQyxHQUFEO0FBRVIsWUFBQTtRQUFBLElBQUEsR0FBTyxHQUFHLENBQUM7UUFDWCxJQUFBLEdBQU8sSUFBSSxDQUFDO1FBQ1osTUFBQSxHQUFTLEtBQUssQ0FBQyxJQUFOLENBQVcsRUFBRSxDQUFDLE1BQUgsQ0FBQSxDQUFYLEVBQXdCLEtBQUEsR0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFELENBQUwsR0FBc0IsTUFBOUM7UUFDVCxNQUFBLEdBQVMsS0FBSyxDQUFDLE9BQU4sQ0FBYyxNQUFkLEVBQXNCLE1BQXRCO2VBRVQsRUFBRSxDQUFDLElBQUgsQ0FBUSxJQUFSLEVBQWMsTUFBZCxFQUFzQixDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFDLEdBQUQ7Z0JBQ2xCLElBQXFFLFdBQXJFO0FBQUEsMkJBQU8sTUFBQSxDQUFPLHVCQUFBLEdBQXdCLElBQXhCLEdBQTZCLE1BQTdCLEdBQW1DLE1BQW5DLEdBQTBDLElBQTFDLEdBQThDLEdBQXJELEVBQVA7O3VCQUNBLE1BQU0sQ0FBQyxJQUFQLENBQVksT0FBQSxHQUFRLFNBQVIsR0FBa0IsZ0NBQWxCLEdBQWtELE1BQTlELEVBQXdFLFNBQUMsR0FBRDtBQUNwRSx3QkFBQTtvQkFBQSxJQUEwRSxXQUExRTtBQUFBLCtCQUFPLE1BQUEsQ0FBTywwQkFBQSxHQUEyQixNQUEzQixHQUFrQyxNQUFsQyxHQUF3QyxNQUF4QyxHQUErQyxJQUEvQyxHQUFtRCxHQUExRCxFQUFQOztvQkFDQSxXQUFBLEdBQWMsU0FBQTsrQkFBRyxLQUFDLENBQUEsU0FBRCxDQUFXLEdBQVgsRUFBZ0IsTUFBaEI7b0JBQUg7MkJBQ2QsVUFBQSxDQUFXLFdBQVgsRUFBd0IsR0FBeEI7Z0JBSG9FLENBQXhFO1lBRmtCO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF0QjtJQVBROztzQkFjWixZQUFBLEdBQWMsU0FBQyxHQUFEO0FBRVYsWUFBQTtRQUFBLElBQUEsR0FBTyxHQUFHLENBQUM7UUFDWCxJQUFBLEdBQU8sSUFBSSxDQUFDO1FBQ1osUUFBQSxHQUFXLEtBQUssQ0FBQyxJQUFOLENBQVcsRUFBRSxDQUFDLE1BQUgsQ0FBQSxDQUFYLEVBQXdCLEtBQUEsR0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFOLENBQWUsSUFBZixDQUFELENBQUwsR0FBMEIsTUFBbEQ7ZUFFWCxNQUFNLENBQUMsSUFBUCxDQUFZLGdDQUFBLEdBQWlDLElBQWpDLEdBQXNDLGFBQXRDLEdBQW1ELFFBQW5ELEdBQTRELElBQXhFLEVBQTZFLENBQUEsU0FBQSxLQUFBO21CQUFBLFNBQUMsR0FBRDtnQkFDekUsSUFBdUQsV0FBdkQ7QUFBQSwyQkFBTyxNQUFBLENBQU8sc0JBQUEsR0FBdUIsSUFBdkIsR0FBNEIsSUFBNUIsR0FBZ0MsR0FBdkMsRUFBUDs7dUJBQ0EsS0FBQyxDQUFBLFNBQUQsQ0FBVyxHQUFYLEVBQWdCLFFBQWhCO1lBRnlFO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE3RTtJQU5VOztzQkFVZCxTQUFBLEdBQVcsU0FBQyxHQUFELEVBQU0sSUFBTjtBQUVQLFlBQUE7UUFBQSxJQUFVLENBQUksR0FBRyxDQUFDLFFBQUosQ0FBQSxDQUFkO0FBQUEsbUJBQUE7O1FBRUEsR0FBQSxHQUFNLElBQUMsQ0FBQSxXQUFELDhDQUFhLEdBQUcsQ0FBRSxlQUFsQjtRQUNOLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixHQUFHLENBQUMsS0FBdEI7UUFDQSxHQUFBLEdBQU0sSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyx1QkFBUDtZQUFnQyxLQUFBLEVBQ3ZDLElBQUEsQ0FBSyxLQUFMLEVBQVk7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO2dCQUF1QixHQUFBLEVBQUssS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFkLENBQTVCO2FBQVosQ0FETztTQUFMO2VBRU4sR0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFWLENBQXNCLEdBQXRCO0lBUk87Ozs7OztBQVVmLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbnsgcG9zdCwgcHJlZnMsIGVsZW0sIGNsYW1wLCBzZXRTdHlsZSwgY2hpbGRwLCBzbGFzaCwgZnMsIG9zLCBrbG9nLCBrZXJyb3IsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuQ29sdW1uID0gcmVxdWlyZSAnLi9jb2x1bW4nXG5mbGV4ICAgPSByZXF1aXJlICcuL2ZsZXgvZmxleCdcblxuY2xhc3MgQnJvd3NlclxuICAgIFxuICAgIGNvbnN0cnVjdG9yOiAoQHZpZXcpIC0+XG4gICAgICAgIFxuICAgICAgICBAY29sdW1ucyA9IFtdXG4gICAgICAgIFxuICAgICAgICBzZXRTdHlsZSAnLmJyb3dzZXJSb3cgLmV4dCcgJ2Rpc3BsYXknIHByZWZzLmdldCgnYnJvd3NlcuKWuGhpZGVFeHRlbnNpb25zJykgYW5kICdub25lJyBvciAnaW5pdGlhbCdcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGluaXRDb2x1bW5zOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIEBjb2xzPyBhbmQgQGNvbHMucGFyZW50Tm9kZSA9PSBAdmlld1xuICAgICAgICBcbiAgICAgICAgQHZpZXcuaW5uZXJIVE1MID0gJydcbiAgICAgICAgXG4gICAgICAgIGlmIEBjb2xzP1xuICAgICAgICAgICAgQHZpZXcuYXBwZW5kQ2hpbGQgQGNvbHNcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIEBjb2xzID0gZWxlbSBjbGFzczonYnJvd3NlcicgaWQ6J2NvbHVtbnMnXG4gICAgICAgIEB2aWV3LmFwcGVuZENoaWxkIEBjb2xzXG4gICAgICAgIFxuICAgICAgICBAY29sdW1ucyA9IFtdXG5cbiAgICAgICAgQGZsZXggPSBuZXcgZmxleCBcbiAgICAgICAgICAgIHZpZXc6ICAgICAgIEBjb2xzXG4gICAgICAgICAgICBvblBhbmVTaXplOiBAdXBkYXRlQ29sdW1uU2Nyb2xsc1xuICAgICAgICBcbiAgICBjb2x1bW5BdFBvczogKHBvcykgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGVsZW0uY29udGFpbnNQb3MgY29sdW1uLmRpdiwgcG9zXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbHVtblxuICAgICAgICBudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgbG9hZEl0ZW1zOiAoaXRlbXMsIG9wdCkgLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBmbGV4XG4gICAgICAgIGNvbCA9IEBlbXB0eUNvbHVtbiBvcHQ/LmNvbHVtblxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wuaW5kZXhcbiAgICAgICAgY29sLnNldEl0ZW1zIGl0ZW1zLCBvcHRcblxuICAgICAgICBpZiBvcHQuYWN0aXZhdGU/XG4gICAgICAgICAgICBjb2wucm93KG9wdC5hY3RpdmF0ZSk/LmFjdGl2YXRlKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0LnJvdz9cbiAgICAgICAgICAgIGNvbC5mb2N1cygpXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0LmZvY3VzXG4gICAgICAgICAgICBAZm9jdXMoKVxuICAgICAgICAgICAgQGxhc3RVc2VkQ29sdW1uKCk/LmFjdGl2ZVJvdygpPy5zZXRBY3RpdmUoKSAgICAgICAgICAgIFxuICAgICAgICAgICAgXG4gICAgICAgIEBwb3BFbXB0eUNvbHVtbnMgcmVsYXg6ZmFsc2VcbiAgICAgICAgQFxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG5hdmlnYXRlOiAoa2V5KSAtPlxuICBcbiAgICAgICAgaWYga2V5ID09ICd1cCdcbiAgICAgICAgICAgIGlmIEBhY3RpdmVDb2x1bW5JbmRleCgpID4gMFxuICAgICAgICAgICAgICAgICMga2xvZyAnYWN0aXZlQ29sdW1uSW5kZXgnIEBhY3RpdmVDb2x1bW5JbmRleCgpXG4gICAgICAgICAgICAgICAgaWYgY29sID0gQGFjdGl2ZUNvbHVtbigpXG4gICAgICAgICAgICAgICAgICAgIGlmIHJvdyA9IGNvbC5hY3RpdmVSb3coKVxuICAgICAgICAgICAgICAgICAgICAgICAgQGxvYWRJdGVtIEBmaWxlSXRlbSByb3cuaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBsb2FkSXRlbSBAZmlsZUl0ZW0gY29sLnBhdGgoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBsb2FkSXRlbSBAZmlsZUl0ZW0gc2xhc2guZGlyIEBjb2x1bW5zWzBdLnBhdGgoKVxuICAgICAgICBlbHNlICAgICAgICBcbiAgICAgICAgICAgIGluZGV4ID0gQGZvY3VzQ29sdW1uKCk/LmluZGV4ID8gMFxuICAgICAgICAgICAgaW5kZXggKz0gc3dpdGNoIGtleVxuICAgICAgICAgICAgICAgIHdoZW4gJ2xlZnQnJ3VwJyB0aGVuIC0xXG4gICAgICAgICAgICAgICAgd2hlbiAncmlnaHQnICAgIHRoZW4gKzFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpbmRleCA9IGNsYW1wIDAsIEBudW1Db2xzKCktMSwgaW5kZXhcbiAgICAgICAgICAgIGlmIEBjb2x1bW5zW2luZGV4XS5udW1Sb3dzKClcbiAgICAgICAgICAgICAgICBAY29sdW1uc1tpbmRleF0uZm9jdXMoKS5hY3RpdmVSb3coKS5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGZvY3VzOiAob3B0KSA9PiBcbiAgICAgICAgQGxhc3RVc2VkQ29sdW1uKCk/LmZvY3VzIG9wdFxuICAgICAgICBAXG4gICAgXG4gICAgZm9jdXNDb2x1bW46IC0+IFxuICAgICAgICBmb3IgYyBpbiBAY29sdW1uc1xuICAgICAgICAgICAgcmV0dXJuIGMgaWYgYy5oYXNGb2N1cygpXG4gICAgICBcbiAgICAjIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAgIDAwMCAgICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgZW1wdHlDb2x1bW46IChjb2xJbmRleCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGNvbEluZGV4P1xuICAgICAgICAgICAgZm9yIGMgaW4gW2NvbEluZGV4Li4uQG51bUNvbHMoKV1cbiAgICAgICAgICAgICAgICBAY2xlYXJDb2x1bW4gY1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBmb3IgY29sIGluIEBjb2x1bW5zXG4gICAgICAgICAgICByZXR1cm4gY29sIGlmIGNvbC5pc0VtcHR5KClcbiAgICAgICAgICAgIFxuICAgICAgICBAYWRkQ29sdW1uKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAgIFxuICAgIFxuICAgIGFjdGl2ZUNvbHVtbjogLT4gQGNvbHVtbiBAYWN0aXZlQ29sdW1uSW5kZXgoKVxuICAgIGFjdGl2ZUNvbHVtbkluZGV4OiAtPiBcbiAgICAgICAgXG4gICAgICAgIGZvciBjb2wgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbC5oYXNGb2N1cygpIHRoZW4gcmV0dXJuIGNvbC5pbmRleFxuICAgICAgICAwXG4gICAgICAgICAgICAgICAgXG4gICAgbGFzdFVzZWRDb2x1bW46IC0+XG4gICAgICAgIFxuICAgICAgICB1c2VkID0gbnVsbFxuICAgICAgICBmb3IgY29sIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBub3QgY29sLmlzRW1wdHkoKVxuICAgICAgICAgICAgICAgIHVzZWQgPSBjb2wgXG4gICAgICAgICAgICBlbHNlIGJyZWFrXG4gICAgICAgIHVzZWRcblxuICAgIGhhc0VtcHR5Q29sdW1uczogLT4gXy5sYXN0KEBjb2x1bW5zKS5pc0VtcHR5KClcblxuICAgIGhlaWdodDogLT4gQGZsZXg/LmhlaWdodCgpXG4gICAgbnVtQ29sczogLT4gQGNvbHVtbnMubGVuZ3RoIFxuICAgIGNvbHVtbjogKGkpIC0+IEBjb2x1bW5zW2ldIGlmIDAgPD0gaSA8IEBudW1Db2xzKClcblxuICAgIG9uQmFja3NwYWNlSW5Db2x1bW46IChjb2x1bW4pIC0+IGNvbHVtbi5jbGVhclNlYXJjaCgpLnJlbW92ZU9iamVjdCgpICAgIFxuICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAgICAgICBcbiAgICBhZGRDb2x1bW46IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBmbGV4XG5cbiAgICAgICAgY29sID0gbmV3IENvbHVtbiBAXG4gICAgICAgIEBjb2x1bW5zLnB1c2ggY29sXG4gICAgICAgIEBmbGV4LmFkZFBhbmUgZGl2OmNvbC5kaXYsIHNpemU6NTBcbiAgICAgICAgY29sXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgIFxuICAgIFxuICAgIGNsZWFyQ29sdW1uOiAoaW5kZXgpIC0+IGlmIGluZGV4IDwgQGNvbHVtbnMubGVuZ3RoIHRoZW4gQGNvbHVtbnNbaW5kZXhdLmNsZWFyKClcbiAgICBcbiAgICBzaGlmdENvbHVtbjogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY29sdW1ucy5sZW5ndGhcbiAgICAgICAgQGNsZWFyQ29sdW1uIDBcbiAgICAgICAgQGZsZXguc2hpZnRQYW5lKClcbiAgICAgICAgQGNvbHVtbnMuc2hpZnQoKVxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5AY29sdW1ucy5sZW5ndGhdXG4gICAgICAgICAgICBAY29sdW1uc1tpXS5zZXRJbmRleCBpXG4gICAgXG4gICAgcG9wQ29sdW1uOiAob3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuICAgICAgICBAY2xlYXJDb2x1bW4gQGNvbHVtbnMubGVuZ3RoLTFcbiAgICAgICAgQGZsZXgucG9wUGFuZSBvcHRcbiAgICAgICAgQGNvbHVtbnMucG9wKClcbiAgICAgICAgXG4gICAgcG9wRW1wdHlDb2x1bW5zOiAob3B0KSAtPiBAcG9wQ29sdW1uKG9wdCkgd2hpbGUgQGhhc0VtcHR5Q29sdW1ucygpXG4gICAgICAgIFxuICAgIHBvcENvbHVtbnNGcm9tOiAoY29sKSAtPiBAY2xlYXJDb2x1bW5zRnJvbSBjb2wsIHBvcDp0cnVlXG4gICAgICAgIFxuICAgICAgICAjIHdoaWxlIEBudW1Db2xzKCkgPiBjb2wgXG4gICAgICAgICAgICAjIEBwb3BDb2x1bW4oKVxuICAgICAgICAgICAgXG4gICAgc2hpZnRDb2x1bW5zVG86IChjb2wpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLmNvbF1cbiAgICAgICAgICAgIEBzaGlmdENvbHVtbigpXG4gICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgY2xlYXI6IC0+IEBjbGVhckNvbHVtbnNGcm9tIDAsIHBvcDp0cnVlIFxuICAgIFxuICAgIGNsZWFyQ29sdW1uc0Zyb206IChjPTAsIG9wdD1wb3A6ZmFsc2UpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2xlYXJDb2x1bW5zRnJvbSAje2N9P1wiIGlmIG5vdCBjPyBvciBjIDwgMFxuICAgICAgICBcbiAgICAgICAgbnVtID0gQG51bUNvbHMoKVxuICAgICAgICBpZiBvcHQucG9wXG4gICAgICAgICAgICBpZiBvcHQuY2xlYXI/XG4gICAgICAgICAgICAgICAgd2hpbGUgYyA8PSBvcHQuY2xlYXJcbiAgICAgICAgICAgICAgICAgICAgQGNsZWFyQ29sdW1uIGNcbiAgICAgICAgICAgICAgICAgICAgYysrXG4gICAgICAgICAgICB3aGlsZSBjIDwgbnVtXG4gICAgICAgICAgICAgICAgQHBvcENvbHVtbigpXG4gICAgICAgICAgICAgICAgYysrXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdoaWxlIGMgPCBudW1cbiAgICAgICAgICAgICAgICBAY2xlYXJDb2x1bW4gY1xuICAgICAgICAgICAgICAgIGMrK1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGlzTWVzc3k6IC0+IG5vdCBAZmxleC5yZWxheGVkIG9yIEBoYXNFbXB0eUNvbHVtbnMoKVxuICAgIFxuICAgIGNsZWFuVXA6IC0+IFxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IEBmbGV4P1xuICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IEBpc01lc3N5KClcbiAgICAgICAgQHBvcEVtcHR5Q29sdW1ucygpXG4gICAgICAgIEBmbGV4LnJlbGF4KClcbiAgICAgICAgdHJ1ZVxuXG4gICAgcmVzaXplZDogLT4gQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgIFxuICAgIHVwZGF0ZUNvbHVtblNjcm9sbHM6ID0+XG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY29sdW1uc1xuICAgICAgICAgICAgYy51cGRhdGVDcnVtYigpXG4gICAgICAgICAgICBjLnNjcm9sbC51cGRhdGUoKVxuXG4gICAgcmVzZXQ6IC0+IGRlbGV0ZSBAY29sczsgQGluaXRDb2x1bW5zKClcbiAgICBzdG9wOiAgLT4gQGNvbHMucmVtb3ZlKCk7IEBjb2xzID0gbnVsbFxuICAgIHN0YXJ0OiAtPiBAaW5pdENvbHVtbnMoKVxuXG4gICAgcmVmcmVzaDogPT4gcmVzZXQoKVxuICAgICAgICBcbiAgICAjIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgY29udmVydFBYTTogKHJvdykgLT5cbiAgICAgICAgXG4gICAgICAgIGl0ZW0gPSByb3cuaXRlbVxuICAgICAgICBmaWxlID0gaXRlbS5maWxlXG4gICAgICAgIHRtcFBYTSA9IHNsYXNoLmpvaW4gb3MudG1wZGlyKCksIFwia28tI3tzbGFzaC5iYXNlIGZpbGV9LnB4bVwiXG4gICAgICAgIHRtcFBORyA9IHNsYXNoLnN3YXBFeHQgdG1wUFhNLCAnLnBuZydcblxuICAgICAgICBmcy5jb3B5IGZpbGUsIHRtcFBYTSwgKGVycikgPT5cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJjYW4ndCBjb3B5IHB4bSBpbWFnZSAje2ZpbGV9IHRvICN7dG1wUFhNfTogI3tlcnJ9XCIgaWYgZXJyP1xuICAgICAgICAgICAgY2hpbGRwLmV4ZWMgXCJvcGVuICN7X19kaXJuYW1lfS8uLi8uLi9iaW4vcHhtMnBuZy5hcHAgLS1hcmdzICN7dG1wUFhNfVwiLCAoZXJyKSA9PlxuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJjYW4ndCBjb252ZXJ0IHB4bSBpbWFnZSAje3RtcFBYTX0gdG8gI3t0bXBQTkd9OiAje2Vycn1cIiBpZiBlcnI/XG4gICAgICAgICAgICAgICAgbG9hZERlbGF5ZWQgPSA9PiBAbG9hZEltYWdlIHJvdywgdG1wUE5HXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCBsb2FkRGVsYXllZCwgMzAwXG5cbiAgICBjb252ZXJ0SW1hZ2U6IChyb3cpIC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtID0gcm93Lml0ZW1cbiAgICAgICAgZmlsZSA9IGl0ZW0uZmlsZVxuICAgICAgICB0bXBJbWFnZSA9IHNsYXNoLmpvaW4gb3MudG1wZGlyKCksIFwia28tI3tzbGFzaC5iYXNlbmFtZSBmaWxlfS5wbmdcIlxuICAgICAgICBcbiAgICAgICAgY2hpbGRwLmV4ZWMgXCIvdXNyL2Jpbi9zaXBzIC1zIGZvcm1hdCBwbmcgXFxcIiN7ZmlsZX1cXFwiIC0tb3V0IFxcXCIje3RtcEltYWdlfVxcXCJcIiwgKGVycikgPT5cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJjYW4ndCBjb252ZXJ0IGltYWdlICN7ZmlsZX06ICN7ZXJyfVwiIGlmIGVycj9cbiAgICAgICAgICAgIEBsb2FkSW1hZ2Ugcm93LCB0bXBJbWFnZVxuXG4gICAgbG9hZEltYWdlOiAocm93LCBmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCByb3cuaXNBY3RpdmUoKVxuXG4gICAgICAgIGNvbCA9IEBlbXB0eUNvbHVtbiBvcHQ/LmNvbHVtblxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wuaW5kZXhcbiAgICAgICAgY250ID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJJbWFnZUNvbnRhaW5lcicsIGNoaWxkOiBcbiAgICAgICAgICAgIGVsZW0gJ2ltZycsIGNsYXNzOiAnYnJvd3NlckltYWdlJywgc3JjOiBzbGFzaC5maWxlVXJsIGZpbGVcbiAgICAgICAgY29sLnRhYmxlLmFwcGVuZENoaWxkIGNudFxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQnJvd3NlclxuIl19
//# sourceURL=../coffee/browser.coffee