# THE TOAST HAS TO BE PART OF EACH PAGE SEPARATELY NOT THE LAYOUT ITSELF.
# THE CALLBACK CIRCLES

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

import datetime
from dash import html, dcc, Input, Output

TOAST_STORE_ID = 'toast-store'

# Singleton class maybe?
class Toast:

    @staticmethod
    def layout():
        TOAST_CONTAINER_STYLE = {
            "position": "fixed",
            "top": "calc(var(--topbar-height, 40px) + 1rem)", # Position below the topbar
            "right": "1.5rem",
            "zIndex": "1050",
            "width": "320px",
            "maxWidth": "calc(100vw - 3rem)",
            # Individual toasts will be added and styled by the clientside callback
        }

        return html.Div([
            dcc.Store(id=TOAST_STORE_ID, data=None),
            html.Div(id='toast-container', style=TOAST_CONTAINER_STYLE)
        ])

    @staticmethod    
    def generate_a_toast(message, delay = 5000):
        return {
            "message": message,
            "delay": delay,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
    
    def get_store_id():
        return TOAST_STORE_ID

    @staticmethod
    def register_callbacks(app):
            
        app.clientside_callback(
            """
            // language=JavaScript
            function(toastData) {
                // Early return if toast data is invalid
                if (!toastData || !toastData.message) {
                    return null;
                }

                // Get or create container
                let container = document.getElementById('toast-container');
                if (!container) {
                    console.warn('Toast container not found, creating one');
                    container = document.createElement('div');
                    container.id = 'toast-container';
                    container.style.position = 'fixed';
                    container.style.bottom = '1rem';
                    container.style.right = '1rem';
                    container.style.zIndex = '9999';
                    container.style.maxWidth = '24rem';
                    container.style.width = '100%';
                    document.body.appendChild(container);
                }

                // Toast configuration with defaults
                const config = {
                    message: toastData.message,
                    delay: typeof toastData.delay === 'number' ? toastData.delay : 5000,
                    id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                };

                // Create toast element
                const toast = createToastElement(config);
                
                // Add to container (newest on top)
                if (container.firstChild) {
                    container.insertBefore(toast.element, container.firstChild);
                } else {
                    container.appendChild(toast.element);
                }

                // Animate in and set auto-dismiss
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => { 
                        toast.element.style.opacity = '1';
                        toast.element.style.transform = 'translateX(0)';
                    });
                });

                // Set auto-dismiss if delay is positive
                if (config.delay > 0) {
                    toast.autoDismissTimeoutId = setTimeout(() => {
                        dismissToast(toast);
                    }, config.delay);
                }

                return null; // Clear store to allow future triggering

                /**
                * Creates a styled toast element
                * @param {Object} config - Toast configuration
                * @returns {Object} Toast object with element and properties
                */
                function createToastElement(config) {
                    // Create toast element
                    const toastDiv = document.createElement('div');
                    toastDiv.id = config.id;
                    
                    // Core styling
                    toastDiv.style.opacity = '0';
                    toastDiv.style.transform = 'translateX(100%)';
                    toastDiv.style.transition = 'opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
                    toastDiv.style.width = '100%';
                    toastDiv.style.boxSizing = 'border-box';
                    toastDiv.style.display = 'flex';
                    toastDiv.style.justifyContent = 'space-between';
                    toastDiv.style.alignItems = 'center';
                    toastDiv.style.padding = '0.5rem 0.75rem';
                    toastDiv.style.marginBottom = '0.5rem';
                    toastDiv.style.borderRadius = 'var(--radius, 0.375rem)';
                    toastDiv.style.boxShadow = 'var(--shadow, 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06))';
                    toastDiv.style.backgroundColor = 'var(--muted, #6B7280)';
                    toastDiv.style.color = 'var(--muted-foreground, white)';
                    toastDiv.style.borderLeft = 'solid 4px var(--accent, #0EA5E9)';
                        
                    // A11y attributes
                    toastDiv.setAttribute('role', 'alert');
                    toastDiv.setAttribute('aria-live', 'polite');
                    
                    // Create and style message element
                    const messageSpan = document.createElement('span');
                    messageSpan.textContent = config.message;
                    messageSpan.style.flexGrow = '1';
                    messageSpan.style.marginRight = '1rem';
                    
                    // Create dismiss button
                    const closeButton = createCloseButton();
                    
                    // Assemble toast
                    toastDiv.appendChild(messageSpan);
                    toastDiv.appendChild(closeButton);

                    // Return toast object
                    return {
                        element: toastDiv,
                        autoDismissTimeoutId: null,
                        config: config
                    };
                }

                /**
                * Creates a close button for the toast
                * @returns {HTMLButtonElement} Styled close button
                */
                function createCloseButton() {
                    const closeButton = document.createElement('button');
                    closeButton.innerHTML = '&times;';
                    closeButton.style.background = 'transparent';
                    closeButton.style.border = 'none';
                    closeButton.style.color = 'inherit';
                    closeButton.style.padding = '0.25rem 0.5rem';
                    closeButton.style.cursor = 'pointer';
                    closeButton.style.fontSize = '1.5rem';
                    closeButton.style.lineHeight = '1';
                    closeButton.style.display = 'flex';
                    closeButton.style.alignItems = 'center';
                    closeButton.style.justifyContent = 'center';
                    
                    // A11y attributes
                    closeButton.setAttribute('aria-label', 'Close notification');
                    closeButton.setAttribute('type', 'button');
                    
                    // Add click handler
                    closeButton.onclick = function(event) {
                        // Get parent toast element
                        const toastElement = event.currentTarget.closest('[role="alert"]');
                        if (toastElement) {
                            const toastId = toastElement.id;
                            // Find toast in container
                            const toast = Array.from(container.children).find(el => el.id === toastId);
                            if (toast) {
                                dismissToast({ element: toast });
                            }
                        }
                    };
                    
                    return closeButton;
                }

                /**
                * Dismisses a toast with animation
                * @param {Object} toast - The toast object to dismiss
                */
                function dismissToast(toast) {
                    // Clear any auto-dismiss timeout
                    if (toast.autoDismissTimeoutId) {
                        clearTimeout(toast.autoDismissTimeoutId);
                    }
                    
                    // Animate out
                    toast.element.style.opacity = '0';
                    toast.element.style.transform = 'translateX(100%)';
                    
                    // Remove after animation completes
                    setTimeout(() => {
                        if (toast.element.parentNode === container) {
                            container.removeChild(toast.element);
                        }
                        
                        // If this was the last toast, check if we should remove the container
                        if (container.children.length === 0 && container.parentNode) {
                            // Only remove if we created it dynamically
                            if (!document.getElementById('toast-container')) {
                                document.body.removeChild(container);
                            }
                        }
                    }, 400); // Match transition duration
                }
            }
            """,
            Output(TOAST_STORE_ID, 'data', allow_duplicate=True),
            Input(TOAST_STORE_ID, 'data'),
            prevent_initial_call=True
        )