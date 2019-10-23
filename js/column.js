// koffee 1.4.0

/*
 0000000   0000000   000      000   000  00     00  000   000
000       000   000  000      000   000  000   000  0000  000
000       000   000  000      000   000  000000000  000 0 000
000       000   000  000      000   000  000 0 000  000  0000
 0000000   0000000   0000000   0000000   000   000  000   000
 */
var $, Column, Crumb, Editor, File, Row, Scroller, Viewer, _, clamp, drag, elem, empty, fs, fuzzy, kerror, keyinfo, klog, kpos, open, popup, post, prefs, ref, setStyle, slash, stopEvent, valid, wxw,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, prefs = ref.prefs, stopEvent = ref.stopEvent, setStyle = ref.setStyle, keyinfo = ref.keyinfo, popup = ref.popup, slash = ref.slash, valid = ref.valid, clamp = ref.clamp, empty = ref.empty, drag = ref.drag, open = ref.open, elem = ref.elem, kpos = ref.kpos, fs = ref.fs, klog = ref.klog, kerror = ref.kerror, $ = ref.$, _ = ref._;

Row = require('./row');

Scroller = require('./tools/scroller');

File = require('./tools/file');

Viewer = require('./viewer');

Editor = require('./editor');

Crumb = require('./crumb');

fuzzy = require('fuzzy');

wxw = require('wxw');

