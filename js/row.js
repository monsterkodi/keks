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
        if (slash.base(this.item.file).startsWith('.')) {
            className += ' dotfile';
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
        this.input.addEventListener('change', this);
        this.input.addEventListener('keydown', this.onNameKeyDown);
        this.input.addEventListener('focusout', this.onNameFocusOut);
        this.input.focus();
        return this.input.setSelectionRange(0, slash.base(this.item.file).length);
    };

    Row.prototype.onNameKeyDown = function(event) {
        var combo, key, mod, ref1;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo;
        switch (combo) {
            case 'esc':
                if (this.input.value !== slash.file(this.item.file)) {
                    this.input.value = slash.file(this.item.file);
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }
                this.onNameFocusOut();
                break;
            case 'enter':
                if (this.input.value !== slash.file(this.item.file)) {
                    this.onNameChange();
                } else {
                    this.removeInput();
                }
                stopEvent(event);
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
                        _this.item.file = newFile;
                        _this.div.innerHTML = File.span(_this.item.file);
                        _this.setIcon();
                        return _this.browser.loadFileItem(_this.item, _this.column.index + 1);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm93LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBOzs7Ozs7O0FBQUEsSUFBQSx1SEFBQTtJQUFBOztBQVFBLE1BQStGLE9BQUEsQ0FBUSxLQUFSLENBQS9GLEVBQUUsZUFBRixFQUFRLHFCQUFSLEVBQWlCLGVBQWpCLEVBQXVCLGlCQUF2QixFQUE4Qix5QkFBOUIsRUFBeUMsaUJBQXpDLEVBQWdELGlCQUFoRCxFQUF1RCxlQUF2RCxFQUE2RCxpQkFBN0QsRUFBb0UsZUFBcEUsRUFBMEUsbUJBQTFFLEVBQWtGLFdBQWxGLEVBQXNGLFNBQXRGLEVBQXlGOztBQUV6RixRQUFBLEdBQVksT0FBQSxDQUFRLFVBQVI7O0FBQ1osSUFBQSxHQUFZLE9BQUEsQ0FBUSxRQUFSOztBQUVaLEdBQUEsR0FBTSxRQUFRLENBQUMsTUFBTSxDQUFDOztBQUVoQjtJQUVXLGFBQUMsT0FBRCxFQUFVLElBQVY7QUFFVCxZQUFBO1FBRlUsSUFBQyxDQUFBLFNBQUQ7UUFBUyxJQUFDLENBQUEsT0FBRDs7Ozs7Ozs7O1FBRW5CLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQyxDQUFBLE1BQU0sQ0FBQztRQUNuQixJQUFBLDRDQUFvQixJQUFDLENBQUEsSUFBSSxDQUFDO1FBQzFCLElBQUcsS0FBQSxDQUFNLElBQU4sQ0FBQSxJQUFlLEtBQUEsQ0FBTSxJQUFJLENBQUMsSUFBTCxDQUFBLENBQU4sQ0FBbEI7WUFDSSxJQUFBLEdBQU8saUJBRFg7U0FBQSxNQUFBO1lBR0ksSUFBQSxHQUFPLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBVixFQUhYOztRQUlBLElBQUMsQ0FBQSxHQUFELEdBQU8sSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxZQUFOO1lBQW1CLElBQUEsRUFBSyxJQUF4QjtTQUFMO1FBQ1AsSUFBQyxDQUFBLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsSUFBSSxDQUFD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QVEsQ0FBQyxDQUF2RCxHQUF5RDtJQWpCbkY7O2tCQW1CWixVQUFBLEdBQVksU0FBQyxDQUFELEVBQUcsQ0FBSDtBQUVSLFlBQUE7UUFBQSxJQUFHLDJCQUFIO1lBRUksSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBaEIsQ0FBQTtZQUNBLE9BQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQztZQUVmLElBQUcsTUFBQSxHQUFTLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxDQUFxQixDQUFDLENBQUMsR0FBdkIsQ0FBWjs4REFDSSxNQUFNLENBQUMsUUFBUyxNQUFHLENBQUMsQ0FBQyxjQUR6QjthQUxKOztJQUZROzs7Ozs7QUFVaEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyJcbiMjI1xuMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMFxuIyMjXG5cbnsgZWxlbSwga2V5aW5mbywgZHJhZywgY2xhbXAsIHN0b3BFdmVudCwgdmFsaWQsIGVtcHR5LCBwb3N0LCBzbGFzaCwga2xvZywga2Vycm9yLCBmcywgJCwgXyB9ID0gcmVxdWlyZSAna3hrJyBcblxuZWxlY3Ryb24gID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5GaWxlICAgICAgPSByZXF1aXJlICcuL2ZpbGUnXG5cbmFwcCA9IGVsZWN0cm9uLnJlbW90ZS5hcHBcblxuY2xhc3MgUm93XG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAY29sdW1uLCBAaXRlbSkgLT5cblxuICAgICAgICBAYnJvd3NlciA9IEBjb2x1bW4uYnJvd3NlclxuICAgICAgICB0ZXh0ID0gQGl0ZW0udGV4dCA/IEBpdGVtLm5hbWVcbiAgICAgICAgaWYgZW1wdHkodGV4dCkgb3IgZW1wdHkgdGV4dC50cmltKClcbiAgICAgICAgICAgIGh0bWwgPSAnPHNwYW4+IDwvc3Bhbj4nXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGh0bWwgPSBGaWxlLnNwYW4gdGV4dFxuICAgICAgICBAZGl2ID0gZWxlbSBjbGFzczonYnJvd3NlclJvdycgaHRtbDpodG1sXG4gICAgICAgIEBkaXYuY2xhc3NMaXN0LmFkZCBAaXRlbS50eXBlXG4gICAgICAgIEBjb2x1bW4udGFibGUuYXBwZW5kQ2hpbGQgQGRpdlxuXG4gICAgICAgIGlmIEBpdGVtLnR5cGUgaW4gWydmaWxlJyAnZGlyJ10gb3IgQGl0ZW0uaWNvblxuICAgICAgICAgICAgQHNldEljb24oKVxuICAgICAgICBcbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQGRpdlxuICAgICAgICAgICAgb25TdGFydDogQG9uRHJhZ1N0YXJ0XG4gICAgICAgICAgICBvbk1vdmU6ICBAb25EcmFnTW92ZVxuICAgICAgICAgICAgb25TdG9wOiAgQG9uRHJhZ1N0b3BcbiAgICAgICAgICAgICAgIFxuICAgIG5leHQ6ICAgICAgICAtPiBAaW5kZXgoKSA8IEBjb2x1bW4ubnVtUm93cygpLTEgYW5kIEBjb2x1bW4ucm93c1tAaW5kZXgoKSsxXSBvciBudWxsXG4gICAgcHJldjogICAgICAgIC0+IEBpbmRleCgpID4gMCBhbmQgQGNvbHVtbi5yb3dzW0BpbmRleCgpLTFdIG9yIG51bGxcbiAgICBpbmRleDogICAgICAgLT4gQGNvbHVtbi5yb3dzLmluZGV4T2YgQCAgICBcbiAgICBvbk1vdXNlT3V0OiAgLT4gQGRpdi5jbGFzc0xpc3QucmVtb3ZlICdob3ZlcidcbiAgICBvbk1vdXNlT3ZlcjogLT4gQGRpdi5jbGFzc0xpc3QuYWRkICdob3ZlcidcblxuICAgIHBhdGg6IC0+IFxuICAgICAgICBpZiBAaXRlbS5maWxlPyBhbmQgXy5pc1N0cmluZyBAaXRlbS5maWxlXG4gICAgICAgICAgICByZXR1cm4gQGl0ZW0uZmlsZVxuICAgICAgICBpZiBAaXRlbS5vYmo/LmZpbGU/IGFuZCBfLmlzU3RyaW5nIEBpdGVtLm9iai5maWxlXG4gICAgICAgICAgICByZXR1cm4gQGl0ZW0ub2JqLmZpbGVcblxuICAgIHNldEljb246IC0+XG5cbiAgICAgICAgaWYgQGl0ZW0uaWNvblxuICAgICAgICAgICAgY2xhc3NOYW1lID0gQGl0ZW0uaWNvblxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBAaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gJ2ZvbGRlci1pY29uJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA9IEZpbGUuaWNvbkNsYXNzTmFtZSBAaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmJhc2UoQGl0ZW0uZmlsZSkuc3RhcnRzV2l0aCgnLicpXG4gICAgICAgICAgICBjbGFzc05hbWUgKz0gJyBkb3RmaWxlJ1xuICAgICAgICAgICAgXG4gICAgICAgIGljb24gPSBlbGVtKCdzcGFuJyBjbGFzczpjbGFzc05hbWUgKyAnIGJyb3dzZXJGaWxlSWNvbicpXG4gICAgICAgICAgICBcbiAgICAgICAgQGRpdi5maXJzdENoaWxkPy5pbnNlcnRCZWZvcmUgaWNvbiwgQGRpdi5maXJzdENoaWxkLmZpcnN0Q2hpbGRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBhY3RpdmF0ZTogKGV2ZW50KSA9PlxuXG4gICAgICAgIGlmIEBjb2x1bW4uaW5kZXggPCAwICMgc2hlbGYgaGFuZGxlcyByb3cgYWN0aXZhdGlvblxuICAgICAgICAgICAgQGNvbHVtbi5hY3RpdmF0ZVJvdyBAXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICQoJy5ob3ZlcicpPy5jbGFzc0xpc3QucmVtb3ZlICdob3ZlcidcbiAgICAgICAgXG4gICAgICAgIEBzZXRBY3RpdmUgZW1pdDp0cnVlXG4gICAgICAgIFxuICAgICAgICBvcHQgPSBmaWxlOkBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgc3dpdGNoIEBpdGVtLnR5cGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgd2hlbiAnZGlyJyAnZmlsZSdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2ZpbGVicm93c2VyJyAnYWN0aXZhdGVJdGVtJyBAaXRlbSwgQGNvbHVtbi5pbmRleFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZWxzZSAgICBcbiAgICAgICAgICAgICAgICBpZiBAaXRlbS5maWxlPyBhbmQgXy5pc1N0cmluZyhAaXRlbS5maWxlKSBhbmQgQGl0ZW0udHlwZSAhPSAnb2JqJ1xuICAgICAgICAgICAgICAgICAgICBvcHQubGluZSA9IEBpdGVtLmxpbmVcbiAgICAgICAgICAgICAgICAgICAgb3B0LmNvbCAgPSBAaXRlbS5jb2x1bW5cbiAgICAgICAgICAgICAgICAgICAga2xvZyAnanVtcFRvRmlsZT8nIG9wdFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgQGNvbHVtbi5wYXJlbnQub2JqPyBhbmQgQGNvbHVtbi5wYXJlbnQudHlwZSA9PSAnb2JqJ1xuICAgICAgICAgICAgICAgICAgICBpZiBAaXRlbS50eXBlID09ICdvYmonXG4gICAgICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5sb2FkT2JqZWN0SXRlbSBAaXRlbSwgY29sdW1uOkBjb2x1bW4uaW5kZXgrMVxuICAgICAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIucHJldmlld09iamVjdEl0ZW0gIEBpdGVtLCBjb2x1bW46QGNvbHVtbi5pbmRleCsyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAaXRlbS5vYmo/LmZpbGU/IGFuZCBfLmlzU3RyaW5nIEBpdGVtLm9iai5maWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmxpbmUgPSBAaXRlbS5vYmoubGluZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdC5jb2wgID0gQGl0ZW0ub2JqLmNvbHVtblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtsb2cgJ2p1bXBUb0ZpbGU/JyBvcHRcbiAgICAgICAgICAgICAgICBlbHNlIGlmIEBpdGVtLm9iaj8uZmlsZT8gYW5kIF8uaXNTdHJpbmcgQGl0ZW0ub2JqLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgb3B0ID0gZmlsZTpAaXRlbS5vYmouZmlsZSwgbGluZTpAaXRlbS5vYmoubGluZSwgY29sOkBpdGVtLm9iai5jb2x1bW4sIG5ld1RhYjpvcHQubmV3VGFiXG4gICAgICAgICAgICAgICAgICAgIGtsb2cgJ2p1bXBUb0ZpbGU/JyBvcHRcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBicm93c2VyLmNsZWFyQ29sdW1uc0Zyb20gQGNvbHVtbi5pbmRleCsxXG4gICAgICAgIEBcbiAgICBcbiAgICBpc0FjdGl2ZTogLT4gQGRpdi5jbGFzc0xpc3QuY29udGFpbnMgJ2FjdGl2ZSdcbiAgICBcbiAgICBzZXRBY3RpdmU6IChvcHQgPSB7fSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjb2x1bW4uYWN0aXZlUm93KCk/LmNsZWFyQWN0aXZlKClcbiAgICAgICAgQGRpdi5jbGFzc0xpc3QuYWRkICdhY3RpdmUnXG4gICAgICAgIFxuICAgICAgICBpZiBvcHQ/LnNjcm9sbCAhPSBmYWxzZVxuICAgICAgICAgICAgQGNvbHVtbi5zY3JvbGwudG9JbmRleCBAaW5kZXgoKVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG9wdD8uZW1pdCBcbiAgICAgICAgICAgIEBicm93c2VyLmVtaXQgJ2l0ZW1BY3RpdmF0ZWQnIEBpdGVtXG4gICAgICAgICAgICBpZiBAaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdzZXRDV0QnIEBpdGVtLmZpbGVcbiAgICAgICAgICAgIGVsc2UgaWYgQGl0ZW0udHlwZSA9PSAnZmlsZSdcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ3NldENXRCcgc2xhc2guZGlyIEBpdGVtLmZpbGVcbiAgICAgICAgQFxuICAgICAgICAgICAgICAgIFxuICAgIGNsZWFyQWN0aXZlOiAtPlxuICAgICAgICBAZGl2LmNsYXNzTGlzdC5yZW1vdmUgJ2FjdGl2ZSdcbiAgICAgICAgQFxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgICAgICAgICBcbiAgICBlZGl0TmFtZTogPT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAaW5wdXQ/IFxuICAgICAgICBAaW5wdXQgPSBlbGVtICdpbnB1dCcgY2xhc3M6J3Jvd05hbWVJbnB1dCdcbiAgICAgICAgQGlucHV0LnZhbHVlID0gc2xhc2guZmlsZSBAaXRlbS5maWxlXG4gICAgICAgIFxuICAgICAgICBAZGl2LmFwcGVuZENoaWxkIEBpbnB1dFxuICAgICAgICBAaW5wdXQuYWRkRXZlbnRMaXN0ZW5lciAnY2hhbmdlJyAgIEBcbiAgICAgICAgXG4gICAgICAgIEBpbnB1dC5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJyAgQG9uTmFtZUtleURvd25cbiAgICAgICAgQGlucHV0LmFkZEV2ZW50TGlzdGVuZXIgJ2ZvY3Vzb3V0JyBAb25OYW1lRm9jdXNPdXRcbiAgICAgICAgQGlucHV0LmZvY3VzKClcbiAgICAgICAgXG4gICAgICAgIEBpbnB1dC5zZXRTZWxlY3Rpb25SYW5nZSAwLCBzbGFzaC5iYXNlKEBpdGVtLmZpbGUpLmxlbmd0aFxuXG4gICAgb25OYW1lS2V5RG93bjogKGV2ZW50KSA9PlxuICAgICAgICB7bW9kLCBrZXksIGNvbWJvfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcblxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2VzYydcbiAgICAgICAgICAgICAgICBpZiBAaW5wdXQudmFsdWUgIT0gc2xhc2guZmlsZSBAaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIEBpbnB1dC52YWx1ZSA9IHNsYXNoLmZpbGUgQGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgQG9uTmFtZUZvY3VzT3V0KClcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJ1xuICAgICAgICAgICAgICAgIGlmIEBpbnB1dC52YWx1ZSAhPSBzbGFzaC5maWxlIEBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgQG9uTmFtZUNoYW5nZSgpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAcmVtb3ZlSW5wdXQoKVxuICAgICAgICAgICAgICAgIHN0b3BFdmVudCBldmVudFxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBcbiAgICByZW1vdmVJbnB1dDogLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBpbnB1dD9cbiAgICAgICAgQGlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2ZvY3Vzb3V0JyBAb25OYW1lRm9jdXNPdXRcbiAgICAgICAgQGlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NoYW5nZScgICBAb25OYW1lQ2hhbmdlXG4gICAgICAgIEBpbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyICdrZXlkb3duJyAgQG9uTmFtZUtleURvd25cbiAgICAgICAgQGlucHV0LnJlbW92ZSgpXG4gICAgICAgIGRlbGV0ZSBAaW5wdXRcbiAgICAgICAgQGlucHV0ID0gbnVsbFxuICAgICAgICBpZiBub3QgZG9jdW1lbnQuYWN0aXZlRWxlbWVudD8gb3IgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PSBkb2N1bWVudC5ib2R5XG4gICAgICAgICAgICBAY29sdW1uLmZvY3VzIGFjdGl2YXRlOmZhbHNlXG4gICAgXG4gICAgb25OYW1lRm9jdXNPdXQ6IChldmVudCkgPT4gQHJlbW92ZUlucHV0KClcbiAgICBcbiAgICBvbk5hbWVDaGFuZ2U6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIHRyaW1tZWQgPSBAaW5wdXQudmFsdWUudHJpbSgpXG4gICAgICAgIGlmIHRyaW1tZWQubGVuZ3RoXG5cbiAgICAgICAgICAgIG5ld0ZpbGUgPSBzbGFzaC5qb2luIHNsYXNoLmRpcihAaXRlbS5maWxlKSwgdHJpbW1lZFxuICAgICAgICAgICAgdW51c2VkRmlsZW5hbWUgPSByZXF1aXJlICd1bnVzZWQtZmlsZW5hbWUnXG4gICAgICAgICAgICB1bnVzZWRGaWxlbmFtZShuZXdGaWxlKS50aGVuIChuZXdGaWxlKSA9PlxuICAgICAgICAgICAgICAgIGZzLnJlbmFtZSBAaXRlbS5maWxlLCBuZXdGaWxlLCAoZXJyKSA9PlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yICdyZW5hbWUgZmFpbGVkJyBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgICAgIEBpdGVtLmZpbGUgPSBuZXdGaWxlXG4gICAgICAgICAgICAgICAgICAgIEBkaXYuaW5uZXJIVE1MID0gRmlsZS5zcGFuIEBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgQHNldEljb24oKVxuICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5sb2FkRmlsZUl0ZW0gQGl0ZW0sIEBjb2x1bW4uaW5kZXgrMVxuICAgICAgICBAcmVtb3ZlSW5wdXQoKVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIG9uRHJhZ1N0YXJ0OiAoZCwgZSkgPT5cblxuICAgICAgICBAY29sdW1uLmZvY3VzIGFjdGl2YXRlOmZhbHNlXG4gICAgICAgIEBzZXRBY3RpdmUgc2Nyb2xsOmZhbHNlXG5cbiAgICBvbkRyYWdNb3ZlOiAoZCxlKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEBjb2x1bW4uZHJhZ0RpdlxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gaWYgTWF0aC5hYnMoZC5kZWx0YVN1bS54KSA8IDIwIGFuZCBNYXRoLmFicyhkLmRlbHRhU3VtLnkpIDwgMTBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2ID0gQGRpdi5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICAgICAgYnIgPSBAZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUudG9wICA9IFwiI3tici50b3B9cHhcIlxuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnN0eWxlLmxlZnQgPSBcIiN7YnIubGVmdH1weFwiXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUud2lkdGggPSBcIiN7YnIud2lkdGgtMTJ9cHhcIlxuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnN0eWxlLmhlaWdodCA9IFwiI3tici5oZWlnaHQtM31weFwiXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUuZmxleCA9ICd1bnNldCdcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkIEBjb2x1bW4uZHJhZ0RpdlxuICAgICAgICBcbiAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlWCgje2QuZGVsdGFTdW0ueH1weCkgdHJhbnNsYXRlWSgje2QuZGVsdGFTdW0ueX1weClcIlxuXG4gICAgb25EcmFnU3RvcDogKGQsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBjb2x1bW4uZHJhZ0Rpdj9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnJlbW92ZSgpXG4gICAgICAgICAgICBkZWxldGUgQGNvbHVtbi5kcmFnRGl2XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGNvbHVtbiA9IEBicm93c2VyLmNvbHVtbkF0UG9zIGQucG9zXG4gICAgICAgICAgICAgICAgY29sdW1uLmRyb3BSb3c/IEAsIGQucG9zXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBSb3dcbiJdfQ==
//# sourceURL=../coffee/row.coffee