// koffee 1.4.0

/*
 0000000  000   000  00000000  000      00000000
000       000   000  000       000      000     
0000000   000000000  0000000   000      000000  
     000  000   000  000       000      000     
0000000   000   000  00000000  0000000  000
 */
var $, Column, Row, Scroller, Shelf, _, clamp, elem, empty, first, fuzzy, kerror, keyinfo, klog, kpos, last, popup, post, prefs, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), stopEvent = ref.stopEvent, keyinfo = ref.keyinfo, slash = ref.slash, post = ref.post, prefs = ref.prefs, popup = ref.popup, elem = ref.elem, clamp = ref.clamp, empty = ref.empty, first = ref.first, last = ref.last, kpos = ref.kpos, klog = ref.klog, kerror = ref.kerror, $ = ref.$, _ = ref._;

Row = require('./row');

Scroller = require('./tools/scroller');

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
        this.onDrop = bind(this.onDrop, this);
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
        var ref1;
        if ((ref1 = $('.hover')) != null) {
            ref1.classList.remove('hover');
        }
        row.setActive({
            focus: false
        });
        return this.browser.loadItem(row.item, {
            focus: false,
            clear: 0
        });
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
        return this.loadShelfItems();
    };

    Shelf.prototype.loadShelfItems = function() {
        var items;
        items = prefs.get("shelf▸items");
        return this.setItems(items, {
            save: false
        });
    };

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
        return prefs.set("shelf▸items", this.items);
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
        return this.addItem(item, opt);
    };

    Shelf.prototype.addFiles = function(files, opt) {
        var file, i, len, results;
        results = [];
        for (i = 0, len = files.length; i < len; i++) {
            file = files[i];
            if (slash.isDir(file)) {
                results.push(this.addDir(file, opt));
            } else {
                results.push(this.addFile(file, opt));
            }
        }
        return results;
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
        return this.setItems(this.items);
    };

    Shelf.prototype.onDrop = function(event) {
        var action, item, source;
        action = event.getModifierState('Shift') && 'copy' || 'move';
        source = event.dataTransfer.getData('text/plain');
        item = this.browser.fileItem(source);
        return this.addItem(item, {
            pos: kpos(event)
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

    Shelf.prototype.removeObject = function() {
        var nextOrPrev, ref1, row;
        if (row = this.activeRow()) {
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
                    text: 'Toggle Extensions',
                    combo: 'ctrl+e'
                }, {
                    text: 'Remove',
                    combo: 'backspace',
                    cb: this.removeObject
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
                }
                return stopEvent(event);
            case 'up':
            case 'down':
            case 'page up':
            case 'page down':
            case 'home':
            case 'end':
                return stopEvent(event, this.navigateRows(key));
            case 'right':
            case 'alt+right':
            case 'enter':
                return stopEvent(event, this.focusBrowser());
        }
        if ((mod === 'shift' || mod === '') && char) {
            return this.doSearch(char);
        }
    };

    return Shelf;

})(Column);

