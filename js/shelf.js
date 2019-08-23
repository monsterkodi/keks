// koffee 1.4.0

/*
 0000000  000   000  00000000  000      00000000
000       000   000  000       000      000     
0000000   000000000  0000000   000      000000  
     000  000   000  000       000      000     
0000000   000   000  00000000  0000000  000
 */
var $, Column, Row, Scroller, Shelf, _, clamp, elem, empty, first, fuzzy, kerror, keyinfo, last, popup, post, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), stopEvent = ref.stopEvent, keyinfo = ref.keyinfo, slash = ref.slash, post = ref.post, popup = ref.popup, elem = ref.elem, clamp = ref.clamp, empty = ref.empty, first = ref.first, last = ref.last, kerror = ref.kerror, $ = ref.$, _ = ref._;

Row = require('./row');

Scroller = require('./scroller');

Column = require('./column');

fuzzy = require('fuzzy');

Shelf = (function(superClass) {
    extend(Shelf, superClass);

    function Shelf(browser) {
        this.onKey = bind(this.onKey, this);
        this.showContextMenu = bind(this.showContextMenu, this);
        this.removeObject = bind(this.removeObject, this);
        this.onDblClick = bind(this.onDblClick, this);
        this.onClick = bind(this.onClick, this);
        this.onMouseOut = bind(this.onMouseOut, this);
        this.onMouseOver = bind(this.onMouseOver, this);
        this.onFocus = bind(this.onFocus, this);
        this.addPath = bind(this.addPath, this);
        this.onFile = bind(this.onFile, this);
        Shelf.__super__.constructor.call(this, browser);
        this.items = [];
        this.index = -1;
        this.div.id = 'shelf';
        post.on('addToShelf', this.addPath);
        post.on('file', this.onFile);
    }

    Shelf.prototype.activateRow = function(row) {
        var item, ref1;
        item = row.item;
        if (item.type === 'historySeparator') {
            row.setActive({
                emit: false
            });
            return;
        }
        if ((ref1 = $('.hover')) != null) {
            ref1.classList.remove('hover');
        }
        row.setActive({
            emit: true
        });
        if (item.type === 'file') {
            return post.emit('jumpToFile', item);
        } else {
            return post.emit('filebrowser', 'loadItem', item);
        }
    };

    Shelf.prototype.onFile = function(file) {
        var i, index, item, matches, ref1, ref2, ref3;
        if (empty(file)) {
            return;
        }
        if (this.navigatingRows) {
            delete this.navigatingRows;
            return;
        }
        for (index = i = 0, ref1 = this.items.length; 0 <= ref1 ? i < ref1 : i > ref1; index = 0 <= ref1 ? ++i : --i) {
            if (this.items[index].file === file) {
                this.rows[index].setActive();
                return;
            }
        }
        matches = [];
        ref2 = this.items;
        for (index in ref2) {
            item = ref2[index];
            if (file != null ? file.startsWith(item.file) : void 0) {
                matches.push([index, item]);
            }
        }
        if (!empty(matches)) {
            matches.sort(function(a, b) {
                return b[1].file.length - a[1].file.length;
            });
            ref3 = first(matches), index = ref3[0], item = ref3[1];
            return this.rows[index].setActive();
        }
    };

    Shelf.prototype.browserDidInitColumns = function() {
        if (this.didInit) {
            return;
        }
        this.didInit = true;
        this.loadShelfItems();
        if (this.showHistory) {
            return this.loadHistory();
        }
    };

    Shelf.prototype.loadShelfItems = function() {};

    Shelf.prototype.addPath = function(path, opt) {
        if (slash.isDir(path)) {
            return this.addDir(path, opt);
        } else {
            return this.addFile(path, opt);
        }
    };

    Shelf.prototype.itemPaths = function() {
        return this.rows.map(function(r) {
            return r.path();
        });
    };

    Shelf.prototype.savePrefs = function() {
        return window.state.set("shelf|items", this.items);
    };

    Shelf.prototype.setItems = function(items1, opt) {
        this.items = items1;
        this.clear();
        if (this.items != null) {
            this.items;
        } else {
            this.items = [];
        }
        this.addItems(this.items);
        if ((opt != null ? opt.save : void 0) !== false) {
            this.savePrefs();
        }
        return this;
    };

    Shelf.prototype.addItems = function(items, opt) {
        var i, item, len;
        if (empty(items)) {
            return;
        }
        for (i = 0, len = items.length; i < len; i++) {
            item = items[i];
            this.rows.push(new Row(this, item));
        }
        this.scroll.update();
        return this;
    };

    Shelf.prototype.addDir = function(dir, opt) {
        var item;
        item = {
            name: slash.file(slash.tilde(dir)),
            type: 'dir',
            file: slash.path(dir)
        };
        return this.addItem(item, opt);
    };

    Shelf.prototype.addFile = function(file, opt) {
        var item;
        item = {
            name: slash.file(file),
            type: 'file',
            file: slash.path(file)
        };
        if (slash.isText(file)) {
            item.textFile = true;
        }
        return this.addItem(item, opt);
    };

    Shelf.prototype.addItem = function(item, opt) {
        var index;
        _.pullAllWith(this.items, [item], _.isEqual);
        if (opt != null ? opt.pos : void 0) {
            index = this.rowIndexAtPos(opt.pos);
            this.items.splice(Math.min(index, this.items.length), 0, item);
        } else {
            this.items.push(item);
        }
        this.setItems(this.items);
        if (this.showHistory) {
            return this.loadHistory();
        }
    };

    Shelf.prototype.dropRow = function(row, pos) {
        return this.addItem(row.item, {
            pos: pos
        });
    };

    Shelf.prototype.isEmpty = function() {
        return empty(this.rows);
    };

    Shelf.prototype.clear = function() {
        this.clearSearch();
        this.div.scrollTop = 0;
        this.table.innerHTML = '';
        this.rows = [];
        return this.scroll.update();
    };

    Shelf.prototype.name = function() {
        return 'shelf';
    };

    Shelf.prototype.onFocus = function() {
        this.div.classList.add('focus');
        if (this.browser.shelfSize < 200) {
            return this.browser.setShelfSize(200);
        }
    };

    Shelf.prototype.onMouseOver = function(event) {
        var ref1;
        return (ref1 = this.row(event.target)) != null ? ref1.onMouseOver() : void 0;
    };

    Shelf.prototype.onMouseOut = function(event) {
        var ref1;
        return (ref1 = this.row(event.target)) != null ? ref1.onMouseOut() : void 0;
    };

    Shelf.prototype.onClick = function(event) {
        var ref1;
        return (ref1 = this.row(event.target)) != null ? ref1.activate(event) : void 0;
    };

    Shelf.prototype.onDblClick = function(event) {
        return this.navigateCols('enter');
    };

    Shelf.prototype.navigateRows = function(key) {
        var index, navigate, ref1, ref2, ref3;
        if (!this.numRows()) {
            return kerror("no rows in column " + this.index + "?");
        }
        index = (ref1 = (ref2 = this.activeRow()) != null ? ref2.index() : void 0) != null ? ref1 : -1;
        if ((index == null) || Number.isNaN(index)) {
            kerror("no index from activeRow? " + index + "?", this.activeRow());
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
                    return this.items.length;
                case 'page up':
                    return index - this.numVisible();
                case 'page down':
                    return clamp(0, this.items.length, index + this.numVisible());
                default:
                    return index;
            }
        }).call(this);
        if ((index == null) || Number.isNaN(index)) {
            kerror("no index " + index + "? " + (this.numVisible()));
        }
        index = clamp(0, this.numRows() - 1, index);
        if (((ref3 = this.rows[index]) != null ? ref3.activate : void 0) == null) {
            kerror("no row at index " + index + "/" + (this.numRows() - 1) + "?", this.numRows());
        }
        navigate = (function(_this) {
            return function(action) {
                _this.navigatingRows = true;
                return post.emit('menuAction', action);
            };
        })(this);
        if (key === 'up' && index > this.items.length) {
            return navigate('Navigate Forward');
        } else if (key === 'down' && index > this.items.length + 1) {
            return navigate('Navigate Backward');
        } else {
            return this.rows[index].activate();
        }
    };

    Shelf.prototype.openFileInNewWindow = function() {
        var item, ref1;
        if (item = (ref1 = this.activeRow()) != null ? ref1.item : void 0) {
            if (item.type === 'file' && item.textFile) {
                window.openFiles([item.file], {
                    newWindow: true
                });
            }
        }
        return this;
    };

    Shelf.prototype.removeObject = function() {
        var nextOrPrev, ref1, row;
        if (row = this.activeRow()) {
            if (this.showHistory) {
                if (row.item.type === 'historySeparator') {
                    this.toggleHistory();
                    return;
                }
                if (row.index() > this.historySeparatorIndex()) {
                    window.navigate.delFilePos(row.item);
                }
            }
            nextOrPrev = (ref1 = row.next()) != null ? ref1 : row.prev();
            row.div.remove();
            this.items.splice(row.index(), 1);
            this.rows.splice(row.index(), 1);
            if (nextOrPrev != null) {
                nextOrPrev.activate();
            }
            this.savePrefs();
        }
        return this;
    };

    Shelf.prototype.showContextMenu = function(absPos) {
        var opt;
        if (absPos == null) {
            absPos = pos(this.view.getBoundingClientRect().left, this.view.getBoundingClientRect().top);
        }
        opt = {
            items: [
                {
                    text: 'Toggle History',
                    combo: 'alt+h',
                    cb: this.toggleHistory
                }, {
                    text: 'Toggle Extensions',
                    combo: 'ctrl+e',
                    cb: this.toggleExtensions
                }, {
                    text: 'Remove',
                    combo: 'backspace',
                    cb: this.removeObject
                }, {
                    text: 'Clear History',
                    cb: this.clearHistory
                }
            ]
        };
        opt.x = absPos.x;
        opt.y = absPos.y;
        return popup.menu(opt);
    };

    Shelf.prototype.onKey = function(event) {
        var char, combo, key, mod, ref1;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo, char = ref1.char;
        switch (combo) {
            case 'command+enter':
            case 'ctrl+enter':
                return this.openFileInNewWindow();
            case 'backspace':
            case 'delete':
                return stopEvent(event, this.clearSearch().removeObject());
            case 'command+k':
            case 'ctrl+k':
                if (this.browser.cleanUp()) {
                    return stopEvent(event);
                }
                break;
            case 'tab':
                if (this.search.length) {
                    this.doSearch('');
                }
                return stopEvent(event);
            case 'esc':
                if (this.search.length) {
                    this.clearSearch();
                } else {
                    window.split.focus('commandline-editor');
                }
                return stopEvent(event);
        }
        switch (key) {
            case 'up':
            case 'down':
            case 'page up':
            case 'page down':
            case 'home':
            case 'end':
                return stopEvent(event, this.navigateRows(key));
            case 'right':
            case 'enter':
                return stopEvent(event, this.focusBrowser());
        }
        switch (char) {
            case '~':
            case '/':
                return stopEvent(event, this.navigateRoot(char));
        }
        if ((mod === 'shift' || mod === '') && char) {
            this.doSearch(char);
        }
        if (key === 'left') {
            return stopEvent(event);
        }
    };

    return Shelf;

})(Column);

