// koffee 1.4.0

/*
000   000  000  000   000  0000000     0000000   000   000
000 0 000  000  0000  000  000   000  000   000  000 0 000
000000000  000  000 0 000  000   000  000   000  000000000
000   000  000  000  0000  000   000  000   000  000   000
00     00  000  000   000  0000000     0000000   00     00
 */
var $, Browser, FileBrowser, _, args, changeFontSize, clamp, defaultFontSize, dialog, electron, fileBrowser, getFontSize, hideExtensions, klog, kpos, onContextMenu, onMenuAction, onWheel, pkg, popup, post, prefs, ref, remote, resetFontSize, scheme, setFontSize, setStyle, slash, stopEvent, toggleExtensions, w, win, winID, winMain;

ref = require('kxk'), post = ref.post, args = ref.args, slash = ref.slash, prefs = ref.prefs, stopEvent = ref.stopEvent, setStyle = ref.setStyle, scheme = ref.scheme, popup = ref.popup, klog = ref.klog, clamp = ref.clamp, kpos = ref.kpos, win = ref.win, $ = ref.$, _ = ref._;

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

electron = require('electron');

pkg = require('../package.json');

remote = electron.remote;

dialog = remote.dialog;

Browser = remote.BrowserWindow;

win = window.win = remote.getCurrentWindow();

winID = window.winID = win.id;

fileBrowser = null;

