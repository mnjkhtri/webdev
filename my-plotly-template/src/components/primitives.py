import uuid
from dash import html, dcc, Input, callback

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

_VARIANT_COLORS = {
    "primary": ("var(--primary)", "var(--primary-foreground)"),
    "secondary": ("var(--secondary)", "var(--secondary-foreground)"),
    "muted": ("var(--muted)", "var(--muted-foreground)"),
    "accent": ("var(--accent)", "var(--accent-foreground)"),
    "destructive": ("var(--destructive)", "var(--destructive-foreground)"),
}

DROPDOWN_CLASSNAME = "dcc-dropdown"

def Card(children, elevation=3, **kwargs):
    """A container with border, background, and configurable elevation."""
    shadow_levels = {
        0: "none",
        1: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24), 0 1px 3px rgba(255,255,255,0.06) inset",
        2: "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23), 0 1px 3px rgba(255,255,255,0.08) inset",
        3: "0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23), 0 1px 4px rgba(255,255,255,0.1) inset",
    }
    style = {
        "border": "1px solid var(--border)",
        "borderRadius": "12px",
        "backgroundColor": "var(--card, var(--background))",
        "color": "var(--card-foreground, var(--foreground))",
        "margin": "12px 0",
        "overflow": "hidden",
        "boxShadow": shadow_levels.get(elevation, shadow_levels[1]),
        "transition": "box-shadow 0.3s ease-in-out",
    }
    style.update(kwargs.pop("style", {}))
    return html.Div(children, style=style, **kwargs)

def CardHeader(children, align="left", **kwargs):
    alignment = {
        "left": "flex-start",
        "center": "center",
        "right": "flex-end"
    }.get(align, "center")
    
    style = {
        "padding": "12px 16px",
        "borderBottom": "1px solid var(--border)",
        "fontWeight": "500",
        "fontSize": "16px",
        "display": "flex",
        "alignItems": "center",
        "justifyContent": alignment,
        "textAlign": align,
    }
    style.update(kwargs.pop("style", {}))
    return html.Div(children, style=style, **kwargs)

def CardBody(children, **kwargs):
    style = {
        "padding": "24px",
    }
    style.update(kwargs.pop("style", {}))
    return html.Div(children, style=style, **kwargs)

def CardFooter(children, align="right", **kwargs):
    alignment = {
        "left": "flex-start",
        "center": "center",
        "right": "flex-end"
    }.get(align, "right")
    
    style = {
        "padding": "12px 16px",
        "borderTop": "1px solid var(--border)",
        "display": "flex",
        "alignItems": "center",
        "justifyContent": alignment,
        "gap": "12px",
    }
    style.update(kwargs.pop("style", {}))
    return html.Div(children, style=style, **kwargs)

def Badge(children, variant: str = "primary", **kwargs):
    bg, fg = _VARIANT_COLORS.get(variant, _VARIANT_COLORS["primary"])
    style = {
        "display": "inline-flex",
        "alignItems": "center",
        "borderRadius": "9999px",
        "fontSize": "12px",
        "fontWeight": "500",
        "padding": "4px 8px",
        "margin": "0 4px 4px 0",
        "backgroundColor": bg,
        "color": fg,
    }
    style.update(kwargs.pop("style", {}))
    return html.Span(children, style=style, **kwargs)

def _button_variant_styles(variant: str):
    """Return background / border / text colors for the given variant."""
    if variant in _VARIANT_COLORS:  # primary, secondary, muted, accent, destructive
        bg, fg = _VARIANT_COLORS[variant]
        return {
            "backgroundColor": bg,
            "color": fg,
            "border": "none",
        }
    return {
        "outline": {
            "backgroundColor": "transparent",
            "border": "1px solid var(--border)",
            "color": "var(--foreground)",
        },
        "ghost": {
            "backgroundColor": "transparent",
            "border": "none",
            "color": "var(--foreground)",
        },
    }.get(variant, _button_variant_styles("primary"))

def _button_size_styles(size: str):
    sizes = {
        "xs": {"padding": "0 8px", "height": "28px", "fontSize": "12px"},
        "sm": {"padding": "0 12px", "height": "32px", "fontSize": "14px"},
        "md": {"padding": "0 16px", "height": "40px", "fontSize": "14px"},
        "lg": {"padding": "0 24px", "height": "44px", "fontSize": "16px"},
    }
    return sizes.get(size, sizes["sm"])

def Button(children, variant: str = "primary", size: str = "sm", on_click=None, **kwargs):
    if "id" in kwargs and kwargs["id"] is not None:
        elem_id = kwargs["id"]
    else:
        elem_id = str(uuid.uuid4())
        kwargs["id"] = elem_id
    style = {
        "display": "inline-flex",
        "alignItems": "center",
        "justifyContent": "center",
        "borderRadius": "6px",
        "fontWeight": "500",
        "cursor": "pointer",
        "margin": "0 8px 8px 0",
        **_button_variant_styles(variant),
        **_button_size_styles(size),
    }
    style.update(kwargs.pop("style", {}))
    button = html.Button(
        children, 
        style=style, 
        **kwargs
    )
    if on_click:
        @callback(Input(elem_id, "n_clicks"), prevent_initial_call=True)
        def _fire(_):
            on_click()
    return button

