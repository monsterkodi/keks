// koffee 1.4.0

/*
0000000     0000000   000       0000000   000   000   0000000  00000000  00000000
000   000  000   000  000      000   000  0000  000  000       000       000   000
0000000    000000000  000      000000000  000 0 000  000       0000000   0000000
000   000  000   000  000      000   000  000  0000  000       000       000   000
0000000    000   000  0000000  000   000  000   000   0000000  00000000  000   000
 */
var Balancer, _, empty, kerror, klog, klor, matchr, ref;

ref = require('kxk'), matchr = ref.matchr, empty = ref.empty, kerror = ref.kerror, klog = ref.klog, _ = ref._;

klor = require('klor');

Balancer = (function() {
    function Balancer(syntax, getLine) {
        this.syntax = syntax;
        this.getLine = getLine;
        this.unbalanced = [];
        this.blocks = null;
    }

    Balancer.prototype.setLines = function(lines) {
        return this.blocks = klor.dissect(lines, this.syntax.name);
    };

    Balancer.prototype.setFileType = function(fileType) {
        var lineComment, multiComment;
        lineComment = (function() {
            switch (fileType) {
                case 'coffee':
                case 'koffee':
                case 'sh':
                case 'bat':
                case 'noon':
                case 'ko':
                case 'txt':
                case 'fish':
                    return '#';
                case 'styl':
                case 'cpp':
                case 'c':
                case 'h':
                case 'hpp':
                case 'cxx':
                case 'cs':
                case 'js':
                case 'scss':
                case 'ts':
                case 'swift':
                    return '//';
                case 'iss':
                case 'ini':
                    return ';';
            }
        })();
        multiComment = (function() {
            switch (fileType) {
                case 'coffee':
                case 'koffee':
                    return {
                        open: '###',
                        close: '###'
                    };
                case 'html':
                case 'md':
                    return {
                        open: '<!--',
                        close: '-->'
                    };
                case 'styl':
                case 'cpp':
                case 'c':
                case 'h':
                case 'hpp':
                case 'cxx':
                case 'cs':
                case 'js':
                case 'scss':
                case 'ts':
                case 'swift':
                    return {
                        open: '/*',
                        close: '*/'
                    };
            }
        })();
        this.regions = {
            doubleString: {
                clss: 'string double',
                open: '"',
                close: '"'
            }
        };
        if (lineComment) {
            this.regions.lineComment = {
                clss: 'comment',
                open: lineComment,
                close: null,
                force: true
            };
            this.headerRegExp = new RegExp("^(\\s*" + (_.escapeRegExp(this.regions.lineComment.open)) + "\\s*)?(\\s*0[0\\s]+)$");
        }
        if (multiComment) {
            this.regions.multiComment = {
                clss: 'comment triple',
                open: multiComment.open,
                close: multiComment.close,
                multi: true
            };
        }
        switch (fileType) {
            case 'coffee':
            case 'koffee':
                this.regions.multiString = {
                    clss: 'string triple',
                    open: '"""',
                    close: '"""',
                    multi: true
                };
                this.regions.multiString2 = {
                    clss: 'string triple skinny',
                    open: "'''",
                    close: "'''",
                    multi: true
                };
                this.regions.interpolation = {
                    clss: 'interpolation',
                    open: '#{',
                    close: '}',
                    multi: true
                };
                this.regions.singleString = {
                    clss: 'string single',
                    open: "'",
                    close: "'"
                };
                break;
            case 'js':
            case 'ts':
                this.regions.singleString = {
                    clss: 'string single',
                    open: "'",
                    close: "'"
                };
                break;
            case 'noon':
            case 'iss':
                this.regions.lineComment.solo = true;
                break;
            case 'md':
                this.regions.multiString = {
                    clss: 'string triple',
                    open: '```',
                    close: '```',
                    multi: true
                };
                this.regions.header5 = {
                    clss: 'markdown h5',
                    open: '#####',
                    close: null,
                    solo: true
                };
                this.regions.header4 = {
                    clss: 'markdown h4',
                    open: '####',
                    close: null,
                    solo: true
                };
                this.regions.header3 = {
                    clss: 'markdown h3',
                    open: '###',
                    close: null,
                    solo: true
                };
                this.regions.header2 = {
                    clss: 'markdown h2',
                    open: '##',
                    close: null,
                    solo: true
                };
                this.regions.header1 = {
                    clss: 'markdown h1',
                    open: '#',
                    close: null,
                    solo: true
                };
        }
        return this.openRegions = _.filter(this.regions, function(r) {
            return r.close === null;
        });
    };

    Balancer.prototype.dissForLine = function(li) {
        var r, ref1, text;
        text = this.getLine(li);
        if (text == null) {
            return kerror("dissForLine -- no line at index " + li + "?");
        }
        if ((ref1 = this.blocks) != null ? ref1[li] : void 0) {
            return this.blocks[li];
        }
        r = this.mergeRegions(this.parse(text, li), text, li);
        return r;
    };

    Balancer.prototype.dissForLineAndRanges = function(line, rgs) {
        var regions;
        regions = this.mergeRegions(this.parse(line, 0), line, 0);
        return matchr.merge(regions, matchr.dissect(rgs));
    };

    Balancer.prototype.mergeRegions = function(regions, text, li) {
        var addDiss, merged, p, region, unbalanced;
        unbalanced = this.getUnbalanced(li);
        merged = [];
        p = 0;
        addDiss = (function(_this) {
            return function(start, end, force) {
                var diss, slice;
                slice = text.slice(start, end);
                if (!force && (unbalanced != null) && _.last(unbalanced).region.clss !== 'interpolation') {
                    diss = _this.dissForClass(slice, 0, _.last(unbalanced).region.clss);
                } else {
                    if (end < text.length - 1) {
                        slice += ' x';
                        diss = _this.syntax.constructor.dissForTextAndSyntax(slice, _this.syntax.name);
                        diss.pop();
                    } else {
                        diss = _this.syntax.constructor.dissForTextAndSyntax(slice, _this.syntax.name);
                    }
                }
                if (start) {
                    _.each(diss, function(d) {
                        return d.start += start;
                    });
                }
                return merged = merged.concat(diss);
            };
        })(this);
        while (region = regions.shift()) {
            if (region.start > p) {
                addDiss(p, region.start);
            }
            if (region.clss === 'interpolation') {
                addDiss(region.start, region.start + region.match.length, true);
            } else {
                merged.push(region);
            }
            p = region.start + region.match.length;
        }
        if (p < text.length) {
            addDiss(p, text.length);
        }
        return merged;
    };

    Balancer.prototype.dissForClass = function(text, start, clss) {
        var c, diss, m, p, ref1, s;
        if ((ref1 = this.headerRegExp) != null ? ref1.test(text) : void 0) {
            clss += ' header';
        }
        diss = [];
        m = '';
        p = s = start;
        while (p < text.length) {
            c = text[p];
            p += 1;
            if (c !== ' ') {
                if (m === '') {
                    s = p - 1;
                }
                m += c;
                if (p < text.length) {
                    continue;
                }
            }
            if (m !== '') {
                diss.push({
                    start: s,
                    match: m,
                    value: clss
                });
                m = '';
            }
        }
        return diss;
    };


    /*
    00000000    0000000   00000000    0000000  00000000
    000   000  000   000  000   000  000       000
    00000000   000000000  0000000    0000000   0000000
    000        000   000  000   000       000  000
    000        000   000  000   000  0000000   00000000
     */

    Balancer.prototype.parse = function(text, li) {
        var ch, closeStackItem, escapes, forced, i, j, keepUnbalanced, len, len1, lineStartRegion, openRegion, p, popRegion, pushForceRegion, pushRegion, pushTop, pushed, realStack, ref1, ref2, ref3, ref4, rest, result, stack, top, unbalanced;
        p = 0;
        escapes = 0;
        stack = [];
        result = [];
        unbalanced = null;
        keepUnbalanced = [];
        if (unbalanced = this.getUnbalanced(li)) {
            for (i = 0, len = unbalanced.length; i < len; i++) {
                lineStartRegion = unbalanced[i];
                stack.push({
                    start: 0,
                    region: lineStartRegion.region,
                    fake: true
                });
            }
        }
        pushTop = function() {
            var advance, le, lr, oldmatch, ref1, results, split, top, word;
            if (top = _.last(stack)) {
                lr = _.last(result);
                le = (lr != null) && lr.start + lr.match.length || 0;
                if (p - 1 - le > 0 && le < text.length - 1) {
                    top = _.cloneDeep(top);
                    top.start = le;
                    top.match = text.slice(le, p - 1);
                    top.value = top.region.clss;
                    delete top.region;
                    advance = function() {
                        var results;
                        results = [];
                        while (top.match.length && top.match[0] === ' ') {
                            top.match = top.match.slice(1);
                            results.push(top.start += 1);
                        }
                        return results;
                    };
                    advance();
                    top.match = top.match.trimRight();
                    if (top.match.length) {
                        if ((ref1 = top.value) === 'string single' || ref1 === 'string double' || ref1 === 'string triple' || ref1 === 'string triple skinny') {
                            split = top.match.split(/\s\s+/);
                            if (split.length === 1) {
                                return result.push(top);
                            } else {
                                results = [];
                                while (word = split.shift()) {
                                    oldmatch = top.match;
                                    top.match = word;
                                    result.push(top);
                                    top = _.cloneDeep(top);
                                    top.start += word.length + 2;
                                    top.match = oldmatch.slice(word.length + 2);
                                    results.push(advance());
                                }
                                return results;
                            }
                        } else {
                            return result.push(top);
                        }
                    }
                }
            }
        };
        pushForceRegion = (function(_this) {
            return function(region) {
                var start;
                start = p - 1 + region.open.length;
                result.push({
                    start: p - 1,
                    match: region.open,
                    value: region.clss + ' marker'
                });
                if (start < text.length - 1) {
                    return result = result.concat(_this.dissForClass(text, start, region.clss));
                }
            };
        })(this);
        pushRegion = function(region) {
            pushTop();
            result.push({
                start: p - 1,
                match: region.open,
                value: region.clss + ' marker'
            });
            return stack.push({
                start: p - 1 + region.open.length,
                region: region
            });
        };
        popRegion = function(rest) {
            var top;
            top = _.last(stack);
            if (((top != null ? top.region.close : void 0) != null) && rest.startsWith(top.region.close)) {
                pushTop();
                stack.pop();
                if (top.fake) {
                    keepUnbalanced.unshift({
                        start: p - 1,
                        region: top.region
                    });
                }
                result.push({
                    start: p - 1,
                    value: top.region.clss + ' marker',
                    match: top.region.close
                });
                p += top.region.close.length - 1;
                return top;
            }
            return false;
        };
        while (p < text.length) {
            ch = text[p];
            p += 1;
            top = _.last(stack);
            if (ch === '\\') {
                escapes++;
            } else {
                if (ch === ' ') {
                    continue;
                }
                if (escapes) {
                    if (escapes % 2 && (ch !== "#" || top && top.region.value !== 'interpolation')) {
                        escapes = 0;
                        continue;
                    }
                    escapes = 0;
                }
                if (ch === ':') {
                    if (this.syntax.name === 'json') {
                        if (_.last(result).value === 'string double marker') {
                            if (result.length > 1 && result[result.length - 2].value === 'string double') {
                                result[result.length - 2].value = 'string dictionary key';
                                result.push({
                                    start: p - 1,
                                    match: ch,
                                    value: 'dictionary marker'
                                });
                                continue;
                            }
                        }
                    }
                }
            }
            rest = text.slice(p - 1);
            if (empty(top) || ((ref1 = top.region) != null ? ref1.clss : void 0) === 'interpolation') {
                if (popRegion(rest)) {
                    continue;
                }
                if (this.regions.multiComment && rest.startsWith(this.regions.multiComment.open)) {
                    pushRegion(this.regions.multiComment);
                    continue;
                } else if (this.regions.multiString && rest.startsWith(this.regions.multiString.open)) {
                    pushRegion(this.regions.multiString);
                    continue;
                } else if (this.regions.multiString2 && rest.startsWith(this.regions.multiString2.open)) {
                    pushRegion(this.regions.multiString2);
                    continue;
                } else if (empty(top)) {
                    forced = false;
                    pushed = false;
                    ref2 = this.openRegions;
                    for (j = 0, len1 = ref2.length; j < len1; j++) {
                        openRegion = ref2[j];
                        if (rest.startsWith(openRegion.open)) {
                            if ((openRegion.minX != null) && p - 1 < openRegion.minX) {
                                continue;
                            }
                            if ((openRegion.maxX != null) && p - 1 > openRegion.maxX) {
                                continue;
                            }
                            if (!openRegion.solo || empty(text.slice(0, p - 1).trim())) {
                                if (openRegion.force) {
                                    pushForceRegion(openRegion);
                                    forced = true;
                                } else {
                                    pushRegion(openRegion);
                                    pushed = true;
                                }
                                break;
                            }
                        }
                    }
                    if (forced) {
                        break;
                    }
                    if (pushed) {
                        continue;
                    }
                }
                if (this.regions.regexp && ch === this.regions.regexp.open) {
                    pushRegion(this.regions.regexp);
                    continue;
                }
                if (ch === ((ref3 = this.regions.singleString) != null ? ref3.open : void 0)) {
                    pushRegion(this.regions.singleString);
                    continue;
                }
                if (ch === this.regions.doubleString.open) {
                    pushRegion(this.regions.doubleString);
                    continue;
                }
            } else {
                if ((ref4 = top.region.clss) === 'string double' || ref4 === 'string triple') {
                    if (this.regions.interpolation && rest.startsWith(this.regions.interpolation.open)) {
                        pushRegion(this.regions.interpolation);
                        continue;
                    }
                }
                if (popRegion(rest)) {
                    continue;
                }
            }
        }
        realStack = stack.filter(function(s) {
            return !s.fake && s.region.close !== null && s.region.multi;
        });
        closeStackItem = (function(_this) {
            return function(stackItem) {
                return result = result.concat(_this.dissForClass(text, _.last(result).start + _.last(result).match.length, stackItem.region.clss));
            };
        })(this);
        if (realStack.length) {
            this.setUnbalanced(li, realStack);
            closeStackItem(_.last(realStack));
        } else if (keepUnbalanced.length) {
            this.setUnbalanced(li, keepUnbalanced);
            if (stack.length) {
                closeStackItem(_.last(stack));
            }
        } else {
            if (stack.length && _.last(stack).region.close === null) {
                closeStackItem(_.last(stack));
            }
            this.setUnbalanced(li);
        }
        return result;
    };

    Balancer.prototype.getUnbalanced = function(li) {
        var i, len, ref1, stack, u;
        stack = [];
        ref1 = this.unbalanced;
        for (i = 0, len = ref1.length; i < len; i++) {
            u = ref1[i];
            if (u.line < li) {
                if (stack.length && _.last(stack).region.clss === u.region.clss) {
                    stack.pop();
                } else {
                    stack.push(u);
                }
            }
            if (u.line >= li) {
                break;
            }
        }
        if (stack.length) {
            return stack;
        }
        return null;
    };

    Balancer.prototype.setUnbalanced = function(li, stack) {
        _.remove(this.unbalanced, function(u) {
            return u.line === li;
        });
        if (stack != null) {
            _.each(stack, function(s) {
                return s.line = li;
            });
            this.unbalanced = this.unbalanced.concat(stack);
            return this.unbalanced.sort(function(a, b) {
                if (a.line === b.line) {
                    return a.start - b.start;
                } else {
                    return a.line - b.line;
                }
            });
        }
    };

    Balancer.prototype.deleteLine = function(li) {
        _.remove(this.unbalanced, function(u) {
            return u.line === li;
        });
        return _.each(this.unbalanced, function(u) {
            if (u.line >= li) {
                return u.line -= 1;
            }
        });
    };

    Balancer.prototype.insertLine = function(li) {
        return _.each(this.unbalanced, function(u) {
            if (u.line >= li) {
                return u.line += 1;
            }
        });
    };

    Balancer.prototype.clear = function() {
        this.unbalanced = [];
        return this.blocks = null;
    };

    return Balancer;

})();

