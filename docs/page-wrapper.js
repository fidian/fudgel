import { component, css, html } from './fudgel.min.js';

component(
    'page-wrapper',
    {
        style: css`
            :scope {
                display: flex;
                width: 100%;
                max-width: 100%;
            }

            .sidebar {
                width: 25%;
                flex-shrink: 0;
            }

            .content {
                width: 100%;
                flex-shrink: 1;
                overflow: hidden;
            }

            .limitWidth {
                width: 100%;
                max-width: 1024px;
            }

            @media (max-width: 768px) {
                .sidebar {
                    width: 20%;
                    min-width: 135px;
                }
            }
        `,
        template: html`
            <div class="sidebar">
                <sidebar-menu></sidebar-menu>
            </div>
            <div class="content">
                <div class="limitWidth">
                    <slot></slot>
                </div>
            </div>
        `,
        useShadow: true
    },
    class {}
);
