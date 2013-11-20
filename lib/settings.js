/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, Mustache */

define(function (require, exports, module) {
    "use strict";

    var PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        Dialogs = brackets.getModule("widgets/Dialogs"),
        settingsTemplate = require('text!htmlContent/settings.html');


    /**
     * List of supported "types" used inside Mustache template
     * to decide which control to render
     **/
    var SUPPORTED_TYPES = [
        'boolean',
        'input',
        'select',
        'separator',
        'text'
    ];

    
    /**    
     * Utility function to build type checker for Mustache    
     * @param {string} something a supported type
     * @returns {function}  function for checking against this type
     */
    var isSomething = function (something) {
        return function () {
            return this.type === something;
        };
    };

    var checkers = SUPPORTED_TYPES.reduce(function (previous, current) {
        previous[current] = isSomething(current);
        return previous;
    }, {});

    /**
     * @constructor
     *
     * Utility class that support the creation and handling
     * of extension settings
     *
     * @param {string} id The preference manager storage id (a namespaced string identifying your extension)
     * @param {object} config An object describing the settings you want to control
     * @param {string=} title The extension name, used inside the UI modal dialog
     */
    var Settings = function (id, config, title) {
        this.id = id.replace(/[.#>?]/g, '-');
        this.config = config;
        this.title = title || id.replace(/\W/g, ' ');
        this.storage = PreferencesManager.getPreferenceStorage(id, this._getDefaults());
        this.load();
    };


    /**
     * Display the setting dialog
     *
     * @returns {$.Promise} A promise that get resolved when the modal dialog is closed
     **/
    Settings.prototype.show = function () {
        var self = this;
        this.template = this._render(settingsTemplate, {
            settings: this._getView(),
            title: self.title,
            id: self.id
        });
        var dialog = Dialogs.showModalDialogUsingTemplate(this.template);
        dialog.done(function (retval) {
            this._clearHandlers(dialog.getElement());
            if (retval === 'save') {
                this._handleSave(dialog.getElement());
            }
        }.bind(this));
        this._registerHandlers(dialog.getElement());
        return dialog.getPromise();
    };



    /**
     * Get a value stored in the settings
     *
     * @param {string} property Name of the settings to retrieve
     * @returns {object}
     **/
    Settings.prototype.get = function (property) {
        return this.settings[property];
    };

    /**
     * Get all the values stored in the settings
     *
     * @returns {object}
     **/
    Settings.prototype.getAll = function () {
        return this.settings;
    };


    /**
     * @private
     * Update the internal cache with the backing localstorage
     **/
    Settings.prototype.load = function () {
        this.settings = this.storage.getAllValues();
    };

    /**
     * Adds the type matcher to Mustache view object and render the template
     *
     * @param {string} html Mustache template
     * @param {object} settings the (prepared) config object
     * @returns {string} The rendered html for the dialog
     **/
    Settings.prototype._render = function (html, settings) {
        var view = settings;
        view = SUPPORTED_TYPES.reduce(function (prev, type) {
            prev[type] = checkers[type];
            return prev;
        }, view);

        return Mustache.render(html, view);
    };

    Settings.prototype._clearHandlers = function ($dlg) {
        $dlg.find('input').off('blur');
        $dlg.find('.primary').off('click');
    };

    Settings.prototype._registerHandlers = function ($dlg) {
        var self = this;
        self.errors = Object.create(null);
        $dlg.find('input').on('blur', function () {
            var $this = $(this),
                name = $this.attr("name"),
                validator = self.config.filter(function (config) {
                    return config.name === name;
                })[0].validator,
                retval = true;

            if (typeof validator === 'function') {
                retval = validator($this.val(), $this, $dlg);
            }

            if (validator && !retval) {
                $this.parents('.control-group').addClass('error');
                self.errors[name] = true;
            } else {
                $this.parents('.control-group').removeClass('error');
                delete self.errors[name];
            }
        });
        $dlg.find('.primary').on('click', function (event) {
            if (Object.keys(self.errors).length > 0) {
                event.stopPropagation();
            }
        });
    };

    /**
     * @private
     * Extract values from the modal and save them
     **/
    Settings.prototype._handleSave = function ($dialog) {

        var $formFields = $dialog.find('input, select');
        var inputValues = $formFields.serializeArray();
        var newSettings = {};
        inputValues.forEach(function (configElement) {
            newSettings[configElement.name] = configElement.value;
        });
        this.storage.setAllValues(newSettings);
        this.load();
    };

    /**
     * @private
     * Extract brackets 'defaults' from the config object
     **/
    Settings.prototype._getDefaults = function () {
        var defaults = {};
        this.config.forEach(function (config) {
            if (config.type === 'select') {
                config.options.forEach(function (option) {
                    if (option['default']) {
                        defaults[config.name] = option.name;
                    }
                });
            } else if (config['default']) {
                defaults[config.name] = config['default'];
            }
        });
        return defaults;
    };

    /**
     * @private
     * Merge config object and actual saved values to be
     * passed to Mustache
     **/
    Settings.prototype._getView = function () {
        return this.config.map(function (config) {
            var options;
            var newConfig = $.extend(true, {}, config);
            if (newConfig.type === 'select') {
                if (this.settings[config.name]) {
                    options = newConfig.options.map(function (option) {
                        if (option.value === this.settings[config.name]) {
                            option.selected = true;
                        }
                    }.bind(this));
                }
            } else if (this.settings[newConfig.name]) {
                newConfig.value = this.settings[newConfig.name];
            }
            return newConfig;
        }.bind(this));
    };



    module.exports = Settings;

});