module.exports = Balancer;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFsYW5jZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQXFDLE9BQUEsQ0FBUSxLQUFSLENBQXJDLEVBQUUsbUJBQUYsRUFBVSxpQkFBVixFQUFpQixtQkFBakIsRUFBeUIsZUFBekIsRUFBK0I7O0FBRS9CLElBQUEsR0FBUyxPQUFBLENBQVEsTUFBUjs7QUFFSDtJQUVDLGtCQUFDLE1BQUQsRUFBVSxPQUFWO1FBQUMsSUFBQyxDQUFBLFNBQUQ7UUFBUyxJQUFDLENBQUEsVUFBRDtRQUVULElBQUMsQ0FBQSxVQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsTUFBRCxHQUFVO0lBSFg7O3VCQUtILFFBQUEsR0FBVSxTQUFDLEtBQUQ7ZUFFTixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUksQ0FBQyxPQUFMLENBQWEsS0FBYixFQUFvQixJQUFDLENBQUEsTUFBTSxDQUFDLElBQTVCO0lBRko7O3VCQVVWLFdBQUEsR0FBYSxTQUFDLFFBQUQ7QUFFVCxZQUFBO1FBQUEsV0FBQTtBQUFjLG9CQUFPLFFBQVA7QUFBQSxxQkFDTCxRQURLO0FBQUEscUJBQ0ksUUFESjtBQUFBLHFCQUNhLElBRGI7QUFBQSxxQkFDa0IsS0FEbEI7QUFBQSxxQkFDd0IsTUFEeEI7QUFBQSxxQkFDK0IsSUFEL0I7QUFBQSxxQkFDb0MsS0FEcEM7QUFBQSxxQkFDMEMsTUFEMUM7MkJBQ21FO0FBRG5FLHFCQUVMLE1BRks7QUFBQSxxQkFFRSxLQUZGO0FBQUEscUJBRVEsR0FGUjtBQUFBLHFCQUVZLEdBRlo7QUFBQSxxQkFFZ0IsS0FGaEI7QUFBQSxxQkFFc0IsS0FGdEI7QUFBQSxxQkFFNEIsSUFGNUI7QUFBQSxxQkFFaUMsSUFGakM7QUFBQSxxQkFFc0MsTUFGdEM7QUFBQSxxQkFFNkMsSUFGN0M7QUFBQSxxQkFFa0QsT0FGbEQ7MkJBRW1FO0FBRm5FLHFCQUdMLEtBSEs7QUFBQSxx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QUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBtYXRjaHIsIGVtcHR5LCBrZXJyb3IsIGtsb2csIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxua2xvciAgID0gcmVxdWlyZSAna2xvcidcblxuY2xhc3MgQmFsYW5jZXJcblxuICAgIEA6IChAc3ludGF4LCBAZ2V0TGluZSkgLT5cblxuICAgICAgICBAdW5iYWxhbmNlZCA9IFtdXG4gICAgICAgIEBibG9ja3MgPSBudWxsXG5cbiAgICBzZXRMaW5lczogKGxpbmVzKSAtPlxuICAgICAgICBcbiAgICAgICAgQGJsb2NrcyA9IGtsb3IuZGlzc2VjdCBsaW5lcywgQHN5bnRheC5uYW1lXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAwXG5cbiAgICBzZXRGaWxlVHlwZTogKGZpbGVUeXBlKSAtPlxuXG4gICAgICAgIGxpbmVDb21tZW50ID0gc3dpdGNoIGZpbGVUeXBlXG4gICAgICAgICAgICB3aGVuICdjb2ZmZWUnICdrb2ZmZWUnICdzaCcgJ2JhdCcgJ25vb24nICdrbycgJ3R4dCcgJ2Zpc2gnICAgICAgICAgICAgICB0aGVuICcjJ1xuICAgICAgICAgICAgd2hlbiAnc3R5bCcgJ2NwcCcgJ2MnICdoJyAnaHBwJyAnY3h4JyAnY3MnICdqcycgJ3Njc3MnICd0cycgJ3N3aWZ0JyAgICAgdGhlbiAnLy8nXG4gICAgICAgICAgICB3aGVuICdpc3MnICdpbmknICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuICc7J1xuXG4gICAgICAgIG11bHRpQ29tbWVudCA9IHN3aXRjaCBmaWxlVHlwZVxuICAgICAgICAgICAgd2hlbiAnY29mZmVlJyAna29mZmVlJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBvcGVuOicjIyMnICBjbG9zZTonIyMjJ1xuICAgICAgICAgICAgd2hlbiAnaHRtbCcgJ21kJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiBvcGVuOic8IS0tJyBjbG9zZTonLS0+J1xuICAgICAgICAgICAgd2hlbiAnc3R5bCcgJ2NwcCcgJ2MnICdoJyAnaHBwJyAnY3h4JyAnY3MnICdqcycgJ3Njc3MnICd0cycgJ3N3aWZ0JyAgICAgdGhlbiBvcGVuOicvKicgICBjbG9zZTonKi8nXG5cbiAgICAgICAgQHJlZ2lvbnMgPVxuICAgICAgICAgICAgZG91YmxlU3RyaW5nOiBjbHNzOidzdHJpbmcgZG91YmxlJyBvcGVuOidcIicgY2xvc2U6J1wiJ1xuXG4gICAgICAgIGlmIGxpbmVDb21tZW50XG4gICAgICAgICAgICBAcmVnaW9ucy5saW5lQ29tbWVudCA9IGNsc3M6J2NvbW1lbnQnIG9wZW46bGluZUNvbW1lbnQsIGNsb3NlOm51bGwsIGZvcmNlOnRydWVcbiAgICAgICAgICAgIEBoZWFkZXJSZWdFeHAgPSBuZXcgUmVnRXhwKFwiXihcXFxccyoje18uZXNjYXBlUmVnRXhwIEByZWdpb25zLmxpbmVDb21tZW50Lm9wZW59XFxcXHMqKT8oXFxcXHMqMFswXFxcXHNdKykkXCIpXG5cbiAgICAgICAgaWYgbXVsdGlDb21tZW50XG4gICAgICAgICAgICBAcmVnaW9ucy5tdWx0aUNvbW1lbnQgPVxuICAgICAgICAgICAgICAgIGNsc3M6ICAnY29tbWVudCB0cmlwbGUnXG4gICAgICAgICAgICAgICAgb3BlbjogIG11bHRpQ29tbWVudC5vcGVuXG4gICAgICAgICAgICAgICAgY2xvc2U6IG11bHRpQ29tbWVudC5jbG9zZVxuICAgICAgICAgICAgICAgIG11bHRpOiB0cnVlXG5cbiAgICAgICAgc3dpdGNoIGZpbGVUeXBlXG5cbiAgICAgICAgICAgIHdoZW4gJ2NvZmZlZScgJ2tvZmZlZSdcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5tdWx0aVN0cmluZyAgID0gY2xzczonc3RyaW5nIHRyaXBsZScgICAgICAgIG9wZW46J1wiXCJcIicgY2xvc2U6ICdcIlwiXCInIG11bHRpOiB0cnVlXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMubXVsdGlTdHJpbmcyICA9IGNsc3M6J3N0cmluZyB0cmlwbGUgc2tpbm55JyBvcGVuOlwiJycnXCIsIGNsb3NlOiBcIicnJ1wiLCBtdWx0aTogdHJ1ZVxuICAgICAgICAgICAgICAgIEByZWdpb25zLmludGVycG9sYXRpb24gPSBjbHNzOidpbnRlcnBvbGF0aW9uJyAgICAgICAgb3BlbjonI3snICBjbG9zZTogJ30nICAgbXVsdGk6IHRydWVcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5zaW5nbGVTdHJpbmcgID0gY2xzczonc3RyaW5nIHNpbmdsZScgICAgICAgIG9wZW46XCInXCIsIGNsb3NlOiBcIidcIlxuXG4gICAgICAgICAgICB3aGVuICdqcycgJ3RzJ1xuICAgICAgICAgICAgICAgIEByZWdpb25zLnNpbmdsZVN0cmluZyAgPSBjbHNzOiAnc3RyaW5nIHNpbmdsZScgIG9wZW46IFwiJ1wiLCBjbG9zZTogXCInXCJcblxuICAgICAgICAgICAgd2hlbiAnbm9vbicgJ2lzcydcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5saW5lQ29tbWVudC5zb2xvID0gdHJ1ZSAjIG9ubHkgc3BhY2VzIGJlZm9yZSBjb21tZW50cyBhbGxvd2VkXG5cbiAgICAgICAgICAgIHdoZW4gJ21kJ1xuICAgICAgICAgICAgICAgIEByZWdpb25zLm11bHRpU3RyaW5nICAgPSBjbHNzOidzdHJpbmcgdHJpcGxlJyBvcGVuOidgYGAnICAgY2xvc2U6ICdgYGAnIG11bHRpOiB0cnVlXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMuaGVhZGVyNSAgICAgICA9IGNsc3M6J21hcmtkb3duIGg1JyAgIG9wZW46JyMjIyMjJyBjbG9zZTogbnVsbCwgc29sbzogdHJ1ZVxuICAgICAgICAgICAgICAgIEByZWdpb25zLmhlYWRlcjQgICAgICAgPSBjbHNzOidtYXJrZG93biBoNCcgICBvcGVuOicjIyMjJyAgY2xvc2U6IG51bGwsIHNvbG86IHRydWVcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5oZWFkZXIzICAgICAgID0gY2xzczonbWFya2Rvd24gaDMnICAgb3BlbjonIyMjJyAgIGNsb3NlOiBudWxsLCBzb2xvOiB0cnVlXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMuaGVhZGVyMiAgICAgICA9IGNsc3M6J21hcmtkb3duIGgyJyAgIG9wZW46JyMjJyAgICBjbG9zZTogbnVsbCwgc29sbzogdHJ1ZVxuICAgICAgICAgICAgICAgIEByZWdpb25zLmhlYWRlcjEgICAgICAgPSBjbHNzOidtYXJrZG93biBoMScgICBvcGVuOicjJyAgICAgY2xvc2U6IG51bGwsIHNvbG86IHRydWVcblxuICAgICAgICBAb3BlblJlZ2lvbnMgPSBfLmZpbHRlciBAcmVnaW9ucywgKHIpIC0+IHIuY2xvc2UgPT0gbnVsbFxuXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIGRpc3NGb3JMaW5lOiAobGkpIC0+XG4gICAgICAgIFxuICAgICAgICB0ZXh0ID0gQGdldExpbmUgbGlcblxuICAgICAgICBpZiBub3QgdGV4dD9cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJkaXNzRm9yTGluZSAtLSBubyBsaW5lIGF0IGluZGV4ICN7bGl9P1wiXG5cbiAgICAgICAgIyByID0gQG1lcmdlUmVnaW9ucyBAcGFyc2UodGV4dCwgbGkpLCB0ZXh0LCBsaVxuICAgICAgICBcbiAgICAgICAgaWYgQGJsb2Nrcz9bbGldIFxuICAgICAgICAgICAgIyBsb2cgJ2JsY2snIGxpLCBAYmxvY2tzW2xpXVxuICAgICAgICAgICAgIyBsb2cgJ2Rpc3MnIGxpLCByXG4gICAgICAgICAgICByZXR1cm4gQGJsb2Nrc1tsaV1cbiAgICAgICAgciA9IEBtZXJnZVJlZ2lvbnMgQHBhcnNlKHRleHQsIGxpKSwgdGV4dCwgbGlcbiAgICAgICAgclxuXG4gICAgZGlzc0ZvckxpbmVBbmRSYW5nZXM6IChsaW5lLCByZ3MpIC0+XG5cbiAgICAgICAgcmVnaW9ucyA9IEBtZXJnZVJlZ2lvbnMgQHBhcnNlKGxpbmUsIDApLCBsaW5lLCAwXG4gICAgICAgIG1hdGNoci5tZXJnZSByZWdpb25zLCBtYXRjaHIuZGlzc2VjdCByZ3NcblxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICBtZXJnZVJlZ2lvbnM6IChyZWdpb25zLCB0ZXh0LCBsaSkgLT5cblxuICAgICAgICB1bmJhbGFuY2VkID0gQGdldFVuYmFsYW5jZWQgbGlcblxuICAgICAgICBtZXJnZWQgPSBbXVxuICAgICAgICBwID0gMFxuXG4gICAgICAgIGFkZERpc3MgPSAoc3RhcnQsIGVuZCwgZm9yY2UpID0+XG5cbiAgICAgICAgICAgIHNsaWNlID0gdGV4dC5zbGljZSBzdGFydCwgZW5kXG4gICAgICAgICAgICBpZiBub3QgZm9yY2UgYW5kIHVuYmFsYW5jZWQ/IGFuZCBfLmxhc3QodW5iYWxhbmNlZCkucmVnaW9uLmNsc3MgIT0gJ2ludGVycG9sYXRpb24nXG4gICAgICAgICAgICAgICAgZGlzcyA9IEBkaXNzRm9yQ2xhc3Mgc2xpY2UsIDAsIF8ubGFzdCh1bmJhbGFuY2VkKS5yZWdpb24uY2xzc1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIGVuZCA8IHRleHQubGVuZ3RoLTFcbiAgICAgICAgICAgICAgICAgICAgc2xpY2UgKz0gJyB4JyAjIGxpdHRsZSBoYWNrIHRvIGdldCBmdW5jdGlvbiBjYWxsIGRldGVjdGlvbiB0byB3b3JrXG4gICAgICAgICAgICAgICAgICAgIGRpc3MgPSBAc3ludGF4LmNvbnN0cnVjdG9yLmRpc3NGb3JUZXh0QW5kU3ludGF4IHNsaWNlLCBAc3ludGF4Lm5hbWVcbiAgICAgICAgICAgICAgICAgICAgZGlzcy5wb3AoKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgZGlzcyA9IEBzeW50YXguY29uc3RydWN0b3IuZGlzc0ZvclRleHRBbmRTeW50YXggc2xpY2UsIEBzeW50YXgubmFtZVxuICAgICAgICAgICAgaWYgc3RhcnRcbiAgICAgICAgICAgICAgICBfLmVhY2ggZGlzcywgKGQpIC0+IGQuc3RhcnQgKz0gc3RhcnRcbiAgICAgICAgICAgIG1lcmdlZCA9IG1lcmdlZC5jb25jYXQgZGlzc1xuXG4gICAgICAgIHdoaWxlIHJlZ2lvbiA9IHJlZ2lvbnMuc2hpZnQoKVxuXG4gICAgICAgICAgICBpZiByZWdpb24uc3RhcnQgPiBwXG4gICAgICAgICAgICAgICAgYWRkRGlzcyBwLCByZWdpb24uc3RhcnRcbiAgICAgICAgICAgIGlmIHJlZ2lvbi5jbHNzID09ICdpbnRlcnBvbGF0aW9uJ1xuICAgICAgICAgICAgICAgIGFkZERpc3MgcmVnaW9uLnN0YXJ0LCByZWdpb24uc3RhcnQrcmVnaW9uLm1hdGNoLmxlbmd0aCwgdHJ1ZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG1lcmdlZC5wdXNoIHJlZ2lvblxuICAgICAgICAgICAgcCA9IHJlZ2lvbi5zdGFydCArIHJlZ2lvbi5tYXRjaC5sZW5ndGhcblxuICAgICAgICBpZiBwIDwgdGV4dC5sZW5ndGhcbiAgICAgICAgICAgIGFkZERpc3MgcCwgdGV4dC5sZW5ndGhcblxuICAgICAgICBtZXJnZWRcblxuICAgIGRpc3NGb3JDbGFzczogKHRleHQsIHN0YXJ0LCBjbHNzKSAtPlxuXG4gICAgICAgIGlmIEBoZWFkZXJSZWdFeHA/LnRlc3QgdGV4dFxuICAgICAgICAgICAgY2xzcyArPSAnIGhlYWRlcidcblxuICAgICAgICBkaXNzID0gW11cbiAgICAgICAgbSA9ICcnXG4gICAgICAgIHAgPSBzID0gc3RhcnRcbiAgICAgICAgd2hpbGUgcCA8IHRleHQubGVuZ3RoXG5cbiAgICAgICAgICAgIGMgPSB0ZXh0W3BdXG4gICAgICAgICAgICBwICs9IDFcblxuICAgICAgICAgICAgaWYgYyAhPSAnICdcbiAgICAgICAgICAgICAgICBzID0gcC0xIGlmIG0gPT0gJydcbiAgICAgICAgICAgICAgICBtICs9IGNcbiAgICAgICAgICAgICAgICBjb250aW51ZSBpZiBwIDwgdGV4dC5sZW5ndGhcblxuICAgICAgICAgICAgaWYgbSAhPSAnJ1xuXG4gICAgICAgICAgICAgICAgZGlzcy5wdXNoXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBzXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoOiBtXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBjbHNzXG4gICAgICAgICAgICAgICAgbSA9ICcnXG4gICAgICAgIGRpc3NcblxuICAgICMjI1xuICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIyNcblxuICAgIHBhcnNlOiAodGV4dCwgbGkpIC0+XG5cbiAgICAgICAgcCAgICAgICA9IDBcbiAgICAgICAgZXNjYXBlcyA9IDBcblxuICAgICAgICBzdGFjayAgID0gW11cbiAgICAgICAgcmVzdWx0ICA9IFtdXG5cbiAgICAgICAgdW5iYWxhbmNlZCAgICAgPSBudWxsXG4gICAgICAgIGtlZXBVbmJhbGFuY2VkID0gW11cblxuICAgICAgICBpZiB1bmJhbGFuY2VkID0gQGdldFVuYmFsYW5jZWQgbGlcbiAgICAgICAgICAgIGZvciBsaW5lU3RhcnRSZWdpb24gaW4gdW5iYWxhbmNlZFxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6ICAwXG4gICAgICAgICAgICAgICAgICAgIHJlZ2lvbjogbGluZVN0YXJ0UmVnaW9uLnJlZ2lvblxuICAgICAgICAgICAgICAgICAgICBmYWtlOiAgIHRydWVcblxuICAgICAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMFxuICAgICAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwXG5cbiAgICAgICAgcHVzaFRvcCA9IC0+XG5cbiAgICAgICAgICAgIGlmICB0b3AgPSBfLmxhc3Qgc3RhY2tcbiAgICAgICAgICAgICAgICBsciAgPSBfLmxhc3QgcmVzdWx0XG4gICAgICAgICAgICAgICAgbGUgID0gbHI/IGFuZCBsci5zdGFydCArIGxyLm1hdGNoLmxlbmd0aCBvciAwXG5cbiAgICAgICAgICAgICAgICBpZiBwLTEgLSBsZSA+IDAgYW5kIGxlIDwgdGV4dC5sZW5ndGgtMVxuXG4gICAgICAgICAgICAgICAgICAgIHRvcCA9IF8uY2xvbmVEZWVwIHRvcFxuICAgICAgICAgICAgICAgICAgICB0b3Auc3RhcnQgPSBsZVxuICAgICAgICAgICAgICAgICAgICB0b3AubWF0Y2ggPSB0ZXh0LnNsaWNlIGxlLCBwLTFcbiAgICAgICAgICAgICAgICAgICAgdG9wLnZhbHVlID0gdG9wLnJlZ2lvbi5jbHNzXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0b3AucmVnaW9uXG5cbiAgICAgICAgICAgICAgICAgICAgYWR2YW5jZSA9IC0+XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSB0b3AubWF0Y2gubGVuZ3RoIGFuZCB0b3AubWF0Y2hbMF0gPT0gJyAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wLm1hdGNoID0gdG9wLm1hdGNoLnNsaWNlIDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3Auc3RhcnQgKz0gMVxuICAgICAgICAgICAgICAgICAgICBhZHZhbmNlKClcblxuICAgICAgICAgICAgICAgICAgICB0b3AubWF0Y2ggPSB0b3AubWF0Y2gudHJpbVJpZ2h0KClcblxuICAgICAgICAgICAgICAgICAgICBpZiB0b3AubWF0Y2gubGVuZ3RoXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHRvcC52YWx1ZSBpbiBbJ3N0cmluZyBzaW5nbGUnICdzdHJpbmcgZG91YmxlJyAnc3RyaW5nIHRyaXBsZScgJ3N0cmluZyB0cmlwbGUgc2tpbm55J11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGxpdCA9IHRvcC5tYXRjaC5zcGxpdCAvXFxzXFxzKy9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBzcGxpdC5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCB0b3BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIHdvcmQgPSBzcGxpdC5zaGlmdCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRtYXRjaCA9IHRvcC5tYXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wLm1hdGNoID0gd29yZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2ggdG9wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3AgPSBfLmNsb25lRGVlcCB0b3BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcC5zdGFydCArPSB3b3JkLmxlbmd0aCArIDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcC5tYXRjaCA9IG9sZG1hdGNoLnNsaWNlIHdvcmQubGVuZ3RoICsgMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWR2YW5jZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2ggdG9wXG5cbiAgICAgICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAgICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgICAgIHB1c2hGb3JjZVJlZ2lvbiA9IChyZWdpb24pID0+XG5cbiAgICAgICAgICAgIHN0YXJ0ID0gcC0xK3JlZ2lvbi5vcGVuLmxlbmd0aFxuXG4gICAgICAgICAgICByZXN1bHQucHVzaFxuICAgICAgICAgICAgICAgIHN0YXJ0OiBwLTFcbiAgICAgICAgICAgICAgICBtYXRjaDogcmVnaW9uLm9wZW5cbiAgICAgICAgICAgICAgICB2YWx1ZTogcmVnaW9uLmNsc3MgKyAnIG1hcmtlcidcblxuICAgICAgICAgICAgaWYgc3RhcnQgPCB0ZXh0Lmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCBAZGlzc0ZvckNsYXNzIHRleHQsIHN0YXJ0LCByZWdpb24uY2xzc1xuXG4gICAgICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4gICAgICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4gICAgICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4gICAgICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbiAgICAgICAgcHVzaFJlZ2lvbiA9IChyZWdpb24pIC0+XG5cbiAgICAgICAgICAgIHB1c2hUb3AoKVxuXG4gICAgICAgICAgICByZXN1bHQucHVzaFxuICAgICAgICAgICAgICAgIHN0YXJ0OiBwLTFcbiAgICAgICAgICAgICAgICBtYXRjaDogcmVnaW9uLm9wZW5cbiAgICAgICAgICAgICAgICB2YWx1ZTogcmVnaW9uLmNsc3MgKyAnIG1hcmtlcidcblxuICAgICAgICAgICAgc3RhY2sucHVzaFxuICAgICAgICAgICAgICAgIHN0YXJ0OiAgcC0xK3JlZ2lvbi5vcGVuLmxlbmd0aFxuICAgICAgICAgICAgICAgIHJlZ2lvbjogcmVnaW9uXG5cbiAgICAgICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMFxuICAgICAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDBcblxuICAgICAgICBwb3BSZWdpb24gPSAocmVzdCkgLT5cblxuICAgICAgICAgICAgdG9wID0gXy5sYXN0IHN0YWNrXG5cbiAgICAgICAgICAgIGlmIHRvcD8ucmVnaW9uLmNsb3NlPyBhbmQgcmVzdC5zdGFydHNXaXRoIHRvcC5yZWdpb24uY2xvc2VcblxuICAgICAgICAgICAgICAgIHB1c2hUb3AoKVxuICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgaWYgdG9wLmZha2VcbiAgICAgICAgICAgICAgICAgICAga2VlcFVuYmFsYW5jZWQudW5zaGlmdFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6ICBwLTFcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2lvbjogdG9wLnJlZ2lvblxuXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2hcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IHAtMVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdG9wLnJlZ2lvbi5jbHNzICsgJyBtYXJrZXInXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoOiB0b3AucmVnaW9uLmNsb3NlXG5cbiAgICAgICAgICAgICAgICBwICs9IHRvcC5yZWdpb24uY2xvc2UubGVuZ3RoLTFcbiAgICAgICAgICAgICAgICByZXR1cm4gdG9wXG4gICAgICAgICAgICBmYWxzZVxuXG4gICAgICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgICAgICMgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAgICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwXG5cbiAgICAgICAgd2hpbGUgcCA8IHRleHQubGVuZ3RoXG5cbiAgICAgICAgICAgIGNoID0gdGV4dFtwXVxuICAgICAgICAgICAgcCArPSAxXG5cbiAgICAgICAgICAgIHRvcCA9IF8ubGFzdCBzdGFja1xuXG4gICAgICAgICAgICBpZiBjaCA9PSAnXFxcXCcgdGhlbiBlc2NhcGVzKytcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBjaCA9PSAnICdcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgICAgIGlmIGVzY2FwZXNcbiAgICAgICAgICAgICAgICAgICAgaWYgZXNjYXBlcyAlIDIgYW5kIChjaCAhPSBcIiNcIiBvciB0b3AgYW5kIHRvcC5yZWdpb24udmFsdWUgIT0gJ2ludGVycG9sYXRpb24nKVxuICAgICAgICAgICAgICAgICAgICAgICAgZXNjYXBlcyA9IDAgIyBjaGFyYWN0ZXIgaXMgZXNjYXBlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlICAgICMganVzdCBjb250aW51ZSB0byBuZXh0XG4gICAgICAgICAgICAgICAgICAgIGVzY2FwZXMgPSAwXG5cbiAgICAgICAgICAgICAgICBpZiBjaCA9PSAnOidcbiAgICAgICAgICAgICAgICAgICAgaWYgQHN5bnRheC5uYW1lID09ICdqc29uJyAjIGhpZ2hsaWdodCBqc29uIGRpY3Rpb25hcnkga2V5c1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgXy5sYXN0KHJlc3VsdCkudmFsdWUgPT0gJ3N0cmluZyBkb3VibGUgbWFya2VyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHJlc3VsdC5sZW5ndGggPiAxIGFuZCByZXN1bHRbcmVzdWx0Lmxlbmd0aC0yXS52YWx1ZSA9PSAnc3RyaW5nIGRvdWJsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGgtMl0udmFsdWUgPSAnc3RyaW5nIGRpY3Rpb25hcnkga2V5J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IHAtMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2g6IGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ2RpY3Rpb25hcnkgbWFya2VyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICByZXN0ID0gdGV4dC5zbGljZSBwLTFcblxuICAgICAgICAgICAgaWYgZW1wdHkodG9wKSBvciB0b3AucmVnaW9uPy5jbHNzID09ICdpbnRlcnBvbGF0aW9uJ1xuXG4gICAgICAgICAgICAgICAgaWYgcG9wUmVnaW9uIHJlc3RcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgICAgIGlmIEByZWdpb25zLm11bHRpQ29tbWVudCBhbmQgcmVzdC5zdGFydHNXaXRoIEByZWdpb25zLm11bHRpQ29tbWVudC5vcGVuXG4gICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gQHJlZ2lvbnMubXVsdGlDb21tZW50XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgICAgICBlbHNlIGlmIEByZWdpb25zLm11bHRpU3RyaW5nIGFuZCByZXN0LnN0YXJ0c1dpdGggQHJlZ2lvbnMubXVsdGlTdHJpbmcub3BlblxuICAgICAgICAgICAgICAgICAgICBwdXNoUmVnaW9uIEByZWdpb25zLm11bHRpU3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgICAgICBlbHNlIGlmIEByZWdpb25zLm11bHRpU3RyaW5nMiBhbmQgcmVzdC5zdGFydHNXaXRoIEByZWdpb25zLm11bHRpU3RyaW5nMi5vcGVuXG4gICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gQHJlZ2lvbnMubXVsdGlTdHJpbmcyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgICAgICBlbHNlIGlmIGVtcHR5IHRvcFxuICAgICAgICAgICAgICAgICAgICBmb3JjZWQgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBwdXNoZWQgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBmb3Igb3BlblJlZ2lvbiBpbiBAb3BlblJlZ2lvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHJlc3Quc3RhcnRzV2l0aCBvcGVuUmVnaW9uLm9wZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBvcGVuUmVnaW9uLm1pblg/IGFuZCBwLTEgPCBvcGVuUmVnaW9uLm1pblggdGhlbiBjb250aW51ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG9wZW5SZWdpb24ubWF4WD8gYW5kIHAtMSA+IG9wZW5SZWdpb24ubWF4WCB0aGVuIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IG9wZW5SZWdpb24uc29sbyBvciBlbXB0eSB0ZXh0LnNsaWNlKDAsIHAtMSkudHJpbSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG9wZW5SZWdpb24uZm9yY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hGb3JjZVJlZ2lvbiBvcGVuUmVnaW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gb3BlblJlZ2lvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVzaGVkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBicmVhayBpZiBmb3JjZWRcbiAgICAgICAgICAgICAgICAgICAgY29udGludWUgaWYgcHVzaGVkXG5cbiAgICAgICAgICAgICAgICBpZiBAcmVnaW9ucy5yZWdleHAgYW5kIGNoID09IEByZWdpb25zLnJlZ2V4cC5vcGVuXG4gICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gQHJlZ2lvbnMucmVnZXhwXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgaWYgY2ggPT0gQHJlZ2lvbnMuc2luZ2xlU3RyaW5nPy5vcGVuXG4gICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gQHJlZ2lvbnMuc2luZ2xlU3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgaWYgY2ggPT0gQHJlZ2lvbnMuZG91YmxlU3RyaW5nLm9wZW5cbiAgICAgICAgICAgICAgICAgICAgcHVzaFJlZ2lvbiBAcmVnaW9ucy5kb3VibGVTdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICAgICAgaWYgdG9wLnJlZ2lvbi5jbHNzIGluIFsnc3RyaW5nIGRvdWJsZScgJ3N0cmluZyB0cmlwbGUnXVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIEByZWdpb25zLmludGVycG9sYXRpb24gYW5kIHJlc3Quc3RhcnRzV2l0aCBAcmVnaW9ucy5pbnRlcnBvbGF0aW9uLm9wZW4gIyBzdHJpbmcgaW50ZXJwb2xhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgcHVzaFJlZ2lvbiBAcmVnaW9ucy5pbnRlcnBvbGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICAgICAgaWYgcG9wUmVnaW9uIHJlc3RcbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICByZWFsU3RhY2sgPSBzdGFjay5maWx0ZXIgKHMpIC0+IG5vdCBzLmZha2UgYW5kIHMucmVnaW9uLmNsb3NlICE9IG51bGwgYW5kIHMucmVnaW9uLm11bHRpXG5cbiAgICAgICAgY2xvc2VTdGFja0l0ZW0gPSAoc3RhY2tJdGVtKSA9PlxuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCBAZGlzc0ZvckNsYXNzIHRleHQsIF8ubGFzdChyZXN1bHQpLnN0YXJ0ICsgXy5sYXN0KHJlc3VsdCkubWF0Y2gubGVuZ3RoLCBzdGFja0l0ZW0ucmVnaW9uLmNsc3NcblxuICAgICAgICBpZiByZWFsU3RhY2subGVuZ3RoXG4gICAgICAgICAgICBAc2V0VW5iYWxhbmNlZCBsaSwgcmVhbFN0YWNrXG4gICAgICAgICAgICBjbG9zZVN0YWNrSXRlbSBfLmxhc3QgcmVhbFN0YWNrXG4gICAgICAgIGVsc2UgaWYga2VlcFVuYmFsYW5jZWQubGVuZ3RoXG4gICAgICAgICAgICBAc2V0VW5iYWxhbmNlZCBsaSwga2VlcFVuYmFsYW5jZWRcbiAgICAgICAgICAgIGlmIHN0YWNrLmxlbmd0aFxuICAgICAgICAgICAgICAgIGNsb3NlU3RhY2tJdGVtIF8ubGFzdCBzdGFja1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBzdGFjay5sZW5ndGggYW5kIF8ubGFzdChzdGFjaykucmVnaW9uLmNsb3NlID09IG51bGxcbiAgICAgICAgICAgICAgICBjbG9zZVN0YWNrSXRlbSBfLmxhc3Qgc3RhY2tcbiAgICAgICAgICAgIEBzZXRVbmJhbGFuY2VkIGxpXG5cbiAgICAgICAgcmVzdWx0XG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBnZXRVbmJhbGFuY2VkOiAobGkpIC0+XG5cbiAgICAgICAgc3RhY2sgPSBbXVxuICAgICAgICBmb3IgdSBpbiBAdW5iYWxhbmNlZFxuICAgICAgICAgICAgaWYgdS5saW5lIDwgbGlcbiAgICAgICAgICAgICAgICBpZiBzdGFjay5sZW5ndGggYW5kIF8ubGFzdChzdGFjaykucmVnaW9uLmNsc3MgPT0gdS5yZWdpb24uY2xzc1xuICAgICAgICAgICAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaCB1XG4gICAgICAgICAgICBpZiB1LmxpbmUgPj0gbGlcbiAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgIGlmIHN0YWNrLmxlbmd0aFxuICAgICAgICAgICAgcmV0dXJuIHN0YWNrXG5cbiAgICAgICAgbnVsbFxuXG4gICAgc2V0VW5iYWxhbmNlZDogKGxpLCBzdGFjaykgLT5cblxuICAgICAgICBfLnJlbW92ZSBAdW5iYWxhbmNlZCwgKHUpIC0+IHUubGluZSA9PSBsaVxuICAgICAgICBpZiBzdGFjaz9cbiAgICAgICAgICAgIF8uZWFjaCBzdGFjaywgKHMpIC0+IHMubGluZSA9IGxpXG4gICAgICAgICAgICBAdW5iYWxhbmNlZCA9IEB1bmJhbGFuY2VkLmNvbmNhdCBzdGFja1xuICAgICAgICAgICAgQHVuYmFsYW5jZWQuc29ydCAoYSxiKSAtPlxuICAgICAgICAgICAgICAgIGlmIGEubGluZSA9PSBiLmxpbmVcbiAgICAgICAgICAgICAgICAgICAgYS5zdGFydCAtIGIuc3RhcnRcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGEubGluZSAtIGIubGluZVxuXG4gICAgZGVsZXRlTGluZTogKGxpKSAtPlxuXG4gICAgICAgIF8ucmVtb3ZlIEB1bmJhbGFuY2VkLCAodSkgLT4gdS5saW5lID09IGxpXG4gICAgICAgIF8uZWFjaCBAdW5iYWxhbmNlZCwgKHUpIC0+IHUubGluZSAtPSAxIGlmIHUubGluZSA+PSBsaVxuXG4gICAgaW5zZXJ0TGluZTogKGxpKSAtPlxuXG4gICAgICAgIF8uZWFjaCBAdW5iYWxhbmNlZCwgKHUpIC0+IHUubGluZSArPSAxIGlmIHUubGluZSA+PSBsaVxuXG4gICAgY2xlYXI6IC0+XG5cbiAgICAgICAgQHVuYmFsYW5jZWQgPSBbXVxuICAgICAgICBAYmxvY2tzID0gbnVsbFxuXG5tb2R1bGUuZXhwb3J0cyA9IEJhbGFuY2VyXG4iXX0=
//# sourceURL=../../coffee/editor/balancer.coffee