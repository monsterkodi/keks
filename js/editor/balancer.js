// koffee 1.4.0

/*
0000000     0000000   000       0000000   000   000   0000000  00000000  00000000
000   000  000   000  000      000   000  0000  000  000       000       000   000
0000000    000000000  000      000000000  000 0 000  000       0000000   0000000
000   000  000   000  000      000   000  000  0000  000       000       000   000
0000000    000   000  0000000  000   000  000   000   0000000  00000000  000   000
 */
var Balancer, _, empty, kerror, klog, klor, matchr, ref;

ref = require('kxk'), empty = ref.empty, kerror = ref.kerror, klog = ref.klog, _ = ref._;

matchr = require('../tools/matchr');

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFsYW5jZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQTZCLE9BQUEsQ0FBUSxLQUFSLENBQTdCLEVBQUUsaUJBQUYsRUFBUyxtQkFBVCxFQUFpQixlQUFqQixFQUF1Qjs7QUFFdkIsTUFBQSxHQUFTLE9BQUEsQ0FBUSxpQkFBUjs7QUFDVCxJQUFBLEdBQVMsT0FBQSxDQUFRLE1BQVI7O0FBRUg7SUFFVyxrQkFBQyxNQUFELEVBQVUsT0FBVjtRQUFDLElBQUMsQ0FBQSxTQUFEO1FBQVMsSUFBQyxDQUFBLFVBQUQ7UUFFbkIsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxNQUFELEdBQVU7SUFIRDs7dUJBS2IsUUFBQSxHQUFVLFNBQUMsS0FBRDtlQUVOLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBSSxDQUFDLE9BQUwsQ0FBYSxLQUFiLEVBQW9CLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBNUI7SUFGSjs7dUJBVVYsV0FBQSxHQUFhLFNBQUMsUUFBRDtBQUVULFlBQUE7UUFBQSxXQUFBO0FBQWMsb0JBQU8sUUFBUDtBQUFBLHFCQUNMLFFBREs7QUFBQSxxQkFDSSxRQURKO0FBQUEscUJBQ2EsSUFEYjtBQUFBLHFCQUNrQixLQURsQjtBQUFBLHFCQUN3QixNQUR4QjtBQUFBLHFCQUMrQixJQUQvQjtBQUFBLHFCQUNvQyxLQURwQztBQUFBLHFCQUMwQyxNQUQxQzsyQkFDbUU7QUFEbkUscUJBRUwsTUFGSztBQUFBLHFCQUVFLEtBRkY7QUFBQSxxQkFFUSxHQUZSO0FBQUEscUJBRVksR0FGWjtBQUFBLHFCQUVnQixLQUZoQjtBQUFBLHFCQUVzQixLQUZ0QjtBQUFBLHFCQUU0QixJQUY1QjtBQUFBLHFCQUVpQyxJQUZqQztBQUFBLHFCQUVzQyxNQUZ0QztBQUFBLHFCQUU2QyxJQUY3QztBQUFBLHFCQUVrRCxPQUZsRDsyQkFFbUU7QUFG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Ozs7O0FBS1gsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IGVtcHR5LCBrZXJyb3IsIGtsb2csIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxubWF0Y2hyID0gcmVxdWlyZSAnLi4vdG9vbHMvbWF0Y2hyJ1xua2xvciAgID0gcmVxdWlyZSAna2xvcidcblxuY2xhc3MgQmFsYW5jZXJcblxuICAgIGNvbnN0cnVjdG9yOiAoQHN5bnRheCwgQGdldExpbmUpIC0+XG5cbiAgICAgICAgQHVuYmFsYW5jZWQgPSBbXVxuICAgICAgICBAYmxvY2tzID0gbnVsbFxuXG4gICAgc2V0TGluZXM6IChsaW5lcykgLT5cbiAgICAgICAgXG4gICAgICAgIEBibG9ja3MgPSBrbG9yLmRpc3NlY3QgbGluZXMsIEBzeW50YXgubmFtZVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwMFxuXG4gICAgc2V0RmlsZVR5cGU6IChmaWxlVHlwZSkgLT5cblxuICAgICAgICBsaW5lQ29tbWVudCA9IHN3aXRjaCBmaWxlVHlwZVxuICAgICAgICAgICAgd2hlbiAnY29mZmVlJyAna29mZmVlJyAnc2gnICdiYXQnICdub29uJyAna28nICd0eHQnICdmaXNoJyAgICAgICAgICAgICAgdGhlbiAnIydcbiAgICAgICAgICAgIHdoZW4gJ3N0eWwnICdjcHAnICdjJyAnaCcgJ2hwcCcgJ2N4eCcgJ2NzJyAnanMnICdzY3NzJyAndHMnICdzd2lmdCcgICAgIHRoZW4gJy8vJ1xuICAgICAgICAgICAgd2hlbiAnaXNzJyAnaW5pJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiAnOydcblxuICAgICAgICBtdWx0aUNvbW1lbnQgPSBzd2l0Y2ggZmlsZVR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2NvZmZlZScgJ2tvZmZlZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gb3BlbjonIyMjJyAgY2xvc2U6JyMjIydcbiAgICAgICAgICAgIHdoZW4gJ2h0bWwnICdtZCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gb3BlbjonPCEtLScgY2xvc2U6Jy0tPidcbiAgICAgICAgICAgIHdoZW4gJ3N0eWwnICdjcHAnICdjJyAnaCcgJ2hwcCcgJ2N4eCcgJ2NzJyAnanMnICdzY3NzJyAndHMnICdzd2lmdCcgICAgIHRoZW4gb3BlbjonLyonICAgY2xvc2U6JyovJ1xuXG4gICAgICAgIEByZWdpb25zID1cbiAgICAgICAgICAgIGRvdWJsZVN0cmluZzogY2xzczonc3RyaW5nIGRvdWJsZScgb3BlbjonXCInIGNsb3NlOidcIidcblxuICAgICAgICBpZiBsaW5lQ29tbWVudFxuICAgICAgICAgICAgQHJlZ2lvbnMubGluZUNvbW1lbnQgPSBjbHNzOidjb21tZW50JyBvcGVuOmxpbmVDb21tZW50LCBjbG9zZTpudWxsLCBmb3JjZTp0cnVlXG4gICAgICAgICAgICBAaGVhZGVyUmVnRXhwID0gbmV3IFJlZ0V4cChcIl4oXFxcXHMqI3tfLmVzY2FwZVJlZ0V4cCBAcmVnaW9ucy5saW5lQ29tbWVudC5vcGVufVxcXFxzKik/KFxcXFxzKjBbMFxcXFxzXSspJFwiKVxuXG4gICAgICAgIGlmIG11bHRpQ29tbWVudFxuICAgICAgICAgICAgQHJlZ2lvbnMubXVsdGlDb21tZW50ID1cbiAgICAgICAgICAgICAgICBjbHNzOiAgJ2NvbW1lbnQgdHJpcGxlJ1xuICAgICAgICAgICAgICAgIG9wZW46ICBtdWx0aUNvbW1lbnQub3BlblxuICAgICAgICAgICAgICAgIGNsb3NlOiBtdWx0aUNvbW1lbnQuY2xvc2VcbiAgICAgICAgICAgICAgICBtdWx0aTogdHJ1ZVxuXG4gICAgICAgIHN3aXRjaCBmaWxlVHlwZVxuXG4gICAgICAgICAgICB3aGVuICdjb2ZmZWUnICdrb2ZmZWUnXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMubXVsdGlTdHJpbmcgICA9IGNsc3M6J3N0cmluZyB0cmlwbGUnICAgICAgICBvcGVuOidcIlwiXCInIGNsb3NlOiAnXCJcIlwiJyBtdWx0aTogdHJ1ZVxuICAgICAgICAgICAgICAgIEByZWdpb25zLm11bHRpU3RyaW5nMiAgPSBjbHNzOidzdHJpbmcgdHJpcGxlIHNraW5ueScgb3BlbjpcIicnJ1wiLCBjbG9zZTogXCInJydcIiwgbXVsdGk6IHRydWVcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5pbnRlcnBvbGF0aW9uID0gY2xzczonaW50ZXJwb2xhdGlvbicgICAgICAgIG9wZW46JyN7JyAgY2xvc2U6ICd9JyAgIG11bHRpOiB0cnVlXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMuc2luZ2xlU3RyaW5nICA9IGNsc3M6J3N0cmluZyBzaW5nbGUnICAgICAgICBvcGVuOlwiJ1wiLCBjbG9zZTogXCInXCJcblxuICAgICAgICAgICAgd2hlbiAnanMnICd0cydcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5zaW5nbGVTdHJpbmcgID0gY2xzczogJ3N0cmluZyBzaW5nbGUnICBvcGVuOiBcIidcIiwgY2xvc2U6IFwiJ1wiXG5cbiAgICAgICAgICAgIHdoZW4gJ25vb24nICdpc3MnXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMubGluZUNvbW1lbnQuc29sbyA9IHRydWUgIyBvbmx5IHNwYWNlcyBiZWZvcmUgY29tbWVudHMgYWxsb3dlZFxuXG4gICAgICAgICAgICB3aGVuICdtZCdcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5tdWx0aVN0cmluZyAgID0gY2xzczonc3RyaW5nIHRyaXBsZScgb3BlbjonYGBgJyAgIGNsb3NlOiAnYGBgJyBtdWx0aTogdHJ1ZVxuICAgICAgICAgICAgICAgIEByZWdpb25zLmhlYWRlcjUgICAgICAgPSBjbHNzOidtYXJrZG93biBoNScgICBvcGVuOicjIyMjIycgY2xvc2U6IG51bGwsIHNvbG86IHRydWVcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5oZWFkZXI0ICAgICAgID0gY2xzczonbWFya2Rvd24gaDQnICAgb3BlbjonIyMjIycgIGNsb3NlOiBudWxsLCBzb2xvOiB0cnVlXG4gICAgICAgICAgICAgICAgQHJlZ2lvbnMuaGVhZGVyMyAgICAgICA9IGNsc3M6J21hcmtkb3duIGgzJyAgIG9wZW46JyMjIycgICBjbG9zZTogbnVsbCwgc29sbzogdHJ1ZVxuICAgICAgICAgICAgICAgIEByZWdpb25zLmhlYWRlcjIgICAgICAgPSBjbHNzOidtYXJrZG93biBoMicgICBvcGVuOicjIycgICAgY2xvc2U6IG51bGwsIHNvbG86IHRydWVcbiAgICAgICAgICAgICAgICBAcmVnaW9ucy5oZWFkZXIxICAgICAgID0gY2xzczonbWFya2Rvd24gaDEnICAgb3BlbjonIycgICAgIGNsb3NlOiBudWxsLCBzb2xvOiB0cnVlXG5cbiAgICAgICAgQG9wZW5SZWdpb25zID0gXy5maWx0ZXIgQHJlZ2lvbnMsIChyKSAtPiByLmNsb3NlID09IG51bGxcblxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBkaXNzRm9yTGluZTogKGxpKSAtPlxuICAgICAgICBcbiAgICAgICAgdGV4dCA9IEBnZXRMaW5lIGxpXG5cbiAgICAgICAgaWYgbm90IHRleHQ/XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiZGlzc0ZvckxpbmUgLS0gbm8gbGluZSBhdCBpbmRleCAje2xpfT9cIlxuXG4gICAgICAgICMgciA9IEBtZXJnZVJlZ2lvbnMgQHBhcnNlKHRleHQsIGxpKSwgdGV4dCwgbGlcbiAgICAgICAgXG4gICAgICAgIGlmIEBibG9ja3M/W2xpXSBcbiAgICAgICAgICAgICMgbG9nICdibGNrJyBsaSwgQGJsb2Nrc1tsaV1cbiAgICAgICAgICAgICMgbG9nICdkaXNzJyBsaSwgclxuICAgICAgICAgICAgcmV0dXJuIEBibG9ja3NbbGldXG4gICAgICAgIHIgPSBAbWVyZ2VSZWdpb25zIEBwYXJzZSh0ZXh0LCBsaSksIHRleHQsIGxpXG4gICAgICAgIHJcblxuICAgIGRpc3NGb3JMaW5lQW5kUmFuZ2VzOiAobGluZSwgcmdzKSAtPlxuXG4gICAgICAgIHJlZ2lvbnMgPSBAbWVyZ2VSZWdpb25zIEBwYXJzZShsaW5lLCAwKSwgbGluZSwgMFxuICAgICAgICBtYXRjaHIubWVyZ2UgcmVnaW9ucywgbWF0Y2hyLmRpc3NlY3QgcmdzXG5cbiAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgIDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgbWVyZ2VSZWdpb25zOiAocmVnaW9ucywgdGV4dCwgbGkpIC0+XG5cbiAgICAgICAgdW5iYWxhbmNlZCA9IEBnZXRVbmJhbGFuY2VkIGxpXG5cbiAgICAgICAgbWVyZ2VkID0gW11cbiAgICAgICAgcCA9IDBcblxuICAgICAgICBhZGREaXNzID0gKHN0YXJ0LCBlbmQsIGZvcmNlKSA9PlxuXG4gICAgICAgICAgICBzbGljZSA9IHRleHQuc2xpY2Ugc3RhcnQsIGVuZFxuICAgICAgICAgICAgaWYgbm90IGZvcmNlIGFuZCB1bmJhbGFuY2VkPyBhbmQgXy5sYXN0KHVuYmFsYW5jZWQpLnJlZ2lvbi5jbHNzICE9ICdpbnRlcnBvbGF0aW9uJ1xuICAgICAgICAgICAgICAgIGRpc3MgPSBAZGlzc0ZvckNsYXNzIHNsaWNlLCAwLCBfLmxhc3QodW5iYWxhbmNlZCkucmVnaW9uLmNsc3NcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBlbmQgPCB0ZXh0Lmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgICAgIHNsaWNlICs9ICcgeCcgIyBsaXR0bGUgaGFjayB0byBnZXQgZnVuY3Rpb24gY2FsbCBkZXRlY3Rpb24gdG8gd29ya1xuICAgICAgICAgICAgICAgICAgICBkaXNzID0gQHN5bnRheC5jb25zdHJ1Y3Rvci5kaXNzRm9yVGV4dEFuZFN5bnRheCBzbGljZSwgQHN5bnRheC5uYW1lXG4gICAgICAgICAgICAgICAgICAgIGRpc3MucG9wKClcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGRpc3MgPSBAc3ludGF4LmNvbnN0cnVjdG9yLmRpc3NGb3JUZXh0QW5kU3ludGF4IHNsaWNlLCBAc3ludGF4Lm5hbWVcbiAgICAgICAgICAgIGlmIHN0YXJ0XG4gICAgICAgICAgICAgICAgXy5lYWNoIGRpc3MsIChkKSAtPiBkLnN0YXJ0ICs9IHN0YXJ0XG4gICAgICAgICAgICBtZXJnZWQgPSBtZXJnZWQuY29uY2F0IGRpc3NcblxuICAgICAgICB3aGlsZSByZWdpb24gPSByZWdpb25zLnNoaWZ0KClcblxuICAgICAgICAgICAgaWYgcmVnaW9uLnN0YXJ0ID4gcFxuICAgICAgICAgICAgICAgIGFkZERpc3MgcCwgcmVnaW9uLnN0YXJ0XG4gICAgICAgICAgICBpZiByZWdpb24uY2xzcyA9PSAnaW50ZXJwb2xhdGlvbidcbiAgICAgICAgICAgICAgICBhZGREaXNzIHJlZ2lvbi5zdGFydCwgcmVnaW9uLnN0YXJ0K3JlZ2lvbi5tYXRjaC5sZW5ndGgsIHRydWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBtZXJnZWQucHVzaCByZWdpb25cbiAgICAgICAgICAgIHAgPSByZWdpb24uc3RhcnQgKyByZWdpb24ubWF0Y2gubGVuZ3RoXG5cbiAgICAgICAgaWYgcCA8IHRleHQubGVuZ3RoXG4gICAgICAgICAgICBhZGREaXNzIHAsIHRleHQubGVuZ3RoXG5cbiAgICAgICAgbWVyZ2VkXG5cbiAgICBkaXNzRm9yQ2xhc3M6ICh0ZXh0LCBzdGFydCwgY2xzcykgLT5cblxuICAgICAgICBpZiBAaGVhZGVyUmVnRXhwPy50ZXN0IHRleHRcbiAgICAgICAgICAgIGNsc3MgKz0gJyBoZWFkZXInXG5cbiAgICAgICAgZGlzcyA9IFtdXG4gICAgICAgIG0gPSAnJ1xuICAgICAgICBwID0gcyA9IHN0YXJ0XG4gICAgICAgIHdoaWxlIHAgPCB0ZXh0Lmxlbmd0aFxuXG4gICAgICAgICAgICBjID0gdGV4dFtwXVxuICAgICAgICAgICAgcCArPSAxXG5cbiAgICAgICAgICAgIGlmIGMgIT0gJyAnXG4gICAgICAgICAgICAgICAgcyA9IHAtMSBpZiBtID09ICcnXG4gICAgICAgICAgICAgICAgbSArPSBjXG4gICAgICAgICAgICAgICAgY29udGludWUgaWYgcCA8IHRleHQubGVuZ3RoXG5cbiAgICAgICAgICAgIGlmIG0gIT0gJydcblxuICAgICAgICAgICAgICAgIGRpc3MucHVzaFxuICAgICAgICAgICAgICAgICAgICBzdGFydDogc1xuICAgICAgICAgICAgICAgICAgICBtYXRjaDogbVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogY2xzc1xuICAgICAgICAgICAgICAgIG0gPSAnJ1xuICAgICAgICBkaXNzXG5cbiAgICAjIyNcbiAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyMjXG5cbiAgICBwYXJzZTogKHRleHQsIGxpKSAtPlxuXG4gICAgICAgIHAgICAgICAgPSAwXG4gICAgICAgIGVzY2FwZXMgPSAwXG5cbiAgICAgICAgc3RhY2sgICA9IFtdXG4gICAgICAgIHJlc3VsdCAgPSBbXVxuXG4gICAgICAgIHVuYmFsYW5jZWQgICAgID0gbnVsbFxuICAgICAgICBrZWVwVW5iYWxhbmNlZCA9IFtdXG5cbiAgICAgICAgaWYgdW5iYWxhbmNlZCA9IEBnZXRVbmJhbGFuY2VkIGxpXG4gICAgICAgICAgICBmb3IgbGluZVN0YXJ0UmVnaW9uIGluIHVuYmFsYW5jZWRcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiAgMFxuICAgICAgICAgICAgICAgICAgICByZWdpb246IGxpbmVTdGFydFJlZ2lvbi5yZWdpb25cbiAgICAgICAgICAgICAgICAgICAgZmFrZTogICB0cnVlXG5cbiAgICAgICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAgICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDBcbiAgICAgICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMFxuXG4gICAgICAgIHB1c2hUb3AgPSAtPlxuXG4gICAgICAgICAgICBpZiAgdG9wID0gXy5sYXN0IHN0YWNrXG4gICAgICAgICAgICAgICAgbHIgID0gXy5sYXN0IHJlc3VsdFxuICAgICAgICAgICAgICAgIGxlICA9IGxyPyBhbmQgbHIuc3RhcnQgKyBsci5tYXRjaC5sZW5ndGggb3IgMFxuXG4gICAgICAgICAgICAgICAgaWYgcC0xIC0gbGUgPiAwIGFuZCBsZSA8IHRleHQubGVuZ3RoLTFcblxuICAgICAgICAgICAgICAgICAgICB0b3AgPSBfLmNsb25lRGVlcCB0b3BcbiAgICAgICAgICAgICAgICAgICAgdG9wLnN0YXJ0ID0gbGVcbiAgICAgICAgICAgICAgICAgICAgdG9wLm1hdGNoID0gdGV4dC5zbGljZSBsZSwgcC0xXG4gICAgICAgICAgICAgICAgICAgIHRvcC52YWx1ZSA9IHRvcC5yZWdpb24uY2xzc1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdG9wLnJlZ2lvblxuXG4gICAgICAgICAgICAgICAgICAgIGFkdmFuY2UgPSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgdG9wLm1hdGNoLmxlbmd0aCBhbmQgdG9wLm1hdGNoWzBdID09ICcgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcC5tYXRjaCA9IHRvcC5tYXRjaC5zbGljZSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wLnN0YXJ0ICs9IDFcbiAgICAgICAgICAgICAgICAgICAgYWR2YW5jZSgpXG5cbiAgICAgICAgICAgICAgICAgICAgdG9wLm1hdGNoID0gdG9wLm1hdGNoLnRyaW1SaWdodCgpXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgdG9wLm1hdGNoLmxlbmd0aFxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB0b3AudmFsdWUgaW4gWydzdHJpbmcgc2luZ2xlJyAnc3RyaW5nIGRvdWJsZScgJ3N0cmluZyB0cmlwbGUnICdzdHJpbmcgdHJpcGxlIHNraW5ueSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BsaXQgPSB0b3AubWF0Y2guc3BsaXQgL1xcc1xccysvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgc3BsaXQubGVuZ3RoID09IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2ggdG9wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSB3b3JkID0gc3BsaXQuc2hpZnQoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkbWF0Y2ggPSB0b3AubWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcC5tYXRjaCA9IHdvcmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoIHRvcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wID0gXy5jbG9uZURlZXAgdG9wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3Auc3RhcnQgKz0gd29yZC5sZW5ndGggKyAyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3AubWF0Y2ggPSBvbGRtYXRjaC5zbGljZSB3b3JkLmxlbmd0aCArIDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkdmFuY2UoKVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoIHRvcFxuXG4gICAgICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAgICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgICAgICBwdXNoRm9yY2VSZWdpb24gPSAocmVnaW9uKSA9PlxuXG4gICAgICAgICAgICBzdGFydCA9IHAtMStyZWdpb24ub3Blbi5sZW5ndGhcblxuICAgICAgICAgICAgcmVzdWx0LnB1c2hcbiAgICAgICAgICAgICAgICBzdGFydDogcC0xXG4gICAgICAgICAgICAgICAgbWF0Y2g6IHJlZ2lvbi5vcGVuXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJlZ2lvbi5jbHNzICsgJyBtYXJrZXInXG5cbiAgICAgICAgICAgIGlmIHN0YXJ0IDwgdGV4dC5sZW5ndGgtMVxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQgQGRpc3NGb3JDbGFzcyB0ZXh0LCBzdGFydCwgcmVnaW9uLmNsc3NcblxuICAgICAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuICAgICAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuICAgICAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMFxuICAgICAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG4gICAgICAgIHB1c2hSZWdpb24gPSAocmVnaW9uKSAtPlxuXG4gICAgICAgICAgICBwdXNoVG9wKClcblxuICAgICAgICAgICAgcmVzdWx0LnB1c2hcbiAgICAgICAgICAgICAgICBzdGFydDogcC0xXG4gICAgICAgICAgICAgICAgbWF0Y2g6IHJlZ2lvbi5vcGVuXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJlZ2lvbi5jbHNzICsgJyBtYXJrZXInXG5cbiAgICAgICAgICAgIHN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgICBzdGFydDogIHAtMStyZWdpb24ub3Blbi5sZW5ndGhcbiAgICAgICAgICAgICAgICByZWdpb246IHJlZ2lvblxuXG4gICAgICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDBcbiAgICAgICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwXG5cbiAgICAgICAgcG9wUmVnaW9uID0gKHJlc3QpIC0+XG5cbiAgICAgICAgICAgIHRvcCA9IF8ubGFzdCBzdGFja1xuXG4gICAgICAgICAgICBpZiB0b3A/LnJlZ2lvbi5jbG9zZT8gYW5kIHJlc3Quc3RhcnRzV2l0aCB0b3AucmVnaW9uLmNsb3NlXG5cbiAgICAgICAgICAgICAgICBwdXNoVG9wKClcbiAgICAgICAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgIGlmIHRvcC5mYWtlXG4gICAgICAgICAgICAgICAgICAgIGtlZXBVbmJhbGFuY2VkLnVuc2hpZnRcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiAgcC0xXG4gICAgICAgICAgICAgICAgICAgICAgICByZWdpb246IHRvcC5yZWdpb25cblxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBwLTFcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHRvcC5yZWdpb24uY2xzcyArICcgbWFya2VyJ1xuICAgICAgICAgICAgICAgICAgICBtYXRjaDogdG9wLnJlZ2lvbi5jbG9zZVxuXG4gICAgICAgICAgICAgICAgcCArPSB0b3AucmVnaW9uLmNsb3NlLmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvcFxuICAgICAgICAgICAgZmFsc2VcblxuICAgICAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAgICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICAgICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMFxuXG4gICAgICAgIHdoaWxlIHAgPCB0ZXh0Lmxlbmd0aFxuXG4gICAgICAgICAgICBjaCA9IHRleHRbcF1cbiAgICAgICAgICAgIHAgKz0gMVxuXG4gICAgICAgICAgICB0b3AgPSBfLmxhc3Qgc3RhY2tcblxuICAgICAgICAgICAgaWYgY2ggPT0gJ1xcXFwnIHRoZW4gZXNjYXBlcysrXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgY2ggPT0gJyAnXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgICAgICBpZiBlc2NhcGVzXG4gICAgICAgICAgICAgICAgICAgIGlmIGVzY2FwZXMgJSAyIGFuZCAoY2ggIT0gXCIjXCIgb3IgdG9wIGFuZCB0b3AucmVnaW9uLnZhbHVlICE9ICdpbnRlcnBvbGF0aW9uJylcbiAgICAgICAgICAgICAgICAgICAgICAgIGVzY2FwZXMgPSAwICMgY2hhcmFjdGVyIGlzIGVzY2FwZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSAgICAjIGp1c3QgY29udGludWUgdG8gbmV4dFxuICAgICAgICAgICAgICAgICAgICBlc2NhcGVzID0gMFxuXG4gICAgICAgICAgICAgICAgaWYgY2ggPT0gJzonXG4gICAgICAgICAgICAgICAgICAgIGlmIEBzeW50YXgubmFtZSA9PSAnanNvbicgIyBoaWdobGlnaHQganNvbiBkaWN0aW9uYXJ5IGtleXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIF8ubGFzdChyZXN1bHQpLnZhbHVlID09ICdzdHJpbmcgZG91YmxlIG1hcmtlcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiByZXN1bHQubGVuZ3RoID4gMSBhbmQgcmVzdWx0W3Jlc3VsdC5sZW5ndGgtMl0udmFsdWUgPT0gJ3N0cmluZyBkb3VibGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoLTJdLnZhbHVlID0gJ3N0cmluZyBkaWN0aW9uYXJ5IGtleSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBwLTFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoOiBjaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICdkaWN0aW9uYXJ5IG1hcmtlcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgcmVzdCA9IHRleHQuc2xpY2UgcC0xXG5cbiAgICAgICAgICAgIGlmIGVtcHR5KHRvcCkgb3IgdG9wLnJlZ2lvbj8uY2xzcyA9PSAnaW50ZXJwb2xhdGlvbidcblxuICAgICAgICAgICAgICAgIGlmIHBvcFJlZ2lvbiByZXN0XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgICAgICBpZiBAcmVnaW9ucy5tdWx0aUNvbW1lbnQgYW5kIHJlc3Quc3RhcnRzV2l0aCBAcmVnaW9ucy5tdWx0aUNvbW1lbnQub3BlblxuICAgICAgICAgICAgICAgICAgICBwdXNoUmVnaW9uIEByZWdpb25zLm11bHRpQ29tbWVudFxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAcmVnaW9ucy5tdWx0aVN0cmluZyBhbmQgcmVzdC5zdGFydHNXaXRoIEByZWdpb25zLm11bHRpU3RyaW5nLm9wZW5cbiAgICAgICAgICAgICAgICAgICAgcHVzaFJlZ2lvbiBAcmVnaW9ucy5tdWx0aVN0cmluZ1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAcmVnaW9ucy5tdWx0aVN0cmluZzIgYW5kIHJlc3Quc3RhcnRzV2l0aCBAcmVnaW9ucy5tdWx0aVN0cmluZzIub3BlblxuICAgICAgICAgICAgICAgICAgICBwdXNoUmVnaW9uIEByZWdpb25zLm11bHRpU3RyaW5nMlxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBlbXB0eSB0b3BcbiAgICAgICAgICAgICAgICAgICAgZm9yY2VkID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgcHVzaGVkID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgZm9yIG9wZW5SZWdpb24gaW4gQG9wZW5SZWdpb25zXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiByZXN0LnN0YXJ0c1dpdGggb3BlblJlZ2lvbi5vcGVuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgb3BlblJlZ2lvbi5taW5YPyBhbmQgcC0xIDwgb3BlblJlZ2lvbi5taW5YIHRoZW4gY29udGludWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBvcGVuUmVnaW9uLm1heFg/IGFuZCBwLTEgPiBvcGVuUmVnaW9uLm1heFggdGhlbiBjb250aW51ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5vdCBvcGVuUmVnaW9uLnNvbG8gb3IgZW1wdHkgdGV4dC5zbGljZSgwLCBwLTEpLnRyaW0oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBvcGVuUmVnaW9uLmZvcmNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdXNoRm9yY2VSZWdpb24gb3BlblJlZ2lvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdXNoUmVnaW9uIG9wZW5SZWdpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWsgaWYgZm9yY2VkXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIGlmIHB1c2hlZFxuXG4gICAgICAgICAgICAgICAgaWYgQHJlZ2lvbnMucmVnZXhwIGFuZCBjaCA9PSBAcmVnaW9ucy5yZWdleHAub3BlblxuICAgICAgICAgICAgICAgICAgICBwdXNoUmVnaW9uIEByZWdpb25zLnJlZ2V4cFxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIGlmIGNoID09IEByZWdpb25zLnNpbmdsZVN0cmluZz8ub3BlblxuICAgICAgICAgICAgICAgICAgICBwdXNoUmVnaW9uIEByZWdpb25zLnNpbmdsZVN0cmluZ1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIGlmIGNoID09IEByZWdpb25zLmRvdWJsZVN0cmluZy5vcGVuXG4gICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gQHJlZ2lvbnMuZG91YmxlU3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIGVsc2VcblxuICAgICAgICAgICAgICAgIGlmIHRvcC5yZWdpb24uY2xzcyBpbiBbJ3N0cmluZyBkb3VibGUnICdzdHJpbmcgdHJpcGxlJ11cblxuICAgICAgICAgICAgICAgICAgICBpZiBAcmVnaW9ucy5pbnRlcnBvbGF0aW9uIGFuZCByZXN0LnN0YXJ0c1dpdGggQHJlZ2lvbnMuaW50ZXJwb2xhdGlvbi5vcGVuICMgc3RyaW5nIGludGVycG9sYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hSZWdpb24gQHJlZ2lvbnMuaW50ZXJwb2xhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgICAgIGlmIHBvcFJlZ2lvbiByZXN0XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgcmVhbFN0YWNrID0gc3RhY2suZmlsdGVyIChzKSAtPiBub3Qgcy5mYWtlIGFuZCBzLnJlZ2lvbi5jbG9zZSAhPSBudWxsIGFuZCBzLnJlZ2lvbi5tdWx0aVxuXG4gICAgICAgIGNsb3NlU3RhY2tJdGVtID0gKHN0YWNrSXRlbSkgPT5cbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQgQGRpc3NGb3JDbGFzcyB0ZXh0LCBfLmxhc3QocmVzdWx0KS5zdGFydCArIF8ubGFzdChyZXN1bHQpLm1hdGNoLmxlbmd0aCwgc3RhY2tJdGVtLnJlZ2lvbi5jbHNzXG5cbiAgICAgICAgaWYgcmVhbFN0YWNrLmxlbmd0aFxuICAgICAgICAgICAgQHNldFVuYmFsYW5jZWQgbGksIHJlYWxTdGFja1xuICAgICAgICAgICAgY2xvc2VTdGFja0l0ZW0gXy5sYXN0IHJlYWxTdGFja1xuICAgICAgICBlbHNlIGlmIGtlZXBVbmJhbGFuY2VkLmxlbmd0aFxuICAgICAgICAgICAgQHNldFVuYmFsYW5jZWQgbGksIGtlZXBVbmJhbGFuY2VkXG4gICAgICAgICAgICBpZiBzdGFjay5sZW5ndGhcbiAgICAgICAgICAgICAgICBjbG9zZVN0YWNrSXRlbSBfLmxhc3Qgc3RhY2tcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgc3RhY2subGVuZ3RoIGFuZCBfLmxhc3Qoc3RhY2spLnJlZ2lvbi5jbG9zZSA9PSBudWxsXG4gICAgICAgICAgICAgICAgY2xvc2VTdGFja0l0ZW0gXy5sYXN0IHN0YWNrXG4gICAgICAgICAgICBAc2V0VW5iYWxhbmNlZCBsaVxuXG4gICAgICAgIHJlc3VsdFxuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgZ2V0VW5iYWxhbmNlZDogKGxpKSAtPlxuXG4gICAgICAgIHN0YWNrID0gW11cbiAgICAgICAgZm9yIHUgaW4gQHVuYmFsYW5jZWRcbiAgICAgICAgICAgIGlmIHUubGluZSA8IGxpXG4gICAgICAgICAgICAgICAgaWYgc3RhY2subGVuZ3RoIGFuZCBfLmxhc3Qoc3RhY2spLnJlZ2lvbi5jbHNzID09IHUucmVnaW9uLmNsc3NcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sucG9wKClcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2ggdVxuICAgICAgICAgICAgaWYgdS5saW5lID49IGxpXG4gICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICBpZiBzdGFjay5sZW5ndGhcbiAgICAgICAgICAgIHJldHVybiBzdGFja1xuXG4gICAgICAgIG51bGxcblxuICAgIHNldFVuYmFsYW5jZWQ6IChsaSwgc3RhY2spIC0+XG5cbiAgICAgICAgXy5yZW1vdmUgQHVuYmFsYW5jZWQsICh1KSAtPiB1LmxpbmUgPT0gbGlcbiAgICAgICAgaWYgc3RhY2s/XG4gICAgICAgICAgICBfLmVhY2ggc3RhY2ssIChzKSAtPiBzLmxpbmUgPSBsaVxuICAgICAgICAgICAgQHVuYmFsYW5jZWQgPSBAdW5iYWxhbmNlZC5jb25jYXQgc3RhY2tcbiAgICAgICAgICAgIEB1bmJhbGFuY2VkLnNvcnQgKGEsYikgLT5cbiAgICAgICAgICAgICAgICBpZiBhLmxpbmUgPT0gYi5saW5lXG4gICAgICAgICAgICAgICAgICAgIGEuc3RhcnQgLSBiLnN0YXJ0XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBhLmxpbmUgLSBiLmxpbmVcblxuICAgIGRlbGV0ZUxpbmU6IChsaSkgLT5cblxuICAgICAgICBfLnJlbW92ZSBAdW5iYWxhbmNlZCwgKHUpIC0+IHUubGluZSA9PSBsaVxuICAgICAgICBfLmVhY2ggQHVuYmFsYW5jZWQsICh1KSAtPiB1LmxpbmUgLT0gMSBpZiB1LmxpbmUgPj0gbGlcblxuICAgIGluc2VydExpbmU6IChsaSkgLT5cblxuICAgICAgICBfLmVhY2ggQHVuYmFsYW5jZWQsICh1KSAtPiB1LmxpbmUgKz0gMSBpZiB1LmxpbmUgPj0gbGlcblxuICAgIGNsZWFyOiAtPlxuXG4gICAgICAgIEB1bmJhbGFuY2VkID0gW11cbiAgICAgICAgQGJsb2NrcyA9IG51bGxcblxubW9kdWxlLmV4cG9ydHMgPSBCYWxhbmNlclxuIl19
//# sourceURL=../../coffee/editor/balancer.coffee