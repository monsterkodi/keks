// koffee 1.4.0

/*
000   000  000  00000000  000   000  00000000  00000000 
000   000  000  000       000 0 000  000       000   000
 000 000   000  0000000   000000000  0000000   0000000  
   000     000  000       000   000  000       000   000
    0      000  00000000  00     00  00000000  000   000
 */
var $, File, Viewer, dirlist, elem, empty, keyinfo, klog, open, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), slash = ref.slash, empty = ref.empty, open = ref.open, elem = ref.elem, stopEvent = ref.stopEvent, keyinfo = ref.keyinfo, klog = ref.klog, $ = ref.$;

dirlist = require('./tools/dirlist');

File = require('./tools/file');

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
        this.div.remove();
        return this.focus.focus();
    };

    return Viewer;

})();

module.exports = Viewer;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld2VyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpRkFBQTtJQUFBOztBQVFBLE1BQTRELE9BQUEsQ0FBUSxLQUFSLENBQTVELEVBQUUsaUJBQUYsRUFBUyxpQkFBVCxFQUFnQixlQUFoQixFQUFzQixlQUF0QixFQUE0Qix5QkFBNUIsRUFBdUMscUJBQXZDLEVBQWdELGVBQWhELEVBQXNEOztBQUV0RCxPQUFBLEdBQVUsT0FBQSxDQUFRLGlCQUFSOztBQUNWLElBQUEsR0FBVSxPQUFBLENBQVEsY0FBUjs7QUFFSjtJQUVDLGdCQUFDLE9BQUQsRUFBVyxJQUFYO1FBQUMsSUFBQyxDQUFBLFVBQUQ7OztRQUVBLElBQUcsS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFaLENBQUg7WUFFSSxPQUFBLENBQVEsSUFBUixFQUFjLENBQUEsU0FBQSxLQUFBO3VCQUFBLFNBQUMsS0FBRDtBQUVWLHdCQUFBO29CQUFBLE1BQUEsR0FBUyxLQUFLLENBQUMsTUFBTixDQUFhLFNBQUMsSUFBRDsrQkFBVSxJQUFJLENBQUMsT0FBTCxDQUFhLElBQUksQ0FBQyxJQUFsQjtvQkFBVixDQUFiO29CQUVULElBQVUsS0FBQSxDQUFNLE1BQU4sQ0FBVjtBQUFBLCtCQUFBOzsyQkFFQSxLQUFDLENBQUEsVUFBRCxDQUFZLE1BQU0sQ0FBQyxHQUFQLENBQVcsU0FBQyxJQUFEOytCQUFVLElBQUksQ0FBQztvQkFBZixDQUFYLENBQVo7Z0JBTlU7WUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWQsRUFGSjtTQUFBLE1BQUE7WUFVSSxJQUFHLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBYixDQUFIO2dCQUNJLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBQyxJQUFELENBQVosRUFESjthQVZKOztJQUZEOztxQkFlSCxVQUFBLEdBQVksU0FBQyxNQUFEO0FBRVIsWUFBQTtRQUFBLElBQUMsQ0FBQSxHQUFELEdBQU8sSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxRQUFOO1lBQWUsUUFBQSxFQUFTLENBQXhCO1NBQUw7UUFFUCxJQUFDLENBQUEsS0FBRCxHQUFTLFFBQVEsQ0FBQztBQUVsQixhQUFBLHdDQUFBOztZQUVJLEdBQUEsR0FBTSxJQUFBLENBQUssS0FBTCxFQUFXO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sYUFBTjtnQkFBb0IsR0FBQSxFQUFJLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBZCxDQUF4QjthQUFYO1lBQ04sR0FBQSxHQUFNLElBQUEsQ0FBSztnQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLHNCQUFOO2dCQUE2QixLQUFBLEVBQU0sR0FBbkM7YUFBTDtZQUNOLEdBQUcsQ0FBQyxnQkFBSixDQUFxQixVQUFyQixFQUFnQyxDQUFDLFNBQUMsSUFBRDt1QkFBVSxTQUFBOzJCQUFHLElBQUEsQ0FBSyxJQUFMO2dCQUFIO1lBQVYsQ0FBRCxDQUFBLENBQXlCLElBQXpCLENBQWhDO1lBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxXQUFMLENBQWlCLEdBQWpCO1lBRUEsSUFBQSxHQUFNLENBQUEsQ0FBRSxPQUFGO0FBUFY7UUFTQSxJQUFJLENBQUMsV0FBTCxDQUFpQixJQUFDLENBQUEsR0FBbEI7UUFFQSxJQUFDLENBQUEsR0FBRyxDQUFDLGdCQUFMLENBQXNCLFNBQXRCLEVBQWdDLElBQUMsQ0FBQSxLQUFqQztlQUNBLElBQUMsQ0FBQSxHQUFHLENBQUMsS0FBTCxDQUFBO0lBbEJROztxQkEwQlosS0FBQSxHQUFPLFNBQUMsS0FBRDtBQUVILFlBQUE7UUFBQSxPQUE0QixPQUFPLENBQUMsUUFBUixDQUFpQixLQUFqQixDQUE1QixFQUFFLGNBQUYsRUFBTyxjQUFQLEVBQVksa0JBQVosRUFBbUI7QUFFbkIsZ0JBQU8sS0FBUDtBQUFBLGlCQUNTLEtBRFQ7QUFBQSxpQkFDZSxPQURmO2dCQUM0QixJQUFDLENBQUEsS0FBRCxDQUFBO0FBRDVCOzZEQUlBLEtBQUssQ0FBQztJQVJIOztxQkFVUCxLQUFBLEdBQU8sU0FBQTtRQUVILElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxHQUFrQjtRQUNsQixJQUFDLENBQUEsR0FBRyxDQUFDLE1BQUwsQ0FBQTtlQUNBLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBUCxDQUFBO0lBSkc7Ozs7OztBQU1YLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAwMDAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAwMDAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgIDAgICAgICAwMDAgIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHNsYXNoLCBlbXB0eSwgb3BlbiwgZWxlbSwgc3RvcEV2ZW50LCBrZXlpbmZvLCBrbG9nLCAkIH0gPSByZXF1aXJlICdreGsnXG5cbmRpcmxpc3QgPSByZXF1aXJlICcuL3Rvb2xzL2Rpcmxpc3QnXG5GaWxlICAgID0gcmVxdWlyZSAnLi90b29scy9maWxlJ1xuXG5jbGFzcyBWaWV3ZXJcblxuICAgIEA6IChAYnJvd3NlciwgcGF0aCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRGlyIHBhdGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZGlybGlzdCBwYXRoLCAoaXRlbXMpID0+XG4gICAgXG4gICAgICAgICAgICAgICAgaW1hZ2VzID0gaXRlbXMuZmlsdGVyIChpdGVtKSAtPiBGaWxlLmlzSW1hZ2UgaXRlbS5maWxlXG4gICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGltYWdlc1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEBsb2FkSW1hZ2VzIGltYWdlcy5tYXAgKGl0ZW0pIC0+IGl0ZW0uZmlsZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBGaWxlLmlzSW1hZ2UgcGF0aFxuICAgICAgICAgICAgICAgIEBsb2FkSW1hZ2VzIFtwYXRoXVxuICAgICAgICAgICAgXG4gICAgbG9hZEltYWdlczogKGltYWdlcykgLT5cbiAgICAgICAgICAgIFxuICAgICAgICBAZGl2ID0gZWxlbSBjbGFzczondmlld2VyJyB0YWJpbmRleDoxXG4gICAgICAgIFxuICAgICAgICBAZm9jdXMgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50XG4gICAgICAgIFxuICAgICAgICBmb3IgZmlsZSBpbiBpbWFnZXNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaW1nID0gZWxlbSAnaW1nJyBjbGFzczondmlld2VySW1hZ2UnIHNyYzpzbGFzaC5maWxlVXJsIGZpbGVcbiAgICAgICAgICAgIGNudCA9IGVsZW0gY2xhc3M6J3ZpZXdlckltYWdlQ29udGFpbmVyJyBjaGlsZDppbWdcbiAgICAgICAgICAgIGNudC5hZGRFdmVudExpc3RlbmVyICdkYmxjbGljaycgKChmaWxlKSAtPiAtPiBvcGVuIGZpbGUpKGZpbGUpXG4gICAgICAgICAgICBAZGl2LmFwcGVuZENoaWxkIGNudFxuICAgICAgICBcbiAgICAgICAgICAgIG1haW4gPSQgJyNtYWluJ1xuICAgICAgICAgICAgXG4gICAgICAgIG1haW4uYXBwZW5kQ2hpbGQgQGRpdlxuXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgQG9uS2V5XG4gICAgICAgIEBkaXYuZm9jdXMoKVxuICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBvbktleTogKGV2ZW50KSA9PlxuXG4gICAgICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG5cbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdlc2MnICdzcGFjZScgdGhlbiBAY2xvc2UoKVxuICAgICAgICAgICAgIyBlbHNlIGtsb2cgJ2NvbWJvJyBjb21ib1xuICAgICAgICAgICAgXG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbj8oKVxuICAgICAgICAgICAgXG4gICAgY2xvc2U6ID0+XG5cbiAgICAgICAgQGJyb3dzZXIudmlld2VyID0gbnVsbFxuICAgICAgICBAZGl2LnJlbW92ZSgpXG4gICAgICAgIEBmb2N1cy5mb2N1cygpXG5cbm1vZHVsZS5leHBvcnRzID0gVmlld2VyXG4iXX0=
//# sourceURL=../coffee/viewer.coffee