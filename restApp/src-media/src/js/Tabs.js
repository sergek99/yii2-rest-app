$$.Tabs = new JS.Class({
	initialize: function (root, options) {
		this.root = root;
		this.options = options;

		this._cacheElements();
		this._bindEvents();
	},

	_cacheElements: function () {
		this.nodes = {
			tabsTitle:  this.root.find('.js-tabs-title').find('.js-tab-item'),
			tabsContent:  this.root.find('.js-tabs-content')
		};
	},

	_bindEvents: function () {
		this.nodes.tabsTitle.on('click', _.bind(function (event) {
			var currentTabs = $(event.currentTarget);
			if(currentTabs.hasClass('active')) {
				return;
			}

			var parentTab = currentTabs.parents('.js-tabs');
			var indexTabs = currentTabs.index();

			parentTab
				.find('.js-tabs-title')
				.find('.js-tab-item')
				.removeClass('active');
			currentTabs.addClass('active');
			parentTab.find('.js-tabs-content')
				.find('.js-tab-item')
				.hide()
				.eq(indexTabs)
				.show();
		}, this));
	}
});