module.exports = Shelf;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGYuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGtKQUFBO0lBQUE7Ozs7QUFRQSxNQUErRyxPQUFBLENBQVEsS0FBUixDQUEvRyxFQUFFLHlCQUFGLEVBQWEscUJBQWIsRUFBc0IsaUJBQXRCLEVBQTZCLGVBQTdCLEVBQW1DLGlCQUFuQyxFQUEwQyxpQkFBMUMsRUFBaUQsZUFBakQsRUFBdUQsaUJBQXZELEVBQThELGlCQUE5RCxFQUFxRSxpQkFBckUsRUFBNEUsZUFBNUUsRUFBa0YsZUFBbEYsRUFBd0YsZUFBeEYsRUFBOEYsbUJBQTlGLEVBQXNHLFNBQXRHLEVBQXlHOztBQUV6RyxHQUFBLEdBQVcsT0FBQSxDQUFRLE9BQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxrQkFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUVMOzs7SUFFQyxlQUFDLE9BQUQ7Ozs7Ozs7Ozs7OztRQUVDLHVDQUFNLE9BQU47UUFFQSxJQUFDLENBQUEsS0FBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLEtBQUQsR0FBVSxDQUFDO1FBQ1gsSUFBQyxDQUFBLEdBQUcsQ0FBQyxFQUFMLEdBQVU7UUFFVixJQUFJLENBQUMsRUFBTCxDQUFRLFlBQVIsRUFBcUIsSUFBQyxDQUFBLE9BQXRCO1FBRUEsSUFBSSxDQUFDLEVBQUwsQ0FBUSxNQUFSLEVBQWUsSUFBQyxDQUFBLE1BQWhCO0lBVkQ7O29CQWtCSCxXQUFBLEdBQWEsU0FBQyxHQUFEO0FBRVQsWUFBQTs7Z0JBQVcsQ0FBRSxTQUFTLENBQUMsTUFBdkIsQ0FBOEIsT0FBOUI7O1FBQ0EsR0FBRyxDQUFDLFNBQUosQ0FBYztZQUFBLEtBQUEsRUFBTSxLQUFOO1NBQWQ7ZUFFQSxJQUFDLENBQUEsT0FBTyxDQUFDLFFBQVQsQ0FBa0IsR0FBRyxDQUFDLElBQXRC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LE9BQVIsSUFBQSxHQUFBLEtBQWdCLEVBQWhCLENBQUEsSUFBd0IsSUFBM0I7bUJBQXFDLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixFQUFyQzs7SUFsQkc7Ozs7R0E5UVM7O0FBa1NwQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICBcbjAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAgIFxuICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICBcbiMjI1xuXG57IHN0b3BFdmVudCwga2V5aW5mbywgc2xhc2gsIHBvc3QsIHByZWZzLCBwb3B1cCwgZWxlbSwgY2xhbXAsIGVtcHR5LCBmaXJzdCwgbGFzdCwga3Bvcywga2xvZywga2Vycm9yLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cblJvdyAgICAgID0gcmVxdWlyZSAnLi9yb3cnXG5TY3JvbGxlciA9IHJlcXVpcmUgJy4vdG9vbHMvc2Nyb2xsZXInXG5Db2x1bW4gICA9IHJlcXVpcmUgJy4vY29sdW1uJ1xuZnV6enkgICAgPSByZXF1aXJlICdmdXp6eSdcbiAgICBcbmNsYXNzIFNoZWxmIGV4dGVuZHMgQ29sdW1uXG5cbiAgICBAOiAoYnJvd3NlcikgLT5cblxuICAgICAgICBzdXBlciBicm93c2VyXG4gICAgICAgIFxuICAgICAgICBAaXRlbXMgID0gW11cbiAgICAgICAgQGluZGV4ICA9IC0xXG4gICAgICAgIEBkaXYuaWQgPSAnc2hlbGYnXG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdhZGRUb1NoZWxmJyBAYWRkUGF0aFxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnZmlsZScgQG9uRmlsZVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcbiAgIFxuICAgIGFjdGl2YXRlUm93OiAocm93KSAtPiBcbiAgICAgICAgXG4gICAgICAgICQoJy5ob3ZlcicpPy5jbGFzc0xpc3QucmVtb3ZlICdob3ZlcidcbiAgICAgICAgcm93LnNldEFjdGl2ZSBmb2N1czpmYWxzZVxuICAgICAgICBcbiAgICAgICAgQGJyb3dzZXIubG9hZEl0ZW0gcm93Lml0ZW0sIGZvY3VzOmZhbHNlLCBjbGVhcjowXG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG9uRmlsZTogKGZpbGUpID0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgZmlsZVxuICAgICAgICBpZiBAbmF2aWdhdGluZ1Jvd3NcbiAgICAgICAgICAgIGRlbGV0ZSBAbmF2aWdhdGluZ1Jvd3NcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgZm9yIGluZGV4IGluIFswLi4uQGl0ZW1zLmxlbmd0aF1cbiAgICAgICAgICAgIGlmIEBpdGVtc1tpbmRleF0uZmlsZSA9PSBmaWxlXG4gICAgICAgICAgICAgICAgQHJvd3NbaW5kZXhdLnNldEFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBtYXRjaGVzID0gW11cbiAgICAgICAgZm9yIGluZGV4LGl0ZW0gb2YgQGl0ZW1zXG4gICAgICAgICAgICBpZiBmaWxlPy5zdGFydHNXaXRoIGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgIG1hdGNoZXMucHVzaCBbaW5kZXgsIGl0ZW1dXG5cbiAgICAgICAgaWYgbm90IGVtcHR5IG1hdGNoZXNcbiAgICAgICAgICAgIG1hdGNoZXMuc29ydCAoYSxiKSAtPiBiWzFdLmZpbGUubGVuZ3RoIC0gYVsxXS5maWxlLmxlbmd0aFxuICAgICAgICAgICAgW2luZGV4LCBpdGVtXSA9IGZpcnN0IG1hdGNoZXNcbiAgICAgICAgICAgIEByb3dzW2luZGV4XS5zZXRBY3RpdmUoKVxuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBicm93c2VyRGlkSW5pdENvbHVtbnM6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgQGRpZEluaXRcbiAgICAgICAgXG4gICAgICAgIEBkaWRJbml0ID0gdHJ1ZVxuICAgICAgICBcbiAgICAgICAgQGxvYWRTaGVsZkl0ZW1zKClcbiAgICAgICAgXG4gICAgbG9hZFNoZWxmSXRlbXM6IC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtcyA9IHByZWZzLmdldCBcInNoZWxm4pa4aXRlbXNcIlxuICAgICAgICBAc2V0SXRlbXMgaXRlbXMsIHNhdmU6ZmFsc2VcbiAgICAgICAgICAgICAgICBcbiAgICBhZGRQYXRoOiAocGF0aCwgb3B0KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guaXNEaXIgcGF0aFxuICAgICAgICAgICAgQGFkZERpciBwYXRoLCBvcHRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGFkZEZpbGUgcGF0aCwgb3B0XG4gICAgICAgIFxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbiAgICBpdGVtUGF0aHM6IC0+IEByb3dzLm1hcCAocikgLT4gci5wYXRoKClcbiAgICBcbiAgICBzYXZlUHJlZnM6IC0+IHByZWZzLnNldCBcInNoZWxm4pa4aXRlbXNcIiBAaXRlbXNcbiAgICBcbiAgICBzZXRJdGVtczogKEBpdGVtcywgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNsZWFyKClcbiAgICAgICAgXG4gICAgICAgIEBpdGVtcyA/PSBbXVxuICAgICAgICBAYWRkSXRlbXMgQGl0ZW1zXG4gICAgICAgIFxuICAgICAgICBpZiBvcHQ/LnNhdmUgIT0gZmFsc2VcbiAgICAgICAgICAgIEBzYXZlUHJlZnMoKSAgICAgICAgICAgIFxuICAgICAgICBAXG4gICAgICAgIFxuICAgIGFkZEl0ZW1zOiAoaXRlbXMsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBpdGVtc1xuICAgICAgICBcbiAgICAgICAgZm9yIGl0ZW0gaW4gaXRlbXNcbiAgICAgICAgICAgIEByb3dzLnB1c2ggbmV3IFJvdyBALCBpdGVtXG4gICAgICAgICAgICBcbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgIGFkZERpcjogKGRpciwgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbSA9IFxuICAgICAgICAgICAgbmFtZTogc2xhc2guZmlsZSBzbGFzaC50aWxkZSBkaXJcbiAgICAgICAgICAgIHR5cGU6ICdkaXInXG4gICAgICAgICAgICBmaWxlOiBzbGFzaC5wYXRoIGRpclxuICAgICAgICBcbiAgICAgICAgQGFkZEl0ZW0gaXRlbSwgb3B0XG5cbiAgICBhZGRGaWxlOiAoZmlsZSwgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbSA9IFxuICAgICAgICAgICAgbmFtZTogc2xhc2guZmlsZSBmaWxlXG4gICAgICAgICAgICB0eXBlOiAnZmlsZSdcbiAgICAgICAgICAgIGZpbGU6IHNsYXNoLnBhdGggZmlsZVxuICAgICAgICAgICAgXG4gICAgICAgIEBhZGRJdGVtIGl0ZW0sIG9wdFxuICAgICAgICBcbiAgICBhZGRGaWxlczogKGZpbGVzLCBvcHQpIC0+XG4gICAgICAgICMga2xvZyAnZmlsZXMnIGZpbGVzXG4gICAgICAgIGZvciBmaWxlIGluIGZpbGVzXG4gICAgICAgICAgICBpZiBzbGFzaC5pc0RpciBmaWxlXG4gICAgICAgICAgICAgICAgIyBrbG9nICdhZGREaXInIGZpbGVcbiAgICAgICAgICAgICAgICBAYWRkRGlyIGZpbGUsIG9wdFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICMga2xvZyAnYWRkRmlsZScgZmlsZVxuICAgICAgICAgICAgICAgIEBhZGRGaWxlIGZpbGUsIG9wdFxuICAgICAgICBcbiAgICBhZGRJdGVtOiAgKGl0ZW0sIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIF8ucHVsbEFsbFdpdGggQGl0ZW1zLCBbaXRlbV0sIF8uaXNFcXVhbCAjIHJlbW92ZSBpdGVtIGlmIG9uIHNoZWxmIGFscmVhZHlcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdD8ucG9zXG4gICAgICAgICAgICBpbmRleCA9IEByb3dJbmRleEF0UG9zIG9wdC5wb3NcbiAgICAgICAgICAgIEBpdGVtcy5zcGxpY2UgTWF0aC5taW4oaW5kZXgsIEBpdGVtcy5sZW5ndGgpLCAwLCBpdGVtXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpdGVtcy5wdXNoIGl0ZW1cbiAgICAgICAgICAgIFxuICAgICAgICBAc2V0SXRlbXMgQGl0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBvbkRyb3A6IChldmVudCkgPT4gXG4gICAgXG4gICAgICAgIGFjdGlvbiA9IGV2ZW50LmdldE1vZGlmaWVyU3RhdGUoJ1NoaWZ0JykgYW5kICdjb3B5JyBvciAnbW92ZSdcbiAgICAgICAgc291cmNlID0gZXZlbnQuZGF0YVRyYW5zZmVyLmdldERhdGEgJ3RleHQvcGxhaW4nXG4gICAgICAgIFxuICAgICAgICBpdGVtID0gQGJyb3dzZXIuZmlsZUl0ZW0gc291cmNlXG4gICAgICAgIEBhZGRJdGVtIGl0ZW0sIHBvczprcG9zIGV2ZW50XG4gICAgXG4gICAgaXNFbXB0eTogLT4gZW1wdHkgQHJvd3NcbiAgICBcbiAgICBjbGVhcjogLT5cbiAgICAgICAgXG4gICAgICAgIEBjbGVhclNlYXJjaCgpXG4gICAgICAgIEBkaXYuc2Nyb2xsVG9wID0gMFxuICAgICAgICBAdGFibGUuaW5uZXJIVE1MID0gJydcbiAgICAgICAgQHJvd3MgPSBbXVxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIG5hbWU6IC0+ICdzaGVsZidcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBvbkZvY3VzOiA9PiBcblxuICAgICAgICBAZGl2LmNsYXNzTGlzdC5hZGQgJ2ZvY3VzJ1xuICAgICAgICBpZiBAYnJvd3Nlci5zaGVsZlNpemUgPCAyMDBcbiAgICAgICAgICAgIEBicm93c2VyLnNldFNoZWxmU2l6ZSAyMDBcbiAgICAgICAgICAgIFxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgb25Nb3VzZU92ZXI6IChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5vbk1vdXNlT3ZlcigpXG4gICAgb25Nb3VzZU91dDogIChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5vbk1vdXNlT3V0KClcbiAgICBvbkNsaWNrOiAgICAgKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/LmFjdGl2YXRlIGV2ZW50XG4gICAgb25EYmxDbGljazogIChldmVudCkgPT4gQG5hdmlnYXRlQ29scyAnZW50ZXInXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG5cbiAgICBuYXZpZ2F0ZVJvd3M6IChrZXkpIC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciBcIm5vIHJvd3MgaW4gY29sdW1uICN7QGluZGV4fT9cIiBpZiBub3QgQG51bVJvd3MoKVxuICAgICAgICBpbmRleCA9IEBhY3RpdmVSb3coKT8uaW5kZXgoKSA/IC0xXG4gICAgICAgIGtlcnJvciBcIm5vIGluZGV4IGZyb20gYWN0aXZlUm93PyAje2luZGV4fT9cIiwgQGFjdGl2ZVJvdygpIGlmIG5vdCBpbmRleD8gb3IgTnVtYmVyLmlzTmFOIGluZGV4XG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICAgICAgdGhlbiBpbmRleC0xXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgICAgIHRoZW4gaW5kZXgrMVxuICAgICAgICAgICAgd2hlbiAnaG9tZScgICAgICB0aGVuIDBcbiAgICAgICAgICAgIHdoZW4gJ2VuZCcgICAgICAgdGhlbiBAaXRlbXMubGVuZ3RoXG4gICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gaW5kZXgtQG51bVZpc2libGUoKVxuICAgICAgICAgICAgd2hlbiAncGFnZSBkb3duJyB0aGVuIGNsYW1wIDAsIEBpdGVtcy5sZW5ndGgsIGluZGV4K0BudW1WaXNpYmxlKClcbiAgICAgICAgICAgIGVsc2UgaW5kZXhcbiAgICAgICAgICAgIFxuICAgICAgICBrZXJyb3IgXCJubyBpbmRleCAje2luZGV4fT8gI3tAbnVtVmlzaWJsZSgpfVwiIGlmIG5vdCBpbmRleD8gb3IgTnVtYmVyLmlzTmFOIGluZGV4ICAgICAgICBcbiAgICAgICAgaW5kZXggPSBjbGFtcCAwLCBAbnVtUm93cygpLTEsIGluZGV4XG4gICAgICAgIFxuICAgICAgICBrZXJyb3IgXCJubyByb3cgYXQgaW5kZXggI3tpbmRleH0vI3tAbnVtUm93cygpLTF9P1wiLCBAbnVtUm93cygpIGlmIG5vdCBAcm93c1tpbmRleF0/LmFjdGl2YXRlP1xuXG4gICAgICAgIG5hdmlnYXRlID0gKGFjdGlvbikgPT5cbiAgICAgICAgICAgIEBuYXZpZ2F0aW5nUm93cyA9IHRydWVcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnbWVudUFjdGlvbicgYWN0aW9uXG4gICAgICAgIFxuICAgICAgICBpZiAgICAgIGtleSA9PSAndXAnICAgYW5kIGluZGV4ID4gQGl0ZW1zLmxlbmd0aCAgICAgdGhlbiBuYXZpZ2F0ZSAnTmF2aWdhdGUgRm9yd2FyZCdcbiAgICAgICAgZWxzZSBpZiBrZXkgPT0gJ2Rvd24nIGFuZCBpbmRleCA+IEBpdGVtcy5sZW5ndGggKyAxIHRoZW4gbmF2aWdhdGUgJ05hdmlnYXRlIEJhY2t3YXJkJ1xuICAgICAgICBlbHNlIEByb3dzW2luZGV4XS5hY3RpdmF0ZSgpXG4gICAgXG4gICAgcmVtb3ZlT2JqZWN0OiA9PlxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiByb3cgPSBAYWN0aXZlUm93KClcbiAgICAgICAgICAgIG5leHRPclByZXYgPSByb3cubmV4dCgpID8gcm93LnByZXYoKVxuICAgICAgICAgICAgcm93LmRpdi5yZW1vdmUoKVxuICAgICAgICAgICAgQGl0ZW1zLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICAgICAgQHJvd3Muc3BsaWNlIHJvdy5pbmRleCgpLCAxXG4gICAgICAgICAgICBuZXh0T3JQcmV2Py5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBAc2F2ZVByZWZzKClcbiAgICAgICAgQFxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgXG4gICAgXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IHBvcyBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0LCBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcbiAgICAgICAgXG4gICAgICAgIG9wdCA9IGl0ZW1zOiBbIFxuICAgICAgICAgICAgdGV4dDogICAnVG9nZ2xlIEV4dGVuc2lvbnMnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2UnIFxuICAgICAgICAsXG4gICAgICAgICAgICB0ZXh0OiAgICdSZW1vdmUnXG4gICAgICAgICAgICBjb21ibzogICdiYWNrc3BhY2UnIFxuICAgICAgICAgICAgY2I6ICAgICBAcmVtb3ZlT2JqZWN0XG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIG9wdC54ID0gYWJzUG9zLnhcbiAgICAgICAgb3B0LnkgPSBhYnNQb3MueVxuICAgICAgICBwb3B1cC5tZW51IG9wdFxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG9uS2V5OiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnICdkZWxldGUnIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGNsZWFyU2VhcmNoKCkucmVtb3ZlT2JqZWN0KClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1hbmQraycgJ2N0cmwraycgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50IGlmIEBicm93c2VyLmNsZWFuVXAoKVxuICAgICAgICAgICAgd2hlbiAndGFiJyAgICBcbiAgICAgICAgICAgICAgICBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBkb1NlYXJjaCAnJ1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgICAgIHdoZW4gJ2VzYydcbiAgICAgICAgICAgICAgICBpZiBAc2VhcmNoLmxlbmd0aCB0aGVuIEBjbGVhclNlYXJjaCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuICAgICAgICAgICAgd2hlbiAndXAnICdkb3duJyAncGFnZSB1cCcgJ3BhZ2UgZG93bicgJ2hvbWUnICdlbmQnIFxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3Mga2V5XG4gICAgICAgICAgICB3aGVuICdyaWdodCcgJ2FsdCtyaWdodCcgJ2VudGVyJ1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBmb2N1c0Jyb3dzZXIoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBtb2QgaW4gWydzaGlmdCcgJyddIGFuZCBjaGFyIHRoZW4gQGRvU2VhcmNoIGNoYXJcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFNoZWxmXG4iXX0=
//# sourceURL=../coffee/shelf.coffee