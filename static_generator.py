#!/usr/bin/env python3
"""
Static site generator for uniConnect
Converts Flask templates to static HTML for GitHub Pages
"""

import json
import os
from datetime import datetime
from jinja2 import Environment, FileSystemLoader

def load_events():
    """Load events from JSON file"""
    with open('static/u_of_t_events.json', 'r') as f:
        return json.load(f)

def convert_timestamps(events):
    """Convert UNIX timestamps to readable dates"""
    for event in events:
        if isinstance(event['sorting_info'][0], int) and event['sorting_info'][0] > 0:
            date = datetime.fromtimestamp(event['sorting_info'][0]).strftime('%b %d, %Y')
            event['sorting_info'] = (date, event['sorting_info'][1], event['sorting_info'][2])
        
        if event['posted_time'] and event['posted_time'] != 0:
            event['posted_time'] = datetime.fromtimestamp(event['posted_time']).strftime('%Y-%m-%d %H:%M:%S')
    
    return events

def generate_static_site():
    """Generate static HTML files"""
    
    # Create output directory
    os.makedirs('docs', exist_ok=True)
    os.makedirs('docs/static', exist_ok=True)
    
    # Copy static files
    import shutil
    if os.path.exists('static'):
        shutil.copytree('static', 'docs/static', dirs_exist_ok=True)
    
    # Setup Jinja2 environment
    env = Environment(loader=FileSystemLoader('templates'))
    
    # Load and process events
    events = load_events()
    events = convert_timestamps(events)
    
    # Generate main index page
    template = env.get_template('index.html')
    
    # Create a mock form object for the template
    class MockForm:
        def hidden_tag(self): return ""
        def __getattr__(self, name):
            class MockField:
                def label(self): return f'<label for="{name}">{name.replace("_", " ").title()}:</label>'
                def __call__(self, **kwargs): return f'<input type="text" name="{name}" id="{name}">'
            return MockField()
    
    # Load selected filters
    try:
        with open('static/user_selected_filters.json', 'r') as f:
            selected_filters = json.load(f)
    except:
        selected_filters = {"categories": [], "days": [], "colleges": []}
    
    html_content = template.render(
        events_list=events,
        form=MockForm(),
        selected_filters=selected_filters,
        college=None,
        major=None,
        preferred_categories=None
    )
    
    # Write index.html
    with open('docs/index.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    # Generate individual event pages
    event_template = env.get_template('event.html')
    
    for event in events:
        # Create safe filename
        safe_name = "".join(c for c in event['name'] if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_name = safe_name.replace(' ', '-')
        
        event_html = event_template.render(
            individual_event=event,
            form=MockForm(),
            selected_filters=selected_filters
        )
        
        # Write event page
        with open(f'docs/{safe_name}.html', 'w', encoding='utf-8') as f:
            f.write(event_html)
    
    print("Static site generated in 'docs' directory!")
    print(f"Generated {len(events)} event pages")

if __name__ == "__main__":
    generate_static_site()
