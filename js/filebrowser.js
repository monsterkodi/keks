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

    FileBrowser.prototype.dropAction = function(event, target) {
        var action, i, j, len, len1, results, source, sources;
        action = event.getModifierState('Shift') && 'copy' || 'move';
        sources = event.dataTransfer.getData('text/plain').split('\n');
        for (i = 0, len = sources.length; i < len; i++) {
            source = sources[i];
            if (action === 'move') {
                if (source === target || slash.dir(source) === target) {
                    klog('noop');
                    return;
                }
            }
        }
        klog('dropAction', sources);
        results = [];
        for (j = 0, len1 = sources.length; j < len1; j++) {
            source = sources[j];
            switch (action) {
                case 'move':
                    results.push(File.rename(source, target, (function(_this) {
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
                    })(this)));
                    break;
                case 'copy':
                    results.push(File.copy(source, target, (function(_this) {
                        return function(newFile) {
                            var targetColumn;
                            klog('copied', source, target);
                            if (targetColumn = _this.columnForFile(newFile)) {
                                return targetColumn.addFile(newFile);
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
        klog('activateItem', col, item != null ? item.file : void 0);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWJyb3dzZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLG1LQUFBO0lBQUE7Ozs7QUFRQSxNQUFpRyxPQUFBLENBQVEsS0FBUixDQUFqRyxFQUFFLGVBQUYsRUFBUSxlQUFSLEVBQWMsaUJBQWQsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsZUFBMUMsRUFBZ0QsZUFBaEQsRUFBc0QsZUFBdEQsRUFBNEQsaUJBQTVELEVBQW1FLGVBQW5FLEVBQXlFLGlCQUF6RSxFQUFnRixXQUFoRixFQUFvRixXQUFwRixFQUF3RixTQUF4RixFQUEyRjs7QUFFM0YsT0FBQSxHQUFXLE9BQUEsQ0FBUSxXQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBQ1gsSUFBQSxHQUFXLE9BQUEsQ0FBUSxjQUFSOztBQUNYLE9BQUEsR0FBVyxPQUFBLENBQVEsaUJBQVI7O0FBQ1gsTUFBQSxHQUFXLE9BQUEsQ0FBUSxjQUFSOztBQUNYLE1BQUEsR0FBVyxPQUFBLENBQVEsUUFBUjs7QUFFTDs7O0lBRVcscUJBQUMsSUFBRDs7Ozs7Ozs7UUFFVCw2Q0FBTSxJQUFOO1FBRUEsTUFBTSxDQUFDLFdBQVAsR0FBcUI7UUFFckIsSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxLQUFELEdBQVUsSUFBSSxLQUFKLENBQVUsSUFBVjtRQUNWLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBSSxNQUFKLENBQVcsSUFBWDtRQUNWLElBQUMsQ0FBQSxJQUFELEdBQVU7UUFFVixJQUFJLENBQUMsRUFBTCxDQUFRLE1BQVIsRUFBc0IsSUFBQyxDQUFBLE1BQXZCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxhQUFSLEVBQXNCLElBQUMsQ0FBQSxhQUF2QjtRQUNBLElBQUksQ0FBQyxF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LENBQUMsR0FBTixDQUFVLFlBQVYsRUFBdUIsSUFBQyxDQUFBLFNBQXhCO1FBQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBbkIsR0FBNkIsSUFBQyxDQUFBLFNBQUYsR0FBWTtRQUN4QyxJQUFDLENBQUEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBakIsR0FBNEIsSUFBQyxDQUFBLFNBQUYsR0FBWTtRQUN2QyxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFaLEdBQXNCLElBQUMsQ0FBQSxTQUFGLEdBQVk7ZUFDakMsSUFBQyxDQUFBLG1CQUFELENBQUE7SUFOVTs7MEJBUWQsV0FBQSxHQUFhLFNBQUE7QUFFVCxZQUFBO1FBQUEsSUFBRyxJQUFDLENBQUEsU0FBRCxHQUFhLENBQWhCO1lBQ0ksSUFBQyxDQUFBLFlBQUQsQ0FBYyxHQUFkLEVBREo7U0FBQSxNQUFBOztvQkFHcUIsQ0FBRSxLQUFuQixDQUFBOztZQUNBLElBQUMsQ0FBQSxZQUFELENBQWMsQ0FBZCxFQUpKOztlQU1BLElBQUMsQ0FBQSxtQkFBRCxDQUFBO0lBUlM7OzBCQVViLE9BQUEsR0FBUyxTQUFBO0FBRUwsWUFBQTtRQUFBLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUFIO21CQUNJLElBQUMsQ0FBQSxjQUFELDhDQUFpQyxDQUFFLElBQW5CLENBQUEsVUFBaEIsRUFESjs7SUFGSzs7OztHQXhkYTs7QUE2ZDFCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIG9wZW4sIHZhbGlkLCBlbXB0eSwgY2xhbXAsIHByZWZzLCBsYXN0LCBlbGVtLCBkcmFnLCBzdGF0ZSwga2xvZywgc2xhc2gsIGZzLCBvcywgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5Ccm93c2VyICA9IHJlcXVpcmUgJy4vYnJvd3NlcidcblNoZWxmICAgID0gcmVxdWlyZSAnLi9zaGVsZidcblNlbGVjdCAgID0gcmVxdWlyZSAnLi9zZWxlY3QnXG5GaWxlICAgICA9IHJlcXVpcmUgJy4vdG9vbHMvZmlsZSdcbmRpcmxpc3QgID0gcmVxdWlyZSAnLi90b29scy9kaXJsaXN0J1xucGJ5dGVzICAgPSByZXF1aXJlICdwcmV0dHktYnl0ZXMnXG5tb21lbnQgICA9IHJlcXVpcmUgJ21vbWVudCdcblxuY2xhc3MgRmlsZUJyb3dzZXIgZXh0ZW5kcyBCcm93c2VyXG5cbiAgICBjb25zdHJ1Y3RvcjogKHZpZXcpIC0+XG5cbiAgICAgICAgc3VwZXIgdmlld1xuXG4gICAgICAgIHdpbmRvdy5maWxlYnJvd3NlciA9IEBcblxuICAgICAgICBAbG9hZElEID0gMFxuICAgICAgICBAc2hlbGYgID0gbmV3IFNoZWxmIEBcbiAgICAgICAgQHNlbGVjdCA9IG5ldyBTZWxlY3QgQFxuICAgICAgICBAbmFtZSAgID0gJ0ZpbGVCcm93c2VyJ1xuXG4gICAgICAgIHBvc3Qub24gJ2ZpbGUnICAgICAgICBAb25GaWxlXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVicm93c2VyJyBAb25GaWxlQnJvd3NlclxuICAgICAgICBwb3N0Lm9uICdvcGVuRmlsZScgICAgQG9uT3BlbkZpbGVcblxuICAgICAgICBAc2hlbGZSZXNpemUgPSBlbGVtICdkaXYnIGNsYXNzOiAnc2hlbGZSZXNpemUnXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLnRvcCAgICAgID0gJzBweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmJvdHRvbSAgID0gJzBweCdcbiAgICAgICAgQHNoZWxmUmVzaXplLnN0eWxlLmxlZnQgICAgID0gJzE5NHB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUud2lkdGggICAgPSAnNnB4J1xuICAgICAgICBAc2hlbGZSZXNpemUuc3R5bGUuY3Vyc29yICAgPSAnZXctcmVzaXplJ1xuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBzaGVsZlJlc2l6ZVxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uU2hlbGZEcmFnXG5cbiAgICAgICAgQHNoZWxmU2l6ZSA9IHByZWZzLmdldCAnc2hlbGbilrhzaXplJyAyMDBcblxuICAgICAgICBAaW5pdENvbHVtbnMoKVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBkcm9wQWN0aW9uOiAoZXZlbnQsIHRhcmdldCkgLT5cbiAgICAgICAgXG4gICAgICAgIGFjdGlvbiA9IGV2ZW50LmdldE1vZGlmaWVyU3RhdGUoJ1NoaWZ0JykgYW5kICdjb3B5JyBvciAnbW92ZSdcbiAgICAgICAgXG4gICAgICAgIHNvdXJjZXMgPSBldmVudC5kYXRhVHJhbnNmZXIuZ2V0RGF0YSgndGV4dC9wbGFpbicpLnNwbGl0ICdcXG4nXG4gICAgICAgIFxuICAgICAgICBmb3Igc291cmNlIGluIHNvdXJjZXNcbiAgICAgICAgXG4gICAgICAgICAgICBpZiBhY3Rpb24gPT0gJ21vdmUnIFxuICAgICAgICAgICAgICAgIGlmIHNvdXJjZSA9PSB0YXJnZXQgb3Igc2xhc2guZGlyKHNvdXJjZSkgPT0gdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgIGtsb2cgJ25vb3AnXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIFxuICAgICAgICBrbG9nICdkcm9wQWN0aW9uJyBzb3VyY2VzXG4gICAgICAgIFxuICAgICAgICBmb3Igc291cmNlIGluIHNvdXJjZXNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3dpdGNoIGFjdGlvblxuICAgICAgICAgICAgICAgIHdoZW4gJ21vdmUnXG4gICAgICAgICAgICAgICAgICAgIEZpbGUucmVuYW1lIHNvdXJjZSwgdGFyZ2V0LCAobmV3RmlsZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIGtsb2cgJ21vdmVkJyBzb3VyY2UsIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgc291cmNlQ29sdW1uID0gQGNvbHVtbkZvckZpbGUgc291cmNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZUNvbHVtbi5yZW1vdmVGaWxlIHNvdXJjZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdGFyZ2V0Q29sdW1uID0gQGNvbHVtbkZvckZpbGUgbmV3RmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldENvbHVtbi5pbnNlcnRGaWxlIG5ld0ZpbGVcbiAgICAgICAgICAgICAgICB3aGVuICdjb3B5J1xuICAgICAgICAgICAgICAgICAgICBGaWxlLmNvcHkgc291cmNlLCB0YXJnZXQsIChuZXdGaWxlKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAga2xvZyAnY29waWVkJyBzb3VyY2UsIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgdGFyZ2V0Q29sdW1uID0gQGNvbHVtbkZvckZpbGUgbmV3RmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldENvbHVtbi5hZGRGaWxlIG5ld0ZpbGVcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgY29sdW1uRm9yRmlsZTogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgY29sdW1uIGluIEBjb2x1bW5zXG4gICAgICAgICAgICBpZiBjb2x1bW4ucGFyZW50Py5maWxlID09IHNsYXNoLmRpciBmaWxlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbHVtblxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBzaGFyZWRDb2x1bW5JbmRleDogKGZpbGUpIC0+IFxuICAgICAgICBcbiAgICAgICAgY29sID0gMFxuICAgICAgICBcbiAgICAgICAgZm9yIGNvbHVtbiBpbiBAY29sdW1uc1xuICAgICAgICAgICAgaWYgY29sdW1uLmlzRGlyKCkgYW5kIGZpbGUuc3RhcnRzV2l0aCBjb2x1bW4ucGF0aCgpXG4gICAgICAgICAgICAgICAgY29sICs9IDFcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBjb2wgPT0gMSBhbmQgc2xhc2guZGlyKGZpbGUpICE9IEBjb2x1bW5zWzBdPy5wYXRoKClcbiAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgIE1hdGgubWF4IC0xLCBjb2wtMlxuXG4gICAgY2xvc2VWaWV3ZXI6IC0+XG4gICAgICAgIFxuICAgICAgICBAdmlld2VyPy5jbG9zZSgpXG4gICAgICAgIEB2aWV3ZXIgPSBudWxsXG4gICAgICAgIFxuICAgIGJyb3dzZTogKGZpbGUsIG9wdCkgLT4gXG4gICAgXG4gICAgICAgIEBjbG9zZVZpZXdlcigpXG4gICAgICAgIFxuICAgICAgICBpZiBmaWxlIHRoZW4gQGxvYWRJdGVtIEBmaWxlSXRlbShmaWxlKSwgb3B0XG4gICAgICAgIFxuICAgIG5hdmlnYXRlVG9GaWxlOiAoZmlsZSkgLT5cblxuICAgICAgICBAY2xvc2VWaWV3ZXIoKVxuICAgICAgICBcbiAgICAgICAgbGFzdFBhdGggPSBAbGFzdERpckNvbHVtbigpPy5wYXRoKClcbiAgICAgICAgXG4gICAgICAgIGZpbGUgPSBzbGFzaC5wYXRoIGZpbGVcbiAgICAgICAgXG4gICAgICAgIGlmIGZpbGUgPT0gbGFzdFBhdGggb3Igc2xhc2guaXNSZWxhdGl2ZSBmaWxlXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBjb2wgPSBAc2hhcmVkQ29sdW1uSW5kZXggZmlsZVxuICAgICAgICBcbiAgICAgICAgZmlsZWxpc3QgPSBzbGFzaC5wYXRobGlzdCBmaWxlXG4gICAgICAgIFxuICAgICAgICBpZiBjb2wgPj0gMFxuICAgICAgICAgICAgcGF0aHMgPSBmaWxlbGlzdC5zbGljZSBmaWxlbGlzdC5pbmRleE9mKEBjb2x1bW5zW2NvbF0ucGF0aCgpKSsxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHBhdGhzID0gZmlsZWxpc3Quc2xpY2UgZmlsZWxpc3QubGVuZ3RoLTJcbiAgICAgICAgICAgIFxuICAgICAgICBAY2xlYXJDb2x1bW5zRnJvbSBjb2wrMSwgcG9wOnRydWUgY2xlYXI6Y29sK3BhdGhzLmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgd2hpbGUgQG51bUNvbHMoKSA8IHBhdGhzLmxlbmd0aFxuICAgICAgICAgICAgQGFkZENvbHVtbigpXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgZm9yIGluZGV4IGluIFswLi4ucGF0aHMubGVuZ3RoXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpdGVtID0gQGZpbGVJdGVtIHBhdGhzW2luZGV4XVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICAgICAgd2hlbiAnZmlsZScgdGhlbiBAbG9hZEZpbGVJdGVtIGl0ZW0sIGNvbCsxK2luZGV4XG4gICAgICAgICAgICAgICAgd2hlbiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICBvcHQgPSB7fVxuICAgICAgICAgICAgICAgICAgICBpZiBpbmRleCA8IHBhdGhzLmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHQuYWN0aXZlID0gcGF0aHNbaW5kZXgrMV1cbiAgICAgICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtIGl0ZW0sIGNvbCsxK2luZGV4LCBvcHRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbCA9IEBsYXN0RGlyQ29sdW1uKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcm93ID0gY29sLnJvdyhzbGFzaC5maWxlIGZpbGUpXG4gICAgICAgICAgICAgICAgcm93LnNldEFjdGl2ZSgpXG5cbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBmaWxlSXRlbTogKHBhdGgpIC0+XG4gICAgICAgIFxuICAgICAgICBwID0gc2xhc2gucmVzb2x2ZSBwYXRoXG4gICAgICAgIGZpbGU6cFxuICAgICAgICB0eXBlOnNsYXNoLmlzRmlsZShwKSBhbmQgJ2ZpbGUnIG9yICdkaXInXG4gICAgICAgIG5hbWU6c2xhc2guZmlsZSBwXG4gICAgICAgIFxuICAgIG9uRmlsZUJyb3dzZXI6IChhY3Rpb24sIGl0ZW0sIGFyZykgPT5cblxuICAgICAgICBzd2l0Y2ggYWN0aW9uXG4gICAgICAgICAgICB3aGVuICdsb2FkSXRlbScgICAgIHRoZW4gQGxvYWRJdGVtICAgICBpdGVtLCBhcmdcbiAgICAgICAgICAgIHdoZW4gJ2FjdGl2YXRlSXRlbScgdGhlbiBAYWN0aXZhdGVJdGVtIGl0ZW0sIGFyZ1xuICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBsb2FkRGlyOiAocGF0aCkgLT4gQGxvYWRJdGVtIHR5cGU6J2RpcicgZmlsZTpwYXRoXG4gICAgXG4gICAgbG9hZEl0ZW06IChpdGVtLCBvcHQpIC0+XG5cbiAgICAgICAgb3B0ID89IGFjdGl2ZTonLi4nIGZvY3VzOnRydWVcbiAgICAgICAgaXRlbS5uYW1lID89IHNsYXNoLmZpbGUgaXRlbS5maWxlXG5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gMSwgcG9wOnRydWUsIGNsZWFyOm9wdC5jbGVhciA/IDFcblxuICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICB3aGVuICdkaXInICB0aGVuIEBsb2FkRGlySXRlbSBpdGVtLCAwLCBvcHRcbiAgICAgICAgICAgIHdoZW4gJ2ZpbGUnIFxuICAgICAgICAgICAgICAgIG9wdC5hY3RpdmF0ZSA9IGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgIHdoaWxlIEBudW1Db2xzKCkgPCAyIHRoZW4gQGFkZENvbHVtbigpXG4gICAgICAgICAgICAgICAgQGxvYWREaXJJdGVtIEBmaWxlSXRlbShzbGFzaC5kaXIoaXRlbS5maWxlKSksIDAsIG9wdFxuXG4gICAgICAgIGlmIG9wdC5mb2N1c1xuICAgICAgICAgICAgQGNvbHVtbnNbMF0/LmZvY3VzKClcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBhY3RpdmF0ZUl0ZW06IChpdGVtLCBjb2wpIC0+XG5cbiAgICAgICAga2xvZyAnYWN0aXZhdGVJdGVtJyBjb2wsIGl0ZW0/LmZpbGVcbiAgICAgICAgXG4gICAgICAgIEBjbGVhckNvbHVtbnNGcm9tIGNvbCsxLCBwb3A6dHJ1ZSwgY2xlYXI6Y29sKzFcblxuICAgICAgICBzd2l0Y2ggaXRlbS50eXBlXG4gICAgICAgICAgICB3aGVuICdkaXInICB0aGVuIEBsb2FkRGlySXRlbSAgaXRlbSwgY29sKzEsIGZvY3VzOmZhbHNlXG4gICAgICAgICAgICB3aGVuICdmaWxlJyB0aGVuIEBsb2FkRmlsZUl0ZW0gaXRlbSwgY29sKzFcbiAgICAgICAgICAgIFxuICAgICAgICAjIGlmIHJvdyA9IEBjb2x1bW5zW2NvbF0ucm93IHNsYXNoLmZpbGUgaXRlbS5maWxlXG4gICAgICAgICAgICAjIEBzZWxlY3Qucm93IHJvd1xuICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgbG9hZEZpbGVJdGVtOiAoaXRlbSwgY29sPTApIC0+XG5cbiAgICAgICAgQGNsZWFyQ29sdW1uc0Zyb20gY29sLCBwb3A6dHJ1ZVxuXG4gICAgICAgIHdoaWxlIGNvbCA+PSBAbnVtQ29scygpXG4gICAgICAgICAgICBAYWRkQ29sdW1uKClcblxuICAgICAgICBmaWxlID0gaXRlbS5maWxlXG5cbiAgICAgICAgQGNvbHVtbnNbY29sXS5wYXJlbnQgPSBpdGVtXG4gICAgICAgIFxuICAgICAgICBpZiBGaWxlLmlzSW1hZ2UgZmlsZVxuICAgICAgICAgICAgQGNvbHVtbnNbY29sXS50YWJsZS5hcHBlbmRDaGlsZCBAaW1hZ2VJbmZvIGZpbGVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3dpdGNoIHNsYXNoLmV4dCBmaWxlXG4gICAgICAgICAgICAgICAgd2hlbiAndGlmZicgJ3RpZidcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgICAgICBAY29udmVydEltYWdlIHJvd1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIEBmaWxlSW5mbyBmaWxlXG4gICAgICAgICAgICAgICAgd2hlbiAncHhtJ1xuICAgICAgICAgICAgICAgICAgICBpZiBub3Qgc2xhc2gud2luKClcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjb252ZXJ0UFhNIHJvd1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIEBmaWxlSW5mbyBmaWxlXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAY29sdW1uc1tjb2xdLnRhYmxlLmFwcGVuZENoaWxkIEBmaWxlSW5mbyBmaWxlXG5cbiAgICAgICAgcG9zdC5lbWl0ICdsb2FkJyBjb2x1bW46Y29sLCBpdGVtOml0ZW1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuXG4gICAgIyAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBpbWFnZUluZm86IChmaWxlKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgIGltZyA9IGVsZW0gJ2ltZycgY2xhc3M6J2Jyb3dzZXJJbWFnZScgc3JjOnNsYXNoLmZpbGVVcmwgZmlsZVxuICAgICAgICBjbnQgPSBlbGVtIGNsYXNzOidicm93c2VySW1hZ2VDb250YWluZXInIGNoaWxkOmltZ1xuICAgICAgICBjbnQuYWRkRXZlbnRMaXN0ZW5lciAnZGJsY2xpY2snIC0+IG9wZW4gZmlsZVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaW1nLm9ubG9hZCA9IC0+XG4gICAgICAgICAgICBpbWcgPSQgJy5icm93c2VySW1hZ2UnXG4gICAgICAgICAgICBiciA9IGltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgeCA9IGltZy5jbGllbnRYXG4gICAgICAgICAgICB3aWR0aCAgPSBwYXJzZUludCBici5yaWdodCAtIGJyLmxlZnQgLSAyXG4gICAgICAgICAgICBoZWlnaHQgPSBwYXJzZUludCBici5ib3R0b20gLSBici50b3AgLSAyXG5cbiAgICAgICAgICAgIGltZy5zdHlsZS5vcGFjaXR5ICAgPSAnMSdcbiAgICAgICAgICAgIGltZy5zdHlsZS5tYXhXaWR0aCAgPSAnMTAwJSdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3RhdCA9IHNsYXNoLmZpbGVFeGlzdHMgZmlsZVxuICAgICAgICAgICAgc2l6ZSA9IHBieXRlcyhzdGF0LnNpemUpLnNwbGl0ICcgJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBhZ2UgPSBtb21lbnQoKS50byhtb21lbnQoc3RhdC5tdGltZSksIHRydWUpXG4gICAgICAgICAgICBbbnVtLCByYW5nZV0gPSBhZ2Uuc3BsaXQgJyAnXG4gICAgICAgICAgICBudW0gPSAnMScgaWYgbnVtWzBdID09ICdhJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBodG1sICA9IFwiPHRyPjx0aCBjb2xzcGFuPTI+I3t3aWR0aH08c3BhbiBjbGFzcz0ncHVuY3QnPng8L3NwYW4+I3toZWlnaHR9PC90aD48L3RyPlwiXG4gICAgICAgICAgICBodG1sICs9IFwiPHRyPjx0aD4je3NpemVbMF19PC90aD48dGQ+I3tzaXplWzFdfTwvdGQ+PC90cj5cIlxuICAgICAgICAgICAgaHRtbCArPSBcIjx0cj48dGg+I3tudW19PC90aD48dGQ+I3tyYW5nZX08L3RkPjwvdHI+XCJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaW5mbyA9IGVsZW0gY2xhc3M6J2Jyb3dzZXJGaWxlSW5mbycgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICBlbGVtICdkaXYnIGNsYXNzOlwiZmlsZUluZm9GaWxlICN7c2xhc2guZXh0IGZpbGV9XCIgaHRtbDpGaWxlLnNwYW4gZmlsZVxuICAgICAgICAgICAgICAgIGVsZW0gJ3RhYmxlJyBjbGFzczpcImZpbGVJbmZvRGF0YVwiIGh0bWw6aHRtbFxuICAgICAgICAgICAgXVxuICAgICAgICAgICAgY250ID0kICcuYnJvd3NlckltYWdlQ29udGFpbmVyJ1xuICAgICAgICAgICAgY250LmFwcGVuZENoaWxkIGluZm9cbiAgICAgICAgXG4gICAgICAgIGNudFxuICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgXG4gICAgICAgIFxuICAgIGZpbGVJbmZvOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHN0YXQgPSBzbGFzaC5maWxlRXhpc3RzIGZpbGVcbiAgICAgICAgc2l6ZSA9IHBieXRlcyhzdGF0LnNpemUpLnNwbGl0ICcgJ1xuICAgICAgICBcbiAgICAgICAgdCA9IG1vbWVudCBzdGF0Lm10aW1lXG5cbiAgICAgICAgYWdlID0gbW9tZW50KCkudG8odCwgdHJ1ZSlcbiAgICAgICAgW251bSwgcmFuZ2VdID0gYWdlLnNwbGl0ICcgJ1xuICAgICAgICBudW0gPSAnMScgaWYgbnVtWzBdID09ICdhJ1xuICAgICAgICBpZiByYW5nZSA9PSAnZmV3J1xuICAgICAgICAgICAgbnVtID0gbW9tZW50KCkuZGlmZiB0LCAnc2Vjb25kcydcbiAgICAgICAgICAgIHJhbmdlID0gJ3NlY29uZHMnXG4gICAgICAgIFxuICAgICAgICBpbmZvID0gZWxlbSBjbGFzczonYnJvd3NlckZpbGVJbmZvJyBjaGlsZHJlbjogW1xuICAgICAgICAgICAgZWxlbSAnZGl2JyBjbGFzczpcImZpbGVJbmZvSWNvbiAje3NsYXNoLmV4dCBmaWxlfSAje0ZpbGUuaWNvbkNsYXNzTmFtZSBmaWxlfVwiXG4gICAgICAgICAgICBlbGVtICdkaXYnIGNsYXNzOlwiZmlsZUluZm9GaWxlICN7c2xhc2guZXh0IGZpbGV9XCIgaHRtbDpGaWxlLnNwYW4gZmlsZVxuICAgICAgICAgICAgZWxlbSAndGFibGUnIGNsYXNzOlwiZmlsZUluZm9EYXRhXCIgaHRtbDpcIjx0cj48dGg+I3tzaXplWzBdfTwvdGg+PHRkPiN7c2l6ZVsxXX08L3RkPjwvdHI+PHRyPjx0aD4je251bX08L3RoPjx0ZD4je3JhbmdlfTwvdGQ+PC90cj5cIlxuICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICBpbmZvLmFkZEV2ZW50TGlzdGVuZXIgJ2RibGNsaWNrJyAtPiBvcGVuIGZpbGVcbiAgICAgICAgXG4gICAgICAgIGluZm9cbiAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGxvYWREaXJJdGVtOiAoaXRlbSwgY29sPTAsIG9wdD17fSkgLT5cblxuICAgICAgICByZXR1cm4gaWYgY29sID4gMCBhbmQgaXRlbS5uYW1lID09ICcvJ1xuXG4gICAgICAgIGRpciA9IGl0ZW0uZmlsZVxuXG4gICAgICAgIG9wdC5pZ25vcmVIaWRkZW4gPSBub3QgcHJlZnMuZ2V0IFwiYnJvd3NlcuKWuHNob3dIaWRkZW7ilrgje2Rpcn1cIlxuXG4gICAgICAgIGRpcmxpc3QgZGlyLCBvcHQsIChpdGVtcykgPT5cblxuICAgICAgICAgICAgaWYgQGNvbHVtbnMubGVuZ3RoIGFuZCBjb2wgPj0gQGNvbHVtbnMubGVuZ3RoIGFuZCBAc2tpcE9uRGJsQ2xpY2tcbiAgICAgICAgICAgICAgICBkZWxldGUgQHNraXBPbkRibENsaWNrXG4gICAgICAgICAgICAgICAgcmV0dXJuIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgQGxvYWREaXJJdGVtcyBkaXIsIGl0ZW0sIGl0ZW1zLCBjb2wsIG9wdFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgbG9hZERpckl0ZW1zOiAoZGlyLCBpdGVtLCBpdGVtcywgY29sLCBvcHQpID0+XG5cbiAgICAgICAgdXBkaXIgPSBzbGFzaC5yZXNvbHZlIHNsYXNoLmpvaW4gZGlyLCAnLi4nXG5cbiAgICAgICAgaWYgY29sID09IDAgb3IgY29sLTEgPCBAbnVtQ29scygpIGFuZCBAY29sdW1uc1tjb2wtMV0uYWN0aXZlUm93KCk/Lml0ZW0ubmFtZSA9PSAnLi4nXG4gICAgICAgICAgICBpZiBpdGVtc1swXT8ubmFtZSBub3QgaW4gWycuLicgJy8nXVxuICAgICAgICAgICAgICAgIGlmIHVwZGlyICE9IGRpclxuICAgICAgICAgICAgICAgICAgICBpdGVtcy51bnNoaWZ0XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnLi4nXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogIHVwZGlyXG5cbiAgICAgICAgd2hpbGUgY29sID49IEBudW1Db2xzKClcbiAgICAgICAgICAgIEBhZGRDb2x1bW4oKVxuXG4gICAgICAgIEBjb2x1bW5zW2NvbF0ubG9hZEl0ZW1zIGl0ZW1zLCBpdGVtXG5cbiAgICAgICAgcG9zdC5lbWl0ICdsb2FkJyBjb2x1bW46Y29sLCBpdGVtOml0ZW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0LmFjdGl2YXRlXG4gICAgICAgICAgICBpZiByb3cgPSBAY29sdW1uc1tjb2xdLnJvdyBzbGFzaC5maWxlIG9wdC5hY3RpdmF0ZVxuICAgICAgICAgICAgICAgIHJvdy5hY3RpdmF0ZSgpXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdsb2FkJyBjb2x1bW46Y29sKzEgaXRlbTpyb3cuaXRlbVxuICAgICAgICBlbHNlIGlmIG9wdC5hY3RpdmVcbiAgICAgICAgICAgIEBjb2x1bW5zW2NvbF0ucm93KHNsYXNoLmZpbGUgb3B0LmFjdGl2ZSk/LnNldEFjdGl2ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0LmZvY3VzICE9IGZhbHNlIGFuZCBlbXB0eShkb2N1bWVudC5hY3RpdmVFbGVtZW50KSBhbmQgZW1wdHkoJCgnLnBvcHVwJyk/Lm91dGVySFRNTClcbiAgICAgICAgICAgIGlmIGNvbCA9IEBsYXN0RGlyQ29sdW1uKClcbiAgICAgICAgICAgICAgICBjb2wuZGl2LmZvY3VzKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgb3B0LmNiPyBjb2x1bW46Y29sLCBpdGVtOml0ZW1cblxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICBvbkZpbGU6IChmaWxlKSA9PlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgZmlsZVxuICAgICAgICByZXR1cm4gaWYgbm90IEBmbGV4XG5cbiAgICAgICAgQG5hdmlnYXRlVG9GaWxlIGZpbGVcblxuICAgIG9uT3BlbkZpbGU6IChmaWxlKSA9PlxuICAgICAgICBcbiAgICAgICAgb3BlbiBmaWxlXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGluaXRDb2x1bW5zOiAtPlxuXG4gICAgICAgIHN1cGVyKClcblxuICAgICAgICBAdmlldy5pbnNlcnRCZWZvcmUgQHNoZWxmLmRpdiwgQHZpZXcuZmlyc3RDaGlsZFxuICAgICAgICBAdmlldy5pbnNlcnRCZWZvcmUgQHNoZWxmUmVzaXplLCBudWxsXG5cbiAgICAgICAgQHNoZWxmLmJyb3dzZXJEaWRJbml0Q29sdW1ucygpXG5cbiAgICAgICAgQHNldFNoZWxmU2l6ZSBAc2hlbGZTaXplXG5cbiAgICBjb2x1bW5BdFBvczogKHBvcykgLT5cblxuICAgICAgICBpZiBjb2x1bW4gPSBzdXBlciBwb3NcbiAgICAgICAgICAgIHJldHVybiBjb2x1bW5cblxuICAgICAgICBpZiBlbGVtLmNvbnRhaW5zUG9zIEBzaGVsZi5kaXYsIHBvc1xuICAgICAgICAgICAgcmV0dXJuIEBzaGVsZlxuXG4gICAgbGFzdENvbHVtblBhdGg6IC0+XG5cbiAgICAgICAgaWYgbGFzdENvbHVtbiA9IEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtbi5wYXRoKClcblxuICAgIGxhc3REaXJDb2x1bW46IC0+XG5cbiAgICAgICAgaWYgbGFzdENvbHVtbiA9IEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICBpZiBsYXN0Q29sdW1uLmlzRGlyKClcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFzdENvbHVtblxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBsYXN0Q29sdW1uLnByZXZDb2x1bW4oKVxuXG4gICAgb25CYWNrc3BhY2VJbkNvbHVtbjogKGNvbHVtbikgLT5cblxuICAgICAgICBjb2x1bW4uY2xlYXJTZWFyY2goKVxuICAgICAgICBAbmF2aWdhdGUgJ2xlZnQnXG5cbiAgICB1cGRhdGVDb2x1bW5TY3JvbGxzOiA9PlxuXG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgQHNoZWxmLnNjcm9sbC51cGRhdGUoKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDBcblxuICAgIG9uU2hlbGZEcmFnOiAoZHJhZywgZXZlbnQpID0+XG5cbiAgICAgICAgc2hlbGZTaXplID0gY2xhbXAgMCwgNDAwLCBkcmFnLnBvcy54XG4gICAgICAgIEBzZXRTaGVsZlNpemUgc2hlbGZTaXplXG5cbiAgICBzZXRTaGVsZlNpemU6IChAc2hlbGZTaXplKSAtPlxuXG4gICAgICAgIHByZWZzLnNldCAnc2hlbGbilrhzaXplJyBAc2hlbGZTaXplXG4gICAgICAgIEBzaGVsZlJlc2l6ZS5zdHlsZS5sZWZ0ID0gXCIje0BzaGVsZlNpemV9cHhcIlxuICAgICAgICBAc2hlbGYuZGl2LnN0eWxlLndpZHRoID0gXCIje0BzaGVsZlNpemV9cHhcIlxuICAgICAgICBAY29scy5zdHlsZS5sZWZ0ID0gXCIje0BzaGVsZlNpemV9cHhcIlxuICAgICAgICBAdXBkYXRlQ29sdW1uU2Nyb2xscygpXG5cbiAgICB0b2dnbGVTaGVsZjogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBzaGVsZlNpemUgPCAxXG4gICAgICAgICAgICBAc2V0U2hlbGZTaXplIDIwMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbGFzdFVzZWRDb2x1bW4oKT8uZm9jdXMoKVxuICAgICAgICAgICAgQHNldFNoZWxmU2l6ZSAwXG4gICAgICAgICAgICBcbiAgICAgICAgQHVwZGF0ZUNvbHVtblNjcm9sbHMoKVxuICAgICAgICBcbiAgICByZWZyZXNoOiA9PlxuXG4gICAgICAgIGlmIEBsYXN0VXNlZENvbHVtbigpXG4gICAgICAgICAgICBAbmF2aWdhdGVUb0ZpbGUgQGxhc3RVc2VkQ29sdW1uKCk/LnBhdGgoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVCcm93c2VyXG4iXX0=
//# sourceURL=../coffee/filebrowser.coffee