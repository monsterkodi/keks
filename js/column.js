// koffee 1.12.0

/*
 0000000   0000000   000      000   000  00     00  000   000
000       000   000  000      000   000  000   000  0000  000
000       000   000  000      000   000  000000000  000 0 000
000       000   000  000      000   000  000 0 000  000  0000
 0000000   0000000   0000000   0000000   000   000  000   000
 */
var Column, Crumb, Editor, File, Row, Scroller, Viewer, _, clamp, drag, electron, elem, empty, fs, fuzzy, kerror, keyinfo, klog, kpos, open, popup, post, prefs, ref, slash, stopEvent, valid, wxw,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), _ = ref._, clamp = ref.clamp, drag = ref.drag, elem = ref.elem, empty = ref.empty, fs = ref.fs, kerror = ref.kerror, keyinfo = ref.keyinfo, klog = ref.klog, kpos = ref.kpos, open = ref.open, popup = ref.popup, post = ref.post, prefs = ref.prefs, slash = ref.slash, stopEvent = ref.stopEvent, valid = ref.valid;

Row = require('./row');

Scroller = require('./tools/scroller');

File = require('./tools/file');

Viewer = require('./viewer');

Editor = require('./editor');

Crumb = require('./crumb');

fuzzy = require('fuzzy');

wxw = require('wxw');

