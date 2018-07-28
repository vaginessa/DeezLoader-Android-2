// Starting area, boot up the API and proceed to eat memory

// Variables & constants
const socket = io.connect(window.location.href);
if(typeof mainApp !== "undefined"){
	var defaultUserSettings = mainApp.defaultSettings;
	var defaultDownloadLocation = mainApp.defaultDownloadDir;
}
let userSettings = [];

let preview_track = document.getElementById('preview-track');
let preview_stopped = true;

socket.emit("autologin");

socket.on("message", function(title, msg){
	message(title, msg);
});

//Login button
$('#modal_login_btn_login').click(function () {
	$('#modal_login_btn_login').attr("disabled", true);
	$('#modal_login_btn_login').html("Logging in...");
	var username = $('#modal_login_input_username').val();
	var password = $('#modal_login_input_password').val();
	var autologin = $('#modal_login_input_autologin').prop("checked");
	Username = username;
	//Send to the software
	socket.emit('login', username, password,true);
	
});

socket.on("autologin",function(username,password){
	$('#modal_login_input_autologin').prop('checked', true);
	$('#modal_login_btn_login').attr("disabled", true);
	$('#modal_login_btn_login').html("Logging in...");
	$('#modal_login_input_username').val(username);
	Username = username;
	$('#modal_login_input_password').val(password);
	M.updateTextFields();
	socket.emit('login', username, password,false);
});

socket.on("login", function (data) {
	if (!data.error) {
		$("#modal_settings_username").html(data.username);
		$("#modal_settings_picture").attr("src",data.picture);
		$("#side_user").text(data.username);
		$("#side_avatar").attr("src",data.picture);
		$("#side_email").text(Username);
		$('#initializing').addClass('animated fadeOut').on('webkitAnimationEnd', function () {
			$(this).css('display', 'none');
			$(this).removeClass('animated fadeOut');
		});
		// Load top charts list for countries
		socket.emit("getChartsCountryList", {selected: userSettings.chartsCountry});
		socket.emit("getChartsTrackListByCountry", {country: userSettings.chartsCountry});
		socket.emit("getMePlaylistList", {});
	}else{
			$('#login-res-text').text(data.error);
			//setTimeout(function(){$('#login-res-text').text("");},3000);
	}
	$('#modal_login_btn_login').attr("disabled", false);
	$('#modal_login_btn_login').html("Login");
});

// Open downloads folder
$('#openDownloadsFolder').on('click', function () {
	if(typeof shell !== "undefined"){
		shell.showItemInFolder(userSettings.downloadLocation + path.sep + '.');
	}else{
		alert("For security reasons, this button will do nothing.");
	}
});

// Do misc stuff on page load
$(document).ready(function () {
	M.AutoInit();
	preview_track.volume = 0;

	$('.sidenav').sidenav({
		edge: 'right'
	});

	var tabs = M.Tabs.getInstance(document.getElementById("tab-nav"));

	$('.sidenav_tab').click((e)=>{
		e.preventDefault;
		$(e.currentTarget).addClass("active");
		tabs.select($(e.currentTarget).attr('tab-id'));
		tabs.updateTabIndicator();
	})

	$(window).scroll(function () {
		if ($(this).scrollTop() > 100) {
			$('#btn_scrollToTop a').removeClass('scale-out').addClass('scale-in');
		} else {
			$('#btn_scrollToTop a').removeClass('scale-in').addClass('scale-out');
		}
	});

	$('#btn_scrollToTop').click(function () {
		$('html, body').animate({scrollTop: 0}, 800);
		return false;
	});

	$("#button_refresh_playlist_tab").click(function(){
		$("table_personal_playlists").html("");
		socket.emit("getMePlaylistList", {});
	})

	$(preview_track).on('canplay', ()=>{
		preview_track.play();
		preview_stopped = false;
		$(preview_track).animate({volume: 1}, 500);
	});

	$(preview_track).on('timeupdate', ()=>{
		if (preview_track.currentTime > preview_track.duration-1){
			$(preview_track).animate({volume: 0}, 800);
			preview_stopped = true;
			$("*").removeProp("playing");
			$('.preview_controls').text("play_arrow");
			$('.preview_playlist_controls').text("play_arrow");
		}
	});

	$('#nightTimeSwitcher').change(function(){
		if(this.checked){
			document.getElementsByTagName('link')[4].disabled = false;
			$("#nightModeSwitch2").html(`<i class="material-icons">brightness_7</i>Disable Night Mode`)
		}else{
			document.getElementsByTagName('link')[4].disabled = true;
			$("#nightModeSwitch2").html(`<i class="material-icons">brightness_2</i>Enable Night Mode`)
		}
		localStorage.darkMode = this.checked;
	});

	$("#nightModeSwitch2").click(()=>{
		$('#nightTimeSwitcher').prop('checked', !$('#nightTimeSwitcher').prop('checked'))
		$('#nightTimeSwitcher').change();
	})

	if (eval(localStorage.darkMode)){
		$('#nightTimeSwitcher').prop('checked', true);
		$('#nightTimeSwitcher').change();
	}else{
		$('#nightTimeSwitcher').prop('checked', false);
		$('#nightTimeSwitcher').change();
	}
	$("#downloadChartPlaylist").click(function(){
		addToQueue(`https://www.deezer.com/playlist/${$(this).data("id")}`);
	})

	$('.modal').modal();
	socket.emit("getUserSettings");
});

// Load settings
socket.on('getUserSettings', function (data) {
	userSettings = data.settings;
	console.log('Settings refreshed');
});

/**
 *	Modal Area START
 */

// Prevent default behavior of closing button
$('.modal-close').click(function (e) {
	e.preventDefault();
});

// Settings Modal START
const $settingsAreaParent = $('#modal_settings');

// Open settings panel
$('#nav_btn_openSettingsModal').click(function () {
	fillSettingsModal(userSettings);
});

