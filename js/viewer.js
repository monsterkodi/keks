// koffee 1.4.0

/*
000   000  000  00000000  000   000  00000000  00000000 
000   000  000  000       000 0 000  000       000   000
 000 000   000  0000000   000000000  0000000   0000000  
   000     000  000       000   000  000       000   000
    0      000  00000000  00     00  00000000  000   000
 */
var $, File, Header, Viewer, elem, empty, keyinfo, klog, open, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), slash = ref.slash, empty = ref.empty, open = ref.open, elem = ref.elem, stopEvent = ref.stopEvent, keyinfo = ref.keyinfo, klog = ref.klog, $ = ref.$;

File = require('./tools/file');

Header = require('./header');

Viewer = (function() {
    function Viewer(browser, path) {
        this.browser = browser;
        this.path = path;
        this.close = bind(this.close, this);
        this.onKey = bind(this.onKey, this);
        if (slash.isDir(this.path)) {
            slash.list(this.path, (function(_this) {
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
            if (File.isImage(this.path)) {
                this.loadImages([this.path]);
            }
        }
    }

    Viewer.prototype.loadImages = function(images) {
        var cnt, file, i, img, len, main;
        this.header = new Header(this.browser);
        this.header.setFile(this.path);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld2VyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxnRkFBQTtJQUFBOztBQVFBLE1BQTRELE9BQUEsQ0FBUSxLQUFSLENBQTVELEVBQUUsaUJBQUYsRUFBUyxpQkFBVCxFQUFnQixlQUFoQixFQUFzQixlQUF0QixFQUE0Qix5QkFBNUIsRUFBdUMscUJBQXZDLEVBQWdELGVBQWhELEVBQXNEOztBQUV0RCxJQUFBLEdBQVUsT0FBQSxDQUFRLGNBQVI7O0FBQ1YsTUFBQSxHQUFVLE9BQUEsQ0FBUSxVQUFSOztBQUVKO0lBRUMsZ0JBQUMsT0FBRCxFQUFXLElBQVg7UUFBQyxJQUFDLENBQUEsVUFBRDtRQUFVLElBQUMsQ0FBQSxPQUFEOzs7UUFFVixJQUFHLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBQyxDQUFBLElBQWIsQ0FBSDtZQUVJLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBQyxDQUFBLElBQVosRUFBa0IsQ0FBQSxTQUFBLEtBQUE7dUJBQUEsU0FBQyxLQUFEO0FBRWQsd0JBQUE7b0JBQUEsTUFBQSxHQUFTLEtBQUssQ0FBQyxNQUFOLENBQWEsU0FBQyxJQUFEOytCQUFVLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBSSxDQUFDLElBQWxCO29CQUFWLENBQWI7b0JBRVQsSUFBVSxLQUFBLENBQU0sTUFBTixDQUFWO0FBQUEsK0JBQUE7OzJCQUVBLEtBQUMsQ0FBQSxVQUFELENBQVksTUFBTSxDQUFDLEdBQVAsQ0FBVyxTQUFDLElBQUQ7K0JBQVUsSUFBSSxDQUFDO29CQUFmLENBQVgsQ0FBWjtnQkFOYztZQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBbEIsRUFGSjtTQUFBLE1BQUE7WUFVSSxJQUFHLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBQyxDQUFBLElBQWQsQ0FBSDtnQkFDSSxJQUFDLENBQUEsVUFBRCxDQUFZLENBQUMsSUFBQyxDQUFBLElBQUYsQ0FBWixFQURKO2FBVko7O0lBRkQ7O3FCQWVILFVBQUEsR0FBWSxTQUFDLE1BQUQ7QUFFUixZQUFBO1FBQUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFJLE1BQUosQ0FBVyxJQUFDLENBQUEsT0FBWjtRQUNWLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBUixDQUFnQixJQUFDLENBQUEsSUFBakI7UUFFQSxJQUFDLENBQUEsR0FBRCxHQUFPLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sUUFBTjtZQUFlLFFBQUEsRUFBUyxDQUF4QjtTQUFMO1FBRVAsSUFBQyxDQUFBLEtBQUQsR0FBUyxRQUFRLENBQUM7QUFFbEIsYUFBQSx3Q0FBQTs7WUFFSSxHQUFBLEdBQU0sSUFBQSxDQUFLLEtBQUwsRUFBVztnQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLGFBQU47Z0JBQW9CLEdBQUEsRUFBSSxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsQ0FBeEI7YUFBWDtZQUNOLEdBQUEsR0FBTSxJQUFBLENBQUs7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxzQkFBTjtnQkFBNkIsS0FBQSxFQUFNLEdBQW5DO2FBQUw7WUFDTixHQUFHLENBQUMsZ0JBQUosQ0FBcUIsVUFBckIsRUFBZ0MsQ0FBQyxTQUFDLElBQUQ7dUJBQVUsU0FBQTsyQkFBRyxJQUFBLENBQUssSUFBTDtnQkFBSDtZQUFWLENBQUQsQ0FBQSxDQUF5QixJQUF6QixDQUFoQztZQUNBLElBQUMsQ0FBQSxHQUFHLENBQUMsV0FBTCxDQUFpQixHQUFqQjtZQUVBLElBQUEsR0FBTSxDQUFBLENBQUUsT0FBRjtBQVBWO1FBU0EsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsSUFBQyxDQUFBLEdBQWxCO1FBRUEsSUFBQyxDQUFBLEdBQUcsQ0FBQyxnQkFBTCxDQUFzQixTQUF0QixFQUFnQyxJQUFDLENBQUEsS0FBakM7ZUFDQSxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUwsQ0FBQTtJQXJCUTs7cUJBNkJaLEtBQUEsR0FBTyxTQUFDLEtBQUQ7QUFFSCxZQUFBO1FBQUEsT0FBNEIsT0FBTyxDQUFDLFFBQVIsQ0FBaUIsS0FBakIsQ0FBNUIsRUFBRSxjQUFGLEVBQU8sY0FBUCxFQUFZLGtCQUFaLEVBQW1CO0FBRW5CLGdCQUFPLEtBQVA7QUFBQSxpQkFDUyxLQURUO0FBQUEsaUJBQ2UsT0FEZjtnQkFDNEIsSUFBQyxDQUFBLEtBQUQsQ0FBQTtBQUQ1Qjs2REFJQSxLQUFLLENBQUM7SUFSSDs7cUJBVVAsS0FBQSxHQUFPLFNBQUE7UUFFSCxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsR0FBa0I7UUFDbEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFSLENBQUE7UUFDQSxJQUFDLENBQUEsR0FBRyxDQUFDLE1BQUwsQ0FBQTtlQUNBLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBUCxDQUFBO0lBTEc7Ozs7OztBQU9YLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAwMDAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAwMDAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgIDAgICAgICAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHNsYXNoLCBlbXB0eSwgb3BlbiwgZWxlbSwgc3RvcEV2ZW50LCBrZXlpbmZvLCBrbG9nLCAkIH0gPSByZXF1aXJlICdreGsnXG5cbkZpbGUgICAgPSByZXF1aXJlICcuL3Rvb2xzL2ZpbGUnXG5IZWFkZXIgID0gcmVxdWlyZSAnLi9oZWFkZXInXG5cbmNsYXNzIFZpZXdlclxuXG4gICAgQDogKEBicm93c2VyLCBAcGF0aCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRGlyIEBwYXRoXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHNsYXNoLmxpc3QgQHBhdGgsIChpdGVtcykgPT5cbiAgICBcbiAgICAgICAgICAgICAgICBpbWFnZXMgPSBpdGVtcy5maWx0ZXIgKGl0ZW0pIC0+IEZpbGUuaXNJbWFnZSBpdGVtLmZpbGVcbiAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgZW1wdHkgaW1hZ2VzXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQGxvYWRJbWFnZXMgaW1hZ2VzLm1hcCAoaXRlbSkgLT4gaXRlbS5maWxlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIEZpbGUuaXNJbWFnZSBAcGF0aFxuICAgICAgICAgICAgICAgIEBsb2FkSW1hZ2VzIFtAcGF0aF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBsb2FkSW1hZ2VzOiAoaW1hZ2VzKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgIEBoZWFkZXIgPSBuZXcgSGVhZGVyIEBicm93c2VyXG4gICAgICAgIEBoZWFkZXIuc2V0RmlsZSBAcGF0aFxuICAgICAgICBcbiAgICAgICAgQGRpdiA9IGVsZW0gY2xhc3M6J3ZpZXdlcicgdGFiaW5kZXg6MVxuICAgICAgICBcbiAgICAgICAgQGZvY3VzID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudFxuICAgICAgICBcbiAgICAgICAgZm9yIGZpbGUgaW4gaW1hZ2VzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGltZyA9IGVsZW0gJ2ltZycgY2xhc3M6J3ZpZXdlckltYWdlJyBzcmM6c2xhc2guZmlsZVVybCBmaWxlXG4gICAgICAgICAgICBjbnQgPSBlbGVtIGNsYXNzOid2aWV3ZXJJbWFnZUNvbnRhaW5lcicgY2hpbGQ6aW1nXG4gICAgICAgICAgICBjbnQuYWRkRXZlbnRMaXN0ZW5lciAnZGJsY2xpY2snICgoZmlsZSkgLT4gLT4gb3BlbiBmaWxlKShmaWxlKVxuICAgICAgICAgICAgQGRpdi5hcHBlbmRDaGlsZCBjbnRcbiAgICAgICAgXG4gICAgICAgICAgICBtYWluID0kICcjbWFpbidcbiAgICAgICAgICAgIFxuICAgICAgICBtYWluLmFwcGVuZENoaWxkIEBkaXZcblxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2tleWRvd24nIEBvbktleVxuICAgICAgICBAZGl2LmZvY3VzKClcbiAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgb25LZXk6IChldmVudCkgPT5cblxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnZXNjJyAnc3BhY2UnIHRoZW4gQGNsb3NlKClcbiAgICAgICAgICAgICMgZWxzZSBrbG9nICdjb21ibycgY29tYm9cbiAgICAgICAgICAgIFxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24/KClcbiAgICAgICAgICAgIFxuICAgIGNsb3NlOiA9PlxuXG4gICAgICAgIEBicm93c2VyLnZpZXdlciA9IG51bGxcbiAgICAgICAgQGhlYWRlci5kZWwoKVxuICAgICAgICBAZGl2LnJlbW92ZSgpXG4gICAgICAgIEBmb2N1cy5mb2N1cygpXG5cbm1vZHVsZS5leHBvcnRzID0gVmlld2VyXG4iXX0=
//# sourceURL=../coffee/viewer.coffee