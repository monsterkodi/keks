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
            return fs.rename(from, to, function(err) {
                if (err) {
                    return kerror('rename failed', err);
                }
                return cb(to);
            });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBcUMsT0FBQSxDQUFRLEtBQVIsQ0FBckMsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLGVBQWhCLEVBQXNCLFdBQXRCLEVBQTBCOztBQUUxQixLQUFBLEdBQVEsT0FBQSxDQUFRLGNBQVI7O0FBRUY7OztJQUVGLElBQUMsQ0FBQSxNQUFELEdBQVMsU0FBQyxJQUFELEVBQU8sRUFBUCxFQUFXLEVBQVg7ZUFFTCxFQUFFLENBQUMsS0FBSCxDQUFTLEtBQUssQ0FBQyxHQUFOLENBQVUsRUFBVixDQUFULEVBQXdCO1lBQUEsU0FBQSxFQUFVLElBQVY7U0FBeEIsRUFBd0MsU0FBQyxHQUFEO1lBQ3BDLElBQW9DLEdBQXBDO0FBQUEsdUJBQU8sTUFBQSxDQUFPLGNBQVAsRUFBc0IsR0FBdEIsRUFBUDs7bUJBQ0EsRUFBRSxDQUFDLE1BQUgsQ0FBVSxJQUFWLEVBQWdCLEVBQWhCLEVBQW9CLFNBQUMsR0FBRDtnQkFDaEIsSUFBcUMsR0FBckM7QUFBQSwyQkFBTyxNQUFBLENBQU8sZUFBUCxFQUF1QixHQUF2QixFQUFQOzt1QkFDQSxFQUFBLENBQUcsRUFBSDtZQUZnQixDQUFwQjtRQUZvQyxDQUF4QztJQUZLOztJQWNULElBQUMsQ0FBQSxhQUFELEdBQWdCLFNBQUMsSUFBRDtBQUVaLFlBQUE7UUFBQSxHQUFBLEdBQU0sS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWO0FBQ04sZ0JBQU8sR0FBUDtBQUFBLGlCQUNTLE1BRFQ7Z0JBQ3VCLFNBQUEsR0FBWTtBQUExQjtBQURULGlCQUVTLFFBRlQ7Z0JBRXVCLFNBQUEsR0FBWTtBQUExQjtBQUZULGlCQUdTLEtBSFQ7Z0JBR3VCLFNBQUEsR0FBWTtBQUExQjtBQUhUO2dCQUtRLElBQUcsSUFBQSxHQUFPLEtBQUssQ0FBQyxHQUFJLENBQUEsR0FBQSxDQUFwQjtvQkFDSSxTQUFBLEdBQVksT0FBQSxHQUFVLEtBRDFCOztBQUxSO1FBUUEsSUFBRyxDQUFJLFNBQVA7WUFDSSxJQUFHLElBQUEsR0FBTyxLQUFLLENBQUMsSUFBSyxDQUFBLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFnQixDQUFDLFdBQWpCLENBQUEsQ0FBQSxDQUFyQjtnQkFDSSxTQUFBLEdBQVksT0FBQSxHQUFVLEtBRDFCO2FBREo7OztZQUdBOztZQUFBLFlBQWE7O2VBQ2I7SUFmWTs7SUF1QmhCLElBQUMsQ0FBQSxJQUFELEdBQU8sU0FBQyxJQUFEO0FBRUgsWUFBQTtRQUFBLElBQUEsR0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLElBQVg7UUFDUCxHQUFBLEdBQU8sS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLENBQWUsQ0FBQyxXQUFoQixDQUFBO1FBQ1AsSUFBQSxHQUFPLEtBQUEsQ0FBTSxHQUFOLENBQUEsSUFBZSxHQUFBLEdBQUksR0FBbkIsSUFBMEI7UUFFakMsSUFBRyxJQUFJLENBQUMsVUFBTCxDQUFnQixHQUFoQixDQUFIO1lBQTRCLElBQUEsSUFBUSxXQUFwQzs7UUFFQSxJQUFBLEdBQU8sQ0FBQSxtQkFBQSxHQUFvQixJQUFwQixHQUF5QixJQUF6QixDQUFBLEdBQTZCLElBQTdCLEdBQWtDO1FBRXpDLElBQUcsS0FBQSxDQUFNLEdBQU4sQ0FBSDtZQUNJLElBQUEsSUFBUSxDQUFBLHdCQUFBLEdBQXlCLElBQXpCLEdBQThCLFlBQTlCLENBQUEsR0FBNEMsQ0FBQSx1QkFBQSxHQUF3QixJQUF4QixHQUE2QixJQUE3QixDQUE1QyxHQUE2RSxHQUE3RSxHQUFpRixVQUQ3Rjs7ZUFFQTtJQVpHOztJQWNQLElBQUMsQ0FBQSxTQUFELEdBQVksU0FBQyxJQUFEO0FBRVIsWUFBQTtRQUFBLElBQTJCLElBQUEsS0FBUyxHQUFULElBQUEsSUFBQSxLQUFhLEVBQXhDO0FBQUEsbUJBQU8saUJBQVA7O1FBRUEsS0FBQSxHQUFRO1FBQ1IsS0FBQSxHQUFRLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBWjtBQUVSLGFBQVMsOEZBQVQ7WUFDSSxDQUFBLEdBQUksS0FBTSxDQUFBLENBQUE7WUFDVixLQUFLLENBQUMsSUFBTixDQUFXLCtCQUFBLEdBQStCLENBQUMsS0FBTSx3QkFBSyxDQUFDLElBQVosQ0FBaUIsR0FBakIsQ0FBRCxDQUEvQixHQUFxRCxJQUFyRCxHQUF5RCxDQUF6RCxHQUEyRCxRQUF0RTtBQUZKO1FBR0EsS0FBSyxDQUFDLElBQU4sQ0FBVywwQkFBQSxHQUEyQixJQUEzQixHQUFnQyxJQUFoQyxHQUFvQyxLQUFNLFVBQUUsQ0FBQSxDQUFBLENBQTVDLEdBQThDLFFBQXpEO0FBQ0EsZUFBTyxLQUFLLENBQUMsSUFBTixDQUFXLDhCQUFYO0lBWEM7Ozs7OztBQWFoQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwIFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIyNcblxueyBzbGFzaCwgdmFsaWQsIGtsb2csIGZzLCBrZXJyb3IgfSA9IHJlcXVpcmUgJ2t4aydcblxuaWNvbnMgPSByZXF1aXJlICcuL2ljb25zLmpzb24nXG5cbmNsYXNzIEZpbGVcbiAgICBcbiAgICBAcmVuYW1lOiAoZnJvbSwgdG8sIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgZnMubWtkaXIgc2xhc2guZGlyKHRvKSwgcmVjdXJzaXZlOnRydWUsIChlcnIpIC0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdta2RpciBmYWlsZWQnIGVyciBpZiBlcnJcbiAgICAgICAgICAgIGZzLnJlbmFtZSBmcm9tLCB0bywgKGVycikgLT5cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yICdyZW5hbWUgZmFpbGVkJyBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgY2IgdG9cbiAgICBcbiAgICAjIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBAaWNvbkNsYXNzTmFtZTogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBleHQgPSBzbGFzaC5leHQgZmlsZVxuICAgICAgICBzd2l0Y2ggZXh0XG4gICAgICAgICAgICB3aGVuICdub29uJyAgIHRoZW4gY2xhc3NOYW1lID0gJ2ljb24gbm9vbidcbiAgICAgICAgICAgIHdoZW4gJ2tvZmZlZScgdGhlbiBjbGFzc05hbWUgPSAnaWNvbiBjb2ZmZWUnXG4gICAgICAgICAgICB3aGVuICd4Y2YnICAgIHRoZW4gY2xhc3NOYW1lID0gJ2ljb24gZ2ltcCdcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBjbHNzID0gaWNvbnMuZXh0W2V4dF1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gJ2ljb24gJyArIGNsc3NcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG5vdCBjbGFzc05hbWVcbiAgICAgICAgICAgIGlmIGNsc3MgPSBpY29ucy5iYXNlW3NsYXNoLmJhc2UoZmlsZSkudG9Mb3dlckNhc2UoKV1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWUgPSAnaWNvbiAnICsgY2xzc1xuICAgICAgICBjbGFzc05hbWUgPz0gJ2ljb24gZmlsZSdcbiAgICAgICAgY2xhc3NOYW1lXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBAc3BhbjogKHRleHQpIC0+XG4gICAgICAgIFxuICAgICAgICBiYXNlID0gc2xhc2guYmFzZSB0ZXh0XG4gICAgICAgIGV4dCAgPSBzbGFzaC5leHQodGV4dCkudG9Mb3dlckNhc2UoKVxuICAgICAgICBjbHNzID0gdmFsaWQoZXh0KSBhbmQgJyAnK2V4dCBvciAnJ1xuICAgICAgICBcbiAgICAgICAgaWYgYmFzZS5zdGFydHNXaXRoICcuJyB0aGVuIGNsc3MgKz0gJyBkb3RmaWxlJ1xuICAgICAgICBcbiAgICAgICAgc3BhbiA9IFwiPHNwYW4gY2xhc3M9J3RleHQje2Nsc3N9Jz5cIitiYXNlK1wiPC9zcGFuPlwiXG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBleHRcbiAgICAgICAgICAgIHNwYW4gKz0gXCI8c3BhbiBjbGFzcz0nZXh0IHB1bmN0I3tjbHNzfSc+Ljwvc3Bhbj5cIiArIFwiPHNwYW4gY2xhc3M9J2V4dCB0ZXh0I3tjbHNzfSc+XCIrZXh0K1wiPC9zcGFuPlwiXG4gICAgICAgIHNwYW5cbiAgICAgICAgXG4gICAgQGNydW1iU3BhbjogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gXCI8c3Bhbj4vPC9zcGFuPlwiIGlmIGZpbGUgaW4gWycvJyAnJ11cbiAgICAgICAgXG4gICAgICAgIHNwYW5zID0gW11cbiAgICAgICAgc3BsaXQgPSBzbGFzaC5zcGxpdCBmaWxlXG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLnNwbGl0Lmxlbmd0aC0xXVxuICAgICAgICAgICAgcyA9IHNwbGl0W2ldXG4gICAgICAgICAgICBzcGFucy5wdXNoIFwiPGRpdiBjbGFzcz0naW5saW5lIHBhdGgnIGlkPScje3NwbGl0WzAuLmldLmpvaW4gJy8nfSc+I3tzfTwvZGl2PlwiXG4gICAgICAgIHNwYW5zLnB1c2ggXCI8ZGl2IGNsYXNzPSdpbmxpbmUnIGlkPScje2ZpbGV9Jz4je3NwbGl0Wy0xXX08L2Rpdj5cIlxuICAgICAgICByZXR1cm4gc3BhbnMuam9pbiBcIjxzcGFuIGNsYXNzPSdwdW5jdCc+Lzwvc3Bhbj5cIlxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gRmlsZVxuIl19
//# sourceURL=../../coffee/tools/file.coffee