// Save settings button
$('#modal_settings_btn_saveSettings').click(function () {
	let settings = {};

	// Save
	settings.userDefined = {
		trackNameTemplate: $('#modal_settings_input_trackNameTemplate').val(),
		playlistTrackNameTemplate: $('#modal_settings_input_playlistTrackNameTemplate').val(),
		albumTrackNameTemplate: $('#modal_settings_input_albumTrackNameTemplate').val(),
		albumNameTemplate: $('#modal_settings_input_albumNameTemplate').val(),
		createM3UFile: $('#modal_settings_cbox_createM3UFile').is(':checked'),
		createArtistFolder: $('#modal_settings_cbox_createArtistFolder').is(':checked'),
		createAlbumFolder: $('#modal_settings_cbox_createAlbumFolder').is(':checked'),
		downloadLocation: $('#modal_settings_input_downloadTracksLocation').val(),
		artworkSize: parseInt($('#modal_settings_select_artworkSize').val()),
		hifi: $('#modal_settings_cbox_hifi').is(':checked'),
		padtrck: $('#modal_settings_cbox_padtrck').is(':checked'),
		syncedlyrics: $('#modal_settings_cbox_syncedlyrics').is(':checked'),
		numplaylistbyalbum: $('#modal_settings_cbox_numplaylistbyalbum').is(':checked'),
		extendedTags: $('#modal_settings_cbox_extendedTags').is(':checked'),
		partOfSet: $('#modal_settings_cbox_partOfSet').is(':checked'),
		chartsCountry: $('#modal_settings_select_chartsCounrty').val(),
		spotifyUser: $('#modal_settings_input_spotifyUser').val(),
		saveArtwork: $('#modal_settings_cbox_saveArtwork').is(':checked'),
		logErrors: $('#modal_settings_cbox_logErrors').is(':checked'),
		queueConcurrency: parseInt($('#modal_settings_number_queueConcurrency').val()),
		multitagSeparator: $('#modal_settings_select_multitagSeparator').val(),
		maxBitrate: $('#modal_settings_select_maxBitrate').val(),
		PNGcovers: $('#modal_settings_cbox_PNGcovers').is(':checked')
	};

	// Send updated settings to be saved into config file
	socket.emit('saveSettings', settings);
	socket.emit("getUserSettings");
});

// Reset defaults button
$('#modal_settings_btn_defaultSettings').click(function () {
	if(typeof defaultDownloadLocation !== "undefined"){
		defaultUserSettings.downloadLocation = defaultDownloadLocation;
		fillSettingsModal(defaultUserSettings);
	}
});

$('#modal_login_btn_signup').click(function(){
	if(typeof shell != 'undefined'){
		shell.openExternal("https://www.deezer.com/register");
	}else{
		window.open("https://www.deezer.com/register");
	}
});

$('#modal_settings_btn_logout').click(function () {
		$('#initializing').css('display', '');
		$('#initializing').addClass('animated fadeIn').on('webkitAnimationEnd', function () {
			$(this).removeClass('animated fadeIn');
			$(this).css('display', '');
		});
		socket.emit('logout');
		$('#modal_login_input_username').val("");
		$('#modal_login_input_password').val("");
		$('#modal_login_input_autologin').prop("checked",false);
});

// Populate settings fields
function fillSettingsModal(settings) {
	$('#modal_settings_input_trackNameTemplate').val(settings.trackNameTemplate);
	$('#modal_settings_input_playlistTrackNameTemplate').val(settings.playlistTrackNameTemplate);
	$('#modal_settings_input_albumTrackNameTemplate').val(settings.albumTrackNameTemplate);
	$('#modal_settings_input_albumNameTemplate').val(settings.albumNameTemplate);
	$('#modal_settings_cbox_createM3UFile').prop('checked', settings.createM3UFile);
	$('#modal_settings_cbox_createArtistFolder').prop('checked', settings.createArtistFolder);
	$('#modal_settings_cbox_createAlbumFolder').prop('checked', settings.createAlbumFolder);
	$('#modal_settings_cbox_hifi').prop('checked', settings.hifi);
	$('#modal_settings_cbox_padtrck').prop('checked', settings.padtrck);
	$('#modal_settings_cbox_syncedlyrics').prop('checked', settings.syncedlyrics);
	$('#modal_settings_cbox_numplaylistbyalbum').prop('checked', settings.numplaylistbyalbum);
	$('#modal_settings_input_downloadTracksLocation').val(settings.downloadLocation);
	$('#modal_settings_select_artworkSize').val(settings.artworkSize).formSelect();
	$('#modal_settings_cbox_extendedTags').prop('checked', settings.extendedTags);
	$('#modal_settings_cbox_partOfSet').prop('checked', settings.partOfSet);
	$('#modal_settings_select_chartsCounrty').val(settings.chartsCountry).formSelect();
	$('#modal_settings_input_spotifyUser').val(settings.spotifyUser);
	$('#modal_settings_cbox_saveArtwork').prop('checked', settings.saveArtwork);
	$('#modal_settings_cbox_logErrors').prop('checked', settings.logErrors);
	$('#modal_settings_number_queueConcurrency').val(settings.queueConcurrency);
	$('#modal_settings_select_multitagSeparator').val(settings.multitagSeparator).formSelect();
	$('#modal_settings_select_maxBitrate').val(settings.maxBitrate).formSelect();
	$('#modal_settings_cbox_PNGcovers').prop('checked', settings.PNGcovers);

	M.updateTextFields()
}


//#############################################MODAL_MSG##############################################\\
function message(title, message) {
	$('#modal_msg_title').html(title);
	$('#modal_msg_message').html(message);
	$('#modal_msg').modal('open');
}

//****************************************************************************************************\\
//************************************************TABS************************************************\\
//****************************************************************************************************\\

//#############################################TAB_SEARCH#############################################\\
$('#tab_search_form_search').submit(function (ev) {

	ev.preventDefault();

	var searchString = $('#tab_search_form_search_input_searchString').val().trim();
	var mode = $('#tab_search_form_search').find('input[name=searchMode]:checked').val();

	if (searchString.length == 0) {
		return;
	}

	$('#tab_search_table_results').find('thead').find('tr').addClass('hide');
	$('#tab_search_table_results_tbody_results').addClass('hide');
	$('#tab_search_table_results_tbody_noResults').addClass('hide');
	$('#tab_search_table_results_tbody_loadingIndicator').removeClass('hide');

	socket.emit("search", {type: mode, text: searchString});

});

