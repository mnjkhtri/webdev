from flask import Flask, render_template

app = Flask(__name__, static_url_path='', static_folder='static', template_folder='templates')
# app = Flask(__name__)

@app.route('/')
def index():
	return render_template('index.html')

@app.route('/hello')
def hello():
    return '<h1>Hello World!</h1>'

@app.route('/hello/<name>')
def hello_custom(name):
    return '<h1>Hello %s!</h1>' % name

@app.route('/bad_request')
def bad_request():
	return '<h1>Bad Request</h1>', 400

from flask import make_response
@app.route('/response')
def response():
	response = make_response('<h1>This is a response that set a cookie</h1>')
	response.set_cookie('answer', '42')
	return response

@app.errorhandler(404)
def page_not_found(e):
	return render_template('404.html', quote="wassup?"), 404
	
@app.errorhandler(500)
def internal_server_error(e):
	return render_template('500.html'), 500

if __name__ == '__main__':
    app.run(debug=True)