Column = (function() {
    function Column(browser) {
        var ref1, ref2;
        this.browser = browser;
        this.onKeyUp = bind(this.onKeyUp, this);
        this.onKey = bind(this.onKey, this);
        this.showContextMenu = bind(this.showContextMenu, this);
        this.onContextMenu = bind(this.onContextMenu, this);
        this.makeRoot = bind(this.makeRoot, this);
        this.open = bind(this.open, this);
        this.explorer = bind(this.explorer, this);
        this.duplicateFile = bind(this.duplicateFile, this);
        this.newFolder = bind(this.newFolder, this);
        this.openViewer = bind(this.openViewer, this);
        this.addToShelf = bind(this.addToShelf, this);
        this.moveToTrash = bind(this.moveToTrash, this);
        this.toggleDotFiles = bind(this.toggleDotFiles, this);
        this.sortByDateAdded = bind(this.sortByDateAdded, this);
        this.sortByType = bind(this.sortByType, this);
        this.sortByName = bind(this.sortByName, this);
        this.removeObject = bind(this.removeObject, this);
        this.clearSearch = bind(this.clearSearch, this);
        this.updateCrumb = bind(this.updateCrumb, this);
        this.onDblClick = bind(this.onDblClick, this);
        this.onMouseOut = bind(this.onMouseOut, this);
        this.onMouseOver = bind(this.onMouseOver, this);
        this.onBlur = bind(this.onBlur, this);
        this.onFocus = bind(this.onFocus, this);
        this.insertFile = bind(this.insertFile, this);
        this.removeFile = bind(this.removeFile, this);
        this.onDragStop = bind(this.onDragStop, this);
        this.onDragMove = bind(this.onDragMove, this);
        this.onDragStart = bind(this.onDragStart, this);
        this.searchTimer = null;
        this.search = '';
        this.items = [];
        this.rows = [];
        this.div = elem({
            "class": 'browserColumn',
            tabIndex: 6
        });
        this.table = elem({
            "class": 'browserColumnTable'
        });
        this.div.appendChild(this.table);
        this.setIndex((ref1 = this.browser.columns) != null ? ref1.length : void 0);
        if ((ref2 = this.browser.cols) != null) {
            ref2.appendChild(this.div);
        }
        this.div.addEventListener('focus', this.onFocus);
        this.div.addEventListener('blur', this.onBlur);
        this.div.addEventListener('keydown', this.onKey);
        this.div.addEventListener('keyup', this.onKeyUp);
        this.div.addEventListener('mouseover', this.onMouseOver);
        this.div.addEventListener('mouseout', this.onMouseOut);
        this.div.addEventListener('dblclick', this.onDblClick);
        this.div.addEventListener('contextmenu', this.onContextMenu);
        this.drag = new drag({
            target: this.div,
            onStart: this.onDragStart,
            onMove: this.onDragMove,
            onStop: this.onDragStop
        });
        this.crumb = new Crumb(this);
        this.scroll = new Scroller(this);
    }

    Column.prototype.setIndex = function(index1) {
        var ref1;
        this.index = index1;
        return (ref1 = this.crumb) != null ? ref1.elem.columnIndex = this.index : void 0;
    };

    Column.prototype.onDragStart = function(d, e) {
        var ref1, ref2, ref3;
        this.dragStartRow = this.row(e.target);
        delete this.toggle;
        if (this.dragStartRow) {
            if (e.shiftKey) {
                return this.browser.select.to(this.dragStartRow);
            } else if (e.metaKey || e.altKey || e.ctrlKey) {
                if (!row.isSelected()) {
                    return this.browser.select.toggle(this.dragStartRow);
                } else {
                    return this.toggle = true;
                }
            } else {
                if (this.dragStartRow.isSelected()) {
                    return this.deselect = true;
                } else {
                    if ((ref1 = this.activeRow()) != null) {
                        ref1.clearActive();
                    }
                    return this.browser.select.row(this.dragStartRow, false);
                }
            }
        } else {
            if (this.hasFocus()) {
                if ((ref2 = this.activeRow()) != null ? ref2 : this.browser.select.active) {
                    return this.browser.select.row((ref3 = this.activeRow()) != null ? ref3 : this.browser.select.active);
                }
            }
        }
    };

    Column.prototype.onDragMove = function(d, e) {
        var br, i, len, pos, ref1, row, rowClone;
        if (this.dragStartRow && !this.dragDiv && valid(this.browser.select.files())) {
            if (Math.abs(d.deltaSum.x) < 20 && Math.abs(d.deltaSum.y) < 10) {
                return;
            }
            delete this.toggle;
            delete this.deselect;
            this.dragDiv = elem('div');
            this.dragDiv.drag = d;
            pos = kpos(e.pageX, e.pageY);
            row = this.browser.select.rows[0];
            br = row.div.getBoundingClientRect();
            this.dragDiv.style.position = 'absolute';
            this.dragDiv.style.opacity = "0.7";
            this.dragDiv.style.top = (pos.y - d.deltaSum.y) + "px";
            this.dragDiv.style.left = (pos.x - d.deltaSum.x) + "px";
            this.dragDiv.style.width = (br.width - 12) + "px";
            this.dragDiv.style.pointerEvents = 'none';
            this.dragInd = elem({
                "class": 'dragIndicator'
            });
            this.dragDiv.appendChild(this.dragInd);
            ref1 = this.browser.select.rows;
            for (i = 0, len = ref1.length; i < len; i++) {
                row = ref1[i];
                rowClone = row.div.cloneNode(true);
                rowClone.style.flex = 'unset';
                rowClone.style.pointerEvents = 'none';
                rowClone.style.border = 'none';
                rowClone.style.marginBottom = '-1px';
                this.dragDiv.appendChild(rowClone);
            }
            document.body.appendChild(this.dragDiv);
            this.focus({
                activate: false
            });
        }
        if (this.dragDiv) {
            this.updateDragIndicator(e);
            return this.dragDiv.style.transform = "translateX(" + d.deltaSum.x + "px) translateY(" + d.deltaSum.y + "px)";
        }
    };

    Column.prototype.updateDragIndicator = function(event) {
        var ref1, ref2;
        if ((ref1 = this.dragInd) != null) {
            ref1.classList.toggle('copy', event.shiftKey);
        }
        return (ref2 = this.dragInd) != null ? ref2.classList.toggle('move', event.ctrlKey || event.metaKey || event.altKey) : void 0;
    };

    Column.prototype.onDragStop = function(d, e) {
        var action, column, ref1, ref2, row, target;
        if (this.dragDiv != null) {
            this.dragDiv.remove();
            delete this.dragDiv;
            delete this.dragStartRow;
            if (row = this.browser.rowAtPos(d.pos)) {
                column = row.column;
                target = row.item.file;
            } else if (column = this.browser.columnAtPos(d.pos)) {
                target = (ref1 = column.parent) != null ? ref1.file : void 0;
            } else if (column = this.browser.columnAtX(d.pos.x)) {
                target = (ref2 = column.parent) != null ? ref2.file : void 0;
            } else {
                klog('no drop target');
                return;
            }
            action = e.shiftKey && 'copy' || 'move';
            if (column === this.browser.shelf) {
                if (target && (e.ctrlKey || e.shiftKey || e.metaKey || e.altKey)) {
                    return this.browser.dropAction(action, this.browser.select.files(), target);
                } else {
                    return this.browser.shelf.addFiles(this.browser.select.files(), {
                        pos: d.pos
                    });
                }
            } else {
                return this.browser.dropAction(action, this.browser.select.files(), target);
            }
        } else {
            this.focus({
                activate: false
            });
            if (row = this.row(e.target)) {
                if (row.isSelected()) {
                    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
                        if (this.toggle) {
                            delete this.toggle;
                            return this.browser.select.toggle(row);
                        }
                    } else {
                        if (this.deselect) {
                            delete this.deselect;
                            return this.browser.select.row(row);
                        } else {
                            return row.activate();
                        }
                    }
                }
            }
        }
    };

    Column.prototype.removeFile = function(file) {
        var row;
        if (row = this.row(slash.file(file))) {
            this.removeRow(row);
            return this.scroll.update();
        }
    };

    Column.prototype.insertFile = function(file) {
        var item, row;
        item = this.browser.fileItem(file);
        row = new Row(this, item);
        this.rows.push(row);
        return row;
    };

    Column.prototype.loadItems = function(items, parent) {
        var i, item, len, ref1;
        this.browser.clearColumn(this.index);
        this.items = items;
        this.parent = parent;
        this.crumb.setFile(this.parent.file);
        if (this.parent.type === void 0) {
            this.parent.type = slash.isDir(this.parent.file) && 'dir' || 'file';
        }
        if (this.parent == null) {
            kerror("no parent item?");
        }
        if (this.parent.type == null) {
            kerror("loadItems -- no parent type?", this.parent);
        }
        if (valid(this.items)) {
            ref1 = this.items;
            for (i = 0, len = ref1.length; i < len; i++) {
                item = ref1[i];
                this.rows.push(new Row(this, item));
            }
            this.scroll.update();
        }
        if (this.parent.type === 'dir' && slash.samePath('~/Downloads', this.parent.file)) {
            this.sortByDateAdded();
        }
        return this;
    };

    Column.prototype.unshiftItem = function(item) {
        this.items.unshift(item);
        this.rows.unshift(new Row(this, item));
        this.table.insertBefore(this.table.lastChild, this.table.firstChild);
        this.scroll.update();
        return this.rows[0];
    };

    Column.prototype.pushItem = function(item) {
        this.items.push(item);
        this.rows.push(new Row(this, item));
        this.scroll.update();
        return this.rows.slice(-1)[0];
    };

    Column.prototype.addItem = function(item) {
        var row;
        row = this.pushItem(item);
        this.sortByName();
        return row;
    };

    Column.prototype.setItems = function(items1, opt) {
        var i, item, len, ref1;
        this.items = items1;
        this.browser.clearColumn(this.index);
        this.parent = opt.parent;
        if (this.parent == null) {
            kerror("no parent item?");
        }
        if (this.parent.type == null) {
            kerror("setItems -- no parent type?", this.parent);
        }
        ref1 = this.items;
        for (i = 0, len = ref1.length; i < len; i++) {
            item = ref1[i];
            this.rows.push(new Row(this, item));
        }
        this.scroll.update();
        return this;
    };

    Column.prototype.isDir = function() {
        var ref1;
        return ((ref1 = this.parent) != null ? ref1.type : void 0) === 'dir';
    };

    Column.prototype.isFile = function() {
        var ref1;
        return ((ref1 = this.parent) != null ? ref1.type : void 0) === 'file';
    };

    Column.prototype.isEmpty = function() {
        return empty(this.parent);
    };

    Column.prototype.clear = function() {
        this.clearSearch();
        delete this.parent;
        this.div.scrollTop = 0;
        this.table.innerHTML = '';
        this.crumb.clear();
        this.rows = [];
        return this.scroll.update();
    };

    Column.prototype.activateRow = function(row) {
        var ref1;
        return (ref1 = this.row(row)) != null ? ref1.activate() : void 0;
    };

    Column.prototype.activeRow = function() {
        return _.find(this.rows, function(r) {
            return r.isActive();
        });
    };

    Column.prototype.activePath = function() {
        var ref1;
        return (ref1 = this.activeRow()) != null ? ref1.path() : void 0;
    };

    Column.prototype.row = function(row) {
        if (_.isNumber(row)) {
            return (0 <= row && row < this.numRows()) && this.rows[row] || null;
        } else if (_.isElement(row)) {
            return _.find(this.rows, function(r) {
                return r.div.contains(row);
            });
        } else if (_.isString(row)) {
            return _.find(this.rows, function(r) {
                return r.item.name === row || r.item.file === row;
            });
        } else {
            return row;
        }
    };

    Column.prototype.nextColumn = function() {
        return this.browser.column(this.index + 1);
    };

    Column.prototype.prevColumn = function() {
        return this.browser.column(this.index - 1);
    };

    Column.prototype.name = function() {
        return this.browser.name + ":" + this.index;
    };

    Column.prototype.path = function() {
        var ref1, ref2;
        return (ref1 = (ref2 = this.parent) != null ? ref2.file : void 0) != null ? ref1 : '';
    };

    Column.prototype.numRows = function() {
        var ref1;
        return (ref1 = this.rows.length) != null ? ref1 : 0;
    };

    Column.prototype.rowHeight = function() {
        var ref1, ref2;
        return (ref1 = (ref2 = this.rows[0]) != null ? ref2.div.clientHeight : void 0) != null ? ref1 : 0;
    };

    Column.prototype.numVisible = function() {
        return this.rowHeight() && parseInt(this.browser.height() / this.rowHeight()) || 0;
    };

    Column.prototype.rowAtPos = function(pos) {
        return this.row(this.rowIndexAtPos(pos));
    };

    Column.prototype.rowIndexAtPos = function(pos) {
        return Math.max(0, Math.floor((pos.y - this.div.getBoundingClientRect().top) / this.rowHeight()));
    };

    Column.prototype.hasFocus = function() {
        return this.div.classList.contains('focus');
    };

    Column.prototype.focus = function(opt) {
        if (opt == null) {
            opt = {};
        }
        if (!this.activeRow() && this.numRows() && (opt != null ? opt.activate : void 0) !== false) {
            this.rows[0].setActive();
        }
        this.div.focus();
        return this;
    };

    Column.prototype.onFocus = function() {
        return this.div.classList.add('focus');
    };

    Column.prototype.onBlur = function() {
        return this.div.classList.remove('focus');
    };

    Column.prototype.focusBrowser = function() {
        return this.browser.focus();
    };

    Column.prototype.onMouseOver = function(event) {
        var ref1;
        return (ref1 = this.row(event.target)) != null ? ref1.onMouseOver() : void 0;
    };

    Column.prototype.onMouseOut = function(event) {
        var ref1;
        return (ref1 = this.row(event.target)) != null ? ref1.onMouseOut() : void 0;
    };

    Column.prototype.onDblClick = function(event) {
        this.browser.skipOnDblClick = true;
        return this.navigateCols('enter');
    };

    Column.prototype.updateCrumb = function() {
        return this.crumb.updateRect(this.div.getBoundingClientRect());
    };

    Column.prototype.extendSelection = function(key) {
        var index, ref1, ref2, toIndex;
        if (!this.numRows()) {
            return console.error("no rows in column " + this.index + "?");
        }
        index = (ref1 = (ref2 = this.activeRow()) != null ? ref2.index() : void 0) != null ? ref1 : -1;
        if ((index == null) || Number.isNaN(index)) {
            console.error("no index from activeRow? " + index + "?", this.activeRow());
        }
        toIndex = (function() {
            switch (key) {
                case 'up':
                    return index - 1;
                case 'down':
                    return index + 1;
                case 'home':
                    return 0;
                case 'end':
                    return this.numRows() - 1;
                case 'page up':
                    return Math.max(0, index - this.numVisible());
                case 'page down':
                    return Math.min(this.numRows() - 1, index + this.numVisible());
                default:
                    return index;
            }
        }).call(this);
        return this.browser.select.to(this.row(toIndex), true);
    };

    Column.prototype.navigateRows = function(key) {
        var index, newIndex, ref1, ref2, ref3;
        if (!this.numRows()) {
            return console.error("no rows in column " + this.index + "?");
        }
        index = (ref1 = (ref2 = this.activeRow()) != null ? ref2.index() : void 0) != null ? ref1 : -1;
        if ((index == null) || Number.isNaN(index)) {
            console.error("no index from activeRow? " + index + "?", this.activeRow());
        }
        newIndex = (function() {
            switch (key) {
                case 'up':
                    return index - 1;
                case 'down':
                    return index + 1;
                case 'home':
                    return 0;
                case 'end':
                    return this.numRows() - 1;
                case 'page up':
                    return index - this.numVisible();
                case 'page down':
                    return index + this.numVisible();
                default:
                    return index;
            }
        }).call(this);
        if ((newIndex == null) || Number.isNaN(newIndex)) {
            console.error("no index " + newIndex + "? " + (this.numVisible()));
        }
        newIndex = clamp(0, this.numRows() - 1, newIndex);
        if (newIndex === index) {
            return;
        }
        if (((ref3 = this.rows[newIndex]) != null ? ref3.activate : void 0) == null) {
            console.error("no row at index " + newIndex + "/" + (this.numRows() - 1) + "?", this.numRows());
        }
        return this.browser.select.row(this.rows[newIndex]);
    };

    Column.prototype.navigateCols = function(key) {
        var item, ref1, type;
        switch (key) {
            case 'up':
                this.browser.navigate('up');
                break;
            case 'left':
                this.browser.navigate('left');
                break;
            case 'right':
                this.browser.navigate('right');
                break;
            case 'enter':
                if (item = (ref1 = this.activeRow()) != null ? ref1.item : void 0) {
                    type = item.type;
                    if (type === 'dir') {
                        this.browser.loadItem(item);
                    } else if (item.file) {
                        post.emit('openFile', item.file);
                    }
                }
        }
        return this;
    };

    Column.prototype.navigateRoot = function(key) {
        this.browser.browse((function() {
            switch (key) {
                case 'left':
                    return slash.dir(this.parent.file);
                case 'right':
                    return this.activeRow().item.file;
            }
        }).call(this));
        return this;
    };

    Column.prototype.doSearch = function(char) {
        if (!this.numRows()) {
            return;
        }
        if (!this.searchDiv) {
            this.searchDiv = elem({
                "class": 'browserSearch'
            });
        }
        return this.setSearch(this.search + char);
    };

    Column.prototype.backspaceSearch = function() {
        if (this.searchDiv && this.search.length) {
            return this.setSearch(this.search.slice(0, this.search.length - 1));
        }
    };

    Column.prototype.setSearch = function(search) {
        var activeIndex, fuzzied, i, len, ref1, ref2, ref3, row, rows;
        this.search = search;
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(this.clearSearch, 2000);
        this.searchDiv.textContent = this.search;
        activeIndex = (ref1 = (ref2 = this.activeRow()) != null ? ref2.index() : void 0) != null ? ref1 : 0;
        if (this.search.length === 1) {
            activeIndex += 1;
        }
        if (activeIndex >= this.numRows()) {
            activeIndex = 0;
        }
        ref3 = [this.rows.slice(activeIndex), this.rows.slice(0, activeIndex + 1)];
        for (i = 0, len = ref3.length; i < len; i++) {
            rows = ref3[i];
            fuzzied = fuzzy.filter(this.search, rows, {
                extract: function(r) {
                    return r.item.name;
                }
            });
            if (fuzzied.length) {
                row = fuzzied[0].original;
                row.div.appendChild(this.searchDiv);
                row.activate();
                break;
            }
        }
        return this;
    };

    Column.prototype.clearSearch = function() {
        var ref1;
        this.search = '';
        if ((ref1 = this.searchDiv) != null) {
            ref1.remove();
        }
        delete this.searchDiv;
        return this;
    };

    Column.prototype.removeObject = function() {
        var nextOrPrev, ref1, row;
        if (row = this.activeRow()) {
            nextOrPrev = (ref1 = row.next()) != null ? ref1 : row.prev();
            this.removeRow(row);
            if (nextOrPrev != null) {
                nextOrPrev.activate();
            }
        }
        return this;
    };

    Column.prototype.removeRow = function(row) {
        var ref1, ref2, ref3;
        if (row === this.activeRow()) {
            if (((ref1 = this.nextColumn()) != null ? (ref2 = ref1.parent) != null ? ref2.file : void 0 : void 0) === ((ref3 = row.item) != null ? ref3.file : void 0)) {
                this.browser.clearColumnsFrom(this.index + 1);
            }
        }
        row.div.remove();
        this.items.splice(row.index(), 1);
        return this.rows.splice(row.index(), 1);
    };

    Column.prototype.sortByName = function() {
        var i, len, ref1, row;
        this.rows.sort(function(a, b) {
            return (a.item.type + a.item.name).localeCompare(b.item.type + b.item.name);
        });
        this.table.innerHTML = '';
        ref1 = this.rows;
        for (i = 0, len = ref1.length; i < len; i++) {
            row = ref1[i];
            this.table.appendChild(row.div);
        }
        return this;
    };

    Column.prototype.sortByType = function() {
        var i, len, ref1, row;
        this.rows.sort(function(a, b) {
            var atype, btype;
            atype = a.item.type === 'file' && slash.ext(a.item.name) || '___';
            btype = b.item.type === 'file' && slash.ext(b.item.name) || '___';
            return (a.item.type + atype + a.item.name).localeCompare(b.item.type + btype + b.item.name, void 0, {
                numeric: true
            });
        });
        this.table.innerHTML = '';
        ref1 = this.rows;
        for (i = 0, len = ref1.length; i < len; i++) {
            row = ref1[i];
            this.table.appendChild(row.div);
        }
        return this;
    };

    Column.prototype.sortByDateAdded = function() {
        var i, len, ref1, row;
        this.rows.sort(function(a, b) {
            var ref1, ref2;
            return ((ref1 = b.item.stat) != null ? ref1.atimeMs : void 0) - ((ref2 = a.item.stat) != null ? ref2.atimeMs : void 0);
        });
        this.table.innerHTML = '';
        ref1 = this.rows;
        for (i = 0, len = ref1.length; i < len; i++) {
            row = ref1[i];
            this.table.appendChild(row.div);
        }
        return this;
    };

    Column.prototype.toggleDotFiles = function() {
        var stateKey;
        if (this.parent.type === void 0) {
            this.parent.type = slash.isDir(this.parent.file) && 'dir' || 'file';
        }
        if (this.parent.type === 'dir') {
            stateKey = "browser▸showHidden▸" + this.parent.file;
            if (prefs.get(stateKey)) {
                prefs.del(stateKey);
            } else {
                prefs.set(stateKey, true);
            }
            this.browser.loadDirItem(this.parent, this.index, {
                ignoreCache: true
            });
        }
        return this;
    };

    Column.prototype.moveToTrash = function() {
        var i, index, len, ref1, row, selectRow;
        index = this.browser.select.freeIndex();
        if (index >= 0) {
            selectRow = this.row(index);
        }
        ref1 = this.browser.select.rows;
        for (i = 0, len = ref1.length; i < len; i++) {
            row = ref1[i];
            wxw('trash', row.path());
            this.removeRow(row);
        }
        if (selectRow) {
            return this.browser.select.row(selectRow);
        } else {
            return this.navigateCols('left');
        }
    };

    Column.prototype.addToShelf = function() {
        var pathToShelf;
        if (pathToShelf = this.activePath()) {
            return post.emit('addToShelf', pathToShelf);
        }
    };

    Column.prototype.openViewer = function() {
        var path, ref1, ref2;
        if (((ref1 = this.activeRow()) != null ? ref1.item.name : void 0) !== '..' && slash.isDir(this.activePath())) {
            path = this.activePath();
        } else {
            path = (ref2 = this.activeRow()) != null ? ref2.item.file : void 0;
            if (File.isText(path)) {
                this.browser.viewer = new Editor(this.browser, path);
                return;
            }
            if (!File.isImage(path)) {
                path = this.path();
            }
        }
        return this.browser.viewer = new Viewer(this.browser, path);
    };

    Column.prototype.newFolder = function() {
        var unused;
        unused = require('unused-filename');
        return unused(slash.join(this.path(), 'New folder')).then((function(_this) {
            return function(newDir) {
                return fs.mkdir(newDir, function(err) {
                    var row;
                    if (empty(err)) {
                        row = _this.insertFile(newDir);
                        _this.browser.select.row(row);
                        return row.editName();
                    }
                });
            };
        })(this));
    };

    Column.prototype.duplicateFile = function() {
        var file, i, len, ref1, results;
        ref1 = this.browser.select.files();
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            file = ref1[i];
            results.push(File.duplicate(file, (function(_this) {
                return function(source, target) {
                    return _this.browser.select.row(_this.insertFile(target));
                };
            })(this)));
        }
        return results;
    };

    Column.prototype.explorer = function() {
        return open(slash.dir(this.activePath()));
    };

    Column.prototype.open = function() {
        return open(this.activePath());
    };

    Column.prototype.makeRoot = function() {
        this.browser.shiftColumnsTo(this.index);
        if (this.browser.columns[0].items[0].name !== '..') {
            this.unshiftItem({
                name: '..',
                type: 'dir',
                file: slash.dir(this.parent.file)
            });
        }
        return this.crumb.setFile(this.parent.file);
    };

    Column.prototype.onContextMenu = function(event, column) {
        var absPos, opt;
        stopEvent(event);
        absPos = kpos(event);
        if (!column) {
            return this.showContextMenu(absPos);
        } else {
            opt = {
                items: [
                    {
                        text: 'Root',
                        cb: this.makeRoot
                    }, {
                        text: 'Add to Shelf',
                        combo: 'alt+shift+.',
                        cb: (function(_this) {
                            return function() {
                                return post.emit('addToShelf', _this.parent.file);
                            };
                        })(this)
                    }, {
                        text: 'Explorer',
                        combo: 'alt+e',
                        cb: (function(_this) {
                            return function() {
                                return open(_this.parent.file);
                            };
                        })(this)
                    }
                ]
            };
            opt.x = absPos.x;
            opt.y = absPos.y;
            return popup.menu(opt);
        }
    };

    Column.prototype.showContextMenu = function(absPos) {
        var opt;
        if (absPos == null) {
            absPos = kpos(this.div.getBoundingClientRect().left, this.div.getBoundingClientRect().top);
        }
        opt = {
            items: [
                {
                    text: 'Open',
                    combo: 'return alt+o',
                    cb: this.open
                }, {
                    text: 'Viewer',
                    combo: 'space alt+v',
                    cb: this.openViewer
                }, {
                    text: 'Explorer',
                    combo: 'alt+e',
                    cb: this.explorer
                }, {
                    text: ''
                }, {
                    text: 'Duplicate',
                    combo: 'ctrl+d',
                    cb: this.duplicateFile
                }, {
                    text: 'New Folder',
                    combo: 'alt+n',
                    cb: this.newFolder
                }, {
                    text: ''
                }, {
                    text: 'Add to Shelf',
                    combo: 'alt+shift+.',
                    cb: this.addToShelf
                }, {
                    text: ''
                }, {
                    text: 'Move to Trash',
                    combo: 'ctrl+backspace',
                    cb: this.moveToTrash
                }, {
                    text: ''
                }, {
                    text: 'Sort',
                    menu: [
                        {
                            text: 'By Name',
                            combo: 'ctrl+n',
                            cb: this.sortByName
                        }, {
                            text: 'By Type',
                            combo: 'ctrl+t',
                            cb: this.sortByType
                        }, {
                            text: 'By Date',
                            combo: 'ctrl+a',
                            cb: this.sortByDateAdded
                        }
                    ]
                }
            ]
        };
        opt.items = opt.items.concat(window.titlebar.makeTemplate(require('./menu.json')));
        opt.x = absPos.x;
        opt.y = absPos.y;
        return popup.menu(opt);
    };

    Column.prototype.onKey = function(event) {
        var char, combo, key, mod, ref1, ref2;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo, char = ref1.char;
        switch (combo) {
            case 'shift+`':
            case '~':
                return stopEvent(event, this.browser.browse('~'));
            case '/':
                return stopEvent(event, this.browser.browse('/'));
            case 'alt+shift+.':
                return stopEvent(event, this.addToShelf());
            case 'alt+e':
                return this.explorer();
            case 'alt+o':
                return this.open();
            case 'alt+n':
                return this.newFolder();
            case 'space':
            case 'alt+v':
                return this.openViewer();
            case 'shift+up':
            case 'shift+down':
            case 'shift+home':
            case 'shift+end':
            case 'shift+page up':
            case 'shift+page down':
                return stopEvent(event, this.extendSelection(key));
            case 'page up':
            case 'page down':
            case 'home':
            case 'end':
                return stopEvent(event, this.navigateRows(key));
            case 'command+up':
            case 'ctrl+up':
                return stopEvent(event, this.navigateRows('home'));
            case 'command+down':
            case 'ctrl+down':
                return stopEvent(event, this.navigateRows('end'));
            case 'enter':
            case 'alt+up':
                return stopEvent(event, this.navigateCols(key));
            case 'backspace':
                return stopEvent(event, this.browser.onBackspaceInColumn(this));
            case 'delete':
                return stopEvent(event, this.browser.onDeleteInColumn(this));
            case 'ctrl+t':
                return stopEvent(event, this.sortByType());
            case 'ctrl+n':
                return stopEvent(event, this.sortByName());
            case 'ctrl+a':
                return stopEvent(event, this.sortByDateAdded());
            case 'command+i':
            case 'ctrl+i':
                return stopEvent(event, this.toggleDotFiles());
            case 'command+d':
            case 'ctrl+d':
                return stopEvent(event, this.duplicateFile());
            case 'command+k':
            case 'ctrl+k':
                if (this.browser.cleanUp()) {
                    return stopEvent(event);
                }
                break;
            case 'f2':
                return stopEvent(event, (ref2 = this.activeRow()) != null ? ref2.editName() : void 0);
            case 'command+left':
            case 'command+right':
            case 'ctrl+left':
            case 'ctrl+right':
                return stopEvent(event, this.navigateRoot(key));
            case 'command+backspace':
            case 'ctrl+backspace':
            case 'command+delete':
            case 'ctrl+delete':
                return stopEvent(event, this.moveToTrash());
            case 'tab':
                if (this.search.length) {
                    this.doSearch('');
                }
                return stopEvent(event);
            case 'esc':
                if (this.dragDiv) {
                    this.dragDiv.drag.dragStop();
                    this.dragDiv.remove();
                    delete this.dragDiv;
                } else if (this.browser.select.files().length > 1) {
                    this.browser.select.row(this.activeRow());
                } else if (this.search.length) {
                    this.clearSearch();
                }
                return stopEvent(event);
        }
        if (combo === 'up' || combo === 'down') {
            return stopEvent(event, this.navigateRows(key));
        }
        if (combo === 'left' || combo === 'right') {
            return stopEvent(event, this.navigateCols(key));
        }
        if ((mod === 'shift' || mod === '') && char) {
            this.doSearch(char);
        }
        if (this.dragDiv) {
            return this.updateDragIndicator(event);
        }
    };

    Column.prototype.onKeyUp = function(event) {
        if (this.dragDiv) {
            return this.updateDragIndicator(event);
        }
    };

    return Column;

})();