$('input[name=searchMode][type=radio]').change(()=>{
	$('#tab_search_form_search').submit();
})

socket.on('search', function (data) {

	$('#tab_search_table_results_tbody_loadingIndicator').addClass('hide');

	if (data.items.length == 0) {
		$('#tab_search_table_results_tbody_noResults').removeClass('hide');
		return;
	}

	if (data.type == 'track') {
		showResults_table_track(data.items);
	} else if (data.type == 'album') {
		showResults_table_album(data.items);
	} else if (data.type == 'artist') {
		showResults_table_artist(data.items);
	} else if (data.type == 'playlist') {
		showResults_table_playlist(data.items);
	}
	$('#tab_search_table_results_tbody_results').removeClass('hide');
});

function showResults_table_track(tracks) {
	var tableBody = $('#tab_search_table_results_tbody_results');
	$(tableBody).html('');
	$('#tab_search_table_results_thead_track').removeClass('hide');
	for (var i = 0; i < tracks.length; i++) {
		var currentResultTrack = tracks[i];
		$(tableBody).append(
			'<tr>' +
			'<td><a href="#" class="circle single-cover" preview="'+currentResultTrack['preview']+'"><i class="material-icons preview_controls white-text">play_arrow</i><img style="width:56px" class="circle" src="' + (currentResultTrack['album']['cover_small'] ? currentResultTrack['album']['cover_small'] : "img/noCover.jpg" ) + '"/></a></td>' +
			'<td class="centrado"><p>' + 
			(currentResultTrack.explicit_lyrics ? ' <i class="material-icons valignicon tiny materialize-red-text">error_outline</i>' : '')+
			currentResultTrack['title'] + '</p>' +
			'<p>' + currentResultTrack['artist']['name'] + '</p>' +
			'<p>' + currentResultTrack['album']['title'] + '</p>' +
			'<p>' + convertDuration(currentResultTrack['duration']) + '</p></td>' +
			'</tr>');
		generateDownloadLink(currentResultTrack['link']).appendTo(tableBody.children('tr:last')).wrap('<td class="toRight">');

		tableBody.children('tr:last').find('.preview_controls').hover( function () {
			$(this).css({opacity: 1});
		}, function () {
			if (($(this).parent().prop("playing") && preview_stopped) || !$(this).parent().prop("playing")){
				$(this).css({opacity: 0}, 200);
			}
		});

		tableBody.children('tr:last').find('.single-cover').click(function (e) {
			e.preventDefault();
			if ($(this).prop("playing")){
				if (preview_track.paused){
					preview_track.play();
					preview_stopped = false;
					$(this).children('i').text("pause");
					$(preview_track).animate({volume: 1}, 500);
				}else{
					preview_stopped = true;
					$(this).children('i').text("play_arrow");
					$(preview_track).animate({volume: 0}, 250, "swing", ()=>{ preview_track.pause() });
				}
			}else{
				$("*").removeProp("playing");
				$(this).prop("playing","playing");
				$('.preview_controls').text("play_arrow");
				$('.preview_playlist_controls').text("play_arrow");
				$('.preview_controls').css({opacity:0});
				$(this).children('i').text("pause");
				$(this).children('i').css({opacity: 1});
				preview_stopped = false;
				$(preview_track).animate({volume: 0}, 250, "swing", ()=>{
					preview_track.pause();
					$('#preview-track_source').prop("src", $(this).attr("preview"));
					preview_track.load();
				});
			}
		});
	}
}

function showResults_table_album(albums) {
	var tableBody = $('#tab_search_table_results_tbody_results');
	$(tableBody).html('');
	$('#tab_search_table_results_thead_album').removeClass('hide');
	for (var i = 0; i < albums.length; i++) {
		var currentResultAlbum = albums[i];
		$(tableBody).append(
				'<tr>' +
				'<td><img style="width:56px" src="' + (currentResultAlbum['cover_small'] ? currentResultAlbum['cover_small'] : "img/noCover.jpg") + '" class="circle" /></td>' +
				'<td class="centrado"><p>' +
				(currentResultAlbum.explicit_lyrics ? '<i class="material-icons valignicon tiny materialize-red-text tooltipped" data-tooltip="Explicit">error_outline</i> ' : '') + 
				currentResultAlbum['title'] + '</p>' +
				'<p>' + currentResultAlbum['artist']['name'] + '</p>' +
				'<p>' + currentResultAlbum['nb_tracks'] + ' song' + (currentResultAlbum['nb_tracks']>1? 's':'') + '</p>' +
				'<p>' + 'type: ' + currentResultAlbum['record_type'] + '</p></td>' +
				'<td class="toRight"></td>' +
				'</tr>');
		generateShowTracklistSelectiveButton(currentResultAlbum['link']).appendTo(tableBody.children().children('td:last')).wrap('<p>');
		generateDownloadLink(currentResultAlbum['link']).appendTo(tableBody.children().children('td:last')).wrap('<p>');
	}
	$('.tooltipped').tooltip({delay: 100});
}

function showResults_table_artist(artists) {
	var tableBody = $('#tab_search_table_results_tbody_results');
	$(tableBody).html('');
	$('#tab_search_table_results_thead_artist').removeClass('hide');
	for (var i = 0; i < artists.length; i++) {
		var currentResultArtist = artists[i];
		$(tableBody).append(
				'<tr>' +
				'<td><img style="width:56px" src="' + (currentResultArtist['picture_small'] ? currentResultArtist['picture_small'] : "img/noCover.jpg")  + '" class="circle" /></td>' +
				'<td class="centrado"><p>' + currentResultArtist['name'] + '</p>' +
				'<p>' + currentResultArtist['nb_album'] + ' album' + (currentResultArtist['nb_album']>1?'s':'') + '</p></td>' +
				'<td class="toRight"></td>' +
				'</tr>');
		generateShowTracklistButton(currentResultArtist['link']).appendTo(tableBody.children().children('td:last')).wrap('<p>');
		generateDownloadLink(currentResultArtist['link']).appendTo(tableBody.children().children('td:last')).wrap('<p>');
	}
}

