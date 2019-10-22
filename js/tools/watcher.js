// koffee 1.4.0

/*
000   000   0000000   000000000   0000000  000   000  00000000  00000000 
000 0 000  000   000     000     000       000   000  000       000   000
000000000  000000000     000     000       000000000  0000000   0000000  
000   000  000   000     000     000       000   000  000       000   000
00     00  000   000     000      0000000  000   000  00000000  000   000
 */
var Watcher, fs, klog, post, ref, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), slash = ref.slash, post = ref.post, klog = ref.klog, fs = ref.fs;

Watcher = (function() {
    Watcher.id = 0;

    function Watcher(file) {
        this.file = file;
        this.onRename = bind(this.onRename, this);
        this.onChange = bind(this.onChange, this);
        this.onExists = bind(this.onExists, this);
        this.id = Watcher.id++;
        slash.exists(this.file, this.onExists);
    }

    Watcher.prototype.onExists = function(stat) {
        if (!stat) {
            return;
        }
        if (!this.id) {
            return;
        }
        this.mtime = stat.mtimeMs;
        this.w = fs.watch(this.file);
        this.w.on('change', (function(_this) {
            return function(changeType, p) {
                if (changeType === 'change') {
                    return slash.exists(_this.file, _this.onChange);
                } else {
                    return slash.exists(_this.file, _this.onRename);
                }
            };
        })(this));
        return this.w.on('unlink', (function(_this) {
            return function(p) {};
        })(this));
    };

    Watcher.prototype.onChange = function(stat) {
        if (stat.mtimeMs !== this.mtime) {
            this.mtime = stat.mtimeMs;
            return post.emit('reloadFile', this.file);
        }
    };

    Watcher.prototype.onRename = function(stat) {
        if (!stat) {
            this.stop();
            return post.emit('removeFile', this.file);
        }
    };

    Watcher.prototype.stop = function() {
        var ref1;
        if ((ref1 = this.w) != null) {
            ref1.close();
        }
        delete this.w;
        return this.id = 0;
    };

    return Watcher;

})();

