// koffee 1.4.0

/*
 0000000  000000000  00000000   000  000   000   0000000    0000000
000          000     000   000  000  0000  000  000        000     
0000000      000     0000000    000  000 0 000  000  0000  0000000 
     000     000     000   000  000  000  0000  000   000       000
0000000      000     000   000  000  000   000   0000000   0000000
 */
var Strings, _, matchr, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), matchr = ref.matchr, _ = ref._;

Strings = (function() {
    function Strings(editor) {
        this.editor = editor;
        this.onCursor = bind(this.onCursor, this);
        this.setupConfig = bind(this.setupConfig, this);
        this.editor.on('cursor', this.onCursor);
        this.editor.on('fileTypeChanged', this.setupConfig);
        this.setupConfig();
    }

    Strings.prototype.setupConfig = function() {
        var a, p;
        return this.config = (function() {
            var ref1, results;
            ref1 = this.editor.stringCharacters;
            results = [];
            for (p in ref1) {
                a = ref1[p];
                results.push([new RegExp(_.escapeRegExp(p)), a]);
            }
            return results;
        }).call(this);
    };

    Strings.prototype.onCursor = function() {
        var h, j, len, ref1;
        if (this.editor.numHighlights()) {
            ref1 = this.editor.highlights();
            for (j = 0, len = ref1.length; j < len; j++) {
                h = ref1[j];
                if (h[2] == null) {
                    return;
                }
            }
        }
        if (this.highlightInside(this.editor.cursorPos())) {
            return;
        }
        this.clear();
        return this.editor.renderHighlights();
    };

    Strings.prototype.highlightInside = function(pos) {
        var cp, i, j, li, line, pair, pairs, ref1, ref2, ref3, rngs, stack, ths;
        stack = [];
        pairs = [];
        pair = null;
        cp = pos[0], li = pos[1];
        line = this.editor.line(li);
        rngs = matchr.ranges(this.config, line);
        if (!rngs.length) {
            return;
        }
        for (i = j = 0, ref1 = rngs.length; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            ths = rngs[i];
            if (ths.start > 0 && line[ths.start - 1] === '\\') {
                if (ths.start - 1 <= 0 || line[ths.start - 2] !== '\\') {
                    continue;
                }
            }
            if ((((ref2 = _.last(stack)) != null ? ref2.match : void 0) === "'" && "'" === ths.match) && _.last(stack).start === ths.start - 1) {
                stack.pop();
                continue;
            }
            if (((ref3 = _.last(stack)) != null ? ref3.match : void 0) === ths.match) {
                pairs.push([stack.pop(), ths]);
                if (pair == null) {
                    if ((_.last(pairs)[0].start <= cp && cp <= ths.start + 1)) {
                        pair = _.last(pairs);
                    }
                }
                continue;
            }
            if (stack.length > 1 && stack[stack.length - 2].match === ths.match) {
                stack.pop();
                pairs.push([stack.pop(), ths]);
                if (pair == null) {
                    if ((_.last(pairs)[0].start <= cp && cp <= ths.start + 1)) {
                        pair = _.last(pairs);
                    }
                }
                continue;
            }
            stack.push(ths);
        }
        if (pair != null) {
            this.highlight(pair, li);
            return true;
        }
    };

    Strings.prototype.highlight = function(pair, li) {
        var cls, opn;
        this.clear();
        opn = pair[0], cls = pair[1];
        pair[0].clss = "stringmatch " + this.editor.stringCharacters[opn.match];
        pair[1].clss = "stringmatch " + this.editor.stringCharacters[cls.match];
        this.editor.addHighlight([li, [opn.start, opn.start + opn.match.length], pair[0]]);
        this.editor.addHighlight([li, [cls.start, cls.start + cls.match.length], pair[1]]);
        return this.editor.renderHighlights();
    };

    Strings.prototype.clear = function() {
        return this.editor.setHighlights(this.editor.highlights().filter(function(h) {
            var ref1, ref2;
            return !((ref1 = h[2]) != null ? (ref2 = ref1.clss) != null ? ref2.startsWith('stringmatch') : void 0 : void 0);
        }));
    };

    return Strings;

})();

