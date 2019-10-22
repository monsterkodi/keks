// koffee 1.4.0

/*
0000000    000   000  00000000  00000000  00000000  00000000
000   000  000   000  000       000       000       000   000
0000000    000   000  000000    000000    0000000   0000000
000   000  000   000  000       000       000       000   000
0000000     0000000   000       000       00000000  000   000
 */
var Buffer, State, _, clamp, empty, endOf, event, fuzzy, kerror, matchr, ref, startOf,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), clamp = ref.clamp, empty = ref.empty, kerror = ref.kerror, _ = ref._;

matchr = require('../tools/matchr');

State = require('./state');

fuzzy = require('fuzzy');

event = require('events');

startOf = function(r) {
    return r[0];
};

endOf = function(r) {
    return r[0] + Math.max(1, r[1] - r[0]);
};

Buffer = (function(superClass) {
    extend1(Buffer, superClass);

    function Buffer() {
        this.startOfWordAtPos = bind(this.startOfWordAtPos, this);
        this.endOfWordAtPos = bind(this.endOfWordAtPos, this);
        this.lines = bind(this.lines, this);
        this.line = bind(this.line, this);
        Buffer.__super__.constructor.call(this);
        this.newlineCharacters = '\n';
        this.wordRegExp = new RegExp("(\\s+|\\w+|[^\\s])", 'g');
        this.realWordRegExp = new RegExp("(\\w+)", 'g');
        this.setState(new State());
    }

    Buffer.prototype.setLines = function(lines) {
        this.emit('numLines', 0);
        this.setState(new State({
            lines: lines
        }));
        return this.emit('numLines', this.numLines());
    };

    Buffer.prototype.setState = function(state) {
        return this.state = new State(state.s);
    };

    Buffer.prototype.mainCursor = function() {
        return this.state.mainCursor();
    };

    Buffer.prototype.line = function(i) {
        return this.state.line(i);
    };

    Buffer.prototype.tabline = function(i) {
        return this.state.tabline(i);
    };

    Buffer.prototype.cursor = function(i) {
        return this.state.cursor(i);
    };

    Buffer.prototype.highlight = function(i) {
        return this.state.highlight(i);
    };

    Buffer.prototype.selection = function(i) {
        return this.state.selection(i);
    };

    Buffer.prototype.lines = function() {
        return this.state.lines();
    };

    Buffer.prototype.cursors = function() {
        return this.state.cursors();
    };

    Buffer.prototype.highlights = function() {
        return this.state.highlights();
    };

    Buffer.prototype.selections = function() {
        return this.state.selections();
    };

    Buffer.prototype.numLines = function() {
        return this.state.numLines();
    };

    Buffer.prototype.numCursors = function() {
        return this.state.numCursors();
    };

    Buffer.prototype.numSelections = function() {
        return this.state.numSelections();
    };

    Buffer.prototype.numHighlights = function() {
        return this.state.numHighlights();
    };

    Buffer.prototype.setCursors = function(c) {
        return this.state = this.state.setCursors(c);
    };

    Buffer.prototype.setSelections = function(s) {
        return this.state = this.state.setSelections(s);
    };

    Buffer.prototype.setHighlights = function(h) {
        return this.state = this.state.setHighlights(h);
    };

    Buffer.prototype.setMain = function(m) {
        return this.state = this.state.setMain(m);
    };

    Buffer.prototype.addHighlight = function(h) {
        return this.state = this.state.addHighlight(h);
    };

    Buffer.prototype.select = function(s) {
        this["do"].start();
        this["do"].select(s);
        return this["do"].end();
    };

    Buffer.prototype.isCursorVirtual = function(c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return this.numLines() && c[1] < this.numLines() && c[0] > this.line(c[1]).length;
    };

    Buffer.prototype.isCursorAtEndOfLine = function(c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return this.numLines() && c[1] < this.numLines() && c[0] >= this.line(c[1]).length;
    };

    Buffer.prototype.isCursorAtStartOfLine = function(c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return c[0] === 0;
    };

    Buffer.prototype.isCursorInIndent = function(c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return this.numLines() && this.line(c[1]).slice(0, c[0]).trim().length === 0 && this.line(c[1]).slice(c[0]).trim().length;
    };

    Buffer.prototype.isCursorInLastLine = function(c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return c[1] === this.numLines() - 1;
    };

    Buffer.prototype.isCursorInFirstLine = function(c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return c[1] === 0;
    };

    Buffer.prototype.isCursorInRange = function(r, c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return isPosInRange(c, r);
    };

    Buffer.prototype.wordAtCursor = function() {
        return this.wordAtPos(this.mainCursor());
    };

    Buffer.prototype.wordAtPos = function(c) {
        return this.textInRange(this.rangeForRealWordAtPos(c));
    };

    Buffer.prototype.wordsAtCursors = function(cs, opt) {
        var j, len, r, ref1, results;
        if (cs == null) {
            cs = this.cursors();
        }
        ref1 = this.rangesForWordsAtCursors(cs, opt);
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            r = ref1[j];
            results.push(this.textInRange(r));
        }
        return results;
    };

    Buffer.prototype.rangesForWordsAtCursors = function(cs, opt) {
        var c, rngs;
        if (cs == null) {
            cs = this.cursors();
        }
        rngs = (function() {
            var j, len, results;
            results = [];
            for (j = 0, len = cs.length; j < len; j++) {
                c = cs[j];
                results.push(this.rangeForWordAtPos(c, opt));
            }
            return results;
        }).call(this);
        return rngs = cleanRanges(rngs);
    };

    Buffer.prototype.selectionTextOrWordAtCursor = function() {
        if (this.numSelections() === 1) {
            return this.textInRange(this.selection(0));
        } else {
            return this.wordAtCursor();
        }
    };

    Buffer.prototype.rangeForWordAtPos = function(pos, opt) {
        var p, r, wr;
        p = this.clampPos(pos);
        wr = this.wordRangesInLineAtIndex(p[1], opt);
        r = rangeAtPosInRanges(p, wr);
        return r;
    };

    Buffer.prototype.rangeForRealWordAtPos = function(pos, opt) {
        var p, r, wr;
        p = this.clampPos(pos);
        wr = this.realWordRangesInLineAtIndex(p[1], opt);
        r = rangeAtPosInRanges(p, wr);
        if ((r == null) || empty(this.textInRange(r).trim())) {
            r = rangeBeforePosInRanges(p, wr);
        }
        if ((r == null) || empty(this.textInRange(r).trim())) {
            r = rangeAfterPosInRanges(p, wr);
        }
        if (r != null) {
            r;
        } else {
            r = rangeForPos(p);
        }
        return r;
    };

    Buffer.prototype.endOfWordAtPos = function(c) {
        var r;
        r = this.rangeForWordAtPos(c);
        if (this.isCursorAtEndOfLine(c)) {
            if (this.isCursorInLastLine(c)) {
                return c;
            }
            r = this.rangeForWordAtPos([0, c[1] + 1]);
        }
        return [r[1][1], r[0]];
    };

    Buffer.prototype.startOfWordAtPos = function(c) {
        var r;
        if (this.isCursorAtStartOfLine(c)) {
            if (this.isCursorInFirstLine(c)) {
                return c;
            }
            r = this.rangeForWordAtPos([this.line(c[1] - 1).length, c[1] - 1]);
        } else {
            r = this.rangeForWordAtPos(c);
            if (r[1][0] === c[0]) {
                r = this.rangeForWordAtPos([c[0] - 1, c[1]]);
            }
        }
        return [r[1][0], r[0]];
    };

    Buffer.prototype.wordRangesInLineAtIndex = function(li, opt) {
        var mtch, r, ref1;
        if (opt == null) {
            opt = {};
        }
        if (opt.regExp != null) {
            opt.regExp;
        } else {
            opt.regExp = this.wordRegExp;
        }
        if (opt != null ? (ref1 = opt.include) != null ? ref1.length : void 0 : void 0) {
            opt.regExp = new RegExp("(\\s+|[\\w" + opt.include + "]+|[^\\s])", 'g');
        }
        r = [];
        while ((mtch = opt.regExp.exec(this.line(li))) !== null) {
            r.push([li, [mtch.index, opt.regExp.lastIndex]]);
        }
        return r.length && r || [[li, [0, 0]]];
    };

    Buffer.prototype.realWordRangesInLineAtIndex = function(li, opt) {
        var mtch, r;
        if (opt == null) {
            opt = {};
        }
        r = [];
        while ((mtch = this.realWordRegExp.exec(this.line(li))) !== null) {
            r.push([li, [mtch.index, this.realWordRegExp.lastIndex]]);
        }
        return r.length && r || [[li, [0, 0]]];
    };

    Buffer.prototype.highlightsInLineIndexRangeRelativeToLineIndex = function(lineIndexRange, relIndex) {
        var hl, j, len, results, s;
        hl = this.highlightsInLineIndexRange(lineIndexRange);
        if (hl) {
            results = [];
            for (j = 0, len = hl.length; j < len; j++) {
                s = hl[j];
                results.push([s[0] - relIndex, [s[1][0], s[1][1]], s[2]]);
            }
            return results;
        }
    };

    Buffer.prototype.highlightsInLineIndexRange = function(lineIndexRange) {
        return this.highlights().filter(function(s) {
            return s[0] >= lineIndexRange[0] && s[0] <= lineIndexRange[1];
        });
    };

    Buffer.prototype.selectionsInLineIndexRangeRelativeToLineIndex = function(lineIndexRange, relIndex) {
        var j, len, results, s, sl;
        sl = this.selectionsInLineIndexRange(lineIndexRange);
        if (sl) {
            results = [];
            for (j = 0, len = sl.length; j < len; j++) {
                s = sl[j];
                results.push([s[0] - relIndex, [s[1][0], s[1][1]]]);
            }
            return results;
        }
    };

    Buffer.prototype.selectionsInLineIndexRange = function(lineIndexRange) {
        return this.selections().filter(function(s) {
            return s[0] >= lineIndexRange[0] && s[0] <= lineIndexRange[1];
        });
    };

    Buffer.prototype.selectedLineIndices = function() {
        var s;
        return _.uniq((function() {
            var j, len, ref1, results;
            ref1 = this.selections();
            results = [];
            for (j = 0, len = ref1.length; j < len; j++) {
                s = ref1[j];
                results.push(s[0]);
            }
            return results;
        }).call(this));
    };

    Buffer.prototype.cursorLineIndices = function() {
        var c;
        return _.uniq((function() {
            var j, len, ref1, results;
            ref1 = this.cursors();
            results = [];
            for (j = 0, len = ref1.length; j < len; j++) {
                c = ref1[j];
                results.push(c[1]);
            }
            return results;
        }).call(this));
    };

    Buffer.prototype.selectedAndCursorLineIndices = function() {
        return _.uniq(this.selectedLineIndices().concat(this.cursorLineIndices()));
    };

    Buffer.prototype.continuousCursorAndSelectedLineIndexRanges = function() {
        var csr, il, j, len, li;
        il = this.selectedAndCursorLineIndices();
        csr = [];
        if (il.length) {
            for (j = 0, len = il.length; j < len; j++) {
                li = il[j];
                if (csr.length && _.last(csr)[1] === li - 1) {
                    _.last(csr)[1] = li;
                } else {
                    csr.push([li, li]);
                }
            }
        }
        return csr;
    };

    Buffer.prototype.isSelectedLineAtIndex = function(li) {
        var il, s;
        il = this.selectedLineIndices();
        if (indexOf.call(il, li) >= 0) {
            s = this.selection(il.indexOf(li));
            if (s[1][0] === 0 && s[1][1] === this.line(li).length) {
                return true;
            }
        }
        return false;
    };

    Buffer.prototype.text = function() {
        return this.state.text(this.newlineCharacters);
    };

    Buffer.prototype.textInRange = function(rg) {
        var base;
        return typeof (base = this.line(rg[0])).slice === "function" ? base.slice(rg[1][0], rg[1][1]) : void 0;
    };

    Buffer.prototype.textsInRanges = function(rgs) {
        var j, len, r, results;
        results = [];
        for (j = 0, len = rgs.length; j < len; j++) {
            r = rgs[j];
            results.push(this.textInRange(r));
        }
        return results;
    };

    Buffer.prototype.textInRanges = function(rgs) {
        return this.textsInRanges(rgs).join('\n');
    };

    Buffer.prototype.textOfSelection = function() {
        return this.textInRanges(this.selections());
    };

    Buffer.prototype.textOfHighlight = function() {
        return this.numHighlights() && this.textInRange(this.highlight(0)) || '';
    };

    Buffer.prototype.indentationAtLineIndex = function(li) {
        var line;
        if (li >= this.numLines()) {
            return 0;
        }
        line = this.line(li);
        while (empty(line.trim()) && li > 0) {
            li--;
            line = this.line(li);
        }
        return indentationInLine(line);
    };

    Buffer.prototype.lastPos = function() {
        var lli;
        lli = this.numLines() - 1;
        return [this.line(lli).length, lli];
    };

    Buffer.prototype.cursorPos = function() {
        return this.clampPos(this.mainCursor());
    };

    Buffer.prototype.clampPos = function(p) {
        var c, l;
        if (!this.numLines()) {
            return [0, -1];
        }
        l = clamp(0, this.numLines() - 1, p[1]);
        c = clamp(0, this.line(l).length, p[0]);
        return [c, l];
    };

    Buffer.prototype.wordStartPosAfterPos = function(p) {
        if (p == null) {
            p = this.cursorPos();
        }
        if (p[0] < this.line(p[1]).length && this.line(p[1])[p[0]] !== ' ') {
            return p;
        }
        while (p[0] < this.line(p[1]).length - 1) {
            if (this.line(p[1])[p[0] + 1] !== ' ') {
                return [p[0] + 1, p[1]];
            }
            p[0] += 1;
        }
        if (p[1] < this.numLines() - 1) {
            return this.wordStartPosAfterPos([0, p[1] + 1]);
        } else {
            return null;
        }
    };

    Buffer.prototype.rangeForLineAtIndex = function(i) {
        if (i >= this.numLines()) {
            return kerror("Buffer.rangeForLineAtIndex -- index " + i + " >= " + (this.numLines()));
        }
        return [i, [0, this.line(i).length]];
    };

    Buffer.prototype.isRangeInString = function(r) {
        return this.rangeOfStringSurroundingRange(r) != null;
    };

    Buffer.prototype.rangeOfInnerStringSurroundingRange = function(r) {
        var rgs;
        rgs = this.rangesOfStringsInLineAtIndex(r[0]);
        rgs = rangesShrunkenBy(rgs, 1);
        return rangeContainingRangeInRanges(r, rgs);
    };

    Buffer.prototype.rangeOfStringSurroundingRange = function(r) {
        var ir;
        if (ir = this.rangeOfInnerStringSurroundingRange(r)) {
            return rangeGrownBy(ir, 1);
        }
    };

    Buffer.prototype.distanceOfWord = function(w, pos) {
        var d, la, lb;
        if (pos == null) {
            pos = this.cursorPos();
        }
        if (this.line(pos[1]).indexOf(w) >= 0) {
            return 0;
        }
        d = 1;
        lb = pos[1] - d;
        la = pos[1] + d;
        while (lb >= 0 || la < this.numLines()) {
            if (lb >= 0) {
                if (this.line(lb).indexOf(w) >= 0) {
                    return d;
                }
            }
            if (la < this.numLines()) {
                if (this.line(la).indexOf(w) >= 0) {
                    return d;
                }
            }
            d++;
            lb = pos[1] - d;
            la = pos[1] + d;
        }
        return Number.MAX_SAFE_INTEGER;
    };

    Buffer.prototype.rangesForCursorLines = function(cs) {
        var c, j, len, results;
        if (cs == null) {
            cs = this.cursors();
        }
        results = [];
        for (j = 0, len = cs.length; j < len; j++) {
            c = cs[j];
            results.push(this.rangeForLineAtIndex(c[1]));
        }
        return results;
    };

    Buffer.prototype.rangesForAllLines = function() {
        return this.rangesForLinesFromTopToBot(0, this.numLines());
    };

    Buffer.prototype.rangesForLinesBetweenPositions = function(a, b, extend) {
        var i, j, r, ref1, ref2, ref3;
        if (extend == null) {
            extend = false;
        }
        r = [];
        ref1 = sortPositions([a, b]), a = ref1[0], b = ref1[1];
        if (a[1] === b[1]) {
            r.push([a[1], [a[0], b[0]]]);
        } else {
            r.push([a[1], [a[0], this.line(a[1]).length]]);
            if (b[1] - a[1] > 1) {
                for (i = j = ref2 = a[1] + 1, ref3 = b[1]; ref2 <= ref3 ? j < ref3 : j > ref3; i = ref2 <= ref3 ? ++j : --j) {
                    r.push([i, [0, this.line(i).length]]);
                }
            }
            r.push([b[1], [0, extend && b[0] === 0 && this.line(b[1]).length || b[0]]]);
        }
        return r;
    };

    Buffer.prototype.rangesForLinesFromTopToBot = function(top, bot) {
        var ir, j, li, r, ref1, ref2;
        r = [];
        ir = [top, bot];
        for (li = j = ref1 = startOf(ir), ref2 = endOf(ir); ref1 <= ref2 ? j < ref2 : j > ref2; li = ref1 <= ref2 ? ++j : --j) {
            r.push(this.rangeForLineAtIndex(li));
        }
        return r;
    };

    Buffer.prototype.rangesForText = function(t, opt) {
        var j, li, r, ref1, ref2;
        t = t.split('\n')[0];
        r = [];
        for (li = j = 0, ref1 = this.numLines(); 0 <= ref1 ? j < ref1 : j > ref1; li = 0 <= ref1 ? ++j : --j) {
            r = r.concat(this.rangesForTextInLineAtIndex(t, li, opt));
            if (r.length >= ((ref2 = opt != null ? opt.max : void 0) != null ? ref2 : 999)) {
                break;
            }
        }
        return r;
    };

    Buffer.prototype.rangesForTextInLineAtIndex = function(t, i, opt) {
        var j, len, mtch, r, re, ref1, rng, rngs, type;
        r = [];
        type = (ref1 = opt != null ? opt.type : void 0) != null ? ref1 : 'str';
        switch (type) {
            case 'fuzzy':
                re = new RegExp("\\w+", 'g');
                while ((mtch = re.exec(this.line(i))) !== null) {
                    if (fuzzy.test(t, this.line(i).slice(mtch.index, re.lastIndex))) {
                        r.push([i, [mtch.index, re.lastIndex]]);
                    }
                }
                break;
            default:
                if (type === 'str' || type === 'Str' || type === 'glob') {
                    t = _.escapeRegExp(t);
                }
                if (type === 'glob') {
                    t = t.replace(new RegExp("\\*", 'g'), "\w*");
                    if (!t.length) {
                        return r;
                    }
                }
                rngs = matchr.ranges(t, this.line(i), (type === 'str' || type === 'reg' || type === 'glob') && 'i' || '');
                for (j = 0, len = rngs.length; j < len; j++) {
                    rng = rngs[j];
                    r.push([i, [rng.start, rng.start + rng.match.length]]);
                }
        }
        return r;
    };

    Buffer.prototype.rangesOfStringsInLineAtIndex = function(li) {
        var c, cc, i, j, r, ref1, ss, t;
        t = this.line(li);
        r = [];
        ss = -1;
        cc = null;
        for (i = j = 0, ref1 = t.length; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            c = t[i];
            if (!cc && indexOf.call("'\"", c) >= 0) {
                cc = c;
                ss = i;
            } else if (c === cc) {
                if ((t[i - 1] !== '\\') || (i > 2 && t[i - 2] === '\\')) {
                    r.push([li, [ss, i + 1]]);
                    cc = null;
                    ss = -1;
                }
            }
        }
        return r;
    };

    return Buffer;

})(event);

