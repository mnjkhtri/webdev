from dash import html, dcc
import pandas as pd
import plotly.express as px
from typing import List, Union, Optional

"""
Design tokens (color only; font-size and spacing handled inline in Dash).
"""

MONO_FONT_FAMILY = "'Menlo', 'Consolas', 'Courier New', monospace"

# Define fallback color themes
FALLBACK_COLORS = {
    'dark': {
        'background': '#18181b',
        'foreground': '#e4e4e7',
        'primary': '#a78bfa',
        'primary_fg': '#18181b',
        'accent': '#60a5fa',
        'border': '#3f3f46',
        'muted_fg': '#a1a1aa',
        'plot_colorway': ['#a78bfa', '#4ade80', '#facc15', '#fb7185', '#818cf8', '#f472b6', '#60a5fa']
    },
    'light': {
        'background': '#ffffff',
        'foreground': '#3f3f46',
        'primary': '#8b5cf6',
        'primary_fg': '#ffffff',
        'accent': '#3b82f6',
        'border': '#e4e4e7',
        'muted_fg': '#71717a',
        'plot_colorway': ['#8b5cf6', '#22c55e', '#eab308', '#f43f5e', '#6366f1', '#ec4899', '#3b82f6']
    }
}


def create_custom_template(theme: str = 'light') -> dict:
    """
    Creates a custom Plotly template dictionary.
    """
    colors = FALLBACK_COLORS.get(theme, FALLBACK_COLORS['light'])
    return {
        'layout': {
            'paper_bgcolor': colors['background'],
            'plot_bgcolor': colors['background'],
            'font': {'family': MONO_FONT_FAMILY, 'color': colors['foreground']},
            'title': {
                'font': {'family': MONO_FONT_FAMILY, 'color': colors['foreground'], 'size': 16},
                'x': 0.05
            },
            'legend': {
                'font': {'family': MONO_FONT_FAMILY, 'color': colors['foreground']},
                'bgcolor': colors['background'],
                'bordercolor': colors['border'],
                'borderwidth': 1
            },
            'colorway': colors['plot_colorway'],
            'xaxis': {
                'gridcolor': colors['border'], 'zerolinecolor': colors['border'], 'showgrid': False,
                'tickfont': {'family': MONO_FONT_FAMILY, 'color': colors['foreground']},
                'title': {'font': {'family': MONO_FONT_FAMILY, 'color': colors['muted_fg']}}
            },
            'yaxis': {
                'gridcolor': colors['border'], 'zerolinecolor': colors['border'], 'showgrid': False,
                'tickfont': {'family': MONO_FONT_FAMILY, 'color': colors['foreground']},
                'title': {'font': {'family': MONO_FONT_FAMILY, 'color': colors['muted_fg']}}
            },
            'hoverlabel': {
                'font': {'family': MONO_FONT_FAMILY, 'color': colors['primary_fg']},
                'bgcolor': colors['primary']
            }
        }
    }


def Graph(
    df: pd.DataFrame,
    graph_type: str = 'line',
    x_column: Optional[str] = None,
    y_columns: Optional[Union[str, List[str]]] = None,
    group_by_column: Optional[str] = None,
    title: Optional[str] = None,
    theme: str = 'light',
    **kwargs
) -> html.Div:
    """
    Reusable Dash component for Plotly Express-only graphs.
    If height and width are None, the graph attempts to fill its parent container.
    """
    if isinstance(y_columns, str):
        y_columns = [y_columns]
    
    if df.empty:
        fig = px.line(title="No data to display")
    else:
        fig = px.line(title="Column not available")
        if x_column is None or x_column not in df.columns:
            return html.Div(children=[dcc.Graph(figure=fig)])
        if y_columns:
            for ycol in y_columns:
                if ycol not in df.columns:
                    return html.Div(children=[dcc.Graph(figure=fig)])

        # Base arguments for Plotly Express functions
        base_px_args = {"x": x_column, **kwargs}

        # Create the figure object based on graph_type
        current_px_args = base_px_args.copy()

        if graph_type == 'line':
            current_px_args['y'] = y_columns[0] if len(y_columns) == 1 and not group_by_column else y_columns
            if group_by_column and len(y_columns) == 1:
                current_px_args['color'] = group_by_column
            fig = px.line(df, **current_px_args)
        elif graph_type == 'bar':
            current_px_args['y'] = y_columns[0] if len(y_columns) == 1 and not group_by_column else y_columns
            if group_by_column and len(y_columns) == 1:
                current_px_args['color'] = group_by_column
            fig = px.bar(df, **current_px_args)
        elif graph_type == 'scatter':
            current_px_args['y'] = y_columns[0] # Scatter typically uses one y-column
            if group_by_column:
                current_px_args['color'] = group_by_column
            fig = px.scatter(df, **current_px_args)
        elif graph_type == 'histogram':
            current_px_args.pop('y', None) # Ensure 'y' is not passed from base_px_args if it was inferred
            if group_by_column:
                current_px_args['color'] = group_by_column
            fig = px.histogram(df, **current_px_args)
        else:
            current_px_args['y'] = y_columns[0] if len(y_columns) == 1 and not group_by_column else y_columns
            if group_by_column and len(y_columns) == 1:
                current_px_args['color'] = group_by_column
            fig = px.line(df, **current_px_args)

    base_template_dict = create_custom_template(theme)
    fig.update_layout(template=base_template_dict)

    figure_layout_overrides = {}
    figure_layout_overrides['autosize'] = True
    fig.update_layout(**figure_layout_overrides)

    outer_div_style = {
        'height': '100%',
        'width': '100%',
    }

    # Style for the dcc.Graph component itself:
    dcc_graph_style = {
        'height': '100%',
        'width': '100%',
        'borderRadius': '8px', # Kept from original
        'border': f"1px solid {FALLBACK_COLORS[theme]['border']}"
    }

    return html.Div(
        style=outer_div_style,
        children=[
            dcc.Graph(
                figure=fig,
                style=dcc_graph_style,
                config={
                    'displayModeBar': True,
                    'displaylogo': False,
                    'responsive': True,
                    'modeBarButtonsToRemove': ['select2d', 'lasso2d', 'autoScale2d']
                }
            )
        ]
    )