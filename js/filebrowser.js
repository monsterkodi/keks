// koffee 1.4.0

/*
00000000  000  000      00000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000
000       000  000      000             000   000  000   000  000   000  000 0 000  000       000       000   000
000000    000  000      0000000         0000000    0000000    000   000  000000000  0000000   0000000   0000000
000       000  000      000             000   000  000   000  000   000  000   000       000  000       000   000
000       000  0000000  00000000        0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var $, Browser, File, FileBrowser, Select, Shelf, _, clamp, dirlist, drag, elem, empty, fs, klog, last, moment, open, os, pbytes, post, prefs, ref, slash, state, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, open = ref.open, valid = ref.valid, empty = ref.empty, clamp = ref.clamp, prefs = ref.prefs, last = ref.last, elem = ref.elem, drag = ref.drag, state = ref.state, klog = ref.klog, slash = ref.slash, fs = ref.fs, os = ref.os, $ = ref.$, _ = ref._;

Browser = require('./browser');

Shelf = require('./shelf');

Select = require('./select');

File = require('./tools/file');

dirlist = require('./tools/dirlist');

pbytes = require('pretty-bytes');

moment = require('moment');

FileBrowser = (function(superClass) {
    extend(FileBrowser, superClass);

    function FileBrowser(view) {
        this.refresh = bind(this.refresh, this);
        this.onShelfDrag = bind(this.onShelfDrag, this);
        this.updateColumnScrolls = bind(this.updateColumnScrolls, this);
        this.onOpenFile = bind(this.onOpenFile, this);
        this.onFile = bind(this.onFile, this);
        this.loadDirItems = bind(this.loadDirItems, this);
        this.onFileBrowser = bind(this.onFileBrowser, this);
        FileBrowser.__super__.constructor.call(this, view);
        window.filebrowser = this;
        this.loadID = 0;
        this.shelf = new Shelf(this);
        this.select = new Select(this);
        this.name = 'FileBrowser';
        post.on('file', this.onFile);
        post.on('filebrowser', this.onFileBrowser);
        post.on('openFile', this.onOpenFile);
        this.shelfResize = elem('div', {
            "class": 'shelfResize'
        });
        this.shelfResize.style.position = 'absolute';
        this.shelfResize.style.top = '0px';
        this.shelfResize.style.bottom = '0px';
        this.shelfResize.style.left = '194px';
        this.shelfResize.style.width = '6px';
        this.shelfResize.style.cursor = 'ew-resize';
        this.drag = new drag({
            target: this.shelfResize,
            onMove: this.onShelfDrag
        });
        this.shelfSize = prefs.get('shelf▸size', 200);
        this.initColumns();
    }

    FileBrowser.prototype.dropAction = function(action, sources, target) {
        var i, j, len, len1, results, source;
        if (slash.isFile(target)) {
            target = slash.dir(target);
        }
        for (i = 0, len = sources.length; i < len; i++) {
            source = sources[i];
            if (action === 'move') {
                if (source === target || slash.dir(source) === target) {
                    klog('noop');
                    return;
                }
            }
        }
        results = [];
        for (j = 0, len1 = sources.length; j < len1; j++) {
            source = sources[j];
            switch (action) {
                case 'move':
                    results.push(File.rename(source, target, (function(_this) {
                        return function(source, target) {
                            var sourceColumn, targetColumn;
                            klog(action, source);
                            klog(action, target);
                            if (sourceColumn = _this.columnForFile(source)) {
                                sourceColumn.removeFile(source);
                            }
                            if (targetColumn = _this.columnForFile(target)) {
                                if (!targetColumn.row(target)) {
                                    return targetColumn.insertFile(target);
                                }
                            }
                        };
                    })(this)));
                    break;
                case 'copy':
                    results.push(File.copy(source, target, (function(_this) {
                        return function(source, target) {
                            var targetColumn;
                            klog(action, source);
                            klog(action, target);
                            if (targetColumn = _this.columnForFile(target)) {
                                if (!targetColumn.row(target)) {
                                    return targetColumn.insertFile(target);
                                }
                            }
                        };
                    })(this)));
                    break;
                default:
                    results.push(void 0);
            }
        }
        return results;
    };

    FileBrowser.prototype.columnForFile = function(file) {
        var column, i, len, ref1, ref2;
        ref1 = this.columns;
        for (i = 0, len = ref1.length; i < len; i++) {
            column = ref1[i];
            if (((ref2 = column.parent) != null ? ref2.file : void 0) === slash.dir(file)) {
                return column;
            }
        }
    };

    FileBrowser.prototype.sharedColumnIndex = function(file) {
        var col, column, i, len, ref1, ref2;
        col = 0;
        ref1 = this.columns;
        for (i = 0, len = ref1.length; i < len; i++) {
            column = ref1[i];
            if (column.isDir() && file.startsWith(column.path())) {
                col += 1;
            } else {
                break;
            }
        }
        if (col === 1 && slash.dir(file) !== ((ref2 = this.columns[0]) != null ? ref2.path() : void 0)) {
            return 0;
        }
        return Math.max(-1, col - 2);
    };

    FileBrowser.prototype.closeViewer = function() {
        var ref1;
        return (ref1 = this.viewer) != null ? ref1.close() : void 0;
    };

    FileBrowser.prototype.browse = function(file, opt) {
        this.closeViewer();
        if (file) {
            return this.loadItem(this.fileItem(file), opt);
        }
    };

    FileBrowser.prototype.navigateToFile = function(file) {
        var col, filelist, i, index, item, lastPath, opt, paths, ref1, ref2, row;
        this.closeViewer();
        lastPath = (ref1 = this.lastDirColumn()) != null ? ref1.path() : void 0;
        file = slash.path(file);
        if (file === lastPath || slash.isRelative(file)) {
            return;
        }
        col = this.sharedColumnIndex(file);
        filelist = slash.pathlist(file);
        if (col >= 0) {
            paths = filelist.slice(filelist.indexOf(this.columns[col].path()) + 1);
        } else {
            paths = filelist.slice(filelist.length - 2);
        }
        this.clearColumnsFrom(col + 1, {
            pop: true,
            clear: col + paths.length
        });
        while (this.numCols() < paths.length) {
            this.addColumn();
        }
        for (index = i = 0, ref2 = paths.length; 0 <= ref2 ? i < ref2 : i > ref2; index = 0 <= ref2 ? ++i : --i) {
            item = this.fileItem(paths[index]);
            switch (item.type) {
                case 'file':
                    this.loadFileItem(item, col + 1 + index);
                    break;
                case 'dir':
                    opt = {};
                    if (index < paths.length - 1) {
                        opt.active = paths[index + 1];
                    }
                    this.loadDirItem(item, col + 1 + index, opt);
            }
        }
        if (col = this.lastDirColumn()) {
            if (row = col.row(slash.file(file))) {
                return row.setActive();
            }
        }
    };

    FileBrowser.prototype.fileItem = function(path) {
        var p;
        p = slash.resolve(path);
        return {
            file: p,
            type: slash.isFile(p) && 'file' || 'dir',
            name: slash.file(p)
        };
    };

    FileBrowser.prototype.onFileBrowser = function(action, item, arg) {
        switch (action) {
            case 'loadItem':
                return this.loadItem(item, arg);
        }
    };

    FileBrowser.prototype.loadDir = function(path) {
        return this.loadItem({
            type: 'dir',
            file: path
        });
    };

    FileBrowser.prototype.loadItem = function(item, opt) {
        var ref1, ref2;
        if (opt != null) {
            opt;
        } else {
            opt = {
                active: '..',
                focus: true
            };
        }
        if (item.name != null) {
            item.name;
        } else {
            item.name = slash.file(item.file);
        }
        this.clearColumnsFrom(1, {
            pop: true,
            clear: (ref1 = opt.clear) != null ? ref1 : 1
        });
        switch (item.type) {
            case 'dir':
                this.loadDirItem(item, 0, opt);
                break;
            case 'file':
                opt.activate = item.file;
                while (this.numCols() < 2) {
                    this.addColumn();
                }
                this.loadDirItem(this.fileItem(slash.dir(item.file)), 0, opt);
        }
        if (opt.focus) {
            return (ref2 = this.columns[0]) != null ? ref2.focus() : void 0;
        }
    };

    FileBrowser.prototype.loadFileItem = function(item, col) {
        var file;
        if (col == null) {
            col = 0;
        }
        this.clearColumnsFrom(col, {
            pop: true
        });
        while (col >= this.numCols()) {
            this.addColumn();
        }
        file = item.file;
        this.columns[col].parent = item;
        if (File.isImage(file)) {
            this.columns[col].table.appendChild(this.imageInfo(file));
        } else {
            switch (slash.ext(file)) {
                case 'tiff':
                case 'tif':
                    if (!slash.win()) {
                        this.convertImage(row);
                    } else {
                        this.columns[col].table.appendChild(this.fileInfo(file));
                    }
                    break;
                case 'pxm':
                    if (!slash.win()) {
                        this.convertPXM(row);
                    } else {
                        this.columns[col].table.appendChild(this.fileInfo(file));
                    }
                    break;
                default:
                    this.columns[col].table.appendChild(this.fileInfo(file));
            }
        }
        post.emit('load', {
            column: col,
            item: item
        });
        return this.updateColumnScrolls();
    };

    FileBrowser.prototype.imageInfo = function(file) {
        var cnt, img;
        img = elem('img', {
            "class": 'browserImage',
            src: slash.fileUrl(file)
        });
        cnt = elem({
            "class": 'browserImageContainer',
            child: img
        });
        cnt.addEventListener('dblclick', function() {
            return open(file);
        });
        img.onload = function() {
            var age, br, height, html, info, num, range, ref1, size, stat, width, x;
            img = $('.browserImage');
            br = img.getBoundingClientRect();
            x = img.clientX;
            width = parseInt(br.right - br.left - 2);
            height = parseInt(br.bottom - br.top - 2);
            img.style.opacity = '1';
            img.style.maxWidth = '100%';
            stat = slash.fileExists(file);
            size = pbytes(stat.size).split(' ');
            age = moment().to(moment(stat.mtime), true);
            ref1 = age.split(' '), num = ref1[0], range = ref1[1];
            if (num[0] === 'a') {
                num = '1';
            }
            html = "<tr><th colspan=2>" + width + "<span class='punct'>x</span>" + height + "</th></tr>";
            html += "<tr><th>" + size[0] + "</th><td>" + size[1] + "</td></tr>";
            html += "<tr><th>" + num + "</th><td>" + range + "</td></tr>";
            info = elem({
                "class": 'browserFileInfo',
                children: [
                    elem('div', {
                        "class": "fileInfoFile " + (slash.ext(file)),
                        html: File.span(file)
                    }), elem('table', {
                        "class": "fileInfoData",
                        html: html
                    })
                ]
            });
            cnt = $('.browserImageContainer');
            return cnt.appendChild(info);
        };
        return cnt;
    };

    FileBrowser.prototype.fileInfo = function(file) {
        var age, info, num, range, ref1, size, stat, t;
        stat = slash.fileExists(file);
        size = pbytes(stat.size).split(' ');
        t = moment(stat.mtime);
        age = moment().to(t, true);
        ref1 = age.split(' '), num = ref1[0], range = ref1[1];
        if (num[0] === 'a') {
            num = '1';
        }
        if (range === 'few') {
            num = moment().diff(t, 'seconds');
            range = 'seconds';
        }
        info = elem({
            "class": 'browserFileInfo',
            children: [
                elem('div', {
                    "class": "fileInfoIcon " + (slash.ext(file)) + " " + (File.iconClassName(file))
                }), elem('div', {
                    "class": "fileInfoFile " + (slash.ext(file)),
                    html: File.span(file)
                }), elem('table', {
                    "class": "fileInfoData",
                    html: "<tr><th>" + size[0] + "</th><td>" + size[1] + "</td></tr><tr><th>" + num + "</th><td>" + range + "</td></tr>"
                })
            ]
        });
        info.addEventListener('dblclick', function() {
            return open(file);
        });
        return info;
    };

    FileBrowser.prototype.loadDirItem = function(item, col, opt) {
        var dir;
        if (col == null) {
            col = 0;
        }
        if (opt == null) {
            opt = {};
        }
        if (col > 0 && item.name === '/') {
            return;
        }
        dir = item.file;
        opt.ignoreHidden = !prefs.get("browser▸showHidden▸" + dir);
        return dirlist(dir, opt, (function(_this) {
            return function(items) {
                if (_this.columns.length && col >= _this.columns.length && _this.skipOnDblClick) {
                    delete _this.skipOnDblClick;
                    return;
                }
                _this.loadDirItems(dir, item, items, col, opt);
                return _this.updateColumnScrolls();
            };
        })(this));
    };

    FileBrowser.prototype.loadDirItems = function(dir, item, items, col, opt) {
        var ref1, ref2, ref3, ref4, ref5, row, updir;
        updir = slash.resolve(slash.join(dir, '..'));
        if (col === 0 || col - 1 < this.numCols() && ((ref1 = this.columns[col - 1].activeRow()) != null ? ref1.item.name : void 0) === '..') {
            if ((ref2 = (ref3 = items[0]) != null ? ref3.name : void 0) !== '..' && ref2 !== '/') {
                if (updir !== dir) {
                    items.unshift({
                        name: '..',
                        type: 'dir',
                        file: updir
                    });
                }
            }
        }
        while (col >= this.numCols()) {
            this.addColumn();
        }
        this.columns[col].loadItems(items, item);
        post.emit('load', {
            column: col,
            item: item
        });
        if (opt.activate) {
            if (row = this.columns[col].row(slash.file(opt.activate))) {
                row.activate();
                post.emit('load', {
                    column: col + 1,
                    item: row.item
                });
            }
        } else if (opt.active) {
            if ((ref4 = this.columns[col].row(slash.file(opt.active))) != null) {
                ref4.setActive();
            }
        }
        if (opt.focus !== false && empty(document.activeElement) && empty((ref5 = $('.popup')) != null ? ref5.outerHTML : void 0)) {
            if (col = this.lastDirColumn()) {
                col.div.focus();
            }
        }
        return typeof opt.cb === "function" ? opt.cb({
            column: col,
            item: item
        }) : void 0;
    };

    FileBrowser.prototype.onFile = function(file) {
        if (!file) {
            return;
        }
        if (!this.flex) {
            return;
        }
        return this.navigateToFile(file);
    };

    FileBrowser.prototype.onOpenFile = function(file) {
        return open(file);
    };

    FileBrowser.prototype.initColumns = function() {
        FileBrowser.__super__.initColumns.call(this);
        this.view.insertBefore(this.shelf.div, this.view.firstChild);
        this.view.insertBefore(this.shelfResize, null);
        this.shelf.browserDidInitColumns();
        return this.setShelfSize(this.shelfSize);
    };

    FileBrowser.prototype.columnAtPos = function(pos) {
        var column;
        if (column = FileBrowser.__super__.columnAtPos.call(this, pos)) {
            return column;
        }
        if (elem.containsPos(this.shelf.div, pos)) {
            return this.shelf;
        }
    };

    FileBrowser.prototype.lastColumnPath = function() {
        var lastColumn;
        if (lastColumn = this.lastUsedColumn()) {
            return lastColumn.path();
        }
    };

    FileBrowser.prototype.lastDirColumn = function() {
        var lastColumn;
        if (lastColumn = this.lastUsedColumn()) {
            if (lastColumn.isDir()) {
                return lastColumn;
            } else {
                return lastColumn.prevColumn();
            }
        }
    };

    FileBrowser.prototype.onBackspaceInColumn = function(column) {
        return column.backspaceSearch();
    };

    FileBrowser.prototype.onDeleteInColumn = function(column) {
        if (column.searchDiv) {
            return column.clearSearch();
        } else {
            return column.moveToTrash();
        }
    };

    FileBrowser.prototype.updateColumnScrolls = function() {
        FileBrowser.__super__.updateColumnScrolls.call(this);
        return this.shelf.scroll.update();
    };

    FileBrowser.prototype.onShelfDrag = function(drag, event) {
        var shelfSize;
        shelfSize = clamp(0, 400, drag.pos.x);
        return this.setShelfSize(shelfSize);
    };

    FileBrowser.prototype.setShelfSize = function(shelfSize1) {
        this.shelfSize = shelfSize1;
        prefs.set('shelf▸size', this.shelfSize);
        this.shelfResize.style.left = this.shelfSize + "px";
        this.shelf.div.style.width = this.shelfSize + "px";
        this.cols.style.left = this.shelfSize + "px";
        return this.updateColumnScrolls();
    };

    FileBrowser.prototype.toggleShelf = function() {
        var ref1;
        if (this.shelfSize < 1) {
            this.setShelfSize(200);
        } else {
            if ((ref1 = this.lastUsedColumn()) != null) {
                ref1.focus();
            }
            this.setShelfSize(0);
        }
        return this.updateColumnScrolls();
    };

    FileBrowser.prototype.refresh = function() {
        var ref1, ref2;
        if (this.lastUsedColumn()) {
            klog('refresh', (ref1 = this.lastUsedColumn()) != null ? ref1.path() : void 0);
            return this.navigateToFile((ref2 = this.lastUsedColumn()) != null ? ref2.path() : void 0);
        }
    };

    return FileBrowser;

})(Browser);

module.exports = FileBrowser;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLG1LQUFBO0lBQUE7Ozs7QUFRQSxNQUFpRyxPQUFBLENBQVEsS0FBUixDQUFqRyxFQUFFLGVBQUYsRUFBUSxlQUFSLEVBQWMsaUJBQWQsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsZUFBMUMsRUFBZ0QsZUFBaEQsRUFBc0QsZUFBdEQsRUFBNEQsaUJBQTVELEVBQW1FLGVBQW5FLEVBQXlFLGlCQUF6RSxFQUFnRixXQUFoRixFQUFvRixXQUFwRixFQUF3RixTQUF4RixFQUEyRjs7QUFFM0YsT0FBQSxHQUFXLE9BQUEsQ0FBUSxXQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsSUFBQSxHQUFXLE9BQUEsQ0FBUSxjQUFSOztBQUNYLE9BQUEsR0FBVyxPQUFBLENBQVEsaUJBQVI7O0FBQ1gsTUFBQSxHQUFXLE9BQUEsQ0FBUSxjQUFSOztBQUNYLE1BQUEsR0FBVyxPQUFBLENBQVEsUUFBUjs7QUFFTDs7O0lBRUMscUJBQUMsSUFBRDs7Ozs7Ozs7UUFFQyw2Q0FBTSxJQUFOO1FBRUEsTUFBTSxDQUFDLFdBQVAsR0FBcUI7UUFFckIsSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxLQUFELEdBQVUsSUFBSSxLQUFKLENBQVUsSUFBVjtRQUNWLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBSSxNQUFKLENBQVcsSUFBWDtRQUNWLElBQUMsQ0FBQSxJQUFELEdBQVU7UUFFVixJQUFJLENBQUMsRUFBTCxDQUFRLE1BQVIsRUFBc0IsSUFBQyxDQUFBLE1BQXZCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxhQUFSLEVBQXNCLElBQUMsQ0FBQSxhQUF2QjtRQUNBLElBQUksQ0FBQyxF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VCxZQUFBO1FBQUEsSUFBRyxJQUFDLENBQUEsU0FBRCxHQUFhLENBQWhCO1lBQ0ksSUFBQyxDQUFBLFlBQUQsQ0FBYyxHQUFkLEVBREo7U0FBQSxNQUFBOztvQkFHcUIsQ0FBRSxLQUFuQixDQUFBOztZQUNBLElBQUMsQ0FBQSxZQUFELENBQWMsQ0FBZCxFQUpKOztlQU1BLElBQUMsQ0FBQSxtQkFBRCxDQUFBO0lBUlM7OzBCQVViLE9BQUEsR0FBUyxTQUFBO0FBRUwsWUFBQTtRQUFBLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUFIO1lBQ0ksSUFBQSxDQUFLLFNBQUwsK0NBQWdDLENBQUUsSUFBbkIsQ0FBQSxVQUFmO21CQUNBLElBQUMsQ0FBQSxjQUFELDhDQUFpQyxDQUFFLElBQW5CLENBQUEsVUFBaEIsRUFGSjs7SUFGSzs7OztHQS9jYTs7QUFxZDFCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIG9wZW4sIHZhbGlkLCBlbXB0eSwgY2xhbXAsIHByZWZzLCBsYXN0LCBlbGVtLCBkcmFnLCBzdGF0ZSwga2xvZywgc2xhc2gsIGZzLCBvcywgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Ccm93c2VyICA9IHJlcXVpcmUgJy4vYnJvd3NlcidcblNoZWxmICAgID0gcmVxdWlyZSAnLi9zaGVsZidcblNlbGVjdCAgID0gcmVxdWlyZSAnLi9zZWxlY3QnXG5GaWxlICAgICA9IHJlcXVpcmUgJy4vdG9vbHMvZmlsZSdcbmRpcmxpc3QgID0gcmVxdWlyZSAnLi90b29scy9kaXJsaXN0J1xucGJ5dGVzICAgPSByZXF1aXJlICdwcmV0dHktYnl0ZXMnXG5tb21lbnQgICA9IHJlcXVpcmUgJ21vbWVudCdcblxuY2xhc3MgRmlsZUJyb3dzZXIgZXh0ZW5kcyBCcm93c2VyXG5cbiAgICBAOiAodmlldykgLT5cblxuICAgICAgICBzdXBlciB2aWV3XG5cbiAgICAgICAgd2luZG93LmZpbGVicm93c2VyID0gQFxuXG4gICAgICAgIEBsb2FkSUQgPSAwXG4gICAgICAgIEBzaGVsZiAgPSBuZXcgU2hlbGYgQFxuICAgICAgICBAc2VsZWN0ID0gbmV3IFNlbGVjdCBAXG4gICAgICAgIEBuYW1lICAgPSAnRmlsZUJyb3dzZXInXG5cbiAgICAgICAgcG9zdC5vbiAnZmlsZScgICAgICAgIEBvbkZpbGVcbiAgICAgICAgcG9zdC5vbiAnZmlsZWJyb3dzZXInIEBvbkZpbGVCcm93c2VyXG4gICAgICAgIHBvc3Qub24gJ29wZW5GaWxlJyAgICBAb25PcGVuRmlsZVxuXG4gICAgICAgIEBzaGVsZlJlc2l6ZSA9IGVsZW0gJ2RpdicgY2xhc3M6ICdzaGVsZlJlc2l6ZSdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUudG9wICAgICAgPSAnMHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUuYm90dG9tICAgPSAnMHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUubGVmdCAgICAgPSAnMTk0cHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS53aWR0aCAgICA9ICc2cHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5jdXJzb3IgICA9ICdldy1yZXNpemUnXG5cbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQHNoZWxmUmVzaXplXG4gICAgICAgICAgICBvbk1vdmU6ICBAb25TaGVsZkRyYWdcblxuICAgICAgICBAc2hlbGZTaXplID0gcHJlZnMuZ2V0ICdzaGVsZuKWuHNpemUnIDIwMFxuXG4gICAgICAgIEBpbml0Q29sdW1ucygpXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgICMgZHJvcEFjdGlvbjogKGV2ZW50LCB0YXJnZXQpIC0+XG4gICAgZHJvcEFjdGlvbjogKGFjdGlvbiwgc291cmNlcywgdGFyZ2V0KSAtPlxuICAgICAgICBcbiAgICAgICAgIyBhY3Rpb24gPSBldmVudC5nZXRNb2RpZmllclN0YXRlKCdTaGlmdCcpIGFuZCAnY29weScgb3IgJ21vdmUnXG4gICAgICAgIFxuICAgICAgICAjIHNvdXJjZXMgPSBldmVudC5kYXRhVHJhbnNmZXIuZ2V0RGF0YSgndGV4dC9wbGFpbicpLnNwbGl0ICdcXG4nXG4gICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5pc0ZpbGUgdGFyZ2V0XG4gICAgICAgICAgICB0YXJnZXQgPSBzbGFzaC5kaXIgdGFyZ2V0XG4gICAgICAgIFxuICAgICAgICBmb3Igc291cmNlIGluIHNvdXJjZXNcbiAgICAgICAgXG4gICAgICAgICAgICBpZiBhY3Rpb24gPT0gJ21vdmUnIFxuICAgICAgICAgICAgICAgIGlmIHNvdXJjZSA9PSB0YXJnZXQgb3Igc2xhc2guZGlyKHNvdXJjZSkgPT0gdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgIGtsb2cgJ25vb3AnXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICMga2xvZyBcImRyb3BBY3Rpb24gI3t0YXJnZXR9XCIgc291cmNlc1xuICAgICAgICBcbiAgICAgICAgZm9yIHNvdXJjZSBpbiBzb3VyY2VzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN3aXRjaCBhY3Rpb25cbiAgICAgICAgICAgICAgICB3aGVuICdtb3ZlJ1xuICAgICAgICAgICAgICAgICAgICBGaWxlLnJlbmFtZSBzb3VyY2UsIHRhcmdldCwgKHNvdXJjZSwgdGFyZ2V0KSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAga2xvZyBhY3Rpb24sIHNvdXJjZVxuICAgICAgICAgICAgICAgICAgICAgICAga2xvZyBhY3Rpb24sIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgc291cmNlQ29sdW1uID0gQGNvbHVtbkZvckZpbGUgc291cmNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZUNvbHVtbi5yZW1vdmVGaWxlIHNvdXJjZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdGFyZ2V0Q29sdW1uID0gQGNvbHVtbkZvckZpbGUgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IHRhcmdldENvbHVtbi5yb3cgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldENvbHVtbi5pbnNlcnRGaWxlIHRhcmdldFxuICAgICAgICAgICAgICAgIHdoZW4gJ2NvcHknXG4gICAgICAgICAgICAgICAgICAgIEZpbGUuY29weSBzb3VyY2UsIHRhcmdldCwgKHNvdXJjZSwgdGFyZ2V0KSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAga2xvZyBhY3Rpb24sIHNvdXJjZVxuICAgICAgICAgICAgICAgICAgICAgICAga2xvZyBhY3Rpb24sIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdGFyZ2V0Q29sdW1uID0gQGNvbHVtbkZvckZpbGUgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IHRhcmdldENvbHVtbi5yb3cgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldENvbHVtbi5pbnNlcnRGaWxlIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICBcbiAgICBjb2x1bW5Gb3JGaWxlOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbHVtbi5wYXJlbnQ/LmZpbGUgPT0gc2xhc2guZGlyIGZpbGVcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sdW1uXG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHNoYXJlZENvbHVtbkluZGV4OiAoZmlsZSkgLT4gXG4gICAgICAgIFxuICAgICAgICBjb2wgPSAwXG4gICAgICAgIFxuICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBjb2x1bW4uaXNEaXIoKSBhbmQgZmlsZS5zdGFydHNXaXRoIGNvbHVtbi5wYXRoKClcbiAgICAgICAgICAgICAgICBjb2wgKz0gMVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbCA9PSAxIGFuZCBzbGFzaC5kaXIoZmlsZSkgIT0gQGNvbHVtbnNbMF0/LnBhdGgoKVxuICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgTWF0aC5tYXggLTEsIGNvbC0yXG5cbiAgICBjbG9zZVZpZXdlcjogLT4gQHZpZXdlcj8uY2xvc2UoKVxuICAgICAgICBcbiAgICBicm93c2U6IChmaWxlLCBvcHQpIC0+IFxuICAgIFxuICAgICAgICBAY2xvc2VWaWV3ZXIoKVxuICAgICAgICBcbiAgICAgICAgaWYgZmlsZSB0aGVuIEBsb2FkSXRlbSBAZmlsZUl0ZW0oZmlsZSksIG9wdFxuICAgICAgICBcbiAgICBuYXZpZ2F0ZVRvRmlsZTogKGZpbGUpIC0+XG5cbiAgICAgICAgQGNsb3NlVmlld2VyKClcbiAgICAgICAgXG4gICAgICAgIGxhc3RQYXRoID0gQGxhc3REaXJDb2x1bW4oKT8ucGF0aCgpXG4gICAgICAgIFxuICAgICAgICBmaWxlID0gc2xhc2gucGF0aCBmaWxlXG4gICAgICAgIFxuICAgICAgICBpZiBmaWxlID09IGxhc3RQYXRoIG9yIHNsYXNoLmlzUmVsYXRpdmUgZmlsZVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgY29sID0gQHNoYXJlZENvbHVtbkluZGV4IGZpbGVcbiAgICAgICAgXG4gICAgICAgIGZpbGVsaXN0ID0gc2xhc2gucGF0aGxpc3QgZmlsZVxuICAgICAgICBcbiAgICAgICAgaWYgY29sID49IDBcbiAgICAgICAgICAgIHBhdGhzID0gZmlsZWxpc3Quc2xpY2UgZmlsZWxpc3QuaW5kZXhPZihAY29sdW1uc1tjb2xdLnBhdGgoKSkrMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwYXRocyA9IGZpbGVsaXN0LnNsaWNlIGZpbGVsaXN0Lmxlbmd0aC0yXG4gICAgICAgICAgICBcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sKzEsIHBvcDp0cnVlIGNsZWFyOmNvbCtwYXRocy5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIHdoaWxlIEBudW1Db2xzKCkgPCBwYXRocy5sZW5ndGhcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBpbmRleCBpbiBbMC4uLnBhdGhzLmxlbmd0aF1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaXRlbSA9IEBmaWxlSXRlbSBwYXRoc1tpbmRleF1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3dpdGNoIGl0ZW0udHlwZVxuICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIHRoZW4gQGxvYWRGaWxlSXRlbSBpdGVtLCBjb2wrMStpbmRleFxuICAgICAgICAgICAgICAgIHdoZW4gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgb3B0ID0ge31cbiAgICAgICAgICAgICAgICAgICAgaWYgaW5kZXggPCBwYXRocy5sZW5ndGgtMVxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmFjdGl2ZSA9IHBhdGhzW2luZGV4KzFdXG4gICAgICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSBpdGVtLCBjb2wrMStpbmRleCwgb3B0XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBjb2wgPSBAbGFzdERpckNvbHVtbigpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHJvdyA9IGNvbC5yb3coc2xhc2guZmlsZSBmaWxlKVxuICAgICAgICAgICAgICAgIHJvdy5zZXRBY3RpdmUoKVxuXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgZmlsZUl0ZW06IChwYXRoKSAtPlxuICAgICAgICBcbiAgICAgICAgcCA9IHNsYXNoLnJlc29sdmUgcGF0aFxuICAgICAgICBmaWxlOnBcbiAgICAgICAgdHlwZTpzbGFzaC5pc0ZpbGUocCkgYW5kICdmaWxlJyBvciAnZGlyJ1xuICAgICAgICBuYW1lOnNsYXNoLmZpbGUgcFxuICAgICAgICBcbiAgICBvbkZpbGVCcm93c2VyOiAoYWN0aW9uLCBpdGVtLCBhcmcpID0+XG5cbiAgICAgICAgc3dpdGNoIGFjdGlvblxuICAgICAgICAgICAgd2hlbiAnbG9hZEl0ZW0nICAgICB0aGVuIEBsb2FkSXRlbSAgICAgaXRlbSwgYXJnXG4gICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxvYWREaXI6IChwYXRoKSAtPiBAbG9hZEl0ZW0gdHlwZTonZGlyJyBmaWxlOnBhdGhcbiAgICBcbiAgICBsb2FkSXRlbTogKGl0ZW0sIG9wdCkgLT5cblxuICAgICAgICBvcHQgPz0gYWN0aXZlOicuLicgZm9jdXM6dHJ1ZVxuICAgICAgICBpdGVtLm5hbWUgPz0gc2xhc2guZmlsZSBpdGVtLmZpbGVcblxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSAxLCBwb3A6dHJ1ZSwgY2xlYXI6b3B0LmNsZWFyID8gMVxuXG4gICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2RpcicgIHRoZW4gQGxvYWREaXJJdGVtIGl0ZW0sIDAsIG9wdFxuICAgICAgICAgICAgd2hlbiAnZmlsZScgXG4gICAgICAgICAgICAgICAgb3B0LmFjdGl2YXRlID0gaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgd2hpbGUgQG51bUNvbHMoKSA8IDIgdGhlbiBAYWRkQ29sdW1uKClcbiAgICAgICAgICAgICAgICBAbG9hZERpckl0ZW0gQGZpbGVJdGVtKHNsYXNoLmRpcihpdGVtLmZpbGUpKSwgMCwgb3B0XG5cbiAgICAgICAgaWYgb3B0LmZvY3VzXG4gICAgICAgICAgICBAY29sdW1uc1swXT8uZm9jdXMoKVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZEZpbGVJdGVtOiAoaXRlbSwgY29sPTApIC0+XG5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sLCBwb3A6dHJ1ZVxuXG4gICAgICAgIHdoaWxlIGNvbCA+PSBAbnVtQ29scygpXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcblxuICAgICAgICBmaWxlID0gaXRlbS5maWxlXG5cbiAgICAgICAgQGNvbHVtbnNbY29sXS5wYXJlbnQgPSBpdGVtXG4gICAgICAgIFxuICAgICAgICBpZiBGaWxlLmlzSW1hZ2UgZmlsZVxuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBAaW1hZ2VJbmZvIGZpbGVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3dpdGNoIHNsYXNoLmV4dCBmaWxlXG4gICAgICAgICAgICAgICAgd2hlbiAndGlmZicgJ3RpZidcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgICAgICBAY29udmVydEltYWdlIHJvd1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIEBmaWxlSW5mbyBmaWxlXG4gICAgICAgICAgICAgICAgd2hlbiAncHhtJ1xuICAgICAgICAgICAgICAgICAgICBpZiBub3Qgc2xhc2gud2luKClcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjb252ZXJ0UFhNIHJvd1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIEBmaWxlSW5mbyBmaWxlXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIEBmaWxlSW5mbyBmaWxlXG5cbiAgICAgICAgcG9zdC5lbWl0ICdsb2FkJyBjb2x1bW46Y29sLCBpdGVtOml0ZW1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuXG4gICAgIyAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBpbWFnZUluZm86IChmaWxlKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgIGltZyA9IGVsZW0gJ2ltZycgY2xhc3M6J2Jyb3dzZXJJbWFnZScgc3JjOnNsYXNoLmZpbGVVcmwgZmlsZVxuICAgICAgICBjbnQgPSBlbGVtIGNsYXNzOidicm93c2VySW1hZ2VDb250YWluZXInIGNoaWxkOmltZ1xuICAgICAgICBjbnQuYWRkRXZlbnRMaXN0ZW5lciAnZGJsY2xpY2snIC0+IG9wZW4gZmlsZVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaW1nLm9ubG9hZCA9IC0+XG4gICAgICAgICAgICBpbWcgPSQgJy5icm93c2VySW1hZ2UnXG4gICAgICAgICAgICBiciA9IGltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgeCA9IGltZy5jbGllbnRYXG4gICAgICAgICAgICB3aWR0aCAgPSBwYXJzZUludCBici5yaWdodCAtIGJyLmxlZnQgLSAyXG4gICAgICAgICAgICBoZWlnaHQgPSBwYXJzZUludCBici5ib3R0b20gLSBici50b3AgLSAyXG5cbiAgICAgICAgICAgIGltZy5zdHlsZS5vcGFjaXR5ICAgPSAnMSdcbiAgICAgICAgICAgIGltZy5zdHlsZS5tYXhXaWR0aCAgPSAnMTAwJSdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3RhdCA9IHNsYXNoLmZpbGVFeGlzdHMgZmlsZVxuICAgICAgICAgICAgc2l6ZSA9IHBieXRlcyhzdGF0LnNpemUpLnNwbGl0ICcgJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBhZ2UgPSBtb21lbnQoKS50byhtb21lbnQoc3RhdC5tdGltZSksIHRydWUpXG4gICAgICAgICAgICBbbnVtLCByYW5nZV0gPSBhZ2Uuc3BsaXQgJyAnXG4gICAgICAgICAgICBudW0gPSAnMScgaWYgbnVtWzBdID09ICdhJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBodG1sICA9IFwiPHRyPjx0aCBjb2xzcGFuPTI+I3t3aWR0aH08c3BhbiBjbGFzcz0ncHVuY3QnPng8L3NwYW4+I3toZWlnaHR9PC90aD48L3RyPlwiXG4gICAgICAgICAgICBodG1sICs9IFwiPHRyPjx0aD4je3NpemVbMF19PC90aD48dGQ+I3tzaXplWzFdfTwvdGQ+PC90cj5cIlxuICAgICAgICAgICAgaHRtbCArPSBcIjx0cj48dGg+I3tudW19PC90aD48dGQ+I3tyYW5nZX08L3RkPjwvdHI+XCJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaW5mbyA9IGVsZW0gY2xhc3M6J2Jyb3dzZXJGaWxlSW5mbycgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICBlbGVtICdkaXYnIGNsYXNzOlwiZmlsZUluZm9GaWxlICN7c2xhc2guZXh0IGZpbGV9XCIgaHRtbDpGaWxlLnNwYW4gZmlsZVxuICAgICAgICAgICAgICAgIGVsZW0gJ3RhYmxlJyBjbGFzczpcImZpbGVJbmZvRGF0YVwiIGh0bWw6aHRtbFxuICAgICAgICAgICAgXVxuICAgICAgICAgICAgY250ID0kICcuYnJvd3NlckltYWdlQ29udGFpbmVyJ1xuICAgICAgICAgICAgY250LmFwcGVuZENoaWxkIGluZm9cbiAgICAgICAgXG4gICAgICAgIGNudFxuICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgXG4gICAgICAgIFxuICAgIGZpbGVJbmZvOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHN0YXQgPSBzbGFzaC5maWxlRXhpc3RzIGZpbGVcbiAgICAgICAgc2l6ZSA9IHBieXRlcyhzdGF0LnNpemUpLnNwbGl0ICcgJ1xuICAgICAgICBcbiAgICAgICAgdCA9IG1vbWVudCBzdGF0Lm10aW1lXG5cbiAgICAgICAgYWdlID0gbW9tZW50KCkudG8odCwgdHJ1ZSlcbiAgICAgICAgW251bSwgcmFuZ2VdID0gYWdlLnNwbGl0ICcgJ1xuICAgICAgICBudW0gPSAnMScgaWYgbnVtWzBdID09ICdhJ1xuICAgICAgICBpZiByYW5nZSA9PSAnZmV3J1xuICAgICAgICAgICAgbnVtID0gbW9tZW50KCkuZGlmZiB0LCAnc2Vjb25kcydcbiAgICAgICAgICAgIHJhbmdlID0gJ3NlY29uZHMnXG4gICAgICAgIFxuICAgICAgICBpbmZvID0gZWxlbSBjbGFzczonYnJvd3NlckZpbGVJbmZvJyBjaGlsZHJlbjogW1xuICAgICAgICAgICAgZWxlbSAnZGl2JyBjbGFzczpcImZpbGVJbmZvSWNvbiAje3NsYXNoLmV4dCBmaWxlfSAje0ZpbGUuaWNvbkNsYXNzTmFtZSBmaWxlfVwiXG4gICAgICAgICAgICBlbGVtICdkaXYnIGNsYXNzOlwiZmlsZUluZm9GaWxlICN7c2xhc2guZXh0IGZpbGV9XCIgaHRtbDpGaWxlLnNwYW4gZmlsZVxuICAgICAgICAgICAgZWxlbSAndGFibGUnIGNsYXNzOlwiZmlsZUluZm9EYXRhXCIgaHRtbDpcIjx0cj48dGg+I3tzaXplWzBdfTwvdGg+PHRkPiN7c2l6ZVsxXX08L3RkPjwvdHI+PHRyPjx0aD4je251bX08L3RoPjx0ZD4je3JhbmdlfTwvdGQ+PC90cj5cIlxuICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICBpbmZvLmFkZEV2ZW50TGlzdGVuZXIgJ2RibGNsaWNrJyAtPiBvcGVuIGZpbGVcbiAgICAgICAgXG4gICAgICAgIGluZm9cbiAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxvYWREaXJJdGVtOiAoaXRlbSwgY29sPTAsIG9wdD17fSkgLT5cblxuICAgICAgICByZXR1cm4gaWYgY29sID4gMCBhbmQgaXRlbS5uYW1lID09ICcvJ1xuXG4gICAgICAgIGRpciA9IGl0ZW0uZmlsZVxuXG4gICAgICAgIG9wdC5pZ25vcmVIaWRkZW4gPSBub3QgcHJlZnMuZ2V0IFwiYnJvd3NlcuKWuHNob3dIaWRkZW7ilrgje2Rpcn1cIlxuXG4gICAgICAgIGRpcmxpc3QgZGlyLCBvcHQsIChpdGVtcykgPT5cblxuICAgICAgICAgICAgaWYgQGNvbHVtbnMubGVuZ3RoIGFuZCBjb2wgPj0gQGNvbHVtbnMubGVuZ3RoIGFuZCBAc2tpcE9uRGJsQ2xpY2tcbiAgICAgICAgICAgICAgICBkZWxldGUgQHNraXBPbkRibENsaWNrXG4gICAgICAgICAgICAgICAgcmV0dXJuIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgQGxvYWREaXJJdGVtcyBkaXIsIGl0ZW0sIGl0ZW1zLCBjb2wsIG9wdFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgbG9hZERpckl0ZW1zOiAoZGlyLCBpdGVtLCBpdGVtcywgY29sLCBvcHQpID0+XG5cbiAgICAgICAgdXBkaXIgPSBzbGFzaC5yZXNvbHZlIHNsYXNoLmpvaW4gZGlyLCAnLi4nXG5cbiAgICAgICAgaWYgY29sID09IDAgb3IgY29sLTEgPCBAbnVtQ29scygpIGFuZCBAY29sdW1uc1tjb2wtMV0uYWN0aXZlUm93KCk/Lml0ZW0ubmFtZSA9PSAnLi4nXG4gICAgICAgICAgICBpZiBpdGVtc1swXT8ubmFtZSBub3QgaW4gWycuLicgJy8nXVxuICAgICAgICAgICAgICAgIGlmIHVwZGlyICE9IGRpclxuICAgICAgICAgICAgICAgICAgICBpdGVtcy51bnNoaWZ0XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnLi4nXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogIHVwZGlyXG5cbiAgICAgICAgd2hpbGUgY29sID49IEBudW1Db2xzKClcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuXG4gICAgICAgIEBjb2x1bW5zW2NvbF0ubG9hZEl0ZW1zIGl0ZW1zLCBpdGVtXG5cbiAgICAgICAgcG9zdC5lbWl0ICdsb2FkJyBjb2x1bW46Y29sLCBpdGVtOml0ZW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0LmFjdGl2YXRlXG4gICAgICAgICAgICBpZiByb3cgPSBAY29sdW1uc1tjb2xdLnJvdyBzbGFzaC5maWxlIG9wdC5hY3RpdmF0ZVxuICAgICAgICAgICAgICAgIHJvdy5hY3RpdmF0ZSgpXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkJyBjb2x1bW46Y29sKzEgaXRlbTpyb3cuaXRlbVxuICAgICAgICBlbHNlIGlmIG9wdC5hY3RpdmVcbiAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0ucm93KHNsYXNoLmZpbGUgb3B0LmFjdGl2ZSk/LnNldEFjdGl2ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0LmZvY3VzICE9IGZhbHNlIGFuZCBlbXB0eShkb2N1bWVudC5hY3RpdmVFbGVtZW50KSBhbmQgZW1wdHkoJCgnLnBvcHVwJyk/Lm91dGVySFRNTClcbiAgICAgICAgICAgIGlmIGNvbCA9IEBsYXN0RGlyQ29sdW1uKClcbiAgICAgICAgICAgICAgICBjb2wuZGl2LmZvY3VzKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgb3B0LmNiPyBjb2x1bW46Y29sLCBpdGVtOml0ZW1cblxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICBvbkZpbGU6IChmaWxlKSA9PlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgZmlsZVxuICAgICAgICByZXR1cm4gaWYgbm90IEBmbGV4XG5cbiAgICAgICAgQG5hdmlnYXRlVG9GaWxlIGZpbGVcblxuICAgIG9uT3BlbkZpbGU6IChmaWxlKSA9PlxuICAgICAgICBcbiAgICAgICAgb3BlbiBmaWxlXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGluaXRDb2x1bW5zOiAtPlxuXG4gICAgICAgIHN1cGVyKClcblxuICAgICAgICBAdmlldy5pbnNlcnRCZWZvcmUgQHNoZWxmLmRpdiwgQHZpZXcuZmlyc3RDaGlsZFxuICAgICAgICBAdmlldy5pbnNlcnRCZWZvcmUgQHNoZWxmUmVzaXplLCBudWxsXG5cbiAgICAgICAgQHNoZWxmLmJyb3dzZXJEaWRJbml0Q29sdW1ucygpXG5cbiAgICAgICAgQHNldFNoZWxmU2l6ZSBAc2hlbGZTaXplXG5cbiAgICBjb2x1bW5BdFBvczogKHBvcykgLT5cblxuICAgICAgICBpZiBjb2x1bW4gPSBzdXBlciBwb3NcbiAgICAgICAgICAgIHJldHVybiBjb2x1bW5cblxuICAgICAgICBpZiBlbGVtLmNvbnRhaW5zUG9zIEBzaGVsZi5kaXYsIHBvc1xuICAgICAgICAgICAgcmV0dXJuIEBzaGVsZlxuICAgICAgICAgICAgXG4gICAgbGFzdENvbHVtblBhdGg6IC0+XG5cbiAgICAgICAgaWYgbGFzdENvbHVtbiA9IEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtbi5wYXRoKClcblxuICAgIGxhc3REaXJDb2x1bW46IC0+XG5cbiAgICAgICAgaWYgbGFzdENvbHVtbiA9IEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICBpZiBsYXN0Q29sdW1uLmlzRGlyKClcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtblxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uLnByZXZDb2x1bW4oKVxuXG4gICAgb25CYWNrc3BhY2VJbkNvbHVtbjogKGNvbHVtbikgLT5cblxuICAgICAgICBjb2x1bW4uYmFja3NwYWNlU2VhcmNoKClcbiAgICAgICAgXG4gICAgb25EZWxldGVJbkNvbHVtbjogKGNvbHVtbikgLT4gXG4gICAgXG4gICAgICAgIGlmIGNvbHVtbi5zZWFyY2hEaXZcbiAgICAgICAgICAgIGNvbHVtbi5jbGVhclNlYXJjaCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbHVtbi5tb3ZlVG9UcmFzaCgpXG4gICAgICAgIFxuICAgIHVwZGF0ZUNvbHVtblNjcm9sbHM6ID0+XG5cbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBAc2hlbGYuc2Nyb2xsLnVwZGF0ZSgpXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMFxuXG4gICAgb25TaGVsZkRyYWc6IChkcmFnLCBldmVudCkgPT5cblxuICAgICAgICBzaGVsZlNpemUgPSBjbGFtcCAwLCA0MDAsIGRyYWcucG9zLnhcbiAgICAgICAgQHNldFNoZWxmU2l6ZSBzaGVsZlNpemVcblxuICAgIHNldFNoZWxmU2l6ZTogKEBzaGVsZlNpemUpIC0+XG5cbiAgICAgICAgcHJlZnMuc2V0ICdzaGVsZuKWuHNpemUnIEBzaGVsZlNpemVcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBzaGVsZi5kaXYuc3R5bGUud2lkdGggPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBjb2xzLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcblxuICAgIHRvZ2dsZVNoZWxmOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHNoZWxmU2l6ZSA8IDFcbiAgICAgICAgICAgIEBzZXRTaGVsZlNpemUgMjAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBsYXN0VXNlZENvbHVtbigpPy5mb2N1cygpXG4gICAgICAgICAgICBAc2V0U2hlbGZTaXplIDBcbiAgICAgICAgICAgIFxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgICAgIFxuICAgIHJlZnJlc2g6ID0+XG5cbiAgICAgICAgaWYgQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIGtsb2cgJ3JlZnJlc2gnIEBsYXN0VXNlZENvbHVtbigpPy5wYXRoKClcbiAgICAgICAgICAgIEBuYXZpZ2F0ZVRvRmlsZSBAbGFzdFVzZWRDb2x1bW4oKT8ucGF0aCgpXG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZUJyb3dzZXJcbiJdfQ==
//# sourceURL=../coffee/filebrowser.coffee