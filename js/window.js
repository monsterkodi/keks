// koffee 1.4.0

/*
000   000  000  000   000  0000000     0000000   000   000
000 0 000  000  0000  000  000   000  000   000  000 0 000
000000000  000  000 0 000  000   000  000   000  000000000
000   000  000  000  0000  000   000  000   000  000   000
00     00  000  000   000  0000000     0000000   00     00
 */
var $, Browser, FileBrowser, _, args, dialog, electron, klog, onCombo, onMenuAction, pkg, post, ref, remote, scheme, slash, stopEvent, w, win, winID, winMain;

ref = require('kxk'), post = ref.post, args = ref.args, slash = ref.slash, stopEvent = ref.stopEvent, scheme = ref.scheme, klog = ref.klog, win = ref.win, $ = ref.$, _ = ref._;

FileBrowser = require('./filebrowser');

w = new win({
    dir: __dirname,
    pkg: require('../package.json'),
    menu: '../coffee/menu.noon',
    icon: '../img/menu@2x.png',
    prefsSeperator: '▸'
});

electron = require('electron');

pkg = require('../package.json');

remote = electron.remote;

dialog = remote.dialog;

Browser = remote.BrowserWindow;

win = window.win = remote.getCurrentWindow();

winID = window.winID = win.id;

winMain = function() {
    var fileBrowser;
    klog('win main');
    fileBrowser = new FileBrowser($("#main"));
    return fileBrowser.loadItem({
        type: 'dir',
        file: slash.resolve('~')
    });
};

window.onload = function() {
    return klog('win onload');
};

onMenuAction = function(name, args) {
    switch (name) {
        case 'Undo':
            return window.focusEditor["do"].undo();
        case 'Redo':
            return window.focusEditor["do"].redo();
        case 'Cut':
            return window.focusEditor.cut();
        case 'Copy':
            return window.focusEditor.copy();
        case 'Paste':
            return window.focusEditor.paste();
        case 'New Window':
            return post.toMain('newWindowWithFile', editor.currentFile);
        case 'Increase':
            return changeFontSize(+1);
        case 'Decrease':
            return changeFontSize(-1);
        case 'Reset':
            return resetFontSize();
        case 'Add to Shelf':
            return addToShelf();
        case 'Reload Window':
            return reloadWin();
    }
    return post.toMain('menuAction', name, args);
};

post.on('menuAction', onMenuAction);

onCombo = function(combo, info) {
    var char, event, key, mod;
    if (!combo) {
        return;
    }
    mod = info.mod, key = info.key, combo = info.combo, char = info.char, event = info.event;
    switch (combo) {
        case 'f3':
            return stopEvent(event, screenShot());
    }
};

post.on('combo', onCombo);

