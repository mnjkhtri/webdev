import dash
from dash import html

dash.register_page(__name__, path="/ping", name="Ping")

layout = html.Div("Pong", style={'height': '500px'})