electron = require('electron');

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
        this.onSpringLoadTimeout = bind(this.onSpringLoadTimeout, this);
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
                if (!this.dragStartRow.isSelected()) {
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
            this.dragDiv.files = this.browser.select.files();
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
            clearTimeout(this.browser.springLoadTimer);
            delete this.browser.springLoadTarget;
            if (row = this.browser.rowAtPos(d.pos)) {
                if (row.item.type === 'dir') {
                    this.browser.springLoadTimer = setTimeout(this.onSpringLoadTimeout, 1000);
                    this.browser.springLoadTarget = row.item.file;
                }
            }
            this.updateDragIndicator(e);
            return this.dragDiv.style.transform = "translateX(" + d.deltaSum.x + "px) translateY(" + d.deltaSum.y + "px)";
        }
    };

    Column.prototype.onSpringLoadTimeout = function() {
        var column, row;
        if (column = this.browser.columnForFile(this.browser.springLoadTarget)) {
            if (row = column.row(this.browser.springLoadTarget)) {
                return row.activate();
            }
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
        var action, column, files, ref1, ref2, ref3, row, target;
        clearTimeout(this.browser.springLoadTimer);
        delete this.browser.springLoadTarget;
        if (this.dragDiv != null) {
            this.dragDiv.remove();
            files = this.dragDiv.files;
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
                    return this.browser.dropAction(action, files, target);
                } else {
                    return this.browser.shelf.addFiles(files, {
                        pos: d.pos
                    });
                }
            } else {
                return this.browser.dropAction(action, files, target);
            }
        } else {
            if (e.button === 0) {
                this.focus({
                    activate: false
                });
            }
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
            } else {
                return (ref3 = this.activeRow()) != null ? ref3.clearActive() : void 0;
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

    Column.prototype.copyPaths = function() {
        var paths;
        paths = this.browser.select.files().join('\n');
        electron.clipboard.writeText(paths);
        return paths;
    };

    Column.prototype.cutPaths = function() {
        return this.browser.cutPaths = this.copyPaths();
    };

    Column.prototype.pastePaths = function() {
        var action, paths, ref1, target, text;
        text = electron.clipboard.readText();
        paths = text.split('\n');
        if (text === this.browser.cutPaths) {
            action = 'move';
        } else {
            action = 'copy';
        }
        target = this.parent.file;
        if (((ref1 = this.activeRow()) != null ? ref1.item.type : void 0) === 'dir') {
            target = this.activeRow().item.file;
        }
        return this.browser.dropAction(action, paths, target);
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
            case 'ctrl+x':
            case 'command+x':
                return this.cutPaths();
            case 'ctrl+c':
            case 'command+c':
                return this.copyPaths();
            case 'ctrl+v':
            case 'command+v':
                return this.pastePaths();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sdW1uLmpzIiwic291cmNlUm9vdCI6Ii4uL2NvZmZlZSIsInNvdXJjZXMiOlsiY29sdW1uLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSw4TEFBQTtJQUFBOztBQVFBLE1BQXNILE9BQUEsQ0FBUSxLQUFSLENBQXRILEVBQUUsU0FBRixFQUFLLGlCQUFMLEVBQVksZUFBWixFQUFrQixlQUFsQixFQUF3QixpQkFBeEIsRUFBK0IsV0FBL0IsRUFBbUMsbUJBQW5DLEVBQTJDLHFCQUEzQyxFQUFvRCxlQUFwRCxFQUEwRCxlQUExRCxFQUFnRSxlQUFoRSxFQUFzRSxpQkFBdEUsRUFBNkUsZUFBN0UsRUFBbUYsaUJBQW5GLEVBQTBGLGlCQUExRixFQUFpRyx5QkFBakcsRUFBNEc7O0FBRTVHLEdBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLGtCQUFSOztBQUNYLElBQUEsR0FBVyxPQUFBLENBQVEsY0FBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsTUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7QUFDWCxLQUFBLEdBQVcsT0FBQSxDQUFRLE9BQVI7O0FBQ1gsR0FBQSxHQUFXLE9BQUEsQ0FBUSxLQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7QUFFTDtJQUVDLGdCQUFDLE9BQUQ7QUFFQyxZQUFBO1FBRkEsSUFBQyxDQUFBLFVBQUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7UUFFQSxJQUFDLENBQUEsV0FBRCxHQUFlO1FBQ2YsSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxLQUFELEdBQVU7UUFDVixJQUFDLENBQUEsSUFBRCxHQUFVO1FBRVYsSUFBQyxDQUFBLEdBQUQsR0FBUyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGVB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QSxZQUFELENBQWMsR0FBZCxDQUFqQixFQUF6Qzs7UUFFQSxJQUFHLENBQUEsR0FBQSxLQUFRLE9BQVIsSUFBQSxHQUFBLEtBQWdCLEVBQWhCLENBQUEsSUFBd0IsSUFBM0I7WUFBcUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLEVBQXJDOztRQUVBLElBQUcsSUFBQyxDQUFBLE9BQUo7bUJBQ0ksSUFBQyxDQUFBLG1CQUFELENBQXFCLEtBQXJCLEVBREo7O0lBbkRHOztxQkFzRFAsT0FBQSxHQUFTLFNBQUMsS0FBRDtRQUVMLElBQUcsSUFBQyxDQUFBLE9BQUo7bUJBQ0ksSUFBQyxDQUFBLG1CQUFELENBQXFCLEtBQXJCLEVBREo7O0lBRks7Ozs7OztBQUtiLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBfLCBjbGFtcCwgZHJhZywgZWxlbSwgZW1wdHksIGZzLCBrZXJyb3IsIGtleWluZm8sIGtsb2csIGtwb3MsIG9wZW4sIHBvcHVwLCBwb3N0LCBwcmVmcywgc2xhc2gsIHN0b3BFdmVudCwgdmFsaWQgfSA9IHJlcXVpcmUgJ2t4aydcblxuUm93ICAgICAgPSByZXF1aXJlICcuL3JvdydcblNjcm9sbGVyID0gcmVxdWlyZSAnLi90b29scy9zY3JvbGxlcidcbkZpbGUgICAgID0gcmVxdWlyZSAnLi90b29scy9maWxlJ1xuVmlld2VyICAgPSByZXF1aXJlICcuL3ZpZXdlcidcbkVkaXRvciAgID0gcmVxdWlyZSAnLi9lZGl0b3InXG5DcnVtYiAgICA9IHJlcXVpcmUgJy4vY3J1bWInXG5mdXp6eSAgICA9IHJlcXVpcmUgJ2Z1enp5J1xud3h3ICAgICAgPSByZXF1aXJlICd3eHcnXG5lbGVjdHJvbiA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuXG5jbGFzcyBDb2x1bW5cbiAgICBcbiAgICBAOiAoQGJyb3dzZXIpIC0+XG4gICAgICAgIFxuICAgICAgICBAc2VhcmNoVGltZXIgPSBudWxsXG4gICAgICAgIEBzZWFyY2ggPSAnJ1xuICAgICAgICBAaXRlbXMgID0gW11cbiAgICAgICAgQHJvd3MgICA9IFtdXG4gICAgICAgIFxuICAgICAgICBAZGl2ICAgPSBlbGVtIGNsYXNzOiAnYnJvd3NlckNvbHVtbicgdGFiSW5kZXg6NlxuICAgICAgICBAdGFibGUgPSBlbGVtIGNsYXNzOiAnYnJvd3NlckNvbHVtblRhYmxlJ1xuICAgICAgICBAZGl2LmFwcGVuZENoaWxkIEB0YWJsZVxuICAgICAgICBcbiAgICAgICAgQHNldEluZGV4IEBicm93c2VyLmNvbHVtbnM/Lmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY29scz8uYXBwZW5kQ2hpbGQgQGRpdlxuICAgICAgICBcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdmb2N1cycgICAgIEBvbkZvY3VzXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnYmx1cicgICAgICBAb25CbHVyXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgICBAb25LZXlcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdrZXl1cCcgICAgIEBvbktleVVwXG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlb3ZlcicgQG9uTW91c2VPdmVyXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2VvdXQnICBAb25Nb3VzZU91dFxuXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnZGJsY2xpY2snICBAb25EYmxDbGlja1xuICAgICAgICBcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdjb250ZXh0bWVudScgQG9uQ29udGV4dE1lbnVcbiAgXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBkaXZcbiAgICAgICAgICAgIG9uU3RhcnQ6IEBvbkRyYWdTdGFydFxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uRHJhZ01vdmVcbiAgICAgICAgICAgIG9uU3RvcDogIEBvbkRyYWdTdG9wXG4gICAgICAgIFxuICAgICAgICBAY3J1bWIgID0gbmV3IENydW1iIEBcbiAgICAgICAgQHNjcm9sbCA9IG5ldyBTY3JvbGxlciBAXG4gICAgICAgIFxuICAgIHNldEluZGV4OiAoQGluZGV4KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNydW1iPy5lbGVtLmNvbHVtbkluZGV4ID0gQGluZGV4XG4gICAgICAgIFxuICAgIHdpZHRoOiAtPiBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgb25EcmFnU3RhcnQ6IChkLCBlKSA9PiBcbiAgICBcbiAgICAgICAgQGRyYWdTdGFydFJvdyA9IEByb3cgZS50YXJnZXRcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnNraXBPbkRibENsaWNrID0gZmFsc2VcbiAgICAgICAgXG4gICAgICAgIGRlbGV0ZSBAdG9nZ2xlXG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ1N0YXJ0Um93XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGUuc2hpZnRLZXlcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3QudG8gQGRyYWdTdGFydFJvd1xuICAgICAgICAgICAgZWxzZSBpZiBlLm1ldGFLZXkgb3IgZS5hbHRLZXkgb3IgZS5jdHJsS2V5XG4gICAgICAgICAgICAgICAgaWYgbm90IEBkcmFnU3RhcnRSb3cuaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC50b2dnbGUgQGRyYWdTdGFydFJvd1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHRvZ2dsZSA9IHRydWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBAZHJhZ1N0YXJ0Um93LmlzU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgICAgICBAZGVzZWxlY3QgPSB0cnVlXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAYWN0aXZlUm93KCk/LmNsZWFyQWN0aXZlKClcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyBAZHJhZ1N0YXJ0Um93LCBmYWxzZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBAaGFzRm9jdXMoKSBhbmQgQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyBAYWN0aXZlUm93KClcbiAgICAgICAgICAgIFxuICAgICAgICAjIGtsb2cgJ0BoYXNGb2N1cycgQGhhc0ZvY3VzKClcbiAgICAgICAgIyBrbG9nICdAYWN0aXZlUm93JyBAYWN0aXZlUm93KCk/Lml0ZW0/LmZpbGVcblxuICAgIG9uRHJhZ01vdmU6IChkLGUpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ1N0YXJ0Um93IGFuZCBub3QgQGRyYWdEaXYgYW5kIHZhbGlkIEBicm93c2VyLnNlbGVjdC5maWxlcygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBpZiBNYXRoLmFicyhkLmRlbHRhU3VtLngpIDwgMjAgYW5kIE1hdGguYWJzKGQuZGVsdGFTdW0ueSkgPCAxMFxuXG4gICAgICAgICAgICBkZWxldGUgQHRvZ2dsZSBcbiAgICAgICAgICAgIGRlbGV0ZSBAZGVzZWxlY3RcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGRyYWdEaXYgPSBlbGVtICdkaXYnXG4gICAgICAgICAgICBAZHJhZ0Rpdi5kcmFnID0gZFxuICAgICAgICAgICAgQGRyYWdEaXYuZmlsZXMgPSBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKVxuICAgICAgICAgICAgcG9zID0ga3BvcyBlLnBhZ2VYLCBlLnBhZ2VZXG4gICAgICAgICAgICByb3cgPSBAYnJvd3Nlci5zZWxlY3Qucm93c1swXVxuXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLm9wYWNpdHkgID0gXCIwLjdcIlxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUudG9wICA9IFwiI3twb3MueS1kLmRlbHRhU3VtLnl9cHhcIlxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUubGVmdCA9IFwiI3twb3MueC1kLmRlbHRhU3VtLnh9cHhcIlxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUud2lkdGggPSBcIiN7QHdpZHRoKCktMTJ9cHhcIlxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZHJhZ0luZCA9IGVsZW0gY2xhc3M6J2RyYWdJbmRpY2F0b3InXG4gICAgICAgICAgICBAZHJhZ0Rpdi5hcHBlbmRDaGlsZCBAZHJhZ0luZFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3Igcm93IGluIEBicm93c2VyLnNlbGVjdC5yb3dzXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUgPSByb3cuZGl2LmNsb25lTm9kZSB0cnVlXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUuc3R5bGUuZmxleCA9ICd1bnNldCdcbiAgICAgICAgICAgICAgICByb3dDbG9uZS5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUuc3R5bGUuYm9yZGVyID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUuc3R5bGUubWFyZ2luQm90dG9tID0gJy0xcHgnXG4gICAgICAgICAgICAgICAgQGRyYWdEaXYuYXBwZW5kQ2hpbGQgcm93Q2xvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQgQGRyYWdEaXZcbiAgICAgICAgICAgIEBmb2N1cyBhY3RpdmF0ZTpmYWxzZVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnRGl2XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCBAYnJvd3Nlci5zcHJpbmdMb2FkVGltZXJcbiAgICAgICAgICAgIGRlbGV0ZSBAYnJvd3Nlci5zcHJpbmdMb2FkVGFyZ2V0XG4gICAgICAgICAgICBpZiByb3cgPSBAYnJvd3Nlci5yb3dBdFBvcyBkLnBvc1xuICAgICAgICAgICAgICAgIGlmIHJvdy5pdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc3ByaW5nTG9hZFRpbWVyID0gc2V0VGltZW91dCBAb25TcHJpbmdMb2FkVGltZW91dCwgMTAwMFxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zcHJpbmdMb2FkVGFyZ2V0ID0gcm93Lml0ZW0uZmlsZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAdXBkYXRlRHJhZ0luZGljYXRvciBlIFxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGVYKCN7ZC5kZWx0YVN1bS54fXB4KSB0cmFuc2xhdGVZKCN7ZC5kZWx0YVN1bS55fXB4KVwiXG5cbiAgICBvblNwcmluZ0xvYWRUaW1lb3V0OiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgY29sdW1uID0gQGJyb3dzZXIuY29sdW1uRm9yRmlsZSBAYnJvd3Nlci5zcHJpbmdMb2FkVGFyZ2V0XG4gICAgICAgICAgICBpZiByb3cgPSBjb2x1bW4ucm93IEBicm93c2VyLnNwcmluZ0xvYWRUYXJnZXRcbiAgICAgICAgICAgICAgICByb3cuYWN0aXZhdGUoKVxuICAgICAgICAgICAgXG4gICAgdXBkYXRlRHJhZ0luZGljYXRvcjogKGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgQGRyYWdJbmQ/LmNsYXNzTGlzdC50b2dnbGUgJ2NvcHknIGV2ZW50LnNoaWZ0S2V5XG4gICAgICAgIEBkcmFnSW5kPy5jbGFzc0xpc3QudG9nZ2xlICdtb3ZlJyBldmVudC5jdHJsS2V5IG9yIGV2ZW50Lm1ldGFLZXkgb3IgZXZlbnQuYWx0S2V5XG4gICAgICAgICAgICBcbiAgICBvbkRyYWdTdG9wOiAoZCxlKSA9PlxuICAgICAgICBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBicm93c2VyLnNwcmluZ0xvYWRUaW1lclxuICAgICAgICBkZWxldGUgQGJyb3dzZXIuc3ByaW5nTG9hZFRhcmdldFxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdEaXY/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBkcmFnRGl2LnJlbW92ZSgpXG4gICAgICAgICAgICBmaWxlcyA9IEBkcmFnRGl2LmZpbGVzXG4gICAgICAgICAgICBkZWxldGUgQGRyYWdEaXZcbiAgICAgICAgICAgIGRlbGV0ZSBAZHJhZ1N0YXJ0Um93XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHJvdyA9IEBicm93c2VyLnJvd0F0UG9zIGQucG9zXG4gICAgICAgICAgICAgICAgY29sdW1uID0gcm93LmNvbHVtblxuICAgICAgICAgICAgICAgIHRhcmdldCA9IHJvdy5pdGVtLmZpbGVcbiAgICAgICAgICAgIGVsc2UgaWYgY29sdW1uID0gQGJyb3dzZXIuY29sdW1uQXRQb3MgZC5wb3NcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSBjb2x1bW4ucGFyZW50Py5maWxlXG4gICAgICAgICAgICBlbHNlIGlmIGNvbHVtbiA9IEBicm93c2VyLmNvbHVtbkF0WCBkLnBvcy54XG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gY29sdW1uLnBhcmVudD8uZmlsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGtsb2cgJ25vIGRyb3AgdGFyZ2V0J1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGFjdGlvbiA9IGUuc2hpZnRLZXkgYW5kICdjb3B5JyBvciAnbW92ZSdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGNvbHVtbiA9PSBAYnJvd3Nlci5zaGVsZiBcbiAgICAgICAgICAgICAgICBpZiB0YXJnZXQgYW5kIChlLmN0cmxLZXkgb3IgZS5zaGlmdEtleSBvciBlLm1ldGFLZXkgb3IgZS5hbHRLZXkpXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLmRyb3BBY3Rpb24gYWN0aW9uLCBmaWxlcywgdGFyZ2V0XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zaGVsZi5hZGRGaWxlcyBmaWxlcywgcG9zOmQucG9zXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuZHJvcEFjdGlvbiBhY3Rpb24sIGZpbGVzLCB0YXJnZXRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBlLmJ1dHRvbiA9PSAwXG4gICAgICAgICAgICAgICAgQGZvY3VzIGFjdGl2YXRlOmZhbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHJvdyA9IEByb3cgZS50YXJnZXRcbiAgICAgICAgICAgICAgICBpZiByb3cuaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgICAgIGlmIGUubWV0YUtleSBvciBlLmFsdEtleSBvciBlLmN0cmxLZXkgb3IgZS5zaGlmdEtleVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQHRvZ2dsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBAdG9nZ2xlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnRvZ2dsZSByb3dcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQGRlc2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEBkZXNlbGVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgcm93XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAYWN0aXZlUm93KCk/LmNsZWFyQWN0aXZlKClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIHJlbW92ZUZpbGU6IChmaWxlKSA9PiBcbiAgICAgICAgXG4gICAgICAgIGlmIHJvdyA9IEByb3cgc2xhc2guZmlsZSBmaWxlXG4gICAgICAgICAgICBAcmVtb3ZlUm93IHJvd1xuICAgICAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICAgICAgXG4gICAgaW5zZXJ0RmlsZTogKGZpbGUpID0+IFxuXG4gICAgICAgIGl0ZW0gPSBAYnJvd3Nlci5maWxlSXRlbSBmaWxlXG4gICAgICAgIHJvdyA9IG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBAcm93cy5wdXNoIHJvd1xuICAgICAgICByb3dcbiAgICBcbiAgICBsb2FkSXRlbXM6IChpdGVtcywgcGFyZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW4gQGluZGV4XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMgID0gaXRlbXNcbiAgICAgICAgQHBhcmVudCA9IHBhcmVudFxuICAgICAgICBcbiAgICAgICAgQGNydW1iLnNldEZpbGUgQHBhcmVudC5maWxlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSB1bmRlZmluZWRcbiAgICAgICAgICAgIEBwYXJlbnQudHlwZSA9IHNsYXNoLmlzRGlyKEBwYXJlbnQuZmlsZSkgYW5kICdkaXInIG9yICdmaWxlJ1xuICAgICAgICBcbiAgICAgICAga2Vycm9yIFwibm8gcGFyZW50IGl0ZW0/XCIgaWYgbm90IEBwYXJlbnQ/XG4gICAgICAgIGtlcnJvciBcImxvYWRJdGVtcyAtLSBubyBwYXJlbnQgdHlwZT9cIiwgQHBhcmVudCBpZiBub3QgQHBhcmVudC50eXBlP1xuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgQGl0ZW1zXG4gICAgICAgICAgICBmb3IgaXRlbSBpbiBAaXRlbXNcbiAgICAgICAgICAgICAgICBAcm93cy5wdXNoIG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBcbiAgICAgICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgPT0gJ2RpcicgYW5kIHNsYXNoLnNhbWVQYXRoICd+L0Rvd25sb2FkcycgQHBhcmVudC5maWxlXG4gICAgICAgICAgICBAc29ydEJ5RGF0ZUFkZGVkKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICB1bnNoaWZ0SXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMudW5zaGlmdCBpdGVtXG4gICAgICAgIEByb3dzLnVuc2hpZnQgbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIEB0YWJsZS5pbnNlcnRCZWZvcmUgQHRhYmxlLmxhc3RDaGlsZCwgQHRhYmxlLmZpcnN0Q2hpbGRcbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAcm93c1swXVxuICAgICAgICBcbiAgICBwdXNoSXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMucHVzaCBpdGVtXG4gICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgQHJvd3NbLTFdXG4gICAgICAgIFxuICAgIGFkZEl0ZW06IChpdGVtKSAtPlxuICAgICAgICBcbiAgICAgICAgcm93ID0gQHB1c2hJdGVtIGl0ZW1cbiAgICAgICAgQHNvcnRCeU5hbWUoKVxuICAgICAgICByb3dcblxuICAgIHNldEl0ZW1zOiAoQGl0ZW1zLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5jbGVhckNvbHVtbiBAaW5kZXhcbiAgICAgICAgXG4gICAgICAgIEBwYXJlbnQgPSBvcHQucGFyZW50XG4gICAgICAgIGtlcnJvciBcIm5vIHBhcmVudCBpdGVtP1wiIGlmIG5vdCBAcGFyZW50P1xuICAgICAgICBrZXJyb3IgXCJzZXRJdGVtcyAtLSBubyBwYXJlbnQgdHlwZT9cIiwgQHBhcmVudCBpZiBub3QgQHBhcmVudC50eXBlP1xuICAgICAgICBcbiAgICAgICAgZm9yIGl0ZW0gaW4gQGl0ZW1zXG4gICAgICAgICAgICBAcm93cy5wdXNoIG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBcbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAXG5cbiAgICBpc0RpcjogIC0+IEBwYXJlbnQ/LnR5cGUgPT0gJ2RpcicgXG4gICAgaXNGaWxlOiAtPiBAcGFyZW50Py50eXBlID09ICdmaWxlJyBcbiAgICAgICAgXG4gICAgaXNFbXB0eTogLT4gZW1wdHkgQHBhcmVudFxuICAgIGNsZWFyOiAgIC0+XG4gICAgICAgIEBjbGVhclNlYXJjaCgpXG4gICAgICAgIGRlbGV0ZSBAcGFyZW50XG4gICAgICAgIEBkaXYuc2Nyb2xsVG9wID0gMFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgQGNydW1iLmNsZWFyKClcbiAgICAgICAgQHJvd3MgPSBbXVxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIFxuICAgXG4gICAgYWN0aXZhdGVSb3c6IChyb3cpIC0+IEByb3cocm93KT8uYWN0aXZhdGUoKVxuICAgICAgIFxuICAgIGFjdGl2ZVJvdzogLT4gXy5maW5kIEByb3dzLCAocikgLT4gci5pc0FjdGl2ZSgpXG4gICAgYWN0aXZlUGF0aDogLT4gQGFjdGl2ZVJvdygpPy5wYXRoKCkgPyBAcGFyZW50LmZpbGVcbiAgICBcbiAgICByb3c6IChyb3cpIC0+ICMgYWNjZXB0cyBlbGVtZW50LCBpbmRleCwgc3RyaW5nIG9yIHJvd1xuICAgICAgICBpZiAgICAgIF8uaXNOdW1iZXIgIHJvdyB0aGVuIHJldHVybiAwIDw9IHJvdyA8IEBudW1Sb3dzKCkgYW5kIEByb3dzW3Jvd10gb3IgbnVsbFxuICAgICAgICBlbHNlIGlmIF8uaXNFbGVtZW50IHJvdyB0aGVuIHJldHVybiBfLmZpbmQgQHJvd3MsIChyKSAtPiByLmRpdi5jb250YWlucyByb3dcbiAgICAgICAgZWxzZSBpZiBfLmlzU3RyaW5nICByb3cgdGhlbiByZXR1cm4gXy5maW5kIEByb3dzLCAocikgLT4gci5pdGVtLm5hbWUgPT0gcm93IG9yIHIuaXRlbS5maWxlID09IHJvd1xuICAgICAgICBlbHNlIHJldHVybiByb3dcbiAgICAgICAgICAgIFxuICAgIG5leHRDb2x1bW46IC0+IEBicm93c2VyLmNvbHVtbiBAaW5kZXgrMVxuICAgIHByZXZDb2x1bW46IC0+IEBicm93c2VyLmNvbHVtbiBAaW5kZXgtMVxuICAgICAgICBcbiAgICBuYW1lOiAtPiBcIiN7QGJyb3dzZXIubmFtZX06I3tAaW5kZXh9XCJcbiAgICBwYXRoOiAtPiBAcGFyZW50Py5maWxlID8gJydcbiAgICAgICAgXG4gICAgbnVtUm93czogICAgLT4gQHJvd3MubGVuZ3RoID8gMCAgIFxuICAgIHJvd0hlaWdodDogIC0+IEByb3dzWzBdPy5kaXYuY2xpZW50SGVpZ2h0ID8gMFxuICAgIG51bVZpc2libGU6IC0+IEByb3dIZWlnaHQoKSBhbmQgcGFyc2VJbnQoQGJyb3dzZXIuaGVpZ2h0KCkgLyBAcm93SGVpZ2h0KCkpIG9yIDBcbiAgICBcbiAgICByb3dBdFBvczogKHBvcykgLT4gQHJvdyBAcm93SW5kZXhBdFBvcyBwb3NcbiAgICBcbiAgICByb3dJbmRleEF0UG9zOiAocG9zKSAtPlxuICAgICAgICBcbiAgICAgICAgTWF0aC5tYXggMCwgTWF0aC5mbG9vciAocG9zLnkgLSBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCkgLyBAcm93SGVpZ2h0KClcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBoYXNGb2N1czogLT4gQGRpdi5jbGFzc0xpc3QuY29udGFpbnMgJ2ZvY3VzJ1xuXG4gICAgZm9jdXM6IChvcHQ9e30pIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAYWN0aXZlUm93KCkgYW5kIEBudW1Sb3dzKCkgYW5kIG9wdD8uYWN0aXZhdGUgIT0gZmFsc2VcbiAgICAgICAgICAgIEByb3dzWzBdLnNldEFjdGl2ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgQGRpdi5mb2N1cygpXG4gICAgICAgIEBkaXYuY2xhc3NMaXN0LmFkZCAnZm9jdXMnXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgb25Gb2N1czogPT4gQGRpdi5jbGFzc0xpc3QuYWRkICdmb2N1cydcbiAgICBvbkJsdXI6ICA9PiBAZGl2LmNsYXNzTGlzdC5yZW1vdmUgJ2ZvY3VzJ1xuXG4gICAgZm9jdXNCcm93c2VyOiAtPiBAYnJvd3Nlci5mb2N1cygpXG4gICAgXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBvbk1vdXNlT3ZlcjogKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdmVyKClcbiAgICBvbk1vdXNlT3V0OiAgKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdXQoKVxuICAgIFxuICAgIG9uRGJsQ2xpY2s6ICAoZXZlbnQpID0+IFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuc2tpcE9uRGJsQ2xpY2sgPSB0cnVlXG4gICAgICAgIEBuYXZpZ2F0ZUNvbHMgJ2VudGVyJ1xuICAgIFxuICAgIHVwZGF0ZUNydW1iOiA9PiBAY3J1bWIudXBkYXRlUmVjdCBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgIFxuICAgIGV4dGVuZFNlbGVjdGlvbjogKGtleSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBlcnJvciBcIm5vIHJvd3MgaW4gY29sdW1uICN7QGluZGV4fT9cIiBpZiBub3QgQG51bVJvd3MoKSAgICAgICAgXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gLTFcbiAgICAgICAgZXJyb3IgXCJubyBpbmRleCBmcm9tIGFjdGl2ZVJvdz8gI3tpbmRleH0/XCIsIEBhY3RpdmVSb3coKSBpZiBub3QgaW5kZXg/IG9yIE51bWJlci5pc05hTiBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIHRvSW5kZXggPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcgICAgICAgIHRoZW4gaW5kZXgtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIGluZGV4KzFcbiAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiAwXG4gICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gQG51bVJvd3MoKS0xXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gTWF0aC5tYXggMCwgaW5kZXgtQG51bVZpc2libGUoKVxuICAgICAgICAgICAgd2hlbiAncGFnZSBkb3duJyB0aGVuIE1hdGgubWluIEBudW1Sb3dzKCktMSwgaW5kZXgrQG51bVZpc2libGUoKVxuICAgICAgICAgICAgZWxzZSBpbmRleFxuICAgIFxuICAgICAgICBAYnJvd3Nlci5zZWxlY3QudG8gQHJvdyh0b0luZGV4KSwgdHJ1ZVxuICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcblxuICAgIG5hdmlnYXRlUm93czogKGtleSkgLT5cblxuICAgICAgICByZXR1cm4gZXJyb3IgXCJubyByb3dzIGluIGNvbHVtbiAje0BpbmRleH0/XCIgaWYgbm90IEBudW1Sb3dzKClcbiAgICAgICAgaW5kZXggPSBAYWN0aXZlUm93KCk/LmluZGV4KCkgPyAtMVxuICAgICAgICBlcnJvciBcIm5vIGluZGV4IGZyb20gYWN0aXZlUm93PyAje2luZGV4fT9cIiwgQGFjdGl2ZVJvdygpIGlmIG5vdCBpbmRleD8gb3IgTnVtYmVyLmlzTmFOIGluZGV4XG4gICAgICAgIFxuICAgICAgICBuZXdJbmRleCA9IHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICAgICAgdGhlbiBpbmRleC0xXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgICAgIHRoZW4gaW5kZXgrMVxuICAgICAgICAgICAgd2hlbiAnaG9tZScgICAgICB0aGVuIDBcbiAgICAgICAgICAgIHdoZW4gJ2VuZCcgICAgICAgdGhlbiBAbnVtUm93cygpLTFcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiBpbmRleC1AbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gaW5kZXgrQG51bVZpc2libGUoKVxuICAgICAgICAgICAgZWxzZSBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG5vdCBuZXdJbmRleD8gb3IgTnVtYmVyLmlzTmFOIG5ld0luZGV4ICAgICAgICBcbiAgICAgICAgICAgIGVycm9yIFwibm8gaW5kZXggI3tuZXdJbmRleH0/ICN7QG51bVZpc2libGUoKX1cIlxuICAgICAgICAgICAgXG4gICAgICAgIG5ld0luZGV4ID0gY2xhbXAgMCwgQG51bVJvd3MoKS0xLCBuZXdJbmRleFxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5ld0luZGV4ID09IGluZGV4XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQHJvd3NbbmV3SW5kZXhdPy5hY3RpdmF0ZT9cbiAgICAgICAgICAgIGVycm9yIFwibm8gcm93IGF0IGluZGV4ICN7bmV3SW5kZXh9LyN7QG51bVJvd3MoKS0xfT9cIiwgQG51bVJvd3MoKSBcbiAgICAgICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IEByb3dzW25ld0luZGV4XVxuICAgIFxuICAgIG5hdmlnYXRlQ29sczogKGtleSkgLT4gIyBtb3ZlIHRvIGZpbGUgYnJvd3Nlcj9cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICB0aGVuIEBicm93c2VyLm5hdmlnYXRlICd1cCdcbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnICB0aGVuIEBicm93c2VyLm5hdmlnYXRlICdsZWZ0J1xuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gQGJyb3dzZXIubmF2aWdhdGUgJ3JpZ2h0J1xuICAgICAgICAgICAgd2hlbiAnZW50ZXInXG4gICAgICAgICAgICAgICAgaWYgaXRlbSA9IEBhY3RpdmVSb3coKT8uaXRlbVxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gaXRlbS50eXBlXG4gICAgICAgICAgICAgICAgICAgIGlmIHR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgIEBicm93c2VyLmxvYWRJdGVtIGl0ZW1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnb3BlbkZpbGUnIGl0ZW0uZmlsZVxuICAgICAgICBAXG5cbiAgICBuYXZpZ2F0ZVJvb3Q6IChrZXkpIC0+IFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuYnJvd3NlIHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnICB0aGVuIHNsYXNoLmRpciBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIEBhY3RpdmVSb3coKS5pdGVtLmZpbGVcbiAgICAgICAgQFxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwMDAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICBcbiAgICBcbiAgICBkb1NlYXJjaDogKGNoYXIpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBudW1Sb3dzKClcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAc2VhcmNoRGl2XG4gICAgICAgICAgICBAc2VhcmNoRGl2ID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJTZWFyY2gnXG4gICAgICAgICAgICBcbiAgICAgICAgQHNldFNlYXJjaCBAc2VhcmNoICsgY2hhclxuICAgICAgICBcbiAgICBiYWNrc3BhY2VTZWFyY2g6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAc2VhcmNoRGl2IGFuZCBAc2VhcmNoLmxlbmd0aFxuICAgICAgICAgICAgQHNldFNlYXJjaCBAc2VhcmNoWzAuLi5Ac2VhcmNoLmxlbmd0aC0xXVxuICAgICAgICAgICAgXG4gICAgc2V0U2VhcmNoOiAoQHNlYXJjaCkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICBjbGVhclRpbWVvdXQgQHNlYXJjaFRpbWVyXG4gICAgICAgIEBzZWFyY2hUaW1lciA9IHNldFRpbWVvdXQgQGNsZWFyU2VhcmNoLCAyMDAwXG4gICAgICAgIFxuICAgICAgICBAc2VhcmNoRGl2LnRleHRDb250ZW50ID0gQHNlYXJjaFxuXG4gICAgICAgIGFjdGl2ZUluZGV4ICA9IEBhY3RpdmVSb3coKT8uaW5kZXgoKSA/IDBcbiAgICAgICAgYWN0aXZlSW5kZXggKz0gMSBpZiAoQHNlYXJjaC5sZW5ndGggPT0gMSkgI29yIChjaGFyID09ICcnKVxuICAgICAgICBhY3RpdmVJbmRleCAgPSAwIGlmIGFjdGl2ZUluZGV4ID49IEBudW1Sb3dzKClcbiAgICAgICAgXG4gICAgICAgIGZvciByb3dzIGluIFtAcm93cy5zbGljZShhY3RpdmVJbmRleCksIEByb3dzLnNsaWNlKDAsYWN0aXZlSW5kZXgrMSldXG4gICAgICAgICAgICBmdXp6aWVkID0gZnV6enkuZmlsdGVyIEBzZWFyY2gsIHJvd3MsIGV4dHJhY3Q6IChyKSAtPiByLml0ZW0ubmFtZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBmdXp6aWVkLmxlbmd0aFxuICAgICAgICAgICAgICAgIHJvdyA9IGZ1enppZWRbMF0ub3JpZ2luYWxcbiAgICAgICAgICAgICAgICByb3cuZGl2LmFwcGVuZENoaWxkIEBzZWFyY2hEaXZcbiAgICAgICAgICAgICAgICByb3cuYWN0aXZhdGUoKVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIEBcbiAgICBcbiAgICBjbGVhclNlYXJjaDogPT5cbiAgICAgICAgXG4gICAgICAgIEBzZWFyY2ggPSAnJ1xuICAgICAgICBAc2VhcmNoRGl2Py5yZW1vdmUoKVxuICAgICAgICBkZWxldGUgQHNlYXJjaERpdlxuICAgICAgICBAXG4gICAgXG4gICAgcmVtb3ZlT2JqZWN0OiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgcm93ID0gQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICBuZXh0T3JQcmV2ID0gcm93Lm5leHQoKSA/IHJvdy5wcmV2KClcbiAgICAgICAgICAgIEByZW1vdmVSb3cgcm93XG4gICAgICAgICAgICBuZXh0T3JQcmV2Py5hY3RpdmF0ZSgpXG4gICAgICAgIEBcblxuICAgIHJlbW92ZVJvdzogKHJvdykgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHJvdyA9PSBAYWN0aXZlUm93KClcbiAgICAgICAgICAgIGlmIEBuZXh0Q29sdW1uKCk/LnBhcmVudD8uZmlsZSA9PSByb3cuaXRlbT8uZmlsZVxuICAgICAgICAgICAgICAgICMga2xvZyAncmVtb3ZlUm93IGNsZWFyJ1xuICAgICAgICAgICAgICAgIEBicm93c2VyLmNsZWFyQ29sdW1uc0Zyb20gQGluZGV4ICsgMVxuICAgICAgICAgICAgXG4gICAgICAgIHJvdy5kaXYucmVtb3ZlKClcbiAgICAgICAgQGl0ZW1zLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICBAcm93cy5zcGxpY2Ugcm93LmluZGV4KCksIDFcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgc29ydEJ5TmFtZTogPT5cbiAgICAgICAgIFxuICAgICAgICBAcm93cy5zb3J0IChhLGIpIC0+IFxuICAgICAgICAgICAgKGEuaXRlbS50eXBlICsgYS5pdGVtLm5hbWUpLmxvY2FsZUNvbXBhcmUoYi5pdGVtLnR5cGUgKyBiLml0ZW0ubmFtZSlcbiAgICAgICAgICAgIFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93c1xuICAgICAgICAgICAgQHRhYmxlLmFwcGVuZENoaWxkIHJvdy5kaXZcbiAgICAgICAgQFxuICAgICAgICBcbiAgICBzb3J0QnlUeXBlOiA9PlxuICAgICAgICBcbiAgICAgICAgQHJvd3Muc29ydCAoYSxiKSAtPiBcbiAgICAgICAgICAgIGF0eXBlID0gYS5pdGVtLnR5cGUgPT0gJ2ZpbGUnIGFuZCBzbGFzaC5leHQoYS5pdGVtLm5hbWUpIG9yICdfX18nICNhLml0ZW0udHlwZVxuICAgICAgICAgICAgYnR5cGUgPSBiLml0ZW0udHlwZSA9PSAnZmlsZScgYW5kIHNsYXNoLmV4dChiLml0ZW0ubmFtZSkgb3IgJ19fXycgI2IuaXRlbS50eXBlXG4gICAgICAgICAgICAoYS5pdGVtLnR5cGUgKyBhdHlwZSArIGEuaXRlbS5uYW1lKS5sb2NhbGVDb21wYXJlKGIuaXRlbS50eXBlICsgYnR5cGUgKyBiLml0ZW0ubmFtZSwgdW5kZWZpbmVkLCBudW1lcmljOnRydWUpXG4gICAgICAgICAgICBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIEB0YWJsZS5hcHBlbmRDaGlsZCByb3cuZGl2XG4gICAgICAgIEBcblxuICAgIHNvcnRCeURhdGVBZGRlZDogPT5cbiAgICAgICAgXG4gICAgICAgIEByb3dzLnNvcnQgKGEsYikgLT4gYi5pdGVtLnN0YXQ/LmF0aW1lTXMgLSBhLml0ZW0uc3RhdD8uYXRpbWVNc1xuICAgICAgICAgICAgXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICBAdGFibGUuYXBwZW5kQ2hpbGQgcm93LmRpdlxuICAgICAgICBAXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICB0b2dnbGVEb3RGaWxlczogPT5cblxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAjIGxvZyAnY29sdW1uLnRvZ2dsZURvdEZpbGVzJyBAcGFyZW50XG4gICAgICAgICAgICBAcGFyZW50LnR5cGUgPSBzbGFzaC5pc0RpcihAcGFyZW50LmZpbGUpIGFuZCAnZGlyJyBvciAnZmlsZSdcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgPT0gJ2RpcicgICAgICAgICAgICBcbiAgICAgICAgICAgIHN0YXRlS2V5ID0gXCJicm93c2Vy4pa4c2hvd0hpZGRlbuKWuCN7QHBhcmVudC5maWxlfVwiXG4gICAgICAgICAgICBpZiBwcmVmcy5nZXQgc3RhdGVLZXlcbiAgICAgICAgICAgICAgICBwcmVmcy5kZWwgc3RhdGVLZXlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwcmVmcy5zZXQgc3RhdGVLZXksIHRydWVcbiAgICAgICAgICAgIEBicm93c2VyLmxvYWREaXJJdGVtIEBwYXJlbnQsIEBpbmRleCwgaWdub3JlQ2FjaGU6dHJ1ZVxuICAgICAgICBAXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG1vdmVUb1RyYXNoOiA9PlxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBAYnJvd3Nlci5zZWxlY3QuZnJlZUluZGV4KClcbiAgICAgICAgaWYgaW5kZXggPj0gMFxuICAgICAgICAgICAgc2VsZWN0Um93ID0gQHJvdyBpbmRleFxuICAgICAgICBcbiAgICAgICAgZm9yIHJvdyBpbiBAYnJvd3Nlci5zZWxlY3Qucm93c1xuICAgICAgICAgICAgd3h3ICd0cmFzaCcgcm93LnBhdGgoKVxuICAgICAgICAgICAgQHJlbW92ZVJvdyByb3dcbiAgICAgICAgICAgXG4gICAgICAgIGlmIHNlbGVjdFJvd1xuICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyBzZWxlY3RSb3dcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG5hdmlnYXRlQ29scyAnbGVmdCdcblxuICAgIGFkZFRvU2hlbGY6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBwYXRoVG9TaGVsZiA9IEBhY3RpdmVQYXRoKClcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnYWRkVG9TaGVsZicgcGF0aFRvU2hlbGZcblxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgIDAwMCAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgICAgIDAgICAgICAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG9wZW5WaWV3ZXI6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAYWN0aXZlUm93KCk/Lml0ZW0ubmFtZSAhPSAnLi4nIFxuICAgICAgICAgICAgcGF0aCA9IEBhY3RpdmVQYXRoKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcGF0aCA9IEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIHBhdGhcbiAgICAgICAgICAgIGlmIEZpbGUuaXNUZXh0IHBhdGhcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci52aWV3ZXIgPSBuZXcgRWRpdG9yIEBicm93c2VyLCBwYXRoXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBzbGFzaC5pc0ZpbGUgcGF0aFxuICAgICAgICAgICAgICAgIGlmIG5vdCBGaWxlLmlzSW1hZ2UgcGF0aFxuICAgICAgICAgICAgICAgICAgICBwYXRoID0gQHBhdGgoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAYnJvd3Nlci52aWV3ZXIgPSBuZXcgVmlld2VyIEBicm93c2VyLCBwYXRoXG4gICAgICAgIFxuICAgIG5ld0ZvbGRlcjogPT5cbiAgICAgICAgXG4gICAgICAgIHNsYXNoLnVudXNlZCBzbGFzaC5qb2luKEBwYXRoKCksICdOZXcgZm9sZGVyJyksIChuZXdEaXIpID0+XG4gICAgICAgICAgICBmcy5ta2RpciBuZXdEaXIsIChlcnIpID0+XG4gICAgICAgICAgICAgICAgaWYgZW1wdHkgZXJyXG4gICAgICAgICAgICAgICAgICAgIHJvdyA9IEBpbnNlcnRGaWxlIG5ld0RpclxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IHJvd1xuICAgICAgICAgICAgICAgICAgICByb3cuZWRpdE5hbWUoKVxuICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBkdXBsaWNhdGVGaWxlOiA9PlxuICAgICAgICAgICAgICAgIFxuICAgICAgICBmb3IgZmlsZSBpbiBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKVxuICAgICAgICAgICAgRmlsZS5kdXBsaWNhdGUgZmlsZSwgKHNvdXJjZSwgdGFyZ2V0KSA9PlxuICAgICAgICAgICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgY29sID0gQHByZXZDb2x1bW4oKVxuICAgICAgICAgICAgICAgICAgICBjb2wuZm9jdXMoKVxuICAgICAgICAgICAgICAgIGVsc2UgY29sID0gQFxuICAgICAgICAgICAgICAgIHJvdyA9IGNvbC5pbnNlcnRGaWxlIHRhcmdldFxuICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgcm93XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBleHBsb3JlcjogPT5cbiAgICAgICAgXG4gICAgICAgIG9wZW4gc2xhc2guZGlyIEBhY3RpdmVQYXRoKClcbiAgICAgICAgXG4gICAgb3BlbjogPT5cblxuICAgICAgICBvcGVuIEBhY3RpdmVQYXRoKClcbiAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICBcbiAgICAgICAgXG4gICAgbWFrZVJvb3Q6ID0+IFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuc2hpZnRDb2x1bW5zVG8gQGluZGV4XG4gICAgICAgIFxuICAgICAgICBpZiBAYnJvd3Nlci5jb2x1bW5zWzBdLml0ZW1zWzBdLm5hbWUgIT0gJy4uJ1xuICAgICAgICAgICAgQHVuc2hpZnRJdGVtIFxuICAgICAgICAgICAgICAgIG5hbWU6ICcuLidcbiAgICAgICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgICAgIGZpbGU6IHNsYXNoLmRpciBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGNydW1iLnNldEZpbGUgQHBhcmVudC5maWxlXG4gICAgXG4gICAgb25Db250ZXh0TWVudTogKGV2ZW50LCBjb2x1bW4pID0+IFxuICAgICAgICBcbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgIFxuICAgICAgICBhYnNQb3MgPSBrcG9zIGV2ZW50XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgY29sdW1uXG4gICAgICAgICAgICBAc2hvd0NvbnRleHRNZW51IGFic1Bvc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG9wdCA9IGl0ZW1zOiBbIFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgJ1Jvb3QnXG4gICAgICAgICAgICAgICAgY2I6ICAgICBAbWFrZVJvb3RcbiAgICAgICAgICAgICxcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICdBZGQgdG8gU2hlbGYnXG4gICAgICAgICAgICAgICAgY29tYm86ICAnYWx0K3NoaWZ0Ky4nXG4gICAgICAgICAgICAgICAgY2I6ICAgICA9PiBwb3N0LmVtaXQgJ2FkZFRvU2hlbGYnIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgLFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgJ0V4cGxvcmVyJ1xuICAgICAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtlJyBcbiAgICAgICAgICAgICAgICBjYjogICAgID0+IG9wZW4gQHBhcmVudC5maWxlXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgICAgIHBvcHVwLm1lbnUgb3B0ICAgIFxuICAgICAgICAgICAgICBcbiAgICBzaG93Q29udGV4dE1lbnU6IChhYnNQb3MpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgYWJzUG9zP1xuICAgICAgICAgICAgYWJzUG9zID0ga3BvcyBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQsIEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgIFxuICAgICAgICBvcHQgPSBpdGVtczogWyBcbiAgICAgICAgICAgIHRleHQ6ICAgJ09wZW4nXG4gICAgICAgICAgICBjb21ibzogICdyZXR1cm4gYWx0K28nXG4gICAgICAgICAgICBjYjogICAgIEBvcGVuXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ1ZpZXdlcidcbiAgICAgICAgICAgIGNvbWJvOiAgJ3NwYWNlIGFsdCt2JyBcbiAgICAgICAgICAgIGNiOiAgICAgQG9wZW5WaWV3ZXJcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnRXhwbG9yZXInXG4gICAgICAgICAgICBjb21ibzogICdhbHQrZScgXG4gICAgICAgICAgICBjYjogICAgIEBleHBsb3JlclxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICcnXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0FkZCB0byBTaGVsZidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtzaGlmdCsuJ1xuICAgICAgICAgICAgY2I6ICAgICBAYWRkVG9TaGVsZlxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICcnXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ01vdmUgdG8gVHJhc2gnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2JhY2tzcGFjZScgXG4gICAgICAgICAgICBjYjogICAgIEBtb3ZlVG9UcmFzaFxuICAgICAgICAsICAgXG4gICAgICAgICAgICB0ZXh0OiAgICcnXG4gICAgICAgICAgICBoaWRlOiAgIEBwYXJlbnQudHlwZSA9PSAnZmlsZSdcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnRHVwbGljYXRlJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtkJyBcbiAgICAgICAgICAgIGNiOiAgICAgQGR1cGxpY2F0ZUZpbGVcbiAgICAgICAgICAgIGhpZGU6ICAgQHBhcmVudC50eXBlID09ICdmaWxlJ1xuICAgICAgICAsICAgXG4gICAgICAgICAgICB0ZXh0OiAgICdOZXcgRm9sZGVyJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K24nIFxuICAgICAgICAgICAgY2I6ICAgICBAbmV3Rm9sZGVyXG4gICAgICAgICAgICBoaWRlOiAgIEBwYXJlbnQudHlwZSA9PSAnZmlsZSdcbiAgICAgICAgXVxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmVudC50eXBlICE9ICdmaWxlJ1xuICAgICAgICAgICAgb3B0Lml0ZW1zID0gb3B0Lml0ZW1zLmNvbmNhdCBbXG4gICAgICAgICAgICAgICAgdGV4dDogICAnJ1xuICAgICAgICAgICAgLCAgIFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgJ1NvcnQnXG4gICAgICAgICAgICAgICAgbWVudTogW1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnQnkgTmFtZScgY29tYm86J2N0cmwrbicsIGNiOkBzb3J0QnlOYW1lXG4gICAgICAgICAgICAgICAgLFxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnQnkgVHlwZScgY29tYm86J2N0cmwrdCcsIGNiOkBzb3J0QnlUeXBlXG4gICAgICAgICAgICAgICAgLFxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnQnkgRGF0ZScgY29tYm86J2N0cmwrYScsIGNiOkBzb3J0QnlEYXRlQWRkZWRcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICAgICAgb3B0Lml0ZW1zID0gb3B0Lml0ZW1zLmNvbmNhdCB3aW5kb3cudGl0bGViYXIubWFrZVRlbXBsYXRlIHJlcXVpcmUgJy4vbWVudS5qc29uJ1xuICAgICAgICBcbiAgICAgICAgb3B0LnggPSBhYnNQb3MueFxuICAgICAgICBvcHQueSA9IGFic1Bvcy55XG4gICAgICAgIHBvcHVwLm1lbnUgb3B0ICAgICAgICBcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgY29weVBhdGhzOiAtPlxuICAgICAgICBcbiAgICAgICAgcGF0aHMgPSBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKS5qb2luICdcXG4nXG4gICAgICAgIGVsZWN0cm9uLmNsaXBib2FyZC53cml0ZVRleHQgcGF0aHNcbiAgICAgICAgcGF0aHNcbiAgICAgICAgXG4gICAgY3V0UGF0aHM6IC0+XG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5jdXRQYXRocyA9IEBjb3B5UGF0aHMoKVxuICAgICAgICBcbiAgICBwYXN0ZVBhdGhzOiAtPlxuICAgICAgICBcbiAgICAgICAgdGV4dCA9IGVsZWN0cm9uLmNsaXBib2FyZC5yZWFkVGV4dCgpXG4gICAgICAgIHBhdGhzID0gdGV4dC5zcGxpdCAnXFxuJ1xuICAgICAgICBpZiB0ZXh0ID09IEBicm93c2VyLmN1dFBhdGhzXG4gICAgICAgICAgICBhY3Rpb24gPSAnbW92ZSdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgYWN0aW9uID0gJ2NvcHknXG4gICAgICAgIHRhcmdldCA9IEBwYXJlbnQuZmlsZVxuICAgICAgICBpZiBAYWN0aXZlUm93KCk/Lml0ZW0udHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgdGFyZ2V0ID0gQGFjdGl2ZVJvdygpLml0ZW0uZmlsZVxuICAgICAgICBAYnJvd3Nlci5kcm9wQWN0aW9uIGFjdGlvbiwgcGF0aHMsIHRhcmdldFxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG9uS2V5OiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnc2hpZnQrYCcgJ34nICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIuYnJvd3NlICd+J1xuICAgICAgICAgICAgd2hlbiAnLycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIuYnJvd3NlICcvJ1xuICAgICAgICAgICAgd2hlbiAnYWx0K3NoaWZ0Ky4nICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGFkZFRvU2hlbGYoKVxuICAgICAgICAgICAgd2hlbiAnYWx0K2UnICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBleHBsb3JlcigpXG4gICAgICAgICAgICB3aGVuICdhbHQrbycgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQG9wZW4oKVxuICAgICAgICAgICAgd2hlbiAnYWx0K24nICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBuZXdGb2xkZXIoKVxuICAgICAgICAgICAgd2hlbiAnc3BhY2UnICdhbHQrdicgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBvcGVuVmlld2VyKClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwreCcgJ2NvbW1hbmQreCcgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAY3V0UGF0aHMoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtjJyAnY29tbWFuZCtjJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBjb3B5UGF0aHMoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCt2JyAnY29tbWFuZCt2JyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBwYXN0ZVBhdGhzKClcbiAgICAgICAgICAgIHdoZW4gJ3NoaWZ0K3VwJyAnc2hpZnQrZG93bicgJ3NoaWZ0K2hvbWUnICdzaGlmdCtlbmQnICdzaGlmdCtwYWdlIHVwJyAnc2hpZnQrcGFnZSBkb3duJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBleHRlbmRTZWxlY3Rpb24ga2V5XG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAncGFnZSBkb3duJyAnaG9tZScgJ2VuZCcgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzIGtleVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCt1cCcgJ2N0cmwrdXAnICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyAnaG9tZSdcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZG93bicgJ2N0cmwrZG93bicgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3MgJ2VuZCdcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJydhbHQrdXAnICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZUNvbHMga2V5XG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5vbkJhY2tzcGFjZUluQ29sdW1uIEBcbiAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZScgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLm9uRGVsZXRlSW5Db2x1bW4gQFxuICAgICAgICAgICAgd2hlbiAnY3RybCt0JyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeVR5cGUoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtuJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeU5hbWUoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCthJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeURhdGVBZGRlZCgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2knICdjdHJsK2knICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAdG9nZ2xlRG90RmlsZXMoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtkJyAnY3RybCtkJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGR1cGxpY2F0ZUZpbGUoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtrJyAnY3RybCtrJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCBpZiBAYnJvd3Nlci5jbGVhblVwKClcbiAgICAgICAgICAgIHdoZW4gJ2YyJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBhY3RpdmVSb3coKT8uZWRpdE5hbWUoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtsZWZ0JyAnY29tbWFuZCtyaWdodCcgJ2N0cmwrbGVmdCcgJ2N0cmwrcmlnaHQnXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm9vdCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrYmFja3NwYWNlJyAnY3RybCtiYWNrc3BhY2UnICdjb21tYW5kK2RlbGV0ZScgJ2N0cmwrZGVsZXRlJyBcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbW92ZVRvVHJhc2goKVxuICAgICAgICAgICAgd2hlbiAndGFiJyAgICBcbiAgICAgICAgICAgICAgICBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBkb1NlYXJjaCAnJ1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgICAgIHdoZW4gJ2VzYydcbiAgICAgICAgICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgICAgICAgICBAZHJhZ0Rpdi5kcmFnLmRyYWdTdG9wKClcbiAgICAgICAgICAgICAgICAgICAgQGRyYWdEaXYucmVtb3ZlKClcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEBkcmFnRGl2XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKS5sZW5ndGggPiAxXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBjbGVhclNlYXJjaCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuXG4gICAgICAgIGlmIGNvbWJvIGluIFsndXAnICAgJ2Rvd24nXSAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzIGtleSAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbWJvIGluIFsnbGVmdCcgJ3JpZ2h0J10gdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVDb2xzIGtleVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG1vZCBpbiBbJ3NoaWZ0JyAnJ10gYW5kIGNoYXIgdGhlbiBAZG9TZWFyY2ggY2hhclxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgIEB1cGRhdGVEcmFnSW5kaWNhdG9yIGV2ZW50XG4gICAgICAgICAgICBcbiAgICBvbktleVVwOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgQHVwZGF0ZURyYWdJbmRpY2F0b3IgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBDb2x1bW5cblxuXG4iXX0=
//# sourceURL=../coffee/column.coffee