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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGYuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGtKQUFBO0lBQUE7Ozs7QUFRQSxNQUErRyxPQUFBLENBQVEsS0FBUixDQUEvRyxFQUFFLHlCQUFGLEVBQWEscUJBQWIsRUFBc0IsaUJBQXRCLEVBQTZCLGVBQTdCLEVBQW1DLGlCQUFuQyxFQUEwQyxpQkFBMUMsRUFBaUQsZUFBakQsRUFBdUQsaUJBQXZELEVBQThELGlCQUE5RCxFQUFxRSxpQkFBckUsRUFBNEUsZUFBNUUsRUFBa0YsZUFBbEYsRUFBd0YsZUFBeEYsRUFBOEYsbUJBQTlGLEVBQXNHLFNBQXRHLEVBQXlHOztBQUV6RyxHQUFBLEdBQVcsT0FBQSxDQUFRLE9BQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxrQkFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztBQUVMOzs7SUFFVyxlQUFDLE9BQUQ7Ozs7Ozs7Ozs7OztRQUVULHVDQUFNLE9BQU47UUFFQSxJQUFDLENBQUEsS0FBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLEtBQUQsR0FBVSxDQUFDO1FBQ1gsSUFBQyxDQUFBLEdBQUcsQ0FBQyxFQUFMLEdBQVU7UUFFVixJQUFJLENBQUMsRUFBTCxDQUFRLFlBQVIsRUFBcUIsSUFBQyxDQUFBLE9BQXRCO1FBRUEsSUFBSSxDQUFDLEVBQUwsQ0FBUSxNQUFSLEVBQWUsSUFBQyxDQUFBLE1BQWhCO0lBVlM7O29CQWtCYixXQUFBLEdBQWEsU0FBQyxHQUFEO0FBRVQsWUFBQTs7Z0JBQVcsQ0FBRSxTQUFTLENBQUMsTUFBdkIsQ0FBOEIsT0FBOUI7O1FBQ0EsR0FBRyxDQUFDLFNBQUosQ0FBYztZQUFBLEtBQUEsRUFBTSxLQUFOO1NBQWQ7ZUFFQSxJQUFDLENBQUEsT0FBTyxDQUFDLFFBQVQsQ0FBa0IsR0FBRyxDQUFDLElBQXRC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QUFjLENBQUMsWUFBZixDQUFBLENBQWpCO0FBRDFDLGlCQUVTLFdBRlQ7QUFBQSxpQkFFcUIsUUFGckI7Z0JBRW1DLElBQTBCLElBQUMsQ0FBQSxPQUFPLENBQUMsT0FBVCxDQUFBLENBQTFCO0FBQUEsMkJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBUDs7QUFBZDtBQUZyQixpQkFHUyxLQUhUO2dCQUlRLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFYO29CQUF1QixJQUFDLENBQUEsUUFBRCxDQUFVLEVBQVYsRUFBdkI7O0FBQ0EsdUJBQU8sU0FBQSxDQUFVLEtBQVY7QUFMZixpQkFNUyxLQU5UO2dCQU9RLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFYO29CQUF1QixJQUFDLENBQUEsV0FBRCxDQUFBLEVBQXZCOztBQUNBLHVCQUFPLFNBQUEsQ0FBVSxLQUFWO0FBUmYsaUJBU1MsSUFUVDtBQUFBLGlCQVNjLE1BVGQ7QUFBQSxpQkFTcUIsU0FUckI7QUFBQSxpQkFTK0IsV0FUL0I7QUFBQSxpQkFTMkMsTUFUM0M7QUFBQSxpQkFTa0QsS0FUbEQ7QUFVUSx1QkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsQ0FBakI7QUFWZixpQkFXUyxPQVhUO0FBQUEsaUJBV2lCLFdBWGpCO0FBQUEsaUJBVzZCLE9BWDdCO0FBWVEsdUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFlBQUQsQ0FBQSxDQUFqQjtBQVpmO1FBY0EsSUFBRyxDQUFBLEdBQUEsS0FBUSxPQUFSLElBQUEsR0FBQSxLQUFnQixFQUFoQixDQUFBLElBQXdCLElBQTNCO21CQUFxQyxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsRUFBckM7O0lBbEJHOzs7O0dBclFTOztBQXlScEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwICBcbiAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgIFxuMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgICAgXG4jIyNcblxueyBzdG9wRXZlbnQsIGtleWluZm8sIHNsYXNoLCBwb3N0LCBwcmVmcywgcG9wdXAsIGVsZW0sIGNsYW1wLCBlbXB0eSwgZmlyc3QsIGxhc3QsIGtwb3MsIGtsb2csIGtlcnJvciwgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Sb3cgICAgICA9IHJlcXVpcmUgJy4vcm93J1xuU2Nyb2xsZXIgPSByZXF1aXJlICcuL3Rvb2xzL3Njcm9sbGVyJ1xuQ29sdW1uICAgPSByZXF1aXJlICcuL2NvbHVtbidcbmZ1enp5ICAgID0gcmVxdWlyZSAnZnV6enknXG4gICAgXG5jbGFzcyBTaGVsZiBleHRlbmRzIENvbHVtblxuXG4gICAgY29uc3RydWN0b3I6IChicm93c2VyKSAtPlxuXG4gICAgICAgIHN1cGVyIGJyb3dzZXJcbiAgICAgICAgXG4gICAgICAgIEBpdGVtcyAgPSBbXVxuICAgICAgICBAaW5kZXggID0gLTFcbiAgICAgICAgQGRpdi5pZCA9ICdzaGVsZidcbiAgICAgICAgXG4gICAgICAgIHBvc3Qub24gJ2FkZFRvU2hlbGYnIEBhZGRQYXRoXG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdmaWxlJyBAb25GaWxlXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIFxuICAgXG4gICAgYWN0aXZhdGVSb3c6IChyb3cpIC0+IFxuICAgICAgICBcbiAgICAgICAgJCgnLmhvdmVyJyk/LmNsYXNzTGlzdC5yZW1vdmUgJ2hvdmVyJ1xuICAgICAgICByb3cuc2V0QWN0aXZlIGZvY3VzOmZhbHNlXG4gICAgICAgIFxuICAgICAgICBAYnJvd3Nlci5sb2FkSXRlbSByb3cuaXRlbSwgZm9jdXM6ZmFsc2UsIGNsZWFyOjBcbiAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBmaWxlXG4gICAgICAgIGlmIEBuYXZpZ2F0aW5nUm93c1xuICAgICAgICAgICAgZGVsZXRlIEBuYXZpZ2F0aW5nUm93c1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBmb3IgaW5kZXggaW4gWzAuLi5AaXRlbXMubGVuZ3RoXVxuICAgICAgICAgICAgaWYgQGl0ZW1zW2luZGV4XS5maWxlID09IGZpbGVcbiAgICAgICAgICAgICAgICBAcm93c1tpbmRleF0uc2V0QWN0aXZlKClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIG1hdGNoZXMgPSBbXVxuICAgICAgICBmb3IgaW5kZXgsaXRlbSBvZiBAaXRlbXNcbiAgICAgICAgICAgIGlmIGZpbGU/LnN0YXJ0c1dpdGggaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgbWF0Y2hlcy5wdXNoIFtpbmRleCwgaXRlbV1cblxuICAgICAgICBpZiBub3QgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgbWF0Y2hlcy5zb3J0IChhLGIpIC0+IGJbMV0uZmlsZS5sZW5ndGggLSBhWzFdLmZpbGUubGVuZ3RoXG4gICAgICAgICAgICBbaW5kZXgsIGl0ZW1dID0gZmlyc3QgbWF0Y2hlc1xuICAgICAgICAgICAgQHJvd3NbaW5kZXhdLnNldEFjdGl2ZSgpXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGJyb3dzZXJEaWRJbml0Q29sdW1uczogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAZGlkSW5pdFxuICAgICAgICBcbiAgICAgICAgQGRpZEluaXQgPSB0cnVlXG4gICAgICAgIFxuICAgICAgICBAbG9hZFNoZWxmSXRlbXMoKVxuICAgICAgICBcbiAgICBsb2FkU2hlbGZJdGVtczogLT5cbiAgICAgICAgXG4gICAgICAgIGl0ZW1zID0gcHJlZnMuZ2V0IFwic2hlbGbilrhpdGVtc1wiXG4gICAgICAgIEBzZXRJdGVtcyBpdGVtcywgc2F2ZTpmYWxzZVxuICAgICAgICAgICAgICAgIFxuICAgIGFkZFBhdGg6IChwYXRoLCBvcHQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5pc0RpciBwYXRoXG4gICAgICAgICAgICBAYWRkRGlyIHBhdGgsIG9wdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAYWRkRmlsZSBwYXRoLCBvcHRcbiAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcblxuICAgIGl0ZW1QYXRoczogLT4gQHJvd3MubWFwIChyKSAtPiByLnBhdGgoKVxuICAgIFxuICAgIHNhdmVQcmVmczogLT4gcHJlZnMuc2V0IFwic2hlbGbilrhpdGVtc1wiIEBpdGVtc1xuICAgIFxuICAgIHNldEl0ZW1zOiAoQGl0ZW1zLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBAY2xlYXIoKVxuICAgICAgICBcbiAgICAgICAgQGl0ZW1zID89IFtdXG4gICAgICAgIEBhZGRJdGVtcyBAaXRlbXNcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdD8uc2F2ZSAhPSBmYWxzZVxuICAgICAgICAgICAgQHNhdmVQcmVmcygpICAgICAgICAgICAgXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgYWRkSXRlbXM6IChpdGVtcywgb3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGl0ZW1zXG4gICAgICAgIFxuICAgICAgICBmb3IgaXRlbSBpbiBpdGVtc1xuICAgICAgICAgICAgQHJvd3MucHVzaCBuZXcgUm93IEAsIGl0ZW1cbiAgICAgICAgICAgIFxuICAgICAgICBAc2Nyb2xsLnVwZGF0ZSgpXG4gICAgICAgIEBcbiAgICAgICAgXG4gICAgYWRkRGlyOiAoZGlyLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtID0gXG4gICAgICAgICAgICBuYW1lOiBzbGFzaC5maWxlIHNsYXNoLnRpbGRlIGRpclxuICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgIGZpbGU6IHNsYXNoLnBhdGggZGlyXG4gICAgICAgIFxuICAgICAgICBAYWRkSXRlbSBpdGVtLCBvcHRcblxuICAgIGFkZEZpbGU6IChmaWxlLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBpdGVtID0gXG4gICAgICAgICAgICBuYW1lOiBzbGFzaC5maWxlIGZpbGVcbiAgICAgICAgICAgIHR5cGU6ICdmaWxlJ1xuICAgICAgICAgICAgZmlsZTogc2xhc2gucGF0aCBmaWxlXG4gICAgICAgIEBhZGRJdGVtIGl0ZW0sIG9wdFxuICAgICAgICBcbiAgICBhZGRJdGVtOiAgKGl0ZW0sIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIF8ucHVsbEFsbFdpdGggQGl0ZW1zLCBbaXRlbV0sIF8uaXNFcXVhbCAjIHJlbW92ZSBpdGVtIGlmIG9uIHNoZWxmIGFscmVhZHlcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdD8ucG9zXG4gICAgICAgICAgICBpbmRleCA9IEByb3dJbmRleEF0UG9zIG9wdC5wb3NcbiAgICAgICAgICAgIEBpdGVtcy5zcGxpY2UgTWF0aC5taW4oaW5kZXgsIEBpdGVtcy5sZW5ndGgpLCAwLCBpdGVtXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpdGVtcy5wdXNoIGl0ZW1cbiAgICAgICAgICAgIFxuICAgICAgICBAc2V0SXRlbXMgQGl0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAjIGRyb3BSb3c6IChyb3csIHBvcykgLT4gQGFkZEl0ZW0gcm93Lml0ZW0sIHBvczpwb3NcbiAgICAgICAgIFxuICAgIG9uRHJvcDogKGV2ZW50KSA9PiBcbiAgICBcbiAgICAgICAgYWN0aW9uID0gZXZlbnQuZ2V0TW9kaWZpZXJTdGF0ZSgnU2hpZnQnKSBhbmQgJ2NvcHknIG9yICdtb3ZlJ1xuICAgICAgICBzb3VyY2UgPSBldmVudC5kYXRhVHJhbnNmZXIuZ2V0RGF0YSAndGV4dC9wbGFpbidcbiAgICAgICAgXG4gICAgICAgIGl0ZW0gPSBAYnJvd3Nlci5maWxlSXRlbSBzb3VyY2VcbiAgICAgICAgQGFkZEl0ZW0gaXRlbSwgcG9zOmtwb3MgZXZlbnRcbiAgICBcbiAgICBpc0VtcHR5OiAtPiBlbXB0eSBAcm93c1xuICAgIFxuICAgIGNsZWFyOiAtPlxuICAgICAgICBcbiAgICAgICAgQGNsZWFyU2VhcmNoKClcbiAgICAgICAgQGRpdi5zY3JvbGxUb3AgPSAwXG4gICAgICAgIEB0YWJsZS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBAcm93cyA9IFtdXG4gICAgICAgIEBzY3JvbGwudXBkYXRlKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgbmFtZTogLT4gJ3NoZWxmJ1xuICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIG9uRm9jdXM6ID0+IFxuXG4gICAgICAgIEBkaXYuY2xhc3NMaXN0LmFkZCAnZm9jdXMnXG4gICAgICAgIGlmIEBicm93c2VyLnNoZWxmU2l6ZSA8IDIwMFxuICAgICAgICAgICAgQGJyb3dzZXIuc2V0U2hlbGZTaXplIDIwMFxuICAgICAgICAgICAgXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBvbk1vdXNlT3ZlcjogKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdmVyKClcbiAgICBvbk1vdXNlT3V0OiAgKGV2ZW50KSA9PiBAcm93KGV2ZW50LnRhcmdldCk/Lm9uTW91c2VPdXQoKVxuICAgIG9uQ2xpY2s6ICAgICAoZXZlbnQpID0+IEByb3coZXZlbnQudGFyZ2V0KT8uYWN0aXZhdGUgZXZlbnRcbiAgICBvbkRibENsaWNrOiAgKGV2ZW50KSA9PiBAbmF2aWdhdGVDb2xzICdlbnRlcidcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcblxuICAgIG5hdmlnYXRlUm93czogKGtleSkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yIFwibm8gcm93cyBpbiBjb2x1bW4gI3tAaW5kZXh9P1wiIGlmIG5vdCBAbnVtUm93cygpXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVJvdygpPy5pbmRleCgpID8gLTFcbiAgICAgICAga2Vycm9yIFwibm8gaW5kZXggZnJvbSBhY3RpdmVSb3c/ICN7aW5kZXh9P1wiLCBAYWN0aXZlUm93KCkgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIGluZGV4LTFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiBpbmRleCsxXG4gICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gMFxuICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIEBpdGVtcy5sZW5ndGhcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiBpbmRleC1AbnVtVmlzaWJsZSgpXG4gICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gY2xhbXAgMCwgQGl0ZW1zLmxlbmd0aCwgaW5kZXgrQG51bVZpc2libGUoKVxuICAgICAgICAgICAgZWxzZSBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIGluZGV4ICN7aW5kZXh9PyAje0BudW1WaXNpYmxlKCl9XCIgaWYgbm90IGluZGV4PyBvciBOdW1iZXIuaXNOYU4gaW5kZXggICAgICAgIFxuICAgICAgICBpbmRleCA9IGNsYW1wIDAsIEBudW1Sb3dzKCktMSwgaW5kZXhcbiAgICAgICAgXG4gICAgICAgIGtlcnJvciBcIm5vIHJvdyBhdCBpbmRleCAje2luZGV4fS8je0BudW1Sb3dzKCktMX0/XCIsIEBudW1Sb3dzKCkgaWYgbm90IEByb3dzW2luZGV4XT8uYWN0aXZhdGU/XG5cbiAgICAgICAgbmF2aWdhdGUgPSAoYWN0aW9uKSA9PlxuICAgICAgICAgICAgQG5hdmlnYXRpbmdSb3dzID0gdHJ1ZVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdtZW51QWN0aW9uJyBhY3Rpb25cbiAgICAgICAgXG4gICAgICAgIGlmICAgICAga2V5ID09ICd1cCcgICBhbmQgaW5kZXggPiBAaXRlbXMubGVuZ3RoICAgICB0aGVuIG5hdmlnYXRlICdOYXZpZ2F0ZSBGb3J3YXJkJ1xuICAgICAgICBlbHNlIGlmIGtleSA9PSAnZG93bicgYW5kIGluZGV4ID4gQGl0ZW1zLmxlbmd0aCArIDEgdGhlbiBuYXZpZ2F0ZSAnTmF2aWdhdGUgQmFja3dhcmQnXG4gICAgICAgIGVsc2UgQHJvd3NbaW5kZXhdLmFjdGl2YXRlKClcbiAgICBcbiAgICByZW1vdmVPYmplY3Q6ID0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIHJvdyA9IEBhY3RpdmVSb3coKVxuICAgICAgICAgICAgbmV4dE9yUHJldiA9IHJvdy5uZXh0KCkgPyByb3cucHJldigpXG4gICAgICAgICAgICByb3cuZGl2LnJlbW92ZSgpXG4gICAgICAgICAgICBAaXRlbXMuc3BsaWNlIHJvdy5pbmRleCgpLCAxXG4gICAgICAgICAgICBAcm93cy5zcGxpY2Ugcm93LmluZGV4KCksIDFcbiAgICAgICAgICAgIG5leHRPclByZXY/LmFjdGl2YXRlKClcbiAgICAgICAgICAgIEBzYXZlUHJlZnMoKVxuICAgICAgICBAXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICBcbiAgICBcbiAgICBzaG93Q29udGV4dE1lbnU6IChhYnNQb3MpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgYWJzUG9zP1xuICAgICAgICAgICAgYWJzUG9zID0gcG9zIEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQsIEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcFxuICAgICAgICBcbiAgICAgICAgb3B0ID0gaXRlbXM6IFsgXG4gICAgICAgICAgICB0ZXh0OiAgICdUb2dnbGUgRXh0ZW5zaW9ucydcbiAgICAgICAgICAgIGNvbWJvOiAgJ2N0cmwrZScgXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ1JlbW92ZSdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2JhY2tzcGFjZScgXG4gICAgICAgICAgICBjYjogICAgIEByZW1vdmVPYmplY3RcbiAgICAgICAgXVxuICAgICAgICBcbiAgICAgICAgb3B0LnggPSBhYnNQb3MueFxuICAgICAgICBvcHQueSA9IGFic1Bvcy55XG4gICAgICAgIHBvcHVwLm1lbnUgb3B0XG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgb25LZXk6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2JhY2tzcGFjZScgJ2RlbGV0ZScgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAY2xlYXJTZWFyY2goKS5yZW1vdmVPYmplY3QoKVxuICAgICAgICAgICAgd2hlbiAnY29tbWFuZCtrJyAnY3RybCtrJyB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQgaWYgQGJyb3dzZXIuY2xlYW5VcCgpXG4gICAgICAgICAgICB3aGVuICd0YWInICAgIFxuICAgICAgICAgICAgICAgIGlmIEBzZWFyY2gubGVuZ3RoIHRoZW4gQGRvU2VhcmNoICcnXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudFxuICAgICAgICAgICAgd2hlbiAnZXNjJ1xuICAgICAgICAgICAgICAgIGlmIEBzZWFyY2gubGVuZ3RoIHRoZW4gQGNsZWFyU2VhcmNoKClcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICB3aGVuICd1cCcgJ2Rvd24nICdwYWdlIHVwJyAncGFnZSBkb3duJyAnaG9tZScgJ2VuZCcgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQG5hdmlnYXRlUm93cyBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyAnYWx0K3JpZ2h0JyAnZW50ZXInXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGZvY3VzQnJvd3NlcigpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG1vZCBpbiBbJ3NoaWZ0JyAnJ10gYW5kIGNoYXIgdGhlbiBAZG9TZWFyY2ggY2hhclxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gU2hlbGZcbiJdfQ==
//# sourceURL=../coffee/shelf.coffee