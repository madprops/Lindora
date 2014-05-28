def make_new_ftp_file(request,path):
	name = path.split('&')[1]
	server = path.split('&')[0]
	ftp = get_ftp(request, server)
	fn = "" + request.user.username + str(datetime.datetime.now())
	files = get_ftp_files(request, get_ftp_back(path))['files']
	if name.split('/')[-1] in files:
		return False
	open(fn, "a")
	with open (fn, "r") as f:
		ftp.storbinary("stor " + name, f)
	os.remove(fn)

def delete_ftp_file(request,path):
	name = path.split('&')[1]
	server = path.split('&')[0]
	ftp = get_ftp(request, server)
	ftp.delete(name)

def make_new_ftp_directory(request,path):
	name = path.split('&')[1]
	server = path.split('&')[0]
	ftp = get_ftp(request, server)
	ftp.mkd(name)

def delete_ftp_directory(request, path):
	name = path.split('&')[1]
	server = path.split('&')[0]
	ftp = get_ftp(request, server)
	rtree_ftp(ftp, name)

def rtree_ftp(ftp, path):
	wd = ftp.pwd()
	try:
		names = ftp.nlst(path)
	except ftplib.all_errors as e:
		return
	for name in names:
		if os.path.split(name)[1] in ('.', '..'): continue
		try:
			ftp.cwd(name)
			ftp.cwd(wd)
			rtree_ftp(ftp, name)
		except ftplib.all_errors:
			ftp.delete(name)
	try:
		ftp.rmd(path)
	except:
		pass

def get_back(path):
	if path[-1] == '/':
		path = path[:-1]
	return '/'.join(path.split('/')[:-1])

def get_ftp_back(path):
	if path[-1] == '/':
		path = path[:-1]
	if len(path.split('&')[0]) == len(path) - 1:
		return ''
	if not '/' in path:
		return path.split('&')[0] + '&'
	return '/'.join(path.split('/')[:-1])

def get_settings(request):
	if not request.user.is_authenticated():
		request.user = User.objects.get(username="guest")
	profile = get_profile(request)
	data = {
		'status':'ok',
		'theme':profile.theme,
		'editor_font_size':profile.editor_font_size,
		'header_font_size':profile.header_font_size,
		'header_font_color':profile.header_font_color,
		'header_font_family':profile.header_font_family,
		'header_background_color':profile.header_background_color,
		'header_visible':profile.header_visible,
		'autosave':profile.autosave,
		'show_gutter':profile.show_gutter,
		'show_line_numbers':profile.show_line_numbers,
		'keyboard_mode':profile.keyboard_mode,
	}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def save_header_settings(request):
	p = get_profile(request)
	p.header_font_size = request.GET['header_font_size']
	p.header_font_color = request.GET['header_font_color']
	p.header_font_family = request.GET['header_font_family']
	p.header_background_color = request.GET['header_background_color']
	p.save()
	data = {'status':'ok'}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def save_editor_settings(request):
	p = get_profile(request)
	p.theme = request.GET['theme']
	p.editor_font_size = request.GET['editor_font_size']
	p.show_gutter = request.GET['show_gutter']
	p.keyboard_mode = request.GET['keyboard_mode']
	p.save()
	data = {'status':'ok'}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def save_behaviour_settings(request):
	p = get_profile(request)
	p.autosave = request.GET['autosave']
	p.save()
	data = {'status':'ok'}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def remove_file(request):
	if not request.user.is_authenticated():
		request.user = User.objects.get(username="guest")
	name = request.GET['name']
	f = File.objects.get(user=request.user, name=name)
	f.delete()
	data = {'status':'ok'}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def save_session(request):
	content = request.POST['content']
	p = get_profile(request)
	p.current_session.content = content
	p.current_session.save()
	return HttpResponse('ok')

def rename_session(request):
	old_name = request.POST['old_name'].strip()
	new_name = clean_string(request.POST['new_name'].strip())
	if new_name != '' and new_name:
		session = Session.objects.get(name=old_name, user=request.user)
		session.name = new_name;
		session.save()
		status = 'ok'
	else:
		status = 'error'
	data = {'status':status, 'sessions':get_sessionlist(request)}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def new_session(request):
	last_id = Session.objects.filter(user=request.user).order_by('-id')[0].id
	session = Session(user=request.user, name='new session ' + str(last_id), content=default_session())
	session.save()
	p = get_profile(request)
	p.current_session = session
	p.save()
	status = 'ok'
	data = {'status':status}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def remove_session(request):
	name = request.POST['name'].strip()
	log(name)
	sessions = Session.objects.filter(name=name, user=request.user)
	for s in sessions:
		s.delete()
	status = 'ok'
	data = {'status':status, 'sessions':get_sessionlist(request)}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def get_sessionlist(request):
	sessions = Session.objects.filter(user=request.user)
	session_list = []
	for session in sessions:
		session_list.append(session.name)
	return session_list

def change_session(request):
	name = request.POST['name'].strip()
	session = Session.objects.get(name=name, user=request.user)
	p = get_profile(request)
	p.current_session = session
	p.save()
	status = 'ok'
	data = {'status':status}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def save_url(request):
	name = request.POST['url'];
	urls = Url.objects.filter(user=request.user, name=name)
	for u in urls:
		if u.name == name:
			u.delete()
	url = Url(user=request.user, name=name)
	url.save()
	status = 'ok'
	data = {'status':status}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def get_urls(request):
	urls = Url.objects.filter(user=request.user).order_by('-id')
	ul = []
	for u in urls:
		ul.append(u.name)
	status = 'ok'
	data = {'status':status, 'urls':ul}
	return HttpResponse(json.dumps(data), mimetype="application/json")
