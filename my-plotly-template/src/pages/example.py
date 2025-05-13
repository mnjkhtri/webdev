import json
import dash
from dash import html, Input, Output, State, ctx
from src.components.primitives import (
    Card, CardHeader, CardBody, CardFooter,
    Badge, 
    Button, 
    Checklist,
    Dropdown,
    InputArea,
    TextArea,
    Form,
    FormRow,
    FormItem
)
from src.components.toast import Toast

dash.register_page(__name__, path="/example", name="example")

# App layout
layout = html.Div([
    
    # Button examples
    Card([
        CardHeader("Buttons"),
        CardBody([
            html.Div([
                Button("Primary Button", variant="primary", size="xs", on_click=lambda: print("Button says Hi!")),
                Button("Outline Button", variant="outline", size="xs"),
                Button("Ghost Button", variant="ghost", size="xs"),
                Button("Small", variant='outline', size="sm"),
                Button("Medium", variant='outline', size="md"),
                Button("Large", variant='outline', size="lg"),
            ])
        ])
    ]),
    
    # Badges
    Card([
        CardHeader("Badges", align='center'),
        CardBody([
            html.Div([
                Badge("Primary Badge", variant="primary"),
                Badge("Secondary Badge", variant="secondary"),
                Badge("Muted Badge", variant="muted"),
                Badge("Accent Badge", variant="accent"),
                Badge("Descrutive Badge", variant="destructive"),
            ])
        ])
    ], elevation=1),

    # Forms
    Card([
        CardHeader("Forms"),

        CardBody([
            Form([

                    FormRow([
                        FormItem(InputArea(placeholder="Jane", id="first_name"), label='First Name'),
                        FormItem(InputArea(placeholder="Austin", id="last_name"), label='Last Name'),
                    ]),

                    FormItem(TextArea(placeholder="Your message goes here", id="message"), label='Message'),

                    FormItem(Dropdown(placeholder='Pick one.', options=['Male', 'Female'], id="gender"), label='Gender'),

                    FormItem(Checklist(options=[{'label': 'Subscribe to my newsletter.', 'value': 'subscribe'}], id="subscribe"))
            ])
        ]),

        CardFooter([
            Button("Submit", variant='primary', id='form-submit'),
            Button("Cancel", variant='ghost', id='form-cancel')
        ])

    ]),

    Toast.layout()

    
], style={'maxWidth': '700px', 'margin': '0 auto', 'padding': '20px'})

Toast.register_callbacks(dash.get_app())

@dash.callback(

    Output("first_name", "value"),
    Output("last_name",  "value"),
    Output("message",    "value"),
    Output("gender",     "value"),
    Output("subscribe",  "value"),
    Output(Toast.get_store_id(), 'data'),

    Input("form-submit", "n_clicks"),
    Input("form-cancel", "n_clicks"),

    State("first_name",  "value"),
    State("last_name",   "value"),
    State("message",     "value"),
    State("gender",      "value"),
    State("subscribe",   "value"),
    prevent_initial_call=True,
)
def handle_form(submit_, cancel_, first_name, last_name, message, gender, subscribe):
    triggered_id = ctx.triggered_id
    if triggered_id == "form-submit" and submit_:
    
        payload = {
            "first_name": first_name,
            "last_name":  last_name,
            "message":    message,
            "gender":     gender,
            "subscribe":  subscribe,
        }

        print("📨  Form submitted:")
        print(json.dumps(payload, indent=3))

        toast_output = Toast.generate_a_toast(
            f"Thank you for feedback, {first_name or 'Anon'}!", 
            delay=1000,
        )

        return "", "", "", None, [], toast_output

    elif triggered_id == "form-cancel" and cancel_:

        return "", "", "", None, [], None

    # initial trigger when 
    else:
        return "", "", "", None, [], None