// koffee 1.14.0

/*
000   000  000  000   000  0000000     0000000   000   000
000 0 000  000  0000  000  000   000  000   000  000 0 000
000000000  000  000 0 000  000   000  000   000  000000000
000   000  000  000  0000  000   000  000   000  000   000
00     00  000  000   000  0000000     0000000   00     00
 */
var $, FileBrowser, _, args, changeFontSize, clamp, defaultFontSize, fileBrowser, getFontSize, hideExtensions, onContextMenu, onMenuAction, onWheel, pkg, post, prefs, ref, resetFontSize, setFontSize, setStyle, slash, toggleExtensions, w, win, winID, winMain;

ref = require('kxk'), $ = ref.$, _ = ref._, args = ref.args, clamp = ref.clamp, post = ref.post, prefs = ref.prefs, setStyle = ref.setStyle, slash = ref.slash, win = ref.win;

FileBrowser = require('./filebrowser');

w = new win({
    dir: __dirname,
    pkg: require('../package.json'),
    menu: '../coffee/menu.noon',
    icon: '../img/menu@2x.png',
    prefsSeperator: '▸',
    context: false,
    dragElem: $('#crumbs')
});

pkg = require('../package.json');

winID = window.winID;

fileBrowser = null;

winMain = function() {
    var active, load, ref1;
    fileBrowser = new FileBrowser($("#main"));
    if ((ref1 = args.folder) != null ? ref1[0] : void 0) {
        fileBrowser.browse(args.folder[0]);
    } else {
        if (load = prefs.get('load')) {
            if (load.last !== load.first) {
                active = load.last.slice(load.first.length);
                active = load.first + '/' + slash.split(active)[0];
            }
            fileBrowser.browse(load.first, {
                active: active,
                cb: function() {
                    return fileBrowser.navigateToFile(load.last);
                }
            });
        } else {
            fileBrowser.browse('~');
        }
    }
    return prefs.apply('browser▸hideExtensions', hideExtensions);
};

onContextMenu = function(event) {
    if (!event.target.classList.contains('crumb')) {
        return;
    }
    return fileBrowser.columns[event.target.columnIndex].onContextMenu(event, true);
};

$("#crumbs").addEventListener('contextmenu', onContextMenu);

defaultFontSize = 18;

getFontSize = function() {
    return prefs.get('fontSize', defaultFontSize);
};

setFontSize = function(s) {
    if (!_.isFinite(s)) {
        s = getFontSize();
    }
    s = clamp(8, 44, s);
    prefs.set('fontSize', s);
    setStyle('#main', 'font-size', s + "px");
    return setStyle('.rowNameInput', 'font-size', s + "px");
};

changeFontSize = function(d) {
    var f, s;
    s = getFontSize();
    if (s >= 30) {
        f = 4;
    } else if (s >= 20) {
        f = 2;
    } else {
        f = 1;
    }
    return setFontSize(s + f * d);
};

resetFontSize = function() {
    prefs.set('fontSize', defaultFontSize);
    return setFontSize(defaultFontSize);
};

onWheel = function(event) {
    if (0 <= w.modifiers.indexOf('ctrl')) {
        return changeFontSize(-event.deltaY / 100);
    }
};

setFontSize(getFontSize());

window.document.addEventListener('wheel', onWheel);

onMenuAction = function(name, args) {
    var ref1;
    if (!fileBrowser.viewer) {
        switch (name) {
            case 'Toggle Extensions':
                return toggleExtensions();
            case 'Increase':
                return changeFontSize(+1);
            case 'Decrease':
                return changeFontSize(-1);
            case 'Reset':
                return resetFontSize();
            case 'Refresh':
                return fileBrowser.refresh();
        }
    }
    switch (name) {
        case 'Add to Shelf':
            return addToShelf();
        case 'Focus Shelf':
            return (ref1 = $('shelf')) != null ? typeof ref1.focus === "function" ? ref1.focus() : void 0 : void 0;
        case 'Reload Window':
            return reloadWin();
        case 'Toggle Shelf':
            return fileBrowser.toggleShelf();
    }
    return post.toMain('menuAction', name, args);
};

post.on('menuAction', onMenuAction);

post.on('load', function(info) {
    var load;
    load = prefs.get('load', {});
    if (info.column) {
        load.last = info.item.file;
    } else {
        load.first = info.item.file;
        load.last = info.item.file;
    }
    return prefs.set('load', load);
});

toggleExtensions = function() {
    return prefs.toggle('browser▸hideExtensions', hideExtensions);
};