function showResults_table_playlist(playlists) {
	var tableBody = $('#tab_search_table_results_tbody_results');
	$(tableBody).html('');
	$('#tab_search_table_results_thead_playlist').removeClass('hide');
	for (var i = 0; i < playlists.length; i++) {
		var currentResultPlaylist = playlists[i];
		$(tableBody).append(
				'<tr>' +
				'<td><img style="width:56px" src="' +  
				(currentResultPlaylist['picture_small'] ? currentResultPlaylist['picture_small'] : "img/noCover.jpg") + 
				'" class="circle" /></td>' +
				'<td class="centrado"><p>' + currentResultPlaylist['title'] + '</p>' +
				'<p>' + currentResultPlaylist['nb_tracks'] + ' songs' + '</p></td>' +
				'</tr>');
		generateShowTracklistSelectiveButton(currentResultPlaylist['link']).appendTo(tableBody.children('tr:last')).wrap('<td class="toRight">');
		generateDownloadLink(currentResultPlaylist['link']).appendTo(tableBody.children().children('td:last')).wrap('<p>');
	}
	$('.tooltipped').tooltip({delay: 100});
}

function generateShowTracklistSelectiveButton(link) {
	var btn_showTrackListSelective = $('<a href="#" class="waves-effect btn-flat"><i class="material-icons">list</i></a>');
	$(btn_showTrackListSelective).click(function (ev){
		ev.preventDefault();
		showTrackListSelective(link);
	});
	return btn_showTrackListSelective;
}

function generateShowTracklistButton(link) {
	var btn_showTrackList = $('<a href="#" class="waves-effect btn-flat"><i class="material-icons">list</i></a>');
	$(btn_showTrackList).click(function (ev) {
		ev.preventDefault();
		showTrackList(link);
	});
	return btn_showTrackList;
}

var trackListSelectiveModalApp = new Vue({
	el: '#modal_trackListSelective',
	data: {
		title: null,
		head: null,
		body: []
	}
});

var trackListModalApp = new Vue({
	el: '#modal_trackList',
	data: {
		title: null,
		head: null,
		body: []
	}
});

function showTrackListSelective(link) {
	$('#modal_trackListSelective_table_trackListSelective_tbody_trackListSelective').addClass('hide');
	$('#modal_trackListSelective_table_trackListSelective_tbody_loadingIndicator').removeClass('hide');
	$('#modal_trackListSelective').modal('open');
	socket.emit('getTrackList', {id: getIDFromLink(link), type: getTypeFromLink(link)});
}

$('#download_track_selection').click(function(e){
	e.preventDefault();
	var urls = [];
	$("input:checkbox.trackCheckbox:checked").each(function(){
		urls.push($(this).val());
	});
	if(urls.length != 0){
		for (var ia = 0; ia < urls.length; ia++) {
			addToQueue(urls[ia]);
		}
	}
	$('#modal_trackListSelective').modal('close');
});

function showTrackList(link) {
	$('#modal_trackList_table_trackList_tbody_trackList').addClass('hide');
	$('#modal_trackList_table_trackList_tbody_loadingIndicator').removeClass('hide');
	$('#modal_trackList').modal('open');
	socket.emit("getTrackList", {id: getIDFromLink(link), type: getTypeFromLink(link)});
}

