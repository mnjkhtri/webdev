from operator import is_
import os
import dash
from dash import html, dcc, Output, Input, State
from src.menu import MENU_ITEMS

from dotenv import load_dotenv
load_dotenv()

# Environment variables:
DEFAULT_TITLE = "Home"
PROJECT_NAME = os.getenv("PROJECT_NAME", "Project")
PROJECT_SUBTITLE = os.getenv("PROJECT_SUBTITLE", "Subtitle")
PROJECT_SECTION_TITLE = os.getenv("PROJECT_SECTION_TITLE", "Section title")

# States:
PAGE_ID='content-page'
TOPBAR_ID = 'topbar'
TOPBAR_TITLE_ID = "topbar-title"
TOPBAR_SIDEBAR_TOGGLE_ID = 'topbar-sidebar-toggle'
TOPBAR_THEME_TOGGLE_ID = 'topbar-theme-toggle'
SIDEBAR_ID = 'sidebar'

THEME_STORE_ID = 'theme-store' # DONT CHANGE. For someone outside.


def create_sidebar(is_open=True):
    """
    Creates the sidebar component with user info and navigation links.
    
    Args:
        is_open (bool): If True, the sidebar is visible, otherwise it's hidden.
    
    Returns:
        dash.html.Div: The sidebar component
    """

    # Base style for the sidebar when it's visible
    BASE_SIDEBAR_STYLE = {
        "position": "fixed",
        "top": 0,
        "left": 0,
        "bottom": 0,
        "width": "var(--sidebar-width)",
        "padding": "1.5rem",
        "backgroundColor": "var(--sidebar-bg)",
        "borderRight": f"1px solid var(--border)",
        "overflowY": "auto",
        "fontFamily": "var(--font-sans)",
        "color": "var(--sidebar-text-color)",
        "display": "flex",
        "flexDirection": "column",
        "gap": "1.5rem",
        "zIndex": "90",
        "transition": "width 0.3s ease, padding 0.3s ease", # Smooth transition for width/padding
        "textAlign": "center", # Center align all text in the sidebar
    }

    # Style when sidebar is hidden
    HIDDEN_SIDEBAR_STYLE = {
        **BASE_SIDEBAR_STYLE, # Inherit base properties
        "width": "0px",
        "padding": "0px", # No padding when hidden
        "overflowX": "hidden", # Prevent content spill
        "borderRight": "none", # No border when hidden
    }

    HEADER_STYLE = {
        "display": "flex",
        "flexDirection": "column",
        "gap": "0.25rem",
        "alignItems": "center" # Center the header content horizontally
    }

    PROJECT_NAME_STYLE = {
        "fontSize": "1.125rem",
        "fontWeight": "600",
        "color": "var(--sidebar-text-color)",
        "whiteSpace": "nowrap", # Prevent text wrapping when collapsing
        "overflow": "hidden", # Hide text that overflows
    }

    PROJECT_SUBTITLE_STYLE = {
        "fontSize": "0.875rem",
        "color": "var(--muted-foreground)",
        "whiteSpace": "nowrap",
        "overflow": "hidden",
    }

    SECTION_TITLE_STYLE = {
        "fontSize": "0.875rem",
        "fontWeight": "600",
        "color": "var(--muted-foreground)",
        "textTransform": "uppercase",
        "letterSpacing": "0.05em",
        "paddingTop": "0.5rem",
        "paddingBottom": "0.5rem",
        "whiteSpace": "nowrap",
        "overflow": "hidden",
    }

    NAV_LINKS_STYLE = {
        "display": "flex",
        "flexDirection": "column",
        "gap": "0.5rem",
        "alignItems": "center" # Center navigation links horizontally
    }

    NAV_LINK_STYLE = {
        "display": "block",
        "padding": "0.5rem 1rem",
        "borderRadius": "0.5rem",
        "textDecoration": "none",
        "color": "var(--sidebar-text-color)",
        "fontSize": "0.95rem",
        "whiteSpace": "nowrap",
        "overflow": "hidden",
    }

    # Style for the inner content container that helps manage visibility during collapse
    INNER_CONTENT_STYLE = {
        "display": "flex", 
        "flexDirection": "column", 
        "gap": "1.5rem"
    }

    # Select style based on sidebar state
    current_style = BASE_SIDEBAR_STYLE if is_open else HIDDEN_SIDEBAR_STYLE
    
    # Update inner content display property based on sidebar state
    inner_content_style = {
        **INNER_CONTENT_STYLE,
        "display": "flex" if is_open else "none"
    }
    
    sidebar_content = html.Div(
        style=current_style,
        children=[
            # Inner container to prevent visual glitches during transition
            html.Div(
                style=inner_content_style,
                children=[
                    # User profile section
                    html.Div(
                        style=HEADER_STYLE,
                        children=[
                            html.H2(PROJECT_NAME, style=PROJECT_NAME_STYLE),
                            html.P(PROJECT_SUBTITLE, style=PROJECT_SUBTITLE_STYLE),
                        ]
                    ),
                    # Navigation section
                    html.Div(
                        children=[
                            html.H3(PROJECT_SECTION_TITLE, style=SECTION_TITLE_STYLE),
                            html.Nav(
                                style=NAV_LINKS_STYLE,
                                children=[
                                    dcc.Link(
                                        children=label, 
                                        href=href, 
                                        style=NAV_LINK_STYLE
                                    ) for href, label in MENU_ITEMS
                                ]
                            )
                        ]
                    )
                ]
            )
        ]
    )
    
    return sidebar_content
    
