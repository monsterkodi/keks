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
        this.viewImages = bind(this.viewImages, this);
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
        var ref1, ref2, ref3, row;
        row = this.row(e.target);
        delete this.toggle;
        if (row) {
            if (e.shiftKey) {
                return this.browser.select.to(row);
            } else if (e.metaKey || e.altKey || e.ctrlKey) {
                if (!row.isSelected()) {
                    return this.browser.select.toggle(row);
                } else {
                    return this.toggle = true;
                }
            } else {
                if (row.isSelected()) {
                    return this.deselect = true;
                } else {
                    if ((ref1 = this.activeRow()) != null) {
                        ref1.clearActive();
                    }
                    return this.browser.select.row(row, false);
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
        if (!this.dragDiv && valid(this.browser.select.files())) {
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

    Column.prototype.viewImages = function() {
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
        var file, i, len, ref1, results, unused;
        unused = require('unused-filename');
        ref1 = this.browser.select.files();
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            file = ref1[i];
            results.push(unused(file).then((function(_this) {
                return function(fileName) {
                    fileName = slash.path(fileName);
                    return fs.copyFile(file, fileName, function(err) {
                        var row;
                        if (err != null) {
                            return console.error('copy file failed', err);
                        }
                        klog('fileName', fileName);
                        row = _this.insertFile(fileName);
                        return _this.browser.select.row(row);
                    });
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
                    text: 'View Images',
                    combo: 'alt+v',
                    cb: this.viewImages
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
                return this.viewImages();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sdW1uLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpTUFBQTtJQUFBOztBQVFBLE1BQW1JLE9BQUEsQ0FBUSxLQUFSLENBQW5JLEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUseUJBQWYsRUFBMEIsdUJBQTFCLEVBQW9DLHFCQUFwQyxFQUE2QyxpQkFBN0MsRUFBb0QsaUJBQXBELEVBQTJELGlCQUEzRCxFQUFrRSxpQkFBbEUsRUFBeUUsaUJBQXpFLEVBQWdGLGVBQWhGLEVBQXNGLGVBQXRGLEVBQTRGLGVBQTVGLEVBQWtHLGVBQWxHLEVBQXdHLFdBQXhHLEVBQTRHLGVBQTVHLEVBQWtILG1CQUFsSCxFQUEwSCxTQUExSCxFQUE2SDs7QUFFN0gsR0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsa0JBQVI7O0FBQ1gsSUFBQSxHQUFXLE9BQUEsQ0FBUSxjQUFSOztBQUNYLE1BQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxTQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFDWCxHQUFBLEdBQVcsT0FBQSxDQUFRLEtBQVI7O0FBRUw7SUFFQyxnQkFBQyxPQUFEO0FBRUMsWUFBQTtRQUZBLElBQUMsQ0FBQSxVQUFEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQUVBLElBQUMsQ0FBQSxXQUFELEdBQWU7UUFDZixJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLEtBQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxJQUFELEdBQVU7UUFFVixJQUFDLENBQUEsR0FBRCxHQUFTLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZUFBUDtZQUF1QixRQUFBLEVBQVMsQ0FBaEM7U0FBTDtR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QyxDQUFBLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBZCxDQUFBO29CQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxDQUFBO29CQUNBLE9BQU8sSUFBQyxDQUFBLFFBSFo7aUJBQUEsTUFJSyxJQUFHLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQWhCLENBQUEsQ0FBdUIsQ0FBQyxNQUF4QixHQUFpQyxDQUFwQztvQkFDRCxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFoQixDQUFvQixJQUFDLENBQUEsU0FBRCxDQUFBLENBQXBCLEVBREM7aUJBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBWDtvQkFBdUIsSUFBQyxDQUFBLFdBQUQsQ0FBQSxFQUF2Qjs7QUFDTCx1QkFBTyxTQUFBLENBQVUsS0FBVjtBQW5DZjtRQXFDQSxJQUFHLEtBQUEsS0FBVSxJQUFWLElBQUEsS0FBQSxLQUFpQixNQUFwQjtBQUFrQyxtQkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsQ0FBakIsRUFBekM7O1FBQ0EsSUFBRyxLQUFBLEtBQVUsTUFBVixJQUFBLEtBQUEsS0FBaUIsT0FBcEI7QUFBa0MsbUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFlBQUQsQ0FBYyxHQUFkLENBQWpCLEVBQXpDOztRQUVBLElBQUcsQ0FBQSxHQUFBLEtBQVEsT0FBUixJQUFBLEdBQUEsS0FBZ0IsRUFBaEIsQ0FBQSxJQUF3QixJQUEzQjttQkFBcUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLEVBQXJDOztJQTVDRzs7Ozs7O0FBOENYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwXG4gMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCBwcmVmcywgc3RvcEV2ZW50LCBzZXRTdHlsZSwga2V5aW5mbywgcG9wdXAsIHNsYXNoLCB2YWxpZCwgY2xhbXAsIGVtcHR5LCBkcmFnLCBvcGVuLCBlbGVtLCBrcG9zLCBmcywga2xvZywga2Vycm9yLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cblJvdyAgICAgID0gcmVxdWlyZSAnLi9yb3cnXG5TY3JvbGxlciA9IHJlcXVpcmUgJy4vdG9vbHMvc2Nyb2xsZXInXG5GaWxlICAgICA9IHJlcXVpcmUgJy4vdG9vbHMvZmlsZSdcblZpZXdlciAgID0gcmVxdWlyZSAnLi92aWV3ZXInXG5FZGl0b3IgICA9IHJlcXVpcmUgJy4vZWRpdG9yJ1xuQ3J1bWIgICAgPSByZXF1aXJlICcuL2NydW1iJ1xuZnV6enkgICAgPSByZXF1aXJlICdmdXp6eSdcbnd4dyAgICAgID0gcmVxdWlyZSAnd3h3J1xuXG5jbGFzcyBDb2x1bW5cbiAgICBcbiAgICBAOiAoQGJyb3dzZXIpIC0+XG4gICAgICAgIFxuICAgICAgICBAc2VhcmNoVGltZXIgPSBudWxsXG4gICAgICAgIEBzZWFyY2ggPSAnJ1xuICAgICAgICBAaXRlbXMgID0gW11cbiAgICAgICAgQHJvd3MgICA9IFtdXG4gICAgICAgIFxuICAgICAgICBAZGl2ICAgPSBlbGVtIGNsYXNzOiAnYnJvd3NlckNvbHVtbicgdGFiSW5kZXg6NlxuICAgICAgICBAdGFibGUgPSBlbGVtIGNsYXNzOiAnYnJvd3NlckNvbHVtblRhYmxlJ1xuICAgICAgICBAZGl2LmFwcGVuZENoaWxkIEB0YWJsZVxuICAgICAgICBcbiAgICAgICAgQHNldEluZGV4IEBicm93c2VyLmNvbHVtbnM/Lmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY29scz8uYXBwZW5kQ2hpbGQgQGRpdlxuICAgICAgICBcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdmb2N1cycgICAgIEBvbkZvY3VzXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnYmx1cicgICAgICBAb25CbHVyXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgICBAb25LZXlcbiAgICAgICAgXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2VvdmVyJyBAb25Nb3VzZU92ZXJcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdtb3VzZW91dCcgIEBvbk1vdXNlT3V0XG5cbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdkYmxjbGljaycgIEBvbkRibENsaWNrXG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2NvbnRleHRtZW51JyBAb25Db250ZXh0TWVudVxuICBcbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQGRpdlxuICAgICAgICAgICAgb25TdGFydDogQG9uRHJhZ1N0YXJ0XG4gICAgICAgICAgICBvbk1vdmU6ICBAb25EcmFnTW92ZVxuICAgICAgICAgICAgb25TdG9wOiAgQG9uRHJhZ1N0b3BcbiAgICAgICAgXG4gICAgICAgIEBjcnVtYiAgPSBuZXcgQ3J1bWIgQFxuICAgICAgICBAc2Nyb2xsID0gbmV3IFNjcm9sbGVyIEBcbiAgICAgICAgXG4gICAgc2V0SW5kZXg6IChAaW5kZXgpIC0+XG4gICAgICAgIFxuICAgICAgICBAY3J1bWI/LmVsZW0uY29sdW1uSW5kZXggPSBAaW5kZXhcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBvbkRyYWdTdGFydDogKGQsIGUpID0+IFxuICAgIFxuICAgICAgICByb3cgPSBAcm93IGUudGFyZ2V0XG4gICAgICAgIFxuICAgICAgICBkZWxldGUgQHRvZ2dsZVxuICAgICAgICBcbiAgICAgICAgaWYgcm93XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGUuc2hpZnRLZXlcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3QudG8gcm93XG4gICAgICAgICAgICBlbHNlIGlmIGUubWV0YUtleSBvciBlLmFsdEtleSBvciBlLmN0cmxLZXlcbiAgICAgICAgICAgICAgICBpZiBub3Qgcm93LmlzU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3QudG9nZ2xlIHJvd1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHRvZ2dsZSA9IHRydWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiByb3cuaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgICAgIEBkZXNlbGVjdCA9IHRydWVcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBhY3RpdmVSb3coKT8uY2xlYXJBY3RpdmUoKVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IHJvdywgZmFsc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGhhc0ZvY3VzKClcbiAgICAgICAgICAgICAgICBpZiBAYWN0aXZlUm93KCkgPyBAYnJvd3Nlci5zZWxlY3QuYWN0aXZlXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQGFjdGl2ZVJvdygpID8gQGJyb3dzZXIuc2VsZWN0LmFjdGl2ZVxuXG4gICAgb25EcmFnTW92ZTogKGQsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAZHJhZ0RpdiBhbmQgdmFsaWQgQGJyb3dzZXIuc2VsZWN0LmZpbGVzKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGlmIE1hdGguYWJzKGQuZGVsdGFTdW0ueCkgPCAyMCBhbmQgTWF0aC5hYnMoZC5kZWx0YVN1bS55KSA8IDEwXG5cbiAgICAgICAgICAgIGRlbGV0ZSBAdG9nZ2xlIFxuICAgICAgICAgICAgZGVsZXRlIEBkZXNlbGVjdFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZHJhZ0RpdiA9IGVsZW0gJ2RpdidcbiAgICAgICAgICAgIEBkcmFnRGl2LmRyYWcgPSBkXG4gICAgICAgICAgICBwb3MgPSBrcG9zIGUucGFnZVgsIGUucGFnZVlcbiAgICAgICAgICAgIHJvdyA9IEBicm93c2VyLnNlbGVjdC5yb3dzWzBdXG4gICAgICAgICAgICBiciAgPSByb3cuZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUub3BhY2l0eSAgPSBcIjAuN1wiXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS50b3AgID0gXCIje3Bvcy55LWQuZGVsdGFTdW0ueX1weFwiXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5sZWZ0ID0gXCIje3Bvcy54LWQuZGVsdGFTdW0ueH1weFwiXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS53aWR0aCA9IFwiI3tici53aWR0aC0xMn1weFwiXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciByb3cgaW4gQGJyb3dzZXIuc2VsZWN0LnJvd3NcbiAgICAgICAgICAgICAgICByb3dDbG9uZSA9IHJvdy5kaXYuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgICAgICAgICByb3dDbG9uZS5zdHlsZS5mbGV4ID0gJ3Vuc2V0J1xuICAgICAgICAgICAgICAgIHJvd0Nsb25lLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSdcbiAgICAgICAgICAgICAgICByb3dDbG9uZS5zdHlsZS5ib3JkZXIgPSAnbm9uZSdcbiAgICAgICAgICAgICAgICByb3dDbG9uZS5zdHlsZS5tYXJnaW5Cb3R0b20gPSAnLTFweCdcbiAgICAgICAgICAgICAgICBAZHJhZ0Rpdi5hcHBlbmRDaGlsZCByb3dDbG9uZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCBAZHJhZ0RpdlxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnRGl2XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlWCgje2QuZGVsdGFTdW0ueH1weCkgdHJhbnNsYXRlWSgje2QuZGVsdGFTdW0ueX1weClcIlxuXG4gICAgb25EcmFnU3RvcDogKGQsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnRGl2P1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZHJhZ0Rpdi5yZW1vdmUoKVxuICAgICAgICAgICAgZGVsZXRlIEBkcmFnRGl2XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHJvdyA9IEBicm93c2VyLnJvd0F0UG9zIGQucG9zXG4gICAgICAgICAgICAgICAgY29sdW1uID0gcm93LmNvbHVtblxuICAgICAgICAgICAgICAgIHRhcmdldCA9IHJvdy5pdGVtLmZpbGVcbiAgICAgICAgICAgIGVsc2UgaWYgY29sdW1uID0gQGJyb3dzZXIuY29sdW1uQXRQb3MgZC5wb3NcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSBjb2x1bW4ucGFyZW50Py5maWxlXG4gICAgICAgICAgICBlbHNlIGlmIGNvbHVtbiA9IEBicm93c2VyLmNvbHVtbkF0WCBkLnBvcy54XG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gY29sdW1uLnBhcmVudD8uZmlsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGtsb2cgJ25vIGRyb3AgdGFyZ2V0J1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgYWN0aW9uID0gZS5zaGlmdEtleSBhbmQgJ2NvcHknIG9yICdtb3ZlJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgY29sdW1uID09IEBicm93c2VyLnNoZWxmIFxuICAgICAgICAgICAgICAgIGlmIHRhcmdldCBhbmQgKGUuY3RybEtleSBvciBlLnNoaWZ0S2V5IG9yIGUubWV0YUtleSBvciBlLmFsdEtleSlcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuZHJvcEFjdGlvbiBhY3Rpb24sIEBicm93c2VyLnNlbGVjdC5maWxlcygpLCB0YXJnZXRcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNoZWxmLmFkZEZpbGVzIEBicm93c2VyLnNlbGVjdC5maWxlcygpLCBwb3M6ZC5wb3NcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci5kcm9wQWN0aW9uIGFjdGlvbiwgQGJyb3dzZXIuc2VsZWN0LmZpbGVzKCksIHRhcmdldFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBmb2N1cyBhY3RpdmF0ZTpmYWxzZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiByb3cgPSBAcm93IGUudGFyZ2V0XG4gICAgICAgICAgICAgICAgaWYgcm93LmlzU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgICAgICBpZiBlLm1ldGFLZXkgb3IgZS5hbHRLZXkgb3IgZS5jdHJsS2V5IG9yIGUuc2hpZnRLZXlcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIEB0b2dnbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgQHRvZ2dsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC50b2dnbGUgcm93XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIEBkZXNlbGVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBAZGVzZWxlY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IHJvd1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdy5hY3RpdmF0ZSgpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICByZW1vdmVGaWxlOiAoZmlsZSkgPT4gXG4gICAgICAgIFxuICAgICAgICBpZiByb3cgPSBAcm93IHNsYXNoLmZpbGUgZmlsZVxuICAgICAgICAgICAgQHJlbW92ZVJvdyByb3dcbiAgICAgICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgICAgIFxuICAgIGluc2VydEZpbGU6IChmaWxlKSA9PiBcblxuICAgICAgICBpdGVtID0gQGJyb3dzZXIuZmlsZUl0ZW0gZmlsZVxuICAgICAgICByb3cgPSBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgQHJvd3MucHVzaCByb3dcbiAgICAgICAgcm93XG4gICAgXG4gICAgbG9hZEl0ZW1zOiAoaXRlbXMsIHBhcmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmNsZWFyQ29sdW1uIEBpbmRleFxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zICA9IGl0ZW1zXG4gICAgICAgIEBwYXJlbnQgPSBwYXJlbnRcbiAgICAgICAgXG4gICAgICAgIEBjcnVtYi5zZXRGaWxlIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICBAcGFyZW50LnR5cGUgPSBzbGFzaC5pc0RpcihAcGFyZW50LmZpbGUpIGFuZCAnZGlyJyBvciAnZmlsZSdcbiAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIHBhcmVudCBpdGVtP1wiIGlmIG5vdCBAcGFyZW50P1xuICAgICAgICBrZXJyb3IgXCJsb2FkSXRlbXMgLS0gbm8gcGFyZW50IHR5cGU/XCIsIEBwYXJlbnQgaWYgbm90IEBwYXJlbnQudHlwZT9cbiAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIEBpdGVtc1xuICAgICAgICAgICAgZm9yIGl0ZW0gaW4gQGl0ZW1zXG4gICAgICAgICAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgXG4gICAgICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09ICdkaXInIGFuZCBzbGFzaC5zYW1lUGF0aCAnfi9Eb3dubG9hZHMnIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgQHNvcnRCeURhdGVBZGRlZCgpXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgdW5zaGlmdEl0ZW06IChpdGVtKSAtPlxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zLnVuc2hpZnQgaXRlbVxuICAgICAgICBAcm93cy51bnNoaWZ0IG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBAdGFibGUuaW5zZXJ0QmVmb3JlIEB0YWJsZS5sYXN0Q2hpbGQsIEB0YWJsZS5maXJzdENoaWxkXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgQHJvd3NbMF1cbiAgICAgICAgXG4gICAgcHVzaEl0ZW06IChpdGVtKSAtPlxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zLnB1c2ggaXRlbVxuICAgICAgICBAcm93cy5wdXNoIG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgIEByb3dzWy0xXVxuICAgICAgICBcbiAgICBhZGRJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJvdyA9IEBwdXNoSXRlbSBpdGVtXG4gICAgICAgIEBzb3J0QnlOYW1lKClcbiAgICAgICAgcm93XG5cbiAgICBzZXRJdGVtczogKEBpdGVtcywgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW4gQGluZGV4XG4gICAgICAgIFxuICAgICAgICBAcGFyZW50ID0gb3B0LnBhcmVudFxuICAgICAgICBrZXJyb3IgXCJubyBwYXJlbnQgaXRlbT9cIiBpZiBub3QgQHBhcmVudD9cbiAgICAgICAga2Vycm9yIFwic2V0SXRlbXMgLS0gbm8gcGFyZW50IHR5cGU/XCIsIEBwYXJlbnQgaWYgbm90IEBwYXJlbnQudHlwZT9cbiAgICAgICAgXG4gICAgICAgIGZvciBpdGVtIGluIEBpdGVtc1xuICAgICAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgQFxuXG4gICAgaXNEaXI6ICAtPiBAcGFyZW50Py50eXBlID09ICdkaXInIFxuICAgIGlzRmlsZTogLT4gQHBhcmVudD8udHlwZSA9PSAnZmlsZScgXG4gICAgICAgIFxuICAgIGlzRW1wdHk6IC0+IGVtcHR5IEBwYXJlbnRcbiAgICBjbGVhcjogICAtPlxuICAgICAgICBAY2xlYXJTZWFyY2goKVxuICAgICAgICBkZWxldGUgQHBhcmVudFxuICAgICAgICBAZGl2LnNjcm9sbFRvcCA9IDBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIEBjcnVtYi5jbGVhcigpXG4gICAgICAgIEByb3dzID0gW11cbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMDAwMDAwICBcbiAgIFxuICAgIGFjdGl2YXRlUm93OiAocm93KSAtPiBAcm93KHJvdyk/LmFjdGl2YXRlKClcbiAgICAgICBcbiAgICBhY3RpdmVSb3c6IC0+IF8uZmluZCBAcm93cywgKHIpIC0+IHIuaXNBY3RpdmUoKVxuICAgIGFjdGl2ZVBhdGg6IC0+IEBhY3RpdmVSb3coKT8ucGF0aCgpXG4gICAgXG4gICAgcm93OiAocm93KSAtPiAjIGFjY2VwdHMgZWxlbWVudCwgaW5kZXgsIHN0cmluZyBvciByb3dcbiAgICAgICAgaWYgICAgICBfLmlzTnVtYmVyICByb3cgdGhlbiByZXR1cm4gMCA8PSByb3cgPCBAbnVtUm93cygpIGFuZCBAcm93c1tyb3ddIG9yIG51bGxcbiAgICAgICAgZWxzZSBpZiBfLmlzRWxlbWVudCByb3cgdGhlbiByZXR1cm4gXy5maW5kIEByb3dzLCAocikgLT4gci5kaXYuY29udGFpbnMgcm93XG4gICAgICAgIGVsc2UgaWYgXy5pc1N0cmluZyAgcm93IHRoZW4gcmV0dXJuIF8uZmluZCBAcm93cywgKHIpIC0+IHIuaXRlbS5uYW1lID09IHJvdyBvciByLml0ZW0uZmlsZSA9PSByb3dcbiAgICAgICAgZWxzZSByZXR1cm4gcm93XG4gICAgICAgICAgICBcbiAgICBuZXh0Q29sdW1uOiAtPiBAYnJvd3Nlci5jb2x1bW4gQGluZGV4KzFcbiAgICBwcmV2Q29sdW1uOiAtPiBAYnJvd3Nlci5jb2x1bW4gQGluZGV4LTFcbiAgICAgICAgXG4gICAgbmFtZTogLT4gXCIje0Bicm93c2VyLm5hbWV9OiN7QGluZGV4fVwiXG4gICAgcGF0aDogLT4gQHBhcmVudD8uZmlsZSA/ICcnXG4gICAgICAgIFxuICAgIG51bVJvd3M6ICAgIC0+IEByb3dzLmxlbmd0aCA/IDAgICBcbiAgICByb3dIZWlnaHQ6ICAtPiBAcm93c1swXT8uZGl2LmNsaWVudEhlaWdodCA/IDBcbiAgICBudW1WaXNpYmxlOiAtPiBAcm93SGVpZ2h0KCkgYW5kIHBhcnNlSW50KEBicm93c2VyLmhlaWdodCgpIC8gQHJvd0hlaWdodCgpKSBvciAwXG4gICAgXG4gICAgcm93QXRQb3M6IChwb3MpIC0+IEByb3cgQHJvd0luZGV4QXRQb3MgcG9zXG4gICAgXG4gICAgcm93SW5kZXhBdFBvczogKHBvcykgLT5cbiAgICAgICAgXG4gICAgICAgIE1hdGgubWF4IDAsIE1hdGguZmxvb3IgKHBvcy55IC0gQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3ApIC8gQHJvd0hlaWdodCgpXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgaGFzRm9jdXM6IC0+IEBkaXYuY2xhc3NMaXN0LmNvbnRhaW5zICdmb2N1cydcblxuICAgIGZvY3VzOiAob3B0PXt9KSAtPlxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBub3QgQGFjdGl2ZVJvdygpIGFuZCBAbnVtUm93cygpIGFuZCBvcHQ/LmFjdGl2YXRlICE9IGZhbHNlXG4gICAgICAgICAgICBAcm93c1swXS5zZXRBY3RpdmUoKVxuICAgICAgICBAZGl2LmZvY3VzKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICBvbkZvY3VzOiA9PiBAZGl2LmNsYXNzTGlzdC5hZGQgJ2ZvY3VzJ1xuICAgIG9uQmx1cjogID0+IEBkaXYuY2xhc3NMaXN0LnJlbW92ZSAnZm9jdXMnXG5cbiAgICBmb2N1c0Jyb3dzZXI6IC0+IEBicm93c2VyLmZvY3VzKClcbiAgICBcbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG9uTW91c2VPdmVyOiAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU92ZXIoKVxuICAgIG9uTW91c2VPdXQ6ICAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU91dCgpXG4gICAgXG4gICAgb25EYmxDbGljazogIChldmVudCkgPT4gXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5za2lwT25EYmxDbGljayA9IHRydWVcbiAgICAgICAgQG5hdmlnYXRlQ29scyAnZW50ZXInXG4gICAgXG4gICAgdXBkYXRlQ3J1bWI6ID0+IEBjcnVtYi51cGRhdGVSZWN0IEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcblxuICAgIG5hdmlnYXRlUm93czogKGtleSkgLT5cblxuICAgICAgICByZXR1cm4gZXJyb3IgXCJubyByb3dzIGluIGNvbHVtbiAje0BpbmRleH0/XCIgaWYgbm90IEBudW1Sb3dzKClcbiAgICAgICAgaW5kZXggPSBAYWN0aXZlUm93KCk/LmluZGV4KCkgPyAtMVxuICAgICAgICBlcnJvciBcIm5vIGluZGV4IGZyb20gYWN0aXZlUm93PyAje2luZGV4fT9cIiwgQGFjdGl2ZVJvdygpIGlmIG5vdCBpbmRleD8gb3IgTnVtYmVyLmlzTmFOIGluZGV4XG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICAgICAgdGhlbiBpbmRleC0xXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgICAgIHRoZW4gaW5kZXgrMVxuICAgICAgICAgICAgd2hlbiAnaG9tZScgICAgICB0aGVuIDBcbiAgICAgICAgICAgIHdoZW4gJ2VuZCcgICAgICAgdGhlbiBAbnVtUm93cygpLTFcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiBpbmRleC1AbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gaW5kZXgrQG51bVZpc2libGUoKVxuICAgICAgICAgICAgZWxzZSBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG5vdCBpbmRleD8gb3IgTnVtYmVyLmlzTmFOIGluZGV4ICAgICAgICBcbiAgICAgICAgICAgIGVycm9yIFwibm8gaW5kZXggI3tpbmRleH0/ICN7QG51bVZpc2libGUoKX1cIlxuICAgICAgICAgICAgXG4gICAgICAgIGluZGV4ID0gY2xhbXAgMCwgQG51bVJvd3MoKS0xLCBpbmRleFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEByb3dzW2luZGV4XT8uYWN0aXZhdGU/XG4gICAgICAgICAgICBlcnJvciBcIm5vIHJvdyBhdCBpbmRleCAje2luZGV4fS8je0BudW1Sb3dzKCktMX0/XCIsIEBudW1Sb3dzKCkgXG4gICAgICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyBAcm93c1tpbmRleF1cbiAgICBcbiAgICBuYXZpZ2F0ZUNvbHM6IChrZXkpIC0+ICMgbW92ZSB0byBmaWxlIGJyb3dzZXI/XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcgICAgdGhlbiBAYnJvd3Nlci5uYXZpZ2F0ZSAndXAnXG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBAYnJvd3Nlci5uYXZpZ2F0ZSAnbGVmdCdcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIEBicm93c2VyLm5hdmlnYXRlICdyaWdodCdcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJ1xuICAgICAgICAgICAgICAgIGlmIGl0ZW0gPSBAYWN0aXZlUm93KCk/Lml0ZW1cbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IGl0ZW0udHlwZVxuICAgICAgICAgICAgICAgICAgICBpZiB0eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5sb2FkSXRlbSBpdGVtXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ29wZW5GaWxlJyBpdGVtLmZpbGVcbiAgICAgICAgQFxuXG4gICAgbmF2aWdhdGVSb290OiAoa2V5KSAtPiBcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmJyb3dzZSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBzbGFzaC5kaXIgQHBhcmVudC5maWxlXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBAYWN0aXZlUm93KCkuaXRlbS5maWxlXG4gICAgICAgIEBcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAgMDAwMDAwMDAwICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgXG4gICAgXG4gICAgZG9TZWFyY2g6IChjaGFyKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQHNlYXJjaERpdlxuICAgICAgICAgICAgQHNlYXJjaERpdiA9IGVsZW0gY2xhc3M6ICdicm93c2VyU2VhcmNoJ1xuICAgICAgICAgICAgXG4gICAgICAgIEBzZXRTZWFyY2ggQHNlYXJjaCArIGNoYXJcbiAgICAgICAgXG4gICAgYmFja3NwYWNlU2VhcmNoOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHNlYXJjaERpdiBhbmQgQHNlYXJjaC5sZW5ndGhcbiAgICAgICAgICAgIEBzZXRTZWFyY2ggQHNlYXJjaFswLi4uQHNlYXJjaC5sZW5ndGgtMV1cbiAgICAgICAgICAgIFxuICAgIHNldFNlYXJjaDogKEBzZWFyY2gpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBzZWFyY2hUaW1lclxuICAgICAgICBAc2VhcmNoVGltZXIgPSBzZXRUaW1lb3V0IEBjbGVhclNlYXJjaCwgMjAwMFxuICAgICAgICBcbiAgICAgICAgQHNlYXJjaERpdi50ZXh0Q29udGVudCA9IEBzZWFyY2hcblxuICAgICAgICBhY3RpdmVJbmRleCAgPSBAYWN0aXZlUm93KCk/LmluZGV4KCkgPyAwXG4gICAgICAgIGFjdGl2ZUluZGV4ICs9IDEgaWYgKEBzZWFyY2gubGVuZ3RoID09IDEpICNvciAoY2hhciA9PSAnJylcbiAgICAgICAgYWN0aXZlSW5kZXggID0gMCBpZiBhY3RpdmVJbmRleCA+PSBAbnVtUm93cygpXG4gICAgICAgIFxuICAgICAgICBmb3Igcm93cyBpbiBbQHJvd3Muc2xpY2UoYWN0aXZlSW5kZXgpLCBAcm93cy5zbGljZSgwLGFjdGl2ZUluZGV4KzEpXVxuICAgICAgICAgICAgZnV6emllZCA9IGZ1enp5LmZpbHRlciBAc2VhcmNoLCByb3dzLCBleHRyYWN0OiAocikgLT4gci5pdGVtLm5hbWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZnV6emllZC5sZW5ndGhcbiAgICAgICAgICAgICAgICByb3cgPSBmdXp6aWVkWzBdLm9yaWdpbmFsXG4gICAgICAgICAgICAgICAgcm93LmRpdi5hcHBlbmRDaGlsZCBAc2VhcmNoRGl2XG4gICAgICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICBAXG4gICAgXG4gICAgY2xlYXJTZWFyY2g6ID0+XG4gICAgICAgIFxuICAgICAgICBAc2VhcmNoID0gJydcbiAgICAgICAgQHNlYXJjaERpdj8ucmVtb3ZlKClcbiAgICAgICAgZGVsZXRlIEBzZWFyY2hEaXZcbiAgICAgICAgQFxuICAgIFxuICAgIHJlbW92ZU9iamVjdDogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHJvdyA9IEBhY3RpdmVSb3coKVxuICAgICAgICAgICAgbmV4dE9yUHJldiA9IHJvdy5uZXh0KCkgPyByb3cucHJldigpXG4gICAgICAgICAgICBAcmVtb3ZlUm93IHJvd1xuICAgICAgICAgICAgbmV4dE9yUHJldj8uYWN0aXZhdGUoKVxuICAgICAgICBAXG5cbiAgICByZW1vdmVSb3c6IChyb3cpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiByb3cgPT0gQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICBpZiBAbmV4dENvbHVtbigpPy5wYXJlbnQ/LmZpbGUgPT0gcm93Lml0ZW0/LmZpbGVcbiAgICAgICAgICAgICAgICAjIGtsb2cgJ3JlbW92ZVJvdyBjbGVhcidcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci5jbGVhckNvbHVtbnNGcm9tIEBpbmRleCArIDFcbiAgICAgICAgICAgIFxuICAgICAgICByb3cuZGl2LnJlbW92ZSgpXG4gICAgICAgIEBpdGVtcy5zcGxpY2Ugcm93LmluZGV4KCksIDFcbiAgICAgICAgQHJvd3Muc3BsaWNlIHJvdy5pbmRleCgpLCAxXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNvcnRCeU5hbWU6IC0+XG4gICAgICAgICBcbiAgICAgICAgQHJvd3Muc29ydCAoYSxiKSAtPiBcbiAgICAgICAgICAgIChhLml0ZW0udHlwZSArIGEuaXRlbS5uYW1lKS5sb2NhbGVDb21wYXJlKGIuaXRlbS50eXBlICsgYi5pdGVtLm5hbWUpXG4gICAgICAgICAgICBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIEB0YWJsZS5hcHBlbmRDaGlsZCByb3cuZGl2XG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgc29ydEJ5VHlwZTogLT5cbiAgICAgICAgXG4gICAgICAgIEByb3dzLnNvcnQgKGEsYikgLT4gXG4gICAgICAgICAgICBhdHlwZSA9IGEuaXRlbS50eXBlID09ICdmaWxlJyBhbmQgc2xhc2guZXh0KGEuaXRlbS5uYW1lKSBvciAnX19fJyAjYS5pdGVtLnR5cGVcbiAgICAgICAgICAgIGJ0eXBlID0gYi5pdGVtLnR5cGUgPT0gJ2ZpbGUnIGFuZCBzbGFzaC5leHQoYi5pdGVtLm5hbWUpIG9yICdfX18nICNiLml0ZW0udHlwZVxuICAgICAgICAgICAgKGEuaXRlbS50eXBlICsgYXR5cGUgKyBhLml0ZW0ubmFtZSkubG9jYWxlQ29tcGFyZShiLml0ZW0udHlwZSArIGJ0eXBlICsgYi5pdGVtLm5hbWUsIHVuZGVmaW5lZCwgbnVtZXJpYzp0cnVlKVxuICAgICAgICAgICAgXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICBAdGFibGUuYXBwZW5kQ2hpbGQgcm93LmRpdlxuICAgICAgICBAXG5cbiAgICBzb3J0QnlEYXRlQWRkZWQ6IC0+XG4gICAgICAgIFxuICAgICAgICBAcm93cy5zb3J0IChhLGIpIC0+IGIuaXRlbS5zdGF0Py5hdGltZU1zIC0gYS5pdGVtLnN0YXQ/LmF0aW1lTXNcbiAgICAgICAgICAgIFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93c1xuICAgICAgICAgICAgQHRhYmxlLmFwcGVuZENoaWxkIHJvdy5kaXZcbiAgICAgICAgQFxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgdG9nZ2xlRG90RmlsZXM6ID0+XG5cbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09IHVuZGVmaW5lZFxuICAgICAgICAgICAgIyBsb2cgJ2NvbHVtbi50b2dnbGVEb3RGaWxlcycgQHBhcmVudFxuICAgICAgICAgICAgQHBhcmVudC50eXBlID0gc2xhc2guaXNEaXIoQHBhcmVudC5maWxlKSBhbmQgJ2Rpcicgb3IgJ2ZpbGUnXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09ICdkaXInICAgICAgICAgICAgXG4gICAgICAgICAgICBzdGF0ZUtleSA9IFwiYnJvd3NlcuKWuHNob3dIaWRkZW7ilrgje0BwYXJlbnQuZmlsZX1cIlxuICAgICAgICAgICAgaWYgcHJlZnMuZ2V0IHN0YXRlS2V5XG4gICAgICAgICAgICAgICAgcHJlZnMuZGVsIHN0YXRlS2V5XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcHJlZnMuc2V0IHN0YXRlS2V5LCB0cnVlXG4gICAgICAgICAgICBAYnJvd3Nlci5sb2FkRGlySXRlbSBAcGFyZW50LCBAaW5kZXgsIGlnbm9yZUNhY2hlOnRydWVcbiAgICAgICAgQFxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBtb3ZlVG9UcmFzaDogPT5cbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gQGJyb3dzZXIuc2VsZWN0LmZyZWVJbmRleCgpXG4gICAgICAgIGlmIGluZGV4ID49IDBcbiAgICAgICAgICAgIHNlbGVjdFJvdyA9IEByb3cgaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGZvciByb3cgaW4gQGJyb3dzZXIuc2VsZWN0LnJvd3NcbiAgICAgICAgICAgIHd4dyAndHJhc2gnIHJvdy5wYXRoKClcbiAgICAgICAgICAgIEByZW1vdmVSb3cgcm93XG4gICAgICAgICAgIFxuICAgICAgICBpZiBzZWxlY3RSb3dcbiAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgc2VsZWN0Um93XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBuYXZpZ2F0ZUNvbHMgJ2xlZnQnXG5cbiAgICBhZGRUb1NoZWxmOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgcGF0aFRvU2hlbGYgPSBAYWN0aXZlUGF0aCgpXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2FkZFRvU2hlbGYnIHBhdGhUb1NoZWxmXG5cbiAgICAjIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICB2aWV3SW1hZ2VzOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGFjdGl2ZVJvdygpPy5pdGVtLm5hbWUgIT0gJy4uJyBhbmQgc2xhc2guaXNEaXIgQGFjdGl2ZVBhdGgoKVxuICAgICAgICAgICAgcGF0aCA9IEBhY3RpdmVQYXRoKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcGF0aCA9IEBhY3RpdmVSb3coKT8uaXRlbS5maWxlXG4gICAgICAgICAgICBpZiBGaWxlLmlzVGV4dCBwYXRoXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIudmlld2VyID0gbmV3IEVkaXRvciBwYXRoXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub3QgRmlsZS5pc0ltYWdlIHBhdGhcbiAgICAgICAgICAgICAgICBwYXRoID0gQHBhdGgoKVxuICAgICAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnZpZXdlciA9IG5ldyBWaWV3ZXIgcGF0aFxuICAgICAgICBcbiAgICBuZXdGb2xkZXI6ID0+XG4gICAgICAgIFxuICAgICAgICB1bnVzZWQgPSByZXF1aXJlICd1bnVzZWQtZmlsZW5hbWUnXG4gICAgICAgIHVudXNlZChzbGFzaC5qb2luIEBwYXRoKCksICdOZXcgZm9sZGVyJykudGhlbiAobmV3RGlyKSA9PlxuICAgICAgICAgICAgZnMubWtkaXIgbmV3RGlyLCAoZXJyKSA9PlxuICAgICAgICAgICAgICAgIGlmIGVtcHR5IGVyclxuICAgICAgICAgICAgICAgICAgICByb3cgPSBAaW5zZXJ0RmlsZSBuZXdEaXJcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyByb3dcbiAgICAgICAgICAgICAgICAgICAgcm93LmVkaXROYW1lKClcbiAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgZHVwbGljYXRlRmlsZTogPT5cbiAgICAgICAgXG4gICAgICAgIHVudXNlZCA9IHJlcXVpcmUgJ3VudXNlZC1maWxlbmFtZSdcbiAgICAgICAgXG4gICAgICAgIGZvciBmaWxlIGluIEBicm93c2VyLnNlbGVjdC5maWxlcygpXG4gICAgICAgIFxuICAgICAgICAgICAgdW51c2VkKGZpbGUpLnRoZW4gKGZpbGVOYW1lKSA9PlxuICAgICAgICAgICAgICAgIGZpbGVOYW1lID0gc2xhc2gucGF0aCBmaWxlTmFtZVxuICAgICAgICAgICAgICAgIGZzLmNvcHlGaWxlIGZpbGUsIGZpbGVOYW1lLCAoZXJyKSA9PlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3IgJ2NvcHkgZmlsZSBmYWlsZWQnIGVyciBpZiBlcnI/XG4gICAgICAgICAgICAgICAgICAgICMgbmV3RmlsZSA9IHNsYXNoLmpvaW4gc2xhc2guZGlyKEBhY3RpdmVQYXRoKCkpLCBmaWxlTmFtZVxuICAgICAgICAgICAgICAgICAgICBrbG9nICdmaWxlTmFtZScgZmlsZU5hbWVcbiAgICAgICAgICAgICAgICAgICAgcm93ID0gQGluc2VydEZpbGUgZmlsZU5hbWVcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyByb3dcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGV4cGxvcmVyOiA9PlxuICAgICAgICBcbiAgICAgICAgb3BlbiBzbGFzaC5kaXIgQGFjdGl2ZVBhdGgoKVxuICAgICAgICBcbiAgICBvcGVuOiA9PlxuICAgICAgICBcbiAgICAgICAgb3BlbiBAYWN0aXZlUGF0aCgpXG4gICAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgXG4gICAgICAgIFxuICAgIG1ha2VSb290OiA9PiBcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnNoaWZ0Q29sdW1uc1RvIEBpbmRleFxuICAgICAgICBcbiAgICAgICAgaWYgQGJyb3dzZXIuY29sdW1uc1swXS5pdGVtc1swXS5uYW1lICE9ICcuLidcbiAgICAgICAgICAgIEB1bnNoaWZ0SXRlbSBcbiAgICAgICAgICAgICAgICBuYW1lOiAnLi4nXG4gICAgICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgICAgICBmaWxlOiBzbGFzaC5kaXIgQHBhcmVudC5maWxlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBjcnVtYi5zZXRGaWxlIEBwYXJlbnQuZmlsZVxuICAgIFxuICAgIG9uQ29udGV4dE1lbnU6IChldmVudCwgY29sdW1uKSA9PiBcbiAgICAgICAgXG4gICAgICAgIHN0b3BFdmVudCBldmVudFxuICAgICAgICBcbiAgICAgICAgYWJzUG9zID0ga3BvcyBldmVudFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGNvbHVtblxuICAgICAgICAgICAgQHNob3dDb250ZXh0TWVudSBhYnNQb3NcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBvcHQgPSBpdGVtczogWyBcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICdSb290J1xuICAgICAgICAgICAgICAgIGNiOiAgICAgQG1ha2VSb290XG4gICAgICAgICAgICAsXG4gICAgICAgICAgICAgICAgdGV4dDogICAnQWRkIHRvIFNoZWxmJ1xuICAgICAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtzaGlmdCsuJ1xuICAgICAgICAgICAgICAgIGNiOiAgICAgPT4gcG9zdC5lbWl0ICdhZGRUb1NoZWxmJyBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgICxcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICdFeHBsb3JlcidcbiAgICAgICAgICAgICAgICBjb21ibzogICdhbHQrZScgXG4gICAgICAgICAgICAgICAgY2I6ICAgICA9PiBvcGVuIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgICAgICBvcHQueSA9IGFic1Bvcy55XG4gICAgICAgICAgICBwb3B1cC5tZW51IG9wdCAgICBcbiAgICAgICAgICAgICAgXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IGtwb3MgQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0LCBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcFxuICAgICAgICBcbiAgICAgICAgb3B0ID0gaXRlbXM6IFsgXG4gICAgICAgICAgICB0ZXh0OiAgICdUb2dnbGUgSW52aXNpYmxlJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtpJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHRvZ2dsZURvdEZpbGVzXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ1JlZnJlc2gnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK3InIFxuICAgICAgICAgICAgY2I6ICAgICBAYnJvd3Nlci5yZWZyZXNoXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0R1cGxpY2F0ZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrZCcgXG4gICAgICAgICAgICBjYjogICAgIEBkdXBsaWNhdGVGaWxlXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ01vdmUgdG8gVHJhc2gnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2JhY2tzcGFjZScgXG4gICAgICAgICAgICBjYjogICAgIEBtb3ZlVG9UcmFzaFxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdBZGQgdG8gU2hlbGYnXG4gICAgICAgICAgICBjb21ibzogICdhbHQrc2hpZnQrLidcbiAgICAgICAgICAgIGNiOiAgICAgQGFkZFRvU2hlbGZcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnTmV3IEZvbGRlcidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtuJyBcbiAgICAgICAgICAgIGNiOiAgICAgQG5ld0ZvbGRlclxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdWaWV3IEltYWdlcydcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCt2JyBcbiAgICAgICAgICAgIGNiOiAgICAgQHZpZXdJbWFnZXNcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnRXhwbG9yZXInXG4gICAgICAgICAgICBjb21ibzogICdhbHQrZScgXG4gICAgICAgICAgICBjYjogICAgIEBleHBsb3JlclxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdPcGVuJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K28nIFxuICAgICAgICAgICAgY2I6ICAgICBAb3BlblxuICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICBvcHQuaXRlbXMgPSBvcHQuaXRlbXMuY29uY2F0IHdpbmRvdy50aXRsZWJhci5tYWtlVGVtcGxhdGUgcmVxdWlyZSAnLi9tZW51Lmpzb24nXG4gICAgICAgIFxuICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgcG9wdXAubWVudSBvcHQgICAgICAgIFxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG9uS2V5OiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnc2hpZnQrYCcgJ34nICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIuYnJvd3NlICd+J1xuICAgICAgICAgICAgd2hlbiAnLycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIuYnJvd3NlICcvJ1xuICAgICAgICAgICAgd2hlbiAnYWx0K2UnICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBleHBsb3JlcigpXG4gICAgICAgICAgICB3aGVuICdhbHQrbycgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQG9wZW4oKVxuICAgICAgICAgICAgd2hlbiAnYWx0K24nICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBuZXdGb2xkZXIoKVxuICAgICAgICAgICAgd2hlbiAnc3BhY2UnICdhbHQrdicgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEB2aWV3SW1hZ2VzKClcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICdwYWdlIGRvd24nICdob21lJyAnZW5kJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3Mga2V5XG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK3VwJyAnY3RybCt1cCcgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzICdob21lJ1xuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtkb3duJyAnY3RybCtkb3duJyAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyAnZW5kJ1xuICAgICAgICAgICAgd2hlbiAnZW50ZXInJ2FsdCt1cCcgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlQ29scyBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2JhY2tzcGFjZScgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLm9uQmFja3NwYWNlSW5Db2x1bW4gQFxuICAgICAgICAgICAgd2hlbiAnZGVsZXRlJyAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIub25EZWxldGVJbkNvbHVtbiBAXG4gICAgICAgICAgICB3aGVuICdjdHJsK3QnICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAc29ydEJ5VHlwZSgpXG4gICAgICAgICAgICB3aGVuICdjdHJsK24nICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAc29ydEJ5TmFtZSgpXG4gICAgICAgICAgICB3aGVuICdjdHJsK2EnICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAc29ydEJ5RGF0ZUFkZGVkKClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQraScgJ2N0cmwraScgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEB0b2dnbGVEb3RGaWxlcygpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2QnICdjdHJsK2QnICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAZHVwbGljYXRlRmlsZSgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2snICdjdHJsK2snICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50IGlmIEBicm93c2VyLmNsZWFuVXAoKVxuICAgICAgICAgICAgd2hlbiAnZjInICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGFjdGl2ZVJvdygpPy5lZGl0TmFtZSgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2xlZnQnICdjb21tYW5kK3JpZ2h0JyAnY3RybCtsZWZ0JyAnY3RybCtyaWdodCdcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb290IGtleVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtiYWNrc3BhY2UnICdjdHJsK2JhY2tzcGFjZScgJ2NvbW1hbmQrZGVsZXRlJyAnY3RybCtkZWxldGUnIFxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBtb3ZlVG9UcmFzaCgpXG4gICAgICAgICAgICB3aGVuICd0YWInICAgIFxuICAgICAgICAgICAgICAgIGlmIEBzZWFyY2gubGVuZ3RoIHRoZW4gQGRvU2VhcmNoICcnXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuICAgICAgICAgICAgd2hlbiAnZXNjJ1xuICAgICAgICAgICAgICAgIGlmIEBkcmFnRGl2XG4gICAgICAgICAgICAgICAgICAgIEBkcmFnRGl2LmRyYWcuZHJhZ1N0b3AoKVxuICAgICAgICAgICAgICAgICAgICBAZHJhZ0Rpdi5yZW1vdmUoKVxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgQGRyYWdEaXZcbiAgICAgICAgICAgICAgICBlbHNlIGlmIEBicm93c2VyLnNlbGVjdC5maWxlcygpLmxlbmd0aCA+IDFcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnJvdyBAYWN0aXZlUm93KClcbiAgICAgICAgICAgICAgICBlbHNlIGlmIEBzZWFyY2gubGVuZ3RoIHRoZW4gQGNsZWFyU2VhcmNoKClcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG5cbiAgICAgICAgaWYgY29tYm8gaW4gWyd1cCcgICAnZG93biddICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3Mga2V5ICAgICAgICAgICAgICBcbiAgICAgICAgaWYgY29tYm8gaW4gWydsZWZ0JyAncmlnaHQnXSB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZUNvbHMga2V5XG4gICAgICAgICAgICBcbiAgICAgICAgaWYgbW9kIGluIFsnc2hpZnQnICcnXSBhbmQgY2hhciB0aGVuIEBkb1NlYXJjaCBjaGFyXG4gICAgICAgICAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IENvbHVtblxuXG5cbiJdfQ==
//# sourceURL=../coffee/column.coffee