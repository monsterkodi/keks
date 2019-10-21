// koffee 1.4.0

/*
00     00  000  000   000  000  00     00   0000000   00000000
000   000  000  0000  000  000  000   000  000   000  000   000
000000000  000  000 0 000  000  000000000  000000000  00000000
000 0 000  000  000  0000  000  000 0 000  000   000  000
000   000  000  000   000  000  000   000  000   000  000
 */
var MapScroll, Minimap, clamp, drag, elem, getStyle, klog, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), getStyle = ref.getStyle, clamp = ref.clamp, elem = ref.elem, drag = ref.drag, klog = ref.klog;

MapScroll = require('./mapscroll');

Minimap = (function() {
    function Minimap(editor) {
        var minimapWidth, ref1, ref2;
        this.editor = editor;
        this.clearAll = bind(this.clearAll, this);
        this.onScroll = bind(this.onScroll, this);
        this.onEditorScroll = bind(this.onEditorScroll, this);
        this.onEditorViewHeight = bind(this.onEditorViewHeight, this);
        this.onEditorNumLines = bind(this.onEditorNumLines, this);
        this.onStart = bind(this.onStart, this);
        this.onDrag = bind(this.onDrag, this);
        this.onChanged = bind(this.onChanged, this);
        this.onVanishLines = bind(this.onVanishLines, this);
        this.onExposeLines = bind(this.onExposeLines, this);
        this.exposeLine = bind(this.exposeLine, this);
        this.drawTopBot = bind(this.drawTopBot, this);
        this.drawMainCursor = bind(this.drawMainCursor, this);
        this.drawCursors = bind(this.drawCursors, this);
        this.drawHighlights = bind(this.drawHighlights, this);
        this.drawLines = bind(this.drawLines, this);
        this.drawSelections = bind(this.drawSelections, this);
        minimapWidth = parseInt((ref1 = getStyle('.minimap', 'width')) != null ? ref1 : 130);
        klog('minimapWidth', minimapWidth);
        this.editor.layerScroll.style.right = minimapWidth + "px";
        this.width = 2 * minimapWidth;
        this.height = 8192;
        this.offsetLeft = 6;
        this.elem = elem({
            "class": 'minimap'
        });
        this.topbot = elem({
            "class": 'topbot'
        });
        this.selecti = elem('canvas', {
            "class": 'minimapSelections',
            width: this.width,
            height: this.height
        });
        this.lines = elem('canvas', {
            "class": 'minimapLines',
            width: this.width,
            height: this.height
        });
        this.highlig = elem('canvas', {
            "class": 'minimapHighlights',
            width: this.width,
            height: this.height
        });
        this.cursors = elem('canvas', {
            "class": 'minimapCursors',
            width: this.width,
            height: this.height
        });
        this.elem.appendChild(this.topbot);
        this.elem.appendChild(this.selecti);
        this.elem.appendChild(this.lines);
        this.elem.appendChild(this.highlig);
        this.elem.appendChild(this.cursors);
        this.elem.addEventListener('wheel', (ref2 = this.editor.scrollbar) != null ? ref2.onWheel : void 0);
        this.editor.view.appendChild(this.elem);
        this.editor.on('viewHeight', this.onEditorViewHeight);
        this.editor.on('numLines', this.onEditorNumLines);
        this.editor.on('changed', this.onChanged);
        this.editor.on('highlight', this.drawHighlights);
        this.editor.scroll.on('scroll', this.onEditorScroll);
        this.scroll = new MapScroll({
            exposeMax: this.height / 4,
            lineHeight: 4,
            viewHeight: 2 * this.editor.viewHeight()
        });
        this.scroll.name = this.editor.name + ".minimap";
        this.drag = new drag({
            target: this.elem,
            onStart: this.onStart,
            onMove: this.onDrag,
            cursor: 'pointer'
        });
        this.scroll.on('clearLines', this.clearAll);
        this.scroll.on('scroll', this.onScroll);
        this.scroll.on('exposeLines', this.onExposeLines);
        this.scroll.on('vanishLines', this.onVanishLines);
        this.scroll.on('exposeLine', this.exposeLine);
        this.onScroll();
        this.drawLines();
        this.drawTopBot();
    }

    Minimap.prototype.drawSelections = function() {
        var ctx, i, len, offset, r, ref1, results, y;
        this.selecti.height = this.height;
        this.selecti.width = this.width;
        if (this.scroll.exposeBot < 0) {
            return;
        }
        ctx = this.selecti.getContext('2d');
        ctx.fillStyle = this.editor.syntax.colorForClassnames('selection');
        ref1 = rangesFromTopToBotInRanges(this.scroll.exposeTop, this.scroll.exposeBot, this.editor.selections());
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            r = ref1[i];
            y = (r[0] - this.scroll.exposeTop) * this.scroll.lineHeight;
            if (2 * r[1][0] < this.width) {
                offset = r[1][0] && this.offsetLeft || 0;
                results.push(ctx.fillRect(offset + 2 * r[1][0], y, 2 * (r[1][1] - r[1][0]), this.scroll.lineHeight));
            } else {
                results.push(void 0);
            }
        }
        return results;
    };

    Minimap.prototype.drawLines = function(top, bot) {
        var ctx, diss, i, li, r, ref1, ref2, results, y;
        if (top == null) {
            top = this.scroll.exposeTop;
        }
        if (bot == null) {
            bot = this.scroll.exposeBot;
        }
        ctx = this.lines.getContext('2d');
        y = parseInt((top - this.scroll.exposeTop) * this.scroll.lineHeight);
        ctx.clearRect(0, y, this.width, ((bot - this.scroll.exposeTop) - (top - this.scroll.exposeTop) + 1) * this.scroll.lineHeight);
        if (this.scroll.exposeBot < 0) {
            return;
        }
        bot = Math.min(bot, this.editor.numLines() - 1);
        if (bot < top) {
            return;
        }
        results = [];
        for (li = i = ref1 = top, ref2 = bot; ref1 <= ref2 ? i <= ref2 : i >= ref2; li = ref1 <= ref2 ? ++i : --i) {
            diss = this.editor.syntax.getDiss(li);
            y = parseInt((li - this.scroll.exposeTop) * this.scroll.lineHeight);
            results.push((function() {
                var j, len, ref3, results1;
                ref3 = diss != null ? diss : [];
                results1 = [];
                for (j = 0, len = ref3.length; j < len; j++) {
                    r = ref3[j];
                    if (2 * r.start >= this.width) {
                        break;
                    }
                    if (r.value != null) {
                        ctx.fillStyle = this.editor.syntax.colorForClassnames(r.value + " minimap");
                    } else if (r.styl != null) {
                        ctx.fillStyle = this.editor.syntax.colorForStyle(r.styl);
                    }
                    results1.push(ctx.fillRect(this.offsetLeft + 2 * r.start, y, 2 * r.match.length, this.scroll.lineHeight));
                }
                return results1;
            }).call(this));
        }
        return results;
    };

    Minimap.prototype.drawHighlights = function() {
        var ctx, i, len, r, ref1, results, y;
        this.highlig.height = this.height;
        this.highlig.width = this.width;
        if (this.scroll.exposeBot < 0) {
            return;
        }
        ctx = this.highlig.getContext('2d');
        ctx.fillStyle = this.editor.syntax.colorForClassnames('highlight');
        ref1 = rangesFromTopToBotInRanges(this.scroll.exposeTop, this.scroll.exposeBot, this.editor.highlights());
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            r = ref1[i];
            y = (r[0] - this.scroll.exposeTop) * this.scroll.lineHeight;
            if (2 * r[1][0] < this.width) {
                ctx.fillRect(this.offsetLeft + 2 * r[1][0], y, 2 * (r[1][1] - r[1][0]), this.scroll.lineHeight);
            }
            results.push(ctx.fillRect(0, y, this.offsetLeft, this.scroll.lineHeight));
        }
        return results;
    };

    Minimap.prototype.drawCursors = function() {
        var ctx, i, len, r, ref1, y;
        this.cursors.height = this.height;
        this.cursors.width = this.width;
        if (this.scroll.exposeBot < 0) {
            return;
        }
        ctx = this.cursors.getContext('2d');
        ref1 = rangesFromTopToBotInRanges(this.scroll.exposeTop, this.scroll.exposeBot, rangesFromPositions(this.editor.cursors()));
        for (i = 0, len = ref1.length; i < len; i++) {
            r = ref1[i];
            y = (r[0] - this.scroll.exposeTop) * this.scroll.lineHeight;
            if (2 * r[1][0] < this.width) {
                ctx.fillStyle = '#f80';
                ctx.fillRect(this.offsetLeft + 2 * r[1][0], y, 2, this.scroll.lineHeight);
            }
            ctx.fillStyle = 'rgba(255,128,0,0.5)';
            ctx.fillRect(this.offsetLeft - 4, y, this.offsetLeft - 2, this.scroll.lineHeight);
        }
        return this.drawMainCursor();
    };

    Minimap.prototype.drawMainCursor = function(blink) {
        var ctx, mc, y;
        ctx = this.cursors.getContext('2d');
        ctx.fillStyle = blink && '#000' || '#ff0';
        mc = this.editor.mainCursor();
        y = (mc[1] - this.scroll.exposeTop) * this.scroll.lineHeight;
        if (2 * mc[0] < this.width) {
            ctx.fillRect(this.offsetLeft + 2 * mc[0], y, 2, this.scroll.lineHeight);
        }
        return ctx.fillRect(this.offsetLeft - 4, y, this.offsetLeft - 2, this.scroll.lineHeight);
    };

    Minimap.prototype.drawTopBot = function() {
        var lh, th, ty;
        if (this.scroll.exposeBot < 0) {
            return;
        }
        lh = this.scroll.lineHeight / 2;
        th = (this.editor.scroll.bot - this.editor.scroll.top + 1) * lh;
        ty = 0;
        if (this.editor.scroll.scrollMax) {
            ty = (Math.min(0.5 * this.scroll.viewHeight, this.scroll.numLines * 2) - th) * this.editor.scroll.scroll / this.editor.scroll.scrollMax;
        }
        this.topbot.style.height = th + "px";
        return this.topbot.style.top = ty + "px";
    };

    Minimap.prototype.exposeLine = function(li) {
        return this.drawLines(li, li);
    };

    Minimap.prototype.onExposeLines = function(e) {
        return this.drawLines(this.scroll.exposeTop, this.scroll.exposeBot);
    };

    Minimap.prototype.onVanishLines = function(e) {
        if (e.top != null) {
            return this.drawLines(this.scroll.exposeTop, this.scroll.exposeBot);
        } else {
            return this.clearRange(this.scroll.exposeBot, this.scroll.exposeBot + this.scroll.numLines);
        }
    };

    Minimap.prototype.onChanged = function(changeInfo) {
        var change, i, len, li, ref1, ref2;
        if (changeInfo.selects) {
            this.drawSelections();
        }
        if (changeInfo.cursors) {
            this.drawCursors();
        }
        if (!changeInfo.changes.length) {
            return;
        }
        this.scroll.setNumLines(this.editor.numLines());
        ref1 = changeInfo.changes;
        for (i = 0, len = ref1.length; i < len; i++) {
            change = ref1[i];
            li = change.oldIndex;
            if ((ref2 = !change.change) === 'deleted' || ref2 === 'inserted') {
                break;
            }
            this.drawLines(li, li);
        }
        if (li <= this.scroll.exposeBot) {
            return this.drawLines(li, this.scroll.exposeBot);
        }
    };

    Minimap.prototype.onDrag = function(drag, event) {
        var br, li, pc, ry;
        if (this.scroll.fullHeight > this.scroll.viewHeight) {
            br = this.elem.getBoundingClientRect();
            ry = event.clientY - br.top;
            pc = 2 * ry / this.scroll.viewHeight;
            li = parseInt(pc * this.editor.scroll.numLines);
            return this.jumpToLine(li, event);
        } else {
            return this.jumpToLine(this.lineIndexForEvent(event), event);
        }
    };

    Minimap.prototype.onStart = function(drag, event) {
        return this.jumpToLine(this.lineIndexForEvent(event), event);
    };

    Minimap.prototype.jumpToLine = function(li, event) {
        this.editor.scroll.to((li - 5) * this.editor.scroll.lineHeight);
        if (!event.metaKey) {
            this.editor.singleCursorAtPos([0, li + 5], {
                extend: event.shiftKey
            });
        }
        this.editor.focus();
        return this.onEditorScroll();
    };

    Minimap.prototype.lineIndexForEvent = function(event) {
        var br, li, ly, py, st;
        st = this.elem.scrollTop;
        br = this.elem.getBoundingClientRect();
        ly = clamp(0, this.elem.offsetHeight, event.clientY - br.top);
        py = parseInt(Math.floor(2 * ly / this.scroll.lineHeight)) + this.scroll.top;
        li = parseInt(Math.min(this.scroll.numLines - 1, py));
        return li;
    };

    Minimap.prototype.onEditorNumLines = function(n) {
        if (n && this.lines.height <= this.scroll.lineHeight) {
            this.onEditorViewHeight(this.editor.viewHeight());
        }
        return this.scroll.setNumLines(n);
    };

    Minimap.prototype.onEditorViewHeight = function(h) {
        this.scroll.setViewHeight(2 * this.editor.viewHeight());
        this.onScroll();
        return this.onEditorScroll();
    };

    Minimap.prototype.onEditorScroll = function() {
        var pc, tp;
        if (this.scroll.fullHeight > this.scroll.viewHeight) {
            pc = this.editor.scroll.scroll / this.editor.scroll.scrollMax;
            tp = parseInt(pc * this.scroll.scrollMax);
            this.scroll.to(tp);
        }
        return this.drawTopBot();
    };

    Minimap.prototype.onScroll = function() {
        var t, x, y;
        y = parseInt(-this.height / 4 - this.scroll.offsetTop / 2);
        x = parseInt(this.width / 4);
        t = "translate3d(" + x + "px, " + y + "px, 0px) scale3d(0.5, 0.5, 1)";
        this.selecti.style.transform = t;
        this.highlig.style.transform = t;
        this.cursors.style.transform = t;
        return this.lines.style.transform = t;
    };

    Minimap.prototype.clearRange = function(top, bot) {
        var ctx;
        ctx = this.lines.getContext('2d');
        return ctx.clearRect(0, (top - this.scroll.exposeTop) * this.scroll.lineHeight, 2 * this.width, (bot - top) * this.scroll.lineHeight);
    };

    Minimap.prototype.clearAll = function() {
        this.selecti.width = this.selecti.width;
        this.highlig.width = this.highlig.width;
        this.cursors.width = this.cursors.width;
        this.topbot.width = this.topbot.width;
        this.lines.width = this.lines.width;
        return this.topbot.style.height = '0';
    };

    return Minimap;

})();