socket.on("getTrackList", function (data) {
	//data.err			-> undefined/err
	//data.id			 -> passed id
	//data.response -> API response
	if (data.err){
		trackListSelectiveModalApp.title = "Can't get data"
		return;
	}
	if (data.response){
		var trackList = data.response.data, content = '';
		var trackListSelective = data.response.data, content = '';
		if (typeof trackList == 'undefined') {
			alert('Well, there seems to be a problem with this part of the app. Please notify the developer.');
			return;
		}

		// ########################################
		if(data.reqType == 'album' || data.reqType == 'playlist'){
			var tableBody = $('#modal_trackListSelective_table_trackListSelective_tbody_trackListSelective');
		} else {
			var tableBody = $('#modal_trackList_table_trackList_tbody_trackList');
		}
		$(tableBody).html('');
		console.log(trackList)
		//############################################
		if (data.reqType == 'artist') {
			trackListModalApp.title = 'Album List';
			trackListModalApp.head = [
				/*{title: '#'},
				{title: ''},
				{title: 'Album Title'},
				{title: 'Release Date'},
				{title: 'Record Type'},
				{title: 'Download Album'}*/
				{title: ''},
				{title: ''},
				{title: ''},
				{title: ''}
			];
			for (var i = 0; i < trackList.length; i++) {
				$(tableBody).append(
				'<tr><td>' + 
				(i + 1) + '</td>' +
				'<td><a href="#" class="album_chip" data-link="' + trackList[i].link + '"><div class="chip"><img src="' +
				trackList[i].cover_small + '" /></div></a></td>' +
				'<td class="centrado"><p>' + 
				(trackList[i].explicit_lyrics ? '<i class="material-icons valignicon tiny materialize-red-text tooltipped" data-tooltip="Explicit">error_outline</i>' : '') + 
				trackList[i].title + '</p>' + 
				'<p>' + trackList[i].release_date + '</p>'+
				'<p>' + trackList[i].record_type + '</p></td>'+
				'</tr>');
				generateDownloadLink(trackList[i].link).appendTo(tableBody.children('tr:last')).wrap('<td>');
			}
			$('.album_chip').click(function(e){
				showTrackListSelective($(this).data('link'), true);
			});
		} else if(data.reqType == 'playlist') {
			trackListSelectiveModalApp.title = 'Playlist';
			trackListSelectiveModalApp.head = [
				/*{title: '<i class="material-icons">music_note</i>'},
				{title: '#'},
				{title: 'Song'},
				{title: 'Artist'},
				{title: '<i class="material-icons">timer</i>'},*/
				{title: '<i class="material-icons">music_note</i>'},
				{title: ''},
				{title: ''},
				{title: '<div class="valign-wrapper checkBoxAllSongs">Select all<label><input class="selectAll" type="checkbox" id="selectAll"><span></span></label></div>'}
			];
			$('.selectAll').prop('checked', false);
			for (var i = 0; i < trackList.length; i++) {
				$(tableBody).append(
					'<tr><td><i class="material-icons preview_playlist_controls" preview="'+trackList[i].preview+'">play_arrow</i></td>'+
					'<td>' + (i + 1) + '</td>' +
					'<td class="centrado"><p>'+
					(trackList[i].explicit_lyrics ? '<i class="material-icons valignicon tiny materialize-red-text tooltipped" data-tooltip="Explicit">error_outline</i> ' : '') + trackList[i].title + '</p>' +
					'<p>' + trackList[i].artist.name + '</p>' +
					'<p>' + convertDuration(trackList[i].duration) + '</p></td>' +
					'<td><div class="valign-wrapper"><label><input class="trackCheckbox valign" type="checkbox" id="trackChk'+ i +'" value="' + trackList[i].link + '"><span></span></label></div></tr>'
				);
				tableBody.children('tr:last').find('.preview_playlist_controls').click(function (e) {
					e.preventDefault();
					if ($(this).prop("playing")){
						if (preview_track.paused){
							preview_track.play();
							preview_stopped = false;
							$(this).text("pause");
							$(preview_track).animate({volume: 1}, 500);
						}else{
							preview_stopped = true;
							$(this).text("play_arrow");
							$(preview_track).animate({volume: 0}, 250, "swing", ()=>{ preview_track.pause() });
						}
					}else{
						$("*").removeProp("playing");
						$(this).prop("playing","playing");
						$('.preview_controls').text("play_arrow");
						$('.preview_playlist_controls').text("play_arrow");
						$('.preview_controls').css({opacity:0});
						$(this).text("pause");
						$(this).css({opacity: 1});
						preview_stopped = false;
						$(preview_track).animate({volume: 0}, 250, "swing", ()=>{
							preview_track.pause();
							$('#preview-track_source').prop("src", $(this).attr("preview"));
							preview_track.load();
						});
					}
				});
			}
		} else if(data.reqType == 'album') {
			trackListSelectiveModalApp.title = 'Tracklist';
			trackListSelectiveModalApp.head = [
				/*{title: '<i class="material-icons">music_note</i>'},
				{title: '#'},
				{title: 'Song'},
				{title: 'Artist'},
				{title: '<i class="material-icons">timer</i>'},*/
				{title: '<i class="material-icons">music_note</i>'},
				{title: ''},
				{title: ''},
				{title: '<div class="valign-wrapper checkBoxAllSongs">Select all<label><input class="selectAll" type="checkbox" id="selectAll"><span></span></label></div>'}
			];
			$('.selectAll').prop('checked', false);
			if (trackList[trackList.length-1].disk_number != 1){
				baseDisc = 0
			} else {
				baseDisc =1
			};
			for (var i = 0; i < trackList.length; i++) {
				discNum = trackList[i].disk_number
				if (discNum != baseDisc){
					$(tableBody).append('<tr><td colspan="4" style="opacity: 0.54;"><i class="material-icons valignicon tiny">album</i> '+discNum+'</td></tr>');
					baseDisc = discNum;
				}
				$(tableBody).append(
					'<tr><td><i class="material-icons preview_playlist_controls" preview="'+trackList[i].preview+'">play_arrow</i></td>'+
					'<td>' + trackList[i].track_position + '</td>' +
					'<td class="centrado"><p>' +
					(trackList[i].explicit_lyrics ? '<i class="material-icons valignicon tiny materialize-red-text tooltipped" data-tooltip="Explicit">error_outline</i> ' : '') + 
					trackList[i].title + '</p>' +
					'<p>' + trackList[i].artist.name + '</p>' +
					'<p>' + convertDuration(trackList[i].duration) + '</p></td>' +
					'<td><div class="valign-wrapper "><label><input class="trackCheckbox valign" type="checkbox" id="trackChk'+ i +'" value="' + trackList[i].link + '"><span></span></label></div></tr>'
				);
				tableBody.children('tr:last').find('.preview_playlist_controls').click(function (e) {
					e.preventDefault();
					if ($(this).prop("playing")){
						if (preview_track.paused){
							preview_track.play();
							preview_stopped = false;
							$(this).text("pause");
							$(preview_track).animate({volume: 1}, 500);
						}else{
							preview_stopped = true;
							$(this).text("play_arrow");
							$(preview_track).animate({volume: 0}, 250, "swing", ()=>{ preview_track.pause() });
						}
					}else{
						$("*").removeProp("playing");
						$(this).prop("playing","playing");
						$('.preview_controls').text("play_arrow");
						$('.preview_playlist_controls').text("play_arrow");
						$('.preview_controls').css({opacity:0});
						$(this).text("pause");
						$(this).css({opacity: 1});
						preview_stopped = false;
						$(preview_track).animate({volume: 0}, 250, "swing", ()=>{
							preview_track.pause();
							$('#preview-track_source').prop("src", $(this).attr("preview"));
							preview_track.load();
						});
					}
				});
			}
		} else {
			trackListModalApp.title = 'Tracklist';
			trackListModalApp.head = [
				{title: '<i class="material-icons">music_note</i>'},
				{title: '#'},
				{title: 'Song'},
				{title: 'Artist'},
				{title: '<i class="material-icons">timer</i>'}
			];
			for (var i = 0; i < trackList.length; i++) {
				$(tableBody).append(
					'<tr>'+
					'<td><i class="material-icons preview_playlist_controls" preview="'+trackList[i].preview+'">play_arrow</i></td>'+
					'<td>' + (i + 1) + '</td>' +
					(trackList[i].explicit_lyrics ? '<td><i class="material-icons valignicon tiny materialize-red-text tooltipped" data-tooltip="Explicit">error_outline</i> ' : '<td> ') +
					trackList[i].title + '</td>' +
					'<td>' + trackList[i].artist.name + '</td>' +
					'<td>' + convertDuration(trackList[i].duration) + '</td></tr>'
				);
				tableBody.children('tr:last').find('.preview_playlist_controls').click(function (e) {
					e.preventDefault();
					if ($(this).prop("playing")){
						if (preview_track.paused){
							preview_track.play();
							preview_stopped = false;
							$(this).text("pause");
							$(preview_track).animate({volume: 1}, 500);
						}else{
							preview_stopped = true;
							$(this).text("play_arrow");
							$(preview_track).animate({volume: 0}, 250, "swing", ()=>{ preview_track.pause() });
						}
					}else{
						$("*").removeProp("playing");
						$(this).prop("playing","playing");
						$('.preview_controls').text("play_arrow");
						$('.preview_playlist_controls').text("play_arrow");
						$('.preview_controls').css({opacity:0});
						$(this).text("pause");
						$(this).css({opacity: 1});
						preview_stopped = false;
						$(preview_track).animate({volume: 0}, 250, "swing", ()=>{
							preview_track.pause();
							$('#preview-track_source').prop("src", $(this).attr("preview"));
							preview_track.load();
						});
					}
				});
			}
		}
		if(data.reqType == 'album' || data.reqType == 'playlist'){
			$('#modal_trackListSelective_table_trackListSelective_tbody_loadingIndicator').addClass('hide');
			$('#modal_trackListSelective_table_trackListSelective_tbody_trackListSelective').removeClass('hide');
		} else {
			$('#modal_trackList_table_trackList_tbody_loadingIndicator').addClass('hide');
			$('#modal_trackList_table_trackList_tbody_trackList').removeClass('hide');
		}
		//$('#modal_trackList_table_trackList_tbody_trackList').html(content);
	}
});

