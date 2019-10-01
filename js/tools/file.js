// koffee 1.4.0

/*
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
 */
var File, fs, icons, kerror, klog, ref, slash, valid;

ref = require('kxk'), slash = ref.slash, valid = ref.valid, klog = ref.klog, fs = ref.fs, kerror = ref.kerror;

icons = require('./icons.json');

File = (function() {
    function File() {}

    File.rename = function(from, to, cb) {
        return fs.mkdir(slash.dir(to), {
            recursive: true
        }, function(err) {
            if (err) {
                return kerror('mkdir failed', err);
            }
            if (slash.isDir(to)) {
                to = slash.join(to, slash.file(from));
            } else {
                to = slash.join(slash.dir(to), slash.file(from));
            }
            klog("rename " + from + " " + to);
            return fs.rename(from, to, function(err) {
                if (err) {
                    return kerror('rename failed', err);
                }
                return cb(to);
            });
        });
    };

    File.copy = function(from, to, cb) {
        var unusedFilename;
        if (slash.dir(from) === to) {
            unusedFilename = require('unused-filename');
            unusedFilename(from).then((function(_this) {
                return function(fileName) {
                    return _this.copy(from, fileName, cb);
                };
            })(this));
            return;
        }
        if (slash.isDir(to)) {
            to = slash.join(to, slash.file(from));
        } else {
            to = slash.join(slash.dir(to), slash.file(from));
        }
        klog("copyFile " + from + " " + to);
        return fs.copyFile(from, to, function(err) {
            if (err) {
                return kerror('copy failed', err);
            }
            return cb(to);
        });
    };

    File.iconClassName = function(file) {
        var className, clss, ext;
        ext = slash.ext(file);
        switch (ext) {
            case 'noon':
                className = 'icon noon';
                break;
            case 'koffee':
                className = 'icon coffee';
                break;
            case 'xcf':
                className = 'icon gimp';
                break;
            default:
                if (clss = icons.ext[ext]) {
                    className = 'icon ' + clss;
                }
        }
        if (!className) {
            if (clss = icons.base[slash.base(file).toLowerCase()]) {
                className = 'icon ' + clss;
            }
        }
        if (className != null) {
            className;
        } else {
            className = 'icon file';
        }
        return className;
    };

    File.span = function(text) {
        var base, clss, ext, span;
        base = slash.base(text);
        ext = slash.ext(text).toLowerCase();
        clss = valid(ext) && ' ' + ext || '';
        if (base.startsWith('.')) {
            clss += ' dotfile';
        }
        span = ("<span class='text" + clss + "'>") + base + "</span>";
        if (valid(ext)) {
            span += ("<span class='ext punct" + clss + "'>.</span>") + ("<span class='ext text" + clss + "'>") + ext + "</span>";
        }
        return span;
    };

    File.crumbSpan = function(file) {
        var i, j, ref1, s, spans, split;
        if (file === '/' || file === '') {
            return "<span>/</span>";
        }
        spans = [];
        split = slash.split(file);
        for (i = j = 0, ref1 = split.length - 1; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            s = split[i];
            spans.push("<div class='inline path' id='" + (split.slice(0, +i + 1 || 9e9).join('/')) + "'>" + s + "</div>");
        }
        spans.push("<div class='inline' id='" + file + "'>" + split.slice(-1)[0] + "</div>");
        return spans.join("<span class='punct'>/</span>");
    };

    return File;

})();

