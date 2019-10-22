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
        }
        if (this.dragDiv) {
            return this.dragDiv.style.transform = "translateX(" + d.deltaSum.x + "px) translateY(" + d.deltaSum.y + "px)";
        }
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

    Column.prototype.navigateRows = function(key) {
        var index, ref1, ref2, ref3;
        if (!this.numRows()) {
            return console.error("no rows in column " + this.index + "?");
        }
        index = (ref1 = (ref2 = this.activeRow()) != null ? ref2.index() : void 0) != null ? ref1 : -1;
        if ((index == null) || Number.isNaN(index)) {
            console.error("no index from activeRow? " + index + "?", this.activeRow());
        }
        index = (function() {
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
        if ((index == null) || Number.isNaN(index)) {
            console.error("no index " + index + "? " + (this.numVisible()));
        }
        index = clamp(0, this.numRows() - 1, index);
        if (((ref3 = this.rows[index]) != null ? ref3.activate : void 0) == null) {
            console.error("no row at index " + index + "/" + (this.numRows() - 1) + "?", this.numRows());
        }
        return this.browser.select.row(this.rows[index]);
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
                this.browser.viewer = new Editor(path);
                return;
            }
            if (!File.isImage(path)) {
                path = this.path();
            }
        }
        return this.browser.viewer = new Viewer(path);
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
                    text: 'Toggle Invisible',
                    combo: 'ctrl+i',
                    cb: this.toggleDotFiles
                }, {
                    text: 'Refresh',
                    combo: 'ctrl+r',
                    cb: this.browser.refresh
                }, {
                    text: 'Duplicate',
                    combo: 'ctrl+d',
                    cb: this.duplicateFile
                }, {
                    text: 'Move to Trash',
                    combo: 'ctrl+backspace',
                    cb: this.moveToTrash
                }, {
                    text: 'Add to Shelf',
                    combo: 'alt+shift+.',
                    cb: this.addToShelf
                }, {
                    text: 'New Folder',
                    combo: 'alt+n',
                    cb: this.newFolder
                }, {
                    text: 'Viewer',
                    combo: 'alt+v',
                    cb: this.openViewer
                }, {
                    text: 'Explorer',
                    combo: 'alt+e',
                    cb: this.explorer
                }, {
                    text: 'Open',
                    combo: 'alt+o',
                    cb: this.open
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
            case 'alt+e':
                return this.explorer();
            case 'alt+o':
                return this.open();
            case 'alt+n':
                return this.newFolder();
            case 'space':
            case 'alt+v':
                return this.openViewer();
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
            return this.doSearch(char);
        }
    };

    return Column;

})();

