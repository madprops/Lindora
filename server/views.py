# -*- encoding: utf-8 -*-

import os
import re
import json
import ftplib
import shutil
import tempfile
from os import listdir
from os.path import isfile, join
from django.http import HttpResponseRedirect, HttpResponse
from django.shortcuts import render_to_response
from django.core.context_processors import csrf
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from server.models import *

root = "/home/yo/radide/"
home = "/home/yo/radide/home"

#root = "/home/localghost/webapps/lindora/radide"
#home = "/home/localghost/webapps/lindora/radide/home"

def log(s):
	with open(root + 'log', 'a') as log:
		log.write(str(s) + '\n\n');

def get_profile(request):
	return Profile.objects.get(user=request.user)

def create_c(request):
	c = {}
	c.update(csrf(request))
	c['user'] = request.user
	if request.user.is_authenticated():
		p = get_profile(request)
		c['theme'] = p.theme
		try:
			c['last_file'] = fullname(File.objects.filter(user=request.user).order_by('-last_accesed')[0])
		except:
			pass
	else:
		c['theme'] = "tomorrow_night_eighties"
	return c

def main(request):
	if not request.user.is_authenticated():
		return HttpResponseRedirect('/login/')
	c = create_c(request)
	return render_to_response('main.html', c)

def about(request):
	c = create_c(request)
	return render_to_response('about.html', c)

def test(request):
	c = create_c(request)
	return render_to_response('test.html', c)
	
def save_file(request):
	if not request.user.is_authenticated():
		request.user = User.objects.get(username="guest")
	status = "ok"
	name = request.POST['name']
	if name[-1] == '/':
		name = name[:-1]
	text = request.POST['text'].encode('utf-8')
	if '&' in name:
		server = name.split('&')[0]
		fname = name.split('&')[1]
		user = server.split('@')[0]
		host = server.split('@')[1]
		server = Server.objects.get(user=request.user, host=host,username=user)
		ftp = ftplib.FTP(server.host,server.username,server.password)
		fn = "" + request.user.username + str(datetime.datetime.now())
		with open (fn, "wb") as f:
			f.write(text)
		with open (fn, "r") as f:
			try:
				ftp.storbinary("stor " + fname, f)
			except:
				status = "error"
		os.remove(fn)
		try:
			ftp.quit()
		except:
			pass
	else:
		with open(home+name, 'wb') as f:
			f.write(text)
	data = {'status':status}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def login(request):
	c = {}
	c.update(csrf(request))
	if request.method == 'POST':
		if 'btnlogin' in request.POST:
			username = wash_string(request.POST['login_username'].lower().strip())
			password = request.POST['login_password']
			user = authenticate(username=username, password=password)
			if user is not None:
				if user.is_active:
					auth_login(request, user)
					return HttpResponseRedirect('/')
			else:
				c['msg1'] = 'wrong username or password'
		else:
			return register(request)
	return render_to_response('login.html', c)

def register(request):
	c = {}
	c.update(csrf(request))
	username = wash_string(request.POST['register_username'].lower().strip())
	password = request.POST['register_password'].strip()
	email = request.POST['register_email'].strip()
	if username == '' or password == '' or email == '':
		c['msg2'] = 'you must fill all the fields'
		return render_to_response('login.html', c)
	if not username:
		c['msg2'] = 'you must enter a valid username (no special characters or empty spaces)'
		return render_to_response('login.html', c)
	if not '@' in email:
		c['msg2'] = 'you must provide a valid email address'
		return render_to_response('login.html', c)
	try: 
		User.objects.get(username=username)
		c['msg2'] = 'this username already exists'
		return render_to_response('login.html', c)
	except:
		pass
	user = User.objects.create_user(username, 'no@email.com', password)
	p = Profile(user=user)
	p.theme = "tomorrow_night_eighties"
	session = Session(user=user, name='default', content=demo_session(user.username))
	session.save()
	p.current_session = session
	p.save()
	os.mkdir(home + '/' + user.username)
	os.system('cp -a ' + home + '/demo/. ' + home + '/' + user.username)
	user.backend='django.contrib.auth.backends.ModelBackend'
	auth_login(request, user)
	return HttpResponseRedirect('/')

def default_session():
	s = """
        <div id="container0" class="container" tabindex="1">
            <div id="outer_header0" class="outer_header unselectable" style="background-color: rgb(45, 45, 45); display: block;">
                <div id="header0" class="header" style="font-size: 18px; color: rgb(230, 230, 230); font-family: sans-serif;">
                <div class="selected_tab tab" id="0^new1" title="new1" onclick="show_main_menu()"> new1 </div>
    	</div>
            </div>
            <div class="editor ace_editor ace-tomorrow-night-eighties ace_dark" id="editor0" style="height: 405px; font-size: 18px;"></div>
            <input class="container_id" type="hidden" value="0">
        </div>
		"""
	return s

