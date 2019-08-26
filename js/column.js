// koffee 1.4.0

/*
 0000000   0000000   000      000   000  00     00  000   000
000       000   000  000      000   000  000   000  0000  000
000       000   000  000      000   000  000000000  000 0 000
000       000   000  000      000   000  000 0 000  000  0000
 0000000   0000000   0000000   0000000   000   000  000   000
 */
var $, Column, Row, Scroller, _, clamp, elem, empty, fs, fuzzy, kerror, keyinfo, klog, kpos, open, popup, post, prefs, ref, setStyle, slash, state, stopEvent, trash, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, prefs = ref.prefs, stopEvent = ref.stopEvent, setStyle = ref.setStyle, keyinfo = ref.keyinfo, popup = ref.popup, slash = ref.slash, valid = ref.valid, clamp = ref.clamp, empty = ref.empty, state = ref.state, open = ref.open, elem = ref.elem, kpos = ref.kpos, fs = ref.fs, klog = ref.klog, kerror = ref.kerror, $ = ref.$, _ = ref._;

Row = require('./row');

Scroller = require('./scroller');

fuzzy = require('fuzzy');

trash = require('trash');

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
        this.addToShelf = bind(this.addToShelf, this);
        this.moveToTrash = bind(this.moveToTrash, this);
        this.toggleDotFiles = bind(this.toggleDotFiles, this);
        this.removeObject = bind(this.removeObject, this);
        this.clearSearch = bind(this.clearSearch, this);
        this.updateCrumb = bind(this.updateCrumb, this);
        this.onDblClick = bind(this.onDblClick, this);
        this.onClick = bind(this.onClick, this);
        this.onMouseOut = bind(this.onMouseOut, this);
        this.onMouseOver = bind(this.onMouseOver, this);
        this.onBlur = bind(this.onBlur, this);
        this.onFocus = bind(this.onFocus, this);
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
        this.crumb = elem({
            "class": 'crumb'
        });
        this.crumb.columnIndex = this.index;
        this.crumb.addEventListener('dblclick', this.makeRoot);
        this.setIndex((ref1 = this.browser.columns) != null ? ref1.length : void 0);
        $('crumbs').appendChild(this.crumb);
        if ((ref2 = this.browser.cols) != null) {
            ref2.appendChild(this.div);
        }
        this.div.addEventListener('focus', this.onFocus);
        this.div.addEventListener('blur', this.onBlur);
        this.div.addEventListener('keydown', this.onKey);
        this.div.addEventListener('mouseover', this.onMouseOver);
        this.div.addEventListener('mouseout', this.onMouseOut);
        this.div.addEventListener('mouseup', this.onClick);
        this.div.addEventListener('dblclick', this.onDblClick);
        this.div.addEventListener('contextmenu', this.onContextMenu);
        this.scroll = new Scroller(this);
    }

    Column.prototype.setIndex = function(index1) {
        this.index = index1;
        return this.crumb.columnIndex = this.index;
    };

    Column.prototype.dropRow = function(row, pos) {
        var item, targetRow;
        if (targetRow = this.rowAtPos(pos)) {
            item = targetRow.item;
            if (item.type === 'dir') {
                return row.rename(slash.join(item.file, row.item.name));
            } else {
                return row.rename(slash.join(slash.dir(item.file), row.item.name));
            }
        } else {
            return row.rename(slash.join(this.parent.file, row.item.name));
        }
    };

    Column.prototype.loadItems = function(items, parent) {
        var i, item, len, ref1;
        this.browser.clearColumn(this.index);
        this.items = items;
        this.parent = parent;
        this.crumb.innerHTML = slash.base(this.parent.file);
        if (this.parent.type === void 0) {
            console.log('column.loadItems', String(this.parent));
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
        return this.parent.type === 'dir';
    };

    Column.prototype.isFile = function() {
        return this.parent.type === 'file';
    };

    Column.prototype.isEmpty = function() {
        return empty(this.rows);
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
        this.crumb.innerHTML = '';
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
                return r.item.name === row;
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

    Column.prototype.onClick = function(event) {
        var ref1;
        return (ref1 = this.row(event.target)) != null ? ref1.activate(event) : void 0;
    };

    Column.prototype.onDblClick = function(event) {
        return this.navigateCols('enter');
    };

    Column.prototype.updateCrumb = function() {
        var br, width;
        br = this.div.getBoundingClientRect();
        this.crumb.style.left = br.left + "px";
        if (this.index === this.browser.numCols() - 1) {
            width = br.right - br.left - 135;
            this.crumb.style.width = width + "px";
            if (width < 50) {
                return this.crumb.style.display = 'none';
            } else {
                return this.crumb.style.display = null;
            }
        } else {
            return this.crumb.style.width = (br.right - br.left) + "px";
        }
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
        if (index < 0 || index >= this.numRows()) {
            return;
        }
        if ((index == null) || Number.isNaN(index)) {
            console.error("no index " + index + "? " + (this.numVisible()));
        }
        index = clamp(0, this.numRows() - 1, index);
        if (((ref3 = this.rows[index]) != null ? ref3.activate : void 0) == null) {
            console.error("no row at index " + index + "/" + (this.numRows() - 1) + "?", this.numRows());
        }
        return this.rows[index].activate();
    };

    Column.prototype.navigateCols = function(key) {
        var item, ref1, type;
        switch (key) {
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
                        post.emit('filebrowser', 'loadItem', item, {
                            focus: true
                        });
                    } else if (item.file) {
                        post.emit('openFile', item.file);
                    }
                }
        }
        return this;
    };

    Column.prototype.navigateRoot = function(key) {
        if (this.browser.browse == null) {
            return;
        }
        this.browser.browse((function() {
            switch (key) {
                case 'left':
                    return slash.dir(this.parent.file);
                case 'up':
                    return this.parent.file;
                case 'right':
                    return this.activeRow().item.file;
                case 'down':
                    return slash.pkg(this.parent.file);
                case '~':
                    return '~';
                case '/':
                    return '/';
            }
        }).call(this));
        return this;
    };

    Column.prototype.doSearch = function(char) {
        var activeIndex, fuzzied, i, len, ref1, ref2, ref3, row, rows;
        if (!this.numRows()) {
            return;
        }
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(this.clearSearch, 2000);
        this.search += char;
        if (!this.searchDiv) {
            this.searchDiv = elem({
                "class": 'browserSearch'
            });
        }
        this.searchDiv.textContent = this.search;
        activeIndex = (ref1 = (ref2 = this.activeRow()) != null ? ref2.index() : void 0) != null ? ref1 : 0;
        if ((this.search.length === 1) || (char === '')) {
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
            this.browser.emit('willRemoveRow', row, this);
            nextOrPrev = (ref1 = row.next()) != null ? ref1 : row.prev();
            this.removeRow(row);
            if (nextOrPrev != null) {
                nextOrPrev.activate();
            }
        }
        return this;
    };

    Column.prototype.removeRow = function(row) {
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

    Column.prototype.toggleDotFiles = function() {
        var stateKey;
        if (this.parent.type === void 0) {
            console.log('column.toggleDotFiles', this.parent);
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
        var pathToTrash;
        pathToTrash = this.activePath();
        this.removeObject();
        return trash([pathToTrash])["catch"](function(err) {
            return console.error("failed to trash " + pathToTrash + " " + err);
        });
    };

    Column.prototype.addToShelf = function() {
        var pathToShelf;
        if (pathToShelf = this.activePath()) {
            return post.emit('addToShelf', pathToShelf);
        }
    };

    Column.prototype.duplicateFile = function() {
        var unusedFilename;
        unusedFilename = require('unused-filename');
        return unusedFilename(this.activePath()).then((function(_this) {
            return function(fileName) {
                fileName = slash.path(fileName);
                if (fs.copy != null) {
                    return fs.copy(_this.activePath(), fileName, function(err) {
                        var item;
                        if (err != null) {
                            return console.error('copy file failed', err);
                        }
                        item = {
                            type: 'file',
                            file: slash.join(slash.dir(_this.activePath()), fileName)
                        };
                        return post.emit('filebrowser', 'loadItem', item, {
                            focus: true
                        });
                    });
                }
            };
        })(this));
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
            return this.unshiftItem({
                name: '..',
                type: 'dir',
                file: slash.dir(this.parent.file)
            });
        }
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
        var char, combo, key, mod, ref1, ref2, ref3;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo, char = ref1.char;
        switch (combo) {
            case 'shift+`':
                return stopEvent(event, this.browser.loadDir(slash.resolve('~')));
            case '/':
                return stopEvent(event, this.browser.loadDir('/'));
            case 'alt+e':
                return this.explorer();
            case 'alt+o':
                return this.open();
            case 'page up':
            case 'page down':
            case 'home':
            case 'end':
                return stopEvent(event, this.navigateRows(key));
            case 'enter':
                return stopEvent(event, this.navigateCols(key));
            case 'command+left':
            case 'command+up':
            case 'command+right':
            case 'command+down':
            case 'ctrl+left':
            case 'ctrl+up':
            case 'ctrl+right':
            case 'ctrl+down':
                return stopEvent(event, this.navigateRoot(key));
            case 'command+backspace':
            case 'ctrl+backspace':
            case 'command+delete':
            case 'ctrl+delete':
                return stopEvent(event, this.moveToTrash());
            case 'alt+left':
                return stopEvent(event, (ref2 = $('shelf')) != null ? typeof ref2.focus === "function" ? ref2.focus() : void 0 : void 0);
            case 'alt+shift+left':
                return stopEvent(event, this.browser.toggleShelf());
            case 'backspace':
            case 'delete':
                return stopEvent(event, this.browser.onBackspaceInColumn(this));
            case 'ctrl+t':
                return stopEvent(event, this.sortByType());
            case 'ctrl+n':
                return stopEvent(event, this.sortByName());
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
                return stopEvent(event, (ref3 = this.activeRow()) != null ? ref3.editName() : void 0);
            case 'tab':
                if (this.search.length) {
                    this.doSearch('');
                }
                return stopEvent(event);
            case 'esc':
                if (this.search.length) {
                    this.clearSearch();
                }
                return stopEvent(event);
        }
        if (key === 'up' || key === 'down') {
            return stopEvent(event, this.navigateRows(key));
        }
        if (key === 'left' || key === 'right') {
            return stopEvent(event, this.navigateCols(key));
        }
        switch (char) {
            case '~':
            case '/':
                return stopEvent(event, this.navigateRoot(char));
        }
        if ((mod === 'shift' || mod === '') && char) {
            return this.doSearch(char);
        }
    };

    return Column;

})();