def Checklist(options, variant="primary", **kwargs):
    bg, _ = _VARIANT_COLORS.get(variant, _VARIANT_COLORS["primary"])
    style = {
        "display": "flex",
        "flexDirection": "row",
        "flexWrap": "wrap",
        "gap": "12px",
        "padding": "4px 0",
        "margin": "4px 0",
    }
    inputStyle = {
        "cursor": "pointer",
        "width": "18px",
        "height": "18px",
        "accentColor": bg,
    }
    labelStyle = {
        "display": "inline-flex",
        "alignItems": "center",
        "gap": "8px",
        "padding": "2px 4px",
        "color": "var(--foreground)",
        "fontSize": "14px",
        "cursor": "pointer",
        "userSelect": "none",
        "transition": "color 0.2s ease",
    }
    return dcc.Checklist(
        options=options, 
        inline=True, 
        style=style, 
        inputStyle=inputStyle, 
        labelStyle=labelStyle, 
        **kwargs
    )

def Dropdown(options, placeholder: str = "", clearable=True, searchable=True, multi=False, **kwargs):
    style={
        "border": "1px solid var(--input)",
        "borderRadius": "6px",
        "backgroundColor": "var(--background)",
        "color": "var(--foreground)",
        "fontSize": "14px",
    }
    return dcc.Dropdown(
        options=options,
        placeholder=placeholder,
        style=style,
        clearable=clearable,
        searchable=searchable,
        multi=multi,
        className=DROPDOWN_CLASSNAME,
        **kwargs
    )

def InputArea(placeholder: str = "", variant="default", **kwargs):
    variants = {
        "default": {"border": "1px solid var(--input)"},
        "filled": {"backgroundColor": "var(--muted)", "border": "1px solid transparent"},
        "flushed": {"borderTop": "none", "borderLeft": "none", "borderRight": "none", "borderRadius": "0", "borderBottom": "1px solid var(--input)"},
        "unstyled": {"border": "none"},
    }
    variant_style = variants.get(variant, variants["default"])
    style = {
        "width": "100%",
        "borderRadius": "8px",
        "outline": "none",
        "transition": "border-color 0.2s, box-shadow 0.2s",
        "backgroundColor": "var(--background)",
        "color": "var(--foreground)",
        "height": "32px", 
        "fontSize": "14px", 
        "padding": "0 12px",
        **variant_style
    }
    style.update(kwargs.pop("style", {}))
    return dcc.Input(placeholder=placeholder, value="", style=style, **kwargs)

def TextArea(placeholder: str = "", rows: int = 3, variant="default", **kwargs):
    variants = {
        "default": {"border": "1px solid var(--input)"},
        "filled": {"backgroundColor": "var(--muted)", "border": "1px solid transparent"},
        "flushed": {"borderTop": "none", "borderLeft": "none", "borderRight": "none", "borderRadius": "0", "borderBottom": "1px solid var(--input)"},
        "unstyled": {"border": "none"},
    }
    variant_style = variants.get(variant, variants["default"])
    style = {
        "width": "100%",
        "borderRadius": "8px",
        "padding": "12px 14px",
        "fontSize": "14px",
        "margin": "8px 0",
        "minHeight": f"80px",
        "lineHeight": "1.5",
        "resize": "vertical",
        "outline": "none",
        "transition": "border-color 0.2s, box-shadow 0.2s",
        "backgroundColor": "var(--background)",
        "color": "var(--foreground)",
        **variant_style,
    }
    style.update(kwargs.pop("style", {}))
    return dcc.Textarea(placeholder=placeholder, value="", rows=rows, style=style, **kwargs)

### Form Elements:

def Form(children, **kwargs):
    style = {
        "display": "flex",
        "gap": "16px",
        "width": "100%",
        "flexDirection": "column",
    }
    style.update(kwargs.pop("style", {}))
    return html.Form(children, style=style, **kwargs)

def FormRow(children, wrap=False, **kwargs):
    equal_children = [html.Div(c, style={
        "flex": "1 1 0",
        "minWidth": "0" if not wrap else "200px",
    }) for c in children]
    style = {
        "display": "flex",
        "flexDirection": "row",
        "alignItems": "stretch",
        "gap": "12px",
        "width": "100%",
        "flexWrap": "wrap" if wrap else "nowrap",
    }
    style.update(kwargs.pop("style", {}))
    return html.Div(equal_children, style=style, **kwargs)

def FormItem(control, label=None, **kwargs):
    style = {
        "display": "flex",
        "flexDirection": "column",
        "gap": "6px",
        "width": "100%",
        **kwargs.pop("style", {}),
    }
    children = []
    if label is not None:
        children.append(
            html.Label(
                label,
                style={
                    "fontSize": "14px",
                    "fontWeight": "500",
                    "color": "var(--foreground)",
                },
            )
        )
    children.append(control)
    return html.Div(children, style=style, **kwargs)
