// koffee 1.4.0

/*
 0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
 */
var $, Autocomplete, _, clamp, elem, empty, event, kerror, post, ref, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), kerror = ref.kerror, stopEvent = ref.stopEvent, clamp = ref.clamp, post = ref.post, empty = ref.empty, elem = ref.elem, $ = ref.$, _ = ref._;

event = require('events');

Autocomplete = (function(superClass) {
    extend(Autocomplete, superClass);

    function Autocomplete(editor) {
        var c, specials;
        this.editor = editor;
        this.onLinesSet = bind(this.onLinesSet, this);
        this.onWillDeleteLine = bind(this.onWillDeleteLine, this);
        this.onLineChanged = bind(this.onLineChanged, this);
        this.onLineInserted = bind(this.onLineInserted, this);
        this.onLinesAppended = bind(this.onLinesAppended, this);
        this.onMouseDown = bind(this.onMouseDown, this);
        this.onWheel = bind(this.onWheel, this);
        this.close = bind(this.close, this);
        this.onEdit = bind(this.onEdit, this);
        Autocomplete.__super__.constructor.call(this);
        this.wordinfo = {};
        this.matchList = [];
        this.clones = [];
        this.cloned = [];
        this.close();
        specials = "_-@#";
        this.especial = ((function() {
            var j, len, ref1, results;
            ref1 = specials.split('');
            results = [];
            for (j = 0, len = ref1.length; j < len; j++) {
                c = ref1[j];
                results.push("\\" + c);
            }
            return results;
        })()).join('');
        this.headerRegExp = new RegExp("^[0" + this.especial + "]+$");
        this.notSpecialRegExp = new RegExp("[^" + this.especial + "]");
        this.specialWordRegExp = new RegExp("(\\s+|[\\w" + this.especial + "]+|[^\\s])", 'g');
        this.splitRegExp = new RegExp("[^\\w\\d" + this.especial + "]+", 'g');
        this.editor.on('edit', this.onEdit);
        this.editor.on('linesSet', this.onLinesSet);
        this.editor.on('lineInserted', this.onLineInserted);
        this.editor.on('willDeleteLine', this.onWillDeleteLine);
        this.editor.on('lineChanged', this.onLineChanged);
        this.editor.on('linesAppended', this.onLinesAppended);
        this.editor.on('cursor', this.close);
        this.editor.on('blur', this.close);
    }

    Autocomplete.prototype.onEdit = function(info) {
        var d, j, k, len, len1, m, matches, ref1, ref2, ref3, w, words;
        this.close();
        this.word = _.last(info.before.split(this.splitRegExp));
        switch (info.action) {
            case 'delete':
                console.error('delete!!!!');
                if (((ref1 = this.wordinfo[this.word]) != null ? ref1.temp : void 0) && ((ref2 = this.wordinfo[this.word]) != null ? ref2.count : void 0) <= 0) {
                    return delete this.wordinfo[this.word];
                }
                break;
            case 'insert':
                if (!((ref3 = this.word) != null ? ref3.length : void 0)) {
                    return;
                }
                if (empty(this.wordinfo)) {
                    return;
                }
                matches = _.pickBy(this.wordinfo, (function(_this) {
                    return function(c, w) {
                        return w.startsWith(_this.word) && w.length > _this.word.length;
                    };
                })(this));
                matches = _.toPairs(matches);
                for (j = 0, len = matches.length; j < len; j++) {
                    m = matches[j];
                    d = this.editor.distanceOfWord(m[0]);
                    m[1].distance = 100 - Math.min(d, 100);
                }
                matches.sort(function(a, b) {
                    return (b[1].distance + b[1].count + 1 / b[0].length) - (a[1].distance + a[1].count + 1 / a[0].length);
                });
                words = matches.map(function(m) {
                    return m[0];
                });
                for (k = 0, len1 = words.length; k < len1; k++) {
                    w = words[k];
                    if (!this.firstMatch) {
                        this.firstMatch = w;
                    } else {
                        this.matchList.push(w);
                    }
                }
                if (this.firstMatch == null) {
                    return;
                }
                this.completion = this.firstMatch.slice(this.word.length);
                return this.open(info);
        }
    };

    Autocomplete.prototype.open = function(info) {
        var c, ci, cr, cursor, index, inner, item, j, k, len, len1, len2, m, n, p, ref1, ref2, ref3, sibling, sp, spanInfo, wi, ws;
        cursor = $('.main', this.editor.view);
        if (cursor == null) {
            kerror("Autocomplete.open --- no cursor?");
            return;
        }
        this.span = elem('span', {
            "class": 'autocomplete-span'
        });
        this.span.textContent = this.completion;
        this.span.style.opacity = 1;
        this.span.style.background = "#44a";
        this.span.style.color = "#fff";
        cr = cursor.getBoundingClientRect();
        spanInfo = this.editor.lineSpanAtXY(cr.left, cr.top);
        if (spanInfo == null) {
            p = this.editor.posAtXY(cr.left, cr.top);
            ci = p[1] - this.editor.scroll.top;
            return kerror("no span for autocomplete? cursor topleft: " + (parseInt(cr.left)) + " " + (parseInt(cr.top)), info);
        }
        sp = spanInfo.span;
        inner = sp.innerHTML;
        this.clones.push(sp.cloneNode(true));
        this.clones.push(sp.cloneNode(true));
        this.cloned.push(sp);
        ws = this.word.slice(this.word.search(/\w/));
        wi = ws.length;
        this.clones[0].innerHTML = inner.slice(0, spanInfo.offsetChar + 1);
        this.clones[1].innerHTML = inner.slice(spanInfo.offsetChar + 1);
        sibling = sp;
        while (sibling = sibling.nextSibling) {
            this.clones.push(sibling.cloneNode(true));
            this.cloned.push(sibling);
        }
        sp.parentElement.appendChild(this.span);
        ref1 = this.cloned;
        for (j = 0, len = ref1.length; j < len; j++) {
            c = ref1[j];
            c.style.display = 'none';
        }
        ref2 = this.clones;
        for (k = 0, len1 = ref2.length; k < len1; k++) {
            c = ref2[k];
            this.span.insertAdjacentElement('afterend', c);
        }
        this.moveClonesBy(this.completion.length);
        if (this.matchList.length) {
            this.list = elem({
                "class": 'autocomplete-list'
            });
            this.list.addEventListener('wheel', this.onWheel);
            this.list.addEventListener('mousedown', this.onMouseDown);
            index = 0;
            ref3 = this.matchList;
            for (n = 0, len2 = ref3.length; n < len2; n++) {
                m = ref3[n];
                item = elem({
                    "class": 'autocomplete-item',
                    index: index++
                });
                item.textContent = m;
                this.list.appendChild(item);
            }
            return cursor.appendChild(this.list);
        }
    };

    Autocomplete.prototype.close = function() {
        var c, j, k, len, len1, ref1, ref2, ref3;
        if (this.list != null) {
            this.list.removeEventListener('wheel', this.onWheel);
            this.list.removeEventListener('click', this.onClick);
            this.list.remove();
        }
        if ((ref1 = this.span) != null) {
            ref1.remove();
        }
        this.selected = -1;
        this.list = null;
        this.span = null;
        this.completion = null;
        this.firstMatch = null;
        ref2 = this.clones;
        for (j = 0, len = ref2.length; j < len; j++) {
            c = ref2[j];
            c.remove();
        }
        ref3 = this.cloned;
        for (k = 0, len1 = ref3.length; k < len1; k++) {
            c = ref3[k];
            c.style.display = 'initial';
        }
        this.clones = [];
        this.cloned = [];
        this.matchList = [];
        return this;
    };

    Autocomplete.prototype.onWheel = function(event) {
        this.list.scrollTop += event.deltaY;
        return stopEvent(event);
    };

    Autocomplete.prototype.onMouseDown = function(event) {
        var index;
        index = elem.upAttr(event.target, 'index');
        if (index) {
            this.select(index);
            this.onEnter();
        }
        return stopEvent(event);
    };

    Autocomplete.prototype.onEnter = function() {
        this.editor.pasteText(this.selectedCompletion());
        return this.close();
    };

    Autocomplete.prototype.selectedCompletion = function() {
        if (this.selected >= 0) {
            return this.matchList[this.selected].slice(this.word.length);
        } else {
            return this.completion;
        }
    };

    Autocomplete.prototype.navigate = function(delta) {
        if (!this.list) {
            return;
        }
        return this.select(clamp(-1, this.matchList.length - 1, this.selected + delta));
    };

    Autocomplete.prototype.select = function(index) {
        var ref1, ref2, ref3;
        if ((ref1 = this.list.children[this.selected]) != null) {
            ref1.classList.remove('selected');
        }
        this.selected = index;
        if (this.selected >= 0) {
            if ((ref2 = this.list.children[this.selected]) != null) {
                ref2.classList.add('selected');
            }
            if ((ref3 = this.list.children[this.selected]) != null) {
                ref3.scrollIntoViewIfNeeded();
            }
        }
        this.span.innerHTML = this.selectedCompletion();
        this.moveClonesBy(this.span.innerHTML.length);
        if (this.selected < 0) {
            this.span.classList.remove('selected');
        }
        if (this.selected >= 0) {
            return this.span.classList.add('selected');
        }
    };

    Autocomplete.prototype.prev = function() {
        return this.navigate(-1);
    };

    Autocomplete.prototype.next = function() {
        return this.navigate(1);
    };

    Autocomplete.prototype.last = function() {
        return this.navigate(this.matchList.length - this.selected);
    };

    Autocomplete.prototype.moveClonesBy = function(numChars) {
        var beforeLength, c, charOffset, ci, j, offset, ref1, spanOffset;
        if (empty(this.clones)) {
            return;
        }
        beforeLength = this.clones[0].innerHTML.length;
        for (ci = j = 1, ref1 = this.clones.length; 1 <= ref1 ? j < ref1 : j > ref1; ci = 1 <= ref1 ? ++j : --j) {
            c = this.clones[ci];
            offset = parseFloat(this.cloned[ci - 1].style.transform.split('translateX(')[1]);
            charOffset = numChars;
            if (ci === 1) {
                charOffset += beforeLength;
            }
            c.style.transform = "translatex(" + (offset + this.editor.size.charWidth * charOffset) + "px)";
        }
        spanOffset = parseFloat(this.cloned[0].style.transform.split('translateX(')[1]);
        spanOffset += this.editor.size.charWidth * beforeLength;
        return this.span.style.transform = "translatex(" + spanOffset + "px)";
    };

    Autocomplete.prototype.parseLines = function(lines, opt) {
        var count, cursorWord, i, info, j, k, l, len, len1, len2, n, ref1, ref2, ref3, w, words;
        this.close();
        if (lines == null) {
            return;
        }
        cursorWord = this.cursorWord();
        for (j = 0, len = lines.length; j < len; j++) {
            l = lines[j];
            if ((l != null ? l.split : void 0) == null) {
                return kerror("Autocomplete.parseLines -- line has no split? action: " + opt.action + " line: " + l, lines);
            }
            words = l.split(this.splitRegExp);
            words = words.filter((function(_this) {
                return function(w) {
                    if (w === cursorWord) {
                        return false;
                    }
                    if (_this.word === w.slice(0, w.length - 1)) {
                        return false;
                    }
                    if (_this.headerRegExp.test(w)) {
                        return false;
                    }
                    return true;
                };
            })(this));
            for (k = 0, len1 = words.length; k < len1; k++) {
                w = words[k];
                i = w.search(this.notSpecialRegExp);
                if (i > 0 && w[0] !== "#") {
                    w = w.slice(i);
                    if (!/^[\-]?[\d]+$/.test(w)) {
                        words.push(w);
                    }
                }
            }
            for (n = 0, len2 = words.length; n < len2; n++) {
                w = words[n];
                info = (ref1 = this.wordinfo[w]) != null ? ref1 : {};
                count = (ref2 = info.count) != null ? ref2 : 0;
                count += (ref3 = opt != null ? opt.count : void 0) != null ? ref3 : 1;
                info.count = count;
                if (opt.action === 'change') {
                    info.temp = true;
                }
                this.wordinfo[w] = info;
            }
        }
        return post.emit('autocompleteCount', _.size(this.wordinfo));
    };

    Autocomplete.prototype.cursorWords = function() {
        var after, befor, cp, cursr, ref1, words;
        cp = this.editor.cursorPos();
        words = this.editor.wordRangesInLineAtIndex(cp[1], {
            regExp: this.specialWordRegExp
        });
        ref1 = rangesSplitAtPosInRanges(cp, words), befor = ref1[0], cursr = ref1[1], after = ref1[2];
        return [this.editor.textsInRanges(befor), this.editor.textInRange(cursr), this.editor.textsInRanges(after)];
    };

    Autocomplete.prototype.cursorWord = function() {
        return this.cursorWords()[1];
    };

    Autocomplete.prototype.onLinesAppended = function(lines) {
        return this.parseLines(lines, {
            action: 'append'
        });
    };

    Autocomplete.prototype.onLineInserted = function(li) {
        return this.parseLines([this.editor.line(li)], {
            action: 'insert'
        });
    };

    Autocomplete.prototype.onLineChanged = function(li) {
        return this.parseLines([this.editor.line(li)], {
            action: 'change',
            count: 0
        });
    };

    Autocomplete.prototype.onWillDeleteLine = function(line) {
        return this.parseLines([line], {
            action: 'delete',
            count: -1
        });
    };

    Autocomplete.prototype.onLinesSet = function(lines) {
        if (lines.length) {
            return this.parseLines(lines, {
                action: 'set'
            });
        }
    };

    Autocomplete.prototype.handleModKeyComboEvent = function(mod, key, combo, event) {
        if (this.span == null) {
            return 'unhandled';
        }
        switch (combo) {
            case 'enter':
                return this.onEnter();
        }
        if (this.list != null) {
            switch (combo) {
                case 'down':
                    this.next();
                    return;
                case 'up':
                    if (this.selected >= 0) {
                        this.prev();
                        return;
                    } else {
                        this.last();
                        return;
                    }
            }
        }
        this.close();
        return 'unhandled';
    };

    return Autocomplete;

})(event);