winMain = function() {
    var active, load;
    fileBrowser = new FileBrowser($("#main"));
    if (args.folder[0]) {
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
    win.on('resize', function() {
        return fileBrowser.resized();
    });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUFpRyxPQUFBLENBQVEsS0FBUixDQUFqRyxFQUFFLGVBQUYsRUFBUSxlQUFSLEVBQWMsaUJBQWQsRUFBcUIsaUJBQXJCLEVBQTRCLHlCQUE1QixFQUF1Qyx1QkFBdkMsRUFBaUQsbUJBQWpELEVBQXlELGlCQUF6RCxFQUFnRSxlQUFoRSxFQUFzRSxpQkFBdEUsRUFBNkUsZUFBN0UsRUFBbUYsYUFBbkYsRUFBd0YsU0FBeEYsRUFBMkY7O0FBRTNGLFdBQUEsR0FBYyxPQUFBLENBQVEsZUFBUjs7QUFFZCxDQUFBLEdBQUksSUFBSSxHQUFKLENBQ0E7SUFBQSxHQUFBLEVBQVEsU0FBUjtJQUNBLEdBQUEsRUFBUSxPQUFBLENBQVEsaUJBQVIsQ0FEUjtJQUVBLElBQUEsRUFBUSxxQkFGUjtJQUdBLElBQUEsRUFBUSxvQkFIUjtJQUlBLGNBQUEsRUFBZ0IsR0FKaEI7SUFLQSxPQUFBLEVBQVMsS0FMVDtJQU1BLFFBQUEsRUFBVSxDQUFBLENBQUUsU0FBRixDQU5WO0NBREE7O0FBU0osUUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUNYLEdBQUEsR0FBVyxPQUFBLENBQVEsaUJBQVI7O0FBRVgsTUFBQSxHQUFXLFFBQVEsQ0FBQzs7QUFDcEIsTUFBQSxHQUFXLE1BQU0sQ0FBQzs7QUFDbEIsT0FBQSxHQUFXLE1BQU0sQ0FBQzs7QUFDbEIsR0FBQSxHQUFXLE1BQU0sQ0FBQyxHQUFQLEdBQWUsTUFBTSxDQUFDLGdCQUFQLENBQUE7O0FBQzFCLEtBQUEsR0FBVyxNQUFNLENBQUMsS0FBUCxHQUFlLEdBQUcsQ0FBQzs7QUFDOUIsV0FBQSxHQUFjOztBQVFkLE9BQUEsR0FBVSxTQUFBO0FBRU4sUUFBQTtJQUFBLFdBQUEsR0FBYyxJQUFJLFdBQUosQ0FBZ0IsQ0FBQSxDQUFFLE9BQUYsQ0FBaEI7SUFF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QTtRQUdJLElBQUksQ0FBQyxLQUFMLEdBQWEsSUFBSSxDQUFDLElBQUksQ0FBQztRQUN2QixJQUFJLENBQUMsSUFBTCxHQUFhLElBQUksQ0FBQyxJQUFJLENBQUMsS0FKM0I7O1dBS0EsS0FBSyxDQUFDLEdBQU4sQ0FBVSxNQUFWLEVBQWlCLElBQWpCO0FBUlcsQ0FBZjs7QUFVQSxnQkFBQSxHQUFtQixTQUFBO1dBQUcsS0FBSyxDQUFDLE1BQU4sQ0FBYSx3QkFBYixFQUFzQyxjQUF0QztBQUFIOztBQUNuQixjQUFBLEdBQWlCLFNBQUMsSUFBRDs7UUFBQyxPQUFLOztJQUduQixRQUFBLENBQVMsdUJBQVQsRUFBaUMsU0FBakMsRUFBMkMsSUFBQSxJQUFTLE1BQVQsSUFBbUIsU0FBOUQ7V0FDQSxRQUFBLENBQVMsb0JBQVQsRUFBaUMsU0FBakMsRUFBMkMsSUFBQSxJQUFTLE1BQVQsSUFBbUIsU0FBOUQ7QUFKYTs7QUFNakIsT0FBQSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4wMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAgICAgIDAwXG4jIyNcblxueyBwb3N0LCBhcmdzLCBzbGFzaCwgcHJlZnMsIHN0b3BFdmVudCwgc2V0U3R5bGUsIHNjaGVtZSwgcG9wdXAsIGtsb2csIGNsYW1wLCBrcG9zLCB3aW4sICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuRmlsZUJyb3dzZXIgPSByZXF1aXJlICcuL2ZpbGVicm93c2VyJ1xuICBcbncgPSBuZXcgd2luXG4gICAgZGlyOiAgICBfX2Rpcm5hbWVcbiAgICBwa2c6ICAgIHJlcXVpcmUgJy4uL3BhY2thZ2UuanNvbidcbiAgICBtZW51OiAgICcuLi9jb2ZmZWUvbWVudS5ub29uJ1xuICAgIGljb246ICAgJy4uL2ltZy9tZW51QDJ4LnBuZydcbiAgICBwcmVmc1NlcGVyYXRvcjogJ+KWuCdcbiAgICBjb250ZXh0OiBmYWxzZVxuICAgIGRyYWdFbGVtOiAkICcjY3J1bWJzJ1xuICAgIFxuZWxlY3Ryb24gPSByZXF1aXJlICdlbGVjdHJvbidcbnBrZyAgICAgID0gcmVxdWlyZSAnLi4vcGFja2FnZS5qc29uJ1xuXG5yZW1vdGUgICA9IGVsZWN0cm9uLnJlbW90ZVxuZGlhbG9nICAgPSByZW1vdGUuZGlhbG9nXG5Ccm93c2VyICA9IHJlbW90ZS5Ccm93c2VyV2luZG93XG53aW4gICAgICA9IHdpbmRvdy53aW4gICA9IHJlbW90ZS5nZXRDdXJyZW50V2luZG93KClcbndpbklEICAgID0gd2luZG93LndpbklEID0gd2luLmlkXG5maWxlQnJvd3NlciA9IG51bGxcblxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4jIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbiMgMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG5cbndpbk1haW4gPSAtPlxuXG4gICAgZmlsZUJyb3dzZXIgPSBuZXcgRmlsZUJyb3dzZXIgJCBcIiNtYWluXCJcbiAgICBcbiAgICBpZiBhcmdzLmZvbGRlclswXVxuICAgICAgICBmaWxlQnJvd3Nlci5icm93c2UgYXJncy5mb2xkZXJbMF1cbiAgICBlbHNlXG4gICAgICAgIGlmIGxvYWQgPSBwcmVmcy5nZXQgJ2xvYWQnXG4gICAgICAgICAgICBpZiBsb2FkLmxhc3QgIT0gbG9hZC5maXJzdFxuICAgICAgICAgICAgICAgIGFjdGl2ZSA9IGxvYWQubGFzdFtsb2FkLmZpcnN0Lmxlbmd0aC4uXVxuICAgICAgICAgICAgICAgIGFjdGl2ZSA9IGxvYWQuZmlyc3QgKyAnLycgKyBzbGFzaC5zcGxpdChhY3RpdmUpWzBdXG4gICAgICAgICAgICBmaWxlQnJvd3Nlci5icm93c2UgbG9hZC5maXJzdCwgYWN0aXZlOmFjdGl2ZSwgY2I6IC0+XG4gICAgICAgICAgICAgICAgZmlsZUJyb3dzZXIubmF2aWdhdGVUb0ZpbGUgbG9hZC5sYXN0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZpbGVCcm93c2VyLmJyb3dzZSAnfidcbiAgICBcbiAgICB3aW4ub24gJ3Jlc2l6ZScgLT4gZmlsZUJyb3dzZXIucmVzaXplZCgpXG4gICAgXG4gICAgcHJlZnMuYXBwbHkgJ2Jyb3dzZXLilrhoaWRlRXh0ZW5zaW9ucycgaGlkZUV4dGVuc2lvbnNcbiAgICBcbiMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwXG4jIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwXG5cbm9uQ29udGV4dE1lbnUgPSAoZXZlbnQpIC0+IFxuICAgIFxuICAgIHJldHVybiBpZiBub3QgZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyAnY3J1bWInXG4gICAgXG4gICAgZmlsZUJyb3dzZXIuY29sdW1uc1tldmVudC50YXJnZXQuY29sdW1uSW5kZXhdLm9uQ29udGV4dE1lbnUgZXZlbnQsIHRydWVcbiAgICBcbiQoXCIjY3J1bWJzXCIpLmFkZEV2ZW50TGlzdGVuZXIgJ2NvbnRleHRtZW51JyBvbkNvbnRleHRNZW51XG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuZGVmYXVsdEZvbnRTaXplID0gMThcblxuZ2V0Rm9udFNpemUgPSAtPiBwcmVmcy5nZXQgJ2ZvbnRTaXplJyBkZWZhdWx0Rm9udFNpemVcblxuc2V0Rm9udFNpemUgPSAocykgLT5cbiAgICAgICAgXG4gICAgcyA9IGdldEZvbnRTaXplKCkgaWYgbm90IF8uaXNGaW5pdGUgc1xuICAgIHMgPSBjbGFtcCA4IDQ0IHNcblxuICAgIHByZWZzLnNldCAnZm9udFNpemUnIHNcblxuICAgIHNldFN0eWxlICcjbWFpbicgICAgICAgICAnZm9udC1zaXplJyBcIiN7c31weFwiXG4gICAgc2V0U3R5bGUgJy5yb3dOYW1lSW5wdXQnICdmb250LXNpemUnIFwiI3tzfXB4XCJcblxuY2hhbmdlRm9udFNpemUgPSAoZCkgLT5cbiAgICBcbiAgICBzID0gZ2V0Rm9udFNpemUoKVxuICAgIGlmICAgICAgcyA+PSAzMCB0aGVuIGYgPSA0XG4gICAgZWxzZSBpZiBzID49IDIwIHRoZW4gZiA9IDJcbiAgICBlbHNlICAgICAgICAgICAgICAgICBmID0gMVxuICAgICAgICBcbiAgICBzZXRGb250U2l6ZSBzICsgZipkXG5cbnJlc2V0Rm9udFNpemUgPSAtPlxuICAgIFxuICAgIHByZWZzLnNldCAnZm9udFNpemUnIGRlZmF1bHRGb250U2l6ZVxuICAgIHNldEZvbnRTaXplIGRlZmF1bHRGb250U2l6ZVxuICAgICBcbm9uV2hlZWwgPSAoZXZlbnQpIC0+XG4gICAgXG4gICAgaWYgMCA8PSB3Lm1vZGlmaWVycy5pbmRleE9mICdjdHJsJ1xuICAgICAgICBjaGFuZ2VGb250U2l6ZSAtZXZlbnQuZGVsdGFZLzEwMFxuICBcbnNldEZvbnRTaXplIGdldEZvbnRTaXplKClcbndpbmRvdy5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyICd3aGVlbCcgb25XaGVlbCAgICBcblxuIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxub25NZW51QWN0aW9uID0gKG5hbWUsIGFyZ3MpIC0+XG5cbiAgICBpZiBub3QgZmlsZUJyb3dzZXIudmlld2VyXG4gICAgICAgIHN3aXRjaCBuYW1lXG4gICAgICAgICAgICB3aGVuICdUb2dnbGUgRXh0ZW5zaW9ucycgdGhlbiByZXR1cm4gdG9nZ2xlRXh0ZW5zaW9ucygpXG4gICAgICAgICAgICB3aGVuICdJbmNyZWFzZScgICAgICAgICAgdGhlbiByZXR1cm4gY2hhbmdlRm9udFNpemUgKzFcbiAgICAgICAgICAgIHdoZW4gJ0RlY3JlYXNlJyAgICAgICAgICB0aGVuIHJldHVybiBjaGFuZ2VGb250U2l6ZSAtMVxuICAgICAgICAgICAgd2hlbiAnUmVzZXQnICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHJlc2V0Rm9udFNpemUoKVxuICAgICAgICAgICAgd2hlbiAnUmVmcmVzaCcgICAgICAgICAgIHRoZW4gcmV0dXJuIGZpbGVCcm93c2VyLnJlZnJlc2goKVxuICAgIFxuICAgIHN3aXRjaCBuYW1lXG5cbiAgICAgICAgd2hlbiAnQWRkIHRvIFNoZWxmJyAgICAgIHRoZW4gcmV0dXJuIGFkZFRvU2hlbGYoKVxuICAgICAgICB3aGVuICdGb2N1cyBTaGVsZicgICAgICAgdGhlbiByZXR1cm4gJCgnc2hlbGYnKT8uZm9jdXM/KClcbiAgICAgICAgd2hlbiAnUmVsb2FkIFdpbmRvdycgICAgIHRoZW4gcmV0dXJuIHJlbG9hZFdpbigpXG4gICAgICAgIHdoZW4gJ1RvZ2dsZSBTaGVsZicgICAgICB0aGVuIHJldHVybiBmaWxlQnJvd3Nlci50b2dnbGVTaGVsZigpXG4gICAgICAgIFxuICAgICMga2xvZyAnbWVudUFjdGlvbicgbmFtZVxuICAgIHBvc3QudG9NYWluICdtZW51QWN0aW9uJyBuYW1lLCBhcmdzXG5cbnBvc3Qub24gJ21lbnVBY3Rpb24nIG9uTWVudUFjdGlvblxucG9zdC5vbiAnbG9hZCcgKGluZm8pIC0+XG4gICAgXG4gICAgbG9hZCA9IHByZWZzLmdldCAnbG9hZCcge31cbiAgICBpZiBpbmZvLmNvbHVtblxuICAgICAgICBsb2FkLmxhc3QgPSBpbmZvLml0ZW0uZmlsZVxuICAgIGVsc2VcbiAgICAgICAgbG9hZC5maXJzdCA9IGluZm8uaXRlbS5maWxlXG4gICAgICAgIGxvYWQubGFzdCAgPSBpbmZvLml0ZW0uZmlsZVxuICAgIHByZWZzLnNldCAnbG9hZCcgbG9hZFxuXG50b2dnbGVFeHRlbnNpb25zID0gLT4gcHJlZnMudG9nZ2xlICdicm93c2Vy4pa4aGlkZUV4dGVuc2lvbnMnIGhpZGVFeHRlbnNpb25zXG5oaWRlRXh0ZW5zaW9ucyA9IChoaWRlPXRydWUpIC0+XG5cbiAgICAjIGtsb2cgJ2hpZGVFeHRlbnNpb25zJyBoaWRlXG4gICAgc2V0U3R5bGUgJy5icm93c2VyUm93LmZpbGUgLmV4dCcgJ2Rpc3BsYXknIGhpZGUgYW5kICdub25lJyBvciAnaW5pdGlhbCdcbiAgICBzZXRTdHlsZSAnLmZpbGVJbmZvRmlsZSAuZXh0JyAgICAnZGlzcGxheScgaGlkZSBhbmQgJ25vbmUnIG9yICdpbml0aWFsJ1xuXG53aW5NYWluKClcbiJdfQ==
//# sourceURL=../coffee/window.coffee