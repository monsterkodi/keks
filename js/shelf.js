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
        this.onKeyUp = bind(this.onKeyUp, this);
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
                if (this.dragDiv) {
                    this.dragDiv.drag.dragStop();
                    this.dragDiv.remove();
                    delete this.dragDiv;
                }
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
            this.doSearch(char);
        }
        if (this.dragDiv) {
            return this.updateDragIndicator(event);
        }
    };

    Shelf.prototype.onKeyUp = function(event) {
        if (this.dragDiv) {
            return this.updateDragIndicator(event);
        }
    };

    return Shelf;

})(Column);

module.exports = Shelf;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGYuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGtKQUFBO0lBQUE7Ozs7QUFRQSxNQUErRyxPQUFBLENBQVEsS0FBUixDQUEvRyxFQUFFLHlCQUFGLEVBQWEscUJBQWIsRUFBc0IsaUJBQXRCLEVBQTZCLGVBQTdCLEVBQW1DLGlCQUFuQyxFQUEwQyxpQkFBMUMsRUFBaUQsZUFBakQsRUFBdUQsaUJBQXZELEVBQThELGlCQUE5RCxFQUFxRSxpQkFBckUsRUFBNEUsZUFBNUUsRUFBa0YsZUFBbEYsRUFBd0YsZUFBeEYsRUFBOEYsbUJBQTlGLEVBQXNHLFNBQXRHLEVBQXlHOztBQUV6RyxHQUFBLEdBQVcsT0FBQSxDQUFRLE9BQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxrQkFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUVMOzs7SUFFQyxlQUFDLE9BQUQ7Ozs7Ozs7Ozs7Ozs7UUFFQyx1Q0FBTSxPQUFOO1FBRUEsSUFBQyxDQUFBLEtBQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxLQUFELEdBQVUsQ0FBQztRQUNYLElBQUMsQ0FBQSxHQUFHLENBQUMsRUFBTCxHQUFVO1FBRVYsSUFBSSxDQUFDLEVBQUwsQ0FBUSxZQUFSLEVBQXFCLElBQUMsQ0FBQSxPQUF0QjtRQUVBLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUFlLElBQUMsQ0FBQSxNQUFoQjtJQVZEOztvQkFrQkgsV0FBQSxHQUFhLFNBQUMsR0FBRDtBQUVULFlBQUE7O2dCQUFXLENBQUUsU0FBUyxDQUFDLE1BQXZCLENBQThCLE9BQTlCOztRQUNBLEdBQUcsQ0FBQyxTQUFKLENBQWM7WUFBQSxLQUFBLEVBQU0sS0FBTjtTQUFkO2VBRUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxRQUFULENBQWtCLEdBQUcsQ0FBQyxJQUF0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ZixpQkFlUyxPQWZUO0FBQUEsaUJBZWlCLFdBZmpCO0FBQUEsaUJBZTZCLE9BZjdCO0FBZ0JRLHVCQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxZQUFELENBQUEsQ0FBakI7QUFoQmY7UUFrQkEsSUFBRyxDQUFBLEdBQUEsS0FBUSxPQUFSLElBQUEsR0FBQSxLQUFnQixFQUFoQixDQUFBLElBQXdCLElBQTNCO1lBQXFDLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixFQUFyQzs7UUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFKO21CQUNJLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixLQUFyQixFQURKOztJQXhCRzs7b0JBMkJQLE9BQUEsR0FBUyxTQUFDLEtBQUQ7UUFFTCxJQUFHLElBQUMsQ0FBQSxPQUFKO21CQUNJLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixLQUFyQixFQURKOztJQUZLOzs7O0dBelNPOztBQThTcEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwICBcbiAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgIFxuMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgICAgXG4jIyNcblxueyBzdG9wRXZlbnQsIGtleWluZm8sIHNsYXNoLCBwb3N0LCBwcmVmcywgcG9wdXAsIGVsZW0sIGNsYW1wLCBlbXB0eSwgZmlyc3QsIGxhc3QsIGtwb3MsIGtsb2csIGtlcnJvciwgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Sb3cgICAgICA9IHJlcXVpcmUgJy4vcm93J1xuU2Nyb2xsZXIgPSByZXF1aXJlICcuL3Rvb2xzL3Njcm9sbGVyJ1xuQ29sdW1uICAgPSByZXF1aXJlICcuL2NvbHVtbidcbmZ1enp5ICAgID0gcmVxdWlyZSAnZnV6enknXG4gICAgXG5jbGFzcyBTaGVsZiBleHRlbmRzIENvbHVtblxuXG4gICAgQDogKGJyb3dzZXIpIC0+XG5cbiAgICAgICAgc3VwZXIgYnJvd3NlclxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zICA9IFtdXG4gICAgICAgIEBpbmRleCAgPSAtMVxuICAgICAgICBAZGl2LmlkID0gJ3NoZWxmJ1xuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnYWRkVG9TaGVsZicgQGFkZFBhdGhcbiAgICAgICAgXG4gICAgICAgIHBvc3Qub24gJ2ZpbGUnIEBvbkZpbGVcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgXG4gICBcbiAgICBhY3RpdmF0ZVJvdzogKHJvdykgLT4gXG4gICAgICAgIFxuICAgICAgICAkKCcuaG92ZXInKT8uY2xhc3NMaXN0LnJlbW92ZSAnaG92ZXInXG4gICAgICAgIHJvdy5zZXRBY3RpdmUgZm9jdXM6ZmFsc2VcbiAgICAgICAgXG4gICAgICAgIEBicm93c2VyLmxvYWRJdGVtIHJvdy5pdGVtLCBmb2N1czpmYWxzZSwgY2xlYXI6MFxuICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBvbkZpbGU6IChmaWxlKSA9PlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGZpbGVcbiAgICAgICAgaWYgQG5hdmlnYXRpbmdSb3dzXG4gICAgICAgICAgICBkZWxldGUgQG5hdmlnYXRpbmdSb3dzXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIGZvciBpbmRleCBpbiBbMC4uLkBpdGVtcy5sZW5ndGhdXG4gICAgICAgICAgICBpZiBAaXRlbXNbaW5kZXhdLmZpbGUgPT0gZmlsZVxuICAgICAgICAgICAgICAgIEByb3dzW2luZGV4XS5zZXRBY3RpdmUoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgbWF0Y2hlcyA9IFtdXG4gICAgICAgIGZvciBpbmRleCxpdGVtIG9mIEBpdGVtc1xuICAgICAgICAgICAgaWYgZmlsZT8uc3RhcnRzV2l0aCBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICBtYXRjaGVzLnB1c2ggW2luZGV4LCBpdGVtXVxuXG4gICAgICAgIGlmIG5vdCBlbXB0eSBtYXRjaGVzXG4gICAgICAgICAgICBtYXRjaGVzLnNvcnQgKGEsYikgLT4gYlsxXS5maWxlLmxlbmd0aCAtIGFbMV0uZmlsZS5sZW5ndGhcbiAgICAgICAgICAgIFtpbmRleCwgaXRlbV0gPSBmaXJzdCBtYXRjaGVzXG4gICAgICAgICAgICBAcm93c1tpbmRleF0uc2V0QWN0aXZlKClcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgYnJvd3NlckRpZEluaXRDb2x1bW5zOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIEBkaWRJbml0XG4gICAgICAgIFxuICAgICAgICBAZGlkSW5pdCA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIEBsb2FkU2hlbGZJdGVtcygpXG4gICAgICAgIFxuICAgIGxvYWRTaGVsZkl0ZW1zOiAtPlxuICAgICAgICBcbiAgICAgICAgaXRlbXMgPSBwcmVmcy5nZXQgXCJzaGVsZuKWuGl0ZW1zXCJcbiAgICAgICAgQHNldEl0ZW1zIGl0ZW1zLCBzYXZlOmZhbHNlXG4gICAgICAgICAgICAgICAgXG4gICAgYWRkUGF0aDogKHBhdGgsIG9wdCkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRGlyIHBhdGhcbiAgICAgICAgICAgIEBhZGREaXIgcGF0aCwgb3B0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBhZGRGaWxlIHBhdGgsIG9wdFxuICAgICAgICBcbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG4gICAgaXRlbVBhdGhzOiAtPiBAcm93cy5tYXAgKHIpIC0+IHIucGF0aCgpXG4gICAgXG4gICAgc2F2ZVByZWZzOiAtPiBwcmVmcy5zZXQgXCJzaGVsZuKWuGl0ZW1zXCIgQGl0ZW1zXG4gICAgXG4gICAgc2V0SXRlbXM6IChAaXRlbXMsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjbGVhcigpXG4gICAgICAgIFxuICAgICAgICBAaXRlbXMgPz0gW11cbiAgICAgICAgQGFkZEl0ZW1zIEBpdGVtc1xuICAgICAgICBcbiAgICAgICAgaWYgb3B0Py5zYXZlICE9IGZhbHNlXG4gICAgICAgICAgICBAc2F2ZVByZWZzKCkgICAgICAgICAgICBcbiAgICAgICAgQFxuICAgICAgICBcbiAgICBhZGRJdGVtczogKGl0ZW1zLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgaXRlbXNcbiAgICAgICAgXG4gICAgICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICAgICAgICBAcm93cy5wdXNoIG5ldyBSb3cgQCwgaXRlbVxuICAgICAgICAgICAgXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICBhZGREaXI6IChkaXIsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIGl0ZW0gPSBcbiAgICAgICAgICAgIG5hbWU6IHNsYXNoLmZpbGUgc2xhc2gudGlsZGUgZGlyXG4gICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgZmlsZTogc2xhc2gucGF0aCBkaXJcbiAgICAgICAgXG4gICAgICAgIEBhZGRJdGVtIGl0ZW0sIG9wdFxuXG4gICAgYWRkRmlsZTogKGZpbGUsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIGl0ZW0gPSBcbiAgICAgICAgICAgIG5hbWU6IHNsYXNoLmZpbGUgZmlsZVxuICAgICAgICAgICAgdHlwZTogJ2ZpbGUnXG4gICAgICAgICAgICBmaWxlOiBzbGFzaC5wYXRoIGZpbGVcbiAgICAgICAgICAgIFxuICAgICAgICBAYWRkSXRlbSBpdGVtLCBvcHRcbiAgICAgICAgXG4gICAgYWRkRmlsZXM6IChmaWxlcywgb3B0KSAtPlxuICAgICAgICAjIGtsb2cgJ2ZpbGVzJyBmaWxlc1xuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlc1xuICAgICAgICAgICAgaWYgc2xhc2guaXNEaXIgZmlsZVxuICAgICAgICAgICAgICAgICMga2xvZyAnYWRkRGlyJyBmaWxlXG4gICAgICAgICAgICAgICAgQGFkZERpciBmaWxlLCBvcHRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAjIGtsb2cgJ2FkZEZpbGUnIGZpbGVcbiAgICAgICAgICAgICAgICBAYWRkRmlsZSBmaWxlLCBvcHRcbiAgICAgICAgXG4gICAgYWRkSXRlbTogIChpdGVtLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBfLnB1bGxBbGxXaXRoIEBpdGVtcywgW2l0ZW1dLCBfLmlzRXF1YWwgIyByZW1vdmUgaXRlbSBpZiBvbiBzaGVsZiBhbHJlYWR5XG4gICAgICAgIFxuICAgICAgICBpZiBvcHQ/LnBvc1xuICAgICAgICAgICAgaW5kZXggPSBAcm93SW5kZXhBdFBvcyBvcHQucG9zXG4gICAgICAgICAgICBAaXRlbXMuc3BsaWNlIE1hdGgubWluKGluZGV4LCBAaXRlbXMubGVuZ3RoKSwgMCwgaXRlbVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaXRlbXMucHVzaCBpdGVtXG4gICAgICAgICAgICBcbiAgICAgICAgQHNldEl0ZW1zIEBpdGVtc1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgb25Ecm9wOiAoZXZlbnQpID0+IFxuICAgIFxuICAgICAgICBhY3Rpb24gPSBldmVudC5nZXRNb2RpZmllclN0YXRlKCdTaGlmdCcpIGFuZCAnY29weScgb3IgJ21vdmUnXG4gICAgICAgIHNvdXJjZSA9IGV2ZW50LmRhdGFUcmFuc2Zlci5nZXREYXRhICd0ZXh0L3BsYWluJ1xuICAgICAgICBcbiAgICAgICAgaXRlbSA9IEBicm93c2VyLmZpbGVJdGVtIHNvdXJjZVxuICAgICAgICBAYWRkSXRlbSBpdGVtLCBwb3M6a3BvcyBldmVudFxuICAgIFxuICAgIGlzRW1wdHk6IC0+IGVtcHR5IEByb3dzXG4gICAgXG4gICAgY2xlYXI6IC0+XG4gICAgICAgIFxuICAgICAgICBAY2xlYXJTZWFyY2goKVxuICAgICAgICBAZGl2LnNjcm9sbFRvcCA9IDBcbiAgICAgICAgQHRhYmxlLmlubmVySFRNTCA9ICcnXG4gICAgICAgIEByb3dzID0gW11cbiAgICAgICAgQHNjcm9sbC51cGRhdGUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBuYW1lOiAtPiAnc2hlbGYnXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgb25Gb2N1czogPT4gXG5cbiAgICAgICAgQGRpdi5jbGFzc0xpc3QuYWRkICdmb2N1cydcbiAgICAgICAgaWYgQGJyb3dzZXIuc2hlbGZTaXplIDwgMjAwXG4gICAgICAgICAgICBAYnJvd3Nlci5zZXRTaGVsZlNpemUgMjAwXG4gICAgICAgICAgICBcbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG9uTW91c2VPdmVyOiAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU92ZXIoKVxuICAgIG9uTW91c2VPdXQ6ICAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8ub25Nb3VzZU91dCgpXG4gICAgb25DbGljazogICAgIChldmVudCkgPT4gQHJvdyhldmVudC50YXJnZXQpPy5hY3RpdmF0ZSBldmVudFxuICAgIG9uRGJsQ2xpY2s6ICAoZXZlbnQpID0+IEBuYXZpZ2F0ZUNvbHMgJ2VudGVyJ1xuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuXG4gICAgbmF2aWdhdGVSb3dzOiAoa2V5KSAtPlxuXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJubyByb3dzIGluIGNvbHVtbiAje0BpbmRleH0/XCIgaWYgbm90IEBudW1Sb3dzKClcbiAgICAgICAgaW5kZXggPSBAYWN0aXZlUm93KCk/LmluZGV4KCkgPyAtMVxuICAgICAgICBrZXJyb3IgXCJubyBpbmRleCBmcm9tIGFjdGl2ZVJvdz8gI3tpbmRleH0/XCIsIEBhY3RpdmVSb3coKSBpZiBub3QgaW5kZXg/IG9yIE51bWJlci5pc05hTiBpbmRleFxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICd1cCcgICAgICAgIHRoZW4gaW5kZXgtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIGluZGV4KzFcbiAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiAwXG4gICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gQGl0ZW1zLmxlbmd0aFxuICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcgICB0aGVuIGluZGV4LUBudW1WaXNpYmxlKClcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgZG93bicgdGhlbiBjbGFtcCAwLCBAaXRlbXMubGVuZ3RoLCBpbmRleCtAbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICBlbHNlIGluZGV4XG4gICAgICAgICAgICBcbiAgICAgICAga2Vycm9yIFwibm8gaW5kZXggI3tpbmRleH0/ICN7QG51bVZpc2libGUoKX1cIiBpZiBub3QgaW5kZXg/IG9yIE51bWJlci5pc05hTiBpbmRleCAgICAgICAgXG4gICAgICAgIGluZGV4ID0gY2xhbXAgMCwgQG51bVJvd3MoKS0xLCBpbmRleFxuICAgICAgICBcbiAgICAgICAga2Vycm9yIFwibm8gcm93IGF0IGluZGV4ICN7aW5kZXh9LyN7QG51bVJvd3MoKS0xfT9cIiwgQG51bVJvd3MoKSBpZiBub3QgQHJvd3NbaW5kZXhdPy5hY3RpdmF0ZT9cblxuICAgICAgICBuYXZpZ2F0ZSA9IChhY3Rpb24pID0+XG4gICAgICAgICAgICBAbmF2aWdhdGluZ1Jvd3MgPSB0cnVlXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ21lbnVBY3Rpb24nIGFjdGlvblxuICAgICAgICBcbiAgICAgICAgaWYgICAgICBrZXkgPT0gJ3VwJyAgIGFuZCBpbmRleCA+IEBpdGVtcy5sZW5ndGggICAgIHRoZW4gbmF2aWdhdGUgJ05hdmlnYXRlIEZvcndhcmQnXG4gICAgICAgIGVsc2UgaWYga2V5ID09ICdkb3duJyBhbmQgaW5kZXggPiBAaXRlbXMubGVuZ3RoICsgMSB0aGVuIG5hdmlnYXRlICdOYXZpZ2F0ZSBCYWNrd2FyZCdcbiAgICAgICAgZWxzZSBAcm93c1tpbmRleF0uYWN0aXZhdGUoKVxuICAgIFxuICAgIHJlbW92ZU9iamVjdDogPT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgcm93ID0gQGFjdGl2ZVJvdygpXG4gICAgICAgICAgICBuZXh0T3JQcmV2ID0gcm93Lm5leHQoKSA/IHJvdy5wcmV2KClcbiAgICAgICAgICAgIHJvdy5kaXYucmVtb3ZlKClcbiAgICAgICAgICAgIEBpdGVtcy5zcGxpY2Ugcm93LmluZGV4KCksIDFcbiAgICAgICAgICAgIEByb3dzLnNwbGljZSByb3cuaW5kZXgoKSwgMVxuICAgICAgICAgICAgbmV4dE9yUHJldj8uYWN0aXZhdGUoKVxuICAgICAgICAgICAgQHNhdmVQcmVmcygpXG4gICAgICAgIEBcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgIFxuICAgIFxuICAgIHNob3dDb250ZXh0TWVudTogKGFic1BvcykgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBhYnNQb3M/XG4gICAgICAgICAgICBhYnNQb3MgPSBwb3MgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgIFxuICAgICAgICBvcHQgPSBpdGVtczogWyBcbiAgICAgICAgICAgIHRleHQ6ICAgJ1RvZ2dsZSBFeHRlbnNpb25zJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtlJyBcbiAgICAgICAgLFxuICAgICAgICAgICAgdGV4dDogICAnUmVtb3ZlJ1xuICAgICAgICAgICAgY29tYm86ICAnYmFja3NwYWNlJyBcbiAgICAgICAgICAgIGNiOiAgICAgQHJlbW92ZU9iamVjdFxuICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgcG9wdXAubWVudSBvcHRcbiAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBvbktleTogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIgfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnYmFja3NwYWNlJyAnZGVsZXRlJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBjbGVhclNlYXJjaCgpLnJlbW92ZU9iamVjdCgpXG4gICAgICAgICAgICB3aGVuICdjb21tYW5kK2snICdjdHJsK2snIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCBpZiBAYnJvd3Nlci5jbGVhblVwKClcbiAgICAgICAgICAgIHdoZW4gJ3RhYicgICAgXG4gICAgICAgICAgICAgICAgaWYgQHNlYXJjaC5sZW5ndGggdGhlbiBAZG9TZWFyY2ggJydcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgICAgICAgICAgQGRyYWdEaXYuZHJhZy5kcmFnU3RvcCgpXG4gICAgICAgICAgICAgICAgICAgIEBkcmFnRGl2LnJlbW92ZSgpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBAZHJhZ0RpdlxuICAgICAgICAgICAgICAgIGlmIEBzZWFyY2gubGVuZ3RoIHRoZW4gQGNsZWFyU2VhcmNoKClcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICd1cCcgJ2Rvd24nICdwYWdlIHVwJyAncGFnZSBkb3duJyAnaG9tZScgJ2VuZCcgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyAnYWx0K3JpZ2h0JyAnZW50ZXInXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGZvY3VzQnJvd3NlcigpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG1vZCBpbiBbJ3NoaWZ0JyAnJ10gYW5kIGNoYXIgdGhlbiBAZG9TZWFyY2ggY2hhclxuICAgICAgICBcbiAgICAgICAgaWYgQGRyYWdEaXZcbiAgICAgICAgICAgIEB1cGRhdGVEcmFnSW5kaWNhdG9yIGV2ZW50XG4gICAgICAgICAgICBcbiAgICBvbktleVVwOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZHJhZ0RpdlxuICAgICAgICAgICAgQHVwZGF0ZURyYWdJbmRpY2F0b3IgZXZlbnRcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFNoZWxmXG4iXX0=
//# sourceURL=../coffee/shelf.coffee