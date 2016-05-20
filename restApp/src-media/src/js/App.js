var $$ = $$ || {};

$$.App = new JS.Class({
	initialize: function () {
		this._tabs();
		this._initPopupAdd();
	},

	_tabs: function () {
		new $$.Tabs($('.js-tabs'), {

		});
	},

	_initPopupAdd: function () {
		allPopups = new $$.AddingPopup({ });
	}
});

$(function () {
	new $$.App();


	// @temp Временно, описание работы страницы оператора колл центра

	var inputAdress = $('.big-field');

	inputAdress.on('click', '.delete-adress', function(event){
		event.preventDefault();
		$(event.currentTarget).parents('.adress').remove();
	});

	var fieldUserName = $('.js-name-user');
	var fieldUserCity = $('.js-name-city');
	var fieldUserAdress = $('.js-name-adress');

	$('.js-select-user').click(function(event){
		event.preventDefault();
		var currentTabs = $(event.currentTarget);
		var arrayAdress = currentTabs.data('adress').split(';');
		var resultAddAdress = '';

		$.each(arrayAdress, function(i, value){
			resultAddAdress = resultAddAdress + '<p class="adress">' + arrayAdress[i] +
			'<span class="icon-cancel delete-adress"></span></p>';
		});

		fieldUserName.html(currentTabs.find('.name-user').text());
		fieldUserCity.html(currentTabs.data('city'));
		fieldUserAdress.html(resultAddAdress);
	});

	var editInfoUser = $('.edit-icon');
	var titleAdress = $('.title-adress');
	var newAdressInput = $('.new-adress');
	var buttonAddAdress = $('.js-add-adress');
	var popupHelper = $('.popup-helper');

	editInfoUser.click(function(event){
		event.preventDefault();
		var currentButton = $(event.currentTarget);

		popupHelper


	});




	titleAdress.click(function(event){
		event.preventDefault();
		inputAdress.toggle();
		newAdressInput.focus();
	});

	newAdressInput.focus(function(event){
		newAdressInput.attr({ 'placeholder': 'Новый адрес' }).css({ 'color': '#595959' });
	});


	buttonAddAdress.click(function(event){
		event.preventDefault();
		if(!newAdressInput.val()) {
			newAdressInput.attr({ 'placeholder': 'Введите новый адрес' }).css({ 'color': 'red' });
			return;
		}
		newAdressInput.attr({ 'placeholder': 'Новый адрес' }).css({ 'color': '#595959' });


		fieldUserAdress.append('<p class="adress">'
									+ newAdressInput.val() +
								'<span class="icon-cancel delete-adress"></span></p>');
		newAdressInput.val('');
	});



/*
	$('.h-modern-radio').find('.radio').customcheckbox();
	$('.h-modern-radio-two').find('.checkbox').customcheckbox();
	$('.h-modern-checkbox').find('.checkbox').customcheckbox();
 */
});



