module.exports = Minimap;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1hcC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsMERBQUE7SUFBQTs7QUFRQSxNQUF3QyxPQUFBLENBQVEsS0FBUixDQUF4QyxFQUFFLHVCQUFGLEVBQVksaUJBQVosRUFBbUIsZUFBbkIsRUFBeUIsZUFBekIsRUFBK0I7O0FBRS9CLFNBQUEsR0FBWSxPQUFBLENBQVEsYUFBUjs7QUFFTjtJQUVDLGlCQUFDLE1BQUQ7QUFFQyxZQUFBO1FBRkEsSUFBQyxDQUFBLFNBQUQ7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQUVBLFlBQUEsR0FBZSxRQUFBLHlEQUF3QyxHQUF4QztRQUVmLElBQUEsQ0FBSyxjQUFMLEVBQW9CLFlBQXBCO1FBRUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQTFCLEdBQXFDLFlBQUQsR0FBYztRQUVsRCxJQUFDLENBQUEsS0FBRCxHQUFTLENBQUEsR0FBRTtRQUNYLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsVUFBRCxHQUFjO1FBRWQsSUFBQyxDQUFBLElBQUQsR0FBVyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFNBQVA7U0FBTDtRQUNYLElBQUMsQ0FBQSxNQUFELEdBQVcsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxRQUFQO1NBQUw7UUFDWCxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUEsQ0FBSyxRQUFMLEVBQWU7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1CQUFQO1lBQTRCLEtBQUEsRUFBTyxJQUFDLENBQUEsS0FBcEM7WUFBMkMsTUFBQSxFQUFRLElBQUMsQ0FBQSxNQUFwRDtTQUFmO1FBQ1gsSUFBQyxDQUFBLEtBQUQsR0FBVyxJQUFBLENBQUssUUFBTCxFQUFlO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO1lBQTRCLEtBQUEsRUFBTyxJQUFDLENBQUEsS0FBcEM7WUFBMkMsTUFBQSxFQUFRLElBQUMsQ0FBQSxNQUFwRDtTQUFmO1FBQ1gsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFBLENBQUssUUFBTCxFQUFlO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxtQkFBUDtZQUE0QixLQUFBLEVBQU8sSUFBQyxDQUFBLEtBQXBDO1lBQTJDLE1BQUEsRUFBUSxJQUFDLENBQUEsTUFBcEQ7U0FBZjtRQUNYLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQSxDQUFLLFFBQUwsRUFBZTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZ0JBQVA7WUFBNEIsS0FBQSxFQUFPLElBQUMsQ0FBQSxLQUFwQztZQUEyQyxNQUFBLEVBQVEsSUFBQyxDQUFBLE1BQXBEO1NBQWY7UUFFWCxJQUFDLENBQUEsSUFBSSxDQUFDLFdBQU4sQ0FBa0IsSUFBQyxDQUFBLE1BQW5CO1FBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLElBQUMsQ0FBQSxPQUFuQjtRQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixJQUFDLENBQUEsS0FBbkI7UUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLFdBQU4sQ0FBa0IsSUFBQyxDQUFBLE9BQW5CO1FBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLElBQUMsQ0FBQSxPQUFuQjtRQUVBLElBQUMsQ0FBQSxJQUFJLENBQUMsZ0JBQU4sQ0FBdUIsT0FBdkIsK0NBQWlELENBQUUsZ0JBQW5EO1FBRUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBYixDQUE0QixJQUFDLENBQUEsSUFBN0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxZQUFYLEVBQTRCLElBQUMsQ0FBQSxrQkFBN0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxVQUFYLEVBQTRCLElBQUMsQ0FBQSxnQkFBN0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxTQUFYLEVBQTRCLElBQUMsQ0FBQSxTQUE3QjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFdBQVgsRUFBNEIsSUFBQyxDQUFBLGNBQTdCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBZixDQUFrQixRQUFsQixFQUE0QixJQUFDLENBQUEsY0FBN0I7UUFFQSxJQUFDLENBQUEsTUFBRCxHQUFVLElBQUksU0FBSixDQUNOO1lBQUEsU0FBQSxFQUFZLElBQUMsQ0FBQSxNQUFELEdBQVEsQ0FBcEI7WUFDQSxVQUFBLEVBQVksQ0FEWjtZQUVBLFVBQUEsRUFBWSxDQUFBLEdBQUUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQUEsQ0FGZDtTQURNO1FBS1YsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFSLEdBQWtCLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBVCxHQUFjO1FBRS9CLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBSSxJQUFKLENBQ0o7WUFBQSxNQUFBLEVBQVMsSUFBQyxDQUFBLElBQVY7WUFDQSxPQUFBLEVBQVMsSUFBQyxDQUFBLE9BRFY7WUFFQSxNQUFBLEVBQVMsSUFBQyxDQUFBLE1BRlY7WUFHQSxNQUFBLEVBQVEsU0FIUjtTQURJO1FBTVIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsWUFBWCxFQUF5QixJQUFDLENBQUEsUUFBMUI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxRQUFYLEVBQXlCLElBQUMsQ0FBQSxRQUExQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLGFBQVgsRUFBeUIsSUFBQyxDQUFBLGFBQTFCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsYUFBWCxFQUF5QixJQUFDLENBQUEsYUFBMUI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxZQUFYLEVBQXlCLElBQUMsQ0FBQSxVQUExQjtRQUVBLElBQUMsQ0FBQSxRQUFELENBQUE7UUFDQSxJQUFDLENBQUEsU0FBRCxDQUFBO1FBQ0EsSUFBQyxDQUFBLFVBQUQsQ0FBQTtJQXZERDs7c0JBK0RILGNBQUEsR0FBZ0IsU0FBQTtBQUVaLFlBQUE7UUFBQSxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsR0FBa0IsSUFBQyxDQUFBO1FBQ25CLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBVCxHQUFpQixJQUFDLENBQUE7UUFDbEIsSUFBVSxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsR0FBb0IsQ0FBOUI7QUFBQSxtQkFBQTs7UUFDQSxHQUFBLEdBQU0sSUFBQyxDQUFBLE9BQU8sQ0FBQyxVQUFULENBQW9CLElBQXBCO1FBQ04sR0FBRyxDQUFDLFNBQUosR0FBZ0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsa0JBQWYsQ0FBa0MsV0FBbEM7QUFDaEI7QUFBQTthQUFBLHNDQUFBOztZQUNJLENBQUEsR0FBSSxDQUFDLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBSyxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQWQsQ0FBQSxHQUF5QixJQUFDLENBQUEsTUFBTSxDQUFDO1lBQ3JDLElBQUcsQ0FBQSxHQUFFLENBQUUsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQVAsR0FBWSxJQUFDLENBQUEsS0FBaEI7Z0JBQ0ksTUFBQSxHQUFTLENBQUUsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQUwsSUFBWSxJQUFDLENBQUEsVUFBYixJQUEyQjs2QkFDcEMsR0FBRyxDQUFDLFFBQUosQ0FBYSxNQUFBLEdBQU8sQ0FBQSxHQUFFLENBQUUsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQTNCLEVBQStCLENBQS9CLEVBQWtDLENBQUEsR0FBRSxDQUFDLENBQUUsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQUwsR0FBUSxDQUFFLENBQUEsQ0FBQSxDQUFHLENBQUEsQ0FBQSxDQUFkLENBQXBDLEVBQXVELElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBL0QsR0FGSjthQUFBLE1BQUE7cUNBQUE7O0FBRko7O0lBUFk7O3NCQWFoQixTQUFBLEdBQVcsU0FBQyxHQUFELEVBQXdCLEdBQXhCO0FBRVAsWUFBQTs7WUFGUSxNQUFJLElBQUMsQ0FBQSxNQUFNLENBQUM7OztZQUFXLE1BQUksSUFBQyxDQUFBLE1BQU0sQ0FBQzs7UUFFM0MsR0FBQSxHQUFNLElBQUMsQ0FBQSxLQUFLLENBQUMsVUFBUCxDQUFrQixJQUFsQjtRQUNOLENBQUEsR0FBSSxRQUFBLENBQVMsQ0FBQyxHQUFBLEdBQUksSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFiLENBQUEsR0FBd0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUF6QztRQUNKLEdBQUcsQ0FBQyxTQUFKLENBQWMsQ0FBZCxFQUFpQixDQUFqQixFQUFvQixJQUFDLENBQUEsS0FBckIsRUFBNEIsQ0FBQyxDQUFDLEdBQUEsR0FBSSxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQWIsQ0FBQSxHQUF3QixDQUFDLEdBQUEsR0FBSSxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQWIsQ0FBeEIsR0FBZ0QsQ0FBakQsQ0FBQSxHQUFvRCxJQUFDLENBQUEsTUFBTSxDQUFDLFVBQXhGO1FBQ0EsSUFBVSxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsR0FBb0IsQ0FBOUI7QUFBQSxtQkFBQTs7UUFDQSxHQUFBLEdBQU0sSUFBSSxDQUFDLEdBQUwsQ0FBUyxHQUFULEVBQWMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQUFSLENBQUEsQ0FBQSxHQUFtQixDQUFqQztRQUNOLElBQVUsR0FBQSxHQUFNLEdBQWhCO0FBQUEsbUJBQUE7O0FBQ0E7YUFBVSxvR0FBVjtZQUNJLElBQUEsR0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFmLENBQXVCLEVBQXZCO1lBQ1AsQ0FBQSxHQUFJLFFBQUEsQ0FBUyxDQUFDLEVBQUEsR0FBRyxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVosQ0FBQSxHQUF1QixJQUFDLENBQUEsTUFBTSxDQUFDLFVBQXhDOzs7QUFDSjtBQUFBO3FCQUFBLHNDQUFBOztvQkFDSSxJQUFTLENBQUEsR0FBRSxDQUFDLENBQUMsS0FBSixJQUFhLElBQUMsQ0FBQSxLQUF2QjtBQUFBLDhCQUFBOztvQkFDQSxJQUFHLGVBQUg7d0JBQ0ksR0FBRyxDQUFDLFNBQUosR0FBZ0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsa0JBQWYsQ0FBa0MsQ0FBQyxDQUFDLEtBQUYsR0FBVSxVQUE1QyxFQURwQjtxQkFBQSxNQUVLLElBQUcsY0FBSDt3QkFDRCxHQUFHLENBQUMsU0FBSixHQUFnQixJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxhQUFmLENBQTZCLENBQUMsQ0FBQyxJQUEvQixFQURmOztrQ0FFTCxHQUFHLENBQUMsUUFBSixDQUFhLElBQUMsQ0FBQSxVQUFELEdBQVksQ0FBQSxHQUFFLENBQUMsQ0FBQyxLQUE3QixFQUFvQyxDQUFwQyxFQUF1QyxDQUFBLEdBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFqRCxFQUF5RCxJQUFDLENBQUEsTUFBTSxDQUFDLFVBQWpFO0FBTko7OztBQUhKOztJQVJPOztzQkFtQlgsY0FBQSxHQUFnQixTQUFBO0FBRVosWUFBQTtRQUFBLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxHQUFrQixJQUFDLENBQUE7UUFDbkIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFULEdBQWlCLElBQUMsQ0FBQTtRQUNsQixJQUFVLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUixHQUFvQixDQUE5QjtBQUFBLG1CQUFBOztRQUNBLEdBQUEsR0FBTSxJQUFDLENBQUEsT0FBTyxDQUFDLFVBQVQsQ0FBb0IsSUFBcEI7UUFDTixHQUFHLENBQUMsU0FBSixHQUFnQixJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxrQkFBZixDQUFrQyxXQUFsQztBQUNoQjtBQUFBO2FBQUEsc0NBQUE7O1lBQ0ksQ0FBQSxHQUFJLENBQUMsQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFLLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBZCxDQUFBLEdBQXlCLElBQUMsQ0FBQSxNQUFNLENBQUM7WUFDckMsSUFBRyxDQUFBLEdBQUUsQ0FBRSxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBUCxHQUFZLElBQUMsQ0FBQSxLQUFoQjtnQkFDSSxHQUFHLENBQUMsUUFBSixDQUFhLElBQUMsQ0FBQSxVQUFELEdBQVksQ0FBQSxHQUFFLENBQUUsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQWhDLEVBQW9DLENBQXBDLEVBQXVDLENBQUEsR0FBRSxDQUFDLENBQUUsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQUwsR0FBUSxDQUFFLENBQUEsQ0FBQSxDQUFHLENBQUEsQ0FBQSxDQUFkLENBQXpDLEVBQTRELElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBcEUsRUFESjs7eUJBRUEsR0FBRyxDQUFDLFFBQUosQ0FBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLElBQUMsQ0FBQSxVQUFwQixFQUFnQyxJQUFDLENBQUEsTUFBTSxDQUFDLFVBQXhDO0FBSko7O0lBUFk7O3NCQWFoQixXQUFBLEdBQWEsU0FBQTtBQUVULFlBQUE7UUFBQSxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsR0FBa0IsSUFBQyxDQUFBO1FBQ25CLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBVCxHQUFpQixJQUFDLENBQUE7UUFDbEIsSUFBVSxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsR0FBb0IsQ0FBOUI7QUFBQSxtQkFBQTs7UUFDQSxHQUFBLEdBQU0sSUFBQyxDQUFBLE9BQU8sQ0FBQyxVQUFULENBQW9CLElBQXBCO0FBQ047QUFBQSxhQUFBLHNDQUFBOztZQUNJLENBQUEsR0FBSSxDQUFDLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBSyxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQWQsQ0FBQSxHQUF5QixJQUFDLENBQUEsTUFBTSxDQUFDO1lBQ3JDLElBQUcsQ0FBQSxHQUFFLENBQUUsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQVAsR0FBWSxJQUFDLENBQUEsS0FBaEI7Z0JBQ0ksR0FBRyxDQUFDLFNBQUosR0FBZ0I7Z0JBQ2hCLEdBQUcsQ0FBQyxRQUFKLENBQWEsSUFBQyxDQUFBLFVBQUQsR0FBWSxDQUFBLEdBQUUsQ0FBRSxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBaEMsRUFBb0MsQ0FBcEMsRUFBdUMsQ0FBdkMsRUFBMEMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFsRCxFQUZKOztZQUdBLEdBQUcsQ0FBQyxTQUFKLEdBQWdCO1lBQ2hCLEdBQUcsQ0FBQyxRQUFKLENBQWEsSUFBQyxDQUFBLFVBQUQsR0FBWSxDQUF6QixFQUE0QixDQUE1QixFQUErQixJQUFDLENBQUEsVUFBRCxHQUFZLENBQTNDLEVBQThDLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBdEQ7QUFOSjtlQU9BLElBQUMsQ0FBQSxjQUFELENBQUE7SUFiUzs7c0JBZWIsY0FBQSxHQUFnQixTQUFDLEtBQUQ7QUFFWixZQUFBO1FBQUEsR0FBQSxHQUFNLElBQUMsQ0FBQSxPQUFPLENBQUMsVUFBVCxDQUFvQixJQUFwQjtRQUNOLEdBQUcsQ0FBQyxTQUFKLEdBQWdCLEtBQUEsSUFBVSxNQUFWLElBQW9CO1FBQ3BDLEVBQUEsR0FBSyxJQUFDLENBQUEsTUFBTSxDQUFDLFVBQVIsQ0FBQTtRQUNMLENBQUEsR0FBSSxDQUFDLEVBQUcsQ0FBQSxDQUFBLENBQUgsR0FBTSxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQWYsQ0FBQSxHQUEwQixJQUFDLENBQUEsTUFBTSxDQUFDO1FBQ3RDLElBQUcsQ0FBQSxHQUFFLEVBQUcsQ0FBQSxDQUFBLENBQUwsR0FBVSxJQUFDLENBQUEsS0FBZDtZQUNJLEdBQUcsQ0FBQyxRQUFKLENBQWEsSUFBQyxDQUFBLFVBQUQsR0FBWSxDQUFBLEdBQUUsRUFBRyxDQUFBLENBQUEsQ0FBOUIsRUFBa0MsQ0FBbEMsRUFBcUMsQ0FBckMsRUFBd0MsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFoRCxFQURKOztlQUVBLEdBQUcsQ0FBQyxRQUFKLENBQWEsSUFBQyxDQUFBLFVBQUQsR0FBWSxDQUF6QixFQUE0QixDQUE1QixFQUErQixJQUFDLENBQUEsVUFBRCxHQUFZLENBQTNDLEVBQThDLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBdEQ7SUFSWTs7c0JBVWhCLFVBQUEsR0FBWSxTQUFBO0FBRVIsWUFBQTtRQUFBLElBQVUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFSLEdBQW9CLENBQTlCO0FBQUEsbUJBQUE7O1FBRUEsRUFBQSxHQUFLLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixHQUFtQjtRQUN4QixFQUFBLEdBQUssQ0FBQyxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFmLEdBQW1CLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQWxDLEdBQXNDLENBQXZDLENBQUEsR0FBMEM7UUFDL0MsRUFBQSxHQUFLO1FBQ0wsSUFBRyxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFsQjtZQUNJLEVBQUEsR0FBSyxDQUFDLElBQUksQ0FBQyxHQUFMLENBQVMsR0FBQSxHQUFJLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBckIsRUFBaUMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQUFSLEdBQWlCLENBQWxELENBQUEsR0FBcUQsRUFBdEQsQ0FBQSxHQUE0RCxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUEzRSxHQUFvRixJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUQ1Rzs7UUFFQSxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFkLEdBQTBCLEVBQUQsR0FBSTtlQUM3QixJQUFDLENBQUEsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFkLEdBQTBCLEVBQUQsR0FBSTtJQVZyQjs7c0JBa0JaLFVBQUEsR0FBYyxTQUFDLEVBQUQ7ZUFBUSxJQUFDLENBQUEsU0FBRCxDQUFXLEVBQVgsRUFBZSxFQUFmO0lBQVI7O3NCQUNkLGFBQUEsR0FBZSxTQUFDLENBQUQ7ZUFBTyxJQUFDLENBQUEsU0FBRCxDQUFXLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBbkIsRUFBOEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUF0QztJQUFQOztzQkFFZixhQUFBLEdBQWUsU0FBQyxDQUFEO1FBQ1gsSUFBRyxhQUFIO21CQUNJLElBQUMsQ0FBQSxTQUFELENBQVcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFuQixFQUE4QixJQUFDLENBQUEsTUFBTSxDQUFDLFNBQXRDLEVBREo7U0FBQSxNQUFBO21CQUdJLElBQUMsQ0FBQSxVQUFELENBQVksSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFwQixFQUErQixJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsR0FBa0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQUF6RCxFQUhKOztJQURXOztzQkFZZixTQUFBLEdBQVcsU0FBQyxVQUFEO0FBRVAsWUFBQTtRQUFBLElBQXFCLFVBQVUsQ0FBQyxPQUFoQztZQUFBLElBQUMsQ0FBQSxjQUFELENBQUEsRUFBQTs7UUFDQSxJQUFxQixVQUFVLENBQUMsT0FBaEM7WUFBQSxJQUFDLENBQUEsV0FBRCxDQUFBLEVBQUE7O1FBRUEsSUFBVSxDQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsTUFBakM7QUFBQSxtQkFBQTs7UUFFQSxJQUFDLENBQUEsTUFBTSxDQUFDLFdBQVIsQ0FBb0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQUFSLENBQUEsQ0FBcEI7QUFFQTtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksRUFBQSxHQUFLLE1BQU0sQ0FBQztZQUNaLFlBQVMsQ0FBSSxNQUFNLENBQUMsT0FBWCxLQUFzQixTQUF0QixJQUFBLElBQUEsS0FBaUMsVUFBMUM7QUFBQSxzQkFBQTs7WUFDQSxJQUFDLENBQUEsU0FBRCxDQUFXLEVBQVgsRUFBZSxFQUFmO0FBSEo7UUFLQSxJQUFHLEVBQUEsSUFBTSxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQWpCO21CQUNJLElBQUMsQ0FBQSxTQUFELENBQVcsRUFBWCxFQUFlLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBdkIsRUFESjs7SUFkTzs7c0JBdUJYLE1BQUEsR0FBUSxTQUFDLElBQUQsRUFBTyxLQUFQO0FBRUosWUFBQTtRQUFBLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLEdBQXFCLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBaEM7WUFDSSxFQUFBLEdBQUssSUFBQyxDQUFBLElBQUksQ0FBQyxxQkFBTixDQUFBO1lBQ0wsRUFBQSxHQUFLLEtBQUssQ0FBQyxPQUFOLEdBQWdCLEVBQUUsQ0FBQztZQUN4QixFQUFBLEdBQUssQ0FBQSxHQUFFLEVBQUYsR0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDO1lBQ3BCLEVBQUEsR0FBSyxRQUFBLENBQVMsRUFBQSxHQUFLLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQTdCO21CQUNMLElBQUMsQ0FBQSxVQUFELENBQVksRUFBWixFQUFnQixLQUFoQixFQUxKO1NBQUEsTUFBQTttQkFPSSxJQUFDLENBQUEsVUFBRCxDQUFZLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixLQUFuQixDQUFaLEVBQXVDLEtBQXZDLEVBUEo7O0lBRkk7O3NCQVdSLE9BQUEsR0FBUyxTQUFDLElBQUQsRUFBTSxLQUFOO2VBQWdCLElBQUMsQ0FBQSxVQUFELENBQVksSUFBQyxDQUFBLGlCQUFELENBQW1CLEtBQW5CLENBQVosRUFBdUMsS0FBdkM7SUFBaEI7O3NCQUVULFVBQUEsR0FBWSxTQUFDLEVBQUQsRUFBSyxLQUFMO1FBRVIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBZixDQUFrQixDQUFDLEVBQUEsR0FBRyxDQUFKLENBQUEsR0FBUyxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUExQztRQUVBLElBQUcsQ0FBSSxLQUFLLENBQUMsT0FBYjtZQUNJLElBQUMsQ0FBQSxNQUFNLENBQUMsaUJBQVIsQ0FBMEIsQ0FBQyxDQUFELEVBQUksRUFBQSxHQUFHLENBQVAsQ0FBMUIsRUFBcUM7Z0JBQUEsTUFBQSxFQUFPLEtBQUssQ0FBQyxRQUFiO2FBQXJDLEVBREo7O1FBR0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQUE7ZUFDQSxJQUFDLENBQUEsY0FBRCxDQUFBO0lBUlE7O3NCQVVaLGlCQUFBLEdBQW1CLFNBQUMsS0FBRDtBQUVmLFlBQUE7UUFBQSxFQUFBLEdBQUssSUFBQyxDQUFBLElBQUksQ0FBQztRQUNYLEVBQUEsR0FBSyxJQUFDLENBQUEsSUFBSSxDQUFDLHFCQUFOLENBQUE7UUFDTCxFQUFBLEdBQUssS0FBQSxDQUFNLENBQU4sRUFBUyxJQUFDLENBQUEsSUFBSSxDQUFDLFlBQWYsRUFBNkIsS0FBSyxDQUFDLE9BQU4sR0FBZ0IsRUFBRSxDQUFDLEdBQWhEO1FBQ0wsRUFBQSxHQUFLLFFBQUEsQ0FBUyxJQUFJLENBQUMsS0FBTCxDQUFXLENBQUEsR0FBRSxFQUFGLEdBQUssSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUF4QixDQUFULENBQUEsR0FBZ0QsSUFBQyxDQUFBLE1BQU0sQ0FBQztRQUM3RCxFQUFBLEdBQUssUUFBQSxDQUFTLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQUFSLEdBQWlCLENBQTFCLEVBQTZCLEVBQTdCLENBQVQ7ZUFDTDtJQVBlOztzQkFlbkIsZ0JBQUEsR0FBa0IsU0FBQyxDQUFEO1FBRWQsSUFBNEMsQ0FBQSxJQUFNLElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBUCxJQUFpQixJQUFDLENBQUEsTUFBTSxDQUFDLFVBQTNFO1lBQUEsSUFBQyxDQUFBLGtCQUFELENBQW9CLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixDQUFBLENBQXBCLEVBQUE7O2VBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFSLENBQW9CLENBQXBCO0lBSGM7O3NCQUtsQixrQkFBQSxHQUFvQixTQUFDLENBQUQ7UUFFaEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQUFSLENBQXNCLENBQUEsR0FBRSxJQUFDLENBQUEsTUFBTSxDQUFDLFVBQVIsQ0FBQSxDQUF4QjtRQUNBLElBQUMsQ0FBQSxRQUFELENBQUE7ZUFDQSxJQUFDLENBQUEsY0FBRCxDQUFBO0lBSmdCOztzQkFZcEIsY0FBQSxHQUFnQixTQUFBO0FBRVosWUFBQTtRQUFBLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLEdBQXFCLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBaEM7WUFDSSxFQUFBLEdBQUssSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBZixHQUF3QixJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUM1QyxFQUFBLEdBQUssUUFBQSxDQUFTLEVBQUEsR0FBSyxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQXRCO1lBQ0wsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsRUFBWCxFQUhKOztlQUlBLElBQUMsQ0FBQSxVQUFELENBQUE7SUFOWTs7c0JBUWhCLFFBQUEsR0FBVSxTQUFBO0FBRU4sWUFBQTtRQUFBLENBQUEsR0FBSSxRQUFBLENBQVMsQ0FBQyxJQUFDLENBQUEsTUFBRixHQUFTLENBQVQsR0FBVyxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsR0FBa0IsQ0FBdEM7UUFDSixDQUFBLEdBQUksUUFBQSxDQUFTLElBQUMsQ0FBQSxLQUFELEdBQU8sQ0FBaEI7UUFDSixDQUFBLEdBQUksY0FBQSxHQUFlLENBQWYsR0FBaUIsTUFBakIsR0FBdUIsQ0FBdkIsR0FBeUI7UUFFN0IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBZixHQUEyQjtRQUMzQixJQUFDLENBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFmLEdBQTJCO1FBQzNCLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQWYsR0FBMkI7ZUFDM0IsSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFLLENBQUMsU0FBYixHQUEyQjtJQVRyQjs7c0JBaUJWLFVBQUEsR0FBWSxTQUFDLEdBQUQsRUFBTSxHQUFOO0FBRVIsWUFBQTtRQUFBLEdBQUEsR0FBTSxJQUFDLENBQUEsS0FBSyxDQUFDLFVBQVAsQ0FBa0IsSUFBbEI7ZUFDTixHQUFHLENBQUMsU0FBSixDQUFjLENBQWQsRUFBaUIsQ0FBQyxHQUFBLEdBQUksSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFiLENBQUEsR0FBd0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFqRCxFQUE2RCxDQUFBLEdBQUUsSUFBQyxDQUFBLEtBQWhFLEVBQXVFLENBQUMsR0FBQSxHQUFJLEdBQUwsQ0FBQSxHQUFVLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBekY7SUFIUTs7c0JBS1osUUFBQSxHQUFVLFNBQUE7UUFFTixJQUFDLENBQUEsT0FBTyxDQUFDLEtBQVQsR0FBaUIsSUFBQyxDQUFBLE9BQU8sQ0FBQztRQUMxQixJQUFDLENBQUEsT0FBTyxDQUFDLEtBQVQsR0FBaUIsSUFBQyxDQUFBLE9BQU8sQ0FBQztRQUMxQixJQUFDLENBQUEsT0FBTyxDQUFDLEtBQVQsR0FBaUIsSUFBQyxDQUFBLE9BQU8sQ0FBQztRQUMxQixJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsR0FBaUIsSUFBQyxDQUFBLE1BQU0sQ0FBQztRQUN6QixJQUFDLENBQUEsS0FBSyxDQUFDLEtBQVAsR0FBaUIsSUFBQyxDQUFBLEtBQUssQ0FBQztlQUN4QixJQUFDLENBQUEsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFkLEdBQXVCO0lBUGpCOzs7Ozs7QUFTZCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAwIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4jIyNcblxueyBnZXRTdHlsZSwgY2xhbXAsIGVsZW0sIGRyYWcsIGtsb2cgfSA9IHJlcXVpcmUgJ2t4aycgXG5cbk1hcFNjcm9sbCA9IHJlcXVpcmUgJy4vbWFwc2Nyb2xsJ1xuXG5jbGFzcyBNaW5pbWFwXG5cbiAgICBAOiAoQGVkaXRvcikgLT5cblxuICAgICAgICBtaW5pbWFwV2lkdGggPSBwYXJzZUludCBnZXRTdHlsZSgnLm1pbmltYXAnICd3aWR0aCcpID8gMTMwXG5cbiAgICAgICAga2xvZyAnbWluaW1hcFdpZHRoJyBtaW5pbWFwV2lkdGhcbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IubGF5ZXJTY3JvbGwuc3R5bGUucmlnaHQgPSBcIiN7bWluaW1hcFdpZHRofXB4XCJcblxuICAgICAgICBAd2lkdGggPSAyKm1pbmltYXBXaWR0aFxuICAgICAgICBAaGVpZ2h0ID0gODE5MlxuICAgICAgICBAb2Zmc2V0TGVmdCA9IDZcblxuICAgICAgICBAZWxlbSAgICA9IGVsZW0gY2xhc3M6ICdtaW5pbWFwJ1xuICAgICAgICBAdG9wYm90ICA9IGVsZW0gY2xhc3M6ICd0b3Bib3QnXG4gICAgICAgIEBzZWxlY3RpID0gZWxlbSAnY2FudmFzJywgY2xhc3M6ICdtaW5pbWFwU2VsZWN0aW9ucycsIHdpZHRoOiBAd2lkdGgsIGhlaWdodDogQGhlaWdodFxuICAgICAgICBAbGluZXMgICA9IGVsZW0gJ2NhbnZhcycsIGNsYXNzOiAnbWluaW1hcExpbmVzJywgICAgICB3aWR0aDogQHdpZHRoLCBoZWlnaHQ6IEBoZWlnaHRcbiAgICAgICAgQGhpZ2hsaWcgPSBlbGVtICdjYW52YXMnLCBjbGFzczogJ21pbmltYXBIaWdobGlnaHRzJywgd2lkdGg6IEB3aWR0aCwgaGVpZ2h0OiBAaGVpZ2h0XG4gICAgICAgIEBjdXJzb3JzID0gZWxlbSAnY2FudmFzJywgY2xhc3M6ICdtaW5pbWFwQ3Vyc29ycycsICAgIHdpZHRoOiBAd2lkdGgsIGhlaWdodDogQGhlaWdodFxuXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEB0b3Bib3RcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQHNlbGVjdGlcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQGxpbmVzXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBoaWdobGlnXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBjdXJzb3JzXG5cbiAgICAgICAgQGVsZW0uYWRkRXZlbnRMaXN0ZW5lciAnd2hlZWwnLCBAZWRpdG9yLnNjcm9sbGJhcj8ub25XaGVlbFxuXG4gICAgICAgIEBlZGl0b3Iudmlldy5hcHBlbmRDaGlsZCAgICBAZWxlbVxuICAgICAgICBAZWRpdG9yLm9uICd2aWV3SGVpZ2h0JyAgICAgQG9uRWRpdG9yVmlld0hlaWdodFxuICAgICAgICBAZWRpdG9yLm9uICdudW1MaW5lcycgICAgICAgQG9uRWRpdG9yTnVtTGluZXNcbiAgICAgICAgQGVkaXRvci5vbiAnY2hhbmdlZCcgICAgICAgIEBvbkNoYW5nZWRcbiAgICAgICAgQGVkaXRvci5vbiAnaGlnaGxpZ2h0JyAgICAgIEBkcmF3SGlnaGxpZ2h0c1xuICAgICAgICBAZWRpdG9yLnNjcm9sbC5vbiAnc2Nyb2xsJyAgQG9uRWRpdG9yU2Nyb2xsXG5cbiAgICAgICAgQHNjcm9sbCA9IG5ldyBNYXBTY3JvbGxcbiAgICAgICAgICAgIGV4cG9zZU1heDogIEBoZWlnaHQvNFxuICAgICAgICAgICAgbGluZUhlaWdodDogNFxuICAgICAgICAgICAgdmlld0hlaWdodDogMipAZWRpdG9yLnZpZXdIZWlnaHQoKVxuXG4gICAgICAgIEBzY3JvbGwubmFtZSA9IFwiI3tAZWRpdG9yLm5hbWV9Lm1pbmltYXBcIlxuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBlbGVtXG4gICAgICAgICAgICBvblN0YXJ0OiBAb25TdGFydFxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uRHJhZ1xuICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcidcblxuICAgICAgICBAc2Nyb2xsLm9uICdjbGVhckxpbmVzJyAgQGNsZWFyQWxsXG4gICAgICAgIEBzY3JvbGwub24gJ3Njcm9sbCcgICAgICBAb25TY3JvbGxcbiAgICAgICAgQHNjcm9sbC5vbiAnZXhwb3NlTGluZXMnIEBvbkV4cG9zZUxpbmVzXG4gICAgICAgIEBzY3JvbGwub24gJ3ZhbmlzaExpbmVzJyBAb25WYW5pc2hMaW5lc1xuICAgICAgICBAc2Nyb2xsLm9uICdleHBvc2VMaW5lJyAgQGV4cG9zZUxpbmVcblxuICAgICAgICBAb25TY3JvbGwoKVxuICAgICAgICBAZHJhd0xpbmVzKClcbiAgICAgICAgQGRyYXdUb3BCb3QoKVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwICAgICAwMFxuXG4gICAgZHJhd1NlbGVjdGlvbnM6ID0+XG5cbiAgICAgICAgQHNlbGVjdGkuaGVpZ2h0ID0gQGhlaWdodFxuICAgICAgICBAc2VsZWN0aS53aWR0aCA9IEB3aWR0aFxuICAgICAgICByZXR1cm4gaWYgQHNjcm9sbC5leHBvc2VCb3QgPCAwXG4gICAgICAgIGN0eCA9IEBzZWxlY3RpLmdldENvbnRleHQgJzJkJ1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gQGVkaXRvci5zeW50YXguY29sb3JGb3JDbGFzc25hbWVzICdzZWxlY3Rpb24nXG4gICAgICAgIGZvciByIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIEBzY3JvbGwuZXhwb3NlVG9wLCBAc2Nyb2xsLmV4cG9zZUJvdCwgQGVkaXRvci5zZWxlY3Rpb25zKClcbiAgICAgICAgICAgIHkgPSAoclswXS1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgICAgICBpZiAyKnJbMV1bMF0gPCBAd2lkdGhcbiAgICAgICAgICAgICAgICBvZmZzZXQgPSByWzFdWzBdIGFuZCBAb2Zmc2V0TGVmdCBvciAwXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0IG9mZnNldCsyKnJbMV1bMF0sIHksIDIqKHJbMV1bMV0tclsxXVswXSksIEBzY3JvbGwubGluZUhlaWdodFxuXG4gICAgZHJhd0xpbmVzOiAodG9wPUBzY3JvbGwuZXhwb3NlVG9wLCBib3Q9QHNjcm9sbC5leHBvc2VCb3QpID0+XG5cbiAgICAgICAgY3R4ID0gQGxpbmVzLmdldENvbnRleHQgJzJkJ1xuICAgICAgICB5ID0gcGFyc2VJbnQoKHRvcC1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0KVxuICAgICAgICBjdHguY2xlYXJSZWN0IDAsIHksIEB3aWR0aCwgKChib3QtQHNjcm9sbC5leHBvc2VUb3ApLSh0b3AtQHNjcm9sbC5leHBvc2VUb3ApKzEpKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICByZXR1cm4gaWYgQHNjcm9sbC5leHBvc2VCb3QgPCAwXG4gICAgICAgIGJvdCA9IE1hdGgubWluIGJvdCwgQGVkaXRvci5udW1MaW5lcygpLTFcbiAgICAgICAgcmV0dXJuIGlmIGJvdCA8IHRvcFxuICAgICAgICBmb3IgbGkgaW4gW3RvcC4uYm90XVxuICAgICAgICAgICAgZGlzcyA9IEBlZGl0b3Iuc3ludGF4LmdldERpc3MgbGlcbiAgICAgICAgICAgIHkgPSBwYXJzZUludCgobGktQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodClcbiAgICAgICAgICAgIGZvciByIGluIGRpc3MgPyBbXVxuICAgICAgICAgICAgICAgIGJyZWFrIGlmIDIqci5zdGFydCA+PSBAd2lkdGhcbiAgICAgICAgICAgICAgICBpZiByLnZhbHVlP1xuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gQGVkaXRvci5zeW50YXguY29sb3JGb3JDbGFzc25hbWVzIHIudmFsdWUgKyBcIiBtaW5pbWFwXCJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIHIuc3R5bD9cbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IEBlZGl0b3Iuc3ludGF4LmNvbG9yRm9yU3R5bGUgci5zdHlsXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0IEBvZmZzZXRMZWZ0KzIqci5zdGFydCwgeSwgMipyLm1hdGNoLmxlbmd0aCwgQHNjcm9sbC5saW5lSGVpZ2h0XG5cbiAgICBkcmF3SGlnaGxpZ2h0czogPT5cblxuICAgICAgICBAaGlnaGxpZy5oZWlnaHQgPSBAaGVpZ2h0XG4gICAgICAgIEBoaWdobGlnLndpZHRoID0gQHdpZHRoXG4gICAgICAgIHJldHVybiBpZiBAc2Nyb2xsLmV4cG9zZUJvdCA8IDBcbiAgICAgICAgY3R4ID0gQGhpZ2hsaWcuZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBAZWRpdG9yLnN5bnRheC5jb2xvckZvckNsYXNzbmFtZXMgJ2hpZ2hsaWdodCdcbiAgICAgICAgZm9yIHIgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgQHNjcm9sbC5leHBvc2VUb3AsIEBzY3JvbGwuZXhwb3NlQm90LCBAZWRpdG9yLmhpZ2hsaWdodHMoKVxuICAgICAgICAgICAgeSA9IChyWzBdLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgICAgIGlmIDIqclsxXVswXSA8IEB3aWR0aFxuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCBAb2Zmc2V0TGVmdCsyKnJbMV1bMF0sIHksIDIqKHJbMV1bMV0tclsxXVswXSksIEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgY3R4LmZpbGxSZWN0IDAsIHksIEBvZmZzZXRMZWZ0LCBAc2Nyb2xsLmxpbmVIZWlnaHRcblxuICAgIGRyYXdDdXJzb3JzOiA9PlxuXG4gICAgICAgIEBjdXJzb3JzLmhlaWdodCA9IEBoZWlnaHRcbiAgICAgICAgQGN1cnNvcnMud2lkdGggPSBAd2lkdGhcbiAgICAgICAgcmV0dXJuIGlmIEBzY3JvbGwuZXhwb3NlQm90IDwgMFxuICAgICAgICBjdHggPSBAY3Vyc29ycy5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgZm9yIHIgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgQHNjcm9sbC5leHBvc2VUb3AsIEBzY3JvbGwuZXhwb3NlQm90LCByYW5nZXNGcm9tUG9zaXRpb25zIEBlZGl0b3IuY3Vyc29ycygpXG4gICAgICAgICAgICB5ID0gKHJbMF0tQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgaWYgMipyWzFdWzBdIDwgQHdpZHRoXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICcjZjgwJ1xuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCBAb2Zmc2V0TGVmdCsyKnJbMV1bMF0sIHksIDIsIEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICdyZ2JhKDI1NSwxMjgsMCwwLjUpJ1xuICAgICAgICAgICAgY3R4LmZpbGxSZWN0IEBvZmZzZXRMZWZ0LTQsIHksIEBvZmZzZXRMZWZ0LTIsIEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICBAZHJhd01haW5DdXJzb3IoKVxuXG4gICAgZHJhd01haW5DdXJzb3I6IChibGluaykgPT5cblxuICAgICAgICBjdHggPSBAY3Vyc29ycy5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGJsaW5rIGFuZCAnIzAwMCcgb3IgJyNmZjAnXG4gICAgICAgIG1jID0gQGVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgeSA9IChtY1sxXS1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgIGlmIDIqbWNbMF0gPCBAd2lkdGhcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdCBAb2Zmc2V0TGVmdCsyKm1jWzBdLCB5LCAyLCBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgY3R4LmZpbGxSZWN0IEBvZmZzZXRMZWZ0LTQsIHksIEBvZmZzZXRMZWZ0LTIsIEBzY3JvbGwubGluZUhlaWdodFxuXG4gICAgZHJhd1RvcEJvdDogPT5cblxuICAgICAgICByZXR1cm4gaWYgQHNjcm9sbC5leHBvc2VCb3QgPCAwXG5cbiAgICAgICAgbGggPSBAc2Nyb2xsLmxpbmVIZWlnaHQvMlxuICAgICAgICB0aCA9IChAZWRpdG9yLnNjcm9sbC5ib3QtQGVkaXRvci5zY3JvbGwudG9wKzEpKmxoXG4gICAgICAgIHR5ID0gMFxuICAgICAgICBpZiBAZWRpdG9yLnNjcm9sbC5zY3JvbGxNYXhcbiAgICAgICAgICAgIHR5ID0gKE1hdGgubWluKDAuNSpAc2Nyb2xsLnZpZXdIZWlnaHQsIEBzY3JvbGwubnVtTGluZXMqMiktdGgpICogQGVkaXRvci5zY3JvbGwuc2Nyb2xsIC8gQGVkaXRvci5zY3JvbGwuc2Nyb2xsTWF4XG4gICAgICAgIEB0b3Bib3Quc3R5bGUuaGVpZ2h0ID0gXCIje3RofXB4XCJcbiAgICAgICAgQHRvcGJvdC5zdHlsZS50b3AgICAgPSBcIiN7dHl9cHhcIlxuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgZXhwb3NlTGluZTogICAobGkpID0+IEBkcmF3TGluZXMgbGksIGxpXG4gICAgb25FeHBvc2VMaW5lczogKGUpID0+IEBkcmF3TGluZXMgQHNjcm9sbC5leHBvc2VUb3AsIEBzY3JvbGwuZXhwb3NlQm90XG5cbiAgICBvblZhbmlzaExpbmVzOiAoZSkgPT5cbiAgICAgICAgaWYgZS50b3A/XG4gICAgICAgICAgICBAZHJhd0xpbmVzIEBzY3JvbGwuZXhwb3NlVG9wLCBAc2Nyb2xsLmV4cG9zZUJvdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAY2xlYXJSYW5nZSBAc2Nyb2xsLmV4cG9zZUJvdCwgQHNjcm9sbC5leHBvc2VCb3QrQHNjcm9sbC5udW1MaW5lc1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICBvbkNoYW5nZWQ6IChjaGFuZ2VJbmZvKSA9PlxuXG4gICAgICAgIEBkcmF3U2VsZWN0aW9ucygpIGlmIGNoYW5nZUluZm8uc2VsZWN0c1xuICAgICAgICBAZHJhd0N1cnNvcnMoKSAgICBpZiBjaGFuZ2VJbmZvLmN1cnNvcnNcblxuICAgICAgICByZXR1cm4gaWYgbm90IGNoYW5nZUluZm8uY2hhbmdlcy5sZW5ndGhcblxuICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIEBlZGl0b3IubnVtTGluZXMoKVxuXG4gICAgICAgIGZvciBjaGFuZ2UgaW4gY2hhbmdlSW5mby5jaGFuZ2VzXG4gICAgICAgICAgICBsaSA9IGNoYW5nZS5vbGRJbmRleFxuICAgICAgICAgICAgYnJlYWsgaWYgbm90IGNoYW5nZS5jaGFuZ2UgaW4gWydkZWxldGVkJywgJ2luc2VydGVkJ11cbiAgICAgICAgICAgIEBkcmF3TGluZXMgbGksIGxpXG5cbiAgICAgICAgaWYgbGkgPD0gQHNjcm9sbC5leHBvc2VCb3RcbiAgICAgICAgICAgIEBkcmF3TGluZXMgbGksIEBzY3JvbGwuZXhwb3NlQm90XG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgb25EcmFnOiAoZHJhZywgZXZlbnQpID0+XG5cbiAgICAgICAgaWYgQHNjcm9sbC5mdWxsSGVpZ2h0ID4gQHNjcm9sbC52aWV3SGVpZ2h0XG4gICAgICAgICAgICBiciA9IEBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICByeSA9IGV2ZW50LmNsaWVudFkgLSBici50b3BcbiAgICAgICAgICAgIHBjID0gMipyeSAvIEBzY3JvbGwudmlld0hlaWdodFxuICAgICAgICAgICAgbGkgPSBwYXJzZUludCBwYyAqIEBlZGl0b3Iuc2Nyb2xsLm51bUxpbmVzXG4gICAgICAgICAgICBAanVtcFRvTGluZSBsaSwgZXZlbnRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGp1bXBUb0xpbmUgQGxpbmVJbmRleEZvckV2ZW50KGV2ZW50KSwgZXZlbnRcblxuICAgIG9uU3RhcnQ6IChkcmFnLGV2ZW50KSA9PiBAanVtcFRvTGluZSBAbGluZUluZGV4Rm9yRXZlbnQoZXZlbnQpLCBldmVudFxuXG4gICAganVtcFRvTGluZTogKGxpLCBldmVudCkgLT5cblxuICAgICAgICBAZWRpdG9yLnNjcm9sbC50byAobGktNSkgKiBAZWRpdG9yLnNjcm9sbC5saW5lSGVpZ2h0XG5cbiAgICAgICAgaWYgbm90IGV2ZW50Lm1ldGFLZXlcbiAgICAgICAgICAgIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRQb3MgWzAsIGxpKzVdLCBleHRlbmQ6ZXZlbnQuc2hpZnRLZXlcblxuICAgICAgICBAZWRpdG9yLmZvY3VzKClcbiAgICAgICAgQG9uRWRpdG9yU2Nyb2xsKClcblxuICAgIGxpbmVJbmRleEZvckV2ZW50OiAoZXZlbnQpIC0+XG5cbiAgICAgICAgc3QgPSBAZWxlbS5zY3JvbGxUb3BcbiAgICAgICAgYnIgPSBAZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICBseSA9IGNsYW1wIDAsIEBlbGVtLm9mZnNldEhlaWdodCwgZXZlbnQuY2xpZW50WSAtIGJyLnRvcFxuICAgICAgICBweSA9IHBhcnNlSW50KE1hdGguZmxvb3IoMipseS9Ac2Nyb2xsLmxpbmVIZWlnaHQpKSArIEBzY3JvbGwudG9wXG4gICAgICAgIGxpID0gcGFyc2VJbnQgTWF0aC5taW4oQHNjcm9sbC5udW1MaW5lcy0xLCBweSlcbiAgICAgICAgbGlcblxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG4gICAgb25FZGl0b3JOdW1MaW5lczogKG4pID0+XG5cbiAgICAgICAgQG9uRWRpdG9yVmlld0hlaWdodCBAZWRpdG9yLnZpZXdIZWlnaHQoKSBpZiBuIGFuZCBAbGluZXMuaGVpZ2h0IDw9IEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIG5cblxuICAgIG9uRWRpdG9yVmlld0hlaWdodDogKGgpID0+XG5cbiAgICAgICAgQHNjcm9sbC5zZXRWaWV3SGVpZ2h0IDIqQGVkaXRvci52aWV3SGVpZ2h0KClcbiAgICAgICAgQG9uU2Nyb2xsKClcbiAgICAgICAgQG9uRWRpdG9yU2Nyb2xsKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBvbkVkaXRvclNjcm9sbDogPT5cblxuICAgICAgICBpZiBAc2Nyb2xsLmZ1bGxIZWlnaHQgPiBAc2Nyb2xsLnZpZXdIZWlnaHRcbiAgICAgICAgICAgIHBjID0gQGVkaXRvci5zY3JvbGwuc2Nyb2xsIC8gQGVkaXRvci5zY3JvbGwuc2Nyb2xsTWF4XG4gICAgICAgICAgICB0cCA9IHBhcnNlSW50IHBjICogQHNjcm9sbC5zY3JvbGxNYXhcbiAgICAgICAgICAgIEBzY3JvbGwudG8gdHBcbiAgICAgICAgQGRyYXdUb3BCb3QoKVxuXG4gICAgb25TY3JvbGw6ID0+XG5cbiAgICAgICAgeSA9IHBhcnNlSW50IC1AaGVpZ2h0LzQtQHNjcm9sbC5vZmZzZXRUb3AvMlxuICAgICAgICB4ID0gcGFyc2VJbnQgQHdpZHRoLzRcbiAgICAgICAgdCA9IFwidHJhbnNsYXRlM2QoI3t4fXB4LCAje3l9cHgsIDBweCkgc2NhbGUzZCgwLjUsIDAuNSwgMSlcIlxuXG4gICAgICAgIEBzZWxlY3RpLnN0eWxlLnRyYW5zZm9ybSA9IHRcbiAgICAgICAgQGhpZ2hsaWcuc3R5bGUudHJhbnNmb3JtID0gdFxuICAgICAgICBAY3Vyc29ycy5zdHlsZS50cmFuc2Zvcm0gPSB0XG4gICAgICAgIEBsaW5lcy5zdHlsZS50cmFuc2Zvcm0gICA9IHRcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2xlYXJSYW5nZTogKHRvcCwgYm90KSAtPlxuXG4gICAgICAgIGN0eCA9IEBsaW5lcy5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgY3R4LmNsZWFyUmVjdCAwLCAodG9wLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHQsIDIqQHdpZHRoLCAoYm90LXRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0XG5cbiAgICBjbGVhckFsbDogPT5cblxuICAgICAgICBAc2VsZWN0aS53aWR0aCA9IEBzZWxlY3RpLndpZHRoXG4gICAgICAgIEBoaWdobGlnLndpZHRoID0gQGhpZ2hsaWcud2lkdGhcbiAgICAgICAgQGN1cnNvcnMud2lkdGggPSBAY3Vyc29ycy53aWR0aFxuICAgICAgICBAdG9wYm90LndpZHRoICA9IEB0b3Bib3Qud2lkdGhcbiAgICAgICAgQGxpbmVzLndpZHRoICAgPSBAbGluZXMud2lkdGhcbiAgICAgICAgQHRvcGJvdC5zdHlsZS5oZWlnaHQgPSAnMCdcblxubW9kdWxlLmV4cG9ydHMgPSBNaW5pbWFwXG4iXX0=
//# sourceURL=../../coffee/editor/minimap.coffee