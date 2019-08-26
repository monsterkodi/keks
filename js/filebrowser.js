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

File = require('./file');

dirlist = require('./dirlist');

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
            opt = {};
        }
        if (item.name != null) {
            item.name;
        } else {
            item.name = slash.file(item.file);
        }
        this.popColumnsFrom(1);
        switch (item.type) {
            case 'file':
                this.loadFileItem(item);
                break;
            case 'dir':
                this.loadDirItem(item, 0, {
                    active: '..'
                });
        }
        if (opt.focus) {
            return (ref1 = this.columns[0]) != null ? ref1.focus() : void 0;
        }
    };

    FileBrowser.prototype.activateItem = function(item, col) {
        this.clearColumnsFrom(col + 1, {
            pop: true
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
        var cnt, file;
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
                cnt = elem({
                    "class": 'browserImageContainer',
                    child: elem('img', {
                        "class": 'browserImage',
                        src: slash.fileUrl(file)
                    })
                });
                cnt.addEventListener('dblclick', function() {
                    return open(file);
                });
                this.columns[col].table.appendChild(cnt);
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
                _this.loadDirItems(dir, item, items, col, opt);
                post.emit('dir', dir);
                return _this.updateColumnScrolls();
            };
        })(this));
    };

    FileBrowser.prototype.loadDirItems = function(dir, item, items, col, opt) {
        var ref1, ref2, ref3, ref4, updir;
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
        if (opt.active) {
            if ((ref3 = this.columns[col].row(slash.file(opt.active))) != null) {
                ref3.setActive();
            }
        }
        if (opt.focus !== false && empty(document.activeElement) && empty((ref4 = $('.popup')) != null ? ref4.outerHTML : void 0)) {
            if (col = this.lastDirColumn()) {
                return col.div.focus();
            }
        }
    };

    FileBrowser.prototype.navigateToFile = function(file) {
        var col, col0index, filelist, i, index, item, lastItem, lastPath, lastType, lastdir, lastlist, listindex, opt, paths, pkgDir, pkglist, ref1, ref2, ref3, ref4, relative, relst, row, type, upCount;
        lastPath = (ref1 = this.lastUsedColumn()) != null ? ref1.path() : void 0;
        if (file === lastPath) {
            return;
        }
        if (slash.isRelative(file)) {
            return;
        }
        filelist = slash.pathlist(file);
        lastlist = slash.pathlist(lastPath);
        if (valid(lastlist)) {
            lastdir = last(lastlist);
            if ((ref2 = this.lastUsedColumn()) != null ? ref2.isFile() : void 0) {
                lastdir = slash.dir(lastdir);
            }
            relative = slash.relative(file, lastdir);
            if (slash.isRelative(relative)) {
                upCount = 0;
                while (relative.startsWith('../')) {
                    upCount += 1;
                    relative = relative.substr(3);
                }
                if (upCount < this.numCols() - 1) {
                    col = this.numCols() - 1 - upCount;
                    relst = slash.pathlist(relative);
                    paths = filelist.slice(filelist.length - relst.length);
                }
            }
        }
        if (empty(paths)) {
            pkgDir = slash.pkg(file);
            pkglist = slash.pathlist(pkgDir);
            listindex = pkglist.length - 1;
            col0index = listindex;
            col = 0;
            if (filelist[col0index] === ((ref3 = this.columns[0]) != null ? ref3.path() : void 0)) {
                while (col0index < lastlist.length && col0index < filelist.length && lastlist[col0index] === filelist[col0index]) {
                    col0index += 1;
                    col += 1;
                }
            }
            paths = filelist.slice(col0index);
        }
        if (slash.isFile(last(paths))) {
            lastType = 'file';
        } else {
            lastType = 'dir';
        }
        this.popColumnsFrom(col + paths.length);
        this.clearColumnsFrom(col);
        while (this.numCols() < paths.length) {
            this.addColumn();
        }
        if (col > 0) {
            if (row = this.columns[col - 1].row(slash.file(paths[0]))) {
                row.setActive();
            } else {
                type = slash.isDir(file) && 'dir' || 'file';
                item = {
                    file: file,
                    type: type,
                    name: slash.basename(file)
                };
                row = this.columns[col - 1].addItem(item);
                row.setActive();
                this.columns[col - 1].focus();
            }
        }
        for (index = i = 0, ref4 = paths.length; 0 <= ref4 ? i < ref4 : i > ref4; index = 0 <= ref4 ? ++i : --i) {
            type = index === paths.length - 1 ? lastType : 'dir';
            file = paths[index];
            if ((col === 0 && 0 === index) && type === 'file') {
                type = 'dir';
                file = slash.dir(file);
            }
            item = {
                file: file,
                type: type
            };
            switch (type) {
                case 'file':
                    this.loadFileItem(item, col + index);
                    break;
                case 'dir':
                    opt = {};
                    if (index < paths.length - 1) {
                        opt.active = paths[index + 1];
                    } else if ((col === 0 && 0 === index) && paths.length === 1) {
                        opt.active = paths[0];
                    }
                    this.loadDirItem(item, col + index, opt);
            }
        }
        if (col = this.lastDirColumn()) {
            klog('col', col.index, col.parent.file);
            if (row = col.row(slash.file(file))) {
                klog('activate', row.column.index, row.item.file);
                row.setActive();
            }
        }
        lastItem = {
            file: last(paths),
            type: lastType
        };
        return this.emit('itemActivated', lastItem);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDJKQUFBO0lBQUE7Ozs7QUFRQSxNQUFpRyxPQUFBLENBQVEsS0FBUixDQUFqRyxFQUFFLGVBQUYsRUFBUSxlQUFSLEVBQWMsaUJBQWQsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsZUFBMUMsRUFBZ0QsZUFBaEQsRUFBc0QsZUFBdEQsRUFBNEQsaUJBQTVELEVBQW1FLGVBQW5FLEVBQXlFLGlCQUF6RSxFQUFnRixXQUFoRixFQUFvRixXQUFwRixFQUF3RixTQUF4RixFQUEyRjs7QUFFM0YsT0FBQSxHQUFXLE9BQUEsQ0FBUSxXQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7QUFDWCxJQUFBLEdBQVcsT0FBQSxDQUFRLFFBQVI7O0FBQ1gsT0FBQSxHQUFXLE9BQUEsQ0FBUSxXQUFSOztBQUNYLE1BQUEsR0FBVyxPQUFBLENBQVEsY0FBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFFBQVI7O0FBRUw7OztJQUVXLHFCQUFDLElBQUQ7Ozs7Ozs7O1FBRVQsNkNBQU0sSUFBTjtRQUVBLE1BQU0sQ0FBQyxXQUFQLEdBQXFCO1FBRXJCLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsS0FBRCxHQUFVLElBQUksS0FBSixDQUFVLElBQVY7UUFDVixJQUFDLENBQUEsSUFBRCxHQUFVO1FBRVYsSUFBSSxDQUFDLEVBQUwsQ0FBUSxNQUFSLEVBQXNCLElBQUMsQ0FBQSxNQUF2QjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsYUFBUixFQUFzQixJQUFDLENBQUEsYUFBdkI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFVBQVIsRUFBc0IsSUFBQyxDQUFBLFVBQXZCO1FBRUEsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFBLENBQUssS0FBTCxF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LENBQUUsSUFBbkIsQ0FBQSxVQUFoQixFQURKOztJQUZLOzs7O0dBbllhOztBQXdZMUIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgb3BlbiwgdmFsaWQsIGVtcHR5LCBjbGFtcCwgcHJlZnMsIGxhc3QsIGVsZW0sIGRyYWcsIHN0YXRlLCBrbG9nLCBzbGFzaCwgZnMsIG9zLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbkJyb3dzZXIgID0gcmVxdWlyZSAnLi9icm93c2VyJ1xuU2hlbGYgICAgPSByZXF1aXJlICcuL3NoZWxmJ1xuRmlsZSAgICAgPSByZXF1aXJlICcuL2ZpbGUnXG5kaXJsaXN0ICA9IHJlcXVpcmUgJy4vZGlybGlzdCdcbnBieXRlcyAgID0gcmVxdWlyZSAncHJldHR5LWJ5dGVzJ1xubW9tZW50ICAgPSByZXF1aXJlICdtb21lbnQnXG5cbmNsYXNzIEZpbGVCcm93c2VyIGV4dGVuZHMgQnJvd3NlclxuXG4gICAgY29uc3RydWN0b3I6ICh2aWV3KSAtPlxuXG4gICAgICAgIHN1cGVyIHZpZXdcblxuICAgICAgICB3aW5kb3cuZmlsZWJyb3dzZXIgPSBAXG5cbiAgICAgICAgQGxvYWRJRCA9IDBcbiAgICAgICAgQHNoZWxmICA9IG5ldyBTaGVsZiBAXG4gICAgICAgIEBuYW1lICAgPSAnRmlsZUJyb3dzZXInXG5cbiAgICAgICAgcG9zdC5vbiAnZmlsZScgICAgICAgIEBvbkZpbGVcbiAgICAgICAgcG9zdC5vbiAnZmlsZWJyb3dzZXInIEBvbkZpbGVCcm93c2VyXG4gICAgICAgIHBvc3Qub24gJ29wZW5GaWxlJyAgICBAb25PcGVuRmlsZVxuXG4gICAgICAgIEBzaGVsZlJlc2l6ZSA9IGVsZW0gJ2RpdicgY2xhc3M6ICdzaGVsZlJlc2l6ZSdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUudG9wICAgICAgPSAnMHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUuYm90dG9tICAgPSAnMHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUubGVmdCAgICAgPSAnMTk0cHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS53aWR0aCAgICA9ICc2cHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5jdXJzb3IgICA9ICdldy1yZXNpemUnXG5cbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQHNoZWxmUmVzaXplXG4gICAgICAgICAgICBvbk1vdmU6ICBAb25TaGVsZkRyYWdcblxuICAgICAgICBAc2hlbGZTaXplID0gcHJlZnMuZ2V0ICdzaGVsZuKWuHNpemUnIDIwMFxuXG4gICAgICAgIEBpbml0Q29sdW1ucygpXG5cbiAgICBvbkZpbGVCcm93c2VyOiAoYWN0aW9uLCBpdGVtLCBhcmcpID0+XG5cbiAgICAgICAgc3dpdGNoIGFjdGlvblxuICAgICAgICAgICAgd2hlbiAnbG9hZEl0ZW0nICAgICB0aGVuIEBsb2FkSXRlbSAgICAgaXRlbSwgYXJnXG4gICAgICAgICAgICB3aGVuICdhY3RpdmF0ZUl0ZW0nIHRoZW4gQGFjdGl2YXRlSXRlbSBpdGVtLCBhcmdcbiAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZERpcjogKHBhdGgpIC0+IEBsb2FkSXRlbSB0eXBlOidkaXInIGZpbGU6cGF0aFxuICAgIFxuICAgIGxvYWRJdGVtOiAoaXRlbSwgb3B0KSAtPlxuXG4gICAgICAgIG9wdCA/PSB7fVxuICAgICAgICBpdGVtLm5hbWUgPz0gc2xhc2guZmlsZSBpdGVtLmZpbGVcblxuICAgICAgICBAcG9wQ29sdW1uc0Zyb20gMVxuXG4gICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIHRoZW4gQGxvYWRGaWxlSXRlbSBpdGVtXG4gICAgICAgICAgICB3aGVuICdkaXInICB0aGVuIEBsb2FkRGlySXRlbSAgaXRlbSwgMCwgYWN0aXZlOicuLidcblxuICAgICAgICBpZiBvcHQuZm9jdXNcbiAgICAgICAgICAgIEBjb2x1bW5zWzBdPy5mb2N1cygpXG5cbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgYWN0aXZhdGVJdGVtOiAoaXRlbSwgY29sKSAtPlxuXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbCsxLCBwb3A6dHJ1ZVxuXG4gICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2RpcicgIHRoZW4gQGxvYWREaXJJdGVtICBpdGVtLCBjb2wrMSwgZm9jdXM6ZmFsc2VcbiAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIHRoZW4gQGxvYWRGaWxlSXRlbSBpdGVtLCBjb2wrMVxuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZEZpbGVJdGVtOiAoaXRlbSwgY29sPTApIC0+XG5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sLCBwb3A6dHJ1ZVxuXG4gICAgICAgIHdoaWxlIGNvbCA+PSBAbnVtQ29scygpXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcblxuICAgICAgICBmaWxlID0gaXRlbS5maWxlXG5cbiAgICAgICAgc3dpdGNoIHNsYXNoLmV4dCBmaWxlXG4gICAgICAgICAgICB3aGVuICdnaWYnICdwbmcnICdqcGcnICdqcGVnJyAnc3ZnJyAnYm1wJyAnaWNvJ1xuICAgICAgICAgICAgICAgIGNudCA9IGVsZW0gY2xhc3M6ICdicm93c2VySW1hZ2VDb250YWluZXInIGNoaWxkOiBlbGVtICdpbWcnIGNsYXNzOiAnYnJvd3NlckltYWdlJyBzcmM6IHNsYXNoLmZpbGVVcmwgZmlsZVxuICAgICAgICAgICAgICAgIGNudC5hZGRFdmVudExpc3RlbmVyICdkYmxjbGljaycgLT4gb3BlbiBmaWxlXG4gICAgICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBjbnRcbiAgICAgICAgICAgIHdoZW4gJ3RpZmYnICd0aWYnXG4gICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgIEBjb252ZXJ0SW1hZ2Ugcm93XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIEBmaWxlSW5mbyBmaWxlXG4gICAgICAgICAgICB3aGVuICdweG0nXG4gICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgIEBjb252ZXJ0UFhNIHJvd1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBAZmlsZUluZm8gZmlsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0udGFibGUuYXBwZW5kQ2hpbGQgQGZpbGVJbmZvIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcblxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgZmlsZUluZm86IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgc3RhdCA9IHNsYXNoLmZpbGVFeGlzdHMgZmlsZVxuICAgICAgICBzaXplID0gcGJ5dGVzKHN0YXQuc2l6ZSkuc3BsaXQgJyAnXG4gICAgICAgIFxuICAgICAgICB0ID0gbW9tZW50IHN0YXQubXRpbWVcblxuICAgICAgICBhZ2UgPSBtb21lbnQoKS50byh0LCB0cnVlKVxuICAgICAgICBbbnVtLCByYW5nZV0gPSBhZ2Uuc3BsaXQgJyAnXG4gICAgICAgIG51bSA9ICcxJyBpZiBudW1bMF0gPT0gJ2EnXG4gICAgICAgIGlmIHJhbmdlID09ICdmZXcnXG4gICAgICAgICAgICBudW0gPSBtb21lbnQoKS5kaWZmIHQsICdzZWNvbmRzJ1xuICAgICAgICAgICAgcmFuZ2UgPSAnc2Vjb25kcydcbiAgICAgICAgXG4gICAgICAgIGluZm8gPSBlbGVtIGNsYXNzOidicm93c2VyRmlsZUluZm8nIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICBlbGVtICdkaXYnIGNsYXNzOlwiZmlsZUluZm9JY29uICN7c2xhc2guZXh0IGZpbGV9ICN7RmlsZS5pY29uQ2xhc3NOYW1lIGZpbGV9XCJcbiAgICAgICAgICAgIGVsZW0gJ2RpdicgY2xhc3M6XCJmaWxlSW5mb0ZpbGUgI3tzbGFzaC5leHQgZmlsZX1cIiBodG1sOkZpbGUuc3BhbiBmaWxlXG4gICAgICAgICAgICBlbGVtICd0YWJsZScgY2xhc3M6XCJmaWxlSW5mb0RhdGFcIiBodG1sOlwiPHRyPjx0aD4je3NpemVbMF19PC90aD48dGQ+I3tzaXplWzFdfTwvdGQ+PC90cj48dHI+PHRoPiN7bnVtfTwvdGg+PHRkPiN7cmFuZ2V9PC90ZD48L3RyPlwiXG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIGluZm8uYWRkRXZlbnRMaXN0ZW5lciAnZGJsY2xpY2snIC0+IG9wZW4gZmlsZVxuICAgICAgICBcbiAgICAgICAgaW5mb1xuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZERpckl0ZW06IChpdGVtLCBjb2w9MCwgb3B0PXt9KSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBjb2wgPiAwIGFuZCBpdGVtLm5hbWUgPT0gJy8nXG5cbiAgICAgICAgZGlyID0gaXRlbS5maWxlXG5cbiAgICAgICAgb3B0Lmlnbm9yZUhpZGRlbiA9IG5vdCBwcmVmcy5nZXQgXCJicm93c2Vy4pa4c2hvd0hpZGRlbuKWuCN7ZGlyfVwiXG5cbiAgICAgICAgZGlybGlzdCBkaXIsIG9wdCwgKGVyciwgaXRlbXMpID0+XG5cbiAgICAgICAgICAgIGlmIGVycj8gdGhlbiByZXR1cm5cblxuICAgICAgICAgICAgcG9zdC50b01haW4gJ2RpckxvYWRlZCcgZGlyXG5cbiAgICAgICAgICAgIEBsb2FkRGlySXRlbXMgZGlyLCBpdGVtLCBpdGVtcywgY29sLCBvcHRcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnZGlyJyBkaXJcblxuICAgICAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGxvYWREaXJJdGVtczogKGRpciwgaXRlbSwgaXRlbXMsIGNvbCwgb3B0KSA9PlxuXG4gICAgICAgIHVwZGlyID0gc2xhc2gucmVzb2x2ZSBzbGFzaC5qb2luIGRpciwgJy4uJ1xuXG4gICAgICAgIGlmIGNvbCA9PSAwIG9yIGNvbC0xIDwgQG51bUNvbHMoKSBhbmQgQGNvbHVtbnNbY29sLTFdLmFjdGl2ZVJvdygpPy5pdGVtLm5hbWUgPT0gJy4uJ1xuICAgICAgICAgICAgaWYgaXRlbXNbMF0ubmFtZSBub3QgaW4gWycuLicgJy8nXVxuICAgICAgICAgICAgICAgIGlmIHVwZGlyICE9IGRpclxuICAgICAgICAgICAgICAgICAgICBpdGVtcy51bnNoaWZ0XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnLi4nXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogIHVwZGlyXG5cbiAgICAgICAgd2hpbGUgY29sID49IEBudW1Db2xzKClcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuXG4gICAgICAgIEBjb2x1bW5zW2NvbF0ubG9hZEl0ZW1zIGl0ZW1zLCBpdGVtXG5cbiAgICAgICAgaWYgb3B0LmFjdGl2ZVxuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS5yb3coc2xhc2guZmlsZSBvcHQuYWN0aXZlKT8uc2V0QWN0aXZlKClcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBvcHQuZm9jdXMgIT0gZmFsc2UgYW5kIGVtcHR5KGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIGFuZCBlbXB0eSgkKCcucG9wdXAnKT8ub3V0ZXJIVE1MKVxuICAgICAgICAgICAgaWYgY29sID0gQGxhc3REaXJDb2x1bW4oKVxuICAgICAgICAgICAgICAgIGNvbC5kaXYuZm9jdXMoKVxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgbmF2aWdhdGVUb0ZpbGU6IChmaWxlKSAtPlxuICAgICAgICAgICAgICAgIFxuICAgICAgICBsYXN0UGF0aCA9IEBsYXN0VXNlZENvbHVtbigpPy5wYXRoKClcbiAgICAgICAgXG4gICAgICAgIGlmIGZpbGUgPT0gbGFzdFBhdGhcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIHNsYXNoLmlzUmVsYXRpdmUgZmlsZVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgZmlsZWxpc3QgPSBzbGFzaC5wYXRobGlzdCBmaWxlXG4gICAgICAgIGxhc3RsaXN0ID0gc2xhc2gucGF0aGxpc3QgbGFzdFBhdGhcblxuICAgICAgICBpZiB2YWxpZCBsYXN0bGlzdFxuXG4gICAgICAgICAgICBsYXN0ZGlyID0gbGFzdCBsYXN0bGlzdFxuICAgICAgICAgICAgaWYgQGxhc3RVc2VkQ29sdW1uKCk/LmlzRmlsZSgpXG4gICAgICAgICAgICAgICAgbGFzdGRpciA9IHNsYXNoLmRpciBsYXN0ZGlyXG4gICAgICAgICAgICByZWxhdGl2ZSA9IHNsYXNoLnJlbGF0aXZlIGZpbGUsIGxhc3RkaXJcblxuICAgICAgICAgICAgaWYgc2xhc2guaXNSZWxhdGl2ZSByZWxhdGl2ZVxuICAgICAgICAgICAgICAgIHVwQ291bnQgPSAwXG4gICAgICAgICAgICAgICAgd2hpbGUgcmVsYXRpdmUuc3RhcnRzV2l0aCAnLi4vJ1xuICAgICAgICAgICAgICAgICAgICB1cENvdW50ICs9IDFcbiAgICAgICAgICAgICAgICAgICAgcmVsYXRpdmUgPSByZWxhdGl2ZS5zdWJzdHIgM1xuXG4gICAgICAgICAgICAgICAgaWYgdXBDb3VudCA8IEBudW1Db2xzKCktMVxuICAgICAgICAgICAgICAgICAgICBjb2wgICA9IEBudW1Db2xzKCkgLSAxIC0gdXBDb3VudFxuICAgICAgICAgICAgICAgICAgICByZWxzdCA9IHNsYXNoLnBhdGhsaXN0IHJlbGF0aXZlXG4gICAgICAgICAgICAgICAgICAgIHBhdGhzID0gZmlsZWxpc3Quc2xpY2UgZmlsZWxpc3QubGVuZ3RoIC0gcmVsc3QubGVuZ3RoXG5cbiAgICAgICAgaWYgZW1wdHkgcGF0aHNcblxuICAgICAgICAgICAgcGtnRGlyICAgPSBzbGFzaC5wa2cgZmlsZVxuICAgICAgICAgICAgcGtnbGlzdCAgPSBzbGFzaC5wYXRobGlzdCBwa2dEaXJcblxuICAgICAgICAgICAgbGlzdGluZGV4ID0gcGtnbGlzdC5sZW5ndGggLSAxXG4gICAgICAgICAgICBjb2wwaW5kZXggPSBsaXN0aW5kZXhcbiAgICAgICAgICAgIGNvbCA9IDBcblxuICAgICAgICAgICAgaWYgZmlsZWxpc3RbY29sMGluZGV4XSA9PSBAY29sdW1uc1swXT8ucGF0aCgpXG4gICAgICAgICAgICAgICAgd2hpbGUgY29sMGluZGV4IDwgbGFzdGxpc3QubGVuZ3RoIGFuZCBjb2wwaW5kZXggPCBmaWxlbGlzdC5sZW5ndGggYW5kIGxhc3RsaXN0W2NvbDBpbmRleF0gPT0gZmlsZWxpc3RbY29sMGluZGV4XVxuICAgICAgICAgICAgICAgICAgICBjb2wwaW5kZXggKz0gMVxuICAgICAgICAgICAgICAgICAgICBjb2wgKz0gMVxuXG4gICAgICAgICAgICBwYXRocyA9IGZpbGVsaXN0LnNsaWNlIGNvbDBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRmlsZSBsYXN0IHBhdGhzXG4gICAgICAgICAgICBsYXN0VHlwZSA9ICdmaWxlJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBsYXN0VHlwZSA9ICdkaXInXG5cbiAgICAgICAgQHBvcENvbHVtbnNGcm9tICAgY29sK3BhdGhzLmxlbmd0aFxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2xcbiAgICAgICAgXG4gICAgICAgIHdoaWxlIEBudW1Db2xzKCkgPCBwYXRocy5sZW5ndGhcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuICAgICAgICBcbiAgICAgICAgaWYgY29sID4gMFxuICAgICAgICAgICAgaWYgcm93ID0gQGNvbHVtbnNbY29sLTFdLnJvdyhzbGFzaC5maWxlIHBhdGhzWzBdKVxuICAgICAgICAgICAgICAgIHJvdy5zZXRBY3RpdmUoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHR5cGUgPSBzbGFzaC5pc0RpcihmaWxlKSBhbmQgJ2Rpcicgb3IgJ2ZpbGUnXG4gICAgICAgICAgICAgICAgaXRlbSA9IGZpbGU6ZmlsZSwgdHlwZTp0eXBlLCBuYW1lOnNsYXNoLmJhc2VuYW1lIGZpbGVcbiAgICAgICAgICAgICAgICByb3cgPSBAY29sdW1uc1tjb2wtMV0uYWRkSXRlbSBpdGVtXG4gICAgICAgICAgICAgICAgcm93LnNldEFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgQGNvbHVtbnNbY29sLTFdLmZvY3VzKClcblxuICAgICAgICBmb3IgaW5kZXggaW4gWzAuLi5wYXRocy5sZW5ndGhdXG4gICAgICAgICAgICB0eXBlID0gaWYgaW5kZXggPT0gcGF0aHMubGVuZ3RoLTEgdGhlbiBsYXN0VHlwZSBlbHNlICdkaXInXG4gICAgICAgICAgICBmaWxlID0gcGF0aHNbaW5kZXhdXG4gICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBjb2wgPT0gMCA9PSBpbmRleCBhbmQgdHlwZSA9PSAnZmlsZSdcbiAgICAgICAgICAgICAgICB0eXBlID0gJ2RpcidcbiAgICAgICAgICAgICAgICBmaWxlID0gc2xhc2guZGlyIGZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGl0ZW0gPSBmaWxlOmZpbGUsIHR5cGU6dHlwZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzd2l0Y2ggdHlwZVxuICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIHRoZW4gQGxvYWRGaWxlSXRlbSBpdGVtLCBjb2wraW5kZXhcbiAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgIG9wdCA9IHt9XG4gICAgICAgICAgICAgICAgICAgIGlmIGluZGV4IDwgcGF0aHMubGVuZ3RoLTFcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdC5hY3RpdmUgPSBwYXRoc1tpbmRleCsxXVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGNvbCA9PSAwID09IGluZGV4IGFuZCBwYXRocy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmFjdGl2ZSA9IHBhdGhzWzBdXG4gICAgICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSBpdGVtLCBjb2wraW5kZXgsIG9wdFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgY29sID0gQGxhc3REaXJDb2x1bW4oKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBrbG9nICdjb2wnIGNvbC5pbmRleCwgY29sLnBhcmVudC5maWxlXG4gICAgICAgICAgICBpZiByb3cgPSBjb2wucm93KHNsYXNoLmZpbGUgZmlsZSlcbiAgICAgICAgICAgICAgICBrbG9nICdhY3RpdmF0ZScgcm93LmNvbHVtbi5pbmRleCwgcm93Lml0ZW0uZmlsZVxuICAgICAgICAgICAgICAgIHJvdy5zZXRBY3RpdmUoKVxuXG4gICAgICAgIGxhc3RJdGVtID0gZmlsZTpsYXN0KHBhdGhzKSwgdHlwZTpsYXN0VHlwZVxuICAgICAgICBcbiAgICAgICAgQGVtaXQgJ2l0ZW1BY3RpdmF0ZWQnIGxhc3RJdGVtXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IGZpbGVcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuXG4gICAgICAgIEBuYXZpZ2F0ZVRvRmlsZSBmaWxlXG5cbiAgICBvbk9wZW5GaWxlOiAoZmlsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIG9wZW4gZmlsZVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBpbml0Q29sdW1uczogLT5cblxuICAgICAgICBzdXBlcigpXG5cbiAgICAgICAgQHZpZXcuaW5zZXJ0QmVmb3JlIEBzaGVsZi5kaXYsIEB2aWV3LmZpcnN0Q2hpbGRcbiAgICAgICAgQHZpZXcuaW5zZXJ0QmVmb3JlIEBzaGVsZlJlc2l6ZSwgbnVsbFxuXG4gICAgICAgIEBzaGVsZi5icm93c2VyRGlkSW5pdENvbHVtbnMoKVxuXG4gICAgICAgIEBzZXRTaGVsZlNpemUgQHNoZWxmU2l6ZVxuXG4gICAgY29sdW1uQXRQb3M6IChwb3MpIC0+XG5cbiAgICAgICAgaWYgY29sdW1uID0gc3VwZXIgcG9zXG4gICAgICAgICAgICByZXR1cm4gY29sdW1uXG5cbiAgICAgICAgaWYgZWxlbS5jb250YWluc1BvcyBAc2hlbGYuZGl2LCBwb3NcbiAgICAgICAgICAgIHJldHVybiBAc2hlbGZcblxuICAgIGxhc3RDb2x1bW5QYXRoOiAtPlxuXG4gICAgICAgIGlmIGxhc3RDb2x1bW4gPSBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW4ucGF0aCgpXG5cbiAgICBsYXN0RGlyQ29sdW1uOiAtPlxuXG4gICAgICAgIGlmIGxhc3RDb2x1bW4gPSBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgaWYgbGFzdENvbHVtbi5pc0RpcigpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW5cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtbi5wcmV2Q29sdW1uKClcblxuICAgIG9uQmFja3NwYWNlSW5Db2x1bW46IChjb2x1bW4pIC0+XG5cbiAgICAgICAgY29sdW1uLmNsZWFyU2VhcmNoKClcbiAgICAgICAgQG5hdmlnYXRlICdsZWZ0J1xuXG4gICAgdXBkYXRlQ29sdW1uU2Nyb2xsczogPT5cblxuICAgICAgICBzdXBlcigpXG4gICAgICAgIEBzaGVsZi5zY3JvbGwudXBkYXRlKClcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwXG5cbiAgICBvblNoZWxmRHJhZzogKGRyYWcsIGV2ZW50KSA9PlxuXG4gICAgICAgIHNoZWxmU2l6ZSA9IGNsYW1wIDAsIDQwMCwgZHJhZy5wb3MueFxuICAgICAgICBAc2V0U2hlbGZTaXplIHNoZWxmU2l6ZVxuXG4gICAgc2V0U2hlbGZTaXplOiAoQHNoZWxmU2l6ZSkgLT5cblxuICAgICAgICBwcmVmcy5zZXQgJ3NoZWxm4pa4c2l6ZScgQHNoZWxmU2l6ZVxuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUubGVmdCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcbiAgICAgICAgQHNoZWxmLmRpdi5zdHlsZS53aWR0aCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcbiAgICAgICAgQGNvbHMuc3R5bGUubGVmdCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuXG4gICAgdG9nZ2xlU2hlbGY6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAc2hlbGZTaXplIDwgMVxuICAgICAgICAgICAgQHNldFNoZWxmU2l6ZSAyMDBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGxhc3RVc2VkQ29sdW1uKCk/LmZvY3VzKClcbiAgICAgICAgICAgIEBzZXRTaGVsZlNpemUgMFxuICAgICAgICAgICAgXG4gICAgICAgIEB1cGRhdGVDb2x1bW5TY3JvbGxzKClcbiAgICAgICAgXG4gICAgcmVmcmVzaDogPT5cblxuICAgICAgICBpZiBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgQG5hdmlnYXRlVG9GaWxlIEBsYXN0VXNlZENvbHVtbigpPy5wYXRoKClcblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlQnJvd3NlclxuIl19
//# sourceURL=../coffee/filebrowser.coffee