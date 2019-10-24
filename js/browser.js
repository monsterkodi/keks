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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsK0dBQUE7SUFBQTs7QUFRQSxNQUEwRixPQUFBLENBQVEsS0FBUixDQUExRixFQUFFLGVBQUYsRUFBUSxpQkFBUixFQUFlLGVBQWYsRUFBcUIsaUJBQXJCLEVBQTRCLHVCQUE1QixFQUFzQyxtQkFBdEMsRUFBOEMsaUJBQTlDLEVBQXFELFdBQXJELEVBQXlELFdBQXpELEVBQTZELGVBQTdELEVBQW1FLGVBQW5FLEVBQXlFLG1CQUF6RSxFQUFpRixTQUFqRixFQUFvRjs7QUFFcEYsTUFBQSxHQUFTLE9BQUEsQ0FBUSxVQUFSOztBQUNULElBQUEsR0FBUyxPQUFBLENBQVEsYUFBUjs7QUFFSDtJQUVDLGlCQUFDLElBQUQ7UUFBQyxJQUFDLENBQUEsT0FBRDs7OztRQUVBLElBQUMsQ0FBQSxPQUFELEdBQVc7UUFFWCxRQUFBLENBQVMsa0JBQVQsRUFBNEIsU0FBNUIsRUFBc0MsS0FBSyxDQUFDLEdBQU4sQ0FBVSx3QkFBVixDQUFBLElBQXdDLE1BQXhDLElBQWtELFNBQXhGO0lBSkQ7O3NCQVlILFdBQUEsR0FBYSxTQUFBO1FBRVQsSUFBVSxtQkFBQSxJQUFXLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBTixLQUFvQixJQUFDLENBQUEsSUFBMUM7QUFBQSxtQkFBQTs7UUFFQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sR0FBa0I7UUFFbEIsSUFBRyxpQkFBSDtZQUNJLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixJQUFDLENBQUEsSUFBbkI7QUFDQSxtQkFGSjs7UUFJQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sU0FBTjtZQUFnQixFQUFBLEVBQUcsU0FBbkI7U0FBTDtRQUNSLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixJQUFDLENBQUEsSUFBbkI7UUFFQSxJQUFDLENBQUEsT0FBRCxHQUFXO2VBRVgsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFJLElBQUosQ0FDSjtZQUFBLElBQUEsRUFBWSxJQUFDLENBQUEsSUFBYjtZQUNBLFVBQUEsRUFBWSxJQUFDLENBQUEsbUJBRGI7U0FESTtJQWZDOztzQkFtQmIsV0FBQSxHQUFhLFNBQUMsR0FBRDtBQUVULFlBQUE7QUFBQTtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksSUFBRyxJQUFJLENBQUMsV0FBTCxDQUFpQixNQUFNLENBQUMsR0FBeEIsRUFBNkIsR0FBN0IsQ0FBSDtBQUNJLHVCQUFPLE9BRFg7O0FBREo7ZUFHQTtJQUxTOztzQkFPYixTQUFBLEdBQVcsU0FBQyxDQUFEO0FBRVAsWUFBQTtBQUFBO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxJQUFBLEdBQU8sSUFBQSxDQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUMscUJBQVgsQ0FBQSxDQUFrQyxDQUFDLElBQXhDLEVBQThDLE1BQU0sQ0FBQyxHQUFHLENBQUMscUJBQVgsQ0FBQSxDQUFrQyxDQUFDLEdBQWpGO1lBQ1AsSUFBQSxDQUFLLENBQUwsRUFBUSxJQUFSO1lBQ0EsR0FBQSxHQUFNLElBQUEsQ0FBSyxDQUFMLEVBQVEsSUFBSSxDQUFDLENBQWI7WUFDTixJQUFHLElBQUksQ0FBQyxXQUFMLENBQWlCLE1BQU0sQ0FBQyxHQUF4QixFQUE2QixHQUE3QixDQUFIO0FBQ0ksdUJBQU8sT0FEWDs7QUFKSjtlQU1BO0lBUk87O3NCQVVYLFFBQUEsR0FBVSxTQUFDLEdBQUQ7QUFFTixZQUFBO1FBQUEsSUFBRyxNQUFBLEdBQVMsSUFBQyxDQUFBLFdBQUQsQ0FBYSxHQUFiLENBQVo7QUFDSSxtQkFBTyxNQUFNLENBQUMsUUFBUCxDQUFnQixHQUFoQixFQURYOztlQUVBO0lBSk07O3NCQVlWLFFBQUEsR0FBVSxTQUFDLEdBQUQ7QUFFTixZQUFBO1FBQUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQUE7UUFFQSxJQUFHLEdBQUEsS0FBTyxJQUFWO1lBQ0ksSUFBRyxJQUFDLENBQUEsaUJBQUQsQ0FBQSxDQUFBLEdBQXVCLENBQTFCO2dCQUNJLElBQUcsR0FBQSxHQUFNLElBQUMsQ0FBQSxZQUFELENBQUEsQ0FBVDtvQkFDSSxJQUFHLEdBQUEsR0FBTSxHQUFHLENBQUMsU0FBSixDQUFBLENBQVQ7d0JBQ0ksSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBbkIsQ0FBVixFQURKO3FCQUFBLE1BQUE7d0JBR0ksSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQUcsQ0FBQyxJQUFKLENBQUEsQ0FBVixDQUFWLEVBSEo7cUJBREo7aUJBREo7YUFBQSxNQUFBO2dCQU9JLElBQUcsQ0FBSSxLQUFLLENBQUMsTUFBTixDQUFhLElBQUMsQ0FBQSxPQUFRLENBQUEsQ0FBQSxDQUFFLENBQUMsSUFBWixDQUFBLENBQWIsQ0FBUDtvQkFDSSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQUMsQ0FBQSxRQUFELENBQVUsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFDLENBQUEsT0FBUSxDQUFBLENBQUEsQ0FBRSxDQUFDLElBQVosQ0FBQSxDQUFWLENBQVYsQ0FBVixFQURKO2lCQVBKO2FBREo7U0FBQSxNQUFBO1lBV0ksS0FBQSx1RkFBZ0M7WUFDaEMsS0FBQSxHQUFRLEtBQUE7QUFBUSx3QkFBTyxHQUFQO0FBQUEseUJBQ1AsTUFETztBQUFBLHlCQUNELElBREM7K0JBQ1MsQ0FBQztBQURWLHlCQUVQLE9BRk87K0JBRVMsQ0FBQztBQUZWOztZQUloQixLQUFBLEdBQVEsS0FBQSxDQUFNLENBQU4sRUFBUyxJQUFDLENBQUEsT0FBRCxDQUFBLENBQUEsR0FBVyxDQUFwQixFQUF1QixLQUF2QjtZQUNSLElBQVUsS0FBQSxLQUFTLEtBQW5CO0FBQUEsdUJBQUE7O1lBQ0EsSUFBRyxJQUFDLENBQUEsT0FBUSxDQUFBLEtBQUEsQ0FBTSxDQUFDLE9BQWhCLENBQUEsQ0FBSDtnQkFDSSxJQUFDLENBQUEsT0FBUSxDQUFBLEtBQUEsQ0FBTSxDQUFDLEtBQWhCLENBQUEsQ0FBdUIsQ0FBQyxTQUF4QixDQUFBLENBQW1DLENBQUMsUUFBcEMsQ0FBQSxFQURKO2FBbEJKOztRQXFCQSxJQUFDLENBQUEsbUJBQUQsQ0FBQTtlQUNBO0lBMUJNOztzQkFrQ1YsS0FBQSxHQUFPLFNBQUMsR0FBRDtBQUNILFlBQUE7O2dCQUFnQixDQUFFLEtBQWxCLENBQXdCLEdBQXhCOztlQUNBO0lBRkc7O3NCQUlQLFdBQUEsR0FBYSxTQUFBO0FBQ1QsWUFBQTtBQUFBO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxJQUFZLENBQUMsQ0FBQyxRQUFGLENBQUEsQ0FBWjtBQUFBLHVCQUFPLEVBQVA7O0FBREo7SUFEUzs7c0JBVWIsV0FBQSxHQUFhLFNBQUMsUUFBRDtBQUVULFlBQUE7UUFBQSxJQUFHLGdCQUFIO0FBQ0ksaUJBQVMsZ0hBQVQ7Z0JBQ0ksSUFBQyxDQUFBLFdBQUQsQ0FBYSxDQUFiO0FBREosYUFESjs7QUFJQTtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksSUFBYyxHQUFHLENBQUMsT0FBSixDQUFBLENBQWQ7QUFBQSx1QkFBTyxJQUFQOztBQURKO2VBR0EsSUFBQyxDQUFBLFNBQUQsQ0FBQTtJQVRTOztzQkFpQmIsWUFBQSxHQUFjLFNBQUE7ZUFBRyxJQUFDLENBQUEsTUFBRCxDQUFRLElBQUMsQ0FBQSxpQkFBRCxDQUFBLENBQVI7SUFBSDs7c0JBQ2QsaUJBQUEsR0FBbUIsU0FBQTtBQUVmLFlBQUE7QUFBQTtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksSUFBRyxHQUFHLENBQUMsUUFBSixDQUFBLENBQUg7QUFBdUIsdUJBQU8sR0FBRyxDQUFDLE1BQWxDOztBQURKO2VBRUE7SUFKZTs7c0JBTW5CLGNBQUEsR0FBZ0IsU0FBQTtBQUVaLFlBQUE7UUFBQSxJQUFBLEdBQU87QUFDUDtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksSUFBRyxDQUFJLEdBQUcsQ0FBQyxPQUFKLENBQUEsQ0FBUDtnQkFDSSxJQUFBLEdBQU8sSUFEWDthQUFBLE1BQUE7QUFFSyxzQkFGTDs7QUFESjtlQUlBO0lBUFk7O3NCQVNoQixlQUFBLEdBQWlCLFNBQUE7ZUFBRyxJQUFDLENBQUEsT0FBUSxVQUFFLENBQUEsQ0FBQSxDQUFDLENBQUMsT0FBYixDQUFBO0lBQUg7O3NCQUVqQixNQUFBLEdBQVEsU0FBQTtBQUFHLFlBQUE7Z0RBQUssQ0FBRSxNQUFQLENBQUE7SUFBSDs7c0JBQ1IsT0FBQSxHQUFTLFNBQUE7ZUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDO0lBQVo7O3NCQUNULE1BQUEsR0FBUSxTQUFDLENBQUQ7UUFBTyxJQUFlLENBQUEsQ0FBQSxJQUFLLENBQUwsSUFBSyxDQUFMLEdBQVMsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFULENBQWY7bUJBQUEsSUFBQyxDQUFBLE9BQVEsQ0FBQSxDQUFBLEVBQVQ7O0lBQVA7O3NCQVFSLFNBQUEsR0FBVyxTQUFBO0FBRVAsWUFBQTtRQUFBLElBQVUsQ0FBSSxJQUFDLENBQUEsSUFBZjtBQUFBLG1CQUFBOztRQUVBLEdBQUEsR0FBTSxJQUFJLE1BQUosQ0FBVyxJQUFYO1FBQ04sSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsR0FBZDtRQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTixDQUFjO1lBQUEsR0FBQSxFQUFJLEdBQUcsQ0FBQyxHQUFSO1lBQWEsSUFBQSxFQUFLLEVBQWxCO1NBQWQ7ZUFDQTtJQVBPOztzQkFlWCxXQUFBLEdBQWEsU0FBQyxLQUFEO1FBQVcsSUFBRyxLQUFBLEdBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFwQjttQkFBZ0MsSUFBQyxDQUFBLE9BQVEsQ0FBQSxLQUFBLENBQU0sQ0FBQyxLQUFoQixDQUFBLEVBQWhDOztJQUFYOztzQkFFYixXQUFBLEdBQWEsU0FBQTtBQUVULFlBQUE7UUFBQSxJQUFVLENBQUksSUFBQyxDQUFBLElBQWY7QUFBQSxtQkFBQTs7UUFDQSxJQUFVLENBQUksSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUF2QjtBQUFBLG1CQUFBOztRQUNBLElBQUMsQ0FBQSxXQUFELENBQWEsQ0FBYjtRQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBTixDQUFBO1FBQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFULENBQUE7QUFFQTthQUFTLGlHQUFUO3lCQUNJLElBQUMsQ0FBQSxPQUFRLENBQUEsQ0FBQSxDQUFFLENBQUMsUUFBWixDQUFxQixDQUFyQjtBQURKOztJQVJTOztzQkFXYixTQUFBLEdBQVcsU0FBQyxHQUFEO1FBRVAsSUFBVSxDQUFJLElBQUMsQ0FBQSxJQUFmO0FBQUEsbUJBQUE7O1FBQ0EsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsR0FBZ0IsQ0FBN0I7UUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQU4sQ0FBYyxHQUFkO2VBQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxHQUFULENBQUE7SUFMTzs7c0JBT1gsZUFBQSxHQUFpQixTQUFDLEdBQUQ7QUFFYixZQUFBO2VBQUEsSUFBQyxDQUFBLGdCQUFELHVGQUE0QyxDQUE1QyxFQUErQztZQUFBLEdBQUEsRUFBSSxJQUFKO1NBQS9DO0lBRmE7O3NCQUlqQixjQUFBLEdBQWdCLFNBQUMsR0FBRDtBQUVaLFlBQUE7UUFBQSxJQUFDLENBQUEsV0FBRCxDQUFBO0FBRUEsYUFBUyxpRkFBVDtZQUNJLElBQUMsQ0FBQSxXQUFELENBQUE7QUFESjtlQUdBLElBQUMsQ0FBQSxtQkFBRCxDQUFBO0lBUFk7O3NCQWVoQixLQUFBLEdBQU8sU0FBQTtlQUFHLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixDQUFsQixFQUFxQjtZQUFBLEdBQUEsRUFBSSxJQUFKO1NBQXJCO0lBQUg7O3NCQUVQLGdCQUFBLEdBQWtCLFNBQUMsQ0FBRCxFQUFNLEdBQU47QUFFZCxZQUFBOztZQUZlLElBQUU7OztZQUFHLE1BQUk7Z0JBQUEsR0FBQSxFQUFJLEtBQUo7OztRQUV4QixJQUE4QyxXQUFKLElBQVUsQ0FBQSxHQUFJLENBQXhEO0FBQUEsbUJBQU8sTUFBQSxDQUFPLG1CQUFBLEdBQW9CLENBQXBCLEdBQXNCLEdBQTdCLEVBQVA7O1FBRUEsR0FBQSxHQUFNLElBQUMsQ0FBQSxPQUFELENBQUE7UUFDTixJQUFHLEdBQUcsQ0FBQyxHQUFQO1lBQ0ksSUFBRyxpQkFBSDtBQUNJLHVCQUFNLENBQUEsSUFBSyxHQUFHLENBQUMsS0FBZjtvQkFDSSxJQUFDLENBQUEsV0FBRCxDQUFhLENBQWI7b0JBQ0EsQ0FBQTtnQkFGSixDQURKOztBQUlBO21CQUFNLENBQUEsR0FBSSxHQUFWO2dCQUNJLElBQUMsQ0FBQSxTQUFELENBQUE7NkJBQ0EsQ0FBQTtZQUZKLENBQUE7MkJBTEo7U0FBQSxNQUFBO0FBU0k7bUJBQU0sQ0FBQSxHQUFJLEdBQVY7Z0JBQ0ksSUFBQyxDQUFBLFdBQUQsQ0FBYSxDQUFiOzhCQUNBLENBQUE7WUFGSixDQUFBOzRCQVRKOztJQUxjOztzQkF3QmxCLE9BQUEsR0FBUyxTQUFBO2VBQUcsQ0FBSSxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQVYsSUFBcUIsSUFBQyxDQUFBLGVBQUQsQ0FBQTtJQUF4Qjs7c0JBRVQsT0FBQSxHQUFTLFNBQUE7UUFDTCxJQUFvQixpQkFBcEI7QUFBQSxtQkFBTyxNQUFQOztRQUNBLElBQWdCLENBQUksSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFwQjtBQUFBLG1CQUFPLE1BQVA7O1FBQ0EsSUFBQyxDQUFBLGVBQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBTixDQUFBO2VBQ0E7SUFMSzs7c0JBT1QsT0FBQSxHQUFTLFNBQUE7QUFFTCxZQUFBOztnQkFBTyxDQUFFLE9BQVQsQ0FBQTs7ZUFFQSxJQUFDLENBQUEsbUJBQUQsQ0FBQTtJQUpLOztzQkFNVCxtQkFBQSxHQUFxQixTQUFBO0FBRWpCLFlBQUE7QUFBQTtBQUFBO2FBQUEsc0NBQUE7O1lBQ0ksQ0FBQyxDQUFDLFdBQUYsQ0FBQTt5QkFDQSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQVQsQ0FBQTtBQUZKOztJQUZpQjs7c0JBTXJCLEtBQUEsR0FBTyxTQUFBO1FBQUcsT0FBTyxJQUFDLENBQUE7ZUFBTSxJQUFDLENBQUEsV0FBRCxDQUFBO0lBQWpCOztzQkFDUCxJQUFBLEdBQU8sU0FBQTtRQUFHLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixDQUFBO2VBQWdCLElBQUMsQ0FBQSxJQUFELEdBQVE7SUFBM0I7O3NCQUNQLEtBQUEsR0FBTyxTQUFBO2VBQUcsSUFBQyxDQUFBLFdBQUQsQ0FBQTtJQUFIOztzQkFFUCxPQUFBLEdBQVMsU0FBQTtlQUFHLEtBQUEsQ0FBQTtJQUFIOztzQkFRVCxVQUFBLEdBQVksU0FBQyxHQUFEO0FBRVIsWUFBQTtRQUFBLElBQUEsR0FBUyxHQUFHLENBQUM7UUFDYixJQUFBLEdBQVMsSUFBSSxDQUFDO1FBQ2QsTUFBQSxHQUFTLEtBQUssQ0FBQyxJQUFOLENBQVcsRUFBRSxDQUFDLE1BQUgsQ0FBQSxDQUFYLEVBQXdCLEtBQUEsR0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFELENBQUwsR0FBc0IsTUFBOUM7UUFDVCxNQUFBLEdBQVMsS0FBSyxDQUFDLE9BQU4sQ0FBYyxNQUFkLEVBQXNCLE1BQXRCO2VBRVQsRUFBRSxDQUFDLElBQUgsQ0FBUSxJQUFSLEVBQWMsTUFBZCxFQUFzQixDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFDLEdBQUQ7Z0JBQ2xCLElBQXFFLFdBQXJFO0FBQUEsMkJBQU8sTUFBQSxDQUFPLHVCQUFBLEdBQXdCLElBQXhCLEdBQTZCLE1BQTdCLEdBQW1DLE1BQW5DLEdBQTBDLElBQTFDLEdBQThDLEdBQXJELEVBQVA7O3VCQUNBLE1BQU0sQ0FBQyxJQUFQLENBQVksT0FBQSxHQUFRLFNBQVIsR0FBa0IsZ0NBQWxCLEdBQWtELE1BQTlELEVBQXdFLFNBQUMsR0FBRDtBQUNwRSx3QkFBQTtvQkFBQSxJQUEwRSxXQUExRTtBQUFBLCtCQUFPLE1BQUEsQ0FBTywwQkFBQSxHQUEyQixNQUEzQixHQUFrQyxNQUFsQyxHQUF3QyxNQUF4QyxHQUErQyxJQUEvQyxHQUFtRCxHQUExRCxFQUFQOztvQkFDQSxXQUFBLEdBQWMsU0FBQTsrQkFBRyxLQUFDLENBQUEsU0FBRCxDQUFXLEdBQVgsRUFBZ0IsTUFBaEI7b0JBQUg7MkJBQ2QsVUFBQSxDQUFXLFdBQVgsRUFBd0IsR0FBeEI7Z0JBSG9FLENBQXhFO1lBRmtCO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF0QjtJQVBROztzQkFjWixZQUFBLEdBQWMsU0FBQyxHQUFEO0FBRVYsWUFBQTtRQUFBLElBQUEsR0FBUyxHQUFHLENBQUM7UUFDYixJQUFBLEdBQVMsSUFBSSxDQUFDO1FBQ2QsTUFBQSxHQUFTLEtBQUssQ0FBQyxJQUFOLENBQVcsRUFBRSxDQUFDLE1BQUgsQ0FBQSxDQUFYLEVBQXdCLEtBQUEsR0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFOLENBQWUsSUFBZixDQUFELENBQUwsR0FBMEIsTUFBbEQ7ZUFFVCxNQUFNLENBQUMsSUFBUCxDQUFZLGdDQUFBLEdBQWlDLElBQWpDLEdBQXNDLGFBQXRDLEdBQW1ELE1BQW5ELEdBQTBELElBQXRFLEVBQTJFLENBQUEsU0FBQSxLQUFBO21CQUFBLFNBQUMsR0FBRDtnQkFDdkUsSUFBdUQsV0FBdkQ7QUFBQSwyQkFBTyxNQUFBLENBQU8sc0JBQUEsR0FBdUIsSUFBdkIsR0FBNEIsSUFBNUIsR0FBZ0MsR0FBdkMsRUFBUDs7dUJBQ0EsS0FBQyxDQUFBLFNBQUQsQ0FBVyxHQUFYLEVBQWdCLE1BQWhCO1lBRnVFO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUEzRTtJQU5VOztzQkFVZCxTQUFBLEdBQVcsU0FBQyxHQUFELEVBQU0sSUFBTjtBQUVQLFlBQUE7UUFBQSxJQUFVLENBQUksR0FBRyxDQUFDLFFBQUosQ0FBQSxDQUFkO0FBQUEsbUJBQUE7O1FBRUEsR0FBQSxHQUFNLElBQUMsQ0FBQSxXQUFELDhDQUFhLEdBQUcsQ0FBRSxlQUFsQjtRQUNOLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixHQUFHLENBQUMsS0FBdEI7UUFDQSxHQUFBLEdBQU0sSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyx1QkFBUDtZQUFnQyxLQUFBLEVBQ3ZDLElBQUEsQ0FBSyxLQUFMLEVBQVk7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO2dCQUF1QixHQUFBLEVBQUssS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFkLENBQTVCO2FBQVosQ0FETztTQUFMO2VBRU4sR0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFWLENBQXNCLEdBQXRCO0lBUk87Ozs7OztBQVVmLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbjAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbnsgcG9zdCwgcHJlZnMsIGVsZW0sIGNsYW1wLCBzZXRTdHlsZSwgY2hpbGRwLCBzbGFzaCwgZnMsIG9zLCBrcG9zLCBrbG9nLCBrZXJyb3IsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuQ29sdW1uID0gcmVxdWlyZSAnLi9jb2x1bW4nXG5mbGV4ICAgPSByZXF1aXJlICcuL2ZsZXgvZmxleCdcblxuY2xhc3MgQnJvd3NlclxuICAgIFxuICAgIEA6IChAdmlldykgLT5cbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW5zID0gW11cbiAgICAgICAgXG4gICAgICAgIHNldFN0eWxlICcuYnJvd3NlclJvdyAuZXh0JyAnZGlzcGxheScgcHJlZnMuZ2V0KCdicm93c2Vy4pa4aGlkZUV4dGVuc2lvbnMnKSBhbmQgJ25vbmUnIG9yICdpbml0aWFsJ1xuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgaW5pdENvbHVtbnM6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgQGNvbHM/IGFuZCBAY29scy5wYXJlbnROb2RlID09IEB2aWV3XG4gICAgICAgIFxuICAgICAgICBAdmlldy5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBcbiAgICAgICAgaWYgQGNvbHM/XG4gICAgICAgICAgICBAdmlldy5hcHBlbmRDaGlsZCBAY29sc1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgQGNvbHMgPSBlbGVtIGNsYXNzOidicm93c2VyJyBpZDonY29sdW1ucydcbiAgICAgICAgQHZpZXcuYXBwZW5kQ2hpbGQgQGNvbHNcbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW5zID0gW11cblxuICAgICAgICBAZmxleCA9IG5ldyBmbGV4IFxuICAgICAgICAgICAgdmlldzogICAgICAgQGNvbHNcbiAgICAgICAgICAgIG9uUGFuZVNpemU6IEB1cGRhdGVDb2x1bW5TY3JvbGxzXG4gICAgICAgIFxuICAgIGNvbHVtbkF0UG9zOiAocG9zKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGNvbHVtbiBpbiBAY29sdW1uc1xuICAgICAgICAgICAgaWYgZWxlbS5jb250YWluc1BvcyBjb2x1bW4uZGl2LCBwb3NcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sdW1uXG4gICAgICAgIG51bGxcbiAgICAgICAgXG4gICAgY29sdW1uQXRYOiAoeCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGNwb3MgPSBrcG9zIGNvbHVtbi5kaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgY29sdW1uLmRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcbiAgICAgICAgICAgIGtsb2cgeCwgY3Bvc1xuICAgICAgICAgICAgcG9zID0ga3BvcyB4LCBjcG9zLnlcbiAgICAgICAgICAgIGlmIGVsZW0uY29udGFpbnNQb3MgY29sdW1uLmRpdiwgcG9zXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbHVtblxuICAgICAgICBudWxsXG4gICAgICAgIFxuICAgIHJvd0F0UG9zOiAocG9zKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgY29sdW1uID0gQGNvbHVtbkF0UG9zIHBvc1xuICAgICAgICAgICAgcmV0dXJuIGNvbHVtbi5yb3dBdFBvcyBwb3NcbiAgICAgICAgbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBuYXZpZ2F0ZTogKGtleSkgLT5cbiAgXG4gICAgICAgIEBzZWxlY3QuY2xlYXIoKVxuICAgICAgICBcbiAgICAgICAgaWYga2V5ID09ICd1cCdcbiAgICAgICAgICAgIGlmIEBhY3RpdmVDb2x1bW5JbmRleCgpID4gMFxuICAgICAgICAgICAgICAgIGlmIGNvbCA9IEBhY3RpdmVDb2x1bW4oKVxuICAgICAgICAgICAgICAgICAgICBpZiByb3cgPSBjb2wuYWN0aXZlUm93KClcbiAgICAgICAgICAgICAgICAgICAgICAgIEBsb2FkSXRlbSBAZmlsZUl0ZW0gcm93Lml0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAbG9hZEl0ZW0gQGZpbGVJdGVtIGNvbC5wYXRoKClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBub3Qgc2xhc2guaXNSb290IEBjb2x1bW5zWzBdLnBhdGgoKVxuICAgICAgICAgICAgICAgICAgICBAbG9hZEl0ZW0gQGZpbGVJdGVtIHNsYXNoLmRpciBAY29sdW1uc1swXS5wYXRoKClcbiAgICAgICAgZWxzZSAgICAgICAgXG4gICAgICAgICAgICBpbmRleCA9IEBmb2N1c0NvbHVtbigpPy5pbmRleCA/IDBcbiAgICAgICAgICAgIG51aWR4ID0gaW5kZXggKyBzd2l0Y2gga2V5XG4gICAgICAgICAgICAgICAgd2hlbiAnbGVmdCcndXAnIHRoZW4gLTFcbiAgICAgICAgICAgICAgICB3aGVuICdyaWdodCcgICAgdGhlbiArMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG51aWR4ID0gY2xhbXAgMCwgQG51bUNvbHMoKS0xLCBudWlkeFxuICAgICAgICAgICAgcmV0dXJuIGlmIG51aWR4ID09IGluZGV4XG4gICAgICAgICAgICBpZiBAY29sdW1uc1tudWlkeF0ubnVtUm93cygpXG4gICAgICAgICAgICAgICAgQGNvbHVtbnNbbnVpZHhdLmZvY3VzKCkuYWN0aXZlUm93KCkuYWN0aXZhdGUoKVxuICAgICAgICAgICAgXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBmb2N1czogKG9wdCkgPT4gXG4gICAgICAgIEBsYXN0RGlyQ29sdW1uKCk/LmZvY3VzIG9wdFxuICAgICAgICBAXG4gICAgXG4gICAgZm9jdXNDb2x1bW46IC0+IFxuICAgICAgICBmb3IgYyBpbiBAY29sdW1uc1xuICAgICAgICAgICAgcmV0dXJuIGMgaWYgYy5oYXNGb2N1cygpXG4gICAgICBcbiAgICAjIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAgIDAwMCAgICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgZW1wdHlDb2x1bW46IChjb2xJbmRleCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGNvbEluZGV4P1xuICAgICAgICAgICAgZm9yIGMgaW4gW2NvbEluZGV4Li4uQG51bUNvbHMoKV1cbiAgICAgICAgICAgICAgICBAY2xlYXJDb2x1bW4gY1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBmb3IgY29sIGluIEBjb2x1bW5zXG4gICAgICAgICAgICByZXR1cm4gY29sIGlmIGNvbC5pc0VtcHR5KClcbiAgICAgICAgICAgIFxuICAgICAgICBAYWRkQ29sdW1uKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAgIFxuICAgIFxuICAgIGFjdGl2ZUNvbHVtbjogLT4gQGNvbHVtbiBAYWN0aXZlQ29sdW1uSW5kZXgoKVxuICAgIGFjdGl2ZUNvbHVtbkluZGV4OiAtPiBcbiAgICAgICAgXG4gICAgICAgIGZvciBjb2wgaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbC5oYXNGb2N1cygpIHRoZW4gcmV0dXJuIGNvbC5pbmRleFxuICAgICAgICAwXG4gICAgICAgICAgICAgICAgXG4gICAgbGFzdFVzZWRDb2x1bW46IC0+XG4gICAgICAgIFxuICAgICAgICB1c2VkID0gbnVsbFxuICAgICAgICBmb3IgY29sIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBub3QgY29sLmlzRW1wdHkoKVxuICAgICAgICAgICAgICAgIHVzZWQgPSBjb2wgXG4gICAgICAgICAgICBlbHNlIGJyZWFrXG4gICAgICAgIHVzZWRcblxuICAgIGhhc0VtcHR5Q29sdW1uczogLT4gQGNvbHVtbnNbLTFdLmlzRW1wdHkoKVxuXG4gICAgaGVpZ2h0OiAtPiBAZmxleD8uaGVpZ2h0KClcbiAgICBudW1Db2xzOiAtPiBAY29sdW1ucy5sZW5ndGggXG4gICAgY29sdW1uOiAoaSkgLT4gQGNvbHVtbnNbaV0gaWYgMCA8PSBpIDwgQG51bUNvbHMoKVxuICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAgICAgICBcbiAgICBhZGRDb2x1bW46IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBmbGV4XG5cbiAgICAgICAgY29sID0gbmV3IENvbHVtbiBAXG4gICAgICAgIEBjb2x1bW5zLnB1c2ggY29sXG4gICAgICAgIEBmbGV4LmFkZFBhbmUgZGl2OmNvbC5kaXYsIHNpemU6NTBcbiAgICAgICAgY29sXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgIFxuICAgIFxuICAgIGNsZWFyQ29sdW1uOiAoaW5kZXgpIC0+IGlmIGluZGV4IDwgQGNvbHVtbnMubGVuZ3RoIHRoZW4gQGNvbHVtbnNbaW5kZXhdLmNsZWFyKClcbiAgICBcbiAgICBzaGlmdENvbHVtbjogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAY29sdW1ucy5sZW5ndGhcbiAgICAgICAgQGNsZWFyQ29sdW1uIDBcbiAgICAgICAgQGZsZXguc2hpZnRQYW5lKClcbiAgICAgICAgQGNvbHVtbnMuc2hpZnQoKVxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5AY29sdW1ucy5sZW5ndGhdXG4gICAgICAgICAgICBAY29sdW1uc1tpXS5zZXRJbmRleCBpXG4gICAgXG4gICAgcG9wQ29sdW1uOiAob3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuICAgICAgICBAY2xlYXJDb2x1bW4gQGNvbHVtbnMubGVuZ3RoLTFcbiAgICAgICAgQGZsZXgucG9wUGFuZSBvcHRcbiAgICAgICAgQGNvbHVtbnMucG9wKClcbiAgICAgICAgXG4gICAgcG9wRW1wdHlDb2x1bW5zOiAob3B0KSAtPiBcbiAgICAgICAgXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIEBsYXN0RGlyQ29sdW1uKCk/LmluZGV4ID8gMCwgcG9wOnRydWVcbiAgICAgICAgXG4gICAgc2hpZnRDb2x1bW5zVG86IChjb2wpIC0+XG4gICAgICAgIFxuICAgICAgICBAY2xvc2VWaWV3ZXIoKVxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5jb2xdXG4gICAgICAgICAgICBAc2hpZnRDb2x1bW4oKVxuICAgICAgICAgICAgXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGNsZWFyOiAtPiBAY2xlYXJDb2x1bW5zRnJvbSAwLCBwb3A6dHJ1ZSBcbiAgICBcbiAgICBjbGVhckNvbHVtbnNGcm9tOiAoYz0wLCBvcHQ9cG9wOmZhbHNlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtlcnJvciBcImNsZWFyQ29sdW1uc0Zyb20gI3tjfT9cIiBpZiBub3QgYz8gb3IgYyA8IDBcbiAgICAgICAgXG4gICAgICAgIG51bSA9IEBudW1Db2xzKClcbiAgICAgICAgaWYgb3B0LnBvcFxuICAgICAgICAgICAgaWYgb3B0LmNsZWFyP1xuICAgICAgICAgICAgICAgIHdoaWxlIGMgPD0gb3B0LmNsZWFyXG4gICAgICAgICAgICAgICAgICAgIEBjbGVhckNvbHVtbiBjXG4gICAgICAgICAgICAgICAgICAgIGMrK1xuICAgICAgICAgICAgd2hpbGUgYyA8IG51bVxuICAgICAgICAgICAgICAgIEBwb3BDb2x1bW4oKVxuICAgICAgICAgICAgICAgIGMrK1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB3aGlsZSBjIDwgbnVtXG4gICAgICAgICAgICAgICAgQGNsZWFyQ29sdW1uIGNcbiAgICAgICAgICAgICAgICBjKytcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBpc01lc3N5OiAtPiBub3QgQGZsZXgucmVsYXhlZCBvciBAaGFzRW1wdHlDb2x1bW5zKClcbiAgICBcbiAgICBjbGVhblVwOiAtPiBcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBAZmxleD9cbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBAaXNNZXNzeSgpXG4gICAgICAgIEBwb3BFbXB0eUNvbHVtbnMoKVxuICAgICAgICBAZmxleC5yZWxheCgpXG4gICAgICAgIHRydWVcblxuICAgIHJlc2l6ZWQ6IC0+IFxuXG4gICAgICAgIEB2aWV3ZXI/LnJlc2l6ZWQoKVxuICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgIFxuICAgIHVwZGF0ZUNvbHVtblNjcm9sbHM6ID0+XG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY29sdW1uc1xuICAgICAgICAgICAgYy51cGRhdGVDcnVtYigpXG4gICAgICAgICAgICBjLnNjcm9sbC51cGRhdGUoKVxuXG4gICAgcmVzZXQ6IC0+IGRlbGV0ZSBAY29sczsgQGluaXRDb2x1bW5zKClcbiAgICBzdG9wOiAgLT4gQGNvbHMucmVtb3ZlKCk7IEBjb2xzID0gbnVsbFxuICAgIHN0YXJ0OiAtPiBAaW5pdENvbHVtbnMoKVxuXG4gICAgcmVmcmVzaDogPT4gcmVzZXQoKVxuICAgICAgICBcbiAgICAjIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgY29udmVydFBYTTogKHJvdykgLT5cbiAgICAgICAgXG4gICAgICAgIGl0ZW0gICA9IHJvdy5pdGVtXG4gICAgICAgIGZpbGUgICA9IGl0ZW0uZmlsZVxuICAgICAgICB0bXBQWE0gPSBzbGFzaC5qb2luIG9zLnRtcGRpcigpLCBcImtvLSN7c2xhc2guYmFzZSBmaWxlfS5weG1cIlxuICAgICAgICB0bXBQTkcgPSBzbGFzaC5zd2FwRXh0IHRtcFBYTSwgJy5wbmcnXG5cbiAgICAgICAgZnMuY29weSBmaWxlLCB0bXBQWE0sIChlcnIpID0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29weSBweG0gaW1hZ2UgI3tmaWxlfSB0byAje3RtcFBYTX06ICN7ZXJyfVwiIGlmIGVycj9cbiAgICAgICAgICAgIGNoaWxkcC5leGVjIFwib3BlbiAje19fZGlybmFtZX0vLi4vLi4vYmluL3B4bTJwbmcuYXBwIC0tYXJncyAje3RtcFBYTX1cIiwgKGVycikgPT5cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29udmVydCBweG0gaW1hZ2UgI3t0bXBQWE19IHRvICN7dG1wUE5HfTogI3tlcnJ9XCIgaWYgZXJyP1xuICAgICAgICAgICAgICAgIGxvYWREZWxheWVkID0gPT4gQGxvYWRJbWFnZSByb3csIHRtcFBOR1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQgbG9hZERlbGF5ZWQsIDMwMFxuXG4gICAgY29udmVydEltYWdlOiAocm93KSAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbSAgID0gcm93Lml0ZW1cbiAgICAgICAgZmlsZSAgID0gaXRlbS5maWxlXG4gICAgICAgIHRtcEltZyA9IHNsYXNoLmpvaW4gb3MudG1wZGlyKCksIFwia28tI3tzbGFzaC5iYXNlbmFtZSBmaWxlfS5wbmdcIlxuICAgICAgICBcbiAgICAgICAgY2hpbGRwLmV4ZWMgXCIvdXNyL2Jpbi9zaXBzIC1zIGZvcm1hdCBwbmcgXFxcIiN7ZmlsZX1cXFwiIC0tb3V0IFxcXCIje3RtcEltZ31cXFwiXCIsIChlcnIpID0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY2FuJ3QgY29udmVydCBpbWFnZSAje2ZpbGV9OiAje2Vycn1cIiBpZiBlcnI/XG4gICAgICAgICAgICBAbG9hZEltYWdlIHJvdywgdG1wSW1nXG5cbiAgICBsb2FkSW1hZ2U6IChyb3csIGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IHJvdy5pc0FjdGl2ZSgpXG5cbiAgICAgICAgY29sID0gQGVtcHR5Q29sdW1uIG9wdD8uY29sdW1uXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbC5pbmRleFxuICAgICAgICBjbnQgPSBlbGVtIGNsYXNzOiAnYnJvd3NlckltYWdlQ29udGFpbmVyJywgY2hpbGQ6IFxuICAgICAgICAgICAgZWxlbSAnaW1nJywgY2xhc3M6ICdicm93c2VySW1hZ2UnLCBzcmM6IHNsYXNoLmZpbGVVcmwgZmlsZVxuICAgICAgICBjb2wudGFibGUuYXBwZW5kQ2hpbGQgY250XG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBCcm93c2VyXG4iXX0=
//# sourceURL=../coffee/browser.coffee