module.exports = Strings;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaW5ncy5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsdUJBQUE7SUFBQTs7QUFRQSxNQUFnQixPQUFBLENBQVEsS0FBUixDQUFoQixFQUFFLG1CQUFGLEVBQVU7O0FBRUo7SUFFQyxpQkFBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7OztRQUVBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFFBQVgsRUFBcUIsSUFBQyxDQUFBLFFBQXRCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsaUJBQVgsRUFBOEIsSUFBQyxDQUFBLFdBQS9CO1FBQ0EsSUFBQyxDQUFBLFdBQUQsQ0FBQTtJQUpEOztzQkFNSCxXQUFBLEdBQWEsU0FBQTtBQUNULFlBQUE7ZUFBQSxJQUFDLENBQUEsTUFBRDs7QUFBWTtBQUFBO2lCQUFBLFNBQUE7OzZCQUFBLENBQUMsSUFBSSxNQUFKLENBQVcsQ0FBQyxDQUFDLFlBQUYsQ0FBZSxDQUFmLENBQVgsQ0FBRCxFQUFnQyxDQUFoQztBQUFBOzs7SUFESDs7c0JBR2IsUUFBQSxHQUFVLFNBQUE7QUFDTixZQUFBO1FBQUEsSUFBRyxJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBQSxDQUFIO0FBQ0k7QUFBQSxpQkFBQSxzQ0FBQTs7Z0JBQ0ksSUFBYyxZQUFkO0FBQUEsMkJBQUE7O0FBREosYUFESjs7UUFJQSxJQUFVLElBQUMsQ0FBQSxlQUFELENBQWlCLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUixDQUFBLENBQWpCLENBQVY7QUFBQSxtQkFBQTs7UUFFQSxJQUFDLENBQUEsS0FBRCxDQUFBO2VBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUFBO0lBUk07O3NCQVVWLGVBQUEsR0FBaUIsU0FBQyxHQUFEO0FBQ2IsWUFBQTtRQUFBLEtBQUEsR0FBUTtRQUNSLEtBQUEsR0FBUTtRQUNSLElBQUEsR0FB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QyxZQUFSLENBQXFCLENBQUMsRUFBRCxFQUFLLENBQUMsR0FBRyxDQUFDLEtBQUwsRUFBWSxHQUFHLENBQUMsS0FBSixHQUFVLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBaEMsQ0FBTCxFQUE4QyxJQUFLLENBQUEsQ0FBQSxDQUFuRCxDQUFyQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsWUFBUixDQUFxQixDQUFDLEVBQUQsRUFBSyxDQUFDLEdBQUcsQ0FBQyxLQUFMLEVBQVksR0FBRyxDQUFDLEtBQUosR0FBVSxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQWhDLENBQUwsRUFBOEMsSUFBSyxDQUFBLENBQUEsQ0FBbkQsQ0FBckI7ZUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLGdCQUFSLENBQUE7SUFQTzs7c0JBU1gsS0FBQSxHQUFPLFNBQUE7ZUFDSCxJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBc0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQUEsQ0FBb0IsQ0FBQyxNQUFyQixDQUE0QixTQUFDLENBQUQ7QUFBTyxnQkFBQTttQkFBQSwyREFBYyxDQUFFLFVBQVosQ0FBdUIsYUFBdkI7UUFBWCxDQUE1QixDQUF0QjtJQURHOzs7Ozs7QUFHWCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMFxuMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgIFxuMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwIFxuICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAgIDAwMFxuMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwIFxuIyMjXG5cbnsgbWF0Y2hyLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIFN0cmluZ3NcbiAgICBcbiAgICBAOiAoQGVkaXRvcikgLT5cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3Iub24gJ2N1cnNvcicsIEBvbkN1cnNvclxuICAgICAgICBAZWRpdG9yLm9uICdmaWxlVHlwZUNoYW5nZWQnLCBAc2V0dXBDb25maWdcbiAgICAgICAgQHNldHVwQ29uZmlnKClcbiAgICAgICAgICAgIFxuICAgIHNldHVwQ29uZmlnOiA9PiBcbiAgICAgICAgQGNvbmZpZyA9ICggW25ldyBSZWdFeHAoXy5lc2NhcGVSZWdFeHAocCkpLCBhXSBmb3IgcCxhIG9mIEBlZGl0b3Iuc3RyaW5nQ2hhcmFjdGVycyApXG4gICAgICAgIFxuICAgIG9uQ3Vyc29yOiA9PlxuICAgICAgICBpZiBAZWRpdG9yLm51bUhpZ2hsaWdodHMoKSAjIGRvbid0IGhpZ2hsaWdodCBzdHJpbmdzIHdoZW4gb3RoZXIgaGlnaGxpZ2h0cyBleGlzdFxuICAgICAgICAgICAgZm9yIGggaW4gQGVkaXRvci5oaWdobGlnaHRzKClcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbm90IGhbMl0/XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAaGlnaGxpZ2h0SW5zaWRlIEBlZGl0b3IuY3Vyc29yUG9zKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGNsZWFyKClcbiAgICAgICAgQGVkaXRvci5yZW5kZXJIaWdobGlnaHRzKClcblxuICAgIGhpZ2hsaWdodEluc2lkZTogKHBvcykgLT5cbiAgICAgICAgc3RhY2sgPSBbXVxuICAgICAgICBwYWlycyA9IFtdXG4gICAgICAgIHBhaXIgID0gbnVsbFxuICAgICAgICBbY3AsIGxpXSA9IHBvc1xuICAgICAgICBsaW5lID0gQGVkaXRvci5saW5lKGxpKVxuICAgICAgICBybmdzID0gbWF0Y2hyLnJhbmdlcyBAY29uZmlnLCBsaW5lICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IHJuZ3MubGVuZ3RoXG4gICAgICAgIGZvciBpIGluIFswLi4ucm5ncy5sZW5ndGhdXG4gICAgICAgICAgICB0aHMgPSBybmdzW2ldXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHRocy5zdGFydCA+IDAgYW5kIGxpbmVbdGhzLnN0YXJ0LTFdID09ICdcXFxcJyBcbiAgICAgICAgICAgICAgICBpZiB0aHMuc3RhcnQtMSA8PSAwIG9yIGxpbmVbdGhzLnN0YXJ0LTJdICE9ICdcXFxcJ1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZSAjIGlnbm9yZSBlc2NhcGVkXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBfLmxhc3Qoc3RhY2spPy5tYXRjaCA9PSBcIidcIiA9PSB0aHMubWF0Y2ggYW5kIF8ubGFzdChzdGFjaykuc3RhcnQgPT0gdGhzLnN0YXJ0LTFcbiAgICAgICAgICAgICAgICBzdGFjay5wb3AoKSAjIHJlbW92ZSAnJ1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBfLmxhc3Qoc3RhY2spPy5tYXRjaCA9PSB0aHMubWF0Y2hcbiAgICAgICAgICAgICAgICBwYWlycy5wdXNoIFtzdGFjay5wb3AoKSwgdGhzXVxuICAgICAgICAgICAgICAgIGlmIG5vdCBwYWlyPyBcbiAgICAgICAgICAgICAgICAgICAgaWYgXy5sYXN0KHBhaXJzKVswXS5zdGFydCA8PSBjcCA8PSB0aHMuc3RhcnQrMVxuICAgICAgICAgICAgICAgICAgICAgICAgcGFpciA9IF8ubGFzdCBwYWlyc1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIGlmIHN0YWNrLmxlbmd0aCA+IDEgYW5kIHN0YWNrW3N0YWNrLmxlbmd0aC0yXS5tYXRjaCA9PSB0aHMubWF0Y2hcbiAgICAgICAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgIHBhaXJzLnB1c2ggW3N0YWNrLnBvcCgpLCB0aHNdXG4gICAgICAgICAgICAgICAgaWYgbm90IHBhaXI/IFxuICAgICAgICAgICAgICAgICAgICBpZiBfLmxhc3QocGFpcnMpWzBdLnN0YXJ0IDw9IGNwIDw9IHRocy5zdGFydCsxXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWlyID0gXy5sYXN0IHBhaXJzXG4gICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3RhY2sucHVzaCB0aHNcbiAgICAgICAgXG4gICAgICAgIGlmIHBhaXI/XG4gICAgICAgICAgICBAaGlnaGxpZ2h0IHBhaXIsIGxpXG4gICAgICAgICAgICB0cnVlXG4gICAgICAgIFxuICAgIGhpZ2hsaWdodDogKHBhaXIsIGxpKSAtPlxuICAgICAgICBAY2xlYXIoKVxuICAgICAgICBbb3BuLGNsc10gPSBwYWlyXG4gICAgICAgIHBhaXJbMF0uY2xzcyA9IFwic3RyaW5nbWF0Y2ggI3tAZWRpdG9yLnN0cmluZ0NoYXJhY3RlcnNbb3BuLm1hdGNoXX1cIlxuICAgICAgICBwYWlyWzFdLmNsc3MgPSBcInN0cmluZ21hdGNoICN7QGVkaXRvci5zdHJpbmdDaGFyYWN0ZXJzW2Nscy5tYXRjaF19XCJcbiAgICAgICAgQGVkaXRvci5hZGRIaWdobGlnaHQgW2xpLCBbb3BuLnN0YXJ0LCBvcG4uc3RhcnQrb3BuLm1hdGNoLmxlbmd0aF0sIHBhaXJbMF1dXG4gICAgICAgIEBlZGl0b3IuYWRkSGlnaGxpZ2h0IFtsaSwgW2Nscy5zdGFydCwgY2xzLnN0YXJ0K2Nscy5tYXRjaC5sZW5ndGhdLCBwYWlyWzFdXVxuICAgICAgICBAZWRpdG9yLnJlbmRlckhpZ2hsaWdodHMoKVxuICAgICAgICBcbiAgICBjbGVhcjogLT5cbiAgICAgICAgQGVkaXRvci5zZXRIaWdobGlnaHRzIEBlZGl0b3IuaGlnaGxpZ2h0cygpLmZpbHRlciAoaCkgLT4gbm90IGhbMl0/LmNsc3M/LnN0YXJ0c1dpdGggJ3N0cmluZ21hdGNoJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmluZ3NcbiJdfQ==
//# sourceURL=../../coffee/editor/strings.coffee