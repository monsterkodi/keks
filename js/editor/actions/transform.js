// koffee 1.4.0
var Transform, _, kerror, kstr, matchr, ref, reversed, slash,
    indexOf = [].indexOf,
    slice = [].slice;

ref = require('kxk'), matchr = ref.matchr, reversed = ref.reversed, slash = ref.slash, kstr = ref.kstr, kerror = ref.kerror, _ = ref._;

Transform = (function() {
    Transform.transformNames = ['upper', 'lower', 'title', 'case', 'count', 'add', 'sub', 'up', 'down', 'sort', 'uniq', 'reverse', 'resolve', 'unresolve', 'dir', 'base', 'file', 'ext'];

    Transform.transformMenus = {
        Case: ['upper', 'lower', 'title', 'case'],
        Calc: ['count', 'add', 'sub'],
        Sort: ['up', 'down', 'sort', 'uniq', 'reverse'],
        Path: ['resolve', 'unresolve', 'dir', 'base', 'file', 'ext']
    };

    function Transform(editor1) {
        this.editor = editor1;
        this.editor.transform = this;
        this.last = null;
        this.caseFuncs = ['upper', 'lower', 'title'];
        this.resolveFuncs = ['resolve', 'unresolve'];
        this.sortFuncs = ['up', 'down'];
    }

    Transform.prototype.count = function(typ, offset, step) {
        var base, cs, i, numbers, pad;
        if (typ == null) {
            typ = 'dec';
        }
        if (offset == null) {
            offset = 0;
        }
        if (step == null) {
            step = 1;
        }
        offset = parseInt(offset);
        step = parseInt(step);
        this.editor["do"].start();
        this.editor.fillVirtualSpaces();
        cs = this.editor["do"].cursors();
        this.editor["do"].select(rangesFromPositions(cs));
        switch (typ) {
            case 'hex':
                base = 16;
                break;
            case 'bin':
                base = 2;
                break;
            default:
                base = 10;
        }
        pad = Number(step * (cs.length - 1) + offset).toString(base).length;
        numbers = (function() {
            var j, ref1, results;
            results = [];
            for (i = j = 0, ref1 = cs.length; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
                results.push(_.padStart(Number(step * i + offset).toString(base), pad, '0'));
            }
            return results;
        })();
        this.editor.replaceSelectedText(numbers);
        this.editor["do"].end();
        return 'count';
    };

    Transform.prototype.add = function(d) {
        if (d == null) {
            d = 1;
        }
        this.apply(function(t) {
            return kstr(parseInt(t) + parseInt(d));
        });
        return 'add';
    };

    Transform.prototype.sub = function(d) {
        if (d == null) {
            d = 1;
        }
        this.apply(function(t) {
            return kstr(parseInt(t) - parseInt(d));
        });
        return 'sub';
    };

    Transform.prototype.reverse = function() {
        this.trans(function(l) {
            return reversed(l);
        });
        return 'reverse';
    };

    Transform.prototype.sort = function() {
        return this.toggle(this.sortFuncs);
    };

    Transform.prototype.up = function() {
        this.trans(function(l) {
            return l.sort(function(a, b) {
                return a.localeCompare(b);
            });
        });
        return 'up';
    };

    Transform.prototype.down = function() {
        this.trans(function(l) {
            return reversed(l.sort(function(a, b) {
                return a.localeCompare(b);
            }));
        });
        return 'down';
    };

    Transform.prototype.uniq = function() {
        this.trans(function(l) {
            var a, j, len, r, v;
            v = [];
            r = [];
            for (j = 0, len = l.length; j < len; j++) {
                a = l[j];
                r.push(indexOf.call(v, a) >= 0 ? '' : (v.push(a), a));
            }
            return r;
        });
        return 'uniq';
    };

    Transform.prototype["case"] = function() {
        return this.toggle(this.caseFuncs);
    };

    Transform.prototype.upper = function() {
        this.apply(function(t) {
            return t.toUpperCase();
        });
        return 'upper';
    };

    Transform.prototype.lower = function() {
        this.apply(function(t) {
            return t.toLowerCase();
        });
        return 'lower';
    };

    Transform.prototype.title = function() {
        var pattern;
        pattern = /\w+/;
        this.apply(function(t) {
            var j, len, r, ref1;
            ref1 = matchr.ranges(/\w+/, t);
            for (j = 0, len = ref1.length; j < len; j++) {
                r = ref1[j];
                t = t.splice(r.start, r.match.length, r.match.substr(0, 1).toUpperCase() + r.match.slice(1).toLowerCase());
            }
            return t;
        });
        return 'title';
    };

    Transform.prototype.toggleResolve = function() {
        return this.toggle(this.resolveFuncs);
    };

    Transform.prototype.resolve = function() {
        var cwd;
        cwd = process.cwd();
        if (this.editor.currentFile != null) {
            process.chdir(slash.dir(this.editor.currentFile));
        }
        this.apply(function(t) {
            return slash.resolve(t);
        });
        process.chdir(cwd);
        return 'resolve';
    };

    Transform.prototype.unresolve = function() {
        this.apply(function(t) {
            return slash.unresolve(t);
        });
        return 'unresolve';
    };

    Transform.prototype.base = function() {
        this.apply(function(t) {
            return slash.base(t);
        });
        return 'basename';
    };

    Transform.prototype.dir = function() {
        this.apply(function(t) {
            return slash.dir(t);
        });
        return 'dirname';
    };

    Transform.prototype.ext = function() {
        this.apply(function(t) {
            return slash.ext(t);
        });
        return 'ext';
    };

    Transform.prototype.file = function() {
        this.apply(function(t) {
            return slash.file(t);
        });
        return 'file';
    };

    Transform.prototype.apply = function(func) {
        return this.tfunc({
            apply: func
        });
    };

    Transform.prototype.trans = function(func) {
        return this.tfunc({
            trans: func
        });
    };

    Transform.prototype.tfunc = function(opt) {
        var selections, tl;
        if (!this.editor.numSelections()) {
            if (opt.trans) {
                this.editor.selectMoreLines();
            } else {
                this.editor.select(this.editor.rangesForWordsAtCursors());
            }
        }
        selections = this.editor.selections();
        tl = this.editor.textsInRanges(selections);
        if (opt.apply != null) {
            tl = tl.map(opt.apply);
        }
        if (opt.trans != null) {
            tl = opt.trans(tl);
        }
        this.editor["do"].start();
        this.editor.replaceSelectedText(tl);
        return this.editor["do"].end();
    };

    Transform.prototype.toggle = function(funcList) {
        var nextIndex, ref1;
        if (ref1 = this.last, indexOf.call(funcList, ref1) < 0) {
            this.last = _.last(funcList);
        }
        nextIndex = (1 + funcList.indexOf(this.last)) % funcList.length;
        return this["do"](funcList[nextIndex]);
    };

    Transform.prototype["do"] = function() {
        var args, f, transName;
        transName = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        f = this[transName];
        if (f && _.isFunction(f)) {
            this.last = f.apply(this, args);
        } else {
            return kerror("unhandled transform " + transName);
        }
        return this.last;
    };

    Transform["do"] = function() {
        var args, editor, ref1, t, transName;
        editor = arguments[0], transName = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
        t = (ref1 = editor.transform) != null ? ref1 : new Transform(editor);
        return t["do"].apply(t, [transName].concat(args));
    };

    return Transform;

})();

