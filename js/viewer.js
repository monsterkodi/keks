// koffee 1.4.0

/*
000   000  000  00000000  000   000  00000000  00000000 
000   000  000  000       000 0 000  000       000   000
 000 000   000  0000000   000000000  0000000   0000000  
   000     000  000       000   000  000       000   000
    0      000  00000000  00     00  00000000  000   000
 */
var $, File, Header, Viewer, dirlist, elem, empty, keyinfo, klog, open, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), slash = ref.slash, empty = ref.empty, open = ref.open, elem = ref.elem, stopEvent = ref.stopEvent, keyinfo = ref.keyinfo, klog = ref.klog, $ = ref.$;

dirlist = require('./tools/dirlist');

File = require('./tools/file');

Header = require('./header');

Viewer = (function() {
    function Viewer(browser, path) {
        this.browser = browser;
        this.close = bind(this.close, this);
        this.onKey = bind(this.onKey, this);
        if (slash.isDir(path)) {
            dirlist(path, (function(_this) {
                return function(items) {
                    var images;
                    images = items.filter(function(item) {
                        return File.isImage(item.file);
                    });
                    if (empty(images)) {
                        return;
                    }
                    return _this.loadImages(images.map(function(item) {
                        return item.file;
                    }));
                };
            })(this));
        } else {
            if (File.isImage(path)) {
                this.loadImages([path]);
            }
        }
    }

    Viewer.prototype.loadImages = function(images) {
        var cnt, file, i, img, len, main;
        this.header = new Header(this.browser);
        this.header.setFile(path);
        this.div = elem({
            "class": 'viewer',
            tabindex: 1
        });
        this.focus = document.activeElement;
        for (i = 0, len = images.length; i < len; i++) {
            file = images[i];
            img = elem('img', {
                "class": 'viewerImage',
                src: slash.fileUrl(file)
            });
            cnt = elem({
                "class": 'viewerImageContainer',
                child: img
            });
            cnt.addEventListener('dblclick', (function(file) {
                return function() {
                    return open(file);
                };
            })(file));
            this.div.appendChild(cnt);
            main = $('#main');
        }
        main.appendChild(this.div);
        this.div.addEventListener('keydown', this.onKey);
        return this.div.focus();
    };

    Viewer.prototype.onKey = function(event) {
        var char, combo, key, mod, ref1;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo, char = ref1.char;
        switch (combo) {
            case 'esc':
            case 'space':
                this.close();
        }
        return typeof event.stopPropagation === "function" ? event.stopPropagation() : void 0;
    };

    Viewer.prototype.close = function() {
        this.browser.viewer = null;
        this.header.del();
        this.div.remove();
        return this.focus.focus();
    };

    return Viewer;

})();

