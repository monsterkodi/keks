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
        if ((ref1 = this.viewer) != null) {
            ref1.close();
        }
        return this.viewer = null;
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
        var ref1;
        if (this.lastUsedColumn()) {
            return this.navigateToFile((ref1 = this.lastUsedColumn()) != null ? ref1.path() : void 0);
        }
    };

    return FileBrowser;

})(Browser);

module.exports = FileBrowser;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLG1LQUFBO0lBQUE7Ozs7QUFRQSxNQUFpRyxPQUFBLENBQVEsS0FBUixDQUFqRyxFQUFFLGVBQUYsRUFBUSxlQUFSLEVBQWMsaUJBQWQsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsZUFBMUMsRUFBZ0QsZUFBaEQsRUFBc0QsZUFBdEQsRUFBNEQsaUJBQTVELEVBQW1FLGVBQW5FLEVBQXlFLGlCQUF6RSxFQUFnRixXQUFoRixFQUFvRixXQUFwRixFQUF3RixTQUF4RixFQUEyRjs7QUFFM0YsT0FBQSxHQUFXLE9BQUEsQ0FBUSxXQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsSUFBQSxHQUFXLE9BQUEsQ0FBUSxjQUFSOztBQUNYLE9BQUEsR0FBVyxPQUFBLENBQVEsaUJBQVI7O0FBQ1gsTUFBQSxHQUFXLE9BQUEsQ0FBUSxjQUFSOztBQUNYLE1BQUEsR0FBVyxPQUFBLENBQVEsUUFBUjs7QUFFTDs7O0lBRUMscUJBQUMsSUFBRDs7Ozs7Ozs7UUFFQyw2Q0FBTSxJQUFOO1FBRUEsTUFBTSxDQUFDLFdBQVAsR0FBcUI7UUFFckIsSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxLQUFELEdBQVUsSUFBSSxLQUFKLENBQVUsSUFBVjtRQUNWLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBSSxNQUFKLENBQVcsSUFBWDtRQUNWLElBQUMsQ0FBQSxJQUFELEdBQVU7UUFFVixJQUFJLENBQUMsRUFBTCxDQUFRLE1BQVIsRUFBc0IsSUFBQyxDQUFBLE1BQXZCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxhQUFSLEVBQXNCLElBQUMsQ0FBQSxhQUF2QjtRQUNBLElBQUksQ0FBQyxF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VTs7MEJBUWQsV0FBQSxHQUFhLFNBQUE7QUFFVCxZQUFBO1FBQUEsSUFBRyxJQUFDLENBQUEsU0FBRCxHQUFhLENBQWhCO1lBQ0ksSUFBQyxDQUFBLFlBQUQsQ0FBYyxHQUFkLEVBREo7U0FBQSxNQUFBOztvQkFHcUIsQ0FBRSxLQUFuQixDQUFBOztZQUNBLElBQUMsQ0FBQSxZQUFELENBQWMsQ0FBZCxFQUpKOztlQU1BLElBQUMsQ0FBQSxtQkFBRCxDQUFBO0lBUlM7OzBCQVViLE9BQUEsR0FBUyxTQUFBO0FBRUwsWUFBQTtRQUFBLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUFIO21CQUNJLElBQUMsQ0FBQSxjQUFELDhDQUFpQyxDQUFFLElBQW5CLENBQUEsVUFBaEIsRUFESjs7SUFGSzs7OztHQWxkYTs7QUF1ZDFCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIG9wZW4sIHZhbGlkLCBlbXB0eSwgY2xhbXAsIHByZWZzLCBsYXN0LCBlbGVtLCBkcmFnLCBzdGF0ZSwga2xvZywgc2xhc2gsIGZzLCBvcywgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Ccm93c2VyICA9IHJlcXVpcmUgJy4vYnJvd3NlcidcblNoZWxmICAgID0gcmVxdWlyZSAnLi9zaGVsZidcblNlbGVjdCAgID0gcmVxdWlyZSAnLi9zZWxlY3QnXG5GaWxlICAgICA9IHJlcXVpcmUgJy4vdG9vbHMvZmlsZSdcbmRpcmxpc3QgID0gcmVxdWlyZSAnLi90b29scy9kaXJsaXN0J1xucGJ5dGVzICAgPSByZXF1aXJlICdwcmV0dHktYnl0ZXMnXG5tb21lbnQgICA9IHJlcXVpcmUgJ21vbWVudCdcblxuY2xhc3MgRmlsZUJyb3dzZXIgZXh0ZW5kcyBCcm93c2VyXG5cbiAgICBAOiAodmlldykgLT5cblxuICAgICAgICBzdXBlciB2aWV3XG5cbiAgICAgICAgd2luZG93LmZpbGVicm93c2VyID0gQFxuXG4gICAgICAgIEBsb2FkSUQgPSAwXG4gICAgICAgIEBzaGVsZiAgPSBuZXcgU2hlbGYgQFxuICAgICAgICBAc2VsZWN0ID0gbmV3IFNlbGVjdCBAXG4gICAgICAgIEBuYW1lICAgPSAnRmlsZUJyb3dzZXInXG5cbiAgICAgICAgcG9zdC5vbiAnZmlsZScgICAgICAgIEBvbkZpbGVcbiAgICAgICAgcG9zdC5vbiAnZmlsZWJyb3dzZXInIEBvbkZpbGVCcm93c2VyXG4gICAgICAgIHBvc3Qub24gJ29wZW5GaWxlJyAgICBAb25PcGVuRmlsZVxuXG4gICAgICAgIEBzaGVsZlJlc2l6ZSA9IGVsZW0gJ2RpdicgY2xhc3M6ICdzaGVsZlJlc2l6ZSdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUudG9wICAgICAgPSAnMHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUuYm90dG9tICAgPSAnMHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUubGVmdCAgICAgPSAnMTk0cHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS53aWR0aCAgICA9ICc2cHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5jdXJzb3IgICA9ICdldy1yZXNpemUnXG5cbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQHNoZWxmUmVzaXplXG4gICAgICAgICAgICBvbk1vdmU6ICBAb25TaGVsZkRyYWdcblxuICAgICAgICBAc2hlbGZTaXplID0gcHJlZnMuZ2V0ICdzaGVsZuKWuHNpemUnIDIwMFxuXG4gICAgICAgIEBpbml0Q29sdW1ucygpXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgICMgZHJvcEFjdGlvbjogKGV2ZW50LCB0YXJnZXQpIC0+XG4gICAgZHJvcEFjdGlvbjogKGFjdGlvbiwgc291cmNlcywgdGFyZ2V0KSAtPlxuICAgICAgICBcbiAgICAgICAgIyBhY3Rpb24gPSBldmVudC5nZXRNb2RpZmllclN0YXRlKCdTaGlmdCcpIGFuZCAnY29weScgb3IgJ21vdmUnXG4gICAgICAgIFxuICAgICAgICAjIHNvdXJjZXMgPSBldmVudC5kYXRhVHJhbnNmZXIuZ2V0RGF0YSgndGV4dC9wbGFpbicpLnNwbGl0ICdcXG4nXG4gICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5pc0ZpbGUgdGFyZ2V0XG4gICAgICAgICAgICB0YXJnZXQgPSBzbGFzaC5kaXIgdGFyZ2V0XG4gICAgICAgIFxuICAgICAgICBmb3Igc291cmNlIGluIHNvdXJjZXNcbiAgICAgICAgXG4gICAgICAgICAgICBpZiBhY3Rpb24gPT0gJ21vdmUnIFxuICAgICAgICAgICAgICAgIGlmIHNvdXJjZSA9PSB0YXJnZXQgb3Igc2xhc2guZGlyKHNvdXJjZSkgPT0gdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgIGtsb2cgJ25vb3AnXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICMga2xvZyBcImRyb3BBY3Rpb24gI3t0YXJnZXR9XCIgc291cmNlc1xuICAgICAgICBcbiAgICAgICAgZm9yIHNvdXJjZSBpbiBzb3VyY2VzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN3aXRjaCBhY3Rpb25cbiAgICAgICAgICAgICAgICB3aGVuICdtb3ZlJ1xuICAgICAgICAgICAgICAgICAgICBGaWxlLnJlbmFtZSBzb3VyY2UsIHRhcmdldCwgKHNvdXJjZSwgdGFyZ2V0KSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAga2xvZyBhY3Rpb24sIHNvdXJjZVxuICAgICAgICAgICAgICAgICAgICAgICAga2xvZyBhY3Rpb24sIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgc291cmNlQ29sdW1uID0gQGNvbHVtbkZvckZpbGUgc291cmNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZUNvbHVtbi5yZW1vdmVGaWxlIHNvdXJjZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdGFyZ2V0Q29sdW1uID0gQGNvbHVtbkZvckZpbGUgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IHRhcmdldENvbHVtbi5yb3cgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldENvbHVtbi5pbnNlcnRGaWxlIHRhcmdldFxuICAgICAgICAgICAgICAgIHdoZW4gJ2NvcHknXG4gICAgICAgICAgICAgICAgICAgIEZpbGUuY29weSBzb3VyY2UsIHRhcmdldCwgKHNvdXJjZSwgdGFyZ2V0KSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAga2xvZyBhY3Rpb24sIHNvdXJjZVxuICAgICAgICAgICAgICAgICAgICAgICAga2xvZyBhY3Rpb24sIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdGFyZ2V0Q29sdW1uID0gQGNvbHVtbkZvckZpbGUgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IHRhcmdldENvbHVtbi5yb3cgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldENvbHVtbi5pbnNlcnRGaWxlIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICBcbiAgICBjb2x1bW5Gb3JGaWxlOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbHVtbi5wYXJlbnQ/LmZpbGUgPT0gc2xhc2guZGlyIGZpbGVcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sdW1uXG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHNoYXJlZENvbHVtbkluZGV4OiAoZmlsZSkgLT4gXG4gICAgICAgIFxuICAgICAgICBjb2wgPSAwXG4gICAgICAgIFxuICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBjb2x1bW4uaXNEaXIoKSBhbmQgZmlsZS5zdGFydHNXaXRoIGNvbHVtbi5wYXRoKClcbiAgICAgICAgICAgICAgICBjb2wgKz0gMVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbCA9PSAxIGFuZCBzbGFzaC5kaXIoZmlsZSkgIT0gQGNvbHVtbnNbMF0/LnBhdGgoKVxuICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgTWF0aC5tYXggLTEsIGNvbC0yXG5cbiAgICBjbG9zZVZpZXdlcjogLT5cbiAgICAgICAgXG4gICAgICAgIEB2aWV3ZXI/LmNsb3NlKClcbiAgICAgICAgQHZpZXdlciA9IG51bGxcbiAgICAgICAgXG4gICAgYnJvd3NlOiAoZmlsZSwgb3B0KSAtPiBcbiAgICBcbiAgICAgICAgQGNsb3NlVmlld2VyKClcbiAgICAgICAgXG4gICAgICAgIGlmIGZpbGUgdGhlbiBAbG9hZEl0ZW0gQGZpbGVJdGVtKGZpbGUpLCBvcHRcbiAgICAgICAgXG4gICAgbmF2aWdhdGVUb0ZpbGU6IChmaWxlKSAtPlxuXG4gICAgICAgIEBjbG9zZVZpZXdlcigpXG4gICAgICAgIFxuICAgICAgICBsYXN0UGF0aCA9IEBsYXN0RGlyQ29sdW1uKCk/LnBhdGgoKVxuICAgICAgICBcbiAgICAgICAgZmlsZSA9IHNsYXNoLnBhdGggZmlsZVxuICAgICAgICBcbiAgICAgICAgaWYgZmlsZSA9PSBsYXN0UGF0aCBvciBzbGFzaC5pc1JlbGF0aXZlIGZpbGVcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGNvbCA9IEBzaGFyZWRDb2x1bW5JbmRleCBmaWxlXG4gICAgICAgIFxuICAgICAgICBmaWxlbGlzdCA9IHNsYXNoLnBhdGhsaXN0IGZpbGVcbiAgICAgICAgXG4gICAgICAgIGlmIGNvbCA+PSAwXG4gICAgICAgICAgICBwYXRocyA9IGZpbGVsaXN0LnNsaWNlIGZpbGVsaXN0LmluZGV4T2YoQGNvbHVtbnNbY29sXS5wYXRoKCkpKzFcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcGF0aHMgPSBmaWxlbGlzdC5zbGljZSBmaWxlbGlzdC5sZW5ndGgtMlxuICAgICAgICAgICAgXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbCsxLCBwb3A6dHJ1ZSBjbGVhcjpjb2wrcGF0aHMubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICB3aGlsZSBAbnVtQ29scygpIDwgcGF0aHMubGVuZ3RoXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBmb3IgaW5kZXggaW4gWzAuLi5wYXRocy5sZW5ndGhdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGl0ZW0gPSBAZmlsZUl0ZW0gcGF0aHNbaW5kZXhdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgICAgICB3aGVuICdmaWxlJyB0aGVuIEBsb2FkRmlsZUl0ZW0gaXRlbSwgY29sKzEraW5kZXhcbiAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgIG9wdCA9IHt9XG4gICAgICAgICAgICAgICAgICAgIGlmIGluZGV4IDwgcGF0aHMubGVuZ3RoLTFcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdC5hY3RpdmUgPSBwYXRoc1tpbmRleCsxXVxuICAgICAgICAgICAgICAgICAgICBAbG9hZERpckl0ZW0gaXRlbSwgY29sKzEraW5kZXgsIG9wdFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgY29sID0gQGxhc3REaXJDb2x1bW4oKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiByb3cgPSBjb2wucm93KHNsYXNoLmZpbGUgZmlsZSlcbiAgICAgICAgICAgICAgICByb3cuc2V0QWN0aXZlKClcblxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGZpbGVJdGVtOiAocGF0aCkgLT5cbiAgICAgICAgXG4gICAgICAgIHAgPSBzbGFzaC5yZXNvbHZlIHBhdGhcbiAgICAgICAgZmlsZTpwXG4gICAgICAgIHR5cGU6c2xhc2guaXNGaWxlKHApIGFuZCAnZmlsZScgb3IgJ2RpcidcbiAgICAgICAgbmFtZTpzbGFzaC5maWxlIHBcbiAgICAgICAgXG4gICAgb25GaWxlQnJvd3NlcjogKGFjdGlvbiwgaXRlbSwgYXJnKSA9PlxuXG4gICAgICAgIHN3aXRjaCBhY3Rpb25cbiAgICAgICAgICAgIHdoZW4gJ2xvYWRJdGVtJyAgICAgdGhlbiBAbG9hZEl0ZW0gICAgIGl0ZW0sIGFyZ1xuICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkRGlyOiAocGF0aCkgLT4gQGxvYWRJdGVtIHR5cGU6J2RpcicgZmlsZTpwYXRoXG4gICAgXG4gICAgbG9hZEl0ZW06IChpdGVtLCBvcHQpIC0+XG5cbiAgICAgICAgb3B0ID89IGFjdGl2ZTonLi4nIGZvY3VzOnRydWVcbiAgICAgICAgaXRlbS5uYW1lID89IHNsYXNoLmZpbGUgaXRlbS5maWxlXG5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gMSwgcG9wOnRydWUsIGNsZWFyOm9wdC5jbGVhciA/IDFcblxuICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICB3aGVuICdkaXInICB0aGVuIEBsb2FkRGlySXRlbSBpdGVtLCAwLCBvcHRcbiAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIFxuICAgICAgICAgICAgICAgIG9wdC5hY3RpdmF0ZSA9IGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgIHdoaWxlIEBudW1Db2xzKCkgPCAyIHRoZW4gQGFkZENvbHVtbigpXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtIEBmaWxlSXRlbShzbGFzaC5kaXIoaXRlbS5maWxlKSksIDAsIG9wdFxuXG4gICAgICAgIGlmIG9wdC5mb2N1c1xuICAgICAgICAgICAgQGNvbHVtbnNbMF0/LmZvY3VzKClcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxvYWRGaWxlSXRlbTogKGl0ZW0sIGNvbD0wKSAtPlxuXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbCwgcG9wOnRydWVcblxuICAgICAgICB3aGlsZSBjb2wgPj0gQG51bUNvbHMoKVxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG5cbiAgICAgICAgZmlsZSA9IGl0ZW0uZmlsZVxuXG4gICAgICAgIEBjb2x1bW5zW2NvbF0ucGFyZW50ID0gaXRlbVxuICAgICAgICBcbiAgICAgICAgaWYgRmlsZS5pc0ltYWdlIGZpbGVcbiAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0udGFibGUuYXBwZW5kQ2hpbGQgQGltYWdlSW5mbyBmaWxlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHN3aXRjaCBzbGFzaC5leHQgZmlsZVxuICAgICAgICAgICAgICAgIHdoZW4gJ3RpZmYnICd0aWYnXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgICAgICAgICAgQGNvbnZlcnRJbWFnZSByb3dcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBAZmlsZUluZm8gZmlsZVxuICAgICAgICAgICAgICAgIHdoZW4gJ3B4bSdcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgICAgICBAY29udmVydFBYTSByb3dcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBAZmlsZUluZm8gZmlsZVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBAZmlsZUluZm8gZmlsZVxuXG4gICAgICAgIHBvc3QuZW1pdCAnbG9hZCcgY29sdW1uOmNvbCwgaXRlbTppdGVtXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcblxuICAgICMgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgaW1hZ2VJbmZvOiAoZmlsZSkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICBpbWcgPSBlbGVtICdpbWcnIGNsYXNzOidicm93c2VySW1hZ2UnIHNyYzpzbGFzaC5maWxlVXJsIGZpbGVcbiAgICAgICAgY250ID0gZWxlbSBjbGFzczonYnJvd3NlckltYWdlQ29udGFpbmVyJyBjaGlsZDppbWdcbiAgICAgICAgY250LmFkZEV2ZW50TGlzdGVuZXIgJ2RibGNsaWNrJyAtPiBvcGVuIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGltZy5vbmxvYWQgPSAtPlxuICAgICAgICAgICAgaW1nID0kICcuYnJvd3NlckltYWdlJ1xuICAgICAgICAgICAgYnIgPSBpbWcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgIHggPSBpbWcuY2xpZW50WFxuICAgICAgICAgICAgd2lkdGggID0gcGFyc2VJbnQgYnIucmlnaHQgLSBici5sZWZ0IC0gMlxuICAgICAgICAgICAgaGVpZ2h0ID0gcGFyc2VJbnQgYnIuYm90dG9tIC0gYnIudG9wIC0gMlxuXG4gICAgICAgICAgICBpbWcuc3R5bGUub3BhY2l0eSAgID0gJzEnXG4gICAgICAgICAgICBpbWcuc3R5bGUubWF4V2lkdGggID0gJzEwMCUnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN0YXQgPSBzbGFzaC5maWxlRXhpc3RzIGZpbGVcbiAgICAgICAgICAgIHNpemUgPSBwYnl0ZXMoc3RhdC5zaXplKS5zcGxpdCAnICdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgYWdlID0gbW9tZW50KCkudG8obW9tZW50KHN0YXQubXRpbWUpLCB0cnVlKVxuICAgICAgICAgICAgW251bSwgcmFuZ2VdID0gYWdlLnNwbGl0ICcgJ1xuICAgICAgICAgICAgbnVtID0gJzEnIGlmIG51bVswXSA9PSAnYSdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaHRtbCAgPSBcIjx0cj48dGggY29sc3Bhbj0yPiN7d2lkdGh9PHNwYW4gY2xhc3M9J3B1bmN0Jz54PC9zcGFuPiN7aGVpZ2h0fTwvdGg+PC90cj5cIlxuICAgICAgICAgICAgaHRtbCArPSBcIjx0cj48dGg+I3tzaXplWzBdfTwvdGg+PHRkPiN7c2l6ZVsxXX08L3RkPjwvdHI+XCJcbiAgICAgICAgICAgIGh0bWwgKz0gXCI8dHI+PHRoPiN7bnVtfTwvdGg+PHRkPiN7cmFuZ2V9PC90ZD48L3RyPlwiXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGluZm8gPSBlbGVtIGNsYXNzOidicm93c2VyRmlsZUluZm8nIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAgZWxlbSAnZGl2JyBjbGFzczpcImZpbGVJbmZvRmlsZSAje3NsYXNoLmV4dCBmaWxlfVwiIGh0bWw6RmlsZS5zcGFuIGZpbGVcbiAgICAgICAgICAgICAgICBlbGVtICd0YWJsZScgY2xhc3M6XCJmaWxlSW5mb0RhdGFcIiBodG1sOmh0bWxcbiAgICAgICAgICAgIF1cbiAgICAgICAgICAgIGNudCA9JCAnLmJyb3dzZXJJbWFnZUNvbnRhaW5lcidcbiAgICAgICAgICAgIGNudC5hcHBlbmRDaGlsZCBpbmZvXG4gICAgICAgIFxuICAgICAgICBjbnRcbiAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgICAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIFxuICAgICAgICBcbiAgICBmaWxlSW5mbzogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBzdGF0ID0gc2xhc2guZmlsZUV4aXN0cyBmaWxlXG4gICAgICAgIHNpemUgPSBwYnl0ZXMoc3RhdC5zaXplKS5zcGxpdCAnICdcbiAgICAgICAgXG4gICAgICAgIHQgPSBtb21lbnQgc3RhdC5tdGltZVxuXG4gICAgICAgIGFnZSA9IG1vbWVudCgpLnRvKHQsIHRydWUpXG4gICAgICAgIFtudW0sIHJhbmdlXSA9IGFnZS5zcGxpdCAnICdcbiAgICAgICAgbnVtID0gJzEnIGlmIG51bVswXSA9PSAnYSdcbiAgICAgICAgaWYgcmFuZ2UgPT0gJ2ZldydcbiAgICAgICAgICAgIG51bSA9IG1vbWVudCgpLmRpZmYgdCwgJ3NlY29uZHMnXG4gICAgICAgICAgICByYW5nZSA9ICdzZWNvbmRzJ1xuICAgICAgICBcbiAgICAgICAgaW5mbyA9IGVsZW0gY2xhc3M6J2Jyb3dzZXJGaWxlSW5mbycgY2hpbGRyZW46IFtcbiAgICAgICAgICAgIGVsZW0gJ2RpdicgY2xhc3M6XCJmaWxlSW5mb0ljb24gI3tzbGFzaC5leHQgZmlsZX0gI3tGaWxlLmljb25DbGFzc05hbWUgZmlsZX1cIlxuICAgICAgICAgICAgZWxlbSAnZGl2JyBjbGFzczpcImZpbGVJbmZvRmlsZSAje3NsYXNoLmV4dCBmaWxlfVwiIGh0bWw6RmlsZS5zcGFuIGZpbGVcbiAgICAgICAgICAgIGVsZW0gJ3RhYmxlJyBjbGFzczpcImZpbGVJbmZvRGF0YVwiIGh0bWw6XCI8dHI+PHRoPiN7c2l6ZVswXX08L3RoPjx0ZD4je3NpemVbMV19PC90ZD48L3RyPjx0cj48dGg+I3tudW19PC90aD48dGQ+I3tyYW5nZX08L3RkPjwvdHI+XCJcbiAgICAgICAgXVxuICAgICAgICBcbiAgICAgICAgaW5mby5hZGRFdmVudExpc3RlbmVyICdkYmxjbGljaycgLT4gb3BlbiBmaWxlXG4gICAgICAgIFxuICAgICAgICBpbmZvXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkRGlySXRlbTogKGl0ZW0sIGNvbD0wLCBvcHQ9e30pIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIGNvbCA+IDAgYW5kIGl0ZW0ubmFtZSA9PSAnLydcblxuICAgICAgICBkaXIgPSBpdGVtLmZpbGVcblxuICAgICAgICBvcHQuaWdub3JlSGlkZGVuID0gbm90IHByZWZzLmdldCBcImJyb3dzZXLilrhzaG93SGlkZGVu4pa4I3tkaXJ9XCJcblxuICAgICAgICBkaXJsaXN0IGRpciwgb3B0LCAoaXRlbXMpID0+XG5cbiAgICAgICAgICAgIGlmIEBjb2x1bW5zLmxlbmd0aCBhbmQgY29sID49IEBjb2x1bW5zLmxlbmd0aCBhbmQgQHNraXBPbkRibENsaWNrXG4gICAgICAgICAgICAgICAgZGVsZXRlIEBza2lwT25EYmxDbGlja1xuICAgICAgICAgICAgICAgIHJldHVybiBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEBsb2FkRGlySXRlbXMgZGlyLCBpdGVtLCBpdGVtcywgY29sLCBvcHRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGxvYWREaXJJdGVtczogKGRpciwgaXRlbSwgaXRlbXMsIGNvbCwgb3B0KSA9PlxuXG4gICAgICAgIHVwZGlyID0gc2xhc2gucmVzb2x2ZSBzbGFzaC5qb2luIGRpciwgJy4uJ1xuXG4gICAgICAgIGlmIGNvbCA9PSAwIG9yIGNvbC0xIDwgQG51bUNvbHMoKSBhbmQgQGNvbHVtbnNbY29sLTFdLmFjdGl2ZVJvdygpPy5pdGVtLm5hbWUgPT0gJy4uJ1xuICAgICAgICAgICAgaWYgaXRlbXNbMF0/Lm5hbWUgbm90IGluIFsnLi4nICcvJ11cbiAgICAgICAgICAgICAgICBpZiB1cGRpciAhPSBkaXJcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMudW5zaGlmdFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJy4uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6ICB1cGRpclxuXG4gICAgICAgIHdoaWxlIGNvbCA+PSBAbnVtQ29scygpXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcblxuICAgICAgICBAY29sdW1uc1tjb2xdLmxvYWRJdGVtcyBpdGVtcywgaXRlbVxuXG4gICAgICAgIHBvc3QuZW1pdCAnbG9hZCcgY29sdW1uOmNvbCwgaXRlbTppdGVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG9wdC5hY3RpdmF0ZVxuICAgICAgICAgICAgaWYgcm93ID0gQGNvbHVtbnNbY29sXS5yb3cgc2xhc2guZmlsZSBvcHQuYWN0aXZhdGVcbiAgICAgICAgICAgICAgICByb3cuYWN0aXZhdGUoKVxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnbG9hZCcgY29sdW1uOmNvbCsxIGl0ZW06cm93Lml0ZW1cbiAgICAgICAgZWxzZSBpZiBvcHQuYWN0aXZlXG4gICAgICAgICAgICBAY29sdW1uc1tjb2xdLnJvdyhzbGFzaC5maWxlIG9wdC5hY3RpdmUpPy5zZXRBY3RpdmUoKVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG9wdC5mb2N1cyAhPSBmYWxzZSBhbmQgZW1wdHkoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkgYW5kIGVtcHR5KCQoJy5wb3B1cCcpPy5vdXRlckhUTUwpXG4gICAgICAgICAgICBpZiBjb2wgPSBAbGFzdERpckNvbHVtbigpXG4gICAgICAgICAgICAgICAgY29sLmRpdi5mb2N1cygpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIG9wdC5jYj8gY29sdW1uOmNvbCwgaXRlbTppdGVtXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IGZpbGVcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuXG4gICAgICAgIEBuYXZpZ2F0ZVRvRmlsZSBmaWxlXG5cbiAgICBvbk9wZW5GaWxlOiAoZmlsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIG9wZW4gZmlsZVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBpbml0Q29sdW1uczogLT5cblxuICAgICAgICBzdXBlcigpXG5cbiAgICAgICAgQHZpZXcuaW5zZXJ0QmVmb3JlIEBzaGVsZi5kaXYsIEB2aWV3LmZpcnN0Q2hpbGRcbiAgICAgICAgQHZpZXcuaW5zZXJ0QmVmb3JlIEBzaGVsZlJlc2l6ZSwgbnVsbFxuXG4gICAgICAgIEBzaGVsZi5icm93c2VyRGlkSW5pdENvbHVtbnMoKVxuXG4gICAgICAgIEBzZXRTaGVsZlNpemUgQHNoZWxmU2l6ZVxuXG4gICAgY29sdW1uQXRQb3M6IChwb3MpIC0+XG5cbiAgICAgICAgaWYgY29sdW1uID0gc3VwZXIgcG9zXG4gICAgICAgICAgICByZXR1cm4gY29sdW1uXG5cbiAgICAgICAgaWYgZWxlbS5jb250YWluc1BvcyBAc2hlbGYuZGl2LCBwb3NcbiAgICAgICAgICAgIHJldHVybiBAc2hlbGZcbiAgICAgICAgICAgIFxuICAgIGxhc3RDb2x1bW5QYXRoOiAtPlxuXG4gICAgICAgIGlmIGxhc3RDb2x1bW4gPSBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW4ucGF0aCgpXG5cbiAgICBsYXN0RGlyQ29sdW1uOiAtPlxuXG4gICAgICAgIGlmIGxhc3RDb2x1bW4gPSBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgaWYgbGFzdENvbHVtbi5pc0RpcigpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW5cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtbi5wcmV2Q29sdW1uKClcblxuICAgIG9uQmFja3NwYWNlSW5Db2x1bW46IChjb2x1bW4pIC0+XG5cbiAgICAgICAgY29sdW1uLmJhY2tzcGFjZVNlYXJjaCgpXG4gICAgICAgIFxuICAgIG9uRGVsZXRlSW5Db2x1bW46IChjb2x1bW4pIC0+IFxuICAgIFxuICAgICAgICBpZiBjb2x1bW4uc2VhcmNoRGl2XG4gICAgICAgICAgICBjb2x1bW4uY2xlYXJTZWFyY2goKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb2x1bW4ubW92ZVRvVHJhc2goKVxuICAgICAgICBcbiAgICB1cGRhdGVDb2x1bW5TY3JvbGxzOiA9PlxuXG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgQHNoZWxmLnNjcm9sbC51cGRhdGUoKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDBcblxuICAgIG9uU2hlbGZEcmFnOiAoZHJhZywgZXZlbnQpID0+XG5cbiAgICAgICAgc2hlbGZTaXplID0gY2xhbXAgMCwgNDAwLCBkcmFnLnBvcy54XG4gICAgICAgIEBzZXRTaGVsZlNpemUgc2hlbGZTaXplXG5cbiAgICBzZXRTaGVsZlNpemU6IChAc2hlbGZTaXplKSAtPlxuXG4gICAgICAgIHByZWZzLnNldCAnc2hlbGbilrhzaXplJyBAc2hlbGZTaXplXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5sZWZ0ID0gXCIje0BzaGVsZlNpemV9cHhcIlxuICAgICAgICBAc2hlbGYuZGl2LnN0eWxlLndpZHRoID0gXCIje0BzaGVsZlNpemV9cHhcIlxuICAgICAgICBAY29scy5zdHlsZS5sZWZ0ID0gXCIje0BzaGVsZlNpemV9cHhcIlxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG5cbiAgICB0b2dnbGVTaGVsZjogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBzaGVsZlNpemUgPCAxXG4gICAgICAgICAgICBAc2V0U2hlbGZTaXplIDIwMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbGFzdFVzZWRDb2x1bW4oKT8uZm9jdXMoKVxuICAgICAgICAgICAgQHNldFNoZWxmU2l6ZSAwXG4gICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICBcbiAgICByZWZyZXNoOiA9PlxuXG4gICAgICAgIGlmIEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICBAbmF2aWdhdGVUb0ZpbGUgQGxhc3RVc2VkQ29sdW1uKCk/LnBhdGgoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVCcm93c2VyXG4iXX0=
//# sourceURL=../coffee/filebrowser.coffee