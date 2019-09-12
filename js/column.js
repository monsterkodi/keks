// koffee 1.4.0

/*
 0000000   0000000   000      000   000  00     00  000   000
000       000   000  000      000   000  000   000  0000  000
000       000   000  000      000   000  000000000  000 0 000
000       000   000  000      000   000  000 0 000  000  0000
 0000000   0000000   0000000   0000000   000   000  000   000
 */
var $, Column, Crumb, File, Row, Scroller, _, clamp, elem, empty, fs, fuzzy, kerror, keyinfo, klog, kpos, open, popup, post, prefs, ref, setStyle, slash, state, stopEvent, valid, wxw,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, prefs = ref.prefs, stopEvent = ref.stopEvent, setStyle = ref.setStyle, keyinfo = ref.keyinfo, popup = ref.popup, slash = ref.slash, valid = ref.valid, clamp = ref.clamp, empty = ref.empty, state = ref.state, open = ref.open, elem = ref.elem, kpos = ref.kpos, fs = ref.fs, klog = ref.klog, kerror = ref.kerror, $ = ref.$, _ = ref._;

Row = require('./row');

Scroller = require('./tools/scroller');

File = require('./tools/file');

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
        this.setIndex((ref1 = this.browser.columns) != null ? ref1.length : void 0);
        if ((ref2 = this.browser.cols) != null) {
            ref2.appendChild(this.div);
        }
        this.div.addEventListener('focus', this.onFocus);
        this.div.addEventListener('blur', this.onBlur);
        this.div.addEventListener('keydown', this.onKey);
        this.div.addEventListener('mouseover', this.onMouseOver);
        this.div.addEventListener('mouseout', this.onMouseOut);
        this.div.addEventListener('click', this.onClick);
        this.div.addEventListener('dblclick', this.onDblClick);
        this.div.addEventListener('contextmenu', this.onContextMenu);
        this.crumb = new Crumb(this);
        this.scroll = new Scroller(this);
    }

    Column.prototype.setIndex = function(index1) {
        var ref1;
        this.index = index1;
        return (ref1 = this.crumb) != null ? ref1.elem.columnIndex = this.index : void 0;
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
        if (!this.rows[index].isActive()) {
            return this.rows[index].activate();
        }
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
        var pathToTrash;
        pathToTrash = this.activePath();
        this.removeObject();
        return wxw('trash', pathToTrash);
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
            case 'delete':
                return stopEvent(event, this.browser.onBackspaceInColumn(this));
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
                if (this.search.length) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sdW1uLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxrTEFBQTtJQUFBOztBQVFBLE1BQW9JLE9BQUEsQ0FBUSxLQUFSLENBQXBJLEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUseUJBQWYsRUFBMEIsdUJBQTFCLEVBQW9DLHFCQUFwQyxFQUE2QyxpQkFBN0MsRUFBb0QsaUJBQXBELEVBQTJELGlCQUEzRCxFQUFrRSxpQkFBbEUsRUFBeUUsaUJBQXpFLEVBQWdGLGlCQUFoRixFQUF1RixlQUF2RixFQUE2RixlQUE3RixFQUFtRyxlQUFuRyxFQUF5RyxXQUF6RyxFQUE2RyxlQUE3RyxFQUFtSCxtQkFBbkgsRUFBMkgsU0FBM0gsRUFBOEg7O0FBRTlILEdBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLGtCQUFSOztBQUNYLElBQUEsR0FBVyxPQUFBLENBQVEsY0FBUjs7QUFDWCxLQUFBLEdBQVcsT0FBQSxDQUFRLFNBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLEdBQUEsR0FBVyxPQUFBLENBQVEsS0FBUjs7QUFFTDtJQUVXLGdCQUFDLE9BQUQ7QUFFVCxZQUFBO1FBRlUsSUFBQyxDQUFBLFVBQUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBRVYsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUNmLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUVWLElBQUMsQ0FBQSxHQUFELEdBQVMsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxlQUFQO1lBQXVCLFFBQUEsRUFBUyxDQUFoQztTQUFMO1FBQ1QsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG9CQUFQO1NB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LEtBQWdCLEVBQWhCLENBQUEsSUFBd0IsSUFBM0I7bUJBQXFDLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixFQUFyQzs7SUFuQ0c7Ozs7OztBQXFDWCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMFxuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgcHJlZnMsIHN0b3BFdmVudCwgc2V0U3R5bGUsIGtleWluZm8sIHBvcHVwLCBzbGFzaCwgdmFsaWQsIGNsYW1wLCBlbXB0eSwgc3RhdGUsIG9wZW4sIGVsZW0sIGtwb3MsIGZzLCBrbG9nLCBrZXJyb3IsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuUm93ICAgICAgPSByZXF1aXJlICcuL3JvdydcblNjcm9sbGVyID0gcmVxdWlyZSAnLi90b29scy9zY3JvbGxlcidcbkZpbGUgICAgID0gcmVxdWlyZSAnLi90b29scy9maWxlJ1xuQ3J1bWIgICAgPSByZXF1aXJlICcuL2NydW1iJ1xuZnV6enkgICAgPSByZXF1aXJlICdmdXp6eSdcbnd4dyAgICAgID0gcmVxdWlyZSAnd3h3J1xuXG5jbGFzcyBDb2x1bW5cbiAgICBcbiAgICBjb25zdHJ1Y3RvcjogKEBicm93c2VyKSAtPlxuICAgICAgICBcbiAgICAgICAgQHNlYXJjaFRpbWVyID0gbnVsbFxuICAgICAgICBAc2VhcmNoID0gJydcbiAgICAgICAgQGl0ZW1zICA9IFtdXG4gICAgICAgIEByb3dzICAgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGRpdiAgID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJDb2x1bW4nIHRhYkluZGV4OjZcbiAgICAgICAgQHRhYmxlID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJDb2x1bW5UYWJsZSdcbiAgICAgICAgQGRpdi5hcHBlbmRDaGlsZCBAdGFibGVcbiAgICAgICAgXG4gICAgICAgIEBzZXRJbmRleCBAYnJvd3Nlci5jb2x1bW5zPy5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmNvbHM/LmFwcGVuZENoaWxkIEBkaXZcbiAgICAgICAgXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnZm9jdXMnICAgICBAb25Gb2N1c1xuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2JsdXInICAgICAgQG9uQmx1clxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2tleWRvd24nICAgQG9uS2V5XG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlb3ZlcicgQG9uTW91c2VPdmVyXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2VvdXQnICBAb25Nb3VzZU91dFxuXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snICAgICBAb25DbGlja1xuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2RibGNsaWNrJyAgQG9uRGJsQ2xpY2tcbiAgICAgICAgXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnY29udGV4dG1lbnUnIEBvbkNvbnRleHRNZW51XG4gICAgICAgIFxuICAgICAgICBAY3J1bWIgID0gbmV3IENydW1iIEBcbiAgICAgICAgQHNjcm9sbCA9IG5ldyBTY3JvbGxlciBAXG4gICAgICAgIFxuICAgIHNldEluZGV4OiAoQGluZGV4KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNydW1iPy5lbGVtLmNvbHVtbkluZGV4ID0gQGluZGV4XG4gICAgICAgIFxuICAgIGRyb3BSb3c6IChyb3csIHBvcykgLT4gXG4gICAgXG4gICAgICAgIGlmIHRhcmdldFJvdyA9IEByb3dBdFBvcyBwb3NcbiAgICAgICAgICAgIGl0ZW0gPSB0YXJnZXRSb3cuaXRlbVxuICAgICAgICAgICAgaWYgaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgcm93LnJlbmFtZSBzbGFzaC5qb2luIGl0ZW0uZmlsZSwgcm93Lml0ZW0ubmFtZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJvdy5yZW5hbWUgc2xhc2guam9pbiBzbGFzaC5kaXIoaXRlbS5maWxlKSwgcm93Lml0ZW0ubmFtZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByb3cucmVuYW1lIHNsYXNoLmpvaW4gQHBhcmVudC5maWxlLCByb3cuaXRlbS5uYW1lXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBsb2FkSXRlbXM6IChpdGVtcywgcGFyZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW4gQGluZGV4XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMgID0gaXRlbXNcbiAgICAgICAgQHBhcmVudCA9IHBhcmVudFxuICAgICAgICBcbiAgICAgICAgQGNydW1iLnNldEZpbGUgQHBhcmVudC5maWxlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICMgbG9nICdjb2x1bW4ubG9hZEl0ZW1zJyBTdHJpbmcgQHBhcmVudFxuICAgICAgICAgICAgQHBhcmVudC50eXBlID0gc2xhc2guaXNEaXIoQHBhcmVudC5maWxlKSBhbmQgJ2Rpcicgb3IgJ2ZpbGUnXG4gICAgICAgIFxuICAgICAgICBrZXJyb3IgXCJubyBwYXJlbnQgaXRlbT9cIiBpZiBub3QgQHBhcmVudD9cbiAgICAgICAga2Vycm9yIFwibG9hZEl0ZW1zIC0tIG5vIHBhcmVudCB0eXBlP1wiLCBAcGFyZW50IGlmIG5vdCBAcGFyZW50LnR5cGU/XG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAaXRlbXNcbiAgICAgICAgICAgIGZvciBpdGVtIGluIEBpdGVtc1xuICAgICAgICAgICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIFxuICAgICAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSAnZGlyJyBhbmQgc2xhc2guc2FtZVBhdGggJ34vRG93bmxvYWRzJyBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIEBzb3J0QnlEYXRlQWRkZWQoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgIHVuc2hpZnRJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBpdGVtcy51bnNoaWZ0IGl0ZW1cbiAgICAgICAgQHJvd3MudW5zaGlmdCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgQHRhYmxlLmluc2VydEJlZm9yZSBAdGFibGUubGFzdENoaWxkLCBAdGFibGUuZmlyc3RDaGlsZFxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgIEByb3dzWzBdXG4gICAgICAgIFxuICAgIHB1c2hJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBpdGVtcy5wdXNoIGl0ZW1cbiAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAcm93c1stMV1cbiAgICAgICAgXG4gICAgYWRkSXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIFxuICAgICAgICByb3cgPSBAcHVzaEl0ZW0gaXRlbVxuICAgICAgICBAc29ydEJ5TmFtZSgpXG4gICAgICAgIHJvd1xuXG4gICAgc2V0SXRlbXM6IChAaXRlbXMsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmNsZWFyQ29sdW1uIEBpbmRleFxuICAgICAgICBcbiAgICAgICAgQHBhcmVudCA9IG9wdC5wYXJlbnRcbiAgICAgICAga2Vycm9yIFwibm8gcGFyZW50IGl0ZW0/XCIgaWYgbm90IEBwYXJlbnQ/XG4gICAgICAgIGtlcnJvciBcInNldEl0ZW1zIC0tIG5vIHBhcmVudCB0eXBlP1wiLCBAcGFyZW50IGlmIG5vdCBAcGFyZW50LnR5cGU/XG4gICAgICAgIFxuICAgICAgICBmb3IgaXRlbSBpbiBAaXRlbXNcbiAgICAgICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIFxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgIEBcblxuICAgIGlzRGlyOiAgLT4gQHBhcmVudD8udHlwZSA9PSAnZGlyJyBcbiAgICBpc0ZpbGU6IC0+IEBwYXJlbnQ/LnR5cGUgPT0gJ2ZpbGUnIFxuICAgICAgICBcbiAgICBpc0VtcHR5OiAtPiBlbXB0eSBAcGFyZW50XG4gICAgY2xlYXI6ICAgLT5cbiAgICAgICAgQGNsZWFyU2VhcmNoKClcbiAgICAgICAgZGVsZXRlIEBwYXJlbnRcbiAgICAgICAgQGRpdi5zY3JvbGxUb3AgPSAwXG4gICAgICAgIEBlZGl0b3I/LmRlbCgpXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBAY3J1bWIuY2xlYXIoKVxuICAgICAgICBAcm93cyA9IFtdXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAwMDAwMCAgXG4gICBcbiAgICBhY3RpdmF0ZVJvdzogIChyb3cpIC0+IEByb3cocm93KT8uYWN0aXZhdGUoKVxuICAgICAgIFxuICAgIGFjdGl2ZVJvdzogLT4gXy5maW5kIEByb3dzLCAocikgLT4gci5pc0FjdGl2ZSgpXG4gICAgYWN0aXZlUGF0aDogLT4gQGFjdGl2ZVJvdygpPy5wYXRoKClcbiAgICBcbiAgICByb3c6IChyb3cpIC0+ICMgYWNjZXB0cyBlbGVtZW50LCBpbmRleCwgc3RyaW5nIG9yIHJvd1xuICAgICAgICBpZiAgICAgIF8uaXNOdW1iZXIgIHJvdyB0aGVuIHJldHVybiAwIDw9IHJvdyA8IEBudW1Sb3dzKCkgYW5kIEByb3dzW3Jvd10gb3IgbnVsbFxuICAgICAgICBlbHNlIGlmIF8uaXNFbGVtZW50IHJvdyB0aGVuIHJldHVybiBfLmZpbmQgQHJvd3MsIChyKSAtPiByLmRpdi5jb250YWlucyByb3dcbiAgICAgICAgZWxzZSBpZiBfLmlzU3RyaW5nICByb3cgdGhlbiByZXR1cm4gXy5maW5kIEByb3dzLCAocikgLT4gci5pdGVtLm5hbWUgPT0gcm93XG4gICAgICAgIGVsc2UgcmV0dXJuIHJvd1xuICAgICAgICAgICAgXG4gICAgbmV4dENvbHVtbjogLT4gQGJyb3dzZXIuY29sdW1uIEBpbmRleCsxXG4gICAgcHJldkNvbHVtbjogLT4gQGJyb3dzZXIuY29sdW1uIEBpbmRleC0xXG4gICAgICAgIFxuICAgIG5hbWU6IC0+IFwiI3tAYnJvd3Nlci5uYW1lfToje0BpbmRleH1cIlxuICAgIHBhdGg6IC0+IEBwYXJlbnQ/LmZpbGUgPyAnJ1xuICAgICAgICBcbiAgICBudW1Sb3dzOiAgICAtPiBAcm93cy5sZW5ndGggPyAwICAgXG4gICAgcm93SGVpZ2h0OiAgLT4gQHJvd3NbMF0/LmRpdi5jbGllbnRIZWlnaHQgPyAwXG4gICAgbnVtVmlzaWJsZTogLT4gQHJvd0hlaWdodCgpIGFuZCBwYXJzZUludChAYnJvd3Nlci5oZWlnaHQoKSAvIEByb3dIZWlnaHQoKSkgb3IgMFxuICAgIFxuICAgIHJvd0F0UG9zOiAocG9zKSAtPiBAcm93IEByb3dJbmRleEF0UG9zIHBvc1xuICAgIFxuICAgIHJvd0luZGV4QXRQb3M6IChwb3MpIC0+XG4gICAgICAgIFxuICAgICAgICBNYXRoLm1heCAwLCBNYXRoLmZsb29yIChwb3MueSAtIEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wKSAvIEByb3dIZWlnaHQoKVxuICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGhhc0ZvY3VzOiAtPiBAZGl2LmNsYXNzTGlzdC5jb250YWlucyAnZm9jdXMnXG5cbiAgICBmb2N1czogKG9wdD17fSkgLT5cbiAgICAgICAgaWYgbm90IEBhY3RpdmVSb3coKSBhbmQgQG51bVJvd3MoKSBhbmQgb3B0Py5hY3RpdmF0ZSAhPSBmYWxzZVxuICAgICAgICAgICAgQHJvd3NbMF0uc2V0QWN0aXZlKClcbiAgICAgICAgQGRpdi5mb2N1cygpXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgb25Gb2N1czogPT4gQGRpdi5jbGFzc0xpc3QuYWRkICdmb2N1cydcbiAgICBvbkJsdXI6ICA9PiBAZGl2LmNsYXNzTGlzdC5yZW1vdmUgJ2ZvY3VzJ1xuXG4gICAgZm9jdXNCcm93c2VyOiAtPiBAYnJvd3Nlci5mb2N1cygpXG4gICAgXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBvbk1vdXNlT3ZlcjogKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdmVyKClcbiAgICBvbk1vdXNlT3V0OiAgKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdXQoKVxuICAgIG9uQ2xpY2s6ICAgICAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8uYWN0aXZhdGUgZXZlbnRcbiAgICBvbkRibENsaWNrOiAgKGV2ZW50KSA9PiBcbiAgICAgICAgQGJyb3dzZXIuc2tpcE9uRGJsQ2xpY2sgPSB0cnVlXG4gICAgICAgIEBuYXZpZ2F0ZUNvbHMgJ2VudGVyJ1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIHVwZGF0ZUNydW1iOiA9PiBAY3J1bWIudXBkYXRlUmVjdCBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG5cbiAgICBuYXZpZ2F0ZVJvd3M6IChrZXkpIC0+XG5cbiAgICAgICAgcmV0dXJuIGVycm9yIFwibm8gcm93cyBpbiBjb2x1bW4gI3tAaW5kZXh9P1wiIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gLTFcbiAgICAgICAgZXJyb3IgXCJubyBpbmRleCBmcm9tIGFjdGl2ZVJvdz8gI3tpbmRleH0/XCIsIEBhY3RpdmVSb3coKSBpZiBub3QgaW5kZXg/IG9yIE51bWJlci5pc05hTiBpbmRleFxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcgICAgICAgIHRoZW4gaW5kZXgtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIGluZGV4KzFcbiAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiAwXG4gICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gQG51bVJvd3MoKS0xXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gaW5kZXgtQG51bVZpc2libGUoKVxuICAgICAgICAgICAgd2hlbiAncGFnZSBkb3duJyB0aGVuIGluZGV4K0BudW1WaXNpYmxlKClcbiAgICAgICAgICAgIGVsc2UgaW5kZXhcbiAgICAgICAgICAgIFxuICAgICAgICBlcnJvciBcIm5vIGluZGV4ICN7aW5kZXh9PyAje0BudW1WaXNpYmxlKCl9XCIgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXggICAgICAgIFxuICAgICAgICBpbmRleCA9IGNsYW1wIDAsIEBudW1Sb3dzKCktMSwgaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGVycm9yIFwibm8gcm93IGF0IGluZGV4ICN7aW5kZXh9LyN7QG51bVJvd3MoKS0xfT9cIiwgQG51bVJvd3MoKSBpZiBub3QgQHJvd3NbaW5kZXhdPy5hY3RpdmF0ZT9cbiAgICAgICAgaWYgbm90IEByb3dzW2luZGV4XS5pc0FjdGl2ZSgpXG4gICAgICAgICAgICBAcm93c1tpbmRleF0uYWN0aXZhdGUoKVxuICAgIFxuICAgIG5hdmlnYXRlQ29sczogKGtleSkgLT4gIyBtb3ZlIHRvIGZpbGUgYnJvd3Nlcj9cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICB0aGVuIEBicm93c2VyLm5hdmlnYXRlICd1cCdcbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnICB0aGVuIEBicm93c2VyLm5hdmlnYXRlICdsZWZ0J1xuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gQGJyb3dzZXIubmF2aWdhdGUgJ3JpZ2h0J1xuICAgICAgICAgICAgd2hlbiAnZW50ZXInXG4gICAgICAgICAgICAgICAgaWYgaXRlbSA9IEBhY3RpdmVSb3coKT8uaXRlbVxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gaXRlbS50eXBlXG4gICAgICAgICAgICAgICAgICAgIGlmIHR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgIEBicm93c2VyLmxvYWRJdGVtIGl0ZW1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnb3BlbkZpbGUnIGl0ZW0uZmlsZVxuICAgICAgICBAXG5cbiAgICBuYXZpZ2F0ZVJvb3Q6IChrZXkpIC0+IFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuYnJvd3NlIHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnICB0aGVuIHNsYXNoLmRpciBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIEBhY3RpdmVSb3coKS5pdGVtLmZpbGVcbiAgICAgICAgQFxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwMDAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICBcbiAgICBcbiAgICBkb1NlYXJjaDogKGNoYXIpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBudW1Sb3dzKClcbiAgICAgICAgXG4gICAgICAgIGNsZWFyVGltZW91dCBAc2VhcmNoVGltZXJcbiAgICAgICAgQHNlYXJjaFRpbWVyID0gc2V0VGltZW91dCBAY2xlYXJTZWFyY2gsIDIwMDBcbiAgICAgICAgQHNlYXJjaCArPSBjaGFyXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQHNlYXJjaERpdlxuICAgICAgICAgICAgQHNlYXJjaERpdiA9IGVsZW0gY2xhc3M6ICdicm93c2VyU2VhcmNoJ1xuICAgICAgICAgICAgXG4gICAgICAgIEBzZWFyY2hEaXYudGV4dENvbnRlbnQgPSBAc2VhcmNoXG5cbiAgICAgICAgYWN0aXZlSW5kZXggID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gMFxuICAgICAgICBhY3RpdmVJbmRleCArPSAxIGlmIChAc2VhcmNoLmxlbmd0aCA9PSAxKSBvciAoY2hhciA9PSAnJylcbiAgICAgICAgYWN0aXZlSW5kZXggID0gMCBpZiBhY3RpdmVJbmRleCA+PSBAbnVtUm93cygpXG4gICAgICAgIFxuICAgICAgICBmb3Igcm93cyBpbiBbQHJvd3Muc2xpY2UoYWN0aXZlSW5kZXgpLCBAcm93cy5zbGljZSgwLGFjdGl2ZUluZGV4KzEpXVxuICAgICAgICAgICAgZnV6emllZCA9IGZ1enp5LmZpbHRlciBAc2VhcmNoLCByb3dzLCBleHRyYWN0OiAocikgLT4gci5pdGVtLm5hbWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZnV6emllZC5sZW5ndGhcbiAgICAgICAgICAgICAgICByb3cgPSBmdXp6aWVkWzBdLm9yaWdpbmFsXG4gICAgICAgICAgICAgICAgcm93LmRpdi5hcHBlbmRDaGlsZCBAc2VhcmNoRGl2XG4gICAgICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICBAXG4gICAgXG4gICAgY2xlYXJTZWFyY2g6ID0+XG4gICAgICAgIFxuICAgICAgICBAc2VhcmNoID0gJydcbiAgICAgICAgQHNlYXJjaERpdj8ucmVtb3ZlKClcbiAgICAgICAgZGVsZXRlIEBzZWFyY2hEaXZcbiAgICAgICAgQFxuICAgIFxuICAgIHJlbW92ZU9iamVjdDogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHJvdyA9IEBhY3RpdmVSb3coKVxuICAgICAgICAgICAgbmV4dE9yUHJldiA9IHJvdy5uZXh0KCkgPyByb3cucHJldigpXG4gICAgICAgICAgICBAcmVtb3ZlUm93IHJvd1xuICAgICAgICAgICAgbmV4dE9yUHJldj8uYWN0aXZhdGUoKVxuICAgICAgICBAXG5cbiAgICByZW1vdmVSb3c6IChyb3cpIC0+XG4gICAgICAgIFxuICAgICAgICByb3cuZGl2LnJlbW92ZSgpXG4gICAgICAgIEBpdGVtcy5zcGxpY2Ugcm93LmluZGV4KCksIDFcbiAgICAgICAgQHJvd3Muc3BsaWNlIHJvdy5pbmRleCgpLCAxXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNvcnRCeU5hbWU6IC0+XG4gICAgICAgICBcbiAgICAgICAgQHJvd3Muc29ydCAoYSxiKSAtPiBcbiAgICAgICAgICAgIChhLml0ZW0udHlwZSArIGEuaXRlbS5uYW1lKS5sb2NhbGVDb21wYXJlKGIuaXRlbS50eXBlICsgYi5pdGVtLm5hbWUpXG4gICAgICAgICAgICBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIEB0YWJsZS5hcHBlbmRDaGlsZCByb3cuZGl2XG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgc29ydEJ5VHlwZTogLT5cbiAgICAgICAgXG4gICAgICAgIEByb3dzLnNvcnQgKGEsYikgLT4gXG4gICAgICAgICAgICBhdHlwZSA9IGEuaXRlbS50eXBlID09ICdmaWxlJyBhbmQgc2xhc2guZXh0KGEuaXRlbS5uYW1lKSBvciAnX19fJyAjYS5pdGVtLnR5cGVcbiAgICAgICAgICAgIGJ0eXBlID0gYi5pdGVtLnR5cGUgPT0gJ2ZpbGUnIGFuZCBzbGFzaC5leHQoYi5pdGVtLm5hbWUpIG9yICdfX18nICNiLml0ZW0udHlwZVxuICAgICAgICAgICAgKGEuaXRlbS50eXBlICsgYXR5cGUgKyBhLml0ZW0ubmFtZSkubG9jYWxlQ29tcGFyZShiLml0ZW0udHlwZSArIGJ0eXBlICsgYi5pdGVtLm5hbWUsIHVuZGVmaW5lZCwgbnVtZXJpYzp0cnVlKVxuICAgICAgICAgICAgXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICBAdGFibGUuYXBwZW5kQ2hpbGQgcm93LmRpdlxuICAgICAgICBAXG5cbiAgICBzb3J0QnlEYXRlQWRkZWQ6IC0+XG4gICAgICAgIFxuICAgICAgICBAcm93cy5zb3J0IChhLGIpIC0+IGIuaXRlbS5zdGF0Py5hdGltZU1zIC0gYS5pdGVtLnN0YXQ/LmF0aW1lTXNcbiAgICAgICAgICAgIFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgZm9yIHJvdyBpbiBAcm93c1xuICAgICAgICAgICAgQHRhYmxlLmFwcGVuZENoaWxkIHJvdy5kaXZcbiAgICAgICAgQFxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgdG9nZ2xlRG90RmlsZXM6ID0+XG5cbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09IHVuZGVmaW5lZFxuICAgICAgICAgICAgIyBsb2cgJ2NvbHVtbi50b2dnbGVEb3RGaWxlcycgQHBhcmVudFxuICAgICAgICAgICAgQHBhcmVudC50eXBlID0gc2xhc2guaXNEaXIoQHBhcmVudC5maWxlKSBhbmQgJ2Rpcicgb3IgJ2ZpbGUnXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09ICdkaXInICAgICAgICAgICAgXG4gICAgICAgICAgICBzdGF0ZUtleSA9IFwiYnJvd3NlcuKWuHNob3dIaWRkZW7ilrgje0BwYXJlbnQuZmlsZX1cIlxuICAgICAgICAgICAgaWYgcHJlZnMuZ2V0IHN0YXRlS2V5XG4gICAgICAgICAgICAgICAgcHJlZnMuZGVsIHN0YXRlS2V5XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcHJlZnMuc2V0IHN0YXRlS2V5LCB0cnVlXG4gICAgICAgICAgICBAYnJvd3Nlci5sb2FkRGlySXRlbSBAcGFyZW50LCBAaW5kZXgsIGlnbm9yZUNhY2hlOnRydWVcbiAgICAgICAgQFxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBtb3ZlVG9UcmFzaDogPT5cbiAgICAgICAgXG4gICAgICAgIHBhdGhUb1RyYXNoID0gQGFjdGl2ZVBhdGgoKVxuICAgICAgICBAcmVtb3ZlT2JqZWN0KClcbiAgICAgICAgXG4gICAgICAgIHd4dyAndHJhc2gnIHBhdGhUb1RyYXNoXG5cbiAgICBhZGRUb1NoZWxmOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgcGF0aFRvU2hlbGYgPSBAYWN0aXZlUGF0aCgpXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2FkZFRvU2hlbGYnIHBhdGhUb1NoZWxmXG4gICAgICAgIFxuICAgIGR1cGxpY2F0ZUZpbGU6ID0+XG4gICAgICAgIFxuICAgICAgICB1bnVzZWRGaWxlbmFtZSA9IHJlcXVpcmUgJ3VudXNlZC1maWxlbmFtZSdcbiAgICAgICAgdW51c2VkRmlsZW5hbWUoQGFjdGl2ZVBhdGgoKSkudGhlbiAoZmlsZU5hbWUpID0+XG4gICAgICAgICAgICBmaWxlTmFtZSA9IHNsYXNoLnBhdGggZmlsZU5hbWVcbiAgICAgICAgICAgIGlmIGZzLmNvcHk/ICMgZnMuY29weUZpbGUgaW4gbm9kZSA+IDguNFxuICAgICAgICAgICAgICAgIGZzLmNvcHkgQGFjdGl2ZVBhdGgoKSwgZmlsZU5hbWUsIChlcnIpID0+XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnJvciAnY29weSBmaWxlIGZhaWxlZCcgZXJyIGlmIGVycj9cbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9IHR5cGU6J2ZpbGUnIGZpbGU6c2xhc2guam9pbiBzbGFzaC5kaXIoQGFjdGl2ZVBhdGgoKSksIGZpbGVOYW1lXG4gICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZmlsZWJyb3dzZXInICdsb2FkSXRlbScgaXRlbSwgZm9jdXM6dHJ1ZVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgZXhwbG9yZXI6ID0+XG4gICAgICAgIFxuICAgICAgICBvcGVuIHNsYXNoLmRpciBAYWN0aXZlUGF0aCgpXG4gICAgICAgIFxuICAgIG9wZW46ID0+XG4gICAgICAgIFxuICAgICAgICBvcGVuIEBhY3RpdmVQYXRoKClcbiAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICBcbiAgICAgICAgXG4gICAgbWFrZVJvb3Q6ID0+IFxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuc2hpZnRDb2x1bW5zVG8gQGluZGV4XG4gICAgICAgIFxuICAgICAgICBpZiBAYnJvd3Nlci5jb2x1bW5zWzBdLml0ZW1zWzBdLm5hbWUgIT0gJy4uJ1xuICAgICAgICAgICAgQHVuc2hpZnRJdGVtIFxuICAgICAgICAgICAgICAgIG5hbWU6ICcuLidcbiAgICAgICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgICAgIGZpbGU6IHNsYXNoLmRpciBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGNydW1iLnNldEZpbGUgQHBhcmVudC5maWxlXG4gICAgXG4gICAgb25Db250ZXh0TWVudTogKGV2ZW50LCBjb2x1bW4pID0+IFxuICAgICAgICBcbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgIFxuICAgICAgICBhYnNQb3MgPSBrcG9zIGV2ZW50XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgY29sdW1uXG4gICAgICAgICAgICBAc2hvd0NvbnRleHRNZW51IGFic1Bvc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG9wdCA9IGl0ZW1zOiBbIFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgJ1Jvb3QnXG4gICAgICAgICAgICAgICAgY2I6ICAgICBAbWFrZVJvb3RcbiAgICAgICAgICAgICxcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICdBZGQgdG8gU2hlbGYnXG4gICAgICAgICAgICAgICAgY29tYm86ICAnYWx0K3NoaWZ0Ky4nXG4gICAgICAgICAgICAgICAgY2I6ICAgICA9PiBwb3N0LmVtaXQgJ2FkZFRvU2hlbGYnIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgLFxuICAgICAgICAgICAgICAgIHRleHQ6ICAgJ0V4cGxvcmVyJ1xuICAgICAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtlJyBcbiAgICAgICAgICAgICAgICBjYjogICAgID0+IG9wZW4gQHBhcmVudC5maWxlXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgICAgIHBvcHVwLm1lbnUgb3B0ICAgIFxuICAgICAgICAgICAgICBcbiAgICBzaG93Q29udGV4dE1lbnU6IChhYnNQb3MpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgYWJzUG9zP1xuICAgICAgICAgICAgYWJzUG9zID0ga3BvcyBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQsIEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgIFxuICAgICAgICBvcHQgPSBpdGVtczogWyBcbiAgICAgICAgICAgIHRleHQ6ICAgJ1RvZ2dsZSBJbnZpc2libGUnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2knIFxuICAgICAgICAgICAgY2I6ICAgICBAdG9nZ2xlRG90RmlsZXNcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnUmVmcmVzaCdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrcicgXG4gICAgICAgICAgICBjYjogICAgIEBicm93c2VyLnJlZnJlc2hcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnRHVwbGljYXRlJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtkJyBcbiAgICAgICAgICAgIGNiOiAgICAgQGR1cGxpY2F0ZUZpbGVcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnTW92ZSB0byBUcmFzaCdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrYmFja3NwYWNlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQG1vdmVUb1RyYXNoXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0FkZCB0byBTaGVsZidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtzaGlmdCsuJ1xuICAgICAgICAgICAgY2I6ICAgICBAYWRkVG9TaGVsZlxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdFeHBsb3JlcidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQGV4cGxvcmVyXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ09wZW4nXG4gICAgICAgICAgICBjb21ibzogICdhbHQrbycgXG4gICAgICAgICAgICBjYjogICAgIEBvcGVuXG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIG9wdC5pdGVtcyA9IG9wdC5pdGVtcy5jb25jYXQgd2luZG93LnRpdGxlYmFyLm1ha2VUZW1wbGF0ZSByZXF1aXJlICcuL21lbnUuanNvbidcbiAgICAgICAgXG4gICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICBwb3B1cC5tZW51IG9wdCAgICAgICAgXG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgb25LZXk6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG5cbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdzaGlmdCtgJyAnficgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5icm93c2UgJ34nXG4gICAgICAgICAgICB3aGVuICcvJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5icm93c2UgJy8nXG4gICAgICAgICAgICB3aGVuICdhbHQrZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQGV4cGxvcmVyKClcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtvJyAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAb3BlbigpXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAncGFnZSBkb3duJyAnaG9tZScgJ2VuZCcgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb3dzIGtleVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCt1cCcgJ2N0cmwrdXAnICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyAnaG9tZSdcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZG93bicgJ2N0cmwrZG93bicgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3MgJ2VuZCdcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJydhbHQrdXAnICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZUNvbHMga2V5XG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnICdkZWxldGUnICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5vbkJhY2tzcGFjZUluQ29sdW1uIEBcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrdCcgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBzb3J0QnlUeXBlKClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrbicgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBzb3J0QnlOYW1lKClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrYScgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBzb3J0QnlEYXRlQWRkZWQoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtpJyAnY3RybCtpJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHRvZ2dsZURvdEZpbGVzKClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZCcgJ2N0cmwrZCcgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBkdXBsaWNhdGVGaWxlKClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQraycgJ2N0cmwraycgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQgaWYgQGJyb3dzZXIuY2xlYW5VcCgpXG4gICAgICAgICAgICB3aGVuICdmMicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYWN0aXZlUm93KCk/LmVkaXROYW1lKClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrbGVmdCcgJ2NvbW1hbmQrcmlnaHQnICdjdHJsK2xlZnQnICdjdHJsK3JpZ2h0J1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvb3Qga2V5XG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2JhY2tzcGFjZScgJ2N0cmwrYmFja3NwYWNlJyAnY29tbWFuZCtkZWxldGUnICdjdHJsK2RlbGV0ZScgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG1vdmVUb1RyYXNoKClcbiAgICAgICAgICAgIHdoZW4gJ3RhYicgICAgXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAZG9TZWFyY2ggJydcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAY2xlYXJTZWFyY2goKVxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnRcblxuICAgICAgICBpZiBjb21ibyBpbiBbJ3VwJyAgICdkb3duJ10gIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyBrZXkgICAgICAgICAgICAgIFxuICAgICAgICBpZiBjb21ibyBpbiBbJ2xlZnQnICdyaWdodCddIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlQ29scyBrZXlcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBtb2QgaW4gWydzaGlmdCcgJyddIGFuZCBjaGFyIHRoZW4gQGRvU2VhcmNoIGNoYXJcbiAgICAgICAgICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQ29sdW1uXG5cblxuIl19
//# sourceURL=../coffee/column.coffee