module.exports = Viewer;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld2VyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx5RkFBQTtJQUFBOztBQVFBLE1BQTRELE9BQUEsQ0FBUSxLQUFSLENBQTVELEVBQUUsaUJBQUYsRUFBUyxpQkFBVCxFQUFnQixlQUFoQixFQUFzQixlQUF0QixFQUE0Qix5QkFBNUIsRUFBdUMscUJBQXZDLEVBQWdELGVBQWhELEVBQXNEOztBQUV0RCxPQUFBLEdBQVUsT0FBQSxDQUFRLGlCQUFSOztBQUNWLElBQUEsR0FBVSxPQUFBLENBQVEsY0FBUjs7QUFDVixNQUFBLEdBQVUsT0FBQSxDQUFRLFVBQVI7O0FBRUo7SUFFQyxnQkFBQyxPQUFELEVBQVcsSUFBWDtRQUFDLElBQUMsQ0FBQSxVQUFEOzs7UUFFQSxJQUFHLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBWixDQUFIO1lBRUksT0FBQSxDQUFRLElBQVIsRUFBYyxDQUFBLFNBQUEsS0FBQTt1QkFBQSxTQUFDLEtBQUQ7QUFFVix3QkFBQTtvQkFBQSxNQUFBLEdBQVMsS0FBSyxDQUFDLE1BQU4sQ0FBYSxTQUFDLElBQUQ7K0JBQVUsSUFBSSxDQUFDLE9BQUwsQ0FBYSxJQUFJLENBQUMsSUFBbEI7b0JBQVYsQ0FBYjtvQkFFVCxJQUFVLEtBQUEsQ0FBTSxNQUFOLENBQVY7QUFBQSwrQkFBQTs7MkJBRUEsS0FBQyxDQUFBLFVBQUQsQ0FBWSxNQUFNLENBQUMsR0FBUCxDQUFXLFNBQUMsSUFBRDsrQkFBVSxJQUFJLENBQUM7b0JBQWYsQ0FBWCxDQUFaO2dCQU5VO1lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFkLEVBRko7U0FBQSxNQUFBO1lBVUksSUFBRyxJQUFJLENBQUMsT0FBTCxDQUFhLElBQWIsQ0FBSDtnQkFDSSxJQUFDLENBQUEsVUFBRCxDQUFZLENBQUMsSUFBRCxDQUFaLEVBREo7YUFWSjs7SUFGRDs7cUJBZUgsVUFBQSxHQUFZLFNBQUMsTUFBRDtBQUVSLFlBQUE7UUFBQSxJQUFDLENBQUEsTUFBRCxHQUFVLElBQUksTUFBSixDQUFXLElBQUMsQ0FBQSxPQUFaO1FBQ1YsSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFSLENBQWdCLElBQWhCO1FBRUEsSUFBQyxDQUFBLEdBQUQsR0FBTyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLFFBQU47WUFBZSxRQUFBLEVBQVMsQ0FBeEI7U0FBTDtRQUVQLElBQUMsQ0FBQSxLQUFELEdBQVMsUUFBUSxDQUFDO0FBRWxCLGFBQUEsd0NBQUE7O1lBRUksR0FBQSxHQUFNLElBQUEsQ0FBSyxLQUFMLEVBQVc7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxhQUFOO2dCQUFvQixHQUFBLEVBQUksS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFkLENBQXhCO2FBQVg7WUFDTixHQUFBLEdBQU0sSUFBQSxDQUFLO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sc0JBQU47Z0JBQTZCLEtBQUEsRUFBTSxHQUFuQzthQUFMO1lBQ04sR0FBRyxDQUFDLGdCQUFKLENBQXFCLFVBQXJCLEVBQWdDLENBQUMsU0FBQyxJQUFEO3VCQUFVLFNBQUE7MkJBQUcsSUFBQSxDQUFLLElBQUw7Z0JBQUg7WUFBVixDQUFELENBQUEsQ0FBeUIsSUFBekIsQ0FBaEM7WUFDQSxJQUFDLENBQUEsR0FBRyxDQUFDLFdBQUwsQ0FBaUIsR0FBakI7WUFFQSxJQUFBLEdBQU0sQ0FBQSxDQUFFLE9BQUY7QUFQVjtRQVNBLElBQUksQ0FBQyxXQUFMLENBQWlCLElBQUMsQ0FBQSxHQUFsQjtRQUVBLElBQUMsQ0FBQSxHQUFHLENBQUMsZ0JBQUwsQ0FBc0IsU0FBdEIsRUFBZ0MsSUFBQyxDQUFBLEtBQWpDO2VBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFMLENBQUE7SUFyQlE7O3FCQTZCWixLQUFBLEdBQU8sU0FBQyxLQUFEO0FBRUgsWUFBQTtRQUFBLE9BQTRCLE9BQU8sQ0FBQyxRQUFSLENBQWlCLEtBQWpCLENBQTVCLEVBQUUsY0FBRixFQUFPLGNBQVAsRUFBWSxrQkFBWixFQUFtQjtBQUVuQixnQkFBTyxLQUFQO0FBQUEsaUJBQ1MsS0FEVDtBQUFBLGlCQUNlLE9BRGY7Z0JBQzRCLElBQUMsQ0FBQSxLQUFELENBQUE7QUFENUI7NkRBSUEsS0FBSyxDQUFDO0lBUkg7O3FCQVVQLEtBQUEsR0FBTyxTQUFBO1FBRUgsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULEdBQWtCO1FBQ2xCLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBUixDQUFBO1FBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxNQUFMLENBQUE7ZUFDQSxJQUFDLENBQUEsS0FBSyxDQUFDLEtBQVAsQ0FBQTtJQUxHOzs7Ozs7QUFPWCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCBcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gMDAwIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgMDAwICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAwICAgICAgMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBzbGFzaCwgZW1wdHksIG9wZW4sIGVsZW0sIHN0b3BFdmVudCwga2V5aW5mbywga2xvZywgJCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5kaXJsaXN0ID0gcmVxdWlyZSAnLi90b29scy9kaXJsaXN0J1xuRmlsZSAgICA9IHJlcXVpcmUgJy4vdG9vbHMvZmlsZSdcbkhlYWRlciAgPSByZXF1aXJlICcuL2hlYWRlcidcblxuY2xhc3MgVmlld2VyXG5cbiAgICBAOiAoQGJyb3dzZXIsIHBhdGgpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5pc0RpciBwYXRoXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGRpcmxpc3QgcGF0aCwgKGl0ZW1zKSA9PlxuICAgIFxuICAgICAgICAgICAgICAgIGltYWdlcyA9IGl0ZW1zLmZpbHRlciAoaXRlbSkgLT4gRmlsZS5pc0ltYWdlIGl0ZW0uZmlsZVxuICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBpZiBlbXB0eSBpbWFnZXNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAbG9hZEltYWdlcyBpbWFnZXMubWFwIChpdGVtKSAtPiBpdGVtLmZpbGVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgRmlsZS5pc0ltYWdlIHBhdGhcbiAgICAgICAgICAgICAgICBAbG9hZEltYWdlcyBbcGF0aF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBsb2FkSW1hZ2VzOiAoaW1hZ2VzKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgIEBoZWFkZXIgPSBuZXcgSGVhZGVyIEBicm93c2VyXG4gICAgICAgIEBoZWFkZXIuc2V0RmlsZSBwYXRoXG4gICAgICAgIFxuICAgICAgICBAZGl2ID0gZWxlbSBjbGFzczondmlld2VyJyB0YWJpbmRleDoxXG4gICAgICAgIFxuICAgICAgICBAZm9jdXMgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50XG4gICAgICAgIFxuICAgICAgICBmb3IgZmlsZSBpbiBpbWFnZXNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaW1nID0gZWxlbSAnaW1nJyBjbGFzczondmlld2VySW1hZ2UnIHNyYzpzbGFzaC5maWxlVXJsIGZpbGVcbiAgICAgICAgICAgIGNudCA9IGVsZW0gY2xhc3M6J3ZpZXdlckltYWdlQ29udGFpbmVyJyBjaGlsZDppbWdcbiAgICAgICAgICAgIGNudC5hZGRFdmVudExpc3RlbmVyICdkYmxjbGljaycgKChmaWxlKSAtPiAtPiBvcGVuIGZpbGUpKGZpbGUpXG4gICAgICAgICAgICBAZGl2LmFwcGVuZENoaWxkIGNudFxuICAgICAgICBcbiAgICAgICAgICAgIG1haW4gPSQgJyNtYWluJ1xuICAgICAgICAgICAgXG4gICAgICAgIG1haW4uYXBwZW5kQ2hpbGQgQGRpdlxuXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgQG9uS2V5XG4gICAgICAgIEBkaXYuZm9jdXMoKVxuICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBvbktleTogKGV2ZW50KSA9PlxuXG4gICAgICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG5cbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdlc2MnICdzcGFjZScgdGhlbiBAY2xvc2UoKVxuICAgICAgICAgICAgIyBlbHNlIGtsb2cgJ2NvbWJvJyBjb21ib1xuICAgICAgICAgICAgXG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbj8oKVxuICAgICAgICAgICAgXG4gICAgY2xvc2U6ID0+XG5cbiAgICAgICAgQGJyb3dzZXIudmlld2VyID0gbnVsbFxuICAgICAgICBAaGVhZGVyLmRlbCgpXG4gICAgICAgIEBkaXYucmVtb3ZlKClcbiAgICAgICAgQGZvY3VzLmZvY3VzKClcblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3ZXJcbiJdfQ==
//# sourceURL=../coffee/viewer.coffee