//#############################################TAB_CHARTS#############################################\\
socket.on("getChartsCountryList", function (data) {
	//data.countries		-> Array
	//data.countries[0].country -> String (country name)
	//data.countries[0].picture_small/picture_medium/picture_big -> url to cover
	for (var i = 0; i < data.countries.length; i++) {
		$('#tab_charts_select_country').append('<option value="' + data.countries[i]['country'] + '" data-icon="' + data.countries[i]['picture_small'] + '" class="left circle">' + data.countries[i]['country'] + '</option>');
		$('#modal_settings_select_chartsCounrty').append('<option value="' + data.countries[i]['country'] + '" data-icon="' + data.countries[i]['picture_small'] + '" class="left circle">' + data.countries[i]['country'] + '</option>');
	}
	$('#tab_charts_select_country').find('option[value="' + data.selected + '"]').attr("selected", true);
	$('#modal_settings_select_chartsCounrty').find('option[value="' + data.selected + '"]').attr("selected", true);
	$('select').formSelect();
});

socket.on("setChartsCountry", function (data) {
	$('#tab_charts_select_country').find('option[value="' + data.selected + '"]').attr("selected", true);
	$('#modal_settings_select_chartsCounrty').find('option[value="' + data.selected + '"]').attr("selected", true);
	$('select').formSelect();
});

$('#tab_charts_select_country').on('change', function () {
	var country = $(this).find('option:selected').val();
	$('#tab_charts_table_charts_tbody_charts').addClass('hide');
	$('#tab_charts_table_charts_tbody_loadingIndicator').removeClass('hide');
	socket.emit("getChartsTrackListByCountry", {country: country});
});

socket.on("getChartsTrackListByCountry", function (data) {
	//data.playlist		-> Object with Playlist information
	//data.tracks			-> Array
	//data.tracks[0]	 -> Object of track 0
	$("#downloadChartPlaylist").data("id", data.playlist.id)
	var chartsTableBody = $('#tab_charts_table_charts_tbody_charts'), currentChartTrack;
	chartsTableBody.html('');
	for (var i = 0; i < data.tracks.length; i++) {
		currentChartTrack = data.tracks[i];
		if(i%2==0)
		$(chartsTableBody).append("<div class='row'>");
		$(chartsTableBody).append(
				'<tr class="col s6">' +
				'<td class="centrado chartSong"><p><a href="#" class="circle single-cover" preview="'+currentChartTrack['preview']+'"><i class="material-icons preview_controls white-text">play_arrow</i><img style="width:56px" src="' + (currentChartTrack['album']['cover_small'] ? currentChartTrack['album']['cover_small'] : "img/noCover.jpg") + '" class="circle" /></a></p>' +
				'<p>' + 'No.: ' + (i + 1) + '</p>' +
				'<p>' + currentChartTrack['title'] + '</p>' +
				'<p>' + currentChartTrack['artist']['name'] + '</p>' +
				'<p>' + currentChartTrack['album']['title'] + '</p>' +
				'<p>' + convertDuration(currentChartTrack['duration']) + '</p></td>' +
				'</tr>');
		generateDownloadLink(currentChartTrack['link']).appendTo(chartsTableBody.children().children('td:last')).wrap('<p>');
		chartsTableBody.children('tr:last').find('.preview_controls').hover( function () {
			$(this).css({opacity: 1});
		}, function () {
			if (($(this).parent().prop("playing") && preview_stopped) || !$(this).parent().prop("playing")){
				$(this).css({opacity: 0}, 200);
			}
		});
		chartsTableBody.children('tr:last').find('.single-cover').click(function (e) {
			e.preventDefault();
			if ($(this).prop("playing")){
				if (preview_track.paused){
					preview_track.play();
					preview_stopped = false;
					$(this).children('i').text("pause");
					$(preview_track).animate({volume: 1}, 500);
				}else{
					preview_stopped = true;
					$(this).children('i').text("play_arrow");
					$(preview_track).animate({volume: 0}, 250, "swing", ()=>{ preview_track.pause() });
				}
			}else{
				$("*").removeProp("playing");
				$(this).prop("playing","playing");
				$('.preview_controls').text("play_arrow");
				$('.preview_playlist_controls').text("play_arrow");
				$('.preview_controls').css({opacity:0});
				$(this).children('i').text("pause");
				$(this).children('i').css({opacity: 1});
				preview_stopped = false;
				$(preview_track).animate({volume: 0}, 250, "swing", ()=>{
					preview_track.pause();
					$('#preview-track_source').prop("src", $(this).attr("preview"));
					preview_track.load();
				});
			}
		});
		if(i%2==1)
		$(chartsTableBody).append("</div>");

	}
	$('#tab_charts_table_charts_tbody_loadingIndicator').addClass('hide');
	chartsTableBody.removeClass('hide');
});