module.exports = Watcher;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsbUNBQUE7SUFBQTs7QUFRQSxNQUE0QixPQUFBLENBQVEsS0FBUixDQUE1QixFQUFFLGlCQUFGLEVBQVMsZUFBVCxFQUFlLGVBQWYsRUFBcUI7O0FBRWY7SUFFRixPQUFDLENBQUEsRUFBRCxHQUFLOztJQUVGLGlCQUFDLElBQUQ7UUFBQyxJQUFDLENBQUEsT0FBRDs7OztRQUVBLElBQUMsQ0FBQSxFQUFELEdBQU0sT0FBTyxDQUFDLEVBQVI7UUFDTixLQUFLLENBQUMsTUFBTixDQUFhLElBQUMsQ0FBQSxJQUFkLEVBQW9CLElBQUMsQ0FBQSxRQUFyQjtJQUhEOztzQkFLSCxRQUFBLEdBQVUsU0FBQyxJQUFEO1FBRU4sSUFBVSxDQUFJLElBQWQ7QUFBQSxtQkFBQTs7UUFDQSxJQUFVLENBQUksSUFBQyxDQUFBLEVBQWY7QUFBQSxtQkFBQTs7UUFDQSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUksQ0FBQztRQUVkLElBQUMsQ0FBQSxDQUFELEdBQUssRUFBRSxDQUFDLEtBQUgsQ0FBUyxJQUFDLENBQUEsSUFBVjtRQUNMLElBQUMsQ0FBQSxDQUFDLENBQUMsRUFBSCxDQUFNLFFBQU4sRUFBZ0IsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQyxVQUFELEVBQWEsQ0FBYjtnQkFFWixJQUFHLFVBQUEsS0FBYyxRQUFqQjsyQkFDSSxLQUFLLENBQUMsTUFBTixDQUFhLEtBQUMsQ0FBQSxJQUFkLEVBQW9CLEtBQUMsQ0FBQSxRQUFyQixFQURKO2lCQUFBLE1BQUE7MkJBR0ksS0FBSyxDQUFDLE1BQU4sQ0FBYSxLQUFDLENBQUEsSUFBZCxFQUFvQixLQUFDLENBQUEsUUFBckIsRUFISjs7WUFGWTtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBaEI7ZUFPQSxJQUFDLENBQUEsQ0FBQyxDQUFDLEVBQUgsQ0FBTSxRQUFOLEVBQWdCLENBQUEsU0FBQSxLQUFBO21CQUFBLFNBQUMsQ0FBRCxHQUFBO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFoQjtJQWRNOztzQkFnQlYsUUFBQSxHQUFVLFNBQUMsSUFBRDtRQUVOLElBQUcsSUFBSSxDQUFDLE9BQUwsS0FBZ0IsSUFBQyxDQUFBLEtBQXBCO1lBQ0ksSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFJLENBQUM7bUJBQ2QsSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWLEVBQXdCLElBQUMsQ0FBQSxJQUF6QixFQUZKOztJQUZNOztzQkFNVixRQUFBLEdBQVUsU0FBQyxJQUFEO1FBRU4sSUFBRyxDQUFJLElBQVA7WUFDSSxJQUFDLENBQUEsSUFBRCxDQUFBO21CQUNBLElBQUksQ0FBQyxJQUFMLENBQVUsWUFBVixFQUF3QixJQUFDLENBQUEsSUFBekIsRUFGSjs7SUFGTTs7c0JBTVYsSUFBQSxHQUFNLFNBQUE7QUFFRixZQUFBOztnQkFBRSxDQUFFLEtBQUosQ0FBQTs7UUFDQSxPQUFPLElBQUMsQ0FBQTtlQUNSLElBQUMsQ0FBQSxFQUFELEdBQU07SUFKSjs7Ozs7O0FBTVYsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCBcbjAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwICAgICAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHNsYXNoLCBwb3N0LCBrbG9nLCBmcyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBXYXRjaGVyXG5cbiAgICBAaWQ6IDBcbiAgICBcbiAgICBAOiAoQGZpbGUpIC0+XG5cbiAgICAgICAgQGlkID0gV2F0Y2hlci5pZCsrXG4gICAgICAgIHNsYXNoLmV4aXN0cyBAZmlsZSwgQG9uRXhpc3RzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIG9uRXhpc3RzOiAoc3RhdCkgPT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3Qgc3RhdFxuICAgICAgICByZXR1cm4gaWYgbm90IEBpZFxuICAgICAgICBAbXRpbWUgPSBzdGF0Lm10aW1lTXNcbiAgICAgICAgXG4gICAgICAgIEB3ID0gZnMud2F0Y2ggQGZpbGVcbiAgICAgICAgQHcub24gJ2NoYW5nZScsIChjaGFuZ2VUeXBlLCBwKSA9PlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBjaGFuZ2VUeXBlID09ICdjaGFuZ2UnXG4gICAgICAgICAgICAgICAgc2xhc2guZXhpc3RzIEBmaWxlLCBAb25DaGFuZ2VcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBzbGFzaC5leGlzdHMgQGZpbGUsIEBvblJlbmFtZVxuICAgICAgICAgICAgXG4gICAgICAgIEB3Lm9uICd1bmxpbmsnLCAocCkgPT4gI2tsb2cgXCJ1bmxpbmsgI3tAaWR9XCIsIHNsYXNoLmJhc2VuYW1lKEBmaWxlKVxuICAgICAgICBcbiAgICBvbkNoYW5nZTogKHN0YXQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBzdGF0Lm10aW1lTXMgIT0gQG10aW1lXG4gICAgICAgICAgICBAbXRpbWUgPSBzdGF0Lm10aW1lTXNcbiAgICAgICAgICAgIHBvc3QuZW1pdCAncmVsb2FkRmlsZScsIEBmaWxlXG5cbiAgICBvblJlbmFtZTogKHN0YXQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgc3RhdFxuICAgICAgICAgICAgQHN0b3AoKVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdyZW1vdmVGaWxlJywgQGZpbGVcbiAgICAgICAgICAgIFxuICAgIHN0b3A6IC0+XG4gICAgICAgIFxuICAgICAgICBAdz8uY2xvc2UoKVxuICAgICAgICBkZWxldGUgQHdcbiAgICAgICAgQGlkID0gMFxuXG5tb2R1bGUuZXhwb3J0cyA9IFdhdGNoZXJcbiJdfQ==
//# sourceURL=../../coffee/tools/watcher.coffee