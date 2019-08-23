// koffee 1.4.0

/*
00000000    0000000   000   000
000   000  000   000  000 0 000
0000000    000   000  000000000
000   000  000   000  000   000
000   000   0000000   00     00
 */
var $, File, Row, _, app, clamp, drag, electron, elem, empty, fs, kerror, keyinfo, post, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), elem = ref.elem, keyinfo = ref.keyinfo, drag = ref.drag, clamp = ref.clamp, stopEvent = ref.stopEvent, empty = ref.empty, post = ref.post, slash = ref.slash, kerror = ref.kerror, fs = ref.fs, $ = ref.$, _ = ref._;

electron = require('electron');

File = require('./file');

app = electron.remote.app;

Row = (function() {
    function Row(column1, item) {
        var html, ref1, ref2, text;
        this.column = column1;
        this.item = item;
        this.onDragStop = bind(this.onDragStop, this);
        this.onDragMove = bind(this.onDragMove, this);
        this.onDragStart = bind(this.onDragStart, this);
        this.onNameChange = bind(this.onNameChange, this);
        this.onNameFocusOut = bind(this.onNameFocusOut, this);
        this.onNameKeyDown = bind(this.onNameKeyDown, this);
        this.editName = bind(this.editName, this);
        this.activate = bind(this.activate, this);
        this.browser = this.column.browser;
        text = (ref1 = this.item.text) != null ? ref1 : this.item.name;
        if (empty(text) || empty(text.trim())) {
            html = '<span> </span>';
        } else {
            html = text;
        }
        this.div = elem({
            "class": 'browserRow',
            html: html
        });
        this.div.classList.add(this.item.type);
        this.column.table.appendChild(this.div);
        if (((ref2 = this.item.type) === 'file' || ref2 === 'dir') || this.item.icon) {
            this.setIcon();
        }
        this.drag = new drag({
            target: this.div,
            onStart: this.onDragStart,
            onMove: this.onDragMove,
            onStop: this.onDragStop
        });
    }

    Row.prototype.next = function() {
        return this.index() < this.column.numRows() - 1 && this.column.rows[this.index() + 1] || null;
    };

    Row.prototype.prev = function() {
        return this.index() > 0 && this.column.rows[this.index() - 1] || null;
    };

    Row.prototype.index = function() {
        return this.column.rows.indexOf(this);
    };

    Row.prototype.onMouseOut = function() {
        return this.div.classList.remove('hover');
    };

    Row.prototype.onMouseOver = function() {
        return this.div.classList.add('hover');
    };

    Row.prototype.path = function() {
        var ref1;
        if ((this.item.file != null) && _.isString(this.item.file)) {
            return this.item.file;
        }
        if ((((ref1 = this.item.obj) != null ? ref1.file : void 0) != null) && _.isString(this.item.obj.file)) {
            return this.item.obj.file;
        }
    };

    Row.prototype.setIcon = function() {
        var className, icon;
        if (this.item.icon) {
            className = this.item.icon;
        } else {
            if (this.item.type === 'dir') {
                className = 'folder-icon';
            } else {
                className = File.iconClassName(this.item.file);
            }
        }
        return icon = elem('span', {
            "class": className + ' browserFileIcon'
        });
    };

    Row.prototype.activate = function(event) {
        var mod, opt, ref1, ref2, ref3;
        if (this.column.index < 0) {
            this.column.activateRow(this);
            return;
        }
        if (event != null) {
            mod = keyinfo.forEvent(event).mod;
            switch (mod) {
                case 'alt':
                case 'command+alt':
                case 'ctrl+alt':
                    if (this.item.type === 'file' && this.item.textFile) {
                        post.toMain('newWindowWithFile', this.item.file);
                        return;
                    }
            }
        }
        if ((ref1 = $('.hover')) != null) {
            ref1.classList.remove('hover');
        }
        this.setActive({
            emit: true
        });
        opt = {
            file: this.item.file
        };
        switch (this.item.type) {
            case 'dir':
            case 'file':
                post.emit('filebrowser', 'activateItem', this.item, this.column.index);
                break;
            default:
                if ((this.item.file != null) && _.isString(this.item.file) && this.item.type !== 'obj') {
                    opt.line = this.item.line;
                    opt.col = this.item.column;
                    post.emit('jumpToFile', opt);
                } else if ((this.column.parent.obj != null) && this.column.parent.type === 'obj') {
                    if (this.item.type === 'obj') {
                        this.browser.loadObjectItem(this.item, {
                            column: this.column.index + 1
                        });
                        this.browser.previewObjectItem(this.item, {
                            column: this.column.index + 2
                        });
                        if ((((ref2 = this.item.obj) != null ? ref2.file : void 0) != null) && _.isString(this.item.obj.file)) {
                            opt.line = this.item.obj.line;
                            opt.col = this.item.obj.column;
                            post.emit('jumpToFile', opt);
                        }
                    }
                } else if ((((ref3 = this.item.obj) != null ? ref3.file : void 0) != null) && _.isString(this.item.obj.file)) {
                    opt = {
                        file: this.item.obj.file,
                        line: this.item.obj.line,
                        col: this.item.obj.column,
                        newTab: opt.newTab
                    };
                    post.emit('jumpToFile', opt);
                } else {
                    this.browser.clearColumnsFrom(this.column.index + 1);
                }
        }
        return this;
    };

    Row.prototype.isActive = function() {
        return this.div.classList.contains('active');
    };

    Row.prototype.setActive = function(opt) {
        var ref1;
        if (opt == null) {
            opt = {};
        }
        if ((ref1 = this.column.activeRow()) != null) {
            ref1.clearActive();
        }
        this.div.classList.add('active');
        if ((opt != null ? opt.scroll : void 0) !== false) {
            this.column.scroll.toIndex(this.index());
        }
        if (opt != null ? opt.emit : void 0) {
            this.browser.emit('itemActivated', this.item);
            if (this.item.type === 'dir') {
                post.emit('setCWD', this.item.file);
            } else if (this.item.type === 'file') {
                post.emit('setCWD', slash.dir(this.item.file));
            }
        }
        return this;
    };

    Row.prototype.clearActive = function() {
        this.div.classList.remove('active');
        return this;
    };

    Row.prototype.editName = function() {
        if (this.input != null) {
            return;
        }
        this.input = elem('input', {
            "class": 'rowNameInput'
        });
        this.input.value = slash.file(this.item.file);
        this.div.appendChild(this.input);
        this.input.addEventListener('change', this.onNameChange);
        this.input.addEventListener('keydown', this.onNameKeyDown);
        this.input.addEventListener('focusout', this.onNameFocusOut);
        this.input.focus();
        return this.input.setSelectionRange(0, slash.base(this.item.file).length);
    };

    Row.prototype.onNameKeyDown = function(event) {
        var combo, key, mod, ref1;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo;
        switch (combo) {
            case 'enter':
            case 'esc':
                if (this.input.value === this.file || combo !== 'enter') {
                    this.input.value = this.file;
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    this.onNameFocusOut();
                }
        }
        return event.stopPropagation();
    };

    Row.prototype.removeInput = function() {
        if (this.input == null) {
            return;
        }
        this.input.removeEventListener('focusout', this.onNameFocusOut);
        this.input.removeEventListener('change', this.onNameChange);
        this.input.removeEventListener('keydown', this.onNameKeyDown);
        this.input.remove();
        delete this.input;
        this.input = null;
        if ((document.activeElement == null) || document.activeElement === document.body) {
            return this.column.focus({
                activate: false
            });
        }
    };

    Row.prototype.onNameFocusOut = function(event) {
        return this.removeInput();
    };

    Row.prototype.onNameChange = function(event) {
        var newFile, trimmed, unusedFilename;
        trimmed = this.input.value.trim();
        if (trimmed.length) {
            newFile = slash.join(slash.dir(this.item.file), trimmed);
            unusedFilename = require('unused-filename');
            unusedFilename(newFile).then((function(_this) {
                return function(newFile) {
                    return fs.rename(_this.item.file, newFile, function(err) {
                        if (err) {
                            return kerror('rename failed', err);
                        }
                        return post.emit('loadFile', newFile);
                    });
                };
            })(this));
        }
        return this.removeInput();
    };

    Row.prototype.onDragStart = function(d, e) {
        this.column.focus({
            activate: false
        });
        return this.setActive({
            scroll: false
        });
    };

    Row.prototype.onDragMove = function(d, e) {
        var br;
        if (!this.column.dragDiv) {
            if (Math.abs(d.deltaSum.x) < 20 && Math.abs(d.deltaSum.y) < 10) {
                return;
            }
            this.column.dragDiv = this.div.cloneNode(true);
            br = this.div.getBoundingClientRect();
            this.column.dragDiv.style.position = 'absolute';
            this.column.dragDiv.style.top = br.top + "px";
            this.column.dragDiv.style.left = br.left + "px";
            this.column.dragDiv.style.width = (br.width - 12) + "px";
            this.column.dragDiv.style.height = (br.height - 3) + "px";
            this.column.dragDiv.style.flex = 'unset';
            this.column.dragDiv.style.pointerEvents = 'none';
            document.body.appendChild(this.column.dragDiv);
        }
        return this.column.dragDiv.style.transform = "translateX(" + d.deltaSum.x + "px) translateY(" + d.deltaSum.y + "px)";
    };

    Row.prototype.onDragStop = function(d, e) {
        var column;
        if (this.column.dragDiv != null) {
            this.column.dragDiv.remove();
            delete this.column.dragDiv;
            if (column = this.browser.columnAtPos(d.pos)) {
                return typeof column.dropRow === "function" ? column.dropRow(this, d.pos) : void 0;
            }
        }
    };

    return Row;

})();