module.exports = {
    actions: {
        menu: 'Misc',
        toggleCase: {
            separator: true,
            name: 'Toggle Case',
            text: 'toggles selected texts between lower- upper- and title-case',
            combo: 'command+alt+ctrl+u',
            accel: 'alt+ctrl+u'
        },
        reverseSelection: {
            name: 'Reverse Selection',
            text: 'reverses the order of selected texts',
            combo: 'command+alt+ctrl+r',
            accel: 'alt+ctrl+r'
        },
        doTransform: {
            name: 'doTransform'
        }
    },
    toggleCase: function() {
        return Transform["do"](this, 'case');
    },
    reverseSelection: function() {
        return Transform["do"](this, 'reverse');
    },
    doTransform: function(arg) {
        return Transform["do"](this, arg);
    },
    Transform: Transform,
    transformNames: Transform.transformNames
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBT0EsSUFBQSx3REFBQTtJQUFBOzs7QUFBQSxNQUErQyxPQUFBLENBQVEsS0FBUixDQUEvQyxFQUFFLG1CQUFGLEVBQVUsdUJBQVYsRUFBb0IsaUJBQXBCLEVBQTJCLGVBQTNCLEVBQWlDLG1CQUFqQyxFQUF5Qzs7QUFFbkM7SUFFRixTQUFDLENBQUEsY0FBRCxHQUFrQixDQUNkLE9BRGMsRUFDTCxPQURLLEVBQ0ksT0FESixFQUNhLE1BRGIsRUFFZCxPQUZjLEVBRUwsS0FGSyxFQUVFLEtBRkYsRUFHZCxJQUhjLEVBR1IsTUFIUSxFQUdBLE1BSEEsRUFHUSxNQUhSLEVBSWQsU0FKYyxFQUtkLFNBTGMsRUFLSCxXQUxHLEVBTWQsS0FOYyxFQU1QLE1BTk8sRUFPZCxNQVBjLEVBT04sS0FQTTs7SUFTbEIsU0FBQyxDQUFBLGNBQUQsR0FDSTtRQUFBLElBQUEsRUFBTSxDQUFDLE9BQUQsRUFBVSxPQUFWLEVBQW1CLE9BQW5CLEVBQTRCLE1BQTVCLENBQU47UUFDQSxJQUFBLEVBQU0sQ0FBQyxPQUFELEVBQVUsS0FBVixFQUFpQixLQUFqQixDQUROO1FBRUEsSUFBQSxFQUFNLENBQUMsSUFBRCxFQUFPLE1BQVAsRUFBZSxNQUFmLEVBQXVCLE1BQXZCLEVBQStCLFNBQS9CLENBRk47UUFHQSxJQUFBLEVBQU0sQ0FBRSxTQUFGLEVBQWEsV0FBYixFQUEwQixLQUExQixFQUFpQyxNQUFqQyxFQUF5QyxNQUF6QyxFQUFpRCxLQUFqRCxDQUhOOzs7SUFLRCxtQkFBQyxPQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7UUFFQSxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsR0FBb0I7UUFDcEIsSUFBQyxDQUFBLElBQUQsR0FBZ0I7UUFDaEIsSUFBQyxDQUFBLFNBQUQsR0FBZ0IsQ0FBQyxPQUFELEVBQVUsT0FBVixFQUFtQixPQUFuQjtRQUNoQixJQUFD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LEtBQUEsRUFBTyxvQkFGUDtZQUdBLEtBQUEsRUFBTyxZQUhQO1NBVko7UUFlQSxXQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU8sYUFBUDtTQWhCSjtLQUZKO0lBb0JBLFVBQUEsRUFBbUIsU0FBQTtlQUFHLFNBQVMsRUFBQyxFQUFELEVBQVQsQ0FBYSxJQUFiLEVBQWdCLE1BQWhCO0lBQUgsQ0FwQm5CO0lBcUJBLGdCQUFBLEVBQW1CLFNBQUE7ZUFBRyxTQUFTLEVBQUMsRUFBRCxFQUFULENBQWEsSUFBYixFQUFnQixTQUFoQjtJQUFILENBckJuQjtJQXNCQSxXQUFBLEVBQWEsU0FBQyxHQUFEO2VBQVMsU0FBUyxFQUFDLEVBQUQsRUFBVCxDQUFhLElBQWIsRUFBZ0IsR0FBaEI7SUFBVCxDQXRCYjtJQXVCQSxTQUFBLEVBQW1CLFNBdkJuQjtJQXdCQSxjQUFBLEVBQW1CLFNBQVMsQ0FBQyxjQXhCN0IiLCJzb3VyY2VzQ29udGVudCI6WyJcbiMgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMCAgICAgMDBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgICAgMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDBcblxueyBtYXRjaHIsIHJldmVyc2VkLCBzbGFzaCwga3N0ciwga2Vycm9yLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIFRyYW5zZm9ybVxuXG4gICAgQHRyYW5zZm9ybU5hbWVzID0gW1xuICAgICAgICAndXBwZXInLCAnbG93ZXInLCAndGl0bGUnLCAnY2FzZSdcbiAgICAgICAgJ2NvdW50JywgJ2FkZCcsICdzdWInXG4gICAgICAgICd1cCcsICdkb3duJywgJ3NvcnQnLCAndW5pcSdcbiAgICAgICAgJ3JldmVyc2UnLFxuICAgICAgICAncmVzb2x2ZScsICd1bnJlc29sdmUnXG4gICAgICAgICdkaXInLCAnYmFzZSdcbiAgICAgICAgJ2ZpbGUnLCAnZXh0J1xuICAgIF1cbiAgICBAdHJhbnNmb3JtTWVudXMgPVxuICAgICAgICBDYXNlOiBbJ3VwcGVyJywgJ2xvd2VyJywgJ3RpdGxlJywgJ2Nhc2UnXVxuICAgICAgICBDYWxjOiBbJ2NvdW50JywgJ2FkZCcsICdzdWInXVxuICAgICAgICBTb3J0OiBbJ3VwJywgJ2Rvd24nLCAnc29ydCcsICd1bmlxJywgJ3JldmVyc2UnXVxuICAgICAgICBQYXRoOiBbICdyZXNvbHZlJywgJ3VucmVzb2x2ZScsICdkaXInLCAnYmFzZScsICdmaWxlJywgJ2V4dCcgXVxuXG4gICAgQDogKEBlZGl0b3IpIC0+XG5cbiAgICAgICAgQGVkaXRvci50cmFuc2Zvcm0gPSBAXG4gICAgICAgIEBsYXN0ICAgICAgICAgPSBudWxsXG4gICAgICAgIEBjYXNlRnVuY3MgICAgPSBbJ3VwcGVyJywgJ2xvd2VyJywgJ3RpdGxlJ11cbiAgICAgICAgQHJlc29sdmVGdW5jcyA9IFsncmVzb2x2ZScsICd1bnJlc29sdmUnXVxuICAgICAgICBAc29ydEZ1bmNzICAgID0gWyd1cCcsICdkb3duJ11cblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgY291bnQ6ICh0eXA9J2RlYycsIG9mZnNldD0wLCBzdGVwPTEpIC0+XG5cbiAgICAgICAgb2Zmc2V0ID0gcGFyc2VJbnQgb2Zmc2V0XG4gICAgICAgIHN0ZXAgICA9IHBhcnNlSW50IHN0ZXBcblxuICAgICAgICBAZWRpdG9yLmRvLnN0YXJ0KClcbiAgICAgICAgQGVkaXRvci5maWxsVmlydHVhbFNwYWNlcygpXG4gICAgICAgIGNzID0gQGVkaXRvci5kby5jdXJzb3JzKClcbiAgICAgICAgQGVkaXRvci5kby5zZWxlY3QgcmFuZ2VzRnJvbVBvc2l0aW9ucyBjc1xuXG4gICAgICAgIHN3aXRjaCB0eXBcbiAgICAgICAgICAgIHdoZW4gJ2hleCdcbiAgICAgICAgICAgICAgICBiYXNlID0gMTZcbiAgICAgICAgICAgIHdoZW4gJ2JpbidcbiAgICAgICAgICAgICAgICBiYXNlID0gMlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJhc2UgPSAxMFxuXG4gICAgICAgIHBhZCA9IE51bWJlcihzdGVwKihjcy5sZW5ndGgtMSkrb2Zmc2V0KS50b1N0cmluZyhiYXNlKS5sZW5ndGhcbiAgICAgICAgbnVtYmVycyA9IChfLnBhZFN0YXJ0IE51bWJlcihzdGVwKmkrb2Zmc2V0KS50b1N0cmluZyhiYXNlKSwgcGFkLCAnMCcgZm9yIGkgaW4gWzAuLi5jcy5sZW5ndGhdKVxuXG4gICAgICAgIEBlZGl0b3IucmVwbGFjZVNlbGVjdGVkVGV4dCBudW1iZXJzXG4gICAgICAgIEBlZGl0b3IuZG8uZW5kKClcbiAgICAgICAgJ2NvdW50J1xuXG4gICAgYWRkOiAoZD0xKSAtPlxuXG4gICAgICAgIEBhcHBseSAodCkgLT4ga3N0cihwYXJzZUludCh0KSArIHBhcnNlSW50KGQpKVxuICAgICAgICAnYWRkJ1xuXG4gICAgc3ViOiAoZD0xKSAtPlxuXG4gICAgICAgIEBhcHBseSAodCkgLT4ga3N0cihwYXJzZUludCh0KSAtIHBhcnNlSW50KGQpKVxuICAgICAgICAnc3ViJ1xuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICByZXZlcnNlOiAtPlxuICAgICAgICBAdHJhbnMgKGwpIC0+IHJldmVyc2VkIGxcbiAgICAgICAgJ3JldmVyc2UnXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgc29ydDogLT4gQHRvZ2dsZSBAc29ydEZ1bmNzXG5cbiAgICB1cDogLT5cbiAgICAgICAgQHRyYW5zIChsKSAtPiBsLnNvcnQgKGEsYikgLT4gYS5sb2NhbGVDb21wYXJlIGJcbiAgICAgICAgJ3VwJ1xuXG4gICAgZG93bjogLT5cbiAgICAgICAgQHRyYW5zIChsKSAtPiByZXZlcnNlZCBsLnNvcnQgKGEsYikgLT4gYS5sb2NhbGVDb21wYXJlIGJcbiAgICAgICAgJ2Rvd24nXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMCAwMCAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwIDAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMCAwMFxuXG4gICAgdW5pcTogLT5cbiAgICAgICAgQHRyYW5zIChsKSAtPlxuICAgICAgICAgICAgdiA9IFtdXG4gICAgICAgICAgICByID0gW11cbiAgICAgICAgICAgIGZvciBhIGluIGxcbiAgICAgICAgICAgICAgICByLnB1c2ggaWYgYSBpbiB2IHRoZW4gJycgZWxzZVxuICAgICAgICAgICAgICAgICAgICB2LnB1c2ggYVxuICAgICAgICAgICAgICAgICAgICBhXG4gICAgICAgICAgICByXG4gICAgICAgICd1bmlxJ1xuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGNhc2U6IC0+IEB0b2dnbGUgQGNhc2VGdW5jc1xuXG4gICAgdXBwZXI6IC0+XG5cbiAgICAgICAgQGFwcGx5ICh0KSAtPiB0LnRvVXBwZXJDYXNlKClcbiAgICAgICAgJ3VwcGVyJ1xuXG4gICAgbG93ZXI6IC0+XG5cbiAgICAgICAgQGFwcGx5ICh0KSAtPiB0LnRvTG93ZXJDYXNlKClcbiAgICAgICAgJ2xvd2VyJ1xuXG4gICAgdGl0bGU6IC0+XG5cbiAgICAgICAgcGF0dGVybiA9IC9cXHcrL1xuICAgICAgICBAYXBwbHkgKHQpIC0+XG4gICAgICAgICAgICBmb3IgciBpbiBtYXRjaHIucmFuZ2VzIC9cXHcrLywgdFxuICAgICAgICAgICAgICAgIHQgPSB0LnNwbGljZSByLnN0YXJ0LCByLm1hdGNoLmxlbmd0aCwgci5tYXRjaC5zdWJzdHIoMCwxKS50b1VwcGVyQ2FzZSgpICsgci5tYXRjaC5zbGljZSgxKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICB0XG4gICAgICAgICd0aXRsZSdcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwICAgICAgMDAwMDAwMDBcblxuICAgIHRvZ2dsZVJlc29sdmU6IC0+IEB0b2dnbGUgQHJlc29sdmVGdW5jc1xuXG4gICAgcmVzb2x2ZTogLT5cblxuICAgICAgICBjd2QgPSBwcm9jZXNzLmN3ZCgpXG4gICAgICAgIGlmIEBlZGl0b3IuY3VycmVudEZpbGU/XG4gICAgICAgICAgICBwcm9jZXNzLmNoZGlyIHNsYXNoLmRpciBAZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgIEBhcHBseSAodCkgLT4gc2xhc2gucmVzb2x2ZSB0XG4gICAgICAgIHByb2Nlc3MuY2hkaXIgY3dkXG4gICAgICAgICdyZXNvbHZlJ1xuXG4gICAgdW5yZXNvbHZlOiAtPlxuXG4gICAgICAgIEBhcHBseSAodCkgLT4gc2xhc2gudW5yZXNvbHZlIHRcbiAgICAgICAgJ3VucmVzb2x2ZSdcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDBcblxuICAgIGJhc2U6IC0+XG5cbiAgICAgICAgQGFwcGx5ICh0KSAtPiBzbGFzaC5iYXNlIHRcbiAgICAgICAgJ2Jhc2VuYW1lJ1xuXG4gICAgZGlyOiAtPlxuXG4gICAgICAgIEBhcHBseSAodCkgLT4gc2xhc2guZGlyIHRcbiAgICAgICAgJ2Rpcm5hbWUnXG5cbiAgICBleHQ6IC0+XG5cbiAgICAgICAgQGFwcGx5ICh0KSAtPiBzbGFzaC5leHQgdFxuICAgICAgICAnZXh0J1xuXG4gICAgZmlsZTogLT5cblxuICAgICAgICBAYXBwbHkgKHQpIC0+IHNsYXNoLmZpbGUgdFxuICAgICAgICAnZmlsZSdcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAwMDAwICAgICAwMDBcblxuICAgIGFwcGx5OiAoZnVuYykgLT4gQHRmdW5jIGFwcGx5OmZ1bmNcblxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICB0cmFuczogKGZ1bmMpIC0+IEB0ZnVuYyB0cmFuczpmdW5jXG5cbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwXG5cbiAgICB0ZnVuYzogKG9wdCkgLT5cblxuICAgICAgICBpZiBub3QgQGVkaXRvci5udW1TZWxlY3Rpb25zKClcblxuICAgICAgICAgICAgaWYgb3B0LnRyYW5zXG4gICAgICAgICAgICAgICAgQGVkaXRvci5zZWxlY3RNb3JlTGluZXMoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBlZGl0b3Iuc2VsZWN0IEBlZGl0b3IucmFuZ2VzRm9yV29yZHNBdEN1cnNvcnMoKVxuXG4gICAgICAgIHNlbGVjdGlvbnMgPSBAZWRpdG9yLnNlbGVjdGlvbnMoKVxuXG4gICAgICAgIHRsID0gQGVkaXRvci50ZXh0c0luUmFuZ2VzIHNlbGVjdGlvbnNcbiAgICAgICAgdGwgPSB0bC5tYXAgb3B0LmFwcGx5IGlmIG9wdC5hcHBseT9cbiAgICAgICAgdGwgPSBvcHQudHJhbnMgdGwgICAgIGlmIG9wdC50cmFucz9cblxuICAgICAgICBAZWRpdG9yLmRvLnN0YXJ0KClcbiAgICAgICAgQGVkaXRvci5yZXBsYWNlU2VsZWN0ZWRUZXh0IHRsXG4gICAgICAgIEBlZGl0b3IuZG8uZW5kKClcblxuICAgICMgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIHRvZ2dsZTogKGZ1bmNMaXN0KSAtPlxuXG4gICAgICAgIGlmIEBsYXN0IG5vdCBpbiBmdW5jTGlzdFxuICAgICAgICAgICAgQGxhc3QgPSBfLmxhc3QgZnVuY0xpc3RcblxuICAgICAgICBuZXh0SW5kZXggPSAoMSArIGZ1bmNMaXN0LmluZGV4T2YgQGxhc3QpICUgZnVuY0xpc3QubGVuZ3RoXG4gICAgICAgIEBkbyBmdW5jTGlzdFtuZXh0SW5kZXhdXG5cbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDBcblxuICAgIGRvOiAodHJhbnNOYW1lLCBhcmdzLi4uKSAtPlxuXG4gICAgICAgIGYgPSBAW3RyYW5zTmFtZV1cblxuICAgICAgICBpZiBmIGFuZCBfLmlzRnVuY3Rpb24gZlxuICAgICAgICAgICAgQGxhc3QgPSBmLmFwcGx5IEAsIGFyZ3NcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcInVuaGFuZGxlZCB0cmFuc2Zvcm0gI3t0cmFuc05hbWV9XCJcblxuICAgICAgICBAbGFzdFxuXG4gICAgQGRvOiAoZWRpdG9yLCB0cmFuc05hbWUsIGFyZ3MuLi4pIC0+XG5cbiAgICAgICAgdCA9IGVkaXRvci50cmFuc2Zvcm0gPyBuZXcgVHJhbnNmb3JtIGVkaXRvclxuICAgICAgICB0LmRvLmFwcGx5IHQsIFt0cmFuc05hbWVdLmNvbmNhdCBhcmdzXG5cbm1vZHVsZS5leHBvcnRzID1cblxuICAgIGFjdGlvbnM6XG5cbiAgICAgICAgbWVudTogJ01pc2MnXG5cbiAgICAgICAgdG9nZ2xlQ2FzZTpcbiAgICAgICAgICAgIHNlcGFyYXRvcjogdHJ1ZVxuICAgICAgICAgICAgbmFtZTogICdUb2dnbGUgQ2FzZSdcbiAgICAgICAgICAgIHRleHQ6ICAndG9nZ2xlcyBzZWxlY3RlZCB0ZXh0cyBiZXR3ZWVuIGxvd2VyLSB1cHBlci0gYW5kIHRpdGxlLWNhc2UnXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrYWx0K2N0cmwrdSdcbiAgICAgICAgICAgIGFjY2VsOiAnYWx0K2N0cmwrdSdcblxuICAgICAgICByZXZlcnNlU2VsZWN0aW9uOlxuICAgICAgICAgICAgbmFtZTogICdSZXZlcnNlIFNlbGVjdGlvbidcbiAgICAgICAgICAgIHRleHQ6ICAncmV2ZXJzZXMgdGhlIG9yZGVyIG9mIHNlbGVjdGVkIHRleHRzJ1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK2FsdCtjdHJsK3InXG4gICAgICAgICAgICBhY2NlbDogJ2FsdCtjdHJsK3InXG5cbiAgICAgICAgZG9UcmFuc2Zvcm06XG4gICAgICAgICAgICBuYW1lOiAgJ2RvVHJhbnNmb3JtJ1xuXG4gICAgdG9nZ2xlQ2FzZTogICAgICAgIC0+IFRyYW5zZm9ybS5kbyBALCAnY2FzZSdcbiAgICByZXZlcnNlU2VsZWN0aW9uOiAgLT4gVHJhbnNmb3JtLmRvIEAsICdyZXZlcnNlJ1xuICAgIGRvVHJhbnNmb3JtOiAoYXJnKSAtPiBUcmFuc2Zvcm0uZG8gQCwgYXJnXG4gICAgVHJhbnNmb3JtOiAgICAgICAgIFRyYW5zZm9ybVxuICAgIHRyYW5zZm9ybU5hbWVzOiAgICBUcmFuc2Zvcm0udHJhbnNmb3JtTmFtZXNcbiJdfQ==
//# sourceURL=../../../coffee/editor/actions/transform.coffee