module.exports = Shelf;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGYuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLCtIQUFBO0lBQUE7Ozs7QUFRQSxNQUE0RixPQUFBLENBQVEsS0FBUixDQUE1RixFQUFFLHlCQUFGLEVBQWEscUJBQWIsRUFBc0IsaUJBQXRCLEVBQTZCLGVBQTdCLEVBQW1DLGlCQUFuQyxFQUEwQyxlQUExQyxFQUFnRCxpQkFBaEQsRUFBdUQsaUJBQXZELEVBQThELGlCQUE5RCxFQUFxRSxlQUFyRSxFQUEyRSxtQkFBM0UsRUFBbUYsU0FBbkYsRUFBc0Y7O0FBRXRGLEdBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBQ1gsTUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsT0FBUjs7QUFFTDs7O0lBRVcsZUFBQyxPQUFEOzs7Ozs7Ozs7OztRQUVULHVDQUFNLE9BQU47UUFFQSxJQUFDLENBQUEsS0FBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLEtBQUQsR0FBVSxDQUFDO1FBQ1gsSUFBQyxDQUFBLEdBQUcsQ0FBQyxFQUFMLEdBQVU7UUFJVixJQUFJLENBQUMsRUFBTCxDQUFRLFlBQVIsRUFBaUMsSUFBQyxDQUFBLE9BQWxDO1FBRUEsSUFBSSxDQUFDLEVBQUwsQ0FBUSxNQUFSLEVBQWUsSUFBQyxDQUFBLE1BQWhCO0lBWlM7O29CQW9CYixXQUFBLEdBQWEsU0FBQyxHQUFEO0FBRVQsWUFBQTtRQUFBLElBQUEsR0FBTyxHQUFHLENBQUM7UUFFWCxJQUFHLElBQUksQ0FBQyxJQUFMLEtBQWEsa0JBQWhCO1lBQ0ksR0FBRyxDQUFDLFNBQUosQ0FBYztnQkFBQSxJQUFBLEVBQUssS0FBTDthQUFkO0FBQ0EsbUJBRko7OztnQkFJVyxDQUFFLFNBQVMsQ0FBQyxNQUF2QixDQUE4QixPQUE5Qjs7UUFDQSxHQUFHLENBQUMsU0FBSixDQUFjO1lBQUEsSUFBQSxFQUFLLElBQUw7U0FBZDtRQUVBLElBQUcsSUFBSSxDQUFDLElBQUwsS0FBYSxNQUFoQjttQkFDSSxJQUFJLENBQUMsSUFBTCxDQUFVLFlBQVYsRUFBd0IsSUFBeEIsRUFESjtTQUFBLE1BQUE7bUJBR0ksSUFBSSxDQUFDLElBQUwsQ0FBVSxhQUFWLEVBQXlCLFVBQXpCLEVBQXFDLElBQXJDLEVBSEo7O0lBWFM7O29CQXNCYixNQUFBLEdBQVEsU0FBQyxJQUFEO0FBRUosWUFBQTtRQUFBLElBQVUsS0FBQSxDQUFNLElBQU4sQ0FBVjtBQUFBLG1CQUFBOztRQUNBLElBQUcsSUFBQyxDQUFBLGNBQUo7WUFDSSxPQUFPLElBQUMsQ0FBQTtBQUNSLG1CQUZKOztBQUlBLGFBQWEsdUdBQWI7WUFDSSxJQUFHLElBQUMsQ0FBQSxLQUFNLENBQUEsS0FBQSxDQUFNLENBQUMsSUFBZCxLQUFzQixJQUF6QjtnQkFDSSxJQUFDLENBQUEsSUFBSyxDQUFBLEtBQUEsQ0FBTSxDQUFDLFNBQWIsQ0FBQTtBQUNBLHVCQUZKOztBQURKO1FBS0EsT0FBQSxHQUFVO0FBQ1Y7QUFBQSxhQUFBLGFBQUE7O1lBQ0ksbUJBQUcsSUFBSSxDQUFFLFVBQU4sQ0FBaUIsSUFBSSxDQUFDLElBQXRCLFVBQUg7Z0JBQ0ksT0FBTyxDQUFDLElBQVIsQ0FBYSxDQUFDLEtBQUQsRUFBUSxJQUFSLENBQWIsRUFESjs7QUFESjtRQUlBLElBQUcsQ0FBSSxLQUFBLENBQU0sT0FBTixDQUFQO1lBQ0ksT0FBTyxDQUFDLElBQVIsQ0FBYSxTQUFDLENBQUQsRUFBRyxDQUFIO3VCQUFTLENBQUUsQ0FBQSxDQUFBLENBQUUsQ0FBQyxJQUFJLENBQUMsTUFBVixHQUFtQixDQUFFLENBQUEsQ0FBQSxDQUFFLENBQUMsSUFBSSxDQUFDO1lBQXRDLENBQWI7WUFDQSxPQUFnQixLQUFBLENBQU0sT0FBTixDQUFoQixFQUFDLGVBQUQsRUFBUTttQkFDUixJQUFDLENBQUEsSUFBSyxDQUFBLEtBQUEsQ0FBTSxDQUFDLFNBQWIsQ0FBQSxFQUhKOztJQWpCSTs7b0JBNEJSLHFCQUFBLEdBQXVCLFNBQUE7UUFFbkIsSUFBVSxJQUFDLENBQUEsT0FBWDtBQUFBLG1CQUFBOztRQUVBLElBQUMsQ0FBQSxPQUFELEdBQVc7UUFFWCxJQUFDLENBQUEsY0FBRCxDQUFBO1FBRUEsSUFBa0IsSUFBQyxDQUFBLFdBQW5CO21CQUFBLElBQUMsQ0FBQSxXQUFELENBQUEsRUFBQTs7SUFSbUI7O29CQVV2QixjQUFBLEdBQWdCLFNBQUEsR0FBQTs7b0JBS2hCLE9BQUEsR0FBUyxTQUFDLElBQUQsRUFBTyxHQUFQO1FBRUwsSUFBRyxLQUFLLENBQUMsS0FBTixDQUFZLElBQVosQ0FBSDttQkFDSSxJQUFDLENBQUEsTUFBRCxDQUFRLElBQVIsRUFBYyxHQUFkLEVBREo7U0FBQSxNQUFBO21CQUdJLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBVCxFQUFlLEdBQWYsRUFISjs7SUFGSzs7b0JBYVQsU0FBQSxHQUFXLFNBQUE7ZUFBRyxJQUFDLENBQUEsSUFBSSxDQUFDLEdBQU4sQ0FBVSxTQUFDLENBQUQ7bUJBQU8sQ0FBQyxDQUFDLElBQUYsQ0FBQTtRQUFQLENBQVY7SUFBSDs7b0JBRVgsU0FBQSxHQUFXLFNBQUE7ZUFDUCxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQWIsQ0FBaUIsYUFBakIsRUFBZ0MsSUFBQyxDQUFBLEtBQWpDO0lBRE87O29CQUdYLFFBQUEsR0FBVSxTQUFDLE1BQUQsRUFBUyxHQUFUO1FBQUMsSUFBQyxDQUFBLFFBQUQ7UUFFUCxJQUFDLENBQUEsS0FBRCxDQUFBOztZQUVBLElBQUMsQ0FBQTs7WUFBRCxJQUFDLENBQUEsUUFBUzs7UUFDVixJQUFDLENBQUEsUUFBRCxDQUFVLElBQUMsQ0FBQSxLQUFYO1FBRUEsbUJBQUcsR0FBRyxDQUFFLGNBQUwsS0FBYSxLQUFoQjtZQUNJLElBQUMsQ0FBQSxTQUFELENBQUEsRUFESjs7ZUFFQTtJQVRNOztvQkFXVixRQUFBLEdBQVUsU0FBQyxLQUFELEVBQVEsR0FBUjtBQUVOLFlBQUE7UUFBQSxJQUFVLEtBQUEsQ0FBTSxLQUFOLENBQVY7QUFBQSxtQkFBQTs7QUFFQSxhQUFBLHVDQUFBOztZQUNJLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBTixDQUFXLElBQUksR0FBSixDQUFRLElBQVIsRUFBVyxJQUFYLENBQVg7QUFESjtRQUdBLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBUixDQUFBO2VBQ0E7SUFSTTs7b0JBVVYsTUFBQSxHQUFRLFNBQUMsR0FBRCxFQUFNLEdBQU47QUFFSixZQUFBO1FBQUEsSUFBQSxHQUNJO1lBQUEsSUFBQSxFQUFNLEtBQUssQ0FBQyxJQUFOLENBQVcsS0FBSyxDQUFDLEtBQU4sQ0FBWSxHQUFaLENBQVgsQ0FBTjtZQUNBLElBQUEsRUFBTSxLQUROO1lBRUEsSUFBQSxFQUFNLEtBQUssQ0FBQyxJQUFOLENBQVcsR0FBWCxDQUZOOztlQUlKLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBVCxFQUFlLEdBQWY7SUFQSTs7b0JBU1IsT0FBQSxHQUFTLFNBQUMsSUFBRCxFQUFPLEdBQVA7QUFFTCxZQUFBO1FBQUEsSUFBQSxHQUNJO1lBQUEsSUFBQSxFQUFNLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFOO1lBQ0EsSUFBQSxFQUFNLE1BRE47WUFFQSxJQUFBLEVBQU0sS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLENBRk47O1FBR0osSUFBd0IsS0FBSyxDQUFDLE1BQU4sQ0FBYSxJQUFiLENBQXhCO1lBQUEsSUFBSSxDQUFDLFFBQUwsR0FBZ0IsS0FBaEI7O2VBQ0EsSUFBQyxDQUFBLE9BQUQsQ0FBUyxJQUFULEVBQWUsR0FBZjtJQVBLOztvQkFTVCxPQUFBLEdBQVUsU0FBQyxJQUFELEVBQU8sR0FBUDtBQUVOLFlBQUE7UUFBQSxDQUFDLENBQUMsV0FBRixDQUFjLElBQUMsQ0FBQSxLQUFmLEVBQXNCLENBQUMsSUFBRCxDQUF0QixFQUE4QixDQUFDLENBQUMsT0FBaEM7UUFFQSxrQkFBRyxHQUFHLENBQUUsWUFBUjtZQUNJLEtBQUEsR0FBUSxJQUFDLENBQUEsYUFBRCxDQUFlLEdBQUcsQ0FBQyxHQUFuQjtZQUNSLElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBUCxDQUFjLElBQUksQ0FBQyxHQUFMLENBQVMsS0FBVCxFQUFnQixJQUFDLENBQUEsS0FBSyxDQUFDLE1BQXZCLENBQWQsRUFBOEMsQ0FBOUMsRUFBaUQsSUFBakQsRUFGSjtTQUFBLE1BQUE7WUFJSSxJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBWSxJQUFaLEVBSko7O1FBTUEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsS0FBWDtRQUNBLElBQWtCLElBQUMsQ0FBQSxXQUFuQjttQkFBQSxJQUFDLENBQUEsV0FBRCxDQUFBLEVBQUE7O0lBWE07O29CQWFWLE9BQUEsR0FBUyxTQUFDLEdBQUQsRUFBTSxHQUFOO2VBQWMsSUFBQyxDQUFBLE9BQUQsQ0FBUyxHQUFHLENBQUMsSUFBYixFQUFtQjtZQUFBLEdBQUEsRUFBSSxHQUFKO1NBQW5CO0lBQWQ7O29CQUVULE9BQUEsR0FBUyxTQUFBO2VBQUcsS0FBQSxDQUFNLElBQUMsQ0FBQSxJQUFQO0lBQUg7O29CQUVULEtBQUEsR0FBTyxTQUFBO1FBRUgsSUFBQyxDQUFBLFdBQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxHQUFHLENBQUMsU0FBTCxHQUFpQjtRQUNqQixJQUFDLENBQUEsS0FBSyxDQUFDLFNBQVAsR0FBbUI7UUFDbkIsSUFBQyxDQUFBLElBQUQsR0FBUTtlQUNSLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBUixDQUFBO0lBTkc7O29CQVFQLElBQUEsR0FBTSxTQUFBO2VBQUc7SUFBSDs7b0JBUU4sT0FBQSxHQUFTLFNBQUE7UUFFTCxJQUFDLENBQUEsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFmLENBQW1CLE9BQW5CO1FBQ0EsSUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDLFNBQVQsR0FBcUIsR0FBeEI7bUJBQ0ksSUFBQyxDQUFBLE9BQU8sQ0FBQyxZQUFULENBQXNCLEdBQXRCLEVBREo7O0lBSEs7O29CQVlULFdBQUEsR0FBYSxTQUFDLEtBQUQ7QUFBVyxZQUFBOzZEQUFrQixDQUFFLFdBQXBCLENBQUE7SUFBWDs7b0JBQ2IsVUFBQSxHQUFhLFNBQUMsS0FBRDtBQUFXLFlBQUE7NkRBQWtCLENBQUUsVUFBcEIsQ0FBQTtJQUFYOztvQkFDYixPQUFBLEdBQWEsU0FBQyxLQUFEO0FBQVcsWUFBQTs2REFBa0IsQ0FBRSxRQUFwQixDQUE2QixLQUE3QjtJQUFYOztvQkFDYixVQUFBLEdBQWEsU0FBQyxLQUFEO2VBQVcsSUFBQyxDQUFBLFlBQUQsQ0FBYyxPQUFkO0lBQVg7O29CQVFiLFlBQUEsR0FBYyxTQUFDLEdBQUQ7QUFFVixZQUFBO1FBQUEsSUFBZ0QsQ0FBSSxJQUFDLENBQUEsT0FBRCxDQUFBLENBQXBEO0FBQUEsbUJBQU8sTUFBQSxDQUFPLG9CQUFBLEdBQXFCLElBQUMsQ0FBQSxLQUF0QixHQUE0QixHQUFuQyxFQUFQOztRQUNBLEtBQUEsdUZBQWdDLENBQUM7UUFDakMsSUFBaUUsZUFBSixJQUFjLE1BQU0sQ0FBQyxLQUFQLENBQWEsS0FBYixDQUEzRTtZQUFBLE1BQUEsQ0FBTywyQkFBQSxHQUE0QixLQUE1QixHQUFrQyxHQUF6QyxFQUE2QyxJQUFDLENBQUEsU0FBRCxDQUFBLENBQTdDLEVBQUE7O1FBRUEsS0FBQTtBQUFRLG9CQUFPLEdBQVA7QUFBQSxxQkFDQyxJQUREOzJCQUNrQixLQUFBLEdBQU07QUFEeEIscUJBRUMsTUFGRDsyQkFFa0IsS0FBQSxHQUFNO0FBRnhCLHFCQUdDLE1BSEQ7MkJBR2tCO0FBSGxCLHFCQUlDLEtBSkQ7MkJBSWtCLElBQUMsQ0FBQSxLQUFLLENBQUM7QUFKekIscUJBS0MsU0FMRDsyQkFLa0IsS0FBQSxHQUFNLElBQUMsQ0FBQSxVQUFELENBQUE7QUFMeEIscUJBTUMsV0FORDsyQkFNa0IsS0FBQSxDQUFNLENBQU4sRUFBUyxJQUFDLENBQUEsS0FBSyxDQUFDLE1BQWhCLEVBQXdCLEtBQUEsR0FBTSxJQUFDLENBQUEsVUFBRCxDQUFBLENBQTlCO0FBTmxCOzJCQU9DO0FBUEQ7O1FBU1IsSUFBb0QsZUFBSixJQUFjLE1BQU0sQ0FBQyxLQUFQLENBQWEsS0FBYixDQUE5RDtZQUFBLE1BQUEsQ0FBTyxXQUFBLEdBQVksS0FBWixHQUFrQixJQUFsQixHQUFxQixDQUFDLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBRCxDQUE1QixFQUFBOztRQUNBLEtBQUEsR0FBUSxLQUFBLENBQU0sQ0FBTixFQUFTLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBQSxHQUFXLENBQXBCLEVBQXVCLEtBQXZCO1FBRVIsSUFBc0Usb0VBQXRFO1lBQUEsTUFBQSxDQUFPLGtCQUFBLEdBQW1CLEtBQW5CLEdBQXlCLEdBQXpCLEdBQTJCLENBQUMsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFBLEdBQVcsQ0FBWixDQUEzQixHQUF5QyxHQUFoRCxFQUFvRCxJQUFDLENBQUEsT0FBRCxDQUFBLENBQXBELEVBQUE7O1FBRUEsUUFBQSxHQUFXLENBQUEsU0FBQSxLQUFBO21CQUFBLFNBQUMsTUFBRDtnQkFDUCxLQUFDLENBQUEsY0FBRCxHQUFrQjt1QkFDbEIsSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWLEVBQXdCLE1BQXhCO1lBRk87UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO1FBSVgsSUFBUSxHQUFBLEtBQU8sSUFBUCxJQUFrQixLQUFBLEdBQVEsSUFBQyxDQUFBLEtBQUssQ0FBQyxNQUF6QzttQkFBeUQsUUFBQSxDQUFTLGtCQUFULEVBQXpEO1NBQUEsTUFDSyxJQUFHLEdBQUEsS0FBTyxNQUFQLElBQWtCLEtBQUEsR0FBUSxJQUFDLENBQUEsS0FBSyxDQUFDLE1BQVAsR0FBZ0IsQ0FBN0M7bUJBQW9ELFFBQUEsQ0FBUyxtQkFBVCxFQUFwRDtTQUFBLE1BQUE7bUJBQ0EsSUFBQyxDQUFBLElBQUssQ0FBQSxLQUFBLENBQU0sQ0FBQyxRQUFiLENBQUEsRUFEQTs7SUF6Qks7O29CQTRCZCxtQkFBQSxHQUFxQixTQUFBO0FBRWpCLFlBQUE7UUFBQSxJQUFHLElBQUEsMkNBQW1CLENBQUUsYUFBeEI7WUFDSSxJQUFHLElBQUksQ0FBQyxJQUFMLEtBQWEsTUFBYixJQUF3QixJQUFJLENBQUMsUUFBaEM7Z0JBQ0ksTUFBTSxDQUFDLFNBQVAsQ0FBaUIsQ0FBQyxJQUFJLENBQUMsSUFBTixDQUFqQixFQUE4QjtvQkFBQSxTQUFBLEVBQVcsSUFBWDtpQkFBOUIsRUFESjthQURKOztlQUdBO0lBTGlCOztvQkFPckIsWUFBQSxHQUFjLFNBQUE7QUFFVixZQUFBO1FBQUEsSUFBRyxHQUFBLEdBQU0sSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFUO1lBQ0ksSUFBRyxJQUFDLENBQUEsV0FBSjtnQkFDSSxJQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBVCxLQUFpQixrQkFBcEI7b0JBQ0ksSUFBQyxDQUFBLGFBQUQsQ0FBQTtBQUNBLDJCQUZKOztnQkFHQSxJQUFHLEdBQUcsQ0FBQyxLQUFKLENBQUEsQ0FBQSxHQUFjLElBQUMsQ0FBQSxxQkFBRCxDQUFBLENBQWpCO29CQUNJLE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBaEIsQ0FBMkIsR0FBRyxDQUFDLElBQS9CLEVBREo7aUJBSko7O1lBT0EsVUFBQSx3Q0FBMEIsR0FBRyxDQUFDLElBQUosQ0FBQTtZQUMxQixHQUFHLENBQUMsR0FBRyxDQUFDLE1BQVIsQ0FBQTtZQUNBLElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBUCxDQUFjLEdBQUcsQ0FBQyxLQUFKLENBQUEsQ0FBZCxFQUEyQixDQUEzQjtZQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixDQUFhLEdBQUcsQ0FBQyxLQUFKLENBQUEsQ0FBYixFQUEwQixDQUExQjs7Z0JBQ0EsVUFBVSxDQUFFLFFBQVosQ0FBQTs7WUFDQSxJQUFDLENBQUEsU0FBRCxDQUFBLEVBYko7O2VBY0E7SUFoQlU7O29CQXdCZCxlQUFBLEdBQWlCLFNBQUMsTUFBRDtBQUViLFlBQUE7UUFBQSxJQUFPLGNBQVA7WUFDSSxNQUFBLEdBQVMsR0FBQSxDQUFJLElBQUMsQ0FBQSxJQUFJLENBQUMscUJBQU4sQ0FBQSxDQUE2QixDQUFDLElBQWxDLEVBQXdDLElBQUMsQ0FBQSxJQUFJLENBQUMscUJBQU4sQ0FBQSxDQUE2QixDQUFDLEdBQXRFLEVBRGI7O1FBR0EsR0FBQSxHQUFNO1lBQUEsS0FBQSxFQUFPO2dCQUNUO29CQUFBLElBQUEsRUFBUSxnQkFBUjtvQkFDQSxLQUFBLEVBQVEsT0FEUjtvQkFFQSxFQUFBLEVBQVEsSUFBQyxDQUFBLGFBRlQ7aUJBRFMsRUFLVDtvQkFBQSxJQUFBLEVBQVEsbUJBQVI7b0JBQ0EsS0FBQSxFQUFRLFFBRFI7b0JBRUEsRUFBQSxFQUFRLElBQUMsQ0FBQSxnQkFGVDtpQkFMUyxFQVNUO29CQUFBLElBQUEsRUFBUSxRQUFSO29CQUNBLEtBQUEsRUFBUSxXQURSO29CQUVBLEVBQUEsRUFBUSxJQUFDLENBQUEsWUFGVDtpQkFUUyxFQWFUO29CQUFBLElBQUEsRUFBUSxlQUFSO29CQUNBLEVBQUEsRUFBUSxJQUFDLENBQUEsWUFEVDtpQkFiUzthQUFQOztRQWlCTixHQUFHLENBQUMsQ0FBSixHQUFRLE1BQU0sQ0FBQztRQUNmLEdBQUcsQ0FBQyxDQUFKLEdBQVEsTUFBTSxDQUFDO2VBQ2YsS0FBSyxDQUFDLElBQU4sQ0FBVyxHQUFYO0lBeEJhOztvQkFnQ2pCLEtBQUEsR0FBTyxTQUFDLEtBQUQ7QUFFSCxZQUFBO1FBQUEsT0FBNEIsT0FBTyxDQUFDLFFBQVIsQ0FBaUIsS0FBakIsQ0FBNUIsRUFBRSxjQUFGLEVBQU8sY0FBUCxFQUFZLGtCQUFaLEVBQW1CO0FBRW5CLGdCQUFPLEtBQVA7QUFBQSxpQkFDUyxlQURUO0FBQUEsaUJBQzBCLFlBRDFCO0FBQzRDLHVCQUFPLElBQUMsQ0FBQSxtQkFBRCxDQUFBO0FBRG5ELGlCQUVTLFdBRlQ7QUFBQSxpQkFFc0IsUUFGdEI7QUFFb0MsdUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFdBQUQsQ0FBQSxDQUFjLENBQUMsWUFBZixDQUFBLENBQWpCO0FBRjNDLGlCQUdTLFdBSFQ7QUFBQSxpQkFHc0IsUUFIdEI7Z0JBR29DLElBQTBCLElBQUMsQ0FBQSxPQUFPLENBQUMsT0FBVCxDQUFBLENBQTFCO0FBQUEsMkJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBUDs7QUFBZDtBQUh0QixpQkFJUyxLQUpUO2dCQUtRLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFYO29CQUF1QixJQUFDLENBQUEsUUFBRCxDQUFVLEVBQVYsRUFBdkI7O0FBQ0EsdUJBQU8sU0FBQSxDQUFVLEtBQVY7QUFOZixpQkFPUyxLQVBUO2dCQVFRLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFYO29CQUF1QixJQUFDLENBQUEsV0FBRCxDQUFBLEVBQXZCO2lCQUFBLE1BQUE7b0JBQ0ssTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFiLENBQW1CLG9CQUFuQixFQURMOztBQUVBLHVCQUFPLFNBQUEsQ0FBVSxLQUFWO0FBVmY7QUFZQSxnQkFBTyxHQUFQO0FBQUEsaUJBQ1MsSUFEVDtBQUFBLGlCQUNlLE1BRGY7QUFBQSxpQkFDdUIsU0FEdkI7QUFBQSxpQkFDa0MsV0FEbEM7QUFBQSxpQkFDK0MsTUFEL0M7QUFBQSxpQkFDdUQsS0FEdkQ7QUFFUSx1QkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsQ0FBakI7QUFGZixpQkFHUyxPQUhUO0FBQUEsaUJBR2tCLE9BSGxCO0FBSVEsdUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFlBQUQsQ0FBQSxDQUFqQjtBQUpmO0FBTUEsZ0JBQU8sSUFBUDtBQUFBLGlCQUNTLEdBRFQ7QUFBQSxpQkFDYyxHQURkO0FBQ3VCLHVCQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBZCxDQUFqQjtBQUQ5QjtRQUdBLElBQUcsQ0FBQSxHQUFBLEtBQVEsT0FBUixJQUFBLEdBQUEsS0FBaUIsRUFBakIsQ0FBQSxJQUF5QixJQUE1QjtZQUFzQyxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsRUFBdEM7O1FBRUEsSUFBRyxHQUFBLEtBQVEsTUFBWDtBQUF3QixtQkFBTyxTQUFBLENBQVUsS0FBVixFQUEvQjs7SUEzQkc7Ozs7R0FuU1M7O0FBZ1VwQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICBcbjAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAgIFxuICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICBcbiMjI1xuXG57IHN0b3BFdmVudCwga2V5aW5mbywgc2xhc2gsIHBvc3QsIHBvcHVwLCBlbGVtLCBjbGFtcCwgZW1wdHksIGZpcnN0LCBsYXN0LCBrZXJyb3IsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuUm93ICAgICAgPSByZXF1aXJlICcuL3JvdydcblNjcm9sbGVyID0gcmVxdWlyZSAnLi9zY3JvbGxlcidcbkNvbHVtbiAgID0gcmVxdWlyZSAnLi9jb2x1bW4nXG5mdXp6eSAgICA9IHJlcXVpcmUgJ2Z1enp5J1xuICAgIFxuY2xhc3MgU2hlbGYgZXh0ZW5kcyBDb2x1bW5cblxuICAgIGNvbnN0cnVjdG9yOiAoYnJvd3NlcikgLT5cblxuICAgICAgICBzdXBlciBicm93c2VyXG4gICAgICAgIFxuICAgICAgICBAaXRlbXMgID0gW11cbiAgICAgICAgQGluZGV4ICA9IC0xXG4gICAgICAgIEBkaXYuaWQgPSAnc2hlbGYnXG4gICAgICAgIFxuICAgICAgICAjIEBzaG93SGlzdG9yeSA9IHdpbmRvdy5zdGFzaC5nZXQgJ3NoZWxmfGhpc3RvcnknIHRydWVcblxuICAgICAgICBwb3N0Lm9uICdhZGRUb1NoZWxmJyAgICAgICAgICAgICBAYWRkUGF0aFxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnZmlsZScgQG9uRmlsZVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcbiAgIFxuICAgIGFjdGl2YXRlUm93OiAocm93KSAtPiBcbiAgICAgICAgXG4gICAgICAgIGl0ZW0gPSByb3cuaXRlbVxuICAgICAgICBcbiAgICAgICAgaWYgaXRlbS50eXBlID09ICdoaXN0b3J5U2VwYXJhdG9yJ1xuICAgICAgICAgICAgcm93LnNldEFjdGl2ZSBlbWl0OmZhbHNlXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgICQoJy5ob3ZlcicpPy5jbGFzc0xpc3QucmVtb3ZlICdob3ZlcidcbiAgICAgICAgcm93LnNldEFjdGl2ZSBlbWl0OnRydWVcbiAgICAgICAgXG4gICAgICAgIGlmIGl0ZW0udHlwZSA9PSAnZmlsZSdcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScsIGl0ZW1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdmaWxlYnJvd3NlcicsICdsb2FkSXRlbScsIGl0ZW1cbiAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBmaWxlXG4gICAgICAgIGlmIEBuYXZpZ2F0aW5nUm93c1xuICAgICAgICAgICAgZGVsZXRlIEBuYXZpZ2F0aW5nUm93c1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBmb3IgaW5kZXggaW4gWzAuLi5AaXRlbXMubGVuZ3RoXVxuICAgICAgICAgICAgaWYgQGl0ZW1zW2luZGV4XS5maWxlID09IGZpbGVcbiAgICAgICAgICAgICAgICBAcm93c1tpbmRleF0uc2V0QWN0aXZlKClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIG1hdGNoZXMgPSBbXVxuICAgICAgICBmb3IgaW5kZXgsaXRlbSBvZiBAaXRlbXNcbiAgICAgICAgICAgIGlmIGZpbGU/LnN0YXJ0c1dpdGggaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgbWF0Y2hlcy5wdXNoIFtpbmRleCwgaXRlbV1cblxuICAgICAgICBpZiBub3QgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgbWF0Y2hlcy5zb3J0IChhLGIpIC0+IGJbMV0uZmlsZS5sZW5ndGggLSBhWzFdLmZpbGUubGVuZ3RoXG4gICAgICAgICAgICBbaW5kZXgsIGl0ZW1dID0gZmlyc3QgbWF0Y2hlc1xuICAgICAgICAgICAgQHJvd3NbaW5kZXhdLnNldEFjdGl2ZSgpXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGJyb3dzZXJEaWRJbml0Q29sdW1uczogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAZGlkSW5pdFxuICAgICAgICBcbiAgICAgICAgQGRpZEluaXQgPSB0cnVlXG4gICAgICAgIFxuICAgICAgICBAbG9hZFNoZWxmSXRlbXMoKVxuICAgICAgICBcbiAgICAgICAgQGxvYWRIaXN0b3J5KCkgaWYgQHNob3dIaXN0b3J5XG4gICAgICAgIFxuICAgIGxvYWRTaGVsZkl0ZW1zOiAtPlxuICAgICAgICBcbiAgICAgICAgIyBpdGVtcyA9IHdpbmRvdy5zdGF0ZS5nZXQgXCJzaGVsZnxpdGVtc1wiXG4gICAgICAgICMgQHNldEl0ZW1zIGl0ZW1zLCBzYXZlOmZhbHNlXG4gICAgICAgICAgICAgICAgXG4gICAgYWRkUGF0aDogKHBhdGgsIG9wdCkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRGlyIHBhdGhcbiAgICAgICAgICAgIEBhZGREaXIgcGF0aCwgb3B0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBhZGRGaWxlIHBhdGgsIG9wdFxuICAgICAgICBcbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG4gICAgaXRlbVBhdGhzOiAtPiBAcm93cy5tYXAgKHIpIC0+IHIucGF0aCgpXG4gICAgXG4gICAgc2F2ZVByZWZzOiAtPiBcbiAgICAgICAgd2luZG93LnN0YXRlLnNldCBcInNoZWxmfGl0ZW1zXCIsIEBpdGVtc1xuICAgIFxuICAgIHNldEl0ZW1zOiAoQGl0ZW1zLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBAY2xlYXIoKVxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zID89IFtdXG4gICAgICAgIEBhZGRJdGVtcyBAaXRlbXNcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdD8uc2F2ZSAhPSBmYWxzZVxuICAgICAgICAgICAgQHNhdmVQcmVmcygpICAgICAgICAgICAgXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgYWRkSXRlbXM6IChpdGVtcywgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGl0ZW1zXG4gICAgICAgIFxuICAgICAgICBmb3IgaXRlbSBpbiBpdGVtc1xuICAgICAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgICAgIFxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgYWRkRGlyOiAoZGlyLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtID0gXG4gICAgICAgICAgICBuYW1lOiBzbGFzaC5maWxlIHNsYXNoLnRpbGRlIGRpclxuICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgIGZpbGU6IHNsYXNoLnBhdGggZGlyXG4gICAgICAgIFxuICAgICAgICBAYWRkSXRlbSBpdGVtLCBvcHRcblxuICAgIGFkZEZpbGU6IChmaWxlLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtID0gXG4gICAgICAgICAgICBuYW1lOiBzbGFzaC5maWxlIGZpbGVcbiAgICAgICAgICAgIHR5cGU6ICdmaWxlJ1xuICAgICAgICAgICAgZmlsZTogc2xhc2gucGF0aCBmaWxlXG4gICAgICAgIGl0ZW0udGV4dEZpbGUgPSB0cnVlIGlmIHNsYXNoLmlzVGV4dCBmaWxlXG4gICAgICAgIEBhZGRJdGVtIGl0ZW0sIG9wdFxuICAgICAgICBcbiAgICBhZGRJdGVtOiAgKGl0ZW0sIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIF8ucHVsbEFsbFdpdGggQGl0ZW1zLCBbaXRlbV0sIF8uaXNFcXVhbCAjIHJlbW92ZSBpdGVtIGlmIG9uIHNoZWxmIGFscmVhZHlcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdD8ucG9zXG4gICAgICAgICAgICBpbmRleCA9IEByb3dJbmRleEF0UG9zIG9wdC5wb3NcbiAgICAgICAgICAgIEBpdGVtcy5zcGxpY2UgTWF0aC5taW4oaW5kZXgsIEBpdGVtcy5sZW5ndGgpLCAwLCBpdGVtXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpdGVtcy5wdXNoIGl0ZW1cbiAgICAgICAgICAgIFxuICAgICAgICBAc2V0SXRlbXMgQGl0ZW1zXG4gICAgICAgIEBsb2FkSGlzdG9yeSgpIGlmIEBzaG93SGlzdG9yeVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgZHJvcFJvdzogKHJvdywgcG9zKSAtPiBAYWRkSXRlbSByb3cuaXRlbSwgcG9zOnBvc1xuICAgICAgICAgICAgXG4gICAgaXNFbXB0eTogLT4gZW1wdHkgQHJvd3NcbiAgICBcbiAgICBjbGVhcjogLT5cbiAgICAgICAgXG4gICAgICAgIEBjbGVhclNlYXJjaCgpXG4gICAgICAgIEBkaXYuc2Nyb2xsVG9wID0gMFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgQHJvd3MgPSBbXVxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIG5hbWU6IC0+ICdzaGVsZidcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBvbkZvY3VzOiA9PiBcblxuICAgICAgICBAZGl2LmNsYXNzTGlzdC5hZGQgJ2ZvY3VzJ1xuICAgICAgICBpZiBAYnJvd3Nlci5zaGVsZlNpemUgPCAyMDBcbiAgICAgICAgICAgIEBicm93c2VyLnNldFNoZWxmU2l6ZSAyMDBcbiAgICAgICAgXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBvbk1vdXNlT3ZlcjogKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdmVyKClcbiAgICBvbk1vdXNlT3V0OiAgKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdXQoKVxuICAgIG9uQ2xpY2s6ICAgICAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8uYWN0aXZhdGUgZXZlbnRcbiAgICBvbkRibENsaWNrOiAgKGV2ZW50KSA9PiBAbmF2aWdhdGVDb2xzICdlbnRlcidcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcblxuICAgIG5hdmlnYXRlUm93czogKGtleSkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yIFwibm8gcm93cyBpbiBjb2x1bW4gI3tAaW5kZXh9P1wiIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gLTFcbiAgICAgICAga2Vycm9yIFwibm8gaW5kZXggZnJvbSBhY3RpdmVSb3c/ICN7aW5kZXh9P1wiLCBAYWN0aXZlUm93KCkgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIGluZGV4LTFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiBpbmRleCsxXG4gICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gMFxuICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIEBpdGVtcy5sZW5ndGhcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiBpbmRleC1AbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gY2xhbXAgMCwgQGl0ZW1zLmxlbmd0aCwgaW5kZXgrQG51bVZpc2libGUoKVxuICAgICAgICAgICAgZWxzZSBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIGluZGV4ICN7aW5kZXh9PyAje0BudW1WaXNpYmxlKCl9XCIgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXggICAgICAgIFxuICAgICAgICBpbmRleCA9IGNsYW1wIDAsIEBudW1Sb3dzKCktMSwgaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIHJvdyBhdCBpbmRleCAje2luZGV4fS8je0BudW1Sb3dzKCktMX0/XCIsIEBudW1Sb3dzKCkgaWYgbm90IEByb3dzW2luZGV4XT8uYWN0aXZhdGU/XG5cbiAgICAgICAgbmF2aWdhdGUgPSAoYWN0aW9uKSA9PlxuICAgICAgICAgICAgQG5hdmlnYXRpbmdSb3dzID0gdHJ1ZVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdtZW51QWN0aW9uJywgYWN0aW9uXG4gICAgICAgIFxuICAgICAgICBpZiAgICAgIGtleSA9PSAndXAnICAgYW5kIGluZGV4ID4gQGl0ZW1zLmxlbmd0aCAgICAgdGhlbiBuYXZpZ2F0ZSAnTmF2aWdhdGUgRm9yd2FyZCdcbiAgICAgICAgZWxzZSBpZiBrZXkgPT0gJ2Rvd24nIGFuZCBpbmRleCA+IEBpdGVtcy5sZW5ndGggKyAxIHRoZW4gbmF2aWdhdGUgJ05hdmlnYXRlIEJhY2t3YXJkJ1xuICAgICAgICBlbHNlIEByb3dzW2luZGV4XS5hY3RpdmF0ZSgpXG4gICAgXG4gICAgb3BlbkZpbGVJbk5ld1dpbmRvdzogLT4gIFxuICAgICAgICBcbiAgICAgICAgaWYgaXRlbSA9IEBhY3RpdmVSb3coKT8uaXRlbVxuICAgICAgICAgICAgaWYgaXRlbS50eXBlID09ICdmaWxlJyBhbmQgaXRlbS50ZXh0RmlsZVxuICAgICAgICAgICAgICAgIHdpbmRvdy5vcGVuRmlsZXMgW2l0ZW0uZmlsZV0sIG5ld1dpbmRvdzogdHJ1ZVxuICAgICAgICBAXG4gICAgXG4gICAgcmVtb3ZlT2JqZWN0OiA9PlxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiByb3cgPSBAYWN0aXZlUm93KClcbiAgICAgICAgICAgIGlmIEBzaG93SGlzdG9yeVxuICAgICAgICAgICAgICAgIGlmIHJvdy5pdGVtLnR5cGUgPT0gJ2hpc3RvcnlTZXBhcmF0b3InXG4gICAgICAgICAgICAgICAgICAgIEB0b2dnbGVIaXN0b3J5KClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgaWYgcm93LmluZGV4KCkgPiBAaGlzdG9yeVNlcGFyYXRvckluZGV4KClcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lm5hdmlnYXRlLmRlbEZpbGVQb3Mgcm93Lml0ZW1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG5leHRPclByZXYgPSByb3cubmV4dCgpID8gcm93LnByZXYoKVxuICAgICAgICAgICAgcm93LmRpdi5yZW1vdmUoKVxuICAgICAgICAgICAgQGl0ZW1zLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICAgICAgQHJvd3Muc3BsaWNlIHJvdy5pbmRleCgpLCAxXG4gICAgICAgICAgICBuZXh0T3JQcmV2Py5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBAc2F2ZVByZWZzKClcbiAgICAgICAgQFxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgXG4gICAgXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IHBvcyBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0LCBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcbiAgICAgICAgXG4gICAgICAgIG9wdCA9IGl0ZW1zOiBbIFxuICAgICAgICAgICAgdGV4dDogICAnVG9nZ2xlIEhpc3RvcnknXG4gICAgICAgICAgICBjb21ibzogICdhbHQraCcgXG4gICAgICAgICAgICBjYjogICAgIEB0b2dnbGVIaXN0b3J5XG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ1RvZ2dsZSBFeHRlbnNpb25zJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHRvZ2dsZUV4dGVuc2lvbnNcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnUmVtb3ZlJ1xuICAgICAgICAgICAgY29tYm86ICAnYmFja3NwYWNlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHJlbW92ZU9iamVjdFxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdDbGVhciBIaXN0b3J5J1xuICAgICAgICAgICAgY2I6ICAgICBAY2xlYXJIaXN0b3J5XG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICBwb3B1cC5tZW51IG9wdFxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG9uS2V5OiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2VudGVyJywgJ2N0cmwrZW50ZXInIHRoZW4gcmV0dXJuIEBvcGVuRmlsZUluTmV3V2luZG93KClcbiAgICAgICAgICAgIHdoZW4gJ2JhY2tzcGFjZScsICdkZWxldGUnIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGNsZWFyU2VhcmNoKCkucmVtb3ZlT2JqZWN0KClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQraycsICdjdHJsK2snIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCBpZiBAYnJvd3Nlci5jbGVhblVwKClcbiAgICAgICAgICAgIHdoZW4gJ3RhYicgICAgXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAZG9TZWFyY2ggJydcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAY2xlYXJTZWFyY2goKVxuICAgICAgICAgICAgICAgIGVsc2Ugd2luZG93LnNwbGl0LmZvY3VzICdjb21tYW5kbGluZS1lZGl0b3InXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuXG4gICAgICAgIHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3VwJywgJ2Rvd24nLCAncGFnZSB1cCcsICdwYWdlIGRvd24nLCAnaG9tZScsICdlbmQnIFxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3Mga2V5XG4gICAgICAgICAgICB3aGVuICdyaWdodCcsICdlbnRlcidcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAZm9jdXNCcm93c2VyKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNoYXJcbiAgICAgICAgICAgIHdoZW4gJ34nLCAnLycgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAbmF2aWdhdGVSb290IGNoYXJcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBtb2QgaW4gWydzaGlmdCcsICcnXSBhbmQgY2hhciB0aGVuIEBkb1NlYXJjaCBjaGFyXG4gICAgICAgIFxuICAgICAgICBpZiBrZXkgaW4gWydsZWZ0J10gdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBTaGVsZlxuIl19
//# sourceURL=../coffee/shelf.coffee