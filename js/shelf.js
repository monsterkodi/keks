// koffee 1.4.0

/*
 0000000  000   000  00000000  000      00000000
000       000   000  000       000      000     
0000000   000000000  0000000   000      000000  
     000  000   000  000       000      000     
0000000   000   000  00000000  0000000  000
 */
var $, Column, Row, Scroller, Shelf, _, clamp, elem, empty, first, fuzzy, kerror, keyinfo, klog, last, popup, post, prefs, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), stopEvent = ref.stopEvent, keyinfo = ref.keyinfo, slash = ref.slash, post = ref.post, prefs = ref.prefs, popup = ref.popup, elem = ref.elem, clamp = ref.clamp, empty = ref.empty, first = ref.first, last = ref.last, klog = ref.klog, kerror = ref.kerror, $ = ref.$, _ = ref._;

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
            case 'shift+alt+left':
            case 'alt+left':
                return this.browser.toggleShelf();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGYuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDRJQUFBO0lBQUE7Ozs7QUFRQSxNQUF5RyxPQUFBLENBQVEsS0FBUixDQUF6RyxFQUFFLHlCQUFGLEVBQWEscUJBQWIsRUFBc0IsaUJBQXRCLEVBQTZCLGVBQTdCLEVBQW1DLGlCQUFuQyxFQUEwQyxpQkFBMUMsRUFBaUQsZUFBakQsRUFBdUQsaUJBQXZELEVBQThELGlCQUE5RCxFQUFxRSxpQkFBckUsRUFBNEUsZUFBNUUsRUFBa0YsZUFBbEYsRUFBd0YsbUJBQXhGLEVBQWdHLFNBQWhHLEVBQW1HOztBQUVuRyxHQUFBLEdBQVcsT0FBQSxDQUFRLE9BQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxrQkFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUVMOzs7SUFFVyxlQUFDLE9BQUQ7Ozs7Ozs7Ozs7O1FBRVQsdUNBQU0sT0FBTjtRQUVBLElBQUMsQ0FBQSxLQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVLENBQUM7UUFDWCxJQUFDLENBQUEsR0FBRyxDQUFDLEVBQUwsR0FBVTtRQUVWLElBQUksQ0FBQyxFQUFMLENBQVEsWUFBUixFQUFxQixJQUFDLENBQUEsT0FBdEI7UUFFQSxJQUFJLENBQUMsRUFBTCxDQUFRLE1BQVIsRUFBZSxJQUFDLENBQUEsTUFBaEI7SUFWUzs7b0JBa0JiLFdBQUEsR0FBYSxTQUFDLEdBQUQ7QUFFVCxZQUFBOztnQkFBVyxDQUFFLFNBQVMsQ0FBQyxNQUF2QixDQUE4QixPQUE5Qjs7UUFDQSxHQUFHLENBQUMsU0FBSixDQUFjO1lBQUEsS0FBQSxFQUFNLEtBQU47U0FBZDtlQUVBLElBQUMsQ0FBQSxPQUFPLENBQUMsUUFBVCxDQUFrQixHQUFHLENBQUMsSUFBdEIsRUFBNEI7WUFBQSxL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QUFBLDJCQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQVA7O0FBQWQ7QUFIckIsaUJBSVMsS0FKVDtnQkFLUSxJQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBWDtvQkFBdUIsSUFBQyxDQUFBLFFBQUQsQ0FBVSxFQUFWLEVBQXZCOztBQUNBLHVCQUFPLFNBQUEsQ0FBVSxLQUFWO0FBTmYsaUJBT1MsS0FQVDtnQkFRUSxJQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBWDtvQkFBdUIsSUFBQyxDQUFBLFdBQUQsQ0FBQSxFQUF2Qjs7QUFDQSx1QkFBTyxTQUFBLENBQVUsS0FBVjtBQVRmO0FBV0EsZ0JBQU8sR0FBUDtBQUFBLGlCQUNTLElBRFQ7QUFBQSxpQkFDYyxNQURkO0FBQUEsaUJBQ3FCLFNBRHJCO0FBQUEsaUJBQytCLFdBRC9CO0FBQUEsaUJBQzJDLE1BRDNDO0FBQUEsaUJBQ2tELEtBRGxEO0FBRVEsdUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFlBQUQsQ0FBYyxHQUFkLENBQWpCO0FBRmYsaUJBR1MsT0FIVDtBQUFBLGlCQUdpQixPQUhqQjtBQUlRLHVCQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxZQUFELENBQUEsQ0FBakI7QUFKZjtRQU1BLElBQUcsQ0FBQSxHQUFBLEtBQVEsT0FBUixJQUFBLEdBQUEsS0FBZ0IsRUFBaEIsQ0FBQSxJQUF3QixJQUEzQjtZQUFxQyxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsRUFBckM7O1FBRUEsSUFBRyxHQUFBLEtBQVEsTUFBWDtBQUF3QixtQkFBTyxTQUFBLENBQVUsS0FBVixFQUEvQjs7SUF2Qkc7Ozs7R0E3UFM7O0FBc1JwQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICBcbjAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAgIFxuICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICBcbiMjI1xuXG57IHN0b3BFdmVudCwga2V5aW5mbywgc2xhc2gsIHBvc3QsIHByZWZzLCBwb3B1cCwgZWxlbSwgY2xhbXAsIGVtcHR5LCBmaXJzdCwgbGFzdCwga2xvZywga2Vycm9yLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cblJvdyAgICAgID0gcmVxdWlyZSAnLi9yb3cnXG5TY3JvbGxlciA9IHJlcXVpcmUgJy4vdG9vbHMvc2Nyb2xsZXInXG5Db2x1bW4gICA9IHJlcXVpcmUgJy4vY29sdW1uJ1xuZnV6enkgICAgPSByZXF1aXJlICdmdXp6eSdcbiAgICBcbmNsYXNzIFNoZWxmIGV4dGVuZHMgQ29sdW1uXG5cbiAgICBjb25zdHJ1Y3RvcjogKGJyb3dzZXIpIC0+XG5cbiAgICAgICAgc3VwZXIgYnJvd3NlclxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zICA9IFtdXG4gICAgICAgIEBpbmRleCAgPSAtMVxuICAgICAgICBAZGl2LmlkID0gJ3NoZWxmJ1xuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnYWRkVG9TaGVsZicgQGFkZFBhdGhcbiAgICAgICAgXG4gICAgICAgIHBvc3Qub24gJ2ZpbGUnIEBvbkZpbGVcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgXG4gICBcbiAgICBhY3RpdmF0ZVJvdzogKHJvdykgLT4gXG4gICAgICAgIFxuICAgICAgICAkKCcuaG92ZXInKT8uY2xhc3NMaXN0LnJlbW92ZSAnaG92ZXInXG4gICAgICAgIHJvdy5zZXRBY3RpdmUgZm9jdXM6ZmFsc2VcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmxvYWRJdGVtIHJvdy5pdGVtLCBmb2N1czpmYWxzZSwgY2xlYXI6MFxuICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBvbkZpbGU6IChmaWxlKSA9PlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGZpbGVcbiAgICAgICAgaWYgQG5hdmlnYXRpbmdSb3dzXG4gICAgICAgICAgICBkZWxldGUgQG5hdmlnYXRpbmdSb3dzXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIGZvciBpbmRleCBpbiBbMC4uLkBpdGVtcy5sZW5ndGhdXG4gICAgICAgICAgICBpZiBAaXRlbXNbaW5kZXhdLmZpbGUgPT0gZmlsZVxuICAgICAgICAgICAgICAgIEByb3dzW2luZGV4XS5zZXRBY3RpdmUoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgbWF0Y2hlcyA9IFtdXG4gICAgICAgIGZvciBpbmRleCxpdGVtIG9mIEBpdGVtc1xuICAgICAgICAgICAgaWYgZmlsZT8uc3RhcnRzV2l0aCBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICBtYXRjaGVzLnB1c2ggW2luZGV4LCBpdGVtXVxuXG4gICAgICAgIGlmIG5vdCBlbXB0eSBtYXRjaGVzXG4gICAgICAgICAgICBtYXRjaGVzLnNvcnQgKGEsYikgLT4gYlsxXS5maWxlLmxlbmd0aCAtIGFbMV0uZmlsZS5sZW5ndGhcbiAgICAgICAgICAgIFtpbmRleCwgaXRlbV0gPSBmaXJzdCBtYXRjaGVzXG4gICAgICAgICAgICBAcm93c1tpbmRleF0uc2V0QWN0aXZlKClcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgYnJvd3NlckRpZEluaXRDb2x1bW5zOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIEBkaWRJbml0XG4gICAgICAgIFxuICAgICAgICBAZGlkSW5pdCA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIEBsb2FkU2hlbGZJdGVtcygpXG4gICAgICAgIFxuICAgIGxvYWRTaGVsZkl0ZW1zOiAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbXMgPSBwcmVmcy5nZXQgXCJzaGVsZuKWuGl0ZW1zXCJcbiAgICAgICAgQHNldEl0ZW1zIGl0ZW1zLCBzYXZlOmZhbHNlXG4gICAgICAgICAgICAgICAgXG4gICAgYWRkUGF0aDogKHBhdGgsIG9wdCkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRGlyIHBhdGhcbiAgICAgICAgICAgIEBhZGREaXIgcGF0aCwgb3B0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBhZGRGaWxlIHBhdGgsIG9wdFxuICAgICAgICBcbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG4gICAgaXRlbVBhdGhzOiAtPiBAcm93cy5tYXAgKHIpIC0+IHIucGF0aCgpXG4gICAgXG4gICAgc2F2ZVByZWZzOiAtPiBwcmVmcy5zZXQgXCJzaGVsZuKWuGl0ZW1zXCIgQGl0ZW1zXG4gICAgXG4gICAgc2V0SXRlbXM6IChAaXRlbXMsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjbGVhcigpXG4gICAgICAgIFxuICAgICAgICBAaXRlbXMgPz0gW11cbiAgICAgICAgQGFkZEl0ZW1zIEBpdGVtc1xuICAgICAgICBcbiAgICAgICAgaWYgb3B0Py5zYXZlICE9IGZhbHNlXG4gICAgICAgICAgICBAc2F2ZVByZWZzKCkgICAgICAgICAgICBcbiAgICAgICAgQFxuICAgICAgICBcbiAgICBhZGRJdGVtczogKGl0ZW1zLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgaXRlbXNcbiAgICAgICAgXG4gICAgICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICAgICAgICBAcm93cy5wdXNoIG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICAgICAgXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICBhZGREaXI6IChkaXIsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIGl0ZW0gPSBcbiAgICAgICAgICAgIG5hbWU6IHNsYXNoLmZpbGUgc2xhc2gudGlsZGUgZGlyXG4gICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgZmlsZTogc2xhc2gucGF0aCBkaXJcbiAgICAgICAgXG4gICAgICAgIEBhZGRJdGVtIGl0ZW0sIG9wdFxuXG4gICAgYWRkRmlsZTogKGZpbGUsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIGl0ZW0gPSBcbiAgICAgICAgICAgIG5hbWU6IHNsYXNoLmZpbGUgZmlsZVxuICAgICAgICAgICAgdHlwZTogJ2ZpbGUnXG4gICAgICAgICAgICBmaWxlOiBzbGFzaC5wYXRoIGZpbGVcbiAgICAgICAgQGFkZEl0ZW0gaXRlbSwgb3B0XG4gICAgICAgIFxuICAgIGFkZEl0ZW06ICAoaXRlbSwgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgXy5wdWxsQWxsV2l0aCBAaXRlbXMsIFtpdGVtXSwgXy5pc0VxdWFsICMgcmVtb3ZlIGl0ZW0gaWYgb24gc2hlbGYgYWxyZWFkeVxuICAgICAgICBcbiAgICAgICAgaWYgb3B0Py5wb3NcbiAgICAgICAgICAgIGluZGV4ID0gQHJvd0luZGV4QXRQb3Mgb3B0LnBvc1xuICAgICAgICAgICAgQGl0ZW1zLnNwbGljZSBNYXRoLm1pbihpbmRleCwgQGl0ZW1zLmxlbmd0aCksIDAsIGl0ZW1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGl0ZW1zLnB1c2ggaXRlbVxuICAgICAgICAgICAgXG4gICAgICAgIEBzZXRJdGVtcyBAaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGRyb3BSb3c6IChyb3csIHBvcykgLT4gQGFkZEl0ZW0gcm93Lml0ZW0sIHBvczpwb3NcbiAgICAgICAgICAgIFxuICAgIGlzRW1wdHk6IC0+IGVtcHR5IEByb3dzXG4gICAgXG4gICAgY2xlYXI6IC0+XG4gICAgICAgIFxuICAgICAgICBAY2xlYXJTZWFyY2goKVxuICAgICAgICBAZGl2LnNjcm9sbFRvcCA9IDBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIEByb3dzID0gW11cbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBuYW1lOiAtPiAnc2hlbGYnXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgb25Gb2N1czogPT4gXG5cbiAgICAgICAgQGRpdi5jbGFzc0xpc3QuYWRkICdmb2N1cydcbiAgICAgICAgaWYgQGJyb3dzZXIuc2hlbGZTaXplIDwgMjAwXG4gICAgICAgICAgICBAYnJvd3Nlci5zZXRTaGVsZlNpemUgMjAwXG4gICAgICAgICAgICBcbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG9uTW91c2VPdmVyOiAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU92ZXIoKVxuICAgIG9uTW91c2VPdXQ6ICAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU91dCgpXG4gICAgb25DbGljazogICAgIChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5hY3RpdmF0ZSBldmVudFxuICAgIG9uRGJsQ2xpY2s6ICAoZXZlbnQpID0+IEBuYXZpZ2F0ZUNvbHMgJ2VudGVyJ1xuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuXG4gICAgbmF2aWdhdGVSb3dzOiAoa2V5KSAtPlxuXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJubyByb3dzIGluIGNvbHVtbiAje0BpbmRleH0/XCIgaWYgbm90IEBudW1Sb3dzKClcbiAgICAgICAgaW5kZXggPSBAYWN0aXZlUm93KCk/LmluZGV4KCkgPyAtMVxuICAgICAgICBrZXJyb3IgXCJubyBpbmRleCBmcm9tIGFjdGl2ZVJvdz8gI3tpbmRleH0/XCIsIEBhY3RpdmVSb3coKSBpZiBub3QgaW5kZXg/IG9yIE51bWJlci5pc05hTiBpbmRleFxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcgICAgICAgIHRoZW4gaW5kZXgtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIGluZGV4KzFcbiAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiAwXG4gICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gQGl0ZW1zLmxlbmd0aFxuICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcgICB0aGVuIGluZGV4LUBudW1WaXNpYmxlKClcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgZG93bicgdGhlbiBjbGFtcCAwLCBAaXRlbXMubGVuZ3RoLCBpbmRleCtAbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICBlbHNlIGluZGV4XG4gICAgICAgICAgICBcbiAgICAgICAga2Vycm9yIFwibm8gaW5kZXggI3tpbmRleH0/ICN7QG51bVZpc2libGUoKX1cIiBpZiBub3QgaW5kZXg/IG9yIE51bWJlci5pc05hTiBpbmRleCAgICAgICAgXG4gICAgICAgIGluZGV4ID0gY2xhbXAgMCwgQG51bVJvd3MoKS0xLCBpbmRleFxuICAgICAgICBcbiAgICAgICAga2Vycm9yIFwibm8gcm93IGF0IGluZGV4ICN7aW5kZXh9LyN7QG51bVJvd3MoKS0xfT9cIiwgQG51bVJvd3MoKSBpZiBub3QgQHJvd3NbaW5kZXhdPy5hY3RpdmF0ZT9cblxuICAgICAgICBuYXZpZ2F0ZSA9IChhY3Rpb24pID0+XG4gICAgICAgICAgICBAbmF2aWdhdGluZ1Jvd3MgPSB0cnVlXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ21lbnVBY3Rpb24nIGFjdGlvblxuICAgICAgICBcbiAgICAgICAgaWYgICAgICBrZXkgPT0gJ3VwJyAgIGFuZCBpbmRleCA+IEBpdGVtcy5sZW5ndGggICAgIHRoZW4gbmF2aWdhdGUgJ05hdmlnYXRlIEZvcndhcmQnXG4gICAgICAgIGVsc2UgaWYga2V5ID09ICdkb3duJyBhbmQgaW5kZXggPiBAaXRlbXMubGVuZ3RoICsgMSB0aGVuIG5hdmlnYXRlICdOYXZpZ2F0ZSBCYWNrd2FyZCdcbiAgICAgICAgZWxzZSBAcm93c1tpbmRleF0uYWN0aXZhdGUoKVxuICAgIFxuICAgIHJlbW92ZU9iamVjdDogPT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgcm93ID0gQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICBuZXh0T3JQcmV2ID0gcm93Lm5leHQoKSA/IHJvdy5wcmV2KClcbiAgICAgICAgICAgIHJvdy5kaXYucmVtb3ZlKClcbiAgICAgICAgICAgIEBpdGVtcy5zcGxpY2Ugcm93LmluZGV4KCksIDFcbiAgICAgICAgICAgIEByb3dzLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICAgICAgbmV4dE9yUHJldj8uYWN0aXZhdGUoKVxuICAgICAgICAgICAgQHNhdmVQcmVmcygpXG4gICAgICAgIEBcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgIFxuICAgIFxuICAgIHNob3dDb250ZXh0TWVudTogKGFic1BvcykgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBhYnNQb3M/XG4gICAgICAgICAgICBhYnNQb3MgPSBwb3MgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgIFxuICAgICAgICBvcHQgPSBpdGVtczogWyBcbiAgICAgICAgICAgIHRleHQ6ICAgJ1RvZ2dsZSBFeHRlbnNpb25zJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtlJyBcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnUmVtb3ZlJ1xuICAgICAgICAgICAgY29tYm86ICAnYmFja3NwYWNlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHJlbW92ZU9iamVjdFxuICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgcG9wdXAubWVudSBvcHRcbiAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBvbktleTogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIgfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnc2hpZnQrYWx0K2xlZnQnJ2FsdCtsZWZ0JyAgIHRoZW4gcmV0dXJuIEBicm93c2VyLnRvZ2dsZVNoZWxmKClcbiAgICAgICAgICAgIHdoZW4gJ2JhY2tzcGFjZScgJ2RlbGV0ZScgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAY2xlYXJTZWFyY2goKS5yZW1vdmVPYmplY3QoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtrJyAnY3RybCtrJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQgaWYgQGJyb3dzZXIuY2xlYW5VcCgpXG4gICAgICAgICAgICB3aGVuICd0YWInICAgIFxuICAgICAgICAgICAgICAgIGlmIEBzZWFyY2gubGVuZ3RoIHRoZW4gQGRvU2VhcmNoICcnXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuICAgICAgICAgICAgd2hlbiAnZXNjJ1xuICAgICAgICAgICAgICAgIGlmIEBzZWFyY2gubGVuZ3RoIHRoZW4gQGNsZWFyU2VhcmNoKClcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG5cbiAgICAgICAgc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICdkb3duJyAncGFnZSB1cCcgJ3BhZ2UgZG93bicgJ2hvbWUnICdlbmQnIFxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBuYXZpZ2F0ZVJvd3Mga2V5XG4gICAgICAgICAgICB3aGVuICdyaWdodCcgJ2VudGVyJ1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBmb2N1c0Jyb3dzZXIoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBtb2QgaW4gWydzaGlmdCcgJyddIGFuZCBjaGFyIHRoZW4gQGRvU2VhcmNoIGNoYXJcbiAgICAgICAgXG4gICAgICAgIGlmIGtleSBpbiBbJ2xlZnQnXSB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFNoZWxmXG4iXX0=
//# sourceURL=../coffee/shelf.coffee