module.exports = Row;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm93LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwwR0FBQTtJQUFBOztBQVFBLE1BQWtGLE9BQUEsQ0FBUSxLQUFSLENBQWxGLEVBQUUsZUFBRixFQUFRLHFCQUFSLEVBQWlCLGVBQWpCLEVBQXVCLGlCQUF2QixFQUE4Qix5QkFBOUIsRUFBeUMsaUJBQXpDLEVBQWdELGVBQWhELEVBQXNELGlCQUF0RCxFQUE2RCxtQkFBN0QsRUFBcUUsV0FBckUsRUFBeUUsU0FBekUsRUFBNEU7O0FBRTVFLFFBQUEsR0FBWSxPQUFBLENBQVEsVUFBUjs7QUFDWixJQUFBLEdBQVksT0FBQSxDQUFRLFFBQVI7O0FBRVosR0FBQSxHQUFNLFFBQVEsQ0FBQyxNQUFNLENBQUM7O0FBRWhCO0lBRVcsYUFBQyxPQUFELEVBQVUsSUFBVjtBQUVULFlBQUE7UUFGVSxJQUFDLENBQUEsU0FBRDtRQUFTLElBQUMsQ0FBQSxPQUFEOzs7Ozs7Ozs7UUFFbkIsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFDLENBQUEsTUFBTSxDQUFDO1FBQ25CLElBQUEsNENBQW9CLElBQUMsQ0FBQSxJQUFJLENBQUM7UUFDMUIsSUFBRyxLQUFBLENBQU0sSUFBTixDQUFBLElBQWUsS0FBQSxDQUFNLElBQUksQ0FBQyxJQUFMLENBQUEsQ0FBTixDQUFsQjtZQUNJLElBQUEsR0FBTyxpQkFEWDtTQUFBLE1BQUE7WUFHSSxJQUFBLEdBQU8sS0FIWDs7UUFJQSxJQUFDLENBQUEsR0FBRCxHQUFPLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sWUFBUDtZQUFxQixJQUFBLEVBQU0sSUFBM0I7U0FBTDtRQUNQLElBQUMsQ0FBQSxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUF6QjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQWQsQ0FB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I1xuMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMFxuIyMjXG5cbnsgZWxlbSwga2V5aW5mbywgZHJhZywgY2xhbXAsIHN0b3BFdmVudCwgZW1wdHksIHBvc3QsIHNsYXNoLCBrZXJyb3IsIGZzLCAkLCBfIH0gPSByZXF1aXJlICdreGsnIFxuXG5lbGVjdHJvbiAgPSByZXF1aXJlICdlbGVjdHJvbidcbkZpbGUgICAgICA9IHJlcXVpcmUgJy4vZmlsZSdcblxuYXBwID0gZWxlY3Ryb24ucmVtb3RlLmFwcFxuXG5jbGFzcyBSb3dcbiAgICBcbiAgICBjb25zdHJ1Y3RvcjogKEBjb2x1bW4sIEBpdGVtKSAtPlxuXG4gICAgICAgIEBicm93c2VyID0gQGNvbHVtbi5icm93c2VyXG4gICAgICAgIHRleHQgPSBAaXRlbS50ZXh0ID8gQGl0ZW0ubmFtZVxuICAgICAgICBpZiBlbXB0eSh0ZXh0KSBvciBlbXB0eSB0ZXh0LnRyaW0oKVxuICAgICAgICAgICAgaHRtbCA9ICc8c3Bhbj4gPC9zcGFuPidcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaHRtbCA9IHRleHQgI1N5bnRheC5zcGFuRm9yVGV4dEFuZFN5bnRheCB0ZXh0LCAnYnJvd3NlcidcbiAgICAgICAgQGRpdiA9IGVsZW0gY2xhc3M6ICdicm93c2VyUm93JywgaHRtbDogaHRtbFxuICAgICAgICBAZGl2LmNsYXNzTGlzdC5hZGQgQGl0ZW0udHlwZVxuICAgICAgICBAY29sdW1uLnRhYmxlLmFwcGVuZENoaWxkIEBkaXZcblxuICAgICAgICBpZiBAaXRlbS50eXBlIGluIFsnZmlsZScsICdkaXInXSBvciBAaXRlbS5pY29uXG4gICAgICAgICAgICBAc2V0SWNvbigpXG4gICAgICAgIFxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAZGl2XG4gICAgICAgICAgICBvblN0YXJ0OiBAb25EcmFnU3RhcnRcbiAgICAgICAgICAgIG9uTW92ZTogIEBvbkRyYWdNb3ZlXG4gICAgICAgICAgICBvblN0b3A6ICBAb25EcmFnU3RvcFxuICAgXG4gICAgbmV4dDogICAgICAgIC0+IEBpbmRleCgpIDwgQGNvbHVtbi5udW1Sb3dzKCktMSBhbmQgQGNvbHVtbi5yb3dzW0BpbmRleCgpKzFdIG9yIG51bGxcbiAgICBwcmV2OiAgICAgICAgLT4gQGluZGV4KCkgPiAwIGFuZCBAY29sdW1uLnJvd3NbQGluZGV4KCktMV0gb3IgbnVsbFxuICAgIGluZGV4OiAgICAgICAtPiBAY29sdW1uLnJvd3MuaW5kZXhPZiBAICAgIFxuICAgIG9uTW91c2VPdXQ6ICAtPiBAZGl2LmNsYXNzTGlzdC5yZW1vdmUgJ2hvdmVyJ1xuICAgIG9uTW91c2VPdmVyOiAtPiBAZGl2LmNsYXNzTGlzdC5hZGQgJ2hvdmVyJ1xuXG4gICAgcGF0aDogLT4gXG4gICAgICAgIGlmIEBpdGVtLmZpbGU/IGFuZCBfLmlzU3RyaW5nIEBpdGVtLmZpbGVcbiAgICAgICAgICAgIHJldHVybiBAaXRlbS5maWxlXG4gICAgICAgIGlmIEBpdGVtLm9iaj8uZmlsZT8gYW5kIF8uaXNTdHJpbmcgQGl0ZW0ub2JqLmZpbGVcbiAgICAgICAgICAgIHJldHVybiBAaXRlbS5vYmouZmlsZVxuXG4gICAgc2V0SWNvbjogLT5cblxuICAgICAgICBpZiBAaXRlbS5pY29uXG4gICAgICAgICAgICBjbGFzc05hbWUgPSBAaXRlbS5pY29uXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIEBpdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICBjbGFzc05hbWUgPSAnZm9sZGVyLWljb24nXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gRmlsZS5pY29uQ2xhc3NOYW1lIEBpdGVtLmZpbGVcbiAgICAgICAgICAgIFxuICAgICAgICBpY29uID0gZWxlbSgnc3BhbicsIGNsYXNzOmNsYXNzTmFtZSArICcgYnJvd3NlckZpbGVJY29uJylcbiAgICAgICAgICAgIFxuICAgICAgICAjIEBkaXYuZmlyc3RDaGlsZD8uaW5zZXJ0QmVmb3JlIGljb24sIEBkaXYuZmlyc3RDaGlsZC5maXJzdENoaWxkXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgYWN0aXZhdGU6IChldmVudCkgPT5cblxuICAgICAgICBpZiBAY29sdW1uLmluZGV4IDwgMCAjIHNoZWxmIGhhbmRsZXMgcm93IGFjdGl2YXRpb25cbiAgICAgICAgICAgIEBjb2x1bW4uYWN0aXZhdGVSb3cgQFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBpZiBldmVudD9cbiAgICAgICAgICAgIHsgbW9kIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG4gICAgICAgICAgICBzd2l0Y2ggbW9kXG4gICAgICAgICAgICAgICAgd2hlbiAnYWx0JywgJ2NvbW1hbmQrYWx0JywgJ2N0cmwrYWx0J1xuICAgICAgICAgICAgICAgICAgICBpZiBAaXRlbS50eXBlID09ICdmaWxlJyBhbmQgQGl0ZW0udGV4dEZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3QudG9NYWluICduZXdXaW5kb3dXaXRoRmlsZScsIEBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgICQoJy5ob3ZlcicpPy5jbGFzc0xpc3QucmVtb3ZlICdob3ZlcidcbiAgICAgICAgXG4gICAgICAgIEBzZXRBY3RpdmUgZW1pdDp0cnVlXG4gICAgICAgIFxuICAgICAgICBvcHQgPSBmaWxlOkBpdGVtLmZpbGVcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBAaXRlbS50eXBlXG4gICAgICAgICAgICB3aGVuICdkaXInLCAnZmlsZScgXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdmaWxlYnJvd3NlcicsICdhY3RpdmF0ZUl0ZW0nLCBAaXRlbSwgQGNvbHVtbi5pbmRleFxuICAgICAgICAgICAgZWxzZSAgICBcbiAgICAgICAgICAgICAgICBpZiBAaXRlbS5maWxlPyBhbmQgXy5pc1N0cmluZyhAaXRlbS5maWxlKSBhbmQgQGl0ZW0udHlwZSAhPSAnb2JqJ1xuICAgICAgICAgICAgICAgICAgICBvcHQubGluZSA9IEBpdGVtLmxpbmVcbiAgICAgICAgICAgICAgICAgICAgb3B0LmNvbCAgPSBAaXRlbS5jb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG9GaWxlJywgb3B0XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAY29sdW1uLnBhcmVudC5vYmo/IGFuZCBAY29sdW1uLnBhcmVudC50eXBlID09ICdvYmonXG4gICAgICAgICAgICAgICAgICAgIGlmIEBpdGVtLnR5cGUgPT0gJ29iaidcbiAgICAgICAgICAgICAgICAgICAgICAgIEBicm93c2VyLmxvYWRPYmplY3RJdGVtIEBpdGVtLCBjb2x1bW46QGNvbHVtbi5pbmRleCsxXG4gICAgICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5wcmV2aWV3T2JqZWN0SXRlbSAgQGl0ZW0sIGNvbHVtbjpAY29sdW1uLmluZGV4KzJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIEBpdGVtLm9iaj8uZmlsZT8gYW5kIF8uaXNTdHJpbmcgQGl0ZW0ub2JqLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHQubGluZSA9IEBpdGVtLm9iai5saW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmNvbCAgPSBAaXRlbS5vYmouY29sdW1uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdqdW1wVG9GaWxlJywgb3B0XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAaXRlbS5vYmo/LmZpbGU/IGFuZCBfLmlzU3RyaW5nIEBpdGVtLm9iai5maWxlXG4gICAgICAgICAgICAgICAgICAgIG9wdCA9IGZpbGU6QGl0ZW0ub2JqLmZpbGUsIGxpbmU6QGl0ZW0ub2JqLmxpbmUsIGNvbDpAaXRlbS5vYmouY29sdW1uLCBuZXdUYWI6b3B0Lm5ld1RhYlxuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUb0ZpbGUnLCBvcHRcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLmNsZWFyQ29sdW1uc0Zyb20gQGNvbHVtbi5pbmRleCsxXG4gICAgICAgIEBcbiAgICBcbiAgICBpc0FjdGl2ZTogLT4gQGRpdi5jbGFzc0xpc3QuY29udGFpbnMgJ2FjdGl2ZSdcbiAgICBcbiAgICBzZXRBY3RpdmU6IChvcHQgPSB7fSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW4uYWN0aXZlUm93KCk/LmNsZWFyQWN0aXZlKClcbiAgICAgICAgQGRpdi5jbGFzc0xpc3QuYWRkICdhY3RpdmUnXG4gICAgICAgIFxuICAgICAgICBpZiBvcHQ/LnNjcm9sbCAhPSBmYWxzZVxuICAgICAgICAgICAgQGNvbHVtbi5zY3JvbGwudG9JbmRleCBAaW5kZXgoKVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG9wdD8uZW1pdCBcbiAgICAgICAgICAgIEBicm93c2VyLmVtaXQgJ2l0ZW1BY3RpdmF0ZWQnLCBAaXRlbVxuICAgICAgICAgICAgaWYgQGl0ZW0udHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnc2V0Q1dEJywgQGl0ZW0uZmlsZVxuICAgICAgICAgICAgZWxzZSBpZiBAaXRlbS50eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnc2V0Q1dEJywgc2xhc2guZGlyIEBpdGVtLmZpbGVcbiAgICAgICAgQFxuICAgICAgICAgICAgICAgIFxuICAgIGNsZWFyQWN0aXZlOiAtPlxuICAgICAgICBAZGl2LmNsYXNzTGlzdC5yZW1vdmUgJ2FjdGl2ZSdcbiAgICAgICAgQFxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgICAgICAgICBcbiAgICBlZGl0TmFtZTogPT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAaW5wdXQ/IFxuICAgICAgICBAaW5wdXQgPSBlbGVtICdpbnB1dCcsIGNsYXNzOiAncm93TmFtZUlucHV0J1xuICAgICAgICBAaW5wdXQudmFsdWUgPSBzbGFzaC5maWxlIEBpdGVtLmZpbGVcbiAgICAgICAgXG4gICAgICAgIEBkaXYuYXBwZW5kQ2hpbGQgQGlucHV0XG4gICAgICAgIEBpbnB1dC5hZGRFdmVudExpc3RlbmVyICdjaGFuZ2UnLCAgIEBvbk5hbWVDaGFuZ2VcbiAgICAgICAgQGlucHV0LmFkZEV2ZW50TGlzdGVuZXIgJ2tleWRvd24nLCAgQG9uTmFtZUtleURvd25cbiAgICAgICAgQGlucHV0LmFkZEV2ZW50TGlzdGVuZXIgJ2ZvY3Vzb3V0JywgQG9uTmFtZUZvY3VzT3V0XG4gICAgICAgIEBpbnB1dC5mb2N1cygpXG4gICAgICAgIFxuICAgICAgICBAaW5wdXQuc2V0U2VsZWN0aW9uUmFuZ2UgMCwgc2xhc2guYmFzZShAaXRlbS5maWxlKS5sZW5ndGhcblxuICAgIG9uTmFtZUtleURvd246IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIHttb2QsIGtleSwgY29tYm99ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJywgJ2VzYydcbiAgICAgICAgICAgICAgICBpZiBAaW5wdXQudmFsdWUgPT0gQGZpbGUgb3IgY29tYm8gIT0gJ2VudGVyJ1xuICAgICAgICAgICAgICAgICAgICBAaW5wdXQudmFsdWUgPSBAZmlsZVxuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgICAgIEBvbk5hbWVGb2N1c091dCgpXG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIFxuICAgIHJlbW92ZUlucHV0OiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAaW5wdXQ/XG4gICAgICAgIEBpbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyICdmb2N1c291dCcsIEBvbk5hbWVGb2N1c091dFxuICAgICAgICBAaW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lciAnY2hhbmdlJywgICBAb25OYW1lQ2hhbmdlXG4gICAgICAgIEBpbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyICdrZXlkb3duJywgIEBvbk5hbWVLZXlEb3duXG4gICAgICAgIEBpbnB1dC5yZW1vdmUoKVxuICAgICAgICBkZWxldGUgQGlucHV0XG4gICAgICAgIEBpbnB1dCA9IG51bGxcbiAgICAgICAgaWYgbm90IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ/IG9yIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT0gZG9jdW1lbnQuYm9keVxuICAgICAgICAgICAgQGNvbHVtbi5mb2N1cyBhY3RpdmF0ZTpmYWxzZVxuICAgIFxuICAgIG9uTmFtZUZvY3VzT3V0OiAoZXZlbnQpID0+IEByZW1vdmVJbnB1dCgpXG4gICAgXG4gICAgb25OYW1lQ2hhbmdlOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICB0cmltbWVkID0gQGlucHV0LnZhbHVlLnRyaW0oKVxuICAgICAgICBpZiB0cmltbWVkLmxlbmd0aFxuICAgICAgICAgICAgbmV3RmlsZSA9IHNsYXNoLmpvaW4gc2xhc2guZGlyKEBpdGVtLmZpbGUpLCB0cmltbWVkXG4gICAgICAgICAgICB1bnVzZWRGaWxlbmFtZSA9IHJlcXVpcmUgJ3VudXNlZC1maWxlbmFtZSdcbiAgICAgICAgICAgIHVudXNlZEZpbGVuYW1lKG5ld0ZpbGUpLnRoZW4gKG5ld0ZpbGUpID0+XG4gICAgICAgICAgICAgICAgZnMucmVuYW1lIEBpdGVtLmZpbGUsIG5ld0ZpbGUsIChlcnIpID0+XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ3JlbmFtZSBmYWlsZWQnLCBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnbG9hZEZpbGUnLCBuZXdGaWxlXG4gICAgICAgIEByZW1vdmVJbnB1dCgpXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgb25EcmFnU3RhcnQ6IChkLCBlKSA9PlxuICAgICAgICBcbiAgICAgICAgQGNvbHVtbi5mb2N1cyBhY3RpdmF0ZTpmYWxzZVxuICAgICAgICBAc2V0QWN0aXZlIHNjcm9sbDpmYWxzZVxuXG4gICAgb25EcmFnTW92ZTogKGQsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAY29sdW1uLmRyYWdEaXZcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGlmIE1hdGguYWJzKGQuZGVsdGFTdW0ueCkgPCAyMCBhbmQgTWF0aC5hYnMoZC5kZWx0YVN1bS55KSA8IDEwXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0RpdiA9IEBkaXYuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgICAgIGJyID0gQGRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnN0eWxlLnRvcCAgPSBcIiN7YnIudG9wfXB4XCJcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS5sZWZ0ID0gXCIje2JyLmxlZnR9cHhcIlxuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnN0eWxlLndpZHRoID0gXCIje2JyLndpZHRoLTEyfXB4XCJcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS5oZWlnaHQgPSBcIiN7YnIuaGVpZ2h0LTN9cHhcIlxuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnN0eWxlLmZsZXggPSAndW5zZXQnXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJ1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCBAY29sdW1uLmRyYWdEaXZcbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZVgoI3tkLmRlbHRhU3VtLnh9cHgpIHRyYW5zbGF0ZVkoI3tkLmRlbHRhU3VtLnl9cHgpXCJcblxuICAgIG9uRHJhZ1N0b3A6IChkLGUpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAY29sdW1uLmRyYWdEaXY/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5yZW1vdmUoKVxuICAgICAgICAgICAgZGVsZXRlIEBjb2x1bW4uZHJhZ0RpdlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBjb2x1bW4gPSBAYnJvd3Nlci5jb2x1bW5BdFBvcyBkLnBvc1xuICAgICAgICAgICAgICAgIGNvbHVtbi5kcm9wUm93PyBALCBkLnBvc1xuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gUm93XG4iXX0=
//# sourceURL=../coffee/row.coffee