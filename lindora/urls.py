import os
from django.conf.urls import patterns, include, url
from django.contrib import admin
admin.autodiscover()

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),
    (r'^site_media/(?P<path>.*)$', 'django.views.static.serve', {'document_root':os.path.join(BASE_DIR, 'media')}),
    (r'^save_file/$', 'server.views.save_file'),
    (r'^login/$', 'server.views.login'),
    (r'^logout/$', 'server.views.logout'),
    (r'^get_settings/$', 'server.views.get_settings'),
    (r'^test/$', 'server.views.test'),
    (r'^about/$', 'server.views.about'),
    (r'^login/$', 'server.views.login'),
    (r'^register/$', 'server.views.register'),
    (r'^connect_new_server/$', 'server.views.connect_new_server'),
    (r'^fetch/$', 'server.views.fetch'),
    (r'^change_theme/$', 'server.views.change_theme'),
    (r'^explorer/$', 'server.views.explorer'),
    (r'^ftp_explorer/$', 'server.views.ftp_explorer'),
    (r'^open_file/$', 'server.views.open_file'),
    (r'^save_editor_settings/$', 'server.views.save_editor_settings'),
    (r'^save_header_settings/$', 'server.views.save_header_settings'),
    (r'^save_behaviour_settings/$', 'server.views.save_behaviour_settings'),
    (r'^save_session/$', 'server.views.save_session'),
    (r'^rename_session/$', 'server.views.rename_session'),
    (r'^new_session/$', 'server.views.new_session'),
    (r'^remove_session/$', 'server.views.remove_session'),
    (r'^change_session/$', 'server.views.change_session'),
    (r'^save_url/$', 'server.views.save_url'),
    (r'^get_urls/$', 'server.views.get_urls'),
    (r'^$', 'server.views.main'),

)