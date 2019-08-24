// koffee 1.4.0

/*
00000000  000  000      00000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000
000       000  000      000             000   000  000   000  000   000  000 0 000  000       000       000   000
000000    000  000      0000000         0000000    0000000    000   000  000000000  0000000   0000000   0000000
000       000  000      000             000   000  000   000  000   000  000   000       000  000       000   000
000       000  0000000  00000000        0000000    000   000   0000000   00     00  0000000   00000000  000   000
 */
var $, Browser, FileBrowser, Shelf, _, clamp, dirCache, dirlist, drag, elem, empty, fs, klog, last, os, post, ref, slash, state, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, valid = ref.valid, empty = ref.empty, clamp = ref.clamp, last = ref.last, elem = ref.elem, drag = ref.drag, state = ref.state, klog = ref.klog, slash = ref.slash, fs = ref.fs, os = ref.os, $ = ref.$, _ = ref._;

Browser = require('./browser');

Shelf = require('./shelf');

dirlist = require('./dirlist');

dirCache = require('./dircache');

FileBrowser = (function(superClass) {
    extend(FileBrowser, superClass);

    function FileBrowser(view) {
        this.onFileIndexed = bind(this.onFileIndexed, this);
        this.refresh = bind(this.refresh, this);
        this.onShelfDrag = bind(this.onShelfDrag, this);
        this.updateColumnScrolls = bind(this.updateColumnScrolls, this);
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
        post.on('fileIndexed', this.onFileIndexed);
        post.on('file', this.onFile);
        post.on('filebrowser', this.onFileBrowser);
        post.on('dircache', this.onDirCache);
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
                return this.columns[col].table.appendChild(cnt);
            case 'tiff':
            case 'tif':
                if (!slash.win()) {
                    return this.convertImage(row);
                }
                break;
            case 'pxm':
                if (!slash.win()) {
                    return this.convertPXM(row);
                }
                break;
            default:
                if (item.textFile) {
                    return this.loadTextItem(item, col);
                }
        }
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
            return dirlist(dir, opt, (function(_this) {
                return function(err, items) {
                    if (err != null) {
                        return;
                    }
                    post.toMain('dirLoaded', dir);
                    dirCache.set(dir, items);
                    _this.loadDirItems(dir, item, items, col, opt);
                    return post.emit('dir', dir);
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
        this.shelfResize.style.left = this.shelfSize + "px";
        this.shelf.div.style.width = this.shelfSize + "px";
        return this.cols.style.left = this.shelfSize + "px";
    };

    FileBrowser.prototype.refresh = function() {
        var ref1;
        dirCache.reset();
        this.srcCache = {};
        if (this.lastUsedColumn()) {
            return this.navigateToFile((ref1 = this.lastUsedColumn()) != null ? ref1.path() : void 0);
        }
    };

    FileBrowser.prototype.onFileIndexed = function(file, info) {
        var ref1, ref2, ref3;
        this.srcCache[file] = info;
        if (file === ((ref1 = this.lastUsedColumn()) != null ? (ref2 = ref1.parent) != null ? ref2.file : void 0 : void 0)) {
            return this.loadSourceItem({
                file: file,
                type: 'file'
            }, (ref3 = this.lastUsedColumn()) != null ? ref3.index : void 0);
        }
    };

    return FileBrowser;

})(Browser);

module.exports = FileBrowser;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGtJQUFBO0lBQUE7Ozs7QUFRQSxNQUFvRixPQUFBLENBQVEsS0FBUixDQUFwRixFQUFFLGVBQUYsRUFBUSxpQkFBUixFQUFlLGlCQUFmLEVBQXNCLGlCQUF0QixFQUE2QixlQUE3QixFQUFtQyxlQUFuQyxFQUF5QyxlQUF6QyxFQUErQyxpQkFBL0MsRUFBc0QsZUFBdEQsRUFBNEQsaUJBQTVELEVBQW1FLFdBQW5FLEVBQXVFLFdBQXZFLEVBQTJFLFNBQTNFLEVBQThFOztBQUU5RSxPQUFBLEdBQVcsT0FBQSxDQUFRLFdBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxTQUFSOztBQUNYLE9BQUEsR0FBVyxPQUFBLENBQVEsV0FBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBRUw7OztJQUVXLHFCQUFDLElBQUQ7Ozs7Ozs7OztRQUVULDZDQUFNLElBQU47UUFFQSxNQUFNLENBQUMsV0FBUCxHQUFxQjtRQUVyQixJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLEtBQUQsR0FBVSxJQUFJLEtBQUosQ0FBVSxJQUFWO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUVWLElBQUMsQ0FBQSxRQUFELEdBQVk7UUFFWixJQUFJLENBQUMsRUFBTCxDQUFRLGFBQVIsRUFBc0IsSUFBQyxDQUFBLGFBQXZCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxNQUFSLEVBQXNCLElBQUMsQ0FBQSxNQUF2QjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsYUFBUixFQUFzQixJQUFDLENBQUEsYUFBdkI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFVBQVIsRUFBc0IsSUFBQyxDQUFBLFVBQXZCO1FBRUEsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFBLENBQUssS0FBTCxFQUFZO1lBQUEs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VUFBRDtRQUFDLElBQUMsQ0FBQSxZQUFEO1FBR1gsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBbkIsR0FBNkIsSUFBQyxDQUFBLFNBQUYsR0FBWTtRQUN4QyxJQUFDLENBQUEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBakIsR0FBNEIsSUFBQyxDQUFBLFNBQUYsR0FBWTtlQUN2QyxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFaLEdBQXNCLElBQUMsQ0FBQSxTQUFGLEdBQVk7SUFMdkI7OzBCQU9kLE9BQUEsR0FBUyxTQUFBO0FBRUwsWUFBQTtRQUFBLFFBQVEsQ0FBQyxLQUFULENBQUE7UUFDQSxJQUFDLENBQUEsUUFBRCxHQUFZO1FBRVosSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFBLENBQUg7bUJBQ0ksSUFBQyxDQUFBLGNBQUQsOENBQWlDLENBQUUsSUFBbkIsQ0FBQSxVQUFoQixFQURKOztJQUxLOzswQkFjVCxhQUFBLEdBQWUsU0FBQyxJQUFELEVBQU8sSUFBUDtBQUVYLFlBQUE7UUFBQSxJQUFDLENBQUEsUUFBUyxDQUFBLElBQUEsQ0FBVixHQUFrQjtRQUVsQixJQUFHLElBQUEsa0ZBQWlDLENBQUUsdUJBQXRDO21CQUNJLElBQUMsQ0FBQSxjQUFELENBQWdCO2dCQUFFLElBQUEsRUFBSyxJQUFQO2dCQUFhLElBQUEsRUFBSyxNQUFsQjthQUFoQiwrQ0FBNkQsQ0FBRSxjQUEvRCxFQURKOztJQUpXOzs7O0dBM1dPOztBQWtYMUIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgdmFsaWQsIGVtcHR5LCBjbGFtcCwgbGFzdCwgZWxlbSwgZHJhZywgc3RhdGUsIGtsb2csIHNsYXNoLCBmcywgb3MsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuQnJvd3NlciAgPSByZXF1aXJlICcuL2Jyb3dzZXInXG5TaGVsZiAgICA9IHJlcXVpcmUgJy4vc2hlbGYnXG5kaXJsaXN0ICA9IHJlcXVpcmUgJy4vZGlybGlzdCdcbmRpckNhY2hlID0gcmVxdWlyZSAnLi9kaXJjYWNoZSdcblxuY2xhc3MgRmlsZUJyb3dzZXIgZXh0ZW5kcyBCcm93c2VyXG5cbiAgICBjb25zdHJ1Y3RvcjogKHZpZXcpIC0+XG5cbiAgICAgICAgc3VwZXIgdmlld1xuXG4gICAgICAgIHdpbmRvdy5maWxlYnJvd3NlciA9IEBcblxuICAgICAgICBAbG9hZElEID0gMFxuICAgICAgICBAc2hlbGYgID0gbmV3IFNoZWxmIEBcbiAgICAgICAgQG5hbWUgICA9ICdGaWxlQnJvd3NlcidcblxuICAgICAgICBAc3JjQ2FjaGUgPSB7fVxuXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVJbmRleGVkJyBAb25GaWxlSW5kZXhlZFxuICAgICAgICBwb3N0Lm9uICdmaWxlJyAgICAgICAgQG9uRmlsZVxuICAgICAgICBwb3N0Lm9uICdmaWxlYnJvd3NlcicgQG9uRmlsZUJyb3dzZXJcbiAgICAgICAgcG9zdC5vbiAnZGlyY2FjaGUnICAgIEBvbkRpckNhY2hlXG5cbiAgICAgICAgQHNoZWxmUmVzaXplID0gZWxlbSAnZGl2JywgY2xhc3M6ICdzaGVsZlJlc2l6ZSdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUudG9wICAgICAgPSAnMHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUuYm90dG9tICAgPSAnMHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUubGVmdCAgICAgPSAnMTk0cHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS53aWR0aCAgICA9ICc2cHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5jdXJzb3IgICA9ICdldy1yZXNpemUnXG5cbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQHNoZWxmUmVzaXplXG4gICAgICAgICAgICBvbk1vdmU6ICBAb25TaGVsZkRyYWdcblxuICAgICAgICAjIEBzaGVsZlNpemUgPSB3aW5kb3cuc3RhdGUuZ2V0ICdzaGVsZnxzaXplJywgMjAwXG5cbiAgICAgICAgQGluaXRDb2x1bW5zKClcblxuICAgIG9uRmlsZUJyb3dzZXI6IChhY3Rpb24sIGl0ZW0sIGFyZykgPT5cblxuICAgICAgICBzd2l0Y2ggYWN0aW9uXG4gICAgICAgICAgICB3aGVuICdsb2FkSXRlbScgICAgIHRoZW4gQGxvYWRJdGVtICAgICBpdGVtLCBhcmdcbiAgICAgICAgICAgIHdoZW4gJ2FjdGl2YXRlSXRlbScgdGhlbiBAYWN0aXZhdGVJdGVtIGl0ZW0sIGFyZ1xuXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxvYWRJdGVtOiAoaXRlbSwgb3B0KSAtPlxuXG4gICAgICAgIG9wdCA/PSB7fVxuICAgICAgICBpdGVtLm5hbWUgPz0gc2xhc2guZmlsZSBpdGVtLmZpbGVcblxuICAgICAgICBAcG9wQ29sdW1uc0Zyb20gMVxuXG4gICAgICAgIHN3aXRjaCBpdGVtLnR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIHRoZW4gQGxvYWRGaWxlSXRlbSBpdGVtXG4gICAgICAgICAgICB3aGVuICdkaXInICB0aGVuIEBsb2FkRGlySXRlbSAgaXRlbSwgMCwgYWN0aXZlOicuLidcblxuICAgICAgICBpZiBvcHQuZm9jdXNcbiAgICAgICAgICAgIEBjb2x1bW5zWzBdLmZvY3VzKClcblxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBhY3RpdmF0ZUl0ZW06IChpdGVtLCBjb2wpIC0+XG5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sKzIsIHBvcDp0cnVlXG5cbiAgICAgICAgc3dpdGNoIGl0ZW0udHlwZVxuICAgICAgICAgICAgd2hlbiAnZGlyJyAgdGhlbiBAbG9hZERpckl0ZW0gIGl0ZW0sIGNvbCsxXG4gICAgICAgICAgICB3aGVuICdmaWxlJyB0aGVuIEBsb2FkRmlsZUl0ZW0gaXRlbSwgY29sKzFcblxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxvYWRGaWxlSXRlbTogKGl0ZW0sIGNvbD0wKSAtPlxuXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbCwgcG9wOnRydWVcblxuICAgICAgICB3aGlsZSBjb2wgPj0gQG51bUNvbHMoKVxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG5cbiAgICAgICAgZmlsZSA9IGl0ZW0uZmlsZVxuXG4gICAgICAgIHN3aXRjaCBzbGFzaC5leHQgZmlsZVxuICAgICAgICAgICAgd2hlbiAnZ2lmJywgJ3BuZycsICdqcGcnLCAnanBlZycsICdzdmcnLCAnYm1wJywgJ2ljbydcbiAgICAgICAgICAgICAgICBjbnQgPSBlbGVtIGNsYXNzOiAnYnJvd3NlckltYWdlQ29udGFpbmVyJywgY2hpbGQ6XG4gICAgICAgICAgICAgICAgICAgIGVsZW0gJ2ltZycsIGNsYXNzOiAnYnJvd3NlckltYWdlJywgc3JjOiBzbGFzaC5maWxlVXJsIGZpbGVcbiAgICAgICAgICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIGNudFxuICAgICAgICAgICAgd2hlbiAndGlmZicsICd0aWYnXG4gICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgIEBjb252ZXJ0SW1hZ2Ugcm93XG4gICAgICAgICAgICB3aGVuICdweG0nXG4gICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgIEBjb252ZXJ0UFhNIHJvd1xuICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICBpZiBpdGVtLnRleHRGaWxlXG4gICAgICAgICAgICAgICAgICAgIEBsb2FkVGV4dEl0ZW0gaXRlbSwgY29sXG5cbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkVGV4dEl0ZW06IChpdGVtLCBjb2wpIC0+XG5cbiAgICAgICAga2xvZyAnbG9hZFRleHRJdGVtJyBpdGVtXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgb25EaXJDYWNoZTogKGRpcikgPT5cblxuICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBjb2x1bW4ucGF0aCgpID09IGRpclxuICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSB7ZmlsZTpkaXIsIHR5cGU6J2Rpcid9LCBjb2x1bW4uaW5kZXgsIGFjdGl2ZTpjb2x1bW4uYWN0aXZlUGF0aCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICBsb2FkRGlySXRlbTogKGl0ZW0sIGNvbD0wLCBvcHQ9e30pIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIGNvbCA+IDAgYW5kIGl0ZW0ubmFtZSA9PSAnLydcblxuICAgICAgICBkaXIgPSBpdGVtLmZpbGVcblxuICAgICAgICBpZiBkaXJDYWNoZS5oYXMoZGlyKSBhbmQgbm90IG9wdC5pZ25vcmVDYWNoZVxuICAgICAgICAgICAgQGxvYWREaXJJdGVtcyBkaXIsIGl0ZW0sIGRpckNhY2hlLmdldChkaXIpLCBjb2wsIG9wdFxuICAgICAgICAgICAgcG9zdC5lbWl0ICdkaXInLCBkaXJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgIyBvcHQuaWdub3JlSGlkZGVuID0gbm90IHdpbmRvdy5zdGF0ZS5nZXQgXCJicm93c2VyfHNob3dIaWRkZW58I3tkaXJ9XCJcblxuICAgICAgICAgICAgZGlybGlzdCBkaXIsIG9wdCwgKGVyciwgaXRlbXMpID0+XG5cbiAgICAgICAgICAgICAgICBpZiBlcnI/IHRoZW4gcmV0dXJuXG5cbiAgICAgICAgICAgICAgICBwb3N0LnRvTWFpbiAnZGlyTG9hZGVkJywgZGlyXG5cbiAgICAgICAgICAgICAgICBkaXJDYWNoZS5zZXQgZGlyLCBpdGVtc1xuICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbXMgZGlyLCBpdGVtLCBpdGVtcywgY29sLCBvcHRcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2RpcicsIGRpclxuXG4gICAgbG9hZERpckl0ZW1zOiAoZGlyLCBpdGVtLCBpdGVtcywgY29sLCBvcHQpID0+XG5cbiAgICAgICAgdXBkaXIgPSBzbGFzaC5yZXNvbHZlIHNsYXNoLmpvaW4gZGlyLCAnLi4nXG5cbiAgICAgICAgaWYgY29sID09IDAgb3IgY29sLTEgPCBAbnVtQ29scygpIGFuZCBAY29sdW1uc1tjb2wtMV0uYWN0aXZlUm93KCk/Lml0ZW0ubmFtZSA9PSAnLi4nXG4gICAgICAgICAgICBpZiBpdGVtc1swXS5uYW1lIG5vdCBpbiBbJy4uJywgJy8nXVxuICAgICAgICAgICAgICAgIGlmIG5vdCAodXBkaXIgPT0gZGlyID09IHNsYXNoLnJlc29sdmUgJy8nKVxuICAgICAgICAgICAgICAgICAgICBpdGVtcy51bnNoaWZ0XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnLi4nXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogIHVwZGlyXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpdGVtcy51bnNoaWZ0XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnLydcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiBkaXJcblxuICAgICAgICB3aGlsZSBjb2wgPj0gQG51bUNvbHMoKVxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG5cbiAgICAgICAgQGNvbHVtbnNbY29sXS5sb2FkSXRlbXMgaXRlbXMsIGl0ZW1cblxuICAgICAgICBpZiBvcHQuYWN0aXZlXG4gICAgICAgICAgICBAY29sdW1uc1tjb2xdLnJvdyhzbGFzaC5maWxlIG9wdC5hY3RpdmUpPy5zZXRBY3RpdmUoKVxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgbmF2aWdhdGVUb0ZpbGU6IChmaWxlKSAtPlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAjIGtsb2cgJ2ZpbGVicm93c2VyLm5hdmlnYXRlVG9GaWxlJyBmaWxlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGxhc3RQYXRoID0gQGxhc3RVc2VkQ29sdW1uKCk/LnBhdGgoKVxuICAgICAgICBpZiBmaWxlID09IGxhc3RQYXRoXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiBzbGFzaC5pc1JlbGF0aXZlIGZpbGVcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGZpbGVsaXN0ID0gc2xhc2gucGF0aGxpc3QgZmlsZVxuICAgICAgICBsYXN0bGlzdCA9IHNsYXNoLnBhdGhsaXN0IGxhc3RQYXRoXG5cbiAgICAgICAgaWYgdmFsaWQgbGFzdGxpc3RcblxuICAgICAgICAgICAgbGFzdGRpciA9IGxhc3QgbGFzdGxpc3RcbiAgICAgICAgICAgIGlmIEBsYXN0VXNlZENvbHVtbigpPy5pc0ZpbGUoKVxuICAgICAgICAgICAgICAgIGxhc3RkaXIgPSBzbGFzaC5kaXIgbGFzdGRpclxuICAgICAgICAgICAgcmVsYXRpdmUgPSBzbGFzaC5yZWxhdGl2ZSBmaWxlLCBsYXN0ZGlyXG5cbiAgICAgICAgICAgIGlmIHNsYXNoLmlzUmVsYXRpdmUgcmVsYXRpdmVcbiAgICAgICAgICAgICAgICB1cENvdW50ID0gMFxuICAgICAgICAgICAgICAgIHdoaWxlIHJlbGF0aXZlLnN0YXJ0c1dpdGggJy4uLydcbiAgICAgICAgICAgICAgICAgICAgdXBDb3VudCArPSAxXG4gICAgICAgICAgICAgICAgICAgIHJlbGF0aXZlID0gcmVsYXRpdmUuc3Vic3RyIDNcblxuICAgICAgICAgICAgICAgIGlmIHVwQ291bnQgPCBAbnVtQ29scygpLTFcbiAgICAgICAgICAgICAgICAgICAgY29sICAgPSBAbnVtQ29scygpIC0gMSAtIHVwQ291bnRcbiAgICAgICAgICAgICAgICAgICAgcmVsc3QgPSBzbGFzaC5wYXRobGlzdCByZWxhdGl2ZVxuICAgICAgICAgICAgICAgICAgICBwYXRocyA9IGZpbGVsaXN0LnNsaWNlIGZpbGVsaXN0Lmxlbmd0aCAtIHJlbHN0Lmxlbmd0aFxuXG4gICAgICAgIGlmIGVtcHR5IHBhdGhzXG5cbiAgICAgICAgICAgIHBrZ0RpciAgID0gc2xhc2gucGtnIGZpbGVcbiAgICAgICAgICAgIHBrZ2xpc3QgID0gc2xhc2gucGF0aGxpc3QgcGtnRGlyXG5cbiAgICAgICAgICAgIGxpc3RpbmRleCA9IHBrZ2xpc3QubGVuZ3RoIC0gMVxuICAgICAgICAgICAgY29sMGluZGV4ID0gbGlzdGluZGV4XG4gICAgICAgICAgICBjb2wgPSAwXG5cbiAgICAgICAgICAgIGlmIGZpbGVsaXN0W2NvbDBpbmRleF0gPT0gQGNvbHVtbnNbMF0/LnBhdGgoKVxuICAgICAgICAgICAgICAgIHdoaWxlIGNvbDBpbmRleCA8IGxhc3RsaXN0Lmxlbmd0aCBhbmQgY29sMGluZGV4IDwgZmlsZWxpc3QubGVuZ3RoIGFuZCBsYXN0bGlzdFtjb2wwaW5kZXhdID09IGZpbGVsaXN0W2NvbDBpbmRleF1cbiAgICAgICAgICAgICAgICAgICAgY29sMGluZGV4ICs9IDFcbiAgICAgICAgICAgICAgICAgICAgY29sICs9IDFcblxuICAgICAgICAgICAgcGF0aHMgPSBmaWxlbGlzdC5zbGljZSBjb2wwaW5kZXhcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5pc0ZpbGUgbGFzdCBwYXRoc1xuICAgICAgICAgICAgbGFzdFR5cGUgPSAnZmlsZSdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbGFzdFR5cGUgPSAnZGlyJ1xuXG4gICAgICAgIEBwb3BDb2x1bW5zRnJvbSAgIGNvbCtwYXRocy5sZW5ndGhcbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sXG4gICAgICAgIFxuICAgICAgICB3aGlsZSBAbnVtQ29scygpIDwgcGF0aHMubGVuZ3RoXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcbiAgICAgICAgXG4gICAgICAgIGlmIGNvbCA+IDBcbiAgICAgICAgICAgIEBjb2x1bW5zW2NvbC0xXS5yb3coc2xhc2guZmlsZSBwYXRoc1swXSk/LnNldEFjdGl2ZSgpXG5cbiAgICAgICAgZm9yIGluZGV4IGluIFswLi4ucGF0aHMubGVuZ3RoXVxuICAgICAgICAgICAgdHlwZSA9IGlmIGluZGV4ID09IHBhdGhzLmxlbmd0aC0xIHRoZW4gbGFzdFR5cGUgZWxzZSAnZGlyJ1xuICAgICAgICAgICAgZmlsZSA9IHBhdGhzW2luZGV4XVxuICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgY29sID09IDAgPT0gaW5kZXggYW5kIHR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgdHlwZSA9ICdkaXInXG4gICAgICAgICAgICAgICAgZmlsZSA9IHNsYXNoLmRpciBmaWxlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpdGVtID0gZmlsZTpmaWxlLCB0eXBlOnR5cGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3dpdGNoIHR5cGVcbiAgICAgICAgICAgICAgICB3aGVuICdmaWxlJyB0aGVuIEBsb2FkRmlsZUl0ZW0gaXRlbSwgY29sK2luZGV4XG4gICAgICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICBvcHQgPSB7fVxuICAgICAgICAgICAgICAgICAgICBpZiBpbmRleCA8IHBhdGhzLmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHQuYWN0aXZlID0gcGF0aHNbaW5kZXgrMV1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBjb2wgPT0gMCA9PSBpbmRleCBhbmQgcGF0aHMubGVuZ3RoID09IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdC5hY3RpdmUgPSBwYXRoc1swXVxuICAgICAgICAgICAgICAgICAgICBAbG9hZERpckl0ZW0gaXRlbSwgY29sK2luZGV4LCBvcHRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAjIGlmIGNvbCA9PSAwID09IGluZGV4IGFuZCBwYXRocy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgICMgQGNvbHVtbnNbY29sXS5yb3coc2xhc2guZmlsZSBwYXRoc1swXSk/LnNldEFjdGl2ZSgpXG5cbiAgICAgICAgbGFzdEl0ZW0gPSBmaWxlOmxhc3QocGF0aHMpLCB0eXBlOmxhc3RUeXBlXG4gICAgICAgIFxuICAgICAgICBAZW1pdCAnaXRlbUFjdGl2YXRlZCcgbGFzdEl0ZW1cblxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICBvbkZpbGU6IChmaWxlKSA9PlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgZmlsZVxuICAgICAgICByZXR1cm4gaWYgbm90IEBmbGV4XG5cbiAgICAgICAgQG5hdmlnYXRlVG9GaWxlIGZpbGVcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGluaXRDb2x1bW5zOiAtPlxuXG4gICAgICAgIHN1cGVyKClcblxuICAgICAgICBAdmlldy5pbnNlcnRCZWZvcmUgQHNoZWxmLmRpdiwgQHZpZXcuZmlyc3RDaGlsZFxuICAgICAgICBAdmlldy5pbnNlcnRCZWZvcmUgQHNoZWxmUmVzaXplLCBudWxsXG5cbiAgICAgICAgQHNoZWxmLmJyb3dzZXJEaWRJbml0Q29sdW1ucygpXG5cbiAgICAgICAgQHNldFNoZWxmU2l6ZSBAc2hlbGZTaXplXG5cbiAgICBjb2x1bW5BdFBvczogKHBvcykgLT5cblxuICAgICAgICBpZiBjb2x1bW4gPSBzdXBlciBwb3NcbiAgICAgICAgICAgIHJldHVybiBjb2x1bW5cblxuICAgICAgICBpZiBlbGVtLmNvbnRhaW5zUG9zIEBzaGVsZi5kaXYsIHBvc1xuICAgICAgICAgICAgcmV0dXJuIEBzaGVsZlxuXG4gICAgbGFzdENvbHVtblBhdGg6IC0+XG5cbiAgICAgICAgaWYgbGFzdENvbHVtbiA9IEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtbi5wYXRoKClcblxuICAgIGxhc3REaXJDb2x1bW46IC0+XG5cbiAgICAgICAgaWYgbGFzdENvbHVtbiA9IEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICBpZiBsYXN0Q29sdW1uLmlzRGlyKClcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtblxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uLnByZXZDb2x1bW4oKVxuXG4gICAgb25CYWNrc3BhY2VJbkNvbHVtbjogKGNvbHVtbikgLT5cblxuICAgICAgICBjb2x1bW4uY2xlYXJTZWFyY2goKVxuICAgICAgICBAbmF2aWdhdGUgJ2xlZnQnXG5cbiAgICB1cGRhdGVDb2x1bW5TY3JvbGxzOiA9PlxuXG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgQHNoZWxmLnNjcm9sbC51cGRhdGUoKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDBcblxuICAgIG9uU2hlbGZEcmFnOiAoZHJhZywgZXZlbnQpID0+XG5cbiAgICAgICAgc2hlbGZTaXplID0gY2xhbXAgMCwgNDAwLCBkcmFnLnBvcy54XG4gICAgICAgIEBzZXRTaGVsZlNpemUgc2hlbGZTaXplXG5cbiAgICBzZXRTaGVsZlNpemU6IChAc2hlbGZTaXplKSAtPlxuXG4gICAgICAgICMgd2luZG93LnN0YXRlLnNldCAnc2hlbGZ8c2l6ZScsIEBzaGVsZlNpemVcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBzaGVsZi5kaXYuc3R5bGUud2lkdGggPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG4gICAgICAgIEBjb2xzLnN0eWxlLmxlZnQgPSBcIiN7QHNoZWxmU2l6ZX1weFwiXG5cbiAgICByZWZyZXNoOiA9PlxuXG4gICAgICAgIGRpckNhY2hlLnJlc2V0KClcbiAgICAgICAgQHNyY0NhY2hlID0ge31cblxuICAgICAgICBpZiBAbGFzdFVzZWRDb2x1bW4oKVxuICAgICAgICAgICAgQG5hdmlnYXRlVG9GaWxlIEBsYXN0VXNlZENvbHVtbigpPy5wYXRoKClcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBvbkZpbGVJbmRleGVkOiAoZmlsZSwgaW5mbykgPT5cblxuICAgICAgICBAc3JjQ2FjaGVbZmlsZV0gPSBpbmZvXG5cbiAgICAgICAgaWYgZmlsZSA9PSBAbGFzdFVzZWRDb2x1bW4oKT8ucGFyZW50Py5maWxlXG4gICAgICAgICAgICBAbG9hZFNvdXJjZUl0ZW0geyBmaWxlOmZpbGUsIHR5cGU6J2ZpbGUnIH0sIEBsYXN0VXNlZENvbHVtbigpPy5pbmRleFxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVCcm93c2VyXG4iXX0=
//# sourceURL=../coffee/filebrowser.coffee