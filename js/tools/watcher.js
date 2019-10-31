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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsbUNBQUE7SUFBQTs7QUFRQSxNQUE0QixPQUFBLENBQVEsS0FBUixDQUE1QixFQUFFLGlCQUFGLEVBQVMsZUFBVCxFQUFlLGVBQWYsRUFBcUI7O0FBRWY7SUFFRixPQUFDLENBQUEsRUFBRCxHQUFLOztJQUVGLGlCQUFDLElBQUQ7UUFBQyxJQUFDLENBQUEsT0FBRDs7OztRQUVBLElBQUMsQ0FBQSxFQUFELEdBQU0sT0FBTyxDQUFDLEVBQVI7UUFDTixLQUFLLENBQUMsTUFBTixDQUFhLElBQUMsQ0FBQSxJQUFkLEVBQW9CLElBQUMsQ0FBQSxRQUFyQjtJQUhEOztzQkFLSCxRQUFBLEdBQVUsU0FBQyxJQUFEO1FBRU4sSUFBVSxDQUFJLElBQWQ7QUFBQSxtQkFBQTs7UUFDQSxJQUFVLENBQUksSUFBQyxDQUFBLEVBQWY7QUFBQSxtQkFBQTs7UUFDQSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUksQ0FBQztRQUVkLElBQUMsQ0FBQSxDQUFELEdBQUssRUFBRSxDQUFDLEtBQUgsQ0FBUyxJQUFDLENBQUEsSUFBVjtRQUNMLElBQUMsQ0FBQSxDQUFDLENBQUMsRUFBSCxDQUFNLFFBQU4sRUFBZ0IsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQyxVQUFELEVBQWEsQ0FBYjtnQkFFWixJQUFHLFVBQUEsS0FBYyxRQUFqQjsyQkFDSSxLQUFLLENBQUMsTUFBTixDQUFhLEtBQUMsQ0FBQSxJQUFkLEVBQW9CLEtBQUMsQ0FBQSxRQUFyQixFQURKO2lCQUFBLE1BQUE7MkJBR0ksS0FBSyxDQUFDLE1BQU4sQ0FBYSxLQUFDLENBQUEsSUFBZCxFQUFvQixLQUFDLENBQUEsUUFBckIsRUFISjs7WUFGWTtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBaEI7ZUFPQSxJQUFDLENBQUEsQ0FBQyxDQUFDLEVBQUgsQ0FBTSxRQUFOLEVBQWUsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQyxDQUFELEdBQUE7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWY7SUFkTTs7c0JBZ0JWLFFBQUEsR0FBVSxTQUFDLElBQUQ7UUFFTixJQUFHLElBQUksQ0FBQyxPQUFMLEtBQWdCLElBQUMsQ0FBQSxLQUFwQjtZQUNJLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBSSxDQUFDO21CQUNkLElBQUksQ0FBQyxJQUFMLENBQVUsWUFBVixFQUF1QixJQUFDLENBQUEsSUFBeEIsRUFGSjs7SUFGTTs7c0JBTVYsUUFBQSxHQUFVLFNBQUMsSUFBRDtRQUVOLElBQUcsQ0FBSSxJQUFQO1lBQ0ksSUFBQyxDQUFBLElBQUQsQ0FBQTttQkFDQSxJQUFJLENBQUMsSUFBTCxDQUFVLFlBQVYsRUFBdUIsSUFBQyxDQUFBLElBQXhCLEVBRko7O0lBRk07O3NCQU1WLElBQUEsR0FBTSxTQUFBO0FBRUYsWUFBQTs7Z0JBQUUsQ0FBRSxLQUFKLENBQUE7O1FBQ0EsT0FBTyxJQUFDLENBQUE7ZUFDUixJQUFDLENBQUEsRUFBRCxHQUFNO0lBSko7Ozs7OztBQU1WLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMCAgICAgMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBzbGFzaCwgcG9zdCwga2xvZywgZnMgfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgV2F0Y2hlclxuXG4gICAgQGlkOiAwXG4gICAgXG4gICAgQDogKEBmaWxlKSAtPlxuXG4gICAgICAgIEBpZCA9IFdhdGNoZXIuaWQrK1xuICAgICAgICBzbGFzaC5leGlzdHMgQGZpbGUsIEBvbkV4aXN0c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBvbkV4aXN0czogKHN0YXQpID0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IHN0YXRcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAaWRcbiAgICAgICAgQG10aW1lID0gc3RhdC5tdGltZU1zXG4gICAgICAgIFxuICAgICAgICBAdyA9IGZzLndhdGNoIEBmaWxlXG4gICAgICAgIEB3Lm9uICdjaGFuZ2UnLCAoY2hhbmdlVHlwZSwgcCkgPT5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgY2hhbmdlVHlwZSA9PSAnY2hhbmdlJ1xuICAgICAgICAgICAgICAgIHNsYXNoLmV4aXN0cyBAZmlsZSwgQG9uQ2hhbmdlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgc2xhc2guZXhpc3RzIEBmaWxlLCBAb25SZW5hbWVcbiAgICAgICAgICAgIFxuICAgICAgICBAdy5vbiAndW5saW5rJyAocCkgPT4gI2tsb2cgXCJ1bmxpbmsgI3tAaWR9XCIsIHNsYXNoLmJhc2VuYW1lKEBmaWxlKVxuICAgICAgICBcbiAgICBvbkNoYW5nZTogKHN0YXQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBzdGF0Lm10aW1lTXMgIT0gQG10aW1lXG4gICAgICAgICAgICBAbXRpbWUgPSBzdGF0Lm10aW1lTXNcbiAgICAgICAgICAgIHBvc3QuZW1pdCAncmVsb2FkRmlsZScgQGZpbGVcblxuICAgIG9uUmVuYW1lOiAoc3RhdCkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBzdGF0XG4gICAgICAgICAgICBAc3RvcCgpXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ3JlbW92ZUZpbGUnIEBmaWxlXG4gICAgICAgICAgICBcbiAgICBzdG9wOiAtPlxuICAgICAgICBcbiAgICAgICAgQHc/LmNsb3NlKClcbiAgICAgICAgZGVsZXRlIEB3XG4gICAgICAgIEBpZCA9IDBcblxubW9kdWxlLmV4cG9ydHMgPSBXYXRjaGVyXG4iXX0=
//# sourceURL=../../coffee/tools/watcher.coffee