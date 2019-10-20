// koffee 1.4.0

/*
0000000    000  00000000   000      000   0000000  000000000  
000   000  000  000   000  000      000  000          000     
000   000  000  0000000    000      000  0000000      000     
000   000  000  000   000  000      000       000     000     
0000000    000  000   000  0000000  000  0000000      000
 */
var _, dirList, fs, kerror, ref, slash, walkdir;

ref = require('kxk'), fs = ref.fs, walkdir = ref.walkdir, slash = ref.slash, kerror = ref.kerror, _ = ref._;

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
        return false;
    };
    onDir = function(d, stat) {
        var dir;
        if (!filter(d)) {
            dir = {
                type: 'dir',
                file: slash.path(d),
                name: slash.basename(d),
                stat: stat
            };
            return dirs.push(dir);
        }
    };
    onFile = function(f, stat) {
        var file;
        if (!filter(f)) {
            file = {
                type: 'file',
                file: slash.path(f),
                name: slash.basename(f),
                stat: stat
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
            return cb(dirs.sort(fileSort).concat(files.sort(fileSort)));
        });
        walker.on('error', function(err) {
            return kerror(err);
        });
        return walker;
    } catch (error) {
        err = error;
        return kerror(err);
    }
};

module.exports = dirList;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlybGlzdC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBb0MsT0FBQSxDQUFRLEtBQVIsQ0FBcEMsRUFBRSxXQUFGLEVBQU0scUJBQU4sRUFBZSxpQkFBZixFQUFzQixtQkFBdEIsRUFBOEI7O0FBZTlCLE9BQUEsR0FBVSxTQUFDLE9BQUQsRUFBVSxHQUFWLEVBQWUsRUFBZjtBQUVOLFFBQUE7O1FBQUE7O1FBQUEsS0FBTSxHQUFHLENBQUM7O0lBQ1YsSUFBRyxDQUFDLENBQUMsVUFBRixDQUFhLEdBQWIsQ0FBQSxJQUEwQixZQUE3QjtRQUFzQyxFQUFBLEdBQUssSUFBM0M7OztRQUNBOztRQUFBLE1BQU87OztRQUVQLEdBQUcsQ0FBQzs7UUFBSixHQUFHLENBQUMsZUFBZ0I7OztRQUNwQixHQUFHLENBQUM7O1FBQUosR0FBRyxDQUFDLFdBQWdCOztJQUNwQixJQUFBLEdBQVU7SUFDVixLQUFBLEdBQVU7SUFDVixPQUFBLEdBQVUsS0FBSyxDQUFDLE9BQU4sQ0FBYyxPQUFkO0lBRVYsTUFBQSxHQUFTLFNBQUMsQ0FBRDtBQUVMLFlBQUE7UUFBQSxJQUFBLEdBQU8sS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFYO1FBQ1AsSUFBRyxJQUFJLENBQUMsVUFBTCxDQUFnQixHQUFoQixDQUFIO1lBRUksSUFBRyxHQUFHLENBQUMsWUFBUDtBQUNJLHVCQUFPLEtBRFg7O1lBR0EsSUFBRyxJQUFBLEtBQVMsV0FBWjtBQUNJLHVCQUFPLEtBRFg7YUFMSjs7UUFRQSxJQUFHLElBQUEsS0FBUSxRQUFYO0FBQ0ksbUJBQU8sS0FEWDs7UUFHQSxJQUFHLElBQUksQ0FBQyxXQUFMLENBQUEsQ0FBa0IsQ0FBQyxVQUFuQixDQUE4QixTQUE5QixDQUFIO0FBQ0ksbUJBQU8sS0FEWDs7UUFHQSxJQUFHLElBQUksQ0FBQyxXQUFMLENBQUEsQ0FBa0IsQ0FBQyxVQUFuQixDQUE4QixVQUE5QixDQUFIO0FBQ0ksbUJBQU8sS0FEWDs7ZUFNQTtJQXZCSztJQXlCVCxLQUFBLEdBQVEsU0FBQyxDQUFELEVBQUksSUFBSjtBQUNKLFlBQUE7UUFBQSxJQUFHLENBQUksTUFBQSxDQUFPLENBQVAsQ0FBUDtZQUNJLEdBQUEsR0FDSTtnQkFBQSxJQUFBLEVBQU0sS0FBTjtnQkFDQSxJQUFBLEVBQU0sS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFYLENBRE47Z0JBRUEsSUFBQSxFQUFNLEtBQUssQ0FBQyxRQUFOLENBQWUsQ0FBZixDQUZOO2dCQUdBLElBQUEsRUFBTSxJQUhOOzttQkFJSixJQUFJLENBQUMsSUFBTCxDQUFXLEdBQVgsRUFOSjs7SUFESTtJQVNSLE1BQUEsR0FBUyxTQUFDLENBQUQsRUFBSSxJQUFKO0FBQ0wsWUFBQTtRQUFBLElBQUcsQ0FBSSxNQUFBLENBQU8sQ0FBUCxDQUFQO1lBQ0ksSUFBQSxHQUNJO2dCQUFBLElBQUEsRUFBTSxNQUFOO2dCQUNBLElBQUEsRUFBTSxLQUFLLENBQUMsSUFBTixDQUFXLENBQVgsQ0FETjtnQkFFQSxJQUFBLEVBQU0sS0FBSyxDQUFDLFFBQU4sQ0FBZSxDQUFmLENBRk47Z0JBR0EsSUFBQSxFQUFNLElBSE47O21CQUlKLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxFQU5KOztJQURLO0FBU1Q7UUFDSSxRQUFBLEdBQVcsU0FBQyxDQUFELEVBQUcsQ0FBSDttQkFBUyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQVAsQ0FBcUIsQ0FBQyxDQUFDLElBQXZCO1FBQVQ7UUFDWCxNQUFBLEdBQVMsT0FBTyxDQUFDLElBQVIsQ0FBYSxPQUFiLEVBQXNCO1lBQUEsVUFBQSxFQUFZLElBQVo7U0FBdEI7UUFDVCxNQUFNLENBQUMsRUFBUCxDQUFVLFdBQVYsRUFBc0IsS0FBdEI7UUFDQSxNQUFNLENBQUMsRUFBUCxDQUFVLE1BQVYsRUFBc0IsTUFBdEI7UUFDQSxNQUFNLENBQUMsRUFBUCxDQUFVLEtBQVYsRUFBd0IsU0FBQTttQkFBRyxFQUFBLENBQUcsSUFBSSxDQUFDLElBQUwsQ0FBVSxRQUFWLENBQW1CLENBQUMsTUFBcEIsQ0FBMkIsS0FBSyxDQUFDLElBQU4sQ0FBVyxRQUFYLENBQTNCLENBQUg7UUFBSCxDQUF4QjtRQUNBLE1BQU0sQ0FBQyxFQUFQLENBQVUsT0FBVixFQUFrQixTQUFDLEdBQUQ7bUJBQVMsTUFBQSxDQUFPLEdBQVA7UUFBVCxDQUFsQjtlQUNBLE9BUEo7S0FBQSxhQUFBO1FBUU07ZUFDRixNQUFBLENBQU8sR0FBUCxFQVRKOztBQXZETTs7QUFrRVYsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgXG4wMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuIyMjXG5cbnsgZnMsIHdhbGtkaXIsIHNsYXNoLCBrZXJyb3IsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuIyAgIGRpcmVjdG9yeSBsaXN0XG4jXG4jICAgY2FsbHMgYmFjayB3aXRoIGEgbGlzdCBvZiBvYmplY3RzIGZvciBmaWxlcyBhbmQgZGlyZWN0b3JpZXMgaW4gZGlyUGF0aFxuIyAgICAgICBbXG4jICAgICAgICAgICB0eXBlOiBmaWxlfGRpclxuIyAgICAgICAgICAgbmFtZTogYmFzZW5hbWVcbiMgICAgICAgICAgIGZpbGU6IGFic29sdXRlIHBhdGhcbiMgICAgICAgXVxuI1xuIyAgIG9wdDogIFxuIyAgICAgICAgICBpZ25vcmVIaWRkZW46IHRydWUgIyBza2lwIGZpbGVzIHRoYXQgc3RhcnRzIHdpdGggYSBkb3RcbiMgICAgICAgICAgbG9nRXJyb3I6ICAgICB0cnVlICMgcHJpbnQgbWVzc2FnZSB0byBjb25zb2xlLmxvZyBpZiBhIHBhdGggZG9lc24ndCBleGl0c1xuXG5kaXJMaXN0ID0gKGRpclBhdGgsIG9wdCwgY2IpIC0+XG4gICAgXG4gICAgY2IgPz0gb3B0LmNiXG4gICAgaWYgXy5pc0Z1bmN0aW9uKG9wdCkgYW5kIG5vdCBjYj8gdGhlbiBjYiA9IG9wdFxuICAgIG9wdCA/PSB7fVxuICAgIFxuICAgIG9wdC5pZ25vcmVIaWRkZW4gPz0gdHJ1ZVxuICAgIG9wdC5sb2dFcnJvciAgICAgPz0gdHJ1ZVxuICAgIGRpcnMgICAgPSBbXVxuICAgIGZpbGVzICAgPSBbXVxuICAgIGRpclBhdGggPSBzbGFzaC5yZXNvbHZlIGRpclBhdGhcbiAgICBcbiAgICBmaWx0ZXIgPSAocCkgLT5cbiAgICAgICAgXG4gICAgICAgIGJhc2UgPSBzbGFzaC5maWxlIHBcbiAgICAgICAgaWYgYmFzZS5zdGFydHNXaXRoICcuJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBvcHQuaWdub3JlSGlkZGVuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGJhc2UgaW4gWycuRFNfU3RvcmUnXVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGJhc2UgPT0gJ0ljb25cXHInXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGJhc2UudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoICdudHVzZXIuJ1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBiYXNlLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCAnJHJlY3ljbGUnXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBcbiAgICAgICAgIyBpZiAvXFxkXFxkXFxkXFxkXFxkXFxkXFxkXFxkXFxkP1xcZD8vLnRlc3Qgc2xhc2guZXh0IHAgXG4gICAgICAgICAgICAjIHJldHVybiB0cnVlXG4gICAgICAgICAgICBcbiAgICAgICAgZmFsc2VcbiAgICBcbiAgICBvbkRpciA9IChkLCBzdGF0KSAtPiBcbiAgICAgICAgaWYgbm90IGZpbHRlcihkKSBcbiAgICAgICAgICAgIGRpciA9IFxuICAgICAgICAgICAgICAgIHR5cGU6ICdkaXInXG4gICAgICAgICAgICAgICAgZmlsZTogc2xhc2gucGF0aCBkXG4gICAgICAgICAgICAgICAgbmFtZTogc2xhc2guYmFzZW5hbWUgZFxuICAgICAgICAgICAgICAgIHN0YXQ6IHN0YXRcbiAgICAgICAgICAgIGRpcnMucHVzaCAgZGlyXG4gICAgICAgICAgICBcbiAgICBvbkZpbGUgPSAoZiwgc3RhdCkgLT4gXG4gICAgICAgIGlmIG5vdCBmaWx0ZXIoZikgXG4gICAgICAgICAgICBmaWxlID0gXG4gICAgICAgICAgICAgICAgdHlwZTogJ2ZpbGUnXG4gICAgICAgICAgICAgICAgZmlsZTogc2xhc2gucGF0aCBmXG4gICAgICAgICAgICAgICAgbmFtZTogc2xhc2guYmFzZW5hbWUgZlxuICAgICAgICAgICAgICAgIHN0YXQ6IHN0YXRcbiAgICAgICAgICAgIGZpbGVzLnB1c2ggZmlsZVxuXG4gICAgdHJ5XG4gICAgICAgIGZpbGVTb3J0ID0gKGEsYikgLT4gYS5uYW1lLmxvY2FsZUNvbXBhcmUgYi5uYW1lXG4gICAgICAgIHdhbGtlciA9IHdhbGtkaXIud2FsayBkaXJQYXRoLCBub19yZWN1cnNlOiB0cnVlXG4gICAgICAgIHdhbGtlci5vbiAnZGlyZWN0b3J5JyBvbkRpclxuICAgICAgICB3YWxrZXIub24gJ2ZpbGUnICAgICAgb25GaWxlXG4gICAgICAgIHdhbGtlci5vbiAnZW5kJyAgICAgICAgIC0+IGNiIGRpcnMuc29ydChmaWxlU29ydCkuY29uY2F0IGZpbGVzLnNvcnQoZmlsZVNvcnQpXG4gICAgICAgIHdhbGtlci5vbiAnZXJyb3InIChlcnIpIC0+IGtlcnJvciBlcnJcbiAgICAgICAgd2Fsa2VyXG4gICAgY2F0Y2ggZXJyXG4gICAgICAgIGtlcnJvciBlcnJcblxubW9kdWxlLmV4cG9ydHMgPSBkaXJMaXN0XG4iXX0=
//# sourceURL=../../coffee/tools/dirlist.coffee