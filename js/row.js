// koffee 1.4.0

/*
00000000    0000000   000   000
000   000  000   000  000 0 000
0000000    000   000  000000000
000   000  000   000  000   000
000   000   0000000   00     00
 */
var $, File, Row, _, app, clamp, drag, electron, elem, empty, fs, kerror, keyinfo, klog, post, ref, slash, stopEvent, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), elem = ref.elem, keyinfo = ref.keyinfo, drag = ref.drag, clamp = ref.clamp, stopEvent = ref.stopEvent, valid = ref.valid, empty = ref.empty, post = ref.post, slash = ref.slash, klog = ref.klog, kerror = ref.kerror, fs = ref.fs, $ = ref.$, _ = ref._;

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
            html = File.span(text);
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
        var className, icon, ref1;
        if (this.item.icon) {
            className = this.item.icon;
        } else {
            if (this.item.type === 'dir') {
                className = 'folder-icon';
            } else {
                className = File.iconClassName(this.item.file);
            }
        }
        icon = elem('span', {
            "class": className + ' browserFileIcon'
        });
        return (ref1 = this.div.firstChild) != null ? ref1.insertBefore(icon, this.div.firstChild.firstChild) : void 0;
    };

    Row.prototype.activate = function(event) {
        var opt, ref1, ref2, ref3;
        if (this.column.index < 0) {
            this.column.activateRow(this);
            return;
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
                    klog('jumpToFile?', opt);
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
                            klog('jumpToFile?', opt);
                        }
                    }
                } else if ((((ref3 = this.item.obj) != null ? ref3.file : void 0) != null) && _.isString(this.item.obj.file)) {
                    opt = {
                        file: this.item.obj.file,
                        line: this.item.obj.line,
                        col: this.item.obj.column,
                        newTab: opt.newTab
                    };
                    klog('jumpToFile?', opt);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm93LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx1SEFBQTtJQUFBOztBQVFBLE1BQStGLE9BQUEsQ0FBUSxLQUFSLENBQS9GLEVBQUUsZUFBRixFQUFRLHFCQUFSLEVBQWlCLGVBQWpCLEVBQXVCLGlCQUF2QixFQUE4Qix5QkFBOUIsRUFBeUMsaUJBQXpDLEVBQWdELGlCQUFoRCxFQUF1RCxlQUF2RCxFQUE2RCxpQkFBN0QsRUFBb0UsZUFBcEUsRUFBMEUsbUJBQTFFLEVBQWtGLFdBQWxGLEVBQXNGLFNBQXRGLEVBQXlGOztBQUV6RixRQUFBLEdBQVksT0FBQSxDQUFRLFVBQVI7O0FBQ1osSUFBQSxHQUFZLE9BQUEsQ0FBUSxRQUFSOztBQUVaLEdBQUEsR0FBTSxRQUFRLENBQUMsTUFBTSxDQUFDOztBQUVoQjtJQUVXLGFBQUMsT0FBRCxFQUFVLElBQVY7QUFFVCxZQUFBO1FBRlUsSUFBQyxDQUFBLFNBQUQ7UUFBUyxJQUFDLENBQUEsT0FBRDs7Ozs7Ozs7O1FBRW5CLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQyxDQUFBLE1BQU0sQ0FBQztRQUNuQixJQUFBLDRDQUFvQixJQUFDLENBQUEsSUFBSSxDQUFDO1FBQzFCLElBQUcsS0FBQSxDQUFNLElBQU4sQ0FBQSxJQUFlLEtBQUEsQ0FBTSxJQUFJLENBQUMsSUFBTCxDQUFBLENBQU4sQ0FBbEI7WUFDSSxJQUFBLEdBQU8saUJBRFg7U0FBQSxNQUFBO1lBR0ksSUFBQSxHQUFPLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBVixFQUhYOztRQUlBLElBQUMsQ0FBQSxHQUFELEdBQU8sSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxZQUFQO1lBQW9CLElBQUEsRUFBTSxJQUExQjtTQUFMO1FBQ1AsSUFBQyxDQUFBLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsSUFBSSxDQUFD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QixHQUFpQyxDQUFDLEVBQUUsQ0FBQyxNQUFILEdBQVUsQ0FBWCxDQUFBLEdBQWE7WUFDOUMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQXRCLEdBQTZCO1lBQzdCLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUF0QixHQUFzQztZQUN0QyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQWQsQ0FBMEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFsQyxFQWJKOztlQWVBLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUF0QixHQUFrQyxhQUFBLEdBQWMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUF6QixHQUEyQixpQkFBM0IsR0FBNEMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUF2RCxHQUF5RDtJQWpCbkY7O2tCQW1CWixVQUFBLEdBQVksU0FBQyxDQUFELEVBQUcsQ0FBSDtBQUVSLFlBQUE7UUFBQSxJQUFHLDJCQUFIO1lBRUksSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBaEIsQ0FBQTtZQUNBLE9BQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQztZQUVmLElBQUcsTUFBQSxHQUFTLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxDQUFxQixDQUFDLENBQUMsR0FBdkIsQ0FBWjs4REFDSSxNQUFNLENBQUMsUUFBUyxNQUFHLENBQUMsQ0FBQyxjQUR6QjthQUxKOztJQUZROzs7Ozs7QUFVaEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbjAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDBcbiMjI1xuXG57IGVsZW0sIGtleWluZm8sIGRyYWcsIGNsYW1wLCBzdG9wRXZlbnQsIHZhbGlkLCBlbXB0eSwgcG9zdCwgc2xhc2gsIGtsb2csIGtlcnJvciwgZnMsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aycgXG5cbmVsZWN0cm9uICA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuRmlsZSAgICAgID0gcmVxdWlyZSAnLi9maWxlJ1xuXG5hcHAgPSBlbGVjdHJvbi5yZW1vdGUuYXBwXG5cbmNsYXNzIFJvd1xuICAgIFxuICAgIGNvbnN0cnVjdG9yOiAoQGNvbHVtbiwgQGl0ZW0pIC0+XG5cbiAgICAgICAgQGJyb3dzZXIgPSBAY29sdW1uLmJyb3dzZXJcbiAgICAgICAgdGV4dCA9IEBpdGVtLnRleHQgPyBAaXRlbS5uYW1lXG4gICAgICAgIGlmIGVtcHR5KHRleHQpIG9yIGVtcHR5IHRleHQudHJpbSgpXG4gICAgICAgICAgICBodG1sID0gJzxzcGFuPiA8L3NwYW4+J1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBodG1sID0gRmlsZS5zcGFuIHRleHRcbiAgICAgICAgQGRpdiA9IGVsZW0gY2xhc3M6ICdicm93c2VyUm93JyBodG1sOiBodG1sXG4gICAgICAgIEBkaXYuY2xhc3NMaXN0LmFkZCBAaXRlbS50eXBlXG4gICAgICAgIEBjb2x1bW4udGFibGUuYXBwZW5kQ2hpbGQgQGRpdlxuXG4gICAgICAgIGlmIEBpdGVtLnR5cGUgaW4gWydmaWxlJyAnZGlyJ10gb3IgQGl0ZW0uaWNvblxuICAgICAgICAgICAgQHNldEljb24oKVxuICAgICAgICBcbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQGRpdlxuICAgICAgICAgICAgb25TdGFydDogQG9uRHJhZ1N0YXJ0XG4gICAgICAgICAgICBvbk1vdmU6ICBAb25EcmFnTW92ZVxuICAgICAgICAgICAgb25TdG9wOiAgQG9uRHJhZ1N0b3BcbiAgICAgICAgICAgICAgIFxuICAgIG5leHQ6ICAgICAgICAtPiBAaW5kZXgoKSA8IEBjb2x1bW4ubnVtUm93cygpLTEgYW5kIEBjb2x1bW4ucm93c1tAaW5kZXgoKSsxXSBvciBudWxsXG4gICAgcHJldjogICAgICAgIC0+IEBpbmRleCgpID4gMCBhbmQgQGNvbHVtbi5yb3dzW0BpbmRleCgpLTFdIG9yIG51bGxcbiAgICBpbmRleDogICAgICAgLT4gQGNvbHVtbi5yb3dzLmluZGV4T2YgQCAgICBcbiAgICBvbk1vdXNlT3V0OiAgLT4gQGRpdi5jbGFzc0xpc3QucmVtb3ZlICdob3ZlcidcbiAgICBvbk1vdXNlT3ZlcjogLT4gQGRpdi5jbGFzc0xpc3QuYWRkICdob3ZlcidcblxuICAgIHBhdGg6IC0+IFxuICAgICAgICBpZiBAaXRlbS5maWxlPyBhbmQgXy5pc1N0cmluZyBAaXRlbS5maWxlXG4gICAgICAgICAgICByZXR1cm4gQGl0ZW0uZmlsZVxuICAgICAgICBpZiBAaXRlbS5vYmo/LmZpbGU/IGFuZCBfLmlzU3RyaW5nIEBpdGVtLm9iai5maWxlXG4gICAgICAgICAgICByZXR1cm4gQGl0ZW0ub2JqLmZpbGVcblxuICAgIHNldEljb246IC0+XG5cbiAgICAgICAgaWYgQGl0ZW0uaWNvblxuICAgICAgICAgICAgY2xhc3NOYW1lID0gQGl0ZW0uaWNvblxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBAaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gJ2ZvbGRlci1pY29uJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA9IEZpbGUuaWNvbkNsYXNzTmFtZSBAaXRlbS5maWxlXG4gICAgICAgICAgICBcbiAgICAgICAgaWNvbiA9IGVsZW0oJ3NwYW4nIGNsYXNzOmNsYXNzTmFtZSArICcgYnJvd3NlckZpbGVJY29uJylcbiAgICAgICAgICAgIFxuICAgICAgICBAZGl2LmZpcnN0Q2hpbGQ/Lmluc2VydEJlZm9yZSBpY29uLCBAZGl2LmZpcnN0Q2hpbGQuZmlyc3RDaGlsZFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGFjdGl2YXRlOiAoZXZlbnQpID0+XG5cbiAgICAgICAgaWYgQGNvbHVtbi5pbmRleCA8IDAgIyBzaGVsZiBoYW5kbGVzIHJvdyBhY3RpdmF0aW9uXG4gICAgICAgICAgICBAY29sdW1uLmFjdGl2YXRlUm93IEBcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgJCgnLmhvdmVyJyk/LmNsYXNzTGlzdC5yZW1vdmUgJ2hvdmVyJ1xuICAgICAgICBcbiAgICAgICAgQHNldEFjdGl2ZSBlbWl0OnRydWVcbiAgICAgICAgXG4gICAgICAgIG9wdCA9IGZpbGU6QGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBzd2l0Y2ggQGl0ZW0udHlwZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdkaXInICdmaWxlJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZmlsZWJyb3dzZXInICdhY3RpdmF0ZUl0ZW0nIEBpdGVtLCBAY29sdW1uLmluZGV4XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBlbHNlICAgIFxuICAgICAgICAgICAgICAgIGlmIEBpdGVtLmZpbGU/IGFuZCBfLmlzU3RyaW5nKEBpdGVtLmZpbGUpIGFuZCBAaXRlbS50eXBlICE9ICdvYmonXG4gICAgICAgICAgICAgICAgICAgIG9wdC5saW5lID0gQGl0ZW0ubGluZVxuICAgICAgICAgICAgICAgICAgICBvcHQuY29sICA9IEBpdGVtLmNvbHVtblxuICAgICAgICAgICAgICAgICAgICBrbG9nICdqdW1wVG9GaWxlPycgb3B0XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAY29sdW1uLnBhcmVudC5vYmo/IGFuZCBAY29sdW1uLnBhcmVudC50eXBlID09ICdvYmonXG4gICAgICAgICAgICAgICAgICAgIGlmIEBpdGVtLnR5cGUgPT0gJ29iaidcbiAgICAgICAgICAgICAgICAgICAgICAgIEBicm93c2VyLmxvYWRPYmplY3RJdGVtIEBpdGVtLCBjb2x1bW46QGNvbHVtbi5pbmRleCsxXG4gICAgICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5wcmV2aWV3T2JqZWN0SXRlbSAgQGl0ZW0sIGNvbHVtbjpAY29sdW1uLmluZGV4KzJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIEBpdGVtLm9iaj8uZmlsZT8gYW5kIF8uaXNTdHJpbmcgQGl0ZW0ub2JqLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHQubGluZSA9IEBpdGVtLm9iai5saW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmNvbCAgPSBAaXRlbS5vYmouY29sdW1uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2xvZyAnanVtcFRvRmlsZT8nIG9wdFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgQGl0ZW0ub2JqPy5maWxlPyBhbmQgXy5pc1N0cmluZyBAaXRlbS5vYmouZmlsZVxuICAgICAgICAgICAgICAgICAgICBvcHQgPSBmaWxlOkBpdGVtLm9iai5maWxlLCBsaW5lOkBpdGVtLm9iai5saW5lLCBjb2w6QGl0ZW0ub2JqLmNvbHVtbiwgbmV3VGFiOm9wdC5uZXdUYWJcbiAgICAgICAgICAgICAgICAgICAga2xvZyAnanVtcFRvRmlsZT8nIG9wdFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW5zRnJvbSBAY29sdW1uLmluZGV4KzFcbiAgICAgICAgQFxuICAgIFxuICAgIGlzQWN0aXZlOiAtPiBAZGl2LmNsYXNzTGlzdC5jb250YWlucyAnYWN0aXZlJ1xuICAgIFxuICAgIHNldEFjdGl2ZTogKG9wdCA9IHt9KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNvbHVtbi5hY3RpdmVSb3coKT8uY2xlYXJBY3RpdmUoKVxuICAgICAgICBAZGl2LmNsYXNzTGlzdC5hZGQgJ2FjdGl2ZSdcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdD8uc2Nyb2xsICE9IGZhbHNlXG4gICAgICAgICAgICBAY29sdW1uLnNjcm9sbC50b0luZGV4IEBpbmRleCgpXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0Py5lbWl0IFxuICAgICAgICAgICAgQGJyb3dzZXIuZW1pdCAnaXRlbUFjdGl2YXRlZCcgQGl0ZW1cbiAgICAgICAgICAgIGlmIEBpdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ3NldENXRCcgQGl0ZW0uZmlsZVxuICAgICAgICAgICAgZWxzZSBpZiBAaXRlbS50eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnc2V0Q1dEJyBzbGFzaC5kaXIgQGl0ZW0uZmlsZVxuICAgICAgICBAXG4gICAgICAgICAgICAgICAgXG4gICAgY2xlYXJBY3RpdmU6IC0+XG4gICAgICAgIEBkaXYuY2xhc3NMaXN0LnJlbW92ZSAnYWN0aXZlJ1xuICAgICAgICBAXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAgICAgICAgIFxuICAgIGVkaXROYW1lOiA9PlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIEBpbnB1dD8gXG4gICAgICAgIEBpbnB1dCA9IGVsZW0gJ2lucHV0JyBjbGFzczoncm93TmFtZUlucHV0J1xuICAgICAgICBAaW5wdXQudmFsdWUgPSBzbGFzaC5maWxlIEBpdGVtLmZpbGVcbiAgICAgICAgXG4gICAgICAgIEBkaXYuYXBwZW5kQ2hpbGQgQGlucHV0XG4gICAgICAgIEBpbnB1dC5hZGRFdmVudExpc3RlbmVyICdjaGFuZ2UnICAgQG9uTmFtZUNoYW5nZVxuICAgICAgICBAaW5wdXQuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgIEBvbk5hbWVLZXlEb3duXG4gICAgICAgIEBpbnB1dC5hZGRFdmVudExpc3RlbmVyICdmb2N1c291dCcgQG9uTmFtZUZvY3VzT3V0XG4gICAgICAgIEBpbnB1dC5mb2N1cygpXG4gICAgICAgIFxuICAgICAgICBAaW5wdXQuc2V0U2VsZWN0aW9uUmFuZ2UgMCwgc2xhc2guYmFzZShAaXRlbS5maWxlKS5sZW5ndGhcblxuICAgIG9uTmFtZUtleURvd246IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIHttb2QsIGtleSwgY29tYm99ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJyAnZXNjJ1xuICAgICAgICAgICAgICAgIGlmIEBpbnB1dC52YWx1ZSA9PSBAZmlsZSBvciBjb21ibyAhPSAnZW50ZXInXG4gICAgICAgICAgICAgICAgICAgIEBpbnB1dC52YWx1ZSA9IEBmaWxlXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgQG9uTmFtZUZvY3VzT3V0KClcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgXG4gICAgcmVtb3ZlSW5wdXQ6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBpbnB1dD9cbiAgICAgICAgQGlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2ZvY3Vzb3V0JyBAb25OYW1lRm9jdXNPdXRcbiAgICAgICAgQGlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NoYW5nZScgICBAb25OYW1lQ2hhbmdlXG4gICAgICAgIEBpbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyICdrZXlkb3duJyAgQG9uTmFtZUtleURvd25cbiAgICAgICAgQGlucHV0LnJlbW92ZSgpXG4gICAgICAgIGRlbGV0ZSBAaW5wdXRcbiAgICAgICAgQGlucHV0ID0gbnVsbFxuICAgICAgICBpZiBub3QgZG9jdW1lbnQuYWN0aXZlRWxlbWVudD8gb3IgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PSBkb2N1bWVudC5ib2R5XG4gICAgICAgICAgICBAY29sdW1uLmZvY3VzIGFjdGl2YXRlOmZhbHNlXG4gICAgXG4gICAgb25OYW1lRm9jdXNPdXQ6IChldmVudCkgPT4gQHJlbW92ZUlucHV0KClcbiAgICBcbiAgICBvbk5hbWVDaGFuZ2U6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIHRyaW1tZWQgPSBAaW5wdXQudmFsdWUudHJpbSgpXG4gICAgICAgIGlmIHRyaW1tZWQubGVuZ3RoXG4gICAgICAgICAgICBuZXdGaWxlID0gc2xhc2guam9pbiBzbGFzaC5kaXIoQGl0ZW0uZmlsZSksIHRyaW1tZWRcbiAgICAgICAgICAgIHVudXNlZEZpbGVuYW1lID0gcmVxdWlyZSAndW51c2VkLWZpbGVuYW1lJ1xuICAgICAgICAgICAgdW51c2VkRmlsZW5hbWUobmV3RmlsZSkudGhlbiAobmV3RmlsZSkgPT5cbiAgICAgICAgICAgICAgICBmcy5yZW5hbWUgQGl0ZW0uZmlsZSwgbmV3RmlsZSwgKGVycikgPT5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAncmVuYW1lIGZhaWxlZCcgZXJyIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBuZXdGaWxlXG4gICAgICAgIEByZW1vdmVJbnB1dCgpXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgb25EcmFnU3RhcnQ6IChkLCBlKSA9PlxuXG4gICAgICAgIEBjb2x1bW4uZm9jdXMgYWN0aXZhdGU6ZmFsc2VcbiAgICAgICAgQHNldEFjdGl2ZSBzY3JvbGw6ZmFsc2VcblxuICAgIG9uRHJhZ01vdmU6IChkLGUpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQGNvbHVtbi5kcmFnRGl2XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBpZiBNYXRoLmFicyhkLmRlbHRhU3VtLngpIDwgMjAgYW5kIE1hdGguYWJzKGQuZGVsdGFTdW0ueSkgPCAxMFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYgPSBAZGl2LmNsb25lTm9kZSB0cnVlXG4gICAgICAgICAgICBiciA9IEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS50b3AgID0gXCIje2JyLnRvcH1weFwiXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUubGVmdCA9IFwiI3tici5sZWZ0fXB4XCJcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS53aWR0aCA9IFwiI3tici53aWR0aC0xMn1weFwiXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUuaGVpZ2h0ID0gXCIje2JyLmhlaWdodC0zfXB4XCJcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS5mbGV4ID0gJ3Vuc2V0J1xuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSdcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQgQGNvbHVtbi5kcmFnRGl2XG4gICAgICAgIFxuICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGVYKCN7ZC5kZWx0YVN1bS54fXB4KSB0cmFuc2xhdGVZKCN7ZC5kZWx0YVN1bS55fXB4KVwiXG5cbiAgICBvbkRyYWdTdG9wOiAoZCxlKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGNvbHVtbi5kcmFnRGl2P1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYucmVtb3ZlKClcbiAgICAgICAgICAgIGRlbGV0ZSBAY29sdW1uLmRyYWdEaXZcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgY29sdW1uID0gQGJyb3dzZXIuY29sdW1uQXRQb3MgZC5wb3NcbiAgICAgICAgICAgICAgICBjb2x1bW4uZHJvcFJvdz8gQCwgZC5wb3NcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFJvd1xuIl19
//# sourceURL=../coffee/row.coffee