//#############################################TAB_PLAYLISTS############################################\\
socket.on("getMePlaylistList", function (data) {
	var tableBody = $('#table_personal_playlists');
	$(tableBody).html('');
	for (var i = 0; i < data.playlists.length; i++) {
		var currentResultPlaylist = data.playlists[i];
		$(tableBody).append(
				'<tr>' +
				'<td><p><img src="' + currentResultPlaylist['image'] + '" class="circle" width="56px" /></p></td>' +
				'<td class="centrado"><p>' + currentResultPlaylist['title'] + '</p>' +
				'<p>' + currentResultPlaylist['songs'] + ' song' + (currentResultPlaylist['songs']>1?'s':'') + '</p></td>' +
				'<td class="toRight"></p></td>' +
				'</tr>');
		if (currentResultPlaylist.spotify)
			generateShowTracklistButton(currentResultPlaylist['link']).appendTo(tableBody.children().children('td:last')).wrap('<p>')
		else
			generateShowTracklistSelectiveButton(currentResultPlaylist['link']).appendTo(tableBody.children().children('td:last')).wrap('<p>');

		generateDownloadLink(currentResultPlaylist['link']).appendTo(tableBody.children().children('td:last')).wrap('<p>');
	}
	$('.tooltipped').tooltip({delay: 100});
});

//###############################################TAB_URL##############################################\\
$('#tab_url_form_url').submit(function (ev) {

	ev.preventDefault();
	var urls = $("#song_url").val().split(";");
	console.log(urls);
	for(var i = 0; i < urls.length; i++){
		var url = urls[i];
		console.log(url);
		if (url.length == 0) {
			message('Blank URL Field', 'You need to insert an URL to download it!');
			return false;
		}
		//Validate URL
		if (url.indexOf('deezer.com/') < 0 && url.indexOf('open.spotify.com/') < 0 && url.indexOf('spotify:') < 0) {
			message('Wrong URL', 'The URL seems to be wrong. Please check it and try it again.');
			return false;
		}
		if (url.indexOf('?') > -1) {
			url = url.substring(0, url.indexOf("?"));
		}
		if (url.indexOf('open.spotify.com/') >= 0 ||  url.indexOf('spotify:') >= 0){
			if (url.indexOf('user') < 0 || url.indexOf('playlist') < 0){
				message('Playlist not found', 'Spotify for now can only download playlists.');
				return false;
			}
		}
		addToQueue(url);
	}
});

//############################################TAB_DOWNLOADS###########################################\\
function addToQueue(url) {
	var type = getTypeFromLink(url), id = getIDFromLink(url);
	if (type == 'spotifyplaylist'){
		[user, id] = getPlayUserFromURI(url)
		userSettings.currentSpotifyUser = user;
	}
	if (type == 'track') {
		userSettings.filename = userSettings.trackNameTemplate;
		userSettings.foldername = userSettings.albumNameTemplate;
	} else if (type == 'playlist' || type == 'spotifyplaylist') {
		userSettings.filename = userSettings.playlistTrackNameTemplate;
		userSettings.foldername = userSettings.albumNameTemplate;
	} else if (type == 'album' || type == 'artist'){
		userSettings.filename = userSettings.albumTrackNameTemplate;
		userSettings.foldername = userSettings.albumNameTemplate;
	} else {
		$('#modal_wrongURL').modal('open');
		return false;
	}
	if (alreadyInQueue(id)) {
		M.toast({html: '<i class="material-icons left">playlist_add_check</i> Already in download-queue!', displayLength: 5000, classes: 'rounded'});
		return false;
	}
	if (id.match(/^[0-9]+$/) == null && type != 'spotifyplaylist') {
		$('#modal_wrongURL').modal('open');
		return false;
	}
	socket.emit("download" + type, {id: id, settings: userSettings});
	M.toast({html: '<i class="material-icons left">add</i>Added to download-queue', displayLength: 5000, classes: 'rounded'});
}

function alreadyInQueue(id) {
	var alreadyInQueue = false;
	$('#tab_downloads_table_downloads').find('tbody').find('tr').each(function () {
		if ($(this).data('deezerid') == id) {
			alreadyInQueue = true;
			return false
		}
	});
	return alreadyInQueue;
}

socket.on('addToQueue', function (data) {

	var tableBody = $('#tab_downloads_table_downloads').find('tbody');

	$(tableBody).append(
			'<tr id="' + data.queueId + '" data-deezerid="' + data.id + '">' +
			'<td class="queueTitle">' + data.name + '</td>' +
			'<td class="queueSize">' + data.size + '</td>' +
			'<td class="queueDownloaded">' + data.downloaded + '</td>' +
			'<td class="queueFailed">' + data.failed + '</td>' +
			'<td><div class="progress"><div class="indeterminate"></div></div></td>' +
			'</tr>');

	var btn_remove = $('<a href="#" class="btn-flat waves-effect"><i class="material-icons">remove</i></a>');

	$(btn_remove).click(function (ev) {

		ev.preventDefault();

		socket.emit("cancelDownload", {queueId: data.queueId});

	});

	btn_remove.appendTo(tableBody.children('tr:last')).wrap('<td class="eventBtn center">');

});

socket.on("downloadStarted", function (data) {
	//data.queueId -> queueId of started download

	//Switch progress type indeterminate to determinate
	$('#' + data.queueId).find('.indeterminate').removeClass('indeterminate').addClass('determinate');
	$('#' + data.queueId).find('.eventBtn').find('a').html('<i class="material-icons">clear</i>');

});

