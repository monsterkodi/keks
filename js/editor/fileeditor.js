// koffee 1.4.0

/*
00000000  000  000      00000000        00000000  0000000    000  000000000   0000000   00000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000000    000  000      0000000         0000000   000   000  000     000     000   000  0000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000       000  0000000  00000000        00000000  0000000    000     000      0000000   000   000
 */
var FileEditor, Menu, Syntax, TextEditor, Watcher, _, clamp, electron, empty, fs, kerror, kpos, popup, post, ref, setStyle, slash, srcmap, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), post = ref.post, stopEvent = ref.stopEvent, setStyle = ref.setStyle, srcmap = ref.srcmap, popup = ref.popup, slash = ref.slash, empty = ref.empty, clamp = ref.clamp, kpos = ref.kpos, fs = ref.fs, kerror = ref.kerror, _ = ref._;

Watcher = require('../tools/watcher');

TextEditor = require('./texteditor');

Syntax = require('./syntax');

Menu = require('./menu');

electron = require('electron');

FileEditor = (function(superClass) {
    extend(FileEditor, superClass);

    function FileEditor(viewElem) {
        this.showContextMenu = bind(this.showContextMenu, this);
        this.onContextMenu = bind(this.onContextMenu, this);
        this.jumpTo = bind(this.jumpTo, this);
        this.jumpToFile = bind(this.jumpToFile, this);
        FileEditor.__super__.constructor.call(this, viewElem, {
            features: ['Diffbar', 'Scrollbar', 'Numbers', 'Minimap', 'Meta', 'Autocomplete', 'Brackets', 'Strings', 'CursorLine'],
            fontSize: 19
        });
        this.currentFile = null;
        this.watch = null;
        this.view.addEventListener("contextmenu", this.onContextMenu);
        post.on('jumpTo', this.jumpTo);
        post.on('jumpToFile', this.jumpToFile);
        this.initPigments();
        this.initInvisibles();
        this.setText('');
    }

    FileEditor.prototype.changed = function(changeInfo) {
        var dirty;
        FileEditor.__super__.changed.call(this, changeInfo);
        dirty = this["do"].hasLineChanges();
        if (this.dirty !== dirty) {
            this.dirty = dirty;
            return post.emit('dirty', this.dirty);
        }
    };

    FileEditor.prototype.clear = function() {
        var ref1, ref2;
        this.dirty = false;
        this.setSalterMode(false);
        this.stopWatcher();
        if ((ref1 = this.diffbar) != null) {
            ref1.clear();
        }
        if ((ref2 = this.meta) != null) {
            ref2.clear();
        }
        this.setLines(['']);
        return this["do"].reset();
    };

    FileEditor.prototype.setCurrentFile = function(file) {
        this.clear();
        this.stopWatcher();
        this.currentFile = file;
        this.setupFileType();
        if ((this.currentFile != null) && slash.fileExists(this.currentFile)) {
            this.setText(slash.readText(this.currentFile));
            this.watch = new Watcher(this.currentFile);
        }
        return this.emit('file', this.currentFile);
    };

    FileEditor.prototype.restoreFromTabState = function(tabsState) {
        if (tabsState.file == null) {
            return kerror("no tabsState.file?");
        }
        return this.setCurrentFile(tabsState.file, tabsState.state);
    };

    FileEditor.prototype.stopWatcher = function() {
        var ref1;
        if ((ref1 = this.watch) != null) {
            ref1.stop();
        }
        return this.watch = null;
    };

    FileEditor.prototype.shebangFileType = function() {
        var ext, fileType;
        if (this.numLines()) {
            fileType = Syntax.shebang(this.line(0));
        }
        if (fileType === 'txt') {
            if (this.currentFile != null) {
                ext = slash.ext(this.currentFile);
                if (indexOf.call(Syntax.syntaxNames, ext) >= 0) {
                    return ext;
                }
            }
        } else if (fileType) {
            return fileType;
        }
        return FileEditor.__super__.shebangFileType.call(this);
    };

    FileEditor.prototype.saveScrollCursorsAndSelections = function(opt) {
        var filePositions, s;
        if (!this.currentFile) {
            return;
        }
        s = {};
        s.main = this.state.main();
        if (this.numCursors() > 1 || this.cursorPos()[0] || this.cursorPos()[1]) {
            s.cursors = this.state.cursors();
        }
        if (this.numSelections()) {
            s.selections = this.state.selections();
        }
        if (this.numHighlights()) {
            s.highlights = this.state.highlights();
        }
        if (this.scroll.scroll) {
            s.scroll = this.scroll.scroll;
        }
        filePositions = window.stash.get('filePositions', Object.create(null));
        if (!_.isPlainObject(filePositions)) {
            filePositions = Object.create(null);
        }
        filePositions[this.currentFile] = s;
        return window.stash.set('filePositions', filePositions);
    };

    FileEditor.prototype.restoreScrollCursorsAndSelections = function() {
        var cursors, filePositions, ref1, ref2, ref3, ref4, ref5, s;
        if (!this.currentFile) {
            return;
        }
        filePositions = window.stash.get('filePositions', {});
        if (filePositions[this.currentFile] != null) {
            s = filePositions[this.currentFile];
            cursors = (ref1 = s.cursors) != null ? ref1 : [[0, 0]];
            cursors = cursors.map((function(_this) {
                return function(c) {
                    return [c[0], clamp(0, _this.numLines() - 1, c[1])];
                };
            })(this));
            this.setCursors(cursors);
            this.setSelections((ref2 = s.selections) != null ? ref2 : []);
            this.setHighlights((ref3 = s.highlights) != null ? ref3 : []);
            this.setMain((ref4 = s.main) != null ? ref4 : 0);
            this.setState(this.state);
            this.syntax.fillDiss(this.mainCursor()[1]);
            if (s.scroll) {
                this.scroll.to(s.scroll);
            }
            this.scroll.cursorIntoView();
        } else {
            this.singleCursorAtPos([0, 0]);
            if (this.mainCursor()[1] === 0) {
                this.scroll.top = 0;
            }
            this.scroll.bot = this.scroll.top - 1;
            this.scroll.to(0);
            this.scroll.cursorIntoView();
        }
        this.updateLayers();
        if ((ref5 = this.numbers) != null) {
            ref5.updateColors();
        }
        this.minimap.onEditorScroll();
        this.emit('cursor');
        return this.emit('selection');
    };

    FileEditor.prototype.jumpToFile = function(opt) {
        var file, fpos, ref1;
        window.tabs.activeTab(true);
        if (opt.newTab) {
            file = opt.file;
            if (opt.line) {
                file += ':' + opt.line;
            }
            if (opt.col) {
                file += ':' + opt.col;
            }
            return post.emit('newTabWithFile', file);
        } else {
            ref1 = slash.splitFilePos(opt.file), file = ref1[0], fpos = ref1[1];
            opt.pos = fpos;
            if (opt.col) {
                opt.pos[0] = opt.col;
            }
            if (opt.line) {
                opt.pos[1] = opt.line - 1;
            }
            opt.winID = window.winID;
            opt.oldPos = this.cursorPos();
            opt.oldFile = this.currentFile;
            return window.navigate.gotoFilePos(opt);
        }
    };

    FileEditor.prototype.jumpTo = function(word, opt) {
        var classes, clss, file, files, find, func, funcs, i, info, infos, j, len, type;
        if (_.isObject(word) && (opt == null)) {
            opt = word;
            word = opt.word;
        }
        if (opt != null) {
            opt;
        } else {
            opt = {};
        }
        if (opt.file != null) {
            this.jumpToFile(opt);
            return true;
        }
        if (empty(word)) {
            return kerror('nothing to jump to?');
        }
        find = word.toLowerCase().trim();
        if (find[0] === '@') {
            find = find.slice(1);
        }
        if (empty(find)) {
            return kerror('FileEditor.jumpTo -- nothing to find?');
        }
        type = opt != null ? opt.type : void 0;
        if (!type || type === 'class') {
            classes = post.get('indexer', 'classes');
            for (clss in classes) {
                info = classes[clss];
                if (clss.toLowerCase() === find) {
                    this.jumpToFile(info);
                    return true;
                }
            }
        }
        if (!type || type === 'func') {
            funcs = post.get('indexer', 'funcs');
            for (func in funcs) {
                infos = funcs[func];
                if (func.toLowerCase() === find) {
                    info = infos[0];
                    for (j = 0, len = infos.length; j < len; j++) {
                        i = infos[j];
                        if (i.file === this.currentFile) {
                            info = i;
                        }
                    }
                    this.jumpToFile(info);
                    return true;
                }
            }
        }
        if (!type || type === 'file') {
            files = post.get('indexer', 'files');
            for (file in files) {
                info = files[file];
                if (slash.base(file).toLowerCase() === find && file !== this.currentFile) {
                    this.jumpToFile({
                        file: file,
                        line: 6
                    });
                }
            }
        }
        window.commandline.commands.search.start('search');
        window.commandline.commands.search.execute(word);
        window.split["do"]('show terminal');
        return true;
    };

    FileEditor.prototype.centerText = function(center, animate) {
        var br, j, k, l, layers, len, len1, newOffset, offsetX, resetTrans, t, transi, visCols;
        if (animate == null) {
            animate = 300;
        }
        this.size.centerText = center;
        this.updateLayers();
        this.size.offsetX = Math.floor(this.size.charWidth / 2 + this.size.numbersWidth);
        if (center) {
            br = this.view.getBoundingClientRect();
            visCols = parseInt(br.width / this.size.charWidth);
            newOffset = parseInt(this.size.charWidth * (visCols - 100) / 2);
            this.size.offsetX = Math.max(this.size.offsetX, newOffset);
            this.size.centerText = true;
        } else {
            this.size.centerText = false;
        }
        this.updateLinePositions(animate);
        if (animate) {
            layers = ['.selections', '.highlights', '.cursors'];
            transi = ['.selection', '.highlight', '.cursor'].concat(layers);
            resetTrans = (function(_this) {
                return function() {
                    var j, k, l, len, len1, t;
                    for (j = 0, len = layers.length; j < len; j++) {
                        l = layers[j];
                        setStyle('.editor .layers ' + l, 'transform', "translateX(0)");
                    }
                    for (k = 0, len1 = transi.length; k < len1; k++) {
                        t = transi[k];
                        setStyle('.editor .layers ' + t, 'transition', "initial");
                    }
                    return _this.updateLayers();
                };
            })(this);
            if (center) {
                offsetX = this.size.offsetX - this.size.numbersWidth - this.size.charWidth / 2;
            } else {
                offsetX = Math.floor(this.size.charWidth / 2 + this.size.numbersWidth);
                offsetX = Math.max(offsetX, (this.screenSize().width - this.screenSize().height) / 2);
                offsetX -= this.size.numbersWidth + this.size.charWidth / 2;
                offsetX *= -1;
            }
            for (j = 0, len = layers.length; j < len; j++) {
                l = layers[j];
                setStyle('.editor .layers ' + l, 'transform', "translateX(" + offsetX + "px)");
            }
            for (k = 0, len1 = transi.length; k < len1; k++) {
                t = transi[k];
                setStyle('.editor .layers ' + t, 'transition', "all " + (animate / 1000) + "s");
            }
            return setTimeout(resetTrans, animate);
        } else {
            return this.updateLayers();
        }
    };

    FileEditor.prototype.onContextMenu = function(event) {
        return stopEvent(event, this.showContextMenu(kpos(event)));
    };

    FileEditor.prototype.showContextMenu = function(absPos) {
        if (absPos == null) {
            absPos = kpos(this.view.getBoundingClientRect().left, this.view.getBoundingClientRect().top);
        }
        return popup.menu({
            items: [
                {
                    text: 'Close Editor',
                    combo: 'ctrl+w'
                }
            ].concat(Menu()),
            x: absPos.x,
            y: absPos.y
        });
    };

    FileEditor.prototype.clickAtPos = function(p, event) {
        if (event.metaKey) {
            if (kpos(event).x <= this.size.numbersWidth) {
                this.singleCursorAtPos(p);
                return;
            }
        }
        return FileEditor.__super__.clickAtPos.call(this, p, event);
    };

    return FileEditor;

})(TextEditor);