def create_topbar(sidebar_is_open=True, display_title="Home"):
    """
    Creates a responsive top navigation bar with a toggle button and title.
    
    Args:
        sidebar_is_open (bool): Determines the left position of the topbar
        display_title (str): The title to display in the topbar
    
    Returns:
        dash.html.Header: The topbar component
    """
    # Base styles with CSS variables preserved
    BASE_TOPBAR_STYLE = {
        "position": "fixed",
        "top": 0,
        # "left" will be set dynamically
        "right": 0,
        "height": "var(--topbar-height, 60px)",
        "backgroundColor": "var(--topbar-bg, #ffffff)",
        "borderBottom": f"1px solid var(--topbar-border-color, #e2e8f0)",
        "padding": f"0 var(--space-lg, 1.5rem)",
        "display": "flex",
        "alignItems": "center",
        "justifyContent": "space-between",
        "fontFamily": "var(--font-sans)",
        "color": "var(--foreground)",
        "zIndex": "100", # Ensure topbar is above sidebar and content
        "transition": "left 0.3s ease", # Smooth transition for left offset
    }

    # Update left position based on sidebar state
    CURRENT_TOPBAR_STYLE = {**BASE_TOPBAR_STYLE}
    if sidebar_is_open:
        CURRENT_TOPBAR_STYLE["left"] = "var(--sidebar-width)"
    else:
        CURRENT_TOPBAR_STYLE["left"] = "0px"
    
    # Title styling
    TOPBAR_TITLE_STYLE = {
        "fontSize": "1.25rem",
        "fontWeight": "600",
        "fontFamily": "var(--font-mono)"
    }
    
    # Left content container (toggle button + title)
    TOPBAR_LEFT_CONTENT_STYLE = {
        "display": "flex",
        "alignItems": "center",
        "gap": "1rem", # Space between button and title
    }
    
    # Right content container
    TOPBAR_RIGHT_CONTENT_STYLE = {
        "display": "flex",
        "alignItems": "center",
        "gap": "1rem"
    }
    
    # Toggle button styling
    TOGGLE_BUTTON_STYLE = {
        "background": "none",
        "border": "none",
        "fontSize": "1.5rem", # Hamburger icon size
        "padding": "0.25rem", # Smaller padding for a compact button
        "cursor": "pointer",
        "color": "var(--foreground)",
        "display": "flex", # To center the icon if it's text
        "alignItems": "center",
        "justifyContent": "center",
        "marginRight": "0.5rem" # Space after button
    }
    
    # Build the topbar component
    return html.Header(
        style=CURRENT_TOPBAR_STYLE,
        children=[
            # Left side: Toggle Button and Title
            html.Div(
                style=TOPBAR_LEFT_CONTENT_STYLE,
                children=[
                    html.Button(
                        "☰",
                        id=TOPBAR_SIDEBAR_TOGGLE_ID,
                        n_clicks=0,
                        style=TOGGLE_BUTTON_STYLE,
                    ),
                    html.Div(
                        display_title,
                        id=TOPBAR_TITLE_ID,
                        style=TOPBAR_TITLE_STYLE
                    )
                ]
            ),

            html.Div(
                style=TOPBAR_RIGHT_CONTENT_STYLE,
                children=[
                    html.Button(
                        "🔅",
                        id=TOPBAR_THEME_TOGGLE_ID,
                        n_clicks=0,
                        style=TOGGLE_BUTTON_STYLE,
                    ),
                ],
            )
        ]
    )

def display_title(path: str | None, default: str = DEFAULT_TITLE) -> str:
    """Return a human-friendly title for *path*."""
    mapping = (
        {
            (href if href.startswith("/") else f"/{href}"): label.title()
            for href, label in MENU_ITEMS
        }
        if MENU_ITEMS
        else {}
    )

    if not path:
        path = "/"
    elif not path.startswith("/"):
        path = f"/{path}"

    if path in mapping:
        return mapping[path]

    return mapping.get("/home", default.title())

def create_main_layout():
    
    is_open = True

    STYLE_MAIN = {
        "marginLeft": "var(--sidebar-width)" if is_open else "0px",

        # The rest of the styles remain the same
        "marginTop": "var(--topbar-height, 50px)",
        "padding": "1.5rem",
        "fontFamily": "var(--font-sans, sans-serif)",
        "backgroundColor": "var(--background, #ffffff)",
        "color": "var(--foreground, #0f172a)",
        "minHeight": "calc(100vh - var(--topbar-height, 50px))",
        "transition": "margin-left 0.3s ease",
    }
    
    return html.Div(
        [
            dcc.Store(id=THEME_STORE_ID, data="light"),
            html.Div(id=SIDEBAR_ID, children=create_sidebar(is_open=is_open)),
            html.Div(id=TOPBAR_ID, children=create_topbar(sidebar_is_open=is_open, display_title="")),
            html.Main(
                id=PAGE_ID,
                children=dash.page_container,
                style=STYLE_MAIN,
            ),
        ]
    )

def register_layout_callbacks(app):

    app.clientside_callback(
        # language=JavaScript
        """
        function handleThemeClick(nClicks) {

            // guard: no_update until the first click actually happens
            if (!nClicks) {
                // On initial load or if n_clicks is somehow reset/falsy,
                // do not update the state.
                return window.dash_clientside.no_update;
            }

            const htmlEl     = document.documentElement;
            const darkActive = htmlEl.classList.toggle("dark"); // Flip the class
            const currentTheme = darkActive ? "dark" : "light"; // Determine theme string

            try {
                localStorage.setItem("theme-preference", currentTheme);
            } catch(_) {}

            // Return the current theme string directly for the dcc.Store
            return currentTheme;
        }
        """,
        Output(THEME_STORE_ID, "data"),
        Input(TOPBAR_THEME_TOGGLE_ID, "n_clicks"),
        prevent_initial_call=True,
    )
