// koffee 1.4.0

/*
 0000000   0000000   000      000000000  00000000  00000000   
000       000   000  000         000     000       000   000  
0000000   000000000  000         000     0000000   0000000    
     000  000   000  000         000     000       000   000  
0000000   000   000  0000000     000     00000000  000   000
 */
var _, salt;

_ = require('kxk')._;

salt = require('../../tools/salt');

module.exports = {
    actions: {
        menu: 'Misc',
        startSalter: {
            name: 'ASCII Header Mode',
            text: "if cursor is not in ascii-header: \ninsert ascii-header of text in selection or word at cursor.\nswitch to ascii-header mode in any case.",
            combo: 'command+3',
            accel: 'ctrl+3'
        }
    },
    startSalter: function(opt) {
        var ci, col, cols, cp, indt, j, len, li, newCursors, r, ref, rgs, s, stxt, word;
        cp = this.cursorPos();
        if (!(opt != null ? opt.word : void 0) && (rgs = this.salterRangesAtPos(cp))) {
            cols = this.columnsInSalt((function() {
                var j, len, results;
                results = [];
                for (j = 0, len = rgs.length; j < len; j++) {
                    r = rgs[j];
                    results.push(this.textInRange(r));
                }
                return results;
            }).call(this));
            ci = 0;
            while (ci < cols.length && cp[0] > cols[ci]) {
                ci += 1;
            }
            col = cols[ci];
            this["do"].start();
            newCursors = (function() {
                var j, len, results;
                results = [];
                for (j = 0, len = rgs.length; j < len; j++) {
                    r = rgs[j];
                    results.push([col, r[0]]);
                }
                return results;
            })();
            this["do"].setCursors(newCursors, {
                main: 'last'
            });
            this["do"].select([]);
            this["do"].end();
        } else {
            word = (ref = opt != null ? opt.word : void 0) != null ? ref : this.selectionTextOrWordAtCursor().trim();
            if (this.textInRange(this.rangeForLineAtIndex(cp[1])).trim().length) {
                indt = _.padStart('', this.indentationAtLineIndex(cp[1]));
            } else {
                indt = this.indentStringForLineAtIndex(cp[1]);
            }
            stxt = word.length && salt(word).split('\n') || ['', '', '', '', ''];
            stxt = (function() {
                var j, len, results;
                results = [];
                for (j = 0, len = stxt.length; j < len; j++) {
                    s = stxt[j];
                    results.push("" + indt + this.lineComment + " " + s + "  ");
                }
                return results;
            }).call(this);
            this["do"].start();
            newCursors = [];
            li = cp[1];
            for (j = 0, len = stxt.length; j < len; j++) {
                s = stxt[j];
                this["do"].insert(li, s);
                if (s.endsWith(this.lineComment + "   ")) {
                    newCursors.push([s.length - 2, li]);
                } else {
                    newCursors.push([s.length, li]);
                }
                li += 1;
            }
            this["do"].setCursors(newCursors, {
                main: 'last'
            });
            this["do"].select([]);
            this["do"].end();
        }
        return this.setSalterMode(true);
    },
    endSalter: function() {
        return this.setSalterMode(false);
    },
    setSalterMode: function(active) {
        var ref, ref1;
        if (active == null) {
            active = true;
        }
        this.salterMode = active;
        return (ref = this.layerDict) != null ? (ref1 = ref['cursors']) != null ? ref1.classList.toggle("salterMode", active) : void 0 : void 0;
    },
    insertSalterCharacter: function(ch) {
        var char, s, salted;
        if (ch === ' ') {
            char = ['    ', '    ', '    ', '    ', '    '];
        } else {
            char = salt(ch).split('\n');
        }
        if (char.length === 5) {
            salted = ((function() {
                var j, len, results;
                results = [];
                for (j = 0, len = char.length; j < len; j++) {
                    s = char[j];
                    results.push(s + "  ");
                }
                return results;
            })()).join('\n');
            this.pasteText(salted);
        } else {
            this.setSalterMode(false);
        }
        return true;
    },
    deleteSalterCharacter: function() {
        var ci, cols, cp, j, len, length, r, rgs, slt;
        if (!this.salterMode) {
            return;
        }
        this["do"].start();
        cp = this["do"].mainCursor();
        if (rgs = this.salterRangesAtPos(cp)) {
            slt = (function() {
                var j, len, results;
                results = [];
                for (j = 0, len = rgs.length; j < len; j++) {
                    r = rgs[j];
                    results.push(this["do"].textInRange(r));
                }
                return results;
            }).call(this);
            cols = this.columnsInSalt(slt);
            ci = cols.length - 1;
            while (ci > 0 && cols[ci - 1] >= cp[0]) {
                ci -= 1;
            }
            if (ci > 0) {
                length = cols[ci] - cols[ci - 1];
                for (j = 0, len = rgs.length; j < len; j++) {
                    r = rgs[j];
                    this["do"].change(r[0], this["do"].line(r[0]).splice(cols[ci - 1], length));
                }
                this["do"].setCursors((function() {
                    var k, len1, results;
                    results = [];
                    for (k = 0, len1 = rgs.length; k < len1; k++) {
                        r = rgs[k];
                        results.push([cols[ci - 1], r[0]]);
                    }
                    return results;
                })());
            }
        }
        return this["do"].end();
    },
    checkSalterMode: function() {
        var cols, cs, r, rgs;
        if (this.salterMode) {
            this.setSalterMode(false);
            if (this["do"].numCursors() === 5 && positionsInContinuousLine(this["do"].cursors())) {
                cs = this["do"].cursors();
                rgs = this.salterRangesAtPos(this["do"].mainCursor());
                if ((rgs == null) || rgs[0][0] !== cs[0][1]) {
                    return;
                }
                cols = this.columnsInSalt((function() {
                    var j, len, results;
                    results = [];
                    for (j = 0, len = rgs.length; j < len; j++) {
                        r = rgs[j];
                        results.push(this["do"].textInRange(r));
                    }
                    return results;
                }).call(this));
                if (cs[0][0] < cols[0]) {
                    return;
                }
                return this.setSalterMode(true);
            }
        }
    },
    salterRangesAtPos: function(p) {
        var li, rgs, salterRegExp, state;
        salterRegExp = this.syntax.balancer.headerRegExp;
        rgs = [];
        li = p[1];
        state = this["do"].isDoing() && this["do"].state || this.state;
        while (rgs.length < 5 && li < state.numLines() && salterRegExp.test(state.line(li))) {
            rgs.push([li, [0, state.line(li).length]]);
            li += 1;
        }
        if (!rgs.length) {
            return;
        }
        li = p[1] - 1;
        while (rgs.length < 5 && li >= 0 && salterRegExp.test(state.line(li))) {
            rgs.unshift([li, [0, state.line(li).length]]);
            li -= 1;
        }
        if (rgs.length === 5) {
            return rgs;
        }
    },
    columnsInSalt: function(slt) {
        var col, cols, i, j, k, max, min, ref, ref1, ref2, s;
        min = _.min((function() {
            var j, len, results;
            results = [];
            for (j = 0, len = slt.length; j < len; j++) {
                s = slt[j];
                results.push(s.search(/0/));
            }
            return results;
        })());
        if (min < 0) {
            min = _.min((function() {
                var j, len, results;
                results = [];
                for (j = 0, len = slt.length; j < len; j++) {
                    s = slt[j];
                    results.push(s.search(/#/) + 1);
                }
                return results;
            })());
            return [min];
        }
        max = _.max((function() {
            var j, len, results;
            results = [];
            for (j = 0, len = slt.length; j < len; j++) {
                s = slt[j];
                results.push(s.length);
            }
            return results;
        })());
        cols = [min, max];
        for (col = j = ref = min, ref1 = max; ref <= ref1 ? j <= ref1 : j >= ref1; col = ref <= ref1 ? ++j : --j) {
            s = 0;
            for (i = k = 0; k < 5; i = ++k) {
                if ((ref2 = slt[i].substr(col - 2, 2)) === '  ' || ref2 === '# ') {
                    s += 1;
                }
            }
            if (s === 5) {
                cols.push(col);
            }
        }
        return _.sortBy(_.uniq(cols));
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FsdGVyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRRSxJQUFNLE9BQUEsQ0FBUSxLQUFSOztBQUVSLElBQUEsR0FBTyxPQUFBLENBQVEsa0JBQVI7O0FBRVAsTUFBTSxDQUFDLE9BQVAsR0FFSTtJQUFBLE9BQUEsRUFFSTtRQUFBLElBQUEsRUFBTSxNQUFOO1FBRUEsV0FBQSxFQUNJO1lBQUEsSUFBQSxFQUFNLG1CQUFOO1lBQ0EsSUFBQSxFQUFNLDJJQUROO1lBS0EsS0FBQSxFQUFPLFdBTFA7WUFNQSxLQUFBLEVBQU8sUUFOUDtTQUhKO0tBRko7SUFtQkEsV0FBQSxFQUFhLFNBQUMsR0FBRDtBQUVULFlBQUE7UUFBQSxFQUFBLEdBQUssSUFBQyxDQUFBLFNBQUQsQ0FBQTtRQUVMLElBQUcsZ0JBQUksR0FBRyxDQUFFLGNBQVQsSUFBa0IsQ0FBQSxHQUFBLEdBQU0sSUFBQyxDQUFBLGlCQUFELENBQW1CLEVBQW5CLENBQU4sQ0FBckI7WUFFSSxJQUFBLEdBQU8sSUFBQyxDQUFBLGFBQUQ7O0FBQWdCO3FCQUFBLHFDQUFBOztpQ0FBQSxJQUFDLENBQUEsV0FBRCxDQUFhLENBQWI7QUFBQTs7eUJBQWhCO1lBQ1AsRUFBQSxHQUFLO0FBQ0wsbUJBQU0sRUFBQSxHQUFLLElBQUksQ0FBQyxNQUFWLElBQXFCLEVBQUcsQ0FBQSxDQUFBLENBQUgsR0FBUSxJQUFLLENBQUEsRUFBQSxDQUF4QztnQkFDSSxFQUFBLElBQU07WUFEVjtZQUVBLEdBQUEsR0FBTSxJQUFLLENBQUEsRUFBQTtZQUNYLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxLQUFKLENBQUE7WUFDQSxVQUFBOztBQUFjO3FCQUFBLHFDQUFBOztpQ0FBQSxDQUFDLEdBQUQsRUFBTSxDQUFFLENBQUEsQ0FBQSxDQUFSO0FBQUE7OztZQUNkLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxVQUFKLENB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QUFaO1lBQ0EsRUFBQSxJQUFNO1FBRlY7UUFHQSxJQUFjLEdBQUcsQ0FBQyxNQUFKLEtBQWMsQ0FBNUI7QUFBQSxtQkFBTyxJQUFQOztJQWZlLENBMUluQjtJQWlLQSxhQUFBLEVBQWUsU0FBQyxHQUFEO0FBRVgsWUFBQTtRQUFBLEdBQUEsR0FBTSxDQUFDLENBQUMsR0FBRjs7QUFBTztpQkFBQSxxQ0FBQTs7NkJBQUEsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxHQUFUO0FBQUE7O1lBQVA7UUFDTixJQUFHLEdBQUEsR0FBTSxDQUFUO1lBQ0ksR0FBQSxHQUFNLENBQUMsQ0FBQyxHQUFGOztBQUFPO3FCQUFBLHFDQUFBOztpQ0FBQSxDQUFDLENBQUMsTUFBRixDQUFTLEdBQVQsQ0FBQSxHQUFjO0FBQWQ7O2dCQUFQO0FBQ04sbUJBQU8sQ0FBQyxHQUFELEVBRlg7O1FBR0EsR0FBQSxHQUFNLENBQUMsQ0FBQyxHQUFGOztBQUFPO2lCQUFBLHFDQUFBOzs2QkFBQSxDQUFDLENBQUM7QUFBRjs7WUFBUDtRQUNOLElBQUEsR0FBTyxDQUFDLEdBQUQsRUFBTSxHQUFOO0FBQ1AsYUFBVyxtR0FBWDtZQUNJLENBQUEsR0FBSTtBQUNKLGlCQUFTLHlCQUFUO2dCQUNJLFlBQVUsR0FBSSxDQUFBLENBQUEsQ0FBRSxDQUFDLE1BQVAsQ0FBYyxHQUFBLEdBQUksQ0FBbEIsRUFBcUIsQ0FBckIsRUFBQSxLQUE0QixJQUE1QixJQUFBLElBQUEsS0FBa0MsSUFBNUM7b0JBQUEsQ0FBQSxJQUFLLEVBQUw7O0FBREo7WUFFQSxJQUFrQixDQUFBLEtBQUssQ0FBdkI7Z0JBQUEsSUFBSSxDQUFDLElBQUwsQ0FBVSxHQUFWLEVBQUE7O0FBSko7ZUFLQSxDQUFDLENBQUMsTUFBRixDQUFTLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBUCxDQUFUO0lBYlcsQ0FqS2YiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgICAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbnsgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5zYWx0ID0gcmVxdWlyZSAnLi4vLi4vdG9vbHMvc2FsdCdcblxubW9kdWxlLmV4cG9ydHMgPVxuICAgIFxuICAgIGFjdGlvbnM6XG4gICAgICAgIFxuICAgICAgICBtZW51OiAnTWlzYydcbiAgICAgICAgXG4gICAgICAgIHN0YXJ0U2FsdGVyOlxuICAgICAgICAgICAgbmFtZTogJ0FTQ0lJIEhlYWRlciBNb2RlJ1xuICAgICAgICAgICAgdGV4dDogXCJcIlwiaWYgY3Vyc29yIGlzIG5vdCBpbiBhc2NpaS1oZWFkZXI6IFxuICAgICAgICAgICAgICAgIGluc2VydCBhc2NpaS1oZWFkZXIgb2YgdGV4dCBpbiBzZWxlY3Rpb24gb3Igd29yZCBhdCBjdXJzb3IuXG4gICAgICAgICAgICAgICAgc3dpdGNoIHRvIGFzY2lpLWhlYWRlciBtb2RlIGluIGFueSBjYXNlLlxuICAgICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kKzMnXG4gICAgICAgICAgICBhY2NlbDogJ2N0cmwrMydcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBzdGFydFNhbHRlcjogKG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIGNwID0gQGN1cnNvclBvcygpXG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgb3B0Py53b3JkIGFuZCByZ3MgPSBAc2FsdGVyUmFuZ2VzQXRQb3MgY3AgIyBlZGl0IGV4aXN0aW5nIGhlYWRlclxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb2xzID0gQGNvbHVtbnNJblNhbHQgKEB0ZXh0SW5SYW5nZSByIGZvciByIGluIHJncylcbiAgICAgICAgICAgIGNpID0gMFxuICAgICAgICAgICAgd2hpbGUgY2kgPCBjb2xzLmxlbmd0aCBhbmQgY3BbMF0gPiBjb2xzW2NpXVxuICAgICAgICAgICAgICAgIGNpICs9IDFcbiAgICAgICAgICAgIGNvbCA9IGNvbHNbY2ldXG4gICAgICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICAgICAgbmV3Q3Vyc29ycyA9IChbY29sLCByWzBdXSBmb3IgciBpbiByZ3MpXG4gICAgICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzLCBtYWluOiAnbGFzdCdcbiAgICAgICAgICAgIEBkby5zZWxlY3QgW11cbiAgICAgICAgICAgIEBkby5lbmQoKVxuICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgIyBjcmVhdGUgbmV3IGhlYWRlclxuICAgICAgICAgICAgXG4gICAgICAgICAgICB3b3JkID0gb3B0Py53b3JkID8gQHNlbGVjdGlvblRleHRPcldvcmRBdEN1cnNvcigpLnRyaW0oKVxuICAgICAgICAgICAgaWYgQHRleHRJblJhbmdlKEByYW5nZUZvckxpbmVBdEluZGV4IGNwWzFdKS50cmltKCkubGVuZ3RoXG4gICAgICAgICAgICAgICAgaW5kdCA9IF8ucGFkU3RhcnQgJycsIEBpbmRlbnRhdGlvbkF0TGluZUluZGV4IGNwWzFdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaW5kdCA9IEBpbmRlbnRTdHJpbmdGb3JMaW5lQXRJbmRleCBjcFsxXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgc3R4dCA9IHdvcmQubGVuZ3RoIGFuZCBzYWx0KHdvcmQpLnNwbGl0KCdcXG4nKSBvciBbJycsICcnLCAnJywgJycsICcnXVxuICAgICAgICAgICAgc3R4dCA9IChcIiN7aW5kdH0je0BsaW5lQ29tbWVudH0gI3tzfSAgXCIgZm9yIHMgaW4gc3R4dClcbiAgICAgICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgICAgICBuZXdDdXJzb3JzID0gW11cbiAgICAgICAgICAgIGxpID0gY3BbMV1cbiAgICAgICAgICAgIGZvciBzIGluIHN0eHRcbiAgICAgICAgICAgICAgICBAZG8uaW5zZXJ0IGxpLCBzXG4gICAgICAgICAgICAgICAgaWYgcy5lbmRzV2l0aCBcIiN7QGxpbmVDb21tZW50fSAgIFwiXG4gICAgICAgICAgICAgICAgICAgIG5ld0N1cnNvcnMucHVzaCBbcy5sZW5ndGgtMiwgbGldXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBuZXdDdXJzb3JzLnB1c2ggW3MubGVuZ3RoLCBsaV1cbiAgICAgICAgICAgICAgICBsaSArPSAxXG4gICAgICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzLCBtYWluOiAnbGFzdCdcbiAgICAgICAgICAgIEBkby5zZWxlY3QgW11cbiAgICAgICAgICAgIEBkby5lbmQoKVxuICAgICAgICBAc2V0U2FsdGVyTW9kZSB0cnVlXG5cbiAgICBlbmRTYWx0ZXI6IC0+IEBzZXRTYWx0ZXJNb2RlIGZhbHNlXG4gICAgc2V0U2FsdGVyTW9kZTogKGFjdGl2ZT10cnVlKSAtPlxuICAgICAgICBAc2FsdGVyTW9kZSA9IGFjdGl2ZVxuICAgICAgICBAbGF5ZXJEaWN0P1snY3Vyc29ycyddPy5jbGFzc0xpc3QudG9nZ2xlIFwic2FsdGVyTW9kZVwiLCBhY3RpdmVcbiAgICAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBpbnNlcnRTYWx0ZXJDaGFyYWN0ZXI6IChjaCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGNoID09ICcgJ1xuICAgICAgICAgICAgY2hhciA9IFsnICAgICcsICcgICAgJywgJyAgICAnLCAnICAgICcsICcgICAgJ11cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY2hhciA9IHNhbHQoY2gpLnNwbGl0ICdcXG4nXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgY2hhci5sZW5ndGggPT0gNVxuICAgICAgICAgICAgc2FsdGVkID0gKFwiI3tzfSAgXCIgZm9yIHMgaW4gY2hhcikuam9pbiAnXFxuJ1xuICAgICAgICAgICAgQHBhc3RlVGV4dCBzYWx0ZWRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHNldFNhbHRlck1vZGUgZmFsc2VcbiAgICAgICAgICAgIFxuICAgICAgICB0cnVlXG4gICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgZGVsZXRlU2FsdGVyQ2hhcmFjdGVyOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAc2FsdGVyTW9kZVxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgY3AgPSBAZG8ubWFpbkN1cnNvcigpXG4gICAgICAgIGlmIHJncyA9IEBzYWx0ZXJSYW5nZXNBdFBvcyBjcFxuICAgICAgICAgICAgc2x0ID0gKEBkby50ZXh0SW5SYW5nZSByIGZvciByIGluIHJncylcbiAgICAgICAgICAgIGNvbHMgPSBAY29sdW1uc0luU2FsdCBzbHRcbiAgICAgICAgICAgIGNpID0gY29scy5sZW5ndGgtMVxuICAgICAgICAgICAgd2hpbGUgY2kgPiAwIGFuZCBjb2xzW2NpLTFdID49IGNwWzBdXG4gICAgICAgICAgICAgICAgY2kgLT0gMVxuICAgICAgICAgICAgaWYgY2kgPiAwXG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gY29sc1tjaV0tY29sc1tjaS0xXVxuICAgICAgICAgICAgICAgIGZvciByIGluIHJnc1xuICAgICAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIHJbMF0sIEBkby5saW5lKHJbMF0pLnNwbGljZSBjb2xzW2NpLTFdLCBsZW5ndGhcbiAgICAgICAgICAgICAgICBAZG8uc2V0Q3Vyc29ycyAoW2NvbHNbY2ktMV0sIHJbMF1dIGZvciByIGluIHJncylcbiAgICAgICAgQGRvLmVuZCgpXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgY2hlY2tTYWx0ZXJNb2RlOiAtPiBcbiAgICAgICAgXG4gICAgICAgIGlmIEBzYWx0ZXJNb2RlXG4gICAgICAgIFxuICAgICAgICAgICAgQHNldFNhbHRlck1vZGUgZmFsc2VcbiAgICAgICAgXG4gICAgICAgICAgICBpZiBAZG8ubnVtQ3Vyc29ycygpID09IDUgYW5kIHBvc2l0aW9uc0luQ29udGludW91c0xpbmUgQGRvLmN1cnNvcnMoKVxuICAgICAgICAgICAgICAgIGNzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICAgICAgICAgIHJncyA9IEBzYWx0ZXJSYW5nZXNBdFBvcyBAZG8ubWFpbkN1cnNvcigpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIG5vdCByZ3M/IG9yIHJnc1swXVswXSAhPSBjc1swXVsxXVxuICAgICAgICAgICAgICAgIGNvbHMgPSBAY29sdW1uc0luU2FsdCAoQGRvLnRleHRJblJhbmdlKHIpIGZvciByIGluIHJncylcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgY3NbMF1bMF0gPCBjb2xzWzBdXG4gICAgICAgICAgICAgICAgQHNldFNhbHRlck1vZGUgdHJ1ZVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBzYWx0ZXJSYW5nZXNBdFBvczogKHApIC0+XG4gICAgICAgIFxuICAgICAgICAjIHNhbHRlclJlZ0V4cCA9IG5ldyBSZWdFeHAgXCJeKFxcXFxzKiN7Xy5lc2NhcGVSZWdFeHAgQGxpbmVDb21tZW50fSk/XFxcXHMqMFswXFxcXHNdKyRcIlxuICAgICAgICBzYWx0ZXJSZWdFeHAgPSBAc3ludGF4LmJhbGFuY2VyLmhlYWRlclJlZ0V4cFxuICAgICAgICByZ3MgPSBbXVxuICAgICAgICBsaSA9IHBbMV1cbiAgICAgICAgc3RhdGUgPSBAZG8uaXNEb2luZygpIGFuZCBAZG8uc3RhdGUgb3IgQHN0YXRlXG4gICAgICAgIHdoaWxlIHJncy5sZW5ndGggPCA1IGFuZCBsaSA8IHN0YXRlLm51bUxpbmVzKCkgYW5kIHNhbHRlclJlZ0V4cC50ZXN0IHN0YXRlLmxpbmUobGkpXG4gICAgICAgICAgICByZ3MucHVzaCBbbGksIFswLCBzdGF0ZS5saW5lKGxpKS5sZW5ndGhdXSBcbiAgICAgICAgICAgIGxpICs9IDFcbiAgICAgICAgcmV0dXJuIGlmIG5vdCByZ3MubGVuZ3RoXG4gICAgICAgIGxpID0gcFsxXS0xXG4gICAgICAgIHdoaWxlIHJncy5sZW5ndGggPCA1IGFuZCBsaSA+PSAwIGFuZCBzYWx0ZXJSZWdFeHAudGVzdCBzdGF0ZS5saW5lKGxpKVxuICAgICAgICAgICAgcmdzLnVuc2hpZnQgW2xpLCBbMCwgc3RhdGUubGluZShsaSkubGVuZ3RoXV1cbiAgICAgICAgICAgIGxpIC09IDFcbiAgICAgICAgcmV0dXJuIHJncyBpZiByZ3MubGVuZ3RoID09IDVcbiAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGNvbHVtbnNJblNhbHQ6IChzbHQpIC0+XG4gICAgICAgIFxuICAgICAgICBtaW4gPSBfLm1pbiAocy5zZWFyY2ggLzAvIGZvciBzIGluIHNsdClcbiAgICAgICAgaWYgbWluIDwgMFxuICAgICAgICAgICAgbWluID0gXy5taW4gKHMuc2VhcmNoKC8jLykrMSBmb3IgcyBpbiBzbHQpXG4gICAgICAgICAgICByZXR1cm4gW21pbl1cbiAgICAgICAgbWF4ID0gXy5tYXggKHMubGVuZ3RoIGZvciBzIGluIHNsdClcbiAgICAgICAgY29scyA9IFttaW4sIG1heF1cbiAgICAgICAgZm9yIGNvbCBpbiBbbWluLi5tYXhdXG4gICAgICAgICAgICBzID0gMFxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi41XVxuICAgICAgICAgICAgICAgIHMgKz0gMSBpZiBzbHRbaV0uc3Vic3RyKGNvbC0yLCAyKSBpbiBbJyAgJywgJyMgJ11cbiAgICAgICAgICAgIGNvbHMucHVzaChjb2wpIGlmIHMgPT0gNVxuICAgICAgICBfLnNvcnRCeSBfLnVuaXEgY29sc1xuIl19
//# sourceURL=../../../coffee/editor/actions/salter.coffee