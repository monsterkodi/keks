// koffee 1.3.0

/*
000   000  000  00000000  000   000  00000000  00000000 
000   000  000  000       000 0 000  000       000   000
 000 000   000  0000000   000000000  0000000   0000000  
   000     000  000       000   000  000       000   000
    0      000  00000000  00     00  00000000  000   000
 */
var $, File, Viewer, dirlist, elem, keyinfo, klog, open, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), slash = ref.slash, open = ref.open, elem = ref.elem, stopEvent = ref.stopEvent, keyinfo = ref.keyinfo, klog = ref.klog, $ = ref.$;

dirlist = require('./tools/dirlist');

File = require('./tools/file');

Viewer = (function() {
    function Viewer(dir) {
        this.dir = dir;
        this.close = bind(this.close, this);
        this.onKey = bind(this.onKey, this);
        dirlist(this.dir, (function(_this) {
            return function(items) {
                var cnt, file, i, images, img, len, main;
                images = items.filter(function(item) {
                    return File.isImage(item.file);
                });
                _this.div = elem({
                    "class": 'viewer',
                    tabindex: 1
                });
                _this.focus = document.activeElement;
                for (i = 0, len = images.length; i < len; i++) {
                    file = images[i].file;
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
                    _this.div.appendChild(cnt);
                    main = $('#main');
                }
                main.appendChild(_this.div);
                _this.div.addEventListener('keydown', _this.onKey);
                return _this.div.focus();
            };
        })(this));
    }

    Viewer.prototype.onKey = function(event) {
        var char, combo, key, mod, ref1;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo, char = ref1.char;
        switch (combo) {
            case 'esc':
                this.close();
                break;
            default:
                klog('combo', combo);
        }
        return typeof event.stopPropagation === "function" ? event.stopPropagation() : void 0;
    };

    Viewer.prototype.close = function() {
        klog('close');
        this.div.remove();
        return this.focus.focus();
    };

    return Viewer;

})();