module.exports = File;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBcUMsT0FBQSxDQUFRLEtBQVIsQ0FBckMsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLGVBQWhCLEVBQXNCLFdBQXRCLEVBQTBCOztBQUUxQixLQUFBLEdBQVEsT0FBQSxDQUFRLGNBQVI7O0FBRUY7OztJQUVGLElBQUMsQ0FBQSxNQUFELEdBQVMsU0FBQyxJQUFELEVBQU8sRUFBUCxFQUFXLEVBQVg7ZUFDTCxFQUFFLENBQUMsS0FBSCxDQUFTLEtBQUssQ0FBQyxHQUFOLENBQVUsRUFBVixDQUFULEVBQXdCO1lBQUEsU0FBQSxFQUFVLElBQVY7U0FBeEIsRUFBd0MsU0FBQyxHQUFEO1lBQ3BDLElBQW9DLEdBQXBDO0FBQUEsdUJBQU8sTUFBQSxDQUFPLGNBQVAsRUFBc0IsR0FBdEIsRUFBUDs7WUFDQSxJQUFHLEtBQUssQ0FBQyxLQUFOLENBQVksRUFBWixDQUFIO2dCQUNJLEVBQUEsR0FBSyxLQUFLLENBQUMsSUFBTixDQUFXLEVBQVgsRUFBZSxLQUFLLENBQUMsSUFBTixDQUFXLElBQVgsQ0FBZixFQURUO2FBQUEsTUFBQTtnQkFHSSxFQUFBLEdBQUssS0FBSyxDQUFDLElBQU4sQ0FBVyxLQUFLLENBQUMsR0FBTixDQUFVLEVBQVYsQ0FBWCxFQUEwQixLQUFLLENBQUMsSUFBTixDQUFXLElBQVgsQ0FBMUIsRUFIVDs7WUFJQSxJQUFBLENBQUssU0FBQSxHQUFVLElBQVYsR0FBZSxHQUFmLEdBQWtCLEVBQXZCO21CQUNBLEVBQUUsQ0FBQyxNQUFILENBQVUsSUFBVixFQUFnQixFQUFoQixFQUFvQixTQUFDLEdBQUQ7Z0JBQ2hCLElBQXFDLEdBQXJDO0FBQUEsMkJBQU8sTUFBQSxDQUFPLGVBQVAsRUFBdUIsR0FBdkIsRUFBUDs7dUJBQ0EsRUFBQSxDQUFHLEVBQUg7WUFGZ0IsQ0FBcEI7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N0Y7O2VBRUE7SUFaRzs7SUFjUCxJQUFDLENBQUEsU0FBRCxHQUFZLFNBQUMsSUFBRDtBQUVSLFlBQUE7UUFBQSxJQUEyQixJQUFBLEtBQVMsR0FBVCxJQUFBLElBQUEsS0FBYSxFQUF4QztBQUFBLG1CQUFPLGlCQUFQOztRQUVBLEtBQUEsR0FBUTtRQUNSLEtBQUEsR0FBUSxLQUFLLENBQUMsS0FBTixDQUFZLElBQVo7QUFFUixhQUFTLDhGQUFUO1lBQ0ksQ0FBQSxHQUFJLEtBQU0sQ0FBQSxDQUFBO1lBQ1YsS0FBSyxDQUFDLElBQU4sQ0FBVywrQkFBQSxHQUErQixDQUFDLEtBQU0sd0JBQUssQ0FBQyxJQUFaLENBQWlCLEdBQWpCLENBQUQsQ0FBL0IsR0FBcUQsSUFBckQsR0FBeUQsQ0FBekQsR0FBMkQsUUFBdEU7QUFGSjtRQUdBLEtBQUssQ0FBQyxJQUFOLENBQVcsMEJBQUEsR0FBMkIsSUFBM0IsR0FBZ0MsSUFBaEMsR0FBb0MsS0FBTSxVQUFFLENBQUEsQ0FBQSxDQUE1QyxHQUE4QyxRQUF6RDtBQUNBLGVBQU8sS0FBSyxDQUFDLElBQU4sQ0FBVyw4QkFBWDtJQVhDOzs7Ozs7QUFhaEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIFxuMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuIyMjXG5cbnsgc2xhc2gsIHZhbGlkLCBrbG9nLCBmcywga2Vycm9yIH0gPSByZXF1aXJlICdreGsnXG5cbmljb25zID0gcmVxdWlyZSAnLi9pY29ucy5qc29uJ1xuXG5jbGFzcyBGaWxlXG4gICAgXG4gICAgQHJlbmFtZTogKGZyb20sIHRvLCBjYikgLT5cbiAgICAgICAgZnMubWtkaXIgc2xhc2guZGlyKHRvKSwgcmVjdXJzaXZlOnRydWUsIChlcnIpIC0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdta2RpciBmYWlsZWQnIGVyciBpZiBlcnJcbiAgICAgICAgICAgIGlmIHNsYXNoLmlzRGlyKHRvKVxuICAgICAgICAgICAgICAgIHRvID0gc2xhc2guam9pbiB0bywgc2xhc2guZmlsZSBmcm9tXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdG8gPSBzbGFzaC5qb2luIHNsYXNoLmRpcih0byksIHNsYXNoLmZpbGUgZnJvbVxuICAgICAgICAgICAga2xvZyBcInJlbmFtZSAje2Zyb219ICN7dG99XCJcbiAgICAgICAgICAgIGZzLnJlbmFtZSBmcm9tLCB0bywgKGVycikgLT5cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yICdyZW5hbWUgZmFpbGVkJyBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgY2IgdG9cblxuICAgIEBjb3B5OiAoZnJvbSwgdG8sIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guZGlyKGZyb20pID09IHRvXG4gICAgICAgICAgICB1bnVzZWRGaWxlbmFtZSA9IHJlcXVpcmUgJ3VudXNlZC1maWxlbmFtZSdcbiAgICAgICAgICAgIHVudXNlZEZpbGVuYW1lKGZyb20pLnRoZW4gKGZpbGVOYW1lKSA9PiBcbiAgICAgICAgICAgICAgICBAY29weSBmcm9tLCBmaWxlTmFtZSwgY2JcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRGlyKHRvKVxuICAgICAgICAgICAgdG8gPSBzbGFzaC5qb2luIHRvLCBzbGFzaC5maWxlIGZyb21cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdG8gPSBzbGFzaC5qb2luIHNsYXNoLmRpcih0byksIHNsYXNoLmZpbGUgZnJvbVxuICAgICAgICBrbG9nIFwiY29weUZpbGUgI3tmcm9tfSAje3RvfVwiICAgIFxuICAgICAgICBmcy5jb3B5RmlsZSBmcm9tLCB0bywgKGVycikgLT5cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ2NvcHkgZmFpbGVkJyBlcnIgaWYgZXJyXG4gICAgICAgICAgICBjYiB0b1xuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIEBpY29uQ2xhc3NOYW1lOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGV4dCA9IHNsYXNoLmV4dCBmaWxlXG4gICAgICAgIHN3aXRjaCBleHRcbiAgICAgICAgICAgIHdoZW4gJ25vb24nICAgdGhlbiBjbGFzc05hbWUgPSAnaWNvbiBub29uJ1xuICAgICAgICAgICAgd2hlbiAna29mZmVlJyB0aGVuIGNsYXNzTmFtZSA9ICdpY29uIGNvZmZlZSdcbiAgICAgICAgICAgIHdoZW4gJ3hjZicgICAgdGhlbiBjbGFzc05hbWUgPSAnaWNvbiBnaW1wJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIGNsc3MgPSBpY29ucy5leHRbZXh0XVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWUgPSAnaWNvbiAnICsgY2xzc1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgbm90IGNsYXNzTmFtZVxuICAgICAgICAgICAgaWYgY2xzcyA9IGljb25zLmJhc2Vbc2xhc2guYmFzZShmaWxlKS50b0xvd2VyQ2FzZSgpXVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA9ICdpY29uICcgKyBjbHNzXG4gICAgICAgIGNsYXNzTmFtZSA/PSAnaWNvbiBmaWxlJ1xuICAgICAgICBjbGFzc05hbWVcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIEBzcGFuOiAodGV4dCkgLT5cbiAgICAgICAgXG4gICAgICAgIGJhc2UgPSBzbGFzaC5iYXNlIHRleHRcbiAgICAgICAgZXh0ICA9IHNsYXNoLmV4dCh0ZXh0KS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGNsc3MgPSB2YWxpZChleHQpIGFuZCAnICcrZXh0IG9yICcnXG4gICAgICAgIFxuICAgICAgICBpZiBiYXNlLnN0YXJ0c1dpdGggJy4nIHRoZW4gY2xzcyArPSAnIGRvdGZpbGUnXG4gICAgICAgIFxuICAgICAgICBzcGFuID0gXCI8c3BhbiBjbGFzcz0ndGV4dCN7Y2xzc30nPlwiK2Jhc2UrXCI8L3NwYW4+XCJcbiAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIGV4dFxuICAgICAgICAgICAgc3BhbiArPSBcIjxzcGFuIGNsYXNzPSdleHQgcHVuY3Qje2Nsc3N9Jz4uPC9zcGFuPlwiICsgXCI8c3BhbiBjbGFzcz0nZXh0IHRleHQje2Nsc3N9Jz5cIitleHQrXCI8L3NwYW4+XCJcbiAgICAgICAgc3BhblxuICAgICAgICBcbiAgICBAY3J1bWJTcGFuOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBcIjxzcGFuPi88L3NwYW4+XCIgaWYgZmlsZSBpbiBbJy8nICcnXVxuICAgICAgICBcbiAgICAgICAgc3BhbnMgPSBbXVxuICAgICAgICBzcGxpdCA9IHNsYXNoLnNwbGl0IGZpbGVcbiAgICAgICAgXG4gICAgICAgIGZvciBpIGluIFswLi4uc3BsaXQubGVuZ3RoLTFdXG4gICAgICAgICAgICBzID0gc3BsaXRbaV1cbiAgICAgICAgICAgIHNwYW5zLnB1c2ggXCI8ZGl2IGNsYXNzPSdpbmxpbmUgcGF0aCcgaWQ9JyN7c3BsaXRbMC4uaV0uam9pbiAnLyd9Jz4je3N9PC9kaXY+XCJcbiAgICAgICAgc3BhbnMucHVzaCBcIjxkaXYgY2xhc3M9J2lubGluZScgaWQ9JyN7ZmlsZX0nPiN7c3BsaXRbLTFdfTwvZGl2PlwiXG4gICAgICAgIHJldHVybiBzcGFucy5qb2luIFwiPHNwYW4gY2xhc3M9J3B1bmN0Jz4vPC9zcGFuPlwiXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBGaWxlXG4iXX0=
//# sourceURL=../../coffee/tools/file.coffee