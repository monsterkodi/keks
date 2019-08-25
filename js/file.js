// koffee 1.4.0

/*
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
 */
var File, icons, klog, ref, slash, valid;

ref = require('kxk'), slash = ref.slash, valid = ref.valid, klog = ref.klog;

icons = require('./icons.json');

File = (function() {
    function File() {}

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

    return File;

})();

module.exports = File;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBeUIsT0FBQSxDQUFRLEtBQVIsQ0FBekIsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCOztBQUVoQixLQUFBLEdBQVEsT0FBQSxDQUFRLGNBQVI7O0FBRUY7OztJQVFGLElBQUMsQ0FBQSxhQUFELEdBQWdCLFNBQUMsSUFBRDtBQUVaLFlBQUE7UUFBQSxHQUFBLEdBQU0sS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWO0FBQ04sZ0JBQU8sR0FBUDtBQUFBLGlCQUNTLE1BRFQ7Z0JBQ3VCLFNBQUEsR0FBWTtBQUExQjtBQURULGlCQUVTLFFBRlQ7Z0JBRXVCLFNBQUEsR0FBWTtBQUExQjtBQUZULGlCQUdTLEtBSFQ7Z0JBR3VCLFNBQUEsR0FBWTtBQUExQjtBQUhUO2dCQUtRLElBQUcsSUFBQSxHQUFPLEtBQUssQ0FBQyxHQUFJLENBQUEsR0FBQSxDQUFwQjtvQkFDSSxTQUFBLEdBQVksT0FBQSxHQUFVLEtBRDFCOztBQUxSO1FBUUEsSUFBRyxDQUFJLFNBQVA7WUFDSSxJQUFHLElBQUEsR0FBTyxLQUFLLENBQUMsSUFBSyxDQUFBLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFnQixDQUFDLFdBQWpCLENBQUEsQ0FBQSxDQUFyQjtnQkFDSSxTQUFBLEdBQVksT0FBQSxHQUFVLEtBRDFCO2FBREo7OztZQUdBOztZQUFBLFlBQWE7O2VBQ2I7SUFmWTs7SUF1QmhCLElBQUMsQ0FBQSxJQUFELEdBQU8sU0FBQyxJQUFEO0FBRUgsWUFBQTtRQUFBLElBQUEsR0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLElBQVg7UUFDUCxHQUFBLEdBQU8sS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLENBQWUsQ0FBQyxXQUFoQixDQUFBO1FBQ1AsSUFBQSxHQUFPLEtBQUEsQ0FBTSxHQUFOLENBQUEsSUFBZSxHQUFBLEdBQUksR0FBbkIsSUFBMEI7UUFFakMsSUFBRyxJQUFJLENBQUMsVUFBTCxDQUFnQixHQUFoQixDQUFIO1lBQTRCLElBQUEsSUFBUSxXQUFwQzs7UUFFQSxJQUFBLEdBQU8sQ0FBQSxtQkFBQSxHQUFvQixJQUFwQixHQUF5QixJQUF6QixDQUFBLEdBQTZCLElBQTdCLEdBQWtDO1FBRXpDLElBQUcsS0FBQSxDQUFNLEdBQU4sQ0FBSDtZQUNJLElBQUEsSUFBUSxDQUFBLHdCQUFBLEdBQXlCLElBQXpCLEdBQThCLFlBQTlCLENBQUEsR0FBNEMsQ0FBQSx1QkFBQSxHQUF3QixJQUF4QixHQUE2QixJQUE3QixDQUE1QyxHQUE2RSxHQUE3RSxHQUFpRixVQUQ3Rjs7ZUFFQTtJQVpHOzs7Ozs7QUFjWCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwIFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIyNcblxueyBzbGFzaCwgdmFsaWQsIGtsb2cgfSA9IHJlcXVpcmUgJ2t4aydcblxuaWNvbnMgPSByZXF1aXJlICcuL2ljb25zLmpzb24nXG5cbmNsYXNzIEZpbGVcbiAgICBcbiAgICAjIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBAaWNvbkNsYXNzTmFtZTogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBleHQgPSBzbGFzaC5leHQgZmlsZVxuICAgICAgICBzd2l0Y2ggZXh0XG4gICAgICAgICAgICB3aGVuICdub29uJyAgIHRoZW4gY2xhc3NOYW1lID0gJ2ljb24gbm9vbidcbiAgICAgICAgICAgIHdoZW4gJ2tvZmZlZScgdGhlbiBjbGFzc05hbWUgPSAnaWNvbiBjb2ZmZWUnXG4gICAgICAgICAgICB3aGVuICd4Y2YnICAgIHRoZW4gY2xhc3NOYW1lID0gJ2ljb24gZ2ltcCdcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBjbHNzID0gaWNvbnMuZXh0W2V4dF1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gJ2ljb24gJyArIGNsc3NcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG5vdCBjbGFzc05hbWVcbiAgICAgICAgICAgIGlmIGNsc3MgPSBpY29ucy5iYXNlW3NsYXNoLmJhc2UoZmlsZSkudG9Mb3dlckNhc2UoKV1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWUgPSAnaWNvbiAnICsgY2xzc1xuICAgICAgICBjbGFzc05hbWUgPz0gJ2ljb24gZmlsZSdcbiAgICAgICAgY2xhc3NOYW1lXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBAc3BhbjogKHRleHQpIC0+XG4gICAgICAgIFxuICAgICAgICBiYXNlID0gc2xhc2guYmFzZSB0ZXh0XG4gICAgICAgIGV4dCAgPSBzbGFzaC5leHQodGV4dCkudG9Mb3dlckNhc2UoKVxuICAgICAgICBjbHNzID0gdmFsaWQoZXh0KSBhbmQgJyAnK2V4dCBvciAnJ1xuICAgICAgICBcbiAgICAgICAgaWYgYmFzZS5zdGFydHNXaXRoICcuJyB0aGVuIGNsc3MgKz0gJyBkb3RmaWxlJ1xuICAgICAgICBcbiAgICAgICAgc3BhbiA9IFwiPHNwYW4gY2xhc3M9J3RleHQje2Nsc3N9Jz5cIitiYXNlK1wiPC9zcGFuPlwiXG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBleHRcbiAgICAgICAgICAgIHNwYW4gKz0gXCI8c3BhbiBjbGFzcz0nZXh0IHB1bmN0I3tjbHNzfSc+Ljwvc3Bhbj5cIiArIFwiPHNwYW4gY2xhc3M9J2V4dCB0ZXh0I3tjbHNzfSc+XCIrZXh0K1wiPC9zcGFuPlwiXG4gICAgICAgIHNwYW5cbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVcbiJdfQ==
//# sourceURL=../coffee/file.coffee