from django.db import models
from django.contrib.auth.models import User
import datetime

class Server(models.Model):
	user = models.ForeignKey(User,related_name='serveruser')
	host = models.CharField(max_length=100)
	username = models.CharField(max_length=100)
	password = models.CharField(max_length=100)
	def name(self):
		return self.username + "@" + self.host

class File(models.Model):
	user = models.ForeignKey(User,related_name='openfileuser')
	name = models.CharField(max_length=200)
	last_accesed = models.DateTimeField(default=datetime.datetime.now())
	last_saved = models.DateTimeField(null=True)

class Session(models.Model):
	user = models.ForeignKey(User, related_name='sessionuser')
	content = models.TextField(max_length=10000)
	name = models.CharField(max_length=100)

class Url(models.Model):
	name = models.CharField(max_length=200)
	user = models.ForeignKey(User, related_name='urluser')

class Profile(models.Model):
	user = models.ForeignKey(User)
	theme = models.CharField(max_length=50)
	editor_font_size = models.CharField(max_length=50, null=True)
	header_font_size = models.CharField(max_length=50, null=True)
	header_font_color = models.CharField(max_length=50, null=True)
	header_font_family = models.CharField(max_length=50, null=True)
	header_background_color = models.CharField(max_length=50, null=True)
	header_visible = models.CharField(max_length=50, null=True)
	autosave = models.CharField(max_length=50, null=True)
	keyboard_mode = models.CharField(max_length=50, null=True)
	show_gutter = models.CharField(max_length=50, null=True)
	show_line_numbers = models.CharField(max_length=50, null=True)
	current_session = models.ForeignKey(Session)
