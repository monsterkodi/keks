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
        return this.scroll.update();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sdW1uLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx1S0FBQTtJQUFBOztBQVFBLE1BQW9JLE9BQUEsQ0FBUSxLQUFSLENBQXBJLEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUseUJBQWYsRUFBMEIsdUJBQTFCLEVBQW9DLHFCQUFwQyxFQUE2QyxpQkFBN0MsRUFBb0QsaUJBQXBELEVBQTJELGlCQUEzRCxFQUFrRSxpQkFBbEUsRUFBeUUsaUJBQXpFLEVBQWdGLGlCQUFoRixFQUF1RixlQUF2RixFQUE2RixlQUE3RixFQUFtRyxlQUFuRyxFQUF5RyxXQUF6RyxFQUE2RyxlQUE3RyxFQUFtSCxtQkFBbkgsRUFBMkgsU0FBM0gsRUFBOEg7O0FBRTlILEdBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFFTDtJQUVXLGdCQUFDLE9BQUQ7QUFFVCxZQUFBO1FBRlUsSUFBQyxDQUFBLFVBQUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBRVYsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUNmLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUVWLElBQUMsQ0FBQSxHQUFELEdBQVMsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxlQUFQO1lBQXVCLFFBQUEsRUFBUyxDQUFoQztTQUFMO1FBQ1QsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG9CQUFQO1NBQUw7UUFDVCxJQUFDLENBQUEsR0FBRyxDQUFDLFdBQUwsQ0FBaUIsSUFBQyxDQUFBLEtBQWxCO1FBRUEsSUFB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QUFBLE1BQU0sQ0FBQyxNQUFYO29CQUF1QixJQUFDLENBQUEsUUFBRCxDQUFVLEVBQVYsRUFBdkI7O0FBQ0EsdUJBQU8sU0FBQSxDQUFVLEtBQVY7QUF0QmYsaUJBdUJTLEtBdkJUO2dCQXdCUSxJQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBWDtvQkFBdUIsSUFBQyxDQUFBLFdBQUQsQ0FBQSxFQUF2Qjs7QUFDQSx1QkFBTyxTQUFBLENBQVUsS0FBVjtBQXpCZjtRQTJCQSxJQUFHLEdBQUEsS0FBUSxJQUFSLElBQUEsR0FBQSxLQUFlLE1BQWxCO0FBQWdDLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxZQUFELENBQWMsR0FBZCxDQUFqQixFQUF2Qzs7UUFDQSxJQUFHLEdBQUEsS0FBUSxNQUFSLElBQUEsR0FBQSxLQUFlLE9BQWxCO0FBQWdDLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxZQUFELENBQWMsR0FBZCxDQUFqQixFQUF2Qzs7QUFFQSxnQkFBTyxJQUFQO0FBQUEsaUJBQ1MsR0FEVDtBQUFBLGlCQUNhLEdBRGI7QUFDc0IsdUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFlBQUQsQ0FBYyxJQUFkLENBQWpCO0FBRDdCO1FBR0EsSUFBRyxDQUFBLEdBQUEsS0FBUSxPQUFSLElBQUEsR0FBQSxLQUFnQixFQUFoQixDQUFBLElBQXdCLElBQTNCO21CQUFxQyxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsRUFBckM7O0lBckNHOzs7Ozs7QUF1Q1gsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIHByZWZzLCBzdG9wRXZlbnQsIHNldFN0eWxlLCBrZXlpbmZvLCBwb3B1cCwgc2xhc2gsIHZhbGlkLCBjbGFtcCwgZW1wdHksIHN0YXRlLCBvcGVuLCBlbGVtLCBrcG9zLCBmcywga2xvZywga2Vycm9yLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cblJvdyAgICAgID0gcmVxdWlyZSAnLi9yb3cnXG5TY3JvbGxlciA9IHJlcXVpcmUgJy4vc2Nyb2xsZXInXG5mdXp6eSAgICA9IHJlcXVpcmUgJ2Z1enp5J1xudHJhc2ggICAgPSByZXF1aXJlICd0cmFzaCdcblxuY2xhc3MgQ29sdW1uXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAYnJvd3NlcikgLT5cbiAgICAgICAgXG4gICAgICAgIEBzZWFyY2hUaW1lciA9IG51bGxcbiAgICAgICAgQHNlYXJjaCA9ICcnXG4gICAgICAgIEBpdGVtcyAgPSBbXVxuICAgICAgICBAcm93cyAgID0gW11cbiAgICAgICAgXG4gICAgICAgIEBkaXYgICA9IGVsZW0gY2xhc3M6ICdicm93c2VyQ29sdW1uJyB0YWJJbmRleDo2XG4gICAgICAgIEB0YWJsZSA9IGVsZW0gY2xhc3M6ICdicm93c2VyQ29sdW1uVGFibGUnXG4gICAgICAgIEBkaXYuYXBwZW5kQ2hpbGQgQHRhYmxlXG4gICAgICAgIFxuICAgICAgICBAY3J1bWIgPSBlbGVtIGNsYXNzOidjcnVtYidcbiAgICAgICAgQGNydW1iLmNvbHVtbkluZGV4ID0gQGluZGV4XG4gICAgICAgIEBjcnVtYi5hZGRFdmVudExpc3RlbmVyICdkYmxjbGljaycgQG1ha2VSb290XG4gICAgICAgIFxuICAgICAgICBAc2V0SW5kZXggQGJyb3dzZXIuY29sdW1ucz8ubGVuZ3RoXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICQoJ2NydW1icycpLmFwcGVuZENoaWxkIEBjcnVtYlxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY29scz8uYXBwZW5kQ2hpbGQgQGRpdlxuICAgICAgICBcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdmb2N1cycgICAgIEBvbkZvY3VzXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnYmx1cicgICAgICBAb25CbHVyXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgICBAb25LZXlcbiAgICAgICAgXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2VvdmVyJyBAb25Nb3VzZU92ZXJcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdtb3VzZW91dCcgIEBvbk1vdXNlT3V0XG5cbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdtb3VzZXVwJyAgIEBvbkNsaWNrXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnZGJsY2xpY2snICBAb25EYmxDbGlja1xuICAgICAgICBcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdjb250ZXh0bWVudScgQG9uQ29udGV4dE1lbnVcbiAgICAgICAgXG4gICAgICAgIEBzY3JvbGwgPSBuZXcgU2Nyb2xsZXIgQFxuICAgICAgICBcbiAgICBzZXRJbmRleDogKEBpbmRleCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjcnVtYi5jb2x1bW5JbmRleCA9IEBpbmRleFxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgbG9hZEl0ZW1zOiAoaXRlbXMsIHBhcmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmNsZWFyQ29sdW1uIEBpbmRleFxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zICA9IGl0ZW1zXG4gICAgICAgIEBwYXJlbnQgPSBwYXJlbnRcbiAgICAgICAgXG4gICAgICAgIEBjcnVtYi5pbm5lckhUTUwgPSBzbGFzaC5iYXNlIEBwYXJlbnQuZmlsZVxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09IHVuZGVmaW5lZFxuICAgICAgICAgICAgbG9nICdjb2x1bW4ubG9hZEl0ZW1zJyBTdHJpbmcgQHBhcmVudFxuICAgICAgICAgICAgQHBhcmVudC50eXBlID0gc2xhc2guaXNEaXIoQHBhcmVudC5maWxlKSBhbmQgJ2Rpcicgb3IgJ2ZpbGUnXG4gICAgICAgIFxuICAgICAgICBrZXJyb3IgXCJubyBwYXJlbnQgaXRlbT9cIiBpZiBub3QgQHBhcmVudD9cbiAgICAgICAga2Vycm9yIFwibG9hZEl0ZW1zIC0tIG5vIHBhcmVudCB0eXBlP1wiLCBAcGFyZW50IGlmIG5vdCBAcGFyZW50LnR5cGU/XG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAaXRlbXNcbiAgICAgICAgICAgIGZvciBpdGVtIGluIEBpdGVtc1xuICAgICAgICAgICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIFxuICAgICAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgIHVuc2hpZnRJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBpdGVtcy51bnNoaWZ0IGl0ZW1cbiAgICAgICAgQHJvd3MudW5zaGlmdCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgQHRhYmxlLmluc2VydEJlZm9yZSBAdGFibGUubGFzdENoaWxkLCBAdGFibGUuZmlyc3RDaGlsZFxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG5cbiAgICBzZXRJdGVtczogKEBpdGVtcywgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW4gQGluZGV4XG4gICAgICAgIFxuICAgICAgICBAcGFyZW50ID0gb3B0LnBhcmVudFxuICAgICAgICBrZXJyb3IgXCJubyBwYXJlbnQgaXRlbT9cIiBpZiBub3QgQHBhcmVudD9cbiAgICAgICAga2Vycm9yIFwic2V0SXRlbXMgLS0gbm8gcGFyZW50IHR5cGU/XCIsIEBwYXJlbnQgaWYgbm90IEBwYXJlbnQudHlwZT9cbiAgICAgICAgXG4gICAgICAgIGZvciBpdGVtIGluIEBpdGVtc1xuICAgICAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgQFxuXG4gICAgaXNEaXI6ICAtPiBAcGFyZW50LnR5cGUgPT0gJ2RpcicgXG4gICAgaXNGaWxlOiAtPiBAcGFyZW50LnR5cGUgPT0gJ2ZpbGUnIFxuICAgICAgICBcbiAgICBpc0VtcHR5OiAtPiBlbXB0eSBAcm93c1xuICAgIGNsZWFyOiAgIC0+XG4gICAgICAgIEBjbGVhclNlYXJjaCgpXG4gICAgICAgIGRlbGV0ZSBAcGFyZW50XG4gICAgICAgIEBkaXYuc2Nyb2xsVG9wID0gMFxuICAgICAgICBAZWRpdG9yPy5kZWwoKVxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgQGNydW1iLmlubmVySFRNTCA9ICcnXG4gICAgICAgIEByb3dzID0gW11cbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMDAwMDAwICBcbiAgIFxuICAgIGFjdGl2YXRlUm93OiAgKHJvdykgLT4gQHJvdyhyb3cpPy5hY3RpdmF0ZSgpXG4gICAgICAgXG4gICAgYWN0aXZlUm93OiAtPiBfLmZpbmQgQHJvd3MsIChyKSAtPiByLmlzQWN0aXZlKClcbiAgICBhY3RpdmVQYXRoOiAtPiBAYWN0aXZlUm93KCk/LnBhdGgoKVxuICAgIFxuICAgIHJvdzogKHJvdykgLT4gIyBhY2NlcHRzIGVsZW1lbnQsIGluZGV4LCBzdHJpbmcgb3Igcm93XG4gICAgICAgIGlmICAgICAgXy5pc051bWJlciAgcm93IHRoZW4gcmV0dXJuIDAgPD0gcm93IDwgQG51bVJvd3MoKSBhbmQgQHJvd3Nbcm93XSBvciBudWxsXG4gICAgICAgIGVsc2UgaWYgXy5pc0VsZW1lbnQgcm93IHRoZW4gcmV0dXJuIF8uZmluZCBAcm93cywgKHIpIC0+IHIuZGl2LmNvbnRhaW5zIHJvd1xuICAgICAgICBlbHNlIGlmIF8uaXNTdHJpbmcgIHJvdyB0aGVuIHJldHVybiBfLmZpbmQgQHJvd3MsIChyKSAtPiByLml0ZW0ubmFtZSA9PSByb3dcbiAgICAgICAgZWxzZSByZXR1cm4gcm93XG4gICAgICAgICAgICBcbiAgICBuZXh0Q29sdW1uOiAtPiBAYnJvd3Nlci5jb2x1bW4gQGluZGV4KzFcbiAgICBwcmV2Q29sdW1uOiAtPiBAYnJvd3Nlci5jb2x1bW4gQGluZGV4LTFcbiAgICAgICAgXG4gICAgbmFtZTogLT4gXCIje0Bicm93c2VyLm5hbWV9OiN7QGluZGV4fVwiXG4gICAgcGF0aDogLT4gQHBhcmVudD8uZmlsZSA/ICcnXG4gICAgICAgIFxuICAgIG51bVJvd3M6ICAgIC0+IEByb3dzLmxlbmd0aCA/IDAgICBcbiAgICByb3dIZWlnaHQ6ICAtPiBAcm93c1swXT8uZGl2LmNsaWVudEhlaWdodCA/IDBcbiAgICBudW1WaXNpYmxlOiAtPiBAcm93SGVpZ2h0KCkgYW5kIHBhcnNlSW50KEBicm93c2VyLmhlaWdodCgpIC8gQHJvd0hlaWdodCgpKSBvciAwXG4gICAgXG4gICAgcm93SW5kZXhBdFBvczogKHBvcykgLT5cbiAgICAgICAgXG4gICAgICAgIE1hdGgubWF4IDAsIE1hdGguZmxvb3IgKHBvcy55IC0gQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3ApIC8gQHJvd0hlaWdodCgpXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgaGFzRm9jdXM6IC0+IEBkaXYuY2xhc3NMaXN0LmNvbnRhaW5zICdmb2N1cydcblxuICAgIGZvY3VzOiAob3B0PXt9KSAtPlxuICAgICAgICBpZiBub3QgQGFjdGl2ZVJvdygpIGFuZCBAbnVtUm93cygpIGFuZCBvcHQ/LmFjdGl2YXRlICE9IGZhbHNlXG4gICAgICAgICAgICBAcm93c1swXS5zZXRBY3RpdmUoKVxuICAgICAgICBAZGl2LmZvY3VzKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICBvbkZvY3VzOiA9PiBAZGl2LmNsYXNzTGlzdC5hZGQgJ2ZvY3VzJ1xuICAgIG9uQmx1cjogID0+IEBkaXYuY2xhc3NMaXN0LnJlbW92ZSAnZm9jdXMnXG5cbiAgICBmb2N1c0Jyb3dzZXI6IC0+IEBicm93c2VyLmZvY3VzKClcbiAgICBcbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG9uTW91c2VPdmVyOiAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU92ZXIoKVxuICAgIG9uTW91c2VPdXQ6ICAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU91dCgpXG4gICAgb25DbGljazogICAgIChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5hY3RpdmF0ZSBldmVudFxuICAgIG9uRGJsQ2xpY2s6ICAoZXZlbnQpID0+IEBuYXZpZ2F0ZUNvbHMgJ2VudGVyJ1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIHVwZGF0ZUNydW1iOiA9PlxuICAgICAgICBiciA9IEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgQGNydW1iLnN0eWxlLmxlZnQgPSBcIiN7YnIubGVmdH1weFwiXG4gICAgICAgIGlmIEBpbmRleCA9PSBAYnJvd3Nlci5udW1Db2xzKCktMVxuICAgICAgICAgICAgd2lkdGggPSBici5yaWdodCAtIGJyLmxlZnQgLSAxMzVcbiAgICAgICAgICAgIEBjcnVtYi5zdHlsZS53aWR0aCA9IFwiI3t3aWR0aH1weFwiXG4gICAgICAgICAgICBpZiB3aWR0aCA8IDUwXG4gICAgICAgICAgICAgICAgQGNydW1iLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAY3J1bWIuc3R5bGUuZGlzcGxheSA9IG51bGxcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNydW1iLnN0eWxlLndpZHRoID0gXCIje2JyLnJpZ2h0IC0gYnIubGVmdH1weFwiXG4gICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuXG4gICAgbmF2aWdhdGVSb3dzOiAoa2V5KSAtPlxuXG4gICAgICAgIHJldHVybiBlcnJvciBcIm5vIHJvd3MgaW4gY29sdW1uICN7QGluZGV4fT9cIiBpZiBub3QgQG51bVJvd3MoKVxuICAgICAgICBpbmRleCA9IEBhY3RpdmVSb3coKT8uaW5kZXgoKSA/IC0xXG4gICAgICAgIGVycm9yIFwibm8gaW5kZXggZnJvbSBhY3RpdmVSb3c/ICN7aW5kZXh9P1wiLCBAYWN0aXZlUm93KCkgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIGluZGV4LTFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiBpbmRleCsxXG4gICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gMFxuICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIEBudW1Sb3dzKCktMVxuICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcgICB0aGVuIGluZGV4LUBudW1WaXNpYmxlKClcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgZG93bicgdGhlbiBpbmRleCtAbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICBlbHNlIGluZGV4XG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGluZGV4IDwgMCBvciBpbmRleCA+PSBAbnVtUm93cygpXG4gICAgICAgICAgICBcbiAgICAgICAgZXJyb3IgXCJubyBpbmRleCAje2luZGV4fT8gI3tAbnVtVmlzaWJsZSgpfVwiIGlmIG5vdCBpbmRleD8gb3IgTnVtYmVyLmlzTmFOIGluZGV4ICAgICAgICBcbiAgICAgICAgaW5kZXggPSBjbGFtcCAwLCBAbnVtUm93cygpLTEsIGluZGV4XG4gICAgICAgIFxuICAgICAgICBlcnJvciBcIm5vIHJvdyBhdCBpbmRleCAje2luZGV4fS8je0BudW1Sb3dzKCktMX0/XCIsIEBudW1Sb3dzKCkgaWYgbm90IEByb3dzW2luZGV4XT8uYWN0aXZhdGU/XG4gICAgICAgIEByb3dzW2luZGV4XS5hY3RpdmF0ZSgpXG4gICAgXG4gICAgbmF2aWdhdGVDb2xzOiAoa2V5KSAtPiAjIG1vdmUgdG8gZmlsZSBicm93c2VyP1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gQGJyb3dzZXIubmF2aWdhdGUgJ2xlZnQnXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBAYnJvd3Nlci5uYXZpZ2F0ZSAncmlnaHQnXG4gICAgICAgICAgICB3aGVuICdlbnRlcidcbiAgICAgICAgICAgICAgICBpZiBpdGVtID0gQGFjdGl2ZVJvdygpPy5pdGVtXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSBpdGVtLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgaWYgdHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdmaWxlYnJvd3NlcicgJ2xvYWRJdGVtJyBpdGVtLCBmb2N1czp0cnVlXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ29wZW5GaWxlJyBpdGVtLmZpbGVcbiAgICAgICAgQFxuXG4gICAgbmF2aWdhdGVSb290OiAoa2V5KSAtPiAjIG1vdmUgdG8gZmlsZSBicm93c2VyP1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAYnJvd3Nlci5icm93c2U/XG4gICAgICAgIEBicm93c2VyLmJyb3dzZSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBzbGFzaC5kaXIgQHBhcmVudC5maWxlXG4gICAgICAgICAgICB3aGVuICd1cCcgICAgdGhlbiBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIEBhY3RpdmVSb3coKS5pdGVtLmZpbGVcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICB0aGVuIHNsYXNoLnBrZyBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIHdoZW4gJ34nICAgICB0aGVuICd+J1xuICAgICAgICAgICAgd2hlbiAnLycgICAgIHRoZW4gJy8nXG4gICAgICAgIEBcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAgMDAwMDAwMDAwICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgXG4gICAgXG4gICAgZG9TZWFyY2g6IChjaGFyKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIFxuICAgICAgICBjbGVhclRpbWVvdXQgQHNlYXJjaFRpbWVyXG4gICAgICAgIEBzZWFyY2hUaW1lciA9IHNldFRpbWVvdXQgQGNsZWFyU2VhcmNoLCAyMDAwXG4gICAgICAgIEBzZWFyY2ggKz0gY2hhclxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEBzZWFyY2hEaXZcbiAgICAgICAgICAgIEBzZWFyY2hEaXYgPSBlbGVtIGNsYXNzOiAnYnJvd3NlclNlYXJjaCdcbiAgICAgICAgICAgIFxuICAgICAgICBAc2VhcmNoRGl2LnRleHRDb250ZW50ID0gQHNlYXJjaFxuXG4gICAgICAgIGFjdGl2ZUluZGV4ICA9IEBhY3RpdmVSb3coKT8uaW5kZXgoKSA/IDBcbiAgICAgICAgYWN0aXZlSW5kZXggKz0gMSBpZiAoQHNlYXJjaC5sZW5ndGggPT0gMSkgb3IgKGNoYXIgPT0gJycpXG4gICAgICAgIGFjdGl2ZUluZGV4ICA9IDAgaWYgYWN0aXZlSW5kZXggPj0gQG51bVJvd3MoKVxuICAgICAgICBcbiAgICAgICAgZm9yIHJvd3MgaW4gW0Byb3dzLnNsaWNlKGFjdGl2ZUluZGV4KSwgQHJvd3Muc2xpY2UoMCxhY3RpdmVJbmRleCsxKV1cbiAgICAgICAgICAgIGZ1enppZWQgPSBmdXp6eS5maWx0ZXIgQHNlYXJjaCwgcm93cywgZXh0cmFjdDogKHIpIC0+IHIuaXRlbS5uYW1lXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGZ1enppZWQubGVuZ3RoXG4gICAgICAgICAgICAgICAgcm93ID0gZnV6emllZFswXS5vcmlnaW5hbFxuICAgICAgICAgICAgICAgIHJvdy5kaXYuYXBwZW5kQ2hpbGQgQHNlYXJjaERpdlxuICAgICAgICAgICAgICAgIHJvdy5hY3RpdmF0ZSgpXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgQFxuICAgIFxuICAgIGNsZWFyU2VhcmNoOiA9PlxuICAgICAgICBcbiAgICAgICAgQHNlYXJjaCA9ICcnXG4gICAgICAgIEBzZWFyY2hEaXY/LnJlbW92ZSgpXG4gICAgICAgIGRlbGV0ZSBAc2VhcmNoRGl2XG4gICAgICAgIEBcbiAgICBcbiAgICByZW1vdmVPYmplY3Q6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiByb3cgPSBAYWN0aXZlUm93KClcbiAgICAgICAgICAgIEBicm93c2VyLmVtaXQgJ3dpbGxSZW1vdmVSb3cnIHJvdywgQFxuICAgICAgICAgICAgbmV4dE9yUHJldiA9IHJvdy5uZXh0KCkgPyByb3cucHJldigpXG4gICAgICAgICAgICBAcmVtb3ZlUm93IHJvd1xuICAgICAgICAgICAgbmV4dE9yUHJldj8uYWN0aXZhdGUoKVxuICAgICAgICBAXG5cbiAgICByZW1vdmVSb3c6IChyb3cpIC0+XG4gICAgICAgIFxuICAgICAgICByb3cuZGl2LnJlbW92ZSgpXG4gICAgICAgIEBpdGVtcy5zcGxpY2Ugcm93LmluZGV4KCksIDFcbiAgICAgICAgQHJvd3Muc3BsaWNlIHJvdy5pbmRleCgpLCAxXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNvcnRCeU5hbWU6IC0+XG4gICAgICAgICBcbiAgICAgICAgQHJvd3Muc29ydCAoYSxiKSAtPiBcbiAgICAgICAgICAgIChhLml0ZW0udHlwZSArIGEuaXRlbS5uYW1lKS5sb2NhbGVDb21wYXJlKGIuaXRlbS50eXBlICsgYi5pdGVtLm5hbWUpXG4gICAgICAgICAgICBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIEB0YWJsZS5hcHBlbmRDaGlsZCByb3cuZGl2XG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgc29ydEJ5VHlwZTogLT5cbiAgICAgICAgXG4gICAgICAgIEByb3dzLnNvcnQgKGEsYikgLT4gXG4gICAgICAgICAgICBhdHlwZSA9IGEuaXRlbS50eXBlID09ICdmaWxlJyBhbmQgc2xhc2guZXh0KGEuaXRlbS5uYW1lKSBvciAnX19fJyAjYS5pdGVtLnR5cGVcbiAgICAgICAgICAgIGJ0eXBlID0gYi5pdGVtLnR5cGUgPT0gJ2ZpbGUnIGFuZCBzbGFzaC5leHQoYi5pdGVtLm5hbWUpIG9yICdfX18nICNiLml0ZW0udHlwZVxuICAgICAgICAgICAgKGEuaXRlbS50eXBlICsgYXR5cGUgKyBhLml0ZW0ubmFtZSkubG9jYWxlQ29tcGFyZShiLml0ZW0udHlwZSArIGJ0eXBlICsgYi5pdGVtLm5hbWUsIHVuZGVmaW5lZCwgbnVtZXJpYzp0cnVlKVxuICAgICAgICAgICAgXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICBAdGFibGUuYXBwZW5kQ2hpbGQgcm93LmRpdlxuICAgICAgICBAXG4gIFxuICAgICMgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICB0b2dnbGVEb3RGaWxlczogPT5cblxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICBsb2cgJ2NvbHVtbi50b2dnbGVEb3RGaWxlcycgQHBhcmVudFxuICAgICAgICAgICAgQHBhcmVudC50eXBlID0gc2xhc2guaXNEaXIoQHBhcmVudC5maWxlKSBhbmQgJ2Rpcicgb3IgJ2ZpbGUnXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09ICdkaXInICAgICAgICAgICAgXG4gICAgICAgICAgICBzdGF0ZUtleSA9IFwiYnJvd3NlcuKWuHNob3dIaWRkZW7ilrgje0BwYXJlbnQuZmlsZX1cIlxuICAgICAgICAgICAgaWYgcHJlZnMuZ2V0IHN0YXRlS2V5XG4gICAgICAgICAgICAgICAgcHJlZnMuZGVsIHN0YXRlS2V5XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcHJlZnMuc2V0IHN0YXRlS2V5LCB0cnVlXG4gICAgICAgICAgICBAYnJvd3Nlci5sb2FkRGlySXRlbSBAcGFyZW50LCBAaW5kZXgsIGlnbm9yZUNhY2hlOnRydWVcbiAgICAgICAgQFxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBtb3ZlVG9UcmFzaDogPT5cbiAgICAgICAgXG4gICAgICAgIHBhdGhUb1RyYXNoID0gQGFjdGl2ZVBhdGgoKVxuICAgICAgICBAcmVtb3ZlT2JqZWN0KClcbiAgICAgICAgXG4gICAgICAgIHRyYXNoKFtwYXRoVG9UcmFzaF0pLmNhdGNoIChlcnIpIC0+IGVycm9yIFwiZmFpbGVkIHRvIHRyYXNoICN7cGF0aFRvVHJhc2h9ICN7ZXJyfVwiXG5cbiAgICBhZGRUb1NoZWxmOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgcGF0aFRvU2hlbGYgPSBAYWN0aXZlUGF0aCgpXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2FkZFRvU2hlbGYnIHBhdGhUb1NoZWxmXG4gICAgICAgIFxuICAgIGR1cGxpY2F0ZUZpbGU6ID0+XG4gICAgICAgIFxuICAgICAgICB1bnVzZWRGaWxlbmFtZSA9IHJlcXVpcmUgJ3VudXNlZC1maWxlbmFtZSdcbiAgICAgICAgdW51c2VkRmlsZW5hbWUoQGFjdGl2ZVBhdGgoKSkudGhlbiAoZmlsZU5hbWUpID0+XG4gICAgICAgICAgICBmaWxlTmFtZSA9IHNsYXNoLnBhdGggZmlsZU5hbWVcbiAgICAgICAgICAgIGlmIGZzLmNvcHk/ICMgZnMuY29weUZpbGUgaW4gbm9kZSA+IDguNFxuICAgICAgICAgICAgICAgIGZzLmNvcHkgQGFjdGl2ZVBhdGgoKSwgZmlsZU5hbWUsIChlcnIpID0+XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnJvciAnY29weSBmaWxlIGZhaWxlZCcgZXJyIGlmIGVycj9cbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9IHR5cGU6J2ZpbGUnIGZpbGU6c2xhc2guam9pbiBzbGFzaC5kaXIoQGFjdGl2ZVBhdGgoKSksIGZpbGVOYW1lXG4gICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZmlsZWJyb3dzZXInICdsb2FkSXRlbScgaXRlbSwgZm9jdXM6dHJ1ZVxuICAgICAgICAgICAgICAgICAgICAjIHBvc3QuZW1pdCAnbG9hZEZpbGUnIGZpbGVOYW1lXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBleHBsb3JlcjogPT5cbiAgICAgICAgXG4gICAgICAgIG9wZW4gc2xhc2guZGlyIEBhY3RpdmVQYXRoKClcbiAgICAgICAgXG4gICAgb3BlbjogPT5cbiAgICAgICAgXG4gICAgICAgIG9wZW4gQGFjdGl2ZVBhdGgoKVxuICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIFxuICAgICAgICBcbiAgICBtYWtlUm9vdDogPT4gXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5zaGlmdENvbHVtbnNUbyBAaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGlmIEBicm93c2VyLmNvbHVtbnNbMF0uaXRlbXNbMF0ubmFtZSAhPSAnLi4nXG4gICAgICAgICAgICBAdW5zaGlmdEl0ZW0gXG4gICAgICAgICAgICAgICAgbmFtZTogJy4uJ1xuICAgICAgICAgICAgICAgIHR5cGU6ICdkaXInXG4gICAgICAgICAgICAgICAgZmlsZTogc2xhc2guZGlyIEBwYXJlbnQuZmlsZVxuICAgIFxuICAgIG9uQ29udGV4dE1lbnU6IChldmVudCwgY29sdW1uKSA9PiBcbiAgICAgICAgXG4gICAgICAgIHN0b3BFdmVudCBldmVudFxuICAgICAgICBcbiAgICAgICAgYWJzUG9zID0ga3BvcyBldmVudFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGNvbHVtblxuICAgICAgICAgICAgQHNob3dDb250ZXh0TWVudSBhYnNQb3NcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBvcHQgPSBpdGVtczogWyBcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICdSb290J1xuICAgICAgICAgICAgICAgIGNiOiAgICAgQG1ha2VSb290XG4gICAgICAgICAgICAsXG4gICAgICAgICAgICAgICAgdGV4dDogICAnQWRkIHRvIFNoZWxmJ1xuICAgICAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtzaGlmdCsuJ1xuICAgICAgICAgICAgICAgIGNiOiAgICAgPT4gcG9zdC5lbWl0ICdhZGRUb1NoZWxmJyBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgICxcbiAgICAgICAgICAgICAgICB0ZXh0OiAgICdFeHBsb3JlcidcbiAgICAgICAgICAgICAgICBjb21ibzogICdhbHQrZScgXG4gICAgICAgICAgICAgICAgY2I6ICAgICA9PiBvcGVuIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgICAgICBvcHQueSA9IGFic1Bvcy55XG4gICAgICAgICAgICBwb3B1cC5tZW51IG9wdCAgICBcbiAgICAgICAgICAgICAgXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IGtwb3MgQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0LCBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcFxuICAgICAgICBcbiAgICAgICAgb3B0ID0gaXRlbXM6IFsgXG4gICAgICAgICAgICB0ZXh0OiAgICdUb2dnbGUgSW52aXNpYmxlJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtpJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHRvZ2dsZURvdEZpbGVzXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ1JlZnJlc2gnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK3InIFxuICAgICAgICAgICAgY2I6ICAgICBAYnJvd3Nlci5yZWZyZXNoXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0R1cGxpY2F0ZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrZCcgXG4gICAgICAgICAgICBjYjogICAgIEBkdXBsaWNhdGVGaWxlXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ01vdmUgdG8gVHJhc2gnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2JhY2tzcGFjZScgXG4gICAgICAgICAgICBjYjogICAgIEBtb3ZlVG9UcmFzaFxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdBZGQgdG8gU2hlbGYnXG4gICAgICAgICAgICBjb21ibzogICdhbHQrc2hpZnQrLidcbiAgICAgICAgICAgIGNiOiAgICAgQGFkZFRvU2hlbGZcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnRXhwbG9yZXInXG4gICAgICAgICAgICBjb21ibzogICdhbHQrZScgXG4gICAgICAgICAgICBjYjogICAgIEBleHBsb3JlclxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdPcGVuJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K28nIFxuICAgICAgICAgICAgY2I6ICAgICBAb3BlblxuICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICBvcHQuaXRlbXMgPSBvcHQuaXRlbXMuY29uY2F0IHdpbmRvdy50aXRsZWJhci5tYWtlVGVtcGxhdGUgcmVxdWlyZSAnLi9tZW51Lmpzb24nXG4gICAgICAgIFxuICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgcG9wdXAubWVudSBvcHQgICAgICAgIFxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG9uS2V5OiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnc2hpZnQrYCcgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5sb2FkRGlyIHNsYXNoLnJlc29sdmUgJ34nXG4gICAgICAgICAgICB3aGVuICcvJyAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLmxvYWREaXIgJy8nXG4gICAgICAgICAgICB3aGVuICdhbHQrZScgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAZXhwbG9yZXIoKVxuICAgICAgICAgICAgd2hlbiAnYWx0K28nICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQG9wZW4oKVxuICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcgJ3BhZ2UgZG93bicgJ2hvbWUnICdlbmQnIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlQ29scyBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrbGVmdCcgJ2NvbW1hbmQrdXAnICdjb21tYW5kK3JpZ2h0JyAnY29tbWFuZCtkb3duJyAnY3RybCtsZWZ0JyAnY3RybCt1cCcgJ2N0cmwrcmlnaHQnICdjdHJsK2Rvd24nXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm9vdCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrYmFja3NwYWNlJyAnY3RybCtiYWNrc3BhY2UnICdjb21tYW5kK2RlbGV0ZScgJ2N0cmwrZGVsZXRlJyBcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbW92ZVRvVHJhc2goKVxuICAgICAgICAgICAgd2hlbiAnYWx0K2xlZnQnICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCAkKCdzaGVsZicpPy5mb2N1cz8oKVxuICAgICAgICAgICAgd2hlbiAnYWx0K3NoaWZ0K2xlZnQnICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci50b2dnbGVTaGVsZigpXG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnICdkZWxldGUnICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBicm93c2VyLm9uQmFja3NwYWNlSW5Db2x1bW4gQFxuICAgICAgICAgICAgd2hlbiAnY3RybCt0JyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAc29ydEJ5VHlwZSgpXG4gICAgICAgICAgICB3aGVuICdjdHJsK24nICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBzb3J0QnlOYW1lKClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQraScgJ2N0cmwraScgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHRvZ2dsZURvdEZpbGVzKClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZCcgJ2N0cmwrZCcgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGR1cGxpY2F0ZUZpbGUoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtrJyAnY3RybCtrJyAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50IGlmIEBicm93c2VyLmNsZWFuVXAoKVxuICAgICAgICAgICAgd2hlbiAnZjInICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYWN0aXZlUm93KCk/LmVkaXROYW1lKClcbiAgICAgICAgICAgIHdoZW4gJ3RhYicgICAgXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAZG9TZWFyY2ggJydcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAY2xlYXJTZWFyY2goKVxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnRcblxuICAgICAgICBpZiBrZXkgaW4gWyd1cCcgICAnZG93biddICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3Mga2V5ICAgICAgICAgICAgICBcbiAgICAgICAgaWYga2V5IGluIFsnbGVmdCcgJ3JpZ2h0J10gdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVDb2xzIGtleSAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNoYXJcbiAgICAgICAgICAgIHdoZW4gJ34nICcvJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvb3QgY2hhclxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG1vZCBpbiBbJ3NoaWZ0JyAnJ10gYW5kIGNoYXIgdGhlbiBAZG9TZWFyY2ggY2hhclxuICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBDb2x1bW5cblxuXG4iXX0=
//# sourceURL=../coffee/column.coffee