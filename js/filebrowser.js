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
        klog('col', this.columns.length, col);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDJKQUFBO0lBQUE7Ozs7QUFRQSxNQUFpRyxPQUFBLENBQVEsS0FBUixDQUFqRyxFQUFFLGVBQUYsRUFBUSxlQUFSLEVBQWMsaUJBQWQsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsZUFBMUMsRUFBZ0QsZUFBaEQsRUFBc0QsZUFBdEQsRUFBNEQsaUJBQTVELEVBQW1FLGVBQW5FLEVBQXlFLGlCQUF6RSxFQUFnRixXQUFoRixFQUFvRixXQUFwRixFQUF3RixTQUF4RixFQUEyRjs7QUFFM0YsT0FBQSxHQUFXLE9BQUEsQ0FBUSxXQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7QUFDWCxJQUFBLEdBQVcsT0FBQSxDQUFRLGNBQVI7O0FBQ1gsT0FBQSxHQUFXLE9BQUEsQ0FBUSxpQkFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLGNBQVI7O0FBQ1gsTUFBQSxHQUFXLE9BQUEsQ0FBUSxRQUFSOztBQUVMOzs7SUFFVyxxQkFBQyxJQUFEOzs7Ozs7OztRQUVULDZDQUFNLElBQU47UUFFQSxNQUFNLENBQUMsV0FBUCxHQUFxQjtRQUVyQixJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLEtBQUQsR0FBVSxJQUFJLEtBQUosQ0FBVSxJQUFWO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUVWLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUFzQixJQUFDLENBQUEsTUFBdkI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLGFBQVIsRUFBc0IsSUFBQyxDQUFBLGFBQXZCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxVQUFSLEVBQXNCLElBQUMsQ0FBQSxVQUF2QjtRQUVBLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQSxDQUFLLEtBQUws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QSxTQUFGLEdBQVk7ZUFDakMsSUFBQyxDQUFBLG1CQUFELENBQUE7SUFOVTs7MEJBUWQsV0FBQSxHQUFhLFNBQUE7QUFFVCxZQUFBO1FBQUEsSUFBRyxJQUFDLENBQUEsU0FBRCxHQUFhLENBQWhCO1lBQ0ksSUFBQyxDQUFBLFlBQUQsQ0FBYyxHQUFkLEVBREo7U0FBQSxNQUFBOztvQkFHcUIsQ0FBRSxLQUFuQixDQUFBOztZQUNBLElBQUMsQ0FBQSxZQUFELENBQWMsQ0FBZCxFQUpKOztlQU1BLElBQUMsQ0FBQSxtQkFBRCxDQUFBO0lBUlM7OzBCQVViLE9BQUEsR0FBUyxTQUFBO0FBRUwsWUFBQTtRQUFBLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUFIO21CQUNJLElBQUMsQ0FBQSxjQUFELDhDQUFpQyxDQUFFLElBQW5CLENBQUEsVUFBaEIsRUFESjs7SUFGSzs7OztHQXJhYTs7QUEwYTFCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIG9wZW4sIHZhbGlkLCBlbXB0eSwgY2xhbXAsIHByZWZzLCBsYXN0LCBlbGVtLCBkcmFnLCBzdGF0ZSwga2xvZywgc2xhc2gsIGZzLCBvcywgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Ccm93c2VyICA9IHJlcXVpcmUgJy4vYnJvd3NlcidcblNoZWxmICAgID0gcmVxdWlyZSAnLi9zaGVsZidcbkZpbGUgICAgID0gcmVxdWlyZSAnLi90b29scy9maWxlJ1xuZGlybGlzdCAgPSByZXF1aXJlICcuL3Rvb2xzL2Rpcmxpc3QnXG5wYnl0ZXMgICA9IHJlcXVpcmUgJ3ByZXR0eS1ieXRlcydcbm1vbWVudCAgID0gcmVxdWlyZSAnbW9tZW50J1xuXG5jbGFzcyBGaWxlQnJvd3NlciBleHRlbmRzIEJyb3dzZXJcblxuICAgIGNvbnN0cnVjdG9yOiAodmlldykgLT5cblxuICAgICAgICBzdXBlciB2aWV3XG5cbiAgICAgICAgd2luZG93LmZpbGVicm93c2VyID0gQFxuXG4gICAgICAgIEBsb2FkSUQgPSAwXG4gICAgICAgIEBzaGVsZiAgPSBuZXcgU2hlbGYgQFxuICAgICAgICBAbmFtZSAgID0gJ0ZpbGVCcm93c2VyJ1xuXG4gICAgICAgIHBvc3Qub24gJ2ZpbGUnICAgICAgICBAb25GaWxlXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVicm93c2VyJyBAb25GaWxlQnJvd3NlclxuICAgICAgICBwb3N0Lm9uICdvcGVuRmlsZScgICAgQG9uT3BlbkZpbGVcblxuICAgICAgICBAc2hlbGZSZXNpemUgPSBlbGVtICdkaXYnIGNsYXNzOiAnc2hlbGZSZXNpemUnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLnRvcCAgICAgID0gJzBweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmJvdHRvbSAgID0gJzBweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmxlZnQgICAgID0gJzE5NHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUud2lkdGggICAgPSAnNnB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUuY3Vyc29yICAgPSAnZXctcmVzaXplJ1xuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBzaGVsZlJlc2l6ZVxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uU2hlbGZEcmFnXG5cbiAgICAgICAgQHNoZWxmU2l6ZSA9IHByZWZzLmdldCAnc2hlbGbilrhzaXplJyAyMDBcblxuICAgICAgICBAaW5pdENvbHVtbnMoKVxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgc2hhcmVkQ29sdW1uSW5kZXg6IChmaWxlKSAtPiBcbiAgICAgICAgXG4gICAgICAgIGNvbCA9IDBcbiAgICAgICAgXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbHVtbi5pc0RpcigpIGFuZCBmaWxlLnN0YXJ0c1dpdGggY29sdW1uLnBhdGgoKVxuICAgICAgICAgICAgICAgIGNvbCArPSAxXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAga2xvZyAnY29sJyBAY29sdW1ucy5sZW5ndGgsIGNvbFxuICAgICAgICBpZiBjb2wgPT0gMSBhbmQgc2xhc2guZGlyKGZpbGUpICE9IEBjb2x1bW5zWzBdPy5wYXRoKClcbiAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgIE1hdGgubWF4IC0xLCBjb2wtMlxuXG4gICAgYnJvd3NlOiAoZmlsZSwgb3B0KSAtPiBpZiBmaWxlIHRoZW4gQGxvYWRJdGVtIEBmaWxlSXRlbShmaWxlKSwgb3B0XG4gICAgICAgIFxuICAgIG5hdmlnYXRlVG9GaWxlOiAoZmlsZSkgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgbGFzdFBhdGggPSBAbGFzdERpckNvbHVtbigpPy5wYXRoKClcbiAgICAgICAgXG4gICAgICAgIGZpbGUgPSBzbGFzaC5wYXRoIGZpbGVcbiAgICAgICAgXG4gICAgICAgIGlmIGZpbGUgPT0gbGFzdFBhdGggb3Igc2xhc2guaXNSZWxhdGl2ZSBmaWxlXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBjb2wgPSBAc2hhcmVkQ29sdW1uSW5kZXggZmlsZVxuICAgICAgICBcbiAgICAgICAgZmlsZWxpc3QgPSBzbGFzaC5wYXRobGlzdCBmaWxlXG4gICAgICAgIFxuICAgICAgICBpZiBjb2wgPj0gMFxuICAgICAgICAgICAgcGF0aHMgPSBmaWxlbGlzdC5zbGljZSBmaWxlbGlzdC5pbmRleE9mKEBjb2x1bW5zW2NvbF0ucGF0aCgpKSsxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHBhdGhzID0gZmlsZWxpc3Quc2xpY2UgZmlsZWxpc3QubGVuZ3RoLTJcbiAgICAgICAgICAgIFxuICAgICAgICAjIGtsb2cgJ25hdmlnYXRlVG9GaWxlJyBjb2wgLCBwYXRoc1xuICAgICAgICBcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sKzEsIHBvcDp0cnVlIGNsZWFyOmNvbCtwYXRocy5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIHdoaWxlIEBudW1Db2xzKCkgPCBwYXRocy5sZW5ndGhcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBpbmRleCBpbiBbMC4uLnBhdGhzLmxlbmd0aF1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaXRlbSA9IEBmaWxlSXRlbSBwYXRoc1tpbmRleF1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3dpdGNoIGl0ZW0udHlwZVxuICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIHRoZW4gQGxvYWRGaWxlSXRlbSBpdGVtLCBjb2wrMStpbmRleFxuICAgICAgICAgICAgICAgIHdoZW4gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgb3B0ID0ge31cbiAgICAgICAgICAgICAgICAgICAgaWYgaW5kZXggPCBwYXRocy5sZW5ndGgtMVxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmFjdGl2ZSA9IHBhdGhzW2luZGV4KzFdXG4gICAgICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSBpdGVtLCBjb2wrMStpbmRleCwgb3B0XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBjb2wgPSBAbGFzdERpckNvbHVtbigpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHJvdyA9IGNvbC5yb3coc2xhc2guZmlsZSBmaWxlKVxuICAgICAgICAgICAgICAgIHJvdy5zZXRBY3RpdmUoKVxuXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgZmlsZUl0ZW06IChwYXRoKSAtPlxuICAgICAgICBcbiAgICAgICAgcCA9IHNsYXNoLnJlc29sdmUgcGF0aFxuICAgICAgICBmaWxlOnBcbiAgICAgICAgdHlwZTpzbGFzaC5pc0ZpbGUocCkgYW5kICdmaWxlJyBvciAnZGlyJ1xuICAgICAgICBuYW1lOnNsYXNoLmZpbGUgcFxuICAgICAgICBcbiAgICBvbkZpbGVCcm93c2VyOiAoYWN0aW9uLCBpdGVtLCBhcmcpID0+XG5cbiAgICAgICAgc3dpdGNoIGFjdGlvblxuICAgICAgICAgICAgd2hlbiAnbG9hZEl0ZW0nICAgICB0aGVuIEBsb2FkSXRlbSAgICAgaXRlbSwgYXJnXG4gICAgICAgICAgICB3aGVuICdhY3RpdmF0ZUl0ZW0nIHRoZW4gQGFjdGl2YXRlSXRlbSBpdGVtLCBhcmdcbiAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZERpcjogKHBhdGgpIC0+IEBsb2FkSXRlbSB0eXBlOidkaXInIGZpbGU6cGF0aFxuICAgIFxuICAgIGxvYWRJdGVtOiAoaXRlbSwgb3B0KSAtPlxuXG4gICAgICAgIG9wdCA/PSBhY3RpdmU6Jy4uJyBmb2N1czp0cnVlXG4gICAgICAgIGl0ZW0ubmFtZSA/PSBzbGFzaC5maWxlIGl0ZW0uZmlsZVxuXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIDEsIHBvcDp0cnVlLCBjbGVhcjpvcHQuY2xlYXIgPyAxXG5cbiAgICAgICAgc3dpdGNoIGl0ZW0udHlwZVxuICAgICAgICAgICAgd2hlbiAnZGlyJyAgdGhlbiBAbG9hZERpckl0ZW0gaXRlbSwgMCwgb3B0XG4gICAgICAgICAgICB3aGVuICdmaWxlJyBcbiAgICAgICAgICAgICAgICBvcHQuYWN0aXZhdGUgPSBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICB3aGlsZSBAbnVtQ29scygpIDwgMiB0aGVuIEBhZGRDb2x1bW4oKVxuICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSBAZmlsZUl0ZW0oc2xhc2guZGlyKGl0ZW0uZmlsZSkpLCAwLCBvcHRcblxuICAgICAgICBpZiBvcHQuZm9jdXNcbiAgICAgICAgICAgIEBjb2x1bW5zWzBdPy5mb2N1cygpXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgYWN0aXZhdGVJdGVtOiAoaXRlbSwgY29sKSAtPlxuXG4gICAgICAgIGlmIEBjb2x1bW5zW2NvbCsxXVxuICAgICAgICAgICAgaWYgc2xhc2guc2FtZVBhdGggaXRlbS5maWxlLCBAY29sdW1uc1tjb2wrMV0ucGF0aCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wrMSwgcG9wOnRydWUsIGNsZWFyOmNvbCsxXG5cbiAgICAgICAgc3dpdGNoIGl0ZW0udHlwZVxuICAgICAgICAgICAgd2hlbiAnZGlyJyAgdGhlbiBAbG9hZERpckl0ZW0gIGl0ZW0sIGNvbCsxLCBmb2N1czpmYWxzZVxuICAgICAgICAgICAgd2hlbiAnZmlsZScgdGhlbiBAbG9hZEZpbGVJdGVtIGl0ZW0sIGNvbCsxXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkRmlsZUl0ZW06IChpdGVtLCBjb2w9MCkgLT5cblxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wsIHBvcDp0cnVlXG5cbiAgICAgICAgd2hpbGUgY29sID49IEBudW1Db2xzKClcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuXG4gICAgICAgIGZpbGUgPSBpdGVtLmZpbGVcblxuICAgICAgICAjIEBjb2x1bW5zW2NvbF0uaXRlbXMgPSBbaXRlbV1cbiAgICAgICAgQGNvbHVtbnNbY29sXS5wYXJlbnQgPSBpdGVtXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggc2xhc2guZXh0IGZpbGVcbiAgICAgICAgICAgIHdoZW4gJ2dpZicgJ3BuZycgJ2pwZycgJ2pwZWcnICdzdmcnICdibXAnICdpY28nXG4gICAgICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBAaW1hZ2VJbmZvIGZpbGVcbiAgICAgICAgICAgIHdoZW4gJ3RpZmYnICd0aWYnXG4gICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgIEBjb252ZXJ0SW1hZ2Ugcm93XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIEBmaWxlSW5mbyBmaWxlXG4gICAgICAgICAgICB3aGVuICdweG0nXG4gICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgIEBjb252ZXJ0UFhNIHJvd1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBAZmlsZUluZm8gZmlsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0udGFibGUuYXBwZW5kQ2hpbGQgQGZpbGVJbmZvIGZpbGVcblxuICAgICAgICBwb3N0LmVtaXQgJ2xvYWQnIGNvbHVtbjpjb2wsIGl0ZW06aXRlbVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG5cbiAgICAjIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGltYWdlSW5mbzogKGZpbGUpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgaW1nID0gZWxlbSAnaW1nJyBjbGFzczonYnJvd3NlckltYWdlJyBzcmM6c2xhc2guZmlsZVVybCBmaWxlXG4gICAgICAgIGNudCA9IGVsZW0gY2xhc3M6J2Jyb3dzZXJJbWFnZUNvbnRhaW5lcicgY2hpbGQ6aW1nXG4gICAgICAgIGNudC5hZGRFdmVudExpc3RlbmVyICdkYmxjbGljaycgLT4gb3BlbiBmaWxlXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpbWcub25sb2FkID0gLT5cbiAgICAgICAgICAgIGltZyA9JCAnLmJyb3dzZXJJbWFnZSdcbiAgICAgICAgICAgIGJyID0gaW1nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICB4ID0gaW1nLmNsaWVudFhcbiAgICAgICAgICAgIHdpZHRoICA9IHBhcnNlSW50IGJyLnJpZ2h0IC0gYnIubGVmdCAtIDJcbiAgICAgICAgICAgIGhlaWdodCA9IHBhcnNlSW50IGJyLmJvdHRvbSAtIGJyLnRvcCAtIDJcblxuICAgICAgICAgICAgaW1nLnN0eWxlLm9wYWNpdHkgICA9ICcxJ1xuICAgICAgICAgICAgaW1nLnN0eWxlLm1heFdpZHRoICA9ICcxMDAlJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzdGF0ID0gc2xhc2guZmlsZUV4aXN0cyBmaWxlXG4gICAgICAgICAgICBzaXplID0gcGJ5dGVzKHN0YXQuc2l6ZSkuc3BsaXQgJyAnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGFnZSA9IG1vbWVudCgpLnRvKG1vbWVudChzdGF0Lm10aW1lKSwgdHJ1ZSlcbiAgICAgICAgICAgIFtudW0sIHJhbmdlXSA9IGFnZS5zcGxpdCAnICdcbiAgICAgICAgICAgIG51bSA9ICcxJyBpZiBudW1bMF0gPT0gJ2EnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGh0bWwgID0gXCI8dHI+PHRoIGNvbHNwYW49Mj4je3dpZHRofTxzcGFuIGNsYXNzPSdwdW5jdCc+eDwvc3Bhbj4je2hlaWdodH08L3RoPjwvdHI+XCJcbiAgICAgICAgICAgIGh0bWwgKz0gXCI8dHI+PHRoPiN7c2l6ZVswXX08L3RoPjx0ZD4je3NpemVbMV19PC90ZD48L3RyPlwiXG4gICAgICAgICAgICBodG1sICs9IFwiPHRyPjx0aD4je251bX08L3RoPjx0ZD4je3JhbmdlfTwvdGQ+PC90cj5cIlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpbmZvID0gZWxlbSBjbGFzczonYnJvd3NlckZpbGVJbmZvJyBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgIGVsZW0gJ2RpdicgY2xhc3M6XCJmaWxlSW5mb0ZpbGUgI3tzbGFzaC5leHQgZmlsZX1cIiBodG1sOkZpbGUuc3BhbiBmaWxlXG4gICAgICAgICAgICAgICAgZWxlbSAndGFibGUnIGNsYXNzOlwiZmlsZUluZm9EYXRhXCIgaHRtbDpodG1sXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBjbnQgPSQgJy5icm93c2VySW1hZ2VDb250YWluZXInXG4gICAgICAgICAgICBjbnQuYXBwZW5kQ2hpbGQgaW5mb1xuICAgICAgICBcbiAgICAgICAgY250XG4gICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgICBcbiAgICAgICAgXG4gICAgZmlsZUluZm86IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgc3RhdCA9IHNsYXNoLmZpbGVFeGlzdHMgZmlsZVxuICAgICAgICBzaXplID0gcGJ5dGVzKHN0YXQuc2l6ZSkuc3BsaXQgJyAnXG4gICAgICAgIFxuICAgICAgICB0ID0gbW9tZW50IHN0YXQubXRpbWVcblxuICAgICAgICBhZ2UgPSBtb21lbnQoKS50byh0LCB0cnVlKVxuICAgICAgICBbbnVtLCByYW5nZV0gPSBhZ2Uuc3BsaXQgJyAnXG4gICAgICAgIG51bSA9ICcxJyBpZiBudW1bMF0gPT0gJ2EnXG4gICAgICAgIGlmIHJhbmdlID09ICdmZXcnXG4gICAgICAgICAgICBudW0gPSBtb21lbnQoKS5kaWZmIHQsICdzZWNvbmRzJ1xuICAgICAgICAgICAgcmFuZ2UgPSAnc2Vjb25kcydcbiAgICAgICAgXG4gICAgICAgIGluZm8gPSBlbGVtIGNsYXNzOidicm93c2VyRmlsZUluZm8nIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICBlbGVtICdkaXYnIGNsYXNzOlwiZmlsZUluZm9JY29uICN7c2xhc2guZXh0IGZpbGV9ICN7RmlsZS5pY29uQ2xhc3NOYW1lIGZpbGV9XCJcbiAgICAgICAgICAgIGVsZW0gJ2RpdicgY2xhc3M6XCJmaWxlSW5mb0ZpbGUgI3tzbGFzaC5leHQgZmlsZX1cIiBodG1sOkZpbGUuc3BhbiBmaWxlXG4gICAgICAgICAgICBlbGVtICd0YWJsZScgY2xhc3M6XCJmaWxlSW5mb0RhdGFcIiBodG1sOlwiPHRyPjx0aD4je3NpemVbMF19PC90aD48dGQ+I3tzaXplWzFdfTwvdGQ+PC90cj48dHI+PHRoPiN7bnVtfTwvdGg+PHRkPiN7cmFuZ2V9PC90ZD48L3RyPlwiXG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIGluZm8uYWRkRXZlbnRMaXN0ZW5lciAnZGJsY2xpY2snIC0+IG9wZW4gZmlsZVxuICAgICAgICBcbiAgICAgICAgaW5mb1xuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZERpckl0ZW06IChpdGVtLCBjb2w9MCwgb3B0PXt9KSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBjb2wgPiAwIGFuZCBpdGVtLm5hbWUgPT0gJy8nXG5cbiAgICAgICAgZGlyID0gaXRlbS5maWxlXG5cbiAgICAgICAgb3B0Lmlnbm9yZUhpZGRlbiA9IG5vdCBwcmVmcy5nZXQgXCJicm93c2Vy4pa4c2hvd0hpZGRlbuKWuCN7ZGlyfVwiXG5cbiAgICAgICAgZGlybGlzdCBkaXIsIG9wdCwgKGVyciwgaXRlbXMpID0+XG5cbiAgICAgICAgICAgIGlmIGVycj8gdGhlbiByZXR1cm5cblxuICAgICAgICAgICAgaWYgQGNvbHVtbnMubGVuZ3RoIGFuZCBjb2wgPj0gQGNvbHVtbnMubGVuZ3RoIGFuZCBAc2tpcE9uRGJsQ2xpY2tcbiAgICAgICAgICAgICAgICBkZWxldGUgQHNraXBPbkRibENsaWNrXG4gICAgICAgICAgICAgICAgcmV0dXJuIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgQGxvYWREaXJJdGVtcyBkaXIsIGl0ZW0sIGl0ZW1zLCBjb2wsIG9wdFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgbG9hZERpckl0ZW1zOiAoZGlyLCBpdGVtLCBpdGVtcywgY29sLCBvcHQpID0+XG5cbiAgICAgICAgdXBkaXIgPSBzbGFzaC5yZXNvbHZlIHNsYXNoLmpvaW4gZGlyLCAnLi4nXG5cbiAgICAgICAgaWYgY29sID09IDAgb3IgY29sLTEgPCBAbnVtQ29scygpIGFuZCBAY29sdW1uc1tjb2wtMV0uYWN0aXZlUm93KCk/Lml0ZW0ubmFtZSA9PSAnLi4nXG4gICAgICAgICAgICBpZiBpdGVtc1swXS5uYW1lIG5vdCBpbiBbJy4uJyAnLyddXG4gICAgICAgICAgICAgICAgaWYgdXBkaXIgIT0gZGlyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLnVuc2hpZnRcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICcuLidcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiAgdXBkaXJcblxuICAgICAgICB3aGlsZSBjb2wgPj0gQG51bUNvbHMoKVxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG5cbiAgICAgICAgQGNvbHVtbnNbY29sXS5sb2FkSXRlbXMgaXRlbXMsIGl0ZW1cblxuICAgICAgICBwb3N0LmVtaXQgJ2xvYWQnIGNvbHVtbjpjb2wsIGl0ZW06aXRlbVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBvcHQuYWN0aXZhdGVcbiAgICAgICAgICAgIGlmIHJvdyA9IEBjb2x1bW5zW2NvbF0ucm93IHNsYXNoLmZpbGUgb3B0LmFjdGl2YXRlXG4gICAgICAgICAgICAgICAgcm93LmFjdGl2YXRlKClcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2xvYWQnIGNvbHVtbjpjb2wrMSBpdGVtOnJvdy5pdGVtXG4gICAgICAgIGVsc2UgaWYgb3B0LmFjdGl2ZVxuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS5yb3coc2xhc2guZmlsZSBvcHQuYWN0aXZlKT8uc2V0QWN0aXZlKClcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBvcHQuZm9jdXMgIT0gZmFsc2UgYW5kIGVtcHR5KGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIGFuZCBlbXB0eSgkKCcucG9wdXAnKT8ub3V0ZXJIVE1MKVxuICAgICAgICAgICAgaWYgY29sID0gQGxhc3REaXJDb2x1bW4oKVxuICAgICAgICAgICAgICAgIGNvbC5kaXYuZm9jdXMoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBvcHQuY2I/IGNvbHVtbjpjb2wsIGl0ZW06aXRlbVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIG9uRmlsZTogKGZpbGUpID0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBmaWxlXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcblxuICAgICAgICBAbmF2aWdhdGVUb0ZpbGUgZmlsZVxuXG4gICAgb25PcGVuRmlsZTogKGZpbGUpID0+XG4gICAgICAgIFxuICAgICAgICBvcGVuIGZpbGVcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgaW5pdENvbHVtbnM6IC0+XG5cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgICAgIEB2aWV3Lmluc2VydEJlZm9yZSBAc2hlbGYuZGl2LCBAdmlldy5maXJzdENoaWxkXG4gICAgICAgIEB2aWV3Lmluc2VydEJlZm9yZSBAc2hlbGZSZXNpemUsIG51bGxcblxuICAgICAgICBAc2hlbGYuYnJvd3NlckRpZEluaXRDb2x1bW5zKClcblxuICAgICAgICBAc2V0U2hlbGZTaXplIEBzaGVsZlNpemVcblxuICAgIGNvbHVtbkF0UG9zOiAocG9zKSAtPlxuXG4gICAgICAgIGlmIGNvbHVtbiA9IHN1cGVyIHBvc1xuICAgICAgICAgICAgcmV0dXJuIGNvbHVtblxuXG4gICAgICAgIGlmIGVsZW0uY29udGFpbnNQb3MgQHNoZWxmLmRpdiwgcG9zXG4gICAgICAgICAgICByZXR1cm4gQHNoZWxmXG5cbiAgICBsYXN0Q29sdW1uUGF0aDogLT5cblxuICAgICAgICBpZiBsYXN0Q29sdW1uID0gQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uLnBhdGgoKVxuXG4gICAgbGFzdERpckNvbHVtbjogLT5cblxuICAgICAgICBpZiBsYXN0Q29sdW1uID0gQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIGlmIGxhc3RDb2x1bW4uaXNEaXIoKVxuICAgICAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW4ucHJldkNvbHVtbigpXG5cbiAgICBvbkJhY2tzcGFjZUluQ29sdW1uOiAoY29sdW1uKSAtPlxuXG4gICAgICAgIGNvbHVtbi5jbGVhclNlYXJjaCgpXG4gICAgICAgIEBuYXZpZ2F0ZSAnbGVmdCdcblxuICAgIHVwZGF0ZUNvbHVtblNjcm9sbHM6ID0+XG5cbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBAc2hlbGYuc2Nyb2xsLnVwZGF0ZSgpXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMFxuXG4gICAgb25TaGVsZkRyYWc6IChkcmFnLCBldmVudCkgPT5cblxuICAgICAgICBzaGVsZlNpemUgPSBjbGFtcCAwLCA0MDAsIGRyYWcucG9zLnhcbiAgICAgICAgQHNldFNoZWxmU2l6ZSBzaGVsZlNpemVcblxuICAgIHNldFNoZWxmU2l6ZTogKEBzaGVsZlNpemUpIC0+XG5cbiAgICAgICAgcHJlZnMuc2V0ICdzaGVsZuKWuHNpemUnIEBzaGVsZlNpemVcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBzaGVsZi5kaXYuc3R5bGUud2lkdGggPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBjb2xzLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcblxuICAgIHRvZ2dsZVNoZWxmOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHNoZWxmU2l6ZSA8IDFcbiAgICAgICAgICAgIEBzZXRTaGVsZlNpemUgMjAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBsYXN0VXNlZENvbHVtbigpPy5mb2N1cygpXG4gICAgICAgICAgICBAc2V0U2hlbGZTaXplIDBcbiAgICAgICAgICAgIFxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgICAgIFxuICAgIHJlZnJlc2g6ID0+XG5cbiAgICAgICAgaWYgQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIEBuYXZpZ2F0ZVRvRmlsZSBAbGFzdFVzZWRDb2x1bW4oKT8ucGF0aCgpXG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZUJyb3dzZXJcbiJdfQ==
//# sourceURL=../coffee/filebrowser.coffee