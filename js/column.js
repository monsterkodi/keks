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
        this.open = bind(this.open, this);
        this.explorer = bind(this.explorer, this);
        this.duplicateFile = bind(this.duplicateFile, this);
        this.addToShelf = bind(this.addToShelf, this);
        this.moveToTrash = bind(this.moveToTrash, this);
        this.toggleExtensions = bind(this.toggleExtensions, this);
        this.toggleDotFiles = bind(this.toggleDotFiles, this);
        this.removeObject = bind(this.removeObject, this);
        this.clearSearch = bind(this.clearSearch, this);
        this.onDblClick = bind(this.onDblClick, this);
        this.onClick = bind(this.onClick, this);
        this.onMouseOut = bind(this.onMouseOut, this);
        this.onMouseOver = bind(this.onMouseOver, this);
        this.onBlur = bind(this.onBlur, this);
        this.onFocus = bind(this.onFocus, this);
        this.index = (ref1 = this.browser.columns) != null ? ref1.length : void 0;
        this.searchTimer = null;
        this.search = '';
        this.items = [];
        this.rows = [];
        this.div = elem({
            "class": 'browserColumn',
            tabIndex: 6,
            id: this.name()
        });
        this.table = elem({
            "class": 'browserColumnTable'
        });
        this.div.appendChild(this.table);
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
        this.div.addEventListener("contextmenu", this.onContextMenu);
        this.scroll = new Scroller(this);
    }

    Column.prototype.loadItems = function(items, parent) {
        var i, item, len, ref1;
        this.browser.clearColumn(this.index);
        this.items = items;
        this.parent = parent;
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
            return a.item.name.localeCompare(b.item.name);
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
            atype = a.item.type === 'file' && slash.ext(a.item.name) || a.item.type;
            btype = b.item.type === 'file' && slash.ext(b.item.name) || b.item.type;
            return (atype + a.item.name).localeCompare(btype + b.item.name);
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

    Column.prototype.toggleExtensions = function() {
        var stateKey;
        stateKey = "browser▸hideExtensions";
        prefs.set(stateKey, !prefs.get(stateKey, false));
        setStyle('.browserRow .ext', 'display', prefs.get(stateKey) && 'none' || 'initial');
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
                        if (err != null) {
                            return console.error('copy file failed', err);
                        }
                        return post.emit('loadFile', fileName);
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

    Column.prototype.onContextMenu = function(event) {
        return stopEvent(event, this.showContextMenu(kpos(event)));
    };

    Column.prototype.showContextMenu = function(absPos) {
        var opt;
        if (absPos == null) {
            absPos = kpos(this.view.getBoundingClientRect().left, this.view.getBoundingClientRect().top);
        }
        opt = {
            items: [
                {
                    text: 'Toggle Invisible',
                    combo: 'ctrl+i',
                    cb: this.toggleDotFiles
                }, {
                    text: 'Toggle Extensions',
                    combo: 'ctrl+e',
                    cb: this.toggleExtensions
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
        opt.x = absPos.x;
        opt.y = absPos.y;
        return popup.menu(opt);
    };

    Column.prototype.onKey = function(event) {
        var char, combo, key, mod, ref1, ref2, ref3;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo, char = ref1.char;
        klog('column.onKey', combo);
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
            case 'command+e':
            case 'ctrl+e':
                return stopEvent(event, this.toggleExtensions());
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sdW1uLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx1S0FBQTtJQUFBOztBQVFBLE1BQW9JLE9BQUEsQ0FBUSxLQUFSLENBQXBJLEVBQUUsZUFBRixFQUFRLGlCQUFSLEVBQWUseUJBQWYsRUFBMEIsdUJBQTFCLEVBQW9DLHFCQUFwQyxFQUE2QyxpQkFBN0MsRUFBb0QsaUJBQXBELEVBQTJELGlCQUEzRCxFQUFrRSxpQkFBbEUsRUFBeUUsaUJBQXpFLEVBQWdGLGlCQUFoRixFQUF1RixlQUF2RixFQUE2RixlQUE3RixFQUFtRyxlQUFuRyxFQUF5RyxXQUF6RyxFQUE2RyxlQUE3RyxFQUFtSCxtQkFBbkgsRUFBMkgsU0FBM0gsRUFBOEg7O0FBRTlILEdBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFFTDtJQUVXLGdCQUFDLE9BQUQ7QUFFVCxZQUFBO1FBRlUsSUFBQyxDQUFBLFVBQUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7UUFFVixJQUFDLENBQUEsS0FBRCwrQ0FBeUIsQ0FBRTtRQUMzQixJQUFDLENBQUEsV0FBRCxHQUFlO1FBQ2YsSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxLQUFELEdBQVU7UUFDVixJQUFDLENBQUEsSUFBRCxHQUFVO1FBRVYsSUFBQyxDQUFBLEdBQUQsR0FBUyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGVBQVA7WUFBdUIsUUFBQSxFQUFVLENBQWpDO1lBQW9DLEVBQUEsRUFBSSxJQUFDLENBQUEsSUFBRCxDQUFBLENBQXhDO1NBQUw7UUFDVCxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sb0JBQVA7U0FBTDtRQUNULElBQUMsQ0FBQSxHQUFHLENBQUMsV0FBTCxDQUFpQixJQUFDLENBQUEsS0FBbEI7O2dCQUVhLENBQUUsV0FBZixDQUEyQixJQUFDLENBQUEsR0FBNUI7O1FBRUEsSUFBQyxDQUFBLEdBQUcsQ0FBQyxnQkFBTCxDQUFzQixPQUF0QixFQUFrQyxJQUFDLENBQUEsT0FBbkM7UUFDQSxJQUFDLENBQUEsR0FBRyxDQUFDLGdCQUFMLENBQXNCLE1BQXRCLEVBQWtDLElBQUMsQ0FBQSxNQUFuQztRQUNBLElBQUMsQ0FBQSxHQUFHLENBQUMsZ0JBQUwsQ0FBc0IsU0FBdEIsRUFBa0MsSUFBQyxDQUFBLEtBQW5DO1FBRUEsSUFBQyxDQUFBLEdBQUcsQ0FBQyxnQkFBTCxDQUFzQixXQUF0QixFQUFrQyxJQUFDLENBQUEsV0FBbkM7UUFDQSxJQUFDLENBQUEsR0FBRyxDQUFDLGdCQUFMLENBQXNCLFVBQXRCLEVBQWtDLElBQUMsQ0FBQSxVQUFuQztRQUVBLElBQUMsQ0FBQSxHQUFHLENBQUMsZ0JBQUwsQ0FBc0IsU0FBdEIsRUFBa0MsSUFBQyxDQUFBLE9BQW5DO1FBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxnQkFBTCxDQUFzQixVQUF0QixFQUFrQyxJQUFDLENBQUEsVUFBbkM7UUFFQSxJQUFDLENBQUEsR0FBRyxDQUFDLGdCQUFMLENBQXNCLGFBQXRCLEVBQXFDLElBQUMsQ0FBQSxhQUF0QztRQUVBLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBSSxRQUFKLENBQWEsSUFBYjtJQTFCRDs7cUJBa0NiLFNBQUEsR0FBVyxTQUFDLEtBQUQsRUFBUSxNQUFSO0FBRVAsWUFBQTtRQUFBLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxDQUFxQixJQUFDLENBQUEsS0FBdEI7UUFFQSxJQUFDLENBQUEsS0FBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUVWLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFSLEtBQWdCLE1BQW5CO1lBQ0csT0FBQSxDQUFDLEdBQUQsQ0FBSyxrQkFBTCxFQUF3QixNQUFBLENBQU8sSUFBQyxDQUFBLE1BQVIsQ0FBeEI7WUFDQyxJQUFDLENBQUEsTUFBTSxDQUFDLElBQVIsR0FBZSxLQUFLLENBQUMsS0FBTixDQUFZLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBcEIsQ0FBQSxJQUE4QixLQUE5QixJQUF1QyxPQUYxRDs7UUFJQSxJQUFnQyxtQkFBaEM7WUFBQSxNQUFBLENBQU8saUJBQVAsRUFBQTs7UUFDQSxJQUFzRCx3QkFBdEQ7WUFBQSxNQUFBLENBQU8sOEJBQVAsRUFBdUMsSUFBQyxDQUFBLE1BQXhDLEVBQUE7O1FBRUEsSUFBRyxLQUFBLENBQU0sSUFBQyxDQUFBLEtBQVAsQ0FBSDtBQUNJO0FBQUEsaUJBQUEsc0NBQUE7O2dCQUNJLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBTixDQUFXLElBQUksR0FBSixDQUFRLElBQVIsRUFBVyxJQUFYLENBQVg7QUFESjtZQUdBLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBUixDQUFBLEVBSko7O2VBS0E7SUFuQk87O3FCQXFCWCxRQUFBLEdBQVUsU0FBQyxNQUFELEVBQVMsR0FBVDtBQUVOLFlBQUE7UUFGTyxJQUFDLENBQUEsUUFBRDtRQUVQLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxDQUFxQixJQUFDLENBQUEsS0FBdEI7UUFFQSxJQUFDLENBQUEsTUFBRCxHQUFVLEdBQUcsQ0FBQztRQUNkLElBQWdDLG1CQUFoQztZQUFBLE1BQUEsQ0FBTyxpQkFBUCxFQUFBOztRQUNBLElBQXFELHdCQUFyRDtZQUFBLE1BQUEsQ0FBTyw2QkFBUCxFQUFzQyxJQUFDLENBQUEsTUFBdkMsRUFBQTs7QUFFQTtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLENBQVcsSUFBSSxHQUFKLENBQVEsSUFBUixFQUFXLElBQVgsQ0FBWDtBQURKO1FBR0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFSLENBQUE7ZUFDQTtJQVpNOztxQkFjVixLQUFBLEdBQVEsU0FBQTtlQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBUixLQUFnQjtJQUFuQjs7cUJBQ1IsTUFBQSxHQUFRLFNBQUE7ZUFBRyxJQUFDLENBQUEsTUFBTSxDQUFDLElBQVIsS0FBZ0I7SUFBbkI7O3FCQUVSLE9BQUEsR0FBUyxTQUFBO2VBQUcsS0FBQSxDQUFNLElBQUMsQ0FBQSxJQUFQO0lBQUg7O3FCQUNULEtBQUEsR0FBUyxTQUFBO0FBQ0wsWUFBQTtRQUFBLElBQUMsQ0FBQSxXQUFELENBQUE7UUFDQSxPQUFPLElBQUMsQ0FBQTtRQUNSLElBQUMsQ0FBQSxHQUFHLENBQUMsU0FBTCxHQUFpQjs7Z0JBQ1YsQ0FBRSxHQUFULENBQUE7O1FBQ0EsSUFBQyxDQUFBLEtBQUssQ0FBQyxTQUFQLEdBQW1CO1FBQ25CLElBQUMsQ0FBQSxJQUFELEdBQVE7ZUFDUixJQUFDLENBQUEsTUFBTSxDQUFDLE1BQVIsQ0FBQTtJQVBLOztxQkFlVCxXQUFBLEdBQWMsU0FBQyxHQUFEO0FBQVMsWUFBQTtvREFBUyxDQUFFLFFBQVgsQ0FBQTtJQUFUOztxQkFFZCxTQUFBLEdBQVcsU0FBQTtlQUFHLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBQyxDQUFBLElBQVIsRUFBYyxTQUFDLENBQUQ7bUJBQU8sQ0FBQyxDQUFDLFFBQUYsQ0FBQTtRQUFQLENBQWQ7SUFBSDs7cUJBQ1gsVUFBQSxHQUFZLFNBQUE7QUFBRyxZQUFBO3VEQUFZLENBQUUsSUFBZCxDQUFBO0lBQUg7O3FCQUVaLEdBQUEsR0FBSyxTQUFDLEdBQUQ7UUFDRCxJQUFRLENBQUMsQ0FBQyxRQUFGLENBQVksR0FBWixDQUFSO0FBQTZCLG1CQUFPLENBQUEsQ0FBQSxJQUFLLEdBQUwsSUFBSyxHQUFMLEdBQVcsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFYLENBQUEsSUFBMEIsSUFBQyxDQUFBLElBQUssQ0FBQSxHQUFBLENBQWhDLElBQXdDLEtBQTVFO1NBQUEsTUFDSyxJQUFHLENBQUMsQ0FBQyxTQUFGLENBQVksR0FBWixDQUFIO0FBQXdCLG1CQUFPLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBQyxDQUFBLElBQVIsRUFBYyxTQUFDLENBQUQ7dUJBQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFOLENBQWUsR0FBZjtZQUFQLENBQWQsRUFBL0I7U0FBQSxNQUNBLElBQUcsQ0FBQyxDQUFDLFFBQUYsQ0FBWSxHQUFaLENBQUg7QUFBd0IsbUJBQU8sQ0FBQyxDQUFDLElBQUYsQ0FBTyxJQUFDLENBQUEsSUFBUixFQUFjLFNBQUMsQ0FBRDt1QkFBTyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQVAsS0FBZTtZQUF0QixDQUFkLEVBQS9CO1NBQUEsTUFBQTtBQUNBLG1CQUFPLElBRFA7O0lBSEo7O3FCQU1MLFVBQUEsR0FBWSxTQUFBO2VBQUcsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULENBQWdCLElBQUMsQ0FBQSxLQUFELEdBQU8sQ0FBdkI7SUFBSDs7cUJBQ1osVUFBQSxHQUFZLFNBQUE7ZUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsQ0FBZ0IsSUFBQyxDQUFBLEtBQUQsR0FBTyxDQUF2QjtJQUFIOztxQkFFWixJQUFBLEdBQU0sU0FBQTtlQUFNLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVixHQUFlLEdBQWYsR0FBa0IsSUFBQyxDQUFBO0lBQXhCOztxQkFDTixJQUFBLEdBQU0sU0FBQTtBQUFHLFlBQUE7MkZBQWdCO0lBQW5COztxQkFFTixPQUFBLEdBQVksU0FBQTtBQUFHLFlBQUE7MERBQWU7SUFBbEI7O3FCQUNaLFNBQUEsR0FBWSxTQUFBO0FBQUcsWUFBQTt3R0FBNkI7SUFBaEM7O3FCQUNaLFVBQUEsR0FBWSxTQUFBO2VBQUcsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFBLElBQWlCLFFBQUEsQ0FBUyxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsQ0FBQSxDQUFBLEdBQW9CLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FBN0IsQ0FBakIsSUFBK0Q7SUFBbEU7O3FCQUVaLGFBQUEsR0FBZSxTQUFDLEdBQUQ7ZUFFWCxJQUFJLENBQUMsR0FBTCxDQUFTLENBQVQsRUFBWSxJQUFJLENBQUMsS0FBTCxDQUFXLENBQUMsR0FBRyxDQUFDLENBQUosR0FBUSxJQUFDLENBQUEsR0FBRyxDQUFDLHFCQUFMLENBQUEsQ0FBNEIsQ0FBQyxHQUF0QyxDQUFBLEdBQTZDLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FBeEQsQ0FBWjtJQUZXOztxQkFVZixRQUFBLEdBQVUsU0FBQTtlQUFHLElBQUMsQ0FBQSxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQWYsQ0FBd0IsT0FBeEI7SUFBSDs7cUJBRVYsS0FBQSxHQUFPLFNBQUMsR0FBRDs7WUFBQyxNQUFJOztRQUNSLElBQUcsQ0FBSSxJQUFDLENBQUEsU0FBRCxDQUFBLENBQUosSUFBcUIsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFyQixtQkFBb0MsR0FBRyxDQUFFLGtCQUFMLEtBQWlCLEtBQXhEO1lBQ0ksSUFBQyxDQUFBLElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQyxTQUFULENBQUEsRUFESjs7UUFFQSxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUwsQ0FBQTtlQUNBO0lBSkc7O3FCQU1QLE9BQUEsR0FBUyxTQUFBO2VBQUcsSUFBQyxDQUFBLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBZixDQUFtQixPQUFuQjtJQUFIOztxQkFDVCxNQUFBLEdBQVMsU0FBQTtlQUFHLElBQUMsQ0FBQSxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQWYsQ0FBc0IsT0FBdEI7SUFBSDs7cUJBRVQsWUFBQSxHQUFjLFNBQUE7ZUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDLEtBQVQsQ0FBQTtJQUFIOztxQkFRZCxXQUFBLEdBQWEsU0FBQyxLQUFEO0FBQVcsWUFBQTs2REFBa0IsQ0FBRSxXQUFwQixDQUFBO0lBQVg7O3FCQUNiLFVBQUEsR0FBYSxTQUFDLEtBQUQ7QUFBVyxZQUFBOzZEQUFrQixDQUFFLFVBQXBCLENBQUE7SUFBWDs7cUJBQ2IsT0FBQSxHQUFhLFNBQUMsS0FBRDtBQUFXLFlBQUE7NkRBQWtCLENBQUUsUUFBcEIsQ0FBNkIsS0FBN0I7SUFBWDs7cUJBQ2IsVUFBQSxHQUFhLFNBQUMsS0FBRDtlQUFXLElBQUMsQ0FBQSxZQUFELENBQWMsT0FBZDtJQUFYOztxQkFRYixZQUFBLEdBQWMsU0FBQyxHQUFEO0FBRVYsWUFBQTtRQUFBLElBQStDLENBQUksSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFuRDtBQUFBLG1CQUFLLE9BQUEsQ0FBRSxLQUFGLENBQVEsb0JBQUEsR0FBcUIsSUFBQyxDQUFBLEtBQXRCLEdBQTRCLEdBQXBDLEVBQUw7O1FBQ0EsS0FBQSx1RkFBZ0MsQ0FBQztRQUFDLElBQzhCLGVBQUosSUFBYyxNQUFNLENBQUMsS0FBUCxDQUFhLEtBQWIsQ0FEeEM7WUFBQSxPQUFBLENBQ2xDLEtBRGtDLENBQzVCLDJCQUFBLEdBQTRCLEtBQTVCLEdBQWtDLEdBRE4sRUFDVSxJQUFDLENBQUEsU0FBRCxDQUFBLENBRFYsRUFBQTs7UUFHbEMsS0FBQTtBQUFRLG9CQUFPLEdBQVA7QUFBQSxxQkFDQyxJQUREOzJCQUNrQixLQUFBLEdBQU07QUFEeEIscUJBRUMsTUFGRDsyQkFFa0IsS0FBQSxHQUFNO0FBRnhCLHFCQUdDLE1BSEQ7MkJBR2tCO0FBSGxCLHFCQUlDLEtBSkQ7MkJBSWtCLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBQSxHQUFXO0FBSjdCLHFCQUtDLFNBTEQ7MkJBS2tCLEtBQUEsR0FBTSxJQUFDLENBQUEsVUFBRCxDQUFBO0FBTHhCLHFCQU1DLFdBTkQ7MkJBTWtCLEtBQUEsR0FBTSxJQUFDLENBQUEsVUFBRCxDQUFBO0FBTnhCOzJCQU9DO0FBUEQ7O1FBU1IsSUFBbUQsZUFBSixJQUFjLE1BQU0sQ0FBQyxLQUFQLENBQWEsS0FBYixDQUE3RDtZQUFBLE9BQUEsQ0FBQSxLQUFBLENBQU0sV0FBQSxHQUFZLEtBQVosR0FBa0IsSUFBbEIsR0FBcUIsQ0FBQyxJQUFDLENBQUEsVUFBRCxDQUFBLENBQUQsQ0FBM0IsRUFBQTs7UUFDQSxLQUFBLEdBQVEsS0FBQSxDQUFNLENBQU4sRUFBUyxJQUFDLENBQUEsT0FBRCxDQUFBLENBQUEsR0FBVyxDQUFwQixFQUF1QixLQUF2QjtRQUE0QixJQUVpQyxvRUFGakM7WUFBQSxPQUFBLENBRXBDLEtBRm9DLENBRTlCLGtCQUFBLEdBQW1CLEtBQW5CLEdBQXlCLEdBQXpCLEdBQTJCLENBQUMsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFBLEdBQVcsQ0FBWixDQUEzQixHQUF5QyxHQUZYLEVBRWUsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUZmLEVBQUE7O2VBR3BDLElBQUMsQ0FBQSxJQUFLLENBQUEsS0FBQSxDQUFNLENBQUMsUUFBYixDQUFBO0lBbkJVOztxQkFxQmQsWUFBQSxHQUFjLFNBQUMsR0FBRDtBQUVWLFlBQUE7QUFBQSxnQkFBTyxHQUFQO0FBQUEsaUJBQ1MsTUFEVDtnQkFDc0IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxRQUFULENBQWtCLE1BQWxCO0FBQWI7QUFEVCxpQkFFUyxPQUZUO2dCQUVzQixJQUFDLENBQUEsT0FBTyxDQUFDLFFBQVQsQ0FBa0IsT0FBbEI7QUFBYjtBQUZULGlCQUdTLE9BSFQ7Z0JBSVEsSUFBRyxJQUFBLDJDQUFtQixDQUFFLGFBQXhCO29CQUNJLElBQUEsR0FBTyxJQUFJLENBQUM7b0JBQ1osSUFBRyxJQUFBLEtBQVEsS0FBWDt3QkFDSSxJQUFJLENBQUMsSUFBTCxDQUFVLGFBQVYsRUFBd0IsVUFBeEIsRUFBbUMsSUFBbkMsRUFBeUM7NEJBQUEsS0FBQSxFQUFNLElBQU47eUJBQXpDLEVBREo7cUJBQUEsTUFFSyxJQUFHLElBQUksQ0FBQyxJQUFSO3dCQUNELElBQUksQ0FBQyxJQUFMLENBQVUsVUFBVixFQUFxQixJQUFJLENBQUMsSUFBMUIsRUFEQztxQkFKVDs7QUFKUjtlQVVBO0lBWlU7O3FCQWNkLFlBQUEsR0FBYyxTQUFDLEdBQUQ7UUFFVixJQUFjLDJCQUFkO0FBQUEsbUJBQUE7O1FBQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFUO0FBQWdCLG9CQUFPLEdBQVA7QUFBQSxxQkFDUCxNQURPOzJCQUNNLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFsQjtBQUROLHFCQUVQLElBRk87MkJBRU0sSUFBQyxDQUFBLE1BQU0sQ0FBQztBQUZkLHFCQUdQLE9BSE87MkJBR00sSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFZLENBQUMsSUFBSSxDQUFDO0FBSHhCLHFCQUlQLE1BSk87MkJBSU0sS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFDLENBQUEsTUFBTSxDQUFDLElBQWxCO0FBSk4scUJBS1AsR0FMTzsyQkFLTTtBQUxOLHFCQU1QLEdBTk87MkJBTU07QUFOTjtxQkFBaEI7ZUFPQTtJQVZVOztxQkFrQmQsUUFBQSxHQUFVLFNBQUMsSUFBRDtBQUVOLFlBQUE7UUFBQSxJQUFVLENBQUksSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFkO0FBQUEsbUJBQUE7O1FBRUEsWUFBQSxDQUFhLElBQUMsQ0FBQSxXQUFkO1FBQ0EsSUFBQyxDQUFBLFdBQUQsR0FBZSxVQUFBLENBQVcsSUFBQyxDQUFBLFdBQVosRUFBeUIsSUFBekI7UUFDZixJQUFDLENBQUEsTUFBRCxJQUFXO1FBRVgsSUFBRyxDQUFJLElBQUMsQ0FBQSxTQUFSO1lBQ0ksSUFBQyxDQUFBLFNBQUQsR0FBYSxJQUFBLENBQUs7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxlQUFQO2FBQUwsRUFEakI7O1FBR0EsSUFBQyxDQUFBLFNBQVMsQ0FBQyxXQUFYLEdBQXlCLElBQUMsQ0FBQTtRQUUxQixXQUFBLHVGQUF1QztRQUN2QyxJQUFvQixDQUFDLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBUixLQUFrQixDQUFuQixDQUFBLElBQXlCLENBQUMsSUFBQSxLQUFRLEVBQVQsQ0FBN0M7WUFBQSxXQUFBLElBQWUsRUFBZjs7UUFDQSxJQUFvQixXQUFBLElBQWUsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFuQztZQUFBLFdBQUEsR0FBZSxFQUFmOztBQUVBO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxPQUFBLEdBQVUsS0FBSyxDQUFDLE1BQU4sQ0FBYSxJQUFDLENBQUEsTUFBZCxFQUFzQixJQUF0QixFQUE0QjtnQkFBQSxPQUFBLEVBQVMsU0FBQyxDQUFEOzJCQUFPLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQWQsQ0FBVDthQUE1QjtZQUVWLElBQUcsT0FBTyxDQUFDLE1BQVg7Z0JBQ0ksR0FBQSxHQUFNLE9BQVEsQ0FBQSxDQUFBLENBQUUsQ0FBQztnQkFDakIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxXQUFSLENBQW9CLElBQUMsQ0FBQSxTQUFyQjtnQkFDQSxHQUFHLENBQUMsUUFBSixDQUFBO0FBQ0Esc0JBSko7O0FBSEo7ZUFRQTtJQXpCTTs7cUJBMkJWLFdBQUEsR0FBYSxTQUFBO0FBRVQsWUFBQTtRQUFBLElBQUMsQ0FBQSxNQUFELEdBQVU7O2dCQUNBLENBQUUsTUFBWixDQUFBOztRQUNBLE9BQU8sSUFBQyxDQUFBO2VBQ1I7SUFMUzs7cUJBT2IsWUFBQSxHQUFjLFNBQUE7QUFFVixZQUFBO1FBQUEsSUFBRyxHQUFBLEdBQU0sSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFUO1lBQ0ksSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsZUFBZCxFQUE4QixHQUE5QixFQUFtQyxJQUFuQztZQUNBLFVBQUEsd0NBQTBCLEdBQUcsQ0FBQyxJQUFKLENBQUE7WUFDMUIsSUFBQyxDQUFBLFNBQUQsQ0FBVyxHQUFYOztnQkFDQSxVQUFVLENBQUUsUUFBWixDQUFBO2FBSko7O2VBS0E7SUFQVTs7cUJBU2QsU0FBQSxHQUFXLFNBQUMsR0FBRDtRQUVQLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBUixDQUFBO1FBQ0EsSUFBQyxDQUFBLEtBQUssQ0FBQyxNQUFQLENBQWMsR0FBRyxDQUFDLEtBQUosQ0FBQSxDQUFkLEVBQTJCLENBQTNCO2VBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFOLENBQWEsR0FBRyxDQUFDLEtBQUosQ0FBQSxDQUFiLEVBQTBCLENBQTFCO0lBSk87O3FCQVlYLFVBQUEsR0FBWSxTQUFBO0FBRVIsWUFBQTtRQUFBLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBTixDQUFXLFNBQUMsQ0FBRCxFQUFHLENBQUg7bUJBQ1AsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBWixDQUEwQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQWpDO1FBRE8sQ0FBWDtRQUdBLElBQUMsQ0FBQSxLQUFLLENBQUMsU0FBUCxHQUFtQjtBQUNuQjtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksSUFBQyxDQUFBLEtBQUssQ0FBQyxXQUFQLENBQW1CLEdBQUcsQ0FBQyxHQUF2QjtBQURKO2VBRUE7SUFSUTs7cUJBVVosVUFBQSxHQUFZLFNBQUE7QUFFUixZQUFBO1FBQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLENBQVcsU0FBQyxDQUFELEVBQUcsQ0FBSDtBQUNQLGdCQUFBO1lBQUEsS0FBQSxHQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBUCxLQUFlLE1BQWYsSUFBMEIsS0FBSyxDQUFDLEdBQU4sQ0FBVSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQWpCLENBQTFCLElBQW9ELENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkUsS0FBQSxHQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBUCxLQUFlLE1BQWYsSUFBMEIsS0FBSyxDQUFDLEdBQU4sQ0FBVSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQWpCLENBQTFCLElBQW9ELENBQUMsQ0FBQyxJQUFJLENBQUM7bUJBQ25FLENBQUMsS0FBQSxHQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBaEIsQ0FBcUIsQ0FBQyxhQUF0QixDQUFvQyxLQUFBLEdBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFuRDtRQUhPLENBQVg7UUFLQSxJQUFDLENBQUEsS0FBSyxDQUFDLFNBQVAsR0FBbUI7QUFDbkI7QUFBQSxhQUFBLHNDQUFBOztZQUNJLElBQUMsQ0FBQSxLQUFLLENBQUMsV0FBUCxDQUFtQixHQUFHLENBQUMsR0FBdkI7QUFESjtlQUVBO0lBVlE7O3FCQWtCWixjQUFBLEdBQWdCLFNBQUE7QUFFWixZQUFBO1FBQUEsSUFBRyxJQUFDLENBQUEsTUFBTSxDQUFDLElBQVIsS0FBZ0IsTUFBbkI7WUFDRyxPQUFBLENBQUMsR0FBRCxDQUFLLHVCQUFMLEVBQTZCLElBQUMsQ0FBQSxNQUE5QjtZQUNDLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBUixHQUFlLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFwQixDQUFBLElBQThCLEtBQTlCLElBQXVDLE9BRjFEOztRQUlBLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFSLEtBQWdCLEtBQW5CO1lBQ0ksUUFBQSxHQUFXLHFCQUFBLEdBQXNCLElBQUMsQ0FBQSxNQUFNLENBQUM7WUFDekMsSUFBRyxLQUFLLENBQUMsR0FBTixDQUFVLFFBQVYsQ0FBSDtnQkFDSSxLQUFLLENBQUMsR0FBTixDQUFVLFFBQVYsRUFESjthQUFBLE1BQUE7Z0JBR0ksS0FBSyxDQUFDLEdBQU4sQ0FBVSxRQUFWLEVBQW9CLElBQXBCLEVBSEo7O1lBSUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUFULENBQXFCLElBQUMsQ0FBQSxNQUF0QixFQUE4QixJQUFDLENBQUEsS0FBL0IsRUFBc0M7Z0JBQUEsV0FBQSxFQUFZLElBQVo7YUFBdEMsRUFOSjs7ZUFPQTtJQWJZOztxQkFlaEIsZ0JBQUEsR0FBa0IsU0FBQTtBQUVkLFlBQUE7UUFBQSxRQUFBLEdBQVc7UUFDWCxLQUFLLENBQUMsR0FBTixDQUFVLFFBQVYsRUFBb0IsQ0FBSSxLQUFLLENBQUMsR0FBTixDQUFVLFFBQVYsRUFBb0IsS0FBcEIsQ0FBeEI7UUFDQSxRQUFBLENBQVMsa0JBQVQsRUFBNEIsU0FBNUIsRUFBc0MsS0FBSyxDQUFDLEdBQU4sQ0FBVSxRQUFWLENBQUEsSUFBd0IsTUFBeEIsSUFBa0MsU0FBeEU7ZUFDQTtJQUxjOztxQkFhbEIsV0FBQSxHQUFhLFNBQUE7QUFFVCxZQUFBO1FBQUEsV0FBQSxHQUFjLElBQUMsQ0FBQSxVQUFELENBQUE7UUFDZCxJQUFDLENBQUEsWUFBRCxDQUFBO2VBRUEsS0FBQSxDQUFNLENBQUMsV0FBRCxDQUFOLENBQW9CLEVBQUMsS0FBRCxFQUFwQixDQUEyQixTQUFDLEdBQUQ7bUJBQU8sT0FBQSxDQUFFLEtBQUYsQ0FBUSxrQkFBQSxHQUFtQixXQUFuQixHQUErQixHQUEvQixHQUFrQyxHQUExQztRQUFQLENBQTNCO0lBTFM7O3FCQU9iLFVBQUEsR0FBWSxTQUFBO0FBRVIsWUFBQTtRQUFBLElBQUcsV0FBQSxHQUFjLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBakI7bUJBQ0ksSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWLEVBQXVCLFdBQXZCLEVBREo7O0lBRlE7O3FCQUtaLGFBQUEsR0FBZSxTQUFBO0FBRVgsWUFBQTtRQUFBLGNBQUEsR0FBaUIsT0FBQSxDQUFRLGlCQUFSO2VBQ2pCLGNBQUEsQ0FBZSxJQUFDLENBQUEsVUFBRCxDQUFBLENBQWYsQ0FBNkIsQ0FBQyxJQUE5QixDQUFtQyxDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFDLFFBQUQ7Z0JBQy9CLFFBQUEsR0FBVyxLQUFLLENBQUMsSUFBTixDQUFXLFFBQVg7Z0JBQ1gsSUFBRyxlQUFIOzJCQUNJLEVBQUUsQ0FBQyxJQUFILENBQVEsS0FBQyxDQUFBLFVBQUQsQ0FBQSxDQUFSLEVBQXVCLFFBQXZCLEVBQWlDLFNBQUMsR0FBRDt3QkFDN0IsSUFBdUMsV0FBdkM7QUFBQSxtQ0FBSyxPQUFBLENBQUUsS0FBRixDQUFRLGtCQUFSLEVBQTJCLEdBQTNCLEVBQUw7OytCQUNBLElBQUksQ0FBQyxJQUFMLENBQVUsVUFBVixFQUFxQixRQUFyQjtvQkFGNkIsQ0FBakMsRUFESjs7WUFGK0I7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQW5DO0lBSFc7O3FCQWdCZixRQUFBLEdBQVUsU0FBQTtlQUVOLElBQUEsQ0FBSyxLQUFLLENBQUMsR0FBTixDQUFVLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBVixDQUFMO0lBRk07O3FCQUlWLElBQUEsR0FBTSxTQUFBO2VBRUYsSUFBQSxDQUFLLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBTDtJQUZFOztxQkFVTixhQUFBLEdBQWUsU0FBQyxLQUFEO2VBQVcsU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsSUFBQSxDQUFLLEtBQUwsQ0FBakIsQ0FBakI7SUFBWDs7cUJBRWYsZUFBQSxHQUFpQixTQUFDLE1BQUQ7QUFFYixZQUFBO1FBQUEsSUFBTyxjQUFQO1lBQ0ksTUFBQSxHQUFTLElBQUEsQ0FBSyxJQUFDLENBQUEsSUFBSSxDQUFDLHFCQUFOLENBQUEsQ0FBNkIsQ0FBQyxJQUFuQyxFQUF5QyxJQUFDLENBQUEsSUFBSSxDQUFDLHFCQUFOLENBQUEsQ0FBNkIsQ0FBQyxHQUF2RSxFQURiOztRQUdBLEdBQUEsR0FBTTtZQUFBLEtBQUEsRUFBTztnQkFDVDtvQkFBQSxJQUFBLEVBQVEsa0JBQVI7b0JBQ0EsS0FBQSxFQUFRLFFBRFI7b0JBRUEsRUFBQSxFQUFRLElBQUMsQ0FBQSxjQUZUO2lCQURTLEVBS1Q7b0JBQUEsSUFBQSxFQUFRLG1CQUFSO29CQUNBLEtBQUEsRUFBUSxRQURSO29CQUVBLEVBQUEsRUFBUSxJQUFDLENBQUEsZ0JBRlQ7aUJBTFMsRUFTVDtvQkFBQSxJQUFBLEVBQVEsU0FBUjtvQkFDQSxLQUFBLEVBQVEsUUFEUjtvQkFFQSxFQUFBLEVBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxPQUZqQjtpQkFUUyxFQWFUO29CQUFBLElBQUEsRUFBUSxXQUFSO29CQUNBLEtBQUEsRUFBUSxRQURSO29CQUVBLEVBQUEsRUFBUSxJQUFDLENBQUEsYUFGVDtpQkFiUyxFQWlCVDtvQkFBQSxJQUFBLEVBQVEsZUFBUjtvQkFDQSxLQUFBLEVBQVEsZ0JBRFI7b0JBRUEsRUFBQSxFQUFRLElBQUMsQ0FBQSxXQUZUO2lCQWpCUyxFQXFCVDtvQkFBQSxJQUFBLEVBQVEsY0FBUjtvQkFDQSxLQUFBLEVBQVEsYUFEUjtvQkFFQSxFQUFBLEVBQVEsSUFBQyxDQUFBLFVBRlQ7aUJBckJTLEVBeUJUO29CQUFBLElBQUEsRUFBUSxVQUFSO29CQUNBLEtBQUEsRUFBUSxPQURSO29CQUVBLEVBQUEsRUFBUSxJQUFDLENBQUEsUUFGVDtpQkF6QlMsRUE2QlQ7b0JBQUEsSUFBQSxFQUFRLE1BQVI7b0JBQ0EsS0FBQSxFQUFRLE9BRFI7b0JBRUEsRUFBQSxFQUFRLElBQUMsQ0FBQSxJQUZUO2lCQTdCUzthQUFQOztRQWtDTixHQUFHLENBQUMsQ0FBSixHQUFRLE1BQU0sQ0FBQztRQUNmLEdBQUcsQ0FBQyxDQUFKLEdBQVEsTUFBTSxDQUFDO2VBQ2YsS0FBSyxDQUFDLElBQU4sQ0FBVyxHQUFYO0lBekNhOztxQkFpRGpCLEtBQUEsR0FBTyxTQUFDLEtBQUQ7QUFFSCxZQUFBO1FBQUEsT0FBNEIsT0FBTyxDQUFDLFFBQVIsQ0FBaUIsS0FBakIsQ0FBNUIsRUFBRSxjQUFGLEVBQU8sY0FBUCxFQUFZLGtCQUFaLEVBQW1CO1FBRW5CLElBQUEsQ0FBSyxjQUFMLEVBQW9CLEtBQXBCO0FBRUEsZ0JBQU8sS0FBUDtBQUFBLGlCQUNTLFNBRFQ7QUFDb0MsdUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxPQUFULENBQWlCLEtBQUssQ0FBQyxPQUFOLENBQWMsR0FBZCxDQUFqQixDQUFqQjtBQUQzQyxpQkFFUyxHQUZUO0FBRW9DLHVCQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxPQUFPLENBQUMsT0FBVCxDQUFpQixHQUFqQixDQUFqQjtBQUYzQyxpQkFHUyxPQUhUO0FBR29DLHVCQUFPLElBQUMsQ0FBQSxRQUFELENBQUE7QUFIM0MsaUJBSVMsT0FKVDtBQUlvQyx1QkFBTyxJQUFDLENBQUEsSUFBRCxDQUFBO0FBSjNDLGlCQUtTLFNBTFQ7QUFBQSxpQkFLbUIsV0FMbkI7QUFBQSxpQkFLK0IsTUFML0I7QUFBQSxpQkFLc0MsS0FMdEM7QUFLaUQsdUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFlBQUQsQ0FBYyxHQUFkLENBQWpCO0FBTHhELGlCQU1TLE9BTlQ7QUFNb0MsdUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFlBQUQsQ0FBYyxHQUFkLENBQWpCO0FBTjNDLGlCQVFTLGNBUlQ7QUFBQSxpQkFRd0IsWUFSeEI7QUFBQSxpQkFRcUMsZUFSckM7QUFBQSxpQkFRcUQsY0FSckQ7QUFBQSxpQkFRb0UsV0FScEU7QUFBQSxpQkFRZ0YsU0FSaEY7QUFBQSxpQkFRMEYsWUFSMUY7QUFBQSxpQkFRdUcsV0FSdkc7QUFTUSx1QkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsQ0FBakI7QUFUZixpQkFVUyxtQkFWVDtBQUFBLGlCQVU2QixnQkFWN0I7QUFBQSxpQkFVOEMsZ0JBVjlDO0FBQUEsaUJBVStELGFBVi9EO0FBV1EsdUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFdBQUQsQ0FBQSxDQUFqQjtBQVhmLGlCQVlTLFVBWlQ7QUFZb0MsdUJBQU8sU0FBQSxDQUFVLEtBQVYsdUVBQTJCLENBQUUseUJBQTdCO0FBWjNDLGlCQWFTLGdCQWJUO0FBYW9DLHVCQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxDQUFBLENBQWpCO0FBYjNDLGlCQWNTLFdBZFQ7QUFBQSxpQkFjcUIsUUFkckI7QUFjb0MsdUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxtQkFBVCxDQUE2QixJQUE3QixDQUFqQjtBQWQzQyxpQkFlUyxRQWZUO0FBZW9DLHVCQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBakI7QUFmM0MsaUJBZ0JTLFFBaEJUO0FBZ0JvQyx1QkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsVUFBRCxDQUFBLENBQWpCO0FBaEIzQyxpQkFpQlMsV0FqQlQ7QUFBQSxpQkFpQnFCLFFBakJyQjtBQWlCb0MsdUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUFqQjtBQWpCM0MsaUJBa0JTLFdBbEJUO0FBQUEsaUJBa0JxQixRQWxCckI7QUFrQm9DLHVCQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBakI7QUFsQjNDLGlCQW1CUyxXQW5CVDtBQUFBLGlCQW1CcUIsUUFuQnJCO0FBbUJvQyx1QkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsZ0JBQUQsQ0FBQSxDQUFqQjtBQW5CM0MsaUJBb0JTLFdBcEJUO0FBQUEsaUJBb0JxQixRQXBCckI7Z0JBb0JvQyxJQUEwQixJQUFDLENBQUEsT0FBTyxDQUFDLE9BQVQsQ0FBQSxDQUExQjtBQUFBLDJCQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQVA7O0FBQWY7QUFwQnJCLGlCQXFCUyxJQXJCVDtBQXFCb0MsdUJBQU8sU0FBQSxDQUFVLEtBQVYsMENBQTZCLENBQUUsUUFBZCxDQUFBLFVBQWpCO0FBckIzQyxpQkFzQlMsS0F0QlQ7Z0JBdUJRLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFYO29CQUF1QixJQUFDLENBQUEsUUFBRCxDQUFVLEVBQVYsRUFBdkI7O0FBQ0EsdUJBQU8sU0FBQSxDQUFVLEtBQVY7QUF4QmYsaUJBeUJTLEtBekJUO2dCQTBCUSxJQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBWDtvQkFBdUIsSUFBQyxDQUFBLFdBQUQsQ0FBQSxFQUF2Qjs7QUFDQSx1QkFBTyxTQUFBLENBQVUsS0FBVjtBQTNCZjtRQTZCQSxJQUFHLEdBQUEsS0FBUSxJQUFSLElBQUEsR0FBQSxLQUFlLE1BQWxCO0FBQWdDLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxZQUFELENBQWMsR0FBZCxDQUFqQixFQUF2Qzs7UUFDQSxJQUFHLEdBQUEsS0FBUSxNQUFSLElBQUEsR0FBQSxLQUFlLE9BQWxCO0FBQWdDLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxZQUFELENBQWMsR0FBZCxDQUFqQixFQUF2Qzs7QUFFQSxnQkFBTyxJQUFQO0FBQUEsaUJBQ1MsR0FEVDtBQUFBLGlCQUNhLEdBRGI7QUFDc0IsdUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFlBQUQsQ0FBYyxJQUFkLENBQWpCO0FBRDdCO1FBR0EsSUFBRyxDQUFBLEdBQUEsS0FBUSxPQUFSLElBQUEsR0FBQSxLQUFnQixFQUFoQixDQUFBLElBQXdCLElBQTNCO21CQUFxQyxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsRUFBckM7O0lBekNHOzs7Ozs7QUEyQ1gsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDBcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIHByZWZzLCBzdG9wRXZlbnQsIHNldFN0eWxlLCBrZXlpbmZvLCBwb3B1cCwgc2xhc2gsIHZhbGlkLCBjbGFtcCwgZW1wdHksIHN0YXRlLCBvcGVuLCBlbGVtLCBrcG9zLCBmcywga2xvZywga2Vycm9yLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cblJvdyAgICAgID0gcmVxdWlyZSAnLi9yb3cnXG5TY3JvbGxlciA9IHJlcXVpcmUgJy4vc2Nyb2xsZXInXG5mdXp6eSAgICA9IHJlcXVpcmUgJ2Z1enp5J1xudHJhc2ggICAgPSByZXF1aXJlICd0cmFzaCdcblxuY2xhc3MgQ29sdW1uXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAYnJvd3NlcikgLT5cbiAgICAgICAgXG4gICAgICAgIEBpbmRleCA9IEBicm93c2VyLmNvbHVtbnM/Lmxlbmd0aFxuICAgICAgICBAc2VhcmNoVGltZXIgPSBudWxsXG4gICAgICAgIEBzZWFyY2ggPSAnJ1xuICAgICAgICBAaXRlbXMgID0gW11cbiAgICAgICAgQHJvd3MgICA9IFtdXG4gICAgICAgIFxuICAgICAgICBAZGl2ICAgPSBlbGVtIGNsYXNzOiAnYnJvd3NlckNvbHVtbicgdGFiSW5kZXg6IDYsIGlkOiBAbmFtZSgpXG4gICAgICAgIEB0YWJsZSA9IGVsZW0gY2xhc3M6ICdicm93c2VyQ29sdW1uVGFibGUnXG4gICAgICAgIEBkaXYuYXBwZW5kQ2hpbGQgQHRhYmxlXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5jb2xzPy5hcHBlbmRDaGlsZCBAZGl2XG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2ZvY3VzJyAgICAgQG9uRm9jdXNcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdibHVyJyAgICAgIEBvbkJsdXJcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJyAgIEBvbktleVxuICAgICAgICBcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdtb3VzZW92ZXInIEBvbk1vdXNlT3ZlclxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlb3V0JyAgQG9uTW91c2VPdXRcblxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNldXAnICAgQG9uQ2xpY2tcbiAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdkYmxjbGljaycgIEBvbkRibENsaWNrXG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgXCJjb250ZXh0bWVudVwiLCBAb25Db250ZXh0TWVudVxuICAgICAgICBcbiAgICAgICAgQHNjcm9sbCA9IG5ldyBTY3JvbGxlciBAXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBsb2FkSXRlbXM6IChpdGVtcywgcGFyZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW4gQGluZGV4XG4gICAgICAgIFxuICAgICAgICBAaXRlbXMgID0gaXRlbXNcbiAgICAgICAgQHBhcmVudCA9IHBhcmVudFxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmVudC50eXBlID09IHVuZGVmaW5lZFxuICAgICAgICAgICAgbG9nICdjb2x1bW4ubG9hZEl0ZW1zJyBTdHJpbmcgQHBhcmVudFxuICAgICAgICAgICAgQHBhcmVudC50eXBlID0gc2xhc2guaXNEaXIoQHBhcmVudC5maWxlKSBhbmQgJ2Rpcicgb3IgJ2ZpbGUnXG4gICAgICAgIFxuICAgICAgICBrZXJyb3IgXCJubyBwYXJlbnQgaXRlbT9cIiBpZiBub3QgQHBhcmVudD9cbiAgICAgICAga2Vycm9yIFwibG9hZEl0ZW1zIC0tIG5vIHBhcmVudCB0eXBlP1wiLCBAcGFyZW50IGlmIG5vdCBAcGFyZW50LnR5cGU/XG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAaXRlbXNcbiAgICAgICAgICAgIGZvciBpdGVtIGluIEBpdGVtc1xuICAgICAgICAgICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgIFxuICAgICAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAXG5cbiAgICBzZXRJdGVtczogKEBpdGVtcywgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW4gQGluZGV4XG4gICAgICAgIFxuICAgICAgICBAcGFyZW50ID0gb3B0LnBhcmVudFxuICAgICAgICBrZXJyb3IgXCJubyBwYXJlbnQgaXRlbT9cIiBpZiBub3QgQHBhcmVudD9cbiAgICAgICAga2Vycm9yIFwic2V0SXRlbXMgLS0gbm8gcGFyZW50IHR5cGU/XCIsIEBwYXJlbnQgaWYgbm90IEBwYXJlbnQudHlwZT9cbiAgICAgICAgXG4gICAgICAgIGZvciBpdGVtIGluIEBpdGVtc1xuICAgICAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgQFxuXG4gICAgaXNEaXI6ICAtPiBAcGFyZW50LnR5cGUgPT0gJ2RpcicgXG4gICAgaXNGaWxlOiAtPiBAcGFyZW50LnR5cGUgPT0gJ2ZpbGUnIFxuICAgICAgICBcbiAgICBpc0VtcHR5OiAtPiBlbXB0eSBAcm93c1xuICAgIGNsZWFyOiAgIC0+XG4gICAgICAgIEBjbGVhclNlYXJjaCgpXG4gICAgICAgIGRlbGV0ZSBAcGFyZW50XG4gICAgICAgIEBkaXYuc2Nyb2xsVG9wID0gMFxuICAgICAgICBAZWRpdG9yPy5kZWwoKVxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgQHJvd3MgPSBbXVxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIFxuICAgXG4gICAgYWN0aXZhdGVSb3c6ICAocm93KSAtPiBAcm93KHJvdyk/LmFjdGl2YXRlKClcbiAgICAgICBcbiAgICBhY3RpdmVSb3c6IC0+IF8uZmluZCBAcm93cywgKHIpIC0+IHIuaXNBY3RpdmUoKVxuICAgIGFjdGl2ZVBhdGg6IC0+IEBhY3RpdmVSb3coKT8ucGF0aCgpXG4gICAgXG4gICAgcm93OiAocm93KSAtPiAjIGFjY2VwdHMgZWxlbWVudCwgaW5kZXgsIHN0cmluZyBvciByb3dcbiAgICAgICAgaWYgICAgICBfLmlzTnVtYmVyICByb3cgdGhlbiByZXR1cm4gMCA8PSByb3cgPCBAbnVtUm93cygpIGFuZCBAcm93c1tyb3ddIG9yIG51bGxcbiAgICAgICAgZWxzZSBpZiBfLmlzRWxlbWVudCByb3cgdGhlbiByZXR1cm4gXy5maW5kIEByb3dzLCAocikgLT4gci5kaXYuY29udGFpbnMgcm93XG4gICAgICAgIGVsc2UgaWYgXy5pc1N0cmluZyAgcm93IHRoZW4gcmV0dXJuIF8uZmluZCBAcm93cywgKHIpIC0+IHIuaXRlbS5uYW1lID09IHJvd1xuICAgICAgICBlbHNlIHJldHVybiByb3dcbiAgICAgICAgICAgIFxuICAgIG5leHRDb2x1bW46IC0+IEBicm93c2VyLmNvbHVtbiBAaW5kZXgrMVxuICAgIHByZXZDb2x1bW46IC0+IEBicm93c2VyLmNvbHVtbiBAaW5kZXgtMVxuICAgICAgICBcbiAgICBuYW1lOiAtPiBcIiN7QGJyb3dzZXIubmFtZX06I3tAaW5kZXh9XCJcbiAgICBwYXRoOiAtPiBAcGFyZW50Py5maWxlID8gJydcbiAgICAgICAgXG4gICAgbnVtUm93czogICAgLT4gQHJvd3MubGVuZ3RoID8gMCAgIFxuICAgIHJvd0hlaWdodDogIC0+IEByb3dzWzBdPy5kaXYuY2xpZW50SGVpZ2h0ID8gMFxuICAgIG51bVZpc2libGU6IC0+IEByb3dIZWlnaHQoKSBhbmQgcGFyc2VJbnQoQGJyb3dzZXIuaGVpZ2h0KCkgLyBAcm93SGVpZ2h0KCkpIG9yIDBcbiAgICBcbiAgICByb3dJbmRleEF0UG9zOiAocG9zKSAtPlxuICAgICAgICBcbiAgICAgICAgTWF0aC5tYXggMCwgTWF0aC5mbG9vciAocG9zLnkgLSBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCkgLyBAcm93SGVpZ2h0KClcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBoYXNGb2N1czogLT4gQGRpdi5jbGFzc0xpc3QuY29udGFpbnMgJ2ZvY3VzJ1xuXG4gICAgZm9jdXM6IChvcHQ9e30pIC0+XG4gICAgICAgIGlmIG5vdCBAYWN0aXZlUm93KCkgYW5kIEBudW1Sb3dzKCkgYW5kIG9wdD8uYWN0aXZhdGUgIT0gZmFsc2VcbiAgICAgICAgICAgIEByb3dzWzBdLnNldEFjdGl2ZSgpXG4gICAgICAgIEBkaXYuZm9jdXMoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgIG9uRm9jdXM6ID0+IEBkaXYuY2xhc3NMaXN0LmFkZCAnZm9jdXMnXG4gICAgb25CbHVyOiAgPT4gQGRpdi5jbGFzc0xpc3QucmVtb3ZlICdmb2N1cydcblxuICAgIGZvY3VzQnJvd3NlcjogLT4gQGJyb3dzZXIuZm9jdXMoKVxuICAgIFxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgb25Nb3VzZU92ZXI6IChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5vbk1vdXNlT3ZlcigpXG4gICAgb25Nb3VzZU91dDogIChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5vbk1vdXNlT3V0KClcbiAgICBvbkNsaWNrOiAgICAgKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/LmFjdGl2YXRlIGV2ZW50XG4gICAgb25EYmxDbGljazogIChldmVudCkgPT4gQG5hdmlnYXRlQ29scyAnZW50ZXInXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG5cbiAgICBuYXZpZ2F0ZVJvd3M6IChrZXkpIC0+XG5cbiAgICAgICAgcmV0dXJuIGVycm9yIFwibm8gcm93cyBpbiBjb2x1bW4gI3tAaW5kZXh9P1wiIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gLTFcbiAgICAgICAgZXJyb3IgXCJubyBpbmRleCBmcm9tIGFjdGl2ZVJvdz8gI3tpbmRleH0/XCIsIEBhY3RpdmVSb3coKSBpZiBub3QgaW5kZXg/IG9yIE51bWJlci5pc05hTiBpbmRleFxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcgICAgICAgIHRoZW4gaW5kZXgtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIGluZGV4KzFcbiAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiAwXG4gICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gQG51bVJvd3MoKS0xXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gaW5kZXgtQG51bVZpc2libGUoKVxuICAgICAgICAgICAgd2hlbiAncGFnZSBkb3duJyB0aGVuIGluZGV4K0BudW1WaXNpYmxlKClcbiAgICAgICAgICAgIGVsc2UgaW5kZXhcbiAgICAgICAgICAgIFxuICAgICAgICBlcnJvciBcIm5vIGluZGV4ICN7aW5kZXh9PyAje0BudW1WaXNpYmxlKCl9XCIgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXggICAgICAgIFxuICAgICAgICBpbmRleCA9IGNsYW1wIDAsIEBudW1Sb3dzKCktMSwgaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGVycm9yIFwibm8gcm93IGF0IGluZGV4ICN7aW5kZXh9LyN7QG51bVJvd3MoKS0xfT9cIiwgQG51bVJvd3MoKSBpZiBub3QgQHJvd3NbaW5kZXhdPy5hY3RpdmF0ZT9cbiAgICAgICAgQHJvd3NbaW5kZXhdLmFjdGl2YXRlKClcbiAgICBcbiAgICBuYXZpZ2F0ZUNvbHM6IChrZXkpIC0+ICMgbW92ZSB0byBmaWxlIGJyb3dzZXI/XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBAYnJvd3Nlci5uYXZpZ2F0ZSAnbGVmdCdcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIEBicm93c2VyLm5hdmlnYXRlICdyaWdodCdcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJ1xuICAgICAgICAgICAgICAgIGlmIGl0ZW0gPSBAYWN0aXZlUm93KCk/Lml0ZW1cbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IGl0ZW0udHlwZVxuICAgICAgICAgICAgICAgICAgICBpZiB0eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2ZpbGVicm93c2VyJyAnbG9hZEl0ZW0nIGl0ZW0sIGZvY3VzOnRydWVcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnb3BlbkZpbGUnIGl0ZW0uZmlsZVxuICAgICAgICBAXG5cbiAgICBuYXZpZ2F0ZVJvb3Q6IChrZXkpIC0+ICMgbW92ZSB0byBmaWxlIGJyb3dzZXI/XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBicm93c2VyLmJyb3dzZT9cbiAgICAgICAgQGJyb3dzZXIuYnJvd3NlIHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnICB0aGVuIHNsYXNoLmRpciBAcGFyZW50LmZpbGVcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICB0aGVuIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gQGFjdGl2ZVJvdygpLml0ZW0uZmlsZVxuICAgICAgICAgICAgd2hlbiAnZG93bicgIHRoZW4gc2xhc2gucGtnIEBwYXJlbnQuZmlsZVxuICAgICAgICAgICAgd2hlbiAnficgICAgIHRoZW4gJ34nXG4gICAgICAgICAgICB3aGVuICcvJyAgICAgdGhlbiAnLydcbiAgICAgICAgQFxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwMDAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICBcbiAgICBcbiAgICBkb1NlYXJjaDogKGNoYXIpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBudW1Sb3dzKClcbiAgICAgICAgXG4gICAgICAgIGNsZWFyVGltZW91dCBAc2VhcmNoVGltZXJcbiAgICAgICAgQHNlYXJjaFRpbWVyID0gc2V0VGltZW91dCBAY2xlYXJTZWFyY2gsIDIwMDBcbiAgICAgICAgQHNlYXJjaCArPSBjaGFyXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQHNlYXJjaERpdlxuICAgICAgICAgICAgQHNlYXJjaERpdiA9IGVsZW0gY2xhc3M6ICdicm93c2VyU2VhcmNoJ1xuICAgICAgICAgICAgXG4gICAgICAgIEBzZWFyY2hEaXYudGV4dENvbnRlbnQgPSBAc2VhcmNoXG5cbiAgICAgICAgYWN0aXZlSW5kZXggID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gMFxuICAgICAgICBhY3RpdmVJbmRleCArPSAxIGlmIChAc2VhcmNoLmxlbmd0aCA9PSAxKSBvciAoY2hhciA9PSAnJylcbiAgICAgICAgYWN0aXZlSW5kZXggID0gMCBpZiBhY3RpdmVJbmRleCA+PSBAbnVtUm93cygpXG4gICAgICAgIFxuICAgICAgICBmb3Igcm93cyBpbiBbQHJvd3Muc2xpY2UoYWN0aXZlSW5kZXgpLCBAcm93cy5zbGljZSgwLGFjdGl2ZUluZGV4KzEpXVxuICAgICAgICAgICAgZnV6emllZCA9IGZ1enp5LmZpbHRlciBAc2VhcmNoLCByb3dzLCBleHRyYWN0OiAocikgLT4gci5pdGVtLm5hbWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZnV6emllZC5sZW5ndGhcbiAgICAgICAgICAgICAgICByb3cgPSBmdXp6aWVkWzBdLm9yaWdpbmFsXG4gICAgICAgICAgICAgICAgcm93LmRpdi5hcHBlbmRDaGlsZCBAc2VhcmNoRGl2XG4gICAgICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICBAXG4gICAgXG4gICAgY2xlYXJTZWFyY2g6ID0+XG4gICAgICAgIFxuICAgICAgICBAc2VhcmNoID0gJydcbiAgICAgICAgQHNlYXJjaERpdj8ucmVtb3ZlKClcbiAgICAgICAgZGVsZXRlIEBzZWFyY2hEaXZcbiAgICAgICAgQFxuICAgIFxuICAgIHJlbW92ZU9iamVjdDogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHJvdyA9IEBhY3RpdmVSb3coKVxuICAgICAgICAgICAgQGJyb3dzZXIuZW1pdCAnd2lsbFJlbW92ZVJvdycgcm93LCBAXG4gICAgICAgICAgICBuZXh0T3JQcmV2ID0gcm93Lm5leHQoKSA/IHJvdy5wcmV2KClcbiAgICAgICAgICAgIEByZW1vdmVSb3cgcm93XG4gICAgICAgICAgICBuZXh0T3JQcmV2Py5hY3RpdmF0ZSgpXG4gICAgICAgIEBcblxuICAgIHJlbW92ZVJvdzogKHJvdykgLT5cbiAgICAgICAgXG4gICAgICAgIHJvdy5kaXYucmVtb3ZlKClcbiAgICAgICAgQGl0ZW1zLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICBAcm93cy5zcGxpY2Ugcm93LmluZGV4KCksIDFcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgc29ydEJ5TmFtZTogLT5cbiAgICAgICAgIFxuICAgICAgICBAcm93cy5zb3J0IChhLGIpIC0+IFxuICAgICAgICAgICAgYS5pdGVtLm5hbWUubG9jYWxlQ29tcGFyZSBiLml0ZW0ubmFtZVxuICAgICAgICAgICAgXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBmb3Igcm93IGluIEByb3dzXG4gICAgICAgICAgICBAdGFibGUuYXBwZW5kQ2hpbGQgcm93LmRpdlxuICAgICAgICBAXG4gICAgICAgIFxuICAgIHNvcnRCeVR5cGU6IC0+XG4gICAgICAgIFxuICAgICAgICBAcm93cy5zb3J0IChhLGIpIC0+IFxuICAgICAgICAgICAgYXR5cGUgPSBhLml0ZW0udHlwZSA9PSAnZmlsZScgYW5kIHNsYXNoLmV4dChhLml0ZW0ubmFtZSkgb3IgYS5pdGVtLnR5cGVcbiAgICAgICAgICAgIGJ0eXBlID0gYi5pdGVtLnR5cGUgPT0gJ2ZpbGUnIGFuZCBzbGFzaC5leHQoYi5pdGVtLm5hbWUpIG9yIGIuaXRlbS50eXBlXG4gICAgICAgICAgICAoYXR5cGUgKyBhLml0ZW0ubmFtZSkubG9jYWxlQ29tcGFyZSBidHlwZSArIGIuaXRlbS5uYW1lXG4gICAgICAgICAgICBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIGZvciByb3cgaW4gQHJvd3NcbiAgICAgICAgICAgIEB0YWJsZS5hcHBlbmRDaGlsZCByb3cuZGl2XG4gICAgICAgIEBcbiAgXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIHRvZ2dsZURvdEZpbGVzOiA9PlxuXG4gICAgICAgIGlmIEBwYXJlbnQudHlwZSA9PSB1bmRlZmluZWRcbiAgICAgICAgICAgIGxvZyAnY29sdW1uLnRvZ2dsZURvdEZpbGVzJyBAcGFyZW50XG4gICAgICAgICAgICBAcGFyZW50LnR5cGUgPSBzbGFzaC5pc0RpcihAcGFyZW50LmZpbGUpIGFuZCAnZGlyJyBvciAnZmlsZSdcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAcGFyZW50LnR5cGUgPT0gJ2RpcicgICAgICAgICAgICBcbiAgICAgICAgICAgIHN0YXRlS2V5ID0gXCJicm93c2Vy4pa4c2hvd0hpZGRlbuKWuCN7QHBhcmVudC5maWxlfVwiXG4gICAgICAgICAgICBpZiBwcmVmcy5nZXQgc3RhdGVLZXlcbiAgICAgICAgICAgICAgICBwcmVmcy5kZWwgc3RhdGVLZXlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwcmVmcy5zZXQgc3RhdGVLZXksIHRydWVcbiAgICAgICAgICAgIEBicm93c2VyLmxvYWREaXJJdGVtIEBwYXJlbnQsIEBpbmRleCwgaWdub3JlQ2FjaGU6dHJ1ZVxuICAgICAgICBAXG4gICAgICAgIFxuICAgIHRvZ2dsZUV4dGVuc2lvbnM6ID0+XG5cbiAgICAgICAgc3RhdGVLZXkgPSBcImJyb3dzZXLilrhoaWRlRXh0ZW5zaW9uc1wiXG4gICAgICAgIHByZWZzLnNldCBzdGF0ZUtleSwgbm90IHByZWZzLmdldCBzdGF0ZUtleSwgZmFsc2VcbiAgICAgICAgc2V0U3R5bGUgJy5icm93c2VyUm93IC5leHQnICdkaXNwbGF5JyBwcmVmcy5nZXQoc3RhdGVLZXkpIGFuZCAnbm9uZScgb3IgJ2luaXRpYWwnXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG1vdmVUb1RyYXNoOiA9PlxuICAgICAgICBcbiAgICAgICAgcGF0aFRvVHJhc2ggPSBAYWN0aXZlUGF0aCgpXG4gICAgICAgIEByZW1vdmVPYmplY3QoKVxuICAgICAgICBcbiAgICAgICAgdHJhc2goW3BhdGhUb1RyYXNoXSkuY2F0Y2ggKGVycikgLT4gZXJyb3IgXCJmYWlsZWQgdG8gdHJhc2ggI3twYXRoVG9UcmFzaH0gI3tlcnJ9XCJcblxuICAgIGFkZFRvU2hlbGY6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBwYXRoVG9TaGVsZiA9IEBhY3RpdmVQYXRoKClcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnYWRkVG9TaGVsZicgcGF0aFRvU2hlbGZcbiAgICAgICAgXG4gICAgZHVwbGljYXRlRmlsZTogPT5cbiAgICAgICAgXG4gICAgICAgIHVudXNlZEZpbGVuYW1lID0gcmVxdWlyZSAndW51c2VkLWZpbGVuYW1lJ1xuICAgICAgICB1bnVzZWRGaWxlbmFtZShAYWN0aXZlUGF0aCgpKS50aGVuIChmaWxlTmFtZSkgPT5cbiAgICAgICAgICAgIGZpbGVOYW1lID0gc2xhc2gucGF0aCBmaWxlTmFtZVxuICAgICAgICAgICAgaWYgZnMuY29weT8gIyBmcy5jb3B5RmlsZSBpbiBub2RlID4gOC40XG4gICAgICAgICAgICAgICAgZnMuY29weSBAYWN0aXZlUGF0aCgpLCBmaWxlTmFtZSwgKGVycikgPT5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycm9yICdjb3B5IGZpbGUgZmFpbGVkJyBlcnIgaWYgZXJyP1xuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBmaWxlTmFtZVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgZXhwbG9yZXI6ID0+XG4gICAgICAgIFxuICAgICAgICBvcGVuIHNsYXNoLmRpciBAYWN0aXZlUGF0aCgpXG4gICAgICAgIFxuICAgIG9wZW46ID0+XG4gICAgICAgIFxuICAgICAgICBvcGVuIEBhY3RpdmVQYXRoKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgXG4gICAgICAgIFxuICAgIG9uQ29udGV4dE1lbnU6IChldmVudCkgPT4gc3RvcEV2ZW50IGV2ZW50LCBAc2hvd0NvbnRleHRNZW51IGtwb3MgZXZlbnRcbiAgICAgICAgICAgICAgXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IGtwb3MgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgIFxuICAgICAgICBvcHQgPSBpdGVtczogWyBcbiAgICAgICAgICAgIHRleHQ6ICAgJ1RvZ2dsZSBJbnZpc2libGUnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2knIFxuICAgICAgICAgICAgY2I6ICAgICBAdG9nZ2xlRG90RmlsZXNcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnVG9nZ2xlIEV4dGVuc2lvbnMnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2UnIFxuICAgICAgICAgICAgY2I6ICAgICBAdG9nZ2xlRXh0ZW5zaW9uc1xuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdSZWZyZXNoJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtyJyBcbiAgICAgICAgICAgIGNiOiAgICAgQGJyb3dzZXIucmVmcmVzaFxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdEdXBsaWNhdGUnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2QnIFxuICAgICAgICAgICAgY2I6ICAgICBAZHVwbGljYXRlRmlsZVxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdNb3ZlIHRvIFRyYXNoJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtiYWNrc3BhY2UnIFxuICAgICAgICAgICAgY2I6ICAgICBAbW92ZVRvVHJhc2hcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnQWRkIHRvIFNoZWxmJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K3NoaWZ0Ky4nXG4gICAgICAgICAgICBjYjogICAgIEBhZGRUb1NoZWxmXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ0V4cGxvcmVyJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K2UnIFxuICAgICAgICAgICAgY2I6ICAgICBAZXhwbG9yZXJcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnT3BlbidcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtvJyBcbiAgICAgICAgICAgIGNiOiAgICAgQG9wZW5cbiAgICAgICAgXVxuICAgICAgICBcbiAgICAgICAgb3B0LnggPSBhYnNQb3MueFxuICAgICAgICBvcHQueSA9IGFic1Bvcy55XG4gICAgICAgIHBvcHVwLm1lbnUgb3B0ICAgICAgICBcbiAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBvbktleTogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIgfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcblxuICAgICAgICBrbG9nICdjb2x1bW4ub25LZXknIGNvbWJvXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ3NoaWZ0K2AnICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIubG9hZERpciBzbGFzaC5yZXNvbHZlICd+J1xuICAgICAgICAgICAgd2hlbiAnLycgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5sb2FkRGlyICcvJ1xuICAgICAgICAgICAgd2hlbiAnYWx0K2UnICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQGV4cGxvcmVyKClcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtvJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBvcGVuKClcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICdwYWdlIGRvd24nICdob21lJyAnZW5kJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3Mga2V5XG4gICAgICAgICAgICB3aGVuICdlbnRlcicgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZUNvbHMga2V5XG4gICAgICAgICAgICAjIHdoZW4gJ2NvbW1hbmQrZW50ZXInICdjdHJsK2VudGVyJyB0aGVuIHJldHVybiBAb3BlbkZpbGVJbk5ld1dpbmRvdygpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2xlZnQnICdjb21tYW5kK3VwJyAnY29tbWFuZCtyaWdodCcgJ2NvbW1hbmQrZG93bicgJ2N0cmwrbGVmdCcgJ2N0cmwrdXAnICdjdHJsK3JpZ2h0JyAnY3RybCtkb3duJ1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvb3Qga2V5XG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2JhY2tzcGFjZScgJ2N0cmwrYmFja3NwYWNlJyAnY29tbWFuZCtkZWxldGUnICdjdHJsK2RlbGV0ZScgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG1vdmVUb1RyYXNoKClcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtsZWZ0JyAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgJCgnc2hlbGYnKT8uZm9jdXM/KClcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtzaGlmdCtsZWZ0JyAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGJyb3dzZXIudG9nZ2xlU2hlbGYoKVxuICAgICAgICAgICAgd2hlbiAnYmFja3NwYWNlJyAnZGVsZXRlJyAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYnJvd3Nlci5vbkJhY2tzcGFjZUluQ29sdW1uIEBcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrdCcgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHNvcnRCeVR5cGUoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtuJyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAc29ydEJ5TmFtZSgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2knICdjdHJsK2knICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEB0b2dnbGVEb3RGaWxlcygpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2QnICdjdHJsK2QnICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBkdXBsaWNhdGVGaWxlKClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQrZScgJ2N0cmwrZScgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHRvZ2dsZUV4dGVuc2lvbnMoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtrJyAnY3RybCtrJyAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50IGlmIEBicm93c2VyLmNsZWFuVXAoKVxuICAgICAgICAgICAgd2hlbiAnZjInICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAYWN0aXZlUm93KCk/LmVkaXROYW1lKClcbiAgICAgICAgICAgIHdoZW4gJ3RhYicgICAgXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAZG9TZWFyY2ggJydcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAY2xlYXJTZWFyY2goKVxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnRcblxuICAgICAgICBpZiBrZXkgaW4gWyd1cCcgICAnZG93biddICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3Mga2V5ICAgICAgICAgICAgICBcbiAgICAgICAgaWYga2V5IGluIFsnbGVmdCcgJ3JpZ2h0J10gdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVDb2xzIGtleSAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNoYXJcbiAgICAgICAgICAgIHdoZW4gJ34nICcvJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvb3QgY2hhclxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG1vZCBpbiBbJ3NoaWZ0JyAnJ10gYW5kIGNoYXIgdGhlbiBAZG9TZWFyY2ggY2hhclxuICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBDb2x1bW5cblxuXG4iXX0=
//# sourceURL=../coffee/column.coffee