def demo_session(username):
	s = """
	<div id="container0" class="container" tabindex="1">
	            <div id="outer_header0" class="outer_header unselectable" style="background-color: rgb(45, 45, 45); display: block;">
	                <div id="header0" class="header" style="font-size: 18px; color: rgb(230, 230, 230); font-family: sans-serif;">
	        
	            
	                <div class="tab" id="0^/""" + username + """/views.py" title="/""" + username + """/views.py"> views.py </div>
	            
	        
	            
	                <div class="tab" id="0^/""" + username + """/main.html" title="/""" + username + """/main.html"> main.html </div>
	            
	        
	            
	                <div class="tab" id="0^/""" + username + """/base.js" title="/""" + username + """/base.js"> base.js </div>
	            
	        
	            
	                <div class="selected_tab tab" id="0^/""" + username + """/style.css" title="/""" + username + """/style.css"> style.css </div>
	            
	        
	    </div>
	            </div>
	            <div class="editor ace_editor ace-tomorrow-night-eighties ace_nobold ace_dark" id="editor0" style="height: 355px; font-size: 18px; display: block;"></div>
	            <input class="container_id" type="hidden" value="0">
	        </div>
    """
	return s

def clean_string(s):
	try:
		p = re.compile(r"[a-zA-Z0-9\ ]+")
		strlist = p.findall(s)
		if strlist:
			s = ''.join(strlist)
			if s == s:
				return s
			else:
				return False
		return False
	except:
		return False

def wash_string(s):
	try:
		p = re.compile(r"[a-zA-Z0-9]+")
		strlist = p.findall(s)
		if strlist:
			s2 = ''.join(strlist)
			if s == s2:
				return s
			else:
				return False
		return False
	except:
		return False

def ftp_files_to_html(request, files, directory, root, server):
	s = "<div id='ftp_files'>"
	if root != directory:
		last_pos = directory.rfind('/')
		last = directory[0:last_pos]
		s += "<a class='ftp_directory_link' href='#' onclick='open_ftp_file(\"" + server + "\",\"" + last + "\")'>" + directory + "</a>"
	else:
		s += "<a class='ftp_directory_link' href='#' onclick='show_ftp_server_picker();return false;'>" + directory + "</a>"
	s += "<hr>"
	for f in files:
		s += "<a class='ftp_file_link' href='#' onclick='open_ftp_file(\"" + server + "\",\"" + directory + "/" + f + "\")'>" + f + "</a>"
	s += "</div>"
	return s

def connect_new_server(request):
	if not request.user.is_authenticated():
		request.user = User.objects.get(username="guest")
	host = request.GET['host'].strip().lower()
	user = request.GET['user'].strip().lower()
	password = request.GET['password']
	status = 'ok'
	try:
		Server.objects.get(user=request.user, host=host, username=user, password=password)
	except:
		ftp = ftplib.FTP(host,user,password)
		s = Server(user=request.user, host=host, username=user, password=password)
		s.save()
		try:
			ftp.quit()
		except:
			pass
	name = user + "@" + host
	data = {'status':status, 'name':name}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def fetch(request):
	if not request.user.is_authenticated():
		request.user = User.objects.get(username="guest")
	servers = Server.objects.filter(user=request.user)
	ls = []
	for s in servers:
		ls.append(s.name())
	p = get_profile(request)
	session = p.current_session.content
	sl = get_sessionlist(request)
	urls = Url.objects.filter(user=request.user).order_by('-id')
	ul = []
	for u in urls:
		ul.append(u.name)
	data = {'status':'ok','servers':ls, 'session':session, 'sessions':sl, 'urls':ul}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def change_theme(request):
	name = request.GET['name']
	if request.user.is_authenticated():
		p = get_profile(request)
		p.theme = name
		p.save()
	data = {'status':'ok','name':name}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def logout(request):
	auth_logout(request)
	data = {'status':'ok'	}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def open_file(request):
	if not request.user.is_authenticated():
		request.user = User.objects.get(username="guest")
	status = "ok"
	name = request.GET['name']
	if name[-1] == '/':
		name = name[:-1]
	if '&' in name:
		server = name.split('&')[0]
		fname = name.split('&')[1]
		host = server.split('@')[1]
		user = server.split('@')[0]
		server = Server.objects.get(host=host,username=user,user=request.user)
		ftp = ftplib.FTP(server.host,server.username,server.password)
		fn = "" + request.user.username + str(datetime.datetime.now())
		with open (fn, "wb") as f:
			def callback(data):
				f.write(data)
			try:
				ftp.retrbinary('RETR ' + fname, callback)
			except:
				status = "error"
		with open (fn, "r") as f:
			datfile = f.read()
		os.remove(fn)
		try:
			ftp.quit()
		except:
			pass
	else:
		realpath = home + name
		with open(realpath, 'r') as f:
			datfile = f.read()
	try:
		f = File.objects.get(user=request.user,name=name)
		f.last_accesed = datetime.datetime.now()
		f.save()
	except:
		f = File(user=request.user,name=name, last_accesed=datetime.datetime.now())
		f.save()
	data = {'status':status, 'text':datfile, 'name':name}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def open_local_file(request):
	status = 'ok'
	if not request.user.is_authenticated():
		request.user = User.objects.get(username="guest")
	path = request.GET['path']
	realpath = home + path
	with open(realpath, 'r') as f:
		datfile = f.read()
	try:
		File.objects.get(user=request.user, name=path)
	except:
		f = File(user=request.user,name=path, last_accesed=datetime.datetime.now())
		f.save()
	data = {'fullname':path, 'status':status, 'text':datfile}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def check_extension(path):
	if path[-1] == '/':
		path = path[:-1]
	n = path.split('/').pop()
	if '.' in n:
		return n
	else:
		return False

