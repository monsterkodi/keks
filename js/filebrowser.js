// koffee 1.4.0

/*
00000000  000  000      00000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000
000       000  000      000             000   000  000   000  000   000  000 0 000  000       000       000   000
000000    000  000      0000000         0000000    0000000    000   000  000000000  0000000   0000000   0000000
000       000  000      000             000   000  000   000  000   000  000   000       000  000       000   000
000       000  0000000  00000000        0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var $, Browser, FileBrowser, Shelf, _, clamp, dirCache, dirlist, drag, elem, empty, fs, klog, last, open, os, post, prefs, ref, slash, state, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, open = ref.open, valid = ref.valid, empty = ref.empty, clamp = ref.clamp, prefs = ref.prefs, last = ref.last, elem = ref.elem, drag = ref.drag, state = ref.state, klog = ref.klog, slash = ref.slash, fs = ref.fs, os = ref.os, $ = ref.$, _ = ref._;

Browser = require('./browser');

Shelf = require('./shelf');

dirlist = require('./dirlist');

dirCache = require('./dircache');

FileBrowser = (function(superClass) {
    extend(FileBrowser, superClass);

    function FileBrowser(view) {
        this.refresh = bind(this.refresh, this);
        this.onShelfDrag = bind(this.onShelfDrag, this);
        this.updateColumnScrolls = bind(this.updateColumnScrolls, this);
        this.onOpenFile = bind(this.onOpenFile, this);
        this.onFile = bind(this.onFile, this);
        this.loadDirItems = bind(this.loadDirItems, this);
        this.onDirCache = bind(this.onDirCache, this);
        this.onFileBrowser = bind(this.onFileBrowser, this);
        FileBrowser.__super__.constructor.call(this, view);
        window.filebrowser = this;
        this.loadID = 0;
        this.shelf = new Shelf(this);
        this.name = 'FileBrowser';
        this.srcCache = {};
        post.on('file', this.onFile);
        post.on('filebrowser', this.onFileBrowser);
        post.on('dircache', this.onDirCache);
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
            return this.columns[0].focus();
        }
    };

    FileBrowser.prototype.activateItem = function(item, col) {
        this.clearColumnsFrom(col + 2, {
            pop: true
        });
        switch (item.type) {
            case 'dir':
                return this.loadDirItem(item, col + 1);
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
                this.columns[col].table.appendChild(cnt);
                break;
            case 'tiff':
            case 'tif':
                if (!slash.win()) {
                    this.convertImage(row);
                }
                break;
            case 'pxm':
                if (!slash.win()) {
                    this.convertPXM(row);
                }
                break;
            default:
                if (item.textFile) {
                    this.loadTextItem(item, col);
                }
        }
        return this.updateColumnScrolls();
    };

    FileBrowser.prototype.loadTextItem = function(item, col) {
        return klog('loadTextItem', item);
    };

    FileBrowser.prototype.onDirCache = function(dir) {
        var column, i, len, ref1;
        ref1 = this.columns;
        for (i = 0, len = ref1.length; i < len; i++) {
            column = ref1[i];
            if (column.path() === dir) {
                this.loadDirItem({
                    file: dir,
                    type: 'dir'
                }, column.index, {
                    active: column.activePath()
                });
                return;
            }
        }
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
        if (dirCache.has(dir) && !opt.ignoreCache) {
            this.loadDirItems(dir, item, dirCache.get(dir), col, opt);
            return post.emit('dir', dir);
        } else {
            opt.ignoreHidden = !prefs.get("browser▸showHidden▸" + dir);
            return dirlist(dir, opt, (function(_this) {
                return function(err, items) {
                    if (err != null) {
                        return;
                    }
                    post.toMain('dirLoaded', dir);
                    dirCache.set(dir, items);
                    _this.loadDirItems(dir, item, items, col, opt);
                    post.emit('dir', dir);
                    return _this.updateColumnScrolls();
                };
            })(this));
        }
    };

    FileBrowser.prototype.loadDirItems = function(dir, item, items, col, opt) {
        var ref1, ref2, ref3, updir;
        updir = slash.resolve(slash.join(dir, '..'));
        if (col === 0 || col - 1 < this.numCols() && ((ref1 = this.columns[col - 1].activeRow()) != null ? ref1.item.name : void 0) === '..') {
            if ((ref2 = items[0].name) !== '..' && ref2 !== '/') {
                if (!((updir === dir && dir === slash.resolve('/')))) {
                    items.unshift({
                        name: '..',
                        type: 'dir',
                        file: updir
                    });
                } else {
                    items.unshift({
                        name: '/',
                        type: 'dir',
                        file: dir
                    });
                }
            }
        }
        while (col >= this.numCols()) {
            this.addColumn();
        }
        this.columns[col].loadItems(items, item);
        if (opt.active) {
            return (ref3 = this.columns[col].row(slash.file(opt.active))) != null ? ref3.setActive() : void 0;
        }
    };

    FileBrowser.prototype.navigateToFile = function(file) {
        var col, col0index, filelist, i, index, item, lastItem, lastPath, lastType, lastdir, lastlist, listindex, opt, paths, pkgDir, pkglist, ref1, ref2, ref3, ref4, ref5, relative, relst, type, upCount;
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
            if ((ref4 = this.columns[col - 1].row(slash.file(paths[0]))) != null) {
                ref4.setActive();
            }
        }
        for (index = i = 0, ref5 = paths.length; 0 <= ref5 ? i < ref5 : i > ref5; index = 0 <= ref5 ? ++i : --i) {
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
        return this.cols.style.left = this.shelfSize + "px";
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
        dirCache.reset();
        this.srcCache = {};
        if (this.lastUsedColumn()) {
            return this.navigateToFile((ref1 = this.lastUsedColumn()) != null ? ref1.path() : void 0);
        }
    };

    return FileBrowser;

})(Browser);

module.exports = FileBrowser;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLCtJQUFBO0lBQUE7Ozs7QUFRQSxNQUFpRyxPQUFBLENBQVEsS0FBUixDQUFqRyxFQUFFLGVBQUYsRUFBUSxlQUFSLEVBQWMsaUJBQWQsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsZUFBMUMsRUFBZ0QsZUFBaEQsRUFBc0QsZUFBdEQsRUFBNEQsaUJBQTVELEVBQW1FLGVBQW5FLEVBQXlFLGlCQUF6RSxFQUFnRixXQUFoRixFQUFvRixXQUFwRixFQUF3RixTQUF4RixFQUEyRjs7QUFFM0YsT0FBQSxHQUFXLE9BQUEsQ0FBUSxXQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7QUFDWCxPQUFBLEdBQVcsT0FBQSxDQUFRLFdBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztBQUVMOzs7SUFFVyxxQkFBQyxJQUFEOzs7Ozs7Ozs7UUFFVCw2Q0FBTSxJQUFOO1FBRUEsTUFBTSxDQUFDLFdBQVAsR0FBcUI7UUFFckIsSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxLQUFELEdBQVUsSUFBSSxLQUFKLENBQVUsSUFBVjtRQUNWLElBQUMsQ0FBQSxJQUFELEdBQVU7UUFFVixJQUFDLENBQUEsUUFBRCxHQUFZO1FBRVosSUFBSSxDQUFDLEVBQUwsQ0FBUSxNQUFSLEVBQXNCLElBQUMsQ0FBQSxNQUF2QjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsYUFBUixFQUFzQixJQUFDLENBQUEsYUFBdkI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFVBQVIsRUFBc0IsSUFBQyxDQUFBLFVBQXZCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxVQUFSLEVBQXNCLElBQUMsQ0FBQSxVQUF2QjtRQUVBLElBQUMsQ0FBQSxXQUFELEdBQWUs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WUFBQTtRQUFBLFFBQVEsQ0FBQyxLQUFULENBQUE7UUFDQSxJQUFDLENBQUEsUUFBRCxHQUFZO1FBRVosSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFBLENBQUg7bUJBQ0ksSUFBQyxDQUFBLGNBQUQsOENBQWlDLENBQUUsSUFBbkIsQ0FBQSxVQUFoQixFQURKOztJQUxLOzs7O0dBalhhOztBQXlYMUIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgb3BlbiwgdmFsaWQsIGVtcHR5LCBjbGFtcCwgcHJlZnMsIGxhc3QsIGVsZW0sIGRyYWcsIHN0YXRlLCBrbG9nLCBzbGFzaCwgZnMsIG9zLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbkJyb3dzZXIgID0gcmVxdWlyZSAnLi9icm93c2VyJ1xuU2hlbGYgICAgPSByZXF1aXJlICcuL3NoZWxmJ1xuZGlybGlzdCAgPSByZXF1aXJlICcuL2Rpcmxpc3QnXG5kaXJDYWNoZSA9IHJlcXVpcmUgJy4vZGlyY2FjaGUnXG5cbmNsYXNzIEZpbGVCcm93c2VyIGV4dGVuZHMgQnJvd3NlclxuXG4gICAgY29uc3RydWN0b3I6ICh2aWV3KSAtPlxuXG4gICAgICAgIHN1cGVyIHZpZXdcblxuICAgICAgICB3aW5kb3cuZmlsZWJyb3dzZXIgPSBAXG5cbiAgICAgICAgQGxvYWRJRCA9IDBcbiAgICAgICAgQHNoZWxmICA9IG5ldyBTaGVsZiBAXG4gICAgICAgIEBuYW1lICAgPSAnRmlsZUJyb3dzZXInXG5cbiAgICAgICAgQHNyY0NhY2hlID0ge31cblxuICAgICAgICBwb3N0Lm9uICdmaWxlJyAgICAgICAgQG9uRmlsZVxuICAgICAgICBwb3N0Lm9uICdmaWxlYnJvd3NlcicgQG9uRmlsZUJyb3dzZXJcbiAgICAgICAgcG9zdC5vbiAnZGlyY2FjaGUnICAgIEBvbkRpckNhY2hlXG4gICAgICAgIHBvc3Qub24gJ29wZW5GaWxlJyAgICBAb25PcGVuRmlsZVxuXG4gICAgICAgIEBzaGVsZlJlc2l6ZSA9IGVsZW0gJ2RpdicsIGNsYXNzOiAnc2hlbGZSZXNpemUnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLnRvcCAgICAgID0gJzBweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmJvdHRvbSAgID0gJzBweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmxlZnQgICAgID0gJzE5NHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUud2lkdGggICAgPSAnNnB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUuY3Vyc29yICAgPSAnZXctcmVzaXplJ1xuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBzaGVsZlJlc2l6ZVxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uU2hlbGZEcmFnXG5cbiAgICAgICAgQHNoZWxmU2l6ZSA9IHByZWZzLmdldCAnc2hlbGbilrhzaXplJyAyMDBcblxuICAgICAgICBAaW5pdENvbHVtbnMoKVxuXG4gICAgb25GaWxlQnJvd3NlcjogKGFjdGlvbiwgaXRlbSwgYXJnKSA9PlxuXG4gICAgICAgIHN3aXRjaCBhY3Rpb25cbiAgICAgICAgICAgIHdoZW4gJ2xvYWRJdGVtJyAgICAgdGhlbiBAbG9hZEl0ZW0gICAgIGl0ZW0sIGFyZ1xuICAgICAgICAgICAgd2hlbiAnYWN0aXZhdGVJdGVtJyB0aGVuIEBhY3RpdmF0ZUl0ZW0gaXRlbSwgYXJnXG4gICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxvYWREaXI6IChwYXRoKSAtPiBAbG9hZEl0ZW0gdHlwZTonZGlyJyBmaWxlOnBhdGhcbiAgICBcbiAgICBsb2FkSXRlbTogKGl0ZW0sIG9wdCkgLT5cblxuICAgICAgICBvcHQgPz0ge31cbiAgICAgICAgaXRlbS5uYW1lID89IHNsYXNoLmZpbGUgaXRlbS5maWxlXG5cbiAgICAgICAgQHBvcENvbHVtbnNGcm9tIDFcblxuICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICB3aGVuICdmaWxlJyB0aGVuIEBsb2FkRmlsZUl0ZW0gaXRlbVxuICAgICAgICAgICAgd2hlbiAnZGlyJyAgdGhlbiBAbG9hZERpckl0ZW0gIGl0ZW0sIDAsIGFjdGl2ZTonLi4nXG5cbiAgICAgICAgaWYgb3B0LmZvY3VzXG4gICAgICAgICAgICBAY29sdW1uc1swXS5mb2N1cygpXG5cbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgYWN0aXZhdGVJdGVtOiAoaXRlbSwgY29sKSAtPlxuXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbCsyLCBwb3A6dHJ1ZVxuXG4gICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2RpcicgIHRoZW4gQGxvYWREaXJJdGVtICBpdGVtLCBjb2wrMVxuICAgICAgICAgICAgd2hlbiAnZmlsZScgdGhlbiBAbG9hZEZpbGVJdGVtIGl0ZW0sIGNvbCsxXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkRmlsZUl0ZW06IChpdGVtLCBjb2w9MCkgLT5cblxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wsIHBvcDp0cnVlXG5cbiAgICAgICAgd2hpbGUgY29sID49IEBudW1Db2xzKClcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuXG4gICAgICAgIGZpbGUgPSBpdGVtLmZpbGVcblxuICAgICAgICBzd2l0Y2ggc2xhc2guZXh0IGZpbGVcbiAgICAgICAgICAgIHdoZW4gJ2dpZicsICdwbmcnLCAnanBnJywgJ2pwZWcnLCAnc3ZnJywgJ2JtcCcsICdpY28nXG4gICAgICAgICAgICAgICAgY250ID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJJbWFnZUNvbnRhaW5lcicsIGNoaWxkOlxuICAgICAgICAgICAgICAgICAgICBlbGVtICdpbWcnLCBjbGFzczogJ2Jyb3dzZXJJbWFnZScsIHNyYzogc2xhc2guZmlsZVVybCBmaWxlXG4gICAgICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBjbnRcbiAgICAgICAgICAgIHdoZW4gJ3RpZmYnLCAndGlmJ1xuICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgICAgICBAY29udmVydEltYWdlIHJvd1xuICAgICAgICAgICAgd2hlbiAncHhtJ1xuICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgICAgICBAY29udmVydFBYTSByb3dcbiAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAgaWYgaXRlbS50ZXh0RmlsZVxuICAgICAgICAgICAgICAgICAgICBAbG9hZFRleHRJdGVtIGl0ZW0sIGNvbFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZFRleHRJdGVtOiAoaXRlbSwgY29sKSAtPlxuXG4gICAgICAgIGtsb2cgJ2xvYWRUZXh0SXRlbScgaXRlbVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIG9uRGlyQ2FjaGU6IChkaXIpID0+XG5cbiAgICAgICAgZm9yIGNvbHVtbiBpbiBAY29sdW1uc1xuICAgICAgICAgICAgaWYgY29sdW1uLnBhdGgoKSA9PSBkaXJcbiAgICAgICAgICAgICAgICBAbG9hZERpckl0ZW0ge2ZpbGU6ZGlyLCB0eXBlOidkaXInfSwgY29sdW1uLmluZGV4LCBhY3RpdmU6Y29sdW1uLmFjdGl2ZVBhdGgoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIFxuICAgIGxvYWREaXJJdGVtOiAoaXRlbSwgY29sPTAsIG9wdD17fSkgLT5cblxuICAgICAgICByZXR1cm4gaWYgY29sID4gMCBhbmQgaXRlbS5uYW1lID09ICcvJ1xuXG4gICAgICAgIGRpciA9IGl0ZW0uZmlsZVxuXG4gICAgICAgIGlmIGRpckNhY2hlLmhhcyhkaXIpIGFuZCBub3Qgb3B0Lmlnbm9yZUNhY2hlXG4gICAgICAgICAgICBAbG9hZERpckl0ZW1zIGRpciwgaXRlbSwgZGlyQ2FjaGUuZ2V0KGRpciksIGNvbCwgb3B0XG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2RpcicsIGRpclxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBvcHQuaWdub3JlSGlkZGVuID0gbm90IHByZWZzLmdldCBcImJyb3dzZXLilrhzaG93SGlkZGVu4pa4I3tkaXJ9XCJcblxuICAgICAgICAgICAgZGlybGlzdCBkaXIsIG9wdCwgKGVyciwgaXRlbXMpID0+XG5cbiAgICAgICAgICAgICAgICBpZiBlcnI/IHRoZW4gcmV0dXJuXG5cbiAgICAgICAgICAgICAgICBwb3N0LnRvTWFpbiAnZGlyTG9hZGVkJywgZGlyXG5cbiAgICAgICAgICAgICAgICBkaXJDYWNoZS5zZXQgZGlyLCBpdGVtc1xuICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbXMgZGlyLCBpdGVtLCBpdGVtcywgY29sLCBvcHRcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2RpcicsIGRpclxuXG4gICAgICAgICAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICAgICAgICAgIFxuICAgIGxvYWREaXJJdGVtczogKGRpciwgaXRlbSwgaXRlbXMsIGNvbCwgb3B0KSA9PlxuXG4gICAgICAgIHVwZGlyID0gc2xhc2gucmVzb2x2ZSBzbGFzaC5qb2luIGRpciwgJy4uJ1xuXG4gICAgICAgIGlmIGNvbCA9PSAwIG9yIGNvbC0xIDwgQG51bUNvbHMoKSBhbmQgQGNvbHVtbnNbY29sLTFdLmFjdGl2ZVJvdygpPy5pdGVtLm5hbWUgPT0gJy4uJ1xuICAgICAgICAgICAgaWYgaXRlbXNbMF0ubmFtZSBub3QgaW4gWycuLicsICcvJ11cbiAgICAgICAgICAgICAgICBpZiBub3QgKHVwZGlyID09IGRpciA9PSBzbGFzaC5yZXNvbHZlICcvJylcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMudW5zaGlmdFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJy4uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6ICB1cGRpclxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMudW5zaGlmdFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJy8nXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogZGlyXG5cbiAgICAgICAgd2hpbGUgY29sID49IEBudW1Db2xzKClcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuXG4gICAgICAgIEBjb2x1bW5zW2NvbF0ubG9hZEl0ZW1zIGl0ZW1zLCBpdGVtXG5cbiAgICAgICAgaWYgb3B0LmFjdGl2ZVxuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS5yb3coc2xhc2guZmlsZSBvcHQuYWN0aXZlKT8uc2V0QWN0aXZlKClcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIG5hdmlnYXRlVG9GaWxlOiAoZmlsZSkgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgIyBrbG9nICdmaWxlYnJvd3Nlci5uYXZpZ2F0ZVRvRmlsZScgZmlsZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBsYXN0UGF0aCA9IEBsYXN0VXNlZENvbHVtbigpPy5wYXRoKClcbiAgICAgICAgaWYgZmlsZSA9PSBsYXN0UGF0aFxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaWYgc2xhc2guaXNSZWxhdGl2ZSBmaWxlXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBmaWxlbGlzdCA9IHNsYXNoLnBhdGhsaXN0IGZpbGVcbiAgICAgICAgbGFzdGxpc3QgPSBzbGFzaC5wYXRobGlzdCBsYXN0UGF0aFxuXG4gICAgICAgIGlmIHZhbGlkIGxhc3RsaXN0XG5cbiAgICAgICAgICAgIGxhc3RkaXIgPSBsYXN0IGxhc3RsaXN0XG4gICAgICAgICAgICBpZiBAbGFzdFVzZWRDb2x1bW4oKT8uaXNGaWxlKClcbiAgICAgICAgICAgICAgICBsYXN0ZGlyID0gc2xhc2guZGlyIGxhc3RkaXJcbiAgICAgICAgICAgIHJlbGF0aXZlID0gc2xhc2gucmVsYXRpdmUgZmlsZSwgbGFzdGRpclxuXG4gICAgICAgICAgICBpZiBzbGFzaC5pc1JlbGF0aXZlIHJlbGF0aXZlXG4gICAgICAgICAgICAgICAgdXBDb3VudCA9IDBcbiAgICAgICAgICAgICAgICB3aGlsZSByZWxhdGl2ZS5zdGFydHNXaXRoICcuLi8nXG4gICAgICAgICAgICAgICAgICAgIHVwQ291bnQgKz0gMVxuICAgICAgICAgICAgICAgICAgICByZWxhdGl2ZSA9IHJlbGF0aXZlLnN1YnN0ciAzXG5cbiAgICAgICAgICAgICAgICBpZiB1cENvdW50IDwgQG51bUNvbHMoKS0xXG4gICAgICAgICAgICAgICAgICAgIGNvbCAgID0gQG51bUNvbHMoKSAtIDEgLSB1cENvdW50XG4gICAgICAgICAgICAgICAgICAgIHJlbHN0ID0gc2xhc2gucGF0aGxpc3QgcmVsYXRpdmVcbiAgICAgICAgICAgICAgICAgICAgcGF0aHMgPSBmaWxlbGlzdC5zbGljZSBmaWxlbGlzdC5sZW5ndGggLSByZWxzdC5sZW5ndGhcblxuICAgICAgICBpZiBlbXB0eSBwYXRoc1xuXG4gICAgICAgICAgICBwa2dEaXIgICA9IHNsYXNoLnBrZyBmaWxlXG4gICAgICAgICAgICBwa2dsaXN0ICA9IHNsYXNoLnBhdGhsaXN0IHBrZ0RpclxuXG4gICAgICAgICAgICBsaXN0aW5kZXggPSBwa2dsaXN0Lmxlbmd0aCAtIDFcbiAgICAgICAgICAgIGNvbDBpbmRleCA9IGxpc3RpbmRleFxuICAgICAgICAgICAgY29sID0gMFxuXG4gICAgICAgICAgICBpZiBmaWxlbGlzdFtjb2wwaW5kZXhdID09IEBjb2x1bW5zWzBdPy5wYXRoKClcbiAgICAgICAgICAgICAgICB3aGlsZSBjb2wwaW5kZXggPCBsYXN0bGlzdC5sZW5ndGggYW5kIGNvbDBpbmRleCA8IGZpbGVsaXN0Lmxlbmd0aCBhbmQgbGFzdGxpc3RbY29sMGluZGV4XSA9PSBmaWxlbGlzdFtjb2wwaW5kZXhdXG4gICAgICAgICAgICAgICAgICAgIGNvbDBpbmRleCArPSAxXG4gICAgICAgICAgICAgICAgICAgIGNvbCArPSAxXG5cbiAgICAgICAgICAgIHBhdGhzID0gZmlsZWxpc3Quc2xpY2UgY29sMGluZGV4XG4gICAgICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guaXNGaWxlIGxhc3QgcGF0aHNcbiAgICAgICAgICAgIGxhc3RUeXBlID0gJ2ZpbGUnXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxhc3RUeXBlID0gJ2RpcidcblxuICAgICAgICBAcG9wQ29sdW1uc0Zyb20gICBjb2wrcGF0aHMubGVuZ3RoXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbFxuICAgICAgICBcbiAgICAgICAgd2hpbGUgQG51bUNvbHMoKSA8IHBhdGhzLmxlbmd0aFxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG4gICAgICAgIFxuICAgICAgICBpZiBjb2wgPiAwXG4gICAgICAgICAgICBAY29sdW1uc1tjb2wtMV0ucm93KHNsYXNoLmZpbGUgcGF0aHNbMF0pPy5zZXRBY3RpdmUoKVxuXG4gICAgICAgIGZvciBpbmRleCBpbiBbMC4uLnBhdGhzLmxlbmd0aF1cbiAgICAgICAgICAgIHR5cGUgPSBpZiBpbmRleCA9PSBwYXRocy5sZW5ndGgtMSB0aGVuIGxhc3RUeXBlIGVsc2UgJ2RpcidcbiAgICAgICAgICAgIGZpbGUgPSBwYXRoc1tpbmRleF1cbiAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGNvbCA9PSAwID09IGluZGV4IGFuZCB0eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgICAgIHR5cGUgPSAnZGlyJ1xuICAgICAgICAgICAgICAgIGZpbGUgPSBzbGFzaC5kaXIgZmlsZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaXRlbSA9IGZpbGU6ZmlsZSwgdHlwZTp0eXBlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN3aXRjaCB0eXBlXG4gICAgICAgICAgICAgICAgd2hlbiAnZmlsZScgdGhlbiBAbG9hZEZpbGVJdGVtIGl0ZW0sIGNvbCtpbmRleFxuICAgICAgICAgICAgICAgIHdoZW4gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgb3B0ID0ge31cbiAgICAgICAgICAgICAgICAgICAgaWYgaW5kZXggPCBwYXRocy5sZW5ndGgtMVxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmFjdGl2ZSA9IHBhdGhzW2luZGV4KzFdXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgY29sID09IDAgPT0gaW5kZXggYW5kIHBhdGhzLmxlbmd0aCA9PSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHQuYWN0aXZlID0gcGF0aHNbMF1cbiAgICAgICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtIGl0ZW0sIGNvbCtpbmRleCwgb3B0XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgIyBpZiBjb2wgPT0gMCA9PSBpbmRleCBhbmQgcGF0aHMubGVuZ3RoID09IDFcbiAgICAgICAgICAgICAgICAjIEBjb2x1bW5zW2NvbF0ucm93KHNsYXNoLmZpbGUgcGF0aHNbMF0pPy5zZXRBY3RpdmUoKVxuXG4gICAgICAgIGxhc3RJdGVtID0gZmlsZTpsYXN0KHBhdGhzKSwgdHlwZTpsYXN0VHlwZVxuICAgICAgICBcbiAgICAgICAgQGVtaXQgJ2l0ZW1BY3RpdmF0ZWQnIGxhc3RJdGVtXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IGZpbGVcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmxleFxuXG4gICAgICAgIEBuYXZpZ2F0ZVRvRmlsZSBmaWxlXG5cbiAgICBvbk9wZW5GaWxlOiAoZmlsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIG9wZW4gZmlsZVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBpbml0Q29sdW1uczogLT5cblxuICAgICAgICBzdXBlcigpXG5cbiAgICAgICAgQHZpZXcuaW5zZXJ0QmVmb3JlIEBzaGVsZi5kaXYsIEB2aWV3LmZpcnN0Q2hpbGRcbiAgICAgICAgQHZpZXcuaW5zZXJ0QmVmb3JlIEBzaGVsZlJlc2l6ZSwgbnVsbFxuXG4gICAgICAgIEBzaGVsZi5icm93c2VyRGlkSW5pdENvbHVtbnMoKVxuXG4gICAgICAgIEBzZXRTaGVsZlNpemUgQHNoZWxmU2l6ZVxuXG4gICAgY29sdW1uQXRQb3M6IChwb3MpIC0+XG5cbiAgICAgICAgaWYgY29sdW1uID0gc3VwZXIgcG9zXG4gICAgICAgICAgICByZXR1cm4gY29sdW1uXG5cbiAgICAgICAgaWYgZWxlbS5jb250YWluc1BvcyBAc2hlbGYuZGl2LCBwb3NcbiAgICAgICAgICAgIHJldHVybiBAc2hlbGZcblxuICAgIGxhc3RDb2x1bW5QYXRoOiAtPlxuXG4gICAgICAgIGlmIGxhc3RDb2x1bW4gPSBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW4ucGF0aCgpXG5cbiAgICBsYXN0RGlyQ29sdW1uOiAtPlxuXG4gICAgICAgIGlmIGxhc3RDb2x1bW4gPSBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgaWYgbGFzdENvbHVtbi5pc0RpcigpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW5cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtbi5wcmV2Q29sdW1uKClcblxuICAgIG9uQmFja3NwYWNlSW5Db2x1bW46IChjb2x1bW4pIC0+XG5cbiAgICAgICAgY29sdW1uLmNsZWFyU2VhcmNoKClcbiAgICAgICAgQG5hdmlnYXRlICdsZWZ0J1xuXG4gICAgdXBkYXRlQ29sdW1uU2Nyb2xsczogPT5cblxuICAgICAgICBzdXBlcigpXG4gICAgICAgIEBzaGVsZi5zY3JvbGwudXBkYXRlKClcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwXG5cbiAgICBvblNoZWxmRHJhZzogKGRyYWcsIGV2ZW50KSA9PlxuXG4gICAgICAgIHNoZWxmU2l6ZSA9IGNsYW1wIDAsIDQwMCwgZHJhZy5wb3MueFxuICAgICAgICBAc2V0U2hlbGZTaXplIHNoZWxmU2l6ZVxuXG4gICAgc2V0U2hlbGZTaXplOiAoQHNoZWxmU2l6ZSkgLT5cblxuICAgICAgICBwcmVmcy5zZXQgJ3NoZWxm4pa4c2l6ZScgQHNoZWxmU2l6ZVxuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUubGVmdCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcbiAgICAgICAgQHNoZWxmLmRpdi5zdHlsZS53aWR0aCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcbiAgICAgICAgQGNvbHMuc3R5bGUubGVmdCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcblxuICAgIHRvZ2dsZVNoZWxmOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHNoZWxmU2l6ZSA8IDFcbiAgICAgICAgICAgIEBzZXRTaGVsZlNpemUgMjAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBsYXN0VXNlZENvbHVtbigpPy5mb2N1cygpXG4gICAgICAgICAgICBAc2V0U2hlbGZTaXplIDBcbiAgICAgICAgICAgIFxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgICAgIFxuICAgIHJlZnJlc2g6ID0+XG5cbiAgICAgICAgZGlyQ2FjaGUucmVzZXQoKVxuICAgICAgICBAc3JjQ2FjaGUgPSB7fVxuXG4gICAgICAgIGlmIEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICBAbmF2aWdhdGVUb0ZpbGUgQGxhc3RVc2VkQ29sdW1uKCk/LnBhdGgoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVCcm93c2VyXG4iXX0=
//# sourceURL=../coffee/filebrowser.coffee