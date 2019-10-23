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
        var ref1;
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
            if (this.hasFocus() && this.activeRow()) {
                return this.browser.select.row(this.activeRow());
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
        var ref1, ref2;
        return (ref1 = (ref2 = this.activeRow()) != null ? ref2.path() : void 0) != null ? ref1 : this.parent.file;
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
        this.div.classList.add('focus');
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
        var path, ref1;
        if (((ref1 = this.activeRow()) != null ? ref1.item.name : void 0) !== '..') {
            path = this.activePath();
        } else {
            path = this.parent.file;
        }
        if (path) {
            if (File.isText(path)) {
                this.browser.viewer = new Editor(this.browser, path);
                return;
            }
            if (slash.isFile(path)) {
                if (!File.isImage(path)) {
                    path = this.path();
                }
            }
            return this.browser.viewer = new Viewer(this.browser, path);
        }
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
                    var col, row;
                    if (_this.parent.type === 'file') {
                        col = _this.prevColumn();
                        col.focus();
                    } else {
                        col = _this;
                    }
                    row = col.insertFile(target);
                    return _this.browser.select.row(row);
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
                    text: '',
                    hide: this.parent.type === 'file'
                }, {
                    text: 'Duplicate',
                    combo: 'ctrl+d',
                    cb: this.duplicateFile,
                    hide: this.parent.type === 'file'
                }, {
                    text: 'New Folder',
                    combo: 'alt+n',
                    cb: this.newFolder,
                    hide: this.parent.type === 'file'
                }
            ]
        };
        if (this.parent.type !== 'file') {
            opt.items = opt.items.concat([
                {
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
            ]);
            opt.items = opt.items.concat(window.titlebar.makeTemplate(require('./menu.json')));
        }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sdW1uLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpTUFBQTtJQUFBOztBQVFBLE1BQW1JLE9BQUEsQ0FBUSxLQUFSLENBQW5JLEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUseUJBQWYsRUFBMEIsdUJBQTFCLEVBQW9DLHFCQUFwQyxFQUE2QyxpQkFBN0MsRUFBb0QsaUJBQXBELEVBQTJELGlCQUEzRCxFQUFrRSxpQkFBbEUsRUFBeUUsaUJBQXpFLEVBQWdGLGVBQWhGLEVBQXNGLGVBQXRGLEVBQTRGLGVBQTVGLEVBQWtHLGVBQWxHLEVBQXdHLFdBQXhHLEVBQTRHLGVBQTVHLEVBQWtILG1CQUFsSCxFQUEwSCxTQUExSCxFQUE2SDs7QUFFN0gsR0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsa0JBQVI7O0FBQ1gsSUFBQSxHQUFXLE9BQUEsQ0FBUSxjQUFSOztBQUNYLE1BQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxTQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFDWCxHQUFBLEdBQVcsT0FBQSxDQUFRLEtBQVI7O0FBRUw7SUFFQyxnQkFBQyxPQUFEO0FBRUMsWUFBQTtRQUZBLElBQUMsQ0FBQSxVQUFEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7UUFFQSxJQUFDLENBQUEsV0FBRCxHQUFlO1FBQ2YsSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxLQUFELEdBQVU7UUFDVixJQUFDLENBQUEsSUFBRCxHQUFVO1FBRVYsSUFBQyxDQUFBLEdBQUQsR0FBUyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGVBQVA7WUFBdUIsUUFBQSxFQUFTLENBQWhDO1NB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QUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsQ0FBakIsRUFBekM7O1FBQ0EsSUFBRyxLQUFBLEtBQVUsTUFBVixJQUFBLEtBQUEsS0FBaUIsT0FBcEI7QUFBa0MsbUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFlBQUQsQ0FBYyxHQUFkLENBQWpCLEVBQXpDOztRQUVBLElBQUcsQ0FBQSxHQUFBLEtBQVEsT0FBUixJQUFBLEdBQUEsS0FBZ0IsRUFBaEIsQ0FBQSxJQUF3QixJQUEzQjtZQUFxQyxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsRUFBckM7O1FBRUEsSUFBRyxJQUFDLENBQUEsT0FBSjttQkFDSSxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsS0FBckIsRUFESjs7SUFoREc7O3FCQW1EUCxPQUFBLEdBQVMsU0FBQyxLQUFEO1FBRUwsSUFBRyxJQUFDLENBQUEsT0FBSjttQkFDSSxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsS0FBckIsRUFESjs7SUFGSzs7Ozs7O0FBS2IsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIHByZWZzLCBzdG9wRXZlbnQsIHNldFN0eWxlLCBrZXlpbmZvLCBwb3B1cCwgc2xhc2gsIHZhbGlkLCBjbGFtcCwgZW1wdHksIGRyYWcsIG9wZW4sIGVsZW0sIGtwb3MsIGZzLCBrbG9nLCBrZXJyb3IsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuUm93ICAgICAgPSByZXF1aXJlICcuL3JvdydcblNjcm9sbGVyID0gcmVxdWlyZSAnLi90b29scy9zY3JvbGxlcidcbkZpbGUgICAgID0gcmVxdWlyZSAnLi90b29scy9maWxlJ1xuVmlld2VyICAgPSByZXF1aXJlICcuL3ZpZXdlcidcbkVkaXRvciAgID0gcmVxdWlyZSAnLi9lZGl0b3InXG5DcnVtYiAgICA9IHJlcXVpcmUgJy4vY3J1bWInXG5mdXp6eSAgICA9IHJlcXVpcmUgJ2Z1enp5J1xud3h3ICAgICAgPSByZXF1aXJlICd3eHcnXG5cbmNsYXNzIENvbHVtblxuICAgIFxuICAgIEA6IChAYnJvd3NlcikgLT5cbiAgICAgICAgXG4gICAgICAgIEBzZWFyY2hUaW1lciA9IG51bGxcbiAgICAgICAgQHNlYXJjaCA9ICcnXG4gICAgICAgIEBpdGVtcyAgPSBbXVxuICAgICAgICBAcm93cyAgID0gW11cbiAgICAgICAgXG4gICAgICAgIEBkaXYgICA9IGVsZW0gY2xhc3M6ICdicm93c2VyQ29sdW1uJyB0YWJJbmRleDo2XG4gICAgICAgIEB0YWJsZSA9IGVsZW0gY2xhc3M6ICdicm93c2VyQ29sdW1uVGFibGUnXG4gICAgICAgIEBkaXYuYXBwZW5kQ2hpbGQgQHRhYmxlXG4gICAgICAgIFxuICAgICAgICBAc2V0SW5kZXggQGJyb3dzZXIuY29sdW1ucz8ubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5jb2xzPy5hcHBlbmRDaGlsZCBAZGl2XG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2ZvY3VzJyAgICAgQG9uRm9jdXNcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdibHVyJyAgICAgIEBvbkJsdXJcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJyAgIEBvbktleVxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2tleXVwJyAgICAgQG9uS2V5VXBcbiAgICAgICAgXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2VvdmVyJyBAb25Nb3VzZU92ZXJcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdtb3VzZW91dCcgIEBvbk1vdXNlT3V0XG5cbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdkYmxjbGljaycgIEBvbkRibENsaWNrXG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2NvbnRleHRtZW51JyBAb25Db250ZXh0TWVudVxuICBcbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQGRpdlxuICAgICAgICAgICAgb25TdGFydDogQG9uRHJhZ1N0YXJ0XG4gICAgICAgICAgICBvbk1vdmU6ICBAb25EcmFnTW92ZVxuICAgICAgICAgICAgb25TdG9wOiAgQG9uRHJhZ1N0b3BcbiAgICAgICAgXG4gICAgICAgIEBjcnVtYiAgPSBuZXcgQ3J1bWIgQFxuICAgICAgICBAc2Nyb2xsID0gbmV3IFNjcm9sbGVyIEBcbiAgICAgICAgXG4gICAgc2V0SW5kZXg6IChAaW5kZXgpIC0+XG4gICAgICAgIFxuICAgICAgICBAY3J1bWI/LmVsZW0uY29sdW1uSW5kZXggPSBAaW5kZXhcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBvbkRyYWdTdGFydDogKGQsIGUpID0+IFxuICAgIFxuICAgICAgICBAZHJhZ1N0YXJ0Um93ID0gQHJvdyBlLnRhcmdldFxuICAgICAgICBcbiAgICAgICAgZGVsZXRlIEB0b2dnbGVcbiAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnU3RhcnRSb3dcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZS5zaGlmdEtleVxuICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC50byBAZHJhZ1N0YXJ0Um93XG4gICAgICAgICAgICBlbHNlIGlmIGUubWV0YUtleSBvciBlLmFsdEtleSBvciBlLmN0cmxLZXlcbiAgICAgICAgICAgICAgICBpZiBub3Qgcm93LmlzU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3QudG9nZ2xlIEBkcmFnU3RhcnRSb3dcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEB0b2dnbGUgPSB0cnVlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgQGRyYWdTdGFydFJvdy5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgICAgICAgICAgQGRlc2VsZWN0ID0gdHJ1ZVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGFjdGl2ZVJvdygpPy5jbGVhckFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQGRyYWdTdGFydFJvdywgZmFsc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGhhc0ZvY3VzKCkgYW5kIEBhY3RpdmVSb3coKVxuICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQGFjdGl2ZVJvdygpXG5cbiAgICBvbkRyYWdNb3ZlOiAoZCxlKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdTdGFydFJvdyBhbmQgbm90IEBkcmFnRGl2IGFuZCB2YWxpZCBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gaWYgTWF0aC5hYnMoZC5kZWx0YVN1bS54KSA8IDIwIGFuZCBNYXRoLmFicyhkLmRlbHRhU3VtLnkpIDwgMTBcblxuICAgICAgICAgICAgZGVsZXRlIEB0b2dnbGUgXG4gICAgICAgICAgICBkZWxldGUgQGRlc2VsZWN0XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBkcmFnRGl2ID0gZWxlbSAnZGl2J1xuICAgICAgICAgICAgQGRyYWdEaXYuZHJhZyA9IGRcbiAgICAgICAgICAgIHBvcyA9IGtwb3MgZS5wYWdlWCwgZS5wYWdlWVxuICAgICAgICAgICAgcm93ID0gQGJyb3dzZXIuc2VsZWN0LnJvd3NbMF1cbiAgICAgICAgICAgIGJyICA9IHJvdy5kaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcblxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5vcGFjaXR5ICA9IFwiMC43XCJcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLnRvcCAgPSBcIiN7cG9zLnktZC5kZWx0YVN1bS55fXB4XCJcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLmxlZnQgPSBcIiN7cG9zLngtZC5kZWx0YVN1bS54fXB4XCJcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLndpZHRoID0gXCIje2JyLndpZHRoLTEyfXB4XCJcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGRyYWdJbmQgPSBlbGVtIGNsYXNzOidkcmFnSW5kaWNhdG9yJ1xuICAgICAgICAgICAgQGRyYWdEaXYuYXBwZW5kQ2hpbGQgQGRyYWdJbmRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIHJvdyBpbiBAYnJvd3Nlci5zZWxlY3Qucm93c1xuICAgICAgICAgICAgICAgIHJvd0Nsb25lID0gcm93LmRpdi5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICAgICAgICAgIHJvd0Nsb25lLnN0eWxlLmZsZXggPSAndW5zZXQnXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJ1xuICAgICAgICAgICAgICAgIHJvd0Nsb25lLnN0eWxlLmJvcmRlciA9ICdub25lJ1xuICAgICAgICAgICAgICAgIHJvd0Nsb25lLnN0eWxlLm1hcmdpbkJvdHRvbSA9ICctMXB4J1xuICAgICAgICAgICAgICAgIEBkcmFnRGl2LmFwcGVuZENoaWxkIHJvd0Nsb25lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkIEBkcmFnRGl2XG4gICAgICAgICAgICBAZm9jdXMgYWN0aXZhdGU6ZmFsc2VcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAdXBkYXRlRHJhZ0luZGljYXRvciBlICAgICAgXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZVgoI3tkLmRlbHRhU3VtLnh9cHgpIHRyYW5zbGF0ZVkoI3tkLmRlbHRhU3VtLnl9cHgpXCJcblxuICAgIHVwZGF0ZURyYWdJbmRpY2F0b3I6IChldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBkcmFnSW5kPy5jbGFzc0xpc3QudG9nZ2xlICdjb3B5JyBldmVudC5zaGlmdEtleVxuICAgICAgICBAZHJhZ0luZD8uY2xhc3NMaXN0LnRvZ2dsZSAnbW92ZScgZXZlbnQuY3RybEtleSBvciBldmVudC5tZXRhS2V5IG9yIGV2ZW50LmFsdEtleVxuICAgICAgICAgICAgXG4gICAgb25EcmFnU3RvcDogKGQsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnRGl2P1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZHJhZ0Rpdi5yZW1vdmUoKVxuICAgICAgICAgICAgZGVsZXRlIEBkcmFnRGl2XG4gICAgICAgICAgICBkZWxldGUgQGRyYWdTdGFydFJvd1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiByb3cgPSBAYnJvd3Nlci5yb3dBdFBvcyBkLnBvc1xuICAgICAgICAgICAgICAgIGNvbHVtbiA9IHJvdy5jb2x1bW5cbiAgICAgICAgICAgICAgICB0YXJnZXQgPSByb3cuaXRlbS5maWxlXG4gICAgICAgICAgICBlbHNlIGlmIGNvbHVtbiA9IEBicm93c2VyLmNvbHVtbkF0UG9zIGQucG9zXG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gY29sdW1uLnBhcmVudD8uZmlsZVxuICAgICAgICAgICAgZWxzZSBpZiBjb2x1bW4gPSBAYnJvd3Nlci5jb2x1bW5BdFggZC5wb3MueFxuICAgICAgICAgICAgICAgIHRhcmdldCA9IGNvbHVtbi5wYXJlbnQ/LmZpbGVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBrbG9nICdubyBkcm9wIHRhcmdldCdcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGFjdGlvbiA9IGUuc2hpZnRLZXkgYW5kICdjb3B5JyBvciAnbW92ZSdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGNvbHVtbiA9PSBAYnJvd3Nlci5zaGVsZiBcbiAgICAgICAgICAgICAgICBpZiB0YXJnZXQgYW5kIChlLmN0cmxLZXkgb3IgZS5zaGlmdEtleSBvciBlLm1ldGFLZXkgb3IgZS5hbHRLZXkpXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLmRyb3BBY3Rpb24gYWN0aW9uLCBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKSwgdGFyZ2V0XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zaGVsZi5hZGRGaWxlcyBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKSwgcG9zOmQucG9zXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuZHJvcEFjdGlvbiBhY3Rpb24sIEBicm93c2VyLnNlbGVjdC5maWxlcygpLCB0YXJnZXRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZm9jdXMgYWN0aXZhdGU6ZmFsc2VcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcm93ID0gQHJvdyBlLnRhcmdldFxuICAgICAgICAgICAgICAgIGlmIHJvdy5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgICAgICAgICAgaWYgZS5tZXRhS2V5IG9yIGUuYWx0S2V5IG9yIGUuY3RybEtleSBvciBlLnNoaWZ0S2V5XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAdG9nZ2xlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEB0b2dnbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3QudG9nZ2xlIHJvd1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAZGVzZWxlY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgQGRlc2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyByb3dcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3cuYWN0aXZhdGUoKVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgcmVtb3ZlRmlsZTogKGZpbGUpID0+IFxuICAgICAgICBcbiAgICAgICAgaWYgcm93ID0gQHJvdyBzbGFzaC5maWxlIGZpbGVcbiAgICAgICAgICAgIEByZW1vdmVSb3cgcm93XG4gICAgICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICBcbiAgICBpbnNlcnRGaWxlOiAoZmlsZSkgPT4gXG5cbiAgICAgICAgaXRlbSA9IEBicm93c2VyLmZpbGVJdGVtIGZpbGVcbiAgICAgICAgcm93ID0gbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIEByb3dzLnB1c2ggcm93XG4gICAgICAgIHJvd1xuICAgIFxuICAgIGxvYWRJdGVtczogKGl0ZW1zLCBwYXJlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5jbGVhckNvbHVtbiBAaW5kZXhcbiAgICAgICAgXG4gICAgICAgIEBpdGVtcyAgPSBpdGVtc1xuICAgICAgICBAcGFyZW50ID0gcGFyZW50XG4gICAgICAgIFxuICAgICAgICBAY3J1bWIuc2V0RmlsZSBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09IHVuZGVmaW5lZFxuICAgICAgICAgICAgQHBhcmVudC50eXBlID0gc2xhc2guaXNEaXIoQHBhcmVudC5maWxlKSBhbmQgJ2Rpcicgb3IgJ2ZpbGUnXG4gICAgICAgIFxuICAgICAgICBrZXJyb3IgXCJubyBwYXJlbnQgaXRlbT9cIiBpZiBub3QgQHBhcmVudD9cbiAgICAgICAga2Vycm9yIFwibG9hZEl0ZW1zIC0tIG5vIHBhcmVudCB0eXBlP1wiLCBAcGFyZW50IGlmIG5vdCBAcGFyZW50LnR5cGU/XG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAaXRlbXNcbiAgICAgICAgICAgIGZvciBpdGVtIGluIEBpdGVtc1xuICAgICAgICAgICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIFxuICAgICAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSAnZGlyJyBhbmQgc2xhc2guc2FtZVBhdGggJ34vRG93bmxvYWRzJyBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIEBzb3J0QnlEYXRlQWRkZWQoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgIHVuc2hpZnRJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBpdGVtcy51bnNoaWZ0IGl0ZW1cbiAgICAgICAgQHJvd3MudW5zaGlmdCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgQHRhYmxlLmluc2VydEJlZm9yZSBAdGFibGUubGFzdENoaWxkLCBAdGFibGUuZmlyc3RDaGlsZFxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgIEByb3dzWzBdXG4gICAgICAgIFxuICAgIHB1c2hJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBpdGVtcy5wdXNoIGl0ZW1cbiAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAcm93c1stMV1cbiAgICAgICAgXG4gICAgYWRkSXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIFxuICAgICAgICByb3cgPSBAcHVzaEl0ZW0gaXRlbVxuICAgICAgICBAc29ydEJ5TmFtZSgpXG4gICAgICAgIHJvd1xuXG4gICAgc2V0SXRlbXM6IChAaXRlbXMsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmNsZWFyQ29sdW1uIEBpbmRleFxuICAgICAgICBcbiAgICAgICAgQHBhcmVudCA9IG9wdC5wYXJlbnRcbiAgICAgICAga2Vycm9yIFwibm8gcGFyZW50IGl0ZW0/XCIgaWYgbm90IEBwYXJlbnQ/XG4gICAgICAgIGtlcnJvciBcInNldEl0ZW1zIC0tIG5vIHBhcmVudCB0eXBlP1wiLCBAcGFyZW50IGlmIG5vdCBAcGFyZW50LnR5cGU/XG4gICAgICAgIFxuICAgICAgICBmb3IgaXRlbSBpbiBAaXRlbXNcbiAgICAgICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIFxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgIEBcblxuICAgIGlzRGlyOiAgLT4gQHBhcmVudD8udHlwZSA9PSAnZGlyJyBcbiAgICBpc0ZpbGU6IC0+IEBwYXJlbnQ/LnR5cGUgPT0gJ2ZpbGUnIFxuICAgICAgICBcbiAgICBpc0VtcHR5OiAtPiBlbXB0eSBAcGFyZW50XG4gICAgY2xlYXI6ICAgLT5cbiAgICAgICAgQGNsZWFyU2VhcmNoKClcbiAgICAgICAgZGVsZXRlIEBwYXJlbnRcbiAgICAgICAgQGRpdi5zY3JvbGxUb3AgPSAwXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBAY3J1bWIuY2xlYXIoKVxuICAgICAgICBAcm93cyA9IFtdXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAwMDAwMCAgXG4gICBcbiAgICBhY3RpdmF0ZVJvdzogKHJvdykgLT4gQHJvdyhyb3cpPy5hY3RpdmF0ZSgpXG4gICAgICAgXG4gICAgYWN0aXZlUm93OiAtPiBfLmZpbmQgQHJvd3MsIChyKSAtPiByLmlzQWN0aXZlKClcbiAgICBhY3RpdmVQYXRoOiAtPiBAYWN0aXZlUm93KCk/LnBhdGgoKSA/IEBwYXJlbnQuZmlsZVxuICAgIFxuICAgIHJvdzogKHJvdykgLT4gIyBhY2NlcHRzIGVsZW1lbnQsIGluZGV4LCBzdHJpbmcgb3Igcm93XG4gICAgICAgIGlmICAgICAgXy5pc051bWJlciAgcm93IHRoZW4gcmV0dXJuIDAgPD0gcm93IDwgQG51bVJvd3MoKSBhbmQgQHJvd3Nbcm93XSBvciBudWxsXG4gICAgICAgIGVsc2UgaWYgXy5pc0VsZW1lbnQgcm93IHRoZW4gcmV0dXJuIF8uZmluZCBAcm93cywgKHIpIC0+IHIuZGl2LmNvbnRhaW5zIHJvd1xuICAgICAgICBlbHNlIGlmIF8uaXNTdHJpbmcgIHJvdyB0aGVuIHJldHVybiBfLmZpbmQgQHJvd3MsIChyKSAtPiByLml0ZW0ubmFtZSA9PSByb3cgb3Igci5pdGVtLmZpbGUgPT0gcm93XG4gICAgICAgIGVsc2UgcmV0dXJuIHJvd1xuICAgICAgICAgICAgXG4gICAgbmV4dENvbHVtbjogLT4gQGJyb3dzZXIuY29sdW1uIEBpbmRleCsxXG4gICAgcHJldkNvbHVtbjogLT4gQGJyb3dzZXIuY29sdW1uIEBpbmRleC0xXG4gICAgICAgIFxuICAgIG5hbWU6IC0+IFwiI3tAYnJvd3Nlci5uYW1lfToje0BpbmRleH1cIlxuICAgIHBhdGg6IC0+IEBwYXJlbnQ/LmZpbGUgPyAnJ1xuICAgICAgICBcbiAgICBudW1Sb3dzOiAgICAtPiBAcm93cy5sZW5ndGggPyAwICAgXG4gICAgcm93SGVpZ2h0OiAgLT4gQHJvd3NbMF0/LmRpdi5jbGllbnRIZWlnaHQgPyAwXG4gICAgbnVtVmlzaWJsZTogLT4gQHJvd0hlaWdodCgpIGFuZCBwYXJzZUludChAYnJvd3Nlci5oZWlnaHQoKSAvIEByb3dIZWlnaHQoKSkgb3IgMFxuICAgIFxuICAgIHJvd0F0UG9zOiAocG9zKSAtPiBAcm93IEByb3dJbmRleEF0UG9zIHBvc1xuICAgIFxuICAgIHJvd0luZGV4QXRQb3M6IChwb3MpIC0+XG4gICAgICAgIFxuICAgICAgICBNYXRoLm1heCAwLCBNYXRoLmZsb29yIChwb3MueSAtIEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wKSAvIEByb3dIZWlnaHQoKVxuICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGhhc0ZvY3VzOiAtPiBAZGl2LmNsYXNzTGlzdC5jb250YWlucyAnZm9jdXMnXG5cbiAgICBmb2N1czogKG9wdD17fSkgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgbm90IEBhY3RpdmVSb3coKSBhbmQgQG51bVJvd3MoKSBhbmQgb3B0Py5hY3RpdmF0ZSAhPSBmYWxzZVxuICAgICAgICAgICAgQHJvd3NbMF0uc2V0QWN0aXZlKClcbiAgICAgICAgICAgIFxuICAgICAgICBAZGl2LmZvY3VzKClcbiAgICAgICAgQGRpdi5jbGFzc0xpc3QuYWRkICdmb2N1cydcbiAgICAgICAgQFxuICAgICAgICBcbiAgICBvbkZvY3VzOiA9PiBAZGl2LmNsYXNzTGlzdC5hZGQgJ2ZvY3VzJ1xuICAgIG9uQmx1cjogID0+IEBkaXYuY2xhc3NMaXN0LnJlbW92ZSAnZm9jdXMnXG5cbiAgICBmb2N1c0Jyb3dzZXI6IC0+IEBicm93c2VyLmZvY3VzKClcbiAgICBcbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG9uTW91c2VPdmVyOiAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU92ZXIoKVxuICAgIG9uTW91c2VPdXQ6ICAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU91dCgpXG4gICAgXG4gICAgb25EYmxDbGljazogIChldmVudCkgPT4gXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5za2lwT25EYmxDbGljayA9IHRydWVcbiAgICAgICAgQG5hdmlnYXRlQ29scyAnZW50ZXInXG4gICAgXG4gICAgdXBkYXRlQ3J1bWI6ID0+IEBjcnVtYi51cGRhdGVSZWN0IEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgXG4gICAgZXh0ZW5kU2VsZWN0aW9uOiAoa2V5KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGVycm9yIFwibm8gcm93cyBpbiBjb2x1bW4gI3tAaW5kZXh9P1wiIGlmIG5vdCBAbnVtUm93cygpICAgICAgICBcbiAgICAgICAgaW5kZXggPSBAYWN0aXZlUm93KCk/LmluZGV4KCkgPyAtMVxuICAgICAgICBlcnJvciBcIm5vIGluZGV4IGZyb20gYWN0aXZlUm93PyAje2luZGV4fT9cIiwgQGFjdGl2ZVJvdygpIGlmIG5vdCBpbmRleD8gb3IgTnVtYmVyLmlzTmFOIGluZGV4XG4gICAgICAgICAgICBcbiAgICAgICAgdG9JbmRleCA9IHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICAgICAgdGhlbiBpbmRleC0xXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgICAgIHRoZW4gaW5kZXgrMVxuICAgICAgICAgICAgd2hlbiAnaG9tZScgICAgICB0aGVuIDBcbiAgICAgICAgICAgIHdoZW4gJ2VuZCcgICAgICAgdGhlbiBAbnVtUm93cygpLTFcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiBNYXRoLm1heCAwLCBpbmRleC1AbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gTWF0aC5taW4gQG51bVJvd3MoKS0xLCBpbmRleCtAbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICBlbHNlIGluZGV4XG4gICAgXG4gICAgICAgIEBicm93c2VyLnNlbGVjdC50byBAcm93KHRvSW5kZXgpLCB0cnVlXG4gICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuXG4gICAgbmF2aWdhdGVSb3dzOiAoa2V5KSAtPlxuXG4gICAgICAgIHJldHVybiBlcnJvciBcIm5vIHJvd3MgaW4gY29sdW1uICN7QGluZGV4fT9cIiBpZiBub3QgQG51bVJvd3MoKVxuICAgICAgICBpbmRleCA9IEBhY3RpdmVSb3coKT8uaW5kZXgoKSA/IC0xXG4gICAgICAgIGVycm9yIFwibm8gaW5kZXggZnJvbSBhY3RpdmVSb3c/ICN7aW5kZXh9P1wiLCBAYWN0aXZlUm93KCkgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXhcbiAgICAgICAgXG4gICAgICAgIG5ld0luZGV4ID0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIGluZGV4LTFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiBpbmRleCsxXG4gICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gMFxuICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIEBudW1Sb3dzKCktMVxuICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcgICB0aGVuIGluZGV4LUBudW1WaXNpYmxlKClcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgZG93bicgdGhlbiBpbmRleCtAbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICBlbHNlIGluZGV4XG4gICAgICAgICAgICBcbiAgICAgICAgaWYgbm90IG5ld0luZGV4PyBvciBOdW1iZXIuaXNOYU4gbmV3SW5kZXggICAgICAgIFxuICAgICAgICAgICAgZXJyb3IgXCJubyBpbmRleCAje25ld0luZGV4fT8gI3tAbnVtVmlzaWJsZSgpfVwiXG4gICAgICAgICAgICBcbiAgICAgICAgbmV3SW5kZXggPSBjbGFtcCAwLCBAbnVtUm93cygpLTEsIG5ld0luZGV4XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbmV3SW5kZXggPT0gaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAcm93c1tuZXdJbmRleF0/LmFjdGl2YXRlP1xuICAgICAgICAgICAgZXJyb3IgXCJubyByb3cgYXQgaW5kZXggI3tuZXdJbmRleH0vI3tAbnVtUm93cygpLTF9P1wiLCBAbnVtUm93cygpIFxuICAgICAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQHJvd3NbbmV3SW5kZXhdXG4gICAgXG4gICAgbmF2aWdhdGVDb2xzOiAoa2V5KSAtPiAjIG1vdmUgdG8gZmlsZSBicm93c2VyP1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgIHRoZW4gQGJyb3dzZXIubmF2aWdhdGUgJ3VwJ1xuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gQGJyb3dzZXIubmF2aWdhdGUgJ2xlZnQnXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBAYnJvd3Nlci5uYXZpZ2F0ZSAncmlnaHQnXG4gICAgICAgICAgICB3aGVuICdlbnRlcidcbiAgICAgICAgICAgICAgICBpZiBpdGVtID0gQGFjdGl2ZVJvdygpPy5pdGVtXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSBpdGVtLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgaWYgdHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIubG9hZEl0ZW0gaXRlbVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdvcGVuRmlsZScgaXRlbS5maWxlXG4gICAgICAgIEBcblxuICAgIG5hdmlnYXRlUm9vdDogKGtleSkgLT4gXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5icm93c2Ugc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gc2xhc2guZGlyIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gQGFjdGl2ZVJvdygpLml0ZW0uZmlsZVxuICAgICAgICBAXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgIFxuICAgIFxuICAgIGRvU2VhcmNoOiAoY2hhcikgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQG51bVJvd3MoKVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEBzZWFyY2hEaXZcbiAgICAgICAgICAgIEBzZWFyY2hEaXYgPSBlbGVtIGNsYXNzOiAnYnJvd3NlclNlYXJjaCdcbiAgICAgICAgICAgIFxuICAgICAgICBAc2V0U2VhcmNoIEBzZWFyY2ggKyBjaGFyXG4gICAgICAgIFxuICAgIGJhY2tzcGFjZVNlYXJjaDogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBzZWFyY2hEaXYgYW5kIEBzZWFyY2gubGVuZ3RoXG4gICAgICAgICAgICBAc2V0U2VhcmNoIEBzZWFyY2hbMC4uLkBzZWFyY2gubGVuZ3RoLTFdXG4gICAgICAgICAgICBcbiAgICBzZXRTZWFyY2g6IChAc2VhcmNoKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgIGNsZWFyVGltZW91dCBAc2VhcmNoVGltZXJcbiAgICAgICAgQHNlYXJjaFRpbWVyID0gc2V0VGltZW91dCBAY2xlYXJTZWFyY2gsIDIwMDBcbiAgICAgICAgXG4gICAgICAgIEBzZWFyY2hEaXYudGV4dENvbnRlbnQgPSBAc2VhcmNoXG5cbiAgICAgICAgYWN0aXZlSW5kZXggID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gMFxuICAgICAgICBhY3RpdmVJbmRleCArPSAxIGlmIChAc2VhcmNoLmxlbmd0aCA9PSAxKSAjb3IgKGNoYXIgPT0gJycpXG4gICAgICAgIGFjdGl2ZUluZGV4ICA9IDAgaWYgYWN0aXZlSW5kZXggPj0gQG51bVJvd3MoKVxuICAgICAgICBcbiAgICAgICAgZm9yIHJvd3MgaW4gW0Byb3dzLnNsaWNlKGFjdGl2ZUluZGV4KSwgQHJvd3Muc2xpY2UoMCxhY3RpdmVJbmRleCsxKV1cbiAgICAgICAgICAgIGZ1enppZWQgPSBmdXp6eS5maWx0ZXIgQHNlYXJjaCwgcm93cywgZXh0cmFjdDogKHIpIC0+IHIuaXRlbS5uYW1lXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGZ1enppZWQubGVuZ3RoXG4gICAgICAgICAgICAgICAgcm93ID0gZnV6emllZFswXS5vcmlnaW5hbFxuICAgICAgICAgICAgICAgIHJvdy5kaXYuYXBwZW5kQ2hpbGQgQHNlYXJjaERpdlxuICAgICAgICAgICAgICAgIHJvdy5hY3RpdmF0ZSgpXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgQFxuICAgIFxuICAgIGNsZWFyU2VhcmNoOiA9PlxuICAgICAgICBcbiAgICAgICAgQHNlYXJjaCA9ICcnXG4gICAgICAgIEBzZWFyY2hEaXY/LnJlbW92ZSgpXG4gICAgICAgIGRlbGV0ZSBAc2VhcmNoRGl2XG4gICAgICAgIEBcbiAgICBcbiAgICByZW1vdmVPYmplY3Q6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiByb3cgPSBAYWN0aXZlUm93KClcbiAgICAgICAgICAgIG5leHRPclByZXYgPSByb3cubmV4dCgpID8gcm93LnByZXYoKVxuICAgICAgICAgICAgQHJlbW92ZVJvdyByb3dcbiAgICAgICAgICAgIG5leHRPclByZXY/LmFjdGl2YXRlKClcbiAgICAgICAgQFxuXG4gICAgcmVtb3ZlUm93OiAocm93KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgcm93ID09IEBhY3RpdmVSb3coKVxuICAgICAgICAgICAgaWYgQG5leHRDb2x1bW4oKT8ucGFyZW50Py5maWxlID09IHJvdy5pdGVtPy5maWxlXG4gICAgICAgICAgICAgICAgIyBrbG9nICdyZW1vdmVSb3cgY2xlYXInXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW5zRnJvbSBAaW5kZXggKyAxXG4gICAgICAgICAgICBcbiAgICAgICAgcm93LmRpdi5yZW1vdmUoKVxuICAgICAgICBAaXRlbXMuc3BsaWNlIHJvdy5pbmRleCgpLCAxXG4gICAgICAgIEByb3dzLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBzb3J0QnlOYW1lOiA9PlxuICAgICAgICAgXG4gICAgICAgIEByb3dzLnNvcnQgKGEsYikgLT4gXG4gICAgICAgICAgICAoYS5pdGVtLnR5cGUgKyBhLml0ZW0ubmFtZSkubG9jYWxlQ29tcGFyZShiLml0ZW0udHlwZSArIGIuaXRlbS5uYW1lKVxuICAgICAgICAgICAgXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICBAdGFibGUuYXBwZW5kQ2hpbGQgcm93LmRpdlxuICAgICAgICBAXG4gICAgICAgIFxuICAgIHNvcnRCeVR5cGU6ID0+XG4gICAgICAgIFxuICAgICAgICBAcm93cy5zb3J0IChhLGIpIC0+IFxuICAgICAgICAgICAgYXR5cGUgPSBhLml0ZW0udHlwZSA9PSAnZmlsZScgYW5kIHNsYXNoLmV4dChhLml0ZW0ubmFtZSkgb3IgJ19fXycgI2EuaXRlbS50eXBlXG4gICAgICAgICAgICBidHlwZSA9IGIuaXRlbS50eXBlID09ICdmaWxlJyBhbmQgc2xhc2guZXh0KGIuaXRlbS5uYW1lKSBvciAnX19fJyAjYi5pdGVtLnR5cGVcbiAgICAgICAgICAgIChhLml0ZW0udHlwZSArIGF0eXBlICsgYS5pdGVtLm5hbWUpLmxvY2FsZUNvbXBhcmUoYi5pdGVtLnR5cGUgKyBidHlwZSArIGIuaXRlbS5uYW1lLCB1bmRlZmluZWQsIG51bWVyaWM6dHJ1ZSlcbiAgICAgICAgICAgIFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93c1xuICAgICAgICAgICAgQHRhYmxlLmFwcGVuZENoaWxkIHJvdy5kaXZcbiAgICAgICAgQFxuXG4gICAgc29ydEJ5RGF0ZUFkZGVkOiA9PlxuICAgICAgICBcbiAgICAgICAgQHJvd3Muc29ydCAoYSxiKSAtPiBiLml0ZW0uc3RhdD8uYXRpbWVNcyAtIGEuaXRlbS5zdGF0Py5hdGltZU1zXG4gICAgICAgICAgICBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIEB0YWJsZS5hcHBlbmRDaGlsZCByb3cuZGl2XG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIHRvZ2dsZURvdEZpbGVzOiA9PlxuXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICMgbG9nICdjb2x1bW4udG9nZ2xlRG90RmlsZXMnIEBwYXJlbnRcbiAgICAgICAgICAgIEBwYXJlbnQudHlwZSA9IHNsYXNoLmlzRGlyKEBwYXJlbnQuZmlsZSkgYW5kICdkaXInIG9yICdmaWxlJ1xuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSAnZGlyJyAgICAgICAgICAgIFxuICAgICAgICAgICAgc3RhdGVLZXkgPSBcImJyb3dzZXLilrhzaG93SGlkZGVu4pa4I3tAcGFyZW50LmZpbGV9XCJcbiAgICAgICAgICAgIGlmIHByZWZzLmdldCBzdGF0ZUtleVxuICAgICAgICAgICAgICAgIHByZWZzLmRlbCBzdGF0ZUtleVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHByZWZzLnNldCBzdGF0ZUtleSwgdHJ1ZVxuICAgICAgICAgICAgQGJyb3dzZXIubG9hZERpckl0ZW0gQHBhcmVudCwgQGluZGV4LCBpZ25vcmVDYWNoZTp0cnVlXG4gICAgICAgIEBcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgbW92ZVRvVHJhc2g6ID0+XG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IEBicm93c2VyLnNlbGVjdC5mcmVlSW5kZXgoKVxuICAgICAgICBpZiBpbmRleCA+PSAwXG4gICAgICAgICAgICBzZWxlY3RSb3cgPSBAcm93IGluZGV4XG4gICAgICAgIFxuICAgICAgICBmb3Igcm93IGluIEBicm93c2VyLnNlbGVjdC5yb3dzXG4gICAgICAgICAgICB3eHcgJ3RyYXNoJyByb3cucGF0aCgpXG4gICAgICAgICAgICBAcmVtb3ZlUm93IHJvd1xuICAgICAgICAgICBcbiAgICAgICAgaWYgc2VsZWN0Um93XG4gICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IHNlbGVjdFJvd1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbmF2aWdhdGVDb2xzICdsZWZ0J1xuXG4gICAgYWRkVG9TaGVsZjogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHBhdGhUb1NoZWxmID0gQGFjdGl2ZVBhdGgoKVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdhZGRUb1NoZWxmJyBwYXRoVG9TaGVsZlxuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAgMCAgICAgIDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgb3BlblZpZXdlcjogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBhY3RpdmVSb3coKT8uaXRlbS5uYW1lICE9ICcuLicgXG4gICAgICAgICAgICBwYXRoID0gQGFjdGl2ZVBhdGgoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwYXRoID0gQHBhcmVudC5maWxlXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgcGF0aFxuICAgICAgICAgICAgaWYgRmlsZS5pc1RleHQgcGF0aFxuICAgICAgICAgICAgICAgIEBicm93c2VyLnZpZXdlciA9IG5ldyBFZGl0b3IgQGJyb3dzZXIsIHBhdGhcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHNsYXNoLmlzRmlsZSBwYXRoXG4gICAgICAgICAgICAgICAgaWYgbm90IEZpbGUuaXNJbWFnZSBwYXRoXG4gICAgICAgICAgICAgICAgICAgIHBhdGggPSBAcGF0aCgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBicm93c2VyLnZpZXdlciA9IG5ldyBWaWV3ZXIgQGJyb3dzZXIsIHBhdGhcbiAgICAgICAgXG4gICAgbmV3Rm9sZGVyOiA9PlxuICAgICAgICBcbiAgICAgICAgdW51c2VkID0gcmVxdWlyZSAndW51c2VkLWZpbGVuYW1lJ1xuICAgICAgICB1bnVzZWQoc2xhc2guam9pbiBAcGF0aCgpLCAnTmV3IGZvbGRlcicpLnRoZW4gKG5ld0RpcikgPT5cbiAgICAgICAgICAgIGZzLm1rZGlyIG5ld0RpciwgKGVycikgPT5cbiAgICAgICAgICAgICAgICBpZiBlbXB0eSBlcnJcbiAgICAgICAgICAgICAgICAgICAgcm93ID0gQGluc2VydEZpbGUgbmV3RGlyXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgcm93XG4gICAgICAgICAgICAgICAgICAgIHJvdy5lZGl0TmFtZSgpXG4gICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGR1cGxpY2F0ZUZpbGU6ID0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBmaWxlIGluIEBicm93c2VyLnNlbGVjdC5maWxlcygpXG4gICAgICAgICAgICBGaWxlLmR1cGxpY2F0ZSBmaWxlLCAoc291cmNlLCB0YXJnZXQpID0+XG4gICAgICAgICAgICAgICAgaWYgQHBhcmVudC50eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICBjb2wgPSBAcHJldkNvbHVtbigpXG4gICAgICAgICAgICAgICAgICAgIGNvbC5mb2N1cygpXG4gICAgICAgICAgICAgICAgZWxzZSBjb2wgPSBAXG4gICAgICAgICAgICAgICAgcm93ID0gY29sLmluc2VydEZpbGUgdGFyZ2V0XG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyByb3dcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGV4cGxvcmVyOiA9PlxuICAgICAgICBcbiAgICAgICAgb3BlbiBzbGFzaC5kaXIgQGFjdGl2ZVBhdGgoKVxuICAgICAgICBcbiAgICBvcGVuOiA9PlxuXG4gICAgICAgIG9wZW4gQGFjdGl2ZVBhdGgoKVxuICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIFxuICAgICAgICBcbiAgICBtYWtlUm9vdDogPT4gXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5zaGlmdENvbHVtbnNUbyBAaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGlmIEBicm93c2VyLmNvbHVtbnNbMF0uaXRlbXNbMF0ubmFtZSAhPSAnLi4nXG4gICAgICAgICAgICBAdW5zaGlmdEl0ZW0gXG4gICAgICAgICAgICAgICAgbmFtZTogJy4uJ1xuICAgICAgICAgICAgICAgIHR5cGU6ICdkaXInXG4gICAgICAgICAgICAgICAgZmlsZTogc2xhc2guZGlyIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAY3J1bWIuc2V0RmlsZSBAcGFyZW50LmZpbGVcbiAgICBcbiAgICBvbkNvbnRleHRNZW51OiAoZXZlbnQsIGNvbHVtbikgPT4gXG4gICAgICAgIFxuICAgICAgICBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgXG4gICAgICAgIGFic1BvcyA9IGtwb3MgZXZlbnRcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBjb2x1bW5cbiAgICAgICAgICAgIEBzaG93Q29udGV4dE1lbnUgYWJzUG9zXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgb3B0ID0gaXRlbXM6IFsgXG4gICAgICAgICAgICAgICAgdGV4dDogICAnUm9vdCdcbiAgICAgICAgICAgICAgICBjYjogICAgIEBtYWtlUm9vdFxuICAgICAgICAgICAgLFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgJ0FkZCB0byBTaGVsZidcbiAgICAgICAgICAgICAgICBjb21ibzogICdhbHQrc2hpZnQrLidcbiAgICAgICAgICAgICAgICBjYjogICAgID0+IHBvc3QuZW1pdCAnYWRkVG9TaGVsZicgQHBhcmVudC5maWxlXG4gICAgICAgICAgICAsXG4gICAgICAgICAgICAgICAgdGV4dDogICAnRXhwbG9yZXInXG4gICAgICAgICAgICAgICAgY29tYm86ICAnYWx0K2UnIFxuICAgICAgICAgICAgICAgIGNiOiAgICAgPT4gb3BlbiBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIF1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgb3B0LnggPSBhYnNQb3MueFxuICAgICAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICAgICAgcG9wdXAubWVudSBvcHQgICAgXG4gICAgICAgICAgICAgIFxuICAgIHNob3dDb250ZXh0TWVudTogKGFic1BvcykgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBhYnNQb3M/XG4gICAgICAgICAgICBhYnNQb3MgPSBrcG9zIEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcbiAgICAgICAgXG4gICAgICAgIG9wdCA9IGl0ZW1zOiBbIFxuICAgICAgICAgICAgdGV4dDogICAnT3BlbidcbiAgICAgICAgICAgIGNvbWJvOiAgJ3JldHVybiBhbHQrbydcbiAgICAgICAgICAgIGNiOiAgICAgQG9wZW5cbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnVmlld2VyJ1xuICAgICAgICAgICAgY29tYm86ICAnc3BhY2UgYWx0K3YnIFxuICAgICAgICAgICAgY2I6ICAgICBAb3BlblZpZXdlclxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdFeHBsb3JlcidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQGV4cGxvcmVyXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJydcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnQWRkIHRvIFNoZWxmJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K3NoaWZ0Ky4nXG4gICAgICAgICAgICBjYjogICAgIEBhZGRUb1NoZWxmXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJydcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnTW92ZSB0byBUcmFzaCdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrYmFja3NwYWNlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQG1vdmVUb1RyYXNoXG4gICAgICAgICwgICBcbiAgICAgICAgICAgIHRleHQ6ICAgJydcbiAgICAgICAgICAgIGhpZGU6ICAgQHBhcmVudC50eXBlID09ICdmaWxlJ1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdEdXBsaWNhdGUnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2QnIFxuICAgICAgICAgICAgY2I6ICAgICBAZHVwbGljYXRlRmlsZVxuICAgICAgICAgICAgaGlkZTogICBAcGFyZW50LnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICwgICBcbiAgICAgICAgICAgIHRleHQ6ICAgJ05ldyBGb2xkZXInXG4gICAgICAgICAgICBjb21ibzogICdhbHQrbicgXG4gICAgICAgICAgICBjYjogICAgIEBuZXdGb2xkZXJcbiAgICAgICAgICAgIGhpZGU6ICAgQHBhcmVudC50eXBlID09ICdmaWxlJ1xuICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgIT0gJ2ZpbGUnXG4gICAgICAgICAgICBvcHQuaXRlbXMgPSBvcHQuaXRlbXMuY29uY2F0IFtcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICcnXG4gICAgICAgICAgICAsICAgXG4gICAgICAgICAgICAgICAgdGV4dDogICAnU29ydCdcbiAgICAgICAgICAgICAgICBtZW51OiBbXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdCeSBOYW1lJyBjb21ibzonY3RybCtuJywgY2I6QHNvcnRCeU5hbWVcbiAgICAgICAgICAgICAgICAsXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdCeSBUeXBlJyBjb21ibzonY3RybCt0JywgY2I6QHNvcnRCeVR5cGVcbiAgICAgICAgICAgICAgICAsXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdCeSBEYXRlJyBjb21ibzonY3RybCthJywgY2I6QHNvcnRCeURhdGVBZGRlZFxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgICAgICBvcHQuaXRlbXMgPSBvcHQuaXRlbXMuY29uY2F0IHdpbmRvdy50aXRsZWJhci5tYWtlVGVtcGxhdGUgcmVxdWlyZSAnLi9tZW51Lmpzb24nXG4gICAgICAgIFxuICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgcG9wdXAubWVudSBvcHQgICAgICAgIFxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG9uS2V5OiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnc2hpZnQrYCcgJ34nICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIuYnJvd3NlICd+J1xuICAgICAgICAgICAgd2hlbiAnLycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIuYnJvd3NlICcvJ1xuICAgICAgICAgICAgd2hlbiAnYWx0K3NoaWZ0Ky4nICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGFkZFRvU2hlbGYoKVxuICAgICAgICAgICAgd2hlbiAnYWx0K2UnICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBleHBsb3JlcigpXG4gICAgICAgICAgICB3aGVuICdhbHQrbycgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQG9wZW4oKVxuICAgICAgICAgICAgd2hlbiAnYWx0K24nICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBuZXdGb2xkZXIoKVxuICAgICAgICAgICAgd2hlbiAnc3BhY2UnICdhbHQrdicgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBvcGVuVmlld2VyKClcbiAgICAgICAgICAgIHdoZW4gJ3NoaWZ0K3VwJyAnc2hpZnQrZG93bicgJ3NoaWZ0K2hvbWUnICdzaGlmdCtlbmQnICdzaGlmdCtwYWdlIHVwJyAnc2hpZnQrcGFnZSBkb3duJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBleHRlbmRTZWxlY3Rpb24ga2V5XG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAncGFnZSBkb3duJyAnaG9tZScgJ2VuZCcgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzIGtleVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCt1cCcgJ2N0cmwrdXAnICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyAnaG9tZSdcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZG93bicgJ2N0cmwrZG93bicgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3MgJ2VuZCdcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJydhbHQrdXAnICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZUNvbHMga2V5XG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5vbkJhY2tzcGFjZUluQ29sdW1uIEBcbiAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZScgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLm9uRGVsZXRlSW5Db2x1bW4gQFxuICAgICAgICAgICAgd2hlbiAnY3RybCt0JyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeVR5cGUoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtuJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeU5hbWUoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCthJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeURhdGVBZGRlZCgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2knICdjdHJsK2knICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAdG9nZ2xlRG90RmlsZXMoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtkJyAnY3RybCtkJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGR1cGxpY2F0ZUZpbGUoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtrJyAnY3RybCtrJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCBpZiBAYnJvd3Nlci5jbGVhblVwKClcbiAgICAgICAgICAgIHdoZW4gJ2YyJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBhY3RpdmVSb3coKT8uZWRpdE5hbWUoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtsZWZ0JyAnY29tbWFuZCtyaWdodCcgJ2N0cmwrbGVmdCcgJ2N0cmwrcmlnaHQnXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm9vdCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrYmFja3NwYWNlJyAnY3RybCtiYWNrc3BhY2UnICdjb21tYW5kK2RlbGV0ZScgJ2N0cmwrZGVsZXRlJyBcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbW92ZVRvVHJhc2goKVxuICAgICAgICAgICAgd2hlbiAndGFiJyAgICBcbiAgICAgICAgICAgICAgICBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBkb1NlYXJjaCAnJ1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgICAgIHdoZW4gJ2VzYydcbiAgICAgICAgICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgICAgICAgICBAZHJhZ0Rpdi5kcmFnLmRyYWdTdG9wKClcbiAgICAgICAgICAgICAgICAgICAgQGRyYWdEaXYucmVtb3ZlKClcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEBkcmFnRGl2XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKS5sZW5ndGggPiAxXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBjbGVhclNlYXJjaCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuXG4gICAgICAgIGlmIGNvbWJvIGluIFsndXAnICAgJ2Rvd24nXSAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzIGtleSAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbWJvIGluIFsnbGVmdCcgJ3JpZ2h0J10gdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVDb2xzIGtleVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG1vZCBpbiBbJ3NoaWZ0JyAnJ10gYW5kIGNoYXIgdGhlbiBAZG9TZWFyY2ggY2hhclxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgIEB1cGRhdGVEcmFnSW5kaWNhdG9yIGV2ZW50XG4gICAgICAgICAgICBcbiAgICBvbktleVVwOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgQHVwZGF0ZURyYWdJbmRpY2F0b3IgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBDb2x1bW5cblxuXG4iXX0=
//# sourceURL=../coffee/column.coffee