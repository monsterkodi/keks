// koffee 1.4.0

/*
 0000000   0000000   000      000   000  00     00  000   000
000       000   000  000      000   000  000   000  0000  000
000       000   000  000      000   000  000000000  000 0 000
000       000   000  000      000   000  000 0 000  000  0000
 0000000   0000000   0000000   0000000   000   000  000   000
 */
var Column, Crumb, Editor, File, Row, Scroller, Viewer, _, clamp, drag, elem, empty, fs, fuzzy, kerror, keyinfo, klog, kpos, open, popup, post, prefs, ref, slash, stopEvent, valid, wxw,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, stopEvent = ref.stopEvent, keyinfo = ref.keyinfo, valid = ref.valid, slash = ref.slash, empty = ref.empty, clamp = ref.clamp, prefs = ref.prefs, popup = ref.popup, elem = ref.elem, drag = ref.drag, kpos = ref.kpos, open = ref.open, fs = ref.fs, kerror = ref.kerror, klog = ref.klog, _ = ref._;

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

    Column.prototype.width = function() {
        return this.div.getBoundingClientRect().width;
    };

    Column.prototype.onDragStart = function(d, e) {
        var ref1;
        this.dragStartRow = this.row(e.target);
        this.browser.skipOnDblClick = false;
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
        var i, len, pos, ref1, row, rowClone;
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
            this.dragDiv.style.position = 'absolute';
            this.dragDiv.style.opacity = "0.7";
            this.dragDiv.style.top = (pos.y - d.deltaSum.y) + "px";
            this.dragDiv.style.left = (pos.x - d.deltaSum.x) + "px";
            this.dragDiv.style.width = (this.width() - 12) + "px";
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
        return slash.unused(slash.join(this.path(), 'New folder'), (function(_this) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sdW1uLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxvTEFBQTtJQUFBOztBQVFBLE1BQXNILE9BQUEsQ0FBUSxLQUFSLENBQXRILEVBQUUsZUFBRixFQUFRLHlCQUFSLEVBQW1CLHFCQUFuQixFQUE0QixpQkFBNUIsRUFBbUMsaUJBQW5DLEVBQTBDLGlCQUExQyxFQUFpRCxpQkFBakQsRUFBd0QsaUJBQXhELEVBQStELGlCQUEvRCxFQUFzRSxlQUF0RSxFQUE0RSxlQUE1RSxFQUFrRixlQUFsRixFQUF3RixlQUF4RixFQUE4RixXQUE5RixFQUFrRyxtQkFBbEcsRUFBMEcsZUFBMUcsRUFBZ0g7O0FBRWhILEdBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLGtCQUFSOztBQUNYLElBQUEsR0FBVyxPQUFBLENBQVEsY0FBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsTUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7QUFDWCxLQUFBLEdBQVcsT0FBQSxDQUFRLE9BQVI7O0FBQ1gsR0FBQSxHQUFXLE9BQUEsQ0FBUSxLQUFSOztBQUVMO0lBRUMsZ0JBQUMsT0FBRDtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsVUFBRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBRUEsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUNmLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUVWLElBQUMsQ0FBQSxHQUFELEdBQVMsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxlQUFQO1lBQXVCLFFBQUEsRUFBUyxDQUFoQztTQUFMO1FBQ1QsSUFBQyxDQUFBLEtBQUQs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aUIsSUFBQyxDQUFBLFlBQUQsQ0FBYyxHQUFkLENBQWpCLEVBQXpDOztRQUNBLElBQUcsS0FBQSxLQUFVLE1BQVYsSUFBQSxLQUFBLEtBQWlCLE9BQXBCO0FBQWtDLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxZQUFELENBQWMsR0FBZCxDQUFqQixFQUF6Qzs7UUFFQSxJQUFHLENBQUEsR0FBQSxLQUFRLE9BQVIsSUFBQSxHQUFBLEtBQWdCLEVBQWhCLENBQUEsSUFBd0IsSUFBM0I7WUFBcUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLEVBQXJDOztRQUVBLElBQUcsSUFBQyxDQUFBLE9BQUo7bUJBQ0ksSUFBQyxDQUFBLG1CQUFELENBQXFCLEtBQXJCLEVBREo7O0lBaERHOztxQkFtRFAsT0FBQSxHQUFTLFNBQUMsS0FBRDtRQUVMLElBQUcsSUFBQyxDQUFBLE9BQUo7bUJBQ0ksSUFBQyxDQUFBLG1CQUFELENBQXFCLEtBQXJCLEVBREo7O0lBRks7Ozs7OztBQUtiLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCBzdG9wRXZlbnQsIGtleWluZm8sIHZhbGlkLCBzbGFzaCwgZW1wdHksIGNsYW1wLCBwcmVmcywgcG9wdXAsIGVsZW0sIGRyYWcsIGtwb3MsIG9wZW4sIGZzLCBrZXJyb3IsIGtsb2csIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuUm93ICAgICAgPSByZXF1aXJlICcuL3JvdydcblNjcm9sbGVyID0gcmVxdWlyZSAnLi90b29scy9zY3JvbGxlcidcbkZpbGUgICAgID0gcmVxdWlyZSAnLi90b29scy9maWxlJ1xuVmlld2VyICAgPSByZXF1aXJlICcuL3ZpZXdlcidcbkVkaXRvciAgID0gcmVxdWlyZSAnLi9lZGl0b3InXG5DcnVtYiAgICA9IHJlcXVpcmUgJy4vY3J1bWInXG5mdXp6eSAgICA9IHJlcXVpcmUgJ2Z1enp5J1xud3h3ICAgICAgPSByZXF1aXJlICd3eHcnXG5cbmNsYXNzIENvbHVtblxuICAgIFxuICAgIEA6IChAYnJvd3NlcikgLT5cbiAgICAgICAgXG4gICAgICAgIEBzZWFyY2hUaW1lciA9IG51bGxcbiAgICAgICAgQHNlYXJjaCA9ICcnXG4gICAgICAgIEBpdGVtcyAgPSBbXVxuICAgICAgICBAcm93cyAgID0gW11cbiAgICAgICAgXG4gICAgICAgIEBkaXYgICA9IGVsZW0gY2xhc3M6ICdicm93c2VyQ29sdW1uJyB0YWJJbmRleDo2XG4gICAgICAgIEB0YWJsZSA9IGVsZW0gY2xhc3M6ICdicm93c2VyQ29sdW1uVGFibGUnXG4gICAgICAgIEBkaXYuYXBwZW5kQ2hpbGQgQHRhYmxlXG4gICAgICAgIFxuICAgICAgICBAc2V0SW5kZXggQGJyb3dzZXIuY29sdW1ucz8ubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5jb2xzPy5hcHBlbmRDaGlsZCBAZGl2XG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2ZvY3VzJyAgICAgQG9uRm9jdXNcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdibHVyJyAgICAgIEBvbkJsdXJcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJyAgIEBvbktleVxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2tleXVwJyAgICAgQG9uS2V5VXBcbiAgICAgICAgXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2VvdmVyJyBAb25Nb3VzZU92ZXJcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdtb3VzZW91dCcgIEBvbk1vdXNlT3V0XG5cbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdkYmxjbGljaycgIEBvbkRibENsaWNrXG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2NvbnRleHRtZW51JyBAb25Db250ZXh0TWVudVxuICBcbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQGRpdlxuICAgICAgICAgICAgb25TdGFydDogQG9uRHJhZ1N0YXJ0XG4gICAgICAgICAgICBvbk1vdmU6ICBAb25EcmFnTW92ZVxuICAgICAgICAgICAgb25TdG9wOiAgQG9uRHJhZ1N0b3BcbiAgICAgICAgXG4gICAgICAgIEBjcnVtYiAgPSBuZXcgQ3J1bWIgQFxuICAgICAgICBAc2Nyb2xsID0gbmV3IFNjcm9sbGVyIEBcbiAgICAgICAgXG4gICAgc2V0SW5kZXg6IChAaW5kZXgpIC0+XG4gICAgICAgIFxuICAgICAgICBAY3J1bWI/LmVsZW0uY29sdW1uSW5kZXggPSBAaW5kZXhcbiAgICAgICAgXG4gICAgd2lkdGg6IC0+IEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGhcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBvbkRyYWdTdGFydDogKGQsIGUpID0+IFxuICAgIFxuICAgICAgICBAZHJhZ1N0YXJ0Um93ID0gQHJvdyBlLnRhcmdldFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuc2tpcE9uRGJsQ2xpY2sgPSBmYWxzZVxuICAgICAgICBcbiAgICAgICAgZGVsZXRlIEB0b2dnbGVcbiAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnU3RhcnRSb3dcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZS5zaGlmdEtleVxuICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC50byBAZHJhZ1N0YXJ0Um93XG4gICAgICAgICAgICBlbHNlIGlmIGUubWV0YUtleSBvciBlLmFsdEtleSBvciBlLmN0cmxLZXlcbiAgICAgICAgICAgICAgICBpZiBub3Qgcm93LmlzU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3QudG9nZ2xlIEBkcmFnU3RhcnRSb3dcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEB0b2dnbGUgPSB0cnVlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgQGRyYWdTdGFydFJvdy5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgICAgICAgICAgQGRlc2VsZWN0ID0gdHJ1ZVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGFjdGl2ZVJvdygpPy5jbGVhckFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQGRyYWdTdGFydFJvdywgZmFsc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGhhc0ZvY3VzKCkgYW5kIEBhY3RpdmVSb3coKVxuICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQGFjdGl2ZVJvdygpXG5cbiAgICBvbkRyYWdNb3ZlOiAoZCxlKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdTdGFydFJvdyBhbmQgbm90IEBkcmFnRGl2IGFuZCB2YWxpZCBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gaWYgTWF0aC5hYnMoZC5kZWx0YVN1bS54KSA8IDIwIGFuZCBNYXRoLmFicyhkLmRlbHRhU3VtLnkpIDwgMTBcblxuICAgICAgICAgICAgZGVsZXRlIEB0b2dnbGUgXG4gICAgICAgICAgICBkZWxldGUgQGRlc2VsZWN0XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBkcmFnRGl2ID0gZWxlbSAnZGl2J1xuICAgICAgICAgICAgQGRyYWdEaXYuZHJhZyA9IGRcbiAgICAgICAgICAgIHBvcyA9IGtwb3MgZS5wYWdlWCwgZS5wYWdlWVxuICAgICAgICAgICAgcm93ID0gQGJyb3dzZXIuc2VsZWN0LnJvd3NbMF1cblxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5vcGFjaXR5ICA9IFwiMC43XCJcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLnRvcCAgPSBcIiN7cG9zLnktZC5kZWx0YVN1bS55fXB4XCJcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLmxlZnQgPSBcIiN7cG9zLngtZC5kZWx0YVN1bS54fXB4XCJcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLndpZHRoID0gXCIje0B3aWR0aCgpLTEyfXB4XCJcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGRyYWdJbmQgPSBlbGVtIGNsYXNzOidkcmFnSW5kaWNhdG9yJ1xuICAgICAgICAgICAgQGRyYWdEaXYuYXBwZW5kQ2hpbGQgQGRyYWdJbmRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIHJvdyBpbiBAYnJvd3Nlci5zZWxlY3Qucm93c1xuICAgICAgICAgICAgICAgIHJvd0Nsb25lID0gcm93LmRpdi5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICAgICAgICAgIHJvd0Nsb25lLnN0eWxlLmZsZXggPSAndW5zZXQnXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJ1xuICAgICAgICAgICAgICAgIHJvd0Nsb25lLnN0eWxlLmJvcmRlciA9ICdub25lJ1xuICAgICAgICAgICAgICAgIHJvd0Nsb25lLnN0eWxlLm1hcmdpbkJvdHRvbSA9ICctMXB4J1xuICAgICAgICAgICAgICAgIEBkcmFnRGl2LmFwcGVuZENoaWxkIHJvd0Nsb25lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkIEBkcmFnRGl2XG4gICAgICAgICAgICBAZm9jdXMgYWN0aXZhdGU6ZmFsc2VcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAdXBkYXRlRHJhZ0luZGljYXRvciBlICAgICAgXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZVgoI3tkLmRlbHRhU3VtLnh9cHgpIHRyYW5zbGF0ZVkoI3tkLmRlbHRhU3VtLnl9cHgpXCJcblxuICAgIHVwZGF0ZURyYWdJbmRpY2F0b3I6IChldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBkcmFnSW5kPy5jbGFzc0xpc3QudG9nZ2xlICdjb3B5JyBldmVudC5zaGlmdEtleVxuICAgICAgICBAZHJhZ0luZD8uY2xhc3NMaXN0LnRvZ2dsZSAnbW92ZScgZXZlbnQuY3RybEtleSBvciBldmVudC5tZXRhS2V5IG9yIGV2ZW50LmFsdEtleVxuICAgICAgICAgICAgXG4gICAgb25EcmFnU3RvcDogKGQsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnRGl2P1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZHJhZ0Rpdi5yZW1vdmUoKVxuICAgICAgICAgICAgZGVsZXRlIEBkcmFnRGl2XG4gICAgICAgICAgICBkZWxldGUgQGRyYWdTdGFydFJvd1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiByb3cgPSBAYnJvd3Nlci5yb3dBdFBvcyBkLnBvc1xuICAgICAgICAgICAgICAgIGNvbHVtbiA9IHJvdy5jb2x1bW5cbiAgICAgICAgICAgICAgICB0YXJnZXQgPSByb3cuaXRlbS5maWxlXG4gICAgICAgICAgICBlbHNlIGlmIGNvbHVtbiA9IEBicm93c2VyLmNvbHVtbkF0UG9zIGQucG9zXG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gY29sdW1uLnBhcmVudD8uZmlsZVxuICAgICAgICAgICAgZWxzZSBpZiBjb2x1bW4gPSBAYnJvd3Nlci5jb2x1bW5BdFggZC5wb3MueFxuICAgICAgICAgICAgICAgIHRhcmdldCA9IGNvbHVtbi5wYXJlbnQ/LmZpbGVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBrbG9nICdubyBkcm9wIHRhcmdldCdcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGFjdGlvbiA9IGUuc2hpZnRLZXkgYW5kICdjb3B5JyBvciAnbW92ZSdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGNvbHVtbiA9PSBAYnJvd3Nlci5zaGVsZiBcbiAgICAgICAgICAgICAgICBpZiB0YXJnZXQgYW5kIChlLmN0cmxLZXkgb3IgZS5zaGlmdEtleSBvciBlLm1ldGFLZXkgb3IgZS5hbHRLZXkpXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLmRyb3BBY3Rpb24gYWN0aW9uLCBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKSwgdGFyZ2V0XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zaGVsZi5hZGRGaWxlcyBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKSwgcG9zOmQucG9zXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuZHJvcEFjdGlvbiBhY3Rpb24sIEBicm93c2VyLnNlbGVjdC5maWxlcygpLCB0YXJnZXRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZm9jdXMgYWN0aXZhdGU6ZmFsc2VcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcm93ID0gQHJvdyBlLnRhcmdldFxuICAgICAgICAgICAgICAgIGlmIHJvdy5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgICAgICAgICAgaWYgZS5tZXRhS2V5IG9yIGUuYWx0S2V5IG9yIGUuY3RybEtleSBvciBlLnNoaWZ0S2V5XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAdG9nZ2xlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEB0b2dnbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3QudG9nZ2xlIHJvd1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAZGVzZWxlY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgQGRlc2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyByb3dcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3cuYWN0aXZhdGUoKVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgcmVtb3ZlRmlsZTogKGZpbGUpID0+IFxuICAgICAgICBcbiAgICAgICAgaWYgcm93ID0gQHJvdyBzbGFzaC5maWxlIGZpbGVcbiAgICAgICAgICAgIEByZW1vdmVSb3cgcm93XG4gICAgICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICBcbiAgICBpbnNlcnRGaWxlOiAoZmlsZSkgPT4gXG5cbiAgICAgICAgaXRlbSA9IEBicm93c2VyLmZpbGVJdGVtIGZpbGVcbiAgICAgICAgcm93ID0gbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIEByb3dzLnB1c2ggcm93XG4gICAgICAgIHJvd1xuICAgIFxuICAgIGxvYWRJdGVtczogKGl0ZW1zLCBwYXJlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5jbGVhckNvbHVtbiBAaW5kZXhcbiAgICAgICAgXG4gICAgICAgIEBpdGVtcyAgPSBpdGVtc1xuICAgICAgICBAcGFyZW50ID0gcGFyZW50XG4gICAgICAgIFxuICAgICAgICBAY3J1bWIuc2V0RmlsZSBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09IHVuZGVmaW5lZFxuICAgICAgICAgICAgQHBhcmVudC50eXBlID0gc2xhc2guaXNEaXIoQHBhcmVudC5maWxlKSBhbmQgJ2Rpcicgb3IgJ2ZpbGUnXG4gICAgICAgIFxuICAgICAgICBrZXJyb3IgXCJubyBwYXJlbnQgaXRlbT9cIiBpZiBub3QgQHBhcmVudD9cbiAgICAgICAga2Vycm9yIFwibG9hZEl0ZW1zIC0tIG5vIHBhcmVudCB0eXBlP1wiLCBAcGFyZW50IGlmIG5vdCBAcGFyZW50LnR5cGU/XG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAaXRlbXNcbiAgICAgICAgICAgIGZvciBpdGVtIGluIEBpdGVtc1xuICAgICAgICAgICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIFxuICAgICAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSAnZGlyJyBhbmQgc2xhc2guc2FtZVBhdGggJ34vRG93bmxvYWRzJyBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIEBzb3J0QnlEYXRlQWRkZWQoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgIHVuc2hpZnRJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBpdGVtcy51bnNoaWZ0IGl0ZW1cbiAgICAgICAgQHJvd3MudW5zaGlmdCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgQHRhYmxlLmluc2VydEJlZm9yZSBAdGFibGUubGFzdENoaWxkLCBAdGFibGUuZmlyc3RDaGlsZFxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgIEByb3dzWzBdXG4gICAgICAgIFxuICAgIHB1c2hJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBpdGVtcy5wdXNoIGl0ZW1cbiAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAcm93c1stMV1cbiAgICAgICAgXG4gICAgYWRkSXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIFxuICAgICAgICByb3cgPSBAcHVzaEl0ZW0gaXRlbVxuICAgICAgICBAc29ydEJ5TmFtZSgpXG4gICAgICAgIHJvd1xuXG4gICAgc2V0SXRlbXM6IChAaXRlbXMsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmNsZWFyQ29sdW1uIEBpbmRleFxuICAgICAgICBcbiAgICAgICAgQHBhcmVudCA9IG9wdC5wYXJlbnRcbiAgICAgICAga2Vycm9yIFwibm8gcGFyZW50IGl0ZW0/XCIgaWYgbm90IEBwYXJlbnQ/XG4gICAgICAgIGtlcnJvciBcInNldEl0ZW1zIC0tIG5vIHBhcmVudCB0eXBlP1wiLCBAcGFyZW50IGlmIG5vdCBAcGFyZW50LnR5cGU/XG4gICAgICAgIFxuICAgICAgICBmb3IgaXRlbSBpbiBAaXRlbXNcbiAgICAgICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIFxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgIEBcblxuICAgIGlzRGlyOiAgLT4gQHBhcmVudD8udHlwZSA9PSAnZGlyJyBcbiAgICBpc0ZpbGU6IC0+IEBwYXJlbnQ/LnR5cGUgPT0gJ2ZpbGUnIFxuICAgICAgICBcbiAgICBpc0VtcHR5OiAtPiBlbXB0eSBAcGFyZW50XG4gICAgY2xlYXI6ICAgLT5cbiAgICAgICAgQGNsZWFyU2VhcmNoKClcbiAgICAgICAgZGVsZXRlIEBwYXJlbnRcbiAgICAgICAgQGRpdi5zY3JvbGxUb3AgPSAwXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBAY3J1bWIuY2xlYXIoKVxuICAgICAgICBAcm93cyA9IFtdXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAwMDAwMCAgXG4gICBcbiAgICBhY3RpdmF0ZVJvdzogKHJvdykgLT4gQHJvdyhyb3cpPy5hY3RpdmF0ZSgpXG4gICAgICAgXG4gICAgYWN0aXZlUm93OiAtPiBfLmZpbmQgQHJvd3MsIChyKSAtPiByLmlzQWN0aXZlKClcbiAgICBhY3RpdmVQYXRoOiAtPiBAYWN0aXZlUm93KCk/LnBhdGgoKSA/IEBwYXJlbnQuZmlsZVxuICAgIFxuICAgIHJvdzogKHJvdykgLT4gIyBhY2NlcHRzIGVsZW1lbnQsIGluZGV4LCBzdHJpbmcgb3Igcm93XG4gICAgICAgIGlmICAgICAgXy5pc051bWJlciAgcm93IHRoZW4gcmV0dXJuIDAgPD0gcm93IDwgQG51bVJvd3MoKSBhbmQgQHJvd3Nbcm93XSBvciBudWxsXG4gICAgICAgIGVsc2UgaWYgXy5pc0VsZW1lbnQgcm93IHRoZW4gcmV0dXJuIF8uZmluZCBAcm93cywgKHIpIC0+IHIuZGl2LmNvbnRhaW5zIHJvd1xuICAgICAgICBlbHNlIGlmIF8uaXNTdHJpbmcgIHJvdyB0aGVuIHJldHVybiBfLmZpbmQgQHJvd3MsIChyKSAtPiByLml0ZW0ubmFtZSA9PSByb3cgb3Igci5pdGVtLmZpbGUgPT0gcm93XG4gICAgICAgIGVsc2UgcmV0dXJuIHJvd1xuICAgICAgICAgICAgXG4gICAgbmV4dENvbHVtbjogLT4gQGJyb3dzZXIuY29sdW1uIEBpbmRleCsxXG4gICAgcHJldkNvbHVtbjogLT4gQGJyb3dzZXIuY29sdW1uIEBpbmRleC0xXG4gICAgICAgIFxuICAgIG5hbWU6IC0+IFwiI3tAYnJvd3Nlci5uYW1lfToje0BpbmRleH1cIlxuICAgIHBhdGg6IC0+IEBwYXJlbnQ/LmZpbGUgPyAnJ1xuICAgICAgICBcbiAgICBudW1Sb3dzOiAgICAtPiBAcm93cy5sZW5ndGggPyAwICAgXG4gICAgcm93SGVpZ2h0OiAgLT4gQHJvd3NbMF0/LmRpdi5jbGllbnRIZWlnaHQgPyAwXG4gICAgbnVtVmlzaWJsZTogLT4gQHJvd0hlaWdodCgpIGFuZCBwYXJzZUludChAYnJvd3Nlci5oZWlnaHQoKSAvIEByb3dIZWlnaHQoKSkgb3IgMFxuICAgIFxuICAgIHJvd0F0UG9zOiAocG9zKSAtPiBAcm93IEByb3dJbmRleEF0UG9zIHBvc1xuICAgIFxuICAgIHJvd0luZGV4QXRQb3M6IChwb3MpIC0+XG4gICAgICAgIFxuICAgICAgICBNYXRoLm1heCAwLCBNYXRoLmZsb29yIChwb3MueSAtIEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wKSAvIEByb3dIZWlnaHQoKVxuICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGhhc0ZvY3VzOiAtPiBAZGl2LmNsYXNzTGlzdC5jb250YWlucyAnZm9jdXMnXG5cbiAgICBmb2N1czogKG9wdD17fSkgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgbm90IEBhY3RpdmVSb3coKSBhbmQgQG51bVJvd3MoKSBhbmQgb3B0Py5hY3RpdmF0ZSAhPSBmYWxzZVxuICAgICAgICAgICAgQHJvd3NbMF0uc2V0QWN0aXZlKClcbiAgICAgICAgICAgIFxuICAgICAgICBAZGl2LmZvY3VzKClcbiAgICAgICAgQGRpdi5jbGFzc0xpc3QuYWRkICdmb2N1cydcbiAgICAgICAgQFxuICAgICAgICBcbiAgICBvbkZvY3VzOiA9PiBAZGl2LmNsYXNzTGlzdC5hZGQgJ2ZvY3VzJ1xuICAgIG9uQmx1cjogID0+IEBkaXYuY2xhc3NMaXN0LnJlbW92ZSAnZm9jdXMnXG5cbiAgICBmb2N1c0Jyb3dzZXI6IC0+IEBicm93c2VyLmZvY3VzKClcbiAgICBcbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG9uTW91c2VPdmVyOiAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU92ZXIoKVxuICAgIG9uTW91c2VPdXQ6ICAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU91dCgpXG4gICAgXG4gICAgb25EYmxDbGljazogIChldmVudCkgPT4gXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5za2lwT25EYmxDbGljayA9IHRydWVcbiAgICAgICAgQG5hdmlnYXRlQ29scyAnZW50ZXInXG4gICAgXG4gICAgdXBkYXRlQ3J1bWI6ID0+IEBjcnVtYi51cGRhdGVSZWN0IEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgXG4gICAgZXh0ZW5kU2VsZWN0aW9uOiAoa2V5KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGVycm9yIFwibm8gcm93cyBpbiBjb2x1bW4gI3tAaW5kZXh9P1wiIGlmIG5vdCBAbnVtUm93cygpICAgICAgICBcbiAgICAgICAgaW5kZXggPSBAYWN0aXZlUm93KCk/LmluZGV4KCkgPyAtMVxuICAgICAgICBlcnJvciBcIm5vIGluZGV4IGZyb20gYWN0aXZlUm93PyAje2luZGV4fT9cIiwgQGFjdGl2ZVJvdygpIGlmIG5vdCBpbmRleD8gb3IgTnVtYmVyLmlzTmFOIGluZGV4XG4gICAgICAgICAgICBcbiAgICAgICAgdG9JbmRleCA9IHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICAgICAgdGhlbiBpbmRleC0xXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgICAgIHRoZW4gaW5kZXgrMVxuICAgICAgICAgICAgd2hlbiAnaG9tZScgICAgICB0aGVuIDBcbiAgICAgICAgICAgIHdoZW4gJ2VuZCcgICAgICAgdGhlbiBAbnVtUm93cygpLTFcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiBNYXRoLm1heCAwLCBpbmRleC1AbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gTWF0aC5taW4gQG51bVJvd3MoKS0xLCBpbmRleCtAbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICBlbHNlIGluZGV4XG4gICAgXG4gICAgICAgIEBicm93c2VyLnNlbGVjdC50byBAcm93KHRvSW5kZXgpLCB0cnVlXG4gICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuXG4gICAgbmF2aWdhdGVSb3dzOiAoa2V5KSAtPlxuXG4gICAgICAgIHJldHVybiBlcnJvciBcIm5vIHJvd3MgaW4gY29sdW1uICN7QGluZGV4fT9cIiBpZiBub3QgQG51bVJvd3MoKVxuICAgICAgICBpbmRleCA9IEBhY3RpdmVSb3coKT8uaW5kZXgoKSA/IC0xXG4gICAgICAgIGVycm9yIFwibm8gaW5kZXggZnJvbSBhY3RpdmVSb3c/ICN7aW5kZXh9P1wiLCBAYWN0aXZlUm93KCkgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXhcbiAgICAgICAgXG4gICAgICAgIG5ld0luZGV4ID0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIGluZGV4LTFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiBpbmRleCsxXG4gICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gMFxuICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIEBudW1Sb3dzKCktMVxuICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcgICB0aGVuIGluZGV4LUBudW1WaXNpYmxlKClcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgZG93bicgdGhlbiBpbmRleCtAbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICBlbHNlIGluZGV4XG4gICAgICAgICAgICBcbiAgICAgICAgaWYgbm90IG5ld0luZGV4PyBvciBOdW1iZXIuaXNOYU4gbmV3SW5kZXggICAgICAgIFxuICAgICAgICAgICAgZXJyb3IgXCJubyBpbmRleCAje25ld0luZGV4fT8gI3tAbnVtVmlzaWJsZSgpfVwiXG4gICAgICAgICAgICBcbiAgICAgICAgbmV3SW5kZXggPSBjbGFtcCAwLCBAbnVtUm93cygpLTEsIG5ld0luZGV4XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbmV3SW5kZXggPT0gaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAcm93c1tuZXdJbmRleF0/LmFjdGl2YXRlP1xuICAgICAgICAgICAgZXJyb3IgXCJubyByb3cgYXQgaW5kZXggI3tuZXdJbmRleH0vI3tAbnVtUm93cygpLTF9P1wiLCBAbnVtUm93cygpIFxuICAgICAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQHJvd3NbbmV3SW5kZXhdXG4gICAgXG4gICAgbmF2aWdhdGVDb2xzOiAoa2V5KSAtPiAjIG1vdmUgdG8gZmlsZSBicm93c2VyP1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgIHRoZW4gQGJyb3dzZXIubmF2aWdhdGUgJ3VwJ1xuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gQGJyb3dzZXIubmF2aWdhdGUgJ2xlZnQnXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBAYnJvd3Nlci5uYXZpZ2F0ZSAncmlnaHQnXG4gICAgICAgICAgICB3aGVuICdlbnRlcidcbiAgICAgICAgICAgICAgICBpZiBpdGVtID0gQGFjdGl2ZVJvdygpPy5pdGVtXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSBpdGVtLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgaWYgdHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIubG9hZEl0ZW0gaXRlbVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdvcGVuRmlsZScgaXRlbS5maWxlXG4gICAgICAgIEBcblxuICAgIG5hdmlnYXRlUm9vdDogKGtleSkgLT4gXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5icm93c2Ugc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gc2xhc2guZGlyIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gQGFjdGl2ZVJvdygpLml0ZW0uZmlsZVxuICAgICAgICBAXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgIFxuICAgIFxuICAgIGRvU2VhcmNoOiAoY2hhcikgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQG51bVJvd3MoKVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEBzZWFyY2hEaXZcbiAgICAgICAgICAgIEBzZWFyY2hEaXYgPSBlbGVtIGNsYXNzOiAnYnJvd3NlclNlYXJjaCdcbiAgICAgICAgICAgIFxuICAgICAgICBAc2V0U2VhcmNoIEBzZWFyY2ggKyBjaGFyXG4gICAgICAgIFxuICAgIGJhY2tzcGFjZVNlYXJjaDogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBzZWFyY2hEaXYgYW5kIEBzZWFyY2gubGVuZ3RoXG4gICAgICAgICAgICBAc2V0U2VhcmNoIEBzZWFyY2hbMC4uLkBzZWFyY2gubGVuZ3RoLTFdXG4gICAgICAgICAgICBcbiAgICBzZXRTZWFyY2g6IChAc2VhcmNoKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgIGNsZWFyVGltZW91dCBAc2VhcmNoVGltZXJcbiAgICAgICAgQHNlYXJjaFRpbWVyID0gc2V0VGltZW91dCBAY2xlYXJTZWFyY2gsIDIwMDBcbiAgICAgICAgXG4gICAgICAgIEBzZWFyY2hEaXYudGV4dENvbnRlbnQgPSBAc2VhcmNoXG5cbiAgICAgICAgYWN0aXZlSW5kZXggID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gMFxuICAgICAgICBhY3RpdmVJbmRleCArPSAxIGlmIChAc2VhcmNoLmxlbmd0aCA9PSAxKSAjb3IgKGNoYXIgPT0gJycpXG4gICAgICAgIGFjdGl2ZUluZGV4ICA9IDAgaWYgYWN0aXZlSW5kZXggPj0gQG51bVJvd3MoKVxuICAgICAgICBcbiAgICAgICAgZm9yIHJvd3MgaW4gW0Byb3dzLnNsaWNlKGFjdGl2ZUluZGV4KSwgQHJvd3Muc2xpY2UoMCxhY3RpdmVJbmRleCsxKV1cbiAgICAgICAgICAgIGZ1enppZWQgPSBmdXp6eS5maWx0ZXIgQHNlYXJjaCwgcm93cywgZXh0cmFjdDogKHIpIC0+IHIuaXRlbS5uYW1lXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGZ1enppZWQubGVuZ3RoXG4gICAgICAgICAgICAgICAgcm93ID0gZnV6emllZFswXS5vcmlnaW5hbFxuICAgICAgICAgICAgICAgIHJvdy5kaXYuYXBwZW5kQ2hpbGQgQHNlYXJjaERpdlxuICAgICAgICAgICAgICAgIHJvdy5hY3RpdmF0ZSgpXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgQFxuICAgIFxuICAgIGNsZWFyU2VhcmNoOiA9PlxuICAgICAgICBcbiAgICAgICAgQHNlYXJjaCA9ICcnXG4gICAgICAgIEBzZWFyY2hEaXY/LnJlbW92ZSgpXG4gICAgICAgIGRlbGV0ZSBAc2VhcmNoRGl2XG4gICAgICAgIEBcbiAgICBcbiAgICByZW1vdmVPYmplY3Q6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiByb3cgPSBAYWN0aXZlUm93KClcbiAgICAgICAgICAgIG5leHRPclByZXYgPSByb3cubmV4dCgpID8gcm93LnByZXYoKVxuICAgICAgICAgICAgQHJlbW92ZVJvdyByb3dcbiAgICAgICAgICAgIG5leHRPclByZXY/LmFjdGl2YXRlKClcbiAgICAgICAgQFxuXG4gICAgcmVtb3ZlUm93OiAocm93KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgcm93ID09IEBhY3RpdmVSb3coKVxuICAgICAgICAgICAgaWYgQG5leHRDb2x1bW4oKT8ucGFyZW50Py5maWxlID09IHJvdy5pdGVtPy5maWxlXG4gICAgICAgICAgICAgICAgIyBrbG9nICdyZW1vdmVSb3cgY2xlYXInXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW5zRnJvbSBAaW5kZXggKyAxXG4gICAgICAgICAgICBcbiAgICAgICAgcm93LmRpdi5yZW1vdmUoKVxuICAgICAgICBAaXRlbXMuc3BsaWNlIHJvdy5pbmRleCgpLCAxXG4gICAgICAgIEByb3dzLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBzb3J0QnlOYW1lOiA9PlxuICAgICAgICAgXG4gICAgICAgIEByb3dzLnNvcnQgKGEsYikgLT4gXG4gICAgICAgICAgICAoYS5pdGVtLnR5cGUgKyBhLml0ZW0ubmFtZSkubG9jYWxlQ29tcGFyZShiLml0ZW0udHlwZSArIGIuaXRlbS5uYW1lKVxuICAgICAgICAgICAgXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICBAdGFibGUuYXBwZW5kQ2hpbGQgcm93LmRpdlxuICAgICAgICBAXG4gICAgICAgIFxuICAgIHNvcnRCeVR5cGU6ID0+XG4gICAgICAgIFxuICAgICAgICBAcm93cy5zb3J0IChhLGIpIC0+IFxuICAgICAgICAgICAgYXR5cGUgPSBhLml0ZW0udHlwZSA9PSAnZmlsZScgYW5kIHNsYXNoLmV4dChhLml0ZW0ubmFtZSkgb3IgJ19fXycgI2EuaXRlbS50eXBlXG4gICAgICAgICAgICBidHlwZSA9IGIuaXRlbS50eXBlID09ICdmaWxlJyBhbmQgc2xhc2guZXh0KGIuaXRlbS5uYW1lKSBvciAnX19fJyAjYi5pdGVtLnR5cGVcbiAgICAgICAgICAgIChhLml0ZW0udHlwZSArIGF0eXBlICsgYS5pdGVtLm5hbWUpLmxvY2FsZUNvbXBhcmUoYi5pdGVtLnR5cGUgKyBidHlwZSArIGIuaXRlbS5uYW1lLCB1bmRlZmluZWQsIG51bWVyaWM6dHJ1ZSlcbiAgICAgICAgICAgIFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93c1xuICAgICAgICAgICAgQHRhYmxlLmFwcGVuZENoaWxkIHJvdy5kaXZcbiAgICAgICAgQFxuXG4gICAgc29ydEJ5RGF0ZUFkZGVkOiA9PlxuICAgICAgICBcbiAgICAgICAgQHJvd3Muc29ydCAoYSxiKSAtPiBiLml0ZW0uc3RhdD8uYXRpbWVNcyAtIGEuaXRlbS5zdGF0Py5hdGltZU1zXG4gICAgICAgICAgICBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIEB0YWJsZS5hcHBlbmRDaGlsZCByb3cuZGl2XG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIHRvZ2dsZURvdEZpbGVzOiA9PlxuXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICMgbG9nICdjb2x1bW4udG9nZ2xlRG90RmlsZXMnIEBwYXJlbnRcbiAgICAgICAgICAgIEBwYXJlbnQudHlwZSA9IHNsYXNoLmlzRGlyKEBwYXJlbnQuZmlsZSkgYW5kICdkaXInIG9yICdmaWxlJ1xuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSAnZGlyJyAgICAgICAgICAgIFxuICAgICAgICAgICAgc3RhdGVLZXkgPSBcImJyb3dzZXLilrhzaG93SGlkZGVu4pa4I3tAcGFyZW50LmZpbGV9XCJcbiAgICAgICAgICAgIGlmIHByZWZzLmdldCBzdGF0ZUtleVxuICAgICAgICAgICAgICAgIHByZWZzLmRlbCBzdGF0ZUtleVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHByZWZzLnNldCBzdGF0ZUtleSwgdHJ1ZVxuICAgICAgICAgICAgQGJyb3dzZXIubG9hZERpckl0ZW0gQHBhcmVudCwgQGluZGV4LCBpZ25vcmVDYWNoZTp0cnVlXG4gICAgICAgIEBcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgbW92ZVRvVHJhc2g6ID0+XG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IEBicm93c2VyLnNlbGVjdC5mcmVlSW5kZXgoKVxuICAgICAgICBpZiBpbmRleCA+PSAwXG4gICAgICAgICAgICBzZWxlY3RSb3cgPSBAcm93IGluZGV4XG4gICAgICAgIFxuICAgICAgICBmb3Igcm93IGluIEBicm93c2VyLnNlbGVjdC5yb3dzXG4gICAgICAgICAgICB3eHcgJ3RyYXNoJyByb3cucGF0aCgpXG4gICAgICAgICAgICBAcmVtb3ZlUm93IHJvd1xuICAgICAgICAgICBcbiAgICAgICAgaWYgc2VsZWN0Um93XG4gICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IHNlbGVjdFJvd1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbmF2aWdhdGVDb2xzICdsZWZ0J1xuXG4gICAgYWRkVG9TaGVsZjogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHBhdGhUb1NoZWxmID0gQGFjdGl2ZVBhdGgoKVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdhZGRUb1NoZWxmJyBwYXRoVG9TaGVsZlxuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAgMCAgICAgIDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgb3BlblZpZXdlcjogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBhY3RpdmVSb3coKT8uaXRlbS5uYW1lICE9ICcuLicgXG4gICAgICAgICAgICBwYXRoID0gQGFjdGl2ZVBhdGgoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwYXRoID0gQHBhcmVudC5maWxlXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgcGF0aFxuICAgICAgICAgICAgaWYgRmlsZS5pc1RleHQgcGF0aFxuICAgICAgICAgICAgICAgIEBicm93c2VyLnZpZXdlciA9IG5ldyBFZGl0b3IgQGJyb3dzZXIsIHBhdGhcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHNsYXNoLmlzRmlsZSBwYXRoXG4gICAgICAgICAgICAgICAgaWYgbm90IEZpbGUuaXNJbWFnZSBwYXRoXG4gICAgICAgICAgICAgICAgICAgIHBhdGggPSBAcGF0aCgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBicm93c2VyLnZpZXdlciA9IG5ldyBWaWV3ZXIgQGJyb3dzZXIsIHBhdGhcbiAgICAgICAgXG4gICAgbmV3Rm9sZGVyOiA9PlxuICAgICAgICBcbiAgICAgICAgc2xhc2gudW51c2VkIHNsYXNoLmpvaW4oQHBhdGgoKSwgJ05ldyBmb2xkZXInKSwgKG5ld0RpcikgPT5cbiAgICAgICAgICAgIGZzLm1rZGlyIG5ld0RpciwgKGVycikgPT5cbiAgICAgICAgICAgICAgICBpZiBlbXB0eSBlcnJcbiAgICAgICAgICAgICAgICAgICAgcm93ID0gQGluc2VydEZpbGUgbmV3RGlyXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgcm93XG4gICAgICAgICAgICAgICAgICAgIHJvdy5lZGl0TmFtZSgpXG4gICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGR1cGxpY2F0ZUZpbGU6ID0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBmaWxlIGluIEBicm93c2VyLnNlbGVjdC5maWxlcygpXG4gICAgICAgICAgICBGaWxlLmR1cGxpY2F0ZSBmaWxlLCAoc291cmNlLCB0YXJnZXQpID0+XG4gICAgICAgICAgICAgICAgaWYgQHBhcmVudC50eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICBjb2wgPSBAcHJldkNvbHVtbigpXG4gICAgICAgICAgICAgICAgICAgIGNvbC5mb2N1cygpXG4gICAgICAgICAgICAgICAgZWxzZSBjb2wgPSBAXG4gICAgICAgICAgICAgICAgcm93ID0gY29sLmluc2VydEZpbGUgdGFyZ2V0XG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyByb3dcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGV4cGxvcmVyOiA9PlxuICAgICAgICBcbiAgICAgICAgb3BlbiBzbGFzaC5kaXIgQGFjdGl2ZVBhdGgoKVxuICAgICAgICBcbiAgICBvcGVuOiA9PlxuXG4gICAgICAgIG9wZW4gQGFjdGl2ZVBhdGgoKVxuICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIFxuICAgICAgICBcbiAgICBtYWtlUm9vdDogPT4gXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5zaGlmdENvbHVtbnNUbyBAaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGlmIEBicm93c2VyLmNvbHVtbnNbMF0uaXRlbXNbMF0ubmFtZSAhPSAnLi4nXG4gICAgICAgICAgICBAdW5zaGlmdEl0ZW0gXG4gICAgICAgICAgICAgICAgbmFtZTogJy4uJ1xuICAgICAgICAgICAgICAgIHR5cGU6ICdkaXInXG4gICAgICAgICAgICAgICAgZmlsZTogc2xhc2guZGlyIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAY3J1bWIuc2V0RmlsZSBAcGFyZW50LmZpbGVcbiAgICBcbiAgICBvbkNvbnRleHRNZW51OiAoZXZlbnQsIGNvbHVtbikgPT4gXG4gICAgICAgIFxuICAgICAgICBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgXG4gICAgICAgIGFic1BvcyA9IGtwb3MgZXZlbnRcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBjb2x1bW5cbiAgICAgICAgICAgIEBzaG93Q29udGV4dE1lbnUgYWJzUG9zXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgb3B0ID0gaXRlbXM6IFsgXG4gICAgICAgICAgICAgICAgdGV4dDogICAnUm9vdCdcbiAgICAgICAgICAgICAgICBjYjogICAgIEBtYWtlUm9vdFxuICAgICAgICAgICAgLFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgJ0FkZCB0byBTaGVsZidcbiAgICAgICAgICAgICAgICBjb21ibzogICdhbHQrc2hpZnQrLidcbiAgICAgICAgICAgICAgICBjYjogICAgID0+IHBvc3QuZW1pdCAnYWRkVG9TaGVsZicgQHBhcmVudC5maWxlXG4gICAgICAgICAgICAsXG4gICAgICAgICAgICAgICAgdGV4dDogICAnRXhwbG9yZXInXG4gICAgICAgICAgICAgICAgY29tYm86ICAnYWx0K2UnIFxuICAgICAgICAgICAgICAgIGNiOiAgICAgPT4gb3BlbiBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIF1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgb3B0LnggPSBhYnNQb3MueFxuICAgICAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICAgICAgcG9wdXAubWVudSBvcHQgICAgXG4gICAgICAgICAgICAgIFxuICAgIHNob3dDb250ZXh0TWVudTogKGFic1BvcykgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBhYnNQb3M/XG4gICAgICAgICAgICBhYnNQb3MgPSBrcG9zIEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcbiAgICAgICAgXG4gICAgICAgIG9wdCA9IGl0ZW1zOiBbIFxuICAgICAgICAgICAgdGV4dDogICAnT3BlbidcbiAgICAgICAgICAgIGNvbWJvOiAgJ3JldHVybiBhbHQrbydcbiAgICAgICAgICAgIGNiOiAgICAgQG9wZW5cbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnVmlld2VyJ1xuICAgICAgICAgICAgY29tYm86ICAnc3BhY2UgYWx0K3YnIFxuICAgICAgICAgICAgY2I6ICAgICBAb3BlblZpZXdlclxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdFeHBsb3JlcidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQGV4cGxvcmVyXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJydcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnQWRkIHRvIFNoZWxmJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K3NoaWZ0Ky4nXG4gICAgICAgICAgICBjYjogICAgIEBhZGRUb1NoZWxmXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJydcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnTW92ZSB0byBUcmFzaCdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrYmFja3NwYWNlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQG1vdmVUb1RyYXNoXG4gICAgICAgICwgICBcbiAgICAgICAgICAgIHRleHQ6ICAgJydcbiAgICAgICAgICAgIGhpZGU6ICAgQHBhcmVudC50eXBlID09ICdmaWxlJ1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdEdXBsaWNhdGUnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2QnIFxuICAgICAgICAgICAgY2I6ICAgICBAZHVwbGljYXRlRmlsZVxuICAgICAgICAgICAgaGlkZTogICBAcGFyZW50LnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICwgICBcbiAgICAgICAgICAgIHRleHQ6ICAgJ05ldyBGb2xkZXInXG4gICAgICAgICAgICBjb21ibzogICdhbHQrbicgXG4gICAgICAgICAgICBjYjogICAgIEBuZXdGb2xkZXJcbiAgICAgICAgICAgIGhpZGU6ICAgQHBhcmVudC50eXBlID09ICdmaWxlJ1xuICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgIT0gJ2ZpbGUnXG4gICAgICAgICAgICBvcHQuaXRlbXMgPSBvcHQuaXRlbXMuY29uY2F0IFtcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICcnXG4gICAgICAgICAgICAsICAgXG4gICAgICAgICAgICAgICAgdGV4dDogICAnU29ydCdcbiAgICAgICAgICAgICAgICBtZW51OiBbXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdCeSBOYW1lJyBjb21ibzonY3RybCtuJywgY2I6QHNvcnRCeU5hbWVcbiAgICAgICAgICAgICAgICAsXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdCeSBUeXBlJyBjb21ibzonY3RybCt0JywgY2I6QHNvcnRCeVR5cGVcbiAgICAgICAgICAgICAgICAsXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdCeSBEYXRlJyBjb21ibzonY3RybCthJywgY2I6QHNvcnRCeURhdGVBZGRlZFxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgICAgICBvcHQuaXRlbXMgPSBvcHQuaXRlbXMuY29uY2F0IHdpbmRvdy50aXRsZWJhci5tYWtlVGVtcGxhdGUgcmVxdWlyZSAnLi9tZW51Lmpzb24nXG4gICAgICAgIFxuICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgcG9wdXAubWVudSBvcHQgICAgICAgIFxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG9uS2V5OiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnc2hpZnQrYCcgJ34nICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIuYnJvd3NlICd+J1xuICAgICAgICAgICAgd2hlbiAnLycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIuYnJvd3NlICcvJ1xuICAgICAgICAgICAgd2hlbiAnYWx0K3NoaWZ0Ky4nICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGFkZFRvU2hlbGYoKVxuICAgICAgICAgICAgd2hlbiAnYWx0K2UnICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBleHBsb3JlcigpXG4gICAgICAgICAgICB3aGVuICdhbHQrbycgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQG9wZW4oKVxuICAgICAgICAgICAgd2hlbiAnYWx0K24nICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBuZXdGb2xkZXIoKVxuICAgICAgICAgICAgd2hlbiAnc3BhY2UnICdhbHQrdicgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBvcGVuVmlld2VyKClcbiAgICAgICAgICAgIHdoZW4gJ3NoaWZ0K3VwJyAnc2hpZnQrZG93bicgJ3NoaWZ0K2hvbWUnICdzaGlmdCtlbmQnICdzaGlmdCtwYWdlIHVwJyAnc2hpZnQrcGFnZSBkb3duJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBleHRlbmRTZWxlY3Rpb24ga2V5XG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAncGFnZSBkb3duJyAnaG9tZScgJ2VuZCcgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzIGtleVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCt1cCcgJ2N0cmwrdXAnICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyAnaG9tZSdcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZG93bicgJ2N0cmwrZG93bicgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3MgJ2VuZCdcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJydhbHQrdXAnICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZUNvbHMga2V5XG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5vbkJhY2tzcGFjZUluQ29sdW1uIEBcbiAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZScgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLm9uRGVsZXRlSW5Db2x1bW4gQFxuICAgICAgICAgICAgd2hlbiAnY3RybCt0JyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeVR5cGUoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtuJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeU5hbWUoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCthJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeURhdGVBZGRlZCgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2knICdjdHJsK2knICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAdG9nZ2xlRG90RmlsZXMoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtkJyAnY3RybCtkJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGR1cGxpY2F0ZUZpbGUoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtrJyAnY3RybCtrJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCBpZiBAYnJvd3Nlci5jbGVhblVwKClcbiAgICAgICAgICAgIHdoZW4gJ2YyJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBhY3RpdmVSb3coKT8uZWRpdE5hbWUoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtsZWZ0JyAnY29tbWFuZCtyaWdodCcgJ2N0cmwrbGVmdCcgJ2N0cmwrcmlnaHQnXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm9vdCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrYmFja3NwYWNlJyAnY3RybCtiYWNrc3BhY2UnICdjb21tYW5kK2RlbGV0ZScgJ2N0cmwrZGVsZXRlJyBcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbW92ZVRvVHJhc2goKVxuICAgICAgICAgICAgd2hlbiAndGFiJyAgICBcbiAgICAgICAgICAgICAgICBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBkb1NlYXJjaCAnJ1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgICAgIHdoZW4gJ2VzYydcbiAgICAgICAgICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgICAgICAgICBAZHJhZ0Rpdi5kcmFnLmRyYWdTdG9wKClcbiAgICAgICAgICAgICAgICAgICAgQGRyYWdEaXYucmVtb3ZlKClcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEBkcmFnRGl2XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKS5sZW5ndGggPiAxXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBjbGVhclNlYXJjaCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuXG4gICAgICAgIGlmIGNvbWJvIGluIFsndXAnICAgJ2Rvd24nXSAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzIGtleSAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbWJvIGluIFsnbGVmdCcgJ3JpZ2h0J10gdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVDb2xzIGtleVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG1vZCBpbiBbJ3NoaWZ0JyAnJ10gYW5kIGNoYXIgdGhlbiBAZG9TZWFyY2ggY2hhclxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgIEB1cGRhdGVEcmFnSW5kaWNhdG9yIGV2ZW50XG4gICAgICAgICAgICBcbiAgICBvbktleVVwOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgQHVwZGF0ZURyYWdJbmRpY2F0b3IgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBDb2x1bW5cblxuXG4iXX0=
//# sourceURL=../coffee/column.coffee