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
            html = this.fileSpan(text);
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

    Row.prototype.fileSpan = function(text) {
        var base, clss, ext, span;
        base = slash.base(text);
        ext = slash.ext(text);
        clss = valid(ext) && ' ' + ext || '';
        span = ("<span class='text" + clss + "'>") + base + "</span>";
        if (valid(ext)) {
            span += ("<span class='ext punct" + clss + "'>.</span>") + ("<span class='ext text" + clss + "'>") + ext + "</span>";
        }
        return span;
    };

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm93LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx1SEFBQTtJQUFBOztBQVFBLE1BQStGLE9BQUEsQ0FBUSxLQUFSLENBQS9GLEVBQUUsZUFBRixFQUFRLHFCQUFSLEVBQWlCLGVBQWpCLEVBQXVCLGlCQUF2QixFQUE4Qix5QkFBOUIsRUFBeUMsaUJBQXpDLEVBQWdELGlCQUFoRCxFQUF1RCxlQUF2RCxFQUE2RCxpQkFBN0QsRUFBb0UsZUFBcEUsRUFBMEUsbUJBQTFFLEVBQWtGLFdBQWxGLEVBQXNGLFNBQXRGLEVBQXlGOztBQUV6RixRQUFBLEdBQVksT0FBQSxDQUFRLFVBQVI7O0FBQ1osSUFBQSxHQUFZLE9BQUEsQ0FBUSxRQUFSOztBQUVaLEdBQUEsR0FBTSxRQUFRLENBQUMsTUFBTSxDQUFDOztBQUVoQjtJQUVXLGFBQUMsT0FBRCxFQUFVLElBQVY7QUFFVCxZQUFBO1FBRlUsSUFBQyxDQUFBLFNBQUQ7UUFBUyxJQUFDLENBQUEsT0FBRDs7Ozs7Ozs7O1FBRW5CLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQyxDQUFBLE1BQU0sQ0FBQztRQUNuQixJQUFBLDRDQUFvQixJQUFDLENBQUEsSUFBSSxDQUFDO1FBQzFCLElBQUcsS0FBQSxDQUFNLElBQU4sQ0FBQSxJQUFlLEtBQUEsQ0FBTSxJQUFJLENBQUMsSUFBTCxDQUFBLENBQU4sQ0FBbEI7WUFDSSxJQUFBLEdBQU8saUJBRFg7U0FBQSxNQUFBO1lBR0ksSUFBQSxHQUFPLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixFQUhYOztRQUlBLElBQUMsQ0FBQSxHQUFELEdBQU8sSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxZQUFQO1lBQW9CLElBQUEsRUFBTSxJQUExQjtTQUFMO1FBQ1AsSUFBQyxDQUFBLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsSUFBSSxDQUFDLElBQXpCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBZCxDQUEwQixJQUFDLENBQUEsR0FBM0I7UUFFQSxJQUFHLFNBQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFOLEtBQWUsTUFBZixJQUFBLElBQUEsS0FBc0IsS0FBdEIsQ0FBQSxJQUFnQyxJQUFDLENBQUEsSUFBSSxDQUFDLElBQXpDO1lBQ0ksSUFBQyxDQUFBLE9BQUQsQ0FBQSxFQURKOztRQUdBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBSSxJQUFKLENBQ0o7WUFBQSxNQUFBLEVBQVMsSUFBQyxDQUFBLEdBQVY7WUFDQSxPQUFBLEVBQVMsSUFBQyxDQUFBLFdBRFY7WUFFQSxNQUFBLEVBQVMsSUFBQyxDQUFBLFVBRlY7WUFHQSxNQUFBLEVBQVMsSUFBQyxDQUFBLFVBSFY7U0FESTtJQWZDOztrQkEyQmIsUUFBQSxHQUFVLFNBQUMsSUFBRDtBQUNOLFlBQUE7UUFBQSxJQUFBLEdBQU8sS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYO1FBQ1AsR0FBQSxHQUFPLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVjtRQUNQLElBQUEsR0FBTyxLQUFBLENBQU0sR0FBTixDQUFBLElBQWUsR0FBQSxHQUFJLEdBQW5CLElBQTBCO1FBQ2pDLElBQUEsR0FBTyxDQUFBLG1CQUFBLEdBQW9CLElBQXBCLEdBQXlCLElBQXpCLENBQUEsR0FBNkIsSUFBN0IsR0FBa0M7UUFDekMsSUFBRyxLQUFBLENBQU0sR0FBTixDQUFIO1lBQ0ksSUFBQSxJQUFRLENBQUEsd0JBQUEsR0FBeUIsSUFBekIsR0FBOEIsWUFBOUIsQ0FBQSxHQUE0QyxDQUFBLHVCQUFBLEdBQXdCLElBQXhCLEdBQTZCLElBQTdCLENBQTVDLEdBQTZFLEdBQTdFLEdBQWlGLFVBRDdGOztlQUVBO0lBUE07O2tCQVNWLElBQUEsR0FBYSxTQUFBO2VBQUcsSUFBQyxDQUFBLEtBQUQsQ0FBQSxDQUFBLEdBQVcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFSLENBQUEsQ0FBQSxHQUFrQixDQUE3QixJQUFtQyxJQUFDLENBQUEsTUFBTSxDQUFDLElBQUssQ0FBQSxJQUFDLENBQUEsS0FBRCxDQUFBLENBQUEsR0FBUyxDQUFULENBQWhELElBQStEO0lBQWxFOztrQkFDYixJQUFBLEdBQWEsU0FBQTtlQUFHLElBQUMsQ0FBQSxLQUFELENBQUEsQ0FBQSxHQUFXLENBQVgsSUFBaUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFLLENBQUEsSUFBQyxDQUFBLEtBQUQsQ0FBQSxDQUFBLEdBQVMsQ0FBVCxDQUE5QixJQUE2QztJQUFoRDs7a0JBQ2IsS0FBQSxHQUFhLFNBQUE7ZUFBRyxJQUFDLENBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFiLENBQXFCLElBQXJCO0lBQUg7O2tCQUNiLFVBQUEsR0FBYSxTQUFBO2VBQUcsSUFBQyxDQUFBLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBZixDQUFzQixPQUF0QjtJQUFIOztrQkFDYixXQUFBLEdBQWEsU0FBQTtlQUFHLElBQUMsQ0FBQSxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQWYsQ0FBbUIsT0FBbkI7SUFBSDs7a0JBRWIsSUFBQSxHQUFNLFNBQUE7QUFDRixZQUFBO1FBQUEsSUFBRyx3QkFBQSxJQUFnQixDQUFDLENBQUMsUUFBRixDQUFXLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBakIsQ0FBbkI7QUFDSSxtQkFBTyxJQUFDLENBQUEsSUFBSSxDQUFDLEtBRGpCOztRQUVBLElBQUcsK0RBQUEsSUFBcUIsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxJQUFDLENBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFyQixDQUF4QjtBQUNJLG1CQUFPLElBQUMsQ0FBQSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBRHJCOztJQUhFOztrQkFNTixPQUFBLEdBQVMsU0FBQTtBQUVMLFlBQUE7UUFBQSxJQUFHLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBVDtZQUNJLFNBQUEsR0FBWSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBRHRCO1NBQUEsTUFBQTtZQUdJLElBQUcsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLEtBQWMsS0FBakI7Z0JBQ0ksU0FBQSxHQUFZLGNBRGhCO2FBQUEsTUFBQTtnQkFHSSxTQUFBLEdBQVksSUFBSSxDQUFDLGFBQUwsQ0FBbUIsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUF6QixFQUhoQjthQUhKOztRQVFBLElBQUEsR0FBTyxJQUFBLENBQUssTUFBTCxFQUFZO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxTQUFBLEdBQVksa0JBQWxCO1NBQVo7MERBRVEsQ0FBRSxZQUFqQixDQUE4QixJQUE5QixFQUFvQyxJQUFDLENBQUEsR0FBRyxDQUFDLFVBQVUsQ0FBQyxVQUFwRDtJQVpLOztrQkFvQlQsUUFBQSxHQUFVLFNBQUMsS0FBRDtBQUVOLFlBQUE7UUFBQSxJQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixHQUFnQixDQUFuQjtZQUNJLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBUixDQUFvQixJQUFwQjtBQUNBLG1CQUZKOzs7Z0JBSVcsQ0FBRSxTQUFTLENBQUMsTUFBdkIsQ0FBOEIsT0FBOUI7O1FBRUEsSUFBQyxDQUFBLFNBQUQsQ0FBVztZQUFBLElBQUEsRUFBSyxJQUFMO1NBQVg7UUFFQSxHQUFBLEdBQU07WUFBQSxJQUFBLEVBQUssSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFYOztBQUVOLGdCQUFPLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBYjtBQUFBLGlCQUVTLEtBRlQ7QUFBQSxpQkFFZSxNQUZmO2dCQUlRLElBQUksQ0FBQyxJQUFMLENBQVUsYUFBVixFQUF3QixjQUF4QixFQUF1QyxJQUFDLENBQUEsSUFBeEMsRUFBOEMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUF0RDtBQUZPO0FBRmY7Z0JBT1EsSUFBRyx3QkFBQSxJQUFnQixDQUFDLENBQUMsUUFBRixDQUFXLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBakIsQ0FBaEIsSUFBMkMsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLEtBQWMsS0FBNUQ7b0JBQ0ksR0FBRyxDQUFDLElBQUosR0FBVyxJQUFDLENBQUEsSUFBSSxDQUFDO29CQUNqQixHQUFHLENBQUMsR0FBSixHQUFXLElBQUMsQ0FBQSxJQUFJLENBQUM7b0JBQ2pCLElBQUEsQ0FBSyxhQUFMLEVBQW1CLEdBQW5CLEVBSEo7aUJBQUEsTUFJSyxJQUFHLGdDQUFBLElBQXdCLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQWYsS0FBdUIsS0FBbEQ7b0JBQ0QsSUFBRyxJQUFDLENBQUEsSUFBSSxDQUFDLElBQU4sS0FBYyxLQUFqQjt3QkFDSSxJQUFDLENBQUEsT0FBTyxDQUFDLGNBQVQsQ0FBd0IsSUFBQyxDQUFBLElBQXpCLEVBQStCOzRCQUFBLE1BQUEsRUFBTyxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsR0FBYyxDQUFyQjt5QkFBL0I7d0JBQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxpQkFBVCxDQUE0QixJQUFDLENBQUEsSUFBN0IsRUFBbUM7NEJBQUEsTUFBQSxFQUFPLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixHQUFjLENBQXJCO3lCQUFuQzt3QkFDQSxJQUFHLCtEQUFBLElBQXFCLENBQUMsQ0FBQyxRQUFGLENBQVcsSUFBQyxDQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBckIsQ0FBeEI7NEJBQ0ksR0FBRyxDQUFDLElBQUosR0FBVyxJQUFDLENBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQzs0QkFDckIsR0FBRyxDQUFDLEdBQUosR0FBVyxJQUFDLENBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQzs0QkFDckIsSUFBQSxDQUFLLGFBQUwsRUFBbUIsR0FBbkIsRUFISjt5QkFISjtxQkFEQztpQkFBQSxNQVFBLElBQUcsK0RBQUEsSUFBcUIsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxJQUFDLENBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFyQixDQUF4QjtvQkFDRCxHQUFBLEdBQU07d0JBQUEsSUFBQSxFQUFLLElBQUMsQ0FBQSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQWY7d0JBQXFCLElBQUEsRUFBSyxJQUFDLENBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFwQzt3QkFBMEMsR0FBQSxFQUFJLElBQUMsQ0FBQSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQXhEO3dCQUFnRSxNQUFBLEVBQU8sR0FBRyxDQUFDLE1BQTNFOztvQkFDTixJQUFBLENBQUssYUFBTCxFQUFtQixHQUFuQixFQUZDO2lCQUFBLE1BQUE7b0JBSUQsSUFBQyxDQUFBLE9BQU8sQ0FBQyxnQkFBVCxDQUEwQixJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsR0FBYyxDQUF4QyxFQUpDOztBQW5CYjtlQXdCQTtJQXBDTTs7a0JBc0NWLFFBQUEsR0FBVSxTQUFBO2VBQUcsSUFBQyxDQUFBLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBZixDQUF3QixRQUF4QjtJQUFIOztrQkFFVixTQUFBLEdBQVcsU0FBQyxHQUFEO0FBRVAsWUFBQTs7WUFGUSxNQUFNOzs7Z0JBRUssQ0FBRSxXQUFyQixDQUFBOztRQUNBLElBQUMsQ0FBQSxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQWYsQ0FBbUIsUUFBbkI7UUFFQSxtQkFBRyxHQUFHLENBQUUsZ0JBQUwsS0FBZSxLQUFsQjtZQUNJLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQWYsQ0FBdUIsSUFBQyxDQUFBLEtBQUQsQ0FBQSxDQUF2QixFQURKOztRQUdBLGtCQUFHLEdBQUcsQ0FBRSxhQUFSO1lBQ0ksSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsZUFBZCxFQUE4QixJQUFDLENBQUEsSUFBL0I7WUFDQSxJQUFHLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBTixLQUFjLEtBQWpCO2dCQUNJLElBQUksQ0FBQyxJQUFMLENBQVUsUUFBVixFQUFtQixJQUFDLENBQUEsSUFBSSxDQUFDLElBQXpCLEVBREo7YUFBQSxNQUVLLElBQUcsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLEtBQWMsTUFBakI7Z0JBQ0QsSUFBSSxDQUFDLElBQUwsQ0FBVSxRQUFWLEVBQW1CLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFoQixDQUFuQixFQURDO2FBSlQ7O2VBTUE7SUFkTzs7a0JBZ0JYLFdBQUEsR0FBYSxTQUFBO1FBQ1QsSUFBQyxDQUFBLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBZixDQUFzQixRQUF0QjtlQUNBO0lBRlM7O2tCQVViLFFBQUEsR0FBVSxTQUFBO1FBRU4sSUFBVSxrQkFBVjtBQUFBLG1CQUFBOztRQUNBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBQSxDQUFLLE9BQUwsRUFBYTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sY0FBTjtTQUFiO1FBQ1QsSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFQLEdBQWUsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsSUFBSSxDQUFDLElBQWpCO1FBRWYsSUFBQyxDQUFBLEdBQUcsQ0FBQyxXQUFMLENBQWlCLElBQUMsQ0FBQSxLQUFsQjtRQUNBLElBQUMsQ0FBQSxLQUFLLENBQUMsZ0JBQVAsQ0FBd0IsUUFBeEIsRUFBbUMsSUFBQyxDQUFBLFlBQXBDO1FBQ0EsSUFBQyxDQUFBLEtBQUssQ0FBQyxnQkFBUCxDQUF3QixTQUF4QixFQUFtQyxJQUFDLENBQUEsYUFBcEM7UUFDQSxJQUFDLENBQUEsS0FBSyxDQUFDLGdCQUFQLENBQXdCLFVBQXhCLEVBQW1DLElBQUMsQ0FBQSxjQUFwQztRQUNBLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBUCxDQUFBO2VBRUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxpQkFBUCxDQUF5QixDQUF6QixFQUE0QixLQUFLLENBQUMsSUFBTixDQUFXLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBakIsQ0FBc0IsQ0FBQyxNQUFuRDtJQVpNOztrQkFjVixhQUFBLEdBQWUsU0FBQyxLQUFEO0FBRVgsWUFBQTtRQUFBLE9BQW9CLE9BQU8sQ0FBQyxRQUFSLENBQWlCLEtBQWpCLENBQXBCLEVBQUMsY0FBRCxFQUFNLGNBQU4sRUFBVztBQUNYLGdCQUFPLEtBQVA7QUFBQSxpQkFDUyxPQURUO0FBQUEsaUJBQ2lCLEtBRGpCO2dCQUVRLElBQUcsSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFQLEtBQWdCLElBQUMsQ0FBQSxJQUFqQixJQUF5QixLQUFBLEtBQVMsT0FBckM7b0JBQ0ksSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFQLEdBQWUsSUFBQyxDQUFBO29CQUNoQixLQUFLLENBQUMsY0FBTixDQUFBO29CQUNBLEtBQUssQ0FBQyx3QkFBTixDQUFBO29CQUNBLElBQUMsQ0FBQSxjQUFELENBQUEsRUFKSjs7QUFGUjtlQU9BLEtBQUssQ0FBQyxlQUFOLENBQUE7SUFWVzs7a0JBWWYsV0FBQSxHQUFhLFNBQUE7UUFFVCxJQUFjLGtCQUFkO0FBQUEsbUJBQUE7O1FBQ0EsSUFBQyxDQUFBLEtBQUssQ0FBQyxtQkFBUCxDQUEyQixVQUEzQixFQUFzQyxJQUFDLENBQUEsY0FBdkM7UUFDQSxJQUFDLENBQUEsS0FBSyxDQUFDLG1CQUFQLENBQTJCLFFBQTNCLEVBQXNDLElBQUMsQ0FBQSxZQUF2QztRQUNBLElBQUMsQ0FBQSxLQUFLLENBQUMsbUJBQVAsQ0FBMkIsU0FBM0IsRUFBc0MsSUFBQyxDQUFBLGFBQXZDO1FBQ0EsSUFBQyxDQUFBLEtBQUssQ0FBQyxNQUFQLENBQUE7UUFDQSxPQUFPLElBQUMsQ0FBQTtRQUNSLElBQUMsQ0FBQSxLQUFELEdBQVM7UUFDVCxJQUFPLGdDQUFKLElBQStCLFFBQVEsQ0FBQyxhQUFULEtBQTBCLFFBQVEsQ0FBQyxJQUFyRTttQkFDSSxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBYztnQkFBQSxRQUFBLEVBQVMsS0FBVDthQUFkLEVBREo7O0lBVFM7O2tCQVliLGNBQUEsR0FBZ0IsU0FBQyxLQUFEO2VBQVcsSUFBQyxDQUFBLFdBQUQsQ0FBQTtJQUFYOztrQkFFaEIsWUFBQSxHQUFjLFNBQUMsS0FBRDtBQUVWLFlBQUE7UUFBQSxPQUFBLEdBQVUsSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBYixDQUFBO1FBQ1YsSUFBRyxPQUFPLENBQUMsTUFBWDtZQUNJLE9BQUEsR0FBVSxLQUFLLENBQUMsSUFBTixDQUFXLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFoQixDQUFYLEVBQWtDLE9BQWxDO1lBQ1YsY0FBQSxHQUFpQixPQUFBLENBQVEsaUJBQVI7WUFDakIsY0FBQSxDQUFlLE9BQWYsQ0FBdUIsQ0FBQyxJQUF4QixDQUE2QixDQUFBLFNBQUEsS0FBQTt1QkFBQSxTQUFDLE9BQUQ7MkJBQ3pCLEVBQUUsQ0FBQyxNQUFILENBQVUsS0FBQyxDQUFBLElBQUksQ0FBQyxJQUFoQixFQUFzQixPQUF0QixFQUErQixTQUFDLEdBQUQ7d0JBQzNCLElBQXFDLEdBQXJDO0FBQUEsbUNBQU8sTUFBQSxDQUFPLGVBQVAsRUFBdUIsR0FBdkIsRUFBUDs7K0JBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBVSxVQUFWLEVBQXFCLE9BQXJCO29CQUYyQixDQUEvQjtnQkFEeUI7WUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTdCLEVBSEo7O2VBT0EsSUFBQyxDQUFBLFdBQUQsQ0FBQTtJQVZVOztrQkFrQmQsV0FBQSxHQUFhLFNBQUMsQ0FBRCxFQUFJLENBQUo7UUFFVCxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBYztZQUFBLFFBQUEsRUFBUyxLQUFUO1NBQWQ7ZUFDQSxJQUFDLENBQUEsU0FBRCxDQUFXO1lBQUEsTUFBQSxFQUFPLEtBQVA7U0FBWDtJQUhTOztrQkFLYixVQUFBLEdBQVksU0FBQyxDQUFELEVBQUcsQ0FBSDtBQUVSLFlBQUE7UUFBQSxJQUFHLENBQUksSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFmO1lBRUksSUFBVSxJQUFJLENBQUMsR0FBTCxDQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBcEIsQ0FBQSxHQUF5QixFQUF6QixJQUFnQyxJQUFJLENBQUMsR0FBTCxDQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBcEIsQ0FBQSxHQUF5QixFQUFuRTtBQUFBLHVCQUFBOztZQUVBLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBUixHQUFrQixJQUFDLENBQUEsR0FBRyxDQUFDLFNBQUwsQ0FBZSxJQUFmO1lBQ2xCLEVBQUEsR0FBSyxJQUFDLENBQUEsR0FBRyxDQUFDLHFCQUFMLENBQUE7WUFDTCxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBdEIsR0FBaUM7WUFDakMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQXRCLEdBQWdDLEVBQUUsQ0FBQyxHQUFKLEdBQVE7WUFDdkMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQXRCLEdBQWdDLEVBQUUsQ0FBQyxJQUFKLEdBQVM7WUFDeEMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQXRCLEdBQWdDLENBQUMsRUFBRSxDQUFDLEtBQUgsR0FBUyxFQUFWLENBQUEsR0FBYTtZQUM3QyxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBdEIsR0FBaUMsQ0FBQyxFQUFFLENBQUMsTUFBSCxHQUFVLENBQVgsQ0FBQSxHQUFhO1lBQzlDLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUF0QixHQUE2QjtZQUM3QixJQUFDLENBQUEsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBdEIsR0FBc0M7WUFDdEMsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFkLENBQTBCLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBbEMsRUFiSjs7ZUFlQSxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBdEIsR0FBa0MsYUFBQSxHQUFjLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBekIsR0FBMkIsaUJBQTNCLEdBQTRDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBdkQsR0FBeUQ7SUFqQm5GOztrQkFtQlosVUFBQSxHQUFZLFNBQUMsQ0FBRCxFQUFHLENBQUg7QUFFUixZQUFBO1FBQUEsSUFBRywyQkFBSDtZQUVJLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQWhCLENBQUE7WUFDQSxPQUFPLElBQUMsQ0FBQSxNQUFNLENBQUM7WUFFZixJQUFHLE1BQUEsR0FBUyxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsQ0FBcUIsQ0FBQyxDQUFDLEdBQXZCLENBQVo7OERBQ0ksTUFBTSxDQUFDLFFBQVMsTUFBRyxDQUFDLENBQUMsY0FEekI7YUFMSjs7SUFGUTs7Ozs7O0FBVWhCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwXG4jIyNcblxueyBlbGVtLCBrZXlpbmZvLCBkcmFnLCBjbGFtcCwgc3RvcEV2ZW50LCB2YWxpZCwgZW1wdHksIHBvc3QsIHNsYXNoLCBrbG9nLCBrZXJyb3IsIGZzLCAkLCBfIH0gPSByZXF1aXJlICdreGsnIFxuXG5lbGVjdHJvbiAgPSByZXF1aXJlICdlbGVjdHJvbidcbkZpbGUgICAgICA9IHJlcXVpcmUgJy4vZmlsZSdcblxuYXBwID0gZWxlY3Ryb24ucmVtb3RlLmFwcFxuXG5jbGFzcyBSb3dcbiAgICBcbiAgICBjb25zdHJ1Y3RvcjogKEBjb2x1bW4sIEBpdGVtKSAtPlxuXG4gICAgICAgIEBicm93c2VyID0gQGNvbHVtbi5icm93c2VyXG4gICAgICAgIHRleHQgPSBAaXRlbS50ZXh0ID8gQGl0ZW0ubmFtZVxuICAgICAgICBpZiBlbXB0eSh0ZXh0KSBvciBlbXB0eSB0ZXh0LnRyaW0oKVxuICAgICAgICAgICAgaHRtbCA9ICc8c3Bhbj4gPC9zcGFuPidcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaHRtbCA9IEBmaWxlU3BhbiB0ZXh0XG4gICAgICAgIEBkaXYgPSBlbGVtIGNsYXNzOiAnYnJvd3NlclJvdycgaHRtbDogaHRtbFxuICAgICAgICBAZGl2LmNsYXNzTGlzdC5hZGQgQGl0ZW0udHlwZVxuICAgICAgICBAY29sdW1uLnRhYmxlLmFwcGVuZENoaWxkIEBkaXZcblxuICAgICAgICBpZiBAaXRlbS50eXBlIGluIFsnZmlsZScgJ2RpciddIG9yIEBpdGVtLmljb25cbiAgICAgICAgICAgIEBzZXRJY29uKClcbiAgICAgICAgXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBkaXZcbiAgICAgICAgICAgIG9uU3RhcnQ6IEBvbkRyYWdTdGFydFxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uRHJhZ01vdmVcbiAgICAgICAgICAgIG9uU3RvcDogIEBvbkRyYWdTdG9wXG4gICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBmaWxlU3BhbjogKHRleHQpIC0+XG4gICAgICAgIGJhc2UgPSBzbGFzaC5iYXNlIHRleHRcbiAgICAgICAgZXh0ICA9IHNsYXNoLmV4dCB0ZXh0XG4gICAgICAgIGNsc3MgPSB2YWxpZChleHQpIGFuZCAnICcrZXh0IG9yICcnXG4gICAgICAgIHNwYW4gPSBcIjxzcGFuIGNsYXNzPSd0ZXh0I3tjbHNzfSc+XCIrYmFzZStcIjwvc3Bhbj5cIlxuICAgICAgICBpZiB2YWxpZCBleHRcbiAgICAgICAgICAgIHNwYW4gKz0gXCI8c3BhbiBjbGFzcz0nZXh0IHB1bmN0I3tjbHNzfSc+Ljwvc3Bhbj5cIiArIFwiPHNwYW4gY2xhc3M9J2V4dCB0ZXh0I3tjbHNzfSc+XCIrZXh0K1wiPC9zcGFuPlwiXG4gICAgICAgIHNwYW5cbiAgICAgICAgICAgIFxuICAgIG5leHQ6ICAgICAgICAtPiBAaW5kZXgoKSA8IEBjb2x1bW4ubnVtUm93cygpLTEgYW5kIEBjb2x1bW4ucm93c1tAaW5kZXgoKSsxXSBvciBudWxsXG4gICAgcHJldjogICAgICAgIC0+IEBpbmRleCgpID4gMCBhbmQgQGNvbHVtbi5yb3dzW0BpbmRleCgpLTFdIG9yIG51bGxcbiAgICBpbmRleDogICAgICAgLT4gQGNvbHVtbi5yb3dzLmluZGV4T2YgQCAgICBcbiAgICBvbk1vdXNlT3V0OiAgLT4gQGRpdi5jbGFzc0xpc3QucmVtb3ZlICdob3ZlcidcbiAgICBvbk1vdXNlT3ZlcjogLT4gQGRpdi5jbGFzc0xpc3QuYWRkICdob3ZlcidcblxuICAgIHBhdGg6IC0+IFxuICAgICAgICBpZiBAaXRlbS5maWxlPyBhbmQgXy5pc1N0cmluZyBAaXRlbS5maWxlXG4gICAgICAgICAgICByZXR1cm4gQGl0ZW0uZmlsZVxuICAgICAgICBpZiBAaXRlbS5vYmo/LmZpbGU/IGFuZCBfLmlzU3RyaW5nIEBpdGVtLm9iai5maWxlXG4gICAgICAgICAgICByZXR1cm4gQGl0ZW0ub2JqLmZpbGVcblxuICAgIHNldEljb246IC0+XG5cbiAgICAgICAgaWYgQGl0ZW0uaWNvblxuICAgICAgICAgICAgY2xhc3NOYW1lID0gQGl0ZW0uaWNvblxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBAaXRlbS50eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gJ2ZvbGRlci1pY29uJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA9IEZpbGUuaWNvbkNsYXNzTmFtZSBAaXRlbS5maWxlXG4gICAgICAgICAgICBcbiAgICAgICAgaWNvbiA9IGVsZW0oJ3NwYW4nIGNsYXNzOmNsYXNzTmFtZSArICcgYnJvd3NlckZpbGVJY29uJylcbiAgICAgICAgICAgIFxuICAgICAgICBAZGl2LmZpcnN0Q2hpbGQ/Lmluc2VydEJlZm9yZSBpY29uLCBAZGl2LmZpcnN0Q2hpbGQuZmlyc3RDaGlsZFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGFjdGl2YXRlOiAoZXZlbnQpID0+XG5cbiAgICAgICAgaWYgQGNvbHVtbi5pbmRleCA8IDAgIyBzaGVsZiBoYW5kbGVzIHJvdyBhY3RpdmF0aW9uXG4gICAgICAgICAgICBAY29sdW1uLmFjdGl2YXRlUm93IEBcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgJCgnLmhvdmVyJyk/LmNsYXNzTGlzdC5yZW1vdmUgJ2hvdmVyJ1xuICAgICAgICBcbiAgICAgICAgQHNldEFjdGl2ZSBlbWl0OnRydWVcbiAgICAgICAgXG4gICAgICAgIG9wdCA9IGZpbGU6QGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBzd2l0Y2ggQGl0ZW0udHlwZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdkaXInICdmaWxlJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZmlsZWJyb3dzZXInICdhY3RpdmF0ZUl0ZW0nIEBpdGVtLCBAY29sdW1uLmluZGV4XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBlbHNlICAgIFxuICAgICAgICAgICAgICAgIGlmIEBpdGVtLmZpbGU/IGFuZCBfLmlzU3RyaW5nKEBpdGVtLmZpbGUpIGFuZCBAaXRlbS50eXBlICE9ICdvYmonXG4gICAgICAgICAgICAgICAgICAgIG9wdC5saW5lID0gQGl0ZW0ubGluZVxuICAgICAgICAgICAgICAgICAgICBvcHQuY29sICA9IEBpdGVtLmNvbHVtblxuICAgICAgICAgICAgICAgICAgICBrbG9nICdqdW1wVG9GaWxlPycgb3B0XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAY29sdW1uLnBhcmVudC5vYmo/IGFuZCBAY29sdW1uLnBhcmVudC50eXBlID09ICdvYmonXG4gICAgICAgICAgICAgICAgICAgIGlmIEBpdGVtLnR5cGUgPT0gJ29iaidcbiAgICAgICAgICAgICAgICAgICAgICAgIEBicm93c2VyLmxvYWRPYmplY3RJdGVtIEBpdGVtLCBjb2x1bW46QGNvbHVtbi5pbmRleCsxXG4gICAgICAgICAgICAgICAgICAgICAgICBAYnJvd3Nlci5wcmV2aWV3T2JqZWN0SXRlbSAgQGl0ZW0sIGNvbHVtbjpAY29sdW1uLmluZGV4KzJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIEBpdGVtLm9iaj8uZmlsZT8gYW5kIF8uaXNTdHJpbmcgQGl0ZW0ub2JqLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHQubGluZSA9IEBpdGVtLm9iai5saW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmNvbCAgPSBAaXRlbS5vYmouY29sdW1uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2xvZyAnanVtcFRvRmlsZT8nIG9wdFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgQGl0ZW0ub2JqPy5maWxlPyBhbmQgXy5pc1N0cmluZyBAaXRlbS5vYmouZmlsZVxuICAgICAgICAgICAgICAgICAgICBvcHQgPSBmaWxlOkBpdGVtLm9iai5maWxlLCBsaW5lOkBpdGVtLm9iai5saW5lLCBjb2w6QGl0ZW0ub2JqLmNvbHVtbiwgbmV3VGFiOm9wdC5uZXdUYWJcbiAgICAgICAgICAgICAgICAgICAga2xvZyAnanVtcFRvRmlsZT8nIG9wdFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGJyb3dzZXIuY2xlYXJDb2x1bW5zRnJvbSBAY29sdW1uLmluZGV4KzFcbiAgICAgICAgQFxuICAgIFxuICAgIGlzQWN0aXZlOiAtPiBAZGl2LmNsYXNzTGlzdC5jb250YWlucyAnYWN0aXZlJ1xuICAgIFxuICAgIHNldEFjdGl2ZTogKG9wdCA9IHt9KSAtPlxuICAgICAgICBcbiAgICAgICAgQGNvbHVtbi5hY3RpdmVSb3coKT8uY2xlYXJBY3RpdmUoKVxuICAgICAgICBAZGl2LmNsYXNzTGlzdC5hZGQgJ2FjdGl2ZSdcbiAgICAgICAgXG4gICAgICAgIGlmIG9wdD8uc2Nyb2xsICE9IGZhbHNlXG4gICAgICAgICAgICBAY29sdW1uLnNjcm9sbC50b0luZGV4IEBpbmRleCgpXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0Py5lbWl0IFxuICAgICAgICAgICAgQGJyb3dzZXIuZW1pdCAnaXRlbUFjdGl2YXRlZCcgQGl0ZW1cbiAgICAgICAgICAgIGlmIEBpdGVtLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ3NldENXRCcgQGl0ZW0uZmlsZVxuICAgICAgICAgICAgZWxzZSBpZiBAaXRlbS50eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnc2V0Q1dEJyBzbGFzaC5kaXIgQGl0ZW0uZmlsZVxuICAgICAgICBAXG4gICAgICAgICAgICAgICAgXG4gICAgY2xlYXJBY3RpdmU6IC0+XG4gICAgICAgIEBkaXYuY2xhc3NMaXN0LnJlbW92ZSAnYWN0aXZlJ1xuICAgICAgICBAXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAgICAgICAgIFxuICAgIGVkaXROYW1lOiA9PlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIEBpbnB1dD8gXG4gICAgICAgIEBpbnB1dCA9IGVsZW0gJ2lucHV0JyBjbGFzczoncm93TmFtZUlucHV0J1xuICAgICAgICBAaW5wdXQudmFsdWUgPSBzbGFzaC5maWxlIEBpdGVtLmZpbGVcbiAgICAgICAgXG4gICAgICAgIEBkaXYuYXBwZW5kQ2hpbGQgQGlucHV0XG4gICAgICAgIEBpbnB1dC5hZGRFdmVudExpc3RlbmVyICdjaGFuZ2UnICAgQG9uTmFtZUNoYW5nZVxuICAgICAgICBAaW5wdXQuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgIEBvbk5hbWVLZXlEb3duXG4gICAgICAgIEBpbnB1dC5hZGRFdmVudExpc3RlbmVyICdmb2N1c291dCcgQG9uTmFtZUZvY3VzT3V0XG4gICAgICAgIEBpbnB1dC5mb2N1cygpXG4gICAgICAgIFxuICAgICAgICBAaW5wdXQuc2V0U2VsZWN0aW9uUmFuZ2UgMCwgc2xhc2guYmFzZShAaXRlbS5maWxlKS5sZW5ndGhcblxuICAgIG9uTmFtZUtleURvd246IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIHttb2QsIGtleSwgY29tYm99ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJyAnZXNjJ1xuICAgICAgICAgICAgICAgIGlmIEBpbnB1dC52YWx1ZSA9PSBAZmlsZSBvciBjb21ibyAhPSAnZW50ZXInXG4gICAgICAgICAgICAgICAgICAgIEBpbnB1dC52YWx1ZSA9IEBmaWxlXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgQG9uTmFtZUZvY3VzT3V0KClcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgXG4gICAgcmVtb3ZlSW5wdXQ6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBpbnB1dD9cbiAgICAgICAgQGlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2ZvY3Vzb3V0JyBAb25OYW1lRm9jdXNPdXRcbiAgICAgICAgQGlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NoYW5nZScgICBAb25OYW1lQ2hhbmdlXG4gICAgICAgIEBpbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyICdrZXlkb3duJyAgQG9uTmFtZUtleURvd25cbiAgICAgICAgQGlucHV0LnJlbW92ZSgpXG4gICAgICAgIGRlbGV0ZSBAaW5wdXRcbiAgICAgICAgQGlucHV0ID0gbnVsbFxuICAgICAgICBpZiBub3QgZG9jdW1lbnQuYWN0aXZlRWxlbWVudD8gb3IgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PSBkb2N1bWVudC5ib2R5XG4gICAgICAgICAgICBAY29sdW1uLmZvY3VzIGFjdGl2YXRlOmZhbHNlXG4gICAgXG4gICAgb25OYW1lRm9jdXNPdXQ6IChldmVudCkgPT4gQHJlbW92ZUlucHV0KClcbiAgICBcbiAgICBvbk5hbWVDaGFuZ2U6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIHRyaW1tZWQgPSBAaW5wdXQudmFsdWUudHJpbSgpXG4gICAgICAgIGlmIHRyaW1tZWQubGVuZ3RoXG4gICAgICAgICAgICBuZXdGaWxlID0gc2xhc2guam9pbiBzbGFzaC5kaXIoQGl0ZW0uZmlsZSksIHRyaW1tZWRcbiAgICAgICAgICAgIHVudXNlZEZpbGVuYW1lID0gcmVxdWlyZSAndW51c2VkLWZpbGVuYW1lJ1xuICAgICAgICAgICAgdW51c2VkRmlsZW5hbWUobmV3RmlsZSkudGhlbiAobmV3RmlsZSkgPT5cbiAgICAgICAgICAgICAgICBmcy5yZW5hbWUgQGl0ZW0uZmlsZSwgbmV3RmlsZSwgKGVycikgPT5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAncmVuYW1lIGZhaWxlZCcgZXJyIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBuZXdGaWxlXG4gICAgICAgIEByZW1vdmVJbnB1dCgpXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgb25EcmFnU3RhcnQ6IChkLCBlKSA9PlxuXG4gICAgICAgIEBjb2x1bW4uZm9jdXMgYWN0aXZhdGU6ZmFsc2VcbiAgICAgICAgQHNldEFjdGl2ZSBzY3JvbGw6ZmFsc2VcblxuICAgIG9uRHJhZ01vdmU6IChkLGUpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQGNvbHVtbi5kcmFnRGl2XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBpZiBNYXRoLmFicyhkLmRlbHRhU3VtLngpIDwgMjAgYW5kIE1hdGguYWJzKGQuZGVsdGFTdW0ueSkgPCAxMFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYgPSBAZGl2LmNsb25lTm9kZSB0cnVlXG4gICAgICAgICAgICBiciA9IEBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS50b3AgID0gXCIje2JyLnRvcH1weFwiXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUubGVmdCA9IFwiI3tici5sZWZ0fXB4XCJcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS53aWR0aCA9IFwiI3tici53aWR0aC0xMn1weFwiXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUuaGVpZ2h0ID0gXCIje2JyLmhlaWdodC0zfXB4XCJcbiAgICAgICAgICAgIEBjb2x1bW4uZHJhZ0Rpdi5zdHlsZS5mbGV4ID0gJ3Vuc2V0J1xuICAgICAgICAgICAgQGNvbHVtbi5kcmFnRGl2LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSdcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQgQGNvbHVtbi5kcmFnRGl2XG4gICAgICAgIFxuICAgICAgICBAY29sdW1uLmRyYWdEaXYuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGVYKCN7ZC5kZWx0YVN1bS54fXB4KSB0cmFuc2xhdGVZKCN7ZC5kZWx0YVN1bS55fXB4KVwiXG5cbiAgICBvbkRyYWdTdG9wOiAoZCxlKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGNvbHVtbi5kcmFnRGl2P1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBAY29sdW1uLmRyYWdEaXYucmVtb3ZlKClcbiAgICAgICAgICAgIGRlbGV0ZSBAY29sdW1uLmRyYWdEaXZcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgY29sdW1uID0gQGJyb3dzZXIuY29sdW1uQXRQb3MgZC5wb3NcbiAgICAgICAgICAgICAgICBjb2x1bW4uZHJvcFJvdz8gQCwgZC5wb3NcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFJvd1xuIl19
//# sourceURL=../coffee/row.coffee