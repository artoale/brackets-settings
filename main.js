/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets */

/** Simple extension that demonstrate the usage of brackets-settings */
define(function (require, exports, module) {
    "use strict";

    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus = brackets.getModule("command/Menus"),
        AppInit = brackets.getModule("utils/AppInit"),
        Settings = require("lib/settings");



    var SETTINGS_DEMO_COMMAND_ID = "brackets.settings.demo.show";
    var settings;


    AppInit.appReady(function () {

        CommandManager.register("Show demo settings", SETTINGS_DEMO_COMMAND_ID, function () {
            settings.show().then(function () {
                console.log('Settings:', settings.getAll());
            });
        });



        settings = new Settings('brackets.settings.demo', [{
                type: 'text',
                title: 'This plugin uses brackets-settings to manage user-configurable settings. Here you can see a set of examples',
            },{
                type: 'separator',
            },{
                type: 'input',
                name: 'a_text',
                title: 'A simple text input',
                default: 'Some value'
            },{
                type: 'input',
                name: 'a_number',
                title: 'A text with number validation',
                default: 1234,
                validator: function (value, $input) {
                    var val = parseInt(value, 10);
                    if (!isNaN(val)) {
                        $input.val(val);
                        return true;
                    }
                    return false;
                },
            },{
                type: 'boolean',
                name: 'a_flag',
                title: 'Enable this feature',
                default: true,
            },{
                type: 'input',
                name: 'executable',
                title: 'Absolute path to karma executable',
                default: '/usr/local/bin/karma'
            },{
                type: 'select',
                name: 'a_select',
                title: 'Pick your choice',
                options: [{
                    title: 'This could be one',
                    value: 'one'
                }, {
                    title: 'This is the default choice',
                    value: 'two',
                    default: true
                }, {
                    title: 'Yet another option',
                    value: 'three'
                }]
            }], 'Demo');

        var menu = Menus.getMenu(Menus.AppMenuBar.HELP_MENU);

        menu.addMenuItem(SETTINGS_DEMO_COMMAND_ID);

    });
});
