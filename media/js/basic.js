$(function () {
	var homepage = 'http://forhaus.cz',
		$views = $('#views .view'),
		$window = $(window),
		$liveButtons = $('.live-buttons'),
		$buttons = $('.button'),
		currentView = '',
		$loginView = $('#login'),
		$loginForm = $loginView.find('form');

	$loginForm.submit(function(event){
		event.preventDefault();
		if (!$loginForm.hasClass('loading')) {
			$loginForm.addClass('loading');
			$.post( homepage+'/cs/', $loginForm.serializeArray(),function(data) {
				action('view','info');
			})
			.fail(function() {
				alert('Spojení selhalo.');
			})
			.always(function() {
				$loginForm.removeClass('loading');
			});
		}
	});

	$liveButtons.on('click','.button',function(){
		buttonPress($(this));
	});
	$buttons.on('click',function(){
		buttonPress($(this));
	});
	function buttonPress($this) {
		var actions = $this.data('action').split(';');
		$.each(actions,function(key,val){
			var data = val.split('-');
			action(data[0],data[1]);
		});
	}
	function action(name,param) {
		switch (name) {
			case 'view':
				$views.each(function(){
					var $this = $(this);
					$this.toggleClass('show',$this.data('name') === param);
				});
				if (param === 'login') {
					$loginForm.removeClass('loading');
				}
				currentView = param;
				break;
			default:
				alert(name + ' - ' + param);
		}
	}
	action('view','login');
});