hideExtensions = function(hide) {
    if (hide == null) {
        hide = true;
    }
    setStyle('.browserRow.file .ext', 'display', hide && 'none' || 'initial');
    return setStyle('.fileInfoFile .ext', 'display', hide && 'none' || 'initial');
};

winMain();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4uL2NvZmZlZSIsInNvdXJjZXMiOlsid2luZG93LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUEyRCxPQUFBLENBQVEsS0FBUixDQUEzRCxFQUFFLFNBQUYsRUFBSyxTQUFMLEVBQVEsZUFBUixFQUFjLGlCQUFkLEVBQXFCLGVBQXJCLEVBQTJCLGlCQUEzQixFQUFrQyx1QkFBbEMsRUFBNEMsaUJBQTVDLEVBQW1EOztBQUVuRCxXQUFBLEdBQWMsT0FBQSxDQUFRLGVBQVI7O0FBRWQsQ0FBQSxHQUFJLElBQUksR0FBSixDQUNBO0lBQUEsR0FBQSxFQUFRLFNBQVI7SUFDQSxHQUFBLEVBQVEsT0FBQSxDQUFRLGlCQUFSLENBRFI7SUFFQSxJQUFBLEVBQVEscUJBRlI7SUFHQSxJQUFBLEVBQVEsb0JBSFI7SUFJQSxjQUFBLEVBQWdCLEdBSmhCO0lBS0EsT0FBQSxFQUFTLEtBTFQ7SUFNQSxRQUFBLEVBQVUsQ0FBQSxDQUFFLFNBQUYsQ0FOVjtDQURBOztBQVNKLEdBQUEsR0FBVyxPQUFBLENBQVEsaUJBQVI7O0FBQ1gsS0FBQSxHQUFXLE1BQU0sQ0FBQzs7QUFDbEIsV0FBQSxHQUFjOztBQVFkLE9BQUEsR0FBVSxTQUFBO0FBRU4sUUFBQTtJQUFBLFdBQUEsR0FBYyxJQUFJLFdBQUosQ0FBZ0IsQ0FBQSxDQUFFLE9BQUYsQ0FBaEI7SUFFZCx1Q0FBZ0IsQ0FBQSxDQUFBLFVBQWhCO1FBQ0ksV0FBVyxDQUFDLE1BQVosQ0FBbUIsSUFBSSxDQUFDLE1BQU8sQ0FBQSxDQUFBLENBQS9CLEVBREo7S0FBQSxNQUFBO1FBR0ksSUFBRyxJQUFBLEdBQU8sS0FBSyxDQUFDLEdBQU4sQ0FBVSxNQUFWLENBQVY7WUFDSSxJQUFHLElBQUksQ0FBQyxJQUFMLEtBQWEsSUFBSSxDQUFDLEtBQXJCO2dCQUNJLE1BQUEsR0FBUyxJQUFJLENBQUMsSUFBSztnQkFDbkIsTUFB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LFNBQTlEO1dBQ0EsUUFBQSxDQUFTLG9CQUFULEVBQWlDLFNBQWpDLEVBQTJDLElBQUEsSUFBUyxNQUFULElBQW1CLFNBQTlEO0FBSmE7O0FBTWpCLE9BQUEsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwICAgICAwMFxuIyMjXG5cbnsgJCwgXywgYXJncywgY2xhbXAsIHBvc3QsIHByZWZzLCBzZXRTdHlsZSwgc2xhc2gsIHdpbiB9ID0gcmVxdWlyZSAna3hrJ1xuXG5GaWxlQnJvd3NlciA9IHJlcXVpcmUgJy4vZmlsZWJyb3dzZXInXG4gIFxudyA9IG5ldyB3aW5cbiAgICBkaXI6ICAgIF9fZGlybmFtZVxuICAgIHBrZzogICAgcmVxdWlyZSAnLi4vcGFja2FnZS5qc29uJ1xuICAgIG1lbnU6ICAgJy4uL2NvZmZlZS9tZW51Lm5vb24nXG4gICAgaWNvbjogICAnLi4vaW1nL21lbnVAMngucG5nJ1xuICAgIHByZWZzU2VwZXJhdG9yOiAn4pa4J1xuICAgIGNvbnRleHQ6IGZhbHNlXG4gICAgZHJhZ0VsZW06ICQgJyNjcnVtYnMnXG4gICAgXG5wa2cgICAgICA9IHJlcXVpcmUgJy4uL3BhY2thZ2UuanNvbidcbndpbklEICAgID0gd2luZG93LndpbklEXG5maWxlQnJvd3NlciA9IG51bGxcblxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4jIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbiMgMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG5cbndpbk1haW4gPSAtPlxuXG4gICAgZmlsZUJyb3dzZXIgPSBuZXcgRmlsZUJyb3dzZXIgJCBcIiNtYWluXCJcbiAgICBcbiAgICBpZiBhcmdzLmZvbGRlcj9bMF1cbiAgICAgICAgZmlsZUJyb3dzZXIuYnJvd3NlIGFyZ3MuZm9sZGVyWzBdXG4gICAgZWxzZVxuICAgICAgICBpZiBsb2FkID0gcHJlZnMuZ2V0ICdsb2FkJ1xuICAgICAgICAgICAgaWYgbG9hZC5sYXN0ICE9IGxvYWQuZmlyc3RcbiAgICAgICAgICAgICAgICBhY3RpdmUgPSBsb2FkLmxhc3RbbG9hZC5maXJzdC5sZW5ndGguLl1cbiAgICAgICAgICAgICAgICBhY3RpdmUgPSBsb2FkLmZpcnN0ICsgJy8nICsgc2xhc2guc3BsaXQoYWN0aXZlKVswXVxuICAgICAgICAgICAgZmlsZUJyb3dzZXIuYnJvd3NlIGxvYWQuZmlyc3QsIGFjdGl2ZTphY3RpdmUsIGNiOiAtPlxuICAgICAgICAgICAgICAgIGZpbGVCcm93c2VyLm5hdmlnYXRlVG9GaWxlIGxvYWQubGFzdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmaWxlQnJvd3Nlci5icm93c2UgJ34nXG4gICAgXG4gICAgIyB3aW4ub24gJ3Jlc2l6ZScgLT4gZmlsZUJyb3dzZXIucmVzaXplZCgpXG4gICAgXG4gICAgcHJlZnMuYXBwbHkgJ2Jyb3dzZXLilrhoaWRlRXh0ZW5zaW9ucycgaGlkZUV4dGVuc2lvbnNcbiAgICBcbiMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwXG4jIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwXG5cbm9uQ29udGV4dE1lbnUgPSAoZXZlbnQpIC0+IFxuICAgIFxuICAgIHJldHVybiBpZiBub3QgZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyAnY3J1bWInXG4gICAgXG4gICAgZmlsZUJyb3dzZXIuY29sdW1uc1tldmVudC50YXJnZXQuY29sdW1uSW5kZXhdLm9uQ29udGV4dE1lbnUgZXZlbnQsIHRydWVcbiAgICBcbiQoXCIjY3J1bWJzXCIpLmFkZEV2ZW50TGlzdGVuZXIgJ2NvbnRleHRtZW51JyBvbkNvbnRleHRNZW51XG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuZGVmYXVsdEZvbnRTaXplID0gMThcblxuZ2V0Rm9udFNpemUgPSAtPiBwcmVmcy5nZXQgJ2ZvbnRTaXplJyBkZWZhdWx0Rm9udFNpemVcblxuc2V0Rm9udFNpemUgPSAocykgLT5cbiAgICAgICAgXG4gICAgcyA9IGdldEZvbnRTaXplKCkgaWYgbm90IF8uaXNGaW5pdGUgc1xuICAgIHMgPSBjbGFtcCA4IDQ0IHNcblxuICAgIHByZWZzLnNldCAnZm9udFNpemUnIHNcblxuICAgIHNldFN0eWxlICcjbWFpbicgICAgICAgICAnZm9udC1zaXplJyBcIiN7c31weFwiXG4gICAgc2V0U3R5bGUgJy5yb3dOYW1lSW5wdXQnICdmb250LXNpemUnIFwiI3tzfXB4XCJcblxuY2hhbmdlRm9udFNpemUgPSAoZCkgLT5cbiAgICBcbiAgICBzID0gZ2V0Rm9udFNpemUoKVxuICAgIGlmICAgICAgcyA+PSAzMCB0aGVuIGYgPSA0XG4gICAgZWxzZSBpZiBzID49IDIwIHRoZW4gZiA9IDJcbiAgICBlbHNlICAgICAgICAgICAgICAgICBmID0gMVxuICAgICAgICBcbiAgICBzZXRGb250U2l6ZSBzICsgZipkXG5cbnJlc2V0Rm9udFNpemUgPSAtPlxuICAgIFxuICAgIHByZWZzLnNldCAnZm9udFNpemUnIGRlZmF1bHRGb250U2l6ZVxuICAgIHNldEZvbnRTaXplIGRlZmF1bHRGb250U2l6ZVxuICAgICBcbm9uV2hlZWwgPSAoZXZlbnQpIC0+XG4gICAgXG4gICAgaWYgMCA8PSB3Lm1vZGlmaWVycy5pbmRleE9mICdjdHJsJ1xuICAgICAgICBjaGFuZ2VGb250U2l6ZSAtZXZlbnQuZGVsdGFZLzEwMFxuICBcbnNldEZvbnRTaXplIGdldEZvbnRTaXplKClcbndpbmRvdy5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyICd3aGVlbCcgb25XaGVlbCAgICBcblxuIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxub25NZW51QWN0aW9uID0gKG5hbWUsIGFyZ3MpIC0+XG5cbiAgICBpZiBub3QgZmlsZUJyb3dzZXIudmlld2VyXG4gICAgICAgIHN3aXRjaCBuYW1lXG4gICAgICAgICAgICB3aGVuICdUb2dnbGUgRXh0ZW5zaW9ucycgdGhlbiByZXR1cm4gdG9nZ2xlRXh0ZW5zaW9ucygpXG4gICAgICAgICAgICB3aGVuICdJbmNyZWFzZScgICAgICAgICAgdGhlbiByZXR1cm4gY2hhbmdlRm9udFNpemUgKzFcbiAgICAgICAgICAgIHdoZW4gJ0RlY3JlYXNlJyAgICAgICAgICB0aGVuIHJldHVybiBjaGFuZ2VGb250U2l6ZSAtMVxuICAgICAgICAgICAgd2hlbiAnUmVzZXQnICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHJlc2V0Rm9udFNpemUoKVxuICAgICAgICAgICAgd2hlbiAnUmVmcmVzaCcgICAgICAgICAgIHRoZW4gcmV0dXJuIGZpbGVCcm93c2VyLnJlZnJlc2goKVxuICAgIFxuICAgIHN3aXRjaCBuYW1lXG5cbiAgICAgICAgd2hlbiAnQWRkIHRvIFNoZWxmJyAgICAgIHRoZW4gcmV0dXJuIGFkZFRvU2hlbGYoKVxuICAgICAgICB3aGVuICdGb2N1cyBTaGVsZicgICAgICAgdGhlbiByZXR1cm4gJCgnc2hlbGYnKT8uZm9jdXM/KClcbiAgICAgICAgd2hlbiAnUmVsb2FkIFdpbmRvdycgICAgIHRoZW4gcmV0dXJuIHJlbG9hZFdpbigpXG4gICAgICAgIHdoZW4gJ1RvZ2dsZSBTaGVsZicgICAgICB0aGVuIHJldHVybiBmaWxlQnJvd3Nlci50b2dnbGVTaGVsZigpXG4gICAgICAgIFxuICAgICMga2xvZyAnbWVudUFjdGlvbicgbmFtZVxuICAgIHBvc3QudG9NYWluICdtZW51QWN0aW9uJyBuYW1lLCBhcmdzXG5cbnBvc3Qub24gJ21lbnVBY3Rpb24nIG9uTWVudUFjdGlvblxucG9zdC5vbiAnbG9hZCcgKGluZm8pIC0+XG4gICAgXG4gICAgbG9hZCA9IHByZWZzLmdldCAnbG9hZCcge31cbiAgICBpZiBpbmZvLmNvbHVtblxuICAgICAgICBsb2FkLmxhc3QgPSBpbmZvLml0ZW0uZmlsZVxuICAgIGVsc2VcbiAgICAgICAgbG9hZC5maXJzdCA9IGluZm8uaXRlbS5maWxlXG4gICAgICAgIGxvYWQubGFzdCAgPSBpbmZvLml0ZW0uZmlsZVxuICAgIHByZWZzLnNldCAnbG9hZCcgbG9hZFxuXG50b2dnbGVFeHRlbnNpb25zID0gLT4gcHJlZnMudG9nZ2xlICdicm93c2Vy4pa4aGlkZUV4dGVuc2lvbnMnIGhpZGVFeHRlbnNpb25zXG5oaWRlRXh0ZW5zaW9ucyA9IChoaWRlPXRydWUpIC0+XG5cbiAgICAjIGtsb2cgJ2hpZGVFeHRlbnNpb25zJyBoaWRlXG4gICAgc2V0U3R5bGUgJy5icm93c2VyUm93LmZpbGUgLmV4dCcgJ2Rpc3BsYXknIGhpZGUgYW5kICdub25lJyBvciAnaW5pdGlhbCdcbiAgICBzZXRTdHlsZSAnLmZpbGVJbmZvRmlsZSAuZXh0JyAgICAnZGlzcGxheScgaGlkZSBhbmQgJ25vbmUnIG9yICdpbml0aWFsJ1xuXG53aW5NYWluKClcbiJdfQ==
//# sourceURL=../coffee/window.coffee