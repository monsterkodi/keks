// koffee 1.4.0

/*
00     00  00000000  000   000  000   000
000   000  000       0000  000  000   000
000000000  0000000   000 0 000  000   000
000 0 000  000       000  0000  000   000
000   000  00000000  000   000   0000000
 */
var _, empty, filelist, keyinfo, klog, noon, os, post, ref, slash, template;

ref = require('kxk'), filelist = ref.filelist, keyinfo = ref.keyinfo, empty = ref.empty, klog = ref.klog, noon = ref.noon, post = ref.post, slash = ref.slash, os = ref.os, _ = ref._;

template = function(obj) {
    var item, menuOrAccel, text, tmpl;
    tmpl = [];
    for (text in obj) {
        menuOrAccel = obj[text];
        tmpl.push((function() {
            switch (false) {
                case !(empty(menuOrAccel) && text.startsWith('-')):
                    return {
                        text: ''
                    };
                case !_.isNumber(menuOrAccel):
                    return {
                        text: text,
                        accel: kstr(menuOrAccel)
                    };
                case !_.isString(menuOrAccel):
                    return {
                        text: text,
                        accel: keyinfo.convertCmdCtrl(menuOrAccel)
                    };
                case !empty(menuOrAccel):
                    return {
                        text: text,
                        accel: ''
                    };
                default:
                    if ((menuOrAccel.accel != null) || (menuOrAccel.command != null)) {
                        item = _.clone(menuOrAccel);
                        item.text = text;
                        return item;
                    } else {
                        return {
                            text: text,
                            menu: template(menuOrAccel)
                        };
                    }
            }
        })());
    }
    return tmpl;
};