module.exports = Autocomplete;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwyRUFBQTtJQUFBOzs7O0FBUUEsTUFBd0QsT0FBQSxDQUFRLEtBQVIsQ0FBeEQsRUFBRSxtQkFBRixFQUFVLHlCQUFWLEVBQXFCLGlCQUFyQixFQUE0QixlQUE1QixFQUFrQyxpQkFBbEMsRUFBeUMsZUFBekMsRUFBK0MsU0FBL0MsRUFBa0Q7O0FBRWxELEtBQUEsR0FBVSxPQUFBLENBQVEsUUFBUjs7QUFFSjs7O0lBRUMsc0JBQUMsTUFBRDtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsU0FBRDs7Ozs7Ozs7OztRQUVBLDRDQUFBO1FBRUEsSUFBQyxDQUFBLFFBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFDYixJQUFDLENBQUEsTUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLE1BQUQsR0FBYTtRQUViLElBQUMsQ0FBQSxLQUFELENBQUE7UUFFQSxRQUFBLEdBQVc7UUFDWCxJQUFDLENBQUEsUUFBRCxHQUFZOztBQUFDO0FBQUE7aUJBQUEsc0NBQUE7OzZCQUFBLElBQUEsR0FBSztBQUFMOztZQUFELENBQW1DLENBQUMsSUFBcEMsQ0FBeUMsRUFBekM7UUFDWixJQUFDLENBQUEsWUFBRCxHQUFxQixJQUFJLE1BQUosQ0FBVyxLQUFBLEdBQU0sSUFBQyxDQUFBLFFBQVAsR0FBZ0IsS0FBM0I7UUFFckIsSUFBQyxDQUFBLGdCQUFELEdBQXFCLElBQUksTUFBSixDQUFXLElBQUEsR0FBSyxJQUFDLENBQUEsUUFBTixHQUFlLEdBQTFCO1FBQ3JCLElBQUMsQ0FBQSxpQkFBRCxHQUFxQixJQUFJLE1BQUosQ0FBVyxZQUFBLEdBQWEsSUFBQyxDQUFBLFFBQWQsR0FBdUIsWUFBbEMsRUFBK0MsR0FBL0M7UUFDckIsSUFBQyxDQUFBLFdBQUQsR0FBcUIsSUFBSSxNQUFKLENBQVcsVUFBQSxH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QSxJQUFHLGlCQUFIO0FBQ0ksb0JBQU8sS0FBUDtBQUFBLHFCQUNTLE1BRFQ7b0JBRVEsSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUNBO0FBSFIscUJBSVMsSUFKVDtvQkFLUSxJQUFHLElBQUMsQ0FBQSxRQUFELElBQWEsQ0FBaEI7d0JBQ0ksSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUNBLCtCQUZKO3FCQUFBLE1BQUE7d0JBSUksSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUNBLCtCQUxKOztBQUxSLGFBREo7O1FBWUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtlQUNBO0lBcEJvQjs7OztHQTlURDs7QUFvVjNCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiMjI1xuXG57IGtlcnJvciwgc3RvcEV2ZW50LCBjbGFtcCwgcG9zdCwgZW1wdHksIGVsZW0sICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuZXZlbnQgICA9IHJlcXVpcmUgJ2V2ZW50cydcblxuY2xhc3MgQXV0b2NvbXBsZXRlIGV4dGVuZHMgZXZlbnRcblxuICAgIEA6IChAZWRpdG9yKSAtPiBcbiAgICAgICAgXG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgXG4gICAgICAgIEB3b3JkaW5mbyAgPSB7fVxuICAgICAgICBAbWF0Y2hMaXN0ID0gW11cbiAgICAgICAgQGNsb25lcyAgICA9IFtdXG4gICAgICAgIEBjbG9uZWQgICAgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIHNwZWNpYWxzID0gXCJfLUAjXCJcbiAgICAgICAgQGVzcGVjaWFsID0gKFwiXFxcXFwiK2MgZm9yIGMgaW4gc3BlY2lhbHMuc3BsaXQgJycpLmpvaW4gJydcbiAgICAgICAgQGhlYWRlclJlZ0V4cCAgICAgID0gbmV3IFJlZ0V4cCBcIl5bMCN7QGVzcGVjaWFsfV0rJFwiXG4gICAgICAgIFxuICAgICAgICBAbm90U3BlY2lhbFJlZ0V4cCAgPSBuZXcgUmVnRXhwIFwiW14je0Blc3BlY2lhbH1dXCJcbiAgICAgICAgQHNwZWNpYWxXb3JkUmVnRXhwID0gbmV3IFJlZ0V4cCBcIihcXFxccyt8W1xcXFx3I3tAZXNwZWNpYWx9XSt8W15cXFxcc10pXCIsICdnJ1xuICAgICAgICBAc3BsaXRSZWdFeHAgICAgICAgPSBuZXcgUmVnRXhwIFwiW15cXFxcd1xcXFxkI3tAZXNwZWNpYWx9XStcIiwgJ2cnICAgICAgICBcbiAgICBcbiAgICAgICAgQGVkaXRvci5vbiAnZWRpdCcsICAgICAgICAgICBAb25FZGl0XG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVzU2V0JywgICAgICAgQG9uTGluZXNTZXRcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZUluc2VydGVkJywgICBAb25MaW5lSW5zZXJ0ZWRcbiAgICAgICAgQGVkaXRvci5vbiAnd2lsbERlbGV0ZUxpbmUnLCBAb25XaWxsRGVsZXRlTGluZVxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lQ2hhbmdlZCcsICAgIEBvbkxpbmVDaGFuZ2VkXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVzQXBwZW5kZWQnLCAgQG9uTGluZXNBcHBlbmRlZFxuICAgICAgICBAZWRpdG9yLm9uICdjdXJzb3InLCAgICAgICAgIEBjbG9zZVxuICAgICAgICBAZWRpdG9yLm9uICdibHVyJywgICAgICAgICAgIEBjbG9zZVxuICAgICAgICBcbiAgICAgICAgIyBwb3N0Lm9uICdmdW5jc0NvdW50JywgICAgICAgIEBvbkZ1bmNzQ291bnRcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgIFxuXG4gICAgb25FZGl0OiAoaW5mbykgPT5cbiAgICAgICAgXG4gICAgICAgIEBjbG9zZSgpXG4gICAgICAgIEB3b3JkID0gXy5sYXN0IGluZm8uYmVmb3JlLnNwbGl0IEBzcGxpdFJlZ0V4cFxuICAgICAgICBzd2l0Y2ggaW5mby5hY3Rpb25cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgd2hlbiAnZGVsZXRlJyAjIGV2ZXIgaGFwcGVuaW5nP1xuICAgICAgICAgICAgICAgIGVycm9yICdkZWxldGUhISEhJ1xuICAgICAgICAgICAgICAgIGlmIEB3b3JkaW5mb1tAd29yZF0/LnRlbXAgYW5kIEB3b3JkaW5mb1tAd29yZF0/LmNvdW50IDw9IDBcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIEB3b3JkaW5mb1tAd29yZF1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdpbnNlcnQnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIG5vdCBAd29yZD8ubGVuZ3RoXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIGVtcHR5IEB3b3JkaW5mb1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG1hdGNoZXMgPSBfLnBpY2tCeSBAd29yZGluZm8sIChjLHcpID0+IHcuc3RhcnRzV2l0aChAd29yZCkgYW5kIHcubGVuZ3RoID4gQHdvcmQubGVuZ3RoICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbWF0Y2hlcyA9IF8udG9QYWlycyBtYXRjaGVzXG4gICAgICAgICAgICAgICAgZm9yIG0gaW4gbWF0Y2hlc1xuICAgICAgICAgICAgICAgICAgICBkID0gQGVkaXRvci5kaXN0YW5jZU9mV29yZCBtWzBdXG4gICAgICAgICAgICAgICAgICAgIG1bMV0uZGlzdGFuY2UgPSAxMDAgLSBNYXRoLm1pbiBkLCAxMDBcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbWF0Y2hlcy5zb3J0IChhLGIpIC0+XG4gICAgICAgICAgICAgICAgICAgIChiWzFdLmRpc3RhbmNlK2JbMV0uY291bnQrMS9iWzBdLmxlbmd0aCkgLSAoYVsxXS5kaXN0YW5jZSthWzFdLmNvdW50KzEvYVswXS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdvcmRzID0gbWF0Y2hlcy5tYXAgKG0pIC0+IG1bMF1cbiAgICAgICAgICAgICAgICBmb3IgdyBpbiB3b3Jkc1xuICAgICAgICAgICAgICAgICAgICBpZiBub3QgQGZpcnN0TWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgICAgIEBmaXJzdE1hdGNoID0gdyBcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQG1hdGNoTGlzdC5wdXNoIHdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbm90IEBmaXJzdE1hdGNoP1xuICAgICAgICAgICAgICAgIEBjb21wbGV0aW9uID0gQGZpcnN0TWF0Y2guc2xpY2UgQHdvcmQubGVuZ3RoXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQG9wZW4gaW5mb1xuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgIFxuICAgIG9wZW46IChpbmZvKSAtPlxuICAgICAgICBcbiAgICAgICAgY3Vyc29yID0gJCgnLm1haW4nLCBAZWRpdG9yLnZpZXcpXG4gICAgICAgIGlmIG5vdCBjdXJzb3I/XG4gICAgICAgICAgICBrZXJyb3IgXCJBdXRvY29tcGxldGUub3BlbiAtLS0gbm8gY3Vyc29yP1wiXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBAc3BhbiA9IGVsZW0gJ3NwYW4nLCBjbGFzczogJ2F1dG9jb21wbGV0ZS1zcGFuJ1xuICAgICAgICBAc3Bhbi50ZXh0Q29udGVudCA9IEBjb21wbGV0aW9uXG4gICAgICAgIEBzcGFuLnN0eWxlLm9wYWNpdHkgICAgPSAxXG4gICAgICAgIEBzcGFuLnN0eWxlLmJhY2tncm91bmQgPSBcIiM0NGFcIlxuICAgICAgICBAc3Bhbi5zdHlsZS5jb2xvciAgICAgID0gXCIjZmZmXCJcblxuICAgICAgICBjciA9IGN1cnNvci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICBzcGFuSW5mbyA9IEBlZGl0b3IubGluZVNwYW5BdFhZIGNyLmxlZnQsIGNyLnRvcFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IHNwYW5JbmZvP1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBwID0gQGVkaXRvci5wb3NBdFhZIGNyLmxlZnQsIGNyLnRvcFxuICAgICAgICAgICAgY2kgPSBwWzFdLUBlZGl0b3Iuc2Nyb2xsLnRvcFxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcIm5vIHNwYW4gZm9yIGF1dG9jb21wbGV0ZT8gY3Vyc29yIHRvcGxlZnQ6ICN7cGFyc2VJbnQgY3IubGVmdH0gI3twYXJzZUludCBjci50b3B9XCIsIGluZm9cblxuICAgICAgICBzcCA9IHNwYW5JbmZvLnNwYW5cbiAgICAgICAgaW5uZXIgPSBzcC5pbm5lckhUTUxcbiAgICAgICAgQGNsb25lcy5wdXNoIHNwLmNsb25lTm9kZSB0cnVlXG4gICAgICAgIEBjbG9uZXMucHVzaCBzcC5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICBAY2xvbmVkLnB1c2ggc3BcbiAgICAgICAgXG4gICAgICAgIHdzID0gQHdvcmQuc2xpY2UgQHdvcmQuc2VhcmNoIC9cXHcvXG4gICAgICAgIHdpID0gd3MubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICBAY2xvbmVzWzBdLmlubmVySFRNTCA9IGlubmVyLnNsaWNlIDAsIHNwYW5JbmZvLm9mZnNldENoYXIgKyAxIFxuICAgICAgICBAY2xvbmVzWzFdLmlubmVySFRNTCA9IGlubmVyLnNsaWNlICAgIHNwYW5JbmZvLm9mZnNldENoYXIgKyAxXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBzaWJsaW5nID0gc3BcbiAgICAgICAgd2hpbGUgc2libGluZyA9IHNpYmxpbmcubmV4dFNpYmxpbmdcbiAgICAgICAgICAgIEBjbG9uZXMucHVzaCBzaWJsaW5nLmNsb25lTm9kZSB0cnVlXG4gICAgICAgICAgICBAY2xvbmVkLnB1c2ggc2libGluZ1xuICAgICAgICAgICAgXG4gICAgICAgIHNwLnBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQgQHNwYW5cbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEBjbG9uZWRcbiAgICAgICAgICAgIGMuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuXG4gICAgICAgIGZvciBjIGluIEBjbG9uZXNcbiAgICAgICAgICAgIEBzcGFuLmluc2VydEFkamFjZW50RWxlbWVudCAnYWZ0ZXJlbmQnLCBjXG4gICAgICAgICAgICBcbiAgICAgICAgQG1vdmVDbG9uZXNCeSBAY29tcGxldGlvbi5sZW5ndGggICAgICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIGlmIEBtYXRjaExpc3QubGVuZ3RoXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBsaXN0ID0gZWxlbSBjbGFzczogJ2F1dG9jb21wbGV0ZS1saXN0J1xuICAgICAgICAgICAgQGxpc3QuYWRkRXZlbnRMaXN0ZW5lciAnd2hlZWwnICAgICBAb25XaGVlbFxuICAgICAgICAgICAgQGxpc3QuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vkb3duJyBAb25Nb3VzZURvd25cbiAgICAgICAgICAgIGluZGV4ID0gMFxuICAgICAgICAgICAgZm9yIG0gaW4gQG1hdGNoTGlzdFxuICAgICAgICAgICAgICAgIGl0ZW0gPSBlbGVtIGNsYXNzOidhdXRvY29tcGxldGUtaXRlbScgaW5kZXg6aW5kZXgrK1xuICAgICAgICAgICAgICAgIGl0ZW0udGV4dENvbnRlbnQgPSBtXG4gICAgICAgICAgICAgICAgQGxpc3QuYXBwZW5kQ2hpbGQgaXRlbVxuICAgICAgICAgICAgY3Vyc29yLmFwcGVuZENoaWxkIEBsaXN0XG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICBjbG9zZTogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBsaXN0P1xuICAgICAgICAgICAgQGxpc3QucmVtb3ZlRXZlbnRMaXN0ZW5lciAnd2hlZWwnIEBvbldoZWVsXG4gICAgICAgICAgICBAbGlzdC5yZW1vdmVFdmVudExpc3RlbmVyICdjbGljaycgQG9uQ2xpY2tcbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgQHNwYW4/LnJlbW92ZSgpXG4gICAgICAgIEBzZWxlY3RlZCAgID0gLTFcbiAgICAgICAgQGxpc3QgICAgICAgPSBudWxsXG4gICAgICAgIEBzcGFuICAgICAgID0gbnVsbFxuICAgICAgICBAY29tcGxldGlvbiA9IG51bGxcbiAgICAgICAgQGZpcnN0TWF0Y2ggPSBudWxsXG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVzXG4gICAgICAgICAgICBjLnJlbW92ZSgpXG5cbiAgICAgICAgZm9yIGMgaW4gQGNsb25lZFxuICAgICAgICAgICAgYy5zdHlsZS5kaXNwbGF5ID0gJ2luaXRpYWwnXG4gICAgICAgIFxuICAgICAgICBAY2xvbmVzID0gW11cbiAgICAgICAgQGNsb25lZCA9IFtdXG4gICAgICAgIEBtYXRjaExpc3QgID0gW11cbiAgICAgICAgQFxuXG4gICAgb25XaGVlbDogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgQGxpc3Quc2Nyb2xsVG9wICs9IGV2ZW50LmRlbHRhWVxuICAgICAgICBzdG9wRXZlbnQgZXZlbnQgICAgXG4gICAgXG4gICAgb25Nb3VzZURvd246IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gZWxlbS51cEF0dHIgZXZlbnQudGFyZ2V0LCAnaW5kZXgnXG4gICAgICAgIGlmIGluZGV4ICAgICAgICAgICAgXG4gICAgICAgICAgICBAc2VsZWN0IGluZGV4XG4gICAgICAgICAgICBAb25FbnRlcigpXG4gICAgICAgIHN0b3BFdmVudCBldmVudFxuXG4gICAgb25FbnRlcjogLT4gIFxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5wYXN0ZVRleHQgQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgIEBjbG9zZSgpXG5cbiAgICBzZWxlY3RlZENvbXBsZXRpb246IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgQG1hdGNoTGlzdFtAc2VsZWN0ZWRdLnNsaWNlIEB3b3JkLmxlbmd0aFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAY29tcGxldGlvblxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4gICAgXG4gICAgbmF2aWdhdGU6IChkZWx0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGxpc3RcbiAgICAgICAgQHNlbGVjdCBjbGFtcCAtMSwgQG1hdGNoTGlzdC5sZW5ndGgtMSwgQHNlbGVjdGVkK2RlbHRhXG4gICAgICAgIFxuICAgIHNlbGVjdDogKGluZGV4KSAtPlxuICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCdcbiAgICAgICAgQHNlbGVjdGVkID0gaW5kZXhcbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LmNsYXNzTGlzdC5hZGQgJ3NlbGVjdGVkJ1xuICAgICAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpXG4gICAgICAgIEBzcGFuLmlubmVySFRNTCA9IEBzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICBAbW92ZUNsb25lc0J5IEBzcGFuLmlubmVySFRNTC5sZW5ndGhcbiAgICAgICAgQHNwYW4uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnIGlmIEBzZWxlY3RlZCA8IDBcbiAgICAgICAgQHNwYW4uY2xhc3NMaXN0LmFkZCAgICAnc2VsZWN0ZWQnIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgIFxuICAgIHByZXY6IC0+IEBuYXZpZ2F0ZSAtMSAgICBcbiAgICBuZXh0OiAtPiBAbmF2aWdhdGUgMVxuICAgIGxhc3Q6IC0+IEBuYXZpZ2F0ZSBAbWF0Y2hMaXN0Lmxlbmd0aCAtIEBzZWxlY3RlZFxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAgMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwIFxuXG4gICAgbW92ZUNsb25lc0J5OiAobnVtQ2hhcnMpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgQGNsb25lc1xuICAgICAgICBiZWZvcmVMZW5ndGggPSBAY2xvbmVzWzBdLmlubmVySFRNTC5sZW5ndGhcbiAgICAgICAgZm9yIGNpIGluIFsxLi4uQGNsb25lcy5sZW5ndGhdXG4gICAgICAgICAgICBjID0gQGNsb25lc1tjaV1cbiAgICAgICAgICAgIG9mZnNldCA9IHBhcnNlRmxvYXQgQGNsb25lZFtjaS0xXS5zdHlsZS50cmFuc2Zvcm0uc3BsaXQoJ3RyYW5zbGF0ZVgoJylbMV1cbiAgICAgICAgICAgIGNoYXJPZmZzZXQgPSBudW1DaGFyc1xuICAgICAgICAgICAgY2hhck9mZnNldCArPSBiZWZvcmVMZW5ndGggaWYgY2kgPT0gMVxuICAgICAgICAgICAgYy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3tvZmZzZXQrQGVkaXRvci5zaXplLmNoYXJXaWR0aCpjaGFyT2Zmc2V0fXB4KVwiXG4gICAgICAgIHNwYW5PZmZzZXQgPSBwYXJzZUZsb2F0IEBjbG9uZWRbMF0uc3R5bGUudHJhbnNmb3JtLnNwbGl0KCd0cmFuc2xhdGVYKCcpWzFdXG4gICAgICAgIHNwYW5PZmZzZXQgKz0gQGVkaXRvci5zaXplLmNoYXJXaWR0aCpiZWZvcmVMZW5ndGhcbiAgICAgICAgQHNwYW4uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGV4KCN7c3Bhbk9mZnNldH1weClcIlxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgXG4gICAgcGFyc2VMaW5lczoobGluZXMsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjbG9zZSgpXG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBsaW5lcz9cbiAgICAgICAgXG4gICAgICAgIGN1cnNvcldvcmQgPSBAY3Vyc29yV29yZCgpXG4gICAgICAgIGZvciBsIGluIGxpbmVzXG4gICAgICAgICAgICBpZiBub3QgbD8uc3BsaXQ/XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcIkF1dG9jb21wbGV0ZS5wYXJzZUxpbmVzIC0tIGxpbmUgaGFzIG5vIHNwbGl0PyBhY3Rpb246ICN7b3B0LmFjdGlvbn0gbGluZTogI3tsfVwiLCBsaW5lc1xuICAgICAgICAgICAgd29yZHMgPSBsLnNwbGl0IEBzcGxpdFJlZ0V4cFxuICAgICAgICAgICAgd29yZHMgPSB3b3Jkcy5maWx0ZXIgKHcpID0+IFxuICAgICAgICAgICAgICAgICMgcmV0dXJuIGZhbHNlIGlmIG5vdCBJbmRleGVyLnRlc3RXb3JkIHdcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgdyA9PSBjdXJzb3JXb3JkXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIEB3b3JkID09IHcuc2xpY2UgMCwgdy5sZW5ndGgtMVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiBAaGVhZGVyUmVnRXhwLnRlc3Qgd1xuICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciB3IGluIHdvcmRzICMgYXBwZW5kIHdvcmRzIHdpdGhvdXQgbGVhZGluZyBzcGVjaWFsIGNoYXJhY3RlclxuICAgICAgICAgICAgICAgIGkgPSB3LnNlYXJjaCBAbm90U3BlY2lhbFJlZ0V4cFxuICAgICAgICAgICAgICAgIGlmIGkgPiAwIGFuZCB3WzBdICE9IFwiI1wiXG4gICAgICAgICAgICAgICAgICAgIHcgPSB3LnNsaWNlIGlcbiAgICAgICAgICAgICAgICAgICAgd29yZHMucHVzaCB3IGlmIG5vdCAvXltcXC1dP1tcXGRdKyQvLnRlc3Qgd1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgdyBpbiB3b3Jkc1xuICAgICAgICAgICAgICAgIGluZm8gID0gQHdvcmRpbmZvW3ddID8ge31cbiAgICAgICAgICAgICAgICBjb3VudCA9IGluZm8uY291bnQgPyAwXG4gICAgICAgICAgICAgICAgY291bnQgKz0gb3B0Py5jb3VudCA/IDFcbiAgICAgICAgICAgICAgICBpbmZvLmNvdW50ID0gY291bnRcbiAgICAgICAgICAgICAgICBpbmZvLnRlbXAgPSB0cnVlIGlmIG9wdC5hY3Rpb24gaXMgJ2NoYW5nZSdcbiAgICAgICAgICAgICAgICBAd29yZGluZm9bd10gPSBpbmZvXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHBvc3QuZW1pdCAnYXV0b2NvbXBsZXRlQ291bnQnLCBfLnNpemUgQHdvcmRpbmZvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG4gICAgXG4gICAgY3Vyc29yV29yZHM6IC0+IFxuICAgICAgICBcbiAgICAgICAgY3AgPSBAZWRpdG9yLmN1cnNvclBvcygpXG4gICAgICAgIHdvcmRzID0gQGVkaXRvci53b3JkUmFuZ2VzSW5MaW5lQXRJbmRleCBjcFsxXSwgcmVnRXhwOiBAc3BlY2lhbFdvcmRSZWdFeHAgICAgICAgIFxuICAgICAgICBbYmVmb3IsIGN1cnNyLCBhZnRlcl0gPSByYW5nZXNTcGxpdEF0UG9zSW5SYW5nZXMgY3AsIHdvcmRzXG4gICAgICAgIFtAZWRpdG9yLnRleHRzSW5SYW5nZXMoYmVmb3IpLCBAZWRpdG9yLnRleHRJblJhbmdlKGN1cnNyKSwgQGVkaXRvci50ZXh0c0luUmFuZ2VzKGFmdGVyKV1cbiAgICAgICAgXG4gICAgY3Vyc29yV29yZDogLT4gQGN1cnNvcldvcmRzKClbMV1cbiAgICAgICAgICAgICAgICBcbiAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgIFxuICAgIG9uTGluZXNBcHBlbmRlZDogIChsaW5lcykgICAgPT4gQHBhcnNlTGluZXMgbGluZXMsIGFjdGlvbjogJ2FwcGVuZCdcbiAgICBvbkxpbmVJbnNlcnRlZDogICAobGkpICAgICAgID0+IEBwYXJzZUxpbmVzIFtAZWRpdG9yLmxpbmUobGkpXSwgYWN0aW9uOiAnaW5zZXJ0J1xuICAgIG9uTGluZUNoYW5nZWQ6ICAgIChsaSkgICAgICAgPT4gQHBhcnNlTGluZXMgW0BlZGl0b3IubGluZShsaSldLCBhY3Rpb246ICdjaGFuZ2UnIGNvdW50OjBcbiAgICBvbldpbGxEZWxldGVMaW5lOiAobGluZSkgICAgID0+IEBwYXJzZUxpbmVzIFtsaW5lXSwgYWN0aW9uOiAnZGVsZXRlJyBjb3VudDotMVxuICAgIG9uTGluZXNTZXQ6ICAgICAgIChsaW5lcykgICAgPT4gQHBhcnNlTGluZXMgbGluZXMsIGFjdGlvbjogJ3NldCcgaWYgbGluZXMubGVuZ3RoXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAndW5oYW5kbGVkJyBpZiBub3QgQHNwYW4/XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJyB0aGVuIHJldHVybiBAb25FbnRlcigpICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/IFxuICAgICAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICAgICAgd2hlbiAnZG93bidcbiAgICAgICAgICAgICAgICAgICAgQG5leHQoKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB3aGVuICd1cCdcbiAgICAgICAgICAgICAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIEBwcmV2KClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgICAgICAgICAgICAgQGxhc3QoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIEBjbG9zZSgpICAgXG4gICAgICAgICd1bmhhbmRsZWQnXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBBdXRvY29tcGxldGVcbiJdfQ==
//# sourceURL=../../coffee/editor/autocomplete.coffee