def explorer(request):
	status = 'list'

	if not request.user.is_authenticated():
		request.user = User.objects.get(username="guest")
	datfile = ''
	files = []

	path = request.GET['path'].strip().replace("+ ", "")
	mode = request.GET['mode']
	action = request.GET['action']
	if not path.startswith('/' + request.user.username):
		path = '/' + request.user.username


	if path[-1] == '/':
		path = path[:-1]

	if 'mkfile ' in path.split('/')[-1]:
		path = path.replace('mkfile ', '')
		try:
			os.makedirs(home + os.path.split(path)[0]);
		except:
			pass
		open(home + path, "a")
		

	elif 'rmfile ' in path.split('/')[-1]:
		path = path.replace('rmfile ', '')
		try:
			os.remove(home + path);
			path = get_back(path)
		except:
			pass

	elif 'rmdir ' in path.split('/')[-1]:
		path = path.replace('rmdir ', '')
		try:
			shutil.rmtree(home + path)
			path = get_back(path)
		except:
			pass

	elif 'mkdir ' in path.split('/')[-1]:
		path = path.replace('mkdir ', '')
		try:
			os.makedirs(home + path)
		except:
			pass

	elif 'renfile ' in path.split('/')[-1]:
		path = path.replace('ren ', '')
		nf = path.split('/')[-1].split(' ')[-1]
		of = path.split('/')[-1].split(' ')[0]
		op = get_back(path) + '/' + of
		np = get_back(path) + '/' + nf
		os.rename(home + op, home + np);
		path = get_back(path)

	elif 'rendir ' in path.split('/')[-1]:
		path = path.replace('ren ', '')
		nf = path.split('/')[-1].split(' ')[-1]
		of = path.split('/')[-1].split(' ')[0]
		op = get_back(path) + '/' + of
		np = get_back(path) + '/' + nf
		os.rename(home + op, home + np);
		path = get_back(path)

	else:
		if mode == 'save_as' and action == 'save':
			try:
				os.makedirs(home + os.path.split(path)[0]);
			except:
				pass
			open(home + path, "a")
			try:
				f = File.objects.get(user=request.user,name=path)
				f.last_accesed = datetime.datetime.now()
				f.save()
			except:
				f = File(user=request.user,name=path, last_accesed=datetime.datetime.now())
				f.save()

	realpath = home + path

	try:
		filesx = os.listdir(realpath)
		for f in filesx:
			f = f.replace(" ", "")
			if os.path.isdir(os.path.join(realpath, f)):
				files.append('+ ' + f)
			else:
				files.append(f)
		files.sort()
		if path[-1] != '/':
			path = path + '/'
	except OSError as e:
		if '[Errno 20]' in str(e):
			status = 'open'
		elif '[Errno 2]' in str(e):
			status = 'nodir'
	back = get_back(path)
	data = {'path':path, 'status':status, 'files':files, 'file':datfile, 'back':back}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def open_ftp_file(request,path):
	status = 'ok'
	server_name = path.split('&')[0]
	name = path.split('&')[1]
	user = server_name.split('@')[0]
	host = server_name.split('@')[1]
	server = Server.objects.get(user=request.user, host=host,username=user)
	ftp = ftplib.FTP(server.host,server.username,server.password)
	root = ftp.pwd()
	if name != '':
		try:
			ftp.cwd(name)
		except:
			status = 'file'
			fn = "" + request.user.username + str(datetime.datetime.now())
			with open (fn, "wb") as f:
				def callback(data):
					f.write(data)
				ftp.retrbinary('RETR ' + name, callback)
			with open (fn, "r") as f:
				datfile = f.read()
			os.remove(fn)
			nf = ''
			try:
				nf = File.objects.get(user=request.user,name=path)
			except:
				nf = File(user=request.user,name=path,last_accesed=datetime.datetime.now())
				nf.save()
			data = {'text':datfile, 'status':status, name:nf.name}
			return HttpResponse(json.dumps(data), mimetype="application/json")
	files = ftp.nlst()
	directory = ftp.pwd()
	try:
		ftp.quit()
	except:
		pass
	return {'files':files, 'directory':directory, 'root':root, 'status':status}

