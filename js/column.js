// koffee 1.4.0

/*
 0000000   0000000   000      000   000  00     00  000   000
000       000   000  000      000   000  000   000  0000  000
000       000   000  000      000   000  000000000  000 0 000
000       000   000  000      000   000  000 0 000  000  0000
 0000000   0000000   0000000   0000000   000   000  000   000
 */
var $, Column, Crumb, File, Row, Scroller, Viewer, _, clamp, drag, elem, empty, fs, fuzzy, kerror, keyinfo, klog, kpos, open, popup, post, prefs, ref, setStyle, slash, stopEvent, valid, wxw,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, prefs = ref.prefs, stopEvent = ref.stopEvent, setStyle = ref.setStyle, keyinfo = ref.keyinfo, popup = ref.popup, slash = ref.slash, valid = ref.valid, clamp = ref.clamp, empty = ref.empty, drag = ref.drag, open = ref.open, elem = ref.elem, kpos = ref.kpos, fs = ref.fs, klog = ref.klog, kerror = ref.kerror, $ = ref.$, _ = ref._;

Row = require('./row');

Scroller = require('./tools/scroller');

File = require('./tools/file');

Viewer = require('./viewer');

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
        var ref1, ref2, row;
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
                return this.browser.select.row((ref2 = this.activeRow()) != null ? ref2 : this.browser.select.active);
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
        var action, column, ref1, ref2, ref3, ref4, row, target;
        if (this.dragDiv != null) {
            this.dragDiv.remove();
            delete this.dragDiv;
            if (row = this.browser.rowAtPos(d.pos)) {
                klog('drop row', row.column.index, row.item.file, this.browser.select.files());
                column = row.column;
                target = row.item.file;
            } else if (column = this.browser.columnAtPos(d.pos)) {
                klog('drop column', column.index, (ref1 = column.parent) != null ? ref1.file : void 0, this.browser.select.files());
                target = (ref2 = column.parent) != null ? ref2.file : void 0;
            } else if (column = this.browser.columnAtX(d.pos.x)) {
                klog('drop crumb', column.index, (ref3 = column.parent) != null ? ref3.file : void 0, this.browser.select.files());
                target = (ref4 = column.parent) != null ? ref4.file : void 0;
            } else {
                klog('no drop target');
                return;
            }
            action = e.shiftKey && 'copy' || 'move';
            if (column === this.browser.shelf) {
                klog('drop shelf');
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
        var ref1;
        this.clearSearch();
        delete this.parent;
        this.div.scrollTop = 0;
        if ((ref1 = this.editor) != null) {
            ref1.del();
        }
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
        var imgDir, ref1;
        if (((ref1 = this.activeRow()) != null ? ref1.item.name : void 0) !== '..' && slash.isDir(this.activePath())) {
            imgDir = this.activePath();
        } else {
            imgDir = this.path();
        }
        return this.browser.viewer = new Viewer(imgDir);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sdW1uLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx5TEFBQTtJQUFBOztBQVFBLE1BQW1JLE9BQUEsQ0FBUSxLQUFSLENBQW5JLEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUseUJBQWYsRUFBMEIsdUJBQTFCLEVBQW9DLHFCQUFwQyxFQUE2QyxpQkFBN0MsRUFBb0QsaUJBQXBELEVBQTJELGlCQUEzRCxFQUFrRSxpQkFBbEUsRUFBeUUsaUJBQXpFLEVBQWdGLGVBQWhGLEVBQXNGLGVBQXRGLEVBQTRGLGVBQTVGLEVBQWtHLGVBQWxHLEVBQXdHLFdBQXhHLEVBQTRHLGVBQTVHLEVBQWtILG1CQUFsSCxFQUEwSCxTQUExSCxFQUE2SDs7QUFFN0gsR0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsa0JBQVI7O0FBQ1gsSUFBQSxHQUFXLE9BQUEsQ0FBUSxjQUFSOztBQUNYLE1BQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7QUFDWCxLQUFBLEdBQVcsT0FBQSxDQUFRLFNBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLEdBQUEsR0FBVyxPQUFBLENBQVEsS0FBUjs7QUFFTDtJQUVXLGdCQUFDLE9BQUQ7QUFFVCxZQUFBO1FBRlUsSUFBQyxDQUFBLFVBQUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBRVYsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUNmLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUVWLElBQUMsQ0FBQSxHQUFELEdBQVMsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxlQUFQO1lBQXVCLFFBQUEsRUFBUyxDQUFoQztTQUFMO1FBQ1QsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFBLENB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Y2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIHByZWZzLCBzdG9wRXZlbnQsIHNldFN0eWxlLCBrZXlpbmZvLCBwb3B1cCwgc2xhc2gsIHZhbGlkLCBjbGFtcCwgZW1wdHksIGRyYWcsIG9wZW4sIGVsZW0sIGtwb3MsIGZzLCBrbG9nLCBrZXJyb3IsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuUm93ICAgICAgPSByZXF1aXJlICcuL3JvdydcblNjcm9sbGVyID0gcmVxdWlyZSAnLi90b29scy9zY3JvbGxlcidcbkZpbGUgICAgID0gcmVxdWlyZSAnLi90b29scy9maWxlJ1xuVmlld2VyICAgPSByZXF1aXJlICcuL3ZpZXdlcidcbkNydW1iICAgID0gcmVxdWlyZSAnLi9jcnVtYidcbmZ1enp5ICAgID0gcmVxdWlyZSAnZnV6enknXG53eHcgICAgICA9IHJlcXVpcmUgJ3d4dydcblxuY2xhc3MgQ29sdW1uXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAYnJvd3NlcikgLT5cbiAgICAgICAgXG4gICAgICAgIEBzZWFyY2hUaW1lciA9IG51bGxcbiAgICAgICAgQHNlYXJjaCA9ICcnXG4gICAgICAgIEBpdGVtcyAgPSBbXVxuICAgICAgICBAcm93cyAgID0gW11cbiAgICAgICAgXG4gICAgICAgIEBkaXYgICA9IGVsZW0gY2xhc3M6ICdicm93c2VyQ29sdW1uJyB0YWJJbmRleDo2XG4gICAgICAgIEB0YWJsZSA9IGVsZW0gY2xhc3M6ICdicm93c2VyQ29sdW1uVGFibGUnXG4gICAgICAgIEBkaXYuYXBwZW5kQ2hpbGQgQHRhYmxlXG4gICAgICAgIFxuICAgICAgICBAc2V0SW5kZXggQGJyb3dzZXIuY29sdW1ucz8ubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5jb2xzPy5hcHBlbmRDaGlsZCBAZGl2XG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2ZvY3VzJyAgICAgQG9uRm9jdXNcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdibHVyJyAgICAgIEBvbkJsdXJcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJyAgIEBvbktleVxuICAgICAgICBcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdtb3VzZW92ZXInIEBvbk1vdXNlT3ZlclxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlb3V0JyAgQG9uTW91c2VPdXRcblxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2RibGNsaWNrJyAgQG9uRGJsQ2xpY2tcbiAgICAgICAgXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnY29udGV4dG1lbnUnIEBvbkNvbnRleHRNZW51XG4gIFxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAZGl2XG4gICAgICAgICAgICBvblN0YXJ0OiBAb25EcmFnU3RhcnRcbiAgICAgICAgICAgIG9uTW92ZTogIEBvbkRyYWdNb3ZlXG4gICAgICAgICAgICBvblN0b3A6ICBAb25EcmFnU3RvcFxuICAgICAgICBcbiAgICAgICAgQGNydW1iICA9IG5ldyBDcnVtYiBAXG4gICAgICAgIEBzY3JvbGwgPSBuZXcgU2Nyb2xsZXIgQFxuICAgICAgICBcbiAgICBzZXRJbmRleDogKEBpbmRleCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjcnVtYj8uZWxlbS5jb2x1bW5JbmRleCA9IEBpbmRleFxuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgICMgb25Ecm9wOiAoZXZlbnQpID0+IFxuIyAgICAgXG4gICAgICAgICMgQGJyb3dzZXIuZHJvcEFjdGlvbiBldmVudCwgQHBhcmVudD8uZmlsZVxuICAgICAgIFxuICAgIG9uRHJhZ1N0YXJ0OiAoZCwgZSkgPT4gXG4gICAgXG4gICAgICAgIHJvdyA9IEByb3cgZS50YXJnZXRcbiAgICAgICAgXG4gICAgICAgIGRlbGV0ZSBAdG9nZ2xlXG4gICAgICAgIFxuICAgICAgICBpZiByb3dcbiAgICAgICAgICAgICMga2xvZyAnb25EcmFnU3RhcnQnIHJvdy5pdGVtLmZpbGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZS5zaGlmdEtleVxuICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC50byByb3dcbiAgICAgICAgICAgIGVsc2UgaWYgZS5tZXRhS2V5IG9yIGUuYWx0S2V5IG9yIGUuY3RybEtleVxuICAgICAgICAgICAgICAgIGlmIG5vdCByb3cuaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC50b2dnbGUgcm93XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAdG9nZ2xlID0gdHJ1ZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIHJvdy5pc1NlbGVjdGVkKClcbiAgICAgICAgICAgICAgICAgICAgQGRlc2VsZWN0ID0gdHJ1ZVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGFjdGl2ZVJvdygpPy5jbGVhckFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgcm93LCBmYWxzZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBAaGFzRm9jdXMoKVxuICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQGFjdGl2ZVJvdygpID8gQGJyb3dzZXIuc2VsZWN0LmFjdGl2ZVxuXG4gICAgb25EcmFnTW92ZTogKGQsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAZHJhZ0RpdiBhbmQgdmFsaWQgQGJyb3dzZXIuc2VsZWN0LmZpbGVzKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGlmIE1hdGguYWJzKGQuZGVsdGFTdW0ueCkgPCAyMCBhbmQgTWF0aC5hYnMoZC5kZWx0YVN1bS55KSA8IDEwXG5cbiAgICAgICAgICAgIGRlbGV0ZSBAdG9nZ2xlIFxuICAgICAgICAgICAgZGVsZXRlIEBkZXNlbGVjdFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZHJhZ0RpdiA9IGVsZW0gJ2RpdidcbiAgICAgICAgICAgIEBkcmFnRGl2LmRyYWcgPSBkXG4gICAgICAgICAgICBwb3MgPSBrcG9zIGUucGFnZVgsIGUucGFnZVlcbiAgICAgICAgICAgIHJvdyA9IEBicm93c2VyLnNlbGVjdC5yb3dzWzBdXG4gICAgICAgICAgICBiciAgPSByb3cuZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICAgICAgQGRyYWdEaXYuc3R5bGUub3BhY2l0eSAgPSBcIjAuN1wiXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS50b3AgID0gXCIje3Bvcy55LWQuZGVsdGFTdW0ueX1weFwiXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5sZWZ0ID0gXCIje3Bvcy54LWQuZGVsdGFTdW0ueH1weFwiXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS53aWR0aCA9IFwiI3tici53aWR0aC0xMn1weFwiXG4gICAgICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciByb3cgaW4gQGJyb3dzZXIuc2VsZWN0LnJvd3NcbiAgICAgICAgICAgICAgICByb3dDbG9uZSA9IHJvdy5kaXYuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgICAgICAgICByb3dDbG9uZS5zdHlsZS5mbGV4ID0gJ3Vuc2V0J1xuICAgICAgICAgICAgICAgIHJvd0Nsb25lLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSdcbiAgICAgICAgICAgICAgICByb3dDbG9uZS5zdHlsZS5ib3JkZXIgPSAnbm9uZSdcbiAgICAgICAgICAgICAgICByb3dDbG9uZS5zdHlsZS5tYXJnaW5Cb3R0b20gPSAnLTFweCdcbiAgICAgICAgICAgICAgICBAZHJhZ0Rpdi5hcHBlbmRDaGlsZCByb3dDbG9uZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCBAZHJhZ0RpdlxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnRGl2XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBkcmFnRGl2LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlWCgje2QuZGVsdGFTdW0ueH1weCkgdHJhbnNsYXRlWSgje2QuZGVsdGFTdW0ueX1weClcIlxuXG4gICAgb25EcmFnU3RvcDogKGQsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBkcmFnRGl2P1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZHJhZ0Rpdi5yZW1vdmUoKVxuICAgICAgICAgICAgZGVsZXRlIEBkcmFnRGl2XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHJvdyA9IEBicm93c2VyLnJvd0F0UG9zIGQucG9zXG4gICAgICAgICAgICAgICAga2xvZyAnZHJvcCByb3cnIHJvdy5jb2x1bW4uaW5kZXgsIHJvdy5pdGVtLmZpbGUsIEBicm93c2VyLnNlbGVjdC5maWxlcygpXG4gICAgICAgICAgICAgICAgY29sdW1uID0gcm93LmNvbHVtblxuICAgICAgICAgICAgICAgIHRhcmdldCA9IHJvdy5pdGVtLmZpbGVcbiAgICAgICAgICAgIGVsc2UgaWYgY29sdW1uID0gQGJyb3dzZXIuY29sdW1uQXRQb3MgZC5wb3NcbiAgICAgICAgICAgICAgICBrbG9nICdkcm9wIGNvbHVtbicgY29sdW1uLmluZGV4LCBjb2x1bW4ucGFyZW50Py5maWxlLCBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKVxuICAgICAgICAgICAgICAgIHRhcmdldCA9IGNvbHVtbi5wYXJlbnQ/LmZpbGVcbiAgICAgICAgICAgIGVsc2UgaWYgY29sdW1uID0gQGJyb3dzZXIuY29sdW1uQXRYIGQucG9zLnhcbiAgICAgICAgICAgICAgICBrbG9nICdkcm9wIGNydW1iJyBjb2x1bW4uaW5kZXgsIGNvbHVtbi5wYXJlbnQ/LmZpbGUsIEBicm93c2VyLnNlbGVjdC5maWxlcygpXG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gY29sdW1uLnBhcmVudD8uZmlsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGtsb2cgJ25vIGRyb3AgdGFyZ2V0J1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgYWN0aW9uID0gZS5zaGlmdEtleSBhbmQgJ2NvcHknIG9yICdtb3ZlJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgY29sdW1uID09IEBicm93c2VyLnNoZWxmIFxuICAgICAgICAgICAgICAgIGtsb2cgJ2Ryb3Agc2hlbGYnXG4gICAgICAgICAgICAgICAgaWYgdGFyZ2V0IGFuZCAoZS5jdHJsS2V5IG9yIGUuc2hpZnRLZXkgb3IgZS5tZXRhS2V5IG9yIGUuYWx0S2V5KVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5kcm9wQWN0aW9uIGFjdGlvbiwgQGJyb3dzZXIuc2VsZWN0LmZpbGVzKCksIHRhcmdldFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2hlbGYuYWRkRmlsZXMgQGJyb3dzZXIuc2VsZWN0LmZpbGVzKCksIHBvczpkLnBvc1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBicm93c2VyLmRyb3BBY3Rpb24gYWN0aW9uLCBAYnJvd3Nlci5zZWxlY3QuZmlsZXMoKSwgdGFyZ2V0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGZvY3VzIGFjdGl2YXRlOmZhbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHJvdyA9IEByb3cgZS50YXJnZXRcbiAgICAgICAgICAgICAgICBpZiByb3cuaXNTZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgICAgIGlmIGUubWV0YUtleSBvciBlLmFsdEtleSBvciBlLmN0cmxLZXkgb3IgZS5zaGlmdEtleVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQHRvZ2dsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBAdG9nZ2xlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuc2VsZWN0LnRvZ2dsZSByb3dcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQGRlc2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEBkZXNlbGVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgcm93XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIHJlbW92ZUZpbGU6IChmaWxlKSA9PiBcbiAgICAgICAgXG4gICAgICAgIGlmIHJvdyA9IEByb3cgc2xhc2guZmlsZSBmaWxlXG4gICAgICAgICAgICBAcmVtb3ZlUm93IHJvd1xuICAgICAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICAgICAgXG4gICAgaW5zZXJ0RmlsZTogKGZpbGUpID0+IFxuXG4gICAgICAgIGl0ZW0gPSBAYnJvd3Nlci5maWxlSXRlbSBmaWxlXG4gICAgICAgIHJvdyA9IG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBAcm93cy5wdXNoIHJvd1xuICAgICAgICByb3dcbiAgICBcbiAgICBsb2FkSXRlbXM6IChpdGVtcywgcGFyZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW4gQGluZGV4XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMgID0gaXRlbXNcbiAgICAgICAgQHBhcmVudCA9IHBhcmVudFxuICAgICAgICBcbiAgICAgICAgQGNydW1iLnNldEZpbGUgQHBhcmVudC5maWxlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSB1bmRlZmluZWRcbiAgICAgICAgICAgIEBwYXJlbnQudHlwZSA9IHNsYXNoLmlzRGlyKEBwYXJlbnQuZmlsZSkgYW5kICdkaXInIG9yICdmaWxlJ1xuICAgICAgICBcbiAgICAgICAga2Vycm9yIFwibm8gcGFyZW50IGl0ZW0/XCIgaWYgbm90IEBwYXJlbnQ/XG4gICAgICAgIGtlcnJvciBcImxvYWRJdGVtcyAtLSBubyBwYXJlbnQgdHlwZT9cIiwgQHBhcmVudCBpZiBub3QgQHBhcmVudC50eXBlP1xuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgQGl0ZW1zXG4gICAgICAgICAgICBmb3IgaXRlbSBpbiBAaXRlbXNcbiAgICAgICAgICAgICAgICBAcm93cy5wdXNoIG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBcbiAgICAgICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgPT0gJ2RpcicgYW5kIHNsYXNoLnNhbWVQYXRoICd+L0Rvd25sb2FkcycgQHBhcmVudC5maWxlXG4gICAgICAgICAgICBAc29ydEJ5RGF0ZUFkZGVkKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICB1bnNoaWZ0SXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMudW5zaGlmdCBpdGVtXG4gICAgICAgIEByb3dzLnVuc2hpZnQgbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIEB0YWJsZS5pbnNlcnRCZWZvcmUgQHRhYmxlLmxhc3RDaGlsZCwgQHRhYmxlLmZpcnN0Q2hpbGRcbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAcm93c1swXVxuICAgICAgICBcbiAgICBwdXNoSXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMucHVzaCBpdGVtXG4gICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgQHJvd3NbLTFdXG4gICAgICAgIFxuICAgIGFkZEl0ZW06IChpdGVtKSAtPlxuICAgICAgICBcbiAgICAgICAgcm93ID0gQHB1c2hJdGVtIGl0ZW1cbiAgICAgICAgQHNvcnRCeU5hbWUoKVxuICAgICAgICByb3dcblxuICAgIHNldEl0ZW1zOiAoQGl0ZW1zLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5jbGVhckNvbHVtbiBAaW5kZXhcbiAgICAgICAgXG4gICAgICAgIEBwYXJlbnQgPSBvcHQucGFyZW50XG4gICAgICAgIGtlcnJvciBcIm5vIHBhcmVudCBpdGVtP1wiIGlmIG5vdCBAcGFyZW50P1xuICAgICAgICBrZXJyb3IgXCJzZXRJdGVtcyAtLSBubyBwYXJlbnQgdHlwZT9cIiwgQHBhcmVudCBpZiBub3QgQHBhcmVudC50eXBlP1xuICAgICAgICBcbiAgICAgICAgZm9yIGl0ZW0gaW4gQGl0ZW1zXG4gICAgICAgICAgICBAcm93cy5wdXNoIG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICBcbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAXG5cbiAgICBpc0RpcjogIC0+IEBwYXJlbnQ/LnR5cGUgPT0gJ2RpcicgXG4gICAgaXNGaWxlOiAtPiBAcGFyZW50Py50eXBlID09ICdmaWxlJyBcbiAgICAgICAgXG4gICAgaXNFbXB0eTogLT4gZW1wdHkgQHBhcmVudFxuICAgIGNsZWFyOiAgIC0+XG4gICAgICAgIEBjbGVhclNlYXJjaCgpXG4gICAgICAgIGRlbGV0ZSBAcGFyZW50XG4gICAgICAgIEBkaXYuc2Nyb2xsVG9wID0gMFxuICAgICAgICBAZWRpdG9yPy5kZWwoKVxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgQGNydW1iLmNsZWFyKClcbiAgICAgICAgQHJvd3MgPSBbXVxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIFxuICAgXG4gICAgYWN0aXZhdGVSb3c6IChyb3cpIC0+IEByb3cocm93KT8uYWN0aXZhdGUoKVxuICAgICAgIFxuICAgIGFjdGl2ZVJvdzogLT4gXy5maW5kIEByb3dzLCAocikgLT4gci5pc0FjdGl2ZSgpXG4gICAgYWN0aXZlUGF0aDogLT4gQGFjdGl2ZVJvdygpPy5wYXRoKClcbiAgICBcbiAgICByb3c6IChyb3cpIC0+ICMgYWNjZXB0cyBlbGVtZW50LCBpbmRleCwgc3RyaW5nIG9yIHJvd1xuICAgICAgICBpZiAgICAgIF8uaXNOdW1iZXIgIHJvdyB0aGVuIHJldHVybiAwIDw9IHJvdyA8IEBudW1Sb3dzKCkgYW5kIEByb3dzW3Jvd10gb3IgbnVsbFxuICAgICAgICBlbHNlIGlmIF8uaXNFbGVtZW50IHJvdyB0aGVuIHJldHVybiBfLmZpbmQgQHJvd3MsIChyKSAtPiByLmRpdi5jb250YWlucyByb3dcbiAgICAgICAgZWxzZSBpZiBfLmlzU3RyaW5nICByb3cgdGhlbiByZXR1cm4gXy5maW5kIEByb3dzLCAocikgLT4gci5pdGVtLm5hbWUgPT0gcm93IG9yIHIuaXRlbS5maWxlID09IHJvd1xuICAgICAgICBlbHNlIHJldHVybiByb3dcbiAgICAgICAgICAgIFxuICAgIG5leHRDb2x1bW46IC0+IEBicm93c2VyLmNvbHVtbiBAaW5kZXgrMVxuICAgIHByZXZDb2x1bW46IC0+IEBicm93c2VyLmNvbHVtbiBAaW5kZXgtMVxuICAgICAgICBcbiAgICBuYW1lOiAtPiBcIiN7QGJyb3dzZXIubmFtZX06I3tAaW5kZXh9XCJcbiAgICBwYXRoOiAtPiBAcGFyZW50Py5maWxlID8gJydcbiAgICAgICAgXG4gICAgbnVtUm93czogICAgLT4gQHJvd3MubGVuZ3RoID8gMCAgIFxuICAgIHJvd0hlaWdodDogIC0+IEByb3dzWzBdPy5kaXYuY2xpZW50SGVpZ2h0ID8gMFxuICAgIG51bVZpc2libGU6IC0+IEByb3dIZWlnaHQoKSBhbmQgcGFyc2VJbnQoQGJyb3dzZXIuaGVpZ2h0KCkgLyBAcm93SGVpZ2h0KCkpIG9yIDBcbiAgICBcbiAgICByb3dBdFBvczogKHBvcykgLT4gQHJvdyBAcm93SW5kZXhBdFBvcyBwb3NcbiAgICBcbiAgICByb3dJbmRleEF0UG9zOiAocG9zKSAtPlxuICAgICAgICBcbiAgICAgICAgTWF0aC5tYXggMCwgTWF0aC5mbG9vciAocG9zLnkgLSBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCkgLyBAcm93SGVpZ2h0KClcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBoYXNGb2N1czogLT4gQGRpdi5jbGFzc0xpc3QuY29udGFpbnMgJ2ZvY3VzJ1xuXG4gICAgZm9jdXM6IChvcHQ9e30pIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAYWN0aXZlUm93KCkgYW5kIEBudW1Sb3dzKCkgYW5kIG9wdD8uYWN0aXZhdGUgIT0gZmFsc2VcbiAgICAgICAgICAgIEByb3dzWzBdLnNldEFjdGl2ZSgpXG4gICAgICAgIEBkaXYuZm9jdXMoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgIG9uRm9jdXM6ID0+IEBkaXYuY2xhc3NMaXN0LmFkZCAnZm9jdXMnXG4gICAgb25CbHVyOiAgPT4gQGRpdi5jbGFzc0xpc3QucmVtb3ZlICdmb2N1cydcblxuICAgIGZvY3VzQnJvd3NlcjogLT4gQGJyb3dzZXIuZm9jdXMoKVxuICAgIFxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgb25Nb3VzZU92ZXI6IChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5vbk1vdXNlT3ZlcigpXG4gICAgb25Nb3VzZU91dDogIChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5vbk1vdXNlT3V0KClcbiAgICBcbiAgICAjIG9uQ2xpY2s6IChldmVudCkgPT5cbiMgICAgICAgICBcbiAgICAgICAgIyBpZiByb3cgPSBAcm93IGV2ZW50LnRhcmdldFxuIyAgICAgICAgICAgICBcbiAgICAgICAgICAgICMga2xvZyAnb25DbGljaydcbiAgICAgICAgICAgICMgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgICMgaWYgZXZlbnQuc2hpZnRLZXlcbiAgICAgICAgICAgICAgICAjIEBicm93c2VyLnNlbGVjdC50byByb3dcbiAgICAgICAgICAgICMgZWxzZSBpZiBldmVudC5tZXRhS2V5IG9yIGV2ZW50LmFsdEtleSBvciBldmVudC5jdHJsS2V5XG4gICAgICAgICAgICAgICAgIyBAYnJvd3Nlci5zZWxlY3QudG9nZ2xlIHJvd1xuICAgICAgICAgICAgIyBlbHNlXG4gICAgICAgICAgICAgICAgIyBAYnJvd3Nlci5zZWxlY3Qucm93IHJvd1xuICAgIFxuICAgIG9uRGJsQ2xpY2s6ICAoZXZlbnQpID0+IFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuc2tpcE9uRGJsQ2xpY2sgPSB0cnVlXG4gICAgICAgIEBuYXZpZ2F0ZUNvbHMgJ2VudGVyJ1xuICAgIFxuICAgIHVwZGF0ZUNydW1iOiA9PiBAY3J1bWIudXBkYXRlUmVjdCBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG5cbiAgICBuYXZpZ2F0ZVJvd3M6IChrZXkpIC0+XG5cbiAgICAgICAgcmV0dXJuIGVycm9yIFwibm8gcm93cyBpbiBjb2x1bW4gI3tAaW5kZXh9P1wiIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gLTFcbiAgICAgICAgZXJyb3IgXCJubyBpbmRleCBmcm9tIGFjdGl2ZVJvdz8gI3tpbmRleH0/XCIsIEBhY3RpdmVSb3coKSBpZiBub3QgaW5kZXg/IG9yIE51bWJlci5pc05hTiBpbmRleFxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcgICAgICAgIHRoZW4gaW5kZXgtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIGluZGV4KzFcbiAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiAwXG4gICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gQG51bVJvd3MoKS0xXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gaW5kZXgtQG51bVZpc2libGUoKVxuICAgICAgICAgICAgd2hlbiAncGFnZSBkb3duJyB0aGVuIGluZGV4K0BudW1WaXNpYmxlKClcbiAgICAgICAgICAgIGVsc2UgaW5kZXhcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBub3QgaW5kZXg/IG9yIE51bWJlci5pc05hTiBpbmRleCAgICAgICAgXG4gICAgICAgICAgICBlcnJvciBcIm5vIGluZGV4ICN7aW5kZXh9PyAje0BudW1WaXNpYmxlKCl9XCJcbiAgICAgICAgICAgIFxuICAgICAgICBpbmRleCA9IGNsYW1wIDAsIEBudW1Sb3dzKCktMSwgaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAcm93c1tpbmRleF0/LmFjdGl2YXRlP1xuICAgICAgICAgICAgZXJyb3IgXCJubyByb3cgYXQgaW5kZXggI3tpbmRleH0vI3tAbnVtUm93cygpLTF9P1wiLCBAbnVtUm93cygpIFxuICAgICAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnNlbGVjdC5yb3cgQHJvd3NbaW5kZXhdXG4gICAgXG4gICAgbmF2aWdhdGVDb2xzOiAoa2V5KSAtPiAjIG1vdmUgdG8gZmlsZSBicm93c2VyP1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgIHRoZW4gQGJyb3dzZXIubmF2aWdhdGUgJ3VwJ1xuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gQGJyb3dzZXIubmF2aWdhdGUgJ2xlZnQnXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBAYnJvd3Nlci5uYXZpZ2F0ZSAncmlnaHQnXG4gICAgICAgICAgICB3aGVuICdlbnRlcidcbiAgICAgICAgICAgICAgICBpZiBpdGVtID0gQGFjdGl2ZVJvdygpPy5pdGVtXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSBpdGVtLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgaWYgdHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIubG9hZEl0ZW0gaXRlbVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdvcGVuRmlsZScgaXRlbS5maWxlXG4gICAgICAgIEBcblxuICAgIG5hdmlnYXRlUm9vdDogKGtleSkgLT4gXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5icm93c2Ugc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gc2xhc2guZGlyIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gQGFjdGl2ZVJvdygpLml0ZW0uZmlsZVxuICAgICAgICBAXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgIFxuICAgIFxuICAgIGRvU2VhcmNoOiAoY2hhcikgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQG51bVJvd3MoKVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEBzZWFyY2hEaXZcbiAgICAgICAgICAgIEBzZWFyY2hEaXYgPSBlbGVtIGNsYXNzOiAnYnJvd3NlclNlYXJjaCdcbiAgICAgICAgICAgIFxuICAgICAgICBAc2V0U2VhcmNoIEBzZWFyY2ggKyBjaGFyXG4gICAgICAgIFxuICAgIGJhY2tzcGFjZVNlYXJjaDogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBzZWFyY2hEaXYgYW5kIEBzZWFyY2gubGVuZ3RoXG4gICAgICAgICAgICBAc2V0U2VhcmNoIEBzZWFyY2hbMC4uLkBzZWFyY2gubGVuZ3RoLTFdXG4gICAgICAgICAgICBcbiAgICBzZXRTZWFyY2g6IChAc2VhcmNoKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgIGNsZWFyVGltZW91dCBAc2VhcmNoVGltZXJcbiAgICAgICAgQHNlYXJjaFRpbWVyID0gc2V0VGltZW91dCBAY2xlYXJTZWFyY2gsIDIwMDBcbiAgICAgICAgXG4gICAgICAgIEBzZWFyY2hEaXYudGV4dENvbnRlbnQgPSBAc2VhcmNoXG5cbiAgICAgICAgYWN0aXZlSW5kZXggID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gMFxuICAgICAgICBhY3RpdmVJbmRleCArPSAxIGlmIChAc2VhcmNoLmxlbmd0aCA9PSAxKSAjb3IgKGNoYXIgPT0gJycpXG4gICAgICAgIGFjdGl2ZUluZGV4ICA9IDAgaWYgYWN0aXZlSW5kZXggPj0gQG51bVJvd3MoKVxuICAgICAgICBcbiAgICAgICAgZm9yIHJvd3MgaW4gW0Byb3dzLnNsaWNlKGFjdGl2ZUluZGV4KSwgQHJvd3Muc2xpY2UoMCxhY3RpdmVJbmRleCsxKV1cbiAgICAgICAgICAgIGZ1enppZWQgPSBmdXp6eS5maWx0ZXIgQHNlYXJjaCwgcm93cywgZXh0cmFjdDogKHIpIC0+IHIuaXRlbS5uYW1lXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGZ1enppZWQubGVuZ3RoXG4gICAgICAgICAgICAgICAgcm93ID0gZnV6emllZFswXS5vcmlnaW5hbFxuICAgICAgICAgICAgICAgIHJvdy5kaXYuYXBwZW5kQ2hpbGQgQHNlYXJjaERpdlxuICAgICAgICAgICAgICAgIHJvdy5hY3RpdmF0ZSgpXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgQFxuICAgIFxuICAgIGNsZWFyU2VhcmNoOiA9PlxuICAgICAgICBcbiAgICAgICAgQHNlYXJjaCA9ICcnXG4gICAgICAgIEBzZWFyY2hEaXY/LnJlbW92ZSgpXG4gICAgICAgIGRlbGV0ZSBAc2VhcmNoRGl2XG4gICAgICAgIEBcbiAgICBcbiAgICByZW1vdmVPYmplY3Q6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiByb3cgPSBAYWN0aXZlUm93KClcbiAgICAgICAgICAgIG5leHRPclByZXYgPSByb3cubmV4dCgpID8gcm93LnByZXYoKVxuICAgICAgICAgICAgQHJlbW92ZVJvdyByb3dcbiAgICAgICAgICAgIG5leHRPclByZXY/LmFjdGl2YXRlKClcbiAgICAgICAgQFxuXG4gICAgcmVtb3ZlUm93OiAocm93KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgcm93ID09IEBhY3RpdmVSb3coKVxuICAgICAgICAgICAgaWYgQG5leHRDb2x1bW4oKT8ucGFyZW50Py5maWxlID09IHJvdy5pdGVtPy5maWxlXG4gICAgICAgICAgICAgICAgIyBrbG9nICdyZW1vdmVSb3cgY2xlYXInXG4gICAgICAgICAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW5zRnJvbSBAaW5kZXggKyAxXG4gICAgICAgICAgICBcbiAgICAgICAgcm93LmRpdi5yZW1vdmUoKVxuICAgICAgICBAaXRlbXMuc3BsaWNlIHJvdy5pbmRleCgpLCAxXG4gICAgICAgIEByb3dzLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBzb3J0QnlOYW1lOiAtPlxuICAgICAgICAgXG4gICAgICAgIEByb3dzLnNvcnQgKGEsYikgLT4gXG4gICAgICAgICAgICAoYS5pdGVtLnR5cGUgKyBhLml0ZW0ubmFtZSkubG9jYWxlQ29tcGFyZShiLml0ZW0udHlwZSArIGIuaXRlbS5uYW1lKVxuICAgICAgICAgICAgXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICBAdGFibGUuYXBwZW5kQ2hpbGQgcm93LmRpdlxuICAgICAgICBAXG4gICAgICAgIFxuICAgIHNvcnRCeVR5cGU6IC0+XG4gICAgICAgIFxuICAgICAgICBAcm93cy5zb3J0IChhLGIpIC0+IFxuICAgICAgICAgICAgYXR5cGUgPSBhLml0ZW0udHlwZSA9PSAnZmlsZScgYW5kIHNsYXNoLmV4dChhLml0ZW0ubmFtZSkgb3IgJ19fXycgI2EuaXRlbS50eXBlXG4gICAgICAgICAgICBidHlwZSA9IGIuaXRlbS50eXBlID09ICdmaWxlJyBhbmQgc2xhc2guZXh0KGIuaXRlbS5uYW1lKSBvciAnX19fJyAjYi5pdGVtLnR5cGVcbiAgICAgICAgICAgIChhLml0ZW0udHlwZSArIGF0eXBlICsgYS5pdGVtLm5hbWUpLmxvY2FsZUNvbXBhcmUoYi5pdGVtLnR5cGUgKyBidHlwZSArIGIuaXRlbS5uYW1lLCB1bmRlZmluZWQsIG51bWVyaWM6dHJ1ZSlcbiAgICAgICAgICAgIFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93c1xuICAgICAgICAgICAgQHRhYmxlLmFwcGVuZENoaWxkIHJvdy5kaXZcbiAgICAgICAgQFxuXG4gICAgc29ydEJ5RGF0ZUFkZGVkOiAtPlxuICAgICAgICBcbiAgICAgICAgQHJvd3Muc29ydCAoYSxiKSAtPiBiLml0ZW0uc3RhdD8uYXRpbWVNcyAtIGEuaXRlbS5zdGF0Py5hdGltZU1zXG4gICAgICAgICAgICBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIEB0YWJsZS5hcHBlbmRDaGlsZCByb3cuZGl2XG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIHRvZ2dsZURvdEZpbGVzOiA9PlxuXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICMgbG9nICdjb2x1bW4udG9nZ2xlRG90RmlsZXMnIEBwYXJlbnRcbiAgICAgICAgICAgIEBwYXJlbnQudHlwZSA9IHNsYXNoLmlzRGlyKEBwYXJlbnQuZmlsZSkgYW5kICdkaXInIG9yICdmaWxlJ1xuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSAnZGlyJyAgICAgICAgICAgIFxuICAgICAgICAgICAgc3RhdGVLZXkgPSBcImJyb3dzZXLilrhzaG93SGlkZGVu4pa4I3tAcGFyZW50LmZpbGV9XCJcbiAgICAgICAgICAgIGlmIHByZWZzLmdldCBzdGF0ZUtleVxuICAgICAgICAgICAgICAgIHByZWZzLmRlbCBzdGF0ZUtleVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHByZWZzLnNldCBzdGF0ZUtleSwgdHJ1ZVxuICAgICAgICAgICAgQGJyb3dzZXIubG9hZERpckl0ZW0gQHBhcmVudCwgQGluZGV4LCBpZ25vcmVDYWNoZTp0cnVlXG4gICAgICAgIEBcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgbW92ZVRvVHJhc2g6ID0+XG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IEBicm93c2VyLnNlbGVjdC5mcmVlSW5kZXgoKVxuICAgICAgICBpZiBpbmRleCA+PSAwXG4gICAgICAgICAgICBzZWxlY3RSb3cgPSBAcm93IGluZGV4XG4gICAgICAgIFxuICAgICAgICBmb3Igcm93IGluIEBicm93c2VyLnNlbGVjdC5yb3dzXG4gICAgICAgICAgICB3eHcgJ3RyYXNoJyByb3cucGF0aCgpXG4gICAgICAgICAgICBAcmVtb3ZlUm93IHJvd1xuICAgICAgICAgICBcbiAgICAgICAgaWYgc2VsZWN0Um93XG4gICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IHNlbGVjdFJvd1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbmF2aWdhdGVDb2xzICdsZWZ0J1xuXG4gICAgYWRkVG9TaGVsZjogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHBhdGhUb1NoZWxmID0gQGFjdGl2ZVBhdGgoKVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdhZGRUb1NoZWxmJyBwYXRoVG9TaGVsZlxuXG4gICAgIyAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgdmlld0ltYWdlczogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBhY3RpdmVSb3coKT8uaXRlbS5uYW1lICE9ICcuLicgYW5kIHNsYXNoLmlzRGlyIEBhY3RpdmVQYXRoKClcbiAgICAgICAgICAgIGltZ0RpciA9IEBhY3RpdmVQYXRoKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaW1nRGlyID0gQHBhdGgoKVxuICAgICAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnZpZXdlciA9IG5ldyBWaWV3ZXIgaW1nRGlyXG4gICAgICAgIFxuICAgIG5ld0ZvbGRlcjogPT5cbiAgICAgICAgXG4gICAgICAgIHVudXNlZCA9IHJlcXVpcmUgJ3VudXNlZC1maWxlbmFtZSdcbiAgICAgICAgdW51c2VkKHNsYXNoLmpvaW4gQHBhdGgoKSwgJ05ldyBmb2xkZXInKS50aGVuIChuZXdEaXIpID0+XG4gICAgICAgICAgICBmcy5ta2RpciBuZXdEaXIsIChlcnIpID0+XG4gICAgICAgICAgICAgICAgaWYgZW1wdHkgZXJyXG4gICAgICAgICAgICAgICAgICAgIHJvdyA9IEBpbnNlcnRGaWxlIG5ld0RpclxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IHJvd1xuICAgICAgICAgICAgICAgICAgICByb3cuZWRpdE5hbWUoKVxuICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBkdXBsaWNhdGVGaWxlOiA9PlxuICAgICAgICBcbiAgICAgICAgdW51c2VkID0gcmVxdWlyZSAndW51c2VkLWZpbGVuYW1lJ1xuICAgICAgICBcbiAgICAgICAgZm9yIGZpbGUgaW4gQGJyb3dzZXIuc2VsZWN0LmZpbGVzKClcbiAgICAgICAgXG4gICAgICAgICAgICB1bnVzZWQoZmlsZSkudGhlbiAoZmlsZU5hbWUpID0+XG4gICAgICAgICAgICAgICAgZmlsZU5hbWUgPSBzbGFzaC5wYXRoIGZpbGVOYW1lXG4gICAgICAgICAgICAgICAgZnMuY29weUZpbGUgZmlsZSwgZmlsZU5hbWUsIChlcnIpID0+XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnJvciAnY29weSBmaWxlIGZhaWxlZCcgZXJyIGlmIGVycj9cbiAgICAgICAgICAgICAgICAgICAgIyBuZXdGaWxlID0gc2xhc2guam9pbiBzbGFzaC5kaXIoQGFjdGl2ZVBhdGgoKSksIGZpbGVOYW1lXG4gICAgICAgICAgICAgICAgICAgIGtsb2cgJ2ZpbGVOYW1lJyBmaWxlTmFtZVxuICAgICAgICAgICAgICAgICAgICByb3cgPSBAaW5zZXJ0RmlsZSBmaWxlTmFtZVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IHJvd1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgZXhwbG9yZXI6ID0+XG4gICAgICAgIFxuICAgICAgICBvcGVuIHNsYXNoLmRpciBAYWN0aXZlUGF0aCgpXG4gICAgICAgIFxuICAgIG9wZW46ID0+XG4gICAgICAgIFxuICAgICAgICBvcGVuIEBhY3RpdmVQYXRoKClcbiAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICBcbiAgICAgICAgXG4gICAgbWFrZVJvb3Q6ID0+IFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuc2hpZnRDb2x1bW5zVG8gQGluZGV4XG4gICAgICAgIFxuICAgICAgICBpZiBAYnJvd3Nlci5jb2x1bW5zWzBdLml0ZW1zWzBdLm5hbWUgIT0gJy4uJ1xuICAgICAgICAgICAgQHVuc2hpZnRJdGVtIFxuICAgICAgICAgICAgICAgIG5hbWU6ICcuLidcbiAgICAgICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgICAgIGZpbGU6IHNsYXNoLmRpciBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGNydW1iLnNldEZpbGUgQHBhcmVudC5maWxlXG4gICAgXG4gICAgb25Db250ZXh0TWVudTogKGV2ZW50LCBjb2x1bW4pID0+IFxuICAgICAgICBcbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgIFxuICAgICAgICBhYnNQb3MgPSBrcG9zIGV2ZW50XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgY29sdW1uXG4gICAgICAgICAgICBAc2hvd0NvbnRleHRNZW51IGFic1Bvc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG9wdCA9IGl0ZW1zOiBbIFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgJ1Jvb3QnXG4gICAgICAgICAgICAgICAgY2I6ICAgICBAbWFrZVJvb3RcbiAgICAgICAgICAgICxcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICdBZGQgdG8gU2hlbGYnXG4gICAgICAgICAgICAgICAgY29tYm86ICAnYWx0K3NoaWZ0Ky4nXG4gICAgICAgICAgICAgICAgY2I6ICAgICA9PiBwb3N0LmVtaXQgJ2FkZFRvU2hlbGYnIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgLFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgJ0V4cGxvcmVyJ1xuICAgICAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtlJyBcbiAgICAgICAgICAgICAgICBjYjogICAgID0+IG9wZW4gQHBhcmVudC5maWxlXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgICAgIHBvcHVwLm1lbnUgb3B0ICAgIFxuICAgICAgICAgICAgICBcbiAgICBzaG93Q29udGV4dE1lbnU6IChhYnNQb3MpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgYWJzUG9zP1xuICAgICAgICAgICAgYWJzUG9zID0ga3BvcyBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQsIEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgIFxuICAgICAgICBvcHQgPSBpdGVtczogWyBcbiAgICAgICAgICAgIHRleHQ6ICAgJ1RvZ2dsZSBJbnZpc2libGUnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2knIFxuICAgICAgICAgICAgY2I6ICAgICBAdG9nZ2xlRG90RmlsZXNcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnUmVmcmVzaCdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrcicgXG4gICAgICAgICAgICBjYjogICAgIEBicm93c2VyLnJlZnJlc2hcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnRHVwbGljYXRlJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtkJyBcbiAgICAgICAgICAgIGNiOiAgICAgQGR1cGxpY2F0ZUZpbGVcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnTW92ZSB0byBUcmFzaCdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrYmFja3NwYWNlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQG1vdmVUb1RyYXNoXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0FkZCB0byBTaGVsZidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtzaGlmdCsuJ1xuICAgICAgICAgICAgY2I6ICAgICBAYWRkVG9TaGVsZlxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdOZXcgRm9sZGVyJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K24nIFxuICAgICAgICAgICAgY2I6ICAgICBAbmV3Rm9sZGVyXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ1ZpZXcgSW1hZ2VzJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K3YnIFxuICAgICAgICAgICAgY2I6ICAgICBAdmlld0ltYWdlc1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdFeHBsb3JlcidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQGV4cGxvcmVyXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ09wZW4nXG4gICAgICAgICAgICBjb21ibzogICdhbHQrbycgXG4gICAgICAgICAgICBjYjogICAgIEBvcGVuXG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIG9wdC5pdGVtcyA9IG9wdC5pdGVtcy5jb25jYXQgd2luZG93LnRpdGxlYmFyLm1ha2VUZW1wbGF0ZSByZXF1aXJlICcuL21lbnUuanNvbidcbiAgICAgICAgXG4gICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICBwb3B1cC5tZW51IG9wdCAgICAgICAgXG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgb25LZXk6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG5cbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdzaGlmdCtgJyAnficgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5icm93c2UgJ34nXG4gICAgICAgICAgICB3aGVuICcvJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5icm93c2UgJy8nXG4gICAgICAgICAgICB3aGVuICdhbHQrZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQGV4cGxvcmVyKClcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtvJyAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAb3BlbigpXG4gICAgICAgICAgICB3aGVuICdhbHQrbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQG5ld0ZvbGRlcigpXG4gICAgICAgICAgICB3aGVuICdzcGFjZScgJ2FsdCt2JyAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQHZpZXdJbWFnZXMoKVxuICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcgJ3BhZ2UgZG93bicgJ2hvbWUnICdlbmQnIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrdXAnICdjdHJsK3VwJyAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3MgJ2hvbWUnXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2Rvd24nICdjdHJsK2Rvd24nICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzICdlbmQnXG4gICAgICAgICAgICB3aGVuICdlbnRlcicnYWx0K3VwJyAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVDb2xzIGtleVxuICAgICAgICAgICAgd2hlbiAnYmFja3NwYWNlJyAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIub25CYWNrc3BhY2VJbkNvbHVtbiBAXG4gICAgICAgICAgICB3aGVuICdkZWxldGUnICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5vbkRlbGV0ZUluQ29sdW1uIEBcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrdCcgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBzb3J0QnlUeXBlKClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrbicgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBzb3J0QnlOYW1lKClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrYScgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBzb3J0QnlEYXRlQWRkZWQoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtpJyAnY3RybCtpJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHRvZ2dsZURvdEZpbGVzKClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZCcgJ2N0cmwrZCcgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBkdXBsaWNhdGVGaWxlKClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQraycgJ2N0cmwraycgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQgaWYgQGJyb3dzZXIuY2xlYW5VcCgpXG4gICAgICAgICAgICB3aGVuICdmMicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYWN0aXZlUm93KCk/LmVkaXROYW1lKClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrbGVmdCcgJ2NvbW1hbmQrcmlnaHQnICdjdHJsK2xlZnQnICdjdHJsK3JpZ2h0J1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvb3Qga2V5XG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2JhY2tzcGFjZScgJ2N0cmwrYmFja3NwYWNlJyAnY29tbWFuZCtkZWxldGUnICdjdHJsK2RlbGV0ZScgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG1vdmVUb1RyYXNoKClcbiAgICAgICAgICAgIHdoZW4gJ3RhYicgICAgXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAZG9TZWFyY2ggJydcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgICAgICAgICAgQGRyYWdEaXYuZHJhZy5kcmFnU3RvcCgpXG4gICAgICAgICAgICAgICAgICAgIEBkcmFnRGl2LnJlbW92ZSgpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBAZHJhZ0RpdlxuICAgICAgICAgICAgICAgIGVsc2UgaWYgQGJyb3dzZXIuc2VsZWN0LmZpbGVzKCkubGVuZ3RoID4gMVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5zZWxlY3Qucm93IEBhY3RpdmVSb3coKVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAY2xlYXJTZWFyY2goKVxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnRcblxuICAgICAgICBpZiBjb21ibyBpbiBbJ3VwJyAgICdkb3duJ10gIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyBrZXkgICAgICAgICAgICAgIFxuICAgICAgICBpZiBjb21ibyBpbiBbJ2xlZnQnICdyaWdodCddIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlQ29scyBrZXlcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBtb2QgaW4gWydzaGlmdCcgJyddIGFuZCBjaGFyIHRoZW4gQGRvU2VhcmNoIGNoYXJcbiAgICAgICAgICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQ29sdW1uXG5cblxuIl19
//# sourceURL=../coffee/column.coffee