winMain();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUE0RCxPQUFBLENBQVEsS0FBUixDQUE1RCxFQUFFLGVBQUYsRUFBUSxlQUFSLEVBQWMsaUJBQWQsRUFBcUIseUJBQXJCLEVBQWdDLG1CQUFoQyxFQUF3QyxlQUF4QyxFQUE4QyxhQUE5QyxFQUFtRCxTQUFuRCxFQUFzRDs7QUFFdEQsV0FBQSxHQUFjLE9BQUEsQ0FBUSxlQUFSOztBQUVkLENBQUEsR0FBSSxJQUFJLEdBQUosQ0FDQTtJQUFBLEdBQUEsRUFBUSxTQUFSO0lBQ0EsR0FBQSxFQUFRLE9BQUEsQ0FBUSxpQkFBUixDQURSO0lBRUEsSUFBQSxFQUFRLHFCQUZSO0lBR0EsSUFBQSxFQUFRLG9CQUhSO0lBSUEsY0FBQSxFQUFnQixHQUpoQjtDQURBOztBQU9KLFFBQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7QUFDWCxHQUFBLEdBQVcsT0FBQSxDQUFRLGlCQUFSOztBQUVYLE1BQUEsR0FBVyxRQUFRLENBQUM7O0FBQ3BCLE1BQUEsR0FBVyxNQUFNLENBQUM7O0FBQ2xCLE9BQUEsR0FBVyxNQUFNLENBQUM7O0FBQ2xCLEdBQUEsR0FBVyxNQUFNLENBQUMsR0FBUCxHQUFlLE1BQU0sQ0FBQyxnQkFBUCxDQUFBOztBQUMxQixLQUFBLEdBQVcsTUFBTSxDQUFDLEtBQVAsR0FBZSxHQUFHLENBQUM7O0FBUTlCLE9BQUEsR0FBVSxTQUFBO0FBRU4sUUFBQTtJQUFBLElBQUEsQ0FBSyxVQUFMO0lBRUEsV0FBQSxHQUFjLElBQUksV0FBSixDQUFnQixDQUFBLENBQUUsT0FBRixDQUFoQjtXQUNkLFdBQVcsQ0FBQyxRQUFaLENBQXFCO1FBQUEsSUFBQSxFQUFLLEtBQUw7UUFBVyxJQUFBLEVBQUssS0FBSyxDQUFDLE9BQU4sQ0FBYyxHQUFkLENBQWhCO0tBQXJCO0FBTE07O0FBU1YsTUFBTSxDQUFDLE1BQVAsR0FBZ0IsU0FBQTtXQUFHLElBQUEsQ0FBSyxZQUFMO0FBQUg7O0FBUWhCLFlBQUEsR0FBZSxTQUFDLElBQUQsRUFBTyxJQUFQO0FBRVgsWUFBTyxJQUFQO0FBQUEsYUFFUyxNQUZUO0FBRXNDLG1CQUFPLE1BQU0sQ0FBQyxXQUFXLEVBQUMsRUFBRCxFQUFHLENBQUMsSUFBdEIsQ0FBQTtBQUY3QyxhQUdTLE1BSFQ7QUFHc0MsbUJBQU8sTUFBTSxDQUFDLFdBQVcsRUFBQyxFQUFELEVBQUcsQ0FBQyxJQUF0QixDQUFBO0FBSDdDLGFBSVMsS0FKVDtBQUlzQyxtQkFBTyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQW5CLENBQUE7QUFKN0MsYUFLUyxNQUxUO0FBS3NDLG1CQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBbkIsQ0FBQTtBQUw3QyxhQU1TLE9BTlQ7QUFNc0MsbUJBQU8sTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFuQixDQUFBO0FBTjdDLGFBT1MsWUFQVDtBQU9zQyxtQkFBTyxJQUFJLENBQUMsTUFBTCxDQUFZLG1CQUFaLEVBQWlDLE1BQU0sQ0FBQyxXQUF4QztBQVA3QyxhQVNTLFVBVFQ7QUFTc0MsbUJBQU8sY0FBQSxDQUFlLENBQUMsQ0FBaEI7QUFUN0MsYUFVUyxVQVZUO0FBVXNDLG1CQUFPLGNBQUEsQ0FBZSxDQUFDLENBQWhCO0FBVjdDLGFBV1MsT0FYVDtBQVdzQyxtQkFBTyxhQUFBLENBQUE7QUFYN0MsYUFZUyxjQVpUO0FBWXNDLG1CQUFPLFVBQUEsQ0FBQTtBQVo3QyxhQWFTLGVBYlQ7QUFhc0MsbUJBQU8sU0FBQSxDQUFBO0FBYjdDO1dBZUEsSUFBSSxDQUFDLE1BQUwsQ0FBWSxZQUFaLEVBQTBCLElBQTFCLEVBQWdDLElBQWhDO0FBakJXOztBQW1CZixJQUFJLENBQUMsRUFBTCxDQUFRLFlBQVIsRUFBcUIsWUFBckI7O0FBUUEsT0FBQSxHQUFVLFNBQUMsS0FBRCxFQUFRLElBQVI7QUFFTixRQUFBO0lBQUEsSUFBVSxDQUFJLEtBQWQ7QUFBQSxlQUFBOztJQUVFLGNBQUYsRUFBTyxjQUFQLEVBQVksa0JBQVosRUFBbUIsZ0JBQW5CLEVBQXlCO0FBR3pCLFlBQU8sS0FBUDtBQUFBLGFBQ1MsSUFEVDtBQUNtQyxtQkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixVQUFBLENBQUEsQ0FBakI7QUFEMUM7QUFQTTs7QUFhVixJQUFJLENBQUMsRUFBTCxDQUFRLE9BQVIsRUFBZ0IsT0FBaEI7O0FBRUEsT0FBQSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4wMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAgICAgIDAwXG4jIyNcblxueyBwb3N0LCBhcmdzLCBzbGFzaCwgc3RvcEV2ZW50LCBzY2hlbWUsIGtsb2csIHdpbiwgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5GaWxlQnJvd3NlciA9IHJlcXVpcmUgJy4vZmlsZWJyb3dzZXInXG4gIFxudyA9IG5ldyB3aW5cbiAgICBkaXI6ICAgIF9fZGlybmFtZVxuICAgIHBrZzogICAgcmVxdWlyZSAnLi4vcGFja2FnZS5qc29uJ1xuICAgIG1lbnU6ICAgJy4uL2NvZmZlZS9tZW51Lm5vb24nXG4gICAgaWNvbjogICAnLi4vaW1nL21lbnVAMngucG5nJ1xuICAgIHByZWZzU2VwZXJhdG9yOiAn4pa4J1xuXG5lbGVjdHJvbiA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xucGtnICAgICAgPSByZXF1aXJlICcuLi9wYWNrYWdlLmpzb24nXG5cbnJlbW90ZSAgID0gZWxlY3Ryb24ucmVtb3RlXG5kaWFsb2cgICA9IHJlbW90ZS5kaWFsb2dcbkJyb3dzZXIgID0gcmVtb3RlLkJyb3dzZXJXaW5kb3dcbndpbiAgICAgID0gd2luZG93LndpbiAgID0gcmVtb3RlLmdldEN1cnJlbnRXaW5kb3coKVxud2luSUQgICAgPSB3aW5kb3cud2luSUQgPSB3aW4uaWRcblxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4jIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbiMgMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG5cbndpbk1haW4gPSAtPiBcblxuICAgIGtsb2cgJ3dpbiBtYWluJ1xuICAgIFxuICAgIGZpbGVCcm93c2VyID0gbmV3IEZpbGVCcm93c2VyICQgXCIjbWFpblwiXG4gICAgZmlsZUJyb3dzZXIubG9hZEl0ZW0gdHlwZTonZGlyJyBmaWxlOnNsYXNoLnJlc29sdmUgJ34nXG4gICAgXG4gICAgIyBzY2hlbWUuc2V0IHByZWZzLmdldCAnc2NoZW1lJyAnZGFyaydcblxud2luZG93Lm9ubG9hZCA9IC0+IGtsb2cgJ3dpbiBvbmxvYWQnXG5cbiMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4jIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiMgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbm9uTWVudUFjdGlvbiA9IChuYW1lLCBhcmdzKSAtPlxuXG4gICAgc3dpdGNoIG5hbWVcblxuICAgICAgICB3aGVuICdVbmRvJyAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5kby51bmRvKClcbiAgICAgICAgd2hlbiAnUmVkbycgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuZG8ucmVkbygpXG4gICAgICAgIHdoZW4gJ0N1dCcgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmN1dCgpXG4gICAgICAgIHdoZW4gJ0NvcHknICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmNvcHkoKVxuICAgICAgICB3aGVuICdQYXN0ZScgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5wYXN0ZSgpXG4gICAgICAgIHdoZW4gJ05ldyBXaW5kb3cnICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC50b01haW4gJ25ld1dpbmRvd1dpdGhGaWxlJywgZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICMgd2hlbiAnVG9nZ2xlIFNjaGVtZScgICAgICAgICB0aGVuIHJldHVybiBzY2hlbWUudG9nZ2xlKClcbiAgICAgICAgd2hlbiAnSW5jcmVhc2UnICAgICAgICAgICAgICB0aGVuIHJldHVybiBjaGFuZ2VGb250U2l6ZSArMVxuICAgICAgICB3aGVuICdEZWNyZWFzZScgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIGNoYW5nZUZvbnRTaXplIC0xXG4gICAgICAgIHdoZW4gJ1Jlc2V0JyAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcmVzZXRGb250U2l6ZSgpXG4gICAgICAgIHdoZW4gJ0FkZCB0byBTaGVsZicgICAgICAgICAgdGhlbiByZXR1cm4gYWRkVG9TaGVsZigpXG4gICAgICAgIHdoZW4gJ1JlbG9hZCBXaW5kb3cnICAgICAgICAgdGhlbiByZXR1cm4gcmVsb2FkV2luKClcblxuICAgIHBvc3QudG9NYWluICdtZW51QWN0aW9uJywgbmFtZSwgYXJnc1xuXG5wb3N0Lm9uICdtZW51QWN0aW9uJyBvbk1lbnVBY3Rpb25cblxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMFxuIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwXG5cbm9uQ29tYm8gPSAoY29tYm8sIGluZm8pIC0+XG5cbiAgICByZXR1cm4gaWYgbm90IGNvbWJvXG5cbiAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQgfSA9IGluZm9cblxuXG4gICAgc3dpdGNoIGNvbWJvXG4gICAgICAgIHdoZW4gJ2YzJyAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBzY3JlZW5TaG90KClcbiAgICAgICAgIyB3aGVuICdjb21tYW5kK3NoaWZ0Kz0nICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGNoYW5nZVpvb20gKzFcbiAgICAgICAgIyB3aGVuICdjb21tYW5kK3NoaWZ0Ky0nICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGNoYW5nZVpvb20gLTFcbiAgICAgICAgIyB3aGVuICdjb21tYW5kK3NoaWZ0KzAnICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHJlc2V0Wm9vbSgpXG5cbnBvc3Qub24gJ2NvbWJvJyBvbkNvbWJvXG5cbndpbk1haW4oKVxuIl19
//# sourceURL=../coffee/window.coffee