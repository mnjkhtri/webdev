from dash import html, dcc

def Button(text, variant="default", size="sm", **props):
    variants = {
        "default": "inline-flex items-center justify-center rounded-md bg-primary text-white "
                   "hover:bg-primary/90 focus:outline-none focus:ring focus:ring-primary/30 "
                   "disabled:cursor-not-allowed disabled:opacity-50",
        "outline": "inline-flex items-center justify-center rounded-md border border-input "
                   "bg-background text-sm hover:bg-muted hover:text-foreground "
                   "focus:outline-none focus:ring focus:ring-primary/30",
        "ghost":   "inline-flex items-center justify-center rounded-md hover:bg-muted/70",
    }
    sizes = {
        "xs": "h-7 px-2 text-xs",
        "sm": "h-8 px-3 text-sm",
        "md": "h-10 px-4 text-sm",
        "lg": "h-11 px-6 text-base",
    }
    cls = f"{variants[variant]} {sizes[size]}"
    return html.Button(text, className=cls, **props)