socket.on('updateQueue', function (data) {

	if (data.cancelFlag) {
		return;
	}

	$('#' + data.queueId).find('.queueDownloaded').html(data.downloaded);
	$('#' + data.queueId).find('.queueFailed').html(data.failed);

	if (data.failed == 0 && ((data.downloaded + data.failed) >= data.size)) {
		$('#' + data.queueId).find('.eventBtn').html('<i class="material-icons">done</i>');
		$('#' + data.queueId).addClass('finished');
		M.toast({html: `<i class="material-icons left">done</i>${quoteattr(data.name)} - Completed!`, displayLength: 5000, classes: 'rounded'})
	} else if (data.downloaded == 0 && ((data.downloaded + data.failed) >= data.size)) {
		$('#' + data.queueId).find('.eventBtn').html('<i class="material-icons">error</i>');
		$('#' + data.queueId).addClass('error');
		M.toast({html: `<i class="material-icons left">error</i>${quoteattr(data.name)} - Failed!`, displayLength: 5000, classes: 'rounded'})
	} else if ((data.downloaded + data.failed) >= data.size) {
		$('#' + data.queueId).find('.eventBtn').html('<i class="material-icons">warning</i>');
		$('#' + data.queueId).addClass('error');
		M.toast({html: `<i class="material-icons left">warning</i>${quoteattr(data.name)} - Completed with errors!`, displayLength: 5000, classes: 'rounded'})
	}
});

socket.on("downloadProgress", function (data) {
	//data.queueId -> id (string)
	//data.percentage -> float/double, percentage
	//updated in 1% steps
	$('#' + data.queueId).find('.determinate').css('width', data.percentage + '%');

});

socket.on("emptyDownloadQueue", function () {
	M.toast({html: '<i class="material-icons left">done_all</i>All downloads completed!', displayLength: 5000, classes: 'rounded'});
});

socket.on("cancelDownload", function (data) {
	//data.queueId		-> queueId of item which was canceled
	$('#' + data.queueId).addClass('animated fadeOutRight').on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
		$(this).remove();
		M.toast({html: '<i class="material-icons left">clear</i>One download removed!', displayLength: 5000, classes: 'rounded'})
	});
});

$('#clearTracksTable').click(function (ev) {
	$('#tab_downloads_table_downloads').find('tbody').find('.finished, .error').addClass('animated fadeOutRight').on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
		$(this).remove();
	});
	return false;
});

$('#cancelAllTable').click(function (ev) {
	let listOfIDs = $('#tab_downloads_table_downloads').find('tbody').find('tr').map((x,i)=>{
		return $(i).attr('id')
	}).get();
	socket.emit('cancelAllDownloads', {queueList: listOfIDs})
});

//****************************************************************************************************\\
//******************************************HELPER-FUNCTIONS******************************************\\
//****************************************************************************************************\\
/**
 * Replaces special characters with HTML friendly counterparts
 * @param s string
 * @param preserveCR preserves the new line character
 * @returns {string}
 */
function quoteattr(s, preserveCR) {
  preserveCR = preserveCR ? '&#13;' : '\n';
  return ('' + s) /* Forces the conversion to string. */
  	.replace(/&/g, '&amp;') /* This MUST be the 1st replacement. */
    .replace(/'/g, '&apos;') /* The 4 other predefined entities, required. */
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    /*
    You may add other replacements here for HTML only
    (but it's not necessary).
    Or for XML, only if the named entities are defined in its DTD.
    */
    .replace(/\r\n/g, preserveCR) /* Must be before the next replacement. */
    .replace(/[\r\n]/g, preserveCR);
    ;
}
/**
 * Given a spotify playlist URL or URI it returns the username of the owner of the playlist and the ID of the playlist
 * @param url URL or URI
 * @return string[] Array containing user and playlist id
 */
function getPlayUserFromURI(url){
	var spotyUser, playlistID;
	if ((url.startsWith("http") && url.indexOf('open.spotify.com/') >= 0)){
		if (url.indexOf('user') < 0 || url.indexOf('playlist') < 0){
			message('Playlist not found', 'The URL seems to be wrong. Please check it and try it again.');
			return [false,false];
		}
		if (url.indexOf('?') > -1) {
			url = url.substring(0, url.indexOf("?"));
		}
		spotyUser = url.slice(url.indexOf("/user/")+6);
		spotyUser = spotyUser.substring(0, spotyUser.indexOf("/"));
		playlistID = url.slice(url.indexOf("/playlist/")+10);
	} else if (url.startsWith("spotify:")){
		spotyUser = url.slice(url.indexOf("user:")+5);
		spotyUser = spotyUser.substring(0, spotyUser.indexOf(":"));
		playlistID = url.slice(url.indexOf("playlist:")+9);
	} else {
		return [false,false];
	}
	return [spotyUser, playlistID]
}

function getIDFromLink(link) {
	return link.substring(link.lastIndexOf("/") + 1);
}

function getTypeFromLink(link) {
	var type;
	if (link.indexOf('spotify') > -1){
		type = "spotifyplaylist";
	} else	if (link.indexOf('track') > -1) {
		type = "track";
	} else if (link.indexOf('playlist') > -1) {
		type = "playlist";
	} else if (link.indexOf('album') > -1) {
		type = "album";
	} else if (link.indexOf('artist')) {
		type = "artist";
	}
	return type;
}

function generateDownloadLink(url) {
	var btn_download = $('<a href="#" class="waves-effect btn-flat"><i class="material-icons">file_download</i></a>');
	$(btn_download).click(function (ev) {
		ev.preventDefault();
		addToQueue(url);
	});
	return btn_download;
}

function convertDuration(duration) {
	//convert from seconds only to mm:ss format
	var mm, ss;
	mm = Math.floor(duration / 60);
	ss = duration - (mm * 60);
	//add leading zero if ss < 0
	if (ss < 10) {
		ss = "0" + ss;
	}
	return mm + ":" + ss;
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}