module.exports = FileEditor;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsZ0pBQUE7SUFBQTs7Ozs7QUFRQSxNQUF5RixPQUFBLENBQVEsS0FBUixDQUF6RixFQUFFLGVBQUYsRUFBUSx5QkFBUixFQUFtQix1QkFBbkIsRUFBNkIsbUJBQTdCLEVBQXFDLGlCQUFyQyxFQUE0QyxpQkFBNUMsRUFBbUQsaUJBQW5ELEVBQTBELGlCQUExRCxFQUFpRSxlQUFqRSxFQUF1RSxXQUF2RSxFQUEyRSxtQkFBM0UsRUFBbUY7O0FBRW5GLE9BQUEsR0FBYSxPQUFBLENBQVEsa0JBQVI7O0FBQ2IsVUFBQSxHQUFhLE9BQUEsQ0FBUSxjQUFSOztBQUNiLE1BQUEsR0FBYSxPQUFBLENBQVEsVUFBUjs7QUFDYixJQUFBLEdBQWEsT0FBQSxDQUFRLFFBQVI7O0FBQ2IsUUFBQSxHQUFhLE9BQUEsQ0FBUSxVQUFSOztBQUVQOzs7SUFFQyxvQkFBQyxRQUFEOzs7OztRQUVDLDRDQUFNLFFBQU4sRUFDSTtZQUFBLFFBQUEsRUFBVSxDQUNOLFNBRE0sRUFFTixXQUZNLEVBR04sU0FITSxFQUlOLFNBSk0sRUFLTixNQUxNLEVBTU4sY0FOTSxFQU9OLFVBUE0sRUFRTixTQVJNLEVBU04sWUFUTSxDQUFWO1lBV0EsUUFBQSxFQUFVLEVBWFY7U0FESjtRQWNBLElBQUMsQ0FBQSxXQUFELEdBQWU7UUFDZixJQUFDLENBQUEsS0FBRCxHQUFlO1FBRWYsSUFBQyxDQUFBLElBQUksQ0FBQyxnQkFBTixDQUF1QixhQUF2QixFQUFzQyxJQUFDLENBQUEsYUFBdkM7UUFFQSxJQUFJLENBQUMsRUFBTCxDQUFRLFFBQVIsRUFBd0IsSUFBQyxDQUFBLE1BQXpCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxZQUFSLEVBQXdCLElBQUMsQ0FBQSxVQUF6QjtRQUVBLElBQUMsQ0FBQSxZQUFELENBQUE7UUFDQSxJQUFDLENB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QUFqQixDQUFqQjtJQUFYOzt5QkFFZixlQUFBLEdBQWlCLFNBQUMsTUFBRDtRQUViLElBQU8sY0FBUDtZQUNJLE1BQUEsR0FBUyxJQUFBLENBQUssSUFBQyxDQUFBLElBQUksQ0FBQyxxQkFBTixDQUFBLENBQTZCLENBQUMsSUFBbkMsRUFBeUMsSUFBQyxDQUFBLElBQUksQ0FBQyxxQkFBTixDQUFBLENBQTZCLENBQUMsR0FBdkUsRUFEYjs7ZUFHQSxLQUFLLENBQUMsSUFBTixDQUNJO1lBQUEsS0FBQSxFQUFPO2dCQUFDO29CQUFBLElBQUEsRUFBSyxjQUFMO29CQUFvQixLQUFBLEVBQU0sUUFBMUI7aUJBQUQ7YUFBb0MsQ0FBQyxNQUFyQyxDQUE0QyxJQUFBLENBQUEsQ0FBNUMsQ0FBUDtZQUNBLENBQUEsRUFBRyxNQUFNLENBQUMsQ0FEVjtZQUVBLENBQUEsRUFBRyxNQUFNLENBQUMsQ0FGVjtTQURKO0lBTGE7O3lCQWdCakIsVUFBQSxHQUFZLFNBQUMsQ0FBRCxFQUFJLEtBQUo7UUFFUixJQUFHLEtBQUssQ0FBQyxPQUFUO1lBQ0ksSUFBRyxJQUFBLENBQUssS0FBTCxDQUFXLENBQUMsQ0FBWixJQUFpQixJQUFDLENBQUEsSUFBSSxDQUFDLFlBQTFCO2dCQUNJLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixDQUFuQjtBQUNBLHVCQUZKO2FBREo7O2VBS0EsMkNBQU0sQ0FBTixFQUFTLEtBQVQ7SUFQUTs7OztHQTNVUzs7QUFvVnpCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCBzdG9wRXZlbnQsIHNldFN0eWxlLCBzcmNtYXAsIHBvcHVwLCBzbGFzaCwgZW1wdHksIGNsYW1wLCBrcG9zLCBmcywga2Vycm9yLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbldhdGNoZXIgICAgPSByZXF1aXJlICcuLi90b29scy93YXRjaGVyJ1xuVGV4dEVkaXRvciA9IHJlcXVpcmUgJy4vdGV4dGVkaXRvcidcblN5bnRheCAgICAgPSByZXF1aXJlICcuL3N5bnRheCdcbk1lbnUgICAgICAgPSByZXF1aXJlICcuL21lbnUnXG5lbGVjdHJvbiAgID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5cbmNsYXNzIEZpbGVFZGl0b3IgZXh0ZW5kcyBUZXh0RWRpdG9yXG5cbiAgICBAOiAodmlld0VsZW0pIC0+XG5cbiAgICAgICAgc3VwZXIgdmlld0VsZW0sXG4gICAgICAgICAgICBmZWF0dXJlczogW1xuICAgICAgICAgICAgICAgICdEaWZmYmFyJ1xuICAgICAgICAgICAgICAgICdTY3JvbGxiYXInXG4gICAgICAgICAgICAgICAgJ051bWJlcnMnXG4gICAgICAgICAgICAgICAgJ01pbmltYXAnXG4gICAgICAgICAgICAgICAgJ01ldGEnXG4gICAgICAgICAgICAgICAgJ0F1dG9jb21wbGV0ZSdcbiAgICAgICAgICAgICAgICAnQnJhY2tldHMnXG4gICAgICAgICAgICAgICAgJ1N0cmluZ3MnXG4gICAgICAgICAgICAgICAgJ0N1cnNvckxpbmUnXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZm9udFNpemU6IDE5XG5cbiAgICAgICAgQGN1cnJlbnRGaWxlID0gbnVsbFxuICAgICAgICBAd2F0Y2ggICAgICAgPSBudWxsXG5cbiAgICAgICAgQHZpZXcuYWRkRXZlbnRMaXN0ZW5lciBcImNvbnRleHRtZW51XCIsIEBvbkNvbnRleHRNZW51XG5cbiAgICAgICAgcG9zdC5vbiAnanVtcFRvJyAgICAgICAgQGp1bXBUb1xuICAgICAgICBwb3N0Lm9uICdqdW1wVG9GaWxlJyAgICBAanVtcFRvRmlsZVxuXG4gICAgICAgIEBpbml0UGlnbWVudHMoKVxuICAgICAgICBAaW5pdEludmlzaWJsZXMoKVxuXG4gICAgICAgIEBzZXRUZXh0ICcnXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgY2hhbmdlZDogKGNoYW5nZUluZm8pIC0+XG5cbiAgICAgICAgc3VwZXIgY2hhbmdlSW5mb1xuICAgICAgICBkaXJ0eSA9IEBkby5oYXNMaW5lQ2hhbmdlcygpXG4gICAgICAgIGlmIEBkaXJ0eSAhPSBkaXJ0eVxuICAgICAgICAgICAgQGRpcnR5ID0gZGlydHlcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnZGlydHknIEBkaXJ0eVxuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICBjbGVhcjogLT5cblxuICAgICAgICBAZGlydHkgPSBmYWxzZVxuICAgICAgICBAc2V0U2FsdGVyTW9kZSBmYWxzZVxuICAgICAgICBAc3RvcFdhdGNoZXIoKVxuICAgICAgICBAZGlmZmJhcj8uY2xlYXIoKVxuICAgICAgICBAbWV0YT8uY2xlYXIoKVxuICAgICAgICBAc2V0TGluZXMgWycnXVxuICAgICAgICBAZG8ucmVzZXQoKVxuXG4gICAgc2V0Q3VycmVudEZpbGU6IChmaWxlKSAtPlxuXG4gICAgICAgIEBjbGVhcigpXG4gICAgICAgIEBzdG9wV2F0Y2hlcigpXG5cbiAgICAgICAgQGN1cnJlbnRGaWxlID0gZmlsZVxuXG4gICAgICAgIEBzZXR1cEZpbGVUeXBlKClcblxuICAgICAgICBpZiBAY3VycmVudEZpbGU/IGFuZCBzbGFzaC5maWxlRXhpc3RzIEBjdXJyZW50RmlsZVxuICAgICAgICAgICAgQHNldFRleHQgc2xhc2gucmVhZFRleHQgQGN1cnJlbnRGaWxlXG4gICAgICAgICAgICBAd2F0Y2ggPSBuZXcgV2F0Y2hlciBAY3VycmVudEZpbGVcblxuICAgICAgICAjIHBvc3QuZW1pdCAnZmlsZScgQGN1cnJlbnRGaWxlICMgYnJvd3NlciAmIHNoZWxmXG5cbiAgICAgICAgQGVtaXQgJ2ZpbGUnIEBjdXJyZW50RmlsZSAjIGRpZmZiYXIsIHBpZ21lbnRzLCAuLi5cblxuICAgICAgICAjIHBvc3QuZW1pdCAnZGlydHknIEBkaXJ0eVxuXG4gICAgcmVzdG9yZUZyb21UYWJTdGF0ZTogKHRhYnNTdGF0ZSkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yIFwibm8gdGFic1N0YXRlLmZpbGU/XCIgaWYgbm90IHRhYnNTdGF0ZS5maWxlP1xuICAgICAgICBAc2V0Q3VycmVudEZpbGUgdGFic1N0YXRlLmZpbGUsIHRhYnNTdGF0ZS5zdGF0ZVxuXG4gICAgc3RvcFdhdGNoZXI6IC0+XG5cbiAgICAgICAgQHdhdGNoPy5zdG9wKClcbiAgICAgICAgQHdhdGNoID0gbnVsbFxuXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAgICAwMDAgICAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAwXG5cbiAgICBzaGViYW5nRmlsZVR5cGU6IC0+XG5cbiAgICAgICAgZmlsZVR5cGUgPSBTeW50YXguc2hlYmFuZyBAbGluZSgwKSBpZiBAbnVtTGluZXMoKVxuICAgICAgICBpZiBmaWxlVHlwZSA9PSAndHh0J1xuICAgICAgICAgICAgaWYgQGN1cnJlbnRGaWxlP1xuICAgICAgICAgICAgICAgIGV4dCA9IHNsYXNoLmV4dCBAY3VycmVudEZpbGVcbiAgICAgICAgICAgICAgICBpZiBleHQgaW4gU3ludGF4LnN5bnRheE5hbWVzXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBleHRcbiAgICAgICAgZWxzZSBpZiBmaWxlVHlwZVxuICAgICAgICAgICAgcmV0dXJuIGZpbGVUeXBlXG5cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAwMDAwMFxuXG4gICAgc2F2ZVNjcm9sbEN1cnNvcnNBbmRTZWxlY3Rpb25zOiAob3B0KSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGN1cnJlbnRGaWxlXG4gICAgICAgIHMgPSB7fVxuXG4gICAgICAgIHMubWFpbiAgICAgICA9IEBzdGF0ZS5tYWluKClcbiAgICAgICAgcy5jdXJzb3JzICAgID0gQHN0YXRlLmN1cnNvcnMoKSAgICBpZiBAbnVtQ3Vyc29ycygpID4gMSBvciBAY3Vyc29yUG9zKClbMF0gb3IgQGN1cnNvclBvcygpWzFdXG4gICAgICAgIHMuc2VsZWN0aW9ucyA9IEBzdGF0ZS5zZWxlY3Rpb25zKCkgaWYgQG51bVNlbGVjdGlvbnMoKVxuICAgICAgICBzLmhpZ2hsaWdodHMgPSBAc3RhdGUuaGlnaGxpZ2h0cygpIGlmIEBudW1IaWdobGlnaHRzKClcblxuICAgICAgICBzLnNjcm9sbCA9IEBzY3JvbGwuc2Nyb2xsIGlmIEBzY3JvbGwuc2Nyb2xsXG5cbiAgICAgICAgZmlsZVBvc2l0aW9ucyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2ZpbGVQb3NpdGlvbnMnIE9iamVjdC5jcmVhdGUgbnVsbFxuICAgICAgICBpZiBub3QgXy5pc1BsYWluT2JqZWN0IGZpbGVQb3NpdGlvbnNcbiAgICAgICAgICAgIGZpbGVQb3NpdGlvbnMgPSBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICAgZmlsZVBvc2l0aW9uc1tAY3VycmVudEZpbGVdID0gc1xuICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdmaWxlUG9zaXRpb25zJyBmaWxlUG9zaXRpb25zXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuXG4gICAgcmVzdG9yZVNjcm9sbEN1cnNvcnNBbmRTZWxlY3Rpb25zOiAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGN1cnJlbnRGaWxlXG5cbiAgICAgICAgZmlsZVBvc2l0aW9ucyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2ZpbGVQb3NpdGlvbnMnIHt9XG5cbiAgICAgICAgaWYgZmlsZVBvc2l0aW9uc1tAY3VycmVudEZpbGVdP1xuXG4gICAgICAgICAgICBzID0gZmlsZVBvc2l0aW9uc1tAY3VycmVudEZpbGVdXG5cbiAgICAgICAgICAgIGN1cnNvcnMgPSBzLmN1cnNvcnMgPyBbWzAsMF1dXG4gICAgICAgICAgICBjdXJzb3JzID0gY3Vyc29ycy5tYXAgKGMpID0+IFtjWzBdLCBjbGFtcCgwLEBudW1MaW5lcygpLTEsY1sxXSldXG5cbiAgICAgICAgICAgIEBzZXRDdXJzb3JzICAgIGN1cnNvcnNcbiAgICAgICAgICAgIEBzZXRTZWxlY3Rpb25zIHMuc2VsZWN0aW9ucyA/IFtdXG4gICAgICAgICAgICBAc2V0SGlnaGxpZ2h0cyBzLmhpZ2hsaWdodHMgPyBbXVxuICAgICAgICAgICAgQHNldE1haW4gICAgICAgcy5tYWluID8gMFxuICAgICAgICAgICAgQHNldFN0YXRlIEBzdGF0ZVxuXG4gICAgICAgICAgICBAc3ludGF4LmZpbGxEaXNzIEBtYWluQ3Vyc29yKClbMV1cblxuICAgICAgICAgICAgQHNjcm9sbC50byBzLnNjcm9sbCBpZiBzLnNjcm9sbFxuICAgICAgICAgICAgQHNjcm9sbC5jdXJzb3JJbnRvVmlldygpXG5cbiAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgWzAsMF1cbiAgICAgICAgICAgIEBzY3JvbGwudG9wID0gMCBpZiBAbWFpbkN1cnNvcigpWzFdID09IDBcbiAgICAgICAgICAgIEBzY3JvbGwuYm90ID0gQHNjcm9sbC50b3AtMVxuICAgICAgICAgICAgQHNjcm9sbC50byAwXG4gICAgICAgICAgICBAc2Nyb2xsLmN1cnNvckludG9WaWV3KClcblxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcbiAgICAgICAgQG51bWJlcnM/LnVwZGF0ZUNvbG9ycygpXG4gICAgICAgIEBtaW5pbWFwLm9uRWRpdG9yU2Nyb2xsKClcbiAgICAgICAgQGVtaXQgJ2N1cnNvcidcbiAgICAgICAgQGVtaXQgJ3NlbGVjdGlvbidcblxuICAgICMgICAgICAgMDAwICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDBcbiAgICAjICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwXG5cbiAgICBqdW1wVG9GaWxlOiAob3B0KSA9PlxuXG4gICAgICAgIHdpbmRvdy50YWJzLmFjdGl2ZVRhYiB0cnVlXG5cbiAgICAgICAgIyBsb2cgJ2p1bXBUb0ZpbGUnIHJlcXVpcmUoJ2t4aycpLm5vb24uc3RyaW5naWZ5IG9wdFxuXG4gICAgICAgIGlmIG9wdC5uZXdUYWJcblxuICAgICAgICAgICAgZmlsZSA9IG9wdC5maWxlXG4gICAgICAgICAgICBmaWxlICs9ICc6JyArIG9wdC5saW5lIGlmIG9wdC5saW5lXG4gICAgICAgICAgICBmaWxlICs9ICc6JyArIG9wdC5jb2wgaWYgb3B0LmNvbFxuICAgICAgICAgICAgcG9zdC5lbWl0ICduZXdUYWJXaXRoRmlsZScgZmlsZVxuXG4gICAgICAgIGVsc2VcblxuICAgICAgICAgICAgW2ZpbGUsIGZwb3NdID0gc2xhc2guc3BsaXRGaWxlUG9zIG9wdC5maWxlXG4gICAgICAgICAgICBvcHQucG9zID0gZnBvc1xuICAgICAgICAgICAgb3B0LnBvc1swXSA9IG9wdC5jb2wgaWYgb3B0LmNvbFxuICAgICAgICAgICAgb3B0LnBvc1sxXSA9IG9wdC5saW5lLTEgaWYgb3B0LmxpbmVcbiAgICAgICAgICAgIG9wdC53aW5JRCAgPSB3aW5kb3cud2luSURcblxuICAgICAgICAgICAgb3B0Lm9sZFBvcyA9IEBjdXJzb3JQb3MoKVxuICAgICAgICAgICAgb3B0Lm9sZEZpbGUgPSBAY3VycmVudEZpbGVcbiAgICAgICAgICAgIHdpbmRvdy5uYXZpZ2F0ZS5nb3RvRmlsZVBvcyBvcHRcblxuICAgIGp1bXBUbzogKHdvcmQsIG9wdCkgPT5cblxuICAgICAgICBpZiBfLmlzT2JqZWN0KHdvcmQpIGFuZCBub3Qgb3B0P1xuICAgICAgICAgICAgb3B0ICA9IHdvcmRcbiAgICAgICAgICAgIHdvcmQgPSBvcHQud29yZFxuXG4gICAgICAgIG9wdCA/PSB7fVxuXG4gICAgICAgIGlmIG9wdC5maWxlP1xuICAgICAgICAgICAgQGp1bXBUb0ZpbGUgb3B0XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIHJldHVybiBrZXJyb3IgJ25vdGhpbmcgdG8ganVtcCB0bz8nIGlmIGVtcHR5IHdvcmRcblxuICAgICAgICBmaW5kID0gd29yZC50b0xvd2VyQ2FzZSgpLnRyaW0oKVxuICAgICAgICBmaW5kID0gZmluZC5zbGljZSAxIGlmIGZpbmRbMF0gPT0gJ0AnXG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciAnRmlsZUVkaXRvci5qdW1wVG8gLS0gbm90aGluZyB0byBmaW5kPycgaWYgZW1wdHkgZmluZFxuXG4gICAgICAgIHR5cGUgPSBvcHQ/LnR5cGVcblxuICAgICAgICBpZiBub3QgdHlwZSBvciB0eXBlID09ICdjbGFzcydcbiAgICAgICAgICAgIGNsYXNzZXMgPSBwb3N0LmdldCAnaW5kZXhlcicgJ2NsYXNzZXMnXG4gICAgICAgICAgICBmb3IgY2xzcywgaW5mbyBvZiBjbGFzc2VzXG4gICAgICAgICAgICAgICAgaWYgY2xzcy50b0xvd2VyQ2FzZSgpID09IGZpbmRcbiAgICAgICAgICAgICAgICAgICAgQGp1bXBUb0ZpbGUgaW5mb1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIGlmIG5vdCB0eXBlIG9yIHR5cGUgPT0gJ2Z1bmMnXG4gICAgICAgICAgICBmdW5jcyA9IHBvc3QuZ2V0ICdpbmRleGVyJyAnZnVuY3MnXG4gICAgICAgICAgICBmb3IgZnVuYywgaW5mb3Mgb2YgZnVuY3NcbiAgICAgICAgICAgICAgICBpZiBmdW5jLnRvTG93ZXJDYXNlKCkgPT0gZmluZFxuICAgICAgICAgICAgICAgICAgICBpbmZvID0gaW5mb3NbMF1cbiAgICAgICAgICAgICAgICAgICAgZm9yIGkgaW4gaW5mb3NcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGkuZmlsZSA9PSBAY3VycmVudEZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvID0gaVxuICAgICAgICAgICAgICAgICAgICAjIGlmIGluZm9zLmxlbmd0aCA+IDEgYW5kIG5vdCBvcHQ/LmRvbnRMaXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAjIHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy50ZXJtLmV4ZWN1dGUgXCJmdW5jIF4je3dvcmR9JFwiXG4gICAgICAgICAgICAgICAgICAgIEBqdW1wVG9GaWxlIGluZm9cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICBpZiBub3QgdHlwZSBvciB0eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgZmlsZXMgPSBwb3N0LmdldCAnaW5kZXhlcicgJ2ZpbGVzJ1xuICAgICAgICAgICAgZm9yIGZpbGUsIGluZm8gb2YgZmlsZXNcbiAgICAgICAgICAgICAgICBpZiBzbGFzaC5iYXNlKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT0gZmluZCBhbmQgZmlsZSAhPSBAY3VycmVudEZpbGVcbiAgICAgICAgICAgICAgICAgICAgQGp1bXBUb0ZpbGUgZmlsZTpmaWxlLCBsaW5lOjZcblxuICAgICAgICB3aW5kb3cuY29tbWFuZGxpbmUuY29tbWFuZHMuc2VhcmNoLnN0YXJ0ICdzZWFyY2gnXG4gICAgICAgIHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy5zZWFyY2guZXhlY3V0ZSB3b3JkXG5cbiAgICAgICAgd2luZG93LnNwbGl0LmRvICdzaG93IHRlcm1pbmFsJ1xuXG4gICAgICAgIHRydWVcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2VudGVyVGV4dDogKGNlbnRlciwgYW5pbWF0ZT0zMDApIC0+XG5cbiAgICAgICAgQHNpemUuY2VudGVyVGV4dCA9IGNlbnRlclxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcblxuICAgICAgICBAc2l6ZS5vZmZzZXRYID0gTWF0aC5mbG9vciBAc2l6ZS5jaGFyV2lkdGgvMiArIEBzaXplLm51bWJlcnNXaWR0aFxuICAgICAgICBpZiBjZW50ZXJcbiAgICAgICAgICAgIGJyICAgICAgICA9IEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICB2aXNDb2xzICAgPSBwYXJzZUludCBici53aWR0aCAvIEBzaXplLmNoYXJXaWR0aFxuICAgICAgICAgICAgbmV3T2Zmc2V0ID0gcGFyc2VJbnQgQHNpemUuY2hhcldpZHRoICogKHZpc0NvbHMgLSAxMDApIC8gMlxuICAgICAgICAgICAgQHNpemUub2Zmc2V0WCA9IE1hdGgubWF4IEBzaXplLm9mZnNldFgsIG5ld09mZnNldFxuICAgICAgICAgICAgQHNpemUuY2VudGVyVGV4dCA9IHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHNpemUuY2VudGVyVGV4dCA9IGZhbHNlXG5cbiAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMgYW5pbWF0ZVxuXG4gICAgICAgIGlmIGFuaW1hdGVcbiAgICAgICAgICAgIGxheWVycyA9IFsnLnNlbGVjdGlvbnMnICcuaGlnaGxpZ2h0cycgJy5jdXJzb3JzJ11cbiAgICAgICAgICAgIHRyYW5zaSA9IFsnLnNlbGVjdGlvbicgICcuaGlnaGxpZ2h0JyAgJy5jdXJzb3InIF0uY29uY2F0IGxheWVyc1xuICAgICAgICAgICAgcmVzZXRUcmFucyA9ID0+XG4gICAgICAgICAgICAgICAgc2V0U3R5bGUgJy5lZGl0b3IgLmxheWVycyAnK2wsICd0cmFuc2Zvcm0nIFwidHJhbnNsYXRlWCgwKVwiIGZvciBsIGluIGxheWVyc1xuICAgICAgICAgICAgICAgIHNldFN0eWxlICcuZWRpdG9yIC5sYXllcnMgJyt0LCAndHJhbnNpdGlvbicgXCJpbml0aWFsXCIgZm9yIHQgaW4gdHJhbnNpXG4gICAgICAgICAgICAgICAgQHVwZGF0ZUxheWVycygpXG5cbiAgICAgICAgICAgIGlmIGNlbnRlclxuICAgICAgICAgICAgICAgIG9mZnNldFggPSBAc2l6ZS5vZmZzZXRYIC0gQHNpemUubnVtYmVyc1dpZHRoIC0gQHNpemUuY2hhcldpZHRoLzJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBvZmZzZXRYID0gTWF0aC5mbG9vciBAc2l6ZS5jaGFyV2lkdGgvMiArIEBzaXplLm51bWJlcnNXaWR0aFxuICAgICAgICAgICAgICAgIG9mZnNldFggPSBNYXRoLm1heCBvZmZzZXRYLCAoQHNjcmVlblNpemUoKS53aWR0aCAtIEBzY3JlZW5TaXplKCkuaGVpZ2h0KSAvIDJcbiAgICAgICAgICAgICAgICBvZmZzZXRYIC09IEBzaXplLm51bWJlcnNXaWR0aCArIEBzaXplLmNoYXJXaWR0aC8yXG4gICAgICAgICAgICAgICAgb2Zmc2V0WCAqPSAtMVxuXG4gICAgICAgICAgICBzZXRTdHlsZSAnLmVkaXRvciAubGF5ZXJzICcrbCwgJ3RyYW5zZm9ybScgXCJ0cmFuc2xhdGVYKCN7b2Zmc2V0WH1weClcIiBmb3IgbCBpbiBsYXllcnNcbiAgICAgICAgICAgIHNldFN0eWxlICcuZWRpdG9yIC5sYXllcnMgJyt0LCAndHJhbnNpdGlvbicgXCJhbGwgI3thbmltYXRlLzEwMDB9c1wiIGZvciB0IGluIHRyYW5zaVxuICAgICAgICAgICAgc2V0VGltZW91dCByZXNldFRyYW5zLCBhbmltYXRlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB1cGRhdGVMYXllcnMoKVxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwXG5cbiAgICBvbkNvbnRleHRNZW51OiAoZXZlbnQpID0+IHN0b3BFdmVudCBldmVudCwgQHNob3dDb250ZXh0TWVudSBrcG9zIGV2ZW50XG5cbiAgICBzaG93Q29udGV4dE1lbnU6IChhYnNQb3MpID0+XG5cbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IGtwb3MgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG5cbiAgICAgICAgcG9wdXAubWVudSBcbiAgICAgICAgICAgIGl0ZW1zOiBbdGV4dDonQ2xvc2UgRWRpdG9yJyBjb21ibzonY3RybCt3J10uY29uY2F0IE1lbnUoKVxuICAgICAgICAgICAgeDogYWJzUG9zLnhcbiAgICAgICAgICAgIHk6IGFic1Bvcy55XG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2xpY2tBdFBvczogKHAsIGV2ZW50KSAtPlxuXG4gICAgICAgIGlmIGV2ZW50Lm1ldGFLZXlcbiAgICAgICAgICAgIGlmIGtwb3MoZXZlbnQpLnggPD0gQHNpemUubnVtYmVyc1dpZHRoXG4gICAgICAgICAgICAgICAgQHNpbmdsZUN1cnNvckF0UG9zIHBcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBzdXBlciBwLCBldmVudFxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVFZGl0b3JcbiJdfQ==
//# sourceURL=../../coffee/editor/fileeditor.coffee