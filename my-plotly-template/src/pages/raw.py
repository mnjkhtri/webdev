import dash
from dash import Input, Output, html
from src.components.table import Table
from src.components.graph import Graph
import pandas as pd

dash.register_page(__name__, path="/raw", name="raw")
app = dash.get_app()

df = pd.read_csv('https://raw.githubusercontent.com/sivabalanb/Data-Analysis-with-Pandas-and-Python/master/fortune1000.csv')

#  0   Rank       1000 non-null   int64
#  1   Company    1000 non-null   object
#  2   Sector     1000 non-null   object
#  3   Industry   1000 non-null   object
#  4   Location   1000 non-null   object
#  5   Revenue    1000 non-null   int64 
#  6   Profits    1000 non-null   int64 
#  7   Employees  1000 non-null   int64 

layout = html.Div([
    Table(df, page_size=25),
    html.Div(id='graph-dashboard', style={
        'display': 'flex',
        'flexDirection': 'row',
        'width': '100%',
        'flexWrap': 'wrap',
        'height': '1000px',
        'marginBottom': '10px'
    })
])

@app.callback(Output('graph-dashboard', 'children'), Input('theme-store', 'data'), prevent_initial_call=False)
def update_graph(theme):

    df_top50_rank = df.nsmallest(50, 'Rank').copy()
    line_chart_profits = Graph(
        df=df_top50_rank,
        graph_type='line',
        x_column='Rank',
        y_columns='Profits',
        title='Profits by Rank (Top 50 Companies)',
        theme=theme
    )

    df_top10_revenue = df.nlargest(10, 'Profits')
    bar_chart_top_10_revenue = Graph(
        df=df_top10_revenue,
        graph_type='bar',
        x_column='Company',
        y_columns='Revenue',
        title='Top 10 Company Revenues',
        theme=theme
    )

    df_scatter_sample = df.sample(n=min(250, len(df)), random_state=42)
    scatter_plot_revenue_profit = Graph(
        df=df_scatter_sample,
        graph_type='scatter',
        x_column='Revenue',
        y_columns='Profits',
        group_by_column='Sector', 
        title='Revenue vs. Profits by Sector',
        theme=theme,
    )

    histogram_profits = Graph(
        df=df,
        graph_type='histogram',
        x_column='Profits',
        title='Profit Distribution',
        theme=theme,
        nbins=50
    )

    return [
        html.Div(
            line_chart_profits,
            style={'width': '50%', 'height': '50%', 'boxSizing': 'border-box'}
        ),
        html.Div(
            bar_chart_top_10_revenue,
            style={'width': '50%', 'height': '50%', 'boxSizing': 'border-box'}
        ),
        html.Div(
            scatter_plot_revenue_profit,
            style={'width': '50%', 'height': '50%', 'boxSizing': 'border-box'}
        ),
        html.Div(
            histogram_profits,
            style={'width': '50%', 'height': '50%', 'boxSizing': 'border-box'}
        )
    ]
