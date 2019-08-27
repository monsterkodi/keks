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

    FileBrowser.prototype.browse = function(file) {
        if (file) {
            return this.loadItem(this.fileItem(file));
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
        var ref1;
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
            clear: 1
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
            return (ref1 = this.columns[0]) != null ? ref1.focus() : void 0;
        }
    };

    FileBrowser.prototype.activateItem = function(item, col) {
        var ref1;
        if (this.columns[col + 1]) {
            if (slash.samePath(item.file, this.columns[col + 1].path())) {
                klog('activateItem skip already active', col + 1, item, (ref1 = this.columns[col + 1]) != null ? ref1.path() : void 0);
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
            img.style.maxHeight = '75vh';
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
                post.toMain('dirLoaded', dir);
                if (_this.columns.length && col >= _this.columns.length && _this.skipOnDblClick) {
                    delete _this.skipOnDblClick;
                    return;
                }
                _this.loadDirItems(dir, item, items, col, opt);
                post.emit('dir', dir);
                return _this.updateColumnScrolls();
            };
        })(this));
    };

    FileBrowser.prototype.loadDirItems = function(dir, item, items, col, opt) {
        var ref1, ref2, ref3, ref4, ref5, updir;
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
        if (opt.activate) {
            if ((ref3 = this.columns[col].row(slash.file(opt.activate))) != null) {
                ref3.activate();
            }
        } else if (opt.active) {
            if ((ref4 = this.columns[col].row(slash.file(opt.active))) != null) {
                ref4.setActive();
            }
        }
        if (opt.focus !== false && empty(document.activeElement) && empty((ref5 = $('.popup')) != null ? ref5.outerHTML : void 0)) {
            if (col = this.lastDirColumn()) {
                return col.div.focus();
            }
        }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDJKQUFBO0lBQUE7Ozs7QUFRQSxNQUFpRyxPQUFBLENBQVEsS0FBUixDQUFqRyxFQUFFLGVBQUYsRUFBUSxlQUFSLEVBQWMsaUJBQWQsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsZUFBMUMsRUFBZ0QsZUFBaEQsRUFBc0QsZUFBdEQsRUFBNEQsaUJBQTVELEVBQW1FLGVBQW5FLEVBQXlFLGlCQUF6RSxFQUFnRixXQUFoRixFQUFvRixXQUFwRixFQUF3RixTQUF4RixFQUEyRjs7QUFFM0YsT0FBQSxHQUFXLE9BQUEsQ0FBUSxXQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7QUFDWCxJQUFBLEdBQVcsT0FBQSxDQUFRLGNBQVI7O0FBQ1gsT0FBQSxHQUFXLE9BQUEsQ0FBUSxpQkFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLGNBQVI7O0FBQ1gsTUFBQSxHQUFXLE9BQUEsQ0FBUSxRQUFSOztBQUVMOzs7SUFFVyxxQkFBQyxJQUFEOzs7Ozs7OztRQUVULDZDQUFNLElBQU47UUFFQSxNQUFNLENBQUMsV0FBUCxHQUFxQjtRQUVyQixJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLEtBQUQsR0FBVSxJQUFJLEtBQUosQ0FBVSxJQUFWO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUVWLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUFzQixJQUFDLENBQUEsTUFBdkI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLGFBQVIsRUFBc0IsSUFBQyxDQUFBLGFBQXZCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxVQUFSLEVBQXNCLElBQUMsQ0FBQSxVQUF2QjtRQUVBLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQSxDQUFLLEtBQUws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Ozs7O0dBN1phOztBQWthMUIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgb3BlbiwgdmFsaWQsIGVtcHR5LCBjbGFtcCwgcHJlZnMsIGxhc3QsIGVsZW0sIGRyYWcsIHN0YXRlLCBrbG9nLCBzbGFzaCwgZnMsIG9zLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbkJyb3dzZXIgID0gcmVxdWlyZSAnLi9icm93c2VyJ1xuU2hlbGYgICAgPSByZXF1aXJlICcuL3NoZWxmJ1xuRmlsZSAgICAgPSByZXF1aXJlICcuL3Rvb2xzL2ZpbGUnXG5kaXJsaXN0ICA9IHJlcXVpcmUgJy4vdG9vbHMvZGlybGlzdCdcbnBieXRlcyAgID0gcmVxdWlyZSAncHJldHR5LWJ5dGVzJ1xubW9tZW50ICAgPSByZXF1aXJlICdtb21lbnQnXG5cbmNsYXNzIEZpbGVCcm93c2VyIGV4dGVuZHMgQnJvd3NlclxuXG4gICAgY29uc3RydWN0b3I6ICh2aWV3KSAtPlxuXG4gICAgICAgIHN1cGVyIHZpZXdcblxuICAgICAgICB3aW5kb3cuZmlsZWJyb3dzZXIgPSBAXG5cbiAgICAgICAgQGxvYWRJRCA9IDBcbiAgICAgICAgQHNoZWxmICA9IG5ldyBTaGVsZiBAXG4gICAgICAgIEBuYW1lICAgPSAnRmlsZUJyb3dzZXInXG5cbiAgICAgICAgcG9zdC5vbiAnZmlsZScgICAgICAgIEBvbkZpbGVcbiAgICAgICAgcG9zdC5vbiAnZmlsZWJyb3dzZXInIEBvbkZpbGVCcm93c2VyXG4gICAgICAgIHBvc3Qub24gJ29wZW5GaWxlJyAgICBAb25PcGVuRmlsZVxuXG4gICAgICAgIEBzaGVsZlJlc2l6ZSA9IGVsZW0gJ2RpdicgY2xhc3M6ICdzaGVsZlJlc2l6ZSdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUudG9wICAgICAgPSAnMHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUuYm90dG9tICAgPSAnMHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUubGVmdCAgICAgPSAnMTk0cHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS53aWR0aCAgICA9ICc2cHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5jdXJzb3IgICA9ICdldy1yZXNpemUnXG5cbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQHNoZWxmUmVzaXplXG4gICAgICAgICAgICBvbk1vdmU6ICBAb25TaGVsZkRyYWdcblxuICAgICAgICBAc2hlbGZTaXplID0gcHJlZnMuZ2V0ICdzaGVsZuKWuHNpemUnIDIwMFxuXG4gICAgICAgIEBpbml0Q29sdW1ucygpXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBzaGFyZWRDb2x1bW5JbmRleDogKGZpbGUpIC0+IFxuICAgICAgICBcbiAgICAgICAgY29sID0gMFxuICAgICAgICBcbiAgICAgICAgZm9yIGNvbHVtbiBpbiBAY29sdW1uc1xuICAgICAgICAgICAgaWYgY29sdW1uLmlzRGlyKCkgYW5kIGZpbGUuc3RhcnRzV2l0aCBjb2x1bW4ucGF0aCgpXG4gICAgICAgICAgICAgICAgY29sICs9IDFcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICBpZiBjb2wgPT0gMSBhbmQgc2xhc2guZGlyKGZpbGUpICE9IEBjb2x1bW5zWzBdPy5wYXRoKClcbiAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgIE1hdGgubWF4IC0xLCBjb2wtMlxuXG4gICAgYnJvd3NlOiAoZmlsZSkgLT4gaWYgZmlsZSB0aGVuIEBsb2FkSXRlbSBAZmlsZUl0ZW0gZmlsZVxuICAgICAgICBcbiAgICBuYXZpZ2F0ZVRvRmlsZTogKGZpbGUpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGxhc3RQYXRoID0gQGxhc3REaXJDb2x1bW4oKT8ucGF0aCgpXG4gICAgICAgIFxuICAgICAgICBmaWxlID0gc2xhc2gucGF0aCBmaWxlXG4gICAgICAgIFxuICAgICAgICBpZiBmaWxlID09IGxhc3RQYXRoIG9yIHNsYXNoLmlzUmVsYXRpdmUgZmlsZVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgY29sID0gQHNoYXJlZENvbHVtbkluZGV4IGZpbGVcbiAgICAgICAgXG4gICAgICAgIGZpbGVsaXN0ID0gc2xhc2gucGF0aGxpc3QgZmlsZVxuICAgICAgICBcbiAgICAgICAgaWYgY29sID49IDBcbiAgICAgICAgICAgIHBhdGhzID0gZmlsZWxpc3Quc2xpY2UgZmlsZWxpc3QuaW5kZXhPZihAY29sdW1uc1tjb2xdLnBhdGgoKSkrMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwYXRocyA9IGZpbGVsaXN0LnNsaWNlIGZpbGVsaXN0Lmxlbmd0aC0yXG4gICAgICAgICAgICBcbiAgICAgICAgIyBAcG9wQ29sdW1uc0Zyb20gICBjb2wrMStwYXRocy5sZW5ndGhcbiAgICAgICAgIyBAY2xlYXJDb2x1bW5zRnJvbSBjb2wrMVxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wrMSwgcG9wOnRydWUgY2xlYXI6Y29sK3BhdGhzLmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgd2hpbGUgQG51bUNvbHMoKSA8IHBhdGhzLmxlbmd0aFxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgZm9yIGluZGV4IGluIFswLi4ucGF0aHMubGVuZ3RoXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpdGVtID0gQGZpbGVJdGVtIHBhdGhzW2luZGV4XVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICAgICAgd2hlbiAnZmlsZScgdGhlbiBAbG9hZEZpbGVJdGVtIGl0ZW0sIGNvbCsxK2luZGV4XG4gICAgICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICBvcHQgPSB7fVxuICAgICAgICAgICAgICAgICAgICBpZiBpbmRleCA8IHBhdGhzLmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHQuYWN0aXZlID0gcGF0aHNbaW5kZXgrMV1cbiAgICAgICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtIGl0ZW0sIGNvbCsxK2luZGV4LCBvcHRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbCA9IEBsYXN0RGlyQ29sdW1uKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcm93ID0gY29sLnJvdyhzbGFzaC5maWxlIGZpbGUpXG4gICAgICAgICAgICAgICAgcm93LnNldEFjdGl2ZSgpXG5cbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBmaWxlSXRlbTogKHBhdGgpIC0+XG4gICAgICAgIFxuICAgICAgICBwID0gc2xhc2gucmVzb2x2ZSBwYXRoXG4gICAgICAgIGZpbGU6cFxuICAgICAgICB0eXBlOnNsYXNoLmlzRmlsZShwKSBhbmQgJ2ZpbGUnIG9yICdkaXInXG4gICAgICAgIG5hbWU6c2xhc2guZmlsZSBwXG4gICAgICAgIFxuICAgIG9uRmlsZUJyb3dzZXI6IChhY3Rpb24sIGl0ZW0sIGFyZykgPT5cblxuICAgICAgICBzd2l0Y2ggYWN0aW9uXG4gICAgICAgICAgICB3aGVuICdsb2FkSXRlbScgICAgIHRoZW4gQGxvYWRJdGVtICAgICBpdGVtLCBhcmdcbiAgICAgICAgICAgIHdoZW4gJ2FjdGl2YXRlSXRlbScgdGhlbiBAYWN0aXZhdGVJdGVtIGl0ZW0sIGFyZ1xuICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkRGlyOiAocGF0aCkgLT4gQGxvYWRJdGVtIHR5cGU6J2RpcicgZmlsZTpwYXRoXG4gICAgXG4gICAgbG9hZEl0ZW06IChpdGVtLCBvcHQpIC0+XG5cbiAgICAgICAgb3B0ID89IGFjdGl2ZTonLi4nIGZvY3VzOnRydWVcbiAgICAgICAgaXRlbS5uYW1lID89IHNsYXNoLmZpbGUgaXRlbS5maWxlXG5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gMSwgcG9wOnRydWUsIGNsZWFyOjFcblxuICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICB3aGVuICdkaXInICB0aGVuIEBsb2FkRGlySXRlbSAgaXRlbSwgMCwgb3B0XG4gICAgICAgICAgICB3aGVuICdmaWxlJyBcbiAgICAgICAgICAgICAgICBvcHQuYWN0aXZhdGUgPSBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICB3aGlsZSBAbnVtQ29scygpIDwgMiB0aGVuIEBhZGRDb2x1bW4oKVxuICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSBAZmlsZUl0ZW0oc2xhc2guZGlyKGl0ZW0uZmlsZSkpLCAwLCBvcHRcblxuICAgICAgICBpZiBvcHQuZm9jdXNcbiAgICAgICAgICAgIEBjb2x1bW5zWzBdPy5mb2N1cygpXG5cbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgYWN0aXZhdGVJdGVtOiAoaXRlbSwgY29sKSAtPlxuXG4gICAgICAgIGlmIEBjb2x1bW5zW2NvbCsxXVxuICAgICAgICAgICAgaWYgc2xhc2guc2FtZVBhdGggaXRlbS5maWxlLCBAY29sdW1uc1tjb2wrMV0ucGF0aCgpXG4gICAgICAgICAgICAgICAga2xvZyAnYWN0aXZhdGVJdGVtIHNraXAgYWxyZWFkeSBhY3RpdmUnIGNvbCsxLCBpdGVtLCBAY29sdW1uc1tjb2wrMV0/LnBhdGgoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sKzEsIHBvcDp0cnVlLCBjbGVhcjpjb2wrMVxuXG4gICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2RpcicgIHRoZW4gQGxvYWREaXJJdGVtICBpdGVtLCBjb2wrMSwgZm9jdXM6ZmFsc2VcbiAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIHRoZW4gQGxvYWRGaWxlSXRlbSBpdGVtLCBjb2wrMVxuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZEZpbGVJdGVtOiAoaXRlbSwgY29sPTApIC0+XG5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sLCBwb3A6dHJ1ZVxuXG4gICAgICAgIHdoaWxlIGNvbCA+PSBAbnVtQ29scygpXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcblxuICAgICAgICBmaWxlID0gaXRlbS5maWxlXG5cbiAgICAgICAgc3dpdGNoIHNsYXNoLmV4dCBmaWxlXG4gICAgICAgICAgICB3aGVuICdnaWYnICdwbmcnICdqcGcnICdqcGVnJyAnc3ZnJyAnYm1wJyAnaWNvJ1xuICAgICAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0udGFibGUuYXBwZW5kQ2hpbGQgQGltYWdlSW5mbyBmaWxlXG4gICAgICAgICAgICB3aGVuICd0aWZmJyAndGlmJ1xuICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgICAgICBAY29udmVydEltYWdlIHJvd1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBAZmlsZUluZm8gZmlsZVxuICAgICAgICAgICAgd2hlbiAncHhtJ1xuICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgICAgICBAY29udmVydFBYTSByb3dcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0udGFibGUuYXBwZW5kQ2hpbGQgQGZpbGVJbmZvIGZpbGVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIEBmaWxlSW5mbyBmaWxlXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG5cbiAgICAjIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGltYWdlSW5mbzogKGZpbGUpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgaW1nID0gZWxlbSAnaW1nJyBjbGFzczonYnJvd3NlckltYWdlJyBzcmM6c2xhc2guZmlsZVVybCBmaWxlXG4gICAgICAgIGNudCA9IGVsZW0gY2xhc3M6J2Jyb3dzZXJJbWFnZUNvbnRhaW5lcicgY2hpbGQ6aW1nXG4gICAgICAgIGNudC5hZGRFdmVudExpc3RlbmVyICdkYmxjbGljaycgLT4gb3BlbiBmaWxlXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpbWcub25sb2FkID0gLT5cbiAgICAgICAgICAgIGltZyA9JCAnLmJyb3dzZXJJbWFnZSdcbiAgICAgICAgICAgIGJyID0gaW1nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICB4ID0gaW1nLmNsaWVudFhcbiAgICAgICAgICAgIHdpZHRoICA9IHBhcnNlSW50IGJyLnJpZ2h0IC0gYnIubGVmdCAtIDJcbiAgICAgICAgICAgIGhlaWdodCA9IHBhcnNlSW50IGJyLmJvdHRvbSAtIGJyLnRvcCAtIDJcblxuICAgICAgICAgICAgaW1nLnN0eWxlLm9wYWNpdHkgICA9ICcxJ1xuICAgICAgICAgICAgaW1nLnN0eWxlLm1heFdpZHRoICA9ICcxMDAlJ1xuICAgICAgICAgICAgaW1nLnN0eWxlLm1heEhlaWdodCA9ICc3NXZoJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzdGF0ID0gc2xhc2guZmlsZUV4aXN0cyBmaWxlXG4gICAgICAgICAgICBzaXplID0gcGJ5dGVzKHN0YXQuc2l6ZSkuc3BsaXQgJyAnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGFnZSA9IG1vbWVudCgpLnRvKG1vbWVudChzdGF0Lm10aW1lKSwgdHJ1ZSlcbiAgICAgICAgICAgIFtudW0sIHJhbmdlXSA9IGFnZS5zcGxpdCAnICdcbiAgICAgICAgICAgIG51bSA9ICcxJyBpZiBudW1bMF0gPT0gJ2EnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGh0bWwgID0gXCI8dHI+PHRoIGNvbHNwYW49Mj4je3dpZHRofTxzcGFuIGNsYXNzPSdwdW5jdCc+eDwvc3Bhbj4je2hlaWdodH08L3RoPjwvdHI+XCJcbiAgICAgICAgICAgIGh0bWwgKz0gXCI8dHI+PHRoPiN7c2l6ZVswXX08L3RoPjx0ZD4je3NpemVbMV19PC90ZD48L3RyPlwiXG4gICAgICAgICAgICBodG1sICs9IFwiPHRyPjx0aD4je251bX08L3RoPjx0ZD4je3JhbmdlfTwvdGQ+PC90cj5cIlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpbmZvID0gZWxlbSBjbGFzczonYnJvd3NlckZpbGVJbmZvJyBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgIGVsZW0gJ2RpdicgY2xhc3M6XCJmaWxlSW5mb0ZpbGUgI3tzbGFzaC5leHQgZmlsZX1cIiBodG1sOkZpbGUuc3BhbiBmaWxlXG4gICAgICAgICAgICAgICAgZWxlbSAndGFibGUnIGNsYXNzOlwiZmlsZUluZm9EYXRhXCIgaHRtbDpodG1sXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBjbnQgPSQgJy5icm93c2VySW1hZ2VDb250YWluZXInXG4gICAgICAgICAgICBjbnQuYXBwZW5kQ2hpbGQgaW5mb1xuICAgICAgICBcbiAgICAgICAgY250XG4gICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgICBcbiAgICAgICAgXG4gICAgZmlsZUluZm86IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgc3RhdCA9IHNsYXNoLmZpbGVFeGlzdHMgZmlsZVxuICAgICAgICBzaXplID0gcGJ5dGVzKHN0YXQuc2l6ZSkuc3BsaXQgJyAnXG4gICAgICAgIFxuICAgICAgICB0ID0gbW9tZW50IHN0YXQubXRpbWVcblxuICAgICAgICBhZ2UgPSBtb21lbnQoKS50byh0LCB0cnVlKVxuICAgICAgICBbbnVtLCByYW5nZV0gPSBhZ2Uuc3BsaXQgJyAnXG4gICAgICAgIG51bSA9ICcxJyBpZiBudW1bMF0gPT0gJ2EnXG4gICAgICAgIGlmIHJhbmdlID09ICdmZXcnXG4gICAgICAgICAgICBudW0gPSBtb21lbnQoKS5kaWZmIHQsICdzZWNvbmRzJ1xuICAgICAgICAgICAgcmFuZ2UgPSAnc2Vjb25kcydcbiAgICAgICAgXG4gICAgICAgIGluZm8gPSBlbGVtIGNsYXNzOidicm93c2VyRmlsZUluZm8nIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICBlbGVtICdkaXYnIGNsYXNzOlwiZmlsZUluZm9JY29uICN7c2xhc2guZXh0IGZpbGV9ICN7RmlsZS5pY29uQ2xhc3NOYW1lIGZpbGV9XCJcbiAgICAgICAgICAgIGVsZW0gJ2RpdicgY2xhc3M6XCJmaWxlSW5mb0ZpbGUgI3tzbGFzaC5leHQgZmlsZX1cIiBodG1sOkZpbGUuc3BhbiBmaWxlXG4gICAgICAgICAgICBlbGVtICd0YWJsZScgY2xhc3M6XCJmaWxlSW5mb0RhdGFcIiBodG1sOlwiPHRyPjx0aD4je3NpemVbMF19PC90aD48dGQ+I3tzaXplWzFdfTwvdGQ+PC90cj48dHI+PHRoPiN7bnVtfTwvdGg+PHRkPiN7cmFuZ2V9PC90ZD48L3RyPlwiXG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIGluZm8uYWRkRXZlbnRMaXN0ZW5lciAnZGJsY2xpY2snIC0+IG9wZW4gZmlsZVxuICAgICAgICBcbiAgICAgICAgaW5mb1xuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZERpckl0ZW06IChpdGVtLCBjb2w9MCwgb3B0PXt9KSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBjb2wgPiAwIGFuZCBpdGVtLm5hbWUgPT0gJy8nXG5cbiAgICAgICAgZGlyID0gaXRlbS5maWxlXG5cbiAgICAgICAgb3B0Lmlnbm9yZUhpZGRlbiA9IG5vdCBwcmVmcy5nZXQgXCJicm93c2Vy4pa4c2hvd0hpZGRlbuKWuCN7ZGlyfVwiXG5cbiAgICAgICAgZGlybGlzdCBkaXIsIG9wdCwgKGVyciwgaXRlbXMpID0+XG5cbiAgICAgICAgICAgIGlmIGVycj8gdGhlbiByZXR1cm5cblxuICAgICAgICAgICAgcG9zdC50b01haW4gJ2RpckxvYWRlZCcgZGlyXG5cbiAgICAgICAgICAgIGlmIEBjb2x1bW5zLmxlbmd0aCBhbmQgY29sID49IEBjb2x1bW5zLmxlbmd0aCBhbmQgQHNraXBPbkRibENsaWNrXG4gICAgICAgICAgICAgICAgZGVsZXRlIEBza2lwT25EYmxDbGlja1xuICAgICAgICAgICAgICAgIHJldHVybiBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEBsb2FkRGlySXRlbXMgZGlyLCBpdGVtLCBpdGVtcywgY29sLCBvcHRcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnZGlyJyBkaXJcblxuICAgICAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGxvYWREaXJJdGVtczogKGRpciwgaXRlbSwgaXRlbXMsIGNvbCwgb3B0KSA9PlxuXG4gICAgICAgIHVwZGlyID0gc2xhc2gucmVzb2x2ZSBzbGFzaC5qb2luIGRpciwgJy4uJ1xuXG4gICAgICAgIGlmIGNvbCA9PSAwIG9yIGNvbC0xIDwgQG51bUNvbHMoKSBhbmQgQGNvbHVtbnNbY29sLTFdLmFjdGl2ZVJvdygpPy5pdGVtLm5hbWUgPT0gJy4uJ1xuICAgICAgICAgICAgaWYgaXRlbXNbMF0ubmFtZSBub3QgaW4gWycuLicgJy8nXVxuICAgICAgICAgICAgICAgIGlmIHVwZGlyICE9IGRpclxuICAgICAgICAgICAgICAgICAgICBpdGVtcy51bnNoaWZ0XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnLi4nXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogIHVwZGlyXG5cbiAgICAgICAgd2hpbGUgY29sID49IEBudW1Db2xzKClcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuXG4gICAgICAgIEBjb2x1bW5zW2NvbF0ubG9hZEl0ZW1zIGl0ZW1zLCBpdGVtXG5cbiAgICAgICAgaWYgb3B0LmFjdGl2YXRlXG4gICAgICAgICAgICBAY29sdW1uc1tjb2xdLnJvdyhzbGFzaC5maWxlIG9wdC5hY3RpdmF0ZSk/LmFjdGl2YXRlKClcbiAgICAgICAgZWxzZSBpZiBvcHQuYWN0aXZlXG4gICAgICAgICAgICBAY29sdW1uc1tjb2xdLnJvdyhzbGFzaC5maWxlIG9wdC5hY3RpdmUpPy5zZXRBY3RpdmUoKVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG9wdC5mb2N1cyAhPSBmYWxzZSBhbmQgZW1wdHkoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkgYW5kIGVtcHR5KCQoJy5wb3B1cCcpPy5vdXRlckhUTUwpXG4gICAgICAgICAgICBpZiBjb2wgPSBAbGFzdERpckNvbHVtbigpXG4gICAgICAgICAgICAgICAgY29sLmRpdi5mb2N1cygpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IGZpbGVcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuXG4gICAgICAgIEBuYXZpZ2F0ZVRvRmlsZSBmaWxlXG5cbiAgICBvbk9wZW5GaWxlOiAoZmlsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIG9wZW4gZmlsZVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBpbml0Q29sdW1uczogLT5cblxuICAgICAgICBzdXBlcigpXG5cbiAgICAgICAgQHZpZXcuaW5zZXJ0QmVmb3JlIEBzaGVsZi5kaXYsIEB2aWV3LmZpcnN0Q2hpbGRcbiAgICAgICAgQHZpZXcuaW5zZXJ0QmVmb3JlIEBzaGVsZlJlc2l6ZSwgbnVsbFxuXG4gICAgICAgIEBzaGVsZi5icm93c2VyRGlkSW5pdENvbHVtbnMoKVxuXG4gICAgICAgIEBzZXRTaGVsZlNpemUgQHNoZWxmU2l6ZVxuXG4gICAgY29sdW1uQXRQb3M6IChwb3MpIC0+XG5cbiAgICAgICAgaWYgY29sdW1uID0gc3VwZXIgcG9zXG4gICAgICAgICAgICByZXR1cm4gY29sdW1uXG5cbiAgICAgICAgaWYgZWxlbS5jb250YWluc1BvcyBAc2hlbGYuZGl2LCBwb3NcbiAgICAgICAgICAgIHJldHVybiBAc2hlbGZcblxuICAgIGxhc3RDb2x1bW5QYXRoOiAtPlxuXG4gICAgICAgIGlmIGxhc3RDb2x1bW4gPSBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW4ucGF0aCgpXG5cbiAgICBsYXN0RGlyQ29sdW1uOiAtPlxuXG4gICAgICAgIGlmIGxhc3RDb2x1bW4gPSBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgaWYgbGFzdENvbHVtbi5pc0RpcigpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW5cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtbi5wcmV2Q29sdW1uKClcblxuICAgIG9uQmFja3NwYWNlSW5Db2x1bW46IChjb2x1bW4pIC0+XG5cbiAgICAgICAgY29sdW1uLmNsZWFyU2VhcmNoKClcbiAgICAgICAgQG5hdmlnYXRlICdsZWZ0J1xuXG4gICAgdXBkYXRlQ29sdW1uU2Nyb2xsczogPT5cblxuICAgICAgICBzdXBlcigpXG4gICAgICAgIEBzaGVsZi5zY3JvbGwudXBkYXRlKClcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwXG5cbiAgICBvblNoZWxmRHJhZzogKGRyYWcsIGV2ZW50KSA9PlxuXG4gICAgICAgIHNoZWxmU2l6ZSA9IGNsYW1wIDAsIDQwMCwgZHJhZy5wb3MueFxuICAgICAgICBAc2V0U2hlbGZTaXplIHNoZWxmU2l6ZVxuXG4gICAgc2V0U2hlbGZTaXplOiAoQHNoZWxmU2l6ZSkgLT5cblxuICAgICAgICBwcmVmcy5zZXQgJ3NoZWxm4pa4c2l6ZScgQHNoZWxmU2l6ZVxuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUubGVmdCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcbiAgICAgICAgQHNoZWxmLmRpdi5zdHlsZS53aWR0aCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcbiAgICAgICAgQGNvbHMuc3R5bGUubGVmdCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuXG4gICAgdG9nZ2xlU2hlbGY6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAc2hlbGZTaXplIDwgMVxuICAgICAgICAgICAgQHNldFNoZWxmU2l6ZSAyMDBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGxhc3RVc2VkQ29sdW1uKCk/LmZvY3VzKClcbiAgICAgICAgICAgIEBzZXRTaGVsZlNpemUgMFxuICAgICAgICAgICAgXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcbiAgICAgICAgXG4gICAgcmVmcmVzaDogPT5cblxuICAgICAgICBpZiBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgQG5hdmlnYXRlVG9GaWxlIEBsYXN0VXNlZENvbHVtbigpPy5wYXRoKClcblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlQnJvd3NlclxuIl19
//# sourceURL=../coffee/filebrowser.coffee