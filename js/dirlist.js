// koffee 1.4.0

/*
0000000    000  00000000   000      000   0000000  000000000  
000   000  000  000   000  000      000  000          000     
000   000  000  0000000    000      000  0000000      000     
000   000  000  000   000  000      000       000     000     
0000000    000  000   000  0000000  000  0000000      000
 */
var _, dirList, fs, ref, slash, walkdir;

ref = require('kxk'), fs = ref.fs, walkdir = ref.walkdir, slash = ref.slash, _ = ref._;

dirList = function(dirPath, opt, cb) {
    var dirs, err, fileSort, files, filter, onDir, onFile, walker;
    if (cb != null) {
        cb;
    } else {
        cb = opt.cb;
    }
    if (_.isFunction(opt) && (cb == null)) {
        cb = opt;
    }
    if (opt != null) {
        opt;
    } else {
        opt = {};
    }
    if (opt.ignoreHidden != null) {
        opt.ignoreHidden;
    } else {
        opt.ignoreHidden = true;
    }
    if (opt.logError != null) {
        opt.logError;
    } else {
        opt.logError = true;
    }
    dirs = [];
    files = [];
    dirPath = slash.resolve(dirPath);
    filter = function(p) {
        var base;
        base = slash.file(p);
        if (base.startsWith('.')) {
            if (opt.ignoreHidden) {
                return true;
            }
            if (base === '.DS_Store') {
                return true;
            }
        }
        if (base === 'Icon\r') {
            return true;
        }
        if (base.toLowerCase().startsWith('ntuser.')) {
            return true;
        }
        if (base.toLowerCase().startsWith('$recycle')) {
            return true;
        }
        if (/\d\d\d\d\d\d\d\d\d?\d?/.test(slash.ext(p))) {
            return true;
        }
        return false;
    };
    onDir = function(d) {
        var dir;
        if (!filter(d)) {
            dir = {
                type: 'dir',
                file: slash.path(d),
                name: slash.basename(d)
            };
            return dirs.push(dir);
        }
    };
    onFile = function(f) {
        var file;
        if (!filter(f)) {
            file = {
                type: 'file',
                file: slash.path(f),
                name: slash.basename(f)
            };
            return files.push(file);
        }
    };
    try {
        fileSort = function(a, b) {
            return a.name.localeCompare(b.name);
        };
        walker = walkdir.walk(dirPath, {
            no_recurse: true
        });
        walker.on('directory', onDir);
        walker.on('file', onFile);
        walker.on('end', function() {
            return cb(null, dirs.sort(fileSort).concat(files.sort(fileSort)));
        });
        walker.on('error', function(err) {
            return cb(err);
        });
        return walker;
    } catch (error) {
        err = error;
        return cb(err);
    }
};