module.exports = Column;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sdW1uLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx1S0FBQTtJQUFBOztBQVFBLE1BQW9JLE9BQUEsQ0FBUSxLQUFSLENBQXBJLEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUseUJBQWYsRUFBMEIsdUJBQTFCLEVBQW9DLHFCQUFwQyxFQUE2QyxpQkFBN0MsRUFBb0QsaUJBQXBELEVBQTJELGlCQUEzRCxFQUFrRSxpQkFBbEUsRUFBeUUsaUJBQXpFLEVBQWdGLGlCQUFoRixFQUF1RixlQUF2RixFQUE2RixlQUE3RixFQUFtRyxlQUFuRyxFQUF5RyxXQUF6RyxFQUE2RyxlQUE3RyxFQUFtSCxtQkFBbkgsRUFBMkgsU0FBM0gsRUFBOEg7O0FBRTlILEdBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFFTDtJQUVXLGdCQUFDLE9BQUQ7QUFFVCxZQUFBO1FBRlUsSUFBQyxDQUFBLFVBQUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBRVYsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUNmLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUVWLElBQUMsQ0FBQSxHQUFELEdBQVMsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxlQUFQO1lBQXVCLFFBQUEsRUFBUyxDQUFoQztTQUFMO1FBQ1QsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG9CQUFQO1NBQUw7UUFDVCxJQUFDLENBQUEsR0FBRyxDQUFDLFdBQUwsQ0FBaUIsSUFBQyxDQUFBLEtBQWxCO1FBRUEsSUFB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QSxDQUFVLEtBQVYsMENBQTZCLENBQUUsUUFBZCxDQUFBLFVBQWpCO0FBbkIzQyxpQkFvQlMsS0FwQlQ7Z0JBcUJRLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFYO29CQUF1QixJQUFDLENBQUEsUUFBRCxDQUFVLEVBQVYsRUFBdkI7O0FBQ0EsdUJBQU8sU0FBQSxDQUFVLEtBQVY7QUF0QmYsaUJBdUJTLEtBdkJUO2dCQXdCUSxJQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBWDtvQkFBdUIsSUFBQyxDQUFBLFdBQUQsQ0FBQSxFQUF2Qjs7QUFDQSx1QkFBTyxTQUFBLENBQVUsS0FBVjtBQXpCZjtRQTJCQSxJQUFHLEdBQUEsS0FBUSxJQUFSLElBQUEsR0FBQSxLQUFlLE1BQWxCO0FBQWdDLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxZQUFELENBQWMsR0FBZCxDQUFqQixFQUF2Qzs7UUFDQSxJQUFHLEdBQUEsS0FBUSxNQUFSLElBQUEsR0FBQSxLQUFlLE9BQWxCO0FBQWdDLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxZQUFELENBQWMsR0FBZCxDQUFqQixFQUF2Qzs7QUFFQSxnQkFBTyxJQUFQO0FBQUEsaUJBQ1MsR0FEVDtBQUFBLGlCQUNhLEdBRGI7QUFDc0IsdUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFlBQUQsQ0FBYyxJQUFkLENBQWpCO0FBRDdCO1FBR0EsSUFBRyxDQUFBLEdBQUEsS0FBUSxPQUFSLElBQUEsR0FBQSxLQUFnQixFQUFoQixDQUFBLElBQXdCLElBQTNCO21CQUFxQyxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsRUFBckM7O0lBckNHOzs7Ozs7QUF1Q1gsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIHByZWZzLCBzdG9wRXZlbnQsIHNldFN0eWxlLCBrZXlpbmZvLCBwb3B1cCwgc2xhc2gsIHZhbGlkLCBjbGFtcCwgZW1wdHksIHN0YXRlLCBvcGVuLCBlbGVtLCBrcG9zLCBmcywga2xvZywga2Vycm9yLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cblJvdyAgICAgID0gcmVxdWlyZSAnLi9yb3cnXG5TY3JvbGxlciA9IHJlcXVpcmUgJy4vc2Nyb2xsZXInXG5mdXp6eSAgICA9IHJlcXVpcmUgJ2Z1enp5J1xudHJhc2ggICAgPSByZXF1aXJlICd0cmFzaCdcblxuY2xhc3MgQ29sdW1uXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAYnJvd3NlcikgLT5cbiAgICAgICAgXG4gICAgICAgIEBzZWFyY2hUaW1lciA9IG51bGxcbiAgICAgICAgQHNlYXJjaCA9ICcnXG4gICAgICAgIEBpdGVtcyAgPSBbXVxuICAgICAgICBAcm93cyAgID0gW11cbiAgICAgICAgXG4gICAgICAgIEBkaXYgICA9IGVsZW0gY2xhc3M6ICdicm93c2VyQ29sdW1uJyB0YWJJbmRleDo2XG4gICAgICAgIEB0YWJsZSA9IGVsZW0gY2xhc3M6ICdicm93c2VyQ29sdW1uVGFibGUnXG4gICAgICAgIEBkaXYuYXBwZW5kQ2hpbGQgQHRhYmxlXG4gICAgICAgIFxuICAgICAgICBAY3J1bWIgPSBlbGVtIGNsYXNzOidjcnVtYidcbiAgICAgICAgQGNydW1iLmNvbHVtbkluZGV4ID0gQGluZGV4XG4gICAgICAgIEBjcnVtYi5hZGRFdmVudExpc3RlbmVyICdkYmxjbGljaycgQG1ha2VSb290XG4gICAgICAgIFxuICAgICAgICBAc2V0SW5kZXggQGJyb3dzZXIuY29sdW1ucz8ubGVuZ3RoXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICQoJ2NydW1icycpLmFwcGVuZENoaWxkIEBjcnVtYlxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY29scz8uYXBwZW5kQ2hpbGQgQGRpdlxuICAgICAgICBcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdmb2N1cycgICAgIEBvbkZvY3VzXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnYmx1cicgICAgICBAb25CbHVyXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgICBAb25LZXlcbiAgICAgICAgXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2VvdmVyJyBAb25Nb3VzZU92ZXJcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdtb3VzZW91dCcgIEBvbk1vdXNlT3V0XG5cbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdtb3VzZXVwJyAgIEBvbkNsaWNrXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnZGJsY2xpY2snICBAb25EYmxDbGlja1xuICAgICAgICBcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdjb250ZXh0bWVudScgQG9uQ29udGV4dE1lbnVcbiAgICAgICAgXG4gICAgICAgIEBzY3JvbGwgPSBuZXcgU2Nyb2xsZXIgQFxuICAgICAgICBcbiAgICBzZXRJbmRleDogKEBpbmRleCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjcnVtYi5jb2x1bW5JbmRleCA9IEBpbmRleFxuICAgICAgICBcbiAgICBkcm9wUm93OiAocm93LCBwb3MpIC0+IFxuICAgIFxuICAgICAgICAjIGtsb2cgJ2Ryb3AnIHJvdy5pdGVtLCBAcm93QXRQb3MocG9zKT8uaXRlbSwgQHBhcmVudC5maWxlXG4gICAgICAgIFxuICAgICAgICBpZiB0YXJnZXRSb3cgPSBAcm93QXRQb3MgcG9zXG4gICAgICAgICAgICBpdGVtID0gdGFyZ2V0Um93Lml0ZW1cbiAgICAgICAgICAgIGlmIGl0ZW0udHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgIHJvdy5yZW5hbWUgc2xhc2guam9pbiBpdGVtLmZpbGUsIHJvdy5pdGVtLm5hbWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByb3cucmVuYW1lIHNsYXNoLmpvaW4gc2xhc2guZGlyKGl0ZW0uZmlsZSksIHJvdy5pdGVtLm5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcm93LnJlbmFtZSBzbGFzaC5qb2luIEBwYXJlbnQuZmlsZSwgcm93Lml0ZW0ubmFtZVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgbG9hZEl0ZW1zOiAoaXRlbXMsIHBhcmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmNsZWFyQ29sdW1uIEBpbmRleFxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zICA9IGl0ZW1zXG4gICAgICAgIEBwYXJlbnQgPSBwYXJlbnRcbiAgICAgICAgXG4gICAgICAgIEBjcnVtYi5pbm5lckhUTUwgPSBzbGFzaC5iYXNlIEBwYXJlbnQuZmlsZVxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09IHVuZGVmaW5lZFxuICAgICAgICAgICAgbG9nICdjb2x1bW4ubG9hZEl0ZW1zJyBTdHJpbmcgQHBhcmVudFxuICAgICAgICAgICAgQHBhcmVudC50eXBlID0gc2xhc2guaXNEaXIoQHBhcmVudC5maWxlKSBhbmQgJ2Rpcicgb3IgJ2ZpbGUnXG4gICAgICAgIFxuICAgICAgICBrZXJyb3IgXCJubyBwYXJlbnQgaXRlbT9cIiBpZiBub3QgQHBhcmVudD9cbiAgICAgICAga2Vycm9yIFwibG9hZEl0ZW1zIC0tIG5vIHBhcmVudCB0eXBlP1wiLCBAcGFyZW50IGlmIG5vdCBAcGFyZW50LnR5cGU/XG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAaXRlbXNcbiAgICAgICAgICAgIGZvciBpdGVtIGluIEBpdGVtc1xuICAgICAgICAgICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIFxuICAgICAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgIHVuc2hpZnRJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBpdGVtcy51bnNoaWZ0IGl0ZW1cbiAgICAgICAgQHJvd3MudW5zaGlmdCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgQHRhYmxlLmluc2VydEJlZm9yZSBAdGFibGUubGFzdENoaWxkLCBAdGFibGUuZmlyc3RDaGlsZFxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgIEByb3dzWzBdXG4gICAgICAgIFxuICAgIHB1c2hJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBpdGVtcy5wdXNoIGl0ZW1cbiAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAcm93c1stMV1cbiAgICAgICAgXG4gICAgYWRkSXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIFxuICAgICAgICByb3cgPSBAcHVzaEl0ZW0gaXRlbVxuICAgICAgICBAc29ydEJ5TmFtZSgpXG4gICAgICAgIHJvd1xuXG4gICAgc2V0SXRlbXM6IChAaXRlbXMsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmNsZWFyQ29sdW1uIEBpbmRleFxuICAgICAgICBcbiAgICAgICAgQHBhcmVudCA9IG9wdC5wYXJlbnRcbiAgICAgICAga2Vycm9yIFwibm8gcGFyZW50IGl0ZW0/XCIgaWYgbm90IEBwYXJlbnQ/XG4gICAgICAgIGtlcnJvciBcInNldEl0ZW1zIC0tIG5vIHBhcmVudCB0eXBlP1wiLCBAcGFyZW50IGlmIG5vdCBAcGFyZW50LnR5cGU/XG4gICAgICAgIFxuICAgICAgICBmb3IgaXRlbSBpbiBAaXRlbXNcbiAgICAgICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIFxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgIEBcblxuICAgIGlzRGlyOiAgLT4gQHBhcmVudC50eXBlID09ICdkaXInIFxuICAgIGlzRmlsZTogLT4gQHBhcmVudC50eXBlID09ICdmaWxlJyBcbiAgICAgICAgXG4gICAgaXNFbXB0eTogLT4gZW1wdHkgQHJvd3NcbiAgICBjbGVhcjogICAtPlxuICAgICAgICBAY2xlYXJTZWFyY2goKVxuICAgICAgICBkZWxldGUgQHBhcmVudFxuICAgICAgICBAZGl2LnNjcm9sbFRvcCA9IDBcbiAgICAgICAgQGVkaXRvcj8uZGVsKClcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIEBjcnVtYi5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBAcm93cyA9IFtdXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAwMDAwMCAgXG4gICBcbiAgICBhY3RpdmF0ZVJvdzogIChyb3cpIC0+IEByb3cocm93KT8uYWN0aXZhdGUoKVxuICAgICAgIFxuICAgIGFjdGl2ZVJvdzogLT4gXy5maW5kIEByb3dzLCAocikgLT4gci5pc0FjdGl2ZSgpXG4gICAgYWN0aXZlUGF0aDogLT4gQGFjdGl2ZVJvdygpPy5wYXRoKClcbiAgICBcbiAgICByb3c6IChyb3cpIC0+ICMgYWNjZXB0cyBlbGVtZW50LCBpbmRleCwgc3RyaW5nIG9yIHJvd1xuICAgICAgICBpZiAgICAgIF8uaXNOdW1iZXIgIHJvdyB0aGVuIHJldHVybiAwIDw9IHJvdyA8IEBudW1Sb3dzKCkgYW5kIEByb3dzW3Jvd10gb3IgbnVsbFxuICAgICAgICBlbHNlIGlmIF8uaXNFbGVtZW50IHJvdyB0aGVuIHJldHVybiBfLmZpbmQgQHJvd3MsIChyKSAtPiByLmRpdi5jb250YWlucyByb3dcbiAgICAgICAgZWxzZSBpZiBfLmlzU3RyaW5nICByb3cgdGhlbiByZXR1cm4gXy5maW5kIEByb3dzLCAocikgLT4gci5pdGVtLm5hbWUgPT0gcm93XG4gICAgICAgIGVsc2UgcmV0dXJuIHJvd1xuICAgICAgICAgICAgXG4gICAgbmV4dENvbHVtbjogLT4gQGJyb3dzZXIuY29sdW1uIEBpbmRleCsxXG4gICAgcHJldkNvbHVtbjogLT4gQGJyb3dzZXIuY29sdW1uIEBpbmRleC0xXG4gICAgICAgIFxuICAgIG5hbWU6IC0+IFwiI3tAYnJvd3Nlci5uYW1lfToje0BpbmRleH1cIlxuICAgIHBhdGg6IC0+IEBwYXJlbnQ/LmZpbGUgPyAnJ1xuICAgICAgICBcbiAgICBudW1Sb3dzOiAgICAtPiBAcm93cy5sZW5ndGggPyAwICAgXG4gICAgcm93SGVpZ2h0OiAgLT4gQHJvd3NbMF0/LmRpdi5jbGllbnRIZWlnaHQgPyAwXG4gICAgbnVtVmlzaWJsZTogLT4gQHJvd0hlaWdodCgpIGFuZCBwYXJzZUludChAYnJvd3Nlci5oZWlnaHQoKSAvIEByb3dIZWlnaHQoKSkgb3IgMFxuICAgIFxuICAgIHJvd0F0UG9zOiAocG9zKSAtPiBAcm93IEByb3dJbmRleEF0UG9zIHBvc1xuICAgIFxuICAgIHJvd0luZGV4QXRQb3M6IChwb3MpIC0+XG4gICAgICAgIFxuICAgICAgICBNYXRoLm1heCAwLCBNYXRoLmZsb29yIChwb3MueSAtIEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wKSAvIEByb3dIZWlnaHQoKVxuICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGhhc0ZvY3VzOiAtPiBAZGl2LmNsYXNzTGlzdC5jb250YWlucyAnZm9jdXMnXG5cbiAgICBmb2N1czogKG9wdD17fSkgLT5cbiAgICAgICAgaWYgbm90IEBhY3RpdmVSb3coKSBhbmQgQG51bVJvd3MoKSBhbmQgb3B0Py5hY3RpdmF0ZSAhPSBmYWxzZVxuICAgICAgICAgICAgQHJvd3NbMF0uc2V0QWN0aXZlKClcbiAgICAgICAgQGRpdi5mb2N1cygpXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgb25Gb2N1czogPT4gQGRpdi5jbGFzc0xpc3QuYWRkICdmb2N1cydcbiAgICBvbkJsdXI6ICA9PiBAZGl2LmNsYXNzTGlzdC5yZW1vdmUgJ2ZvY3VzJ1xuXG4gICAgZm9jdXNCcm93c2VyOiAtPiBAYnJvd3Nlci5mb2N1cygpXG4gICAgXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBvbk1vdXNlT3ZlcjogKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdmVyKClcbiAgICBvbk1vdXNlT3V0OiAgKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdXQoKVxuICAgIG9uQ2xpY2s6ICAgICAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8uYWN0aXZhdGUgZXZlbnRcbiAgICBvbkRibENsaWNrOiAgKGV2ZW50KSA9PiBAbmF2aWdhdGVDb2xzICdlbnRlcidcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICB1cGRhdGVDcnVtYjogPT5cbiAgICAgICAgXG4gICAgICAgIGJyID0gQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICBAY3J1bWIuc3R5bGUubGVmdCA9IFwiI3tici5sZWZ0fXB4XCJcbiAgICAgICAgaWYgQGluZGV4ID09IEBicm93c2VyLm51bUNvbHMoKS0xXG4gICAgICAgICAgICB3aWR0aCA9IGJyLnJpZ2h0IC0gYnIubGVmdCAtIDEzNVxuICAgICAgICAgICAgQGNydW1iLnN0eWxlLndpZHRoID0gXCIje3dpZHRofXB4XCJcbiAgICAgICAgICAgIGlmIHdpZHRoIDwgNTBcbiAgICAgICAgICAgICAgICBAY3J1bWIuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBjcnVtYi5zdHlsZS5kaXNwbGF5ID0gbnVsbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAY3J1bWIuc3R5bGUud2lkdGggPSBcIiN7YnIucmlnaHQgLSBici5sZWZ0fXB4XCJcbiAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG5cbiAgICBuYXZpZ2F0ZVJvd3M6IChrZXkpIC0+XG5cbiAgICAgICAgcmV0dXJuIGVycm9yIFwibm8gcm93cyBpbiBjb2x1bW4gI3tAaW5kZXh9P1wiIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gLTFcbiAgICAgICAgZXJyb3IgXCJubyBpbmRleCBmcm9tIGFjdGl2ZVJvdz8gI3tpbmRleH0/XCIsIEBhY3RpdmVSb3coKSBpZiBub3QgaW5kZXg/IG9yIE51bWJlci5pc05hTiBpbmRleFxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcgICAgICAgIHRoZW4gaW5kZXgtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIGluZGV4KzFcbiAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiAwXG4gICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gQG51bVJvd3MoKS0xXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gaW5kZXgtQG51bVZpc2libGUoKVxuICAgICAgICAgICAgd2hlbiAncGFnZSBkb3duJyB0aGVuIGluZGV4K0BudW1WaXNpYmxlKClcbiAgICAgICAgICAgIGVsc2UgaW5kZXhcbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgaW5kZXggPCAwIG9yIGluZGV4ID49IEBudW1Sb3dzKClcbiAgICAgICAgICAgIFxuICAgICAgICBlcnJvciBcIm5vIGluZGV4ICN7aW5kZXh9PyAje0BudW1WaXNpYmxlKCl9XCIgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXggICAgICAgIFxuICAgICAgICBpbmRleCA9IGNsYW1wIDAsIEBudW1Sb3dzKCktMSwgaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGVycm9yIFwibm8gcm93IGF0IGluZGV4ICN7aW5kZXh9LyN7QG51bVJvd3MoKS0xfT9cIiwgQG51bVJvd3MoKSBpZiBub3QgQHJvd3NbaW5kZXhdPy5hY3RpdmF0ZT9cbiAgICAgICAgQHJvd3NbaW5kZXhdLmFjdGl2YXRlKClcbiAgICBcbiAgICBuYXZpZ2F0ZUNvbHM6IChrZXkpIC0+ICMgbW92ZSB0byBmaWxlIGJyb3dzZXI/XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBAYnJvd3Nlci5uYXZpZ2F0ZSAnbGVmdCdcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIEBicm93c2VyLm5hdmlnYXRlICdyaWdodCdcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJ1xuICAgICAgICAgICAgICAgIGlmIGl0ZW0gPSBAYWN0aXZlUm93KCk/Lml0ZW1cbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IGl0ZW0udHlwZVxuICAgICAgICAgICAgICAgICAgICBpZiB0eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2ZpbGVicm93c2VyJyAnbG9hZEl0ZW0nIGl0ZW0sIGZvY3VzOnRydWVcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnb3BlbkZpbGUnIGl0ZW0uZmlsZVxuICAgICAgICBAXG5cbiAgICBuYXZpZ2F0ZVJvb3Q6IChrZXkpIC0+ICMgbW92ZSB0byBmaWxlIGJyb3dzZXI/XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBicm93c2VyLmJyb3dzZT9cbiAgICAgICAgQGJyb3dzZXIuYnJvd3NlIHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnICB0aGVuIHNsYXNoLmRpciBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICB0aGVuIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gQGFjdGl2ZVJvdygpLml0ZW0uZmlsZVxuICAgICAgICAgICAgd2hlbiAnZG93bicgIHRoZW4gc2xhc2gucGtnIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgd2hlbiAnficgICAgIHRoZW4gJ34nXG4gICAgICAgICAgICB3aGVuICcvJyAgICAgdGhlbiAnLydcbiAgICAgICAgQFxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwMDAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICBcbiAgICBcbiAgICBkb1NlYXJjaDogKGNoYXIpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBudW1Sb3dzKClcbiAgICAgICAgXG4gICAgICAgIGNsZWFyVGltZW91dCBAc2VhcmNoVGltZXJcbiAgICAgICAgQHNlYXJjaFRpbWVyID0gc2V0VGltZW91dCBAY2xlYXJTZWFyY2gsIDIwMDBcbiAgICAgICAgQHNlYXJjaCArPSBjaGFyXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQHNlYXJjaERpdlxuICAgICAgICAgICAgQHNlYXJjaERpdiA9IGVsZW0gY2xhc3M6ICdicm93c2VyU2VhcmNoJ1xuICAgICAgICAgICAgXG4gICAgICAgIEBzZWFyY2hEaXYudGV4dENvbnRlbnQgPSBAc2VhcmNoXG5cbiAgICAgICAgYWN0aXZlSW5kZXggID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gMFxuICAgICAgICBhY3RpdmVJbmRleCArPSAxIGlmIChAc2VhcmNoLmxlbmd0aCA9PSAxKSBvciAoY2hhciA9PSAnJylcbiAgICAgICAgYWN0aXZlSW5kZXggID0gMCBpZiBhY3RpdmVJbmRleCA+PSBAbnVtUm93cygpXG4gICAgICAgIFxuICAgICAgICBmb3Igcm93cyBpbiBbQHJvd3Muc2xpY2UoYWN0aXZlSW5kZXgpLCBAcm93cy5zbGljZSgwLGFjdGl2ZUluZGV4KzEpXVxuICAgICAgICAgICAgZnV6emllZCA9IGZ1enp5LmZpbHRlciBAc2VhcmNoLCByb3dzLCBleHRyYWN0OiAocikgLT4gci5pdGVtLm5hbWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZnV6emllZC5sZW5ndGhcbiAgICAgICAgICAgICAgICByb3cgPSBmdXp6aWVkWzBdLm9yaWdpbmFsXG4gICAgICAgICAgICAgICAgcm93LmRpdi5hcHBlbmRDaGlsZCBAc2VhcmNoRGl2XG4gICAgICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICBAXG4gICAgXG4gICAgY2xlYXJTZWFyY2g6ID0+XG4gICAgICAgIFxuICAgICAgICBAc2VhcmNoID0gJydcbiAgICAgICAgQHNlYXJjaERpdj8ucmVtb3ZlKClcbiAgICAgICAgZGVsZXRlIEBzZWFyY2hEaXZcbiAgICAgICAgQFxuICAgIFxuICAgIHJlbW92ZU9iamVjdDogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHJvdyA9IEBhY3RpdmVSb3coKVxuICAgICAgICAgICAgQGJyb3dzZXIuZW1pdCAnd2lsbFJlbW92ZVJvdycgcm93LCBAXG4gICAgICAgICAgICBuZXh0T3JQcmV2ID0gcm93Lm5leHQoKSA/IHJvdy5wcmV2KClcbiAgICAgICAgICAgIEByZW1vdmVSb3cgcm93XG4gICAgICAgICAgICBuZXh0T3JQcmV2Py5hY3RpdmF0ZSgpXG4gICAgICAgIEBcblxuICAgIHJlbW92ZVJvdzogKHJvdykgLT5cbiAgICAgICAgXG4gICAgICAgIHJvdy5kaXYucmVtb3ZlKClcbiAgICAgICAgQGl0ZW1zLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICBAcm93cy5zcGxpY2Ugcm93LmluZGV4KCksIDFcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgc29ydEJ5TmFtZTogLT5cbiAgICAgICAgIFxuICAgICAgICBAcm93cy5zb3J0IChhLGIpIC0+IFxuICAgICAgICAgICAgKGEuaXRlbS50eXBlICsgYS5pdGVtLm5hbWUpLmxvY2FsZUNvbXBhcmUoYi5pdGVtLnR5cGUgKyBiLml0ZW0ubmFtZSlcbiAgICAgICAgICAgIFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93c1xuICAgICAgICAgICAgQHRhYmxlLmFwcGVuZENoaWxkIHJvdy5kaXZcbiAgICAgICAgQFxuICAgICAgICBcbiAgICBzb3J0QnlUeXBlOiAtPlxuICAgICAgICBcbiAgICAgICAgQHJvd3Muc29ydCAoYSxiKSAtPiBcbiAgICAgICAgICAgIGF0eXBlID0gYS5pdGVtLnR5cGUgPT0gJ2ZpbGUnIGFuZCBzbGFzaC5leHQoYS5pdGVtLm5hbWUpIG9yICdfX18nICNhLml0ZW0udHlwZVxuICAgICAgICAgICAgYnR5cGUgPSBiLml0ZW0udHlwZSA9PSAnZmlsZScgYW5kIHNsYXNoLmV4dChiLml0ZW0ubmFtZSkgb3IgJ19fXycgI2IuaXRlbS50eXBlXG4gICAgICAgICAgICAoYS5pdGVtLnR5cGUgKyBhdHlwZSArIGEuaXRlbS5uYW1lKS5sb2NhbGVDb21wYXJlKGIuaXRlbS50eXBlICsgYnR5cGUgKyBiLml0ZW0ubmFtZSwgdW5kZWZpbmVkLCBudW1lcmljOnRydWUpXG4gICAgICAgICAgICBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIEB0YWJsZS5hcHBlbmRDaGlsZCByb3cuZGl2XG4gICAgICAgIEBcbiAgXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIHRvZ2dsZURvdEZpbGVzOiA9PlxuXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSB1bmRlZmluZWRcbiAgICAgICAgICAgIGxvZyAnY29sdW1uLnRvZ2dsZURvdEZpbGVzJyBAcGFyZW50XG4gICAgICAgICAgICBAcGFyZW50LnR5cGUgPSBzbGFzaC5pc0RpcihAcGFyZW50LmZpbGUpIGFuZCAnZGlyJyBvciAnZmlsZSdcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgPT0gJ2RpcicgICAgICAgICAgICBcbiAgICAgICAgICAgIHN0YXRlS2V5ID0gXCJicm93c2Vy4pa4c2hvd0hpZGRlbuKWuCN7QHBhcmVudC5maWxlfVwiXG4gICAgICAgICAgICBpZiBwcmVmcy5nZXQgc3RhdGVLZXlcbiAgICAgICAgICAgICAgICBwcmVmcy5kZWwgc3RhdGVLZXlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwcmVmcy5zZXQgc3RhdGVLZXksIHRydWVcbiAgICAgICAgICAgIEBicm93c2VyLmxvYWREaXJJdGVtIEBwYXJlbnQsIEBpbmRleCwgaWdub3JlQ2FjaGU6dHJ1ZVxuICAgICAgICBAXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG1vdmVUb1RyYXNoOiA9PlxuICAgICAgICBcbiAgICAgICAgcGF0aFRvVHJhc2ggPSBAYWN0aXZlUGF0aCgpXG4gICAgICAgIEByZW1vdmVPYmplY3QoKVxuICAgICAgICBcbiAgICAgICAgdHJhc2goW3BhdGhUb1RyYXNoXSkuY2F0Y2ggKGVycikgLT4gZXJyb3IgXCJmYWlsZWQgdG8gdHJhc2ggI3twYXRoVG9UcmFzaH0gI3tlcnJ9XCJcblxuICAgIGFkZFRvU2hlbGY6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBwYXRoVG9TaGVsZiA9IEBhY3RpdmVQYXRoKClcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnYWRkVG9TaGVsZicgcGF0aFRvU2hlbGZcbiAgICAgICAgXG4gICAgZHVwbGljYXRlRmlsZTogPT5cbiAgICAgICAgXG4gICAgICAgIHVudXNlZEZpbGVuYW1lID0gcmVxdWlyZSAndW51c2VkLWZpbGVuYW1lJ1xuICAgICAgICB1bnVzZWRGaWxlbmFtZShAYWN0aXZlUGF0aCgpKS50aGVuIChmaWxlTmFtZSkgPT5cbiAgICAgICAgICAgIGZpbGVOYW1lID0gc2xhc2gucGF0aCBmaWxlTmFtZVxuICAgICAgICAgICAgaWYgZnMuY29weT8gIyBmcy5jb3B5RmlsZSBpbiBub2RlID4gOC40XG4gICAgICAgICAgICAgICAgZnMuY29weSBAYWN0aXZlUGF0aCgpLCBmaWxlTmFtZSwgKGVycikgPT5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycm9yICdjb3B5IGZpbGUgZmFpbGVkJyBlcnIgaWYgZXJyP1xuICAgICAgICAgICAgICAgICAgICBpdGVtID0gdHlwZTonZmlsZScgZmlsZTpzbGFzaC5qb2luIHNsYXNoLmRpcihAYWN0aXZlUGF0aCgpKSwgZmlsZU5hbWVcbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdmaWxlYnJvd3NlcicgJ2xvYWRJdGVtJyBpdGVtLCBmb2N1czp0cnVlXG4gICAgICAgICAgICAgICAgICAgICMgcG9zdC5lbWl0ICdsb2FkRmlsZScgZmlsZU5hbWVcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGV4cGxvcmVyOiA9PlxuICAgICAgICBcbiAgICAgICAgb3BlbiBzbGFzaC5kaXIgQGFjdGl2ZVBhdGgoKVxuICAgICAgICBcbiAgICBvcGVuOiA9PlxuICAgICAgICBcbiAgICAgICAgb3BlbiBAYWN0aXZlUGF0aCgpXG4gICAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgXG4gICAgICAgIFxuICAgIG1ha2VSb290OiA9PiBcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLnNoaWZ0Q29sdW1uc1RvIEBpbmRleFxuICAgICAgICBcbiAgICAgICAgaWYgQGJyb3dzZXIuY29sdW1uc1swXS5pdGVtc1swXS5uYW1lICE9ICcuLidcbiAgICAgICAgICAgIEB1bnNoaWZ0SXRlbSBcbiAgICAgICAgICAgICAgICBuYW1lOiAnLi4nXG4gICAgICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgICAgICBmaWxlOiBzbGFzaC5kaXIgQHBhcmVudC5maWxlXG4gICAgXG4gICAgb25Db250ZXh0TWVudTogKGV2ZW50LCBjb2x1bW4pID0+IFxuICAgICAgICBcbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgIFxuICAgICAgICBhYnNQb3MgPSBrcG9zIGV2ZW50XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgY29sdW1uXG4gICAgICAgICAgICBAc2hvd0NvbnRleHRNZW51IGFic1Bvc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG9wdCA9IGl0ZW1zOiBbIFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgJ1Jvb3QnXG4gICAgICAgICAgICAgICAgY2I6ICAgICBAbWFrZVJvb3RcbiAgICAgICAgICAgICxcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICdBZGQgdG8gU2hlbGYnXG4gICAgICAgICAgICAgICAgY29tYm86ICAnYWx0K3NoaWZ0Ky4nXG4gICAgICAgICAgICAgICAgY2I6ICAgICA9PiBwb3N0LmVtaXQgJ2FkZFRvU2hlbGYnIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgLFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgJ0V4cGxvcmVyJ1xuICAgICAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtlJyBcbiAgICAgICAgICAgICAgICBjYjogICAgID0+IG9wZW4gQHBhcmVudC5maWxlXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgICAgIHBvcHVwLm1lbnUgb3B0ICAgIFxuICAgICAgICAgICAgICBcbiAgICBzaG93Q29udGV4dE1lbnU6IChhYnNQb3MpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgYWJzUG9zP1xuICAgICAgICAgICAgYWJzUG9zID0ga3BvcyBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQsIEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgIFxuICAgICAgICBvcHQgPSBpdGVtczogWyBcbiAgICAgICAgICAgIHRleHQ6ICAgJ1RvZ2dsZSBJbnZpc2libGUnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2knIFxuICAgICAgICAgICAgY2I6ICAgICBAdG9nZ2xlRG90RmlsZXNcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnUmVmcmVzaCdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrcicgXG4gICAgICAgICAgICBjYjogICAgIEBicm93c2VyLnJlZnJlc2hcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnRHVwbGljYXRlJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtkJyBcbiAgICAgICAgICAgIGNiOiAgICAgQGR1cGxpY2F0ZUZpbGVcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnTW92ZSB0byBUcmFzaCdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrYmFja3NwYWNlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQG1vdmVUb1RyYXNoXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0FkZCB0byBTaGVsZidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtzaGlmdCsuJ1xuICAgICAgICAgICAgY2I6ICAgICBAYWRkVG9TaGVsZlxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdFeHBsb3JlcidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQGV4cGxvcmVyXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ09wZW4nXG4gICAgICAgICAgICBjb21ibzogICdhbHQrbycgXG4gICAgICAgICAgICBjYjogICAgIEBvcGVuXG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIG9wdC5pdGVtcyA9IG9wdC5pdGVtcy5jb25jYXQgd2luZG93LnRpdGxlYmFyLm1ha2VUZW1wbGF0ZSByZXF1aXJlICcuL21lbnUuanNvbidcbiAgICAgICAgXG4gICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICBwb3B1cC5tZW51IG9wdCAgICAgICAgXG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgb25LZXk6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG5cbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdzaGlmdCtgJyAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLmxvYWREaXIgc2xhc2gucmVzb2x2ZSAnfidcbiAgICAgICAgICAgIHdoZW4gJy8nICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIubG9hZERpciAnLydcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtlJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBleHBsb3JlcigpXG4gICAgICAgICAgICB3aGVuICdhbHQrbycgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAb3BlbigpXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAncGFnZSBkb3duJyAnaG9tZScgJ2VuZCcgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzIGtleVxuICAgICAgICAgICAgd2hlbiAnZW50ZXInICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVDb2xzIGtleVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtsZWZ0JyAnY29tbWFuZCt1cCcgJ2NvbW1hbmQrcmlnaHQnICdjb21tYW5kK2Rvd24nICdjdHJsK2xlZnQnICdjdHJsK3VwJyAnY3RybCtyaWdodCcgJ2N0cmwrZG93bidcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb290IGtleVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtiYWNrc3BhY2UnICdjdHJsK2JhY2tzcGFjZScgJ2NvbW1hbmQrZGVsZXRlJyAnY3RybCtkZWxldGUnIFxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBtb3ZlVG9UcmFzaCgpXG4gICAgICAgICAgICB3aGVuICdhbHQrbGVmdCcgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsICQoJ3NoZWxmJyk/LmZvY3VzPygpXG4gICAgICAgICAgICB3aGVuICdhbHQrc2hpZnQrbGVmdCcgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLnRvZ2dsZVNoZWxmKClcbiAgICAgICAgICAgIHdoZW4gJ2JhY2tzcGFjZScgJ2RlbGV0ZScgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIub25CYWNrc3BhY2VJbkNvbHVtbiBAXG4gICAgICAgICAgICB3aGVuICdjdHJsK3QnICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBzb3J0QnlUeXBlKClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrbicgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeU5hbWUoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtpJyAnY3RybCtpJyAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAdG9nZ2xlRG90RmlsZXMoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtkJyAnY3RybCtkJyAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAZHVwbGljYXRlRmlsZSgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2snICdjdHJsK2snICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQgaWYgQGJyb3dzZXIuY2xlYW5VcCgpXG4gICAgICAgICAgICB3aGVuICdmMicgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBhY3RpdmVSb3coKT8uZWRpdE5hbWUoKVxuICAgICAgICAgICAgd2hlbiAndGFiJyAgICBcbiAgICAgICAgICAgICAgICBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBkb1NlYXJjaCAnJ1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgICAgIHdoZW4gJ2VzYydcbiAgICAgICAgICAgICAgICBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBjbGVhclNlYXJjaCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuXG4gICAgICAgIGlmIGtleSBpbiBbJ3VwJyAgICdkb3duJ10gIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyBrZXkgICAgICAgICAgICAgIFxuICAgICAgICBpZiBrZXkgaW4gWydsZWZ0JyAncmlnaHQnXSB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZUNvbHMga2V5ICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICBzd2l0Y2ggY2hhclxuICAgICAgICAgICAgd2hlbiAnficgJy8nIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm9vdCBjaGFyXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgbW9kIGluIFsnc2hpZnQnICcnXSBhbmQgY2hhciB0aGVuIEBkb1NlYXJjaCBjaGFyXG4gICAgICAgICAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IENvbHVtblxuXG5cbiJdfQ==
//# sourceURL=../coffee/column.coffee