module.exports = Column;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sdW1uLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpTUFBQTtJQUFBOztBQVFBLE1BQW1JLE9BQUEsQ0FBUSxLQUFSLENBQW5JLEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUseUJBQWYsRUFBMEIsdUJBQTFCLEVBQW9DLHFCQUFwQyxFQUE2QyxpQkFBN0MsRUFBb0QsaUJBQXBELEVBQTJELGlCQUEzRCxFQUFrRSxpQkFBbEUsRUFBeUUsaUJBQXpFLEVBQWdGLGVBQWhGLEVBQXNGLGVBQXRGLEVBQTRGLGVBQTVGLEVBQWtHLGVBQWxHLEVBQXdHLFdBQXhHLEVBQTRHLGVBQTVHLEVBQWtILG1CQUFsSCxFQUEwSCxTQUExSCxFQUE2SDs7QUFFN0gsR0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsa0JBQVI7O0FBQ1gsSUFBQSxHQUFXLE9BQUEsQ0FBUSxjQUFSOztBQUNYLE1BQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxTQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFDWCxHQUFBLEdBQVcsT0FBQSxDQUFRLEtBQVI7O0FBRUw7SUFFQyxnQkFBQyxPQUFEO0FBRUMsWUFBQTtRQUZBLElBQUMsQ0FBQSxVQUFEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7UUFFQSxJQUFDLENBQUEsV0FBRCxHQUFlO1FBQ2YsSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxLQUFELEdBQVU7UUFDVixJQUFDLENBQUEsSUFBRCxHQUFVO1FBRVYsSUFBQyxDQUFBLEdBQUQsR0FBUyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGVBQVA7WUFBdUIsUUFBQSxFQUFTLENBQWhDO1NB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ICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIHByZWZzLCBzdG9wRXZlbnQsIHNldFN0eWxlLCBrZXlpbmZvLCBwb3B1cCwgc2xhc2gsIHZhbGlkLCBjbGFtcCwgZW1wdHksIGRyYWcsIG9wZW4sIGVsZW0sIGtwb3MsIGZzLCBrbG9nLCBrZXJyb3IsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuUm93ICAgICAgPSByZXF1aXJlICcuL3JvdydcblNjcm9sbGVyID0gcmVxdWlyZSAnLi90b29scy9zY3JvbGxlcidcbkZpbGUgICAgID0gcmVxdWlyZSAnLi90b29scy9maWxlJ1xuVmlld2VyICAgPSByZXF1aXJlICcuL3ZpZXdlcidcbkVkaXRvciAgID0gcmVxdWlyZSAnLi9lZGl0b3InXG5DcnVtYiAgICA9IHJlcXVpcmUgJy4vY3J1bWInXG5mdXp6eSAgICA9IHJlcXVpcmUgJ2Z1enp5J1xud3h3ICAgICAgPSByZXF1aXJlICd3eHcnXG5cbmNsYXNzIENvbHVtblxuICAgIFxuICAgIEA6IChAYnJvd3NlcikgLT5cbiAgICAgICAgXG4gICAgICAgIEBzZWFyY2hUaW1lciA9IG51bGxcbiAgICAgICAgQHNlYXJjaCA9ICcnXG4gICAgICAgIEBpdGVtcyAgPSBbXVxuICAgICAgICBAcm93cyAgID0gW11cbiAgICAgICAgXG4gICAgICAgIEBkaXYgICA9IGVsZW0gY2xhc3M6ICdicm93c2VyQ29sdW1uJyB0YWJJbmRleDo2XG4gICAgICAgIEB0YWJsZSA9IGVsZW0gY2xhc3M6ICdicm93c2VyQ29sdW1uVGFibGUnXG4gICAgICAgIEBkaXYuYXBwZW5kQ2hpbGQgQHRhYmxlXG4gICAgICAgIFxuICAgICAgICBAc2V0SW5kZXggQGJyb3dzZXIuY29sdW1ucz8ubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5jb2xzPy5hcHBlbmRDaGlsZCBAZGl2XG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2ZvY3VzJyAgICAgQG9uRm9jdXNcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdibHVyJyAgICAgIEBvbkJsdXJcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJyAgIEBvbktleVxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2tleXVwJyAgICAgQG9uS2V5VXBcbiAgICAgICAgXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2VvdmVyJyBAb25Nb3VzZU92ZXJcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdtb3VzZW91dCcgIEBvbk1vdXNlT3V0XG5cbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdkYmxjbGljaycgIEBvbkRibENsaWNrXG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2NvbnRleHRtZW51JyBAb25Db250ZXh0TWVudVxuICBcbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQGRpdlxuICAgICAgICAgICAgb25TdGFydDogQG9uRHJhZ1N0YXJ0XG4gICAgICAgICAgICBvbk1vdmU6ICBAb25EcmFnTW92ZVxuICAgICAgICAgICAgb25TdG9wOiAgQG9uRHJhZ1N0b3BcbiAgICAgICAgXG4gICAgICAgIEBjcnVtYiAgPSBuZXcgQ3J1bWIgQFxuICAgICAgICBAc2Nyb2xsID0gbmV3IFNjcm9sbGVyIEBcbiAgICAgICAgXG4gICAgc2V0SW5kZXg6IChAaW5kZXgpIC0+XG4gICAgICAgIFxuICAgICAgICBAY3J1bWI/LmVsZW0uY29sdW1uSW5kZXggPSBAaW5kZXhcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBvbkRyYWdTdGFydDogKGQsIGUpID0+IFxuICAgIFxuICAgICAgICBAZHJhZ1N0YXJ0Um93ID0gQHJvdyBlLnRhcmdldFxuICAgICAgICBcbiAgICAgICAgZGVsZXRlIEB0b2dnbGVcbiAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnU3RhcnRSb3dcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZS5zaGlmdEtleVxuICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC50byBAZHJhZ1N0YXJ0Um93XG4gICAgICAgICAgICBlbHNlIGlmIGUubWV0YUtleSBvciBlLmFsdEtleSBvciBlLmN0cmxLZXlcbiAgICAgICAgICAgICAgICBpZiBub3Qgcm93LmlzU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3QudG9nZ2xlIEBkcmFnU3RhcnRSb3dcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEB0b2dnbGUgPSB0cnVlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgQGRyYWdTdGFydFJvdy5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgICAgICAgICAgQGRlc2VsZWN0ID0gdHJ1ZVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGFjdGl2ZVJvdygpPy5jbGVhckFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQGRyYWdTdGFydFJvdywgZmFsc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGhhc0ZvY3VzKClcbiAgICAgICAgICAgICAgICBpZiBAYWN0aXZlUm93KCkgPyBAYnJvd3Nlci5zZWxlY3QuYWN0aXZlXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQGFjdGl2ZVJvdygpID8gQGJyb3dzZXIuc2VsZWN0LmFjdGl2ZVxuXG4gICAgb25EcmFnTW92ZTogKGQsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnU3RhcnRSb3cgYW5kIG5vdCBAZHJhZ0RpdiBhbmQgdmFsaWQgQGJyb3dzZXIuc2VsZWN0LmZpbGVzKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGlmIE1hdGguYWJzKGQuZGVsdGFTdW0ueCkgPCAyMCBhbmQgTWF0aC5hYnMoZC5kZWx0YVN1bS55KSA8IDEwXG5cbiAgICAgICAgICAgIGRlbGV0ZSBAdG9nZ2xlIFxuICAgICAgICAgICAgZGVsZXRlIEBkZXNlbGVjdFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZHJhZ0RpdiA9IGVsZW0gJ2RpdidcbiAgICAgICAgICAgIEBkcmFnRGl2LmRyYWcgPSBkXG4gICAgICAgICAgICBwb3MgPSBrcG9zIGUucGFnZVgsIGUucGFnZVlcbiAgICAgICAgICAgIHJvdyA9IEBicm93c2VyLnNlbGVjdC5yb3dzWzBdXG4gICAgICAgICAgICBiciAgPSByb3cuZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUub3BhY2l0eSAgPSBcIjAuN1wiXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS50b3AgID0gXCIje3Bvcy55LWQuZGVsdGFTdW0ueX1weFwiXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5sZWZ0ID0gXCIje3Bvcy54LWQuZGVsdGFTdW0ueH1weFwiXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS53aWR0aCA9IFwiI3tici53aWR0aC0xMn1weFwiXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBkcmFnSW5kID0gZWxlbSBjbGFzczonZHJhZ0luZGljYXRvcidcbiAgICAgICAgICAgIEBkcmFnRGl2LmFwcGVuZENoaWxkIEBkcmFnSW5kXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciByb3cgaW4gQGJyb3dzZXIuc2VsZWN0LnJvd3NcbiAgICAgICAgICAgICAgICByb3dDbG9uZSA9IHJvdy5kaXYuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgICAgICAgICByb3dDbG9uZS5zdHlsZS5mbGV4ID0gJ3Vuc2V0J1xuICAgICAgICAgICAgICAgIHJvd0Nsb25lLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSdcbiAgICAgICAgICAgICAgICByb3dDbG9uZS5zdHlsZS5ib3JkZXIgPSAnbm9uZSdcbiAgICAgICAgICAgICAgICByb3dDbG9uZS5zdHlsZS5tYXJnaW5Cb3R0b20gPSAnLTFweCdcbiAgICAgICAgICAgICAgICBAZHJhZ0Rpdi5hcHBlbmRDaGlsZCByb3dDbG9uZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCBAZHJhZ0RpdlxuICAgICAgICAgICAgQGZvY3VzIGFjdGl2YXRlOmZhbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQHVwZGF0ZURyYWdJbmRpY2F0b3IgZSAgICAgIFxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGVYKCN7ZC5kZWx0YVN1bS54fXB4KSB0cmFuc2xhdGVZKCN7ZC5kZWx0YVN1bS55fXB4KVwiXG5cbiAgICB1cGRhdGVEcmFnSW5kaWNhdG9yOiAoZXZlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICBAZHJhZ0luZD8uY2xhc3NMaXN0LnRvZ2dsZSAnY29weScgZXZlbnQuc2hpZnRLZXlcbiAgICAgICAgQGRyYWdJbmQ/LmNsYXNzTGlzdC50b2dnbGUgJ21vdmUnIGV2ZW50LmN0cmxLZXkgb3IgZXZlbnQubWV0YUtleSBvciBldmVudC5hbHRLZXlcbiAgICAgICAgICAgIFxuICAgIG9uRHJhZ1N0b3A6IChkLGUpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0Rpdj9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGRyYWdEaXYucmVtb3ZlKClcbiAgICAgICAgICAgIGRlbGV0ZSBAZHJhZ0RpdlxuICAgICAgICAgICAgZGVsZXRlIEBkcmFnU3RhcnRSb3dcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcm93ID0gQGJyb3dzZXIucm93QXRQb3MgZC5wb3NcbiAgICAgICAgICAgICAgICBjb2x1bW4gPSByb3cuY29sdW1uXG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gcm93Lml0ZW0uZmlsZVxuICAgICAgICAgICAgZWxzZSBpZiBjb2x1bW4gPSBAYnJvd3Nlci5jb2x1bW5BdFBvcyBkLnBvc1xuICAgICAgICAgICAgICAgIHRhcmdldCA9IGNvbHVtbi5wYXJlbnQ/LmZpbGVcbiAgICAgICAgICAgIGVsc2UgaWYgY29sdW1uID0gQGJyb3dzZXIuY29sdW1uQXRYIGQucG9zLnhcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSBjb2x1bW4ucGFyZW50Py5maWxlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAga2xvZyAnbm8gZHJvcCB0YXJnZXQnXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBhY3Rpb24gPSBlLnNoaWZ0S2V5IGFuZCAnY29weScgb3IgJ21vdmUnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBjb2x1bW4gPT0gQGJyb3dzZXIuc2hlbGYgXG4gICAgICAgICAgICAgICAgaWYgdGFyZ2V0IGFuZCAoZS5jdHJsS2V5IG9yIGUuc2hpZnRLZXkgb3IgZS5tZXRhS2V5IG9yIGUuYWx0S2V5KVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5kcm9wQWN0aW9uIGFjdGlvbiwgQGJyb3dzZXIuc2VsZWN0LmZpbGVzKCksIHRhcmdldFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2hlbGYuYWRkRmlsZXMgQGJyb3dzZXIuc2VsZWN0LmZpbGVzKCksIHBvczpkLnBvc1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBicm93c2VyLmRyb3BBY3Rpb24gYWN0aW9uLCBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKSwgdGFyZ2V0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGZvY3VzIGFjdGl2YXRlOmZhbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHJvdyA9IEByb3cgZS50YXJnZXRcbiAgICAgICAgICAgICAgICBpZiByb3cuaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgICAgIGlmIGUubWV0YUtleSBvciBlLmFsdEtleSBvciBlLmN0cmxLZXkgb3IgZS5zaGlmdEtleVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQHRvZ2dsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBAdG9nZ2xlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnRvZ2dsZSByb3dcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQGRlc2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEBkZXNlbGVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgcm93XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIHJlbW92ZUZpbGU6IChmaWxlKSA9PiBcbiAgICAgICAgXG4gICAgICAgIGlmIHJvdyA9IEByb3cgc2xhc2guZmlsZSBmaWxlXG4gICAgICAgICAgICBAcmVtb3ZlUm93IHJvd1xuICAgICAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICAgICAgXG4gICAgaW5zZXJ0RmlsZTogKGZpbGUpID0+IFxuXG4gICAgICAgIGl0ZW0gPSBAYnJvd3Nlci5maWxlSXRlbSBmaWxlXG4gICAgICAgIHJvdyA9IG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBAcm93cy5wdXNoIHJvd1xuICAgICAgICByb3dcbiAgICBcbiAgICBsb2FkSXRlbXM6IChpdGVtcywgcGFyZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW4gQGluZGV4XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMgID0gaXRlbXNcbiAgICAgICAgQHBhcmVudCA9IHBhcmVudFxuICAgICAgICBcbiAgICAgICAgQGNydW1iLnNldEZpbGUgQHBhcmVudC5maWxlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSB1bmRlZmluZWRcbiAgICAgICAgICAgIEBwYXJlbnQudHlwZSA9IHNsYXNoLmlzRGlyKEBwYXJlbnQuZmlsZSkgYW5kICdkaXInIG9yICdmaWxlJ1xuICAgICAgICBcbiAgICAgICAga2Vycm9yIFwibm8gcGFyZW50IGl0ZW0/XCIgaWYgbm90IEBwYXJlbnQ/XG4gICAgICAgIGtlcnJvciBcImxvYWRJdGVtcyAtLSBubyBwYXJlbnQgdHlwZT9cIiwgQHBhcmVudCBpZiBub3QgQHBhcmVudC50eXBlP1xuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgQGl0ZW1zXG4gICAgICAgICAgICBmb3IgaXRlbSBpbiBAaXRlbXNcbiAgICAgICAgICAgICAgICBAcm93cy5wdXNoIG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBcbiAgICAgICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgPT0gJ2RpcicgYW5kIHNsYXNoLnNhbWVQYXRoICd+L0Rvd25sb2FkcycgQHBhcmVudC5maWxlXG4gICAgICAgICAgICBAc29ydEJ5RGF0ZUFkZGVkKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICB1bnNoaWZ0SXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMudW5zaGlmdCBpdGVtXG4gICAgICAgIEByb3dzLnVuc2hpZnQgbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIEB0YWJsZS5pbnNlcnRCZWZvcmUgQHRhYmxlLmxhc3RDaGlsZCwgQHRhYmxlLmZpcnN0Q2hpbGRcbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAcm93c1swXVxuICAgICAgICBcbiAgICBwdXNoSXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMucHVzaCBpdGVtXG4gICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgQHJvd3NbLTFdXG4gICAgICAgIFxuICAgIGFkZEl0ZW06IChpdGVtKSAtPlxuICAgICAgICBcbiAgICAgICAgcm93ID0gQHB1c2hJdGVtIGl0ZW1cbiAgICAgICAgQHNvcnRCeU5hbWUoKVxuICAgICAgICByb3dcblxuICAgIHNldEl0ZW1zOiAoQGl0ZW1zLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5jbGVhckNvbHVtbiBAaW5kZXhcbiAgICAgICAgXG4gICAgICAgIEBwYXJlbnQgPSBvcHQucGFyZW50XG4gICAgICAgIGtlcnJvciBcIm5vIHBhcmVudCBpdGVtP1wiIGlmIG5vdCBAcGFyZW50P1xuICAgICAgICBrZXJyb3IgXCJzZXRJdGVtcyAtLSBubyBwYXJlbnQgdHlwZT9cIiwgQHBhcmVudCBpZiBub3QgQHBhcmVudC50eXBlP1xuICAgICAgICBcbiAgICAgICAgZm9yIGl0ZW0gaW4gQGl0ZW1zXG4gICAgICAgICAgICBAcm93cy5wdXNoIG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBcbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAXG5cbiAgICBpc0RpcjogIC0+IEBwYXJlbnQ/LnR5cGUgPT0gJ2RpcicgXG4gICAgaXNGaWxlOiAtPiBAcGFyZW50Py50eXBlID09ICdmaWxlJyBcbiAgICAgICAgXG4gICAgaXNFbXB0eTogLT4gZW1wdHkgQHBhcmVudFxuICAgIGNsZWFyOiAgIC0+XG4gICAgICAgIEBjbGVhclNlYXJjaCgpXG4gICAgICAgIGRlbGV0ZSBAcGFyZW50XG4gICAgICAgIEBkaXYuc2Nyb2xsVG9wID0gMFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgQGNydW1iLmNsZWFyKClcbiAgICAgICAgQHJvd3MgPSBbXVxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIFxuICAgXG4gICAgYWN0aXZhdGVSb3c6IChyb3cpIC0+IEByb3cocm93KT8uYWN0aXZhdGUoKVxuICAgICAgIFxuICAgIGFjdGl2ZVJvdzogLT4gXy5maW5kIEByb3dzLCAocikgLT4gci5pc0FjdGl2ZSgpXG4gICAgYWN0aXZlUGF0aDogLT4gQGFjdGl2ZVJvdygpPy5wYXRoKClcbiAgICBcbiAgICByb3c6IChyb3cpIC0+ICMgYWNjZXB0cyBlbGVtZW50LCBpbmRleCwgc3RyaW5nIG9yIHJvd1xuICAgICAgICBpZiAgICAgIF8uaXNOdW1iZXIgIHJvdyB0aGVuIHJldHVybiAwIDw9IHJvdyA8IEBudW1Sb3dzKCkgYW5kIEByb3dzW3Jvd10gb3IgbnVsbFxuICAgICAgICBlbHNlIGlmIF8uaXNFbGVtZW50IHJvdyB0aGVuIHJldHVybiBfLmZpbmQgQHJvd3MsIChyKSAtPiByLmRpdi5jb250YWlucyByb3dcbiAgICAgICAgZWxzZSBpZiBfLmlzU3RyaW5nICByb3cgdGhlbiByZXR1cm4gXy5maW5kIEByb3dzLCAocikgLT4gci5pdGVtLm5hbWUgPT0gcm93IG9yIHIuaXRlbS5maWxlID09IHJvd1xuICAgICAgICBlbHNlIHJldHVybiByb3dcbiAgICAgICAgICAgIFxuICAgIG5leHRDb2x1bW46IC0+IEBicm93c2VyLmNvbHVtbiBAaW5kZXgrMVxuICAgIHByZXZDb2x1bW46IC0+IEBicm93c2VyLmNvbHVtbiBAaW5kZXgtMVxuICAgICAgICBcbiAgICBuYW1lOiAtPiBcIiN7QGJyb3dzZXIubmFtZX06I3tAaW5kZXh9XCJcbiAgICBwYXRoOiAtPiBAcGFyZW50Py5maWxlID8gJydcbiAgICAgICAgXG4gICAgbnVtUm93czogICAgLT4gQHJvd3MubGVuZ3RoID8gMCAgIFxuICAgIHJvd0hlaWdodDogIC0+IEByb3dzWzBdPy5kaXYuY2xpZW50SGVpZ2h0ID8gMFxuICAgIG51bVZpc2libGU6IC0+IEByb3dIZWlnaHQoKSBhbmQgcGFyc2VJbnQoQGJyb3dzZXIuaGVpZ2h0KCkgLyBAcm93SGVpZ2h0KCkpIG9yIDBcbiAgICBcbiAgICByb3dBdFBvczogKHBvcykgLT4gQHJvdyBAcm93SW5kZXhBdFBvcyBwb3NcbiAgICBcbiAgICByb3dJbmRleEF0UG9zOiAocG9zKSAtPlxuICAgICAgICBcbiAgICAgICAgTWF0aC5tYXggMCwgTWF0aC5mbG9vciAocG9zLnkgLSBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCkgLyBAcm93SGVpZ2h0KClcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBoYXNGb2N1czogLT4gQGRpdi5jbGFzc0xpc3QuY29udGFpbnMgJ2ZvY3VzJ1xuXG4gICAgZm9jdXM6IChvcHQ9e30pIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAYWN0aXZlUm93KCkgYW5kIEBudW1Sb3dzKCkgYW5kIG9wdD8uYWN0aXZhdGUgIT0gZmFsc2VcbiAgICAgICAgICAgIEByb3dzWzBdLnNldEFjdGl2ZSgpXG4gICAgICAgIEBkaXYuZm9jdXMoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgIG9uRm9jdXM6ID0+IEBkaXYuY2xhc3NMaXN0LmFkZCAnZm9jdXMnXG4gICAgb25CbHVyOiAgPT4gQGRpdi5jbGFzc0xpc3QucmVtb3ZlICdmb2N1cydcblxuICAgIGZvY3VzQnJvd3NlcjogLT4gQGJyb3dzZXIuZm9jdXMoKVxuICAgIFxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgb25Nb3VzZU92ZXI6IChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5vbk1vdXNlT3ZlcigpXG4gICAgb25Nb3VzZU91dDogIChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5vbk1vdXNlT3V0KClcbiAgICBcbiAgICBvbkRibENsaWNrOiAgKGV2ZW50KSA9PiBcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnNraXBPbkRibENsaWNrID0gdHJ1ZVxuICAgICAgICBAbmF2aWdhdGVDb2xzICdlbnRlcidcbiAgICBcbiAgICB1cGRhdGVDcnVtYjogPT4gQGNydW1iLnVwZGF0ZVJlY3QgQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICBcbiAgICBleHRlbmRTZWxlY3Rpb246IChrZXkpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZXJyb3IgXCJubyByb3dzIGluIGNvbHVtbiAje0BpbmRleH0/XCIgaWYgbm90IEBudW1Sb3dzKCkgICAgICAgIFxuICAgICAgICBpbmRleCA9IEBhY3RpdmVSb3coKT8uaW5kZXgoKSA/IC0xXG4gICAgICAgIGVycm9yIFwibm8gaW5kZXggZnJvbSBhY3RpdmVSb3c/ICN7aW5kZXh9P1wiLCBAYWN0aXZlUm93KCkgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXhcbiAgICAgICAgICAgIFxuICAgICAgICB0b0luZGV4ID0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIGluZGV4LTFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiBpbmRleCsxXG4gICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gMFxuICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIEBudW1Sb3dzKCktMVxuICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcgICB0aGVuIE1hdGgubWF4IDAsIGluZGV4LUBudW1WaXNpYmxlKClcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgZG93bicgdGhlbiBNYXRoLm1pbiBAbnVtUm93cygpLTEsIGluZGV4K0BudW1WaXNpYmxlKClcbiAgICAgICAgICAgIGVsc2UgaW5kZXhcbiAgICBcbiAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnRvIEByb3codG9JbmRleCksIHRydWVcbiAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG5cbiAgICBuYXZpZ2F0ZVJvd3M6IChrZXkpIC0+XG5cbiAgICAgICAgcmV0dXJuIGVycm9yIFwibm8gcm93cyBpbiBjb2x1bW4gI3tAaW5kZXh9P1wiIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gLTFcbiAgICAgICAgZXJyb3IgXCJubyBpbmRleCBmcm9tIGFjdGl2ZVJvdz8gI3tpbmRleH0/XCIsIEBhY3RpdmVSb3coKSBpZiBub3QgaW5kZXg/IG9yIE51bWJlci5pc05hTiBpbmRleFxuICAgICAgICBcbiAgICAgICAgbmV3SW5kZXggPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcgICAgICAgIHRoZW4gaW5kZXgtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIGluZGV4KzFcbiAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiAwXG4gICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gQG51bVJvd3MoKS0xXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gaW5kZXgtQG51bVZpc2libGUoKVxuICAgICAgICAgICAgd2hlbiAncGFnZSBkb3duJyB0aGVuIGluZGV4K0BudW1WaXNpYmxlKClcbiAgICAgICAgICAgIGVsc2UgaW5kZXhcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBub3QgbmV3SW5kZXg/IG9yIE51bWJlci5pc05hTiBuZXdJbmRleCAgICAgICAgXG4gICAgICAgICAgICBlcnJvciBcIm5vIGluZGV4ICN7bmV3SW5kZXh9PyAje0BudW1WaXNpYmxlKCl9XCJcbiAgICAgICAgICAgIFxuICAgICAgICBuZXdJbmRleCA9IGNsYW1wIDAsIEBudW1Sb3dzKCktMSwgbmV3SW5kZXhcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBuZXdJbmRleCA9PSBpbmRleFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEByb3dzW25ld0luZGV4XT8uYWN0aXZhdGU/XG4gICAgICAgICAgICBlcnJvciBcIm5vIHJvdyBhdCBpbmRleCAje25ld0luZGV4fS8je0BudW1Sb3dzKCktMX0/XCIsIEBudW1Sb3dzKCkgXG4gICAgICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyBAcm93c1tuZXdJbmRleF1cbiAgICBcbiAgICBuYXZpZ2F0ZUNvbHM6IChrZXkpIC0+ICMgbW92ZSB0byBmaWxlIGJyb3dzZXI/XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcgICAgdGhlbiBAYnJvd3Nlci5uYXZpZ2F0ZSAndXAnXG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBAYnJvd3Nlci5uYXZpZ2F0ZSAnbGVmdCdcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIEBicm93c2VyLm5hdmlnYXRlICdyaWdodCdcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJ1xuICAgICAgICAgICAgICAgIGlmIGl0ZW0gPSBAYWN0aXZlUm93KCk/Lml0ZW1cbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IGl0ZW0udHlwZVxuICAgICAgICAgICAgICAgICAgICBpZiB0eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5sb2FkSXRlbSBpdGVtXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ29wZW5GaWxlJyBpdGVtLmZpbGVcbiAgICAgICAgQFxuXG4gICAgbmF2aWdhdGVSb290OiAoa2V5KSAtPiBcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmJyb3dzZSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBzbGFzaC5kaXIgQHBhcmVudC5maWxlXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBAYWN0aXZlUm93KCkuaXRlbS5maWxlXG4gICAgICAgIEBcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAgMDAwMDAwMDAwICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgXG4gICAgXG4gICAgZG9TZWFyY2g6IChjaGFyKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQHNlYXJjaERpdlxuICAgICAgICAgICAgQHNlYXJjaERpdiA9IGVsZW0gY2xhc3M6ICdicm93c2VyU2VhcmNoJ1xuICAgICAgICAgICAgXG4gICAgICAgIEBzZXRTZWFyY2ggQHNlYXJjaCArIGNoYXJcbiAgICAgICAgXG4gICAgYmFja3NwYWNlU2VhcmNoOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHNlYXJjaERpdiBhbmQgQHNlYXJjaC5sZW5ndGhcbiAgICAgICAgICAgIEBzZXRTZWFyY2ggQHNlYXJjaFswLi4uQHNlYXJjaC5sZW5ndGgtMV1cbiAgICAgICAgICAgIFxuICAgIHNldFNlYXJjaDogKEBzZWFyY2gpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBzZWFyY2hUaW1lclxuICAgICAgICBAc2VhcmNoVGltZXIgPSBzZXRUaW1lb3V0IEBjbGVhclNlYXJjaCwgMjAwMFxuICAgICAgICBcbiAgICAgICAgQHNlYXJjaERpdi50ZXh0Q29udGVudCA9IEBzZWFyY2hcblxuICAgICAgICBhY3RpdmVJbmRleCAgPSBAYWN0aXZlUm93KCk/LmluZGV4KCkgPyAwXG4gICAgICAgIGFjdGl2ZUluZGV4ICs9IDEgaWYgKEBzZWFyY2gubGVuZ3RoID09IDEpICNvciAoY2hhciA9PSAnJylcbiAgICAgICAgYWN0aXZlSW5kZXggID0gMCBpZiBhY3RpdmVJbmRleCA+PSBAbnVtUm93cygpXG4gICAgICAgIFxuICAgICAgICBmb3Igcm93cyBpbiBbQHJvd3Muc2xpY2UoYWN0aXZlSW5kZXgpLCBAcm93cy5zbGljZSgwLGFjdGl2ZUluZGV4KzEpXVxuICAgICAgICAgICAgZnV6emllZCA9IGZ1enp5LmZpbHRlciBAc2VhcmNoLCByb3dzLCBleHRyYWN0OiAocikgLT4gci5pdGVtLm5hbWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZnV6emllZC5sZW5ndGhcbiAgICAgICAgICAgICAgICByb3cgPSBmdXp6aWVkWzBdLm9yaWdpbmFsXG4gICAgICAgICAgICAgICAgcm93LmRpdi5hcHBlbmRDaGlsZCBAc2VhcmNoRGl2XG4gICAgICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICBAXG4gICAgXG4gICAgY2xlYXJTZWFyY2g6ID0+XG4gICAgICAgIFxuICAgICAgICBAc2VhcmNoID0gJydcbiAgICAgICAgQHNlYXJjaERpdj8ucmVtb3ZlKClcbiAgICAgICAgZGVsZXRlIEBzZWFyY2hEaXZcbiAgICAgICAgQFxuICAgIFxuICAgIHJlbW92ZU9iamVjdDogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHJvdyA9IEBhY3RpdmVSb3coKVxuICAgICAgICAgICAgbmV4dE9yUHJldiA9IHJvdy5uZXh0KCkgPyByb3cucHJldigpXG4gICAgICAgICAgICBAcmVtb3ZlUm93IHJvd1xuICAgICAgICAgICAgbmV4dE9yUHJldj8uYWN0aXZhdGUoKVxuICAgICAgICBAXG5cbiAgICByZW1vdmVSb3c6IChyb3cpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiByb3cgPT0gQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICBpZiBAbmV4dENvbHVtbigpPy5wYXJlbnQ/LmZpbGUgPT0gcm93Lml0ZW0/LmZpbGVcbiAgICAgICAgICAgICAgICAjIGtsb2cgJ3JlbW92ZVJvdyBjbGVhcidcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci5jbGVhckNvbHVtbnNGcm9tIEBpbmRleCArIDFcbiAgICAgICAgICAgIFxuICAgICAgICByb3cuZGl2LnJlbW92ZSgpXG4gICAgICAgIEBpdGVtcy5zcGxpY2Ugcm93LmluZGV4KCksIDFcbiAgICAgICAgQHJvd3Muc3BsaWNlIHJvdy5pbmRleCgpLCAxXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNvcnRCeU5hbWU6ID0+XG4gICAgICAgICBcbiAgICAgICAgQHJvd3Muc29ydCAoYSxiKSAtPiBcbiAgICAgICAgICAgIChhLml0ZW0udHlwZSArIGEuaXRlbS5uYW1lKS5sb2NhbGVDb21wYXJlKGIuaXRlbS50eXBlICsgYi5pdGVtLm5hbWUpXG4gICAgICAgICAgICBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIEB0YWJsZS5hcHBlbmRDaGlsZCByb3cuZGl2XG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgc29ydEJ5VHlwZTogPT5cbiAgICAgICAgXG4gICAgICAgIEByb3dzLnNvcnQgKGEsYikgLT4gXG4gICAgICAgICAgICBhdHlwZSA9IGEuaXRlbS50eXBlID09ICdmaWxlJyBhbmQgc2xhc2guZXh0KGEuaXRlbS5uYW1lKSBvciAnX19fJyAjYS5pdGVtLnR5cGVcbiAgICAgICAgICAgIGJ0eXBlID0gYi5pdGVtLnR5cGUgPT0gJ2ZpbGUnIGFuZCBzbGFzaC5leHQoYi5pdGVtLm5hbWUpIG9yICdfX18nICNiLml0ZW0udHlwZVxuICAgICAgICAgICAgKGEuaXRlbS50eXBlICsgYXR5cGUgKyBhLml0ZW0ubmFtZSkubG9jYWxlQ29tcGFyZShiLml0ZW0udHlwZSArIGJ0eXBlICsgYi5pdGVtLm5hbWUsIHVuZGVmaW5lZCwgbnVtZXJpYzp0cnVlKVxuICAgICAgICAgICAgXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICBAdGFibGUuYXBwZW5kQ2hpbGQgcm93LmRpdlxuICAgICAgICBAXG5cbiAgICBzb3J0QnlEYXRlQWRkZWQ6ID0+XG4gICAgICAgIFxuICAgICAgICBAcm93cy5zb3J0IChhLGIpIC0+IGIuaXRlbS5zdGF0Py5hdGltZU1zIC0gYS5pdGVtLnN0YXQ/LmF0aW1lTXNcbiAgICAgICAgICAgIFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93c1xuICAgICAgICAgICAgQHRhYmxlLmFwcGVuZENoaWxkIHJvdy5kaXZcbiAgICAgICAgQFxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgdG9nZ2xlRG90RmlsZXM6ID0+XG5cbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09IHVuZGVmaW5lZFxuICAgICAgICAgICAgIyBsb2cgJ2NvbHVtbi50b2dnbGVEb3RGaWxlcycgQHBhcmVudFxuICAgICAgICAgICAgQHBhcmVudC50eXBlID0gc2xhc2guaXNEaXIoQHBhcmVudC5maWxlKSBhbmQgJ2Rpcicgb3IgJ2ZpbGUnXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09ICdkaXInICAgICAgICAgICAgXG4gICAgICAgICAgICBzdGF0ZUtleSA9IFwiYnJvd3NlcuKWuHNob3dIaWRkZW7ilrgje0BwYXJlbnQuZmlsZX1cIlxuICAgICAgICAgICAgaWYgcHJlZnMuZ2V0IHN0YXRlS2V5XG4gICAgICAgICAgICAgICAgcHJlZnMuZGVsIHN0YXRlS2V5XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcHJlZnMuc2V0IHN0YXRlS2V5LCB0cnVlXG4gICAgICAgICAgICBAYnJvd3Nlci5sb2FkRGlySXRlbSBAcGFyZW50LCBAaW5kZXgsIGlnbm9yZUNhY2hlOnRydWVcbiAgICAgICAgQFxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBtb3ZlVG9UcmFzaDogPT5cbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gQGJyb3dzZXIuc2VsZWN0LmZyZWVJbmRleCgpXG4gICAgICAgIGlmIGluZGV4ID49IDBcbiAgICAgICAgICAgIHNlbGVjdFJvdyA9IEByb3cgaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGZvciByb3cgaW4gQGJyb3dzZXIuc2VsZWN0LnJvd3NcbiAgICAgICAgICAgIHd4dyAndHJhc2gnIHJvdy5wYXRoKClcbiAgICAgICAgICAgIEByZW1vdmVSb3cgcm93XG4gICAgICAgICAgIFxuICAgICAgICBpZiBzZWxlY3RSb3dcbiAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgc2VsZWN0Um93XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBuYXZpZ2F0ZUNvbHMgJ2xlZnQnXG5cbiAgICBhZGRUb1NoZWxmOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgcGF0aFRvU2hlbGYgPSBAYWN0aXZlUGF0aCgpXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2FkZFRvU2hlbGYnIHBhdGhUb1NoZWxmXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjICAwMDAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjICAgICAwICAgICAgMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBvcGVuVmlld2VyOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGFjdGl2ZVJvdygpPy5pdGVtLm5hbWUgIT0gJy4uJyBhbmQgc2xhc2guaXNEaXIgQGFjdGl2ZVBhdGgoKVxuICAgICAgICAgICAgcGF0aCA9IEBhY3RpdmVQYXRoKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcGF0aCA9IEBhY3RpdmVSb3coKT8uaXRlbS5maWxlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEZpbGUuaXNUZXh0IHBhdGhcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci52aWV3ZXIgPSBuZXcgRWRpdG9yIEBicm93c2VyLCBwYXRoXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub3QgRmlsZS5pc0ltYWdlIHBhdGhcbiAgICAgICAgICAgICAgICBwYXRoID0gQHBhdGgoKVxuICAgICAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnZpZXdlciA9IG5ldyBWaWV3ZXIgQGJyb3dzZXIsIHBhdGhcbiAgICAgICAgXG4gICAgbmV3Rm9sZGVyOiA9PlxuICAgICAgICBcbiAgICAgICAgdW51c2VkID0gcmVxdWlyZSAndW51c2VkLWZpbGVuYW1lJ1xuICAgICAgICB1bnVzZWQoc2xhc2guam9pbiBAcGF0aCgpLCAnTmV3IGZvbGRlcicpLnRoZW4gKG5ld0RpcikgPT5cbiAgICAgICAgICAgIGZzLm1rZGlyIG5ld0RpciwgKGVycikgPT5cbiAgICAgICAgICAgICAgICBpZiBlbXB0eSBlcnJcbiAgICAgICAgICAgICAgICAgICAgcm93ID0gQGluc2VydEZpbGUgbmV3RGlyXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgcm93XG4gICAgICAgICAgICAgICAgICAgIHJvdy5lZGl0TmFtZSgpXG4gICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGR1cGxpY2F0ZUZpbGU6ID0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBmaWxlIGluIEBicm93c2VyLnNlbGVjdC5maWxlcygpXG4gICAgICAgICAgICBGaWxlLmR1cGxpY2F0ZSBmaWxlLCAoc291cmNlLCB0YXJnZXQpID0+XG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyBAaW5zZXJ0RmlsZSB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGV4cGxvcmVyOiA9PlxuICAgICAgICBcbiAgICAgICAgb3BlbiBzbGFzaC5kaXIgQGFjdGl2ZVBhdGgoKVxuICAgICAgICBcbiAgICBvcGVuOiA9PlxuICAgICAgICBcbiAgICAgICAgb3BlbiBAYWN0aXZlUGF0aCgpXG4gICAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgXG4gICAgICAgIFxuICAgIG1ha2VSb290OiA9PiBcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnNoaWZ0Q29sdW1uc1RvIEBpbmRleFxuICAgICAgICBcbiAgICAgICAgaWYgQGJyb3dzZXIuY29sdW1uc1swXS5pdGVtc1swXS5uYW1lICE9ICcuLidcbiAgICAgICAgICAgIEB1bnNoaWZ0SXRlbSBcbiAgICAgICAgICAgICAgICBuYW1lOiAnLi4nXG4gICAgICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgICAgICBmaWxlOiBzbGFzaC5kaXIgQHBhcmVudC5maWxlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBjcnVtYi5zZXRGaWxlIEBwYXJlbnQuZmlsZVxuICAgIFxuICAgIG9uQ29udGV4dE1lbnU6IChldmVudCwgY29sdW1uKSA9PiBcbiAgICAgICAgXG4gICAgICAgIHN0b3BFdmVudCBldmVudFxuICAgICAgICBcbiAgICAgICAgYWJzUG9zID0ga3BvcyBldmVudFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGNvbHVtblxuICAgICAgICAgICAgQHNob3dDb250ZXh0TWVudSBhYnNQb3NcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBvcHQgPSBpdGVtczogWyBcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICdSb290J1xuICAgICAgICAgICAgICAgIGNiOiAgICAgQG1ha2VSb290XG4gICAgICAgICAgICAsXG4gICAgICAgICAgICAgICAgdGV4dDogICAnQWRkIHRvIFNoZWxmJ1xuICAgICAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtzaGlmdCsuJ1xuICAgICAgICAgICAgICAgIGNiOiAgICAgPT4gcG9zdC5lbWl0ICdhZGRUb1NoZWxmJyBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgICxcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICdFeHBsb3JlcidcbiAgICAgICAgICAgICAgICBjb21ibzogICdhbHQrZScgXG4gICAgICAgICAgICAgICAgY2I6ICAgICA9PiBvcGVuIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgICAgICBvcHQueSA9IGFic1Bvcy55XG4gICAgICAgICAgICBwb3B1cC5tZW51IG9wdCAgICBcbiAgICAgICAgICAgICAgXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IGtwb3MgQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0LCBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcFxuICAgICAgICBcbiAgICAgICAgb3B0ID0gaXRlbXM6IFsgXG4gICAgICAgICAgICB0ZXh0OiAgICdPcGVuJ1xuICAgICAgICAgICAgY29tYm86ICAncmV0dXJuIGFsdCtvJ1xuICAgICAgICAgICAgY2I6ICAgICBAb3BlblxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdWaWV3ZXInXG4gICAgICAgICAgICBjb21ibzogICdzcGFjZSBhbHQrdicgXG4gICAgICAgICAgICBjYjogICAgIEBvcGVuVmlld2VyXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0V4cGxvcmVyJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K2UnIFxuICAgICAgICAgICAgY2I6ICAgICBAZXhwbG9yZXJcbiAgICAgICAgLCAgIFxuICAgICAgICAgICAgdGV4dDogICAnJ1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdEdXBsaWNhdGUnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2QnIFxuICAgICAgICAgICAgY2I6ICAgICBAZHVwbGljYXRlRmlsZVxuICAgICAgICAsICAgXG4gICAgICAgICAgICB0ZXh0OiAgICdOZXcgRm9sZGVyJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K24nIFxuICAgICAgICAgICAgY2I6ICAgICBAbmV3Rm9sZGVyXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJydcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnQWRkIHRvIFNoZWxmJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K3NoaWZ0Ky4nXG4gICAgICAgICAgICBjYjogICAgIEBhZGRUb1NoZWxmXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJydcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnTW92ZSB0byBUcmFzaCdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrYmFja3NwYWNlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQG1vdmVUb1RyYXNoXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJydcbiAgICAgICAgLCAgIFxuICAgICAgICAgICAgdGV4dDogICAnU29ydCdcbiAgICAgICAgICAgIG1lbnU6IFtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnQnkgTmFtZScgY29tYm86J2N0cmwrbicsIGNiOkBzb3J0QnlOYW1lXG4gICAgICAgICAgICAsXG4gICAgICAgICAgICAgICAgdGV4dDogJ0J5IFR5cGUnIGNvbWJvOidjdHJsK3QnLCBjYjpAc29ydEJ5VHlwZVxuICAgICAgICAgICAgLFxuICAgICAgICAgICAgICAgIHRleHQ6ICdCeSBEYXRlJyBjb21ibzonY3RybCthJywgY2I6QHNvcnRCeURhdGVBZGRlZFxuICAgICAgICAgICAgXVxuICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICBvcHQuaXRlbXMgPSBvcHQuaXRlbXMuY29uY2F0IHdpbmRvdy50aXRsZWJhci5tYWtlVGVtcGxhdGUgcmVxdWlyZSAnLi9tZW51Lmpzb24nXG4gICAgICAgIFxuICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgcG9wdXAubWVudSBvcHQgICAgICAgIFxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG9uS2V5OiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnc2hpZnQrYCcgJ34nICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIuYnJvd3NlICd+J1xuICAgICAgICAgICAgd2hlbiAnLycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIuYnJvd3NlICcvJ1xuICAgICAgICAgICAgd2hlbiAnYWx0K3NoaWZ0Ky4nICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGFkZFRvU2hlbGYoKVxuICAgICAgICAgICAgd2hlbiAnYWx0K2UnICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBleHBsb3JlcigpXG4gICAgICAgICAgICB3aGVuICdhbHQrbycgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQG9wZW4oKVxuICAgICAgICAgICAgd2hlbiAnYWx0K24nICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBuZXdGb2xkZXIoKVxuICAgICAgICAgICAgd2hlbiAnc3BhY2UnICdhbHQrdicgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBvcGVuVmlld2VyKClcbiAgICAgICAgICAgIHdoZW4gJ3NoaWZ0K3VwJyAnc2hpZnQrZG93bicgJ3NoaWZ0K2hvbWUnICdzaGlmdCtlbmQnICdzaGlmdCtwYWdlIHVwJyAnc2hpZnQrcGFnZSBkb3duJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBleHRlbmRTZWxlY3Rpb24ga2V5XG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAncGFnZSBkb3duJyAnaG9tZScgJ2VuZCcgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzIGtleVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCt1cCcgJ2N0cmwrdXAnICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyAnaG9tZSdcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZG93bicgJ2N0cmwrZG93bicgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3MgJ2VuZCdcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJydhbHQrdXAnICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZUNvbHMga2V5XG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5vbkJhY2tzcGFjZUluQ29sdW1uIEBcbiAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZScgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLm9uRGVsZXRlSW5Db2x1bW4gQFxuICAgICAgICAgICAgd2hlbiAnY3RybCt0JyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeVR5cGUoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtuJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeU5hbWUoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCthJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeURhdGVBZGRlZCgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2knICdjdHJsK2knICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAdG9nZ2xlRG90RmlsZXMoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtkJyAnY3RybCtkJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGR1cGxpY2F0ZUZpbGUoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtrJyAnY3RybCtrJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCBpZiBAYnJvd3Nlci5jbGVhblVwKClcbiAgICAgICAgICAgIHdoZW4gJ2YyJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBhY3RpdmVSb3coKT8uZWRpdE5hbWUoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtsZWZ0JyAnY29tbWFuZCtyaWdodCcgJ2N0cmwrbGVmdCcgJ2N0cmwrcmlnaHQnXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm9vdCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrYmFja3NwYWNlJyAnY3RybCtiYWNrc3BhY2UnICdjb21tYW5kK2RlbGV0ZScgJ2N0cmwrZGVsZXRlJyBcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbW92ZVRvVHJhc2goKVxuICAgICAgICAgICAgd2hlbiAndGFiJyAgICBcbiAgICAgICAgICAgICAgICBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBkb1NlYXJjaCAnJ1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgICAgIHdoZW4gJ2VzYydcbiAgICAgICAgICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgICAgICAgICBAZHJhZ0Rpdi5kcmFnLmRyYWdTdG9wKClcbiAgICAgICAgICAgICAgICAgICAgQGRyYWdEaXYucmVtb3ZlKClcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEBkcmFnRGl2XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKS5sZW5ndGggPiAxXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBjbGVhclNlYXJjaCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuXG4gICAgICAgIGlmIGNvbWJvIGluIFsndXAnICAgJ2Rvd24nXSAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzIGtleSAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbWJvIGluIFsnbGVmdCcgJ3JpZ2h0J10gdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVDb2xzIGtleVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG1vZCBpbiBbJ3NoaWZ0JyAnJ10gYW5kIGNoYXIgdGhlbiBAZG9TZWFyY2ggY2hhclxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgIEB1cGRhdGVEcmFnSW5kaWNhdG9yIGV2ZW50XG4gICAgICAgICAgICBcbiAgICBvbktleVVwOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgQHVwZGF0ZURyYWdJbmRpY2F0b3IgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBDb2x1bW5cblxuXG4iXX0=
//# sourceURL=../coffee/column.coffee