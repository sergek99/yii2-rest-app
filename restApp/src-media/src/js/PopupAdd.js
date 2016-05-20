// http://wiki.1vse.ru/doku.php?id=api-market:v1:products

$$.AddingPopup = new JS.Class({
	initialize: function (options) {
		this.options = options;
		this._cacheElements();
		this._bindEvents();
		this._templateDefault();
	},

	_cacheElements: function () {
		this.nodes = {};
		this.nodes.blockPopup = $('.b-popups');
		this.nodes.background = this.nodes.blockPopup.find('.popup-bg');
		this.nodes.popups = this.nodes.blockPopup.find('.popup-item');
		this.nodes.buttonAddPopup = $('.js-add-popup');
		this.nodes.body = $('body');

		this.nodes.popupCheaper = $('.popup-cheaper');
		this.nodes.buttonSwitchBlock = this.nodes.popupCheaper.find('.js-title-switch-wrapper');
		this.nodes.hiddenBlock = this.nodes.popupCheaper.find('.js-select-block');

		this.options.widthPopup = this.options.widthPopup || 800;
		this.options.heightPopup = this.options.heightPopup || 500;
		this.options.ajaxLoadingType = this.options.ajaxLoadingType || 'get';
		this.options.className = this.options.className || 'default-popup';
		this.options.idName = this.options.idName || '';
		this.options.newPopup = this.options.newPopup || false;
		this.options.ajaxLoadingContent = this.options.ajaxLoadingContent || false;
		this.options.addScrollContent = this.options.addScrollContent || 'show';
		this.options.visible = this.options.visible || 'hide';
		this.options.bodyClientHeight = $('html').outerHeight();
		this.options.csrf = $('meta[name="csrf-token"]').attr("content");
		this.options.heightHiddenBlock = this.nodes.hiddenBlock.height() || 135;
	},

	_bindEvents: function () {
		this.nodes.buttonAddPopup.on('click', _.bind(function (event) {
			event.preventDefault();

			var currentPopup = $(event.currentTarget).data('popup');
			var activePopup = $('#' + currentPopup);

			this.showPopup(activePopup);
		}, this));

		this.nodes.blockPopup.on( 'click', '.js-close-popup', _.bind(function (event) {
			event.preventDefault();

			this.hidePopup();
		}, this));
	},

	_templateDefault: function () {
		if(this.options.newPopup) {
			// Добавляем новый.
			this._addNewPopup();
		} else if(!this.options.newPopup && this.options.visible == 'show') {
			// Показываем имеющийся.
			this.showPopup($('.' + this.options.className));
		} else if(this.options.visible == 'hide') {
			// Скрываем имеющийся
			this.hidePopup($('.' + this.options.className));
		}

		$(window).on('resize',_.bind(function (event) {
			this.resizeWindows();
		}, this));
 	},

	_ajaxLoadingContent: function (popup) {
		var self = this;

		$.ajax({
			type: this.options.ajaxLoadingType,
			url: this.options.ajaxLoadingUrl,
			data: {'_csrf': this.options.csrf },
			beforeSend: function() {
				popup.find('.popup-content').html('<div class="h-loader"></div>');
			},
			success: function(response) {
				popup.find('.popup-content').text(response);

				if(self.options.addScrollContent == 'show') {
					self.addScroll(popup.find('.popup-content'));
				} else {
					popup.find('.popup-content').css({ 'overflow': 'hidden' });
				}
			}
		});
	},

	_addNewPopup: function () {
		if(this.options.idName.length) {
			this.options.idName = ' id="' + this.options.idName + '" ';
		}

		this.nodes.blockPopup.append('<div class="popup-item ' + this.options.className + '" ' + this.options.idName + '>' +
											'<div class="close js-close-popup icon-cancel"></div>' +
											'<div class="popup-content"></div>' +
									 '</div>');

		var newPopup = $('.' + this.options.className);
		newPopup.css({
				width: this.options.widthPopup,
				height: this.options.heightPopup,
				padding: '20px 25px'
			});

		if(this.options.ajaxLoadingContent) {
			this._ajaxLoadingContent(newPopup);
		}

		this.showPopup(newPopup);
	},

	resizeWindows: function () {
		var activePopup = $('.popup-item:visible');
		if(activePopup.length) {
			this.showPopup(activePopup, true);
		}
	},

	addScroll: function (block) {
		block.customScrollbar({
			wheelSpeed: 40,
			swipeSpeed: 1,
			animationSpeed: 600,
			hScroll: false
		});
	},

	showPopup: function (popup, resize) {
		resize = resize || false;

		popup = popup || $('.' + this.options.className);

		if(resize) {
			popup.removeClass('pos-absolute');
			this.nodes.body.removeClass('h-no-scroll');
		}

		var offsetTop = $('html').scrollTop() + 30;
		var offsetLeft = (popup.outerWidth()) / 2;
		this.options.bodyClientHeight = $('html').outerHeight();



		if (this.options.bodyClientHeight < popup.outerHeight()) {
			popup.addClass('pos-absolute');

		} else {
			offsetTop = (this.options.bodyClientHeight - popup.outerHeight()) / 2;
			this.nodes.body.addClass('h-no-scroll');
		}

		popup
			.fadeIn(300)
			.css({ 'top': offsetTop, 'marginLeft': -offsetLeft });
		this.nodes.background.fadeIn(300);
	},

	hidePopup: function (popup) {
 		// Скрываем попап
		popup = popup || this.nodes.blockPopup.find('.popup-item');

		popup
			.fadeOut(300)
			.removeClass('pos-absolute');

		this.nodes.body.removeClass('h-no-scroll');
		this.nodes.background.fadeOut(300);
	},

	removePopup: function (popup) {
		// Удаляем попап
		popup = popup || $('.' + this.options.className);

		this.hidePopup(popup);
		popup.remove();
	}
});