def get_ftp_files(request,path):
	status = 'list'
	server_name = path.split('&')[0]
	name = path.split('&')[1]
	user = server_name.split('@')[0]
	host = server_name.split('@')[1]
	server = Server.objects.get(user=request.user, host=host,username=user)
	ftp = ftplib.FTP(server.host,server.username,server.password)
	root = ftp.pwd()
	files = []
	if name != '':
		try:
			ftp.cwd(name)
		except:
			files = ftp.nlst(get_ftp_back(path).split('&')[1])
			if name in files:
				status = 'open'
			else:
				status = 'nodir'
	filesx = ftp.nlst()
	for f in filesx:
		f = f.replace(" ", "")
		try:
			ftp.cwd(f)
			ftp.cwd('..')
			files.append('+ ' + f)
		except:
			files.append(f)
	files.sort()
	directory = ftp.pwd()
	try:
		ftp.quit()
	except:
		pass
	return {'files':files, 'directory':directory, 'root':root, 'status':status}

def ftp_explorer(request):
	status = 'list'

	if not request.user.is_authenticated():
		request.user = User.objects.get(username="guest")
	datfile = ''
	files = []

	path = request.GET['path'].strip().replace("+ ", "")
	mode = request.GET['mode']
	action = request.GET['action']

	if path[-1] == '/':
		path = path[:-1]

	if('&' not in path):
		path += '&'

	if 'mkfile ' in path.split('/')[-1]:
		path = path.replace('mkfile ', '')
		make_new_ftp_file(request,path)
		path = get_ftp_back(path)

	elif 'rmfile ' in path.split('/')[-1]:
		path = path.replace('rmfile ', '')
		delete_ftp_file(request,path)
		path = get_ftp_back(path)

	elif 'mkdir ' in path.split('/')[-1]:
		path = path.replace('mkdir ', '')
		make_new_ftp_directory(request,path)

	elif 'rmdir ' in path.split('/')[-1]:
		path = path.replace('rmdir ', '')
		delete_ftp_directory(request,path)
		path = get_ftp_back(path)

	elif 'renfile ' in path.split('/')[-1]:
		path = path.replace('ren ', '')
		nf = path.split('/')[-1].split(' ')[-1]
		of = path.split('/')[-1].split(' ')[0]
		op = get_back(path) + '/' + of
		np = get_back(path) + '/' + nf
		rename_ftp_file(request,op,np)
		path = get_back(path)

	elif 'rendir ' in path.split('/')[-1]:
		path = path.replace('ren ', '')
		nf = path.split('/')[-1].split(' ')[-1]
		of = path.split('/')[-1].split(' ')[0]
		op = get_back(path) + '/' + of
		np = get_back(path) + '/' + nf
		rename_ftp_file(request,op,np)
		path = get_back(path)

	else:
		if mode == 'save_as' and action == 'save':
			make_new_ftp_file(request,path)
			try:
				f = File.objects.get(user=request.user,name=path)
				f.last_accesed = datetime.datetime.now()
				f.save()
			except:
				f = File(user=request.user,name=path, last_accesed=datetime.datetime.now())
				f.save()

	ftp_data = get_ftp_files(request,path)
	status = ftp_data['status']
	if ftp_data['status'] == 'list':
		files = ftp_data['files']

	if path[-1] != '/' and path[-1] != '&':
		path = path + '/'

	if path.split('&')[1]:
		fake_path = path.split('&')[0] + ':/' + path.split('&')[1]
	else:
		fake_path = path.split('&')[0] + ':/'

	if fake_path[-1] != '/':
		fake_path = fake_path + '/'
	back = get_ftp_back(path)
	data = {'path':path, 'status':status, 'files':files, 'file':datfile, 'fake_path':fake_path, 'back':back}
	return HttpResponse(json.dumps(data), mimetype="application/json")

def get_ftp(request, server):
	username = server.split('@')[0]
	host = server.split('@')[1]
	server = Server.objects.get(username=username,host=host,user=request.user)
	return ftplib.FTP(server.host,server.username,server.password)

def rename_ftp_file(request,op,np):
	on = op.split('&')[1]
	nn = np.split('&')[1]
	server = op.split('&')[0]
	ftp = get_ftp(request, server)
	ftp.rename(on,nn)

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
