from dash import html, dash_table
import pandas as pd

"""
Reusable Dash components that follow the design-token system defined in `globals.css`.

Design tokens (color only; font‑size and spacing are handled inline).
-----------------------------------------------------------------
--background              --foreground
--primary                 --primary-foreground
--secondary               --secondary-foreground
--muted                   --muted-foreground
--accent                  --accent-foreground
--destructive             --destructive-foreground
--border                  --input
--font-sans               --font-mono
"""

DASHTABLE_CLASSNAME = 'dcc-dash-table'

def Table(df: pd.DataFrame, page_size: int = 10, **kwargs):
    columns = [{"name": c, "id": c} for c in df.columns]
    data    = df.to_dict("records")

    STYLE_TABLE = {
        "overflowY": "auto",
        "width": "100%",
        "border": "1px solid var(--border)",
        "borderRadius": "8px",
        "backgroundColor": "var(--background)",
    }

    STYLE_HEADER = {
        "backgroundColor": "var(--background)",
        "fontWeight": "600",
        "fontSize": "14px",
        "borderBottom": "2px solid var(--border)",
        "color": "var(--foreground)",
        "textAlign": "left",
        "padding": "10px 12px",
    }

    STYLE_CELL = {
        "fontFamily": "var(--font-mono)",
        'padding': '1px 5px',
        "textAlign": "left",
        "fontSize": "14px",
        "color": "var(--foreground)",
        "whiteSpace": "normal",
        "height": "auto",
        'minWidth': '100px',
        'maxWidth': '180px',
        "backgroundColor": "var(--background)",
        "borderColor": "var(--border)",
    }

    STYLE_DATA = {
        "color": "var(--foreground)",
    }


    return html.Div(
        className=DASHTABLE_CLASSNAME,
        style={'margin': '25px 0'},
        children=[
            dash_table.DataTable(
                data=data,
                columns=columns,
                page_size=page_size,

                sort_action="native",

                virtualization=True,
                fixed_rows={'headers': True, 'data': 0},

                style_table=STYLE_TABLE,
                style_header=STYLE_HEADER,
                style_cell=STYLE_CELL,
                style_data=STYLE_DATA,

                **kwargs,
            )
        ]
    )