module.exports = function() {
    var actionFile, actionFiles, actions, combo, editMenu, item, j, k, key, len, mainMenu, menu, menuAction, menuName, name, ref1, ref2, ref3, submenu, v, value, viewMenu;
    mainMenu = template(noon.load(__dirname + '../../../coffee/menu.noon'));
    viewMenu = {
        text: 'View',
        menu: [
            {
                text: 'Toggle Center Text',
                accel: 'ctrl+\\'
            }
        ]
    };
    editMenu = {
        text: 'Edit',
        menu: [
            {
                text: 'Undo',
                accel: 'ctrl+z'
            }, {
                text: 'Redo',
                accel: 'ctrl+shift+z'
            }, {
                text: ''
            }, {
                text: 'Cut',
                accel: 'ctrl+x'
            }, {
                text: 'Copy',
                accel: 'ctrl+c'
            }, {
                text: 'Paste',
                accel: 'ctrl+v'
            }, {
                text: ''
            }
        ]
    };
    actionFiles = filelist(slash.join(__dirname, '../editor/actions'));
    submenu = {
        Misc: []
    };
    for (j = 0, len = actionFiles.length; j < len; j++) {
        actionFile = actionFiles[j];
        if ((ref1 = slash.ext(actionFile)) !== 'js' && ref1 !== 'coffee') {
            continue;
        }
        actions = require(actionFile);
        for (key in actions) {
            value = actions[key];
            menuName = 'Misc';
            if (key === 'actions') {
                if (value['menu'] != null) {
                    menuName = value['menu'];
                    if (submenu[menuName] != null) {
                        submenu[menuName];
                    } else {
                        submenu[menuName] = [];
                    }
                }
                for (k in value) {
                    v = value[k];
                    if (v.name && v.combo) {
                        menuAction = function(c) {
                            return function(i, win) {
                                return post.toWin(win.id, 'menuAction', c);
                            };
                        };
                        combo = v.combo;
                        if (os.platform() !== 'darwin' && v.accel) {
                            combo = v.accel;
                        }
                        item = {
                            text: v.name,
                            accel: combo
                        };
                        if (v.menu != null) {
                            if (submenu[name = v.menu] != null) {
                                submenu[name];
                            } else {
                                submenu[name] = [];
                            }
                        }
                        if (v.separator) {
                            submenu[(ref2 = v.menu) != null ? ref2 : menuName].push({
                                text: ''
                            });
                        }
                        submenu[(ref3 = v.menu) != null ? ref3 : menuName].push(item);
                    }
                }
            }
        }
    }
    for (key in submenu) {
        menu = submenu[key];
        editMenu.menu.push({
            text: key,
            menu: menu
        });
    }
    return [mainMenu[0], editMenu, viewMenu, mainMenu[2]];
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBK0QsT0FBQSxDQUFRLEtBQVIsQ0FBL0QsRUFBRSx1QkFBRixFQUFZLHFCQUFaLEVBQXFCLGlCQUFyQixFQUE0QixlQUE1QixFQUFrQyxlQUFsQyxFQUF3QyxlQUF4QyxFQUE4QyxpQkFBOUMsRUFBcUQsV0FBckQsRUFBeUQ7O0FBRXpELFFBQUEsR0FBVyxTQUFDLEdBQUQ7QUFFUCxRQUFBO0lBQUEsSUFBQSxHQUFPO0FBQ1AsU0FBQSxXQUFBOztRQUNJLElBQUksQ0FBQyxJQUFMO0FBQVUsb0JBQUEsS0FBQTtBQUFBLHVCQUNELEtBQUEsQ0FBTSxXQUFOLENBQUEsSUFBdUIsSUFBSSxDQUFDLFVBQUwsQ0FBZ0IsR0FBaEIsRUFEdEI7MkJBRUY7d0JBQUEsSUFBQSxFQUFNLEVBQU47O0FBRkUsc0JBR0QsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxXQUFYLENBSEM7MkJBSUY7d0JBQUEsSUFBQSxFQUFLLElBQUw7d0JBQ0EsS0FBQSxFQUFNLElBQUEsQ0FBSyxXQUFMLENBRE47O0FBSkUsc0JBTUQsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxXQUFYLENBTkM7MkJBT0Y7d0JBQUEsSUFBQSxFQUFLLElBQUw7d0JBQ0EsS0FBQSxFQUFNLE9BQU8sQ0FBQyxjQUFSLENBQXVCLFdBQXZCLENBRE47O0FBUEUsc0JBU0QsS0FBQSxDQUFNLFdBQU4sQ0FUQzsyQkFVRjt3QkFBQSxJQUFBLEVBQUssSUFBTDt3QkFDQSxLQUFBLEVBQU8sRUFEUDs7QUFWRTtvQkFhRixJQUFHLDJCQUFBLElBQXNCLDZCQUF6Qjt3QkFDSSxJQUFBLEdBQU8sQ0FBQyxDQUFDLEtBQUYsQ0FBUSxXQUFSO3dCQUNQLElBQUksQ0FBQyxJQUFMLEdBQVk7K0JBQ1osS0FISjtxQkFBQSxNQUFBOytCQUtJOzRCQUFBLElBQUEsRUFBSyxJQUFMOzRC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ZjtTQUFuQjtBQURKO1dBR0EsQ0FBQyxRQUFTLENBQUEsQ0FBQSxDQUFWLEVBQWMsUUFBZCxFQUF3QixRQUF4QixFQUFrQyxRQUFTLENBQUEsQ0FBQSxDQUEzQztBQXREYSIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMFxuMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiMjI1xuXG57IGZpbGVsaXN0LCBrZXlpbmZvLCBlbXB0eSwga2xvZywgbm9vbiwgcG9zdCwgc2xhc2gsIG9zLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbnRlbXBsYXRlID0gKG9iaikgLT5cbiAgICBcbiAgICB0bXBsID0gW11cbiAgICBmb3IgdGV4dCxtZW51T3JBY2NlbCBvZiBvYmpcbiAgICAgICAgdG1wbC5wdXNoIHN3aXRjaFxuICAgICAgICAgICAgd2hlbiBlbXB0eShtZW51T3JBY2NlbCkgYW5kIHRleHQuc3RhcnRzV2l0aCAnLSdcbiAgICAgICAgICAgICAgICB0ZXh0OiAnJ1xuICAgICAgICAgICAgd2hlbiBfLmlzTnVtYmVyIG1lbnVPckFjY2VsXG4gICAgICAgICAgICAgICAgdGV4dDp0ZXh0XG4gICAgICAgICAgICAgICAgYWNjZWw6a3N0ciBtZW51T3JBY2NlbFxuICAgICAgICAgICAgd2hlbiBfLmlzU3RyaW5nIG1lbnVPckFjY2VsXG4gICAgICAgICAgICAgICAgdGV4dDp0ZXh0XG4gICAgICAgICAgICAgICAgYWNjZWw6a2V5aW5mby5jb252ZXJ0Q21kQ3RybCBtZW51T3JBY2NlbFxuICAgICAgICAgICAgd2hlbiBlbXB0eSBtZW51T3JBY2NlbFxuICAgICAgICAgICAgICAgIHRleHQ6dGV4dFxuICAgICAgICAgICAgICAgIGFjY2VsOiAnJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIG1lbnVPckFjY2VsLmFjY2VsPyBvciBtZW51T3JBY2NlbC5jb21tYW5kPyAjIG5lZWRzIGJldHRlciB0ZXN0IVxuICAgICAgICAgICAgICAgICAgICBpdGVtID0gXy5jbG9uZSBtZW51T3JBY2NlbFxuICAgICAgICAgICAgICAgICAgICBpdGVtLnRleHQgPSB0ZXh0XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6dGV4dFxuICAgICAgICAgICAgICAgICAgICBtZW51OnRlbXBsYXRlIG1lbnVPckFjY2VsXG4gICAgdG1wbFxuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG5cbiAgICBtYWluTWVudSA9IHRlbXBsYXRlIG5vb24ubG9hZCBfX2Rpcm5hbWUgKyAnLi4vLi4vLi4vY29mZmVlL21lbnUubm9vbidcblxuICAgIHZpZXdNZW51ID0gdGV4dDonVmlldycgbWVudTpbXG4gICAgICAgIHRleHQ6J1RvZ2dsZSBDZW50ZXIgVGV4dCcgIGFjY2VsOidjdHJsK1xcXFwnXG4gICAgXSAgICBcbiAgICBlZGl0TWVudSA9IHRleHQ6J0VkaXQnIG1lbnU6W1xuICAgICAgICB0ZXh0OidVbmRvJyAgYWNjZWw6J2N0cmwreidcbiAgICAsXG4gICAgICAgIHRleHQ6J1JlZG8nICBhY2NlbDonY3RybCtzaGlmdCt6J1xuICAgICxcbiAgICAgICAgdGV4dDonJyAgICAgXG4gICAgLFxuICAgICAgICB0ZXh0OidDdXQnICAgYWNjZWw6J2N0cmwreCdcbiAgICAsXG4gICAgICAgIHRleHQ6J0NvcHknICBhY2NlbDonY3RybCtjJ1xuICAgICxcbiAgICAgICAgdGV4dDonUGFzdGUnIGFjY2VsOidjdHJsK3YnXG4gICAgLFxuICAgICAgICB0ZXh0OicnICAgICBcbiAgICBdXG5cbiAgICBhY3Rpb25GaWxlcyA9IGZpbGVsaXN0IHNsYXNoLmpvaW4gX19kaXJuYW1lLCAnLi4vZWRpdG9yL2FjdGlvbnMnXG4gICAgc3VibWVudSA9IE1pc2M6IFtdXG5cbiAgICBmb3IgYWN0aW9uRmlsZSBpbiBhY3Rpb25GaWxlc1xuICAgICAgICBjb250aW51ZSBpZiBzbGFzaC5leHQoYWN0aW9uRmlsZSkgbm90IGluIFsnanMnICdjb2ZmZWUnXVxuICAgICAgICBhY3Rpb25zID0gcmVxdWlyZSBhY3Rpb25GaWxlXG4gICAgICAgIGZvciBrZXksdmFsdWUgb2YgYWN0aW9uc1xuICAgICAgICAgICAgbWVudU5hbWUgPSAnTWlzYydcbiAgICAgICAgICAgIGlmIGtleSA9PSAnYWN0aW9ucydcbiAgICAgICAgICAgICAgICBpZiB2YWx1ZVsnbWVudSddP1xuICAgICAgICAgICAgICAgICAgICBtZW51TmFtZSA9IHZhbHVlWydtZW51J11cbiAgICAgICAgICAgICAgICAgICAgc3VibWVudVttZW51TmFtZV0gPz0gW11cbiAgICAgICAgICAgICAgICBmb3Igayx2IG9mIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGlmIHYubmFtZSBhbmQgdi5jb21ib1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVudUFjdGlvbiA9IChjKSAtPiAoaSx3aW4pIC0+IHBvc3QudG9XaW4gd2luLmlkLCAnbWVudUFjdGlvbicsIGNcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbWJvID0gdi5jb21ib1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgb3MucGxhdGZvcm0oKSAhPSAnZGFyd2luJyBhbmQgdi5hY2NlbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbWJvID0gdi5hY2NlbFxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogICB2Lm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY2NlbDogIGNvbWJvXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB2Lm1lbnU/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VibWVudVt2Lm1lbnVdID89IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB2LnNlcGFyYXRvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Ym1lbnVbdi5tZW51ID8gbWVudU5hbWVdLnB1c2ggdGV4dDogJydcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Ym1lbnVbdi5tZW51ID8gbWVudU5hbWVdLnB1c2ggaXRlbVxuICAgICAgICAgICAgICAgICMgc3VibWVudVttZW51TmFtZV0ucHVzaCB0ZXh0OiAnJ1xuXG4gICAgZm9yIGtleSwgbWVudSBvZiBzdWJtZW51XG4gICAgICAgIGVkaXRNZW51Lm1lbnUucHVzaCB0ZXh0OmtleSwgbWVudTptZW51XG5cbiAgICBbbWFpbk1lbnVbMF0sIGVkaXRNZW51LCB2aWV3TWVudSwgbWFpbk1lbnVbMl1dXG5cbiJdfQ==
//# sourceURL=../../coffee/editor/menu.coffee