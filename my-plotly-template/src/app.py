# app.py
import dash
from src.components.layout import create_main_layout, register_layout_callbacks

app = dash.Dash(
    __name__, 
    use_pages=True,
    suppress_callback_exceptions=True, 
    assets_folder='assets'
)
server = app.server

app.layout = create_main_layout()
register_layout_callbacks(app)

if __name__ == '__main__':
    app.run(port=8080, debug=True)