module.exports = Column;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sdW1uLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpTUFBQTtJQUFBOztBQVFBLE1BQW1JLE9BQUEsQ0FBUSxLQUFSLENBQW5JLEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUseUJBQWYsRUFBMEIsdUJBQTFCLEVBQW9DLHFCQUFwQyxFQUE2QyxpQkFBN0MsRUFBb0QsaUJBQXBELEVBQTJELGlCQUEzRCxFQUFrRSxpQkFBbEUsRUFBeUUsaUJBQXpFLEVBQWdGLGVBQWhGLEVBQXNGLGVBQXRGLEVBQTRGLGVBQTVGLEVBQWtHLGVBQWxHLEVBQXdHLFdBQXhHLEVBQTRHLGVBQTVHLEVBQWtILG1CQUFsSCxFQUEwSCxTQUExSCxFQUE2SDs7QUFFN0gsR0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsa0JBQVI7O0FBQ1gsSUFBQSxHQUFXLE9BQUEsQ0FBUSxjQUFSOztBQUNYLE1BQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxTQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFDWCxHQUFBLEdBQVcsT0FBQSxDQUFRLEtBQVI7O0FBRUw7SUFFQyxnQkFBQyxPQUFEO0FBRUMsWUFBQTtRQUZBLElBQUMsQ0FBQSxVQUFEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQUVBLElBQUMsQ0FBQSxXQUFELEdBQWU7UUFDZixJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLEtBQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxJQUFELEdBQVU7UUFFVixJQUFDLENBQUEsR0FBRCxHQUFTLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZUFBUDtZQUF1QixRQUFBLEVBQVMsQ0FBaEM7U0FBTDtR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TUFBeEIsR0FBaUMsQ0FBcEM7b0JBQ0QsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBaEIsQ0FBb0IsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFwQixFQURDO2lCQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQVg7b0JBQXVCLElBQUMsQ0FBQSxXQUFELENBQUEsRUFBdkI7O0FBQ0wsdUJBQU8sU0FBQSxDQUFVLEtBQVY7QUFuQ2Y7UUFxQ0EsSUFBRyxLQUFBLEtBQVUsSUFBVixJQUFBLEtBQUEsS0FBaUIsTUFBcEI7QUFBa0MsbUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFlBQUQsQ0FBYyxHQUFkLENBQWpCLEVBQXpDOztRQUNBLElBQUcsS0FBQSxLQUFVLE1BQVYsSUFBQSxLQUFBLEtBQWlCLE9BQXBCO0FBQWtDLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxZQUFELENBQWMsR0FBZCxDQUFqQixFQUF6Qzs7UUFFQSxJQUFHLENBQUEsR0FBQSxLQUFRLE9BQVIsSUFBQSxHQUFBLEtBQWdCLEVBQWhCLENBQUEsSUFBd0IsSUFBM0I7bUJBQXFDLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixFQUFyQzs7SUE1Q0c7Ozs7OztBQThDWCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMFxuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgcHJlZnMsIHN0b3BFdmVudCwgc2V0U3R5bGUsIGtleWluZm8sIHBvcHVwLCBzbGFzaCwgdmFsaWQsIGNsYW1wLCBlbXB0eSwgZHJhZywgb3BlbiwgZWxlbSwga3BvcywgZnMsIGtsb2csIGtlcnJvciwgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Sb3cgICAgICA9IHJlcXVpcmUgJy4vcm93J1xuU2Nyb2xsZXIgPSByZXF1aXJlICcuL3Rvb2xzL3Njcm9sbGVyJ1xuRmlsZSAgICAgPSByZXF1aXJlICcuL3Rvb2xzL2ZpbGUnXG5WaWV3ZXIgICA9IHJlcXVpcmUgJy4vdmlld2VyJ1xuRWRpdG9yICAgPSByZXF1aXJlICcuL2VkaXRvcidcbkNydW1iICAgID0gcmVxdWlyZSAnLi9jcnVtYidcbmZ1enp5ICAgID0gcmVxdWlyZSAnZnV6enknXG53eHcgICAgICA9IHJlcXVpcmUgJ3d4dydcblxuY2xhc3MgQ29sdW1uXG4gICAgXG4gICAgQDogKEBicm93c2VyKSAtPlxuICAgICAgICBcbiAgICAgICAgQHNlYXJjaFRpbWVyID0gbnVsbFxuICAgICAgICBAc2VhcmNoID0gJydcbiAgICAgICAgQGl0ZW1zICA9IFtdXG4gICAgICAgIEByb3dzICAgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGRpdiAgID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJDb2x1bW4nIHRhYkluZGV4OjZcbiAgICAgICAgQHRhYmxlID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJDb2x1bW5UYWJsZSdcbiAgICAgICAgQGRpdi5hcHBlbmRDaGlsZCBAdGFibGVcbiAgICAgICAgXG4gICAgICAgIEBzZXRJbmRleCBAYnJvd3Nlci5jb2x1bW5zPy5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmNvbHM/LmFwcGVuZENoaWxkIEBkaXZcbiAgICAgICAgXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnZm9jdXMnICAgICBAb25Gb2N1c1xuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2JsdXInICAgICAgQG9uQmx1clxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2tleWRvd24nICAgQG9uS2V5XG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlb3ZlcicgQG9uTW91c2VPdmVyXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2VvdXQnICBAb25Nb3VzZU91dFxuXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnZGJsY2xpY2snICBAb25EYmxDbGlja1xuICAgICAgICBcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdjb250ZXh0bWVudScgQG9uQ29udGV4dE1lbnVcbiAgXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBkaXZcbiAgICAgICAgICAgIG9uU3RhcnQ6IEBvbkRyYWdTdGFydFxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uRHJhZ01vdmVcbiAgICAgICAgICAgIG9uU3RvcDogIEBvbkRyYWdTdG9wXG4gICAgICAgIFxuICAgICAgICBAY3J1bWIgID0gbmV3IENydW1iIEBcbiAgICAgICAgQHNjcm9sbCA9IG5ldyBTY3JvbGxlciBAXG4gICAgICAgIFxuICAgIHNldEluZGV4OiAoQGluZGV4KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNydW1iPy5lbGVtLmNvbHVtbkluZGV4ID0gQGluZGV4XG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgb25EcmFnU3RhcnQ6IChkLCBlKSA9PiBcbiAgICBcbiAgICAgICAgQGRyYWdTdGFydFJvdyA9IEByb3cgZS50YXJnZXRcbiAgICAgICAgXG4gICAgICAgIGRlbGV0ZSBAdG9nZ2xlXG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ1N0YXJ0Um93XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGUuc2hpZnRLZXlcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3QudG8gQGRyYWdTdGFydFJvd1xuICAgICAgICAgICAgZWxzZSBpZiBlLm1ldGFLZXkgb3IgZS5hbHRLZXkgb3IgZS5jdHJsS2V5XG4gICAgICAgICAgICAgICAgaWYgbm90IHJvdy5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnRvZ2dsZSBAZHJhZ1N0YXJ0Um93XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAdG9nZ2xlID0gdHJ1ZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIEBkcmFnU3RhcnRSb3cuaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgICAgIEBkZXNlbGVjdCA9IHRydWVcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBhY3RpdmVSb3coKT8uY2xlYXJBY3RpdmUoKVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IEBkcmFnU3RhcnRSb3csIGZhbHNlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIEBoYXNGb2N1cygpXG4gICAgICAgICAgICAgICAgaWYgQGFjdGl2ZVJvdygpID8gQGJyb3dzZXIuc2VsZWN0LmFjdGl2ZVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IEBhY3RpdmVSb3coKSA/IEBicm93c2VyLnNlbGVjdC5hY3RpdmVcblxuICAgIG9uRHJhZ01vdmU6IChkLGUpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ1N0YXJ0Um93IGFuZCBub3QgQGRyYWdEaXYgYW5kIHZhbGlkIEBicm93c2VyLnNlbGVjdC5maWxlcygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBpZiBNYXRoLmFicyhkLmRlbHRhU3VtLngpIDwgMjAgYW5kIE1hdGguYWJzKGQuZGVsdGFTdW0ueSkgPCAxMFxuXG4gICAgICAgICAgICBkZWxldGUgQHRvZ2dsZSBcbiAgICAgICAgICAgIGRlbGV0ZSBAZGVzZWxlY3RcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGRyYWdEaXYgPSBlbGVtICdkaXYnXG4gICAgICAgICAgICBAZHJhZ0Rpdi5kcmFnID0gZFxuICAgICAgICAgICAgcG9zID0ga3BvcyBlLnBhZ2VYLCBlLnBhZ2VZXG4gICAgICAgICAgICByb3cgPSBAYnJvd3Nlci5zZWxlY3Qucm93c1swXVxuICAgICAgICAgICAgYnIgID0gcm93LmRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLm9wYWNpdHkgID0gXCIwLjdcIlxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUudG9wICA9IFwiI3twb3MueS1kLmRlbHRhU3VtLnl9cHhcIlxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUubGVmdCA9IFwiI3twb3MueC1kLmRlbHRhU3VtLnh9cHhcIlxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUud2lkdGggPSBcIiN7YnIud2lkdGgtMTJ9cHhcIlxuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3Igcm93IGluIEBicm93c2VyLnNlbGVjdC5yb3dzXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUgPSByb3cuZGl2LmNsb25lTm9kZSB0cnVlXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUuc3R5bGUuZmxleCA9ICd1bnNldCdcbiAgICAgICAgICAgICAgICByb3dDbG9uZS5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUuc3R5bGUuYm9yZGVyID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgcm93Q2xvbmUuc3R5bGUubWFyZ2luQm90dG9tID0gJy0xcHgnXG4gICAgICAgICAgICAgICAgQGRyYWdEaXYuYXBwZW5kQ2hpbGQgcm93Q2xvbmVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQgQGRyYWdEaXZcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZVgoI3tkLmRlbHRhU3VtLnh9cHgpIHRyYW5zbGF0ZVkoI3tkLmRlbHRhU3VtLnl9cHgpXCJcblxuICAgIG9uRHJhZ1N0b3A6IChkLGUpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0Rpdj9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGRyYWdEaXYucmVtb3ZlKClcbiAgICAgICAgICAgIGRlbGV0ZSBAZHJhZ0RpdlxuICAgICAgICAgICAgZGVsZXRlIEBkcmFnU3RhcnRSb3dcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcm93ID0gQGJyb3dzZXIucm93QXRQb3MgZC5wb3NcbiAgICAgICAgICAgICAgICBjb2x1bW4gPSByb3cuY29sdW1uXG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gcm93Lml0ZW0uZmlsZVxuICAgICAgICAgICAgZWxzZSBpZiBjb2x1bW4gPSBAYnJvd3Nlci5jb2x1bW5BdFBvcyBkLnBvc1xuICAgICAgICAgICAgICAgIHRhcmdldCA9IGNvbHVtbi5wYXJlbnQ/LmZpbGVcbiAgICAgICAgICAgIGVsc2UgaWYgY29sdW1uID0gQGJyb3dzZXIuY29sdW1uQXRYIGQucG9zLnhcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSBjb2x1bW4ucGFyZW50Py5maWxlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAga2xvZyAnbm8gZHJvcCB0YXJnZXQnXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBhY3Rpb24gPSBlLnNoaWZ0S2V5IGFuZCAnY29weScgb3IgJ21vdmUnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBjb2x1bW4gPT0gQGJyb3dzZXIuc2hlbGYgXG4gICAgICAgICAgICAgICAgaWYgdGFyZ2V0IGFuZCAoZS5jdHJsS2V5IG9yIGUuc2hpZnRLZXkgb3IgZS5tZXRhS2V5IG9yIGUuYWx0S2V5KVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5kcm9wQWN0aW9uIGFjdGlvbiwgQGJyb3dzZXIuc2VsZWN0LmZpbGVzKCksIHRhcmdldFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2hlbGYuYWRkRmlsZXMgQGJyb3dzZXIuc2VsZWN0LmZpbGVzKCksIHBvczpkLnBvc1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBicm93c2VyLmRyb3BBY3Rpb24gYWN0aW9uLCBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKSwgdGFyZ2V0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGZvY3VzIGFjdGl2YXRlOmZhbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHJvdyA9IEByb3cgZS50YXJnZXRcbiAgICAgICAgICAgICAgICBpZiByb3cuaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgICAgIGlmIGUubWV0YUtleSBvciBlLmFsdEtleSBvciBlLmN0cmxLZXkgb3IgZS5zaGlmdEtleVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQHRvZ2dsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBAdG9nZ2xlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnRvZ2dsZSByb3dcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQGRlc2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEBkZXNlbGVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgcm93XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIHJlbW92ZUZpbGU6IChmaWxlKSA9PiBcbiAgICAgICAgXG4gICAgICAgIGlmIHJvdyA9IEByb3cgc2xhc2guZmlsZSBmaWxlXG4gICAgICAgICAgICBAcmVtb3ZlUm93IHJvd1xuICAgICAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICAgICAgXG4gICAgaW5zZXJ0RmlsZTogKGZpbGUpID0+IFxuXG4gICAgICAgIGl0ZW0gPSBAYnJvd3Nlci5maWxlSXRlbSBmaWxlXG4gICAgICAgIHJvdyA9IG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBAcm93cy5wdXNoIHJvd1xuICAgICAgICByb3dcbiAgICBcbiAgICBsb2FkSXRlbXM6IChpdGVtcywgcGFyZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW4gQGluZGV4XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMgID0gaXRlbXNcbiAgICAgICAgQHBhcmVudCA9IHBhcmVudFxuICAgICAgICBcbiAgICAgICAgQGNydW1iLnNldEZpbGUgQHBhcmVudC5maWxlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSB1bmRlZmluZWRcbiAgICAgICAgICAgIEBwYXJlbnQudHlwZSA9IHNsYXNoLmlzRGlyKEBwYXJlbnQuZmlsZSkgYW5kICdkaXInIG9yICdmaWxlJ1xuICAgICAgICBcbiAgICAgICAga2Vycm9yIFwibm8gcGFyZW50IGl0ZW0/XCIgaWYgbm90IEBwYXJlbnQ/XG4gICAgICAgIGtlcnJvciBcImxvYWRJdGVtcyAtLSBubyBwYXJlbnQgdHlwZT9cIiwgQHBhcmVudCBpZiBub3QgQHBhcmVudC50eXBlP1xuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgQGl0ZW1zXG4gICAgICAgICAgICBmb3IgaXRlbSBpbiBAaXRlbXNcbiAgICAgICAgICAgICAgICBAcm93cy5wdXNoIG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBcbiAgICAgICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgPT0gJ2RpcicgYW5kIHNsYXNoLnNhbWVQYXRoICd+L0Rvd25sb2FkcycgQHBhcmVudC5maWxlXG4gICAgICAgICAgICBAc29ydEJ5RGF0ZUFkZGVkKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICB1bnNoaWZ0SXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMudW5zaGlmdCBpdGVtXG4gICAgICAgIEByb3dzLnVuc2hpZnQgbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIEB0YWJsZS5pbnNlcnRCZWZvcmUgQHRhYmxlLmxhc3RDaGlsZCwgQHRhYmxlLmZpcnN0Q2hpbGRcbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAcm93c1swXVxuICAgICAgICBcbiAgICBwdXNoSXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMucHVzaCBpdGVtXG4gICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgQHJvd3NbLTFdXG4gICAgICAgIFxuICAgIGFkZEl0ZW06IChpdGVtKSAtPlxuICAgICAgICBcbiAgICAgICAgcm93ID0gQHB1c2hJdGVtIGl0ZW1cbiAgICAgICAgQHNvcnRCeU5hbWUoKVxuICAgICAgICByb3dcblxuICAgIHNldEl0ZW1zOiAoQGl0ZW1zLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5jbGVhckNvbHVtbiBAaW5kZXhcbiAgICAgICAgXG4gICAgICAgIEBwYXJlbnQgPSBvcHQucGFyZW50XG4gICAgICAgIGtlcnJvciBcIm5vIHBhcmVudCBpdGVtP1wiIGlmIG5vdCBAcGFyZW50P1xuICAgICAgICBrZXJyb3IgXCJzZXRJdGVtcyAtLSBubyBwYXJlbnQgdHlwZT9cIiwgQHBhcmVudCBpZiBub3QgQHBhcmVudC50eXBlP1xuICAgICAgICBcbiAgICAgICAgZm9yIGl0ZW0gaW4gQGl0ZW1zXG4gICAgICAgICAgICBAcm93cy5wdXNoIG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBcbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAXG5cbiAgICBpc0RpcjogIC0+IEBwYXJlbnQ/LnR5cGUgPT0gJ2RpcicgXG4gICAgaXNGaWxlOiAtPiBAcGFyZW50Py50eXBlID09ICdmaWxlJyBcbiAgICAgICAgXG4gICAgaXNFbXB0eTogLT4gZW1wdHkgQHBhcmVudFxuICAgIGNsZWFyOiAgIC0+XG4gICAgICAgIEBjbGVhclNlYXJjaCgpXG4gICAgICAgIGRlbGV0ZSBAcGFyZW50XG4gICAgICAgIEBkaXYuc2Nyb2xsVG9wID0gMFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgQGNydW1iLmNsZWFyKClcbiAgICAgICAgQHJvd3MgPSBbXVxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIFxuICAgXG4gICAgYWN0aXZhdGVSb3c6IChyb3cpIC0+IEByb3cocm93KT8uYWN0aXZhdGUoKVxuICAgICAgIFxuICAgIGFjdGl2ZVJvdzogLT4gXy5maW5kIEByb3dzLCAocikgLT4gci5pc0FjdGl2ZSgpXG4gICAgYWN0aXZlUGF0aDogLT4gQGFjdGl2ZVJvdygpPy5wYXRoKClcbiAgICBcbiAgICByb3c6IChyb3cpIC0+ICMgYWNjZXB0cyBlbGVtZW50LCBpbmRleCwgc3RyaW5nIG9yIHJvd1xuICAgICAgICBpZiAgICAgIF8uaXNOdW1iZXIgIHJvdyB0aGVuIHJldHVybiAwIDw9IHJvdyA8IEBudW1Sb3dzKCkgYW5kIEByb3dzW3Jvd10gb3IgbnVsbFxuICAgICAgICBlbHNlIGlmIF8uaXNFbGVtZW50IHJvdyB0aGVuIHJldHVybiBfLmZpbmQgQHJvd3MsIChyKSAtPiByLmRpdi5jb250YWlucyByb3dcbiAgICAgICAgZWxzZSBpZiBfLmlzU3RyaW5nICByb3cgdGhlbiByZXR1cm4gXy5maW5kIEByb3dzLCAocikgLT4gci5pdGVtLm5hbWUgPT0gcm93IG9yIHIuaXRlbS5maWxlID09IHJvd1xuICAgICAgICBlbHNlIHJldHVybiByb3dcbiAgICAgICAgICAgIFxuICAgIG5leHRDb2x1bW46IC0+IEBicm93c2VyLmNvbHVtbiBAaW5kZXgrMVxuICAgIHByZXZDb2x1bW46IC0+IEBicm93c2VyLmNvbHVtbiBAaW5kZXgtMVxuICAgICAgICBcbiAgICBuYW1lOiAtPiBcIiN7QGJyb3dzZXIubmFtZX06I3tAaW5kZXh9XCJcbiAgICBwYXRoOiAtPiBAcGFyZW50Py5maWxlID8gJydcbiAgICAgICAgXG4gICAgbnVtUm93czogICAgLT4gQHJvd3MubGVuZ3RoID8gMCAgIFxuICAgIHJvd0hlaWdodDogIC0+IEByb3dzWzBdPy5kaXYuY2xpZW50SGVpZ2h0ID8gMFxuICAgIG51bVZpc2libGU6IC0+IEByb3dIZWlnaHQoKSBhbmQgcGFyc2VJbnQoQGJyb3dzZXIuaGVpZ2h0KCkgLyBAcm93SGVpZ2h0KCkpIG9yIDBcbiAgICBcbiAgICByb3dBdFBvczogKHBvcykgLT4gQHJvdyBAcm93SW5kZXhBdFBvcyBwb3NcbiAgICBcbiAgICByb3dJbmRleEF0UG9zOiAocG9zKSAtPlxuICAgICAgICBcbiAgICAgICAgTWF0aC5tYXggMCwgTWF0aC5mbG9vciAocG9zLnkgLSBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCkgLyBAcm93SGVpZ2h0KClcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBoYXNGb2N1czogLT4gQGRpdi5jbGFzc0xpc3QuY29udGFpbnMgJ2ZvY3VzJ1xuXG4gICAgZm9jdXM6IChvcHQ9e30pIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAYWN0aXZlUm93KCkgYW5kIEBudW1Sb3dzKCkgYW5kIG9wdD8uYWN0aXZhdGUgIT0gZmFsc2VcbiAgICAgICAgICAgIEByb3dzWzBdLnNldEFjdGl2ZSgpXG4gICAgICAgIEBkaXYuZm9jdXMoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgIG9uRm9jdXM6ID0+IEBkaXYuY2xhc3NMaXN0LmFkZCAnZm9jdXMnXG4gICAgb25CbHVyOiAgPT4gQGRpdi5jbGFzc0xpc3QucmVtb3ZlICdmb2N1cydcblxuICAgIGZvY3VzQnJvd3NlcjogLT4gQGJyb3dzZXIuZm9jdXMoKVxuICAgIFxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgb25Nb3VzZU92ZXI6IChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5vbk1vdXNlT3ZlcigpXG4gICAgb25Nb3VzZU91dDogIChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5vbk1vdXNlT3V0KClcbiAgICBcbiAgICBvbkRibENsaWNrOiAgKGV2ZW50KSA9PiBcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnNraXBPbkRibENsaWNrID0gdHJ1ZVxuICAgICAgICBAbmF2aWdhdGVDb2xzICdlbnRlcidcbiAgICBcbiAgICB1cGRhdGVDcnVtYjogPT4gQGNydW1iLnVwZGF0ZVJlY3QgQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuXG4gICAgbmF2aWdhdGVSb3dzOiAoa2V5KSAtPlxuXG4gICAgICAgIHJldHVybiBlcnJvciBcIm5vIHJvd3MgaW4gY29sdW1uICN7QGluZGV4fT9cIiBpZiBub3QgQG51bVJvd3MoKVxuICAgICAgICBpbmRleCA9IEBhY3RpdmVSb3coKT8uaW5kZXgoKSA/IC0xXG4gICAgICAgIGVycm9yIFwibm8gaW5kZXggZnJvbSBhY3RpdmVSb3c/ICN7aW5kZXh9P1wiLCBAYWN0aXZlUm93KCkgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIGluZGV4LTFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiBpbmRleCsxXG4gICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gMFxuICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIEBudW1Sb3dzKCktMVxuICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcgICB0aGVuIGluZGV4LUBudW1WaXNpYmxlKClcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgZG93bicgdGhlbiBpbmRleCtAbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICBlbHNlIGluZGV4XG4gICAgICAgICAgICBcbiAgICAgICAgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXggICAgICAgIFxuICAgICAgICAgICAgZXJyb3IgXCJubyBpbmRleCAje2luZGV4fT8gI3tAbnVtVmlzaWJsZSgpfVwiXG4gICAgICAgICAgICBcbiAgICAgICAgaW5kZXggPSBjbGFtcCAwLCBAbnVtUm93cygpLTEsIGluZGV4XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQHJvd3NbaW5kZXhdPy5hY3RpdmF0ZT9cbiAgICAgICAgICAgIGVycm9yIFwibm8gcm93IGF0IGluZGV4ICN7aW5kZXh9LyN7QG51bVJvd3MoKS0xfT9cIiwgQG51bVJvd3MoKSBcbiAgICAgICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IEByb3dzW2luZGV4XVxuICAgIFxuICAgIG5hdmlnYXRlQ29sczogKGtleSkgLT4gIyBtb3ZlIHRvIGZpbGUgYnJvd3Nlcj9cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICB0aGVuIEBicm93c2VyLm5hdmlnYXRlICd1cCdcbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnICB0aGVuIEBicm93c2VyLm5hdmlnYXRlICdsZWZ0J1xuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gQGJyb3dzZXIubmF2aWdhdGUgJ3JpZ2h0J1xuICAgICAgICAgICAgd2hlbiAnZW50ZXInXG4gICAgICAgICAgICAgICAgaWYgaXRlbSA9IEBhY3RpdmVSb3coKT8uaXRlbVxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gaXRlbS50eXBlXG4gICAgICAgICAgICAgICAgICAgIGlmIHR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgIEBicm93c2VyLmxvYWRJdGVtIGl0ZW1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnb3BlbkZpbGUnIGl0ZW0uZmlsZVxuICAgICAgICBAXG5cbiAgICBuYXZpZ2F0ZVJvb3Q6IChrZXkpIC0+IFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuYnJvd3NlIHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnICB0aGVuIHNsYXNoLmRpciBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIEBhY3RpdmVSb3coKS5pdGVtLmZpbGVcbiAgICAgICAgQFxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwMDAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICBcbiAgICBcbiAgICBkb1NlYXJjaDogKGNoYXIpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBudW1Sb3dzKClcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAc2VhcmNoRGl2XG4gICAgICAgICAgICBAc2VhcmNoRGl2ID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJTZWFyY2gnXG4gICAgICAgICAgICBcbiAgICAgICAgQHNldFNlYXJjaCBAc2VhcmNoICsgY2hhclxuICAgICAgICBcbiAgICBiYWNrc3BhY2VTZWFyY2g6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAc2VhcmNoRGl2IGFuZCBAc2VhcmNoLmxlbmd0aFxuICAgICAgICAgICAgQHNldFNlYXJjaCBAc2VhcmNoWzAuLi5Ac2VhcmNoLmxlbmd0aC0xXVxuICAgICAgICAgICAgXG4gICAgc2V0U2VhcmNoOiAoQHNlYXJjaCkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICBjbGVhclRpbWVvdXQgQHNlYXJjaFRpbWVyXG4gICAgICAgIEBzZWFyY2hUaW1lciA9IHNldFRpbWVvdXQgQGNsZWFyU2VhcmNoLCAyMDAwXG4gICAgICAgIFxuICAgICAgICBAc2VhcmNoRGl2LnRleHRDb250ZW50ID0gQHNlYXJjaFxuXG4gICAgICAgIGFjdGl2ZUluZGV4ICA9IEBhY3RpdmVSb3coKT8uaW5kZXgoKSA/IDBcbiAgICAgICAgYWN0aXZlSW5kZXggKz0gMSBpZiAoQHNlYXJjaC5sZW5ndGggPT0gMSkgI29yIChjaGFyID09ICcnKVxuICAgICAgICBhY3RpdmVJbmRleCAgPSAwIGlmIGFjdGl2ZUluZGV4ID49IEBudW1Sb3dzKClcbiAgICAgICAgXG4gICAgICAgIGZvciByb3dzIGluIFtAcm93cy5zbGljZShhY3RpdmVJbmRleCksIEByb3dzLnNsaWNlKDAsYWN0aXZlSW5kZXgrMSldXG4gICAgICAgICAgICBmdXp6aWVkID0gZnV6enkuZmlsdGVyIEBzZWFyY2gsIHJvd3MsIGV4dHJhY3Q6IChyKSAtPiByLml0ZW0ubmFtZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBmdXp6aWVkLmxlbmd0aFxuICAgICAgICAgICAgICAgIHJvdyA9IGZ1enppZWRbMF0ub3JpZ2luYWxcbiAgICAgICAgICAgICAgICByb3cuZGl2LmFwcGVuZENoaWxkIEBzZWFyY2hEaXZcbiAgICAgICAgICAgICAgICByb3cuYWN0aXZhdGUoKVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIEBcbiAgICBcbiAgICBjbGVhclNlYXJjaDogPT5cbiAgICAgICAgXG4gICAgICAgIEBzZWFyY2ggPSAnJ1xuICAgICAgICBAc2VhcmNoRGl2Py5yZW1vdmUoKVxuICAgICAgICBkZWxldGUgQHNlYXJjaERpdlxuICAgICAgICBAXG4gICAgXG4gICAgcmVtb3ZlT2JqZWN0OiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgcm93ID0gQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICBuZXh0T3JQcmV2ID0gcm93Lm5leHQoKSA/IHJvdy5wcmV2KClcbiAgICAgICAgICAgIEByZW1vdmVSb3cgcm93XG4gICAgICAgICAgICBuZXh0T3JQcmV2Py5hY3RpdmF0ZSgpXG4gICAgICAgIEBcblxuICAgIHJlbW92ZVJvdzogKHJvdykgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHJvdyA9PSBAYWN0aXZlUm93KClcbiAgICAgICAgICAgIGlmIEBuZXh0Q29sdW1uKCk/LnBhcmVudD8uZmlsZSA9PSByb3cuaXRlbT8uZmlsZVxuICAgICAgICAgICAgICAgICMga2xvZyAncmVtb3ZlUm93IGNsZWFyJ1xuICAgICAgICAgICAgICAgIEBicm93c2VyLmNsZWFyQ29sdW1uc0Zyb20gQGluZGV4ICsgMVxuICAgICAgICAgICAgXG4gICAgICAgIHJvdy5kaXYucmVtb3ZlKClcbiAgICAgICAgQGl0ZW1zLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICBAcm93cy5zcGxpY2Ugcm93LmluZGV4KCksIDFcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgc29ydEJ5TmFtZTogLT5cbiAgICAgICAgIFxuICAgICAgICBAcm93cy5zb3J0IChhLGIpIC0+IFxuICAgICAgICAgICAgKGEuaXRlbS50eXBlICsgYS5pdGVtLm5hbWUpLmxvY2FsZUNvbXBhcmUoYi5pdGVtLnR5cGUgKyBiLml0ZW0ubmFtZSlcbiAgICAgICAgICAgIFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93c1xuICAgICAgICAgICAgQHRhYmxlLmFwcGVuZENoaWxkIHJvdy5kaXZcbiAgICAgICAgQFxuICAgICAgICBcbiAgICBzb3J0QnlUeXBlOiAtPlxuICAgICAgICBcbiAgICAgICAgQHJvd3Muc29ydCAoYSxiKSAtPiBcbiAgICAgICAgICAgIGF0eXBlID0gYS5pdGVtLnR5cGUgPT0gJ2ZpbGUnIGFuZCBzbGFzaC5leHQoYS5pdGVtLm5hbWUpIG9yICdfX18nICNhLml0ZW0udHlwZVxuICAgICAgICAgICAgYnR5cGUgPSBiLml0ZW0udHlwZSA9PSAnZmlsZScgYW5kIHNsYXNoLmV4dChiLml0ZW0ubmFtZSkgb3IgJ19fXycgI2IuaXRlbS50eXBlXG4gICAgICAgICAgICAoYS5pdGVtLnR5cGUgKyBhdHlwZSArIGEuaXRlbS5uYW1lKS5sb2NhbGVDb21wYXJlKGIuaXRlbS50eXBlICsgYnR5cGUgKyBiLml0ZW0ubmFtZSwgdW5kZWZpbmVkLCBudW1lcmljOnRydWUpXG4gICAgICAgICAgICBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIEB0YWJsZS5hcHBlbmRDaGlsZCByb3cuZGl2XG4gICAgICAgIEBcblxuICAgIHNvcnRCeURhdGVBZGRlZDogLT5cbiAgICAgICAgXG4gICAgICAgIEByb3dzLnNvcnQgKGEsYikgLT4gYi5pdGVtLnN0YXQ/LmF0aW1lTXMgLSBhLml0ZW0uc3RhdD8uYXRpbWVNc1xuICAgICAgICAgICAgXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICBAdGFibGUuYXBwZW5kQ2hpbGQgcm93LmRpdlxuICAgICAgICBAXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICB0b2dnbGVEb3RGaWxlczogPT5cblxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAjIGxvZyAnY29sdW1uLnRvZ2dsZURvdEZpbGVzJyBAcGFyZW50XG4gICAgICAgICAgICBAcGFyZW50LnR5cGUgPSBzbGFzaC5pc0RpcihAcGFyZW50LmZpbGUpIGFuZCAnZGlyJyBvciAnZmlsZSdcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgPT0gJ2RpcicgICAgICAgICAgICBcbiAgICAgICAgICAgIHN0YXRlS2V5ID0gXCJicm93c2Vy4pa4c2hvd0hpZGRlbuKWuCN7QHBhcmVudC5maWxlfVwiXG4gICAgICAgICAgICBpZiBwcmVmcy5nZXQgc3RhdGVLZXlcbiAgICAgICAgICAgICAgICBwcmVmcy5kZWwgc3RhdGVLZXlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwcmVmcy5zZXQgc3RhdGVLZXksIHRydWVcbiAgICAgICAgICAgIEBicm93c2VyLmxvYWREaXJJdGVtIEBwYXJlbnQsIEBpbmRleCwgaWdub3JlQ2FjaGU6dHJ1ZVxuICAgICAgICBAXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG1vdmVUb1RyYXNoOiA9PlxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBAYnJvd3Nlci5zZWxlY3QuZnJlZUluZGV4KClcbiAgICAgICAgaWYgaW5kZXggPj0gMFxuICAgICAgICAgICAgc2VsZWN0Um93ID0gQHJvdyBpbmRleFxuICAgICAgICBcbiAgICAgICAgZm9yIHJvdyBpbiBAYnJvd3Nlci5zZWxlY3Qucm93c1xuICAgICAgICAgICAgd3h3ICd0cmFzaCcgcm93LnBhdGgoKVxuICAgICAgICAgICAgQHJlbW92ZVJvdyByb3dcbiAgICAgICAgICAgXG4gICAgICAgIGlmIHNlbGVjdFJvd1xuICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyBzZWxlY3RSb3dcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG5hdmlnYXRlQ29scyAnbGVmdCdcblxuICAgIGFkZFRvU2hlbGY6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBwYXRoVG9TaGVsZiA9IEBhY3RpdmVQYXRoKClcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnYWRkVG9TaGVsZicgcGF0aFRvU2hlbGZcblxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgIDAwMCAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgICAgIDAgICAgICAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG9wZW5WaWV3ZXI6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAYWN0aXZlUm93KCk/Lml0ZW0ubmFtZSAhPSAnLi4nIGFuZCBzbGFzaC5pc0RpciBAYWN0aXZlUGF0aCgpXG4gICAgICAgICAgICBwYXRoID0gQGFjdGl2ZVBhdGgoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwYXRoID0gQGFjdGl2ZVJvdygpPy5pdGVtLmZpbGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgRmlsZS5pc1RleHQgcGF0aFxuICAgICAgICAgICAgICAgIEBicm93c2VyLnZpZXdlciA9IG5ldyBFZGl0b3IgcGF0aFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgbm90IEZpbGUuaXNJbWFnZSBwYXRoXG4gICAgICAgICAgICAgICAgcGF0aCA9IEBwYXRoKClcbiAgICAgICAgICAgIFxuICAgICAgICBAYnJvd3Nlci52aWV3ZXIgPSBuZXcgVmlld2VyIHBhdGhcbiAgICAgICAgXG4gICAgbmV3Rm9sZGVyOiA9PlxuICAgICAgICBcbiAgICAgICAgdW51c2VkID0gcmVxdWlyZSAndW51c2VkLWZpbGVuYW1lJ1xuICAgICAgICB1bnVzZWQoc2xhc2guam9pbiBAcGF0aCgpLCAnTmV3IGZvbGRlcicpLnRoZW4gKG5ld0RpcikgPT5cbiAgICAgICAgICAgIGZzLm1rZGlyIG5ld0RpciwgKGVycikgPT5cbiAgICAgICAgICAgICAgICBpZiBlbXB0eSBlcnJcbiAgICAgICAgICAgICAgICAgICAgcm93ID0gQGluc2VydEZpbGUgbmV3RGlyXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgcm93XG4gICAgICAgICAgICAgICAgICAgIHJvdy5lZGl0TmFtZSgpXG4gICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGR1cGxpY2F0ZUZpbGU6ID0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBmaWxlIGluIEBicm93c2VyLnNlbGVjdC5maWxlcygpXG4gICAgICAgICAgICBGaWxlLmR1cGxpY2F0ZSBmaWxlLCAoc291cmNlLCB0YXJnZXQpID0+XG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyBAaW5zZXJ0RmlsZSB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGV4cGxvcmVyOiA9PlxuICAgICAgICBcbiAgICAgICAgb3BlbiBzbGFzaC5kaXIgQGFjdGl2ZVBhdGgoKVxuICAgICAgICBcbiAgICBvcGVuOiA9PlxuICAgICAgICBcbiAgICAgICAgb3BlbiBAYWN0aXZlUGF0aCgpXG4gICAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgXG4gICAgICAgIFxuICAgIG1ha2VSb290OiA9PiBcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnNoaWZ0Q29sdW1uc1RvIEBpbmRleFxuICAgICAgICBcbiAgICAgICAgaWYgQGJyb3dzZXIuY29sdW1uc1swXS5pdGVtc1swXS5uYW1lICE9ICcuLidcbiAgICAgICAgICAgIEB1bnNoaWZ0SXRlbSBcbiAgICAgICAgICAgICAgICBuYW1lOiAnLi4nXG4gICAgICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgICAgICBmaWxlOiBzbGFzaC5kaXIgQHBhcmVudC5maWxlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBjcnVtYi5zZXRGaWxlIEBwYXJlbnQuZmlsZVxuICAgIFxuICAgIG9uQ29udGV4dE1lbnU6IChldmVudCwgY29sdW1uKSA9PiBcbiAgICAgICAgXG4gICAgICAgIHN0b3BFdmVudCBldmVudFxuICAgICAgICBcbiAgICAgICAgYWJzUG9zID0ga3BvcyBldmVudFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGNvbHVtblxuICAgICAgICAgICAgQHNob3dDb250ZXh0TWVudSBhYnNQb3NcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBvcHQgPSBpdGVtczogWyBcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICdSb290J1xuICAgICAgICAgICAgICAgIGNiOiAgICAgQG1ha2VSb290XG4gICAgICAgICAgICAsXG4gICAgICAgICAgICAgICAgdGV4dDogICAnQWRkIHRvIFNoZWxmJ1xuICAgICAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtzaGlmdCsuJ1xuICAgICAgICAgICAgICAgIGNiOiAgICAgPT4gcG9zdC5lbWl0ICdhZGRUb1NoZWxmJyBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgICxcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICdFeHBsb3JlcidcbiAgICAgICAgICAgICAgICBjb21ibzogICdhbHQrZScgXG4gICAgICAgICAgICAgICAgY2I6ICAgICA9PiBvcGVuIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgICAgICBvcHQueSA9IGFic1Bvcy55XG4gICAgICAgICAgICBwb3B1cC5tZW51IG9wdCAgICBcbiAgICAgICAgICAgICAgXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IGtwb3MgQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0LCBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcFxuICAgICAgICBcbiAgICAgICAgb3B0ID0gaXRlbXM6IFsgXG4gICAgICAgICAgICB0ZXh0OiAgICdUb2dnbGUgSW52aXNpYmxlJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtpJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHRvZ2dsZURvdEZpbGVzXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ1JlZnJlc2gnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK3InIFxuICAgICAgICAgICAgY2I6ICAgICBAYnJvd3Nlci5yZWZyZXNoXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0R1cGxpY2F0ZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrZCcgXG4gICAgICAgICAgICBjYjogICAgIEBkdXBsaWNhdGVGaWxlXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ01vdmUgdG8gVHJhc2gnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2JhY2tzcGFjZScgXG4gICAgICAgICAgICBjYjogICAgIEBtb3ZlVG9UcmFzaFxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdBZGQgdG8gU2hlbGYnXG4gICAgICAgICAgICBjb21ibzogICdhbHQrc2hpZnQrLidcbiAgICAgICAgICAgIGNiOiAgICAgQGFkZFRvU2hlbGZcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnTmV3IEZvbGRlcidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtuJyBcbiAgICAgICAgICAgIGNiOiAgICAgQG5ld0ZvbGRlclxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdWaWV3ZXInXG4gICAgICAgICAgICBjb21ibzogICdhbHQrdicgXG4gICAgICAgICAgICBjYjogICAgIEBvcGVuVmlld2VyXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0V4cGxvcmVyJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K2UnIFxuICAgICAgICAgICAgY2I6ICAgICBAZXhwbG9yZXJcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnT3BlbidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtvJyBcbiAgICAgICAgICAgIGNiOiAgICAgQG9wZW5cbiAgICAgICAgXVxuICAgICAgICBcbiAgICAgICAgb3B0Lml0ZW1zID0gb3B0Lml0ZW1zLmNvbmNhdCB3aW5kb3cudGl0bGViYXIubWFrZVRlbXBsYXRlIHJlcXVpcmUgJy4vbWVudS5qc29uJ1xuICAgICAgICBcbiAgICAgICAgb3B0LnggPSBhYnNQb3MueFxuICAgICAgICBvcHQueSA9IGFic1Bvcy55XG4gICAgICAgIHBvcHVwLm1lbnUgb3B0ICAgICAgICBcbiAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBvbktleTogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIgfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcblxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ3NoaWZ0K2AnICd+JyAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLmJyb3dzZSAnfidcbiAgICAgICAgICAgIHdoZW4gJy8nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLmJyb3dzZSAnLydcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtlJyAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAZXhwbG9yZXIoKVxuICAgICAgICAgICAgd2hlbiAnYWx0K28nICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBvcGVuKClcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtuJyAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAbmV3Rm9sZGVyKClcbiAgICAgICAgICAgIHdoZW4gJ3NwYWNlJyAnYWx0K3YnICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAb3BlblZpZXdlcigpXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAncGFnZSBkb3duJyAnaG9tZScgJ2VuZCcgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzIGtleVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCt1cCcgJ2N0cmwrdXAnICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyAnaG9tZSdcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZG93bicgJ2N0cmwrZG93bicgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3MgJ2VuZCdcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJydhbHQrdXAnICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZUNvbHMga2V5XG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5vbkJhY2tzcGFjZUluQ29sdW1uIEBcbiAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZScgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLm9uRGVsZXRlSW5Db2x1bW4gQFxuICAgICAgICAgICAgd2hlbiAnY3RybCt0JyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeVR5cGUoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtuJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeU5hbWUoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCthJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeURhdGVBZGRlZCgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2knICdjdHJsK2knICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAdG9nZ2xlRG90RmlsZXMoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtkJyAnY3RybCtkJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGR1cGxpY2F0ZUZpbGUoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtrJyAnY3RybCtrJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCBpZiBAYnJvd3Nlci5jbGVhblVwKClcbiAgICAgICAgICAgIHdoZW4gJ2YyJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBhY3RpdmVSb3coKT8uZWRpdE5hbWUoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtsZWZ0JyAnY29tbWFuZCtyaWdodCcgJ2N0cmwrbGVmdCcgJ2N0cmwrcmlnaHQnXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm9vdCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrYmFja3NwYWNlJyAnY3RybCtiYWNrc3BhY2UnICdjb21tYW5kK2RlbGV0ZScgJ2N0cmwrZGVsZXRlJyBcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbW92ZVRvVHJhc2goKVxuICAgICAgICAgICAgd2hlbiAndGFiJyAgICBcbiAgICAgICAgICAgICAgICBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBkb1NlYXJjaCAnJ1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgICAgIHdoZW4gJ2VzYydcbiAgICAgICAgICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgICAgICAgICBAZHJhZ0Rpdi5kcmFnLmRyYWdTdG9wKClcbiAgICAgICAgICAgICAgICAgICAgQGRyYWdEaXYucmVtb3ZlKClcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEBkcmFnRGl2XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKS5sZW5ndGggPiAxXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBjbGVhclNlYXJjaCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuXG4gICAgICAgIGlmIGNvbWJvIGluIFsndXAnICAgJ2Rvd24nXSAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzIGtleSAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbWJvIGluIFsnbGVmdCcgJ3JpZ2h0J10gdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVDb2xzIGtleVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG1vZCBpbiBbJ3NoaWZ0JyAnJ10gYW5kIGNoYXIgdGhlbiBAZG9TZWFyY2ggY2hhclxuICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBDb2x1bW5cblxuXG4iXX0=
//# sourceURL=../coffee/column.coffee