Lindora
=======

Online Code Editor

[Live Demo](http://lindora.brostack.com)

[Video Demostration](https://www.youtube.com/watch?v=Te5FTY6YWto)

[![click to see video](http://i.imgur.com/ioQJ5Jo.jpg)](http://i.imgur.com/ioQJ5Jo.jpg)

## Features
- Work directly from your server through sFTP
- Code autocompletion
- Split windows infinitely
- Save sessions that remember your files and layout
- Built-in file explorer
- Tools to aid development
- Very customizable appearance
- Vim and emacs keyboard mode

## Running

Lindora is built on Django in python2, tested 1.8.* and 1.9.* and a big part of it is built in javascript/Jquery with a lot of help from Handlebars for rendering templates. 
It depends on the Ace editor and JqueryUI. All files needed are included except pysftp which you must install with pip.

To run: 
- Install Django
- Install pysftp with pip
- Run python manage.py migrate
- Run python manage.py makemigrations server
- Run python migrate server

(The sequence of the migrations may not work sometimes and you might have to try a different approach)

Then just:
- python manage.py runserver (unless you're running it in production which you will need to do something entirely different)

You may have to give permissions to the directories for write access.

This is what I do in production:

- chown www-data:www-data /var/www/lindora/db.sqlite3
- chown www-data:www-data /var/www/lindora/
- chown www-data:www-data /var/www/lindora/home/

## License

Released under the GNU Affero Public License Version 3