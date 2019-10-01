// koffee 1.4.0

/*
00000000  000  000      00000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000
000       000  000      000             000   000  000   000  000   000  000 0 000  000       000       000   000
000000    000  000      0000000         0000000    0000000    000   000  000000000  0000000   0000000   0000000
000       000  000      000             000   000  000   000  000   000  000   000       000  000       000   000
000       000  0000000  00000000        0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var $, Browser, File, FileBrowser, Shelf, _, clamp, dirlist, drag, elem, empty, fs, klog, last, moment, open, os, pbytes, post, prefs, ref, slash, state, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, open = ref.open, valid = ref.valid, empty = ref.empty, clamp = ref.clamp, prefs = ref.prefs, last = ref.last, elem = ref.elem, drag = ref.drag, state = ref.state, klog = ref.klog, slash = ref.slash, fs = ref.fs, os = ref.os, $ = ref.$, _ = ref._;

Browser = require('./browser');

Shelf = require('./shelf');

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

    FileBrowser.prototype.dropAction = function(action, source, target) {
        if (action === 'move') {
            if (source === target || slash.dir(source) === target) {
                klog('noop');
                return;
            }
        }
        switch (action) {
            case 'move':
                return File.rename(source, target, (function(_this) {
                    return function(newFile) {
                        var sourceColumn, targetColumn;
                        klog('moved', source, target);
                        if (sourceColumn = _this.columnForFile(source)) {
                            sourceColumn.removeFile(source);
                        }
                        if (targetColumn = _this.columnForFile(newFile)) {
                            return targetColumn.insertFile(newFile);
                        }
                    };
                })(this));
            case 'copy':
                return File.copy(source, target, (function(_this) {
                    return function(newFile) {
                        var targetColumn;
                        klog('copied', source, target);
                        if (targetColumn = _this.columnForFile(newFile)) {
                            return targetColumn.addFile(newFile);
                        }
                    };
                })(this));
        }
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

    FileBrowser.prototype.browse = function(file, opt) {
        if (file) {
            return this.loadItem(this.fileItem(file), opt);
        }
    };

    FileBrowser.prototype.navigateToFile = function(file) {
        var col, filelist, i, index, item, lastPath, opt, paths, ref1, ref2, row;
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
            case 'activateItem':
                return this.activateItem(item, arg);
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

    FileBrowser.prototype.activateItem = function(item, col) {
        if (this.columns[col + 1]) {
            if (slash.samePath(item.file, this.columns[col + 1].path())) {
                return;
            }
        }
        this.clearColumnsFrom(col + 1, {
            pop: true,
            clear: col + 1
        });
        switch (item.type) {
            case 'dir':
                return this.loadDirItem(item, col + 1, {
                    focus: false
                });
            case 'file':
                return this.loadFileItem(item, col + 1);
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
        switch (slash.ext(file)) {
            case 'gif':
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'svg':
            case 'bmp':
            case 'ico':
                this.columns[col].table.appendChild(this.imageInfo(file));
                break;
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
            return function(err, items) {
                if (err != null) {
                    return;
                }
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
        var ref1, ref2, ref3, ref4, row, updir;
        updir = slash.resolve(slash.join(dir, '..'));
        if (col === 0 || col - 1 < this.numCols() && ((ref1 = this.columns[col - 1].activeRow()) != null ? ref1.item.name : void 0) === '..') {
            if ((ref2 = items[0].name) !== '..' && ref2 !== '/') {
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
            if ((ref3 = this.columns[col].row(slash.file(opt.active))) != null) {
                ref3.setActive();
            }
        }
        if (opt.focus !== false && empty(document.activeElement) && empty((ref4 = $('.popup')) != null ? ref4.outerHTML : void 0)) {
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
        column.clearSearch();
        return this.navigate('left');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDJKQUFBO0lBQUE7Ozs7QUFRQSxNQUFpRyxPQUFBLENBQVEsS0FBUixDQUFqRyxFQUFFLGVBQUYsRUFBUSxlQUFSLEVBQWMsaUJBQWQsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsZUFBMUMsRUFBZ0QsZUFBaEQsRUFBc0QsZUFBdEQsRUFBNEQsaUJBQTVELEVBQW1FLGVBQW5FLEVBQXlFLGlCQUF6RSxFQUFnRixXQUFoRixFQUFvRixXQUFwRixFQUF3RixTQUF4RixFQUEyRjs7QUFFM0YsT0FBQSxHQUFXLE9BQUEsQ0FBUSxXQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7QUFDWCxJQUFBLEdBQVcsT0FBQSxDQUFRLGNBQVI7O0FBQ1gsT0FBQSxHQUFXLE9BQUEsQ0FBUSxpQkFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLGNBQVI7O0FBQ1gsTUFBQSxHQUFXLE9BQUEsQ0FBUSxRQUFSOztBQUVMOzs7SUFFVyxxQkFBQyxJQUFEOzs7Ozs7OztRQUVULDZDQUFNLElBQU47UUFFQSxNQUFNLENBQUMsV0FBUCxHQUFxQjtRQUVyQixJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLEtBQUQsR0FBVSxJQUFJLEtBQUosQ0FBVSxJQUFWO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUVWLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUFzQixJQUFDLENBQUEsTUFBdkI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLGFBQVIsRUFBc0IsSUFBQyxDQUFBLGFBQXZCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxVQUFSLEVBQXNCLElBQUMsQ0FBQSxVQUF2QjtRQUVBLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQSxDQUFLLEtBQUws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QUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQVosR0FBc0IsSUFBQyxDQUFBLFNBQUYsR0FBWTtlQUNqQyxJQUFDLENBQUEsbUJBQUQsQ0FBQTtJQU5VOzswQkFRZCxXQUFBLEdBQWEsU0FBQTtBQUVULFlBQUE7UUFBQSxJQUFHLElBQUMsQ0FBQSxTQUFELEdBQWEsQ0FBaEI7WUFDSSxJQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsRUFESjtTQUFBLE1BQUE7O29CQUdxQixDQUFFLEtBQW5CLENBQUE7O1lBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBYyxDQUFkLEVBSko7O2VBTUEsSUFBQyxDQUFBLG1CQUFELENBQUE7SUFSUzs7MEJBVWIsT0FBQSxHQUFTLFNBQUE7QUFFTCxZQUFBO1FBQUEsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFBLENBQUg7bUJBQ0ksSUFBQyxDQUFBLGNBQUQsOENBQWlDLENBQUUsSUFBbkIsQ0FBQSxVQUFoQixFQURKOztJQUZLOzs7O0dBbmNhOztBQXdjMUIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgb3BlbiwgdmFsaWQsIGVtcHR5LCBjbGFtcCwgcHJlZnMsIGxhc3QsIGVsZW0sIGRyYWcsIHN0YXRlLCBrbG9nLCBzbGFzaCwgZnMsIG9zLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbkJyb3dzZXIgID0gcmVxdWlyZSAnLi9icm93c2VyJ1xuU2hlbGYgICAgPSByZXF1aXJlICcuL3NoZWxmJ1xuRmlsZSAgICAgPSByZXF1aXJlICcuL3Rvb2xzL2ZpbGUnXG5kaXJsaXN0ICA9IHJlcXVpcmUgJy4vdG9vbHMvZGlybGlzdCdcbnBieXRlcyAgID0gcmVxdWlyZSAncHJldHR5LWJ5dGVzJ1xubW9tZW50ICAgPSByZXF1aXJlICdtb21lbnQnXG5cbmNsYXNzIEZpbGVCcm93c2VyIGV4dGVuZHMgQnJvd3NlclxuXG4gICAgY29uc3RydWN0b3I6ICh2aWV3KSAtPlxuXG4gICAgICAgIHN1cGVyIHZpZXdcblxuICAgICAgICB3aW5kb3cuZmlsZWJyb3dzZXIgPSBAXG5cbiAgICAgICAgQGxvYWRJRCA9IDBcbiAgICAgICAgQHNoZWxmICA9IG5ldyBTaGVsZiBAXG4gICAgICAgIEBuYW1lICAgPSAnRmlsZUJyb3dzZXInXG5cbiAgICAgICAgcG9zdC5vbiAnZmlsZScgICAgICAgIEBvbkZpbGVcbiAgICAgICAgcG9zdC5vbiAnZmlsZWJyb3dzZXInIEBvbkZpbGVCcm93c2VyXG4gICAgICAgIHBvc3Qub24gJ29wZW5GaWxlJyAgICBAb25PcGVuRmlsZVxuXG4gICAgICAgIEBzaGVsZlJlc2l6ZSA9IGVsZW0gJ2RpdicgY2xhc3M6ICdzaGVsZlJlc2l6ZSdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUudG9wICAgICAgPSAnMHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUuYm90dG9tICAgPSAnMHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUubGVmdCAgICAgPSAnMTk0cHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS53aWR0aCAgICA9ICc2cHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5jdXJzb3IgICA9ICdldy1yZXNpemUnXG5cbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQHNoZWxmUmVzaXplXG4gICAgICAgICAgICBvbk1vdmU6ICBAb25TaGVsZkRyYWdcblxuICAgICAgICBAc2hlbGZTaXplID0gcHJlZnMuZ2V0ICdzaGVsZuKWuHNpemUnIDIwMFxuXG4gICAgICAgIEBpbml0Q29sdW1ucygpXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGRyb3BBY3Rpb246IChhY3Rpb24sIHNvdXJjZSwgdGFyZ2V0KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgYWN0aW9uID09ICdtb3ZlJyBcbiAgICAgICAgICAgIGlmIHNvdXJjZSA9PSB0YXJnZXQgb3Igc2xhc2guZGlyKHNvdXJjZSkgPT0gdGFyZ2V0XG4gICAgICAgICAgICAgICAga2xvZyAnbm9vcCdcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICAjIGtsb2cgYWN0aW9uLCBzb3VyY2UsIHRhcmdldFxuICAgICAgICBzd2l0Y2ggYWN0aW9uXG4gICAgICAgICAgICB3aGVuICdtb3ZlJ1xuICAgICAgICAgICAgICAgIEZpbGUucmVuYW1lIHNvdXJjZSwgdGFyZ2V0LCAobmV3RmlsZSkgPT5cbiAgICAgICAgICAgICAgICAgICAga2xvZyAnbW92ZWQnIHNvdXJjZSwgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgIGlmIHNvdXJjZUNvbHVtbiA9IEBjb2x1bW5Gb3JGaWxlIHNvdXJjZSBcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZUNvbHVtbi5yZW1vdmVGaWxlIHNvdXJjZVxuICAgICAgICAgICAgICAgICAgICBpZiB0YXJnZXRDb2x1bW4gPSBAY29sdW1uRm9yRmlsZSBuZXdGaWxlXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRDb2x1bW4uaW5zZXJ0RmlsZSBuZXdGaWxlXG4gICAgICAgICAgICB3aGVuICdjb3B5J1xuICAgICAgICAgICAgICAgIEZpbGUuY29weSBzb3VyY2UsIHRhcmdldCwgKG5ld0ZpbGUpID0+XG4gICAgICAgICAgICAgICAgICAgIGtsb2cgJ2NvcGllZCcgc291cmNlLCB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgaWYgdGFyZ2V0Q29sdW1uID0gQGNvbHVtbkZvckZpbGUgbmV3RmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Q29sdW1uLmFkZEZpbGUgbmV3RmlsZVxuICAgICAgICAgICAgICAgICAgICBcbiAgICBjb2x1bW5Gb3JGaWxlOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbHVtbi5wYXJlbnQ/LmZpbGUgPT0gc2xhc2guZGlyIGZpbGVcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sdW1uXG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHNoYXJlZENvbHVtbkluZGV4OiAoZmlsZSkgLT4gXG4gICAgICAgIFxuICAgICAgICBjb2wgPSAwXG4gICAgICAgIFxuICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBjb2x1bW4uaXNEaXIoKSBhbmQgZmlsZS5zdGFydHNXaXRoIGNvbHVtbi5wYXRoKClcbiAgICAgICAgICAgICAgICBjb2wgKz0gMVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbCA9PSAxIGFuZCBzbGFzaC5kaXIoZmlsZSkgIT0gQGNvbHVtbnNbMF0/LnBhdGgoKVxuICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgTWF0aC5tYXggLTEsIGNvbC0yXG5cbiAgICBicm93c2U6IChmaWxlLCBvcHQpIC0+IGlmIGZpbGUgdGhlbiBAbG9hZEl0ZW0gQGZpbGVJdGVtKGZpbGUpLCBvcHRcbiAgICAgICAgXG4gICAgbmF2aWdhdGVUb0ZpbGU6IChmaWxlKSAtPlxuICAgICAgICAgICAgICAgIFxuICAgICAgICBsYXN0UGF0aCA9IEBsYXN0RGlyQ29sdW1uKCk/LnBhdGgoKVxuICAgICAgICBcbiAgICAgICAgZmlsZSA9IHNsYXNoLnBhdGggZmlsZVxuICAgICAgICBcbiAgICAgICAgaWYgZmlsZSA9PSBsYXN0UGF0aCBvciBzbGFzaC5pc1JlbGF0aXZlIGZpbGVcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGNvbCA9IEBzaGFyZWRDb2x1bW5JbmRleCBmaWxlXG4gICAgICAgIFxuICAgICAgICBmaWxlbGlzdCA9IHNsYXNoLnBhdGhsaXN0IGZpbGVcbiAgICAgICAgXG4gICAgICAgIGlmIGNvbCA+PSAwXG4gICAgICAgICAgICBwYXRocyA9IGZpbGVsaXN0LnNsaWNlIGZpbGVsaXN0LmluZGV4T2YoQGNvbHVtbnNbY29sXS5wYXRoKCkpKzFcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcGF0aHMgPSBmaWxlbGlzdC5zbGljZSBmaWxlbGlzdC5sZW5ndGgtMlxuICAgICAgICAgICAgXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbCsxLCBwb3A6dHJ1ZSBjbGVhcjpjb2wrcGF0aHMubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICB3aGlsZSBAbnVtQ29scygpIDwgcGF0aHMubGVuZ3RoXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBmb3IgaW5kZXggaW4gWzAuLi5wYXRocy5sZW5ndGhdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGl0ZW0gPSBAZmlsZUl0ZW0gcGF0aHNbaW5kZXhdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgICAgICB3aGVuICdmaWxlJyB0aGVuIEBsb2FkRmlsZUl0ZW0gaXRlbSwgY29sKzEraW5kZXhcbiAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgIG9wdCA9IHt9XG4gICAgICAgICAgICAgICAgICAgIGlmIGluZGV4IDwgcGF0aHMubGVuZ3RoLTFcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdC5hY3RpdmUgPSBwYXRoc1tpbmRleCsxXVxuICAgICAgICAgICAgICAgICAgICBAbG9hZERpckl0ZW0gaXRlbSwgY29sKzEraW5kZXgsIG9wdFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgY29sID0gQGxhc3REaXJDb2x1bW4oKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiByb3cgPSBjb2wucm93KHNsYXNoLmZpbGUgZmlsZSlcbiAgICAgICAgICAgICAgICByb3cuc2V0QWN0aXZlKClcblxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGZpbGVJdGVtOiAocGF0aCkgLT5cbiAgICAgICAgXG4gICAgICAgIHAgPSBzbGFzaC5yZXNvbHZlIHBhdGhcbiAgICAgICAgZmlsZTpwXG4gICAgICAgIHR5cGU6c2xhc2guaXNGaWxlKHApIGFuZCAnZmlsZScgb3IgJ2RpcidcbiAgICAgICAgbmFtZTpzbGFzaC5maWxlIHBcbiAgICAgICAgXG4gICAgb25GaWxlQnJvd3NlcjogKGFjdGlvbiwgaXRlbSwgYXJnKSA9PlxuXG4gICAgICAgIHN3aXRjaCBhY3Rpb25cbiAgICAgICAgICAgIHdoZW4gJ2xvYWRJdGVtJyAgICAgdGhlbiBAbG9hZEl0ZW0gICAgIGl0ZW0sIGFyZ1xuICAgICAgICAgICAgd2hlbiAnYWN0aXZhdGVJdGVtJyB0aGVuIEBhY3RpdmF0ZUl0ZW0gaXRlbSwgYXJnXG4gICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxvYWREaXI6IChwYXRoKSAtPiBAbG9hZEl0ZW0gdHlwZTonZGlyJyBmaWxlOnBhdGhcbiAgICBcbiAgICBsb2FkSXRlbTogKGl0ZW0sIG9wdCkgLT5cblxuICAgICAgICBvcHQgPz0gYWN0aXZlOicuLicgZm9jdXM6dHJ1ZVxuICAgICAgICBpdGVtLm5hbWUgPz0gc2xhc2guZmlsZSBpdGVtLmZpbGVcblxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSAxLCBwb3A6dHJ1ZSwgY2xlYXI6b3B0LmNsZWFyID8gMVxuXG4gICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2RpcicgIHRoZW4gQGxvYWREaXJJdGVtIGl0ZW0sIDAsIG9wdFxuICAgICAgICAgICAgd2hlbiAnZmlsZScgXG4gICAgICAgICAgICAgICAgb3B0LmFjdGl2YXRlID0gaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgd2hpbGUgQG51bUNvbHMoKSA8IDIgdGhlbiBAYWRkQ29sdW1uKClcbiAgICAgICAgICAgICAgICBAbG9hZERpckl0ZW0gQGZpbGVJdGVtKHNsYXNoLmRpcihpdGVtLmZpbGUpKSwgMCwgb3B0XG5cbiAgICAgICAgaWYgb3B0LmZvY3VzXG4gICAgICAgICAgICBAY29sdW1uc1swXT8uZm9jdXMoKVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGFjdGl2YXRlSXRlbTogKGl0ZW0sIGNvbCkgLT5cblxuICAgICAgICBpZiBAY29sdW1uc1tjb2wrMV1cbiAgICAgICAgICAgIGlmIHNsYXNoLnNhbWVQYXRoIGl0ZW0uZmlsZSwgQGNvbHVtbnNbY29sKzFdLnBhdGgoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sKzEsIHBvcDp0cnVlLCBjbGVhcjpjb2wrMVxuXG4gICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2RpcicgIHRoZW4gQGxvYWREaXJJdGVtICBpdGVtLCBjb2wrMSwgZm9jdXM6ZmFsc2VcbiAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIHRoZW4gQGxvYWRGaWxlSXRlbSBpdGVtLCBjb2wrMVxuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZEZpbGVJdGVtOiAoaXRlbSwgY29sPTApIC0+XG5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sLCBwb3A6dHJ1ZVxuXG4gICAgICAgIHdoaWxlIGNvbCA+PSBAbnVtQ29scygpXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcblxuICAgICAgICBmaWxlID0gaXRlbS5maWxlXG5cbiAgICAgICAgQGNvbHVtbnNbY29sXS5wYXJlbnQgPSBpdGVtXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggc2xhc2guZXh0IGZpbGVcbiAgICAgICAgICAgIHdoZW4gJ2dpZicgJ3BuZycgJ2pwZycgJ2pwZWcnICdzdmcnICdibXAnICdpY28nXG4gICAgICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBAaW1hZ2VJbmZvIGZpbGVcbiAgICAgICAgICAgIHdoZW4gJ3RpZmYnICd0aWYnXG4gICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgIEBjb252ZXJ0SW1hZ2Ugcm93XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIEBmaWxlSW5mbyBmaWxlXG4gICAgICAgICAgICB3aGVuICdweG0nXG4gICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgIEBjb252ZXJ0UFhNIHJvd1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBAZmlsZUluZm8gZmlsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0udGFibGUuYXBwZW5kQ2hpbGQgQGZpbGVJbmZvIGZpbGVcblxuICAgICAgICBwb3N0LmVtaXQgJ2xvYWQnIGNvbHVtbjpjb2wsIGl0ZW06aXRlbVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG5cbiAgICAjIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGltYWdlSW5mbzogKGZpbGUpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgaW1nID0gZWxlbSAnaW1nJyBjbGFzczonYnJvd3NlckltYWdlJyBzcmM6c2xhc2guZmlsZVVybCBmaWxlXG4gICAgICAgIGNudCA9IGVsZW0gY2xhc3M6J2Jyb3dzZXJJbWFnZUNvbnRhaW5lcicgY2hpbGQ6aW1nXG4gICAgICAgIGNudC5hZGRFdmVudExpc3RlbmVyICdkYmxjbGljaycgLT4gb3BlbiBmaWxlXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpbWcub25sb2FkID0gLT5cbiAgICAgICAgICAgIGltZyA9JCAnLmJyb3dzZXJJbWFnZSdcbiAgICAgICAgICAgIGJyID0gaW1nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICB4ID0gaW1nLmNsaWVudFhcbiAgICAgICAgICAgIHdpZHRoICA9IHBhcnNlSW50IGJyLnJpZ2h0IC0gYnIubGVmdCAtIDJcbiAgICAgICAgICAgIGhlaWdodCA9IHBhcnNlSW50IGJyLmJvdHRvbSAtIGJyLnRvcCAtIDJcblxuICAgICAgICAgICAgaW1nLnN0eWxlLm9wYWNpdHkgICA9ICcxJ1xuICAgICAgICAgICAgaW1nLnN0eWxlLm1heFdpZHRoICA9ICcxMDAlJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzdGF0ID0gc2xhc2guZmlsZUV4aXN0cyBmaWxlXG4gICAgICAgICAgICBzaXplID0gcGJ5dGVzKHN0YXQuc2l6ZSkuc3BsaXQgJyAnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGFnZSA9IG1vbWVudCgpLnRvKG1vbWVudChzdGF0Lm10aW1lKSwgdHJ1ZSlcbiAgICAgICAgICAgIFtudW0sIHJhbmdlXSA9IGFnZS5zcGxpdCAnICdcbiAgICAgICAgICAgIG51bSA9ICcxJyBpZiBudW1bMF0gPT0gJ2EnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGh0bWwgID0gXCI8dHI+PHRoIGNvbHNwYW49Mj4je3dpZHRofTxzcGFuIGNsYXNzPSdwdW5jdCc+eDwvc3Bhbj4je2hlaWdodH08L3RoPjwvdHI+XCJcbiAgICAgICAgICAgIGh0bWwgKz0gXCI8dHI+PHRoPiN7c2l6ZVswXX08L3RoPjx0ZD4je3NpemVbMV19PC90ZD48L3RyPlwiXG4gICAgICAgICAgICBodG1sICs9IFwiPHRyPjx0aD4je251bX08L3RoPjx0ZD4je3JhbmdlfTwvdGQ+PC90cj5cIlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpbmZvID0gZWxlbSBjbGFzczonYnJvd3NlckZpbGVJbmZvJyBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgIGVsZW0gJ2RpdicgY2xhc3M6XCJmaWxlSW5mb0ZpbGUgI3tzbGFzaC5leHQgZmlsZX1cIiBodG1sOkZpbGUuc3BhbiBmaWxlXG4gICAgICAgICAgICAgICAgZWxlbSAndGFibGUnIGNsYXNzOlwiZmlsZUluZm9EYXRhXCIgaHRtbDpodG1sXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBjbnQgPSQgJy5icm93c2VySW1hZ2VDb250YWluZXInXG4gICAgICAgICAgICBjbnQuYXBwZW5kQ2hpbGQgaW5mb1xuICAgICAgICBcbiAgICAgICAgY250XG4gICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgICBcbiAgICAgICAgXG4gICAgZmlsZUluZm86IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgc3RhdCA9IHNsYXNoLmZpbGVFeGlzdHMgZmlsZVxuICAgICAgICBzaXplID0gcGJ5dGVzKHN0YXQuc2l6ZSkuc3BsaXQgJyAnXG4gICAgICAgIFxuICAgICAgICB0ID0gbW9tZW50IHN0YXQubXRpbWVcblxuICAgICAgICBhZ2UgPSBtb21lbnQoKS50byh0LCB0cnVlKVxuICAgICAgICBbbnVtLCByYW5nZV0gPSBhZ2Uuc3BsaXQgJyAnXG4gICAgICAgIG51bSA9ICcxJyBpZiBudW1bMF0gPT0gJ2EnXG4gICAgICAgIGlmIHJhbmdlID09ICdmZXcnXG4gICAgICAgICAgICBudW0gPSBtb21lbnQoKS5kaWZmIHQsICdzZWNvbmRzJ1xuICAgICAgICAgICAgcmFuZ2UgPSAnc2Vjb25kcydcbiAgICAgICAgXG4gICAgICAgIGluZm8gPSBlbGVtIGNsYXNzOidicm93c2VyRmlsZUluZm8nIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICBlbGVtICdkaXYnIGNsYXNzOlwiZmlsZUluZm9JY29uICN7c2xhc2guZXh0IGZpbGV9ICN7RmlsZS5pY29uQ2xhc3NOYW1lIGZpbGV9XCJcbiAgICAgICAgICAgIGVsZW0gJ2RpdicgY2xhc3M6XCJmaWxlSW5mb0ZpbGUgI3tzbGFzaC5leHQgZmlsZX1cIiBodG1sOkZpbGUuc3BhbiBmaWxlXG4gICAgICAgICAgICBlbGVtICd0YWJsZScgY2xhc3M6XCJmaWxlSW5mb0RhdGFcIiBodG1sOlwiPHRyPjx0aD4je3NpemVbMF19PC90aD48dGQ+I3tzaXplWzFdfTwvdGQ+PC90cj48dHI+PHRoPiN7bnVtfTwvdGg+PHRkPiN7cmFuZ2V9PC90ZD48L3RyPlwiXG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIGluZm8uYWRkRXZlbnRMaXN0ZW5lciAnZGJsY2xpY2snIC0+IG9wZW4gZmlsZVxuICAgICAgICBcbiAgICAgICAgaW5mb1xuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZERpckl0ZW06IChpdGVtLCBjb2w9MCwgb3B0PXt9KSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBjb2wgPiAwIGFuZCBpdGVtLm5hbWUgPT0gJy8nXG5cbiAgICAgICAgZGlyID0gaXRlbS5maWxlXG5cbiAgICAgICAgb3B0Lmlnbm9yZUhpZGRlbiA9IG5vdCBwcmVmcy5nZXQgXCJicm93c2Vy4pa4c2hvd0hpZGRlbuKWuCN7ZGlyfVwiXG5cbiAgICAgICAgZGlybGlzdCBkaXIsIG9wdCwgKGVyciwgaXRlbXMpID0+XG5cbiAgICAgICAgICAgIGlmIGVycj8gdGhlbiByZXR1cm5cblxuICAgICAgICAgICAgaWYgQGNvbHVtbnMubGVuZ3RoIGFuZCBjb2wgPj0gQGNvbHVtbnMubGVuZ3RoIGFuZCBAc2tpcE9uRGJsQ2xpY2tcbiAgICAgICAgICAgICAgICBkZWxldGUgQHNraXBPbkRibENsaWNrXG4gICAgICAgICAgICAgICAgcmV0dXJuIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgQGxvYWREaXJJdGVtcyBkaXIsIGl0ZW0sIGl0ZW1zLCBjb2wsIG9wdFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgbG9hZERpckl0ZW1zOiAoZGlyLCBpdGVtLCBpdGVtcywgY29sLCBvcHQpID0+XG5cbiAgICAgICAgdXBkaXIgPSBzbGFzaC5yZXNvbHZlIHNsYXNoLmpvaW4gZGlyLCAnLi4nXG5cbiAgICAgICAgaWYgY29sID09IDAgb3IgY29sLTEgPCBAbnVtQ29scygpIGFuZCBAY29sdW1uc1tjb2wtMV0uYWN0aXZlUm93KCk/Lml0ZW0ubmFtZSA9PSAnLi4nXG4gICAgICAgICAgICBpZiBpdGVtc1swXS5uYW1lIG5vdCBpbiBbJy4uJyAnLyddXG4gICAgICAgICAgICAgICAgaWYgdXBkaXIgIT0gZGlyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLnVuc2hpZnRcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICcuLidcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiAgdXBkaXJcblxuICAgICAgICB3aGlsZSBjb2wgPj0gQG51bUNvbHMoKVxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG5cbiAgICAgICAgQGNvbHVtbnNbY29sXS5sb2FkSXRlbXMgaXRlbXMsIGl0ZW1cblxuICAgICAgICBwb3N0LmVtaXQgJ2xvYWQnIGNvbHVtbjpjb2wsIGl0ZW06aXRlbVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBvcHQuYWN0aXZhdGVcbiAgICAgICAgICAgIGlmIHJvdyA9IEBjb2x1bW5zW2NvbF0ucm93IHNsYXNoLmZpbGUgb3B0LmFjdGl2YXRlXG4gICAgICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWQnIGNvbHVtbjpjb2wrMSBpdGVtOnJvdy5pdGVtXG4gICAgICAgIGVsc2UgaWYgb3B0LmFjdGl2ZVxuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS5yb3coc2xhc2guZmlsZSBvcHQuYWN0aXZlKT8uc2V0QWN0aXZlKClcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBvcHQuZm9jdXMgIT0gZmFsc2UgYW5kIGVtcHR5KGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIGFuZCBlbXB0eSgkKCcucG9wdXAnKT8ub3V0ZXJIVE1MKVxuICAgICAgICAgICAgaWYgY29sID0gQGxhc3REaXJDb2x1bW4oKVxuICAgICAgICAgICAgICAgIGNvbC5kaXYuZm9jdXMoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBvcHQuY2I/IGNvbHVtbjpjb2wsIGl0ZW06aXRlbVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIG9uRmlsZTogKGZpbGUpID0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBmaWxlXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcblxuICAgICAgICBAbmF2aWdhdGVUb0ZpbGUgZmlsZVxuXG4gICAgb25PcGVuRmlsZTogKGZpbGUpID0+XG4gICAgICAgIFxuICAgICAgICBvcGVuIGZpbGVcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgaW5pdENvbHVtbnM6IC0+XG5cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgICAgIEB2aWV3Lmluc2VydEJlZm9yZSBAc2hlbGYuZGl2LCBAdmlldy5maXJzdENoaWxkXG4gICAgICAgIEB2aWV3Lmluc2VydEJlZm9yZSBAc2hlbGZSZXNpemUsIG51bGxcblxuICAgICAgICBAc2hlbGYuYnJvd3NlckRpZEluaXRDb2x1bW5zKClcblxuICAgICAgICBAc2V0U2hlbGZTaXplIEBzaGVsZlNpemVcblxuICAgIGNvbHVtbkF0UG9zOiAocG9zKSAtPlxuXG4gICAgICAgIGlmIGNvbHVtbiA9IHN1cGVyIHBvc1xuICAgICAgICAgICAgcmV0dXJuIGNvbHVtblxuXG4gICAgICAgIGlmIGVsZW0uY29udGFpbnNQb3MgQHNoZWxmLmRpdiwgcG9zXG4gICAgICAgICAgICByZXR1cm4gQHNoZWxmXG5cbiAgICBsYXN0Q29sdW1uUGF0aDogLT5cblxuICAgICAgICBpZiBsYXN0Q29sdW1uID0gQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uLnBhdGgoKVxuXG4gICAgbGFzdERpckNvbHVtbjogLT5cblxuICAgICAgICBpZiBsYXN0Q29sdW1uID0gQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIGlmIGxhc3RDb2x1bW4uaXNEaXIoKVxuICAgICAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW4ucHJldkNvbHVtbigpXG5cbiAgICBvbkJhY2tzcGFjZUluQ29sdW1uOiAoY29sdW1uKSAtPlxuXG4gICAgICAgIGNvbHVtbi5jbGVhclNlYXJjaCgpXG4gICAgICAgIEBuYXZpZ2F0ZSAnbGVmdCdcblxuICAgIHVwZGF0ZUNvbHVtblNjcm9sbHM6ID0+XG5cbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBAc2hlbGYuc2Nyb2xsLnVwZGF0ZSgpXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMFxuXG4gICAgb25TaGVsZkRyYWc6IChkcmFnLCBldmVudCkgPT5cblxuICAgICAgICBzaGVsZlNpemUgPSBjbGFtcCAwLCA0MDAsIGRyYWcucG9zLnhcbiAgICAgICAgQHNldFNoZWxmU2l6ZSBzaGVsZlNpemVcblxuICAgIHNldFNoZWxmU2l6ZTogKEBzaGVsZlNpemUpIC0+XG5cbiAgICAgICAgcHJlZnMuc2V0ICdzaGVsZuKWuHNpemUnIEBzaGVsZlNpemVcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBzaGVsZi5kaXYuc3R5bGUud2lkdGggPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBjb2xzLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcblxuICAgIHRvZ2dsZVNoZWxmOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHNoZWxmU2l6ZSA8IDFcbiAgICAgICAgICAgIEBzZXRTaGVsZlNpemUgMjAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBsYXN0VXNlZENvbHVtbigpPy5mb2N1cygpXG4gICAgICAgICAgICBAc2V0U2hlbGZTaXplIDBcbiAgICAgICAgICAgIFxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgICAgIFxuICAgIHJlZnJlc2g6ID0+XG5cbiAgICAgICAgaWYgQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIEBuYXZpZ2F0ZVRvRmlsZSBAbGFzdFVzZWRDb2x1bW4oKT8ucGF0aCgpXG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZUJyb3dzZXJcbiJdfQ==
//# sourceURL=../coffee/filebrowser.coffee