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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDJKQUFBO0lBQUE7Ozs7QUFRQSxNQUFpRyxPQUFBLENBQVEsS0FBUixDQUFqRyxFQUFFLGVBQUYsRUFBUSxlQUFSLEVBQWMsaUJBQWQsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsZUFBMUMsRUFBZ0QsZUFBaEQsRUFBc0QsZUFBdEQsRUFBNEQsaUJBQTVELEVBQW1FLGVBQW5FLEVBQXlFLGlCQUF6RSxFQUFnRixXQUFoRixFQUFvRixXQUFwRixFQUF3RixTQUF4RixFQUEyRjs7QUFFM0YsT0FBQSxHQUFXLE9BQUEsQ0FBUSxXQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7QUFDWCxJQUFBLEdBQVcsT0FBQSxDQUFRLGNBQVI7O0FBQ1gsT0FBQSxHQUFXLE9BQUEsQ0FBUSxpQkFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLGNBQVI7O0FBQ1gsTUFBQSxHQUFXLE9BQUEsQ0FBUSxRQUFSOztBQUVMOzs7SUFFVyxxQkFBQyxJQUFEOzs7Ozs7OztRQUVULDZDQUFNLElBQU47UUFFQSxNQUFNLENBQUMsV0FBUCxHQUFxQjtRQUVyQixJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLEtBQUQsR0FBVSxJQUFJLEtBQUosQ0FBVSxJQUFWO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUVWLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUFzQixJQUFDLENBQUEsTUFBdkI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLGFBQVIsRUFBc0IsSUFBQyxDQUFBLGFBQXZCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxVQUFSLEVBQXNCLElBQUMsQ0FBQSxVQUF2QjtRQUVBLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQSxDQUFLLEtBQUws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QUE7QUFFVCxZQUFBO1FBQUEsSUFBRyxJQUFDLENBQUEsU0FBRCxHQUFhLENBQWhCO1lBQ0ksSUFBQyxDQUFBLFlBQUQsQ0FBYyxHQUFkLEVBREo7U0FBQSxNQUFBOztvQkFHcUIsQ0FBRSxLQUFuQixDQUFBOztZQUNBLElBQUMsQ0FBQSxZQUFELENBQWMsQ0FBZCxFQUpKOztlQU1BLElBQUMsQ0FBQSxtQkFBRCxDQUFBO0lBUlM7OzBCQVViLE9BQUEsR0FBUyxTQUFBO0FBRUwsWUFBQTtRQUFBLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUFIO21CQUNJLElBQUMsQ0FBQSxjQUFELDhDQUFpQyxDQUFFLElBQW5CLENBQUEsVUFBaEIsRUFESjs7SUFGSzs7OztHQWphYTs7QUFzYTFCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIG9wZW4sIHZhbGlkLCBlbXB0eSwgY2xhbXAsIHByZWZzLCBsYXN0LCBlbGVtLCBkcmFnLCBzdGF0ZSwga2xvZywgc2xhc2gsIGZzLCBvcywgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Ccm93c2VyICA9IHJlcXVpcmUgJy4vYnJvd3NlcidcblNoZWxmICAgID0gcmVxdWlyZSAnLi9zaGVsZidcbkZpbGUgICAgID0gcmVxdWlyZSAnLi90b29scy9maWxlJ1xuZGlybGlzdCAgPSByZXF1aXJlICcuL3Rvb2xzL2Rpcmxpc3QnXG5wYnl0ZXMgICA9IHJlcXVpcmUgJ3ByZXR0eS1ieXRlcydcbm1vbWVudCAgID0gcmVxdWlyZSAnbW9tZW50J1xuXG5jbGFzcyBGaWxlQnJvd3NlciBleHRlbmRzIEJyb3dzZXJcblxuICAgIGNvbnN0cnVjdG9yOiAodmlldykgLT5cblxuICAgICAgICBzdXBlciB2aWV3XG5cbiAgICAgICAgd2luZG93LmZpbGVicm93c2VyID0gQFxuXG4gICAgICAgIEBsb2FkSUQgPSAwXG4gICAgICAgIEBzaGVsZiAgPSBuZXcgU2hlbGYgQFxuICAgICAgICBAbmFtZSAgID0gJ0ZpbGVCcm93c2VyJ1xuXG4gICAgICAgIHBvc3Qub24gJ2ZpbGUnICAgICAgICBAb25GaWxlXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVicm93c2VyJyBAb25GaWxlQnJvd3NlclxuICAgICAgICBwb3N0Lm9uICdvcGVuRmlsZScgICAgQG9uT3BlbkZpbGVcblxuICAgICAgICBAc2hlbGZSZXNpemUgPSBlbGVtICdkaXYnIGNsYXNzOiAnc2hlbGZSZXNpemUnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLnRvcCAgICAgID0gJzBweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmJvdHRvbSAgID0gJzBweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmxlZnQgICAgID0gJzE5NHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUud2lkdGggICAgPSAnNnB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUuY3Vyc29yICAgPSAnZXctcmVzaXplJ1xuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBzaGVsZlJlc2l6ZVxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uU2hlbGZEcmFnXG5cbiAgICAgICAgQHNoZWxmU2l6ZSA9IHByZWZzLmdldCAnc2hlbGbilrhzaXplJyAyMDBcblxuICAgICAgICBAaW5pdENvbHVtbnMoKVxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgc2hhcmVkQ29sdW1uSW5kZXg6IChmaWxlKSAtPiBcbiAgICAgICAgXG4gICAgICAgIGNvbCA9IDBcbiAgICAgICAgXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbHVtbi5pc0RpcigpIGFuZCBmaWxlLnN0YXJ0c1dpdGggY29sdW1uLnBhdGgoKVxuICAgICAgICAgICAgICAgIGNvbCArPSAxXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgY29sID09IDEgYW5kIHNsYXNoLmRpcihmaWxlKSAhPSBAY29sdW1uc1swXT8ucGF0aCgpXG4gICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICBNYXRoLm1heCAtMSwgY29sLTJcblxuICAgIGJyb3dzZTogKGZpbGUsIG9wdCkgLT4gaWYgZmlsZSB0aGVuIEBsb2FkSXRlbSBAZmlsZUl0ZW0oZmlsZSksIG9wdFxuICAgICAgICBcbiAgICBuYXZpZ2F0ZVRvRmlsZTogKGZpbGUpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGxhc3RQYXRoID0gQGxhc3REaXJDb2x1bW4oKT8ucGF0aCgpXG4gICAgICAgIFxuICAgICAgICBmaWxlID0gc2xhc2gucGF0aCBmaWxlXG4gICAgICAgIFxuICAgICAgICBpZiBmaWxlID09IGxhc3RQYXRoIG9yIHNsYXNoLmlzUmVsYXRpdmUgZmlsZVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgY29sID0gQHNoYXJlZENvbHVtbkluZGV4IGZpbGVcbiAgICAgICAgXG4gICAgICAgIGZpbGVsaXN0ID0gc2xhc2gucGF0aGxpc3QgZmlsZVxuICAgICAgICBcbiAgICAgICAgaWYgY29sID49IDBcbiAgICAgICAgICAgIHBhdGhzID0gZmlsZWxpc3Quc2xpY2UgZmlsZWxpc3QuaW5kZXhPZihAY29sdW1uc1tjb2xdLnBhdGgoKSkrMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwYXRocyA9IGZpbGVsaXN0LnNsaWNlIGZpbGVsaXN0Lmxlbmd0aC0yXG4gICAgICAgICAgICBcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sKzEsIHBvcDp0cnVlIGNsZWFyOmNvbCtwYXRocy5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIHdoaWxlIEBudW1Db2xzKCkgPCBwYXRocy5sZW5ndGhcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGZvciBpbmRleCBpbiBbMC4uLnBhdGhzLmxlbmd0aF1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaXRlbSA9IEBmaWxlSXRlbSBwYXRoc1tpbmRleF1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3dpdGNoIGl0ZW0udHlwZVxuICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIHRoZW4gQGxvYWRGaWxlSXRlbSBpdGVtLCBjb2wrMStpbmRleFxuICAgICAgICAgICAgICAgIHdoZW4gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgb3B0ID0ge31cbiAgICAgICAgICAgICAgICAgICAgaWYgaW5kZXggPCBwYXRocy5sZW5ndGgtMVxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmFjdGl2ZSA9IHBhdGhzW2luZGV4KzFdXG4gICAgICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSBpdGVtLCBjb2wrMStpbmRleCwgb3B0XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBjb2wgPSBAbGFzdERpckNvbHVtbigpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHJvdyA9IGNvbC5yb3coc2xhc2guZmlsZSBmaWxlKVxuICAgICAgICAgICAgICAgIHJvdy5zZXRBY3RpdmUoKVxuXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgZmlsZUl0ZW06IChwYXRoKSAtPlxuICAgICAgICBcbiAgICAgICAgcCA9IHNsYXNoLnJlc29sdmUgcGF0aFxuICAgICAgICBmaWxlOnBcbiAgICAgICAgdHlwZTpzbGFzaC5pc0ZpbGUocCkgYW5kICdmaWxlJyBvciAnZGlyJ1xuICAgICAgICBuYW1lOnNsYXNoLmZpbGUgcFxuICAgICAgICBcbiAgICBvbkZpbGVCcm93c2VyOiAoYWN0aW9uLCBpdGVtLCBhcmcpID0+XG5cbiAgICAgICAgc3dpdGNoIGFjdGlvblxuICAgICAgICAgICAgd2hlbiAnbG9hZEl0ZW0nICAgICB0aGVuIEBsb2FkSXRlbSAgICAgaXRlbSwgYXJnXG4gICAgICAgICAgICB3aGVuICdhY3RpdmF0ZUl0ZW0nIHRoZW4gQGFjdGl2YXRlSXRlbSBpdGVtLCBhcmdcbiAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZERpcjogKHBhdGgpIC0+IEBsb2FkSXRlbSB0eXBlOidkaXInIGZpbGU6cGF0aFxuICAgIFxuICAgIGxvYWRJdGVtOiAoaXRlbSwgb3B0KSAtPlxuXG4gICAgICAgIG9wdCA/PSBhY3RpdmU6Jy4uJyBmb2N1czp0cnVlXG4gICAgICAgIGl0ZW0ubmFtZSA/PSBzbGFzaC5maWxlIGl0ZW0uZmlsZVxuXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIDEsIHBvcDp0cnVlLCBjbGVhcjpvcHQuY2xlYXIgPyAxXG5cbiAgICAgICAgc3dpdGNoIGl0ZW0udHlwZVxuICAgICAgICAgICAgd2hlbiAnZGlyJyAgdGhlbiBAbG9hZERpckl0ZW0gaXRlbSwgMCwgb3B0XG4gICAgICAgICAgICB3aGVuICdmaWxlJyBcbiAgICAgICAgICAgICAgICBvcHQuYWN0aXZhdGUgPSBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICB3aGlsZSBAbnVtQ29scygpIDwgMiB0aGVuIEBhZGRDb2x1bW4oKVxuICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSBAZmlsZUl0ZW0oc2xhc2guZGlyKGl0ZW0uZmlsZSkpLCAwLCBvcHRcblxuICAgICAgICBpZiBvcHQuZm9jdXNcbiAgICAgICAgICAgIEBjb2x1bW5zWzBdPy5mb2N1cygpXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgYWN0aXZhdGVJdGVtOiAoaXRlbSwgY29sKSAtPlxuXG4gICAgICAgIGlmIEBjb2x1bW5zW2NvbCsxXVxuICAgICAgICAgICAgaWYgc2xhc2guc2FtZVBhdGggaXRlbS5maWxlLCBAY29sdW1uc1tjb2wrMV0ucGF0aCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wrMSwgcG9wOnRydWUsIGNsZWFyOmNvbCsxXG5cbiAgICAgICAgc3dpdGNoIGl0ZW0udHlwZVxuICAgICAgICAgICAgd2hlbiAnZGlyJyAgdGhlbiBAbG9hZERpckl0ZW0gIGl0ZW0sIGNvbCsxLCBmb2N1czpmYWxzZVxuICAgICAgICAgICAgd2hlbiAnZmlsZScgdGhlbiBAbG9hZEZpbGVJdGVtIGl0ZW0sIGNvbCsxXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkRmlsZUl0ZW06IChpdGVtLCBjb2w9MCkgLT5cblxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wsIHBvcDp0cnVlXG5cbiAgICAgICAgd2hpbGUgY29sID49IEBudW1Db2xzKClcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuXG4gICAgICAgIGZpbGUgPSBpdGVtLmZpbGVcblxuICAgICAgICBAY29sdW1uc1tjb2xdLnBhcmVudCA9IGl0ZW1cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBzbGFzaC5leHQgZmlsZVxuICAgICAgICAgICAgd2hlbiAnZ2lmJyAncG5nJyAnanBnJyAnanBlZycgJ3N2ZycgJ2JtcCcgJ2ljbydcbiAgICAgICAgICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIEBpbWFnZUluZm8gZmlsZVxuICAgICAgICAgICAgd2hlbiAndGlmZicgJ3RpZidcbiAgICAgICAgICAgICAgICBpZiBub3Qgc2xhc2gud2luKClcbiAgICAgICAgICAgICAgICAgICAgQGNvbnZlcnRJbWFnZSByb3dcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0udGFibGUuYXBwZW5kQ2hpbGQgQGZpbGVJbmZvIGZpbGVcbiAgICAgICAgICAgIHdoZW4gJ3B4bSdcbiAgICAgICAgICAgICAgICBpZiBub3Qgc2xhc2gud2luKClcbiAgICAgICAgICAgICAgICAgICAgQGNvbnZlcnRQWE0gcm93XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIEBmaWxlSW5mbyBmaWxlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBAZmlsZUluZm8gZmlsZVxuXG4gICAgICAgIHBvc3QuZW1pdCAnbG9hZCcgY29sdW1uOmNvbCwgaXRlbTppdGVtXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcblxuICAgICMgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgaW1hZ2VJbmZvOiAoZmlsZSkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICBpbWcgPSBlbGVtICdpbWcnIGNsYXNzOidicm93c2VySW1hZ2UnIHNyYzpzbGFzaC5maWxlVXJsIGZpbGVcbiAgICAgICAgY250ID0gZWxlbSBjbGFzczonYnJvd3NlckltYWdlQ29udGFpbmVyJyBjaGlsZDppbWdcbiAgICAgICAgY250LmFkZEV2ZW50TGlzdGVuZXIgJ2RibGNsaWNrJyAtPiBvcGVuIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGltZy5vbmxvYWQgPSAtPlxuICAgICAgICAgICAgaW1nID0kICcuYnJvd3NlckltYWdlJ1xuICAgICAgICAgICAgYnIgPSBpbWcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgIHggPSBpbWcuY2xpZW50WFxuICAgICAgICAgICAgd2lkdGggID0gcGFyc2VJbnQgYnIucmlnaHQgLSBici5sZWZ0IC0gMlxuICAgICAgICAgICAgaGVpZ2h0ID0gcGFyc2VJbnQgYnIuYm90dG9tIC0gYnIudG9wIC0gMlxuXG4gICAgICAgICAgICBpbWcuc3R5bGUub3BhY2l0eSAgID0gJzEnXG4gICAgICAgICAgICBpbWcuc3R5bGUubWF4V2lkdGggID0gJzEwMCUnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN0YXQgPSBzbGFzaC5maWxlRXhpc3RzIGZpbGVcbiAgICAgICAgICAgIHNpemUgPSBwYnl0ZXMoc3RhdC5zaXplKS5zcGxpdCAnICdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgYWdlID0gbW9tZW50KCkudG8obW9tZW50KHN0YXQubXRpbWUpLCB0cnVlKVxuICAgICAgICAgICAgW251bSwgcmFuZ2VdID0gYWdlLnNwbGl0ICcgJ1xuICAgICAgICAgICAgbnVtID0gJzEnIGlmIG51bVswXSA9PSAnYSdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaHRtbCAgPSBcIjx0cj48dGggY29sc3Bhbj0yPiN7d2lkdGh9PHNwYW4gY2xhc3M9J3B1bmN0Jz54PC9zcGFuPiN7aGVpZ2h0fTwvdGg+PC90cj5cIlxuICAgICAgICAgICAgaHRtbCArPSBcIjx0cj48dGg+I3tzaXplWzBdfTwvdGg+PHRkPiN7c2l6ZVsxXX08L3RkPjwvdHI+XCJcbiAgICAgICAgICAgIGh0bWwgKz0gXCI8dHI+PHRoPiN7bnVtfTwvdGg+PHRkPiN7cmFuZ2V9PC90ZD48L3RyPlwiXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGluZm8gPSBlbGVtIGNsYXNzOidicm93c2VyRmlsZUluZm8nIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAgZWxlbSAnZGl2JyBjbGFzczpcImZpbGVJbmZvRmlsZSAje3NsYXNoLmV4dCBmaWxlfVwiIGh0bWw6RmlsZS5zcGFuIGZpbGVcbiAgICAgICAgICAgICAgICBlbGVtICd0YWJsZScgY2xhc3M6XCJmaWxlSW5mb0RhdGFcIiBodG1sOmh0bWxcbiAgICAgICAgICAgIF1cbiAgICAgICAgICAgIGNudCA9JCAnLmJyb3dzZXJJbWFnZUNvbnRhaW5lcidcbiAgICAgICAgICAgIGNudC5hcHBlbmRDaGlsZCBpbmZvXG4gICAgICAgIFxuICAgICAgICBjbnRcbiAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgICAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIFxuICAgICAgICBcbiAgICBmaWxlSW5mbzogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBzdGF0ID0gc2xhc2guZmlsZUV4aXN0cyBmaWxlXG4gICAgICAgIHNpemUgPSBwYnl0ZXMoc3RhdC5zaXplKS5zcGxpdCAnICdcbiAgICAgICAgXG4gICAgICAgIHQgPSBtb21lbnQgc3RhdC5tdGltZVxuXG4gICAgICAgIGFnZSA9IG1vbWVudCgpLnRvKHQsIHRydWUpXG4gICAgICAgIFtudW0sIHJhbmdlXSA9IGFnZS5zcGxpdCAnICdcbiAgICAgICAgbnVtID0gJzEnIGlmIG51bVswXSA9PSAnYSdcbiAgICAgICAgaWYgcmFuZ2UgPT0gJ2ZldydcbiAgICAgICAgICAgIG51bSA9IG1vbWVudCgpLmRpZmYgdCwgJ3NlY29uZHMnXG4gICAgICAgICAgICByYW5nZSA9ICdzZWNvbmRzJ1xuICAgICAgICBcbiAgICAgICAgaW5mbyA9IGVsZW0gY2xhc3M6J2Jyb3dzZXJGaWxlSW5mbycgY2hpbGRyZW46IFtcbiAgICAgICAgICAgIGVsZW0gJ2RpdicgY2xhc3M6XCJmaWxlSW5mb0ljb24gI3tzbGFzaC5leHQgZmlsZX0gI3tGaWxlLmljb25DbGFzc05hbWUgZmlsZX1cIlxuICAgICAgICAgICAgZWxlbSAnZGl2JyBjbGFzczpcImZpbGVJbmZvRmlsZSAje3NsYXNoLmV4dCBmaWxlfVwiIGh0bWw6RmlsZS5zcGFuIGZpbGVcbiAgICAgICAgICAgIGVsZW0gJ3RhYmxlJyBjbGFzczpcImZpbGVJbmZvRGF0YVwiIGh0bWw6XCI8dHI+PHRoPiN7c2l6ZVswXX08L3RoPjx0ZD4je3NpemVbMV19PC90ZD48L3RyPjx0cj48dGg+I3tudW19PC90aD48dGQ+I3tyYW5nZX08L3RkPjwvdHI+XCJcbiAgICAgICAgXVxuICAgICAgICBcbiAgICAgICAgaW5mby5hZGRFdmVudExpc3RlbmVyICdkYmxjbGljaycgLT4gb3BlbiBmaWxlXG4gICAgICAgIFxuICAgICAgICBpbmZvXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkRGlySXRlbTogKGl0ZW0sIGNvbD0wLCBvcHQ9e30pIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIGNvbCA+IDAgYW5kIGl0ZW0ubmFtZSA9PSAnLydcblxuICAgICAgICBkaXIgPSBpdGVtLmZpbGVcblxuICAgICAgICBvcHQuaWdub3JlSGlkZGVuID0gbm90IHByZWZzLmdldCBcImJyb3dzZXLilrhzaG93SGlkZGVu4pa4I3tkaXJ9XCJcblxuICAgICAgICBkaXJsaXN0IGRpciwgb3B0LCAoZXJyLCBpdGVtcykgPT5cblxuICAgICAgICAgICAgaWYgZXJyPyB0aGVuIHJldHVyblxuXG4gICAgICAgICAgICBpZiBAY29sdW1ucy5sZW5ndGggYW5kIGNvbCA+PSBAY29sdW1ucy5sZW5ndGggYW5kIEBza2lwT25EYmxDbGlja1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBAc2tpcE9uRGJsQ2xpY2tcbiAgICAgICAgICAgICAgICByZXR1cm4gXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBAbG9hZERpckl0ZW1zIGRpciwgaXRlbSwgaXRlbXMsIGNvbCwgb3B0XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBsb2FkRGlySXRlbXM6IChkaXIsIGl0ZW0sIGl0ZW1zLCBjb2wsIG9wdCkgPT5cblxuICAgICAgICB1cGRpciA9IHNsYXNoLnJlc29sdmUgc2xhc2guam9pbiBkaXIsICcuLidcblxuICAgICAgICBpZiBjb2wgPT0gMCBvciBjb2wtMSA8IEBudW1Db2xzKCkgYW5kIEBjb2x1bW5zW2NvbC0xXS5hY3RpdmVSb3coKT8uaXRlbS5uYW1lID09ICcuLidcbiAgICAgICAgICAgIGlmIGl0ZW1zWzBdLm5hbWUgbm90IGluIFsnLi4nICcvJ11cbiAgICAgICAgICAgICAgICBpZiB1cGRpciAhPSBkaXJcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMudW5zaGlmdFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJy4uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6ICB1cGRpclxuXG4gICAgICAgIHdoaWxlIGNvbCA+PSBAbnVtQ29scygpXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcblxuICAgICAgICBAY29sdW1uc1tjb2xdLmxvYWRJdGVtcyBpdGVtcywgaXRlbVxuXG4gICAgICAgIHBvc3QuZW1pdCAnbG9hZCcgY29sdW1uOmNvbCwgaXRlbTppdGVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG9wdC5hY3RpdmF0ZVxuICAgICAgICAgICAgaWYgcm93ID0gQGNvbHVtbnNbY29sXS5yb3cgc2xhc2guZmlsZSBvcHQuYWN0aXZhdGVcbiAgICAgICAgICAgICAgICByb3cuYWN0aXZhdGUoKVxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnbG9hZCcgY29sdW1uOmNvbCsxIGl0ZW06cm93Lml0ZW1cbiAgICAgICAgZWxzZSBpZiBvcHQuYWN0aXZlXG4gICAgICAgICAgICBAY29sdW1uc1tjb2xdLnJvdyhzbGFzaC5maWxlIG9wdC5hY3RpdmUpPy5zZXRBY3RpdmUoKVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG9wdC5mb2N1cyAhPSBmYWxzZSBhbmQgZW1wdHkoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkgYW5kIGVtcHR5KCQoJy5wb3B1cCcpPy5vdXRlckhUTUwpXG4gICAgICAgICAgICBpZiBjb2wgPSBAbGFzdERpckNvbHVtbigpXG4gICAgICAgICAgICAgICAgY29sLmRpdi5mb2N1cygpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIG9wdC5jYj8gY29sdW1uOmNvbCwgaXRlbTppdGVtXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IGZpbGVcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuXG4gICAgICAgIEBuYXZpZ2F0ZVRvRmlsZSBmaWxlXG5cbiAgICBvbk9wZW5GaWxlOiAoZmlsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIG9wZW4gZmlsZVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBpbml0Q29sdW1uczogLT5cblxuICAgICAgICBzdXBlcigpXG5cbiAgICAgICAgQHZpZXcuaW5zZXJ0QmVmb3JlIEBzaGVsZi5kaXYsIEB2aWV3LmZpcnN0Q2hpbGRcbiAgICAgICAgQHZpZXcuaW5zZXJ0QmVmb3JlIEBzaGVsZlJlc2l6ZSwgbnVsbFxuXG4gICAgICAgIEBzaGVsZi5icm93c2VyRGlkSW5pdENvbHVtbnMoKVxuXG4gICAgICAgIEBzZXRTaGVsZlNpemUgQHNoZWxmU2l6ZVxuXG4gICAgY29sdW1uQXRQb3M6IChwb3MpIC0+XG5cbiAgICAgICAgaWYgY29sdW1uID0gc3VwZXIgcG9zXG4gICAgICAgICAgICByZXR1cm4gY29sdW1uXG5cbiAgICAgICAgaWYgZWxlbS5jb250YWluc1BvcyBAc2hlbGYuZGl2LCBwb3NcbiAgICAgICAgICAgIHJldHVybiBAc2hlbGZcblxuICAgIGxhc3RDb2x1bW5QYXRoOiAtPlxuXG4gICAgICAgIGlmIGxhc3RDb2x1bW4gPSBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW4ucGF0aCgpXG5cbiAgICBsYXN0RGlyQ29sdW1uOiAtPlxuXG4gICAgICAgIGlmIGxhc3RDb2x1bW4gPSBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgaWYgbGFzdENvbHVtbi5pc0RpcigpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW5cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtbi5wcmV2Q29sdW1uKClcblxuICAgIG9uQmFja3NwYWNlSW5Db2x1bW46IChjb2x1bW4pIC0+XG5cbiAgICAgICAgY29sdW1uLmNsZWFyU2VhcmNoKClcbiAgICAgICAgQG5hdmlnYXRlICdsZWZ0J1xuXG4gICAgdXBkYXRlQ29sdW1uU2Nyb2xsczogPT5cblxuICAgICAgICBzdXBlcigpXG4gICAgICAgIEBzaGVsZi5zY3JvbGwudXBkYXRlKClcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwXG5cbiAgICBvblNoZWxmRHJhZzogKGRyYWcsIGV2ZW50KSA9PlxuXG4gICAgICAgIHNoZWxmU2l6ZSA9IGNsYW1wIDAsIDQwMCwgZHJhZy5wb3MueFxuICAgICAgICBAc2V0U2hlbGZTaXplIHNoZWxmU2l6ZVxuXG4gICAgc2V0U2hlbGZTaXplOiAoQHNoZWxmU2l6ZSkgLT5cblxuICAgICAgICBwcmVmcy5zZXQgJ3NoZWxm4pa4c2l6ZScgQHNoZWxmU2l6ZVxuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUubGVmdCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcbiAgICAgICAgQHNoZWxmLmRpdi5zdHlsZS53aWR0aCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcbiAgICAgICAgQGNvbHMuc3R5bGUubGVmdCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuXG4gICAgdG9nZ2xlU2hlbGY6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAc2hlbGZTaXplIDwgMVxuICAgICAgICAgICAgQHNldFNoZWxmU2l6ZSAyMDBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGxhc3RVc2VkQ29sdW1uKCk/LmZvY3VzKClcbiAgICAgICAgICAgIEBzZXRTaGVsZlNpemUgMFxuICAgICAgICAgICAgXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcbiAgICAgICAgXG4gICAgcmVmcmVzaDogPT5cblxuICAgICAgICBpZiBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgQG5hdmlnYXRlVG9GaWxlIEBsYXN0VXNlZENvbHVtbigpPy5wYXRoKClcblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlQnJvd3NlclxuIl19
//# sourceURL=../coffee/filebrowser.coffee