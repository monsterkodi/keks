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
                this.loadFileItem(item, col + 1);
                if (item.textFile) {
                    return post.emit('jumpToFile', item);
                }
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
                return this.loadSourceItem(item, col);
        }
    };

    FileBrowser.prototype.loadSourceItem = function(item, col) {
        var clss, clsss, func, funcs, i, info, items, j, len, len1, ref1, ref2, text;
        if (this.srcCache[item.file] == null) {
            this.srcCache[item.file] = post.get('indexer', 'file', item.file);
        }
        info = this.srcCache[item.file];
        if (empty(info)) {
            this.columns[col].loadItems([], item);
            return;
        }
        items = [];
        clsss = (ref1 = info.classes) != null ? ref1 : [];
        for (i = 0, len = clsss.length; i < len; i++) {
            clss = clsss[i];
            text = '● ' + clss.name;
            items.push({
                name: clss.name,
                text: text,
                type: 'class',
                file: item.file,
                line: clss.line
            });
        }
        funcs = (ref2 = info.funcs) != null ? ref2 : [];
        for (j = 0, len1 = funcs.length; j < len1; j++) {
            func = funcs[j];
            if (func.test === 'describe') {
                text = '● ' + func.name;
            } else if (func["static"]) {
                text = '  ◆ ' + func.name;
            } else if (func.post) {
                text = '  ⬢ ' + func.name;
            } else {
                text = '  ▸ ' + func.name;
            }
            items.push({
                name: func.name,
                text: text,
                type: 'func',
                file: item.file,
                line: func.line
            });
        }
        if (valid(items)) {
            items.sort(function(a, b) {
                return a.line - b.line;
            });
            return this.columns[col].loadItems(items, item);
        }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGtJQUFBO0lBQUE7Ozs7QUFRQSxNQUFvRixPQUFBLENBQVEsS0FBUixDQUFwRixFQUFFLGVBQUYsRUFBUSxpQkFBUixFQUFlLGlCQUFmLEVBQXNCLGlCQUF0QixFQUE2QixlQUE3QixFQUFtQyxlQUFuQyxFQUF5QyxlQUF6QyxFQUErQyxpQkFBL0MsRUFBc0QsZUFBdEQsRUFBNEQsaUJBQTVELEVBQW1FLFdBQW5FLEVBQXVFLFdBQXZFLEVBQTJFLFNBQTNFLEVBQThFOztBQUU5RSxPQUFBLEdBQVcsT0FBQSxDQUFRLFdBQVI7O0FBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxTQUFSOztBQUNYLE9BQUEsR0FBVyxPQUFBLENBQVEsV0FBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBRUw7OztJQUVXLHFCQUFDLElBQUQ7Ozs7Ozs7OztRQUVULDZDQUFNLElBQU47UUFFQSxNQUFNLENBQUMsV0FBUCxHQUFxQjtRQUVyQixJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLEtBQUQsR0FBVSxJQUFJLEtBQUosQ0FBVSxJQUFWO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUVWLElBQUMsQ0FBQSxRQUFELEdBQVk7UUFFWixJQUFJLENBQUMsRUFBTCxDQUFRLGFBQVIsRUFBc0IsSUFBQyxDQUFBLGFBQXZCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxNQUFSLEVBQXNCLElBQUMsQ0FBQSxNQUF2QjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsYUFBUixFQUFzQixJQUFDLENBQUEsYUFBdkI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFVBQVIsRUFBc0IsSUFBQyxDQUFBLFVBQXZCO1FBRUEsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFBLENBQUssS0FBTCxFQUFZO1lBQUEs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RkFBaUMsQ0FBRSx1QkFBdEM7bUJBQ0ksSUFBQyxDQUFBLGNBQUQsQ0FBZ0I7Z0JBQUUsSUFBQSxFQUFLLElBQVA7Z0JBQWEsSUFBQSxFQUFLLE1BQWxCO2FBQWhCLCtDQUE2RCxDQUFFLGNBQS9ELEVBREo7O0lBSlc7Ozs7R0E1WU87O0FBbVoxQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCB2YWxpZCwgZW1wdHksIGNsYW1wLCBsYXN0LCBlbGVtLCBkcmFnLCBzdGF0ZSwga2xvZywgc2xhc2gsIGZzLCBvcywgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Ccm93c2VyICA9IHJlcXVpcmUgJy4vYnJvd3NlcidcblNoZWxmICAgID0gcmVxdWlyZSAnLi9zaGVsZidcbmRpcmxpc3QgID0gcmVxdWlyZSAnLi9kaXJsaXN0J1xuZGlyQ2FjaGUgPSByZXF1aXJlICcuL2RpcmNhY2hlJ1xuXG5jbGFzcyBGaWxlQnJvd3NlciBleHRlbmRzIEJyb3dzZXJcblxuICAgIGNvbnN0cnVjdG9yOiAodmlldykgLT5cblxuICAgICAgICBzdXBlciB2aWV3XG5cbiAgICAgICAgd2luZG93LmZpbGVicm93c2VyID0gQFxuXG4gICAgICAgIEBsb2FkSUQgPSAwXG4gICAgICAgIEBzaGVsZiAgPSBuZXcgU2hlbGYgQFxuICAgICAgICBAbmFtZSAgID0gJ0ZpbGVCcm93c2VyJ1xuXG4gICAgICAgIEBzcmNDYWNoZSA9IHt9XG5cbiAgICAgICAgcG9zdC5vbiAnZmlsZUluZGV4ZWQnIEBvbkZpbGVJbmRleGVkXG4gICAgICAgIHBvc3Qub24gJ2ZpbGUnICAgICAgICBAb25GaWxlXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVicm93c2VyJyBAb25GaWxlQnJvd3NlclxuICAgICAgICBwb3N0Lm9uICdkaXJjYWNoZScgICAgQG9uRGlyQ2FjaGVcblxuICAgICAgICBAc2hlbGZSZXNpemUgPSBlbGVtICdkaXYnLCBjbGFzczogJ3NoZWxmUmVzaXplJ1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS50b3AgICAgICA9ICcwcHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5ib3R0b20gICA9ICcwcHgnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5sZWZ0ICAgICA9ICcxOTRweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLndpZHRoICAgID0gJzZweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmN1cnNvciAgID0gJ2V3LXJlc2l6ZSdcblxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAc2hlbGZSZXNpemVcbiAgICAgICAgICAgIG9uTW92ZTogIEBvblNoZWxmRHJhZ1xuXG4gICAgICAgICMgQHNoZWxmU2l6ZSA9IHdpbmRvdy5zdGF0ZS5nZXQgJ3NoZWxmfHNpemUnLCAyMDBcblxuICAgICAgICBAaW5pdENvbHVtbnMoKVxuXG4gICAgb25GaWxlQnJvd3NlcjogKGFjdGlvbiwgaXRlbSwgYXJnKSA9PlxuXG4gICAgICAgIHN3aXRjaCBhY3Rpb25cbiAgICAgICAgICAgIHdoZW4gJ2xvYWRJdGVtJyAgICAgdGhlbiBAbG9hZEl0ZW0gICAgIGl0ZW0sIGFyZ1xuICAgICAgICAgICAgd2hlbiAnYWN0aXZhdGVJdGVtJyB0aGVuIEBhY3RpdmF0ZUl0ZW0gaXRlbSwgYXJnXG5cbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZEl0ZW06IChpdGVtLCBvcHQpIC0+XG5cbiAgICAgICAgb3B0ID89IHt9XG4gICAgICAgIGl0ZW0ubmFtZSA/PSBzbGFzaC5maWxlIGl0ZW0uZmlsZVxuXG4gICAgICAgIEBwb3BDb2x1bW5zRnJvbSAxXG5cbiAgICAgICAgc3dpdGNoIGl0ZW0udHlwZVxuICAgICAgICAgICAgd2hlbiAnZmlsZScgdGhlbiBAbG9hZEZpbGVJdGVtIGl0ZW1cbiAgICAgICAgICAgIHdoZW4gJ2RpcicgIHRoZW4gQGxvYWREaXJJdGVtICBpdGVtLCAwLCBhY3RpdmU6Jy4uJ1xuXG4gICAgICAgIGlmIG9wdC5mb2N1c1xuICAgICAgICAgICAgQGNvbHVtbnNbMF0uZm9jdXMoKVxuXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGFjdGl2YXRlSXRlbTogKGl0ZW0sIGNvbCkgLT5cblxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wrMiwgcG9wOnRydWVcblxuICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtICBpdGVtLCBjb2wrMVxuICAgICAgICAgICAgd2hlbiAnZmlsZSdcbiAgICAgICAgICAgICAgICBAbG9hZEZpbGVJdGVtIGl0ZW0sIGNvbCsxXG4gICAgICAgICAgICAgICAgaWYgaXRlbS50ZXh0RmlsZVxuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2p1bXBUb0ZpbGUnLCBpdGVtXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkRmlsZUl0ZW06IChpdGVtLCBjb2w9MCkgLT5cblxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wsIHBvcDp0cnVlXG5cbiAgICAgICAgd2hpbGUgY29sID49IEBudW1Db2xzKClcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuXG4gICAgICAgIGZpbGUgPSBpdGVtLmZpbGVcblxuICAgICAgICBzd2l0Y2ggc2xhc2guZXh0IGZpbGVcbiAgICAgICAgICAgIHdoZW4gJ2dpZicsICdwbmcnLCAnanBnJywgJ2pwZWcnLCAnc3ZnJywgJ2JtcCcsICdpY28nXG4gICAgICAgICAgICAgICAgY250ID0gZWxlbSBjbGFzczogJ2Jyb3dzZXJJbWFnZUNvbnRhaW5lcicsIGNoaWxkOlxuICAgICAgICAgICAgICAgICAgICBlbGVtICdpbWcnLCBjbGFzczogJ2Jyb3dzZXJJbWFnZScsIHNyYzogc2xhc2guZmlsZVVybCBmaWxlXG4gICAgICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBjbnRcbiAgICAgICAgICAgIHdoZW4gJ3RpZmYnLCAndGlmJ1xuICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgICAgICBAY29udmVydEltYWdlIHJvd1xuICAgICAgICAgICAgd2hlbiAncHhtJ1xuICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgICAgICBAY29udmVydFBYTSByb3dcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAbG9hZFNvdXJjZUl0ZW0gaXRlbSwgY29sXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZFNvdXJjZUl0ZW06IChpdGVtLCBjb2wpIC0+XG5cbiAgICAgICAgaWYgbm90IEBzcmNDYWNoZVtpdGVtLmZpbGVdP1xuXG4gICAgICAgICAgICBAc3JjQ2FjaGVbaXRlbS5maWxlXSA9IHBvc3QuZ2V0ICdpbmRleGVyJyAnZmlsZScgaXRlbS5maWxlXG5cbiAgICAgICAgaW5mbyA9IEBzcmNDYWNoZVtpdGVtLmZpbGVdXG5cbiAgICAgICAgaWYgZW1wdHkgaW5mb1xuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS5sb2FkSXRlbXMgW10sIGl0ZW1cbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGl0ZW1zID0gW11cbiAgICAgICAgY2xzc3MgPSBpbmZvLmNsYXNzZXMgPyBbXVxuICAgICAgICBmb3IgY2xzcyBpbiBjbHNzc1xuICAgICAgICAgICAgdGV4dCA9ICfil48gJytjbHNzLm5hbWVcbiAgICAgICAgICAgIGl0ZW1zLnB1c2ggbmFtZTpjbHNzLm5hbWUsIHRleHQ6dGV4dCwgdHlwZTonY2xhc3MnLCBmaWxlOml0ZW0uZmlsZSwgbGluZTpjbHNzLmxpbmVcblxuICAgICAgICBmdW5jcyA9IGluZm8uZnVuY3MgPyBbXVxuICAgICAgICBmb3IgZnVuYyBpbiBmdW5jc1xuICAgICAgICAgICAgaWYgZnVuYy50ZXN0ID09ICdkZXNjcmliZSdcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJ+KXjyAnK2Z1bmMubmFtZVxuICAgICAgICAgICAgZWxzZSBpZiBmdW5jLnN0YXRpY1xuICAgICAgICAgICAgICAgIHRleHQgPSAnICDil4YgJytmdW5jLm5hbWVcbiAgICAgICAgICAgIGVsc2UgaWYgZnVuYy5wb3N0XG4gICAgICAgICAgICAgICAgdGV4dCA9ICcgIOKsoiAnK2Z1bmMubmFtZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRleHQgPSAnICDilrggJytmdW5jLm5hbWVcbiAgICAgICAgICAgIGl0ZW1zLnB1c2ggbmFtZTpmdW5jLm5hbWUsIHRleHQ6dGV4dCwgdHlwZTonZnVuYycsIGZpbGU6aXRlbS5maWxlLCBsaW5lOmZ1bmMubGluZVxuXG4gICAgICAgIGlmIHZhbGlkIGl0ZW1zXG4gICAgICAgICAgICBpdGVtcy5zb3J0IChhLGIpIC0+IGEubGluZSAtIGIubGluZVxuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS5sb2FkSXRlbXMgaXRlbXMsIGl0ZW1cblxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBvbkRpckNhY2hlOiAoZGlyKSA9PlxuXG4gICAgICAgIGZvciBjb2x1bW4gaW4gQGNvbHVtbnNcbiAgICAgICAgICAgIGlmIGNvbHVtbi5wYXRoKCkgPT0gZGlyXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtIHtmaWxlOmRpciwgdHlwZTonZGlyJ30sIGNvbHVtbi5pbmRleCwgYWN0aXZlOmNvbHVtbi5hY3RpdmVQYXRoKClcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgIGxvYWREaXJJdGVtOiAoaXRlbSwgY29sPTAsIG9wdD17fSkgLT5cblxuICAgICAgICByZXR1cm4gaWYgY29sID4gMCBhbmQgaXRlbS5uYW1lID09ICcvJ1xuXG4gICAgICAgIGRpciA9IGl0ZW0uZmlsZVxuXG4gICAgICAgIGlmIGRpckNhY2hlLmhhcyhkaXIpIGFuZCBub3Qgb3B0Lmlnbm9yZUNhY2hlXG4gICAgICAgICAgICBAbG9hZERpckl0ZW1zIGRpciwgaXRlbSwgZGlyQ2FjaGUuZ2V0KGRpciksIGNvbCwgb3B0XG4gICAgICAgICAgICBwb3N0LmVtaXQgJ2RpcicsIGRpclxuICAgICAgICBlbHNlXG4gICAgICAgICAgICAjIG9wdC5pZ25vcmVIaWRkZW4gPSBub3Qgd2luZG93LnN0YXRlLmdldCBcImJyb3dzZXJ8c2hvd0hpZGRlbnwje2Rpcn1cIlxuXG4gICAgICAgICAgICBkaXJsaXN0IGRpciwgb3B0LCAoZXJyLCBpdGVtcykgPT5cblxuICAgICAgICAgICAgICAgIGlmIGVycj8gdGhlbiByZXR1cm5cblxuICAgICAgICAgICAgICAgIHBvc3QudG9NYWluICdkaXJMb2FkZWQnLCBkaXJcblxuICAgICAgICAgICAgICAgIGRpckNhY2hlLnNldCBkaXIsIGl0ZW1zXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtcyBkaXIsIGl0ZW0sIGl0ZW1zLCBjb2wsIG9wdFxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnZGlyJywgZGlyXG5cbiAgICBsb2FkRGlySXRlbXM6IChkaXIsIGl0ZW0sIGl0ZW1zLCBjb2wsIG9wdCkgPT5cblxuICAgICAgICB1cGRpciA9IHNsYXNoLnJlc29sdmUgc2xhc2guam9pbiBkaXIsICcuLidcblxuICAgICAgICBpZiBjb2wgPT0gMCBvciBjb2wtMSA8IEBudW1Db2xzKCkgYW5kIEBjb2x1bW5zW2NvbC0xXS5hY3RpdmVSb3coKT8uaXRlbS5uYW1lID09ICcuLidcbiAgICAgICAgICAgIGlmIGl0ZW1zWzBdLm5hbWUgbm90IGluIFsnLi4nLCAnLyddXG4gICAgICAgICAgICAgICAgaWYgbm90ICh1cGRpciA9PSBkaXIgPT0gc2xhc2gucmVzb2x2ZSAnLycpXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLnVuc2hpZnRcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICcuLidcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdkaXInXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiAgdXBkaXJcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLnVuc2hpZnRcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICcvJ1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6IGRpclxuXG4gICAgICAgIHdoaWxlIGNvbCA+PSBAbnVtQ29scygpXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcblxuICAgICAgICBAY29sdW1uc1tjb2xdLmxvYWRJdGVtcyBpdGVtcywgaXRlbVxuXG4gICAgICAgIGlmIG9wdC5hY3RpdmVcbiAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0ucm93KHNsYXNoLmZpbGUgb3B0LmFjdGl2ZSk/LnNldEFjdGl2ZSgpXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBuYXZpZ2F0ZVRvRmlsZTogKGZpbGUpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICMga2xvZyAnZmlsZWJyb3dzZXIubmF2aWdhdGVUb0ZpbGUnIGZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgbGFzdFBhdGggPSBAbGFzdFVzZWRDb2x1bW4oKT8ucGF0aCgpXG4gICAgICAgIGlmIGZpbGUgPT0gbGFzdFBhdGhcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIHNsYXNoLmlzUmVsYXRpdmUgZmlsZVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgZmlsZWxpc3QgPSBzbGFzaC5wYXRobGlzdCBmaWxlXG4gICAgICAgIGxhc3RsaXN0ID0gc2xhc2gucGF0aGxpc3QgbGFzdFBhdGhcblxuICAgICAgICBpZiB2YWxpZCBsYXN0bGlzdFxuXG4gICAgICAgICAgICBsYXN0ZGlyID0gbGFzdCBsYXN0bGlzdFxuICAgICAgICAgICAgaWYgQGxhc3RVc2VkQ29sdW1uKCk/LmlzRmlsZSgpXG4gICAgICAgICAgICAgICAgbGFzdGRpciA9IHNsYXNoLmRpciBsYXN0ZGlyXG4gICAgICAgICAgICByZWxhdGl2ZSA9IHNsYXNoLnJlbGF0aXZlIGZpbGUsIGxhc3RkaXJcblxuICAgICAgICAgICAgaWYgc2xhc2guaXNSZWxhdGl2ZSByZWxhdGl2ZVxuICAgICAgICAgICAgICAgIHVwQ291bnQgPSAwXG4gICAgICAgICAgICAgICAgd2hpbGUgcmVsYXRpdmUuc3RhcnRzV2l0aCAnLi4vJ1xuICAgICAgICAgICAgICAgICAgICB1cENvdW50ICs9IDFcbiAgICAgICAgICAgICAgICAgICAgcmVsYXRpdmUgPSByZWxhdGl2ZS5zdWJzdHIgM1xuXG4gICAgICAgICAgICAgICAgaWYgdXBDb3VudCA8IEBudW1Db2xzKCktMVxuICAgICAgICAgICAgICAgICAgICBjb2wgICA9IEBudW1Db2xzKCkgLSAxIC0gdXBDb3VudFxuICAgICAgICAgICAgICAgICAgICByZWxzdCA9IHNsYXNoLnBhdGhsaXN0IHJlbGF0aXZlXG4gICAgICAgICAgICAgICAgICAgIHBhdGhzID0gZmlsZWxpc3Quc2xpY2UgZmlsZWxpc3QubGVuZ3RoIC0gcmVsc3QubGVuZ3RoXG5cbiAgICAgICAgaWYgZW1wdHkgcGF0aHNcblxuICAgICAgICAgICAgcGtnRGlyICAgPSBzbGFzaC5wa2cgZmlsZVxuICAgICAgICAgICAgcGtnbGlzdCAgPSBzbGFzaC5wYXRobGlzdCBwa2dEaXJcblxuICAgICAgICAgICAgbGlzdGluZGV4ID0gcGtnbGlzdC5sZW5ndGggLSAxXG4gICAgICAgICAgICBjb2wwaW5kZXggPSBsaXN0aW5kZXhcbiAgICAgICAgICAgIGNvbCA9IDBcblxuICAgICAgICAgICAgaWYgZmlsZWxpc3RbY29sMGluZGV4XSA9PSBAY29sdW1uc1swXT8ucGF0aCgpXG4gICAgICAgICAgICAgICAgd2hpbGUgY29sMGluZGV4IDwgbGFzdGxpc3QubGVuZ3RoIGFuZCBjb2wwaW5kZXggPCBmaWxlbGlzdC5sZW5ndGggYW5kIGxhc3RsaXN0W2NvbDBpbmRleF0gPT0gZmlsZWxpc3RbY29sMGluZGV4XVxuICAgICAgICAgICAgICAgICAgICBjb2wwaW5kZXggKz0gMVxuICAgICAgICAgICAgICAgICAgICBjb2wgKz0gMVxuXG4gICAgICAgICAgICBwYXRocyA9IGZpbGVsaXN0LnNsaWNlIGNvbDBpbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRmlsZSBsYXN0IHBhdGhzXG4gICAgICAgICAgICBsYXN0VHlwZSA9ICdmaWxlJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBsYXN0VHlwZSA9ICdkaXInXG5cbiAgICAgICAgQHBvcENvbHVtbnNGcm9tICAgY29sK3BhdGhzLmxlbmd0aFxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2xcbiAgICAgICAgXG4gICAgICAgIHdoaWxlIEBudW1Db2xzKCkgPCBwYXRocy5sZW5ndGhcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuICAgICAgICBcbiAgICAgICAgaWYgY29sID4gMFxuICAgICAgICAgICAgQGNvbHVtbnNbY29sLTFdLnJvdyhzbGFzaC5maWxlIHBhdGhzWzBdKT8uc2V0QWN0aXZlKClcblxuICAgICAgICBmb3IgaW5kZXggaW4gWzAuLi5wYXRocy5sZW5ndGhdXG4gICAgICAgICAgICB0eXBlID0gaWYgaW5kZXggPT0gcGF0aHMubGVuZ3RoLTEgdGhlbiBsYXN0VHlwZSBlbHNlICdkaXInXG4gICAgICAgICAgICBmaWxlID0gcGF0aHNbaW5kZXhdXG4gICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBjb2wgPT0gMCA9PSBpbmRleCBhbmQgdHlwZSA9PSAnZmlsZSdcbiAgICAgICAgICAgICAgICB0eXBlID0gJ2RpcidcbiAgICAgICAgICAgICAgICBmaWxlID0gc2xhc2guZGlyIGZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGl0ZW0gPSBmaWxlOmZpbGUsIHR5cGU6dHlwZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzd2l0Y2ggdHlwZVxuICAgICAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIHRoZW4gQGxvYWRGaWxlSXRlbSBpdGVtLCBjb2wraW5kZXhcbiAgICAgICAgICAgICAgICB3aGVuICdkaXInXG4gICAgICAgICAgICAgICAgICAgIG9wdCA9IHt9XG4gICAgICAgICAgICAgICAgICAgIGlmIGluZGV4IDwgcGF0aHMubGVuZ3RoLTFcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdC5hY3RpdmUgPSBwYXRoc1tpbmRleCsxXVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGNvbCA9PSAwID09IGluZGV4IGFuZCBwYXRocy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmFjdGl2ZSA9IHBhdGhzWzBdXG4gICAgICAgICAgICAgICAgICAgIEBsb2FkRGlySXRlbSBpdGVtLCBjb2wraW5kZXgsIG9wdFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICMgaWYgY29sID09IDAgPT0gaW5kZXggYW5kIHBhdGhzLmxlbmd0aCA9PSAxXG4gICAgICAgICAgICAgICAgIyBAY29sdW1uc1tjb2xdLnJvdyhzbGFzaC5maWxlIHBhdGhzWzBdKT8uc2V0QWN0aXZlKClcblxuICAgICAgICBsYXN0SXRlbSA9IGZpbGU6bGFzdChwYXRocyksIHR5cGU6bGFzdFR5cGVcbiAgICAgICAgXG4gICAgICAgIEBlbWl0ICdpdGVtQWN0aXZhdGVkJyBsYXN0SXRlbVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIG9uRmlsZTogKGZpbGUpID0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBmaWxlXG4gICAgICAgIHJldHVybiBpZiBub3QgQGZsZXhcblxuICAgICAgICBAbmF2aWdhdGVUb0ZpbGUgZmlsZVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgaW5pdENvbHVtbnM6IC0+XG5cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgICAgIEB2aWV3Lmluc2VydEJlZm9yZSBAc2hlbGYuZGl2LCBAdmlldy5maXJzdENoaWxkXG4gICAgICAgIEB2aWV3Lmluc2VydEJlZm9yZSBAc2hlbGZSZXNpemUsIG51bGxcblxuICAgICAgICBAc2hlbGYuYnJvd3NlckRpZEluaXRDb2x1bW5zKClcblxuICAgICAgICBAc2V0U2hlbGZTaXplIEBzaGVsZlNpemVcblxuICAgIGNvbHVtbkF0UG9zOiAocG9zKSAtPlxuXG4gICAgICAgIGlmIGNvbHVtbiA9IHN1cGVyIHBvc1xuICAgICAgICAgICAgcmV0dXJuIGNvbHVtblxuXG4gICAgICAgIGlmIGVsZW0uY29udGFpbnNQb3MgQHNoZWxmLmRpdiwgcG9zXG4gICAgICAgICAgICByZXR1cm4gQHNoZWxmXG5cbiAgICBsYXN0Q29sdW1uUGF0aDogLT5cblxuICAgICAgICBpZiBsYXN0Q29sdW1uID0gQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uLnBhdGgoKVxuXG4gICAgbGFzdERpckNvbHVtbjogLT5cblxuICAgICAgICBpZiBsYXN0Q29sdW1uID0gQGxhc3RVc2VkQ29sdW1uKClcbiAgICAgICAgICAgIGlmIGxhc3RDb2x1bW4uaXNEaXIoKVxuICAgICAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RDb2x1bW4ucHJldkNvbHVtbigpXG5cbiAgICBvbkJhY2tzcGFjZUluQ29sdW1uOiAoY29sdW1uKSAtPlxuXG4gICAgICAgIGNvbHVtbi5jbGVhclNlYXJjaCgpXG4gICAgICAgIEBuYXZpZ2F0ZSAnbGVmdCdcblxuICAgIHVwZGF0ZUNvbHVtblNjcm9sbHM6ID0+XG5cbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBAc2hlbGYuc2Nyb2xsLnVwZGF0ZSgpXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMFxuXG4gICAgb25TaGVsZkRyYWc6IChkcmFnLCBldmVudCkgPT5cblxuICAgICAgICBzaGVsZlNpemUgPSBjbGFtcCAwLCA0MDAsIGRyYWcucG9zLnhcbiAgICAgICAgQHNldFNoZWxmU2l6ZSBzaGVsZlNpemVcblxuICAgIHNldFNoZWxmU2l6ZTogKEBzaGVsZlNpemUpIC0+XG5cbiAgICAgICAgIyB3aW5kb3cuc3RhdGUuc2V0ICdzaGVsZnxzaXplJywgQHNoZWxmU2l6ZVxuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUubGVmdCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcbiAgICAgICAgQHNoZWxmLmRpdi5zdHlsZS53aWR0aCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcbiAgICAgICAgQGNvbHMuc3R5bGUubGVmdCA9IFwiI3tAc2hlbGZTaXplfXB4XCJcblxuICAgIHJlZnJlc2g6ID0+XG5cbiAgICAgICAgZGlyQ2FjaGUucmVzZXQoKVxuICAgICAgICBAc3JjQ2FjaGUgPSB7fVxuXG4gICAgICAgIGlmIEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICBAbmF2aWdhdGVUb0ZpbGUgQGxhc3RVc2VkQ29sdW1uKCk/LnBhdGgoKVxuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIG9uRmlsZUluZGV4ZWQ6IChmaWxlLCBpbmZvKSA9PlxuXG4gICAgICAgIEBzcmNDYWNoZVtmaWxlXSA9IGluZm9cblxuICAgICAgICBpZiBmaWxlID09IEBsYXN0VXNlZENvbHVtbigpPy5wYXJlbnQ/LmZpbGVcbiAgICAgICAgICAgIEBsb2FkU291cmNlSXRlbSB7IGZpbGU6ZmlsZSwgdHlwZTonZmlsZScgfSwgQGxhc3RVc2VkQ29sdW1uKCk/LmluZGV4XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZUJyb3dzZXJcbiJdfQ==
//# sourceURL=../coffee/filebrowser.coffee