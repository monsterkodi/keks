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
    var actionFile, actionFiles, actions, combo, editMenu, item, j, k, key, len, mainMenu, menu, menuAction, menuName, name, ref1, ref2, ref3, submenu, v, value;
    mainMenu = template(noon.load(__dirname + '../../../coffee/menu.noon'));
    editMenu = {
        text: 'Edit',
        menu: []
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
                submenu[menuName].push({
                    text: ''
                });
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
    return [mainMenu[0], editMenu, mainMenu[2]];
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBK0QsT0FBQSxDQUFRLEtBQVIsQ0FBL0QsRUFBRSx1QkFBRixFQUFZLHFCQUFaLEVBQXFCLGlCQUFyQixFQUE0QixlQUE1QixFQUFrQyxlQUFsQyxFQUF3QyxlQUF4QyxFQUE4QyxpQkFBOUMsRUFBcUQsV0FBckQsRUFBeUQ7O0FBR3pELFFBQUEsR0FBVyxTQUFDLEdBQUQ7QUFFUCxRQUFBO0lBQUEsSUFBQSxHQUFPO0FBQ1AsU0FBQSxXQUFBOztRQUNJLElBQUksQ0FBQyxJQUFMO0FBQVUsb0JBQUEsS0FBQTtBQUFBLHVCQUNELEtBQUEsQ0FBTSxXQUFOLENBQUEsSUFBdUIsSUFBSSxDQUFDLFVBQUwsQ0FBZ0IsR0FBaEIsRUFEdEI7MkJBRUY7d0JBQUEsSUFBQSxFQUFNLEVBQU47O0FBRkUsc0JBR0QsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxXQUFYLENBSEM7MkJBSUY7d0JBQUEsSUFBQSxFQUFLLElBQUw7d0JBQ0EsS0FBQSxFQUFNLElBQUEsQ0FBSyxXQUFMLENBRE47O0FBSkUsc0JBTUQsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxXQUFYLENBTkM7MkJBT0Y7d0JBQUEsSUFBQSxFQUFLLElBQUw7d0JBQ0EsS0FBQSxFQUFNLE9BQU8sQ0FBQyxjQUFSLENBQXVCLFdBQXZCLENBRE47O0FBUEUsc0JBU0QsS0FBQSxDQUFNLFdBQU4sQ0FUQzsyQkFVRjt3QkFBQSxJQUFBLEVBQUssSUFBTDt3QkFDQSxLQUFBLEVBQU8sRUFEUDs7QUFWRTtvQkFhRixJQUFHLDJCQUFBLElBQXNCLDZCQUF6Qjt3QkFDSSxJQUFBLEdBQU8sQ0FBQyxDQUFDLEtBQUYsQ0FBUSxXQUFSO3dCQUNQLElBQUksQ0FBQyxJQUFMLEdBQVk7K0JBQ1osS0FISjtxQkFBQSxNQUFBOytCQUtJOzRCQUFBLElBQUEsRUFBSyxJQUFMOzRCQUNBLElBQUEsRUFBSyxRQUFBLENBQVMsV0FBVCxDQURMOzBCQUxKOztBQWJFO1lBQVY7QUFESjtXQXFCQTtBQXhCTzs7QUEwQlgsTUFBTSxDQUFDLE9BQVAsR0FBaUIsU0FBQTtBQUViLFFBQUE7SUFBQSxRQUFBLEdBQVcsUUFBQSxDQUFTLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBQSxHQUFZLDJCQUF0QixDQUFUO0lBRVgsUUFBQSxHQUFXO1FBQUEsSUFBQSxFQUFLLE1BQUw7UUFBWSxJQUFBLEVBQUssRUFBakI7O0lBRVgsV0FBQSxHQUFjLFFBQUEsQ0FBUyxLQUFLLENBQUMsSUFBTixDQUFXLFNBQVgsRUFBc0IsbUJBQXRCLENBQVQ7SUFDZCxPQUFBLEdBQVU7UUFBQSxJQUFBLEVBQU0sRUFBTjs7QUFFVixTQUFBLDZDQUFBOztRQUNJLFlBQVksS0FBSyxDQUFDLEdBQU4sQ0FBVSxVQUFWLEVBQUEsS0FBOEIsSUFBOUIsSUFBQSxJQUFBLEtBQW1DLFFBQS9DO0FBQUEscUJBQUE7O1FBQ0EsT0FBQSxHQUFVLE9BQUEsQ0FBUSxVQUFSO0FBQ1YsYUFBQSxjQUFBOztZQUNJLFFBQUEsR0FBVztZQUNYLElBQUcsR0FBQSxLQUFPLFNBQVY7Z0JBQ0ksSUFBRyxxQkFBSDtvQkFDSSxRQUFBLEdBQVcsS0FBTSxDQUFBLE1BQUE7O3dCQUNqQixPQUFRLENBQUEsUUFBQTs7d0JBQVIsT0FBUSxDQUFBLFFBQUEsSUFBYTtxQkFGekI7O0FBR0EscUJBQUEsVUFBQTs7b0JBQ0ksSUFBRyxDQUFDLENBQUMsSUFBRixJQUFXLENBQUMsQ0FBQyxLQUFoQjt3QkFDSSxVQUFBLEdBQWEsU0FBQyxDQUFEO21DQUFPLFNBQUMsQ0FBRCxFQUFHLEdBQUg7dUNBQVcsSUFBSSxDQUFDLEtBQUwsQ0FBVyxHQUFHLENBQUMsRUFBZixFQUFtQixZQUFuQixFQUFpQyxDQUFqQzs0QkFBWDt3QkFBUDt3QkFDYixLQUFBLEdBQVEsQ0FBQyxDQUFDO3dCQUNWLElBQUcsRUFBRSxDQUFDLFFBQUgsQ0FBQSxDQUFBLEtBQWlCLFFBQWpCLElBQThCLENBQUMsQ0FBQyxLQUFuQzs0QkFDSSxLQUFBLEdBQVEsQ0FBQyxDQUFDLE1BRGQ7O3dCQUVBLElBQUEsR0FDSTs0QkFBQSxJQUFBLEVBQVEsQ0FBQyxDQUFDLElBQVY7NEJBQ0EsS0FBQSxFQUFRLEtBRFI7O3dCQUVKLElBQUcsY0FBSDs7Z0NBQ0k7O2dDQUFBLGdCQUFtQjs2QkFEdkI7O3dCQUVBLElBQUcsQ0FBQyxDQUFDLFNBQUw7NEJBQ0ksT0FBUSxrQ0FBUyxRQUFULENBQWtCLENBQUMsSUFBM0IsQ0FBZ0M7Z0NBQUEsSUFBQSxFQUFNLEVBQU47NkJBQWhDLEVBREo7O3dCQUVBLE9BQVEsa0NBQVMsUUFBVCxDQUFrQixDQUFDLElBQTNCLENBQWdDLElBQWhDLEVBWko7O0FBREo7Z0JBY0EsT0FBUSxDQUFBLFFBQUEsQ0FBUyxDQUFDLElBQWxCLENBQXVCO29CQUFBLElBQUEsRUFBTSxFQUFOO2lCQUF2QixFQWxCSjs7QUFGSjtBQUhKO0FBeUJBLFNBQUEsY0FBQTs7UUFDSSxRQUFRLENBQUMsSUFBSSxDQUFDLElBQWQsQ0FBbUI7WUFBQSxJQUFBLEVBQUssR0FBTDtZQUFVLElBQUEsRUFBSyxJQUFmO1NBQW5CO0FBREo7V0FHQSxDQUFDLFFBQVMsQ0FBQSxDQUFBLENBQVYsRUFBYyxRQUFkLEVBQXdCLFFBQVMsQ0FBQSxDQUFBLENBQWpDO0FBckNhIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuIyMjXG5cbnsgZmlsZWxpc3QsIGtleWluZm8sIGVtcHR5LCBrbG9nLCBub29uLCBwb3N0LCBzbGFzaCwgb3MsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuXG50ZW1wbGF0ZSA9IChvYmopIC0+XG4gICAgXG4gICAgdG1wbCA9IFtdXG4gICAgZm9yIHRleHQsbWVudU9yQWNjZWwgb2Ygb2JqXG4gICAgICAgIHRtcGwucHVzaCBzd2l0Y2hcbiAgICAgICAgICAgIHdoZW4gZW1wdHkobWVudU9yQWNjZWwpIGFuZCB0ZXh0LnN0YXJ0c1dpdGggJy0nXG4gICAgICAgICAgICAgICAgdGV4dDogJydcbiAgICAgICAgICAgIHdoZW4gXy5pc051bWJlciBtZW51T3JBY2NlbFxuICAgICAgICAgICAgICAgIHRleHQ6dGV4dFxuICAgICAgICAgICAgICAgIGFjY2VsOmtzdHIgbWVudU9yQWNjZWxcbiAgICAgICAgICAgIHdoZW4gXy5pc1N0cmluZyBtZW51T3JBY2NlbFxuICAgICAgICAgICAgICAgIHRleHQ6dGV4dFxuICAgICAgICAgICAgICAgIGFjY2VsOmtleWluZm8uY29udmVydENtZEN0cmwgbWVudU9yQWNjZWxcbiAgICAgICAgICAgIHdoZW4gZW1wdHkgbWVudU9yQWNjZWxcbiAgICAgICAgICAgICAgICB0ZXh0OnRleHRcbiAgICAgICAgICAgICAgICBhY2NlbDogJydcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBtZW51T3JBY2NlbC5hY2NlbD8gb3IgbWVudU9yQWNjZWwuY29tbWFuZD8gIyBuZWVkcyBiZXR0ZXIgdGVzdCFcbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9IF8uY2xvbmUgbWVudU9yQWNjZWxcbiAgICAgICAgICAgICAgICAgICAgaXRlbS50ZXh0ID0gdGV4dFxuICAgICAgICAgICAgICAgICAgICBpdGVtXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB0ZXh0OnRleHRcbiAgICAgICAgICAgICAgICAgICAgbWVudTp0ZW1wbGF0ZSBtZW51T3JBY2NlbFxuICAgIHRtcGxcblxubW9kdWxlLmV4cG9ydHMgPSAtPlxuXG4gICAgbWFpbk1lbnUgPSB0ZW1wbGF0ZSBub29uLmxvYWQgX19kaXJuYW1lICsgJy4uLy4uLy4uL2NvZmZlZS9tZW51Lm5vb24nXG4gICAgXG4gICAgZWRpdE1lbnUgPSB0ZXh0OidFZGl0JyBtZW51OltdXG5cbiAgICBhY3Rpb25GaWxlcyA9IGZpbGVsaXN0IHNsYXNoLmpvaW4gX19kaXJuYW1lLCAnLi4vZWRpdG9yL2FjdGlvbnMnXG4gICAgc3VibWVudSA9IE1pc2M6IFtdXG5cbiAgICBmb3IgYWN0aW9uRmlsZSBpbiBhY3Rpb25GaWxlc1xuICAgICAgICBjb250aW51ZSBpZiBzbGFzaC5leHQoYWN0aW9uRmlsZSkgbm90IGluIFsnanMnICdjb2ZmZWUnXVxuICAgICAgICBhY3Rpb25zID0gcmVxdWlyZSBhY3Rpb25GaWxlXG4gICAgICAgIGZvciBrZXksdmFsdWUgb2YgYWN0aW9uc1xuICAgICAgICAgICAgbWVudU5hbWUgPSAnTWlzYydcbiAgICAgICAgICAgIGlmIGtleSA9PSAnYWN0aW9ucydcbiAgICAgICAgICAgICAgICBpZiB2YWx1ZVsnbWVudSddP1xuICAgICAgICAgICAgICAgICAgICBtZW51TmFtZSA9IHZhbHVlWydtZW51J11cbiAgICAgICAgICAgICAgICAgICAgc3VibWVudVttZW51TmFtZV0gPz0gW11cbiAgICAgICAgICAgICAgICBmb3Igayx2IG9mIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGlmIHYubmFtZSBhbmQgdi5jb21ib1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVudUFjdGlvbiA9IChjKSAtPiAoaSx3aW4pIC0+IHBvc3QudG9XaW4gd2luLmlkLCAnbWVudUFjdGlvbicsIGNcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbWJvID0gdi5jb21ib1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgb3MucGxhdGZvcm0oKSAhPSAnZGFyd2luJyBhbmQgdi5hY2NlbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbWJvID0gdi5hY2NlbFxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogICB2Lm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY2NlbDogIGNvbWJvXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB2Lm1lbnU/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VibWVudVt2Lm1lbnVdID89IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB2LnNlcGFyYXRvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Ym1lbnVbdi5tZW51ID8gbWVudU5hbWVdLnB1c2ggdGV4dDogJydcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Ym1lbnVbdi5tZW51ID8gbWVudU5hbWVdLnB1c2ggaXRlbVxuICAgICAgICAgICAgICAgIHN1Ym1lbnVbbWVudU5hbWVdLnB1c2ggdGV4dDogJydcblxuICAgIGZvciBrZXksIG1lbnUgb2Ygc3VibWVudVxuICAgICAgICBlZGl0TWVudS5tZW51LnB1c2ggdGV4dDprZXksIG1lbnU6bWVudVxuXG4gICAgW21haW5NZW51WzBdLCBlZGl0TWVudSwgbWFpbk1lbnVbMl1dXG5cbiJdfQ==
//# sourceURL=../../coffee/editor/menu.coffee