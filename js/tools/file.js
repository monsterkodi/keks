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
        var i, len, ref1, s, spans, split;
        spans = [];
        split = slash.split(file);
        ref1 = split.slice(0, split.length - 1);
        for (i = 0, len = ref1.length; i < len; i++) {
            s = ref1[i];
            spans.push("<span class='path'>" + s + "</span>");
        }
        spans.push("<span>" + split.slice(-1)[0] + "</span>");
        return spans.join("<span class='punct'>/</span>");
    };

    return File;

})();

module.exports = File;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBcUMsT0FBQSxDQUFRLEtBQVIsQ0FBckMsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLGVBQWhCLEVBQXNCLFdBQXRCLEVBQTBCOztBQUUxQixLQUFBLEdBQVEsT0FBQSxDQUFRLGNBQVI7O0FBRUY7OztJQUVGLElBQUMsQ0FBQSxNQUFELEdBQVMsU0FBQyxJQUFELEVBQU8sRUFBUCxFQUFXLEVBQVg7ZUFFTCxFQUFFLENBQUMsS0FBSCxDQUFTLEtBQUssQ0FBQyxHQUFOLENBQVUsRUFBVixDQUFULEVBQXdCO1lBQUEsU0FBQSxFQUFVLElBQVY7U0FBeEIsRUFBd0MsU0FBQyxHQUFEO1lBQ3BDLElBQW9DLEdBQXBDO0FBQUEsdUJBQU8sTUFBQSxDQUFPLGNBQVAsRUFBc0IsR0FBdEIsRUFBUDs7bUJBQ0EsRUFBRSxDQUFDLE1BQUgsQ0FBVSxJQUFWLEVBQWdCLEVBQWhCLEVBQW9CLFNBQUMsR0FBRDtnQkFDaEIsSUFBcUMsR0FBckM7QUFBQSwyQkFBTyxNQUFBLENBQU8sZUFBUCxFQUF1QixHQUF2QixFQUFQOzt1QkFDQSxFQUFBLENBQUcsRUFBSDtZQUZnQixDQUFwQjtRQUZvQyxDQUF4QztJQUZLOztJQWNULElBQUMsQ0FBQSxhQUFELEdBQWdCLFNBQUMsSUFBRDtBQUVaLFlBQUE7UUFBQSxHQUFBLEdBQU0sS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWO0FBQ04sZ0JBQU8sR0FBUDtBQUFBLGlCQUNTLE1BRFQ7Z0JBQ3VCLFNBQUEsR0FBWTtBQUExQjtBQURULGlCQUVTLFFBRlQ7Z0JBRXVCLFNBQUEsR0FBWTtBQUExQjtBQUZULGlCQUdTLEtBSFQ7Z0JBR3VCLFNBQUEsR0FBWTtBQUExQjtBQUhUO2dCQUtRLElBQUcsSUFBQSxHQUFPLEtBQUssQ0FBQyxHQUFJLENBQUEsR0FBQSxDQUFwQjtvQkFDSSxTQUFBLEdBQVksT0FBQSxHQUFVLEtBRDFCOztBQUxSO1FBUUEsSUFBRyxDQUFJLFNBQVA7WUFDSSxJQUFHLElBQUEsR0FBTyxLQUFLLENBQUMsSUFBSyxDQUFBLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFnQixDQUFDLFdBQWpCLENBQUEsQ0FBQSxDQUFyQjtnQkFDSSxTQUFBLEdBQVksT0FBQSxHQUFVLEtBRDFCO2FBREo7OztZQUdBOztZQUFBLFlBQWE7O2VBQ2I7SUFmWTs7SUF1QmhCLElBQUMsQ0FBQSxJQUFELEdBQU8sU0FBQyxJQUFEO0FBRUgsWUFBQTtRQUFBLElBQUEsR0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLElBQVg7UUFDUCxHQUFBLEdBQU8sS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLENBQWUsQ0FBQyxXQUFoQixDQUFBO1FBQ1AsSUFBQSxHQUFPLEtBQUEsQ0FBTSxHQUFOLENBQUEsSUFBZSxHQUFBLEdBQUksR0FBbkIsSUFBMEI7UUFFakMsSUFBRyxJQUFJLENBQUMsVUFBTCxDQUFnQixHQUFoQixDQUFIO1lBQTRCLElBQUEsSUFBUSxXQUFwQzs7UUFFQSxJQUFBLEdBQU8sQ0FBQSxtQkFBQSxHQUFvQixJQUFwQixHQUF5QixJQUF6QixDQUFBLEdBQTZCLElBQTdCLEdBQWtDO1FBRXpDLElBQUcsS0FBQSxDQUFNLEdBQU4sQ0FBSDtZQUNJLElBQUEsSUFBUSxDQUFBLHdCQUFBLEdBQXlCLElBQXpCLEdBQThCLFlBQTlCLENBQUEsR0FBNEMsQ0FBQSx1QkFBQSxHQUF3QixJQUF4QixHQUE2QixJQUE3QixDQUE1QyxHQUE2RSxHQUE3RSxHQUFpRixVQUQ3Rjs7ZUFFQTtJQVpHOztJQWNQLElBQUMsQ0FBQSxTQUFELEdBQVksU0FBQyxJQUFEO0FBRVIsWUFBQTtRQUFBLEtBQUEsR0FBUTtRQUNSLEtBQUEsR0FBUSxLQUFLLENBQUMsS0FBTixDQUFZLElBQVo7QUFFUjtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksS0FBSyxDQUFDLElBQU4sQ0FBVyxxQkFBQSxHQUFzQixDQUF0QixHQUF3QixTQUFuQztBQURKO1FBRUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxRQUFBLEdBQVMsS0FBTSxVQUFFLENBQUEsQ0FBQSxDQUFqQixHQUFtQixTQUE5QjtBQUNBLGVBQU8sS0FBSyxDQUFDLElBQU4sQ0FBVyw4QkFBWDtJQVJDOzs7Ozs7QUFVaEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIFxuMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuIyMjXG5cbnsgc2xhc2gsIHZhbGlkLCBrbG9nLCBmcywga2Vycm9yIH0gPSByZXF1aXJlICdreGsnXG5cbmljb25zID0gcmVxdWlyZSAnLi9pY29ucy5qc29uJ1xuXG5jbGFzcyBGaWxlXG4gICAgXG4gICAgQHJlbmFtZTogKGZyb20sIHRvLCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIGZzLm1rZGlyIHNsYXNoLmRpcih0byksIHJlY3Vyc2l2ZTp0cnVlLCAoZXJyKSAtPlxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnbWtkaXIgZmFpbGVkJyBlcnIgaWYgZXJyXG4gICAgICAgICAgICBmcy5yZW5hbWUgZnJvbSwgdG8sIChlcnIpIC0+XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAncmVuYW1lIGZhaWxlZCcgZXJyIGlmIGVyclxuICAgICAgICAgICAgICAgIGNiIHRvXG4gICAgXG4gICAgIyAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgQGljb25DbGFzc05hbWU6IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgZXh0ID0gc2xhc2guZXh0IGZpbGVcbiAgICAgICAgc3dpdGNoIGV4dFxuICAgICAgICAgICAgd2hlbiAnbm9vbicgICB0aGVuIGNsYXNzTmFtZSA9ICdpY29uIG5vb24nXG4gICAgICAgICAgICB3aGVuICdrb2ZmZWUnIHRoZW4gY2xhc3NOYW1lID0gJ2ljb24gY29mZmVlJ1xuICAgICAgICAgICAgd2hlbiAneGNmJyAgICB0aGVuIGNsYXNzTmFtZSA9ICdpY29uIGdpbXAnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgY2xzcyA9IGljb25zLmV4dFtleHRdXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA9ICdpY29uICcgKyBjbHNzXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBub3QgY2xhc3NOYW1lXG4gICAgICAgICAgICBpZiBjbHNzID0gaWNvbnMuYmFzZVtzbGFzaC5iYXNlKGZpbGUpLnRvTG93ZXJDYXNlKCldXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gJ2ljb24gJyArIGNsc3NcbiAgICAgICAgY2xhc3NOYW1lID89ICdpY29uIGZpbGUnXG4gICAgICAgIGNsYXNzTmFtZVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgQHNwYW46ICh0ZXh0KSAtPlxuICAgICAgICBcbiAgICAgICAgYmFzZSA9IHNsYXNoLmJhc2UgdGV4dFxuICAgICAgICBleHQgID0gc2xhc2guZXh0KHRleHQpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgY2xzcyA9IHZhbGlkKGV4dCkgYW5kICcgJytleHQgb3IgJydcbiAgICAgICAgXG4gICAgICAgIGlmIGJhc2Uuc3RhcnRzV2l0aCAnLicgdGhlbiBjbHNzICs9ICcgZG90ZmlsZSdcbiAgICAgICAgXG4gICAgICAgIHNwYW4gPSBcIjxzcGFuIGNsYXNzPSd0ZXh0I3tjbHNzfSc+XCIrYmFzZStcIjwvc3Bhbj5cIlxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgZXh0XG4gICAgICAgICAgICBzcGFuICs9IFwiPHNwYW4gY2xhc3M9J2V4dCBwdW5jdCN7Y2xzc30nPi48L3NwYW4+XCIgKyBcIjxzcGFuIGNsYXNzPSdleHQgdGV4dCN7Y2xzc30nPlwiK2V4dCtcIjwvc3Bhbj5cIlxuICAgICAgICBzcGFuXG4gICAgICAgIFxuICAgIEBjcnVtYlNwYW46IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgc3BhbnMgPSBbXVxuICAgICAgICBzcGxpdCA9IHNsYXNoLnNwbGl0IGZpbGVcbiAgICAgICAgXG4gICAgICAgIGZvciBzIGluIHNwbGl0WzAuLi5zcGxpdC5sZW5ndGgtMV1cbiAgICAgICAgICAgIHNwYW5zLnB1c2ggXCI8c3BhbiBjbGFzcz0ncGF0aCc+I3tzfTwvc3Bhbj5cIlxuICAgICAgICBzcGFucy5wdXNoIFwiPHNwYW4+I3tzcGxpdFstMV19PC9zcGFuPlwiXG4gICAgICAgIHJldHVybiBzcGFucy5qb2luIFwiPHNwYW4gY2xhc3M9J3B1bmN0Jz4vPC9zcGFuPlwiXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBGaWxlXG4iXX0=
//# sourceURL=../../coffee/tools/file.coffee