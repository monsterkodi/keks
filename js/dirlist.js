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
            if (slash.isText(f)) {
                file.textFile = true;
            }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlybGlzdC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBNEIsT0FBQSxDQUFRLEtBQVIsQ0FBNUIsRUFBRSxXQUFGLEVBQU0scUJBQU4sRUFBZSxpQkFBZixFQUFzQjs7QUFldEIsT0FBQSxHQUFVLFNBQUMsT0FBRCxFQUFVLEdBQVYsRUFBZSxFQUFmO0FBRU4sUUFBQTs7UUFBQTs7UUFBQSxLQUFNLEdBQUcsQ0FBQzs7SUFDVixJQUFHLENBQUMsQ0FBQyxVQUFGLENBQWEsR0FBYixDQUFBLElBQTBCLFlBQTdCO1FBQXNDLEVBQUEsR0FBSyxJQUEzQzs7O1FBQ0E7O1FBQUEsTUFBTzs7O1FBRVAsR0FBRyxDQUFDOztRQUFKLEdBQUcsQ0FBQyxlQUFnQjs7O1FBQ3BCLEdBQUcsQ0FBQzs7UUFBSixHQUFHLENBQUMsV0FBZ0I7O0lBQ3BCLElBQUEsR0FBVTtJQUNWLEtBQUEsR0FBVTtJQUNWLE9BQUEsR0FBVSxLQUFLLENBQUMsT0FBTixDQUFjLE9BQWQ7SUFFVixNQUFBLEdBQVMsU0FBQyxDQUFEO0FBRUwsWUFBQTtRQUFBLElBQUEsR0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLENBQVg7UUFDUCxJQUFHLElBQUksQ0FBQyxVQUFMLENBQWdCLEdBQWhCLENBQUg7WUFFSSxJQUFHLEdBQUcsQ0FBQyxZQUFQO0FBQ0ksdUJBQU8sS0FEWDs7WUFHQSxJQUFHLElBQUEsS0FBUyxXQUFaO0FBQ0ksdUJBQU8sS0FEWDthQUxKOztRQVFBLElBQUcsSUFBQSxLQUFRLFFBQVg7QUFDSSxtQkFBTyxLQURYOztRQUdBLElBQUcsSUFBSSxDQUFDLFdBQUwsQ0FBQSxDQUFrQixDQUFDLFVBQW5CLENBQThCLFNBQTlCLENBQUg7QUFDSSxtQkFBTyxLQURYOztRQUdBLElBQUcsSUFBSSxDQUFDLFdBQUwsQ0FBQSxDQUFrQixDQUFDLFVBQW5CLENBQThCLFVBQTlCLENBQUg7QUFDSSxtQkFBTyxLQURYOztRQUdBLElBQUcsd0JBQXdCLENBQUMsSUFBekIsQ0FBOEIsS0FBSyxDQUFDLEdBQU4sQ0FBVSxDQUFWLENBQTlCLENBQUg7QUFDSSxtQkFBTyxLQURYOztlQUdBO0lBdkJLO0lBeUJULEtBQUEsR0FBUSxTQUFDLENBQUQ7QUFDSixZQUFBO1FBQUEsSUFBRyxDQUFJLE1BQUEsQ0FBTyxDQUFQLENBQVA7WUFDSSxHQUFBLEdBQ0k7Z0JBQUEsSUFBQSxFQUFNLEtBQU47Z0JBQ0EsSUFBQSxFQUFNLEtBQUssQ0FBQyxJQUFOLENBQVcsQ0FBWCxDQUROO2dCQUVBLElBQUEsRUFBTSxLQUFLLENBQUMsUUFBTixDQUFlLENBQWYsQ0FGTjs7bUJBR0osSUFBSSxDQUFDLElBQUwsQ0FBVyxHQUFYLEVBTEo7O0lBREk7SUFRUixNQUFBLEdBQVMsU0FBQyxDQUFEO0FBQ0wsWUFBQTtRQUFBLElBQUcsQ0FBSSxNQUFBLENBQU8sQ0FBUCxDQUFQO1lBQ0ksSUFBQSxHQUNJO2dCQUFBLElBQUEsRUFBTSxNQUFOO2dCQUNBLElBQUEsRUFBTSxLQUFLLENBQUMsSUFBTixDQUFXLENBQVgsQ0FETjtnQkFFQSxJQUFBLEVBQU0sS0FBSyxDQUFDLFFBQU4sQ0FBZSxDQUFmLENBRk47O1lBR0osSUFBd0IsS0FBSyxDQUFDLE1BQU4sQ0FBYSxDQUFiLENBQXhCO2dCQUFBLElBQUksQ0FBQyxRQUFMLEdBQWdCLEtBQWhCOzttQkFDQSxLQUFLLENBQUMsSUFBTixDQUFXLElBQVgsRUFOSjs7SUFESztBQVNUO1FBQ0ksUUFBQSxHQUFXLFNBQUMsQ0FBRCxFQUFHLENBQUg7bUJBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFQLENBQXFCLENBQUMsQ0FBQyxJQUF2QjtRQUFUO1FBQ1gsTUFBQSxHQUFTLE9BQU8sQ0FBQyxJQUFSLENBQWEsT0FBYixFQUFzQjtZQUFBLFVBQUEsRUFBWSxJQUFaO1NBQXRCO1FBQ1QsTUFBTSxDQUFDLEVBQVAsQ0FBVSxXQUFWLEVBQXVCLEtBQXZCO1FBQ0EsTUFBTSxDQUFDLEVBQVAsQ0FBVSxNQUFWLEVBQXVCLE1BQXZCO1FBQ0EsTUFBTSxDQUFDLEVBQVAsQ0FBVSxLQUFWLEVBQXlCLFNBQUE7bUJBQUcsRUFBQSxDQUFHLElBQUgsRUFBUyxJQUFJLENBQUMsSUFBTCxDQUFVLFFBQVYsQ0FBbUIsQ0FBQyxNQUFwQixDQUEyQixLQUFLLENBQUMsSUFBTixDQUFXLFFBQVgsQ0FBM0IsQ0FBVDtRQUFILENBQXpCO1FBQ0EsTUFBTSxDQUFDLEVBQVAsQ0FBVSxPQUFWLEVBQW1CLFNBQUMsR0FBRDttQkFBUyxFQUFBLENBQUcsR0FBSDtRQUFULENBQW5CO2VBQ0EsT0FQSjtLQUFBLGFBQUE7UUFRTTtlQUNGLEVBQUEsQ0FBRyxHQUFILEVBVEo7O0FBdERNOztBQWlFVixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgXG4wMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4jIyNcblxueyBmcywgd2Fsa2Rpciwgc2xhc2gsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuIyAgIGRpcmVjdG9yeSBsaXN0XG4jXG4jICAgY2FsbHMgYmFjayB3aXRoIGEgbGlzdCBvZiBvYmplY3RzIGZvciBmaWxlcyBhbmQgZGlyZWN0b3JpZXMgaW4gZGlyUGF0aFxuIyAgICAgICBbXG4jICAgICAgICAgICB0eXBlOiBmaWxlfGRpclxuIyAgICAgICAgICAgbmFtZTogYmFzZW5hbWVcbiMgICAgICAgICAgIGZpbGU6IGFic29sdXRlIHBhdGhcbiMgICAgICAgXVxuI1xuIyAgIG9wdDogIFxuIyAgICAgICAgICBpZ25vcmVIaWRkZW46IHRydWUgIyBza2lwIGZpbGVzIHRoYXQgc3RhcnRzIHdpdGggYSBkb3RcbiMgICAgICAgICAgbG9nRXJyb3I6ICAgICB0cnVlICMgcHJpbnQgbWVzc2FnZSB0byBjb25zb2xlLmxvZyBpZiBhIHBhdGggZG9lc24ndCBleGl0c1xuXG5kaXJMaXN0ID0gKGRpclBhdGgsIG9wdCwgY2IpIC0+XG4gICAgXG4gICAgY2IgPz0gb3B0LmNiXG4gICAgaWYgXy5pc0Z1bmN0aW9uKG9wdCkgYW5kIG5vdCBjYj8gdGhlbiBjYiA9IG9wdFxuICAgIG9wdCA/PSB7fVxuICAgIFxuICAgIG9wdC5pZ25vcmVIaWRkZW4gPz0gdHJ1ZVxuICAgIG9wdC5sb2dFcnJvciAgICAgPz0gdHJ1ZVxuICAgIGRpcnMgICAgPSBbXVxuICAgIGZpbGVzICAgPSBbXVxuICAgIGRpclBhdGggPSBzbGFzaC5yZXNvbHZlIGRpclBhdGhcbiAgICBcbiAgICBmaWx0ZXIgPSAocCkgLT5cbiAgICAgICAgXG4gICAgICAgIGJhc2UgPSBzbGFzaC5maWxlIHBcbiAgICAgICAgaWYgYmFzZS5zdGFydHNXaXRoICcuJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBvcHQuaWdub3JlSGlkZGVuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGJhc2UgaW4gWycuRFNfU3RvcmUnXVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGJhc2UgPT0gJ0ljb25cXHInXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGJhc2UudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoICdudHVzZXIuJ1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBiYXNlLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCAnJHJlY3ljbGUnXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBcbiAgICAgICAgaWYgL1xcZFxcZFxcZFxcZFxcZFxcZFxcZFxcZFxcZD9cXGQ/Ly50ZXN0IHNsYXNoLmV4dCBwIFxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIFxuICAgICAgICBmYWxzZVxuICAgIFxuICAgIG9uRGlyID0gKGQpIC0+IFxuICAgICAgICBpZiBub3QgZmlsdGVyKGQpIFxuICAgICAgICAgICAgZGlyID0gXG4gICAgICAgICAgICAgICAgdHlwZTogJ2RpcidcbiAgICAgICAgICAgICAgICBmaWxlOiBzbGFzaC5wYXRoIGRcbiAgICAgICAgICAgICAgICBuYW1lOiBzbGFzaC5iYXNlbmFtZSBkXG4gICAgICAgICAgICBkaXJzLnB1c2ggIGRpclxuICAgICAgICAgICAgXG4gICAgb25GaWxlID0gKGYpIC0+IFxuICAgICAgICBpZiBub3QgZmlsdGVyKGYpIFxuICAgICAgICAgICAgZmlsZSA9IFxuICAgICAgICAgICAgICAgIHR5cGU6ICdmaWxlJ1xuICAgICAgICAgICAgICAgIGZpbGU6IHNsYXNoLnBhdGggZlxuICAgICAgICAgICAgICAgIG5hbWU6IHNsYXNoLmJhc2VuYW1lIGZcbiAgICAgICAgICAgIGZpbGUudGV4dEZpbGUgPSB0cnVlIGlmIHNsYXNoLmlzVGV4dCBmXG4gICAgICAgICAgICBmaWxlcy5wdXNoIGZpbGVcblxuICAgIHRyeVxuICAgICAgICBmaWxlU29ydCA9IChhLGIpIC0+IGEubmFtZS5sb2NhbGVDb21wYXJlIGIubmFtZVxuICAgICAgICB3YWxrZXIgPSB3YWxrZGlyLndhbGsgZGlyUGF0aCwgbm9fcmVjdXJzZTogdHJ1ZVxuICAgICAgICB3YWxrZXIub24gJ2RpcmVjdG9yeScsIG9uRGlyXG4gICAgICAgIHdhbGtlci5vbiAnZmlsZScsICAgICAgb25GaWxlXG4gICAgICAgIHdhbGtlci5vbiAnZW5kJywgICAgICAgICAtPiBjYiBudWxsLCBkaXJzLnNvcnQoZmlsZVNvcnQpLmNvbmNhdCBmaWxlcy5zb3J0KGZpbGVTb3J0KVxuICAgICAgICB3YWxrZXIub24gJ2Vycm9yJywgKGVycikgLT4gY2IgZXJyXG4gICAgICAgIHdhbGtlclxuICAgIGNhdGNoIGVyclxuICAgICAgICBjYiBlcnJcblxubW9kdWxlLmV4cG9ydHMgPSBkaXJMaXN0XG4iXX0=
//# sourceURL=../coffee/dirlist.coffee