module.exports = dirList;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlybGlzdC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBNEIsT0FBQSxDQUFRLEtBQVIsQ0FBNUIsRUFBRSxXQUFGLEVBQU0scUJBQU4sRUFBZSxpQkFBZixFQUFzQjs7QUFldEIsT0FBQSxHQUFVLFNBQUMsT0FBRCxFQUFVLEdBQVYsRUFBZSxFQUFmO0FBRU4sUUFBQTs7UUFBQTs7UUFBQSxLQUFNLEdBQUcsQ0FBQzs7SUFDVixJQUFHLENBQUMsQ0FBQyxVQUFGLENBQWEsR0FBYixDQUFBLElBQTBCLFlBQTdCO1FBQXNDLEVBQUEsR0FBSyxJQUEzQzs7O1FBQ0E7O1FBQUEsTUFBTzs7O1FBRVAsR0FBRyxDQUFDOztRQUFKLEdBQUcsQ0FBQyxlQUFnQjs7O1FBQ3BCLEdBQUcsQ0FBQzs7UUFBSixHQUFHLENBQUMsV0FBZ0I7O0lBQ3BCLElBQUEsR0FBVTtJQUNWLEtBQUEsR0FBVTtJQUNWLE9BQUEsR0FBVSxLQUFLLENBQUMsT0FBTixDQUFjLE9BQWQ7SUFFVixNQUFBLEdBQVMsU0FBQyxDQUFEO0FBRUwsWUFBQTtRQUFBLElBQUEsR0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLENBQVg7UUFDUCxJQUFHLElBQUksQ0FBQyxVQUFMLENBQWdCLEdBQWhCLENBQUg7WUFFSSxJQUFHLEdBQUcsQ0FBQyxZQUFQO0FBQ0ksdUJBQU8sS0FEWDs7WUFHQSxJQUFHLElBQUEsS0FBUyxXQUFaO0FBQ0ksdUJBQU8sS0FEWDthQUxKOztRQVFBLElBQUcsSUFBQSxLQUFRLFFBQVg7QUFDSSxtQkFBTyxLQURYOztRQUdBLElBQUcsSUFBSSxDQUFDLFdBQUwsQ0FBQSxDQUFrQixDQUFDLFVBQW5CLENBQThCLFNBQTlCLENBQUg7QUFDSSxtQkFBTyxLQURYOztRQUdBLElBQUcsSUFBSSxDQUFDLFdBQUwsQ0FBQSxDQUFrQixDQUFDLFVBQW5CLENBQThCLFVBQTlCLENBQUg7QUFDSSxtQkFBTyxLQURYOztRQUdBLElBQUcsd0JBQXdCLENBQUMsSUFBekIsQ0FBOEIsS0FBSyxDQUFDLEdBQU4sQ0FBVSxDQUFWLENBQTlCLENBQUg7QUFDSSxtQkFBTyxLQURYOztlQUdBO0lBdkJLO0lBeUJULEtBQUEsR0FBUSxTQUFDLENBQUQ7QUFDSixZQUFBO1FBQUEsSUFBRyxDQUFJLE1BQUEsQ0FBTyxDQUFQLENBQVA7WUFDSSxHQUFBLEdBQ0k7Z0JBQUEsSUFBQSxFQUFNLEtBQU47Z0JBQ0EsSUFBQSxFQUFNLEtBQUssQ0FBQyxJQUFOLENBQVcsQ0FBWCxDQUROO2dCQUVBLElBQUEsRUFBTSxLQUFLLENBQUMsUUFBTixDQUFlLENBQWYsQ0FGTjs7bUJBR0osSUFBSSxDQUFDLElBQUwsQ0FBVyxHQUFYLEVBTEo7O0lBREk7SUFRUixNQUFBLEdBQVMsU0FBQyxDQUFEO0FBQ0wsWUFBQTtRQUFBLElBQUcsQ0FBSSxNQUFBLENBQU8sQ0FBUCxDQUFQO1lBQ0ksSUFBQSxHQUNJO2dCQUFBLElBQUEsRUFBTSxNQUFOO2dCQUNBLElBQUEsRUFBTSxLQUFLLENBQUMsSUFBTixDQUFXLENBQVgsQ0FETjtnQkFFQSxJQUFBLEVBQU0sS0FBSyxDQUFDLFFBQU4sQ0FBZSxDQUFmLENBRk47O21CQUdKLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxFQUxKOztJQURLO0FBUVQ7UUFDSSxRQUFBLEdBQVcsU0FBQyxDQUFELEVBQUcsQ0FBSDttQkFBUyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQVAsQ0FBcUIsQ0FBQyxDQUFDLElBQXZCO1FBQVQ7UUFDWCxNQUFBLEdBQVMsT0FBTyxDQUFDLElBQVIsQ0FBYSxPQUFiLEVBQXNCO1lBQUEsVUFBQSxFQUFZLElBQVo7U0FBdEI7UUFDVCxNQUFNLENBQUMsRUFBUCxDQUFVLFdBQVYsRUFBdUIsS0FBdkI7UUFDQSxNQUFNLENBQUMsRUFBUCxDQUFVLE1BQVYsRUFBdUIsTUFBdkI7UUFDQSxNQUFNLENBQUMsRUFBUCxDQUFVLEtBQVYsRUFBeUIsU0FBQTttQkFBRyxFQUFBLENBQUcsSUFBSCxFQUFTLElBQUksQ0FBQyxJQUFMLENBQVUsUUFBVixDQUFtQixDQUFDLE1BQXBCLENBQTJCLEtBQUssQ0FBQyxJQUFOLENBQVcsUUFBWCxDQUEzQixDQUFUO1FBQUgsQ0FBekI7UUFDQSxNQUFNLENBQUMsRUFBUCxDQUFVLE9BQVYsRUFBbUIsU0FBQyxHQUFEO21CQUFTLEVBQUEsQ0FBRyxHQUFIO1FBQVQsQ0FBbkI7ZUFDQSxPQVBKO0tBQUEsYUFBQTtRQVFNO2VBQ0YsRUFBQSxDQUFHLEdBQUgsRUFUSjs7QUFyRE07O0FBZ0VWLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbjAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwMDAwMCAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiMjI1xuXG57IGZzLCB3YWxrZGlyLCBzbGFzaCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG4jICAgZGlyZWN0b3J5IGxpc3RcbiNcbiMgICBjYWxscyBiYWNrIHdpdGggYSBsaXN0IG9mIG9iamVjdHMgZm9yIGZpbGVzIGFuZCBkaXJlY3RvcmllcyBpbiBkaXJQYXRoXG4jICAgICAgIFtcbiMgICAgICAgICAgIHR5cGU6IGZpbGV8ZGlyXG4jICAgICAgICAgICBuYW1lOiBiYXNlbmFtZVxuIyAgICAgICAgICAgZmlsZTogYWJzb2x1dGUgcGF0aFxuIyAgICAgICBdXG4jXG4jICAgb3B0OiAgXG4jICAgICAgICAgIGlnbm9yZUhpZGRlbjogdHJ1ZSAjIHNraXAgZmlsZXMgdGhhdCBzdGFydHMgd2l0aCBhIGRvdFxuIyAgICAgICAgICBsb2dFcnJvcjogICAgIHRydWUgIyBwcmludCBtZXNzYWdlIHRvIGNvbnNvbGUubG9nIGlmIGEgcGF0aCBkb2Vzbid0IGV4aXRzXG5cbmRpckxpc3QgPSAoZGlyUGF0aCwgb3B0LCBjYikgLT5cbiAgICBcbiAgICBjYiA/PSBvcHQuY2JcbiAgICBpZiBfLmlzRnVuY3Rpb24ob3B0KSBhbmQgbm90IGNiPyB0aGVuIGNiID0gb3B0XG4gICAgb3B0ID89IHt9XG4gICAgXG4gICAgb3B0Lmlnbm9yZUhpZGRlbiA/PSB0cnVlXG4gICAgb3B0LmxvZ0Vycm9yICAgICA/PSB0cnVlXG4gICAgZGlycyAgICA9IFtdXG4gICAgZmlsZXMgICA9IFtdXG4gICAgZGlyUGF0aCA9IHNsYXNoLnJlc29sdmUgZGlyUGF0aFxuICAgIFxuICAgIGZpbHRlciA9IChwKSAtPlxuICAgICAgICBcbiAgICAgICAgYmFzZSA9IHNsYXNoLmZpbGUgcFxuICAgICAgICBpZiBiYXNlLnN0YXJ0c1dpdGggJy4nXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG9wdC5pZ25vcmVIaWRkZW5cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgYmFzZSBpbiBbJy5EU19TdG9yZSddXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgYmFzZSA9PSAnSWNvblxccidcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgYmFzZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGggJ250dXNlci4nXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGJhc2UudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoICckcmVjeWNsZSdcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIFxuICAgICAgICBpZiAvXFxkXFxkXFxkXFxkXFxkXFxkXFxkXFxkXFxkP1xcZD8vLnRlc3Qgc2xhc2guZXh0IHAgXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgXG4gICAgICAgIGZhbHNlXG4gICAgXG4gICAgb25EaXIgPSAoZCkgLT4gXG4gICAgICAgIGlmIG5vdCBmaWx0ZXIoZCkgXG4gICAgICAgICAgICBkaXIgPSBcbiAgICAgICAgICAgICAgICB0eXBlOiAnZGlyJ1xuICAgICAgICAgICAgICAgIGZpbGU6IHNsYXNoLnBhdGggZFxuICAgICAgICAgICAgICAgIG5hbWU6IHNsYXNoLmJhc2VuYW1lIGRcbiAgICAgICAgICAgIGRpcnMucHVzaCAgZGlyXG4gICAgICAgICAgICBcbiAgICBvbkZpbGUgPSAoZikgLT4gXG4gICAgICAgIGlmIG5vdCBmaWx0ZXIoZikgXG4gICAgICAgICAgICBmaWxlID0gXG4gICAgICAgICAgICAgICAgdHlwZTogJ2ZpbGUnXG4gICAgICAgICAgICAgICAgZmlsZTogc2xhc2gucGF0aCBmXG4gICAgICAgICAgICAgICAgbmFtZTogc2xhc2guYmFzZW5hbWUgZlxuICAgICAgICAgICAgZmlsZXMucHVzaCBmaWxlXG5cbiAgICB0cnlcbiAgICAgICAgZmlsZVNvcnQgPSAoYSxiKSAtPiBhLm5hbWUubG9jYWxlQ29tcGFyZSBiLm5hbWVcbiAgICAgICAgd2Fsa2VyID0gd2Fsa2Rpci53YWxrIGRpclBhdGgsIG5vX3JlY3Vyc2U6IHRydWVcbiAgICAgICAgd2Fsa2VyLm9uICdkaXJlY3RvcnknLCBvbkRpclxuICAgICAgICB3YWxrZXIub24gJ2ZpbGUnLCAgICAgIG9uRmlsZVxuICAgICAgICB3YWxrZXIub24gJ2VuZCcsICAgICAgICAgLT4gY2IgbnVsbCwgZGlycy5zb3J0KGZpbGVTb3J0KS5jb25jYXQgZmlsZXMuc29ydChmaWxlU29ydClcbiAgICAgICAgd2Fsa2VyLm9uICdlcnJvcicsIChlcnIpIC0+IGNiIGVyclxuICAgICAgICB3YWxrZXJcbiAgICBjYXRjaCBlcnJcbiAgICAgICAgY2IgZXJyXG5cbm1vZHVsZS5leHBvcnRzID0gZGlyTGlzdFxuIl19
//# sourceURL=../coffee/dirlist.coffee