module.exports = Viewer;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld2VyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwwRUFBQTtJQUFBOztBQVFBLE1BQXFELE9BQUEsQ0FBUSxLQUFSLENBQXJELEVBQUUsaUJBQUYsRUFBUyxlQUFULEVBQWUsZUFBZixFQUFxQix5QkFBckIsRUFBZ0MscUJBQWhDLEVBQXlDLGVBQXpDLEVBQStDOztBQUUvQyxPQUFBLEdBQVUsT0FBQSxDQUFRLGlCQUFSOztBQUNWLElBQUEsR0FBVSxPQUFBLENBQVEsY0FBUjs7QUFFSjtJQUVDLGdCQUFDLEdBQUQ7UUFBQyxJQUFDLENBQUEsTUFBRDs7O1FBRUEsT0FBQSxDQUFRLElBQUMsQ0FBQSxHQUFULEVBQWMsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQyxLQUFEO0FBRVYsb0JBQUE7Z0JBQUEsTUFBQSxHQUFTLEtBQUssQ0FBQyxNQUFOLENBQWEsU0FBQyxJQUFEOzJCQUFVLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBSSxDQUFDLElBQWxCO2dCQUFWLENBQWI7Z0JBRVQsS0FBQyxDQUFBLEdBQUQsR0FBTyxJQUFBLENBQUs7b0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxRQUFOO29CQUFlLFFBQUEsRUFBUyxDQUF4QjtpQkFBTDtnQkFFUCxLQUFDLENBQUEsS0FBRCxHQUFTLFFBQVEsQ0FBQztBQUVsQixxQkFBQSx3Q0FBQTtvQkFBSztvQkFFRCxHQUFBLEdBQU0sSUFBQSxDQUFLLEtBQUwsRUFBVzt3QkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLGFBQU47d0JBQW9CLEdBQUEsRUFBSSxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsQ0FBeEI7cUJBQVg7b0JBQ04sR0FBQSxHQUFNLElBQUEsQ0FBSzt3QkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLHNCQUFOO3dCQUE2QixLQUFBLEVBQU0sR0FBbkM7cUJBQUw7b0JBQ04sR0FBRyxDQUFDLGdCQUFKLENBQXFCLFVBQXJCLEVBQWdDLENBQUMsU0FBQyxJQUFEOytCQUFVLFNBQUE7bUNBQUcsSUFBQSxDQUFLLElBQUw7d0JBQUg7b0JBQVYsQ0FBRCxDQUFBLENBQXlCLElBQXpCLENBQWhDO29CQUNBLEtBQUMsQ0FBQSxHQUFHLENBQUMsV0FBTCxDQUFpQixHQUFqQjtvQkFFQSxJQUFBLEdBQU0sQ0FBQSxDQUFFLE9BQUY7QUFQVjtnQkFTQSxJQUFJLENBQUMsV0FBTCxDQUFpQixLQUFDLENBQUEsR0FBbEI7Z0JBRUEsS0FBQyxDQUFBLEdBQUcsQ0FBQyxnQkFBTCxDQUFzQixTQUF0QixFQUFnQyxLQUFDLENBQUEsS0FBakM7dUJBQ0EsS0FBQyxDQUFBLEdBQUcsQ0FBQyxLQUFMLENBQUE7WUFwQlU7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWQ7SUFGRDs7cUJBd0JILEtBQUEsR0FBTyxTQUFDLEtBQUQ7QUFFSCxZQUFBO1FBQUEsT0FBNEIsT0FBTyxDQUFDLFFBQVIsQ0FBaUIsS0FBakIsQ0FBNUIsRUFBRSxjQUFGLEVBQU8sY0FBUCxFQUFZLGtCQUFaLEVBQW1CO0FBRW5CLGdCQUFPLEtBQVA7QUFBQSxpQkFDUyxLQURUO2dCQUNvQixJQUFDLENBQUEsS0FBRCxDQUFBO0FBQVg7QUFEVDtnQkFFUyxJQUFBLENBQUssT0FBTCxFQUFhLEtBQWI7QUFGVDs2REFJQSxLQUFLLENBQUM7SUFSSDs7cUJBV1AsS0FBQSxHQUFPLFNBQUE7UUFDSCxJQUFBLENBQUssT0FBTDtRQUNBLElBQUMsQ0FBQSxHQUFHLENBQUMsTUFBTCxDQUFBO2VBQ0EsSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFQLENBQUE7SUFIRzs7Ozs7O0FBS1gsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuIDAwMCAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICBcbiAgIDAwMCAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgMCAgICAgIDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgc2xhc2gsIG9wZW4sIGVsZW0sIHN0b3BFdmVudCwga2V5aW5mbywga2xvZywgJCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5kaXJsaXN0ID0gcmVxdWlyZSAnLi90b29scy9kaXJsaXN0J1xuRmlsZSAgICA9IHJlcXVpcmUgJy4vdG9vbHMvZmlsZSdcblxuY2xhc3MgVmlld2VyXG5cbiAgICBAOiAoQGRpcikgLT5cbiAgICAgICAgXG4gICAgICAgIGRpcmxpc3QgQGRpciwgKGl0ZW1zKSA9PlxuXG4gICAgICAgICAgICBpbWFnZXMgPSBpdGVtcy5maWx0ZXIgKGl0ZW0pIC0+IEZpbGUuaXNJbWFnZSBpdGVtLmZpbGVcblxuICAgICAgICAgICAgQGRpdiA9IGVsZW0gY2xhc3M6J3ZpZXdlcicgdGFiaW5kZXg6MVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZm9jdXMgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciB7ZmlsZX0gaW4gaW1hZ2VzXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaW1nID0gZWxlbSAnaW1nJyBjbGFzczondmlld2VySW1hZ2UnIHNyYzpzbGFzaC5maWxlVXJsIGZpbGVcbiAgICAgICAgICAgICAgICBjbnQgPSBlbGVtIGNsYXNzOid2aWV3ZXJJbWFnZUNvbnRhaW5lcicgY2hpbGQ6aW1nXG4gICAgICAgICAgICAgICAgY250LmFkZEV2ZW50TGlzdGVuZXIgJ2RibGNsaWNrJyAoKGZpbGUpIC0+IC0+IG9wZW4gZmlsZSkoZmlsZSlcbiAgICAgICAgICAgICAgICBAZGl2LmFwcGVuZENoaWxkIGNudFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbWFpbiA9JCAnI21haW4nXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBtYWluLmFwcGVuZENoaWxkIEBkaXZcblxuICAgICAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJyBAb25LZXlcbiAgICAgICAgICAgIEBkaXYuZm9jdXMoKVxuICAgICAgICAgICAgXG4gICAgb25LZXk6IChldmVudCkgPT5cblxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnZXNjJyB0aGVuIEBjbG9zZSgpXG4gICAgICAgICAgICBlbHNlIGtsb2cgJ2NvbWJvJyBjb21ib1xuICAgICAgICAgICAgXG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbj8oKVxuICAgICAgICAjIHN0b3BFdmVudCBldmVudFxuICAgICAgICAgICAgXG4gICAgY2xvc2U6ID0+XG4gICAgICAgIGtsb2cgJ2Nsb3NlJ1xuICAgICAgICBAZGl2LnJlbW92ZSgpXG4gICAgICAgIEBmb2N1cy5mb2N1cygpXG5cbm1vZHVsZS5leHBvcnRzID0gVmlld2VyXG4iXX0=
//# sourceURL=../coffee/viewer.coffee