module.exports = Buffer;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpRkFBQTtJQUFBOzs7OztBQVFBLE1BQThCLE9BQUEsQ0FBUSxLQUFSLENBQTlCLEVBQUUsaUJBQUYsRUFBUyxpQkFBVCxFQUFnQixtQkFBaEIsRUFBd0I7O0FBRXhCLE1BQUEsR0FBVSxPQUFBLENBQVEsaUJBQVI7O0FBQ1YsS0FBQSxHQUFVLE9BQUEsQ0FBUSxTQUFSOztBQUNWLEtBQUEsR0FBVSxPQUFBLENBQVEsT0FBUjs7QUFDVixLQUFBLEdBQVUsT0FBQSxDQUFRLFFBQVI7O0FBRVYsT0FBQSxHQUFVLFNBQUMsQ0FBRDtXQUFPLENBQUUsQ0FBQSxDQUFBO0FBQVQ7O0FBQ1YsS0FBQSxHQUFVLFNBQUMsQ0FBRDtXQUFPLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBTyxJQUFJLENBQUMsR0FBTCxDQUFTLENBQVQsRUFBWSxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQUssQ0FBRSxDQUFBLENBQUEsQ0FBbkI7QUFBZDs7QUFFSjs7O0lBRUMsZ0JBQUE7Ozs7O1FBQ0Msc0NBQUE7UUFDQSxJQUFDLENBQUEsaUJBQUQsR0FBcUI7UUFDckIsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFJLE1BQUosQ0FBVyxvQkFBWCxFQUFpQyxHQUFqQztRQUNkLElBQUMsQ0FBQSxjQUFELEdBQWtCLElBQUksTUFBSixDQUFXLFFBQVgsRUFBcUIsR0FBckI7UUFDbEIsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFJLEtBQUosQ0FBQSxDQUFWO0lBTEQ7O3FCQU9ILFFBQUEsR0FBVSxTQUFDLEtBQUQ7UUFDTixJQUFDLENBQUEsSUFBRCxDQUFNLFVBQU4sRUFBa0IsQ0FBbEI7UUFDQSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQUksS0FBSixDQUFVO1lBQUEsS0FBQSxFQUFNLEtBQU47U0FBVixDQUFWO2VBQ0EsSUFBQyxDQUFBLElBQUQs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LEVBQUQsRUFBSyxDQUFDLEVBQUQsRUFBSyxDQUFBLEdBQUUsQ0FBUCxDQUFMLENBQVA7b0JBQ0EsRUFBQSxHQUFLO29CQUNMLEVBQUEsR0FBSyxDQUFDLEVBSFY7aUJBREM7O0FBTFQ7ZUFVQTtJQWYwQjs7OztHQXhXYjs7QUF5WHJCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAgICAgMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBjbGFtcCwgZW1wdHksIGtlcnJvciwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5tYXRjaHIgID0gcmVxdWlyZSAnLi4vdG9vbHMvbWF0Y2hyJ1xuU3RhdGUgICA9IHJlcXVpcmUgJy4vc3RhdGUnXG5mdXp6eSAgID0gcmVxdWlyZSAnZnV6enknXG5ldmVudCAgID0gcmVxdWlyZSAnZXZlbnRzJ1xuXG5zdGFydE9mID0gKHIpIC0+IHJbMF1cbmVuZE9mICAgPSAocikgLT4gclswXSArIE1hdGgubWF4IDEsIHJbMV0tclswXVxuXG5jbGFzcyBCdWZmZXIgZXh0ZW5kcyBldmVudFxuXG4gICAgQDogLT5cbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBAbmV3bGluZUNoYXJhY3RlcnMgPSAnXFxuJ1xuICAgICAgICBAd29yZFJlZ0V4cCA9IG5ldyBSZWdFeHAgXCIoXFxcXHMrfFxcXFx3K3xbXlxcXFxzXSlcIiwgJ2cnXG4gICAgICAgIEByZWFsV29yZFJlZ0V4cCA9IG5ldyBSZWdFeHAgXCIoXFxcXHcrKVwiLCAnZydcbiAgICAgICAgQHNldFN0YXRlIG5ldyBTdGF0ZSgpXG5cbiAgICBzZXRMaW5lczogKGxpbmVzKSAtPlxuICAgICAgICBAZW1pdCAnbnVtTGluZXMnLCAwICMgZ2l2ZSBsaXN0ZW5lcnMgYSBjaGFuY2UgdG8gY2xlYXIgdGhlaXIgc3R1ZmZcbiAgICAgICAgQHNldFN0YXRlIG5ldyBTdGF0ZSBsaW5lczpsaW5lc1xuICAgICAgICBAZW1pdCAnbnVtTGluZXMnLCBAbnVtTGluZXMoKVxuXG4gICAgc2V0U3RhdGU6IChzdGF0ZSkgLT4gQHN0YXRlID0gbmV3IFN0YXRlIHN0YXRlLnNcblxuICAgIG1haW5DdXJzb3I6ICAgIC0+IEBzdGF0ZS5tYWluQ3Vyc29yKClcbiAgICBsaW5lOiAgICAgIChpKSA9PiBAc3RhdGUubGluZSBpXG4gICAgdGFibGluZTogICAoaSkgLT4gQHN0YXRlLnRhYmxpbmUgaVxuICAgIGN1cnNvcjogICAgKGkpIC0+IEBzdGF0ZS5jdXJzb3IgaVxuICAgIGhpZ2hsaWdodDogKGkpIC0+IEBzdGF0ZS5oaWdobGlnaHQgaVxuICAgIHNlbGVjdGlvbjogKGkpIC0+IEBzdGF0ZS5zZWxlY3Rpb24gaVxuXG4gICAgbGluZXM6ICAgICAgICAgPT4gQHN0YXRlLmxpbmVzKClcbiAgICBjdXJzb3JzOiAgICAgICAtPiBAc3RhdGUuY3Vyc29ycygpXG4gICAgaGlnaGxpZ2h0czogICAgLT4gQHN0YXRlLmhpZ2hsaWdodHMoKVxuICAgIHNlbGVjdGlvbnM6ICAgIC0+IEBzdGF0ZS5zZWxlY3Rpb25zKClcblxuICAgIG51bUxpbmVzOiAgICAgIC0+IEBzdGF0ZS5udW1MaW5lcygpXG4gICAgbnVtQ3Vyc29yczogICAgLT4gQHN0YXRlLm51bUN1cnNvcnMoKVxuICAgIG51bVNlbGVjdGlvbnM6IC0+IEBzdGF0ZS5udW1TZWxlY3Rpb25zKClcbiAgICBudW1IaWdobGlnaHRzOiAtPiBAc3RhdGUubnVtSGlnaGxpZ2h0cygpXG5cbiAgICAjIHRoZXNlIGFyZSB1c2VkIGZyb20gdGVzdHMgYW5kIHJlc3RvcmVcbiAgICBzZXRDdXJzb3JzOiAgICAoYykgLT4gQHN0YXRlID0gQHN0YXRlLnNldEN1cnNvcnMgICAgY1xuICAgIHNldFNlbGVjdGlvbnM6IChzKSAtPiBAc3RhdGUgPSBAc3RhdGUuc2V0U2VsZWN0aW9ucyBzXG4gICAgc2V0SGlnaGxpZ2h0czogKGgpIC0+IEBzdGF0ZSA9IEBzdGF0ZS5zZXRIaWdobGlnaHRzIGhcbiAgICBzZXRNYWluOiAgICAgICAobSkgLT4gQHN0YXRlID0gQHN0YXRlLnNldE1haW4gICAgICAgbVxuICAgIGFkZEhpZ2hsaWdodDogIChoKSAtPiBAc3RhdGUgPSBAc3RhdGUuYWRkSGlnaGxpZ2h0ICBoXG5cbiAgICBzZWxlY3Q6IChzKSAtPlxuXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZWxlY3Qgc1xuICAgICAgICBAZG8uZW5kKClcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgaXNDdXJzb3JWaXJ0dWFsOiAgICAgICAoYz1AbWFpbkN1cnNvcigpKSAtPiBAbnVtTGluZXMoKSBhbmQgY1sxXSA8IEBudW1MaW5lcygpIGFuZCBjWzBdID4gQGxpbmUoY1sxXSkubGVuZ3RoXG4gICAgaXNDdXJzb3JBdEVuZE9mTGluZTogICAoYz1AbWFpbkN1cnNvcigpKSAtPiBAbnVtTGluZXMoKSBhbmQgY1sxXSA8IEBudW1MaW5lcygpIGFuZCBjWzBdID49IEBsaW5lKGNbMV0pLmxlbmd0aFxuICAgIGlzQ3Vyc29yQXRTdGFydE9mTGluZTogKGM9QG1haW5DdXJzb3IoKSkgLT4gY1swXSA9PSAwXG4gICAgaXNDdXJzb3JJbkluZGVudDogICAgICAoYz1AbWFpbkN1cnNvcigpKSAtPiBAbnVtTGluZXMoKSBhbmQgQGxpbmUoY1sxXSkuc2xpY2UoMCwgY1swXSkudHJpbSgpLmxlbmd0aCA9PSAwIGFuZCBAbGluZShjWzFdKS5zbGljZShjWzBdKS50cmltKCkubGVuZ3RoXG4gICAgaXNDdXJzb3JJbkxhc3RMaW5lOiAgICAoYz1AbWFpbkN1cnNvcigpKSAtPiBjWzFdID09IEBudW1MaW5lcygpLTFcbiAgICBpc0N1cnNvckluRmlyc3RMaW5lOiAgIChjPUBtYWluQ3Vyc29yKCkpIC0+IGNbMV0gPT0gMFxuICAgIGlzQ3Vyc29ySW5SYW5nZTogICAgICAgKHIsYz1AbWFpbkN1cnNvcigpKSAtPiBpc1Bvc0luUmFuZ2UgYywgclxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICB3b3JkQXRDdXJzb3I6IC0+IEB3b3JkQXRQb3MgQG1haW5DdXJzb3IoKVxuICAgIHdvcmRBdFBvczogKGMpIC0+IEB0ZXh0SW5SYW5nZSBAcmFuZ2VGb3JSZWFsV29yZEF0UG9zIGNcbiAgICB3b3Jkc0F0Q3Vyc29yczogKGNzPUBjdXJzb3JzKCksIG9wdCkgLT4gKEB0ZXh0SW5SYW5nZSByIGZvciByIGluIEByYW5nZXNGb3JXb3Jkc0F0Q3Vyc29ycyBjcywgb3B0KVxuXG4gICAgcmFuZ2VzRm9yV29yZHNBdEN1cnNvcnM6IChjcz1AY3Vyc29ycygpLCBvcHQpIC0+XG4gICAgICAgIHJuZ3MgPSAoQHJhbmdlRm9yV29yZEF0UG9zKGMsIG9wdCkgZm9yIGMgaW4gY3MpXG4gICAgICAgIHJuZ3MgPSBjbGVhblJhbmdlcyBybmdzXG5cbiAgICBzZWxlY3Rpb25UZXh0T3JXb3JkQXRDdXJzb3I6ICgpIC0+XG5cbiAgICAgICAgaWYgQG51bVNlbGVjdGlvbnMoKSA9PSAxXG4gICAgICAgICAgICBAdGV4dEluUmFuZ2UgQHNlbGVjdGlvbiAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB3b3JkQXRDdXJzb3IoKVxuXG4gICAgcmFuZ2VGb3JXb3JkQXRQb3M6IChwb3MsIG9wdCkgLT5cblxuICAgICAgICBwID0gQGNsYW1wUG9zIHBvc1xuICAgICAgICB3ciA9IEB3b3JkUmFuZ2VzSW5MaW5lQXRJbmRleCBwWzFdLCBvcHRcbiAgICAgICAgciA9IHJhbmdlQXRQb3NJblJhbmdlcyBwLCB3clxuICAgICAgICByXG5cbiAgICByYW5nZUZvclJlYWxXb3JkQXRQb3M6IChwb3MsIG9wdCkgLT5cblxuICAgICAgICBwID0gQGNsYW1wUG9zIHBvc1xuICAgICAgICB3ciA9IEByZWFsV29yZFJhbmdlc0luTGluZUF0SW5kZXggcFsxXSwgb3B0XG5cbiAgICAgICAgciA9IHJhbmdlQXRQb3NJblJhbmdlcyBwLCB3clxuICAgICAgICBpZiBub3Qgcj8gb3IgZW1wdHkgQHRleHRJblJhbmdlKHIpLnRyaW0oKVxuICAgICAgICAgICAgciA9IHJhbmdlQmVmb3JlUG9zSW5SYW5nZXMgcCwgd3JcbiAgICAgICAgaWYgbm90IHI/IG9yIGVtcHR5IEB0ZXh0SW5SYW5nZShyKS50cmltKClcbiAgICAgICAgICAgIHIgPSByYW5nZUFmdGVyUG9zSW5SYW5nZXMgcCwgd3JcbiAgICAgICAgciA/PSByYW5nZUZvclBvcyBwXG4gICAgICAgIHJcblxuICAgIGVuZE9mV29yZEF0UG9zOiAoYykgPT5cblxuICAgICAgICByID0gQHJhbmdlRm9yV29yZEF0UG9zIGNcbiAgICAgICAgaWYgQGlzQ3Vyc29yQXRFbmRPZkxpbmUgY1xuICAgICAgICAgICAgcmV0dXJuIGMgaWYgQGlzQ3Vyc29ySW5MYXN0TGluZSBjXG4gICAgICAgICAgICByID0gQHJhbmdlRm9yV29yZEF0UG9zIFswLCBjWzFdKzFdXG4gICAgICAgIFtyWzFdWzFdLCByWzBdXVxuXG4gICAgc3RhcnRPZldvcmRBdFBvczogKGMpID0+XG5cbiAgICAgICAgaWYgQGlzQ3Vyc29yQXRTdGFydE9mTGluZSBjXG4gICAgICAgICAgICByZXR1cm4gYyBpZiBAaXNDdXJzb3JJbkZpcnN0TGluZSBjXG4gICAgICAgICAgICByID0gQHJhbmdlRm9yV29yZEF0UG9zIFtAbGluZShjWzFdLTEpLmxlbmd0aCwgY1sxXS0xXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByID0gQHJhbmdlRm9yV29yZEF0UG9zIGNcbiAgICAgICAgICAgIGlmIHJbMV1bMF0gPT0gY1swXVxuICAgICAgICAgICAgICAgIHIgPSBAcmFuZ2VGb3JXb3JkQXRQb3MgW2NbMF0tMSwgY1sxXV1cbiAgICAgICAgW3JbMV1bMF0sIHJbMF1dXG5cbiAgICB3b3JkUmFuZ2VzSW5MaW5lQXRJbmRleDogKGxpLCBvcHQ9e30pIC0+XG5cbiAgICAgICAgb3B0LnJlZ0V4cCA/PSBAd29yZFJlZ0V4cFxuICAgICAgICBvcHQucmVnRXhwID0gbmV3IFJlZ0V4cCBcIihcXFxccyt8W1xcXFx3I3tvcHQuaW5jbHVkZX1dK3xbXlxcXFxzXSlcIiwgJ2cnIGlmIG9wdD8uaW5jbHVkZT8ubGVuZ3RoXG4gICAgICAgIHIgPSBbXVxuICAgICAgICB3aGlsZSAobXRjaCA9IG9wdC5yZWdFeHAuZXhlYyhAbGluZShsaSkpKSAhPSBudWxsXG4gICAgICAgICAgICByLnB1c2ggW2xpLCBbbXRjaC5pbmRleCwgb3B0LnJlZ0V4cC5sYXN0SW5kZXhdXVxuICAgICAgICByLmxlbmd0aCBhbmQgciBvciBbW2xpLCBbMCwwXV1dXG5cbiAgICByZWFsV29yZFJhbmdlc0luTGluZUF0SW5kZXg6IChsaSwgb3B0PXt9KSAtPlxuXG4gICAgICAgIHIgPSBbXVxuICAgICAgICB3aGlsZSAobXRjaCA9IEByZWFsV29yZFJlZ0V4cC5leGVjKEBsaW5lKGxpKSkpICE9IG51bGxcbiAgICAgICAgICAgIHIucHVzaCBbbGksIFttdGNoLmluZGV4LCBAcmVhbFdvcmRSZWdFeHAubGFzdEluZGV4XV1cbiAgICAgICAgci5sZW5ndGggYW5kIHIgb3IgW1tsaSwgWzAsMF1dXVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG5cbiAgICBoaWdobGlnaHRzSW5MaW5lSW5kZXhSYW5nZVJlbGF0aXZlVG9MaW5lSW5kZXg6IChsaW5lSW5kZXhSYW5nZSwgcmVsSW5kZXgpIC0+XG5cbiAgICAgICAgaGwgPSBAaGlnaGxpZ2h0c0luTGluZUluZGV4UmFuZ2UgbGluZUluZGV4UmFuZ2VcbiAgICAgICAgaWYgaGxcbiAgICAgICAgICAgIChbc1swXS1yZWxJbmRleCwgW3NbMV1bMF0sIHNbMV1bMV1dLCBzWzJdXSBmb3IgcyBpbiBobClcblxuICAgIGhpZ2hsaWdodHNJbkxpbmVJbmRleFJhbmdlOiAobGluZUluZGV4UmFuZ2UpIC0+XG5cbiAgICAgICAgQGhpZ2hsaWdodHMoKS5maWx0ZXIgKHMpIC0+IHNbMF0gPj0gbGluZUluZGV4UmFuZ2VbMF0gYW5kIHNbMF0gPD0gbGluZUluZGV4UmFuZ2VbMV1cblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIHNlbGVjdGlvbnNJbkxpbmVJbmRleFJhbmdlUmVsYXRpdmVUb0xpbmVJbmRleDogKGxpbmVJbmRleFJhbmdlLCByZWxJbmRleCkgLT5cblxuICAgICAgICBzbCA9IEBzZWxlY3Rpb25zSW5MaW5lSW5kZXhSYW5nZSBsaW5lSW5kZXhSYW5nZVxuICAgICAgICBpZiBzbFxuICAgICAgICAgICAgKFtzWzBdLXJlbEluZGV4LCBbc1sxXVswXSwgc1sxXVsxXV1dIGZvciBzIGluIHNsKVxuXG4gICAgc2VsZWN0aW9uc0luTGluZUluZGV4UmFuZ2U6IChsaW5lSW5kZXhSYW5nZSkgLT5cblxuICAgICAgICBAc2VsZWN0aW9ucygpLmZpbHRlciAocykgLT4gc1swXSA+PSBsaW5lSW5kZXhSYW5nZVswXSBhbmQgc1swXSA8PSBsaW5lSW5kZXhSYW5nZVsxXVxuXG4gICAgc2VsZWN0ZWRMaW5lSW5kaWNlczogLT4gXy51bmlxIChzWzBdIGZvciBzIGluIEBzZWxlY3Rpb25zKCkpXG4gICAgY3Vyc29yTGluZUluZGljZXM6ICAgLT4gXy51bmlxIChjWzFdIGZvciBjIGluIEBjdXJzb3JzKCkpXG5cbiAgICBzZWxlY3RlZEFuZEN1cnNvckxpbmVJbmRpY2VzOiAtPlxuXG4gICAgICAgIF8udW5pcSBAc2VsZWN0ZWRMaW5lSW5kaWNlcygpLmNvbmNhdCBAY3Vyc29yTGluZUluZGljZXMoKVxuXG4gICAgY29udGludW91c0N1cnNvckFuZFNlbGVjdGVkTGluZUluZGV4UmFuZ2VzOiAtPlxuXG4gICAgICAgIGlsID0gQHNlbGVjdGVkQW5kQ3Vyc29yTGluZUluZGljZXMoKVxuICAgICAgICBjc3IgPSBbXVxuICAgICAgICBpZiBpbC5sZW5ndGhcbiAgICAgICAgICAgIGZvciBsaSBpbiBpbFxuICAgICAgICAgICAgICAgIGlmIGNzci5sZW5ndGggYW5kIF8ubGFzdChjc3IpWzFdID09IGxpLTFcbiAgICAgICAgICAgICAgICAgICAgXy5sYXN0KGNzcilbMV0gPSBsaVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgY3NyLnB1c2ggW2xpLGxpXVxuICAgICAgICBjc3JcblxuICAgIGlzU2VsZWN0ZWRMaW5lQXRJbmRleDogKGxpKSAtPlxuXG4gICAgICAgIGlsID0gQHNlbGVjdGVkTGluZUluZGljZXMoKVxuICAgICAgICBpZiBsaSBpbiBpbFxuICAgICAgICAgICAgcyA9IEBzZWxlY3Rpb24oaWwuaW5kZXhPZiBsaSlcbiAgICAgICAgICAgIGlmIHNbMV1bMF0gPT0gMCBhbmQgc1sxXVsxXSA9PSBAbGluZShsaSkubGVuZ3RoXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZmFsc2VcblxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICB0ZXh0OiAgICAgICAgICAgICAgICAtPiBAc3RhdGUudGV4dCBAbmV3bGluZUNoYXJhY3RlcnNcbiAgICB0ZXh0SW5SYW5nZTogICAocmcpICAtPiBAbGluZShyZ1swXSkuc2xpY2U/IHJnWzFdWzBdLCByZ1sxXVsxXVxuICAgIHRleHRzSW5SYW5nZXM6IChyZ3MpIC0+IChAdGV4dEluUmFuZ2UocikgZm9yIHIgaW4gcmdzKVxuICAgIHRleHRJblJhbmdlczogIChyZ3MpIC0+IEB0ZXh0c0luUmFuZ2VzKHJncykuam9pbiAnXFxuJ1xuICAgIHRleHRPZlNlbGVjdGlvbjogICAgIC0+IEB0ZXh0SW5SYW5nZXMgQHNlbGVjdGlvbnMoKVxuICAgIHRleHRPZkhpZ2hsaWdodDogICAgIC0+IEBudW1IaWdobGlnaHRzKCkgYW5kIEB0ZXh0SW5SYW5nZShAaGlnaGxpZ2h0IDApIG9yICcnXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICBpbmRlbnRhdGlvbkF0TGluZUluZGV4OiAobGkpIC0+XG5cbiAgICAgICAgcmV0dXJuIDAgaWYgbGkgPj0gQG51bUxpbmVzKClcbiAgICAgICAgbGluZSA9IEBsaW5lIGxpXG4gICAgICAgIHdoaWxlIGVtcHR5KGxpbmUudHJpbSgpKSBhbmQgbGkgPiAwXG4gICAgICAgICAgICBsaS0tXG4gICAgICAgICAgICBsaW5lID0gQGxpbmUgbGlcbiAgICAgICAgaW5kZW50YXRpb25JbkxpbmUgbGluZVxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBsYXN0UG9zOiAtPlxuXG4gICAgICAgIGxsaSA9IEBudW1MaW5lcygpLTFcbiAgICAgICAgW0BsaW5lKGxsaSkubGVuZ3RoLCBsbGldXG5cbiAgICBjdXJzb3JQb3M6IC0+IEBjbGFtcFBvcyBAbWFpbkN1cnNvcigpXG5cbiAgICBjbGFtcFBvczogKHApIC0+XG5cbiAgICAgICAgaWYgbm90IEBudW1MaW5lcygpIHRoZW4gcmV0dXJuIFswLC0xXVxuICAgICAgICBsID0gY2xhbXAgMCwgQG51bUxpbmVzKCktMSwgIHBbMV1cbiAgICAgICAgYyA9IGNsYW1wIDAsIEBsaW5lKGwpLmxlbmd0aCwgcFswXVxuICAgICAgICBbIGMsIGwgXVxuXG4gICAgd29yZFN0YXJ0UG9zQWZ0ZXJQb3M6IChwPUBjdXJzb3JQb3MoKSkgLT5cblxuICAgICAgICByZXR1cm4gcCBpZiBwWzBdIDwgQGxpbmUocFsxXSkubGVuZ3RoIGFuZCBAbGluZShwWzFdKVtwWzBdXSAhPSAnICdcblxuICAgICAgICB3aGlsZSBwWzBdIDwgQGxpbmUocFsxXSkubGVuZ3RoLTFcbiAgICAgICAgICAgIHJldHVybiBbcFswXSsxLCBwWzFdXSBpZiBAbGluZShwWzFdKVtwWzBdKzFdICE9ICcgJ1xuICAgICAgICAgICAgcFswXSArPSAxXG5cbiAgICAgICAgaWYgcFsxXSA8IEBudW1MaW5lcygpLTFcbiAgICAgICAgICAgIEB3b3JkU3RhcnRQb3NBZnRlclBvcyBbMCwgcFsxXSsxXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBudWxsXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICByYW5nZUZvckxpbmVBdEluZGV4OiAoaSkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yIFwiQnVmZmVyLnJhbmdlRm9yTGluZUF0SW5kZXggLS0gaW5kZXggI3tpfSA+PSAje0BudW1MaW5lcygpfVwiIGlmIGkgPj0gQG51bUxpbmVzKClcbiAgICAgICAgW2ksIFswLCBAbGluZShpKS5sZW5ndGhdXVxuXG4gICAgaXNSYW5nZUluU3RyaW5nOiAocikgLT4gQHJhbmdlT2ZTdHJpbmdTdXJyb3VuZGluZ1JhbmdlKHIpP1xuXG4gICAgcmFuZ2VPZklubmVyU3RyaW5nU3Vycm91bmRpbmdSYW5nZTogKHIpIC0+XG5cbiAgICAgICAgcmdzID0gQHJhbmdlc09mU3RyaW5nc0luTGluZUF0SW5kZXggclswXVxuICAgICAgICByZ3MgPSByYW5nZXNTaHJ1bmtlbkJ5IHJncywgMVxuICAgICAgICByYW5nZUNvbnRhaW5pbmdSYW5nZUluUmFuZ2VzIHIsIHJnc1xuXG4gICAgcmFuZ2VPZlN0cmluZ1N1cnJvdW5kaW5nUmFuZ2U6IChyKSAtPlxuXG4gICAgICAgIGlmIGlyID0gQHJhbmdlT2ZJbm5lclN0cmluZ1N1cnJvdW5kaW5nUmFuZ2UgclxuICAgICAgICAgICAgcmFuZ2VHcm93bkJ5IGlyLCAxXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIGRpc3RhbmNlT2ZXb3JkOiAodywgcG9zPUBjdXJzb3JQb3MoKSkgLT5cblxuICAgICAgICByZXR1cm4gMCBpZiBAbGluZShwb3NbMV0pLmluZGV4T2YodykgPj0gMFxuICAgICAgICBkID0gMVxuICAgICAgICBsYiA9IHBvc1sxXS1kXG4gICAgICAgIGxhID0gcG9zWzFdK2RcbiAgICAgICAgd2hpbGUgbGIgPj0gMCBvciBsYSA8IEBudW1MaW5lcygpXG4gICAgICAgICAgICBpZiBsYiA+PSAwXG4gICAgICAgICAgICAgICAgaWYgQGxpbmUobGIpLmluZGV4T2YodykgPj0gMCB0aGVuIHJldHVybiBkXG4gICAgICAgICAgICBpZiBsYSA8IEBudW1MaW5lcygpXG4gICAgICAgICAgICAgICAgaWYgQGxpbmUobGEpLmluZGV4T2YodykgPj0gMCB0aGVuIHJldHVybiBkXG4gICAgICAgICAgICBkKytcbiAgICAgICAgICAgIGxiID0gcG9zWzFdLWRcbiAgICAgICAgICAgIGxhID0gcG9zWzFdK2RcblxuICAgICAgICBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUlxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgcmFuZ2VzRm9yQ3Vyc29yTGluZXM6IChjcz1AY3Vyc29ycygpKSAtPiAoQHJhbmdlRm9yTGluZUF0SW5kZXggY1sxXSBmb3IgYyBpbiBjcylcbiAgICByYW5nZXNGb3JBbGxMaW5lczogLT4gQHJhbmdlc0ZvckxpbmVzRnJvbVRvcFRvQm90IDAsIEBudW1MaW5lcygpXG5cbiAgICByYW5nZXNGb3JMaW5lc0JldHdlZW5Qb3NpdGlvbnM6IChhLCBiLCBleHRlbmQ9ZmFsc2UpIC0+XG4gICAgICAgIHIgPSBbXVxuICAgICAgICBbYSxiXSA9IHNvcnRQb3NpdGlvbnMgW2EsYl1cbiAgICAgICAgaWYgYVsxXSA9PSBiWzFdXG4gICAgICAgICAgICByLnB1c2ggW2FbMV0sIFthWzBdLCBiWzBdXV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgci5wdXNoIFthWzFdLCBbYVswXSwgQGxpbmUoYVsxXSkubGVuZ3RoXV1cbiAgICAgICAgICAgIGlmIGJbMV0gLSBhWzFdID4gMVxuICAgICAgICAgICAgICAgIGZvciBpIGluIFthWzFdKzEuLi5iWzFdXVxuICAgICAgICAgICAgICAgICAgICByLnB1c2ggW2ksIFswLEBsaW5lKGkpLmxlbmd0aF1dXG4gICAgICAgICAgICByLnB1c2ggW2JbMV0sIFswLCBleHRlbmQgYW5kIGJbMF0gPT0gMCBhbmQgQGxpbmUoYlsxXSkubGVuZ3RoIG9yIGJbMF1dXVxuICAgICAgICByXG5cbiAgICByYW5nZXNGb3JMaW5lc0Zyb21Ub3BUb0JvdDogKHRvcCxib3QpIC0+XG4gICAgICAgIHIgPSBbXVxuICAgICAgICBpciA9IFt0b3AsYm90XVxuICAgICAgICBmb3IgbGkgaW4gW3N0YXJ0T2YoaXIpLi4uZW5kT2YoaXIpXVxuICAgICAgICAgICAgci5wdXNoIEByYW5nZUZvckxpbmVBdEluZGV4IGxpXG4gICAgICAgIHJcblxuICAgIHJhbmdlc0ZvclRleHQ6ICh0LCBvcHQpIC0+XG4gICAgICAgIHQgPSB0LnNwbGl0KCdcXG4nKVswXVxuICAgICAgICByID0gW11cbiAgICAgICAgZm9yIGxpIGluIFswLi4uQG51bUxpbmVzKCldXG4gICAgICAgICAgICByID0gci5jb25jYXQgQHJhbmdlc0ZvclRleHRJbkxpbmVBdEluZGV4IHQsIGxpLCBvcHRcbiAgICAgICAgICAgIGJyZWFrIGlmIHIubGVuZ3RoID49IChvcHQ/Lm1heCA/IDk5OSlcbiAgICAgICAgclxuXG4gICAgcmFuZ2VzRm9yVGV4dEluTGluZUF0SW5kZXg6ICh0LCBpLCBvcHQpIC0+XG4gICAgICAgIHIgPSBbXVxuICAgICAgICB0eXBlID0gb3B0Py50eXBlID8gJ3N0cidcbiAgICAgICAgc3dpdGNoIHR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2Z1enp5J1xuICAgICAgICAgICAgICAgIHJlID0gbmV3IFJlZ0V4cCBcIlxcXFx3K1wiLCAnZydcbiAgICAgICAgICAgICAgICB3aGlsZSAobXRjaCA9IHJlLmV4ZWMoQGxpbmUoaSkpKSAhPSBudWxsXG4gICAgICAgICAgICAgICAgICAgIHIucHVzaCBbaSwgW210Y2guaW5kZXgsIHJlLmxhc3RJbmRleF1dIGlmIGZ1enp5LnRlc3QgdCwgQGxpbmUoaSkuc2xpY2UgbXRjaC5pbmRleCwgcmUubGFzdEluZGV4XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdCA9IF8uZXNjYXBlUmVnRXhwIHQgaWYgdHlwZSBpbiBbJ3N0cicsICdTdHInLCAnZ2xvYiddXG4gICAgICAgICAgICAgICAgaWYgdHlwZSBpcyAnZ2xvYidcbiAgICAgICAgICAgICAgICAgICAgdCA9IHQucmVwbGFjZSBuZXcgUmVnRXhwKFwiXFxcXCpcIiwgJ2cnKSwgXCJcXHcqXCJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHIgaWYgbm90IHQubGVuZ3RoXG5cbiAgICAgICAgICAgICAgICBybmdzID0gbWF0Y2hyLnJhbmdlcyB0LCBAbGluZShpKSwgdHlwZSBpbiBbJ3N0cicsICdyZWcnLCAnZ2xvYiddIGFuZCAnaScgb3IgJydcbiAgICAgICAgICAgICAgICBmb3Igcm5nIGluIHJuZ3NcbiAgICAgICAgICAgICAgICAgICAgci5wdXNoIFtpLCBbcm5nLnN0YXJ0LCBybmcuc3RhcnQgKyBybmcubWF0Y2gubGVuZ3RoXV1cbiAgICAgICAgclxuXG4gICAgcmFuZ2VzT2ZTdHJpbmdzSW5MaW5lQXRJbmRleDogKGxpKSAtPiAjIHRvZG86IGhhbmRsZSAje31cbiAgICAgICAgdCA9IEBsaW5lKGxpKVxuICAgICAgICByID0gW11cbiAgICAgICAgc3MgPSAtMVxuICAgICAgICBjYyA9IG51bGxcbiAgICAgICAgZm9yIGkgaW4gWzAuLi50Lmxlbmd0aF1cbiAgICAgICAgICAgIGMgPSB0W2ldXG4gICAgICAgICAgICBpZiBub3QgY2MgYW5kIGMgaW4gXCInXFxcIlwiXG4gICAgICAgICAgICAgICAgY2MgPSBjXG4gICAgICAgICAgICAgICAgc3MgPSBpXG4gICAgICAgICAgICBlbHNlIGlmIGMgPT0gY2NcbiAgICAgICAgICAgICAgICBpZiAodFtpLTFdICE9ICdcXFxcJykgb3IgKGk+MiBhbmQgdFtpLTJdID09ICdcXFxcJylcbiAgICAgICAgICAgICAgICAgICAgci5wdXNoIFtsaSwgW3NzLCBpKzFdXVxuICAgICAgICAgICAgICAgICAgICBjYyA9IG51bGxcbiAgICAgICAgICAgICAgICAgICAgc3MgPSAtMVxuICAgICAgICByXG5cbm1vZHVsZS5leHBvcnRzID0gQnVmZmVyXG4iXX0=
//# sourceURL=../../coffee/editor/buffer.coffee